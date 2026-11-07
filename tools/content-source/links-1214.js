/* GLX-V1214 (v1.2.14): links the v1.2.12 Watcher bowl to the cave network the world already generated, for NEW worlds only.
   Everything stays inside y 3-21 (no depth change, nothing at/below the bowl floor line y 3, nothing near the surface or the
   Agartha cave). A winding tunnel (3 high, ~3 wide) leaves the bowl's east-facing side at y 6 and climbs gently to the nearest
   natural cave air within 70 blocks. Two modest chambers sit on the way:
     1) "Falls hall": a lava fall down the wall (only where there is >= 5 blocks of clear height) into a small sunk pool and a
        short lava runnel along the side wall (walkway kept dry).
     2) "Ruin hall": a 3-deep trench with lava at its bottom, crossed by a ruined Watcher-brick bridge with a broken parapet
        and a cracked arch over it.
   A Watcher-brick arch marks both tunnel mouths. Only cells inside the bounded tunnel/chamber shapes are changed (ores
   outside them are untouched), and existing saves load their own world unchanged. Plain blocks only: no entities or lights.
   v1.2.14 safety pass: the game's GLX-G2 flow really moves lava (into air below and sideways) once a cell is queued, so every
   placed lava cell is sealed: solid Ember basalt under it and beside it, and Glass on the faces that show the fall into the hall.
   The tunnel will not open next to water or lava that was already there. Agartha's in-map footprint (GLX-C294 mouth record
   __c294.M, its map-edge mouth, the run between them, and the GLX-C307 route if known) is kept 45 blocks clear; if that record is
   not ready when the world is generated (or the big round Earth is on), no link is made at all. */
