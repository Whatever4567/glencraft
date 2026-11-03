/* GLX-C310 (v1.1.21): pig, sheep and unicorn animation hotfix. The new pig and sheep models are sized from what is really drawn
   (the pig was rendering giant), face the way they walk, and get their own gait: hip swing tied to ground speed with the knees
   lifting on the forward swing (no moonwalk), eased start and stop, a smooth eased graze (head down, hold, up) and no body snapping.
   The unicorn blends idle and walk with an eased weight. All easing is time based. */
(() => {
  const C = window.__c135; if (!C || !C.frame) return;
  const U = window.__c310 = {err: null, fix: 0, cal: 0, n: 0, lp: 1, fd: 1};
  for (const k of ['unicorn', 'nmunicorn']) if (C.cat[k]) C.cat[k].blend = 1;
  if (C.cat.pig) C.cat.pig.noclip = 1; if (C.cat.sheep) C.cat.sheep.noclip = 1;
  const KF = {pig2: {amp: 0.5, lift: 0.8}, sheep2: {amp: 0.5, lift: 0.8}, haggis2: {amp: 0.6, lift: 0.7}};
  const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), v = new THREE.Vector3();
  const ex = (r, dt) => 1 - Math.exp(-dt * r), sm = x => x * x * (3 - 2 * x);
  const turn = (R, j, ang) => { q.setFromAxisAngle(R.ax, ang); q2.copy(j.wp).invert().multiply(q).multiply(j.wp); j.o.quaternion.copy(q2).multiply(j.r); };
  const loc = (a, o) => { o.getWorldPosition(v); return a.g.worldToLocal(v.clone()); };
  function joint(o, mqi) { const pq = new THREE.Quaternion(); o.parent.getWorldQuaternion(pq); return {o, r: o.quaternion.clone(), wp: mqi.clone().multiply(pq)}; }
  function fit(a, H, c) { const M = C.models && C.models[c.f]; if (!M || !M.h) return; H.m.updateMatrixWorld(true); const gs = new THREE.Vector3(); a.g.getWorldScale(gs);
    let b = C.sbox(H.m), h = (b.max.y - b.min.y) / (gs.y || 1); const want = M.h * H.m.scale.y; if (!(h > 0)) return;
    if (Math.abs(want / h - 1) > 0.12) { H.m.scale.multiplyScalar(want / h); U.fix++; }
    H.m.updateMatrixWorld(true); b = C.sbox(H.m); const ce = H.hd.worldToLocal(b.getCenter(new THREE.Vector3())), lo = H.hd.worldToLocal(b.min.clone());
    H.m.position.x -= ce.x; H.m.position.z -= ce.z; H.m.position.y -= lo.y; H.m.updateMatrixWorld(true); }
  function calib(a, H, R) { a.g.updateMatrixWorld(true);
    if (R.head && loc(a, R.head.o).z < 0) { H.hd.rotation.y += Math.PI; a.g.updateMatrixWorld(true); }
    const mq = new THREE.Quaternion(); H.m.getWorldQuaternion(mq); const mqi = mq.invert(), out = [];
    // test points hang below each joint (bone tips are not always at the feet), carried in the joint's own space
    const below = (o, d) => { const w = loc(a, o); w.y -= d; return o.worldToLocal(a.g.localToWorld(w)); }, at = (o, pl) => a.g.worldToLocal(o.localToWorld(pl.clone()));
    for (const {h, L} of R.map) { const i = a.legs.indexOf(L.l), knee = h.o.children.find(o => o.isBone) || null, hy = loc(a, h.o).y, ll = Math.max(0.15, hy * 0.9);
      const ph = below(h.o, ll), f0 = at(h.o, ph); turn(R, h, 0.3); a.g.updateMatrixWorld(true); const fs = Math.sign(at(h.o, ph).z - f0.z) || 1; turn(R, h, 0); a.g.updateMatrixWorld(true);
      let K = null, ks = 1; if (knee && loc(a, knee).y < hy - 0.05) { K = joint(knee, mqi); const pk = below(knee, ll * 0.5), k0 = at(knee, pk); turn(R, K, 0.4); a.g.updateMatrixWorld(true); ks = Math.sign(at(knee, pk).y - k0.y) || 1; turn(R, K, 0); a.g.updateMatrixWorld(true); }
      out.push({h, K, fs, ks, s: i % 2 ? 1 : -1, L: ll}); }
    let hs = 1; if (R.head) { const y0 = loc(a, R.head.o).y; let tip = R.head.o; while (tip.children.find(o => o.isBone)) tip = tip.children.find(o => o.isBone); const t0 = loc(a, tip).y; turn(R, R.head, 0.3); a.g.updateMatrixWorld(true); hs = loc(a, tip).y < t0 ? 1 : -1; turn(R, R.head, 0); }
    U.cal++; return {legs: out, hs, ph: 0, w: 0, gz: 0, py: null, rz: 0}; }
  C.frame.push((a, H, c) => { const K = KF[c.f]; if (!K || !H.r302) return;
    try { const R = H.r302; if (!H.f310) { H.f310 = 1; fit(a, H, c); H.g310 = calib(a, H, R); } const G = H.g310, dt = Math.min(0.1, Math.max(0.001, H.acc || 0.016)), sp = H.v || 0;
      G.w += (Math.min(1, sp / 0.9) - G.w) * ex(4, dt); const Lm = G.legs.length ? G.legs.reduce((s, l) => s + l.L, 0) / G.legs.length : 0.4;
      if (G.w > 0.02) G.ph += dt * Math.min(16, sp / (Lm * K.amp * Math.max(0.3, G.w)));
      const sn = Math.sin(G.ph), cs = Math.cos(G.ph);
      for (const l of G.legs) { const th = l.s * K.amp * G.w * sn; turn(R, l.h, U.fd * l.fs * th); if (l.K) turn(R, l.K, l.ks * K.lift * G.w * Math.max(0, U.lp * l.s * cs)); }
      // grazing: eased head down, hold, up (sheep only); otherwise a gentle nod with the step
      const gz = a.kind === 'sheep' && !a.moving && a.grazeT > 0 && a.grazeT < 1.6 ? 1 : 0; G.gz = Math.max(0, Math.min(1, G.gz + (gz ? dt : -dt) / 0.5));
      const hx = G.hs * (sm(Math.min(1, G.gz)) * 0.95 + G.w * 0.05 * Math.sin(G.ph * 2)); if (R.head) turn(R, R.head, hx * (R.neck ? 0.5 : 1)); if (R.neck) turn(R, R.neck, hx * 0.5);
      // body: ease the procedural bob / roll instead of copying it every frame
      const rg = a.rig; if (rg && c.f === 'pig2') { H.hd.rotation.order = 'ZYX'; H.hd.rotation.z = rg.rotation.z; H.hd.position.x = rg.position.x; H.hd.position.y = rg.position.y; }   /* v1.1.39: the model follows the rig exactly (the pig rig already eases), so a roll never lags off the ground or spins back */
      U.n++; } catch (e) { U.err = String(e && e.stack || e).slice(0, 240); } });
})();
