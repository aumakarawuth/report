// ============================================================
//  api.gs — Nail Kloset Website API  [v2 — Calendar + Slot Block]
//  วางใน Apps Script Project เดียวกับ Code.gs
// ============================================================

const WEB_ADMIN_PASS = 'nail2025';

// ── CALENDAR CONFIG ──────────────────────────────────────────
// ใส่ 'primary' หรือ email ของ Google Calendar ร้าน
const CALENDAR_ID = 'primary';

// ระยะเวลาบริการแต่ละอย่าง (นาที) — ใช้ตรวจ slot ว่าง
const SERVICE_DURATION = {
  'ทำเล็บ':        60,
  'ต่อขนตา':       60,
  'สปามือ / เท้า': 60,
  'สปามือ/เท้า':   60,
  'แว็กขน':        45,
  'หลายบริการ':    60
};

// ── เวลาเปิดปิดร้าน (ชั่วโมง) ───────────────────────────────
const SHOP_OPEN  = 10;   // 10:00
const SHOP_CLOSE = 20;   // 20:00
const SLOT_INTERVAL = 60; // แต่ละ slot ห่างกัน 60 นาที

// ============================================================
// doGet — จุดเข้าหลัก
// ============================================================
function doGet(e) {
  // ── ถ้าไม่มี parameter → แสดง Dashboard ──
  if (!e || !e.parameter) {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Nail Kloset Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  var page   = e.parameter.page   || '';
  var action = e.parameter.action || '';

  // ── page=booking → Booking LIFF ──
  if (page === 'booking') {
    return HtmlService.createHtmlOutputFromFile('Booking_liff')
      .setTitle('Nail Kloset — จองคิวออนไลน์')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── page=booking_simple → Booking แบบเดิม (ถ้าต้องการ) ──
  if (page === 'booking_simple') {
    return HtmlService.createHtmlOutputFromFile('Booking')
      .setTitle('Nail Kloset — จองนัด')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── มี action → เป็น API call ──
  if (action) {
    return _handleWebAPI(e);
  }

  // ── default → Dashboard ──
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Nail Kloset Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================
// Router
// ============================================================
function _handleWebAPI(e) {
  var out = ContentService.createTextOutput();
  out.setMimeType(ContentService.MimeType.JSON);
  try {
    var p      = e.parameter;
    var action = p.action;
    var result;
    switch (action) {
     
      // ── เพิ่มใหม่: Booking LIFF (จาก Booking_api.gs) ──
      case 'bk_getServices':      result = bk_getServices();               break;
      case 'bk_getStaffs':        result = bk_getStaffs();                 break;
      case 'bk_getAvailTimes':    result = bk_getAvailTimes(p);            break;
      case 'bk_registerCustomer': result = bk_registerCustomer(p);         break;
      case 'bk_createBooking':    result = bk_createBooking(p);            break;
      case 'bk_getMyBookings':    result = bk_getMyBookings(p);            break;
      case 'bk_cancelBooking':    result = bk_cancelBooking(p);            break;
      case 'bk_getBookingAdmin':  result = bk_getBookingAdmin(p);          break;
      case 'bk_updateStatus':     result = bk_updateStatus(p);             break;
      case 'getMemberByLine':     result = _getMemberByLine(p);            break;
      case 'linkPhone':           result = _linkPhone(p);                   break;
      case 'bk_registerCustomer': result = _bk_registerCustomer(p);    break;
      case 'bk_getStaffs':        result = _bk_getStaffs();            break;

      default:
        result = { ok: false, error: 'Unknown action: ' + action };
    }
    out.setContent(JSON.stringify(result));
  } catch (err) {
    out.setContent(JSON.stringify({ ok: false, error: err.message }));
  }
  return out;
}

// ============================================================
// AUTH
// ============================================================
function _loginAdmin(p) {
  if (p.pass === WEB_ADMIN_PASS) return { ok: true };
  return { ok: false, error: 'รหัสผ่านไม่ถูกต้อง' };
}

// ============================================================
// PROMOS
// ============================================================
function _getPromos() {
  var sheet = _sheet('promos', ['id','icon','img','title','desc','price','oldPrice','badge','expire']);
  var data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { ok: true, promos: [] };
  return {
    ok: true,
    promos: data.slice(1).map(function(r) {
      return { id: String(r[0]), icon: r[1], img: r[2], title: r[3], desc: r[4],
               price: r[5], oldPrice: r[6], badge: r[7], expire: r[8] };
    })
  };
}

function _addPromo(p) {
  if (!p.title || !p.price) return { ok: false, error: 'title และ price จำเป็น' };
  var sheet = _sheet('promos', ['id','icon','img','title','desc','price','oldPrice','badge','expire']);
  var id    = String(Date.now());
  sheet.appendRow([id, p.icon || '💅', p.img || '', p.title, p.desc || '',
                   Number(p.price), Number(p.oldPrice) || '', p.badge || '', p.expire || '']);
  return { ok: true, id: id };
}


function _deletePromo(id) { return _deleteRowById('promos', id); }

// ============================================================
// GALLERY
// ============================================================
function _getGallery() {
  var sheet = _sheet('gallery', ['id','url','cat','label']);
  var data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { ok: true, gallery: [] };
  return {
    ok: true,
    gallery: data.slice(1).map(function(r) {
      return { id: String(r[0]), url: r[1], cat: r[2], label: r[3] };
    })
  };
}

function _addGallery(p) {
  var sheet = _sheet('gallery', ['id','url','cat','label']);
  var id    = String(Date.now());
  sheet.appendRow([id, p.url || '', p.cat || 'nail', p.label || 'ผลงาน']);
  return { ok: true, id: id };
}

function _deleteGallery(id) { return _deleteRowById('gallery', id); }

// ============================================================
// BOOKINGS — core
// ============================================================
function _addBooking(p) {
  if (!p.name || !p.phone || !p.service || !p.date || !p.time) {
    return { ok: false, error: 'กรุณากรอกข้อมูลให้ครบค่ะ' };
  }

  var dur  = SERVICE_DURATION[p.service] || 90;
  var busy = _isSlotBusy(p.date, p.time, dur);
  if (busy) {
    return { ok: false, error: 'เวลา ' + p.time + ' น. เต็มแล้วค่ะ กรุณาเลือกเวลาอื่น', slotFull: true };
  }

  var sheet = _sheet('bookings',
    ['id','name','phone','service','date','time','note','status','createdAt','calEventId']);
  
  // ใช้ timestamp เป็น id และเวลาไทย
  var id    = String(Date.now());
  var nowTH = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
  
  // บันทึก row ก่อน พร้อม placeholder calEventId
  sheet.appendRow([id, p.name, p.phone, p.service,
                   p.date, p.time, p.note || '', 'pending', nowTH, '']);

  // สร้าง Calendar Event
  var calEventId = _createCalendarEvent(p, id, dur);
  Logger.log('calEventId: ' + calEventId);

  // อัปเดต calEventId กลับลง Sheet โดยหา row ล่าสุดที่เพิ่งเพิ่ม
  if (calEventId) {
    var lastRow = sheet.getLastRow();
    // ตรวจว่า row สุดท้ายคือ id ที่เพิ่งสร้าง
    var checkId = String(sheet.getRange(lastRow, 1).getValue());
    if (checkId === id) {
      sheet.getRange(lastRow, 10).setValue(calEventId);
      Logger.log('Calendar saved at row: ' + lastRow);
    } else {
      // fallback scan หา id
      var data = sheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (String(data[i][0]) === id) {
          sheet.getRange(i + 1, 10).setValue(calEventId);
          break;
        }
      }
    }
  }

  // แจ้ง LINE
  _notifyStaffFlex(p, id);

  // ตั้ง Reminder
  _scheduleReminder(id, p.date, p.time, p.name, p.service);

  return { ok: true, id: id };
}



function _getBookings() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('bookings');
  if (!sheet) return { ok: true, bookings: [] };
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { ok: true, bookings: [] };
  var rows = data.slice(1).map(function(r) {
    return { id: String(r[0]), name: r[1], phone: r[2], service: r[3],
             date: r[4], time: r[5], note: r[6], status: r[7], createdAt: r[8] };
  });
  rows.reverse();
  return { ok: true, bookings: rows };
}

function _updateBookingStatus(p) {
  if (!p.id || !p.status) return { ok: false, error: 'id และ status จำเป็น' };
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('bookings');
  if (!sheet) return { ok: false, error: 'ไม่พบ sheet bookings' };
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.id)) {
      sheet.getRange(i + 1, 8).setValue(p.status);
      // ถ้ายกเลิก → ลบ Calendar Event
      if (p.status === 'cancelled' && data[i][9]) {
        _deleteCalendarEvent(data[i][9]);
      }
      return { ok: true };
    }
  }
  return { ok: false, error: 'ไม่พบ booking id: ' + p.id };
}

