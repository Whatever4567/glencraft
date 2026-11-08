// v1.2.32 face (local): the player face texture is a painted natural face (paintFaceV1232) placed on the sculpted head by the planar face UV.
// Runs the page's own painter on a node canvas (@napi-rs/canvas from /workspace/qa/tools) and checks it against the mesh.
import fs from 'node:fs'; import {createRequire} from 'node:module'; import {load, stats} from './lib/tph-harness.mjs';
const {createCanvas} = createRequire('/workspace/qa/tools/index.js')('@napi-rs/canvas');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const file = new URL('../index.html', import.meta.url).pathname, html = fs.readFileSync(file, 'utf8');
const fi = html.indexOf('function paintFaceV1232'), fj = html.indexOf('    faceTexP = cv(512, 512', fi);
ok(fi > 0 && fj > fi && html.split('function paintFaceV1232').length === 2, 'painter present once and used for faceTexP');
const paint = () => { const c = createCanvas(512, 512), g = c.getContext('2d'); new Function('g', html.slice(fi, fj) + '\npaintFaceV1232(g, 512);')(g); return g.getImageData(0, 0, 512, 512).data; };
const D = paint(), D2 = paint(); ok(Buffer.compare(Buffer.from(D), Buffer.from(D2)) === 0, 'texture is deterministic (seeded)');
const px = (u, v) => { const x = Math.min(511, Math.max(0, Math.round(u * 512))), y = Math.min(511, Math.max(0, Math.round((1 - v) * 512))), k = (y * 512 + x) * 4; return [D[k], D[k + 1], D[k + 2]]; };
const U = x => (x + 0.22) / 0.44, V = y => (y - 0.01) / 0.48, lum = c => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
const B = load(file), T = B.T, b = B.build(false); b.updateMatrixWorld(true); const h = b.userData.head;
for (const L of b.userData.lids) { const c = px(U(L.position.x), V(L.position.y + 0.002)); ok(lum(c) < 90, `dark iris or pupil under lid at ${L.position.x.toFixed(2)}: rgb ${c}`); }
{ const L = b.userData.lids[1].position, c = px(U(L.x - 0.006), V(L.y - 0.002)); ok(c[2] > c[0] + 40, 'blue iris beside the pupil (kept from the original): ' + c); }
const skin = px(U(0.13), V(0.2)); ok(skin[0] > 190 && skin[0] > skin[1] && skin[1] > skin[2], 'cheek is light warm skin: ' + skin);
const lip = px(U(0), V(0.1)), ml = px(U(0), V(0.1135)); ok(lip[0] > lip[1] + 25 && lip[0] < 230, 'lower lip natural near skin pink: ' + lip); ok(lum(ml) < lum(lip) - 25, 'mouth line darker than lip: ' + ml);
for (const s of [-1, 1]) { const c = px(U(s * 0.014), V(0.158)); ok(lum(c) < lum(skin) - 50, 'nostril dark at x ' + s * 0.014 + ': ' + c); }
// no flat rectangles left: variation inside the old eye white / brow boxes
{ let vs = []; for (let y = 150; y < 200; y += 3) for (let x = 140; x < 220; x += 3) { const k = (y * 512 + x) * 4; vs.push(D[k]); } const mn = vs.reduce((a, b) => a + b) / vs.length, sd = Math.sqrt(vs.reduce((a, b) => a + (b - mn) ** 2, 0) / vs.length); ok(sd > 3, 'no flat block in the eye region (sd ' + sd.toFixed(1) + ')'); }
// mesh: face UV equals the planar mapping
{ const m = h.children.find(o => o.userData.face), p = m.geometry.attributes.position, uv = m.geometry.attributes.uv; let e = 0, k = 0; for (let i = 0; i < p.count; i++) if (p.getZ(i) > 0.1) { k++; e = Math.max(e, Math.abs(uv.getX(i) - U(p.getX(i))), Math.abs(uv.getY(i) - V(p.getY(i)))); } ok(k > 100 && e < 0.002, 'face UV is the planar map on ' + k + ' verts (err ' + e.toFixed(4) + ')'); }
// hair: fringe of separate locks on the front edge
{ const m = h.children.find(o => o.userData.sculpt === 'hair'), p = m.geometry.attributes.position, bins = {}; for (let i = 0; i < p.count; i++) if (p.getZ(i) > 0.12 && Math.abs(p.getX(i)) < 0.17) { const q = Math.round(p.getX(i) * 50); bins[q] = Math.min(bins[q] ?? 9, p.getY(i)); }
  const ys = Object.keys(bins).map(Number).sort((a, b) => a - b).map(q => bins[q]); let mins = 0; for (let i = 1; i < ys.length - 1; i++) if (ys[i] < ys[i - 1] && ys[i] < ys[i + 1]) mins++;
  ok(mins >= 3 && Math.min(...ys) > 0.34, 'fringe has ' + mins + ' separate locks, lowest ' + Math.min(...ys).toFixed(3)); }
// the drawn fringe edge (where the front of the hair shell covers the forehead, seen from the front) has no deep V notches
const edge = (g) => { const o = g.userData.head.children.find(o => o.userData.sculpt === 'hair'), p = o.geometry.attributes.position, ix = o.geometry.index, Tr = [];
  for (let k = 0; k < ix.count; k += 3) { const v = [0, 1, 2].map(q => { const i = ix.getX(k + q); return [p.getX(i), p.getY(i), p.getZ(i)]; }); if (v.every(a => a[2] > 0.1)) Tr.push(v); }
  const ins = (x, y, [a, b, c]) => { const d = (p1, p2) => (x - p2[0]) * (p1[1] - p2[1]) - (p1[0] - p2[0]) * (y - p2[1]), d1 = d(a, b), d2 = d(b, c), d3 = d(c, a); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
  const out = []; for (let x = -0.15; x <= 0.15; x += 0.006) { let y = 0.46; while (y > 0.3 && Tr.some(t => ins(x, y, t))) y -= 0.002; out.push(y); } return out; };
{ const A0 = load('/tmp/base131.html'), a0 = A0.build(false), e0 = edge(a0), e1 = edge(b), j = e => Math.max(...e.slice(1).map((y, i) => Math.abs(y - e[i]))), r = e => Math.max(...e) - Math.min(...e);
  ok(j(e1) < 0.012 && j(e1) < j(e0) && r(e1) > 0.01, `fringe edge: biggest step ${j(e0).toFixed(3)} -> ${j(e1).toFixed(3)}, still uneven (range ${r(e1).toFixed(3)})`); }
ok(b.userData.face === 1232 && b.userData.fine === 1231, 'userData face 1232 on top of fine 1231');
const s = stats(T, b); ok(s.tris < 45000 && s.meshes === 48 && s.mats === 11 && s.texs === 8 && s.trisFar < 14000, `budgets: ${s.tris} tris, ${s.meshes} meshes, ${s.mats} materials, ${s.texs} textures, far ${s.trisFar}`);
{ let bad = 0; b.traverse(o => { if (!o.isMesh) return; for (const a of ['position', 'uv']) { const t = o.geometry.attributes[a]; if (t) for (const x of t.array) if (!Number.isFinite(x)) bad++; } }); ok(bad === 0, 'finite positions and UVs'); }
console.log(fails ? `${fails} FAILED of ${n}` : `all ok (${n})`); process.exit(fails ? 1 : 0);
