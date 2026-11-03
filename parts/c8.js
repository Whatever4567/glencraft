
/* ===================== GLX-D3 (v0.9.7): island survival world, sea mountain + peak castle, Ultra view distance, boats ===================== */
var g9Island = false, g9NoIsland = false, ISL_W = 448, ISL_H = 128, ISL_C = [170, 224], ISL_R = 112, MT_C = [372, 224], MT_R = 58, peakCastle = null, HOL_C = [392, 226], HOL_FLOOR = 84, mtHalo = null;
function sstep(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
(function islandHeight() {
  const gh = g9height;
  g9height = function (x, z) {
    const r = gh(x, z);
    if (!g9Island) return r;
    // island: the Highlands inside a noisy coastline, sloping down into the sea
    const ang = Math.atan2(z - ISL_C[1], x - ISL_C[0]);
    const wob = 1 + 0.16 * g9fbm(Math.cos(ang) * 2.2 + 11, Math.sin(ang) * 2.2 - 7, 3) + 0.06 * g9fbm(x / 23, z / 23, 2);
    const d = Math.hypot(x - ISL_C[0], z - ISL_C[1]) / (ISL_R * wob);
    const m = 1 - sstep(0.72, 1.0, d);                     // 1 inland, 0 at sea
    const sea = SEA - 6 - Math.min(10, (d - 1) * 30) + g9fbm(x / 30, z / 30, 2) * 2;
    let h = r.h * m + Math.min(r.h, sea) * (1 - m);
    if (m < 1) h = Math.min(h, SEA + 2 + (r.h - SEA - 2) * sstep(0.0, 0.55, m));   // beaches: coast falls gently to the waterline
    // the great mountain across the water
    const dm = Math.hypot(x - MT_C[0], z - MT_C[1]) / (MT_R * (1 + 0.14 * g9fbm(x / 40 + 3, z / 40, 2)));
    let mt = false;
    if (dm < 1.2) {
      const k = Math.max(0, 1 - dm), ang = Math.atan2(z - MT_C[1], x - MT_C[0]);
      // ridged multifractal: sharp aretes radiating from the summit plus corries between them
      const r1 = 1 - Math.abs(g9fbm(x / 30 - 5, z / 30 + 9, 3)), r2 = 1 - Math.abs(g9fbm(x / 13 + 2, z / 13 - 4, 2));
      const spur = Math.pow(Math.abs(Math.cos(ang * 2.5 + g9fbm(x / 50, z / 50, 2) * 2)), 3);
      let mh = SEA - 8 + (H - 30 - SEA + 8) * (0.6 * Math.pow(k, 0.9) + 0.4 * Math.pow(k, 2.2)) + (r1 * r1 * 16 + spur * 20) * Math.pow(k, 0.7) * (1 - k * 0.6) + r2 * r2 * 5 * k;
      // cliff bands: terrace the slope where a noise mask says so (crags with flat ledges of scree)
      const cm = sstep(-0.15, 0.1, g9fbm(x / 34 + 17, z / 34 - 3, 2)) * sstep(0.1, 0.35, k);
      if (cm > 0) { const st = 6, q = Math.floor(mh / st) * st, f = (mh - q) / st; mh = mh * (1 - cm) + (q + st * sstep(0.45, 0.7, f)) * cm; }
      // hidden hollow behind the summit (east side) for the castle
      const dhc = Math.hypot(x - HOL_C[0], z - HOL_C[1]);
      if (dhc < 24) { const fl = HOL_FLOOR + Math.max(0, dhc - 9) * 2.4; if (fl < mh) mh = fl * sstep(24, 16, dhc) + mh * (1 - sstep(24, 16, dhc)); }
      if (mh > h) { h = mh; mt = true; }
    }
    const glen = m > 0.98 && !mt ? r.glen : 0;
    return {h: Math.max(BASE + 4, Math.min(H - 5, Math.round(h))), glen, mMask: mt ? 1 : r.mMask * m, loch: r.loch && m > 0.98 && !mt};
  };
  const fs = g9findSpawn;
  g9findSpawn = function () {
    if (!g9Island) return fs.apply(this, arguments);
    const cx = ISL_C[0], cz = ISL_C[1];
    for (let r = 0; r < 100; r += 2) for (let a = 0; a < 16; a++) {
      const x = Math.round(cx + Math.cos(a / 16 * 6.283) * r), z = Math.round(cz + Math.sin(a / 16 * 6.283) * r);
      const t = g9top(x, z), b = getB(x, t, z);
      if ((b === T.GRASS || b === T.HEATHER) && t > SEA + 1 && getB(x, t + 1, z) === T.AIR && getB(x, t + 2, z) === T.AIR) return [x, t, z];
    }
    return fs.apply(this, arguments);
  };
  // castles: island castles stay on the island; a lit tower near the summit of the sea mountain
  const pc = g9PlaceCastles;
  g9PlaceCastles = function () {
    if (!g9Island) return pc.apply(this, arguments);
    const keep = castleAvoid;
    castleAvoid = keep.concat([{x0: MT_C[0] - MT_R - 30, x1: W + 40, z0: -40, z1: D + 40}, {x0: -40, x1: 52, z0: -40, z1: D + 40}, {x0: -40, x1: W + 40, z0: -40, z1: 100}, {x0: -40, x1: W + 40, z0: 348, z1: D + 40}]);
    let r; try { r = pc.apply(this, arguments); } finally { castleAvoid = keep; }
    mtPaint();
    const bx = HOL_C[0], bz = HOL_C[1], bh = g9top(bx, bz);
    try { buildCastle('towerhouse', bx, bz); } catch (e) { console.warn('peak castle', e); }
    // braziers in the hollow (torches on cobble posts) - their light pools in the bowl
    for (let a = 0; a < 10; a++) {
      const x = Math.round(bx + Math.cos(a / 10 * 6.283) * 13), z = Math.round(bz + Math.sin(a / 10 * 6.283) * 13);
      const t = g9top(x, z); if (t > 0 && t < H - 3 && world[idx(x, t + 1, z)] === T.AIR) { world[idx(x, t + 1, z)] = T.COBBLE; world[idx(x, t + 2, z)] = T.TORCH; }
    }
    peakCastle = [bx, bh, bz];
    g9castles.push(['peak', bx, bz]);
    return r;
  };
})();
// saves remember the island
(function () {
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); if (genVer === GEN9 && g9Island) d.island = 1; if (g9NoIsland) d.noIsland = 1; d.boats = boats.map(b => [+b.x.toFixed(2), +b.y.toFixed(2), +b.z.toFixed(2), +b.yaw.toFixed(3)]); return d; };
  const ap = applySave; applySave = function (d) { clearBoats(); const r = ap.apply(this, arguments); g9NoIsland = !!(d && d.noIsland); (d && d.boats || []).forEach(a => addBoat(a[0], a[1], a[2], a[3])); return r; };
  const ew = enterWorld;
  enterWorld = function (save) {
    g9Island = save ? !!(save.island && (!save.gen || save.gen === GEN9 || save.gen === 0)) : !!(current && current.mode !== 'creative');
    if (save && save.island) H = save.H || ISL_H;
    if (!save) g9NoIsland = false;
    const r = ew.apply(this, arguments);
    const after = () => { if (started && current && isGold(current) && genVer === GEN9 && !g9Island && !g9NoIsland && W >= 300) islandMigrate(); };
    if (r && r.then) r.then(() => setTimeout(after, 300)); else setTimeout(after, 300);
    return r;
  };
})();
async function islandMigrate() {
  if (islandMigrate.busy) return; islandMigrate.busy = true;
  try {
    const id = current.id, d0 = serialize(), bkey = 'backup_' + id + '_reset_island_' + Date.now().toString(36);
    try { await idbPut('worlds', bkey, Object.assign({}, d0, {backupOf: id, backedUp: Date.now(), noIsland: 1})); } catch (e) { console.warn('island backup failed', e); return; }
    migrBackupKey = bkey; current.resetBackup = bkey;
    const cur = world.slice(), oW = W, seed = gSeed; cityGen = true;
    if (seed) { gSeed = seed; G9P = g9perm(seed); genVer = GEN9; generate(); }
    cityGen = false;
    const base = world, pairs = [];
    if (base.length === cur.length) for (let i = 0; i < cur.length; i++) if (cur[i] !== base[i]) pairs.push(i, cur[i]);
    const d = Object.assign({}, d0, {edits: u32ToB64(new Uint32Array(pairs)), cityW: oW});
    g9Island = true;
    const info = cityBackMigrate(d);
    if (d.P) Object.assign(P, d.P); spawnPt = d.spawnPt || null;
    crops.clear(); (d.crops || []).forEach(([k, v]) => crops.set(k, v));
    chests.clear(); (d.chests || []).forEach(([k, v]) => chests.set(k, v));
    doorState.clear(); (d.doors || []).forEach(([k, v]) => doorState.set(k, v));
    furnaces.clear(); (d.furnaces || []).forEach(([k, v]) => furnaces.set(k, v));
    entMeta.clear(); (d.entMeta || []).forEach(([k, v]) => entMeta.set(k, v));
    genVer = GEN9; cityEdits = new Map();
    for (const [, o] of entObjs) scene.remove(o.g); entObjs.clear();
    mobs.slice().forEach(removeMob); for (let n = 0; n < 8; n++) spawnMob('sheep'); for (let n = 0; n < 10; n++) spawnMob('haggis');
    clearBoats();
    if (!spawnPt) { g9spawn = null; if (info && info.zones) P.y = g9top(Math.floor(P.x), Math.floor(P.z)) + 2; else spawnPlayer(); }
    P.vy = 0; dirtyAll = true; rebuild(); typeof scanLights === 'function' && scanLights();
    saveWorld(true);
    islandMigrate.info = info;
    toast('Your Gold world is now an island! ' + (info ? info.blocks : 0) + ' blocks of builds kept. Backup saved (Pause > Undo terrain reset).');
  } finally { islandMigrate.busy = false; }
}

