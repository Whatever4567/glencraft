/* ===================== GLX-C183 (v1.0.35): the desert museum park - forecourt, tiled plaza, the two museums, lawns, sundial, the dune with its white chapel, the red granite glyph fields ===================== */
(function c183() {
  const U = window.__c181; if (!U) return;
  const BLK = T.BLACKSTONE || 248, FEN = 162, OAKST = 164, STST = 167, LAMP = 161, BLUE = T.WOOLBLUE || 71, HARL = T.HARL || 151, RT = T.RTILE || 153, CON = T.CONCRETE || 157, GRAV = T.GRAVEL || 202;
  const flat = (K, u, v, b) => { if (!K.ok(u, v)) return; K.B(u, K.G, v, b); for (let y = K.G + 1; y <= K.G + 3; y++) if (K.get(u, y, v) === T.SAND) K.B(u, y, v, 0); };
  U.park = function (K, st) {
    const G = K.G;
    // pink gravel forecourt, terracotta-tiled plaza, lawns
    for (let u = 12; u <= 19; u++) for (let v = -12; v <= 12; v++) flat(K, u, v, GRAV);
    K.Z('pinkg', GRAV, 12, G, -12, 19, G, 12);
    for (let u = 20; u <= 46; u++) for (let v = -12; v <= 12; v++) flat(K, u, v, T.BRICK);
    K.Z('terra', T.BRICK, 20, G, -12, 46, G, 12);
    for (let u = 47; u <= 53; u++) for (let v = -28; v <= 28; v++) flat(K, u, v, T.GRASS);
    for (let u = 12; u <= 19; u++) for (const s of [-1, 1]) for (let v = 13; v <= 28; v++) flat(K, u, v * s, T.GRASS);
    // benches and lamps round the plaza
    for (let u = 24; u <= 42; u += 6) { K.stair(u, G + 1, -11, OAKST, 0, -1); K.stair(u, G + 1, 11, OAKST, 0, 1); }
    for (const [u, v] of [[21, -12], [21, 12], [45, -12], [45, 12]]) { K.B(u, G + 1, v, FEN); K.B(u, G + 2, v, FEN); K.lamp(u, G + 3, v); }
    // the path out to the front lawn and on to where the bridge lands
    for (let u = 47; u <= 72; u++) for (let v = -2; v <= 2; v++) flat(K, u, v, CON);
    for (let v = 3; v <= 60; v++) for (let u = 50; u <= 52; u++) flat(K, u, v, CON);
    for (let v = -60; v <= -3; v++) for (let u = 50; u <= 52; u++) flat(K, u, v, CON);
    // the museums face each other across the plaza
    let m = 0; for (const s of [-1, 1]) { try { museum(K, s, s < 0 ? 'MUSEUM SHOP' : 'MUSEUM'); m++; } catch (e) { st.musErr = String(e); } }
    sundial(K, 38, -44);
    st.museums = m; return {m}; };
  function museum(K, s, name) {
    const G = K.G, u0 = 20, u1 = 44, vi = 14 * s, vo = 26 * s, va = Math.min(vi, vo), vb = Math.max(vi, vo), S = T.SANDSTONE;
    K.box(u0, G, va, u1, G, vb, T.PLANKS); K.box(u0, G + 1, va, u1, G + 9, vb, 0);
    for (let u = u0; u <= u1; u++) for (let v = va; v <= vb; v++) if (u === u0 || u === u1 || v === va || v === vb) for (let y = G + 1; y <= G + 9; y++) K.B(u, y, v, S);
    K.box(u0 + 1, G + 5, va + 1, u1 - 1, G + 5, vb - 1, T.PLANKS);
    K.box(u0, G + 5, va, u1, G + 5, vb, (u, y, v) => (u === u0 || u === u1 || v === va || v === vb) ? T.STONEBRICK : T.PLANKS);   // string course
    // arched windows: 3 wide, 2 tall + the middle one above
    const win = (u, v, y, alongU) => { for (let k = -1; k <= 1; k++) for (let dy = 0; dy <= 1; dy++) K.B(alongU ? u + k : u, y + dy, alongU ? v : v + k, T.GLASS); K.B(u, y + 2, v, T.GLASS); };
    for (let u = u0 + 3; u <= u1 - 3; u += 5) for (const v of [va, vb]) { if (v === vi && Math.abs(u - 32) < 3) continue; win(u, v, G + 1, true); win(u, v, G + 6, true); }
    for (const u of [u0, u1]) for (let v = va + 3; v <= vb - 3; v += 6) { win(u, v, G + 1, false); win(u, v, G + 6, false); }
    // door to the plaza, sign over it
    for (let du = -1; du <= 1; du++) for (let y = G + 1; y <= G + 3; y++) K.B(32 + du, y, vi, 0); K.B(32, G + 4, vi, 0);
    K.Z('cream', S, u0, G + 1, va, u1, G + 9, vb);
    K.S(32, G + 5, vi, 0, -s, name, name.length * 0.62 + 0.6, 0.9, {c: '#c4241c', bg: 'rgba(0,0,0,0)'});
    // inside: bookshelves, a counter, torches
    for (let u = u0 + 2; u <= u1 - 2; u += 3) { K.B(u, G + 1, vo - s, T.BOOKSHELF); K.B(u, G + 2, vo - s, T.BOOKSHELF); }
    K.torch(u0 + 1, G + 1, vi - s); K.torch(u1 - 1, G + 1, vi - s); K.torch(u0 + 1, G + 6, vo - s); K.torch(u1 - 1, G + 6, vo - s);
    K.box(30, G + 6, vi - s, 34, G + 6, vi - s, 0);
    // terracotta hip roof
    for (let k = 0; k < 9; k++) { const a = u0 - 1 + k, b = u1 + 1 - k, c = va - 1 + k, d = vb + 1 - k; if (a > b || c > d) break; K.box(a, G + 10 + k, c, b, G + 10 + k, d, RT); } }
  function sundial(K, cu, cv) {
    const G = K.G; for (let u = cu - 6; u <= cu + 6; u++) for (let v = cv - 6; v <= cv + 6; v++) if (Math.hypot(u - cu, v - cv) <= 6.2) flat(K, u, v, GRAV);
    K.Z('wgrav', GRAV, cu - 6, G, cv - 6, cu + 6, G, cv + 6);
    for (let y = G + 1; y <= G + 3; y++) K.B(cu, y, cv, T.STONE); K.B(cu - 1, G + 1, cv, T.STONE); K.B(cu - 1, G + 2, cv, T.COBBLE); K.B(cu - 2, G + 1, cv, T.COBBLE);
    const R = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, u = Math.round(cu + Math.cos(a) * 5), v = Math.round(cv + Math.sin(a) * 5); K.S(u, G, v, 0, 0, R[i], 1.1, 0.7, {flat: 1, c: '#5a4a3a', bg: 'rgba(0,0,0,0)', rot: a}); } }
  // ---------- the long flat-topped dune behind the pyramid, with the white chapel ----------
  U.dune = function (K, st) {
    const G = K.G, U0 = -58, U1 = -30, V = 32, top = 7; let n = 0;
    for (let u = U0; u <= U1; u++) for (let v = -V; v <= V; v++) { if (!K.ok(u, v)) continue; const d = Math.min(u - U0, U1 - u, v + V, V - v, 64 - Math.hypot(u, v)); if (d < 1) continue; const h = G + Math.min(top, Math.round(d));
      for (let y = G + 1; y <= h; y++) K.B(u, y, v, y > h - 2 ? T.SAND : T.SANDSTONE); n++; }
    const T0 = G + top, tu0 = U0 + top, tu1 = U1 - top;
    // stone staircase up the middle with dark rails, a white path to its foot and round the pyramid
    for (let k = 1; k <= top; k++) { const u = U1 - k + 1; for (let v = -2; v <= 2; v++) { K.box(u, G + 1, v, u, G + k - 1, v, T.STONEBRICK); K.stair(u, G + k, v, STST, -1, 0); for (let y = G + k + 1; y <= G + k + 3; y++) K.B(u, y, v, 0); }
      for (const v of [-3, 3]) { K.box(u, G + 1, v, u, G + k, v, T.STONEBRICK); K.B(u, G + k + 1, v, BLK); } }
    for (let u = U1 + 1; u <= U1 + 3; u++) for (let v = -22; v <= 22; v++) flat(K, u, v, CON);
    for (const s of [-1, 1]) for (let u = U1 + 1; u <= 12; u++) for (let v = 20; v <= 22; v++) flat(K, u, v * s, CON);
    // chapel (front faces the pyramid)
    const cu0 = -48, cu1 = -40, cw = 4;
    K.box(cu0, T0 + 1, -cw, cu1, T0 + 7, cw, HARL); K.box(cu0 + 1, T0 + 1, -cw + 1, cu1 - 1, T0 + 6, cw - 1, 0); K.box(cu0, T0, -cw, cu1, T0, cw, T.STONEBRICK);
    for (let k = 0; k <= cw; k++) K.box(cu0, T0 + 8 + k, -cw + k, cu1, T0 + 8 + k, cw - k, HARL);   // pitched roof
    for (const [u, v] of [[cu0, -cw], [cu0, cw], [cu1, -cw], [cu1, cw]]) { K.box(u, T0 + 8, v, u, T0 + 10, v, HARL); K.B(u, T0 + 11, v, T.STONEBRICK); }   // corner spires
    for (let y = T0 + 13; y <= T0 + 15; y++) K.B(cu1 - 1, y, 0, HARL); K.box(cu1 - 1, T0 + 16, 0, cu1 - 1, T0 + 18, 0, BLK); K.B(cu1 - 1, T0 + 17, -1, BLK); K.B(cu1 - 1, T0 + 17, 1, BLK);   // bell spire + cross
    // front: pointed blue arch with blue doors, a round blue rose window above
    for (let v = -1; v <= 1; v++) for (let y = T0 + 1; y <= T0 + 3; y++) K.B(cu1, y, v, BLUE); K.B(cu1, T0 + 4, 0, BLUE);
    for (let v = -2; v <= 2; v++) for (let y = T0 + 6; y <= T0 + 10; y++) { const r = Math.hypot(v, y - (T0 + 8)); if (r <= 2.3) K.B(cu1, y, v, r < 1.2 ? T.GLASS : BLUE); }
    K.torch(cu0 + 1, T0 + 1, -cw + 1); K.torch(cu0 + 1, T0 + 1, cw - 1);
    // flagstone patio beside it, benches
    for (let u = cu0 - 1; u <= cu1 + 1; u++) for (let v = cw + 2; v <= cw + 10; v++) K.B(u, T0, v, T.PAVE || 155);
    K.stair(cu0 + 2, T0 + 1, cw + 9, OAKST, 0, 1); K.stair(cu0 + 5, T0 + 1, cw + 9, OAKST, 0, 1);
    // post-and-rail fence round the top, open at the stairs
    for (let u = tu0; u <= tu1; u++) for (let v = -V + top; v <= V - top; v++) { const e = u === tu0 || u === tu1 || Math.abs(v) === V - top; if (!e || (u === tu1 && Math.abs(v) <= 2)) continue; if (K.ok(u, v) && !K.get(u, T0 + 1, v)) K.B(u, T0 + 1, v, FEN); }
    st.dune = n; return {n}; };
  // ---------- grey gravel fields, radiating white paths, red granite glyph slabs, a granite medallion ----------
  U.fields = function (K, st) {
    const G = K.G, cu = -2, cv = 42, R = 22; let slabs = 0;
    for (let u = cu - R; u <= cu + R; u++) for (let v = cv - R; v <= cv + R; v++) { if (Math.hypot(u - cu, v - cv) > R || !K.ok(u, v) || Math.hypot(u, v) > 64 || v < 28 || (u > 18 && v < 28)) continue; flat(K, u, v, GRAV); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, du = Math.cos(a), dv = Math.sin(a), axis = i % 2 === 0;
      for (let r = 3; r <= R; r++) { const u = Math.round(cu + du * r), v = Math.round(cv + dv * r); if (K.get(u, G, v) === GRAV) K.B(u, G, v, CON);
        if (r >= 6 && r % 5 === 1) for (const sd of [-1, 1]) { const pu = Math.round(cu + du * r - dv * sd * 2.5), pv = Math.round(cv + dv * r + du * sd * 2.5); if (K.get(pu, G, pv) !== GRAV) continue;
          if (axis) { for (let k = 0; k <= 3; k++) { const qu = Math.round(pu + du * k), qv = Math.round(pv + dv * k); K.B(qu, G + 1, qv, T.STONEBRICK); K.B(qu, G + 2, qv, T.STONEBRICK);
              const ou = Math.round(-dv * sd), ov = Math.round(du * sd); K.B(qu + ou, G + 1, qv + ov, T.STONEBRICK); } }   // a long prism: tall spine, low flank
          else { for (let a2 = -1; a2 <= 1; a2++) for (let b2 = -1; b2 <= 1; b2++) K.B(pu + a2, G + 1, pv + b2, T.STONEBRICK); K.B(pu, G + 2, pv, T.STONEBRICK); }   // a small pyramid
          slabs++; } } }
    for (let u = cu - 3; u <= cu + 3; u++) for (let v = cv - 3; v <= cv + 3; v++) if (Math.hypot(u - cu, v - cv) <= 3.2) K.B(u, G, v, T.STONEBRICK);
    K.B(cu, G + 1, cv, T.STONEBRICK);
    K.Z('gran', T.STONEBRICK, cu - R, G, cv - R, cu + R, G + 2, cv + R);
    st.slabs = slabs; return {slabs}; };
})();
