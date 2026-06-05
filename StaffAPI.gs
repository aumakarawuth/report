// ============================================================
//  StaffAPI.gs — Nail Kloset Staff PWA Endpoints
//  วางในไฟล์ใหม่ใน Apps Script Project เดียวกับ Code.gs
//
//  Actions รองรับ:
//    GET  getStaffComm          → ค่าคอมพนักงานวันนี้
//    GET  getStaffTodayRecords  → รายการวันนี้
//    GET  getStaffSummary       → สรุปยอด (day/week/month)
//    GET  getMemberByCode       → ค้นหาสมาชิกด้วยรหัส 4 หลัก
//    GET  getConfig             → ดึง config ร้าน
//    POST staffSaveRecord       → บันทึกงาน
//    POST staffTopup            → เติมเงินสมาชิก
//    POST staffRegister         → สมัครสมาชิกใหม่
//    POST staffDeduct           → ตัดยอดสมาชิก
//    POST staffRequestVoid      → ขอลบรายการ (ส่ง admin)
// ============================================================

function _corsResponse(data) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
  // หมายเหตุ: GAS ไม่รองรับ setHeader ใน doGet/doPost โดยตรง
  // วิธีแก้ CORS จริงๆ ต้องผ่าน no-cors fetch + text/plain body
  // หรือใช้ JSONP — ดูหัวข้อ "CORS workaround" ด้านล่าง
}

function _getStaffComm(p) {
  if (!p.userId) return { ok: false, error: 'userId จำเป็น' };

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  if (!sheet) return { ok: true, todayComm: 0, todayRevenue: 0, count: 0 };

  var now   = new Date();
  var start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  var data  = sheet.getDataRange().getValues();

  var todayRevenue = 0, todayComm = 0, count = 0;

  data.slice(1).forEach(function(row) {
    var rowDate  = new Date(row[0]);
    var userId   = String(row[2] || '');
    var service  = String(row[4] || '');
    var price    = Number(row[5]) || 0;
    var status   = String(row[9] || '');

    if (userId !== String(p.userId)) return;
    if (rowDate < start) return;
    if (status === 'ยกเลิก' || status === 'รออนุมัติ') return;
    if (price <= 0) return;

    var isMem = (service === 'เติมเงินสมาชิก' || service === 'เปิดเมมเบอร์ใหม่');
    if (!isMem) {
      var rate = COMMISSION_RATE[service] || 0.10;
      todayRevenue += price;
      todayComm    += price * rate;
      count++;
    }
  });

  return {
    ok:           true,
    todayRevenue: Math.round(todayRevenue),
    todayComm:    Math.round(todayComm),
    count:        count
  };
}

// ============================================================
// GET — getStaffTodayRecords
// params: { userId }
// returns: { ok, records: [ { service, price, payment, time, note } ] }
// ============================================================
function _getStaffTodayRecords(p) {
  if (!p.userId) return { ok: false, error: 'userId จำเป็น' };

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  if (!sheet) return { ok: true, records: [] };

  var tz    = Session.getScriptTimeZone();
  var now   = new Date();
  var todayStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  var data  = sheet.getDataRange().getValues();
  var records = [];

  data.slice(1).forEach(function(row) {
    var rowDate = new Date(row[0]);
    if (isNaN(rowDate.getTime())) return;

    var rowDateStr = Utilities.formatDate(rowDate, tz, 'yyyy-MM-dd');
    if (rowDateStr !== todayStr) return;

    var userId  = String(row[2] || '');
    if (userId !== String(p.userId)) return;

    var status = String(row[9] || '');
    if (status === 'ยกเลิก') return;

    var price = Number(row[5]) || 0;
    if (price <= 0) return;

    records.push({
      id:      String(row[0]),               // timestamp เป็น id
      service: String(row[4] || '-'),
      price:   price,
      payment: String(row[6] || 'Cash'),
      note:    String(row[8] || ''),
      time:    Utilities.formatDate(rowDate, tz, 'HH:mm'),
      status:  status
    });
  });

  // เรียงใหม่สุดก่อน
  records.sort(function(a, b) { return b.id.localeCompare(a.id); });

  return { ok: true, records: records };
}

