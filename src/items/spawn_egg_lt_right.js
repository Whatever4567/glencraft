/* ===================== GLX-C144 (v1.0.21): ONE spawn egg - LT / right-click / tap Place opens a list of every mob (Enabled = spawns in the world, Disabled = egg only); pick one and it hatches where you aim ===================== */
(function c144() {
  const U = window.__c144 = {err: null, spawned: 0, open: false, last: null};
  const D = window.__c143 || {DIS: new Set()}, C = window.__c123 || {DEF: {}};
  let UNI = 790; while (NAMES[UNI] !== undefined || ICONS[UNI]) UNI++; IT.EGG_ANY = UNI; U.id = UNI;
  NAMES[UNI] = 'Spawn egg'; try { if (typeof DESC !== 'undefined' && DESC) DESC[UNI] = 'LT / right-click / tap Place: pick any mob from the list'; } catch (_) {}
  ICONS[UNI] = drawIcon(g => { const gr = g.createLinearGradient(-18, -24, 18, 26); gr.addColorStop(0, '#2a2418'); gr.addColorStop(1, '#0c0a08'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 2, 18, 24, 0, 0, 7); g.fill();
    g.strokeStyle = '#e0b84a'; g.lineWidth = 2.5; g.stroke(); g.fillStyle = '#e0b84a'; for (let j = 0; j < 9; j++) { g.beginPath(); g.arc(Math.sin(j * 2.4) * 10, Math.cos(j * 1.7) * 14 + 2, 2 + (j % 3), 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,240,200,.25)'; g.beginPath(); g.ellipse(-7, -8, 5, 8, -0.4, 0, 7); g.fill(); });
  const isEgg = i => i !== UNI && typeof NAMES[i] === 'string' && NAMES[i].startsWith('Spawn egg: ');
  const KEY = {}; for (const k in IT) if (k.startsWith('EGG_') && k !== 'EGG_ANY') KEY[IT[k]] = k.slice(4).toLowerCase();
  const HIDE = new Set(['nm20', 'nm29', 'nm25', 'nm18', 'nmdrop']); const OLD_SPIDER = IT.EGG_SPIDER;   // the old spider egg is the night spider's twin
  try { if (IT.EGG_NM10) NAMES[IT.EGG_NM10] = 'Spawn egg: Ghost'; if (IT.EGG_GHOST) NAMES[IT.EGG_GHOST] = 'Spawn egg: Nether ghost'; } catch (_) {}
  const nice = id => { const k = KEY[id]; if (k && C.DEF[k]) return C.DEF[k].name; const n = NAMES[id].slice(11); return n.charAt(0).toUpperCase() + n.slice(1); };
  function entries() { const all = Object.keys(NAMES).map(Number).filter(isEgg).filter(i => !HIDE.has(KEY[i]) && i !== OLD_SPIDER);
    const L = all.map(id => ({id, key: KEY[id] || ('id' + id), name: nice(id), off: D.DIS.has(KEY[id])})).sort((p, q) => p.name.toLowerCase().localeCompare(q.name.toLowerCase()));
    return {on: L.filter(e => !e.off), off: L.filter(e => e.off)}; }
  U.entries = entries;
  // ---- one egg in the inventories ----
  const strip = A => { if (!Array.isArray(A)) return; let at = A.findIndex(isEgg); const had = at >= 0 || A.includes(UNI); const B = A.filter(i => !isEgg(i) && i !== UNI); if (had) B.splice(at >= 0 ? Math.min(at, B.length) : B.length, 0, UNI); A.length = 0; A.push(...B); };
  strip(ORDER); try { strip(CREATIVE_ALL); } catch (_) {}
  function convert() { try { if (!started) return; let n = 0; for (const k in inv) { const i = +k; if (isEgg(i) && inv[i] > 0) { n += inv[i]; inv[i] = 0; } } if (n) inv[UNI] = (inv[UNI] || 0) + n;
      if (MODE && Array.isArray(MODE.hotbar)) { let put = MODE.hotbar.includes(UNI); for (let j = 0; j < MODE.hotbar.length; j++) if (isEgg(MODE.hotbar[j])) { if (!put) { MODE.hotbar[j] = UNI; put = true; } else MODE.hotbar[j] = UNI; } }
      if (isEgg(selId)) { selId = UNI; n = 1; } if (n) { try { renderHotbar(); } catch (_) {} } } catch (e) { U.err = 'conv ' + e; } }
  setInterval(convert, 1000); U.convert = convert;
  // ---- the list ----
  let ui = null, focus = 0;
  const css = 'position:fixed;inset:0;z-index:67;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5)';
  function build() { ui = document.createElement('div'); ui.id = 'eggUI'; ui.className = 'hidden'; ui.dataset.testid = 'egg-list'; ui.style.cssText = css; document.body.appendChild(ui);
    const st = document.createElement('style'); st.textContent = '#eggUI.hidden{display:none!important}#eggUI .ep{background:rgba(8,7,5,.96);border:2px solid #c9a23a;border-radius:12px;color:#f0d890;font:15px system-ui,sans-serif;width:min(760px,94vw);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 0 0 4px rgba(0,0,0,.6),0 10px 40px #000}'
      + '#eggUI h3{margin:0;padding:12px 16px 6px;color:#ffd866;font-size:20px;letter-spacing:.5px}#eggUI .sub{padding:0 16px 8px;font-size:12px;opacity:.75}#eggUI .sc{overflow:auto;padding:0 12px 10px;-webkit-overflow-scrolling:touch}'
      + '#eggUI .sec{margin:10px 4px 6px;padding-bottom:3px;border-bottom:1px solid #6a5420;color:#e8c050;font-weight:700;text-transform:uppercase;font-size:13px;letter-spacing:1px}#eggUI .sec.off{color:#b08a50}'
      + '#eggUI .gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px}#eggUI button{display:flex;align-items:center;gap:8px;background:#15120c;border:1px solid #4a3c18;border-radius:8px;color:#f4e2a8;padding:6px 8px;font:inherit;text-align:left;cursor:pointer;min-height:40px}'
      + '#eggUI button img{width:28px;height:28px;image-rendering:auto;flex:none}#eggUI button.off{color:#c8b48a;background:#100e0a}#eggUI button.focus,#eggUI button:hover{border-color:#ffd866;background:#2a2210;box-shadow:0 0 0 2px #ffd86655 inset}'
      + '#eggUI .ft{display:flex;gap:8px;padding:8px 12px 12px;border-top:1px solid #3a2e12}#eggUI .ft button{justify-content:center;flex:1}#eggUI .tag{margin-left:auto;font-size:11px;opacity:.65}@media (max-width:520px){#eggUI .gr{grid-template-columns:1fr 1fr}#eggUI .ep{font-size:14px}}';
    document.head.appendChild(st);
    ui.addEventListener('pointerdown', e => e.stopPropagation()); ui.addEventListener('click', e => { if (e.target === ui) close(); }); }
  const items = () => ui ? [...ui.querySelectorAll('button')] : [];
  function render() { const E = entries(); const row = e => '<button data-id="' + e.id + '" data-testid="egg-pick-' + e.key + '" class="' + (e.off ? 'off' : '') + '"><img src="' + ICONS[e.id] + '" alt="">' + e.name + (U.last === e.id ? '<span class="tag">last</span>' : '') + '</button>';
    ui.innerHTML = '<div class="ep"><h3>Spawn egg</h3><div class="sub">Pick a mob - it hatches where you are aiming. ' + (MODE && MODE.infinite ? 'Creative: endless eggs.' : 'Uses one egg.') + '</div><div class="sc">'
      + '<div class="sec">Enabled - found in the world (' + E.on.length + ')</div><div class="gr">' + E.on.map(row).join('') + '</div>'
      + '<div class="sec off">Disabled - egg only (' + E.off.length + ')</div><div class="gr">' + E.off.map(row).join('') + '</div></div>'
      + '<div class="ft"><button data-x="1" data-testid="egg-close">Close</button></div></div>';
    items().forEach(b => b.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); if (b.dataset.id) pick(+b.dataset.id); else close(); }); refocus(); }
  function refocus() { const it = items(); if (!it.length) return; focus = Math.max(0, Math.min(focus, it.length - 1)); it.forEach((b, i) => b.classList.toggle('focus', i === focus)); try { it[focus].scrollIntoView({block: 'nearest'}); } catch (_) {} }
  function open() { if (!ui) build(); U.open = true; menuOpen = true; attackMouse = attackPad = attackTouch = false; ui.classList.remove('hidden'); render(); const it = items(); const li = it.findIndex(b => +b.dataset.id === U.last); focus = li >= 0 ? li : 0; refocus();
    try { sfx('pop', .4); } catch (_) {} if (document.pointerLockElement) document.exitPointerLock(); }
  function hide() { U.open = false; if (ui) ui.classList.add('hidden'); }
  function close() { if (!U.open) return; hide(); openMenu(false); }
  U.openList = open; U.close = close;
  // pick: the chosen egg is used for real (same rules as its old egg), then the one egg is back in your hand
  function pick(id) { hide(); openMenu(false); U.last = id; spawnWith(id); }
  function spawnWith(id) { if (!(MODE.infinite || cnt(UNI) > 0)) return null; const sv = inv[id], sel = selId, n0 = mobs.length; selId = id; inv[id] = 1;
    try { ui0.call(this); } catch (e) { U.err = 'spawn ' + e; } finally { selId = sel; if (sv === undefined) delete inv[id]; else inv[id] = sv; }
    if (!MODE.infinite) { useUp(UNI); if (!(cnt(UNI) > 0)) { try { selId = sel; } catch (_) {} } } U.spawned++; U.lastN = mobs.length - n0; try { renderHotbar(); } catch (_) {} return mobs[mobs.length - 1]; }
  U.spawnWith = spawnWith;
  const ui0 = useItem; useItem = function () { if (selId === UNI) { if (U.open || menuOpen || paused || dead || !started) return; if (!(MODE.infinite || cnt(UNI) > 0)) return; open(); return; } return ui0.apply(this, arguments); };
  const cp = closePanels; closePanels = function () { hide(); return cp.apply(this, arguments); };
  // controller: D-pad / stick moves by geometry, A picks, B closes
  function nav(dx, dy) { const it = items(); const a = it[focus]; if (!a) return; const r0 = a.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2; let best = -1, bd = 1e9;
    it.forEach((b, i) => { if (i === focus) return; const r = b.getBoundingClientRect(), x = r.left + r.width / 2 - cx, y = r.top + r.height / 2 - cy; if (dx && Math.sign(x) !== dx) return; if (dy && Math.sign(y) !== dy) return; if (dx && Math.abs(y) > r0.height * 0.6) return;
      const d = dx ? Math.abs(x) + Math.abs(y) * 3 : Math.abs(y) + Math.abs(x) * 0.6; if (d < bd) { bd = d; best = i; } });
    if (best < 0 && dx) best = Math.max(0, Math.min(it.length - 1, focus + dx)); if (best >= 0) { focus = best; refocus(); } }
  let stickT = 0;
  const mpi = menuPadInput; menuPadInput = function (E, axes) { if (!U.open) return mpi.apply(this, arguments);
    if (E[1]) { close(); return; } if (E[12]) nav(0, -1); if (E[13]) nav(0, 1); if (E[14]) nav(-1, 0); if (E[15]) nav(1, 0);
    try { const ax = axes && axes[0] || 0, ay = axes && axes[1] || 0, now = performance.now(); if ((Math.abs(ax) > 0.6 || Math.abs(ay) > 0.6) && now > stickT) { stickT = now + 180; if (Math.abs(ax) > Math.abs(ay)) nav(Math.sign(ax), 0); else nav(0, Math.sign(ay)); } } catch (_) {}
    if (E[0]) { const b = items()[focus]; if (b) b.click(); } };
  addEventListener('keydown', e => { if (!U.open) return; const k = e.key;
    if (k === 'Escape' || k === 'Backspace' || e.code === 'KeyE') close(); else if (k === 'ArrowDown') nav(0, 1); else if (k === 'ArrowUp') nav(0, -1); else if (k === 'ArrowLeft') nav(-1, 0); else if (k === 'ArrowRight') nav(1, 0);
    else if (k === 'Enter' || k === ' ') { const b = items()[focus]; if (b) b.click(); } else return; e.preventDefault(); e.stopImmediatePropagation(); }, true);
})();
