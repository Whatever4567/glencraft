
/* ===================== GLX-C34 (v0.9.37): deepslate bricks/tiles (+stairs), flowing portal surface, held models for doors, gates, panes, fences ===================== */
Object.assign(T, {DSBRICK: 228, DSTILE: 229}); Object.assign(NAMES, {228: 'Deepslate bricks', 229: 'Deepslate tiles'});
[[228, 'deepslate_bricks'], [229, 'deepslate_tiles']].forEach(([id, key]) => { FACES[id] = key; ICON_KEY[id] = key; BLOCK_MATS[id] = mat(key); HARD[id] = 4; MC_HARD[id] = 3.5; REQ[id] = 1; NEEDS_PICK.add(id); PLACEABLE.add(id); ORDER.push(id); });
RECIPES.push(rc('4 Deepslate bricks', '4 Deepslate', 228, 4, [[T.DEEPSLATE, 4]], 1), rc('4 Deepslate tiles', '4 Deepslate bricks', 229, 4, [[228, 4]], 1));
if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(228, 229);
(function dsStairs() {   // deepslate brick stairs, same system as the other stairs
  const id = 230, b = 228; STAIRS[id] = [b, 'Deepslate brick stairs']; IS_STAIR[id] = 1; NAMES[id] = STAIRS[id][1]; FACES[id] = FACES[b]; BLOCK_MATS[id] = BLOCK_MATS[b];
  HARD[id] = HARD[b]; MC_HARD[id] = MC_HARD[b]; REQ[id] = REQ[b]; NEEDS_PICK.add(id); PLACEABLE.add(id); ORDER.push(id); ENT[id] = 1; if (typeof chunkST !== 'undefined' && chunkST) chunkST[id] = 1;
  if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(id); RECIPES.push(rc('Deepslate brick stairs', '6 Deepslate bricks', id, 4, [[b, 6]], 1));
  ICON_KEY[id] = 'deepslate_bricks';
})();
// ---- portal: a flowing, glowing surface in world space so a whole portal reads as one swirl ----
var portalUniforms = {uTime: {value: 0}, uMap: {value: tex('portal')}};
(function portalFluid() {
  BLOCK_MATS[T.PORTAL] = new THREE.ShaderMaterial({uniforms: portalUniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: [
      'uniform sampler2D uMap; uniform float uTime; varying vec3 vW;',
      'void main(){',
      '  vec2 p = vec2(vW.x + vW.z, vW.y) * 0.33;',                       // continuous across neighbouring portal blocks
      '  vec2 w = vec2(sin(p.y * 3.1 + uTime * 0.9), cos(p.x * 2.7 - uTime * 0.7)) * 0.06;',
      '  vec3 a = texture2D(uMap, p + w + vec2(uTime * 0.03, uTime * 0.05)).rgb;',
      '  vec3 b = texture2D(uMap, p * 1.7 - w * 1.4 + vec2(-uTime * 0.05, uTime * 0.02)).rgb;',
      '  vec3 c = mix(a, b, 0.45) + max(a, b) * 0.35;',
      '  float pulse = 0.85 + 0.25 * sin(uTime * 2.2 + p.x * 1.3 + p.y);',
      '  gl_FragColor = vec4(c * pulse * 1.15, 0.82);',
      '}'].join('\n')});
  const ul = updateLights; updateLights = function (dt) { ul.apply(this, arguments); portalUniforms.uTime.value = performance.now() / 1000 % 1000; portalUniforms.uMap.value = tex('portal'); };
})();
// ---- held models ----
var HELD_YAW = -1.57;
(function heldModels() {
  const doorTex = () => { if (!heldModels.dm) { heldModels.dm = new THREE.MeshLambertMaterial({map: tex('door'), transparent: true, alphaTest: 0.4}); heldModels.cm = heldModels.dm.clone(); heldModels.cm.color.setHex(0xe0905a); } };
  const box = (g, m, w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  const mi = makeItemMesh;
  makeItemMesh = function (id) {
    const r = held2(id); if (r) { const o = new THREE.Group(); o.add(r); r.scale.setScalar(1.8); o.userData.block = true; return o; } return mi.apply(this, arguments);
  };
  function held2(id) {
    const g = new THREE.Group();
    if (id === T.DOOR || id === IT.COPPERDOOR) { doorTex(); const m = id === T.DOOR ? heldModels.dm : heldModels.cm; const edge = new THREE.MeshLambertMaterial({color: id === T.DOOR ? 0x6a4422 : 0x8a4a28});
      box(g, [edge, edge, edge, edge, m, m], 0.13, 0.26, 0.018, 0, 0.06, 0); g.rotation.set(0.1, HELD_YAW, 0); g.userData.block = true; return g; }
    if (id === 226) { const w = [].concat(BLOCK_MATS[T.PLANKS])[0]; for (const s of [-1, 1]) box(g, w, 0.025, 0.16, 0.025, s * 0.09, 0.06, 0); for (const y of [0.02, 0.11]) box(g, w, 0.16, 0.03, 0.02, 0, y, 0); box(g, w, 0.025, 0.1, 0.02, 0, 0.065, 0); g.rotation.set(0.15, HELD_YAW, 0); g.userData.block = true; return g; }
    if (id === T.FENCE) { const w = [].concat(BLOCK_MATS[T.PLANKS])[0]; for (const s of [-1, 1]) box(g, w, 0.04, 0.17, 0.04, s * 0.06, 0.06, 0); for (const y of [0.03, 0.1]) box(g, w, 0.16, 0.025, 0.02, 0, y, 0); g.rotation.set(0.15, HELD_YAW, 0); g.userData.block = true; return g; }
    if (id === T.RAILING) { const mm = new THREE.MeshPhongMaterial({color: 0x202228, shininess: 60}); for (let i = -2; i <= 2; i++) box(g, mm, 0.012, 0.18, 0.012, i * 0.035, 0.06, 0); for (const y of [-0.02, 0.14]) box(g, mm, 0.17, 0.012, 0.012, 0, y, 0); g.rotation.set(0.15, HELD_YAW, 0); g.userData.block = true; return g; }
    if (id === 227) { const gm = new THREE.MeshPhongMaterial({color: 0xcfe8f4, transparent: true, opacity: 0.4, shininess: 90, side: THREE.DoubleSide}); box(g, gm, 0.16, 0.16, 0.012, 0, 0.06, 0);
      const fr = new THREE.MeshLambertMaterial({color: 0xe8f4fa}); box(g, fr, 0.165, 0.008, 0.014, 0, 0.14, 0); box(g, fr, 0.165, 0.008, 0.014, 0, -0.02, 0); g.rotation.set(0.15, HELD_YAW, 0); g.userData.block = true; return g; }
    return null;
  }
})();
