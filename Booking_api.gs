<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#FF6B9D">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>Nail Kloset — จองคิว</title>

<script src="https://static.line-scdn.net/liff/edge/versions/2.22.3/sdk.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Poppins:wght@600;700&display=swap" rel="stylesheet">

<style>
/* ══ RESET & BASE ══════════════════════════════════════ */
*, *::before, *::after {
  margin: 0; padding: 0; box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}

:root {
  --pink:        #FF6B9D;
  --pink2:       #FF4785;
  --pink-light:  #FFE4EF;
  --pink-pale:   #FFF5F9;
  --pink-border: rgba(255,107,157,0.25);
  --sky:         #38BDF8;
  --sky-light:   #E0F6FF;
  --mint:        #2DD4BF;
  --gold:        #FBBF24;
  --gold-light:  #FEF3C7;
  --purple:      #A78BFA;
  --green:       #10B981;
  --green-light: #D1FAE5;
  --white:       #FFFFFF;
  --bg:          #F8FAFF;
  --surface:     #FFFFFF;
  --text:        #1E293B;
  --text2:       #475569;
  --text3:       #94A3B8;
  --border:      #E2E8F0;
  --shadow-sm:   0 2.4px 9.6px rgba(0,0,0,0.06);
  --shadow:      0 4.8px 24px rgba(0,0,0,0.08);
  --radius:      24px;
  --radius-sm:   16.8px;
  --radius-xs:   12px;
  --ff:          'Nunito', sans-serif;
  --ff2:         'Poppins', sans-serif;

  --sat: env(safe-area-inset-top, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
  --sar: env(safe-area-inset-right, 0px);

  --bottom-bar-h: calc(105.6px + var(--sab));
}

html {
  font-size: 19.2px;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  height: 100%;
  overflow: hidden;
  font-family: var(--ff);
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

/* ══ APP SHELL ═════════════════════════════════════════ */
#app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  position: relative;
  overflow: hidden;
  background: var(--bg);
}

/* ══ LOADING ═══════════════════════════════════════════ */
#loading-screen {
  position: fixed; inset: 0; z-index: 1000;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9AC7 50%, #FFB3D9 100%);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  transition: opacity 0.4s, transform 0.4s;
}
#loading-screen.out { opacity: 0; pointer-events: none; transform: scale(1.04); }
#login-screen { display: none; }
#login-screen.show { display: flex; }
.loading-logo {
  font-family: var(--ff2); font-size: 50.4px; font-weight: 700;
  color: #fff; letter-spacing: -0.6px; margin-bottom: 7.2px;
  animation: popUp 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both;
}
.loading-sub {
  font-size: 16.8px; letter-spacing: 3px; text-transform: uppercase;
  color: rgba(255,255,255,0.75); margin-bottom: 48px;
  animation: popUp 0.5s 0.1s ease both;
}
.loading-dots { display: flex; gap: 12px; }
.loading-dots span {
  width: 14.4px; height: 14.4px; border-radius: 50%;
  background: rgba(255,255,255,0.9);
  animation: bounce 1s ease infinite;
}
.loading-dots span:nth-child(2) { animation-delay: 0.15s; }
.loading-dots span:nth-child(3) { animation-delay: 0.3s; }

@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.5} 40%{transform:scale(1);opacity:1} }
@keyframes popUp  { from{opacity:0;transform:translateY(16.8px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes slideUp { from{opacity:0;transform:translateY(19.2px)} to{opacity:1;transform:translateY(0)} }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ══ SUCCESS ═══════════════════════════════════════════ */
#success-screen {
  position: fixed; inset: 0; z-index: 900;
  background: linear-gradient(160deg, #E0F6FF 0%, #F0FFF4 50%, #FFF5F9 100%);
  display: none; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 38.4px 28.8px; text-align: center;
  overflow-y: auto; padding-bottom: calc(38.4px + var(--sab));
}
#success-screen.show { display: flex; }
.success-anim {
  width: 120px; height: 120px; border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #34D399);
  display: flex; align-items: center; justify-content: center;
  font-size: 52.8px; margin-bottom: 28.8px;
  box-shadow: 0 14.4px 43.2px rgba(16,185,129,0.3);
  animation: popUp 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both;
}
.success-title { font-family: var(--ff2); font-size: 33.6px; font-weight: 700; margin-bottom: 9.6px; }
.success-sub { font-size: 19.2px; color: var(--text2); line-height: 1.7; margin-bottom: 28.8px; }
.success-card {
  background: var(--white); border-radius: var(--radius);
  padding: 24px; width: 100%; max-width: 480px;
  margin-bottom: 24px; text-align: left; box-shadow: var(--shadow);
}
.success-card-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14.4px 0; border-bottom: 1.2px solid var(--border); font-size: 19.2px;
}
.success-card-row:last-child { border-bottom: none; }
.sc-label { color: var(--text3); font-weight: 600; }
.sc-value  { font-weight: 800; color: var(--text); text-align: right; max-width: 56%; }
.bk-id-badge { font-size: 15.6px; color: var(--text3); margin-bottom: 24px; letter-spacing: 1.2px; }

/* ══ HEADER ════════════════════════════════════════════ */
.app-header {
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9AC7 100%);
  padding: calc(19.2px + var(--sat)) 24px 19.2px;
  flex-shrink: 0;
  box-shadow: 0 3.6px 24px rgba(255,107,157,0.35);
  position: relative; z-index: 10;
}
.header-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 19.2px;
}
.app-logo {
  font-family: var(--ff2); font-size: 31.2px; font-weight: 700;
  color: #fff; letter-spacing: -0.6px; line-height: 1;
}
.app-logo span {
  display: block; font-size: 15.6px; font-weight: 400;
  opacity: 0.75; margin-top: 3px; letter-spacing: 0;
  font-family: var(--ff);
}
.header-right { display: flex; align-items: center; gap: 12px; }
.user-chip {
  display: flex; align-items: center; gap: 9.6px;
  background: rgba(255,255,255,0.22); border: 1.2px solid rgba(255,255,255,0.35);
  border-radius: 60px; padding: 7.2px 16.8px 7.2px 7.2px;
}
.user-avatar {
  width: 38.4px; height: 38.4px; border-radius: 50%;
  background: rgba(255,255,255,0.3); border: 2.4px solid rgba(255,255,255,0.55);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; font-size: 16.8px; flex-shrink: 0;
}
.user-avatar img { width:100%; height:100%; object-fit:cover; }
.user-chip-name { font-size: 15.6px; font-weight: 700; color: #fff; max-width: 108px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header-mybk-btn {
  display: flex; align-items: center; gap: 7.2px;
  background: rgba(255,255,255,0.18); border: 1.8px solid rgba(255,255,255,0.45);
  border-radius: 60px; padding: 9.6px 16.8px;
  cursor: pointer; color: #fff; font-size: 15.6px; font-weight: 800;
  font-family: var(--ff); white-space: nowrap;
  transition: background 0.15s;
  min-height: 52.8px;
}
.header-mybk-btn:active { background: rgba(255,255,255,0.32); }

