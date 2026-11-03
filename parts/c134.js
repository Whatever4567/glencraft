/* ===================== GLX-C134 (v1.0.15): flowing water - sloped surfaces, flow ripples, waterfalls with foam + splash, rivers from the hills to the lochs / sea, gentle current ===================== */
(function c134() {
  const U = window.__c134 = {st: null, err: null, RIV: new Map(), paths: [], splash: 0};
  const elig = () => { try { return !!(current && current.mode !== 'creative' && current.g15 && current.g12 && !DIM.cur && W >= 600); } catch (_) { return false; } };
  const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]].map(([a, b]) => { const m = Math.hypot(a, b); return [a / m, b / m]; });
  const code = (fx, fz) => (Math.round(Math.atan2(fz, fx) / (Math.PI / 4)) + 8) % 8;
  // ---------- 1) rivers (world gen, new worlds only; called by c131 before the caves so tunnels keep clear of them) ----------
  let pendFalls = null;
  U.rivers = function (rnd) {
    U.RIV.clear(); U.paths = []; if (!elig()) return null; const t0 = performance.now(), N = W * D, top = new Int16Array(N), wet = new Uint8Array(N), wl0 = new Int16Array(N).fill(-1);
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { const c = x * D + z; for (let y = H - 2; y > 0; y--) { const b = world[idx(x, y, z)]; if (!b || PLANT[b] || LEAFY[b] || LOGGY[b]) continue; if (b === T.WATER) { wet[c] = 1; wl0[c] = y; } top[c] = y; break; } }
    const dist = new Int16Array(N).fill(-1), q = new Int32Array(N); let qh = 0, qt = 0;
    for (let c = 0; c < N; c++) if (wet[c]) { dist[c] = 0; q[qt++] = c; }
    while (qh < qt) { const c = q[qh++], x = (c / D) | 0, z = c - x * D; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Z = z + dz; if (X < 0 || Z < 0 || X >= W || Z >= D) continue; const n = X * D + Z; if (dist[n] < 0) { dist[n] = dist[c] + 1; q[qt++] = n; } } }
    const avoid = new Uint8Array(N), mark = (x0, z0, x1, z1) => { for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) for (let z = Math.max(0, z0); z <= Math.min(D - 1, z1); z++) avoid[x * D + z] = 1; };
    for (const c of (g9castles || [])) mark(c[1] - 42, c[2] - 42, c[1] + 42, c[2] + 60);
    const C113 = window.__c113 || {}; try { for (const f of (C113.farmsList ? C113.farmsList() : [])) mark(f.x0 - 14, f.z0 - 14, f.x0 + 22, f.z0 + 26); } catch (_) {}
    const ax = (W >> 1) - 128, az = (D >> 1) - 124; mark(ax - 12, az - 12, ax + 268, az + 268); mark(0, 0, 9, D - 1); mark(W - 10, 0, W - 1, D - 1); mark(0, 0, W - 1, 9); mark(0, D - 10, W - 1, D - 1);
    const nb = (x, z) => { try { return C113.nearBridge ? C113.nearBridge(x, z, 12) : false; } catch (_) { return false; } };
    const isW = new Uint8Array(N), lev = new Int16Array(N).fill(-1), rid = new Int16Array(N), cols = [], st = {made: 0, tried: 0, falls: 0, cells: 0, len: []};
    const G42 = !!(window.__c208 && __c208.on());   // v1.0.42: the new map's hill rivers wander instead of running dead straight
    const cand = []; for (let x = 12; x < W - 12; x += 6) for (let z = 12; z < D - 12; z += 6) { const c = x * D + z; if (!avoid[c] && !wet[c] && top[c] >= SEA + 14 && dist[c] >= 45) cand.push(c); }
    { const key = new Map(cand.map(c => [c, dist[c] + top[c] * 0.3 + rnd() * 40])); cand.sort((a, b) => key.get(b) - key.get(a)); }   // long rivers from high ground first
    const srcs = []; const falls = new Set(); U.paths = [];
    for (const s of cand) { if (st.made >= 7 || st.tried > 60) break; const sx = (s / D) | 0, sz = s - sx * D; if (srcs.some(([x, z]) => Math.hypot(x - sx, z - sz) < 110)) continue; st.tried++;
      // trace: every step one block closer to open water, picking the lowest / straightest way with a little wander
      const path = [s], vis = new Set([s]); let c = s, pd = -1, endL = -1, ok = true, side0 = 0;
      for (let k = 0; k < 900; k++) { if (wet[c]) { endL = wl0[c]; break; } const x = (c / D) | 0, z = c - x * D; let best = -1, bs = 1e9, bd = -1;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz], d) => { const X = x + dx, Z = z + dz; if (X < 1 || Z < 1 || X >= W - 1 || Z >= D - 1) return; const n = X * D + Z; const side = G42 && dist[n] === dist[c] && !vis.has(n) && side0 < 6; if (dist[n] !== dist[c] - 1 && !rid[n] && !side) return;
          const sc = (top[n] - top[c]) * 0.5 + (pd >= 0 && d !== pd ? (G42 ? 0.12 : 0.55) : 0) + rnd() * 0.9 + (G42 ? 2.4 * g9fbm(X / 21 + 5, Z / 21 - 5, 2) + (side ? 0.5 : 0) : 0) + (avoid[n] || nb(X, Z) ? 99 : 0); if (sc < bs) { bs = sc; best = n; bd = d; } });
        if (best < 0 || bs > 50) { ok = false; break; } path.push(best); vis.add(best); side0 = dist[best] === dist[c] ? side0 + 1 : 0; pd = bd; c = best; if (rid[best]) { endL = lev[best]; break; } }
      if (!ok || endL < 0 || path.length < 40) continue;
      // water level: never rises downstream, never below the loch / sea it ends in; give up if it would need a deep slot
      const L = path.map(p => top[p] - 1); for (let i = 1; i < L.length; i++) L[i] = Math.min(L[i - 1], L[i]); for (let i = 0; i < L.length; i++) L[i] = Math.max(L[i], endL);
      if (path.some((p, i) => !wet[p] && top[p] - L[i] > 13)) continue;
      st.made++; srcs.push([sx, sz]); const id = st.made, n = path.length, P = [], wq = new Map(), bq = new Map();
      // pass A: every column takes the level of its NEAREST centre-line cell (flat cross-sections); banks keep ground at least at the water beside them
      for (let i = 0; i < n; i++) { const p = path[i]; if (wet[p] || (rid[p] && rid[p] !== id)) continue; const px = (p / D) | 0, pz = p - px * D, wl = L[i];
        const a = path[Math.max(0, i - 3)], b = path[Math.min(n - 1, i + 3)], cd = code(((b / D) | 0) - ((a / D) | 0), (b % D) - (a % D));
        const r = 1.2 + 2.3 * Math.min(1, i / 170) + 0.3 * Math.sin(i * 0.21), R = Math.ceil(r + 2.5); P.push([px, pz, Math.round(r * 10), cd]);
        for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) { const X = px + dx, Z = pz + dz; if (X < 2 || Z < 2 || X >= W - 2 || Z >= D - 2) continue; const cc = X * D + Z, d = Math.hypot(dx, dz); if (wet[cc] || avoid[cc] || (rid[cc] && rid[cc] !== id)) continue;
          if (d <= r) { const o = wq.get(cc); if (!o || d < o[0]) wq.set(cc, [d, wl, cd, d < r * 0.65]); }
          else if (d <= r + 2.5) { const hb = wl + 1 + Math.floor((d - r) * 1.3), o = bq.get(cc); if (!o) bq.set(cc, [hb, wl]); else { o[0] = Math.min(o[0], hb); o[1] = Math.max(o[1], wl); } } } }
      // pass B: carve
      for (const [cc, [d, wl, cd, deep]] of wq) { const X = (cc / D) | 0, Z = cc - X * D, tp = Math.max(top[cc], wl, lev[cc] + 1);
        for (let y = wl + 1; y <= tp + 2 && y < H - 1; y++) { const k = idx(X, y, Z), bb = world[k]; if (y <= tp || PLANT[bb]) world[k] = 0; }
        world[idx(X, wl, Z)] = T.WATER; let bed = wl - 1; if (deep && wl > 4) { world[idx(X, wl - 1, Z)] = T.WATER; bed = wl - 2; }
        world[idx(X, bed, Z)] = rnd() < 0.55 ? T.SAND : T.GRAVEL; for (let y = bed - 1; y >= Math.max(2, bed - 4); y--) { const k = idx(X, y, Z); if (!world[k] || world[k] === T.LAVA || world[k] === T.WATER) world[k] = T.STONE; }
        if (!isW[cc]) { isW[cc] = 1; cols.push(cc); } lev[cc] = wl; rid[cc] = id; U.RIV.set(cc, cd); top[cc] = bed; }
      for (const [cc, [hb0, mw]] of bq) { if (isW[cc]) continue; const X = (cc / D) | 0, Z = cc - X * D, hb = Math.max(hb0, mw);
        if (top[cc] > hb) { for (let y = hb + 1; y <= top[cc] + 2 && y < H - 1; y++) { const k = idx(X, y, Z), bb = world[k]; if (y <= top[cc] || PLANT[bb]) world[k] = 0; } const k = idx(X, hb, Z); if (world[k] === T.DIRT || world[k] === T.STONE) world[k] = T.GRASS; top[cc] = hb; cols.push(cc); }
        else if (top[cc] < mw) { for (let y = top[cc] + 1; y <= mw; y++) world[idx(X, y, Z)] = y === mw ? T.GRASS : T.DIRT; top[cc] = mw; cols.push(cc); } }
      U.paths.push(P); st.len.push(n); }
    // waterfalls: wherever river water looks down two or more blocks onto the next stretch (or the sea), the drop fills with falling water
    for (const c of cols) { if (!isW[c]) continue; const x = (c / D) | 0, z = c - x * D, Lc = lev[c];
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = (x + dx) * D + z + dz; const ln = isW[n] ? lev[n] : wet[n] ? wl0[n] : -1; if (ln < 0 || ln > Lc - 2) continue;
        for (let y = ln + 1; y <= Lc; y++) { const k = idx(x + dx, y, z + dz); if (world[k] && world[k] !== T.WATER && !PLANT[world[k]]) break; world[k] = T.WATER; falls.add(k); } } }
    st.falls = falls.size; st.cells = cols.length; st.ms = Math.round(performance.now() - t0); pendFalls = [...falls]; U.st = st; return {st, cols}; };
  // rebuild the flow map from the saved centre lines (saves stay small)
  function rivFromPaths(paths) { U.RIV.clear(); for (const P of paths || []) for (const [px, pz, r10, cd] of P) { const r = r10 / 10, R = Math.ceil(r); for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) if (Math.hypot(dx, dz) <= r) { const X = px + dx, Z = pz + dz; if (X >= 0 && Z >= 0 && X < W && Z < D) U.RIV.set(X * D + Z, cd); } } }
  const ew = enterWorld; enterWorld = function (save) { try { if (current) current.g15 = save ? !!(save.c134 && save.c134.g15) : true; U.paths = save && save.c134 && save.c134.p || []; rivFromPaths(U.paths); } catch (_) {} return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && current && current.g15) d.c134 = {g15: 1, p: U.paths}; } catch (_) {} return d; };
  const gen = generate; generate = function () { pendFalls = null; if (!elig()) { U.RIV.clear(); U.paths = []; } const r = gen.apply(this, arguments);
    try { if (pendFalls && !DIM.cur) for (const k of pendFalls) if (world[k] === T.WATER) FLV.set(k, 1); } catch (e) { U.err = String(e); } pendFalls = null; return r; };
  // ---------- 2) rendering: Minecraft-style sloped corners, flow-scrolled ripples, waterfall foam ----------
  const fl = (x, y, z) => (FLV.size ? FLV.get(idx(x, y, z)) || 0 : 0);
  const hOf = (x, y, z) => { if (getB(x, y + 1, z) === T.WATER) return 1; const l = fl(x, y, z); return l ? Math.max(0.1, (8 - l) / 8 * 0.88) : 0.88; };
  function corner(x, y, z, cx, cz) { let s = 0, n = 0;
    for (let a = -1; a <= 0; a++) for (let b = -1; b <= 0; b++) { const X = x + cx + a, Z = z + cz + b; if (X < 0 || Z < 0 || X >= W || Z >= D) continue; const bb = getB(X, y, Z);
      if (bb === T.WATER) { if (getB(X, y + 1, Z) === T.WATER) return 1; s += hOf(X, y, Z); n++; } else if (waterOpenTo(bb) && getB(X, y - 1, Z) === T.WATER) n++; }
    return n ? s / n : 0.88; }
  const falling = (x, y, z) => fl(x, y, z) > 0 && (getB(x, y + 1, z) === T.WATER || (getB(x, y - 1, z) === T.WATER && fl(x, y - 1, z) > 0));
  function flowOf(x, y, z) { const l = fl(x, y, z);
    if (l) { let fx = 0, fz = 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nb = getB(x + dx, y, z + dz); let nl; if (nb === T.WATER) nl = fl(x + dx, y, z + dz); else if (flInto(nb)) nl = 8; else continue; fx += dx * (nl - l); fz += dz * (nl - l); } const m = Math.hypot(fx, fz); return m ? [fx / m, fz / m, 1] : null; }
    const cd = U.RIV.size ? U.RIV.get(x * D + z) : undefined; return cd === undefined ? null : [DIRS[cd][0], DIRS[cd][1], 0.8]; }
  function foamAt(x, y, z) { if (!FLV.size) return 0; let f = 0; for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const d = Math.max(Math.abs(dx), Math.abs(dz)); if (d && f >= (d === 1 ? 0.9 : 0.45)) continue;
      if (fl(x + dx, y + 1, z + dz) && getB(x + dx, y + 1, z + dz) === T.WATER) f = Math.max(f, d <= 1 ? 0.9 : 0.45); } return f; }
  U.baseGeo = buildWaterGeo;
  buildWaterGeo = function (arr) {
    const pos = [], nor = [], uv = [], surf = [], scr = [], flw = [], foam = [];
    for (let i = 0; i < arr.length; i += 3) {
      const x = arr[i], y = arr[i + 1], z = arr[i + 2], topOpen = getB(x, y + 1, z) !== T.WATER;
      const h = topOpen ? [corner(x, y, z, 0, 0), corner(x, y, z, 0, 1), corner(x, y, z, 1, 1), corner(x, y, z, 1, 0)] : [1, 1, 1, 1];   // h00 h01 h11 h10
      const fall = falling(x, y, z), fv = topOpen ? flowOf(x, y, z) : null, fo = topOpen ? foamAt(x, y, z) : 0;
      for (let f = 0; f < 6; f++) {
        const [dx, dy, dz] = WATER_FACES[f], n = getB(x + dx, y + dy, z + dz);
        if (!(f === 2 ? topOpen && waterOpenTo(n) || n === T.AIR : waterOpenTo(n))) continue;
        let q;
        if (f === 2) q = [[0, h[0], 0, 1], [0, h[1], 1, 1], [1, h[2], 1, 1], [1, h[3], 0, 1]];
        else if (f === 3) q = [[0, 0, 0, 0], [1, 0, 0, 0], [1, 0, 1, 0], [0, 0, 1, 0]];
        else if (f === 0) q = [[1, 0, 0, 0], [1, h[3], 0, 1], [1, h[2], 1, 1], [1, 0, 1, 0]];
        else if (f === 1) q = [[0, 0, 1, 0], [0, h[1], 1, 1], [0, h[0], 0, 1], [0, 0, 0, 0]];
        else if (f === 4) q = [[1, 0, 1, 0], [1, h[2], 1, 1], [0, h[1], 1, 1], [0, 0, 1, 0]];
        else q = [[0, 0, 0, 0], [0, h[0], 0, 1], [1, h[3], 0, 1], [1, 0, 0, 0]];
        const side = f !== 2 && f !== 3;
        for (const k of [0, 1, 2, 0, 2, 3]) {
          const [qx, qy, qz, te] = q[k], wx = x + qx, wy = y + qy, wz = z + qz;
          pos.push(wx, wy, wz); nor.push(dx, dy, dz);
          if (f === 2 || f === 3) uv.push(wx * 0.25, wz * 0.25); else uv.push((dx ? wz : wx) * 0.25, wy * 0.25);
          surf.push(topOpen && te ? 1 : 0);
          if (f === 2 && fv) { scr.push(-fv[0] * 0.11 * fv[2], -fv[1] * 0.11 * fv[2]); flw.push(fv[0], fv[1], fv[2]); } else if (side && fall) { scr.push(0, 0.55); flw.push(0, 0, 0); } else { scr.push(0, 0); flw.push(0, 0, 0); }
          foam.push(f === 2 ? Math.max(fo, te && qy < 0.45 ? 0.35 : 0) : side && fall ? 0.4 : 0);
        }
      }
    }
    if (!pos.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('aSurf', new THREE.Float32BufferAttribute(surf, 1)); g.setAttribute('aScr', new THREE.Float32BufferAttribute(scr, 2)); g.setAttribute('aFl', new THREE.Float32BufferAttribute(flw, 3)); g.setAttribute('aFoam', new THREE.Float32BufferAttribute(foam, 1));
    return g; };
  const obc = waterMat.onBeforeCompile;
  waterMat.onBeforeCompile = function (sh) { obc.call(this, sh);
    sh.vertexShader = 'attribute vec2 aScr;\nattribute vec3 aFl;\nattribute float aFoam;\nvarying vec3 vFl;\nvarying float vFoam;\nvarying vec3 vWp;\n' + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vWp = position; vFl = aFl; vFoam = aFoam;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n vUv += vec2(fract(uTime * aScr.x), fract(uTime * aScr.y));');
    sh.fragmentShader = 'uniform float uTime;\nvarying vec3 vFl;\nvarying float vFoam;\nvarying vec3 vWp;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      if (vFl.z > 0.01) { vec2 d = normalize(vFl.xy + 1e-4); float r = sin(dot(vWp.xz, d) * 5.5 - uTime * 4.2 + sin(dot(vWp.xz, vec2(-d.y, d.x)) * 1.7 + uTime * 0.9) * 1.4);
        diffuseColor.rgb += vec3(0.07, 0.08, 0.09) * smoothstep(0.55, 1.0, r) * vFl.z; }
      if (vFoam > 0.01) { float n = 0.5 + 0.5 * sin(vWp.x * 5.1 + uTime * 3.1) * sin(vWp.z * 4.3 - uTime * 2.4) * sin(vWp.y * 6.0 + uTime * 7.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.95, 1.0), clamp(vFoam * (0.45 + 0.55 * n), 0.0, 1.0)); diffuseColor.a = mix(diffuseColor.a, 0.93, vFoam * 0.6); }`); };
  waterMat.customProgramCacheKey = () => 'c134water'; waterMat.needsUpdate = true;
  // ---------- 3) waterfall splash: a small pooled spray at the foot of falls near you, plus a low soft rush ----------
  const NP = PERF ? 70 : 150, pp = new Float32Array(NP * 3), pv = new Float32Array(NP * 3), life = new Float32Array(NP);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({color: 0xeef6ff, size: 0.16, transparent: true, opacity: 0.75, depthWrite: false})); pts.frustumCulled = false; pts.renderOrder = 4; scene.add(pts);
  let feet = [], scanT = 0, emitAcc = 0, rush = null;
  function scan() { feet = []; if (!FLV.size || DIM.cur) return; let k = 0; const px = P.x, pz = P.z;
    for (const [i] of FLV) { if (++k > 6000) break; if (world[i] !== T.WATER) continue; const x = Math.floor(i / (H * D)), y = Math.floor(i / D) % H, z = i % D; if (Math.abs(x - px) > 26 || Math.abs(z - pz) > 26) continue;
      const below = getB(x, y - 1, z); if (getB(x, y + 1, z) === T.WATER && fl(x, y + 1, z) && (below !== T.WATER || !fl(x, y - 1, z))) { let h = 1; while (h < 30 && getB(x, y + h, z) === T.WATER) h++; feet.push([x + .5, y + 1, z + .5, h]); } }
    U.splash = feet.length; }
  function tick(dt) { scanT -= dt; if (scanT <= 0) { scanT = 1; scan(); }
    if (feet.length) { emitAcc += dt * Math.min(80, feet.length * 10); while (emitAcc >= 1) { emitAcc--; const f = feet[(Math.random() * feet.length) | 0]; let j = -1; for (let n = 0; n < NP; n++) if (life[n] <= 0) { j = n; break; } if (j < 0) break;
        const a = Math.random() * 6.283, s = 0.8 + Math.random() * 1.6; pp[j * 3] = f[0] + Math.cos(a) * 0.4; pp[j * 3 + 1] = f[1] - 0.1; pp[j * 3 + 2] = f[2] + Math.sin(a) * 0.4; pv[j * 3] = Math.cos(a) * s; pv[j * 3 + 1] = 1.6 + Math.random() * 1.8 * Math.min(2, f[3] / 3); pv[j * 3 + 2] = Math.sin(a) * s; life[j] = 0.6 + Math.random() * 0.5; } }
    let any = false; for (let n = 0; n < NP; n++) { if (life[n] <= 0) { if (pp[n * 3 + 1] > -900) { pp[n * 3 + 1] = -999; any = true; } continue; } life[n] -= dt; pv[n * 3 + 1] -= 9 * dt; pp[n * 3] += pv[n * 3] * dt; pp[n * 3 + 1] += pv[n * 3 + 1] * dt; pp[n * 3 + 2] += pv[n * 3 + 2] * dt; any = true; }
    if (any) pg.attributes.position.needsUpdate = true;
    try { if (AC && master && SET.sfx > 0) { if (!rush) { const b = AC.createBuffer(1, AC.sampleRate * 3, AC.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { l = l * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = l * 6; } for (let i = 0; i < 2048; i++) { const k = i / 2048; d[i] = d[i] * k + d[d.length - 2048 + i] * (1 - k); }
          const s = AC.createBufferSource(); s.buffer = b; s.loop = true; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; const g = AC.createGain(); g.gain.value = 0; s.connect(lp); lp.connect(g); g.connect(master); s.start(); rush = g; }
        let best = 0; for (const f of feet) { const d = Math.hypot(f[0] - P.x, f[1] - P.y, f[2] - P.z); best = Math.max(best, Math.max(0, 1 - d / 22) * Math.min(1, f[3] / 4)); }
        rush.gain.setTargetAtTime(started && !paused ? best * 0.22 : 0, AC.currentTime, 0.5); } } catch (_) {} }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { if (started) tick(Math.min(0.1, +dt || 0.016)); } catch (e) { U.err = String(e); } return r; };
  // ---------- 4) the river current carries you (and dropped items) gently downstream ----------
  const up = updatePlayer; updatePlayer = function (dt) { const r = up.apply(this, arguments);
    try { if (U.RIV.size && !DIM.cur && !riding && !MODE.fly) { const x = Math.floor(P.x), z = Math.floor(P.z), y = Math.floor(P.y + 0.2), cd = U.RIV.get(x * D + z);
        if (cd !== undefined && getB(x, y, z) === T.WATER && !fl(x, y, z)) { const v = DIRS[cd], s = 0.9 * dt, nx = P.x + v[0] * s, nz = P.z + v[1] * s;
          if (!solid(Math.floor(nx), y, z) && !solid(Math.floor(nx), y + 1, z)) P.x = nx; if (!solid(Math.floor(P.x), y, Math.floor(nz)) && !solid(Math.floor(P.x), y + 1, Math.floor(nz))) P.z = nz; } }
      if (U.RIV.size) for (const d of drops) { const cd = U.RIV.get(Math.floor(d.x) * D + Math.floor(d.z)); if (cd === undefined || getB(Math.floor(d.x), Math.floor(d.y), Math.floor(d.z)) !== T.WATER) continue; const v = DIRS[cd]; if (solid(Math.floor(d.x + v[0] * 0.4), Math.floor(d.y), Math.floor(d.z + v[1] * 0.4))) continue; d.x += v[0] * 0.8 * dt; d.z += v[1] * 0.8 * dt; if (d.m) { d.m.position.x = d.x; d.m.position.z = d.z; } } } catch (_) {}
    return r; };
})();
