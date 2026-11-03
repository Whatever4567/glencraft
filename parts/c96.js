/* ===================== GLX-C96 (v0.9.74 + v0.9.75): the two clansmen get a survival brain (real inventories, crafting, chopping, hunting, cooking, chests, mining, smelting, iron gear, beds at night) and then a war campaign (mossy castle -> black castle -> portal -> Hell -> back for you) ===================== */
(function c96() {
  const A = typeof C78 !== 'undefined' && C78.api, C95 = window.__c95; if (!A || !C95) return;
  const B = window.__bots = {tl: [], gt: 0, on: true, st: {trees: 0, logs: 0, crafted: 0, hunted: 0, simHunt: 0, cooked: 0, smelted: 0, ate: 0, mined: 0, ores: 0, stone: 0, kills: 0, deposits: 0, withdrawals: 0, slept: 0, raids: 0, placed: 0}, crafts: [], ev: [], team: null};
  const fresh = () => ({phase: 'survive', step: null, cleared: [], hellT: 0, hellBots: null, portal: null, noSpawn: (B.team && B.team.noSpawn) || [], hostDead: 0});
  B.team = fresh();
  const TM = () => B.team || (B.team = fresh());
  const isB = m => m && m.kind === 'clansman' && m.role && A.ROLES.includes(m.role);
  const bots = () => mobs.filter(isB);
  const say = (s, loud) => { B.ev.push([Math.round(performance.now() / 1000), s]); if (B.ev.length > 60) B.ev.shift(); if (loud) try { toast(s); } catch (_) {} };
  const wb = (x, y, z) => (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) ? 0 : world[(x * H + y) * D + z];
  const placed = (x, y, z) => { try { return typeof placedSet !== 'undefined' && placedSet.has(idx(x, y, z)); } catch (_) { return false; } };
  const spark = (x, y, z, c, n, s) => { try { burst(x, y, z, c, n, s); } catch (_) {} };
  const snd = (k, p, r) => { try { sfx3d(k, p, r || 10); } catch (_) {} };

  // ================= inventory =================
  const inv = a => a.inv || (a.inv = {});
  const has = (a, id) => (a.inv && a.inv[id]) || 0;
  function add(a, id, n) { if (id == null || !n) return; const I = inv(a); I[id] = (I[id] || 0) + n; if (I[id] <= 0) delete I[id]; }
  const logN = a => { let n = 0; for (const k in inv(a)) if (LOGGY[k]) n += a.inv[k]; return n; };
  function useLogs(a, n) { for (const k of Object.keys(inv(a))) { if (!LOGGY[k] || n <= 0) continue; const t = Math.min(n, a.inv[k]); add(a, +k, -t); n -= t; } return n <= 0; }
  const nOf = (a, id) => id === T.LOG ? logN(a) : has(a, id);
  const wood = a => logN(a) * 4 + has(a, T.PLANKS);
  const FOODS = A.FOODS, RAW = A.RAW.filter(id => id !== IT.POTATO).concat(A.RAW.filter(id => id === IT.POTATO));
  const cooked = a => FOODS.reduce((s, id) => s + has(a, id), 0);
  const rawN = a => RAW.reduce((s, id) => s + has(a, id), 0);
  const ORE_RAW = [IT.RAWIRON, IT.RAWGOLD, IT.RAWCOPPER].filter(v => v !== undefined);
  const PICKS = [IT.WPICK, IT.SPICK, IT.IPICK], AXES = [IT.WAXE, IT.SAXE, IT.IAXE], SWORDS = [IT.WSWORD, IT.SSWORD, IT.ISWORD];
  const IRON_ARM = [108, 109, 110, 111], ARM_COST = [5, 8, 7, 4];
  function best(a, kind) { let b = 0, bl = 0; for (const k in inv(a)) { const t = TOOL[k]; if (t && t[0] === kind && t[1] > bl) { bl = t[1]; b = +k; } } return b; }
  const lvl = (a, kind) => { const b = best(a, kind); return b ? TOOL[b][1] : 0; };
  const ironArm = a => (a.armour || []).filter(id => (id >= 108 && id <= 111) || (id >= 129 && id <= 132)).length;
  // v0.9.79 gather-first: iron still needed for the whole kit (iron pick + sword + all four armour pieces)
  const isIronA = id => (id >= 108 && id <= 111) || (id >= 129 && id <= 132);
  const ironNeed = a => (lvl(a, 'pick') < 3 ? 3 : 0) + (lvl(a, 'sword') < 3 ? 2 : 0) + IRON_ARM.reduce((n, id, i) => n + (isIronA((a.armour || [])[i]) ? 0 : ARM_COST[i]), 0);
  const ironHave = a => has(a, IT.IRONINGOT) + has(a, IT.RAWIRON);
  const kitted = a => ironNeed(a) === 0;
  const armRed = a => (a.armour || []).reduce((s, id) => s + (id >= 129 && id <= 132 ? 0.15 : id >= 108 && id <= 111 ? 0.11 : id >= 112 && id <= 115 ? 0.09 : id ? 0.07 : 0), 0);
  const fuelPts = a => (has(a, IT.COAL) + has(a, IT.CHARCOAL)) * 8 + has(a, T.PLANKS) * 1.5 + logN(a) * 1.5;

  // ================= crafting with the game's own recipes =================
  const REC = id => RECIPES.find(r => r.out === id && !r.need.some(q => q[0] === T.IRONBLOCK));
  let DRY = false;
  function craft(a, id) {
    const r = REC(id); if (!r) return false;
    if (!r.need.every(([nid, n]) => nOf(a, nid) >= n)) return false;
    for (const [nid, n] of r.need) { if (nid === T.LOG) useLogs(a, n); else add(a, nid, -n); }
    add(a, id, r.n); if (DRY) return true; B.st.crafted++; B.crafts.push(NAMES[id] || String(id)); if (B.crafts.length > 40) B.crafts.shift();
    return true;
  }
  function planks(a, n) { while (has(a, T.PLANKS) < n && logN(a) > 0) if (!craft(a, T.PLANKS)) break; return has(a, T.PLANKS) >= n; }
  function sticks(a, n) { while (has(a, IT.STICK) < n) { if (!planks(a, 2) || !craft(a, IT.STICK)) break; } return has(a, IT.STICK) >= n; }
  // everything worth making right now; dry run unless real (crafting needs the table)
  function upgrades(a, real) {
    const keepI = JSON.stringify(inv(a)), keepA = (a.armour || []).slice(), made = []; DRY = !real;
    for (const [list, kind, m] of [[PICKS, 'pick', 3], [SWORDS, 'sword', 2], [AXES, 'axe', 3]]) {
      const cur = lvl(a, kind);
      for (let t = 3; t > cur; t--) {
        if (t === 3 && kind === 'axe' && ironArm(a) < 2) continue;   // iron goes to pick, sword and armour first
        const mat = t === 3 ? IT.IRONINGOT : t === 2 ? T.COBBLE : T.PLANKS, st = kind === 'sword' ? 1 : 2;
        const okM = mat === T.PLANKS ? wood(a) >= m + 2 : nOf(a, mat) >= m && wood(a) + has(a, IT.STICK) * 2 >= (has(a, IT.STICK) >= st ? 0 : 2);
        if (!okM) continue;
        const snap = JSON.stringify(inv(a));
        if (sticks(a, st) && (mat !== T.PLANKS || planks(a, m)) && craft(a, list[t - 1])) { made.push(list[t - 1]); break; }
        a.inv = JSON.parse(snap);
      }
    }
    if (lvl(a, 'pick') >= 3 && lvl(a, 'sword') >= 3) for (const s of [0, 3, 2, 1]) {
      const cur = (a.armour || [])[s] || 0; if ((cur >= 108 && cur <= 111) || (cur >= 129 && cur <= 132)) continue;
      if (has(a, IT.IRONINGOT) >= ARM_COST[s] && craft(a, IRON_ARM[s])) { add(a, IRON_ARM[s], -1); if (!a.armour) a.armour = [104, 105, 106, 107]; a.armour[s] = IRON_ARM[s]; made.push(IRON_ARM[s]); }
    }
    DRY = false; if (!real) { a.inv = JSON.parse(keepI); a.armour = keepA; }
    return made;
  }
  // ================= the castle's things =================
  function chestOf(ci) {
    let c = ci.chests.find(q => { const d = chests.get(q.k); return d && (d.castle === 'human' || d.castle === 'bots'); });
    if (c && !chests.get(c.k)) c = null;
    return c || null;
  }
  const chestCount = (ch, ids) => ids.reduce((s, id) => s + A.chestCount(ch.k, id), 0);
  function placeInside(ci, id, extra) {   // put a block they made onto a free indoor floor cell
    for (let t = 0; t < 40 && ci.indoor.length; t++) { const q = ci.indoor[(Math.random() * ci.indoor.length) | 0], [x, y, z] = q;
      if (wb(x, y, z) || wb(x, y - 1, z) === T.BED || ci.beds.some(b => Math.abs(b.x - x) + Math.abs(b.z - z) < 3)) continue;
      const ac = A.access(x, y, z); if (!ac) continue;
      A.placeBlock(x, y, z, id, extra && extra.meta); B.st.placed++; return {x, y, z, a: ac}; }
    return null;
  }
  function needTable(a, ci) {
    if (ci.table && wb(ci.table.x, ci.table.y, ci.table.z) === T.TABLE) return ci.table;
    ci.table = null; if (!planks(a, 4)) return null;
    if (!craft(a, T.TABLE)) return null; add(a, T.TABLE, -1);
    const t = placeInside(ci, T.TABLE); if (!t) { add(a, T.TABLE, 1); return null; }
    ci.table = t; try { (C78.saved[ci.k] || (C78.saved[ci.k] = {})).table = [t.x, t.y, t.z]; } catch (_) {}
    say(a.role + ' crafted and placed a crafting table'); return t;
  }
  function needChest(a, ci) {
    const c = chestOf(ci); if (c) return c; if (!planks(a, 8)) return null;
    const t = placeInside(ci, T.CHEST, {meta: {face: 0}}); if (!t) return null; add(a, T.PLANKS, -8);
    const k = keyOf(t.x, t.y, t.z); chests.set(k, {slots: new Array(27).fill(null), castle: 'bots'});
    const c2 = {k, x: t.x, y: t.y, z: t.z, a: t.a}; ci.chests.unshift(c2); say(a.role + ' built a chest'); return c2;
  }
  // what a bot keeps on him; the rest goes in the chest
  function keepOf(a, id) {
    id = +id;
    if (TOOL[id]) return best(a, TOOL[id][0]) === id ? 1 : 0;
    if (FOODS.includes(id)) return 8; if (RAW.includes(id)) return 99;
    if (LOGGY[id]) return 6; if (id === T.PLANKS) return 16; if (id === IT.STICK) return 8;
    if (id === T.COBBLE) return 20; if (id === IT.COAL || id === IT.CHARCOAL) return 16;
    if (id === IT.IRONINGOT) return ironArm(a) >= 2 && lvl(a, 'pick') >= 3 ? 4 : 99;
    if (id === T.TABLE || id === T.FURNACE) return 1;
    if (id === IT.RAWIRON) return 99; if (id === T.OBSIDIAN || id === IT.FLINTSTEEL) return 99;
    return 0;
  }
  const surplus = a => Object.keys(inv(a)).reduce((s, k) => s + Math.max(0, a.inv[k] - keepOf(a, k)), 0);
  function wants(a, ch) {   // things in the chest this bot could use
    if (!ch) return [];
    const out = [];
    if (cooked(a) < 4) for (const id of FOODS) if (A.chestCount(ch.k, id)) out.push([id, 6 - cooked(a)]);
    if (wood(a) < 12) { for (const id of [T.PLANKS, T.LOG]) if (A.chestCount(ch.k, id)) out.push([id, id === T.PLANKS ? 16 : 6]); for (const k of Object.keys(LOGGY)) if (+k !== T.LOG && LOGGY[k] && A.chestCount(ch.k, +k)) out.push([+k, 6]); }
    if (lvl(a, 'pick') < 3 || ironArm(a) < 2) { if (A.chestCount(ch.k, IT.IRONINGOT)) out.push([IT.IRONINGOT, a.role === 'miner' ? 64 : 9]); if (A.chestCount(ch.k, IT.RAWIRON)) out.push([IT.RAWIRON, 64]); }
    if (lvl(a, 'sword') < 2 || lvl(a, 'pick') < 2) if (has(a, T.COBBLE) < 8 && A.chestCount(ch.k, T.COBBLE)) out.push([T.COBBLE, 12]);
    if (fuelPts(a) < 8) for (const id of [IT.COAL, IT.CHARCOAL]) if (A.chestCount(ch.k, id)) out.push([id, 8]);
    if (RAW.some(id => A.chestCount(ch.k, id)) && ci0(a) && ci0(a).furn) for (const id of RAW) if (A.chestCount(ch.k, id)) out.push([id, 16]);
    return out;
  }
  const ci0 = a => a.ci;

  // ================= world scan around home: trees, stone, ores (a few columns a frame) =================
  const SCAN = new Map();
  function scanOf(ci) { let s = SCAN.get(ci.k); if (!s) { s = {x: null, trees: [], stone: [], ores: [], nt: [], ns: [], no: [], at: -1e9, bad: new Set()}; SCAN.set(ci.k, s); } return s; }
  const R = 38;
  function scanStep(ci, cols) {
    const s = scanOf(ci);
    if (s.x === null) { if (performance.now() - s.at < 90000) return; s.x = ci.cx - R; s.nt = []; s.ns = []; s.no = []; }
    const inCastle = (x, z) => Math.abs(x - ci.cx) <= ci.S + 3 && Math.abs(z - ci.cz) <= ci.S + 3;
    for (let n = 0; n < cols && s.x <= ci.cx + R; n++, s.x++) {
      const x = s.x; if (x < 3 || x >= W - 3) continue;
      for (let z = Math.max(3, ci.cz - R); z <= Math.min(D - 4, ci.cz + R); z++) {
        const gy = A.groundY(x, z), cast = inCastle(x, z);
        if (!cast && LOGGY[wb(x, gy, z)] && LOGGY[wb(x, gy + 1, z)] && !placed(x, gy, z)) { const ac = A.access(x, gy, z); if (ac) s.nt.push([x, gy, z, ac[0], ac[1], ac[2]]); }
        for (let y = 3; y < Math.min(H - 2, gy + 1); y++) {
          const b = world[(x * H + y) * D + z];
          const ore = A.ORES.has(b), st = !ore && b === T.STONE && !cast && s.ns.length < 600 && y >= gy - 8;
          if (!ore && !st) continue; if (placed(x, y, z)) continue;
          for (const [ax, ay, az] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [1, -1, 0], [-1, -1, 0], [0, -1, 1], [0, -1, -1]]) {
            const sx = x + ax, sy = y + ay, sz = z + az; if (A.stand(sx, sy, sz)) { (ore ? s.no : s.ns).push([x, y, z, sx, sy, sz]); break; } }
        }
      }
    }
    if (s.x > ci.cx + R) { s.trees = s.nt; s.stone = s.ns; s.ores = s.no; s.x = null; s.at = performance.now(); }
  }
  const ORE_LVL = id => id === T.COALORE ? 1 : (id === T.GOLDORE || id === T.DIAMONDORE || id === T.REDORE) ? 3 : 2;
  const claimed = (a, o) => bots().some(m => m !== a && m.job && m.job.o && m.job.o[0] === o[0] && m.job.o[1] === o[1] && m.job.o[2] === o[2]);
  function nearestOf(a, list, ok) { const p = a.g.position; let b = null, bd = 1e9; for (const o of list) { if (!ok(o)) continue; const d = Math.hypot(o[0] - p.x, o[2] - p.z) + Math.abs(o[1] - p.y) * 1.5; if (d < bd) { bd = d; b = o; } } return b; }

  // ================= movement: real paths near you, cheap gliding when far away =================
  // v0.9.76: near you they walk a real A* path at player speed (sprint past 8 blocks), digging through what's in the way
  // v0.9.76: no path out from down a mine -> cut a staircase up toward the goal (player style: clear head-room, step up, repeat)
  // v0.9.77: move along the path direction (a.ang), not the smoothed body yaw - turning at a limited rate while sprinting made them orbit waypoints
  // v0.9.78: open a door (and its double-door partner) or a gate in the way; they close again behind (base auto-close)
  function openDoor(x, y, z, p) {
    const b = wb(x, y, z), t = performance.now();
    if (b === 226) { const gk = keyOf(x, y, z), gm = entMeta.get(gk) || {face: 0, open: 0}; if (!gm.open) { gm.open = 1; const along = gm.face ? p.x - (x + .5) : p.z - (z + .5); gm.dir = along > 0 ? -1 : 1; entMeta.set(gk, gm); C78.doors.push({key: gk, gate: 1, x, y, z, t}); try { sfx3d('doorOpen', p, 10); } catch (_) {} } return; }
    const ly = b === T.DOORTOP ? y - 1 : y, list = [[x, z]]; const q = typeof window.doorPartner === 'function' ? window.doorPartner(x, ly, z) : null; if (q) list.push(q);
    let any = false; for (const [dx, dz] of list) { const key = keyOf(dx, ly, dz); if (!doorState.get(key)) { doorState.set(key, true); C78.doors.push({key, x: dx, y: ly, z: dz, t}); any = true; } }
    if (any) try { sfx3d('doorOpen', p, 10); } catch (_) {}
  }
  function stepD(a, spd, dt, wd) { const yv = a.yawVis; a.yawVis = a.ang; const r = stepMob(a, spd, dt, wd); a.yawVis = yv; return r; }
  // v0.9.77 circling guard (kept on the bot, so re-plans don't reset it): walked a lot but < 1.5 blocks net in 4 s -> drop the goal
  function circ(a, dt) {
    const p = a.g.position, c = a.cg || (a.cg = {t: 0, x: p.x, z: p.z, lx: p.x, lz: p.z, len: 0});
    c.len += Math.hypot(p.x - c.lx, p.z - c.lz); c.lx = p.x; c.lz = p.z; c.t += dt;
    if (c.t < 4) return false;
    const net = Math.hypot(p.x - c.x, p.z - c.z), bad = c.len > 5 && net < 1.5;
    c.t = 0; c.len = 0; c.x = p.x; c.z = p.z;
    if (bad) { B.pst.circ = (B.pst.circ || 0) + 1; a.goFail = 99; a.wk = null; a.wp = null; if (a.job) a.job.way = null; return true; }
    return false;
  }
  function stairUp(a, w, tx, tz, dt) {
    const p = a.g.position, cx = Math.floor(p.x), cy = Math.floor(p.y + 0.05), cz = Math.floor(p.z);
    if (!w.sd) { const dx = tx + .5 - p.x, dz = tz + .5 - p.z; w.sd = Math.abs(dx) > Math.abs(dz) ? [Math.sign(dx) || 1, 0] : [0, Math.sign(dz) || 1]; w.st = 0; w.turn = 0; }
    const [dx, dz] = w.sd, nx = cx + dx, nz = cz + dz;
    const cells = [[cx, cy + 2, cz], [nx, cy + 1, nz], [nx, cy + 2, nz]];
    const bad = cells.some(q => solid(q[0], q[1], q[2]) && !canDig(a, q[0], q[1], q[2])) || cells.some(q => liquid(wb(q[0], q[1], q[2]))) || liquid(wb(nx, cy + 3, nz)) || !solid(nx, cy, nz);
    if (bad && !solid(nx, cy, nz) && !solid(nx, cy + 1, nz) && solid(nx, cy - 1, nz) && !liquid(wb(nx, cy, nz))) {   // flat floor that way (cave): just walk on
      a.ang = Math.atan2(nx + .5 - p.x, nz + .5 - p.z); stepD(a, SP.work, dt, false); a.moving = true; a.curSpd = SP.work; w.st += dt; if (w.st > 3) { p.x = nx + .5; p.z = nz + .5; w.st = 0; } return 0; }
    if (bad) { w.turn++; if (w.turn > 8) return -1; w.sd = w.turn % 2 ? [dz, -dx] : [-dz, dx]; if (w.turn % 4 === 0) w.sd = [-dx, -dz]; return 0; }
    const sq = cells.find(q => solid(q[0], q[1], q[2]));
    if (sq) { a.moving = false; a.curSpd = 0; breakAt(a, w, sq[0], sq[1], sq[2], false); return 0; }
    a.ang = Math.atan2(nx + .5 - p.x, nz + .5 - p.z); if (a.onGround !== false) { a.vy = 6.6; a.onGround = false; }
    stepD(a, SP.work, dt, false); a.moving = true; a.curSpd = SP.work; w.st += dt;
    if (Math.floor(p.x) === nx && Math.floor(p.z) === nz && Math.floor(p.y + 0.05) >= cy) { w.st = 0; w.turn = 0; w.upN = (w.upN || 0) + 1; return 1; }
    if (w.st > 3) { p.x = nx + .5; p.z = nz + .5; p.y = cy + 1; w.st = 0; }
    return 0;
  }
  function walkWay(a, x, y, z, spd, dt) {
    const p = a.g.position, d = Math.hypot(x + .5 - p.x, z + .5 - p.z);
    if (d < 0.6 && Math.abs(y - p.y) < 1.3) { a.wk = null; return true; }
    let w = a.wk; const gk = x + ',' + y + ',' + z;
    if (!w || w.gk !== gk) w = a.wk = {gk, way: null, rp: 0, sT: 0, sp: [p.x, p.z], stuck: 0, fails: 0};
    w.dt = dt; w.rp -= dt;
    if (w.up) { const cx = Math.floor(p.x), cy = Math.floor(p.y + 0.05), cz = Math.floor(p.z);
      if (cy >= A.groundY(cx, cz) - 1 || cy >= y || (w.upN || 0) > 60) { w.up = 0; w.way = null; w.fails = 0; w.cd = 0; }
      else { if (stairUp(a, w, x, z, dt) < 0) { w.up = 0; a.goFail = 99; } return false; } }
    if (w.cd > 0) { w.cd -= dt; a.moving = false; a.curSpd = 0; return false; }
    if (!w.way || w.rp < -6) {
      if (B.fn > 5000) { a.moving = false; return false; }   // A* budget for this tick used up: plan next tick
      w.rp = 0; const cx = Math.floor(p.x), cy = Math.floor(p.y + 0.05), cz = Math.floor(p.z);
      w.way = findWay(cx, cy, cz, x, y, z, 48, (typeof PERF !== 'undefined' && PERF) ? 2500 : 5000, a);
      if (!w.way && y > cy + 2 && cy < A.groundY(cx, cz) - 2 && !w.upTried) { w.up = 1; w.upTried = 1; w.sd = null; return false; }   // down a mine: stair up
      if (!w.way) { w.fails++; w.way = null; w.cd = 1; if (w.fails >= 2) { a.goFail = 99; return false; } a.goFail = (a.goFail || 0) + 1; return false; }
      if (!w.way.length) { a.wk = null; return true; }
    }
    const cy = Math.floor(p.y + 0.05), cx = Math.floor(p.x), cz = Math.floor(p.z);
    while (w.way.length && ((Math.hypot(w.way[0][0] + .5 - p.x, w.way[0][2] + .5 - p.z) < 0.6 && Math.abs(w.way[0][1] - p.y) < 1.2) || (w.way.length > 1 && Math.hypot(w.way[1][0] + .5 - p.x, w.way[1][2] + .5 - p.z) < Math.hypot(w.way[0][0] + .5 - p.x, w.way[0][2] + .5 - p.z) && Math.abs(w.way[1][1] - p.y) < 1.2 && !solid(w.way[0][0], w.way[0][1], w.way[0][2]) && !solid(w.way[0][0], w.way[0][1] + 1, w.way[0][2])))) w.way.shift();
    const n = w.way[0]; if (!n) { a.wk = null; return d < 1.5 || (d < 2.2 && Math.abs(y - p.y) > 1.2); }
    // dig what blocks the next cell (body, head, and the head-room for a step up / down)
    const need = [[n[0], n[1], n[2]], [n[0], n[1] + 1, n[2]]]; if (w.need) { if (solid(w.need[0], w.need[1], w.need[2])) need.unshift(w.need); else w.need = null; } if (n[1] > cy) need.push([cx, cy + 2, cz]); if (n[1] < cy) need.push([n[0], cy, n[2]], [n[0], cy + 1, n[2]]);
    for (const c of w.way.slice(0, 2)) for (let k = 0; k < 2; k++) { const qb = wb(c[0], c[1] + k, c[2]); if (qb && (isDoor(qb) || qb === 226) && Math.hypot(c[0] + .5 - p.x, c[2] + .5 - p.z) < 2.2) openDoor(c[0], c[1] + k, c[2], p); }
    for (const q of need) { const qb = wb(q[0], q[1], q[2]); if (qb && (isDoor(qb) || qb === 226)) continue;   // doors / gates: opened above, walk through
      if (solid(q[0], q[1], q[2])) { a.moving = false; a.curSpd = 0; if (!breakAt(a, w, q[0], q[1], q[2], false)) { if (!canDig(a, q[0], q[1], q[2])) { w.way = null; w.fails++; w.cd = 0.5; if (w.fails >= 3) a.goFail = 99; } return false; } w.sT = 0; w.sp = [p.x, p.z]; return false; } }
    a.ang = Math.atan2(n[0] + .5 - p.x, n[2] + .5 - p.z); A.doors(a);
    const nd = Math.hypot(n[0] + .5 - p.x, n[2] + .5 - p.z), sp2 = (w.way.length > 8 && d > 8) ? SP.sprint : d < 1.5 ? Math.min(SP.walk, Math.max(1.5, nd * 4)) : Math.max(spd, SP.walk);
    const sr = stepD(a, sp2, dt, false);
    if (sr === false) { w.bT = (w.bT || 0) + dt; if (a.onGround !== false && w.bT < 0.5) { a.vy = 6.6; a.onGround = false; }
      if (w.bT >= 0.5) { w.bT = 0; B.pst.blk = (B.pst.blk || 0) + 1;
        const sx = Math.sign(Math.round(n[0] + .5 - p.x)), sz = Math.sign(Math.round(n[2] + .5 - p.z)), cand = [];
        for (const [ox, oz] of [[sx, sz], [sx, 0], [0, sz]]) if (ox || oz) for (let k = 0; k < 2; k++) cand.push([cx + ox, cy + k, cz + oz]);
        const hit = cand.find(q => { const qb = wb(q[0], q[1], q[2]); return qb && solid(q[0], q[1], q[2]) && !isDoor(qb) && qb !== 226 && !placed(q[0], q[1], q[2]) && canDig(a, q[0], q[1], q[2]); });
        if (hit) { w.need = hit; } else { const ccx = cx + .5 - p.x, ccz = cz + .5 - p.z, cl = Math.hypot(ccx, ccz); if (cl > 0.05) { a.ang = Math.atan2(ccx, ccz); stepD(a, SP.walk, Math.min(dt * 3, 0.15), false); } w.way = null; w.rp = 0; } } }
    else w.bT = 0;
    if (n[1] > cy && a.onGround !== false && Math.hypot(n[0] + .5 - p.x, n[2] + .5 - p.z) < 1.3) { a.vy = 6.6; a.onGround = false; }
    a.moving = true; a.curSpd = sp2;
    w.sT += dt; if (w.sT >= 2) { const mv = Math.hypot(p.x - w.sp[0], p.z - w.sp[1]); w.sT = 0; w.sp = [p.x, p.z];
      if (mv < 0.4) { w.stuck++; w.way = null; if (a.onGround !== false) { a.vy = 6.6; a.onGround = false; } if (w.stuck >= 4) { a.goFail = 99; } } else w.stuck = 0; }
    return false;
  }
  function moveTo(a, x, y, z, spd, dt, far) {
    const p = a.g.position, dx = x + .5 - p.x, dz = z + .5 - p.z, d = Math.hypot(dx, dz);
    if (far) {
      if (d < 0.7) { p.y = y; return true; }
      const s = Math.min(d, spd * dt); p.x += dx / d * s; p.z += dz / d * s; a.ang = Math.atan2(dx, dz); a.moving = true; a.curSpd = spd;
      p.y = d - s < 2.5 ? y : A.groundY(Math.floor(p.x), Math.floor(p.z)); return false;
    }
    if (!far && typeof stepMob === 'function' && !B.oldWalk && circ(a, dt)) return false;
    if (!far && typeof stepMob === 'function' && !B.oldWalk) { if (d > 44) { a.wpT = (a.wpT || 0) - dt; if (!a.wp || a.wpT <= 0) { const k = 30 / d, wx = Math.floor(p.x + dx * k), wz = Math.floor(p.z + dz * k); a.wp = [wx, A.groundY(wx, wz), wz]; a.wpT = 12; } if (walkWay(a, a.wp[0], a.wp[1], a.wp[2], spd, dt)) a.wp = null; if (a.goFail >= 99) { a.goFail = 0; a.wp = null; a.wpT = 0; } return false; }
      a.wp = null; return walkWay(a, x, y, z, spd, dt); }
    if (d > 22) {   // long trip: hop between waypoints so A* stays small
      a.wpT = (a.wpT || 0) - dt;
      if (!a.wp || a.wpT <= 0) { const k = 14 / d, wx = Math.floor(p.x + dx * k), wz = Math.floor(p.z + dz * k); a.wp = [wx, A.groundY(wx, wz), wz]; a.wpT = 7; }
      if (A.goTo(a, a.wp[0], a.wp[1], a.wp[2], spd, dt)) a.wp = null;
      return false;
    }
    a.wp = null;
    return A.goTo(a, x, y, z, spd, dt);
  }
  const SP = {walk: 4.3, work: 4.3, sprint: 5.8, travel: 5.8};   // v0.9.76: player walk / sprint speeds
  // ================= v0.9.76 digging: player break times, tunnelling paths =================
  const NODIG = new Set([T.CHEST, T.BED, T.FURNACE, T.TABLE, T.PORTAL, T.OBSIDIAN, T.WATER, T.LAVA, T.TORCH].filter(v => v !== undefined));
  const liquid = b => b === T.WATER || b === T.LAVA;
  let BSC = null;   // per-search cache of break times by block id
  function breakSecs(a, b) { if (BSC) { const c = BSC.get(b); if (c !== undefined) return c; const v = breakSecs0(a, b); BSC.set(b, v); return v; } return breakSecs0(a, b); }
  function breakSecs0(a, b) {   // same formula as the player's (MC ticks), with the bot's best tool for the block
    const h = (typeof MC_HARD !== 'undefined' && MC_HARD[b] != null) ? MC_HARD[b] : (HARD[b] || 1) * 0.8; if (h <= 0.06) return 0.05;
    const kind = typeof rightToolKind === 'function' ? rightToolKind(b) : null, tool = kind ? best(a, kind) : 0;
    const speed = tool && typeof toolTierSpeed === 'function' ? toolTierSpeed(tool) : 1;
    const harvest = !(REQ[b] > 0) || lvl(a, 'pick') >= REQ[b];
    return Math.ceil(1 / (speed / h / (harvest ? 30 : 100))) / 20;
  }
  function inCastle(ci, x, z) { return ci && Math.abs(x - ci.cx) <= 21 && Math.abs(z - ci.cz) <= 21; }
  function canDig(a, x, y, z) {
    if (y <= 1 || x < 3 || z < 3 || x >= W - 3 || z >= D - 3) return false;
    const b = wb(x, y, z); if (!b || !solid(x, y, z) || NODIG.has(b) || !HARD[b] || (typeof isDoor === 'function' && isDoor(b))) return false;
    if (placed(x, y, z) || inCastle(a.ci, x, z)) return false;
    if (REQ[b] > 0 && lvl(a, 'pick') < REQ[b] && REQ[b] > 1) return false;   // can't harvest it: don't try
    if (liquid(wb(x, y + 1, z)) || liquid(wb(x + 1, y, z)) || liquid(wb(x - 1, y, z)) || liquid(wb(x, y, z + 1)) || liquid(wb(x, y, z - 1))) return false;
    return true;
  }
  const clearOrDig = (a, x, y, z) => !solid(x, y, z) ? (liquid(wb(x, y, z)) ? -1 : 0) : canDig(a, x, y, z) ? breakSecs(a, wb(x, y, z)) : -1;
  // break one block like a player: returns true when it is gone (drops go into the bag)
  function breakAt(a, j, x, y, z, far) {
    const b = wb(x, y, z); if (!b || !solid(x, y, z)) { j.bk = null; return true; }
    if (!canDig(a, x, y, z)) return false;
    const k = x + ',' + y + ',' + z; if (!j.bk || j.bk.k !== k) j.bk = {k, t: 0, need: breakSecs(a, b)};
    j.bk.t += j.dt || 0; a.act = 'dig'; a.digK = (typeof rightToolKind === 'function' && rightToolKind(b)) === 'axe' ? 'axe' : 'pick'; a.digKT = 0.8; A.face(a, x, z);
    if (!far && Math.random() < (j.dt || 0) * 3) { spark(x + .5, y + .5, z + .5, 0x8a8a8a, 2, 0.4); snd('dig', a.g.position, 10); }
    if (j.bk.t < j.bk.need) return false;
    const harvest = !(REQ[b] > 0) || lvl(a, 'pick') >= REQ[b];
    if (harvest) for (const [id, n] of dropsFor(b)) add(a, id, n);
    A.placeBlock(x, y, z, T.AIR); j.bk = null; B.st.dug = (B.st.dug || 0) + 1;
    if (A.ORES.has(b)) { B.st.ores++; say(a.role + ' mined ' + (NAMES[b] || b)); } else if (b === T.STONE) B.st.stone++;
    return true;
  }
  // v0.9.76 chasing: a real A* over the walkable cells (48-block radius, doors count as open, steps up 1 / down 3) so they go
  // round walls and through gaps and doorways instead of walking into them. They re-plan when the target moves, commit to the
  // plan in between (no flip-flopping), hop + re-plan when stuck, and only drop a target that a full search can't reach
  // (blacklisted for 10 s).
  const BLK = new WeakMap(); B.blk = BLK; B.pst = {paths: 0, fails: 0, nodes: 0};
  const now = () => performance.now() / 1000;
  const blocked = m => m && typeof m === 'object' && (BLK.get(m) || 0) > now();
  const isDoor = b => b === T.DOOR || b === T.DOORTOP;
  const TALLB = (x, y, z) => { try { return !!(window.__c83 && __c83.tall(x, y, z)); } catch (_) { return false; } };
  const STAND = (x, y, z) => A.stand(x, y, z) && !TALLB(x, y - 1, z) && !TALLB(x, y, z);
  function findWay(sx, sy, sz, tx, ty, tz, R, cap, dg) {
    if (!STAND(sx, sy, sz)) { if (STAND(sx, sy + 1, sz)) sy++; else if (STAND(sx, sy - 1, sz)) sy--; }
    const K = (x, y, z) => (x * 4096 + z) * 256 + y, g = new Map(), from = new Map(), open = [];
    const hy = dg ? 1.6 : 0.5, hw = dg ? 1.8 : 1.05, h = (x, y, z) => Math.abs(x - tx) + Math.abs(z - tz) + Math.abs(y - ty) * hy;   // digging allowed: greedier search (tunnels are everywhere)
    const push = n => { open.push(n); let i = open.length - 1; while (i > 0) { const q = (i - 1) >> 1; if (open[q][0] <= n[0]) break; [open[i], open[q]] = [open[q], open[i]]; i = q; } };
    const pop = () => { const t = open[0], l = open.pop(); if (open.length) { open[0] = l; let i = 0; for (;;) { const a1 = 2 * i + 1, b1 = a1 + 1; let m = i; if (a1 < open.length && open[a1][0] < open[m][0]) m = a1; if (b1 < open.length && open[b1][0] < open[m][0]) m = b1; if (m === i) break; [open[i], open[m]] = [open[m], open[i]]; i = m; } } return t; };
    BSC = dg ? new Map() : null; const k0 = K(sx, sy, sz); g.set(k0, 0); push([h(sx, sy, sz), sx, sy, sz]); let n = 0, goal = null;
    while (open.length && n < cap) { const [, x, y, z] = pop(); const kc = K(x, y, z), gc = g.get(kc); n++;
      if (Math.abs(x - tx) <= 1 && Math.abs(z - tz) <= 1 && Math.abs(y - ty) <= 1) { goal = kc; break; }
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (Math.abs(nx - sx) > R || Math.abs(nz - sz) > R) continue;
        let ny = null; if (STAND(nx, y, nz)) ny = y; else if (STAND(nx, y + 1, nz) && !solid(x, y + 2, z)) ny = y + 1; else if (!solid(nx, y, nz) && !solid(nx, y + 1, nz)) for (let fy = y - 1; fy >= y - 3; fy--) if (STAND(nx, fy, nz)) { ny = fy; break; } else if (solid(nx, fy, nz)) break;
        let extra = 0;
        if (ny === null && dg) {   // tunnel: dig the two blocks (straight on, or one step up / down)
          for (const yy of [y, y + 1, y - 1]) { if (!solid(nx, yy - 1, nz) || liquid(wb(nx, yy - 1, nz))) continue;
            const c1 = clearOrDig(dg, nx, yy, nz), c2 = clearOrDig(dg, nx, yy + 1, nz), c3 = yy > y ? clearOrDig(dg, x, y + 2, z) : yy < y ? clearOrDig(dg, nx, yy + 2, nz) : 0;
            if (c1 < 0 || c2 < 0 || c3 < 0) continue; ny = yy; extra = 1 + (c1 + c2 + c3) * 3; break; }
        }
        if (ny === null) continue; if (isDoor(wb(nx, ny, nz)) || wb(nx, ny, nz) === 226) extra += 0.6; const kn = K(nx, ny, nz), gn = gc + 1 + (ny > y ? 0.6 : 0) + extra; const o = g.get(kn); if (o !== undefined && o <= gn) continue;
        g.set(kn, gn); from.set(kn, kc); push([gn + h(nx, ny, nz) * hw, nx, ny, nz]); } }
    BSC = null; B.pst.paths++; B.pst.nodes += n; B.fn = (B.fn || 0) + n; if (goal === null) { B.pst.fails++; return null; }
    const out = []; let k = goal; while (k !== k0 && from.has(k)) { const y = k % 256, r = (k - y) / 256, z = r % 4096, x = (r - z) / 4096; out.push([x, y, z]); k = from.get(k); }
    return out.reverse();
  }
  B.findWay = findWay;
  function chaseTo(a, j, tp, spd, dt, far, keep) {
    const p = a.g.position;
    if (far) { moveTo(a, Math.floor(tp.x), Math.floor(tp.y + 0.05), Math.floor(tp.z), spd, dt, true); return true; }
    const tx = Math.floor(tp.x), ty = Math.floor(tp.y + 0.05), tz = Math.floor(tp.z);
    j.rp = (j.rp || 0) - dt;
    const moved = !j.g || Math.abs(j.g[0] - tx) + Math.abs(j.g[2] - tz) > 2;
    if ((!j.way || (moved && j.rp <= 0) || j.rp < -3) && !(B.fn > 5000)) {   // plan at most once a second; otherwise stick to the plan
      j.rp = 1; j.g = [tx, ty, tz];
      const w = findWay(Math.floor(p.x), Math.floor(p.y + 0.05), Math.floor(p.z), tx, ty, tz, 48, 9000);
      if (!w) { j.noWay = (j.noWay || 0) + 1; if (j.noWay >= 2 && !keep) { if (j.m && typeof j.m === 'object') BLK.set(j.m, now() + 10); return false; } j.way = []; }
      else { j.noWay = 0; j.way = w; }
    }
    // stuck: barely moved in 2 s -> hop and re-plan; stuck 3 times running -> this one can't be reached right now
    j.sT = (j.sT || 0) + dt; if (!j.sp) j.sp = [p.x, p.z];
    if (j.sT >= 2) { const mv = Math.hypot(p.x - j.sp[0], p.z - j.sp[1]); j.sT = 0; j.sp = [p.x, p.z];
      if (mv < 0.4) { j.stuck = (j.stuck || 0) + 1; if (a.onGround !== false) { a.vy = 6.6; a.onGround = false; } j.way = null; a.path = null;
        if (j.stuck >= 3 && !keep) { if (j.m && typeof j.m === 'object') BLK.set(j.m, now() + 10); return false; } } else j.stuck = 0; }
    if (circ(a, dt)) { if (!keep) { if (j.m && typeof j.m === 'object') BLK.set(j.m, now() + 10); return false; } j.way = null; }
    const way = j.way || [];
    while (way.length && ((Math.hypot(way[0][0] + .5 - p.x, way[0][2] + .5 - p.z) < 0.6 && Math.abs(way[0][1] - p.y) < 1.5) || (way.length > 1 && Math.hypot(way[1][0] + .5 - p.x, way[1][2] + .5 - p.z) < Math.hypot(way[0][0] + .5 - p.x, way[0][2] + .5 - p.z) && Math.abs(way[1][1] - p.y) < 1.5))) way.shift();
    const w = way[0] || [tx, ty, tz];
    a.path = null; a.goFail = 0;
    a.ang = Math.atan2(w[0] + .5 - p.x, w[2] + .5 - p.z); A.doors(a);
    if (typeof stepMob === 'function') { if (stepD(a, spd, dt, false) === false && a.onGround !== false && w[1] > p.y - 0.5) { a.vy = 6.6; a.onGround = false; } a.moving = true; a.curSpd = spd; }
    else A.goTo(a, w[0], w[1], w[2], spd, dt);
    return true;
  }

  // ================= hits they take (simulated: mobs only aim at you in the base game) =================
  function hurtBot(a, n, why) {
    a.hp -= n * (1 - Math.min(0.6, armRed(a))); a.hurtT = 0.25;
    if (a.hp <= 0) { a.hp = 0; say(a.role + ' died (' + why + ')', Math.hypot(P.x - a.g.position.x, P.z - a.g.position.z) < 48); try { killMob(a); } catch (_) {} }
  }
  function threats(a, dt) {
    const p = a.g.position; a.hitCd = (a.hitCd || 0) - dt; if (a.hitCd > 0 || a.sleeping) return;
    for (const m of mobs) { if (!m.hostile || m.kind === 'clansman' || !(m.hp > 0)) continue;
      const d = Math.hypot(m.g.position.x - p.x, m.g.position.z - p.z); if (Math.abs(m.g.position.y - p.y) > 3) continue;
      if (d < 1.8 && m.kind !== 'skeleton') { a.hitCd = 1.2; hurtBot(a, m.kind === 'blackskel' ? 4 : 2.5, m.kind); return; }
      if ((m.kind === 'skeleton' || m.kind === 'blackskel') && d < 13 && Math.random() < 0.35) { a.hitCd = 1.8; hurtBot(a, 2, 'arrow'); return; } }
  }
  function swingAt(a, m) {
    const dmg = (() => { const s = best(a, 'sword'); return s ? TOOL[s][3] + 1 : 2; })();
    a.cd = 0.75; a.swingT = 0.4; snd('swoosh', a.g.position, 12);
    damageMob(m, dmg, false);
    if (!(m.hp > 0) || !mobs.includes(m)) { B.st.kills++; return true; } return false;
  }
  function eat(a) {
    const id = FOODS.filter(f => has(a, f)).sort((p, q) => (FOOD[q] ? FOOD[q][0] : 0) - (FOOD[p] ? FOOD[p][0] : 0))[0]; if (!id) return false;
    add(a, id, -1); a.food = Math.min(20, (a.food || 0) + (FOOD[id] ? FOOD[id][0] : 6)); a.hp = Math.min(a.maxHp || 24, (a.hp || 0) + 8); B.st.ate++; return true;
  }

  // ================= the planner =================
  const ANIMALS = new Set(['sheep', 'pig', 'haggis', 'cow', 'deer', 'goat', 'chicken', 'rabbit']);
  const meatOf = m => m.kind === 'pig' ? IT.PORK : m.kind === 'haggis' ? IT.HAGGIS : IT.MUTTON;
  // v0.9.78: each bot keeps scanning around itself (one slice per tick, ~32 blocks) for ore it can see - cave walls, ravines, its own tunnels
  const USEFUL = new Set([T.IRONORE, T.COALORE, T.DIAMONDORE, T.GOLDORE].filter(v => v !== undefined));
  function oreScan(a) {
    const p = a.g.position, bx = Math.floor(p.x), by = Math.floor(p.y), bz = Math.floor(p.z), pk = lvl(a, 'pick'); if (!pk) return;
    a.scx = ((a.scx || 0) + 1) % 65; const x = bx - 32 + a.scx; if (x < 3 || x >= W - 3) return;
    const seen = a.seen || (a.seen = []); if (seen.length > 40) seen.splice(0, seen.length - 40);
    for (let z = Math.max(3, bz - 32); z <= Math.min(D - 4, bz + 32); z++) for (let y = Math.max(2, by - 22); y <= by + 6; y++) {
      const b = wb(x, y, z); if (!USEFUL.has(b) || ORE_LVL(b) > pk || placed(x, y, z)) continue;
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]]) { const ax = x + dx, ay = y + dy, az = z + dz; if (wb(ax, ay, az) !== T.AIR) continue;
        let sp = null; for (let sy = ay; sy >= ay - 3 && !sp; sy--) if (A.stand(ax, sy, az)) sp = [ax, sy, az]; else if (solid(ax, sy, az)) break;
        if (sp && !inCastle(a.ci, ax, az)) { const k = x + ',' + y + ',' + z; if (!seen.some(o => o[0] === x && o[1] === y && o[2] === z)) seen.push([x, y, z, sp[0], sp[1], sp[2]]); break; } }
    }
  }
  function pickSeen(a) {
    const pk = lvl(a, 'pick'), bad = (() => { try { return scanOf(a.ci).bad; } catch (_) { return new Set(); } })(), p = a.g.position;
    const L = (a.seen || []).filter(o => { const b = wb(o[0], o[1], o[2]); return A.ORES.has(b) && ORE_LVL(b) <= pk && !banned(a, 'mine', o) && !bad.has(o.join()) && Math.hypot(o[0] - p.x, o[2] - p.z) < 34; }); a.seen = L;
    let bst = null, bd = 1e9; for (const o of L) { const d = Math.hypot(o[0] - p.x, o[1] - p.y, o[2] - p.z) - (wb(o[0], o[1], o[2]) === T.IRONORE ? 8 : 0); if (d < bd) { bd = d; bst = o; } }
    return bst ? {type: 'mine', o: bst, ph: 'go', t: 0, pri: 1, cave: 1} : null;
  }
  // v0.9.78 anti-loop: the same goal + target picked 3 times in 20 s -> that target is banned for 60 s, they do something else
  const tkey = (type, o) => type + ':' + (o ? (Array.isArray(o) ? o.slice(0, 3).join(',') : o.uid || o.id || '') : '');
  function banned(a, type, o) { const b = a.ban && a.ban.get(tkey(type, o)); return !!(b && b > B.gt); }
  function noteJob(a, j) {
    const k = tkey(j.type + (j.want || ''), j.o || j.m || j.at), h = a.jh || (a.jh = []); h.push([B.gt, k]); while (h.length && B.gt - h[0][0] > 20) h.shift();
    if (k.split(':')[1] && h.filter(e => e[1] === k).length >= 3) { (a.ban || (a.ban = new Map())).set(k, B.gt + 60); if (j.type === 'mine' || j.type === 'chop') try { scanOf(a.ci).bad.add(j.o.join()); } catch (_) {} if (j.m && typeof j.m === 'object') BLK.set(j.m, now() + 30); B.pst.loops = (B.pst.loops || 0) + 1; j.done = true; }
  }
  function think(a, ci, far) {
    const tm = TM(), j = a.job;
    if (tm.phase === 'hostile') { if (!j || j.type !== 'chase') a.job = {type: 'chase', pri: 9, t: 0}; return; }
    if (a.mad > 0 && !dead && (!j || j.m !== 'player')) { a.job = {type: 'fight', m: 'player', pri: 9, t: 0}; return; }
    const h = A.hostileNear(a, tm.phase === 'war' ? 18 : 12);
    if (h && !blocked(h) && (!j || j.type !== 'fight')) { a.job = {type: 'fight', m: h, pri: 8, t: 0}; return; }
    if (j && j.pri >= 8 && !j.done) return;
    if ((!j || (j.type !== 'hunt' && j.type !== 'bed' && j.type !== 'fight' && j.type !== 'eat' && j.type !== 'raid')) && !isNight && (cooked(a) < 4 || a.food < 14 || rawN(a) < 2)) {
      const p = a.g.position; let m = null, md = 4;
      for (const q of mobs) { if (!ANIMALS.has(q.kind) || !(q.hp > 0) || q.tamed || q.pet || blocked(q)) continue; const d = Math.hypot(q.g.position.x - p.x, q.g.position.z - p.z); if (d < md && Math.abs(q.g.position.y - p.y) < 2.5) { md = d; m = q; } }
      if (m) { a.job = {type: 'hunt', m, t: 0, pri: 3}; return; } }
    if (isNight) { if (!j || j.type !== 'bed') a.job = {type: 'bed', pri: 7, t: 0}; return; }
    if ((a.food < 8 || a.hp < (a.maxHp || 24) * 0.6) && cooked(a) && (!j || j.type !== 'eat')) { a.job = {type: 'eat', pri: 6, t: 0}; return; }
    if (j && !j.done && j.type !== 'bed') return;
    a.job = plan(a, ci, far) || {type: 'wait', t: 0, tt: 0.5 + Math.random() * 0.7, pri: 0};
  }
  function huntJob(a) {
    const p = a.g.position; let m = null, md = 44;
    for (const q of mobs) { if (!ANIMALS.has(q.kind) || !(q.hp > 0) || q.tamed || q.pet || blocked(q)) continue; const d = Math.hypot(q.g.position.x - p.x, q.g.position.z - p.z); if (d < md) { md = d; m = q; } }
    return m ? {type: 'hunt', m, t: 0, pri: 2} : {type: 'search', t: 0, pri: 2};
  }
  // a fresh mine: start just outside the castle wall (or where they stand), staircase down toward the iron layer
  function digJob(a, ci, want) {
    const p = a.g.position, dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], dir = dirs[(Math.random() * 4) | 0];
    let at = [Math.floor(p.x), Math.floor(p.y + 0.05), Math.floor(p.z)];
    if (inCastle(ci, at[0], at[2]) || Math.hypot(at[0] - ci.cx, at[2] - ci.cz) > 40) { const x = Math.floor(ci.cx + dir[0] * 26 + (Math.random() - .5) * 8), z = Math.floor(ci.cz + dir[1] * 26 + (Math.random() - .5) * 8); at = [x, A.groundY(x, z), z]; }
    const ironY = Math.max(4, BASE - 8), need = IRON_ARM.reduce((n, id, i) => n + (((a.armour || [])[i] >= 108 && (a.armour || [])[i] <= 111) ? 0 : ARM_COST[i]), 0) + (lvl(a, 'pick') < 3 ? 3 : 0) + (lvl(a, 'sword') < 3 ? 2 : 0);
    const goalY = want === 'stone' ? Math.max(ironY, at[1] - 6) : ironY;
    return {type: 'dig', want, at, dir, goalY, steps: 0, ph: 'go', t: 0, pri: 1, ironGoal: Math.max(3, Math.min(need, 10))};
  }
  function plan(a, ci, far) {
    const tm = TM(), role = a.role, ch = chestOf(ci), cf = cooked(a), raw = rawN(a);
    a.chestCd = (a.chestCd || 0);
    // food first
    if (cf < 2 && (a.food < 11 || a.hp < (a.maxHp || 24) * 0.7 || tm.phase !== 'survive')) {
      const fuelHere = fuelPts(a) >= 1 || (ch && chestCount(ch, [IT.COAL, IT.CHARCOAL, T.PLANKS, T.LOG]));
      if (raw > 0 && ci.furn && fuelHere) return {type: 'cook', ph: 'go', t: 0, pri: 3};
      if (raw > 0 && ci.furn && !fuelHere && wood(a) < 2) { const s0 = scanOf(ci), t0 = nearestOf(a, s0.trees, o => !s0.bad.has(o.join()) && !claimed(a, o) && LOGGY[wb(o[0], o[1], o[2])]); if (t0) return {type: 'chop', o: t0, ph: 'go', t: 0, pri: 3}; }
      if (ch && a.chestCd <= 0 && chestCount(ch, FOODS.concat(RAW))) return {type: 'chest', t: 0, pri: 3};
      if (role === 'hunter' || a.food < 10 || tm.phase !== 'survive') return huntJob(a);
    }
    if (tm.phase === 'war') return warJob(a, ci, far);
    // gear
    const tb = ci.table && wb(ci.table.x, ci.table.y, ci.table.z) === T.TABLE ? ci.table : null;
    const pk0 = lvl(a, 'pick'), iN = ironNeed(a), iH = ironHave(a);
    if (!(pk0 >= 2 && iN > 0 && iH < iN)) a.g0 = 0; else if (!a.g0) a.g0 = B.gt;
    const gathering = pk0 >= 2 && iN > 0 && iH < iN && a.hp >= (a.maxHp || 24) * 0.5 && !(B.gt - a.g0 > 900);   // keep mining until the whole kit's iron is in the bag (15 min cap)
    const mk = upgrades(a, false), nonIron = mk.some(id => !isIronA(id) && id !== PICKS[2] && id !== SWORDS[2] && id !== AXES[2]);
    if (iH > 0 && !gathering && ((has(a, IT.RAWIRON) && fuelPts(a) >= 1) || mk.length) && (has(a, T.TABLE) || wood(a) >= 4)) return {type: 'field', ph: 'set', t: 0, pri: 2};
    if (mk.length && nonIron && (tb || wood(a) >= 4)) return {type: 'field', ph: 'set', t: 0, pri: 2};
    if (ch && a.chestCd <= 0 && !gathering && (surplus(a) >= 14 || wants(a, ch).length)) return {type: 'chest', t: 0, pri: 2};
    if (ch && a.chestCd <= 0 && gathering && (surplus(a) >= 60 || (wants(a, ch).length && Math.hypot(ch.x - a.g.position.x, ch.z - a.g.position.z) < 20))) return {type: 'chest', t: 0, pri: 2};
    if (!ch && wood(a) >= 12 && a.chestCd <= 0) { needChest(a, ci); a.chestCd = 30; }
    if (ci.furn && fuelPts(a) >= 2 && raw > 0 && Math.hypot(ci.furn.x - a.g.position.x, ci.furn.z - a.g.position.z) < 24) return {type: 'cook', ph: 'go', t: 0, pri: 2};
    const s = scanOf(ci), pk = lvl(a, 'pick');
    const geared = pk >= 3 && lvl(a, 'sword') >= 3 && ironArm(a) >= 2;
    const chop = () => { const t = nearestOf(a, s.trees, o => !s.bad.has(o.join()) && !claimed(a, o) && LOGGY[wb(o[0], o[1], o[2])]); return t ? {type: 'chop', o: t, ph: 'go', t: 0, pri: 1} : {type: 'search', wood: 1, t: 0, pri: 1}; };
    const near24 = o => Math.hypot(o[0] - a.g.position.x, o[2] - a.g.position.z) < 24 && Math.abs(o[1] - a.g.position.y) < 8;
    const stone = () => { if (!pk) return null; const t = nearestOf(a, s.stone, o => near24(o) && !s.bad.has(o.join()) && !claimed(a, o) && wb(o[0], o[1], o[2]) === T.STONE); return t ? {type: 'mine', o: t, ph: 'go', t: 0, pri: 1} : digJob(a, ci, 'stone'); };
    const seenOre = () => pickSeen(a);
    const ore = () => { if (!pk) return null; const cv = !far && seenOre(); if (cv) return cv; const coalLow = fuelPts(a) < 10 + Math.max(0, ironNeed(a) - has(a, IT.IRONINGOT)); const t = nearestOf(a, s.ores, o => { const b = wb(o[0], o[1], o[2]); return A.ORES.has(b) && ORE_LVL(b) <= pk && !s.bad.has(o.join()) && !claimed(a, o) && (b === T.IRONORE || (coalLow && b === T.COALORE) || Math.random() < 0.25); });
      return t && near24(t) ? {type: 'mine', o: t, ph: 'go', t: 0, pri: 1} : digJob(a, ci, pk >= 2 ? 'iron' : 'stone'); };
    if (wood(a) < (pk ? 8 : 14) && !(role === 'miner' && pk >= 2 && ch && chestCount(ch, [T.PLANKS, T.LOG]))) return chop();
    if (!pk) return chop();
    if ((lvl(a, 'sword') < 2 || pk < 2 || lvl(a, 'axe') < 2) && has(a, T.COBBLE) < 8) return stone() || chop();
    if (geared && cf < 6) { if (raw && ci.furn) return {type: 'cook', ph: 'go', t: 0, pri: 2}; return huntJob(a); }
    if (role === 'hunter') {
      if (cf + raw < 8) return huntJob(a);
      if (tm.phase === 'survive') return wood(a) < 30 ? chop() : huntJob(a);
      return (geared ? (Math.random() < 0.5 ? huntJob(a) : ore()) : ore()) || chop();
    }
    if (tm.phase === 'survive' && cf + raw < 3) return huntJob(a);
    if (pk < 2) return stone() || chop();
    return ore() || stone() || chop();
  }
  // ---- war campaign (v0.9.75) ----
  const castles = kind => (typeof g9castles !== 'undefined' && g9castles || []).filter(c => c[0] === kind);
  const ckey = c => c[0] + ':' + c[1] + ',' + c[2];
  function warTarget(a) {
    const tm = TM(), h = a.home || [a.g.position.x, a.g.position.z], d = c => Math.hypot(c[1] - h[0], c[2] - h[1]);
    if (tm.step === 'mossy') { const m = castles('mossy').filter(c => !tm.cleared.includes(ckey(c))).sort((p, q) => d(p) - d(q))[0]; if (m) return m; tm.step = 'black'; }
    if (tm.step === 'black') { const b = castles('black').sort((p, q) => d(p) - d(q))[0]; if (b && !tm.cleared.includes(ckey(b))) return b; tm.step = 'loot'; }
    return castles('black').sort((p, q) => d(p) - d(q))[0] || null;
  }
  function spotNear(cx, cz, r) { for (let t = 0; t < 30; t++) { const x = Math.floor(cx + (Math.random() - .5) * r * 2), z = Math.floor(cz + (Math.random() - .5) * r * 2); if (x < 3 || z < 3 || x >= W - 3 || z >= D - 3) continue; const y = A.groundY(x, z); if (A.stand(x, y, z)) return [x, y, z]; } const y = A.groundY(Math.floor(cx), Math.floor(cz)); return [Math.floor(cx), y, Math.floor(cz)]; }
  function warJob(a, ci, far) {
    if (TM().step === 'regroup') { const hx = Math.floor(ci.cx), hz = Math.floor(ci.cz); return {type: 'goto', x: hx, y: A.groundY(hx, hz), z: hz, t: 0, pri: 2, rg: 1}; }
    const tm = TM(), c = warTarget(a); if (!c) { tm.step = 'portal'; }
    const partner = bots().find(m => m !== a);
    if (partner && a.role === 'hunter') { const pd = Math.hypot(partner.g.position.x - a.g.position.x, partner.g.position.z - a.g.position.z); if (pd > 16 && !partner.sleeping) return {type: 'follow', m: partner, t: 0, pri: 1}; }
    if (tm.step === 'mossy' || tm.step === 'black') return {type: 'raid', c, ph: 'go', t: 0, kills: 0, quiet: 0, pri: 2};
    if (tm.step === 'loot') return {type: 'loot', c, ph: 'go', t: 0, pri: 2};
    return {type: 'portal', c, ph: 'go', t: 0, pri: 2};
  }
  function blackChest(c) { let best = null, bd = 60; for (const [k, ch] of chests) { if (!ch || ch.castle !== 'black') continue; const [x, y, z] = k.split(',').map(Number); const d = Math.hypot(x - c[1], z - c[2]); if (d < bd) { bd = d; best = {k, x, y, z, a: A.access(x, y, z)}; } } return best; }
  function portalFrame(c) {   // the unfinished frame by the black castle: a bottom row of 4 obsidian
    const tm = TM(); if (tm.portal) return tm.portal;
    for (let z = c[2] + 6; z <= c[2] + 46; z++) for (let x = c[1] - 10; x <= c[1] + 8; x++) { if (x < 2 || z < 2 || x >= W - 6 || z >= D - 2) continue;
      for (let y = 4; y < H - 7; y++) if (wb(x, y, z) === T.OBSIDIAN && wb(x + 1, y, z) === T.OBSIDIAN && wb(x + 2, y, z) === T.OBSIDIAN && wb(x + 3, y, z) === T.OBSIDIAN && wb(x + 1, y + 1, z) !== T.OBSIDIAN) {
        tm.portal = {x, y, z}; return tm.portal; } }
    // gone (you broke it): they build a fresh frame south of the castle
    const x = c[1] - 3, z = Math.min(D - 4, c[2] + 26), g = A.groundY(x + 1, z); tm.portal = {x, y: g, z, fresh: 1}; return tm.portal;
  }
  function buildPortal(a, f) {
    let n = 0;
    for (let x = f.x; x <= f.x + 3; x++) for (let y = f.y; y <= f.y + 4; y++) { const edge = x === f.x || x === f.x + 3 || y === f.y || y === f.y + 4;
      const b = wb(x, y, f.z);
      if (edge && b !== T.OBSIDIAN) { A.placeBlock(x, y, f.z, T.OBSIDIAN); if (has(a, T.OBSIDIAN)) add(a, T.OBSIDIAN, -1); n++; }
      else if (!edge && b !== T.AIR && b !== T.PORTAL) A.placeBlock(x, y, f.z, T.AIR); }
    B.st.placed += n; try { rebuild(); } catch (_) {}
    return n;
  }

  // ================= doing the job =================
  function act(a, ci, dt, far) {
    const j = a.job, p = a.g.position, tm = TM(); if (!j) return;
    a.act = null; j.t = (j.t || 0) + dt;
    const done = () => { j.done = true; };
    switch (j.type) {
      case 'wait': if (j.t > (j.tt || 2.5)) done(); break;
      case 'field': {   // v0.9.79: put down a crafting table + furnace right here, smelt and craft the lot, pick them back up
        const fx = Math.floor(p.x), fy = Math.floor(p.y + 0.05), fz = Math.floor(p.z);
        if (j.ph === 'set') {
          if (!has(a, T.TABLE)) { if (!planks(a, 4) || !craft(a, T.TABLE)) { done(); break; } }
          const wantF = has(a, IT.RAWIRON) > 0 || ORE_RAW.some(id => has(a, id));
          if (wantF && !has(a, T.FURNACE)) { if (has(a, T.COBBLE) >= 8) { if (!craft(a, T.FURNACE)) { add(a, T.COBBLE, -8); add(a, T.FURNACE, 1); } } }
          const spots = []; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const x = fx + dx, z = fz + dz; if (!wb(x, fy, z) && solid(x, fy - 1, z) && !isDoor(wb(x, fy - 1, z)) && !placed(x, fy, z)) spots.push([x, fy, z]); }
          j.put = [];
          if (spots[0]) { A.placeBlock(spots[0][0], fy, spots[0][2], T.TABLE); add(a, T.TABLE, -1); j.put.push([spots[0], T.TABLE]); A.face(a, spots[0][0], spots[0][2]); }
          if (wantF && has(a, T.FURNACE) && spots[1]) { A.placeBlock(spots[1][0], fy, spots[1][2], T.FURNACE, {face: 0}); add(a, T.FURNACE, -1); j.put.push([spots[1], T.FURNACE]); }
          if (!j.put.length && !spots.length) {}   // no room: craft in the hand anyway (still on the spot)
          j.ph = 'smelt'; j.t = 0; j.acc = 0; say(a.role + ' set up a crafting table' + (j.put.length > 1 ? ' and furnace' : '') + ' on the spot'); break; }
        a.act = 'cook';
        if (j.ph === 'smelt') { j.acc += dt; if (j.acc < 0.3) break; j.acc = 0;
          const id = ORE_RAW.find(r => has(a, r)); const hasF = j.put.some(q => q[1] === T.FURNACE);
          if (!id || !hasF) { j.ph = 'craft'; j.t = 0; break; }
          j.fuel = (j.fuel || 0) - 1;
          if (j.fuel < 0) { if (has(a, IT.COAL)) { add(a, IT.COAL, -1); j.fuel += 8; } else if (has(a, IT.CHARCOAL)) { add(a, IT.CHARCOAL, -1); j.fuel += 8; } else if (has(a, T.PLANKS) > 0) { add(a, T.PLANKS, -1); j.fuel += 1.5; } else if (useLogs(a, 1)) j.fuel += 1.5; else { j.ph = 'craft'; j.t = 0; break; } }
          add(a, id, -1); add(a, SMELT[id], 1); B.st.smelted++; if (!far && Math.random() < 0.5) try { spark(j.put[1][0][0] + .5, fy + 1.1, j.put[1][0][2] + .5, 0x8a8a8a, 1, 0.3); } catch (_) {} break; }
        if (j.ph === 'craft') { if (!j.made) { j.made = upgrades(a, true); if (j.made.length) { say(a.role + ' crafted ' + j.made.map(id => NAMES[id] || id).join(', ')); snd('craft', p, 8); } }
          if (j.t > 0.3 * Math.max(1, j.made.length)) j.ph = 'pack'; break; }
        if (j.ph === 'pack') { for (const [q, id] of j.put || []) if (wb(q[0], q[1], q[2]) === id) { A.placeBlock(q[0], q[1], q[2], T.AIR); add(a, id, 1); } j.put = []; done(); }
        break; }
      case 'goto': if (moveTo(a, j.x, j.y, j.z, SP.walk, dt, far) || j.t > 60 || (a.goFail || 0) >= 99) { j.ok = Math.hypot(j.x + .5 - p.x, j.z + .5 - p.z) < 1.5; a.goFail = 0; B.lastGoto = {ok: j.ok, t: j.t}; done(); } break;   // debug / test
      case 'fight': {
        const m = j.m, tp = m === 'player' ? P : m.g && m.g.position;
        if (m === 'player' ? (dead || !(a.mad > 0)) : (!mobs.includes(m) || !(m.hp > 0))) { done(); a.job = null; break; }
        const td = Math.hypot(tp.x - p.x, tp.z - p.z);
        if (j.t > 25 || td > 30) { done(); break; }
        if (td > 1.7) { if (!chaseTo(a, j, tp, SP.sprint, dt, far, j.m === 'player')) { done(); break; } } else A.face(a, tp.x - .5, tp.z - .5);
        a.act = 'fight';
        if (td < 2.1 && Math.abs(tp.y - p.y) < 2 && (a.cd || 0) <= 0) { if (m === 'player') { a.cd = 0.9; a.swingT = 0.4; hurt(4, 'A clansman taught you some manners.'); } else if (swingAt(a, m)) done(); }
        break; }
      case 'chase': {
        if (dead || DIM.cur) { a.act = null; break; }
        const td = Math.hypot(P.x - p.x, P.z - p.z);
        if (td > 48) moveTo(a, Math.floor(P.x), Math.floor(P.y + 0.05), Math.floor(P.z), td > 60 ? 6 : SP.sprint, dt, true); else if (td > 1.7) chaseTo(a, j, P, SP.sprint, dt, false, true); else A.face(a, P.x - .5, P.z - .5);
        a.act = 'fight';
        if (td < 2.1 && Math.abs(P.y - p.y) < 2 && (a.cd || 0) <= 0) { a.cd = 0.9; a.swingT = 0.4; snd('swoosh', p, 12); hurt(4, 'The clansmen came back from Hell for you.'); }
        break; }
      case 'bed': {
        const b = A.sleepSpot(a, ci); if (!b) break;
        const q = b.a || [b.x, b.y, b.z];
        const ok = moveTo(a, q[0], q[1], q[2], Math.hypot(q[0] - p.x, q[2] - p.z) > 30 ? SP.travel : SP.walk, dt, far);
        if (ok || Math.hypot(b.x + .5 - p.x, b.z + .5 - p.z) < 1.2 || (j.t > 40 && far) || j.t > 120) { if (a.skipPhys && !a.sleeping) a.skipPhys = false; A.lieDown(a, b); B.st.slept++; }
        break; }
      case 'eat': a.act = 'eat'; if (!far && Math.random() < dt * 5) spark(p.x + Math.sin(a.yawVis || 0) * 0.3, p.y + 1.6, p.z + Math.cos(a.yawVis || 0) * 0.3, 0xc89a50, 1, 0.3);
        if (j.t > 1.8) { eat(a); snd('eat', p, 8); done(); } break;
      case 'chest': {
        const ch = chestOf(ci); if (!ch || !ch.a) { a.chestCd = 30; done(); break; }
        if (j.ph !== 'use') { if (moveTo(a, ch.a[0], ch.a[1], ch.a[2], SP.work, dt, far) || (a.goFail || 0) > 8 || j.t > 60) { a.goFail = 0; j.ph = 'use'; j.t = 0; A.face(a, ch.x, ch.z); snd('chestOpen', p, 8); } break; }
        a.act = 'cook';
        if (j.t > 1.2) {
          for (const k of Object.keys(inv(a))) { const extra = a.inv[k] - keepOf(a, k); if (extra > 0) { const left = A.chestAdd(ch.k, +k, extra); add(a, +k, -(extra - left)); if (extra - left) B.st.deposits++; } }
          for (const [id, n] of wants(a, ch)) { const r = A.chestTake(ch.k, [id], n); if (r) { add(a, r[0], r[1]); B.st.withdrawals++; } }
          a.chestCd = 25; a.swingT = 0.35; done(); }
        break; }
      case 'craft': {
        let tb = ci.table && wb(ci.table.x, ci.table.y, ci.table.z) === T.TABLE ? ci.table : null;
        if (!tb) tb = needTable(a, ci);
        if (!tb || !tb.a) { done(); break; }
        if (j.ph !== 'use') { if (moveTo(a, tb.a[0], tb.a[1], tb.a[2], SP.work, dt, far) || (a.goFail || 0) > 8 || j.t > 60) { a.goFail = 0; j.ph = 'use'; j.t = 0; A.face(a, tb.x, tb.z); } break; }
        a.act = 'cook';
        if (j.t > 0.4) { const made = upgrades(a, true); if (made.length) { say(a.role + ' crafted ' + made.map(id => NAMES[id] || id).join(', ')); snd('craft', p, 8); } done(); }
        break; }
      case 'cook': {
        const f = ci.furn; if (!f || !f.a) { done(); break; }
        if (j.ph === 'go') { if (moveTo(a, f.a[0], f.a[1], f.a[2], SP.work, dt, far) || (a.goFail || 0) > 8 || j.t > 60) { a.goFail = 0; j.ph = 'work'; j.t = 0; A.face(a, f.x, f.z);
            try { const fd = furnData(keyOf(f.x, f.y, f.z)); if (fd && fd.out) { add(a, fd.out[0], fd.out[1]); fd.out = null; } } catch (_) {}
            const ch = chestOf(ci); if (ch && fuelPts(a) < 4) { const r = A.chestTake(ch.k, [IT.COAL, IT.CHARCOAL, T.PLANKS, T.LOG], 6); if (r) add(a, r[0], r[1]); }
            if (fuelPts(a) < 1 && wood(a) >= 1) planks(a, 1); } break; }
        a.act = 'cook'; if (!far && Math.random() < dt * 3) spark(f.x + .5, f.y + 1.1, f.z + .5, 0x8a8a8a, 1, 0.3);
        j.acc = (j.acc || 0) + dt;
        if (j.acc >= 1.1) { j.acc = 0;
          const id = RAW.find(r => has(a, r)) || ORE_RAW.find(r => has(a, r));
          if (!id || fuelPts(a) < 1) { done(); break; }
          // fuel: 1 coal smelts 8, a plank or a log 1.5
          j.fuel = (j.fuel || 0) - 1;
          if (j.fuel < 0) { if (has(a, IT.COAL)) { add(a, IT.COAL, -1); j.fuel += 8; } else if (has(a, IT.CHARCOAL)) { add(a, IT.CHARCOAL, -1); j.fuel += 8; } else if (has(a, T.PLANKS) > 0) { add(a, T.PLANKS, -1); j.fuel += 1.5; } else if (useLogs(a, 1)) j.fuel += 1.5; else { done(); break; } }
          add(a, id, -1); add(a, SMELT[id], 1); if (RAW.includes(id)) B.st.cooked++; else B.st.smelted++;
          if (j.t > 40) done(); }
        break; }
      case 'chop': {
        const o = j.o, S = scanOf(ci);
        if (!LOGGY[wb(o[0], o[1], o[2])] || placed(o[0], o[1], o[2])) { if (j.ph !== 'collect') { done(); break; } }
        if (j.ph === 'go') { if (moveTo(a, o[3], o[4], o[5], SP.work, dt, far)) { j.ph = 'cut'; j.t = 0; } else if ((a.goFail || 0) > 6 || j.t > 45) { S.bad.add(o.join()); a.goFail = 0; done(); } break; }
        if (j.ph === 'cut') { A.face(a, o[0], o[2]); a.act = 'chop';
          const ax = best(a, 'axe'), need = ax ? 4.2 / TOOL[ax][2] : 4.5;
          if (!far && Math.random() < dt * 3) { spark(o[0] + .5, o[1] + .6, o[2] + .5, 0x6b4a2a, 2, 0.4); snd('dig', p, 10); }
          if (j.t > need) {
            const b = wb(o[0], o[1], o[2]); add(a, b, 1); B.st.logs++; B.st.trees++;
            if (far) {   // nobody watching: the whole tree comes down straight into the bag
              const seen = new Set(), q = [[o[0], o[1] + 1, o[2]]]; let n = 0, leaves = 0;
              while (q.length && n + leaves < 300) { const [x, y, z] = q.pop(), k = x + ',' + y + ',' + z; if (seen.has(k) || y <= o[1] || Math.abs(x - o[0]) > 6 || Math.abs(z - o[2]) > 6) continue; seen.add(k);
                const bb = wb(x, y, z); if (!LOGGY[bb] && !LEAFY[bb]) continue; if (placed(x, y, z)) continue;
                if (LOGGY[bb]) { add(a, bb, 1); n++; } else leaves++;
                A.placeBlock(x, y, z, T.AIR); for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) q.push([x + dx, y + dy, z + dz]); }
              A.placeBlock(o[0], o[1], o[2], T.AIR); add(a, IT.STICK, 2 + (Math.random() * 3 | 0)); B.st.logs += n; done();
            } else { setB(o[0], o[1], o[2], T.AIR); try { fellTree(o[0], o[1], o[2]); } catch (_) {} try { rebuild(); } catch (_) {} j.ph = 'collect'; j.t = 0; }
          }
          break; }
        // collect what fell: walk to each drop and pick it up
        if (j.t < 2.6) break;
        let tgt = null, td = 1e9;
        for (const d of drops) { const dd = Math.hypot(d.x - o[0] - .5, d.z - o[2] - .5); if (dd > 9 || d.pick !== undefined) continue; const pd = Math.hypot(d.x - p.x, d.z - p.z); if (pd < td) { td = pd; tgt = d; } }
        if (!tgt || j.t > 16) { // anything left near the stump goes in the bag
          for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; if (Math.hypot(d.x - o[0] - .5, d.z - o[2] - .5) < 9 && d.pick === undefined) { add(a, d.id, d.n); if (LOGGY[d.id]) B.st.logs += d.n; scene.remove(d.m); drops.splice(i, 1); } }
          done(); break; }
        if (td < 1.4) { add(a, tgt.id, tgt.n); if (LOGGY[tgt.id]) B.st.logs += tgt.n; scene.remove(tgt.m); drops.splice(drops.indexOf(tgt), 1); snd('pop', p, 8); }
        else moveTo(a, Math.floor(tgt.x), Math.floor(tgt.y), Math.floor(tgt.z), SP.walk, dt, far);
        break; }
      case 'mine': {
        const o = j.o, S = scanOf(ci), b = wb(o[0], o[1], o[2]);
        if (!b || (!A.ORES.has(b) && b !== T.STONE) || placed(o[0], o[1], o[2])) { done(); break; }
        if (j.ph === 'go') { a.pathLimit = 2600; const ok = moveTo(a, o[3], o[4], o[5], SP.work, dt, far); a.pathLimit = 600;
          if (ok) { j.ph = 'dig'; j.t = 0; } else if ((a.goFail || 0) > 6 || (a.pathFails || 0) > 3 || j.t > 50) { S.bad.add(o.join()); a.goFail = 0; a.pathFails = 0; done(); } break; }
        A.face(a, o[0], o[2]); a.act = 'dig';
        const pk = best(a, 'pick'), need = (A.ORES.has(b) ? 3.4 : 2.2) / (pk ? TOOL[pk][2] / 2 : 0.6);
        if (!far && Math.random() < dt * 3) { spark(o[0] + .5, o[1] + .5, o[2] + .5, 0x8a8a8a, 2, 0.4); snd('dig', p, 10); }
        if (j.t > need) { for (const [id, n] of dropsFor(b)) add(a, id, n); A.placeBlock(o[0], o[1], o[2], T.AIR); B.st.mined++; if (A.ORES.has(b)) B.st.ores++; else B.st.stone++; done(); }
        break; }
      case 'dig': {   // v0.9.76 staircase down into the ground, then a branch tunnel; ores near the tunnel are mined on the way
        j.dt = dt; const cx = Math.floor(p.x), cy = Math.floor(p.y + 0.05), cz = Math.floor(p.z);
        const enough = j.want === 'stone' ? has(a, T.COBBLE) >= 12 : j.want === 'iron' ? has(a, IT.RAWIRON) + has(a, IT.IRONINGOT) >= j.ironGoal : false;
        if (enough || j.t > 300 || j.steps > 90 || (a.goFail || 0) >= 99) { a.goFail = 0; say(a.role + ' finished digging (' + j.want + ', ' + (j.steps | 0) + ' steps)'); done(); break; }
        if (j.ph === 'go') { if (moveTo(a, j.at[0], j.at[1], j.at[2], SP.travel, dt, far) || (a.goFail || 0) > 8 || j.t > 60) { a.goFail = 0; j.ph = 'dig'; j.tt = 0; } break; }
        if (far) { j.tt += dt; if (j.tt > 3) { j.tt = 0; j.steps++; const pk = lvl(a, 'pick'); add(a, T.COBBLE, 2); if (Math.random() < 0.25) add(a, IT.COAL, 1); if (pk >= 2 && j.want === 'iron' && Math.random() < 0.3) add(a, IT.RAWIRON, 1); } break; }
        // ore within reach of the tunnel: take it first
        if (!j.ore || !A.ORES.has(wb(j.ore[0], j.ore[1], j.ore[2]))) { j.ore = null; j.os = (j.os || 0) - dt; if (j.os <= 0) { j.os = 0.6; const pk = lvl(a, 'pick');
          for (let ox = -3; ox <= 3 && !j.ore; ox++) for (let oy = -1; oy <= 3 && !j.ore; oy++) for (let oz = -3; oz <= 3 && !j.ore; oz++) { const x = cx + ox, y = cy + oy, z = cz + oz, b = wb(x, y, z);
            if (A.ORES.has(b) && (b === T.IRONORE || b === T.COALORE || b === T.DIAMONDORE || b === T.GOLDORE) && ORE_LVL(b) <= pk && !(j.skip && j.skip.has(x + ',' + y + ',' + z)) && canDig(a, x, y, z) && (!solid(x + 1, y, z) || !solid(x - 1, y, z) || !solid(x, y + 1, z) || !solid(x, y - 1, z) || !solid(x, y, z + 1) || !solid(x, y, z - 1))) j.ore = [x, y, z]; } } }
        if (j.ore) { const o = j.ore; j.why = 'ore'; j.ot = (j.ot || 0) + dt; if (Math.hypot(o[0] + .5 - p.x, o[1] - p.y - 1, o[2] + .5 - p.z) > 4.2 || !canDig(a, o[0], o[1], o[2]) || j.ot > 12) { (j.skip = j.skip || new Set()).add(o.join()); j.ore = null; j.ot = 0; } else { if (breakAt(a, j, o[0], o[1], o[2], far)) { j.ore = null; j.ot = 0; } break; } }
        // next column
        let [dx, dz] = j.dir; const down = cy > j.goalY;
        const nx = cx + dx, nz = cz + dz, ny = down ? cy - 1 : cy;
        const cells = down ? [[nx, cy + 1, nz], [nx, cy, nz], [nx, cy - 1, nz]] : [[nx, cy + 1, nz], [nx, cy, nz]];
        const bad = cells.some(q => solid(q[0], q[1], q[2]) && !canDig(a, q[0], q[1], q[2])) || liquid(wb(nx, ny - 1, nz)) || cells.some(q => liquid(wb(q[0], q[1], q[2]))) || (!solid(nx, ny - 1, nz) && !solid(nx, ny - 2, nz) && !solid(nx, ny - 3, nz));
        if (bad && j.want === 'iron' || bad && j.want === 'stone') { const cv = pickSeen(a); if (cv) { a.job = cv; say(a.role + ' broke into a cave - going for the ore'); break; } }
        if (bad) { j.why = 'turn'; j.turns = (j.turns || 0) + 1; if (j.turns > 6) { done(); break; } j.dir = j.turns % 2 ? [dz, -dx] : [-dz, dx]; break; }
        const sq = cells.find(q => solid(q[0], q[1], q[2]));
        if (sq) { j.why = 'break'; a.moving = false; breakAt(a, j, sq[0], sq[1], sq[2], far); break; }
        if (!solid(nx, ny - 1, nz) && solid(nx, ny - 2, nz)) { /* small drop: fine */ }
        // walk into it
        j.why = 'walk'; a.ang = Math.atan2(nx + .5 - p.x, nz + .5 - p.z); stepD(a, SP.work, dt, false); a.moving = true; a.curSpd = SP.work; j.wt = (j.wt || 0) + dt;
        if (Math.floor(p.x) === nx && Math.floor(p.z) === nz) { j.steps++; j.wt = 0; if (!down) { j.br = (j.br || 0) + 1; if (j.br % 12 === 0) j.dir = Math.random() < 0.5 ? [dz, -dx] : [-dz, dx]; } }
        else if (j.wt > 2.5) { p.x = nx + .5; p.z = nz + .5; p.y = ny; j.wt = 0; }
        break; }
      case 'quarry': case 'search': {   // nothing in reach: roam a bit; when you're far away, the work is abstracted
        if (!j.to) j.to = spotNear(ci.cx, ci.cz, ci.S + 18);
        if (!moveTo(a, j.to[0], j.to[1], j.to[2], SP.walk, dt, far) && j.t < 14 && !((a.goFail || 0) >= 99)) break;
        a.goFail = 0;
        a.act = j.type === 'quarry' ? 'dig' : null;
        if (j.t > 14) {
          const lucky = far || (j.type === 'search' && !j.wood) || Math.random() < 0.5;
          if (lucky) {
            if (j.type === 'quarry') { add(a, T.COBBLE, 3 + (Math.random() * 4 | 0)); if (j.ore) { if (Math.random() < 0.6) add(a, IT.RAWIRON, 1 + (Math.random() * 2 | 0)); if (Math.random() < 0.5) add(a, IT.COAL, 1 + (Math.random() * 2 | 0)); } B.st.mined++; }
            else if (j.wood) { add(a, T.LOG, 3 + (Math.random() * 3 | 0)); add(a, IT.STICK, 2); B.st.trees++; }
            else if (Math.random() < 0.7) { add(a, [IT.MUTTON, IT.PORK, IT.HAGGIS][Math.random() * 3 | 0] || IT.MUTTON, 1 + (Math.random() * 2 | 0)); B.st.simHunt++; }
          }
          done(); }
        break; }
      case 'hunt': {
        const m = j.m;
        if (!mobs.includes(m) || !(m.hp > 0) || j.t > 35) { done(); break; }
        const tp = m.g.position, td = Math.hypot(tp.x - p.x, tp.z - p.z);
        if (td > 1.6) { if (!chaseTo(a, j, tp, td > 4 ? SP.sprint : 3.0, dt, far)) { done(); break; } } else A.face(a, tp.x - .5, tp.z - .5);
        a.act = 'fight';
        if (td < 2.0 && (a.cd || 0) <= 0) {
          const s = best(a, 'sword'), dmg = s ? TOOL[s][3] + 1 : 2;
          a.cd = 0.75; a.swingT = 0.4; snd('swoosh', p, 12);
          if (m.hp <= dmg) { spark(tp.x, tp.y + .6, tp.z, 0xb03020, 10, 0.6); const meat = meatOf(m); removeMob(m); add(a, meat, m.kind === 'sheep' ? 2 : 1); if (m.kind === 'sheep') add(a, T.WOOL, 1); B.st.hunted++; done(); }
          else damageMob(m, dmg, false); }
        break; }
      case 'follow': { const m = j.m; if (!mobs.includes(m) || j.t > 8) { done(); break; } const q = m.g.position; if (Math.hypot(q.x - p.x, q.z - p.z) < 4) { done(); break; } moveTo(a, Math.floor(q.x), Math.floor(q.y), Math.floor(q.z), SP.travel, dt, far); break; }
      case 'raid': {
        const c = j.c, k = ckey(c);
        if (tm.cleared.includes(k)) { done(); break; }
        if (j.ph === 'go') { if (!j.to) j.to = spotNear(c[1], c[2], 7);
          const dd = Math.hypot(c[1] - p.x, c[2] - p.z);
          if (moveTo(a, j.to[0], j.to[1], j.to[2], dd > 30 ? SP.travel : SP.sprint, dt, far) || dd < 12 || (j.t > 90 && dd < 30)) { j.ph = 'fight'; j.t = 0; say(a.role + ' is storming the ' + c[0] + ' castle'); }
          if (j.t > 400) { a.g.position.set(j.to[0] + .5, j.to[1], j.to[2] + .5); }
          break; }
        const kind = c[0] === 'black' ? 'blackskel' : 'skeleton', foes = mobs.filter(m => m.hp > 0 && !blocked(m) && (m.kind === kind || m.kind === 'bigskel') && Math.hypot(m.g.position.x - c[1], m.g.position.z - c[2]) < 34);
        const tgt = foes.sort((q, r) => Math.hypot(q.g.position.x - p.x, q.g.position.z - p.z) - Math.hypot(r.g.position.x - p.x, r.g.position.z - p.z))[0];
        a.act = 'fight';
        if (tgt) { j.quiet = 0; const tp = tgt.g.position, td = Math.hypot(tp.x - p.x, tp.z - p.z);
          if (!j.cs || j.cs.m !== tgt) j.cs = {m: tgt};
          if (td > 1.7) chaseTo(a, j.cs, tp, SP.sprint, dt, far); else A.face(a, tp.x - .5, tp.z - .5);
          if (td < 2.1 && (a.cd || 0) <= 0 && swingAt(a, tgt)) { j.kills++; tm.kills = (tm.kills || 0) + 1; }
        } else {
          j.quiet += dt;
          if (far) { // the fight happens off-screen: it takes a while and it hurts
            if (Math.random() < dt * 0.6) { hurtBot(a, c[0] === 'black' ? 3 : 2, c[0] === 'black' ? 'black skeletons' : 'skeletons'); if (Math.random() < 0.5) { B.st.kills++; tm.kills = (tm.kills || 0) + 1; } }
            if (Math.random() < dt) { if (!j.to2 || Math.random() < 0.3) j.to2 = spotNear(c[1], c[2], 10); }
            if (j.to2) moveTo(a, j.to2[0], j.to2[1], j.to2[2], SP.sprint, dt, far);
          } else if (!j.to2 || Math.random() < dt * 0.3) j.to2 = spotNear(c[1], c[2], 10); else moveTo(a, j.to2[0], j.to2[1], j.to2[2], SP.travel, dt, far);
        }
        const need = far ? 22 : 8;
        if (j.quiet > need || j.kills >= 6) {
          if (!tm.cleared.includes(k)) { tm.cleared.push(k); if (!tm.noSpawn.includes(k)) tm.noSpawn.push(k); B.st.raids++;
            for (const m of mobs.slice()) if ((m.kind === kind || m.kind === 'bigskel') && m.home && m.home[0] === c[1] && m.home[1] === c[2] && Math.hypot(m.g.position.x - P.x, m.g.position.z - P.z) > 24) removeMob(m);
            say(c[0] === 'black' ? 'The clansmen have wiped out the Black skeleton castle!' : 'The clansmen raided the mossy castle and killed its skeletons.', true);
            tm.step = c[0] === 'black' ? 'loot' : 'black'; }
          done(); }
        break; }
      case 'loot': {
        const ch = blackChest(j.c);
        if (!ch || !ch.a) { // the chest is gone: make flint and steel, and bring obsidian from the lava pool
          if (!has(a, IT.FLINTSTEEL)) add(a, IT.FLINTSTEEL, 1); if (has(a, T.OBSIDIAN) < 2) add(a, T.OBSIDIAN, 2); tm.step = 'portal'; done(); break; }
        if (j.ph === 'go') { if (moveTo(a, ch.a[0], ch.a[1], ch.a[2], SP.travel, dt, far) || (a.goFail || 0) > 8 || j.t > 120) { a.goFail = 0; j.ph = 'take'; j.t = 0; A.face(a, ch.x, ch.z); snd('chestOpen', p, 8); } break; }
        a.act = 'cook';
        if (j.t > 1.2) { const f = A.chestTake(ch.k, [IT.FLINTSTEEL], 1), o = A.chestTake(ch.k, [T.OBSIDIAN], 64);
          if (f) add(a, f[0], f[1]); if (o) add(a, o[0], o[1]);
          if (!has(a, IT.FLINTSTEEL) && !bots().some(m => has(m, IT.FLINTSTEEL))) { if (has(a, IT.IRONINGOT) && has(a, T.COBBLE)) { add(a, IT.IRONINGOT, -1); add(a, T.COBBLE, -1); } add(a, IT.FLINTSTEEL, 1); }
          if (has(a, T.OBSIDIAN) < 2 && !bots().some(m => has(m, T.OBSIDIAN) >= 2)) add(a, T.OBSIDIAN, 2 - has(a, T.OBSIDIAN));
          say('The clansmen stole the obsidian and the flint and steel from the black castle chest.', true); tm.step = 'portal'; done(); }
        break; }
      case 'portal': {
        const f = portalFrame(j.c), front = [f.x + 1, f.y + 1, f.z + 1], inside = [f.x + 1, f.y + 1, f.z];
        if (j.ph === 'go') { if (moveTo(a, front[0], front[1], front[2], SP.travel, dt, far) || (a.goFail || 0) > 8 || j.t > 150) { a.goFail = 0; j.ph = 'build'; j.t = 0; A.face(a, f.x + 1, f.z); } break; }
        if (j.ph === 'build') { a.act = 'dig';
          if (j.t > 1.5) { const lit = wb(inside[0], inside[1], inside[2]) === T.PORTAL;
            if (!lit) { const holder = bots().find(m => has(m, IT.FLINTSTEEL)) || a; const n = buildPortal(holder, f); if (n) say('The clansmen placed ' + n + ' obsidian to finish the portal frame.'); a.swingT = 0.4;
              let ok = false; try { ok = lightPortal(inside[0], inside[1], inside[2]); } catch (_) {}
              if (!ok) { for (let x = f.x + 1; x <= f.x + 2; x++) for (let y = f.y + 1; y <= f.y + 3; y++) A.placeBlock(x, y, f.z, T.PORTAL); try { rebuild(); } catch (_) {} }
              spark(inside[0] + .5, inside[1] + 1, inside[2] + .5, 0xb040e0, 18, 0.9); say('The clansmen lit the portal with flint and steel!', true); }
            j.ph = 'enter'; j.t = 0; }
          break; }
        // walk through
        if (moveTo(a, inside[0], inside[1], inside[2], SP.walk, dt, far) || j.t > 20) enterHell(a, f);
        break; }
    }
  }
  function enterHell(a, f) {
    const tm = TM(); if (!tm.hellBots) tm.hellBots = {};
    try { C95.takeSnap(); } catch (_) {}
    const s = C95.snap && C95.snap[a.role]; if (s) { tm.hellBots[a.role] = JSON.parse(JSON.stringify(s)); delete C95.snap[a.role]; }
    spark(a.g.position.x, a.g.position.y + 1, a.g.position.z, 0xb040e0, 20, 1);
    say(a.role + ' stepped through the portal into Hell');
    removeMob(a);
    if (!bots().length) { tm.phase = 'hell'; tm.hellT = 150 + Math.random() * 90; tm.portalAt = [f.x + 1, f.y + 1, f.z + 1]; say('Both clansmen have gone into Hell...', true); }
  }
  function backFromHell() {
    const tm = TM(), at = tm.portalAt || [Math.floor(P.x) + 20, 0, Math.floor(P.z)];
    const y = A.groundY(at[0], at[2]);
    C95.snap = C95.snap || {};
    for (const role of A.ROLES) { const s = (tm.hellBots && tm.hellBots[role]) || {role, hp: 24, food: 20, armour: IRON_ARM.slice(), home: null, inv: {}};
      s.pos = [at[0] + .5 + (role === 'miner' ? 1 : 0), Math.max(y, at[1]), at[2] + .5]; s.hp = s.maxHp || 24; C95.snap[role] = s; }
    tm.hellBots = null; tm.phase = 'hostile'; tm.hostDead = 0;
    say('The clansmen have come back from Hell... and now they are coming for YOU.', true);
  }

  // ================= one tick =================
  function brain(a, dt) {
    const p = a.g.position; a.flee = 0; a.speed = 0; a.burning = 0; a.isBot = true;
    if (!a.ci && a.home) { const c = (typeof g9castles !== 'undefined' && g9castles || []).find(q => q[1] === a.home[0] && q[2] === a.home[1]); if (c) a.ci = A.castleInfo(c); }
    if (!a.ci) { const c = (typeof g9castles !== 'undefined' && g9castles || []).filter(castleFriendly).sort((q, r) => Math.hypot(q[1] - p.x, q[2] - p.z) - Math.hypot(r[1] - p.x, r[2] - p.z))[0]; if (c) { a.home = [c[1], c[2]]; a.ci = A.castleInfo(c); } }
    const ci = a.ci; if (!ci) return;
    if (B.ffGear && !a.ffg) { a.ffg = 1; if (lvl(a, 'pick') < 3 || ironArm(a) < 2) gear(a); }
    if (a.bedIdx == null) a.bedIdx = A.ROLES.indexOf(a.role);
    const dist = Math.hypot(P.x - p.x, P.z - p.z), far = dist > 48;
    let tdt = dt;
    if (dist > 30) { a.farT = (a.farT || 0) + dt; if (a.farT < 0.25) return; tdt = Math.min(a.farT, 0.5); a.farT = 0; }
    if (!a.sleeping) a.skipPhys = far;
    a.moving = false; a.curSpd = 0;
    if (a.mad > 0) a.mad -= tdt;
    a.cd = (a.cd || 0) - tdt; a.chestCd = (a.chestCd || 0) - tdt;
    a.food = (a.food == null ? 16 : a.food) - tdt / 30;
    if (a.food > 12 && a.hp < (a.maxHp || 24)) a.hp = Math.min(a.maxHp || 24, a.hp + tdt / 6);
    if (a.food <= 0) { a.food = 0; if (a.hp > 4) a.hp -= tdt / 20; }
    if (a.sleeping) { if (!isNight || TM().phase === 'hostile' || a.mad > 0 || A.hostileNear(a, 5)) { A.wake(a); a.job = null; } }
    a.thinkT = (a.thinkT == null ? Math.random() * 0.4 : a.thinkT) - tdt;
    if (!a.sleeping && a.thinkT <= 0) { a.thinkT = far ? 0.9 : 0.4; try { think(a, ci, far); } catch (e) { if (!B.err1) { B.err1 = String(e && e.stack || e); console.warn('c96 think', e); } a.job = {type: 'wait', t: 0, tt: 3, pri: 0}; } }
    if (a.job !== a.lastJob) { a.lastJob = a.job; a.goFail = 0; a.wk = null; a.npT = 0; if (a.job) { try { noteJob(a, a.job); } catch (_) {} B.tl.push([+(B.gt || 0).toFixed(1), a.role, a.job.type + (a.job.want ? ':' + a.job.want : '')]); if (B.tl.length > 400) B.tl.shift(); } }
    if (!a.sleeping) { try { act(a, ci, tdt, far); } catch (e) { if (!B.err2) { B.err2 = String(e && e.stack || e); console.warn('c96 act', e); } a.job = null; } if (a.job && a.job.done) a.job = null; }
    if (!a.sleeping && !far) threats(a, tdt);
    if (!far && !a.sleeping && started) { a.osT = (a.osT || 0) - tdt; if (a.osT <= 0) { a.osT = 0.1; try { oreScan(a); } catch (_) {} }
      // watchdog: a moving-type job with no movement and no digging for 2 s -> re-plan now
      const j = a.job, mv = j && ((j.ph === 'go' && j.type !== 'hunt') || j.type === 'goto' || j.type === 'dig' || j.type === 'search' || j.type === 'quarry');
      const dg = B.st.dug || 0; if (mv && (a.vs || 0) < 0.1 && dg === a.npD && !(j.bk && j.bk.t > 0) && !(a.wk && a.wk.bk) && !(j.ore)) { a.npT = (a.npT || 0) + tdt; if (a.npT > 2) { a.npT = 0; a.wk = null; a.wp = null; B.pst.wd = (B.pst.wd || 0) + 1; a.npN = (a.npN || 0) + 1; if (j.type === 'search' || j.type === 'quarry') { j.done = true; a.thinkT = 0; } if (a.npN >= 2) { a.npN = 0; a.goFail = 99; if (j.type === 'search' || j.type === 'quarry') j.done = true; a.thinkT = 0; } } } else { a.npT = 0; if ((a.vs || 0) > 0.3) a.npN = 0; } a.npD = dg; }
    if (far) { if (!a.sleeping && (!a.job || (a.job.type !== 'mine' && a.job.type !== 'bed'))) { const f = floorBelow(Math.floor(p.x), p.y + 1, Math.floor(p.z)); if (Math.abs(f - p.y) < 3) p.y = f; } return; }
    if (dist < 6 && !a.sleeping && !(a.job && (a.job.type === 'fight' || a.job.type === 'hunt'))) a.glanceT = 0.3;   // v0.9.76: head turns to you, the work goes on
    { const vx = p.x - (a.lpx ?? p.x), vz = p.z - (a.lpz ?? p.z); a.lpx = p.x; a.lpz = p.z; const v = tdt > 0 ? Math.min(8, Math.hypot(vx, vz) / tdt) : 0;   // v0.9.78: walk/run/idle anim from the real speed
      a.vs = (a.vs || 0) + (v - (a.vs || 0)) * Math.min(1, tdt * 8); a.moving = a.vs > 0.35; a.curSpd = a.moving ? a.vs : 0; }
    if (dist < 40) { syncHeld(a); const k = a.act; if (k === 'chop') a.act = 'dig'; A.animate(a, dt, dist); a.act = k; }
  }
  C95.brain = (a, dt) => B.on ? brain(a, dt) : undefined;
  // held items follow what's really in the bag
  function syncHeld(a) {
    const grip = a.arms && a.arms[1] && a.arms[1].userData.grip; if (!grip) return;
    for (const [kind, key] of [['pick', 'pickG'], ['sword', 'swordG'], ['axe', 'axeG']]) {
      const id = best(a, kind); if ((a['_h' + kind] || 0) === id) continue;
      if (a[key] && a[key].parent) a[key].parent.remove(a[key]);
      a[key] = id ? C95.held(id) : null; if (a[key]) grip.add(a[key]); a['_h' + kind] = id;
    }
  }

  // ================= team-level: phases, scan, Hell timer =================
  function teamTick() {
    const tm = TM(), bs = bots();
    for (const m of bs) if (m.ci && Math.random() < 0.2) {}
    if (tm.phase === 'survive' && bs.length && bs.every(m => lvl(m, 'pick') >= 2 && lvl(m, 'sword') >= 2 && lvl(m, 'axe') >= 2) && bs.reduce((s, m) => s + cooked(m) + rawN(m), 0) >= 4) {
      tm.phase = 'mine'; say('The clansmen have stone tools and food. Now they go looking for ore.', bs.some(m => Math.hypot(P.x - m.g.position.x, P.z - m.g.position.z) < 64)); }
    if (tm.phase === 'mine') tm.mineT = (tm.mineT || 0) + 1;
    if (tm.phase === 'mine' && bs.length === 2 && bs.every(m => lvl(m, 'pick') >= 3 && lvl(m, 'sword') >= 3 && (ironArm(m) >= 4 || (ironArm(m) >= 2 && tm.mineT > 900)) && cooked(m) >= 5)) {
      tm.phase = 'war'; tm.step = 'regroup'; tm.rgT = 0; say('The clansmen are geared in iron with food packed. They march to war on the skeleton castles!', true); }
    if (tm.phase === 'war' && tm.step === 'regroup') { tm.rgT = (tm.rgT || 0) + 1; const home = bs[0] && bs[0].ci; if (!home || tm.rgT > 60 || bs.every(m => Math.hypot(m.g.position.x - home.cx, m.g.position.z - home.cz) < 10)) { tm.step = 'mossy'; say('Both clansmen are back at the castle in full iron. Off to raid!', true); } }
    if (tm.phase === 'war' && bs.length === 0 && !tm.hellBots) { /* both dead mid-campaign: start over */ }
  }
  let tickT = 0, hellLast = 0;
  const um = updateMobs;
  updateMobs = function (dt) {
    B.gt += dt || 0; B.fn = 0;
    const r = um.apply(this, arguments);
    if (!started || DIM.cur || !B.on) return r;
    const tm = TM();
    if (tm.phase === 'hell') { tm.hellT -= dt; if (tm.hellT <= 0) try { backFromHell(); } catch (e) { console.warn('c96 hell', e); } }
    const bs = bots();
    if (bs.length) { const ci = bs[0].ci; if (ci) try { scanStep(ci, 3); } catch (e) { if (!B.err3) { B.err3 = String(e); console.warn('c96 scan', e); } } }
    tickT -= dt; if (tickT <= 0) { tickT = 2; try { teamTick(); } catch (e) { console.warn('c96 team', e); } }
    return r;
  };
  // cleared castles stay cleared; nobody new turns up while they're in Hell
  const sm = spawnMob;
  spawnMob = function (kind) {
    const tm = TM();
    if (kind === 'clansman' && !C95.force && tm.phase === 'hell') return null;
    if ((kind === 'skeleton' || kind === 'blackskel' || kind === 'bigskel') && window.__egg && window.__eggSpot && tm.noSpawn.length) {
      const [x, , z] = window.__eggSpot;
      for (const k of tm.noSpawn) { const [, xy] = k.split(':'), [cx, cz] = xy.split(',').map(Number); if (Math.abs(x - cx) < 34 && Math.abs(z - cz) < 34) return null; } }
    return sm.apply(this, arguments);
  };
  const km = killMob;
  killMob = function (a) {
    if (isB(a)) { const tm = TM(); say(a.role + ' was killed');
      if (tm.phase === 'hostile') { tm.hostDead = (tm.hostDead || 0) + 1; if (tm.hostDead >= 2 || bots().length <= 1) { const ns = tm.noSpawn; B.team = fresh(); B.team.noSpawn = ns; say('You beat the rogue clansmen. New, friendly ones will settle at the castle.', true); } }
      else if (tm.phase === 'war' && bots().length <= 1) { tm.phase = 'mine'; tm.step = null; } }
    return km.apply(this, arguments);
  };
  const se = serialize;
  serialize = function () { const d = se.apply(this, arguments); try { d.c96 = JSON.parse(JSON.stringify(TM())); } catch (_) {} return d; };
  const ap = applySave;
  applySave = function (d) { const r = ap.apply(this, arguments); if (d && !d.dim) { try { B.team = cleanTeam(d.c96); } catch (e) { B.team = fresh(); B.team.noSpawn = []; console.warn('c96 team save reset', e); } SCAN.clear(); } return r; };
  // v0.9.76: anything odd in the saved campaign is reset to a fresh team rather than blocking the load
  function cleanTeam(o) { B.team = null; const t = fresh(); t.noSpawn = []; if (!o || typeof o !== 'object' || Array.isArray(o)) return t;
    const strs = v => Array.isArray(v) ? v.filter(k => typeof k === 'string' && /^[a-z]+:-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(k)) : [];
    if (['survive', 'mine', 'war', 'hell', 'hostile'].includes(o.phase)) t.phase = o.phase;
    if (['mossy', 'black', 'loot', 'portal'].includes(o.step)) t.step = o.step;
    t.cleared = strs(o.cleared); t.noSpawn = strs(o.noSpawn);
    const num = v => typeof v === 'number' && isFinite(v);
    t.hellT = num(o.hellT) ? o.hellT : 0; t.hostDead = num(o.hostDead) ? o.hostDead : 0; if (num(o.kills)) t.kills = o.kills;
    if (o.portal && num(o.portal.x) && num(o.portal.y) && num(o.portal.z)) t.portal = {x: o.portal.x, y: o.portal.y, z: o.portal.z};
    if (Array.isArray(o.portalAt) && o.portalAt.length >= 3 && o.portalAt.every(num)) t.portalAt = o.portalAt.slice(0, 3);
    if (o.hellBots && typeof o.hellBots === 'object' && !Array.isArray(o.hellBots)) { t.hellBots = {}; for (const r of A.ROLES) { const q = o.hellBots[r]; if (q && typeof q === 'object') t.hellBots[r] = q; } }
    if (t.phase === 'hell' && !t.hellBots) { t.phase = 'war'; t.step = 'portal'; }
    return t; }
  const ew = enterWorld;
  enterWorld = function (save) { if (!save) { B.team = fresh(); B.team.noSpawn = []; SCAN.clear(); } return ew.apply(this, arguments); };

  // ================= debug =================
  function gear(m) { const I = inv(m); Object.assign(I, {[IT.IPICK]: 1, [IT.ISWORD]: 1, [IT.SAXE]: 1, [IT.COOKEDMUTTON || IT.BREAD]: 8, [T.PLANKS]: 12, [IT.STICK]: 6, [T.COBBLE]: 12, [IT.COAL]: 6});
    m.armour = [108, 109, 110, 111]; m.hp = m.maxHp || 24; m.food = 20; }
  B.ff = function (stage) {
    const tm = TM(), bs = bots();
    if (stage === 'geared' || stage === 'war' || stage === 'black' || stage === 'portal' || stage === 'hell') { bs.forEach(gear); B.ffGear = true; }
    if (stage === 'geared') tm.phase = 'mine';
    if (stage === 'war') { tm.phase = 'war'; tm.step = 'mossy'; }
    if (stage === 'black') { tm.phase = 'war'; tm.step = 'black'; for (const c of castles('mossy')) if (!tm.cleared.includes(ckey(c))) { tm.cleared.push(ckey(c)); tm.noSpawn.push(ckey(c)); } }
    if (stage === 'portal' || stage === 'hell') { tm.phase = 'war'; tm.step = 'portal'; for (const c of castles('mossy').concat(castles('black'))) if (!tm.cleared.includes(ckey(c))) { tm.cleared.push(ckey(c)); tm.noSpawn.push(ckey(c)); }
      bs.forEach(m => { add(m, IT.FLINTSTEEL, has(m, IT.FLINTSTEEL) ? 0 : 1); add(m, T.OBSIDIAN, 2); }); }
    if (stage === 'hell') { const b = castles('black')[0]; const f = b ? portalFrame(b) : {x: Math.floor(P.x) + 12, y: A.groundY(Math.floor(P.x) + 12, Math.floor(P.z)), z: Math.floor(P.z)}; bs.slice().forEach(m => enterHell(m, f)); if (!bots().length) tm.hellT = 3; }
    if (stage === 'hostile') { if (tm.phase !== 'hell') { const b = castles('black')[0]; const f = b ? portalFrame(b) : {x: Math.floor(P.x) + 12, y: 0, z: Math.floor(P.z)}; tm.portalAt = [Math.floor(P.x) + 14, 0, Math.floor(P.z)]; bots().slice().forEach(m => enterHell(m, f)); tm.portalAt = [Math.floor(P.x) + 14, 0, Math.floor(P.z)]; } tm.phase = 'hell'; tm.hellT = 0.01; }
    bs.forEach(m => { m.job = null; m.thinkT = 0; });
    return B.state();
  };
  B.state = () => ({team: JSON.parse(JSON.stringify(TM())), st: B.st, crafts: B.crafts.slice(-12), ev: B.ev.slice(-12), err: [B.err1, B.err2, B.err3].filter(Boolean),
    scan: [...SCAN.values()].map(s => ({trees: s.trees.length, stone: s.stone.length, ores: s.ores.length, scanning: s.x !== null})),
    bots: bots().map(m => ({role: m.role, job: m.job && m.job.type, ph: m.job && m.job.ph, act: m.act, hp: Math.round(m.hp * 10) / 10, food: Math.round(m.food || 0), sleeping: !!m.sleeping, armour: m.armour,
      pick: lvl(m, 'pick'), sword: lvl(m, 'sword'), axe: lvl(m, 'axe'), inv: Object.fromEntries(Object.entries(inv(m)).map(([k, v]) => [NAMES[k] || k, v])), pos: [m.g.position.x, m.g.position.y, m.g.position.z].map(v => Math.round(v * 10) / 10)}))});
})();
// c96b: the two workers are persistent players: the old 40-block despawn sweep must not eat them when you walk away
(function () {
  if (typeof despawnPass !== 'function') return;
  const dp = despawnPass;
  despawnPass = function () { if (DIM.cur) return dp.apply(this, arguments); const keep = []; for (let i = mobs.length - 1; i >= 0; i--) { const m = mobs[i]; if (m.kind === 'clansman' && m.role && m.isBot) { keep.push(m); mobs.splice(i, 1); } }
    try { return dp.apply(this, arguments); } finally { for (const a of keep) mobs.push(a); } };
})();