/* ── Step Rail ── */
.step-rail {
  display: flex; align-items: center;
  background: rgba(255,255,255,0.15); border-radius: 60px;
  padding: 12px 19.2px;
}
.step {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; gap: 4.8px; position: relative;
}
.step:not(:last-child)::after {
  content: ''; position: absolute;
  top: 15.6px; left: calc(50% + 19.2px); right: calc(-50% + 19.2px);
  height: 2.4px; background: rgba(255,255,255,0.3);
}
.step.done:not(:last-child)::after { background: rgba(255,255,255,0.75); }
.step-node {
  width: 33.6px; height: 33.6px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 15.6px; font-weight: 800;
  background: rgba(255,255,255,0.18); color: rgba(255,255,255,0.65);
  position: relative; z-index: 1; transition: all 0.25s;
}
.step.active .step-node { background: #fff; color: var(--pink); box-shadow: 0 0 0 4.8px rgba(255,255,255,0.3); }
.step.done .step-node   { background: rgba(255,255,255,0.85); color: var(--pink2); }
.step-label { font-size: 13.2px; color: rgba(255,255,255,0.7); font-weight: 700; }
.step.active .step-label { color: #fff; font-weight: 900; }
.step.done  .step-label  { color: rgba(255,255,255,0.9); }

/* ══ PAGES — scrollable content ═══════════════════════ */
.page {
  display: none;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 24px 21.6px var(--bottom-bar-h);
  animation: slideUp 0.25s ease both;
}
.page.active { display: block; }

#page-mybk.active {
  padding-bottom: calc(24px + var(--sab));
}

.page-header { margin-bottom: 26.4px; }
.page-tag {
  display: inline-flex; align-items: center; gap: 7.2px;
  background: var(--pink-light); color: var(--pink2);
  font-size: 14.4px; font-weight: 800; letter-spacing: 1.2px;
  text-transform: uppercase; padding: 7.2px 16.8px;
  border-radius: 60px; margin-bottom: 14.4px;
}
.page-title {
  font-family: var(--ff2); font-size: 31.2px; font-weight: 700;
  color: var(--text); line-height: 1.2; margin-bottom: 7.2px;
}
.page-title em { font-style: normal; color: var(--pink); }
.page-sub { font-size: 18px; color: var(--text3); font-weight: 600; }

/* ══ SERVICE CARDS ═════════════════════════════════════ */
.service-list { display: flex; flex-direction: column; gap: 16px; }

.service-card {
  background: var(--white);
  border: 2.4px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s, transform 0.12s;
}
.service-card:active { transform: scale(0.985); }
.service-card.selected {
  border-color: var(--pink);
  background: var(--pink-pale);
  box-shadow: 0 6px 28px rgba(255,107,157,0.2);
}

.service-card::before {
  content: ''; position: absolute; left: 0; top: 0; right: 0; height: 5px;
  background: transparent; transition: background 0.18s;
  border-radius: var(--radius) var(--radius) 0 0;
}
.service-card.selected::before { background: linear-gradient(90deg, var(--pink), var(--pink2)); }

.svc-header {
  display: flex; align-items: center; gap: 16px;
  padding: 22px 20px 14px;
}
.svc-icon-wrap {
  width: 68px; height: 68px; border-radius: 18px;
  background: var(--bg); flex-shrink: 0; font-size: 32px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.18s;
  border: 2px solid var(--border);
}
.service-card.selected .svc-icon-wrap {
  background: var(--pink-light);
  border-color: var(--pink-border);
}
.svc-header-text { flex: 1; min-width: 0; }
.svc-name {
  font-size: 21px; font-weight: 900; color: var(--text);
  margin-bottom: 4px; line-height: 1.2;
}
.svc-duration-badge {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--bg); border: 1.5px solid var(--border);
  border-radius: 50px; padding: 3px 10px;
  font-size: 13px; font-weight: 700; color: var(--text3);
}
.service-card.selected .svc-duration-badge {
  background: var(--pink-light); border-color: var(--pink-border); color: var(--pink2);
}
.svc-price-col { text-align: right; flex-shrink: 0; }
.svc-price {
  font-family: var(--ff2); font-size: 26px; font-weight: 700;
  color: var(--pink); line-height: 1;
}
.svc-price-label {
  font-size: 12px; font-weight: 600; color: var(--text3); margin-top: 2px;
}

.svc-divider {
  height: 1.5px; background: var(--border); margin: 0 20px;
  transition: background 0.18s;
}
.service-card.selected .svc-divider { background: var(--pink-border); }

.svc-body {
  padding: 14px 20px 18px;
  display: flex; flex-direction: column; gap: 10px;
}
.svc-desc {
  font-size: 15px; color: var(--text2); font-weight: 600;
  line-height: 1.6;
}
.svc-tags { display: flex; flex-wrap: wrap; gap: 7px; }
.svc-tag {
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--bg); border: 1.5px solid var(--border);
  border-radius: 50px; padding: 5px 12px;
  font-size: 13px; font-weight: 700; color: var(--text2);
  white-space: nowrap;
}
.service-card.selected .svc-tag {
  background: var(--pink-light); border-color: var(--pink-border); color: var(--pink2);
}

.check-badge {
  position: absolute; top: 14px; right: 14px;
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--pink); display: none;
  align-items: center; justify-content: center;
  color: #fff; font-size: 16px; font-weight: 900;
  box-shadow: 0 3px 10px rgba(255,107,157,0.4);
}
.service-card.selected .check-badge { display: flex; }

