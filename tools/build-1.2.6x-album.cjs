#!/usr/bin/env node
'use strict';
// Local / unpublished: inject Album soundtrack mode on top of live 1.2.53.
// Does not bump GAME_VERSION. Does not replace Classic, Calm, or the remix.
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

// Replace the v1248 module with the patched source (album mode hooks).
const v1248 = fs.readFileSync(path.join(__dirname, 'content-source/v1248.js'), 'utf8');
if (!s.includes('GLX-V1248')) throw new Error('missing v1248 module in index.html');
{
  const start = s.indexOf('/* GLX-V1248');
  const end = s.indexOf('</script>', start);
  if (start < 0 || end < 0) throw new Error('cannot replace v1248 module');
  s = s.slice(0, start) + v1248 + '\n' + s.slice(end);
}

// Inject or replace the album player just before </script> following v1248.
const album = fs.readFileSync(path.join(__dirname, 'content-source/v126x-album.js'), 'utf8');
if (s.includes('GLX-V126X-ALBUM')) {
  const start = s.indexOf('/* GLX-V126X-ALBUM');
  const end = s.indexOf('</script>', start);
  if (start < 0 || end < 0) throw new Error('cannot replace album module');
  s = s.slice(0, start) + album + '\n' + s.slice(end);
} else {
  const start = s.indexOf('/* GLX-V1248');
  const end = s.indexOf('</script>', start);
  if (end < 0) throw new Error('missing </script> to inject album module');
  s = s.slice(0, end) + '\n' + album + '\n' + s.slice(end);
}

if (!s.includes("const GAME_VERSION = '1.2.53';") && !s.includes("const GAME_VERSION = '1.2.52';")) {
  throw new Error('expected to stay on live 1.2.53 (or 1.2.52) — refused to bump the public version');
}
if (!s.includes('data-ost="album"')) throw new Error('album picker button missing');
if (!s.includes("OST_MODES = ['calm', 'classic', 'hardcore', 'album']")) throw new Error('OST_MODES missing album');
if (!s.includes('GLX-V126X-ALBUM') || !s.includes('music/album/')) throw new Error('album player missing');
if (!s.includes('hardcore_remix.mp3') || !s.includes('music/glen_dawn.mp3')) {
  throw new Error('classic / remix references must stay intact');
}

const musicDir = path.join(path.dirname(path.resolve(out)), 'music/album');
const need = ['the_glen_opens', 'heather_road', 'still_water', 'watcher_on_the_ridge',
  'blue_vault', 'choir_of_the_hollow', 'silver_sea', 'ash_line'];
for (const id of need) {
  const ogg = path.join(musicDir, id + '.ogg');
  const mp3 = path.join(musicDir, id + '.mp3');
  if (!fs.existsSync(ogg) && !fs.existsSync(mp3)) {
    throw new Error('missing album file for ' + id);
  }
}

fs.writeFileSync(out, s);
console.log('Built unpublished album mode into ' + out);
