/* GLX-C332 (v1.1.37): THE HOLLOW EARTH. Under a thick crust the round Earth is hollow: a huge space with green land, lakes and seas on the
   inside of the shell, where down points outwards onto the shell. Agartha is a city in a cavern in the crust, right under the pyramid:
   a long drop shaft runs from the floor of the pyramid hall down through the crust and comes out through the jagged rock ceiling over the
   city, into a pool on top of the middle tower. The city is dark brutalist towers of deepslate and grey concrete with glowing windows,
   ringed by a belt of sea held back by big glass aquarium windows. A glowing lift pad on the city floor takes you down to the inside of
   the shell (and back up again). An ice wall rings the land round the lift. All of it is worked out on the fly from the spot (nothing
   stored but what you change), and it is only drawn near you. The old Agartha tunnel and city past the ice wall are gone. */
(function c332() {
  const U = window.__c332 = {err: null, lifts: 0, carved: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const E = () => window.__c320, R = () => (E() && E().R) || 5000;
  const HR = U.HR = () => R() - 1000, CF = U.CF = () => { if (E() && E().flat) return SEA - 780 - E().E()[1]; if (!SH) return R() - 780; if (SH.cf) return SH.cf; const c = E().E(), h2 = (SH.x - c[0]) ** 2 + (SH.z - c[2]) ** 2; return (SH.cf = Math.round(Math.sqrt(Math.max(1, (R() - 780) ** 2 - h2)))); }, CRr = U.CRr = 110, HC = 80;
  U.inner = r => r < HR() + 100;
  const S = Math.sin;
  // where the shaft is: the middle of the pyramid hall
  let SH = null; U.SH = () => SH;
  // v1.1.40: ALL of Agartha (the city, the hollow lift, the aquarium and the way in) is under the NORTH POLE of the real Earth, out of the way.
  // The way in is a round hole in a flat snowy island right on the pole. The desert pyramid shaft is a second way in (it takes you to the city).
  function pole() { const W9 = window.__c329, e = E(); if (!W9 || !W9.ll || !e) return null; const lat = n => W9.ll(n[0], n[1], n[2])[0];
    let n = [0, 1, 0], best = lat(n); for (let s = 0.3; s > 2e-6; s *= 0.6) { let moved = true; for (let it = 0; it < 40 && moved; it++) { moved = false;
      for (const d of [[s, 0, 0], [-s, 0, 0], [0, 0, s], [0, 0, -s], [0, s, 0], [0, -s, 0]]) { const m = [n[0] + d[0], n[1] + d[1], n[2] + d[2]], l = Math.hypot(m[0], m[1], m[2]); m[0] /= l; m[1] /= l; m[2] /= l; const v = lat(m); if (v > best) { best = v; n = m; moved = true; } } } }
    if (best < 85) return null; const c = e.E(), Rr = R(); return {x: Math.round(c[0] + n[0] * Rr), z: Math.round(c[2] + n[2] * Rr), top: Math.round(c[1] + n[1] * Rr) + 12, n, lat: best}; }
  function findSH() { try { if (!(window.__c317 && __c317.on())) return null; const e = E(); if (e && e.flat && e.FP) return {x: e.FP[0], z: e.FP[1], top: SEA + 4, lat: 90, n: [0, 1, 0]}; return pole(); } catch (_) { return null; } }
  let PY = null; U.PY = () => PY;
  function findPY() { try { const o = window.__c239 && __c239.pyr; if (!o) return null; const q = o.L(-0.5, 0); return {x: Math.round(q[0]), z: Math.round(q[1]), hy: o.hy}; } catch (_) { return null; } }
  // the flat island on the pole with the hole down to the city (blocks you change there are kept as usual)
  U.pit = (x, y, z) => { if (!SH) return undefined; const hx = x - SH.x, hz = z - SH.z, d2 = hx * hx + hz * hz; if (d2 > 272) return undefined; const t = SH.top, m = Math.max(Math.abs(hx), Math.abs(hz));
    if (m <= 1) return 0; if (y >= t) return 0; if (y === t - 1) return m === 2 ? LAMP() : (T.SNOW && T.SNOW !== 178 ? T.SNOW : T.PACKSNOW || T.STONE); return y > t - 4 ? (T.DIRT) : T.STONE; };
  // the towers (fixed from the spot)
  let TW = null, twFor = '';
  function towers() { const k = SH ? SH.x + ',' + SH.z : ''; if (TW && twFor === k) return TW; twFor = k; let s = 0x5a17 + (SH ? SH.x * 31 + SH.z * 17 : 0); const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
    TW = [{x: 0, z: 0, w: 6, h: 50, m: 0, pool: 1}]; for (let i = 0; i < 26 && TW.length < 13; i++) { const a = rnd() * 6.283, rr = 30 + rnd() * 62, w = 3 + Math.floor(rnd() * 5), t = {x: Math.round(Math.cos(a) * rr), z: Math.round(Math.sin(a) * rr), w, h: 22 + Math.floor(rnd() * 40), m: i & 1};
      if (Math.hypot(t.x, t.z) + w * 1.5 > CRr - 8) continue; if (Math.abs(t.x - 14) < w + 4 && Math.abs(t.z) < w + 4) continue; if (TW.some(o => Math.abs(o.x - t.x) < o.w + w + 4 && Math.abs(o.z - t.z) < o.w + w + 4)) continue; TW.push(t); }
    return TW; }
  U.towers = () => towers();
  const DS = () => T.DEEPSLATE || T.STONE, CO = () => T.SLATE || T.CONCRETE || T.STONE, DB = () => T.DSBRICK || DS(), BK = () => T.BLACKSTONE || DS(), LAMP = () => T.GLOWROCK || T.LAMP, GL = () => T.GLASS, ICE = () => T.PACKSNOW || T.ICE || T.SNOW;
  const crust = (x, y, z, r) => window.__c334 ? __c334.deep(x, y, z, R() - r, x + 0.5 - E().E()[0], y + 0.5 - E().E()[1], z + 0.5 - E().E()[2]) : ((x * 7 + y * 13 + z * 5) & 15) ? DS() : T.STONE;
  // the land on the inside of the shell: height towards the middle (negative = lake or sea bed)
  function ig(px, py, pz, lo) { if (SH && py > E().E()[1]) { const du = px - (SH.x + 14), dv = pz - SH.z; if (du * du + dv * dv < 36) return 2; }
    return 1.5 + 4 * S(px * 0.009 + py * 0.004 + 1) * S(pz * 0.008 - py * 0.005 + 2) + 1.2 * S(px * 0.037 - pz * 0.029 + py * 0.021) + (lo ? 0 : 0.6 * S(px * 0.11 + pz * 0.07 - py * 0.05)); }
  U.ig = ig;
  function inner(x, y, z, dx, dy, dz, r) { const c = E().E(), q = HR() / r, a = HR() - r, g = ig(c[0] + dx * q, c[1] + dy * q, c[2] + dz * q);
    if (dy > 0 && dy >= Math.abs(dx) && dy >= Math.abs(dz) && SH) { const hd = Math.hypot(x - SH.x, z - SH.z); /* v1.1.40: no ice ring */
      if (Math.abs(x - SH.x - 14) <= 1 && Math.abs(z - SH.z) <= 1 && a < g && a >= g - 1) return T.GLOWROCK || LAMP(); }
    if (a < g) { const dd = g - a; if (dd < 1) return g < 0.6 ? T.SAND : T.GRASS; if (dd < 4) return g < 0.6 ? T.SAND : T.DIRT; return dd > 40 ? DS() : T.STONE; }
    if (a < 0) return T.WATER; return 0; }
  function city(x, y, z, r) { const hx = x - SH.x, hz = z - SH.z, hd = Math.hypot(hx, hz), yy = y + 0.5 - E().E()[1] - CF();   // the city floor is flat
    if (hd >= CRr + 14) return undefined;
    if (hd >= CRr + 2) return yy >= 0 && yy <= 26 ? T.WATER : DS();
    if (hd >= CRr) { const an = Math.atan2(hz, hx) * CRr; return yy >= 1 && yy <= 24 && ((an % 9) + 9) % 9 > 1 && yy % 9 ? GL() : DS(); }
    if (yy < 0) { if (yy > -1.5) { if (Math.abs(hx - 14) <= 1 && Math.abs(hz) <= 1) return T.GLOWROCK || LAMP(); return (Math.round(hd) % 18 === 0 || (Math.abs(hx) % 24 === 0 && Math.abs(hz) < 4)) ? LAMP() : CO(); } return DS(); }
    const jag = 6 + 5 * Math.abs(S(x * 0.21) * S(z * 0.17)) + 4 * Math.abs(S(x * 0.07 + z * 0.05)), ceil = HC - jag - Math.max(0, hd - CRr + 34) * 0.7;
    if (Math.abs(hx) <= 1 && Math.abs(hz) <= 1 && yy > 50) return 0;
    if (yy >= ceil) return BK();
    for (const t of towers()) { const ox = hx - t.x, oz = hz - t.z; if (Math.abs(ox) > t.w || Math.abs(oz) > t.w || yy >= t.h) continue;
      if (t.pool && yy >= t.h - 6 && Math.abs(ox) < t.w && Math.abs(oz) < t.w) return T.WATER;
      const edge = Math.abs(ox) === t.w || Math.abs(oz) === t.w, al = Math.abs(ox) === t.w ? oz : ox; if (edge && yy % 4 === 2 && ((al % 3) + 3) % 3 === 1 && yy < t.h - 2) return LAMP(); return t.m ? CO() : DB(); }
    return 0; }
  function hol(x, y, z, dx, dy, dz, r) { try { if (r < HR() - 45) return 0; if (r < HR() + 70) return inner(x, y, z, dx, dy, dz, r); if (!SH) return crust(x, y, z, r);
      const top = dy > 0 && dy >= Math.abs(dx) && dy >= Math.abs(dz), yy = y + 0.5 - E().E()[1] - CF();
      if (top && Math.abs(x - SH.x) <= 1 && Math.abs(z - SH.z) <= 1 && yy > 52) return 0;   // the drop shaft
      if (top && yy > -4 && yy < HC + 2) { const c = city(x, y, z, r); if (c !== undefined) return c; }
      return crust(x, y, z, r); } catch (e) { ERR('hol', e); return 0; } }
  // the shaft through the map itself, from the hall floor down to the bottom of the map (made once per world; never your own blocks)
  function carve() { const SH = PY; if (!SH) return; let n = 0; for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) for (let y = 0; y < SH.hy; y++) { const X = SH.x + x, Z = SH.z + z, i = idx(X, y, Z);
        try { if (typeof placedSet !== 'undefined' && placedSet.has(i)) continue; } catch (_) {} if (world[i]) { world[i] = 0; n++; } }
    for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) if (Math.abs(x) === 2 || Math.abs(z) === 2) { const i = idx(SH.x + x, SH.hy - 1, SH.z + z); try { if (typeof placedSet !== 'undefined' && placedSet.has(i)) continue; } catch (_) {} if (world[i] && world[i] !== LAMP()) { world[i] = LAMP(); n++; } }
    U.carved = n; try { for (const [x, z] of [[-2, -2], [2, 2], [-2, 2], [2, -2]]) markDirty(SH.x + x, SH.z + z); } catch (_) {} try { E().edgeClr && E().edgeClr(); E().dirty = 1; } catch (_) {} }
  let lastW = null;
  setInterval(() => { try { if (typeof started === 'undefined' || !started || DIM.cur) return; if (world !== lastW || !SH) { const s = findSH(); if (s) { lastW = world; SH = s; U.pole = s; PY = findPY(); carve(); if (E()) { E().pit = U.pit; E().dirty = 1; } if (window.__c324 && __c324.cache) __c324.cache.clear(); } } if (PY && window.__c239 && __c239.pyr && __c239.pyr.volcano) PY = null; if (E() && !E().hol) E().hol = hol; } catch (e) { ERR('sh', e); } }, 1000);
  U.hol = hol;
  // where you are: 'city', 'hollow', 'shaft' or ''
  U.where = () => { try { const f = window.__c321, w = f ? f.pw() : {x: P.x, y: P.y, z: P.z}, e = E(); if (!e || !(window.__c317 && __c317.on())) return ''; const c = e.E(), r = e.flat ? R() + (w.y - SEA) : Math.hypot(w.x - c[0], w.y - c[1], w.z - c[2]), yy = w.y - c[1] - CF();
      if (r < HR() + 100) return 'hollow'; if (SH && Math.hypot(w.x - SH.x, w.z - SH.z) < CRr + 16 && yy < HC + 4 && yy > -6) return 'city'; if (SH && Math.hypot(w.x - SH.x, w.z - SH.z) < 4 && w.y < SH.top - 30) return 'shaft'; if (PY && Math.hypot(w.x - PY.x, w.z - PY.z) < 4 && w.y < PY.hy - 6) return 'shaft'; if (r < R() - 330) return 'deep'; return ''; } catch (_) { return ''; } };
  // the lift between the city floor and the inside of the shell
  let pad = 0;
  function liftDown() { const e = E(), c = e.E(), f = __c321; f.leave(); const X = SH.x + 14, Z = SH.z; let fy = null;
    if (e.flat) { for (let y = SEA - 1000; y > SEA - 1460; y--) { if (e.earth(X, y, Z) && !e.earth(X, y + 1, Z) && !e.earth(X, y + 2, Z)) { P.x = X + 0.5; P.z = Z + 0.5; P.y = y + 1; P.vy = 0; P.fallTop = null; U.lifts++; try { toast('Down the lift to the inside of the Earth'); } catch (_) {} return; } } return; }
    const h2 = (X + 0.5 - c[0]) ** 2 + (Z + 0.5 - c[2]) ** 2; for (let y = Math.floor(c[1] + Math.sqrt((HR() + 12) ** 2 - h2)); y > c[1] + Math.sqrt((HR() - 50) ** 2 - h2); y--) { const b = e.earth(X, y, Z), a1 = e.earth(X, y - 1, Z), a2 = e.earth(X, y - 2, Z); if (b && b !== T.WATER && !a1 && !a2) { fy = y; break; } }
    if (fy === null) return; P.x = X + 0.5; P.z = Z + 0.5; P.y = fy - 1.8; P.vy = 0; P.fallTop = null; f.setFrame('earth', c, 3); U.lifts++; try { toast('Down the lift to the inside of the Earth'); } catch (_) {} }
  U.toCity = () => { if (!SH) return false; liftUp(); P.x -= 7; pad = -40; return true; };   /* v1.1.38: the Agartha teleport */
  function liftUp() { const f = __c321; f.leave(); P.x = SH.x + 14.5; P.z = SH.z + 0.5; P.y = Math.round(E().E()[1] + CF()) + 0.5; P.vy = 0; P.fallTop = null; U.lifts++; try { toast('Up the lift to Agartha'); } catch (_) {} }
  setInterval(() => { try { if (!SH || !started || DIM.cur || paused || dead) { pad = 0; return; } const w = U.where(), f = __c321, q = f.pw(); let on = false;
      if (Math.abs(q.x - SH.x - 14.5) < 1.6 && Math.abs(q.z - SH.z - 0.5) < 1.6) { const c = E().E(), r = Math.hypot(q.x - c[0], q.y - c[1], q.z - c[2]); on = (w === 'city' && Math.abs(q.y - c[1] - CF()) < 2.5) || (E().flat && w === 'hollow') || (w === 'hollow' && r > HR() - 12 && r < HR() + 2); }
      pad = on ? pad + 1 : 0; if (pad === 6) { pad = -20; if (w === 'city') liftDown(); else liftUp(); } } catch (e) { ERR('lift', e); } }, 200);
  setInterval(() => { try { if (!PY || !SH || !started || DIM.cur || paused || dead) return; const q = __c321.pw(); if (Math.abs(q.x - PY.x - 0.5) < 1.8 && Math.abs(q.z - PY.z - 0.5) < 1.8 && q.y < PY.hy - 8 && q.y > -60) { liftUp(); P.x -= 7; P.vy = 0; P.fallTop = null; pad = -40; U.pyrIn = (U.pyrIn || 0) + 1; try { toast('Down the pyramid shaft to Agartha'); } catch (_) {} } } catch (e) { ERR('pyr', e); } }, 100);
  // the old Agartha past the ice wall is gone: the north is open sea again (your own changes there are kept)
  try { const C4 = window.__c294; if (C4 && C4.genExt) C4.genExt = function (o) { const FL = SEA - 15, col = new Uint8Array(H); col[0] = T.DEEPSLATE || T.STONE; for (let y = 1; y < SEA; y++) col[y] = y <= FL ? T.STONE : y <= FL + 3 ? T.SAND : T.WATER;
      for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) world[(x * H + y) * D + z] = col[y];
      const cx = W >> 1; return {city: [cx, D - 60, 0], FL: SEA + 30, TOP: -100, spires: [], path: [[cx, SEA + 30, D - 1], [cx, SEA + 30, D - 60]]}; }; } catch (e) { ERR('ext', e); }
})();
