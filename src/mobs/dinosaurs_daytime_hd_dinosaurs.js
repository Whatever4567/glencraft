/* ===================== GLX-C165 (v1.0.30): DINOSAURS - daytime HD dinosaurs (CC0 Quaternius) living in their own habitats, capped, herbivores passive, one rare hunter ===================== */
(function c165() {
  const H = window.__c135, C = window.__c123; if (!H || !H.add) return;
  const U = window.__c165 = {spawned: 0, killed: 0, err: null, tries: 0, why: {}};
  const PH = typeof touchMode !== 'undefined' && !!touchMode;
  // kind: model file, height (blocks), hp, speed, cap, rarity weight, herd size, role, Glencraft styling (scales/skin pattern + colours per material)
  const SP = {
    d_apato:  {name: 'Apatosaurus', f: 'dino_apato', h: 7.2, hp: 60, spd: 0.9, cap: 1, w: 0.5, herd: 1, r: 2.1, hy: 2.4, big: 1, eg: ['#7d8a6a', '#4e5a40'], gl: {p: 'scales', a: 1.1, col: {Material: 0x8a9670, Brown: 0x5c5038}}},
    d_para:   {name: 'Parasaurolophus', f: 'dino_para', h: 3.4, hp: 22, spd: 1.3, cap: 3, w: 1.2, herd: 2, r: 1.2, hy: 1.5, eg: ['#5f8a4a', '#d8c070'], gl: {p: 'scales', col: {Green: 0x4f7a3e, LightGreen: 0x8cae5a, LightYellow: 0xe0d29a, Red: 0xb84a2a}}},
    d_stego:  {name: 'Stegosaurus', f: 'dino_stego', h: 3.4, hp: 32, spd: 0.9, cap: 2, w: 0.9, herd: 1, r: 1.4, hy: 1.4, eg: ['#8a6a48', '#c0703a'], gl: {p: 'scales', col: {Brown: 0x8a6a48, DarkBrown: 0x5a3e28, LightBrown: 0xc89a62}}},
    d_trike:  {name: 'Triceratops', f: 'dino_trike', h: 2.7, hp: 32, spd: 1.1, cap: 2, w: 1.0, herd: 2, r: 1.3, hy: 1.2, eg: ['#7a6248', '#d8cdb2'], gl: {p: 'scales', col: {Brown: 0x5e4a38, LightBrown: 0xa89276, Purple: 0x8a7a62}}},
    d_galli:  {name: 'Gallimimus', f: 'dino_raptor', h: 2.4, hp: 12, spd: 2.2, cap: 3, w: 1.0, herd: 3, r: 0.8, hy: 1.2, sky: 1, eg: ['#c8a46a', '#7a5a3a'], gl: {p: 'feather', a: 0.8, col: {LightBrown: 0xd8b87c, Brown: 0x9a7448, Black: 0x161210}, m: {Black: 'plain'}}},
    d_compy:  {name: 'Compsognathus', f: 'dino_raptor', h: 0.75, hp: 4, spd: 2.0, cap: 4, w: 1.0, herd: 3, r: 0.45, hy: 0.35, sky: 1, eg: ['#7a8a4a', '#3a3a24'], gl: {p: 'scales', a: 0.8, col: {LightBrown: 0xa8b070, Brown: 0x5e6a34, Black: 0x161210}, m: {Black: 'plain'}}},
    d_bary:   {name: 'Baryonyx', f: 'dino_raptor', h: 3.3, hp: 30, spd: 1.4, cap: 1, w: 0.5, herd: 1, r: 1.2, hy: 1.5, neutral: 1, dmg: 3, eg: ['#5a6e6a', '#c8b48a'], gl: {p: 'scales', col: {LightBrown: 0xc8b48a, Brown: 0x56706a, Black: 0x141414}, m: {Black: 'plain'}}},
    d_allo:   {name: 'Allosaurus', f: 'dino_trex', h: 3.8, hp: 40, spd: 1.6, cap: 1, w: 0.18, herd: 1, r: 1.3, hy: 1.7, hunter: 1, dmg: 4, eg: ['#8a5a3a', '#e0c080'], gl: {p: 'scales', col: {Green: 0x7e5634, LightGreen: 0xb08454, LightYellow: 0xe2cc98, Black: 0x141010, Red: 0xa02a1a}, m: {Black: 'plain'}}}
  };
  U.SP = SP; const KINDS = Object.keys(SP), isD = a => a && typeof a.kind === 'string' && !!SP[a.kind];
  for (const k of KINDS) { const s = SP[k]; H.cat[k] = {f: s.f, h: s.h, gl: s.gl, run: s.spd < 1 ? 0 : undefined}; }
  // ---- habitats ----
  const B = (x, y, z) => getB(x, y, z);
  const ring = (x, z, r, n, fn) => { let c = 0; for (let k = 0; k < n; k++) { const a = k / n * 6.283, xx = Math.round(x + Math.sin(a) * r), zz = Math.round(z + Math.cos(a) * r); if (fn(xx, zz)) c++; } return c; };
  const wetAt = (x, z) => { const t = solidTop(x, z); return B(x, t + 1, z) === T.WATER || B(x, t, z) === T.WATER; };
  const water = (x, z, r) => ring(x, z, r, 10, wetAt) + ring(x, z, r * 0.5, 6, wetAt);
  const logs = (x, z, r) => ring(x, z, r, 10, (xx, zz) => { const t = groundTop(xx, zz); for (let k = 1; k < 4; k++) if (LOGGY[B(xx, t + k, zz)]) return true; return LOGGY[B(xx, t, zz)]; });
  const SAND = new Set([T.SAND, T.RSAND, T.SANDSTONE].filter(v => v !== undefined)), ROCK = new Set([T.STONE, T.GRAVEL, T.SLATE, T.COBBLE].filter(v => v !== undefined));
  function habitat(k, x, y, z, top, home, bio) { const hi = y - SEA;
    if (home === 'snow' || hi > 30) return false;
    switch (k) {
      case 'd_para': return (top === T.GRASS || top === T.MUD || top === T.PEAT || top === T.MOSS) && hi < 10 && water(x, z, 9) >= 2;   // lush lowland meadow / wood edge by water
      case 'd_apato': return (top === T.GRASS || top === T.HEATHER) && hi < 12 && logs(x, z, 6) <= 1 && (bio === 'loch' || bio === 'moor' || water(x, z, 14) >= 2);   // open plains and loch shores
      case 'd_stego': return (ROCK.has(top) || home === 'mountain' || (bio === 'high' && hi > 8)) && water(x, z, 6) === 0;   // dry rocky hills
      case 'd_trike': return (top === T.GRASS || top === T.HEATHER) && (bio === 'moor' || bio === 'high') && hi < 18 && logs(x, z, 5) === 0 && water(x, z, 7) === 0;   // dry open scrub
      case 'd_galli': return SAND.has(top) || (top === T.HEATHER && water(x, z, 8) === 0 && logs(x, z, 6) === 0);   // sand and dry open ground
      case 'd_compy': return SAND.has(top) || (top === T.HEATHER && bio === 'moor' && logs(x, z, 4) === 0);
      case 'd_bary': return (hi < 4 && water(x, z, 4) >= 4 && !SAND.has(top)) || (top === T.MUD && water(x, z, 6) >= 2);   // river and loch banks
      case 'd_allo': { const l = logs(x, z, 7); return (top === T.GRASS || top === T.PODZOL || top === T.HEATHER) && l >= 1 && l <= 8 && logs(x, z, 2) === 0 && hi < 16; }   // forest edges
    } return false; }
  U.habitat = habitat;
  // ---- the mob: an invisible procedural rig (hitbox + physics), the HD model rides on it ----
  function make(k, x, y, z, egg) { const s = SP[k]; if (!s) return null; if (SET.hd === 0) { if (egg) try { toast('Dinosaurs need HD mob models on (Settings > Video)'); } catch (_) {} return null; }
    const g = new THREE.Group(), head = new THREE.Group(); head.position.set(0, s.h * 0.8, s.r); g.add(head);
    const a = {g, legs: [], arms: [], mats: [], head, speed: s.spd, hp: s.hp, hitY: s.hy, hitR: s.r, tall: Math.min(3, Math.ceil(s.h)), kind: k, dino: 1, flee: 0, angry: 0, biteCd: 0, shootCd: 9, moving: false,
      ang: Math.random() * 6.283, timer: Math.random() * 3, flash: 0, kbx: 0, kbz: 0, vy: 0, onGround: true, burning: 0, fire: 0, fireTick: 0, walk: 0, sndT: 4 + Math.random() * 10, hx: x, hz: z, shaded: true, _sh0: true};
    if (s.big) a.big = true;
    g.position.set(x, y, z); g.rotation.y = a.ang; a.yawVis = a.ang; scene.add(g); mobs.push(a); U.spawned++; return a; }
  U.make = make;
  // ---- spawning: day only, overworld only, out of sight, capped ----
  const count = k => mobs.reduce((n, a) => n + (a && a.kind === k ? 1 : 0), 0), total = () => mobs.reduce((n, a) => n + (isD(a) && !a.egg ? 1 : 0), 0);
  const MAXT = 1;   // v1.0.90: one dinosaur at a time
  const creative = () => !!(MODE && MODE.name === 'creative');
  const dayOK = () => !isNight && daylight > 0.6;
  function tryHerd(force) { U.tries++;
    for (let t = 0; t < 10; t++) { const an = Math.random() * 6.283, r = 26 + Math.random() * 22, x = Math.floor(P.x + Math.sin(an) * r), z = Math.floor(P.z + Math.cos(an) * r);
      if (x < 4 || z < 4 || x > W - 5 || z > D - 5) continue;
      if (Math.hypot(x - (W >> 1), z - (D >> 1)) < 150) continue;   // v1.0.90: never near spawn
      const top = solidTop(x, z), y = top + 1, b = B(x, top, z); if (b === T.WATER || b === T.LAVA || B(x, y, z) || B(x, y + 1, z) || B(x, y + 2, z) || Math.abs(y - P.y) > 18) continue;
      if (typeof near === 'function') { try { if (near(x, y, z, 6, T.TORCH)) continue; } catch (_) {} }
      const home = C && C.homeOf ? C.homeOf(x, y, z) : 'oak'; if (home === 'black' || home === 'human' || home === 'mossy') continue;   // never in castles
      const bio = biomeAt(x, z), pool = [];
      for (const k of (force ? [force] : KINDS)) { const s = SP[k]; if (count(k) >= s.cap) continue; if (s.hunter && creative()) continue; if (!force && !habitat(k, x, y, z, b, home, bio)) continue; pool.push(k); }
      if (!pool.length) { U.why.nohab = (U.why.nohab || 0) + 1; continue; }
      let sum = 0; for (const k of pool) sum += SP[k].w; let q = Math.random() * sum, k = pool[0]; for (const kk of pool) { q -= SP[kk].w; if (q <= 0) { k = kk; break; } }
      const s = SP[k], n = Math.min(s.herd, s.cap - count(k), MAXT - total()), out = []; if (n <= 0) return null;
      for (let i = 0; i < n; i++) { const xx = x + (i ? (Math.random() * 7 | 0) - 3 : 0), zz = z + (i ? (Math.random() * 7 | 0) - 3 : 0), tt = solidTop(xx, zz); if (B(xx, tt, zz) === T.WATER || B(xx, tt + 1, zz) || B(xx, tt + 2, zz)) continue; const m = make(k, xx + 0.5, tt + 1, zz + 0.5); if (m) out.push(m); }
      return out; }
    return null; }
  U.tryHerd = tryHerd;
  let spT = 4;
  function tick(dt) {
    /* v1.1.30: dinosaurs are switched off - none spawn, and any left in a save (or from an old egg) are removed */
    for (const a of mobs.slice()) if (isD(a)) { U.removed = (U.removed || 0) + 1; try { (window.__c130 && __c130.forceRemove || removeMob)(a); } catch (_) { try { removeMob(a); } catch (__) {} } }
    return;
    if (!started || dead || paused) return;
    // night, HD off or another dimension: dinosaurs wander off out of sight (hatched ones stay)
    for (const a of mobs.slice()) { if (!isD(a)) continue; const d = Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z), M = H.models[SP[a.kind].f];
      if (SET.hd === 0 || (M && M.fail) || DIM.cur || d > 110 || (!a.egg && !dayOK() && d > 20) || (!a.egg && isNight && d > 10 && (a.goneT = (a.goneT || 0) + dt) > 30)) { try { (window.__c130 && __c130.forceRemove ? __c130.forceRemove : removeMob)(a); } catch (_) {} } }
    spT -= dt; if (spT > 0) return; spT = 4 + Math.random() * 4;
    if (DIM.cur || SET.hd === 0 || !dayOK() || total() >= MAXT || (typeof caveK !== 'undefined' && caveK > 0.4)) return;
    if (Math.random() < 0.85) tryHerd();
  }
  // ---- behaviour (runs after the base mob loop, which already does passive wander + flee and physics) ----
  const voice = (k, p, d) => { if (window.__c165v) window.__c165v(k, p, d); };
  function think(a, dt) { const s = SP[a.kind], p = a.g.position, dx = P.x - p.x, dz = P.z - p.z, d = Math.hypot(dx, dz), dy = P.y - p.y;
    a.burning = 0; a.shaded = true;
    if (s.sky && d < 7 && !(a.flee > 0) && !dead) { a.flee = 2.5; a.moving = true; }   // skittish little runners
    a.sndT -= dt; if (a.sndT <= 0) { a.sndT = 8 + Math.random() * 14; if (d < 34) voice(a.kind, p, d); }
    const mean = (s.hunter && !creative()) || (s.neutral && a.angry > 0) || (s.hunter && a.angry > 0);
    if (!mean) return;
    if (s.hunter && !(a.angry > 0)) { const sees = !dead && d < 14 && Math.abs(dy) < 5 && canSee(a, 14); if (sees) { if (!(a.hunt > 0)) { try { playSound('roar', Math.max(0.15, 1 - d / 40), 0); } catch (_) {} } a.hunt = 6; } else a.hunt = Math.max(0, (a.hunt || 0) - dt);
      if (!(a.hunt > 0) || Math.hypot(p.x - a.hx, p.z - a.hz) > 40) { a.hunt = 0; return; } }
    if (dead) return;
    a.flee = 0; a.timer = 2; a.goal = null; const pa = pathAngle(a, P.x, P.z); a.ang = pa !== null ? pa : Math.atan2(dx, dz);
    const reach = s.r + 1.0;
    if (d > reach) { stepMob(a, s.spd * 2.1, dt, false); a.moving = true; } else a.moving = false;
    if (d < reach + 0.4 && Math.abs(dy) < 2.2 && a.biteCd <= 0) { a.biteCd = s.hunter ? 1.6 : 1.4; a.swing = 0.4; hurt(s.dmg || 3, 'A ' + s.name.toLowerCase() + ' got you.'); try { knockPlayer(dx / (d || 1), dz / (d || 1), 6, 3); } catch (_) {} try { sfx3d('growl', p, 16); } catch (_) {} } }
  const um = updateMobs; updateMobs = function (dt) {
    // keep the base loop from double-stepping a chasing dinosaur
    for (const a of mobs) if (isD(a) && a.chase) { a.moving = false; a.timer = 2; a.flee = 0; }
    const r = um.apply(this, arguments);
    try { const t = Math.min(0.1, +dt || 0.016); for (const a of mobs.slice()) if (isD(a)) { think(a, t); a.chase = (SP[a.kind].hunter && a.hunt > 0) || a.angry > 0; } tick(t); } catch (e) { U.err = String(e && e.stack || e); }
    return r; };
  // ---- hits: big bodies barely budge, herbivores run, the river hunter and the hunter bite back ----
  const dm = damageMob; damageMob = function (a, dmg, byPlayer) { if (isD(a)) { const s = SP[a.kind], k = s.big ? 0.12 : s.h > 3 ? 0.3 : s.h > 2 ? 0.55 : 1; a.kbx *= k; a.kbz *= k; if (k < 1) a.vy = Math.min(a.vy, 1.5);
      if (byPlayer) { if (s.neutral || s.hunter) { a.angry = 10; a.hunt = 8; } else { a.flee = 5; a.moving = true; } } }
    return dm.apply(this, arguments); };
  const km = killMob; killMob = function (a) { if (!isD(a)) return km.apply(this, arguments);
    const s = SP[a.kind], p = a.g.position, toss = (id, n) => { try { dropItem(id, n, p.x, p.y + 0.6, p.z, (Math.random() - .5) * 2.5, 3.5, (Math.random() - .5) * 2.5, 0.4); } catch (_) {} };
    try { burst(p.x, p.y + s.hy, p.z, 0xb03020, 16, 1); } catch (_) {} const n = s.h > 3 ? 3 : s.h > 1 ? 2 : 1; toss(IT.MUTTON, n); if (IT.BONE) toss(IT.BONE, s.h > 1 ? 2 : 1);
    try { toast(s.name + ' defeated'); } catch (_) {} U.killed++; a.__dying = true; removeMob(a); };
  // ---- spawn eggs in the universal egg list ----
  try { const E = window.__c130; if (false && E && E.addEggs) E.addEggs(KINDS.map(k => ({key: k, name: SP[k].name, a: SP[k].eg[0], b: SP[k].eg[1], make: (x, y, z) => make(k, x, y, z, true)}))); } catch (e) { U.err = 'eggs ' + e; }
  U.isD = isD;
})();
