
/* ===================== GLX-C32 (v0.9.34): fences, railings, fence gates and street lamps as real models (no more see-through cubes) ===================== */
Object.assign(T, {FGATE: 226});
Object.assign(NAMES, {226: 'Fence gate'});
FACES[226] = 'planks'; ICON_KEY[226] = 'planks'; HARD[226] = 2; MC_HARD[226] = 2; REQ[226] = 0; PLACEABLE.add(226); ORDER.push(226); BLOCK_MATS[226] = BLOCK_MATS[T.PLANKS];
RECIPES.push(rc('Fence gate', '4 Sticks + 2 Planks', 226, 1, [[IT.STICK, 4], [T.PLANKS, 2]], 1));
if (!RECIPES.some(r => r.out === T.FENCE)) RECIPES.push(rc('3 Fences', '4 Planks + 2 Sticks', T.FENCE, 3, [[T.PLANKS, 4], [IT.STICK, 2]], 1));
if (!RECIPES.some(r => r.out === T.RAILING)) RECIPES.push(rc('16 Iron railings', '6 Iron ingots', T.RAILING, 16, [[IT.IRONINGOT, 6]], 1));
if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(226);
const FENCE_T = [T.FENCE, T.RAILING, 226, T.LPOST, T.LAMP];
FENCE_T.forEach(b => { ENT[b] = 1; });
const fenceObjs = new Map();
(function fenceMod() {
  const metal = new THREE.MeshPhongMaterial({color: 0x202228, shininess: 60, specular: 0x555a66});
  const green = new THREE.MeshPhongMaterial({color: 0x1e3426, shininess: 40, specular: 0x334438});
  const glow = new THREE.MeshBasicMaterial({color: 0xffe2a0});
  const wood = () => { const m = [].concat(BLOCK_MATS[T.PLANKS])[0]; return m; };
  const box = (g, m, w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  const isFence = b => b === T.FENCE || b === 226;
  const full = (x, y, z) => { const b = getB(x, y, z); return b && !ENT[b] && !PLANT[b] && b !== T.WATER && b !== T.LAVA && b !== T.GLASS && !(typeof IS_STAIR !== 'undefined' && IS_STAIR[b]) && solid(x, y, z); };
  function conn(t, x, y, z) {
    let m = 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz], i) => { const b = getB(x + dx, y, z + dz);
      const ok = t === T.RAILING ? (b === T.RAILING || full(x + dx, y, z + dz)) : (isFence(b) || full(x + dx, y, z + dz));
      if (ok) m |= 1 << i; });
    return m;
  }
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function build(t, x, y, z, m, meta) {
    const g = new THREE.Group(); g.position.set(x + .5, y, z + .5);
    if (t === T.FENCE) {
      const w = wood(); box(g, w, 0.25, 1, 0.25, 0, 0.5, 0);
      DIRS.forEach(([dx, dz], i) => { if (!(m & 1 << i)) return; for (const yy of [0.375, 0.8125]) box(g, w, dx ? 0.5 : 0.125, 0.1875, dz ? 0.5 : 0.125, dx * 0.25, yy, dz * 0.25); });
    } else if (t === T.RAILING) {
      box(g, metal, 0.12, 1, 0.12, 0, 0.5, 0); box(g, metal, 0.18, 0.08, 0.18, 0, 1.0, 0);
      DIRS.forEach(([dx, dz], i) => { if (!(m & 1 << i)) return; for (const yy of [0.12, 0.88]) box(g, metal, dx ? 0.5 : 0.06, 0.06, dz ? 0.5 : 0.06, dx * 0.25, yy, dz * 0.25);
        for (const s of [0.2, 0.4]) { const bar = box(g, metal, 0.04, 0.82, 0.04, dx * s, 0.5, dz * s); const tip = box(g, metal, 0.07, 0.1, 0.07, dx * s, 0.97, dz * s); tip.rotation.y = Math.PI / 4; } });
    } else if (t === 226) {
      const w = wood(), f = (meta && meta.face) || 0; g.rotation.y = f * Math.PI / 2;
      for (const s of [-1, 1]) box(g, w, 0.125, 0.85, 0.125, s * 0.4375, 0.55, 0);
      const halves = [];
      for (const s of [-1, 1]) { const h = new THREE.Group(); h.position.set(s * 0.4375, 0, 0); g.add(h);
        for (const yy of [0.4, 0.85]) box(h, w, 0.375, 0.1875, 0.125, -s * 0.25, yy, 0);
        box(h, w, 0.125, 0.5, 0.125, -s * 0.375, 0.62, 0); halves.push([h, s]); }
      g.userData.halves = halves; g.userData.open = meta && meta.open ? 1 : 0; g.userData.k = g.userData.open;
      halves.forEach(([h, s]) => h.rotation.y = s * g.userData.k * Math.PI / 2);
    } else if (t === T.LPOST) {
      box(g, green, 0.22, 1, 0.22, 0, 0.5, 0); const ring = box(g, green, 0.3, 0.08, 0.3, 0, 0.04, 0); ring.scale.y = 1;
      if (getB(x, y - 1, z) !== T.LPOST) box(g, green, 0.36, 0.22, 0.36, 0, 0.11, 0);
    } else if (t === T.LAMP) {
      const below = getB(x, y - 1, z), hang = getB(x, y + 1, z) && below !== T.LPOST;
      box(g, green, 0.5, 0.06, 0.5, 0, 0.18, 0); box(g, green, 0.56, 0.08, 0.56, 0, 0.84, 0); box(g, green, 0.26, 0.12, 0.26, 0, 0.93, 0);
      const pane = box(g, glow, 0.42, 0.6, 0.42, 0, 0.51, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, green, 0.05, 0.62, 0.05, sx * 0.23, 0.51, sz * 0.23);
      if (below === T.LPOST) box(g, green, 0.16, 0.18, 0.16, 0, 0.06, 0);
      if (hang) box(g, green, 0.06, 0.12, 0.06, 0, 1.0, 0);
    }
    scene.add(g); return {t, g, m, key: t + ':' + m + ':' + ((meta && meta.face) || 0), x, y, z};
  }
  function syncFences() {
    const want = new Map();
    for (const L of chunkLists.values()) for (const t of FENCE_T) { const a = L[t]; if (!a) continue; for (let i = 0; i < a.length; i += 3) want.set(keyOf(a[i], a[i + 1], a[i + 2]), [t, a[i], a[i + 1], a[i + 2]]); }
    for (const [k, o] of fenceObjs) { const w = want.get(k); if (!w || w[0] !== o.t) { scene.remove(o.g); fenceObjs.delete(k); } }
    for (const [k, [t, x, y, z]] of want) {
      let meta = entMeta.get(k);
      if (t === 226 && !meta) { const f = Math.abs(Math.sin(P.yaw)) > Math.abs(Math.cos(P.yaw)) ? 1 : 0; meta = {face: f, open: 0}; entMeta.set(k, meta); }
      const m = t === T.LPOST || t === T.LAMP ? (getB(x, y - 1, z) << 8 | (getB(x, y + 1, z) ? 1 : 0)) : t === 226 ? 0 : conn(t, x, y, z);
      const o = fenceObjs.get(k), sig = t + ':' + m + ':' + ((meta && meta.face) || 0);
      if (o && (o.key === sig || o.t === 227)) continue;
      if (o) scene.remove(o.g);
      fenceObjs.set(k, build(t, x, y, z, m, meta));
    }
  }
  window.syncFences = syncFences;
  const se = syncEntities; syncEntities = function () { const r = se.apply(this, arguments); try { syncFences(); } catch (e) { console.warn('fence', e); } return r; };
  // gate: open/close animation
  const ue = updateEntities; updateEntities = function (dt) { ue.apply(this, arguments);
    for (const o of fenceObjs.values()) { if (o.t !== 226) continue; const u = o.g.userData, meta = entMeta.get(keyOf(o.x, o.y, o.z)) || {}; const tgt = meta.open ? 1 : 0;
      if (Math.abs(u.k - tgt) > 0.001) { u.k += (tgt - u.k) * Math.min(1, dt * 10); if (Math.abs(u.k - tgt) < 0.01) u.k = tgt; u.halves.forEach(([h, s]) => h.rotation.y = s * u.k * Math.PI / 2 * (meta.dir || 1)); } } };
  const gateOpen = (x, y, z) => { const m = entMeta.get(keyOf(x, y, z)); return !!(m && m.open); };
  // use a gate (no sneak) toggles it, opening away from you
  const uiO = useItem; useItem = function () {
    const r = raycast(5);
    if (r && getB(...r.hit) === 226 && !sneakHeld) { const [x, y, z] = r.hit, k = keyOf(x, y, z), m = entMeta.get(k) || {face: 0, open: 0};
      m.open = m.open ? 0 : 1; if (m.open) { const along = m.face ? P.x - (x + .5) : P.z - (z + .5); m.dir = along > 0 ? -1 : 1; } entMeta.set(k, m);
      sfx(m.open ? 'doorOpen' : 'doorClose', 0.8); swing(); try { saveWorld && saveWorld(); } catch (_) {} return; }
    return uiO.apply(this, arguments);
  };
  // collision: open gates let you through; fences, railings and closed gates stand 1.5 blocks tall so you can't hop them
  const so = solid; solid = function (x, y, z) { if (y >= 0 && y < H && x >= 0 && z >= 0 && x < W && z < D && world[idx(x, y, z)] === 226 && gateOpen(x, y, z)) return false; return so.apply(this, arguments); };
  const co = collides; collides = function (x, y, z) {
    if (co.apply(this, arguments)) return true;
    for (const dx of [-R, R]) for (const dz of [-R, R]) { const bx = Math.floor(x + dx), bz = Math.floor(z + dz), by = Math.floor(y + 0.01) - 1;
      if (bx < 0 || bz < 0 || bx >= W || bz >= D || by < 0 || by >= H) continue; const b = world[idx(bx, by, bz)];
      if ((b === T.FENCE || b === T.RAILING || (b === 226 && !gateOpen(bx, by, bz))) && y + 0.01 - (by + 1) < 0.5) return true; }
    return false;
  };
})();
