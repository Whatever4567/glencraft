/* ===================== GLX-C234 (v1.0.52): castle folk walk for real - 3D voxel A* (2 air above solid ground, 1-block steps and stairs/slabs, drops up to 3, doors and
   gates opened, glass / panes / fences / walls never), routes leave a building by its entrance, 0.3-block clearance so nobody hugs the walls, a proper body box
   against the voxels (same rule as you - nobody walks through a wall ever), no-progress-in-1.5 s -> re-plan around that spot, then pick somewhere else.
   Searches are spread over frames under a node budget and cached per person. ===================== */
(function c234() {
  const U = window.__c234 = {paths: 0, fails: 0, nodes: 0, replans: 0, gaveUp: 0, unembed: 0, reverts: 0, exits: 0, ms: 0, err: null, last: null};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e).slice(0, 400); };
  const LOW = (typeof PERF !== 'undefined' && PERF) || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || '');
  const FRAME = LOW ? 900 : 2600, CAP = LOW ? 4500 : 9000, R = 0.3, HT = 1.8;
  let budget = FRAME;
  const isC = a => a && a.kind === 'clansman' && a.g && a.ci && !a.dead;
  const wb = (x, y, z) => (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) ? 0 : world[(x * H + y) * D + z];
  const GATE = 226, isDoor = b => b === T.DOOR || b === T.DOORTOP, pass = b => isDoor(b) || b === GATE;
  const tall = (x, y, z) => { try { return !!(window.__c83 && __c83.tall(x, y, z)); } catch (_) { return false; } };
  const liq = b => b === T.WATER || b === T.LAVA;
  // ---- the grid ----
  const blk = (x, y, z) => { const b = wb(x, y, z); if (pass(b)) return false; if (liq(b)) return true; return solid(x, y, z) || tall(x, y - 1, z); };   // a fence below reaches into this cell
  function stand(x, y, z) { if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2 || y < 1 || y >= H - 3) return false;
    const f = wb(x, y - 1, z); if (!f || liq(f) || pass(f) || !solid(x, y - 1, z) || tall(x, y - 1, z)) return false;
    const b0 = wb(x, y, z); if (liq(b0)) return false; return !blk(x, y, z) && !blk(x, y + 1, z); }
  const tight = (x, y, z) => { let n = 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (blk(x + dx, y, z + dz) || blk(x + dx, y + 1, z + dz)) n++; return n; };
  // ---- entrances: door / gate cells near the edge of the castle footprint, with the outside cell to aim for ----
  function entrances(ci) { if (ci.__ent) return ci.__ent; const out = [], S = ci.S || 12, cx = Math.floor(ci.cx), cz = Math.floor(ci.cz), gy = ci.gy || 40;
    for (let x = cx - S - 3; x <= cx + S + 3; x++) for (let z = cz - S - 3; z <= cz + S + 3; z++) for (let y = gy - 2; y <= gy + 3; y++) { const b = wb(x, y, z); if (b !== T.DOOR && b !== GATE) continue;
      const ex = Math.abs(x - cx), ez = Math.abs(z - cz); if (Math.max(ex, ez) < S - 4) continue;
      const nx = ex >= ez ? Math.sign(x - cx) : 0, nz = ex >= ez ? 0 : Math.sign(z - cz);
      let o = null; for (const k of [2, 3, 1]) { for (const yy of [y, y - 1, y + 1]) if (stand(x + nx * k, yy, z + nz * k)) { o = [x + nx * k, yy, z + nz * k]; break; } if (o) break; }
      if (o && !out.some(e => Math.abs(e.x - x) + Math.abs(e.z - z) < 2)) out.push({x, y, z, o}); }
    return (ci.__ent = out); }
  const inside = (ci, x, z, pad) => Math.abs(x - ci.cx) < (ci.S || 12) + (pad || 0) && Math.abs(z - ci.cz) < (ci.S || 12) + (pad || 0);
  // ---- resumable A* ----
  let KX = D * H; const key = (x, y, z) => x * KX + z * H + y;
  const DX = [1, -1, 0, 0, 1, 1, -1, -1], DZ = [0, 0, 1, -1, 1, -1, 1, -1];
  function startSearch(sx, sy, sz, tx, ty, tz, ban) {
    if (!stand(sx, sy, sz)) { let f = null; for (const dy of [0, 1, -1, 2]) for (let d = -1; d < 8 && !f; d++) { const x = sx + (d < 0 ? 0 : DX[d]), z = sz + (d < 0 ? 0 : DZ[d]); if (stand(x, sy + dy, z)) f = [x, sy + dy, z]; } if (!f) return null; [sx, sy, sz] = f; }
    KX = D * H; const s = {sx, sy, sz, tx, ty, tz, ban, g: new Map(), from: new Map(), open: [], n: 0, best: null, bh: 1e9, done: false, path: null, k0: key(sx, sy, sz)};
    s.g.set(s.k0, 0); hpush(s.open, [h(s, sx, sy, sz), sx, sy, sz, 0]); return s; }
  const h = (s, x, y, z) => { const ax = Math.abs(x - s.tx), az = Math.abs(z - s.tz); return Math.max(ax, az) + 0.414 * Math.min(ax, az) + Math.abs(y - s.ty) * 0.9; };
  function hpush(o, nd) { o.push(nd); let i = o.length - 1; while (i > 0) { const q = (i - 1) >> 1; if (o[q][0] <= nd[0]) break; o[i] = o[q]; o[q] = nd; i = q; } }
  function hpop(o) { const top = o[0], last = o.pop(); if (o.length) { o[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < o.length && o[l][0] < o[m][0]) m = l; if (r < o.length && o[r][0] < o[m][0]) m = r; if (m === i) break; const t = o[i]; o[i] = o[m]; o[m] = t; i = m; } } return top; }
  function stepSearch(s, steps) { let k = 0;
    while (s.open.length && k < steps && s.n < CAP) { const [, x, y, z, gc] = hpop(s.open), kc = key(x, y, z); if (gc > s.g.get(kc)) continue; s.n++; k++;
      const hh = h(s, x, y, z); if (hh < s.bh) { s.bh = hh; s.best = kc; }
      if (Math.abs(x - s.tx) <= (s.near || 0) && Math.abs(z - s.tz) <= (s.near || 0) && Math.abs(y - s.ty) <= 1) { finish(s, kc, false); return k; }
      for (let d = 0; d < 8; d++) { const nx = x + DX[d], nz = z + DZ[d]; let ny = null;
        if (d >= 4) { if (stand(nx, y, nz) && stand(x + DX[d], y, z) && stand(x, y, z + DZ[d])) ny = y; else continue; }
        else if (stand(nx, y, nz)) ny = y;
        else if (!blk(x, y + 2, z) && stand(nx, y + 1, nz)) ny = y + 1;
        else if (!blk(nx, y, nz) && !blk(nx, y + 1, nz)) for (let fy = y - 1; fy >= y - 3; fy--) { if (stand(nx, fy, nz)) { ny = fy; break; } if (blk(nx, fy, nz) || liq(wb(nx, fy, nz))) break; }
        if (ny === null) continue;
        const kn = key(nx, ny, nz); if (s.ban && s.ban.has(kn)) continue;
        let c = d >= 4 ? 1.414 : 1; if (ny > y) c += 0.7; else if (ny < y) c += 0.3 * (y - ny); c += tight(nx, ny, nz) * 0.45; if (pass(wb(nx, ny, nz))) c += 0.3;
        const gn = gc + c, old = s.g.get(kn); if (old !== undefined && old <= gn) continue; s.g.set(kn, gn); s.from.set(kn, kc); hpush(s.open, [gn + h(s, nx, ny, nz) * 1.08, nx, ny, nz, gn]); } }
    if (!s.open.length || s.n >= CAP) finish(s, null, true); return k; }
  function finish(s, end, partial) { s.done = true; U.nodes += s.n; U.paths++;
    if (end === null) { U.fails++; s.path = null; return; }   // unreachable: no half path into a wall
    const out = []; let k = end; while (k !== s.k0 && s.from.has(k)) { const x = Math.floor(k / KX), r = k - x * KX, z = Math.floor(r / H); out.push([x, r - z * H, z]); k = s.from.get(k); }
    out.reverse(); s.path = out; s.partial = partial; }
  U.find = function (sx, sy, sz, tx, ty, tz, near) { const s = startSearch(sx, sy, sz, tx, ty, tz, null); if (!s) return null; s.near = near || 0; while (!s.done) stepSearch(s, 1e9); return s.path; };
  // ---- body vs voxels ----
  const low = b => b === 145 || (b >= 164 && b <= 169);
  // v1.0.52: the player's own body test (collides: 4 corners x feet/waist/head vs solid voxels) - closed doors are solid, so they open them first
  function free(x, y, z) { return !collides(x, y, z); }
  U.free = free;
  function move(a, dx, dz) { const p = a.g.position; let moved = false, hit = false; if (window.__c234dbg && a === __c234dbg.a) __c234dbg.L.push(['m', +p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), +dx.toFixed(3), +dz.toFixed(3), free(p.x, p.y, p.z), free(p.x + dx, p.y, p.z), free(p.x, p.y, p.z + dz)]);
    if (!free(p.x, p.y, p.z)) { p.x += dx; p.z += dz; return true; }   // already stuck in something: the un-embed pass sorts it out
    for (const [mx, mz] of [[dx, 0], [0, dz]]) { if (!mx && !mz) continue; const nx = p.x + mx, nz = p.z + mz;
      if (nx < 1 || nz < 1 || nx >= W - 1 || nz >= D - 1) { hit = true; continue; }
      if (free(nx, p.y, nz)) { p.x = nx; p.z = nz; moved = true; continue; }
      hit = true; if (a.onGround && free(p.x, p.y + 1.05, p.z) && free(nx, p.y + 1.05, nz)) { a.vy = 7.2; a.onGround = false; a.__stepUp = 1; } }
    if (!moved) { const w = a.__nav && a.__nav.path && a.__nav.path[0]; if (w && Math.hypot(w[0] + .5 - p.x, w[2] + .5 - p.z) < 0.7 && Math.abs(w[1] - p.y) <= 1.1 && stand(w[0], w[1], w[2]) && free(w[0] + .5, w[1], w[2] + .5)) { p.set(w[0] + .5, w[1], w[2] + .5); a.vy = 0; U.snaps = (U.snaps || 0) + 1; return true; } }
    return moved ? true : hit && a.__stepUp ? 'step' : false; }
  const mm = moveMob; moveMob = function (a, dx, dz) { if (isC(a) && !a.sleeping) { try { const r = move(a, dx, dz); a.__stepUp = 0; return r; } catch (e) { ERR(e); } } return mm.apply(this, arguments); };
  // ---- following a plan ----
  const fy = p => Math.floor(p.y + 0.05);
  function goalOf(a) { const p = a.g.position;
    const E = a.__errand; if (E && !a.tgt) { if (Math.hypot(E.x + .5 - p.x, E.z + .5 - p.z) < (E.near || 1.2) || performance.now() > E.until) { a.__errand = null; try { E.done && E.done(a, performance.now() <= E.until); } catch (_) {} } else return [E.x + .5, E.y, E.z + .5, 0]; }
    if (a.tgt && a.tgt.g) { const q = a.tgt.g.position; return [q.x, q.y, q.z, 1]; }
    if (a.wp && isFinite(a.wp[0])) { const x = a.wp[0], z = a.wp.length > 2 ? a.wp[2] : a.wp[1]; return [x, a.wp.length > 2 ? a.wp[1] : (a.wpY != null && a.wpRef === a.wp ? a.wpY : null), z, 0]; }
    if (a.pathGoal && isNight) return [a.pathGoal[0] + .5, a.pathGoal[2], a.pathGoal[1] + .5, 0];
    return null; }
  function columnY(x, z, y0) { let b = null, bd = 99; for (let y = Math.max(1, y0 - 6); y <= Math.min(H - 4, y0 + 6); y++) if (stand(x, y, z) && Math.abs(y - y0) < bd) { bd = Math.abs(y - y0); b = y; } return b; }
  function plan(a, g) { const p = a.g.position, N = a.__nav || (a.__nav = {ban: new Map()}), t = performance.now();
    for (const [k, u] of N.ban) if (u < t) N.ban.delete(k);
    const gx = Math.floor(g[0]), gz = Math.floor(g[2]); let gy = g[1] == null ? columnY(gx, gz, fy(p)) : Math.floor(g[1] + 0.05);
    if (gy == null) gy = fy(p); if (!stand(gx, gy, gz)) { const c = columnY(gx, gz, gy); if (c != null) gy = c; }
    let legs = [[gx, gy, gz]];
    const ci = a.ci; if (ci && inside(ci, p.x, p.z, -1) && !inside(ci, gx, gz, 0)) { const E = entrances(ci); if (E.length) { let b = null, bd = 1e9; for (const e of E) { const d = Math.hypot(e.o[0] - gx, e.o[2] - gz) + Math.hypot(e.x - p.x, e.z - p.z) * 0.6; if (d < bd) { bd = d; b = e; } } legs = [b.o, [gx, gy, gz]]; N.exit = b; U.exits++; } }
    N.goal = [gx, gy, gz]; N.legs = legs; N.leg = 0; N.path = null; N.s = null; N.at = t; N.prog = null; N.fails = N.fails || 0; }
  function ensure(a, N) { if (N.path || N.dead) return;
    const p = a.g.position, L = N.legs[N.leg];
    if (!N.s) { KX = D * H; const ban = new Set([...N.ban.keys()]); N.s = startSearch(Math.floor(p.x), fy(p), Math.floor(p.z), L[0], L[1], L[2], ban); if (!N.s) { N.dead = 1; return; } N.s.near = N.leg < N.legs.length - 1 ? 0 : (N.near || 0); }
    if (budget <= 0) return; const t0 = performance.now(); budget -= stepSearch(N.s, Math.min(budget, 1200)); U.ms += performance.now() - t0;
    if (N.s.done) { if (N.s.path) { N.path = N.s.path; U.last = {who: a.name, len: N.path.length, leg: N.leg, legs: N.legs.length, exit: !!N.exit, nodes: N.s.n}; } else N.dead = 1; N.s = null; } }
  function clearLine(x0, y, z0, x1, z1) { const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / 0.25); for (let i = 1; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; if (!free(x, y, z) || !stand(Math.floor(x), Math.floor(y + 0.05), Math.floor(z))) return false; } return true; }
  function navStep(a, spd, dt) { a.__navHit = 1; const p = a.g.position, g = goalOf(a), t = performance.now();
    if (!g) return move(a, Math.sin(a.ang) * spd * dt, Math.cos(a.ang) * spd * dt);
    let N = a.__nav; const gx = Math.floor(g[0]), gz = Math.floor(g[2]);
    if (!N || !N.goal || Math.abs(N.goal[0] - gx) + Math.abs(N.goal[2] - gz) > (g[3] ? 1 : 0) || (g[3] && t - N.at > 1200 && N.path && N.path.length < 3)) { if (!N || !N.goal || t - (N.at || 0) > (g[3] ? 500 : 0)) { plan(a, g); N = a.__nav; N.dead = 0; } }
    if (Math.hypot(g[0] - p.x, g[2] - p.z) < 0.5) return true;
    ensure(a, N);
    if (N.dead) { a.__navNo = (a.__navNo || 0) + dt; if (a.__navNo > 0.4) { a.__navNo = 0; U.gaveUp++; giveUp(a, 'dead'); } return false; }
    if (!N.path) return true;   // still thinking: stand still a moment (counts as fine)
    const cy = fy(p);
    while (N.path.length) { const w = N.path[0]; if (Math.hypot(w[0] + .5 - p.x, w[2] + .5 - p.z) < 0.38 && Math.abs(w[1] - cy) <= 1) { N.path.shift(); N.prog = null; } else break; }
    if (!N.path.length) { if (N.leg < N.legs.length - 1) { N.leg++; N.path = null; N.s = null; return true; } a.ang = Math.atan2(g[0] - p.x, g[2] - p.z); return move(a, Math.sin(a.ang) * spd * dt, Math.cos(a.ang) * spd * dt) !== false || true; }
    let w = N.path[0];
    for (let i = Math.min(3, N.path.length - 1); i >= 1; i--) { const q = N.path[i]; if (q[1] !== cy || N.path.slice(0, i).some(r => r[1] !== cy || pass(wb(r[0], r[1], r[2])))) continue; if (clearLine(p.x, p.y, p.z, q[0] + .5, q[2] + .5)) { w = q; break; } }
    try { if (C78.api && C78.api.doors) C78.api.doors({g: a.g, path: N.path.slice(0, 2)}); } catch (_) {}
    try { for (const w of N.path.slice(0, 3)) for (let k = 0; k < 2; k++) { const b = wb(w[0], w[1] + k, w[2]); if (!isDoor(b) || Math.hypot(w[0] + .5 - p.x, w[2] + .5 - p.z) > 2.2) continue; const ly = b === T.DOORTOP ? w[1] + k - 1 : w[1] + k, dk = keyOf(w[0], ly, w[2]); if (!doorState.get(dk)) { doorState.set(dk, true); C78.doors.push({key: dk, x: w[0], y: ly, z: w[2], t: performance.now()}); U.opened = (U.opened || 0) + 1; try { sfx3d('doorOpen', p, 10); } catch (_) {} } break; } } catch (e) { ERR(e); }
    a.ang = Math.atan2(w[0] + .5 - p.x, w[2] + .5 - p.z);
    const dw = Math.hypot(w[0] + .5 - p.x, w[2] + .5 - p.z), sp = Math.min(spd, Math.max(1.2, dw * 5));
    if (w[1] > cy && a.onGround && dw < 1.25) { a.vy = 7.2; a.onGround = false; }
    const r = move(a, Math.sin(a.ang) * sp * dt, Math.cos(a.ang) * sp * dt);
    // no progress for 1.5 s -> ban that cell for a while and plan round it; three times -> somewhere else
    if (!N.prog || dw < N.prog[0] - 0.25) N.prog = [dw, t];
    else if (t - N.prog[1] > 1500) { N.prog = null; N.fails++; U.replans++; N.ban.set(key(w[0], w[1], w[2]), t + 15000); N.path = null; N.s = null; if (N.fails >= 3) { N.fails = 0; U.gaveUp++; giveUp(a, 'stuck'); return false; } }
    return r !== false || true; }
  function giveUp(a, why) { const N = a.__nav; try { const p = a.g.position; (U.gl = U.gl || []).push([a.name, why, Math.floor(p.x), Math.floor(p.y + .05), Math.floor(p.z), N && N.legs && N.legs[N.leg]]); if (U.gl.length > 12) U.gl.shift(); } catch (_) {} if (N) { N.goal = null; N.path = null; N.s = null; N.dead = 0; }
    a.wp = null; a.blk = 1; if (a.__errand) { const E = a.__errand; a.__errand = null; try { E.done && E.done(a, false); } catch (_) {} } if (a.__task) a.__task.t0 = -1e9; if (a.tgt) a.tgt = null; a.idle = 0.6 + Math.random(); a.__gave = (a.__gave || 0) + 1; }
  U.navStep = navStep; U.entrances = entrances; U.stand = stand;
  const sm = stepMob; stepMob = function (a, spd, dt, wander) { if (isC(a) && !a.sleeping && !a.skipPhys) { try { return navStep(a, spd * (a.speedMul || 1), dt); } catch (e) { ERR(e); } } return sm.apply(this, arguments); };
  // ---- the ones that stare at you while carrying out a task still walk it (a drop by your feet, a job) ----
  const ca = clanAI; clanAI = function (a, dt) { a.__navHit = 0; a.__aiN = (a.__aiN || 0) + 1; const r = ca.apply(this, arguments);
    try { const N = a.__nav; if (isC(a) && !a.__navHit && !a.sleeping && !a.trading && !a.lying && (a.wp || a.tgt || a.__errand) && (a.stare > 0 && !a.__errand ? (a.__rush || a.__task || a.__plan) : N && N.goal && (N.path || N.s) && !(a.__hold > 0))) { const sp = a.__rush || a.tgt ? 2.6 : 1.7; navStep(a, sp * (a.speedMul || 1), dt); a.moving = true; a.curSpd = sp; } } catch (e) { ERR(e); }
    return r; };
  // ---- never inside a block: whoever put them there, put them back where they last stood clear ----
  function unembed(a) { const p = a.g.position; if (free(p.x, p.y, p.z)) { a.__ok = [p.x, p.y, p.z]; return; }
    if (a.__ok && p.y < a.__ok[1] && free(p.x, a.__ok[1], p.z)) { const yy = Math.floor(p.y) + 1; p.y = free(p.x, yy, p.z) && yy <= a.__ok[1] ? yy : a.__ok[1]; a.vy = 0; a.onGround = true; U.ledge = (U.ledge || 0) + 1; return; }   // landed on the edge of a block (body, not a point, holds them up)
    if (a.__ok && Math.hypot(a.__ok[0] - p.x, a.__ok[2] - p.z) < 2.5 && free(a.__ok[0], a.__ok[1], a.__ok[2])) { if (window.__c234dbg && a === __c234dbg.a) __c234dbg.L.push(['rev', +p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), a.__ok.map(v => +v.toFixed(2))]); p.set(a.__ok[0], a.__ok[1], a.__ok[2]); U.reverts++; return; }
    const bx = Math.floor(p.x), bz = Math.floor(p.z), by = fy(p);
    for (let r = 0; r <= 3; r++) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) for (const dy of [0, 1, -1, 2]) { if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue; if (stand(bx + dx, by + dy, bz + dz)) { p.set(bx + dx + .5, by + dy, bz + dz + .5); a.__ok = [p.x, p.y, p.z]; U.unembed++; return; } } }
  const um = updateMobs; updateMobs = function (dt) { budget = FRAME; const r = um.apply(this, arguments);
    try { if (started) for (const a of mobs) if (isC(a) && !a.sleeping && !a.skipPhys) unembed(a); } catch (e) { ERR(e); }
    return r; };
})();
// ---- v1.0.52: folk are people, not scenery - they are not despawned for being out of sight, slow or a little far (they keep their goods and memories) ----
(function () { if (typeof despawnPass !== 'function') return;
  const dp = despawnPass; despawnPass = function () { const keep = []; try { for (let i = mobs.length - 1; i >= 0; i--) { const a = mobs[i]; if (a.kind === 'clansman' && !a.dead && Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z) < 90) { keep.push(a); mobs.splice(i, 1); } } } catch (_) {}
    try { return dp.apply(this, arguments); } finally { for (const a of keep) { a.unseenT = 0; mobs.push(a); } } };
})();

