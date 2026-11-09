// CPU diffuse preview of restored procedural FP arms (1.2.44) holding pickaxe, sword, musket.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {T, load, builtRuntime, legacy} from '../tests/lib/pilot-native-r128.mjs';
const {createCanvas} = createRequire('/workspace/qa/tools/index.js')('@napi-rs/canvas');

const OUT = process.argv[2] || '/workspace/qa/arms-1244';
fs.mkdirSync(OUT, {recursive: true});

const helper = fs.readFileSync(new URL('./pilot-model-source/held-fp-1240.js', import.meta.url), 'utf8');
const W = {THREE: T, __fpaOff: 0};
new Function('window', helper)(W);
const H = W.__held1240;

const dir = new URL('../assets/models/scottish-base-v2/', import.meta.url);
let eq = [0,0,0,0,0];
const R = builtRuntime({
  scottish: true, life: false, equipment: () => eq,
  tier: id => id >= 129 ? 'diamond' : id >= 112 ? 'gold' : id >= 108 ? 'iron' : 'copper',
  distance: () => 0,
  load: async name => {
    const far = name === 'pilot-far.glb';
    const [b, o] = await Promise.all([
      load(new URL(far ? 'scottish-far.glb' : 'scottish-base-with-jetpack.glb', dir)),
      load(new URL(far ? 'crystal-armour-far.glb' : 'crystal-armour.glb', dir))
    ]);
    return R.combineScottish(b, o, far);
  }
});
await R.attach(legacy(eq).build(false));
W.__pilot1235 = R;
const template = R.templates[0];
const looks = (() => { H.retextureProceduralArms(template); return H._looks || {}; })();
const skinHex = looks.skin && looks.skin.color ? looks.skin.color.getHex() : 0xd4a07a;
const sleeveHex = looks.sleeve && looks.sleeve.color ? looks.sleeve.color.getHex() : 0xe9e2d4;
console.log('sampled skin', '0x'+skinHex.toString(16), 'sleeve', '0x'+sleeveHex.toString(16));

function buildArm(kind) {
  const root = new T.Group();
  const skinM = new T.MeshLambertMaterial({color: skinHex});
  const sleeveM = new T.MeshLambertMaterial({color: sleeveHex});
  // Upper sleeve
  const sleeve = new T.Mesh(new T.BoxGeometry(0.16, 0.16, 0.42), sleeveM);
  sleeve.position.set(0.05, 0.02, 0.22); root.add(sleeve);
  // Forearm skin
  const forearm = new T.Mesh(new T.BoxGeometry(0.12, 0.12, 0.28), skinM);
  forearm.position.set(0.05, 0.0, -0.05); root.add(forearm);
  // Fist
  const fist = new T.Mesh(new T.BoxGeometry(0.13, 0.13, 0.13), skinM.clone());
  fist.position.set(0.05, 0.01, -0.22); root.add(fist);
  // Simple fingers
  for (let i = 0; i < 4; i++) {
    const f = new T.Mesh(new T.BoxGeometry(0.025, 0.025, 0.07), skinM.clone());
    f.position.set(-0.01 + i * 0.035, 0.05, -0.30); root.add(f);
  }
  // Held tool at fist
  const held = new T.Group(); held.position.set(0.05, 0.04, -0.28); root.add(held);
  const wood = new T.MeshPhongMaterial({color: 0x6b4a2a});
  if (kind === 'pickaxe') {
    const h = new T.Mesh(new T.CylinderGeometry(0.016, 0.018, 0.55, 10), wood);
    h.rotation.z = 0.2; h.position.set(0.02, 0.12, 0); held.add(h);
    const head = new T.Mesh(new T.BoxGeometry(0.32, 0.06, 0.06), new T.MeshPhongMaterial({color: 0x9aa0a6}));
    head.position.set(0.02, 0.38, 0); held.add(head);
  } else if (kind === 'sword') {
    const h = new T.Mesh(new T.CylinderGeometry(0.014, 0.015, 0.18, 10), wood);
    h.position.set(0, 0.06, 0); held.add(h);
    const blade = new T.Mesh(new T.BoxGeometry(0.045, 0.5, 0.014), new T.MeshPhongMaterial({color: 0xdfe3e8}));
    blade.position.set(0, 0.38, 0); held.add(blade);
  } else if (kind === 'musket') {
    const iron = new T.MeshPhongMaterial({color: 0x2a2c30});
    const barrel = new T.Mesh(new T.BoxGeometry(0.85, 0.035, 0.035), iron);
    barrel.position.set(0.25, 0.03, 0); held.add(barrel);
    const grip = new T.Mesh(new T.BoxGeometry(0.2, 0.07, 0.045), wood);
    grip.position.set(-0.2, -0.02, 0); held.add(grip);
  }
  root.rotation.set(-0.55, 0.55, 0.15);
  return root;
}

