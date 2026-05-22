// ============================================================
// Analytics.gs — ฟังก์ชั่น Analytics เพิ่มเติม
// เพิ่มไฟล์ใหม่ใน Apps Script Project
// ============================================================

// ── 1. Heatmap รายวัน x ช่วงเวลา ────────────────────────────
// คืนค่า matrix [วันในสัปดาห์][ชั่วโมง] = ยอดรวม
function getHeatmapData(periodKey) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_RECORDS);
    if (!sheet) return { ok: false, error: 'ไม่พบ Sheet รายการ' };

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { ok: true, matrix: _emptyMatrix(), max: 0 };

    var parts = (periodKey || '').split('-');
    var filterYear  = parseInt(parts[0]) || 0;
    var filterMonth = parseInt(parts[1]) || 0;
    var tz = Session.getScriptTimeZone();

    // matrix[day0-6][hour9-20] = { count, revenue }
    var matrix = {};
    for (var d = 0; d < 7; d++) {
      matrix[d] = {};
      for (var h = 9; h <= 20; h++) {
        matrix[d][h] = { count: 0, revenue: 0 };
      }
    }

    data.slice(1).forEach(function(row) {
      var rowDate = new Date(row[0]);
      if (isNaN(rowDate)) return;
      var status = String(row[9] || '');
      if (status === 'ยกเลิก' || status === 'รออนุมัติ') return;
      var price = Number(row[5]);
      if (!price || price <= 0) return;

      if (filterYear && filterMonth) {
        var rowY = parseInt(Utilities.formatDate(rowDate, tz, 'yyyy'));
        var rowM = parseInt(Utilities.formatDate(rowDate, tz, 'MM'));
        if (rowY !== filterYear || rowM !== filterMonth) return;
      }

      var dayOfWeek = rowDate.getDay(); // 0=อาทิตย์
      var hour = rowDate.getHours();
      if (hour < 9 || hour > 20) return;

      matrix[dayOfWeek][hour].count++;
      matrix[dayOfWeek][hour].revenue += price;
    });

    // หา max สำหรับ normalize สี
    var max = 0;
    Object.keys(matrix).forEach(function(d) {
      Object.keys(matrix[d]).forEach(function(h) {
        if (matrix[d][h].count > max) max = matrix[d][h].count;
      });
    });

    return { ok: true, matrix: matrix, max: max };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── 2. เปรียบเทียบพนักงานย้อนหลัง 3 เดือน ───────────────────
function getStaffComparison(months) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_RECORDS);
    if (!sheet) return { ok: false, error: 'ไม่พบ Sheet' };

    var data = sheet.getDataRange().getValues();
    var now  = new Date();
    var numMonths = parseInt(months) || 3;
    var result = [];

    for (var i = numMonths - 1; i >= 0; i--) {
      var d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
      var end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      var label = _thMonth(d.getMonth()) + ' ' + (d.getFullYear() + 543);
      var staffMap = {};

      data.slice(1).forEach(function(row) {
        var rowDate = new Date(row[0]);
        if (isNaN(rowDate) || rowDate < start || rowDate > end) return;
        var status = String(row[9] || '');
        if (status === 'ยกเลิก' || status === 'รออนุมัติ') return;
        var price = Number(row[5]);
        var svc   = String(row[4] || '');
        var staff = String(row[3] || '-');
        if (!price || !staff) return;
        var isMem = (svc === 'เติมเงินสมาชิก' || svc === 'เปิดเมมเบอร์ใหม่');

        if (!staffMap[staff]) staffMap[staff] = { revenue: 0, commission: 0, count: 0 };
        if (!isMem) {
          var rate = COMMISSION_RATE[svc] || 0.10;
          staffMap[staff].revenue    += price;
          staffMap[staff].commission += price * rate;
          staffMap[staff].count++;
        }
      });

      result.push({ label: label, month: d.getMonth(), year: d.getFullYear(), staffMap: staffMap });
    }

    return { ok: true, months: result };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── 3. Top Services วิเคราะห์ลึก ────────────────────────────
