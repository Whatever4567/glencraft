// 1.2.48: spiders and other hostiles must not target or damage clansmen / friendly NPCs.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const file = process.argv[2] || new URL('../index.html', import.meta.url).pathname;
const html = fs.readFileSync(file, 'utf8');
const src = fs.readFileSync(new URL('../tools/content-source/v1248.js', import.meta.url), 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(/const GAME_VERSION = '1\.2\.(48|49|50|51|52|53)';/.test(html), 'GAME_VERSION is 1.2.48+');
ok(/glencraft-build: b12(48|50)-v1\.2\.(48|50)/.test(html), 'build marker is present');
ok(html.includes('GLX-V1248') && html.includes('__v1248'), 'v1248 module is embedded');
ok(src.includes("clansman") && src.includes('isFriendly'), 'source lists clansman as friendly');
ok(html.includes('window.__v1248 && __v1248.isFriendly(m)'), 'nspider prey loop skips friendly NPCs');

// Run the friendliness helper and the damage/hunt guards in isolation.
const W = {
  __v1248: null, mobs: [],
  updateMobs() {},
  damageMob(a, dmg, byPlayer) { a._hit = (a._hit || 0) + dmg; a._by = byPlayer; return a; },
  makePig() { return {kind: 'pig', hitY: 0.55, hitR: 0.7, tall: 1}; },
  generate() { return 'gen'; },
  enterWorld() { return 'ew'; },
  serialize() { return {}; },
  playSound() {},
  setInterval() { return 0; },
  THREE: { Quaternion: function(){}, Vector3: function(){} }
};
W.window = W;
new Function('window', 'with(window){' + src + '}').call(W, W);
const U = W.__v1248;
ok(U && typeof U.isFriendly === 'function', 'helper is installed');
ok(U.isFriendly({kind: 'clansman'}) && U.isFriendly({kind: 'farmer'}) && U.isFriendly({kind: 'agarthan'}), 'clansman, farmer and agarthan are friendly');
ok(!U.isFriendly({kind: 'nspider'}) && !U.isFriendly({kind: 'zombie'}) && !U.isFriendly({kind: 'spider'}), 'hostiles are not friendly');

W.mobs = [
  {kind: 'nspider', hostile: true, vic: {kind: 'clansman', hp: 10}, g: {}},
  {kind: 'clansman', hp: 10, g: {}}
];
W.mobs[0].vic = W.mobs[1];
W.updateMobs(0.016);
ok(W.mobs[0].vic == null, 'updateMobs clears a spider victim that is a clansman');

const clansman = {kind: 'clansman', hp: 10};
W.mobs = [{kind: 'nspider', vic: clansman, hostile: true}];
W.damageMob(clansman, 3, false);
ok(!clansman._hit, 'damageMob does not apply non-player damage to a clansman a spider is hunting');
W.damageMob(clansman, 3, true);
ok(clansman._hit === 3, 'the player can still damage a clansman');

console.log('v1248-spiders-friendly ok', n);
