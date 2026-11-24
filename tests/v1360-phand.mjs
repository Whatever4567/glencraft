// t1360: closed preset grip poses on the first-person pistol (GLX-PHAND1360). Runs the built patch against stand-ins for
// hands-fp-1285 and GLX-PMAG1359: every hold in the table is a closed wrap (no half-open fingers), the idle grip is applied,
// the reload reads its table, and window.__noPhand1360 puts the 1.2.124 poses back.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html = fs.readFileSync(process.argv[2] || 'index.html', 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };
const a = html.indexOf('<script id="glx-phand1360">'); ok(a > 0, 'GLX-PHAND1360 is in the build');
ok(a > html.indexOf('<script id="glx-pmag1359">'), 'it loads after GLX-PMAG1359');
const src = html.slice(html.indexOf('>', a) + 1, html.indexOf('</script>', a));
const pm = html.slice(html.indexOf('<script id="glx-pmag1359">'), a);
ok(/PH && PH\.active && PH\.active\(\) && PH\.POSE \? PH\.POSE : POSE0/.test(pm), 'the magazine reload blends the preset table by stage (1.2.124 table kept as POSE0)');
const old = {p: [0.2, 0.9, 0.9, 0.9], d: [0.1, 0.8, 0.8, 0.8], t: [0.4, 0.3], tY: 0.1, tZ: 0.2};
const H = {POSES: {pistol: JSON.parse(JSON.stringify(old)), support: {p: [1, 1, 1, 1], d: [1, 1, 1, 1], t: [1, 1], tY: 0, tZ: 0}}, seat: {pistol: {y: 0.02}}};
const PM = {HF: {R: {side: 1, k: 3}, Lr: {d: 0, f: 0.07, fa: [1, 2, 3]}, faR: 0.6, faL: 0.45}, _poseOn: 0};
const W = {__handsFp1285: H, __pmag1359: PM};
new Function('window', 'setInterval', src.replace("(typeof window !== 'undefined' ? window : this)", '(window)'))(W, () => 0);
const U = W.__phand1360;
ok(U && U.active() && U.applied === 1 && !U.err, 'patch is live and applied');
const closed = (P, name, idx) => { for (let i = idx; i < 4; i++) ok(P.p[i] >= 1.5 && P.d[i] >= 1.3, name + ' finger ' + i + ' closed (p ' + P.p[i] + ', d ' + P.d[i] + ')'); };
closed(H.POSES.pistol, 'idle grip', 1);
ok(H.POSES.pistol.p[0] < 0.6, 'idle index lies along the frame, off the trigger wrap');
ok(H.seat.pistol.y === U.SEAT.y, 'glove seated higher on the grip');
for (const k of ['carry', 'flat', 'rack', 'home']) closed(U.POSE[k], k, 0);
closed(U.POSE.fist, 'reload fist', 1); ok(U.POSE.fist.p[0] >= 1.0, 'reload fist: index curled in to the guard');
ok(PM.HF.R.side === -1 && PM.HF.R.k === 3 && PM.HF.Lr.d === -0.04 && PM.HF.Lr.f === 0.07 && PM.HF.faR === 0.01, 'reload frames: palm on the grip side, rack hand down on the slide, cuff tucked');
PM._poseOn = 1; W.__noPhand1360 = 1; U.sync(); ok(U.applied === 1, 'never swaps the base pose mid-reload');
PM._poseOn = 0; U.sync();
ok(U.applied === 0 && JSON.stringify(H.POSES.pistol) === JSON.stringify(old) && H.seat.pistol.y === 0.02, '__noPhand1360 restores the 1.2.124 grip and seat');
ok(PM.HF.R.side === 1 && PM.HF.Lr.d === 0 && PM.HF.faR === 0.6, '__noPhand1360 restores the 1.2.124 reload frames');
delete W.__noPhand1360; U.sync(); ok(U.applied === 1 && H.POSES.pistol.p[2] >= 1.5, 'turning it back on re-applies');
console.log('v1360-phand: ' + n + ' passed');
