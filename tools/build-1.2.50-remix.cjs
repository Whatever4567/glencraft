#!/usr/bin/env node
'use strict';
// 1.2.50: Happy Hardcore remix (UK bounce / donk, no piano) and reworked
// blue / purple / Agartha Calm beds. Does not touch first-person arms,
// world-block atlas, 4K settings, or v12 armour files. Does not include 1.2.49 held-repair.
const fs = require('node:fs');
const path = require('node:path');
const out = process.argv[2] || path.join(__dirname, '../index.html');
let s = fs.readFileSync(out, 'utf8');
function one(a, b, label) {
  const i = s.indexOf(a);
  if (i < 0) throw new Error('missing ' + (label || a.slice(0, 100)));
  if (s.indexOf(a, i + 1) >= 0) throw new Error('not unique ' + (label || a.slice(0, 100)));
  s = s.slice(0, i) + b + s.slice(i + a.length);
}
function maybe(a, b, label) {
  if (!s.includes(a)) return false;
  one(a, b, label);
  return true;
}

if (!s.includes("const GAME_VERSION = '1.2.50';")) {
  if (!s.includes("const GAME_VERSION = '1.2.48';") && !s.includes("const GAME_VERSION = '1.2.47';")) {
    throw new Error('expected 1.2.48 base');
  }
  if (s.includes("const GAME_VERSION = '1.2.48';")) {
    one("const GAME_VERSION = '1.2.48';", "const GAME_VERSION = '1.2.50';", 'ver');
    one('<!-- glencraft-build: b1248-v1.2.48 -->', '<!-- glencraft-build: b1250-v1.2.50 -->', 'marker');
  }
  one('window.PATCH_NOTES = [', 'window.PATCH_NOTES = [\n' + JSON.stringify({
    v: 'v1.2.50', d: '2026-11-09', notes: [
      'The Happy Hardcore soundtrack is now a full 170 BPM UK-bounce remix of the old Glencraft themes: a tight clean kick, a loud off-beat donk bass, short builds and long drops, and the old melodies as bright pitched-up synth chops. No piano.',
      'In the Calm soundtrack, the blue and purple crystal caves have new beatless liminal choir pads with sparse glassy bells and a long cavernous reverb, mixed quietly. Agartha has its own Calm mood too, instead of sharing the purple cave\'s music. The first cave layer and the hell cave keep their own distinct beds.'
    ]
  }) + ',', 'notes');
  maybe(
    "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.48'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.48')",
    "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.50'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.50')",
    'cache'
  );
}

// Inject or replace the runtime module at the end of the main script.
const src = fs.readFileSync(path.join(__dirname, 'content-source/v1248.js'), 'utf8');
if (s.includes('GLX-V1248')) {
  const start = s.indexOf('/* GLX-V1248');
  const end = s.indexOf('</script>', start);
  if (start < 0 || end < 0) throw new Error('cannot replace v1248 module');
  s = s.slice(0, start) + src + '\n' + s.slice(end);
} else {
  const i = s.lastIndexOf('</script>');
  if (i < 0) throw new Error('missing </script> to inject v1248');
  s = s.slice(0, i) + '\n' + src + '\n' + s.slice(i);
}

if (!s.includes("const GAME_VERSION = '1.2.50';")) throw new Error('missing 1.2.50 version');
if (!s.includes('GLX-V1248') || !s.includes('startLiminalBed') || !s.includes('hardcore_remix.mp3')) {
  throw new Error('missing 1.2.50 soundtrack module');
}
if (!s.includes('worldTilesUntouched')) throw new Error('block-atlas revert marker missing — refused to ship a build that re-prisms world tiles');
if (!s.includes('id="ostSeg"') || !s.includes('Happy Hardcore')) throw new Error('soundtrack picker missing');
if (!s.includes("DIM.cur === 'agartha'") || !s.includes('startLiminalBed')) throw new Error('Agartha / liminal beds missing');
if (s.includes('function startHardcore') && /startHardcore[\s\S]{0,800}piano\(/.test(s)) {
  throw new Error('hardcore path still has a piano voice');
}

const musicMp3 = path.join(path.dirname(path.resolve(out)), 'music/hardcore_remix.mp3');
if (!fs.existsSync(musicMp3) || fs.statSync(musicMp3).size < 100000) {
  throw new Error('missing music/hardcore_remix.mp3');
}

fs.writeFileSync(out, s);
fs.writeFileSync(path.join(path.dirname(path.resolve(out)), 'version.json'), JSON.stringify({v: '1.2.50'}) + '\n');
console.log('Built 1.2.50 remix + cave moods: ' + out);
