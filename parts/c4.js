/* ===================== GLX-C4: creative = Dalmuir, Duntocher & Mountblow at 1 block = 1 m, streamed through a sliding window ===================== */
// Map data (c) OpenStreetMap contributors, ODbL. Elevation: AWS Terrain Tiles. Baked by world/bake1m.py into world/dalmuir1m.bin.gz.
Object.assign(T, {KERB: 158, MARKW: 159, LPOST: 160, LAMP: 161, FENCE: 162, RAILING: 163});
(function c1Blocks() {
  const def = [[158, 'kerb', 'Kerbstone', 1.5], [159, 'road_white', 'Road marking', 1.5], [160, 'lamp_post', 'Lamp post', 3], [161, 'lamp', 'Street lamp', 0.3],
    [162, 'fence', 'Fence', 2], [163, 'railing', 'Railings', 3]];
  for (const [id, key, name, hd] of def) {
    FACES[id] = key; NAMES[id] = name; ICON_KEY[id] = key; HARD[id] = hd * 1.1; MC_HARD[id] = hd; REQ[id] = 1; PLACEABLE.add(id); ORDER.push(id);
    if (id !== 162) NEEDS_PICK.add(id);
    let m = mat(key);
    if (id === 161) m = new THREE.MeshBasicMaterial({map: m.map, color: 0xfff2c0});
    if (id === 162 || id === 163) { m.alphaTest = 0.5; m.transparent = false; m.side = THREE.DoubleSide; }
    BLOCK_MATS[id] = m;
    if (typeof CREATIVE_ALL !== 'undefined' && Array.isArray(CREATIVE_ALL) && !CREATIVE_ALL.includes(id)) CREATIVE_ALL.push(id);
  }
})();
setInterval(() => { if (chunkST && chunkST[162] !== 3) { chunkST[162] = 3; chunkST[163] = 3; chunkST[161] = 0; } }, 200);
var GEN11 = 11, C1 = null, C1_LOADING = null, C1W = 390, C1H = 176, c1O = [0, 0], c1Edits = new Map(), c1Gen = false, c1Park = new Map(), c1Pending = null, c1Want = false, c1Place = '';
function c1Load() {
  if (C1) return Promise.resolve(C1);
  if (C1_LOADING) return C1_LOADING;
  C1_LOADING = (async () => {
    const r = await fetch('world/dalmuir1m.bin.gz'); if (!r.ok) throw new Error('map ' + r.status);
    let buf = new Uint8Array(await r.arrayBuffer());
    if (buf[0] === 0x1f && buf[1] === 0x8b) buf = new Uint8Array(await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    const hl = buf[0] | (buf[1] << 8) | (buf[2] << 16) | (buf[3] << 24);
    const hdr = JSON.parse(new TextDecoder().decode(buf.subarray(4, 4 + hl))), NN = hdr.NX * hdr.NZ, o = 4 + hl;
    const L = {}; hdr.layers.forEach((k, i) => L[k] = buf.subarray(o + i * NN, o + (i + 1) * NN));
    // spatial buckets (64 m) for the point features
    const B = new Map(), add = (kind, arr, st) => { for (let i = 0; i < arr.length; i += st) { const k = (arr[i] >> 6) * 64 + (arr[i + 1] >> 6); let b = B.get(k); if (!b) B.set(k, b = []); b.push([kind, ...arr.slice(i, i + st)]); } };
    add('t', hdr.trees, 2); add('l', hdr.lamps, 2); add('s', hdr.stops, 3);
    C1 = Object.assign(hdr, {L, B});
    return C1;
  })();
  C1_LOADING.catch(e => { console.warn('1 m map failed to load', e); C1_LOADING = null; });
  return C1_LOADING;
}
var c1Key = (ax, y, az) => genVer === 12 ? (ax * 8192 + az) * 256 + y : ((ax * 4096 + az) * 256 + y) >>> 0;
(function () {
  const sb = setB;
  setB = function (x, y, z, v) { sb.apply(this, arguments); if ((genVer === GEN11 || genVer === 12) && !c1Gen && x >= 0 && z >= 0 && x < W && z < D && y >= 0 && y < H) { const ax = x + c1O[0], az = z + c1O[1]; if (ax >= 0 && az >= 0 && (genVer === 12 || ax < 4096)) c1Edits.set(c1Key(ax, y, az), v); } };
})();
// ---- generate the window region [x0,x1) x [z0,z1) (local coords) from the bake ----
function c1Fill(x0, x1, z0, z1) {
  const C = C1, NX = C.NX, NZ = C.NZ, L = C.L, Lh = L.h, Lwl = L.wl, Ls = L.s, Lm = L.m, Lbt = L.bt, Lbh = L.bh, Lrf = L.rf, Lwm = L.wm, Lrm = L.rm, Lbf = L.bf, Lbar = L.bar;
  const HD = H * D, OX = c1O[0], OZ = c1O[1];
  c1Gen = true;
  for (let x = x0; x < x1; x++) for (let y = 0; y < H; y++) world.fill(0, (x * H + y) * D + z0, (x * H + y) * D + z1);
  const hAt = (ax, az) => Lh[Math.min(NZ - 1, Math.max(0, az)) * NX + Math.min(NX - 1, Math.max(0, ax))];
  for (let x = x0; x < x1; x++) for (let z = z0; z < z1; z++) {
    const ax = x + OX, az = z + OZ, inb = ax >= 0 && az >= 0 && ax < NX && az < NZ;
    const i = Math.min(NZ - 1, Math.max(0, az)) * NX + Math.min(NX - 1, Math.max(0, ax));
    let h = Math.min(H - 40, Lh[i]); const s0 = inb ? Ls[i] : 0, br = s0 & 128, s = s0 & 127, base = x * HD + z;
    const put = (y, b) => { if (y > 0 && y < H) world[base + y * D] = b; };
    world[base] = T.DEEPSLATE;
    if (br) { // bridge deck over water
      const wl = Lwl[i]; for (let y = 1; y < wl - 3; y++) world[base + y * D] = T.STONE;
      for (let y = wl - 3; y <= wl; y++) put(y, T.WATER); put(h - 1, s === 27 ? T.KERB : s === 20 || s === 4 ? T.PAVE : T.ASPHALT); put(h - 2, T.STONEBRICK);
      if (s === 27) put(h, T.RAILING);
      continue;
    }
    for (let y = 1; y < h - 4; y++) world[base + y * D] = T.STONE;
    for (let y = Math.max(1, h - 4); y < h - 1; y++) world[base + y * D] = T.DIRT;
    if (s === 6) { const wl = Lwl[i]; put(h - 1, T.MUD); put(h - 2, T.SAND); for (let y = h; y <= wl; y++) put(y, T.WATER); continue; }
    const hs = cityHash(ax, 7, az);
    let top = T.GRASS;
    switch (s) {
      case 3: top = Lm[i] === 1 || Lm[i] === 2 ? T.MARKW : T.ASPHALT; break;
      case 27: top = T.KERB; break; case 20: case 4: top = T.PAVE; break; case 26: top = T.MUD; break;
      case 11: top = (ax % 6 === 0 && hs < 0.9) ? T.MARKW : T.ASPHALT; break; case 22: top = T.ASPHALT; break; case 16: top = T.CONCRETE; break;
      case 12: top = T.COBBLE; break; case 9: top = T.SAND; break; case 24: top = (az & 3) === 0 ? T.DIRT : T.FARM; break;
    }
    put(h - 1, top);
    if (s === 12 && (ax + az) % 2 === 0 && hs < 0.5) put(h, T.IRONBLOCK);
    if (!inb) continue;
    const bh = Lbh[i];
    if (bh) {
      const g = h, bf = Lbf[i], bt = Lbt[i], wm = Lwm[i] || T.STONEBRICK, rm = Lrm[i] || T.SLATE, edge = bf & 1, win = bf & 2, door = bf & 4, hollow = bf & 64, wt = Math.min(H - 20, g + bh);
      if (hollow) put(g - 1, T.PLANKS);
      for (let y = g; y < wt; y++) {
        const k = (y - g) % 3; let b = wm;
        if (edge) {
          if (win && k > 0) b = T.GLASS;
          if (bt === 4 && win && y < g + 3) b = T.GLASS;
          if (door && y === g) b = T.DOOR; else if (door && y === g + 1) b = T.DOORTOP;
        } else if (hollow && y < g + 3) b = 0;
        world[base + y * D] = b;
      }
      if (door) { const dir = (bf >> 4) & 3, face = dir === 2 ? 0 : dir === 3 ? 2 : dir === 0 ? 1 : 3; entMeta.set(keyOf(x, g, z), {face, gen: 1}); }
      const rf = Lrf[i];
      if (rf) { const yr = Math.min(H - 4, wt + rf - 1); for (let y = wt; y < yr; y++) world[base + y * D] = edge ? wm : rm; world[base + yr * D] = rm;
        if (bf & 8) { put(yr + 1, T.BRICK); put(yr + 2, T.BRICK); } }
      else if (edge && (bt === 3 || bt === 4 || bt === 5 || bt === 7)) put(wt, wm);
      else if (!edge) put(wt - 1, rm);
      continue;
    }
    const bar = Lbar[i];
    if (bar === 1) { put(h, T.STONEBRICK); continue; }
    if (bar === 2) { put(h, T.FENCE); continue; }
    if (bar === 3) { put(h, T.LEAVES); put(h + 1, T.LEAVES); continue; }
    if (bar === 4) { put(h, T.COBBLE); continue; }
    if (bar === 5) { put(h, T.RAILING); continue; }
    if (s === 18) { put(h, T.GRASS); put(h - 1, T.DIRT); h++; }
    if (top === T.GRASS) {
      if (s === 10 && ax % 3 === 0 && az % 2 === 0 && hs < 0.6) put(h, hs < 0.2 ? T.COBBLE : T.STONEBRICK);
      else if (hs < (s === 8 || s === 23 || s === 13 ? 0 : s === 25 || s === 15 ? 0.25 : 0.05)) put(h, T.TALLGRASS);
      else if (hs > 0.985 && s !== 8 && s !== 23 && s !== 13) put(h, hs > 0.995 ? T.BLUEBELL : hs > 0.99 ? T.DAFFODIL : T.DANDELION);
    } else if (top === T.FARM && hs < 0.7) put(h, T.WHEAT3);
  }
  // ---- point features: trees, lamps, bus stops (roots up to 4 m outside the region still reach in) ----
  const putO = (x, y, z, b, force) => { if (x < x0 || x >= x1 || z < z0 || z >= z1 || y <= 0 || y >= H) return; const j = (x * H + y) * D + z; if (force || world[j] === 0 || PLANT[world[j]] === 1) world[j] = b; };
  const tree = (lx, lz, ax, az, kind) => {
    const g = hAt(ax, az), r = cityHash(ax, 3, az), th = 4 + Math.floor(r * 3);
    if (kind === 'pine') { for (let y = 0; y < th + 3; y++) putO(lx, g + y, lz, T.LOG); for (let y = 2; y < th + 5; y++) { const rr = Math.max(0, Math.round((th + 5 - y) * 0.45)); for (let a = -rr; a <= rr; a++) for (let b = -rr; b <= rr; b++) if (Math.abs(a) + Math.abs(b) <= rr) putO(lx + a, g + y, lz + b, T.LEAVES); } return; }
    for (let y = 0; y < th; y++) putO(lx, g + y, lz, T.LOG);
    const R = 2 + (r > 0.5 ? 1 : 0), cy = g + th;
    for (let a = -R; a <= R; a++) for (let b = -2; b <= 2; b++) for (let c = -R; c <= R; c++) if (a * a + b * b * 1.6 + c * c <= R * R + 0.6 && cityHash(ax + a, b, az + c) > 0.12) putO(lx + a, cy + b, lz + c, T.LEAVES);
  };
  const ax0 = x0 + OX - 4, ax1 = x1 + OX + 4, az0 = z0 + OZ - 4, az1 = z1 + OZ + 4;
  // procedural trees on a 5 m jittered grid in woods, parks, gardens, cemeteries
  for (let gx = Math.floor(ax0 / 5); gx <= Math.floor(ax1 / 5); gx++) for (let gz = Math.floor(az0 / 5); gz <= Math.floor(az1 / 5); gz++) {
    const ax = gx * 5 + Math.floor(cityHash(gx, 11, gz) * 5), az = gz * 5 + Math.floor(cityHash(gx, 12, gz) * 5);
    if (ax < 0 || az < 0 || ax >= NX || az >= NZ || ax < ax0 || ax >= ax1 || az < az0 || az >= az1) continue;
    const i = az * NX + ax, s = Ls[i] & 127; if (Lbh[i] || Lbar[i]) continue;
    const p = s === 7 ? 0.8 : s === 25 ? 0.3 : s === 1 ? 0.07 : s === 10 ? 0.08 : s === 21 ? 0.035 : s === 0 ? 0.04 : 0;
    const q = cityHash(gx, 13, gz); if (q >= p) continue;
    tree(ax - OX, az - OZ, ax, az, s === 7 && q < 0.25 ? 'pine' : 'oak');
  }
  const seen = new Set();
  for (let bx = ax0 >> 6; bx <= ax1 >> 6; bx++) for (let bz = az0 >> 6; bz <= az1 >> 6; bz++) {
    const list = C.B.get(bx * 64 + bz); if (!list) continue;
    for (const f of list) {
      const ax = f[1], az = f[2]; if (ax < ax0 || ax >= ax1 || az < az0 || az >= az1) continue;
      const lx = ax - OX, lz = az - OZ, g = hAt(ax, az);
      if (f[0] === 't') tree(lx, lz, ax, az, 'oak');
      else if (f[0] === 'l') { for (let y = 0; y < 5; y++) putO(lx, g + y, lz, T.LPOST); putO(lx, g + 5, lz, T.LAMP); }
      else if (f[0] === 's') {
        const a = f[3] * Math.PI / 180, dx = Math.cos(a), dz = Math.sin(a); let nx = -dz, nz = dx;
        const sAt = (ox, oz) => Ls[Math.min(NZ - 1, Math.max(0, Math.round(az + oz))) * NX + Math.min(NX - 1, Math.max(0, Math.round(ax + ox)))] & 127;
        if (sAt(nx * 3, nz * 3) === 3) { nx = -nx; nz = -nz; }
        // pole with the yellow stop flag, then a 3 m shelter behind the pavement edge
        for (let y = 0; y < 3; y++) putO(lx, g + y, lz, T.LPOST); putO(lx, g + 3, lz, T.WOOLYELLOW);
        for (let t = -1; t <= 1; t++) {
          const px = Math.round(ax + dx * (t + 3) + nx * 2), pz = Math.round(az + dz * (t + 3) + nz * 2), gg = hAt(px, pz);
          const bx2 = Math.round(ax + dx * (t + 3) + nx * 3), bz2 = Math.round(az + dz * (t + 3) + nz * 3);
          putO(bx2 - OX, gg, bz2 - OZ, T.GLASS); putO(bx2 - OX, gg + 1, bz2 - OZ, T.GLASS);
          putO(px - OX, gg + 2, pz - OZ, T.IRONBLOCK); putO(bx2 - OX, gg + 2, bz2 - OZ, T.IRONBLOCK);
          if (t !== 0) { const sx2 = Math.round(ax + dx * (t * 2 + 3) + nx * 2), sz2 = Math.round(az + dz * (t * 2 + 3) + nz * 2); putO(sx2 - OX, gg, sz2 - OZ, T.GLASS); putO(sx2 - OX, gg + 1, sz2 - OZ, T.GLASS); }
        }
      }
    }
  }
  // ---- the player's own changes in this region ----
  for (const [k, v] of c1Edits) {
    const y = k & 255, r = Math.floor(k / 256), ax = Math.floor(r / 4096), az = r % 4096, x = ax - OX, z = az - OZ;
    if (x >= x0 && x < x1 && z >= z0 && z < z1 && y < H) world[(x * H + y) * D + z] = v;
  }
  c1Unpark(x0, x1, z0, z1);
  c1Gen = false;
}
// ---- metadata that scrolls out of the window is parked by absolute position ----
function c1Maps() { return {crops, chests, doorState, furnaces, entMeta}; }
function c1Unpark(x0, x1, z0, z1) {
  const M = c1Maps();
  for (const [pk, v] of c1Park) {
    const [n, ax, y, az] = pk.split(','), x = +ax - c1O[0], z = +az - c1O[1];
    if (x >= x0 && x < x1 && z >= z0 && z < z1) { M[n].set(keyOf(x, +y, z), v); c1Park.delete(pk); }
  }
}
function c1Shift(sx, sz) {
  if (!sx && !sz) return;
  const HD = H * D, ncx = Math.ceil(W / CH), ncz = Math.ceil(D / CH), scx = sx / CH, scz = sz / CH, t0 = performance.now();
  if (sx > 0) world.copyWithin(0, sx * HD); else if (sx < 0) world.copyWithin(-sx * HD, 0, (W + sx) * HD);
  if (sz) for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { const b = (x * H + y) * D; if (sz > 0) world.copyWithin(b, b + sz, b + D); else world.copyWithin(b - sz, b, b + D + sz); }
  c1O[0] += sx; c1O[1] += sz;
  // metadata
  const M = c1Maps();
  for (const n in M) {
    const m = M[n], e = [...m]; m.clear();
    for (const [k, v] of e) { const [x, y, z] = k.split(',').map(Number), nx = x - sx, nz = z - sz;
      if (nx >= 0 && nz >= 0 && nx < W && nz < D) m.set(keyOf(nx, y, nz), v); else if (!(v && v.gen)) c1Park.set(n + ',' + (x + c1O[0] - sx) + ',' + y + ',' + (z + c1O[1] - sz), v); }
  }
  // chunk meshes: move the kept ones, drop the rest
  const objs = [...chunkObjs], lists = [...chunkLists], dirty = [...dirtyCh];
  chunkObjs.clear(); chunkLists.clear(); dirtyCh.clear();
  const inR = (cx, cz) => cx >= 0 && cz >= 0 && cx < ncx && cz < ncz;
  for (const [id, g] of objs) { const cx = Math.floor(id / 64) - scx, cz = id % 64 - scz;
    if (inR(cx, cz)) { g.position.x -= sx; g.position.z -= sz; chunkObjs.set(cx * 64 + cz, g); }
    else { blockGroup.remove(g); g.children.forEach(c => { if (c.isInstancedMesh) c.dispose(); else if (c.geometry) c.geometry.dispose(); }); } }
  for (const [id, Ls] of lists) { const cx = Math.floor(id / 64) - scx, cz = id % 64 - scz; if (!inR(cx, cz)) continue;
    for (const t in Ls) { const a = Ls[t]; for (let k = 0; k < a.length; k += 3) { a[k] -= sx; a[k + 2] -= sz; } } chunkLists.set(cx * 64 + cz, Ls); }
  for (const id of dirty) { const cx = Math.floor(id / 64) - scx, cz = id % 64 - scz; if (inR(cx, cz)) dirtyCh.add(cx * 64 + cz); }
  // the new strips (+ the chunks bordering them, whose edge faces change)
  const rx0 = sx > 0 ? W - sx : 0, rx1 = sx > 0 ? W : -sx, rz0 = sz > 0 ? D - sz : 0, rz1 = sz > 0 ? D : -sz;
  if (sx) c1Fill(rx0, rx1, 0, D);
  if (sz) c1Fill(sx > 0 ? 0 : rx1, sx > 0 ? rx0 : W, rz0, rz1);
  for (let cx = 0; cx < ncx; cx++) for (let cz = 0; cz < ncz; cz++) {
    const X0 = cx * CH - 1, X1 = cx * CH + CH + 1, Z0 = cz * CH - 1, Z1 = cz * CH + CH + 1;
    const hit = (sx && X1 > rx0 && X0 < rx1) || (sz && Z1 > rz0 && Z0 < rz1);
    if (hit) { dirtyCh.add(cx * 64 + cz); const g = chunkObjs.get(cx * 64 + cz); if (g && ((sx && cx * CH >= rx0 && cx * CH + CH <= rx1) || (sz && cz * CH >= rz0 && cz * CH + CH <= rz1))) { blockGroup.remove(g); g.children.forEach(c => { if (c.isInstancedMesh) c.dispose(); else if (c.geometry) c.geometry.dispose(); }); chunkObjs.delete(cx * 64 + cz); chunkLists.delete(cx * 64 + cz); } }
  }
  // models are rebuilt from the shifted lists
  for (const [, o] of entObjs) scene.remove(o.g); entObjs.clear();
  for (const [, c] of cauldrons) scene.remove(c.g); cauldrons.clear();
  // everything that lives in local coordinates
  P.x -= sx; P.z -= sz;
  if (spawnPt) { spawnPt[0] -= sx; spawnPt[2] -= sz; }
  if (g9spawn) { g9spawn[0] -= sx; g9spawn[2] -= sz; }
  for (let k = mobs.length - 1; k >= 0; k--) { const a = mobs[k]; a.g.position.x -= sx; a.g.position.z -= sz; if (a.homeX != null) { a.homeX -= sx; a.homeZ -= sz; }
    if (a.g.position.x < 2 || a.g.position.z < 2 || a.g.position.x > W - 2 || a.g.position.z > D - 2) removeMob(a); }
  for (const d of drops) { d.x -= sx; d.z -= sz; d.m.position.x -= sx; d.m.position.z -= sz; }
  for (const a of arrows) if (a.m) { a.m.position.x -= sx; a.m.position.z -= sz; }
  try { camera.position.x -= sx; camera.position.z -= sz; } catch (_) {}
  rebuild._unloaded = true; rebuild(12);
  c1Shift.last = performance.now() - t0;
}
setInterval(() => {
  if (!started || (genVer !== GEN11 && genVer !== 12) || !C1) return;
  const lim = 70, dx = P.x - W / 2, dz = P.z - D / 2;
  let sx = Math.abs(dx) > lim ? Math.round(dx / CH) * CH : 0, sz = Math.abs(dz) > lim ? Math.round(dz / CH) * CH : 0;
  // stop scrolling a little past the edge of the map
  const clampS = (s, o, N) => { const no = Math.max(-150, Math.min(N - W + 150, o + s)); return Math.round((no - o) / CH) * CH; };
  sx = clampS(sx, c1O[0], C1.NX); sz = clampS(sz, c1O[1], C1.NZ);
  if (sx || sz) c1Shift(sx, sz);
}, 300);
function c1Generate(origin) {
  H = C1H; if (W !== C1W || world.length !== C1W * H * C1W) { W = D = C1W; world = new Uint8Array(W * H * D); }
  genVer = GEN11; cityEdits = new Map(); NEW_W = C1W; c1Park = new Map();
  entMeta.clear();
  if (origin) c1O = origin.slice();
  else { const dp = C1.places.find(p => p[0] === 'Dalmuir Park') || ['', C1.NX >> 1, C1.NZ >> 1]; c1O = [dp[1] - (W >> 1), dp[2] - (D >> 1)]; }
  const t0 = performance.now(); c1Fill(0, W, 0, D); c1Generate.ms = performance.now() - t0;
  const c = W >> 1; g9spawn = cityFindSpawn(c, c);
  dirtyAll = true;
}
// ---- saves: window origin + edits (absolute) + parked metadata ----
(function () {
  const ser = serialize;
  serialize = function () {
    const d = ser.apply(this, arguments);
    if (genVer === GEN11) {
      d.city = 'dalmuir-1m-1'; d.world = 'city1m'; d.origin = c1O.slice(); d.W = W; d.H = H; delete d.edits;
      const e = new Uint32Array(c1Edits.size * 2); let k = 0; for (const [i, v] of c1Edits) { e[k++] = i; e[k++] = v; } d.edits1 = u32ToB64(e);
      d.c1park = [...c1Park]; d.entMeta = (d.entMeta || []).filter(([, v]) => !(v && v.gen));
    }
    return d;
  };
  const dec = rleDecode;
  rleDecode = function (b64, target) {
    if (target === world && c1Pending) { const d = c1Pending; c1Pending = null; c1EditsFrom(d.edits1); c1Generate(d.origin); c1Park = new Map(d.c1park || []); return; }
    return dec.apply(this, arguments);
  };
  const ap = applySave;
  applySave = function (d) {
    if (d && d.gen === GEN11 && C1) { c1Pending = d; H = C1H; d.H = C1H; d.W = C1W; const r = ap.apply(this, arguments);
      // door metadata from the bake was written before the loader restored entMeta: generate it again
      const keep = new Map(entMeta); c1Gen = true; const sv = c1Edits; c1Fill(0, 0, 0, 0); c1Gen = false; for (const [k, v] of keep) entMeta.set(k, v);
      dirtyAll = true; return r; }
    return ap.apply(this, arguments);
  };
})();
function c1EditsFrom(s) { const e = b64ToU32(s || ''); c1Edits = new Map(); for (let k = 0; k + 1 < e.length; k += 2) c1Edits.set(e[k], e[k + 1]); }
// ---- entering worlds: new creative worlds (and 1 m saves) use the 1 m map ----
(function () {
  const ew = enterWorld;
  enterWorld = function (save) {
    const want = (!save && current.mode === 'creative') || (save && (save.gen === GEN11 || save.gen === 12));
    if (!want) { if (H !== 80 + DEEP) { H = 80 + DEEP; world = new Uint8Array(W * H * D); } c1Want = false; return ew.apply(this, arguments); }
    c1Want = true;
    const go = () => {
      if (!save) { c1Edits = new Map(); c1Generate(null); }
      return ew.call(this, save);
    };
    if (C1) return go();
    showScreen('loading'); const tip = $('loadTip'); if (tip) tip.textContent = 'Fetching the 1 m map of Dalmuir, Duntocher and Mountblow...';
    c1Load().then(go, () => { c1Want = false; toast('Could not load the 1 m map'); ew.call(this, save); });
  };
})();
setTimeout(() => (typeof c2Load === 'function' ? c2Load() : c1Load()).catch(() => {}), 2500);
// where am I?
setInterval(() => {
  if (!started || (genVer !== GEN11 && genVer !== 12) || !C1) return;
  const ax = P.x + c1O[0], az = P.z + c1O[1];
  let bn = '', bd = 1e9; for (const p of C1.places) { const d = Math.hypot(p[1] - ax, p[2] - az); if (d < bd) { bd = d; bn = p[0]; } }
  if (bd < 260 && bn !== c1Place) { c1Place = bn; toast(bn); }
}, 1500);
