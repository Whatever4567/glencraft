/* ===================== GLX-C208 (v1.0.42): the new map for new worlds - natural coasts, beaches and cliffs, ridged snowy mountains, plains, marsh, lakes, the river valley, close islands over short bridges ===================== */
// ---- v1.0.42 terrain core (shared by the game part and the node prototype) ----
function make42(E) {
  const {W, D, SEA, H, seed} = E, fbm = (x, z, o) => Math.max(-1, Math.min(1, E.fbm(x, z, o) * 3.3)), MT = E.MT, sst = (a, b, t) => { t = Math.max(0, Math.min(1, (t - a) / (b - a))); return t * t * (3 - 2 * t); };
  const cx = W >> 1, cz = (D >> 1) + 8, S = W / 864;
  // landmasses: centre, stretch, reach (in blocks); the desert disc is c147's (radius RD + its 18-block channel)
  const LM = [
    {k: 'main', x: cx, z: cz - 2, sx: 1, sz: 1, R: 282 * S},
    {k: 'black', x: cx, z: Math.round(D * 0.135), sx: 1.5, sz: 1, R: 132 * S},
    {k: 'mossy', x: Math.round(W * 0.145), z: (D >> 1) + 10, sx: 1, sz: 1.5, R: 130 * S},
    {k: 'human', x: Math.round(W * 0.855), z: (D >> 1) - 4, sx: 1, sz: 1.5, R: 132 * S},
    {k: 'forest', x: Math.round(W * 0.70), z: Math.round(D * 0.84), sx: 1.65, sz: 1, R: 136 * S}];
  const RD = E.RD + 18;
  // the river's centre lines (same numbers as GLX-C192) so the land can fall into a wide valley round it
  let s = ((seed | 0) ^ 0x51a7e) >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  const riv = (x, z) => { const dx = x - cx, dz = (z - ((D >> 1) + 8)) / 1.06, th = Math.atan2(dz, dx), rr = Math.hypot(dx, dz);
    const a = 163 + 20 * Math.sin(4 * th + ph[0]) + 8 * Math.sin(9 * th + ph[1]), b = 163 - 20 * Math.sin(4 * th + ph[0] + 0.7) + 7 * Math.sin(7 * th + ph[2]); return Math.min(Math.abs(rr - a), Math.abs(rr - b)); };
  // the straight lines from spawn to each castle / island (the bridges): no cliffs there
  const LN = (E.lines || []).map(([x, z]) => { const L = Math.hypot(x - cx, z - (D >> 1)); return [x, z, (x - cx) / L, (z - (D >> 1)) / L, L]; });
  const nearLine = (x, z) => { let m = 1e9; for (const [, , ux, uz, L] of LN) { const px = x - cx, pz = z - (D >> 1), t = px * ux + pz * uz; if (t < 0 || t > L + 20) continue; m = Math.min(m, Math.abs(px * uz - pz * ux)); } return m; };
  function at(x, z) {
    const wx = x + 34 * fbm(x / 230 + 7.1, z / 230 - 3.3, 3) + 9 * fbm(x / 52 - 5, z / 52 + 2, 2), wz = z + 34 * fbm(x / 230 - 11.7, z / 230 + 5.9, 3) + 9 * fbm(x / 52 + 8, z / 52 - 6, 2);
    const bay = 30 * fbm(x / 95 + 21, z / 95 - 13, 3) + 7 * fbm(x / 26 - 4, z / 26 + 9, 2);
    let d1 = 1e9, d2 = 1e9, o = 0;
    for (let i = 0; i < LM.length; i++) { const m = LM[i], d = Math.hypot((wx - m.x) / m.sx, (wz - m.z) / m.sz) - m.R; if (d < d1) { d2 = d1; d1 = d; o = i; } else if (d < d2) d2 = d; }
    const cw = 27 + 5 * fbm(x / 70 + 3, z / 70 - 9, 2);
    let L = Math.min(-d1, (d2 - d1) / 2 - cw / 2, Math.min(x, z, W - 1 - x, D - 1 - z) - (36 + 26 * fbm(x / 85, z / 85 + 40, 3) + 6 * fbm(x / 24 + 3, z / 24 - 5, 2)));
    const dd = Math.hypot(x - MT[0], z - MT[1]) - RD; if (dd < L) L = dd;
    const k = LM[o].k, ang = Math.atan2(z - cz, x - cx), rr = Math.hypot(x - cx, z - cz);
    // mainland regions: snowy mountains NE, plains E-SE, marsh S, forest hills and river valleys W-NW
    const a = ang / Math.PI * 180 + 18 * fbm(x / 120 + 50, z / 120, 2);
    const wt = {mount: 0, plain: 0, marsh: 0, hill: 0};
    if (k === 'main') { const sec = (c, w) => { let q = Math.abs(((a - c + 540) % 360) - 180); return 1 - sst(w * 0.6, w, q); };
      const far = sst(140, 190, rr); wt.mount = sec(-52, 70) * far; wt.plain = sec(30, 42) * far; wt.marsh = sec(108, 40) * far; wt.hill = Math.max(0, 1 - wt.mount - wt.plain - wt.marsh); }
    else if (k === 'black') { wt.hill = 0.55; wt.mount = 0.45 * sst(-40, 60, x - cx); } else if (k === 'forest') { wt.hill = 0.7; wt.plain = 0.3; } else if (k === 'human') { wt.hill = 0.55; wt.plain = 0.45; } else wt.hill = 1;
    const n1 = fbm(x / 85 + 2, z / 85 - 7, 3), n2 = fbm(x / 30 - 9, z / 30 + 4, 2);
    const hill = 5 + 19 * Math.pow(Math.max(0, 0.5 + 0.5 * n1), 1.5) + 2.5 * n2, plain = 3 + 3.5 * (0.5 + 0.5 * fbm(x / 120 - 4, z / 120 + 8, 2)) + 1.2 * n2;
    const r1 = 1 - Math.abs(fbm(x / 80 + 13, z / 80 - 21, 4)), r2 = 1 - Math.abs(fbm(x / 37 - 33, z / 37 + 17, 3)), ridge = r1 * r1 * (0.6 + 0.4 * r2);
    const mount = 10 + 48 * ridge * sst(0, 30, L) + 6 * n1, marsh = 1.7 + 0.8 * n2;
    let e = hill * wt.hill + plain * wt.plain + mount * wt.mount + marsh * wt.marsh;
    // lakes in the plains, hills and forest; pools in the marsh
    let loch = false; const lk = fbm(x / 120 - 61, z / 120 + 37, 2);
    if (k !== 'black' && !(k === 'main' && rr < 205) && !(k !== 'main' && Math.hypot((x - LM[o].x) / LM[o].sx, (z - LM[o].z) / LM[o].sz) < 80) && lk > 0.55 && wt.mount < 0.3 && L > 18) { const q = sst(0.55, 0.8, lk); e = e * (1 - q) - 3.5 * q; loch = q > 0.5; }
    if (wt.marsh > 0.3) { const pl = fbm(x / 19 + 70, z / 19 - 70, 2); if (pl > 0.35) { const q = sst(0.35, 0.6, pl) * wt.marsh; e = e * (1 - q) - 1.2 * q; } }
    // the river valley (mainland)
    if (k === 'main' && rr > 110) { const rv = sst(5, 52, riv(x, z)); e = 2 + (e - 2) * rv; }
    // coasts: beaches mostly, cliffs where the noise says so (never by a bridge line)
    const cl = fbm(x / 55 + 90, z / 55 - 90, 2), cliff = sst(0.25, 0.55, cl) * sst(26, 40, nearLine(x, z)) * (k === 'black' || wt.mount > 0.4 ? 1.4 : 1);
    let h;
    if (L < 0) h = SEA - 2 - Math.min(11, -L * 0.75) + 0.8 * n2;
    else { const beach = sst(0, 24, L), cp = Math.min(1, cliff), prof = beach * (1 - cp) + sst(0, 3.5, L) * cp;
      h = SEA + 1 + (e - 1) * (e < 1 ? 1 : prof); if (L < 5 && cp < 0.5) h = Math.min(h, SEA + 1 + L * 0.3); }
    h = Math.max(4, Math.min(H - 5, h));
    return {h, k, L, wt, loch, beach: L >= 0 && L < 6 && cliff < 0.5 && h <= SEA + 3, cliff};
  }
  return {at, LM, riv, ph};
}

