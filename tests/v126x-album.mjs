// Album soundtrack (unpublished 1.2.6x): context playlists, lazy ogg+mp3, old soundtrack intact.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const file = process.argv[2] || new URL('../index.html', import.meta.url).pathname;
const html = fs.readFileSync(file, 'utf8');
const v1248 = fs.readFileSync(new URL('../tools/content-source/v1248.js', import.meta.url), 'utf8');
const album = fs.readFileSync(new URL('../tools/content-source/v126x-album.js', import.meta.url), 'utf8');
const credits = fs.readFileSync(new URL('../CREDITS.md', import.meta.url), 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes("const GAME_VERSION = '1.2.53';") || html.includes("const GAME_VERSION = '1.2.52';"),
  'public version is unchanged');
ok(html.includes('id="ostSeg"') && html.includes('data-ost="calm"') && html.includes('data-ost="classic"') && html.includes('data-ost="hardcore"'),
  'Calm / Classic / Happy Hardcore picker remains');
ok(html.includes('data-ost="album"') && html.includes('GLX-V126X-ALBUM'), 'Album mode is present');
ok(v1248.includes("'album'") && v1248.includes('__v126x'), 'v1248 hands Album ticks to the new player');
ok(html.includes('hardcore_remix.mp3') && html.includes('music/glen_dawn.mp3') && html.includes('music/highland_mist.mp3'),
  'Classic tracks and the remix stay referenced');
ok(album.includes("music/album/") && album.includes('.ogg') && album.includes('.mp3'),
  'album player lazy-loads OGG with an MP3 fallback');
ok(album.includes('the_glen_opens') && album.includes('heather_road') && album.includes('blue_vault') && album.includes('choir_of_the_hollow'),
  'batch 1 titles are in the context pools');
ok(album.includes('drove_road') && album.includes('peat_fire') && album.includes('purple_chamber') && album.includes('white_pass')
  && album.includes('long_sand') && album.includes('red_horizon') && album.includes('between_worlds') && album.includes('down_among_the_reeds'),
  'batch 2 fallback-filling titles are in the context pools');
ok(album.includes("purple: ['purple_chamber']"),
  'purple cave plays Purple Chamber, not the blue fallback');
ok(album.includes("return 'menu'") && album.includes("return 'moon'") && album.includes("return 'volcano'") && album.includes("return 'loch'"),
  'context detector covers menu, moon, volcano and loch');

const tracks = [
  'the_glen_opens', 'heather_road', 'still_water', 'watcher_on_the_ridge',
  'blue_vault', 'choir_of_the_hollow', 'silver_sea', 'ash_line',
  'drove_road', 'peat_fire', 'purple_chamber', 'white_pass',
  'long_sand', 'red_horizon', 'between_worlds', 'down_among_the_reeds'
];
for (const id of tracks) {
  const ogg = new URL('../music/album/' + id + '.ogg', import.meta.url);
  const mp3 = new URL('../music/album/' + id + '.mp3', import.meta.url);
  ok(fs.existsSync(ogg) || fs.existsSync(mp3), id + ' encoded file exists');
  const p = fs.existsSync(ogg) ? ogg : mp3;
  if (p) {
    const info = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', p.pathname], { encoding: 'utf8' }));
    const dur = Number(info.format.duration);
    ok(dur >= 120 && dur <= 260, id + ' is 2–4 minutes (got ' + dur.toFixed(1) + 's)');
  }
}
ok(!album.includes('freesound') && !album.includes('youtube.com') && !v1248.includes('youtube.com/watch'),
  'no third-party recordings referenced');
ok(credits.includes('v1.2.6x') && /Original Soundtrack|Album mode/i.test(credits),
  'CREDITS records the album');
ok(credits.includes('hardcore_remix') && /Classic soundtrack/i.test(credits),
  'CREDITS still record the remix and Classic soundtrack');

console.log(n + ' checks passed');
