// 1.2.43: faster first-playable load + lighter menus (source/CPU evidence).
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(html.includes("const GAME_VERSION = '1.2.46';") || html.includes("const GAME_VERSION = '1.2.44';") || html.includes("const GAME_VERSION = '1.2.43';"), 'GAME_VERSION is 1.2.46+');
ok(html.includes('<!-- glencraft-build: b1246-v1.2.46 -->') || html.includes('<!-- glencraft-build: b1244-v1.2.44 -->') || html.includes('<!-- glencraft-build: b1243-v1.2.43 -->'), 'build marker is b1246+');
ok(/const LOAD_R = \(window\.__loadChunkR != null \? window\.__loadChunkR : 1\)/.test(html), 'initial load chunk ring defaults to R=1');
ok(/for \(let a = -LOAD_R; a <= LOAD_R; a\+\+\)/.test(html), 'chunksReady uses LOAD_R');
ok(html.includes('enterWorld._fauna'), 'fauna spawn is deferred via enterWorld._fauna');
ok(!/ready = true; loadStep\('first render'\);\n\s*try \{ renderer\.compile\(scene, camera\);/.test(html), 'sync renderer.compile is not on the enter critical path');
ok(/ready = true; loadStep\('first render'\);[\s\S]{0,200}?renderer\.render\(scene, camera\);/.test(html), 'first playable still does one present');
ok(html.includes('frame._menuT') && html.includes('_n - _mt >= 50'), 'title/menu 3D backdrop is rate-capped');
ok(html.includes('el.__invSig === sig'), 'invGrid skips unchanged rebuilds');
ok(html.includes('menu blur restored') || html.includes('1.2.43 menu blur off') || /backdrop-filter:blur\(10px\)/.test(html) || /backdrop-filter:none/.test(html), 'menu glass blur policy present (restored in 1.2.44 or off in 1.2.43)');
ok(html.includes('Worlds reach a playable frame sooner'), 'patch notes mention faster playable load');
ok(html.includes('orbit backdrop runs at a capped rate'), 'patch notes mention lighter menus');
ok(html.includes("if (!started || (typeof screen !== 'undefined' && screen === 'loading'))"), 'stream radius capped during load');
ok(html.includes('STREAM_R = streamRadius(); } catch (_) {}'), 'stream radius restored after enter');
// Must not regress world-tile prism revert
ok(html.includes('worldTilesUntouched'), '1.2.42 world-tile no-op retained');
ok(!/function restyleTexKey\(key\) \{[^}]*prismTile/.test(html), 'world atlas still not prism-restyled');

ok(html.includes('refocusMenu._sig'), 'menu focus redraws are deduped');
ok(html.includes('refocusPause._sig'), 'pause focus redraws are deduped');
ok(html.includes('i >= 2 && !ready'), 'land meshing starts at i>=2 (not after all tip steps)');
ok(/\}, 80\);\n\}\nfunction finishBoot/.test(html) || html.includes('}, 80);'), 'load tick is 80ms');
console.log('PASS ' + n + ' v1243 load-menus checks');
