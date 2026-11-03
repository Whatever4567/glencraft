/* GLX-C336 (v1.1.38): NO BLACK FLASHES. On phones the screen resolution was changed by a timer outside the drawing step, which
   clears the picture, so a black frame showed every few seconds. The resolution now changes only right before a frame is drawn,
   at most every 8 seconds and in small steps. Fog and sky colour can no longer jump in one frame (they ease over a fraction of a
   second), and a lost graphics context is restored instead of leaving a black screen. */
(function c336() {
  const U = window.__c336 = {err: null, pr: [], lost: 0, sz: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const PHONE = typeof touchMode !== 'undefined' && touchMode && !(typeof HIGH !== 'undefined' && HIGH);
  const PRMAX = PHONE ? Math.min(DPR, 1.6) : 0, PRMIN = PHONE ? Math.min(0.7, PRMAX) : 0;
  window.__noDynRes = true;   // the old timer based resizer is off
  let want = 0, acc = 0, n = 0, slow = 0, last = performance.now(), lastCh = 0;
  (function tick() { requestAnimationFrame(tick); const t = performance.now(), dt = t - last; last = t;
    if (!PHONE || typeof started === 'undefined' || !started || paused || dt > 400) return; acc += dt; n++; if (dt > 50) slow++;
    if (acc < 2000) return; const avg = acc / n, pr = renderer.getPixelRatio(), sl = slow; acc = 0; n = 0; slow = 0; if (t - lastCh < 8000) return;
    let np = pr; if (avg > 38 || sl > 6) np = Math.max(PRMIN, pr * 0.85); else if (avg < 20 && sl === 0) np = Math.min(PRMAX, pr * 1.06);
    if (Math.abs(np - pr) > 0.03) { want = np; lastCh = t; } })();
  const cur = new THREE.Color(), bgc = new THREE.Color(), tgt = new THREE.Color(); let have = false, tl = performance.now();
  try { const rd = renderer.render; renderer.render = function (s, c) { if (s !== scene) return rd.apply(this, arguments);
      // resolution change happens here, right before drawing, so the cleared canvas is drawn at once
      if (want) { try { const w = want; want = 0; renderer.setPixelRatio(w); renderer.setSize(window.innerWidth, window.innerHeight, false); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); U.pr.push(+w.toFixed(2)); if (U.pr.length > 20) U.pr.shift(); U.sz++; } catch (e) { ERR('pr', e); } }
      const now = performance.now(), dt = Math.min(0.2, (now - tl) / 1000); tl = now; const fog = s.fog, bg = s.background && s.background.isColor ? s.background : null; let f0 = null, b0 = null;
      try { if (fog && fog.color) { tgt.copy(fog.color); if (!have) { cur.copy(tgt); bgc.copy(bg || tgt); have = true; } const k = 1 - Math.exp(-dt * 9), d = Math.abs(cur.r - tgt.r) + Math.abs(cur.g - tgt.g) + Math.abs(cur.b - tgt.b);
          if (d > 2.2) cur.copy(tgt); else cur.lerp(tgt, k); f0 = fog.color.getHex(); fog.color.copy(cur);   // a big change (going into space, a portal) is instant, small flickers ease
          if (bg) { const d2 = Math.abs(bgc.r - bg.r) + Math.abs(bgc.g - bg.g) + Math.abs(bgc.b - bg.b); if (d2 > 2.2) bgc.copy(bg); else bgc.lerp(bg, k); b0 = bg.getHex(); bg.copy(bgc); } } } catch (e) { ERR('fog', e); }
      try { return rd.apply(this, arguments); } finally { if (f0 !== null) fog.color.setHex(f0); if (b0 !== null) bg.setHex(b0); } }; } catch (e) { ERR('rd', e); }
  try { const cv = renderer.domElement; cv.addEventListener('webglcontextlost', ev => { ev.preventDefault(); U.lost++; }, false); cv.addEventListener('webglcontextrestored', () => { U.restored = (U.restored || 0) + 1; }, false); } catch (e) { ERR('ctx', e); }
})();
/* v1.1.38: finding an object by name walked the whole scene (hundreds of thousands of objects) several times every frame. Found
   objects are now remembered while they stay in the scene, so the stutter it caused is gone. */
(function c336b() {
  try { const P0 = THREE.Object3D.prototype, g0 = P0.getObjectByName; window.__c336.hit = 0; window.__c336.miss = 0;
    const att = (o, root) => { for (let i = 0; o && i < 80; i++) { if (o === root) return true; o = o.parent; } return false; };
    P0.getObjectByName = function (n) { let m = this.__c336m; if (!m) { m = new Map(); Object.defineProperty(this, '__c336m', {value: m, enumerable: false}); }
      const c = m.get(n), now = performance.now();
      if (c) { if (c.o) { if (c.o.name === n && att(c.o, this)) { window.__c336.hit++; return c.o; } } else if (now - c.t < 1500) return undefined; }
      window.__c336.miss++; const o = g0.call(this, n); m.set(n, {o: o || null, t: now}); return o; };
  } catch (e) { window.__c336.err = window.__c336.err || ('gobn ' + e); }
})();
