// ============================================================
//  StaffAPI.gs — Nail Kloset Staff PWA Endpoints  [FIXED]
//
//  แก้ไข:
//  1. _staffSaveRecord — เพิ่มการตัดยอดสมาชิกจริง (updateRecordToMember,
//     updateMemberBalance, writeMemberLog, แจ้ง LINE ลูกค้า)
//  2. _staffRegister   — แก้ accountType + เบอร์โทรใช้ตัวแปร normalize แล้ว
// ============================================================

function _corsResponse(data) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
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
// ============================================================
function _getStaffTodayRecords(p) {
  if (!p.userId) return { ok: false, error: 'userId จำเป็น' };

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  if (!sheet) return { ok: true, records: [] };

  var tz       = Session.getScriptTimeZone();
  var now      = new Date();
  var todayStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  var data     = sheet.getDataRange().getValues();
  var records  = [];

  data.slice(1).forEach(function(row) {
    var rowDate = new Date(row[0]);
    if (isNaN(rowDate.getTime())) return;

    var rowDateStr = Utilities.formatDate(rowDate, tz, 'yyyy-MM-dd');
    if (rowDateStr !== todayStr) return;

    var userId = String(row[2] || '');
    if (userId !== String(p.userId)) return;

    var status = String(row[9] || '');
    if (status === 'ยกเลิก') return;

    var price = Number(row[5]) || 0;
    if (price <= 0) return;

    records.push({
      id:      String(row[0]),
      service: String(row[4] || '-'),
      price:   price,
      payment: String(row[6] || 'Cash'),
      note:    String(row[8] || ''),
      time:    Utilities.formatDate(rowDate, tz, 'HH:mm'),
      status:  status
    });
  });

  records.sort(function(a, b) { return b.id.localeCompare(a.id); });
  return { ok: true, records: records };
}

// ============================================================
// GET — getStaffSummary
// ============================================================
function _getStaffSummary(p) {
  if (!p.userId) return { ok: false, error: 'userId จำเป็น' };

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECORDS);
  if (!sheet) return { ok: true, total: 0, comm: 0, count: 0, byService: {} };

  var now    = new Date();
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

    var userId = String(row[2] || '');
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
// POST — staffSaveRecord  [FIXED]
//
// แก้ไข: เพิ่มการตัดยอดสมาชิกจริงเมื่อ payment === 'Member'
//   - updateRecordToMember  → เปลี่ยน payment เป็น 'Member' + บันทึกเบอร์
//   - updateMemberBalance   → ลดยอดสมาชิก
//   - writeMemberLog        → บันทึก Member_Logs
//   - writeLog              → บันทึก Log_History
//   - pushToCustomer        → แจ้ง LINE ลูกค้า (ถ้าผูก)
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

  // ── accountType ตามช่องทางชำระ ──────────────────────────
  var accountType;
  if (payment === 'Credit')        accountType = 'กสิกร';
  else if (payment === 'Transfer') accountType = 'กสิกร';
  else if (payment === 'Member')   accountType = 'ตัดเมมเบอร์';
  else                             accountType = 'เงินในร้าน';

  // ── บันทึก record ─────────────────────────────────────────
  saveRecord(userId, staffName, service, price, payment, '-', note, accountType);
  var recordId = getLastRecordId(userId);

  Logger.log('[StaffAPI] saveRecord: ' + staffName + ' | ' + service + ' ฿' + price + ' | ' + payment);

  // ── ตัดยอดสมาชิก (เมื่อ payment = Member) ────────────────
  if (payment === 'Member' && body.memberCode) {
    var memberCode = String(body.memberCode).replace(/'/g, '').trim();
    var m = getMemberByCode(memberCode);

    if (!m) {
      // บันทึกรายการไปแล้ว แต่หาสมาชิกไม่เจอ — แจ้ง error กลับ
      Logger.log('[StaffAPI] member not found: ' + memberCode);
      return { ok: false, error: 'บันทึกรายการแล้ว แต่ไม่พบสมาชิกรหัส ' + memberCode + ' (record #' + recordId + ')', recordId: recordId };
    }

    if (m.balance < price) {
      Logger.log('[StaffAPI] insufficient balance: ' + m.balance + ' < ' + price);
      return { ok: false, error: 'ยอดเมมเบอร์ไม่พอค่ะ (คงเหลือ ฿' + m.balance.toLocaleString() + ')', recordId: recordId };
    }

    var oldB = m.balance;
    var newB = oldB - price;

    // อัปเดต payment + เบอร์ใน Sheet รายการ
    updateRecordToMember(recordId, m.phone);

    // ลดยอดสมาชิก
    SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(SHEET_MEMBER)
      .getRange(m.row, 3)
      .setValue(newB);

    // บันทึก Member_Logs
    writeMemberLog(
      m.phone,
      'ใช้บริการ (หักยอด #' + recordId + ') — ' + service,
      '-' + price,
      oldB, newB,
      staffName
    );

    // บันทึก Log_History
    writeLog('หักยอดสมาชิก (PWA)', staffName,
      'รหัส: ' + memberCode + ' ยอด: ' + price + ' | ' + service, recordId);

    // แจ้ง LINE ลูกค้า (ถ้าผูก lineId ไว้)
    if (m.lineId && m.lineId !== '-') {
      pushToCustomer(m.lineId,
        getFlexNotifyCut(service, price, newB, oldB, staffName, m.phone)
      );
    }

    Logger.log('[StaffAPI] member deducted: ' + memberCode + ' ฿' + price + ' → เหลือ ฿' + newB);

    return {
      ok:         true,
      recordId:   recordId,
      newBalance: newB,
      memberName: m.name
    };
  }

  return { ok: true, recordId: recordId };
}

