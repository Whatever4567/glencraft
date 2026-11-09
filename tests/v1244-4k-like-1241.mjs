// 1.2.44: adaptive 4K scaler and weak-boot cap removed; 4K UHD matches 1.2.41.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const helper = fs.readFileSync(new URL('../tools/visuals-source/adaptive-4k-1242.js', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(html.includes("const GAME_VERSION = '1.2.52';") || html.includes("const GAME_VERSION = '1.2.51';") || html.includes("const GAME_VERSION = '1.2.50';") || html.includes("const GAME_VERSION = '1.2.49';") || html.includes("const GAME_VERSION = '1.2.48';") || html.includes("const GAME_VERSION = '1.2.47';") || html.includes("const GAME_VERSION = '1.2.46';") || html.includes("const GAME_VERSION = '1.2.44';"), 'GAME_VERSION is 1.2.46 or 1.2.44');
ok(html.includes('<!-- glencraft-build: b1252-held-rollback -->') || html.includes('<!-- glencraft-build: b1251-visible-land -->') || html.includes('<!-- glencraft-build: b1250-held-popstar -->') || html.includes('<!-- glencraft-build: b1250-v1.2.50 -->') || html.includes('<!-- glencraft-build: b1249-v1.2.49 -->') || html.includes('<!-- glencraft-build: b1248-v1.2.48 -->') || html.includes('<!-- glencraft-build: b1247-v1.2.47 -->') || html.includes('<!-- glencraft-build: b1246-v1.2.46 -->') || html.includes('<!-- glencraft-build: b1244-v1.2.44 -->'), 'build marker is b1246 or b1244');
ok(/HIGH \? DPR : Math\.min\(DPR, 2\)/.test(html), 'pixel ratio uses uncapped DPR on HIGH (1.2.41 form)');
ok(!/__weakBoot1242 \? 1\.25/.test(html), 'weak-boot 1.25 PR cap is gone');
ok(helper.includes('scaler REMOVED') || helper.includes('disabled: 1'), 'adaptive helper source is a disabled stub');
ok(html.includes('scaler REMOVED') || html.includes('disabled: 1'), 'adaptive stub is embedded');
ok(html.includes('4K UHD is back to exactly how it rendered in 1.2.41'), 'patch notes mention 4K restore');

const W = {devicePixelRatio: 3};
new Function('window', 'navigator', 'renderer', 'DPR', 'HIGH', 'QUALITY', 'started', 'paused', 'SET', 'resize', 'updateLights', helper)(
  W, {userAgent: 'Mozilla/5.0 (Linux; Android 12)', hardwareConcurrency: 4, deviceMemory: 2},
  {getPixelRatio(){return 3;}, setPixelRatio(){ throw new Error('stub must not setPixelRatio'); }},
  3, true, '4k', true, false, {}, () => {}, () => {}
);
const U = W.__adapt4k1242;
ok(U && U.disabled === 1 && U.on === 0, 'stub installs disabled and off');
ok(U.pickTier() === 'full', 'stub pickTier always full');
U.tick(1 / 30); // must not throw / must not touch renderer
ok(true, 'stub tick is a no-op even on weak Android profile');

console.log('PASS ' + n + ' v1244 4k-like-1241 checks');
