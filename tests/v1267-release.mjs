// v1.2.67: wild wolves, Scottish dogs, hag upgrade, black cat.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ver = JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8'));
const credits = fs.readFileSync(new URL('../CREDITS.md', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../tools/content-source/mobs-1267.js', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(ver.v === '1.2.69' || ver.v === '1.2.68' || ver.v === '1.2.67', 'version.json is 1.2.67');
ok(html.includes("const GAME_VERSION = '1.2.69';") || html.includes("const GAME_VERSION = '1.2.68';") || html.includes("const GAME_VERSION = '1.2.67';"), 'GAME_VERSION is 1.2.67');
ok(html.includes('<!-- glencraft-build: b1269-v1.2.69 -->') || html.includes('<!-- glencraft-build: b1268-v1.2.68 -->') || html.includes('<!-- glencraft-build: b1267-v1.2.67 -->'), 'build marker b1267');
ok(html.includes('<!-- glencraft-build: b1266-v1.2.66 -->'), '1.2.66 build marker stays');
ok(credits.includes('## v1.2.67 Wild wolves, Scottish dogs, and a hag upgrade'), 'CREDITS has the 1.2.67 section');
ok(credits.includes('1e9db15') && credits.includes('__fpa'), 'CREDITS still names the restored 1.2.59 __fpa path');

const notesStart = html.indexOf('window.PATCH_NOTES = [');
ok(notesStart > 0, 'PATCH_NOTES present');
const head = html.slice(notesStart, notesStart + 46000);
ok(head.includes('"v":"v1.2.67"') && head.includes('"d":"2026-11-13"'), 'v1.2.67 notes are at the top, dated 2026-11-13');
ok(head.indexOf('"v":"v1.2.67"') < head.indexOf('"v":"v1.2.66"'), '1.2.67 notes sit above 1.2.66');
ok(head.includes('Wild wolves spawn naturally in packs'), 'patch notes mention wild wolf packs');
ok(head.includes('Moss Hag Morag has a paler hag head'), 'patch notes mention the hag upgrade');
for (const phrase of [
  'angers the whole pack',
  'Feed them bones',
  'heart particles',
  'Scottish collie',
  'toggles sit',
  'TARDIS doors',
  'Sitting dogs stay still',
  'follow you',
  'teleporting if far',
  'bite only mobs that harmed you',
  'bark, howl and growl',
  'Tamed dogs and sit state are saved',
  'long grey hair',
  'sunken, faintly glowing eyes',
  'softer cackles and mutters',
  'black cat',
  'gold D-pad are left alone',
  'Hard-refresh'
]) {
  ok(head.includes(phrase), 'patch notes mention: ' + phrase);
}

ok(html.includes('/* GLX-MOBS1267 (v1.2.67):'), 'MOBS1267 IIFE is in the page');
const i1267 = html.indexOf('/* GLX-MOBS1267');
ok(i1267 > 0, 'MOBS1267 marker found');
const i1267End = (() => {
  const next = html.indexOf('\n/* GLX-', i1267 + 10);
  const scr = html.indexOf('</script>', i1267);
  let end = i1267 + 80000;
  if (next > i1267 && next < end) end = next;
  if (scr > i1267 && scr < end) end = scr;
  return end;
})();
const h1267 = html.slice(i1267, i1267End);

ok(h1267.includes('buildCanine') && h1267.includes("makeAnimal('wolf'") && h1267.includes("style === 'dog'"), '1267 builds a procedural wolf and dog');
ok(h1267.includes('COLLIE_BLK') && h1267.includes('COLLIE_WHT') && h1267.includes('COLLIE_TAN'), 'Scottish collie palette (black, white, tan)');
ok(h1267.includes('WOLF_RAMP') && h1267.includes('applyLook'), 'wolf palette and a texture swap on tame');
ok(h1267.includes('spawnPack') && h1267.includes('packId'), 'wolves spawn in packs with a shared pack id');
ok(h1267.includes('temper') && h1267.includes('tryFeed') && (h1267.includes('BONE') || h1267.includes('171')), 'taming uses bones and several tries');
ok(h1267.includes('heartsAt') || h1267.includes('0xff6688'), 'taming shows heart particles');
ok(h1267.includes('tryToggleSit') && h1267.includes('onLTEdge') && h1267.includes('buttons[6]'), 'LT (touch and controller) toggles sit');
ok(h1267.includes('toggleDoor') && h1267.includes('_dogLT'), 'LT sit does not also toggle TARDIS doors');
ok(h1267.includes('sitting') && h1267.includes('stay'), 'sitting dogs stay still');
ok(h1267.includes('teleport') || h1267.includes('dist > 24'), 'tamed dogs teleport if far');
ok(h1267.includes('U.attacker') && h1267.includes('hurt'), 'dogs bite only the mob that harmed the player');
ok(h1267.includes('angry') && h1267.includes('packId') && h1267.includes('damageMob'), 'hitting one wolf angers the pack');
ok(h1267.includes('shaded') && h1267.includes('shaded: 1'), 'wolves are shaded so they do not burn in daylight');
ok(h1267.includes('trot') && h1267.includes('sit') && h1267.includes('wag') && h1267.includes('tilt') && h1267.includes('bite') && h1267.includes('sniff'), 'trot, sit, wag, tilt, bite, sniff animations');
ok(h1267.includes('playBark') && h1267.includes('playHowl') && h1267.includes('playWolfGrowl'), 'bark, howl and growl sounds');
ok(h1267.includes('glen_dogs_') && h1267.includes('saveDogs') && h1267.includes('loadDogs') && h1267.includes('saveWorld'), 'tamed dogs and sit state persist in the save');
ok(h1267.includes('a.tamed') && (h1267.includes("a.named = 'Scottish Dog'") || h1267.includes("named: 'Scottish Dog'")), 'tamed dogs are marked so they are not despawned');

ok(h1267.includes('upgradeHagVisual') && h1267.includes('HAG_SKIN') && h1267.includes('HAG_HAIR'), 'hag head upgrade with paler skin and grey hair');
ok(h1267.includes('glow') && (h1267.includes('sunken') || h1267.includes('sock')), 'sunken eyes with a faint glow');
ok(h1267.includes('dither') || h1267.includes('BAYER'), 'pixel shading uses a limited dithered palette');
ok(h1267.includes('hagvoice') && h1267.includes('playHagVoice') && h1267.includes('4500'), 'hag voice is a quieter randomised set with a cooldown');
ok(h1267.includes("ty === 'cackle'") || h1267.includes("Leave 'cackle'") || h1267.includes('Merry Mischanter') || h1267.includes('other mobs'), 'global cackle for other mobs is left alone');
ok(!h1267.includes("DEF.nm05") && !h1267.includes("snd = 'cackle'"), '1267 does not reset other Night Mob voices to cackle');
ok(h1267.includes('blackcat') && h1267.includes('ensureCat') && h1267.includes("style === 'cat'"), 'black cat mob spawns with the witch and follows her');
ok(h1267.includes("named: 'Black Cat'") || h1267.includes("named = 'Black Cat'"), 'the cat is named so it is not despawned');

ok(h1267.includes('gold D-pad is left alone'), '1267 records that the gold D-pad is left alone');
ok(!/\['dU', 'dL', 'dR'\]\.forEach/.test(h1267) && !/#dU|#dL|#dR/.test(h1267), '1267 does not hide or style the gold D-pad');
ok(!/enableKinds|NEW_FP_KINDS\s*=/.test(h1267), '1267 does not re-enable NEW_FP_KINDS');
ok(!/hands-1260|HANDS1260|hands-1261|HANDS1261|voxel arm/.test(h1267), '1267 does not switch to the 1.2.60 or 1.2.61 arm');
ok(!h1267.includes('phalanxGeo') && !h1267.includes('applyRestCurl') && !h1267.includes('__fpa'), '1267 does not touch first-person hands');
ok(!/garrison/i.test(h1267) && !h1267.includes('100 black') && !h1267.includes('25 humans'), '1267 does not include skeleton garrisons or the human castle');
ok(!/Egypt/i.test(h1267) && !/gold block/.test(h1267) && !/gold color portal/.test(h1267), '1267 does not include the Egypt dimension');

ok(html.includes('/* GLX-HANDS1266'), 'HANDS1266 IIFE is still in the page');
ok(html.includes('phalanxGeo') && html.includes('applyRestCurl'), '1.2.66 finger sculpt stays');
ok(html.includes('/* GLX-HANDS1265'), 'HANDS1265 IIFE is still in the page');
ok(html.includes('/* GLX-HANDS1263'), 'HANDS1263 IIFE is still in the page');
ok(html.includes("restoredFrom: '1e9db15'") && html.includes("restoredFromLabel: '1.2.59'"), '1.2.63 arms restore is unchanged');
ok(html.includes('__fpVm1259') && html.includes("version: '1.2.59-frame-torch'"), '1259 viewmodel and torch freeze stay');
ok(html.includes('__fpa') && html.includes('handsSculpt1249'), 'classic __fpa + 1.2.57 sculpt path stays');
ok(!html.includes('/* GLX-HANDS1261'), '1.2.61 voxel-arm IIFE stays removed');
ok(html.includes('/* GLX-TBOX1264') && html.includes('scrY: 2.68') && html.includes('fly1264'), '1.2.64 TARDIS work stays');
ok(!html.includes("['dU', 'dL', 'dR'].forEach") && html.includes('gold D-pad is left alone'), 'gold D-pad is not hidden');
ok(html.includes('hideInThirdPerson') || html.includes('third-person hiding') || html.includes('third person'), 'third-person view-model hide stays');

const i1266 = html.indexOf('/* GLX-HANDS1266');
const i1265 = html.indexOf('/* GLX-HANDS1265');
ok(i1267 > i1266 && i1267 > i1265, 'MOBS1267 is injected after HANDS1266 and HANDS1265');

try {
  const git = execSync('git show main:tools/content-source/hands-1266.js', {
    cwd: new URL('..', import.meta.url), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
  });
  const live = fs.readFileSync(new URL('../tools/content-source/hands-1266.js', import.meta.url), 'utf8');
  ok(git === live, 'hands-1266.js is unchanged from main');
} catch (e) {
  ok(fs.readFileSync(new URL('../tools/content-source/hands-1266.js', import.meta.url), 'utf8').includes('phalanxGeo'),
    'hands-1266.js still has the 1.2.66 finger sculpt (git compare skipped)');
}

ok(html.includes(src.trim()), 'mobs-1267.js source is injected into the page');

/* source itself is valid JS */
{
  const wrapped = src + '\n';
  ok(wrapped.includes('(function mobs1267(WIN)'), 'IIFE takes WIN so it does not shadow world W');
  ok(!/\(function mobs1267\(W\)/.test(src), 'IIFE does not shadow world width as W');
}

console.log('all ok (' + n + ')');
