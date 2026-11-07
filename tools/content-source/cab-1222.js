/* GLX-CAB1222 (v1.2.22): time box cabin with its own floor, its own blocks, and walking while it hovers.
   1. Flying: the flight code moves you with the box after the camera was already placed for the frame, so the camera was placed again
      after the box moves, with no bob. That stays for pilot mode (you sit at the stick).
   2. Free walking: the cabin floor is now the box floor itself, at the box height (any fraction of a block), not the nearest whole block
      of the outside world. You stand, walk and jump on it while the box hovers at any height; the box is no longer snapped to a whole
      block when you let go of the stick. If the box is moved while you walk (a landing, a lift out of rock), you are carried with it by
      the same amount, once, before the camera is placed, so the room and the camera never part for a frame.
   3. Blocks inside the cabin: plain solid blocks can be placed and mined in the room. They are kept in the cabin itself, in cabin
      coordinates, saved with the box (field cab1222 next to its position; older saves simply have none), drawn as part of the room,
      and you collide with them and can stand on them. Nothing is ever written to the outside world from inside the cabin.
      Chests, furnaces, doors, beds, fluids, plants, torches, stairs, slabs, panes, fences and other special blocks are not supported in the
      cabin yet and say so. A block cannot be placed inside you, in the doorway, on the console or on the pilot spot. */
