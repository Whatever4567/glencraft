/* ===================== GLX-C162 (v1.0.29): blood-red sky round the black castle, red mist seen from afar; castles rebuilt in existing worlds ===================== */
(function c162() {
  const U = window.__c162 = {k: 0, d: 0, up: null, err: null, ms: 0};
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const blackAt = () => { try { if (typeof g9castles === 'undefined' || !g9castles || genVer !== GEN9 || cityGen) return null; const c = g9castles.find(q => q[0] === 'black'); return c && W >= 600 ? c : null; } catch (_) { return null; } };
  // ---------- v1.0.33: the red mist is a few big soft smoky clouds (sprites, no depth write) - cheap, and it looks like a red cloud bank from afar ----------
  const MIST = []; let mistTex = null;
  function smokeTex() { const N = 128, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d'), im = g.createImageData(N, N);
    const hs = (x, y) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const vn = (x, y, f) => { const x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0, w = q => q * q * (3 - 2 * q), m = (a, b) => ((a % f) + f) % f;
      const a = hs(m(x0, 0), m(y0, 0)), b = hs(m(x0 + 1, 0), m(y0, 0)), c = hs(m(x0, 0), m(y0 + 1, 0)), d = hs(m(x0 + 1, 0), m(y0 + 1, 0)); return (a + (b - a) * w(tx)) * (1 - w(ty)) + (c + (d - c) * w(tx)) * w(ty); };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const u = x / N, v = y / N, r = Math.hypot(u - 0.5, v - 0.5) * 2;
      let n = 0, A = 0.5, F = 4; for (let o = 0; o < 4; o++) { n += A * vn(u * F, v * F, F); A *= 0.5; F *= 2; }
      const a = Math.max(0, Math.min(1, (n - 0.32) * 1.9)) * Math.max(0, 1 - r * r) ** 1.3, o = (y * N + x) * 4;
      im.data[o] = 175 + n * 50; im.data[o + 1] = 26 + n * 22; im.data[o + 2] = 16 + n * 10; im.data[o + 3] = a * 255; }
    g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(cv); return t; }
  function makeMist(c) { if (!mistTex) mistTex = smokeTex(); const gy = SEA + 6;
    for (let i = 0; i < 9; i++) { const m = new THREE.SpriteMaterial({map: mistTex, transparent: true, depthWrite: false, fog: false, opacity: 0, color: 0xffffff});
      const s = new THREE.Sprite(m), a = i / 9 * 6.283 + (i % 3) * 0.4, r = 26 + (i * 17) % 46; s.position.set(c[1] + Math.cos(a) * r, gy + 14 + (i * 7) % 26, c[2] + Math.sin(a) * r);
      const sc = 70 + (i * 13) % 40; s.scale.set(sc, sc * 0.55, 1); s.renderOrder = 4; s.userData = {a, r, b: s.position.y, sp: 0.01 + (i % 4) * 0.004, ph: i * 1.7}; m.rotation = i; scene.add(s); MIST.push(s); } }
  const RED_FOG = new THREE.Color(0.6, 0.11, 0.07), RED_TOP = new THREE.Color(0.42, 0.05, 0.04), RED_HOR = new THREE.Color(0.86, 0.24, 0.12), WARM = new THREE.Color(1, 0.72, 0.62), tc = new THREE.Color();
  const N_FOG = new THREE.Color(0.2, 0.03, 0.025), N_TOP = new THREE.Color(0.1, 0.01, 0.015), N_HOR = new THREE.Color(0.3, 0.05, 0.03), CL_RED = new THREE.Color(0.62, 0.16, 0.12), ST_RED = new THREE.Color(1, 0.45, 0.38), HALO = new THREE.Color(0x9fb8ff), HALO_R = new THREE.Color(0xff5a3a);
  let kE = 0, lastT = performance.now();
  function sky() { const c = blackAt(), now = performance.now(), dt = Math.min(0.2, (now - lastT) / 1000); lastT = now; let k = 0, d = 1e9;
    if (c && started && !DIM.cur) { d = Math.hypot(P.x - c[1], P.z - c[2]);
      // a ragged, slowly drifting edge instead of a ring: the fog bank reaches out further in some directions than others
      const an = Math.atan2(P.z - c[2], P.x - c[1]), tt = now / 1000, tur = 26 * Math.sin(an * 3 + tt * 0.05) + 15 * Math.sin(an * 7 - tt * 0.08 + 1.3) + 8 * Math.sin(an * 13 + tt * 0.11);
      k = sm(235, 45, d + tur); }
    kE += (k - kE) * Math.min(1, dt * 0.9); k = kE < 0.002 && k === 0 ? 0 : kE;   // you walk into it over a few seconds, not across a line
    U.k = k; U.d = Math.round(d);
    if (c && !DIM.cur && started) { if (!MIST.length) makeMist(c); const gy = SEA + 6, vis = d < 520, far = sm(30, 120, d);
      for (const s of MIST) { s.visible = vis && far > 0.01; if (!s.visible) continue; const u = s.userData; u.a += u.sp * dt; s.position.set(c[1] + Math.cos(u.a) * u.r, u.b + Math.sin(now / 4000 + u.ph) * 2, c[2] + Math.sin(u.a) * u.r);
        s.material.opacity = 0.62 * far; s.material.rotation += dt * 0.01; } }
    else for (const s of MIST) s.visible = false;
    if (k <= 0.001) return;
    let dl = 1; try { dl = Math.max(0, Math.min(1, daylight)); } catch (_) {}
    const lift = 0.62 + 0.38 * dl;
    tc.copy(N_FOG).lerp(RED_FOG, dl).multiplyScalar(dl > 0.5 ? lift : 1); scene.fog.color.lerp(tc, k);
    try { if (scene.background && scene.background.isColor) scene.background.lerp(tc, k); } catch (_) {}
    try { if (skyUniforms.texK) skyUniforms.texK.value *= 1 - 0.95 * k; } catch (_) {}
    try { tc.copy(N_TOP).lerp(RED_TOP, dl).multiplyScalar(dl > 0.5 ? lift : 1); skyUniforms.top.value.lerp(tc, k); tc.copy(N_HOR).lerp(RED_HOR, dl).multiplyScalar(dl > 0.5 ? lift : 1); skyUniforms.hor.value.lerp(tc, k); } catch (_) {}
    try { hemi.color.lerp(WARM, k * 0.55); tc.copy(CL_RED).multiplyScalar(0.35 + 0.65 * dl); cloudMat.color.lerp(tc, k * 0.9); } catch (_) {}   // crimson clouds, not none
    try { stars.material.color.setRGB(1, 1, 1).lerp(ST_RED, k); moonDisc.material.color.lerp(ST_RED, k * 0.8); moonHalo.material.color.copy(HALO).lerp(HALO_R, k); } catch (_) {}
    try { const f2 = Math.max(scene.fog.near + 40, scene.fog.far * 0.7); scene.fog.far += (f2 - scene.fog.far) * k; } catch (_) {}
  }
  // ---------- existing worlds: rebuild the three castles once, one per frame-slice, keep chest contents ----------
  const ew = enterWorld; enterWorld = function (save) { try { if (current) current.c162u = save ? !!save.c162 : true; } catch (_) {} U.up = null; return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && current && current.c162u) d.c162 = 1; } catch (_) {} return d; };
  let wait = 0;
  function upgrade(dt) { const C = window.__c151; if (!C || !C.work || typeof current === 'undefined' || !current || current.c162u || !started || paused || DIM.cur) return;
    if (!current.g25 || typeof g9castles === 'undefined' || !g9castles || genVer !== GEN9 || W < 600 || current.mode === 'creative') { current.c162u = true; return; }
    if ((wait -= dt) > 0) return; wait = 0.35;
    if (!U.up) U.up = g9castles.map(c => c[0]).filter(k => C.B[k]);
    const kind = U.up.shift(), t0 = performance.now();
    if (kind) { const c = g9castles.find(q => q[0] === kind), was = window.__c102 && __c102.done, bc = c37busy;
      try { if (window.__c102) __c102.done = g9castles.map(q => ({k: q[0], cx: q[1], cz: q[2], gy: SEA + (q[0] === 'human' ? 5 : 6)})); c37busy = true; C.work(kind); } catch (e) { U.err = String(e && e.stack || e); } finally { c37busy = bc; if (window.__c102) __c102.done = was; }
      const R = 26; for (let x = c[1] - R; x <= c[1] + R; x += 8) for (let z = c[2] - R; z <= c[2] + R; z += 8) try { markDirty(x, z); } catch (_) {}
      U.ms = Math.max(U.ms, Math.round(performance.now() - t0)); return; }
    // light sources: only re-read the castle plots, not the whole world (no hitch on phones)
    try { const LT = new Set([T.TORCH, 161, 216]); for (const c of g9castles) { const R = 27, x0 = c[1] - R, x1 = c[1] + R, z0 = c[2] - R, z1 = c[2] + R;
        for (const [key, v] of [...lightSrc]) if (v[0] >= x0 && v[0] <= x1 + 1 && v[2] >= z0 && v[2] <= z1 + 1) lightSrc.delete(key);
        for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) for (let y = 0; y < H; y++) for (let z = Math.max(0, z0); z <= Math.min(D - 1, z1); z++) { const b = world[idx(x, y, z)]; if (LT.has(b)) lightSrc.set((x * 4096 + z) * 256 + y, [x + .5, y + (b === T.TORCH ? .7 : .5), z + .5, b]); } }
      if (typeof farGlow !== 'undefined' && farGlow) farGlow.userData.dirty = true; } catch (_) { try { scanLights(); } catch (__) {} }
    try { if (typeof validateLights === 'function') validateLights(); } catch (_) {} try { if (window.__c148) __c148.sync(); } catch (_) {}
    // never leave anyone stuck inside new stonework
    try { let x = Math.floor(P.x), z = Math.floor(P.z), y = Math.floor(P.y); const free = yy => !solid(x, yy, z) && !solid(x, yy + 1, z); if (!free(y)) { while (y < H - 3 && !free(y)) y++; P.y = y + 0.01; P.vy = 0; } } catch (_) {}
    current.c162u = true; U.done = 1; }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { sky(); } catch (e) { U.err = String(e && e.stack || e); } try { upgrade(+dt || 0.016); } catch (e) { U.err = String(e && e.stack || e); } return r; };
})();
