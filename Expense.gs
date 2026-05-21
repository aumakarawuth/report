// ============================================================
// [SLIP] handleSlipImage — รับรูปสลิป วิเคราะห์ด้วย Claude
// ============================================================

function handleSlipImage(event, replyToken, userId, staffName) {
  var messageId = event.message.id;
  sheetLog('=== handleSlipImage start === msgId=' + messageId);

  try {
    var imgResponse = UrlFetchApp.fetch(
      'https://api-data.line.me/v2/bot/message/' + messageId + '/content',
      {
        headers: { 'Authorization': 'Bearer ' + LINE_TOKEN_STAFF },
        muteHttpExceptions: true
      }
    );

    sheetLog('LINE image fetch status=' + imgResponse.getResponseCode());

    if (imgResponse.getResponseCode() !== 200) {
      sheetLog('ERROR: ดึงรูปไม่ได้');
      return replyText(replyToken, '❌ ดึงรูปไม่ได้ค่ะ ลองส่งใหม่อีกครั้ง', false);
    }

    var imgBlob   = imgResponse.getBlob();
    var imgBase64 = Utilities.base64Encode(imgBlob.getBytes());
    var mimeType  = imgBlob.getContentType() || 'image/jpeg';
    sheetLog('mimeType=' + mimeType + ' base64 length=' + imgBase64.length);

    var slipData = analyzeSlipWithGemini(imgBase64, mimeType);
    sheetLog('slipData=' + JSON.stringify(slipData));

    if (!slipData || slipData.error) {
      sheetLog('ERROR: slipData error=' + (slipData ? slipData.error : 'null'));
      return replyText(replyToken,
        '⚠️ อ่านสลิปไม่ได้ค่ะ\nลองพิมพ์เองได้เลย:\n"จ่าย [ชื่อ] [ยอด]"', false);
    }

    if (!slipData.amount || slipData.amount <= 0) {
      sheetLog('ERROR: amount=0 หรือไม่พบ');
      return replyText(replyToken,
        '⚠️ ไม่พบยอดเงินในสลิปค่ะ\nลองพิมพ์เองได้เลย:\n"จ่าย [ชื่อ] [ยอด]"', false);
    }

    saveExpenseFromSlip(slipData, userId, messageId);
    sheetLog('saveExpenseFromSlip สำเร็จ');

    replyFlexSlipSuccess(replyToken, slipData, staffName);
    sheetLog('replyFlexSlipSuccess สำเร็จ');

  } catch (err) {
    sheetLog('CATCH ERROR: ' + err.message + ' | stack: ' + err.stack);
    return replyText(replyToken, '❌ เกิดข้อผิดพลาดค่ะ: ' + err.message, false);
  }
}

// ============================================================
// analyzeSlipWithClaude — ส่งรูปให้ Claude อ่านสลิป
// คืนค่า: { amount, description, merchant, date, rawText, error }
// ============================================================
var GEMINI_API_KEY = 'AIzaSyAPIzQy7nfd6Hr72B7D7ubJR6QJPlNnrwE';

function analyzeSlipWithGemini(base64Image, mimeType) {
  sheetLog('[Gemini] เริ่มส่งรูป mimeType=' + mimeType);
  var prompt = [
    'Analyze this payment slip or receipt image.',
    'Respond ONLY with a JSON object. No markdown, no extra text.',
    '{',
    '  "amount": number,',
    '  "description": "Short Thai description (max 30 chars)",',
    '  "merchant": "Merchant name in Thai or English",',
    '  "date": "dd/MM/yyyy",',
    '  "payment_method": "เงินสด/โอน/บัตรเครดิต/พร้อมเพย์",',
    '  "confidence": "high/medium/low"',
    '}',
    'If not a slip, return: {"error":"not_a_slip"}'
  ].join('\n');

  var payload = {
    contents: [{
      parts: [
        { inline_data: { mime_type: mimeType, data: base64Image } },
        { text: prompt }
      ]
    }],
    generationConfig: {
      maxOutputTokens: 2000,
      temperature: 0
      // ✅ ไม่ใช้ responseMimeType — บาง model ไม่รองรับ
    }
  };

  // ✅ URL ถูกต้อง ไม่มี [] ()
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;

  var response = UrlFetchApp.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var body = response.getContentText();
  sheetLog('[Gemini] status=' + code);
  sheetLog('[Gemini] body=' + body.substring(0, 500));

  if (code !== 200) return { error: 'api_error', details: body };

  try {
    var result  = JSON.parse(body);
    var rawText = result.candidates[0].content.parts[0].text.trim();

    // ✅ ลบ ```json ... ``` ถ้า Gemini ใส่มา
    var cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    Logger.log('[Gemini] cleaned=' + cleaned);

    var parsed = JSON.parse(cleaned);
    if (parsed.error) return { error: parsed.error };

    return {
      amount:        parseFloat(parsed.amount)    || 0,
      description:   parsed.description           || 'รายจ่ายจากสลิป',
      merchant:      parsed.merchant              || '-',
      date:          parsed.date                  || '-',
      paymentMethod: parsed.payment_method        || '-',
      confidence:    parsed.confidence            || 'low',
      rawText:       cleaned
    };

  } catch (e) {
    Logger.log('[Gemini parse] ERROR: ' + e.message);
    return { error: 'parse_error' };
  }
}

