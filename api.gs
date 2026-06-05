// ============================================================
//  api.gs — Nail Kloset Website API  [FIXED]
//
//  แก้ไขหลัก:
//  - _handleWebAPI ใช้ e.parameter ตรงๆ (GET query string)
//    ไม่ต้อง merge กับ POST body
//  - switch cases ตรงกับชื่อฟังก์ชันใน StaffAPI.gs ทุกตัว
//  - เพิ่ม _getMemberByCodeAPI wrapper
// ============================================================

const WEB_ADMIN_PASS = 'nail2025';
const CALENDAR_ID    = 'primary';

const SERVICE_DURATION = {
  'ทำเล็บ':        60,
  'ต่อขนตา':       60,
  'สปามือ / เท้า': 60,
  'สปามือ/เท้า':   60,
  'แว็กขน':        45,
  'หลายบริการ':    60
};

const SHOP_OPEN     = 10;
const SHOP_CLOSE    = 20;
const SLOT_INTERVAL = 60;

// ============================================================
// doGet — จุดเข้าหลักทั้ง Dashboard และ Staff PWA API
// ============================================================
function doGet(e) {
  if (!e || !e.parameter) {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Nail Kloset Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  var page   = e.parameter.page   || '';
  var action = e.parameter.action || '';

  if (page === 'booking') {
    return HtmlService.createHtmlOutputFromFile('Booking_liff')
      .setTitle('Nail Kloset — จองคิวออนไลน์')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  if (page === 'booking_simple') {
    return HtmlService.createHtmlOutputFromFile('Booking')
      .setTitle('Nail Kloset — จองนัด')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  if (page === 'payslip') {
    return HtmlService.createHtmlOutputFromFile('Payslip')
      .setTitle('Nail Kloset — สลิปเงินเดือน v2')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (action) {
    return _handleWebAPI(e);
  }

  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Nail Kloset Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================
// Router — ใช้ e.parameter (GET query string) เท่านั้น
// ============================================================
function _handleWebAPI(e) {
  var out = ContentService.createTextOutput();
  out.setMimeType(ContentService.MimeType.JSON);

  try {
    var p      = e.parameter;       // query string params ทั้งหมด
    var action = p.action || '';
    var result;

    Logger.log('[API] action=' + action + ' params=' + JSON.stringify(p));

    switch (action) {

      // ── Staff PWA ──────────────────────────────────────────
      case 'getStaffComm':
        result = _getStaffComm(p);
        break;

      case 'getStaffTodayRecords':
        result = _getStaffTodayRecords(p);
        break;

      case 'getStaffSummary':
        result = _getStaffSummary(p);
        break;

      case 'getMemberByCode':
        result = _getMemberByCodeAPI(p);
        break;

      case 'staffSaveRecord':
        result = _staffSaveRecord(p);
        break;

      case 'staffRegister':
        result = _staffRegister(p);
        break;

      case 'staffTopup':
        result = _staffTopup(p);
        break;

      case 'staffDeduct':
        result = _staffDeduct(p);
        break;

      case 'staffRequestVoid':
        result = _staffRequestVoid(p);
        break;

      case 'lineLogin':
        result = _lineLogin(p);
        break;

      // ── Booking LIFF ──────────────────────────────────────
      case 'bk_getServices':
        result = bk_getServices();
        break;
      case 'bk_getStaffs':
        result = bk_getStaffs();
        break;
      case 'bk_getAvailTimes':
        result = bk_getAvailTimes(p);
        break;
      case 'bk_registerCustomer':
        result = bk_registerCustomer(p);
        break;
      case 'bk_createBooking':
        result = bk_createBooking(p);
        break;
      case 'bk_getMyBookings':
        result = bk_getMyBookings(p);
        break;
      case 'bk_cancelBooking':
        result = bk_cancelBooking(p);
        break;
      case 'bk_getBookingAdmin':
        result = bk_getBookingAdmin(p);
        break;
      case 'bk_updateStatus':
        result = bk_updateStatus(p);
        break;
      case 'getMemberByLine':
        result = _getMemberByLine(p);
        break;
      case 'linkPhone':
        result = _linkPhone(p);
        break;

      // ── Dashboard ─────────────────────────────────────────
      case 'getDashboardDataFromSheet':
        result = getDashboardDataFromSheet(p.sheetName || 'รายการ');
        break;
      case 'getMembersData':
        result = getMembersData();
        break;
      case 'getArchivedMonths':
        result = getArchivedMonths();
        break;
      case 'getConfig':
        result = getConfig() || {};
        break;
      case 'saveConfig':
        result = _saveConfigFromWeb(p);
        break;
      case 'getExpenseData':
        result = getExpenseData(p.periodKey || 'month');
        break;

      // ── Analytics ─────────────────────────────────────────
      case 'getHeatmapData':
        result = getHeatmapData(p.periodKey || '', p.sheetName || '');
        break;
      case 'getStaffComparison':
        result = getStaffComparison(p.months || 3);
        break;
      case 'getServiceAnalytics':
        result = getServiceAnalytics(p.periodKey || '', p.sheetName || '');
        break;
      case 'getRetentionData':
        result = getRetentionData(p.periodKey || '', p.sheetName || '');
        break;

      // ── Member ────────────────────────────────────────────
      case 'getMemberStats':
        result = getMemberStats();
        break;
      case 'exportMembersCSV':
        result = exportMembersCSV();
        break;

      // ── Settings ──────────────────────────────────────────
      case 'getShopHours':
        result = getShopHours();
        break;
      case 'saveShopHours':
        result = saveShopHours(p);
        break;
      case 'getPromoList':
        result = getPromoList();
        break;
      case 'savePromo':
        result = savePromo(p);
        break;
      case 'deletePromo':
        result = deletePromo(p);
        break;

      default:
        result = { ok: false, error: 'Unknown action: ' + action };
    }

    out.setContent(JSON.stringify(result));

  } catch (err) {
    Logger.log('[_handleWebAPI] ERROR: ' + err.message + '\n' + err.stack);
    out.setContent(JSON.stringify({ ok: false, error: err.message }));
  }
  return out;
}

// ============================================================
// _getMemberByCodeAPI — wrapper สำหรับ ?action=getMemberByCode
// คืน { found, name, balance, memberCode, phone, expiry }
// ============================================================
function _getMemberByCodeAPI(p) {
  if (!p.code) return { ok: false, found: false, error: 'code จำเป็น' };

  var code = String(p.code).replace(/'/g, '').trim().padStart(4, '0');
  var m    = getMemberByCode(code);
  if (!m) return { ok: true, found: false };

  var expiryStr = '';
  if (m.expiry) {
    try {
      var d = (m.expiry instanceof Date) ? m.expiry : new Date(m.expiry);
      if (!isNaN(d.getTime())) {
        expiryStr = Utilities.formatDate(d, 'GMT+7', 'dd/MM/yyyy');
      }
    } catch(ex) {}
  }

  return {
    ok:         true,
    found:      true,
    name:       m.name,
    balance:    m.balance,
    memberCode: m.memberCode,
    phone:      String(m.phone || '').replace(/'/g, ''),
    lineId:     m.lineId || '-',
    expiry:     expiryStr
  };
}

// ============================================================
// BOOKINGS
// ============================================================
function _addBooking(p) {
  if (!p.name || !p.phone || !p.service || !p.date || !p.time) {
    return { ok: false, error: 'กรุณากรอกข้อมูลให้ครบค่ะ' };
  }
  var dur  = SERVICE_DURATION[p.service] || 90;
  var busy = _isSlotBusy(p.date, p.time, dur);
  if (busy) return { ok: false, error: 'เวลา ' + p.time + ' น. เต็มแล้วค่ะ', slotFull: true };

  var sheet = _sheet('bookings',
    ['id','name','phone','service','date','time','note','status','createdAt','calEventId']);
  var id    = String(Date.now());
  var nowTH = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
  sheet.appendRow([id, p.name, p.phone, p.service, p.date, p.time, p.note||'', 'pending', nowTH, '']);

  var calEventId = _createCalendarEvent(p, id, dur);
  if (calEventId) {
    var lastRow = sheet.getLastRow();
    if (String(sheet.getRange(lastRow, 1).getValue()) === id) {
      sheet.getRange(lastRow, 10).setValue(calEventId);
    }
  }

  _notifyStaffFlex(p, id);
  _scheduleReminder(id, p.date, p.time, p.name, p.service);
  return { ok: true, id: id };
}

function _getBookings() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('bookings');
  if (!sheet) return { ok: true, bookings: [] };
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { ok: true, bookings: [] };
  var rows = data.slice(1).map(function(r) {
    return { id:String(r[0]), name:r[1], phone:r[2], service:r[3],
             date:r[4], time:r[5], note:r[6], status:r[7], createdAt:r[8] };
  }).reverse();
  return { ok: true, bookings: rows };
}

function _updateBookingStatus(p) {
  if (!p.id || !p.status) return { ok: false, error: 'id และ status จำเป็น' };
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('bookings');
  if (!sheet) return { ok: false, error: 'ไม่พบ sheet bookings' };
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.id)) {
      sheet.getRange(i+1, 8).setValue(p.status);
      if (p.status === 'cancelled' && data[i][9]) _deleteCalendarEvent(data[i][9]);
      return { ok: true };
    }
  }
  return { ok: false, error: 'ไม่พบ booking id: ' + p.id };
}

// ============================================================
// AVAILABLE SLOTS
// ============================================================
function _getAvailableSlots(p) {
  if (!p.date) return { ok: false, error: 'กรุณาระบุวันที่' };
  var service = p.service || 'ทำเล็บ';
  var dur     = SERVICE_DURATION[service] || 90;
  var slots   = _generateSlots();
  var now     = new Date();
  var cutoff  = new Date(now.getTime() + 60*60*1000);
  var parts   = p.date.split('-');
  var sy = parseInt(parts[0]), sm = parseInt(parts[1])-1, sd = parseInt(parts[2]);
  var todayTH = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  var isToday = (sy===todayTH.getFullYear() && sm===todayTH.getMonth() && sd===todayTH.getDate());

  var result = slots.map(function(slot) {
    var hm       = slot.split(':');
    var slotTime = new Date(sy, sm, sd, parseInt(hm[0]), parseInt(hm[1]), 0);
    var tooSoon  = isToday && slotTime < cutoff;
    return { time: slot, available: !tooSoon && !_isSlotBusy(p.date, slot, dur),
             reason: tooSoon ? 'past' : (_isSlotBusy(p.date, slot, dur) ? 'busy' : '') };
  }).filter(function(s) { return s.reason !== 'past'; });

  return { ok: true, slots: result, date: p.date, service: service };
}

function _generateSlots() {
  var slots = [];
  for (var h = SHOP_OPEN; h < SHOP_CLOSE; h += (SLOT_INTERVAL/60)) {
    var hh = Math.floor(h).toString().padStart(2,'0');
    var mm = ((h%1)*60).toString().padStart(2,'0');
    slots.push(hh+':'+mm);
  }
  return slots;
}

// ============================================================
// GOOGLE CALENDAR
// ============================================================
function _createCalendarEvent(p, bookingId, dur) {
  try {
    var cal   = CalendarApp.getDefaultCalendar();
    var parts = p.date.split('-');
    var hm    = (p.time||'10:00').split(':');
    var start = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]),
                         parseInt(hm[0]), parseInt(hm[1]||'0'), 0);
    var end   = new Date(start.getTime() + (dur||90)*60000);
    var event = cal.createEvent('💅 '+p.service+' — '+p.name, start, end, {
      description: ['ชื่อ: '+p.name,'โทร: '+p.phone,'บริการ: '+p.service,
                    'หมายเหตุ: '+(p.note||'-'),'Booking ID: '+bookingId].join('\n'),
      color: CalendarApp.EventColor.FLAMINGO
    });
    return event.getId();
  } catch(err) { Logger.log('Calendar ERROR: '+err.message); return null; }
}

