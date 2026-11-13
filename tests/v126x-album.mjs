// Album soundtrack (1.2.56, 36 tracks): context playlists, lazy ogg+mp3, old soundtrack intact.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const file = process.argv[2] || new URL('../index.html', import.meta.url).pathname;
const html = fs.readFileSync(file, 'utf8');
const v1248 = fs.readFileSync(new URL('../tools/content-source/v1248.js', import.meta.url), 'utf8');
const album = fs.readFileSync(new URL('../tools/content-source/v126x-album.js', import.meta.url), 'utf8');
const credits = fs.readFileSync(new URL('../CREDITS.md', import.meta.url), 'utf8');
const build = fs.readFileSync(new URL('../tools/build-1.2.6x-album.cjs', import.meta.url), 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes("const GAME_VERSION = '1.2.68';") || html.includes("const GAME_VERSION = '1.2.67';") || html.includes("const GAME_VERSION = '1.2.66';") || html.includes("const GAME_VERSION = '1.2.65';") || html.includes("const GAME_VERSION = '1.2.64';") || html.includes("const GAME_VERSION = '1.2.63';") || html.includes("const GAME_VERSION = '1.2.62';") || html.includes("const GAME_VERSION = '1.2.61';") || html.includes("const GAME_VERSION = '1.2.60';") || html.includes("const GAME_VERSION = '1.2.59';") || html.includes("const GAME_VERSION = '1.2.58';") || html.includes("const GAME_VERSION = '1.2.57';") || html.includes("const GAME_VERSION = '1.2.56';") || html.includes("const GAME_VERSION = '1.2.55';") || html.includes("const GAME_VERSION = '1.2.54';") || html.includes("const GAME_VERSION = '1.2.53';") || html.includes("const GAME_VERSION = '1.2.52';"),
  'version is 1.2.56 (or a previous 1.2.52–1.2.55 launch)');
ok(html.includes('id="ostSeg"') && html.includes('data-ost="calm"') && html.includes('data-ost="classic"') && html.includes('data-ost="hardcore"'),
  'Calm / Classic / Happy Hardcore picker remains');
ok(html.includes('data-ost="album"') && html.includes('GLX-V126X-ALBUM'), 'Album mode is present');
ok(v1248.includes("'album'") && v1248.includes('__v126x'), 'v1248 hands Album ticks to the new player');
ok(html.includes('hardcore_remix.mp3') && html.includes('music/glen_dawn.mp3') && html.includes('music/highland_mist.mp3'),
  'Classic tracks and the remix stay referenced');
ok(html.includes('GLX-V1251-START') && html.includes('GLX-V1251-END') && html.includes('popstar_song'),
  'V1251 pop-star block and her song stay in index.html');
ok(build.includes('function moduleEnd') && build.includes('GLX-V1251') && build.includes('const end = moduleEnd')
  && build.includes('without crossing </script>'),
  'build script replaces only GLX modules and refuses to cut through </script>');
ok(album.includes("music/album/") && album.includes('.ogg') && album.includes('.mp3') && album.includes('SRC_Q'),
  'album player lazy-loads OGG with an MP3 fallback and a cache-bust query');
ok(album.includes('the_glen_opens') && album.includes('heather_road') && album.includes('blue_vault') && album.includes('choir_of_the_hollow'),
  'batch 1 titles are in the context pools');
ok(album.includes('drove_road') && album.includes('peat_fire') && album.includes('purple_chamber') && album.includes('white_pass')
  && album.includes('long_sand') && album.includes('red_horizon') && album.includes('between_worlds') && album.includes('down_among_the_reeds'),
  'batch 2 fallback-filling titles are in the context pools');
ok(album.includes("purple: ['purple_chamber']"),
  'purple cave plays Purple Chamber, not the blue fallback');
ok(album.includes('below_the_map') && album.includes('open_sketch') && album.includes('inner_sun') && album.includes('pine_shelter')
  && album.includes('owl_hour') && album.includes('claymore') && album.includes('starlight_show') && album.includes('last_light'),
  'batch 3 titles are in the context pools');
