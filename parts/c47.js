/* ===================== GLX-C47 (v0.9.43): every castle stair run gets a walkable way on at the bottom ===================== */
(function c47() {
  const isSt = b => b === 167 || b === 164;
  const air = (x, y, z) => { const b = world[idx(x, y, z)]; return !b || PLANT[b] === 1; };
  const solidAt = (x, y, z) => { const b = world[idx(x, y, z)]; return b && !(PLANT[b] === 1) && b !== T.WATER && b !== T.LAVA; };
  const dirOf = f => [f === 1 ? -1 : f === 3 ? 1 : 0, f === 0 ? -1 : f === 2 ? 1 : 0];
  const standable = (x, y, z) => air(x, y, z) && air(x, y + 1, z) && (solidAt(x, y - 1, z));
  const put = (x, y, z, b, f) => { const k = idx(x, y, z); if (typeof placedSet !== 'undefined' && placedSet.has(k)) return false; world[k] = b; if (f !== undefined) entMeta.set(keyOf(x, y, z), {face: f}); else entMeta.delete(keyOf(x, y, z)); return true; };
  window.c47FixStairs = function () {
    let fixed = 0, ok = 0, bad = 0; const list = (typeof g9castles !== 'undefined' ? g9castles : []);
    for (const c of list) { const R = 30;
      for (let x = Math.max(2, c[1] - R); x <= Math.min(W - 3, c[1] + R); x++) for (let z = Math.max(2, c[2] - R); z <= Math.min(D - 3, c[2] + R); z++) for (let y = 3; y < H - 6; y++) {
        if (world[idx(x, y, z)] !== 167) continue; const m = entMeta.get(keyOf(x, y, z)); if (!m) continue; const [dx, dz] = dirOf(m.face);
        { const nb = world[idx(x + dx, y + 1, z + dz)], nm = entMeta.get(keyOf(x + dx, y + 1, z + dz)); if (nb === 167 && nm && nm.face !== m.face && !isSt(world[idx(x + dx * 2, y + 2, z + dz * 2)])) { const [ex, ez] = dirOf(nm.face); if (ex !== -dx || ez !== -dz) { nm.face = m.face; fixed++; } } }   // corner step faces the way you arrive
        for (const [hx, hy, hz] of [[x, y + 1, z], [x, y + 2, z], [x + dx, y + 2, z + dz], [x + dx, y + 3, z + dz]]) { const hb = world[idx(hx, hy, hz)]; if (hb && !isSt(hb) && (isSt(world[idx(x + dx, y + 1, z + dz)]) || hy <= y + 2)) { if (put(hx, hy, hz, T.AIR)) fixed++; } }   // headroom over every step
        if (isSt(world[idx(x - dx, y - 1, z - dz)])) continue;                       // not a bottom step
        if (!isSt(world[idx(x + dx, y + 1, z + dz)])) continue;                      // single decorative stair
        // a way on: behind, or from either side, at the stair's own level (step up half a block)
        const cand = [[-dx, -dz], [dz, dx], [-dz, -dx]];
        if (cand.some(([a, b]) => standable(x + a, y, z + b) || standable(x + a, y + 1, z + b) && false)) { ok++; continue; }
        // extend down: a stair run descending from an open neighbour until it reaches ground
        let done = false;
        for (const [a, b] of cand) { if (!air(x + a, y, z + b) || !air(x + a, y + 1, z + b)) continue;
          let px = x + a, pz = z + b, py = y - 1, steps = [];
          while (steps.length < 14 && py > 2 && air(px, py, pz) && air(px, py + 1, pz) && air(px, py + 2, pz)) { steps.push([px, py, pz]); if (solidAt(px - a, py - 1, pz - b) && air(px - a, py, pz - b) && air(px - a, py + 1, pz - b) || solidAt(px, py - 1, pz)) break; px += a; pz += b; py--; }
          if (!steps.length) { // floor directly there but one too low: just a landing block
            continue; }
          const face = stairF(-a, -b); for (const [sx, sy, sz] of steps) put(sx, sy, sz, 167, face);
          // the first step must be reachable from the floor; bridge the gap under a floating last step
          const [lx, ly, lz] = steps[steps.length - 1]; for (let yy = ly - 1, n = 0; yy > 1 && n < 20 && air(lx, yy, lz); yy--, n++) put(lx, yy, lz, T.STONEBRICK);
          done = true; fixed++; break; }
        if (!done) { // boxed in: open the wall behind for a doorway if it is castle masonry
          const bx = x - dx, bz = z - dz; if (!air(bx, y, bz) && standable(bx - dx, y, bz - dz) === false && solidAt(bx, y - 1, bz)) { put(bx, y, bz, T.AIR); put(bx, y + 1, bz, T.AIR); if (standable(bx, y, bz)) { fixed++; done = true; } }
          if (!done) bad++; }
      } }
    return {ok, fixed, bad};
  };
  const ge = generate; generate = function () { const r = ge.apply(this, arguments); try { const was = c37busy; c37busy = true; c47FixStairs(); window.__c47 = c47FixStairs(); c37busy = was; } catch (e) { console.warn('c47', e); } return r; };
})();
