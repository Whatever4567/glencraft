/* ===================== GLX-C38 (v0.9.41): reset only lifts what YOU built (placed-block tracking + same-seed structure mask) ===================== */
var placedSet = new Set();
(function c38() {
  const sb = setB;
  setB = function (x, y, z, v) {
    sb.apply(this, arguments);
    if (!started || c37busy || DIM.cur || x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
    const k = idx(x, y, z); if (v && !__NAT[v]) placedSet.add(k); else placedSet.delete(k);
  };
  const se = serialize;
  serialize = function () { const d = se.apply(this, arguments); if (!DIM.cur && placedSet.size) d.placed = [...placedSet].slice(0, 400000); return d; };
  const ap = applySave;
  applySave = function (d) { const r = ap.apply(this, arguments); if (d && !d.dim) placedSet = new Set(Array.isArray(d.placed) ? d.placed : []); return r; };
  const nw = typeof newWorldReset === 'function' ? null : null;
  // map of 8x8 cells -> how many "built-looking" blocks the generator itself puts there (castles, ruins, bothies, villages)
  window.c38GenCells = function () {
    const snap = {world: world.slice(), chests: new Map(chests), doorState: new Map(doorState), furnaces: new Map(furnaces), entMeta: new Map(entMeta), crops: new Map(crops),
      cast: (typeof g9castles !== 'undefined' && g9castles) ? g9castles.slice() : [], spawn: typeof g9spawn !== 'undefined' ? g9spawn : null, mobsN: mobs.length};
    const CS = 8, gz = Math.ceil(D / CS), m = new Map(), B = g9BuiltSet(), MOSS = T.MOSSYBRICK;
    const wasBusy = c37busy; c37busy = true;
    try {
      generate();
      for (let x = 0; x < W; x++) for (let y = 1; y < H; y++) { const base = (x * H + y) * D; for (let z = 0; z < D; z++) { const b = world[base + z]; if (b && (B[b] || b === MOSS || !__NAT[b])) { const c = Math.floor(x / CS) * gz + Math.floor(z / CS); m.set(c, (m.get(c) || 0) + 1); } } }
    } finally {
      world.set(snap.world);
      for (const n of ['chests', 'doorState', 'furnaces', 'entMeta', 'crops']) { const M = {chests, doorState, furnaces, entMeta, crops}[n]; M.clear(); for (const [k, v] of snap[n]) M.set(k, v); }
      if (snap.cast.length) { g9castles.length = 0; snap.cast.forEach(c => g9castles.push(c)); }
      try { g9spawn = snap.spawn; } catch (_) {}
      while (mobs.length > snap.mobsN) removeMob(mobs[mobs.length - 1]);
      c37busy = wasBusy;
    }
    return m;
  };
  // which cells count as yours: tracked placements, or (old saves) built blocks the generator doesn't put there
  window.c38Mine = function (genCells) {
    const CS = 8, gz = Math.ceil(D / CS), placedC = new Map();
    for (const k of placedSet) { const x = Math.floor(k / (H * D)), z = k % D; const c = Math.floor(x / CS) * gz + Math.floor(z / CS); placedC.set(c, (placedC.get(c) || 0) + 1); }
    return c => (placedC.get(c) || 0) >= 3 || !genCells || (genCells.get(c) || 0) < 4;
  };
})();
