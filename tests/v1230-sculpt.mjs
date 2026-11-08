// Local sculpt pass (after v1.2.29): the third person player is reshaped into lofted anatomical surfaces. Compares the built model with
// main (04259ef) through the game's own TP-HD builder: cross sections that change along the body, no block head or face slab left,
// finite normals and UVs, the same joints and grips, bounded triangles, meshes and materials.
import fs from 'node:fs'; import {execFileSync} from 'node:child_process'; import {load, stats} from './lib/tph-harness.mjs';
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const base = '/tmp/tph-base-04259ef.html'; if (!fs.existsSync(base)) fs.writeFileSync(base, execFileSync('git', ['show', '04259ef:index.html'], {cwd: new URL('..', import.meta.url), maxBuffer: 1 << 28}));
const A = load(base), B = load(new URL('../index.html', import.meta.url).pathname), T = B.T, a = A.build(false), b = B.build(false); a.updateMatrixWorld(true); b.updateMatrixWorld(true);
const sa = stats(T, a), sb = stats(T, b);
// vertices of the meshes directly under a group, in that group's space (head space for the head, and so on)
const verts = (grp, f) => { const out = [], v = new T.Vector3(), inv = new T.Matrix4().copy(grp.matrixWorld).invert(); grp.updateMatrixWorld(true);
  for (const o of grp.children) { if (!o.isMesh || !o.visible || (f && !f(o))) continue; const m = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld), p = o.geometry.attributes.position; for (let i = 0; i < p.count; i++) out.push(v.fromBufferAttribute(p, i).applyMatrix4(m).clone()); } return out; };
const band = (vs, y, h) => vs.filter(p => Math.abs(p.y - y) < (h || 0.012));
const W = vs => vs.reduce((m, p) => Math.max(m, Math.abs(p.x)), 0), Zf = vs => vs.reduce((m, p) => Math.max(m, p.z), -9), Zb = vs => vs.reduce((m, p) => Math.max(m, -p.z), -9);
const skinHead = g => verts(g.userData.head, o => !Array.isArray(o.material) ? o.material.map && o.material.roughness === 0.48 : true);
// 1. head: no block, a sculpted skull with a face
const hasBox = (g, minDim) => { let k = 0; g.traverse(o => { if (o.isMesh && o.geometry.type === 'BoxGeometry') { const q = o.geometry.parameters; if (Math.min(q.width, q.height, q.depth) >= minDim) k++; } }); return k; };
ok(hasBox(a.userData.head, 0.1) >= 1 && hasBox(b.userData.head, 0.04) === 0, 'block head and hair slabs gone (big boxes on the head ' + hasBox(a.userData.head, 0.1) + ' -> ' + hasBox(b.userData.head, 0.04) + ')');
ok(!b.userData.head.children.some(o => o.isMesh && Array.isArray(o.material)), 'no six sided face block (no multi material cube on the head)');
const H = skinHead(b), H0 = skinHead(a);
const wJaw = W(band(H, 0.06)), wCheek = W(band(H, 0.2)), wTemple = W(band(H, 0.3)), wTop = W(band(H, 0.45));
ok(wJaw < wCheek - 0.03 && wTop < wTemple - 0.015, `skull and jaw taper: half widths jaw ${wJaw.toFixed(3)}, cheek ${wCheek.toFixed(3)}, temple ${wTemple.toFixed(3)}, crown ${wTop.toFixed(3)}`);
const oW = [0.15, 0.25, 0.35].map(y => W(band(H0, y, 0.035))); ok(Math.max(...oW) - Math.min(...oW) < 0.005, 'old head was the same width top to bottom (' + oW.map(x => x.toFixed(3)).join(', ') + ')');
const mid = H.filter(p => Math.abs(p.x) < 0.012), nose = Zf(band(mid, 0.19, 0.015)), bridge = Zf(band(mid, 0.27, 0.01)), eye = Zf(band(H.filter(p => Math.abs(Math.abs(p.x) - 0.1) < 0.012), 0.27, 0.012)), chin = Zf(band(mid, 0.05, 0.012)), under = Zf(band(mid, -0.01, 0.01));
ok(nose - eye > 0.035 && nose - bridge > 0.01 && chin - under > 0.04, `real profile: nose tip ${nose.toFixed(3)}, bridge ${bridge.toFixed(3)}, eye socket ${eye.toFixed(3)}, chin ${chin.toFixed(3)}, under the jaw ${under.toFixed(3)}`);
const prof = [0.06, 0.12, 0.19, 0.27, 0.32, 0.4].map(y => Zf(band(mid, y, 0.01)));
ok(Math.max(...prof) - Math.min(...prof) > 0.03, 'front profile changes along the face: ' + prof.map(x => x.toFixed(3)).join(' '));
{ const blk = a.userData.head.children.find(o => o.isMesh && Array.isArray(o.material)), p = blk.geometry.attributes.position, zs = []; for (let i = 0; i < p.count; i++) if (p.getZ(i) > 0.15 && Math.abs(p.getX(i)) < 0.12 && Math.abs(p.getY(i)) < 0.12) zs.push(p.getZ(i)); ok(zs.length > 10 && Math.max(...zs) - Math.min(...zs) < 0.003, 'old face was one flat slab (' + zs.length + ' front points within ' + ((Math.max(...zs) - Math.min(...zs)) * 1000).toFixed(1) + ' mm)'); }
const cw = (y) => { const r = band(H.filter(p => p.z > 0.05 && Math.abs(p.z - 0.17) < 0.04), y, 0.012); return W(r); }, cheekbone = cw(0.215), hollow = cw(0.13); ok(cheekbone > hollow + 0.008, `cheekbones stand out: face half width ${cheekbone.toFixed(3)} at the cheekbone, ${hollow.toFixed(3)} at the hollow below`);
// face texture placement: the projected UVs put the painted eyes where the eyelids are
{ const hm = b.userData.head.children.find(o => o.userData.face), p = hm.geometry.attributes.position, u = hm.geometry.attributes.uv; let best = 9, uv = null; for (let i = 0; i < p.count; i++) { const d = Math.hypot(p.getX(i) - 0.1, p.getY(i) - 0.27); if (p.getZ(i) > 0.1 && d < best) { best = d; uv = [u.getX(i), u.getY(i)]; } }
  const lid = b.userData.lids[1].position; ok(uv && Math.abs(uv[0] - (lid.x + 0.22) / 0.44) < 0.04 && Math.abs(uv[1] - (lid.y - 0.01) / 0.48) < 0.04, 'painted eye under the eyelid: uv ' + uv.map(x => x.toFixed(3)).join(',') + ', lid at ' + lid.x + ',' + lid.y);
  const fz = Zf(H.filter(p => Math.abs(p.x - lid.x) < 0.02 && Math.abs(p.y - lid.y) < 0.02)); ok(Math.abs(fz - lid.z) < 0.03, 'eyelid sits on the eye socket (lid z ' + lid.z + ', surface ' + fz.toFixed(3) + ')'); }
