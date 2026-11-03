/* ===================== GLX-C224 (v1.0.47): more freedom for the castle people - the hive mind (SUNNY) picks goals: fetch useful drops, chop a natural tree (the real
   break + falling-tree rules, then they collect the logs), mine exposed stone / ore at or above their feet on the surface or a cave mouth, craft better tools and armour
   from what they carry, and fight hostiles with them (a weapon adds to their swing, armour softens monster hits). Never touches anything you placed, never digs near or
   under your builds, never below their own feet (no holes), only near the castle and only when you are close; throttled so phones don't notice. ===================== */
(function c224() {
  const C = window.__c223; if (!C) return;
  const U = window.__c224 = {goals: {}, chopped: 0, mined: 0, crafted: {}, fights: 0, bonus: 0, soft: 0, scans: 0, ms: 0, err: null, log: []};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e).slice(0, 400); };
  const now = () => performance.now() / 1000;
  const isF = a => a && a.kind === 'clansman' && a.g && a.hp > 0 && !a.dead && a.ci;
  const placed = (x, y, z) => { try { return placedSet.has(idx(x, y, z)); } catch (_) { return true; } };
  const ORE = (() => { const s = new Set([T.COALORE, T.IRONORE, T.COPPERORE, T.GOLDORE, T.DIAMONDORE, T.REDORE, T.SILVERORE, T.LAZORE, T.RUBYORE].filter(v => v !== undefined)); return s; })();
  const air = (x, y, z) => { const b = getB(x, y, z); return b === T.AIR || (isPlant(b) && !LOGGY[b]); };
  // anything you built within 6 blocks sideways, 3 below or 12 above -> hands off
  function nearBuild(x, y, z) { for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) for (let dy = -3; dy <= 12; dy++) if (placed(x + dx, y + dy, z + dz)) return true; return false; }
  const inCastle = (a, x, z, pad) => { const ci = a.ci; return Math.abs(x + .5 - ci.cx) < ci.S + pad && Math.abs(z + .5 - ci.cz) < ci.S + pad; };
  const lane = (x, z) => { try { return !!(window.__c214 && __c214.inLane && __c214.inLane(x, z)); } catch (_) { return false; } };
  const skyOpen = (x, y, z) => { for (let k = y; k < Math.min(H - 1, y + 40); k++) if (solid(x, k, z) && !LEAFY[getB(x, k, z)]) return false; return true; };
  // ---- a natural tree: a trunk base on the ground, logs above, leaves in the crown, nothing of yours in it or beside it ----
  function treeAt(x, y, z) { if (!LOGGY[getB(x, y, z)] || !LOGGY[getB(x, y + 1, z)] || LOGGY[getB(x, y - 1, z)] || !solid(x, y - 1, z) || placed(x, y, z)) return null;
    const seen = new Set(), q = [[x, y, z]]; let logs = 0, leaves = 0;
    while (q.length && logs + leaves < 420) { const [cx, cy, cz] = q.pop(), k = cx + ',' + cy + ',' + cz; if (seen.has(k) || cy < y || Math.abs(cx - x) > 6 || Math.abs(cz - z) > 6) continue; seen.add(k);
      const b = getB(cx, cy, cz); if (!LOGGY[b] && !LEAFY[b]) continue; if (placed(cx, cy, cz)) return null; if (LOGGY[b]) logs++; else leaves++;
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) q.push([cx + dx, cy + dy, cz + dz]); }
    if (!leaves || logs > 40) return null; for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) for (let dy = -1; dy <= 8; dy++) if (placed(x + dx, y + dy, z + dz)) return null;
    return {x, y, z, logs}; }
  const stand = (x, y, z) => air(x, y, z) && air(x, y + 1, z) && solid(x, y - 1, z) && getB(x, y - 1, z) !== T.WATER;
  function spotBy(x, y, z, fy) { for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const yy of [fy, fy - 1, fy + 1, y]) if (stand(x + dx, yy, z + dz)) return [x + dx, yy, z + dz]; return null; }
  function findTree(a) { const p = a.g.position, fx = Math.floor(p.x), fy = Math.floor(p.y + 0.05), fz = Math.floor(p.z); let best = null, bd = 1e9;
    for (let dx = -14; dx <= 14; dx++) for (let dz = -14; dz <= 14; dz++) { const x = fx + dx, z = fz + dz, d = dx * dx + dz * dz; if (d > 196 || d >= bd || !inCastle(a, x, z, 9) || inCastle(a, x, z, -1) || lane(x, z)) continue;
      for (let y = fy - 3; y <= fy + 3; y++) { if (!LOGGY[getB(x, y, z)] || LOGGY[getB(x, y - 1, z)]) continue; const t = treeAt(x, y, z); if (!t) continue; const s = spotBy(x, y, z, fy); if (s) { best = Object.assign(t, {s}); bd = d; } break; } }
    return best; }
  // ---- exposed stone / ore: touching open air under the sky, at or above their feet, natural, away from your builds ----
  function findRock(a, wantStone) { const p = a.g.position, fx = Math.floor(p.x), fy = Math.floor(p.y + 0.05), fz = Math.floor(p.z); let best = null, bs = -1;
    for (let dx = -10; dx <= 10; dx++) for (let dz = -10; dz <= 10; dz++) { const x = fx + dx, z = fz + dz; if (!inCastle(a, x, z, 9) || inCastle(a, x, z, 3) || lane(x, z)) continue;
      for (let y = fy; y <= fy + 3; y++) { const b = getB(x, y, z), ore = ORE.has(b); if (!ore && !(wantStone && b === T.STONE)) continue; if (placed(x, y, z)) continue;
        const up = getB(x, y + 1, z); if (up !== T.AIR && up !== T.STONE && !ORE.has(up)) continue;   // nothing left floating on top
        let open = null; for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (air(x + ox, y, z + oz) && skyOpen(x + ox, y + 1, z + oz)) { open = [x + ox, z + oz]; break; } if (!open) continue;
        const sc = (ore ? 100 : 10) - Math.hypot(dx, dz); if (sc <= bs) continue; const s = spotBy(x, y, z, fy); if (!s || s[1] > y + 1) continue; if (nearBuild(x, y, z)) continue; best = {x, y, z, b, s}; bs = sc; } }
    return best; }
  // ---- the break itself: the same drops as yours, a falling tree when it's a trunk ----
  let lastBreak = 0;
  function breakIt(x, y, z) { const b = getB(x, y, z); if (!b || placed(x, y, z)) return false; setB(x, y, z, T.AIR);
    try { for (const [id, n] of dropsFor(b)) dropItem(id, n, x + .5, y + .4, z + .5, (Math.random() - .5) * 1.2, 2.4, (Math.random() - .5) * 1.2, 0.3); } catch (e) { ERR(e); }
    try { burst(x + .5, y + .5, z + .5, blockColor(b), 12); sfx3d('break', {x: x + .5, y: y + .5, z: z + .5}, 16); } catch (_) {}
    if (LOGGY[b] && LOGGY[getB(x, y + 1, z)]) try { fellTree(x, y, z); } catch (e) { ERR(e); }
    try { rebuild(); } catch (_) {} lastBreak = now(); return true; }
  // ---- crafting from the bag (instant, one thing at a time, only when it is a step up) ----
  const LOGS = a => Object.keys(C.inv(a)).filter(k => LOGGY[k]);
  const PL = a => Object.keys(C.inv(a)).filter(k => /planks/i.test(String(NAMES[k] || '')));
  const cntL = (a, ks) => ks.reduce((s, k) => s + C.n(a, +k), 0);
  function use(a, ks, c) { for (const k of ks) { const t = Math.min(c, C.n(a, +k)); if (t > 0) { C.add(a, +k, -t); c -= t; } if (c <= 0) return true; } return c <= 0; }
  const ING = id => String(NAMES[id] || '').toLowerCase();
  const byName = re => Object.keys(C.inv(a0)).filter(k => re.test(ING(+k)));
  let a0 = null;
  function craft(a) { a0 = a; const I = C.inv(a), st = () => C.n(a, IT.STICK), cob = () => C.n(a, T.COBBLE);
    const made = (id, why) => { C.add(a, id, 1); U.crafted[NAMES[id] || id] = (U.crafted[NAMES[id] || id] || 0) + 1; a.swingT = 0.3; try { sfx3d('place', a.g.position, 10); } catch (_) {} U.log.push((a.name || 'folk') + ' made ' + (NAMES[id] || id)); if (U.log.length > 30) U.log.shift(); return true; };
    if (cntL(a, PL(a)) < 6 && LOGS(a).length) { const k = +LOGS(a)[0]; C.add(a, k, -1); C.add(a, T.PLANKS, 4); return true; }
    if (st() < 4 && cntL(a, PL(a)) >= 2) { use(a, PL(a), 2); C.add(a, IT.STICK, 4); return true; }
    // smelting in the castle hearth: raw metal + a bit of fuel
    const fuel = () => byName(/coal|charcoal/).concat(LOGS(a));
    for (const [re, out] of [[/^raw iron/, IT.IRONINGOT], [/^raw copper/, IT.COPPERINGOT], [/^raw gold/, IT.GOLDINGOT]]) { const r = byName(re); if (r.length && fuel().length && out) { use(a, r, 1); use(a, fuel(), 1); C.add(a, out, 1); return true; } }
    const tier = list => C.tier(a, list), ir = () => C.n(a, IT.IRONINGOT), cu = () => C.n(a, IT.COPPERINGOT), dia = () => C.n(a, IT.DIAMOND);
    const steps = [[C.AX, 3, 2], [C.SW, 2, 1], [C.PK, 3, 2]];
    for (const [L, m, s] of steps) { const t = tier(L);
      if (t < 4 && dia() >= m && st() >= s && L[3]) { C.add(a, IT.DIAMOND, -m); C.add(a, IT.STICK, -s); return made(L[3]); }
      if (t < 3 && ir() >= m && st() >= s) { C.add(a, IT.IRONINGOT, -m); C.add(a, IT.STICK, -s); return made(L[2]); }
      if (t < 2 && cob() >= m && st() >= s) { C.add(a, T.COBBLE, -m); C.add(a, IT.STICK, -s); return made(L[1]); }
      if (t < 1 && cntL(a, PL(a)) >= m && st() >= s) { use(a, PL(a), m); C.add(a, IT.STICK, -s); return made(L[0]); } }
    const arm = C.armour(a), need = [5, 8, 7, 4];
    for (let i = 0; i < 4; i++) { const v = arm.ids[i] ? C.ARMOUR.get(arm.ids[i])[1] : 0;
      if (v < 2 && ir() >= need[i] && C.ARMS[2][i]) { C.add(a, IT.IRONINGOT, -need[i]); return made(C.ARMS[2][i]); }
      if (v < 1 && cu() >= need[i] && C.ARMS[0][i]) { C.add(a, IT.COPPERINGOT, -need[i]); return made(C.ARMS[0][i]); } }
    // only the best of each kept: older tools go back into the hearth
    for (const L of [C.AX, C.SW, C.PK]) { const [b] = C.best(a, L); for (const id of L) if (id && id !== b && C.n(a, id)) C.add(a, id, -C.n(a, id)); }
    return false; }
  // ---- the hive picks a goal ----
  function decide(a) { const t = now(); if ((a.__dT || 0) > t) return; a.__dT = t + 3 + Math.random() * 2; if (a.__task) return;
    if (craft(a)) { a.__dT = t + 1.5; return; }
    let st = null; try { if (window.SUNNY_BRAIN) st = SUNNY_BRAIN.cycle('Choose work for ' + (a.name || 'one o us')).internalState; } catch (_) {}
    const cur = st && st.curiosity != null ? st.curiosity : 0.5, en = st && st.energy != null ? st.energy : 0.6;
    const logs = cntL(a, LOGS(a)) + cntL(a, PL(a)) / 4, pick = C.tier(a, C.PK), w = {};
    const d = C.findDrop(a, 10); if (d) w.fetch = 2;
    if (t - lastBreak > 3) { if (logs < 6 && !((a.__chopCd || 0) > t)) w.chop = 0.6 + en * 0.6; if (pick && !((a.__mineCd || 0) > t)) w.mine = 0.5 + cur * 0.6; }
    w.rest = 0.5;
    let tot = 0; for (const k in w) tot += w[k]; let r = Math.random() * tot, g = 'rest'; for (const k in w) { r -= w[k]; if (r <= 0) { g = k; break; } }
    const T0 = performance.now(); let task = null;
    if (g === 'fetch') task = {g, d};
    else if (g === 'chop') { U.scans++; const tr = findTree(a); a.__chopCd = t + (tr ? 40 : 20); if (tr) task = {g, tr, s: tr.s}; }
    else if (g === 'mine') { U.scans++; const pt = C.tier(a, C.PK); a.__mineCd = t + 20; const rk = pt ? findRock(a, C.n(a, T.COBBLE) < 8) : null;
      const req = b => b === T.DIAMONDORE || b === T.RUBYORE ? 3 : b === T.COALORE || b === T.STONE ? 1 : 2; if (rk && pt >= req(rk.b)) { task = {g, rk, s: rk.s}; a.__mineCd = t + 12; } }
    U.ms += performance.now() - T0;
    if (task) { task.t0 = t; task.hit = 0; a.__task = task; U.goals[g] = (U.goals[g] || 0) + 1; try { if (window.SUNNY_BRAIN) SUNNY_BRAIN.predict((a.name || 'One o us') + ' goes to ' + g, g + ' done'); } catch (_) {} } }
  function done(a, ok) { const k = a.__task; a.__task = null; a.__heldWant = 0; try { if (window.SUNNY_BRAIN) SUNNY_BRAIN.reflect(ok ? k.g + ' done' : k.g + ' failed'); } catch (_) {} }
  // ---- doing it: walking there with their own legs (the castle wander), then the work ----
  function work(a, dt) { const k = a.__task, p = a.g.position, t = now(); if (t - k.t0 > 40) return done(a, false);
    const go = (x, z, y) => { if (!a.wp || Math.abs(a.wp[0] - x - .5) + Math.abs(a.wp[1] - z - .5) > 0.1) a.wp = [x + .5, z + .5]; a.wpT = 9; a.idle = 0; a.wpY = y; a.wpRef = a.wp; };
    if (k.g === 'fetch') { const d = k.d; if (drops.indexOf(d) < 0) return done(a, false); if (Math.hypot(d.x - p.x, d.z - p.z) < 1.4) { C.grab(a, d); return done(a, true); } go(Math.floor(d.x), Math.floor(d.z), Math.floor(d.y + 0.05)); return; }
    const tg = k.g === 'chop' ? k.tr : k.rk, s = k.s;
    if (k.g === 'chop' ? !LOGGY[getB(tg.x, tg.y, tg.z)] : getB(tg.x, tg.y, tg.z) !== tg.b) return done(a, false);
    if (Math.hypot(s[0] + .5 - p.x, s[2] + .5 - p.z) > 0.9) { go(s[0], s[2], s[1]); return; }
    a.__heldWant = k.g === 'chop' ? C.best(a, C.AX)[0] : C.best(a, C.PK)[0]; a.idle = 0.4; a.wp = null; a.ang = Math.atan2(tg.x + .5 - p.x, tg.z + .5 - p.z); a.act = 'work';
    const tier = C.tier(a, k.g === 'chop' ? C.AX : C.PK), need = (k.g === 'chop' ? [4, 2.6, 2, 1.4, 1] : [5, 3, 2.2, 1.6, 1.2])[tier];
    k.hit += dt; k.sw = (k.sw || 0) - dt; if (k.sw <= 0) { k.sw = 0.5; a.swingT = 0.4; try { sfx3d('dig', {x: tg.x + .5, y: tg.y + .5, z: tg.z + .5}, 14); burst(tg.x + .5, tg.y + .5, tg.z + .5, blockColor(getB(tg.x, tg.y, tg.z)), 3, 0.4); } catch (_) {} }
    if (k.hit >= need && now() - lastBreak > 1) { if (breakIt(tg.x, tg.y, tg.z)) { if (k.g === 'chop') U.chopped++; else U.mined++; } done(a, true); a.__dT = now() + (k.g === 'chop' ? 2.5 : 1); } }
  // ---- fighting: a hostile near one of them while working outside the walls gets their weapon ----
  function hostileNear(a, r) { const p = a.g.position; let b = null, bd = r; for (const m of mobs) { if (!m || !m.hostile || m.kind === 'clansman' || m.tame || !(m.hp > 0) || !m.g) continue;
      const q = m.g.position, d = Math.hypot(q.x - p.x, q.z - p.z); if (d < bd && Math.abs(q.y - p.y) < 3 && inCastle(a, q.x, q.z, 9)) { bd = d; b = m; } } return b; }
  let curA = null;
  const W = {}; C.SW.forEach((id, i) => id && (W[id] = i + 1)); C.AX.forEach((id, i) => id && (W[id] = W[id] || Math.max(1, i)));
  const dm = damageMob; damageMob = function (m, dmg, byPlayer) {
    try { if (curA && !byPlayer && m && m !== curA && m.kind !== 'clansman') { const b = W[C.heldFor(curA)] || 0; if (b) { dmg += b; U.bonus++; } }
      else if (m && m.kind === 'clansman' && !byPlayer && !curA) { const pts = C.armour(m).pts; if (pts) { dmg = Math.max(0.5, dmg * (1 - Math.min(0.5, pts * 0.05))); U.soft++; } } } catch (e) { ERR(e); }
    return dm.call(this, m, dmg, byPlayer); };
  U.findTree = findTree; U.findRock = findRock; U.give = (a, task) => { task.t0 = now(); task.hit = 0; a.__task = task; U.goals[task.g] = (U.goals[task.g] || 0) + 1; }; U.done = done;
  const ca = clanAI; clanAI = function (a, dt) {
    let pre = false;
    try { if (isF(a) && started && !DIM.cur && !isNight && !a.trading && !a.sleeping && !(a.angryT > 0) && !a.tgt && Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z) < 40) {
        const h = (a.__hT = (a.__hT || 0) - dt) <= 0 ? (a.__hT = 0.7, hostileNear(a, 8)) : null;
        if (h && (C.heldFor(a) || a.hp > 12)) { a.tgt = h; U.fights++; if (a.__task) done(a, false); }
        else { if (!a.__task) decide(a); if (a.__task) { work(a, dt); pre = true; } } }
      else if (a && a.__task && (isNight || a.tgt || a.trading)) done(a, false); } catch (e) { ERR(e); a.__task = null; }
    curA = a; let r; try { r = ca.apply(this, arguments); } finally { curA = null; }
    if (pre && a.__task && a.act !== 'fight') { try { const k = a.__task; if (k.g !== 'fetch' && k.s && Math.hypot(k.s[0] + .5 - a.g.position.x, k.s[2] + .5 - a.g.position.z) <= 0.9) { const tg = k.tr || k.rk; a.ang = Math.atan2(tg.x + .5 - a.g.position.x, tg.z + .5 - a.g.position.z); } } catch (_) {} }
    return r; };
  const ew = enterWorld; enterWorld = function () { for (const m of mobs) if (m) m.__task = null; return ew.apply(this, arguments); };
})();
