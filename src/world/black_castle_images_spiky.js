/* ===================== GLX-C153 (v1.0.25): the Black castle (images 5-6) - spiky blackstone + obsidian gothic towers, glowing red windows, lava moat + bridge, scorched ground, the broken portal; throne room inside ===================== */
(function c153() {
  const U = window.__c151; if (!U) return;
  const BS = 248, DB = 228, DBS = 230, DC = 249, OB = T.OBSIDIAN || 189, HR = T.HELLROCK || 206, SS = T.SOULSAND || 207, MG = T.MAGMA || 208, HB = T.HELLBRICK || 210, BARS = 163, RCARP = 221, GL = T.GLASS || 63;
  U.B.black = function (K) { const {B, box, h} = K, F = 1, X0 = -8, X1 = 8, Z0 = -9, Z1 = -1, CE = F + 11, RT = F + 13;
    const blk = (x, y, z) => { const v = h(x, y, z); return y % 5 === 0 ? DB : v < 0.6 ? BS : v < 0.85 ? DB : v < 0.95 ? DC : OB; };
    const scorch = (x, z) => { const v = h(x, 60, z); return v < 0.45 ? BS : v < 0.7 ? DC : v < 0.82 ? SS : v < 0.94 ? HR : MG; };
    const loc = (ax, az) => { let x = ax, z = az; for (let i = 0; i < K.rot; i++) { const t = x; x = z; z = -t; } return [x, z]; };
    const AB = (ax, y, az, b) => { const [x, z] = loc(ax, az); B(x, y, z, b); };
    // ground: raised dark platform, a round lava moat, scorched land beyond
    for (let x = -23; x <= 23; x++) for (let z = -23; z <= 23; z++) { const r = Math.hypot(x, z); if (r > 23.5) continue;
      if (r <= 18.5) { for (let y = -3; y <= 0; y++) B(x, y, z, y === 0 ? (h(x, 61, z) < 0.7 ? BS : DC) : BS); }
      else if (r >= 19 && r <= 21.3) { B(x, -1, z, T.LAVA); B(x, -2, z, BS); B(x, -3, z, BS); }
      else { B(x, -1, z, scorch(x, z)); B(x, -2, z, BS); } }
    // the bridge over the moat (iron railings), path out to where the land bridge comes in
    for (let z = 12; z <= 22; z++) for (let x = -2; x <= 1; x++) B(x, 0, z, (z & 3) === 0 ? OB : DB); for (const x of [-3, 2]) for (let z = 17; z <= 22; z++) { B(x, 0, z, BS); B(x, 1, z, BARS); }
    for (let x = -2; x <= 1; x++) K.stair(x, 0, 23, 0, DBS);
    const [ex, ez] = K.end; const onPath = (x, z) => { const vx = ex + 0.5, vz = ez - 23, L = Math.hypot(vx, vz) || 1, t = Math.max(0, Math.min(1, ((x + 0.5) * vx + (z - 23) * vz) / (L * L))); return Math.hypot(x + 0.5 - vx * t, z - 23 - vz * t) < 2; };
    for (let x = -23; x <= 23; x++) for (let z = -23; z <= 23; z++) { const r = Math.hypot(x, z); if (r < 21.4 || r > 23.5) continue; if (onPath(x, z) || (z >= 22 && Math.abs(x + 0.5) < 2.5)) B(x, -1, z, DB); else { const v = h(x, 62, z); if (v < 0.04) K.prop('fire', x, 0, z, 2, {}, 'floor'); } }
    // curtain wall (2 thick) with spiked merlons
    for (let x = -11; x <= 11; x++) for (let z = -11; z <= 11; z++) { const d = Math.max(Math.abs(x), Math.abs(z)); if (d < 10) continue; for (let y = F; y <= F + 6; y++) B(x, y, z, blk(x, y, z));
      if (d === 11 && ((x + z) & 1) === 0) { B(x, F + 7, z, blk(x, F + 7, z)); if (((x + z) & 3) === 0) K.prop('spike', x, F + 8, z, 2, {h: 1.1}, 'floor'); } }
    const towerUp = (tx, tz, R, top, spR, spN) => { K.tower(tx, tz, R, F, top, (x, y, z) => (y - F) % 4 === 3 ? OB : blk(x, y, z), T.AIR); const ap = K.cone(tx, tz, spR, top + 1, spN, (x, y, z) => (y & 1) ? OB : BS); K.prop('spike', tx, ap, tz, 2, {h: 2.6}, 'floor'); return ap; };
    // four corner towers with tall spires, glowing red windows
    for (const [tx, tz] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) { towerUp(tx, tz, 2.6, F + 13, 3.0, 10); const sx = Math.sign(tx), sz = Math.sign(tz);
      for (const y of [F + 4, F + 9]) for (const [a, q, f] of [[sx * 2, 0, sx > 0 ? 3 : 1], [0, sz * 2, sz > 0 ? 2 : 0]]) { B(tx + a, y, tz + q, BARS); B(tx + a, y + 1, tz + q, BARS); }   /* v1.0.29: barred, not red */
      for (let y = F; y <= F + 1; y++) B(tx - sx * 2, y, tz, T.AIR); }
    // gatehouse: twin spired towers, raised portcullis, chains down to the bridge, a red window
    for (const tx of [-3, 2]) towerUp(tx, 11, 2.0, F + 10, 2.4, 8);
    box(-2, F, 10, 1, F + 8, 12, blk); box(-1, F, 10, 0, F + 2, 12, T.AIR); B(-1, F + 3, 12, T.AIR); B(0, F + 3, 12, T.AIR); K.prop('portc', -1, F + 3, 12, 2, {w: 2, h: 0.8, v: 1}, [-1, F + 4, 12]);
    for (const x of [-1, 0]) B(x, F + 6, 12, BARS); for (const x of [-2, 1]) K.prop('chain', x, F + 7, 13, 2, {L: 7, v: 1}, 'wall');
    K.lamp(-2, F + 1, 13, 0, {}); K.lamp(1, F + 1, 13, 0, {});
    for (const [x, z, f] of [[-6, 12, 2], [5, 12, 2], [12, -4, 3], [12, 4, 3], [-12, -4, 1], [-12, 4, 1], [-5, -12, 0], [5, -12, 0]]) { if ((x + z) & 1) K.prop('chain', x + (f === 2 ? 1 : 0), F + 5, z, f, {L: 4, v: 1}, 'wall'); }
    // courtyard: a dark brick path, braziers, soul sand and magma patches
    for (let x = -9; x <= 9; x++) for (let z = -9; z <= 9; z++) { if (Math.abs(x) <= 1 && z >= 0) { B(x, 0, z, DB); continue; } const v = h(x, 63, z); if (v < 0.1) B(x, 0, z, SS); else if (v < 0.14) B(x, 0, z, MG); }
    for (const [x, z] of [[-3, 1], [3, 1], [-2, 8], [2, 8]]) { B(x, F, z, OB); K.prop('brazier', x, F + 1, z, 2, {}, 'floor'); }
    // ---- the gothic keep / throne hall: x -8..8, z -9..-1, steep roof, pinnacles, the great spire tower ----
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) { const e = x === X0 || x === X1 || z === Z0 || z === Z1; B(x, 0, z, ((x + z) & 1) ? DB : OB);
      for (let y = F; y < RT; y++) B(x, y, z, e ? blk(x, y, z) : y === CE ? (z === -3 || z === -6 ? OB : BS) : T.AIR); }
    for (let k = 0; k <= 9; k++) { const xa = X0 - 1 + k, xb = X1 + 1 - k, y = RT + k; if (xa > xb) break; for (let z = Z0 - 1; z <= Z1 + 1; z++) { B(xa, y, z, (k & 1) ? OB : BS); B(xb, y, z, (k & 1) ? OB : BS); }
      for (const z of [Z0, Z1]) for (let x = xa + 1; x < xb; x++) B(x, y, z, blk(x, y, z)); }
    for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]]) { for (let y = RT; y <= RT + 4; y++) B(x, y, z, y === RT + 4 ? OB : DB); K.prop('spike', x, RT + 5, z, 2, {h: 1.8}, 'floor'); }
    for (const z of [Z0 - 1, Z1 + 1]) K.prop('spike', 0, RT + 10, z, 2, {h: 2.2}, [0, RT + 9, z]);
    for (let x = -2; x <= 2; x++) for (let z = -9; z <= -5; z++) { const e = Math.abs(x) === 2 || z === -9 || z === -5; for (let y = CE + 1; y <= F + 26; y++) B(x, y, z, e ? ((y - F) % 5 === 0 ? OB : blk(x, y, z)) : T.AIR); }
    for (const [x, z] of [[-2, -9], [2, -9], [-2, -5], [2, -5]]) { for (let y = F + 27; y <= F + 29; y++) B(x, y, z, OB); K.prop('spike', x, F + 30, z, 2, {h: 1.6}, 'floor'); }
    const apex = K.cone(0, -7, 2.5, F + 27, 12, (x, y, z) => (y & 1) ? OB : BS); K.prop('spike', 0, apex, -7, 2, {h: 3.2}, 'floor');
    for (const y of [F + 20, F + 24]) for (const [x, z, f] of [[0, -5, 2], [0, -9, 0], [-2, -7, 1], [2, -7, 3]]) { __rpane(K, x, y, z); __rpane(K, x, y + 1, z); }
    // glowing red lancet windows, rose window, the great pointed door
    const win = (x, y0, z, n, f) => { for (let y = y0; y < y0 + n; y++) __rpane(K, x, y, z); };
    const bar = (x, y0, z, n) => { for (let y = y0; y < y0 + n; y++) B(x, y, z, BARS); }; for (const z of [-3, -6]) { bar(X0, F + 3, z, 5); bar(X1, F + 3, z, 5); } for (const x of [-4, 4]) win(x, F + 3, Z1, 5, 2); for (const x of [-1, 0, 1]) win(x, F + 6, Z1, x ? 3 : 4, 2); win(0, F + 9, Z0, 2, 0);
    box(-1, F, Z1, 1, F + 2, Z1, T.AIR); B(0, F + 3, Z1, T.AIR); K.lamp(-2, F + 2, Z1 + 1, 0, {}); K.lamp(2, F + 2, Z1 + 1, 0, {}); 
    U.throne(K, {F, CE}); U.blackStairs(K, {F, CE, RT, blk});
    for (const x of [-3, 3]) K.prop('banT', x, F + 7, -8, 2, {v: 1, L: 3}, 'wall');   // v1.0.33: the only banners, inside
    try { if (window.__c175) __c175.black(K, {F, CE, RT, blk, win}); } catch (e) { U.err175 = String(e); }
    // the broken Hell portal + lava pool south of the castle (kept where the clansmen look for it)
    const pz = 22; let n = 0; for (let ax = -4; ax <= 5; ax++) for (let az = pz - 4; az <= pz + 4; az++) { const v = U.h3(K.cx + ax, 64, K.cz + az); if (Math.hypot(ax + 1, az - pz) < 4.8) AB(ax, -1, az, v < 0.45 ? HR : v < 0.7 ? SS : MG); }
    for (let a = 0; a <= 3; a++) for (let y = 0; y <= 4; y++) { const edge = a === 0 || a === 3 || y === 0 || y === 4, miss = (a === 3 && y === 4) || (a === 0 && y === 2); AB(-3 + a, y, pz, edge && !miss ? OB : T.AIR); if (edge && !miss) n++; for (const dz of [-1, 1]) for (let yy = 0; yy <= 4; yy++) AB(-3 + a, yy, pz + dz, T.AIR); }
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) AB(3 + a, -1, pz + b, T.LAVA); for (let a = -1; a <= 2; a++) for (let b = -1; b <= 2; b++) if (a < 0 || a > 1 || b < 0 || b > 1) AB(3 + a, -1, pz + b, HB);
    // the clansmen look for the first bottom row of 4 obsidian south of the castle: make sure that is the portal, not a castle course
    const ob = (x, y, z) => world[idx(x, y, z)] === OB, PX = K.cx - 3, PZ = K.cz + pz; let fixed = 0;
    for (let z = K.cz + 6; z <= PZ; z++) for (let x = K.cx - 10; x <= K.cx + 8; x++) { if (x < 2 || x >= W - 6 || z >= D - 2) continue; for (let y = 4; y < H - 7; y++) { if (z === PZ && x === PX && y === K.gy) continue;
      if (ob(x, y, z) && ob(x + 1, y, z) && ob(x + 2, y, z) && ob(x + 3, y, z) && !ob(x + 1, y + 1, z) && !placedSet.has(idx(x + 1, y, z))) { world[idx(x + 1, y, z)] = BS; fixed++; } } }
    // v1.0.29: a working portal to the nether on the east terrace, inside the moat (walk round from the bridge)
    for (let a = -1; a <= 4; a++) for (let y = 1; y <= 6; y++) for (let z = 2; z <= 4; z++) B(12 + a, y, z, T.AIR);
    for (let a = 0; a <= 3; a++) for (let y = 0; y <= 4; y++) { const edge = a === 0 || a === 3 || y === 0 || y === 4; B(12 + a, y, 3, edge ? OB : T.PORTAL); }
    for (const a of [-1, 4]) { B(12 + a, 1, 4, OB); K.prop('brazier', 12 + a, 2, 4, 2, {}, 'floor'); }
    const wpP = K.wp(13, 1, 3);
    return {portal: [PX, K.gy, PZ, n], obFix: fixed, live: wpP};
  };
  // ---- v1.0.29: real stairs inside - up the west wall of the throne hall to the attic under the roof, then a spiral up the great spire to the lookout room ----
  U.blackStairs = function (K, o) { const {B} = K, {F, CE, blk} = o;
    for (let k = 0; k <= 4; k++) { const x = -3 - k; for (let y = F; y < F + k; y++) B(x, y, -2, blk(x, y, -2)); K.stair(x, F + k, -2, 1, DBS); }   // along the front wall, heading west
    for (let k = 0; k <= 5; k++) { const z = -3 - k, y = F + 5 + k; for (let yy = F; yy < y; yy++) B(-7, yy, z, blk(-7, yy, z)); K.stair(-7, y, z, 0, DBS); for (let yy = y + 1; yy <= y + 3 && yy <= CE; yy++) B(-7, yy, z, T.AIR); }
    B(-7, F + 5, -2, T.AIR); B(-7, F + 6, -2, T.AIR);
    for (const z of [-6, -7, -8]) B(-7, CE, z, T.AIR); K.stair(-6, CE, -8, 3, DBS);   // up through the ceiling
    for (const [x, z] of [[-6, -6], [-6, -7], [-7, -5]]) B(x, CE + 1, z, BARS);   // a rail round the stairwell
    // the attic: dark floor, braziers and lamps, a chest
    for (const [x, z] of [[-5, -3], [5, -3], [5, -8], [-4, -8]]) K.lamp(x, CE + 1, z, -1, {});
    K.prop('rug', 5, CE + 1, -5, 2, {w: 3, d: 5, h: 0.02, v: 2}, 'floor'); K.chest(6, CE + 1, -2, 2, [[IT.GOLDINGOT, 2], [T.OBSIDIAN, 2], [IT.COAL, 6]]);
    // into the great spire (west side) and round and up
    B(-2, CE + 1, -7, T.AIR); B(-2, CE + 2, -7, T.AIR);
    const ring = [[-1, -7], [-1, -8], [0, -8], [1, -8], [1, -7], [1, -6], [0, -6], [-1, -6]], FA = [0, 3, 3, 2, 2, 1, 1, 0];
    for (let y = CE + 1; y <= F + 22; y++) B(0, y, -7, T.OBSIDIAN || 189);
    for (let k = 0; k <= 10; k++) { const [x, z] = ring[(k + 1) % 8]; K.stair(x, CE + 1 + k, z, FA[(k + 1) % 8], DBS); }
    const top = F + 23; for (const [x, z] of ring.concat([[0, -7]])) B(x, top, z, BS); for (const k of [9, 10]) { const [x, z] = ring[(k + 1) % 8]; B(x, top, z, T.AIR); } K.stair(ring[4][0], top, ring[4][1], FA[4], DBS);
    K.lamp(0, top + 1, -7, -1, {}); for (const y of [CE + 4, F + 19]) B(0, y, -7, T.GLOWROCK || T.LAMP); };
  // ---- throne room (image 6): polished dark floor, red carpet up a stepped dais, tall black throne, lava falls behind iron bars, braziers, hanging cages, sword racks, treasure ----
  U.throne = function (K, o) { const {B, box} = K, {F, CE} = o;
    for (let z = -5; z <= -2; z++) for (let x = -1; x <= 1; x++) B(x, F, z, RCARP);
    for (let x = -3; x <= 3; x++) { K.stair(x, F, -6, 0, DBS); B(x, F, -7, DB); B(x, F, -8, DB); } for (let x = -2; x <= 2; x++) { K.stair(x, F + 1, -7, 0, DBS); B(x, F + 1, -8, DB); }
    K.prop('rug', 0, F + 1, -6, 2, {w: 3, d: 1, h: 0.02, v: 2}, 'floor'); K.prop('throne', 0, F + 2, -8, 2, {}, 'floor'); B(-1, F + 2, -8, RCARP); B(1, F + 2, -8, RCARP);
    K.chest(2, F + 2, -8, 2, [[IT.FLINTSTEEL, 1], [T.OBSIDIAN, 4], [IT.GOLDINGOT, 5], [IT.RUBY || IT.DIAMOND, 2]]); B(-2, F + 2, -8, T.GOLDBLOCK || 75);
    // two lava falls in the back wall behind iron bars
    for (const s of [-1, 1]) for (let a = 4; a <= 6; a++) { const x = s * a; for (let y = F; y <= F + 9; y++) { B(x, y, -9, T.LAVA); B(x, y, -8, BARS); } }
    // obsidian columns, braziers, sword racks, cages on chains, banners, lamps
    for (const s of [-1, 1]) { for (const z of [-3, -6]) for (let y = F; y < CE; y++) B(s * 5, y, z, OB); for (const z of [-3, -5]) K.prop('brazier', s * 3, F, z, 2, {}, 'floor');
      for (const z of [-2, -4]) if (s > 0) K.prop('srack', s * 7, F, z, 1, {}, 'floor');
      K.prop('cage', s * 3, CE - 1, -4, 2, {L: 2.2, v: s > 0 ? 1 : 0}, [s * 3, CE, -4]); K.prop('cage', s * 6, CE - 1, -2, 2, {L: 3.2, v: s < 0 ? 1 : 0}, [s * 6, CE, -2]);
      if (s > 0) K.prop('chain', s * 7, CE - 1, -7, 1, {L: 6, v: 1}, 'wall');
      if (s > 0) K.lamp(7, F + 3, -5, 3, {}); else K.lamp(-6, F + 3, -5, 1, {}); }
    K.lamp(0, F + 6, -8, 0, {});
  };
})();