function _isSlotBusy(dateStr, timeStr, durMin) {
  try {
    var cal   = CalendarApp.getDefaultCalendar();
    var parts = String(dateStr).split('-');
    var hm    = String(timeStr||'10:00').split(':');
    var s     = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]),
                         parseInt(hm[0]), parseInt(hm[1]||'0'), 0);
    var e     = new Date(s.getTime() + (durMin||90)*60000);
    return cal.getEvents(s, e).length > 0;
  } catch(err) { Logger.log('Slot check: '+err.message); return false; }
}

function _deleteCalendarEvent(id) {
  try {
    var e = CalendarApp.getDefaultCalendar().getEventById(id);
    if (e) e.deleteEvent();
  } catch(err) { Logger.log('Cal delete: '+err.message); }
}

// ============================================================
// LINE
// ============================================================
var _LINE_TOKEN_STAFF = '3URg+f03o1BPcovMIr0Km0lkLtwtIp4kL62FqU3Zsc4dTXBA0rcohA3FmukXL8DwTTEylfZgh2LFQq0YuhRxRB+Uo8AAByKj/udUzfa/ISdr5v3iP2sjlGLG63DW6PAncHh/UM9FP5m8IUOHKhmexgdB04t89/1O/w1cDnyilFU=';
var _ADMIN_USER_ID    = 'Uccd1338e1f146d4bbc0988bb98d7b124';