// ============================================================
// POST — staffTopup
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

  var mSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MEMBER);
  mSheet.getRange(m.row, 3).setValue(newB);
  mSheet.getRange(m.row, 5).setValue(newExp);

  var accountType = payment === 'Credit' ? 'กสิกร' : payment === 'Transfer' ? 'กสิกร' : 'เงินในร้าน';
  saveRecord(userId, staffName, 'เติมเงินสมาชิก', payAmount, payment, m.phone, '-', accountType);

  writeMemberLog(m.phone,
    'เติมเงิน (จ่าย ฿' + payAmount.toLocaleString() + ' ได้เครดิต ฿' + creditAmount.toLocaleString() + ')',
    '+' + creditAmount, oldB, newB, staffName);

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
// POST — staffRegister  [FIXED]
//
// แก้ไข:
//  1. accountType ใช้ตัวแปร payment จริง (ไม่ hardcode)
//  2. saveRecord ใช้ phoneNorm (มี 0 นำหน้า) แทน phone ตัวเดิม
// ============================================================
function _staffRegister(body) {
  var userId    = body.userId;
  var staffName = body.staffName;
  var name      = String(body.name || '').trim();
  var code      = String(body.memberCode || '').trim();
  var amount    = parseFloat(body.amount) || 0;
  var payment   = body.payment || 'Cash';

  // ── normalize เบอร์: เอาเฉพาะตัวเลข แล้วเติม 0 ถ้า 9 หลัก ──
  var rawPhone  = String(body.phone || '').replace(/\D/g, '');
  var phoneNorm = rawPhone.length === 9 ? '0' + rawPhone : rawPhone;

  // ── Validate ──────────────────────────────────────────────
  if (!userId)                        return { ok: false, error: 'ไม่พบ userId' };
  if (!staffName)                     return { ok: false, error: 'ไม่พบชื่อพนักงาน' };
  if (!name)                          return { ok: false, error: 'กรุณากรอกชื่อสมาชิก' };
  if (!phoneNorm || phoneNorm.length < 9)
                                      return { ok: false, error: 'เบอร์โทรไม่ถูกต้อง' };
  if (!code || code.length !== 4)     return { ok: false, error: 'รหัสต้องเป็น 4 หลักพอดี' };
  if (amount <= 0)                    return { ok: false, error: 'กรุณาระบุยอดเปิดบัญชี' };

  // ── เช็คซ้ำ ───────────────────────────────────────────────
  if (getMemberByPhone(phoneNorm)) return { ok: false, error: 'เบอร์ ' + phoneNorm + ' เป็นสมาชิกอยู่แล้วค่ะ' };
  if (getMemberByCode(code))       return { ok: false, error: 'รหัส ' + code + ' ถูกใช้แล้วค่ะ กรุณาเปลี่ยนรหัส' };

  var creditAmount = calcRegisterCredit(amount);
  var bonusAmount  = getRegisterBonus(amount);
  var now          = new Date();
  var expDate      = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  // ── บันทึก Sheet สมาชิก ──────────────────────────────────
  getOrCreateSheet(SHEET_MEMBER, ['เบอร์โทร', 'ชื่อ', 'ยอดเงิน', 'LineID', 'หมดอายุ', 'รหัสสมาชิก'])
    .appendRow(["'" + phoneNorm, name, creditAmount, '-', expDate, "'" + code]);

  // ── [FIXED] accountType ตาม payment จริง ─────────────────
  var accountType;
  if (payment === 'Credit')        accountType = 'กสิกร';
  else if (payment === 'Transfer') accountType = 'กสิกร';
  else                             accountType = 'เงินในร้าน';

  // ── [FIXED] saveRecord ใช้ phoneNorm ──────────────────────
  saveRecord(userId, staffName, 'เปิดเมมเบอร์ใหม่', amount, payment, phoneNorm, '-', accountType);

  // ── writeMemberLog ────────────────────────────────────────
  writeMemberLog(
    phoneNorm,
    'สมัครสมาชิกใหม่ (จ่าย ฿' + amount.toLocaleString() + ' ได้เครดิต ฿' + creditAmount.toLocaleString() + ')',
    '+' + creditAmount,
    0,
    creditAmount,
    staffName
  );

  Logger.log('[StaffAPI] register: ' + name + ' เบอร์ ' + phoneNorm +
             ' รหัส ' + code + ' เครดิต ฿' + creditAmount + ' (' + payment + ')');

  return {
    ok:           true,
    creditAmount: creditAmount,
    bonusAmount:  bonusAmount,
    memberCode:   code,
    memberName:   name,
    phone:        phoneNorm
  };
}

