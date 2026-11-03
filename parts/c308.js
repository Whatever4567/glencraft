/* GLX-C308 (v1.1.19, v1.1.20 all planets): SPACE v2 - ROUND PLANETS. The Moon, Mars, Mercury and Pluto are real round balls of blocks hanging in
   the same space as the map, so you fly to them and land with no teleport. Gravity pulls toward each ones centre: walk all the way round, the
   view rolls smoothly so the ground is always below you, and you can mine and place on any side. Far away each is its C305 ball, near it is
   drawn from its own blocks in 16 block chunks (only the one you are near is kept in memory). Only the blocks you change are saved. */
(function c308() {
  const U = window.__c308 = {err: null, mode: null, cur: null, mined: 0, placed: 0, faces: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const S5 = () => window.__c305, PD = () => window.__c306, R9 = () => window.__c299, CS = 16;
  const Y = new THREE.Vector3(0, 1, 0), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), eY = new THREE.Euler(0, 0, 0, 'YXZ');
  const DEF = [{id: 'moon', name: 'THE MOON', RM: 56, g: 0.17, at: [432, 2600, -2200], cr: 46, bump: 1.2, top: () => T.MOONDUST || T.GRAVEL, rock: () => T.MOONROCK || T.STONE, deep: () => T.MOONBASALT, ores: [[() => T.MOONORE, 0.012, 16]]},
    {id: 'mars', name: 'MARS', RM: 64, g: 0.38, cr: 24, bump: 4, top: () => T.RSAND || T.SAND, rock: () => T.MARSSTONE || T.STONE, deep: () => T.STONE, ores: [[() => T.MARSOXIDE, 0.03, 4], [() => T.MARSORE, 0.008, 18]], tint: [1.15, 0.72, 0.55]},];
  const SUN = new THREE.Vector3(0.45, 0.55, 0.7).normalize(), FD = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const QV = [[[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]], [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]];
  const MAT = new THREE.MeshBasicMaterial({vertexColors: true, fog: false}), CC = {};
  const colOf = (b, t) => { const k0 = b + ':' + (t ? t.join() : ''); if (CC[k0]) return CC[k0]; try { const a = typeof AVG !== 'undefined' && FACES[b] && AVG[[].concat(FACES[b])[0]]; if (a !== undefined && a !== false && b >= 191 && b <= 199) return (CC[k0] = [(a >> 16) / 255, (a >> 8 & 255) / 255, (a & 255) / 255]); } catch (_) {} const n = String((typeof NAMES !== 'undefined' && NAMES[b]) || '').toLowerCase();
    let k = b === T.GRAVEL ? [0.62, 0.62, 0.64] : b === T.STONE ? [0.46, 0.46, 0.48] : /bedrock/.test(n) ? [0.2, 0.2, 0.22] : /red sand/.test(n) || b === T.RSAND ? [0.78, 0.38, 0.2] : /water/.test(n) ? [0.2, 0.4, 0.8] : /snow|ice/.test(n) ? [0.92, 0.94, 0.97] :
      /grass|leaf|moss/.test(n) ? [0.3, 0.6, 0.25] : /log|plank|wood/.test(n) ? [0.55, 0.4, 0.25] : /sand/.test(n) ? [0.85, 0.78, 0.55] : /glass/.test(n) ? [0.75, 0.9, 0.95] : /glow|lamp|torch/.test(n) ? [1, 0.9, 0.5] : [0.6, 0.55, 0.5];
    if (t && (b === T.STONE || b === T.GRAVEL)) k = k.map((c, i) => Math.min(1, c * t[i])); return (CC[k0] = k); };
  function Body(d) { const B = {id: d.id, name: d.name, RM: d.RM, g: d.g, edits: new Map(), A: null, built: false, todo: null, CM: new Map(), dirty: new Set()};
    const RM = d.RM, N = 2 * (RM + 10), HN = N >> 1, CN = Math.ceil(N / CS), li = (x, y, z) => (x * N + y) * N + z; B.GR = RM + 260;
    B.C = new THREE.Vector3(); B.place = () => { if (d.at) B.C.set(d.at[0], d.at[1], d.at[2]); else { const b = S5().get(d.id), p = S5().pos(b); B.C.set(p.x, p.y, p.z); } B.G.position.set(B.C.x - HN, B.C.y - HN, B.C.z - HN); };
    B.G = new THREE.Group(); B.G.userData.sys = 1; B.G.visible = false; scene.add(B.G);
    B.loc = (wx, wy, wz) => [Math.floor(wx - B.C.x) + HN, Math.floor(wy - B.C.y) + HN, Math.floor(wz - B.C.z) + HN];
    B.get = (wx, wy, wz) => { if (!B.A) return 0; const x = Math.floor(wx - B.C.x) + HN, y = Math.floor(wy - B.C.y) + HN, z = Math.floor(wz - B.C.z) + HN; return x < 0 || y < 0 || z < 0 || x >= N || y >= N || z >= N ? 0 : B.A[li(x, y, z)]; };
    B.dist = p => Math.hypot(p.x - B.C.x, p.y - B.C.y, p.z - B.C.z);
    B.gen = () => { const t = performance.now(), A = new Uint8Array(N * N * N); let s = (0x5eed + d.id.charCodeAt(1) * 977 + ((typeof gSeed !== 'undefined' ? gSeed | 0 : 0) >>> 0) * 7) >>> 0; const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
      const CR = []; for (let i = 0; i < d.cr; i++) { const u = rnd() * 2 - 1, a = rnd() * 6.283, w = Math.sqrt(1 - u * u), r = 0.05 + Math.pow(rnd(), 2) * 0.3; CR.push([w * Math.cos(a), u, w * Math.sin(a), r, r * RM * (0.22 + rnd() * 0.12)]); }
      const TP = d.top(), ST = d.rock(), DP = d.deep ? d.deep() : 0, BR = T.HBEDROCK || T.BEDROCK || T.STONE, p1 = rnd() * 6, p2 = rnd() * 6;
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) for (let z = 0; z < N; z++) { const dx = x - HN + 0.5, dy = y - HN + 0.5, dz = z - HN + 0.5, r = Math.hypot(dx, dy, dz); if (r > RM + d.bump + 4) continue;
        let b; if (r < 3) b = BR; else if (r < RM - 9 - d.bump) { b = DP && r < RM * 0.62 ? DP : ST; if (d.ores) for (const o of d.ores) if (RM - r > o[2] && rnd() < o[1] && o[0]()) { b = o[0](); break; } } else { const nx = dx / r, ny = dy / r, nz = dz / r; let h = RM + d.bump * Math.sin(nx * 7 + nz * 3 + p1) * Math.sin(ny * 6 - nx * 2 + p2);
          for (const c of CR) { const q = Math.acos(Math.max(-1, Math.min(1, nx * c[0] + ny * c[1] + nz * c[2]))) / c[3]; if (q < 1) h -= c[4] * (1 - q * q) - c[4] * 0.3; else if (q < 1.6) h += c[4] * 0.3 * (1 - (q - 1) / 0.6); }
          if (r > h) continue; b = h - r < (d.id === 'moon' ? 3 : 2) ? TP : ST; if (b === ST && d.ores && h - r > 4) for (const o of d.ores) if (h - r > o[2] && rnd() < o[1] && o[0]()) { b = o[0](); break; } }
        A[li(x, y, z)] = b; }
      for (const [i, b] of B.edits) A[i] = b; B.A = A; B.gms = Math.round(performance.now() - t); };
    B.surfR = p => { if (!B.A) B.gen(); v1.set(p.x - B.C.x, p.y - B.C.y, p.z - B.C.z).normalize(); for (let r = RM + d.bump + 9; r > 2; r -= 0.25) if (B.get(B.C.x + v1.x * r, B.C.y + v1.y * r, B.C.z + v1.z * r)) return r + 0.25; return RM; };
    function mesh(cx, cy, cz) { const k = (cx * CN + cy) * CN + cz, old = B.CM.get(k); if (old) { B.G.remove(old); old.geometry.dispose(); B.CM.delete(k); } const pos = [], cl = [], A = B.A;
      for (let x = cx * CS; x < Math.min(N, cx * CS + CS); x++) for (let y = cy * CS; y < Math.min(N, cy * CS + CS); y++) for (let z = cz * CS; z < Math.min(N, cz * CS + CS); z++) { const b = A[li(x, y, z)]; if (!b) continue; const c = colOf(b, d.tint);
        for (let f = 0; f < 6; f++) { const nx = x + FD[f][0], ny = y + FD[f][1], nz = z + FD[f][2]; if (nx >= 0 && ny >= 0 && nz >= 0 && nx < N && ny < N && nz < N && A[li(nx, ny, nz)]) continue;
          const sh = 0.3 + 0.42 * Math.max(0, FD[f][0] * SUN.x + FD[f][1] * SUN.y + FD[f][2] * SUN.z) + 0.28 * Math.max(0, ((x - HN) * SUN.x + (y - HN) * SUN.y + (z - HN) * SUN.z) / RM) + ((x * 7 + y * 3 + z * 5) % 5) * 0.012;
          const q = QV[f]; for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(x + q[i][0], y + q[i][1], z + q[i][2]); cl.push(c[0] * sh, c[1] * sh, c[2] * sh); } U.faces++; } }
      if (!pos.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, MAT); m.userData.sys = 1; B.G.add(m); B.CM.set(k, m); }
    B.drop = () => { for (const m of B.CM.values()) { B.G.remove(m); m.geometry.dispose(); } B.CM.clear(); B.built = false; B.todo = null; B.G.visible = false; };
    B.free = () => { B.drop(); B.A = null; };
    B.stream = eye => { const dd = B.dist(eye); if (dd > 1400) { if (B.built || B.todo) B.drop(); if (B.A && dd > 2200) B.A = null; return false; }
      if (!B.A) B.gen(); if (!B.built && !B.todo) { B.todo = []; for (let x = 0; x < CN; x++) for (let y = 0; y < CN; y++) for (let z = 0; z < CN; z++) B.todo.push([x, y, z]); }
      const t = performance.now(); if (B.todo) { while (B.todo.length && performance.now() - t < 6) mesh(...B.todo.pop()); if (!B.todo.length) { B.todo = null; B.built = true; B.chunks = B.CM.size; } }
      for (const k of B.dirty) { B.dirty.delete(k); mesh(Math.floor(k / (CN * CN)), Math.floor(k / CN) % CN, k % CN); if (performance.now() - t > 8) break; }
      B.G.visible = B.built; return B.built; };
    B.set = (wx, wy, wz, b) => { if (!B.A) B.gen(); const [x, y, z] = B.loc(wx, wy, wz); if (x < 0 || y < 0 || z < 0 || x >= N || y >= N || z >= N) return; const i = li(x, y, z); B.A[i] = b; B.edits.set(i, b);
      for (const [a, c, e] of [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { const X = Math.floor((x + a) / CS), Yc = Math.floor((y + c) / CS), Z = Math.floor((z + e) / CS); if (X >= 0 && Yc >= 0 && Z >= 0 && X < CN && Yc < CN && Z < CN) B.dirty.add((X * CN + Yc) * CN + Z); } };
    return B; }
  const BS = U.bodies = DEF.map(Body); const BY = {}; for (const b of BS) BY[b.id] = b;
  try { for (const b of BS) { const s = S5().get(b.id); if (!s) continue; if (b.id === 'moon') { delete s.moon; s.at = [432 - 432, 2600, -2200 - 432]; } s.r = b.RM; s.v2 = 1; s.land = null; s.no = null; b.place(); }
    const sh = S5().show; S5().show = function (on) { const r = sh.apply(this, arguments); try { if (on && S5().list) { const e = S5().get('earth'); if (e.g) e.g.visible = false; for (const b of BS) { const s = S5().get(b.id); if (b.built && b.G.visible && s && s.g) s.g.visible = false; } } } catch (e) { ERR('show', e); } return r; }; } catch (e) { ERR('sys', e); }
  // the nearest round planet to a point (within its gravity reach)
  const nb = p => { let best = null, bd = 1e18; for (const b of BS) { const d = b.dist(p) - b.GR; if (d < bd) { bd = d; best = b; } } return bd < 0 ? best : null; };
  U.body = nb; U.near = p => !!nb(p);
  U.solid = (x, y, z) => { v3.set(x, y, z); const b = nb(v3); return !!(b && b.get(x, y, z)); };
  U.get = (x, y, z) => { v3.set(x, y, z); const b = nb(v3); return b ? b.get(x, y, z) : 0; };
  U.dist = p => { const b = nb(p) || BS[0]; return b.dist(p); };
  U.up = (p, o) => { const b = nb(p) || BS[0]; return (o || new THREE.Vector3()).set(p.x - b.C.x, p.y - b.C.y, p.z - b.C.z).normalize(); };
  U.surfR = p => (nb(p) || BS[0]).surfR(p);
  Object.defineProperty(U, 'RM', {get: () => (U.cur || BS[0]).RM}); Object.defineProperty(U, 'C', {get: () => (U.cur || BS[0]).C});
  U.alt = p => { const b = nb(p); return b ? b.dist(p) - b.RM : 1e9; };
  // ---------- walking on a planet ----------
  const Q = U.Q = new THREE.Vector3(), V = new THREE.Vector3(), F = U.F = new THREE.Quaternion(); let onG = false;
  const park = () => { P.x = 432; P.z = 4; P.y = H + 60; P.vy = 0; P.onGround = true; P.fallTop = null; };
  U.start = p => { const b = nb(p); if (!b) return; U.cur = b; if (!b.A) b.gen(); Q.copy(p); V.set(0, 0, 0); U.up(Q, v1); F.setFromUnitVectors(Y, v1); U.mode = 'moon'; if (PD()) PD().eva = true; window.__thirdPerson = window.thirdPerson = false; onG = false; sync(); };
  U.stop = () => { U.mode = null; if (PD()) PD().eva = false; window.__spaceHud = null; };
  U.land = p => { const b = nb(p); if (!b) return; U.up(p, v3); const r = b.surfR(p); U.start(v2.copy(b.C).addScaledVector(v3, r + 0.05)); };
  const hit = (p, u, h) => U.solid(p.x + u.x * h, p.y + u.y * h, p.z + u.z * h);
  function body(p, u, f, r) { for (const h of [0.2, 1.0, 1.6]) for (const [a, b] of [[0, 0], [0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]]) { if (U.solid(p.x + u.x * h + f.x * a + r.x * b, p.y + u.y * h + f.y * a + r.y * b, p.z + u.z * h + f.z * a + r.z * b)) return true; } return false; }
  function feet(p, u, f, r) { for (const [a, b] of [[0.25, 0.25], [-0.25, 0.25], [0.25, -0.25], [-0.25, -0.25]]) if (U.solid(p.x + f.x * a + r.x * b - u.x * 0.02, p.y + f.y * a + r.y * b - u.y * 0.02, p.z + f.z * a + r.z * b - u.z * 0.02)) return true; return false; }
  const fw = new THREE.Vector3(), rt = new THREE.Vector3(), vt = new THREE.Vector3(), np = new THREE.Vector3(), up = new THREE.Vector3();
  U.frame = (yaw, pitch, o) => { eY.set(pitch || 0, yaw, 0); return (o || q2).copy(F).multiply(q1.setFromEuler(eY)); };
  function step(dt, mx, mz) { const b = nb(Q); if (b) U.cur = b; const B = U.cur; wup(B, Q, up); const r = B.dist(Q); v1.set(0, 1, 0).applyQuaternion(F); q1.setFromUnitVectors(v1, up); q2.copy(q1).multiply(F); F.slerp(q2, 1 - Math.exp(-dt * 6)).normalize();
    U.frame(P.yaw, 0); fw.set(0, 0, -1).applyQuaternion(q2); fw.addScaledVector(up, -fw.dot(up)).normalize(); rt.crossVectors(fw, up).normalize();
    const g = b ? 24 * B.g * Math.min(1, (B.RM / r) * (B.RM / r)) : 0, jump = !!(keys.Space || jumpHeld || jumpHeldPad), jet = PD() && PD().jet();
    let vr = V.dot(up); vt.copy(V).addScaledVector(up, -vr); v2.set(0, 0, 0).addScaledVector(fw, mz).addScaledVector(rt, mx).multiplyScalar(4.3);
    if (onG) vt.copy(v2); else vt.lerp(v2, Math.min(1, dt * (jet ? 3 : 1)));
    if (onG && jump) vr = 6 * Math.sqrt(Math.max(0.17, B.g) / 0.17) * (B.g < 0.1 ? 0.6 : 1); else if (jet && jump) vr += 9 * dt; if (jet && (keys.ShiftLeft || sneakHeld) && !onG) vr -= 9 * dt; jumpReq = false; jumpBuf = 0; vr -= g * dt;
    np.copy(Q).addScaledVector(vt, dt); if (body(np, up, fw, rt)) { v3.copy(np).addScaledVector(up, 1.05); if (onG && !body(v3, up, fw, rt)) np.copy(v3); else { np.copy(Q); vt.set(0, 0, 0); } }
    np.addScaledVector(up, vr * dt); if (vr < 0 && feet(np, up, fw, rt)) { for (let k = 0; k < 40 && feet(np, up, fw, rt); k++) np.addScaledVector(up, 0.05); vr = 0; } else if (vr > 0 && hit(np, up, 1.85)) { np.addScaledVector(up, -vr * dt); vr = 0; }
    v3.copy(np).addScaledVector(up, -0.08); onG = feet(v3, up, fw, rt); Q.copy(np); V.copy(vt).addScaledVector(up, vr); sync(); }
  // v1.1.23: on foot, down is the block face you stand on (the planet axis you are most over), so blocks stand upright like on a flat map;
  // it only swaps to the next face once you are well past the 45 degree line, and the view rolls smoothly over to it
  let AX = null; function wup(B, p, o) { const d = [p.x - B.C.x, p.y - B.C.y, p.z - B.C.z]; let b = 0; for (let k = 1; k < 3; k++) if (Math.abs(d[k]) > Math.abs(d[b])) b = k;
    let i = AX && AX.b === B ? AX.i : -1, sg = AX && AX.b === B ? AX.s : 0; if (i < 0 || Math.abs(d[b]) > Math.abs(d[i]) * 1.12 || Math.sign(d[i]) !== sg) { i = b; sg = Math.sign(d[b]) || 1; } AX = {b: B, i, s: sg}; U.ax = 'xyz'[i] + (sg > 0 ? '+' : '-');
    o.set(0, 0, 0).setComponent(i, sg); return o; }
  U.wup = wup;
  const eye = new THREE.Vector3();
  function sync() { if (U.cur) wup(U.cur, Q, up); else U.up(Q, up); eye.copy(Q).addScaledVector(up, 1.62); if (PD()) { const E = PD().E; E.x = eye.x; E.y = eye.y - 1.6; E.z = eye.z; E.vx = E.vy = E.vz = 0; } park(); const B = U.cur;
    window.__spaceHud = B.name + '   ' + (B.dist(Q) - B.RM < 20 ? 'gravity ' + B.g + ' g' : 'height ' + Math.round(B.dist(Q) - B.RM)); }
  // ---------- mine and place on any side ----------
  function ray() { U.frame(P.yaw, P.pitch); const d = v1.set(0, 0, -1).applyQuaternion(q2); let prev = null; for (let t = 0; t < 6; t += 0.05) { const x = eye.x + d.x * t, y = eye.y + d.y * t, z = eye.z + d.z * t, c = [Math.floor(x), Math.floor(y), Math.floor(z)];
      if (U.solid(x, y, z)) return {hit: c, prev}; prev = c; } return null; }
  const BL = new Set(); try { for (const k in T) if (typeof T[k] === 'number' && T[k] > 0) BL.add(T[k]); } catch (_) {}
  U.mine = () => { if (U.mode !== 'moon') return; const r = ray(); if (!r) return; const b = U.get(r.hit[0] + 0.5, r.hit[1] + 0.5, r.hit[2] + 0.5); if (!b || b === (T.HBEDROCK || T.BEDROCK)) return; U.cur.set(r.hit[0], r.hit[1], r.hit[2], 0); try { addItem(b, 1); renderHotbar(); } catch (_) {} U.mined++; };
  U.place = () => { if (U.mode !== 'moon') return; const r = ray(); if (!r || !r.prev) return; const id = selId; if (!BL.has(id) || cnt(id) <= 0) return; const p = r.prev; v2.set(p[0] + 0.5, p[1] + 0.5, p[2] + 0.5);
    if (v2.distanceTo(Q) < 1.1 || v2.distanceTo(eye) < 1.0) return; U.cur.set(p[0], p[1], p[2], id); try { useUp(id, 1); renderHotbar(); } catch (_) {} U.placed++; };
  // v1.1.25: mouse, pad and touch mining/placing now go through C314
  const bt = (t, css, f) => { const b = document.createElement('div'); b.textContent = t; b.style.cssText = 'position:fixed;z-index:45;padding:10px 14px;border-radius:14px;font:bold 14px sans-serif;color:#fff;background:rgba(60,60,70,.8);border:2px solid #ccc;user-select:none;touch-action:none;display:none;' + css;
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); f(); }); document.body.appendChild(b); return b; };
  const bM = bt('MINE', 'right:22%;bottom:150px;', () => U.mine()), bP = bt('PLACE', 'right:22%;bottom:220px;', () => U.place()); bM.dataset.testid = 'moon-mine'; bP.dataset.testid = 'moon-place';
  // ---------- hooks: walking, and the rocket lands on any round planet ----------
  try { const upd = updatePlayer; updatePlayer = function (dt, mx, mz) { try { const d = Math.min(dt, 0.05), R = R9();
        if (U.mode === 'moon') { if (DIM.cur || !started) U.stop(); else { step(d, mx || 0, mz || 0); return 0; } }
        if (R && R.on && R.V && U.near(R.V)) { const r0 = upd.apply(this, arguments); rocket(d); return r0; } } catch (e) { ERR('upd', e); } return upd.apply(this, arguments); }; } catch (e) { ERR('upd0', e); }
  function rocket(dt) { const R = R9(), V9 = R.V, vel = R.vel, B = nb(V9); if (!B) return; U.up(V9, up); const r = B.dist(V9), s = B.surfR(V9), thr = R.thr;
    if (r < s + 0.3) { V9.x = B.C.x + up.x * (s + 0.3); V9.y = B.C.y + up.y * (s + 0.3); V9.z = B.C.z + up.z * (s + 0.3); const vr = vel.x * up.x + vel.y * up.y + vel.z * up.z; if (vr < 0) { vel.x -= vr * up.x; vel.y -= vr * up.y; vel.z -= vr * up.z; }
      if (!thr) { vel.x = vel.y = vel.z = 0; R.landed = true; } }
    else { const g = 24 * B.g * Math.min(1, (B.RM / r) * (B.RM / r)) * 0.4; vel.x -= up.x * g * dt; vel.y -= up.y * g * dt; vel.z -= up.z * g * dt; } }
  try { const R = R9(), ex = R.exit, bd = R.board; R.exit = function () { try { const B = R.on && nb(R.V); if (B) { if (B.dist(R.V) - B.surfR(R.V) > 6) { toast('Land on ' + B.name.toLowerCase() + ' first, then EXIT'); return; } R.on = false; window.__thirdPerson = window.thirdPerson = false;
          U.up(R.V, up); v1.set(1, 0, 0); v1.addScaledVector(up, -v1.dot(up)); if (v1.lengthSq() < 0.01) v1.set(0, 0, 1); v1.normalize(); U.land(v2.copy(R.V).addScaledVector(v1, 4)); R.ui(); toast(B.name + '! Walk all the way round - the ground is always down'); return; } } catch (e) { ERR('ex', e); } return ex.apply(this, arguments); };
      R.board = function () { if (U.mode === 'moon') U.stop(); return bd.apply(this, arguments); }; } catch (e) { ERR('rk', e); }
  try { const rr = renderer.render; renderer.render = function (s, c) { try { if (U.mode === 'moon' && s === scene) { U.frame(P.yaw, P.pitch, c.quaternion); c.position.copy(eye); } } catch (e) { ERR('rw', e); } return rr.apply(this, arguments); }; } catch (e) { ERR('rw0', e); }
  (function loop() { requestAnimationFrame(loop); try { if (!started) return; const R = R9(), e = U.mode === 'moon' ? eye : (window.__c309 && __c309.on) ? __c309.pos : R && R.on ? R.V : camera.position;
      for (const b of BS) { if (!b.d0) { b.place(); b.d0 = 1; } if (b.stream(e) && !U.mode) U.cur = U.cur || b; }
      bM.style.display = bP.style.display = U.mode === 'moon' && !menuOpen ? 'block' : 'none'; } catch (er) { ERR('loop', er); } })();
  // ---------- save (v1 saves had only the Moon) ----------
  try { const se = serialize; serialize = function () { const o = se.apply(this, arguments); try { if (o) { const e = {}; for (const b of BS) if (b.edits.size) e[b.id] = Array.from(b.edits); o.c308 = {v: 2, b: e, m: U.mode === 'moon' ? [Q.x, Q.y, Q.z] : null}; } } catch (e) { ERR('ser', e); } return o; }; } catch (e) { ERR('ser0', e); }
  try { const ew = enterWorld; enterWorld = function (save) { try { U.stop(); U.cur = null; const sv = save && save.c308; for (const b of BS) { b.free(); b.d0 = 0; b.edits = new Map(sv ? (sv.v === 2 ? (sv.b[b.id] || []) : b.id === 'moon' ? (sv.e || []) : []) : []); }
        const m = sv && sv.m; if (m) { const t0 = performance.now(), iv = setInterval(() => { try { if (started) { clearInterval(iv); for (const b of BS) b.place(); U.start(new THREE.Vector3(m[0], m[1] + 0.02, m[2])); } else if (performance.now() - t0 > 60000) clearInterval(iv); } catch (e) { ERR('rs', e); } }, 300); } } catch (e) { ERR('ew', e); } return ew.apply(this, arguments); }; } catch (e) { ERR('ew0', e); }
})();