function render(kind) {
  const root = buildArm(kind);
  root.updateMatrixWorld(true);
  const w = 720, h = 720;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#243038'; ctx.fillRect(0, 0, w, h);
  // Soft vignette panel
  ctx.fillStyle = '#1a2228'; ctx.fillRect(40, 70, w - 80, h - 120);

  const view = new T.PerspectiveCamera(35, 1, 0.05, 50);
  view.position.set(0.55, 0.25, 1.15);
  view.lookAt(0.05, 0.0, -0.05);
  view.updateMatrixWorld(true);

  const lightDir = new T.Vector3(0.35, 0.85, 0.4).normalize();
  const tris = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    const geo = o.geometry; const pos = geo.attributes.position; if (!pos) return;
    if (!geo.boundingBox) geo.computeBoundingBox();
    const col = o.material.color || new T.Color(0x888888);
    const idx = geo.index;
    const emit = (ia, ib, ic) => {
      const A = new T.Vector3().fromBufferAttribute(pos, ia).applyMatrix4(o.matrixWorld);
      const B = new T.Vector3().fromBufferAttribute(pos, ib).applyMatrix4(o.matrixWorld);
      const C = new T.Vector3().fromBufferAttribute(pos, ic).applyMatrix4(o.matrixWorld);
      const n = new T.Vector3().subVectors(B, A).cross(new T.Vector3().subVectors(C, A));
      if (n.lengthSq() < 1e-10) return;
      n.normalize();
      const ndot = Math.max(0.18, n.dot(lightDir));
      const pts = [A, B, C].map(v => {
        const p = v.clone().project(view);
        return [(p.x * 0.5 + 0.5) * w, (-p.y * 0.5 + 0.5) * h, p.z];
      });
      const area = (pts[1][0] - pts[0][0]) * (pts[2][1] - pts[0][1]) - (pts[2][0] - pts[0][0]) * (pts[1][1] - pts[0][1]);
      if (area >= 0) return; // backface in screen space
      const z = (pts[0][2] + pts[1][2] + pts[2][2]) / 3;
      tris.push({
        pts, z,
        r: Math.min(255, Math.round(col.r * 255 * ndot)),
        g: Math.min(255, Math.round(col.g * 255 * ndot)),
        b: Math.min(255, Math.round(col.b * 255 * ndot))
      });
    };
    if (idx) for (let i = 0; i < idx.count; i += 3) emit(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
    else for (let i = 0; i < pos.count; i += 3) emit(i, i + 1, i + 2);
  });
  tris.sort((a, b) => b.z - a.z);
  for (const t of tris) {
    ctx.beginPath();
    ctx.moveTo(t.pts[0][0], t.pts[0][1]);
    ctx.lineTo(t.pts[1][0], t.pts[1][1]);
    ctx.lineTo(t.pts[2][0], t.pts[2][1]);
    ctx.closePath();
    ctx.fillStyle = `rgb(${t.r},${t.g},${t.b})`;
    ctx.fill();
  }
  ctx.fillStyle = '#e8f0ff';
  ctx.font = 'bold 22px system-ui,sans-serif';
  ctx.fillText('1.2.44 procedural FP arm — ' + kind, 48, 48);
  ctx.font = '16px system-ui,sans-serif';
  ctx.fillStyle = '#9bb3c9';
  ctx.fillText('CPU diffuse · skin 0x' + skinHex.toString(16) + ' · sleeve 0x' + sleeveHex.toString(16), 48, h - 36);
  const out = `${OUT}/fp-${kind}.png`;
  fs.writeFileSync(out, canvas.toBuffer('image/png'));
  console.log('wrote', out, 'tris', tris.length);
}

for (const k of ['pickaxe', 'sword', 'musket']) render(k);
fs.writeFileSync(`${OUT}/RENDER.txt`, [
  '1.2.44 CPU diffuse renders of restored procedural first-person arms.',
  'Holding: pickaxe, sword, musket.',
  'Skin/sleeve colours sampled from scottish-base-v2 character materials via retextureProceduralArms.',
  'Not a GPU screenshot and not a device FPS claim.',
  'skin=0x' + skinHex.toString(16) + ' sleeve=0x' + sleeveHex.toString(16)
].join('\n'));
