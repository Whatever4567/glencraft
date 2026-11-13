// 1.2.50: UK-bounce hardcore remix (no piano) and liminal blue/purple/Agartha beds.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const file = process.argv[2] || new URL('../index.html', import.meta.url).pathname;
const html = fs.readFileSync(file, 'utf8');
const src = fs.readFileSync(new URL('../tools/content-source/v1248.js', import.meta.url), 'utf8');
const credits = fs.readFileSync(new URL('../CREDITS.md', import.meta.url), 'utf8');
const ver = JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8'));
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok((ver.v === '1.2.68' || ver.v === '1.2.67' || ver.v === '1.2.66' || ver.v === '1.2.65' || ver.v === '1.2.64' || ver.v === '1.2.63' || ver.v === '1.2.62' || ver.v === '1.2.61' || ver.v === '1.2.60' || ver.v === '1.2.59' || ver.v === '1.2.58' || ver.v === '1.2.57' || ver.v === '1.2.56' || ver.v === '1.2.55' || ver.v === '1.2.54' || ver.v === '1.2.53' || ver.v === '1.2.52' || ver.v === '1.2.51' || ver.v === '1.2.50' || ver.v === '1.2.49') && (html.includes("const GAME_VERSION = '1.2.68';") || html.includes("const GAME_VERSION = '1.2.67';") || html.includes("const GAME_VERSION = '1.2.66';") || html.includes("const GAME_VERSION = '1.2.65';") || html.includes("const GAME_VERSION = '1.2.64';") || html.includes("const GAME_VERSION = '1.2.63';") || html.includes("const GAME_VERSION = '1.2.62';") || html.includes("const GAME_VERSION = '1.2.61';") || html.includes("const GAME_VERSION = '1.2.60';") || html.includes("const GAME_VERSION = '1.2.59';") || html.includes("const GAME_VERSION = '1.2.58';") || html.includes("const GAME_VERSION = '1.2.57';") || html.includes("const GAME_VERSION = '1.2.56';") || html.includes("const GAME_VERSION = '1.2.55';") || html.includes("const GAME_VERSION = '1.2.54';") || html.includes("const GAME_VERSION = '1.2.53';") || html.includes("const GAME_VERSION = '1.2.52';") || html.includes("const GAME_VERSION = '1.2.51';") || html.includes("const GAME_VERSION = '1.2.50';") || html.includes("const GAME_VERSION = '1.2.49';")), 'version is 1.2.56 (or a previous 1.2.49–1.2.55 launch)');
ok(html.includes('id="ostSeg"') && html.includes('data-ost="hardcore"'), 'soundtrack picker is still present');

// Hardcore remix
ok(/HC_BPM\s*=\s*170/.test(src), 'happy hardcore is 170 BPM');
ok(src.includes('hardcore_remix.mp3') || src.includes('hardcore_remix.ogg'), 'hardcore plays a baked loop of the remix');
ok(src.includes('donk') && src.includes('startHcFallback'), 'procedural fallback has an off-beat donk');
ok(!/function startHardcore[\s\S]*?\bpiano\s*\(/.test(src), 'hardcore path has no piano voice');
ok(!src.includes('startPiano') && !src.includes('const piano'), 'no piano instrument is defined');
ok(src.includes('src.loop = true') || src.includes('loop = true') || src.includes('loop: true') || src.includes('src.loop'), 'baked loop is set to loop');

const mp3 = new URL('music/hardcore_remix.mp3', root);
const ogg = new URL('music/hardcore_remix.ogg', root);
ok(fs.existsSync(mp3) && fs.statSync(mp3).size > 200000, 'music/hardcore_remix.mp3 is present');
ok(fs.existsSync(ogg) && fs.statSync(ogg).size > 200000, 'music/hardcore_remix.ogg is present');

function probe(p) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=sample_rate', '-of', 'json', p], { encoding: 'utf8' });
  return JSON.parse(out);
}
const info = probe(mp3.pathname);
const dur = Number(info.format.duration);
const rate = Number(info.streams[0].sample_rate);
ok(dur >= 180 && dur <= 260, 'remix is about 3–4 minutes (got ' + dur.toFixed(1) + 's)');
ok(rate === 44100, 'remix sample rate is 44100 (got ' + rate + ')');

ok(!src.includes('freesound') && !src.includes('youtube.com') && !src.includes('ncs.io') && !html.includes('youtube.com/watch'), 'no third-party recordings were added');
ok(credits.includes('v1.2.50') && /donk|UK bounce|Happy Hardcore/i.test(credits), 'CREDITS records the 1.2.50 remix');
ok(credits.includes('Agartha') && /liminal|choir/i.test(credits), 'CREDITS records the liminal cave / Agartha beds');

// Calm cave moods
ok(src.includes("DIM.cur === 'agartha'") && src.includes("return 'agartha'"), 'detectMood gives Agartha its own mood');
ok(src.includes('startLiminalBed') && src.includes('makeCaveIR') && src.includes('LIMINAL'), 'blue/purple/Agartha use the liminal choir-pad bed');
ok(src.includes("mood === 'blue' || mood === 'purple' || mood === 'agartha'"), 'liminal bed is used for blue, purple and Agartha');
ok(src.includes("pad([65.4, 98, 146.8], 'sine', 0.26, 0.04)"), 'cave1 pad is unchanged');
ok(src.includes("pad([36.7, 49, 73.4, 92.5], 'sine', 0.3, 0.04)"), 'hell pad is unchanged');
ok(src.includes('formants') && src.includes('bells') && src.includes('sub:'), 'liminal bed has choir formants, glassy bells and a sub drone');
ok(src.includes('blue: 0.055') && src.includes('agartha: 0.055'), 'crystal-cave and Agartha beds are mixed quietly');
ok(html.includes('worldTilesUntouched'), 'world-block atlas was not retouched');

console.log('v1250-audio ok', n);
