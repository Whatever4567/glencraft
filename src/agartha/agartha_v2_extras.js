/* GLX-C298 (v1.0.106): Agartha v2 extras.
   - Glow grass (block 218) and glow plants (219): soft blue light of their own, deep in the Agartha tunnel and in the cavern. Those two ids were the
     brooch and quaich items, which moved to 325 and 326 (old saves are remapped on load, see C297).
   - The Agartha sky: one dome mesh under the cavern roof with a blue gradient, drifting clouds and patches of rock, drawn only while you are inside. */
(function c298() {
  const U = window.__c298 = {err: null, sky: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const cv = () => { const c = document.createElement('canvas'); c.width = c.height = 64; return [c, c.getContext('2d')]; };
  let sd = 298; const r = () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296;
  try { const G = 218, [c, g] = cv(); g.fillStyle = '#1d5a4a'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(40,140,110,.7)' : 'rgba(20,70,60,.6)'; g.fillRect(r() * 64 | 0, r() * 64 | 0, 1 + (r() * 2 | 0), 1 + (r() * 3 | 0)); }
    for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.6 ? '#6fe8ff' : '#b8f6ff'; g.fillRect(r() * 64 | 0, r() * 64 | 0, 2, 2); }
    TEX.glowgrass = c.toDataURL('image/png'); FACES[G] = 'glowgrass'; NAMES[G] = 'Glow grass'; ICON_KEY[G] = 'glowgrass'; HARD[G] = 0.6; MC_HARD[G] = 0.6; REQ[G] = 0;
    PLACEABLE.add(G); if (!ORDER.includes(G)) ORDER.push(G); if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(G)) CREATIVE_ALL.push(G);
    BLOCK_MATS[G] = mat('glowgrass'); [].concat(BLOCK_MATS[G]).forEach(m => { if (m) { m.emissive = new THREE.Color(0x2bb6e8); m.emissiveIntensity = 0.55; m.needsUpdate = true; } }); T.GLOWGRASS = G; try { delete ICONS[G]; } catch (_) {} } catch (e) { ERR('grass', e); }
  try { const Pp = 219, [c, g] = cv(); g.clearRect(0, 0, 64, 64);
    for (let k = 0; k < 7; k++) { const x0 = 8 + k * 8 + (r() - 0.5) * 4, h = 30 + r() * 30; g.strokeStyle = k % 2 ? '#5fe0ff' : '#9af2ff'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, 64); g.quadraticCurveTo(x0 + (r() - 0.5) * 18, 64 - h * 0.6, x0 + (r() - 0.5) * 14, 64 - h); g.stroke();
      g.fillStyle = '#d8fbff'; g.beginPath(); g.arc(x0 + (r() - 0.5) * 10, 64 - h, 3, 0, 6.283); g.fill(); }
    TEX.glowplant = c.toDataURL('image/png'); NAMES[Pp] = 'Glow plant'; PLANT[Pp] = 1; ICON_KEY[Pp] = 'glowplant'; HARD[Pp] = 0.05; MC_HARD[Pp] = 0; PLACEABLE.add(Pp);
    const t = tex('glowplant'); PLANT_MATS[Pp] = new THREE.MeshLambertMaterial({map: t, emissiveMap: t, emissive: new THREE.Color(0x66d8ff), emissiveIntensity: 0.9, alphaTest: 0.45, side: THREE.DoubleSide});
    try { PLANT_H[Pp] = 0.8; PLANT_W[Pp] = 0.9; } catch (_) {} if (!ORDER.includes(Pp)) ORDER.push(Pp); if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(Pp)) CREATIVE_ALL.push(Pp);
    T.GLOWPLANT = Pp; try { delete ICONS[Pp]; } catch (_) {} } catch (e) { ERR('plant', e); }
  // ---- the sky dome ----
  let dome = null, built = null; const uT = {value: 0};
  function make(l) { const [X, Z, R] = l.city, HT = l.TOP - l.FL;
    const m = new THREE.ShaderMaterial({uniforms: {uT}, side: THREE.BackSide, depthWrite: true, fog: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uT; varying vec3 vP;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fb(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * n(p); p *= 2.03; a *= 0.5; } return v; }
void main(){ vec3 d = normalize(vP); float y = clamp(d.y, 0.0, 1.0);
  vec3 sky = mix(vec3(0.66, 0.84, 1.0), vec3(0.24, 0.52, 0.96), pow(y, 0.7));
  vec2 q = d.xz / (y + 0.35) * 2.2; float c = smoothstep(0.52, 0.78, fb(q + vec2(uT * 0.018, uT * 0.007)));
  vec3 col = mix(sky, vec3(1.0, 0.98, 0.94), c * 0.9);
  float rock = smoothstep(0.50, 0.62, fb(d.xz * 3.1 + 7.0)) * smoothstep(0.92, 0.55, y) + smoothstep(0.22, 0.0, y);
  vec3 rk = vec3(0.42, 0.38, 0.33) * (0.75 + 0.5 * n(d.xz * 40.0));
  gl_FragColor = vec4(mix(col, rk, clamp(rock, 0.0, 1.0)), 1.0); }`});
    dome = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 16, 0, 6.2832, 0, Math.PI / 2), m); dome.scale.set(R - 1.2, HT - 0.8, R - 1.2); dome.position.set(X + 0.5, l.FL, Z + 0.5);
    dome.frustumCulled = false; dome.renderOrder = -1; dome.visible = false; dome.name = "agsun"; scene.add(dome); built = l; U.sky = 1; }
  (function loop(t) { requestAnimationFrame(loop); try { const l = window.__c294 && __c294.L; if (!l || l.v !== 2 || !started || (DIM.cur && DIM.cur !== 'agartha')) { if (dome) dome.visible = false; return; }
      if (built !== l) { if (dome) { scene.remove(dome); dome.geometry.dispose(); } make(l); }
      const [X, Z, R] = l.city; dome.visible = false;   /* v1.1.94: no Agartha sky */ uT.value = (t || 0) / 1000; } catch (e) { ERR('loop', e); } })();
})();
