var SHEET_EXPENSE = 'รายจ่าย'; // ชื่อ Sheet (ใช้ร่วมกับทั้งโปรเจค)


function saveExpenseFromLine(name, amount, userId) {
  var sheet = getOrCreateExpenseSheet();
  var now   = new Date();
  var cat   = guessExpenseCategory(name);

  sheet.appendRow([
    Utilities.formatDate(now, 'Asia/Bangkok', 'dd/MM/yyyy HH:mm'), // [A] วันที่บันทึก
    Utilities.formatDate(now, 'Asia/Bangkok', 'dd/MM/yyyy'),        // [B] วันที่
    cat,       // [C] หมวดหมู่ (เดาอัตโนมัติ)
    name,      // [D] รายละเอียด (ชื่อที่พิมพ์มา)
    amount,    // [E] ยอดเงิน
    'THB',     // [F] สกุลเงิน
    '-',       // [G] ชื่อร้าน
    'manual',  // [H] วิธีบันทึก
    '-',       // [I] link รูป
    userId     // [J] LINE UserID
  ]);

  Logger.log('[ExpenseBot] saved: ' + name + ' ฿' + amount + ' cat=' + cat);
}


// ============================================================
// [2] เดาหมวดหมู่จากชื่อรายจ่าย
// ============================================================

function guessExpenseCategory(name) {
  var n = name.toLowerCase()
              .replace(/ค่า/g, '')   // ตัด "ค่า" ออกก่อนเช็ค
              .trim();

  // อุปกรณ์ร้าน
  if (n.match(/สครับ|ครีม|เจล|อะซีโตน|ฟอยล์|สีเล็บ|สี|แปรง|file|ไฟล์|เล็บปลอม|tip/))
    return 'ค่าอุปกรณ์';

  // ขนตา
  if (n.match(/ขนตา|ต่อตา|กาว|lash|shopee/))
    return 'ค่าอุปกรณ์';

  // สาธารณูปโภค
  if (n.match(/ไฟ|น้ำ|electric|water/))
    return 'ค่าสาธารณูปโภค';

  // เน็ต / โทรศัพท์
  if (n.match(/เน็ต|internet|wifi|โทรศัพท์|phone|dtac|ais|true/))
    return 'ค่าเน็ต/โทรศัพท์';

  // ค่าเช่า
  if (n.match(/เช่า|rent/))
    return 'ค่าเช่า';

  // เงินเดือน / ค่าแรง
  if (n.match(/เงินเดือน|ค่าแรง|salary|จ้าง/))
    return 'เงินเดือน';

  // EDC / รูดบัตร
  if (n.match(/edc|เครื่องรูด|บัตรเครดิต|pos/))
    return 'ค่าเครื่อง EDC';

  // ทำความสะอาด
  if (n.match(/ทำความสะอาด|น้ำยา|ผ้า|ไม้กวาด|ถุงขยะ/))
    return 'ค่าทำความสะอาด';

  // อาหาร / น้ำดื่ม
  if (n.match(/อาหาร|ข้าว|น้ำดื่ม|ขนม|กาแฟ/))
    return 'ค่าอาหาร/เครื่องดื่ม';

  // การตลาด / โฆษณา
  if (n.match(/โฆษณา|ads|facebook|ig|instagram|ปริ้น|พิมพ์|สติ๊กเกอร์/))
    return 'ค่าการตลาด';

  return 'อื่นๆ';
}


// ============================================================
// [3] Flex Message — ตอบกลับเมื่อบันทึกสำเร็จ
// ============================================================