// 2. hair follows the skull and starts on a hairline
{ const hv = verts(b.userData.head, o => o.material.roughness === 0.55); const lowFront = Math.min(...hv.filter(p => p.z > 0.15 && Math.abs(p.x) < 0.05).map(p => p.y)), lowBack = Math.min(...hv.filter(p => p.z < -0.15).map(p => p.y));
  ok(lowFront > 0.36 && lowBack < 0.12, `hairline: front fringe down to ${lowFront.toFixed(3)}, nape down to ${lowBack.toFixed(3)}`); }
// 3. torso: shoulders, chest and waist
{ const tv = verts(b.userData.torso, o => o.material.roughness === 0.88), t0 = verts(a.userData.torso, o => o.material.roughness === 0.88);
  const ws = [1.0, 1.24, 1.4].map(y => W(band(tv, y, 0.01))), dc = Zf(band(tv.filter(p => Math.abs(p.x) > 0.06), 1.26, 0.01)), dw = Zf(band(tv.filter(p => Math.abs(p.x) > 0.06), 1.0, 0.01));
  ok(ws[2] - ws[0] > 0.07 && ws[1] > ws[0], 'torso widens waist to shoulder: ' + ws.map(x => x.toFixed(3)).join(' -> ') + ' (old ' + [1.0, 1.24, 1.4].map(y => W(band(t0, y, 0.01)).toFixed(3)).join(' -> ') + ')');
  ok(dc > dw + 0.015, `chest in front of the waist: ${dc.toFixed(3)} vs ${dw.toFixed(3)}`); }
