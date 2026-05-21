// [1] CONFIGURATION
const LINE_TOKEN_STAFF = '3URg+f03o1BPcovMIr0Km0lkLtwtIp4kL62FqU3Zsc4dTXBA0rcohA3FmukXL8DwTTEylfZgh2LFQq0YuhRxRB+Uo8AAByKj/udUzfa/ISdr5v3iP2sjlGLG63DW6PAncHh/UM9FP5m8IUOHKhmexgdB04t89/1O/w1cDnyilFU=';
const LINE_TOKEN_CUST  = 'aL+ZAnzuQ6GZ7tvM20yq8B3G9gaW6pg2pZ1O0w8Itv73KsYkLjCgNwPXf8EILdvc11R90aujqf+4v95GolSk+Rn4OLkxxADVrHAgP2MADtSByO0W4pCzZMNmhzrpyIy0gFKcyuaWBzXJOL/EUKShywdB04t89/1O/w1cDnyilFU=';
const ADMIN_USER_ID    = 'Uccd1338e1f146d4bbc0988bb98d7b124';

const SHEET_RECORDS = 'รายการ';
const SHEET_STAFF   = 'พนักงาน';
const SHEET_SESSION = 'Session';
const SHEET_MEMBER  = 'สมาชิก';

const COMMISSION_RATE = { 'ทำเล็บ': 0.10, 'สปามือ/เท้า': 0.10, 'ต่อขนตา': 0.15, 'แว็กขน': 0.10 };

const SERVICE_MAP = {
  'ตา': 'ต่อขนตา', 'ขนตา': 'ต่อขนตา', 'ต่อขตา': 'ต่อขนตา', 'ต่อ': 'ต่อขนตา', 'ต่อขนตา': 'ต่อขนตา', 'ขนตส': 'ต่อขนตา',
  'เล็บ': 'ทำเล็บ', 'ทำ': 'ทำเล็บ', 'ทำเล็บ': 'ทำเล็บ', 'เจลมือ': 'ทำเล็บ', 'เจลเท้า': 'ทำเล็บ', 'เจลมือเท้า': 'ทำเล็บ',
  'สปา': 'สปามือ/เท้า', 'มือ': 'สปามือ/เท้า', 'เท้า': 'สปามือ/เท้า', 'สปามือ/เท้า': 'สปามือ/เท้า','สปามือ': 'สปามือ/เท้า',
  'แว็ก': 'แว็กขน', 'ขน': 'แว็กขน', 'แว๊ก': 'แว็กขน'
};


function calcTopupCredit(amount) {
  var cfg = getConfig() || {};
  var t20 = cfg.TIER_20K || 27000;
  var t10 = cfg.TIER_10K || 13000;
  var t5  = cfg.TIER_5K  || 6000;
  var base = amount >= 20000 ? t20 : amount >= 10000 ? t10 : amount >= 5000 ? t5 : amount;
  var bonus = 0;
  if (amount >= 20000 && cfg.PROMO_TOPUP_ACTIVE) bonus = cfg.BONUS_TOPUP || 0;
  else if (amount >= 5000 && cfg.PROMO_TOPUP_ACTIVE) bonus = cfg.BONUS_TOPUP || 0;
  return base + bonus;
}

// สำหรับสมัครสมาชิกใหม่ — ใช้ BONUS_REGISTER
function calcRegisterCredit(amount) {
  var cfg = getConfig() || {};
  var t20 = cfg.TIER_20K || 27000;
  var t10 = cfg.TIER_10K || 13000;
  var t5  = cfg.TIER_5K  || 6000;
  var base = amount >= 20000 ? t20 : amount >= 10000 ? t10 : amount >= 5000 ? t5 : amount;
  var bonus = 0;
  if (cfg.PROMO_REG_ACTIVE) bonus = cfg.BONUS_REGISTER || 0;
  return base + bonus;
}



function getRegisterBonus(amount) {
  return calcRegisterCredit(amount) - amount;
}

function getTopupBonus(amount) {
  return calcTopupCredit(amount) - amount;
}


// ============================================================
// [2] DASHBOARD API
// ============================================================

function getDashboardData(period) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_RECORDS);
    if (!sheet) return { error: 'ไม่พบ Sheet "' + SHEET_RECORDS + '"' };
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { records: [] };
    var now = new Date(), start;
    if (!period || period === 'all') {
      start = new Date(2000, 0, 1);
    } else if (period === 'day') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (period === 'week') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    }
    var records = [];
    data.slice(1).forEach(function(row) {
      var rowDate = new Date(row[0]);
      if (isNaN(rowDate) || rowDate < start || rowDate > now) return;
      var price = Number(row[5]);
      if (isNaN(price) || price <= 0) return;
      var rowStatus = String(row[9] || ''); // column 10
      if (rowStatus === 'ยกเลิก' || rowStatus === 'รออนุมัติ') return;
      records.push({ timestamp: rowDate.toISOString(), staffName: String(row[3] || ''), service: String(row[4] || ''), price: price, payment: String(row[6] || 'Cash'), phone: String(row[7] || '-') });
    });
    records.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
    return { records: records };
  } catch (err) { return { error: err.message }; }
}

function getMembersData() {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_MEMBER);
    if (!sheet) return { error: 'ไม่พบ Sheet "' + SHEET_MEMBER + '"' };
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { members: [] };
    // คอลัมน์: [0]=เบอร์, [1]=ชื่อ, [2]=ยอด, [3]=lineId, [4]=expiry, [5]=รหัส4หลัก
    var members = data.slice(1).map(function(row) {
      return {
        phone:      String(row[0] || ''),
        name:       String(row[1] || ''),
        balance:    Number(row[2]) || 0,
        lineId:     String(row[3] || '-'),
        memberCode: String(row[5] || '-')
      };
    }).filter(function(m) { return m.phone !== '' || m.memberCode !== '-'; });
    members.sort(function(a, b) { return b.balance - a.balance; });
    return { members: members };
  } catch (err) { return { error: err.message }; }
}


// ============================================================
// [3] CORE WEB APP
// ============================================================

function doPost(e) {
  var response = ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
  try {
    if (!e || !e.postData || !e.postData.contents) return response;
    var json = JSON.parse(e.postData.contents);
    
    // ← เพิ่มบรรทัดนี้
    Logger.log('RAW EVENT: ' + JSON.stringify(json));
    
    var events = json.events || [];
    events.forEach(function(event) {
      if (!event.source || !event.source.userId) return;
      sendLoading(event.source.userId);
      if (event.type === 'postback') {
        event.message = { type: 'text', text: event.postback.data };
        event.type = 'message';
      }
      handleEvent(event);
    });
  } catch (err) { Logger.log('Error: ' + err.message); }
  return response;
}


// ============================================================
// [4] MESSAGE HANDLER
// ============================================================

function handleEvent(event) {
  var userId     = event.source.userId;
  var replyToken = event.replyToken;

  // ── รูปภาพ (สลิป) — เช็คก่อน text guard ──
  if (event.type === 'message' && event.message.type === 'image') {
    var staffImg = getStaff(userId);
    if (!staffImg) return replyText(replyToken, '❌ กรุณาลงทะเบียนพนักงานก่อนส่งสลิปค่ะ', false);
    return handleSlipImage(event, replyToken, userId, staffImg.name);
  }

  // ── guard: รับเฉพาะ text ──
  if (event.type !== 'message' || event.message.type !== 'text') return;

  var msgText = event.message.text.trim();
  var session = getSession(userId);


// ============================================================
  // [ADMIN FIRST] — เช็ค Admin ก่อนเสมอ ไม่ว่าจะลงทะเบียนพนักงานหรือไม่
  // ============================================================
  if (String(userId) === String(ADMIN_USER_ID)) {
    // Admin กด อนุมัติลบ / ปฏิเสธลบ
    if (msgText.indexOf('อนุมัติลบ_') === 0 || msgText.indexOf('ปฏิเสธลบ_') === 0) {
      return handleVoidApproval(replyToken, msgText);
    }
  }

  var staff      = getStaff(userId);
  var session    = getSession(userId);

  // ============================================================
  // [A] ลูกค้า / บุคคลที่ยังไม่ได้ลงทะเบียนเป็นพนักงาน
  // ใช้ LINE Bot ฝั่งลูกค้า (LINE_TOKEN_CUST) สำหรับรับใบเสร็จ
  // ลูกค้าผูกบัญชีด้วยเบอร์โทรศัพท์เท่านั้น
  // ============================================================
  if (!staff) {
    if (session && session.step === 'CONFIRM_REG' && msgText === 'ยืนยันลงทะเบียน') {
      registerStaff(userId, session.name);
      clearSession(userId);
      return replyText(replyToken, '✅ ลงทะเบียนสำเร็จ! ยินดีต้อนรับคุณ ' + session.name + ' ✨\nเริ่มบันทึกงานได้เลยค่ะ', false);
    }
    if (session && session.step === 'WAIT_NAME') {
      if (msgText.includes('ลงทะเบียน')) return;
      setSession(userId, { step: 'CONFIRM_REG', name: msgText });
      return replyFlexConfirmReg(replyToken, msgText);
    }
    if (msgText.includes('ลงทะเบียน')) {
      setSession(userId, { step: 'WAIT_NAME' });
      return replyText(replyToken, 'สวัสดีค่ะ 😊 พิมพ์ "ชื่อเล่น" เพื่อลงทะเบียนพนักงานค่ะ', false);
    }
    if (msgText === 'ยอดคงเหลือ' || msgText === 'เช็คยอด') {
      var member = getMemberByLineId(userId);
      if (member) return replyText(replyToken, '💰 ยอดเงินของคุณ ' + member.name + '\nคงเหลือ: ฿' + member.balance.toLocaleString(), true);
      return replyText(replyToken, '📍 กรุณาพิมพ์ "เบอร์โทรศัพท์" เพื่อผูกบัญชีสมาชิกค่ะ', true);
    }
    var phonePattern = msgText.replace(/[^0-9]/g, '');
    if (phonePattern.length >= 9 && phonePattern.length <= 10 && /^\d+$/.test(msgText)) {
      var mByPhone = getMemberByPhone(phonePattern);
      if (mByPhone) {
        if (!mByPhone.lineId || mByPhone.lineId === '-') updateMemberLineId(phonePattern, userId);
        return replyText(replyToken, '✅ ผูกบัญชีสำเร็จ!\nคุณ: ' + mByPhone.name + '\nคงเหลือ: ฿' + mByPhone.balance.toLocaleString(), true);
      }
      return replyText(replyToken, '❌ ไม่พบข้อมูลสมาชิกเบอร์ ' + phonePattern, true);
    }
    return replyText(replyToken, 'ยินดีต้อนรับสู่ Nail Kloset ✨\n\n📌 กรุณาพิมพ์ "เบอร์โทร" \nเพื่อลงทะเบียนสมาชิกค่ะ 🙇‍♀️💕', true);
  }

  // ============================================================
  // [B] พนักงาน
  // ============================================================

  // [B] พนักงาน
  var staffName = staff.name;

  // ============================================================
  // 2. เติมเงินสมาชิก — รูปแบบ: เติม [รหัส4หลัก] [ยอด]
  // *** รหัส 4 หลักแทนเบอร์โทร ***
  // ============================================================
    var topM = msgText.match(/^เติม\s*(\d{4})\s+(\d+)(?:\s+(สด|โอน|รูด))?$/);
  if (topM) {
    clearSession(userId);
    var mCode      = topM[1];
    var payAmount  = parseFloat(topM[2]);
    var payWord    = (topM[3] || '').trim();   // สด | โอน | รูด | ''
 
    // แปลง payWord → payment type และ accountType (เหมือน matchWork)
    var payment, accountType;
    if (payWord === 'รูด') {
      payment     = 'Credit';
      accountType = 'กสิกร';
    } else if (payWord === 'โอน') {
      payment     = 'Transfer';
      accountType = 'กสิกร';
    } else if (payWord === 'สด') {
      payment     = 'Cash';
      accountType = 'เงินในร้าน';
    } else {
      // ไม่ระบุ → ถือว่าจ่ายเงินสด (พฤติกรรมเดิม)
      payment     = 'Cash';
      accountType = 'เงินในร้าน';
    }
 
    var creditAmount = calcTopupCredit(payAmount);
    var bonusAmount  = getTopupBonus(payAmount);
 
    var m = getMemberByCode(mCode);
    if (!m) return replyText(replyToken, '❌ ไม่พบสมาชิกรหัส ' + mCode + '\nกรุณาตรวจสอบรหัสอีกครั้งค่ะ');
 
    var oldB   = m.balance;
    var newB   = oldB + creditAmount;
    var now    = new Date();
    var newExp = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    var expStr = Utilities.formatDate(newExp, 'GMT+7', 'dd/MM/yyyy');
 
    var mSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MEMBER);
    mSheet.getRange(m.row, 3).setValue(newB);
    mSheet.getRange(m.row, 5).setValue(newExp);
 
    // บันทึก record ด้วยยอดที่จ่ายจริง + payment type ที่ถูกต้อง
    saveRecord(userId, staffName, 'เติมเงินสมาชิก', payAmount, payment, m.phone, '-', accountType);
    writeMemberLog(
      m.phone,
      'เติมเงิน (จ่าย ฿' + payAmount.toLocaleString() + ' ได้เครดิต ฿' + creditAmount.toLocaleString() + ')',
      '+' + creditAmount, oldB, newB, staffName
    );
 
    replyFlexTopupSuccess(replyToken, staffName, mCode, m.name, payAmount, creditAmount, bonusAmount, newB, payment);
 
    if (m.lineId && m.lineId !== '-') {
      pushMessagesToCustomer(m.lineId, [
        getFlexNotifyTopup(payAmount, creditAmount, bonusAmount, newB, expStr, staffName, m.phone, oldB)
      ]);
    }
    return;
  }

  // ============================================================
  // 3. สมัครสมาชิก — รูปแบบ: สมัคร [เบอร์] [ชื่อ] [รหัส4หลัก] [ยอด]
  // เบอร์: ใช้ผูก LINE รับใบเสร็จ
  // รหัส4หลัก: พนักงานกำหนดเอง ใช้แทนเบอร์ในการทำรายการ
  // ============================================================
  var regM = msgText.match(/^สมัคร\s*(\d{9,10})\s+([ก-๙a-zA-Z]+)\s+(\d{4})\s+(\d+)$/);
  if (regM) {
    clearSession(userId);
    var ph   = regM[1];
    var name = regM[2];
    var code = regM[3];
    var am   = parseFloat(regM[4]);

    // ตรวจสอบว่าเบอร์หรือรหัสซ้ำหรือไม่
    if (getMemberByPhone(ph))   return replyText(replyToken, '❌ เบอร์ ' + ph + ' เป็นสมาชิกอยู่แล้วค่ะ');
    if (getMemberByCode(code))  return replyText(replyToken, '❌ รหัส ' + code + ' ถูกใช้แล้วค่ะ กรุณาใช้รหัสอื่น');

    var creditAmount = calcRegisterCredit(am);
    var bonusAmount  = getRegisterBonus(am);

    var now = new Date();
    var expDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    var expStr  = Utilities.formatDate(expDate, 'GMT+7', 'dd/MM/yyyy');

    // คอลัมน์: [เบอร์, ชื่อ, ยอดเครดิต, lineId, expiry, รหัส4หลัก]
    getOrCreateSheet(SHEET_MEMBER, ['เบอร์โทร', 'ชื่อ', 'ยอดเงิน', 'LineID', 'หมดอายุ', 'รหัสสมาชิก']).appendRow(["'" + ph, name, creditAmount, '-', expDate, "'" + code]);
    saveRecord(userId, staffName, 'เปิดเมมเบอร์ใหม่', am, 'Cash', ph);
    writeMemberLog(ph, 'สมัครสมาชิกใหม่ (จ่าย ฿' + am.toLocaleString() + ' ได้เครดิต ฿' + creditAmount.toLocaleString() + ')', '+' + creditAmount, 0, creditAmount, staffName);

    var bonusLine = bonusAmount > 0 ? '\n🎁 โบนัส: ฿' + bonusAmount.toLocaleString() : '';
var flex = {
  type: 'bubble', size: 'mega',
  header: {
    type: 'box', layout: 'vertical',
    backgroundColor: '#4A90D9', paddingAll: '20px',
    contents: [
      { type: 'text', text: 'สมัครสมาชิกสำเร็จ! 🎉', color: '#ffffff', weight: 'bold', size: 'lg' },
      { type: 'text', text: 'Nail Kloset Member Card', color: '#D0E8FF', size: 'xs', margin: 'xs' }
    ]
  },
  body: {
    type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
    contents: [
      { type: 'box', layout: 'horizontal', contents: [
        { type: 'text', text: '👤 ชื่อ', size: 'sm', color: '#888888', flex: 2 },
        { type: 'text', text: name, size: 'sm', weight: 'bold', align: 'end', flex: 3 }
      ]},
      { type: 'box', layout: 'horizontal', contents: [
        { type: 'text', text: '🔑 รหัสสมาชิก', size: 'sm', color: '#888888', flex: 2 },
        { type: 'text', text: code, size: 'sm', weight: 'bold', align: 'end', flex: 3 }
      ]},
      { type: 'box', layout: 'horizontal', contents: [
        { type: 'text', text: '💳 จ่าย', size: 'sm', color: '#888888', flex: 2 },
        { type: 'text', text: '฿' + am.toLocaleString(), size: 'sm', weight: 'bold', align: 'end', flex: 3 }
      ]},
      bonusAmount > 0 ? { type: 'box', layout: 'horizontal', contents: [
        { type: 'text', text: '🎁 โบนัส', size: 'sm', color: '#1DB446', flex: 2 },
        { type: 'text', text: '+฿' + bonusAmount.toLocaleString(), size: 'sm', weight: 'bold', color: '#1DB446', align: 'end', flex: 3 }
      ]} : { type: 'spacer', size: 'none' },
      { type: 'separator', margin: 'md' },
      { type: 'box', layout: 'horizontal', margin: 'md',
        backgroundColor: '#f0f8ff', paddingAll: '14px', cornerRadius: 'md',
        contents: [
          { type: 'text', text: '💰 เครดิตที่ได้รับ', weight: 'bold', size: 'sm', color: '#4A90D9', gravity: 'center' },
          { type: 'text', text: '฿' + creditAmount.toLocaleString(), size: 'xl', weight: 'bold', color: '#4A90D9', align: 'end' }
        ]
      },
      { type: 'box', layout: 'horizontal', contents: [
        { type: 'text', text: '📅 หมดอายุ', size: 'sm', color: '#888888', flex: 2 },
        { type: 'text', text: expStr, size: 'sm', weight: 'bold', align: 'end', flex: 3 }
      ]}
    ]
  }
};
return callLineAPI('reply', {
  replyToken: replyToken,
  messages: [{ type: 'flex', altText: 'สมัครสมาชิกสำเร็จ! ' + name + ' รหัส ' + code, contents: flex }]
}, false);
  }


  // เช็คยอดสมาชิก — ต้องอยู่ก่อน matchWork
  var checkM = msgText.match(/^เช็ค\s*(\d{4})$/);
    if (checkM) {
  clearSession(userId);
  var mCheck = getMemberByCode(checkM[1]);
  if (!mCheck) return replyText(replyToken, '❌ ไม่พบรหัสสมาชิก ' + checkM[1] + '\nกรุณาตรวจสอบอีกครั้งค่ะ', false);
  return replyFlexMemberBalance(replyToken, mCheck);
}


   var expMatch = msgText.match(/^จ่าย\s*([^\d\s][^\d]*?)\s*(\d+(?:\.\d+)?)$/);
 if (expMatch) {
   clearSession(userId);
   var expName   = expMatch[1].trim();
   var expAmount = parseFloat(expMatch[2]);
   saveExpenseFromLine(expName, expAmount, userId);
   return replyFlexExpense(replyToken, expName, expAmount);
 }
 // ── ดูรายจ่าย ──────────────────────────────────────────
 if (msgText === 'รายจ่าย' || msgText === 'รายจ่ายเดือนนี้') {
   clearSession(userId);
   return replyExpenseSummaryLine(replyToken, 'month');
 }
 if (msgText === 'รายจ่ายวันนี้') {
   clearSession(userId);
   return replyExpenseSummaryLine(replyToken, 'today');
 }

  // ============================================================
  // 4. บันทึกงาน — รูปแบบ: [บริการ] [ราคา]
  // ============================================================
