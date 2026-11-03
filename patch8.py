import base64
s=open('s1.js').read()
def R(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:70]); s=s.replace(a,b)
icon='data:image/png;base64,'+base64.b64encode(open('torch_icon.png','rb').read()).decode()
# (a) hi-res crack overlay
R("""  for (let i = 0; i < 36; i++) {
    let cx = 64 + (rnd() - .5) * 50, cy = 64 + (rnd() - .5) * 50; const seg = [];
    for (let j = 0; j < 4; j++) { const nx = cx + (rnd() - .5) * 46, ny = cy + (rnd() - .5) * 46; seg.push([cx, cy, nx, ny]); cx = nx; cy = ny; }
    lines.push(seg);
  }
  for (let s = 0; s < 8; s++) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); g.strokeStyle = 'rgba(12,9,6,.9)'; g.lineWidth = 2.4; g.lineCap = 'square';
    const n = Math.round((s + 1) / 8 * lines.length);
    for (let i = 0; i < n; i++) { g.beginPath(); for (const [a, b, x2, y2] of lines[i]) { g.moveTo(a, b); g.lineTo(x2, y2); } g.stroke(); }
    crackTex.push(new THREE.CanvasTexture(c));
  }""","""  // GLX-B5: 512px procedural cracks that branch out from the centre, drawn with a dark core and a pale chipped edge, smoothly filtered
  const S = 512;
  for (let i = 0; i < 40; i++) {
    let cx = S / 2 + (rnd() - .5) * S * 0.25, cy = S / 2 + (rnd() - .5) * S * 0.25; const seg = [];
    let ang = rnd() * Math.PI * 2;
    for (let j = 0; j < 7; j++) { ang += (rnd() - .5) * 1.1; const len = S * (0.04 + rnd() * 0.07); const nx = cx + Math.cos(ang) * len, ny = cy + Math.sin(ang) * len; seg.push([cx, cy, nx, ny, 1 - j / 8]); cx = nx; cy = ny; }
    lines.push(seg);
  }
  for (let s = 0; s < 8; s++) {
    const c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'); g.lineCap = 'round'; g.lineJoin = 'round';
    const n = Math.round((s + 1) / 8 * lines.length), reach = 3 + Math.round(s / 7 * 4);
    for (const pass of [0, 1]) for (let i = 0; i < n; i++) {
      lines[i].slice(0, reach).forEach(([a, b, x2, y2, w]) => {
        g.strokeStyle = pass ? 'rgba(10,8,6,.92)' : 'rgba(255,255,255,.18)';
        g.lineWidth = (pass ? 3.2 : 6.5) * (0.5 + w * (0.6 + s * 0.08));
        g.beginPath(); g.moveTo(a + (pass ? 0 : 1.5), b + (pass ? 0 : 1.5)); g.lineTo(x2 + (pass ? 0 : 1.5), y2 + (pass ? 0 : 1.5)); g.stroke();
      });
    }
    const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 4;
    crackTex.push(t);
  }""")
# (c) torch model
R("""  } else if (type === T.TORCH) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.5, 0.09), torchStickMat); st.position.y = 0.25; g.add(st);
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 6), torchFlameMat); fl.position.y = 0.6; g.add(fl);
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), torchCoreMat); core.position.y = 0.54; g.add(core);
    o.flame = fl;
  }""","""  } else if (type === T.TORCH) {
    const tm = makeTorchModel(); const piv = new THREE.Group(); piv.add(tm.g); g.add(piv);
    const w = meta.wall;
    g.rotation.y = 0;
    if (w) {
      // wall torch: foot against the wall face it was placed on, leaning ~25 degrees out into the room
      const tilt = 0.44;
      g.position.set(x + .5 + w[0] * 0.36, y + 0.12, z + .5 + w[1] * 0.36);
      if (w[0]) piv.rotation.z = w[0] * tilt; else piv.rotation.x = -w[1] * tilt;
    }
    o.flame = tm.flame; o.glow = tm.glow; o.head = tm.head;
    g.updateMatrixWorld(true); const hp = new THREE.Vector3(); tm.flame.getWorldPosition(hp); o.lp = [hp.x, hp.y, hp.z];
  }""")
R("""      const s = 0.85 + Math.sin(now * 17 + o.x) * 0.1 + Math.random() * 0.08;
      o.flame.scale.set(1, s, 1);""","""      const s = 0.85 + Math.sin(now * 17 + o.x) * 0.1 + Math.sin(now * 29 + o.z) * 0.05 + Math.random() * 0.05;
      o.flame.scale.set(0.34 * (0.95 + Math.sin(now * 11 + o.z) * 0.05), 0.5 * s, 1);
      o.flame.material.rotation = Math.sin(now * 3 + o.x) * 0.08;
      if (o.glow) { o.glow.material.opacity = 0.55 + Math.sin(now * 9 + o.x) * 0.1; const gs = 0.75 + Math.sin(now * 7 + o.z) * 0.05; o.glow.scale.set(gs, gs, 1); }""")
R("""      .map(o => [Math.hypot(o.x + .5 - P.x, o.y - P.y, o.z + .5 - P.z), o.x + .5, o.y + .75, o.z + .5, 0]).filter(e => e[0] < 26);""",
  """      .map(o => o.lp ? [Math.hypot(o.lp[0] - P.x, o.lp[1] - P.y, o.lp[2] - P.z), o.lp[0], o.lp[1] + 0.1, o.lp[2], 0] : [Math.hypot(o.x + .5 - P.x, o.y - P.y, o.z + .5 - P.z), o.x + .5, o.y + .75, o.z + .5, 0]).filter(e => e[0] < 26);""")
