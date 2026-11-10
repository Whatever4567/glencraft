// 1.2.57: third person must use the approved Scottish / pilot model
// (scottish-base-v2 + v15 crystal armour), not the v1.2.26 rounded body.
// The leftover hd-swap may not replace a loaded pilot; fallback only after
// a genuine load error.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const htmlPath = process.argv[2] || path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const inst = fs.readFileSync(path.join(root, 'tools/pilot-model-source/tp-pilot-1257.js'), 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes('installApprovedPilotV1') && html.includes('__pilot1235') && html.includes('scottish:true'),
  'approved Scottish/pilot installer is in the bundle');
ok(html.includes('assets/models/scottish-base-v2/')
  && html.includes('scottish-base-with-jetpack.glb')
  && html.includes('crystal-armour.glb'),
  'third person loads scottish-base-v2 and v15 crystal armour');
ok(html.includes('__mergeScottish1236'), 'Scottish armour merge is present');
ok(html.includes('GLX-V1257') && html.includes('__v1257tp') && inst.includes('genuineLoadError'),
  '1.2.57 TP ensure module is baked and only falls back on a genuine load error');

// The old 3 s swap must not tear down a loaded or in-flight Scottish model,
// and any rebuild must go through buildPlayerModel (so attach still runs).
ok(html.includes('!worldModel.userData.pilot') && html.includes('!worldModel.userData.pilotPending'),
  'worldModel swap skips an attached or pending pilot');
ok(html.includes('!charModel.userData.pilot') && html.includes('!charModel.userData.pilotPending'),
  'charModel swap skips an attached or pending pilot');
ok(html.includes('worldModel = buildPlayerModel(false)') && html.includes('charModel = buildPlayerModel(true)'),
  'if the swap does run, it rebuilds through buildPlayerModel so attach hooks fire');
ok(!/worldModel = build\(false\); worldModel.visible/.test(html),
  'swap no longer assigns worldModel = build(false) directly');

// Crystal armour stays the shipped v15 / v2 assets, not a later experiment.
ok(html.includes('crystal-armour.glb') && !html.includes('sheep3'),
  'crystal armour GLB is present and sheep3 is not in this release');
ok(fs.existsSync(path.join(root, 'assets/models/scottish-base-v2/scottish-base-with-jetpack.glb'))
  && fs.existsSync(path.join(root, 'assets/models/scottish-base-v2/crystal-armour.glb')),
  'Scottish base and crystal armour files exist on disk');

console.log('v1257-tp-pilot ok', n);