var matchWork = msgText.match(/^([^0-9#\s]+)\s*(\d+(?:\.\d+)?)(?:\s*([^\s#]+))?(?:\s*[#\s]*\s*(.*))?$/);
if (matchWork && msgText.indexOf('_') === -1) {
  var prefix   = matchWork[1].trim();
  if (prefix === 'เติม' || prefix === 'สมัคร') return;
  clearSession(userId);

  var finalS   = SERVICE_MAP[prefix] || prefix;
  var price    = parseFloat(matchWork[2]);
  var payWord  = (matchWork[3] || '').trim().toLowerCase();  // ✅ แก้ matchMatch → matchWork
  var note     = matchWork[4] || '-';

  var payment, accountType;
  if (payWord === 'รูด') {
    payment     = 'Credit';
    accountType = 'กสิกร';
  } else if (payWord === 'โอน') {
    payment     = 'Transfer';
    accountType = 'กสิกร';
  } else if (payWord === 'สด') {
    payment     = 'Cash';
    accountType = 'เงินในร้าน';
  } else {
    if (payWord && payWord !== '-') note = payWord + (note !== '-' ? ' ' + note : '');
    payment     = 'Cash';
    accountType = 'ตัดเมมเบอร์';
  }

  saveRecord(userId, staffName, finalS, price, payment, '-', note, accountType);
  var rId = getLastRecordId(userId);
  return replyFlexRecord(replyToken, staffName, finalS, price, rId, userId, payment, accountType);
}



  // ============================================================
  // [C] Postback — ปุ่มกด
  // ============================================================


  
  // ── แก้ไขราคา — เช็คซ้ำ + เช็ค VOID ──
  if (msgText.indexOf('แก้ไขราคา_') === 0) {
    var p   = msgText.split('_');
    var row = parseInt(p[1]);
    ensureRecordColumns();
    var recSheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);

    // เช็คสถานะก่อน
    var curStatus = String(recSheet.getRange(row, 10).getValue());
    if (curStatus === 'ยกเลิก') {
      return replyText(replyToken, '⚠️ รายการนี้ถูกยกเลิกแล้ว ไม่สามารถแก้ไขได้ค่ะ', false);
    }
    if (curStatus === 'รออนุมัติ') {
      return replyText(replyToken, '⚠️ รายการนี้อยู่ระหว่างรอยกเลิก ไม่สามารถแก้ไขได้ค่ะ', false);
    }

    var recordTime = new Date(recSheet.getRange(row, 1).getValue());
    if ((new Date() - recordTime) / (1000 * 60) > 15) {
      return replyText(replyToken, '⚠️ เกินกำหนด 15 นาที แก้ไขไม่ได้แล้วค่ะ', false);
    }
    setSession(userId, { step: 'EDIT_PRICE', recordId: p[1], service: p[2] });
    return replyText(replyToken, '✏️ แก้ไขราคา ' + p[2] + '\nพิมพ์ "ราคาใหม่" ได้เลยค่ะ');
  }

  // ── หักสมาชิก — เช็คซ้ำ ──
  if (msgText.indexOf('หักสมาชิก_') === 0) {
    var parts = msgText.split('_');
    var rId   = parts[1];
    ensureRecordColumns();
    var recSheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
    var curStatus = String(recSheet.getRange(parseInt(rId), 10).getValue());

    if (curStatus === 'ยกเลิก') {
      return replyText(replyToken, '⚠️ รายการนี้ถูกยกเลิกแล้วค่ะ', false);
    }
    if (curStatus === 'รออนุมัติ') {
      return replyText(replyToken, '⚠️ รายการนี้อยู่ระหว่างรอยกเลิกค่ะ', false);
    }

    // เช็คว่าหักสมาชิกไปแล้วหรือยัง
    var payment = String(recSheet.getRange(parseInt(rId), 7).getValue());
    if (payment === 'Member') {
      return replyText(replyToken, '⚠️ รายการนี้หักสมาชิกไปแล้วค่ะ', false);
    }

    setSession(userId, { step: 'ASK_MEMBER_CODE', recordId: parts[1], price: parseFloat(parts[2]) });
    return replyText(replyToken, '💳 หักสมาชิก ยอด ฿' + parts[2].toLocaleString() + '\nพิมพ์ "รหัสสมาชิก 4 หลัก" ของลูกค้าค่ะ');
  }

  // เตรียมเติมเงิน (กรณียอดไม่พอ)
  if (msgText.indexOf('เตรียมเติมเงิน_') === 0) {
    var p = msgText.split('_');
    setSession(userId, { step: 'WAIT_TOPUP_AMOUNT', memberCode: p[1], recordId: p[2] });
    return replyText(replyToken, '💰 เติมเงินรหัสสมาชิก ' + p[1] + '\nพิมพ์ "ยอดเงินที่ต้องการเติม" ค่ะ');
  }

  // ยืนยันเติมและตัด
  if (msgText.indexOf('ยืนยันเติมและตัด_') === 0) {
    var p = msgText.split('_');
    var mCode = p[1], payAmount = parseFloat(p[2]), rId = p[3];
    var mem   = getMemberByCode(mCode);
    var rInfo = getRecordInfo(rId);

    if (SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS).getRange(parseInt(rId), 7).getValue() === 'Member') {
      return replyText(replyToken, '⚠️ รายการนี้ถูกบันทึกไปแล้วค่ะ', false);
    }

    var creditAmount = calcTopupCredit(payAmount);
    var bonusAmount  = getTopupBonus(payAmount);
    var oldB = mem.balance;
    var balAfterTopup = oldB + creditAmount;

    if (balAfterTopup < rInfo.price) {
      setSession(userId, { step: 'WAIT_TOPUP_AMOUNT', memberCode: mCode, recordId: rId });
      return replyText(replyToken, '❌ ยอดเงินยังไม่พอ! (ขาดอีก ฿' + (rInfo.price - balAfterTopup).toLocaleString() + ')\nกรุณาระบุยอดเติมเงินใหม่ค่ะ');
    }

    var now = new Date();
    var newExp = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    var expStr = Utilities.formatDate(newExp, 'GMT+7', 'dd/MM/yyyy');
    var finalB = balAfterTopup - rInfo.price;

    var mSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MEMBER);
    mSheet.getRange(mem.row, 3).setValue(finalB);
    mSheet.getRange(mem.row, 5).setValue(newExp);
    updateRecordToMember(rId, mem.phone);
    saveRecord(userId, staffName, 'เติมเงินสมาชิก', payAmount, 'Cash', mem.phone);
    writeMemberLog(mem.phone, 'เติมเงิน (จ่าย ฿' + payAmount.toLocaleString() + ' ได้เครดิต ฿' + creditAmount.toLocaleString() + ')', '+' + creditAmount, oldB, balAfterTopup, staffName);
    writeMemberLog(mem.phone, 'ใช้บริการ (หักยอด #' + rId + ')', '-' + rInfo.price, balAfterTopup, finalB, staffName);
    clearSession(userId);

    if (mem.lineId && mem.lineId !== '-') {
      pushMessagesToCustomer(mem.lineId, [
        getFlexNotifyTopup(payAmount, creditAmount, bonusAmount, balAfterTopup, expStr, staffName, mem.phone, oldB),
        getFlexNotifyCut(rInfo.service, rInfo.price, finalB, balAfterTopup, staffName, mem.phone)
      ]);
    }

    var commToday = getCommissionToday(userId);
    return callLineAPI('reply', {
      replyToken: replyToken,
      messages: [
        { type: 'flex', altText: 'เติมเงินสำเร็จ',   contents: getFlexTopupSuccessContents(staffName, mCode, mem.name, payAmount, creditAmount, bonusAmount, balAfterTopup) },
        { type: 'flex', altText: 'หักสมาชิกสำเร็จ', contents: getFlexMemberSuccessContents(staffName, rInfo.service, rInfo.price, mCode, mem.name, finalB, commToday, balAfterTopup) }
      ]
    }, false);
  }


  //ส่วนต่างเมมเบอร์