function _notifyStaffFlex(p, bookingId) {
  var flex = {
    type:'bubble', size:'mega',
    header:{ type:'box', layout:'vertical', backgroundColor:'#FF6B9D', paddingAll:'20px',
      contents:[
        { type:'text', text:'📅 มีคำจองใหม่!', color:'#ffffff', weight:'bold', size:'lg' },
        { type:'text', text:'Nail Kloset — Online Booking', color:'#FFE0EC', size:'xs', margin:'xs' }
      ]},
    body:{ type:'box', layout:'vertical', spacing:'md', paddingAll:'20px',
      contents:[
        _fRow('👤 ชื่อ',   p.name),
        _fRow('📞 โทร',    p.phone),
        _fRow('💅 บริการ', p.service),
        _fRow('📆 วันที่', (p.date||'-')+'  ⏰ '+(p.time||'-')+' น.'),
        { type:'separator', margin:'lg' },
        { type:'box', layout:'horizontal', spacing:'md', margin:'lg',
          contents:[
            { type:'button', style:'primary', color:'#1DB446', flex:1, height:'sm',
              action:{ type:'postback', label:'✅ ยืนยันคิว', data:'confirmBooking_'+bookingId }},
            { type:'button', style:'primary', color:'#E8457A', flex:1, height:'sm',
              action:{ type:'postback', label:'❌ ยกเลิก',    data:'rejectBooking_'+bookingId }}
          ]}
      ].concat(p.note ? [_fRow('📝 หมายเหตุ', p.note)] : [])
    }
  };
  try {
    var res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+_LINE_TOKEN_STAFF },
      payload: JSON.stringify({ to:_ADMIN_USER_ID,
        messages:[{ type:'flex', altText:'📅 คำจองใหม่: '+p.name+' — '+p.service, contents:flex }]
      }), muteHttpExceptions:true
    });
    if (res.getResponseCode()!==200) _logLineError(res.getResponseCode(), res.getContentText(), p.name, bookingId);
  } catch(err) { _logLineError('exception', err.message, p.name, bookingId); }
}