// ============================================================
// POST — staffDeduct
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

  if (m.balance < price) {
    return {
      ok:         false,
      shortage:   true,
      shortfall:  price - m.balance,
      balance:    m.balance,
      memberName: m.name
    };
  }

  var oldB = m.balance;
  var newB = oldB - price;

  updateRecordToMember(recordId, m.phone);
  updateMemberBalance(m.phone, price);
  writeMemberLog(m.phone, 'ใช้บริการ (หักยอด #' + recordId + ')',
    '-' + price, oldB, newB, staffName);

  writeLog('หักยอดสมาชิก (PWA staffDeduct)', staffName,
    'รหัส: ' + memberCode + ' ยอด: ' + price, recordId);

  var rInfo = getRecordInfo(recordId);
  if (m.lineId && m.lineId !== '-') {
    pushToCustomer(m.lineId,
      getFlexNotifyCut(rInfo.service, rInfo.price, newB, oldB, staffName, m.phone)
    );
  }

  Logger.log('[StaffAPI] deduct: ' + memberCode + ' ฿' + price + ' เหลือ ฿' + newB);
  return { ok: true, newBalance: newB, memberName: m.name };
}

// ============================================================
// POST — staffRequestVoid
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

  if (curStatus === 'ยกเลิก')    return { ok: false, error: 'ยกเลิกไปแล้วค่ะ' };
  if (curStatus === 'รออนุมัติ') return { ok: false, error: 'ส่งคำขอไปแล้ว รอ Admin อนุมัติค่ะ' };

  recSheet.getRange(recRow, 10).setValue('รออนุมัติ');
  recSheet.getRange(recRow, 12).setValue(staffName);
  recSheet.getRange(recRow, 13).setValue(new Date());

  var rInfo = getRecordInfo(recordId);
  pushAdminVoidRequest(ADMIN_USER_ID, staffName, rInfo.service, rInfo.price, recordId, userId);

  return { ok: true };
}

// ============================================================
// LINE Login (ใช้ Script Properties)
// ============================================================
function _lineLogin(p) {
  try {
    var props     = PropertiesService.getScriptProperties();
    var channelId = props.getProperty('LINE_CHANNEL_ID');
    var secret    = props.getProperty('LINE_CHANNEL_SECRET');

    if (!channelId || !secret) {
      return { ok: false, error: 'LINE credentials ยังไม่ได้ตั้งค่าใน Script Properties' };
    }
    if (!p.code || !p.redirectUri) {
      return { ok: false, error: 'Missing code or redirectUri' };
    }

    var tokenRes = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/token', {
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

    var tokenData = JSON.parse(tokenRes.getContentText());
    if (!tokenData.access_token) {
      Logger.log('LINE token error: ' + JSON.stringify(tokenData));
      return { ok: false, error: tokenData.error_description || 'ไม่สามารถแลก token ได้' };
    }

    var profileRes = UrlFetchApp.fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: 'Bearer ' + tokenData.access_token },
      muteHttpExceptions: true,
    });

    var profile = JSON.parse(profileRes.getContentText());
    if (!profile.userId) {
      return { ok: false, error: 'ดึงข้อมูล LINE profile ไม่ได้' };
    }

    return {
      ok:          true,
      userId:      profile.userId,
      displayName: profile.displayName,
      pictureUrl:  profile.pictureUrl || '',
    };
  } catch(e) {
    Logger.log('_lineLogin error: ' + e.toString());
    return { ok: false, error: 'เกิดข้อผิดพลาด: ' + e.message };
  }
}

