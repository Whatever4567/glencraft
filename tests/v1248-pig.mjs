// 1.2.48 pigs: bigger, spawn upright, mud fades faster, pools helper, quiet voices, pinker texture.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const root = new URL('..', import.meta.url);
const file = process.argv[2] || new URL('../index.html', import.meta.url).pathname;
const html = fs.readFileSync(file, 'utf8');
const src = fs.readFileSync(new URL('../tools/content-source/v1248.js', import.meta.url), 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes("pig: {f: 'pig2', k: 1.4}"), 'HD pig scale is 1.4');
ok(html.includes("st: 'roam', t: 0, r: 0, side: sd, mud: 0"), 'pigs spawn standing and clean, not already on their side');
ok(!html.includes("st: 'lie', t: 0, r: sd * 1.45, side: sd, mud: 0.85"), 'old on-side spawn is gone');
ok(html.includes('S.mud = Math.max(0, S.mud - dt / 10)'), 'mud tint fades in about 10 s, not 40');
ok(html.includes('PIG_SCALE = 1.4') || src.includes('PIG_SCALE = 1.4'), 'runtime keeps the 1.4 scale');
ok(src.includes('posePig') && src.includes('diagonal') && src.includes('snuffle'), 'walk, idle and rooting animation is present');
ok(src.includes('placePools1248') && src.includes('T.FARM') && src.includes('T.GRASS'), 'mud pools are placed in grassland and farmland');
ok(src.includes('isEdit') && src.includes('v1248pools'), 'saved player edits are skipped and a one-shot flag is stored');
ok(src.includes('forceUpright') && src.includes('!onMud'), 'pigs are forced upright off the mud');
ok(src.includes('PIG_VOL = 0.16') && src.includes('8 + Math.random() * 17'), 'pig voices are quiet and 8–25 s apart');
ok(src.includes("kind === 'squeal'") && src.includes("kind === 'happy'"), 'hurt squeal and happy mud grunt exist');

const tex2 = path.join(root.pathname, 'assets/tex/pig2_2k.webp');
const tex4 = path.join(root.pathname, 'assets/tex/pig2_4k.webp');
ok(fs.existsSync(tex2) && fs.existsSync(tex4), 'pig 2k and 4k textures exist');
ok(fs.statSync(tex2).size < 2_000_000 && fs.statSync(tex4).size < 4_000_000, 'texture files stay a reasonable size');
ok(html.includes('worldTilesUntouched'), 'world block atlas was not re-prismed');

ok(!html.includes('a.wallow -= 1; a.rig.rotation.z = a.wallow > 0'), 'the old 1 s side-roll interval is disabled');
ok(src.includes('drivePigClip') && src.includes('H.act.walk') && src.includes('hookPigHdFrame'), 'HD pigs play the pig2 walk clip after c310');
ok(src.includes('snap them upright') || src.includes('forceUpright(a)'), 'grass path snaps upright without waiting for S.r to decay');
ok(!src.includes('Math.abs(S.r || 0) < 0.08'), 'the old weak |S.r| < 0.08 upright gate is gone');

ok(src.includes('_yaw1248') && src.includes('Math.PI / 2'), 'HD pig is yawed so a Z roll is a side-lie, not a somersault');
console.log('v1248-pig ok', n);