R("""function buildEnt(type, x, y, z) {""","""// GLX-B5: torch to match the reference: tapered wooden shaft, two dark iron bands, glowing ember head, animated flame + glow sprites
const TORCH_ICON = '""" + icon + """';
let torchMats = null;
function torchSpriteTex(kind) {
  const c = document.createElement('canvas'); c.width = 64; c.height = kind === 'flame' ? 128 : 64; const g = c.getContext('2d');
  if (kind === 'flame') {
    const gr = g.createRadialGradient(32, 92, 2, 32, 80, 60); gr.addColorStop(0, 'rgba(255,250,210,1)'); gr.addColorStop(0.25, 'rgba(255,200,80,.95)'); gr.addColorStop(0.55, 'rgba(255,110,20,.7)'); gr.addColorStop(1, 'rgba(255,60,0,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(32, 2); g.bezierCurveTo(52, 40, 62, 70, 54, 100); g.bezierCurveTo(48, 122, 16, 122, 10, 100); g.bezierCurveTo(2, 70, 12, 40, 32, 2); g.fill();
  } else { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,190,90,.9)'); gr.addColorStop(0.4, 'rgba(255,130,40,.35)'); gr.addColorStop(1, 'rgba(255,90,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  return new THREE.CanvasTexture(c);
}
function makeTorchModel() {
  if (!torchMats) torchMats = {
    wood: new THREE.MeshPhongMaterial({color: 0x6b4c30, shininess: 4, specular: 0x000000}),
    iron: new THREE.MeshPhongMaterial({color: 0x2a2826, shininess: 40, specular: 0x555555}),
    ember: new THREE.MeshPhongMaterial({color: 0x3a1a0c, emissive: 0xff5a14, emissiveIntensity: 0.9, shininess: 10}),
    flameT: torchSpriteTex('flame'), glowT: torchSpriteTex('glow')};
  const M = torchMats, g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.032, 0.52, 8), M.wood); shaft.position.y = 0.26; g.add(shaft);
  for (const by of [0.3, 0.4]) { const band = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.035, 8), M.iron); band.position.y = by; g.add(band); }
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.056, 0.13, 8), M.ember); head.position.y = 0.58; g.add(head);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({map: M.flameT, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
  flame.scale.set(0.34, 0.5, 1); flame.position.y = 0.82; g.add(flame);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({map: M.glowT, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6}));
  glow.scale.set(0.75, 0.75, 1); glow.position.y = 0.68; g.add(glow);
  return {g, flame, glow, head};
}
function buildEnt(type, x, y, z) {""")
# (b) placement on wall faces
R("""  if ((isPlant(id) || id === T.TORCH) && !solid(x, y - 1, z)) { toast(NAMES[id] + ' needs solid ground below'); return; }""",
"""  let torchWall = null;
  if (id === T.TORCH && r.hit && r.hit[1] === y && (r.hit[0] !== x || r.hit[2] !== z) && solid(r.hit[0], r.hit[1], r.hit[2])) torchWall = [r.hit[0] - x, r.hit[2] - z];
  if (id === T.TORCH && !torchWall && r.hit && r.hit[1] > y) { toast('Torches go on the ground or on a wall'); return; }
  if ((isPlant(id) || (id === T.TORCH && !torchWall)) && !solid(x, y - 1, z)) { toast(NAMES[id] + ' needs solid ground below'); return; }""")
R("""  if (id === T.CHEST || id === T.DOOR || id === T.TV) entMeta.set(keyOf(x, y, z), {face: faceFromYaw()});""",
"""  if (id === T.CHEST || id === T.DOOR || id === T.TV) entMeta.set(keyOf(x, y, z), {face: faceFromYaw()});
  if (id === T.TORCH) { if (torchWall) entMeta.set(keyOf(x, y, z), {face: 0, wall: torchWall}); else entMeta.delete(keyOf(x, y, z)); }""")
R("""  if (isPlant(up) || up === T.TORCH) popBlock(x, y + 1, z);""","""  if (isPlant(up) || (up === T.TORCH && !(entMeta.get(keyOf(x, y + 1, z)) || {}).wall)) popBlock(x, y + 1, z);
  // wall torches fall off when the block they hang on goes
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const tx = x + dx, tz = z + dz;
    if (getB(tx, y, tz) !== T.TORCH) continue;
    const w = (entMeta.get(keyOf(tx, y, tz)) || {}).wall;
    if (w && w[0] === -dx && w[1] === -dz) { popBlock(tx, y, tz); entMeta.delete(keyOf(tx, y, tz)); }
  }
  if (b === T.TORCH) entMeta.delete(keyOf(x, y, z));""")
# icon + hand model
R("  ICONS[T.TORCH] = drawIcon(","  ICONS[T.TORCH] = TORCH_ICON; void drawIcon(")
s += """
// held / dropped torch uses the same 3D model as the placed one
const makeItemMeshBase = makeItemMesh;
makeItemMesh = function (id) {
  if (id === T.TORCH) { const g = new THREE.Group(), t = makeTorchModel(); t.g.scale.setScalar(0.42); t.g.position.y = -0.1; g.add(t.g); g.userData.torch = t; return g; }
  return makeItemMeshBase(id);
};
"""
open('s1.js','w').write(s)
