/* GLX-C374 (v1.1.75, items 53 and 54): red hot rock, tall flames and blocks of their own for the deep layers.
   Four new blocks, using the slots of the four tools that were taken out long ago (wooden shovel and the three hoes):
   Red hot rock (glows, found on lava floors, in the magma layer and the core), Flowstone (limestone caves), Glowcap (the glowing caps of the
   giant lush cave mushrooms) and Echo slate (spikes in the deep dark). All of them can be mined, drop themselves, show in the bag and the
   creative menu, can be placed and are saved like any block. Tall animated flames rise from red hot rock and magma near you underground. */
(function c374() {
  const U = window.__c374 = {err: null, made: 0, flames: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent), S = PH ? 256 : 512;
  const rng = s => () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  function grain(g, base, r, n, a) { g.fillStyle = base; g.fillRect(0, 0, S, S); for (let i = 0; i < n; i++) { const w = 1 + r() * S / 40; g.fillStyle = 'rgba(' + (r() < 0.5 ? '0,0,0' : '255,255,255') + ',' + (r() * a) + ')'; g.fillRect(r() * S, r() * S, w, w); } }
  const DEFS = [
    [46, 'red_hot_rock', 'Red hot rock', 2.4, 1, 1, g => { const r = rng(46); grain(g, '#2a0d06', r, 5000, 0.25); g.lineCap = 'round';
      for (let i = 0; i < 26; i++) { let x = r() * S, y = r() * S; g.strokeStyle = r() < 0.5 ? '#ff6a10' : '#ffb028'; g.lineWidth = S / 90 + r() * S / 60; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * S / 5; y += (r() - 0.5) * S / 5; g.lineTo(x, y); } g.stroke(); }
      for (let i = 0; i < 14; i++) { const x = r() * S, y = r() * S, R = S * (0.03 + r() * 0.05), q = g.createRadialGradient(x, y, 0, x, y, R); q.addColorStop(0, 'rgba(255,230,140,.95)'); q.addColorStop(1, 'rgba(255,80,0,0)'); g.fillStyle = q; g.fillRect(x - R, y - R, 2 * R, 2 * R); } }],
    [47, 'flowstone', 'Flowstone', 1.4, 1, 0, g => { const r = rng(47); grain(g, '#d8cbb0', r, 6000, 0.12); for (let y = 0; y < S; y += S / 20) { g.fillStyle = 'rgba(150,115,70,' + (0.12 + r() * 0.2) + ')'; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= S; x += S / 16) g.lineTo(x, y + Math.sin(x * 0.05 + y) * S / 50 + r() * S / 80); g.lineTo(S, y + S / 40); g.lineTo(0, y + S / 40); g.fill(); } }],
    [100, 'glowcap', 'Glowcap', 0.8, 0, 1, g => { const r = rng(100); grain(g, '#1f8f86', r, 4000, 0.2); for (let i = 0; i < 40; i++) { const x = r() * S, y = r() * S, R = S * (0.02 + r() * 0.05), q = g.createRadialGradient(x, y, 0, x, y, R); q.addColorStop(0, 'rgba(200,255,240,.95)'); q.addColorStop(1, 'rgba(60,220,200,0)'); g.fillStyle = q; g.beginPath(); g.arc(x, y, R, 0, 6.283); g.fill(); } }],
    [128, 'echo_slate', 'Echo slate', 2.2, 1, 0, g => { const r = rng(128); grain(g, '#1c2028', r, 7000, 0.2); g.strokeStyle = 'rgba(40,210,230,.7)'; g.lineWidth = S / 160; for (let i = 0; i < 9; i++) { g.beginPath(); let x = r() * S, y = r() * S; g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (r() - 0.5) * S / 6; y += (r() - 0.5) * S / 6; g.lineTo(x, y); } g.stroke(); } }]];
  const IDS = U.IDS = new Set();
  for (const [id, key, name, hard, req, glow, paint] of DEFS) { try {
      try { delete TOOL[id]; TOOLS.delete(id); HOES.delete(id); delete TOOL_MATX[id]; } catch (_) {} try { if (typeof ICONS !== 'undefined') delete ICONS[id]; } catch (_) {}
      for (const k in IT) if (IT[k] === id) delete IT[k];
      const c = document.createElement('canvas'); c.width = c.height = S; paint(c.getContext('2d')); TEX[key] = c.toDataURL('image/png'); try { delete texCache[key]; delete matCache[key]; } catch (_) {}
      FACES[id] = key; NAMES[id] = name; ICON_KEY[id] = key; HARD[id] = hard; MC_HARD[id] = hard; REQ[id] = req; const m = mat(key);
      BLOCK_MATS[id] = glow ? new THREE.MeshBasicMaterial({map: [].concat(m)[0].map}) : m;
      try { if (req) NEEDS_PICK.add(id); PLACEABLE.add(id); } catch (_) {} for (const L of [ORDER, typeof CREATIVE_ALL !== 'undefined' ? CREATIVE_ALL : []]) if (!L.includes(id)) L.push(id);
      IDS.add(id); U.made++; } catch (e) { ERR(key, e); } }
  Object.assign(T, {REDHOT: 46, FLOWSTONE: 47, GLOWCAP: 100, ECHOSLATE: 128});
  const K = window.__c373 || (window.__c373 = {}); K.RED = 46; K.FLOW = 47; K.CAP = 100; K.ECHO = 128;
  try { const df = dropsFor; dropsFor = function (b) { if (IDS.has(b)) return [[b, 1]]; return df.apply(this, arguments); }; } catch (e) { ERR('drop', e); }
  try { const ai = addItem; addItem = function (id) { return ai.apply(this, arguments); }; } catch (_) {}
  // ---------- tall animated flames ----------
  const VS = 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  const FS = 'uniform float uT; uniform float uS; varying vec2 vU; float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\n' +
    'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }\n' +
    'void main(){ vec2 p = vU; float t = uT * 1.6 + uS * 7.0; float k = n(vec2(p.x * 5.0, p.y * 3.0 - t * 2.2)) * 0.6 + n(vec2(p.x * 11.0, p.y * 7.0 - t * 3.7)) * 0.4;\n' +
    ' float w = (0.42 - abs(p.x - 0.5) * (0.9 + p.y * 1.2)) * 2.4; float f = clamp(w + (k - 0.5) * 0.9 - p.y * 0.85, 0.0, 1.0); f = smoothstep(0.05, 0.6, f);\n' +
    ' vec3 c = mix(vec3(1.0, 0.25, 0.02), vec3(1.0, 0.85, 0.35), clamp(f * 1.4 - p.y * 0.4, 0.0, 1.0)); gl_FragColor = vec4(c * f * 1.4, f); }';
  let M0 = null, G0 = null; const FL = [], MAX = PH ? 22 : 40;
  const h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function mk() { M0 = new THREE.ShaderMaterial({uniforms: {uT: {value: 0}, uS: {value: 0}}, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide});
    const a = new THREE.PlaneGeometry(1.3, 1, 1, 1); a.translate(0, 0.5, 0); const b = a.clone(); b.rotateY(Math.PI / 2); G0 = [a, b]; }
  function flame(x, y, z, hgt) { const g = new THREE.Group(), m = M0.clone(); m.uniforms.uS.value = h3(x, y, z); for (const geo of G0) g.add(new THREE.Mesh(geo, m)); g.position.set(x + 0.5, y, z + 0.5); g.scale.set(1, hgt, 1); g.userData.m = m; g.userData.k = x + ',' + y + ',' + z; scene.add(g); FL.push(g); }
  let busy = false, lastK = '';
  function scan() { if (busy || typeof started === 'undefined' || !started || (typeof DIM !== 'undefined' && DIM.cur)) return; busy = true; try {
      const px = Math.floor(P.x), py = Math.floor(P.y), pz = Math.floor(P.z), key = (px >> 2) + ',' + (py >> 2) + ',' + (pz >> 2); if (key === lastK) return; lastK = key;
      for (const g of FL) { scene.remove(g); g.userData.m.dispose(); } FL.length = 0; if (py > SEA - 20) { U.flames = 0; return; } if (!M0) mk();
      const R = PH ? 12 : 16, hot = new Set([46, T.MAGMA, T.LAVA].filter(Boolean));
      for (let dx = -R; dx <= R && FL.length < MAX; dx++) for (let dz = -R; dz <= R && FL.length < MAX; dz++) { const x = px + dx, z = pz + dz; if (h3(x, 7, z) > 0.1) continue;
        for (let y = py + 6; y >= py - 8; y--) { const b = getB(x, y, z); if (!b) continue; if (hot.has(b) && !(b === T.LAVA && h3(x, 9, z) > 0.03) && !getB(x, y + 1, z)) flame(x, y + 1, z, 2 + h3(x, y, z) * (b === T.LAVA ? 3 : 5)); break; } }
      U.flames = FL.length; } catch (e) { ERR('scan', e); } finally { busy = false; } }
  setInterval(scan, 900);
  try { const rr = renderer.render.bind(renderer); renderer.render = function (s, c) { if (FL.length) { const tt = performance.now() / 1000; for (const g of FL) g.userData.m.uniforms.uT.value = tt; } return rr(s, c); }; } catch (e) { ERR('rr', e); }
})();
