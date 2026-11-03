/* ===================== GLX-C182 (v1.0.36, v1.0.41 sandstone): the sandstone pyramid, its chest room, and the stairs from the chest room down into the deep cave ===================== */
(function c182() {
  const U = window.__c181; if (!U) return;
  const BLK = T.BLACKSTONE || 248, PL = T.PLANKS;
  U.pyramid = function (K, st) {
    const G = K.G, PU = -8, P = T.SANDSTONE;
    // v1.0.41: plain sandstone with a true pyramid outline - 26 courses on a 41-wide base (about the Great Pyramid's steepness), each course edge a sandstone stair so the faces read as smooth slopes, gold capstone
    const B = 20, HT = 26, hk = k => Math.round(B * (1 - k / HT)), ST = 168;
    for (let k = 0; k < HT; k++) { const h = hk(k), hn = k + 1 < HT ? hk(k + 1) : -1, y = G + 1 + k; K.box(PU - h, y, -h, PU + h, y, h, P);
      if (hn < h && h > 0) for (let i = -h; i <= h; i++) for (const [u, v, du, dv] of [[PU + h, i, -1, 0], [PU - h, i, 1, 0], [PU + i, h, 0, -1], [PU + i, -h, 0, 1]]) {
        if (du === -1 && Math.abs(v) <= 5 && y >= G + 3 && y <= G + 10) continue;   // leave the doorway frame as blocks
        K.stair(u, y, v, ST, du, dv); } }
    K.B(PU, G + 1 + HT, 0, T.GOLDBLOCK);
    // a raised porch in front (floor level with the hall) and wide steps down to the sand
    K.box(PU + B - 3, G + 1, -5, PU + B + 3, G + 3, 5, P);
    for (let s = 1; s <= 3; s++) K.box(PU + B + 3 + s, G + 1, -5, PU + B + 3 + s, G + 3 - s, 5, P);
    // the entrance cut into the face, big red panelled double doors standing open, a passage in to the hall
    K.box(PU + 3, G + 4, -3, PU + B + 3, G + 8, 3, 0);
    for (const v of [-4, 4]) K.box(PU + 12, G + 4, v, PU + B + 3, G + 9, v, BLK);
    K.box(PU + 12, G + 9, -4, PU + B + 3, G + 9, 4, BLK);   // dark frame round the doorway
    for (const v of [-3, 3]) K.box(PU + 8, G + 4, v, PU + 11, G + 8, v, PL);
    K.Z('rdoor', PL, PU + 8, G + 4, -3, PU + 11, G + 8, 3);
    for (const v of [-3, 3]) K.box(PU + B + 1, G + 4, v, PU + B + 3, G + 8, v, PL);
    K.box(PU + B + 1, G + 8, -3, PU + B + 3, G + 8, 3, PL);
    K.Z('rdoor', PL, PU + B + 1, G + 4, -3, PU + B + 3, G + 8, 3);
    K.box(PU - 4, G + 4, -5, PU + 6, G + 11, 5, 0);   // the hall (v1.0.83: longer and taller)
    for (const [u, v] of [[PU - 4, -5], [PU - 4, 5], [PU + 6, -5], [PU + 6, 5]]) K.torch(u, G + 4, v);
    // v1.0.83: two gallery rooms off the hall, one each side, through doorways near the entrance end (the players paintings hang in them, c268)
    for (const s of [-1, 1]) { const a = s > 0 ? 7 : -13, b = s > 0 ? 13 : -7; K.box(PU - 3, G + 4, a, PU + 6, G + 8, b, 0); K.box(PU + 4, G + 4, 6 * s, PU + 5, G + 6, 6 * s, 0);
      for (let u = PU - 3; u <= PU + 6; u++) for (let v = a; v <= b; v++) K.B(u, G + 3, v, (u + v) & 1 ? P : 150);
      K.torch(PU - 3, G + 4, 7 * s); K.torch(PU + 6, G + 4, 7 * s); K.torch(PU - 3, G + 4, 13 * s); K.torch(PU + 6, G + 4, 13 * s); }
    K.torch(PU + 10, G + 4, 0);
    // the stairs down (north/back) to the chest room
    const FY = G + 3 - 18, cells = [];
    for (let i = 0; i <= 18; i++) { const u = PU - 5 - i, f = G + 3 - i; for (let v = -1; v <= 1; v++) for (let y = f + 1; y <= f + 3; y++) cells.push([u, y, v]); }
    for (let u = PU - 36; u <= PU - 24; u++) for (let v = -6; v <= 6; v++) for (let y = FY + 1; y <= FY + 5; y++) cells.push([u, y, v]);
    // walls beside the chest open into the two stairways down
    for (const s of [-1, 1]) for (let u = PU - 35; u <= PU - 33; u++) for (let v = 7; v <= 9; v++) for (let y = FY + 1; y <= FY + 3; y++) cells.push([u, y, v * s]);
    K.carve(cells, G);
    for (let i = 0; i <= 18; i++) { const u = PU - 5 - i, f = G + 3 - i; for (let v = -1; v <= 1; v++) K.B(u, f, v, P); if (i % 6 === 3) K.torch(u, f + 1, 1); }
    for (let u = PU - 36; u <= PU - 24; u++) for (let v = -6; v <= 6; v++) K.B(u, FY, v, (u + v) & 1 ? P : 150);
    for (const [u, v] of [[PU - 36, -6], [PU - 36, 6], [PU - 24, -6], [PU - 24, 6]]) for (let y = FY + 1; y <= FY + 5; y++) K.B(u, y, v, 150);
    for (const [u, v] of [[PU - 34, -4], [PU - 34, 4], [PU - 26, -4], [PU - 26, 4]]) K.torch(u, FY + 1, v);
    K.B(PU - 35, FY + 1, -1, 150); K.B(PU - 35, FY + 1, 1, 150); K.B(PU - 35, FY + 2, -1, T.GOLDBLOCK); K.B(PU - 35, FY + 2, 1, T.GOLDBLOCK);
    const L = [[IT.GOLDINGOT, 4, 0.9], [IT.BONE || 171, 4, 0.7], [IT.DIAMOND, 1, 0.4], [IT.RUBY, 2, 0.5], [IT.ROTTEN || 320, 3, 0.6]].filter(r => r[0] != null);
    K.chest(PU - 36 + 1, FY + 1, 0, L);
    st.pyr = 1; return {u: PU, ty: FY, door: K.W(PU + B + 4, G + 4, 0)}; };
  // after the deep cave is cut: the two stairways from the chest room go on down and open into it
  U.passages = function (K, p, st) {
    const PU = p.u, FY = p.ty, cells = [], flr = []; let low = 12;
    for (const s of [-1, 1]) { for (let i = 0; i <= FY - low; i++) { const u = PU - 34 + i, f = FY - i; for (const v of [8, 9]) { for (let y = f + 1; y <= f + 3; y++) cells.push([u, y, v * s]); flr.push([u, f, v * s, i]); } }
      for (let u = PU - 34 + FY - low + 1; u <= PU - 4; u++) for (const v of [8, 9]) { for (let y = low + 1; y <= low + 3; y++) cells.push([u, y, v * s]); flr.push([u, low, v * s, 99]); } }
    const n = K.carve(cells, SEA - 8);
    let t = 0; for (const [u, f, v, i] of flr) { if (!solid(K.get(u, f, v))) K.B(u, f, v, T.SANDSTONE); if ((i % 5 === 2 || (i === 99 && u % 6 === 0)) && Math.abs(v) === 9) { K.torch(u, f + 1, v); t++; } }
    st.passages = n; st.pasTorch = t; return n; };
  const solid = b => b && b !== T.WATER && b !== T.LAVA && !PLANT[b] && !LEAFY[b] && b !== T.TORCH;
})();