if (msgText.indexOf('จ่ายส่วนต่าง_') === 0) {
  var p = msgText.split('_');
  var mCode     = p[1];
  var rId       = p[2];
  var price     = parseFloat(p[3]);
  var memBal    = parseFloat(p[4]);
  var payType   = p[5];
  var shortfall = price - memBal;
  var mToCut    = getMemberByCode(mCode);

  if (!mToCut) return replyText(replyToken, '❌ ไม่พบสมาชิกค่ะ', false);

  var recSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  if (recSheet.getRange(parseInt(rId), 7).getValue() === 'Member') {
    return replyText(replyToken, '⚠️ รายการนี้ถูกบันทึกไปแล้วค่ะ', false);
  }

  var rInfo = getRecordInfo(rId);
  var oldB  = mToCut.balance;
  var newB  = oldB - memBal;

  if (memBal > 0) {
    // มียอดเมมบางส่วน → split record
    updateRecordToMember(rId, mToCut.phone);
    updateRecordPrice(rId, memBal);
    updateMemberBalance(mToCut.phone, memBal);
    writeMemberLog(mToCut.phone, 'ใช้บริการ (หักยอด #' + rId + ')', '-' + memBal, oldB, newB, staffName);
  }
  // memBal = 0 → ไม่ต้องแตะ record เดิมและยอดเมมเลย

  // บันทึก record ใหม่ → ส่วนที่เหลือ (Cash/Transfer)
  saveRecord(userId, staffName, rInfo.service, shortfall, payType, '-', 'ส่วนต่างจากเมม #' + rId);
  writeLog('จ่ายส่วนต่าง', staffName, 'รหัส: ' + mCode + ' เมม: ' + memBal + ' ' + payType + ': ' + shortfall, rId);

  var commToday = getCommissionToday(userId);

  if (mToCut.lineId && mToCut.lineId !== '-') {
    pushToCustomer(mToCut.lineId, getFlexNotifyCut(rInfo.service, price, newB, oldB, staffName, mToCut.phone));
  }

  var payLabel = payType === 'Cash' ? 'เงินสด' : 'โอน';
  var flex = {
    type: 'bubble', size: 'mega',
    header: {
      type: 'box', layout: 'vertical', backgroundColor: '#FF6B9D', paddingAll: '20px',
      contents: [
        { type: 'text', text: 'บันทึกสำเร็จ ✅', color: '#ffffff', weight: 'bold', size: 'lg' },
        { type: 'text', text: 'ชำระแบบผสม (เมม + ' + payLabel + ')', color: '#E8F5E9', size: 'xs', margin: 'xs' }
      ]
    },
    body: {
      type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
      contents: [
        { type: 'text', text: 'พนักงาน : ' + staffName, size: 'sm', weight: 'bold' },
        { type: 'text', text: rInfo.service, size: 'md', weight: 'bold', margin: 'md' },
        { type: 'separator', margin: 'md' },
        { type: 'box', layout: 'horizontal', margin: 'md', contents: [
          { type: 'text', text: '💳 หักเมมเบอร์', size: 'sm', color: '#888888', flex: 1 },
          { type: 'text', text: '฿' + memBal.toLocaleString(), size: 'sm', weight: 'bold', align: 'end' }
        ]},
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: (payType === 'Cash' ? '💵 เงินสด' : '📲 โอน'), size: 'sm', color: '#888888', flex: 1 },
          { type: 'text', text: '฿' + shortfall.toLocaleString(), size: 'sm', weight: 'bold', align: 'end' }
        ]},
        { type: 'box', layout: 'horizontal', backgroundColor: '#FFF0F6', paddingAll: '12px', cornerRadius: 'md', margin: 'md', contents: [
          { type: 'text', text: 'รวมทั้งหมด', weight: 'bold', color: '#FF6B9D', gravity: 'center' },
          { type: 'text', text: '฿' + price.toLocaleString(), size: 'xl', weight: 'bold', color: '#FF6B9D', align: 'end' }
        ]},
        { type: 'separator', margin: 'md' },
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'ยอดเมมคงเหลือ', size: 'sm', color: '#888888', flex: 1 },
          { type: 'text', text: '฿' + newB.toLocaleString(), size: 'sm', weight: 'bold', color: '#E8457A', align: 'end' }
        ]},
        { type: 'text', text: 'ค่าคอมฯ สะสมวันนี้: ฿' + commToday.toLocaleString(), size: 'xs', color: '#888888', margin: 'md', align: 'center' }
      ]
    }
  };

  // เปลี่ยนบรรทัดสุดท้ายของ block จ่ายส่วนต่าง_
  return callLineAPI('reply', { replyToken: replyToken, messages: [{ type: 'flex', altText: 'บันทึกสำเร็จ (เมม+' + payLabel + ')', contents: flex }] }, false);
}




  // ============================================================
  // [D] สรุปยอด / คำสั่งพื้นฐาน
  // ============================================================
  if (['รายวัน', 'รายอาทิตย์', 'รายเดือน', 'สรุป'].indexOf(msgText) !== -1) {
    clearSession(userId);
    var pType = (msgText === 'รายอาทิตย์') ? 'week' : (msgText === 'รายเดือน') ? 'month' : 'day';
    var sData = getSummaryData(userId, staffName, pType);
    return replyFlexSummary(replyToken, staffName, sData, (msgText === 'สรุป' ? 'รายวัน' : msgText));
  }
  if (msgText === 'ยกเลิก' || msgText === 'ล้าง' || msgText === 'กลับหน้าหลัก') {
    clearSession(userId);
    return replyText(replyToken, 'พร้อมรับรายการใหม่ค่ะ ✨', false);
  }



  // แก้ไขยอดสลิปจาก AI (กรณีอ่านผิด)
    var editSlipM = msgText.match(/^แก้ไขสลิป\s+(\d+(?:\.\d+)?)$/);
    if (editSlipM) {
      clearSession(userId);
      var correctedAmt = parseFloat(editSlipM[1]);
      var expSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('รายจ่าย');
      if (expSheet && expSheet.getLastRow() > 1) {
        expSheet.getRange(expSheet.getLastRow(), 5).setValue(correctedAmt);
        return replyText(replyToken, '✅ แก้ไขยอดเป็น ฿' + correctedAmt.toLocaleString() + ' แล้วค่ะ', false);
      }
      return replyText(replyToken, '❌ ไม่พบรายจ่ายล่าสุดค่ะ', false);
    }

    // ลบรายจ่ายล่าสุด (เฉพาะแถวล่าสุด)
    if (msgText === 'ลบรายจ่ายล่าสุด') {
      clearSession(userId);
      var expSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('รายจ่าย');
      if (expSheet && expSheet.getLastRow() > 1) {
        var deletedRow = expSheet.getLastRow();
        expSheet.deleteRow(deletedRow);
        return replyText(replyToken, '🗑️ ลบรายจ่ายล่าสุดแล้วค่ะ', false);
      }
      return replyText(replyToken, '❌ ไม่มีรายจ่ายให้ลบค่ะ', false);
    }

  // ============================================================
  // [E] Session Steps
  // ============================================================

  // แก้ไขราคา
  if (session && session.step === 'EDIT_PRICE') {
    var nPrice = parseFloat(msgText.replace(/,/g, ''));
    if (!isNaN(nPrice) && nPrice > 0) {
      var oldI = getRecordInfo(session.recordId);
      writeLog('แก้ไขราคา', staffName, 'เดิม: ' + oldI.price + ' -> ใหม่: ' + nPrice, session.recordId);
      updateRecordPrice(session.recordId, nPrice);
      clearSession(userId); // clear ก่อน เพื่อให้ getCommissionToday อ่านได้สะอาด
      SpreadsheetApp.flush(); // force flush ก่อนอ่านค่าคอม
      pushAdminEditNotify(ADMIN_USER_ID, staffName, session.service, oldI.price, nPrice);
      return replyFlexEditSuccess(replyToken, staffName, session.service, nPrice, session.recordId, userId);
    }
    return replyText(replyToken, '❌ กรุณาใส่ตัวเลขราคาค่ะ');
  }

  // หักสมาชิก — รับรหัส 4 หลัก
  if (session && session.step === 'ASK_MEMBER_CODE') {
    var code = msgText.replace(/[^0-9]/g, '');
    if (code.length === 4) {
      var mToCut = getMemberByCode(code);
      if (!mToCut) return replyText(replyToken, '❌ ไม่พบรหัสสมาชิก ' + code + '\nกรุณาตรวจสอบอีกครั้งค่ะ');
      if (mToCut.balance < session.price) return replyFlexShortage(replyToken, mToCut.name, mToCut.balance, session.price, code, session.recordId);

      var oldB = mToCut.balance, newB = oldB - session.price;
      if (updateRecordToMember(session.recordId, mToCut.phone)) {
        updateMemberBalance(mToCut.phone, session.price);
        writeLog('หักยอดสมาชิก', staffName, 'รหัส: ' + code + ' ยอด: ' + session.price, session.recordId);
        writeMemberLog(mToCut.phone, 'ใช้บริการ (หักยอด #' + session.recordId + ')', '-' + session.price, oldB, newB, staffName);
        var rInfo     = getRecordInfo(session.recordId);
        var commToday = getCommissionToday(userId);
        clearSession(userId);
        if (mToCut.lineId && mToCut.lineId !== '-') {
          pushToCustomer(mToCut.lineId, getFlexNotifyCut(rInfo.service, rInfo.price, newB, oldB, staffName, mToCut.phone));
        }
        return replyFlexMemberSuccess(replyToken, staffName, rInfo.service, rInfo.price, code,mToCut.name, newB, commToday, oldB);
      }
    }
    return replyText(replyToken, '💳 กรุณาพิมพ์รหัสสมาชิก 4 หลักค่ะ');
  }

  // เติมเงิน (กรณียอดไม่พอ)
  if (session && session.step === 'WAIT_TOPUP_AMOUNT') {
    var am = parseFloat(msgText.replace(/,/g, ''));
    if (!isNaN(am) && am > 0) {
      var credit = calcTopupCredit(am);
      var bonus  = getTopupBonus(am);
      return replyFlexConfirmTopupAndCut(replyToken, session.memberCode, am, credit, bonus, session.recordId);
    }
    return replyText(replyToken, '❌ กรุณาใส่ตัวเลขยอดเงินค่ะ');
  }

  // เช็คหทดอายุ
  if (msgText === 'หมดอายุ' || msgText === 'ใกล้หมด' || msgText === 'เช็คหมดอายุ') {
        clearSession(userId);
      return replyExpiringSoon(replyToken);
    }

// ── ขอลบรายการ — เช็คซ้ำ ──
if (msgText.indexOf('ขอลบรายการ_') === 0) {
  var parts    = msgText.split('_');
  var rId      = parts[1];
  var staffWho = parts[2] || staffName;
  ensureRecordColumns();
  var recSheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  var recRow    = parseInt(rId);
  var curStatus = String(recSheet.getRange(recRow, 10).getValue());

  if (curStatus === 'ยกเลิก') {
    return replyText(replyToken, '⚠️ รายการนี้ถูกยกเลิกไปแล้วค่ะ', false);
  }
  if (curStatus === 'รออนุมัติ') {
    return replyText(replyToken, '⚠️ ส่งคำขอยกเลิกไปแล้ว รอคุณมายด์อนุมัติอยู่ค่ะ', false);
  }

  recSheet.getRange(recRow, 10).setValue('รออนุมัติ');
  recSheet.getRange(recRow, 12).setValue(staffWho);
  recSheet.getRange(recRow, 13).setValue(new Date());

  var rInfo = getRecordInfo(rId);
  pushAdminVoidRequest(ADMIN_USER_ID, staffWho, rInfo.service, rInfo.price, rId, userId);

  return replyText(replyToken, '📨 ส่งคำขอยกเลิกให้คุณมายด์แล้วค่ะ\nรอการอนุมัติสักครู่นะคะ', false);
}

// ── เจ้าของอนุมัติ/ปฏิเสธ ────────────────────────────────
if (msgText.indexOf('อนุมัติลบ_') === 0 || msgText.indexOf('ปฏิเสธลบ_') === 0) {

  // เฉพาะ Admin เท่านั้น
  if (String(userId) !== String(ADMIN_USER_ID)) {
    return replyText(replyToken, '❌ คำสั่งนี้เฉพาะคุณมายด์เท่านั้นค่ะ', false);
  }

  var parts      = msgText.split('_');
  var action     = parts[0]; // อนุมัติลบ หรือ ปฏิเสธลบ
  var rId        = parts[1];
  var staffWho   = parts[2] || '-';
  var staffUid   = parts[3] || '';

  var recSheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  var recRow     = parseInt(rId);
  var rInfo      = getRecordInfo(rId);

  if (action === 'อนุมัติลบ') {
    // ── VOID ──
    recSheet.getRange(recRow, 10).setValue('ยกเลิก');
    recSheet.getRange(recRow, 11).setValue(new Date()); // เวลาอนุมัติ

    // เช็คว่าเป็น Member หรือเปล่า → คืนเครดิต
    var payment = String(recSheet.getRange(recRow, 7).getValue());
    var phone   = String(recSheet.getRange(recRow, 8).getValue()).replace(/'/g, '');
    if (payment === 'Member' && phone && phone !== '-') {
      var member = getMemberByPhone(phone);
      if (member) {
        var oldBal = member.balance;
        var newBal = oldBal + rInfo.price;
        SpreadsheetApp.getActiveSpreadsheet()
          .getSheetByName(SHEET_MEMBER).getRange(member.row, 3).setValue(newBal);
        writeMemberLog(phone, 'คืนเครดิต (ยกเลิกรายการ #' + rId + ')', 
          '+' + rInfo.price, oldBal, newBal, 'คุณมายด์');
        // แจ้งลูกค้า
        if (member.lineId && member.lineId !== '-') {
          pushToCustomer(member.lineId, {
            type: 'text',
            text: '💰 คืนเครดิตค่ะ!\n\n📋 ' + rInfo.service + 
                  ' ฿' + rInfo.price.toLocaleString() +
                  '\n💳 ยอดคงเหลือ: ฿' + newBal.toLocaleString()
          });
        }
      }
    }

    // บันทึก Log
    writeLog('ยกเลิกรายการ (VOID)', 'คุณมายด์',
      'อนุมัติลบโดย Admin | พนักงาน: ' + staffWho + 
      ' | ' + rInfo.service + ' ฿' + rInfo.price, rId);

    // แจ้งพนักงาน (push ไปที่ userId ของพนักงาน)
    if (staffUid && staffUid !== ADMIN_USER_ID) {
      callLineAPI('push', {
        to: staffUid,
        messages: [{ 
          type: 'text', 
          text: '✅ คุณมายด์อนุมัติยกเลิกรายการแล้วค่ะ\n📋 ' + 
                rInfo.service + ' ฿' + rInfo.price.toLocaleString() 
        }]
      }, false);
    }

    return replyFlexVoidApproved(replyToken, staffWho, rInfo.service, rInfo.price, rId);

  } else {
    // ── ปฏิเสธ → คืนสถานะ ──
    recSheet.getRange(recRow, 10).setValue('');
    recSheet.getRange(recRow, 11).setValue('');
    recSheet.getRange(recRow, 12).setValue('');
    recSheet.getRange(recRow, 13).setValue('');

    // แจ้งพนักงาน
    if (staffUid && staffUid !== ADMIN_USER_ID) {
      callLineAPI('push', {
        to: staffUid,
        messages: [{ 
          type: 'text', 
          text: '❌ คุณมายด์ไม่อนุมัติการยกเลิกรายการค่ะ\n📋 ' + 
                rInfo.service + ' ฿' + rInfo.price.toLocaleString() 
        }]
      }, false);
    }

    return replyText(replyToken, 
      '❌ ปฏิเสธคำขอยกเลิกแล้วค่ะ\nรายการยังคงอยู่ตามเดิม', false);
  }
}

  // ============================================================
  // [F] Fallback
  // ============================================================
    return replyText(replyToken,
    '❌ คำสั่งไม่ถูกต้องค่ะ\n\n' +
    '💅 บันทึกงาน:\n   [บริการ] [ราคา]\n   เช่น: เล็บ 500\n\n' +
    '📅 จองนัด:\n   [วันที่][เดือน] [เวลา] [บริการ] [ชื่อลูกค้า]\n   เช่น: 8พค 10.30 เจลมือ คุณออม\n\n' +
    '📋 ดูนัด:\n   จองวันนี้ · จองพรุ่งนี้\n\n' +
    '💳 หักสมาชิก:\n   กด "หักสมาชิก" แล้วพิมพ์รหัส 4 หลัก\n\n' +
    '💰 เติมเงิน:\n   เติม [รหัส4หลัก] [ยอด]\n   เช่น: เติม 1234 5000\n\n' +
    '🆕 สมัครสมาชิก:\n   สมัคร [เบอร์] [ชื่อ] [รหัส4หลัก] [ยอด]\n   เช่น: สมัคร 0812345678 มายด์ 2847 5000', false);
}


// ============================================================
// [5] FLEX MESSAGES — พนักงาน
// ============================================================


