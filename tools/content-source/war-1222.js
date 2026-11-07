/* GLX-WAR1222 (v1.2.22): YEAR 24000 robot war. The giant truck robots now fight each other in pairs instead of walking in circles:
   each one squares up to its opponent, winds up (leans back, arm raised), swings a heavy punch with a lunge, the one hit rocks back
   and staggers, then both plant their feet and circle for the next blow. Every robot has its own timing, so no two move in step.
   Battle saucers cross the sky firing big red lasers down at the robots, with sparks where they hit. Far away on the horizon nuclear
   blasts rise as mushroom clouds with a spreading shock ring - scenery only, no damage, no craters, no screen flash and no change to
   the light or exposure. Fewer of everything on phones and in performance mode; it all stops while paused and is removed when the
   vision ends. These battle saucers are not the alien visitor saucer. */
(function war1222() {
  const U = window.__war1222 = {err: null, on: 0, pairs: 0, strikes: 0, beams: 0, nukes: 0, sparks: 0, starts: 0, stops: 0, ufos: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const LOW = () => (typeof touchMode !== 'undefined' && !!touchMode) || (typeof PERF !== 'undefined' && PERF);
  const RM = () => { try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_) { return false; } };
  U.caps = () => LOW() ? {ufo: 2, beam: 2, nuke: 1, spark: 24} : {ufo: 4, beam: 4, nuke: 2, spark: 60};
  let W8 = null, GEO = null;
  function geo() { if (GEO) return GEO; GEO = {hull: new THREE.SphereGeometry(6, 18, 8), ring: new THREE.TorusGeometry(6.4, 0.5, 6, 24), beam: new THREE.CylinderGeometry(0.35, 0.35, 1, 6, 1, true),
      stem: new THREE.CylinderGeometry(5, 9, 1, 12, 1, true), cap: new THREE.SphereGeometry(1, 16, 10), shock: new THREE.TorusGeometry(1, 0.08, 4, 40)}; GEO.beam.translate(0, 0.5, 0); GEO.stem.translate(0, 0.5, 0); return GEO; }
  // ---------- robots: arm pivots on the real model, paired opponents ----------
  const ARM = (m, s) => { let a = null; for (const c of m.children) if (c.isMesh && c.geometry && c.geometry.parameters && c.geometry.parameters.height === 6 && Math.abs(c.position.x - s * 4.6) < 0.01) { a = c; break; } return a; };
  function rig(m) { if (m.userData.w22) return m.userData.w22; const arms = [];
    for (const s of [-1, 1]) { const a = ARM(m, s); const p = new THREE.Group(); p.position.set(s * 4.6, 16.4, 0); m.add(p); if (a) { m.remove(a); a.position.set(0, -2.9, 0); p.add(a); } arms.push(p); }
    return (m.userData.w22 = {arms}); }
  const PH = [['guard', 1.1], ['wind', 0.7], ['strike', 0.28], ['follow', 0.45], ['plant', 0.7]];
  U.PH = PH;
  function pose(m, st, k, t) { const d = m.userData, w = rig(m), r = d.r, side = st.side; let lean = 0, lunge = 0, armR = 0, armL = -0.5, legA = 0.15, bob = 0, twist = 0;
    switch (st.ph) {
      case 'guard': lean = 0.04 * Math.sin(t * 1.7 + st.seed); armR = -0.6 + 0.1 * Math.sin(t * 2.1 + st.seed); legA = 0.22; bob = 0.25 * Math.sin(t * 1.3 + st.seed); twist = 0.12 * Math.sin(t * 0.9 + st.seed); break;
      case 'wind': lean = -0.16 * k; armR = -0.6 - 1.9 * k; twist = -0.35 * k; legA = 0.22 + 0.12 * k; break;
      case 'strike': lean = -0.16 + 0.42 * k; lunge = 3.2 * k; armR = -2.5 + 3.4 * k; twist = -0.35 + 0.8 * k; legA = 0.34 - 0.5 * k; break;
      case 'follow': lean = 0.26 - 0.2 * k; lunge = 3.2 - 1.2 * k; armR = 0.9 - 1.1 * k; twist = 0.45 - 0.3 * k; legA = -0.16 + 0.2 * k; break;
      case 'plant': lean = 0.06 * (1 - k); lunge = 2 * (1 - k); armR = -0.2 - 0.4 * k; legA = 0.04 + 0.18 * k; bob = -0.6 * Math.sin(k * Math.PI); break;
      case 'hit': lean = -0.32 * Math.sin(Math.min(1, k * 1.6) * Math.PI / 2) * (1 - k * 0.6); lunge = -3.5 * Math.sin(k * Math.PI * 0.5); armR = -0.2; armL = 0.4 * (1 - k); legA = -0.25 * (1 - k); twist = 0.3 * (1 - k); bob = -0.4 * k; break; }
    st.out = {lean, lunge, armR, armL, legA, bob, twist};
    const f = st.face; m.position.set(st.home.x + Math.sin(f) * lunge, st.home.y + bob, st.home.z + Math.cos(f) * lunge); m.rotation.set(lean, f + twist, 0, 'YXZ');
    w.arms[side > 0 ? 1 : 0].rotation.x = armR; w.arms[side > 0 ? 0 : 1].rotation.x = armL; d.legs[0].rotation.x = legA; d.legs[1].rotation.x = -legA * 0.8;
    if (r) { const rw = rig(r); r.position.set(m.position.x, 2 * (P.y - 0.97) - m.position.y, m.position.z); r.rotation.copy(m.rotation); rw.arms[0].rotation.x = w.arms[0].rotation.x; rw.arms[1].rotation.x = w.arms[1].rotation.x;
      r.userData.legs[0].rotation.x = d.legs[0].rotation.x; r.userData.legs[1].rotation.x = d.legs[1].rotation.x; } }
  function pairUp(ms, cx, cz, gy) { const L = []; const n = ms.length;
    for (let i = 0; i < n; i++) { const a = (Math.floor(i / 2) + 0.5) / Math.ceil(n / 2) * 6.283 + 0.4, R = 40 + (Math.floor(i / 2) % 2) * 22, c = [cx + Math.sin(a) * R, cz + Math.cos(a) * R], s = i % 2 ? 1 : -1;
      const opp = i % 2 ? i - 1 : (i + 1 < n ? i + 1 : (n > 2 ? 0 : -1)), ax = a + Math.PI / 2, home = new THREE.Vector3(c[0] + Math.sin(ax) * 8 * s, gy - 1, c[1] + Math.cos(ax) * 8 * s);
      L.push({i, m: ms[i], opp, home, face: 0, side: s, ph: 'guard', pt: (i * 0.37) % 1 * 1.1, seed: i * 1.91, lead: i % 2 === 0}); }
    for (const st of L) { const o = st.opp >= 0 ? L[st.opp] : null; st.face = o ? Math.atan2(o.home.x - st.home.x, o.home.z - st.home.z) : 0; }
    return L; }
  // ---------- battle state ----------
  let B = null;
  function build(Y) { const cap = U.caps(), g = geo(), root = new THREE.Group(); root.userData.__dcR = 1e9; scene.add(root);
    const hullM = new THREE.MeshPhongMaterial({color: 0x2a2e38, specular: 0x99aabb, shininess: 90}), ringM = new THREE.MeshBasicMaterial({color: 0xff3040}), beamM = new THREE.MeshBasicMaterial({color: 0xff1a1a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false});
    const ufos = []; for (let i = 0; i < cap.ufo; i++) { const u = new THREE.Group(), h = new THREE.Mesh(g.hull, hullM); h.scale.y = 0.22; const r = new THREE.Mesh(g.ring, ringM); r.rotation.x = Math.PI / 2; u.add(h, r); root.add(u); ufos.push({g: u, a: i / cap.ufo * 6.283, R: 70 + i * 18, h: 80 + i * 9, sp: (i % 2 ? 0.08 : -0.06), cd: 0.6 + i * 0.7}); }
    const beams = []; for (let i = 0; i < cap.beam; i++) { const m = new THREE.Mesh(g.beam, beamM); m.visible = false; m.frustumCulled = false; root.add(m); beams.push({m, t: 0, u: null, tgt: new THREE.Vector3()}); }
    const sg = new THREE.BufferGeometry(), sp = new Float32Array(cap.spark * 3).fill(-1e5); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const sparks = new THREE.Points(sg, new THREE.PointsMaterial({color: 0xffa040, size: 1.6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false})); sparks.frustumCulled = false; root.add(sparks);
    const sv = new Float32Array(cap.spark * 3), sl = new Float32Array(cap.spark); let sk = 0;
    const nukeM = () => new THREE.MeshBasicMaterial({color: 0xff9a40, transparent: true, opacity: 0, depthWrite: false, fog: false});
    const nukes = []; for (let i = 0; i < cap.nuke; i++) { const n = new THREE.Group(), stem = new THREE.Mesh(g.stem, nukeM()), cap0 = new THREE.Mesh(g.cap, nukeM()), ring = new THREE.Mesh(g.shock, nukeM()); ring.rotation.x = Math.PI / 2; n.add(stem, cap0, ring); n.visible = false; root.add(n); nukes.push({g: n, stem, cap: cap0, ring, t: 0, on: 0, wait: 2 + i * 5}); }
    const ms = []; for (const c of Y.g.children) if (c.userData && c.userData.legs && c.userData.r) ms.push(c);
    const gy = P.y; const st = pairUp(ms, Y.cx, Y.cz, gy); U.pairs = Math.floor(ms.length / 2);
    B = {root, ufos, beams, sparks, sp, sv, sl, sk, nukes, st, cx: Y.cx, cz: Y.cz, gy, t: 0, mats: [hullM, ringM, beamM, sparks.material, ...nukes.flatMap(n => [n.stem.material, n.cap.material, n.ring.material])], sg};
    B.spark = (x, y, z, n) => { for (let j = 0; j < n; j++) { const k = B.sk = (B.sk + 1) % cap.spark; B.sp[k * 3] = x; B.sp[k * 3 + 1] = y; B.sp[k * 3 + 2] = z; B.sv[k * 3] = (Math.random() - .5) * 14; B.sv[k * 3 + 1] = Math.random() * 12; B.sv[k * 3 + 2] = (Math.random() - .5) * 14; B.sl[k] = 0.6 + Math.random() * 0.5; U.sparks++; } };
    U.on = 1; U.ufos = ufos.length; return B; }
  function clear() { if (!B) return; try { scene.remove(B.root); B.sg.dispose(); B.mats.forEach(m => m.dispose()); } catch (e) { ERR('clear', e); } B = null; U.on = 0; }
  function step(dt) { if (!B) return; if (typeof paused !== 'undefined' && paused) return; B.t += dt; const t = B.t;
    // robots
    for (const s of B.st) { if (!s.m.parent) continue; const o = s.opp >= 0 ? B.st[s.opp] : null;
      if (s.ph === 'hit') { s.pt += dt; if (s.pt >= 0.9) { s.ph = 'guard'; s.pt = 0; } }
      else { s.pt += dt * (s.lead ? 1 : 0.93); let idx = PH.findIndex(p => p[0] === s.ph); if (s.pt >= PH[idx][1]) { s.pt = 0; idx = (idx + 1) % PH.length; s.ph = PH[idx][0];
          if (s.ph === 'follow' && o) { U.strikes++; if (o.ph !== 'wind' && o.ph !== 'strike') { o.ph = 'hit'; o.pt = 0; } const hp = o.m.position; B.spark(hp.x, B.gy + 24, hp.z, 6); }
          if (s.ph === 'guard' && o && s.lead === o.lead) s.lead = !s.lead; } }
      const idx = PH.findIndex(p => p[0] === s.ph), k = s.ph === 'hit' ? s.pt / 0.9 : Math.min(1, s.pt / PH[idx][1]); pose(s.m, s, k, t); }
    // saucers and lasers
    for (const u of B.ufos) { u.a += u.sp * dt; u.g.position.set(B.cx + Math.sin(u.a) * u.R, B.gy + u.h + Math.sin(t * 0.7 + u.R) * 3, B.cz + Math.cos(u.a) * u.R); u.g.rotation.y += dt * 0.8;
      if ((u.cd -= dt) <= 0) { u.cd = 1.4 + Math.random() * 1.8; const b = B.beams.find(q => q.t <= 0); if (b && B.st.length) { const s = B.st[Math.floor(Math.random() * B.st.length)].m; b.u = u; b.t = 0.45; b.tgt.set(s.position.x + (Math.random() - .5) * 6, B.gy + 6 + Math.random() * 18, s.position.z + (Math.random() - .5) * 6); U.beams++; B.spark(b.tgt.x, b.tgt.y, b.tgt.z, 10); } } }
    const v = V0; for (const b of B.beams) { if (b.t <= 0) { b.m.visible = false; continue; } b.t -= dt; const o = b.u.g.position; v.subVectors(b.tgt, o); const L = v.length();
      b.m.position.copy(o); b.m.scale.set(1 + 0.6 * Math.sin(t * 40), L, 1 + 0.6 * Math.sin(t * 40)); b.m.quaternion.setFromUnitVectors(UP, v.divideScalar(Math.max(L, 1e-3))); b.m.visible = b.t > 0; }
    // sparks
    const sp = B.sp, sv = B.sv, sl = B.sl; for (let k = 0; k < sl.length; k++) { if (sl[k] <= 0) continue; sl[k] -= dt; sv[k * 3 + 1] -= 20 * dt; sp[k * 3] += sv[k * 3] * dt; sp[k * 3 + 1] += sv[k * 3 + 1] * dt; sp[k * 3 + 2] += sv[k * 3 + 2] * dt; if (sl[k] <= 0) sp[k * 3 + 1] = -1e5; }
    B.sparks.geometry.attributes.position.needsUpdate = true;
    // far nuclear blasts (scenery)
    for (const n of B.nukes) { if (!n.on) { if ((n.wait -= dt) <= 0) { n.on = 1; n.t = 0; const a = Math.random() * 6.283, R = 290 + Math.random() * 40; n.g.position.set(B.cx + Math.sin(a) * R, B.gy - 4, B.cz + Math.cos(a) * R); n.g.visible = true; U.nukes++; } continue; }
      n.t += dt * (RM() ? 0.5 : 1); const k = Math.min(1, n.t / 9), rise = 1 - Math.pow(1 - k, 2), fade = n.t < 7 ? 1 : Math.max(0, 1 - (n.t - 7) / 3);
      n.stem.scale.set(1 + rise, 10 + 70 * rise, 1 + rise); n.cap.position.y = 10 + 70 * rise; n.cap.scale.set(14 + 22 * rise, 8 + 12 * rise, 14 + 22 * rise);
      n.ring.scale.setScalar(4 + 120 * Math.min(1, n.t / 4)); n.ring.position.y = 2; const hot = Math.max(0, 1 - n.t / 3);
      n.stem.material.opacity = 0.75 * fade; n.cap.material.opacity = 0.85 * fade; n.cap.material.color.setRGB(1, 0.45 + 0.4 * hot, 0.2 + 0.5 * hot); n.stem.material.color.copy(n.cap.material.color).multiplyScalar(0.8); n.ring.material.opacity = 0.6 * Math.max(0, 1 - n.t / 4);
      if (n.t > 10) { n.on = 0; n.g.visible = false; n.wait = 6 + Math.random() * 8; } } }
  const UP = new THREE.Vector3(0, 1, 0), V0 = new THREE.Vector3();
  U.step = step; U.state = () => B; U.clear = clear;
  U.start = () => { try { const y = window.__c248; if (!y || !y.g) return false; clear(); build({g: y.g, cx: y.g.children[0] ? y.g.children[0].position.x : P.x, cz: y.g.children[0] ? y.g.children[0].position.z : P.z}); U.starts++; return true; } catch (e) { ERR('start', e); return false; } };
  U.stop = () => { if (B) U.stops++; clear(); };
  function hook() { const y = window.__c248; if (!y || y.__w22) return !!y; y.__w22 = 1; const s0 = y.start24, s1 = y.stop24;
    y.start24 = function () { const r = s0.apply(this, arguments); try { U.start(); } catch (e) { ERR('s', e); } return r; };
    y.stop24 = function () { try { U.stop(); } catch (e) { ERR('x', e); } return s1.apply(this, arguments); }; return true; }
  if (!hook()) { const iv = setInterval(() => { if (hook()) clearInterval(iv); }, 500); }
  try { const ew = enterWorld; enterWorld = function () { try { U.stop(); } catch (_) {} return ew.apply(this, arguments); }; } catch (e) { ERR('ew', e); }
  try { const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { if (B && (!window.__c248 || __c248.y !== 1)) clear(); step(Math.min(0.1, +dt || 0.016)); } catch (e) { ERR('fr', e); } return r; }; } catch (e) { ERR('us', e); }
})();
