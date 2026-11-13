import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(join(root, 'index.html'), 'utf8');
const ver = JSON.parse(fs.readFileSync(join(root, 'version.json'), 'utf8'));
const credits = fs.readFileSync(join(root, 'CREDITS.md'), 'utf8');
const src = fs.readFileSync(join(root, 'tools/content-source/egypt-1269.js'), 'utf8');
let n = 0;
function ok(cond, msg) { n++; if (!cond) throw new Error('FAIL ' + n + ': ' + msg); }

ok(ver.v === '1.2.69', 'version.json is 1.2.69');
ok(html.includes("const GAME_VERSION = '1.2.69';"), 'GAME_VERSION is 1.2.69');
ok(html.includes('<!-- glencraft-build: b1269-v1.2.69 -->'), 'build marker');
ok(html.includes('"v":"v1.2.69"'), 'PATCH_NOTES entry');
ok(html.includes('Egypt land is a new Earth-like dimension'), 'notes: Egypt land');
ok(html.includes('framed in gold blocks'), 'notes: gold frame');
ok(html.includes('The Egyptian people have moved out of Glencraft'), 'notes: Egyptians moved');
ok(html.includes('First-person hands and the gold D-pad are left alone'), 'notes: hands/D-pad left alone');
ok(credits.includes('## v1.2.69 Egypt land'), 'CREDITS heading');
ok(credits.includes('old pyramid island'), 'CREDITS pyramid island');
ok(credits.includes('gold blocks'), 'CREDITS gold portal');
ok(credits.includes('Egyptian people have moved out of Glencraft'), 'CREDITS NPCs');

ok(src.includes('function egypt1269(WIN)'), 'IIFE is named egypt1269(WIN) so it does not shadow world W');
ok(!/\(function egypt1269\(W\)/.test(src), 'IIFE must not take W as its parameter');
ok(src.includes("version: '1.2.69-egypt'"), 'version string');
ok(src.includes('T.EGYPTPORTAL'), 'registers T.EGYPTPORTAL');
ok(src.includes('portalId: 773') || src.includes('PORTAL_ID = 773'), 'gold portal block id 773');
ok(src.includes('GOLDBLOCK'), 'gold-block frame');
ok(src.includes('goldFill') || src.includes('function goldFill'), 'gold portal fill');
ok(src.includes('recolour') || src.includes('recolor') || src.includes('goldMap'), 'gold recolour of portal texture');
ok(src.includes('enterDim'), 'uses the existing dimension framework');
ok(src.includes("NAME = 'egypt'") || src.includes("'egypt'"), 'dimension name egypt');
ok(src.includes('genEgypt'), 'Egypt land generator');
ok(src.includes('C.pyramid') && src.includes('fallbackPyramid'), 'restores the original pyramid builder, with a fallback');
ok(src.includes('C.sphinx'), 'places the Great Sphinx');
ok(src.includes('T.SAND') && src.includes('T.WATER'), 'Earth-like sand and sea');
ok(src.includes('placeReturn'), 'return portal');
ok(src.includes('egyptLandBtn') && src.includes('Teleport to Egypt land'), 'pause-menu teleport');
ok(src.includes('evictFolk'), 'moves Egyptians out of the overworld');
ok(src.includes('__c240.spawnAt'), 'overworld spawn is gated; Egypt uses the existing folk spawn');
ok(src.includes('resumeEgypt'), 'player dimension is remembered');
ok(src.includes('gold D-pad are left alone'), 'source records D-pad left alone');
ok(!/\['dU'/.test(src) && !/#dU/.test(src), 'does not touch the gold D-pad');
ok(!/enableKinds|NEW_FP_KINDS\s*=/.test(src), 'does not re-enable NEW_FP_KINDS');
ok(!src.includes('phalanxGeo') && !src.includes('applyRestCurl') && !src.includes('hands-126'), 'does not edit the hand sculpt');

ok(html.includes(src.trim()), 'egypt-1269.js source is injected into the page');

const i1269 = html.indexOf('/* GLX-EG1269');
ok(i1269 > 0, 'GLX-EG1269 present in index');
const i1269End = (() => {
  const next = html.indexOf('\n/* GLX-', i1269 + 10);
  const scr = html.indexOf('</script>', i1269);
  let end = i1269 + 80000;
  if (next > i1269 && next < end) end = next;
  if (scr > i1269 && scr < end) end = scr;
  return end;
})();
const h1269 = html.slice(i1269, i1269End);
ok(h1269.includes('function egypt1269(WIN)'), 'injected IIFE uses WIN');
ok(h1269.includes('genEgypt'), 'injected generator');
ok(h1269.includes('evictFolk'), 'injected evict');
ok(!/\['dU'/.test(h1269) && !/#dU/.test(h1269), 'injected IIFE does not touch the gold D-pad');

ok(html.includes('/* GLX-CASTLE1268'), '1.2.68 garrison work stays');
ok(html.includes('/* GLX-MOBS1267'), '1.2.67 wolf/hag work stays');
ok(html.includes('/* GLX-HANDS1266'), '1.2.66 hands stay');
ok(html.includes('/* GLX-HANDS1263'), '1.2.63 hands stay');
ok(html.includes("restoredFrom: '1e9db15'"), '1263 restore stays');
ok(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad still untouched globally');

const castle = fs.readFileSync(join(root, 'tools/content-source/castle-1268.js'), 'utf8');
ok(castle.includes('seedRoster') && castle.includes('MAX'), 'castle-1268.js is unchanged in spirit');

console.log('all ok (' + n + ')');