function replyFlexRecord(token, staff, service, price, recordId, userId, payment, accountType) {
  var comm = getCommissionToday(userId);
  var date = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
 
  // สี/label ตาม payment
  var payColor  = '#2DCB8E', payLabel = '💵 เงินสด';
  var accLabel  = 'ในร้าน';
  if (payment === 'Credit') {
    payColor  = '#9B72CF'; payLabel = '💳 รูดบัตร';
    var netAfterFee = Math.round(price * (1 - 0.0258));
    accLabel = 'กสิกร · สุทธิ ฿' + netAfterFee.toLocaleString() + ' (หัก 2.58%)';
  } else if (payment === 'Transfer') {
    payColor  = '#5B9BD5'; payLabel = '📲 โอน';
    accLabel  = 'กสิกร';                            // ✅ เปลี่ยนจาก ไทยพาณิชย์ → กสิกร
  } else if (payment === 'Cash' && accountType === 'สด') {   // ✅ เปลี่ยนจาก 'ไทยพาณิชย์'
    payColor  = '#F0B84A'; payLabel = '💵 เงินสด';
    accLabel  = 'ในร้าน';
  }
 
  var accRow = accLabel ? [{
    type: 'box', layout: 'horizontal',
    contents: [
      { type: 'text', text: '🏦 บัญชี', size: 'sm', color: '#888888', flex: 2 },
      { type: 'text', text: accLabel, size: 'sm', weight: 'bold', color: payColor, align: 'end', flex: 4, wrap: true }
    ]
  }] : [];
 
  var flex = {
    type: 'bubble', size: 'mega',
    header: {
      type: 'box', layout: 'vertical', backgroundColor: '#FF6B9D', paddingAll: '20px',
      contents: [{
        type: 'box', layout: 'horizontal',
        contents: [
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'บันทึกสำเร็จ 🎉', color: '#ffffff', weight: 'bold', size: 'lg' },
            { type: 'text', text: 'อย่าลืมตรวจสอบรายการที่จดด้วยนะคะ', color: '#FFE0EC', size: 'xs', margin: 'xs' }
          ]},
          { type: 'button',
            action: { type: 'postback', label: '✕', data: 'ขอลบรายการ_' + recordId + '_' + staff },
            style: 'secondary', color: '#E8457A', height: 'sm', flex: 0, adjustMode: 'shrink-to-fit' }
        ]
      }]
    },
    body: {
      type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
      contents: [
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'พนักงาน : ' + staff, size: 'md', weight: 'bold' },
          { type: 'text', text: date, size: 'xs', color: '#aaaaaa', align: 'end' }
        ]},
        { type: 'separator', margin: 'md' },
        { type: 'box', layout: 'horizontal', margin: 'lg', contents: [
          { type: 'text', text: service, weight: 'bold', flex: 1 },
          { type: 'text', text: '฿' + price.toLocaleString(), size: 'xl', color: '#FF6B9D', weight: 'bold', align: 'end', flex: 1 }
        ]},
        // Payment badge
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: '💳 ชำระ', size: 'sm', color: '#888888', flex: 2 },
          { type: 'text', text: payLabel, size: 'sm', weight: 'bold', color: payColor, align: 'end', flex: 4 }
        ]}
      ].concat(accRow).concat([
        { type: 'text', text: 'ค่าคอมฯ สะสมวันนี้: ฿' + comm.toLocaleString(), size: 'sm', color: '#888888' },
        { type: 'box', layout: 'horizontal', spacing: 'md', margin: 'xl', contents: [
          { type: 'button', style: 'secondary', height: 'sm',
            action: { type: 'postback', label: '✏️ แก้ไข', data: 'แก้ไขราคา_' + recordId + '_' + service } }
        ]},
        { type: 'button', style: 'primary', color: '#4A90D9', margin: 'md',
          action: { type: 'postback', label: '💳 หักสมาชิก (Member)', data: 'หักสมาชิก_' + recordId + '_' + price } }
      ])
    }
  };
  callLineAPI('reply', { replyToken: token, messages: [{ type: 'flex', altText: 'บันทึกสำเร็จ', contents: flex }] }, false);
}



function replyFlexEditSuccess(token, staff, service, price, recordId, userId) {
  var comm = getCommissionToday(userId);
  var date = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
  var flex = {
    type: 'bubble', size: 'mega',
    header: { type: 'box', layout: 'vertical', backgroundColor: '#1DB446', paddingAll: '20px', contents: [
      { type: 'text', text: 'แก้ไขราคาสำเร็จ ✅', color: '#ffffff', weight: 'bold', size: 'lg' },
      { type: 'text', text: 'อย่าลืมตรวจสอบรายการที่จดด้วยนะคะ', color: '#E8F5E9', size: 'xs', margin: 'xs' }
    ]},
    body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', contents: [
      { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: 'พนักงาน : ' + staff, size: 'md', weight: 'bold' }, { type: 'text', text: date, size: 'xs', color: '#aaaaaa', align: 'end' }] },
      { type: 'separator', margin: 'md' },
      { type: 'box', layout: 'horizontal', margin: 'lg', contents: [{ type: 'text', text: service, weight: 'bold', flex: 1 }, { type: 'text', text: '฿' + price.toLocaleString(), size: 'xl', color: '#1DB446', weight: 'bold', align: 'end', flex: 1 }] },
      { type: 'text', text: 'ค่าคอมฯ สะสมวันนี้: ฿' + comm.toLocaleString(), size: 'sm', color: '#888888' },
      { type: 'button', style: 'primary', color: '#4A90D9', margin: 'xl', action: { type: 'postback', label: '💳 หักสมาชิก (Member)', data: 'หักสมาชิก_' + recordId + '_' + price } }
    ]}
  };
  callLineAPI('reply', { replyToken: token, messages: [{ type: 'flex', altText: 'แก้ไขราคาสำเร็จ', contents: flex }] }, false);
}

// replyFlexTopupSuccess — แสดงผลเติมเงินสำเร็จให้พนักงาน (รวมโบนัส)
function replyFlexTopupSuccess(token, staff, mCode, memberName, payAmount, creditAmount, bonusAmount, newBalance, payment) {
  var date = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
  var bonusRow = bonusAmount > 0 ? [{ type: 'box', layout: 'horizontal', contents: [
    { type: 'text', text: '🎁 โบนัส', size: 'sm', color: '#1DB446' },
    { type: 'text', text: '+฿' + bonusAmount.toLocaleString(), size: 'sm', align: 'end', weight: 'bold', color: '#1DB446' }
  ]}] : [];
 
  // badge ช่องทางชำระ
  var payColor = '#2DCB8E', payLabel = '💵 เงินสด';
  var accLabel = 'เงินในร้าน';
  if (payment === 'Credit') {
    payColor  = '#9B72CF'; payLabel = '💳 รูดบัตร';
    var net   = Math.round(payAmount * (1 - 0.0258));
    accLabel  = 'กสิกร · สุทธิ ฿' + net.toLocaleString() + ' (หัก 2.58%)';
  } else if (payment === 'Transfer') {
    payColor  = '#5B9BD5'; payLabel = '📲 โอน';
    accLabel  = 'กสิกร';
  }
 
  var payRow = [
    { type: 'box', layout: 'horizontal', contents: [
      { type: 'text', text: '💳 ชำระ', size: 'sm', color: '#888888' },
      { type: 'text', text: payLabel, size: 'sm', weight: 'bold', color: payColor, align: 'end' }
    ]},
    { type: 'box', layout: 'horizontal', contents: [
      { type: 'text', text: '🏦 บัญชี', size: 'sm', color: '#888888' },
      { type: 'text', text: accLabel, size: 'sm', weight: 'bold', color: payColor, align: 'end', wrap: true }
    ]}
  ];
 
  var flex = {
    type: 'bubble', size: 'mega',
    header: { type: 'box', layout: 'vertical', backgroundColor: '#0A7055', paddingAll: '20px', contents: [
      { type: 'text', text: 'เติมเงินสำเร็จ! 💰', color: '#ffffff', weight: 'bold', size: 'lg' },
      { type: 'text', text: 'Nail Kloset Member Card', color: '#7BC9A8', size: 'xs', margin: 'xs' }
    ]},
    body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', contents: [
      { type: 'box', layout: 'horizontal', contents: [
        { type: 'text', text: 'พนักงาน : ' + staff, size: 'sm', color: '#888888' },
        { type: 'text', text: date, size: 'xxs', color: '#aaaaaa', align: 'end' }
      ]},
      { type: 'separator', margin: 'md' },
      { type: 'box', layout: 'vertical', margin: 'lg', spacing: 'sm', contents: [
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'รหัสสมาชิก', size: 'sm', color: '#555555' },
          { type: 'text', text: mCode + '  (' + memberName + ')', size: 'sm', align: 'end', weight: 'bold' }
        ]},
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'ยอดเติมเงิน', size: 'sm', color: '#555555' },
          { type: 'text', text: '฿' + payAmount.toLocaleString(), size: 'sm', align: 'end', weight: 'bold' }
        ]}
      ].concat(bonusRow).concat(payRow) },
      { type: 'box', layout: 'horizontal', margin: 'lg', backgroundColor: '#f0faf5', paddingAll: '15px', cornerRadius: 'md', contents: [
        { type: 'text', text: 'ยอดเงินสุทธิ', weight: 'bold', size: 'md', color: '#0A7055', gravity: 'center' },
        { type: 'text', text: '฿' + newBalance.toLocaleString(), size: 'xl', align: 'end', weight: 'bold', color: '#0A7055' }
      ]}
    ]}
  };
  callLineAPI('reply', { replyToken: token, messages: [{ type: 'flex', altText: 'เติมเงินสำเร็จ', contents: flex }] }, false);
}



function replyFlexMemberSuccess(token, staff, service, price, memberCode,memberName, balance, commToday, balBefore) {
  var flex = getFlexMemberSuccessContents(staff, service, price, memberCode,memberName, balance, commToday, balBefore);
  callLineAPI('reply', { replyToken: token, messages: [{ type: 'flex', altText: 'หักสมาชิกสำเร็จ', contents: flex }] }, false);
}

// แสดงรหัสสมาชิก 4 หลักแทนเบอร์โทร
function getFlexMemberSuccessContents(staff, service, price, memberCode, memberName, balance, commToday, balBefore) {
  var date = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
  
  return {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#FF6B9D',
      paddingAll: '20px',
      contents: [
        { type: 'text', text: 'หักสมาชิกสำเร็จ! ✅', color: '#ffffff', weight: 'bold', size: 'lg' },
        { type: 'text', text: 'อย่าลืมตรวจสอบรายการที่จดด้วยนะคะ', color: '#FFE0EC', size: 'xs', margin: 'xs' }
      ]
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      paddingAll: '20px',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'พนักงาน : ' + staff, size: 'sm', weight: 'bold', flex: 1 },
            { type: 'text', text: date, size: 'xxs', color: '#aaaaaa', align: 'end', gravity: 'bottom' }
          ]
        },
        { type: 'separator', margin: 'md' },
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          margin: 'md',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'รหัสสมาชิก', size: 'sm', color: '#555555' },
                { type: 'text', text: memberCode + ' (' + memberName + ')', size: 'sm', align: 'end', weight: 'bold', wrap: true }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'sm',
              contents: [
                { type: 'text', text: 'ยอดก่อนหัก', size: 'sm', color: '#888888', flex: 1 },
                { type: 'text', text: '฿' + (balBefore || 0).toLocaleString(), size: 'sm', weight: 'bold', align: 'end' }
              ]
            }
          ] // Fixed missing bracket here
        },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'lg',
          contents: [
            { type: 'text', text: service, weight: 'bold', flex: 1, gravity: 'center' },
            { type: 'text', text: '฿' + price.toLocaleString(), size: 'xl', color: '#FF6B9D', weight: 'bold', align: 'end', flex: 1 }
          ]
        },
        { type: 'separator', margin: 'md' },
        {
          type: 'box',
          layout: 'horizontal',
          backgroundColor: '#FFF0F6',
          paddingAll: '12px',
          cornerRadius: 'md',
          margin: 'md',
          contents: [
            { type: 'text', text: 'ยอดคงเหลือสุทธิ', size: 'sm', color: '#E8457A', weight: 'bold', gravity: 'center' },
            { type: 'text', text: '฿' + balance.toLocaleString(), size: 'xl', color: '#E8457A', weight: 'bold', align: 'end' }
          ]
        },
        {
          type: 'text', 
          text: 'ค่าคอมฯ สะสมวันนี้: ฿' + commToday.toLocaleString(), 
          size: 'xs', 
          color: '#888888', 
          margin: 'md', 
          align: 'center' 
        }
      ]
    }
  };
}

// ยอดเงินไม่พอ — แสดงรหัส 4 หลัก
function replyFlexShortage(token, name, balance, price, memberCode, recordId) {
  var shortfall = price - balance;

  // กรณี balance = 0 → ไม่มียอดเมมเลย ไม่ต้อง split
  // แสดงแค่ปุ่มเติมเงิน หรือปุ่มจ่ายเต็มแทน
  var actionButtons = [];

  if (balance > 0) {
    // มียอดเมมบางส่วน → split ได้
    actionButtons.push(
      { type: 'button', style: 'primary', color: '#1DB446', height: 'sm', margin: 'sm',
        action: { type: 'postback', label: '💵 ส่วนเกินจ่ายเงินสด ฿' + shortfall.toLocaleString(),
          data: 'จ่ายส่วนต่าง_' + memberCode + '_' + recordId + '_' + price + '_' + balance + '_Cash' }
      }
    );
  }

  // ปุ่มเติมเงินแสดงเสมอ
  actionButtons.push(
    { type: 'button', style: 'secondary', height: 'sm', margin: 'xl',
      action: { type: 'postback', label: '➕ เติมเงินเมมเบอร์เพิ่ม',
        data: 'เตรียมเติมเงิน_' + memberCode + '_' + recordId }
    }
  );

  var headerText = balance === 0 ? '❌ ไม่มียอดเมมเบอร์' : '⚠️ ยอดเงินไม่พอ';
  var flex = {
    type: 'bubble', size: 'mega',
    header: {
      type: 'box', layout: 'vertical', backgroundColor: '#FF9800', paddingAll: '20px',
      contents: [
        { type: 'text', text: headerText, weight: 'bold', color: '#ffffff', size: 'lg' },
        { type: 'text', text: 'คุณ ' + name + ' (รหัส ' + memberCode + ')', color: '#FFF3E0', size: 'xs', margin: 'xs' }
      ]
    },
    body: {
      type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
      contents: [
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'ราคาบริการ', size: 'sm', color: '#888888', flex: 1 },
          { type: 'text', text: '฿' + price.toLocaleString(), size: 'sm', weight: 'bold', align: 'end' }
        ]},
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'ยอดเมมเบอร์', size: 'sm', color: '#888888', flex: 1 },
          { type: 'text', text: '฿' + balance.toLocaleString(), size: 'sm', weight: 'bold', align: 'end' }
        ]},
        { type: 'box', layout: 'horizontal', backgroundColor: '#FFF3E0', paddingAll: '12px', cornerRadius: 'md', contents: [
          { type: 'text', text: 'ขาดอีก', size: 'sm', color: '#FF6B6B', weight: 'bold', gravity: 'center' },
          { type: 'text', text: '฿' + shortfall.toLocaleString(), size: 'xl', color: '#FF6B6B', weight: 'bold', align: 'end' }
        ]},
        { type: 'separator', margin: 'md' },
        { type: 'text', 
          text: balance === 0 ? 'ลูกค้าไม่มียอดเมม กรุณาเติมเงินก่อนค่ะ' : 'เลือกวิธีชำระส่วนที่เหลือ', 
          size: 'sm', color: '#888888', align: 'center', margin: 'md' 
        }
      ].concat(actionButtons)
    }
  };
  callLineAPI('reply', { replyToken: token, messages: [{ type: 'flex', altText: 'ยอดเงินไม่พอ', contents: flex }] }, false);
}

