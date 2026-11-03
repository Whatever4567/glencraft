/* GLX-C328 (v1.1.34): touch scrolling in every inventory and crafting list (a drag scrolls, a tap still picks), and real falling:
   your fall speed keeps building up to a high top speed, on the Earth, the Moon, Mars and out in space, so there is no slow gliding down. */
(function c328() {
  const U = window.__c328 = {err: null, scrolls: 0, fallMax: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  // ---------- 1) drag to scroll on touch ----------
  const canY = el => { const s = getComputedStyle(el); return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 2; };
  const canX = el => { const s = getComputedStyle(el); return /(auto|scroll)/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 2; };
  function scroller(t) { let y = null, x = null; for (let el = t; el && el !== document.body && el !== document.documentElement; el = el.parentElement) { if (!y && canY(el)) y = el; if (!x && canX(el)) x = el; if (y && x) break; } return {y, x}; }
  let S = null, killClick = 0, glide = null;
  addEventListener('pointerdown', e => { try { if (e.pointerType !== 'touch') return; if (glide) { cancelAnimationFrame(glide); glide = null; }
      const sc = scroller(e.target); U.dn = [!!sc.y, !!sc.x]; if (!sc.y && !sc.x) { S = null; return; } S = {pid: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, sc, on: false, t: performance.now(), vx: 0, vy: 0, lt: performance.now()}; } catch (er) { ERR('down', er); } }, true);
  addEventListener('pointermove', e => { try { if (!S || e.pointerId !== S.pid) return; const dx = e.clientX - S.x, dy = e.clientY - S.y;
      if (!S.on) { if (Math.hypot(dx, dy) < 8) return; const vert = Math.abs(dy) >= Math.abs(dx); const el = vert ? S.sc.y : S.sc.x; if (!el) { S = null; return; } S.el = el; S.vert = vert; S.on = true; U.scrolls++;
        try { document.dispatchEvent(new PointerEvent('pointercancel', {pointerId: e.pointerId, pointerType: 'touch', bubbles: true})); } catch (_) {} }
      const now = performance.now(), mx = e.clientX - S.lx, my = e.clientY - S.ly, k = Math.max(1, now - S.lt); if (S.vert) { S.el.scrollTop -= my; S.vy = my / k; } else { S.el.scrollLeft -= mx; S.vx = mx / k; }
      S.lx = e.clientX; S.ly = e.clientY; S.lt = now; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault(); } catch (er) { ERR('move', er); } }, {capture: true, passive: false});
  const up = e => { if (!S || e.pointerId !== S.pid) return; const s = S; S = null; if (!s.on) return; killClick = performance.now() + 450; e.stopImmediatePropagation();
    let v = (s.vert ? s.vy : s.vx) * 16; const el = s.el, step = () => { if (Math.abs(v) < 0.4) { glide = null; return; } if (s.vert) el.scrollTop -= v; else el.scrollLeft -= v; v *= 0.93; glide = requestAnimationFrame(step); }; glide = requestAnimationFrame(step); };
  addEventListener('pointerup', up, true); addEventListener('pointercancel', e => { if (S && e.pointerId === S.pid && !S.on) S = null; }, true);
  addEventListener('click', e => { if (performance.now() < killClick) { killClick = 0; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  // the touch styles had turned panning off on the lists; the drag above handles them, and native panning is allowed where it can work
  try { const st = document.createElement('style'); st.textContent = 'body.touch #invGrid,body.touch #invHot,body.touch #chestUI,body.touch #furnUI,body.touch #craft,body.touch #craft *,body.touch #invGrid *{touch-action:pan-x pan-y!important}'; document.head.appendChild(st); } catch (e) { ERR('css', e); }
  // ---------- 2) real falling ----------
  const G = {moon: 1 / 6, mars: 0.38}, TOP = {moon: 70, mars: 95};
  let fallT = 0;
  function body() { try { const b = window.__c318 && __c318.near(window.__c321 ? __c321.pw() : P, 600); return b ? b.id : ''; } catch (_) { return ''; } }
  setTimeout(() => { try { const upd = updatePlayer; updatePlayer = function (dt, mx, mz) { const v0 = P.vy, r = upd.apply(this, arguments);
      try { const jet = window.__c102j, veh = (window.__c309 && __c309.on) || (window.__c299 && __c299.on);
        if (P.onGround || swimming || veh || (MODE.fly && flying) || (jet && jet.boost) || DIM.busy || v0 > 0.5 || !(dt > 0)) { fallT = 0; return r; }
        const id = body(); U.body = id; const g = G[id] || 1, top = TOP[id] || 160, d = Math.min(dt, 0.1); fallT += d;
        const a = 24 * g * (1 + Math.min(1.5, fallT * 0.4)), want = Math.max(-top, v0 - a * d);
        if (P.vy > v0 + 1 && P.vy >= -1.3) return r;   /* cobwebs and the like still hold you */
        P.vy = want; if (P.vy < -top) P.vy = -top; U.fallMax = Math.min(U.fallMax, P.vy); } catch (e) { ERR('fall', e); }
      return r; }; } catch (e) { ERR('wrap', e); } }, 4100);
})();
// (t687u) no unbreakable floor under Glencraft: the bottom layer of the map can be dug like any other block, and the planet goes on below it
(function c328b() { try { const cm = canMine; canMine = function (b, y) { try { if (y === 0 && b && b !== T.WATER && b !== T.LAVA && window.__c317 && __c317.on() && !DIM.cur) return HARD[b] !== undefined || true; } catch (_) {} return cm.apply(this, arguments); }; } catch (e) { window.__c328 && (__c328.err = __c328.err || 'cm ' + e); } })();