// ============================================================
// GET AVAILABLE SLOTS — ส่งกลับเฉพาะ slot ว่าง
// ============================================================
function _getAvailableSlots(p) {
  if (!p.date) return { ok: false, error: 'กรุณาระบุวันที่' };

  var service  = p.service || 'ทำเล็บ';
  var dur      = SERVICE_DURATION[service] || 90;
  var allSlots = _generateSlots();
  var result   = [];

  // เวลาปัจจุบันไทย + บัฟเฟอร์ 1 ชม.
  var nowTH    = new Date();
  var bufferMs = 60 * 60 * 1000; // 1 ชม.
  var cutoff   = new Date(nowTH.getTime() + bufferMs);

  // วันที่เลือก
  var parts    = p.date.split('-');
  var selYear  = parseInt(parts[0]);
  var selMonth = parseInt(parts[1]) - 1;
  var selDay   = parseInt(parts[2]);

  // เช็คว่าเป็นวันนี้ไหม
  var todayTH  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  var isToday  = (selYear === todayTH.getFullYear() &&
                  selMonth === todayTH.getMonth() &&
                  selDay === todayTH.getDate());

  allSlots.forEach(function(slot) {
    var hm       = slot.split(':');
    var slotTime = new Date(selYear, selMonth, selDay, parseInt(hm[0]), parseInt(hm[1]), 0);

    // ถ้าเป็นวันนี้ → เช็ค cutoff (ต้องล่วงหน้า >= 1 ชม.)
    var tooSoon  = isToday && slotTime < cutoff;
    var calBusy  = _isSlotBusy(p.date, slot, dur);

    result.push({
      time:      slot,
      available: !tooSoon && !calBusy,
      reason:    tooSoon ? 'past' : (calBusy ? 'busy' : '')
    });
  });

  // กรองเฉพาะ slot ที่อยู่ในอนาคต (ถ้าเป็นวันนี้ ตัด past ออกเลย ไม่แสดง)
  result = result.filter(function(s) { return s.reason !== 'past'; });

  return { ok: true, slots: result, date: p.date, service: service };
}

