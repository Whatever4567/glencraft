/* GLX-SKY1312 (v1.2.112): time-of-day skies and volumetric clouds.
   Each realm keeps its own sky. The Highlands get a warmer sunset (deep orange,
   pink and purple with a golden sun glow) and a dark starry night. Egypt keeps
   a real desert sky — clear blue fading to a hazy sandy horizon by day, orange
   and pink at sunset, dark and starry at night. Medium and High quality use a
   WebGL1 raymarched cloud slab (tileable Worley+Perlin 2D atlas, weather map,
   Beer-Lambert + powder + Henyey-Greenstein, sun colours from the time-of-day
   ramps) drawn at quarter or half resolution with blue-noise jitter and a
   bilinear upsample, composited behind terrain using the framebuffer depth.
   Low keeps the existing sun-lit impostor layer. Phones and Performance mode
   default to Low so the 120fps target can hold; other devices default to Medium.
   The desert stays mostly clear. Hell, Agartha and other realm skies are left
   alone. Old box clouds are hidden, not deleted. */
(function sky1312(WIN) {
  const U = WIN.__sky1312 = WIN.__sky1311 = { version: '1.2.112-skies', err: null, hook: 0, q: null, n: 0, on: 0, mode: 'impostor' };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 280); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  function realm() {
    try {
      if (typeof DIM !== 'undefined' && DIM && DIM.cur) return DIM.cur;
      if (WIN.__c295 && __c295.inside) return 'agartha';
      if (WIN.__c244 && __c244.on) return 'vision';
    } catch (_) {}
    return null;
  }
  function inLava() {
    try {
      if (typeof getB !== 'function' || typeof T === 'undefined' || typeof camera === 'undefined') return false;
      return getB(Math.floor(camera.position.x), Math.floor(camera.position.y), Math.floor(camera.position.z)) === T.LAVA;
    } catch (_) { return false; }
  }
  function skyOk(r) { return r === null || r === 'egypt'; }

  function phases(clock) {
    const CY = (typeof CYCLE === 'number' && CYCLE > 0) ? CYCLE : 360;
    const p = (typeof clock === 'number') ? clock : ((typeof dayClock === 'number' && CY) ? dayClock / CY : 0.25);
    const ang = p * Math.PI * 2;
    const sx = Math.cos(ang), sy = Math.sin(ang);
    const sh = sy + 0.2;
    const day = (typeof clock !== 'number' && typeof daylight === 'number')
      ? daylight
      : clamp((sh + 0.12) / 0.45, 0, 1);
    const dusk = Math.max(0, 1 - Math.abs(sy - 0.08) / 0.42);
    const night = 1 - day;
    const wd = (typeof weather !== 'undefined' && weather && typeof weather.dark === 'number') ? weather.dark : 0;
    return { p, ang, sx, sy, sh, day, dusk, night, wd };
  }

  function glenPal(ph) {
    const dayTop = [0.30, 0.56, 0.87], dayMid = [0.58, 0.74, 0.92], dayHor = [0.78, 0.86, 0.91], dayFog = [0.72, 0.78, 0.84];
    const duskTop = [0.32, 0.08, 0.28], duskMid = [0.96, 0.32, 0.28], duskHor = [1.00, 0.52, 0.18], duskFog = [0.88, 0.42, 0.28];
    const nightTop = [0.04, 0.06, 0.16], nightMid = [0.09, 0.10, 0.24], nightHor = [0.16, 0.14, 0.30], nightFog = [0.10, 0.13, 0.22];
    let top = lerp(nightTop, dayTop, ph.day);
    let mid = lerp(nightMid, dayMid, ph.day);
    let hor = lerp(nightHor, dayHor, ph.day);
    let fog = lerp(nightFog, dayFog, ph.day);
    if (ph.dusk > 0.02 && ph.wd < 0.55) {
      const k = ph.dusk * (0.75 + 0.25 * (1 - ph.day)) * (1 - ph.wd);
      top = lerp(top, duskTop, k);
      mid = lerp(mid, duskMid, k);
      hor = lerp(hor, duskHor, k);
      fog = lerp(fog, duskFog, k * 0.9);
    }
    if (ph.wd > 0.2) {
      const k = Math.min(1, (ph.wd - 0.2) * 1.6);
      const st = [0.28, 0.31, 0.34], sh = [0.42, 0.45, 0.48];
      top = lerp(top, st, k * 0.8); mid = lerp(mid, sh, k * 0.7); hor = lerp(hor, sh, k * 0.55); fog = lerp(fog, sh, k * 0.5);
    }
    const sunCol = ph.dusk > 0.15 ? [1.00, 0.72, 0.32] : [1.00, 0.95, 0.82];
    const sunK = clamp(ph.sy * 4 + 0.45, 0, 1) * (1 - ph.wd) * (0.85 + 0.55 * ph.dusk);
    const starsK = Math.max(0, ph.night * 1.3 - 0.35) * (1 - ph.wd) * (1 - ph.dusk * 0.7);
    const clLit = ph.dusk > 0.08 ? lerp([0.98, 0.98, 1.00], [1.00, 0.48, 0.28], ph.dusk) : lerp([0.22, 0.24, 0.30], [0.98, 0.98, 1.00], ph.day);
    const clShad = ph.dusk > 0.08 ? lerp([0.62, 0.66, 0.74], [0.46, 0.18, 0.28], ph.dusk) : lerp([0.10, 0.11, 0.16], [0.62, 0.66, 0.74], ph.day);
    return { top, mid, hor, fog, sunCol, sunK, starsK, clLit, clShad, fogNear: 22 + 10 * ph.day, fogFar: (typeof PERF !== 'undefined' && PERF) ? 110 + 20 * ph.day : 160 + 40 * ph.day };
  }

  function egyptPal(ph) {
    const dayTop = [0.12, 0.40, 0.82], dayMid = [0.52, 0.68, 0.78], dayHor = [0.91, 0.82, 0.62], dayFog = [0.86, 0.77, 0.58];
    const duskTop = [0.48, 0.14, 0.28], duskMid = [0.98, 0.42, 0.38], duskHor = [1.00, 0.62, 0.32], duskFog = [0.92, 0.52, 0.36];
    const nightTop = [0.02, 0.04, 0.10], nightMid = [0.06, 0.08, 0.16], nightHor = [0.10, 0.13, 0.22], nightFog = [0.07, 0.09, 0.14];
    let top = lerp(nightTop, dayTop, ph.day);
    let mid = lerp(nightMid, dayMid, ph.day);
    let hor = lerp(nightHor, dayHor, ph.day);
    let fog = lerp(nightFog, dayFog, ph.day);
    if (ph.dusk > 0.02) {
      const k = Math.min(1, ph.dusk * (0.95 + 0.25 * (1 - ph.day)));
      top = lerp(top, duskTop, k);
      mid = lerp(mid, duskMid, k);
      hor = lerp(hor, duskHor, k);
      fog = lerp(fog, duskFog, k);
    }
    const dust = 0.14 * ph.day * (1 - ph.dusk * 0.5);
    hor = lerp(hor, [0.93, 0.80, 0.55], dust);
    fog = lerp(fog, [0.90, 0.76, 0.52], dust * 0.8);
    const sunCol = ph.dusk > 0.15 ? [1.00, 0.78, 0.38] : [1.00, 0.95, 0.72];
    const sunK = clamp(ph.day * 1.15 + ph.dusk * 0.7, 0, 1.4);
    const starsK = Math.max(0, ph.night * 1.35 - 0.28) * (1 - ph.dusk * 0.85);
    const clLit = ph.dusk > 0.08 ? lerp([1.00, 0.96, 0.88], [1.00, 0.55, 0.32], ph.dusk) : lerp([0.20, 0.18, 0.16], [1.00, 0.96, 0.88], ph.day);
    const clShad = ph.dusk > 0.08 ? lerp([0.70, 0.62, 0.50], [0.50, 0.22, 0.24], ph.dusk) : lerp([0.12, 0.10, 0.10], [0.70, 0.62, 0.50], ph.day);
    return { top, mid, hor, fog, sunCol, sunK, starsK, clLit, clShad, fogNear: 36 + 10 * ph.day, fogFar: (typeof PERF !== 'undefined' && PERF) ? 130 + 20 * ph.day : 170 + 50 * ph.day };
  }

  function palette(clock, r) {
    const ph = phases(clock);
    const pal = (r === 'egypt') ? egyptPal(ph) : glenPal(ph);
    pal.ph = ph;
    pal.realm = (r === undefined) ? realm() : r;
    return pal;
  }
  U.palette = palette;
  U.phases = phases;

  function extendShader() {
    try {
      if (!skyUniforms || !skyDome || !skyDome.material) return;
      U.shader = 1;
    } catch (e) { ERR('shader', e); }
  }

  function defaultQ() {
    try { if (typeof PERF !== 'undefined' && PERF) return 'low'; } catch (_) {}
    try {
      const ua = ((typeof navigator !== 'undefined' && navigator.userAgent) || '');
      const touch = (typeof touchMode !== 'undefined' && touchMode) || /Android|iPhone|iPad|Mobile/i.test(ua);
      if (touch) return 'low';
    } catch (_) {}
    return 'med';
  }
  function currentQ() {
    try { if (typeof SET !== 'undefined' && SET && SET.cloudQ) return SET.cloudQ; } catch (_) {}
    return U.q || defaultQ();
  }
  U.defaultQ = defaultQ;
  U.currentQ = currentQ;

  function cloudTex() {
    const N = 256, cv = document.createElement('canvas');
    cv.width = cv.height = N;
    const g = cv.getContext('2d'), im = g.createImageData(N, N);
    const hs = (x, y) => { let h = Math.imul((x | 0) + 19, 374761393) ^ Math.imul((y | 0) + 7, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const vn = (x, y) => {
      const x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0, w = q => q * q * (3 - 2 * q);
      const a = hs(x0, y0), b = hs(x0 + 1, y0), c = hs(x0, y0 + 1), d = hs(x0 + 1, y0 + 1);
      return (a + (b - a) * w(tx)) * (1 - w(ty)) + (c + (d - c) * w(tx)) * w(ty);
    };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N, r = Math.hypot(u - 0.5, v - 0.52) * 2.05;
      let n = 0, A = 0.52, F = 3.2;
      for (let o = 0; o < 5; o++) { n += A * vn(u * F + 12.7, v * F * 0.75 + 4.2); A *= 0.5; F *= 2.03; }
      const lobe = Math.max(0, 1 - r * r);
      const a = Math.max(0, Math.min(1, (n - 0.28) * 2.1)) * Math.pow(lobe, 1.15);
      const o = (y * N + x) * 4;
      const w = 0.86 + n * 0.14;
      im.data[o] = w * 255; im.data[o + 1] = w * 255; im.data[o + 2] = w * 255; im.data[o + 3] = a * 255;
    }
    g.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(cv);
    t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
    return t;
  }

  function qCount(q, egypt) {
    const n = q === 'high' ? 28 : q === 'low' ? 8 : 16;
    return egypt ? Math.max(3, Math.round(n * 0.35)) : n;
  }

  function buildClouds(q, egypt) {
    if (!U.tex) try { U.tex = cloudTex(); } catch (e) { ERR('tex', e); return; }
    if (!U.root) { U.root = new THREE.Group(); U.root.name = 'sky1312-impostors'; scene.add(U.root); }
    while (U.root.children.length) {
      const c = U.root.children.pop();
      try { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); } catch (_) {}
    }
    U.puffs = [];
    const n = qCount(q, egypt);
    const geo = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < n; i++) {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: U.tex },
          uLit: { value: new THREE.Color(1, 1, 1) },
          uShad: { value: new THREE.Color(0.6, 0.64, 0.72) },
          uOp: { value: egypt ? 0.42 : 0.82 },
          uSun: { value: new THREE.Vector3(1, 0.4, 0.2) }
        },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: [
          'uniform sampler2D uMap; uniform vec3 uLit, uShad, uSun; uniform float uOp; varying vec2 vUv;',
          'void main(){ vec4 t = texture2D(uMap, vUv); float a = t.a * uOp; if (a < 0.02) discard;',
          ' vec3 n = normalize(vec3((vUv.x - 0.5) * 2.0, (vUv.y - 0.35) * 1.5, 0.7));',
          ' float ndl = clamp(dot(n, normalize(uSun)) * 0.55 + 0.48, 0.0, 1.0);',
          ' vec3 col = mix(uShad, uLit, ndl * (0.5 + 0.5 * t.r));',
          ' gl_FragColor = vec4(col, a); }'
        ].join('\n'),
        transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide
      });
      const m = new THREE.Mesh(geo, mat);
      m.frustumCulled = false;
      m.renderOrder = -5;
      const a = (i / n) * Math.PI * 2 + (i % 3) * 0.4;
      const rad = (egypt ? 70 : 48) + (i * 17) % (egypt ? 90 : 70);
      const sea = (typeof SEA === 'number') ? SEA : 32;
      m.userData = { a: a, rad: rad, y: sea + (egypt ? 46 : 30) + (i * 11) % (egypt ? 16 : 20), spin: (i % 5) * 0.15, scx: (egypt ? 36 : 32) + (i * 13) % 28, scy: (egypt ? 11 : 12) + (i * 7) % 10 };
      m.scale.set(m.userData.scx, m.userData.scy, 1);
      U.root.add(m);
      U.puffs.push(m);
    }
    U.builtQ = q; U.builtEgypt = !!egypt; U.n = n;
  }

  function tickImpostors(dt, pal, r) {
    const egypt = r === 'egypt';
    const q = currentQ();
    if (!U.puffs || U.builtQ !== q || U.builtEgypt !== egypt) buildClouds(q, egypt);
    if (!U.root) return;
    U.root.visible = true;
    const cam = (typeof camera !== 'undefined') ? camera : null;
    if (!cam) return;
    const ph = pal.ph;
    for (let i = 0; i < U.puffs.length; i++) {
      const m = U.puffs[i], d = m.userData;
      d.a += (dt || 0) * (0.012 + (i % 4) * 0.004);
      m.position.set(cam.position.x + Math.cos(d.a) * d.rad, d.y, cam.position.z + Math.sin(d.a) * d.rad * 0.85);
      m.lookAt(cam.position);
      const mat = m.material;
      if (mat && mat.uniforms) {
        mat.uniforms.uLit.value.setRGB(pal.clLit[0], pal.clLit[1], pal.clLit[2]);
        mat.uniforms.uShad.value.setRGB(pal.clShad[0], pal.clShad[1], pal.clShad[2]);
        mat.uniforms.uSun.value.set(ph.sx, Math.max(0.05, ph.sy), 0.25);
        const base = egypt ? 0.38 : 0.84;
        mat.uniforms.uOp.value = base * (0.35 + 0.65 * Math.max(ph.day, pal.ph.dusk * 0.85)) * (1 - pal.ph.wd * 0.15);
      }
    }
  }

  /* ---------- volumetric textures (WebGL1 2D atlas; no 3D textures) ---------- */
  const NZ = 32, TX = 8, TY = 4, AW = NZ * TX, AH = NZ * TY; // 256x128

  function hashu(x, y, z) {
    let h = Math.imul(x + 1, 374761393) ^ Math.imul(y + 3, 668265263) ^ Math.imul(z + 5, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 2246822519);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function grad(h, x, y, z) {
    const i = (h * 12) | 0;
    const u = i < 8 ? x : y, v = i < 4 ? y : (i === 12 || i === 14 ? x : z);
    return ((i & 1) ? -u : u) + ((i & 2) ? -v : v);
  }
  function perlin3(x, y, z, P) {
    const x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z);
    const tx = x - x0, ty = y - y0, tz = z - z0;
    const ux = fade(tx), uy = fade(ty), uz = fade(tz);
    const wrap = (v) => ((v % P) + P) % P;
    const g = (i, j, k) => grad(hashu(wrap(i), wrap(j), wrap(k)), x - i, y - j, z - k);
    const x1 = x0 + 1, y1 = y0 + 1, z1 = z0 + 1;
    const n0 = g(x0, y0, z0) + (g(x1, y0, z0) - g(x0, y0, z0)) * ux;
    const n1 = g(x0, y1, z0) + (g(x1, y1, z0) - g(x0, y1, z0)) * ux;
    const n2 = g(x0, y0, z1) + (g(x1, y0, z1) - g(x0, y0, z1)) * ux;
    const n3 = g(x0, y1, z1) + (g(x1, y1, z1) - g(x0, y1, z1)) * ux;
    const m0 = n0 + (n1 - n0) * uy, m1 = n2 + (n3 - n2) * uy;
    return (m0 + (m1 - m0) * uz) * 0.5 + 0.5;
  }
  function worley3(x, y, z, P) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const wrap = (v) => ((v % P) + P) % P;
    let d = 9;
    for (let k = -1; k <= 1; k++) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const cx = xi + i, cy = yi + j, cz = zi + k;
      const px = cx + hashu(wrap(cx), wrap(cy), wrap(cz) + 11);
      const py = cy + hashu(wrap(cx) + 2, wrap(cy), wrap(cz));
      const pz = cz + hashu(wrap(cx), wrap(cy) + 5, wrap(cz));
      const dx = px - x, dy = py - y, dz = pz - z;
      d = Math.min(d, dx * dx + dy * dy + dz * dz);
    }
    return Math.min(1, Math.sqrt(d));
  }

  function bakeNoise() {
    const data = new Uint8Array(AW * AH * 4);
    for (let s = 0; s < NZ; s++) {
      const tx = s % TX, ty = (s / TX) | 0;
      for (let y = 0; y < NZ; y++) for (let x = 0; x < NZ; x++) {
        const fx = x / NZ, fy = y / NZ, fz = s / NZ;
        let pe = 0, A = 0.5, F = 1;
        for (let o = 0; o < 4; o++) { pe += A * perlin3(fx * 4 * F, fy * 4 * F, fz * 4 * F, 4 * F); A *= 0.5; F *= 2; }
        const w1 = 1 - worley3(fx * 5, fy * 5, fz * 5, 5);
        const w2 = 1 - worley3(fx * 9 + 2.1, fy * 9, fz * 9, 9);
        const pe2 = perlin3(fx * 7 + 3, fy * 7, fz * 7 + 1, 7);
        const ox = tx * NZ + x, oy = ty * NZ + y, o = (oy * AW + ox) * 4;
        data[o] = clamp(pe, 0, 1) * 255;
        data[o + 1] = clamp(w1 * 0.65 + w2 * 0.35, 0, 1) * 255;
        data[o + 2] = clamp(pe2, 0, 1) * 255;
        data[o + 3] = 255;
      }
    }
    const t = new THREE.DataTexture(data, AW, AH, THREE.RGBAFormat);
    t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.generateMipmaps = false; t.flipY = false; t.needsUpdate = true;
    return t;
  }

  function bakeWeather() {
    const N = 256, data = new Uint8Array(N * N * 4);
    const vn = (x, y, s) => perlin3(x, y, s, 8);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N;
      let n = 0, A = 0.62, F = 1.15;
      for (let o = 0; o < 4; o++) { n += A * vn(u * F, v * F * 0.85, 1.2 + o * 0.4); A *= 0.5; F *= 2.0; }
      // Broad 1-3 km-scale mounds with soft sky gaps, not high-frequency camo.
      const cov = clamp((n - 0.28) / 0.50, 0, 1);
      const typ = clamp(vn(u * 6, v * 6, 4.2), 0, 1);
      const o = (y * N + x) * 4;
      data[o] = cov * 255; data[o + 1] = typ * 255; data[o + 2] = clamp(n, 0, 1) * 255; data[o + 3] = 255;
    }
    const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
    t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.generateMipmaps = false; t.flipY = false; t.needsUpdate = true;
    return t;
  }

  function bakeBlue() {
    const N = 128, data = new Uint8Array(N * N * 4);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const n = hashu(x * 13 + 7, y * 17 + 3, x * y + 29);
      const n2 = hashu(y * 9 + 2, x * 21 + 5, 71);
      const o = (y * N + x) * 4;
      data[o] = n * 255; data[o + 1] = n2 * 255; data[o + 2] = ((x * 7 + y * 13) % 256); data[o + 3] = 255;
    }
    const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
    t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.generateMipmaps = false; t.flipY = false; t.needsUpdate = true;
    return t;
  }

  const VOL_VERT = [
    'varying vec2 vUv;',
    'void main(){',
    '  vUv = uv;',
    '  gl_Position = vec4(position.xy, 0.0, 1.0);',
    '}'
  ].join('\n');

  const VOL_FRAG = [
    'precision highp float;',
    'uniform sampler2D uNoise, uWeather, uBlue;',
    'uniform vec3 uCamPos, uSunDir, uSunCol, uSkyTop, uSkyHor, uLit, uShad;',
    'uniform mat4 uInvProj, uInvView;',
    'uniform vec2 uRes, uWind;',
    'uniform float uY0, uY1, uPlanetR, uFar, uSteps, uLSteps, uDens, uAbs, uCovMin, uSunK, uDusk, uNight, uTime, uJitter, uEgypt;',
    'varying vec2 vUv;',
    'vec4 sampSlice(vec2 uv, float sl){',
    '  sl = mod(sl, 32.0);',
    '  float tx = mod(sl, 8.0);',
    '  float ty = floor(sl / 8.0);',
    '  vec2 texel = vec2(1.0 / 256.0, 1.0 / 128.0);',
    '  vec2 cell = vec2(32.0 / 256.0, 32.0 / 128.0);',
    '  vec2 u = (uv * (cell - 2.0 * texel)) + vec2(tx, ty) * cell + texel;',
    '  return texture2D(uNoise, u);',
    '}',
    'vec4 tex3(vec3 p){',
    '  vec3 q = fract(p);',
    '  float z = q.z * 32.0;',
    '  float z0 = floor(z);',
    '  float fz = z - z0;',
    '  vec4 a = sampSlice(q.xy, z0);',
    '  vec4 b = sampSlice(q.xy, z0 + 1.0);',
    '  return mix(a, b, fz);',
    '}',
    'float remap(float v, float a, float b){ return clamp((v - a) / max(0.0001, b - a), 0.0, 1.0); }',
    'float hg(float c, float g){ float g2 = g * g; return (1.0 - g2) / (4.0 * 3.14159265 * pow(1.0 + g2 - 2.0 * g * c, 1.5)); }',
    'bool shell(vec3 ro, vec3 rd, float r0, float r1, vec3 ctr, out float tEnter, out float tExit){',
    '  vec3 oc = ro - ctr;',
    '  float b = dot(oc, rd);',
    '  float rad2 = dot(oc, oc);',
    '  float c1 = rad2 - r1 * r1;',
    '  float h1 = b * b - c1;',
    '  if (h1 < 0.0) return false;',
    '  float s1 = sqrt(max(0.0, h1));',
    '  float tOutA = -b - s1, tOutB = -b + s1;',
    '  if (tOutB <= 0.0) return false;',
    '  float c0 = rad2 - r0 * r0;',
    '  float h0 = b * b - c0;',
    '  tEnter = max(0.0, tOutA);',
    '  tExit = tOutB;',
    '  if (h0 > 0.0) {',
    '    float s0 = sqrt(max(0.0, h0));',
    '    float tInA = -b - s0, tInB = -b + s0;',
    '    if (rad2 < r0 * r0) { tEnter = max(0.0, tInB); tExit = tOutB; }',
    '    else if (rad2 < r1 * r1) { tEnter = 0.0; tExit = tInA > 0.0 ? tInA : tOutB; }',
    '    else { tEnter = max(0.0, tOutA); tExit = (tInA > tEnter) ? tInA : tOutB; }',
    '  }',
    '  return tExit > tEnter + 0.05;',
    '}',
    'float densityAt(vec3 p, float h01){',
    '  vec3 wp = p + vec3(uWind.x, 0.0, uWind.y);',
    '  vec2 wu = wp.xz * (1.0 / 1400.0) + vec2(0.11, 0.07);',
    '  vec4 we = texture2D(uWeather, wu);',
    '  vec4 wm = texture2D(uWeather, wp.xz * (1.0 / 620.0) + vec2(0.37, 0.19));',
    '  float cov = remap(we.r * mix(0.62, 1.0, wm.r), uCovMin * 0.32, 0.70);',
    '  if (uEgypt > 0.5) cov *= 0.70;',
    '  if (cov <= 0.001) return 0.0;',
    '  float h = clamp(h01, 0.0, 1.0);',
    '  vec3 np = vec3(wp.xz * (1.0 / 200.0), h * 0.9 + 0.08);',
    '  vec4 n1 = tex3(np);',
    '  vec4 n2 = tex3(np * 2.05 + vec3(0.17, 0.31, 0.09));',
    '  float fbm = n1.r * 0.72 + n2.r * 0.28;',
    '  float wor = n1.g * 0.7 + n2.g * 0.3;',
    '  float bottom = smoothstep(0.0, 0.20, h);',
    '  float top = 1.0 - smoothstep(0.36 + 0.34 * wor, 0.98, h);',
    '  float hGrad = bottom * top;',
    '  float shape = remap(fbm * hGrad, 1.0 - cov * 0.9, 1.0);',
    '  float edge = 1.0 - smoothstep(0.10, 0.52, shape);',
    '  float near = 1.0 - smoothstep(500.0, 1400.0, length(p.xz - uCamPos.xz));',
    '  if (edge > 0.01 && near > 0.02) {',
    '    vec4 n3 = tex3(np * 4.8 + vec3(2.9, 1.4, 0.6));',
    '    shape = max(0.0, shape - edge * near * (1.0 - n3.g) * 0.28);',
    '  }',
    '  if (shape < 0.035) return 0.0;',
    '  return shape * uDens;',
    '}',
    'float height01(vec3 p, vec3 ctr){',
    '  return (p.y - uY0) / max(0.001, uY1 - uY0);',
    '}',
    'bool hitYSlab(vec3 ro, vec3 rd, out float tEnter, out float tExit){',
    '  if (abs(rd.y) < 0.0008) {',
    '    if (ro.y < uY0 || ro.y > uY1) return false;',
    '    tEnter = 0.0; tExit = 8000.0; return true;',
    '  }',
    '  float ta = (uY0 - ro.y) / rd.y;',
    '  float tb = (uY1 - ro.y) / rd.y;',
    '  tEnter = min(ta, tb);',
    '  tExit = max(ta, tb);',
    '  if (tExit < 0.0) return false;',
    '  tEnter = max(tEnter, 0.0);',
    '  if (tEnter > 12000.0) return false;',
    '  return tExit > tEnter + 0.05;',
    '}',
    'float lightT(vec3 p, vec3 ctr){',
    '  float acc = 0.0;',
    '  float step = max((uY1 - uY0) / max(4.0, uLSteps), 22.0);',
    '  for (int i = 0; i < 8; i++) {',
    '    if (float(i) >= uLSteps) break;',
    '    p += uSunDir * step;',
    '    float h01 = height01(p, ctr);',
    '    if (h01 < -0.08 || h01 > 1.2) break;',
    '    acc += densityAt(p, h01) * step;',
    '  }',
    '  return exp(-acc * uAbs);',
    '}',
    'void main(){',
    '  vec2 uv = vUv;',
    '  vec4 bn = texture2D(uBlue, gl_FragCoord.xy / 128.0 + vec2(uJitter * 0.37, 0.19));',
    '  vec4 ndc = vec4(uv * 2.0 - 1.0, 1.0, 1.0);',
    '  vec4 vc = uInvProj * ndc; vc.xyz /= vc.w;',
    '  vec3 rd = normalize((uInvView * vec4(vc.xyz, 0.0)).xyz);',
    '  vec3 ro = uCamPos;',
    '  vec3 ctr = vec3(ro.x, 0.0, ro.z);',
    '  float t0, t1;',
    '  if (!hitYSlab(ro, rd, t0, t1)) { gl_FragColor = vec4(0.0); return; }',
    '  if (t1 <= t0 + 0.05) { gl_FragColor = vec4(0.0); return; }',
    '  float span = t1 - t0;',
    '  float step = min(span / max(8.0, uSteps), 24.0);',
    '  float t = t0 + step * (0.25 + 0.5 * bn.r);',
    '  float T = 1.0;',
    '  vec3 C = vec3(0.0);',
    '  for (int i = 0; i < 48; i++) {',
    '    if (float(i) >= uSteps || t > t1 || T < 0.012) break;',
    '    vec3 p = ro + rd * t;',
    '    float h01 = height01(p, ctr);',
    '    float d = densityAt(p, h01);',
    '    if (d > 0.0015) {',
    '      float lt = lightT(p, ctr);',
    '      float mu = dot(rd, uSunDir);',
    '      float phase = hg(mu, 0.35) * 0.7 + hg(mu, -0.25) * 0.3;',
    '      phase = clamp(phase, 0.15, 1.8);',
    '      float powder = mix(1.0, 1.0 - exp(-d * step * 1.4), 0.28);',
    '      float sunA = pow(clamp(dot(rd, uSunDir) * 0.5 + 0.5, 0.0, 1.0), 1.55);',
    '      vec3 warm = mix(vec3(1.00, 0.28, 0.30), vec3(1.00, 0.82, 0.32), sunA);',
    '      vec3 sunC = mix(uSunCol, warm, clamp(uDusk, 0.0, 1.0));',
    '      sunC *= uSunK * (1.45 + 1.55 * uDusk);',
    '      vec3 skyA = mix(uSkyHor, uSkyTop, 0.30 + 0.55 * clamp(h01, 0.0, 1.0));',
    '      vec3 amb = mix(uShad, skyA, 0.32 + 0.50 * clamp(h01, 0.0, 1.0));',
    '      amb *= 0.50 + 0.28 * (1.0 - uNight);',
    '      amb = mix(amb, uSkyHor * 0.82, uDusk * 0.38);',
    '      vec3 s = amb + sunC * (0.08 + 0.92 * lt) * phase * powder;',
    '      float absorb = exp(-d * step * uAbs);',
    '      C += T * s * (1.0 - absorb);',
    '      T *= absorb;',
    '    }',
    '    t += step;',
    '  }',
    '  float alpha = clamp(1.0 - T, 0.0, 1.0);',
    '  float midT = mix(t0, t1, 0.5);',
    '  float distF = 1.0 - smoothstep(650.0, 3400.0, midT);',
    '  float horF = smoothstep(0.0, 0.045, rd.y);',
    '  alpha *= mix(0.18, 1.0, horF) * mix(0.28, 1.0, distF);',
    '  C = mix(uSkyHor, C, 0.40 + 0.60 * distF);',
    '  if (uNight > 0.55) { C *= 0.32 + 0.18 * (1.0 - uNight); alpha *= 0.62; }',
    '  gl_FragColor = vec4(C, alpha);',
    '}'
  ].join('\n');

  const BLIT_VERT = [
    'varying vec2 vUv;',
    'void main(){',
    '  vUv = uv;',
    '  gl_Position = vec4(position.xy, 0.999, 1.0);',
    '}'
  ].join('\n');

  const BLIT_FRAG = [
    'precision highp float;',
    'uniform sampler2D uCloud;',
    'varying vec2 vUv;',
    'void main(){',
    '  vec4 c = texture2D(uCloud, vUv);',
    '  if (c.a < 0.003) discard;',
    '  gl_FragColor = c;',
    '}'
  ].join('\n');

  function makeRT(w, h) {
    const opts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false, generateMipmaps: false };
    let rt = null;
    try {
      const gl = renderer.getContext();
      const half = gl && gl.getExtension && (gl.getExtension('OES_texture_half_float') || gl.getExtension('EXT_color_buffer_half_float'));
      if (half && THREE.HalfFloatType) rt = new THREE.WebGLRenderTarget(w, h, Object.assign({ type: THREE.HalfFloatType }, opts));
    } catch (_) {}
    if (!rt) rt = new THREE.WebGLRenderTarget(w, h, opts);
    rt.texture.generateMipmaps = false;
    return rt;
  }

  function ensureVol() {
    if (U.volOk) return true;
    try {
      if (typeof THREE === 'undefined' || typeof renderer === 'undefined' || typeof scene === 'undefined') return false;
      if (!U.noise3) U.noise3 = bakeNoise();
      if (!U.weather) U.weather = bakeWeather();
      if (!U.blue) U.blue = bakeBlue();
      const geo = new THREE.PlaneGeometry(2, 2);
      const unis = {
        uNoise: { value: U.noise3 },
        uWeather: { value: U.weather },
        uBlue: { value: U.blue },
        uCamPos: { value: new THREE.Vector3() },
        uSunDir: { value: new THREE.Vector3(1, 0.4, 0.2) },
        uSunCol: { value: new THREE.Color(1, 0.95, 0.82) },
        uSkyTop: { value: new THREE.Color(0.3, 0.56, 0.87) },
        uSkyHor: { value: new THREE.Color(0.78, 0.86, 0.91) },
        uLit: { value: new THREE.Color(1, 1, 1) },
        uShad: { value: new THREE.Color(0.4, 0.42, 0.5) },
        uInvProj: { value: new THREE.Matrix4() },
        uInvView: { value: new THREE.Matrix4() },
        uRes: { value: new THREE.Vector2(1, 1) },
        uWind: { value: new THREE.Vector2(0, 0) },
        uY0: { value: 180 }, uY1: { value: 260 },
        uPlanetR: { value: 400 }, uFar: { value: 140 },
        uSteps: { value: 28 }, uLSteps: { value: 4 },
        uDens: { value: 1.35 }, uAbs: { value: 1.55 }, uCovMin: { value: 0.22 },
        uSunK: { value: 1 }, uDusk: { value: 0 }, uNight: { value: 0 },
        uTime: { value: 0 }, uJitter: { value: 0 }, uEgypt: { value: 0 }
      };
      const vmat = new THREE.ShaderMaterial({
        uniforms: unis,
        vertexShader: VOL_VERT,
        fragmentShader: VOL_FRAG,
        depthTest: false, depthWrite: false, fog: false, transparent: true
      });
      vmat.precision = 'highp';
      U.volUnis = unis;
      U.volScene = new THREE.Scene();
      U.volCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      U.volQuad = new THREE.Mesh(geo, vmat);
      U.volQuad.frustumCulled = false;
      U.volScene.add(U.volQuad);
      const bmat = new THREE.ShaderMaterial({
        uniforms: { uCloud: { value: null } },
        vertexShader: BLIT_VERT,
        fragmentShader: BLIT_FRAG,
        depthTest: true, depthWrite: false, fog: false, transparent: true,
        blending: THREE.NormalBlending
      });
      U.blitScene = new THREE.Scene();
      U.blitCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      U.blitQuad = new THREE.Mesh(geo.clone(), bmat);
      U.blitQuad.frustumCulled = false;
      U.blitScene.add(U.blitQuad);
      U.windT = 0;
      U.frameI = 0;
      U.volOk = 1;
      return true;
    } catch (e) { ERR('vol', e); return false; }
  }

  function volSize(q) {
    let w = 1, h = 1;
    try {
      const pr = renderer.getPixelRatio ? renderer.getPixelRatio() : 1;
      const s = renderer.getSize ? renderer.getSize(new THREE.Vector2()) : { x: renderer.domElement.width, y: renderer.domElement.height };
      w = Math.max(1, (s.x * pr) | 0); h = Math.max(1, (s.y * pr) | 0);
    } catch (_) {
      try { w = renderer.domElement.width || 1; h = renderer.domElement.height || 1; } catch (e2) {}
    }
    const div = q === 'high' ? 2 : 4;
    return { w: Math.max(160, (w / div) | 0), h: Math.max(90, (h / div) | 0), fullW: w, fullH: h };
  }

  function ensureRT(q) {
    const sz = volSize(q);
    if (!U.cloudRT || U.rtW !== sz.w || U.rtH !== sz.h) {
      try { if (U.cloudRT) U.cloudRT.dispose(); } catch (_) {}
      U.cloudRT = makeRT(sz.w, sz.h);
      U.rtW = sz.w; U.rtH = sz.h;
    }
    if (U.blitQuad && U.blitQuad.material) U.blitQuad.material.uniforms.uCloud.value = U.cloudRT.texture;
    if (U.volUnis) U.volUnis.uRes.value.set(sz.w, sz.h);
    return U.cloudRT;
  }

  function updateVolUnis(pal, r) {
    const un = U.volUnis;
    if (!un || typeof camera === 'undefined') return;
    const ph = pal.ph;
    const egypt = r === 'egypt';
    const q = currentQ();
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
    un.uInvProj.value.copy(camera.projectionMatrix).invert();
    un.uInvView.value.copy(camera.matrixWorld);
    un.uCamPos.value.copy(camera.position);
    const far = camera.far || 140;
    un.uFar.value = far;
    const sea = (typeof SEA === 'number') ? SEA : 32;
    // World slab around y 180-260, kept thin so it reads as a layer that recedes.
    // If that sits beyond the far plane, drop to a closer slab without changing camera.far.
    const wantY0 = Math.max(sea + 110, 180), wantY1 = wantY0 + 80; // y 180-260
    const camY = camera.position.y;
    const y0 = wantY0, y1 = wantY1;
    un.uY0.value = y0; un.uY1.value = y1;
    const mid = 0.5 * (y0 + y1);
    const want = far * 0.82;
    const rise = Math.max(18, Math.abs(mid - camY));
    let R = (want * want / rise - (mid + camY)) * 0.5;
    if (!isFinite(R) || R < 180) R = 180;
    if (R > 8000) R = 8000;
    un.uPlanetR.value = R;
    un.uSunDir.value.set(ph.sx, Math.max(0.02, ph.sy), 0.33).normalize();
    un.uSunCol.value.setRGB(pal.sunCol[0], pal.sunCol[1], pal.sunCol[2]);
    un.uSkyTop.value.setRGB(pal.top[0], pal.top[1], pal.top[2]);
    un.uSkyHor.value.setRGB(pal.hor[0], pal.hor[1], pal.hor[2]);
    un.uLit.value.setRGB(pal.clLit[0], pal.clLit[1], pal.clLit[2]);
    un.uShad.value.setRGB(pal.clShad[0], pal.clShad[1], pal.clShad[2]);
    un.uSunK.value = Math.max(0.15, pal.sunK);
    un.uDusk.value = ph.dusk;
    un.uNight.value = ph.night;
    un.uEgypt.value = egypt ? 1 : 0;
    un.uSteps.value = q === 'high' ? 48 : 28;
    un.uLSteps.value = q === 'high' ? 6 : 4;
    un.uDens.value = egypt ? 1.15 : 1.35;
    un.uAbs.value = egypt ? 0.84 : 0.92;
    un.uCovMin.value = egypt ? 0.38 : 0.22;
    un.uTime.value = U.windT || 0;
    un.uWind.value.set((U.windT || 0) * 2.4, (U.windT || 0) * 0.7);
    un.uJitter.value = ((U.frameI || 0) % 8) / 8;
  }

  function hideBlit() {
    try { if (U.blitQuad) U.blitQuad.visible = false; } catch (_) {}
  }

  function prepVol() {
    if (!U.volOn || !U.volOk) { hideBlit(); return; }
    const q = currentQ();
    if (q === 'low') { hideBlit(); return; }
    const t0 = (typeof performance !== 'undefined') ? performance.now() : 0;
    try {
      ensureRT(q);
      updateVolUnis(U.sky || palette(), U.realm);
      const prevAC = renderer.autoClear;
      const prevTarget = renderer.getRenderTarget ? renderer.getRenderTarget() : null;
      renderer.setRenderTarget(U.cloudRT);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(U.volScene, U.volCam);
      renderer.setRenderTarget(prevTarget);
      renderer.autoClear = prevAC;
      if (U.blitQuad) {
        if (U.blitQuad.parent && U.blitQuad.parent !== scene) U.blitQuad.parent.remove(U.blitQuad);
        if (U.blitQuad.parent !== scene) scene.add(U.blitQuad);
        U.blitQuad.material.uniforms.uCloud.value = U.cloudRT.texture;
        U.blitQuad.material.depthTest = true;
        U.blitQuad.material.depthWrite = false;
        U.blitQuad.material.transparent = true;
        U.blitQuad.renderOrder = 1200;
        U.blitQuad.visible = true;
        U.blitQuad.frustumCulled = false;
      }
      U.frameI = (U.frameI || 0) + 1;
    } catch (e) { ERR('draw', e); hideBlit(); }
    const t1 = (typeof performance !== 'undefined') ? performance.now() : t0;
    U.volMs = t1 - t0;
  }

  function hookRender() {
    if (U.rendHook) return;
    try {
      if (typeof renderer === 'undefined' || !renderer || typeof renderer.render !== 'function') return;
      const orig = renderer.render.bind(renderer);
      U._origRender = orig;
      renderer.render = function (sc, cam) {
        if (U._inRend) return orig(sc, cam);
        let playing = true;
        try { if (typeof started !== 'undefined' && !started) playing = false; } catch (_) {}
        const off = !playing || !U.volOn || currentQ() === 'low';
        let foreign = false;
        try { foreign = !!(renderer.getRenderTarget && renderer.getRenderTarget()); } catch (_) {}
        if (off || foreign || sc !== scene || cam !== camera) {
          if (off) hideBlit();
          return orig(sc, cam);
        }
        U._inRend = true;
        try {
          prepVol();
          orig(sc, cam);
        } finally { U._inRend = false; }
      };
      U.rendHook = 1;
    } catch (e) { ERR('rhook', e); }
  }

  function tickClouds(dt, pal, r) {
    const q = currentQ();
    U.q = q;
    const cave = (typeof caveL === 'number') ? caveL : 0;
    let playing = true;
    try { if (typeof started !== 'undefined' && !started) playing = false; } catch (_) {}
    const ok = skyOk(r) && cave < 0.55 && !inLava();
    U.volOn = 0;
    if (!ok) {
      if (U.root) U.root.visible = false;
      try { if (typeof clouds !== 'undefined' && Array.isArray(clouds)) for (const c of clouds) c.visible = true; } catch (_) {}
      U.mode = 'off';
      return;
    }
    try { if (typeof clouds !== 'undefined' && Array.isArray(clouds)) for (const c of clouds) c.visible = false; } catch (_) {}
    U.windT = (U.windT || 0) + (dt || 0);
    if (!playing || q === 'low') {
      U.mode = 'impostor';
      tickImpostors(dt, pal, r);
    } else {
      U.mode = 'volume';
      if (U.root) U.root.visible = false;
      if (ensureVol()) {
        U.volOn = 1;
        hookRender();
        updateVolUnis(pal, r);
      } else {
        U.mode = 'impostor';
        tickImpostors(dt, pal, r);
      }
    }
  }
  U.tick = function (dt) { try { tickClouds(dt || 0, palette(), realm()); } catch (e) { ERR('tick', e); } };

  function holdNsky(pal) {
    try {
      const d = WIN.__nsky && __nsky.dome;
      if (!d) return;
      const nightOn = pal.starsK > 0.12 && pal.ph.dusk < 0.28 && pal.ph.day < 0.28;
      if (!nightOn) {
        if (d.material && d.material.uniforms && d.material.uniforms.uK) d.material.uniforms.uK.value = 0;
        d.visible = false;
      } else {
        d.visible = true;
        d.position.copy(camera.position);
        if (d.material && d.material.uniforms && d.material.uniforms.uK) {
          d.material.uniforms.uK.value = Math.min(0.93, pal.starsK);
        }
      }
    } catch (e) { ERR('nsky', e); }
  }

  function apply() {
    const r = realm();
    U.realm = r;
    if (!skyOk(r) || inLava()) {
      try { if (U.root) U.root.visible = false; } catch (_) {}
      U.volOn = 0;
      return false;
    }
    const cave = (typeof caveL === 'number') ? caveL : 0;
    if (cave > 0.55) {
      try { if (U.root) U.root.visible = false; } catch (_) {}
      U.volOn = 0;
      return false;
    }
    const pal = palette(undefined, r);
    U.sky = pal;
    U.on++;
    try { extendShader(); } catch (e) { ERR('ext', e); }
    try {
      if (typeof skyUniforms !== 'undefined' && skyUniforms) {
        if (skyUniforms.top && skyUniforms.top.value) {
          const t = pal.ph.dusk > 0.2 ? [(pal.top[0] + pal.mid[0]) * 0.5, (pal.top[1] + pal.mid[1]) * 0.5, (pal.top[2] + pal.mid[2]) * 0.5] : pal.top;
          skyUniforms.top.value.setRGB(t[0], t[1], t[2]);
        }
        if (skyUniforms.hor && skyUniforms.hor.value) skyUniforms.hor.value.setRGB(pal.hor[0], pal.hor[1], pal.hor[2]);
        if (skyUniforms.sunCol && skyUniforms.sunCol.value) skyUniforms.sunCol.value.setRGB(pal.sunCol[0], pal.sunCol[1], pal.sunCol[2]);
        if (skyUniforms.sunK) skyUniforms.sunK.value = pal.sunK;
        if (skyUniforms.dark) skyUniforms.dark.value = cave * 0.85;
      }
    } catch (e) { ERR('skyu', e); }
    try {
      if (typeof scene !== 'undefined' && scene) {
        if (scene.fog && scene.fog.color) {
          scene.fog.color.setRGB(pal.fog[0], pal.fog[1], pal.fog[2]);
          try {
            if (typeof isScaled === 'function' && isScaled() && r === null && pal.ph.dusk < 0.2 && pal.ph.day > 0.65 && scene.fog.far > 40) {
              if (scene.fog.near < scene.fog.far * 0.58) scene.fog.near = scene.fog.far * 0.58;
            } else {
              scene.fog.near = pal.fogNear;
              scene.fog.far = pal.fogFar;
            }
          } catch (_) { scene.fog.near = pal.fogNear; scene.fog.far = pal.fogFar; }
        }
        if (scene.background && scene.background.setRGB) scene.background.setRGB(pal.fog[0], pal.fog[1], pal.fog[2]);
      }
    } catch (e) { ERR('fog', e); }
    try {
      if (typeof stars !== 'undefined' && stars && stars.material) {
        stars.material.opacity = pal.starsK;
        stars.visible = pal.starsK > 0.02;
        stars.position.copy(camera.position);
      }
    } catch (e) { ERR('stars', e); }
    try {
      if (typeof sunDisc !== 'undefined' && sunDisc) {
        if (pal.ph.dusk > 0.2 && sunDisc.material && sunDisc.material.color) sunDisc.material.color.setRGB(1, 0.82, 0.45);
      }
      if (typeof moonDisc !== 'undefined' && moonDisc && pal.ph.sy > 0.04) moonDisc.visible = false;
    } catch (_) {}
    holdNsky(pal);
    tickClouds(0, pal, r);
    return true;
  }
  U.apply = apply;

  function setQ(q) {
    if (q !== 'low' && q !== 'med' && q !== 'high') return;
    U.q = q;
    try { if (typeof SET !== 'undefined' && SET) { SET.cloudQ = q; if (typeof saveSet === 'function') saveSet(); } } catch (_) {}
    syncCloudUI();
    try { U.builtQ = null; apply(); } catch (_) {}
  }
  U.setQ = setQ;

  function syncCloudUI() {
    try {
      const q = currentQ();
      U.q = q;
      const row = document.getElementById('cloudSeg');
      if (!row) return;
      row.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.cq === q));
    } catch (_) {}
  }

  function ensureUI() {
    try {
      if (document.getElementById('cloudSeg')) { syncCloudUI(); return; }
      const host = document.getElementById('qSeg2') || document.getElementById('qSeg');
      const pane = (host && host.parentNode) || document.querySelector('#pause .panel') || document.body;
      if (!pane) return;
      const wrap = document.createElement('div');
      wrap.className = 'set inline';
      wrap.id = 'cloudQRow';
      wrap.innerHTML = '<span>Clouds</span><div class="seg" id="cloudSeg">' +
        '<button data-cq="low" data-testid="settings-clouds-low">Low</button>' +
        '<button data-cq="med" data-testid="settings-clouds-med">Medium</button>' +
        '<button data-cq="high" data-testid="settings-clouds-high">High</button></div>';
      if (host && host.parentNode) host.parentNode.insertAdjacentElement('afterend', wrap);
      else pane.appendChild(wrap);
      wrap.querySelectorAll('button').forEach(b => b.addEventListener('click', () => setQ(b.dataset.cq)));
      try { if (typeof SET !== 'undefined' && SET && !SET.cloudQ) SET.cloudQ = defaultQ(); } catch (_) {}
      syncCloudUI();
    } catch (e) { ERR('ui', e); }
  }

  function hook() {
    try { ensureUI(); } catch (_) {}
    if (U.hook) return;
    try {
      if (typeof updateSky !== 'function') return;
      const us = updateSky;
      updateSky = function (dt) {
        const r = us.apply(this, arguments);
        try { apply(); tickClouds(Math.min(0.1, +dt || 0), palette(), realm()); } catch (e) { ERR('tick', e); }
        return r;
      };
      U.hook = 1;
    } catch (e) { ERR('hook', e); }
    try { extendShader(); } catch (_) {}
    try { hookRender(); } catch (_) {}
    try { ensureUI(); } catch (_) {}
  }
  U.boot = hook;
  U.ensureUI = ensureUI;
  U.ensureVol = ensureVol;
  hook();
  setTimeout(hook, 200);
  setTimeout(hook, 1200);
  setTimeout(ensureUI, 400);
})(typeof window !== 'undefined' ? window : this);
