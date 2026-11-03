/* GLX-C256 (v1.0.69): true 3D animal voices. Every animal call (sheep, pigs, ducks, haggis, squelches...) is played through its own
   Web Audio PannerNode (HRTF) placed at the mob, with the listener riding the camera - so sounds pan left/right as you turn and fade
   out by about 24 blocks. Also stops the pile-ups: one voice per mob at a time and at most 4 animal voices at once. */
(() => {
  const U = window.__c256 = {err: null, calls: 0, played: 0, skip: 0, live: 0, hrtf: 0, muff: 0, occ: 0};
  const KINDS = new Set(['baa', 'oink', 'oink2', 'snort', 'quack', 'chirp', 'squeal', 'squelch', 'moo', 'cluck', 'neigh']);
  const R = 24, MAXV = 4, GAP = 1.1, lastBy = new WeakMap(), lastKind = {};
  let pendO = 0, pend = null, live = [];
  const V = new THREE.Vector3(), F = new THREE.Vector3(), UP = new THREE.Vector3();
  function setP(prm, obj, k, v) { if (prm) prm.setValueAtTime ? prm.value = v : 0; else if (obj) obj[k] = v; }
  function listen() { try { const L = AC.listener; camera.getWorldPosition(V); camera.getWorldDirection(F); UP.set(0, 1, 0).applyQuaternion(camera.quaternion);
      if (L.positionX) { L.positionX.value = V.x; L.positionY.value = V.y; L.positionZ.value = V.z; L.forwardX.value = F.x; L.forwardY.value = F.y; L.forwardZ.value = F.z; L.upX.value = UP.x; L.upY.value = UP.y; L.upZ.value = UP.z; }
      else { L.setPosition(V.x, V.y, V.z); L.setOrientation(F.x, F.y, F.z, UP.x, UP.y, UP.z); } } catch (e) { U.err = 'L ' + e; } }
  function occl(pos) { try { const hx = P.x, hy = P.y + 1.62, hz = P.z; let roof = 0; for (let y = Math.floor(hy) + 1; y < Math.floor(hy) + 8; y++) if (solid(Math.floor(hx), y, Math.floor(hz))) { roof = 1; break; }
      const dx = pos.x - hx, dy = pos.y + 0.6 - hy, dz = pos.z - hz, d = Math.hypot(dx, dy, dz), n = Math.min(40, Math.floor(d / 0.7)); let hit = 0;
      for (let i = 1; i < n; i++) { const k = i / n; if (solid(Math.floor(hx + dx * k), Math.floor(hy + dy * k), Math.floor(hz + dz * k))) { hit++; if (hit >= 3) break; } }
      return Math.min(1, hit * 0.4 + (roof && hit ? 0.3 : roof ? 0.15 : 0)); } catch (_) { return 0; } }
  function panner(pos, maxD) { const p = AC.createPanner(); try { p.panningModel = 'HRTF'; U.hrtf = 1; } catch (_) {} p.distanceModel = 'linear'; p.refDistance = 2.5; p.maxDistance = maxD || R; p.rolloffFactor = 1;
    if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y + 0.6; p.positionZ.value = pos.z; } else p.setPosition(pos.x, pos.y + 0.6, pos.z);
    const oc = occl(pos); U.occ = oc; if (oc > 0) { const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400 - 1900 * oc; lp.Q.value = 0.5; const g = AC.createGain(); g.gain.value = 1 - 0.6 * oc; p.connect(lp); lp.connect(g); g.connect(master); U.muff++; } else p.connect(master); return p; }
  try { const on = outNode; outNode = function (vol, pan) { if (pendO && AC && !pend) { const g = AC.createGain(); g.gain.value = vol * (1 - 0.6 * pendO); const sp = AC.createStereoPanner(), lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400 - 1900 * pendO; sp.pan.value = Math.max(-1, Math.min(1, pan || 0)); g.connect(sp); sp.connect(lp); lp.connect(master); return g; } if (pend && AC) { const g = AC.createGain(); g.gain.value = vol; g.connect(pend); return g; } return on.apply(this, arguments); }; } catch (e) { U.err = 'out ' + e; }
  try { const s3 = sfx3d; sfx3d = function (kind, pos, radius) {
      const ani = KINDS.has(kind); if (typeof AC === 'undefined' || !AC || !pos || !master) return s3.apply(this, arguments);
      if (!ani) { let o = 0; try { if (Math.hypot(pos.x - P.x, pos.z - P.z) > 3) o = occl(pos); } catch (_) {} if (!o) return s3.apply(this, arguments); pendO = o; U.muff++; try { return s3.apply(this, arguments); } finally { pendO = 0; } }
      U.calls++; const now = AC.currentTime, d = Math.hypot(pos.x - P.x, pos.y - P.y, pos.z - P.z), MD = R; if (d > MD) return;
      live = live.filter(x => x.end > now); const lb = lastBy.get(pos) || -9;
      if (now - lb < GAP || live.length >= MAXV || (lastKind[kind] && now - lastKind[kind] < 0.25)) { U.skip++; return; }
      lastBy.set(pos, now); lastKind[kind] = now; listen();
      const pn = panner(pos, MD); pend = pn; try { playSound(kind, kind === 'squelch' ? 0.45 : 0.4, 0); } catch (e) { U.err = 'ps ' + e; } finally { pend = null; }
      live.push({end: now + 1.8, pn}); U.live = live.length; U.played++;
      setTimeout(() => { try { pn.disconnect(); } catch (_) {} }, 4500); }; } catch (e) { U.err = 'wrap ' + e; }
  // keep the listener on the camera while voices are ringing, so turning your head moves them
  (function loop() { try { if (typeof AC !== 'undefined' && AC && ((window.__c259 && __c259.on) || (live.length && live.some(x => x.end > AC.currentTime)))) listen();   /* v1.0.77: also during the dance, or its 3D music was never heard */ } catch (_) {} requestAnimationFrame(loop); })();
})();