// ยืนยันเติมและตัด — แสดงโบนัส
function replyFlexConfirmTopupAndCut(token, memberCode, payAmount, creditAmount, bonusAmount, recordId) {
  var bonusLine = bonusAmount > 0 ?
    { type: 'text', text: '🎁 โบนัส +฿' + bonusAmount.toLocaleString() + ' (ได้เครดิต ฿' + creditAmount.toLocaleString() + ')', size: 'sm', color: '#1DB446', align: 'center', margin: 'sm' } :
    { type: 'text', text: 'ได้รับเครดิต ฿' + creditAmount.toLocaleString(), size: 'sm', color: '#888888', align: 'center', margin: 'sm' };

  var flex = { type: 'bubble', body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', contents: [
    { type: 'text', text: 'ตรวจสอบการเติมเงิน', weight: 'bold', size: 'md', color: '#4A90D9' },
    { type: 'text', text: 'รหัสสมาชิก: ' + memberCode, size: 'sm', color: '#888888' },
    { type: 'text', text: '฿' + payAmount.toLocaleString(), size: 'xxl', weight: 'bold', color: '#1DB446', align: 'center', margin: 'lg' },
    bonusLine,
    { type: 'button', style: 'primary', color: '#1DB446', height: 'sm', margin: 'lg', action: { type: 'postback', label: 'ยืนยันการเติมเงินและตัดยอด', data: 'ยืนยันเติมและตัด_' + memberCode + '_' + payAmount + '_' + recordId } },
    { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
      { type: 'button', style: 'secondary', height: 'sm', action: { type: 'postback', label: '✏️ แก้ไขยอด', data: 'เตรียมเติมเงิน_' + memberCode + '_' + recordId } },
      { type: 'button', style: 'secondary', height: 'sm', color: '#FF6B6B', action: { type: 'postback', label: '❌ ยกเลิก', data: 'ยกเลิก' } }
    ]}
  ]}};
  callLineAPI('reply', { replyToken: token, messages: [{ type: 'flex', altText: 'ยืนยันการเติมเงิน', contents: flex }] }, false);
}

function pushAdminEditNotify(adminId, staff, service, oldPrice, newPrice) {
  var date = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
  var flex = {
    type: 'bubble', size: 'mega',
    header: { type: 'box', layout: 'vertical', backgroundColor: '#FF9800', paddingAll: '20px', contents: [
      { type: 'text', text: '⚠️ แจ้งเตือน: แก้ไขราคา', color: '#ffffff', weight: 'bold', size: 'lg' },
      { type: 'text', text: 'มีการเปลี่ยนแปลงยอดเงินในระบบ', color: '#FFF3E0', size: 'xs', margin: 'xs' }
    ]},
    body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', contents: [
      { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: 'พนักงาน', size: 'sm', color: '#888888', flex: 2 }, { type: 'text', text: staff, size: 'sm', color: '#111111', align: 'end', weight: 'bold', flex: 4 }] },
      { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: 'บริการ', size: 'sm', color: '#888888', flex: 2 }, { type: 'text', text: service, size: 'sm', color: '#111111', align: 'end', weight: 'bold', flex: 4 }] },
      { type: 'separator', margin: 'lg' },
      { type: 'box', layout: 'horizontal', margin: 'lg', contents: [
        { type: 'box', layout: 'vertical', flex: 1, contents: [{ type: 'text', text: 'ราคาเดิม', size: 'xs', color: '#aaaaaa', align: 'center' }, { type: 'text', text: '฿' + oldPrice.toLocaleString(), size: 'md', color: '#FF5252', decoration: 'line-through', align: 'center', weight: 'bold' }] },
        { type: 'box', layout: 'vertical', width: '20px', justifyContent: 'center', contents: [{ type: 'text', text: '➡️', size: 'sm', color: '#aaaaaa', align: 'center' }] },
        { type: 'box', layout: 'vertical', flex: 1, contents: [{ type: 'text', text: 'ราคาใหม่', size: 'xs', color: '#aaaaaa', align: 'center' }, { type: 'text', text: '฿' + newPrice.toLocaleString(), size: 'lg', color: '#1DB446', align: 'center', weight: 'bold' }] }
      ]},
      { type: 'separator', margin: 'lg' },
      { type: 'box', layout: 'horizontal', margin: 'md', contents: [{ type: 'text', text: 'เวลาที่แก้ไข', size: 'xxs', color: '#aaaaaa' }, { type: 'text', text: date, size: 'xxs', color: '#aaaaaa', align: 'end' }] }
    ]}
  };
  callLineAPI('push', { to: adminId, messages: [{ type: 'flex', altText: 'แจ้งเตือนแก้ไขราคา', contents: flex }] }, false);
}

function replyFlexConfirmReg(token, name) {
  var flex = {
    type: 'bubble', size: 'mega',
    header: { type: 'box', layout: 'vertical', backgroundColor: '#4A90D9', contents: [{ type: 'text', text: 'ลงทะเบียนพนักงาน 📝', color: '#ffffff', weight: 'bold', size: 'md', align: 'center' }] },
    body: { type: 'box', layout: 'vertical', spacing: 'md', contents: [
      { type: 'text', text: 'ชื่อพนักงาน: ' + name, weight: 'bold', size: 'lg', align: 'center' },
      { type: 'text', text: 'กรุณากดปุ่มด้านล่างเพื่อยืนยันข้อมูลค่ะ', size: 'xs', color: '#888888', align: 'center' },
      { type: 'button', style: 'primary', color: '#4A90D9', margin: 'lg', action: { type: 'message', label: '✅ ยืนยันลงทะเบียน', text: 'ยืนยันลงทะเบียน' } },
      { type: 'button', style: 'secondary', margin: 'sm', action: { type: 'message', label: '❌ แก้ไขชื่อ', text: 'ลงทะเบียน' } }
    ]}
  };
  callLineAPI('reply', { replyToken: token, messages: [{ type: 'flex', altText: 'ยืนยันการลงทะเบียนพนักงาน', contents: flex }] }, false);
}

function replyFlexSummary(token, staff, data, label) {
  var rows = [], themeColor = data.isAdmin ? '#1DB446' : '#4A90D9';
  Object.keys(data.byGroup).forEach(function(k) {
    rows.push({ type: 'box', layout: 'horizontal', margin: 'sm', contents: [{ type: 'text', text: k, size: 'sm', flex: 3 }, { type: 'text', text: '฿' + Math.round(data.byGroup[k]).toLocaleString(), size: 'sm', align: 'end', weight: 'bold', flex: 2 }] });
  });
  var flex = {
    type: 'bubble', size: 'mega',
    header: { type: 'box', layout: 'vertical', backgroundColor: themeColor, paddingAll: '20px', contents: [{ type: 'text', text: '📊 สรุป' + label, color: '#ffffff', weight: 'bold', size: 'lg' }] },
    body: { type: 'box', layout: 'vertical', paddingAll: '20px', contents: [
      { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: 'พนักงาน : ' + staff, weight: 'bold' }, { type: 'text', text: data.periodLabel, size: 'xs', color: '#aaaaaa', align: 'end' }] },
      { type: 'separator', margin: 'md' },
      { type: 'box', layout: 'vertical', margin: 'lg', contents: rows.length > 0 ? rows : [{ type: 'text', text: 'ไม่มีข้อมูล' }] },
      { type: 'separator', margin: 'lg' },
      { type: 'box', layout: 'horizontal', margin: 'lg', contents: [{ type: 'text', text: 'รวมสุทธิ', weight: 'bold' }, { type: 'text', text: '฿' + data.total.toLocaleString(), size: 'xl', color: themeColor, weight: 'bold', align: 'end' }] }
    ]}
  };
  callLineAPI('reply', { replyToken: token, messages: [{ type: 'flex', altText: 'สรุปยอด', contents: flex }] }, false);
}

function getFlexTopupSuccessContents(staff, mCode, memberName, payAmount, creditAmount, bonusAmount, newBalance) {
  var date = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
  var bonusRow = bonusAmount > 0 ? [{ type: 'box', layout: 'horizontal', contents: [
    { type: 'text', text: '🎁 โบนัส', size: 'sm', color: '#1DB446' },
    { type: 'text', text: '+฿' + bonusAmount.toLocaleString(), size: 'sm', align: 'end', weight: 'bold', color: '#1DB446' }
  ]}] : [];

  return {
    type: 'bubble', size: 'mega',
    header: { type: 'box', layout: 'vertical', backgroundColor: '#0A7055', paddingAll: '20px', contents: [{ type: 'text', text: 'เติมเงินสำเร็จ! 💰', color: '#ffffff', weight: 'bold', size: 'lg' }] },
    body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', contents: [
      { type: 'box', layout: 'horizontal', contents: [
        { type: 'text', text: 'พนักงาน : ' + staff, size: 'sm', color: '#888888' },
        { type: 'text', text: date, size: 'xxs', color: '#aaaaaa', align: 'end' }
      ]},
      { type: 'separator', margin: 'md' },
      { type: 'box', layout: 'vertical', spacing: 'sm', margin: 'md', contents: [
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'รหัสสมาชิก', size: 'sm', color: '#555555' },
          { type: 'text', text: mCode + '  (' + memberName + ')', size: 'sm', align: 'end', weight: 'bold' }
        ]},
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'ยอดเติมเงิน', size: 'sm', color: '#555555' },
          { type: 'text', text: '฿' + payAmount.toLocaleString(), size: 'sm', align: 'end', weight: 'bold' }
        ]}
      ].concat(bonusRow)},
      { type: 'box', layout: 'horizontal', margin: 'lg', backgroundColor: '#f0faf5', paddingAll: '12px', cornerRadius: 'md', contents: [
        { type: 'text', text: 'ยอดสุทธิ (หลังเติม)', size: 'sm', color: '#0A7055', weight: 'bold', gravity: 'center' },
        { type: 'text', text: '฿' + newBalance.toLocaleString(), size: 'xl', color: '#0A7055', weight: 'bold', align: 'end' }
      ]}
    ]}
  };
}


function replyFlexMemberBalance(token, member) {
  var now = new Date();
  var expiry = member.expiry ? new Date(member.expiry) : null;
  var daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;

  var expStr = '-', expColor = '#888888', expLabel = '';
  if (expiry && !isNaN(expiry)) {
    var thMonths = ['','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    expStr = expiry.getDate() + ' ' + thMonths[expiry.getMonth()+1] + ' ' + (expiry.getFullYear()+543);
    if (daysLeft <= 0)       { expColor = '#FF4444'; expLabel = '⚠️ หมดอายุแล้ว'; }
    else if (daysLeft <= 30) { expColor = '#FF6B6B'; expLabel = '🔴 เหลือ ' + daysLeft + ' วัน'; }
    else if (daysLeft <= 90) { expColor = '#FF9800'; expLabel = '🟡 เหลือ ' + daysLeft + ' วัน'; }
    else                     { expColor = '#1DB446'; expLabel = '🟢 เหลือ ' + daysLeft + ' วัน'; }
  }

  var lowBal = member.balance < 500;
  var phone  = String(member.phone || '-').replace(/'/g, '');

  var flex = {
    type: 'bubble', size: 'mega',
    header: {
      type: 'box', layout: 'vertical',
      backgroundColor: '#FFF085', paddingAll: '22px',
      contents: [
        { type: 'text', text: 'Nail Kloset', color: '#FF6B9D', weight: 'bold', size: 'lg' },
        { type: 'text', text: 'Member Card', color: '#8A7090', size: 'xs', margin: 'xs' }
      ]
    },
    body: {
      type: 'box', layout: 'vertical', paddingAll: '22px', spacing: 'none',
      contents: [
        // ชื่อ + รหัส
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: '👤 ' + (member.name || '-'), weight: 'bold', size: 'xl', color: '#1A1025', flex: 1, gravity: 'center' },
          { type: 'text', text: 'รหัส ' + (member.memberCode || '-'), size: 'sm', color: '#8A7090', align: 'end', gravity: 'center' }
        ]},
        { type: 'text', text: '📞 ' + phone, size: 'sm', color: '#8A7090', margin: 'sm' },

        { type: 'separator', margin: 'xl' },

        // ยอดเงินคงเหลือ — เน้น
        { type: 'box', layout: 'vertical', margin: 'xl',
          backgroundColor: lowBal ? '#fff5f5' : '#f0fff8',
          paddingAll: '20px', cornerRadius: 'xl',
          contents: [
            { type: 'text', text: 'ยอดเงินคงเหลือ', size: 'sm',
              color: lowBal ? '#E8457A' : '#0A7055', weight: 'bold', align: 'center' },
            { type: 'text', text: '฿' + (member.balance || 0).toLocaleString(),
              size: 'xxl', weight: 'bold', align: 'center', margin: 'sm',
              color: lowBal ? '#E8457A' : '#0A7055' },
            { type: 'text',
              text: lowBal ? '⚠️ ยอดเงินใกล้หมด กรุณาเติมเงินค่ะ' : ' ',
              size: 'xs', color: '#E8457A', align: 'center', margin: 'xs' }
          ]
        },

        { type: 'separator', margin: 'xl' },

        // วันหมดอายุ
        { type: 'box', layout: 'horizontal', margin: 'xl', contents: [
          { type: 'text', text: '📅 วันหมดอายุ', size: 'sm', color: '#888888', flex: 2, gravity: 'center' },
          { type: 'box', layout: 'vertical', flex: 3, contents: [
            { type: 'text', text: expStr, size: 'sm', weight: 'bold', color: '#1A1025', align: 'end' },
            { type: 'text', text: expLabel, size: 'xs', color: expColor, align: 'end', margin: 'xs' }
          ]}
        ]}
      ]
    }
  };

  callLineAPI('reply', { replyToken: token, messages: [{ type: 'flex', altText: member.name + ' คงเหลือ ฿' + (member.balance||0).toLocaleString(), contents: flex }] }, false);
}


