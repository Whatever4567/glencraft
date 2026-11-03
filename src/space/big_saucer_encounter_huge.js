/* ===================== GLX-C246 (v1.0.59): THE BIG SAUCER ENCOUNTER - a huge classic flying saucer (4x) with a ring of rainbow lights darts over the desert like a tic-tac.
   Shoot it: it spirals down trailing thick smoke and sparks, slams in with a boom, dust plume and shake, and lies smoking. An Ariel-School-style alien floats out inside a
   trippy alien-tech bubble, freezes you, and talks for ~90 s while visions and real public-domain footage play AROUND it (never over it). Then the saucer darts away. ===================== */
(function c246() {
  const U = window.__c246 = {err: null, st: 'none', spawns: 0, shot: 0, crashes: 0, trips: 0, lines: 0, clips: 0, tts: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const LOW = (typeof touchMode !== 'undefined' && !!touchMode) || (typeof PERF !== 'undefined' && PERF);
  const mine = i => typeof placedSet !== 'undefined' && placedSet && placedSet.has(i);
  const inB = (x, y, z) => x > 0 && z > 0 && y > 1 && x < W - 1 && z < D - 1 && y < H - 1;
  const top = (x, z) => { x = Math.floor(x); z = Math.floor(z); if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1) return SEA; for (let y = H - 2; y > 1; y--) { const v = world[idx(x, y, z)]; if (v && v !== T.FIRE && !PLANT[v]) return y; } return 0; };
  const DC = o => { o.traverse(c => { c.userData.__dcR = 1e9; c.userData.__dcK = 1; c.frustumCulled = false; }); return o; };
  const V = new THREE.Vector3(), V2 = new THREE.Vector3(), S = 4;
  // ---------- the saucer ----------
  const lights = [];
  function mkSaucer() { const g = new THREE.Group(), m = new THREE.Group(); g.add(m); m.scale.setScalar(S);
    const metal = new THREE.MeshStandardMaterial({color: 0xc7ced6, emissive: 0x3a434d, emissiveIntensity: 0.45, roughness: 0.25, metalness: 0.9});
    m.add(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 12).scale(3.2, 0.5, 3.2), metal));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.17, 6, 40), new THREE.MeshStandardMaterial({color: 0x6f7780, roughness: 0.35, metalness: 0.95})); rim.rotation.x = Math.PI / 2; m.add(rim);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.9, 0.25, 32, 1, true), new THREE.MeshStandardMaterial({color: 0x8a939c, roughness: 0.3, metalness: 0.9, side: THREE.DoubleSide})); band.position.y = 0.32; m.add(band);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.25, 20, 10, 0, 6.283, 0, Math.PI / 2), new THREE.MeshStandardMaterial({color: 0x8ff0ff, emissive: 0x2aa6c8, emissiveIntensity: 0.8, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.78})); dome.position.y = 0.38; m.add(dome);
    const lg = new THREE.SphereGeometry(0.17, 8, 6), N = LOW ? 24 : 36; lights.length = 0;
    for (let i = 0; i < N; i++) { const a = i / N * 6.283, l = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({color: 0xffffff})); l.position.set(Math.sin(a) * 3.05, -0.05, Math.cos(a) * 3.05); m.add(l); lights.push(l); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, l = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({color: 0xffffff})); l.position.set(Math.sin(a) * 1.9, 0.48, Math.cos(a) * 1.9); m.add(l); lights.push(l); }
    const under = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), new THREE.MeshBasicMaterial({color: 0xaaffdd, transparent: true, opacity: 0.9, side: THREE.DoubleSide})); under.rotation.x = Math.PI / 2; under.position.y = -0.52; m.add(under);
    g.userData.m = m; DC(g); scene.add(g); return g; }
  let ufo = null;
  U.spawn = () => { if (ufo || U.st !== 'none' || !started || (U.ctlOn && U.ctlOn())) return false; const g = mkSaucer(), a = Math.random() * 6.283; g.position.set(P.x + Math.sin(a) * 160, P.y + 55, P.z + Math.cos(a) * 160);
    ufo = {g, st: 'fly', t: 0, wp: null, hold: 0, v: new THREE.Vector3(), zig: 0}; U.st = 'fly'; U.spawns++; return true; };
  U.ufo = () => ufo;
  /* v1.0.112: C304 drives the saucer on its Agartha - desert route (no despawning) */
  U.spawnAt = (x, y, z) => { if (ufo || U.st !== 'none' || !started) return false; const g = mkSaucer(); g.position.set(x, y, z); ufo = {g, st: 'fly', t: 0, wp: null, hold: 0, v: new THREE.Vector3(), zig: 0}; U.st = 'fly'; U.spawns++; return true; };
  U.drop = () => { if (ufo && ufo.st === 'fly') { scene.remove(ufo.g); ufo = null; U.st = 'none'; } };
  function hue(t) { const n = lights.length; for (let i = 0; i < n; i++) lights[i].material.color.setHSL((i / n + t * 0.35) % 1, 1, 0.6); }
  function fly(dt) { const u = ufo, p = u.g.position; u.t += dt; u.g.userData.m.rotation.y += dt * 0.8; if (U.ctl && U.ctlOn && U.ctlOn()) { U.ctl(u, dt); return; }
    if (u.hold > 0) { u.hold -= dt; p.y += Math.sin(u.t * 2) * dt * 0.6; return; }
    if (!u.wp) { const leave = u.t > 70; u.zig = (u.zig + 1) % 4; u.wp = leave ? new THREE.Vector3(p.x + (p.x - P.x) * 6, p.y + 200, p.z + (p.z - P.z) * 6)
        : u.zig ? new THREE.Vector3(p.x + (Math.random() - .5) * 70, P.y + 40 + Math.random() * 25, p.z + (Math.random() - .5) * 70) : new THREE.Vector3(P.x + (Math.random() - .5) * 120, P.y + 42 + Math.random() * 25, P.z + (Math.random() - .5) * 120); }
    V.copy(u.wp).sub(p); const L = V.length(), sp = Math.min(L, 140 * dt); p.addScaledVector(V, sp / Math.max(L, 1e-3));   // instant darts, then dead-still hovering
    u.g.rotation.z = Math.max(-0.25, Math.min(0.25, -V.x / Math.max(L, 1) * 0.3)); if (L < 1) { u.wp = null; u.hold = u.zig ? 0.25 + Math.random() * 0.6 : 1.5 + Math.random() * 3; u.g.rotation.z = 0; if (u.t > 70) { scene.remove(u.g); ufo = null; U.st = 'none'; } }
    if (Math.hypot(p.x - P.x, p.z - P.z) > 450) { scene.remove(u.g); ufo = null; U.st = 'none'; } }
  // ---------- smoke, sparks, dust (pooled points, no allocation per frame) ----------
  function pool(n, col, size, add) { const P3 = new Float32Array(n * 3), VL = new Float32Array(n * 4), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P3, 3)); for (let i = 0; i < n; i++) P3[i * 3 + 1] = -999;
    const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), q = x.createRadialGradient(16, 16, 0, 16, 16, 16); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = q; x.fillRect(0, 0, 32, 32);
    const pts = new THREE.Points(g, new THREE.PointsMaterial({color: col, size, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: add ? 1 : 0.8, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, fog: !add}));
    DC(pts); scene.add(pts); return {P3, VL, g, n, i: 0, pts}; }
  let smoke = null, spark = null, dust = null;
  function emit(pl, x, y, z, vx, vy, vz, life, k) { for (let j = 0; j < k; j++) { const i = pl.i = (pl.i + 1) % pl.n; pl.P3[i * 3] = x + (Math.random() - .5) * 3; pl.P3[i * 3 + 1] = y + (Math.random() - .5) * 2; pl.P3[i * 3 + 2] = z + (Math.random() - .5) * 3;
    pl.VL[i * 4] = vx + (Math.random() - .5) * 3; pl.VL[i * 4 + 1] = vy + Math.random() * 2; pl.VL[i * 4 + 2] = vz + (Math.random() - .5) * 3; pl.VL[i * 4 + 3] = life; } }
  function stepPool(pl, dt, grav, drag) { if (!pl) return; const P3 = pl.P3, VL = pl.VL; for (let i = 0; i < pl.n; i++) { if (VL[i * 4 + 3] <= 0) continue; VL[i * 4 + 3] -= dt; if (VL[i * 4 + 3] <= 0) { P3[i * 3 + 1] = -999; continue; }
      VL[i * 4 + 1] -= grav * dt; const d = 1 - drag * dt; VL[i * 4] *= d; VL[i * 4 + 2] *= d; P3[i * 3] += VL[i * 4] * dt; P3[i * 3 + 1] += VL[i * 4 + 1] * dt; P3[i * 3 + 2] += VL[i * 4 + 2] * dt; } pl.g.attributes.position.needsUpdate = true; }
  function pools() { if (smoke) return; smoke = pool(LOW ? 160 : 360, 0x2b2622, LOW ? 9 : 7, false); spark = pool(LOW ? 80 : 180, 0xffa040, 1.4, true); dust = pool(LOW ? 90 : 200, 0xb39a72, LOW ? 12 : 10, false); }
  // ---------- shot -> spiral crash ----------
  try { const fg = fireGun; fireGun = function (id) { const d = lookDir().slice(), o = new THREE.Vector3(P.x, P.y + 1.62, P.z); const r = fg.apply(this, arguments);
      try { if (ufo && ufo.st === 'fly') { const c = ufo.g.position; V.copy(c).sub(o); const t = V.x * d[0] + V.y * d[1] + V.z * d[2]; if (t > 0 && t < 400) { const px = o.x + d[0] * t - c.x, py = o.y + d[1] * t - c.y, pz = o.z + d[2] * t - c.z; if (Math.hypot(px, py * 2, pz) < 3.3 * S) startCrash(); } } } catch (e) { ERR('shot', e); } return r; }; } catch (e) { ERR('fg', e); }
  function startCrash() { const u = ufo, p = u.g.position; U.shot++; u.st = 'spiral'; U.st = 'crash'; pools(); try { sfx('boom'); burst(p.x, p.y, p.z, 0xffffff, 30, 3); } catch (_) {}
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), tx = Math.floor(P.x + fx * 40), tz = Math.floor(P.z + fz * 40); u.t0 = p.clone(); u.tg = new THREE.Vector3(tx + .5, top(tx, tz) + 1.2, tz + .5); u.ct = 0; u.CT = 9; try { toast('The saucer is going down!'); } catch (_) {} }
  U.forceCrash = () => { if (!ufo) U.spawn(); startCrash(); };
  function spiral(dt) { const u = ufo, p = u.g.position; u.ct += dt; const k = Math.min(1, u.ct / u.CT), e = k * k, R = 28 * (1 - k);
    p.lerpVectors(u.t0, u.tg, e); p.x += Math.sin(u.ct * 2.2) * R; p.z += Math.cos(u.ct * 2.2) * R; u.g.userData.m.rotation.y += dt * (3 + 6 * k); u.g.rotation.x = 0.5 * k + Math.sin(u.ct * 3) * 0.15; u.g.rotation.z = 0.35 * k;
    emit(smoke, p.x, p.y, p.z, 0, 3, 0, 5 + Math.random() * 3, LOW ? 2 : 4); if (Math.random() < 0.7) emit(spark, p.x, p.y, p.z, (Math.random() - .5) * 18, 6, (Math.random() - .5) * 18, 1.2, LOW ? 2 : 4);
    if (k >= 1) impact(); }
  function impact() { const u = ufo, p = u.g.position, X = Math.floor(p.x), Y = Math.floor(p.y - 1), Z = Math.floor(p.z); u.st = 'wreck'; U.crashes++; const R = 6.5;
    for (let dx = -7; dx <= 7; dx++) for (let dy = -4; dy <= 4; dy++) for (let dz = -7; dz <= 7; dz++) { if (Math.hypot(dx, dy * 1.5, dz) > R) continue; const x = X + dx, y = Y + dy, z = Z + dz; if (!inB(x, y, z)) continue; const i = idx(x, y, z), b = world[i];
      if (!b || b === T.WATER || mine(i) || (ENT[b] && !PLANT[b])) continue; world[i] = 0; try { FLV.delete(i); markDirty(x, z); flQueue(x, y, z); } catch (_) {} }
    try { dirty = true; } catch (_) {} let fy = Y; while (fy > 2 && !world[idx(X, fy - 1, Z)]) fy--; p.set(X + .5, fy + 0.6 * S * 0.5, Z + .5); u.g.rotation.set(0.32, 0, 0.22);
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283, x = Math.floor(X + Math.sin(a) * 9), z = Math.floor(Z + Math.cos(a) * 9), t = top(x, z); try { if (t && window.__c237) __c237.ignite(x + .5, t + 1.02, z + .5); } catch (_) {} }
    try { sfx('boom'); setTimeout(() => { try { sfx('boom'); } catch (_) {} }, 180); shake(2.5, 0.45); burst(X, fy + 1, Z, 0xff8a30, 40, 4); } catch (_) {}
    for (let i = 0; i < 6; i++) emit(dust, X, fy + 1, Z, (Math.random() - .5) * 26, 7 + Math.random() * 6, (Math.random() - .5) * 26, 6 + Math.random() * 3, LOW ? 10 : 22);
    emit(spark, X, fy + 2, Z, 0, 14, 0, 2, LOW ? 30 : 70);
    try { if (window.__c243 && __c243.addPuddle) __c243.addPuddle(X + 0.5 + 9, top(X + 9, Z), Z + 0.5); } catch (_) {}
    u.wt = 0; u.wait = 1; }   // v1.0.74: the alien waits inside the wreck until you walk up to it (c262)
  function wreck(dt) { const u = ufo, p = u.g.position; u.wt = (u.wt || 0) + dt; if (Math.random() < (LOW ? 0.5 : 1)) emit(smoke, p.x + (Math.random() - .5) * 6, p.y + 1, p.z + (Math.random() - .5) * 6, 1, 3.5, 0.4, 6 + Math.random() * 4, 1); if (Math.random() < 0.08) emit(spark, p.x, p.y + 1, p.z, 0, 5, 0, 0.8, 3);
    for (let i = 0; i < lights.length; i++) lights[i].visible = Math.random() > 0.35; }
  U.leave = () => { if (!ufo) return; const u = ufo; for (const l of lights) l.visible = true; u.st = 'fly'; u.t = 71; u.wp = null; u.hold = 1.2; u.g.rotation.set(0, 0, 0); u.g.position.y += 3; U.st = 'leaving'; };   // v1.1.36: the saucer takes off silently, no boom at any distance
  function frame(dt) { if (!started) return; const t = performance.now() / 1000; if (ufo) { hue(t); if (ufo.st === 'fly') fly(dt); else if (ufo.st === 'spiral') spiral(dt); else if (ufo.st === 'wreck') wreck(dt); }
    stepPool(smoke, dt, -0.6, 0.25); stepPool(spark, dt, 12, 0.6); stepPool(dust, dt, 2.5, 0.9); if (!ufo && U.st === 'leaving') U.st = 'none'; }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { const nw = performance.now(), wd = (nw - (us._w||nw)) / 1000; us._w = nw; frame(Math.min(0.25, Math.max(+dt || 0.016, wd))); } catch (e) { ERR('fr', e); } return r; };
  try { const ew = enterWorld; enterWorld = function () { if (ufo) { scene.remove(ufo.g); ufo = null; } U.st = 'none'; return ew.apply(this, arguments); }; } catch (e) { ERR('ew', e); }
})();