// ============================================================
// GET — getStaffSummary
// params: { userId, period: 'day'|'week'|'month' }
// returns: { ok, total, comm, count, byService: { [svc]: amount } }
// ============================================================
function _getStaffSummary(p) {
  if (!p.userId) return { ok: false, error: 'userId จำเป็น' };

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  if (!sheet) return { ok: true, total: 0, comm: 0, count: 0, byService: {} };

  var now   = new Date();
  var start;
  var period = p.period || 'day';

  if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  } else if (period === 'week') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  }

  var data      = sheet.getDataRange().getValues();
  var total     = 0, comm = 0, count = 0;
  var byService = {};

  data.slice(1).forEach(function(row) {
    var rowDate = new Date(row[0]);
    if (isNaN(rowDate.getTime()) || rowDate < start) return;

    var userId  = String(row[2] || '');
    if (userId !== String(p.userId)) return;

    var status = String(row[9] || '');
    if (status === 'ยกเลิก' || status === 'รออนุมัติ') return;

    var service = String(row[4] || '');
    var price   = Number(row[5]) || 0;
    if (price <= 0) return;

    var isMem = (service === 'เติมเงินสมาชิก' || service === 'เปิดเมมเบอร์ใหม่');
    if (isMem) return;

    var rate = COMMISSION_RATE[service] || 0.10;
    total += price;
    comm  += price * rate;
    count++;

    byService[service] = (byService[service] || 0) + price;
  });

  return {
    ok:        true,
    total:     Math.round(total),
    comm:      Math.round(comm),
    count:     count,
    byService: byService,
    period:    period
  };
}

// ============================================================
// POST — staffSaveRecord
// body: { userId, staffName, service, price, payment, note }
// คืนค่า: { ok, recordId }
// ============================================================
function _staffSaveRecord(body) {
  var userId    = body.userId;
  var staffName = body.staffName;
  var service   = body.service;
  var price     = parseFloat(body.price) || 0;
  var payment   = body.payment || 'Cash';
  var note      = body.note    || '-';

  if (!userId || !staffName || !service || price <= 0) {
    return { ok: false, error: 'ข้อมูลไม่ครบถ้วน' };
  }

  // เลือก accountType จาก payment
  var accountType;
  if (payment === 'Credit')   accountType = 'กสิกร';
  else if (payment === 'Transfer') accountType = 'กสิกร';
  else if (payment === 'Member') accountType = 'ตัดเมมเบอร์';
  else accountType = 'เงินในร้าน';

  // ใช้ฟังก์ชัน saveRecord เดิมจาก Code.gs
  saveRecord(userId, staffName, service, price, payment, '-', note, accountType);

  var recordId = getLastRecordId(userId);

  Logger.log('[StaffAPI] saveRecord: ' + staffName + ' | ' + service + ' ฿' + price);

  return { ok: true, recordId: recordId };
}

