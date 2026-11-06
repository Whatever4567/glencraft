/* GLX-C401 (v1.1.96): FIREGUN HOT PATH. fireGun stepped solid() every 0.1 along the whole range. A DDA
   finds the first hit once; while the shot runs, solid() short-circuits for samples before that hit so
   later wrappers keep their FX and the hit matches the old result. */
(function c401() {
  const U = window.__c401 = {err: null, calls: 0, saved: 0, on: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  function hitRange(o, d, maxT) {
    let tMax = maxT;
    const ox = o.x, oy = o.y, oz = o.z, dx = d[0], dy = d[1], dz = d[2];
    let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
    const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0, stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0, stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;
    const tDeltaX = stepX ? Math.abs(1 / dx) : 1e9, tDeltaY = stepY ? Math.abs(1 / dy) : 1e9, tDeltaZ = stepZ ? Math.abs(1 / dz) : 1e9;
    let tMaxX = stepX ? ((stepX > 0 ? (x + 1 - ox) : (ox - x)) * tDeltaX) : 1e9;
    let tMaxY = stepY ? ((stepY > 0 ? (y + 1 - oy) : (oy - y)) * tDeltaY) : 1e9;
    let tMaxZ = stepZ ? ((stepZ > 0 ? (z + 1 - oz) : (oz - z)) * tDeltaZ) : 1e9;
    let t = 0; const lim = Math.ceil(maxT) + 4, so = solid;
    for (let i = 0; i < lim; i++) {
      if (t > 0.05 && so(x, y, z)) { tMax = Math.min(tMax, t); break; }
      if (tMaxX < tMaxY) { if (tMaxX < tMaxZ) { t = tMaxX; tMaxX += tDeltaX; x += stepX; } else { t = tMaxZ; tMaxZ += tDeltaZ; z += stepZ; } }
      else { if (tMaxY < tMaxZ) { t = tMaxY; tMaxY += tDeltaY; y += stepY; } else { t = tMaxZ; tMaxZ += tDeltaZ; z += stepZ; } }
      if (t >= maxT) break;
    }
    return tMax;
  }
  try {
    const fg = fireGun;
    fireGun = function (id) {
      U.calls++;
      try {
        const G = GUN[id]; if (!G) return fg.apply(this, arguments);
        const d = lookDir(), o = new THREE.Vector3(P.x, P.y + EYE, P.z);
        const bt = hitRange(o, d, G.range || 60);
        const so = solid;
        solid = function (x, y, z) {
          try {
            const t = (x + 0.5 - o.x) * d[0] + (y + 0.5 - o.y) * d[1] + (z + 0.5 - o.z) * d[2];
            if (t < bt - 0.35) { U.saved++; return false; }
          } catch (_) {}
          return so.apply(this, arguments);
        };
        try { return fg.apply(this, arguments); }
        finally { solid = so; U.on = 1; }
      } catch (e) { ERR('fg', e); return fg.apply(this, arguments); }
    };
  } catch (e) { ERR('wrap', e); }
})();
