/* GLX-V1300: EVERY VOLCANO ERUPTS, FROM THE GROUND. The one eruptable volcano used an old saved spot (an earlier Highlands stamp) that no
   longer has a cone under it, so its fountain, ash and lava bombs hung in mid-air over the land. Now every lava crater on the UK map
   (all 38 C342 craters) is its own eruptable volcano, anchored to its real crater floor and rim read from the terrain, plus a bigger
   volcano, Ben Glencraft, back near spawn (south of the village, well clear of it). The old stamp is kept in the save as c229legacy.
   New eruption, a natural disaster instead of an explosion: low rumble and a subtle distance-scaled shake, the crater lava sinks,
   pauses, surges back up and gushes out of the top as a thick lava jet under a black mushroom ash cloud, then pours over the rim and
   floods far down the slopes in lava fronts for minutes, then cools to magma crust, basalt and obsidian. No flash, no blast, no bombs.
   Sound is WebAudio only: brown-noise rumble, a gushing roar, gurgling lava and soft low booms, all fading with distance.
   Budgeted: block work is capped per frame and time-sliced; one draw call each for the jet, spray and ash. Never touches your builds,
   never enters the spawn pad / village disc, never pours into water (it quenches to obsidian). The Element 115 blue eruption still
   works through the same machine. Research notes: qa t1282 research.md. */