// ============================================================
// POST — staffTopup
// body: { userId, staffName, memberCode, payAmount, payment }
// คืนค่า: { ok, newBalance, creditAmount, bonusAmount }
// ============================================================
function _staffTopup(body) {
  var userId     = body.userId;
  var staffName  = body.staffName;
  var memberCode = String(body.memberCode || '').replace(/'/g, '').trim();
  var payAmount  = parseFloat(body.payAmount) || 0;
  var payment    = body.payment || 'Cash';

  if (!userId || !memberCode || payAmount <= 0) {
    return { ok: false, error: 'ข้อมูลไม่ครบถ้วน' };
  }

  var m = getMemberByCode(memberCode);
  if (!m) return { ok: false, error: 'ไม่พบสมาชิกรหัส ' + memberCode };

  var creditAmount = calcTopupCredit(payAmount);
  var bonusAmount  = getTopupBonus(payAmount);
  var oldB         = m.balance;
  var newB         = oldB + creditAmount;
  var now          = new Date();
  var newExp       = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  // อัปเดต Sheet สมาชิก
  var mSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MEMBER);
  mSheet.getRange(m.row, 3).setValue(newB);
  mSheet.getRange(m.row, 5).setValue(newExp);

  // บันทึก record
  var accountType = payment === 'Credit' ? 'กสิกร' : payment === 'Transfer' ? 'กสิกร' : 'เงินในร้าน';
  saveRecord(userId, staffName, 'เติมเงินสมาชิก', payAmount, payment, m.phone, '-', accountType);

  // บันทึก log
  writeMemberLog(m.phone,
    'เติมเงิน (จ่าย ฿' + payAmount.toLocaleString() + ' ได้เครดิต ฿' + creditAmount.toLocaleString() + ')',
    '+' + creditAmount, oldB, newB, staffName);

  // แจ้งลูกค้าทาง LINE (ถ้าผูก)
  var expStr = Utilities.formatDate(newExp, 'GMT+7', 'dd/MM/yyyy');
  if (m.lineId && m.lineId !== '-') {
    pushMessagesToCustomer(m.lineId, [
      getFlexNotifyTopup(payAmount, creditAmount, bonusAmount, newB, expStr, staffName, m.phone, oldB)
    ]);
  }

  Logger.log('[StaffAPI] topup: ' + memberCode + ' ฿' + payAmount + ' → credit ฿' + creditAmount);

  return {
    ok:           true,
    newBalance:   newB,
    creditAmount: creditAmount,
    bonusAmount:  bonusAmount,
    memberName:   m.name
  };
}

// ============================================================
// POST — staffRegister
// body: { userId, staffName, phone, name, memberCode, amount }
// คืนค่า: { ok, creditAmount, bonusAmount, memberCode }
// ============================================================
function _staffRegister(body) {
  var userId    = body.userId;
  var staffName = body.staffName;
  var name      = String(body.name || '').trim();
  var code      = String(body.memberCode || '').trim();
  var amount    = parseFloat(body.amount) || 0;
  var payment    = body.payment || 'Cash';
 
  // ── FIX 1: normalize เบอร์ — ดึงเฉพาะตัวเลข แล้วเติม 0 ถ้า 9 หลัก ──
  var phone = String(body.phone || '').replace(/\D/g, '');
  if (phone.length === 9) phone = '0' + phone;
 
  // ── Validate ──
  if (!userId)             return { ok: false, error: 'ไม่พบ userId' };
  if (!staffName)          return { ok: false, error: 'ไม่พบชื่อพนักงาน' };
  if (!name)               return { ok: false, error: 'กรุณากรอกชื่อสมาชิก' };
  if (!phone || phone.length < 9) return { ok: false, error: 'เบอร์โทรไม่ถูกต้อง' };
  if (!code || code.length !== 4) return { ok: false, error: 'รหัสต้องเป็น 4 หลักพอดี' };
  if (amount <= 0)         return { ok: false, error: 'กรุณาระบุยอดเปิดบัญชี' };
 
  // ── เช็คซ้ำ ──
  if (getMemberByPhone(phone)) return { ok: false, error: 'เบอร์ ' + phone + ' เป็นสมาชิกอยู่แล้วค่ะ' };
  if (getMemberByCode(code))   return { ok: false, error: 'รหัส ' + code + ' ถูกใช้แล้วค่ะ กรุณาเปลี่ยนรหัส' };
 
  var creditAmount = calcRegisterCredit(amount);
  var bonusAmount  = getRegisterBonus(amount);
  var now          = new Date();
  var expDate      = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
 
  // ── FIX 2: accountType ตามช่องทางชำระจริง ──
  // var accountType;
  // if (payment === 'Credit')        accountType = 'กสิกร';
  // else if (payment === 'Transfer') accountType = 'กสิกร';
  // else                             accountType = 'เงินในร้าน';
 
  // ── บันทึก Sheet สมาชิก (ใช้ phone ที่ normalize แล้ว) ──
  getOrCreateSheet(SHEET_MEMBER, ['เบอร์โทร', 'ชื่อ', 'ยอดเงิน', 'LineID', 'หมดอายุ', 'รหัสสมาชิก'])
    .appendRow(["'" + phone, name, creditAmount, '-', expDate, "'" + code]);
 


  var accountType = payment === 'Credit' ? 'กสิกร' : payment === 'Transfer' ? 'กสิกร' : 'เงินในร้าน';
  saveRecord(userId, staffName, 'เปิดเมมเบอร์ใหม่', amount, payment, phone, '-', accountType);
  // ── FIX 1+2: saveRecord ส่ง phone ที่ normalize + payment + accountType ──
  // saveRecord(userId, staffName, 'เปิดเมมเบอร์ใหม่', amount, payment, phone, '-', accountType);
 
  // ── FIX 3: writeMemberLog (เคยหายไป) ──
  writeMemberLog(
    phone,
    'สมัครสมาชิกใหม่ (จ่าย ฿' + amount.toLocaleString() + ' ได้เครดิต ฿' + creditAmount.toLocaleString() + ')',
    '+' + creditAmount,
    0,
    creditAmount,
    staffName
  );
 
  Logger.log('[StaffAPI] register: ' + name + ' เบอร์ ' + phone + ' รหัส ' + code + ' เครดิต ฿' + creditAmount + ' (' + payment + ')');
 
  return {
    ok:           true,
    creditAmount: creditAmount,
    bonusAmount:  bonusAmount,
    memberCode:   code,
    memberName:   name,
    phone:        phone
  };
}