// ============================================================
// Helper: บันทึกรายการลง Sheet
// ============================================================
function _logTransaction(params) {
  try {
    var ss       = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName('รายการ');
    if (!logSheet) return;

    var now     = new Date();
    var timeStr = Utilities.formatDate(now, 'Asia/Bangkok', 'H:mm');

    logSheet.appendRow([
      now,
      timeStr,
      params.userId    || '',
      params.staffName || '',
      params.service   || '',
      params.amount    || 0,
      params.payment   || 'Cash',
      params.phone     || '-',
      params.note      || '-',
    ]);
  } catch(e) {
    Logger.log('_logTransaction error: ' + e.message);
  }
}

function _calcCredit(amount) {
  if (amount >= 20000) return 27000;
  if (amount >= 10000) return 13000;
  if (amount >=  5000) return  6000;
  return amount;
}

// ── bk_ functions (Booking LIFF) ────────────────────────────
function _bk_registerCustomer(p) {
  if (!p.line_user_id) {
    return { ok: false, error: 'line_user_id จำเป็น' };
  }

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('สมาชิก');

  if (!sheet) {
    sheet = ss.insertSheet('สมาชิก');
    var headers = ['เบอร์โทร', 'ชื่อ', 'ยอดเงิน', 'LineID', 'หมดอายุ', 'รหัสสมาชิก'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setBackground('#FF6B9D').setFontColor('#FFFFFF').setFontWeight('bold');
  }

  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var storedLineId = String(data[i][3] || '').trim();
    if (storedLineId === String(p.line_user_id).trim()) {
      var rawBalance = data[i][2];
      var rawExpiry  = data[i][4];
      var memberCode = String(data[i][5] || '').replace(/'/g, '').trim();
      var expiryStr  = '';
      if (rawExpiry && rawExpiry !== '') {
        try {
          expiryStr = Utilities.formatDate(new Date(rawExpiry), 'Asia/Bangkok', 'dd/MM/yyyy');
        } catch(e) {
          expiryStr = String(rawExpiry);
        }
      }
      return {
        ok: true, isNew: false,
        member: {
          name:       String(data[i][1] || p.line_name),
          balance:    (rawBalance === '-' || rawBalance === '') ? '-' : (parseFloat(rawBalance) || 0),
          memberCode: memberCode,
          expiry:     expiryStr
        }
      };
    }
  }

  var usedCodes = {};
  for (var j = 1; j < data.length; j++) {
    var existingCode = parseInt(String(data[j][5] || '').replace(/'/g, '').trim());
    if (!isNaN(existingCode)) usedCodes[existingCode] = true;
  }

  var nextNum = 0;
  while (usedCodes[nextNum]) nextNum++;
  var newMemberCode = String(nextNum).padStart(4, '0');

  sheet.appendRow(['-', p.line_name || '-', '-', p.line_user_id, '', "'" + newMemberCode]);

  Logger.log('[bk_registerCustomer] สร้างสมาชิกใหม่: ' + p.line_name + ' รหัส ' + newMemberCode);

  return {
    ok: true, isNew: true,
    member: { name: p.line_name || '-', balance: '-', memberCode: newMemberCode, expiry: '' }
  };
}

function _bk_getStaffs() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('พนักงาน');
  if (!sheet) return { ok: true, staffs: [] };

  var data    = sheet.getDataRange().getValues();
  var staffs  = [];
  var numCols = data.length > 0 ? data[0].length : 3;

  for (var i = 1; i < data.length; i++) {
    var userId = String(data[i][0] || '').trim();
    var name   = String(data[i][1] || '').trim();
    if (!userId || !name) continue;
    if (userId === 'Uccd1338e1f146d4bbc0988bb98d7b124') continue;
    var image = (numCols >= 4 && data[i][3]) ? String(data[i][3]).trim() : '';
    staffs.push({ id: userId, name: name, image: image, bio: 'ช่างเล็บ' });
  }

  return { ok: true, staffs: staffs };
}