// Flex ส่งหา Admin พร้อมปุ่มอนุมัติ/ปฏิเสธ
function pushAdminVoidRequest(adminId, staffWho, service, price, rId, staffUid) {
  var date = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
  var flex = {
    type: 'bubble', size: 'mega',
    header: {
      type: 'box', layout: 'vertical', backgroundColor: '#FF9800', paddingAll: '20px',
      contents: [
        { type: 'text', text: '🗑️ คำขอยกเลิกรายการ', color: '#ffffff', weight: 'bold', size: 'lg' },
        { type: 'text', text: 'รอการอนุมัติจากเจ้าของร้าน', color: '#FFF3E0', size: 'xs', margin: 'xs' }
      ]
    },
    body: {
      type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
      contents: [
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'พนักงาน', size: 'sm', color: '#888888', flex: 2 },
          { type: 'text', text: staffWho, size: 'sm', weight: 'bold', align: 'end', flex: 4 }
        ]},
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'บริการ', size: 'sm', color: '#888888', flex: 2 },
          { type: 'text', text: service, size: 'sm', weight: 'bold', align: 'end', flex: 4 }
        ]},
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'ราคา', size: 'sm', color: '#888888', flex: 2 },
          { type: 'text', text: '฿' + price.toLocaleString(), size: 'sm', weight: 'bold', 
            color: '#E8457A', align: 'end', flex: 4 }
        ]},
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'เวลา', size: 'sm', color: '#888888', flex: 2 },
          { type: 'text', text: date, size: 'sm', align: 'end', flex: 4 }
        ]},
        { type: 'separator', margin: 'lg' },
        { 
          type: 'box', layout: 'horizontal', spacing: 'md', margin: 'lg',
          contents: [
            { 
              type: 'button', style: 'primary', color: '#1DB446', flex: 1, height: 'sm',
              action: { 
                type: 'postback', label: '✅ อนุมัติลบ', 
                data: 'อนุมัติลบ_' + rId + '_' + staffWho + '_' + staffUid 
              }
            },
            { 
              type: 'button', style: 'primary', color: '#E8457A', flex: 1, height: 'sm',
              action: { 
                type: 'postback', label: '❌ ไม่อนุมัติ', 
                data: 'ปฏิเสธลบ_' + rId + '_' + staffWho + '_' + staffUid 
              }
            }
          ]
        }
      ]
    }
  };
  callLineAPI('push', {
    to: adminId,
    messages: [{ type: 'flex', altText: '🗑️ คำขอยกเลิกรายการจาก ' + staffWho, contents: flex }]
  }, false);
}

// Flex แสดงผลหลังอนุมัติลบ
function replyFlexVoidApproved(token, staffWho, service, price, rId) {
  var date = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
  var flex = {
    type: 'bubble', size: 'mega',
    header: {
      type: 'box', layout: 'vertical', backgroundColor: '#1DB446', paddingAll: '20px',
      contents: [
        { type: 'text', text: 'อนุมัติยกเลิกสำเร็จ ✅', color: '#ffffff', weight: 'bold', size: 'lg' },
        { type: 'text', text: 'บันทึกสถานะ "ยกเลิก" ลง Sheet แล้วค่ะ', color: '#E8F5E9', size: 'xs', margin: 'xs' }
      ]
    },
    body: {
      type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
      contents: [
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'พนักงาน', size: 'sm', color: '#888888', flex: 2 },
          { type: 'text', text: staffWho, size: 'sm', weight: 'bold', align: 'end', flex: 4 }
        ]},
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'บริการ', size: 'sm', color: '#888888', flex: 2 },
          { type: 'text', text: service, size: 'sm', weight: 'bold', 
            align: 'end', flex: 4, decoration: 'line-through' }
        ]},
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'ราคา', size: 'sm', color: '#888888', flex: 2 },
          { type: 'text', text: '฿' + price.toLocaleString(), size: 'sm', weight: 'bold', 
            color: '#E8457A', align: 'end', flex: 4, decoration: 'line-through' }
        ]},
        { type: 'separator', margin: 'md' },
        { 
          type: 'box', layout: 'horizontal', margin: 'md',
          backgroundColor: '#F1F8E9', paddingAll: '12px', cornerRadius: 'md',
          contents: [
            { type: 'text', text: '📋 สถานะใน Sheet', size: 'sm', color: '#555', gravity: 'center' },
            { type: 'text', text: 'ยกเลิก', size: 'sm', weight: 'bold', 
              color: '#E8457A', align: 'end' }
          ]
        },
        { type: 'text', text: 'Record #' + rId + ' · ' + date, 
          size: 'xxs', color: '#aaaaaa', align: 'center', margin: 'md' }
      ]
    }
  };
  callLineAPI('reply', {
    to: token,
    messages: [{ type: 'flex', altText: 'อนุมัติยกเลิกรายการสำเร็จ', contents: flex }]
  }, false);
}


// ============================================================
// [6] FLEX MESSAGES — ลูกค้า (ใบเสร็จ)
// ============================================================

// ใบเสร็จหักสมาชิก (ชมพู) — ส่งหาลูกค้า
function getFlexNotifyCut(srv, prc, bal, balBefore, staffName, memberPhone) {
  var date = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm').replace(':', '.');
  var balB = (balBefore !== undefined && balBefore !== null) ? balBefore : (bal + prc);
  return {
    type: 'flex', altText: 'ใบเสร็จรับเงิน Nail Kloset',
    contents: {
      type: 'bubble', size: 'mega',
      header: { type: 'box', layout: 'vertical', paddingAll: '20px', backgroundColor: '#E8457A', contents: [
        { type: 'text', text: 'ใบเสร็จรับเงิน ✨', color: '#FFFFFF', size: 'sm', weight: 'bold' },
        { type: 'text', text: 'Nail Kloset', color: '#FFFFFF', size: 'xxl', weight: 'bold', margin: 'sm' },
        { type: 'text', text: 'the crystal ratchapruek', color: '#FFB3CC', size: 'sm', margin: 'xs' }
      ]},
      body: { type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'none', backgroundColor: '#FFFFFF', contents: [
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'พนักงาน : ' + (staffName || '-'), size: 'sm', color: '#555555', flex: 1 },
          { type: 'text', text: date, size: 'sm', color: '#999999', align: 'end' }
        ]},
        { type: 'separator', margin: 'md' },
        { type: 'text', text: 'บริการ', size: 'xs', color: '#AAAAAA', margin: 'lg' },
        { type: 'box', layout: 'horizontal', margin: 'sm', contents: [
          { type: 'text', text: srv, size: 'xl', weight: 'bold', color: '#222222', flex: 1 },
          { type: 'text', text: '฿' + prc.toLocaleString(), size: 'xxl', weight: 'bold', color: '#E8457A', align: 'end' }
        ]},
        { type: 'separator', margin: 'lg' },
        { type: 'box', layout: 'vertical', margin: 'lg', spacing: 'sm', contents: [
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'ยอดคงเหลือ', size: 'sm', color: '#666666', flex: 1 },
            { type: 'text', text: '฿' + balB.toLocaleString(), size: 'sm', color: '#444444', align: 'end' }
          ]},
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'หัก ใช้บริการ', size: 'sm', color: '#666666', flex: 1 },
            { type: 'text', text: '฿' + prc.toLocaleString(), size: 'sm', color: '#444444', align: 'end' }
          ]}
        ]},
        { type: 'box', layout: 'horizontal', margin: 'lg', backgroundColor: '#FFE4EE', paddingAll: '16px', cornerRadius: 'md', contents: [
          { type: 'text', text: 'ยอดคงเหลือ', size: 'md', weight: 'bold', color: '#E8457A', gravity: 'center', flex: 1 },
          { type: 'text', text: '฿' + bal.toLocaleString(), size: 'xl', weight: 'bold', color: '#E8457A', align: 'end' }
        ]},
        { type: 'box', layout: 'vertical', margin: 'xl', contents: [
          { type: 'text', text: 'ความพึงพอใจของท่านคือกำลังใจของเรา', size: 'xs', color: '#BBBBBB', align: 'center' },
          { type: 'text', text: 'ขอบคุณค่ะ/ครับ', size: 'xs', color: '#BBBBBB', align: 'center', margin: 'xs' }
        ]}
      ]}
    }
  };
}

// ใบเสร็จเติมเงิน (เขียว) — ส่งหาลูกค้า (รวมแสดงโบนัส)
// getFlexNotifyTopup(payAmount, creditAmount, bonusAmount, bal, expiryStr, staffName, memberPhone, balBefore)
function getFlexNotifyTopup(payAmount, creditAmount, bonusAmount, bal, expiryStr, staffName, memberPhone, balBefore) {
  var date = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm').replace(':', '.');
  var balB = (balBefore !== undefined && balBefore !== null) ? balBefore : (bal - creditAmount);
  var expDisplay = expiryStr || '-';
  if (expiryStr) {
    var parts = expiryStr.split('/');
    var thMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    if (parts.length === 3) {
      expDisplay = parseInt(parts[0], 10) + ' ' + (thMonths[parseInt(parts[1], 10)] || '') + ' ' + parts[2];
    }
  }

  var bonusRow = bonusAmount > 0 ? [{ type: 'box', layout: 'horizontal', contents: [
    { type: 'text', text: '🎁 โบนัส', size: 'sm', color: '#1B8A5A' },
    { type: 'text', text: '+฿' + bonusAmount.toLocaleString(), size: 'sm', color: '#1B8A5A', align: 'end', weight: 'bold' }
  ]}] : [];

  return {
    type: 'flex', altText: 'ใบเสร็จเติมเงิน Nail Kloset',
    contents: {
      type: 'bubble', size: 'mega',
      header: { type: 'box', layout: 'vertical', paddingAll: '20px', backgroundColor: '#1B6B45', contents: [
        { type: 'text', text: 'ใบเสร็จ เติมเงิน', color: '#FFFFFF', size: 'sm', weight: 'bold' },
        { type: 'text', text: 'Nail Kloset', color: '#FFFFFF', size: 'xxl', weight: 'bold', margin: 'sm' },
        { type: 'text', text: 'the crystal ratchapruek', color: '#7BC9A8', size: 'sm', margin: 'xs' }
      ]},
      body: { type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'none', backgroundColor: '#FFFFFF', contents: [
        { type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: 'พนักงาน : ' + (staffName || '-'), size: 'sm', color: '#555555', flex: 1 },
          { type: 'text', text: date, size: 'sm', color: '#999999', align: 'end' }
        ]},
        { type: 'separator', margin: 'md' },
        { type: 'box', layout: 'horizontal', margin: 'lg', contents: [
          { type: 'text', text: 'เติมเงิน', size: 'xl', weight: 'bold', color: '#222222', flex: 1 },
          { type: 'text', text: '฿' + payAmount.toLocaleString(), size: 'xxl', weight: 'bold', color: '#1B8A5A', align: 'end' }
        ]},
        { type: 'box', layout: 'horizontal', margin: 'sm', contents: [
          { type: 'text', text: 'เบอร์สมาชิก', size: 'sm', color: '#AAAAAA', flex: 1 },
          { type: 'text', text: memberPhone || '-', size: 'sm', weight: 'bold', color: '#222222', align: 'end' }
        ]},
        { type: 'box', layout: 'horizontal', margin: 'sm', contents: [
          { type: 'text', text: 'วันหมดอายุ', size: 'sm', color: '#AAAAAA', flex: 1 },
          { type: 'text', text: expDisplay, size: 'sm', weight: 'bold', color: '#222222', align: 'end' }
        ]},
        { type: 'separator', margin: 'lg' },
        { type: 'box', layout: 'vertical', margin: 'lg', spacing: 'sm', contents: [
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'ยอดคงเหลือ', size: 'sm', color: '#666666', flex: 1 },
            { type: 'text', text: '฿' + balB.toLocaleString(), size: 'sm', color: '#444444', align: 'end' }
          ]},
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'ยอดเติมเงิน', size: 'sm', color: '#666666', flex: 1 },
            { type: 'text', text: '฿' + payAmount.toLocaleString(), size: 'sm', color: '#444444', align: 'end' }
          ]}
        ].concat(bonusRow)},
        { type: 'box', layout: 'horizontal', margin: 'lg', backgroundColor: '#D6F5E8', paddingAll: '16px', cornerRadius: 'md', contents: [
          { type: 'text', text: 'ยอดคงเหลือ', size: 'md', weight: 'bold', color: '#1B6B45', gravity: 'center', flex: 1 },
          { type: 'text', text: '฿' + bal.toLocaleString(), size: 'xl', weight: 'bold', color: '#1B6B45', align: 'end' }
        ]},
        { type: 'box', layout: 'vertical', margin: 'xl', contents: [
          { type: 'text', text: 'ความพึงพอใจของท่านคือกำลังใจของเรา', size: 'xs', color: '#BBBBBB', align: 'center' },
          { type: 'text', text: 'ขอบคุณค่ะ/ครับ', size: 'xs', color: '#BBBBBB', align: 'center', margin: 'xs' }
        ]}
      ]}
    }
  };
}


// ============================================================
// [7] DATABASE & CALCULATION
// ============================================================

function updateRecordPrice(recordId, newPrice) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  var row = parseInt(recordId);
  if (row > 1) sheet.getRange(row, 6).setValue(newPrice);
}

function getSummaryData(u, n, p) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  var d = s.getDataRange().getValues();
  var now = new Date(), startD, endD = new Date(), periodLabel = '';
  if (p === 'day') {
    startD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    periodLabel = Utilities.formatDate(startD, 'Asia/Bangkok', 'dd/MM');
  } else if (p === 'week') {
    startD = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    startD.setHours(0, 0, 0, 0);
    periodLabel = Utilities.formatDate(startD, 'Asia/Bangkok', 'dd/MM') + ' - ' + Utilities.formatDate(endD, 'Asia/Bangkok', 'dd/MM');
  } else {
    startD = new Date(now.getFullYear(), now.getMonth(), 1);
    periodLabel = Utilities.formatDate(startD, 'Asia/Bangkok', 'MM/yyyy');
  }
  var isAdmin = (String(u) === ADMIN_USER_ID);
  var total = 0, memberTotal = 0, memberCount = 0, byG = {};
  d.slice(1).forEach(function(r) {
    var rowD = new Date(r[0]), serviceName = r[4], price = Number(r[5]);
    if (rowD < startD) return;
    if (!isAdmin && String(r[2]) === String(u)) {
      if (serviceName !== 'เปิดเมมเบอร์ใหม่' && serviceName !== 'เติมเงินสมาชิก') {
        var comm = price * (COMMISSION_RATE[serviceName] || 0.1);
        total += comm;
        if (!byG[serviceName]) byG[serviceName] = { amt: 0, count: 0 };
        byG[serviceName].amt += comm; byG[serviceName].count += 1;
      }
    }
    if (isAdmin) {
      if (serviceName === 'เปิดเมมเบอร์ใหม่' || serviceName === 'เติมเงินสมาชิก') {
        memberTotal += price; memberCount += 1;
      } else {
        var sName = r[3]; total += price;
        if (!byG[sName]) byG[sName] = { amt: 0, count: 0 };
        byG[sName].amt += price; byG[sName].count += 1;
      }
    }
  });
  var finalGroup = {};
  Object.keys(byG).forEach(function(k) { finalGroup[k + ' (' + byG[k].count + ' รายการ)'] = byG[k].amt; });
  if (isAdmin && memberTotal > 0) { finalGroup['💳 สมัคร/เพิ่มเมม (' + memberCount + ' รายการ)'] = memberTotal; total += memberTotal; }
  return { total: Math.round(total), byGroup: finalGroup, periodLabel: periodLabel, isAdmin: isAdmin };
}

function getCommissionToday(u) { return getSummaryData(u, '', 'day').total; }

function getStaff(u) {
  var d = getOrCreateSheet(SHEET_STAFF, []).getDataRange().getValues();
  for (var i = 1; i < d.length; i++) { if (String(d[i][0]) === String(u)) return { name: d[i][1] }; }
  return null;
}

function registerStaff(u, n) {
  getOrCreateSheet(SHEET_STAFF, ['UserID', 'ชื่อ', 'วันที่ลงทะเบียน']).appendRow([u, n, new Date()]);
}