function _logLineError(code, body, name, bookingId) {
  try {
    _sheet('LineErrors', ['Timestamp','BookingId','Name','StatusCode','Response'])
      .appendRow([new Date(), bookingId, name, String(code), String(body).substring(0,500)]);
  } catch(e) {}
}

function _fRow(label, value) {
  return { type:'box', layout:'horizontal',
    contents:[
      { type:'text', text:label,                size:'sm', color:'#888888', flex:3, gravity:'center' },
      { type:'text', text:String(value||'-'),   size:'sm', weight:'bold',   align:'end', flex:5, wrap:true }
    ]};
}

// ============================================================
// REMINDER
// ============================================================
function _scheduleReminder(bookingId, dateStr, timeStr, name, service) {
  try {
    var parts = dateStr.split('-'), hm = timeStr.split(':');
    var appt  = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]),
                         parseInt(hm[0]), parseInt(hm[1]||'0'), 0);
    var alert = new Date(appt.getTime() - 2*60*60*1000);
    var props = PropertiesService.getScriptProperties();
    if (alert > new Date()) {
      var q = JSON.parse(props.getProperty('reminderQueue')||'[]');
      q.push({ type:'staff_alert', bookingId:bookingId, sendAt:alert.toISOString(),
               name:name, service:service, date:dateStr, time:timeStr });
      props.setProperty('reminderQueue', JSON.stringify(q));
      ScriptApp.newTrigger('sendBookingReminders').timeBased().at(alert).create();
    }
    var day1 = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    day1.setDate(day1.getDate()-1); day1.setHours(18,0,0,0);
    if (day1 > new Date()) {
      var q2 = JSON.parse(props.getProperty('reminderQueue')||'[]');
      q2.push({ type:'customer_reminder', bookingId:bookingId, sendAt:day1.toISOString(),
                name:name, service:service, date:dateStr, time:timeStr });
      props.setProperty('reminderQueue', JSON.stringify(q2));
      ScriptApp.newTrigger('sendBookingReminders').timeBased().at(day1).create();
    }
  } catch(err) { Logger.log('Reminder: '+err.message); }
}

function sendBookingReminders() {
  var props = PropertiesService.getScriptProperties();
  var queue = JSON.parse(props.getProperty('reminderQueue')||'[]');
  var now   = new Date(), keep = [];
  queue.forEach(function(item) {
    var diff = Math.abs(now - new Date(item.sendAt));
    if (diff < 2*60*60*1000) {
      if (item.type==='staff_alert') _doSendStaffAlert(item);
      else _doSendReminder(item);
    } else if (new Date(item.sendAt) > now) keep.push(item);
  });
  props.setProperty('reminderQueue', JSON.stringify(keep));
}