(function v1300(G) {
  const U = G.__v1300 = {err: null, on: 0, sites: 0, ph: 'idle', site: -1, lava: 0, fronts: 0, maxReach: 0, steps: 0, cooled: 0, quench: 0,
    blocked: 0, prot: 0, shakeMax: 0, ms: 0, msMax: 0, frames: 0, phases: [], built: 0, booms: 0, bombs: 0, speed: 1, legacy: 0, ver: 1};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const LOW = () => { try { return (typeof touchMode !== 'undefined' && !!touchMode) || (typeof PERF !== 'undefined' && !!PERF); } catch (_) { return false; } };
  const SPAWN_V = U.SPAWN_V = {x: 480, z: 611, r: 56, h: 46, rc: 9};   // the old spawn volcano stood south of spawn; now ~185 out
  const PROT_R = U.PROT_R = 112;                                         // spawn pad + village: lava never enters
  const DUR = U.DUR = {rumble: 4, sink: 6, pause: 3, surge: 3, gush: 26, pour: 22, flood: 150, cool: 200};
  const ORDER = ['rumble', 'sink', 'pause', 'surge', 'gush', 'pour', 'flood', 'cool'];
  const REST = 240, SHAKE_CAP = U.SHAKE_CAP = 0.05;
  const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
  const flat = () => { try { return !!(G.__c320 && __c320.flat); } catch (_) { return false; } };
  const live = () => { try { return flat() && !DIM.cur && typeof current !== 'undefined' && !!current; } catch (_) { return false; } };
  Object.defineProperty(U, 'active', {get() { return live(); }});
  const inMap = (x, y, z) => x >= 0 && z >= 0 && x < W && z < D && y >= 0 && y < H;
  const gb = (x, y, z) => inMap(x, y, z) ? world[idx(x, y, z)] : getB(x, y, z);
  const soft = b => !b || b === T.FIRE || PLANT[b] === 1 || !!LEAFY[b] || !!LOGGY[b];
  const mine = (x, y, z) => { try { return inMap(x, y, z) && typeof placedSet !== 'undefined' && placedSet.has(idx(x, y, z)); } catch (_) { return false; } };
  function spawnXZ() { try { const s = (typeof g9spawn !== 'undefined' && g9spawn) || null; if (s && s.length) return [s[0], s[2]]; } catch (_) {}
    try { if (spawnPt) return [spawnPt.x !== undefined ? spawnPt.x : spawnPt[0], spawnPt.z !== undefined ? spawnPt.z : spawnPt[2]]; } catch (_) {} return [W >> 1, D >> 1]; }
  const protXZ = (x, z) => { const s = spawnXZ(); return Math.hypot(x - s[0], z - s[1]) < PROT_R; };
  U.protXZ = protXZ; U.spawnXZ = spawnXZ;
  // surface: highest ground, water or lava block (plants and trees are ignored)
  function surf(x, z, hint) { let y = hint == null ? H - 2 : Math.min(H - 2, hint + 10);
    if (hint != null) { let g = 0; while (y < H - 2 && !soft(gb(x, y, z)) && g++ < 20) y = Math.min(H - 2, y + 6); }
    for (; y > 1; y--) if (!soft(gb(x, y, z))) return y; return 0; }
  U.surf = surf;
  // ---------- sites: all 38 lava craters + Ben Glencraft ----------
  let SITES = null;
  const NAMES = {'56.42': 'Mull', '56.72': 'Ardnamurchan'};
  function sites() { if (SITES) return SITES; const C = G.__c342; if (!C || !C.craters) return [];
    const cr = C.craters(); if (!cr || !cr.length) return [];
    SITES = cr.map((v, i) => ({i, k: 'v', name: NAMES[String(v.la)] || 'old volcano', x: Math.round(v.x), z: Math.round(v.z), r: v.r, h: v.h, rc: Math.max(3, Math.round(v.r * 0.2)), br: Math.max(4, Math.round(v.r * 0.3)), a: null}));
    SITES.push({i: SITES.length, k: 'S', name: 'Ben Glencraft', x: SPAWN_V.x, z: SPAWN_V.z, r: SPAWN_V.r, h: SPAWN_V.h, rc: SPAWN_V.rc, br: SPAWN_V.rc, a: null});
    U.sites = SITES.length; return SITES; }
  U.list = () => sites().map(s => ({i: s.i, k: s.k, name: s.name, x: s.x, z: s.z, r: s.r, h: s.h, rc: s.rc}));
  // anchor read from the terrain: vent (crater lava/floor), rim (lowest point of the rim = spill side), base (ground round the foot)
  function anchor(s, fresh) { if (s.a && !fresh) return s.a;
    const vent = surf(s.x, s.z); let rimMin = 1e9, rimMax = 0, spill = []; const R1 = Math.max(s.rc + 1, Math.round(s.r * 0.36) + 1);
    for (let k = 0; k < 16; k++) { const a = k / 16 * 6.2832; let m = 0, at = null; for (let rr = s.rc + 1; rr <= R1; rr++) { const x = Math.round(s.x + Math.sin(a) * rr), z = Math.round(s.z + Math.cos(a) * rr), t = surf(x, z, vent + 4); if (t > m) { m = t; at = [x, z]; } }
      if (m < rimMin) rimMin = m; if (m > rimMax) rimMax = m; spill.push({a, y: m, x: at ? at[0] : s.x, z: at ? at[1] : s.z}); }
    const bs = []; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832; bs.push(surf(Math.round(s.x + Math.sin(a) * s.r * 1.05), Math.round(s.z + Math.cos(a) * s.r * 1.05))); } bs.sort((p, q) => p - q);
    spill.sort((p, q) => p.y - q.y);
    s.a = {x: s.x + 0.5, z: s.z + 0.5, vent, ventB: gb(s.x, vent, s.z), rim: Math.max(vent + 1, rimMin), rimMax, base: bs[6], spill: spill.slice(0, 6), arr: null};
    s.a.arr = [s.x + 0.5, vent + 1, s.z + 0.5, s.a.rim]; return s.a; }
  U.anchor = (i, fresh) => { const s = sites()[i]; return s ? anchor(s, fresh) : null; };
  function nearest(px, pz, maxD) { let b = null, bd = maxD || 1e9; for (const s of sites()) { const d = Math.hypot(px - s.x, pz - s.z) - s.r * 0.3; if (d < bd) { bd = d; b = s; } } return b; }
  U.nearest = (px, pz, m) => { const s = nearest(px, pz, m); return s ? s.i : -1; };
  // ---------- Ben Glencraft: the bigger volcano by spawn (built once per world, natural blocks only) ----------
  function marked() { try { return !!G.__noscot || (world[(1 * H + 1) * D + 1] === (T.OBSIDIAN || 73) && world[(1 * H + 1) * D + 2] === (T.OBSIDIAN || 73)); } catch (_) { return false; } }
  function buildSpawn() { const s = SPAWN_V, cx = s.x, cz = s.z, R = s.r, RC = s.rc; if (cx - R < 2 || cz - R < 2 || cx + R >= W - 2 || cz + R >= D - 2) return 0;
    const NAT = G.__NAT, nat = b => !b || b === T.WATER || (NAT && NAT[b]) || b === T.MAGMA || b === T.BASALT || b === T.BLACKSTONE || b === 156 || b === T.PACKSNOW || b === T.SNOW;
    const gt = (x, z) => { for (let y = H - 2; y > 1; y--) { const b = world[idx(x, y, z)]; if (b && b !== T.WATER && !PLANT[b] && !LEAFY[b] && !LOGGY[b]) return y; } return 0; };
    let g0 = 0, k = 0; for (let a = 0; a < 24; a++) { const t = gt(Math.round(cx + Math.sin(a / 24 * 6.2832) * R), Math.round(cz + Math.cos(a / 24 * 6.2832) * R)); if (t > SEA) { g0 += t; k++; } }
    g0 = k ? Math.round(g0 / k) : SEA + 20; const PK = Math.min(H - 10, g0 + s.h), floor = PK - 10; let sd = 0x5eed1300 >>> 0; const rnd = () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296;
    const flowA = [0.5, 1.9, 3.3, 4.6, 5.7]; const isFlow = (d, a) => d > RC + 3 && flowA.some(f => { const da = Math.abs(((a - f + 9.42) % 6.2832) - 3.1416); return da * d < 1.0 + Math.sin(d * 0.5 + f) * 0.5; });
    const hAt = (d, a) => { if (d > R) return -1; const n = Math.sin(a * 5 + 1.3) * 1.1 + Math.sin(a * 11 + 0.4) * 0.6 + Math.sin(a * 3 + d * 0.21) * 0.9;
      if (d < RC) return floor + Math.round((d / RC) * (d / RC) * 4); if (d < RC + 2.2) return PK + Math.round(n * 0.4);
      return Math.round(g0 + (PK - g0) * Math.pow(1 - (d - RC - 2.2) / (R - RC - 2.2), 1.55) + n * (d / R) * 1.6); };
    const BS = T.BLACKSTONE || T.DEEPSLATE || T.STONE, BA = T.BASALT || BS, DS = T.DEEPSLATE || T.STONE; let cols = 0;
    for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) { const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz), a = Math.atan2(dx, dz), h = hAt(d, a); if (h < 0) continue;
      const base = gt(x, z); if (!base) continue; if (h <= base && d >= RC) continue; let ok = true;
      for (let y = Math.max(2, base - 3); y <= Math.min(H - 2, Math.max(h, base) + 8); y++) { const i = idx(x, y, z); if (placedSet && placedSet.has(i)) { ok = false; break; } if (!nat(world[i]) && !soft(world[i])) { ok = false; break; } } if (!ok) continue;
      const top = Math.max(h, d < RC ? h : base);
      for (let y = Math.min(base, h) - 2; y <= top; y++) { if (y < 2) continue; const r = rnd(); let v = r < 0.5 ? DS : r < 0.88 ? BS : r < 0.95 ? BA : T.STONE;
        if (d < RC) v = y >= h - 1 ? (T.OBSIDIAN || BS) : DS; else if (d < RC + 2.6 && y >= h - 1) v = r < 0.55 ? (T.MAGMA || BS) : (T.OBSIDIAN || BS);
        else if (y === h && isFlow(d, a)) v = T.MAGMA || BS; else if (y === h && d > R - 7 && r < 0.4) v = T.GRAVEL || BS; world[idx(x, y, z)] = v; }
      if (d < RC) for (let y = h + 1; y <= H - 2; y++) { const i = idx(x, y, z); if (y <= floor + 3) world[i] = T.LAVA; else if (world[i] && world[i] !== T.WATER) world[i] = 0; else if (y > PK + 2) break; }
      else for (let y = h + 1; y <= h + 10 && y < H - 1; y++) { const i = idx(x, y, z), b = world[i]; if (b && b !== T.WATER) world[i] = 0; }
      try { markDirty(x, z); } catch (_) {} cols++; }
    const sv = sites().find(q => q.k === 'S'); if (sv) sv.a = null; U.built = cols; U.peak = PK; U.g0 = g0; return cols; }
  U.buildSpawn = buildSpawn;
  // ---------- block work (all budgeted) ----------
  function put(x, y, z, v, how) { if (y < 2 || y >= H - 1) return false; if (protXZ(x, z)) { U.prot++; return false; } if (mine(x, y, z)) { U.blocked++; return false; }
    const old = gb(x, y, z); if (old === v) return false;
    if (how === 'cool') { if (old !== T.LAVA && old !== T.MAGMA) return false; }
    else if (how === 'rock') { if (soft(old) || old === T.WATER || old === T.LAVA) return false; if (G.__NAT && !__NAT[old] && old !== T.MAGMA && old !== T.BASALT && old !== T.BLACKSTONE) return false; }
    else if (how === 'air') { if (old !== T.LAVA) return false; }
    else { if (!(soft(old) || old === T.LAVA)) { U.blocked++; return false; } }
    try { setB(x, y, z, v); } catch (e) { ERR('setB', e); return false; }
    try { if (inMap(x, y, z) && typeof placedSet !== 'undefined') placedSet.delete(idx(x, y, z)); } catch (_) {}   // eruption rock is natural ground, not your build
    return true; }
  // ---------- state ----------
  let E = null; const REST_T = {};
  const S = () => (E ? sites()[E.si] : null);
  function setPh(ph) { if (!E) return; E.ph = ph; E.pt = 0; U.ph = ph; U.phases.push(ph); if (U.phases.length > 40) U.phases.shift();
    try { if (ph === 'rumble') toast(E.blue ? 'The 115 sinks into the crater... the ground glows blue' : 'The ground is rumbling... the volcano is waking up');
      else if (ph === 'gush') toast(E.blue ? 'The volcano erupts BLUE...' : 'The volcano is erupting! Lava is pouring out - get to high ground!');
      else if (ph === 'cool') toast('The eruption is dying down. The lava is cooling.'); } catch (_) {} }
  function erupt(which, blue) { try { if (!live()) return false; const L = sites(); if (!L.length) return false; let s = null;
      if (which === 'spawn') s = L.find(q => q.k === 'S'); else if (typeof which === 'number') s = L[which]; else if (which && which.i !== undefined) s = L[which.i];
      if (!s) { const c = current.c229; s = c && c.__v1300 !== undefined ? L[c.__v1300] : nearest(P.x, P.z, 90); } if (!s) return false;
      if (E && !(blue && E.ph === 'cool')) return false; if (!blue && (REST_T[s.i] || 0) > 0) { try { toast('This volcano is still resting'); } catch (_) {} return false; }
      const a = anchor(s, true), keep = E ? E.lava.concat(E.fill) : []; E = {si: s.i, ph: '', pt: 0, t: 0, blue: !!blue, fronts: [], lava: [], fill: [], sunk: [], Q: [], qi: 0, lvl: a.vent, feedT: 0, acc: 0, coolI: 0, boomT: 2, nf: 0};
      if (keep.length) E.lava = keep; current.c242ever = 1; U.site = s.i; U.phases = []; U.maxReach = 0; U.lava = 0; U.steps = 0; setPh('rumble'); return true; } catch (e) { ERR('erupt', e); return false; } }
  U.erupt = erupt; U.state = () => E ? {si: E.si, ph: E.ph, pt: +E.pt.toFixed(2), t: +E.t.toFixed(1), blue: E.blue, fronts: E.fronts.length, lava: E.lava.length / 3, fill: E.fill.length / 3, q: E.Q.length - E.qi} : null;
  U.rest = REST_T;
  function q(x, y, z, v, how, list) { E.Q.push([x, y, z, v, how, list]); }
  function crater(s, a) { const out = []; for (let dx = -s.rc; dx <= s.rc; dx++) for (let dz = -s.rc; dz <= s.rc; dz++) { if (dx * dx + dz * dz > s.rc * s.rc) continue; const x = s.x + dx, z = s.z + dz, t = surf(x, z, a.vent + 3); if (gb(x, t, z) === T.LAVA && Math.abs(t - a.vent) <= 2) out.push([x, t, z]); } return out; }
  function enter(ph) { const s = S(), a = anchor(s);
    if (ph === 'sink') { E.cr = crater(s, a); E.sunkLv = 0; }
    if (ph === 'surge') { for (const [x, y, z] of E.sunk) q(x, y, z, T.LAVA, 'lava'); E.sunk = [];
      const R1 = s.br; for (let y = a.vent + 1; y <= a.rim - 1; y++) for (let dx = -R1; dx <= R1; dx++) for (let dz = -R1; dz <= R1; dz++) { if (dx * dx + dz * dz > R1 * R1) continue; q(s.x + dx, y, s.z + dz, T.LAVA, 'fill', 'fill'); } }
    if (ph === 'pour') { for (const sp of a.spill.slice(0, LOW() ? 3 : 5)) newFront(s, a, sp); } }
  function newFront(s, a, sp) { if (!sp) { const k = (E.nf++ * 2.39996) % 6.2832; sp = {a: k, x: Math.round(s.x + Math.sin(k) * (s.rc + 2)), z: Math.round(s.z + Math.cos(k) * (s.rc + 2)), y: a.rim}; if (Math.random() < 0.6) sp = a.spill[E.nf % a.spill.length]; }
    const MAXF = LOW() ? 6 : 12; if (E.fronts.length >= MAXF) return; const dx = Math.sign(Math.round(Math.sin(sp.a) * 2)), dz = Math.sign(Math.round(Math.cos(sp.a) * 2));
    E.fronts.push({x: sp.x, z: sp.z, y: surf(sp.x, sp.z, sp.y), dx, dz, n: 0, stuck: 0, w: Math.random() < 0.6 ? 2 : 1}); }
  function lavaAt(x, y, z, list) { if (put(x, y, z, T.LAVA)) { (list || E.lava).push(x, y, z); if (!list) U.lava++; return true; } return false; }
  function stepFront(f) { const s = S(); let best = null, bh = 1e9;
    for (const [dx, dz] of N8) { const nx = f.x + dx, nz = f.z + dz; if (protXZ(nx, nz)) { U.prot++; continue; } const t = surf(nx, nz, f.y), b = gb(nx, t, nz);
      const h = t + (b === T.LAVA ? 1.6 : 0) + Math.random() * 0.8 + ((dx * f.dx + dz * f.dz) < 0 ? 2.2 : 0) + (dx && dz ? 0.25 : 0); if (h < bh) { bh = h; best = [nx, nz, t, b, dx, dz]; } }
    if (!best) return false; const [nx, nz, t, b, dx, dz] = best; U.steps++;
    if (t > f.y + 1) { f.stuck++; if (lavaAt(f.x, f.y + 1, f.z)) f.y++; return f.stuck < 9; }   // walled in: it pools and rises
    if (b === T.WATER) { if (put(nx, t, nz, T.OBSIDIAN || T.STONE, 'rock') || setWaterRock(nx, t, nz)) U.quench++; steam(nx + .5, t + 1, nz + .5); return false; }
    f.dx = dx; f.dz = dz; f.x = nx; f.z = nz; f.y = t; f.n++; if (b !== T.LAVA) lavaAt(nx, t + 1, nz);
    for (const sgn of [1, -1]) { if (Math.random() >= (f.w > 1 ? 0.62 : 0.28)) continue; const sx = nx - dz * sgn, sz = nz + dx * sgn; if (protXZ(sx, sz)) continue; const st = surf(sx, sz, t), sb = gb(sx, st, sz); if (st <= t && sb !== T.WATER && sb !== T.LAVA) lavaAt(sx, st + 1, sz); }
    if (Math.random() < 0.035 && E.fronts.length < (LOW() ? 6 : 12)) E.fronts.push({x: nx, z: nz, y: t, dx: -dz || dx, dz: dx || dz, n: f.n, stuck: 0, w: 2});
    if (Math.random() < 0.06) try { if (G.__c237 && __c237.ignite) __c237.ignite(nx + 1.5, t + 1.02, nz + .5); } catch (_) {}
    const rr = Math.hypot(nx - s.x, nz - s.z); if (rr > U.maxReach) U.maxReach = Math.round(rr);
    return f.n < 260 && E.lava.length / 3 < (LOW() ? 2600 : 5200); }
  function setWaterRock(x, y, z) { try { if (protXZ(x, z) || mine(x, y, z)) return false; if (gb(x, y, z) !== T.WATER) return false; setB(x, y, z, T.OBSIDIAN || T.STONE); if (inMap(x, y, z)) placedSet.delete(idx(x, y, z)); return true; } catch (_) { return false; } }
  function work(dt) { if (!E) return; const s = S(), a = anchor(s), t0 = performance.now(), SL = LOW() ? 0.45 : 0.65, OPS = LOW() ? 10 : 22; let ops = 0;
    const tl = () => performance.now() - t0 < SL;
    // queued crater work
    while (E.qi < E.Q.length && ops < OPS && tl()) { const [x, y, z, v, how, list] = E.Q[E.qi++]; ops++;
      if (how === 'fill') { if (soft(gb(x, y, z))) lavaAt(x, y, z, E.fill); } else if (how === 'lava') { put(x, y, z, T.LAVA); } else put(x, y, z, v, how); }
    if (E.qi >= E.Q.length && E.Q.length) { E.Q = []; E.qi = 0; }
    // sink: the crater lake drains down 3 blocks
    if (E.ph === 'sink' && E.cr) { const want = Math.min(3, Math.floor(E.pt / DUR.sink * 3.6)); while (E.sunkLv < want) { E.sunkLv++; const lv = E.sunkLv;
        for (const c of E.cr) { const y = c[1] - lv + 1; q(c[0], y, c[2], 0, 'air'); E.sunk.push([c[0], y, c[2]]); if (soft(gb(c[0], y - 1, c[2])) || gb(c[0], y - 1, c[2]) === T.LAVA) continue; q(c[0], y - 1, c[2], T.LAVA, 'rock'); } } }
    // vents keep feeding new fronts; fronts step in a round robin
    const feeding = E.ph === 'pour' || E.ph === 'flood' || (E.ph === 'gush' && E.pt > 6);
    if (feeding && (E.feedT -= dt) <= 0) { E.feedT = E.ph === 'flood' ? 4 + Math.random() * 3 : 1.4 + Math.random(); newFront(s, a); }
    const rate = E.ph === 'cool' ? 0 : E.ph === 'flood' ? (LOW() ? 14 : 26) : feeding ? (LOW() ? 22 : 42) : 0;
    E.acc = Math.min(E.acc + dt * rate, OPS); let fi = 0;
    while (E.acc >= 1 && E.fronts.length && ops < OPS * 2 && tl()) { E.acc -= 1; ops++; const k = (E.rr = ((E.rr || 0) + 1) % E.fronts.length); const f = E.fronts[k]; if (!stepFront(f)) E.fronts.splice(k, 1); if (++fi > 64) break; }
    if (E.ph === 'cool') { E.fronts.length = 0;
      // cooling: lava -> magma crust -> basalt (obsidian beside water); crater fill drains back
      const n = E.lava.length / 3, stage = E.pt < DUR.cool * 0.45 ? 1 : 2, per = LOW() ? 8 : 16; let c = 0; if (stage === 2 && !E.st2) { E.st2 = 1; E.coolI = 0; }
      while (c < per && E.coolI < n && tl()) { const j = E.coolI++ * 3, x = E.lava[j], y = E.lava[j + 1], z = E.lava[j + 2]; c++;
        const b = gb(x, y, z); let wet = false; for (let k = 0; k < 4; k++) if (gb(x + N8[k][0], y, z + N8[k][1]) === T.WATER) wet = true;
        if (stage === 1 && b === T.LAVA) { if (put(x, y, z, wet ? (T.OBSIDIAN || T.STONE) : (T.MAGMA || T.STONE), 'cool')) U.cooled++; }
        else if (stage === 2 && (b === T.MAGMA || b === T.LAVA)) { if (put(x, y, z, wet ? (T.OBSIDIAN || T.STONE) : (Math.random() < 0.82 ? (T.BASALT || T.STONE) : (T.BLACKSTONE || T.STONE)), 'cool')) U.cooled++; } }
      if (E.fill.length && E.pt > 8) { for (let k2 = 0; k2 < 6 && E.fill.length; k2++) { const z = E.fill.pop(), y = E.fill.pop(), x = E.fill.pop(); put(x, y, z, 0, 'air'); } } }
    U.fronts = E.fronts.length; }
  // ---------- sound: WebAudio only, all distance-attenuated ----------
  let AU = null;
  function mkAudio() { try { if (typeof AC === 'undefined' || !AC || AC.state !== 'running') return null; const out = (typeof master !== 'undefined' && master) ? master : AC.destination;
      const sr = AC.sampleRate, nb = AC.createBuffer(1, sr * 4 | 0, sr), wb = AC.createBuffer(1, sr * 2 | 0, sr), c1 = nb.getChannelData(0), c2 = wb.getChannelData(0); let l = 0;
      for (let i = 0; i < c1.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; c1[i] = l * 3.5; } for (let i = 0; i < c2.length; i++) c2[i] = Math.random() * 2 - 1;
      const src = (b) => { const s = AC.createBufferSource(); s.buffer = b; s.loop = true; s.start(); return s; }, G0 = AC.createGain(); G0.gain.value = 0; G0.connect(out);
      const rum = src(nb), rlp = AC.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 70; rlp.Q.value = 0.9; const rg = AC.createGain(); rg.gain.value = 0; rum.connect(rlp); rlp.connect(rg); rg.connect(G0);
      const roar = src(wb), bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 240; bp.Q.value = 0.55; const olp = AC.createBiquadFilter(); olp.type = 'lowpass'; olp.frequency.value = 900; const og = AC.createGain(); og.gain.value = 0; roar.connect(bp); bp.connect(olp); olp.connect(og); og.connect(G0);
      const gur = src(nb), gbp = AC.createBiquadFilter(); gbp.type = 'bandpass'; gbp.frequency.value = 420; gbp.Q.value = 4; const gg = AC.createGain(); gg.gain.value = 0; gur.connect(gbp); gbp.connect(gg); gg.connect(G0);
      return {G0, rg, og, olp, gg, gbp, out, srcs: [rum, roar, gur]}; } catch (e) { ERR('au', e); return null; } }
  function boomAt(v) { try { if (!AU || v < 0.01) return; const t = AC.currentTime + 0.02, o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(72, t); o.frequency.exponentialRampToValueAtTime(26, t + 1.6);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2); o.connect(g); g.connect(AU.out); o.start(t); o.stop(t + 2.3); U.booms++; } catch (e) { ERR('boom', e); } }
  const PHK = {rumble: [0.55, 0, 0.1], sink: [0.75, 0.05, 0.45], pause: [1, 0, 0.2], surge: [1, 0.7, 0.6], gush: [1, 1, 0.8], pour: [0.85, 0.75, 0.9], flood: [0.55, 0.35, 0.7], cool: [0.2, 0.05, 0.25]};
  function sound(dt, d) { const k = E && PHK[E.ph], att = Math.pow(Math.max(0, 1 - d / 560), 1.6);
    if (!k || att <= 0) { if (AU) AU.G0.gain.setTargetAtTime(0, AC.currentTime, 0.6); return; } if (!AU) AU = mkAudio(); if (!AU) return; const t = AC.currentTime, fade = E.ph === 'cool' ? Math.max(0, 1 - E.pt / DUR.cool) : 1;
    AU.G0.gain.setTargetAtTime(0.24 * att * fade, t, 0.5); AU.rg.gain.setTargetAtTime(k[0], t, 0.8); AU.og.gain.setTargetAtTime(k[1] * 0.55, t, 0.6); AU.olp.frequency.setTargetAtTime(300 + 800 * Math.max(0, 1 - d / 300), t, 0.5);
    AU.gg.gain.setTargetAtTime(k[2] * (0.25 + 0.75 * Math.random()), t, 0.08); AU.gbp.frequency.setTargetAtTime(300 + Math.random() * 380, t, 0.1);
    if ((E.ph === 'surge' || E.ph === 'gush' || E.ph === 'pour') && (E.boomT -= dt) <= 0) { E.boomT = 2.5 + Math.random() * 3.5; boomAt(0.2 * att); } }
  // ---------- visuals: crater lava surface, lava jet, spray, black mushroom ash cloud ----------
  let FX = null; const TMPC = new THREE.Color();
  function lavaTex(blue) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), im = g.createImageData(64, 64);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const n = 0.5 + 0.25 * Math.sin(x * 0.39 + Math.sin(y * 0.21) * 3) + 0.25 * Math.sin(y * 0.33 + Math.cos(x * 0.17) * 2.5), cr = Math.abs(Math.sin(x * 0.23 + y * 0.31) * Math.cos(x * 0.13 - y * 0.27));
      const hot = Math.min(1, Math.max(0, n * 1.2 - cr * 0.55)), o = (y * 64 + x) * 4;
      if (blue) { im.data[o] = 30 + 90 * hot; im.data[o + 1] = 120 + 120 * hot; im.data[o + 2] = 220 + 35 * hot; } else { im.data[o] = 150 + 105 * hot; im.data[o + 1] = 30 + 190 * hot * hot; im.data[o + 2] = 10 + 60 * hot * hot * hot; } im.data[o + 3] = 255; }
    g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
  function puffTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28, r = k ? 13 : 0, x = 32 + Math.sin(a) * r, y = 32 + Math.cos(a) * r, rr = k ? 15 : 22, q = g.createRadialGradient(x, y, 0, x, y, rr);
      q.addColorStop(0, 'rgba(255,255,255,0.55)'); q.addColorStop(0.6, 'rgba(235,235,235,0.3)'); q.addColorStop(1, 'rgba(220,220,220,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); }
    return new THREE.CanvasTexture(c); }
  function glowTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), q = g.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(255,200,120,0.95)'); q.addColorStop(0.45, 'rgba(255,110,20,0.5)'); q.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
  function mkFx() { const g = new THREE.Group(); g.name = 'v1300Volcano'; g.userData.__dcR = 1e9; g.userData.__dcK = 1; scene.add(g); const lt = lavaTex(false), lb = lavaTex(true);
    const discM = new THREE.MeshBasicMaterial({map: lt, fog: true}), disc = new THREE.Mesh(new THREE.CircleGeometry(1, 28), discM); disc.rotation.x = -Math.PI / 2; disc.frustumCulled = false; g.add(disc);
    const jg = new THREE.CylinderGeometry(0.75, 1, 1, 16, 6, true); jg.translate(0, 0.5, 0); const jt = lt.clone(); jt.needsUpdate = true; jt.repeat.set(2, 3); const jM = new THREE.MeshBasicMaterial({map: jt, side: THREE.DoubleSide, fog: true}); const jet = new THREE.Mesh(jg, jM); jet.frustumCulled = false; g.add(jet);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false})); g.add(glow);
    const NS = LOW() ? 110 : 260, SP = new Float32Array(NS * 3), SV = new Float32Array(NS * 4), sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(SP, 3)); for (let i = 0; i < NS; i++) SP[i * 3 + 1] = -999;
    const spray = new THREE.Points(sg, new THREE.PointsMaterial({color: 0xffa040, size: LOW() ? 1.1 : 0.85, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false})); spray.frustumCulled = false; g.add(spray);
    const NA = LOW() ? 110 : 220, AP = new Float32Array(NA * 3), AV = new Float32Array(NA * 3), AS = new Float32Array(NA), AA = new Float32Array(NA), AG = new Float32Array(NA), AL = new Float32Array(NA * 3), ag = new THREE.BufferGeometry();
    for (let i = 0; i < NA; i++) AP[i * 3 + 1] = -999; ag.setAttribute('position', new THREE.BufferAttribute(AP, 3)); ag.setAttribute('aSize', new THREE.BufferAttribute(AS, 1)); ag.setAttribute('aAlpha', new THREE.BufferAttribute(AA, 1)); ag.setAttribute('aGlow', new THREE.BufferAttribute(AG, 1));
    const aM = new THREE.ShaderMaterial({uniforms: {map: {value: puffTex()}, uScale: {value: 400}, uCol: {value: new THREE.Color(0.075, 0.07, 0.068)}, uGlow: {value: new THREE.Color(0.85, 0.32, 0.08)}},
      vertexShader: 'attribute float aSize; attribute float aAlpha; attribute float aGlow; uniform float uScale; varying float vA; varying float vG; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(aSize * uScale / max(1.0, -mv.z), 1.0, 900.0); gl_Position = projectionMatrix * mv; vA = aAlpha; vG = aGlow; }',
      fragmentShader: 'uniform sampler2D map; uniform vec3 uCol; uniform vec3 uGlow; varying float vA; varying float vG; void main(){ vec4 t = texture2D(map, gl_PointCoord); float a = t.a * vA; if (a < 0.01) discard; vec3 c = mix(uCol * (0.7 + 0.8 * t.r), uGlow, vG); gl_FragColor = vec4(c, min(1.0, a * 1.6)); }',
      transparent: true, depthWrite: false});
    const ash = new THREE.Points(ag, aM); ash.frustumCulled = false; g.add(ash);
    return {g, disc, discM, jet, jM, jt, lt, lb, glow, spray, SP, SV, sg, NS, ash, AP, AV, AS, AA, AG, AL, ag, NA, aM, emitA: 0}; }
  function fxFrame(dt, s, a) { if (!FX) FX = mkFx(); const f = FX; f.g.visible = true; const ph = E.ph, pt = E.pt, blue = E.blue, vx = a.x, vz = a.z, vy = a.vent + 1, rim = a.rim + 1;
    f.discM.map = blue ? f.lb : f.lt; f.jM.map = blue ? f.lb : f.jt; f.lt.offset.x += dt * 0.03; f.jt.offset.y -= dt * 1.6; f.lb.offset.y -= dt * 1.2; f.aM.uniforms.uGlow.value.setRGB(blue ? 0.2 : 0.85, blue ? 0.65 : 0.32, blue ? 1 : 0.08);
    // crater surface: sinks, pauses (bubbling), surges up to the brim
    let dy = vy + 0.04, dr = s.rc + 0.6; if (ph === 'sink') dy = vy + 0.04 - 3 * Math.min(1, pt / DUR.sink); else if (ph === 'pause') dy = vy - 2.96 + Math.sin(pt * 9) * 0.12; else if (ph === 'surge') dy = vy - 2.96 + (rim - vy + 2.9) * Math.min(1, Math.pow(pt / DUR.surge, 0.7)); else if (ph === 'gush' || ph === 'pour') dy = rim - 0.1 + Math.sin(pt * 3) * 0.08; else if (ph === 'flood') dy = rim - 0.4; else if (ph === 'cool') dy = Math.max(vy + 0.04, rim - 0.4 - pt * 0.05);
    if (dy > vy + 0.5) dr = s.rc + 0.6 + (s.br - s.rc) * Math.min(1, (dy - vy) / Math.max(1, rim - vy));
    f.disc.visible = ph !== 'rumble'; f.disc.position.set(vx, dy, vz); f.disc.scale.set(dr, dr, 1);
    // the jet: thick upward gush of lava, strongest in gush, dropping in pour, a bubbling fountain in flood
    let jh = 0; const JMAX = (s.k === 'S' ? 40 : 26) * (LOW() ? 0.8 : 1);
    if (ph === 'surge') jh = JMAX * 0.35 * Math.pow(pt / DUR.surge, 2); else if (ph === 'gush') jh = JMAX * (0.55 + 0.45 * Math.min(1, pt / 3)) * (0.9 + 0.1 * Math.sin(pt * 7)); else if (ph === 'pour') jh = JMAX * (0.8 - 0.55 * pt / DUR.pour) * (0.9 + 0.1 * Math.sin(pt * 6)); else if (ph === 'flood') jh = 4 + 2 * Math.sin(pt * 2.3);
    const jr = Math.min(4.6, Math.max(2.2, s.br * 0.46)) * (ph === 'flood' ? 0.6 : 1); f.jet.visible = jh > 0.3; f.jet.position.set(vx, dy - 0.2, vz); f.jet.scale.set(jr, Math.max(0.3, jh), jr);
    f.glow.position.set(vx, dy + 2 + jh * 0.6, vz); const gs = 8 + jh * 0.6 + (ph === 'cool' ? -pt * 0.03 : 0); f.glow.scale.set(gs, gs * 1.2, 1); f.glow.material.opacity = ph === 'rumble' ? 0.3 * pt / DUR.rumble : ph === 'cool' ? Math.max(0, 0.6 - pt / DUR.cool) : 0.42 + 0.1 * Math.sin(pt * 5); f.glow.material.color.setHex(blue ? 0x70d0ff : 0xffb070);
    // spray falls back round the jet (no bombs)
    const {SP, SV} = f, sr = jh > 1 ? (ph === 'flood' ? 3 : 14) : 0; f.spray.material.color.setHex(blue ? 0x60d8ff : 0xffa040);
    for (let i = 0; i < f.NS; i++) { const b = i * 3, v = i * 4; if (SV[v + 3] > 0) { SV[v + 3] -= dt; SV[v + 1] -= 14 * dt; SP[b] += SV[v] * dt; SP[b + 1] += SV[v + 1] * dt; SP[b + 2] += SV[v + 2] * dt; if (SV[v + 3] <= 0 || SP[b + 1] < vy - 1) { SV[v + 3] = 0; SP[b + 1] = -999; } }
      else if (sr && Math.random() < dt * sr) { const a2 = Math.random() * 6.283, rr = Math.random() * jr * 0.8; SP[b] = vx + Math.sin(a2) * rr; SP[b + 1] = dy + jh * (0.75 + Math.random() * 0.25); SP[b + 2] = vz + Math.cos(a2) * rr; const out = 1 + Math.random() * 3.2; SV[v] = Math.sin(a2) * out; SV[v + 1] = 2 + Math.random() * 6; SV[v + 2] = Math.cos(a2) * out; SV[v + 3] = 1.2 + Math.random() * 1.6; } }
    f.sg.attributes.position.needsUpdate = true;
    // ash: a stem that rises from the vent and spreads into a black mushroom cap, lit orange from below
    const CH = s.k === 'S' ? 78 : 58, top = rim + CH; let rate = 0; if (ph === 'surge') rate = 5; else if (ph === 'gush') rate = 11; else if (ph === 'pour') rate = 8; else if (ph === 'flood') rate = 2.5; if (LOW()) rate *= 0.55;
    f.emitA += dt * rate; const {AP, AV, AS, AA, AG, AL} = f, w = 0.6 + ((typeof weather !== 'undefined' && weather.wind) || 0.3);
    for (let i = 0; i < f.NA; i++) { const b = i * 3; if (AL[b + 1] > 0) { AL[b] += dt; const age = AL[b], life = AL[b + 1], y = AP[b + 1], hk = Math.min(1, Math.max(0, (y - rim) / CH));
        if (y < top - 6 && AL[b + 2] < 0.5) { AV[b + 1] += (1.5 - AV[b + 1] * 0.08) * dt; const k1 = Math.exp(-2.4 * dt); AV[b] *= k1; AV[b + 2] *= k1; } else { AL[b + 2] = 1; AV[b + 1] *= Math.exp(-8 * dt); const dx = AP[b] - vx, dz = AP[b + 2] - vz, dl = Math.hypot(dx, dz) || 1; AV[b] += dx / dl * 4 * dt; AV[b + 2] += dz / dl * 4 * dt; const k2 = Math.exp(-0.6 * dt); AV[b] *= k2; AV[b + 2] *= k2; }
        AP[b] += (AV[b] + w * 0.8) * dt; AP[b + 1] += AV[b + 1] * dt; AP[b + 2] += (AV[b + 2] + w * 0.3) * dt;
        AS[i] = (7 + 8 * hk + (AL[b + 2] ? 6 + age * 0.7 : 0)) * (s.k === 'S' ? 1.25 : 1); AA[i] = Math.min(1, age * 2) * Math.min(1, (life - age) / 5) * 0.95; AG[i] = Math.max(0, 1 - (y - rim) / 16) * (ph === 'cool' ? 0.2 : 0.9);
        if (age >= life) { AL[b + 1] = 0; AP[b + 1] = -999; AA[i] = 0; } }
      else if (f.emitA >= 1) { f.emitA -= 1; const a2 = Math.random() * 6.283, rr = Math.random() * jr; AP[b] = vx + Math.sin(a2) * rr; AP[b + 1] = rim + 1 + Math.random() * 3; AP[b + 2] = vz + Math.cos(a2) * rr;
        AV[b] = Math.sin(a2) * 0.6; AV[b + 1] = (ph === 'flood' ? 5 : 11) + Math.random() * 6; AV[b + 2] = Math.cos(a2) * 0.6; AL[b] = 0; AL[b + 1] = (ph === 'flood' ? 12 : 18) + Math.random() * 7; AL[b + 2] = 0; } }
    if (f.emitA > 3) f.emitA = 3;
    f.ag.attributes.position.needsUpdate = true; f.ag.attributes.aSize.needsUpdate = true; f.ag.attributes.aAlpha.needsUpdate = true; f.ag.attributes.aGlow.needsUpdate = true;
    try { const hh = renderer.domElement.height || 720; f.aM.uniforms.uScale.value = hh / (2 * Math.tan((camera.fov || 70) * Math.PI / 360)); } catch (_) {} }
  function steam(x, y, z) { try { if (typeof burst === 'function') burst(x, y, z, 0xdddddd, LOW() ? 4 : 8, 0.8); } catch (_) {} }
  // ---------- the frame ----------
  function frame(dt, raw) { const t0 = performance.now(); if (!E || !live() || !started) { if (FX) FX.g.visible = false; if (AU) try { AU.G0.gain.setTargetAtTime(0, AC.currentTime, 0.4); } catch (_) {} return; }
    dt = Math.min(0.1, dt) * (raw ? 1 : (U.speed == null ? 1 : U.speed)); if (dt <= 0) return; const s = S(), a = anchor(s); E.pt += dt; E.t += dt;
    if (E.ph !== 'rest' && E.pt >= DUR[E.ph]) { const n = ORDER[ORDER.indexOf(E.ph) + 1]; if (n) { setPh(n); enter(n); } else { REST_T[s.i] = REST; E = null; U.ph = 'idle'; U.site = -1; if (FX) FX.g.visible = false; return; } }
    work(dt); const d = Math.hypot(P.x - a.x, P.z - a.z);
    // subtle shake: tiny, distance-scaled, never above SHAKE_CAP
    const sk = {rumble: 0.35, sink: 0.5, pause: 0.6, surge: 0.9, gush: 1, pour: 0.8, flood: 0.4, cool: 0.1}[E.ph] || 0, amp = Math.min(SHAKE_CAP, SHAKE_CAP * sk * Math.pow(Math.max(0, 1 - d / 260), 2));
    if (amp > 0.002) { try { if (shakeAmp <= SHAKE_CAP + 1e-6) { shakeAmp = amp; shakeT = Math.max(shakeT, 0.25); } else shake(0.25, amp); } catch (_) { try { shake(0.25, amp); } catch (__) {} } if (amp > U.shakeMax) U.shakeMax = amp; }
    try { sound(dt, d); } catch (e) { ERR('snd', e); } try { fxFrame(dt, s, a); } catch (e) { ERR('fx', e); }
    const ms = performance.now() - t0; U.ms = U.ms * 0.95 + ms * 0.05; if (ms > U.msMax) U.msMax = ms; U.frames++; }
  U.tick = dt => { try { frame(dt, true); } catch (e) { ERR('tick', e); } };
  try { const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { frame(Math.min(0.1, +dt || 0.016)); } catch (e) { ERR('fr', e); } return r; }; } catch (e) { ERR('sky', e); }
  // ---------- housekeeping: rest timers, current.c229 = the nearest real crater (C244 / C279 / C229 read it), Ben Glencraft once ----------
  let idleArr = null; U.idleAt = () => idleArr;
  setInterval(() => { try { for (const k in REST_T) { REST_T[k] -= 1; if (REST_T[k] <= 0) delete REST_T[k]; } if (!live() || !started) { U.on = 0; return; } U.on = 1; if (!sites().length) return;
      if (current.c229 && current.c229.__v1300 === undefined && !current.c229legacy && !sites().some(q => Math.hypot(q.x + .5 - current.c229[0], q.z + .5 - current.c229[2]) < 3)) { current.c229legacy = current.c229.slice ? current.c229.slice(0, 4) : current.c229; U.legacy = 1; }
      const s = E ? S() : nearest(P.x, P.z, 1e9); if (!s) return; const a = anchor(s);
      if (!current.c229 || current.c229.__v1300 !== s.i || current.c229[1] !== a.arr[1]) { const arr = a.arr.slice(); Object.defineProperty(arr, '__v1300', {value: s.i, enumerable: false}); current.c229 = arr; }
      const near = Math.hypot(P.x - s.x, P.z - s.z) < 230 ? s : null; if (!near) idleArr = null; else if (!idleArr || idleArr.__v1300 !== near.i || idleArr[1] !== a.vent + 1) { idleArr = [a.x, a.vent + 1, a.z, 0]; Object.defineProperty(idleArr, '__v1300', {value: near.i, enumerable: false}); }
      if (!current.v1300sb && W === 864 && D === 864 && marked() && !(G.__c341 && __c341.busy) && !(typeof DIM !== 'undefined' && DIM.busy)) { current.v1300sb = 1; buildSpawn(); } } catch (e) { ERR('iv', e); } }, 1000);
  // ---------- shooting any crater sets it off ----------
  function hits(o, d) { const L = sites().filter(s => Math.hypot(s.x - o.x, s.z - o.z) < 260); if (!L.length) return null;
    for (let t = 1; t < 220; t += 0.5) { const x = o.x + d[0] * t, y = o.y + d[1] * t, z = o.z + d[2] * t, bx = Math.floor(x), by = Math.floor(y), bz = Math.floor(z), b = gb(bx, by, bz); let inside = false;
      for (const s of L) { const a = anchor(s), hd = Math.hypot(x - a.x, z - a.z), tr = Math.max(14, s.rc * 2.6, s.r * 0.45); if (hd < tr && y < a.rimMax + 4 && y > a.base - 6) { inside = true; if ((b && !soft(b)) || hd < s.rc + 1) return s; } }
      if (!inside && b && !soft(b) && b !== T.WATER) return null; } return null; }
  U.hits = (o, d) => { const s = hits(o, d); return s ? s.i : -1; };
  try { const fg = fireGun; fireGun = function () { const r = fg.apply(this, arguments); try { if (live()) { const s = hits({x: P.x, y: P.y + 1.62, z: P.z}, lookDir()); if (s && erupt(s.i)) U.shot = (U.shot || 0) + 1; } } catch (e) { ERR('hit', e); } return r; }; } catch (e) { ERR('fg', e); }
  // ---------- saves ----------
  const pack = a => a.slice(0, 18000);
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && !DIM.cur && current) { d.v1300 = {v: 1, sb: current.v1300sb ? 1 : 0, rest: Object.assign({}, REST_T), E: E ? {si: E.si, ph: E.ph, pt: E.pt, blue: E.blue, lava: pack(E.lava), fill: pack(E.fill)} : null};
          if (current.c229legacy) d.c229legacy = current.c229legacy; } } catch (e) { ERR('ser', e); } return d; }; } catch (e) { ERR('ser0', e); }
  try { const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && !d.dim && current) { const v = d.v1300; current.v1300sb = v && v.sb ? 1 : 0; for (const k in REST_T) delete REST_T[k]; if (v && v.rest) Object.assign(REST_T, v.rest);
          if (d.c229legacy) current.c229legacy = d.c229legacy; E = null; if (v && v.E && sites()[v.E.si]) { E = {si: v.E.si, ph: 'cool', pt: v.E.ph === 'cool' ? v.E.pt : 0, t: 0, blue: !!v.E.blue, fronts: [], lava: v.E.lava || [], fill: v.E.fill || [], sunk: [], Q: [], qi: 0, acc: 0, coolI: 0, boomT: 9, nf: 0, feedT: 0}; U.ph = 'cool'; } } } catch (e) { ERR('ap', e); } return r; }; } catch (e) { ERR('ap0', e); }
  try { const ew = enterWorld; enterWorld = function (save) { try { E = null; U.ph = 'idle'; for (const k in REST_T) delete REST_T[k]; if (SITES) for (const s of SITES) s.a = null; idleArr = null; if (!save && current) { current.v1300sb = 0; current.c229legacy = null; } } catch (_) {} return ew.apply(this, arguments); }; } catch (e) { ERR('ew', e); }
})(typeof window !== 'undefined' ? window : this);