function replyFlexExpense(replyToken, name, amount) {
  var now = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
  var cat = guessExpenseCategory(name);

  var flex = {
    type: 'bubble', size: 'mega',
    header: {
      type: 'box', layout: 'vertical',
      backgroundColor: '#E8457A', paddingAll: '20px',
      contents: [
        { type: 'text', text: 'บันทึกรายจ่ายแล้ว 💸',
          color: '#ffffff', weight: 'bold', size: 'lg' },
        { type: 'text', text: now, color: '#FFD6E7', size: 'xs', margin: 'xs' }
      ]
    },
    body: {
      type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
      contents: [
        // ชื่อ + ยอด
        {
          type: 'box', layout: 'horizontal',
          contents: [
            { type: 'text', text: name, weight: 'bold', size: 'xl',
              flex: 1, gravity: 'center', wrap: true },
            { type: 'text', text: '฿' + amount.toLocaleString(),
              size: 'xxl', weight: 'bold', color: '#E8457A', align: 'end' }
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
        // hint
        {
          type: 'box', layout: 'horizontal',
          contents: [
            { type: 'text', text: '📊 ดูรายจ่าย', size: 'sm', color: '#888888', flex: 2 },
            { type: 'text', text: 'พิมพ์ "รายจ่าย"', size: 'sm',
              color: '#4A90D9', align: 'end', flex: 3 }
          ]
        }
      ]
    }
  };

  callLineAPI('reply', {
    replyToken: replyToken,
    messages: [{
      type: 'flex',
      altText: 'บันทึกรายจ่าย: ' + name + ' ฿' + amount.toLocaleString(),
      contents: flex
    }]
  }, false);
}


// ============================================================
// [4] สรุปรายจ่าย — ตอบกลับ LINE
// ============================================================

function replyExpenseSummaryLine(replyToken, period) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_EXPENSE);
  if (!sheet) return replyText(replyToken, '📭 ยังไม่มีรายจ่ายค่ะ', false);

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return replyText(replyToken, '📭 ยังไม่มีรายจ่ายค่ะ', false);

  var now = new Date();
  var start, label;

  if (period === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    label = 'วันนี้';
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    var thM = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
               'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    label = 'เดือน' + thM[now.getMonth()];
  }

  var byCat = {}, total = 0, count = 0;
  data.slice(1).forEach(function(row) {
      // ลอง parse จากทั้ง col A และ col B
      var d = parseExpenseDate(row[0]);
      if (!d || isNaN(d)) d = parseExpenseDate(row[1]);
      var amt = Number(row[4]) || 0;
      if (!d || isNaN(d) || d < start || d > now || amt <= 0) return;
    byCat[cat] = (byCat[cat] || 0) + amt;
    total += amt;
    count++;
  });

  if (!count) return replyText(replyToken, '📭 ไม่มีรายจ่าย' + label + 'ค่ะ', false);

  var lines = ['💸 รายจ่าย' + label + ' (' + count + ' รายการ)', ''];
  Object.keys(byCat)
    .sort(function(a, b) { return byCat[b] - byCat[a]; })
    .forEach(function(c) {
      lines.push('• ' + c + ':  ฿' + byCat[c].toLocaleString());
    });
  lines.push('', '─────────────────');
  lines.push('💰 รวม:  ฿' + total.toLocaleString());

  return replyText(replyToken, lines.join('\n'), false);
}


// ============================================================
// [5] ดึงรายจ่ายส่งให้ Dashboard (index.html เรียกผ่าน GAS)
// ============================================================
//
//  index.html เรียก:
//  google.script.run.withSuccessHandler(fn).getExpenseData('month')

// function getExpenseData(periodKey) {
//   try {
//     var ss    = SpreadsheetApp.getActiveSpreadsheet();
//     var sheet = ss.getSheetByName('รายจ่าย');
//     if (!sheet) return { error: 'ไม่พบ Sheet รายจ่าย', byCategory: {}, total: 0 };

//     var data = sheet.getDataRange().getValues();
//     if (data.length <= 1) return { byCategory: {}, total: 0 };

//     var parts       = (periodKey || '').split('-');
//     var filterYear  = parseInt(parts[0]) || 0;
//     var filterMonth = parseInt(parts[1]) || 0;
//     var tz          = Session.getScriptTimeZone();

