/* ===================== GLX-C169 (v1.0.31): Hell overhaul 3 - build decor meshes (red glass, chains, banners, braziers), save/load, existing Hells get the builds bit by bit, a blood-red sky and brighter light ===================== */
(function c169() {
  const C = window.__c167, A = window.__c150; if (!C || !A) return;
  const U = window.__c169 = {groups: new Map(), err: null, st: {}, biome: -2};
  const ERR = e => { U.err = String(e && e.stack || e); };
  // ---------- 1. decor meshes per build, made near the player, one per tick ----------
  function buildGroup(ci) { const K = A.kit(); let n = 0;
    for (const p of C.props) { if (p.c !== ci || p.dead) continue; const d = A.DRAW[p.t]; if (!d) continue; K.at(p.x, p.y, p.z, p.f); try { d(K, p); n++; } catch (e) { ERR(e); } }
    const grp = new THREE.Group(); grp.name = 'c169-' + ci;
    [[K.L, A.mats[0]], [K.G, A.mats[1]]].forEach(([Q, m]) => { if (!Q.p.length) return; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(Q.p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(Q.n, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(Q.u, 2)); geo.computeBoundingSphere();
      const me = new THREE.Mesh(geo, m); me.matrixAutoUpdate = false; grp.add(me); });
    grp.userData.n = n; return grp; }
  function drop(ci) { const g = U.groups.get(ci); if (!g) return; scene.remove(g); g.children.forEach(m => m.geometry.dispose()); U.groups.delete(ci); }
  U.clear = () => { for (const ci of [...U.groups.keys()]) drop(ci); };
  function tick() { if (typeof started === 'undefined' || !started || DIM.cur !== 'hell' || !C.b.length) { if (U.groups.size) U.clear(); return; }
    let made = false;
    C.b.forEach((b, ci) => { const d = Math.hypot(P.x - b[1], P.z - b[2]), has = U.groups.get(ci);
      if (d < 150) { let ch = false; for (const p of C.props) if (p.c === ci && !p.dead && p.a && world[idx(p.a[0], p.a[1], p.a[2])] !== p.a[3]) { p.dead = 1; ch = true; }
        if ((!has || ch) && !made) { drop(ci); const g = buildGroup(ci); scene.add(g); U.groups.set(ci, g); made = true; } }
      else if (has && d > 200) drop(ci); }); }
  setInterval(() => { try { tick(); } catch (e) { ERR(e); } }, 600);
  // ---------- 2. save / load with the Hell ----------
  const TY = Object.keys(A.DRAW);
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && DIM.cur === 'hell') { if (C.v) d.c167 = {v: 1, b: C.b}; if (C.props.length) d.c167p = C.props.map(p => [TY.indexOf(p.t), p.c, p.x, p.y, p.z, p.f, p.v || 0, p.w || 0, p.d || 0, p.h || 0, p.L || 0, p.a ? p.a.join(',') : '', p.dead ? 1 : 0]); } } catch (e) { ERR(e); } return d; };
  const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && d.dim === 'hell') { U.clear();
        C.b = d.c167 && Array.isArray(d.c167.b) ? d.c167.b : []; C.v = d.c167 ? 1 : 0; C.retro = d.c167 ? null : {st: 'pick', i: 0, t: 1.5};
        C.props = (d.c167p || []).map(q => { const o = {t: TY[q[0]], c: q[1], x: q[2], y: q[3], z: q[4], f: q[5]}; if (q[6]) o.v = q[6]; if (q[7]) o.w = q[7]; if (q[8]) o.d = q[8]; if (q[9]) o.h = q[9]; if (q[10]) o.L = q[10]; if (q[11]) o.a = q[11].split(',').map(Number); if (q[12]) o.dead = 1; return o; }).filter(o => o.t); } } catch (e) { ERR(e); } return r; };
  // ---------- 3. existing Hells: the builds go in one slice at a time, only on untouched natural rock ----------
  function relight(cx, cz, R) { try { const LT = new Set([T.TORCH, 161, 216]), x0 = cx - R, x1 = cx + R, z0 = cz - R, z1 = cz + R;
      for (const [key, v] of [...lightSrc]) if (v[0] >= x0 && v[0] <= x1 + 1 && v[2] >= z0 && v[2] <= z1 + 1) lightSrc.delete(key);
      for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) for (let y = 0; y < H; y++) for (let z = Math.max(0, z0); z <= Math.min(D - 1, z1); z++) { const b = world[idx(x, y, z)]; if (LT.has(b)) lightSrc.set((x * 4096 + z) * 256 + y, [x + .5, y + (b === T.TORCH ? .7 : .5), z + .5, b]); }
      if (typeof farGlow !== 'undefined' && farGlow) farGlow.userData.dirty = true; } catch (e) { ERR(e); }
    for (let x = cx - R; x <= cx + R; x += 8) for (let z = cz - R; z <= cz + R; z += 8) try { markDirty(Math.max(0, Math.min(W - 1, x)), Math.max(0, Math.min(D - 1, z))); } catch (_) {} }
  const natCol = (x, z) => { for (let y = 1; y < H - 1; y++) if (!C.NAT.has(world[idx(x, y, z)])) return false; return true; };
  function retro(dt) { const R = C.retro; if (!R || !started || paused || DIM.busy || DIM.cur !== 'hell') return; if ((R.t -= dt) > 0) return; R.t = 0.3; const t0 = performance.now();
    if (R.st === 'pick') { if (R.i === 0) C.b = []; const e = C.pickOne(R.i, true, C.b); if (e) C.b.push(e); if (++R.i >= 4) { R.st = 'raise'; R.i = 0; } }
    else if (R.st === 'raise') { const b = C.b[R.i]; if (b) { C.raise(b, R.i, true); relight(b[1], b[2], 32); } if (++R.i >= C.b.length) { R.st = 'land'; R.i = 0; } }
    else if (R.st === 'land') { const b = C.b[R.i]; if (b) { const RR = 44; for (let x = b[1] - RR; x <= b[1] + RR; x++) for (let z = b[2] - RR; z <= b[2] + RR; z++) { if (x < 2 || z < 2 || x > W - 3 || z > D - 3 || Math.hypot(x - b[1], z - b[2]) > RR) continue; if (natCol(x, z)) C.column(x, z); } relight(b[1], b[2], RR); }
      if (++R.i >= C.b.length) R.st = 'fort'; }
    else { const n = C.fortLights(); if (hellFort) relight(hellFort.x - 8, hellFort.z, 60); C.retro = null; C.v = 1; U.st.retro = {builds: C.b.map(b => b[0]), fort: n};
      try { let x = Math.floor(P.x), z = Math.floor(P.z), y = Math.floor(P.y); const free = yy => !solid(x, yy, z) && !solid(x, yy + 1, z); if (!free(y)) { while (y < H - 3 && !free(y)) y++; P.y = y + 0.01; P.vy = 0; } } catch (_) {}
      if (C.b.length) try { toast('Something vast has risen in the depths of Hell...'); } catch (_) {} }
    U.st.ms = Math.max(U.st.ms || 0, Math.round(performance.now() - t0)); }
  // ---------- 4. sky + light: a blood-red sky instead of black, a brighter red haze, warmer light ----------
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments);
    try { if (typeof DIM !== 'undefined' && DIM.cur === 'hell') { const f = 0.95 + Math.sin(performance.now() / 1100) * 0.04;
        skyUniforms.dark.value = 0; skyUniforms.sunK.value = 0; skyUniforms.top.value.setRGB(0.34 * f, 0.035, 0.03); skyUniforms.hor.value.setRGB(0.74 * f, 0.15 * f, 0.08);
        scene.fog.color.setRGB(0.5 * f, 0.1 * f, 0.06 * f); scene.background.copy(scene.fog.color); scene.fog.near = 10; scene.fog.far = PERF ? 44 : 62; { const cf = scene.fog.far + 10; if (Math.abs(camera.far - cf) > 1) { camera.far = cf; camera.updateProjectionMatrix(); } }
        hemi.intensity = 1.15 * f; hemi.color.setRGB(1, 0.72, 0.56); hemi.groundColor.setRGB(0.78, 0.32, 0.16); } } catch (e) { ERR(e); }
    try { retro(+dt || 0.016); } catch (e) { ERR(e); C.retro = null; }
    return r; };
  // ---------- 5. a word when you cross into a new biome or reach a build ----------
  let seen = new Set(), last = -2, hold = 0;
  setInterval(() => { try { if (!started || DIM.cur !== 'hell' || !C.b.length) { last = -2; seen = new Set(); return; } const bi = C.biomeAt(Math.floor(P.x), Math.floor(P.z));
      if (bi !== last) { if (++hold >= 2) { last = bi; hold = 0; U.biome = bi; if (bi >= 0) toast(C.BIOME[bi]); } } else hold = 0;
      for (const b of C.b) { const k = b[0]; if (!seen.has(k) && Math.hypot(P.x - b[1], P.z - b[2]) < 36) { seen.add(k); toast('You come upon ' + C.NAME[k] + '...'); } } } catch (e) { ERR(e); } }, 1000);
})();
