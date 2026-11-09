// 1.2.48 audio: sparse birds, mood music, rare cave one-shots, UFO hover, credits.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const file = process.argv[2] || new URL('../index.html', import.meta.url).pathname;
const html = fs.readFileSync(file, 'utf8');
const src = fs.readFileSync(new URL('../tools/content-source/v1248.js', import.meta.url), 'utf8');
const credits = fs.readFileSync(new URL('../CREDITS.md', import.meta.url), 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes('nextB = t + R(20, 90)'), 'daytime birds are 20–90 s apart');
ok(html.includes('nextB = t + R(45, 180)'), 'night owls are occasional (45–180 s)');
ok(!html.includes('nextB = t + R(3, 9)'), 'the old 3–9 s bird interval is gone');
ok(html.includes('v = R(0.14, 0.32)'), 'bird volume is quieter');
ok(html.includes('nextN = t + R(45, 180)'), 'UKS cave one-shots are now rare');
ok(src.includes('startBed') && src.includes("'day'") && src.includes("'night'") && src.includes("'cave1'") && src.includes("'blue'") && src.includes("'purple'") && src.includes("'hell'"), 'music beds exist for every requested mood');
ok(src.includes('detectMood') && src.includes('__v1217') && src.includes('crossfade') || src.includes('stopBed'), 'music follows cave layers and crossfades');
ok(src.includes('musGapUntil') && src.includes('SET.music'), 'gaps of silence and SET.music are respected');
ok(src.includes('caveShot') && src.includes("mood === 'cave1'") && src.includes("mood === 'blue'") && src.includes("mood === 'purple'") && src.includes("mood === 'hell'"), 'rare cave one-shots are unique per layer');
ok(src.includes('setUfoHover') && src.includes('findUfo') && src.includes('dop'), 'UFO hover is spatialised with a cheap Doppler');
ok(credits.includes('v1.2.48') && /procedural|Web Audio/i.test(credits), 'CREDITS records procedural 1.2.48 audio');
ok(!src.includes('freesound') && !html.includes('youtube.com/watch'), 'no third-party recordings were added');

console.log('v1248-audio ok', n);

// Soundtrack picker: Calm / Classic / Happy Hardcore
ok(html.includes('id="ostSeg"') && html.includes('data-ost="calm"') && html.includes('data-ost="classic"') && html.includes('data-ost="hardcore"'), 'settings has Calm, Classic and Happy Hardcore');
ok(src.includes("SET.soundtrack") && src.includes("setSoundtrack") && src.includes("'calm'") && src.includes("'classic'") && src.includes("'hardcore'"), 'runtime has a selectable soundtrack');
ok(src.includes('HC_BPM = U.HC_BPM = 170') || src.includes('HC_BPM = 170') || /HC_BPM\s*=\s*170/.test(src), 'happy hardcore is 170 BPM');
ok(src.includes('kick(') && (src.includes('donk') || src.includes('hoover')), 'hardcore has a kick and an off-beat bass (donk or hoover)');
const classicFiles = [
  'highland_mist.mp3', 'glen_dawn.mp3', 'loch_night.mp3', 'heather_air.mp3',
  'under_the_glen.mp3', 'glencraft_theme_extended.mp3', 'old_pine.mp3',
  'skye_embers.mp3', 'stone_and_peat.mp3', 'cairn.mp3', 'ember_sea.mp3'
];
const root = new URL('../', import.meta.url);
for (const f of classicFiles) {
  const p = new URL('music/' + f, root);
  ok(fs.existsSync(p) && fs.statSync(p).size > 100000, 'classic track present: ' + f);
}
ok(src.includes('music/glen_dawn.mp3') && src.includes('CLASSIC_TRACKS'), 'classic bag lists the restored tracks');
ok(credits.includes('Happy Hardcore') && credits.includes('Classic soundtrack'), 'CREDITS records Classic restore and the remix');
ok(!src.includes('youtube') && !src.includes('freesound.org') && !src.includes('ncs.io'), 'hardcore remix uses no outside copyrighted music');

console.log('v1248-audio ost ok');