// ============================================================
// updateLastExpenseImageId — บันทึก messageId ลงแถวล่าสุดของรายจ่าย
// ============================================================
function updateLastExpenseImageId(messageId) {
  try {
    var sheet    = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('รายจ่าย');
    if (!sheet) return;
    var lastRow  = sheet.getLastRow();
    if (lastRow <= 1) return;
    // col I = link รูป (index 9) → เก็บ LINE messageId แทน
    sheet.getRange(lastRow, 9).setValue('line_msg:' + messageId);
  } catch (e) {
    Logger.log('[updateLastExpenseImageId] ' + e.message);
  }
}



// บันทึกจากสลิป — ใส่ข้อมูลครบกว่า saveExpenseFromLine
function saveExpenseFromSlip(slipData, userId, messageId) {
  var sheet = getOrCreateExpenseSheet();
  var now   = new Date();
  var cat   = guessExpenseCategory(slipData.description);

  sheet.appendRow([
    Utilities.formatDate(now, 'Asia/Bangkok', 'dd/MM/yyyy HH:mm'), // [A] วันที่บันทึก
    Utilities.formatDate(now, 'Asia/Bangkok', 'dd/MM/yyyy'),        // [B] วันที่
    cat,                        // [C] หมวดหมู่
    slipData.description,       // [D] รายละเอียด
    slipData.amount,            // [E] ยอดเงิน
    'THB',                      // [F] สกุลเงิน
    slipData.merchant || '-',   // [G] ชื่อร้าน (จาก Gemini)
    'slip_auto',                // [H] วิธีบันทึก ← แยกจาก manual
    'line_msg:' + messageId,    // [I] LINE messageId
    userId                      // [J] LINE UserID
  ]);

  Logger.log('[saveExpenseFromSlip] saved: ' 
    + slipData.description 
    + ' ฿' + slipData.amount 
    + ' merchant=' + slipData.merchant
    + ' confidence=' + slipData.confidence);
}



function sheetLog(msg) {
  try {
    var sheet = getOrCreateSheet('Debug_Log', ['เวลา', 'ข้อความ']);
    sheet.appendRow([new Date(), msg]);
  } catch(e) {}
}




