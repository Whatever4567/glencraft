/* ===================== GLX-C119 (v0.9.99): Baseball Bat, Weak Blade, Fine Blade, real silver sword, the Bomb (replaces the claymore), the Lighter (replaces flint and steel) ===================== */
(function () {
  const U = window.__c119 = {err: null, cur: 0, bombs: [], lighters: new Set(), flameT: 0, booms: 0, lastBoom: null, icons: 0};
  const warn = (k, e) => { if (!U.err) U.err = k + ': ' + String(e && e.stack || e).slice(0, 300); };
  const cv = (s, fn) => { const c = document.createElement('canvas'); c.width = c.height = s; fn(c.getContext('2d'), s); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const rng = s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const BAT = IT.WSWORD, WEAK = IT.SSWORD, FINE = IT.ISWORD, SIL = IT.SILVERSWORD, BOMB = IT.CLAYMORE, LIGHT = IT.FLINTSTEEL;
  IT.BOMB = BOMB; IT.LIGHTER = LIGHT;
  // ---------------- names, recipes, stats ----------------
  NAMES[BAT] = 'Baseball Bat'; NAMES[WEAK] = 'Weak Blade'; NAMES[FINE] = 'Fine Blade'; NAMES[BOMB] = 'Bomb'; NAMES[LIGHT] = 'Lighter';
  for (const r of RECIPES) {
    if (r.out === BAT) r.name = 'Baseball Bat'; else if (r.out === WEAK) r.name = 'Weak Blade'; else if (r.out === FINE) r.name = 'Fine Blade'; else if (r.out === LIGHT) r.name = 'Lighter';
    else if (r.out === BOMB) { r.name = 'Bomb'; r.need = [[IT.IRONINGOT, 1], [IT.COAL, 2], [IT.STRING || 400, 1]]; r.hint = '1 Iron ingot + 2 Coal + 1 String'; r.n = 1; }
  }
  delete TOOL[BOMB]; try { TOOLS.delete(BOMB); } catch (_) {}
  const ts = toast; toast = function (m) { if (typeof m === 'string') m = m.replace(/flint and steel/g, 'lighter').replace(/Flint and steel/g, 'Lighter').replace(/flint & steel/gi, 'lighter'); return ts.call(this, m); };

  // ---------------- textures + materials ----------------
  let TX = null; const tx = () => TX || (TX = {
    ash: cv(256, (g, s) => { g.fillStyle = '#d9b47c'; g.fillRect(0, 0, s, s); const R = rng(71);
      for (let i = 0; i < 120; i++) { const x = R() * s, v = R(); g.strokeStyle = v < .5 ? 'rgba(150,100,50,.35)' : 'rgba(245,215,165,.35)'; g.lineWidth = 1 + R() * 2.5; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, s * .3, x - 6, s * .7, x + 3, s); g.stroke(); }
      for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(120,70,30,.35)'; g.beginPath(); g.ellipse(R() * s, R() * s, 2, 7, 0, 0, 7); g.fill(); } }),
    tape: cv(128, (g, s) => { g.fillStyle = '#1d1f26'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 16) { g.fillStyle = '#2c303a'; g.fillRect(0, y, s, 3); g.fillStyle = '#121318'; g.fillRect(0, y + 13, s, 3); }
      const R = rng(5); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${60 + R() * 40 | 0},${60 + R() * 40 | 0},${70 + R() * 40 | 0},.4)`; g.fillRect(R() * s, R() * s, 2, 1); } }),
    rock: cv(256, (g, s) => { g.fillStyle = '#8a8680'; g.fillRect(0, 0, s, s); const R = rng(33);
      for (let i = 0; i < 2200; i++) { const v = 95 + R() * 110 | 0; g.fillStyle = `rgba(${v},${v - 4},${v - 9},.6)`; g.fillRect(R() * s, R() * s, 1 + R() * 6, 1 + R() * 6); }
      for (let i = 0; i < 26; i++) { g.strokeStyle = 'rgba(40,38,35,.55)'; g.lineWidth = 1; g.beginPath(); let x = R() * s, y = R() * s; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - .5) * 30; y += (R() - .5) * 30; g.lineTo(x, y); } g.stroke(); } }),
    hide: cv(128, (g, s) => { g.fillStyle = '#6a4626'; g.fillRect(0, 0, s, s); const R = rng(9); for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${70 + R() * 70 | 0},${40 + R() * 40 | 0},${20 + R() * 20 | 0},.5)`; g.fillRect(R() * s, R() * s, 1 + R() * 3, 1 + R() * 2); }
      for (let y = 0; y < s; y += 21) { g.fillStyle = 'rgba(30,18,8,.6)'; g.fillRect(0, y + (y % 2) * 3, s, 3); } }),
    leather: cv(128, (g, s) => { g.fillStyle = '#3b2415'; g.fillRect(0, 0, s, s); const R = rng(13); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${90 + R() * 40 | 0},${55 + R() * 25 | 0},30,.5)`; g.fillRect(R() * s, R() * s, 2, 2); } }),
    steel: cv(256, (g, s) => { g.fillStyle = '#d4d8de'; g.fillRect(0, 0, s, s); const R = rng(17); for (let i = 0; i < 1500; i++) { const v = 190 + R() * 65 | 0; g.fillStyle = `rgb(${v},${v},${Math.min(255, v + 6)})`; g.fillRect(R() * s, R() * s, 1, 20 + R() * 80); } }),
    silver: cv(256, (g, s) => { const gr = g.createLinearGradient(0, 0, s, 0); gr.addColorStop(0, '#e9eef5'); gr.addColorStop(.45, '#ffffff'); gr.addColorStop(.55, '#f3f7fc'); gr.addColorStop(1, '#dfe6ef'); g.fillStyle = gr; g.fillRect(0, 0, s, s);
      const R = rng(19); for (let i = 0; i < 900; i++) { const v = 225 + R() * 30 | 0; g.fillStyle = `rgba(${v - 6},${v},255,.5)`; g.fillRect(R() * s, R() * s, 1, 30 + R() * 90); } }),
    iron: cv(128, (g, s) => { g.fillStyle = '#25272c'; g.fillRect(0, 0, s, s); const R = rng(23); for (let i = 0; i < 600; i++) { const v = 25 + R() * 40 | 0; g.fillStyle = `rgba(${v},${v},${v + 5},.7)`; g.fillRect(R() * s, R() * s, 2 + R() * 3, 2 + R() * 3); } }),
    rope: cv(64, (g, s) => { g.fillStyle = '#c9b48a'; g.fillRect(0, 0, s, s); for (let x = -s; x < s * 2; x += 8) { g.strokeStyle = '#8a7650'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + s, s); g.stroke(); } }),
    knurl: cv(64, (g, s) => { g.fillStyle = '#9a9ea6'; g.fillRect(0, 0, s, s); g.strokeStyle = '#4a4e56'; g.lineWidth = 1.5; for (let x = -s; x < s * 2; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + s, s); g.stroke(); g.beginPath(); g.moveTo(x, s); g.lineTo(x + s, 0); g.stroke(); } }),
    vent: cv(64, (g, s) => { g.fillStyle = '#d8dce2'; g.fillRect(0, 0, s, s); g.fillStyle = '#1a1c20'; for (let y = 6; y < s; y += 13) for (let x = 6 + ((y / 13 | 0) % 2) * 6; x < s; x += 13) { g.beginPath(); g.arc(x, y, 3.6, 0, 7); g.fill(); } })});
  let MM = null; const mats = () => MM || (MM = (() => { const T2 = tx(); return {
    ash: new THREE.MeshPhongMaterial({map: T2.ash, shininess: 40, specular: 0x5a4a38}),
    tape: new THREE.MeshPhongMaterial({map: T2.tape, shininess: 18, specular: 0x222222}),
    rock: new THREE.MeshPhongMaterial({map: T2.rock, shininess: 6, specular: 0x202020}),
    rockE: new THREE.MeshPhongMaterial({map: T2.rock, color: 0xd8d4ce, shininess: 14, specular: 0x444444}),
    hide: new THREE.MeshPhongMaterial({map: T2.hide, shininess: 8}),
    stick: new THREE.MeshPhongMaterial({map: T2.ash, color: 0x9a7048, shininess: 10}),
    twine: new THREE.MeshPhongMaterial({map: T2.rope, shininess: 6}),
    steel: new THREE.MeshPhongMaterial({map: T2.steel, color: 0xe4e8ee, shininess: 180, specular: 0xffffff}),
    steelD: new THREE.MeshPhongMaterial({map: T2.steel, color: 0x8a919c, shininess: 120, specular: 0xbbbbbb}),
    edge: new THREE.MeshPhongMaterial({color: 0xffffff, emissive: 0x3c4450, shininess: 260, specular: 0xffffff}),
    brass: new THREE.MeshPhongMaterial({color: 0x8a6a3a, shininess: 90, specular: 0xe0c080}),
    leather: new THREE.MeshPhongMaterial({map: T2.leather, shininess: 14}),
    silver: new THREE.MeshPhongMaterial({map: T2.silver, color: 0xffffff, emissive: 0x2a3240, shininess: 300, specular: 0xffffff}),
    silverD: new THREE.MeshPhongMaterial({map: T2.silver, color: 0xb6c2d2, emissive: 0x141a24, shininess: 220, specular: 0xffffff}),
    silverE: new THREE.MeshPhongMaterial({color: 0xffffff, emissive: 0x6a7686, shininess: 320, specular: 0xffffff}),
    gem: new THREE.MeshPhongMaterial({color: 0x7a4ab0, emissive: 0x24103a, shininess: 200, specular: 0xffffff}),
    bomb: new THREE.MeshPhongMaterial({map: T2.iron, color: 0x5a5e66, shininess: 70, specular: 0x8a8e98}),
    fuse: new THREE.MeshPhongMaterial({map: T2.rope, color: 0xe8d8b0, shininess: 4}),
    spark: new THREE.MeshBasicMaterial({color: 0xffd26a}),
    chrome: new THREE.MeshPhongMaterial({map: T2.steel, color: 0xf0f3f7, emissive: 0x1a1e24, shininess: 240, specular: 0xffffff}),
    vent: new THREE.MeshPhongMaterial({map: T2.vent, shininess: 120, specular: 0xffffff, side: THREE.DoubleSide}),
    knurl: new THREE.MeshPhongMaterial({map: T2.knurl, shininess: 60, specular: 0x999999}),
    dark: new THREE.MeshPhongMaterial({color: 0x2a2c30, shininess: 30}),
    red: new THREE.MeshPhongMaterial({color: 0xb0201c, shininess: 60, specular: 0x664444})}; })());
  const ex = (pts, depth, bev, segs) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y));
    const g = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.8, bevelSegments: segs || 3, curveSegments: 8}); g.translate(0, 0, -depth / 2);
    g.computeBoundingBox(); const bb = g.boundingBox, uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - bb.min.x) * 3, (p.getY(i) - bb.min.y) * 3); return g; };
  const lathe = (prof, segs) => new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), segs || 18);
  const spiral = (r, y0, y1, turns, tube, m, g) => { const pts = []; const n = 80; for (let i = 0; i <= n; i++) { const t = i / n, a = t * turns * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, y0 + t * (y1 - y0), Math.sin(a) * r)); }
    const o = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, tube, 5, false), m); g.add(o); return o; };
  const add = (g, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); g.add(o); return o; };

  // ---------------- models (built along +Y, grip at the bottom, like the other tools) ----------------
  function batModel() { const M = mats(), g = new THREE.Group();
    add(g, lathe([[0, -0.165], [0.03, -0.163], [0.034, -0.152], [0.03, -0.142], [0.017, -0.135], [0.016, 0.05], [0.019, 0.16], [0.028, 0.27], [0.038, 0.37], [0.042, 0.45], [0.042, 0.5], [0.039, 0.522], [0.028, 0.534], [0, 0.537]], 22), M.ash);
    add(g, lathe([[0.0185, -0.135], [0.0185, 0.07]], 18), M.tape);
    spiral(0.0188, -0.132, 0.068, 9, 0.0022, M.tape, g);
    const lip = add(g, new THREE.TorusGeometry(0.0185, 0.0025, 6, 18), M.tape, 0, 0.07); lip.rotation.x = Math.PI / 2;
    g.userData.sword = true; g.userData.bat = true; return g; }
  function weakModel() { const M = mats(), g = new THREE.Group(), R = rng(404);
    // crude chipped blade: knapped stone with an irregular, notched outline
    const L = [], Rr = []; const N = 9; for (let i = 0; i <= N; i++) { const t = i / N, y = 0.02 + t * 0.4, w = (0.04 - t * 0.03) * (0.8 + R() * 0.45); L.push([-w - (i % 3 === 1 ? 0.006 : 0), y]); Rr.push([w * (0.85 + R() * 0.3), y + (R() - .5) * 0.012]); }
    const pts = Rr.concat([[0.004, 0.455]], L.reverse());
    add(g, ex(pts, 0.012, 0.007, 2), M.rock);
    for (let i = 0; i < 6; i++) { const c = add(g, new THREE.DodecahedronGeometry(0.008 + R() * 0.006, 0), M.rockE, (R() < .5 ? -1 : 1) * (0.018 + R() * 0.01), 0.06 + R() * 0.3, (R() - .5) * 0.012); c.scale.set(1, 1.6, 0.6); c.rotation.set(R() * 3, R() * 3, R() * 3); }
    // lashed crossbar of a stick and twine
    const bar = add(g, new THREE.CylinderGeometry(0.011, 0.012, 0.11, 7), M.stick, 0, 0.015); bar.rotation.z = Math.PI / 2 + 0.06;
    for (const s of [-1, 1]) { const w = add(g, new THREE.TorusGeometry(0.016, 0.0035, 5, 10), M.twine, s * 0.014, 0.015); w.rotation.y = Math.PI / 2; }
    // rough leather-wrapped hilt
    add(g, new THREE.CylinderGeometry(0.019, 0.022, 0.14, 9), M.hide, 0, -0.06);
    for (let i = 0; i < 6; i++) { const r = add(g, new THREE.TorusGeometry(0.021 + R() * 0.003, 0.0045, 5, 10), M.hide, 0, -0.12 + i * 0.022 + R() * 0.004); r.rotation.set(Math.PI / 2 + (R() - .5) * 0.5, 0, (R() - .5) * 0.3); }
    const k = add(g, new THREE.DodecahedronGeometry(0.024, 0), M.rock, 0, -0.142); k.scale.y = 0.8;
    const tail = add(g, new THREE.CylinderGeometry(0.003, 0.002, 0.06, 4), M.hide, 0.02, -0.15); tail.rotation.z = 0.5;
    g.userData.sword = true; return g; }
  function fineModel(silver) { const M = mats(), g = new THREE.Group(), B = silver ? M.silver : M.steel, BD = silver ? M.silverD : M.steelD, E = silver ? M.silverE : M.edge;
    const wid = silver ? 0.031 : 0.027;
    add(g, ex([[-wid, 0], [wid, 0], [wid * 0.9, 0.36], [wid * 0.55, 0.5], [0, 0.565], [-wid * 0.55, 0.5], [-wid * 0.9, 0.36]], 0.003, 0.0055, 3), B, 0, 0.035);
    // bright honed edges
    for (const s of [-1, 1]) add(g, ex([[s * wid * 1.0, 0.0], [s * (wid + 0.0035), 0.0], [s * (wid * 0.92 + 0.0035), 0.36], [s * (wid * 0.57 + 0.003), 0.5], [s * 0.001, 0.568], [s * wid * 0.5, 0.5], [s * wid * 0.85, 0.36]], 0.0035, 0.0012, 1), E, 0, 0.035);
    // fuller groove down both faces
    for (const z of [-1, 1]) { const f = add(g, ex([[-0.0065, 0], [0.0065, 0], [0.004, 0.34], [0, 0.36], [-0.004, 0.34]], 0.001, 0.0008, 1), BD, 0, 0.06, z * 0.0062); }
    // crossguard with turned-down quillons
    add(g, ex([[-0.075, 0.012], [-0.04, 0.02], [0.04, 0.02], [0.075, 0.012], [0.082, -0.002], [0.04, 0.004], [-0.04, 0.004], [-0.082, -0.002]], 0.018, 0.005, 2), silver ? M.silverD : M.brass, 0, 0.02);
    for (const s of [-1, 1]) add(g, new THREE.SphereGeometry(0.011, 12, 8), silver ? M.silver : M.brass, s * 0.084, 0.024);
    if (silver) { add(g, new THREE.OctahedronGeometry(0.012, 0), M.gem, 0, 0.028, 0.011).scale.set(1, 1.3, 0.6); add(g, new THREE.OctahedronGeometry(0.012, 0), M.gem, 0, 0.028, -0.011).scale.set(1, 1.3, 0.6); }
    // wrapped grip + pommel
    add(g, lathe([[0.017, -0.125], [0.02, -0.1], [0.021, -0.05], [0.019, 0.0], [0.016, 0.012]], 16), silver ? M.dark : M.leather);
    spiral(0.0205, -0.118, 0.004, 7, 0.0026, silver ? M.silverD : M.leather, g);
    add(g, lathe([[0, -0.165], [0.016, -0.162], [0.026, -0.148], [0.025, -0.134], [0.014, -0.125], [0, -0.124]], 18), silver ? M.silver : M.brass);
    g.userData.sword = true; return g; }
  function bombModel(big) { const M = mats(), g = new THREE.Group(), r = 0.1;
    add(g, new THREE.SphereGeometry(r, 24, 18), M.bomb, 0, 0, 0);
    const neck = add(g, lathe([[0.03, 0], [0.036, 0.005], [0.036, 0.03], [0.028, 0.034], [0.022, 0.034], [0, 0.034]], 18), M.steelD, 0, r * 0.86);
    const band = add(g, new THREE.TorusGeometry(r * 0.995, 0.005, 6, 32), M.steelD); band.rotation.x = Math.PI / 2;
    const pts = [new THREE.Vector3(0, r * 0.86 + 0.03, 0), new THREE.Vector3(0.01, r + 0.07, 0), new THREE.Vector3(0.04, r + 0.1, 0.01), new THREE.Vector3(0.065, r + 0.095, 0.015)];
    add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0055, 6, false), M.fuse);
    const sp = add(g, new THREE.SphereGeometry(0.012, 8, 6), M.spark.clone(), 0.067, r + 0.095, 0.015); sp.visible = !!big; g.userData.spark = sp; g.userData.tip = sp.position.clone();
    const hl = add(g, new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false}), -0.045, 0.055, 0.07); hl.scale.set(1, 0.6, 0.3);
    g.userData.bomb = true; return g; }
  function lighterModel() { const M = mats(), g = new THREE.Group(), w = 0.07, h = 0.1, d = 0.034;
    const rr = (W2, H2, r) => { const s = []; const n = 4; for (const [cx, cy, a0] of [[W2 - r, -H2 + r, -Math.PI / 2], [W2 - r, H2 - r, 0], [-W2 + r, H2 - r, Math.PI / 2], [-W2 + r, -H2 + r, Math.PI]]) for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI / 2; s.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return s; };
    add(g, ex(rr(w / 2, h / 2, 0.01), d - 0.006, 0.003, 2), M.chrome, 0, 0, 0).position.y = h / 2;
    add(g, new THREE.BoxGeometry(w + 0.002, 0.003, d + 0.002), M.steelD, 0, h - 0.001, 0);
    // chimney with vent holes, flint wheel
    const ch = add(g, new THREE.BoxGeometry(w * 0.62, 0.042, d * 0.78, 1, 1, 1), M.vent, -0.006, h + 0.021, 0);
    const wh = add(g, new THREE.CylinderGeometry(0.009, 0.009, 0.012, 14), M.knurl, w * 0.3, h + 0.03, 0); wh.rotation.x = Math.PI / 2;
    add(g, new THREE.BoxGeometry(0.004, 0.02, 0.012), M.steelD, w * 0.3, h + 0.014, 0);
    add(g, new THREE.BoxGeometry(0.004, 0.005, 0.005), M.dark, w * 0.3 - 0.01, h + 0.04, 0);
    // flip lid on a hinge at the back (+x side)
    const hinge = new THREE.Group(); hinge.position.set(w / 2, h, 0); g.add(hinge);
    const lid = add(hinge, ex(rr(w / 2, 0.026, 0.009), d - 0.006, 0.003, 2), M.chrome, -w / 2, 0.026, 0);
    add(hinge, new THREE.CylinderGeometry(0.004, 0.004, d * 0.7, 8), M.steelD, 0, 0.002, 0).rotation.x = Math.PI / 2;
    // the flame
    const fl = new THREE.Group(); fl.position.set(-0.006, h + 0.045, 0); fl.visible = false; g.add(fl);
    const fo = add(fl, new THREE.SphereGeometry(0.018, 12, 10), new THREE.MeshBasicMaterial({color: 0xff8a20, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false}), 0, 0.03); fo.scale.set(0.8, 2.3, 0.8);
    const fi = add(fl, new THREE.SphereGeometry(0.01, 10, 8), new THREE.MeshBasicMaterial({color: 0xfff2b0, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false}), 0, 0.02); fi.scale.set(0.8, 2.2, 0.8);
    const fb = add(fl, new THREE.SphereGeometry(0.006, 8, 6), new THREE.MeshBasicMaterial({color: 0x4a7aff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false}), 0, 0.004);
    g.userData.lighter = {hinge, fl, fo, fi}; g.position.y = -0.05; const o = new THREE.Group(); o.add(g); o.userData.lighter = g.userData.lighter; return o; }
  U.models = {batModel, weakModel, fineModel, bombModel, lighterModel};

  // ---------------- hook the model builders ----------------
  const bt = buildToolModel; buildToolModel = function (kind, mat) {
    if (kind === 'sword') { try { const g = U.cur === SIL ? fineModel(true) : mat === 'wood' ? batModel() : mat === 'stone' ? weakModel() : mat === 'iron' ? fineModel(false) : null;
      if (g) { g.traverse(o => { if (o.isMesh) o.frustumCulled = false; }); return g; } } catch (e) { warn('model', e); } }
    return bt.apply(this, arguments); };
  const mi = makeItemMesh; makeItemMesh = function (id) {
    try { if (id === BOMB) { const g = bombModel(false); g.scale.setScalar(1.35); g.position.y = 0.03; return g; }
      if (id === LIGHT) { const g = lighterModel(); g.userData.tool = true; g.userData.kind = 'flint'; U.lighters.add(g); return g; } } catch (e) { warn('mesh', e); }
    const pc = U.cur; U.cur = id; try { return mi.apply(this, arguments); } finally { U.cur = pc; } };

  // ---------------- bat: big batter's swing, thwack, a bit more knockback ----------------
  const sw = swing; swing = function (kind) { const r = sw.apply(this, arguments);
    try { if (selId === BAT && cnt(BAT) > 0 && (swingKind === 'slashL' || swingKind === 'slashR')) { swingKind = 'slashR'; swingDur = swingT = 0.36; } } catch (_) {} return r; };
  const hm = hitMob; hitMob = function (a) { const r = hm.apply(this, arguments);
    try { if (selId === BAT && cnt(BAT) > 0 && a) { a.kbx = (a.kbx || 0) * 1.4; a.kbz = (a.kbz || 0) * 1.4; sfx('thwack', 0.9); } } catch (e) { warn('bat', e); } return r; };

  // ---------------- sounds ----------------
  const ps = playSound; playSound = function (kind, vol, pan, m) {
    if (kind !== 'thwack' && kind !== 'lclick' && kind !== 'flick' && kind !== 'fuse' && kind !== 'bthrow') return ps.apply(this, arguments);
    if (!AC || !(vol > 0.001)) return; const t = AC.currentTime, out = outNode(vol, pan || 0);
    if (kind === 'thwack') { noiseHit(t, 0.07, 'bandpass', 1100, out, 0.9, 1.4, 500); osc('sine', 240, 85, t, 0.14, out, 0.7); osc('triangle', 620, 330, t, 0.05, out, 0.3); return; }
    if (kind === 'lclick') { osc('square', 2600, 1700, t, 0.012, out, 0.22); noiseHit(t, 0.018, 'highpass', 4200, out, 0.5); osc('square', 1900, 1400, t + 0.05, 0.01, out, 0.15); return; }
    if (kind === 'flick') { noiseHit(t, 0.05, 'bandpass', 3400, out, 0.55, 2, 1800); noiseHit(t + 0.04, 0.3, 'lowpass', 700, out, 0.35, 0.8, 300); return; }
    if (kind === 'bthrow') { noiseHit(t, 0.2, 'bandpass', 520, out, 0.45, 1, 220); return; }
    if (kind === 'fuse') { noiseHit(t, 3.0, 'highpass', 3600, out, 0.2, 0.7, 5200); for (let i = 0; i < 26; i++) noiseHit(t + i * 0.115 + Math.random() * 0.05, 0.014, 'highpass', 5200, out, 0.35); return; }
  };

  // ---------------- lighter: flip, click and a flame when used ----------------
  const ui = useItem; useItem = function () {
    try { if (started && !dead && !menuOpen && !paused && selId === LIGHT && cnt(LIGHT) > 0) { U.flameT = 1.0; sfx('lclick', 0.7); setTimeout(() => sfx('flick', 0.6), 70); }
      if (started && !dead && !menuOpen && !paused && selId === BOMB && cnt(BOMB) > 0 && !riding) { throwBomb(); return; } } catch (e) { warn('use', e); }
    return ui.apply(this, arguments); };
  function tickLighters(dt) { U.flameT = Math.max(0, U.flameT - dt); const now = performance.now() / 1000;
    for (const g of U.lighters) { if (!g.parent) { U.lighters.delete(g); continue; } const L = g.userData.lighter, on = U.flameT > 0;
      const open = on ? Math.min(1, (1.0 - U.flameT) * 8, U.flameT * 6) : 0; L.hinge.rotation.z = -open * 2.0; L.fl.visible = on && U.flameT > 0.08 && U.flameT < 0.93;
      if (L.fl.visible) { const f = 1 + Math.sin(now * 40) * 0.08 + Math.sin(now * 23) * 0.06; L.fo.scale.set(0.8, 2.3 * f, 0.8); L.fi.scale.set(0.8, 2.2 / f, 0.8); L.fl.rotation.z = Math.sin(now * 9) * 0.08; } } }

  // ---------------- bomb: thrown in an arc, fizzes ~3 s, then a small creeper-like blast ----------------
  let throwCd = 0;
  function throwBomb() { if (throwCd > 0) return; throwCd = 0.5;
    const d = lookDir(), m = bombModel(true); m.scale.setScalar(2.2); const x = P.x + d[0] * 0.6, y = P.y + EYE - 0.25 + d[1] * 0.6, z = P.z + d[2] * 0.6;
    m.position.set(x, y, z); scene.add(m); m.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
    const sp = 8; U.bombs.push({m, x, y, z, vx: d[0] * sp + (P.vx || 0) * 0.5, vy: d[1] * sp + 3.2, vz: d[2] * sp + (P.vz || 0) * 0.5, t: 3.0, st: 0, rot: (Math.random() - .5) * 8});
    useUp(BOMB); try { swing('place'); } catch (_) {} sfx('bthrow', 0.7); try { sfx3d('fuse', {x, y, z}, 22); } catch (_) {} try { renderHotbar(); } catch (_) {} }
  const sol = (x, y, z) => { try { return solid(Math.floor(x), Math.floor(y), Math.floor(z)); } catch (_) { return false; } };
  const tip = new THREE.Vector3();
  function tickBombs(dt) { throwCd -= dt;
    for (let i = U.bombs.length - 1; i >= 0; i--) { const b = U.bombs[i], R = 0.22;
      b.vy -= 20 * dt; const wet = (() => { try { return getB(Math.floor(b.x), Math.floor(b.y), Math.floor(b.z)) === T.WATER; } catch (_) { return false; } })();
      if (wet) { b.vx *= 0.9; b.vz *= 0.9; b.vy = Math.max(b.vy, -2); }
      let nx = b.x + b.vx * dt; if (sol(nx + Math.sign(b.vx) * R, b.y, b.z)) { b.vx *= -0.35; } else b.x = nx;
      let nz = b.z + b.vz * dt; if (sol(b.x, b.y, nz + Math.sign(b.vz) * R)) { b.vz *= -0.35; } else b.z = nz;
      let ny = b.y + b.vy * dt;
      if (b.vy < 0 && sol(b.x, ny - R, b.z)) { b.y = Math.floor(ny - R) + 1 + R; b.vy = Math.abs(b.vy) > 2.5 ? -b.vy * 0.32 : 0; b.vx *= 0.6; b.vz *= 0.6; b.rot *= 0.6; }
      else if (b.vy > 0 && sol(b.x, ny + R, b.z)) b.vy = 0; else b.y = ny;
      if (b.y < 1) b.y = 1;
      b.m.position.set(b.x, b.y, b.z); b.m.rotation.z += b.rot * dt; b.m.rotation.x += b.rot * 0.6 * dt;
      b.t -= dt; b.st -= dt; const spk = b.m.userData.spark; spk.scale.setScalar(0.8 + Math.random() * 1.2); spk.material.color.setHex(Math.random() < .5 ? 0xffe28a : 0xff9a30);
      if (b.st <= 0) { b.st = 0.05; tip.copy(b.m.userData.tip); b.m.localToWorld(tip); try { burst(tip.x, tip.y, tip.z, Math.random() < .5 ? 0xffd060 : 0xffa030, 2, 0.25); } catch (_) {} }
      if (b.t < 0.6) b.m.scale.setScalar(2.2 * (1 + Math.sin(b.t * 40) * 0.05));
      if (b.t <= 0 || dead) { scene.remove(b.m); U.bombs.splice(i, 1); if (!dead) boom(b.x, b.y, b.z); } } }
  const BOOM_R = 2.3, BOOM_MAX = 8;   // a creeper is radius 3; this is smaller and can never one-shot you (max 4 hearts)
  function boom(cx, cy, cz) { const d = Math.hypot(P.x - cx, P.y + 0.9 - cy, P.z - cz);
    const dmg = Math.round(BOOM_MAX * clamp(1 - Math.max(0, d - 0.8) / 5.5, 0, 1)); U.lastBoom = {d: +d.toFixed(2), dmg}; U.booms++;
    const h = hurt, gb = getB; hurt = function (n, c) { if (dmg <= 0) return; invuln = 0; return h.call(this, dmg, c); };
    getB = function (x, y, z) { try { if (typeof placedSet !== 'undefined' && placedSet.has(idx(x, y, z))) return 0; } catch (_) {} return gb(x, y, z); };   // never blows up player-placed blocks
    boomMsg = 'Blown up by your own bomb.';
    try { explode(cx, cy, cz, BOOM_R); } catch (e) { warn('boom', e); } finally { hurt = h; getB = gb; boomMsg = null; } }
  U.boom = boom; U.throwBomb = throwBomb;
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments); try { tickBombs(Math.min(0.05, dt || 0.016)); tickLighters(Math.min(0.05, dt || 0.016)); } catch (e) { warn('tick', e); } return r; };

  // ---------------- HD icons rendered from the models ----------------
  function makeIcons() { const S = 256;
    const r2 = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true}); r2.setPixelRatio(1); r2.setSize(S, S, false); r2.setClearColor(0x000000, 0);
    try { if ('outputColorSpace' in renderer) r2.outputColorSpace = renderer.outputColorSpace; else if ('outputEncoding' in renderer) r2.outputEncoding = renderer.outputEncoding; } catch (_) {}
    const sc = new THREE.Scene(); sc.add(new THREE.AmbientLight(0xffffff, 0.55)); const dl = new THREE.DirectionalLight(0xffffff, 0.95); dl.position.set(-1, 2, 3); sc.add(dl); const d2 = new THREE.DirectionalLight(0xbfd8ff, 0.35); d2.position.set(2, -1, 1); sc.add(d2);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10), bb = new THREE.Box3(), sz = new THREE.Vector3(), ctr = new THREE.Vector3();
    const list = [[BAT, () => batModel(), 1], [WEAK, () => weakModel(), 1], [FINE, () => fineModel(false), 1], [SIL, () => fineModel(true), 1], [BOMB, () => bombModel(true), 0], [LIGHT, () => lighterModel(), 2]];
    for (const [id, fn, mode] of list) { try { const g = fn(), piv = new THREE.Group(); piv.add(g);
        if (mode === 1) { g.rotation.set(0.35, 0.35, 0); piv.rotation.z = -Math.PI / 4; } else if (mode === 2) { g.rotation.set(0.25, -0.5, 0); piv.rotation.z = -0.12; if (g.userData.lighter) { g.userData.lighter.hinge.rotation.z = -1.9; g.userData.lighter.fl.visible = true; } } else { g.rotation.set(0.3, 0.4, 0); }
        sc.add(piv); piv.updateMatrixWorld(true); bb.setFromObject(piv); bb.getSize(sz); bb.getCenter(ctr); const h = Math.max(sz.x, sz.y) * 0.55;
        cam.left = ctr.x - h; cam.right = ctr.x + h; cam.top = ctr.y + h; cam.bottom = ctr.y - h; cam.updateProjectionMatrix();
        r2.render(sc, cam); ICONS[id] = r2.domElement.toDataURL('image/png'); U.icons++; sc.remove(piv); } catch (e) { warn('icon', e); } }
    try { r2.dispose(); r2.forceContextLoss(); } catch (_) {}
    try { renderHotbar(); } catch (_) {} }
  setTimeout(() => { try { makeIcons(); } catch (e) { warn('icons', e); } }, 1900);
  U.makeIcons = makeIcons;
})();