ok(album.includes("hell: ['below_the_map']") && album.includes("creative: ['open_sketch']")
  && album.includes("combat: ['claymore']") && album.includes("popstar: ['starlight_show']")
  && album.includes("credits: ['last_light']"),
  'batch 3 contexts map to their dedicated cues');
ok(album.includes('moor_light') && album.includes('midday_glen') && album.includes('bothy_smoke') && album.includes('northern_quiet')
  && album.includes('ridge_wind') && album.includes('stone_memory') && album.includes('boss_of_the_glen') && album.includes('crystal_hunt'),
  'batch 4 titles are in the context pools');
ok(album.includes("moor: ['moor_light']") && album.includes("high: ['ridge_wind']")
  && album.includes("boss: ['boss_of_the_glen']") && album.includes("crystal: ['crystal_hunt']"),
  'batch 4 contexts map to their dedicated cues');
ok(album.includes('bounce_the_glen') && album.includes('nightcore_loch') && album.includes('cairn_flash') && album.includes('till_the_hills'),
  'batch 5 hardcore album sides are in the bounce pool');
ok(album.includes("bounce: ['bounce_the_glen'") && album.includes("return 'bounce'"),
  'bounce sides are opt-in and do not auto-play in day/night rotation');
ok(!album.includes('hardcore_remix'),
  'album player does not reference the live Happy Hardcore remix file');
ok(album.includes("return 'moor'") && album.includes("return 'high'") && album.includes("return 'pine'")
  && album.includes("return 'boss'") && album.includes("'crystal'"),
  'detectContext returns moor, high, pine, boss and crystal');
ok((album.includes("return 'combat'") || album.includes(": 'combat'")) && album.includes("return 'popstar'") && album.includes("return 'credits'"),
  'detectContext returns combat, popstar and credits');
ok(album.includes('popstarSongOn') && album.includes('songOn') && album.includes('U.ducked'),
  'album ducks or skips while the pop star\'s diegetic song is playing');
ok(album.includes("return 'menu'") && album.includes("return 'moon'") && album.includes("return 'volcano'") && album.includes("return 'loch'"),
  'context detector covers menu, moon, volcano and loch');

const tracks = [
  'the_glen_opens', 'heather_road', 'still_water', 'watcher_on_the_ridge',
  'blue_vault', 'choir_of_the_hollow', 'silver_sea', 'ash_line',
  'drove_road', 'peat_fire', 'purple_chamber', 'white_pass',
  'long_sand', 'red_horizon', 'between_worlds', 'down_among_the_reeds',
  'below_the_map', 'open_sketch', 'inner_sun', 'pine_shelter',
  'owl_hour', 'claymore', 'starlight_show', 'last_light',
  'moor_light', 'midday_glen', 'bothy_smoke', 'northern_quiet',
  'ridge_wind', 'stone_memory', 'boss_of_the_glen', 'crystal_hunt',
  'bounce_the_glen', 'nightcore_loch', 'cairn_flash', 'till_the_hills'
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
ok(credits.includes('v1.2.54') && /Album soundtrack mode|Album mode/i.test(credits),
  'CREDITS records the live album');
ok(credits.includes('drove_road') && /v1.2.56 Album soundtrack/i.test(credits),
  'CREDITS records 1.2.56 batch 2 as shipped');
ok(credits.includes('starlight_show') && credits.includes('claymore') && credits.includes('below_the_map'),
  'CREDITS records 1.2.56 batch 3');
ok(credits.includes('moor_light') && credits.includes('boss_of_the_glen') && credits.includes('crystal_hunt') && credits.includes('stone_memory'),
  'CREDITS records 1.2.56 batch 4');
ok(credits.includes('bounce_the_glen') && credits.includes('nightcore_loch') && credits.includes('cairn_flash') && credits.includes('till_the_hills')
  && /does not replace|not replaced/i.test(credits),
  'CREDITS records 1.2.56 batch 5 and that the live remix stays');
ok(credits.includes('hardcore_remix') && /Classic soundtrack/i.test(credits),
  'CREDITS still record the remix and Classic soundtrack');

console.log(n + ' checks passed');
