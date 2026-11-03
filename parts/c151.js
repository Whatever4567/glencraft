/* ===================== GLX-C151 (v1.0.25): the three castles rebuilt block by block from the concept art (new worlds only) - builder kit + the clan castle ===================== */
(function c151() {
  const U = window.__c151 = {st: {}, err: null, B: {}, ms: 0};
  const FV = [[0, -1], [-1, 0], [0, 1], [1, 0]];
  const elig = () => { try { return !!(current && current.g25 && genVer === GEN9 && !cityGen && !DIM.cur && W >= 600 && current.mode !== 'creative' && window.__c102 && __c102.done); } catch (_) { return false; } };
  const ew = enterWorld; enterWorld = function (save) { try { if (current) current.g25 = save ? !!save.c151 : true; } catch (_) {} return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && current && current.g25) d.c151 = 1; } catch (_) {} return d; };
  const mine = i => typeof placedSet !== 'undefined' && placedSet && placedSet.has(i);
  const inb = (x, y, z) => x > 0 && z > 0 && x < W - 1 && z < D - 1 && y > 0 && y < H - 2;
  U.h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ 0x151; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  // ---------- builder kit: local coords (gate toward local +z), rotated onto the world ----------
  function ctx(c, ci, gy, rot) { const cx = c[1], cz = c[2];
    const rv = (x, z) => { for (let i = 0; i < rot; i++) { const t = x; x = -z; z = t; } return [x, z]; };
    const fi = f => { const [a, b] = rv(FV[f & 3][0], FV[f & 3][1]); return FV.findIndex(q => q[0] === a && q[1] === b); };
    const wp = (dx, y, dz) => { const [a, b] = rv(dx, dz); return [cx + a, gy + y, cz + b]; };
    const K = {cx, cz, gy, rot, ci, kind: c[0], wp, fi, h: (dx, y, dz) => U.h3(cx + dx * 3, gy + y, cz + dz * 7), lights: 0, chestsN: 0};
    K.B = (dx, y, dz, b) => { const [x, Y, z] = wp(dx, y, dz); if (!inb(x, Y, z)) return; const i = idx(x, Y, z); if (mine(i)) return; world[i] = b; };
    K.G = (dx, y, dz) => { const [x, Y, z] = wp(dx, y, dz); return inb(x, Y, z) ? world[idx(x, Y, z)] : 0; };
    K.meta = (dx, y, dz, m) => { const [x, Y, z] = wp(dx, y, dz); entMeta.set(keyOf(x, Y, z), m); };
    K.box = (x0, y0, z0, x1, y1, z1, b) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) K.B(x, y, z, typeof b === 'function' ? b(x, y, z) : b); };
    K.stair = (dx, y, dz, f, id) => { K.B(dx, y, dz, id || 167); K.meta(dx, y, dz, {face: fi(f)}); };
    K.door = (dx, y, dz, f) => { K.B(dx, y, dz, T.DOOR); K.B(dx, y + 1, dz, T.DOORTOP); K.meta(dx, y, dz, {face: fi(f)}); const [x, Y, z] = wp(dx, y, dz); doorState.set(keyOf(x, Y, z), false); };
    K.lamp = (dx, y, dz, wf, o) => { K.B(dx, y, dz, T.TORCH); const m = {face: 0, lamp: 1}; if (wf >= 0) { const [a, b] = rv(FV[wf][0], FV[wf][1]); m.wall = [a, b]; } else if (o && o.ceil) m.ceil = 1; if (o && o.soul) m.soul = 1; K.meta(dx, y, dz, m); K.lights++; };
    K.log = (dx, y, dz, id, ax) => { K.B(dx, y, dz, id || T.LOG); if (ax && window.__c148) { const [x, Y, z] = wp(dx, y, dz); let a = ax; if (rot & 1) a = ax === 1 ? 2 : 1; __c148.setAx(x, Y, z, a); } };
    K.chest = (dx, y, dz, f, loot) => { const [x, Y, z] = wp(dx, y, dz); K.B(dx, y, dz, T.CHEST); const slots = new Array(27).fill(null); loot.forEach(([id, n], j) => { if (id) slots[[4, 10, 13, 16, 12, 14, 22][j]] = [id, n]; }); chests.set(keyOf(x, Y, z), {slots, castle: c[0]}); K.meta(dx, y, dz, {face: fi(f)}); K.chestsN++; return [x, Y, z]; };
    K.bed = (dx, y, dz, f) => { const fw = fi(f), s = Math.round(Math.sin(fw * Math.PI / 2)), cc = Math.round(Math.cos(fw * Math.PI / 2)); const [x, Y, z] = wp(dx, y, dz);
      world[idx(x, Y, z)] = T.BED; entMeta.set(keyOf(x, Y, z), {face: fw, bed: 'foot'}); world[idx(x - s, Y, z - cc)] = T.BED; entMeta.set(keyOf(x - s, Y, z - cc), {face: fw, bed: 'head'}); return [x, Y, z, fw, [x + s, Y, z + cc]]; };
    // prop: f = the way its front faces; an: 'wall' (block behind) | 'floor' | 'ceil' | [dx,y,dz]
    K.prop = (t, dx, y, dz, f, o, an) => { const [x, Y, z] = wp(dx, y, dz), p = Object.assign({t, c: ci, x, y: Y, z, f: fi(f)}, o || {});
      let a = null; if (an === 'wall') a = wp(dx - FV[f][0], y, dz - FV[f][1]); else if (an === 'floor') a = wp(dx, y - 1, dz); else if (Array.isArray(an)) a = wp(an[0], an[1], an[2]);
      if (a && inb(a[0], a[1], a[2])) p.a = [a[0], a[1], a[2], world[idx(a[0], a[1], a[2])]]; if (p.a && !p.a[3]) delete p.a; window.__c150.props.push(p); return p; };
    // round tower shell / disc helpers
    K.disc = (tx, tz, R, y, b) => { const r2 = R * R; for (let a = -Math.ceil(R); a <= Math.ceil(R); a++) for (let q = -Math.ceil(R); q <= Math.ceil(R); q++) if (a * a + q * q <= r2) K.B(tx + a, y, tz + q, typeof b === 'function' ? b(tx + a, y, tz + q) : b); };
    K.cone = (tx, tz, R, y0, n, b) => { for (let L = 0; L < n; L++) { const rr = R - L * (R - 0.4) / (n - 1); K.disc(tx, tz, Math.max(0.5, rr), y0 + L, b); } return y0 + n; };
    K.tower = (tx, tz, R, y0, y1, wall, inner) => { const r2 = R * R, i2 = (R - 1.2) * (R - 1.2); for (let a = -Math.ceil(R); a <= Math.ceil(R); a++) for (let q = -Math.ceil(R); q <= Math.ceil(R); q++) { const d2 = a * a + q * q; if (d2 > r2) continue;
        for (let y = y0; y <= y1; y++) K.B(tx + a, y, tz + q, d2 > i2 ? (typeof wall === 'function' ? wall(tx + a, y, tz + q) : wall) : (inner === undefined ? T.AIR : inner)); } };
    return K; }
  U.ctx = ctx;
  // ---------- site: clear a round plot, level ground, wipe the old castle's chests / doors / metadata ----------
  function clearSite(c, gy, R, top) { const cx = c[1], cz = c[2], R2 = (R + 1) * (R + 1);
    for (const m of [chests, entMeta, doorState, furnaces]) { try { for (const key of [...m.keys()]) { const p = String(key).split(',').map(Number); if (p.length < 3) continue; if ((p[0] - cx) ** 2 + (p[2] - cz) ** 2 <= R2 && p[1] >= gy - 16 && !mine(idx(p[0], p[1], p[2]))) m.delete(key); } } catch (_) {} }
    for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) { if ((x - cx) ** 2 + (z - cz) ** 2 > R * R || !inb(x, 2, z)) continue;
      for (let y = gy; y < Math.min(H - 2, gy + (top || 60)); y++) { const i = idx(x, y, z); if (!mine(i)) world[i] = T.AIR; }
      for (let y = gy - 1; y >= gy - 7; y--) { const i = idx(x, y, z); if (mine(i)) continue; const b = world[i]; if (y === gy - 1) world[i] = T.GRASS; else if (!b || b === T.WATER || PLANT[b] === 1 || LEAFY[b] || LOGGY[b] || b === T.COBWEB || b === T.LAVA || b === T.CHEST || b === T.PLANKS) world[i] = y > gy - 4 ? T.DIRT : T.STONE; } } }
  function setCol(X, Z) { let t = 0; for (let y = H - 2; y > 0; y--) { const b = world[idx(X, y, Z)]; if (b && b !== T.WATER && !LEAFY[b] && !LOGGY[b] && PLANT[b] !== 1) { t = y; break; } }
    const ci = (X * D + Z) * 2, b = world[idx(X, t, Z)]; g9cols[ci] = t + 1; g9cols[ci + 1] = t + 1 <= SEA ? 5 : b === T.SAND ? 4 : b === T.STONE ? 3 : 0; }
  U.clearSite = clearSite;
  // the bridge from the spawn island lands 24 blocks out toward spawn; the gate faces it
  function approach(c) { const b = (window.__c113 && __c113.bridges || []).find(q => q.k === c[0]); let ux, uz; if (b && b.a) { ux = -b.a[2]; uz = -b.a[3]; } else { const I = (window.__c101 && __c101.isl) || {cx: W >> 1, cz: D >> 1}; const L = Math.hypot(I.cx - c[1], I.cz - c[2]) || 1; ux = (I.cx - c[1]) / L; uz = (I.cz - c[2]) / L; }
    let best = 0, bd = -9; for (let r = 0; r < 4; r++) { let x = 0, z = 1; for (let i = 0; i < r; i++) { const t = x; x = -z; z = t; } const d = x * ux + z * uz + (r === 0 ? 0.02 : 0); if (d > bd) { bd = d; best = r; } }
    return {rot: best, end: [Math.round(c[1] + ux * 24), Math.round(c[2] + uz * 24)]}; }
  // ---------- run after everything else in world generation ----------
  function work(only) { if (!elig() || !g9castles) return; const t0 = performance.now(); const oci = only ? g9castles.findIndex(c => c[0] === only) : -1; window.__c150.props = only ? window.__c150.props.filter(p => p.c !== oci) : []; try { window.__c150.rebuild(); } catch (_) {}
    const done = __c102.done || [], R = {human: 22, mossy: 22, black: 23};
    g9castles.forEach((c, ci) => { if (only && c[0] !== only) return; const fn = U.B[c[0]], d = done.find(o => o.k === c[0] && o.cx === c[1] && o.cz === c[2]); if (!fn || !d) return;
      try { const ap = approach(c), gy = d.gy; const keep = only ? U.keepChests(c, R[c[0]] + 1) : null; clearSite(c, gy, R[c[0]], 62); const K = ctx(c, ci, gy, ap.rot); if (keep) { const kc = K.chest; K.made = []; K.chest = function () { const r = kc.apply(this, arguments); K.made.push(r); return r; }; } const [ex, ez] = ap.end; let lx = ex - c[1], lz = ez - c[2]; for (let i = 0; i < (4 - ap.rot) % 4; i++) { const t = lx; lx = -lz; lz = t; } K.end = [lx, lz];
        U.st[c[0]] = Object.assign({rot: ap.rot, gy}, fn(K) || {}, {lights: K.lights, chests: K.chestsN}); if (keep) U.giveBack(K.made, keep);
        for (let X = c[1] - R[c[0]] - 3; X <= c[1] + R[c[0]] + 3; X++) for (let Z = c[2] - R[c[0]] - 3; Z <= c[2] + R[c[0]] + 3; Z++) if (X > 0 && Z > 0 && X < W - 1 && Z < D - 1) setCol(X, Z);
      } catch (e) { U.err = c[0] + ': ' + (e && e.stack || e); console.warn('c151', c[0], e); } });
    if (!only) { try { scanLights(); validateLights(); } catch (_) {} try { if (window.__c148) __c148.sync(); } catch (_) {} }
    U.ms = Math.round(performance.now() - t0); U.st.props = window.__c150.props.length; }
  U.work = work; U.elig = elig;
  // v1.0.29: when an existing world is upgraded, anything in the old castle's chests goes into the new castle's chests
  U.keepChests = (c, R) => { const out = []; try { for (const [key, v] of [...chests.entries()]) { const p = String(key).split(',').map(Number); if ((p[0] - c[1]) ** 2 + (p[2] - c[2]) ** 2 > R * R || mine(idx(p[0], p[1], p[2]))) continue; for (const s of (v && v.slots) || []) if (s && s[0] && s[1] > 0) out.push(s.slice()); } } catch (_) {} return out; };
  U.giveBack = (made, items) => { if (!items.length || !made.length) return; let j = 0; const box = made.map(p => chests.get(keyOf(p[0], p[1], p[2]))).filter(Boolean);
    for (const it of items) { let put = false; for (let k = 0; k < box.length * 27 && !put; k++) { const b = box[(j + (k / 27 | 0)) % box.length], si = k % 27; if (!b.slots[si]) { b.slots[si] = it; put = true; } } if (!put) U.lost = (U.lost || 0) + 1; j++; } };
  const gen = generate; generate = function () { const r = gen.apply(this, arguments); try { const was = c37busy; c37busy = true; try { work(); } finally { c37busy = was; } } catch (e) { U.err = String(e && e.stack || e); } return r; };

  // ======================================================================================================
  // THE CLAN CASTLE: grey stone-brick tower house, round corner turrets with conical slate roofs, crow-stepped gables,
  // gatehouse with oak doors + portcullis, tartan banners, curtain wall + wall-walk, stone steps, heather and pines
  // ======================================================================================================
  const SLATE = 152, HARL = 151, GP = 227, FEN = 162, PINE = 135, NEED = 146, HEATH = 4, GRAV = T.GRAVEL || 202, OAKST = 164;
  U.B.human = function (K) { const {B, box, h} = K, F = 2;
    const st = (x, y, z) => h(x, y, z) < 0.07 ? T.MOSSYBRICK : h(x, y, z) < 0.16 ? T.COBBLE : T.STONEBRICK;
    // platform (2 high) with a stone plinth and steps up to the gate
    for (let x = -14; x <= 14; x++) for (let z = -14; z <= 16; z++) { if (z > 14 && (x < -4 || x > 3)) continue; const e = Math.max(Math.abs(x), Math.abs(z)) >= 14 || z > 14; for (let y = 0; y < F; y++) B(x, y, z, e ? st(x, y, z) : y === F - 1 ? T.GRASS : T.DIRT); }
    for (let x = -2; x <= 1; x++) { K.stair(x, 1, 17, 0, 167); B(x, 0, 17, T.STONEBRICK); K.stair(x, 0, 18, 0, 167); } for (const x of [-3, 2]) { B(x, 0, 17, T.STONEBRICK); B(x, 1, 17, T.STONEBRICK); B(x, 0, 18, T.STONEBRICK); }
    // courtyard: cobble path gate -> keep, gravel edging
    for (let z = -1; z <= 16; z++) for (let x = -2; x <= 1; x++) B(x, F - 1, z, x === -2 || x === 1 ? GRAV : T.COBBLE);
    for (let x = -11; x <= 11; x++) if (K.h(x, 5, 9) < 0.8) B(x, F - 1, 9, T.COBBLE);
    // curtain wall: 2 thick, walk on top, parapet with merlons on the outer ring
    const WT = F + 4;
    for (let x = -13; x <= 13; x++) for (let z = -13; z <= 13; z++) { const d = Math.max(Math.abs(x), Math.abs(z)); if (d < 12) continue;
      for (let y = F; y <= WT; y++) B(x, y, z, st(x, y, z)); if (d === 13) { B(x, WT + 1, z, st(x, WT + 1, z)); if (((x + z) & 1) === 0) B(x, WT + 2, z, st(x, WT + 2, z)); } }
    for (const s of [-1, 1]) for (let k = 0; k <= 4; k++) { const x = s < 0 ? -4 - k : 3 + k; K.stair(x, F + k, 11, s < 0 ? 1 : 3, 167); for (let y = F; y < F + k; y++) B(x, y, 11, T.STONEBRICK); }   // steps up to the wall-walk
    // round corner turrets, conical dark slate roofs, a flag on each
    for (const [tx, tz] of [[-13, -13], [13, -13], [-13, 13], [13, 13]]) { const top = F + 10; K.tower(tx, tz, 3.3, F, top, st, T.AIR); K.disc(tx, tz, 2.2, F + 4, T.PLANKS);
      for (const y of [F + 2, F + 7]) for (const [a, q] of [[Math.sign(tx) * 3, 0], [0, Math.sign(tz) * 3]]) B(tx + a, y, tz + q, GP);
      for (let a = -4; a <= 4; a++) for (let q = -4; q <= 4; q++) if (Math.max(Math.abs(tx + a), Math.abs(tz + q)) === 12 && a * a + q * q <= 10.9) for (let y = WT + 1; y <= WT + 2; y++) B(tx + a, y, tz + q, T.AIR);   // doorways off the wall-walk
      for (let y = F; y <= F + 1; y++) { B(tx - Math.sign(tx) * 2, y, tz - Math.sign(tz) * 2, T.AIR); B(tx - Math.sign(tx) * 3, y, tz - Math.sign(tz) * 2, T.AIR); }
      K.disc(tx, tz, 2.4, top, T.STONEBRICK); for (let a = -4; a <= 4; a++) for (let q = -4; q <= 4; q++) { const d2 = a * a + q * q; if (d2 > 10.9 || d2 <= 5.8) continue; B(tx + a, top + 1, tz + q, st(tx + a, top + 1, tz + q)); if (((a + q) & 1) === 0) B(tx + a, top + 2, tz + q, st(tx + a, top + 2, tz + q)); }
      K.lamp(tx, F, tz, -1, {}); if (tz > 0 && tx > 0) K.prop('flag', tx, top + 1, tz, 2, {}, 'floor'); }
    // gatehouse: twin round towers, oak doors, portcullis (raised), tartan banners
    const GT = F + 11; for (let x = -6; x <= 5; x++) for (let z = 12; z <= 16; z++) { for (let y = 0; y < F; y++) B(x, y, z, T.STONEBRICK); for (let y = F; y <= GT; y++) B(x, y, z, st(x, y, z)); if (x === -6 || x === 5 || z === 12 || z === 16) { B(x, GT + 1, z, st(x, GT + 1, z)); if (((x + z) & 1) === 0) B(x, GT + 2, z, st(x, GT + 2, z)); } }
    box(-2, F, 12, 1, F + 3, 16, T.AIR);   // the gate passage
    for (const x of [-2, 1]) for (let y = F; y <= F + 1; y++) B(x, y, 14, st(x, y, 14)); for (let x = -2; x <= 1; x++) for (let y = F + 2; y <= F + 3; y++) B(x, y, 14, st(x, y, 14));
    K.door(-1, F, 14, 2); K.door(0, F, 14, 2); K.prop('portc', -1, F + 3, 16, 2, {w: 4, h: 0.9, v: 1}, [-1, F + 4, 16]);
    // guard room over the gate, doors off the wall-walk, a stair up to the battlements
    box(-5, F + 5, 13, 4, F + 9, 15, T.AIR); for (const x of [-6, -5, 4, 5]) { B(x, F + 5, 12, T.AIR); B(x, F + 6, 12, T.AIR); }
    for (const x of [-4, 3]) { B(x, F + 7, 16, GP); B(x, F + 8, 16, GP); } B(-1, F + 8, 16, GP); B(0, F + 8, 16, GP); K.lamp(-5, F + 5, 13, -1, {}); K.lamp(4, F + 5, 13, -1, {});
    for (let k = 0; k <= 6; k++) { const x = -4 + k, y = F + 5 + k; for (let yy = F + 5; yy < y; yy++) B(x, yy, 15, T.STONEBRICK); K.stair(x, y, 15, 3, 167); for (let yy = y + 1; yy <= Math.min(GT, y + 2); yy++) B(x, yy, 15, T.AIR); }
    for (const x of [-4, 3]) K.prop('banT', x, F + 9, 17, 2, {L: 7}, 'wall'); K.lamp(-3, F + 1, 17, 0, {}); K.lamp(2, F + 1, 17, 0, {});
    for (const [x, z, f] of [[-8, 14, 2], [8, 14, 2], [14, -6, 3], [14, 5, 3], [-14, -6, 1], [-14, 5, 1], [-6, -14, 0], [5, -14, 0]]) K.prop('banT', x, WT, z, f, {}, 'wall');
    // ---- the tower house: x -9..8, z -11..-2, hall F..F+7, upper floor F+9.., crow-stepped gables + slate roof ----
    const X0 = -9, X1 = 8, Z0 = -11, Z1 = -2, CE = F + 8, C2 = F + 13, RF = F + 19;
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) { const e = x === X0 || x === X1 || z === Z0 || z === Z1; B(x, F - 1, z, e ? T.STONEBRICK : T.PLANKS);
      for (let y = F; y < RF; y++) B(x, y, z, e ? st(x, y, z) : y === CE || y === C2 ? T.PLANKS : T.AIR); B(x, RF - 1, z, e ? T.STONEBRICK : T.AIR); }
    for (let k = 0; k <= 6; k++) { const za = Z0 - 1 + k, zb = Z1 + 1 - k, y = RF + k; if (za > zb) break;
      for (let x = X0 + 1; x < X1; x++) { B(x, y, za, SLATE); B(x, y, zb, SLATE); if (za + 1 < zb) { B(x, y - 1, za + 1, SLATE); B(x, y - 1, zb - 1, SLATE); } }
      for (const x of [X0, X1]) { for (let z = za; z <= zb; z++) B(x, y, z, st(x, y, z)); if ((k & 1) === 0) { B(x, y + 1, za, T.STONEBRICK); B(x, y + 1, zb, T.STONEBRICK); } } }
    for (let y = RF; y <= RF + 9; y++) for (const z of [-7, -6]) B(X0, y, z, y === RF + 9 ? T.COBBLE : T.STONEBRICK);   // chimney stack
    // bartizans on the four keep corners, corbelled out, little slate cones
    for (const [tx, tz] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]]) { K.disc(tx, tz, 1.5, F + 8, T.STONEBRICK); K.tower(tx, tz, 2.2, F + 9, RF + 1, st, T.AIR); K.prop('flag', tx, K.cone(tx, tz, 2.7, RF + 2, 11, SLATE), tz, 2, {}, 'floor'); B(tx + Math.sign(tx + 0.5) * 2, RF - 1, tz, GP); }
    // round stair tower on the front (no stair to the roof - a store room with a cone)
    K.tower(5, 0, 2.4, F, RF + 2, st, T.AIR); K.cone(5, 0, 2.9, RF + 3, 10, SLATE); K.door(5, F, 2, 2); B(5, F + 5, 2, GP); B(7, F + 9, 0, GP); K.lamp(5, F + 2, 0, 0, {});
    // windows
    for (const x of [-6, -3, 3, 6]) for (let y = F + 2; y <= F + 4; y++) B(x, y, Z1, GP);
    for (const x of [-6, -3, 2, 5]) for (const y of [F + 10, F + 11, F + 15, F + 16]) { B(x, y, Z1, GP); B(x, y, Z0, GP); }
    for (const z of [-9, -5]) for (let y = F + 5; y <= F + 6; y++) B(X1, y, z, GP); for (const x of [-5, 4]) for (let y = F + 5; y <= F + 6; y++) B(x, y, Z0, GP);
    box(-1, F, Z1, 0, F + 1, Z1, T.AIR); K.door(-1, F, Z1, 2); K.door(0, F, Z1, 2);
    K.lamp(-2, F + 1, Z1 + 1, 0, {}); K.lamp(1, F + 1, Z1 + 1, 0, {}); K.prop('banT', -1, F + 6, Z1 + 1, 2, {}, 'wall'); K.prop('banT', 0, F + 6, Z1 + 1, 2, {}, 'wall');
    U.hall(K, {F, X0, X1, Z0, Z1, CE, RF}); U.solar(K, {F, CE, C2, RF});
    // ---- kitchen (harled lean-to, west yard): furnace, crafting table, cauldron, larder chest ----
    box(-11, F, 1, -7, F + 3, 7, (x, y, z) => (x === -11 || x === -7 || z === 1 || z === 7) ? (y === F ? T.STONEBRICK : HARL) : T.AIR);
    for (let k = 0; k < 3; k++) for (let z = 0 + k; z <= 8 - k; z++) for (let x = -11; x <= -7; x++) { if (z === k || z === 8 - k || k === 2) B(x, F + 4 + k, z, SLATE); else if (x === -11 || x === -7) B(x, F + 4 + k, z, HARL); }
    box(-7, F, 4, -7, F + 1, 4, T.AIR); K.door(-7, F, 4, 3); B(-11, F + 2, 3, GP); B(-11, F + 2, 5, GP);
    K.B(-10, F, 2, T.FURNACE); K.meta(-10, F, 2, {face: K.fi(2)}); K.B(-9, F, 2, T.TABLE); K.B(-8, F, 2, T.CAULDRON); K.lamp(-9, F + 2, 6, 2, {}); const larder = K.chest(-10, F, 6, 2, [[IT.BREAD, 5], [IT.MUTTON || IT.BREAD, 3], [IT.POTATO, 6], [IT.COAL, 6]]);
    K.prop('barrel', -10, F, 4, 3, {}, 'floor'); K.prop('barrel', -10, F, 5, 3, {}, 'floor');
    // the well
    box(6, F - 1, 5, 8, F, 7, T.STONEBRICK); B(7, F, 6, T.WATER); B(7, F - 1, 6, T.WATER); B(7, F - 2, 6, T.WATER); for (const [a, b] of [[6, 5], [8, 7]]) { B(a, F + 1, b, FEN); B(a, F + 2, b, FEN); } box(6, F + 3, 5, 8, F + 3, 7, 145);
    for (const [x, z] of [[-4, 3], [3, 3], [-4, 9], [3, 9]]) { B(x, F, z, FEN); K.lamp(x, F + 1, z, -1, {}); }
    // heather + Scots pines outside the wall, a gravel track to where the bridge lands
    const [ex, ez] = K.end; const onPath = (x, z) => { const vx = ex - (-0.5), vz = ez - 19, L = Math.hypot(vx, vz) || 1, t = Math.max(0, Math.min(1, ((x + 0.5) * vx + (z - 19) * vz) / (L * L))); return Math.hypot(x + 0.5 - vx * t, z - 19 - vz * t) < 2.2; };
    for (let x = -22; x <= 22; x++) for (let z = -22; z <= 22; z++) { const r = Math.hypot(x, z); if (r > 22) continue; const out = Math.max(Math.abs(x), Math.abs(z)) > 15 || (z > 16 && r > 17); if (!out || K.G(x, 0, z) !== T.AIR || K.G(x, -1, z) !== T.GRASS) continue;
      if (onPath(x, z) || (z >= 16 && Math.abs(x + 0.5) < 3)) { B(x, -1, z, h(x, 1, z) < 0.6 ? GRAV : T.COBBLE); continue; }
      const v = h(x, 2, z); B(x, -1, z, v < 0.55 ? HEATH : T.GRASS); if (v > 0.55 && v < 0.75) B(x, 0, z, T.TALLGRASS); }
    const pines = []; for (let n = 0; n < 60 && pines.length < 9; n++) { const a = h(n, 3, 1) * 6.283, rr = 17.5 + h(n, 4, 2) * 4, x = Math.round(Math.cos(a) * rr), z = Math.round(Math.sin(a) * rr);
      if (Math.max(Math.abs(x), Math.abs(z)) < 17 || onPath(x, z) || pines.some(p => Math.hypot(p[0] - x, p[1] - z) < 5) || (z > 14 && Math.abs(x) < 6)) continue; pines.push([x, z]); const ht = 6 + (h(n, 5, 3) * 3 | 0);
      for (let y = 0; y < ht; y++) B(x, y, z, PINE); for (let y = 3; y <= ht; y++) { const rr2 = y === ht ? 0.6 : 2.4 - (y - 3) * 1.6 / Math.max(1, ht - 3); K.disc(x, z, rr2, y, (a, yy, b) => K.G(a, yy, b) === T.AIR ? NEED : K.G(a, yy, b)); } B(x, ht + 1, z, NEED); }
    // beds for the clan (upper floor), the furnace + table they use
    const beds = U.beds(K, {F, X0, X1, Z0, Z1, CE});
    try { const [fx, fy, fz] = K.wp(-10, F, 2), [tx, ty, tz] = K.wp(-9, F, 2); C78.saved[K.cx + ',' + K.cz] = {made: 1, beds, furn: [fx, fy, fz], table: [tx, ty, tz]}; C78.castles.delete(K.cx + ',' + K.cz); } catch (_) {}
    return {beds: beds.length, pines: pines.length, larder};
  };
})();
