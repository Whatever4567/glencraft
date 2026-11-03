/* GLX-C279 (v1.0.91): Pompeii-style eruption effects on top of c242 - a towering ash column that mushrooms out, a ground-hugging pyroclastic
   surge rolling down the slopes, glowing embers and debris, lightning in the ash cloud and a camera shake that fades with distance.
   Pooled points only (3 draw calls), half the particles on phones, nothing runs while the volcano is quiet. Original code and textures. */
(function () {
  const U = window.__c279 = {err: null, on: 0, frames: 0, flashes: 0, shake: 0};
  const PH = matchMedia && matchMedia('(pointer:coarse)').matches, K = PH ? 0.5 : 1;
  const NA = Math.round(520 * K), NS = Math.round(260 * K), NE = Math.round(420 * K);
  function tex(soft) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (soft) { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); }
    else { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,220,140,.9)'); gr.addColorStop(1, 'rgba(255,120,20,0)'); }
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; }
  function sys(n, size, col, add, op) { const geo = new THREE.BufferGeometry(); const p = new Float32Array(n * 3).fill(-9999); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const m = new THREE.PointsMaterial({size, map: tex(!add), color: col, transparent: true, opacity: op, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true, fog: false}); m.userData.base = size;
    const o = new THREE.Points(geo, m); o.frustumCulled = false; o.visible = false; o.renderOrder = 5; return {o, p, n, v: new Float32Array(n * 3), life: new Float32Array(n), i: 0}; }
  let A = null, S = null, E = null, flash = null, last = performance.now(), wasOn = false;
  function init() { A = sys(NA, 22, 0x3a3532, false, .78); S = sys(NS, 30, 0x6b625a, false, .7); E = sys(NE, 1.6, 0xff8a2a, true, 1); U.sys = {A, S, E};
    for (const s of [A, S, E]) scene.add(s.o); flash = new THREE.PointLight(0xcfd8ff, 0, 600); scene.add(flash); }
  function emit(s, x, y, z, vx, vy, vz, life) { const i = s.i; s.i = (s.i + 1) % s.n; s.p[i * 3] = x; s.p[i * 3 + 1] = y; s.p[i * 3 + 2] = z; s.v[i * 3] = vx; s.v[i * 3 + 1] = vy; s.v[i * 3 + 2] = vz; s.life[i] = life; }
  function upd(s, dt, drag, grav, fn) { const p = s.p, v = s.v; for (let i = 0; i < s.n; i++) { if (s.life[i] <= 0) { if (p[i * 3 + 1] > -9000) p[i * 3 + 1] = -9999; continue; } s.life[i] -= dt;
      v[i * 3 + 1] -= grav * dt; const d = Math.pow(drag, dt); v[i * 3] *= d; v[i * 3 + 1] *= d; v[i * 3 + 2] *= d; if (fn) fn(i, p, v);
      p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt; } s.o.geometry.attributes.position.needsUpdate = true; }
  const R = Math.random;
  function tick() { requestAnimationFrame(tick); try { const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      const C = window.__c242, at = typeof current !== 'undefined' && current && current.c229, s = current && current.c242;
      const on = !!(C && at && s && s.ph === 'erupt' && started && !paused); U.on = on ? 1 : 0;
      if (!on && !wasOn) return; if (!A) init(); wasOn = on || [A, S, E].some(q => q.life.some(l => l > 0));
      for (const q of [A, S, E]) q.o.visible = wasOn; if (!wasOn) { flash.intensity = 0; U.shake = 0; return; }
      U.frames++; const x = at[0], y = at[1] + 2, z = at[2], k = Math.max(0, 1 - (s && s.t || 0) / 90);
      if (on) { // ash column: shoots up, then spreads into the umbrella cloud
        for (let j = 0; j < Math.ceil(9 * K); j++) emit(A, x + (R() - .5) * 6, y, z + (R() - .5) * 6, (R() - .5) * 6, 38 + R() * 26, (R() - .5) * 6, 9 + R() * 6);
        if (R() < 0.7) for (let j = 0; j < Math.ceil(3 * K); j++) { const a = R() * 6.283, sp = 16 + R() * 14; emit(S, x + Math.cos(a) * 8, y - 4, z + Math.sin(a) * 8, Math.cos(a) * sp, 2 + R() * 3, Math.sin(a) * sp, 6 + R() * 4); }
        for (let j = 0; j < Math.ceil(10 * K); j++) emit(E, x + (R() - .5) * 4, y, z + (R() - .5) * 4, (R() - .5) * 30, 25 + R() * 35, (R() - .5) * 30, 3 + R() * 3);
        if (R() < dt * 0.6 * (0.4 + k)) { flash.position.set(x + (R() - .5) * 80, y + 90 + R() * 50, z + (R() - .5) * 80); flash.intensity = 6; U.flashes++; } }
      flash.intensity *= Math.pow(0.002, dt);
      upd(A, dt, 0.7, 0, (i, p, v) => { const h = p[i * 3 + 1] - y; if (h > 95) { v[i * 3 + 1] *= 0.9; const dx = p[i * 3] - x, dz = p[i * 3 + 2] - z, d = Math.hypot(dx, dz) + .1; v[i * 3] += dx / d * 8 * dt * 10; v[i * 3 + 2] += dz / d * 8 * dt * 10; } });
      upd(S, dt, 0.8, 0, (i, p, v) => { try { const gx = Math.floor(p[i * 3]), gz = Math.floor(p[i * 3 + 2]); const top = window.__c208 && __c208.rawH ? __c208.rawH(gx, gz) + 3 : y - 20; if (p[i * 3 + 1] > top + 4) v[i * 3 + 1] -= 6 * dt * 10; else v[i * 3 + 1] = Math.max(v[i * 3 + 1], 1); } catch (_) {} });
      upd(E, dt, 0.97, 22, null);
      // far away the column would be cut off by the camera far plane: shrink the whole cloud toward the camera (same look, same direction)
      try { const cp = camera.position, dc = Math.hypot(cp.x - x, cp.y - y - 60, cp.z - z) + 140, kk = Math.min(1, camera.far * 0.85 / dc);
        for (const q of [A, S, E]) { q.o.scale.setScalar(kk); q.o.position.set(cp.x * (1 - kk), cp.y * (1 - kk), cp.z * (1 - kk)); q.o.material.size = q.o.material.userData.base * kk; } U.k = kk; } catch (_) {}
      const dist = Math.hypot(P.x - x, P.z - z); U.shake = on ? Math.max(0, 1 - dist / 260) * (0.25 + 0.5 * k) : 0;
    } catch (e) { U.err = String(e && e.message || e); } }
  requestAnimationFrame(tick);
  // camera shake: nudged just for the render, then put back, so it never moves the player
  try { const rr = renderer.render.bind(renderer); renderer.render = function (sc, cam) { const a = U.shake; if (a > 0.01 && cam && cam.position) { const ox = (R() - .5) * a * .35, oy = (R() - .5) * a * .35; cam.position.x += ox; cam.position.y += oy; const r = rr(sc, cam); cam.position.x -= ox; cam.position.y -= oy; return r; } return rr(sc, cam); }; } catch (e) { U.err = 'shake ' + e; }
})();