// สร้าง slot ทั้งหมดในวัน ตามชั่วโมงเปิดปิดร้าน
function _generateSlots() {
  var slots = [];
  for (var h = SHOP_OPEN; h < SHOP_CLOSE; h += (SLOT_INTERVAL / 60)) {
    var hh = Math.floor(h).toString().padStart(2, '0');
    var mm = ((h % 1) * 60).toString().padStart(2, '0');
    slots.push(hh + ':' + mm);
  }
  return slots;
}

// ============================================================
// GOOGLE CALENDAR
// ============================================================

function _createCalendarEvent(p, bookingId, dur) {
  try {
    var cal = (CALENDAR_ID === 'primary')
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(CALENDAR_ID);
    
    if (!cal) {
      Logger.log('Calendar not found: ' + CALENDAR_ID);
      return null;
    }

    var parts = p.date.split('-');
    var hm    = (p.time || '10:00').split(':');
    var start = new Date(
      parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]),
      parseInt(hm[0]), parseInt(hm[1] || '0'), 0
    );
    var end = new Date(start.getTime() + (dur || 90) * 60000);

    Logger.log('Creating event: ' + p.service + ' | ' + start + ' → ' + end);

    var title = '💅 ' + p.service + ' — ' + p.name;
    var desc  = [
      'ชื่อ: '       + p.name,
      'โทร: '        + p.phone,
      'บริการ: '     + p.service,
      'หมายเหตุ: '   + (p.note || '-'),
      'Booking ID: ' + bookingId
    ].join('\n');

    var event = cal.createEvent(title, start, end, {
      description: desc,
      color: CalendarApp.EventColor.FLAMINGO
    });

    Logger.log('Event created: ' + event.getId());
    return event.getId();

  } catch (err) {
    Logger.log('Calendar ERROR: ' + err.message);
    return null;
  }
}

function _isSlotBusy(dateStr, timeStr, durMin) {
  try {
    var cal = (CALENDAR_ID === 'primary')
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(CALENDAR_ID);
    if (!cal) return false;

    var parts  = String(dateStr).split('-');
    var hm     = String(timeStr || '10:00').split(':');
    var slotStart = new Date(
      parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]),
      parseInt(hm[0]), parseInt(hm[1] || '0'), 0
    );
    var slotEnd = new Date(slotStart.getTime() + (durMin || 90) * 60000);

    var events = cal.getEvents(slotStart, slotEnd);
    return events.length > 0;
  } catch (err) {
    Logger.log('Slot check error: ' + err.message);
    return false; // ถ้าเช็คไม่ได้ ให้ผ่านก่อน
  }
}

