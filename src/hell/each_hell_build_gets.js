/* ===================== GLX-C175 (v1.0.33): each Hell build gets its own shape and every build is hollow inside - rooms, floors, stairs, doorways, furniture ===================== */
// called from the builders (c168 Hell builds, c153 black castle) with the builder's local kit K (rotation handled by K)
(function c175() {
  const U = window.__c175 = {err: null, hellUp: null, blackUp: 0};
  const BARS = 163, DBS = 230;
  const air = (K, x, y, z) => K.B(x, y, z, 0);
  // ---------- Hell builds: a back hall + an upper floor with two rooms, then a shape of its own per kind ----------
  U.hell = function (K, kind, o) { const {B, h} = K, {F, X0, X1, Z0, S, wl, prop} = o, RT = o.RT, ZP = -7, UF = F + 5;
    const {BS, DB, OB, SS, MG, GR} = window.__c167.ids;
    // partition: the nave in front, the throne hall behind, a pointed doorway between
    for (let x = X0 + 1; x <= X1 - 1; x++) for (let y = F; y <= F + 4; y++) B(x, y, ZP, Math.abs(x + 0.5) < 1.6 && y <= F + 2 ? 0 : wl(x, y, ZP));
    // the upper floor over the throne hall, a rail along its edge, a stair up the east side of the nave
    for (let x = X0 + 1; x <= X1 - 1; x++) for (let z = Z0 + 1; z <= ZP; z++) { B(x, UF, z, S.fl(x, z)); for (let y = UF + 1; y < RT; y++) if (y <= UF + 3) B(x, y, z, 0); }
    for (let x = X0 + 1; x <= X1 - 1; x++) if (x !== 4) B(x, UF + 1, ZP, BARS);
    for (let k = 0; k <= 5; k++) { const z = -1 - k; for (let y = F; y < F + k; y++) B(4, y, z, wl(4, y, z)); K.stair(4, F + k, z, 0, DBS); for (let y = F + k + 1; y <= F + k + 3; y++) B(4, y, z, 0); }
    // upstairs: a wall down the middle with a doorway - a bedchamber (west) and a store room (east)
    for (let z = Z0 + 1; z < ZP; z++) for (let y = UF + 1; y <= UF + 4 && y < RT; y++) B(0, y, z, (z === -11 || z === -10) && y <= UF + 2 ? 0 : wl(0, y, z));
    K.bed(-4, UF + 1, -12, 0); K.bed(-2, UF + 1, -12, 0); K.chest(-5, UF + 1, -9, 1, [[IT.GOLDINGOT, 2], [IT.BONE || IT.STICK, 3]]);
    K.lamp(-1, UF + 3, -13, 3, {soul: !!S.soul}); K.lamp(1, UF + 3, -13, 1, {soul: !!S.soul});
    B(3, UF + 1, -12, T.TABLE); for (const z of [-13, -12]) prop('barrel', 5, UF + 1, z, 1, {}, 'floor'); B(5, UF + 1, -9, T.FURNACE || T.TABLE); K.meta(5, UF + 1, -9, {face: 1});
    prop('rug', -3, UF + 1, -10, 2, {w: 3, d: 3, h: 0.02, v: 2}, 'floor');
    // a shape of its own
    if (kind === 'cathedral') {   // a cross: transept arms either side, opening off the nave
      const top = F + S.nt - 3;
      for (const sx of [-1, 1]) { for (let a = 7; a <= 13; a++) for (let z = -8; z <= -4; z++) { const x = sx * a, e = a === 13 || z === -8 || z === -4;
          B(x, 0, z, S.fl(x, z)); for (let y = F; y < top; y++) B(x, y, z, e ? wl(x, y, z) : 0); B(x, top, z, (x + z) & 1 ? S.a : BS); }
        for (let a = 6; a <= 7; a++) for (let y = F; y <= F + 3; y++) for (const z of [-6, -5]) B(sx * a, y, z, 0);
        for (const z of [-7, -5]) for (let y = F + 3; y <= F + 6; y++) __rpane(K, sx * 13, y, z);
        K.lamp(sx * 12, F + 3, -6, sx > 0 ? 3 : 1, {}); B(sx * 10, F, -6, S.a); prop('brazier', sx * 10, F + 1, -6, 2, {}, 'floor'); }
    } else if (kind === 'abbey') {   // a cloister: an arcaded square with a soul garden, off the east wall
      for (let x = 9; x <= 15; x++) for (let z = -8; z <= 1; z++) { const e = x === 9 || x === 15 || z === -8 || z === 1, w = x === 10 || x === 14 || z === -7 || z === 0;
        B(x, 0, z, e || w ? DB : SS); for (let y = F; y <= F + 4; y++) B(x, y, z, 0);
        if (e && ((x + z) & 1) === 0) for (let y = F; y <= F + 3; y++) B(x, y, z, S.a);
        if (e || w) B(x, F + 4, z, (x + z) & 1 ? BS : DB); }
      for (const [x, z] of [[12, -4], [12, -3]]) prop('skull', x, F, z, 2, {}, 'floor'); prop('soulgl', 12, F, -5, 2, {}, 'floor');
      for (let y = F; y <= F + 2; y++) for (let x = 6; x <= 8; x++) B(x, y, -4, 0); K.lamp(10, F + 2, -7, -1, {soul: true});
    } else if (kind === 'keep') {   // a square curtain wall round it, crenellated, the pinnacles as its towers
      for (let x = -12; x <= 12; x++) for (let z = -12; z <= 12; z++) { if (Math.max(Math.abs(x), Math.abs(z)) !== 12) continue;
        if (z === 12 && x >= -2 && x <= 1) continue; if (x === -12 && z >= 1 && z <= 5) continue;
        for (let y = F; y <= F + 6; y++) if (!K.G(x, y, z)) B(x, y, z, wl(x, y, z)); if (((x + z) & 1) === 0 && !K.G(x, F + 7, z)) B(x, F + 7, z, S.a); }
      for (const [x, z] of [[-12, -6], [12, -6], [-6, -12], [6, -12]]) for (let y = F + 3; y <= F + 4; y++) __rpane(K, x, y, z);
    } else {   // bastion: a low round drum wall, a gate in the front
      for (let x = -16; x <= 16; x++) for (let z = -16; z <= 16; z++) { const r = Math.hypot(x, z); if (r < 14.5 || r > 16) continue; if (z > 0 && Math.abs(x + 0.5) < 3) continue;
        for (let y = F; y <= F + 5; y++) if (!K.G(x, y, z)) B(x, y, z, y === F + 5 ? S.a : wl(x, y, z)); if (((x + z) & 1) === 0 && !K.G(x, F + 6, z)) B(x, F + 6, z, wl(x, F + 6, z)); }
    }
  };
  // ---------- the black castle: two wings in the courtyard, each two rooms, one opening into the throne hall ----------
  U.black = function (K, o) { const {B} = K, {F, blk} = o;
    for (const sx of [-1, 1]) { const xi = sx * 5, xo = sx * 9;
      for (let a = 5; a <= 9; a++) for (let z = 0; z <= 8; z++) { const x = sx * a, e = a === 5 || a === 9 || z === 0 || z === 8; B(x, 0, z, e ? blk(x, 0, z) : ((x + z) & 1 ? 228 : T.OBSIDIAN || 189));
        for (let y = F; y <= F + 4; y++) B(x, y, z, e || z === 4 ? blk(x, y, z) : 0); B(x, F + 5, z, blk(x, F + 5, z)); if (e && ((x + z) & 1) === 0) B(x, F + 6, z, blk(x, F + 6, z)); }
      for (const z of [2, 6]) for (let y = F; y <= F + 1; y++) B(xi, y, z, 0);   // doors from the courtyard
      for (let y = F; y <= F + 1; y++) B(sx * 7, y, 4, 0);                        // between the two rooms
      for (const z of [3, 5]) for (let y = F + 2; y <= F + 3; y++) __rpane(K, xi, y, z);
      for (const z of [1, 7]) K.lamp(sx * 6, F + 3, z, sx > 0 ? 1 : 3, {}); }
    // west wing: barracks
    K.bed(-8, F, 2, 0); K.bed(-8, F, 7, 0); K.chest(-6, F, 7, 1, [[IT.BONE || IT.STICK, 4], [IT.COAL, 4]]); K.prop('rug', -7, F, 2, 2, {w: 1, d: 2, h: 0.02, v: 2}, 'floor');
    // east wing: armoury and kitchen, with a door into the throne hall
    B(7, F, 1, T.TABLE); K.prop('barrel', 8, F, 1, 3, {}, 'floor'); K.prop('barrel', 8, F, 2, 3, {}, 'floor'); K.prop('srack', 8, F, 6, 3, {}, 'floor'); K.chest(8, F, 7, 3, [[IT.IRONINGOT, 3], [IT.GOLDINGOT, 1]]);
    B(8, F, 5, T.FURNACE || T.TABLE); K.meta(8, F, 5, {face: 3});
    for (const z of [-1, 0]) for (let y = F; y <= F + 1; y++) B(6, y, z, 0);
  };
  // ---------- existing worlds, once: rebuild the black castle; rebuild each Hell build in place (your own blocks stay) ----------
  const ew = enterWorld; enterWorld = function (save) { try { if (current) current.c175u = save ? !!save.c175 : true; } catch (_) {} return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments);
    try { if (d && current) { if (!DIM.cur && current.c175u) d.c175 = 1; if (DIM.cur === 'hell' && window.__c167 && __c167.c175h) d.c175h = 1; } } catch (_) {} return d; };
  try { const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && d.dim === 'hell' && window.__c167) __c167.c175h = !!d.c175h; } catch (_) {} return r; }; } catch (_) {}
  try { const gh = genHell; genHell = function () { const r = gh.apply(this, arguments); try { if (window.__c167) __c167.c175h = true; } catch (_) {} return r; }; } catch (_) {}
  function upBlack() { const C = window.__c151, c = g9castles.find(q => q[0] === 'black'); if (!C || !C.work || !c) return; const was = window.__c102 && __c102.done, bc = c37busy;
    try { if (window.__c102) __c102.done = g9castles.map(q => ({k: q[0], cx: q[1], cz: q[2], gy: SEA + (q[0] === 'human' ? 5 : 6)})); c37busy = true; C.work('black'); } finally { c37busy = bc; if (window.__c102) __c102.done = was; }
    for (let x = c[1] - 27; x <= c[1] + 27; x += 8) for (let z = c[2] - 27; z <= c[2] + 27; z += 8) try { markDirty(x, z); } catch (_) {}
    try { scanLights(); validateLights(); } catch (_) {} U.blackUp = 1; }
  function upHell(i) { const C = window.__c167, b = C.b[i]; if (!b) return; const [, cx, cz, gy] = b;
    for (let x = cx - 24; x <= cx + 24; x++) for (let z = cz - 24; z <= cz + 24; z++) { if (x < 1 || z < 1 || x > W - 2 || z > D - 2 || Math.hypot(x - cx, z - cz) > 23.5) continue;
      for (let y = gy + 1; y <= Math.min(H - 3, gy + 42); y++) { const j = idx(x, y, z); if (!world[j] || mine(j)) continue; world[j] = 0; const k = keyOf(x, y, z); entMeta.delete(k); try { chests.delete(k); doorState.delete(k); } catch (_) {} } }
    const keep = window.__c150 ? __c150.props : null, made = [];
    try { if (window.__c150) __c150.props = made; const K = __c151.ctx([b[0], b[1], b[2]], i, b[3], b[4]); window.__c168.build(K, b[0]); } finally { if (window.__c150) __c150.props = keep; }
    C.props = C.props.filter(p => p.c !== i || p.t === 'chain' && p.y > gy + 30).concat(made);
    for (let x = cx - 26; x <= cx + 26; x += 8) for (let z = cz - 26; z <= cz + 26; z += 8) try { markDirty(Math.max(0, Math.min(W - 1, x)), Math.max(0, Math.min(D - 1, z))); } catch (_) {} }
  let wait = 4;
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments);
    try { if (!started || paused || typeof current === 'undefined' || !current) return r; if ((wait -= (+dt || 0.016)) > 0) return r; wait = 0.4;
      if (!DIM.cur && !current.c175u && current.c162u) { current.c175u = true; if (current.g25 && typeof g9castles !== 'undefined' && g9castles && genVer === GEN9 && W >= 600 && current.mode !== 'creative' && !cityGen) upBlack(); }
      const C = window.__c167; if (DIM.cur === 'hell' && C && C.v && !C.retro && !C.c175h && C.b && C.b.length && !DIM.busy) {
        if (!U.hellUp) U.hellUp = C.b.map((_, i) => i); const i = U.hellUp.shift(); if (i !== undefined) upHell(i);
        if (!U.hellUp.length) { C.c175h = true; U.hellUp = null; try { if (window.__c169) __c169.clear(); } catch (_) {} try { scanLights(); validateLights(); } catch (_) {}
          try { let x = Math.floor(P.x), z = Math.floor(P.z), y = Math.floor(P.y); const free = yy => !solid(x, yy, z) && !solid(x, yy + 1, z); if (!free(y)) { while (y < H - 3 && !free(y)) y++; P.y = y + 0.01; P.vy = 0; } } catch (_) {} } } } catch (e) { U.err = String(e && e.stack || e); }
    return r; };
})();
