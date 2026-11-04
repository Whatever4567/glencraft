/* ===================== GLX-C143 (v1.0.21): spawn rules - many mobs egg-only, the rest each have one home (castles, the sand island, the tomb, the hut, the longship, rain, the nether, your death spot, a farmer's ghost) ===================== */
(function c143() {
  const C = window.__c123; if (!C || !C.DEF || !C.HOMES) return;
  const DEF = C.DEF, HOMES = C.HOMES;
  // ---- egg-only (no natural spawning; still in the egg list) ----
  const DIS = new Set(['nm24', 'nm25', 'nm18', 'nmdrop', 'nm05', 'nm31', 'nm02', 'nm34', 'nm03', 'nm33', 'nm15', 'nm30', 'nm06', 'nm28', 'nm17', 'nm32', 'nm19', 'nm20', 'nm29', 'puffer', 'guardian', 'spider', 'nspider', 'giant']);
  const SPEC = new Set(['nm07', 'nm13', 'nm09', 'nm11', 'nm12', 'nm14', 'nm16', 'nm22', 'nm27']);   // only by the special rules below
  const U = window.__c143 = {DIS, SPEC, st: {sw: 0, sp: {}}, err: null, ruby: null, death: null};
  // the three sheet ghosts are one mob now: the Linen Ghaist is "Ghost"; the other two are egg-only (hidden from the list)
  try { DEF.nm10.name = 'Ghost'; } catch (_) {}
  try { DEF.nm27.move = 'float'; DEF.nm27.hover = DEF.nm27.hover || 0.6; } catch (_) {}   // Cleek Jack: a farmer's ghost on land, not a swimmer
  // ---- night homes ----
  for (const k of Object.keys(HOMES)) HOMES[k] = [];
  Object.assign(HOMES, {ocean: ['nm23', 'nm04', 'nm26'], mossy: ['nm01'], black: ['nm21'], beach: ['nm08'], shore: [], juniper: ['nm10'], birch: ['nm10'], yew: ['nm10'], pine: ['nm10']});
  for (const k of ['human', 'alder', 'oak', 'rowan', 'hawthorn', 'mountain', 'snow', 'cave', 'blackthorn', 'moor']) if (!HOMES[k]) HOMES[k] = [];
  // ---- giant spiders only from the egg ----
  try { const ng = window.__newGiant; if (ng) window.__newGiant = function () { if (!window.__egg) return null; return ng.apply(this, arguments); }; } catch (_) {}
  const isNM = a => a && typeof a.kind === 'string' && !!DEF[a.kind];
  const dropMob = (a, puff) => { try { if (puff) { const p = a.g.position; burst(p.x, p.y + 0.8, p.z, 0x9aa0b0, 10, 0.8); } } catch (_) {} try { removeMob(a); } catch (_) {} const i = mobs.indexOf(a); if (i >= 0) mobs.splice(i, 1); };
  const creative = () => !!(MODE && MODE.name === 'creative');
  const flat = () => !!(current && current.flat);
  const live = () => started && !paused && !dead && !creative() && !flat();
  const nmCount = () => mobs.filter(isNM).length, HARD = (C.PH || (typeof PERF !== 'undefined' && PERF)) ? 6 : 10;
  const spawn = (kind, x, y, z, tag) => { if (nmCount() >= HARD) return null; let a = null; try { a = C.spawnKind(kind, Math.floor(x), Math.floor(y), Math.floor(z), {grp: Math.random(), home: 'spec'}); } catch (e) { U.err = String(e); }
    if (a) { a.g.position.set(x, y, z); a.egg = true; a.spec = tag; U.st.sp[tag] = (U.st.sp[tag] || 0) + 1; } return a; };
  const alive = a => a && mobs.indexOf(a) >= 0 && a.g && a.g.parent;
  const topAt = (x, z) => { try { return solidTop(Math.floor(x), Math.floor(z)) + 1; } catch (_) { return P.y; } };
  const raining = () => typeof weather !== 'undefined' && weather.type && weather.type !== 'clear' && !(window.__snowWx && __snowWx());   // v1.0.40: actual rain only, not snow
  const dist = (p, x, z) => Math.hypot(p.x - x, p.z - z);
  // ---- slots: one (or a few) mobs per place, re-armed some time after they go ----
  const slots = new Map();   // tag -> {a: [mobs], cd}
  function keep(tag, want, n, make, dt) { let s = slots.get(tag); if (!s) slots.set(tag, s = {a: [], cd: 0});
    s.a = s.a.filter(alive);
    if (!want) { for (const a of s.a) dropMob(a, true); s.a = []; return; }
    if (s.a.length >= n) return; s.cd -= dt; if (s.cd > 0) return; const a = make(s.a.length); s.cd = a ? 40 + Math.random() * 50 : 4; if (a) s.a.push(a); }
  U.slots = slots;
  // ---- ruby sites on high stone: the Snaw Brute stands guard ----
  let rScan = 0, rWorld = null;
  let rs = null;   // scanned a few rows at a time so there is no hitch
  function rubyScan() { if (!rs) rs = {x: 4, R: [], seen: new Set()}; const RU = T.RUBYORE || 232, x1 = Math.min(W - 4, rs.x + 5);
    for (let x = rs.x; x < x1; x++) for (let z = 4; z < D - 4; z++) { const t = solidTop(x, z); if (t < SEA + 14) continue; const b = getB(x, t, z); if (b !== T.STONE && b !== RU && b !== (T.SNOW || -1) && b !== (T.GRAVEL || 202)) continue;
      for (let y = t; y > t - 7; y--) if (getB(x, y, z) === RU) { const k = ((x / 14) | 0) + ',' + ((z / 14) | 0); if (!rs.seen.has(k)) { rs.seen.add(k); rs.R.push([x, y, z, t]); } break; } }
    rs.x = x1; if (rs.x >= W - 4) { const R = rs.R; rs = null; return R; } return null; }
  // ---- the death spot ----
  const dkey = () => 'glen_death_' + (current && current.id);
  const dd = die; die = function () { try { if (!dead && started && !DIM.cur && current && current.id) { const s = [+P.x.toFixed(1), +P.y.toFixed(1), +P.z.toFixed(1), dayNum]; localStorage.setItem(dkey(), JSON.stringify(s)); U.death = s; } } catch (_) {} return dd.apply(this, arguments); };
  let lurkNight = -1;
  // ---- farmers can be struck down; their ghost (Cleek Jack) rises ----
  const FH = 10;
  const ui = updateInteraction; updateInteraction = function (dt) {
    try { const F = window.__c113, att = attackMouse || attackPad || attackTouch; if (att && F && F.aim && !menuOpen && !paused && !dead && started && !DIM.cur && !(window.__c145 && __c145.gunHeld && __c145.gunHeld())) {
        const h = F.aim(3.4); if (h && !h.f.dead) { const rs = raycast(5, true); let m = null; try { m = reachMob(Math.min(3.4, rs ? rs.t : 3.4)); } catch (_) {} const md = m && m.g ? Math.hypot(m.g.position.x - P.x, m.g.position.z - P.z) : 1e9;
          if (h.d < md && (!rs || rs.t > h.d)) { if (attackCd > 0) attackCd -= dt; if (attackCd <= 0) { attackCd = 0.42; try { swing(); } catch (_) {} hitFarmer(h.f); } return; } } } } catch (e) { U.err = 'farm ' + e; }
    return ui.apply(this, arguments); };
  function hitFarmer(f) { f.hp = (f.hp === undefined ? FH : f.hp) - 3; const p = f.m.g.position; try { burst(p.x, p.y + 1.2, p.z, 0xc02020, 6, 0.4); sfx('hurt', 0.6); } catch (_) {}
    f.st = 'idle'; f.t = 2; f.wp = []; f.task = null; try { f.m.g.traverse(o => { if (o.material && o.material.emissive) { o.material.emissive.setHex(0x601010); setTimeout(() => { try { o.material.emissive.setHex(0); } catch (_) {} }, 160); } }); } catch (_) {}
    if (f.hp > 0) { try { window.__c113.huhF && __c113.huhF(f); } catch (_) {} return; }
    f.dead = true; f.deadDay = dayNum; U.st.farmerKills = (U.st.farmerKills || 0) + 1; try { burst(p.x, p.y + 1, p.z, 0xe8e8ff, 18, 1); toast(f.name + ' is gone... something stirs.'); } catch (_) {}
    const x = p.x, y = (f.st === 'sleep' ? Math.floor(p.y) : p.y), z = p.z; setTimeout(() => { if (!started || DIM.cur) return; const a = spawn('nm27', x, Math.max(y, topAt(x, z)), z, 'cleek'); if (a) { a.farmer = f.name; U.st.cleek = (U.st.cleek || 0) + 1; } }, 700); }
  // ---- the per-frame pass ----
  let acc = 0;
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
    try { // sweep anything egg-only that slipped in from an old spawner
      for (let i = mobs.length - 1; i >= 0; i--) { const a = mobs[i]; if (!a || a.egg) continue; const k = a.giant ? 'giant' : a.kind; if (DIS.has(k) || (SPEC.has(k) && !a.spec)) { dropMob(a); U.st.sw++; } }
      const F = window.__c113; if (F && F.folk) for (const f of F.folk) { if (!f.dead) continue; f.m.g.visible = false; if (dayNum > f.deadDay && !isNight) { f.dead = false; f.hp = FH; } }
      acc += dt; if (acc >= 0.5) { const s = acc; acc = 0; specials(s); } } catch (e) { U.err = String(e && e.stack || e); }
    return r; };
  function specials(dt) { const ok = live(), hell = DIM.cur === 'hell', over = ok && !DIM.cur, S = (window.__c142 && __c142.sites) || {};
    // nether: the Glower Orb
    // v1.0.31: only over the soul sand round the Soul Abbey
    keep('orb', ok && hell && !!(window.__c170 && __c170.orbOK()), 2, () => { const s = window.__c170 && __c170.soulSpot(2); return s ? spawn('nm16', s[0], s[1], s[2], 'orb') : null; }, dt);
    // rain: Thunner Cloudies overhead
    keep('rain', over && raining() && caveK < 0.4, 2, () => { const an = Math.random() * 6.28, r = 16 + Math.random() * 14, x = P.x + Math.sin(an) * r, z = P.z + Math.cos(an) * r; if (x < 4 || z < 4 || x > W - 4 || z > D - 4) return null; return spawn('nm22', x, topAt(x, z) + 3, z, 'rain'); }, dt);
    // ruby sites on the mountains: the Snaw Brute (day and night)
    if (over && (rWorld !== (current && current.id + ':' + gSeed))) { rScan -= dt; if (rScan <= 0) { rScan = 0.08; try { const R = rubyScan(); if (R) { U.ruby = R; rWorld = current && current.id + ':' + gSeed; } } catch (e) { U.ruby = []; rs = null; rWorld = current && current.id + ':' + gSeed; U.err = 'ruby ' + e; } } }
    { let near = null, nd = 44; for (const s of U.ruby || []) { const d = dist(P, s[0], s[2]); if (d < nd) { nd = d; near = s; } }
      keep('brute', false && over && !!near, 1, () => { const [x, , z] = near; for (let t = 0; t < 8; t++) { const X = x + ((Math.random() * 7) | 0) - 3, Z = z + ((Math.random() * 7) | 0) - 3, Y = topAt(X, Z); if (Y > SEA + 12 && !getB(X, Y, Z) && !getB(X, Y + 1, Z) && !getB(X, Y + 2, Z)) { const a = spawn('nm07', X + .5, Y, Z + .5, 'brute'); if (a) a.guard = [x, z]; return a; } } return null; }, dt); }
    // the sand island: Sneerin' Swaddles on the dunes at night; the tomb: Barrow Bandagers (always)
    const I = S.isle; const onIsle = I && dist(P, I.c[0], I.c[1]) < I.r + 30;
    keep('swaddle', over && isNight && !!onIsle && I.surf && I.surf.length, 2, () => { const [x, z] = I.surf[(Math.random() * I.surf.length) | 0]; if (dist(P, x, z) < 10) return null; return spawn('nm13', x + .5, topAt(x, z), z + .5, 'swaddle'); }, dt);
    const tb = I && I.tomb; keep('tomb', over && !!tb && tb.pts.length && dist(P, tb.x, tb.z) < 36 && P.y < SEA + 2, 2, () => { const p = tb.pts[(Math.random() * tb.pts.length) | 0]; return spawn('nm09', p[0], p[1], p[2], 'tomb'); }, dt);
    // the moss hag's hut
    const h = S.hut; keep('hag', over && !!h && dist(P, h.x, h.z) < 48, 1, () => spawn('nm11', h.x, h.y, h.z, 'hag'), dt);
    // the longship: Admiral Skelp on deck
    const b = S.boat; keep('skelp', over && !!b && b.deck && b.deck.length && dist(P, b.x, b.z) < 56, 1, () => { const p = b.deck[0]; const a = spawn('nm12', p[0], p[1], p[2], 'skelp'); if (a) a.post = p; return a; }, dt);
    // the place you last died: the Lang Hat Lurker, once a night
    if (!U.death) try { U.death = JSON.parse(localStorage.getItem(dkey()) || 'null'); } catch (_) {}
    const ds = U.death; keep('lurk', over && isNight && !!ds && (dist(P, ds[0], ds[2]) < 40 || (slots.get('lurk') || {a: []}).a.length > 0), 1, () => { if (lurkNight === dayNum || dist(P, ds[0], ds[2]) < 8) return null; lurkNight = dayNum; return spawn('nm14', ds[0], Math.max(ds[1], topAt(ds[0], ds[2])), ds[2], 'lurk'); }, dt);
    // specials that wander far from home go back (the Admiral stays on his ship)
    for (const a of (slots.get('skelp') || {a: []}).a) if (a.post && dist(a.g.position, a.post[0], a.post[2]) > 9) { a.g.position.set(a.post[0], a.post[1], a.post[2]); a.vy = 0; }
  }
  const ew = enterWorld; enterWorld = function () { slots.clear(); U.ruby = null; rWorld = null; rScan = 2; U.death = null; lurkNight = -1; rs = null; return ew.apply(this, arguments); };
})();