function _deleteCalendarEvent(calEventId) {
  try {
    var cal = (CALENDAR_ID === 'primary')
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(CALENDAR_ID);
    if (!cal) return;
    var event = cal.getEventById(calEventId);
    if (event) event.deleteEvent();
  } catch (err) {
    Logger.log('Calendar delete error: ' + err.message);
  }
}

// ============================================================
// LINE CONFIG — ใส่ค่าตรงนี้เลย (ไม่พึ่ง Code.gs scope)
// ============================================================
// คัดลอกค่าจาก Code.gs มาวางตรงนี้
var _LINE_TOKEN_STAFF = '3URg+f03o1BPcovMIr0Km0lkLtwtIp4kL62FqU3Zsc4dTXBA0rcohA3FmukXL8DwTTEylfZgh2LFQq0YuhRxRB+Uo8AAByKj/udUzfa/ISdr5v3iP2sjlGLG63DW6PAncHh/UM9FP5m8IUOHKhmexgdB04t89/1O/w1cDnyilFU=';
var _ADMIN_USER_ID    = 'Uccd1338e1f146d4bbc0988bb98d7b124';

// ============================================================
// LINE FLEX — แจ้งพนักงาน พร้อม debug log ครบถ้วน
// ปุ่ม Confirm/Reject → postback กลับมาที่ handleEvent()
// ============================================================
function _notifyStaffFlex(p, bookingId) {
  var flex = {
    type: 'bubble', size: 'mega',
    header: {
      type: 'box', layout: 'vertical',
      backgroundColor: '#FF6B9D', paddingAll: '20px',
      contents: [
        { type: 'text', text: '📅 มีคำจองใหม่!', color: '#ffffff', weight: 'bold', size: 'lg' },
        { type: 'text', text: 'Nail Kloset — Online Booking', color: '#FFE0EC', size: 'xs', margin: 'xs' }
      ]
    },
    body: {
  type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
  contents: [
    _fRow('👤 ชื่อ',    p.name),
    _fRow('📞 โทร',     p.phone),
    _fRow('💅 บริการ',  p.service),
    _fRow('📆 วันที่',  (p.date || '-') + '  ⏰ ' + (p.time || '-') + ' น.'),
    { type: 'separator', margin: 'lg' },
    {
      type: 'box', layout: 'horizontal', spacing: 'md', margin: 'lg',
      contents: [
        {
          type: 'button', style: 'primary', color: '#1DB446', flex: 1, height: 'sm',
          action: { type: 'postback', label: '✅ ยืนยันคิว', data: 'confirmBooking_' + bookingId }
        },
        {
          type: 'button', style: 'primary', color: '#E8457A', flex: 1, height: 'sm',
          action: { type: 'postback', label: '❌ ยกเลิก', data: 'rejectBooking_' + bookingId }
        }
      ]
    }
  ].concat(p.note ? [_fRow('📝 หมายเหตุ', p.note)] : [])
}
  };

  // ── ส่ง Flex Message ──────────────────────────────────────
  try {
    Logger.log('[LINE] Sending to: ' + _ADMIN_USER_ID);
    Logger.log('[LINE] Token prefix: ' + _LINE_TOKEN_STAFF.substring(0, 12) + '...');

    var payload = {
      to:       _ADMIN_USER_ID,
      messages: [{ type: 'flex', altText: '📅 คำจองใหม่: ' + p.name + ' — ' + p.service, contents: flex }]
    };

    var response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + _LINE_TOKEN_STAFF
      },
      payload:           JSON.stringify(payload),
      muteHttpExceptions: true   // ← ต้องเปิดไว้เพื่อดัก HTTP error
    });

    var statusCode = response.getResponseCode();
    var body       = response.getContentText();

    Logger.log('[LINE] Response code: ' + statusCode);
    Logger.log('[LINE] Response body: ' + body);

    if (statusCode !== 200) {
      // บันทึก error ลง Sheet เพื่อ debug ง่าย
      _logLineError(statusCode, body, p.name, bookingId);
    }

  } catch (err) {
    Logger.log('[LINE] Exception: ' + err.message);
    _logLineError('exception', err.message, p.name, bookingId);
  }
}

// บันทึก LINE error ลง Sheet "LineErrors" เพื่อดูง่ายโดยไม่ต้องเข้า Apps Script
function _logLineError(code, body, name, bookingId) {
  try {
    var sheet = _sheet('LineErrors', ['Timestamp','BookingId','Name','StatusCode','Response']);
    sheet.appendRow([new Date(), bookingId, name, String(code), String(body).substring(0, 500)]);
  } catch (e) { /* ไม่ทำอะไรถ้า log พัง */ }
}