//     var byCategory = {};
//     var total      = 0;

//     data.slice(1).forEach(function(row) {
//       // คอลัมน์ B (index 1) = วันที่ — เป็น Date object จาก Sheet โดยตรง
//       var rawDate = row[1];
//       if (!rawDate) return;

//       // รองรับทั้ง Date object และ string
//       var dateObj = (rawDate instanceof Date) ? rawDate : new Date(rawDate);
//       if (isNaN(dateObj.getTime())) return;

//       if (filterYear && filterMonth) {
//         var rowYear  = parseInt(Utilities.formatDate(dateObj, tz, 'yyyy'));
//         var rowMonth = parseInt(Utilities.formatDate(dateObj, tz, 'MM'));
//         if (rowYear !== filterYear || rowMonth !== filterMonth) return;
//       }

//       var category = String(row[2] || 'อื่นๆ').trim();
//       var amount   = parseFloat(row[4]) || 0;
//       if (amount <= 0) return;

//       if (!byCategory[category]) byCategory[category] = 0;
//       byCategory[category] += amount;
//       total += amount;
//     });

//     Object.keys(byCategory).forEach(function(k) {
//       byCategory[k] = Math.round(byCategory[k] * 100) / 100;
//     });

//     return {
//       byCategory: byCategory,
//       total:      Math.round(total * 100) / 100
//     };

//   } catch(err) {
//     return { error: err.message, byCategory: {}, total: 0 };
//   }
// }


// ============================================================
// [6] HELPERS
// ============================================================

// สร้าง Sheet "รายจ่าย" ถ้ายังไม่มี
function getOrCreateExpenseSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_EXPENSE);
  if (sheet) return sheet;

  sheet = ss.insertSheet(SHEET_EXPENSE);
  var headers = [
    'วันที่บันทึก', 'วันที่', 'หมวดหมู่', 'รายละเอียด',
    'ยอดเงิน', 'สกุลเงิน', 'ชื่อร้าน', 'วิธีบันทึก',
    'Link รูป', 'LINE UserID'
  ];
  sheet.appendRow(headers);
  var r = sheet.getRange(1, 1, 1, headers.length);
  r.setBackground('#E8457A').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(3, 140);
  sheet.setColumnWidth(4, 200);
  sheet.setColumnWidth(5, 100);
  Logger.log('Created sheet: ' + SHEET_EXPENSE);
  return sheet;
}

// แปลง "dd/MM/yyyy HH:mm" → Date
function parseExpenseDate(val) {
  try {
    if (!val) return null;
    // Date object จาก Sheet โดยตรง
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    // number (Excel serial)
    if (typeof val === 'number') return new Date(val);
    // string format dd/MM/yyyy หรือ dd/MM/yyyy HH:mm
    var str = String(val).trim();
    if (!str) return null;
    var parts = str.split(' ')[0].split('/');
    if (parts.length < 3) return null;
    var d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return isNaN(d.getTime()) ? null : d;
  } catch (e) { return null; }
}



function debugExpense2() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('รายจ่าย');
  var data  = sheet.getDataRange().getValues();
  var row   = data[1]; // แถวที่ 2
  
  var val = row[0];
  Logger.log('typeof val: ' + typeof val);
  Logger.log('val instanceof Date: ' + (val instanceof Date));
  Logger.log('val value: ' + val);
  Logger.log('val.getTime(): ' + (val instanceof Date ? val.getTime() : 'N/A'));
  
  // ทดสอบ filter
  var now   = new Date();
  var start = new Date(now.getFullYear(), now.getMonth(), 1);
  Logger.log('start: ' + start);
  Logger.log('now: ' + now);
  Logger.log('val >= start: ' + (val >= start));
  Logger.log('val <= now: ' + (val <= now));
  
  // ทดสอบ amount
  Logger.log('amount: ' + row[4]);
  Logger.log('typeof amount: ' + typeof row[4]);
}