/* ══ STAFF GRID ════════════════════════════════════════ */
.staff-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 14.4px; }
.staff-card {
  background: var(--white); border: 2.4px solid var(--border);
  border-radius: var(--radius); padding: 24px 16.8px;
  cursor: pointer; text-align: center; position: relative;
  box-shadow: var(--shadow-sm); transition: border-color 0.15s, background 0.15s;
  min-height: 177.6px; display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.staff-card:active { opacity: 0.8; }
.staff-card.selected { border-color: var(--pink); background: var(--pink-pale); box-shadow: 0 4.8px 24px rgba(255,107,157,0.18); }

.staff-card.any-card {
  grid-column: 1 / -1;
  flex-direction: row; text-align: left; padding: 21.6px 24px; gap: 19.2px;
  background: linear-gradient(135deg, var(--sky-light), #E0F6FF);
  border-color: var(--sky); border-style: dashed;
  min-height: 100.8px;
}
.staff-card.any-card.selected { border-color: var(--pink); background: var(--pink-pale); border-style: solid; }

.staff-ava {
  width: 79.2px; height: 79.2px; border-radius: 50%;
  background: linear-gradient(135deg, var(--pink-light), #EDE9FE);
  border: 3.6px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 800; color: var(--pink);
  margin: 0 auto 12px; overflow: hidden; font-family: var(--ff2);
}
.any-card .staff-ava {
  margin: 0; flex-shrink: 0; width: 62.4px; height: 62.4px; font-size: 21.6px;
  background: linear-gradient(135deg, var(--sky-light), #BAE6FD);
  border-color: var(--sky); color: #0284C7;
}
.staff-ava img { width:100%; height:100%; object-fit:cover; }
.staff-name { font-size: 19.2px; font-weight: 800; color: var(--text); margin-bottom: 3.6px; }
.staff-role { font-size: 15.6px; color: var(--text3); font-weight: 600; }
.any-card .any-text { flex: 1; }
.any-card .any-text .staff-name { font-size: 18px; }
.any-card .any-text .staff-role { color: #0284C7; font-size: 14.4px; }
.staff-check {
  position: absolute; top: 10.8px; right: 10.8px;
  width: 28.8px; height: 28.8px; border-radius: 50%;
  background: var(--pink); display: none;
  align-items: center; justify-content: center;
  color: #fff; font-size: 15.6px; font-weight: 900;
}
.staff-card.selected .staff-check { display: flex; }

/* ══ CALENDAR ══════════════════════════════════════════ */
.cal-wrap {
  background: var(--white); border-radius: var(--radius);
  padding: 24px; margin-bottom: 24px;
  box-shadow: var(--shadow-sm); border: 1.8px solid var(--border);
}
.cal-header {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 21.6px;
}
.cal-month-lbl { font-family: var(--ff2); font-size: 24px; font-weight: 700; }
.cal-nav {
  width: 57.6px; height: 57.6px; border-radius: var(--radius-xs);
  border: 2.4px solid var(--border); background: var(--bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 26.4px; color: var(--text2); cursor: pointer;
}
.cal-nav:active { background: var(--pink-pale); border-color: var(--pink); }
.cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 4.8px; }
.cal-dow { text-align: center; font-size: 14.4px; font-weight: 800; color: var(--text3); padding: 7.2px 0; }
.cal-day {
  aspect-ratio: 1;
  border-radius: var(--radius-xs);
  display: flex; align-items: center; justify-content: center;
  font-size: 19.2px; font-weight: 600; cursor: pointer;
  color: var(--text2); position: relative;
  border: 2.4px solid transparent; transition: all 0.15s;
  min-height: 55.2px;
}
.cal-day:active:not(.disabled):not(.empty) { background: var(--pink-pale); }
.cal-day.today { color: var(--pink); font-weight: 900; }
.cal-day.selected { background: var(--pink) !important; color: #fff !important; border-color: var(--pink) !important; font-weight: 800; box-shadow: 0 3.6px 14.4px rgba(255,107,157,0.42); }
.cal-day.disabled { color: var(--border); cursor: default; }
.cal-day.empty    { cursor: default; }

/* ══ TIME SLOTS ════════════════════════════════════════ */
.time-section { margin-top: 24px; }
.time-section-hd {
  font-size: 15.6px; font-weight: 800; letter-spacing: 1.8px;
  text-transform: uppercase; color: var(--text3); margin-bottom: 12px;
}
.time-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10.8px; }
.time-slot {
  background: var(--white); border: 2.4px solid var(--border);
  border-radius: var(--radius-sm); padding: 16.8px 9.6px;
  text-align: center;
  font-size: 19.2px; font-weight: 800;
  cursor: pointer; color: var(--text2); box-shadow: var(--shadow-sm);
  min-height: 76.8px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  transition: all 0.12s;
}
.time-slot:active:not(.unavailable) { background: var(--pink-pale); }
.time-slot.selected { background: var(--pink) !important; border-color: var(--pink) !important; color: #fff !important; box-shadow: 0 4.8px 19.2px rgba(255,107,157,0.42); }
.time-slot.unavailable { background: var(--bg); color: var(--border); cursor: default; border-color: transparent; text-decoration: line-through; }
.time-end { font-size: 13.2px; opacity: 0.7; margin-top: 2.4px; font-weight: 500; }
.no-date-msg { text-align: center; padding: 43.2px 0; color: var(--text3); font-size: 19.2px; font-weight: 600; }

.shimmer-box {
  border-radius: var(--radius);
  background: linear-gradient(90deg, #f0f4ff 25%, #e8eeff 50%, #f0f4ff 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease infinite;
}

/* ══ CONFIRM PAGE ══════════════════════════════════════ */
.profile-card {
  background: linear-gradient(135deg, var(--pink-pale), var(--sky-light));
  border: 2.4px solid var(--pink-border); border-radius: var(--radius);
  padding: 21.6px 24px; display: flex; align-items: center;
  gap: 19.2px; margin-bottom: 24px;
}
.profile-ava {
  width: 67.2px; height: 67.2px; border-radius: 50%;
  background: var(--pink-light); border: 3.6px solid var(--pink-border);
  overflow: hidden; display: flex; align-items: center;
  justify-content: center; font-size: 28.8px; flex-shrink: 0;
}
.profile-ava img { width:100%; height:100%; object-fit:cover; }
.profile-name { font-size: 21.6px; font-weight: 800; }
.profile-sub  { font-size: 15.6px; color: var(--pink); font-weight: 700; }

.member-info-box {
  background: var(--green-light); border: 2.4px solid #6EE7B7;
  border-radius: var(--radius-sm); padding: 16.8px 21.6px;
  margin-bottom: 21.6px; display: flex; align-items: center; gap: 14.4px;
}
.member-icon { font-size: 28.8px; flex-shrink: 0; }
.member-name { font-size: 18px; font-weight: 800; color: #065F46; }
.member-balance { font-size: 15.6px; color: #047857; font-weight: 600; margin-top: 2.4px; }
.member-code { font-size: 14.4px; color: #6EE7B7; font-weight: 700; }

.form-label { font-size: 18px; font-weight: 800; color: var(--text2); margin-bottom: 9.6px; display: block; }
.form-input {
  width: 100%; background: var(--white);
  border: 2.4px solid var(--border); border-radius: var(--radius-sm);
  padding: 19.2px 19.2px; font-size: 19.2px;
  font-family: var(--ff); color: var(--text); outline: none; margin-bottom: 21.6px;
  transition: border-color 0.15s; -webkit-appearance: none; font-weight: 600;
}
.form-input:focus { border-color: var(--pink); }
.form-input::placeholder { color: var(--text3); font-weight: 400; }
.form-input.error { border-color: #EF4444; }
.form-textarea { resize: none; height: 108px; font-size: 19.2px; }

.summary-card {
  background: var(--white); border: 2.4px solid var(--border);
  border-radius: var(--radius); overflow: hidden;
  margin-bottom: 21.6px; box-shadow: var(--shadow-sm);
}
.summary-head {
  background: linear-gradient(135deg, var(--pink), var(--pink2));
  padding: 21.6px 24px; display: flex; align-items: center; gap: 14.4px;
}
.summary-head-icon { font-size: 31.2px; }
.summary-head-title { font-family: var(--ff2); font-size: 21.6px; font-weight: 700; color: #fff; }
.summary-head-sub   { font-size: 14.4px; color: rgba(255,255,255,0.75); margin-top: 2.4px; }
.summary-body { padding: 19.2px 24px; }
.sum-row {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 14.4px 0; border-bottom: 1.2px solid var(--border);
}
.sum-row:last-child { border-bottom: none; }
.sum-label { font-size: 16.8px; color: var(--text3); font-weight: 700; }
.sum-value { font-size: 18px; font-weight: 800; color: var(--text); text-align: right; max-width: 62%; }
.sum-price-big { font-family: var(--ff2); font-size: 36px; font-weight: 800; color: var(--pink); }

.policy-box {
  background: var(--gold-light); border: 2.4px solid #FDE68A;
  border-radius: var(--radius-sm); padding: 16.8px 21.6px; margin-bottom: 24px;
}
.policy-box p { font-size: 16.8px; color: #92400E; font-weight: 700; line-height: 1.8; }

/* ══ MY BOOKINGS ═══════════════════════════════════════ */
.tabs { display: flex; gap: 9.6px; margin-bottom: 19.2px; overflow-x: auto; padding-bottom: 4.8px; }
.tabs::-webkit-scrollbar { display: none; }
.tab-btn {
  padding: 13.2px 24px; border-radius: 60px;
  border: 2.4px solid var(--border); background: var(--white);
  font-family: var(--ff); font-size: 16.8px; font-weight: 800;
  color: var(--text3); cursor: pointer; white-space: nowrap; flex-shrink: 0;
  min-height: 55.2px;
}
.tab-btn.active { background: var(--pink); border-color: var(--pink); color: #fff; }
.booking-item {
  background: var(--white); border: 2.4px solid var(--border);
  border-radius: var(--radius); padding: 24px; margin-bottom: 14.4px;
  box-shadow: var(--shadow-sm);
}
.bk-service { font-size: 21.6px; font-weight: 800; margin-bottom: 9.6px; }
.bk-details { font-size: 16.8px; color: var(--text2); line-height: 2; font-weight: 600; }
.bk-status {
  font-size: 14.4px; font-weight: 800; padding: 6px 14.4px;
  border-radius: 60px; letter-spacing: 0.4px; flex-shrink: 0;
}
.bk-pending   { background: var(--gold-light); color: #B45309; }
.bk-confirmed { background: var(--green-light); color: #065F46; }
.bk-cancelled { background: #F1F5F9; color: var(--text3); }
.bk-completed { background: var(--sky-light); color: #0369A1; }
.bk-cancel-btn {
  margin-top: 16.8px; width: 100%; background: transparent;
  border: 2.4px solid #FCA5A5; border-radius: 60px; padding: 16.8px;
  font-family: var(--ff); font-size: 18px; font-weight: 800;
  color: #EF4444; cursor: pointer;
  min-height: 62.4px;
}
.bk-cancel-btn:active { background: #FEF2F2; }

/* ══ BUTTONS ═══════════════════════════════════════════ */
.btn-primary {
  width: 100%;
  background: linear-gradient(135deg, var(--pink), var(--pink2));
  color: #fff; border: none; border-radius: 60px;
  padding: 24px; font-size: 21.6px; font-weight: 900;
  font-family: var(--ff); cursor: pointer;
  box-shadow: 0 7.2px 28.8px rgba(255,107,157,0.42);
  letter-spacing: 0.4px; -webkit-appearance: none;
  min-height: 72px;
}
.btn-primary:active { opacity: 0.88; }
.btn-primary:disabled { opacity: 0.38; cursor: not-allowed; box-shadow: none; }
.btn-secondary {
  width: 100%; background: var(--white);
  color: var(--text2); border: 2.4px solid var(--border);
  border-radius: 60px; padding: 21.6px;
  font-size: 19.2px; font-weight: 800; font-family: var(--ff); cursor: pointer;
  min-height: 67.2px;
}
.btn-secondary:active { background: var(--bg); }

/* ══ BOTTOM BAR ════════════════════════════════════════ */
.page-bottom-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: rgba(248,250,255,0.97);
  padding: 19.2px 24px calc(19.2px + var(--sab));
  display: flex; gap: 14.4px; align-items: center;
  backdrop-filter: blur(16.8px);
  -webkit-backdrop-filter: blur(16.8px);
  border-top: 1.8px solid var(--border);
  box-shadow: 0 -4.8px 28.8px rgba(0,0,0,0.08);
  z-index: 20;
}
.bottom-svc-info { flex: 1; min-width: 0; }
.bottom-svc-name  { font-size: 15.6px; color: var(--text3); font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bottom-svc-price { font-size: 24px; font-weight: 900; color: var(--pink); }
.bottom-next {
  background: linear-gradient(135deg, var(--pink), var(--pink2));
  color: #fff; border: none; border-radius: 60px;
  padding: 21.6px 33.6px; font-size: 19.2px; font-weight: 900;
  font-family: var(--ff); cursor: pointer; white-space: nowrap;
  box-shadow: 0 4.8px 21.6px rgba(255,107,157,0.42);
  -webkit-appearance: none;
  min-height: 67.2px; min-width: 156px;
}
.bottom-next:disabled { opacity: 0.35; cursor: default; box-shadow: none; }
.bottom-next:active:not(:disabled) { opacity: 0.85; }
.btn-icon {
  width: 67.2px; height: 67.2px; border-radius: 50%; flex-shrink: 0;
  background: var(--white); border: 2.4px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 26.4px; cursor: pointer; font-weight: 700; color: var(--text2);
}
.btn-icon:active { background: var(--bg); }

/* ══ MISC ══════════════════════════════════════════════ */
.section-tip {
  background: var(--sky-light); border: 2.4px solid #BAE6FD;
  border-radius: var(--radius-sm); padding: 16.8px 19.2px;
  font-size: 16.8px; color: #0369A1; font-weight: 700;
  margin-bottom: 21.6px; display: flex; align-items: center; gap: 9.6px;
}
.divider { height: 1.2px; background: var(--border); margin: 21.6px 0; }
.empty-state { text-align: center; padding: 57.6px 24px; color: var(--text3); }
.empty-icon  { font-size: 57.6px; display: block; margin-bottom: 14.4px; }

/* ══ TOAST ═════════════════════════════════════════════ */
.toast {
  position: fixed; bottom: calc(132px + var(--sab)); left: 50%;
  transform: translateX(-50%) translateY(7.2px);
  background: var(--text); color: #fff; padding: 16.8px 28.8px;
  border-radius: 60px; font-size: 18px; font-weight: 700;
  opacity: 0; pointer-events: none; z-index: 500;
  transition: opacity 0.2s, transform 0.2s; white-space: nowrap;
  max-width: calc(100vw - 48px); text-align: center;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

/* ══ RESPONSIVE ═════════════════════════════════════════ */
@media (min-width: 468px) {
  .page-title { font-size: 33.6px; }
  .app-logo   { font-size: 33.6px; }
}

@media (max-width: 432px) {
  .time-grid { grid-template-columns: repeat(2,1fr); }
  .page-title { font-size: 28.8px; }
  .app-logo { font-size: 26.4px; }
  .svc-name { font-size: 19.2px; }
}
</style>
</head>
<body>

<!-- Loading -->
<div id="loading-screen">
  <div class="loading-logo">💅 Nail Kloset</div>
  <div class="loading-sub">The Crystal Ratchapruek</div>
  <div class="loading-dots" id="loading-dots"><span></span><span></span><span></span></div>
  <div id="loading-timeout-msg" style="display:none;margin-top:32px;text-align:center;padding:0 32px">
    <div style="font-size:15px;color:rgba(255,255,255,0.85);line-height:1.8;margin-bottom:20px">
      กำลังเชื่อมต่อนานผิดปกติ...<br>กรุณาลองใหม่อีกครั้งค่ะ
    </div>
    <button onclick="location.reload()" style="background:rgba(255,255,255,0.25);border:2px solid rgba(255,255,255,0.6);color:#fff;font-family:'Nunito',sans-serif;font-size:16px;font-weight:800;padding:14px 32px;border-radius:50px;cursor:pointer;">
      🔄 โหลดใหม่
    </button>
  </div>
</div>

<!-- LINE Login Screen -->
<div id="login-screen" style="display:none;position:fixed;inset:0;z-index:990;background:linear-gradient(160deg,#FFF5F9 0%,#FFF0F7 50%,#F0F6FF 100%);flex-direction:column;align-items:center;justify-content:center;padding:40px 28px;text-align:center;">
  <div style="font-size:72px;margin-bottom:20px;line-height:1">💅</div>
  <div style="font-family:'Poppins',sans-serif;font-size:28px;font-weight:700;color:#1E293B;margin-bottom:6px;">Nail Kloset</div>
  <div style="font-size:15px;color:#94A3B8;font-weight:600;letter-spacing:1px;margin-bottom:32px;">THE CRYSTAL RATCHAPRUEK</div>
  <div style="background:#fff;border-radius:24px;padding:28px 24px;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:2px solid #E2E8F0;width:100%;max-width:360px;margin-bottom:28px;">
    <div style="font-size:18px;font-weight:800;color:#1E293B;margin-bottom:8px;">จองคิวออนไลน์</div>
    <div style="font-size:15px;color:#475569;font-weight:600;line-height:1.7;">กรุณาเข้าสู่ระบบด้วย LINE<br>เพื่อจองคิวและดูประวัติการจองค่ะ</div>
  </div>
  <a id="open-in-line-btn"
     href="#"
     style="display:flex;align-items:center;justify-content:center;gap:12px;width:100%;max-width:360px;background:#06C755;color:#fff;border:none;border-radius:50px;padding:20px 28px;font-family:'Nunito',sans-serif;font-size:18px;font-weight:900;text-decoration:none;box-shadow:0 6px 24px rgba(6,199,85,0.35);margin-bottom:14px;cursor:pointer;">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
    เข้าสู่ระบบด้วย LINE
  </a>
  <div style="font-size:13px;color:#94A3B8;font-weight:600;line-height:1.7;">หากมีปัญหา กรุณาเปิดลิงก์นี้<br>ผ่าน LINE แอปโดยตรงค่ะ</div>
</div>

<!-- Success -->
<div id="success-screen">
  <div class="success-anim">✅</div>
  <div class="success-title">จองสำเร็จแล้วค่ะ!</div>
  <div class="success-sub">ร้านได้รับการจองของคุณแล้ว<br>รอการยืนยันทาง LINE นะคะ 💕</div>
  <div class="success-card" id="success-detail"></div>
  <div class="bk-id-badge" id="success-bk-id"></div>
  <div class="policy-box" style="max-width:400px;text-align:center;margin-bottom:24px">
    <p>⚠️ กรุณาแจ้งยกเลิกล่วงหน้าอย่างน้อย <strong>2 ชั่วโมง</strong> ขอบคุณค่ะ</p>
  </div>
  <button class="btn-primary" style="max-width:400px" onclick="closeWindow()">เสร็จสิ้น ✨</button>
</div>

<!-- App shell -->
<div id="app">

  <!-- Header -->
  <div class="app-header">
    <div class="header-top">
      <div>
        <div class="app-logo">Nail Kloset<span>The Crystal Ratchapruek</span></div>
      </div>
      <div class="header-right">
        <button class="header-mybk-btn" id="header-mybk-btn" onclick="goMyBookings()" style="display:none">
          📋 การจองของฉัน
        </button>
        <div class="user-chip" id="user-chip" style="display:none">
          <div class="user-avatar" id="user-avatar">💅</div>
          <div class="user-chip-name" id="user-chip-name">—</div>
        </div>
      </div>
    </div>
    <div class="step-rail" id="step-rail">
      <div class="step active" id="sr-1"><div class="step-node">1</div><div class="step-label">บริการ</div></div>
      <div class="step" id="sr-2"><div class="step-node">2</div><div class="step-label">ช่าง</div></div>
      <div class="step" id="sr-3"><div class="step-node">3</div><div class="step-label">วัน/เวลา</div></div>
      <div class="step" id="sr-4"><div class="step-node">4</div><div class="step-label">ยืนยัน</div></div>
    </div>
  </div>

  <!-- Page 1: บริการ -->
  <div class="page active" id="page-1">
    <div class="page-header">
      <div class="page-tag">✨ ขั้นตอน 1 / 4</div>
      <div class="page-title">เลือก<em>บริการ</em>ที่ต้องการ</div>
      <div class="page-sub">เลือกได้ 1 บริการต่อการจอง</div>
    </div>
    <div class="service-list" id="service-list">
      <div class="shimmer-box" style="height:180px"></div>
      <div class="shimmer-box" style="height:180px;animation-delay:0.1s"></div>
      <div class="shimmer-box" style="height:180px;animation-delay:0.2s"></div>
    </div>
  </div>

  <!-- Page 2: ช่าง -->
  <div class="page" id="page-2">
    <div class="page-header">
      <div class="page-tag">💇‍♀️ ขั้นตอน 2 / 4</div>
      <div class="page-title">เลือก<em>ช่าง</em>ที่ต้องการ</div>
      <div class="page-sub">หรือให้ระบบจัดสรรอัตโนมัติได้เลยค่ะ</div>
    </div>
    <div class="staff-grid" id="staff-grid">
      <div class="shimmer-box" style="height:177.6px"></div>
      <div class="shimmer-box" style="height:177.6px;animation-delay:0.1s"></div>
      <div class="shimmer-box" style="height:100.8px;grid-column:1/-1;animation-delay:0.2s"></div>
    </div>
  </div>

  <!-- Page 3: วัน/เวลา -->
  <div class="page" id="page-3">
    <div class="page-header">
      <div class="page-tag">📅 ขั้นตอน 3 / 4</div>
      <div class="page-title">เลือก<em>วัน</em>และ<em>เวลา</em></div>
      <div class="page-sub">จองล่วงหน้าได้ 30 วัน</div>
    </div>
    <div class="section-tip">💡 เลือกวันที่ต้องการก่อน แล้วเลือกเวลาค่ะ</div>
    <div class="cal-wrap">
      <div class="cal-header">
        <button class="cal-nav" onclick="changeCalMonth(-1)">‹</button>
        <div class="cal-month-lbl" id="cal-month-lbl">—</div>
        <button class="cal-nav" onclick="changeCalMonth(1)">›</button>
      </div>
      <div class="cal-grid" id="cal-grid"></div>
    </div>
    <div id="time-slots-wrap" style="display:none">
      <div class="time-section"><div class="time-section-hd">🌅 ช่วงเช้า</div><div class="time-grid" id="slots-morning"></div></div>
      <div class="time-section"><div class="time-section-hd">☀️ ช่วงบ่าย</div><div class="time-grid" id="slots-afternoon"></div></div>
      <div class="time-section"><div class="time-section-hd">🌇 ช่วงเย็น</div><div class="time-grid" id="slots-evening"></div></div>
    </div>
    <div id="time-loading" style="display:none">
      <div class="time-grid" style="margin-top:20px">
        <div class="shimmer-box" style="height:76.8px"></div>
        <div class="shimmer-box" style="height:76.8px;animation-delay:0.1s"></div>
        <div class="shimmer-box" style="height:76.8px;animation-delay:0.2s"></div>
        <div class="shimmer-box" style="height:76.8px;animation-delay:0.3s"></div>
        <div class="shimmer-box" style="height:76.8px;animation-delay:0.4s"></div>
        <div class="shimmer-box" style="height:76.8px;animation-delay:0.5s"></div>
      </div>
    </div>
    <div class="no-date-msg" id="no-date-msg">👆 กรุณาเลือกวันที่ก่อนนะคะ</div>
  </div>

  <!-- Page 4: ยืนยัน -->
  <div class="page" id="page-4">
    <div class="page-header">
      <div class="page-tag">✅ ขั้นตอน 4 / 4</div>
      <div class="page-title">ตรวจสอบ<em>ข้อมูล</em></div>
      <div class="page-sub">กรุณาตรวจสอบก่อนยืนยันค่ะ</div>
    </div>
    <div class="profile-card">
      <div class="profile-ava" id="liff-profile-ava">💅</div>
      <div>
        <div class="profile-name" id="liff-profile-name">—</div>
        <div class="profile-sub">ลูกค้า Nail Kloset ✨</div>
      </div>
    </div>
    <div class="member-info-box" id="member-info-box" style="display:none">
      <div class="member-icon">💳</div>
      <div>
        <div class="member-name" id="member-info-name">—</div>
        <div class="member-balance" id="member-info-balance">—</div>
        <div class="member-code" id="member-info-code"></div>
      </div>
    </div>
    <label class="form-label">📞 เบอร์โทรศัพท์ *</label>
    <input type="tel" class="form-input" id="phone-input"
      placeholder="0812345678" maxlength="10" autocomplete="tel" inputmode="tel">
    <div class="summary-card">
      <div class="summary-head">
        <span class="summary-head-icon">💅</span>
        <div>
          <div class="summary-head-title">Nail Kloset</div>
          <div class="summary-head-sub">The Crystal Ratchapruek</div>
        </div>
      </div>
      <div class="summary-body">
        <div class="sum-row"><div class="sum-label">บริการ</div><div class="sum-value" id="sum-service">—</div></div>
        <div class="sum-row"><div class="sum-label">ช่าง</div><div class="sum-value" id="sum-staff">—</div></div>
        <div class="sum-row"><div class="sum-label">วันที่</div><div class="sum-value" id="sum-date">—</div></div>
        <div class="sum-row"><div class="sum-label">เวลา</div><div class="sum-value" id="sum-time">—</div></div>
        <div class="sum-row"><div class="sum-label">ระยะเวลา</div><div class="sum-value" id="sum-duration">—</div></div>
        <div class="sum-row"><div class="sum-label">ราคาประมาณ</div><div class="sum-value"><div class="sum-price-big" id="sum-price">—</div></div></div>
      </div>
    </div>
    <label class="form-label">📝 หมายเหตุ (ถ้ามี)</label>
    <textarea class="form-input form-textarea" id="note-input"
      placeholder="เช่น สีที่ต้องการ, รูปแบบ, แพ้สาร..."></textarea>
    <div class="policy-box">
      <p>⚠️ กรุณาแจ้งยกเลิกหรือเลื่อนนัดล่วงหน้าอย่างน้อย <strong>2 ชั่วโมง</strong><br>เพื่อรักษาสิทธิ์การจองในครั้งต่อไปค่ะ</p>
    </div>
    <button class="btn-primary" id="confirm-btn" onclick="submitBooking()">💕 ยืนยันการจองนัด</button>
    <div style="height:14.4px"></div>
    <button class="btn-secondary" onclick="goStep(3)">← แก้ไข</button>
    <div style="height:28.8px"></div>
  </div>

  <!-- Page: My Bookings -->
  <div class="page" id="page-mybk">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
      <button class="btn-icon" onclick="goStep(1)">←</button>
      <div>
        <div class="page-title" style="font-size:24px;margin-bottom:0">การจองของฉัน</div>
        <div class="page-sub" style="font-size:13px;margin-bottom:0">ประวัติและสถานะทั้งหมด</div>
      </div>
    </div>
    <div class="tabs">
      <button class="tab-btn active" onclick="filterBookings('all',this)">ทั้งหมด</button>
      <button class="tab-btn" onclick="filterBookings('pending',this)">รอยืนยัน</button>
      <button class="tab-btn" onclick="filterBookings('confirmed',this)">ยืนยันแล้ว</button>
      <button class="tab-btn" onclick="filterBookings('completed',this)">เสร็จสิ้น</button>
    </div>
    <div id="mybk-list">
      <div class="shimmer-box" style="height:168px;margin-bottom:12px"></div>
      <div class="shimmer-box" style="height:168px;animation-delay:0.15s"></div>
    </div>
  </div>

  <!-- Bottom bars -->
  <div class="page-bottom-bar" id="bar-1">
    <div class="bottom-svc-info">
      <div class="bottom-svc-name" id="bn-svc-name">เลือกบริการก่อนนะคะ</div>
      <div class="bottom-svc-price" id="bn-svc-price">—</div>
    </div>
    <button class="bottom-next" id="next-1" disabled onclick="goStep(2)">ถัดไป →</button>
  </div>
  <div class="page-bottom-bar" id="bar-2" style="display:none">
    <button class="btn-icon" onclick="goStep(1)">←</button>
    <button class="bottom-next" id="next-2" disabled onclick="goStep(3)" style="flex:1">ถัดไป →</button>
  </div>
  <div class="page-bottom-bar" id="bar-3" style="display:none">
    <button class="btn-icon" onclick="goStep(2)">←</button>
    <button class="bottom-next" id="next-3" disabled onclick="goStep(4)" style="flex:1">ถัดไป →</button>
  </div>

</div><!-- /app -->

<div class="toast" id="toast"></div>

<script>
/* ══ CONFIG ════════════════════════════════════════════ */
const LIFF_ID = '2010038922-jb9aJ1T7';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzrZt0orG7_m3Lp9IxQsydBmhSwji_ks456bjKvPbO747-S8mCGQHVrsyqEJHKYjcdd/exec';
const API_TIMEOUT = 8000; // 8 seconds for API calls
const LIFF_TIMEOUT = 5000; // 5 seconds for LIFF init

/* ══ STATE ═════════════════════════════════════════════ */
const state = {
  lineUserId:  null,
  lineProfile: null,
  memberData:  null,
  phone:       '',
  step:        1,
  service:     null,
  staff:       null,
  date:        null,
  timeSlot:    null,
  calYear:     new Date().getFullYear(),
  calMonth:    new Date().getMonth(),
  services:    [],
  staffs:      [],
  myBookings:  [],
  bookingFilter: 'all',
};

const TH_MONTHS    = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const TH_DAYS_FULL = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
const SVC_ICONS    = { 'BIAB':'🌸','French':'🌸','Infill':'🔮','Gel':'💅','Acrylic':'💠','Pedicure':'🦶','Lux':'💎','Spa':'🙌','ต่อขนตา':'👁','Art':'🎨','Polish':'💅','Eye':'👁','Parafin':'🧴','Corner':'🙌' };
const STAFF_COLORS = ['#FF6B9D','#38BDF8','#A78BFA','#FBBF24','#2DD4BF','#F97316'];

/* ══ LOADING ═══════════════════════════════════════════ */
function hideLoading() {
  document.getElementById('loading-screen').classList.add('out');
}

function showFatalError(msg) {
  const el = document.getElementById('loading-screen');
  el.innerHTML = `<div style="text-align:center;padding:40px">
    <div style="font-size:56px;margin-bottom:20px">😔</div>
    <div style="font-family:'Poppins',sans-serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:12px">เกิดข้อผิดพลาด</div>
    <div style="font-size:16px;color:rgba(255,255,255,0.85);line-height:1.7;margin-bottom:20px">${msg}</div>
    <button onclick="location.reload()" style="background:rgba(255,255,255,0.25);border:2px solid rgba(255,255,255,0.6);color:#fff;font-family:'Nunito',sans-serif;font-size:16px;font-weight:800;padding:14px 32px;border-radius:50px;cursor:pointer;">
      🔄 รีเซ็ต
    </button>
  </div>`;
}

/* ══ LIFF INIT ══════════════════════════════════════════
 * FIX: Use aggressive timeout + promise race 
 * If LIFF doesn't respond within 5 sec → show login screen
 ════════════════════════════════════════════════════ */
async function initApp() {
  const hintTimer = setTimeout(() => {
    const msg  = document.getElementById('loading-timeout-msg');
    const dots = document.getElementById('loading-dots');
    if (msg)  msg.style.display  = 'block';
    if (dots) dots.style.display = 'none';
  }, 2000);

  try {
    const liffInitPromise = liff.init({ liffId: LIFF_ID });
    const timeoutPromise  = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('LIFF_TIMEOUT')), LIFF_TIMEOUT)
    );
    
    await Promise.race([liffInitPromise, timeoutPromise]);
  } catch (err) {
    clearTimeout(hintTimer);
    console.warn('LIFF init error:', err.message);
    // Not in LINE app or LIFF timed out
    if (!liff.isLoggedIn?.()) {
      _showLoginScreen();
      return;
    }
  }
  clearTimeout(hintTimer);

  const inLineApp = liff?.isInClient?.();

  if (!inLineApp) {
    if (liff?.isLoggedIn?.()) {
      await _proceedAsLoggedIn();
      return;
    }
    _showLoginScreen();
    return;
  }

  if (!liff.isLoggedIn()) {
    if (sessionStorage.getItem('liff_login_attempted')) {
      sessionStorage.removeItem('liff_login_attempted');
      _showLoginScreen();
      return;
    }
    sessionStorage.setItem('liff_login_attempted', '1');
    liff.login();
    return;
  }

  sessionStorage.removeItem('liff_login_attempted');
  await _proceedAsLoggedIn();
}

function _showLoginScreen() {
  const ls = document.getElementById('login-screen');
  ls.classList.add('show');
  document.getElementById('loading-screen').classList.add('out');

  const currentUrl = encodeURIComponent(location.href);
  const lineOpenUrl = `https://line.me/R/app/${LIFF_ID}`;
  document.getElementById('open-in-line-btn').href = lineOpenUrl;

  try {
    if (typeof liff !== 'undefined' && liff.isApiAvailable?.('login')) {
      document.getElementById('open-in-line-btn').onclick = (e) => {
        e.preventDefault();
        sessionStorage.setItem('liff_login_attempted', '1');
        liff.login();
      };
    }
  } catch(e) { /* use deeplink */ }
}

async function _proceedAsLoggedIn() {
  try {
    const profile = await liff.getProfile();
    state.lineProfile = profile;
    state.lineUserId  = profile.userId;
    _showUserUI(profile.displayName, profile.pictureUrl);

    apiCall('bk_registerCustomer', {
      line_user_id:  profile.userId,
      line_name:     profile.displayName,
      profile_image: profile.pictureUrl || ''
    }).then(r => {
      if (r && r.member) state.memberData = r.member;
    }).catch(e => console.warn('registerCustomer:', e));

  } catch (e) {
    console.warn('getProfile error:', e);
    state.lineProfile = { displayName: 'ลูกค้า', userId: 'unknown', pictureUrl: null };
    state.lineUserId  = 'unknown';
    _showUserUI('ลูกค้า', null);
  }

  try {
    await Promise.all([ loadServices(), loadStaffs() ]);
  } catch (e) {
    console.error('Data loading error:', e);
    showToast('⚠️ เกิดข้อผิดพลาดในการโหลดข้อมูล');
  }

  document.getElementById('liff-profile-name').textContent =
    state.lineProfile?.displayName || 'ลูกค้า';
  if (state.lineProfile?.pictureUrl) {
    document.getElementById('liff-profile-ava').innerHTML =
      `<img src="${state.lineProfile.pictureUrl}" alt="">`;
  }

  setTimeout(hideLoading, 400);
}

function _showUserUI(name, pictureUrl) {
  document.getElementById('user-chip').style.display       = 'flex';
  document.getElementById('user-chip-name').textContent    = name;
  document.getElementById('header-mybk-btn').style.display = 'flex';
  if (pictureUrl) {
    document.getElementById('user-avatar').innerHTML = `<img src="${pictureUrl}" alt="">`;
  }
}

/* ══ API WITH TIMEOUT ══════════════════════════════════ */
async function apiCall(action, params = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

    const r = await fetch(`${GAS_URL}?${qs}`, { 
      cache: 'no-cache',
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch(e) {
    console.error('API error:', e.message);
    return { ok: false, error: e.message };
  }
}

/* ══ SERVICES ══════════════════════════════════════════ */
async function loadServices() {
  const data = await apiCall('bk_getServices');
  state.services = data.services || [];
  renderServices();
}

function getSvcIcon(name) {
  for (const k in SVC_ICONS) if (name.includes(k)) return SVC_ICONS[k];
  return '💅';
}

function renderServices() {
  const list = document.getElementById('service-list');
  if (!state.services.length) {
    list.innerHTML = '<div class="empty-state"><span class="empty-icon">🔍</span>ไม่พบข้อมูลบริการ</div>';
    return;
  }
  list.innerHTML = state.services.map(s => {
    const tags = [];
    tags.push(`⏱ ${s.duration} นาที`);
    if (s.tags) s.tags.split(',').forEach(t => tags.push(t.trim()));
    const tagHtml = tags.map(t => `<span class="svc-tag">${t}</span>`).join('');
    const descHtml = s.description
      ? `<div class="svc-desc">${s.description}</div>`
      : '';

    return `
    <div class="service-card" id="sc_${s.id}" onclick="selectService('${s.id}')">
      <div class="check-badge">✓</div>
      <div class="svc-header">
        <div class="svc-icon-wrap">${getSvcIcon(s.name)}</div>
        <div class="svc-header-text">
          <div class="svc-name">${s.name}</div>
          <div class="svc-duration-badge">⏱ ${s.duration} นาที</div>
        </div>
        <div class="svc-price-col">
          <div class="svc-price">${s.price}</div>
          <div class="svc-price-label">บาท (ประมาณ)</div>
        </div>
      </div>
      <div class="svc-divider"></div>
      <div class="svc-body">
        ${descHtml}
        <div class="svc-tags">${tagHtml}</div>
      </div>
    </div>`;
  }).join('');
}

function selectService(id) {
  state.service = state.services.find(s => s.id === id);
  if (!state.service) return;
  document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('sc_' + id)?.classList.add('selected');
  document.getElementById('bn-svc-name').textContent  = state.service.name;
  document.getElementById('bn-svc-price').textContent = state.service.price;
  document.getElementById('next-1').disabled = false;
}

/* ══ STAFFS ════════════════════════════════════════════ */
async function loadStaffs() {
  const data = await apiCall('bk_getStaffs');
  state.staffs = data.staffs || [];
  renderStaffs();
}

function renderStaffs() {
  const grid = document.getElementById('staff-grid');
  let html = '';
  state.staffs.forEach((s, i) => {
    const col = STAFF_COLORS[i % STAFF_COLORS.length];
    const ava = s.image
      ? `<img src="${s.image}" alt="${s.name}">`
      : s.name.slice(0, 2);
    const avaStyle = s.image ? '' : `background:linear-gradient(135deg,${col}22,${col}44);color:${col}`;
    html += `<div class="staff-card" id="stc_${s.id}" onclick="selectStaff('${s.id}',false)">
      <div class="staff-ava" style="${avaStyle}">${ava}</div>
      <div class="staff-name">${s.name}</div>
      <div class="staff-role">${s.bio || 'ช่างเล็บ'}</div>
      <div class="staff-check">✓</div>
    </div>`;
  });
  html += `<div class="staff-card any-card" id="stc_stf_any" onclick="selectStaff('stf_any',true)">
    <div class="staff-ava">∞</div>
    <div class="any-text">
      <div class="staff-name">ไม่ระบุช่าง</div>
      <div class="staff-role">ระบบจัดสรรช่างว่างให้อัตโนมัติ</div>
    </div>
    <div class="staff-check">✓</div>
  </div>`;
  grid.innerHTML = html;
}

function selectStaff(id, isAuto) {
  if (isAuto && !confirm('ให้ระบบเลือกช่างที่ว่างให้อัตโนมัติ?')) return;
  const all = [{ id:'stf_any', name:'ระบบจัดให้อัตโนมัติ' }, ...state.staffs];
  state.staff = all.find(s => s.id === id);
  if (!state.staff) return;
  document.querySelectorAll('.staff-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('stc_' + id)?.classList.add('selected');
  document.getElementById('next-2').disabled = false;
}

/* ══ CALENDAR ══════════════════════════════════════════ */
function changeCalMonth(dir) {
  state.calMonth += dir;
  if (state.calMonth < 0)  { state.calMonth = 11; state.calYear--; }
  if (state.calMonth > 11) { state.calMonth = 0;  state.calYear++; }
  renderCalendar();
}

function renderCalendar() {
  const now     = new Date();
  const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const maxDate = new Date(today.getTime() + 30*86400000);
  document.getElementById('cal-month-lbl').textContent =
    TH_MONTHS[state.calMonth] + ' ' + (state.calYear + 543);
  const grid     = document.getElementById('cal-grid');
  const firstDay = new Date(state.calYear, state.calMonth, 1).getDay();
  const lastDate = new Date(state.calYear, state.calMonth+1, 0).getDate();
  const dows = ['จ','อ','พ','พฤ','ศ','ส','อา'];
  let html = dows.map(d => `<div class="cal-dow">${d}</div>`).join('');
  let offset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < offset; i++) html += `<div class="cal-day empty"></div>`;
  for (let d = 1; d <= lastDate; d++) {
    const dt  = new Date(state.calYear, state.calMonth, d);
    const dis = dt < today || dt > maxDate;
    const isTd = dt.getTime() === today.getTime();
    const isSl = state.date && state.date.getTime() === dt.getTime();
    const cls = ['cal-day', dis?'disabled':'', isTd?'today':'', isSl?'selected':''].filter(Boolean).join(' ');
    html += `<div class="${cls}"${!dis ? ` onclick="selectDate(${state.calYear},${state.calMonth},${d})"`:''} >${d}</div>`;
  }
  grid.innerHTML = html;
}

async function selectDate(y, m, d) {
  state.date     = new Date(y, m, d);
  state.timeSlot = null;
  document.getElementById('next-3').disabled = true;
  renderCalendar();
  document.getElementById('time-slots-wrap').style.display = 'none';
  document.getElementById('no-date-msg').style.display     = 'none';
  document.getElementById('time-loading').style.display    = 'block';
  const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const result  = await apiCall('bk_getAvailTimes', {
    date:       dateStr,
    staff_id:   state.staff?.id   || 'stf_any',
    service_id: state.service?.id || ''
  });
  document.getElementById('time-loading').style.display = 'none';
  if (!result.ok || !result.slots?.length) {
    const msg = document.getElementById('no-date-msg');
    msg.textContent = '😔 ไม่มีช่วงเวลาว่างในวันนี้ค่ะ';
    msg.style.display = 'block';
    return;
  }
  renderTimeSlots(result.slots);
  document.getElementById('time-slots-wrap').style.display = 'block';
}

function renderTimeSlots(slots) {
  const morning   = slots.filter(s => parseInt(s.time) < 12);
  const afternoon = slots.filter(s => parseInt(s.time) >= 12 && parseInt(s.time) < 16);
  const evening   = slots.filter(s => parseInt(s.time) >= 16);
  const empty = `<div style="color:var(--text3);font-size:14px;grid-column:1/-1;font-weight:600;padding:8px 0">ไม่มีเวลาว่างในช่วงนี้</div>`;
  const makeSlot = s => {
    const cls = 'time-slot' + (!s.available ? ' unavailable' : '');
    const click = s.available ? `onclick="selectTime('${s.time}','${s.endTime||''}')"` : '';
    return `<div class="${cls}" id="ts_${s.time.replace(':','_')}" ${click}>
      ${s.time} น.<span class="time-end">${s.endTime ? s.endTime+' น.' : ''}</span>
    </div>`;
  };
  document.getElementById('slots-morning').innerHTML   = morning.length   ? morning.map(makeSlot).join('')   : empty;
  document.getElementById('slots-afternoon').innerHTML = afternoon.length ? afternoon.map(makeSlot).join('') : empty;
  document.getElementById('slots-evening').innerHTML   = evening.length   ? evening.map(makeSlot).join('')   : empty;
}

function selectTime(time, endTime) {
  state.timeSlot = { time, endTime };
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  document.getElementById('ts_' + time.replace(':','_'))?.classList.add('selected');
  document.getElementById('next-3').disabled = false;
}

/* ══ NAVIGATION ════════════════════════════════════════ */
function goStep(n) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  ['bar-1','bar-2','bar-3'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.style.display = 'none';
  });

  const page = document.getElementById('page-' + n);
  if (page) page.classList.add('active');

  if (n >= 1 && n <= 3) {
    const bar = document.getElementById('bar-' + n);
    if (bar) bar.style.display = 'flex';
  }

  const rail = document.getElementById('step-rail');
  rail.style.display = (n === 'mybk') ? 'none' : 'flex';
  state.step = n;

  if (n !== 'mybk') {
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById('sr-' + i);
      el.classList.remove('active','done');
      if (i < n)  el.classList.add('done');
      if (i === n) el.classList.add('active');
    }
  }

  if (page) page.scrollTop = 0;
  if (n === 4) buildSummary();
}

function goMyBookings() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  ['bar-1','bar-2','bar-3'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.style.display = 'none';
  });
  document.getElementById('page-mybk').classList.add('active');
  document.getElementById('step-rail').style.display = 'none';
  document.getElementById('page-mybk').scrollTop = 0;
  loadMyBookings();
}

function buildSummary() {
  const { service:svc, staff, date, timeSlot:slot } = state;
  if (!svc||!staff||!date||!slot) return;
  const dateStr = `วัน${TH_DAYS_FULL[date.getDay()]}ที่ ${date.getDate()} ${TH_MONTHS[date.getMonth()]} ${date.getFullYear()+543}`;
  document.getElementById('sum-service').textContent  = svc.name;
  document.getElementById('sum-staff').textContent    = staff.id==='stf_any' ? 'ระบบจัดให้อัตโนมัติ' : staff.name;
  document.getElementById('sum-date').textContent     = dateStr;
  document.getElementById('sum-time').textContent     = `${slot.time} – ${slot.endTime||'?'} น.`;
  document.getElementById('sum-duration').textContent = svc.duration + ' นาที';
  document.getElementById('sum-price').textContent    = svc.price;
  if (state.phone) document.getElementById('phone-input').value = state.phone;
  if (state.memberData) {
    const m = state.memberData;
    document.getElementById('member-info-box').style.display   = 'flex';
    document.getElementById('member-info-name').textContent    = m.name || state.lineProfile?.displayName || '';
    document.getElementById('member-info-balance').textContent = m.balance && m.balance!=='-'
      ? `ยอดเงิน: ฿${Number(m.balance).toLocaleString()}`
      : 'ยังไม่ได้เติมเงินค่ะ';
    document.getElementById('member-info-code').textContent    = m.memberCode ? `รหัสสมาชิก: ${m.memberCode}` : '';
  }
}

/* ══ SUBMIT ════════════════════════════════════════════ */
async function submitBooking() {
  const phone = document.getElementById('phone-input').value.replace(/\D/g,'');
  const note  = document.getElementById('note-input').value;
  const btn   = document.getElementById('confirm-btn');
  if (!phone || phone.length < 9) {
    document.getElementById('phone-input').classList.add('error');
    showToast('⚠️ กรุณากรอกเบอร์โทรให้ถูกต้องค่ะ');
    return;
  }
  document.getElementById('phone-input').classList.remove('error');
  state.phone  = phone;
  btn.disabled = true;
  btn.textContent = '⏳ กำลังจองนัด...';
  const date    = state.date;
  const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const result  = await apiCall('bk_createBooking', {
    line_user_id:  state.lineUserId,
    line_name:     state.lineProfile?.displayName || '-',
    service_id:    state.service.id,
    staff_id:      state.staff.id,
    staff_name:    state.staff.name,
    booking_date:  dateStr,
    booking_start: state.timeSlot.time,
    phone, note
  });
  btn.disabled    = false;
  btn.textContent = '💕 ยืนยันการจองนัด';
  if (!result.ok) {
    showToast('❌ ' + (result.error || 'เกิดข้อผิดพลาด'));
    if (result.slotFull) { selectDate(date.getFullYear(), date.getMonth(), date.getDate()); goStep(3); }
    return;
  }
  const dd = `${date.getDate()} ${TH_MONTHS[date.getMonth()]} ${date.getFullYear()+543}`;
  document.getElementById('success-detail').innerHTML = `
    <div class="success-card-row"><span class="sc-label">บริการ</span><span class="sc-value">${state.service.name}</span></div>
    <div class="success-card-row"><span class="sc-label">ช่าง</span><span class="sc-value">${result.staff_name||state.staff.name}</span></div>
    <div class="success-card-row"><span class="sc-label">วันที่</span><span class="sc-value">${dd}</span></div>
    <div class="success-card-row"><span class="sc-label">เวลา</span><span class="sc-value">${state.timeSlot.time} – ${result.end_time||state.timeSlot.endTime} น.</span></div>
    <div class="success-card-row"><span class="sc-label">โทรศัพท์</span><span class="sc-value">${phone}</span></div>`;
  document.getElementById('success-bk-id').textContent = 'Booking ID: ' + result.booking_id;
  document.getElementById('success-screen').classList.add('show');
}

function closeWindow() {
  try { liff?.closeWindow?.(); } catch(e) { window.close(); }
}

/* ══ MY BOOKINGS ════════════════════════════════════════ */
async function loadMyBookings() {
  const list = document.getElementById('mybk-list');
  list.innerHTML = `
    <div class="shimmer-box" style="height:168px;margin-bottom:12px"></div>
    <div class="shimmer-box" style="height:168px;animation-delay:0.15s"></div>`;
  if (!state.lineUserId || state.lineUserId === 'preview') {
    list.innerHTML = '<div class="empty-state"><span class="empty-icon">👋</span>กรุณาล็อกอินด้วย LINE ก่อนค่ะ</div>';
    return;
  }
  const result = await apiCall('bk_getMyBookings', { line_user_id: state.lineUserId });
  state.myBookings = result.bookings || [];
  renderMyBookings();
}

function filterBookings(status, btn) {
  state.bookingFilter = status;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');
  renderMyBookings();
}

function renderMyBookings() {
  const list   = document.getElementById('mybk-list');
  const filter = state.bookingFilter;
  const items  = filter === 'all' ? state.myBookings : state.myBookings.filter(b => b.status === filter);
  if (!items.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span>${filter==='all'?'ยังไม่มีการจองค่ะ':'ไม่พบการจองในหมวดนี้'}</div>`;
    return;
  }
  const statusLabel = { pending:'รอยืนยัน', confirmed:'ยืนยันแล้ว', cancelled:'ยกเลิกแล้ว', completed:'เสร็จสิ้น' };
  const statusCls   = { pending:'bk-pending', confirmed:'bk-confirmed', cancelled:'bk-cancelled', completed:'bk-completed' };
  list.innerHTML = items.map(b => `
    <div class="booking-item">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div class="bk-service">${b.service_name}</div>
        <span class="bk-status ${statusCls[b.status]||'bk-pending'}">${statusLabel[b.status]||b.status}</span>
      </div>
      <div class="bk-details">✂️ ${b.staff_name} &nbsp;·&nbsp; 📆 ${b.date}<br>⏰ ${b.start} – ${b.end} น. (${b.duration} นาที)${b.note?`<br>📝 ${b.note}`:''}</div>
      ${(b.status==='pending'||b.status==='confirmed')?`<button class="bk-cancel-btn" onclick="cancelBooking('${b.id}',this)">ยกเลิกการจองนี้</button>`:''}
    </div>`).join('');
}

async function cancelBooking(bookingId, btn) {
  if (!confirm('ยืนยันการยกเลิกการจองนี้?')) return;
  btn.disabled = true; btn.textContent = '⏳ กำลังยกเลิก...';
  const result = await apiCall('bk_cancelBooking', { booking_id: bookingId, line_user_id: state.lineUserId });
  if (result.ok) { showToast('✅ ยกเลิกแล้วค่ะ'); await loadMyBookings(); }
  else { showToast('❌ ' + (result.error||'เกิดข้อผิดพลาด')); btn.disabled = false; btn.textContent = 'ยกเลิกการจองนี้'; }
}

/* ══ TOAST ════════════════════════════════════════════ */
let _tt;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(_tt); _tt = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ══ BOOT ════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
  document.getElementById('bar-1').style.display = 'flex';
  initApp().catch(e => {
    console.error('App init error:', e);
    showFatalError('ไม่สามารถเริ่มต้นแอปได้ ลองรีเซ็ตหน้าเว็บค่ะ');
  });
});
</script>
</body>
</html>