/* GLX-C311 (v1.1.22): touchscreen pack - inventory drag and tap-tap swap onto the hotbar and the armour / jetpack slots (long press
   equips), a floating joystick with a dead zone and smooth response, bigger and better spaced buttons, a touch look multiplier on top
   of Sensitivity, two-finger move + look + tap at once, Minecraft style touch (tap = place / use / hit, hold = mine with a progress
   ring at the finger, aimed at the finger, drag = look), and a big Close X plus tap-outside-to-close on every menu. Controller and
   mouse are unchanged: everything here only runs for touch pointers. */
(() => {
  const U = window.__c311 = {err: null, taps: 0, holds: 0, looks: 0, drags: 0, closes: 0, eq: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const isT = e => e.pointerType === 'touch' || e.pointerType === 'pen';
  const $$ = id => document.getElementById(id);
  // ---------- styles: bigger hit areas, spacing, no scroll / zoom fights ----------
  try { const st = document.createElement('style'); st.textContent =
    'body.touch #touch,body.touch #lookZone,body.touch #stickZone{touch-action:none}' +
    'body.touch #acts{gap:12px!important}body.touch .tbtn{min-width:64px;min-height:64px;margin:4px!important;font-size:13px}' +
    'body.touch #invGrid,body.touch #invHot,body.touch #chestUI,body.touch #furnUI,body.touch #craft{touch-action:none;overscroll-behavior:contain}' +
    'body.touch .gslot{min-width:54px;min-height:54px}body.touch [data-testid^="armour-slot-"]{min-height:54px}' +
    '#c311x{position:fixed;top:calc(10px + env(safe-area-inset-top,0px));right:12px;z-index:10050;width:58px;height:58px;border-radius:50%;border:3px solid #fff;background:rgba(170,40,40,.92);color:#fff;font:bold 30px/50px sans-serif;text-align:center;display:none;touch-action:none}' +
    '#c311ring{position:fixed;z-index:10040;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;pointer-events:none;display:none}' +
    '#c311ghost{position:fixed;z-index:10060;width:48px;height:48px;margin:-24px 0 0 -24px;pointer-events:none;display:none;opacity:.85}';
    document.head.appendChild(st); } catch (e) { ERR('css', e); }
  // ---------- 6) close X on every menu + tap outside ----------
  const X = document.createElement('div'); X.id = 'c311x'; X.textContent = '\u2715'; X.setAttribute('data-testid', 'touch-close'); document.body.appendChild(X);
  const PANELS = ['chestUI', 'furnUI', 'craft', 'pause', 'notesUI', 'arcMenu'];
  const vis = el => el && !el.classList.contains('hidden') && el.offsetParent !== null || (el && getComputedStyle(el).position === 'fixed' && getComputedStyle(el).display !== 'none' && !el.classList.contains('hidden'));
  const openPanel = () => { for (const id of PANELS) { const el = $$(id); if (el && vis(el)) return el; } return (typeof menuOpen !== 'undefined' && menuOpen) || (typeof paused !== 'undefined' && paused) ? document.body : null; };
  function closeTop() { U.closes++; const ev = o => new KeyboardEvent('keydown', Object.assign({key: 'Escape', code: 'Escape', bubbles: true, cancelable: true}, o));
    try { if (typeof started !== 'undefined' && started && typeof menuOpen !== 'undefined' && menuOpen) { openMenu(false); return; } document.dispatchEvent(ev({})); } catch (e) { ERR('close', e); } }
  U.closeTop = closeTop;
  X.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); closeTop(); });
  document.addEventListener('pointerdown', e => { if (!isT(e) || e.target === X) return; const p = openPanel(); if (!p || p === document.body) return;
    // the dark backdrop around a panel: the panel element itself (not its contents), or the game view behind it
    const t = e.target; if (t === p || t.id === 'lookZone' || t.tagName === 'CANVAS') { e.stopPropagation(); e.preventDefault(); closeTop(); } }, true);
  let touchSeen = false; addEventListener('pointerdown', e => { if (isT(e)) touchSeen = true; }, true);
  (function xl() { requestAnimationFrame(xl); try { const on = (touchSeen || (typeof touchMode !== 'undefined' && touchMode)) && !!openPanel() && (typeof dead === 'undefined' || !dead); X.style.display = on ? 'block' : 'none'; } catch (_) {} })();
  // ---------- 1, 2) inventory: drag with pointer events, tap-tap onto armour slots, long press equips ----------
  const ghost = document.createElement('div'); ghost.id = 'c311ghost'; document.body.appendChild(ghost);
  const bagId = el => { const t = el && el.dataset && el.dataset.testid || ''; try { if (t.startsWith('bag-item-')) return bagItems()[+t.slice(9)]; if (t.startsWith('bag-hotbar-')) return MODE.hotbar[+t.slice(11)]; } catch (_) {} return 0; };
  function equip(id) { try { if (id && ARMOUR[id] && cnt(id)) { equipArmour(id); U.eq++; if (typeof cursor !== 'undefined' && cursor) { cursor = null; showCursor(); } renderBag(); return true; } } catch (e) { ERR('eq', e); } return false; }
  function toHot(i, id) { const j = MODE.hotbar.indexOf(id), old = MODE.hotbar[i]; if (j >= 0) MODE.hotbar[j] = old; MODE.hotbar[i] = id; selId = id; try { sfx('pop', .35); } catch (_) {} try { if (typeof cursor !== 'undefined' && cursor) { cursor = null; showCursor(); } } catch (_) {} renderBag(); try { renderHotbar(); } catch (_) {} }
  // a held cursor item tapped onto an armour / jetpack slot is equipped (the slot click would only unequip)
  document.addEventListener('click', e => { const s = e.target.closest && e.target.closest('[data-testid^="armour-slot-"]'); if (!s) return; try { if (typeof cursor !== 'undefined' && cursor && ARMOUR[cursor.id]) { const id = cursor.id; returnCursor(); if (equip(id)) { e.stopPropagation(); e.preventDefault(); } } } catch (er) { ERR('aslot', er); } }, true);
  let dg = null;
  document.addEventListener('pointerdown', e => { if (!isT(e)) return; const b = e.target.closest && e.target.closest('[data-testid^="bag-item-"],[data-testid^="bag-hotbar-"]'); if (!b) return; const id = bagId(b); if (!id) return;
    dg = {id, b, x: e.clientX, y: e.clientY, pid: e.pointerId, on: false, lp: setTimeout(() => { if (dg && !dg.on && ARMOUR[dg.id]) { dg.done = equip(dg.id); } }, 520)}; }, true);
  document.addEventListener('pointermove', e => { if (!dg || e.pointerId !== dg.pid) return; if (!dg.on && Math.hypot(e.clientX - dg.x, e.clientY - dg.y) > 10) { dg.on = true; clearTimeout(dg.lp); ghost.innerHTML = dg.b.innerHTML; ghost.style.display = 'block'; }
    if (dg.on) { e.preventDefault(); ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; } }, {capture: true, passive: false});
  const endDg = e => { if (!dg || e.pointerId !== dg.pid) return; const d = dg; dg = null; clearTimeout(d.lp); ghost.style.display = 'none'; if (!d.on && !d.done) return;
    e.preventDefault(); e.stopPropagation(); d.b.__c311skip = performance.now(); if (d.done) return; const t = document.elementFromPoint(e.clientX, e.clientY), h = t && t.closest && t.closest('[data-testid^="bag-hotbar-"]'), a = t && t.closest && t.closest('[data-testid^="armour-slot-"]');
    if (h) { toHot(+h.dataset.testid.slice(11), d.id); U.drags++; } else if (a) equip(d.id); };
  document.addEventListener('pointerup', endDg, true); document.addEventListener('pointercancel', e => { if (dg && e.pointerId === dg.pid) { clearTimeout(dg.lp); dg = null; ghost.style.display = 'none'; } }, true);
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-testid^="bag-"]'); if (b && b.__c311skip && performance.now() - b.__c311skip < 500) { e.stopPropagation(); e.preventDefault(); } }, true);
  // ---------- 3) joystick: dead zone + smooth response (runs after the base handler) ----------
  try { const stick = $$('stickZone'); let sx = 0, sy = 0, sid = null;
    stick.addEventListener('pointerdown', e => { sid = e.pointerId; sx = e.clientX; sy = e.clientY; });
    stick.addEventListener('pointermove', e => { if (e.pointerId !== sid) return; const R = 56; let dx = (e.clientX - sx) / R, dy = (e.clientY - sy) / R; const r = Math.hypot(dx, dy);
      if (r < 0.14) { tjx = 0; tjy = 0; return; } const k = Math.pow(Math.min(1, (r - 0.14) / 0.86), 1.35) / r; tjx = dx * k; tjy = dy * k; });
    const end = e => { if (e.pointerId === sid) sid = null; }; stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end); } catch (e) { ERR('stick', e); }
  // ---------- 4, 5) touch look / tap / hold on the game view ----------
  const ring = document.createElement('div'); ring.id = 'c311ring'; document.body.appendChild(ring);
  const tl = () => (typeof SET !== 'undefined' && SET.tlook) || 1;
  const fingers = new Map(); let lookP = null, aim = null, holdP = null;
  const V = new THREE.Vector3();
  try { const ld = lookDir; lookDir = function () { if (aim && typeof camera !== 'undefined') { V.set(aim[0], aim[1], 0.5).unproject(camera).sub(camera.position).normalize(); return [V.x, V.y, V.z]; } return ld.apply(this, arguments); }; } catch (e) { ERR('ld', e); }
  const ndc = (x, y) => [x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1];
  const look = $$('lookZone');
  const blocked = () => (typeof menuOpen !== 'undefined' && menuOpen) || (typeof paused !== 'undefined' && paused) || (typeof dead !== 'undefined' && dead) || (window.__c309 && __c309.on);
  if (look) {
    look.addEventListener('pointerdown', e => { if (!isT(e)) return; const f = {id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), mode: 'wait'}; fingers.set(e.pointerId, f);
      try { look.setPointerCapture(e.pointerId); } catch (_) {}
      f.tm = setTimeout(() => { if (f.mode !== 'wait' || blocked()) return; f.mode = 'hold'; holdP = f; aim = ndc(f.x, f.y); attackTouch = true; U.holds++; ring.style.display = 'block'; ring.style.left = f.x + 'px'; ring.style.top = f.y + 'px'; }, 280);
      e.stopImmediatePropagation(); }, true);
    look.addEventListener('pointermove', e => { const f = fingers.get(e.pointerId); if (!f) return; e.stopImmediatePropagation(); if (blocked()) { f.lx = e.clientX; f.ly = e.clientY; return; }
      if (f.mode !== 'look' && Math.hypot(e.clientX - f.x, e.clientY - f.y) > 14) { if (f.mode === 'hold') { attackTouch = false; aim = null; holdP = null; ring.style.display = 'none'; } clearTimeout(f.tm); f.mode = (lookP && lookP !== f) ? 'idle' : 'look'; if (f.mode === 'look') { lookP = f; U.looks++; } }
      if (f.mode === 'hold') { aim = ndc(e.clientX, e.clientY); ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px'; }
      if (f.mode === 'look') { const k = 0.0034 * SET.sens * tl(); P.yaw -= (e.clientX - f.lx) * k; P.pitch = clamp(P.pitch - (e.clientY - f.ly) * k * 0.85, -1.55, 1.55); }
      f.lx = e.clientX; f.ly = e.clientY; }, true);
    const up = e => { const f = fingers.get(e.pointerId); if (!f) return; fingers.delete(e.pointerId); clearTimeout(f.tm); e.stopImmediatePropagation();
      if (f.mode === 'hold') { attackTouch = false; aim = null; holdP = null; ring.style.display = 'none'; }
      else if (f.mode === 'wait' && e.type === 'pointerup' && !blocked()) { U.taps++; aim = ndc(f.x, f.y);
        try { const m = typeof reachMob === 'function' ? reachMob(4.5) : null; if (m) { attackTouch = true; setTimeout(() => { if (!holdP) attackTouch = false; aim = null; }, 140); return; } useItem(); } catch (er) { ERR('tap', er); } if (!holdP) aim = null; }
      if (lookP === f) lookP = null; };
    look.addEventListener('pointerup', up, true); look.addEventListener('pointercancel', up, true);
  }
  // the mining hit runs every frame from lookDir: keep the finger aim while a hold lasts; progress ring from the real mine timer
  (function rl() { requestAnimationFrame(rl); try { if (!holdP) return; if (blocked()) { attackTouch = false; aim = null; holdP = null; ring.style.display = 'none'; return; } aim = ndc(holdP.lx, holdP.ly);
      let k = 0; if (typeof mine !== 'undefined' && mine && mine.key) { const [x, y, z] = mine.key.split(',').map(Number), b = getB(x, y, z); k = b && HARD[b] ? Math.min(1, mine.t / HARD[b]) : 0; }
      ring.style.background = 'conic-gradient(rgba(255,255,255,.85) ' + (k * 360).toFixed(0) + 'deg, rgba(0,0,0,.25) 0)'; ring.style.webkitMask = ring.style.mask = 'radial-gradient(circle, transparent 55%, #000 57%)'; } catch (e) { ERR('ring', e); } })();
  // ---------- 3) settings: touch look speed (a multiplier on the Sensitivity setting) ----------
  try { const pr = $$('hdSeg') || $$('perfSeg'), row = pr && pr.closest('.set'); if (row) { if (SET.tlook === undefined) SET.tlook = 1;
      const d = document.createElement('div'); d.className = 'set inline'; d.innerHTML = '<span>Touch look speed</span><div class="seg" id="tlSeg">' + [0.5, 0.75, 1, 1.5, 2].map(v => '<button data-v="' + v + '" data-testid="settings-tlook-' + v + '">' + v + 'x</button>').join('') + '</div>';
      row.after(d); const sync = () => d.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === (SET.tlook || 1)));
      d.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { SET.tlook = Number(b.dataset.v); try { saveSet(); } catch (_) {} sync(); })); sync(); } } catch (e) { ERR('set', e); }
})();
