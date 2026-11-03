/* ===================== GLX-D1 (v0.9.5): stairs, MC doors (edge, hinge, double doors, thin collision), copper door, tartan bed ===================== */
var STAIRS = {164: [T.PLANKS, 'Oak stairs'], 165: [T.COBBLE, 'Cobblestone stairs'], 166: [T.STONE, 'Stone stairs'], 167: [T.STONEBRICK, 'Stone brick stairs'], 168: [T.SANDSTONE, 'Sandstone stairs'], 169: [T.BRICK, 'Brick stairs']};
var IS_STAIR = new Uint8Array(256);
IT.COPPERDOOR = 170;
(function stairBlocks() {
  for (const k in STAIRS) {
    const id = +k, b = STAIRS[k][0]; IS_STAIR[id] = 1;
    NAMES[id] = STAIRS[k][1]; FACES[id] = FACES[b]; delete ICON_KEY[id]; BLOCK_MATS[id] = BLOCK_MATS[b];
    HARD[id] = HARD[b]; if (typeof MC_HARD !== 'undefined') MC_HARD[id] = MC_HARD[b]; REQ[id] = REQ[b]; if (NEEDS_PICK.has(b)) NEEDS_PICK.add(id);
    PLACEABLE.add(id); ORDER.push(id); ENT[id] = 1; if (typeof chunkST !== 'undefined' && chunkST) chunkST[id] = 1;
    if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(id)) CREATIVE_ALL.push(id);
    RECIPES.push(rc(STAIRS[k][1], '6 ' + NAMES[b], id, 4, [[b, 6]], 1));
  }
  NAMES[IT.COPPERDOOR] = 'Copper door'; PLACEABLE.add(IT.COPPERDOOR); ORDER.push(IT.COPPERDOOR);
  if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(IT.COPPERDOOR);
  RECIPES.push(rc('Copper door', '6 Copper ingots', IT.COPPERDOOR, 1, [[IT.COPPERINGOT, 6]], 1));
  // stair icon: the block's texture cut into two steps
  const mk = () => { let left = 0; for (const k in STAIRS) { const id = +k; if (ICONS[id]) continue; const b = STAIRS[k][0]; let key = ICON_KEY[b] || FACES[b]; if (Array.isArray(key)) key = key[0]; const img = texImg[key];
    if (!img || !img.width) { left++; continue; } const im = img; ICONS[id] = 'pending'; (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.save(); g.beginPath(); g.moveTo(8, 120); g.lineTo(8, 64); g.lineTo(64, 64); g.lineTo(64, 8); g.lineTo(120, 8); g.lineTo(120, 120); g.closePath(); g.clip(); g.drawImage(im, 0, 0, 128, 128); g.restore();
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 120); g.lineTo(8, 64); g.lineTo(64, 64); g.lineTo(64, 8); g.lineTo(120, 8); g.lineTo(120, 120); g.closePath(); g.stroke();
    ICONS[id] = c.toDataURL(); try { renderHotbar(); } catch (_) {} })(); } return left; };
  const iv = setInterval(() => { if (!mk()) clearInterval(iv); }, 500);
  ICONS[IT.COPPERDOOR] = drawIcon(g => { g.fillStyle = '#c8703f'; g.strokeStyle = '#4a2410'; g.lineWidth = 2; g.fillRect(-14, -28, 28, 56); g.strokeRect(-14, -28, 28, 56);
    g.fillStyle = '#e8a070'; g.fillRect(-10, -24, 9, 20); g.fillRect(1, -24, 9, 20); g.fillStyle = '#9a4a24'; g.fillRect(-10, 2, 20, 22); g.fillStyle = '#2a1a10'; g.fillRect(6, -2, 4, 4); });
})();
setInterval(() => { if (chunkST) for (const k in STAIRS) chunkST[+k] = 1; }, 300);
// ---------- shapes for collision: stairs (half step + back half) and doors (a 3/16 slab on one edge) ----------
function stairFace(x, y, z) { const m = entMeta.get(keyOf(x, y, z)); return m ? m.face : 0; }
function toLocal(px, pz, x, z, f) { const a = f * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), wx = px - x - 0.5, wz = pz - z - 0.5; return [wx * c - wz * s, wx * s + wz * c]; }
function shapeHit(b, x, y, z, px, py, pz) {
  if (IS_STAIR[b]) { if (py - y < 0.5) return true; const [, lz] = toLocal(px, pz, x, z, stairFace(x, y, z)); return lz < 0; }
  if (b === T.DOOR || b === T.DOORTOP) {
    const ly = b === T.DOOR ? y : y - 1, m = entMeta.get(keyOf(x, ly, z)) || {face: 0}, open = doorOpenAt(x, ly, z);
    const [lx, lz] = toLocal(px, pz, x, z, m.face || 0);
    if (!open) return lz > 0.31;
    return m.hinge ? lx > 0.31 : lx < -0.31;
  }
  return null;
}
collides = function (x, y, z) {
  for (const dx of [-R, 0, R]) for (const dz of [-R, 0, R]) for (const dy of [0.01, 0.5, 0.9, HEIGHT - 0.01]) {
    const px = x + dx, py = y + dy, pz = z + dz, bx = Math.floor(px), by = Math.floor(py), bz = Math.floor(pz);
    if (bx >= 0 && bz >= 0 && bx < W && bz < D && by >= 0 && by < H) {
      const b = world[idx(bx, by, bz)];
      if (IS_STAIR[b] || b === T.DOOR || b === T.DOORTOP) { if (shapeHit(b, bx, by, bz, px, py, pz)) return true; continue; }
    }
    if (solid(bx, by, bz)) return true;
  }
  return false;
};
// walk up half steps: if blocked but free half a block higher (and standing), step up
(function () {
  const ma = moveAxis;
  moveAxis = function (dx, dz) {
    const ox = P.x, oz = P.z; ma.apply(this, arguments);
    const blocked = (dx && P.x === ox) || (dz && P.z === oz);
    if (blocked && P.onGround && !flying) {
      const nx = P.x + (dx || 0), nz = P.z + (dz || 0);
      if (collides(nx, P.y, nz) && !collides(nx, P.y + 0.51, nz) && !collides(P.x, P.y + 0.51, P.z)) { P.y += 0.51; P.x = nx; P.z = nz; stepFrom = -0.5; stepT = 0; }
    }
  };
  const my = moveY;
  moveY = function (dt) {
    if (P.vy <= 0) { const ry = Math.round(P.y * 2) / 2; if (ry !== Math.round(P.y) && Math.abs(P.y - ry) < 0.06 && collides(P.x, ry - 0.03, P.z) && !collides(P.x, ry + 0.001, P.z)) { P.y = ry + 0.001; P.vy = 0; P.onGround = true; groundT = 0.1; P.fallTop = null; return; } }
    return my.apply(this, arguments);
  };
})();
// ---------- stair meshes (two boxes each), merged per chunk ----------
(function stairMesh() {
  const box = (A, x0, y0, z0, x1, y1, z1) => {
    const F = [[[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]],
      [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]]];
    for (let d = 0; d < 6; d++) { const f = F[d], b = A.pos.length / 3; for (let v = 0; v < 4; v++) { A.pos.push(...f[v]); A.nor.push(...f[4]);
      const p = f[v], u = d < 2 ? p[2] : p[0], w = d === 2 || d === 3 ? p[2] : p[1]; A.uv.push(u - Math.floor(Math.min(x0, z0)), w - Math.floor(y0)); }
      A.ind.push(b, b + 1, b + 2, b, b + 2, b + 3); A.grp.push(d); }
  };
  const bc = buildChunk;
  buildChunk = function (cx, cz) {
    const r = bc.apply(this, arguments), id = cx * 64 + cz, L = chunkLists.get(id), grp = chunkObjs.get(id);
    if (!L || !grp) return r;
    for (const k in STAIRS) { const a = L[k]; if (!a || !a.length) continue;
      const A = {pos: [], nor: [], uv: [], ind: [], grp: []};
      for (let i = 0; i < a.length; i += 3) {
        const x = a[i], y = a[i + 1], z = a[i + 2], f = stairFace(x, y, z);
        box(A, x, y, z, x + 1, y + 0.5, z + 1);
        // back half (local -z) rotated by face
        const q = [[x, z, x + 1, z + 0.5], [x, z, x + 0.5, z + 1], [x, z + 0.5, x + 1, z + 1], [x + 0.5, z, x + 1, z + 1]][f === 0 ? 0 : f === 1 ? 1 : f === 2 ? 2 : 3];
        box(A, q[0], y + 0.5, q[1], q[2], y + 1, q[3]);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(A.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(A.nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(A.uv, 2)); g.setIndex(A.ind);
      const mm = BLOCK_MATS[k]; if (Array.isArray(mm)) { let s0 = 0; for (const d of A.grp) { g.addGroup(s0, 6, d); s0 += 6; } }
      g.computeBoundingSphere(); grp.add(new THREE.Mesh(g, mm));
    }
    return r;
  };
})();
// ---------- placing stairs / doors like Minecraft ----------
var placeCtx = null;
(function () {
  const sb = setB;
  setB = function (x, y, z, v) { const r = sb.apply(this, arguments); if (placeCtx && (v === T.DOOR || IS_STAIR[v])) placeCtx.placed = [x, y, z, v]; return r; };
  const ui = useItem;
  useItem = function () {
    let swap = null;
    if (selId === IT.COPPERDOOR && (inv[IT.COPPERDOOR] > 0 || MODE.infinite)) { swap = {sel: selId, door: inv[T.DOOR] || 0, cop: inv[IT.COPPERDOOR] || 0}; selId = T.DOOR; inv[T.DOOR] = 1; }
    const r0 = raycast(5, true);
    placeCtx = {r: r0};
    let out; try { out = ui.apply(this, arguments); } finally {
      const pc = placeCtx; placeCtx = null;
      if (swap) { const used = inv[T.DOOR] === 0 || (pc && pc.placed); selId = swap.sel; inv[T.DOOR] = swap.door; inv[IT.COPPERDOOR] = swap.cop - (used && !MODE.infinite ? 1 : 0); try { renderHotbar(); } catch (_) {} }
      if (pc && pc.placed) {
        const [x, y, z, v] = pc.placed, k = keyOf(x, y, z), f = faceFromYaw(), m = entMeta.get(k) || {face: f};
        if (IS_STAIR[v]) { entMeta.set(k, {face: f}); dirtyAround(x, z); }
        if (v === T.DOOR) {
          const a = f * Math.PI / 2, lx = -Math.cos(a), lz = Math.sin(a);   // the player's left
          const left = entMeta.get(keyOf(x + Math.round(lx), y, z + Math.round(lz))), right = entMeta.get(keyOf(x - Math.round(lx), y, z - Math.round(lz)));
          const isDoorL = getB(x + Math.round(lx), y, z + Math.round(lz)) === T.DOOR && left && left.face === f && !left.hinge;
          const isDoorR = getB(x - Math.round(lx), y, z - Math.round(lz)) === T.DOOR && right && right.face === f && right.hinge;
          let hinge = 0;
          if (isDoorL) hinge = 1; else if (isDoorR) hinge = 0;
          else if (pc.r) { const d = lookDir(), t = pc.r.t, hx = P.x + d[0] * t, hz = P.z + d[2] * t; const [hlx] = toLocal(hx, hz, x, z, f); hinge = hlx > 0 ? 1 : 0; }
          m.face = f; m.hinge = hinge; if (swap) m.mat = 'copper'; entMeta.set(k, m);
          const o = entObjs.get(k); if (o) { scene.remove(o.g); entObjs.delete(k); } rebuild._unloaded = true; rebuild();
        }
      }
    }
    return out;
  };
})();
function dirtyAround(x, z) { const cx = Math.floor(x / CH), cz = Math.floor(z / CH); dirtyCh.add(cx * 64 + cz); }
// door model: on the near edge of its block, hinge left/right, copper or wood, swings away from you
(function () {
  const be = buildEnt;
  buildEnt = function (type, x, y, z) {
    const o = be.apply(this, arguments);
    if (type === T.DOOR && o.pivot) {
      const m = entMeta.get(keyOf(x, y, z)) || {};
      o.pivot.position.z = 0.41; o.hs = 1;
      if (m.hinge) { o.pivot.position.x = 0.5; o.pivot.children[0].position.x = -0.5; o.hs = -1; }
      if (m.mat === 'copper') { const pm = o.pivot.children[0]; pm.material = pm.material.map(mm => { const c = mm.clone(); c.color = new THREE.Color(0xd9844a); if (c.isMeshLambertMaterial) c.emissive = new THREE.Color(0x1a0a02); return c; }); o.copper = true; }
    }
    return o;
  };
  const ue = updateEntities;
  updateEntities = function (dt) { const r = ue.apply(this, arguments); for (const o of entObjs.values()) if (o.type === T.DOOR && o.pivot && o.hs === -1) o.pivot.rotation.y = -o.open * Math.PI / 2; return r; };
  // breaking a copper door gives the copper door back
  const df = dropsFor;
  dropsFor = function (b) { if ((b === T.DOOR || b === T.DOORTOP) && dropsFor.ctx && dropsFor.ctx.mat === 'copper') return [[IT.COPPERDOOR, 1]]; return df.apply(this, arguments); };
  const pb = popBlock;
  popBlock = function (x, y, z) { const b = getB(x, y, z); if (b === T.DOOR || b === T.DOORTOP) { const ly = b === T.DOORTOP ? y - 1 : y; dropsFor.ctx = entMeta.get(keyOf(x, ly, z)); } try { return pb.apply(this, arguments); } finally { dropsFor.ctx = null; } };
  const td = toggleDoor;
  toggleDoor = function (x, y, z) { const r = td.apply(this, arguments); const ly = getB(x, y, z) === T.DOORTOP ? y - 1 : y, m = entMeta.get(keyOf(x, ly, z)) || {};
    // double doors open together
    const f = m.face || 0, a = f * Math.PI / 2, lx = Math.round(-Math.cos(a)), lz = Math.round(Math.sin(a)), s = m.hinge ? 1 : -1;
    const nx = x + lx * s, nz = z + lz * s, n = entMeta.get(keyOf(nx, ly, nz));
    if (getB(nx, ly, nz) === T.DOOR && n && n.face === f && !!n.hinge !== !!m.hinge) doorState.set(keyOf(nx, ly, nz), doorState.get(keyOf(x, ly, z)));
    return r; };
})();
// ---------- tartan bed ----------
function bedTartanTex(base, lines) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  const sett = lines; // [color, offset, width]
  g.globalAlpha = 0.62; for (const [col, o, w] of sett) { g.fillStyle = col; for (let r = 0; r < 256; r += 128) { g.fillRect(o + r, 0, w, 256); } }
  g.globalAlpha = 0.5; for (const [col, o, w] of sett) { g.fillStyle = col; for (let r = 0; r < 256; r += 128) { g.fillRect(0, o + r, 256, w); } }
  // twill: diagonal weave
  g.globalAlpha = 0.12; g.fillStyle = '#000'; for (let i = -256; i < 256; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.lineTo(i + 258, 256); g.lineTo(i + 2, 0); g.fill(); }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
(function () {
  const bb = buildBed;
  buildBed = function () {
    const r = bb.apply(this, arguments);
    if (bedMats && !bedMats.tartan) {
      bedMats.tartan = true;
      bedMats.blanket.map = bedTartanTex('#b01c22', [['#0b3d1e', 8, 26], ['#0e2a5a', 44, 14], ['#0b0b0b', 66, 4], ['#f2d43a', 84, 3], ['#ffffff', 100, 2], ['#0b3d1e', 108, 10]]);
      bedMats.blanket.color.setHex(0xffffff); bedMats.blanket.needsUpdate = true;
      bedMats.trim.map = bedTartanTex('#5a0e12', [['#0b2a16', 10, 20], ['#0a1a3a', 50, 10]]); bedMats.trim.color.setHex(0xffffff); bedMats.trim.needsUpdate = true;
    }
    return r;
  };
})();
// ---------- Restore button for Reset Terrain backups (pause menu) ----------
(function restoreBtn() {
  const rt = $('resetTerrainBtn'); if (!rt || $('restoreTerrainBtn')) return;
  const b = document.createElement('button'); b.className = 'btn alt'; b.id = 'restoreTerrainBtn'; b.setAttribute('data-testid', 'pause-restore-terrain-button'); b.textContent = 'Undo terrain reset';
  b.style.display = 'none';
  b.addEventListener('click', async () => {
    const key = current && (current.resetBackup || migrBackupKey); if (!key) return;
    if (!confirm('Restore this world to how it was before the terrain reset?')) return;
    const d = await idbGet('worlds', key); if (!d) { toast('Backup not found'); return; }
    const c = Object.assign({}, d); delete c.backupOf; delete c.backedUp; c.noMigrate = true;
    await idbPut('worlds', current.id, c); toast('Restored. Reopening the world...');
    try { setPause(false); } catch (_) {} started = false; setTimeout(() => enterWorld(c), 50);
  });
  rt.parentNode.insertBefore(b, rt.nextSibling);
  setInterval(() => { b.style.display = current && current.resetBackup ? '' : 'none'; }, 1000);
})();
(function () { const rt = resetTerrain; resetTerrain = async function () { const before = migrBackupKey; await rt.apply(this, arguments); if (migrBackupKey && migrBackupKey !== before && /_reset_/.test(migrBackupKey) && current) current.resetBackup = migrBackupKey; }; })();
