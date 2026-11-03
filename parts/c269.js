/* GLX-C269 (v1.0.85): no monsters spawn inside the pyramid - the hall, the gallery rooms, the stairs and the chest room under it.
   Any hostile mob that is born inside those bounds (natural spawns and spawners) is removed at once. The Egyptians and spawn eggs are left alone. */
(function () {
  const U = window.__c269 = {err: null, blocked: 0, box: null};
  const HK = new Set(['zombie', 'skeleton', 'creeper', 'guardian', 'spider', 'mummy', 'husk']);
  const bad = a => a && (a.hostile || HK.has(a.kind)) && !a.tame && !a.egg;
  function box() { const o = window.__c239 && __c239.pyr; if (!o) return null; if (U.box && U.box.o === o) return U.box;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [u, v] of [[-38, -15], [-38, 15], [23, -15], [23, 15]]) { const [x, z] = o.L(u, v); x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    return (U.box = {o, x0, x1, z0, z1, y0: o.hy - 26, y1: o.hy + 24}); }
  const inside = (b, p) => p.x >= b.x0 && p.x <= b.x1 + 1 && p.z >= b.z0 && p.z <= b.z1 + 1 && p.y >= b.y0 && p.y <= b.y1;
  const kill = a => { try { if (typeof removeMob === 'function') removeMob(a); else { scene.remove(a.g); const i = mobs.indexOf(a); if (i >= 0) mobs.splice(i, 1); } } catch (_) {} U.blocked++; };
  try { const push = mobs.push; mobs.push = function () { const now = performance.now(), egg = !!window.__eggSpot; for (const a of arguments) if (a) { a.__born = now; if (egg) a.egg = 1; } return push.apply(this, arguments); }; } catch (e) { U.err = String(e); }
  setInterval(() => { try { if (typeof started === 'undefined' || !started || DIM.cur) return; const b = box(); if (!b) return; const now = performance.now();
    for (let i = mobs.length - 1; i >= 0; i--) { const a = mobs[i]; if (!bad(a) || !a.g || !(now - (a.__born || 0) < 4000)) continue; if (inside(b, a.g.position)) kill(a); } } catch (e) { if (!U.err) U.err = String(e); } }, 250);
})();
