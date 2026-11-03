/* ===================== GLX-C5: held tools turned the right way, photo-sampled materials, joined hand, rain under roofs, Reset Terrain ===================== */
(function photoMats() {
  const L = new THREE.TextureLoader(), T9 = {};
  for (const k in PHOTO_TEX) { const t = L.load(PHOTO_TEX[k]); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; T9[k] = t; }
  photoMats.T = T9;
  // smooth photo wood on every handle
  const X = toolX(); X.pale.map = T9.ph_wood; X.pale.color.setHex(0xffffff); X.pale.needsUpdate = true;
  X.dark.map = T9.ph_grip; X.dark.color.setHex(0xd8c8c0); X.dark.needsUpdate = true; X.grip.map = T9.ph_grip; X.grip.color.setHex(0xb0a098); X.grip.needsUpdate = true;
  handleMat.map = T9.ph_wood; handleMat.color.setHex(0xe8d8c8); handleMat.needsUpdate = true; wrapMat.map = T9.ph_grip; wrapMat.needsUpdate = true;
  const hm = headMatFor;
  headMatFor = function (mat) {
    const m = hm.apply(this, arguments);
    if (mat === 'iron') { m.map = T9.ph_steel; m.color.setHex(0xe6e8ec); }
    else if (mat === 'gold') { m.map = T9.ph_steel; m.color.setHex(0xffc94a); }
    else if (mat === 'diamond') { m.map = T9.ph_steel; m.color.setHex(0x8ff0ea); }
    else if (mat === 'wood') { m.map = T9.ph_wood; m.color.setHex(0xc89a6a); }
    else if (mat === 'stone') { m.map = T9.ph_worn; m.color.setHex(0xb8b4ae); }
    m.needsUpdate = true; return m;
  };
  // flat parts (blades, heads): UVs spread once over the part instead of tiling at shape units
  const ex = extrude;
  extrude = function (pts) {
    const g = ex.apply(this, arguments), uv = g.attributes.uv, p = g.attributes.position;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const sx = 1 / Math.max(1e-4, x1 - x0), sy = 1 / Math.max(1e-4, y1 - y0);
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - x0) * sx, (p.getY(i) - y0) * sy);
    uv.needsUpdate = true; return g;
  };
  // rebuild cached held models with the new materials
  if (typeof heldId !== 'undefined' && heldId) { const id = heldId; try { heldId = -1; setHeld(id); } catch (_) {} }
})();
// pick / axe / hoe / shovel: turn the head 180 degrees so it points ahead and up-left, like Minecraft first person
(function () {
  const base = setHeld;
  setHeld = function (id) {
    base.apply(this, arguments);
    const h = held.children[0];
    if (h && h.userData.tool) { const turn = h.children[0], tool = turn && turn.children[0]; if (turn && !(tool && tool.userData.sword)) turn.rotation.y = -Math.PI / 2; }
  };
})();
// the hand is part of the arm: a smooth wrist/forearm bridge from the sleeve to the gripping hand, re-fitted every frame
(function wristBridge() {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 16, 1, true);
  const br = new THREE.Mesh(geo, armMat); armPivot.add(br);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), armMat); armPivot.add(cap);
  armMat.color.setHex(0xd8956c); if (armMat.isMeshLambertMaterial) { /* smooth shading is the default */ }
  const a = new THREE.Vector3(), b = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
  const uh = updateHand;
  updateHand = function () {
    const r = uh.apply(this, arguments);
    try {
      if (!gripHand || !gripHand.parent || !realArm.fa || !armPivot.visible) { br.visible = cap.visible = false; return r; }
      armPivot.updateMatrixWorld(true);
      // forearm tip (inside the sleeve's cuff, arm space) and the hand's wrist (hand space) -> armPivot space
      a.set(0.02, -0.03, 0.0); realArm.fa.localToWorld(a); armPivot.worldToLocal(a);
      b.set(0.06, -0.012, 0.05); gripHand.localToWorld(b); armPivot.worldToLocal(b);
      const len = a.distanceTo(b); br.visible = cap.visible = len > 0.002;
      br.position.copy(a).add(b).multiplyScalar(0.5); q.setFromUnitVectors(up, b.clone().sub(a).normalize()); br.quaternion.copy(q);
      const s = gripHand.parent === armPivot ? 0.042 : 0.036; br.scale.set(s, len, s);
      cap.position.copy(b); cap.scale.setScalar(s * 1.05);
    } catch (_) {}
    return r;
  };
})();
// ---- rain: no drops inside covered spaces (every drop checks its column's roof), muffled audio + soft roof patter when you're under cover ----
var rainCover = 0, rainLP = null, roofOut = null, roofT = 0;
(function rainUnderRoofs() {
  const tops = new Map(); let topsT = 0;
  const topAt = (x, z) => { const k = x * 4096 + z; let v = tops.get(k); if (v === undefined) { v = colTop(x, z); tops.set(k, v); } return v; };
  const covered = () => { const x = Math.floor(P.x), z = Math.floor(P.z), y0 = Math.floor(P.y + 1.7); if (x < 0 || z < 0 || x >= W || z >= D) return false; for (let y = y0; y < Math.min(H, y0 + 40); y++) if (solid(x, y, z)) return true; return false; };
  updateRain = function (dt) {
    const w = WEATHER[weather.type], n = w.drops, now = performance.now();
    if (now - topsT > 400) { tops.clear(); topsT = now; }
    // under-roof detection, eased so it fades rather than snapping
    const cov = n && caveK < 0.6 && covered() ? 1 : 0; rainCover += (cov - rainCover) * Math.min(1, dt * 3);
    if (rainGain) {
      rainGain.gain.value = n ? (weather.type === 'light' ? 0.12 : 0.3) * Math.min(1, weather.dark / Math.max(.01, w.dark)) : Math.max(0, rainGain.gain.value - dt * 0.2);
      rainGain.gain.value *= (1 - caveK) * (1 - 0.45 * rainCover);
      if (!rainLP && AC) { try { rainLP = AC.createBiquadFilter(); rainLP.type = 'lowpass'; rainLP.Q.value = 0.5; rainGain.disconnect(); rainGain.connect(rainLP); rainLP.connect(master); roofOut = AC.createGain(); roofOut.gain.value = 1; roofOut.connect(master); } catch (_) { rainLP = null; } }
      if (rainLP) rainLP.frequency.setTargetAtTime(9000 - 8400 * rainCover, AC.currentTime, 0.15);
      // soft, irregular droplets tapping on the roof above you
      if (roofOut && rainCover > 0.05 && n) {
        roofT -= dt; const heavy = weather.type === 'light' ? 0.5 : 1;
        while (roofT < 0) { roofT += (0.025 + Math.random() * 0.07) / heavy; const t = AC.currentTime + Math.random() * 0.05;
          grain(t, 900 + Math.random() * 2600, 2.5 + Math.random() * 3, 0.02 + Math.random() * 0.05, (0.004 + Math.random() * 0.012) * rainCover * heavy * SET.sfx, roofOut, 'bandpass');
          if (Math.random() < 0.08) grain(t + 0.01, 300 + Math.random() * 200, 1.2, 0.12, 0.006 * rainCover * heavy, roofOut, 'lowpass'); }
      }
    }
    if (!n || caveK > 0.6) { rainLines.visible = false; return; }
    rainLines.visible = true;
    const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z, len = weather.type === 'light' ? 0.45 : 0.75;
    let m = 0;
    for (let i = 0; i < n; i++) {
      const j = i * 3;
      let x = rainXYZ[j], y = rainXYZ[j + 1] - w.speed * dt, z = rainXYZ[j + 2];
      let top = topAt(Math.floor(cx + x), Math.floor(cz + z));
      if (y + cy < -2 || y + cy < top) {
        // respawn above the cover of its new column (never inside a room)
        for (let tries = 0; tries < 4; tries++) { x = Math.random() * 36 - 18; z = Math.random() * 36 - 18; y = 10 + Math.random() * 8; top = topAt(Math.floor(cx + x), Math.floor(cz + z)); if (y + cy > top) break; }
      }
      rainXYZ[j] = x; rainXYZ[j + 1] = y; rainXYZ[j + 2] = z;
      if (y + cy < top) continue;   // still under something: don't draw it
      const k = m * 6; m++;
      rainPos[k] = cx + x; rainPos[k + 1] = cy + y; rainPos[k + 2] = cz + z;
      rainPos[k + 3] = cx + x - 0.05; rainPos[k + 4] = Math.max(cy + y, cy + y + len); rainPos[k + 5] = cz + z;
    }
    rainGeo.setDrawRange(0, m * 2);
    rainGeo.attributes.position.needsUpdate = true;
  };
})();
// ---- Reset Terrain (pause menu): backup, fresh land from the world's generator, your builds + inventory carried over ----
async function resetTerrain() {
  if (!started || !current) return;
  if (!confirm('Reset the terrain of "' + current.name + '"?\n\nA backup is saved first. The land is regenerated fresh and your builds, inventory, armour and chests are carried over.')) return;
  const id = current.id, d0 = serialize(), bkey = 'backup_' + id + '_reset_' + Date.now().toString(36);
  try { await idbPut('worlds', bkey, Object.assign({}, d0, {backupOf: id, backedUp: Date.now()})); } catch (e) { toast('Backup failed - terrain not reset'); return; }
  migrBackupKey = bkey;
  if (genVer === GEN11 || genVer === 12) { c1Fill(0, W, 0, D); c1Doors(0, W, 0, D); dirtyAll = true; rebuild(); saveWorld(true); toast('Terrain refreshed from the map (your edits kept). Backup saved.'); return; }
  if (genVer === GEN10) { toast('Open this world once to move it to the Highlands first'); return; }
  // Highlands / older: find what the player changed by regenerating the same seed, then move those builds onto fresh land
  const cur = world.slice(), oW = W, seed = gSeed;
  const keepVer = genVer; cityGen = true;
  if (keepVer >= GEN9 && seed) { gSeed = seed; G9P = g9perm(seed); genVer = GEN9; generate(); } else { generate(); placeTrees && placeTrees(); placeDecor && placeDecor(); }
  cityGen = false;
  const base = world; const pairs = [];
  if (base.length === cur.length) for (let i = 0; i < cur.length; i++) if (cur[i] !== base[i]) pairs.push(i, cur[i]);
  const e = new Uint32Array(pairs);
  const d = Object.assign({}, d0, {edits: u32ToB64(e), cityW: oW});
  const info = cityBackMigrate(d);   // builds zones from the changed blocks, makes new land with a fresh seed, lays every change back exactly
  if (d.P) Object.assign(P, d.P); spawnPt = d.spawnPt || null;
  crops.clear(); (d.crops || []).forEach(([k, v]) => crops.set(k, v));
  chests.clear(); (d.chests || []).forEach(([k, v]) => chests.set(k, v));
  doorState.clear(); (d.doors || []).forEach(([k, v]) => doorState.set(k, v));
  furnaces.clear(); (d.furnaces || []).forEach(([k, v]) => furnaces.set(k, v));
  entMeta.clear(); (d.entMeta || []).forEach(([k, v]) => entMeta.set(k, v));
  genVer = GEN9; cityEdits = new Map();
  for (const [, o] of entObjs) scene.remove(o.g); entObjs.clear();
  mobs.slice().forEach(removeMob); for (let n = 0; n < 8; n++) spawnMob('sheep'); for (let n = 0; n < 10; n++) spawnMob('haggis');
  if (!spawnPt) { g9spawn = null; if (info && info.zones) { P.y = g9top(Math.floor(P.x), Math.floor(P.z)) + 2; } else spawnPlayer(); }
  P.vy = 0; dirtyAll = true; rebuild();
  saveWorld(true);
  setPause && setPause(false);
  toast('Fresh terrain! ' + (info ? info.blocks : 0) + ' blocks of your builds carried over. Backup saved.');
}
(function resetBtn() {
  const sq = $('saveQuit'); if (!sq || $('resetTerrainBtn')) return;
  const b = document.createElement('button'); b.className = 'btn alt'; b.id = 'resetTerrainBtn'; b.setAttribute('data-testid', 'pause-reset-terrain-button'); b.textContent = 'Reset terrain';
  b.addEventListener('click', () => { resetTerrain(); });
  sq.parentNode.insertBefore(b, sq.nextSibling);
})();