function _fRow(label, value) {
  return {
    type: 'box', layout: 'horizontal',
    contents: [
      { type: 'text', text: label,         size: 'sm', color: '#888888', flex: 3, gravity: 'center' },
      { type: 'text', text: String(value || '-'), size: 'sm', weight: 'bold', align: 'end', flex: 5, wrap: true }
    ]
  };
}

// ============================================================
// REMINDER — Time-based Trigger (ส่งเตือนก่อนนัด 1 วัน 18:00)
// ============================================================
function _scheduleReminder(bookingId, dateStr, timeStr, name, service) {
  try {
    if (!dateStr || !timeStr) return;

    var parts    = dateStr.split('-');
    var hm       = timeStr.split(':');
    var apptTime = new Date(
      parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]),
      parseInt(hm[0]), parseInt(hm[1] || '0'), 0
    );

    // ── แจ้งพนักงานก่อน 2 ชม. ──
    var staffAlert = new Date(apptTime.getTime() - 2 * 60 * 60 * 1000);
    if (staffAlert > new Date()) {
      var props = PropertiesService.getScriptProperties();
      var queue = JSON.parse(props.getProperty('reminderQueue') || '[]');
      queue.push({
        type:      'staff_alert',
        bookingId: bookingId,
        sendAt:    staffAlert.toISOString(),
        name:      name,
        service:   service,
        date:      dateStr,
        time:      timeStr
      });
      props.setProperty('reminderQueue', JSON.stringify(queue));
      ScriptApp.newTrigger('sendBookingReminders').timeBased().at(staffAlert).create();
      Logger.log('Staff alert scheduled: ' + staffAlert);
    }

    // ── แจ้งลูกค้าก่อน 1 วัน 18:00 (เดิม) ──
    var apptDate  = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    var dayBefore = new Date(apptDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(18, 0, 0, 0);

    if (dayBefore > new Date()) {
      var props2 = PropertiesService.getScriptProperties();
      var queue2 = JSON.parse(props2.getProperty('reminderQueue') || '[]');
      queue2.push({
        type:      'customer_reminder',
        bookingId: bookingId,
        sendAt:    dayBefore.toISOString(),
        name:      name,
        service:   service,
        date:      dateStr,
        time:      timeStr
      });
      props2.setProperty('reminderQueue', JSON.stringify(queue2));
      ScriptApp.newTrigger('sendBookingReminders').timeBased().at(dayBefore).create();
    }

  } catch (err) {
    Logger.log('Schedule reminder error: ' + err.message);
  }
}

// ── ฟังก์ชันนี้ถูกเรียกโดย Trigger อัตโนมัติ ──────────────
function sendBookingReminders() {
  var props = PropertiesService.getScriptProperties();
  var queue = JSON.parse(props.getProperty('reminderQueue') || '[]');
  var now   = new Date();
  var keep  = [];

  queue.forEach(function(item) {
    var sendAt = new Date(item.sendAt);
    var diff   = Math.abs(now - sendAt);

    if (diff < 2 * 60 * 60 * 1000) { // ภายใน 2 ชม.
      if (item.type === 'staff_alert') {
        _doSendStaffAlert(item);
      } else {
        _doSendReminder(item);
      }
    } else if (sendAt > now) {
      keep.push(item);
    }
  });

  props.setProperty('reminderQueue', JSON.stringify(keep));
}

function _doSendReminder(item) {
  var msg = [
    '⏰ แจ้งเตือนนัดพรุ่งนี้ค่ะ!',
    '',
    '💅 บริการ: ' + item.service,
    '📆 วันที่: '  + item.date + '  เวลา ' + item.time + ' น.',
    '',
    'อย่าลืมนัดนะคะ 🌸',
    '📍 Nail Kloset — the crystal ratchapruek'
  ].join('\n');

  // ส่งให้ Admin / พนักงาน
  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _LINE_TOKEN_STAFF },
      payload: JSON.stringify({
        to: _ADMIN_USER_ID,
        messages: [{ type: 'text', text: '📋 Reminder: ' + item.name + ' — ' + item.service + ' — ' + item.time + ' น. (พรุ่งนี้)' }]
      }),
      muteHttpExceptions: true
    });
  } catch (e) {}
}

