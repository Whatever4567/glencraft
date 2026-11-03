/* ===================== GLX-C185 (v1.0.35, v1.0.41 longer body): the Great Sphinx on the sand island - lion body, front paws, striped nemes, restored face + beard; a tunnel from behind its ear (and a hatch on its head) down to a hidden chamber ===================== */
(function c185() {
  const U = window.__c181; if (!U) return;
  const S = T.SANDSTONE, RS = 150, BLK = T.BLACKSTONE || 248;
  U.sphinx = function (K, st) {
    const G = K.G, DA = 8, A0 = -30 + DA, SV = -46, nem = y => ((y - G) % 2 === 0 ? RS : S);
    const P = (a, y, b, v) => K.B(A0 + a, y, SV + b, v), at = (a, b) => [A0 + a, SV + b];
    for (let a = -1 - DA; a <= 35; a++) for (let b = -9; b <= 9; b++) if (!K.ok(...at(a, b))) { st.sphinx = 'no room'; return null; }
    // body lying down: rounded back rising to the shoulders
    for (let a = -DA; a <= 21; a++) { const w = a < 4 - DA ? 3 + (a + DA) * 0.5 : 5, hb = 7 + 4 * (a + DA) / (21 + DA);
      for (let b = -6; b <= 6; b++) { if (Math.abs(b) > w) continue; const top = G + Math.round(hb * Math.sqrt(Math.max(0, 1 - (b / (w + 0.6)) ** 2))); for (let y = G + 1; y <= top; y++) P(a, y, b, S); } }   // v1.0.41: the body is 8 longer, low and long like the real one
    // haunches, tail
    for (let a = 1; a <= 8; a++) for (const s of [-1, 1]) for (let bb = 5; bb <= 7; bb++) { const q = ((a - 4.5) / 3.6) ** 2 + ((bb - 5.5) / 1.6) ** 2; if (q > 1) continue; const t = G + Math.round(4 * Math.sqrt(1 - q)); for (let y = G + 1; y <= t; y++) P(a - DA, y, bb * s, S); }
    for (let a = 0; a <= 9; a++) P(a - DA, G + 1, 7, S); P(9 - DA, G + 2, 6, S);
    // front legs and long paws with toes
    for (const s of [-1, 1]) for (let a = 18; a <= 33; a++) for (let bb = 2; bb <= 5; bb++) { const t = a <= 22 ? G + 5 : G + 3; if (a === 33 && bb % 2) continue; for (let y = G + 1; y <= (a === 33 ? G + 2 : t); y++) P(a, y, bb * s, S); }
    // chest and neck
    for (let a = 17; a <= 26; a++) for (let b = -5; b <= 5; b++) { const t = G + (a <= 23 ? 12 : 11) - (Math.abs(b) > 3 ? 2 : 0); for (let y = G + 1; y <= t; y++) P(a, y, b, S); }
    // head: face block, nemes headdress (striped flaps + cap), forehead band
    for (let a = 20; a <= 28; a++) for (let b = -3; b <= 3; b++) for (let y = G + 13; y <= G + 20; y++) P(a, y, b, S);
    for (let a = 19; a <= 26; a++) for (let b = -6; b <= 6; b++) for (let y = G + 10; y <= G + 22; y++) { const side = Math.abs(b) >= 4, cap = y >= G + 21;
      if (!side && !cap) continue; if (cap && Math.abs(b) === 6 && y === G + 22) continue; if (side && y < G + 13 && a > 25) continue; P(a, y, b, nem(y)); }
    for (let b = -4; b <= 4; b++) for (let y = G + 20; y <= G + 21; y++) { P(27, y, b, nem(y)); P(28, y, b, nem(y)); }
    // the face: eyes, brows, nose, lips, chin; a beard piece under it; ears beside the flaps
    for (const s of [-1, 1]) { P(28, G + 18, 2 * s, BLK); P(29, G + 19, 2 * s, S); P(29, G + 19, 3 * s, S); P(27, G + 17, 7 * s, S); P(25, G + 16, 7 * s, S); P(24, G + 16, 7 * s, S); P(24, G + 17, 7 * s, S); P(25, G + 17, 7 * s, BLK); P(24, G + 18, 7 * s, S); P(25, G + 18, 7 * s, S); }
    P(29, G + 16, 0, S); P(29, G + 17, 0, S); P(30, G + 16, 0, S);
    for (let b = -1; b <= 1; b++) { P(29, G + 15, b, RS); P(28, G + 14, b, BLK); }
    for (let y = G + 8; y <= G + 12; y++) { P(28, y, 0, nem(y)); P(27, y, 0, nem(y)); }
    // secret 1: behind the left ear, a narrow tunnel down through the body; secret 2: a hatch on top of the head
    const cells = [], FL = [];
    for (let b = -6; b <= -3; b++) for (let y = G + 15; y <= G + 16; y++) cells.push([22, y, b]);
    for (let i = 0; i <= 18; i++) { const a = 22 - i, f = G + 14 - i; for (let y = f + 1; y <= f + 2; y++) cells.push([a, y, -2]); FL.push([a, f, -2, i]); }
    for (let b = -2; b <= 2; b++) for (let y = G - 3; y <= G - 2; y++) cells.push([3, y, b]);
    for (let j = 1; j <= 8; j++) { const a = 3 + j, f = G - 4 - j; for (let y = f + 1; y <= f + 2; y++) cells.push([a, y, 2]); FL.push([a, f, 2, 20 + j]); }
    const hat = [[2, G + 18], [1, G + 17], [0, G + 16], [-1, G + 15]]; for (let y = G + 20; y <= G + 22; y++) cells.push([22, y, 3]);
    for (const [b, f] of hat) for (let y = f + 1; y <= f + 2; y++) cells.push([22, y, b]); for (let y = G + 19; y <= G + 20; y++) cells.push([22, y, 3]);
    // the hidden chamber under the body
    const c0 = 2, c1 = 20, cf = G - 12; for (let a = c0; a <= c1; a++) for (let b = -6; b <= 6; b++) for (let y = cf + 1; y <= cf + 5; y++) cells.push([a, y, b]);
    K.carve(cells.map(([a, y, b]) => [A0 + a, y, SV + b]), H);
    for (let y = G + 15; y <= G + 16; y++) { P(22, y, -7, 0); }   // re-open the ear doorway (the carve sealed it)
    P(22, G + 23, 3, 0);
    for (const [a, f, b, i] of FL) { if (!K.get(A0 + a, f, SV + b)) P(a, f, b, S); if (i % 6 === 3) K.torch(A0 + a, f + 1, SV + b); }
    for (const [b, f] of hat) P(22, f, b, S); P(22, G + 19, 3, S);
    for (let a = c0; a <= c1; a++) for (let b = -6; b <= 6; b++) P(a, cf, b, (a + b) & 1 ? S : RS);
    for (const a of [6, 11, 16]) for (const s of [-1, 1]) for (let y = cf + 1; y <= cf + 5; y++) P(a, y, 4 * s, RS);
    for (const [a, b] of [[c0 + 1, -5], [c0 + 1, 5], [c1 - 1, -5], [c1 - 1, 5], [11, 0]]) K.torch(A0 + a, cf + 1, SV + b);
    P(c1, cf + 1, -1, T.GOLDBLOCK); P(c1, cf + 1, 1, T.GOLDBLOCK);
    const L = [[IT.GOLDINGOT, 5, 0.95], [IT.DIAMOND, 2, 0.55], [IT.RUBY, 3, 0.6], [IT.BONE || 171, 3, 0.6], [IT.GOLDNUGGET || IT.GOLDINGOT, 6, 0.5]].filter(r => r[0] != null);
    K.chest(A0 + c1, cf + 1, SV, L);
    const pts = []; for (let a = c0 + 2; a <= c1 - 2; a += 3) for (const b of [-2, 2]) pts.push(K.W(A0 + a, cf + 1, SV + b));
    const [ex, ez] = K.L(A0 + 22, SV - 7), [hx, hz] = K.L(A0 + 22, SV + 3);
    st.sphinx = {ear: [ex, G + 15, ez], hatch: [hx, G + 22, hz], chamber: cf + 1}; return {pts, ear: [ex, G + 15, ez], hatch: [hx, G + 22, hz], cu: A0 + 11, cv: SV}; };
})();
