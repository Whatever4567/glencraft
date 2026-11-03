
/* ===================== GLX-F3 (v0.9.17): deeper/bigger caves, more entrances, ravines, abandoned mineshafts, castle cellars ===================== */
function lootChest(x, y, z, table, rnd) {
  const slots = new Array(27).fill(null); let i = 0;
  for (const [id, n, p] of table) if (rnd() < p) { slots[Math.floor(rnd() * 27)] = [id, Math.max(1, Math.round(n * (0.5 + rnd())))]; i++; }
  if (!i) slots[3] = [table[0][0], table[0][1]];
  world[idx(x, y, z)] = T.CHEST; chests.set(keyOf(x, y, z), {slots});
}
function g9Underground() {
  let s = (gSeed ^ 0x5bd1e995) >>> 0 || 1; const rnd = () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909), s = (s ^ (s >>> 16)) >>> 0) / 4294967296);
  const carvable = b => b === T.STONE || b === T.DIRT || b === T.DEEPSLATE || b === T.GRASS || b === T.HEATHER || b === T.SAND || b === T.PEAT || b === T.MUD || b === T.COALORE || b === T.IRONORE || b === T.COPPERORE || b === T.GOLDORE || b === T.REDORE || b === T.DIAMONDORE || b === 179 || b === 181;
  const nearWater = (x, y, z) => world[idx(x, y + 1, z)] === T.WATER || world[idx(x + 1, y, z)] === T.WATER || world[idx(x - 1, y, z)] === T.WATER || world[idx(x, y, z + 1)] === T.WATER || world[idx(x, y, z - 1)] === T.WATER;
  const ball = (cx, cy, cz, r, ry) => {
    const R = Math.ceil(r), Ry = Math.ceil(ry || r);
    for (let x = Math.max(2, Math.floor(cx - R)); x <= Math.min(W - 3, cx + R); x++) for (let z = Math.max(2, Math.floor(cz - R)); z <= Math.min(D - 3, cz + R); z++) for (let y = Math.max(3, Math.floor(cy - Ry)); y <= Math.min(H - 3, cy + Ry); y++) {
      const dx = (x - cx) / r, dy = (y - cy) / (ry || r), dz = (z - cz) / r; if (dx * dx + dy * dy + dz * dz > 1) continue;
      const i = idx(x, y, z), b = world[i]; if (!carvable(b) || nearWater(x, y, z)) continue; world[i] = y < 7 ? T.LAVA : T.AIR;
    }
  };
  const stats = {worms: 0, entrances: 0, ravines: 0, shafts: 0, chests: 0};
  // 1) big worm caves, deeper and wider; one in three starts at the surface (an entrance)
  const nW = Math.round(W * D / 2600);
  for (let n = 0; n < nW; n++) {
    let x = 8 + rnd() * (W - 16), z = 8 + rnd() * (D - 16), y;
    const ent = rnd() < 0.34; if (ent) { for (let t = 0; t < 12; t++) { y = (g9cols ? g9cols[(Math.floor(x) * D + Math.floor(z)) * 2] : SEA + 4) - 1; if (y > SEA + 1) break; x = 8 + rnd() * (W - 16); z = 8 + rnd() * (D - 16); } if (y <= SEA + 1) continue; stats.entrances++; } else y = 6 + rnd() * (SEA - 10);
    let yaw = rnd() * 6.283, pitch = ent ? -0.6 : (rnd() - 0.5) * 0.4; const len = 60 + rnd() * 140, big = rnd() < 0.25;
    for (let k = 0; k < len; k++) {
      const r = (big ? 3.2 : 1.9) + Math.sin(k * 0.21) * 0.9 + rnd() * 0.5;
      ball(x, y, z, r, r * 0.8);
      if (big && rnd() < 0.02) ball(x, y, z, r * 2.6, r * 1.6);   // caverns
      yaw += (rnd() - 0.5) * 0.5; pitch = pitch * 0.92 + (rnd() - 0.5) * 0.18; if (y < 8) pitch = Math.abs(pitch); if (!ent && y > SEA - 4) pitch = -Math.abs(pitch);
      x += Math.cos(yaw) * Math.cos(pitch); z += Math.sin(yaw) * Math.cos(pitch); y += Math.sin(pitch);
      if (x < 6 || z < 6 || x > W - 6 || z > D - 6) break;
    }
    stats.worms++;
  }
  // 2) ravines: long deep cracks from the surface
  for (let n = 0, rv = Math.round(W * D / 50000) + 2, tries = 0; n < rv && tries < rv * (current && current.created > 1792555200000 ? 15 : 1); tries++) {
    let x = 30 + rnd() * (W - 60), z = 30 + rnd() * (D - 60); const top = g9cols ? g9cols[(Math.floor(x) * D + Math.floor(z)) * 2] : SEA + 6; if (top <= SEA + 2) continue;
    let yaw = rnd() * 6.283; const len = 40 + rnd() * 50, bottom = 6 + rnd() * 10;
    for (let k = 0; k < len; k++) {
      const w = 1.2 + Math.sin(k / len * Math.PI) * (2.2 + rnd() * 0.6);
      for (let y = Math.floor(bottom); y < H - 3; y++) { const ww = w * (0.55 + 0.45 * Math.min(1, (y - bottom) / 12)); ball(x, y, z, ww, 1); if (y > top + 2) break; }
      yaw += (rnd() - 0.5) * 0.15; x += Math.cos(yaw); z += Math.sin(yaw); if (x < 8 || z < 8 || x > W - 8 || z > D - 8) break;
    }
    stats.ravines++; n++;
  }
  // 3) abandoned mineshafts: plank-lined corridors with posts and beams, cobwebs, rail-track planks and loot chests
  const LOOT = [[IT.IRONINGOT, 3, 0.6], [IT.COAL, 6, 0.8], [IT.GOLDINGOT, 2, 0.35], [IT.REDSTONE, 4, 0.5], [IT.DIAMOND, 1, 0.12], [T.TORCH, 8, 0.6], [IT.BREAD, 3, 0.5], [IT.RAWSILVER, 3, 0.3], [IT.CAIRNGORM, 1, 0.15]];
  for (let n = 0; n < Math.round(W * D / 60000) + 1; n++) {
    const sx = 40 + Math.floor(rnd() * (W - 80)), sz = 40 + Math.floor(rnd() * (D - 80)), sy = 18 + Math.floor(rnd() * 14);
    const seg = [[sx, sz, rnd() < 0.5 ? 0 : 1, 0]]; let made = 0;
    while (seg.length && made < 14) {
      const [x0, z0, ax, depth] = seg.shift(); const L = 12 + Math.floor(rnd() * 20), dir = rnd() < 0.5 ? 1 : -1; made++;
      for (let k = 0; k < L; k++) {
        const x = ax === 0 ? x0 + k * dir : x0, z = ax === 1 ? z0 + k * dir : z0; if (x < 6 || z < 6 || x > W - 6 || z > D - 6) break;
        for (let w = -1; w <= 1; w++) for (let h = 0; h < 3; h++) { const xx = ax === 0 ? x : x + w, zz = ax === 1 ? z : z + w, i = idx(xx, sy + h, zz); if (world[i] !== T.WATER) world[i] = T.AIR; }
        const fx = x, fz = z; if (world[idx(fx, sy - 1, fz)] === T.AIR || world[idx(fx, sy - 1, fz)] === T.LAVA) world[idx(fx, sy - 1, fz)] = T.PLANKS;
        if (k % 4 === 0) {   // support frame
          for (const w of [-1, 1]) { const xx = ax === 0 ? x : x + w, zz = ax === 1 ? z : z + w; world[idx(xx, sy, zz)] = 162; world[idx(xx, sy + 1, zz)] = 162; }
          for (let w = -1; w <= 1; w++) { const xx = ax === 0 ? x : x + w, zz = ax === 1 ? z : z + w; world[idx(xx, sy + 2, zz)] = T.PLANKS; }
          if (rnd() < 0.3) world[idx(ax === 0 ? x : x + 1, sy + 1, ax === 1 ? z : z + 1)] = T.TORCH;
        } else if (rnd() < 0.12) { const w = rnd() < 0.5 ? -1 : 1; world[idx(ax === 0 ? x : x + w, sy + 2, ax === 1 ? z : z + w)] = T.COBWEB; }
        if (rnd() < 0.025) { const w = rnd() < 0.5 ? -1 : 1; lootChest(ax === 0 ? x : x + w, sy, ax === 1 ? z : z + w, LOOT, rnd); stats.chests++; }
        if (k === L - 1 || rnd() < 0.06) seg.push([x, z, 1 - ax, depth + 1]);
      }
    }
    stats.shafts++;
  }
  g9Underground.stats = stats;
}
// 4) castle cellars: a stair from each castle's ground floor down into the caves
function castleCellars() {
  let n = 0;
  for (const rm of (typeof roomList !== 'undefined' ? roomList : [])) {
    if (rm.cellar) continue; rm.cellar = 1;
    const [cx, gy, cz] = rm; let x = cx + 2, z = cz - 2, y = gy - 1;
    if (x < 8 || z < 8 || x > W - 8 || z > D - 8) continue;
    for (let k = 0; k < 22 && y > 8; k++) {
      for (let h = 0; h < 4; h++) for (const w of [0, 1]) world[idx(x, y + h, z + w)] = T.AIR;
      for (const w of [0, 1]) { world[idx(x, y, z + w)] = 165; entMeta.set(keyOf(x, y, z + w), {face: 1}); world[idx(x, y - 1, z + w)] = T.STONEBRICK; }
      if (k % 5 === 2) world[idx(x, y + 2, z - 1)] = T.TORCH;
      x++; y--;
    }
    // a small vaulted cellar at the bottom, opening into the rock
    for (let dx = 0; dx < 7; dx++) for (let dz = -3; dz < 4; dz++) for (let h = 0; h < 4; h++) { const i = idx(x + dx, y + h, z + dz); if (world[i] !== T.WATER) world[i] = T.AIR; }
    world[idx(x + 3, y + 2, z + 3)] = T.TORCH; n++;
  }
  return n;
}
(function () {
  const g = generate;
  generate = function () {
    if (typeof roomList !== 'undefined') roomList.length = 0;
    const r = g.apply(this, arguments);
    if (genVer === GEN9 && W > 200) { try { const t = performance.now(); g9Underground(); g9Underground.stats.ms = Math.round(performance.now() - t); if (!cityGen) g9Underground.stats.cellars = castleCellars(); console.log('[underground]', JSON.stringify(g9Underground.stats)); } catch (e) { console.warn('underground', e); } }
    return r;
  };
})();