// ============================================================
// POST — staffDeduct
// body: { userId, staffName, recordId, memberCode, price }
// คืนค่า: { ok, newBalance } หรือ { ok: false, shortage: true, shortfall }
// ============================================================
function _staffDeduct(body) {
  var userId     = body.userId;
  var staffName  = body.staffName;
  var recordId   = body.recordId;
  var memberCode = String(body.memberCode || '').replace(/'/g, '').trim();
  var price      = parseFloat(body.price) || 0;

  if (!userId || !memberCode || !recordId || price <= 0) {
    return { ok: false, error: 'ข้อมูลไม่ครบถ้วน' };
  }

  var m = getMemberByCode(memberCode);
  if (!m) return { ok: false, error: 'ไม่พบสมาชิกรหัส ' + memberCode };

  // เช็คยอดพอไหม
  if (m.balance < price) {
    return {
      ok:       false,
      shortage: true,
      shortfall: price - m.balance,
      balance:   m.balance,
      memberName: m.name
    };
  }

  // ตัดยอด
  var oldB = m.balance;
  var newB = oldB - price;

  updateRecordToMember(recordId, m.phone);
  updateMemberBalance(m.phone, price);
  writeMemberLog(m.phone, 'ใช้บริการ (หักยอด #' + recordId + ')',
    '-' + price, oldB, newB, staffName);

  // แจ้งลูกค้า
  var rInfo = getRecordInfo(recordId);
  if (m.lineId && m.lineId !== '-') {
    pushToCustomer(m.lineId, getFlexNotifyCut(rInfo.service, rInfo.price, newB, oldB, staffName, m.phone));
  }

  Logger.log('[StaffAPI] deduct: ' + memberCode + ' ฿' + price + ' เหลือ ฿' + newB);

  return { ok: true, newBalance: newB, memberName: m.name };
}

// ============================================================
// POST — staffRequestVoid
// body: { userId, staffName, recordId }
// คืนค่า: { ok }
// ============================================================
function _staffRequestVoid(body) {
  var userId    = body.userId;
  var staffName = body.staffName;
  var recordId  = body.recordId;

  if (!userId || !recordId) return { ok: false, error: 'ข้อมูลไม่ครบ' };

  ensureRecordColumns();
  var recSheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  var recRow    = parseInt(recordId);
  var curStatus = String(recSheet.getRange(recRow, 10).getValue());

  if (curStatus === 'ยกเลิก')     return { ok: false, error: 'ยกเลิกไปแล้วค่ะ' };
  if (curStatus === 'รออนุมัติ')  return { ok: false, error: 'ส่งคำขอไปแล้ว รอ Admin อนุมัติค่ะ' };

  recSheet.getRange(recRow, 10).setValue('รออนุมัติ');
  recSheet.getRange(recRow, 12).setValue(staffName);
  recSheet.getRange(recRow, 13).setValue(new Date());

  var rInfo = getRecordInfo(recordId);
  pushAdminVoidRequest(ADMIN_USER_ID, staffName, rInfo.service, rInfo.price, recordId, userId);

  return { ok: true };
}



function _lineLogin(p) {
  try {
    const props     = PropertiesService.getScriptProperties();
    const channelId = props.getProperty('LINE_CHANNEL_ID');
    const secret    = props.getProperty('LINE_CHANNEL_SECRET');
 
    if (!channelId || !secret) {
      return { ok: false, error: 'LINE credentials ยังไม่ได้ตั้งค่าใน Script Properties' };
    }
 
    if (!p.code || !p.redirectUri) {
      return { ok: false, error: 'Missing code or redirectUri' };
    }
 
    /* ── Step 1: แลก code → access_token ── */
    const tokenRes = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'post',
      contentType: 'application/x-www-form-urlencoded',
      payload: {
        grant_type:    'authorization_code',
        code:          p.code,
        redirect_uri:  p.redirectUri,
        client_id:     channelId,
        client_secret: secret,
      },
      muteHttpExceptions: true,
    });
 
    const tokenData = JSON.parse(tokenRes.getContentText());
    if (!tokenData.access_token) {
      Logger.log('LINE token error: ' + JSON.stringify(tokenData));
      return { ok: false, error: tokenData.error_description || 'ไม่สามารถแลก token ได้' };
    }
 
    const accessToken = tokenData.access_token;
 
    /* ── Step 2: ดึง LINE Profile ── */
    const profileRes = UrlFetchApp.fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: 'Bearer ' + accessToken },
      muteHttpExceptions: true,
    });
 
    const profile = JSON.parse(profileRes.getContentText());
    if (!profile.userId) {
      return { ok: false, error: 'ดึงข้อมูล LINE profile ไม่ได้' };
    }
 
    /* ── Step 3: ตรวจสอบว่าเป็นพนักงานที่ลงทะเบียนแล้ว (optional) ──
       ถ้าต้องการ whitelist ให้ uncomment ส่วนนี้
       และสร้าง Sheet "พนักงาน" คอลัมน์ A = userId, B = ชื่อ
    */
    // const staffSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('พนักงาน');
    // const staffData  = staffSheet.getDataRange().getValues();
    // const staffRow   = staffData.find(r => r[0] === profile.userId);
    // if (!staffRow) {
    //   return { ok: false, error: 'ไม่พบบัญชีพนักงาน กรุณาติดต่อ Admin' };
    // }
    // const displayName = staffRow[1] || profile.displayName; // ใช้ชื่อจาก Sheet ถ้ามี
 
    return {
      ok:          true,
      userId:      profile.userId,
      displayName: profile.displayName,
      pictureUrl:  profile.pictureUrl || '',
    };
 
  } catch (e) {
    Logger.log('_lineLogin error: ' + e.toString());
    return { ok: false, error: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}



// บันทึกรายการลง Sheet ตามคอลัมน์จริง
// A=วันที่, B=เวลา, C=UserID, D=ชื่อพนักงาน, E=บริการ, F=ราคา, G=การชำระ, H=เบอร์ลูกค้า, I=หมายเหตุ
function _logTransaction(params) {
  try {
    const ss       = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName('รายการ');
    if (!logSheet) return;

    const now     = new Date();
    const timeStr = Utilities.formatDate(now, 'Asia/Bangkok', 'H:mm');

    logSheet.appendRow([
      now,                        // A วันที่
      timeStr,                    // B เวลา
      params.userId    || '',     // C UserID
      params.staffName || '',     // D ชื่อพนักงาน
      params.service   || '',     // E บริการ
      params.amount    || 0,      // F ราคา
      params.payment   || 'Cash', // G การชำระ
      params.phone     || '-',    // H เบอร์ลูกค้า
      params.note      || '-',    // I หมายเหตุ
    ]);
  } catch(e) {
    console.log('_logTransaction error:', e.message);
  }
}

function _staffRegisterMember(p) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('สมาชิก');

    const name       = p.name       || '';
    const phone      = String(p.phone || '').replace(/\D/g, '');
    const memberCode = String(p.memberCode || '').padStart(4, '0');
    const payAmount  = Number(p.amount)  || 0;
    const payment    = p.payment || 'Cash';

    if (!name || !phone || !memberCode || payAmount <= 0)
      return { ok: false, error: 'ข้อมูลไม่ครบค่ะ' };

    // เช็ค duplicate รหัส (คอลัมน์ F index 5 = รหัสสมาชิก)
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][5]).padStart(4,'0') === memberCode)
        return { ok: false, error: `รหัส ${memberCode} มีอยู่แล้วค่ะ` };
    }

    const credit = _calcCredit(payAmount);
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    // Sheet สมาชิก: เบอร์ | ชื่อ | ยอดเงิน | UserID_Line | วันหมดอายุ | รหัสสมาชิก
    sheet.appendRow([
      '\'' + phone,
      name,
      credit,
      '',
      expiry,
      memberCode,
    ]);

    // บันทึกลง Sheet รายการ
    _logTransaction({
      userId:    p.userId,
      staffName: p.staffName,
      service:   'เปิดเมมเบอร์ใหม่',
      amount:    payAmount,
      payment:   payment,
      phone:     phone,
      note:      name + ' (รหัส ' + memberCode + ')',
    });

    return { ok: true, memberCode, name, credit };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