function getServiceAnalytics(periodKey) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_RECORDS);
    if (!sheet) return { ok: false, error: 'ไม่พบ Sheet' };

    var data = sheet.getDataRange().getValues();
    var parts = (periodKey || '').split('-');
    var filterYear  = parseInt(parts[0]) || 0;
    var filterMonth = parseInt(parts[1]) || 0;
    var tz = Session.getScriptTimeZone();

    var svcMap = {};
    var totalRev = 0;

    data.slice(1).forEach(function(row) {
      var rowDate = new Date(row[0]);
      if (isNaN(rowDate)) return;
      var status = String(row[9] || '');
      if (status === 'ยกเลิก' || status === 'รออนุมัติ') return;
      var price = Number(row[5]);
      if (!price || price <= 0) return;
      var svc = String(row[4] || '');
      if (svc === 'เติมเงินสมาชิก' || svc === 'เปิดเมมเบอร์ใหม่') return;

      if (filterYear && filterMonth) {
        var rowY = parseInt(Utilities.formatDate(rowDate, tz, 'yyyy'));
        var rowM = parseInt(Utilities.formatDate(rowDate, tz, 'MM'));
        if (rowY !== filterYear || rowM !== filterMonth) return;
      }

      if (!svcMap[svc]) svcMap[svc] = { count: 0, revenue: 0, avg: 0 };
      svcMap[svc].count++;
      svcMap[svc].revenue += price;
      totalRev += price;
    });

    // คำนวณ avg และ % share
    Object.keys(svcMap).forEach(function(svc) {
      svcMap[svc].avg   = Math.round(svcMap[svc].revenue / svcMap[svc].count);
      svcMap[svc].share = totalRev > 0 ? Math.round((svcMap[svc].revenue / totalRev) * 100) : 0;
    });

    var sorted = Object.keys(svcMap).map(function(k) {
      return { service: k, count: svcMap[k].count, revenue: svcMap[k].revenue, avg: svcMap[k].avg, share: svcMap[k].share };
    }).sort(function(a, b) { return b.revenue - a.revenue; });

    return { ok: true, services: sorted, totalRevenue: totalRev };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── 4. Customer Retention (กลับมาใช้ซ้ำ) ────────────────────