(function v1214() {
  const U = window.__v1214 = {err: null, link: null, why: null, cells: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const Y0 = 3, Y1 = 21, BR = 774, BAS = 772;
  const inb = (x, y, z) => x > 1 && z > 1 && x < W - 2 && z < D - 2 && y >= Y0 && y <= Y1;
  const fluid = v => v === T.WATER || v === T.LAVA || (T.STILL_WATER != null && v === T.STILL_WATER);
  const roofed = (x, y, z) => { for (let k = y + 1; k < Math.min(H, y + 40); k++) { const v = world[idx(x, k, z)]; if (v !== T.AIR) return !fluid(v); } return false; };
  function set(x, y, z, v) { if (!inb(x, y, z)) return; const i = idx(x, y, z); if (world[i] === v || world[i] === 211) return; world[i] = v; U.cells++; }
  let KEEP = [], LAVA = [];
  const kept = (x, z) => KEEP.some(k => Math.hypot(x - k[0], z - k[1]) < 45);
  const wetNb = (x, y, z) => [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0],[0,-1,0]].some(([a, b, c]) => { const X = x + a, Y = y + b, Z = z + c; return X >= 0 && Z >= 0 && X < W && Z < D && Y >= 0 && Y < H && fluid(world[idx(X, Y, Z)]); });
  function hollow(x, y, z) { if (!inb(x, y, z) || kept(x, z)) return; const v = world[idx(x, y, z)]; if (fluid(v) || wetNb(x, y, z) || !roofed(x, y, z)) return; set(x, y, z, T.AIR); }
  function lava(x, y, z) { if (!inb(x, y, z) || kept(x, z)) return; set(x, y, z, T.LAVA); if (world[idx(x, y, z)] === T.LAVA) LAVA.push([x, y, z]); }
  function seal(show) { for (const [x, y, z] of LAVA) for (const [a, b, c] of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,-1,0]]) { const X = x + a, Y = y + b, Z = z + c;
      if (X < 0 || Z < 0 || X >= W || Z >= D || Y < 1) continue; const v = world[idx(X, Y, Z)]; if (v === T.LAVA) continue;
      if (v === T.AIR || fluid(v) || !(typeof solid === 'function' ? solid(X, Y, Z) : true)) { world[idx(X, Y, Z)] = (show && show(x, y, z) && b === 0 && T.GLASS != null) ? T.GLASS : BAS; U.cells++; } } }
  function agKeep() { // real Agartha footprint inside the map, from GLX-C294 / GLX-C307; null = unknown -> fail closed
    try { if (window.__c317 && __c317.on()) return null; } catch (_) { return null; }
    const A = window.__c294, M = A && A.M; if (!M || !Number.isFinite(M.x) || !Number.isFinite(M.z)) return null;
    const k = [[M.x, M.z]], e = M.e, c = M.c, edge = e === 'N' ? [c, 0] : e === 'S' ? [c, D - 1] : e === 'W' ? [0, c] : e === 'E' ? [W - 1, c] : null;
    if (edge) for (let f = 0; f <= 1.0001; f += 0.1) k.push([edge[0] + (M.x - edge[0]) * f, edge[1] + (M.z - edge[1]) * f]);
    try { const r = window.__c307 && __c307.route; if (Array.isArray(r)) for (const p of r) if (p[2] >= -45 && p[2] < D + 45) k.push([p[0], p[2]]); } catch (_) {}
    return k; }
  function blob(cx, cy, cz, rx, ry, rz, fl) { for (let x = Math.floor(cx - rx); x <= cx + rx; x++) for (let z = Math.floor(cz - rz); z <= cz + rz; z++) for (let y = Math.max(fl, Math.floor(cy - ry)); y <= cy + ry; y++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2; if (d <= 1) hollow(x, y, z); } }
  function arch(x, z, fl, ax, h) { // pillars 2 either side across axis ax ([1,0]/[0,1]), lintel on top
    const px = ax[1], pz = ax[0]; for (const s of [-2, 2]) for (let y = fl; y < fl + h; y++) set(x + px * s, y, z + pz * s, BR);
    for (let s = -2; s <= 2; s++) set(x + px * s, fl + h, z + pz * s, BR); }
  function natAir(cx, cz, eyeR, avoid) { let best = null, bd = 1e9; // nearest roofed, non-fluid cave air outside the bowl
    for (let x = Math.max(3, cx - 70); x <= Math.min(W - 4, cx + 70); x++) for (let z = Math.max(3, cz - 70); z <= Math.min(D - 4, cz + 70); z++) {
      const d = Math.hypot(x - cx, z - cz); if (d < eyeR + 12 || d >= bd) continue; if (kept(x, z)) continue;
      for (let y = 6; y <= 19; y++) { if (world[idx(x, y, z)] !== T.AIR || world[idx(x, y + 1, z)] !== T.AIR) continue; const fv = world[idx(x, y - 1, z)]; if (fv === T.AIR || fluid(fv) || !roofed(x, y + 1, z)) continue; bd = d; best = [x, y, z]; break; } }
    return best; }
  U.agKeep = agKeep; U.kept = (x, z) => { const K = agKeep(); return !K ? null : K.some(k => Math.hypot(x - k[0], z - k[1]) < 45 + 14); };
  U.build = (e) => { if (!e) { U.why = 'no Watcher bowl in this world'; return null; } const cx = Math.floor(e[0]), cz = Math.floor(e[2]), R0 = 13;
    const K = agKeep(); if (!K) { U.why = 'Agartha footprint (GLX-C294 mouth) not known at generation - no link made'; return null; } KEEP = K; LAVA = [];
    if (kept(cx, cz)) { U.why = 'Watcher bowl lies inside the Agartha keep-out'; return null; }
    const tgt = natAir(cx, cz, R0, null); if (!tgt) { U.why = 'no natural cave air within 70 blocks of the bowl (y 6-19)'; return null; }
    const dir = Math.atan2(tgt[2] - cz, tgt[0] - cx), sx = cx + Math.cos(dir) * (R0 - 2), sz = cz + Math.sin(dir) * (R0 - 2);
    const len = Math.hypot(tgt[0] - sx, tgt[2] - sz), nx = -Math.sin(dir), nz = Math.cos(dir), path = [];
    for (let s = 0; s <= len; s += 0.5) { const f = s / len, w = Math.sin(f * Math.PI * 2) * Math.min(6, len / 8) * Math.sin(f * Math.PI);
      const x = sx + (tgt[0] - sx) * f + nx * w, z = sz + (tgt[2] - sz) * f + nz * w, fl = Math.round(6 + (tgt[1] - 6) * f); path.push([x, fl, z]);
      for (let ox = -1.5; ox <= 1.5; ox += 0.5) for (let oz = -1.5; oz <= 1.5; oz += 0.5) { if (ox * ox + oz * oz > 2.4) continue; for (let y = fl; y < fl + 3; y++) hollow(Math.round(x + ox), y, Math.round(z + oz)); } }
    const at = f => path[Math.min(path.length - 1, Math.round(f * (path.length - 1)))], ax = Math.abs(Math.cos(dir)) > Math.abs(Math.sin(dir)) ? [1, 0] : [0, 1];
    const halls = [];
    if (len >= 26) { // falls hall
      const [hx, hf, hz] = at(0.35), x = Math.round(hx), z = Math.round(hz); blob(x, hf + 2.5, z, 6, 3.5, 6, hf); halls.push('falls');
      const wx = Math.round(x + nx * 5), wz = Math.round(z + nz * 5); let top = hf; while (top < Math.min(Y1, hf + 8) && world[idx(wx, top + 1, wz)] === T.AIR) top++;
      if (top - hf >= 4) { for (let y = hf; y <= top; y++) lava(wx, y, wz); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) lava(wx + a, hf - 1, wz + b); // fall + sunk pool
        for (let s = 2; s <= 7; s++) lava(Math.round(wx + Math.cos(dir) * s), hf - 1, Math.round(wz + Math.sin(dir) * s)); U.fall = [wx, hf, wz, top]; }
    }
    if (len >= 18) { // ruin hall with trench + bridge
      const [hx, hf, hz] = at(len >= 26 ? 0.68 : 0.5), x = Math.round(hx), z = Math.round(hz); blob(x, hf + 2.5, z, 6, 3.5, 6, hf); halls.push('ruin');
      const ux = Math.cos(dir), uz = Math.sin(dir); for (let s = -1; s <= 1; s++) for (let w = -5; w <= 5; w++) { const tx = Math.round(x + ux * s + nx * w), tz = Math.round(z + uz * s + nz * w);
        for (let y = Math.max(Y0 + 1, hf - 3); y < hf; y++) { if (y === Math.max(Y0 + 1, hf - 3)) lava(tx, y, tz); else if (!kept(tx, tz)) set(tx, y, tz, T.AIR); } }
      for (let s = -3; s <= 3; s++) for (let w = -1; w <= 1; w++) set(Math.round(x + ux * s + nx * w), hf - 1, Math.round(z + uz * s + nz * w), BR); // bridge deck
      for (let s = -3; s <= 3; s++) { if (s !== 1) set(Math.round(x + ux * s + nx * 2), hf, Math.round(z + uz * s + nz * 2), BR); if (s < 0) set(Math.round(x + ux * s - nx * 2), hf, Math.round(z + uz * s - nz * 2), BR); } // broken parapet
      for (let y = hf; y < hf + 4; y++) { set(Math.round(x + ux * 3 + nx * 2), y, Math.round(z + uz * 3 + nz * 2), BAS); if (y < hf + 2) set(Math.round(x + ux * 3 - nx * 2), y, Math.round(z + uz * 3 - nz * 2), BAS); } // cracked arch: one pillar fallen short
      for (let w = -1; w <= 2; w++) set(Math.round(x + ux * 3 + nx * w), hf + 4, Math.round(z + uz * 3 + nz * w), BR);
    }
    const fl = U.fall; seal(fl ? (x, y, z) => x === fl[0] && z === fl[2] && y >= fl[1] : null); U.lava = LAVA.length;
    const [mx, mf, mz] = at(0.02), [ex, ef, ez] = at(0.97); arch(Math.round(mx), Math.round(mz), mf, ax, 3); arch(Math.round(ex), Math.round(ez), ef, ax, 3);
    U.link = {from: [Math.round(sx), 6, Math.round(sz)], to: tgt, len: Math.round(len), halls}; try { if (current) current.v1214link = U.link; } catch (_) {} return U.link; };
  try { const g = generate; generate = function () { const r = g.apply(this, arguments); try { U.link = null; U.why = null; U.cells = 0; if (!DIM.cur && !cityGen && H >= 40 && window.__v1212) U.build(__v1212.eye); } catch (e) { ERR('gen', e); } return r; }; } catch (e) { ERR('gw', e); }
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && !DIM.cur && U.link) d.v1214link = U.link; } catch (_) {} return d; };
    const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && !d.dim) U.link = d.v1214link || null; } catch (_) {} return r; }; } catch (e) { ERR('save', e); }
})();
