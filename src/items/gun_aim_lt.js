/* GLX-C288 (v1.1.99 yield to vm) (v1.0.95): guns - hold LT (right mouse / the LT touch button) to aim down the sights: the view zooms in, the gun moves to the
   middle and shots are dead-on; RT (left click / the RT touch button) fires. Hip fire has a little spread. Without a gun LT still places
   blocks and trades. The Builder Tool marks its corners with RT now, so LT is free. */
(function c288() {
  const U = window.__c288 = {err: null, ads: 0, shots: 0, marks: 0, aiming: false};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const gunHeld = () => { try { return !!(typeof GUN !== 'undefined' && GUN[selId] && cnt(selId) > 0); } catch (_) { return false; } };
  const toolHeld = () => { try { return !!(window.__c285 && selId === __c285.id && cnt(selId) > 0); } catch (_) { return false; } };
  const live = () => typeof started !== 'undefined' && started && !menuOpen && !paused && !dead;
  let rmb = false, lmbEdge = false, tLT = false, tRT = false, padPrev = false;
  addEventListener('mousedown', e => { if (e.button === 2) rmb = true; if (e.button === 0 && (typeof pointerLocked === 'undefined' || pointerLocked)) lmbEdge = true; });
  addEventListener('mouseup', e => { if (e.button === 2) rmb = false; });
  /* v1.1.55: never get stuck aiming (a lost mouse-up during jetpack flight left the camera inside the gun) */
  addEventListener('mousemove', e => { if (rmb && !(e.buttons & 2)) rmb = false; }); addEventListener('blur', () => { rmb = false; }); document.addEventListener('pointerlockchange', () => { rmb = false; });
  addEventListener('blur', () => { rmb = false; tLT = false; tHold = false; });
  let b2x = false, airx = 0; addEventListener('mousemove', e => { b2x = !!(e.buttons & 2); }); setInterval(() => { try { if (!P.onGround) airx++; else { if (airx > 3) rmb = rmb && b2x; airx = 0; } } catch (_) {} }, 100);   // v1.1.76: landing after a jetpack flight clears a stuck aim
  // v1.1.55: the on-screen RT fires even if another layer eats the button events - caught at the document, tap fires, hold keeps firing
  let tHold = false, lastAuto = 0; const onRT = e => { const t = e.target; return !!(t && t.closest && t.closest('#bMine')); };
  for (const ev of ['touchstart', 'pointerdown']) document.addEventListener(ev, e => { if (onRT(e) && !tHold) { tHold = true; tRT = true; lastAuto = performance.now(); } }, {capture: true, passive: true});
  for (const ev of ['touchend', 'touchcancel', 'pointerup', 'pointercancel']) document.addEventListener(ev, e => { if (ev[0] === 'p' && e.pointerType === 'mouse' && !onRT(e)) return; if (!e.touches || !e.touches.length || ![...e.touches].some(x => x.target && x.target.closest && x.target.closest('#bMine'))) tHold = false; }, {capture: true, passive: true});
  function touchHook() { for (const [id, on, off] of [['bPlace', () => { tLT = true; }, () => { tLT = false; }], ['bMine', () => { tRT = true; }, () => {}]]) { const el = document.getElementById(id); if (!el || el.__c288) continue; el.__c288 = 1;
      el.addEventListener('touchstart', on, {passive: true}); el.addEventListener('touchend', off, {passive: true}); el.addEventListener('touchcancel', off, {passive: true}); } }
  const pad = () => { try { for (const g of navigator.getGamepads ? navigator.getGamepads() : []) if (g && g.connected) return g; } catch (_) {} return null; };
  // LT with a gun = aim only (never fires); everything else unchanged
  let fireNow = false;
  try { const ui = useItem; useItem = function () { if (!fireNow && !window.__gunFire && live() && (gunHeld() || toolHeld())) { if (toolHeld()) toast('Builder Tool: walk up to a green outline and press Save piece (RT)'); return; } return ui.apply(this, arguments); }; } catch (e) { ERR('ui', e); }
  // RT with a gun / the tool never digs
  try { const ba = breakAt; breakAt = function () { if (live() && (gunHeld() || toolHeld())) return; return ba.apply(this, arguments); }; } catch (e) { ERR('ba', e); }
  // hip-fire spread
  try { const ld = lookDir; lookDir = function () { const d = ld.apply(this, arguments); if (fireNow && !U.aiming && Array.isArray(d)) { const s = 0.035; d[0] += (Math.random() - .5) * s; d[1] += (Math.random() - .5) * s; d[2] += (Math.random() - .5) * s; const m = Math.hypot(d[0], d[1], d[2]) || 1; d[0] /= m; d[1] /= m; d[2] /= m; } return d; }; } catch (e) { ERR('ld', e); }
  function fire() { fireNow = true; const gf = window.__gunFire; window.__gunFire = true; try { useItem(); U.shots++; } catch (e) { ERR('fire', e); } finally { fireNow = false; window.__gunFire = gf; } }   // v1.1.76: the musket fires from the touch RT too
  U.fire = fire;
  let k = 0, last = performance.now();
  setInterval(() => { try { touchHook(); const g = pad(), rt = !!(g && g.buttons[7] && (g.buttons[7].pressed || g.buttons[7].value > 0.4)), lt = !!(g && g.buttons[6] && (g.buttons[6].pressed || g.buttons[6].value > 0.4));
      const nowA = performance.now(), auto = (tHold || (rt && padPrev)) && nowA - lastAuto > 140; if (auto || tRT || (rt && !padPrev)) lastAuto = nowA;
      const rtEdge = (rt && !padPrev) || lmbEdge || tRT || auto; padPrev = rt; lmbEdge = false; tRT = false;
      U.aiming = live() && gunHeld() && (lt || rmb || tLT);
      if (rtEdge && live()) { if (gunHeld()) fire(); else if (toolHeld()) { try { __c290.rt(); U.marks++; } catch (e) { ERR('mark', e); } } } } catch (e) { ERR('poll', e); } }, 30);
  /* v1.1.28: the pistol sights go to the exact screen centre: measure the gun in camera space and move the hand by the difference */
  const BB = new THREE.Box3(), VC = new THREE.Vector3(), MI = new THREE.Matrix4();
  function centre() { try { const g = (typeof held !== "undefined" && held) || hand; camera.updateMatrixWorld(true); hand.updateMatrixWorld(true); MI.copy(camera.matrixWorld).invert();
      BB.makeEmpty(); g.traverse(o => { if (o.isMesh && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld).applyMatrix4(MI); BB.union(b); } });
      if (BB.isEmpty()) return [0.3, -0.1]; BB.getCenter(VC); const z = Math.max(0.15, -VC.z), sx = VC.x / z, sy = BB.max.y / z; return [sx * z, (sy + 0.012) * z]; } catch (_) { return [0.3, -0.1]; } }
  // the sight picture: zoom and bring the gun to the middle, eased in and out
  try { const br = renderer.render.bind(renderer); renderer.render = function (sc, cam) {
      if (cam !== camera) return br(sc, cam); const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      k += ((U.aiming ? 1 : 0) - k) * (1 - Math.exp(-dt * 14)); if (k < 0.002) k = 0; U.ads = +k.toFixed(3);
      if (!k) return br(sc, cam);
      /* v1.1.28: the rifle aims with its own exact iron sight code (C145) again, as before v1.0.95; nothing here moves it */
      if ((window.__vm && typeof GUN !== 'undefined' && GUN[selId]) || (typeof IT !== 'undefined' && (selId === IT.MUSKET || (window.__c340 && __c340.on)))) return br(sc, cam);
      const f0 = camera.fov, hx = hand.position.x, hy = hand.position.y, hz = hand.position.z;
      camera.fov = f0 * (1 - 0.38 * k); camera.updateProjectionMatrix(); const rx = hand.rotation.x, ry = hand.rotation.y, rz = hand.rotation.z; hand.rotation.set(rx * (1 - k), ry * (1 - k), rz * (1 - k)); const off = centre(); hand.position.x = hx - off[0] * k; hand.position.y = hy - off[1] * k; hand.position.z = hz + 0.08 * k;
      try { return br(sc, cam); } finally { camera.fov = f0; camera.updateProjectionMatrix(); hand.position.set(hx, hy, hz); hand.rotation.set(rx, ry, rz); } }; } catch (e) { ERR('rd', e); }
})();
