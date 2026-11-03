/* GLX-C282 (v1.0.92): icy snow wall + freezing past the wall.
   - New/reset Highlands worlds (flag w92): the snow of the ice wall is drawn icy blue-white by the normal opaque block shader (no transparency, no extra mesh).
   - Climb high up the wall toward the edge and you start to freeze: a frost overlay, a freezing message and half a heart every 1.6 s, never a one-shot.
     Step back inside and it thaws. */
(function c282() {
  const U = window.__c282 = {err: null, sh: 0, freeze: 0, hits: 0, on: false /* v1.1.18: freezing turned off for now */};
  const C = () => window.__c273;
  const on = () => !!(C() && C().on() && typeof current !== 'undefined' && current && current.w92);
  // ---- flag: set on brand-new worlds, saved with the world ----
  try { const ew = enterWorld; enterWorld = function (save) { const r = ew.apply(this, arguments); try { if (current) current.w92 = save ? !!(save.w92) : 1; } catch (_) {} return r; }; } catch (e) { U.err = 'ew ' + e; }
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (current && current.w92) d.w92 = 1; } catch (_) {} return d; }; } catch (e) { U.err = 'se ' + e; }
  // ---- icy tint in the block shader ----
  const uIce = {value: new THREE.Vector4(0, 0, 0, 0)}, uFut = U.uFut = {value: 0}; /* v1.0.93: uFut = YEAR 24000 solid shiny silver blocks */
  function patch() { const m = window.__TA && __TA.mat; if (!m || m.__c282) return !!(m && m.__c282);
    const vs = m.vertexShader, fs = m.fragmentShader; if (vs.indexOf('void main() {') < 0 || fs.indexOf('#include <tonemapping_fragment>') < 0) return false;
    m.vertexShader = vs.replace('void main() {', 'varying vec3 vIceW;\nvoid main() {\n  vIceW = (modelMatrix * vec4(position, 1.0)).xyz;');
    m.fragmentShader = fs.replace('void main() {', 'uniform vec4 uIce; uniform float uFut; varying vec3 vIceW;\nvoid main() {').replace('#include <tonemapping_fragment>',
      'if (uIce.w > 0.5) { vec2 dI = abs(vIceW.xz - uIce.xy); float qI = pow(dI.x * dI.x * dI.x + dI.y * dI.y * dI.y, 1.0 / 3.0); float kI = smoothstep(uIce.z - 1.0, uIce.z + 1.0, qI);\n' +
      '    if (kI > 0.0) { float lI = dot(gl_FragColor.rgb, vec3(0.333)); vec3 iI = vec3(0.70, 0.86, 1.0) * (0.55 + 0.6 * lI) + vec3(0.0, 0.03, 0.08) * fract(sin(dot(floor(vIceW.xz * 2.0 + vIceW.y), vec2(12.9898, 78.233))) * 43758.5453); gl_FragColor.rgb = mix(gl_FragColor.rgb, iI, 0.62 * kI); } }\n' +
      'if (uFut > 0.0) { float lF = dot(gl_FragColor.rgb, vec3(0.3, 0.5, 0.2)); vec3 fp = fract(vIceW); float edgeF = max(max(step(0.94, fp.x), step(0.94, fp.z)), step(0.94, fp.y)); float bandF = 0.5 + 0.5 * sin(vIceW.y * 0.9 + vIceW.x * 0.35 + vIceW.z * 0.2); vec3 sF = vec3(0.80, 0.83, 0.88) * (0.55 + 0.5 * lF) + vec3(0.32, 0.34, 0.40) * pow(bandF, 6.0) + vec3(0.25, 0.85, 1.0) * edgeF * 0.35; gl_FragColor.rgb = mix(gl_FragColor.rgb, sF, uFut); gl_FragColor.a = 1.0; }\n  #include <tonemapping_fragment>');
    m.uniforms.uIce = uIce; m.uniforms.uFut = uFut; m.__c282 = 1; m.needsUpdate = true; U.sh = 1; return true; }
  // ---- frost overlay ----
  let ov = null; function overlay(k) { if (!ov) { ov = document.createElement('div'); ov.id = 'c282frost';
      ov.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:40;opacity:0;transition:opacity .6s;background:radial-gradient(ellipse at center,rgba(220,240,255,0) 38%,rgba(200,230,255,.55) 75%,rgba(240,250,255,.92) 100%);box-shadow:inset 0 0 120px 40px rgba(210,235,255,.8)';
      document.body.appendChild(ov); } ov.style.opacity = String(k); }
  let cold = 0, hitT = 0, msgT = 0;
  setInterval(() => { try { const ok = false && on();   /* v1.1.40: no ice wall anywhere: no icy edge tint and no edge cold */ if (patch() && ok !== !!uIce.value.w) {} 
      if (ok) { const c = C(); uIce.value.set((W >> 1) + 0.5, (D >> 1) + 0.5, c.RE() - (c.WS || 40), 1); } else uIce.value.w = 0;
      if (!U.on || !ok || !started || dead || paused || DIM.cur || (current && current.mode === 'creative')) { cold = Math.max(0, cold - 0.2); overlay(cold * 0.9); U.freeze = 0; return; }
      const c = C(), q = c.edgeQ(P.x, P.z), lim = c.RE() + 16; const north = __XG && P.z < (D >> 1) && (D >> 1) - P.z >= Math.abs(P.x - (W >> 1)); /* v1.1.17: in the north the cold starts at the far end of the ice extension */
      const out = (north ? P.z < __XZ + 60 || P.x < 3 || P.x > W - 3 : (q > lim || P.x < 3 || P.z < 3 || P.x > W - 3 || P.z > D - 3)) && !(window.__c297 && __c297.inA); /* v1.0.106: never inside the Agartha cave */
      U.freeze = out ? 1 : 0; cold = out ? Math.min(1, cold + 0.1) : Math.max(0, cold - 0.15); overlay(cold * 0.9);
      if (out) { if ((msgT -= 0.2) <= 0) { msgT = 6; try { toast("You're freezing! Head back inside the wall"); } catch (_) {} }
        try { regenT = 0; } catch (_) {} if (cold > 0.3 && (hitT -= 0.2) <= 0) { hitT = 1.6; try { hurt(1, 'freeze'); U.hits++; } catch (_) {} } } else { hitT = 0.6; msgT = 0; } } catch (e) { U.err = String(e && e.message || e); } }, 200);
})();