// ============================================================
// HANDLE POSTBACK — พนักงานกด Confirm / Reject ใน LINE
// เรียกจาก handleEvent() ใน Code.gs
// ============================================================
function handleBookingPostback(replyToken, data) {
  var parts     = data.split('_');
  var action    = parts[0];
  var bookingId = parts[1];

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('bookings');
  if (!sheet) {
    callLineAPI('reply', { replyToken: replyToken, messages: [{ type: 'text', text: '⚠️ ไม่พบข้อมูลการจองค่ะ' }] }, false);
    return;
  }

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) !== String(bookingId)) continue;

    var b = {
      name:       rows[i][1],
      service:    rows[i][3],
      date:       rows[i][4],
      time:       rows[i][5],
      calEventId: rows[i][9]
    };

    if (action === 'confirmBooking') {
      sheet.getRange(i + 1, 8).setValue('confirmed');
      callLineAPI('reply', {
        replyToken: replyToken,
        messages: [{ type: 'text', text: '✅ ยืนยันคิวของ ' + b.name + ' แล้วค่ะ\n💅 ' + b.service + '\n📆 ' + b.date + '  ⏰ ' + b.time + ' น.' }]
      }, false);

    } else if (action === 'rejectBooking') {
      sheet.getRange(i + 1, 8).setValue('cancelled');
      if (b.calEventId) _deleteCalendarEvent(b.calEventId);
      callLineAPI('reply', {
        replyToken: replyToken,
        messages: [{ type: 'text', text: '❌ ยกเลิกคิว ' + b.name + ' เรียบร้อยค่ะ' }]
      }, false);
    }
    return;
  }

  callLineAPI('reply', {
    replyToken: replyToken,
    messages: [{ type: 'text', text: '⚠️ ไม่พบข้อมูลคำจอง ID: ' + bookingId }]
  }, false);
}

// ============================================================
// HELPERS
// ============================================================
function _sheet(name, headers) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setBackground('#FF6B9D').setFontColor('#FFFFFF').setFontWeight('bold');
  }
  return sheet;
}

function _deleteRowById(sheetName, id) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { ok: false, error: 'ไม่พบ sheet ' + sheetName };
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); return { ok: true }; }
  }
  return { ok: false, error: 'ไม่พบ id: ' + id };
}

// ============================================================
// TEST FUNCTION — รันใน Apps Script Editor เพื่อทดสอบ LINE
// 1. เปิด Apps Script Editor
// 2. เลือก function: testLineNotify
// 3. กด Run
// 4. ดู Execution Log ด้านล่าง
// ============================================================
function testLineNotify() {
  Logger.log('=== TEST LINE NOTIFY ===');
  Logger.log('Token prefix: ' + _LINE_TOKEN_STAFF.substring(0, 20) + '...');
  Logger.log('Admin ID: '    + _ADMIN_USER_ID);

  var testPayload = {
    to: _ADMIN_USER_ID,
    messages: [{ type: 'text', text: '🧪 ทดสอบระบบแจ้งเตือน Nail Kloset\nถ้าเห็นข้อความนี้ แสดงว่า LINE API ทำงานปกติค่ะ ✅' }]
  };

  try {
    var res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _LINE_TOKEN_STAFF },
      payload: JSON.stringify(testPayload),
      muteHttpExceptions: true
    });
    Logger.log('HTTP Status: ' + res.getResponseCode());
    Logger.log('Response:    ' + res.getContentText());

    if (res.getResponseCode() === 200) {
      Logger.log('✅ SUCCESS — เช็ค LINE ได้เลย!');
    } else {
      Logger.log('❌ FAILED — ดู error ด้านบน');
    }
  } catch (e) {
    Logger.log('❌ Exception: ' + e.message);
  }
}

// ── ทดสอบ Flex Message ───────────────────────────────────────
function testLineFlexBooking() {
  _notifyStaffFlex({
    name:    'ทดสอบ ระบบ',
    phone:   '0812345678',
    service: 'ทำเล็บ',
    date:    new Date().toISOString().split('T')[0],
    time:    '14:00',
    note:    'ทดสอบจากระบบ'
  }, 'TEST_' + Date.now());
  Logger.log('ดู Execution Log และ Sheet "LineErrors" ถ้ามี error');
}



