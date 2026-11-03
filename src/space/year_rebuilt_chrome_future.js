/* GLX-C255 (v1.0.66, v1.0.74 every mesh): YEAR 24000 rebuilt as a chrome future - every block turns mirror-chrome (in-place env-map swap on the shared block
   materials, restored after), a neon-seamed mirror grid floor, a deep purple sky, a neon skyline with 24,000 AE signs, saucers overhead,
   a chrome Sphinx and chrome robots framed in a wide, steady shot of the pyramid. Light on phones: one env texture, shared materials. */
(() => {
  const U = window.__c255 = {err: null, on: 0, mats: 0};
  const ERR = (w, e) => { U.err = w + ': ' + ((e && e.message) || e); };
  const LOW = (typeof touchMode !== 'undefined' && !!touchMode) || (typeof PERF !== 'undefined' && PERF);
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  let ENV = null, GRID = null;
  function env() { if (ENV) return ENV; const c = cv(512, 256), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#0a0420'); gr.addColorStop(0.35, '#3a1270'); gr.addColorStop(0.48, '#ff4fd8'); gr.addColorStop(0.52, '#4fb4ff'); gr.addColorStop(0.62, '#1a0838'); gr.addColorStop(1, '#05020c'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    for (let x = 0; x < 512; x += 6 + Math.random() * 10) { const h = 20 + Math.random() * 70, w = 4 + Math.random() * 8; g.fillStyle = '#0b0618'; g.fillRect(x, 128 - h, w, h);
      for (let k = 0; k < h / 5; k++) if (Math.random() < 0.4) { g.fillStyle = Math.random() < 0.5 ? '#ff5ce0' : '#5cd0ff'; g.fillRect(x + 1, 128 - h + k * 5, w - 2, 1); } }
    g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 90; i++) g.fillRect(Math.random() * 512, Math.random() * 90, 1, 1);
    ENV = new THREE.CanvasTexture(c); ENV.mapping = THREE.EquirectangularReflectionMapping; return ENV; }
  function grid() { if (GRID) return GRID; const c = cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#07040f'; g.fillRect(0, 0, 256, 256);
    const sm = (x, y, w, h, col) => { g.shadowColor = col; g.shadowBlur = 10; g.fillStyle = col; g.fillRect(x, y, w, h); }; sm(0, 0, 256, 3, '#b84dff'); sm(0, 0, 3, 256, '#4da6ff'); sm(0, 128, 256, 1.5, 'rgba(255,80,210,.8)'); sm(128, 0, 1.5, 256, 'rgba(255,80,210,.8)');
    g.shadowBlur = 0; for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(120,200,255,.9)'; g.fillRect(Math.random() * 230, Math.random() * 250, 26, 2); }
    GRID = new THREE.CanvasTexture(c); GRID.wrapS = GRID.wrapT = THREE.RepeatWrapping; GRID.repeat.set(40, 40); return GRID; }
  // ---- chrome swap on every block material (in place, so chunks rebuilt during the vision are chrome too) ----
  let saved = null;
  function worldMats() { const S = new Set(), add = m => { if (Array.isArray(m)) m.forEach(add); else if (m && m.isMaterial) S.add(m); };
    try { for (const k in BLOCK_MATS) add(BLOCK_MATS[k]); } catch (_) {} try { for (const k in PLANT_MATS) add(PLANT_MATS[k]); } catch (_) {} try { if (window.__TA && __TA.mat) add(__TA.mat); } catch (_) {}
    try { const G = window.__c248 && __c248.g; const skip = o => { for (let q = o; q; q = q.parent) { if (q === G || (q.userData && (q.userData.__dcK || q.userData.c255skip))) return true; } return false; };   // v1.0.74: EVERY solid mesh in the world - pyramid, sand, statues, trees, props
      scene.traverse(o => { if (!(o.isMesh || o.isInstancedMesh) || !o.visible) return; const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of ms) { if (!m || !m.isMaterial || m.isShaderMaterial || m.isSpriteMaterial || m.isPointsMaterial || m.blending === THREE.AdditiveBlending || (m.transparent && m.opacity < 0.6)) continue; if (o.userData.merged || !skip(o)) S.add(m); } }); } catch (_) {} return S; }
  function chrome() { saved = new Map(); const E = env();
    for (const m of worldMats()) { if (m.blending === THREE.AdditiveBlending) continue; saved.set(m, {c: m.color ? m.color.getHex() : null, env: m.envMap, refl: m.reflectivity, comb: m.combine, met: m.metalness, rou: m.roughness, em: m.emissive ? m.emissive.getHex() : null});
      m.envMap = E; if (m.color) m.color.setHex(0xaab2c8); if (m.emissive) m.emissive.setHex(0x0a0618);
      if (m.isMeshStandardMaterial) { m.metalness = 1; m.roughness = 0.12; } else { m.combine = THREE.MixOperation; m.reflectivity = 0.82; } m.needsUpdate = true; }
    U.mats = saved.size; }
  function unchrome() { if (!saved) return; for (const [m, s] of saved) { m.envMap = s.env || null; if (s.c !== null) m.color.setHex(s.c); if (s.em !== null) m.emissive.setHex(s.em);
      if (m.isMeshStandardMaterial) { m.metalness = s.met; m.roughness = s.rou; } else { m.combine = s.comb; m.reflectivity = s.refl; } m.needsUpdate = true; } saved = null; }
  // ---- extras ----
  function sign(txt, sub, col) { const c = cv(256, 128), g = c.getContext('2d'); g.fillStyle = 'rgba(10,0,25,.85)'; g.fillRect(0, 0, 256, 128); g.strokeStyle = col; g.lineWidth = 6; g.shadowColor = col; g.shadowBlur = 16; g.strokeRect(8, 8, 240, 112);
    g.fillStyle = '#fff'; g.font = '900 52px monospace'; g.textAlign = 'center'; g.fillText(txt, 128, 70); g.font = '700 18px monospace'; g.fillStyle = col; g.fillText(sub, 128, 102);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), fog: false, transparent: true})); return s; }
  function sphinx(mat) { const g = new THREE.Group(), B = (w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); g.add(b); return b; };
    B(5, 4, 14, 0, 2, -2); B(1.6, 1.2, 6, -1.6, 0.6, 7); B(1.6, 1.2, 6, 1.6, 0.6, 7); B(4.2, 5, 3.6, 0, 6, 3); B(3, 3.4, 3, 0, 8.6, 3.6); B(5.2, 1.6, 2.4, 0, 8.4, 2.6); B(4.4, 4.8, 1.2, 0, 6.8, 1.6); B(1, 1.2, 0.8, 0, 7.8, 5.3); return g; }
  function saucer(mat) { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 6).scale(4, 0.7, 4), mat)); const l = new THREE.Mesh(new THREE.TorusGeometry(3.9, 0.18, 4, 24), new THREE.MeshBasicMaterial({color: 0xff60e0, fog: false})); l.rotation.x = Math.PI / 2; g.add(l); g.userData.l = l; return g; }
  let X = null;
  function start() { const y = window.__c248, G = y && y.g; if (!G) return; U.on = 1; U.hid = []; try { for (const o of [typeof skyDome !== 'undefined' && skyDome, typeof clouds !== 'undefined' && clouds, typeof sky !== 'undefined' && sky && sky.isObject3D && sky]) if (o && o.visible !== undefined && o.visible) { o.visible = false; U.hid.push(o); } scene.traverse(o => { if (o.visible && o.userData && (o.userData.rainbow || /rainbow|cloud/i.test(o.name || ''))) { o.visible = false; U.hid.push(o); } }); const ov = document.getElementById('c246ov'); if (ov) { U.ovO = ov.style.opacity; setTimeout(() => { try { if (U.on) ov.style.opacity = 0.12; } catch (_) {} }, 6500); }   /* v1.0.74: built behind the full-screen clip, revealed after it */ } catch (e) { ERR('hide', e); } try { chrome(); } catch (e) { ERR('chrome', e); }
    const E = env(), cm = new THREE.MeshPhongMaterial({color: 0xc8d0e4, specular: 0xffffff, shininess: 160, envMap: E, combine: THREE.MixOperation, reflectivity: 0.9}), ex = new THREE.Group(); ex.userData.__dcR = 1e9;
    // mirror grid floor (the old disc gets the neon seams)
    try { const gnd = G.children[0]; if (gnd && gnd.geometry && gnd.geometry.type === 'CircleGeometry') { gnd.material = new THREE.MeshPhongMaterial({map: grid(), color: 0x9a8cc8, emissive: 0xffffff, emissiveMap: grid(), emissiveIntensity: 0.9, specular: 0xffffff, shininess: 200, envMap: E, combine: THREE.MixOperation, reflectivity: 0.55, transparent: true, opacity: 0.86, depthWrite: false}); } } catch (e) { ERR('gnd', e); }
    // recolour the mechs and skyline from red/orange to chrome + neon purple/pink/blue
    G.traverse(o => { const m = o.material; if (!m || !m.color) return; const h = m.color.getHex(); if (h === 0xff1020) { m.color.setHex(0xc84dff); m.userData.neon = 1; } else if (h === 0xff6a20) m.color.setHex(0xff4fd8); else if (h === 0x0b0608) { o.material = new THREE.MeshPhongMaterial({color: 0x141026, specular: 0x8070ff, shininess: 120, envMap: E, combine: THREE.MixOperation, reflectivity: 0.5}); }
      else if (m.isMeshPhongMaterial && !m.userData.c255) { m.envMap = E; m.combine = THREE.MixOperation; m.reflectivity = h === 0x23262e ? 0.55 : 0.9; m.userData.c255 = 1; m.needsUpdate = true; } });
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = -fz, rz = fx, gy = P.y;
    const sp = sphinx(cm); sp.position.set(P.x + fx * 30 + rx * 11, gy - 1, P.z + fz * 30 + rz * 11); sp.rotation.y = P.yaw - 0.35; ex.add(sp); const spr = sphinx(cm.clone()); spr.children.forEach(c => { c.material = c.material.clone(); c.material.transparent = true; c.material.opacity = 0.35; }); spr.scale.y = -1; spr.position.copy(sp.position).setY(gy - 1.06); spr.rotation.y = sp.rotation.y; ex.add(spr);
    const signs = [['24,000', 'AE  (AFTER EARTH)', '#ff4fd8', -1], ['24,000 AE', 'SECTOR 7', '#4fb4ff', 1], ['NEON', 'DOMINION', '#c84dff', -0.4]];
    signs.forEach(([a, b, c, s], i) => { const sg = sign(a, b, c); sg.scale.set(34, 17, 1); sg.position.set(P.x + fx * 140 + rx * 70 * s, gy + 38 + i * 12, P.z + fz * 140 + rz * 70 * s); ex.add(sg); });
    const ss = []; for (let i = 0; i < (LOW ? 3 : 5); i++) { const s = saucer(cm); s.userData.a = i * 1.3; s.userData.r = 40 + i * 14; s.userData.h = 42 + i * 7; ex.add(s); ss.push(s); }
    ex.traverse(o => { o.frustumCulled = false; }); scene.add(ex);
    X = {ex, ss, fx, fz, rx, rz, gy, cx: P.x, cz: P.z, fov: camera.fov, t: 0};
    try { if (y.sk) y.sk.style.background = 'linear-gradient(to bottom,rgba(20,4,50,.7),rgba(70,20,140,.35) 40%,rgba(255,60,200,.08) 58%,rgba(0,0,0,0) 70%)'; } catch (_) {}
    camera.fov = Math.max(camera.fov, 78); camera.updateProjectionMatrix(); }
  function stop() { U.on = 0; try { for (const o of U.hid || []) o.visible = true; U.hid = []; const ov = document.getElementById('c246ov'); if (ov && U.ovO !== undefined) ov.style.opacity = U.ovO; } catch (_) {} try { unchrome(); } catch (e) { ERR('un', e); } if (!X) return; scene.remove(X.ex); X.ex.traverse(o => { if (o.geometry) o.geometry.dispose(); }); camera.fov = X.fov; camera.updateProjectionMatrix(); X = null; }
  function frame(dt) { if (!X) return; X.t += dt; const t = X.t, G = window.__c248 && __c248.g;
    try { if (scene.fog) { scene.fog.color.setHex(0x1a0838); scene.fog.near = 90; scene.fog.far = 520; } if (scene.background && scene.background.isColor) scene.background.setHex(0x12052a); } catch (_) {}
    for (const s of X.ss) { const d = s.userData; d.a += dt * 0.25; s.position.set(X.cx + X.fx * 60 + Math.sin(d.a) * d.r, X.gy + d.h + Math.sin(t + d.a) * 2, X.cz + X.fz * 60 + Math.cos(d.a) * d.r); s.rotation.y += dt; d.l.material.color.setHSL((t * 0.3 + d.a * 0.1) % 1, 1, 0.6); }
    // steady wide framing: robots stand in a line in front, idly swaying (no circling)
    if (G) { let i = 0; for (const m of G.children) { const d = m.userData; if (!d || !d.legs || m.scale.y < 0) continue; const side = i % 2 ? 1 : -1, row = i >> 1, dist = 44 + row * 16, lat = side * (20 + row * 12);
        m.position.set(X.cx + X.fx * dist + X.rx * lat, X.gy - 1, X.cz + X.fz * dist + X.rz * lat); m.rotation.y = Math.atan2(X.fx, X.fz) + Math.PI + side * 0.25 + Math.sin(t * 0.5 + i) * 0.05;
        d.legs[0].rotation.x = Math.sin(t * 0.8 + i) * 0.06; d.legs[1].rotation.x = -d.legs[0].rotation.x; if (d.visor) d.visor.material.color.setHSL((0.78 + Math.sin(t * 2 + i) * 0.06) % 1, 1, 0.6);
        if (d.r) { d.r.position.set(m.position.x, 2 * (X.gy - 0.97) - m.position.y, m.position.z); d.r.rotation.y = m.rotation.y; } i++; } } }
  function hook() { const y = window.__c248; if (!y || y.__c255) return !!y; y.__c255 = 1; const s0 = y.start24, s1 = y.stop24;
    y.start24 = function () { const r = s0.apply(this, arguments); try { start(); } catch (e) { ERR('start', e); } return r; };
    y.stop24 = function () { try { stop(); } catch (e) { ERR('stop', e); } return s1.apply(this, arguments); }; return true; }
  if (!hook()) { const iv = setInterval(() => { if (hook()) clearInterval(iv); }, 500); }
  try { const us = updateSky; updateSky = function () { const r = us.apply(this, arguments); try { frame(Math.min(0.25, (performance.now() - (frame.l || performance.now())) / 1000 || 0.016)); frame.l = performance.now(); } catch (e) { ERR('f', e); } return r; }; } catch (e) { ERR('wrap', e); }
})();
