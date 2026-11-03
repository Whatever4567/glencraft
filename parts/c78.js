/* ===================== GLX-C78 (v0.9.63): castle folk with day jobs and beds, Minecraft-like A* for ground mobs, skeleton archers ===================== */
var C78 = {castles: new Map(), saved: {}, doors: [], stats: {paths: 0, nodes: 0, deferred: 0, mined: 0, farmed: 0, hunted: 0, cooked: 0, ate: 0, slept: 0}};
(function c78() {
  const LOW = (typeof PERF !== 'undefined' && PERF) || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || '');
  const FRAME_NODES = LOW ? 700 : 1600;
  let nodeBudget = FRAME_NODES;
  const isDoor = b => b === T.DOOR || b === T.DOORTOP;
  const wb = (x, y, z) => (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) ? 0 : world[(x * H + y) * D + z];
  const BADROOF = new Set([T.LEAVES, T.LOG, T.AIR, T.WATER]);
  // ---------------- 1) pathfinding ----------------
  function clearAt(x, y, z, door) { const b = wb(x, y, z); if (b === T.WATER || b === T.LAVA) return false; if (door && isDoor(b)) return true; return !solid(x, y, z); }
  function okCell(x, y, z, o) {
    if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2 || y < 1 || y >= H - o.tall - 1) return false;
    if (!solid(x, y - 1, z)) return false;
    const fb = wb(x, y - 1, z); if (fb === T.LAVA || isDoor(fb)) return false;
    for (let k = 0; k < o.tall; k++) if (!clearAt(x, y + k, z, o.door)) return false;
    if (o.wide) for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 0; k < 2; k++) if (!clearAt(x + ax, y + k, z + az, false)) return false;
    return true;
  }
  function nearLava(x, y, z) { for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (wb(x + ax, y, z + az) === T.LAVA || wb(x + ax, y - 1, z + az) === T.LAVA) return true; } return wb(x, y - 1, z) === T.LAVA; }
  const DX = [1, -1, 0, 0, 1, 1, -1, -1], DZ = [0, 0, 1, -1, 1, -1, 1, -1];
  findPath = function (sx, sy, sz, tx, tz, tall, limit, opt) {
    opt = opt || {}; const o = {tall: tall || 1, door: !!opt.door, wide: !!opt.wide}, ty = opt.ty == null ? null : opt.ty;
    const KX = D * H, key = (x, y, z) => x * KX + z * H + y;
    if (!okCell(sx, sy, sz, o)) { let f = null;
      for (const dy of [1, -1, 0, 2]) { if (okCell(sx, sy + dy, sz, o)) { f = [sx, sy + dy, sz]; break; } }
      if (!f) outer: for (const dy of [0, 1, -1]) for (let d = 0; d < 8; d++) if (okCell(sx + DX[d], sy + dy, sz + DZ[d], o)) { f = [sx + DX[d], sy + dy, sz + DZ[d]]; break outer; }
      if (!f) { findPath.n = 1; return null; } sx = f[0]; sy = f[1]; sz = f[2]; }
    const g = new Map(), from = new Map(), open = [];
    const push = nd => { open.push(nd); let i = open.length - 1; while (i > 0) { const q = (i - 1) >> 1; if (open[q][0] <= nd[0]) break; open[i] = open[q]; open[q] = nd; i = q; } };
    const pop = () => { const top = open[0], last = open.pop(); if (open.length) { open[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < open.length && open[l][0] < open[m][0]) m = l; if (r < open.length && open[r][0] < open[m][0]) m = r; if (m === i) break; const t = open[i]; open[i] = open[m]; open[m] = t; i = m; } } return top; };
    const hf = (x, y, z) => { const ax = Math.abs(x - tx), az = Math.abs(z - tz); return Math.max(ax, az) + 0.414 * Math.min(ax, az) + (ty === null ? 0 : Math.abs(y - ty) * 0.8); };
    const k0 = key(sx, sy, sz); g.set(k0, 0); push([hf(sx, sy, sz), sx, sy, sz, 0]);
    let best = null, bh = Infinity, n = 0, goal = null;
    while (open.length && n < limit) {
      const [, x, y, z, gc] = pop(), kc = key(x, y, z);
      if (gc > g.get(kc)) continue;
      n++;
      const hh = hf(x, y, z); if (hh < bh) { bh = hh; best = kc; }
      if (x === tx && z === tz && (ty === null || Math.abs(y - ty) <= 1)) { goal = kc; break; }
      for (let d = 0; d < 8; d++) {
        const dx = DX[d], dz = DZ[d], nx = x + dx, nz = z + dz; let ny = null;
        if (d >= 4) { if (okCell(nx, y, nz, o) && okCell(x + dx, y, z, o) && okCell(x, y, z + dz, o)) ny = y; else continue; }
        else if (okCell(nx, y, nz, o)) ny = y;
        else if (clearAt(x, y + o.tall, z, false) && okCell(nx, y + 1, nz, o)) ny = y + 1;              // jump up one block
        else {
          let clr = true; for (let k = 0; k < o.tall; k++) if (!clearAt(nx, y + k, nz, o.door)) { clr = false; break; }
          if (clr) for (let fy = y - 1; fy >= Math.max(1, y - 3); fy--) {                                // drop up to 3, never into water or lava
            if (!clearAt(nx, fy, nz, false)) break;
            const under = wb(nx, fy - 1, nz); if (under === T.WATER || under === T.LAVA) break;
            if (solid(nx, fy - 1, nz)) { if (okCell(nx, fy, nz, o)) ny = fy; break; }
          }
        }
        if (ny === null) continue;
        let cost = d >= 4 ? 1.414 : 1; if (ny > y) cost += 0.8; else if (ny < y) cost += 0.35 * (y - ny);
        if (nearLava(nx, ny, nz)) cost += 8;
        if (o.door && (isDoor(wb(nx, ny, nz)) || isDoor(wb(nx, ny + 1, nz)))) cost += 0.6;
        const kn = key(nx, ny, nz), gn = gc + cost, old = g.get(kn); if (old !== undefined && old <= gn) continue;
        g.set(kn, gn); from.set(kn, kc); push([gn + hf(nx, ny, nz) * 1.05, nx, ny, nz, gn]);
      }
    }
    findPath.n = n; C78.stats.nodes += n; C78.stats.paths++;
    const end = goal !== null ? goal : best;
    if (end === null || end === k0) return null;
    const out = []; let k = end;
    while (k !== k0 && from.has(k)) { const x = Math.floor(k / KX), r = k - x * KX, z = Math.floor(r / H); out.push([x, r - z * H, z]); k = from.get(k); }
    out.reverse(); out.partial = goal === null; return out;
  };
  // heading toward (tx, tz[, ty]) along a cached path, with stuck detection, re-path limits and a per-frame node budget
  pathAngle = function (a, tx, tz, ty) {
    const p = a.g.position, now = performance.now(), cx = Math.floor(tx), cz = Math.floor(tz);
    const direct = Math.hypot(tx - p.x, tz - p.z), dAng = Math.atan2(tx - p.x, tz - p.z);
    if (direct < 1.3 && (ty == null || Math.abs(ty - p.y) < 1.2)) { a.path = null; return dAng; }
    const tall = a.tall || (a.hostile ? 2 : 1), far = direct > 14, gy = ty == null ? null : Math.floor(ty + 0.05);
    const moved = a.pathGoal && (Math.abs(a.pathGoal[0] - cx) + Math.abs(a.pathGoal[1] - cz) > (far ? 3 : 1) || (gy !== null && a.pathGoal[2] !== null && Math.abs(a.pathGoal[2] - gy) > 1));
    const age = now - (a.pathAt || 0);
    const stale = a.repath || !a.path || !a.path.length || moved || age > (a.path && a.path.partial ? 1800 : 5000);
    if (stale && !(a.pathFailUntil > now) && age > 250) {
      const want = a.pathLimit || (a.giant ? 450 : a.hostile ? 900 : 500);
      if (nodeBudget >= Math.min(want, 220)) {
        const r = findPath(Math.floor(p.x), Math.floor(p.y + 0.05), Math.floor(p.z), cx, cz, tall, Math.min(want, nodeBudget), {ty: gy, door: a.kind === 'clansman', wide: !!a.giant});
        nodeBudget -= findPath.n || 0; a.pathAt = now; a.pathGoal = [cx, cz, gy]; a.repath = false; a.pathProg = null; a.path = r;
        if (!r) { a.pathFailUntil = now + 900 + Math.random() * 900; a.pathFails = (a.pathFails || 0) + 1; return null; }
        a.pathFails = 0;
      } else C78.stats.deferred++;
    }
    if (!a.path || !a.path.length) return a.pathFailUntil > now ? null : dAng;
    const fy = Math.floor(p.y + 0.05);
    while (a.path.length) { const w = a.path[0]; if (Math.hypot(w[0] + .5 - p.x, w[2] + .5 - p.z) < 0.42 && Math.abs(w[1] - fy) <= 1) { a.path.shift(); a.pathProg = null; } else break; }
    if (!a.path.length) { if (a.path.partial) a.repath = true; return dAng; }
    // stuck: the next waypoint is not getting closer -> nudge (hop + push toward it) and plan again
    const w0 = a.path[0], dw = Math.hypot(w0[0] + .5 - p.x, w0[2] + .5 - p.z);
    if (!a.pathProg || dw < a.pathProg[0] - 0.15) a.pathProg = [dw, now];
    else if (now - a.pathProg[1] > 1400) {
      a.pathProg = null; a.repath = true; a.stuckN = (a.stuckN || 0) + 1;
      if (a.onGround) { if (w0[1] >= fy) { a.vy = 6.6; a.onGround = false; } a.kbx = (a.kbx || 0) + (w0[0] + .5 - p.x) / (dw || 1) * 1.8; a.kbz = (a.kbz || 0) + (w0[2] + .5 - p.z) / (dw || 1) * 1.8; }
    }
    let w = w0;
    if (a.path.length > 1) { const w1 = a.path[1]; if (w1[1] === w0[1] && w0[1] === fy && okCell(Math.floor((p.x + w1[0] + .5) / 2), fy, Math.floor((p.z + w1[2] + .5) / 2), {tall, door: false})) w = w1; }
    return Math.atan2(w[0] + .5 - p.x, w[2] + .5 - p.z);
  };
  C78.findPath = findPath; C78.okCell = okCell;
  // fleeing animals run to a reachable spot away from you, not blindly into walls or water
  window.__c78flee = function (a, dpx, dpz) {
    const p = a.g.position, now = performance.now();
    if (!a.fleeGoal || now - a.fleeAt > 2200 || Math.hypot(a.fleeGoal[0] - p.x, a.fleeGoal[1] - p.z) < 1.5) {
      const base = Math.atan2(-dpx, -dpz); let bg = null, bs = -1e9;
      for (const off of [0, 0.5, -0.5, 1.0, -1.0, 1.6, -1.6, 2.3, -2.3]) {
        const an = base + off, gx = p.x + Math.sin(an) * 9, gz = p.z + Math.cos(an) * 9, ix = Math.floor(gx), iz = Math.floor(gz);
        if (ix < 3 || iz < 3 || ix >= W - 3 || iz >= D - 3) continue;
        const f = floorBelow(ix, p.y + 3, iz), wet = wb(ix, f, iz) === T.WATER || wb(ix, f - 1, iz) === T.WATER || wb(ix, f - 1, iz) === T.LAVA;
        const sc = -Math.abs(off) * 1.2 - (wet ? 20 : 0) - Math.max(0, Math.abs(f - p.y) - 1) * 2;
        if (sc > bs) { bs = sc; bg = [gx, gz]; }
      }
      a.fleeGoal = bg || [p.x - dpx, p.z - dpz]; a.fleeAt = now; a.path = null;
    }
    return pathAngle(a, a.fleeGoal[0], a.fleeGoal[1]);
  };
  window.__c78gpa = function (a) { const d = Math.hypot(P.x - a.g.position.x, P.z - a.g.position.z); if (d < 3 || d > 24) return null; a.tall = 3; a.pathLimit = 450; return pathAngle(a, P.x, P.z, P.y); };
  // ---------------- 2) skeleton archers: strafe, back off, draw and loose every 1.5-2 s ----------------
  window.__c78skel = function (a, dt, dist, dpx, dpz) {
    a.seeT = (a.seeT || 0) - dt; if (a.seeT <= 0) { a.seeT = 0.25; a.see = dist < 15 && canSee(a, 15); }
    a.shootCd -= dt;
    if (!a.see || dist > 11) {
      const pa = pathAngle(a, P.x, P.z, P.y); a.ang = pa !== null ? pa : Math.atan2(dpx, dpz) + (a.detourT > 0 ? a.detour : 0);
      if (a.shootCd < 0.6) a.shootCd = 0.6; return a.speed;
    }
    a.ang = Math.atan2(dpx, dpz); a.path = null; a.pathProg = null;
    a.strT = (a.strT || 0) - dt; if (a.strT <= 0) { a.strT = 1.2 + Math.random() * 1.8; a.strDir = Math.random() < 0.5 ? -1 : 1; }
    const fx = dpx / (dist || 1), fz = dpz / (dist || 1), back = dist < 5 ? -1 : dist > 9 ? 0.45 : 0;
    const sx = -fz * a.strDir, sz = fx * a.strDir, v = a.speed * (a.shootCd < 1.0 ? 0.32 : 0.6);
    const mx = (sx * 0.85 + fx * back) * v * dt, mz = (sz * 0.85 + fz * back) * v * dt;
    if (moveMob(a, mx, mz) === false && moveMob(a, mx, 0) === false && moveMob(a, 0, mz) === false) { a.strDir = -a.strDir; a.strT = 0.8; }
    a.strafing = true; a.strSpd = v;
    if (a.shootCd <= 0) { a.shootCd = 1.5 + Math.random() * 0.5; shootArrow(a); }
    return 0;
  };
  const sa = shootArrow;
  shootArrow = function (a) { const n = arrows.length, r = sa.apply(this, arguments); if (arrows.length > n) { const v = arrows[arrows.length - 1].v; v.x += (Math.random() - .5) * 1.1; v.y += (Math.random() - .5) * 0.6; v.z += (Math.random() - .5) * 1.1; } return r; };

  // ---------------- 3) castle folk ----------------
  const ROLES = ['guard', 'farmer', 'miner', 'hunter', 'cook'];
  const ck = c => c[1] + ',' + c[2];
  const O2 = {tall: 2, door: true};
  const stand = (x, y, z) => okCell(x, y, z, O2);
  const roofed = (x, y, z) => { for (let k = 2; k <= 10; k++) { const b = wb(x, y + k, z); if (b && !BADROOF.has(b) && solid(x, y + k, z)) return true; } return false; };
  const wall = (x, y, z) => { const b = wb(x, y, z); return b && !BADROOF.has(b) && solid(x, y, z) && !isDoor(b) && b !== T.BED; };
  function groundY(x, z) { for (let y = H - 3; y > 2; y--) { const b = wb(x, y, z); if (b && b !== T.LEAVES && b !== T.LOG && solid(x, y, z)) return y + 1; if (b === T.WATER) return y + 1; } return SEA; }
  function access(x, y, z) { for (const [ax, az] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) if (stand(x + ax, y, z + az)) return [x + ax, y, z + az]; for (const [ax, az] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) if (stand(x + ax, y - 1, z + az)) return [x + ax, y - 1, z + az]; return null; }
  function nearDoor(x, y, z, r) { for (let ax = -r; ax <= r; ax++) for (let az = -r; az <= r; az++) for (let k = -1; k <= 2; k++) if (isDoor(wb(x + ax, y + k, z + az))) return true; return false; }
  function placeBlock(x, y, z, v, meta) { world[idx(x, y, z)] = v; if (meta) entMeta.set(keyOf(x, y, z), meta); markDirty(x, z); try { if (typeof placedSet !== 'undefined') placedSet.delete(idx(x, y, z)); } catch (_) {} }
  function castleInfo(c) {
    const k = ck(c); let ci = C78.castles.get(k); if (ci) return ci;
    const cx = c[1], cz = c[2], S = 18;
    const hs = []; for (let i = 0; i < 16; i++) { const an = i / 16 * 6.283, x = Math.round(cx + Math.sin(an) * (S + 3)), z = Math.round(cz + Math.cos(an) * (S + 3)); if (x > 2 && z > 2 && x < W - 3 && z < D - 3) hs.push(groundY(x, z)); }
    hs.sort((p, q) => p - q); const gy = hs.length ? hs[hs.length >> 1] : SEA + 2;
    ci = {k, c, cx, cz, gy, S, yard: [], indoor: [], chests: [], beds: [], furn: null, table: null, farm: [], ores: [], oreScanX: null, oreAt: 0, bad: new Set(), dead: {}};
    // walkable cells of the castle
    for (let x = cx - S; x <= cx + S; x++) for (let z = cz - S; z <= cz + S; z++) for (let y = gy - 3; y <= gy + 14; y++) {
      if (!stand(x, y, z) || isDoor(wb(x, y, z))) continue;
      const r = roofed(x, y, z); if (r) ci.indoor.push([x, y, z]); if (Math.abs(y - gy) <= 2) ci.yard.push([x, y, z, r ? 1 : 0]);
    }
    for (const [key] of chests) { const [x, y, z] = key.split(',').map(Number); if (Math.abs(x - cx) <= S && Math.abs(z - cz) <= S && y > gy - 6 && y < gy + 20) { const a = access(x, y, z); if (a) ci.chests.push({k: key, x, y, z, a}); } }
    ci.chests.sort((p, q) => Math.abs(p.y - gy) - Math.abs(q.y - gy));
    const sv = C78.saved[k] || (C78.saved[k] = {});
    if (!sv.made) { sv.made = 1; furnish(ci, sv); }
    for (const b of sv.beds || []) ci.beds.push({x: b[0], y: b[1], z: b[2], f: b[3], a: b[4] || access(b[0], b[1], b[2])});
    if (sv.furn) ci.furn = {x: sv.furn[0], y: sv.furn[1], z: sv.furn[2], a: access(sv.furn[0], sv.furn[1], sv.furn[2])};
    if (sv.table) ci.table = {x: sv.table[0], y: sv.table[1], z: sv.table[2], a: access(sv.table[0], sv.table[1], sv.table[2])};
    if (!ci.furn || !ci.table) for (let x = cx - S; x <= cx + S; x++) for (let z = cz - S; z <= cz + S; z++) for (let y = gy - 3; y <= gy + 14; y++) {
      const b = wb(x, y, z); if (b === T.FURNACE && !ci.furn) { const a = access(x, y, z); if (a) ci.furn = {x, y, z, a}; } if (b === T.TABLE && !ci.table) { const a = access(x, y, z); if (a) ci.table = {x, y, z, a}; } }
    ci.farm = (sv.farm || []).map(q => q.slice());
    if (!sv.farm) { ci.farm = findFarm(ci); sv.farm = ci.farm.map(q => q.slice()); }
    C78.castles.set(k, ci); return ci;
  }
  // beds (one per person), a furnace and a crafting table, placed once into empty floor inside the castle
  function furnish(ci, sv) {
    const {gy} = ci, used = new Set(), K = (x, y, z) => x + ',' + y + ',' + z;
    const roomSize = (x, y, z) => { let n = 0; for (let ax = -3; ax <= 3; ax++) for (let az = -3; az <= 3; az++) if (stand(x + ax, y, z + az) && roofed(x + ax, y, z + az)) n++; return n; };
    const taken = (x, y, z) => { for (let ax = -1; ax <= 1; ax++) for (let az = -1; az <= 1; az++) if (used.has(K(x + ax, y, z + az))) return true; return false; };
    const free = (x, y, z) => wb(x, y, z) === T.AIR && wb(x, y + 1, z) === T.AIR && !(typeof placedSet !== 'undefined' && placedSet.has(idx(x, y - 1, z)));
    const cand = [];
    for (const [x, y, z] of ci.indoor) {
      if (!free(x, y, z) || nearDoor(x, y, z, 2) || (wb(x, y - 1, z) >= 160 && wb(x, y - 1, z) <= 170)) continue;
      for (let f = 0; f < 4; f++) {
        const s = Math.round(Math.sin(f * Math.PI / 2)), c = Math.round(Math.cos(f * Math.PI / 2)), hx = x - s, hz = z - c;   // head = foot - (s, c)
        if (!free(hx, y, hz) || !stand(hx, y, hz) || !roofed(hx, y, hz) || !wall(hx - s, y, hz - c) || nearDoor(hx, y, hz, 2)) continue;
        if (!stand(x + s, y, z + c)) continue;   // room to stand at the foot end
        const side = (wall(x + c, y, z - s) && wall(hx + c, y, hz - s)) || (wall(x - c, y, z + s) && wall(hx - c, y, hz + s));
        cand.push({x, y, z, f, hx, hz, a: [x + s, y, z + c], sc: roomSize(x, y, z) * 2 - Math.abs(y - gy) * 6 + (side ? 6 : 0) + Math.random()});
      }
    }
    cand.sort((p, q) => q.sc - p.sc);
    sv.beds = [];
    for (const b of cand) {
      if (sv.beds.length >= ROLES.length) break;
      if (taken(b.x, b.y, b.z) || taken(b.hx, b.y, b.hz) || used.has(K(b.a[0], b.y, b.a[2]))) continue;
      placeBlock(b.x, b.y, b.z, T.BED, {face: b.f, bed: 'foot'}); placeBlock(b.hx, b.y, b.hz, T.BED, {face: b.f, bed: 'head'});
      try { refreshBedsNear(b.x, b.y, b.z); refreshBedsNear(b.hx, b.y, b.hz); } catch (_) {}
      for (const q of [[b.x, b.z], [b.hx, b.hz], [b.a[0], b.a[2]]]) used.add(K(q[0], b.y, q[1]));
      sv.beds.push([b.x, b.y, b.z, b.f, b.a]);
    }
    // kitchen: furnace + table side by side against a wall, near the castle chest when there is one
    let hasF = false, hasT = false;
    for (let x = ci.cx - ci.S; x <= ci.cx + ci.S && !(hasF && hasT); x++) for (let z = ci.cz - ci.S; z <= ci.cz + ci.S; z++) for (let y = gy - 3; y <= gy + 14; y++) { const b = wb(x, y, z); if (b === T.FURNACE) hasF = true; if (b === T.TABLE) hasT = true; }
    if (hasF && hasT) return;
    const ch = ci.chests[0];
    let bestK = null, bs = -1e9;
    for (const [x, y, z] of ci.indoor) {
      if (!free(x, y, z) || taken(x, y, z) || nearDoor(x, y, z, 1)) continue;
      for (let f = 0; f < 4; f++) {
        const s = Math.round(Math.sin(f * Math.PI / 2)), c = Math.round(Math.cos(f * Math.PI / 2));
        if (!wall(x - s, y, z - c)) continue;   // wall behind
        const x2 = x + c, z2 = z - s;          // neighbour along the wall
        if (!free(x2, y, z2) || !stand(x2, y, z2) || taken(x2, y, z2) || !wall(x2 - s, y, z2 - c) || nearDoor(x2, y, z2, 1)) continue;
        if (!stand(x + s, y, z + c) || !stand(x2 + s, y, z2 + c)) continue;
        const sc = (ch ? -Math.hypot(x - ch.x, z - ch.z) - Math.abs(y - ch.y) * 3 : 0) - Math.abs(y - gy) * 4 + roomSize(x, y, z) * 0.5 + Math.random();
        if (sc > bs) { bs = sc; bestK = {x, y, z, x2, z2, f}; }
      }
    }
    if (!bestK) return;
    const b = bestK;
    if (!hasF) { placeBlock(b.x, b.y, b.z, T.FURNACE, {face: (b.f + 2) % 4}); try { furnData(keyOf(b.x, b.y, b.z)); } catch (_) {} sv.furn = [b.x, b.y, b.z]; used.add(K(b.x, b.y, b.z)); }
    if (!hasT) { placeBlock(b.x2, b.y, b.z2, T.TABLE, null); sv.table = [b.x2, b.y, b.z2]; }
  }
  // a small wheat field outside the walls on flat natural grass
  function findFarm(ci) {
    const {cx, cz, S} = ci, rr = S + 3;
    for (let ring = rr; ring <= rr + 14; ring += 2) for (let i = 0; i < 24; i++) {
      const an = i / 24 * 6.283, x0 = Math.round(cx + Math.sin(an) * ring) - 2, z0 = Math.round(cz + Math.cos(an) * ring) - 2;
      if (x0 < 4 || z0 < 4 || x0 + 5 >= W - 4 || z0 + 5 >= D - 4) continue;
      let h = null, ok = true;
      for (let x = x0; x < x0 + 5 && ok; x++) for (let z = z0; z < z0 + 4 && ok; z++) {
        if (Math.max(Math.abs(x - cx), Math.abs(z - cz)) < S + 1) { ok = false; break; }
        const t = groundY(x, z), top = wb(x, t - 1, z), up = wb(x, t, z);
        if (h === null) h = t; if (t !== h || (top !== T.GRASS && top !== T.DIRT) || (up && PLANT[up] !== 1) || wb(x, t + 1, z)) ok = false;
        if (ok && typeof placedSet !== 'undefined' && (placedSet.has(idx(x, t - 1, z)) || placedSet.has(idx(x, t, z)))) ok = false;
      }
      if (ok && h !== null && Math.abs(h - ci.gy) <= 6) { const out = []; for (let x = x0; x < x0 + 5; x++) for (let z = z0; z < z0 + 4; z++) out.push([x, h, z]); return out; }
    }
    return [];
  }
  const ORES = new Set(Object.keys(NAMES).map(Number).filter(id => id > 0 && id < 256 && /ore$/i.test(NAMES[id] || '') && id !== T.COBALTORE));
  function oreScanStep(ci) {   // a few columns per frame so the phone never stalls
    if (ci.oreScanX === null) { if (performance.now() - ci.oreAt < 180000 && ci.oreAt) return; ci.oreScanX = ci.cx - 34; ci.oreNew = []; }
    const top = ci.gy - 3;
    for (let n = 0; n < 4 && ci.oreScanX <= ci.cx + 34; n++, ci.oreScanX++) {
      const x = ci.oreScanX; if (x < 3 || x >= W - 3) continue;
      for (let z = Math.max(3, ci.cz - 34); z <= Math.min(D - 4, ci.cz + 34); z++) for (let y = 4; y < top; y++) {
        const b = world[(x * H + y) * D + z]; if (!ORES.has(b) || ci.bad.has(idx(x, y, z))) continue;
        for (const [ax, ay, az] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [1, -1, 0], [-1, -1, 0], [0, -1, 1], [0, -1, -1]]) {
          const sx = x + ax, sy = y + ay, sz = z + az; if (stand(sx, sy, sz) && groundY(sx, sz) > sy + 3) { ci.oreNew.push([x, y, z, sx, sy, sz]); break; } }
      }
    }
    if (ci.oreScanX > ci.cx + 34) { ci.ores = ci.oreNew; ci.oreNew = null; ci.oreScanX = null; ci.oreAt = performance.now(); }
  }
  // ---- chests ----
  function chestAdd(k, id, n) { const ch = chests.get(k); if (!ch) return n; for (const s of ch.slots) if (s && s[0] === id && s[1] < 64) { const t = Math.min(n, 64 - s[1]); s[1] += t; n -= t; if (!n) break; }
    for (let i = 0; i < ch.slots.length && n > 0; i++) if (!ch.slots[i]) { const t = Math.min(n, 64); ch.slots[i] = [id, t]; n -= t; }
    try { if (openChestKey === k) renderChest(); } catch (_) {} return n; }
  function chestTake(k, ids, n) { const ch = chests.get(k); if (!ch) return null; for (const id of ids) for (let i = 0; i < ch.slots.length; i++) { const s = ch.slots[i]; if (s && s[0] === id) { const t = Math.min(n, s[1]); s[1] -= t; if (!s[1]) ch.slots[i] = null; try { if (openChestKey === k) renderChest(); } catch (_) {} return [id, t]; } } return null; }
  function chestCount(k, id) { const ch = chests.get(k); let n = 0; if (ch) for (const s of ch.slots) if (s && s[0] === id) n += s[1]; return n; }
  const FOODS = [IT.BREAD, IT.COOKEDMUTTON, IT.COOKEDPORK, IT.BAKEDPOTATO, IT.COOKEDHAGGIS].filter(v => v !== undefined);
  const RAW = [IT.MUTTON, IT.PORK, IT.HAGGIS, IT.POTATO].filter(v => v !== undefined && SMELT[v] !== undefined);
  // ---- doors: folk open them as they walk through and close them behind ----
  function doors(a) {
    if (!a.path) return; const p = a.g.position, now = performance.now();
    for (let i = 0; i < Math.min(2, a.path.length); i++) { const w = a.path[i];
      for (let k = 0; k < 2; k++) { const b = wb(w[0], w[1] + k, w[2]); if (!isDoor(b)) continue; const ly = b === T.DOORTOP ? w[1] + k - 1 : w[1] + k, key = keyOf(w[0], ly, w[2]);
        if (!doorState.get(key) && Math.hypot(w[0] + .5 - p.x, w[2] + .5 - p.z) < 1.9) { doorState.set(key, true); C78.doors.push({key, x: w[0], y: ly, z: w[2], t: now}); try { sfx3d('doorOpen', p, 10); } catch (_) {} }
        break; } }
  }
  function closeDoors() {
    const now = performance.now();
    for (let i = C78.doors.length - 1; i >= 0; i--) { const d = C78.doors[i]; if (now - d.t < 1800) continue;
      const busy = mobs.some(m => m.kind === 'clansman' && Math.hypot(m.g.position.x - d.x - .5, m.g.position.z - d.z - .5) < 1.4) || (Math.hypot(P.x - d.x - .5, P.z - d.z - .5) < 1.3 && Math.abs(P.y - d.y) < 2);
      if (busy) { d.t = now - 1000; continue; }
      if (doorState.get(d.key)) { doorState.set(d.key, false); try { sfx3d('doorClose', {x: d.x + .5, y: d.y, z: d.z + .5}, 10); } catch (_) {} }
      C78.doors.splice(i, 1); }
  }
  // ---- models: tools in hand ----
  function toolMesh(kind) {
    const g = new THREE.Group(), wood = new THREE.MeshLambertMaterial({color: 0x7a5a32}), iron = new THREE.MeshLambertMaterial({color: 0xc8ccd2});
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.05), wood); h.position.y = 0.25; g.add(h);
    if (kind === 'pick') { const hd = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.5), iron); hd.position.set(0, 0.58, 0); g.add(hd); }
    else { const hd = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.24), iron); hd.position.set(0, 0.6, 0.1); g.add(hd); }
    g.position.set(0, -0.62, 0.04); g.rotation.x = 1.35; g.userData.mats = [wood, iron]; return g;
  }
  const mc = makeClansman;
  makeClansman = function () {
    const o = mc.apply(this, arguments), R = o.arms[1], L = o.arms[0];
    const wrap = (arm, pick) => { const m = arm.children.find(pick); if (!m) return null; const g = new THREE.Group(); arm.remove(m); g.add(m); arm.add(g); return g; };
    o.swordG = wrap(R, c => c.isMesh && c.geometry && c.geometry.parameters && c.geometry.parameters.height === 0.9);
    o.shieldG = wrap(L, c => c.isMesh && c.geometry && c.geometry.type === 'CylinderGeometry');
    o.pickG = toolMesh('pick'); o.hoeG = toolMesh('hoe'); R.add(o.pickG); R.add(o.hoeG); o.pickG.visible = o.hoeG.visible = false;
    o.mats.push(...o.pickG.userData.mats, ...o.hoeG.userData.mats);
    return o;
  };
  function setTools(a) {
    const r = a.role; if (a.swordG) a.swordG.visible = r === 'guard' || r === 'hunter'; if (a.shieldG) a.shieldG.visible = r === 'guard';
    if (a.pickG) a.pickG.visible = r === 'miner'; if (a.hoeG) a.hoeG.visible = r === 'farmer';
  }
  // ---- spawning: one of each trade per friendly castle, near you ----
  function spawnFolk(ci, role) {
    const i = ROLES.indexOf(role), bed = ci.beds[i];
    let spot = null;
    if (isNight && bed) spot = bed.a || [bed.x, bed.y, bed.z];
    else { const pool = ci.yard.length ? ci.yard : ci.indoor; for (let t = 0; t < 30 && pool.length; t++) { const q = pool[Math.floor(Math.random() * pool.length)]; if (Math.hypot(q[0] - P.x, q[2] - P.z) > 10) { spot = q; break; } } }
    if (!spot) return null;
    const [x, y, z] = spot;
    window.__egg = true; window.__eggSpot = [x + .5, y, z + .5, x, z]; let m = null;
    try { m = spawnMob('clansman'); } finally { window.__egg = false; window.__eggSpot = null; }
    if (!m) return null;
    m.g.position.set(x + .5, y, z + .5); m.home = [ci.cx, ci.cz]; m.ci = ci; m.shaded = true; m.role = role; m.bedIdx = i; m.tall = 2; m.pathLimit = 600;
    m.g.rotation.order = 'YXZ'; m.food = 12 + Math.random() * 8; m.bag = []; m.thinkT = Math.random() * 0.5; m.glanceCd = 3 + Math.random() * 6;
    setTools(m);
    if (isNight && bed) lieDown(m, bed);
    return m;
  }
  function manage() {
    if (DIM.cur || genVer !== GEN9 || typeof g9castles === 'undefined' || !g9castles || !started) return;
    let made = 0;
    for (const c of g9castles) {
      if (!castleFriendly(c)) continue;
      const d = Math.hypot(P.x - c[1], P.z - c[2]);
      const mine = mobs.filter(m => m.kind === 'clansman' && m.home && m.home[0] === c[1] && m.home[1] === c[2]);
      if (d > 112) { mine.forEach(m => removeMob(m)); continue; }
      if (d > 76) continue;
      const ci = castleInfo(c);
      for (const m of mine) if (!m.role) { m.role = ROLES.find(r => !mine.some(o => o.role === r)) || 'guard'; m.bedIdx = ROLES.indexOf(m.role); m.ci = ci; m.tall = 2; m.g.rotation.order = 'YXZ'; m.bag = []; setTools(m); }
      for (const role of ROLES) {
        if (made >= 2 || mine.some(m => m.role === role)) continue;
        const died = ci.dead[role]; if (died && (performance.now() - died < 150000 || d < 40)) continue;
        if (spawnFolk(ci, role)) made++;
      }
    }
  }
  // ---- sleeping ----
  function lieDown(a, bed) {
    const p = a.g.position, s = Math.round(Math.sin(bed.f * Math.PI / 2)), c = Math.round(Math.cos(bed.f * Math.PI / 2));
    a.sleeping = true; a.skipPhys = true; a.moving = false; a.path = null; a.kbx = a.kbz = 0; a.vy = 0;
    const onBed = wb(bed.x, bed.y, bed.z) === T.BED;
    p.set(bed.x + .5 + s * 0.45, bed.y + (onBed ? 0.56 : 0) + 0.15, bed.z + .5 + c * 0.45);
    a.ang = a.yawVis = bed.f * Math.PI / 2; a.g.rotation.order = 'YXZ'; a.g.rotation.y = a.ang; a.g.rotation.x = -Math.PI / 2;
    a.job = {type: 'sleep'}; C78.stats.slept++;
  }
  function wake(a) {
    if (!a.sleeping) return; const bed = a.ci && a.ci.beds[a.bedIdx], p = a.g.position;
    a.sleeping = false; a.skipPhys = false; a.g.rotation.x = 0; a.job = null;
    const q = bed && (bed.a || access(bed.x, bed.y, bed.z)); if (q) p.set(q[0] + .5, q[1], q[2] + .5); else p.y += 0.6;
  }
  function sleepSpot(a, ci) {
    const b = ci.beds[a.bedIdx]; if (b && wb(b.x, b.y, b.z) === T.BED) return b;
    if (!a.floorBed && ci.indoor.length) { const q = ci.indoor[(a.bedIdx * 37 + 11) % ci.indoor.length]; a.floorBed = {x: q[0], y: q[1], z: q[2], f: a.bedIdx % 4, a: [q[0], q[1], q[2]]}; }
    return a.floorBed || null;
  }
  // ---- helpers ----
  function hostileNear(a, r) { const p = a.g.position; let best = null, bd = r; for (const m of mobs) { if (!m.hostile || m.kind === 'clansman' || !(m.hp > 0)) continue; const d = Math.hypot(m.g.position.x - p.x, m.g.position.z - p.z); if (d < bd && Math.abs(m.g.position.y - p.y) < 4) { bd = d; best = m; } } return best; }
  function goTo(a, tx, ty, tz, spd, dt) {
    const p = a.g.position, d = Math.hypot(tx + .5 - p.x, tz + .5 - p.z);
    if (d < 0.55 && Math.abs(ty - p.y) < 1.3) return true;
    const an = pathAngle(a, tx + .5, tz + .5, ty);
    if (an === null) {
      a.goFail = (a.goFail || 0) + dt;
      // no path for a while: walk straight at it (with a hop) instead of standing frozen
      if (a.goFail > 2.5) { a.ang = Math.atan2(tx + .5 - p.x, tz + .5 - p.z); if (stepMob(a, spd * 0.8, dt, false) === false && a.onGround) { a.vy = 6.6; a.onGround = false; } a.moving = true; a.curSpd = spd * 0.8; }
      return false; }
    a.ang = an; doors(a); stepMob(a, spd, dt, false); a.moving = true; a.curSpd = spd; return false;
  }
  const face = (a, x, z) => { const p = a.g.position; a.ang = Math.atan2(x + .5 - p.x, z + .5 - p.z); };
  function bagAdd(a, id, n) { const s = a.bag.find(q => q[0] === id); if (s) s[1] += n; else a.bag.push([id, n]); }
  const bagN = a => a.bag.reduce((s, q) => s + q[1], 0);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function planJob(a, ci) {
    const p = a.g.position, ch = ci.chests[0];
    const idle = (pool, wait) => { const q = pick(pool && pool.length ? pool : ci.yard.length ? ci.yard : ci.indoor); return q ? {type: 'walk', x: q[0], y: q[1], z: q[2], wait: wait || 2 + Math.random() * 4, ph: 'go'} : {type: 'wait', t: 3}; };
    switch (a.role) {
      case 'guard': return idle(ci.yard.filter(q => !q[3]), 3 + Math.random() * 5);
      case 'miner': {
        if (bagN(a) >= 3 && ch) return {type: 'deposit', ph: 'go'};
        if ((a.mineCd || 0) > 0 || !ci.ores.length) return Math.random() < 0.5 ? idle(null) : {type: 'wait', t: 3 + Math.random() * 3};
        const near = ci.ores.filter(o => !ci.bad.has(idx(o[0], o[1], o[2])) && ORES.has(wb(o[0], o[1], o[2]))).sort((p1, p2) => Math.hypot(p1[0] - p.x, p1[2] - p.z) - Math.hypot(p2[0] - p.x, p2[2] - p.z)).slice(0, 6);
        if (!near.length) return idle(null);
        const o = pick(near); return {type: 'mine', o, ph: 'go', t: 0};
      }
      case 'farmer': {
        const wheat = (a.bag.find(q => q[0] === IT.WHEAT) || [0, 0])[1];
        if (wheat >= 3 && ci.table) return {type: 'bake', ph: 'go'};
        if (bagN(a) >= 4 && ch) return {type: 'deposit', ph: 'go'};
        let best = null, bs = -1e9;
        for (const q of ci.farm) { const [x, y, z] = q, below = wb(x, y - 1, z), here = wb(x, y, z); let w = 0;
          if (here === T.WHEAT3) w = 3; else if ((below === T.GRASS || below === T.DIRT) && (!here || PLANT[here] === 1) && !(here >= T.WHEAT0 && here <= T.WHEAT3)) w = 2; else if (below === T.FARM && !here) w = 1.5; else continue;
          const sc = w * 4 - Math.hypot(x - p.x, z - p.z) * 0.3; if (sc > bs) { bs = sc; best = q; } }
        if (best) return {type: 'farm', q: best, ph: 'go'};
        return ci.farm.length ? idle(ci.farm.map(q => [q[0], q[1], q[2]]), 4 + Math.random() * 4) : idle(null);
      }
      case 'hunter': {
        if (bagN(a) >= 1 && ch) return {type: 'deposit', ph: 'go'};
        if ((a.huntCd || 0) <= 0) {
          let t = null, td = 34;
          for (const m of mobs) { if ((m.kind !== 'sheep' && m.kind !== 'pig' && m.kind !== 'haggis') || m.named || m.tame || m.tamed || m.owner || m.leash || !(m.hp > 0)) continue;
            const d = Math.hypot(m.g.position.x - ci.cx, m.g.position.z - ci.cz); if (d < td && Math.hypot(m.g.position.x - P.x, m.g.position.z - P.z) > 6) { td = d; t = m; } }
          if (t) return {type: 'hunt', m: t, t: 0};
        }
        return idle(ci.yard.filter(q => !q[3]));
      }
      case 'cook': {
        if (ci.furn && ci.furn.a) return {type: 'cook', ph: 'furn', t: 0};
        return idle(ci.indoor);
      }
    }
    return idle(null);
  }
  function think(a, ci) {
    if (a.sleeping) { if (!isNight || a.mad > 0 || (a.role === 'guard' && hostileNear(a, 6))) wake(a); else return; }
    const th = (a.mad > 0 && !dead) ? 'player' : hostileNear(a, a.role === 'guard' ? 16 : 3);
    if (th && (th === 'player' || a.role !== 'guard' || Math.hypot(th.g.position.x - ci.cx, th.g.position.z - ci.cz) < ci.S + 26)) { if (!a.job || a.job.type !== 'fight' || a.job.m !== th) a.job = {type: 'fight', m: th}; return; }
    if (a.job && a.job.type === 'fight') a.job = null;
    if (isNight) { if (!a.job || a.job.type !== 'bed') a.job = {type: 'bed', t: 0}; return; }
    if (a.job && a.job.type === 'bed') a.job = null;
    if (a.food < 6 && (!a.job || a.job.type !== 'eat')) { a.job = {type: 'eat', ph: ci.chests[0] ? 'go' : 'eat', t: 0}; return; }
    if (!a.job || a.job.done) a.job = planJob(a, ci);
  }
  function act(a, ci, dt) {
    const j = a.job, p = a.g.position; if (!j) return;
    a.act = null;
    const ch = ci.chests[0];
    switch (j.type) {
      case 'wait': j.t -= dt; if (j.t <= 0) j.done = true; break;
      case 'walk':
        if (j.ph === 'go') { if (goTo(a, j.x, j.y, j.z, 1.5, dt) || (a.goFail || 0) > 6) { j.ph = 'wait'; a.goFail = 0; } }
        else { j.wait -= dt; if (a.role === 'guard') a.act = 'guard'; if (j.wait <= 0) j.done = true; }
        break;
      case 'fight': {
        const m = j.m, tp = m === 'player' ? P : m.g.position;
        if (m !== 'player' && (!mobs.includes(m) || !(m.hp > 0))) { j.done = true; a.job = null; break; }
        const td = Math.hypot(tp.x - p.x, tp.z - p.z);
        if (td > 1.7) goTo(a, Math.floor(tp.x), Math.floor(tp.y + 0.05), Math.floor(tp.z), 3.4, dt); else face(a, tp.x - .5, tp.z - .5);
        a.act = 'fight';
        if (td < 2.1 && Math.abs(tp.y - p.y) < 2 && a.cd <= 0) { a.cd = 0.9; a.swingT = 0.4; try { sfx3d('swoosh', p, 12); } catch (_) {}
          if (m === 'player') hurt(4, 'A clansman taught you some manners.'); else damageMob(m, 5, false); }
        break; }
      case 'bed': {
        const b = sleepSpot(a, ci); if (!b) { a.act = null; break; }
        j.t += dt; const q = b.a || [b.x, b.y, b.z];
        const arrived = goTo(a, q[0], q[1], q[2], 1.6, dt);
        if (arrived || Math.hypot(b.x + .5 - p.x, b.z + .5 - p.z) < 1.2 || (j.t > 35 && Math.hypot(P.x - p.x, P.z - p.z) > 18) || j.t > 90) lieDown(a, b);
        break; }
      case 'eat': {
        if (j.ph === 'go') { if (goTo(a, ch.a[0], ch.a[1], ch.a[2], 1.6, dt) || (a.goFail || 0) > 8) { a.goFail = 0; face(a, ch.x, ch.z); chestTake(ch.k, FOODS, 1); j.ph = 'eat'; j.t = 0; } }
        else { j.t += dt; a.act = 'eat'; if (Math.random() < dt * 5) burst(p.x + Math.sin(a.yawVis) * 0.3, p.y + 1.6, p.z + Math.cos(a.yawVis) * 0.3, 0xc89a50, 1, 0.3);
          if (j.t > 2.2) { a.food = 20; j.done = true; C78.stats.ate++; try { sfx3d('eat', p, 8); } catch (_) {} } }
        break; }
      case 'deposit': {
        if (!ch) { a.bag = []; j.done = true; break; }
        if (goTo(a, ch.a[0], ch.a[1], ch.a[2], 1.6, dt) || (a.goFail || 0) > 8) { a.goFail = 0; face(a, ch.x, ch.z); for (const [id, n] of a.bag) chestAdd(ch.k, id, n); a.bag = []; a.swingT = 0.35; j.done = true; try { sfx3d('chestOpen', p, 8); } catch (_) {} }
        break; }
      case 'mine': {
        const o = j.o, oi = idx(o[0], o[1], o[2]);
        if (!ORES.has(wb(o[0], o[1], o[2])) || (typeof placedSet !== 'undefined' && placedSet.has(oi))) { j.done = true; break; }
        if (j.ph === 'go') { a.pathLimit = 2600; const ok = goTo(a, o[3], o[4], o[5], 1.6, dt); a.pathLimit = 600;
          if (ok) { j.ph = 'dig'; j.t = 0; } else if ((a.goFail || 0) > 5 || (a.pathFails || 0) > 3) { ci.bad.add(oi); a.goFail = 0; a.pathFails = 0; j.done = true; } }
        else { face(a, o[0], o[2]); a.act = 'dig'; j.t += dt;
          if (Math.random() < dt * 3) { burst(o[0] + .5, o[1] + .5, o[2] + .5, 0x8a8a8a, 2, 0.4); try { sfx3d('dig', p, 10); } catch (_) {} }
          if (j.t > 3.2) { for (const [id, n] of dropsFor(wb(o[0], o[1], o[2]))) bagAdd(a, id, n); placeBlock(o[0], o[1], o[2], T.AIR); C78.stats.mined++; a.mineCd = 14 + Math.random() * 10; j.done = true; } }
        break; }
      case 'farm': {
        const [x, y, z] = j.q;
        if (j.ph === 'go') { if (goTo(a, x, y, z, 1.4, dt) || Math.hypot(x + .5 - p.x, z + .5 - p.z) < 1.3 || (a.goFail || 0) > 6) { a.goFail = 0; j.ph = 'work'; j.t = 0; } }
        else { face(a, x, z); a.act = 'hoe'; j.t += dt;
          if (j.t > 1.3) { const below = wb(x, y - 1, z), here = wb(x, y, z), K = keyOf(x, y, z);
            if (here === T.WHEAT3) { placeBlock(x, y, z, T.WHEAT0); crops.set(K, {t: 25 + Math.random() * 20}); bagAdd(a, IT.WHEAT, 1); burst(x + .5, y + .4, z + .5, 0xd8b840, 4, 0.4); }
            else if ((below === T.GRASS || below === T.DIRT) && (!here || PLANT[here] === 1)) { if (here) placeBlock(x, y, z, T.AIR); placeBlock(x, y - 1, z, T.FARM); burst(x + .5, y, z + .5, 0x6a4a2a, 4, 0.4); }
            else if (below === T.FARM && !here) { placeBlock(x, y, z, T.WHEAT0); crops.set(K, {t: 25 + Math.random() * 20}); }
            try { sfx3d('dig', p, 10); } catch (_) {} C78.stats.farmed++; j.done = true; } }
        break; }
      case 'bake': {
        const t = ci.table; if (!t || !t.a) { j.done = true; break; }
        if (j.ph === 'go') { if (goTo(a, t.a[0], t.a[1], t.a[2], 1.6, dt) || (a.goFail || 0) > 8) { a.goFail = 0; j.ph = 'work'; j.t = 0; } }
        else { face(a, t.x, t.z); a.act = 'cook'; j.t += dt; if (j.t > 2) { const s = a.bag.find(q => q[0] === IT.WHEAT); if (s) { const n = Math.floor(s[1] / 3); s[1] -= n * 3; if (n) bagAdd(a, IT.BREAD, n); a.bag = a.bag.filter(q => q[1] > 0); } j.done = true; } }
        break; }
      case 'hunt': {
        const m = j.m; j.t += dt;
        if (!mobs.includes(m) || !(m.hp > 0) || j.t > 30) { a.huntCd = 20; j.done = true; break; }
        const tp = m.g.position, td = Math.hypot(tp.x - p.x, tp.z - p.z);
        if (td > 1.6) goTo(a, Math.floor(tp.x), Math.floor(tp.y + 0.05), Math.floor(tp.z), 3.0, dt); else face(a, tp.x - .5, tp.z - .5);
        a.act = 'fight';
        if (td < 2.0 && a.cd <= 0) { a.cd = 0.8; a.swingT = 0.4; try { sfx3d('swoosh', p, 12); } catch (_) {}
          if (m.hp <= 5) { const meat = m.kind === 'pig' ? IT.PORK : m.kind === 'haggis' ? IT.HAGGIS : IT.MUTTON; burst(tp.x, tp.y + .6, tp.z, 0xb03020, 10, 0.6); removeMob(m); bagAdd(a, meat, m.kind === 'sheep' ? 2 : 1); C78.stats.hunted++; a.huntCd = 70 + Math.random() * 40; j.done = true; }
          else damageMob(m, 5, false); }
        break; }
      case 'cook': {
        const f = ci.furn, tb = ci.table;
        if (j.ph === 'furn') {
          if (goTo(a, f.a[0], f.a[1], f.a[2], 1.5, dt) || (a.goFail || 0) > 8) { a.goFail = 0; j.ph = 'fwork'; j.t = 0; }
        } else if (j.ph === 'fwork') { face(a, f.x, f.z); a.act = 'cook'; j.t += dt;
          if (Math.random() < dt * 3) burst(f.x + .5, f.y + 1.1, f.z + .5, 0x8a8a8a, 1, 0.3);
          if (j.t > 3) { const fd = furnData(keyOf(f.x, f.y, f.z));
            if (fd.out && ch) { const left = chestAdd(ch.k, fd.out[0], fd.out[1]); fd.out = left ? [fd.out[0], left] : null; C78.stats.cooked++; }
            if (!fd.inp && ch) { const r = chestTake(ch.k, RAW, 4); if (r) fd.inp = r; }
            if (fd.inp && !fd.fuel && !(fd.burn > 0)) { const r = ch && chestTake(ch.k, [IT.COAL, IT.CHARCOAL], 1); fd.fuel = r || [T.PLANKS, 2]; }
            j.ph = tb && tb.a ? 'table' : 'rest'; j.t = 0; } }
        else if (j.ph === 'table') { if (goTo(a, tb.a[0], tb.a[1], tb.a[2], 1.5, dt) || (a.goFail || 0) > 8) { a.goFail = 0; j.ph = 'twork'; j.t = 0; } }
        else if (j.ph === 'twork') { face(a, tb.x, tb.z); a.act = 'cook'; j.t += dt;
          if (j.t > 2.5) { if (ch && chestCount(ch.k, IT.WHEAT) >= 3) { chestTake(ch.k, [IT.WHEAT], 3); chestAdd(ch.k, IT.BREAD, 1); C78.stats.cooked++; } j.ph = 'rest'; j.t = 0; } }
        else { j.t += dt; if (j.t > 6 + Math.random() * 6) j.done = true; }
        break; }
      case 'sleep': break;
    }
  }
  function animate(a, dt, dist) {
    const now = performance.now() / 1000;
    a.swA = (a.swA || 0) + ((a.moving ? 1 : 0) - (a.swA || 0)) * Math.min(1, dt * 8);
    a.walk = (a.walk || 0) + dt * (a.curSpd || 0) * 3.3;
    const sw = Math.sin(a.walk) * 0.62 * a.swA, L = a.arms[0], R = a.arms[1], hd = a.head;
    if (a.sleeping) { a.legs.forEach(l => { l.rotation.x = 0; }); L.rotation.set(0, 0, -0.06); R.rotation.set(0, 0, 0.06); if (hd) hd.rotation.set(0, 0, 0); a.g.scale.y = 1;
      if (Math.random() < dt * 0.4 && dist < 20) burst(a.g.position.x, a.g.position.y + 0.6, a.g.position.z, 0xffffff, 1, 0.15); return; }
    a.legs[0].rotation.x = sw; a.legs[1].rotation.x = -sw;
    let la = -sw * 0.8, ra = sw * 0.8, lz = -0.05, rz = 0.05;
    if (a.swingT > 0) { a.swingT -= dt; const k = 1 - a.swingT / 0.4; ra = k < 0.35 ? -2.7 * (k / 0.35) : -2.7 + (k - 0.35) / 0.65 * 2.4; }
    else if (a.act === 'dig') { const k = (now * 1.6) % 1; ra = k < 0.55 ? -2.5 * (k / 0.55) : -2.5 + (k - 0.55) / 0.45 * 2.1; }
    else if (a.act === 'hoe') { const k = (now * 1.4) % 1; ra = k < 0.5 ? -1.9 * (k / 0.5) : -1.9 + (k - 0.5) / 0.5 * 1.5; la = ra * 0.6; }
    else if (a.act === 'cook') { ra = -1.0 + Math.sin(now * 7) * 0.18; la = -0.9 - Math.sin(now * 7) * 0.12; }
    else if (a.act === 'eat') { ra = -2.1 + Math.sin(now * 14) * 0.12; rz = -0.35; }
    else if (a.act === 'fight' || a.act === 'guard') { ra = Math.min(ra, -0.45) + sw * 0.2; if (a.role === 'guard') la = -0.6 + sw * 0.15; }
    L.rotation.set(la, 0, lz); R.rotation.set(ra, 0, rz);
    // head: leads the turn when walking, looks down at work, glances at you only briefly when you're close
    a.glanceCd = (a.glanceCd || 0) - dt; if (a.glanceT > 0) a.glanceT -= dt;
    if (dist < 4.5 && a.glanceCd <= 0 && !a.act) { a.glanceT = 1.0 + Math.random() * 0.7; a.glanceCd = 9 + Math.random() * 9; }
    let yaw = 0, pitch = 0;
    const rel = v => { while (v > Math.PI) v -= 6.283; while (v < -Math.PI) v += 6.283; return v; };
    if (a.glanceT > 0 && dist < 7) { const p = a.g.position; yaw = clamp(rel(Math.atan2(P.x - p.x, P.z - p.z) - a.yawVis), -0.9, 0.9); pitch = -clamp(Math.atan2(P.y + 1.5 - p.y - 1.7, Math.max(1, dist)), -0.5, 0.5); }
    else if (a.moving) { yaw = clamp(rel(a.ang - (a.yawVis || 0)), -0.7, 0.7); pitch = 0.08; }
    else if (a.act === 'dig' || a.act === 'hoe' || a.act === 'cook') pitch = 0.45;
    else { a.lookT = (a.lookT || 0) - dt; if (a.lookT <= 0) { a.lookT = 2 + Math.random() * 4; a.lookYaw = (Math.random() - .5) * 1.2; } yaw = a.lookYaw || 0; }
    if (hd) { hd.rotation.y += (yaw - hd.rotation.y) * Math.min(1, dt * 5); hd.rotation.x += (pitch - hd.rotation.x) * Math.min(1, dt * 5); }
  }
  clanAI = function (a, dt) {
    const p = a.g.position; a.flee = 0; a.speed = 0; a.burning = 0;
    if (!a.ci && a.home) { const c = (typeof g9castles !== 'undefined' && g9castles || []).find(q => q[1] === a.home[0] && q[2] === a.home[1]); if (c) { a.ci = castleInfo(c); if (!a.role) { a.role = 'guard'; a.bedIdx = 0; a.bag = []; a.tall = 2; setTools(a); a.g.rotation.order = 'YXZ'; } } }
    const ci = a.ci; if (!ci) return;
    const dist = Math.hypot(P.x - p.x, P.z - p.z), near = dist < 30;
    let tdt = dt;
    if (!near) { a.farT = (a.farT || 0) + dt; if (a.farT < 0.25) return; tdt = Math.min(a.farT, 0.5); a.farT = 0; }
    a.moving = false; a.curSpd = 0;
    if (a.mad > 0) a.mad -= tdt;
    a.cd = (a.cd || 0) - tdt; a.food = (a.food == null ? 16 : a.food) - tdt / 25; a.mineCd = (a.mineCd || 0) - tdt; a.huntCd = (a.huntCd || 0) - tdt;
    a.thinkT = (a.thinkT == null ? Math.random() * 0.4 : a.thinkT) - tdt;
    if (a.thinkT <= 0) { a.thinkT = 0.3 + Math.random() * 0.25; think(a, ci); }
    if (!a.sleeping) act(a, ci, tdt);
    if (!near) { if (!a.sleeping) { const f = floorBelow(Math.floor(p.x), p.y + 1, Math.floor(p.z)); if (Math.abs(f - p.y) < 3) p.y = f; } return; }
    animate(a, dt, dist);
  };
  const dm = damageMob;
  damageMob = function (a, dmg, byPlayer) { if (a && a.kind === 'clansman' && a.sleeping) wake(a); return dm.apply(this, arguments); };
  const km = killMob;
  killMob = function (a) { if (a && a.kind === 'clansman' && a.ci && a.role) a.ci.dead[a.role] = performance.now(); return km.apply(this, arguments); };
  // ---- frame hooks ----
  let spT = 0, doorT = 0;
  const um = updateMobs;
  updateMobs = function (dt) {
    nodeBudget = FRAME_NODES;
    const r = um.apply(this, arguments);
    if (!started) return r;
    spT -= dt; if (spT <= 0) { spT = 2; try { manage(); } catch (e) { console.warn('c78 manage', e); } }
    doorT -= dt; if (doorT <= 0) { doorT = 0.3; closeDoors(); }
    for (const ci of C78.castles.values()) if (Math.hypot(P.x - ci.cx, P.z - ci.cz) < 80) { oreScanStep(ci); break; }
    for (const ci of C78.castles.values()) if (ci.farm.length && Math.random() < dt) for (const q of ci.farm) try { placedSet.delete(idx(q[0], q[1], q[2])); } catch (_) {}
    return r;
  };
  // ---- saves ----
  const se = serialize;
  serialize = function () { const d = se.apply(this, arguments); if (!DIM.cur) d.c78 = C78.saved; return d; };
  const ap = applySave;
  applySave = function (d) { const r = ap.apply(this, arguments); if (d && !d.dim) { C78.saved = d.c78 && typeof d.c78 === 'object' ? d.c78 : {}; C78.castles.clear(); C78.doors.length = 0; } return r; };
  const ew = enterWorld;
  enterWorld = function (save) { if (!save) { C78.saved = {}; C78.castles.clear(); C78.doors.length = 0; } return ew.apply(this, arguments); };
  window.__c78 = () => ({stats: C78.stats, castles: [...C78.castles.values()].map(ci => ({k: ci.k, gy: ci.gy, beds: ci.beds.length, furn: !!ci.furn, table: !!ci.table, chests: ci.chests.length, farm: ci.farm.length, ores: ci.ores.length, yard: ci.yard.length, indoor: ci.indoor.length})),
    folk: mobs.filter(m => m.kind === 'clansman').map(m => ({role: m.role, job: m.job && m.job.type, ph: m.job && m.job.ph, sleeping: !!m.sleeping, food: Math.round(m.food || 0), pos: [m.g.position.x, m.g.position.y, m.g.position.z].map(v => Math.round(v * 10) / 10), bag: m.bag}))});
})();
