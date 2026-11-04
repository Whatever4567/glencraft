/* GLX-C320 (v1.1.29): THE ROUND EARTH. The map is one continent sitting on top of a round Earth of real blocks (radius 5000). Around it and
   all the way round the planet is ocean with a sand and stone sea floor; under the map is solid rock, so there is no edge to fall off and no
   bottom to fall out of. The blocks are worked out on the fly (nothing is stored except what you change). The ocean and sea floor are drawn as
   smooth sheets, and from space and the Moon the whole planet shows as a round blue ball with the continent on top. Mars moved out to make room. */
(function c320() {
  const U = window.__c320 = {err: null, R: 5000, edits: new Map(), q: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const S7 = () => window.__c317, on = () => { try { return !!(S7() && S7().on()); } catch (_) { return false; } };
  const R = U.R, Z0 = () => (typeof __XZ !== 'undefined' && __XZ) ? __XZ : 0;
  const E = U.E = () => [W >> 1, SEA + 250 - R, Math.round((D - 1500) / 2)];
  const CAP = U.CAP = Math.sqrt(R * R - (R - 250) * (R - 250));
  const foot = (x, z) => x >= 0 && x < W && z < D && z >= Z0();
  const dF = (x, z) => Math.hypot(Math.max(0, -x, x - W), Math.max(0, Z0() - z, z - D));
  U.fd = () => 6.6;
  // v1.1.32: continents of empty grassland across the oceans, a shallow sea, snow cliffs round Glencraft, and real layers down to a glowing core
  const S = (v) => Math.sin(v), PK = () => T.PACKSNOW || T.SNOW || 255;
  const edgeT = new Map(); function edgeTop(x, z) { const ex = Math.max(0, Math.min(W - 1, x)), ez = Math.max(Z0(), Math.min(D - 1, z)), k = ex + ',' + ez; let t = edgeT.get(k);
    if (t === undefined) { t = SEA; try { for (let y = Math.min(H - 1, SEA + 60); y > 0; y--) { const b = ez < 0 ? (typeof __XG === 'function' ? __XG(ex, y, ez) : 0) : world[(ex * H + y) * D + ez]; if (b && b !== T.WATER) { t = y + 1; break; } } } catch (_) {} if (edgeT.size > 20000) edgeT.clear(); edgeT.set(k, t); } return t; }
  // ground height above the sea (negative = sea floor depth) and what kind of ground it is
  function ground(x, y, z, nx, ny, nz) { const df = dF(x, z);
    // v1.1.38: no snow cliffs and no sea moat round the map: the land outside joins the map edge at the edge height, as part of Scotland
    const d2 = ny > 0.5 ? df : 1e9, W9 = window.__c329; let land = 0, kind = 1;
    if (W9) { const ll = U.flat ? U.fll(x, z) : W9.ll(nx, ny, nz); land = W9.land(ll[0], ll[1]) + 0.16 * S(x * 0.031 + y * 0.017 + 1.3) * S(z * 0.029 - y * 0.023 + 0.4) + 0.08 * S(x * 0.11 - z * 0.09 + y * 0.07); kind = W9.biome(ll[0], ll[1]); }
    
    let g; if (land > 0.5) { const k = Math.min(1, (land - 0.5) * 5); g = 0.6 + k * (3 + 2.5 * S(x * 0.021 + y * 0.013) * S(z * 0.018 - y * 0.011) + 1.5 * S(x * 0.063 + z * 0.051 + y * 0.04)); if (land > 0.95) g += 6 * Math.max(0, S(x * 0.007 + y * 0.005 + 2) * S(z * 0.006 - y * 0.004 + 1)); }
    else g = -0.5 - 5.5 * Math.min(1, (0.5 - land) * 4);
    if (d2 < 24) { let t = 0; for (const o of [-4, 0, 4]) t += edgeTop(x + o, z) + edgeTop(x, z + o); t = Math.max(-6, Math.min(14, t / 6 - SEA)); const w = d2 / 24, sm = w * w * (3 - 2 * w); g = t * (1 - sm) + g * sm; if (kind !== 1 && kind !== 3) kind = 1; }
    return [g, g <= 0 ? 0 : kind === 1 && g < 0.9 ? 0 : kind]; }
  U.ground = ground;
  function layer(r, dd, kind, x, y, z) { const q = r / R; if (kind === 3) return dd < 5 ? (T.SAND) : dd < 12 ? (T.SANDSTONE || T.SAND) : T.STONE; if (q < 0.19) return T.GLOWROCK || 209; if (q < 0.55) return T.MAGMA || 208; if (q < 0.85) return ((x ^ y ^ z) & 7) ? 206 : (T.MAGMA || 208);
    if (kind === 2) return dd < 30 ? PK() : T.STONE; if (kind === 1) { if (dd < 1) return T.GRASS; if (dd < 4) return T.DIRT; } else if (dd < 3) return T.SAND; return dd > 60 && T.DEEPSLATE ? T.DEEPSLATE : T.STONE; }
  U.layer = layer;
  // the planet block at a spot outside the map (0 = air)
  // v1.1.39: LOCAL TERRACES. Away from the map the ground is laid in flat block terraces square to the nearest grid side (the same six
  // sides the walking frame uses): within a terrace the top is one flat block plane, and the steps (one or two blocks) are only where two
  // terraces meet. Terraces are wide where the planet is nearly level with the grid and narrow near the side seams. Sea is terraced the same way.
  const TC = new Map(), RG = 64, P2 = g => { const m = 1.5 / Math.max(1e-4, g); let t = 1; while (t * 2 <= m && t < 64) t *= 2; return t; };
  function terr(x, y, z, dx, dy, dz, r) { if (U.pit) { const q = U.pit(x, y, z); if (q !== undefined) return q; } const qx = Math.abs(dx), qy = Math.abs(dy), qz = Math.abs(dz), k = qx >= qy && qx >= qz ? 0 : qy >= qz ? 1 : 2, d = [dx, dy, dz], sg = d[k] < 0 ? -1 : 1, i = (k + 1) % 3, j = (k + 2) % 3;
    const hk = sg * d[k], u = d[i], v = d[j], uc = (Math.floor(u / RG) + 0.5) * RG, vc = (Math.floor(v / RG) + 0.5) * RG, hr = Math.sqrt(Math.max(1, R * R - uc * uc - vc * vc));
    const su = P2(Math.abs(uc) / hr), sv = P2(Math.abs(vc) / hr), iu = Math.floor(u / su), iv = Math.floor(v / sv), f = k * 2 + (sg > 0 ? 1 : 0);
    const key = ((f * 8 + Math.log2(su)) * 8 + Math.log2(sv)) * 268435456 + (iu + 8192) * 16384 + (iv + 8192); let t = TC.get(key);
    if (!t) { const tu = (iu + 0.5) * su, tv = (iv + 0.5) * sv, h0 = Math.sqrt(Math.max(1, R * R - tu * tu - tv * tv)), n = [0, 0, 0]; n[k] = sg * h0 / R; n[i] = tu / R; n[j] = tv / R; const c = E();
      const gk = ground(c[0] + n[0] * R, c[1] + n[1] * R, c[2] + n[2] * R, n[0], n[1], n[2]), Rg = R + gk[0];
      t = [Math.round(Math.sqrt(Math.max(1, Rg * Rg - tu * tu - tv * tv))), gk[1], Math.round(h0)]; TC.set(key, t); if (TC.size > 400000) TC.clear(); }
    if (hk < t[0]) return layer(r, t[0] - hk, t[1], x, y, z); return hk < t[2] ? T.WATER : 0; }
  U.terr = terr; U.tOn = true;
  const capped = (y, r) => y - SEA >= r - R - 1;
  function earth(x, y, z) { if (U.flat) return U.fearth(x, y, z); const c = E(), dx = x + 0.5 - c[0], dy = y + 0.5 - c[1], dz = z + 0.5 - c[2], r2 = dx * dx + dy * dy + dz * dz; if (r2 >= (R + 40) * (R + 40)) return 0;
    const r = Math.sqrt(r2), a = Math.max(y - SEA, r - R); if (a > 32) return 0; if (a < -40) return U.hol ? U.hol(x, y, z, dx, dy, dz, r) : layer(r, 99, 0, x, y, z);   /* v1.1.37: the deep layers and the hollow */
    if (U.tOn && !capped(y, r)) return terr(x, y, z, dx, dy, dz, r);
    const gk = ground(x, y, z, dx / r, dy / r, dz / r), g = gk[0]; if (a < g) return layer(r, g - a, gk[1], x, y, z); return a < 0 ? T.WATER : 0; }
  U.earth = earth;
  // height above the sea: the flat cap over the map, the round ball everywhere else
  U.alt = (x, y, z) => { if (U.flat) return y - SEA; const c = E(); return Math.max(y - SEA, Math.hypot(x - c[0], y - c[1], z - c[2]) - R); };
  U.space = (x, y, z) => U.alt(x, y, z) > H + 40 - SEA;
  U.spaceCam = (x, y, z) => U.alt(x, y, z) > H + 60 - SEA;
  const key = (x, y, z) => x + ',' + y + ',' + z, soft = b => !b || b === T.WATER || b === T.LAVA || b === T.TORCH || (typeof PLANT !== 'undefined' && PLANT[b] === 1);
  const mine = (x, y, z) => !(foot(x, z) && y >= 0);
  let GB = null; try { const g0 = getB; GB = getB = function (x, y, z) { if (x >= 0 && x < W && z < D && y >= 0 && z >= Z0()) return g0(x, y, z); if (!on()) return g0(x, y, z); x = Math.floor(x); y = Math.floor(y); z = Math.floor(z); if (!mine(x, y, z)) return g0(x, y, z);
      if (U.edits.size) { const v = U.edits.get(key(x, y, z)); if (v !== undefined) return v; } const b = g0(x, y, z); return b || earth(x, y, z); }; } catch (e) { ERR('getB', e); }
  try { const so = solid; solid = function (x, y, z) { if (x >= 0 && x < W && z < D && y >= 0 && z >= Z0()) return so(x, y, z); if (!on()) return so(x, y, z); const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z); if (!mine(xi, yi, zi)) return so(x, y, z);
      if (S7().wall(xi, yi, zi)) return true; return !soft(GB(xi, yi, zi)); }; } catch (e) { ERR('solid', e); }
  try { const s0 = setB; setB = function (x, y, z, v) { if (!on()) return s0(x, y, z, v); x = Math.floor(x); y = Math.floor(y); z = Math.floor(z); if (!mine(x, y, z) || S7().wall(x, y, z)) return s0(x, y, z, v);
      const k = key(x, y, z), inP = window.__c318 && __c318.bodies.some(b => !b.d.cell && b.inside(x, y, z));
      if (!inP && (U.edits.has(k) || earth(x, y, z) || (U.flat && !(window.__ukb && __ukb.out(x, z))))) {   /* v1.1.85: any block placed anywhere in the UK is kept, mid air too */ U.edits.set(k, v); U.dirty = 1; if (v && v !== T.WATER) return s0(x, y, z, v); return; }
      return s0(x, y, z, v); }; } catch (e) { ERR('setB', e); }
  // ---------- drawing: ocean and sea floor near you, the whole ball from space ----------
  const lam = (c, o) => new THREE.MeshLambertMaterial(Object.assign({color: c}, o || {}));
  const MW = lam(0x2f6db0, {transparent: true, opacity: 0.82, depthWrite: false}), MF = lam(0x8c7d56), FW = new THREE.MeshBasicMaterial({color: 0x2c63a8, fog: false}), FF = new THREE.MeshBasicMaterial({color: 0x1f4f8c, fog: false});
  let near = null, far = null, builtFor = '';
  function capGeo(floor) { const c = E(), s = 64, xs = new Set([0, W]), zs = new Set([Z0(), D]);
    for (let v = c[0] - CAP - s; v <= c[0] + CAP + s; v += s) xs.add(Math.round(v)); for (let v = c[2] - CAP - s; v <= c[2] + CAP + s; v += s) zs.add(Math.round(v));
    const X = [...xs].sort((a, b) => a - b), Z = [...zs].sort((a, b) => a - b), pos = [];
    const vt = (x, z) => { let dx = x - c[0], dz = z - c[2]; const d = Math.hypot(dx, dz); if (d > CAP) { dx *= CAP / d; dz *= CAP / d; } const X1 = c[0] + dx, Z1 = c[2] + dz;
      return [X1, floor ? SEA - U.fd(X1, Z1) : SEA - 0.2, Z1]; };
    for (let i = 0; i < X.length - 1; i++) for (let j = 0; j < Z.length - 1; j++) { const x0 = X[i], x1 = X[i + 1], z0 = Z[j], z1 = Z[j + 1], mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      if (mx > 0 && mx < W && mz > Z0() && mz < D) continue; if (Math.hypot(Math.max(Math.abs(mx - c[0]) - (x1 - x0) / 2, 0), Math.max(Math.abs(mz - c[2]) - (z1 - z0) / 2, 0)) > CAP) continue;
      const a = vt(x0, z0), b = vt(x1, z0), d = vt(x1, z1), e = vt(x0, z1); pos.push(...a, ...e, ...d, ...a, ...d, ...b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); g.computeBoundingSphere(); return g; }
  function ballGeo(r, seg) { const t0 = Math.acos((R - 250) / R), g = new THREE.SphereGeometry(r, seg, seg >> 1, 0, Math.PI * 2, t0, Math.PI - t0); return g; }
  function build() { const c = E(), id = [W, D, Z0(), SEA].join(); if (builtFor === id) return; builtFor = id; drop();
    const ph = /Android|iPhone|iPad/i.test(navigator.userAgent), gw = capGeo(false), gf = capGeo(true), bw = ballGeo(R, ph ? 64 : 96), bf = ballGeo(R - 7, ph ? 48 : 72);
    near = new THREE.Group(); near.name = 'earth320'; near.userData.sys = 1;
    const m1 = new THREE.Mesh(gw, MW), m2 = new THREE.Mesh(gf, MF), m3 = new THREE.Mesh(bw, MW), m4 = new THREE.Mesh(bf, MF); m1.name = 'sea320'; m2.name = 'floor320'; m3.name = 'seaBall320'; m4.name = 'floorBall320';
    m3.position.set(c[0], c[1], c[2]); m4.position.set(c[0], c[1], c[2]); m1.renderOrder = m3.renderOrder = 2; for (const m of [m1, m2, m3, m4]) { m.frustumCulled = false; near.add(m); } scene.add(near);
    far = new THREE.Group(); far.name = 'earth320far'; far.userData.sys = 1; const f1 = new THREE.Mesh(gw, FW), f3 = new THREE.Mesh(bw, FW); f3.position.copy(m3.position); far.add(f1, f3);
    try { if (S7() && S7().FAR) S7().FAR.add(far); } catch (_) {} U.built = (U.built || 0) + 1; U.tris = (gw.attributes.position.count + gf.attributes.position.count) / 3; }
  function drop() { for (const g of [near, far]) if (g) { g.parent && g.parent.remove(g); g.traverse(o => { if (o.geometry && !o.geometry.__k) o.geometry.dispose(); }); } near = far = null; }
  setInterval(() => { try { const a = typeof started !== 'undefined' && started && on(); if (a) build(); if (near) near.visible = a && !U.flat; if (far) far.visible = a && !U.flat; } catch (e) { ERR('loop', e); } }, 500);
  // ---------- save: only what you changed out on the planet ----------
  try { const se = serialize; serialize = function () { const o = se.apply(this, arguments); try { if (o && !DIM.cur) o.c320 = {v: 1, e: Array.from(U.edits)}; } catch (e) { ERR('ser', e); } return o; }; } catch (e) { ERR('ser0', e); }
  try { const ew = enterWorld; enterWorld = function (save) { try { if (!DIM.cur) { U.edits.clear(); const s = save && save.c320; if (s && s.e) for (const [k, v] of s.e) U.edits.set(k, v);
        // v1.1.29: Mars moved out past the round Earth, so blocks you changed there move with it
        U.edgeClr = () => edgeT.clear(); const m = save && !s && save.c318 && save.c318.e && save.c318.e.mars; if (m) save.c318.e.mars = m.map(([k, v]) => { const p = k.split(',').map(Number); return [(p[0] - 2900) + ',' + p[1] + ',' + (p[2] + 1400), v]; });
        const q = save && !s && save.c317 && save.c317.p, mc = window.__c318 && __c318.by.mars && __c318.by.mars.c(); if (q && mc && Math.hypot(q[0] - mc[0] - 2900, q[1] - mc[1], q[2] - mc[2] + 1400) < 600) { q[0] -= 2900; q[2] += 1400; U.movedP = 1; } } } catch (e) { ERR('ew', e); }
      return ew.apply(this, arguments); }; } catch (e) { ERR('ew0', e); }
})();