/* ---------- Ultra view distance ---------- */
if (typeof SET.dist !== 'number') SET.dist = 0;
(function distUI() {
  const bob = document.getElementById('bobSeg'); if (!bob) return;
  const row = bob.closest('.set') || bob.parentNode;
  const el = document.createElement('div'); el.className = row.className;
  el.innerHTML = '<span>View distance</span><div class="seg" id="distSeg"><button data-dist="0" data-testid="settings-dist-normal">Normal</button><button data-dist="1" data-testid="settings-dist-far">Far</button><button data-dist="2" data-testid="settings-dist-ultra">Ultra</button></div>';
  row.parentNode.insertBefore(el, row.nextSibling);
  el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { SET.dist = Number(b.dataset.dist); saveSet(); syncSettingsUI(); }));
  const sync = syncSettingsUI; syncSettingsUI = function () { const r = sync.apply(this, arguments); el.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.dist) === SET.dist)); return r; };
  syncSettingsUI();
})();

/* ---------- Boats ---------- */
IT.BOAT = 173; NAMES[IT.BOAT] = 'Boat';
ICONS[IT.BOAT] = drawIcon(g => {
  g.fillStyle = '#8a5a2e'; g.strokeStyle = '#3e2810'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(-26, -4); g.lineTo(26, -4); g.lineTo(18, 12); g.lineTo(-18, 12); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#b07c45'; g.fillRect(-24, -8, 48, 5); g.strokeRect(-24, -8, 48, 5);
  g.strokeStyle = '#5a3a1a'; g.lineWidth = 1.2; for (const y of [1, 6]) { g.beginPath(); g.moveTo(-22 + (y - 1), y); g.lineTo(22 - (y - 1), y); g.stroke(); }
  g.strokeStyle = '#6b4a22'; g.lineWidth = 3; g.beginPath(); g.moveTo(-8, -20); g.lineTo(14, 10); g.stroke();
});
RECIPES.push(rc('Boat', '5 Planks', IT.BOAT, 1, [[T.PLANKS, 5]], 1));
if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(IT.BOAT);
var boats = [], riding = null, boatSnd = 0, boatExitLock = 0;
const boatMat = new THREE.MeshLambertMaterial({color: 0x9a6a3a}), boatMat2 = new THREE.MeshLambertMaterial({color: 0x6e4826});
function makeBoatMesh() {
  const g = new THREE.Group(), add = (w, h, d, x, y, z, m, ry) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); if (ry) o.rotation.y = ry; g.add(o); return o; };
  add(1.2, 0.1, 2.2, 0, 0.05, 0, boatMat2);
  add(0.1, 0.42, 2.2, -0.62, 0.26, 0, boatMat); add(0.1, 0.42, 2.2, 0.62, 0.26, 0, boatMat);
  add(1.34, 0.42, 0.1, 0, 0.26, 1.1, boatMat); add(1.0, 0.42, 0.1, 0, 0.26, -1.18, boatMat);
  add(0.7, 0.3, 0.14, -0.36, 0.38, -1.02, boatMat, 0.6); add(0.7, 0.3, 0.14, 0.36, 0.38, -1.02, boatMat, -0.6);
  add(1.2, 0.06, 0.32, 0, 0.3, 0.25, boatMat2);   // seat
  const oarL = add(0.06, 0.06, 1.6, -0.75, 0.42, 0.1, boatMat2), oarR = add(0.06, 0.06, 1.6, 0.75, 0.42, 0.1, boatMat2);
  oarL.rotation.x = oarR.rotation.x = 0.25; g.userData.oars = [oarL, oarR];
  return g;
}
function waterTopAt(x, z, y0) { const fx = Math.floor(x), fz = Math.floor(z); for (let y = Math.min(H - 2, Math.floor(y0) + 2); y > Math.floor(y0) - 4; y--) { const b = getB(fx, y, fz); if (b === T.WATER) return y; if (b !== T.AIR) return -1; } return -1; }
function addBoat(x, y, z, yaw) { const g = makeBoatMesh(); scene.add(g); const b = {g, x, y, z, yaw: yaw || 0, v: 0, t: Math.random() * 6}; boats.push(b); placeBoatMesh(b); return b; }
function placeBoatMesh(b) { b.g.position.set(b.x, b.y + Math.sin(b.t * 1.7) * 0.03, b.z); b.g.rotation.set(Math.sin(b.t * 1.3) * 0.02, b.yaw, Math.sin(b.t) * 0.035); }
function clearBoats() { boats.forEach(b => scene.remove(b.g)); boats = []; riding = null; }
function boatSplash(vol) {
  if (!AC || !noiseBuf) return;
  try {
    const s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500 + Math.random() * 400;
    const g = AC.createGain(), t = AC.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * SET.sfx * 0.5, t + 0.08); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 1.5, 0.7);
  } catch (_) {}
}
function boatLookedAt() {
  const d = lookDir(), o = [P.x, P.y + EYE, P.z]; let best = null, bt = 4.5;
  for (const b of boats) { const v = [b.x - o[0], b.y + 0.3 - o[1], b.z - o[2]]; const t = v[0] * d[0] + v[1] * d[1] + v[2] * d[2]; if (t < 0 || t > bt) continue;
    const q = Math.hypot(v[0] - d[0] * t, v[1] - d[1] * t, v[2] - d[2] * t); if (q < 1.15) { bt = t; best = b; } }
  return best;
}
function exitBoat() {
  const b = riding; if (!b) return; riding = null; boatExitLock = 0.4;
  // step out onto the nearest dry land if there is some, else just above the boat
  let spot = null;
  for (let r = 1; r <= 3 && !spot; r++) for (let a = 0; a < 12 && !spot; a++) { const x = Math.floor(b.x + Math.cos(a / 12 * 6.283) * r * 1.2), z = Math.floor(b.z + Math.sin(a / 12 * 6.283) * r * 1.2);
    for (let y = Math.floor(b.y) + 2; y >= Math.floor(b.y) - 1; y--) { const g = getB(x, y, z); if (g !== T.AIR && g !== T.WATER && !PLANT[g] && getB(x, y + 1, z) === T.AIR && getB(x, y + 2, z) === T.AIR) { spot = [x + 0.5, y + 1, z + 0.5]; break; } } }
  if (spot) { P.x = spot[0]; P.y = spot[1]; P.z = spot[2]; } else P.y = b.y + 1.1;
  P.vy = 0; P.fallTop = null; b.v = 0;
}
(function boatUse() {
  const ui = useItem;
  useItem = function () {
    if (riding) { exitBoat(); return; }
    const lb = boatLookedAt();
    if (lb) {
      if (sneakHeld) { scene.remove(lb.g); boats.splice(boats.indexOf(lb), 1); inv[IT.BOAT] = (inv[IT.BOAT] || 0) + 1; renderHotbar(); toast('Picked up the boat'); return; }
      riding = lb; P.yaw = lb.yaw; boatSplash(0.6); toast('In the boat: W/S or stick to row, A/D to turn, use or C to get out'); return;
    }
    if (selId === IT.BOAT) {
      const h = raycast(6, true, true);
      if (h && h.water) {
        const wt = waterTopAt(h.hit[0] + 0.5, h.hit[2] + 0.5, h.hit[1]);
        if (wt >= 0) {
          addBoat(h.hit[0] + 0.5, wt + 0.78, h.hit[2] + 0.5, P.yaw);
          if (!MODE.infinite) { inv[IT.BOAT]--; if (inv[IT.BOAT] <= 0) delete inv[IT.BOAT]; }
          renderHotbar(); boatSplash(0.8); return;
        }
      }
      toast('Boats go on water'); return;
    }
    return ui.apply(this, arguments);
  };
  const up = updatePlayer;
  updatePlayer = function (dt, mx, mz) {
    if (boatExitLock > 0) boatExitLock -= dt;
    for (const b of boats) { b.t += dt; if (b !== riding) placeBoatMesh(b); }
    if (!riding) return up.apply(this, arguments);
    const b = riding;
    if (sneakHeld && boatExitLock <= 0) { exitBoat(); return 0; }
    const sprintK = (sprintShift || sprintDbl || sprintTouch || sprintPad) ? 1.45 : 1;
    b.v += mz * 9 * sprintK * dt; b.v *= Math.max(0, 1 - dt * 0.75); b.v = Math.max(-3, Math.min(8 * sprintK, b.v));
    const turn = mx * 1.7 * dt * (b.v < -0.2 ? -1 : 1); b.yaw -= turn; P.yaw -= turn;
    const nx = b.x - Math.sin(b.yaw) * b.v * dt, nz = b.z - Math.cos(b.yaw) * b.v * dt;
    const ok = (x, z) => { for (const [ax, az] of [[0, 0], [0.55, 0.55], [-0.55, 0.55], [0.55, -0.55], [-0.55, -0.55]]) { const w = waterTopAt(x + ax, z + az, b.y); if (w < 0 || Math.abs(w + 0.78 - b.y) > 1.2) return false; } return x > 1 && z > 1 && x < W - 1 && z < D - 1; };
    if (ok(nx, nz)) { b.x = nx; b.z = nz; const w = waterTopAt(b.x, b.z, b.y); if (w >= 0) b.y += (w + 0.78 - b.y) * Math.min(1, dt * 4); }
    else { if (Math.abs(b.v) > 3) boatSplash(0.5); b.v *= -0.25; }
    placeBoatMesh(b);
    const oars = b.g.userData.oars, sp = Math.abs(b.v); b.op = (b.op || 0) + dt * (1.5 + sp * 0.8) * (sp > 0.3 ? 1 : 0);
    oars[0].rotation.y = Math.sin(b.op) * 0.6; oars[1].rotation.y = -Math.sin(b.op) * 0.6;
    boatSnd -= dt * (0.6 + sp * 0.35); if (sp > 0.4 && boatSnd <= 0) { boatSnd = 1; boatSplash(Math.min(1, 0.25 + sp / 9)); }
    P.x = b.x; P.z = b.z; P.y = b.y - 0.1; P.vy = 0; P.onGround = true; P.fallTop = null; swimming = false;
    return sp * dt;
  };
})();

