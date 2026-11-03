
/* ===================== GLX-H5 (v0.9.28): castles rebuilt like a good survival build (new worlds) ===================== */
Object.assign(T, {RCARPET: 221, TAPESTRY: 222, BOOKSHELF: 223});
(function () {
  const cv = (n, f) => { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); let s = 4242 + n; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; f(g, r); return c.toDataURL('image/png'); };
  TEX.rcarpet = cv(64, (g, r) => { g.fillStyle = '#8a1418'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 400; i++) { g.fillStyle = r() < .5 ? 'rgba(160,30,34,.6)' : 'rgba(90,8,12,.5)'; g.fillRect(r() * 64 | 0, r() * 64 | 0, 2, 2); } g.fillStyle = '#d0a040'; g.fillRect(0, 4, 64, 3); g.fillRect(0, 57, 64, 3); });
  TEX.tapestry = cv(64, (g, r) => { g.fillStyle = '#1e3a6e'; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(40,110,60,.8)'; for (let k = 0; k < 64; k += 16) { g.fillRect(k, 0, 6, 64); g.fillRect(0, k, 64, 6); } g.fillStyle = 'rgba(200,40,40,.7)'; for (let k = 8; k < 64; k += 16) { g.fillRect(k, 0, 2, 64); g.fillRect(0, k, 64, 2); }
    g.fillStyle = '#d8b040'; g.fillRect(0, 0, 64, 4); g.fillRect(0, 60, 64, 4); g.fillRect(0, 0, 4, 64); g.fillRect(60, 0, 4, 64); g.fillStyle = '#e8d070'; g.beginPath(); g.moveTo(32, 14); g.lineTo(44, 30); g.lineTo(32, 50); g.lineTo(20, 30); g.closePath(); g.fill(); g.fillStyle = '#8a1418'; g.beginPath(); g.arc(32, 31, 6, 0, 7); g.fill(); });
  TEX.bookshelf = cv(64, (g, r) => { g.fillStyle = '#6b4a22'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#3a2410'; g.fillRect(0, 30, 64, 4); g.fillRect(0, 0, 64, 3); g.fillRect(0, 61, 64, 3);
    for (const y0 of [3, 34]) for (let x = 2; x < 62;) { const w = 3 + (r() * 4 | 0), h = 20 + (r() * 7 | 0), c = ['#8a1a1a', '#1a4a8a', '#2a6a2a', '#a07a20', '#5a2a6a', '#3a3a3a'][r() * 6 | 0]; g.fillStyle = c; g.fillRect(x, y0 + 27 - h, w, h); g.fillStyle = 'rgba(255,230,160,.35)'; g.fillRect(x, y0 + 30 - h, w, 2); x += w + 1; } });
})();
[[221, 'rcarpet', 'Red carpet', 0.8], [222, 'tapestry', 'Clan tapestry', 0.8], [223, 'bookshelf', 'Bookshelf', 1.5]].forEach(([id, key, name, hd]) => { FACES[id] = key; NAMES[id] = name; ICON_KEY[id] = key; HARD[id] = hd; MC_HARD[id] = hd; REQ[id] = 0; PLACEABLE.add(id); ORDER.push(id); BLOCK_MATS[id] = mat(key); });
FUEL[223] = 15;
RECIPES.push(rc('4 Red carpet', '2 Wool + 1 Redstone dust', T.RCARPET, 4, [[T.WOOL, 2], [IT.REDSTONE, 1]]), rc('Clan tapestry', '3 Wool + 1 Gold nugget', T.TAPESTRY, 2, [[T.WOOL, 3], [IT.GOLDNUGGET, 1]]), rc('Bookshelf', '6 Planks + 3 Wool', T.BOOKSHELF, 1, [[T.PLANKS, 6], [T.WOOL, 3]], 1));
if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(221, 222, 223);
const NEW_CASTLES_AT = 1792560600000;   // worlds created after v0.9.28 (06:30 BST 21 Oct 2026); older worlds keep their castles so Reset Terrain and build scans stay exact
// stair facing: 0 climbs toward -z, 1 toward -x, 2 toward +z, 3 toward +x
const stairF = (dx, dz) => dz < 0 ? 0 : dx < 0 ? 1 : dz > 0 ? 2 : 3;
function buildKeep(kind, cx, cz) {
  const S = kind === 'citadel' ? 20 : kind === 'lochisle' ? 17 : kind === 'turrets' ? 15 : 13;
  const fr = castleFriendly([kind, cx, cz]); let sd = (cx * 7919 + cz * 104729) >>> 0; const rnd = () => (sd = (Math.imul(sd, 16807) >>> 0) % 2147483647) / 2147483647;
  const ok = (x, z) => x > 0 && z > 0 && x < W - 1 && z < D - 1;
  const put = (x, y, z, b) => { if (ok(x, z) && y > 0 && y < H - 1) world[idx(x, y, z)] = b; };
  const get = (x, y, z) => ok(x, z) && y >= 0 && y < H ? world[idx(x, y, z)] : 0;
  const meta = (x, y, z, m) => entMeta.set(keyOf(x, y, z), m);
  const stone = () => !fr && rnd() < 0.25 ? T.MOSSYBRICK : rnd() < 0.08 ? T.MOSSYBRICK : T.STONEBRICK;
  const stair = (x, y, z, f, b) => { put(x, y, z, b || 167); meta(x, y, z, {face: f}); };
  const torch = (x, y, z, dx, dz) => { if (!fr && rnd() < 0.6) return; put(x, y, z, T.TORCH); meta(x, y, z, {face: 0, wall: [dx, dz]}); };
  const door = (x, y, z, f) => { put(x, y, z, T.DOOR); put(x, y + 1, z, T.DOORTOP); meta(x, y, z, {face: f}); };
  const lamp = (x, y, z) => { if (!fr && rnd() < 0.5) return; put(x, y, z, 161); };
  // site: level to the median ground, foundations down to the land
  const hs = []; for (let a = -S; a <= S; a += 3) for (let b = -S; b <= S; b += 3) hs.push(g9top(cx + a, cz + b)); hs.sort((a, b) => a - b);
  const gy = hs[hs.length >> 1] + 1;
  for (let x = cx - S - 2; x <= cx + S + 2; x++) for (let z = cz - S - 2; z <= cz + S + 2; z++) {
    for (let y = gy; y < Math.min(H - 1, gy + 40); y++) put(x, y, z, T.AIR);
    const edge = Math.max(Math.abs(x - cx), Math.abs(z - cz)) > S;
    put(x, gy - 1, z, edge ? T.GRASS : T.GRASS);
    for (let y = gy - 2, n = 0; y > 1 && n < 26; y--, n++) { const b = get(x, y, z); if (b && b !== T.WATER && b !== T.LEAVES && b !== T.LOG && PLANT[b] !== 1) break; put(x, y, z, n < 1 ? T.DIRT : T.STONEBRICK); }
  }
  // courtyard: cobble paths from the gate and side doors to the keep, a well
  for (let z = cz - 2; z <= cz + S; z++) for (let x = cx - 1; x <= cx + 1; x++) put(x, gy - 1, z, T.COBBLE);
  for (let x = cx - S; x <= cx + S; x++) put(x, gy - 1, cz + 2, T.COBBLE);
  { const wx = cx + S - 6, wz = cz + S - 6; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { put(wx + a, gy - 1, wz + b, T.STONEBRICK); put(wx + a, gy, wz + b, a || b ? T.STONEBRICK : T.WATER); } put(wx, gy - 1, wz, T.WATER); put(wx, gy - 2, wz, T.WATER);
    for (const [a, b] of [[-1, -1], [1, 1]]) { put(wx + a, gy + 1, wz + b, 162); put(wx + a, gy + 2, wz + b, 162); } for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) put(wx + a, gy + 3, wz + b, T.PLANKS); }
  // curtain wall (2 thick, 7 high) with a wall-walk and merlons
  const WH = 7;
  for (let x = cx - S; x <= cx + S; x++) for (let z = cz - S; z <= cz + S; z++) {
    const d = Math.max(Math.abs(x - cx), Math.abs(z - cz)); if (d < S - 1) continue;
    for (let y = gy; y < gy + WH; y++) put(x, y, z, stone());
    if (d === S && ((x + z) & 1) === 0) put(x, gy + WH, z, stone());
    if (!fr && rnd() < 0.06) put(x, gy + WH - 1, z, T.AIR);
  }
  // stairs up to the wall-walk, inside the south wall on both sides of the gate
  for (const sx of [-1, 1]) for (let k = 0; k < WH; k++) { const x = cx + sx * (4 + k), z = cz + S - 2; stair(x, gy + k, z, stairF(sx, 0)); for (let y = gy; y < gy + k; y++) put(x, y, z, T.STONEBRICK); }
  // gatehouse: 3-wide, 4-high arch through the wall, flanking towers, raised portcullis, banners, lamps
  for (let x = cx - 1; x <= cx + 1; x++) for (let z = cz + S - 1; z <= cz + S; z++) for (let y = gy; y < gy + 4; y++) put(x, y, z, T.AIR);
  for (let x = cx - 1; x <= cx + 1; x++) put(x, gy + 3, cz + S, 162);
  for (const sx of [-1, 1]) { for (let a = -2; a <= 2; a++) for (let b = -2; b <= 1; b++) for (let y = gy; y < gy + WH + 5; y++) { const e = Math.abs(a) === 2 || b === -2 || b === 1; const x = cx + sx * 4 + a, z = cz + S + b; if (e) put(x, y, z, stone()); else if (y > gy) put(x, y, z, T.AIR); }
    for (let a = -2; a <= 2; a++) if (((a + 2) & 1) === 0) put(cx + sx * 4 + a, gy + WH + 5, cz + S + 1, stone());
    put(cx + sx * 4, gy + WH + 1, cz + S + 1, T.TAPESTRY); put(cx + sx * 4, gy + WH, cz + S + 1, T.TAPESTRY); torch(cx + sx * 2, gy + 2, cz + S + 1, 0, -1); }
  // side doors in the east and west walls
  for (const sx of [-1, 1]) { const x0 = cx + sx * S, x1 = cx + sx * (S - 1); for (let y = gy; y < gy + 2; y++) { put(x0, y, cz + 2, T.AIR); put(x1, y, cz + 2, T.AIR); } door(x1, gy, cz + 2, sx > 0 ? 3 : 1); torch(x1 - sx, gy + 2, cz + 3, 0, -1); }
  // corner towers: 7 x 7, spiral stair round a central post from the courtyard to the roof
  const ring = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const tx = cx + sx * S, tz = cz + sz * S, top = gy + WH + 6;
    for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) for (let y = gy; y <= top; y++) { const e = Math.abs(a) === 3 || Math.abs(b) === 3; if (Math.abs(a) === 3 && Math.abs(b) === 3) continue; put(tx + a, y, tz + b, e ? (y > gy + 1 && (y - gy) % 4 === 2 && (a === 0 || b === 0) ? T.GLASS : stone()) : T.AIR); }
    for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) { if (Math.abs(a) === 3 && Math.abs(b) === 3) continue; const e = Math.abs(a) === 3 || Math.abs(b) === 3; put(tx + a, top, tz + b, e ? stone() : T.STONEBRICK); if (e && ((a + b) & 1) === 0) put(tx + a, top + 1, tz + b, stone()); }
    for (let y = gy; y < top; y++) put(tx, y, tz, T.STONEBRICK);
    const ro = (ring.findIndex(q => q[0] === -sx && q[1] === 0) - (WH - 1) + 16) % 8;
    for (let k = 0; k < top - gy; k++) { const [a, b] = ring[(k + ro) % 8], [na, nb] = ring[(k + 1 + ro) % 8], x = tx + a, z = tz + b, y = gy + k; stair(x, y, z, stairF(na - a, nb - b)); if (k > 0) put(x, y - 1, z, T.STONEBRICK);
      for (let h = 1; h <= 2; h++) if (y + h < top) { const c = get(x, y + h, z); if (c === T.STONEBRICK || c === 167) {} } }
    for (const k of [top - gy - 1, top - gy - 2, top - gy - 3]) put(tx + ring[(k + ro) % 8][0], top, tz + ring[(k + ro) % 8][1], T.AIR);
    // ground door into the courtyard; wall-walk door + landing where the spiral reaches wall-walk height
    for (let y = gy; y < gy + 2; y++) put(tx - 3 * sx, y, tz - 2 * sz, T.AIR);
    for (let y = gy + WH; y < gy + WH + 2; y++) put(tx - 3 * sx, y, tz, T.AIR); put(tx - 2 * sx, gy + WH - 1, tz, T.STONEBRICK); put(tx - 2 * sx, gy + WH, tz, T.AIR); put(tx - 2 * sx, gy + WH + 1, tz, T.AIR);
    torch(tx, gy + 3, tz + (sz > 0 ? -1 : 1), 0, sz > 0 ? 1 : -1);
  }
  // the keep: 3 floors + roof
  const KX = S - 6, kz0 = cz - S + 3, kz1 = cz - 2, x0 = cx - KX, x1 = cx + KX, FH = 5, L = [gy, gy + FH, gy + FH * 2], roof = gy + FH * 3;
  for (let x = x0; x <= x1; x++) for (let z = kz0; z <= kz1; z++) for (let y = gy - 1; y <= roof; y++) {
    const e = x === x0 || x === x1 || z === kz0 || z === kz1;
    if (y === gy - 1) put(x, y, z, T.STONEBRICK);
    else if (e) { const lv = (y - gy) % FH, win = (lv === 2 || lv === 3) && !(x === x0 && (z === kz0 || z === kz1)) && !(x === x1 && (z === kz0 || z === kz1)) && ((x === x0 || x === x1) ? (z - kz0) % 3 === 1 : (x - x0) % 3 === 1); put(x, y, z, win ? T.GLASS : stone()); }
    else if ((y - gy) % FH === 0 && y > gy) put(x, y, z, y === roof ? T.STONEBRICK : T.PLANKS);
    else put(x, y, z, T.AIR);
  }
  for (let x = x0; x <= x1; x++) for (let z = kz0; z <= kz1; z++) { const e = x === x0 || x === x1 || z === kz0 || z === kz1; if (e && ((x + z) & 1) === 0) put(x, roof + 1, z, stone()); }
  // front door (double, 3 high) + steps
  for (let x = cx - 1; x <= cx; x++) for (let y = gy; y < gy + 3; y++) put(x, y, kz1, T.AIR);
  door(cx - 1, gy, kz1, 2); door(cx, gy, kz1, 2); put(cx - 1, gy + 2, kz1, T.STONEBRICK); put(cx, gy + 2, kz1, T.STONEBRICK);
  torch(cx - 2, gy + 2, kz1 + 1, 0, -1); torch(cx + 1, gy + 2, kz1 + 1, 0, -1);
  // ---- ground floor: great hall (east) + kitchen (west) ----
  const kitX = x0 + 5;
  for (let z = kz0 + 1; z < kz1; z++) for (let y = gy; y < gy + FH; y++) put(kitX, y, z, stone());
  for (let y = gy; y < gy + 3; y++) for (let z = kz1 - 4; z <= kz1 - 2; z++) put(kitX, y, z, T.AIR);   // wide arch into the kitchen
  for (let z = kz0 + 1; z < kz1; z++) put(cx, gy - 1, z, T.RCARPET);   // red carpet runner from the door to the high table
  for (let x = kitX + 1; x < x1; x++) put(x, gy - 1, kz0 + 2, T.RCARPET);
  for (const tx of [cx - 3, cx + 3]) if (tx > kitX + 1 && tx < x1 - 1) for (let z = kz0 + 5; z < kz1 - 2; z++) { put(tx, gy, z, T.PLANKS); if (z % 2 === 0) { stair(tx - 1, gy, z, stairF(1, 0), 164); stair(tx + 1, gy, z, stairF(-1, 0), 164); } }
  for (let x = cx - 3; x <= cx + 3; x++) put(x, gy, kz0 + 3, T.PLANKS);   // high table
  stair(cx, gy, kz0 + 2, stairF(0, 1), 164); stair(cx - 2, gy, kz0 + 2, stairF(0, 1), 164); stair(cx + 2, gy, kz0 + 2, stairF(0, 1), 164);
  for (let x = kitX + 2; x < x1 - 1; x += 3) { put(x, gy + 2, kz0, T.TAPESTRY); put(x, gy + 3, kz0, T.TAPESTRY); }
  for (const z of [kz0 + 6, kz1 - 4]) { put(cx, gy + FH - 1, z, 162); lamp(cx, gy + FH - 2, z); put(cx - 1, gy + FH - 2, z, 162); put(cx + 1, gy + FH - 2, z, 162); }   // chandeliers
  for (let z = kz0 + 2; z < kz1; z += 4) { torch(x1 - 1, gy + 2, z, 1, 0); torch(kitX + 1, gy + 2, z, -1, 0); }
  // kitchen: furnaces, cauldron, worktable, larder chest
  put(x0 + 1, gy, kz0 + 1, T.FURNACE); put(x0 + 2, gy, kz0 + 1, T.FURNACE); put(x0 + 3, gy, kz0 + 1, T.CAULDRON); put(x0 + 1, gy, kz0 + 3, T.TABLE);
  lootChest(x0 + 1, gy, kz1 - 1, [[IT.BREAD, 4, 0.9], [IT.MUTTON, 3, 0.7], [IT.POTATO, 5, 0.7], [IT.COAL, 6, 0.7], [IT.BREW, 2, 0.5]], rnd);
  torch(x0 + 1, gy + 2, kz0 + 4, -1, 0);
  // ---- stairs: up the east wall (ground -> 1st), up the west wall (1st -> 2nd), straight runs facing the way you climb ----
  const run = (x, ly, zStart, dz) => { for (let k = 0; k < FH; k++) { const z = zStart + dz * k; stair(x, ly + k, z, stairF(0, dz)); for (let y = ly; y < ly + k; y++) put(x, y, z, T.STONEBRICK); put(x, ly + FH, z, T.AIR); }
    for (let k = 0; k < FH; k++) put(x - (x > cx ? 1 : -1), ly + FH + 1, zStart + dz * k, 162); };
  run(x1 - 1, L[0], kz1 - 2, -1);
  run(x0 + 1, L[1], kz0 + 2, 1);
  // v1.0.23: no stair (or roof hole) up to the keep roof any more
  // ---- 1st floor: corridor + bedrooms (south) and the library (north) ----
  const zc = Math.round((kz0 + kz1) / 2);
  for (let x = x0 + 3; x < x1 - 2; x++) put(x, L[1], zc, T.RCARPET);
  const rooms = Math.max(2, Math.floor((x1 - x0 - 6) / 5));
  for (let r = 0; r < rooms; r++) { const rx = x0 + 3 + r * 5;
    put(rx + 1, L[1] + 1, kz1 - 1, T.WOOL); put(rx + 1, L[1] + 1, kz1 - 2, T.RCARPET); put(rx + 2, L[1] + 1, kz1 - 1, T.WOOL); put(rx + 2, L[1] + 1, kz1 - 2, T.RCARPET);   // a bed: pillows + red blanket
    if (false) lootChest(rx + 3, L[1] + 1, kz1 - 1, [[T.WOOL, 3, 0.7], [IT.BREAD, 2, 0.6], [IT.GOLDNUGGET, 3, 0.5], [IT.KILT, 1, 0.2], [IT.BROOCH, 1, 0.08]], rnd);
    torch(rx + 1, L[1] + 3, kz1 - 1, 0, 1); }
  for (let x = x0 + 3; x < x1 - 2; x++) if ((x - x0) % 4 !== 1) for (let y = L[1] + 1; y < L[1] + 4; y++) put(x, y, kz0 + 1, T.BOOKSHELF);
  put(cx, L[1] + 1, kz0 + 3, T.PLANKS); put(cx + 1, L[1] + 1, kz0 + 3, T.PLANKS); stair(cx, L[1] + 1, kz0 + 4, stairF(0, 1), 164); lamp(cx - 1, L[1] + FH - 1, kz0 + 3);
  torch(x0 + 3, L[1] + 3, zc - 3, 0, 1); torch(x1 - 3, L[1] + 3, zc - 3, 0, 1); torch(x0 + 2, L[1] + 3, zc, -1, 0);
  // ---- 2nd floor: armoury (west half) + the laird's chamber (east half) ----
  for (const z of [kz0 + 1, kz1 - 1]) for (let y = L[2] + 1; y < L[2] + FH; y++) put(cx, y, z, stone());   // open plan: just two pilasters
  for (let x = x0 + 2; x < cx - 1; x += 2) put(x, L[2] + 3, kz1, T.TAPESTRY);   // armoury banners on the wall, clear of the stair
  const ARM = fr ? [[IT.ISWORD, 1, 0.6], [IT.IHELM, 1, 0.4], [IT.ICHEST, 1, 0.3], [IT.TARGE, 1, 0.4], [IT.CLAYMORE, 1, 0.25], [IT.CARTRIDGE, 6, 0.4], [IT.PISTOL, 1, 0.12]]
    : [[T.OBSIDIAN, 4, 0.55], [IT.DIAMOND, 2, 0.4], [IT.IPICK, 1, 0.3], [IT.ISWORD, 1, 0.3], [IT.ICHEST, 1, 0.25], [IT.GOLDINGOT, 3, 0.4], [IT.PAINTING, 1, 0.1], [IT.MUSKET, 1, 0.1], [IT.CARTRIDGE, 6, 0.4]];
  lootChest(x0 + 4, L[2] + 1, kz1 - 1, ARM, rnd);
  for (let x = cx + 2; x < x1 - 1; x++) for (let z = kz0 + 2; z < kz1 - 1; z++) put(x, L[2], z, T.RCARPET);
  put(x1 - 2, L[2] + 1, kz0 + 2, T.WOOL); put(x1 - 3, L[2] + 1, kz0 + 2, T.WOOL); put(x1 - 2, L[2] + 1, kz0 + 3, 221); put(x1 - 3, L[2] + 1, kz0 + 3, 221); put(x1 - 2, L[2] + 1, kz0 + 4, 221); put(x1 - 3, L[2] + 1, kz0 + 4, 221);
  for (let x = cx + 2; x < x1; x += 3) put(x, L[2] + 3, kz1, T.TAPESTRY);
  lootChest(x1 - 1, L[2] + 1, kz1 - 1, fr ? [[IT.GOLDINGOT, 3, 0.7], [IT.QUAICH, 1, 0.3], [IT.SILVERINGOT, 2, 0.5], [IT.CAIRNGORM, 2, 0.4]] : [[IT.DIAMOND, 2, 0.5], [IT.GOLDINGOT, 4, 0.6], [IT.QUAICH, 1, 0.3]], rnd);
  put(cx + 4, L[2] + FH - 1, zc, 162); lamp(cx + 4, L[2] + FH - 2, zc); torch(cx - 2, L[2] + 3, zc, 1, 0); torch(cx + 1, L[2] + 3, kz0 + 2, -1, 0);
  // courtyard lamps on posts along the path
  for (let z = cz + 1; z < cz + S - 2; z += 4) for (const sx of [-1, 1]) { put(cx + sx * 3, gy, z, 162); put(cx + sx * 3, gy + 1, z, 162); lamp(cx + sx * 3, gy + 2, z); }
  // abandoned: cobwebs in the corners, some broken windows and fallen stones
  castleStats.push({kind, filled: 0, rooms: rooms + 6, keep: true, friendly: fr});
  return gy;
}
(function () {
  const bc = buildCastle;
  buildCastle = function (kind, cx, cz) {
    if (kind !== 'peak' && current && (current.created > NEW_CASTLES_AT || current.newCastles) && !DIM.cur) { try { return buildKeep(kind, cx, cz); } catch (e) { console.warn('keep', e); } }
    return bc.apply(this, arguments);
  };
})();
