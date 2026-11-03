
/* ===================== GLX-H2 (v0.9.25): no more floating torches (castle interiors placed ground torches over air) ===================== */
// Unsupported torches become wall torches if a wall is next to them, hanging torches under a ceiling, otherwise they are removed. Runs after generation and on every load.
function fixTorches() {
  let fixed = 0, removed = 0; const HD = H * D;
  for (let x = 0; x < W; x++) for (let y = 1; y < H - 1; y++) { const b0 = (x * H + y) * D; for (let z = 0; z < D; z++) {
    if (world[b0 + z] !== T.TORCH) continue;
    const k = keyOf(x, y, z), m = entMeta.get(k) || {};
    if (m.wall ? solid(x + m.wall[0], y, z + m.wall[1]) : m.ceil ? solid(x, y + 1, z) : solid(x, y - 1, z)) continue;
    let w = null; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (solid(x + dx, y, z + dz)) { w = [dx, dz]; break; }
    if (w) { entMeta.set(k, {face: 0, wall: w}); fixed++; }
    else if (solid(x, y - 1, z)) { entMeta.delete(k); fixed++; }
    else if (solid(x, y + 1, z)) { entMeta.set(k, {face: 0, ceil: 1}); fixed++; }
    else { world[b0 + z] = T.AIR; entMeta.delete(k); removed++; }
    markDirty(x, z);
  } }
  if (fixed + removed) console.log('[torches] fixed', fixed, 'removed', removed);
  return {fixed, removed};
}
(function () {
  const ge = generate; generate = function () { const r = ge.apply(this, arguments); try { fixTorches(); } catch (e) { console.warn(e); } return r; };
  const ap = applySave; applySave = function () { const r = ap.apply(this, arguments); try { if (fixTorches().removed + 0 >= 0) rebuild(); } catch (e) { console.warn(e); } return r; };
})();
