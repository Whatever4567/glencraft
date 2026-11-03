/* ===================== GLX-C195 (v1.0.37): lag spikes - the tree-monster spot search no longer scans the whole world, night hostiles only spawn near your own height, deep or far-off cave mobs are cleared ===================== */
// Measured on v1.0.36: findTreeSpot() walked every block of the map (W x D x H) each time a tree monster tried to spawn at night - a 0.8-1.5 s freeze every ~30 s.
// The light-based spawner (c73) also filled the hostile cap with zombies/skeletons in caves 15-30 blocks under you, which nobody saw but whose pathfinding ran every frame.
(function c195() {
  const U = window.__c195 = {tree: 0, treeMs: 0, blocked: 0, culled: 0, err: null};
  const CLASSIC = new Set(['zombie', 'skeleton', 'creeper']);
  // ---- 1) tree-monster spot: sample columns 12-40 blocks around you instead of the whole world ----
  try { findTreeSpot = function () { const t0 = performance.now(); U.tree++;
      const trunks = [], px = Math.floor(P.x), pz = Math.floor(P.z);
      for (let k = 0; k < 900 && trunks.length < 60; k++) { const a = Math.random() * 6.283, r = 12 + Math.random() * 28, x = Math.floor(px + Math.sin(a) * r), z = Math.floor(pz + Math.cos(a) * r);
        if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) continue;
        let y = H - 2; while (y > SEA && !LOGGY[world[idx(x, y, z)]]) y--; if (y <= SEA) continue;
        while (y > SEA && LOGGY[world[idx(x, y - 1, z)]]) y--;
        if (solid(x, y - 1, z) && !(placedSet && placedSet.has(idx(x, y, z)))) trunks.push([x, y, z]); }
      let res = null;
      for (let tries = 0; tries < 80 && trunks.length && !res; tries++) {
        const [tx, ty, tz] = trunks[Math.floor(Math.random() * trunks.length)];
        const [ox, oz] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]][Math.floor(Math.random() * 6)];
        const cx = tx + ox, cz = tz + oz;
        if (!solid(cx, ty - 1, cz) || LEAFY[getB(cx, ty - 1, cz)]) continue;
        let clear = true; for (let k = 0; k < 3; k++) { const b = getB(cx, ty + k, cz); if (b !== T.AIR && !isPlant(b)) clear = false; } if (!clear) continue;
        let canopy = false; for (let k = 3; k < 9; k++) if (LEAFY[getB(cx, ty + k, cz)]) canopy = true;
        if (!canopy || Math.hypot(cx - P.x, cz - P.z) < 12) continue;
        if (mobs.some(m => m.kind === 'treeman' && Math.hypot(m.g.position.x - cx, m.g.position.z - cz) < 6)) continue;
        res = [cx + 0.5, ty, cz + 0.5, cx + .5, cz + .5]; }
      U.treeMs = Math.max(U.treeMs, performance.now() - t0); return res; }; } catch (e) { U.err = String(e); }
  // ---- 2) light-spawned hostiles (c73) only within 12 blocks of your height, so caves deep under the surface stay empty until you go down there ----
  try { const sm = spawnMob; spawnMob = function (kind) {
      const s = window.__eggSpot, c = window.__caveSpawn;
      if (s && c && CLASSIC.has(kind) && !DIM.cur && started && Math.abs(s[1] - P.y) > 12) { U.blocked++; return null; }
      return sm.apply(this, arguments); }; } catch (e) { U.err = String(e); }
  // ---- 3) every 2 s: a natural hostile far above/below you and out of reach is removed (frees its AI, pathing and draw calls) ----
  setInterval(() => { try { if (!started || DIM.cur) return;
      for (let i = mobs.length - 1; i >= 0; i--) { const a = mobs[i]; if (!a || !a.natural || !CLASSIC.has(a.kind) || a.named || a.tamed || a.cf > 0 || a.arm > 0 || a.lit) continue;
        const p = a.g.position, dy = Math.abs(p.y - P.y), dh = Math.hypot(p.x - P.x, p.z - P.z);
        if ((dy > 16 && dh > 10) || dh > 56) { removeMob(a); U.culled++; } } } catch (e) { U.err = String(e); } }, 2000);
})();
