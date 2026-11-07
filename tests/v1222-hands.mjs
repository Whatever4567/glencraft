// v1.2.22 t921-t924: the hands on the real guns and tools, run through the game's own chain (base hand rig + setHeld + updateHand,
// the HD pick builder with its 761 scale, the procedural guns + the real GLB swap (C322), the viewmodel (C350), the HD arms (FPA)
// and the grip modules). Measured against the real model surfaces (dense triangle samples) - not against the helper sockets.
import assert from 'node:assert'; import {run} from './lib/hands-run.mjs';
const ok = (c, m) => { assert(c, m); console.log('ok', m); };
const mx = (a, k) => Math.max(...a.map(r => r[k]).filter(v => typeof v === 'number')), mn = (a, k) => Math.min(...a.map(r => r[k]).filter(v => typeof v === 'number'));
const steady = ['idle', 'recoil', 'sprint', 'aim', 'unaim', 'menu'];
for (const w of ['pistol', 'rifle', 'pick']) {
  const {recs, G, H, F} = await run(w); const vis = recs.filter(r => !r.hidden), st = vis.filter(r => steady.includes(r.phase));
  ok(!F.err && !G.__c322.err && !G.__gs1222.err, w + ': no errors in the hand chain');
  ok(vis.every(r => r.fin && (r.finL !== false)), w + ': elbows and hands finite in every frame (' + vis.length + ' frames)');
  ok(mx(vis, 'dE') <= 0.13, w + ': elbow moves at most 13 cm a frame, also through switching and the near straight reach (max ' + mx(vis, 'dE').toFixed(3) + ')');
  ok(mx(vis.filter(r => r.phase !== 'swing' && r.visPrev), 'dH') <= 0.11, w + ': no hand pops between frames (max ' + mx(vis.filter(r => r.phase !== 'swing' && r.visPrev), 'dH').toFixed(3) + ' m)');
  const g = w === 'pick' ? null : H.held.children[0];
  if (g) { ok(G.__c322.swapped >= 1 && g.userData.c322 && g.userData.anchHD, w + ': real GLB model swapped in and HD anchors rebuilt');
    ok(['grip', w === 'pistol' ? 'sup' : 'fore', w === 'pistol' ? 'well' : 'bolt'].every(n => g.userData.anch[n] && g.userData.anch[n].parent), w + ': grip anchors survive the swap');
    ok(st.every(r => r.anG === 1), w + ': right hand uses the anchor on the real model (not the old fallback spot)'); }
  if (w === 'pistol') ok(G.__c322.magFix === 1, 'pistol: spare magazine moved into the grip');
  const gR = [mn(st, 'gapR'), mx(st, 'gapR')], lim = w === 'rifle' ? 0.012 : w === 'pistol' ? 0.02 : 0.015;
  ok(gR[0] > -0.004 && gR[1] <= lim, w + ': right palm on the handle surface, gap ' + gR.map(v => (v * 1000).toFixed(0)).join('..') + ' mm');
  ok(mx(st, 'penR') <= 0.008, w + ': right fingertips at most 8 mm into the model (max ' + (mx(st, 'penR') * 1000).toFixed(0) + ' mm)');
  ok(mx(st, 'wR') <= 0.9, w + ': right wrist bend at most 52 degrees (max ' + (mx(st, 'wR') * 57.3).toFixed(0) + ')');
  // thumb side, in the item own frame (gun rig: +x right, +y up, -z muzzle)
  const last = st[st.length - 1];
  if (g) { const rig = g.userData.rig, toRig = p => rig.worldToLocal(H.held.localToWorld(p.clone())), pc = toRig(last.R.palmC), th = toRig(last.R.thumb), A = g.userData.anch.grip.position;
    ok(pc.x > A.x && th.x < pc.x, w + ': right palm on the right of the grip, right thumb wraps to the left (palm x ' + pc.x.toFixed(3) + ', thumb x ' + th.x.toFixed(3) + ')');
    if (w === 'rifle') { const lp = toRig(last.L.palmC), lt = toRig(last.L.thumb), Fo = g.userData.anch.fore.position;
      ok(lp.y < Fo.y && lt.x < lp.x + 0.02, 'rifle: left palm under the fore stock, left thumb on the left side'); ok(mx(st, 'gapL') <= 0.025 && mx(st, 'wL') <= 0.95, 'rifle: left hand on the fore stock (gap ' + (mx(st, 'gapL') * 1000).toFixed(0) + ' mm, wrist ' + (mx(st, 'wL') * 57.3).toFixed(0) + ' deg)');
      const rl = vis.filter(r => r.phase === 'reload'); ok(new Set(rl.map(r => r.rph)).size >= 4 && mx(rl, 'dL') <= 0.06 && mx(rl, 'wL') <= 0.95, 'rifle: bolt reload runs reach/grab/cycle/return, left hand smooth (max ' + mx(rl, 'dL').toFixed(3) + ' m a frame), wrist ' + (mx(rl, 'wL') * 57.3).toFixed(0) + ' deg');
      console.log('note rifle: left fingertips overlap the stock wrist by up to', (mx(rl, 'penL') * 1000).toFixed(0), 'mm during the bolt pull'); }
    if (w === 'pistol') { const am = vis.filter(r => r.phase === 'aim'); ok(am.some(r => r.two) && mx(am, 'wL') <= 0.95, 'pistol: aiming brings the support hand, wrist ' + (mx(am, 'wL') * 57.3).toFixed(0) + ' deg');
      const rl = vis.filter(r => r.phase === 'reload'); ok(['release', 'belt', 'insert', 'return'].every(p => rl.some(r => r.rph === p)) && mx(rl, 'dL') <= 0.08, 'pistol: mag reload goes release/belt/insert/return with no left hand jump (max ' + mx(rl, 'dL').toFixed(3) + ' m a frame, was 0.45)');
      console.log('note pistol: during insert the left fingertips overlap the static grip by up to', (mx(rl, 'penL') * 1000).toFixed(0), 'mm and the left wrist reaches', (mx(rl, 'wL') * 57.3).toFixed(0), 'deg'); }
    const cx = vis.filter(r => r.phase === 'reload-cancel'); ok(mx(cx, 'dL') <= 0.12 && cx[cx.length - 1].rph !== 'insert', w + ': reload cancelled mid way returns the hand with no jump'); }
  else { const P = H.held.children[0], k = G.__gs1222.sock(P); const toP = p => P.worldToLocal(H.held.localToWorld(p.clone())), ax = k.h.clone().sub(k.b).normalize();
    const side = p => { const v = toP(p).sub(k.b); return v.sub(ax.clone().multiplyScalar(v.dot(ax))); };
    ok(side(last.R.thumb).dot(side(last.R.palmC)) < 0, 'pick: thumb and palm on opposite sides of the haft (a closed fist round it)');
    ok(mx(vis.filter(r => r.phase === 'swing'), 'wR') <= 0.85 && mx(vis.filter(r => r.phase === 'swing'), 'gapR') <= 0.015, 'pick: hand stays on the haft through the swing (wrist ' + (mx(vis.filter(r => r.phase === 'swing'), 'wR') * 57.3).toFixed(0) + ' deg)');
    ok(G.__fpa.reach > 0.74, 'pick: reach test went past full arm length (' + G.__fpa.reach.toFixed(2) + ' m) with the elbow finite'); }
  ok(recs.some(r => r.phase === 'death' && r.hidden) && recs.some(r => r.phase === 'menu' && r.hidden), w + ': arms hide on death and in menus, and come back without a flash');
}
console.log('hands: all ok');
