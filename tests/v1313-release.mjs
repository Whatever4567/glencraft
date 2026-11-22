// v1.2.113 history stays present after later releases.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
let k = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++k) + ' ' + l); };

ok(['1.2.113', '1.2.114', '1.2.115', '1.2.117', '1.2.118', '1.2.119'].includes(ver.v), 'version.json is 1.2.113 or later');
ok(html.includes('<!-- glencraft-build: b1313-v1.2.113 -->'), '1.2.113 build marker stays');
ok(html.includes("const GAME_VERSION = '1.2.114';") || html.includes("const GAME_VERSION = '1.2.115';") || html.includes("const GAME_VERSION = '1.2.117';") || html.includes("const GAME_VERSION = '1.2.118';") || html.includes("const GAME_VERSION = '1.2.119';") || html.includes("const GAME_VERSION = '1.2.113';"), 'GAME_VERSION is 1.2.113 or 1.2.114');
const s113 = html.indexOf('{"v":"v1.2.113"');
const s112 = html.indexOf('{"v":"v1.2.112"', s113 > 0 ? s113 - 800 : 0);
ok(s113 > 0, 'PATCH_NOTES has 1.2.113');
ok(/load faster and reliably/i.test(html.slice(s113, s113 + 400)), '1.2.113 notes mention faster new-world load');
ok(html.includes('__glenLoad') && html.includes('runDeferredPools'), 'loader cooperative generate hooks stay');
ok(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(s113, s113 + 400)), '1.2.113 notes have no food');
console.log('PASS', k, 'v1313 release checks');
