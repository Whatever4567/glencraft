/* GLX-C265 (v1.0.76): flowing water and lava. Water: two scrolling three.js water normal maps (MIT) that follow the river flow,
   foam on the crests and a sky fresnel reflection. Lava: ambientCG Lava004 (CC0) crust scrolling in two layers with a slow emissive pulse.
   Two texture reads per pixel, so it stays light on phones. */
(() => {
  const U = window.__c265 = {err: null, w: 0, l: 0};
  try {
    const L = new THREE.TextureLoader(), u = {uWN: {value: null}, uWNon: {value: 0}, uLv: {value: null}, uLon: {value: 0}, uLT: {value: 0}};
    const ld = (src, k, on) => L.load(src, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; u[k].value = t; u[on].value = 1; });
    u.uWN.value = ld('assets/flow/water_n.jpg', 'uWN', 'uWNon'); u.uLv.value = ld('assets/flow/lava_c.jpg', 'uLv', 'uLon');
    // water
    const ob = waterMat.onBeforeCompile; waterMat.onBeforeCompile = function (sh, r) { if (ob) ob.call(this, sh, r); sh.uniforms.uWN = u.uWN; sh.uniforms.uWNon = u.uWNon; sh.uniforms.uLT = u.uLT;
      sh.fragmentShader = 'uniform sampler2D uWN;\nuniform float uWNon;\nuniform float uLT;\n' + sh.fragmentShader
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      vec2 c265f = vFl.z > 0.01 ? normalize(vFl.xy + 1e-4) * (0.35 + vFl.z) : vec2(0.05, 0.035);
      vec3 c265a = texture2D(uWN, vWp.xz * 0.13 - c265f * uLT * 0.22).rgb * 2.0 - 1.0;
      vec3 c265b = texture2D(uWN, vWp.zx * 0.083 + vec2(uLT * 0.011, -uLT * 0.017) - c265f * uLT * 0.11).rgb * 2.0 - 1.0;
      vec2 c265n = (c265a.xy + c265b.xy) * 0.5 * uWNon;
      normal = normalize(normal + vec3(c265n.x, 0.0, c265n.y) * 0.55);
      float c265fo = smoothstep(0.42, 0.75, length(c265n)) * (0.35 + min(vFl.z, 1.0) * 0.65) * uWNon;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.96, 1.0), c265fo * 0.55);`)
        .replace('#include <envmap_fragment>', `#include <envmap_fragment>
      { float fr = pow(1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0), 3.0); outgoingLight += vec3(0.5, 0.66, 0.82) * fr * 0.35 * uWNon; }`);
      U.w = 1; };
    const ck = waterMat.customProgramCacheKey; waterMat.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + 'c265'; }; waterMat.needsUpdate = true;
    // lava
    const lm = mat('lava'); const lb = lm.onBeforeCompile;
    lm.onBeforeCompile = function (sh, r) { if (lb) lb.call(this, sh, r); sh.uniforms.uLv = u.uLv; sh.uniforms.uLon = u.uLon; sh.uniforms.uLT = u.uLT;
      sh.fragmentShader = 'uniform sampler2D uLv;\nuniform float uLon;\nuniform float uLT;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      { vec2 lu = vUv * 0.5; vec3 c1 = texture2D(uLv, lu + vec2(uLT * 0.031, uLT * 0.047)).rgb; vec3 c2 = texture2D(uLv, lu * 1.7 + vec2(-uLT * 0.019, uLT * 0.029)).rgb;
        vec3 lv = max(c1, c2 * 0.85) * 1.35 + vec3(0.12, 0.03, 0.0); float pul = 1.0 + 0.2 * sin(uLT * 2.1) + 0.08 * sin(uLT * 5.3 + lu.x * 9.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, lv, 0.72 * uLon) * mix(1.0, pul, uLon); }`); U.l = 1; };
    const lk = lm.customProgramCacheKey; lm.customProgramCacheKey = function () { return (lk ? lk.call(this) : '') + 'c265'; }; lm.needsUpdate = true;
    const t0 = performance.now(); const tick = () => { u.uLT.value = (performance.now() - t0) / 1000; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    U.u = u;
  } catch (e) { U.err = String(e && e.message || e); }
})();