(function cab1222() {
  const T = window.__tbox, F = () => window.__tbox3; if (!T) return;
  const U = window.__cab1222 = {err: null, cam: 0, blocked: 0, carried: 0, camFix: 0, snaps: 0, placed: 0, mined: 0, refused: 0, saves: 0, loads: 0, n: 0, last: ''};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const pil = () => { const f = F(); return !!(f && f.pilot && T.inside); };
  const RR = T.RR, HW = T.HW, DW = T.DW || 0.5, CZ = HW - RR, MAXB = 256, JH = 8;
  const S = () => T.S;
  const act = () => { const s = S(); return !!(s && s.on && T.inside && !(typeof DIM !== 'undefined' && DIM && DIM.cur)); };
  const free = () => act() && !pil();
  const PR = () => (typeof R === 'number' ? R : 0.3), PH = () => (typeof HEIGHT === 'number' ? HEIGHT : 1.8);
  U.inRoom = (x, y, z) => { const s = S(); if (!s || !s.on || !T.inside) return false; const dx = x + 0.5 - s.x, dz = z + 0.5 - (s.z + CZ), fy = Math.floor(s.y + 0.01);
    return dx * dx + dz * dz < (RR + 0.6) * (RR + 0.6) && z + 0.5 < s.z + HW + 0.2 && y >= fy - 1 && y < fy + 9; };
  const inXZ = (x, z) => { const s = S(), dx = x - s.x, dz = z - (s.z + CZ); return dx * dx + dz * dz < (RR + 0.6) * (RR + 0.6) && z < s.z + HW + 0.2; };
  // ---------- cabin blocks: local cells (i, j, k) cover [S + i, S + i + 1) on each axis; j = 0 stands on the floor ----------
  const B = U.B = new Map(); const K = (i, j, k) => i + ',' + j + ',' + k;
  U.cellOf = (x, y, z) => { const s = S(); return [Math.floor(x - s.x), Math.floor(y - s.y), Math.floor(z - s.z)]; };
  U.get = (i, j, k) => B.get(K(i, j, k)) || 0;
  const boxHit = (x, y, z) => { const s = S(), r = PR(), h = PH(), e = 1e-4; if (!B.size) return false;
    const i0 = Math.floor(x - r - s.x + e), i1 = Math.floor(x + r - s.x - e), j0 = Math.floor(y - s.y + e), j1 = Math.floor(y + h - s.y - e), k0 = Math.floor(z - r - s.z + e), k1 = Math.floor(z + r - s.z - e);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) if (B.has(K(i, j, k))) return true; return false; };
  U.hit = (x, y, z) => { if (!free() && !(act() && pil())) return false; const s = S(); if (inXZ(x, z) && y < s.y - 1e-4) return true; return boxHit(x, y, z); };
  // support under the feet: the floor, or the top of a cabin block, within a small step
  U.support = (x, y, z) => { const s = S(); if (!inXZ(x, z)) return null; let best = s.y; const r = PR();
    for (const key of B.keys()) { const [i, j, k] = key.split(',').map(Number); if (x + r <= s.x + i || x - r >= s.x + i + 1 || z + r <= s.z + k || z - r >= s.z + k + 1) continue; const top = s.y + j + 1; if (top <= y + 0.25 && top > best) best = top; }
    return best; };
  // ---------- drawing: one shared cube, one material per block type, inside the room (so it moves with the box) ----------
  const grp = new THREE.Group(); grp.name = 'cab1222'; let geo = null; const MATS = new Map(), MESH = new Map();
  try { if (T.parts && T.parts.room) T.parts.room.add(grp); } catch (e) { ERR('grp', e); }
  const SMf = m => { try { if (T.SM) T.SM(m); m.stencilFunc = T.camIn ? THREE.AlwaysStencilFunc : THREE.EqualStencilFunc; } catch (_) {} return m; };
  function mat(id) { if (MATS.has(id)) return MATS.get(id); const src = typeof BLOCK_MATS !== 'undefined' ? BLOCK_MATS[id] : null, L = [].concat(src || []);
    const mk = m => SMf(new THREE.MeshBasicMaterial({map: m && m.map || null, color: m && m.color ? m.color.clone() : new THREE.Color(0x999999)}));
    const out = L.length > 1 ? L.map(mk) : mk(L[0]); MATS.set(id, out); return out; }
  function show(key, id) { const old = MESH.get(key); if (old) { grp.remove(old); MESH.delete(key); } if (!id) return; if (!geo) geo = new THREE.BoxGeometry(1, 1, 1);
    const [i, j, k] = key.split(',').map(Number), m = new THREE.Mesh(geo, mat(id)); m.position.set(i + 0.5, j + 0.5, k + 0.5); m.frustumCulled = false; m.renderOrder = 5; m.userData.cab = key; grp.add(m); MESH.set(key, m); }
  const redraw = () => { for (const k of [...MESH.keys()]) show(k, 0); for (const [k, id] of B) show(k, id); };
  // ---------- saving: an extra optional field on the box save; position saving is unchanged ----------
  const wk = () => 'glx_tbox_' + ((typeof current !== 'undefined' && current && current.id) || 'w');
  let enc = '[]'; const encode = () => { enc = JSON.stringify([...B].map(([k, id]) => k.split(',').map(Number).concat(id))); };
  const sv0 = T.save; T.save = function () { if (!B.size && enc === '[]') return sv0.apply(this, arguments); try { const s = S(); localStorage.setItem(wk(), '{"x":' + JSON.stringify(s.x) + ',"y":' + JSON.stringify(s.y) + ',"z":' + JSON.stringify(s.z) + ',"cab1222":' + enc + '}'); U.saves++; } catch (_) {} };
  U.load = () => { B.clear(); try { const o = JSON.parse(localStorage.getItem(wk()) || 'null'); const L = o && Array.isArray(o.cab1222) ? o.cab1222 : [];
      for (const e of L.slice(0, MAXB)) if (Array.isArray(e) && e.length === 4 && e.every(Number.isFinite) && okId(e[3])) B.set(K(e[0], e[1], e[2]), e[3]); } catch (_) {} encode(); redraw(); U.n = B.size; U.loads++; };
  let lastKey = null; const watchWorld = () => { const k = (typeof started !== 'undefined' && started) ? wk() : null; if (k && k !== lastKey) { lastKey = k; U.load(); } };
  // ---------- what can go in ----------
  const NO = /chest|furnace|door|bed|water|lava|torch|lantern|lamp|sign|table|cauldron|tnt|ladder|rail|pane|fence|gate|stair|slab|trapdoor|portal|spawner|bucket|seed|sapling|flower|carpet|button|lever|redstone|crop|farm|cake|anvil|banner|pot|barrel|campfire|fire|tv|time box|key|cobweb|snow layer|vine|grass tuft|mushroom|leaves/i;
  function okId(id) { try { if (!PLACEABLE.has(id) || !BLOCK_MATS[id]) return false; if (typeof isPlant === 'function' && isPlant(id)) return false; if (typeof IS_STAIR !== 'undefined' && IS_STAIR[id]) return false; return !NO.test(String(NAMES[id] || '')); } catch (_) { return false; } }
  U.okId = okId;
  function canPut(i, j, k) { const s = S(); if (j < 0 || j >= JH) return 'height'; const cx = i + 0.5, cz = k + 0.5;
    if (Math.abs(cx) < DW + 0.7 && cz > HW - 1.8) return 'doorway'; if (Math.hypot(cx, cz - CZ) > RR - 0.9) return 'wall'; if (Math.hypot(cx, cz - CZ) < 1.7) return 'console'; if (Math.hypot(cx, cz - (CZ + 2.0)) < 0.95) return 'pilot spot';
    if (B.has(K(i, j, k))) return 'taken'; if (B.size >= MAXB) return 'full';
    const r = PR(), h = PH(), x0 = s.x + i, y0 = s.y + j, z0 = s.z + k; if (P.x + r > x0 && P.x - r < x0 + 1 && P.y + h > y0 && P.y < y0 + 1 && P.z + r > z0 && P.z - r < z0 + 1) return 'you'; return ''; }
  U.canPut = canPut;
  const say = m => { try { toast(m); } catch (_) {} };
  const WHY = {height: 'too high', wall: 'against the wall', console: 'on the console', 'pilot spot': 'on the pilot spot', doorway: 'in the doorway', taken: 'there already', full: 'the cabin is full (256 blocks)', you: 'inside you'};
  U.put = (i, j, k, id) => { const w = canPut(i, j, k); if (w) { U.refused++; U.last = w; return w; } B.set(K(i, j, k), id); encode(); show(K(i, j, k), id); T.save(); U.placed++; U.n = B.size; return ''; };
  U.take = (i, j, k) => { const key = K(i, j, k), id = B.get(key); if (!id) return 0; B.delete(key); encode(); show(key, 0); T.save(); U.mined++; U.n = B.size; return id; };
  // ---------- aiming inside the cabin: the nearest cabin block or the floor, in cabin cells ----------
  U.ray = (maxD) => { if (!free()) return null; const s = S(); let o, d; try { d = lookDir(); o = [P.x, P.y + (typeof EYE === 'number' ? EYE : 1.62), P.z]; } catch (_) { return null; }
    let prev = null; for (let t = 0; t < (maxD || 5); t += 0.03) { const x = o[0] + d.x * t, y = o[1] + d.y * t, z = o[2] + d.z * t; if (!inXZ(x, z) || y > s.y + JH + 0.8) return null;
      if (y < s.y) { const c = [Math.floor(x - s.x), 0, Math.floor(z - s.z)]; return {floor: true, hit: null, prev: prev || c}; }
      const c = [Math.floor(x - s.x), Math.floor(y - s.y), Math.floor(z - s.z)]; if (B.has(K(c[0], c[1], c[2]))) return {hit: c, prev, t};
      if (!prev || prev[0] !== c[0] || prev[1] !== c[1] || prev[2] !== c[2]) prev = c; } return null; };
  // ---------- physics: the floor and cabin blocks join the normal collision; a landing on them is a real landing ----------
  try { const co = collides; collides = function (x, y, z) { try { if (act() && U.hit(x, y, z)) return true; } catch (e) { ERR('co', e); } return co.apply(this, arguments); }; } catch (e) { ERR('cow', e); }
  let lastS = null, lastP = null;
  const carry = () => { const s = S(); if (!lastS || !lastP) return false; const dx = s.x - lastS[0], dy = s.y - lastS[1], dz = s.z - lastS[2]; if (!dx && !dy && !dz) return false;
    const still = Math.abs(P.x - lastP[0]) < 1e-9 && Math.abs(P.y - lastP[1]) < 1e-9 && Math.abs(P.z - lastP[2]) < 1e-9; lastS = [s.x, s.y, s.z];
    if (!still) { const along = Math.abs(P.x - lastP[0] - dx) < 1e-6 && Math.abs(P.y - lastP[1] - dy) < 1e-6 && Math.abs(P.z - lastP[2] - dz) < 1e-6; lastP = [P.x, P.y, P.z]; return along ? [dx, dy, dz] : false; }   // the mover already took you along (landings and lifts do): never twice, only the camera follows
    P.x += dx; P.y += dy; P.z += dz; P.fallTop = null; lastP = [P.x, P.y, P.z]; U.carried++; return [dx, dy, dz]; };
  const mark = () => { const s = S(); lastS = [s.x, s.y, s.z]; lastP = [P.x, P.y, P.z]; };
  function snap() { if (P.vy > 0 || (typeof swimming !== 'undefined' && swimming)) return; const sup = U.support(P.x, P.y, P.z); if (sup == null) return; const gap = P.y - sup;
    if (gap > 0.21 || gap < -0.06) return; if (boxHit(P.x, sup, P.z)) return; P.y = sup; P.vy = 0; P.onGround = true; P.fallTop = null; try { groundT = 0.1; } catch (_) {} U.snaps++; }
  try { const up = updatePlayer; updatePlayer = function () { try { watchWorld(); if (free()) carry(); } catch (e) { ERR('pre', e); } const r = up.apply(this, arguments);
      try { if (pil()) { placeCamera(0, 0, 0, 0); U.cam++; } else if (free()) snap(); if (act()) mark(); else { lastS = lastP = null; } } catch (e) { ERR('up', e); } return r; }; } catch (e) { ERR('upw', e); }
  // the box moved between the step and the drawing (a landing runs on its own timer): take you and the camera along now, once
  try { const rr = renderer.render; renderer.render = function (sc, cam) { try { if (sc === scene && cam === camera && free()) { const d = carry(); if (d) { camera.position.x += d[0]; camera.position.y += d[1]; camera.position.z += d[2]; camera.updateMatrixWorld(); U.camFix++; } } } catch (e) { ERR('rr', e); } return rr.apply(this, arguments); }; } catch (e) { ERR('rrw', e); }
  // ---------- placing and mining go to the cabin, never to the outside world ----------
  const deny = () => { U.blocked++; say('That block cannot go there inside the time box'); };
  try { const ui = useItem; useItem = function () { try { if (free() && !(typeof menuOpen !== 'undefined' && menuOpen) && !(typeof paused !== 'undefined' && paused)) { const id = selId, have = cnt(id) > 0;
          if (have && PLACEABLE.has(id)) { const h = U.ray(5);
            if (h && h.prev) { if (!okId(id)) { U.refused++; say('Only plain solid blocks can go in the time box for now'); return; } const w = U.put(h.prev[0], h.prev[1], h.prev[2], id);
              if (w) { say('No room for a block ' + (WHY[w] || 'there')); return; } try { useUp(id, 1); } catch (_) {} try { swing('place'); } catch (_) {} try { sfx('place', 1, matOf(id)); } catch (_) {} try { renderHotbar(); } catch (_) {} return; }
            const r = raycast(5); const c = r && (r.prev || r.hit); if (c && U.inRoom(c[0], c[1], c[2])) { deny(); return; } } } } catch (e) { ERR('ui', e); } return ui.apply(this, arguments); }; } catch (e) { ERR('uiw', e); }
  const mine = U.mine = {key: null, t: 0};
  try { const uI = updateInteraction; updateInteraction = function (dt) { try { const att = (typeof attackMouse !== 'undefined' && attackMouse) || (typeof attackPad !== 'undefined' && attackPad) || (typeof attackTouch !== 'undefined' && attackTouch);
        if (free() && att) { const h = U.ray(5); if (h && h.hit) { const key = K(h.hit[0], h.hit[1], h.hit[2]), b = B.get(key); if (mine.key !== key) { mine.key = key; mine.t = 0; }
            let sp = 1; try { sp = mcMineRate(b); } catch (_) {} if (typeof MODE !== 'undefined' && MODE.instantBreak) sp = 999; const hard = (typeof HARD !== 'undefined' && HARD[b] > 0) ? HARD[b] : 1;
            mine.t += (dt || 0.016) * sp; if (mine.t >= hard) { mine.key = null; mine.t = 0; const id = U.take(h.hit[0], h.hit[1], h.hit[2]); if (id) { try { addItem(id, 1); } catch (_) {} try { sfx('dig', 0.8, matOf(id)); } catch (_) {} try { renderHotbar(); } catch (_) {} } }
            return; } } if (!att) { mine.key = null; mine.t = 0; } } catch (e) { ERR('ia', e); } return uI.apply(this, arguments); }; } catch (e) { ERR('iaw', e); }
  try { const cm = canMine; canMine = function (b, y) { try { if (T.inside && T.S && T.S.on) { const r = raycast(5); if (r && r.hit[1] === y && U.inRoom(r.hit[0], r.hit[1], r.hit[2])) { if (!U._mw || performance.now() - U._mw > 3000) { U._mw = performance.now(); deny(); } return false; } } } catch (e) { ERR('cm', e); } return cm.apply(this, arguments); }; } catch (e) { ERR('cmw', e); }
})();
