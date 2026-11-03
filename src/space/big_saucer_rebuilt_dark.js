/* GLX-C252 (v1.0.64): the big saucer rebuilt - dark gunmetal hull with a greebled hex-plated UNDERSIDE, radial struts to a blazing core
   with a hanging spire and beam, concentric rainbow rings and dotted LED rims, hundreds of twinkling rainbow sparkles, a far-visible glow
   and a soft rainbow glow on the ground below. Procedural textures + instancing (one draw per layer) for phone perf. */
(() => {
  const U = window.__c252 = {err: null, built: 0};
  const ERR = (w, e) => { U.err = w + ': ' + ((e && e.message) || e); };
  const LOW = typeof PERF !== 'undefined' && PERF || (typeof touchMode !== 'undefined' && touchMode);
  const cv = n => { const c = document.createElement('canvas'); c.width = c.height = n; return c; };
  let TX = null;
  function tex() { if (TX) return TX; TX = {};
    // underside plating: hex panels, greebles, radial struts, rings
    const c = cv(LOW ? 512 : 1024), g = c.getContext('2d'), N = c.width, C = N / 2; g.fillStyle = '#1c1f24'; g.fillRect(0, 0, N, N);
    const hs = N / 34; for (let y = 0; y < N + hs; y += hs * 0.87) for (let x = 0; x < N + hs; x += hs) { const ox = (Math.round(y / (hs * 0.87)) % 2) * hs / 2, cx = x + ox, cy = y;
      const v = 30 + Math.random() * 34 | 0; g.fillStyle = `rgb(${v},${v + 3},${v + 8})`; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + 0.52; g.lineTo(cx + Math.cos(a) * hs * 0.5, cy + Math.sin(a) * hs * 0.5); } g.fill();
      g.strokeStyle = '#0b0c0f'; g.lineWidth = 1.5; g.stroke(); if (Math.random() < 0.18) { g.fillStyle = '#5a616b'; g.fillRect(cx - hs * 0.15, cy - hs * 0.15, hs * 0.3, hs * 0.3); } }
    for (let i = 0; i < 260; i++) { const a = Math.random() * 6.283, r = C * (0.15 + Math.random() * 0.8), w = 4 + Math.random() * 18, h = 3 + Math.random() * 10, v = 50 + Math.random() * 60 | 0;
      g.save(); g.translate(C + Math.cos(a) * r, C + Math.sin(a) * r); g.rotate(a); g.fillStyle = `rgb(${v},${v},${v + 10})`; g.fillRect(-w / 2, -h / 2, w, h); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(-w / 2, h / 2 - 2, w, 2); g.restore(); }
    for (const r of [0.22, 0.42, 0.62, 0.82, 0.97]) { g.strokeStyle = '#0a0b0d'; g.lineWidth = N / 120; g.beginPath(); g.arc(C, C, C * r, 0, 6.283); g.stroke(); g.strokeStyle = '#4d535c'; g.lineWidth = N / 400; g.beginPath(); g.arc(C, C, C * r - N / 160, 0, 6.283); g.stroke(); }
    for (let k = 0; k < 6; k++) { g.save(); g.translate(C, C); g.rotate(k / 6 * 6.283); g.fillStyle = '#2a2e35'; g.fillRect(C * 0.12, -N / 70, C * 0.86, N / 35); g.fillStyle = '#6b727c'; g.fillRect(C * 0.12, -N / 300, C * 0.86, N / 150); g.restore(); }
    TX.under = new THREE.CanvasTexture(c);
    const d = cv(64), q = d.getContext('2d'), gr = q.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); TX.dot = new THREE.CanvasTexture(d);
    const e = cv(256), r2 = e.getContext('2d'); for (let k = 0; k < 6; k++) { const a0 = k / 6 * 6.283; r2.fillStyle = `hsl(${k * 60},100%,60%)`; r2.beginPath(); r2.moveTo(128, 128); r2.arc(128, 128, 128, a0, a0 + 1.06); r2.fill(); }
    r2.globalCompositeOperation = 'destination-in'; const g3 = r2.createRadialGradient(128, 128, 0, 128, 128, 128); g3.addColorStop(0, 'rgba(0,0,0,.95)'); g3.addColorStop(0.5, 'rgba(0,0,0,.45)'); g3.addColorStop(1, 'rgba(0,0,0,0)'); r2.fillStyle = g3; r2.fillRect(0, 0, 256, 256); TX.ground = new THREE.CanvasTexture(e);
    return TX; }
  const add = c => new THREE.PointsMaterial({size: 1, map: tex().dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, sizeAttenuation: true});
  function pts(list, size) { const geo = new THREE.BufferGeometry(), n = list.length, P = new Float32Array(n * 3), Cc = new Float32Array(n * 3);
    list.forEach((p, i) => { P[i * 3] = p[0]; P[i * 3 + 1] = p[1]; P[i * 3 + 2] = p[2]; }); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
    const m = add(); m.size = size; const o = new THREE.Points(geo, m); o.frustumCulled = false; o.renderOrder = 6; o.userData.ph = list.map(p => p[3] || 0); return o; }
  function decorate(g) { const m = g.userData.m, T = tex(), parts = {}; m.userData.c252 = parts;
    m.traverse(o => { if (o.isMesh && o.material && o.material.metalness > 0.5) { o.material.color.setHex(0x3a3f46); o.material.emissive && o.material.emissive.setHex(0x0d0f12); o.material.roughness = 0.45; } });
    const under = new THREE.Mesh(new THREE.CircleGeometry(3.12, 48), new THREE.MeshStandardMaterial({map: T.under, color: 0x9aa2ad, emissive: 0x15171b, emissiveMap: T.under, emissiveIntensity: 0.6, roughness: 0.6, metalness: 0.7, side: THREE.DoubleSide}));
    under.rotation.x = Math.PI / 2; under.position.y = -0.3; m.add(under);
    // greebles: one instanced draw
    const NG = LOW ? 120 : 260, gm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color: 0x5a616b, roughness: 0.5, metalness: 0.8}), NG), M4 = new THREE.Object3D();
    for (let i = 0; i < NG; i++) { const a = Math.random() * 6.283, r = 0.55 + Math.random() * 2.4; M4.position.set(Math.sin(a) * r, -0.33 - Math.random() * 0.05, Math.cos(a) * r); M4.rotation.set(0, a, 0); M4.scale.set(0.06 + Math.random() * 0.18, 0.03 + Math.random() * 0.08, 0.06 + Math.random() * 0.22); M4.updateMatrix(); gm.setMatrixAt(i, M4.matrix); }
    m.add(gm);
    const sm = new THREE.MeshStandardMaterial({color: 0x30343b, roughness: 0.4, metalness: 0.9});
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283, s = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 2.6), sm); s.position.set(Math.sin(a) * 1.65, -0.42, Math.cos(a) * 1.65); s.rotation.set(-0.08, a, 0); m.add(s); }
    // core + spire + beam
    const coreM = new THREE.MeshBasicMaterial({color: 0xffffff, fog: false}); const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 10), coreM); core.position.y = -0.55; m.add(core);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.16, 1.6, 8), new THREE.MeshStandardMaterial({color: 0x4a5058, metalness: 0.9, roughness: 0.3, emissive: 0x222222})); sp.position.y = -1.3; m.add(sp);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 6), coreM); tip.position.y = -2.1; m.add(tip);
    const beamM = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false});
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.9, 6, 20, 1, true), beamM); beam.position.y = -5; m.add(beam);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({map: T.dot, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false})); halo.scale.set(3, 3, 1); halo.position.y = -0.6; m.add(halo);
    const far = new THREE.Sprite(new THREE.SpriteMaterial({map: T.dot, color: 0xff66cc, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, fog: false})); far.scale.set(11, 4.5, 1); far.position.y = -0.4; m.add(far);
    // glowing rings (rainbow, one material each so they chase)
    const rings = []; for (const [r, th] of [[0.8, 0.035], [1.45, 0.03], [2.15, 0.03], [2.85, 0.045]]) { const rm = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false});
      const t = new THREE.Mesh(new THREE.TorusGeometry(r, th, 4, 64), rm); t.rotation.x = Math.PI / 2; t.position.y = -0.36; m.add(t); rings.push(t); }
    // dotted LED rims + sparkles (instanced as Points)
    const L = []; for (const [r, y, n] of [[3.18, -0.05, LOW ? 90 : 150], [3.0, -0.22, LOW ? 80 : 130], [2.5, -0.33, LOW ? 60 : 100]]) for (let i = 0; i < n; i++) { const a = i / n * 6.283; L.push([Math.sin(a) * r, y, Math.cos(a) * r, i / n]); }
    const leds = pts(L, 0.28); m.add(leds);
    const Sp = []; for (let i = 0; i < (LOW ? 220 : 420); i++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * 3.05, top = Math.random() < 0.3; Sp.push([Math.sin(a) * r, top ? 0.1 + Math.random() * 0.3 : -0.36, Math.cos(a) * r, Math.random() * 50]); }
    const spk = pts(Sp, 0.22); m.add(spk);
    m.traverse(o => { o.frustumCulled = false; o.userData.__dcR = 1e9; o.userData.__dcK = 1; });
    // ground glow (in scene, follows the saucer)
    const gd = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map: T.ground, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, polygonOffset: true, polygonOffsetFactor: -4}));
    gd.rotation.x = -Math.PI / 2; gd.frustumCulled = false; scene.add(gd);
    const px = new THREE.Sprite(new THREE.SpriteMaterial({map: T.dot, color: 0xffffff, transparent: true, depthWrite: false, depthTest: true, fog: false})); px.frustumCulled = false; px.renderOrder = 0; scene.add(px); parts.px = px;
    Object.assign(parts, {coreM, beamM, halo, far, rings, leds, spk, gd}); U.built++; }
  const col = new THREE.Color();
  const top = (x, z) => { try { x = Math.floor(x); z = Math.floor(z); if (z < 1 && __XG && x >= 1 && x < W - 1) return groundTop(x, z); if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1) return SEA; for (let y = H - 2; y > 1; y--) { const v = world[idx(x, y, z)]; if (v && v !== T.FIRE && !PLANT[v]) return y; } } catch (_) {} return 0; };
  let gdT = 0, lastG = null;
  function frame(dt) { const u = window.__c246 && __c246.ufo && __c246.ufo(); if (!u || !u.g) { if (lastG && lastG.userData.m.userData.c252) { scene.remove(lastG.userData.m.userData.c252.gd); scene.remove(lastG.userData.m.userData.c252.px); } lastG = null; return; }
    try { window.__c246b && __c246b.prefetch && __c246b.prefetch(); } catch (_) {} const m = u.g.userData.m; if (!m) return; if (!m.userData.c252) { try { decorate(u.g); } catch (e) { ERR('dec', e); m.userData.c252 = {fail: 1}; } } const P2 = m.userData.c252; if (P2.fail) return; lastG = u.g;
    const t = performance.now() / 1000, dead = u.st === 'wreck', on = dead ? (Math.random() > 0.4 ? 0.5 : 0.1) : 1, night = Math.max(0, Math.min(1, (0.7 - (typeof daylight === 'number' ? daylight : 1)) / 0.6));
    col.setHSL((t * 0.25) % 1, 1, 0.65); P2.coreM.color.copy(col).lerp(new THREE.Color(1, 1, 1), 0.55); P2.halo.material.color.copy(col); P2.halo.material.opacity = on;
    P2.beamM.color.copy(col); P2.beamM.opacity = (dead ? 0 : 0.1 + night * 0.12); P2.far.material.color.copy(col); P2.far.material.opacity = (0.15 + night * 0.4) * on;
    P2.rings.forEach((r, i) => { r.material.color.setHSL((t * 0.4 + i * 0.17) % 1, 1, 0.6); r.material.opacity = 0.9 * on; });
    const lc = P2.leds.geometry.attributes.color, lp = P2.leds.userData.ph; for (let i = 0; i < lp.length; i++) { col.setHSL((lp[i] * 3 + t * 0.5) % 1, 1, 0.6); const k = (0.55 + 0.45 * Math.sin(lp[i] * 80 - t * 9)) * on; lc.setXYZ(i, col.r * k, col.g * k, col.b * k); } lc.needsUpdate = true;
    const sc = P2.spk.geometry.attributes.color, sp = P2.spk.userData.ph; for (let i = 0; i < sp.length; i++) { const k = Math.pow(0.5 + 0.5 * Math.sin(sp[i] + t * (2 + (i % 7))), 6) * on; col.setHSL((sp[i] * 0.13 + t * 0.2) % 1, 1, 0.65); sc.setXYZ(i, col.r * k * 1.5, col.g * k * 1.5, col.b * k * 1.5); } sc.needsUpdate = true;
    P2.leds.material.size = 0.28 + night * 0.12; const p = u.g.position, gd = P2.gd;
    if ((gdT -= dt) <= 0) { gdT = 0.25; gd.userData.y = top(p.x, p.z) + 1.02; } const hgt = p.y - (gd.userData.y || 0), R = 34 + Math.min(30, hgt * 0.3);
    gd.position.set(p.x, gd.userData.y || 0, p.z); gd.scale.set(R, R, 1); gd.rotation.z = t * 0.3; gd.material.opacity = dead ? 0 : Math.max(0, 1 - hgt / 140) * (0.35 + night * 0.65); gd.visible = gd.material.opacity > 0.02 && p.y > (gd.userData.y || 0) + 2;
    // far proxy: beyond the view distance the saucer is drawn as a bright rainbow glow at the edge of view, so it is visible from far away
    const cp = camera.position, dd = cp.distanceTo(p), lim = camera.far * 0.85, px = P2.px; px.visible = dd > lim * 0.8 && dd < 420 && !dead && !DIM.cur && !(window.__c304 && __c304.pos && __c304.pos[0] !== 'ow') && p.y > top(p.x, p.z) + 4; /* v1.0.116: depth tested, culled past 420, never in Agartha or underground */
    if (px.visible) { const kk = Math.min(1, (dd - lim * 0.8) / (lim * 0.2)); px.position.copy(p).sub(cp).multiplyScalar(Math.min(1, lim / dd)).add(cp); const sz = 26 * 4 * Math.min(1, lim / dd) * (1 + night); px.scale.set(sz, sz * 0.45, 1); px.material.color.copy(col); px.material.opacity = kk * (0.4 + night * 0.6); } }
  try { const us = updateSky; let lt = performance.now(); updateSky = function () { const r = us.apply(this, arguments); const n = performance.now(), dt = Math.min(0.1, (n - lt) / 1000); lt = n; try { frame(dt); } catch (e) { ERR('f', e); } return r; }; } catch (e) { ERR('wrap', e); }
})();
