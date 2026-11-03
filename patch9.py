s=open('s1.js').read()
def R(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:70]); s=s.replace(a,b)
R("sfx('jump'); }","sfx('jump', 1, matOf(getB(Math.floor(P.x), Math.floor(P.y - 0.5), Math.floor(P.z)))); }")
R("  if (swingNow) sfx('dig', .8, matOf(b));","  if (swingNow) { sfx('dig', .8, matOf(b)); shake(0.05, 0.006); }")
R("""function damageMob(a, dmg, byPlayer) {
  a.hp -= dmg; a.flash = 0.25;""","""function damageMob(a, dmg, byPlayer) {
  a.hp -= dmg; a.flash = 0.25;
  if (byPlayer) { shake(0.09, 0.014); const p = a.g.position; burst(p.x, p.y + (a.hitY || 0.8), p.z, a.hostile ? 0xd8d2c0 : 0xb03020, 7, 0.7); }""")
# pickup arc
R("""      // magnet towards the player, then collect
      const k = Math.min(1, dt * 9);
      d.x += (px - d.x) * k; d.y += (py - d.y) * k; d.z += (pz - d.z) * k; d.rest = false;
      if (dist < 0.6) { addItem(d.id, d.n); sfx('pop'); scene.remove(d.m); drops.splice(i, 1); continue; }""",
"""      // GLX-B6: hops up in a little arc into your hands, shrinking as it arrives
      if (d.pick === undefined) { d.pick = 0; d.sx = d.x; d.sy = d.y; d.sz = d.z; d.s0 = d.m.scale.x; }
      d.pick = Math.min(1, d.pick + dt / 0.24); const e = d.pick * d.pick * (3 - 2 * d.pick);
      d.x = d.sx + (px - d.sx) * e; d.z = d.sz + (pz - d.sz) * e; d.y = d.sy + (py - d.sy) * e + Math.sin(d.pick * Math.PI) * 0.55; d.rest = false;
      const sc = d.s0 * (1 - 0.6 * Math.max(0, d.pick - 0.5) * 2); d.m.scale.setScalar(sc);
      if (d.pick >= 1) { addItem(d.id, d.n); sfx('pop'); scene.remove(d.m); drops.splice(i, 1); continue; }""")
R("""    } else if (!d.rest) {
      d.vy -= 18 * dt;""","""    } else if (!d.rest) {
      if (d.pick !== undefined) { d.pick = undefined; d.m.scale.setScalar(d.s0); }
      d.vy -= 18 * dt;""")
# armour fit
R("""    if (slot === 0) { add(u.head, 0.56, 0.24, 0.56, 0, 0.46, 0, m);""","""    if (u.fit !== false) { fitPiece(add, u, slot, m); return; }
    if (slot === 0) { add(u.head, 0.56, 0.24, 0.56, 0, 0.46, 0, m);""")
# arm swing in 3rd person a bit livelier + held tool aim
R("""  u.arms[0].rotation.x = -sw * 0.8;
  let ax = sw * 0.8 - (held.children.length ? 0.35 : 0), az = 0, ay = 0;""","""  u.arms[0].rotation.x = -sw * 0.8; u.arms[0].rotation.z = -0.06 - Math.abs(sw) * 0.05;
  u.torso.rotation.y = sw * 0.06; worldModel.position.y += Math.abs(Math.sin(bobPhase)) * 0.04 * bobAmp;
  let ax = sw * 0.8 - (held.children.length ? 0.55 : 0), az = held.children.length ? 0.08 : 0, ay = 0;""")