/* ---------- v0.9.8: Scottish mountain dressing ---------- */
function mtPaint() {
  const x0 = MT_C[0] - MT_R - 14, x1 = Math.min(W - 1, MT_C[0] + MT_R + 14), z0 = MT_C[1] - MT_R - 14, z1 = MT_C[1] + MT_R + 14;
  const hA = (x, z) => g9cols[(x * D + z) * 2], hs = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ gSeed; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  for (let x = Math.max(1, x0); x < x1; x++) for (let z = Math.max(1, z0); z < Math.min(D - 1, z1); z++) {
    if (Math.hypot(x - MT_C[0], z - MT_C[1]) > MT_R * 1.25) continue;
    const h = hA(x, z); if (h <= SEA + 1) continue;
    const sl = Math.max(Math.abs(hA(x + 1, z) - hA(x - 1, z)), Math.abs(hA(x, z + 1) - hA(x, z - 1))), y = h - 1, r = hs(x, 7, z);
    const snowLine = H - 40 + g9fbm(x / 9, z / 9, 2) * 5;
    let top, sub = T.DIRT;
    if (y > snowLine && sl <= 5) { top = T.WOOL; sub = T.STONE; }
    else if (sl >= 5) { top = r < 0.12 ? T.COBBLE : T.STONE; sub = T.STONE; }                          // crag
    else if (y > snowLine && sl <= 3) { top = T.WOOL; sub = T.STONE; }                                // snow cap
    else if (y > snowLine - 14) { top = sl >= 3 ? (r < 0.3 ? T.COBBLE : T.STONE) : r < 0.3 ? T.COBBLE : T.HEATHER; sub = T.STONE; }  // scree + high heather
    else if (sl >= 3) { top = r < 0.25 ? T.COBBLE : r < 0.55 ? T.STONE : T.HEATHER; sub = T.STONE; }
    else if (y > SEA + 22) top = r < 0.55 ? T.HEATHER : T.GRASS;
    else top = r < 0.25 ? T.HEATHER : T.GRASS;
    if (world[idx(x, y, z)] !== T.AIR) world[idx(x, y, z)] = top;
    for (let d = 1; d <= 3; d++) if (y - d > 0 && world[idx(x, y - d, z)] !== T.AIR && world[idx(x, y - d, z)] !== T.WATER) world[idx(x, y - d, z)] = sub;
    if (top === T.GRASS && r > 0.93 && world[idx(x, y + 1, z)] === T.AIR) world[idx(x, y + 1, z)] = T.TALLGRASS;
  }
  // waterfall: a spring high on the west face, falling steepest-down to the sea (cut 1 block into the slope)
  let x = MT_C[0] - 16, z = MT_C[1] + 6, guard = 0;
  while (guard++ < 200) {
    const h = hA(x, z); if (h <= SEA + 1) break;
    world[idx(x, h - 1, z)] = T.WATER; for (let y = h; y < h + 3 && y < H - 1; y++) world[idx(x, y, z)] = T.AIR;
    if (world[idx(x + 1, h - 1, z)] !== T.AIR && hA(x + 1, z) <= h + 3) world[idx(x + 1, h - 1, z)] = T.STONE;
    let bx = x - 1, bz = z, bh = 1e9;
    for (const [dx, dz] of [[-1, 0], [0, 1], [0, -1], [-1, 1], [-1, -1]]) { const hh = hA(x + dx, z + dz) + (dx === 0 ? 0.6 : 0); if (hh < bh) { bh = hh; bx = x + dx; bz = z + dz; } }
    x = bx; z = bz;
  }
  // stalkers' path: cobble steps zig-zagging up the south-west shoulder towards the hollow
  let px = MT_C[0] - MT_R + 6, pz = MT_C[1] - 26, dir = 1; guard = 0;
  while (guard++ < 400) {
    const h = hA(px, pz); if (Math.hypot(px - HOL_C[0], pz - HOL_C[1]) < 12) break;
    for (const w of [0, 1]) { const zz = pz + w; const hh = hA(px, zz); if (hh > SEA + 1 && world[idx(px, hh - 1, zz)] !== T.WATER) world[idx(px, hh - 1, zz)] = hs(px, 3, zz) < 0.7 ? T.COBBLE : T.STONE; }
    const tx = HOL_C[0] - px, tz = HOL_C[1] - pz;
    if (guard % 14 === 0) dir = -dir;
    if (Math.abs(tx) > Math.abs(tz) * 0.7 && guard % 3 !== 0) px += Math.sign(tx); else pz += dir > 0 ? Math.sign(tz) || 1 : -(Math.sign(tz) || 1) * (guard % 2);
    px = Math.max(1, Math.min(W - 2, px)); pz = Math.max(1, Math.min(D - 2, pz));
  }
}
// warm halo over the hidden hollow at night (one additive sprite; cheap)
function ensureHalo() {
  if (!g9Island || !peakCastle) { if (mtHalo) mtHalo.visible = false; return; }
  if (!mtHalo) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,200,120,0.9)'); gr.addColorStop(0.25, 'rgba(255,150,60,0.45)'); gr.addColorStop(0.6, 'rgba(200,90,30,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    mtHalo = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false, transparent: true}));
    mtHalo.scale.set(110, 70, 1); mtHalo.renderOrder = 5; scene.add(mtHalo);
  }
  mtHalo.position.set(peakCastle[0] + 0.5, peakCastle[1] + 30, peakCastle[2] + 0.5);
  const night = 1 - daylight, flick = 0.85 + Math.sin(performance.now() / 700) * 0.08 + Math.sin(performance.now() / 233) * 0.04;
  mtHalo.material.opacity = Math.min(1, Math.max(0, night - 0.1) * 1.3) * flick; mtHalo.visible = mtHalo.material.opacity > 0.02;
}
(function () {
  const us = updateSky; updateSky = function () { const r = us.apply(this, arguments); try { ensureHalo(); } catch (_) {} return r; };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); if (peakCastle && g9Island) d.peakCastle = peakCastle; return d; };
  const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); peakCastle = d && d.peakCastle || (d && d.island ? [HOL_C[0], HOL_FLOOR, HOL_C[1]] : null); return r; };
})();
