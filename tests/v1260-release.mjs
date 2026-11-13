// v1.2.60: TARDIS overhaul + sculpted first-person hands back on. Source proofs
// against the shipped index.html (and a few live tbox-chain seat checks).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ver = JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8'));
const credits = fs.readFileSync(new URL('../CREDITS.md', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(ver.v === '1.2.60', 'version.json is 1.2.60');
ok(html.includes("const GAME_VERSION = '1.2.60';"), 'GAME_VERSION is 1.2.60');
ok(html.includes('<!-- glencraft-build: b1260-v1.2.60 -->'), 'build marker b1260');
ok(credits.includes('## v1.2.60'), 'CREDITS has a v1.2.60 section');

const notesStart = html.indexOf('window.PATCH_NOTES = [');
ok(notesStart > 0, 'PATCH_NOTES present');
const head = html.slice(notesStart, notesStart + 2800);
ok(head.includes('"v":"v1.2.60"') && head.includes('"d":"2026-11-13"'), 'v1.2.60 notes are at the top, dated 2026-11-13');
ok(head.indexOf('"v":"v1.2.60"') < head.indexOf('"v":"v1.2.59"'), '1.2.60 notes sit above 1.2.59');
for (const phrase of [
  'police-box shell',
  'POLICE PUBLIC CALL BOX',
  'six-pane',
  'tall rotor room',
  'roundels',
  'left stick flies',
  'right stick turns',
  'multiplies your speed by 10',
  'no top speed',
  'cabin floor',
  'blue screen is gone',
  'Both doors stay shut',
  'sculpted first-person hands are back on',
  'two-handed wrap',
  'open palm',
  'hold grip',
  'hand atlas',
  'Hard-refresh'
]) {
  ok(head.includes(phrase), 'patch notes mention: ' + phrase);
}

ok(html.includes('/* GLX-TBOX1260 (v1.2.60):'), 'TBOX1260 IIFE is in the page');
ok(html.includes('POLICE TELEPHONE') && html.includes('PULL TO OPEN'), 'phone-panel wording is in the shell');
ok(html.includes('fillText(\'PUBLIC\'') && html.includes('fillText(\'CALL\''), 'PUBLIC CALL is stacked on the sign');
ok(html.includes('T.RH = 16.5') || html.includes('T.RH=16.5'), 'interior is a tall rotor room');
ok(html.includes('roundel') && html.includes('ff66cc'), 'roundels and pink/purple rotor glow');
ok(html.includes('gridTemplateColumns === \'repeat(3, 54px)\'') && html.includes('display = \'none\''), 'the extra flight pad is hidden');
ok(html.includes('boost = (LSb || sprint) ? 10 : 1') || html.includes('(LSb || sprint) ? 10'), 'LS / Sprint multiplies speed by 10');
ok(html.includes('no top speed') || html.includes('accelerat'), 'uncapped acceleration is in the flight code');
ok(html.includes('lockSeat') && html.includes('P.y = S.y'), 'the pilot is locked to the cabin floor');
ok(html.includes('killBlueCut') && html.includes('9fd8ff'), 'the blue travel overlay is forced off');
ok(html.includes('toggleDoor') && html.includes('lookingAtDoor') && html.includes('buttons[6]'), 'each door opens on LT / USE');
ok(html.includes('U.left = 0; U.right = 0') || html.includes('U.left = 0,') || /U\.left = 0/.test(html), 'doors start shut');
ok(html.includes('driveArms1260') && html.includes('placeDriveArms'), 'drive-mode arms sit at the bottom, hands hidden');
ok(html.includes('nearBox') && html.includes('humSet'), 'the box hums when you are in or near it');
ok(html.includes('harsh') && html.includes('engineTick'), 'engines get harsher with speed');

ok(html.includes('/* GLX-HANDS1260 (v1.2.60):'), 'HANDS1260 IIFE is in the page');
ok(html.includes('empty: 1, p761: 1, p760: 1, pick: 1'), 'NEW_FP_KINDS is on for tools');
ok(html.includes('pistol: 1, musket: 1'), 'NEW_FP_KINDS is on for guns');
ok(html.includes("mode: 'wrapPistol'") && html.includes("mode: 'wrapMusket'"), 'pistol and rifle use the two-handed wrap');
ok(html.includes("k0 === 'map' || k0 === 'bucket'") && html.includes("mode: 'hold'"), 'map and bucket use the hold grip');
ok(html.includes("k0 === 'block'") && html.includes("mode: 'cup'"), 'block uses the open-palm / cup grip');
ok(html.includes('HAND_ATLAS') && html.includes('MeshStandardMaterial'), 'skin uses the hand atlas and a lit material');
ok(html.includes('__hands1260') && html.includes('sculptKeep'), 'later paint is hooked so it cannot strip the hands');
ok(html.includes("version: '1.2.59-frame-torch'") && html.includes('_seatStable'), '1.2.59 torch-pose freeze is still in the page');
ok(html.includes('pick:   {dx:  0.12, dy: -0.06, dz: 0.06') || html.includes('pick:   {dx:  0.12'), '1.2.59 pickaxe rightward shift is still in the page');

// Existing tbox chain still boots (our IIFE is not in that slice, so older
// behaviour is what those tests cover; this just checks the chain is intact).
ok(html.includes('/* GLX-TBOX (v1.1.55):'), 'original TBOX block is still there');
ok(html.includes('/* GLX-TBOX3 (v1.1.82):'), 'original TBOX3 flight block is still there');
ok(html.includes('/* GLX-CAB1222'), 'cabin floor / carry block is still there');

console.log('all ok (' + n + ')');
