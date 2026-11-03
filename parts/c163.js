/* ===================== GLX-C163 (v1.0.29): Brightness slider, Settings in tabs (Audio / Video / Controls / World), smaller HUD at the bottom with the item name above the hotbar, hazard creeper egg ===================== */
(function c163() {
  const U = window.__c163 = {tab: 'world', err: null, base: 0.28, exp: 1.05};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e); };
  if (typeof SET.bright !== 'number') SET.bright = 1;
  const B = () => Math.max(0.5, Math.min(2, Number(SET.bright) || 1));
  // ---------- brightness: lifts the minimum light (overworld, caves, Hell) and the exposure; 100% = exactly as before ----------
  function hookMin() { const L = window.__lminU; if (!L || L.__c163) return !!L; let base = typeof L.value === 'number' ? L.value : 0.28;
    try { Object.defineProperty(L, 'value', {configurable: true, enumerable: true, get() { const b = B(); if (b === 1) return base; const floor = (typeof DIM !== 'undefined' && DIM.cur === 'hell') ? 0.3 : 0.15;
        return b > 1 ? Math.min(0.78, base + (b - 1) * 0.24) : Math.max(Math.min(base, floor), base - (1 - b) * 0.24); }, set(v) { base = v; U.base = v; }}); L.__c163 = true; } catch (e) { ERR(e); } return true; }
  if (!hookMin()) { const iv = setInterval(() => { if (hookMin()) clearInterval(iv); }, 500); }
  let lastSet = -1, expBase = 1.05;
  const us = updateSky; updateSky = function () { const r = us.apply(this, arguments);
    try { const e = renderer.toneMappingExposure; if (Math.abs(e - lastSet) > 1e-6) expBase = e; U.exp = expBase; const v = expBase * (1 + (B() - 1) * 0.35); renderer.toneMappingExposure = v; lastSet = v; } catch (e) { ERR(e); }
    return r; };
  // ---------- the creeper egg wears the new hazard coat ----------
  try { const id = IT.EGG_CREEPER; if (id) { ICONS[id] = drawIcon(g => { g.save(); g.beginPath(); g.ellipse(0, 2, 18, 24, 0, 0, 7); g.clip(); g.fillStyle = '#e8b818'; g.fillRect(-20, -24, 40, 52);
      g.fillStyle = '#c42a22'; for (let j = 0; j < 7; j++) { g.beginPath(); g.arc(Math.sin(j * 2.4) * 11, Math.cos(j * 1.7) * 15 - 2, 2.5 + (j % 3), 0, 7); g.fill(); }
      g.fillStyle = '#2a2a2a'; g.fillRect(-20, 9, 40, 9); for (let x = -26; x < 22; x += 6) { g.fillStyle = '#f2f2ec'; g.beginPath(); g.moveTo(x, 17); g.lineTo(x + 3, 17); g.lineTo(x + 8, 10); g.lineTo(x + 5, 10); g.fill(); g.fillStyle = '#c42a22'; g.beginPath(); g.moveTo(x + 3, 17); g.lineTo(x + 6, 17); g.lineTo(x + 11, 10); g.lineTo(x + 8, 10); g.fill(); }
      g.restore(); g.fillStyle = '#8d959c'; g.strokeStyle = '#4a5056'; g.lineWidth = 1.5; g.beginPath(); g.rect(1, -12, 11, 11); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,40,20,.45)'; g.beginPath(); g.arc(6.5, -6.5, 6.5, 0, 7); g.fill(); g.fillStyle = '#ff2a1a'; g.beginPath(); g.arc(6.5, -6.5, 3.4, 0, 7); g.fill(); g.fillStyle = '#ffb090'; g.fillRect(4.8, -8.4, 1.6, 1.6);
      g.fillStyle = '#1a0d0a'; g.fillRect(-9, -11, 5, 5); g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(-7, -14, 4, 6, -0.4, 0, 7); g.fill(); }); } } catch (e) { ERR(e); }
  // ---------- HUD: a little smaller, hugging the bottom; the item name fades in just above the hotbar ----------
  try { const st = document.createElement('style'); st.id = 'c163css';
    st.textContent = ':root{--slot:min(42px,calc((100vw - 72px) / 10)) !important}#hotbar{bottom:calc(3px + var(--sab)) !important;padding:4px !important;gap:3px !important}#statBar{--pip:12px !important}' +
      '#itemName,body.touch #itemName,body:not(.touch) #itemName{top:auto !important;bottom:calc(var(--slot) + 22px + var(--sab) + var(--statH,0px)) !important;transition:opacity .6s ease !important;font-size:15px !important;pointer-events:none}' +
      '#setTabs{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 8px;position:sticky;top:-2px;z-index:2;background:inherit;padding:4px 0}#setTabs button{flex:1 1 0;min-width:72px;min-height:44px;font-weight:700;background:rgba(255,255,255,.08)!important;color:#eee!important;border:1px solid rgba(255,255,255,.22)!important;border-radius:10px}#setTabs button.on{background:#f2c440!important;color:#151515!important;border-color:#f2c440!important}' +
      '#setTabs button.focus{outline:3px solid #fff;outline-offset:2px}#setHold{display:none!important}.c163pane{display:block}';
    document.head.appendChild(st); } catch (e) { ERR(e); }
  try { const sn = showItemName; showItemName = function () { const r = sn.apply(this, arguments); try { clearTimeout(nameT); const el = $('itemName'); nameT = setTimeout(() => el.classList.remove('on'), 2000); } catch (_) {} return r; }; } catch (e) { ERR(e); }
  // ---------- Brightness row ----------
  function brightRow() { if (document.getElementById('brVol')) return; const row = document.createElement('label'); row.className = 'set'; row.dataset.k = 'bright';
    row.innerHTML = '<span>Brightness<b id="brV"></b></span><input type="range" id="brVol" min="0.5" max="2" step="0.05" data-testid="settings-brightness">';
    const inp = row.querySelector('input'), lab = row.querySelector('#brV'), sync = () => { inp.value = B(); lab.textContent = Math.round(B() * 100) + '%'; };
    inp.addEventListener('input', () => { SET.bright = Number(inp.value); sync(); saveSet(); try { updateSky(0); } catch (_) {} }); sync(); U.syncB = sync; return row; }
  // ---------- tabs: rows are sorted into four panes; only the open pane sits in the menu (so the controller and Tab key only walk what you see) ----------
  const TABS = [['world', 'Game'], ['video', 'Graphics'], ['audio', 'Audio'], ['controls', 'Controls'], ['info', 'Info']];
  const hold = document.createElement('div'); hold.id = 'setHold'; document.body.appendChild(hold);
  const panes = {}; for (const [k] of TABS) { const d = document.createElement('div'); d.className = 'c163pane'; d.dataset.tab = k; panes[k] = d; hold.appendChild(d); }
  const txt = e => ((e.querySelector && e.querySelector('span') ? e.querySelector('span').textContent : e.textContent) || '').toLowerCase();
  function kind(e) { if (/^(resetWorldBtn|teleportBuildsBtn|resetTerrainBtn|restoreBackupBtn|restoreTerrainBtn)$/.test(e.id)) return 'world'; if (/^(pnPauseBtn|pDlBtn|pauseHint)$/.test(e.id)) return 'info'; const k = e.dataset && e.dataset.k, t = txt(e);
    if (/^(sfx|mob|music)$/.test(k || '') || /volume|music|sound|voices/.test(t)) return 'audio';
    if (k === 'bright' || /shader|bright|render|graphics|performance|hd mob|field of view|fov|head bob|credit/.test(t) || e.id === 'hdCredit' || k === 'fov') return 'video';
    if (/^(sens|pad)$/.test(k || '') || /sensitiv|immersive|touch|controller|invert|look/.test(t)) return 'controls';
    if (/weather|time of day|freeze|friendly|reset|difficulty|world|keep inventory|peaceful/.test(t)) return 'world';
    return null; }
  let bar = null;
  function build() { const panel = document.querySelector('#pause .panel'); if (!panel) return false;
    if (!bar) { const head = [...panel.children].find(e => e.tagName === 'DIV' && /^\s*settings\s*$/i.test(e.textContent || ''));
      bar = document.createElement('div'); bar.id = 'setTabs'; bar.innerHTML = TABS.map(([k, n]) => '<button type="button" data-tab="' + k + '" data-testid="settings-tab-' + k + '">' + n + '</button>').join('');
      if (head) head.after(bar); else { const h = panel.querySelector('#pauseHint'); if (h) h.before(bar); else panel.appendChild(bar); }
      bar.querySelectorAll('button').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); show(b.dataset.tab, true); }));
      const sfx = document.querySelector('label.set[data-k="sfx"]'); if (sfx) { const br = brightRow(); if (br) panes.video.prepend(br); } }
    // sweep: every settings row in the menu (and the weather/time rows and Reset world in the button block) goes to its pane
    const cand = [...panel.querySelectorAll(':scope > label.set, :scope > div.set, :scope > #hdCredit, :scope .btns > div.set, #resetWorldBtn, #teleportBuildsBtn, #resetTerrainBtn, #restoreBackupBtn, #restoreTerrainBtn, #pnPauseBtn, #pDlBtn, #pauseHint')];
    for (const e of cand) { if (e.closest('.c163pane')) continue; const k = kind(e); if (k) panes[k].appendChild(e); }
    return true; }
  function show(k, focus) { if (!build()) return; U.tab = k; const panel = document.querySelector('#pause .panel');
    for (const [t] of TABS) { const p = panes[t]; if (t === k) { if (p.parentNode !== panel) bar.after(p); } else if (p.parentNode !== hold) hold.appendChild(p); }
    bar.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.tab === k));
    if (focus) try { const items = pauseItems(), b = bar.querySelector('button[data-tab="' + k + '"]'); const i = items.indexOf(b); if (i >= 0) { pFocus = i; refocusPause(); } } catch (_) {} }
  U.show = show; U.kind = kind; U.panes = panes;
  try { const sp = setPause; setPause = function (on) { const r = sp.apply(this, arguments); if (on) try { show(U.tab); if (U.syncB) U.syncB(); } catch (e) { ERR(e); } return r; }; } catch (e) { ERR(e); }
  try { const ots = openTitleSettings; openTitleSettings = function () { try { show(U.tab); } catch (e) { ERR(e); } return ots.apply(this, arguments); }; } catch (e) { ERR(e); }
  setTimeout(() => { try { show(U.tab); } catch (e) { ERR(e); } }, 1500);
  // controller: LB / RB flip through the tabs while the menu is open
  try { const pp = padPause; let lb = false, rb = false; padPause = function () { try { const gp = navigator.getGamepads && [...navigator.getGamepads()].find(Boolean); if (gp) { const L = gp.buttons[4] && gp.buttons[4].pressed, R = gp.buttons[5] && gp.buttons[5].pressed, i = TABS.findIndex(t => t[0] === U.tab);
        if (L && !lb) show(TABS[(i + 3) % 4][0], true); if (R && !rb) show(TABS[(i + 1) % 4][0], true); lb = L; rb = R; } } catch (_) {} return pp.apply(this, arguments); }; } catch (e) { ERR(e); }
})();