// ---- their vertical physics is the player's (moveY): the whole body stands on block edges, no sinking into stairs or ledges ----
(function () { const mp = mobPhysics; mobPhysics = function (a, dt) { if (!(a && a.kind === 'clansman' && !a.sleeping && !a.skipPhys && a.g)) return mp.apply(this, arguments);
  const p = a.g.position;
  if (Math.abs(a.kbx) + Math.abs(a.kbz) > 0.02) { if (moveMob(a, a.kbx * dt, 0) !== true) a.kbx = 0; if (moveMob(a, 0, a.kbz * dt) !== true) a.kbz = 0; const k = Math.exp(-(a.onGround ? 7 : 1.5) * dt); a.kbx *= k; a.kbz *= k; }
  if (a.vy <= 0) { const ry = Math.round(p.y); if (Math.abs(p.y - ry) < 0.03 && collides(p.x, ry - 0.03, p.z) && !collides(p.x, ry, p.z)) { p.y = ry; a.vy = 0; a.onGround = true; return; } }
  a.vy -= 24 * dt; const steps = Math.max(1, Math.ceil(Math.abs(a.vy * dt) / 0.2)), sy = a.vy * dt / steps; a.onGround = false;
  for (let i = 0; i < steps; i++) { const ny = p.y + sy; if (collides(p.x, ny, p.z)) { if (sy < 0) { a.onGround = true; const top = Math.floor(ny + 0.01) + 1; if (top <= p.y + 0.02 && !collides(p.x, top, p.z)) p.y = top; } a.vy = 0; break; } p.y = ny; } }; })();