function getRetentionData(periodKey) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var memSheet = ss.getSheetByName(SHEET_MEMBER);
    var recSheet = ss.getSheetByName(SHEET_RECORDS);
    if (!memSheet || !recSheet) return { ok: false, error: 'ไม่พบ Sheet' };

    var memData = memSheet.getDataRange().getValues();
    var recData = recSheet.getDataRange().getValues();

    var parts = (periodKey || '').split('-');
    var filterYear  = parseInt(parts[0]) || 0;
    var filterMonth = parseInt(parts[1]) || 0;
    var tz = Session.getScriptTimeZone();

    // นับจำนวนสมาชิกที่ใช้บริการในเดือนนี้
    var activePhones = new Set();
    recData.slice(1).forEach(function(row) {
      var rowDate = new Date(row[0]);
      if (isNaN(rowDate)) return;
      if (filterYear && filterMonth) {
        var rowY = parseInt(Utilities.formatDate(rowDate, tz, 'yyyy'));
        var rowM = parseInt(Utilities.formatDate(rowDate, tz, 'MM'));
        if (rowY !== filterYear || rowM !== filterMonth) return;
      }
      var phone = String(row[7] || '').replace(/'/g, '');
      if (phone && phone !== '-') activePhones.add(phone);
    });

    var totalMembers = Math.max(memData.length - 1, 0);
    var activeCount  = activePhones.size;
    var inactiveCount = Math.max(totalMembers - activeCount, 0);

    // หาสมาชิกที่ไม่มา > 60 วัน (เสี่ยง churn)
    var now = new Date();
    var churnRisk = [];
    var phoneLastVisit = {};
    recData.slice(1).forEach(function(row) {
      var rowDate = new Date(row[0]);
      if (isNaN(rowDate)) return;
      var phone = String(row[7] || '').replace(/'/g, '');
      if (!phone || phone === '-') return;
      if (!phoneLastVisit[phone] || rowDate > phoneLastVisit[phone]) {
        phoneLastVisit[phone] = rowDate;
      }
    });

    memData.slice(1).forEach(function(row) {
      var phone = String(row[0] || '').replace(/'/g, '');
      var name  = String(row[1] || '-');
      if (!phone || phone === '-') return;
      var lastVisit = phoneLastVisit[phone];
      if (!lastVisit) return;
      var daysSince = Math.ceil((now - lastVisit) / (1000 * 60 * 60 * 24));
      if (daysSince >= 60) {
        churnRisk.push({
          phone: phone, name: name,
          daysSince: daysSince,
          balance: parseFloat(row[2]) || 0,
          lastVisit: Utilities.formatDate(lastVisit, 'Asia/Bangkok', 'dd/MM/yyyy')
        });
      }
    });

    churnRisk.sort(function(a, b) { return b.daysSince - a.daysSince; });

    return {
      ok: true,
      totalMembers:  totalMembers,
      activeCount:   activeCount,
      inactiveCount: inactiveCount,
      retentionRate: totalMembers > 0 ? Math.round((activeCount / totalMembers) * 100) : 0,
      churnRisk:     churnRisk.slice(0, 20)
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── 5. Member Stats เพิ่มเติม ────────────────────────────────
function getMemberStats() {
  try {
    var ss       = SpreadsheetApp.getActiveSpreadsheet();
    var memSheet = ss.getSheetByName(SHEET_MEMBER);
    var logSheet = ss.getSheetByName('Member_Logs');
    if (!memSheet) return { ok: false, error: 'ไม่พบ Sheet สมาชิก' };

    var memData = memSheet.getDataRange().getValues();
    var now     = new Date();

    var totalBalance = 0, expiredCount = 0, expiresIn30 = 0, expiresIn90 = 0;
    var highBalanceMembers = [], recentTopups = [];

    memData.slice(1).forEach(function(row) {
      var balance = parseFloat(row[2]) || 0;
      var expiry  = row[4] ? new Date(row[4]) : null;
      var phone   = String(row[0] || '').replace(/'/g, '');
      var name    = String(row[1] || '-');
      var code    = String(row[5] || '').replace(/'/g, '');

      totalBalance += balance;

      if (expiry && !isNaN(expiry)) {
        var daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0)          expiredCount++;
        else if (daysLeft <= 30)   expiresIn30++;
        else if (daysLeft <= 90)   expiresIn90++;
      }

      if (balance >= 5000) {
        highBalanceMembers.push({ name: name, phone: phone, code: code, balance: balance });
      }
    });

    highBalanceMembers.sort(function(a, b) { return b.balance - a.balance; });

    // ดึง topup ล่าสุดจาก Member_Logs
    if (logSheet) {
      var logData = logSheet.getDataRange().getValues();
      logData.slice(1).reverse().forEach(function(row) {
        var action = String(row[2] || '');
        if (action.indexOf('เติมเงิน') !== -1 && recentTopups.length < 10) {
          recentTopups.push({
            date:    row[0] ? Utilities.formatDate(new Date(row[0]), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm') : '-',
            phone:   String(row[1] || '').replace(/'/g, ''),
            action:  action,
            amount:  String(row[3] || ''),
            balance: Number(row[5]) || 0,
            staff:   String(row[6] || '-')
          });
        }
      });
    }

    return {
      ok: true,
      totalMembers:       Math.max(memData.length - 1, 0),
      totalBalance:       Math.round(totalBalance),
      expiredCount:       expiredCount,
      expiresIn30:        expiresIn30,
      expiresIn90:        expiresIn90,
      highBalanceMembers: highBalanceMembers.slice(0, 10),
      recentTopups:       recentTopups
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── 6. Export สมาชิกทั้งหมด → สำหรับ Google Sheets ──────────
function exportMembersCSV() {
  try {
    var ss       = SpreadsheetApp.getActiveSpreadsheet();
    var memSheet = ss.getSheetByName(SHEET_MEMBER);
    if (!memSheet) return { ok: false, error: 'ไม่พบ Sheet สมาชิก' };

    var data = memSheet.getDataRange().getValues();
    var rows = data.slice(1).map(function(row) {
      var expiry = row[4] ? Utilities.formatDate(new Date(row[4]), 'Asia/Bangkok', 'dd/MM/yyyy') : '-';
      return {
        phone:      String(row[0] || '').replace(/'/g, ''),
        name:       String(row[1] || ''),
        balance:    parseFloat(row[2]) || 0,
        lineId:     String(row[3] || '-'),
        expiry:     expiry,
        memberCode: String(row[5] || '').replace(/'/g, '')
      };
    }).filter(function(r) { return r.phone || r.memberCode; });

    return { ok: true, members: rows, count: rows.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── 7. Shop Hours Config ─────────────────────────────────────
function getShopHours() {
  var cfg = getConfig() || {};
  return {
    ok: true,
    openHour:    cfg.SHOP_OPEN_HOUR    || 10,
    closeHour:   cfg.SHOP_CLOSE_HOUR   || 20,
    closedDays:  cfg.SHOP_CLOSED_DAYS  || [],
    specialDates: cfg.SHOP_SPECIAL_DATES || []
  };
}

function saveShopHours(p) {
  var cfg = {
    SHOP_OPEN_HOUR:    parseInt(p.openHour)  || 10,
    SHOP_CLOSE_HOUR:   parseInt(p.closeHour) || 20,
    SHOP_CLOSED_DAYS:  p.closedDays || []
  };
  saveConfig(cfg);
  return { ok: true };
}

// ── 8. Promo Management ──────────────────────────────────────
function getPromoList() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Promos');
  if (!sheet) return { ok: true, promos: [] };
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { ok: true, promos: [] };
  return {
    ok: true,
    promos: data.slice(1).map(function(row) {
      return {
        id:       String(row[0] || ''),
        title:    String(row[1] || ''),
        desc:     String(row[2] || ''),
        discount: Number(row[3]) || 0,
        type:     String(row[4] || 'fixed'),  // fixed | percent
        active:   row[5] === true || row[5] === 'TRUE',
        expire:   row[6] ? String(row[6]) : ''
      };
    })
  };
}

function savePromo(p) {
  var sheet = getOrCreateSheet('Promos', ['ID','ชื่อโปรโมชั่น','รายละเอียด','ส่วนลด','ประเภท','สถานะ','หมดอายุ']);
  var id = p.id || String(Date.now());
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.getRange(i + 1, 1, 1, 7).setValues([[
        id, p.title, p.desc, Number(p.discount), p.type, p.active === 'true' || p.active === true, p.expire || ''
      ]]);
      return { ok: true, id: id };
    }
  }

  sheet.appendRow([id, p.title, p.desc, Number(p.discount), p.type || 'fixed', true, p.expire || '']);
  return { ok: true, id: id };
}

function deletePromo(p) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Promos');
  if (!sheet) return { ok: false, error: 'ไม่พบ Sheet Promos' };
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.id)) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: 'ไม่พบ promo id: ' + p.id };
}

// ── Helpers ──────────────────────────────────────────────────
function _emptyMatrix() {
  var m = {};
  for (var d = 0; d < 7; d++) {
    m[d] = {};
    for (var h = 9; h <= 20; h++) m[d][h] = { count: 0, revenue: 0 };
  }
  return m;
}

function _thMonth(m) {
  return ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][m];
}
