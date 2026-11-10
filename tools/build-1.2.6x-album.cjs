#!/usr/bin/env node
'use strict';
// Local / unpublished: inject Album soundtrack mode on top of live 1.2.54.
// Does not bump GAME_VERSION. Does not replace Classic, Calm, or the remix.
// Module replacement stops at the next /* GLX- marker (or the module IIFE
// close) so the V1251 pop-star block and other 1.2.54 code in the same
// <script> stay intact. The previous end-at-</script> cut would delete them.
const fs = require('node:fs');
const path = require('node:path');
const out = process.argv[2] || path.join(__dirname, '../index.html');
let s = fs.readFileSync(out, 'utf8');

function one(a, b, label) {
  const i = s.indexOf(a);
  if (i < 0) throw new Error('missing ' + (label || a.slice(0, 120)));
  if (s.indexOf(a, i + 1) >= 0) throw new Error('not unique ' + (label || a.slice(0, 120)));
  s = s.slice(0, i) + b + s.slice(i + a.length);
}

// End of a GLX module starting at `start`. Prefer the next sibling /* GLX-
// marker; otherwise the closing `})();`. Never slice through </script>.
function moduleEnd(s, start) {
  const after = start + 2; // skip this module's opening /*
  const nextGlx = s.indexOf('\n/* GLX-', after);
  const scriptEnd = s.indexOf('</script>', start);
  if (nextGlx >= 0 && (scriptEnd < 0 || nextGlx < scriptEnd)) {
    return nextGlx + 1; // keep the newline before the next marker
  }
  const closeTok = '\n})();\n';
  const close = s.indexOf(closeTok, start);
  if (close >= 0 && (scriptEnd < 0 || close < scriptEnd)) {
    return close + closeTok.length;
  }
  throw new Error('cannot find end of GLX module at ' + start + ' without crossing </script>');
}

// Soundtrack picker: add Album without removing the existing three modes.
if (s.includes('data-ost="album"')) {
  // already present
} else {
  one(
    '<button data-ost="hardcore" data-testid="settings-ost-hardcore">Happy Hardcore</button></div></div>',
    '<button data-ost="hardcore" data-testid="settings-ost-hardcore">Happy Hardcore</button>' +
    '<button data-ost="album" data-testid="settings-ost-album">Album</button></div></div>',
    'ostSeg album button'
  );
}

const hadPopstar = s.includes('GLX-V1251-START') && s.includes('GLX-V1251-END');

// Replace the v1248 module with the patched source (album mode hooks).
const v1248 = fs.readFileSync(path.join(__dirname, 'content-source/v1248.js'), 'utf8');
if (!s.includes('GLX-V1248')) throw new Error('missing v1248 module in index.html');
{
  const start = s.indexOf('/* GLX-V1248');
  if (start < 0) throw new Error('cannot find v1248 module');
  const end = moduleEnd(s, start);
  s = s.slice(0, start) + v1248.replace(/\s+$/, '') + '\n' + s.slice(end);
}

// Inject or replace the album player immediately after v1248, before any later
// GLX module (including GLX-V1251-START).
const album = fs.readFileSync(path.join(__dirname, 'content-source/v126x-album.js'), 'utf8');
if (s.includes('GLX-V126X-ALBUM')) {
  const start = s.indexOf('/* GLX-V126X-ALBUM');
  if (start < 0) throw new Error('cannot find album module');
  const end = moduleEnd(s, start);
  s = s.slice(0, start) + album.replace(/\s+$/, '') + '\n' + s.slice(end);
} else {
  const start = s.indexOf('/* GLX-V1248');
  if (start < 0) throw new Error('missing v1248 module to inject album after');
  const end = moduleEnd(s, start);
  s = s.slice(0, end) + album.replace(/\s+$/, '') + '\n' + s.slice(end);
}

if (!s.includes("const GAME_VERSION = '1.2.54';") && !s.includes("const GAME_VERSION = '1.2.53';") && !s.includes("const GAME_VERSION = '1.2.52';")) {
  throw new Error('expected to stay on live 1.2.54 (or 1.2.53/1.2.52) — refused to bump the public version');
}
if (!s.includes('data-ost="album"')) throw new Error('album picker button missing');
if (!s.includes("OST_MODES = ['calm', 'classic', 'hardcore', 'album']")) throw new Error('OST_MODES missing album');
if (!s.includes('GLX-V126X-ALBUM') || !s.includes('music/album/')) throw new Error('album player missing');
if (!s.includes('hardcore_remix.mp3') || !s.includes('music/glen_dawn.mp3')) {
  throw new Error('classic / remix references must stay intact');
}
if (hadPopstar && (!s.includes('GLX-V1251-START') || !s.includes('GLX-V1251-END'))) {
  throw new Error('V1251 pop-star block was deleted — build must preserve it');
}

const musicDir = path.join(path.dirname(path.resolve(out)), 'music/album');
const need = ['the_glen_opens', 'heather_road', 'still_water', 'watcher_on_the_ridge',
  'blue_vault', 'choir_of_the_hollow', 'silver_sea', 'ash_line',
  'drove_road', 'peat_fire', 'purple_chamber', 'white_pass',
  'long_sand', 'red_horizon', 'between_worlds', 'down_among_the_reeds',
  'below_the_map', 'open_sketch', 'inner_sun', 'pine_shelter',
  'owl_hour', 'claymore', 'starlight_show', 'last_light',
  'moor_light', 'midday_glen', 'bothy_smoke', 'northern_quiet',
  'ridge_wind', 'stone_memory', 'boss_of_the_glen', 'crystal_hunt'];
for (const id of need) {
  const ogg = path.join(musicDir, id + '.ogg');
  const mp3 = path.join(musicDir, id + '.mp3');
  if (!fs.existsSync(ogg) && !fs.existsSync(mp3)) {
    throw new Error('missing album file for ' + id);
  }
}

fs.writeFileSync(out, s);
console.log('Built unpublished album mode into ' + out);