(function c208() {
  const U = window.__c208 = {err: null, T: null, ms: 0};
  U.on = () => { try { return !!(current && current.g42 && current.g36 && current.g35 && !DIM.cur && W >= 600); } catch (_) { return false; } };
  const ew = enterWorld; enterWorld = function (save) { try { if (current) current.g42 = save ? !!(save.c208 && save.c208.g42) : true; } catch (_) {} return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && current && current.g42) d.c208 = {g42: 1}; } catch (_) {} return d; };
  U.MT = () => [Math.round(W * 0.2384), Math.round(D * 0.7778)];
  const BIO = {black: 4, mossy: 5, human: 7, forest: 1};
  // the castle islands for GLX-C113 (castles sit near each centre, nudged out towards the open sea)
  U.isl = () => { const cx = W >> 1, cz = D >> 1, S = W / 864;
    return [{k: 'black', x: cx, z: Math.round(D * 0.135), sx: 1.5, sz: 1}, {k: 'mossy', x: Math.round(W * 0.145), z: cz + 10, sx: 1, sz: 1.5}, {k: 'human', x: Math.round(W * 0.855), z: cz - 4, sx: 1, sz: 1.5},
      {k: 'forest', x: Math.round(W * 0.70), z: Math.round(D * 0.84), sx: 1.65, sz: 1, nc: 1}].map(q => Object.assign(q, {bio: BIO[q.k]})); };
  let WT = null;
  U.init = () => { const t = performance.now(), cx = W >> 1, cz = D >> 1, IR = 100, MT = U.MT();
    const lines = U.isl().map(q => [q.x + Math.round(Math.sign(q.x - cx) * IR * 0.22), q.z + Math.round(Math.sign(q.z - cz) * IR * 0.22)]).concat([MT]);
    U.T = make42({fbm: g9fbm, W, D, SEA, H, seed: gSeed, MT, RD: 106, lines}); WT = new Uint8Array(W * D * 3); U.ms = Math.round(performance.now() - t); };
  // one column for GLX-C113's height cache: marsh tops go to peat and mud, beaches to sand
  U.rawH = (x, z) => { if (!U.T) U.init(); const r = U.T.at(x, z), w = r.wt, i = (x * D + z) * 3;
    if (x >= 0 && z >= 0 && x < W && z < D) { WT[i] = w.plain * 255; WT[i + 1] = w.marsh * 255; WT[i + 2] = (r.k === 'forest' ? 1 : 0) + (r.k === 'main' && w.hill > 0.6 ? 2 : 0); }
    const mar = w.marsh > 0.45 && r.L > 4;
    return {h: Math.max(BASE + 4, Math.min(H - 5, Math.round(r.h))), hf: r.h, glen: mar ? 0.8 : r.beach ? 0.5 : 0.3, mMask: w.mount, loch: r.loch, sand: r.beach, mar}; };
  // tree cover by region: thin on the plains, a few in the marsh, thick in the forest isle and the mainland woods
  window.__treeP = (x, z) => { if (!WT || !U.on() || x < 0 || z < 0 || x >= W || z >= D) return 1; const i = (x * D + z) * 3, pl = WT[i] / 255, ma = WT[i + 1] / 255, f = WT[i + 2];
    return (1 - 0.8 * pl) * (1 - 0.5 * ma) * (f & 1 ? 1.7 : f & 2 ? 1.25 : 1); };
  // the river's outlets run on to the real coast
  U.coastR = (top, at, a, r0) => { const deg = Math.PI / 180; for (let R = r0; R < 430; R += 2) { const th = (a + 4 * Math.sin(R / 9 + a)) * deg, [x, z] = at(R, th), X = Math.round(x), Z = Math.round(z);
      if (X < 3 || Z < 3 || X >= W - 3 || Z >= D - 3) return R; if (top[X * D + Z] < SEA - 1) return R + 6; } return 430; };
  const gen = generate; generate = function () { WT = null; U.T = null; const r = gen.apply(this, arguments); U.T = null; return r; };
})();