function saveRecord(u, n, s, p, m, ph, note, accountType) {
  var now = new Date();
  var phoneSave = (ph && ph !== '-') ? "'" + ph : ph;
  var sheet = getOrCreateSheet(SHEET_RECORDS,
    ['วันที่', 'เวลา', 'UserID', 'ชื่อพนักงาน', 'บริการ', 'ราคา', 'การชำระ', 'เบอร์ลูกค้า', 'หมายเหตุ', 'สถานะ', 'เวลายกเลิก', 'ขอยกเลิกโดย', 'เวลาขอยกเลิก', 'บัญชี']);
  sheet.appendRow([
    now,
    Utilities.formatDate(now, 'Asia/Bangkok', 'HH:mm'),
    u, n, s, p, m, phoneSave, note || '-',
    '', '', '', '',           // col 10-13 status/void
    accountType || '-'        // col 14 บัญชี
  ]);
}


function getLastRecordId(u) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  var data  = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) { if (String(data[i][2]) === String(u)) return i + 1; }
  return sheet.getLastRow();
}

// ============================================================
// getMemberByCode — ค้นหาสมาชิกด้วยรหัส 4 หลัก
// Sheet สมาชิก คอลัมน์: [0]=เบอร์, [1]=ชื่อ, [2]=ยอด, [3]=lineId, [4]=expiry, [5]=รหัส4หลัก
// ============================================================
function getMemberByCode(code) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MEMBER);
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    // ตัด ' และ space ออกทั้งสองฝั่ง
    var storedCode = String(data[i][5] || '').replace(/'/g, '').trim();
    var searchCode = String(code).replace(/'/g, '').trim();
    if (storedCode === searchCode) {
      return {
        row:        i + 1,
        phone:      String(data[i][0]).replace(/'/g, ''),
        name:       String(data[i][1]),
        balance:    parseFloat(data[i][2]) || 0,
        lineId:     String(data[i][3] || '-'),
        expiry:     data[i][4],
        memberCode: storedCode
      };
    }
  }
  return null;
}

function getMemberByPhone(phone) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MEMBER);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).replace(/'/g, '') === String(phone)) {
      return {
        row:        i + 1,
        phone:      data[i][0],
        name:       String(data[i][1]),
        balance:    parseFloat(data[i][2]),
        lineId:     String(data[i][3] || '-'),
        expiry:     data[i][4],
        memberCode: String(data[i][5] || '-')
      };
    }
  }
  return null;
}

function updateMemberBalance(ph, amt) {
  var m = getMemberByPhone(ph);
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MEMBER).getRange(m.row, 3).setValue(m.balance - amt);
}

function getRecordInfo(recordId) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  var r = parseInt(recordId);
  return { service: s.getRange(r, 5).getValue(), price: Number(s.getRange(r, 6).getValue()) };
}

function updateRecordToMember(id, ph) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  var r = parseInt(id);
  if (r > 1) { s.getRange(r, 7).setValue('Member'); s.getRange(r, 8).setValue("'" + ph); return true; }
  return false;
}

function getMemberByLineId(u) {
  var d = getOrCreateSheet(SHEET_MEMBER, []).getDataRange().getValues();
  for (var i = 1; i < d.length; i++) {
    if (String(d[i][3]) === String(u)) {
      return {
        row:        i + 1,
        phone:      String(d[i][0]).replace(/'/g, ''),
        name:       String(d[i][1]),
        balance:    Number(d[i][2]),
        lineId:     String(d[i][3]),
        expiry:     d[i][4],      // ← เพิ่ม
        memberCode: String(d[i][5] || '-')  // ← เพิ่ม
      };
    }
  }
  return null;
}

function updateMemberLineId(ph, u) {
  var member = getMemberByPhone(ph);
  if (member) SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MEMBER).getRange(member.row, 4).setValue(u);
}


// ============================================================
// [8] UTILITIES
// ============================================================

function setSession(u, d) {
  var s = getOrCreateSheet(SHEET_SESSION, ['UserID', 'Data', 'Update']);
  var v = s.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][0]) === String(u)) { s.getRange(i + 1, 2, 1, 2).setValues([[JSON.stringify(d), new Date()]]); return; }
  }
  s.appendRow([u, JSON.stringify(d), new Date()]);
}

function getSession(u) {
  var d = getOrCreateSheet(SHEET_SESSION, []).getDataRange().getValues();
  for (var i = 1; i < d.length; i++) { if (String(d[i][0]) === String(u)) return JSON.parse(d[i][1]); }
  return null;
}

function clearSession(u) { setSession(u, { step: null }); }

function getOrCreateSheet(n, h) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), s = ss.getSheetByName(n);
  if (!s) {
    s = ss.insertSheet(n);
    if (h && h.length) s.appendRow(h);
    s.getRange(1, 1, 1, h.length || 1).setBackground('#4A90D9').setFontColor('#FFFFFF');
  }
  return s;
}

function callLineAPI(path, payload, useCustomerToken) {
  var token = useCustomerToken ? LINE_TOKEN_CUST : LINE_TOKEN_STAFF;
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function pushToCustomer(lineId, msg) {
  if (!lineId || lineId === '-') return;
  callLineAPI('push', { to: lineId, messages: [msg] }, true);
}

function pushMessagesToCustomer(lineId, msgs) {
  if (!lineId || lineId === '-' || !msgs || !msgs.length) return;
  callLineAPI('push', { to: lineId, messages: msgs.slice(0, 5) }, true);
}

function sendLoading(userId) {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/chat/loading/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + LINE_TOKEN_STAFF },
    payload: JSON.stringify({ chatId: userId, loadingSeconds: 5 }),
    muteHttpExceptions: true
  });
}

function replyText(t, x, useCust) {
  callLineAPI('reply', { replyToken: t, messages: [{ type: 'text', text: x }] }, useCust);
}

function writeLog(action, staff, details, refId) {
  getOrCreateSheet('Log_History', ['วันที่/เวลา', 'กิจกรรม', 'พนักงาน', 'รายละเอียด', 'แถวอ้างอิง'])
    .appendRow([new Date(), action, staff, details, refId || '-']);
}

function writeMemberLog(phone, action, amount, balanceBefore, balanceAfter, staff) {
  getOrCreateSheet('Member_Logs', ['วันที่/เวลา', 'เบอร์โทร', 'รายการ', 'จำนวนเงิน', 'ยอดก่อนหน้า', 'ยอดคงเหลือสุทธิ', 'พนักงาน'])
    .appendRow([new Date(), "'" + phone, action, amount, balanceBefore, balanceAfter, staff || 'ระบบ']);
}


function replyExpiringSoon(token) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MEMBER);
  if (!sheet) return replyText(token, '❌ ไม่พบข้อมูลสมาชิกค่ะ', false);

  var data  = sheet.getDataRange().getValues();
  var now   = new Date();
  var limit = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());

  var expiring = [];
  data.slice(1).forEach(function(row) {
    var expiry = new Date(row[4]);
    if (isNaN(expiry) || expiry < now) return;
    if (expiry <= limit) {
      var daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      var phone = String(row[0] || '').replace(/'/g, '').trim();
      if (/^\d{9}$/.test(phone)) phone = '0' + phone; // แก้ 0 หาย
      expiring.push({
  name:    String(row[1] || '-'),
  phone:   phone,
  expiry:  expiry,
  days:    daysLeft,
  balance: parseFloat(row[2]) || 0   // เพิ่มบรรทัดนี้
});
    }
  });

  expiring.sort(function(a, b) { return a.expiry - b.expiry; });

  if (expiring.length === 0) {
    return replyText(token, '✅ ไม่มีสมาชิกใกล้หมดอายุภายใน 3 เดือนค่ะ', false);
  }

  var lines = ['⏰ สมาชิกใกล้หมดอายุ (' + expiring.length + ' คน)\n'];
  expiring.forEach(function(m, i) {
    var expStr = Utilities.formatDate(m.expiry, 'GMT+7', 'dd/MM/yyyy');
    var flag   = m.days <= 30 ? '🔴' : m.days <= 60 ? '🟡' : '🟢';
    lines.push(flag + ' ' + (i + 1) + '. ' + m.name + '\n    📞 ' + m.phone + '\n    📅 ' + expStr + ' (เหลือ ' + m.days + ' วัน)\n    💰 เครดิตคงเหลือ ฿' + m.balance.toLocaleString());
  });

  return replyText(token, lines.join('\n'), false);
}


function saveConfig(configObj) {
  var sheet = getOrCreateSheet('Config', ['Key', 'Value', 'UpdatedAt']);
  var data = sheet.getDataRange().getValues();
  var map = {};
  data.slice(1).forEach(function(r, i) { map[r[0]] = i + 2; });
  Object.keys(configObj).forEach(function(key) {
    var val = configObj[key];
    if (map[key]) {
      sheet.getRange(map[key], 2).setValue(val);
      sheet.getRange(map[key], 3).setValue(new Date());
    } else {
      sheet.appendRow([key, val, new Date()]);
    }
  });
}

function getConfig() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  var cfg = {};
  data.slice(1).forEach(function(r) {
    var val = r[1];
    if (val === 'true' || val === true) val = true;
    else if (val === 'false' || val === false) val = false;
    else if (!isNaN(parseFloat(val)) && val !== '') val = parseFloat(val);
    cfg[r[0]] = val;
  });
  return cfg;
}




// ============================================================
// [BACKUP] backupMonthlyData — แก้ไขใหม่
// 1. Copy ไฟล์ทั้งหมดไป Drive (เหมือนเดิม)
// 2. เปลี่ยนชื่อ Sheet รายการ → รายการ_เดือน_ปี
// 3. สร้าง Sheet รายการ ใหม่พร้อม header
// ============================================================

function backupMonthlyData() {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var now = new Date();

  var thMonths = [
    'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน',
    'พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม',
    'กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
  ];

  // ── เดือนที่แล้ว (ที่จะถูก archive) ──
  var archiveDate  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var archiveMM    = thMonths[archiveDate.getMonth()];
  var archiveYY    = archiveDate.getFullYear() + 543;  // พ.ศ.
  var archiveName  = 'รายการ_' + archiveMM + '_' + archiveYY;
  //  เช่น "รายการ_มีนาคม_2568"

  // ── ชื่อไฟล์ backup ──
  var fileName = 'NailKloset_Backup_' + archiveDate.getFullYear() + '_' + archiveMM;

  // ============================================================
  // STEP 1 — Copy ไฟล์ทั้งหมดไป Drive (เหมือนเดิม)
  // ============================================================
  var folderName = 'Backup_NailKloset';
  var folders    = DriveApp.getFoldersByName(folderName);
  var folder     = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

  var existing = folder.getFilesByName(fileName);
  if (!existing.hasNext()) {
    var copy = ss.copy(fileName);
    DriveApp.getFileById(copy.getId()).moveTo(folder);

    // ลบ Sheet ที่ไม่จำเป็นออกจาก backup copy
    // ใน backupMonthlyData() แก้ keepSheets
    var keepSheets = [SHEET_RECORDS, SHEET_MEMBER, SHEET_STAFF,
                      'Member_Logs', 'Log_History', 'Config', 
                      'รายจ่าย'];  // ← เพิ่มตรงนี้
    copy.getSheets().forEach(function(sheet) {
      if (keepSheets.indexOf(sheet.getName()) === -1 && copy.getSheets().length > 1) {
        copy.deleteSheet(sheet);
      }
    });
    Logger.log('Backup ไฟล์สำเร็จ: ' + fileName);
  } else {
    Logger.log('Backup ไฟล์มีอยู่แล้ว: ' + fileName);
  }

  // ============================================================
  // STEP 2 — Archive Sheet รายการในไฟล์เดิม
  // เปลี่ยนชื่อ "รายการ" → "รายการ_มีนาคม_2568"
  // ============================================================
  var oldSheet = ss.getSheetByName(SHEET_RECORDS);  // "รายการ"

  if (!oldSheet) {
    Logger.log('ไม่พบ Sheet: ' + SHEET_RECORDS);
    notifyAdminBackup(fileName, archiveName, false, 'ไม่พบ Sheet รายการ');
    return;
  }

  // เช็คว่า archive sheet ซ้ำหรือไม่ (กันกด run ซ้ำ)
  if (ss.getSheetByName(archiveName)) {
    Logger.log('Archive Sheet มีอยู่แล้ว: ' + archiveName);
    notifyAdminBackup(fileName, archiveName, true, 'archive มีอยู่แล้ว');
    return;
  }

  // เปลี่ยนชื่อ Sheet เดิม
  oldSheet.setName(archiveName);

  // ── ตกแต่ง tab สี archive (เทา) ──
  oldSheet.setTabColor('#888888');

  // ── ย้าย archive sheet ไปไว้หลังสุด (optional) ──
  ss.moveActiveSheet(ss.getSheets().length);

  // ============================================================
  // STEP 3 — สร้าง Sheet "รายการ" ใหม่พร้อม header
  // ============================================================
  var HEADERS = [
    'วันที่', 'เวลา', 'UserID', 'ชื่อพนักงาน', 'บริการ',
    'ราคา', 'การชำระ', 'เบอร์ลูกค้า', 'หมายเหตุ', 'สถานะ',
    'เวลายกเลิก', 'ขอยกเลิกโดย', 'เวลาขอยกเลิก', 'บัญชี'
  ];

  var newSheet = ss.insertSheet(SHEET_RECORDS, 0);  // แทรกไว้ tab แรก
  newSheet.appendRow(HEADERS);

  // ── ตกแต่ง header ──
  var headerRange = newSheet.getRange(1, 1, 1, HEADERS.length);
  headerRange
    .setBackground('#FF6B9D')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');

  // ── freeze row 1 ──
  newSheet.setFrozenRows(1);

  // ── ตกแต่ง tab สี ใหม่ (ชมพู) ──
  newSheet.setTabColor('#FF6B9D');

  // ── ปรับ column width ──
  newSheet.setColumnWidth(1, 140);  // วันที่
  newSheet.setColumnWidth(4, 100);  // ชื่อพนักงาน
  newSheet.setColumnWidth(5, 120);  // บริการ
  newSheet.setColumnWidth(6, 80);   // ราคา
  newSheet.setColumnWidth(7, 90);   // การชำระ

  Logger.log('สร้าง Sheet รายการ ใหม่สำเร็จ');

  // ============================================================
  // STEP 4 — แจ้ง Admin ทาง LINE
  // ============================================================
  notifyAdminBackup(fileName, archiveName, true, null);
}


// ── แจ้ง Admin ──────────────────────────────────────────────
function notifyAdminBackup(fileName, archiveName, success, errMsg) {
  var now = new Date();
  var msg;
  if (success) {
    msg =
      '✅ Backup & Archive สำเร็จ!\n\n' +
      '📁 ไฟล์ Drive: ' + fileName + '\n' +
      '📋 Archive Sheet: ' + archiveName + '\n' +
      '🆕 Sheet ใหม่: รายการ (พร้อมรับข้อมูลเดือนนี้)\n' +
      '📅 ' + Utilities.formatDate(now, 'GMT+7', 'dd/MM/yyyy HH:mm') + '\n\n' +
      '🔗 ดู Archive ได้ใน Tab "' + archiveName + '" ค่ะ';
  } else {
    msg =
      '⚠️ Backup มีปัญหาค่ะ\n' +
      '❌ ' + (errMsg || 'unknown error') + '\n' +
      '📅 ' + Utilities.formatDate(now, 'GMT+7', 'dd/MM/yyyy HH:mm');
  }
  callLineAPI('push', {
    to: ADMIN_USER_ID,
    messages: [{ type: 'text', text: msg }]
  }, false);
}


