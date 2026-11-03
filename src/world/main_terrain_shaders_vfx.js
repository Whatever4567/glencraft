/* ===================== GLX-C215 (v1.0.45): main terrain shaders + VFX. Settings > Shaders: Low / High (High by default).
   High: warm golden sun on sunlit faces, richer greens (a gentle saturation grade), blue distance haze, waving leaves / grass / flowers, water fresnel + sun glints,
   a soft sun bloom, an overcast grey-blue tint while it rains, and a light vignette. It never darkens anything below the 30% light floor. Low: the old look, nothing extra. ===================== */
(function c215() {
  const U = window.__c215 = {err: null, on: false, ta: 0, pl: 0, wa: 0, leafL: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e); };
  if (SET.vfx === undefined) { let ph = false; try { ph = !!(touchMode && !(typeof HIGH !== 'undefined' && HIGH)); } catch (_) {} SET.vfx = ph ? 0 : 1; }   // phones start on Low (keeps phone speed), desktops on High
  const HI = U.on = SET.vfx !== 0;
  // ---------- settings row (reloads, like Graphics) ----------
  try { const ref = document.querySelector('#gfxSeg') || document.querySelector('#perfSeg'), row = ref && ref.parentElement && ref.parentElement.closest('.row, .setrow, div');
    if (row) { const r2 = row.cloneNode(true); r2.setAttribute('data-testid', 'vfx-row'); const seg = r2.querySelector('[id$="Seg"]'); seg.id = 'vfxSeg'; const lab = r2.querySelector('label, span, b'); if (lab) lab.textContent = 'Shaders (sun, haze, waving leaves, water)';
      seg.innerHTML = '<button data-v="0" data-testid="vfx-low">Low</button><button data-v="1" data-testid="vfx-high">High</button>'; row.after(r2);
      const sync = () => seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === (SET.vfx ? 1 : 0))); sync();
      seg.querySelectorAll('button').forEach(b => b.addEventListener('click', e => { e.preventDefault(); const v = Number(b.dataset.v); if (v === (SET.vfx ? 1 : 0)) return;
        if (!confirm('Switch shaders to ' + (v ? 'High' : 'Low') + '? The game saves and reloads.')) return; SET.vfx = v; saveSet(); sync();
        try { if (started && typeof saveWorld === 'function') saveWorld(); } catch (_) {} setTimeout(() => location.reload(), 300); })); } } catch (e) { ERR('row', e); }
  if (!HI) return;
  const u = {u5Hi: {value: 1}, u5T: {value: 0}, u5Day: {value: 1}, u5Over: {value: 0}, u5Haze: {value: new THREE.Color(0.62, 0.74, 0.9)}, u5Leaf: {value: new Array(16).fill(-1)}};
  const HZ = new THREE.Color(0.58, 0.72, 0.92), tc = new THREE.Color();
  // ---------- terrain (the one shared array-texture material) ----------
  try { const m = window.__TA && __TA.mat; const V0 = 'varying vec3 vUvL; varying vec3 vDif; varying vec3 vEm;', D5 = V0 + '\nvarying float vSun5; uniform float u5Hi; uniform float u5T; uniform float u5Day; uniform float u5Over; uniform vec3 u5Haze; uniform float u5Leaf[16];';
    if (m && m.vertexShader.includes(V0) && m.fragmentShader.includes(V0) && m.fragmentShader.includes('  #include <fog_fragment>\n}')) {
      Object.assign(m.uniforms, u);
      m.vertexShader = m.vertexShader.replace(V0, D5).replace('  #include <begin_vertex>', `  #include <begin_vertex>
  float lw5 = 0.0; for (int i = 0; i < 16; i++) if (abs(u5Leaf[i] - lay) < 0.5) lw5 = 1.0;
  if (lw5 > 0.5) { vec3 wq = (modelMatrix * vec4(transformed, 1.0)).xyz; transformed.x += sin(u5T * 1.6 + wq.z * 0.55 + wq.y * 0.35) * 0.045; transformed.z += cos(u5T * 1.25 + wq.x * 0.5) * 0.04; transformed.y += sin(u5T * 2.1 + wq.x + wq.z) * 0.015; }`)
        .replace('  vEm = vec3(0.0); for', '  vSun5 = clamp(dot(dir, vec3(0.333)), 0.0, 1.2);\n  vEm = vec3(0.0); for');
      m.fragmentShader = m.fragmentShader.replace(V0, D5 + (m.fragmentShader.includes('uniform float uLMin') ? '' : ' uniform float uLMin;')).replace('  #include <fog_fragment>\n}', `  vec3 c5 = gl_FragColor.rgb;
  c5 *= mix(vec3(1.0), vec3(1.1, 1.0, 0.84), clamp(vSun5, 0.0, 1.0) * u5Day * (1.0 - u5Over));
  float l5 = dot(c5, vec3(0.299, 0.587, 0.114)); c5 = mix(vec3(l5), c5, 1.16 - 0.4 * u5Over);
  c5 = mix(c5, c5 * vec3(0.93, 0.97, 1.05), u5Over * 0.6);
  gl_FragColor.rgb = max(c5, t.rgb * uLMin);
  #include <fog_fragment>
  #ifdef USE_FOG
  gl_FragColor.rgb = mix(gl_FragColor.rgb, u5Haze, smoothstep(fogNear * 0.35, fogFar, fogDepth) * 0.3);
  #endif
}`);
      m.needsUpdate = true; U.ta = 1; } else U.ta = -1; } catch (e) { ERR('ta', e); }
  function leafLayers() { try { const ids = [T.LEAVES, T.BLOSSOM, 147, 148, 149, 215], L = []; for (const id of ids) { const l = __TA.layers(id); if (l) for (const x of l) if (L.indexOf(x) < 0 && L.length < 16) L.push(x); }
      for (let i = 0; i < 16; i++) u.u5Leaf.value[i] = i < L.length ? L[i] : -1; U.leafL = L.length; } catch (e) { ERR('leaf', e); } }
  // ---------- plants: grass, flowers, ferns sway (top of the quad moves, the base stays put) ----------
  const waved = new Set();
  function wavePlant(m) { if (!m || waved.has(m) || !m.isMeshLambertMaterial) return; waved.add(m); const ob = m.onBeforeCompile;
    m.onBeforeCompile = function (sh, r) { if (ob) ob.call(this, sh, r); sh.uniforms.u5T = u.u5T;
      sh.vertexShader = 'uniform float u5T;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
 { vec3 wq = (modelMatrix * vec4(transformed, 1.0)).xyz; float k5 = clamp(uv.y, 0.0, 1.0);
   transformed.x += sin(u5T * 2.2 + wq.x * 0.7 + wq.z * 0.4) * 0.07 * k5; transformed.z += cos(u5T * 1.8 + wq.z * 0.6) * 0.05 * k5; }`); };
    const ck = m.customProgramCacheKey; m.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + 'c215p'; }; m.needsUpdate = true; U.pl++; }
  function plants() { try { for (const k in PLANT_MATS) { const id = +k; if (id === T.COBWEB || id === T.FIRE) continue; wavePlant(PLANT_MATS[k]); } } catch (e) { ERR('pl', e); } }
  // ---------- water: fresnel sky reflection + glints of sun ----------
  try { const ob = waterMat.onBeforeCompile; waterMat.onBeforeCompile = function (sh, r) { if (ob) ob.call(this, sh, r); Object.assign(sh.uniforms, {u5Day: u.u5Day, u5Haze: u.u5Haze});
      if (sh.fragmentShader.includes('varying vec3 vWp;') && sh.fragmentShader.includes('#include <dithering_fragment>')) {
        sh.fragmentShader = 'uniform float u5Day; uniform vec3 u5Haze;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', `{ vec3 V5 = normalize(vViewPosition); float fr5 = pow(1.0 - clamp(abs(dot(V5, normalize(normal))), 0.0, 1.0), 4.0);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, u5Haze * 1.05, fr5 * 0.45);
  float g5 = pow(max(0.0, sin(vWp.x * 3.1 + uTime * 2.3) * sin(vWp.z * 2.7 - uTime * 1.9)), 28.0) + pow(max(0.0, sin(vWp.x * 5.3 - uTime * 3.1) * sin(vWp.z * 4.9 + uTime * 2.6)), 40.0);
  gl_FragColor.rgb += vec3(1.0, 0.94, 0.78) * g5 * 0.55 * u5Day; }
#include <dithering_fragment>`); U.wa = 1; } };
    const ck = waterMat.customProgramCacheKey; waterMat.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + 'c215'; }; waterMat.needsUpdate = true; } catch (e) { ERR('wa', e); }
  // ---------- sun bloom: a soft additive glow round the sun disc ----------
  let glow = null; try { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 2, 64, 64, 63);
    gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.18, 'rgba(255,214,140,0.55)'); gr.addColorStop(0.5, 'rgba(255,190,110,0.14)'); gr.addColorStop(1, 'rgba(255,180,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0}));
    glow.frustumCulled = false; glow.renderOrder = -1; scene.add(glow); } catch (e) { ERR('glow', e); }
  // ---------- vignette (CSS, costs nothing on the GPU) ----------
  let vig = null; try { vig = document.createElement('div'); vig.id = 'vig215'; vig.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;background:radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(10,14,30,0.32) 100%);transition:opacity 1s;opacity:0';
    document.body.appendChild(vig); } catch (e) { ERR('vig', e); }
  // ---------- per frame ----------
  let tl = 0, k2 = 0;
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments);
    try { u.u5T.value = (u.u5T.value + (dt || 0)) % 6283;
      const hell = !!DIM.cur, rain = !hell && !!(window.__rainWx && __rainWx()), over = rain ? Math.min(1, (weather.dark || 0) * 1.6 + 0.3) : 0;
      u.u5Over.value += (over - u.u5Over.value) * Math.min(1, (dt || 0) * 0.5);
      const day = hell ? 0 : Math.max(0, Math.min(1, daylight)); u.u5Day.value = day * (1 - u.u5Over.value * 0.7);
      tc.copy(scene.fog ? scene.fog.color : HZ); u.u5Haze.value.copy(tc).lerp(HZ, hell ? 0 : 0.45 * day * (1 - u.u5Over.value * 0.6));
      if (glow && sunDisc) { glow.position.copy(sunDisc.position); glow.quaternion.copy(camera.quaternion); const s = 34; glow.scale.set(s, s, 1);
        glow.material.opacity = sunDisc.visible && !hell && !(typeof caveK === 'number' && caveK > 0.7) ? 0.75 * day * (1 - u.u5Over.value) : 0; glow.visible = glow.material.opacity > 0.01; }
      if (vig) { const o = started && !hell ? (0.7 + 0.3 * u.u5Over.value) : 0; if (Math.abs(o - (+vig.style.opacity || 0)) > 0.04) vig.style.opacity = o.toFixed(2); }
      if ((tl -= (dt || 0)) <= 0) { tl = 3; if (k2++ < 40) { leafLayers(); plants(); } }
    } catch (e) { ERR('tick', e); }
    return r; };
})();
