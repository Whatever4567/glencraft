/* ===================== GLX-C191 (v1.0.36): Admiral Skelp's longship sails - a moving ship (white wool sails) that comes close and lets the Admiral stare you down; once he is dead you can board it
   (use / LT), steer with the stick and leave with B / sneak; ship position and the Admiral's death are saved ===================== */
(function c191() {
  const U = window.__c191 = {entity: true, ship: null, err: null, drove: 0, built: 0};
  const warn = (w, e) => { U.err = w + ' ' + String(e && e.stack || e); console.warn('c191', w, e); };
  const site = () => { const s = window.__c142 && __c142.sites; return s && s.boat && s.boat.ship ? s.boat : null; };
  let S = null, G = null;   // S: {x, z, yaw, v, dead, by, lx: deck local}, G: three group
  const SAILS = new Set([156, 78]);
  function mesh(sh) { const L = __c142.SH(), has = new Map(); for (const [x, y, z, v] of L) has.set(x + ',' + y + ',' + z, v);
    const by = sh.by, per = new Map(), g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
    const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    for (const [x, y, z, v0] of L) { if (by + y < SEA - 3) continue; const v = SAILS.has(v0) && y >= 12 ? T.WOOL : v0; let A = per.get(v); if (!A) per.set(v, A = {pos: [], nor: [], uv: [], col: [], ind: [], grp: []});
      const x0 = x - 11, z0 = z - 7, y0 = by + y, solidN = (dx, dy, dz) => { const n = has.get((x + dx) + ',' + (y + dy) + ',' + (z + dz)); return n !== undefined && n !== 162 && n !== 227 && v !== 162 && v !== 227; };
      const full = v !== 162 && v !== 227, s = full ? 0 : (v === 162 ? .375 : .44), X0 = x0 + s, X1 = x0 + 1 - s, Z0 = z0 + (v === 162 ? s : 0), Z1 = z0 + 1 - (v === 162 ? s : 0);
      const F = [[[X1, y0, Z1], [X1, y0, Z0], [X1, y0 + 1, Z0], [X1, y0 + 1, Z1]], [[X0, y0, Z0], [X0, y0, Z1], [X0, y0 + 1, Z1], [X0, y0 + 1, Z0]], [[X0, y0 + 1, Z1], [X1, y0 + 1, Z1], [X1, y0 + 1, Z0], [X0, y0 + 1, Z0]],
        [[X0, y0, Z0], [X1, y0, Z0], [X1, y0, Z1], [X0, y0, Z1]], [[X0, y0, Z1], [X1, y0, Z1], [X1, y0 + 1, Z1], [X0, y0 + 1, Z1]], [[X1, y0, Z0], [X0, y0, Z0], [X0, y0 + 1, Z0], [X1, y0 + 1, Z0]]];
      for (let d = 0; d < 6; d++) { if (full && solidN(...DIRS[d])) continue; const b = A.pos.length / 3, sh2 = d === 2 ? 1 : d === 3 ? .55 : d < 2 ? .8 : .7;
        for (const p of F[d]) { A.pos.push(p[0] - .0, p[1] - by, p[2]); A.nor.push(...DIRS[d]); A.col.push(sh2, sh2, sh2); }
        A.uv.push(0, 0, 1, 0, 1, 1, 0, 1); A.ind.push(b, b + 1, b + 2, b, b + 2, b + 3); A.grp.push(d); } }
    for (const [v, A] of per) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(A.pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(A.nor, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(A.uv, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(A.col, 3)); geo.setIndex(A.ind);
      const mm = BLOCK_MATS[v === 162 ? T.PLANKS : v]; if (Array.isArray(mm)) { let s0 = 0; for (const d of A.grp) { geo.addGroup(s0, 6, d); s0 += 6; } } geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, mm); m.frustumCulled = false; inner.add(m); }
    g.userData.oars = [new THREE.Object3D(), new THREE.Object3D()]; U.built++; return g; }
  // ship forward is local +x (the prow); world forward for yaw is (-sin yaw, -cos yaw) as for rowing boats
  const fwd = yaw => [-Math.sin(yaw), -Math.cos(yaw)];
  const toW = (lx, lz) => { const [fx, fz] = fwd(S.yaw), rx = -fz, rz = fx; return [S.x + fx * lx + rx * lz, S.z + fz * lx + rz * lz]; };
  function place(t) { if (!G) return; G.position.set(S.x, S.by + Math.sin(t * 1.1) * 0.06, S.z); G.rotation.set(Math.sin(t * 0.8) * 0.012, S.yaw + Math.PI / 2, Math.sin(t * 0.9) * 0.02); }
  function wetAt(x, z) { const fx = Math.floor(x), fz = Math.floor(z); if (fx < 3 || fz < 3 || fx >= W - 3 || fz >= D - 3) return false; return getB(fx, SEA, fz) === T.WATER && getB(fx, SEA + 1, fz) === T.AIR && getB(fx, SEA + 3, fz) === T.AIR && getB(fx, SEA - 2, fz) === T.WATER; }
  function clear(x, z, yaw) { const [fx, fz] = fwd(yaw), rx = -fz, rz = fx; for (const [a, b] of [[12, 1], [-8, 1], [7, 4], [7, -2], [-4, 4], [-4, -2], [2, 5], [2, -3], [2, 1]]) if (!wetAt(x + fx * a + rx * b, z + fz * a + rz * b)) return false; return true; }
  function make(sh, st) { S = Object.assign({x: sh.cx, z: sh.cz, yaw: -Math.PI / 2, v: 0, dead: 0, by: sh.by, t: 0}, st || {}); S.by = sh.by;
    const b = site(); if (b && b.deck && b.deck[0]) { S.dl = [b.deck[0][0] - sh.cx, b.deck[0][1], b.deck[0][2] - sh.cz]; }
    try { G = mesh(sh); scene.add(G); } catch (e) { warn('mesh', e); G = null; } U.ship = S; place(0); }
  function drop() { if (G) { scene.remove(G); G.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } G = null; S = null; U.ship = null; if (riding && riding.c191) riding = null; }
  // the deck point for the Admiral (original deck local offset, original orientation was yaw -pi/2 => local lx = +x offset, lz = +z offset)
  const deckW = () => { const d = S.dl || [0, S.by + 11, 0], lx = d[0], lz = d[2]; const [x, z] = toW(lx, lz); return [x, d[1], z]; };
  function skelps() { const s = window.__c143 && __c143.slots && __c143.slots.get('skelp'); return s ? s.a : []; }
  const RIDE = {c191: 1, g: null, x: 0, y: 0, z: 0, yaw: 0, v: 0, t: 0, mob: null};
  function tick(dt) { if (G) G.visible = !DIM.cur; if (!S || DIM.cur) return; S.t += dt; const b = site();
    const sk = skelps().find(a => a && a.g && a.g.parent);
    if (!S.dead) { const dx = P.x - S.x, dz = P.z - S.z, d = Math.hypot(dx, dz);
      let want = 0; if (d < 80 && d > 11) { want = d > 30 ? 3.2 : 1.6; const ta = Math.atan2(-dx, -dz); let da = ta - S.yaw; while (da > Math.PI) da -= 6.2832; while (da < -Math.PI) da += 6.2832; S.yaw += Math.max(-1, Math.min(1, da)) * 0.45 * dt; if (Math.abs(da) > 1.2) want *= 0.4; }
      S.v += (want - S.v) * Math.min(1, dt * 0.6); move(dt);
      if (b) { const p = deckW(); b.x = S.x; b.z = S.z; b.deck = [p]; }
      if (sk) { const p = deckW(); sk.frozen = true; sk.c191 = 1; sk.post = p; sk.g.position.set(p[0], p[1] + Math.sin(S.t * 1.1) * 0.06, p[2]); sk.vy = 0; sk.onGround = true;
        try { const ya = Math.atan2(P.x - p[0], P.z - p[2]); sk.ang = ya; if (sk.head) { sk.head.rotation.x = -Math.atan2(P.y + 1.4 - p[1] - 1.6, Math.hypot(P.x - p[0], P.z - p[2])) * 0.6; } } catch (_) {} } }
    else { if (b) b.deck = []; if (riding !== RIDE) { S.v *= Math.max(0, 1 - dt); move(dt); } }
    if (riding !== RIDE) place(S.t); }
  function move(dt) { const [fx, fz] = fwd(S.yaw), nx = S.x + fx * S.v * dt, nz = S.z + fz * S.v * dt;
    if (clear(nx, nz, S.yaw)) { S.x = nx; S.z = nz; return true; } S.v *= -0.2; return false; }
  // boarding (Admiral dead), driving, leaving
  function looking() { if (!S || !G) return false; const d = lookDir(), o = [P.x, P.y + EYE, P.z]; for (let t = 0.5; t < 9; t += 0.5) { const x = o[0] + d[0] * t, y = o[1] + d[1] * t, z = o[2] + d[2] * t;
      const dx = x - S.x, dz = z - S.z, [fx, fz] = fwd(S.yaw), lx = dx * fx + dz * fz, lz = dx * -fz + dz * fx; if (Math.abs(lx) < 11 && Math.abs(lz) < 4.5 && y > S.by + 8 && y < S.by + 15) return true; } return false; }
  function board() { RIDE.g = G; riding = RIDE; P.yaw = S.yaw; U.drove++; try { toast('On the Admiral\'s longship: stick / W S to sail, A D to turn, B or sneak to step off'); } catch (_) {} }
  function leave() { riding = null; try { boatExitLock = 0.5; } catch (_) {} let spot = null;
    for (let r = 5; r <= 14 && !spot; r += 1.5) for (let a = 0; a < 16 && !spot; a++) { const x = Math.floor(S.x + Math.cos(a / 16 * 6.283) * r), z = Math.floor(S.z + Math.sin(a / 16 * 6.283) * r);
      for (let y = SEA + 6; y >= SEA - 1; y--) { const g = getB(x, y, z); if (g !== T.AIR && g !== T.WATER && !PLANT[g] && getB(x, y + 1, z) === T.AIR && getB(x, y + 2, z) === T.AIR) { spot = [x + .5, y + 1, z + .5]; break; } } }
    if (spot) { P.x = spot[0]; P.y = spot[1]; P.z = spot[2]; } else { const [fx, fz] = fwd(S.yaw); P.x = S.x - fz * 5.5; P.z = S.z + fx * 5.5; P.y = SEA + 1; } P.vy = 0; P.fallTop = null; S.v = 0; }
  try { const ui = useItem; useItem = function () { try { if (riding === RIDE) { leave(); return; } if (!riding && S && S.dead && !DIM.cur && looking()) { board(); return; } } catch (e) { warn('use', e); } return ui.apply(this, arguments); }; } catch (e) { warn('useItem', e); }
  try { const up = updatePlayer; updatePlayer = function (dt, mx, mz) { try { tick(dt); } catch (e) { warn('tick', e); }
      if (riding !== RIDE) return up.apply(this, arguments);
      if (!S) { riding = null; return up.apply(this, arguments); }
      if (sneakHeld && !(typeof boatExitLock !== 'undefined' && boatExitLock > 0)) { leave(); return 0; } try { if (boatExitLock > 0) boatExitLock -= dt; } catch (_) {}
      S.v += mz * 3.2 * dt; S.v *= Math.max(0, 1 - dt * 0.35); S.v = Math.max(-1.5, Math.min(5.5, S.v));
      const turn = mx * 0.7 * dt * (S.v < -0.2 ? -1 : 1); S.yaw -= turn; P.yaw -= turn;
      if (!move(dt) && Math.abs(S.v) > 1) try { boatSplash(0.5); } catch (_) {}
      place(S.t); const [x, z] = toW(-2.5, 0); P.x = x; P.z = z; P.y = S.by + 11.05; P.vy = 0; P.onGround = true; P.fallTop = null; try { swimming = false; } catch (_) {}
      return Math.abs(S.v) * dt; }; } catch (e) { warn('update', e); }
  try { const km = killMob; killMob = function (a) { try { if (a && a.kind === 'nm12' && a.c191 && S) { S.dead = 1; const b = site(); if (b) b.deck = []; } } catch (_) {} return km.apply(this, arguments); }; } catch (e) { warn('kill', e); }
  // save / load / new world
  try { const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && S) d.c191 = {x: +S.x.toFixed(2), z: +S.z.toFixed(2), yaw: +S.yaw.toFixed(3), dead: S.dead ? 1 : 0}; } catch (_) {} return d; }; } catch (e) { warn('ser', e); }
  let pend = null; try { const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && !d.dim && !DIM.cur) { drop(); pend = d.c191 || {}; } } catch (e) { warn('apply', e); } return r; }; } catch (e) { warn('apply', e); }
  try { const ew = enterWorld; enterWorld = function (save) { if (!save) { drop(); pend = {}; } return ew.apply(this, arguments); }; } catch (e) { warn('enter', e); }
  setInterval(() => { try { if (pend && !S && typeof started !== 'undefined' && started && !DIM.cur) { const b = site(); if (b) { make(b.ship, pend.x !== undefined ? pend : null); pend = null; } } } catch (e) { warn('make', e); pend = null; } }, 700);
})();
