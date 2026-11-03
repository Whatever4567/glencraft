/* ===================== GLX-C206 (v1.0.41): water mobs off (flag), Admiral Skelp and his wool-sailed longship always there (new and existing worlds), old block boats cleared out of saves ===================== */
// FLAG: water mobs stay off unless localStorage 'glx_waterMobs' = '1' (or window.GLX_WATER_MOBS = true before load). Eggs still work.
// The longship is only ever the sailing ship (GLX-C191). In a save made before it existed, the old block-built longship (the spawn asset's, or the v1.0.21
// one in the channel) is found by matching its exact shape and taken away (only cells that still hold the ship's own blocks; never your placed blocks),
// and the sailing ship is put on open water there (or the nearest open water), so the Admiral turns up on his deck as in v1.0.36.
(function c206() {
  const U = window.__c206 = {water: false, oceanOff: 0, cleared: 0, made: 0, sk: 0, err: null, where: null};
  const warn = (w, e) => { U.err = w + ' ' + String(e && e.stack || e); };
  let on = false; try { on = window.GLX_WATER_MOBS === true || localStorage.getItem('glx_waterMobs') === '1'; } catch (_) {} U.water = on;
  const SWIM = new Set(['nm04', 'nm23', 'nm26', 'nm30', 'nm31', 'nm32', 'nm33', 'nm34', 'puffer', 'guardian']);
  function oceanOff() { try { const H0 = window.__c123 && __c123.HOMES; if (H0 && H0.ocean && H0.ocean.length) { H0.ocean = []; U.oceanOff++; } } catch (_) {} }
  if (!on) { oceanOff(); setInterval(oceanOff, 3000);
    try { const C = window.__c123, sk = C && C.spawnKind; if (sk) C.spawnKind = function (kind, x, y, z, o) { if (SWIM.has(kind) && !(o && o.home === 'egg') && !window.__egg && o && o.home === 'ocean') return null; return sk.apply(this, arguments); }; } catch (e) { warn('sk', e); } }
  // ---- the old block longship ----
  const SHL = () => (window.__c142 && __c142.SH) ? __c142.SH() : null;
  function origins() { const L = []; const g35 = !!(window.__c181 && __c181.on()), g36 = g35 && current && current.g36;
    L.push([(W >> 1) - 128 + 94, (D >> 1) - 124 + 4]); L.push([(W >> 1) - 80, Math.round(D * 0.227) - 7]); L.push([Math.round(W * 0.22) - 11, Math.round(D * 0.22) - 7]); return L; }
  function findOld(L) { let best = null; const by0 = 21 + 12;
    for (const [ox, oz] of origins()) for (let dx = -3; dx <= 3; dx++) for (let dz = -16; dz <= 16; dz++) for (let dy = -3; dy <= 3; dy++) { let m = 0, miss = 0; const bx = ox + dx, bz = oz + dz, by = by0 + dy;
      for (let i = 0; i < L.length; i += 4) { const [x, y, z, v] = L[i]; const X = bx + x, Y = by + y, Z = bz + z; if (X < 1 || Z < 1 || X >= W - 1 || Z >= D - 1 || Y < 1 || Y >= H - 1) { miss++; continue; } if (world[idx(X, Y, Z)] === v) m++; else miss++; if (miss > L.length / 8) break; }
      if (m >= L.length / 4 * 0.7 && (!best || m > best.m)) best = {bx, bz, by, m}; }
    return best; }
  function clearOld(L, f) { let n = 0; const chs = new Set();
    for (const [x, y, z, v] of L) { const X = f.bx + x, Y = f.by + y, Z = f.bz + z, i = idx(X, Y, Z); if (world[i] !== v || (placedSet && placedSet.has(i))) continue; world[i] = Y <= SEA ? T.WATER : T.AIR; n++;
      try { entMeta.delete(keyOf(X, Y, Z)); } catch (_) {} chs.add(Math.floor(X / CH) * 64 + Math.floor(Z / CH)); }
    try { for (const id of chs) if (chunkObjs.has(id)) dirtyCh.add(id); } catch (_) {} return n; }
  const wet = (x, z) => { const fx = Math.floor(x), fz = Math.floor(z); if (fx < 3 || fz < 3 || fx >= W - 3 || fz >= D - 3) return false; return getB(fx, SEA, fz) === T.WATER && getB(fx, SEA + 1, fz) === T.AIR && getB(fx, SEA + 3, fz) === T.AIR && getB(fx, SEA - 2, fz) === T.WATER; };
  const roomy = (cx, cz) => { for (let a = -13; a <= 13; a += 2) for (let b = -6; b <= 6; b += 2) if (!wet(cx + a, cz + b)) return false; return true; };
  function openWater(cx, cz) { if (roomy(cx, cz)) return [cx, cz]; for (let r = 4; r <= 220; r += 4) for (let k = 0, n = Math.max(8, Math.round(r * 1.5)); k < n; k++) { const a = k / n * 6.2832, x = Math.round(cx + Math.cos(a) * r), z = Math.round(cz + Math.sin(a) * r); if (roomy(x, z)) return [x, z]; } return null; }
  function sweep() { let n = 0; const chs = new Set(), y0 = Math.max(1, SEA - 3), y1 = Math.min(H - 1, SEA + 14);
    for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) for (let y = y0; y < y1; y++) { const i = idx(x, y, z); if (world[i] !== 173 || (placedSet && placedSet.has(i))) continue; world[i] = y <= SEA ? T.WATER : T.AIR; n++; chs.add(Math.floor(x / CH) * 64 + Math.floor(z / CH)); }
    try { for (const id of chs) if (chunkObjs.has(id)) dirtyCh.add(id); } catch (_) {} return n; }
  let saved = null, need = false, swept = false;
  function ensure() { const S = window.__c142 && __c142.sites; const b = S && S.boat; if (b && b.ship) return true;
    const L = SHL(); if (!L) return false; let f = null; try { f = findOld(L); } catch (e) { warn('find', e); }
    if (f) { U.cleared += clearOld(L, f); U.where = 'old ship ' + [f.bx, f.bz]; }
    const o = f ? [f.bx + 11, f.bz + 7] : (() => { const g = origins(), g35 = !!(window.__c181 && __c181.on()), g36 = g35 && current && current.g36; const q = g36 ? g[2] : g35 ? g[1] : g[0]; return [q[0] + 11, q[1] + 7]; })();
    const w = openWater(o[0], o[1]); if (!w) { U.where = 'no water'; return false; }
    const by = 21 + 12, bx = w[0] - 11, bz = w[1] - 7, ship = {bx, bz, by, cx: w[0], cz: w[1]}, has = new Set(L.map(([x, y, z]) => x + ',' + y + ',' + z)), dk = [];
    for (const [x, y, z, v] of L) if (v === 10 && !has.has(x + ',' + (y + 1) + ',' + z) && !has.has(x + ',' + (y + 2) + ',' + z) && by + y >= SEA) dk.push([bx + x + .5, by + y + 1, bz + z + .5]);
    dk.sort((p, q) => Math.hypot(p[0] - w[0], p[2] - w[1]) - Math.hypot(q[0] - w[0], q[2] - w[1]));
    const boat = {x: w[0], z: w[1], y: by + 9, deck: dk.slice(0, 12), ship};
    if (S) S.boat = boat; else { __c142.sites = {boat}; } saved = boat; U.made++; return true; }
  setInterval(() => { try { if (!need || typeof started === 'undefined' || !started || !current || DIM.cur || (window.__c105 && __c105.phase)) return; need = false; if (!swept) { swept = true; U.cleared += sweep(); } ensure(); } catch (e) { warn('ensure', e); } }, 600);
  try { const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && !d.dim && !DIM.cur) { saved = d.c206 && d.c206.boat || null; swept = !!(d.c206 && d.c206.sw); need = true;
          if (saved) { const S = window.__c142 && __c142.sites; if (!(S && S.boat && S.boat.ship)) { if (S) S.boat = saved; else __c142.sites = {boat: saved}; } } } } catch (e) { warn('apply', e); } return r; }; } catch (e) { warn('ap', e); }
  try { const ew = enterWorld; enterWorld = function (save) { if (!save) { saved = null; swept = true; need = true; } return ew.apply(this, arguments); }; } catch (e) { warn('ew', e); }
  try { const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && (saved || swept)) d.c206 = {boat: saved, sw: swept ? 1 : 0}; } catch (_) {} return d; }; } catch (e) { warn('ser', e); }
  setInterval(() => { try { if (!saved || need || typeof started === 'undefined' || !started || DIM.cur) return; const S = window.__c142 && __c142.sites; if (S && S.boat && S.boat.ship) return; if (S) S.boat = saved; else __c142.sites = {boat: saved}; } catch (_) {} }, 15000);
  // ---- the Admiral: if his slot stays empty while his live ship is near, put him on deck (past the night-mob cap) ----
  let gone = 0;
  setInterval(() => { try { const C3 = window.__c143, sh = window.__c191 && __c191.ship; if (!C3 || !C3.slots || !sh || sh.dead || DIM.cur || typeof started === 'undefined' || !started || paused || dead) { gone = 0; return; }
      if (MODE && MODE.name === 'creative') return; const S = __c142.sites, b = S && S.boat; if (!b || !b.deck || !b.deck.length || Math.hypot(P.x - b.x, P.z - b.z) >= 50) { gone = 0; return; }
      let s = C3.slots.get('skelp'); if (!s) C3.slots.set('skelp', s = {a: [], cd: 0}); s.a = s.a.filter(a => a && mobs.indexOf(a) >= 0 && a.g && a.g.parent); if (s.a.length) { gone = 0; return; }
      if (++gone < 8) return; gone = 0; const p = b.deck[0], a = __c123.spawnKind('nm12', Math.floor(p[0]), Math.floor(p[1]), Math.floor(p[2]), {grp: Math.random(), home: 'spec'});
      if (a) { a.g.position.set(p[0], p[1], p[2]); a.egg = true; a.spec = 'skelp'; a.post = p; s.a.push(a); U.sk++; } } catch (e) { warn('skelp', e); } }, 1000);
})();