function _doSendStaffAlert(item) {
  try {
    var msg = [
      '⏰ แจ้งเตือนเตรียมพร้อมค่ะ!',
      '',
      '💅 บริการ: '  + item.service,
      '👤 ลูกค้า: '  + item.name,
      '📆 วันที่: '   + item.date,
      '⏰ เวลา: '     + item.time + ' น.',
      '',
      '⚡ อีก 2 ชั่วโมงจะถึงเวลานัด กรุณาเตรียมตัวด้วยนะคะ 🙏'
    ].join('\n');

    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + _LINE_TOKEN_STAFF
      },
      payload: JSON.stringify({
        to:       _ADMIN_USER_ID,
        messages: [{ type: 'text', text: msg }]
      }),
      muteHttpExceptions: true
    });

    Logger.log('Staff alert sent for: ' + item.name);
  } catch (e) {
    Logger.log('Staff alert error: ' + e.message);
  }
}


function _bk_registerCustomer(p) {
  // ── Validate input ──────────────────────────────────────────
  if (!p.line_user_id) {
    return { ok: false, error: 'line_user_id จำเป็น' };
  }

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  // ใช้ชื่อ sheet เดียวกับที่ Code.gs ใช้อยู่ (const SHEET_MEMBER = 'สมาชิก')
  var sheet = ss.getSheetByName('สมาชิก');

  // ── สร้าง sheet ถ้ายังไม่มี ──────────────────────────────────
  if (!sheet) {
    sheet = ss.insertSheet('สมาชิก');
    var headers = ['เบอร์โทร', 'ชื่อ', 'ยอดเงิน', 'LineID', 'หมดอายุ', 'รหัสสมาชิก'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setBackground('#FF6B9D').setFontColor('#FFFFFF').setFontWeight('bold');
  }

  var data = sheet.getDataRange().getValues();

  // ── 1. ค้นหา line_user_id ที่มีอยู่แล้ว ──────────────────────
  // วน loop ตั้งแต่ row 2 (skip header row ที่ index 0)
  for (var i = 1; i < data.length; i++) {
    var storedLineId = String(data[i][3] || '').trim();
    if (storedLineId === String(p.line_user_id).trim()) {

      // เจอแล้ว → ดึงข้อมูลเดิมส่งกลับ
      var rawBalance = data[i][2];
      var rawExpiry  = data[i][4];
      var memberCode = String(data[i][5] || '').replace(/'/g, '').trim();

      // แปลงวันหมดอายุเป็น string ถ้ามี
      var expiryStr = '';
      if (rawExpiry && rawExpiry !== '') {
        try {
          expiryStr = Utilities.formatDate(new Date(rawExpiry), 'Asia/Bangkok', 'dd/MM/yyyy');
        } catch(e) {
          expiryStr = String(rawExpiry);
        }
      }

      return {
        ok:    true,
        isNew: false,
        member: {
          name:       String(data[i][1] || p.line_name),
          // ส่ง balance ตามที่เก็บจริง — อาจเป็น '-' (ลูกค้าใหม่) หรือตัวเลข
          balance:    (rawBalance === '-' || rawBalance === '') ? '-' : (parseFloat(rawBalance) || 0),
          memberCode: memberCode,
          expiry:     expiryStr
        }
      };
    }
  }

  // ── 2. ไม่พบ → สร้างสมาชิกใหม่ ──────────────────────────────

  // หารหัสสมาชิก 4 หลักที่ยังว่างอยู่ (ไม่ใช้ Math.random())
  // เก็บทุก code ที่ใช้ไปแล้วใน Set
  var usedCodes = new Set();
  for (var j = 1; j < data.length; j++) {
    var existingCode = parseInt(String(data[j][5] || '').replace(/'/g, '').trim());
    if (!isNaN(existingCode)) {
      usedCodes.add(existingCode);
    }
  }

  // หาเลขที่น้อยที่สุดที่ยังไม่ถูกใช้ เริ่มจาก 0
  var nextNum = 0;
  while (usedCodes.has(nextNum)) {
    nextNum++;
  }

  // Pad เป็น 4 หลักเสมอ: 0 → '0000', 1 → '0001', 99 → '0099'
  var newMemberCode = String(nextNum).padStart(4, '0');

  // บันทึก row ใหม่ลง sheet
  // - เบอร์โทร = '-'    (ลูกค้ากรอกเองในหน้า Step 4)
  // - ยอดเงิน  = '-'    (ยังไม่ได้เติมเงิน)
  // - วันหมดอายุ = ''   (ยังไม่มี)
  // - รหัสสมาชิกใส่ ' นำหน้าเพื่อกัน Sheets แปลงเป็นตัวเลข
  sheet.appendRow([
    '-',                        // col A เบอร์โทร
    p.line_name || '-',         // col B ชื่อ (ใช้ LINE display name)
    '-',                        // col C ยอดเงิน (ยังไม่มี)
    p.line_user_id,             // col D LineID
    '',                         // col E วันหมดอายุ (ยังไม่มี)
    "'" + newMemberCode         // col F รหัสสมาชิก (prefix ' กัน auto-format)
  ]);

  Logger.log('[bk_registerCustomer] สร้างสมาชิกใหม่: ' + p.line_name + ' รหัส ' + newMemberCode);

  return {
    ok:    true,
    isNew: true,
    member: {
      name:       p.line_name || '-',
      balance:    '-',
      memberCode: newMemberCode,
      expiry:     ''
    }
  };
}


// ============================================================
// bk_getStaffs
// เรียกจาก LIFF หน้า Step 2 เพื่อโหลดรายชื่อช่าง
//
// ดึงข้อมูลจาก Sheet "พนักงาน" — โครงสร้างเดิมที่มีอยู่:
//   col A [0] = UserID
//   col B [1] = ชื่อ
//   col C [2] = วันที่ลงทะเบียน
//   col D [3] = รูป  ← URL รูปภาพ (เพิ่มใหม่ถ้ายังไม่มี col นี้)
//
// เงื่อนไข:
//   - กรอง ADMIN_USER_ID ออก (ไม่แสดงเจ้าของร้านเป็นช่าง)
//   - ถ้า sheet ยังไม่มี col D ให้ส่ง image = '' (แสดง initials แทน)
// ============================================================
function _bk_getStaffs() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('พนักงาน');

  if (!sheet) {
    return { ok: true, staffs: [] };
  }

  var data   = sheet.getDataRange().getValues();
  var staffs = [];

  // ตรวจว่า sheet มีกี่ col (กัน error ถ้า col D ยังไม่มี)
  var numCols = data.length > 0 ? data[0].length : 3;

  for (var i = 1; i < data.length; i++) {
    var userId = String(data[i][0] || '').trim();
    var name   = String(data[i][1] || '').trim();

    // ข้ามแถวว่างหรือไม่มีชื่อ
    if (!userId || !name) continue;

    // ข้าม ADMIN — ไม่แสดงเจ้าของร้านในรายการช่าง
    // ค่า ADMIN_USER_ID ถูกนิยามใน Code.gs; ใช้ hardcode ตรงนี้เพื่อความปลอดภัย
    if (userId === 'Uccd1338e1f146d4bbc0988bb98d7b124') continue;

    // col D = รูป (index 3) — ถ้า sheet เก่ายังไม่มี col นี้จะได้ undefined
    var image = (numCols >= 4 && data[i][3]) ? String(data[i][3]).trim() : '';

    staffs.push({
      id:    userId,   // ใช้ LINE UserID เป็น staff ID
      name:  name,
      image: image,    // URL รูป หรือ '' ถ้าไม่มี
      bio:   'ช่างเล็บ' // ปรับได้ถ้า sheet มี col bio เพิ่มในอนาคต
    });
  }

  return { ok: true, staffs: staffs };
}


// ============================================================
// ฟังก์ชัน TEST — รันใน Apps Script Editor เพื่อตรวจสอบ
// เลือก function แล้วกด Run ดู Execution Log
// ============================================================

// ทดสอบ bk_registerCustomer กับ user ใหม่
function test_bk_registerCustomer_new() {
  var result = _bk_registerCustomer({
    line_user_id:  'TEST_USER_' + Date.now(),
    line_name:     'ทดสอบ ใหม่',
    profile_image: ''
  });
  Logger.log('Result: ' + JSON.stringify(result));
  // ตรวจใน Sheet สมาชิก ว่ามีแถวใหม่เพิ่มมาหรือไม่
}

// ทดสอบ bk_registerCustomer กับ user เดิม (ใส่ userId ที่มีอยู่ใน sheet)
function test_bk_registerCustomer_existing() {
  var result = _bk_registerCustomer({
    line_user_id:  'Uccd1338e1f146d4bbc0988bb98d7b124', // ← เปลี่ยนเป็น userId ที่มีใน sheet
    line_name:     'ทดสอบ เดิม',
    profile_image: ''
  });
  Logger.log('Result: ' + JSON.stringify(result));
  // ต้องได้ isNew: false และข้อมูลเดิมกลับมา
}

// ทดสอบ bk_getStaffs
function test_bk_getStaffs() {
  var result = _bk_getStaffs();
  Logger.log('Staffs count: ' + result.staffs.length);
  Logger.log('Result: ' + JSON.stringify(result));
}