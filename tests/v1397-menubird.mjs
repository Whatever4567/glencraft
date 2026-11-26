// v1397: main menu must not play the old nature-day bird bed under the theme.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function slice(id) {
  const a = html.indexOf('<script id="' + id + '">');
  const b = html.indexOf('</script>', a);
  return a >= 0 && b > a ? html.slice(a, b) : '';
}
let n = 0, fail = 0;
function ok(c, m) { n++; if (!c) { fail++; console.log('FAIL', m); } else console.log('ok', m); }

const patch = slice('glx-menuBird1397');
ok(html.includes('<script id="glx-menuBird1397">') && html.includes('GLX-MENUBIRD1397'), 'MENUBIRD1397 IIFE is in the page');
ok(patch.includes('window.__noMenuBird1397') || patch.includes('WIN.__noMenuBird1397'), 'flag __noMenuBird1397 restores the previous menu-birds behaviour');
ok(patch.includes('nomenubird1397'), 'query flag nomenubird1397 is accepted');
ok(patch.includes('nature_day') && patch.includes('nature_night'), 'hush is scoped to the nature-day and nature-night beds');
ok(patch.includes('HTMLMediaElement.prototype.play') || patch.includes('prototype.play'), 'hooks media play so C132 cannot start the bed on the menu');
ok(patch.includes('!started') || patch.includes('onMenu'), 'only hushes while the game has not started');
ok(patch.includes('__noMenu1377'), 'leaves the old nature bed alone when the 1.2.132 theme is turned off');
ok(!patch.includes('__bird1377.play =') && !patch.includes('assets/sfx/birds1377') && !/unlink|rmdir|delete.*birds1377/.test(patch), 'does not delete or rewrite the in-world bird library');
ok(html.includes('<script id="glx-menu1377">') && html.includes('menu_theme'), 'keeps the 1.2.132 menu theme');
ok(html.includes('<script id="glx-bird1377">') && html.includes('__noBird1377') && fs.existsSync(path.join(root, 'assets/sfx/birds1377/robin.ogg')), 'keeps in-world birds1377 and the robin clip');
ok(html.includes('__c132') && html.includes('nature_day'), 'does not remove the C132 nature bed from the game');
ok(html.indexOf('id="glx-menuBird1397"') > html.indexOf('id="glx-menu1377"'), 'new IIFE is after the menu theme');
ok(!/food|hunger|drumstick|\beat\b|pie|cake|bread|cook|meal|snack|jam|honey|sugar|tea|dinner|lunch|breakfast|fruit|berry|apple|sweet|tasty/i.test(patch), 'patch has no food words');
ok(!patch.includes('startHardcore') && !patch.includes('startBed') && !patch.includes('GLX-V1248'), 'soundtrack system is not rewritten');

const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v;
ok(html.includes("const GAME_VERSION = '" + ver + "';"), 'GAME_VERSION matches version.json');
ok(html.includes('__noMenuBird1397'), 'page mentions the flag');

if (fail) { console.log('FAIL', fail, '/', n); process.exit(1); }
console.log('ok', n);
