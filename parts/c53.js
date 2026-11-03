
/* ===================== GLX-C53 (v0.9.48): exactly 3 survival castles - clansfolk castle near spawn, abandoned mossy castle, blackstone castle with a broken Hell portal ===================== */
(function c53() {
  const BLK = 248; T.BLACKSTONE = BLK;
  { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#1b1a1e'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) { const v = 20 + Math.random() * 30 | 0; g.fillStyle = `rgb(${v},${v - 2},${v + 4})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 5, 2 + Math.random() * 4); }
    g.fillStyle = '#0a0a0c'; for (let r = 0; r < 4; r++) { g.fillRect(0, r * 64, 256, 5); for (let k = 0; k < 2; k++) g.fillRect(((r % 2) * 64 + k * 128) % 256, r * 64, 5, 64); }
    g.fillStyle = 'rgba(120,110,140,.12)'; for (let r = 0; r < 4; r++) g.fillRect(0, r * 64 + 5, 256, 3);
    TEX.blackstone = c.toDataURL(); }
  NAMES[BLK] = 'Blackstone'; FACES[BLK] = 'blackstone'; ICON_KEY[BLK] = 'blackstone'; BLOCK_MATS[BLK] = mat('blackstone'); HARD[BLK] = 1.8; MC_HARD[BLK] = 1.8; REQ[BLK] = 1; PLACEABLE.add(BLK);
  try { __NAT[BLK] = 1; } catch (_) {} if (!ORDER.includes(BLK)) ORDER.push(BLK); if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(BLK);
  const BASE = {human: 'turrets', mossy: 'turrets', black: 'towerhouse'};
  const SIZE = {citadel: 20, lochisle: 17, turrets: 15, towerhouse: 13};
  const isNew = () => current && current.mode !== 'creative' && (current.created > NEW_CASTLES_AT || current.newCastles);
  const cf = castleFriendly; castleFriendly = function (c) { if (c && BASE[c[0]]) return c[0] === 'human'; return cf.apply(this, arguments); };
  const gyAt = new Map();
  const bk = buildKeep; buildKeep = function (kind, cx, cz) { const r = bk.apply(this, arguments); gyAt.set(cx + ',' + cz, r); return r; };
  const old = g9PlaceCastles;
  g9PlaceCastles = function () {
    if (!isNew() || W < 200) return old.apply(this, arguments);
    const hAt = (x, z) => g9cols[(x * D + z) * 2], kd = (x, z) => g9cols[(x * D + z) * 2 + 1], cx0 = W >> 1, cz0 = D >> 1, placed = [];
    const flat = (x, z, r) => { let lo = 1e9, hi = -1e9, wet = 0; for (let a = -r; a <= r; a += 3) for (let b = -r; b <= r; b += 3) { const h = hAt(x + a, z + b); lo = Math.min(lo, h); hi = Math.max(hi, h); if (kd(x + a, z + b) === 5 || h <= SEA) wet++; } return {lo, hi, wet}; };
    const ok = (x, z, r) => x > r + 8 && z > r + 8 && x < W - r - 8 && z < D - r - 8 && placed.every(p => Math.hypot(p[1] - x, p[2] - z) > 75) && castleAvoid.every(a => x + r < a.x0 - 6 || x - r > a.x1 + 6 || z + r < a.z0 - 6 || z - r > a.z1 + 6);
    const best = (r, sc) => { let bx = -1, bz = -1, bs = -1e18; for (let x = 0; x < W; x += 4) for (let z = 0; z < D; z += 4) { if (!ok(x, z, r)) continue; const f = flat(x, z, r - 2); if (f.wet) continue; const s = sc(x, z, f) - (f.hi - f.lo) * 6; if (s > bs) { bs = s; bx = x; bz = z; } } return bx >= 0 ? [bx, bz] : null; };
    const sp = g9findSpawn() || [cx0, 0, cz0];
    const want = [['human', (x, z) => -Math.abs(Math.hypot(x - sp[0], z - sp[2]) - 50) * 3], ['mossy', (x, z) => -Math.hypot(x - cx0, z - cz0) * 2 - (Math.hypot(x - sp[0], z - sp[2]) < 45 ? 1e6 : 0)], ['black', (x, z) => Math.hypot(x - sp[0], z - sp[2])]];
    for (const [k, sc] of want) { const S = SIZE[BASE[k]]; const p = best(S + 6, sc); if (p) placed.push([k, p[0], p[1]]); }
    window.__bareKeep = true; try { for (const c of placed) { try { buildCastle(BASE[c[0]], c[1], c[2]); } catch (e) { console.warn('castle', c, e); } } } finally { window.__bareKeep = false; }
    g9castles = placed; return placed; };
  // ---- after every pass: empty clean interiors, one chest each, the castle's own look, the broken portal ----
  const DECOR = new Set([T.TORCH, 161, 216, 162, T.CHEST, T.TAPESTRY, T.RCARPET, T.BOOKSHELF, T.WOOL, 221, T.FURNACE, T.CAULDRON, T.TABLE, 164, T.COBWEB, T.BED, 219, 220, 222, 223, T.IRONBLOCK].filter(v => v !== undefined));
  const STONES = new Set([T.STONEBRICK, T.MOSSYBRICK, T.COBBLE, T.WSTONE, T.SLATE].filter(v => v !== undefined));
  const h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function finishCastles() {
    if (!isNew() || DIM.cur) return null; const out = [];
    for (const c of g9castles) { if (!BASE[c[0]]) continue; const [k, cx, cz] = c, S = SIZE[BASE[k]], R = S + 2, gy = gyAt.get(cx + ',' + cz) || (solidTop(cx, cz) + 1);
      let removed = 0;
      for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) for (let y = Math.max(2, gy - 3); y < Math.min(H - 1, gy + 26); y++) { const i = idx(x, y, z), b = world[i]; if (!b) continue;
        if (placedSet && placedSet.has(i)) continue;
        if (DECOR.has(b)) { world[i] = b === T.RCARPET ? (k === 'black' ? BLK : T.STONEBRICK) : T.AIR; entMeta.delete(keyOf(x, y, z)); chests.delete(keyOf(x, y, z)); removed++; continue; }
        if (b === T.GLOWROCK || b === T.LAVA && y > gy) { world[i] = T.AIR; continue; }
        if (STONES.has(b)) { if (k === 'black') world[i] = BLK; else if (k === 'human') { if (b === T.MOSSYBRICK || b === T.COBBLE && y > gy) world[i] = T.STONEBRICK; }
          else { const r = h3(x, y, z); world[i] = r < 0.45 ? T.MOSSYBRICK : r < 0.6 ? T.COBBLE : T.STONEBRICK; if (y > gy + 4 && r > 0.955 && !world[idx(x, y + 1, z)]) world[i] = T.AIR; } } }
      // the one chest, in the keep by the front door
      const KX = S - 6, kz1 = cz - 2, x0 = cx - KX, chx = x0 + 1, chz = kz1 - 1; let chy = gy; while (chy < gy + 3 && world[idx(chx, chy, chz)]) chy++;
      const loot = k === 'human' ? [[IT.IRONINGOT, 6], [IT.BREAD, 6], [IT.COOKEDMUTTON || IT.MUTTON, 4], [IT.DIAMOND, 3]] : k === 'mossy' ? [[IT.IRONINGOT, 3], [IT.BREAD, 3], [IT.POTATO, 4]] : [[IT.FLINTSTEEL, 1], [T.OBSIDIAN, 4]];
      const slots = new Array(27).fill(null); loot.forEach(([id, n], j) => { if (id) slots[[4, 10, 13, 16][j]] = [id, n]; });
      world[idx(chx, chy, chz)] = T.CHEST; chests.set(keyOf(chx, chy, chz), {slots, castle: k}); entMeta.set(keyOf(chx, chy, chz), {face: 1});
      // blackstone castle: an unfinished portal (2 obsidian missing), a 1x1 lava pool and Hell blocks around it
      let portal = null;
      if (k === 'black') { const px = cx - 2, pz = cz + S + 6; if (pz < D - 6) { const g = solidTop(px, pz);
          for (let x = px - 4; x <= px + 7; x++) for (let z = pz - 4; z <= pz + 4; z++) { const t = solidTop(x, z); if (Math.abs(t - g) > 3) continue; const r = h3(x, 7, z); if (r < 0.7) world[idx(x, t, z)] = r < 0.42 ? T.HELLROCK : r < 0.6 ? T.SOULSAND : T.MAGMA; for (let y = t + 1; y < t + 7; y++) if (world[idx(x, y, z)] && !STONES.has(world[idx(x, y, z)])) world[idx(x, y, z)] = T.AIR; }
          for (let x = px - 1; x <= px + 2; x++) for (let z = pz - 1; z <= pz + 1; z++) { world[idx(x, g, z)] = T.HELLROCK; for (let y = g + 1; y <= g + 6; y++) world[idx(x, y, z)] = T.AIR; }
          let n = 0; for (let x = px - 1; x <= px + 2; x++) for (let y = g + 1; y <= g + 5; y++) { const edge = x === px - 1 || x === px + 2 || y === g + 1 || y === g + 5; if (!edge) continue; const miss = (x === px + 2 && y === g + 5) || (x === px - 1 && y === g + 3); world[idx(x, y, pz)] = miss ? T.AIR : T.OBSIDIAN; if (!miss) n++; }
          world[idx(px + 5, g, pz)] = T.LAVA; portal = [px, g + 1, pz, n]; } }
      out.push({k, cx, cz, gy, removed, chest: [chx, chy, chz], portal}); }
    try { scanLights(); validateLights(); } catch (_) {}
    return out; }
  const ge = generate; generate = function () { const r = ge.apply(this, arguments); try { const was = c37busy; c37busy = true; window.__c53 = finishCastles(); c37busy = was; } catch (e) { console.warn('c53', e); } return r; };
  // no other ruins in new survival worlds
  window.__c53finish = finishCastles;
})();
