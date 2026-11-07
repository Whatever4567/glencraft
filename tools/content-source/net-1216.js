/* GLX-V1216 (v1.2.16): a wider connected cave network around the Watcher bowl, at the depth the world already has (y 3-21).
   Runs right after the v1.2.14 link (same new-world moment, including the v1.2.15 late-Agartha path), only when the bowl exists.
   Up to 5 broad galleries (about 18-24 wide, 8-9 high) sit 34-62 blocks out around the bowl; each is joined to the bowl and to
   its neighbour by a wide winding passage, so the bowl, the galleries and the v1.2.14 tunnel form one walkable network.
   Each gallery has a theme on its shell: Fungal loam, Gloamstone (blue/cyan), Ember basalt or Abyss crystal rock; passages
   blend the two themes they join with a smooth position-based mix, not random noise. Modest ruins: Watcher-brick colonnades in
   two galleries, a ruined bridge over a sealed lava channel in one. Same rules as v1.2.14: only inside y 3-21 and the carved
   shapes, never next to water/lava that was already there, never under open sky, the GLX-C294/C307 Agartha keep-out (fail closed),
   every placed lava cell sealed by solid/glass. Plain blocks only, no entities or lights. */
(function v1216() {
  const U = window.__v1216 = {err: null, gal: [], cells: 0, why: null};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const Y0 = 3, Y1 = 21, BR = 774, FUN = 770, GLO = 771, BAS = 772, ABY = 773, THEMES = [FUN, GLO, BAS, ABY, GLO];
  let KEEP = [], LAVA = [], carved = null;
  const inb = (x, y, z) => x > 1 && z > 1 && x < W - 2 && z < D - 2 && y >= Y0 && y <= Y1;
  const fluid = v => v === T.WATER || v === T.LAVA;
  const kept = (x, z) => KEEP.some(k => Math.hypot(x - k[0], z - k[1]) < 45);
  const roofed = (x, y, z) => { for (let k = y + 1; k < Math.min(H, y + 40); k++) { const v = world[idx(x, k, z)]; if (v !== T.AIR) return !fluid(v); } return false; };
  const N6 = [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0],[0,-1,0]];
  const wetNb = (x, y, z) => N6.some(([a, b, c]) => { const X = x + a, Y = y + b, Z = z + c; return X >= 0 && Z >= 0 && X < W && Z < D && Y >= 0 && Y < H && fluid(world[idx(X, Y, Z)]); });
  function set(x, y, z, v) { if (!inb(x, y, z) || kept(x, z)) return false; const i = idx(x, y, z); if (world[i] === 211 || world[i] === v) return false; world[i] = v; U.cells++; return true; }
  function hollow(x, y, z, th) { if (!inb(x, y, z) || kept(x, z)) return; const i = idx(x, y, z), v = world[i]; if (v === T.AIR) return; if (fluid(v) || wetNb(x, y, z) || !roofed(x, y, z)) return; if (set(x, y, z, T.AIR)) carved.push([x, y, z, th]); }
  // shell: natural rock touching carved air takes the theme block (keeps ores: only stone/deepslate/strata blocks recolour)
  const ROCKS = new Set([T.STONE, T.DEEPSLATE, 133, FUN, GLO, BAS, ABY].filter(v => v != null));
  function shell() { for (const [x, y, z, th] of carved) for (const [a, b, c] of N6) { const X = x + a, Y = y + b, Z = z + c; if (!inb(X, Y, Z) || kept(X, Z)) continue; const i = idx(X, Y, Z); if (ROCKS.has(world[i]) && world[i] !== th) { world[i] = th; U.cells++; } } }
  function blob(cx, cy, cz, rx, ry, rz, fl, th) { for (let x = Math.floor(cx - rx); x <= cx + rx; x++) for (let z = Math.floor(cz - rz); z <= cz + rz; z++) for (let y = Math.max(fl, Math.floor(cy - ry)); y <= cy + ry; y++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2; if (d <= 1) hollow(x, y, z, th); } }
  function passage(a, b, ta, tb, seed) { const len = Math.hypot(b[0] - a[0], b[2] - a[2]); if (len < 2) return; const dir = Math.atan2(b[2] - a[2], b[0] - a[0]), nx = -Math.sin(dir), nz = Math.cos(dir);
    for (let s = 0; s <= len; s += 0.6) { const f = s / len, w = Math.sin(f * Math.PI * 2 + seed) * Math.min(5, len / 9) * Math.sin(f * Math.PI), x = a[0] + (b[0] - a[0]) * f + nx * w, z = a[2] + (b[2] - a[2]) * f + nz * w, fl = Math.round(a[1] + (b[1] - a[1]) * f);
      const th = f < 0.5 ? ta : tb;   // smooth: each half keeps its gallery's theme; the swap sits mid-passage where both shells meet
      for (let ox = -2; ox <= 2; ox++) for (let oz = -2; oz <= 2; oz++) { if (ox * ox + oz * oz > 5) continue; for (let y = fl; y < fl + 4; y++) hollow(Math.round(x + ox), y, Math.round(z + oz), th); } } }
  function lava(x, y, z) { if (set(x, y, z, T.LAVA) || world[idx(x, y, z)] === T.LAVA) LAVA.push([x, y, z]); }
  function seal() { for (const [x, y, z] of LAVA) for (const [a, b, c] of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,-1,0]]) { const X = x + a, Y = y + b, Z = z + c; if (X < 0 || Z < 0 || X >= W || Z >= D || Y < 1) continue; const v = world[idx(X, Y, Z)]; if (v === T.LAVA) continue; if (v === T.AIR || v === T.WATER) { world[idx(X, Y, Z)] = BAS; U.cells++; } } }
  function colonnade(g) { const [x, f, z] = g; for (let k = -2; k <= 2; k++) for (const s of [-4, 4]) { const px = x + k * 3, pz = z + s; if (world[idx(px, f, pz)] !== T.AIR) continue; const h = (k + s) % 3 === 0 ? 2 : 5; for (let y = f; y < f + h; y++) set(px, y, pz, BR); if (h === 5) set(px + 1, f + 5, pz, BR), set(px - 1, f + 5, pz, BR); } }
  function bridge(g) { const [x, f, z] = g; for (let w = -7; w <= 7; w++) for (let s = -1; s <= 1; s++) { const X = x + w, Z = z + s; if (world[idx(X, f, Z)] !== T.AIR) continue; set(X, f - 1, Z, T.AIR); set(X, f - 2, Z, T.AIR); if (f - 3 >= Y0 + 1) lava(X, f - 3, Z); }
    for (let w = -7; w <= 7; w++) if (w !== 2 && w !== 3) set(x + w, f - 1, z, BR); for (let w = -7; w <= 7; w += 2) if (w < 0) set(x + w, f, z + 1, BR); }
  U.build = (e) => { U.gal = []; U.cells = 0; U.why = null; carved = []; LAVA = []; if (!e) { U.why = 'no Watcher bowl'; return null; }
    const K = window.__v1214 && __v1214.agKeep ? __v1214.agKeep() : null; if (!K) { U.why = 'Agartha footprint not known - network skipped'; return null; } KEEP = K;
    const cx = Math.floor(e[0]), cz = Math.floor(e[2]); let s = (cx * 73856093 ^ cz * 19349663) >>> 0; const R = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    const a0 = R() * 6.283, cand = [];
    for (let k = 0; k < 5; k++) { const a = a0 + k * 1.2566 + (R() - .5) * 0.5, r = 34 + R() * 28, x = Math.round(cx + Math.cos(a) * r), z = Math.round(cz + Math.sin(a) * r), fl = 6 + Math.round(R() * 6);
      if (x < 16 || z < 16 || x > W - 16 || z > D - 16 || kept(x, z) || KEEP.some(q => Math.hypot(x - q[0], z - q[1]) < 60)) continue; cand.push([x, fl, z, THEMES[k], k]); }
    if (!cand.length) { U.why = 'no gallery site clear of the map edge and Agartha keep-out'; return null; }
    for (const g of cand) { blob(g[0], g[1] + 4, g[2], 9 + R() * 3, 4.5, 9 + R() * 3, g[1], g[3]); U.gal.push({at: [g[0], g[1], g[2]], theme: NAMES[g[3]] || g[3]}); }
    for (let i = 0; i < cand.length; i++) { const q = Math.atan2(cand[i][2] - cz, cand[i][0] - cx), bowl = [Math.round(cx + Math.cos(q) * 12), 6, Math.round(cz + Math.sin(q) * 12)]; passage(bowl, cand[i], BAS, cand[i][3], i); if (i > 0) passage(cand[i - 1], cand[i], cand[i - 1][3], cand[i][3], i + 3); }
    if (cand.length > 2) passage(cand[cand.length - 1], cand[0], cand[cand.length - 1][3], cand[0][3], 9);
    shell(); if (cand[0]) colonnade(cand[0]); if (cand[2]) colonnade(cand[2]); if (cand[1]) bridge(cand[1]); seal(); U.lava = LAVA.length;
    try { if (current) current.v1216net = U.gal.map(g => g.at); } catch (_) {} try { dirtyAll = true; } catch (_) {} return U.gal; };
  try { const L = window.__v1214; if (L && L.build) { const b = L.build; L.build = function (e) { const r = b.apply(this, arguments); try { U.build(e); } catch (x) { ERR('net', x); } return r; }; } else U.why = 'v1.2.14 link missing'; } catch (e) { ERR('hook', e); }
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && !DIM.cur && U.gal.length) d.v1216net = U.gal.map(g => g.at); } catch (_) {} return d; };
    const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && !d.dim) U.gal = Array.isArray(d.v1216net) ? d.v1216net.map(at => ({at})) : []; } catch (_) {} return r; }; } catch (e) { ERR('save', e); }
})();
