/* GLX-SKY1312 (v1.2.112): time-of-day skies and a literal overworld sunset plate.
   Each realm keeps its own sky. The Highlands sunset is the actual sky from the
   reference photograph (full-resolution seamless webp on a dome — no procedural
   cloud recreation, no raymarch on top). By day the plate desaturates toward the
   existing day sky; at night it fades so the starry night remains. Egypt keeps a
   real desert sky — clear blue fading to a hazy sandy horizon by day, orange and
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
    const duskTop = [0.32, 0.08, 0.28], duskMid = [0.96, 0.32, 0.28], duskHor = [1.00, 0.52, 0.18], duskFog = [0.58, 0.38, 0.52];
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
        t.wrapS = THREE.RepeatWrapping;
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
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      U.plateTex = tex;
      return tex;
    } catch (e) { ERR('load', e); U.plateLoading = 0; return null; }
  }

  const PLATE_VERT = [
    'varying vec3 vDir;',
    'void main(){',
    '  vDir = normalize(position);',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n');

  const PLATE_FRAG = [
    'precision highp float;',
    'uniform sampler2D uSky;',
    'uniform vec3 uZenith, uHor;',
    'uniform float uSunAz, uSunU, uHalf, uDrift, uDay, uNight, uDusk, uAlpha;',
    'varying vec3 vDir;',
    'void main(){',
    '  float elev = vDir.y;',
    '  if (elev < -0.02) { gl_FragColor = vec4(0.0); return; }',
    '  float az = atan(vDir.x, vDir.z);',
    '  float rel = atan(sin(az - uSunAz), cos(az - uSunAz));',
    '  float u = rel / max(0.15, 2.0 * uHalf) + uSunU + uDrift;',
    '  float v = 1.0 - clamp(elev / 0.70, 0.0, 1.0);',
    '  vec3 col = texture2D(uSky, vec2(u, v)).rgb;',
    '  float topF = smoothstep(0.52, 0.80, elev);',
    '  col = mix(col, uZenith, topF);',
    '  float luma = dot(col, vec3(0.30, 0.50, 0.20));',
    '  col = mix(col, vec3(luma), uDay * 0.72);',
    '  col = mix(col, mix(uHor, uZenith, 0.45), uDay * 0.55);',
    '  col *= 1.0 - uNight * 0.88;',
    '  float edge = 1.0 - smoothstep(uHalf * 0.82, uHalf, abs(rel));',
    '  float horF = smoothstep(-0.02, 0.06, elev);',
    '  float a = uAlpha * horF * edge * (1.0 - topF * 0.92);',
    '  a *= (1.0 - uDay * 0.78) * (1.0 - uNight * 0.92);',
    '  a *= 0.35 + 0.65 * uDusk + 0.20 * (1.0 - uDay);',
    '  if (a < 0.01) { gl_FragColor = vec4(0.0); return; }',
    '  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));',
    '}'
  ].join('\n');

  function ensurePlate() {
    if (U.plateMesh && U.plateMesh.parent) return U.plateMesh;
    if (typeof THREE === 'undefined' || typeof scene === 'undefined' || !scene) return null;
    const tex = loadPlate();
    if (!tex) return null;
    try {
      const geo = new THREE.SphereGeometry(126, 48, 24);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uSky: { value: tex },
          uZenith: { value: new THREE.Color(0.32, 0.08, 0.28) },
          uHor: { value: new THREE.Color(1.0, 0.52, 0.18) },
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
      try { if (typeof skyDome !== 'undefined' && skyDome && skyDome.scale) mesh.scale.copy(skyDome.scale); } catch (_) {}
      const ph = pal.ph;
      const sunAz = Math.atan2(ph.sx, 0.33);
      const un = U.plateMat.uniforms;
      un.uSunAz.value = sunAz;
      un.uSunU.value = 0.92;
      un.uHalf.value = 1.05;
      // Show the plate as-is at dusk; only fade/desaturate in true day or night.
      un.uDay.value = ph.day * (1 - ph.dusk);
      un.uNight.value = ph.night * (1 - ph.dusk);
      un.uDusk.value = ph.dusk;
      un.uAlpha.value = 1;
      un.uZenith.value.setRGB(pal.top[0], pal.top[1], pal.top[2]);
      un.uHor.value.setRGB(pal.hor[0], pal.hor[1], pal.hor[2]);
      U.drift = (U.drift || 0) + Math.min(0.1, +dt || 0) * 0.0025;
      un.uDrift.value = U.drift;
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
        if (skyUniforms.hor && skyUniforms.hor.value) skyUniforms.hor.value.setRGB(pal.hor[0], pal.hor[1], pal.hor[2]);
        if (skyUniforms.sunCol && skyUniforms.sunCol.value) skyUniforms.sunCol.value.setRGB(pal.sunCol[0], pal.sunCol[1], pal.sunCol[2]);
        if (skyUniforms.sunK) skyUniforms.sunK.value = pal.sunK;
        if (skyUniforms.dark) skyUniforms.dark.value = cave * 0.85;
        U.shader = 1;
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
    tickPlate(0, pal, r);
    return true;
  }
  U.apply = apply;
  U.tick = function (dt) { try { tickPlate(dt || 0, palette(), realm()); } catch (e) { ERR('tick', e); } };
  U.setQ = function (q) { U.q = q || U.q || 'photo'; return U.q; };

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
