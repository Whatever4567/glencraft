/* GLX-C294 (v1.0.102, Agartha v2 in v1.0.106, v3 in v1.0.112): AGARTHA, generation. New and reset worlds only (old saves keep what they have).
   v1.0.106: the giant mouth is cut into the ICE WALL at the map edge, behind a snow landing. The tunnel is three times bigger in cross-section
   and runs about 2000 blocks: inside the wall band, round the edge of the world, then inland under the sea bed (never opened to water) to the city.
   Its walls are stone and grass, deeper in it glows blue (glow grass and glow plants, thicker the closer you get), and it stays overgrown.
   The cavern has about four times the air space (a dome under its own sky, see C295) and a bigger crystal city.
   v1.0.112 (v3): the mouth is in the ice wall at the point nearest Blackstone Castle (only a landmark, nothing joins them), with a snow landing.
   The tunnel runs STRAIGHT on, out past the map edge, for 2000 blocks to Agartha, a secret area outside the map. Past the edge it is its own
   stretch of world (240 x 2260, generated and loaded only when you walk in), so the edge barrier, freezing and the ocean never reach it.
   Nothing is dug under the mainland any more. */
(function c294() {
  const U = window.__c294 = {err: null, ms: 0, L: null};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const on = () => { try { return !!(window.__g89 && __g89()); } catch (_) { return false; } };
  let s = 1; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const inb = (x, y, z) => x > 1 && z > 1 && x < W - 2 && z < D - 2 && y > 2 && y < H - 2;
  const put = (x, y, z, b) => { if (inb(x, y, z)) world[idx(x, y, z)] = b; };
  const get = (x, y, z) => inb(x, y, z) ? world[idx(x, y, z)] : 1;
  const soft = b => !b || LEAFY[b] || LOGGY[b] || PLANT[b];
  const surf = (x, z) => { for (let y = H - 2; y > 2; y--) { const b = world[idx(x, y, z)]; if (!soft(b)) return [y, b]; } return [0, 0]; };
  const bed = (x, z) => { let [y, b] = surf(x, z); while (y > 3 && world[idx(x, y, z)] === T.WATER) y--; return [y, b]; };
  const Q = (x, z) => __c273.edgeQ(x, z), GLOWG = () => T.GLOWGRASS || T.MOSS || T.GRASS, GLOWP = () => T.GLOWPLANT || T.FERN || T.TALLGRASS;
  const wet = (X, Y, Z) => { for (let k = 1; k <= 4; k++) if (get(X, Y + k, Z) === T.WATER) return true;
    return get(X + 1, Y, Z) === T.WATER || get(X - 1, Y, Z) === T.WATER || get(X, Y, Z + 1) === T.WATER || get(X, Y, Z - 1) === T.WATER || get(X, Y - 1, Z) === T.WATER; };
  function ball(cx, cy, cz, r, ry, fy) { const R = Math.ceil(r), RY = Math.ceil(ry);
    for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) { const h2 = (x * x + z * z) / (r * r); if (h2 > 1) continue; const yy = Math.sqrt(1 - h2) * ry;
      for (let y = -RY; y <= RY; y++) { if (Math.abs(y) > yy) continue; const X = cx + x, Y = cy + y, Z = cz + z; if (Y < fy || !inb(X, Y, Z)) continue; const i = idx(X, Y, Z), b = world[i];
        if (!b || b === T.WATER || b === T.HBEDROCK || wet(X, Y, Z)) continue; world[i] = 0; } } }
  function tree(x, y, z, h) { if (get(x, y, z) || !get(x, y - 1, z)) return; for (let k = 0; k < h; k++) if (get(x, y + k, z)) return; put(x, y - 1, z, T.DIRT);
    for (let k = 0; k < h; k++) put(x, y + k, z, T.LOG);
    for (let a = -2; a <= 2; a++) for (let c = -2; c <= 2; c++) for (let e = h - 2; e <= h + 1; e++) { if (Math.abs(a) + Math.abs(c) + Math.max(0, e - h) * 2 > 3) continue; if (!get(x + a, y + e, z + c)) put(x + a, y + e, z + c, T.LEAVES); } }
  const AW = 240, AD = 2260, AH = 64, TL = 2000, CX = AW >> 1, CR = 112, CZ = TL + 12 + CR - 4;
  try { const sws = setWorldSize; setWorldSize = function (n) { if (DIM.cur === 'agartha' && n === AW) { W = AW; D = AD; if (world.length !== W * H * D) world = new Uint8Array(W * H * D); return; } return sws.apply(this, arguments); }; } catch (e) { ERR('sws', e); }
  function dress(P, G0) { const N = P.length;
    for (let i = 0; i < N; i += 3) { const p = P[i], k = G0 + (1 - G0) * i / N, glow = Math.max(0, Math.min(1, (k - 0.3) / 0.6)), r = p[3] + 1.6, ry = p[4] + 1.6, R = Math.ceil(r), RY = Math.ceil(ry);
      for (let a = -R; a <= R; a++) for (let c = -R; c <= R; c++) for (let dy = -RY; dy <= RY; dy++) { if ((a * a + c * c) / (r * r) + dy * dy / (ry * ry) > 1) continue;
        const X = p[0] + a, Y = p[2] + dy, Z = p[1] + c; if (!inb(X, Y, Z)) continue; const b = world[idx(X, Y, Z)]; if (soft(b) || b === T.WATER || b === T.HBEDROCK || b === T.LAVA) continue;
        const up = get(X, Y + 1, Z), air = !up || !get(X, Y - 1, Z) || !get(X + 1, Y, Z) || !get(X - 1, Y, Z) || !get(X, Y, Z + 1) || !get(X, Y, Z - 1); if (!air) continue;
        const h = rnd();
        if (!up) { put(X, Y, Z, h < glow * 0.45 ? GLOWG() : (h < 0.6 ? (T.MOSS || T.GRASS) : T.GRASS)); const r2 = rnd();
          if (r2 < 0.006) tree(X, Y + 1, Z, 4 + (rnd() * 3 | 0)); else if (r2 < 0.006 + glow * 0.09) put(X, Y + 1, Z, GLOWP()); else if (r2 < 0.05 + glow * 0.04) put(X, Y + 1, Z, T.FERN || T.TALLGRASS); else if (r2 < 0.07) put(X, Y + 1, Z, T.TALLGRASS); }
        else { put(X, Y, Z, h < glow * 0.3 ? GLOWG() : (h < 0.5 ? T.GRASS : T.STONE)); if (!get(X, Y - 1, Z) && rnd() < 0.05) for (let v = 1; v <= 1 + (rnd() * 3 | 0); v++) if (!get(X, Y - v, Z)) put(X, Y - v, Z, T.LEAVES); } } }
  }
  // ---------- overworld: the mouth in the ice wall behind Blackstone Castle ----------
  // v1.0.112: the hole is in the ice wall at the point NEAREST Blackstone Castle (the castle is only the landmark), and runs straight out to the nearest map edge
  const WP = (M, d, a) => M.e === 'N' ? [M.c + a, d] : M.e === 'S' ? [M.c + a, D - 1 - d] : M.e === 'W' ? [d, M.c + a] : [W - 1 - d, M.c + a];
  function mouth() { const bc = (typeof g9castles !== 'undefined' && g9castles || []).find(c => c[0] === 'black'); if (!bc) return null;
    const RE = __c273.RE(), WS = __c273.WS || 40; let best = null, bd = 1e9;
    for (let x = 4; x < W - 4; x += 2) for (let z = 4; z < D - 4; z += 2) { const q = Q(x, z); if (q < RE - WS - 8 || q > RE - WS + 6) continue; const dd = Math.hypot(x - bc[1], z - bc[2]); if (dd >= bd) continue;
      const [y, b] = surf(x, z); if (y < SEA + 4 || b === T.WATER) continue; bd = dd; best = [x, z]; }
    if (!best) return null; const [x, z] = best, ed = [[z, 'N'], [D - 1 - z, 'S'], [x, 'W'], [W - 1 - x, 'E']].sort((p, q) => p[0] - q[0])[0][1];
    const M = {e: ed, c: ed === 'N' || ed === 'S' ? x : z, cas: [bc[1], bc[2]]}; let df = 0;
    for (let d = 2; d < 200; d++) { const [X, Z] = WP(M, d, 0), [y, b] = surf(X, Z); if (y < SEA + 4 || b === T.WATER) break; df = d; }
    M.df = df; return M; }
  function carveMouth(M) { const P = [], F1 = SEA + 2;
    // v1.1.22: the mouth is cut into the wall face higher up (where the ice reaches SEA+14), with no flat snow landing; the floor slopes down to the map edge
    const hi = d => { const [X, Z] = WP(M, d, 0), [X1, Z1] = WP(M, d, -9), [X2, Z2] = WP(M, d, 9); return Math.min(surf(X, Z)[0], surf(X1, Z1)[0], surf(X2, Z2)[0]); };
    let d0 = 0; for (let d = 4; d <= M.df; d++) { if (hi(d) >= SEA + 16) d0 = d; else if (d0) break; }
    const gF = d0 ? (() => { const [X, Z] = WP(M, d0 + 12, 0); return bed(X, Z)[0]; })() : F1, F0 = d0 ? Math.max(F1, Math.min(SEA + 14, gF + 7)) : F1; if (!d0) d0 = M.df; M.d0 = d0; M.f0 = F0;
    for (let d = d0 + 6; d >= 1; d--) { const [X, Z] = WP(M, d, 0), f = Math.round(F1 + (F0 - F1) * Math.min(1, (d - 1) / Math.max(1, d0 - 1))); P.push([X, Z, f + 11, 17, 13, f]); }
    for (const p of P) ball(p[0], p[2], p[1], p[3], p[4], p[5]);
    // a rough snow ramp climbs from the ground to the raised mouth (no flat platform)
    if (F0 > F1) { const SN = T.PACKSNOW || T.SNOW || T.STONE, L = (F0 - gF) * 2 + 2; for (let i = 0; i <= L; i++) { const d = d0 + 1 + i, top = Math.round(F0 - 1 - i / 2), w = 3 + ((i * 7) % 3);
        for (let a = -w; a <= w; a++) { const [X, Z] = WP(M, d, a + Math.round(Math.sin(i * 0.5) * 2)), t2 = top - (Math.abs(a) > w - 2 ? 1 : 0); for (let y = t2; y > 2; y--) { const b = get(X, y, Z); if (b && b !== T.WATER && y < t2) break; put(X, y, Z, SN); } } } }
    dress(P.slice(8), 0); clearLane(P, SEA + 4, SEA + 40);
    // water may never touch the mouth air
    for (const p of P) for (let a = -20; a <= 20; a++) for (let y = SEA - 2; y <= SEA + 28; y++) for (const dz of [-1, 0, 1]) { const ns = M.e === 'N' || M.e === 'S', X = p[0] + (ns ? a : dz), Z = p[1] + (ns ? dz : a); if (get(X, y, Z) === T.WATER) { const n = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1]].some(([u, v, w]) => !get(X + u, y + v, Z + w)); if (n) put(X, y, Z, T.STONE); } } }
  // the saucer flies this lane: no trees or leaves in the middle of the tunnel
  function clearLane(P, y0, y1) { for (const p of P) for (let a = -15; a <= 15; a++) for (let y = y0; y <= y1; y++) for (const [X, Z] of [[p[0] + a, p[1]], [p[0], p[1] + a]]) { const b = get(X, y, Z); if (b && (LOGGY[b] || LEAFY[b])) put(X, y, Z, 0); } }
  // ---------- beyond the edge: the 2000 block tunnel and Agartha ----------
  function genAg() { H = AH; setWorldSize(AW); s = 0x6a9a + ((typeof gSeed !== 'undefined' ? gSeed | 0 : 0) >>> 0); world.fill(T.STONE); for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { world[idx(x, 0, z)] = T.HBEDROCK || T.BEDROCK || T.STONE; }
    const P = []; for (let z = 0; z <= TL + 12; z++) { const e = Math.max(0, Math.min(1, (z - (TL - 150)) / 150)); P.push([CX, z, Math.round(24 - 6 * e), 17, 13, Math.round(12 - 7 * e)]); }
    for (const p of P) ball(p[0], p[2], p[1], p[3], p[4], p[5]); dress(P, 0.15); clearLane(P, 13, 34);
    const L = {city: [CX, CZ, CR]}; cavern(L);
    U.A = {v: 2, ag: 3, city: L.city, FL: L.FL, TOP: L.TOP, spires: L.spires, cry105: 1}; U.tunnelLen = TL; }
  function spawnAg() { P.x = CX + 0.5; P.z = 10.5; P.y = 13.05; P.yaw = Math.PI; P.pitch = 0; P.vy = 0; }
  function cavern(L) { const [X, Z, R] = L.city, FL = 5, TOP = L.top0 || 40, HT = TOP - FL;
    for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) { const d = Math.hypot(x, z) / R; if (d > 1) continue; const g = bed(X + x, Z + z)[0];
      const top = Math.min(Math.round(FL + HT * Math.sqrt(Math.max(0, 1 - d * d))), g - 5);
      for (let y = 3; y < top; y++) { const i = idx(X + x, y, Z + z); world[i] = y < FL - 1 ? T.STONE : y === FL - 1 ? (d > 0.6 && rnd() < 0.3 ? GLOWG() : (T.MOSS || T.GRASS)) : 0; } }
    const dome = (x, z) => FL + HT * Math.sqrt(Math.max(0, 1 - (Math.hypot(x - X, z - Z) / R) ** 2));
    const COL = [T.CRYCYAN || T.DIAMONDBLOCK, T.CRYWHITE || T.PACKSNOW, T.CRYVIOLET || T.LAZBLOCK, T.CRYCYAN || T.DIAMONDBLOCK], sp = [];
    for (let k = 0; k < 40; k++) { const a = rnd() * 6.283, d = (k === 0 ? 0 : 14 + rnd() * (R - 34)), x = Math.round(X + Math.cos(a) * d), z = Math.round(Z + Math.sin(a) * d);
      if (sp.some(p => Math.hypot(p[0] - x, p[1] - z) < 13)) continue; const lim = Math.floor(dome(x, z) - FL - 5);
      const h = Math.min(lim, k === 0 ? 30 : 14 + (rnd() * 14 | 0)), w = k === 0 ? 6 : 2 + (rnd() * 3 | 0), m = COL[k % COL.length]; if (h < 10) continue;
      for (let y = 0; y < h; y++) { const r = Math.max(0, Math.round(w * (1 - y / h))); for (let a2 = -r; a2 <= r; a2++) for (let c2 = -r; c2 <= r; c2++) if (Math.abs(a2) + Math.abs(c2) <= r + 1) put(x + a2, FL + y, z + c2, m); }
      put(x, FL + h, z, T.LAMP); sp.push([x, z, h, w]);
      const ty = FL + Math.round(h * 0.4); for (let a2 = -w - 2; a2 <= w + 2; a2++) for (let c2 = -w - 2; c2 <= w + 2; c2++) if (Math.max(Math.abs(a2), Math.abs(c2)) === w + 2) put(x + a2, ty, z + c2, (a2 + c2) % 3 ? (T.PACKSNOW || T.WOOL) : (T.CRYWHITE || T.PACKSNOW)); }
    for (let k = 1; k < sp.length; k++) { const q = sp[k]; let p = sp[0], bd = 1e9; for (let j = 0; j < k; j++) { const dd = Math.hypot(sp[j][0] - q[0], sp[j][1] - q[1]); if (dd < bd) { bd = dd; p = sp[j]; } }
      const y = FL + Math.min(Math.round(p[2] * 0.4), Math.round(q[2] * 0.4)), n = Math.hypot(q[0] - p[0], q[1] - p[1]) | 0;
      for (let t = 0; t <= n; t++) { const x = Math.round(p[0] + (q[0] - p[0]) * t / n), z = Math.round(p[1] + (q[1] - p[1]) * t / n); if (!get(x, y, z)) put(x, y, z, T.CRYCYAN || T.DIAMONDBLOCK); } }
    for (let k = 0; k < 900; k++) { const a = rnd() * 6.283, d = 6 + rnd() * (R - 10), x = Math.round(X + Math.cos(a) * d), z = Math.round(Z + Math.sin(a) * d); if (get(x, FL, z) || !get(x, FL - 1, z)) continue; const r = rnd();
      if (r < 0.2) tree(x, FL, z, 4 + (rnd() * 3 | 0)); else if (r < 0.28) put(x, FL, z, T.LAMP); else if (r < 0.5) put(x, FL, z, GLOWP()); else put(x, FL, z, T.FERN || T.TALLGRASS); }
    L.spires = sp; L.FL = FL; L.TOP = TOP; }
  // v1.1.17: Agartha in the SAME world - GLX-C307 swaps in a zone array (the strip north of the map edge) and this carves the 800 block tunnel and the city into it.
  // Local z = D - 1 is world z 2 (inside the map), the tunnel runs north (down local z), dipping under the flat ice, and the cavern sits under the ice at the far end.
  function genExt(o) { const LT = o.LT, CR = o.CR, S0 = SEA + 1, CXl = W >> 1, PK = T.PACKSNOW || T.SNOW || T.STONE, BR = (W >= 600 && T.DEEPSLATE) || T.HBEDROCK || T.BEDROCK || T.STONE;
    s = (0x6a9a + (o.seed | 0) * 31 + o.c * 7) >>> 0;
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { const b = (x * H) * D + z; world[b] = BR; for (let y = 1; y <= S0; y++) world[b + y * D] = y > S0 - 4 ? PK : T.STONE; }
    const sm = t => t * t * (3 - 2 * t), P = [];
    for (let k = 0; k <= LT + 2; k++) { const z = D - 1 - k, a = sm(Math.min(1, k / 260)), e = Math.max(0, Math.min(1, (k - (LT - 150)) / 150));
      P.push([CXl, z, Math.round(SEA + 13 + (24 - SEA - 13) * a - 6 * e), 17, 13, Math.round(SEA + 2 + (12 - SEA - 2) * a - 7 * e)]); }
    // a glacier tongue of packed ice over the first stretch, so the tunnel is covered until it is under the flat ice
    for (const p of P) { const roof = p[2] + 13 + 4; if (roof <= S0) continue; for (let x = -34; x <= 34; x++) { const h = Math.min(H - 3, Math.round(roof - Math.max(0, Math.abs(x) - 18) * 0.9)); for (let y = S0 + 1; y <= h; y++) put(CXl + x, y, p[1], PK); } }
    for (const p of P) ball(p[0], p[2], p[1], p[3], p[4], p[5]); dress(P.slice(30), 0.15); for (const p of P) for (let a = -22; a <= 22; a++) for (let y = p[5] - 3; y <= p[2] + 16; y++) { const b = get(p[0] + a, y, p[1]); if (b && (LOGGY[b] || LEAFY[b])) put(p[0] + a, y, p[1], 0); }
    const L = {city: [CXl, D - 1 - LT - 2 - CR + 4, CR], top0: 37}; cavern(L);
    return {city: L.city, FL: L.FL, TOP: L.TOP, spires: L.spires, path: P.filter((p, i) => i % 40 === 0 || i === P.length - 1).map(p => [p[0], p[5] + 7, p[1]])}; }
  U.genExt = genExt;
  const big = () => { try { return !!(window.__c317 && __c317.on()); } catch (_) { return false; } };   // v1.1.39: on the big round Earth the only way into Agartha is the desert pyramid
  function build() { if (big()) { U.M = null; U.Lw = null; return; } const t = performance.now(); s = (Math.random() * 4294967296) >>> 0; const M = mouth(); if (!M) { U.err = U.err || 'no site'; return; }
    carveMouth(M); const F = WP(M, M.df, 0); U.M = {x: F[0], z: F[1], y: SEA + 2, e: M.e, c: M.c, df: M.df, d0: M.d0, f0: M.f0, castle: M.cas}; U.L = {v: 3, mouth: [F[0], F[1], SEA + 2], e: M.e, c: M.c, df: M.df, d0: M.d0, f0: M.f0}; U.ms = Math.round(performance.now() - t); }
  try { const aps = applySave; applySave = function (d) { try { if (d && d.c294a) U.A = d.c294a; } catch (_) {} return aps.apply(this, arguments); }; } catch (e) { ERR('ap', e); }
  U.build = build; U.genAg = genAg;
  // walking into the back of the mouth (the map edge) takes you on along the tunnel; walking back out of the tunnel start returns you
  let cool = 0; setInterval(async () => { try { if (big() && !DIM.cur) { U.M = null; return; } if (!started || DIM.busy || paused || dead || performance.now() < cool || (window.__c307 && (__c307.ready || __c307.nw))) return;
      const m = U.M, inner = m && (!DIM.cur ? (() => { const e = m.e, d = e === 'N' ? P.z : e === 'S' ? D - P.z : e === 'W' ? P.x : W - P.x, a = (e === 'N' || e === 'S' ? P.x : P.z) - m.c; return d < 5 && Math.abs(a) < 18 && P.y < SEA + 28; })() : false);
      if (!DIM.cur && inner) { cool = performance.now() + 4000; const [X, Z] = WP(m, 14, 0); P.x = X + 0.5; P.z = Z + 0.5;
        await enterDim('agartha', genAg, spawnAg); if (DIM.cur === 'agartha') { spawnAg(); toast('The tunnel runs on, out past the edge of the world...'); dirtyAll = true; } }
      else if (DIM.cur === 'agartha' && P.z < 4) { cool = performance.now() + 4000; await exitDim(); if (m) { const [X, Z] = WP(m, 12, 0); P.x = X + 0.5; P.z = Z + 0.5; P.y = SEA + 2.05; } toast('Back at the ice wall.'); } } catch (e) { ERR('tp', e); } }, 250);
  U.WP = (d, a) => U.M ? WP(U.M, d, a) : null; U.AG = {CX, CZ, TL, AW, AD};
  Object.defineProperty(U, 'L', {get() { return DIM.cur === 'agartha' ? U.A : (!DIM.cur && window.__c307 && __c307.ready && __c307.L) || (U.Lw && U.Lw.v === 2 ? U.Lw : null); }, set(v) { U.Lw = v; }, configurable: true});
  const gen = generate; generate = function () { U.L = null; U.M = null; const r = gen.apply(this, arguments); try { if (on()) { build(); try { dirtyAll = true; } catch (_) {} } } catch (e) { ERR('gen', e); } return r; };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && U.Lw) d.c294 = U.Lw; if (d && DIM.cur === 'agartha' && U.A) d.c294a = U.A; } catch (_) {} return d; };
  const ew = enterWorld; enterWorld = function (save) { try { U.L = save && save.c294 || null; U.M = U.Lw && U.Lw.v === 3 ? {x: U.Lw.mouth[0], z: U.Lw.mouth[1], y: U.Lw.mouth[2], e: U.Lw.e || 'N', c: U.Lw.c != null ? U.Lw.c : U.Lw.mouth[0], df: U.Lw.df || U.Lw.mouth[1], d0: U.Lw.d0, f0: U.Lw.f0} : null; U.A = null; } catch (_) {} return ew.apply(this, arguments); };
})();
