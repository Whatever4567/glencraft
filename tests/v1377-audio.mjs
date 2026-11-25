// v1377/v1378: menu theme remix + regional Scottish/UK bird samples.
import {readFileSync, existsSync, statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
const root = process.env.GC_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const slice = (id) => {
  const a = html.indexOf('<script id="'+id+'">');
  if (a < 0) return '';
  return html.slice(a, html.indexOf('</script>', a) + 9);
};
const menu = slice('glx-menu1377');
const bird = slice('glx-bird1377');
let n = 0, fail = 0;
const ok = (c, m) => { n++; if (!c) { fail++; console.log('FAIL', m); } };

ok(html.includes('<script id="glx-menu1377">') && html.includes('GLX-MENU1377'), 'MENU1377 IIFE is in the page');
ok(menu.includes('window.__noMenu1377') || menu.includes('WIN.__noMenu1377'), 'flag __noMenu1377 restores the old menu ambience');
ok(menu.includes('music/menu_theme.ogg') && menu.includes('music/menu_theme.mp3'), 'menu theme has ogg with an mp3 fallback');
ok(menu.includes('loopStart') && menu.includes('48') && menu.includes('112'), 'menu theme has a seamless loop after the intro');
ok(menu.includes('hushC132') || menu.includes('__c132'), 'menu theme hushes the old nature-day bed');
ok(menu.includes('__v126x'), 'menu theme does not let the album soundtrack start on the title screen');
ok(/fade|exponentialRampToValueAtTime/.test(menu) && menu.includes('started'), 'menu theme fades out when the game starts');

ok(html.includes('<script id="glx-bird1377">') && html.includes('GLX-BIRD1377'), 'BIRD1377 IIFE is in the page');
ok(bird.includes('window.__noBird1377') || bird.includes('WIN.__noBird1377'), 'flag __noBird1377 restores the synthesised birds');
ok(html.includes('__bird1377.play') && html.includes("SONG.owl(") && html.includes("SONG[k]"), 'UKS hook plays samples by default and keeps the old songs behind the flag');
ok(bird.includes('__g1367') && bird.includes('biome'), 'birds use the 1.2.129 regional biomes');
ok(bird.includes('reed_warbler') && bird.includes('sedge_warbler') && bird.includes('lapwing'), 'fens have their own mix');
ok(bird.includes('raven') && bird.includes('buzzard'), 'Welsh and Lake District uplands have their own mix');
ok(bird.includes('snipe') && bird.includes('cuckoo') && bird.includes('curlew'), 'Irish bog and drumlins have their own mix');
ok(bird.includes('corncrake') && bird.includes('oystercatcher'), 'islands and machair have their own mix');
ok(bird.includes('crossbill') && bird.includes('golden_eagle'), 'Highland pine has its own mix');
ok(bird.includes('yellowhammer') && bird.includes('corn_bunting') && bird.includes('skylark'), 'southern downs have their own mix');
ok(bird.includes('woodpecker') && bird.includes('nuthatch'), 'Midlands oak woods have their own mix');
ok(bird.includes('stonechat') && bird.includes('whitethroat'), 'south-west scrub has its own mix');
ok(bird.includes('curlew') && html.includes('MOOR') || bird.includes('5:'), 'Pennine moor is in the biome table');
ok(bird.includes('isDawn') && bird.includes('WOOD'), 'dawn chorus is denser woodland song');
ok(bird.includes('owl') && bird.includes('night'), 'night is the tawny owl only');
ok(bird.includes('createPanner') || bird.includes('StereoPanner'), 'one-shots are positioned in 3D');
ok(bird.includes('__uks.coast') || bird.includes('COAST'), 'coast overlays gulls and oystercatcher');
ok(!bird.includes('GLX-V1248') && !menu.includes('startHardcore') && !bird.includes('startBed'), 'soundtrack system is not rewritten');
ok(html.includes('__fpa') && html.includes('__noPhand1360') && html.includes('__noCave1366') && html.includes('__noG1367') && html.includes('__noSky1371') && html.includes('__noLogo1376'), 'keeps existing feature flags');

const menuOgg = join(root, 'music/menu_theme.ogg');
const menuMp3 = join(root, 'music/menu_theme.mp3');
ok(existsSync(menuOgg) && statSync(menuOgg).size > 20000, 'menu_theme.ogg is present');
ok(existsSync(menuMp3) && statSync(menuMp3).size > 20000, 'menu_theme.mp3 fallback is present');

const needed = ['robin','wren','blackbird','song_thrush','chaffinch','nuthatch','woodpecker','great_tit','blue_tit','skylark','curlew','cuckoo','snipe','yellowhammer','corn_bunting','reed_warbler','sedge_warbler','lapwing','raven','buzzard','corncrake','oystercatcher','gull','gull_bh','crossbill','golden_eagle','stonechat','whitethroat','owl'];
const missing = needed.filter(id => !existsSync(join(root, 'assets/sfx/birds1377', id + '.ogg')));
ok(missing.length === 0, 'all bird clips are present' + (missing.length ? ': missing ' + missing.join(',') : ''));

ok(!/food|hunger|drumstick|\beat\b|pie|cake|bread|cook|meal|snack|jam|honey|sugar|tea|dinner|lunch|breakfast|fruit|berry|apple|sweet|tasty/i.test(menu+bird), 'patch has no food words');

if (fail) { console.log('v1377-audio FAIL', fail + '/' + n); process.exit(1); }
console.log('v1377-audio ok', n);
