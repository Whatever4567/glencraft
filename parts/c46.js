/* ===================== GLX-C46 (v0.9.43): Keep markers (red footprint, orange height, green activator) -> brand-new world with your base dropped in from the sky; light/object leak fixes ===================== */
var SHARED_MATS = null;
function disposeObj(o) {   // free GPU memory of a removed object (geometries + its own materials; shared block materials/textures are kept)
  if (!o) return; if (!SHARED_MATS) { SHARED_MATS = new Set(); for (const k in BLOCK_MATS) [].concat(BLOCK_MATS[k]).forEach(m => m && SHARED_MATS.add(m)); for (const k in PLANT_MATS) SHARED_MATS.add(PLANT_MATS[k]); }
  o.traverse(c => { if (c.geometry && !c.geometry.userData.shared) c.geometry.dispose(); if (c.material) [].concat(c.material).forEach(m => { if (m && !SHARED_MATS.has(m) && !m.userData.shared) m.dispose(); }); });
}
(function c46() {
  // ---- light registries: never keep a light whose block is gone ----
  window.lightCounts = () => { let lights = 0, sprites = 0, pts = 0; scene.traverse(o => { if (o.isLight && o.intensity > 0.01) lights++; if (o.isSprite) sprites++; if (o.isPoints) pts++; });
    return {scene: scene.children.length, activeLights: lights, sprites, lightSrc: lightSrc.size, entObjs: entObjs.size, torchGlows: typeof torchGlows !== 'undefined' ? torchGlows.size : 0, chunks: chunkObjs.size, mem: (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1)}; };
  const LS = new Set([T.TORCH, 161, 216]);
  function validateLights() { let n = 0; for (const [k, v] of lightSrc) { const x = Math.floor(v[0]), y = Math.floor(v[1]), z = Math.floor(v[2]); if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H || !LS.has(world[idx(x, y, z)])) { lightSrc.delete(k); n++; } } if (n && farGlow) farGlow.userData.dirty = true; return n; }
  window.validateLights = validateLights;
  setInterval(() => { if (started) try { validateLights(); } catch (_) {} }, 2000);
  const fullRescan = () => { try { scanLights(); } catch (_) {} try { validateLights(); } catch (_) {} };
  for (const n of ['generate', 'applySave']) { const f = n === 'generate' ? generate : applySave; const w = function () { const r = f.apply(this, arguments); fullRescan(); return r; }; if (n === 'generate') generate = w; else applySave = w; }
  for (const n of ['enterDim', 'exitDim']) { if (typeof window[n] === 'function' || (n === 'enterDim' ? typeof enterDim === 'function' : typeof exitDim === 'function')) { const f = n === 'enterDim' ? enterDim : exitDim; const w = function () { const r = f.apply(this, arguments); Promise.resolve(r).then(() => setTimeout(fullRescan, 50)); return r; }; if (n === 'enterDim') enterDim = w; else exitDim = w; } }
  const cws = __clearWorldState;
  window.__clearWorldState = function () { for (const [, o] of entObjs) disposeObj(o.g); for (const d of drops) disposeObj(d.m); const r = cws.apply(this, arguments); lightSrc.clear(); if (farGlow) farGlow.userData.dirty = true; return r; };
  // ---- marker blocks ----
  const MK = {241: ['keep_red', 'Keep marker (red)', '#c8202a', '#ff5a5a'], 242: ['keep_orange', 'Height marker (orange)', '#d8741a', '#ffb050'], 243: ['keep_green', 'Keep activator (green)', '#1f9a3a', '#70ff90']};
  for (const k in MK) { const id = +k, [key, name, c0, c1] = MK[k]; const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = c0; g.fillRect(0, 0, 256, 256); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, 256, 18); g.fillRect(0, 238, 256, 18); g.fillRect(0, 0, 18, 256); g.fillRect(238, 0, 18, 256);
    g.strokeStyle = c1; g.lineWidth = 14; g.strokeRect(40, 40, 176, 176); g.fillStyle = c1; if (id === 243) { g.beginPath(); g.moveTo(96, 72); g.lineTo(184, 128); g.lineTo(96, 184); g.fill(); } else if (id === 242) { g.fillRect(120, 64, 16, 128); g.beginPath(); g.moveTo(88, 96); g.lineTo(128, 56); g.lineTo(168, 96); g.fill(); } else { g.fillRect(64, 120, 128, 16); g.fillRect(120, 64, 16, 128); }
    TEX[key] = c.toDataURL(); NAMES[id] = name; FACES[id] = key; ICON_KEY[id] = key; BLOCK_MATS[id] = mat(key); HARD[id] = 0.3; MC_HARD[id] = 0.3; REQ[id] = 0; PLACEABLE.add(id); if (!ORDER.includes(id)) ORDER.push(id); if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(id); }
  RECIPES.push(rc('4 Keep markers (red)', '4 Cobblestone + 1 Redstone', 241, 4, [[T.COBBLE, 4], [IT.REDSTONE, 1]], 1));
  RECIPES.push(rc('4 Height markers (orange)', '4 Cobblestone + 1 Copper ingot', 242, 4, [[T.COBBLE, 4], [IT.COPPERINGOT, 1]], 1));
  RECIPES.push(rc('Keep activator (green)', '4 Planks + 1 Iron ingot + 1 Redstone', 243, 1, [[T.PLANKS, 4], [IT.IRONINGOT, 1], [IT.REDSTONE, 1]], 1));
  // ---- the old overworld Reset Terrain is replaced by the markers (Hell / Backrooms resets stay) ----
  const rt = resetTerrain;
  resetTerrain = async function () { if (DIM.cur === 'hell' || DIM.cur === 'backrooms') return rt.apply(this, arguments); toast('New world: outline your base with red Keep markers, set the height with orange markers, then use the green activator in the middle.'); };
  setInterval(() => { const b = $('resetTerrainBtn'); if (b) b.style.display = DIM.cur ? '' : 'none'; }, 500);
  // ---- the move ----
  function findMarkers(gx, gy, gz) {
    const reds = [], oranges = [];
    for (let x = Math.max(0, gx - 48); x <= Math.min(W - 1, gx + 48); x++) for (let z = Math.max(0, gz - 48); z <= Math.min(D - 1, gz + 48); z++) for (let y = Math.max(1, gy - 24); y <= Math.min(H - 2, gy + 40); y++) { const b = world[idx(x, y, z)]; if (b === 241) reds.push([x, y, z]); else if (b === 242) oranges.push([x, y, z]); }
    return {reds, oranges};
  }
  window.keepMove = async function (gx, gy, gz, opts) {
    opts = opts || {};
    if (DIM.cur) { toast('Use the activator in the overworld'); return; }
    const {reds, oranges} = findMarkers(gx, gy, gz);
    if (reds.length < 2) { toast('Place at least 2 red Keep markers around your base first'); return; }
    const x0 = Math.min(gx, ...reds.map(r => r[0])), x1 = Math.max(gx, ...reds.map(r => r[0])), z0 = Math.min(gz, ...reds.map(r => r[2])), z1 = Math.max(gz, ...reds.map(r => r[2]));
    const ylo = Math.max(1, Math.min(gy, ...reds.map(r => r[1])) - 1), yhi = Math.min(H - 2, oranges.length ? Math.max(...oranges.map(o => o[1])) : ylo + 14);
    if (!opts.yes && !confirm('Start a brand-new world and bring this ' + (x1 - x0 + 1) + ' x ' + (z1 - z0 + 1) + ' x ' + (yhi - ylo + 1) + ' area with you?\n\nA backup of the old world is saved first.')) return;
    const before = lightCounts();
    try { const id = current.id, bkey = 'backup_' + id + '_keep_' + Date.now().toString(36); await idbPut('worlds', bkey, Object.assign({}, serialize(), {backupOf: id, backedUp: Date.now()})); current.resetBackup = bkey; } catch (e) { toast('Backup failed - nothing changed'); return; }
    c37busy = true;
    const sx = x1 - x0 + 1, sy = yhi - ylo + 1, sz = z1 - z0 + 1, data = new Uint8Array(sx * sy * sz); let blocks = 0;
    for (let x = 0; x < sx; x++) for (let y = 0; y < sy; y++) for (let z = 0; z < sz; z++) { let b = world[idx(x0 + x, ylo + y, z0 + z)]; if (b === 241 || b === 242 || b === 243 || b === T.WATER || b === T.LAVA || b === T.FIRE) b = 0; data[(x * sy + y) * sz + z] = b; if (b) blocks++; }
    const inBox = k => { const [x, y, z] = k.split(',').map(Number); return x >= x0 && x <= x1 && z >= z0 && z <= z1 && y >= ylo && y <= yhi; };
    const meta = {}; for (const [n, m] of [['chests', chests], ['doorState', doorState], ['furnaces', furnaces], ['entMeta', entMeta], ['crops', crops]]) meta[n] = [...m].filter(([k]) => inBox(k)).map(([k, v]) => [k, JSON.parse(JSON.stringify(v))]);
    // wipe everything of the old world
    __clearWorldState(); crops.clear(); chests.clear(); doorState.clear(); furnaces.clear(); entMeta.clear(); try { cauldrons.clear(); } catch (_) {}
    try { placedSet = new Set(); } catch (_) {}
    if (current) current.newCastles = true; cityGen = false; castleAvoid = []; gSeed = ((Math.random() * 2 ** 31) | 0) || 4242; cityEdits = new Map();
    generate(); genVer = GEN9; try { fixTorches(); } catch (_) {}
    try { spawnPlayer(); } catch (_) {}
    // landing site: dry flat ground near the new spawn
    let best = null; for (let r = 4; r <= 60 && !best; r += 6) for (let a = 0; a < 12 && !best; a++) { const cx = Math.round(P.x + Math.cos(a * 0.52) * r - sx / 2), cz = Math.round(P.z + Math.sin(a * 0.52) * r - sz / 2); if (cx < 3 || cz < 3 || cx + sx > W - 3 || cz + sz > D - 3) continue;
      const hs = []; let wet = 0; for (let x = cx; x < cx + sx; x += 2) for (let z = cz; z < cz + sz; z += 2) { const t = solidTop(x, z); hs.push(t); const b = world[idx(x, t, z)]; if (b === T.WATER || b === T.LAVA || t <= SEA) wet++; }
      hs.sort((p, q) => p - q); if (wet === 0 && hs[Math.floor(hs.length * .9)] - hs[Math.floor(hs.length * .1)] <= 4) best = [cx, cz, hs[hs.length >> 1]]; }
    if (!best) best = [Math.round(P.x) - (sx >> 1), Math.round(P.z) - (sz >> 1), solidTop(Math.round(P.x), Math.round(P.z))];
    const [nx0, nz0, ground] = best, dy = ground - ylo, dx = nx0 - x0, dz = nz0 - z0;
    P.x = nx0 + sx + 6; P.z = nz0 + sz / 2; P.y = solidTop(Math.floor(P.x), Math.floor(P.z)) + 1; P.vy = 0; P.fallTop = null; P.yaw = Math.PI / 2; P.pitch = 0.35;
    dirtyAll = true; rebuild();
    // the falling base: one instanced mesh per block type, dropped from the sky
    const fall = new THREE.Group(), byType = new Map();
    for (let x = 0; x < sx; x++) for (let y = 0; y < sy; y++) for (let z = 0; z < sz; z++) { const b = data[(x * sy + y) * sz + z]; if (!b) continue; if (!byType.has(b)) byType.set(b, []); byType.get(b).push(x, y, z); }
    const geo = new THREE.BoxGeometry(1, 1, 1); geo.userData.shared = false; const mm = new THREE.Matrix4();
    for (const [b, a] of byType) { let m = BLOCK_MATS[b] || PLANT_MATS[b]; if (Array.isArray(m)) m = m[0]; if (!m) m = new THREE.MeshLambertMaterial({color: 0x888888}); const im = new THREE.InstancedMesh(geo, m, a.length / 3); for (let i = 0; i < a.length; i += 3) { mm.makeTranslation(a[i] + .5, a[i + 1] + .5, a[i + 2] + .5); im.setMatrixAt(i / 3, mm); } fall.add(im); }
    const startY = ground + 45; fall.position.set(nx0, startY, nz0); scene.add(fall); toast('Here comes your base!');
    await new Promise(res => { let vy = 0, last = performance.now(); const tick = () => { const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; vy += 28 * dt; fall.position.y -= vy * dt; fall.rotation.z = Math.sin(now / 180) * 0.01;
      if (fall.position.y <= ground) { fall.position.y = ground; res(); return; } requestAnimationFrame(tick); }; requestAnimationFrame(tick); setTimeout(res, 6000); });
    try { sfx('thud', 1); sfx('smash', 0.6); shake(0.35, 0.05); } catch (_) {}
    for (let i = 0; i < (PERF ? 10 : 24); i++) burst(nx0 + Math.random() * sx, ground + 0.5, nz0 + (Math.random() < .5 ? 0 : sz), 0x9a8a70, 2, 1.2);
    scene.remove(fall); disposeObj(fall);
    // now it becomes real blocks: clear the site, fill under, paste
    for (let x = 0; x < sx; x++) for (let z = 0; z < sz; z++) { const wx = nx0 + x, wz = nz0 + z; for (let y = ground; y < Math.min(H - 1, ground + sy + 8); y++) world[idx(wx, y, wz)] = T.AIR;
      for (let y = ground - 1, n = 0; y > 1 && n < 30; y--, n++) { const b = world[idx(wx, y, wz)]; if (!b || b === T.WATER || b === T.LEAVES || PLANT[b] === 1) world[idx(wx, y, wz)] = T.DIRT; else break; } }
    for (let x = 0; x < sx; x++) for (let y = 0; y < sy; y++) for (let z = 0; z < sz; z++) { const b = data[(x * sy + y) * sz + z]; if (!b) continue; const k = idx(nx0 + x, ground + y, nz0 + z); world[k] = b; try { if (!__NAT[b]) placedSet.add(k); } catch (_) {} }
    const mv = k => { const [x, y, z] = k.split(',').map(Number); return keyOf(x + dx, y + dy, z + dz); };
    for (const [n, m] of [['chests', chests], ['doorState', doorState], ['furnaces', furnaces], ['entMeta', entMeta], ['crops', crops]]) for (const [k, v] of meta[n]) m.set(mv(k), v);
    buildAreas = [[nx0 + (sx >> 1), ground, nz0 + (sz >> 1), blocks]]; spawnPt = null;
    try { c39Settle({region: [[nx0 + sx / 2, nz0 + sz / 2, Math.max(sx, sz) + 30]]}); } catch (_) {}
    fullRescan(); dirtyAll = true; rebuild();
    for (let n = 0; n < 8; n++) spawnMob('sheep'); for (let n = 0; n < 5; n++) spawnMob('haggis');
    c37busy = false; saveWorld(true);
    const after = lightCounts(); console.log('[keep] ' + JSON.stringify({blocks, box: [sx, sy, sz], before, after}));
    toast('Welcome to your new world! ' + blocks + ' blocks came with you.');
    return {blocks, before, after, site: [nx0, ground, nz0, sx, sy, sz]};
  };
  const ui = useItem;
  useItem = function () {
    if (!menuOpen && !paused && !dead && started) { const r = raycast(5); if (r && r.hit && getB(...r.hit) === 243) { keepMove(r.hit[0], r.hit[1], r.hit[2]); return; } }
    return ui.apply(this, arguments);
  };
})();