// ── ใช้ทดสอบ manual ─────────────────────────────────────────
function testBackupNow() {
  backupMonthlyData();
}






function setupBackupTrigger() {
  // ลบ trigger เก่าที่ชื่อ backupMonthlyData ออกก่อน (ถ้ามี)
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === 'backupMonthlyData') {
      ScriptApp.deleteTrigger(t);
    }
  });
  
  // สร้าง trigger ใหม่ — ทำงานวันที่ 1 ของทุกเดือน เวลา 01:00
  ScriptApp.newTrigger('backupMonthlyData')
    .timeBased()
    .onMonthDay(1)
    .atHour(1)
    .create();
  
  Logger.log('✅ ตั้ง Trigger สำเร็จ: Backup ทุกวันที่ 1 เวลา 01:00 น.');
}



// ตรวจสอบ/สร้าง column สถานะใน Sheet รายการ
function ensureRecordColumns() {
  var sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  var headers = sheet.getRange(1, 1, 1, 14).getValues()[0];
  var cols    = {
    10: 'สถานะ',
    11: 'เวลายกเลิก',
    12: 'ขอยกเลิกโดย',
    13: 'เวลาขอยกเลิก',
    14: 'บัญชี'            // ← เพิ่มใหม่
  };
  Object.entries(cols).forEach(function(entry) {
    var col = parseInt(entry[0]), name = entry[1];
    if (!headers[col - 1]) {
      sheet.getRange(1, col).setValue(name)
        .setBackground('#FF9800').setFontColor('#FFFFFF').setFontWeight('bold');
    }
  });
}





function handleVoidApproval(replyToken, msgText) {
  var parts    = msgText.split('_');
  var action   = parts[0];
  var rId      = parts[1];
  var staffWho = parts[2] || '-';
  var staffUid = parts[3] || '';

  ensureRecordColumns();
  var recSheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  var recRow    = parseInt(rId);
  var curStatus = String(recSheet.getRange(recRow, 10).getValue());

  // ── เช็คว่า Admin กดซ้ำหรือไม่ ──
  if (curStatus === 'ยกเลิก') {
    return replyText(replyToken, '⚠️ รายการนี้ถูกยกเลิกไปแล้วค่ะ', false);
  }
  if (curStatus === '' || curStatus === 'รออนุมัติ' === false) {
    // ถ้าสถานะไม่ใช่ รออนุมัติ แสดงว่าไม่มี request
    if (curStatus !== 'รออนุมัติ') {
      return replyText(replyToken, '⚠️ ไม่พบคำขอยกเลิกสำหรับรายการนี้ค่ะ', false);
    }
  }

  var rInfo = getRecordInfo(rId);

  if (action === 'อนุมัติลบ') {
    // VOID
    recSheet.getRange(recRow, 10).setValue('ยกเลิก');
    recSheet.getRange(recRow, 11).setValue(new Date());

    // คืนเครดิต Member
    var payment = String(recSheet.getRange(recRow, 7).getValue());
    var phone   = String(recSheet.getRange(recRow, 8).getValue()).replace(/'/g, '');
    if (payment === 'Member' && phone && phone !== '-') {
      var member = getMemberByPhone(phone);
      if (member) {
        var oldBal = member.balance;
        var newBal = oldBal + rInfo.price;
        SpreadsheetApp.getActiveSpreadsheet()
          .getSheetByName(SHEET_MEMBER).getRange(member.row, 3).setValue(newBal);
        writeMemberLog(phone, 'คืนเครดิต (ยกเลิกรายการ #' + rId + ')',
          '+' + rInfo.price, oldBal, newBal, 'เจ้าของร้าน');
        if (member.lineId && member.lineId !== '-') {
          pushToCustomer(member.lineId, {
            type: 'text',
            text: '💰 คืนเครดิตค่ะ!\n\n📋 ' + rInfo.service +
                  ' ฿' + rInfo.price.toLocaleString() +
                  '\n💳 ยอดคงเหลือ: ฿' + newBal.toLocaleString()
          });
        }
      }
    }

    writeLog('ยกเลิกรายการ (VOID)', 'เจ้าของร้าน',
      'อนุมัติโดย Admin | พนักงาน: ' + staffWho +
      ' | ' + rInfo.service + ' ฿' + rInfo.price, rId);

    // แจ้งพนักงาน
    if (staffUid && staffUid !== ADMIN_USER_ID) {
      callLineAPI('push', {
        to: staffUid,
        messages: [{ type: 'text',
          text: '✅ เจ้าของอนุมัติยกเลิกรายการแล้วค่ะ\n📋 ' +
                rInfo.service + ' ฿' + rInfo.price.toLocaleString() }]
      }, false);
    }

    return replyFlexVoidApproved(replyToken, staffWho, rInfo.service, rInfo.price, rId);

  } else {
    // ปฏิเสธ → คืนสถานะว่าง
    recSheet.getRange(recRow, 10).setValue('');
    recSheet.getRange(recRow, 11).setValue('');
    recSheet.getRange(recRow, 12).setValue('');
    recSheet.getRange(recRow, 13).setValue('');

    if (staffUid && staffUid !== ADMIN_USER_ID) {
      callLineAPI('push', {
        to: staffUid,
        messages: [{ type: 'text',
          text: '❌ เจ้าของไม่อนุมัติการยกเลิกรายการค่ะ\n📋 ' +
                rInfo.service + ' ฿' + rInfo.price.toLocaleString() }]
      }, false);
    }

    return replyText(replyToken, '❌ ปฏิเสธคำขอยกเลิกแล้วค่ะ\nรายการยังคงอยู่ตามเดิม', false);
  }
}


function getAccountData(period) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_RECORDS);
    if (!sheet) return { ok: false, error: 'ไม่พบ Sheet รายการ' };
 
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { ok: true, rows: [] };
 
    var now   = new Date();
    var start;
    if (!period || period === 'all') {
      start = new Date(2000, 0, 1);
    } else if (period === 'day') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (period === 'week') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);
    } else {
      // month (default)
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    }
 
    var result = [];
    data.slice(1).forEach(function(row) {
      var rowDate = new Date(row[0]);
      if (isNaN(rowDate) || rowDate < start || rowDate > now) return;
      var price   = Number(row[5]);
      var status  = String(row[9] || '');
      if (!price || price <= 0) return;
      if (status === 'ยกเลิก' || status === 'รออนุมัติ') return;
 
      var payment     = String(row[6] || 'Cash');
      var service     = String(row[4] || '-');
      var staffName   = String(row[3] || '-');
      var accountType = String(row[13] || '-'); // col 14
 
      // คำนวณ net สำหรับ credit (หัก MDR 2.58%)
      var netAmount = price;
      var feeAmount = 0;
      if (payment === 'Credit') {
        feeAmount = Math.round(price * 0.0258);
        netAmount = price - feeAmount;
      }
 
      result.push({
        date:        rowDate.toISOString(),
        staffName:   staffName,
        service:     service,
        price:       price,
        netAmount:   netAmount,
        feeAmount:   feeAmount,
        payment:     payment,
        accountType: accountType
      });
    });
 
    result.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    return { ok: true, rows: result };
 
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ============================================================
// [ARCHIVE] ดึงรายชื่อ Sheet archive ทั้งหมด
// คืนค่า: [{name:'รายการ_มีนาคม_2568', label:'มีนาคม 2568'}, ...]
// ============================================================
function getArchivedMonths() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var result = [];

  sheets.forEach(function(sheet) {
    var name = sheet.getName();
    // จับ pattern "รายการ_เดือน_ปี"
    var match = name.match(/^รายการ_(.+)_(\d{4})$/);
    if (match) {
      result.push({
        name:  name,
        label: match[1] + ' ' + match[2],
        month: match[1],
        year:  match[2]
      });
    }
  });

  // เรียงล่าสุดก่อน
  var thMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน',
    'พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม',
    'กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  result.sort(function(a, b) {
    var ya = parseInt(a.year), yb = parseInt(b.year);
    if (ya !== yb) return yb - ya;
    return thMonths.indexOf(b.month) - thMonths.indexOf(a.month);
  });

  return result;
}

// ============================================================
// [ARCHIVE] getDashboardData — รองรับ sheetName เพิ่มเติม
// เรียกด้วย getDashboardData('all', 'รายการ_มีนาคม_2568')
// ============================================================
function getDashboardDataFromSheet(sheetName) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName || SHEET_RECORDS);
    if (!sheet) return { error: 'ไม่พบ Sheet "' + sheetName + '"' };

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { records: [] };

    var records = [];
    data.slice(1).forEach(function(row) {
      var rowDate = new Date(row[0]);
      if (isNaN(rowDate)) return;
      var price = Number(row[5]);
      if (isNaN(price) || price <= 0) return;
      var rowStatus = String(row[9] || '');
      if (rowStatus === 'ยกเลิก' || rowStatus === 'รออนุมัติ') return;

      records.push({
        timestamp:   rowDate.toISOString(),
        staffName:   String(row[3] || ''),
        service:     String(row[4] || ''),
        price:       price,
        payment:     String(row[6] || 'Cash'),
        phone:       String(row[7] || '-'),
        accountType: String(row[13] || '-')
      });
    });

    records.sort(function(a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return { records: records };
  } catch (err) {
    return { error: err.message };
  }
}



// ============================================================
// getExpenseData — ดึงรายจ่ายจาก Sheet "รายจ่าย"
// periodKey format: "2025-04" (ปี-เดือน)
// ============================================================







function getExpenseData(periodKey) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('รายจ่าย');
    if (!sheet) return { error: 'ไม่พบ Sheet รายจ่าย', byCategory: {}, total: 0 };
 
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { byCategory: {}, total: 0 };
 
    // ── parse periodKey → ปีและเดือน (ค.ศ.) ──
    // รองรับ 'YYYY-MM', 'YYYY-M', หรือ 'month' (เดือนปัจจุบัน)
    var filterYear  = 0;
    var filterMonth = 0;
    var tz = Session.getScriptTimeZone();
 
    if (periodKey && periodKey !== 'month') {
      var parts = periodKey.split('-');
      filterYear  = parseInt(parts[0]) || 0;
      filterMonth = parseInt(parts[1]) || 0; // 1-indexed
    } else {
      // 'month' = เดือนปัจจุบัน
      var nowDate = new Date();
      filterYear  = nowDate.getFullYear();
      filterMonth = nowDate.getMonth() + 1;
    }
 
    Logger.log('[getExpenseData] periodKey=' + periodKey + 
               ' → filterYear=' + filterYear + ' filterMonth=' + filterMonth);
 
    var byCategory = {};
    var total      = 0;
    var rowCount   = 0;
 
    data.slice(1).forEach(function(row) {
      // ── ลองอ่านวันที่จากทั้ง col A และ col B ──
      var dateObj = _parseExpenseDateFlex(row[0], row[1], tz);
      if (!dateObj) return;
 
      // ── filter เดือน/ปี ──
      if (filterYear && filterMonth) {
        var rowYear  = parseInt(Utilities.formatDate(dateObj, tz, 'yyyy'));
        var rowMonth = parseInt(Utilities.formatDate(dateObj, tz, 'MM')); // 1-indexed
        if (rowYear !== filterYear || rowMonth !== filterMonth) return;
      }
 
      var category = String(row[2] || 'อื่นๆ').trim();
      var amount   = parseFloat(row[4]) || 0;
      if (amount <= 0) return;
 
      if (!byCategory[category]) byCategory[category] = 0;
      byCategory[category] += amount;
      total += amount;
      rowCount++;
    });
 
    Logger.log('[getExpenseData] matched rows=' + rowCount + ' total=' + total);
 
    // round values
    Object.keys(byCategory).forEach(function(k) {
      byCategory[k] = Math.round(byCategory[k] * 100) / 100;
    });
 
    return {
      byCategory : byCategory,
      total      : Math.round(total * 100) / 100
    };
 
  } catch(err) {
    Logger.log('[getExpenseData] ERROR: ' + err.message);
    return { error: err.message, byCategory: {}, total: 0 };
  }
}









/**
 * Helper: แปลงค่าจาก col A และ col B เป็น Date object
 * รองรับหลาย format:
 *   - Date object (จาก Sheets โดยตรง)
 *   - string "dd/MM/yyyy HH:mm"
 *   - string "dd/MM/yyyy"
 *   - number (Excel serial)
 */
function _parseExpenseDateFlex(colA, colB, tz) {
  // ลอง colA ก่อน (วันที่บันทึก — มักเป็น string "dd/MM/yyyy HH:mm")
  var d = _tryParseDate(colA, tz);
  if (d) return d;
 
  // ถ้า colA ล้มเหลว ลอง colB (วันที่ — อาจเป็น Date object หรือ string)
  d = _tryParseDate(colB, tz);
  if (d) return d;
 
  return null;
}
 
function _tryParseDate(val, tz) {
  if (!val) return null;
 
  // Date object จาก Sheets
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
 
  // Number (Excel serial date)
  if (typeof val === 'number') {
    var d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
 
  // String
  if (typeof val === 'string') {
    var str = val.trim();
    if (!str) return null;
 
    // "dd/MM/yyyy HH:mm" หรือ "dd/MM/yyyy"
    var parts = str.split(' ')[0].split('/');
    if (parts.length === 3) {
      var day   = parseInt(parts[0]);
      var month = parseInt(parts[1]) - 1; // JS month 0-indexed
      var year  = parseInt(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
 
    // ISO หรือ format อื่น
    var parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
 
  return null;
}
 
 
/**
 * Debug function — รันใน GAS Editor เพื่อตรวจสอบ
 */
function debugExpenseData() {
  var results = [
    getExpenseData('2026-04'),  // เมษายน 2026
    getExpenseData('2026-05'),  // พฤษภาคม 2026
    getExpenseData('2026-4'),   // format ไม่ padded
    getExpenseData('month'),    // เดือนปัจจุบัน
  ];
 
  results.forEach(function(r, i) {
    Logger.log('Test ' + (i+1) + ': ' + JSON.stringify(r));
  });
 
  // ตรวจ raw data
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('รายจ่าย');
  var data = sheet.getDataRange().getValues();
  Logger.log('Total rows: ' + (data.length - 1));
  Logger.log('Row 2 colA type: ' + typeof data[1][0] + ' val: ' + data[1][0]);
  Logger.log('Row 2 colB type: ' + typeof data[1][1] + ' val: ' + data[1][1]);
}


function testGetExpenseData() {
  var result = getExpenseData('2026-04');
  Logger.log(JSON.stringify(result));
}


function testDirect() {
  var result = getExpenseData('2026-04');
  Logger.log('type: ' + typeof result);
  Logger.log('keys: ' + Object.keys(result));
  Logger.log('byCategory type: ' + typeof result.byCategory);
  Logger.log('byCategory keys: ' + Object.keys(result.byCategory || {}));
  Logger.log('total: ' + result.total);
  Logger.log('full: ' + JSON.stringify(result));
}