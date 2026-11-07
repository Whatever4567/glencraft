import {make} from './hands-harness.mjs'; import {measurer} from './hands-measure.mjs';
// runs every phase on one item and returns per frame records
export async function run(which, opt = {}) {
  const {G, H, IT, PICK} = await make(); if (opt.pre) opt.pre(G); const T = G.THREE, M = measurer(T); const id = which === 'pistol' ? IT.PISTOL : which === 'rifle' ? IT.MUSKET : PICK;
  H.setSel(id); const recs = []; let moving = false, S = null, phase = 'idle', lastE = null, lastL = null, lastH = null, lastV = 0;
  const rebuild = () => { const g = H.held.children[0], u = g.userData; if (which === 'pick') { S = M.surface(g, H.held, /trigger|hammer|Circle|glass/i); return; } const mv = [u.mag, u.slide].filter(Boolean); S = M.parts([[u.rig, mv], ...mv.map(o => [o, []])], H.held); };
  function frame(dt = 1 / 60) { G.__c340.k = G.__vm && G.__vm.k != null ? +G.__vm.k : 0; H.frame(dt, moving); const F = G.__fpa, rig = F.rig && F.rig(); if (!rig || !rig.visible) { recs.push({phase, hidden: 1, on: F.on}); lastE = null; lastH = null; return; }
    if (!S || which === 'pick') rebuild(); const sc = M.relScale(H.held), R = rig.userData.R, L = rig.userData.L, r = {phase, on: F.on, two: F.two, anG: F.anG, rph: F.rph, rel: F.rel};
    const hp = M.handPts(R, H.held); r.gapR = S.near(hp.palmF, 0.06).s * sc; r.gapRm = S.near(hp.palmF, 0.06).m;
    r.penR = Math.max(...[...hp.tips, hp.thumb].map(t => -(S.near(t, 0.02).s * sc) + 0.0069)); r.penRm = [...hp.tips, hp.thumb].map(t => S.near(t, 0.02)).sort((a, b) => a.s - b.s)[0].m; r.R = hp;
    r.wR = M.wristAng(R); const E = R.userData.p.el.position; r.E = E.toArray(); r.fin = [...r.E, R.userData.p.h.quaternion.x].every(Number.isFinite); r.dE = lastE ? E.distanceTo(lastE) : 0; lastE = E.clone();
    if (L.visible) { const lp = M.handPts(L, H.held); r.gapL = S.near(lp.palmF, 0.08).s * sc; r.gapLm = S.near(lp.palmF, 0.08).m; r.penL = Math.max(...[...lp.tips, lp.thumb].map(t => -(S.near(t, 0.02).s * sc) + 0.0069)); r.L = lp; r.wL = M.wristAng(L); const EL = L.userData.p.el.position; r.finL = EL.toArray().every(Number.isFinite); r.dL = lastL ? L.userData.p.h.position.distanceTo(lastL) : 0; lastL = L.userData.p.h.position.clone(); } else lastL = null;
    { const pc = R.userData.p.h.children[0].getWorldPosition(new T.Vector3()); const nd = pc.clone().project(G.camera); r.vis = pc.z < 0 && Math.abs(nd.x) <= 1 && Math.abs(nd.y) <= 1 ? 1 : 0; r.dH = lastH ? pc.distanceTo(lastH) : 0; r.visPrev = lastV; lastH = pc; lastV = r.vis; }
    try { const u = H.held.children[0].userData; if (u.mag) G.__c43min = Math.min(G.__c43min || 0, u.mag.position.y); if (u.slide) G.__c43slide = Math.max(G.__c43slide || 0, u.slide.position.z); } catch (_) {}
    recs.push(r); }
  const P = (name, n, f) => { if (opt.only && !opt.only.includes(name)) return; phase = name; for (let i = 0; i < n; i++) { if (f) f(i); frame(); } };
  for (let i = 0; i < 5; i++) H.frame(1 / 60); rebuild();
  P('idle', 40);
  if (which === 'pistol') { P('aim', 40, i => { G.__c288.aiming = true; }); G.__c288.aiming = false; P('unaim', 30); }
  if (which === 'rifle') { P('aim', 40, i => { G.rmb = true; }); G.rmb = false; P('unaim', 30); }
  if (which === 'pick') { P('swing', 40, i => { if (i === 0 || i === 20) H.swing('chop'); }); }
  else { P('recoil', 24, i => { if (i % 8 === 0) { G.__c340.shots++; H.kick(); } }); const RL = G.GUN[id].rl; G.__rl = {t: 0, dur: RL, id}; G.window.__rl = G.__rl;
    P('reload', Math.round(RL * 60) + 12, i => { if (i === 0) { G.__rl.t = RL; H.startRl(id); } else G.__rl.t = Math.max(0, G.__rl.t - 1 / 60); });
    P('reload-cancel', 40, i => { if (i === 0) { G.__rl.t = RL; H.startRl(id); } else if (i === 30) { G.__rl.t = 0; H.cancelRl(); } else if (G.__rl.t > 0) G.__rl.t -= 1 / 60; }); }
  moving = true; P('sprint', 40, i => { G.sprinting = true; G.bobAmt = 1; G.walkPhase += 0.15; }); moving = false; G.sprinting = false; G.bobAmt = 0;
  P('switch', 40, i => { if (i === 0) H.setSel(which === 'pick' ? IT.PISTOL : PICK); if (i === 20) H.setSel(id); if (i === 21) S = null; });
  P('death', 20, i => { H.hand.visible = i >= 10; }); P('menu', 10, i => { G.started = i >= 5; });
  // elbow near straight: push the hand away from the shoulder in small steps past full reach
  let d = 0; G.__hx = () => { H.hand.position.z -= d; H.hand.position.x += d * 0.4; }; G.window.__hx = G.__hx;
  P('reach', 80, i => { d = i * 0.01; }); G.__hx = null; G.window.__hx = null;
  return {recs, G, H, F: G.__fpa, S};
}