function _doSendReminder(item) {
  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method:'POST', muteHttpExceptions:true,
      headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+_LINE_TOKEN_STAFF },
      payload: JSON.stringify({ to:_ADMIN_USER_ID,
        messages:[{ type:'text', text:'📋 Reminder: '+item.name+' — '+item.service+' — '+item.time+' น. (พรุ่งนี้)' }]
      })
    });
  } catch(e) {}
}

function _doSendStaffAlert(item) {
  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method:'POST', muteHttpExceptions:true,
      headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+_LINE_TOKEN_STAFF },
      payload: JSON.stringify({ to:_ADMIN_USER_ID,
        messages:[{ type:'text', text:'⏰ อีก 2 ชั่วโมงมีนัด!\n💅 '+item.service+'\n👤 '+item.name+'\n⏰ '+item.time+' น.' }]
      })
    });
  } catch(e) { Logger.log('Staff alert: '+e.message); }
}

// ============================================================
// HANDLE BOOKING POSTBACK
// ============================================================
function handleBookingPostback(replyToken, data) {
  var parts  = data.split('_'), action = parts[0], bookingId = parts[1];
  var sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('bookings');
  if (!sheet) {
    callLineAPI('reply', { replyToken:replyToken, messages:[{ type:'text', text:'⚠️ ไม่พบข้อมูลการจองค่ะ' }] }, false);
    return;
  }
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) !== String(bookingId)) continue;
    var b = { name:rows[i][1], service:rows[i][3], date:rows[i][4], time:rows[i][5], calEventId:rows[i][9] };
    if (action === 'confirmBooking') {
      sheet.getRange(i+1, 8).setValue('confirmed');
      callLineAPI('reply', { replyToken:replyToken,
        messages:[{ type:'text', text:'✅ ยืนยันคิวของ '+b.name+' แล้วค่ะ\n💅 '+b.service+'\n📆 '+b.date+'  ⏰ '+b.time+' น.' }]
      }, false);
    } else if (action === 'rejectBooking') {
      sheet.getRange(i+1, 8).setValue('cancelled');
      if (b.calEventId) _deleteCalendarEvent(b.calEventId);
      callLineAPI('reply', { replyToken:replyToken,
        messages:[{ type:'text', text:'❌ ยกเลิกคิว '+b.name+' เรียบร้อยค่ะ' }]
      }, false);
    }
    return;
  }
  callLineAPI('reply', { replyToken:replyToken,
    messages:[{ type:'text', text:'⚠️ ไม่พบคำจอง ID: '+bookingId }]
  }, false);
}

// ============================================================
// HELPERS
// ============================================================
function _sheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1,1,1,headers.length).setBackground('#FF6B9D').setFontColor('#FFFFFF').setFontWeight('bold');
  }
  return sheet;
}

function _deleteRowById(sheetName, id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return { ok:false, error:'ไม่พบ sheet '+sheetName };
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i+1); return { ok:true }; }
  }
  return { ok:false, error:'ไม่พบ id: '+id };
}

function _saveConfigFromWeb(p) {
  var boolKeys = ['PROMO_REG_ACTIVE','PROMO_TOPUP_ACTIVE','NOTIFY_EDIT','SEND_RECEIPT'];
  var numKeys  = ['BONUS_REGISTER','BONUS_TOPUP','TIER_20K','TIER_10K','TIER_5K',
                  'COMM_NAIL','COMM_LASH','COMM_SPA','COMM_WAX','COMM_MEM',
                  'CREDIT_FEE','MEMBER_EXPIRE_MONTHS','EDIT_LIMIT_MIN','EXPIRE_WARN_MONTHS','MONTHLY_TARGET'];
  var cfg = {};
  Object.keys(p).forEach(function(key) {
    if (key === 'action') return;
    if (boolKeys.indexOf(key) !== -1)     cfg[key] = (p[key]==='true'||p[key]===true);
    else if (numKeys.indexOf(key) !== -1) cfg[key] = parseFloat(p[key])||0;
    else                                  cfg[key] = p[key];
  });
  saveConfig(cfg);
  return { ok:true };
}

function getPayslipUrl() {
  return ScriptApp.getService().getUrl() + '?page=payslip';
}

function testLineNotify() {
  var res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method:'POST', muteHttpExceptions:true,
    headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+_LINE_TOKEN_STAFF },
    payload: JSON.stringify({ to:_ADMIN_USER_ID, messages:[{ type:'text', text:'🧪 ทดสอบระบบ ✅' }] })
  });
  Logger.log('HTTP: '+res.getResponseCode()+' | '+res.getContentText());
}
