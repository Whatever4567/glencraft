// v1.2.24 local candidate: Disable foliage (real module, real click on the settings buttons, save and reload), ragdoll floor follows the ground,
// time box screen no longer on its frame face. linkedom DOM + plain objects; this proves logic and wiring, not FPS or pixels.
import fs from 'node:fs'; import assert from 'node:assert';
import {parseHTML} from '/workspace/domtools/node_modules/linkedom/esm/index.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const fol = cut('/* GLX-FOL1224', '/* GLX-EQ1222');
function boot(store) {
  const {document} = parseHTML('<html><body><div class="set inline"><div class="seg" id="mobSeg"></div></div></body></html>');
  const M = () => ({isMaterial: true, visible: true, userData: {}});
  const G = {document, SET: JSON.parse(store.glen_set || '{}'), saveSet() { store.glen_set = JSON.stringify(G.SET); }, T: {COBWEB: 70, FIRE: 71},
    PLANT_MATS: {15: M(), 60: M(), 20: M(), 70: M(), 71: M()}, BLOCK_MATS: {9: M(), 8: M(), 146: [M(), M()]}, LEAFY: new Uint8Array(1024), setInterval: (f) => { (G.ticks = G.ticks || []).push(f); return 1; }, clearInterval() {}};
  G.LEAFY[9] = 1; G.LEAFY[146] = 1; G.window = G;
  new Function('with(this){' + fol + '}').call(G); G.ticks.forEach(f => f()); return G; }
{ const store = {}; let G = boot(store); const U = G.__fol1224; ok(U.err === null, 'module loads with no error');
  ok(!!G.document.getElementById('folSeg') && /Disable foliage/.test(G.document.body.innerHTML), 'Disable foliage row shown next to Disable mobs');
  ok(!G.SET.noFoliage && G.document.querySelector('[data-testid="settings-folSeg-0"]').classList.contains('on'), 'default is off');
  G.document.querySelector('[data-testid="settings-folSeg-1"]').click();
  const plants = [G.PLANT_MATS[15], G.PLANT_MATS[60], G.PLANT_MATS[20], G.BLOCK_MATS[9], ...G.BLOCK_MATS[146]];
  ok(plants.every(m => !m.visible), 'On hides grass, flowers, crops and every leaf material'); ok(G.PLANT_MATS[70].visible && G.PLANT_MATS[71].visible && G.BLOCK_MATS[8].visible, 'cobweb, fire and logs stay');
  ok(JSON.parse(store.glen_set).noFoliage === true, 'saved in glen_set');
  G = boot(store); ok([G.PLANT_MATS[15], G.BLOCK_MATS[9]].every(m => !m.visible) && G.document.querySelector('[data-testid="settings-folSeg-1"]').classList.contains('on'), 'after reload the setting is restored and applied');
  G.document.querySelector('[data-testid="settings-folSeg-0"]').click(); ok([G.PLANT_MATS[15], G.PLANT_MATS[60], G.BLOCK_MATS[9], ...G.BLOCK_MATS[146]].every(m => m.visible), 'Off brings every plant back');
  const pre = G.PLANT_MATS[16] = {isMaterial: true, visible: true, userData: {}}; G.document.querySelector('[data-testid="settings-folSeg-1"]').click(); ok(!pre.visible, 'a plant material registered later is covered too'); }
{ // ragdoll ground
  const rag = cut('/* GLX-RAG1222', '/* GLX-'.length ? '\n/* GLX-' : ''); const G = {THREE: {Quaternion: class { setFromAxisAngle() { return this; } }}, P: {x: 50, y: 10, z: 50}}; G.window = G;
  new Function('with(this){' + rag.slice(0, rag.indexOf('})();') + 5) + '}').call(G); const R = G.__rag1222;
  const solid = new Set(['5,4,5', '6,1,5']); const sol = (x, y, z) => solid.has(Math.floor(x) + ',' + Math.floor(y) + ',' + Math.floor(z));
  const c = {gy: 5, kind: 'body'}, r = {}; ok(R.ground(c, r, {x: 5.5, y: 5.2, z: 5.5}, sol) === 5, 'floor on the block it died on');
  ok(R.ground(c, r, {x: 6.5, y: 5.2, z: 5.5}, sol) === 2, 'thrown off the ledge: floor drops to the ground below (was stuck at the death height)');
  const n = R.gLook; R.ground(c, r, {x: 6.7, y: 4, z: 5.2}, sol); ok(R.gLook === n, 'no new lookup inside the same block column'); }
ok(html.includes('scr.position.z = 0.039; sm.polygonOffset = true') && !html.includes('scr.position.z = 0.035;'), 'time box screen moved off its frame face');
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok');
