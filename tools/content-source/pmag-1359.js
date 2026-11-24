/* GLX-PMAG1359 (t1359): the Highland pistol reloads with a real magazine, the way the RE4 remake and other realistic
   shooters do it. Same 1.6 s reload as before; only the pistol's look and sound change.
   - The magazine is a separate part in the grip. The thumb presses the release, the gun flicks a little and the spent
     magazine drops free out of the grip under gravity (it tumbles and falls out of view).
   - The off hand goes to the belt, brings a fresh magazine up, angles it into the well, slides it in and seats it with a
     palm push (the gun bumps a touch).
   - Empty reload: the slide is locked back; after the magazine is seated the off hand comes over the top, pulls the slide
     to the rear and lets it go so it slams home and chambers a round. Tactical reload (rounds left): no slide work.
   - Sound: the recorded pistol reload is played in beats on each stage (release, magazine in, slide back, slide home)
     instead of the old synth clicks.
   window.__noPmag1359 = 1 (or __pmag1359.on = 0) puts the old reload back (the old C43 and GS1222 code is untouched). */
(function (W) {
  'use strict';
  /* each hook is installed once per page (also across a QA hot reload of this file), so later wrappers that drop our
     flags cannot make it wrap again and again */
  W.__pm1359Hooks = W.__pm1359Hooks || {};
  const U = W.__pmag1359 = {ver: Date.now(), err: null, on: 1, n: 0, frames: 0, empty: 0, rf: -1, ph: 'idle', drop: 0, fresh: 0, seat: 0, freeze: null, qaEmpty: null, beats: [], snd: 1, gap: -1, built: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const T3 = () => W.THREE;
  const off = () => !!W.__noPmag1359 || !U.on;
  const cl = x => Math.max(0, Math.min(1, x));
  const ss = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const ei = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t; };             // ease in (accelerates: the palm slap)
  const eo = (a, b, x) => { const t = cl((x - a) / (b - a)); return 1 - (1 - t) * (1 - t); }; // ease out
  const DUR = () => { try { return (W.GUN && GUN[IT.PISTOL] && GUN[IT.PISTOL].rl) || 1.6; } catch (_) { return 1.6; } };
  /* Stage times as fractions of the reload. Empty: 1.6 s = release 0.10 s, drop and reach to the belt 0.32 s, up to the well
     0.35 s, in and seated 0.25 s, over the top and rack 0.30 s, back to the grip 0.25 s. Tactical skips the rack and uses the
     time to move more calmly. */
  const TE = {rel: 0.035, drop: 0.07, leave: 0.04, belt: 0.27, up: 0.47, ins: 0.555, seat: 0.62, rk0: 0.64, rk1: 0.73, rk2: 0.80, go: 0.83, home: 0.97};
  const TT = {rel: 0.04, drop: 0.08, leave: 0.05, belt: 0.31, up: 0.55, ins: 0.65, seat: 0.72, rk0: 2, rk1: 2, rk2: 2, go: 0.74, home: 0.95};
  U.TE = TE; U.TT = TT;
  const BELT = [-0.2, -0.44, -0.12];   // camera space: the pouch on the left of the belt (as GS1222 had it), off the bottom of the view

  let V, Q, M4, tmp = null;
  function T() { if (tmp) return tmp; const X = T3(); V = (x, y, z) => new X.Vector3(x || 0, y || 0, z || 0); Q = () => new X.Quaternion(); M4 = () => new X.Matrix4();
    tmp = {m1: M4(), m2: M4(), m3: M4(), v1: V(), v2: V(), v3: V(), q1: Q(), q2: Q(), s1: V(1, 1, 1)}; return tmp; }

  function gunHeld() { try { if (typeof held === 'undefined' || !held) return null; const g = held.children[0]; return g && g.userData && g.userData.gun === IT.PISTOL && g.userData.c322 && selId === IT.PISTOL ? g : null; } catch (_) { return null; } }
  function tp() { try { return !!(W.__thirdPerson || (typeof camMode !== 'undefined' && camMode)); } catch (_) { return false; } }

  /* ---- the magazine in the grip ----
     FIX1273 read the quantized GLB raw (r128 does not scale normalized attributes), so its seat moved the magazine ~100 m
     away and the pistol had no visible magazine at all; the GLB's own pose has it outside the gun. Seat it from the real
     geometry instead: the base of the magazine on the base of the grip (bottom quarter of the frame, its centre), so the
     raked magazine runs up inside the grip with the floor plate just showing. FIX1273 leaves a magazine marked here. */
  function ptsOf(mesh, inv, step) { const p = mesh.geometry.attributes.position, a = p.array, nq = p.normalized ? (a instanceof Int16Array ? 1 / 32767 : a instanceof Int8Array ? 1 / 127 : a instanceof Uint16Array ? 1 / 65535 : a instanceof Uint8Array ? 1 / 255 : 1) : 1;
    const mm = M4().multiplyMatrices(inv, mesh.matrixWorld), out = [], v = V(); for (let i = 0; i < p.count; i += Math.max(1, (p.count / (step || 2500)) | 0)) out.push(v.fromBufferAttribute(p, i).multiplyScalar(nq).applyMatrix4(mm).clone()); return out; }
  function lowCentroid(pts, f) { let lo = 1e9, hi = -1e9; for (const q of pts) { if (q.y < lo) lo = q.y; if (q.y > hi) hi = q.y; } const cut = lo + (hi - lo) * f, c = V(); let n = 0; for (const q of pts) if (q.y <= cut) { c.add(q); n++; } return {c: c.divideScalar(Math.max(1, n)), lo, hi}; }
  function seatInGrip(g, mesh, hold) {
    if (mesh.userData.__pm1359Seat === U.ver || U.noSeat) return;
    let F = null; g.traverse(o => { if (!F && o.isMesh && /pistol_a$/.test(o.name || '')) F = o; }); if (!F || !mesh.parent) return;
    hold.updateMatrixWorld(true); g.updateMatrixWorld(true); const inv = M4().copy(hold.matrixWorld).invert();
    const fb = lowCentroid(ptsOf(F, inv), 0.22), mb = lowCentroid(ptsOf(mesh, inv), 0.12);
    // floor plate 4 mm below the frame's lowest point
    const d = V(fb.c.x - mb.c.x, (fb.lo - 0.004) - mb.lo, fb.c.z - mb.c.z);
    // hold space shift -> the mesh parent's space
    const pi = M4().multiplyMatrices(inv, mesh.parent.matrixWorld).invert(); const o0 = V().applyMatrix4(pi), o1 = d.clone().applyMatrix4(pi);
    mesh.position.add(o1.sub(o0)); mesh.updateMatrixWorld(true); mesh.userData.__pm1359Seat = U.ver; mesh.userData.__seated1273 = 1;
    U.seat = {d: d.toArray().map(x => +x.toFixed(4)), frameLo: +fb.lo.toFixed(4), gripC: fb.c.toArray().map(x => +x.toFixed(4))}; }
  /* ---- per gun setup: measure the magazine in hold space, make the spent (drop) and fresh copies ---- */
  function build(g) {
    const X = T3(), u = g.userData, w = u.mag; if (!w || !w.parent) return null;
    if (u.__pm && u.__pm.w === w && u.__pm.ver === U.ver) return u.__pm;
    if (u.__pm) { const o = u.__pm; for (const k of [o.fresh, o.drop, o.anch]) if (k && k.parent) k.parent.remove(k); if (u.anch && u.anch.well === o.anch) u.anch.well = o.well0 || u.anch.well; u.__pm = null; }
    let mesh = null; w.traverse(o => { if (!mesh && o.isMesh && /magazine/i.test(o.name || '')) mesh = o; }); if (!mesh) return null;
    const hold = w.parent; w.position.set(0, 0, 0); w.rotation.set(0, 0, 0); hold.updateMatrixWorld(true);
    try { seatInGrip(g, mesh, hold); } catch (e) { ERR('seat', e); }
    const inv = M4().copy(hold.matrixWorld).invert(), mm = M4().multiplyMatrices(inv, mesh.matrixWorld);
    // the magazine's long axis and its two ends, measured from the vertices (hold space)
    const p = mesh.geometry.attributes.position, a = p.array, nq = p.normalized ? (a instanceof Int16Array ? 1 / 32767 : a instanceof Int8Array ? 1 / 127 : a instanceof Uint16Array ? 1 / 65535 : a instanceof Uint8Array ? 1 / 255 : 1) : 1;
    const pts = []; const v = V(); for (let i = 0; i < p.count; i += Math.max(1, (p.count / 1500) | 0)) { v.fromBufferAttribute(p, i).multiplyScalar(nq).applyMatrix4(mm); pts.push(v.clone()); }
    const c = V(); for (const q of pts) c.add(q); c.divideScalar(pts.length);
    // principal axis by power iteration on the covariance
    const C = [0, 0, 0, 0, 0, 0, 0, 0, 0]; for (const q of pts) { const d = [q.x - c.x, q.y - c.y, q.z - c.z]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i * 3 + j] += d[i] * d[j]; }
    let ax = V(0, 1, 0); for (let it = 0; it < 30; it++) { const n = V(C[0] * ax.x + C[1] * ax.y + C[2] * ax.z, C[3] * ax.x + C[4] * ax.y + C[5] * ax.z, C[6] * ax.x + C[7] * ax.y + C[8] * ax.z); if (n.lengthSq() < 1e-20) break; ax = n.normalize(); }
    if (ax.y < 0) ax.negate();   // points up the grip, into the gun
    let lo = 1e9, hi = -1e9; for (const q of pts) { const t = q.clone().sub(c).dot(ax); if (t < lo) lo = t; if (t > hi) hi = t; }
    const top = c.clone().addScaledVector(ax, hi), base = c.clone().addScaledVector(ax, lo), L = hi - lo;
    // the gun's right axis in hold space (for the angled entry and the tumble)
    const rt = V(1, 0, 0);
    const mk = () => { const k = w.clone(true); const dead = []; k.traverse(o => { if (/^anch_/.test(o.name || '')) dead.push(o); }); for (const o of dead) if (o.parent) o.parent.remove(o); k.visible = false; k.name = 'pmag1359'; k.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.userData.pmag1359 = 1; o.name = 'pm1359_spare_' + (o.name || '').replace(/magazine/gi, 'clip'); } }); return k; };
    /* the copies must not be named "magazine": FIX1273 seats every /magazine_loaded$/ mesh it finds in the gun every frame
       and would keep shifting a copy that is out of the grip */
    const fresh = mk(); hold.add(fresh);
    const drop = mk(); drop.matrixAutoUpdate = true;
    // slide: its rear top point (hold space), where the off hand pinches to rack it
    let sb = null; try { const s = u.slide; s.position.set(0, 0, 0); s.updateMatrixWorld(true); const b = new X.Box3(); s.traverse(o => { if (o.isMesh && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.union(o.geometry.boundingBox.clone().applyMatrix4(M4().multiplyMatrices(inv, o.matrixWorld))); } }); if (!b.isEmpty()) sb = b; } catch (e) { ERR('slideBox', e); }
    const rear = sb ? V((sb.min.x + sb.max.x) / 2, sb.max.y - (sb.max.y - sb.min.y) * 0.15, sb.max.z - (sb.max.z - sb.min.z) * 0.12) : top.clone().add(V(0, 0.05, 0));
    const anch = new X.Object3D(); anch.name = 'anch_pmag1359'; hold.add(anch);
    const S = u.__pm = {ver: U.ver, w, hold, mesh, ax, top, base, c, L, rt, fresh, drop, rear, anch, sb, dropOn: 0, d0: null, seatT: -1, last: -1, beat: {}};
    U.built++; U.geo = {L: +L.toFixed(4), ax: ax.toArray().map(x => +x.toFixed(3)), base: base.toArray().map(x => +x.toFixed(4)), rear: rear.toArray().map(x => +x.toFixed(4)), slideZ: sb ? +(sb.max.z - sb.min.z).toFixed(4) : 0};
    return S;
  }

  /* ---- sound beats cut from the recorded reload (assets/guns/gun_pistol_reload.mp3: release 0.13 s, mag in 0.63-0.71 s,
     slide back 1.07-1.13 s, slide home 1.21-1.25 s) ---- */
  const CUT = {rel: [0.06, 0.16, 0.8], in: [0.56, 0.26, 0.95], back: [1.0, 0.17, 0.85], home: [1.17, 0.36, 1.0]};
  function beat(k) { U.beats.push(k); if (U.beats.length > 12) U.beats.shift(); try { const B = W.__c322 && __c322.buf && __c322.buf.pr; if (!B || typeof AC === 'undefined' || !AC || !U.snd) return 0;
      const c = CUT[k], s = AC.createBufferSource(), gn = AC.createGain(); s.buffer = B; gn.gain.value = c[2] * 0.9 * (SET.sfx == null ? 1 : SET.sfx);
      gn.gain.setValueAtTime(gn.gain.value, AC.currentTime + c[1] - 0.03); gn.gain.linearRampToValueAtTime(0.0001, AC.currentTime + c[1]);
      s.connect(gn); gn.connect(AC.destination); s.start(AC.currentTime, c[0], c[1]); U.played = (U.played || 0) + 1; return 1; } catch (e) { ERR('beat', e); return 0; } }
  U.sndReady = () => { try { return !!(W.__c322 && __c322.buf && __c322.buf.pr); } catch (_) { return false; } };

  /* ---- the timeline ---- */
  function reloadRf() {
    if (U.freeze != null) return +U.freeze;
    try { if (typeof selId !== 'undefined' && selId === IT.PISTOL && W.__c43rf > 0 && W.__c43rf <= 1) return +W.__c43rf; } catch (_) {}
    return -1;
  }
  // world matrix of a hold-space pose: position p, rotation q
  function setLocal(o, p, q) { o.position.copy(p); o.quaternion.copy(q); o.scale.set(1, 1, 1); }
  function camLocalToParent(o, Mcam) { // put o (child of its parent) at the camera space matrix Mcam
    const t = T(); o.parent.updateMatrixWorld(true); t.m1.copy(o.parent.matrixWorld).invert().multiply(camera.matrixWorld).multiply(Mcam); t.m1.decompose(o.position, o.quaternion, o.scale); }
  function holdToCam(S, p, q, out) { const t = T(); S.hold.updateMatrixWorld(true); t.m2.compose(p, q, t.s1.set(1, 1, 1)); out.copy(camera.matrixWorld).invert().multiply(S.hold.matrixWorld).multiply(t.m2); return out; }

  // pose of the fresh magazine in hold space at reload fraction x; returns {p, q, vis, hand: hold space contact point}
  function freshPose(S, x, E, out) {
    const P = E ? TE : TT, X = T3();
    out.vis = x >= P.belt - 0.03 && x < P.seat; out.mode = 'none';
    const qI = Q(); const d = S.L;
    if (x < P.up) {   // belt -> under the well: in camera space
      const k = ss(P.belt - 0.03, P.up, x);
      // pre insert pose: one magazine length below the seat, tipped 14 degrees nose forward (angling in like a real reload)
      const pre = V().addScaledVector(S.ax, -1.08 * d), qa = Q().setFromAxisAngle(S.rt, -0.24);
      const piv = S.top.clone(); const pp = pre.clone().sub(piv).applyQuaternion(qa).add(piv); // tip about the top of the mag
      const Mpre = holdToCam(S, pp, qa, M4());
      const pB = V(BELT[0], BELT[1], BELT[2]), qB = Q().setFromEuler(new X.Euler(0.5, 0.3, 0.9));
      const pP = V().setFromMatrixPosition(Mpre), qP = Q().setFromRotationMatrix(M4().extractRotation(Mpre));
      // curve: up from the belt, in from below and slightly behind the grip
      const ctrl = V(pP.x - 0.03, pB.y * 0.35 + pP.y * 0.65 - 0.06, pP.z + 0.05);
      const a = 1 - k, pos = pB.clone().multiplyScalar(a * a).addScaledVector(ctrl, 2 * a * k).addScaledVector(pP, k * k);
      const qq = qB.clone().slerp(qP, ss(0.15, 0.95, k));
      out.Mcam = M4().compose(pos, qq, V(1, 1, 1)); out.mode = 'cam'; out.k = k; return out;
    }
    // into the well along the grip axis: angled entry straightens out, then the palm slaps it home
    let s; if (x < P.ins) s = 1.08 - 0.96 * ss(P.up, P.ins, x); else s = 0.12 * (1 - ei(P.ins, P.seat, x));
    const tip = -0.24 * (1 - ss(P.up, P.up + (P.ins - P.up) * 0.7, x));
    const qa = Q().setFromAxisAngle(S.rt, tip), piv = S.top.clone(), pp = V().addScaledVector(S.ax, -s * d).sub(piv).applyQuaternion(qa).add(piv);
    out.p = pp; out.q = qa; out.mode = 'hold'; out.s = s; return out;
  }

  const F = {};
  function apply(dt) {
    T(); const g = gunHeld(); if (!g) { U.ph = 'idle'; return; }
    const S = build(g); if (!S) return;
    const u = g.userData, rf = reloadRf(), on = rf > 0 && rf <= 1, X = T3();
    if (!on) {   // idle: seated magazine, copies hidden, anchors back, slide left to C43 (locks back on empty)
      if (S.last >= 0) { S.w.visible = true; S.w.position.set(0, 0, 0); S.fresh.visible = false; S.drop.visible = false; if (S.drop.parent) S.drop.parent.remove(S.drop); restoreAnch(u, S); S.dropOn = 0; S.last = -1; U.ph = 'idle'; }
      U.rf = -1; return; }
    U.frames++;
    try { camera.updateMatrixWorld(true); } catch (_) {}   // hand/held/gun matrices this frame (C350 moved the hand), so the camera space maths below is current
    // start of a reload: empty (slide locked back) or tactical
    if (S.last < 0 || rf < S.last - 0.2) { S.E = U.qaEmpty != null ? !!U.qaEmpty : !!(W.gunMag && gunMag[IT.PISTOL] <= 0); S.dropOn = 0; S.d0 = null; S.beat = {}; U.n++; }
    const E = S.E, P = E ? TE : TT; U.empty = E ? 1 : 0; U.rf = +rf.toFixed(3);
    const D = DUR();
    // ---- beats ----
    const bt = (k, at) => { if (!S.beat[k] && rf >= at && S.last < at + 0.12 && U.freeze == null) { S.beat[k] = 1; beat(k); } };
    bt('rel', P.rel); bt('in', P.seat - 0.02); if (E) { bt('back', P.rk1); bt('home', P.rk2); }
    S.last = rf;
    // ---- gun motion: C43's reload dip, a small flick to the right as the spent magazine is let go, a bump on the palm slap ----
    const rig = u.rig;
    if (rig) { const dip = Math.sin(Math.min(1, rf * 1.15) * Math.PI);
      const flick = Math.sin(cl((rf - P.rel) / 0.09) * Math.PI) * (rf > P.rel ? 1 : 0);
      const bump = rf > P.seat ? Math.exp(-(rf - P.seat) * D * 22) * Math.min(1, (rf - P.seat) * D * 60) : 0;
      const rkm = E ? Math.sin(cl((rf - P.rk1) / (P.rk2 - P.rk1 + 0.03)) * Math.PI) : 0;
      rig.position.set(0, -0.12 * dip + 0.012 * bump, rig.position.z);
      rig.rotation.set(-0.54 * dip + 0.10 * bump - 0.06 * rkm, -0.10 * flick, 0.5 * dip + 0.16 * flick); }
    // ---- slide ----
    if (u.slide) { let z = 0; const lockZ = 0.04;
      if (E) { if (rf < P.rk1) z = lockZ; else if (rf < P.rk2) z = lockZ + 0.008 * ss(P.rk1, P.rk2, rf); else z = (lockZ + 0.008) * (1 - ei(P.rk2, P.rk2 + 0.025, rf)); }
      u.slide.position.z = z; }
    // ---- spent magazine: drops free from the grip ----
    const tDrop = (rf - P.drop) * D;
    if (rf < P.drop) { S.w.visible = true; S.w.position.set(0, 0, 0); S.drop.visible = false; }
    else {
      S.w.visible = rf >= P.seat;   // seated again once the fresh one is home
      S.w.position.set(0, 0, 0);
      if (typeof hand !== 'undefined' && hand && S.drop.parent !== hand) hand.add(S.drop);
      if (!S.d0 || U.freeze != null) { // release pose in camera space; the camera's down and the mag's axis there
        S.w.updateMatrixWorld(true); const M0 = M4().copy(camera.matrixWorld).invert().multiply(S.w.matrixWorld);
        const p0 = V(), q0 = Q(), s0 = V(); M0.decompose(p0, q0, s0);
        const axC = S.ax.clone().transformDirection(M4().copy(camera.matrixWorld).invert().multiply(S.hold.matrixWorld));
        const rtC = V(1, 0, 0).transformDirection(M4().copy(camera.matrixWorld).invert().multiply(S.hold.matrixWorld));
        const down = V(0, -1, 0).applyQuaternion(camera.getWorldQuaternion(Q()).invert());
        const Lc = S.L * s0.x;                         // magazine length in camera space units
        const k = Lc / 0.125;                          // camera units per metre (a 9 mm double stack magazine is about 12.5 cm)
        // the pivot of the magazine holder is not the magazine centre: carry the centre so the spin looks right
        const cC = S.c.clone().applyMatrix4(M4().copy(camera.matrixWorld).invert().multiply(S.hold.matrixWorld));
        S.d0 = {M0, p0, q0, s0, axC, rtC, down, k, cC, ofs: p0.clone().sub(cC)};
      }
      const d0 = S.d0, t = Math.max(0, tDrop), gk = 9.8 * d0.k;
      // out of the well along the grip (pushed by the spring and the flick) then free fall with a slow tumble
      const cpos = d0.cC.clone().addScaledVector(d0.axC, -(0.9 * d0.k) * t).addScaledVector(d0.down, 0.5 * gk * t * t).addScaledVector(d0.rtC, 0.25 * d0.k * t);
      const spin = Q().setFromAxisAngle(d0.rtC, -5.0 * t * t * 4).multiply(Q().setFromAxisAngle(d0.axC, 2.2 * t));
      const q = spin.clone().multiply(d0.q0), pos = cpos.clone().add(d0.ofs.clone().applyQuaternion(spin));
      const vis = t < 0.7 && cpos.y > -0.9;
      S.drop.visible = vis; if (vis && S.drop.parent) camLocalToParent(S.drop, M4().compose(pos, q, d0.s0));
      U.drop = vis ? 1 : 0; U.dropY = +cpos.y.toFixed(3);
    }
    // ---- fresh magazine and the off hand ----
    const fp = freshPose(S, rf, E, F);
    S.fresh.visible = !!fp.vis; U.fresh = fp.vis ? 1 : 0;
    if (fp.vis) { if (fp.mode === 'cam') camLocalToParent(S.fresh, fp.Mcam); else setLocal(S.fresh, fp.p, fp.q); }
    // the hand contact point: the base plate of the magazine it holds (palm under it on the slap), then the slide rear
    S.fresh.updateMatrix(); const baseP = S.base.clone().applyMatrix4(S.fresh.matrix).addScaledVector(S.ax, -0.004);
    let tgt = baseP, w = 0, wl = 0, rk = 0, ph = 'release';
    if (rf < P.leave) { w = 0; ph = 'release'; }
    else if (rf < P.belt) { w = ss(P.leave, P.leave + 0.08, rf); ph = rf < P.drop + 0.06 ? 'mag out' : 'belt';
      // reach down to the pouch: the hand target leads the magazine (it is not in the hand yet)
      const k = ss(P.leave, P.belt, rf); const beltH = V(BELT[0], BELT[1], BELT[2]); S.hold.updateMatrixWorld(true);
      const pH = camera.localToWorld(beltH.clone()); S.hold.worldToLocal(pH);
      const sup = S.base.clone().addScaledVector(S.ax, 0.35 * S.L);
      tgt = sup.lerp(pH, k); }
    else if (rf < P.seat) { w = 1; ph = rf < P.up ? 'belt' : 'insert'; wl = ss(P.ins - 0.02, P.seat, rf); }
    else if (E && rf < P.go) { w = 1; ph = 'cycle';
      const k = ss(P.seat + 0.005, P.rk0 + 0.04, rf); const rear = S.rear.clone(); rear.z += u.slide ? u.slide.position.z : 0;
      const seatBase = S.base.clone().addScaledVector(S.ax, -0.004);
      tgt = seatBase.lerp(rear, k); wl = 1 - ss(P.seat, P.rk0, rf); rk = ss(P.seat + 0.01, P.rk0 + 0.02, rf) * (1 - ss(P.rk2, P.go + 0.02, rf)); }
    else { ph = 'return'; const at = E ? P.go : P.seat; w = 1 - ss(at, P.home, rf);
      if (E) { const rear = S.rear.clone(); rear.z += u.slide ? u.slide.position.z : 0; tgt = rear.add(V(-0.004, 0.02 * ss(at, at + 0.05, rf), 0)); rk = 1 - ss(at, at + 0.06, rf); }
      else { tgt = S.base.clone().addScaledVector(S.ax, -0.004); wl = 1 - ss(at, at + 0.08, rf); } }
    rk *= (U.rkGain == null ? 1 : U.rkGain);
    S.anch.position.copy(tgt); S.anch.updateMatrixWorld(true);
    U.ph = ph; U.w = +w.toFixed(3); U.wl = +wl.toFixed(3); U.rk = +rk.toFixed(3);
    S.phase = {phase: ph, to: 'well', w, belt: 0, well: wl, rk};
    swapAnch(u, S);
  }
  function swapAnch(u, S) { const a = u.anch; if (!a) return; if (a.well !== S.anch) { if (a.well && a.well !== S.anch) S.well0 = a.well; a.well = S.anch; } }
  function restoreAnch(u, S) { const a = u.anch; if (a && a.well === S.anch) a.well = S.well0 || a.well; }

  /* hand phases: GS1222's pistol phases come from here while this is on (the musket keeps its own) */
  function hookRl() { const G = W.__gs1222; if (!G || !G.rl2 || G.rl2.__pm1359 || W.__pm1359Hooks.rl) return true; W.__pm1359Hooks.rl = 1;
    const prev = G.rl2; G.rl2 = function (isP, x) { try { const Z = W.__pmag1359; if (isP && Z && Z.phaseNow) { const r = Z.phaseNow(); if (r) return r; } } catch (e) { ERR('rl2', e); } return prev.apply(this, arguments); };
    G.rl2.__pm1359 = 1; return true; }

  function hookHand() { try { if (typeof updateHand !== 'function' || updateHand.__pm1359 || W.__pm1359Hooks.hand) return; W.__pm1359Hooks.hand = 1; const uh = updateHand;
      const f = function (dt) { try { const Z = W.__pmag1359; if (Z && Z.tick) Z.tick(dt); } catch (e) { ERR('apply', e); } return uh.apply(this, arguments); };
      for (const k in uh) try { f[k] = uh[k]; } catch (_) {} f.__pm1359 = 1; updateHand = f; } catch (e) { ERR('hookHand', e); } }
  function cleanup() { try { const g = gunHeld(); const S = g && g.userData.__pm; if (S && S.last >= 0) { S.w.visible = true; S.w.position.set(0, 0, 0); S.fresh.visible = false; S.drop.visible = false; restoreAnch(g.userData, S); S.last = -1; } } catch (_) {} }

  U.tick = dt => { try { if (U._poseOn && !U.pinActive()) poses(0); if (U.freeze != null) qaHold(+U.freeze); if (!off()) { apply(dt); } else { cleanup(); if (U.freeze != null) oldFreeze(+U.freeze); } } catch (e) { ERR('apply', e); } };
  /* QA only: hold every reload clock at one fraction (C43's __c43rf and GLX-RLA's __rl, which the arm rig reads) */
  function qaHold(rf) { W.__c43rf = rf; try { const R = W.__rl; if (R) { R.dur = DUR(); R.t = rf > 0 && rf < 1 ? R.dur * (1 - rf) : 0; R.id = IT.PISTOL; } } catch (_) {} }
  /* QA only: hold the OLD reload (C43 + GS1222, flag off) at a reload fraction, for before/after frame strips.
     The same formulas as C43's pistol branch (the rig dip is undone by the C350 viewmodel in first person). */
  function oldFreeze(rf) { const g = gunHeld(); if (!g) return; W.__c43rf = rf; const u = g.userData, rlOn = rf > 0 && rf < 1;
    const dip = rlOn ? Math.sin(Math.min(1, rf * 1.15) * Math.PI) : 0; if (u.rig) { u.rig.position.set(0, -0.12 * dip, 0); u.rig.rotation.set(-0.9 * dip * 0.6, 0, 0.5 * dip); }
    const magOut = rlOn ? (rf < 0.25 ? rf / 0.25 : rf < 0.55 ? 1 - (rf - 0.25) / 0.3 : 0) : 0; if (u.mag) { u.mag.position.y = -0.12 * magOut; u.mag.visible = magOut < 0.98; }
    const rack = rlOn && rf > 0.8 ? Math.sin((rf - 0.8) / 0.2 * Math.PI) : 0; if (u.slide) u.slide.position.z = 0.04 * Math.max(rack, (W.gunMag && gunMag[IT.PISTOL] <= 0) ? 1 : 0); }
  U.phaseNow = () => { if (off()) return null; const g = gunHeld(), S = g && g.userData.__pm; return S && S.phase && U.rf > 0 ? S.phase : null; };
  /* Reload "present" pose. The C350 viewmodel cancels the rig's own reload tilt in first person, and on a landscape phone
     the hotbar covers the bottom of the grip, so the magazine change was out of sight. While reloading the gun is brought
     up and in, the muzzle tipped up and right and the grip rolled so the magazine well faces the off hand and the camera
     (as Leon and most realistic shooters do). Applied before the arms are solved, so both hands stay on the gun. */
  /* palm-down overhand rack (index.html __fpa support grip reads U.rk). At 1 the IK swung the whole left arm across the
     screen from above (TV strip), so it is off by default; the hand still travels to the slide rear for the rack. */
  if (U.rkGain == null) U.rkGain = 0;
  U.pose = U.pose || {x: -0.02, y: 0.03, z: 0.0, rx: 0.10, ry: 0.10, rz: -0.7};
  // the delta (camera space) for this frame, or null
  function presentDelta() { if (off() || !(U.rf > 0) || typeof hand === 'undefined' || !hand || hand.parent !== camera) return null;
    const g = gunHeld(); if (!g || !W.__vm || !__vm.on) return null; const S = g.userData.__pm; if (!S) return null;
    const X = T3(), rf = U.rf, P = S.E ? TE : TT, D = DUR(), o = U.pose;
    const pw = ss(0, 0.13, rf) * (1 - ss(P.home - 0.1, 1, rf));
    const flick = rf > P.rel ? Math.sin(cl((rf - P.rel) / 0.08) * Math.PI) : 0;
    // the rack (empty only): the gun is pushed a little further out and turned so its left flank faces the camera, so the off
    // hand working the slide rear stays a normal size instead of filling the lens
    const rkw = S.E ? ss(P.seat - 0.02, P.rk0, rf) * (1 - ss(P.rk2, P.go + 0.06, rf)) : 0, R = U.rackPose || {z: -0.06, y: -0.01, ry: 0.3, rz: -0.12};
    const bump = rf > P.seat ? Math.exp(-(rf - P.seat) * D * 22) * Math.min(1, (rf - P.seat) * D * 60) : 0;
    const slam = S.E && rf > P.rk2 ? Math.exp(-(rf - P.rk2) * D * 20) * Math.min(1, (rf - P.rk2) * D * 60) : 0;
    const a = g.userData.anch && g.userData.anch.grip; if (!a) return null;
    camera.updateMatrixWorld(true); hand.updateMatrixWorld(true); const piv = camera.worldToLocal(a.getWorldPosition(V()));
    const q = Q().setFromEuler(new X.Euler(o.rx * pw + 0.06 * bump + 0.08 * slam, o.ry * pw - 0.05 * flick + R.ry * rkw, o.rz * pw + 0.14 * flick + R.rz * rkw, 'YXZ'));
    const t = V(o.x * pw, o.y * pw + 0.006 * bump + R.y * rkw, o.z * pw + 0.004 * slam + R.z * rkw);
    U.pw = +pw.toFixed(3); return {piv, q, t}; }
  /* Applied at draw time to the gun AND the arm rig together (a rigid move about the grip), so whatever placed the hands
     upstream, they stay exactly where they were on the gun. Restored straight after the frame. */
  function wrapRender() { try { if (typeof renderer === 'undefined' || !renderer || renderer.render.__pm1359) return; const rd = renderer.render;
      const f = function (sc0, cam) { let saved = null;
        try { const Z = W.__pmag1359; const d = sc0 === scene && cam === camera && Z && Z.presentMode === 'render' && Z.presentDelta ? Z.presentDelta() : null;
          if (d) { const R = W.__fpa && __fpa.rig ? __fpa.rig() : null; const objs = [hand].concat(R && R.parent === camera ? [R] : []); saved = [];
            for (const o of objs) { saved.push([o, o.position.clone(), o.quaternion.clone()]); o.position.sub(d.piv).applyQuaternion(d.q).add(d.piv).add(d.t); o.quaternion.premultiply(d.q); o.updateMatrixWorld(true); } } } catch (e) { ERR('present', e); saved = saved || null; }
        try { return rd.apply(this, arguments); } finally { if (saved) for (const [o, p, q] of saved) { o.position.copy(p); o.quaternion.copy(q); o.updateMatrixWorld(true); } } };
      for (const k of Object.keys(rd)) { try { f[k] = rd[k]; } catch (_) {} } f.__pm1359 = 1; renderer.render = f; } catch (e) { ERR('wr', e); } }
  U.presentDelta = presentDelta;
  /* Default: the gun alone is moved before the arms are solved (the arm rig follows it as far as it reaches). The draw time
     rigid move above swung the whole sleeve into view, so it is kept but off (presentMode 'render'). */
  U.presentMode = U.presentMode || 'step';
  function present() { if (U.presentMode !== 'step' || !W.__fpa || !__fpa.fromVm) return; const d = presentDelta(); if (!d) return;
    hand.position.sub(d.piv).applyQuaternion(d.q).add(d.piv).add(d.t); hand.quaternion.premultiply(d.q); hand.updateMatrixWorld(true); }
  function wrapStep() { try { const F = W.__fpa; if (!F || typeof F.step !== 'function' || F.step.__pm1359 || W.__pm1359Hooks.step) return; W.__pm1359Hooks.step = 1; const prev = F.step;
      F.step = function () { try { const Z = W.__pmag1359; if (Z && Z.present) Z.present(); } catch (e) { ERR('present', e); } return prev.apply(this, arguments); };
      for (const k of Object.keys(prev)) { try { F.step[k] = prev[k]; } catch (_) {} } F.step.__pm1359 = 1; } catch (e) { ERR('ws', e); } }
  U.present = present;

  /* ---- round 2: the gun is pinned in the right hand for the whole reload ----
     The __fpa rig solves the right hand onto the grip (GS1222 grip frame: palm on the grip, fingers round it, wrist
     0.075 back along the fingers and 0.032 off the palm). Later passes (the held-frame rest offset and item scale, the
     arm rig scale) then move the gun and the arms apart, so in the reload the gun floated away from both hands. At draw
     time the gun is moved rigidly so its grip frame lands exactly in the drawn right hand, and the left arm gets the same
     move (it was solved on the same gun), like glx-fp1347 seats the musket hands. Restored straight after the frame.
     The 1285 reload wrist pull (wrist dragged onto the grip point, fingertip seated on it) is skipped while this runs.
     __pmag1359.pin = 0 turns it off. */
  if (U.pin == null) U.pin = 1;
  U.hg = U.hg || {k: 0.62, n: 0.03, u: 0.0, yaw: 0, rake: 0, flip: 0};
  U.pinActive = () => { try { return !off() && !!U.pin && U.rf > 0 && !tp() && !!W.__vm && !!__vm.on && !!gunHeld() && !!W.__fpa && !!__fpa.on; } catch (_) { return false; } };
  function pinDelta() {
    if (!U.pinActive()) return null; const X = T3(), g = gunHeld(), R = __fpa.rig && __fpa.rig(); if (!g || !R || R.parent !== camera || !R.visible) return null;
    const A = R.userData.R, h = A && A.visible && A.userData.p && A.userData.p.h; if (!h || !W.__gs1222 || !__gs1222.gun || !__gs1222.af) return null;
    camera.updateMatrixWorld(true); hand.updateMatrixWorld(true); R.updateMatrixWorld(true);
    const ci = new X.Matrix4().copy(camera.matrixWorld).invert(), loc = o => new X.Vector3().setFromMatrixPosition(o.matrixWorld).applyMatrix4(ci);
    const u = g.userData, mz = u.muzzle ? loc(u.muzzle) : null, fw = mz ? mz.sub(loc(g)).normalize() : new X.Vector3(0, 0, -1);
    const S = u.__pm; if (!S) return null;
    // the gun's grip frame (camera space): the magazine centre (inside the grip), the grip axis (up the magazine), the barrel
    const hm = new X.Matrix4().multiplyMatrices(ci, S.hold.matrixWorld), G = S.c.clone().applyMatrix4(hm);
    const ga = S.ax.clone().transformDirection(hm), bf = fw.clone().addScaledVector(ga, -fw.dot(ga)).normalize(), br = new X.Vector3().crossVectors(bf, ga).normalize();
    // the glove's fist frame (hand space, from its bones): knuckle line pinky -> index is up the grip, wrist -> knuckles
    // along the barrel, the grip centre between the palm and the curled fingers (tunable: U.hg)
    const st = W.__handsFp1285 && __handsFp1285.sides && __handsFp1285.sides.R; if (!st || !st.prox || st.prox.length < 4) return null;
    const hi = new X.Matrix4().copy(h.matrixWorld).invert(), hb = o => { o.updateWorldMatrix(true, false); return new X.Vector3().setFromMatrixPosition(o.matrixWorld).applyMatrix4(hi); };
    const k0 = hb(st.prox[0]), k3 = hb(st.prox[3]), kc = k0.clone().add(k3).multiplyScalar(0.5), wr = hb(st.hand || st.wrap), o = U.hg;
    const up = k0.clone().sub(k3).normalize(); if (o.inv) up.negate(); const fy = kc.clone().sub(wr); fy.addScaledVector(up, -fy.dot(up)).normalize();
    const nz = new X.Vector3().crossVectors(up, fy).normalize();   // palm side (sign checked by the frames; U.hg.flip turns it over)
    const gH = wr.clone().lerp(kc, o.k).addScaledVector(nz, o.n * (o.flip ? -1 : 1)).addScaledVector(up, o.u);
    // hand space -> camera space
    const Mh = new X.Matrix4().multiplyMatrices(ci, h.matrixWorld);
    const gC = gH.clone().applyMatrix4(Mh), upC = up.clone().transformDirection(Mh), fC0 = fy.clone().transformDirection(Mh);
    const qr = new X.Quaternion().setFromAxisAngle(upC, o.yaw); const fC = fC0.applyQuaternion(qr); fC.addScaledVector(upC, -fC.dot(upC)).normalize();
    const tilt = new X.Quaternion().setFromAxisAngle(new X.Vector3().crossVectors(fC, upC).normalize(), o.rake); fC.applyQuaternion(tilt); const upT = upC.clone().applyQuaternion(tilt);
    const rC = new X.Vector3().crossVectors(fC, upT).normalize();
    const Mg = new X.Matrix4().makeBasis(br, ga, bf).setPosition(G), Mt = new X.Matrix4().makeBasis(rC, upT, fC).setPosition(gC);
    const D = Mt.multiply(Mg.invert()), dp = new X.Vector3(), dq = new X.Quaternion(), ds = new X.Vector3(); D.decompose(dp, dq, ds);
    if (!isFinite(dp.x + dp.y + dp.z + dq.w) || dp.length() > 0.6) return null;
    // fade in at the start of the reload and out at the end (no pop)
    const w = ss(0, 0.05, U.rf) * (1 - ss(0.95, 1, U.rf)); U.pinW = +w.toFixed(3); U.pinD = +dp.length().toFixed(3); U.pinA = +(2 * Math.acos(Math.min(1, Math.abs(dq.w)))).toFixed(3);
    dp.multiplyScalar(w); dq.slerp(new X.Quaternion(), 1 - w);   // = identity.slerp(dq, w)
    return new X.Matrix4().compose(dp, dq, new X.Vector3(1, 1, 1));
  }
  function moveCam(o, Dc) { // apply a camera space rigid move to an object somewhere under the camera
    const X = T3(), ci = new X.Matrix4().copy(camera.matrixWorld).invert(); o.updateMatrixWorld(true);
    const Mo = new X.Matrix4().multiplyMatrices(ci, o.matrixWorld), Mn = new X.Matrix4().multiplyMatrices(Dc, Mo);
    const Pp = new X.Matrix4().multiplyMatrices(ci, o.parent.matrixWorld).invert(); Mn.premultiply(Pp); Mn.decompose(o.position, o.quaternion, new X.Vector3()); o.updateMatrixWorld(true); }
  /* ---- round 2b: both hands seated on the gun from gun-space frames (like glx-fp1347 seats the musket hands) ----
     Each hand pose is a grip frame in the gun's hold space (or the fresh magazine's): G the point held, Y the finger
     direction, Z the palm normal (into what is held); the wrist goes 0.075 back along the fingers and 0.034 off the palm,
     the same formula the __fpa solve and the musket use, so the glove closes round G. Right hand: on the grip for the whole
     reload. Left hand: down at the belt (off screen) while the spent magazine drops, carrying the fresh magazine up, palm
     under it for the slap, over the slide for the rack (empty), then back down. Applied at draw time, restored after.
     __pmag1359.hands = 0 turns it off; __pmag1359.HF holds the frames (tunable). */
  if (U.hands == null) U.hands = 1;
  U.HF = U.HF || {
    R: {g: [0, 0.10, 0], c: [0, -0.012, 0], fa: [0.5, -0.7, 0.5], side: 1},       // g: along the grip axis from the magazine centre (x L); c: fist centre nudge (hand space)
    Lc: {g: [0, -0.2, 0], c: [0, -0.012, 0], fa: [-0.5, -0.7, 0.45]},     // carrying the fresh magazine
    Ls: {d: 0.15, c: [0, -0.03, 0], fa: [-0.45, -0.8, 0.35]},             // palm under the base plate (d: below it, x L)
    Lr: {d: 0.1, f: 0.03, s: 0, c: [0, -0.012, 0], fa: [-0.85, -0.45, 0.25]},             // palm over the slide rear (d: above it, x L)
    belt: [-0.16, -0.40, -0.16], faR: 0.85, faL: 0.7
  };
  function frameM(G, y0, z0, off, oz, sA) { const X = T3(); const z = z0.clone().normalize(), y = y0.clone().addScaledVector(z, -y0.dot(z)).normalize(), x = new X.Vector3().crossVectors(y, z).normalize();
    const pos = G.clone().addScaledVector(y, -off * sA).addScaledVector(z, -oz * sA); return new X.Matrix4().makeBasis(x, y, z).setPosition(pos); }
  // a hand's world matrix that puts its fist centre at G with the knuckle line along up and the fingers along fwd
  function fistM(side, G, up, fwd, o) {
    const X = T3(), R = __fpa.rig(), arm = R.userData[side], h = arm && arm.userData.p && arm.userData.p.h, st = W.__handsFp1285 && __handsFp1285.sides && __handsFp1285.sides[side]; if (!h || !st || !st.prox) return null;
    const hi = new X.Matrix4().copy(h.matrixWorld).invert(), hb = b => { b.updateWorldMatrix(true, false); return new X.Vector3().setFromMatrixPosition(b.matrixWorld).applyMatrix4(hi); };
    const pc = V(), dc = V(); for (const b of st.prox) pc.add(hb(b)); pc.divideScalar(st.prox.length); for (const b of st.dist) dc.add(hb(b)); dc.divideScalar(st.dist.length);
    const C = pc.add(dc).multiplyScalar(0.5).add(V(o.c[0], o.c[1], o.c[2]));
    const hs = new X.Vector3(); h.matrixWorld.decompose(new X.Vector3(), new X.Quaternion(), hs);
    // the forearm (it runs back from the wrist along -y of the hand) is given its direction in camera space (o.fa), so it
    // comes up from the bottom of the screen; the knuckle line is then as close to the grip axis as that allows and the
    // palm is turned to face the grip (o.side: the gun side the palm lies on, +1 = the gun's right side)
    let f, u, z;
    if (o.fa) { const fa = V(o.fa[0], o.fa[1], o.fa[2]).transformDirection(camera.matrixWorld); f = fa.negate().normalize();
      u = up.clone().addScaledVector(f, -up.dot(f)).normalize(); z = new X.Vector3().crossVectors(u, f).normalize();
      const rt = new X.Vector3().crossVectors(fwd, up).normalize(), want = o.want ? o.want.clone() : rt.clone().multiplyScalar(-(o.side || 1));
      if (z.dot(want) < 0) { u.negate(); z.negate(); } }
    else { u = up.clone().normalize().multiplyScalar(o.us || 1); f = fwd.clone().addScaledVector(u, -fwd.dot(u)).normalize().multiplyScalar(o.fs || 1); z = new X.Vector3().crossVectors(u, f).normalize(); }
    const Mg = new X.Matrix4().makeBasis(u, f, z).setPosition(G);
    const Rt = new X.Matrix4().makeRotationFromEuler(new X.Euler(o.rx || 0, o.ry || 0, o.rz || 0, 'XYZ'));
    return Mg.multiply(Rt).multiply(new X.Matrix4().makeTranslation(-C.x * hs.x, -C.y * hs.y, -C.z * hs.z));
  }
  function blendM(a, b, k) { const X = T3(); if (k <= 0) return a; if (k >= 1) return b; const pa = new X.Vector3(), qa = new X.Quaternion(), pb = new X.Vector3(), qb = new X.Quaternion(), s1 = new X.Vector3();
    a.decompose(pa, qa, s1); b.decompose(pb, qb, s1); return new X.Matrix4().compose(pa.lerp(pb, k), qa.slerp(qb, k), new X.Vector3(1, 1, 1)); }
  function handPoses(g, S) {   // world matrices for the right and left hand, or null
    const X = T3(), H = U.HF, rf = U.rf, E = S.E, P = E ? TE : TT, Vv = a => new X.Vector3(a[0], a[1], a[2]);
    camera.updateMatrixWorld(true); S.hold.updateWorldMatrix(true, true); const hw = S.hold.matrixWorld, sc = new X.Vector3(); hw.decompose(new X.Vector3(), new X.Quaternion(), sc); const sA = 1;
    const hp = v => v.clone().applyMatrix4(hw), hd = v => v.clone().transformDirection(hw);
    // right: the glove's fist (from its bones) closed round the grip: knuckle line up the grip, wrist -> knuckles along the
    // barrel, palm on the right side of the grip
    const gR = S.c.clone().addScaledVector(S.ax, H.R.g[1] * S.L).add(V(H.R.g[0], 0, H.R.g[2]));
    let MR = fistM('R', hp(gR), hd(S.ax.clone()), hd(V(0, 0, -1)), H.R);
    if (U.relR && U._rel && U._rel.R && MR) { g.updateWorldMatrix(true, false); MR = new X.Matrix4().copy(g.matrixWorld).multiply(U._rel.R); }
    // left poses: a fist round the fresh magazine (palm on its left side), the palm flat under its base plate (the slap),
    // the palm over the slide (the rack); the forearms come up from the lower left (o.fa, camera space)
    S.fresh.updateWorldMatrix(true, false); const fw = S.fresh.matrixWorld, fp = v => v.clone().applyMatrix4(fw), fd = v => v.clone().transformDirection(fw);
    const gfw = hd(V(0, 0, -1)), gup = hd(S.ax.clone()), grt = new X.Vector3().crossVectors(gfw, gup).normalize();
    const gC = S.c.clone().addScaledVector(S.ax, H.Lc.g[1] * S.L);
    const Mc = fistM('L', fp(gC), fd(S.ax.clone()), fd(V(0, 0, -1)), Object.assign({}, H.Lc, {want: fd(V(1, 0, 0))}));
    const Ms = fistM('L', fp(S.base.clone().addScaledVector(S.ax, -H.Ls.d * S.L)), gfw, gup, Object.assign({}, H.Ls, {want: gup}));
    const rear = S.rear.clone(); try { rear.z += g.userData.slide ? g.userData.slide.position.z : 0; } catch (_) {}
    // rack: a pinch round the slide rear from the left (knuckle line up the slide's flank, palm on its left side), the
    // forearm from the lower left, so the hand stays small and on the gun instead of hovering over it
    const Mr = fistM('L', hp(rear.addScaledVector(S.ax, H.Lr.d * S.L)).addScaledVector(gfw, H.Lr.f || 0).addScaledVector(grt, -(H.Lr.s || 0)), gfw, grt, Object.assign({}, H.Lr, {want: gup.clone().negate()}));
    if (!Mc || !Ms || !Mr || !MR) return null;
    camera.updateMatrixWorld(true); const bp = camera.localToWorld(Vv(H.belt)); const Mb = Mc.clone().setPosition(bp);
    let ML;
    if (rf < P.belt - 0.03) ML = Mb;
    else if (rf < P.ins) ML = blendM(Mb, Mc, ss(P.belt - 0.03, P.belt + 0.02, rf));
    else if (rf < P.seat) ML = blendM(Mc, Ms, ss(P.ins, P.ins + 0.035, rf));
    else if (E && rf < P.go) ML = blendM(Ms, Mr, ss(P.seat + 0.005, P.rk0 + 0.03, rf));
    else ML = blendM(E ? Mr : Ms, Mb, ss(E ? P.go : P.seat + 0.01, P.home, rf));
    return {MR, ML, belt: rf < P.belt - 0.01 || rf > P.home - 0.02};
  }
  function seatH(h, Mw, w, fa) { const X = T3(); if (!h || !h.parent || !Mw) return null; const saved = [h, h.position.clone(), h.quaternion.clone()];
    h.parent.updateWorldMatrix(true, false); const m = Mw.clone().premultiply(new X.Matrix4().copy(h.parent.matrixWorld).invert()), p = new X.Vector3(), q = new X.Quaternion(), s1 = new X.Vector3(); m.decompose(p, q, s1);
    if (!isFinite(p.x + p.y + p.z + q.w)) return null; if (w >= 0.999) { h.position.copy(p); h.quaternion.copy(q); } else { h.position.lerp(p, w); h.quaternion.slerp(q, w); } h.updateMatrixWorld(true); return saved; }
  /* finger curls while reloading: the right hand closed round the grip, the left closed on the fresh magazine, flat for the
     slap, half closed over the slide; the 1285 poses are put back after the reload */
  const POSE = {fist: {p: [1.15, 1.5, 1.55, 1.45], d: [1.0, 1.3, 1.35, 1.25], t: [0.95, 0.85], tY: 0.65, tZ: 0.4},
    carry: {p: [1.2, 1.3, 1.35, 1.3], d: [1.05, 1.15, 1.15, 1.05], t: [0.9, 0.7], tY: 0.5, tZ: 0.3},
    flat: {p: [0.12, 0.14, 0.16, 0.18], d: [0.08, 0.1, 0.1, 0.12], t: [0.25, 0.15], tY: 0.2, tZ: 0.05},
    rack: {p: [0.95, 1.0, 1.05, 1.0], d: [0.8, 0.85, 0.9, 0.85], t: [0.7, 0.5], tY: 0.4, tZ: 0.2}};
  const mixPose = (a, b, k) => { const m = (x, y) => Array.isArray(x) ? x.map((v, i) => v + (y[i] - v) * k) : x + (y - x) * k; return {p: m(a.p, b.p), d: m(a.d, b.d), t: m(a.t, b.t), tY: m(a.tY, b.tY), tZ: m(a.tZ, b.tZ)}; };
  const setPose = (P, v) => { P.p = v.p.slice(); P.d = v.d.slice(); P.t = v.t.slice(); P.tY = v.tY; P.tZ = v.tZ; };
  /* off by default: hands-fp-1285 bakes each glove pose once per kind (bakeSidePose), so changing POSES at run time moves
     the bones (and the fist centre measured from them) but not the drawn mesh. */
  if (U.poseCurl == null) U.poseCurl = 0;
  function poses(on, S) { const H = W.__handsFp1285; if (!H || !H.POSES || !H.POSES.pistol || !H.POSES.support) return;
    if (!U._pose0) U._pose0 = {pistol: JSON.parse(JSON.stringify(H.POSES.pistol)), support: JSON.parse(JSON.stringify(H.POSES.support))};
    if (!on) { if (U._poseOn) { setPose(H.POSES.pistol, U._pose0.pistol); setPose(H.POSES.support, U._pose0.support); U._poseOn = 0; } return; }
    const rf = U.rf, P = S.E ? TE : TT, w = ss(0, 0.05, rf) * (1 - ss(0.94, 1, rf));
    setPose(H.POSES.pistol, mixPose(U._pose0.pistol, POSE.fist, w));
    let L = POSE.carry; if (rf >= P.ins) L = mixPose(POSE.carry, POSE.flat, ss(P.ins, P.ins + 0.03, rf)); if (rf >= P.seat) L = mixPose(POSE.flat, S.E ? POSE.rack : U._pose0.support, ss(P.seat, P.seat + 0.04, rf));
    if (S.E && rf >= P.go) L = mixPose(POSE.rack, U._pose0.support, ss(P.go, P.home, rf));
    setPose(H.POSES.support, L); U._poseOn = 1; }
  function seatHands() {
    if (!U.hands || !U.pinActive()) return null; const g = gunHeld(), S = g && g.userData.__pm, R = __fpa.rig && __fpa.rig(); if (!S || !R || !R.visible) return null;
    const hp = handPoses(g, S); if (!hp) return null; if (U.poseCurl) { try { poses(1, S); } catch (e) { ERR('pose', e); } } const w = ss(0, 0.04, U.rf) * (1 - ss(0.96, 1, U.rf)); U.handsW = +w.toFixed(3);
    const out = []; const hR = R.userData.R && R.userData.R.userData.p && R.userData.R.userData.p.h, hL = R.userData.L && R.userData.L.userData.p && R.userData.L.userData.p.h;
    const a = seatH(hR, hp.MR, w); if (a) out.push(a);
    if (R.userData.L && R.userData.L.visible) { const b = seatH(hL, hp.ML, w); if (b) out.push(b); }
    // shorter forearms while the hands work close to the gun, so a sleeve never reaches the lens (put back after the frame)
    U._faS = []; for (const [hh, k] of [[hR, U.HF.faR], [hL, U.HF.faL]]) { const fa = hh && hh.userData.forearm1279; if (fa && k != null) { U._faS.push([fa, fa.scale.y]); fa.scale.y = fa.scale.y * (1 - (1 - k) * w); } }
    if (U.dbg) { try { const X = T3(), st = __handsFp1285.sides.R, pc = new X.PerspectiveCamera(camera.fov, camera.aspect, 0.01, 50); pc.matrixWorld.copy(camera.matrixWorld); pc.matrixWorldInverse.copy(camera.matrixWorld).invert();
        const px = v => { const q = v.clone().project(pc); return [Math.round((q.x + 1) / 2 * innerWidth), Math.round((1 - q.y) / 2 * innerHeight)]; }, wp = o => { o.updateWorldMatrix(true, false); return new X.Vector3().setFromMatrixPosition(o.matrixWorld); };
        const S = gunHeld().userData.__pm; S.hold.updateMatrixWorld(true);
        U.dbgPx = {prox: st.prox.map(b => px(wp(b))), dist: st.dist.map(b => px(wp(b))), hand: px(wp(hR)), G: px(S.c.clone().applyMatrix4(S.hold.matrixWorld)), base: px(S.base.clone().applyMatrix4(S.hold.matrixWorld)), top: px(S.top.clone().applyMatrix4(S.hold.matrixWorld)), rear: px(S.rear.clone().applyMatrix4(S.hold.matrixWorld))}; } catch (e) { U.dbgPx = String(e); } }
    U.handsN = (U.handsN || 0) + 1; return out;
  }
  U.seatHands = seatHands;
  /* the right hand keeps exactly the grip it has when not reloading (the one players already see and like): its matrix
     relative to the gun is captured every idle frame and replayed during the reload, so the gun is pinned in that hand */
  if (U.relR == null) U.relR = 0;   // off: the captured idle relation did not match what is drawn (var11)
  function capRel() { try { if (!U.relR || U.rf > 0 || !W.__vm || !__vm.on || !W.__fpa || !__fpa.on) return; const g = gunHeld(); const R = __fpa.rig && __fpa.rig(); if (!g || !R || !R.visible) return;
      const hR = R.userData.R && R.userData.R.userData.p && R.userData.R.userData.p.h; if (!hR) return; const X = T3();
      g.updateWorldMatrix(true, false); hR.updateWorldMatrix(true, false);
      U._rel = {R: new X.Matrix4().copy(g.matrixWorld).invert().multiply(hR.matrixWorld), n: ((U._rel && U._rel.n) || 0) + 1}; } catch (e) { ERR('cap', e); } }
  U.capRel = capRel;
  function wrapPin() { try { if (typeof renderer === 'undefined' || !renderer || W.__pm1359Hooks.pin) return; W.__pm1359Hooks.pin = 1; const rd = renderer.render;
      const f = function (sc0, cam) { let saved = null;
        try { const Z = W.__pmag1359; if (sc0 === scene && cam === camera && Z && Z.seatHands && Z.hands) { const sv = Z.seatHands(); if (sv) saved = sv; else if (Z.capRel) Z.capRel(); } else if (sc0 === scene && cam === camera && Z && Z.pinDelta) { const Dc = Z.pinDelta(); if (Dc) { const R = __fpa.rig(), L = R && R.userData.L; saved = [];
              for (const o of [hand].concat(L && L.visible ? [L] : [])) { saved.push([o, o.position.clone(), o.quaternion.clone()]); moveCam(o, Dc); } Z.pinN = (Z.pinN || 0) + 1; } } } catch (e) { ERR('pin', e); }
        try { return rd.apply(this, arguments); } finally { if (saved) for (const [o, p, q] of saved) { o.position.copy(p); o.quaternion.copy(q); o.updateMatrixWorld(true); } try { const Z = W.__pmag1359; if (Z && Z._faS) { for (const [fa, y] of Z._faS) fa.scale.y = y; Z._faS = null; } } catch (_) {} } };
      for (const k of Object.keys(rd)) { try { f[k] = rd[k]; } catch (_) {} } f.__pm1359pin = 1; renderer.render = f; } catch (e) { ERR('wp', e); } }
  U.pinDelta = pinDelta;
  U.hook = () => { hookHand(); hookRl(); wrapStep(); wrapPin(); };
  U.enableRenderPresent = () => { U.presentMode = 'render'; wrapRender(); };   // off by default; wraps renderer.render once when asked
  U.hook(); setTimeout(U.hook, 0); let tries = 0; const iv = setInterval(() => { try { hookRl(); hookHand(); wrapStep(); const H = W.__pm1359Hooks; wrapPin(); if ((H.hand && H.rl && H.step && H.pin) || ++tries > 240) clearInterval(iv); } catch (_) {} }, 500);
})(typeof window !== 'undefined' ? window : this);
