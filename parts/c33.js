
/* ===================== GLX-C33 (v0.9.35): glass panes (6 glass -> 16), thin panes that join neighbours, thin collision ===================== */
Object.assign(T, {GPANE: 227}); Object.assign(NAMES, {227: 'Glass pane'});
FACES[227] = 'glass'; HARD[227] = 0.4; MC_HARD[227] = 0.3; REQ[227] = 0; PLACEABLE.add(227); ORDER.push(227); BLOCK_MATS[227] = BLOCK_MATS[T.GLASS]; ENT[227] = 1;
ICONS[227] = drawIcon(g => { g.fillStyle = 'rgba(190,225,240,.45)'; g.fillRect(-6, -28, 12, 56); g.strokeStyle = '#e8f6ff'; g.lineWidth = 2.5; g.strokeRect(-6, -28, 12, 56); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-3, -20); g.lineTo(2, -12); g.moveTo(-3, -6); g.lineTo(3, 4); g.stroke(); });
RECIPES.push(rc('16 Glass panes', '6 Glass', 227, 16, [[T.GLASS, 6]], 1));
if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(227);
FENCE_T.push(227);
(function paneMod() {
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]], TH = 0.125;
  const full = (x, y, z) => { const b = getB(x, y, z); return b && !ENT[b] && !PLANT[b] && b !== T.WATER && b !== T.LAVA && !(typeof IS_STAIR !== 'undefined' && IS_STAIR[b]) && b !== 227 && (b === T.GLASS || solid(x, y, z)); };
  const paneConn = (x, y, z) => { let m = 0; DIRS.forEach(([dx, dz], i) => { const b = getB(x + dx, y, z + dz); if (b === 227 || b === T.FENCE || b === T.RAILING || b === 226 || full(x + dx, y, z + dz)) m |= 1 << i; }); return m; };
  window.paneConn = paneConn;
  // pane boxes in cell-local coords [x0,z0,x1,z1]
  const paneBoxes = m => { const c = 0.5 - TH / 2, out = [[c, c, c + TH, c + TH]]; if (!m) return [[0, c, 1, c + TH]];
    if (m & 1) out.push([c, c, 1, c + TH]); if (m & 2) out.push([0, c, c + TH, c + TH]); if (m & 4) out.push([c, c, c + TH, 1]); if (m & 8) out.push([c, 0, c + TH, c + TH]); return out; };
  const mat = () => { const m = [].concat(BLOCK_MATS[T.GLASS])[0]; if (!mat.m) { mat.m = m.clone(); mat.m.transparent = true; mat.m.depthWrite = false; mat.m.side = THREE.DoubleSide; mat.m.opacity = 1; } return mat.m; };
  const frame = new THREE.MeshLambertMaterial({color: 0xd8e8ee, transparent: true, opacity: 0.55, depthWrite: false});
  // models: hook into the fence model sync (same chunk lists)
  const sf = syncFences; window.syncFences = function () {
    sf();
    for (const [k, o] of fenceObjs) if (o.t === 227) {
      const m = paneConn(o.x, o.y, o.z); if (o.pm === m) continue;
      scene.remove(o.g); const g = new THREE.Group(); g.position.set(o.x, o.y, o.z);
      for (const [x0, z0, x1, z1] of paneBoxes(m)) { const w = x1 - x0, d = z1 - z0, b = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), mat()); b.position.set(x0 + w / 2, 0.5, z0 + d / 2); b.renderOrder = 2; g.add(b);
        const e = new THREE.Mesh(new THREE.BoxGeometry(w + 0.004, 0.03, d + 0.004), frame); e.position.set(x0 + w / 2, 0.985, z0 + d / 2); g.add(e); }
      scene.add(g); o.g = g; o.pm = m; o.key = '227:' + m;
    }
  };
  syncFences = window.syncFences;
  const se = syncEntities; syncEntities = function () { const r = se.apply(this, arguments); try { window.syncFences(); } catch (e) { console.warn('pane', e); } return r; };
  // collision: the pane cell is not a full block; test the player box against the thin pane boxes
  const so = solid; solid = function (x, y, z) { if (y >= 0 && y < H && x >= 0 && z >= 0 && x < W && z < D && world[idx(x, y, z)] === 227) return false; return so.apply(this, arguments); };
  const co = collides; collides = function (x, y, z) {
    if (co.apply(this, arguments)) return true;
    const ax0 = x - R, ax1 = x + R, az0 = z - R, az1 = z + R;
    for (let by = Math.floor(y + 0.01); by <= Math.floor(y + HEIGHT - 0.01); by++) for (let bx = Math.floor(ax0); bx <= Math.floor(ax1); bx++) for (let bz = Math.floor(az0); bz <= Math.floor(az1); bz++) {
      if (bx < 0 || bz < 0 || bx >= W || bz >= D || by < 0 || by >= H || world[idx(bx, by, bz)] !== 227) continue;
      for (const [x0, z0, x1, z1] of paneBoxes(paneConn(bx, by, bz))) if (ax1 > bx + x0 && ax0 < bx + x1 && az1 > bz + z0 && az0 < bz + z1) return true;
    }
    return false;
  };
})();