s += r"""
/* ===================== FEEL B6: realistic sounds, armour fit, phone performance guard ===================== */
// snug armour sized off the player model's real body parts (head 0.5 cube + hair, torso 0.5x0.62x0.28, arms 0.2x0.5, legs 0.19-0.21, shoes 0.23x0.12x0.3)
function fitPiece(add, u, slot, m) {
  if (slot === 0) {
    add(u.head, 0.6, 0.12, 0.6, 0, 0.6, 0, m);                       // crown over the hair
    for (const sx of [-1, 1]) add(u.head, 0.04, 0.4, 0.6, sx * 0.3, 0.36, 0, m);   // cheek plates
    add(u.head, 0.6, 0.42, 0.04, 0, 0.35, -0.3, m);                   // back
    add(u.head, 0.6, 0.07, 0.04, 0, 0.5, 0.3, m);                     // brow band
    add(u.head, 0.045, 0.15, 0.03, 0, 0.38, 0.31, m);                 // nose guard
  }
  if (slot === 1) {
    add(u.torso, 0.56, 0.58, 0.36, 0, 1.19, 0, m);                    // breast & back plate over the shirt and sash
    add(u.torso, 0.58, 0.06, 0.38, 0, 0.92, 0, m);                    // fauld at the waist
    u.arms.forEach(a => { add(a, 0.27, 0.11, 0.27, 0, 0.0, 0, m); add(a, 0.235, 0.42, 0.235, 0, -0.24, 0, m); });  // pauldron + full sleeve (hands left bare)
  }
  if (slot === 2) {
    const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.315, 0.385, 0.3, 20, 1, true), m); sk.scale.z = 0.64; sk.position.y = 0.72; m.side = THREE.DoubleSide; u.torso.add(sk); u.armourParts.push(sk);
    u.legs.forEach(l => add(l, 0.235, 0.29, 0.235, 0, -0.2, 0, m));
  }
  if (slot === 3) u.legs.forEach(l => { add(l, 0.255, 0.14, 0.33, 0, -0.44, 0.03, m); add(l, 0.245, 0.09, 0.245, 0, -0.33, 0, m); });
}

// --- realistic material sounds: clusters of tiny filtered-noise grains + a low body thump, randomised every time ---
const REAL_MAT = {
  grass:  {n: 7,  lo: 1600, hi: 4800, q: 1.1, g: 0.028, spread: 0.07, body: [95, 0.16], rustle: 0.12},
  dirt:   {n: 6,  lo: 260,  hi: 1300, q: 0.9, g: 0.04,  spread: 0.05, body: [72, 0.38], rustle: 0.05},
  sand:   {n: 14, lo: 2400, hi: 7600, q: 0.7, g: 0.018, spread: 0.11, body: [80, 0.1],  rustle: 0.18},
  stone:  {n: 4,  lo: 1400, hi: 3800, q: 3.2, g: 0.022, spread: 0.025, body: [115, 0.3], click: 0.25},
  wood:   {n: 3,  lo: 380,  hi: 950,  q: 4,   g: 0.05,  spread: 0.02, body: [180, 0.34], knock: 1},
  leaves: {n: 16, lo: 2800, hi: 8500, q: 0.6, g: 0.02,  spread: 0.16, body: [0, 0],     rustle: 0.22},
  wool:   {n: 3,  lo: 220,  hi: 600,  q: 0.6, g: 0.06,  spread: 0.04, body: [70, 0.12]},
  metal:  {n: 3,  lo: 2500, hi: 5200, q: 6,   g: 0.03,  spread: 0.02, body: [140, 0.2], ring: 1},
  glass:  {n: 6,  lo: 3500, hi: 9000, q: 5,   g: 0.02,  spread: 0.03, body: [0, 0],     click: 0.3}
};
function grain(t, f, q, dur, peak, dest, type) {
  const s = AC.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = 0.8 + Math.random() * 0.5;
  const fl = AC.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.value = f; fl.Q.value = q;
  const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.0015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
}
function thump(t, f, dur, peak, dest) {
  const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * (0.9 + Math.random() * 0.2), t); o.frequency.exponentialRampToValueAtTime(Math.max(25, f * 0.45), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
}
function realMat(t, mat, out, size, peak) {
  const M = REAL_MAT[mat] || REAL_MAT.stone, n = Math.max(1, Math.round(M.n * size)), sp = M.spread * (0.6 + size * 0.6);
  for (let i = 0; i < n; i++) {
    const tt = t + Math.pow(Math.random(), 1.6) * sp, f = M.lo * Math.pow(M.hi / M.lo, Math.random());
    grain(tt, f, M.q, M.g * (0.6 + Math.random() * 0.8) * (0.8 + size * 0.4), peak * (0.35 + Math.random() * 0.65) / Math.sqrt(n) * 1.6, out);
  }
  if (M.body[1]) thump(t, M.body[0], 0.06 + size * 0.06, M.body[1] * peak, out);
  if (M.rustle) grain(t, M.lo * 1.2, 0.5, 0.05 + size * 0.08, M.rustle * peak, out, 'highpass');
  if (M.click) grain(t, M.hi, 8, 0.012, M.click * peak, out);
  if (M.knock) { thump(t, 260 + Math.random() * 80, 0.05 + size * 0.05, 0.3 * peak, out); grain(t, 700, 6, 0.03, 0.35 * peak, out); }
  if (M.ring) for (const f of [2300, 3700]) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f * (0.97 + Math.random() * 0.06); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06 * peak, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35 * size + 0.1); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.5); }
}
function glassShatter(t, out, peak) {
  for (let i = 0; i < 22; i++) grain(t + Math.pow(Math.random(), 2) * 0.35, 3000 + Math.random() * 7000, 6 + Math.random() * 8, 0.02 + Math.random() * 0.05, peak * (0.2 + Math.random() * 0.5), out);
  grain(t, 1800, 0.8, 0.08, peak * 0.6, out, 'highpass');
  for (let i = 0; i < 6; i++) { const tt = t + 0.04 + Math.random() * 0.4, o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = 3500 + Math.random() * 4500; g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.05 * peak, tt + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.15 + Math.random() * 0.2); o.connect(g); g.connect(out); o.start(tt); o.stop(tt + 0.45); }
}
const REAL_KINDS = new Set(['step', 'land', 'dig', 'place', 'break', 'jump']);
const playSoundBase = playSound;
playSound = function (kind, vol, pan, mat) {
  if (!AC || !REAL_KINDS.has(kind) || !(vol > 0.001)) return playSoundBase(kind, vol, pan, mat);
  const t = AC.currentTime + 0.002, out = outNode(vol, pan), m = mat || 'dirt';
  switch (kind) {
    case 'step': realMat(t, m, out, 0.45, 0.32); break;
    case 'dig': realMat(t, m, out, 0.6, 0.42); break;
    case 'place': realMat(t, m, out, 0.8, 0.55); thump(t, 90, 0.08, 0.25, out); break;
    case 'land': realMat(t, m, out, 1, 0.6); thump(t, 60, 0.16, 0.55, out); grain(t, 260, 0.7, 0.1, 0.25, out, 'lowpass'); break;
    case 'break': if (m === 'glass') glassShatter(t, out, 0.7); else { realMat(t, m, out, 1.3, 0.6); realMat(t + 0.05, m, out, 0.9, 0.35); thump(t, 70, 0.14, 0.3, out); } break;
    // jump: a soft push-off of the feet on the surface plus the rustle of clothes, no pitch sweep
    case 'jump': realMat(t, m, out, 0.4, 0.22); grain(t + 0.01, 520, 0.6, 0.09, 0.12, out, 'lowpass'); grain(t + 0.02, 1800, 0.7, 0.06, 0.04, out); break;
  }
};

// --- phone performance guard: if the frame rate stays under ~40 fps for 3 s, use fewer torch lights and a lower render resolution ---
var perfGuard = {ema: 60, lowT: 0, step: 0};
(function hookPerf() {
  const base = updateLights;
  updateLights = function (dt) {
    base(dt);
    if (QUALITY !== 'phone' || !started || paused || !(dt > 0) || dt > 0.5) return;
    perfGuard.ema += (1 / dt - perfGuard.ema) * Math.min(1, dt * 2);
    perfGuard.lowT = perfGuard.ema < 40 ? perfGuard.lowT + dt : Math.max(0, perfGuard.lowT - dt * 0.5);
    if (perfGuard.lowT > 3 && perfGuard.step < 2) {
      perfGuard.step++; perfGuard.lowT = 0; perfGuard.ema = 50;
      const keep = perfGuard.step === 1 ? 3 : 2;
      while (torchLights.length > keep) { const l = torchLights.pop(); scene.remove(l); }
      try { renderer.setPixelRatio(Math.max(0.6, renderer.getPixelRatio() * 0.8)); resize(); } catch (_) {}
      console.info('Glencraft perf guard step', perfGuard.step);
    }
  };
})();
"""
open('s1.js','w').write(s)
