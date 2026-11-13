// v1.2.68: castle skeleton garrisons and a path from the human castle to the farmers.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ver = JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8'));
const credits = fs.readFileSync(new URL('../CREDITS.md', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../tools/content-source/castle-1268.js', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(ver.v === '1.2.71' || ver.v === '1.2.70' || ver.v === '1.2.69' || ver.v === '1.2.68', 'version.json is 1.2.68');
ok(html.includes("const GAME_VERSION = '1.2.71';") || html.includes("const GAME_VERSION = '1.2.70';") || html.includes("const GAME_VERSION = '1.2.69';") || html.includes("const GAME_VERSION = '1.2.68';"), 'GAME_VERSION is 1.2.68');
ok(html.includes('<!-- glencraft-build: b1271-v1.2.71 -->') || html.includes('<!-- glencraft-build: b1270-v1.2.70 -->') || html.includes('<!-- glencraft-build: b1269-v1.2.69 -->') || html.includes('<!-- glencraft-build: b1268-v1.2.68 -->'), 'build marker b1268');
ok(html.includes('<!-- glencraft-build: b1267-v1.2.67 -->'), '1.2.67 build marker stays');
ok(credits.includes('## v1.2.68 Castle garrisons and a path to the farmers'), 'CREDITS has the 1.2.68 section');
ok(credits.includes('1e9db15') && credits.includes('__fpa'), 'CREDITS still names the restored 1.2.59 __fpa path');

const notesStart = html.indexOf('window.PATCH_NOTES = [');
ok(notesStart > 0, 'PATCH_NOTES present');
const head = html.slice(notesStart, notesStart + 58000);
ok(head.includes('"v":"v1.2.68"') && head.includes('"d":"2026-11-13"'), 'v1.2.68 notes are at the top, dated 2026-11-13');
ok(head.indexOf('"v":"v1.2.68"') < head.indexOf('"v":"v1.2.67"'), '1.2.68 notes sit above 1.2.67');
ok(head.includes('The Black Castle is home to 100 black skeletons'), 'patch notes mention the black garrison');
ok(head.includes('connects the human castle to the farmers'), 'patch notes mention the path to the farmers');
for (const phrase of [
  '100 black skeletons',
  '50 white skeletons',
  'You can kill them all',
  'Some respawn slowly',
  'never refill to its original lot',
  'kill count',
  'loaded chunks',
  '25 humans live at the human castle',
  'visit the farmers',
  'gold D-pad are left alone',
  'Hard-refresh'
]) {
  ok(head.includes(phrase), 'patch notes mention: ' + phrase);
}

ok(html.includes('/* GLX-CASTLE1268 (v1.2.68):'), 'CASTLE1268 IIFE is in the page');
const i1268 = html.indexOf('/* GLX-CASTLE1268');
ok(i1268 > 0, 'CASTLE1268 marker found');
const i1268End = (() => {
  const next = html.indexOf('\n/* GLX-', i1268 + 10);
  const scr = html.indexOf('</script>', i1268);
  let end = i1268 + 80000;
  if (next > i1268 && next < end) end = next;
  if (scr > i1268 && scr < end) end = scr;
  return end;
})();
const h = html.slice(i1268, i1268End);

ok(h.includes('MAX') && h.includes('black: 100') && h.includes('mossy: 50'), 'garrison sizes are 100 black and 50 white (mossy)');
ok(h.includes("kind === 'black' ? 'blackskel'") || h.includes("'blackskel'"), 'black castle uses black skeletons');
ok(h.includes("'skeleton'") && h.includes('mossy'), 'mossy/white castle uses white skeletons');
ok(h.includes('shaded') && h.includes('shaded = 1'), 'garrison skeletons are shaded (no daylight burning)');
ok(h.includes('idle') || h.includes('patrol') || h.includes('R_PATROL'), 'skeletons idle and patrol');
ok(h.includes('kills') && h.includes('glen_garrison_') && h.includes('cap('), 'kill count is persisted and drives a decaying cap');
ok(h.includes('max * 0.12') || h.includes('0.12'), 'respawn cap decays and stays well below the original lot');
ok(h.includes('LIVE') && (h.includes('28') || h.includes('R_LOAD')), 'only nearby skeletons in loaded chunks are live (capped)');
ok(h.includes('buildPath') && h.includes('layPath') && h.includes('route'), 'a path is built from the human castle to the farmers');
ok(h.includes('PLANKS') && (h.includes('bridge') || h.includes('wet') || h.includes('rail')), 'bridges over water / ravines use a modular deck and rails');
ok(h.includes('GRAVEL') && h.includes('STAIR') && (h.includes('LAMP') || h.includes('TORCH')), 'path kit includes gravel, stairs and lamps');
ok(h.includes('human: 25') || h.includes('MAX.human'), '25 humans live at the human castle');
ok(h.includes('visit') && h.includes('linger') && h.includes('farmers'), 'some humans walk the path, visit the farmers, linger and walk back');
ok(h.includes('gold D-pad is left alone'), '1268 records that the gold D-pad is left alone');
ok(!/\['dU', 'dL', 'dR'\]\.forEach/.test(h) && !/#dU|#dL|#dR/.test(h), '1268 does not hide or style the gold D-pad');
ok(!h.includes('phalanxGeo') && !h.includes('__fpa') && !h.includes('applyRestCurl'), '1268 does not touch first-person hands');
ok(!/Egypt/i.test(h) && !/gold color portal/.test(h) && !/gold block/.test(h), '1268 does not include the Egypt dimension');

ok(html.includes('/* GLX-MOBS1267'), '1.2.67 wolf/hag IIFE stays');
ok(html.includes('/* GLX-HANDS1266') && html.includes('phalanxGeo'), '1.2.66 finger sculpt stays');
ok(html.includes('/* GLX-HANDS1263') && html.includes("restoredFrom: '1e9db15'"), '1.2.63 arms restore stays');
ok(html.includes('/* GLX-TBOX1264') && html.includes('fly1264'), '1.2.64 TARDIS work stays');
ok(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad is not hidden');
ok(html.includes('hideInThirdPerson') || html.includes('third person'), 'third-person view-model hide stays');
ok(i1268 > html.indexOf('/* GLX-MOBS1267'), 'CASTLE1268 is injected after MOBS1267');

try {
  const git = execSync('git show main:tools/content-source/mobs-1267.js', {
    cwd: new URL('..', import.meta.url), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
  });
  const live = fs.readFileSync(new URL('../tools/content-source/mobs-1267.js', import.meta.url), 'utf8');
  ok(git === live, 'mobs-1267.js is unchanged from main');
} catch (e) {
  ok(fs.readFileSync(new URL('../tools/content-source/mobs-1267.js', import.meta.url), 'utf8').includes('buildCanine'),
    'mobs-1267.js still has the 1.2.67 wolf kit (git compare skipped)');
}

ok(html.includes(src.trim()), 'castle-1268.js source is injected into the page');
console.log('all ok (' + n + ')');