// 4. limbs: forearm flattens at the wrist, calf swells at the back, deltoid cap over the shoulder
{ const el = b.userData.fore[1], fv = verts(el, o => !o.userData.hand && o.material.roughness === 0.48), wr = band(fv, -0.27, 0.01); ok(W(wr) / Zf(wr) > 1.25, 'wrist is wider than deep: ' + (W(wr) / Zf(wr)).toFixed(2));
  const kn = b.userData.shin[0], sv = verts(kn, o => o.material.roughness === 0.95), calf = Zb(band(sv, -0.15, 0.012)), ankle = Zb(band(sv, -0.3, 0.012)); ok(calf - ankle > 0.02 && calf > Zf(band(sv, -0.15, 0.012)) + 0.01, `calf swells at the back: ${calf.toFixed(3)} at the calf, ${ankle.toFixed(3)} at the ankle`);
  const uv2 = verts(b.userData.arms[1], o => o.material.roughness === 0.88); ok(Math.max(...uv2.map(p => p.y)) > 0.05 && !b.userData.arms[1].children.some(o => o.isMesh && o.geometry.type === 'SphereGeometry'), 'shoulder is the rounded top of the arm, not a ball on a peg'); }
// 5. clean geometry
{ let bad = 0, cnt = 0; b.traverse(o => { if (!o.isMesh || o.geometry.type === 'CapsuleGeometry') return; const ge = o.geometry; for (const k of ['position', 'normal', 'uv']) { const at = ge.attributes[k]; if (!at) continue; for (const x of at.array) if (!Number.isFinite(x)) bad++; } const nn = ge.attributes.normal; if (nn) for (let i = 0; i < nn.count; i++) { cnt++; const l = Math.hypot(nn.getX(i), nn.getY(i), nn.getZ(i)); if (Math.abs(l - 1) > 0.02) bad++; } }); ok(bad === 0, 'positions, normals and UVs finite, normals unit length (' + cnt + ' normals; finger capsules left out, their pole normals are zero in three r160 on main too)'); }
{ let out = 0, tot = 0; b.traverse(o => { if (!o.isMesh || !o.geometry.userData || !o.geometry.userData.sculpt) return; const p = o.geometry.attributes.position, nn = o.geometry.attributes.normal; o.geometry.computeBoundingBox(); const c = new T.Vector3(); o.geometry.boundingBox.getCenter(c); for (let i = 0; i < p.count; i += 3) { tot++; const dx = p.getX(i) - c.x, dz = p.getZ(i) - c.z; if (dx * nn.getX(i) + dz * nn.getZ(i) < -0.002 && Math.hypot(dx, dz) > 0.03) out++; } }); ok(tot > 1000 && out / tot < 0.05, 'sculpted surfaces face outward (' + out + ' of ' + tot + ' inward)'); }
// 6. joints, grips, lids, hands and LOD kept
const J = g => { const u = g.userData, r = []; for (const p of u.arms) r.push(p.position.toArray(), p.userData.el.position.toArray(), p.userData.grip.position.toArray()); for (const l of u.legs) r.push(l.position.toArray(), l.userData.kn.position.toArray()); r.push(u.head.position.toArray()); return JSON.stringify(r); };
ok(J(a) === J(b), 'shoulder, elbow, grip, hip, knee and neck joints unchanged');
ok(b.userData.lids.length === 2 && b.userData.lids.every(l => !l.visible) && b.userData.kilts.length === a.userData.kilts.length, 'eyelids (hidden until a blink) and kilt pieces kept');
ok(b.userData.fore.every(el => { const h = el.children.find(c => c.userData.hand); return h && h.userData.fg && h.userData.fg.length === 4 && h.children.length === 5; }), 'each hand keeps four fingers and a thumb');
ok(sb.meshes <= sa.meshes && sb.mats <= sa.mats, `meshes ${sa.meshes} -> ${sb.meshes}, materials ${sa.mats} -> ${sb.mats}`);
ok(sb.tris < 40000 && sb.trisFar < sb.tris * 0.5, `triangles near ${sa.tris} -> ${sb.tris}, far ${sa.trisFar} -> ${sb.trisFar}`);
{ const hm = b.userData.head.children.find(o => o.userData.face), e = b.userData.lod.find(x => x[0] === hm); ok(e && (e[2].attributes.position.count < e[1].attributes.position.count / 2), 'head has a coarser copy far away'); }
// 7. HD armour still fits (helmet on the head, chest on the torso)
{ const arm = []; const u = b.userData; B.fit(null, u, 0, new T.MeshStandardMaterial()); B.fit(null, u, 1, new T.MeshStandardMaterial()); ok(u.armourParts.length >= 7, 'helmet and chest armour fitted to the new body (' + u.armourParts.length + ' parts)'); }
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok (' + n + ')');