function _staffTopupMember(p) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('สมาชิก');

    const memberCode = String(p.memberCode || '').padStart(4, '0');
    const payAmount  = Number(p.payAmount) || 0;
    const payment    = p.payment || 'Cash';

    if (!memberCode || payAmount <= 0)
      return { ok: false, error: 'ข้อมูลไม่ครบค่ะ' };

    const credit = _calcCredit(payAmount);

    // หาแถวสมาชิก
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    let phone    = '-';
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][5]).padStart(4,'0') === memberCode) {
        rowIndex = i + 1; // 1-based
        phone    = String(data[i][0]).replace("'", '');
        break;
      }
    }
    if (rowIndex === -1)
      return { ok: false, error: `ไม่พบสมาชิกรหัส ${memberCode}` };

    // อัปเดตยอดเงิน (คอลัมน์ C = index 2, แต่ sheet เป็น 1-based = คอลัมน์ 3)
    const currentBalance = Number(data[rowIndex - 1][2]) || 0;
    sheet.getRange(rowIndex, 3).setValue(currentBalance + credit);

    // บันทึกลง Sheet รายการ
    _logTransaction({
      userId:    p.userId,
      staffName: p.staffName,
      service:   'เติมเงินสมาชิก',
      amount:    payAmount,
      payment:   payment,
      phone:     phone,
      note:      p.memberName + ' (รหัส ' + memberCode + ') +' + credit,
    });

    return { ok: true, newBalance: currentBalance + credit };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

function _calcCredit(amount) {
  if (amount >= 20000) return 27000;
  if (amount >= 10000) return 13000;
  if (amount >=  5000) return  6000;
  return amount;
}
