
/* ===================== GLX-E4 (v0.9.14): castles sit on the land (foundations, levelled ground) and always have interiors ===================== */
(function castleFix() {
  const CR = {citadel: 32, turrets: 24, towerhouse: 18, lochisle: 26};
  const isAirish = b => b === T.AIR || b === T.WATER || b === T.LEAVES || b === T.LOG || b === T.TALLGRASS || (PLANT && PLANT[b]);
  const bc = buildCastle;
  buildCastle = function (kind, cx, cz) {
    const R = CR[kind] || 24, x0 = Math.max(0, cx - R), x1 = Math.min(W - 1, cx + R), z0 = Math.max(0, cz - R), z1 = Math.min(D - 1, cz + R);
    const sw = x1 - x0 + 1, sd = z1 - z0 + 1, snap = new Uint8Array(sw * sd * H);
    for (let x = x0; x <= x1; x++) for (let y = 0; y < H; y++) { const b = (x * H + y) * D; for (let z = z0; z <= z1; z++) snap[((x - x0) * H + y) * sd + (z - z0)] = world[b + z]; }
    // level the site first: the castle's ground is the median of the land under it (not the single centre column)
    const hs = []; for (let x = cx - R + 6; x <= cx + R - 6; x += 3) for (let z = cz - R + 6; z <= cz + R - 6; z += 3) if (x >= 0 && z >= 0 && x < W && z < D) hs.push(g9top(x, z));
    hs.sort((a, b) => a - b); const med = hs.length ? hs[hs.length >> 1] : g9top(cx, cz);
    const cg = g9top(cx, cz); if (Math.abs(cg - med) > 1) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const x = cx + dx, z = cz + dz; for (let y = med + 1; y < Math.min(H - 1, cg + 1); y++) world[idx(x, y, z)] = T.AIR; for (let y = cg; y <= med; y++) world[idx(x, y, z)] = T.STONE; }
    const r = bc.apply(this, arguments);
    const gy0 = med + 1;
    // 1) foundations: every castle column is filled down to solid ground (no floating walls or towers)
    let filled = 0;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      let low = -1; for (let y = 1; y < H - 1; y++) { const now = world[idx(x, y, z)], was = snap[((x - x0) * H + y) * sd + (z - z0)]; if (now !== was && now !== T.AIR && now !== T.TORCH && now !== T.GLASS) { low = y; break; } }
      if (low < 0) continue;
      for (let y = low - 1; y > 1 && isAirish(world[idx(x, y, z)]); y--) { world[idx(x, y, z)] = (x + y + z) % 5 ? T.STONEBRICK : T.COBBLE; filled++; }
    }
    // 2) interiors: find hollow rooms (air under a castle roof, tall enough) and give them floors every 5 blocks, a stair, torches and furniture
    const inside = new Uint8Array(sw * sd), roofY = new Int16Array(sw * sd), baseY = new Int16Array(sw * sd);
    for (let x = x0 + 1; x < x1; x++) for (let z = z0 + 1; z < z1; z++) {
      let runStart = -1;
      for (let y = Math.max(2, gy0 - 3); y < Math.min(H - 1, gy0 + 40); y++) {
        const now = world[idx(x, y, z)];
        if (now === T.AIR) { if (runStart < 0 && world[idx(x, y - 1, z)] !== T.AIR) runStart = y; continue; }
        if (runStart >= 0) { const was = snap[((x - x0) * H + y) * sd + (z - z0)]; if (now !== was && y - runStart >= 9) { const i = (x - x0) * sd + (z - z0); inside[i] = 1; roofY[i] = y; baseY[i] = runStart; break; } }
        runStart = -1;
      }
    }
    // rooms = connected inside cells
    const seen = new Uint8Array(sw * sd); let rooms = 0;
    for (let i = 0; i < sw * sd; i++) if (inside[i] && !seen[i]) {
      const st = [i], cells = []; seen[i] = 1;
      while (st.length) { const q = st.pop(); cells.push(q); const a = Math.floor(q / sd), b = q % sd; for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const aa = a + da, bb = b + db; if (aa < 0 || bb < 0 || aa >= sw || bb >= sd) continue; const j = aa * sd + bb; if (inside[j] && !seen[j] && Math.abs(baseY[j] - baseY[q]) <= 1) { seen[j] = 1; st.push(j); } } }
      if (cells.length < 9) continue;
      rooms++; const gy = baseY[cells[0]];
      let ax0 = 1e9, ax1 = -1, az0 = 1e9, az1 = -1, minRoof = 1e9; for (const q of cells) { const a = Math.floor(q / sd), b = q % sd; ax0 = Math.min(ax0, a); ax1 = Math.max(ax1, a); az0 = Math.min(az0, b); az1 = Math.max(az1, b); minRoof = Math.min(minRoof, roofY[q]); }
      const sx = x0 + ax0 + 1, sz = z0 + az0 + 1, run = Math.min(5, ax1 - ax0 - 2);
      const storeys = Math.floor((minRoof - gy - 2) / 5);
      for (let s = 1; s <= storeys; s++) {
        const fy = gy + 5 * s - 1;
        for (const q of cells) { const x = x0 + Math.floor(q / sd), z = z0 + q % sd; const hole = z >= sz - 0 && z <= sz + 1 && x >= sx - 1 && x <= sx + run; if (!hole && world[idx(x, fy, z)] === T.AIR) world[idx(x, fy, z)] = T.PLANKS; }
      }
      for (let s = 0; s < storeys && run >= 3; s++) {   // a straight stair along +x in the corner, one flight per storey
        const by = gy + 5 * s; for (let k = 0; k < 5; k++) { const x = sx + Math.min(k, run), y = by + k; if (y >= H - 1) break; world[idx(x, y, sz)] = 165; entMeta.set(keyOf(x, y, sz), {face: 3}); for (let h = 1; h <= 2; h++) if (world[idx(x, y + h, sz)] === T.PLANKS) world[idx(x, y + h, sz)] = T.AIR; if (k >= run) { world[idx(x, y, sz)] = T.COBBLE; entMeta.delete(keyOf(x, y, sz)); } }
      }
      // light + furniture on each level
      const cxr = Math.round(x0 + (ax0 + ax1) / 2), czr = Math.round(z0 + (az0 + az1) / 2); roomList.push([cxr, gy, czr, kind, cells.length, storeys]);
      for (let s = 0; s <= storeys; s++) {
        const fy = gy + 5 * s; if (fy >= minRoof - 1) break;
        for (const [x, z] of [[x0 + ax0, czr], [x0 + ax1, czr], [cxr, z0 + az1]]) if (world[idx(x, fy + 2, z)] === T.AIR && world[idx(x, fy - 1, z)] !== T.AIR) world[idx(x, fy + 2, z)] = T.TORCH;
        if (world[idx(cxr, fy, czr)] === T.AIR && world[idx(cxr, fy - 1, czr)] !== T.AIR) { world[idx(cxr, fy, czr)] = s === 0 ? T.TABLE : (s % 2 ? T.WOOL : T.CHEST); if (s % 2 === 0 && s > 0) castleChestSpots.push([cxr, fy, czr, kind]); }
      }
    }
    if (typeof console !== 'undefined') console.log('[castle] ' + kind + ' foundation ' + filled + ' rooms ' + rooms);
    castleStats.push({kind, filled, rooms});
    return r;
  };
})();
var castleChestSpots = [], castleStats = [], roomList = [];