// ============================================================
// replyFlexSlipSuccess — Flex ตอบกลับเมื่ออ่านสลิปสำเร็จ
// ============================================================
function replyFlexSlipSuccess(replyToken, slipData, staffName) {
  var now        = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
  var cat        = guessExpenseCategory(slipData.description);
  var confColor  = slipData.confidence === 'high'   ? '#1DB446'
                 : slipData.confidence === 'medium'  ? '#FF9800'
                 : '#E8457A';
  var confLabel  = slipData.confidence === 'high'   ? '✅ มั่นใจสูง'
                 : slipData.confidence === 'medium'  ? '⚠️ ตรวจสอบด้วย'
                 : '❗ ไม่แน่ใจ';

  // แถวข้อมูลเพิ่มเติม
  var extraRows = [];
  if (slipData.merchant && slipData.merchant !== '-') {
    extraRows.push({
      type: 'box', layout: 'horizontal',
      contents: [
        { type: 'text', text: '🏪 ร้าน/ผู้รับ', size: 'sm', color: '#888888', flex: 2 },
        { type: 'text', text: slipData.merchant, size: 'sm', weight: 'bold', align: 'end', flex: 3, wrap: true }
      ]
    });
  }
  if (slipData.date && slipData.date !== '-') {
    extraRows.push({
      type: 'box', layout: 'horizontal',
      contents: [
        { type: 'text', text: '📅 วันที่ในสลิป', size: 'sm', color: '#888888', flex: 2 },
        { type: 'text', text: slipData.date, size: 'sm', weight: 'bold', align: 'end', flex: 3 }
      ]
    });
  }
  if (slipData.paymentMethod && slipData.paymentMethod !== '-') {
    extraRows.push({
      type: 'box', layout: 'horizontal',
      contents: [
        { type: 'text', text: '💳 ชำระด้วย', size: 'sm', color: '#888888', flex: 2 },
        { type: 'text', text: slipData.paymentMethod, size: 'sm', weight: 'bold', align: 'end', flex: 3 }
      ]
    });
  }

  var flex = {
    type: 'bubble', size: 'mega',
    header: {
      type: 'box', layout: 'vertical',
      backgroundColor: '#5B4FCF', paddingAll: '20px',
      contents: [
        { type: 'text', text: '📸 อ่านสลิปสำเร็จ!', color: '#ffffff', weight: 'bold', size: 'lg' },
        { type: 'text', text: 'บันทึกรายจ่ายอัตโนมัติ · ' + now, color: '#C8C4F0', size: 'xs', margin: 'xs' }
      ]
    },
    body: {
      type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
      contents: [
        // ยอดเงิน + ชื่อรายการ
        {
          type: 'box', layout: 'horizontal',
          contents: [
            { type: 'text', text: slipData.description, weight: 'bold', size: 'xl',
              flex: 1, gravity: 'center', wrap: true },
            { type: 'text', text: '฿' + slipData.amount.toLocaleString(),
              size: 'xxl', weight: 'bold', color: '#5B4FCF', align: 'end' }
          ]
        },
        { type: 'separator', margin: 'md' },

        // หมวดหมู่
        {
          type: 'box', layout: 'horizontal', margin: 'md',
          contents: [
            { type: 'text', text: '📂 หมวดหมู่', size: 'sm', color: '#888888', flex: 2 },
            { type: 'text', text: cat, size: 'sm', weight: 'bold', align: 'end', flex: 3 }
          ]
        },

        // ข้อมูลจากสลิป
      ].concat(extraRows).concat([

        { type: 'separator', margin: 'md' },

        // ความมั่นใจ AI
        {
          type: 'box', layout: 'horizontal', margin: 'md',
          contents: [
            { type: 'text', text: '🤖 AI อ่านได้', size: 'sm', color: '#888888', flex: 2 },
            { type: 'text', text: confLabel, size: 'sm', weight: 'bold',
              color: confColor, align: 'end', flex: 3 }
          ]
        },

        // ปุ่มแก้ไขถ้า AI ไม่แน่ใจ
        slipData.confidence !== 'high' ? {
          type: 'box', layout: 'horizontal', spacing: 'sm', margin: 'lg',
          contents: [
            {
              type: 'button', style: 'secondary', height: 'sm', flex: 1,
              action: {
                type: 'message',
                label: '✏️ แก้ไขยอด',
                text: 'แก้ไขสลิป ' + slipData.amount
              }
            },
            {
              type: 'button', style: 'secondary', height: 'sm', flex: 1,
              action: { type: 'message', label: '🗑️ ลบรายการ', text: 'ลบรายจ่ายล่าสุด' }
            }
          ]
        } : {
          type: 'text', text: 'พิมพ์ "รายจ่าย" เพื่อดูสรุปค่ะ',
          size: 'xs', color: '#aaaaaa', align: 'center', margin: 'md'
        }
      ])
    }
  };

  callLineAPI('reply', {
    replyToken: replyToken,
    messages: [{ type: 'flex', altText: 'บันทึกรายจ่ายจากสลิป ฿' + slipData.amount.toLocaleString(), contents: flex }]
  }, false);
}