/* ===================== GLX-C204 (v1.0.41): the desert island without the museums, the shop and the white chapel - rolling dunes, two palm oases, a pair of obelisks before the pyramid, a ruined temple ===================== */
// New / reset worlds only (the island is built at world creation). Replaces U.park (now the oases + obelisks) and U.dune (now open rolling dunes) from c183; the glyph fields stay.
(function c204() {
  const U = window.__c181; if (!U) return;
  const S = T.SANDSTONE, LOG = T.LOG, LEAF = T.LEAVES, GOLD = T.GOLDBLOCK;
  const OAS = [[38, -30, 6], [-46, 36, 6]];
  const keepOut = (u, v) => { let d = 1e9;   // distance from the things the dunes must leave alone
    const box = (u0, u1, v0, v1) => { const du = Math.max(u0 - u, 0, u - u1), dv = Math.max(v0 - v, 0, v - v1); return Math.hypot(du, dv); };
    d = Math.min(d, box(-38, 28, -30, 30), box(-42, 16, -58, -34), box(12, 70, -10, 10), Math.hypot(u + 2, v - 42) - 25);
    for (const [ou, ov, r] of OAS) d = Math.min(d, Math.hypot(u - ou, v - ov) - r - 6);
    return d; };
  U.dune = function (K, st) {
    const G = K.G; let n = 0, s = ((typeof gSeed !== 'undefined' ? gSeed : 3) ^ 0x6d75) >>> 0; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    const p1 = rnd() * 6.3, p2 = rnd() * 6.3, p3 = rnd() * 6.3;
    for (let u = -70; u <= 70; u++) for (let v = -70; v <= 70; v++) { if (!K.ok(u, v)) continue; const r = Math.hypot(u, v), ko = keepOut(u, v); if (ko <= 0) continue;
      const fade = Math.max(0, Math.min(1, ko / 7, (60 - r) / 9)); if (fade <= 0) continue;
      const w = Math.sin(0.12 * u + 0.05 * v + p1) + 0.6 * Math.sin(0.04 * u - 0.15 * v + p2) + 0.35 * Math.sin(0.21 * u + 0.19 * v + p3);
      const h = Math.round(Math.max(0, w + 0.9) * 2.6 * fade); if (h < 1) continue;
      if (K.get(u, G + 1, v)) continue;   // something is already built here
      for (let y = G + 1; y <= G + Math.min(h, 7); y++) K.B(u, y, v, T.SAND); n++; }
    st.dune = n; return {n}; };
  function palm(K, u, v, y, ht, du, dv) {   // a gently leaning trunk with drooping fronds
    let cu = u, cv = v; for (let k = 0; k < ht; k++) { if (k > 2 && k % 3 === 0) { cu += du; cv += dv; } K.B(cu, y + k, cv, LOG); }
    const ty = y + ht; K.B(cu, ty, cv, LEAF);
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const L = a && b ? 2 : 3;
      for (let i = 1; i <= L; i++) K.B(cu + a * i, ty - (i === L ? 1 : 0), cv + b * i, LEAF); } }
  U.park = function (K, st) {
    const G = K.G; let palms = 0;
    for (const [ou, ov, r] of OAS) { if (!K.ok(ou, ov)) continue;
      for (let u = ou - r - 3; u <= ou + r + 3; u++) for (let v = ov - r - 3; v <= ov + r + 3; v++) { if (!K.ok(u, v)) continue; const d = Math.hypot(u - ou, v - ov) + 0.6 * Math.sin(u * 0.9 + v * 0.7);
        if (d <= r) { K.B(u, G - 2, v, T.SAND); K.B(u, G - 1, v, T.WATER); K.B(u, G, v, T.WATER); for (let y = G + 1; y <= G + 3; y++) K.B(u, y, v, 0); }
        else if (d <= r + 2.5) { K.B(u, G, v, T.GRASS); for (let y = G + 1; y <= G + 3; y++) K.B(u, y, v, 0); } }
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + ou * 0.1, pu = Math.round(ou + Math.cos(a) * (r + 1.5)), pv = Math.round(ov + Math.sin(a) * (r + 1.5));
        if (!K.ok(pu, pv)) continue; palm(K, pu, pv, G + 1, 6 + (i % 3), Math.sign(Math.round(Math.cos(a))) , Math.sign(Math.round(Math.sin(a)))); palms++; } }
    // oasis 1: a striped tent; oasis 2: a ruined temple, two rows of broken columns
    { const [ou, ov, r] = OAS[0], tu = ou - r - 6, tv = ov; if (K.ok(tu, tv)) for (let k = 0; k <= 3; k++) for (let u = tu - 3; u <= tu + 3; u++) { K.B(u, G + 1 + k, tv - 3 + k, k % 2 ? T.WOOLORANGE || 73 : T.WOOLYELLOW || 72); K.B(u, G + 1 + k, tv + 3 - k, k % 2 ? T.WOOLORANGE || 73 : T.WOOLYELLOW || 72); } }
    { const [ou, ov, r] = OAS[1], cu = ou + r + 6; let cols = 0;
      for (let i = 0; i < 4; i++) for (const sv of [-3, 3]) { const u = cu + i * 3 - 4, v = ov + sv; if (!K.ok(u, v)) continue; const ht = [6, 3, 5, 2, 6, 4, 2, 5][i * 2 + (sv > 0)];
        K.B(u, G, v, S); for (let y = G + 1; y <= G + ht; y++) K.B(u, y, v, y === G + 6 ? 150 : S); cols++; }
      for (let i = -1; i <= 2; i++) for (let v = ov - 3; v <= ov + 3; v++) if (K.ok(cu - 4 + i, v) && i < 1) K.B(cu - 4 + i, G + 7, v, S);
      st.cols = cols; }
    // two obelisks flanking the way up to the pyramid's doors
    for (const v of [-9, 9]) { const u = 26; if (!K.ok(u, v)) continue; K.box(u - 1, G + 1, v - 1, u + 1, G + 1, v + 1, 150);
      for (let y = G + 2; y <= G + 11; y++) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (y < G + 9 || !(a && b)) K.B(u + a, y, v + b, S);
      K.B(u, G + 12, v, S); K.B(u, G + 13, v, GOLD); }
    st.palms = palms; return {palms}; };
})();
