// 1.2.42: adaptive 4K UHD tier selection + dynamic scaler (CPU logic, not device FPS).
import fs from 'node:fs';
import assert from 'node:assert/strict';

const file = process.argv[2] || 'index.html';
const html = fs.readFileSync(file, 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes("const GAME_VERSION = '1.2.43';") || html.includes("const GAME_VERSION = '1.2.42';"), 'GAME_VERSION is 1.2.43 or 1.2.42');
ok(html.includes('__adapt4k1242') && html.includes('pickTier') && html.includes('__weakBoot1242'), 'adaptive 4K helper and weak-boot cap are in the build');
ok(html.includes('adaptive on phones') || html.includes('now adaptive on phones'), 'patch notes mention adaptive 4K UHD');
ok(!/adaptive[^\n]{0,80}popup/i.test(html) || html.includes('no popup') || html.includes('No popup'), 'adaptive path documents no popup');

const helper = fs.readFileSync(new URL('../tools/visuals-source/adaptive-4k-1242.js', import.meta.url), 'utf8');
const W = {devicePixelRatio: 3, touchMode: false};
new Function('window', 'navigator', 'renderer', 'DPR', 'HIGH', 'QUALITY', 'started', 'paused', 'SET', 'resize', 'updateLights', helper)(
  W,
  {userAgent: 'Mozilla/5.0', hardwareConcurrency: 16, deviceMemory: 16},
  null, 3, true, '4k', true, false, {rdist: 8}, () => {}
);
const U = W.__adapt4k1242;
ok(U && typeof U.pickTier === 'function' && typeof U.tick === 'function' && typeof U.capsFor === 'function', 'helper exposes pickTier / capsFor / tick');

ok(U.pickTier({android: false, mobile: false, cores: 16, mem: 16, gpu: 'NVIDIA GeForce RTX 4070'}) === 'full', 'strong desktop GPU -> full');
ok(U.pickTier({android: true, mobile: true, cores: 8, mem: 6, gpu: 'Adreno (TM) 740'}) === 'balanced' || U.pickTier({android: true, mobile: true, cores: 8, mem: 6, gpu: 'Adreno (TM) 740'}) === 'full', 'modern Adreno phone is not forced to light');
ok(U.pickTier({android: true, mobile: true, cores: 4, mem: 2, gpu: 'Adreno (TM) 505'}) === 'light', 'weak Adreno Android -> light');
ok(U.pickTier({android: false, mobile: true, cores: 4, mem: 4, gpu: 'Mali-T830'}) === 'light', 'old Mali mobile -> light');
ok(U.pickTier({android: false, mobile: false, cores: 4, mem: 8, gpu: 'Intel(R) UHD Graphics 620'}) === 'light' || U.pickTier({android: false, mobile: false, cores: 4, mem: 8, gpu: 'Intel(R) UHD Graphics 620'}) === 'balanced', 'weak Intel iGPU is not full');
ok(U.pickTier({android: true, mobile: true, cores: 6, mem: 4, gpu: 'Mali-G52'}) === 'balanced' || U.pickTier({android: true, mobile: true, cores: 6, mem: 4, gpu: 'Mali-G52'}) === 'light', 'mid Android is balanced or light');

const full = U.capsFor('full'), bal = U.capsFor('balanced'), light = U.capsFor('light');
ok(full.prMax > bal.prMax && bal.prMax >= light.prMax, 'tier prMax decreases full > balanced >= light');
ok(full.shadow > bal.shadow && bal.shadow > light.shadow, 'shadow map size decreases by tier');
ok(full.rdist >= bal.rdist && bal.rdist >= light.rdist, 'view distance decreases by tier');
ok(full.aa === 1 && bal.aa === 0 && light.aa === 0, 'AA stays on for full only');

// Dynamic scaler: simulate low FPS and ensure PR steps down quickly, then up slowly.
const calls = [];
const fakeRenderer = {
  pr: 1.35,
  getPixelRatio() { return this.pr; },
  setPixelRatio(v) { this.pr = v; calls.push(+v.toFixed(3)); }
};
const SET = {rdist: 6};
const W2 = {devicePixelRatio: 3, touchMode: true, __noDynRes: 0};
new Function('window', 'navigator', 'renderer', 'DPR', 'HIGH', 'QUALITY', 'started', 'paused', 'SET', 'resize', 'updateLights', helper)(
  W2,
  {userAgent: 'Mozilla/5.0 (Linux; Android 12)', hardwareConcurrency: 4, deviceMemory: 3},
  fakeRenderer, 3, true, '4k', true, false, SET, () => {}, function(){}
);
const A = W2.__adapt4k1242;
A.force = 1; A.on = 1;
A.applyTier('balanced', 'test');
fakeRenderer.pr = A.caps.prMax;
A.ema = 55; A.hold = 0; A.samples = 0;
// ~33 FPS frames -> should drop
for (let i = 0; i < 8; i++) A.tick(1 / 33);
ok(fakeRenderer.pr < A.caps.prMax - 0.05 || calls.some(v => v < A.caps.prMax), 'scaler steps pixel ratio down under low FPS (' + fakeRenderer.pr + ')');
const afterDown = fakeRenderer.pr;
// sustained high FPS but hold/slow raise
A.ema = 62; A.hold = 0; A.samples = 100;
const prBeforeUp = fakeRenderer.pr;
for (let i = 0; i < 3; i++) A.tick(1 / 60);
ok(fakeRenderer.pr <= afterDown * 1.08 + 0.02, 'scaler does not jump back up immediately (' + prBeforeUp + ' -> ' + fakeRenderer.pr + ')');
for (let i = 0; i < 40; i++) { A.hold = 0; A.tick(1 / 60); }
ok(fakeRenderer.pr >= afterDown - 0.001, 'after sustained headroom PR is not lower than the stepped-down value');
ok(A.caps.prMax <= 1.35 + 1e-6, 'balanced tier keeps a phone-friendly prMax');

// No popup strings in helper
ok(!/\balert\s*\(|\bconfirm\s*\(|toast\(\s*['\"][^'\"]*Adaptive/.test(helper), 'adaptive helper never pops UI');

ok(!A.err, 'adaptive helper ran without error' + (A.err ? ': ' + A.err : ''));
console.log('PASS ' + n + ' v1242 adaptive-4k checks');
