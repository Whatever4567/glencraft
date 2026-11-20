/* GLX-SKY1312 (v1.2.112): time-of-day skies and a literal overworld sunset plate.
   Each realm keeps its own sky. The Highlands sunset is the actual sky from the
   reference photograph (full-resolution seamless webp on a dome -- no procedural
   cloud recreation, no raymarch on top). By day the plate desaturates toward the
   existing day sky; at night it fades so the starry night remains. Egypt keeps a
   real desert sky -- clear blue fading to a hazy sandy horizon by day, orange and
   pink at sunset, dark and starry at night. Hell, Agartha and other realm skies
   are left alone. Old box clouds are hidden, not deleted. */
(function sky1312(WIN) {
  const U = WIN.__sky1312 = WIN.__sky1311 = { version: '1.2.112-skies', err: null, hook: 0, q: null, n: 0, on: 0, mode: 'photo' };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 280); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const SKY_URL = 'assets/sky/overworld-sunset.webp';

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
    const duskTop = [0.32, 0.08, 0.28], duskMid = [0.96, 0.32, 0.28], duskHor = [1.00, 0.52, 0.18], duskFog = [0.81, 0.38, 0.17];
    const duskSun = [1.00, 0.52, 0.18];
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

  function hideOldClouds() {
    try { if (typeof clouds !== 'undefined' && Array.isArray(clouds)) for (const c of clouds) c.visible = false; } catch (_) {}
    try { if (U.root) U.root.visible = false; } catch (_) {}
    try { if (U.blitQuad) U.blitQuad.visible = false; } catch (_) {}
    try { if (U.volOn) U.volOn = 0; } catch (_) {}
  }

  function loadPlate() {
    if (U.plateTex || U.plateLoading) return U.plateTex || null;
    if (typeof THREE === 'undefined') return null;
    U.plateLoading = 1;
    try {
      const loader = new THREE.TextureLoader();
      const tex = loader.load(SKY_URL, function (t) {
        t.generateMipmaps = true;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.wrapS = THREE.ClampToEdgeWrapping;
        t.wrapT = THREE.ClampToEdgeWrapping;
        t.flipY = true;
        try {
          const an = (typeof TEXANISO === 'number') ? TEXANISO : 8;
          if (t.anisotropy < an) t.anisotropy = an;
        } catch (_) {}
        t.needsUpdate = true;
        U.plateReady = 1;
      }, undefined, function (e) { ERR('tex', e); U.plateLoading = 0; });
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      U.plateTex = tex;
      return tex;
    } catch (e) { ERR('load', e); U.plateLoading = 0; return null; }
  }

  const PLATE_VERT = [
    'varying vec3 vDir;',
    'void main(){',
    '  vDir = position;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n');

  const PLATE_FRAG = [
    'precision highp float;',
    'uniform sampler2D uSky;',
    'uniform vec3 uZenith, uHor, uSunDir;',
    'uniform float uSunAz, uSunU, uHalf, uDrift, uDay, uNight, uDusk, uAlpha;',
    'varying vec3 vDir;',
    'float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float vnoise(vec2 p){',
    '  vec2 i = floor(p); vec2 f = fract(p);',
    '  float a = hash21(i);',
    '  float b = hash21(i + vec2(1.0, 0.0));',
    '  float c = hash21(i + vec2(0.0, 1.0));',
    '  float d = hash21(i + vec2(1.0, 1.0));',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
    '}',
    'float ping88(float dist){',
    '  float s = 0.88;',
    '  float p = mod(dist, 2.0 * s);',
    '  if (p < 0.0) p += 2.0 * s;',
    '  if (p <= s) return s - p;',
    '  return p - s;',
    '}',
    'float mapPlateU(float u){',
    '  float s = 0.88;',
    '  if (u >= 0.0 && u <= 1.0) return clamp(u, 0.001, 0.999);',
    '  if (u < 0.0) {',
    '    float p = mod(-u, 2.0 * s);',
    '    if (p < 0.0) p += 2.0 * s;',
    '    if (p <= s) return max(0.001, p);',
    '    return min(s, 2.0 * s - p);',
    '  }',
    '  return clamp(ping88(u - 1.0), 0.001, s);',
    '}',
    'float wrapU(float u){',
    '  if (u < 0.0) {',
    '    float p = mod(-u, 1.76);',
    '    if (p < 0.0) p += 1.76;',
    '    if (p <= 0.88) return max(0.001, p);',
    '    return min(0.88, 1.76 - p);',
    '  }',
    '  return clamp(ping88(u - 1.0), 0.001, 0.88);',
    '}',
    'vec3 sampUV(float u, float v){',
    '  return texture2D(uSky, vec2(clamp(u, 0.001, 0.999), clamp(v, 0.001, 0.999))).rgb;',
    '}',
    'void main(){',
    '  vec3 dir = normalize(vDir);',
    '  float elev = dir.y;',
    '  if (elev < -0.04) { gl_FragColor = vec4(0.0); return; }',
    '  float az = atan(dir.x, dir.z);',
    '  float rel = atan(sin(az - uSunAz), cos(az - uSunAz));',
    '  float uRaw = uSunU + rel / max(0.15, 2.0 * uHalf) + uDrift;',
    '  float v = 1.0 - clamp(elev / 0.78, 0.0, 1.0);',
    // Warped mix coordinate: the blend edge wiggles with elevation so it is
    // never a straight vertical line. Band width ~10% of u.
    '  float n = vnoise(vec2(v * 1.6, 3.17));',
    '  float warp = (n - 0.5) * 0.08;',
    '  vec3 colU = sampUV(clamp(uRaw, 0.001, 0.999), v);',
    '  vec3 colW = sampUV(wrapU(uRaw), v);',
    // Wide, warped crossfade past the sun into the continuation (fixes the old
    // hard cut at u=1, where the previous fade compared identical samples).
    '  float fadeR = smoothstep(0.94 + warp, 1.05 + warp, uRaw);',
    '  float fadeL = 1.0 - smoothstep(-0.08 + warp, 0.02 + warp, uRaw);',
    '  vec3 col = mix(colU, colW, clamp(fadeR + fadeL, 0.0, 1.0));',
    '  if (uRaw < -0.08 || uRaw > 1.05) col = colW;',
    '  float topF = smoothstep(0.62, 0.94, elev);',
    '  col = mix(col, uZenith, topF * 0.45);',
    '  float luma = dot(col, vec3(0.30, 0.50, 0.20));',
    '  col = mix(col, vec3(luma), uDay * 0.72);',
    '  col = mix(col, mix(uHor, uZenith, 0.45), uDay * 0.55);',
    '  col *= 1.0 - uNight * 0.88;',
    // Soft additive sun: hot core into the photo's own gold glow. No mesh disc.
    '  vec3 sDir = normalize(uSunDir);',
    '  float mu = max(0.0, dot(dir, sDir));',
    '  float core = pow(mu, 420.0);',
    '  float bloom = pow(mu, 36.0);',
    '  float haze = pow(mu, 8.0);',
    '  vec3 sunAdd = vec3(1.0, 0.92, 0.55) * core * 1.7',
    '             + vec3(1.0, 0.70, 0.22) * bloom * 0.70',
    '             + vec3(1.0, 0.48, 0.10) * haze * 0.22;',
    '  col += sunAdd * (0.25 + 0.75 * uDusk) * (1.0 - uNight) * (1.0 - uDay * 0.85);',
    '  float horF = smoothstep(-0.03, 0.012, elev);',
    '  float a = uAlpha * horF * (1.0 - topF * 0.35);',
    '  a *= (1.0 - uDay * 0.78) * (1.0 - uNight * 0.92);',
    '  a *= 0.35 + 0.65 * uDusk + 0.20 * (1.0 - uDay);',
    '  if (a < 0.01) { gl_FragColor = vec4(0.0); return; }',
    '  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));',
    '}'
  ].join('\n');



  // Same rule as GLX-C75 for the old skyDome (R=130): keep the plate inside
  // camera.far so a low render distance cannot clip it into a pale disc.
  const PLATE_R = 126;
  function plateRadius() {
    let far = PLATE_R / 0.8;
    try {
      if (typeof camera !== 'undefined' && camera) {
        const f = +camera.far;
        if (f > 0) far = f;
      }
    } catch (_) {}
    return Math.max(24, Math.min(PLATE_R, far * 0.8));
  }

  function ensurePlate() {
    if (U.plateMesh && U.plateMesh.parent) return U.plateMesh;
    if (typeof THREE === 'undefined' || typeof scene === 'undefined' || !scene) return null;
    const tex = loadPlate();
    if (!tex) return null;
    try {
      const geo = new THREE.IcosahedronGeometry(1, 4);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uSky: { value: tex },
          uZenith: { value: new THREE.Color(0.32, 0.08, 0.28) },
          uHor: { value: new THREE.Color(1.0, 0.52, 0.18) },
          uSunDir: { value: new THREE.Vector3(-1, 0.04, 0.33) },
          uSunAz: { value: 0 },
          uSunU: { value: 0.92 },
          uHalf: { value: 1.05 },
          uDrift: { value: 0 },
          uDay: { value: 0 },
          uNight: { value: 0 },
          uDusk: { value: 1 },
          uAlpha: { value: 1 }
        },
        vertexShader: PLATE_VERT,
        fragmentShader: PLATE_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        fog: false,
        transparent: true,
        toneMapped: false
      });
      try { mat.toneMapped = false; } catch (_) {}
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.setScalar(plateRadius());
      mesh.frustumCulled = false;
      mesh.renderOrder = -9;
      mesh.name = 'sky1312-sunset-plate';
      scene.add(mesh);
      U.plateMesh = mesh;
      U.plateMat = mat;
      U.mode = 'photo';
      return mesh;
    } catch (e) { ERR('mesh', e); return null; }
  }

  function tickPlate(dt, pal, r) {
    hideOldClouds();
    const egypt = r === 'egypt';
    const show = !egypt && r === null && pal && pal.ph;
    if (!show) {
      try { if (U.plateMesh) U.plateMesh.visible = false; } catch (_) {}
      U.mode = egypt ? 'egypt' : 'off';
      return;
    }
    const mesh = ensurePlate();
    if (!mesh || !U.plateMat) { U.mode = 'photo'; return; }
    try {
      mesh.visible = true;
      if (typeof camera !== 'undefined' && camera) mesh.position.copy(camera.position);
      try { mesh.scale.setScalar(plateRadius()); } catch (_) {}
      const ph = pal.ph;
      const sunAz = Math.atan2(ph.sx, 0.33);
      const un = U.plateMat.uniforms;
      un.uSunAz.value = sunAz;
      un.uSunU.value = 0.92;
      un.uHalf.value = 1.05;
      if (un.uSunDir && un.uSunDir.value && un.uSunDir.value.set) {
        un.uSunDir.value.set(ph.sx, Math.max(ph.sy, 0.03), 0.33).normalize();
      }
      // Show the plate as-is at dusk; only fade/desaturate in true day or night.
      un.uDay.value = ph.day * (1 - ph.dusk);
      un.uNight.value = ph.night * (1 - ph.dusk);
      un.uDusk.value = ph.dusk;
      un.uAlpha.value = 1;
      un.uZenith.value.setRGB(pal.top[0], pal.top[1], pal.top[2]);
      {
        const hc = (pal.ph.dusk > 0.15) ? PLATE_HOR : pal.hor;
        un.uHor.value.setRGB(hc[0], hc[1], hc[2]);
      }
      un.uDrift.value = 0;
      U.mode = 'photo';
    } catch (e) { ERR('tick', e); }
  }

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
      try { if (U.plateMesh) U.plateMesh.visible = false; } catch (_) {}
      hideOldClouds();
      return false;
    }
    const cave = (typeof caveL === 'number') ? caveL : 0;
    if (cave > 0.55) {
      try { if (U.plateMesh) U.plateMesh.visible = false; } catch (_) {}
      hideOldClouds();
      return false;
    }
    const pal = palette(undefined, r);
    U.sky = pal;
    U.on++;
    try {
      if (typeof skyUniforms !== 'undefined' && skyUniforms) {
        if (skyUniforms.top && skyUniforms.top.value) {
          const t = pal.ph.dusk > 0.2 ? [(pal.top[0] + pal.mid[0]) * 0.5, (pal.top[1] + pal.mid[1]) * 0.5, (pal.top[2] + pal.mid[2]) * 0.5] : pal.top;
          skyUniforms.top.value.setRGB(t[0], t[1], t[2]);
        }
        if (skyUniforms.hor && skyUniforms.hor.value) {
          const hc = (r === null && pal.ph.dusk > 0.15) ? PLATE_HOR : pal.hor;
          skyUniforms.hor.value.setRGB(hc[0], hc[1], hc[2]);
        }
        if (skyUniforms.sunCol && skyUniforms.sunCol.value) skyUniforms.sunCol.value.setRGB(pal.sunCol[0], pal.sunCol[1], pal.sunCol[2]);
        if (skyUniforms.sunK) skyUniforms.sunK.value = pal.sunK;
        if (skyUniforms.dark) skyUniforms.dark.value = cave * 0.85;
        U.shader = 1;
      }
    } catch (e) { ERR('skyu', e); }
    try {
      if (typeof scene !== 'undefined' && scene) {
        if (scene.fog && scene.fog.color) {
          const fc = (r === null && pal.ph.dusk > 0.15) ? PLATE_HOR : pal.fog;
          scene.fog.color.setRGB(fc[0], fc[1], fc[2]);
          if (r === null && !scene.fog.isFogExp2) {
            let vf = 128;
            try {
              if (window.__perf1261 && typeof __perf1261.vfBlocks === 'function') vf = __perf1261.vfBlocks();
              else if (typeof SET !== 'undefined' && typeof SET.rdist === 'number') vf = SET.rdist * 16;
            } catch (_) {}
            vf = Math.max(48, vf);
            // Much lighter than updateSky's near~20 / far~62: only a distant haze,
            // never a solid wall inside the view. Colour is a fallback; the
            // terrain shader samples the plate horizon at that azimuth.
            scene.fog.near = Math.max(vf * 0.70, 48);
            scene.fog.far = Math.max(vf * 1.40, scene.fog.near + 32);
          }
        }
        if (scene.background && scene.background.setRGB) {
          const fc = (r === null && pal.ph.dusk > 0.15) ? PLATE_HOR : pal.fog;
          scene.background.setRGB(fc[0], fc[1], fc[2]);
        }
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
      if (r === null && pal.ph.dusk > 0.15) {
        if (typeof sunDisc !== 'undefined' && sunDisc) sunDisc.visible = false;
      } else if (typeof sunDisc !== 'undefined' && sunDisc && pal.ph.dusk > 0.2 && sunDisc.material && sunDisc.material.color) {
        sunDisc.material.color.setRGB(1, 0.82, 0.45);
      }
      if (typeof moonDisc !== 'undefined' && moonDisc && pal.ph.sy > 0.04) moonDisc.visible = false;
    } catch (_) {}
    holdNsky(pal);
    tickPlate(0, pal, r);
    tintLights(pal, r);
    hookShade();
    hookWater(pal, r);
    tuneTorches();
    tickSunHalo(pal, r);
    try {
      const sh = U.shadeU;
      if (sh) {
        sh.uSky.value = U.plateTex || sh.uSky.value;
        if (pal && pal.ph) {
          sh.uSunAz.value = Math.atan2(pal.ph.sx, 0.33);
          sh.uDusk.value = pal.ph.dusk || 0;
          if (sh.uSunDir.value && sh.uSunDir.value.set) sh.uSunDir.value.set(pal.ph.sx, pal.ph.sy, 0.33).normalize();
        }
        sh.uSunU.value = 0.92;
        sh.uHalf.value = 1.05;
        sh.uFogAmt.value = 0.42;
        sh.uTexTier.value = (typeof HIGH !== 'undefined' && HIGH) ? 2.0 : 1.0;
      }
    } catch (e) { ERR('shadeU', e); }
    return true;
  }
  U.apply = apply;
  U.tick = function (dt) { try { tickPlate(dt || 0, palette(), realm()); } catch (e) { ERR('tick', e); } };
  U.setQ = function (q) { U.q = q || U.q || 'photo'; return U.q; };


  // Horizon / sun / ambient sampled from the plate (bottom rows, gold near the sun, upper mauve).
  const PLATE_HOR = [0.808, 0.380, 0.172];
  const PLATE_SUN = [0.856, 0.394, 0.153];
  const PLATE_AMB = [0.293, 0.138, 0.187];

  function tintLights(pal, r) {
    try {
      if (typeof sunL === 'undefined' || typeof hemi === 'undefined' || !pal || !pal.ph) return;
      const cave = (typeof caveL === 'number') ? caveL : 0;
      if (cave > 0.55) return;
      const ph = pal.ph;
      const dusk = (r === null) ? ph.dusk * (1 - cave) * (1 - ph.wd) : (r === 'egypt' ? ph.dusk * 0.85 : 0);
      const day = ph.day, night = ph.night;
      let sunC, skyC, gndC, sunI, hemiI;
      if (r === 'egypt') {
        sunC = dusk > 0.2 ? [1.00, 0.70, 0.32] : [1.00, 0.94, 0.72];
        skyC = dusk > 0.2 ? [0.62, 0.38, 0.32] : [0.62, 0.78, 0.92];
        gndC = dusk > 0.2 ? [0.32, 0.16, 0.08] : [0.42, 0.32, 0.18];
        sunI = 0.7 + 0.55 * day + 0.35 * dusk;
        hemiI = 0.32 + 0.28 * day;
      } else {
        const daySun = [1.00, 0.95, 0.82], daySky = [0.66, 0.80, 0.95], dayGnd = [0.26, 0.30, 0.20];
        const duskSun = [1.00, 0.58, 0.20], duskSky = [0.40, 0.24, 0.42], duskGnd = [0.16, 0.08, 0.06];
        const nightSun = [0.66, 0.75, 0.95], nightSky = [0.22, 0.28, 0.48], nightGnd = [0.08, 0.10, 0.14];
        sunC = lerp(nightSun, daySun, day);
        skyC = lerp(nightSky, daySky, day);
        gndC = lerp(nightGnd, dayGnd, day);
        if (dusk > 0.02) {
          sunC = lerp(sunC, duskSun, dusk);
          skyC = lerp(skyC, duskSky, dusk);
          gndC = lerp(gndC, duskGnd, dusk);
        }
        sunI = (ph.sy > -0.05)
          ? (0.55 + 0.70 * day * (1 - dusk) + 0.85 * dusk) * (1 - ph.wd * 0.7)
          : (0.28 + 0.18 * (typeof fullMoon === 'function' && fullMoon() ? 1 : 0.45));
        hemiI = (0.26 + 0.28 * day * (1 - dusk) + 0.18 * dusk) * (1 - ph.wd * 0.35);
      }
      sunL.color.setRGB(sunC[0], sunC[1], sunC[2]);
      sunL.intensity = sunI * (1 - Math.min(1, cave * 1.5));
      hemi.color.setRGB(skyC[0], skyC[1], skyC[2]);
      if (hemi.groundColor) hemi.groundColor.setRGB(gndC[0], gndC[1], gndC[2]);
      hemi.intensity = Math.max(0.16, hemiI * (1 - cave * 0.7));
      U.lit = 1;
    } catch (e) { ERR('light', e); }
  }

  function hookShade() {
    if (U.shade === 3) return;
    const skip = { lava: 1, glass: 1 };
    const share = U.shadeU || (U.shadeU = {
      uSky: { value: null },
      uSunAz: { value: 0 },
      uSunU: { value: 0.92 },
      uHalf: { value: 1.05 },
      uSunDir: { value: (typeof THREE !== 'undefined') ? new THREE.Vector3(-1, 0.05, 0.33) : null },
      uDusk: { value: 0 },
      uFogAmt: { value: 0.42 },
      uTexTier: { value: 1 }
    });
    const patch = function (shader, kind) {
      if (!shader || !shader.vertexShader || shader.vertexShader.indexOf('vWorldPos1312') >= 0) return;
      shader.uniforms.uSky1312 = share.uSky;
      shader.uniforms.uSunAz1312 = share.uSunAz;
      shader.uniforms.uSunU1312 = share.uSunU;
      shader.uniforms.uHalf1312 = share.uHalf;
      shader.uniforms.uSunDir1312 = share.uSunDir;
      shader.uniforms.uDusk1312 = share.uDusk;
      shader.uniforms.uFogAmt1312 = share.uFogAmt;
      shader.uniforms.uTexTier1312 = share.uTexTier;
      shader.vertexShader = 'varying vec3 vWorldPos1312;\nvarying vec3 vN1312;\n' + shader.vertexShader.replace(
        '#include <project_vertex>',
        '#include <project_vertex>\n  vWorldPos1312 = (modelMatrix * vec4(transformed, 1.0)).xyz;\n  vN1312 = normalize((modelMatrix * vec4(normal, 0.0)).xyz);'
      );
      const fogRep = [
        '#ifdef USE_FOG',
        '  {',
        '    vec3 viewD = vWorldPos1312 - cameraPosition;',
        '    float az = atan(viewD.x, viewD.z);',
        '    float rel = atan(sin(az - uSunAz1312), cos(az - uSunAz1312));',
        '    float uRaw = uSunU1312 + rel / max(0.15, 2.0 * uHalf1312);',
        '    float s = 0.88, uH;',
        '    if (uRaw >= 0.0 && uRaw <= 1.0) uH = clamp(uRaw, 0.001, 0.999);',
        '    else if (uRaw < 0.0) { float p = mod(-uRaw, 2.0 * s); if (p <= s) uH = max(0.001, p); else uH = min(s, 2.0 * s - p); }',
        '    else { float p = mod(uRaw - 1.0, 2.0 * s); if (p <= s) uH = s - p; else uH = p - s; }',
        '    vec3 horC = texture2D(uSky1312, vec2(clamp(uH, 0.001, 0.999), 0.92)).rgb;',
        '    float fogF = smoothstep(fogNear, fogFar, fogDepth) * uFogAmt1312;',
        '    gl_FragColor.rgb = mix(gl_FragColor.rgb, horC, clamp(fogF, 0.0, 0.55));',
        '  }',
        '#endif'
      ].join('\n');
      // albedo detail (e): limited-palette shift, per-block variation, darker edges, fine grain
      const albedo = [
        '  {',
        '    vec3 wp = vWorldPos1312;',
        '    vec3 fl = floor(wp + 1e-3);',
        '    float n1 = fract(sin(dot(fl, vec3(12.9898, 78.233, 37.719))) * 43758.5453);',
        '    float n2 = fract(sin(dot(fl, vec3(39.346, 11.135, 83.217))) * 24634.6345);',
        '    float grain = fract(sin(dot(floor(wp * (8.0 + 8.0 * uTexTier1312)), vec3(9.1, 17.3, 5.7))) * 12345.67);',
        '#ifdef USE_UV',
        '    float e1312 = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));',
        '    float edge = 0.78 + 0.22 * smoothstep(0.0, 0.10, e1312);',
        '#else',
        '    float edge = 1.0;',
        '#endif',
        '    float face = 0.88 + 0.16 * abs(vN1312.y) + 0.06 * max(vN1312.x, 0.0) - 0.07 * max(-vN1312.z, 0.0);',
        '    vec3 alb = gl_FragColor.rgb;',
        '    alb *= edge * face * (0.92 + 0.12 * n1) * (0.97 + 0.06 * grain);',
        '    // slight per-block tint in a limited palette (warm / cool / earth)',
        '    vec3 tint = mix(vec3(1.04, 0.98, 0.90), vec3(0.92, 0.98, 1.04), n2);',
        '    alb *= mix(vec3(1.0), tint, 0.14);',
        '    float ndl = max(0.0, dot(normalize(vN1312), normalize(uSunDir1312)));',
        '    alb += vec3(1.00, 0.55, 0.16) * pow(ndl, 1.4) * uDusk1312 * 0.12;',
        '    gl_FragColor.rgb = alb;',
        '  }'
      ].join('\n');
      const water = [
        '  if (abs(vN1312.y) > 0.55) {',
        '    vec3 viewDir = normalize(vWorldPos1312 - cameraPosition);',
        '    vec3 nrm = normalize(vN1312);',
        '    vec3 rd = reflect(viewDir, nrm);',
        '    float az = atan(rd.x, rd.z);',
        '    float rel = atan(sin(az - uSunAz1312), cos(az - uSunAz1312));',
        '    float uRaw = uSunU1312 + rel / max(0.15, 2.0 * uHalf1312);',
        '    float s = 0.88, uR;',
        '    if (uRaw >= 0.0 && uRaw <= 1.0) uR = clamp(uRaw, 0.001, 0.999);',
        '    else if (uRaw < 0.0) { float p = mod(-uRaw, 2.0 * s); uR = (p <= s) ? max(0.001, p) : min(s, 2.0 * s - p); }',
        '    else { float p = mod(uRaw - 1.0, 2.0 * s); uR = (p <= s) ? (s - p) : (p - s); }',
        '    float vR = 1.0 - clamp(rd.y / 0.78, 0.0, 1.0);',
        '    vec3 plate = texture2D(uSky1312, vec2(clamp(uR, 0.001, 0.999), vR)).rgb;',
        '    float fres = pow(clamp(1.0 + viewDir.y, 0.0, 1.0), 3.0);',
        '    gl_FragColor.rgb = mix(gl_FragColor.rgb, plate, 0.22 + 0.50 * fres);',
        '    float glint = pow(clamp(dot(normalize(rd), normalize(uSunDir1312)), 0.0, 1.0), 48.0);',
        '    gl_FragColor.rgb += vec3(1.0, 0.86, 0.45) * glint * (0.35 + 0.55 * uDusk1312);',
        '  }'
      ].join('\n');
      let frag = 'varying vec3 vWorldPos1312;\nvarying vec3 vN1312;\n'
        + 'uniform sampler2D uSky1312;\nuniform float uSunAz1312, uSunU1312, uHalf1312, uDusk1312, uFogAmt1312, uTexTier1312;\nuniform vec3 uSunDir1312;\n'
        + shader.fragmentShader;
      if (frag.indexOf('#include <fog_fragment>') >= 0) {
        frag = frag.replace('#include <fog_fragment>', fogRep);
      }
      const injectAt = frag.indexOf('#include <dithering_fragment>');
      const extra = albedo + (kind === 'water' ? ('\n' + water) : '');
      if (injectAt >= 0) frag = frag.slice(0, injectAt) + extra + '\n' + frag.slice(injectAt);
      else frag += '\n' + extra;
      shader.fragmentShader = frag;
    };
    const paint = function (m, kind) {
      if (!m || m.userData._ao1312 === 3) return;
      if (m.isMeshBasicMaterial) return;
      m.userData._ao1312 = 3;
      const prev = m.onBeforeCompile;
      m.onBeforeCompile = function (shader) {
        try { if (typeof prev === 'function') prev.call(this, shader); } catch (_) {}
        try { patch(shader, kind || m.userData.kind1312 || (m === (typeof matCache !== 'undefined' && matCache.water) ? 'water' : 'block')); } catch (e) { ERR('shadeP', e); }
      };
      m.customProgramCacheKey = function () { return 'ao1312c' + (kind || ''); };
      m.needsUpdate = true;
    };
    try {
      if (typeof matCache !== 'undefined') {
        for (const k in matCache) if (!skip[k]) paint(matCache[k], k === 'water' ? 'water' : 'block');
      }
      if (typeof BLOCK_MATS !== 'undefined') {
        for (const id in BLOCK_MATS) {
          const m = BLOCK_MATS[id];
          const kind = (typeof T !== 'undefined' && +id === T.WATER) ? 'water' : 'block';
          if (Array.isArray(m)) m.forEach(function (x) { paint(x, kind); });
          else paint(m, kind);
        }
      }
      if (typeof PLANT_MATS !== 'undefined') {
        for (const id in PLANT_MATS) paint(PLANT_MATS[id], 'block');
      }
      U.shade = 3;
    } catch (e) { ERR('shade', e); }
  }

  function hookWater(pal, r) {
    try {
      if (typeof matCache === 'undefined' || !matCache.water || !pal) return;
      const m = matCache.water;
      const ph = pal.ph;
      const k = (r === null) ? Math.max(0.15, ph.dusk) : 0.1;
      // Tint the existing Lambert water toward the sky / plate horizon and add a mild specular glint via shininess if Phong, else emissive-free color.
      if (m.color) {
        const h = (r === null && ph.dusk > 0.2) ? PLATE_HOR : pal.hor;
        m.color.setRGB(0.55 * h[0] + 0.1, 0.45 * h[1] + 0.22, 0.35 * h[2] + 0.40);
      }
      if (m.specular) m.specular.setRGB(1, 0.88, 0.55);
      if (typeof m.shininess === 'number') m.shininess = 32 + 40 * k;
      U.water = 1;
    } catch (e) { ERR('water', e); }
  }

  function tuneTorches() {
    try {
      if (typeof torchLights === 'undefined' || !torchLights || U.torch) return;
      for (let i = 0; i < torchLights.length; i++) {
        const l = torchLights[i];
        if (!l || l.userData.red) continue;
        l.color.setHex(0xffb056);
        l.distance = Math.max(l.distance || 0, 18);
      }
      U.torch = 1;
    } catch (e) { ERR('torch', e); }
  }

  function tickSunHalo(pal, r) {
    try {
      // Hard CircleGeometry halo is retired: it read as a grey ring. The plate
      // shader adds a warm, soft, additive core that blends into the photo glow.
      if (U.sunHalo) U.sunHalo.visible = false;
      try {
        if (r === null && pal && pal.ph && pal.ph.dusk > 0.15) {
          if (typeof glow !== 'undefined' && glow) {
            glow.visible = false;
            if (glow.material) glow.material.opacity = 0;
          }
        }
      } catch (_) {}
    } catch (e) { ERR('halo', e); }
  }

  function hook() {
    if (U.hook) return;
    try {
      if (typeof updateSky !== 'function') return;
      const us = updateSky;
      updateSky = function (dt) {
        const r = us.apply(this, arguments);
        try { apply(); tickPlate(Math.min(0.1, +dt || 0), palette(), realm()); } catch (e) { ERR('tick', e); }
        return r;
      };
      U.hook = 1;
    } catch (e) { ERR('hook', e); }
    try { loadPlate(); } catch (_) {}
    try { hideOldClouds(); } catch (_) {}
  }
  U.boot = hook;
  hook();
  setTimeout(hook, 200);
  setTimeout(hook, 1200);
  setTimeout(hideOldClouds, 400);
})(typeof window !== 'undefined' ? window : this);
