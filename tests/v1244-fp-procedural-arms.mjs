// 1.2.44: procedural FP arms (mcArm/__fpa/fist) are the live first-person rig again.
// Held1240FpArms is NOT the main arms. Held items stay parented and visible on the
// restored hand. Arms are retextured from the character skin + cream sleeve.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {T, load, builtRuntime, legacy} from './lib/pilot-native-r128.mjs';

const file = process.argv[2] || 'index.html';
const html = fs.readFileSync(file, 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes("const GAME_VERSION = '1.2.46';") || html.includes("const GAME_VERSION = '1.2.44';"), 'GAME_VERSION is 1.2.46 or 1.2.44');
ok(html.includes('<!-- glencraft-build: b1246-v1.2.46 -->') || html.includes('<!-- glencraft-build: b1244-v1.2.44 -->'), 'build marker is b1246 or b1244');
ok(html.includes('retextureProceduralArms'), 'retextureProceduralArms is in the build');
ok(html.includes('W.__fpaOff = 0'), 'helper clears __fpaOff so procedural HD arms run');
ok(html.includes('do not drive Held1240FpArms as the main') || html.includes('NOT Held1240FpArms as the main') || html.includes('NOT\n * Held1240FpArms'), 'source documents procedural arms are main');
ok(!/Retire every pre-1\.2\.40 first-person arm so only Held1240FpArms draws/.test(html), 'old retirement comment is gone');

const helper = fs.readFileSync(new URL('../tools/pilot-model-source/held-fp-1240.js', import.meta.url), 'utf8');
ok(helper.includes("version: '1.2.44'"), 'held-fp helper is the 1.2.44 revision');
ok(helper.includes('retextureProceduralArms') && helper.includes('sampleCharacterLooks'), 'helper samples character looks and retextures procedural arms');

const W = {THREE: T, __fpaOff: 1};
new Function('window', helper)(W);
const H = W.__held1240;
ok(H && typeof H.hideProceduralFp === 'function' && typeof H.stepFp === 'function' && typeof H.retextureProceduralArms === 'function', 'helper exposes hide/step/retexture');

const camera = new T.PerspectiveCamera(70, 1, 0.1, 100);
const hand = new T.Group(); hand.name = 'hand'; camera.add(hand);
const armPivot = new T.Group(); hand.add(armPivot);
const fist = new T.Mesh(new T.BoxGeometry(0.14, 0.14, 0.14), new T.MeshLambertMaterial({color: 0xd9a77f}));
fist.name = 'fist'; armPivot.add(fist);
const armMesh = new T.Mesh(new T.BoxGeometry(0.15, 0.15, 0.55), new T.MeshLambertMaterial({color: 0xe9e2d4}));
armMesh.name = 'armMesh'; armPivot.add(armMesh);
const held = new T.Group(); held.name = 'held'; held.position.set(0, 0.04, -0.24); armPivot.add(held);
const grabHaggis = new T.Group(); grabHaggis.visible = false; armPivot.add(grabHaggis);
const mcArm = new T.Group(); mcArm.name = 'mcArm';
mcArm.add(new T.Mesh(new T.BoxGeometry(0.13, 0.13, 0.36), new T.MeshLambertMaterial({color: 0xd4a07a})));
hand.add(mcArm); W.mcArm = mcArm;
const fpaRig = new T.Group(); fpaRig.name = '__fpaRig';
const fpaMesh = new T.Mesh(new T.BoxGeometry(0.07, 0.28, 0.07), new T.MeshStandardMaterial({color: 0xe9e2d4}));
fpaRig.add(fpaMesh); camera.add(fpaRig);
W.__fpa = {rig: () => fpaRig};

// Install a Held1240FpArms clone and ensure stepFp hides it while procedural stay on
const dir = new URL('../assets/models/scottish-base-v2/', import.meta.url);
let eq = [0, 0, 0, 0, 0];
const tier = id => id >= 129 && id <= 132 ? 'diamond' : id >= 112 && id <= 115 ? 'gold' : id >= 108 && id <= 111 ? 'iron' : 'copper';
const R = builtRuntime({
  scottish: true, life: false, equipment: () => eq, tier, distance: () => 0,
  load: async name => {
    const far = name === 'pilot-far.glb';
    const [b, o] = await Promise.all([
      load(new URL(far ? 'scottish-far.glb' : 'scottish-base-with-jetpack.glb', dir)),
      load(new URL(far ? 'crystal-armour-far.glb' : 'crystal-armour.glb', dir))
    ]);
    return R.combineScottish(b, o, far);
  }
});
const B = legacy(eq);
const model = B.build(false);
await R.attach(model);
ok(!R.error && model.userData.pilot, 'character attaches for retexture sample');
W.__pilot1235 = R;
const template = R.templates[0];
const fp = H.installFpOnCamera(camera, template, false);
ok(fp && fp.name === 'Held1240FpArms', 'Held1240FpArms can still be built');
fp.visible = true;

// Simulate globals used by stepFp
globalThis.camera = camera;
globalThis.hand = hand;
globalThis.held = held;
globalThis.fist = fist;
globalThis.armMesh = armMesh;
globalThis.armPivot = armPivot;
globalThis.grabHaggis = grabHaggis;
globalThis.camMode = 0;
globalThis.started = true;
globalThis.heldId = 0;
globalThis.selId = 0;

H.stepFp(0.016);
ok(W.__fpaOff === 0, 'stepFp clears __fpaOff');
ok(fp.visible === false, 'Held1240FpArms is hidden by stepFp');
ok(fist.visible !== false, 'procedural fist remains visible');
ok(mcArm.visible !== false, 'mcArm remains visible');
ok(fpaRig.visible !== false, 'HD __fpa rig remains visible');

// Held item parented + visible on restored hand
const pick = new T.Mesh(new T.BoxGeometry(0.05, 0.4, 0.05), new T.MeshLambertMaterial({color: 0xb08a55}));
pick.userData.tool = true; pick.name = 'pickaxeStandin';
held.add(pick);
held.visible = true; pick.visible = true;
H.stepFp(0.016);
ok(held.parent === armPivot || held.parent === hand, 'held group stays under procedural armPivot/hand, not Held1240FpArms');
let underNew = false, p = held.parent;
while (p) { if (p.name === 'Held1240FpArms') { underNew = true; break; } p = p.parent; }
ok(!underNew, 'held is not parented under Held1240FpArms');
ok(pick.visible && held.visible, 'held pickaxe mesh is visible');

// Steal held onto Held1240 then stepFp must reclaim it
fp.add(held); fp.visible = true;
H.stepFp(0.016);
ok(held.parent === armPivot || held.parent === hand, 'stepFp reclaims held from Held1240FpArms back onto procedural host');
ok(fp.visible === false, 'Held1240FpArms stays hidden after reclaim');

// Retexture from character
const retex = H.retextureProceduralArms(template);
ok(retex && (retex.skin || retex.sleeve), 'retexture sampled skin and/or sleeve from character (' + JSON.stringify(retex) + ')');

// Catalog still has all holdables for 3p / pose API
ok(H.CATALOG && H.CATALOG.length >= 40, 'holdable catalog still present (' + H.CATALOG.length + ')');

console.log('PASS ' + n + ' v1244 procedural-FP-arms checks');
