/* ===================== GLX-C181 (v1.0.35): the sketch map (c113 G35 layout) + the sand island becomes a desert museum park: kit, terrain, orchestration ===================== */
// New and reset worlds get current.g35. The park is built in local coords: u = forward (towards the bridge / spawn), v = to the right; K.L maps them to world x,z.
(function c181() {
  const U = window.__c181 = {st: null, err: null, zones: [], signs: [], ver: 0};
  const ew = enterWorld; enterWorld = function (save) { try { if (current) { current.g35 = save ? !!(save.c181 && save.c181.g35) : true; current.g36 = save ? !!(save.c181 && save.c181.g36) : true; } U.zones = (save && save.c181 && save.c181.z) || []; U.signs = (save && save.c181 && save.c181.sg) || []; U.ver++; } catch (_) {} return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && current && current.g35) d.c181 = {g35: 1, g36: current.g36 ? 1 : 0, z: U.zones, sg: U.signs}; } catch (_) {} return d; };
  U.on = () => { try { return !!(current && current.g35 && current.g12 && !DIM.cur && !cityGen && W >= 600 && current.mode !== 'creative'); } catch (_) { return false; } };
  const N = (x, z) => x * D + z, inW = (x, z) => x > 2 && z > 2 && x < W - 3 && z < D - 3;
  const solid = b => b && b !== T.WATER && b !== T.LAVA && !PLANT[b] && !LEAFY[b] && b !== T.TORCH;
  const col = (x, z, h, kind) => { try { if (g9cols && g9cols.length > N(x, z) * 2 + 1) { g9cols[N(x, z) * 2] = h + 1; g9cols[N(x, z) * 2 + 1] = kind; } } catch (_) {} };
  // ---------- the kit ----------
  function kit(ox, oz, fx, fz, isle, G, rnd) {
    const rx = -fz, rz = fx, K = {ox, oz, fx, fz, rx, rz, isle, G, rnd, n: 0};
    K.L = (u, v) => [ox + u * fx + v * rx, oz + u * fz + v * rz];
    K.ok = (u, v) => { const [x, z] = K.L(u, v); return inW(x, z) && isle.has(N(x, z)); };
    K.B = (u, y, v, b) => { const [x, z] = K.L(u, v); if (!inW(x, z) || y < 1 || y >= H - 1) return; const i = idx(x, y, z); if (placedSet && placedSet.has(i)) return; world[i] = b; K.n++; };
    K.get = (u, y, v) => { const [x, z] = K.L(u, v); return inW(x, z) && y > 0 && y < H ? world[idx(x, y, z)] : 0; };
    K.box = (u0, y0, v0, u1, y1, v1, b) => { for (let u = Math.min(u0, u1); u <= Math.max(u0, u1); u++) for (let v = Math.min(v0, v1); v <= Math.max(v0, v1); v++) for (let y = y0; y <= y1; y++) K.B(u, y, v, typeof b === 'function' ? b(u, y, v) : b); };
    K.Z = (key, base, u0, y0, v0, u1, y1, v1) => { const [ax, az] = K.L(u0, v0), [bx, bz] = K.L(u1, v1); U.zones.push([key, base, Math.min(ax, bx), Math.min(y0, y1), Math.min(az, bz), Math.max(ax, bx), Math.max(y0, y1), Math.max(az, bz)]); };
    // a flat picture: at cell (u,y,v), on the side facing (du,dv); flat = lying on top of the cell
    K.S = (u, y, v, du, dv, text, w, h, o) => { const [x, z] = K.L(u, v), dx = du * fx + dv * rx, dz = du * fz + dv * rz; U.signs.push(Object.assign({x, y, z, dx, dz, t: text, w, h}, o || {})); };
    K.torch = (u, y, v) => { const [x, z] = K.L(u, v); if (!inW(x, z)) return; world[idx(x, y, z)] = T.TORCH; try { lightSrc.set((x * 4096 + z) * 256 + y, [x + .5, y + .7, z + .5, T.TORCH]); } catch (_) {} };
    K.lamp = (u, y, v) => { const [x, z] = K.L(u, v); if (!inW(x, z)) return; world[idx(x, y, z)] = 161; try { lightSrc.set((x * 4096 + z) * 256 + y, [x + .5, y + .5, z + .5, 161]); } catch (_) {} };
    K.face = (du, dv) => stairF(du * fx + dv * rx, du * fz + dv * rz);
    K.stair = (u, y, v, b, du, dv) => { K.B(u, y, v, b); const [x, z] = K.L(u, v); try { entMeta.set(keyOf(x, y, z), {face: K.face(du, dv)}); } catch (_) {} };
    K.chest = (u, y, v, L) => { const [x, z] = K.L(u, v); try { lootChest(x, y, z, L, rnd); } catch (_) {} };
    K.W = (u, y, v) => { const [x, z] = K.L(u, v); return [x + .5, y, z + .5]; };
    // carve a set of cells and seal any water / lava / open sky next to them (below yTop)
    K.carve = (cells, yTop) => { const S = new Set(cells.map(([u, y, v]) => { const [x, z] = K.L(u, v); return idx(x, y, z); }));
      for (const i of S) { const z = i % D, r = (i - z) / D, y = r % H, x = (r - y) / H;
        for (const [a, b, c] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { const X = x + a, Y = y + b, Z = z + c; if (!inW(X, Z)) continue; const j = idx(X, Y, Z); if (S.has(j) || Y > yTop) continue; const q = world[j]; if (q === T.WATER || q === T.LAVA || !q || q === T.CHEST) world[j] = T.SANDSTONE; } }
      for (const i of S) world[i] = 0; return S.size; };
    return K; }
  // ---------- the island ----------
  U.island = function (rnd, st) {
    const cx0 = MT_C[0], cz0 = MT_C[1];
    const r = __c147.shape(cx0, cz0, rnd, st, current.g36 ? 92 : 78), isle = r.isle; st.isleCells = isle.size;
    const E = new Map(), bq = []; for (const k of isle) { const x = (k / D) | 0, z = k - x * D; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !isle.has(N(x + dx, z + dz)))) { E.set(k, 1); bq.push(k); } }
    for (let i = 0; i < bq.length; i++) { const k = bq[i], x = (k / D) | 0, z = k - x * D, e = E.get(k); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = N(x + dx, z + dz); if (isle.has(n) && !E.has(n)) { E.set(n, e + 1); bq.push(n); } } }
    // flat sand plain at G, a sandy beach round the edge
    const G = SEA + 3;
    for (const k of isle) { const x = (k / D) | 0, z = k - x * D, e = E.get(k), h = e < 3 ? SEA + 1 : e < 6 ? SEA + 2 : G;
      for (let y = h + 1; y < H - 1; y++) world[idx(x, y, z)] = 0;
      for (let y = h; y >= Math.max(2, h - 14); y--) world[idx(x, y, z)] = y > h - 4 ? T.SAND : T.SANDSTONE; col(x, z, h, 4); }
    for (const M of [entMeta, chests]) for (const k of [...M.keys()]) { const [x, y, z] = String(k).split(',').map(Number); if (isle.has(N(x, z)) && y > SEA - 16) M.delete(k); }
    try { for (const k of [...lightSrc.keys()]) { const v = lightSrc.get(k); if (v && isle.has(N(Math.floor(v[0]), Math.floor(v[2])))) lightSrc.delete(k); } } catch (_) {}
    U.zones = U.zones.filter(zn => !isle.has(N(zn[2], zn[4]))); U.signs = U.signs.filter(s => !isle.has(N(Math.floor(s.x), Math.floor(s.z))));
    // front faces the spawn (the bridge comes from there)
    const sp = (window.__c101 && __c101.isl) ? [__c101.isl.cx, __c101.isl.cz] : [W >> 1, D >> 1], ddx = sp[0] - cx0, ddz = sp[1] - cz0;
    const [fx, fz] = Math.abs(ddx) >= Math.abs(ddz) ? [Math.sign(ddx) || 1, 0] : [0, Math.sign(ddz) || 1];
    const K = kit(cx0, cz0, fx, fz, isle, G, rnd); U.K = K; const out = {};
    for (const [nm, f] of [['pyr', 'pyramid'], ['park', 'park'], ['dune', 'dune'], ['sphinx', 'sphinx'], ['fields', 'fields']]) { try { const fn = U[f]; if (fn) out[nm] = fn(K, st); } catch (e) { st[nm + 'Err'] = String(e && e.stack || e); console.warn('c181 ' + nm, e); } }
    // the deep cave under the pyramid: v1.0.41 brings back the sloping cave mouths in the sand by the pyramid's base (and the chest-room stairs still lead down too); roof kept well under the crypt and the sphinx chamber
    try { const p = out.pyr; if (p) { const [px, pz] = K.L(p.u, 0); __c147.caverns(px, pz, 13, p.ty, isle, rnd, st, {top: SEA - 19, at: [[0, 27, 0, -1], [0, -27, 0, 1], [14, 24, -0.5, -0.87]].map(([u, v, du, dv]) => { const [x, z] = K.L(p.u + u, v), [x1, z1] = K.L(p.u + u + du, v + dv); return [x, z, x1 - x, z1 - z]; })}); if (U.passages) out.pas = U.passages(K, p, st); } } catch (e) { st.cavErr = String(e && e.stack || e); }
    // the bridge from the mainland, built after the island is shaped (c147 clears the channel)
    try { if (window.__c113 && __c113.bridgeOne) st.bridge = __c113.bridgeOne(['sand', cx0, cz0, 1]).length; } catch (e) { st.brErr = String(e); }
    for (let x = cx0 - 100; x <= cx0 + 100; x += 4) for (let z = cz0 - 100; z <= cz0 + 100; z += 4) try { markDirty(x, z); } catch (_) {}
    // swaddles walk the open sand
    const surf = []; for (const k of isle) { const e = E.get(k); if (e > 6 && k % 5 === 0) { const x = (k / D) | 0, z = k - x * D; if (world[idx(x, G, z)] === T.SAND && !world[idx(x, G + 1, z)] && !world[idx(x, G + 2, z)]) surf.push([x, z]); } }
    const pick = []; for (let i = 0; i < 60 && surf.length; i++) pick.push(surf[(rnd() * surf.length) | 0]);
    // Barrow Bandagers: the deep cave and the sphinx's hidden chamber
    const pts = [...((__c147.cavPts && __c147.cavPts()) || []), ...((out.sphinx && out.sphinx.pts) || [])];
    const tc = out.pyr ? K.L(out.sphinx ? (out.pyr.u + out.sphinx.cu) / 2 : out.pyr.u, out.sphinx ? out.sphinx.cv / 2 : 0) : [cx0, cz0];
    const [cxp, czp] = out.pyr ? K.L(out.pyr.u, 0) : [cx0, cz0];
    U.ver++; U.st = st;
    return {c: [cx0, cz0], r: Math.round(Math.sqrt(isle.size / Math.PI)) + 6, pyr: out.pyr ? {x: cxp, z: czp, y: G, B: 14, door: out.pyr.door} : null,
      tomb: pts.length ? {x: tc[0], y: SEA - 26, z: tc[1], pts} : null, surf: pick, park: {f: [fx, fz], G}}; };
})();
