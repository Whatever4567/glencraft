// v1.2.22: best armour by slot, white jetpack button and 2x speed, no gold grant for new worlds, drink id mapping, baked tattie model
import fs from 'node:fs'; import assert from 'node:assert';
import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
import {parseHTML} from '/workspace/domtools/node_modules/linkedom/esm/index.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
const src = cut('/* GLX-EQ1222', '/* GLX-CL1222');
const eq = cut('function equipArmour(id) {', '\nconst blockGroup');
// drink ids and names straight from the source, and the icon move
assert(/BREW:119, IRONBREW:121/.test(html) && /119:'Brew', 121:'Iron Brew'/.test(html), 'drink ids'); assert(html.includes('t(IT.IRONBREW || 121, iconBrew)') && !html.includes('t(IT.BREW || 121, iconBrew)'), 'IRN can painted on Iron Brew, not Brew');
assert(/85:'Baked tattie'/.test(html));
const {document} = parseHTML('<html><body><div id="armour">' + ['helmet', 'chest', 'legs', 'boots', 'jetpack', 'offhand'].map(n => '<div class="aslot" data-testid="armour-slot-' + n + '"><i></i><div></div></div>').join('') + '</div></body></html>');
const ce = document.createElement.bind(document); const fake = () => new Proxy(function () {}, {get: (t, k) => k === 'toDataURL' ? () => 'data:fake' : (k === 'width' || k === 'height') ? 512 : fake(), apply: () => fake(), set: () => true});
document.createElement = t => t === 'canvas' ? {width: 0, height: 0, getContext: () => fake(), toDataURL: () => 'data:' + Math.random()} : ce(t);
const ARMOUR = {}; [['copper', 104, [1, 3, 2, 1]], ['iron', 108, [2, 6, 5, 2]], ['gold', 112, [2, 5, 3, 1]], ['diamond', 129, [3, 8, 6, 3]]].forEach(([m, b, pts]) => { for (let s = 0; s < 4; s++) ARMOUR[b + s] = {slot: s, mat: m, pts: pts[s]}; }); ARMOUR[291] = {slot: 4, mat: 'jet', pts: 2}; ARMOUR[777] = {slot: 4, mat: 'jet', pts: 2};
let ups = 0; const toasts = []; const G = {THREE, document, navigator: {userAgent: 'x'}, ARMOUR, inv: {}, armour: [0, 0, 0, 0, 0], MODE: {}, NAMES: {119: 'Brew', 121: 'Iron Brew', 85: 'Baked tattie'}, ICONS: {}, ICON_KEY: {}, spriteMats: {}, drops: [], scene: new THREE.Scene(),
  P: {x: 0, y: 50, z: 0, vy: 0, yaw: 0, onGround: false}, H: 128, flying: false, swimming: false, moveAxis: () => { G.moved = (G.moved || 0) + 1; }, sfx() {}, refreshArmour() {}, toast: m => toasts.push(m), updateArmourSlots() {}, setInterval: () => 0, clearInterval() {},
  updatePlayer(dt) { ups++; G.P.vy = Math.min(12, G.P.vy + 52 * dt); }, enterWorld() {}, makeItemMesh: () => new THREE.Group(), dropItem(id, n) { const m = new THREE.Sprite(); G.drops.push({id, n, m}); G.scene.add(m); }};
G.cnt = id => G.inv[id] || 0; G.useUp = (id, n) => { G.inv[id] = Math.max(0, G.cnt(id) - (n || 1)); }; G.addItem = (id, n) => { G.inv[id] = G.cnt(id) + n; };
G.window = G; new Function('with(this){' + eq + ';this.equipArmour=equipArmour;this.unequip=unequip;' + src + '}').call(G); const U = G.__eq1222; assert.equal(U.err, null, U.err);
const tot = () => Object.values(G.inv).reduce((a, b) => a + b, 0) + G.armour.filter(Boolean).length;
const tap = n => document.querySelector('[data-testid=armour-slot-' + n + ']').dispatchEvent(new document.defaultView.Event('click', {bubbles: true}));
// helmets owned: copper 104 (1 pt), gold 112 (2), iron 108 (2), diamond 129 (3)
Object.assign(G.inv, {104: 1, 112: 1, 108: 1, 130: 2, 109: 1}); const t0 = tot();
tap('helmet'); assert.equal(G.armour[0], 108, 'iron beats gold on a points tie (lasts longer)'); G.inv[129] = 1; tap('helmet'); assert.equal(G.armour[0], 129, 'diamond best'); assert.equal(G.inv[108], 1, 'old helmet back');
tap('helmet'); assert.equal(G.armour[0], 0, 'already best: tap takes it off'); assert.equal(G.inv[129], 1);
tap('chest'); assert.equal(G.armour[1], 130); assert.equal(G.inv[130], 1); assert.equal(tot(), t0 + 1, 'nothing made or lost (+1 is the diamond helmet given above)');
tap('legs'); assert.equal(G.armour[2], 0); assert(toasts.length);
// jetpack: white only
G.inv[777] = 1; G.armour[4] = 0; tap('jetpack'); assert.equal(G.armour[4], 0, 'no white jetpack: gold not worn by the button'); G.inv[291] = 1; G.armour[4] = 777; G.inv[777] = 0; tap('jetpack'); assert.equal(G.armour[4], 291); assert.equal(G.inv[777], 1, 'gold goes back');
// 2x climb for the white one only
G.__c102j = {boost: true, air: 1}; G.P.vy = 0; G.updatePlayer(0.05, 1, 0); const vW = G.P.vy; assert(vW > 2.6 * 1.9, 'white: two climb steps'); G.P.vy = 11; for (let i = 0; i < 10; i++) G.updatePlayer(0.05, 0, 0); assert(G.P.vy > 12 && G.P.vy <= 24, 'white cap doubled');
G.armour[4] = 777; G.P.vy = 0; G.updatePlayer(0.05, 1, 0); assert(Math.abs(G.P.vy - 2.6) < 1e-9, 'gold unchanged');
// new world: the Golden Jetpack grant is skipped once, an owned gold one is never touched; loaded saves keep their grant logic
G.enterWorld(null); G.inv[777] = 0; G.addItem(777, 1); assert.equal(G.cnt(777), 0); assert.equal(U.gjBlocked, 1); G.addItem(777, 1); assert.equal(G.cnt(777), 1, 'only the one start grant');
G.enterWorld({s: 1}); G.addItem(777, 1); assert.equal(G.cnt(777), 2);
// icons and the offhand hand
G.updateArmourSlots(); assert.equal(document.querySelector('[data-testid=armour-slot-offhand] i').textContent, '\u270B');
assert.equal(U.applyIcons(), 2); assert.equal(G.ICONS[119], U._brew); assert.equal(G.ICONS[85], U._tat); assert.equal(U.applyIcons(), 0, 'stable');
// baked tattie: shared model parts, held and dropped
const a = G.makeItemMesh(85), b = G.makeItemMesh(85); const ga = [], gb = []; a.traverse(o => o.isMesh && ga.push(o.geometry)); b.traverse(o => o.isMesh && gb.push(o.geometry)); console.log(ga.length, gb.length, G.__eq1222.err); assert(ga.length >= 4 && ga.every((g, i) => g === gb[i]), 'shared geometry');
assert.equal(a.userData.__gs, null); G.dropItem(85, 1); assert(G.drops[0].m.userData.tat1222); assert.equal(U.texN, 512, 'texture size reported, not 4K');
console.log('v1222-equip ok');
