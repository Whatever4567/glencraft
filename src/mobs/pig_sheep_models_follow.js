/* GLX-C302 (v1.0.110, v1.0.111: the old Glencraft procedural animations drive the new models) - the new pig and sheep models follow the
   original hand-made mob animation that still runs on the hidden procedural body: each leg swing, the head nod / grazing dip, and for
   pigs the lie-down, barrel roll and wiggle in the mud (whole body), plus the mud coat tint. The supplied clips are not used. */
(() => {
  const C = window.__c135; if (!C || !C.frame) return;
  const U = window.__c302 = {n: 0, err: null, rigs: 0};
  const CFG = {pig2: {hips: ['Bone010', 'Bone013', 'Bone004', 'Bone007'], head: 'Bone002', mud: 1},
    sheep2: {hips: ['FrontUpperLegL', 'FrontUpperLegR', 'BackUpperLegL', 'BackUpperLegR'], head: 'Head', neck: 'Neck1'},
    haggis2: {hips: ['LegFL', 'LegFR', 'LegBL', 'LegBR'], head: 'Head'} /* v1.1.23: our own haggis */};
  const nm = s => String(s).replace(/[^A-Za-z0-9]/g, '');
  const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), v = new THREE.Vector3(), XA = new THREE.Vector3(1, 0, 0), MUDC = new THREE.Color(0x5a3d26), WH = new THREE.Color(1, 1, 1);
  function rig(a, H, cf) { const b = {}; H.m.traverse(o => { if (o.isBone) b[nm(o.name)] = o; }); let sk = null; H.m.traverse(o => { if (o.isSkinnedMesh) sk = o; });
    H.mix.stopAllAction(); H.act = {}; H.cur = null; if (sk) sk.skeleton.pose();
    a.g.updateMatrixWorld(true); const gi = new THREE.Quaternion(); a.g.getWorldQuaternion(gi); gi.invert();
    const mq = new THREE.Quaternion(); H.m.getWorldQuaternion(mq); const mqi = mq.clone().invert();
    // the procedural legs rotate about the body x axis: express that axis in model space
    const ax = XA.clone().applyQuaternion(gi.clone().multiply(mq).invert()).normalize();
    const one = o => { if (!o) return null; const pq = new THREE.Quaternion(); o.parent.getWorldQuaternion(pq); return {o, r: o.quaternion.clone(), wp: mqi.clone().multiply(pq)}; };
    const gp = o => { const w = new THREE.Vector3(); o.getWorldPosition(w); return a.g.worldToLocal(w); };
    const legs = (a.legs || []).map(l => ({l, p: gp(l)})), hips = cf.hips.map(n => one(b[n])).filter(Boolean), map = [];
    for (const h of hips) { const p = gp(h.o); let best = null, bd = 1e9; for (const L of legs) { if (map.some(m => m.L === L)) continue; const d = (Math.sign(L.p.z) !== Math.sign(p.z) ? 10 : 0) + (Math.sign(L.p.x) !== Math.sign(p.x) ? 1 : 0); if (d < bd) { bd = d; best = L; } } if (best) map.push({h, L: best}); }
    U.rigs++; return {ax, map, head: one(b[cf.head]), neck: one(cf.neck && b[cf.neck]), rest: {y: H.hd.rotation.y}}; }
  const turn = (j, ang) => { q.setFromAxisAngle(R0.ax, ang); q2.copy(j.wp).invert().multiply(q).multiply(j.wp); j.o.quaternion.copy(q2).multiply(j.r); };
  let R0 = null;
  C.frame.push((a, H, c) => { const cf = CFG[c.f]; if (!cf) return;
    try { const R = H.r302 || (H.r302 = rig(a, H, cf)); R0 = R;
      for (const {h, L} of R.map) turn(h, L.l.rotation.x);
      const hx = a.head ? a.head.rotation.x : 0; if (R.head) turn(R.head, hx * (R.neck ? 0.5 : 1)); if (R.neck) turn(R.neck, hx * 0.5);
      // whole-body roll / lie-down from the procedural rig (pigs in the mud)
      const rg = a.rig; if (rg && cf.mud) { H.hd.rotation.order = 'ZYX'; H.hd.rotation.z = rg.rotation.z; H.hd.position.set(rg.position.x, rg.position.y, 0);
        const mu = a.p8 ? a.p8.mud || 0 : 0; for (const m of H.mats) if (m.color) m.color.copy(WH).lerp(MUDC, Math.min(0.7, mu * 0.7)); }
      U.n++; } catch (e) { U.err = String(e && e.stack || e).slice(0, 240); } });
})();
