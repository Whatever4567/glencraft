/* ===================== GLX-C37 (v0.9.40): fresh-world reset that keeps your house, per-dimension resets, castle lanterns + loot, dark-only hostile spawns, soft shade lighting, quieter rain, phone tuning, nicer player animation ===================== */
var c37busy = false;
(function c37() {
  const NAT = new Uint8Array(256);
  ['AIR', 'GRASS', 'DIRT', 'STONE', 'SAND', 'GRAVEL', 'LEAVES', 'LOG', 'WATER', 'LAVA', 'DEEPSLATE', 'COALORE', 'IRONORE', 'COPPERORE', 'GOLDORE', 'REDORE', 'DIAMONDORE', 'SILVERORE', 'CAIRNGORMORE',
    'HEATHER', 'PEAT', 'MUD', 'SNOW', 'CLAY', 'TALLGRASS', 'FIRE', 'BEDROCK', 'ICE', 'COBWEB', 'BLUEBELL', 'DAFFODIL', 'DANDELION', 'OBSIDIAN'].forEach(n => { if (T[n] !== undefined) NAT[T[n]] = 1; });
  for (let b = 1; b < 256; b++) if (PLANT[b] === 1 && !(b >= T.WHEAT0 && b <= T.WHEAT3) && !(b >= T.POTATO0 && b <= T.POTATO3) && !(b >= T.NEEP0 && b <= T.NEEP3)) NAT[b] = 1;
  window.__NAT = NAT;
  // ---------- everything that lives outside the block array ----------
  function clearWorldState() {
    try { mobs.slice().forEach(removeMob); } catch (_) {}
    for (const d of drops) { try { scene.remove(d.m); } catch (_) {} } drops.length = 0;
    for (const a of arrows) { try { a.m && scene.remove(a.m); } catch (_) {} } arrows.length = 0;
    for (const f of falling) { try { (f.m || f.g) && scene.remove(f.m || f.g); } catch (_) {} } falling.length = 0;
    try { clearBoats(); } catch (_) {}
    try { fires.clear(); } catch (_) {} try { FLV.clear(); FLQ.clear(); } catch (_) {}
    for (const [, o] of entObjs) scene.remove(o.g); entObjs.clear();
    for (const [, c] of cauldrons) { try { c.g && scene.remove(c.g); } catch (_) {} } cauldrons.clear();
    try { for (const [, f] of fenceObjs) scene.remove(f.g || f); fenceObjs.clear(); } catch (_) {}
    try { for (const [, q] of PV.portals) scene.remove(q.g); PV.portals.clear(); PV.lastPos.clear(); } catch (_) {}
    try { for (const [, s] of torchGlows) scene.remove(s.g || s); torchGlows.clear(); } catch (_) {}
    torchLights.forEach(l => { l.userData.on = 0; l.userData.k = 0; l.userData.src = null; l.intensity = 0; });
    try { flares.forEach(f => { (f.m || f.g) && scene.remove(f.m || f.g); }); flares.length = 0; flareLights.forEach(l => l.intensity = 0); } catch (_) {}
    try { boomLight.intensity = 0; } catch (_) {}
    redOres = [];
    for (const [, g] of chunkObjs) { blockGroup.remove(g); g.children.forEach(c => { if (c.isInstancedMesh) c.dispose(); else if (c.geometry) c.geometry.dispose(); }); }
    chunkObjs.clear(); chunkLists.clear(); dirtyCh.clear();
  }
  window.__clearWorldState = clearWorldState;
  // ---------- find the player's builds (not castles) ----------
  function findZones() {
    let mine = null; try { if (typeof c38Mine === 'function') mine = c38Mine(genVer === GEN9 ? c38GenCells() : null); } catch (e) { console.warn('c38', e); }
    const B = g9BuiltSet(), CS = 8, gz = Math.ceil(D / CS), cells = new Map();
    for (let x = 0; x < W; x++) for (let y = 1; y < H; y++) { const base = (x * H + y) * D; for (let z = 0; z < D; z++) { const b = world[base + z]; if (b && B[b]) {
      const c = Math.floor(x / CS) * gz + Math.floor(z / CS); if (mine && !mine(c)) continue; let e = cells.get(c); if (!e) cells.set(c, e = {n: 0, x0: x, x1: x, z0: z, z1: z, y0: y, y1: y});
      e.n++; if (x < e.x0) e.x0 = x; if (x > e.x1) e.x1 = x; if (z < e.z0) e.z0 = z; if (z > e.z1) e.z1 = z; if (y < e.y0) e.y0 = y; if (y > e.y1) e.y1 = y; } } }
    const cs = (typeof g9castles !== 'undefined' && g9castles) || [], seen = new Set(), zones = [];
    for (const [c] of cells) if (!seen.has(c)) {
      const st = [c]; seen.add(c); const Z = {n: 0, x0: 1e9, x1: -1, z0: 1e9, z1: -1, y0: 1e9, y1: -1};
      while (st.length) { const q = st.pop(), e = cells.get(q), a = Math.floor(q / gz), b = q % gz; Z.n += e.n; Z.x0 = Math.min(Z.x0, e.x0); Z.x1 = Math.max(Z.x1, e.x1); Z.z0 = Math.min(Z.z0, e.z0); Z.z1 = Math.max(Z.z1, e.z1); Z.y0 = Math.min(Z.y0, e.y0); Z.y1 = Math.max(Z.y1, e.y1);
        for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) { const r = (a + da) * gz + (b + db); if (cells.has(r) && !seen.has(r)) { seen.add(r); st.push(r); } } }
      const cx = (Z.x0 + Z.x1) / 2, cz = (Z.z0 + Z.z1) / 2;
      if (Z.n < 12 || Z.x1 - Z.x0 > 80 || Z.z1 - Z.z0 > 80) continue;
      if (!mine && cs.some(cc => Math.hypot(cc[1] - cx, cc[2] - cz) < (cc[0] === 'citadel' ? 70 : 56))) continue;
      zones.push(Z);
    }
    // the bed / spawn point always counts as home
    if (spawnPt && !zones.some(Z => spawnPt[0] >= Z.x0 - 2 && spawnPt[0] <= Z.x1 + 2 && spawnPt[2] >= Z.z0 - 2 && spawnPt[2] <= Z.z1 + 2)) {
      const x = Math.floor(spawnPt[0]), y = Math.floor(spawnPt[1]), z = Math.floor(spawnPt[2]); zones.push({n: 1, x0: x - 5, x1: x + 5, z0: z - 5, z1: z + 5, y0: y - 1, y1: y + 5});
    }
    zones.sort((a, b) => b.n - a.n); const out = zones.slice(0, 8);
    for (const Z of out) {   // the house's ground course: 30th percentile of each column's lowest built block
      const mins = [];
      for (let x = Z.x0; x <= Z.x1; x++) for (let z = Z.z0; z <= Z.z1; z++) for (let y = Math.max(1, Z.y0); y <= Z.y1; y++) if (B[world[idx(x, y, z)]]) { mins.push(y); break; }
      mins.sort((a, b) => a - b); Z.base = mins.length ? mins[Math.floor(mins.length * 0.3)] : Z.y0;
      Z.x0 -= 1; Z.x1 += 1; Z.z0 -= 1; Z.z1 += 1; Z.x0 = Math.max(0, Z.x0); Z.z0 = Math.max(0, Z.z0); Z.x1 = Math.min(W - 1, Z.x1); Z.z1 = Math.min(D - 1, Z.z1);
      Z.ylo = Math.max(1, Z.base - 10); Z.yhi = Math.min(H - 1, Z.y1 + 2);
    }
    return out;
  }
  function copyZone(Z) {
    const sx = Z.x1 - Z.x0 + 1, sy = Z.yhi - Z.ylo + 1, sz = Z.z1 - Z.z0 + 1, a = new Uint8Array(sx * sy * sz).fill(255);
    for (let x = 0; x < sx; x++) for (let y = 0; y < sy; y++) for (let z = 0; z < sz; z++) {
      const wy = Z.ylo + y, b = world[idx(Z.x0 + x, wy, Z.z0 + z)];
      a[(x * sy + y) * sz + z] = wy >= Z.base ? (NAT[b] ? 0 : b) : (NAT[b] ? 255 : b);
    }
    Z.data = a; Z.sx = sx; Z.sy = sy; Z.sz = sz;
    const inZ = k => { const [x, y, z] = k.split(',').map(Number); return x >= Z.x0 && x <= Z.x1 && z >= Z.z0 && z <= Z.z1 && y >= Z.ylo && y <= Z.yhi; };
    Z.meta = {};
    for (const [n, m] of [['chests', chests], ['doorState', doorState], ['furnaces', furnaces], ['entMeta', entMeta], ['crops', crops]]) Z.meta[n] = [...m].filter(([k]) => inZ(k));
  }
  function pasteZone(Z) {
    // pick dry, fairly flat land near the old spot (not in water, not in a castle)
    const site = (ox, oz) => { const g = []; let wet = 0, n = 0;
      if (Z.x0 + ox < 2 || Z.z0 + oz < 2 || Z.x1 + ox > W - 3 || Z.z1 + oz > D - 3) return null;
      if (g9castles.some(c => Math.hypot(c[1] - (Z.x0 + Z.x1) / 2 - ox, c[2] - (Z.z0 + Z.z1) / 2 - oz) < (c[0] === 'citadel' ? 48 : 38))) return null;
      for (let x = Z.x0 + ox; x <= Z.x1 + ox; x += 2) for (let z = Z.z0 + oz; z <= Z.z1 + oz; z += 2) { const t = solidTop(x, z); g.push(t); n++; const b = world[idx(x, Math.min(H - 1, t + 1), z)], b0 = world[idx(x, t, z)]; if (b === T.WATER || b0 === T.WATER || b === T.LAVA || b0 === T.LAVA || t <= SEA) wet++; }
      g.sort((a, b) => a - b); const med = g[g.length >> 1], spread = g[Math.floor(g.length * 0.9)] - g[Math.floor(g.length * 0.1)];
      return {score: wet / n * 100 + spread * 2 + Math.hypot(ox, oz) * 0.05, med}; };
    let best = null, bo = [0, 0];
    for (let r = 0; r <= 96; r += 8) for (let a = 0; a < (r ? 12 : 1); a++) { const ox = Math.round(Math.cos(a / 12 * 6.283) * r), oz = Math.round(Math.sin(a / 12 * 6.283) * r), s = site(ox, oz); if (s && (!best || s.score < best.score)) { best = s; bo = [ox, oz]; } }
    Z.ox = bo[0]; Z.oz = bo[1]; Z.x0 += Z.ox; Z.x1 += Z.ox; Z.z0 += Z.oz; Z.z1 += Z.oz;
    const ground = best ? best.med : SEA + 2;
    Z.dy = Math.max(3 - Z.ylo, Math.min(H - 3 - Z.yhi, ground + 1 - Z.base));
    for (let x = Z.x0; x <= Z.x1; x++) for (let z = Z.z0; z <= Z.z1; z++) {
      // clear the site above the ground course (trees, rocks), foundation under it
      for (let y = Z.base + Z.dy; y < Math.min(H, Z.yhi + Z.dy + 10); y++) world[idx(x, y, z)] = T.AIR;
      for (let y = Z.base + Z.dy - 1, n = 0; y > 1 && n < 30; y--, n++) { const b = world[idx(x, y, z)]; if (b === T.AIR || b === T.WATER || b === T.LEAVES || b === T.LOG || PLANT[b] === 1) world[idx(x, y, z)] = n === 0 ? T.GRASS : T.DIRT; else break; }
    }
    let n = 0;
    for (let x = 0; x < Z.sx; x++) for (let y = 0; y < Z.sy; y++) for (let z = 0; z < Z.sz; z++) { const v = Z.data[(x * Z.sy + y) * Z.sz + z]; if (v === 255) continue; const wy = Z.ylo + y + Z.dy; if (wy < 1 || wy >= H) continue; world[idx(Z.x0 + x, wy, Z.z0 + z)] = v; if (v) n++; }
    const mv = k => { const [x, y, z] = k.split(',').map(Number); return keyOf(x + Z.ox, y + Z.dy, z + Z.oz); };
    for (const [nme, m] of [['chests', chests], ['doorState', doorState], ['furnaces', furnaces], ['entMeta', entMeta], ['crops', crops]]) for (const [k, v] of Z.meta[nme]) m.set(mv(k), v);
    return n;
  }
  const backup = async () => {
    const id = current.id, d0 = serialize(), bkey = 'backup_' + id + '_reset_' + Date.now().toString(36);
    await idbPut('worlds', bkey, Object.assign({}, d0, {backupOf: id, backedUp: Date.now()}));
    migrBackupKey = bkey; current.resetBackup = bkey;
  };
  async function resetOverworld() {
    if (!confirm('Reset the terrain of "' + current.name + '"?\n\nA backup is saved first. You get a completely new world (new seed, new caves and castles); your house and builds are lifted onto the new ground. Inventory, armour and chests in your house are kept.')) return;
    try { await backup(); } catch (e) { toast('Backup failed - terrain not reset'); return; }
    c37busy = true;
    try {
      const zones = findZones(); zones.forEach(copyZone);
      const inZone = (x, z) => zones.find(Z => x >= Z.x0 && x <= Z.x1 && z >= Z.z0 && z <= Z.z1);
      const pZ = inZone(Math.floor(P.x), Math.floor(P.z)), sZ = spawnPt ? inZone(Math.floor(spawnPt[0]), Math.floor(spawnPt[2])) : null;
      clearWorldState();
      crops.clear(); chests.clear(); doorState.clear(); furnaces.clear(); entMeta.clear();
      castleAvoid = zones.map(Z => ({x0: Z.x0 - 4, x1: Z.x1 + 4, z0: Z.z0 - 4, z1: Z.z1 + 4}));
      if (current) current.newCastles = true;
      cityGen = false; gSeed = ((Math.random() * 2 ** 31) | 0) || 12345; cityEdits = new Map();
      generate(); castleAvoid = [];
      let blocks = 0; for (const Z of zones) blocks += pasteZone(Z);
      try { placedSet = new Set(); for (const Z of zones) for (let x = Z.x0; x <= Z.x1; x++) for (let z = Z.z0; z <= Z.z1; z++) for (let y = Z.ylo + Z.dy; y <= Z.yhi + Z.dy; y++) { if (y < 1 || y >= H) continue; const k = idx(x, y, z), b = world[k]; if (b && !NAT[b]) placedSet.add(k); } } catch (_) {}
      genVer = GEN9; g9spawn = null;
      try { fixTorches(); } catch (_) {}
      buildAreas = zones.map(Z => [Math.round((Z.x0 + Z.x1) / 2), Z.base + Z.dy, Math.round((Z.z0 + Z.z1) / 2), Z.n]);
      if (spawnPt && sZ) spawnPt = [spawnPt[0] + sZ.ox, spawnPt[1] + sZ.dy, spawnPt[2] + sZ.oz]; else if (spawnPt) spawnPt = null;
      if (pZ) { P.x += pZ.ox; P.z += pZ.oz; P.y += pZ.dy; } else if (zones.length) { const Z = zones[0]; safeTeleport(Math.round((Z.x0 + Z.x1) / 2), Z.base + Z.dy + 1, Math.round((Z.z0 + Z.z1) / 2)); } else spawnPlayer();
      { const y = safeLand(P.x, P.y, P.z); if (y !== null && y !== undefined) P.y = y; }
      P.vy = 0; P.fallTop = null;
      for (let n = 0; n < 8; n++) spawnMob('sheep'); for (let n = 0; n < 6; n++) spawnMob('haggis');
      dirtyAll = true; rebuild();
      saveWorld(true);
      try { setPause(false); } catch (_) {}
      toast('Brand new world! Your house (' + blocks + ' blocks in ' + zones.length + ' build' + (zones.length === 1 ? '' : 's') + ') was moved onto the new ground. Backup saved.');
      console.log('[reset37] ' + JSON.stringify({zones: zones.map(Z => [Z.x0, Z.z0, Z.x1, Z.z1, Z.base, Z.dy, Z.n]), blocks, seed: gSeed}));
      return {zones: zones.length, blocks};
    } finally { c37busy = false; }
  }
  async function resetDim() {
    const nm = DIM.cur === 'hell' ? 'Hell' : 'the Backrooms';
    if (!confirm('Reset ' + nm + '?\n\nOnly ' + nm + ' is regenerated; the overworld is not touched.')) return;
    c37busy = true;
    try {
      clearWorldState(); crops.clear(); chests.clear(); doorState.clear(); furnaces.clear(); entMeta.clear();
      if (DIM.cur === 'hell') { const s = gSeed; gSeed = ((Math.random() * 2 ** 31) | 0) || 77; try { genHell(); genVer = 1; spawnHell(); } finally { gSeed = s; } }
      else { genBackrooms(); genVer = 1; brSafeArrival(); }
      P.vy = 0; P.fallTop = null; dirtyAll = true; rebuild(); saveWorld(true);
      try { setPause(false); } catch (_) {}
      toast(nm.replace('the ', 'The ') + ' regenerated.');
    } finally { c37busy = false; }
  }
  const rt0 = resetTerrain;
  resetTerrain = async function () {
    if (!started || !current) return;
    if (DIM.cur === 'hell' || DIM.cur === 'backrooms') return resetDim();
    if (genVer === GEN9 || (genVer < GEN9 && genVer !== 1)) return resetOverworld();
    return rt0.apply(this, arguments);
  };
  window.__resetOverworld = resetOverworld; window.__resetDim = resetDim;
  setInterval(() => { const b = $('resetTerrainBtn'); if (!b) return; const t = DIM.cur === 'hell' ? 'Reset Hell' : DIM.cur === 'backrooms' ? 'Reset Backrooms' : 'Reset terrain'; if (b.textContent !== t) b.textContent = t; }, 400);
  // ---------- no stray items or block pops while a world is being generated ----------
  const di = dropItem; dropItem = function () { if (c37busy || (typeof flGen !== 'undefined' && flGen) || cityGen) return; return di.apply(this, arguments); };
  const ge = generate; generate = function () { const was = c37busy; c37busy = true; try { return ge.apply(this, arguments); } finally { c37busy = was; } };
  // ---------- castles: lanterns and sconces instead of torches, painting + loot in every chest ----------
  const pc = g9PlaceCastles;
  g9PlaceCastles = function () {
    const r = pc.apply(this, arguments);
    try {
      for (const c of g9castles) { const R = c[0] === 'citadel' ? 38 : 32;
        for (let x = Math.max(0, c[1] - R); x < Math.min(W, c[1] + R); x++) for (let z = Math.max(0, c[2] - R); z < Math.min(D, c[2] + R); z++) for (let y = 1; y < H; y++) if (world[idx(x, y, z)] === T.TORCH) { const k = keyOf(x, y, z); entMeta.set(k, Object.assign({face: 0}, entMeta.get(k) || {}, {lamp: 1})); } }
    } catch (e) { console.warn('castle37', e); }
    return r;
  };
  const ge2 = generate; generate = function () { const r = ge2.apply(this, arguments); try {
      for (const c of g9castles) { const R = c[0] === 'citadel' ? 42 : 36;
        for (let x = Math.max(0, c[1] - R); x < Math.min(W, c[1] + R); x++) for (let z = Math.max(0, c[2] - R); z < Math.min(D, c[2] + R); z++) for (let y = 1; y < H; y++) if (world[idx(x, y, z)] === T.TORCH) { const k = keyOf(x, y, z); entMeta.set(k, Object.assign({face: 0}, entMeta.get(k) || {}, {lamp: 1})); } }
      let s = (gSeed ^ 0x7a11) >>> 0 || 5; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
      for (const [k, c] of chests) { const [qx, , qz] = k.split(',').map(Number); if (!g9castles.some(cc => Math.hypot(cc[1] - qx, cc[2] - qz) < 45)) continue; if (!c.slots) continue;
        const slots = c.slots; const put = it => { const i = slots.findIndex(q => !q); if (i >= 0) slots[i] = it; };
        if (!slots.some(q => q && q[0] === IT.PAINTING)) put([IT.PAINTING, 1]);
        if (rnd() < 0.7) put([IT.BREAD, 2 + Math.floor(rnd() * 4)]); if (rnd() < 0.5) put([IT.COAL, 3 + Math.floor(rnd() * 6)]); if (rnd() < 0.4) put([IT.IRONINGOT, 1 + Math.floor(rnd() * 4)]);
        if (rnd() < 0.25) put([IT.GOLDINGOT, 1 + Math.floor(rnd() * 3)]); if (rnd() < 0.3) put([IT.COOKEDMUTTON, 2 + Math.floor(rnd() * 3)]); }
    } catch (e) { console.warn('castle37', e); }
    return r;
  };
  const iron = new THREE.MeshLambertMaterial({color: 0x26231f}), glassM = new THREE.MeshBasicMaterial({color: 0xffc670, transparent: true, opacity: 0.55, depthWrite: false});
  const bx = (g, m, w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  function lantern(g, y0) {   // iron cage, warm glass, cap and ring
    bx(g, iron, 0.3, 0.04, 0.3, 0, y0, 0); bx(g, iron, 0.26, 0.04, 0.26, 0, y0 + 0.34, 0); bx(g, iron, 0.14, 0.05, 0.14, 0, y0 + 0.39, 0);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bx(g, iron, 0.035, 0.32, 0.035, sx * 0.12, y0 + 0.18, sz * 0.12);
    bx(g, glassM, 0.22, 0.28, 0.22, 0, y0 + 0.17, 0);
    const fl = glowSprite(0xffb050, 0.32); fl.position.set(0, y0 + 0.17, 0); g.add(fl); const gl = glowSprite(0xffa040, 1.1); gl.position.copy(fl.position); g.add(gl);
    return {flame: fl, glow: gl};
  }
  const be = buildEnt;
  buildEnt = function (type, x, y, z) {
    const meta = type === T.TORCH ? entMeta.get(keyOf(x, y, z)) : null;
    if (!meta || !meta.lamp) return be.apply(this, arguments);
    const g = new THREE.Group(); g.position.set(x + .5, y, z + .5); const o = {type, g, x, y, z, open: 0}; let L;
    if (meta.wall) {   // wall sconce: bracket from the wall, lantern hanging off it
      const w = meta.wall, ax = w[0] * 0.38, az = w[1] * 0.38;
      bx(g, iron, w[0] ? 0.06 : 0.14, 0.18, w[0] ? 0.14 : 0.06, ax + w[0] * 0.08, 0.62, az + w[1] * 0.08);
      const arm = bx(g, iron, w[0] ? 0.36 : 0.04, 0.04, w[0] ? 0.04 : 0.36, ax * 0.55, 0.7, az * 0.55);
      bx(g, iron, 0.02, 0.1, 0.02, 0, 0.64, 0);
      L = lantern(g, 0.2);
    } else if (meta.ceil) { bx(g, iron, 0.025, 0.4, 0.025, 0, 0.8, 0); L = lantern(g, 0.2); }
    else { bx(g, iron, 0.34, 0.04, 0.34, 0, 0.02, 0); L = lantern(g, 0.04); }
    o.flame = L.flame; o.glow = L.glow; scene.add(g); g.updateMatrixWorld(true); const hp = new THREE.Vector3(); L.flame.getWorldPosition(hp); o.lp = [hp.x, hp.y, hp.z];
    return o;
  };
  // ---------- hostile mobs only where it is dark ----------
  const HOST = new Set(['zombie', 'skeleton', 'creeper', 'spider']);
  window.lightAt = function (x, y, z) {
    let l = 0; if (skyTop(x, z) <= y + 1) l = daylight * (1 - weather.dark * 0.3);
    for (const o of entObjs.values()) if (o.type === T.TORCH) { const d = Math.hypot(o.x - x, o.y - y, o.z - z); if (d < 9) l = Math.max(l, 1 - d / 9); }
    return l;
  };
  const sm = spawnMob;
  spawnMob = function (kind) {
    const a = sm.apply(this, arguments);
    if (a && HOST.has(kind) && !DIM.cur && a.g && !window.__egg) { const p = a.g.position; if (lightAt(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)) > 0.35) { removeMob(a); return null; } }
    return a;
  };
  // ---------- lighting: shade is soft, only real enclosure (caves, closed rooms) darkens, eased over ~1.5 s ----------
  const DIRS = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, e = i % 2 ? 0.35 : 0.9; DIRS.push([Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)]); } DIRS.push([0, 1, 0]);
  let dEase = 0, dT = 0, dLast = performance.now(), dRaw = 0;
  caveDepth = function () {
    const now = performance.now(), dt = Math.min(0.25, (now - dLast) / 1000); dLast = now;
    if (now - dT > 150) { dT = now;
      const ex = P.x, ey = P.y + 1.6, ez = P.z; let open = 0;
      for (const [dx, dy, dz] of DIRS) { let esc = false;
        for (let s = 1; s <= 30; s += 1) { const x = Math.floor(ex + dx * s), y = Math.floor(ey + dy * s), z = Math.floor(ez + dz * s);
          if (x < 0 || z < 0 || x >= W || z >= D || y >= H - 1) { esc = true; break; }
          const b = world[idx(x, y, z)]; if (b !== T.AIR && b !== T.LEAVES && b !== T.WATER && b !== T.GLASS && PLANT[b] !== 1) break;
          if (y >= skyTop(x, z)) { esc = true; break; } }
        if (esc) open++; }
      const o = open / DIRS.length;   // 0 = sealed cave, 1 = open sky
      dRaw = o > 0.3 ? 0 : 1.5 + 22 * Math.min(1, (0.3 - o) / 0.3);
    }
    dEase += (dRaw - dEase) * Math.min(1, dt * 1.2);
    return dEase;
  };
  // ---------- softer materials: no harsh specular glints on blocks ----------
  const soften = () => { for (const k in BLOCK_MATS) { if (+k === T.GLASS || +k === 227 || +k === T.WATER) continue; for (const m of [].concat(BLOCK_MATS[k])) { if (!m) continue;
    if (m.isMeshPhongMaterial) { if (m.specular) m.specular.setHex(0x0b0b0b); m.shininess = Math.min(m.shininess || 0, 8); }
    if (m.isMeshStandardMaterial) { m.roughness = Math.max(m.roughness, 0.85); m.metalness = Math.min(m.metalness, 0.05); m.envMap = null; m.needsUpdate = true; } } } };
  soften(); setTimeout(soften, 4000); setTimeout(soften, 12000);
  // ---------- phone: fewer point lights, capped particles ----------
  if (!HIGH) { while (torchLights.length > 4) { const l = torchLights.pop(); scene.remove(l); } }
  const bu = burst; burst = function () { if (parts.length > (HIGH ? 260 : PERF ? 50 : 110)) return; return bu.apply(this, arguments); };
  // ---------- rain: about half as loud; under a roof gently lower + low-passed, eased over ~1 s ----------
  let cov37 = 0;
  const ur = updateRain;
  updateRain = function (dt) {
    const r = ur.apply(this, arguments);
    try {
      const w = WEATHER[weather.type], n = w && w.drops;
      cov37 += ((typeof rainCover === 'number' && rainCover > 0.5 ? 1 : 0) - cov37) * Math.min(1, dt * 1.6);
      if (rainGain) {
        const base = n ? (weather.type === 'light' ? 0.05 : 0.13) * Math.min(1, weather.dark / Math.max(.01, w.dark)) : 0;
        const tgt = base * (1 - caveK) * (1 - 0.3 * cov37) * SET.sfx;
        rainGain.gain.setTargetAtTime(tgt, AC.currentTime, 0.3);
      }
      if (typeof rainLP !== 'undefined' && rainLP) rainLP.frequency.setTargetAtTime(9000 - 6200 * cov37, AC.currentTime, 0.35);
      if (typeof roofOut !== 'undefined' && roofOut) roofOut.gain.setTargetAtTime(0.55, AC.currentTime, 0.3);
    } catch (_) {}
    return r;
  };
  // ---------- player: hi-res skin, eyelids, breathing, idle glances, eased walk / sprint blend, item in the hand ----------
  (function playerHD() {
    const cv = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); f(g, w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t; };
    const noise = (g, w, h, a, s) => { const im = g.getImageData(0, 0, w, h), d = im.data; for (let i = 0; i < d.length; i += 4) { const v = (Math.random() - 0.5) * a; d[i] += v; d[i + 1] += v; d[i + 2] += v * 0.9; } g.putImageData(im, 0, 0); };
    tartanTex = cv(512, 512, (g, w) => {
      g.fillStyle = '#1d4a2c'; g.fillRect(0, 0, w, w);
      g.globalAlpha = .78; g.fillStyle = '#16264f'; for (let i = 0; i < w; i += 256) { g.fillRect(i + 32, 0, 88, w); g.fillRect(0, i + 32, w, 88); }
      g.fillStyle = '#9b1c22'; for (let i = 0; i < w; i += 128) { g.fillRect(i + 160, 0, 14, w); g.fillRect(0, i + 160, w, 14); }
      g.globalAlpha = .9; g.fillStyle = '#e6c84a'; for (let i = 0; i < w; i += 256) { g.fillRect(i + 208, 0, 5, w); g.fillRect(0, i + 208, w, 5); }
      g.globalAlpha = .16; g.fillStyle = '#000'; for (let y = 0; y < w; y += 4) for (let x = (y / 4) % 2 * 2; x < w; x += 4) g.fillRect(x, y, 2, 2);   // 2/2 twill
      g.globalAlpha = 1; noise(g, w, w, 18);
    });
    tartanTex.wrapS = tartanTex.wrapT = THREE.RepeatWrapping; tartanTex.repeat.set(2, 1.2);
    faceTexP = cv(512, 512, (g, w) => {
      const gr = g.createRadialGradient(256, 300, 40, 256, 280, 360); gr.addColorStop(0, '#e9b893'); gr.addColorStop(1, '#cf9a76'); g.fillStyle = gr; g.fillRect(0, 0, w, w);
      noise(g, w, w, 10);
      g.fillStyle = '#b5562a'; g.fillRect(0, 0, w, 66); for (let i = 0; i < 90; i++) { g.fillStyle = i % 2 ? '#a24b23' : '#c46434'; g.fillRect(Math.random() * w, 40 + Math.random() * 30, 6, 18 + Math.random() * 14); }
      g.fillStyle = '#9c4a22'; g.fillRect(78, 158, 124, 26); g.fillRect(310, 158, 124, 26);   // brows
      for (const ex of [96, 328]) { g.fillStyle = '#f4f1ea'; g.fillRect(ex, 206, 96, 58); g.fillStyle = '#2f6fb0'; g.fillRect(ex + (ex < 200 ? 40 : 0), 206, 56, 58); g.fillStyle = '#1b4a7a'; g.fillRect(ex + (ex < 200 ? 40 : 0), 206, 56, 10);
        g.fillStyle = '#101418'; g.fillRect(ex + (ex < 200 ? 54 : 14), 220, 28, 36); g.fillStyle = '#ffffff'; g.fillRect(ex + (ex < 200 ? 58 : 18), 224, 9, 9); g.fillStyle = 'rgba(80,40,20,.35)'; g.fillRect(ex, 264, 96, 6); }
      g.fillStyle = '#c98d6a'; g.fillRect(224, 250, 64, 84); g.fillStyle = '#b67b5a'; g.fillRect(224, 318, 64, 16);
      g.fillStyle = '#b5562a'; g.fillRect(40, 350, 432, 162); for (let i = 0; i < 400; i++) { g.fillStyle = ['#a24b23', '#c46434', '#8e3f1c'][i % 3]; g.fillRect(40 + Math.random() * 428, 350 + Math.random() * 158, 4, 10 + Math.random() * 12); }
      g.fillStyle = '#7a2e24'; g.fillRect(186, 384, 140, 28); g.fillStyle = '#5a2018'; g.fillRect(196, 396, 120, 8);
    });
    const shirtT = cv(256, 256, (g, w) => { g.fillStyle = '#efe8da'; g.fillRect(0, 0, w, w); g.globalAlpha = .07; g.fillStyle = '#000'; for (let y = 0; y < w; y += 3) g.fillRect(0, y, w, 1); for (let x = 0; x < w; x += 3) g.fillRect(x, 0, 1, w); g.globalAlpha = 1; noise(g, w, w, 12); });
    const hairT = cv(256, 256, (g, w) => { g.fillStyle = '#b5562a'; g.fillRect(0, 0, w, w); for (let i = 0; i < 900; i++) { g.fillStyle = ['#a24b23', '#c46434', '#8e3f1c', '#d0753f'][i % 4]; g.fillRect(Math.random() * w, Math.random() * w, 3, 12 + Math.random() * 20); } });
    const leatherT = cv(256, 256, (g, w) => { g.fillStyle = '#4a2e1b'; g.fillRect(0, 0, w, w); noise(g, w, w, 26); });
    const bpm = buildPlayerModel;
    buildPlayerModel = function (pbr) {
      const g = bpm.apply(this, arguments);
      try {
        g.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) { if (!m || m.map || !m.color) continue; const hx = m.color.getHexString();
          if (/^f0e9dc|^efe8da/.test(hx) || m.userData.shirt) { m.map = shirtT; m.color.setHex(0xffffff); m.needsUpdate = true; m.userData.shirt = 1; }
          else if (m.roughness === .55 && m.metalness === 0) { m.map = hairT; m.color.setHex(0xffffff); m.needsUpdate = true; }
          else if (m.roughness === .4) { m.map = leatherT; m.color.setHex(0xffffff); m.needsUpdate = true; } } });
        const u = g.userData, skinM = new THREE.MeshStandardMaterial({color: 0xd9a27c, roughness: .6});
        const lids = []; for (const sx of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.064, 0.012), skinM); l.position.set(sx * 0.109, 0.266, 0.254); l.scale.y = 0.01; u.head.add(l); lids.push(l); }
        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.04), skinM); nose.position.set(0, 0.2, 0.265); u.head.add(nose);
        for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.07), skinM); e.position.set(sx * 0.262, 0.24, 0); u.head.add(e); }
        u.lids = lids; u.anim = {t: 0, blink: 2, look: 0, lookT: 2, lookTo: 0, lookP: 0, sprint: 0, last: performance.now()};
      } catch (e) { console.warn('playerHD', e); }
      return g;
    };
    const ease = x => x * x * (3 - 2 * x);
    const uw = updateWorldModel;
    updateWorldModel = function () {
      const r = uw.apply(this, arguments);
      if (!worldModel || !camMode) return r;
      const u = worldModel.userData, A = u.anim; if (!A) return r;
      const now = performance.now(), dt = Math.min(0.1, (now - A.last) / 1000); A.last = now; A.t += dt;
      const mv = ease(Math.min(1, bobAmp)), idle = 1 - mv; A.sprint += ((sprinting ? 1 : 0) - A.sprint) * Math.min(1, dt * 4);
      const ph = bobPhase, amp = (0.55 + 0.35 * A.sprint) * mv, sw = Math.sin(ph) * amp;
      u.legs[0].rotation.x = sw; u.legs[1].rotation.x = -sw;
      if (!swimming) u.arms[0].rotation.x = -sw * (0.75 + 0.3 * A.sprint);
      u.torso.rotation.y = Math.sin(ph) * 0.07 * mv; u.torso.rotation.x = 0.13 * A.sprint * mv;
      worldModel.position.y = P.y + Math.abs(Math.sin(ph)) * (0.035 + 0.03 * A.sprint) * mv;
      worldModel.rotation.z = Math.sin(ph) * 0.02 * mv;
      // breathing + idle glances
      const br = Math.sin(A.t * 1.9) * 0.5 + 0.5; u.torso.scale.set(1 + 0.008 * br * idle, 1 + 0.012 * br * idle, 1 + 0.01 * br * idle);
      A.lookT -= dt; if (A.lookT <= 0) { A.lookT = 2.5 + Math.random() * 4; A.lookTo = idle > 0.6 && Math.random() < 0.7 ? (Math.random() - 0.5) * 1.1 : 0; A.lookP = idle > 0.6 && Math.random() < 0.4 ? (Math.random() - 0.5) * 0.3 : 0; }
      A.look += (A.lookTo * idle - A.look) * Math.min(1, dt * 2.2);
      u.head.rotation.y = A.look; u.head.rotation.x = -P.pitch * 0.6 + A.lookP * idle + Math.sin(ph * 2) * 0.03 * mv;
      // blink every 2-6 s
      A.blink -= dt; let lid = 0.01; if (A.blink < 0.18) lid = Math.sin(Math.max(0, A.blink) / 0.18 * Math.PI) + 0.01; if (A.blink <= 0) A.blink = 2 + Math.random() * 4;
      if (u.lids) u.lids.forEach(l => l.scale.y = Math.max(0.01, lid));
      // the held item sits in the hand, posed per kind
      const hm = typeof heldMesh3p !== 'undefined' ? heldMesh3p : null, grip = u.arms[1] && u.arms[1].userData.grip;
      if (hm && grip) {
        if (hm.parent !== grip) { grip.add(hm); hm.userData.side = 0; }
        if (hm.userData.pose37 !== heldId) { hm.userData.pose37 = heldId; hm.scale.setScalar(1.6);
          if (hm.userData.tool) { hm.position.set(0, -0.04, 0.06); hm.rotation.set(Math.PI / 2 - 0.25, Math.PI / 2, 0); }
          else if (parseInt(heldId) === 65 || parseInt(heldId) === 170) { hm.position.set(0, -0.12, 0.1); hm.rotation.set(0, Math.PI / 2, 0); hm.scale.setScalar(1.2); }
          else if (hm.userData.block) { hm.position.set(0, -0.08, 0.1); hm.rotation.set(0.2, 0.6, 0); hm.scale.setScalar(1.35); }
          else { hm.position.set(0, -0.06, 0.08); hm.rotation.set(-0.5, 0, 0); } }
      }
      return r;
    };
  })();
})();
