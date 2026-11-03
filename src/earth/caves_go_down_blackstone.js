/* GLX-C335 (v1.1.38): CAVES GO DOWN, AND BLACKSTONE BREAKS LIKE COBBLE.
   1. A few of the island caves now carry on down through the bottom of the island in winding shafts into the first big cavern
      below, so you can walk and climb down into the inside of the Earth without digging. Only natural stone is opened, never a
      block you placed, and it is done once per world.
   2. Blackstone and dark stone cobble have the same hardness and pickaxe speed as cobblestone. */
(function c335() {
  const U = window.__c335 = {err: null, spots: []};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  try { for (const k of ['BLACKSTONE', 'DSCOBBLE']) { const b = T[k]; if (!b) continue; HARD[b] = HARD[T.COBBLE]; MC_HARD[b] = MC_HARD[T.COBBLE]; NEEDS_PICK.add(b); REQ[b] = REQ[T.COBBLE] || 1; } } catch (e) { ERR('hard', e); }
  const NAT = () => new Set([T.STONE, T.DIRT, T.GRAVEL, T.BEDROCK, T.DEEPSLATE, T.ANDESITE, T.GRANITE, T.DIORITE, T.TUFF, T.COAL, T.IRON, T.COALORE, T.IRONORE, T.CLAY, T.SAND].filter(Boolean));
  const wig = (y, s) => [Math.round(2.2 * Math.sin(y * 0.21 + s)), Math.round(2.2 * Math.cos(y * 0.17 + s * 1.7))];
  let lastW = null, h0 = null;
  // the shaft below the island floor: a winding 3 wide tube down to the first open cavern
  function under(x, y, z) { for (const s of U.spots) { if (y < s.yb || y > -1 || Math.abs(x - s.x) > 4 || Math.abs(z - s.z) > 4) continue; const o = wig(y, s.s); if (Math.abs(x - s.x - o[0]) <= 1 && Math.abs(z - s.z - o[1]) <= 1) return true; } return false; }
  function find() { const nat = NAT(), out = []; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let t = 0; t < 4000 && out.length < 5; t++) { const x = 8 + Math.floor(rnd() * (W - 16)), z = 8 + Math.floor(rnd() * (D - 16));
      if (out.some(s => Math.hypot(s.x - x, s.z - z) < 60)) continue; let cy = -1;
      for (let y = 3; y < Math.min(H - 2, 30); y++) if (!world[idx(x, y, z)] && !world[idx(x, y + 1, z)] && nat.has(world[idx(x, y - 1, z)])) { cy = y; break; }
      if (cy < 0) continue; let top = 0; for (let y = cy; y < H; y++) if (world[idx(x, y, z)]) { top = 1; break; } if (!top) continue; out.push({x, z, cy, s: out.length * 1.9 + 0.4}); }
    return out; }
  function carve(s) { const nat = NAT(); let n = 0;
    for (let y = s.cy - 1; y >= 0; y--) { const o = wig(y, s.s); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const x = s.x + o[0] + a, z = s.z + o[1] + b; if (x < 0 || z < 0 || x >= W || z >= D) continue; const i = idx(x, y, z);
        try { if (typeof placedSet !== 'undefined' && placedSet.has(i)) continue; } catch (_) {} if (world[i] && nat.has(world[i])) { world[i] = 0; n++; } else if (world[i] === T.WATER || world[i] === T.LAVA) { world[i] = T.STONE; } } markDirty(s.x + o[0], s.z + o[1]); }
    return n; }
  function bottom(s) { for (let y = -2; y > -140; y--) { const o = wig(y, s.s), x = s.x + o[0], z = s.z + o[1]; if (!h0(x, y, z) && !h0(x, y - 1, z) && y < -3) return y - 1; } return -40; }
  setInterval(() => { try { if (typeof started === 'undefined' || !started || DIM.cur || !window.__c320 || !__c320.hol || typeof current === 'undefined' || !current) return;
      const e = __c320; if (!e.hol.c335) { h0 = e.hol; const w = function (x, y, z, dx, dy, dz, r) { if (y < 0 && y > -150 && x >= 0 && x < W && z >= 0 && z < D && U.spots.length && under(x, y, z)) return 0; return h0(x, y, z, dx, dy, dz, r); }; w.c335 = 1; e.hol = w; }
      if (world === lastW) return; lastW = world; U.spots = find(); for (const s of U.spots) s.yb = bottom(s);
      const key = 'glx335:' + current.id; if (!localStorage.getItem(key)) { let n = 0; for (const s of U.spots) n += carve(s); U.carved = n; localStorage.setItem(key, '1'); }
      e.dirty = 1; try { e.edits && (e.ev = (e.ev || 0) + 1); } catch (_) {} if (window.__c324 && __c324.cache) __c324.cache.clear(); } catch (e) { ERR('loop', e); } }, 1000);
})();
