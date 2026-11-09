// 1.2.49 / 1255: the crystal pick blade tip stays above the hand in screen
// space, and the forearm enters from the bottom-right — not a camera-down-
// the-forearm view with the hand on the blade.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {T} from './lib/pilot-native-r128.mjs';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const file = process.argv[2] || path.join(root, 'index.html');
const html = fs.readFileSync(file, 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes('handle1249'), 'haft is tagged handle1249 in the build');
ok(html.includes('isGlowPart') || html.includes('glow1249'), 'sock() skips glow shells in the build');
ok(html.includes('ratio * q.ratio * q.len') || html.includes('q.ratio * q.ratio * q.len'),
  'sock() scores by ratio^2 * len so a thinner haft beats a long blade');

const prismSrc = fs.readFileSync(path.join(root, 'tools/visuals-source/prism-1241.js'), 'utf8');
const gripSrc = fs.readFileSync(path.join(root, 'tools/content-source/grip-1222.js'), 'utf8');

const W = {THREE: T, QUALITY: '4k', HIGH: true};
new Function('window', 'THREE', 'document', 'Image', prismSrc)(W, T, undefined, undefined);
new Function('window', 'THREE', gripSrc)(W, T);
const P = W.__prism1241;
const G = W.__gs1222;
ok(P && typeof P.buildTool === 'function', 'prism buildTool is available');
ok(G && typeof G.sock === 'function', 'grip sock() is available');

const pick = P.buildTool('p761', 'crystalpurple');
ok(pick, 'built a purple crystal pick');
ok(pick.userData && pick.userData.__gs && pick.userData.__gs.authored, 'buildTool pins an authored haft socket');

const k = G.sock(pick);
ok(k && k.b && k.h, 'sock() returns a handle socket');
ok(k.authored || (k.b.y < 0.25 && k.h.y < 0.45),
  'socket stays on the haft (b.y=' + (k.b.y && +k.b.y.toFixed(3)) + ', h.y=' + (k.h.y && +k.h.y.toFixed(3)) + ')');
const gripY = k.b.y + (k.h.y - k.b.y) * 0.27;
ok(gripY < 0.35,
  'grip point is 27% up the haft, not on the blade (y=' + gripY.toFixed(3) + ')');

// Even if the authored pin is stripped, auto-detect must still pick the haft.
const clone = pick.clone(true);
clone.userData = Object.assign({}, pick.userData);
delete clone.userData.__gs;
clone.traverse(o => { if (o.userData) delete o.userData.__gs; });
const k2 = G.sock(clone);
ok(k2 && k2.b && k2.h, 'auto-detect still finds a socket without the authored pin');
const gripY2 = k2.b.y + (k2.h.y - k2.b.y) * 0.27;
ok(gripY2 < 0.40,
  'auto-detect grip stays on the haft (y=' + gripY2.toFixed(3) + ', b=' + JSON.stringify([k2.b.x, k2.b.y, k2.b.z].map(v => +v.toFixed(3))) + ')');

const qa = process.env.QA_COVER_FILE || (fs.existsSync('/workspace/qa/held-1257/webgl-results.json') ? '/workspace/qa/held-1257/webgl-results.json' : (fs.existsSync('/workspace/qa/held-1256/webgl-results.json') ? '/workspace/qa/held-1256/webgl-results.json' : '/workspace/qa/held-1255/webgl-results.json'));
if (fs.existsSync(qa)) {
  const doc = JSON.parse(fs.readFileSync(qa, 'utf8'));
  const results = doc.results || {};
  const shots = ['fp-p761', 'fp-p761-air', 'fp-p761-wall'].filter(k => results[k]);
  // Some studios only shoot fp-p761.
  const keys = shots.length ? shots : Object.keys(results).filter(k => /p761|pick/.test(k) && !k.includes('reload') && k.startsWith('fp-'));
  ok(keys.length > 0, 'QA results include at least one first-person pick shot');
  for (const f of keys) {
    const d = results[f] || {};
    const pf = d.pickFrame;
    ok(pf, f + ' has a pickFrame probe');
    if (!pf) continue;
    ok(pf.tipAboveHand,
      f + ' blade tip is above the hand in screen space' +
      (pf.tipNdc && pf.handNdc ? ' (tipY=' + pf.tipNdc[1] + ' handY=' + pf.handNdc[1] + ')' : ''));
    ok(pf.forearmBR,
      f + ' forearm enters from the bottom-right' +
      (pf.foCam || pf.upCam ? ' (foCam=' + JSON.stringify(pf.foCam) + ' upCam=' + JSON.stringify(pf.upCam) + ')' : ''));
  }
} else {
  console.log('skip qa dumps (' + qa + ' not present yet)');
}

console.log('ok ' + n + ' assertions');
