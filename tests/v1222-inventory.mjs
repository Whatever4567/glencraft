// v1.2.22 inventory: slot layout over the real count store, swaps by DOM clicks, saves, loadout once, creative bag, tabs and CSS
import fs from 'node:fs'; import assert from 'node:assert';
import {parseHTML} from '/workspace/domtools/node_modules/linkedom/esm/index.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i); return html.slice(i, j); };
const src = cut('/* GLX-INV1222', '/* GLX-C400');
const bi = html.indexOf('function bagItems()'), bagDef = html.slice(bi, html.indexOf('function visibleItems()', bi));
function boot(inv0, hot0, prog0) {
  const {document} = parseHTML('<html><head></head><body><div id="craft"><div class="tabs"><button id="tabInv">Bag</button><button id="tabCraft">Crafting</button><button id="tabChar">Character</button></div><div id="invPane"><div id="invHot"></div><div id="invGrid"></div></div></div></body></html>');
  const ORDER = [], NAMES = {}; for (let i = 1; i <= 80; i++) { ORDER.push(i); NAMES[i] = 'Item ' + i; } NAMES[761] = 'Purple crystal pickaxe'; NAMES[291] = 'Jetpack'; ORDER.push(761, 291);
  const ls = new Map(); const G = {document, ORDER, NAMES, CREATIVE_ALL: ORDER.slice(), TOOL: {761: ['pick']}, ARMOUR: {291: {}}, inv: Object.assign({}, inv0), MODE: {name: 'survival', hotbar: hot0 ? hot0.slice() : undefined}, prog: JSON.parse(JSON.stringify(prog0 || {})),
    selId: 1, started: true, current: {id: 'w1'}, TABS: ['bag', 'craft'], localStorage: {setItem: (k, v) => ls.set(k, v), getItem: k => ls.get(k) ?? null}, ls,
    $: id => document.getElementById(id), slotHTML: (id, n) => '<i>' + id + '</i><b>' + n + '</b>', iconClass: () => '', iconStyle: () => '', renderHotbar() {}, navRefresh() {}, sfx() {}, toast() {}, setInterval, clearInterval,
    renderBag: () => { G.oldBag = (G.oldBag || 0) + 1; }, openMenu() {}, enterWorld() {}};
  G.cnt = id => G.inv[id] || 0; G.addItem = (id, n) => { G.inv[id] = G.cnt(id) + n; if (G.MODE.hotbar && !G.MODE.hotbar.includes(id)) { const f = G.MODE.hotbar.findIndex(h => !h || G.cnt(h) <= 0); if (f >= 0) G.MODE.hotbar[f] = id; } };
  G.window = G; new Function('with(this){' + bagDef + ';this.bagItems=bagItems;this.ensureHotbar=ensureHotbar;' + src + '}').call(G); assert.equal(G.__inv1222.err, null, G.__inv1222.err); return G; }
const ids = G => [...G.prog.inv22.filter(Boolean), ...G.MODE.hotbar.filter(id => id && G.cnt(id) > 0)];
const total = G => Object.values(G.inv).reduce((a, b) => a + b, 0);
// 1) legacy save: 60 item types (more than the 36 squares), an old hotbar, no slot list yet
const inv0 = {}; for (let i = 1; i <= 60; i++) inv0[i] = i; const G = boot(inv0, [3, 5, 0, 0, 0, 0, 0, 0, 0], {log: true}); const t0 = total(G);
G.renderBag(); assert.equal(G.oldBag, undefined); const S = G.prog.inv22; assert(S.length >= 60 && S.length % 9 === 0); assert.equal(new Set(ids(G)).size, 60, 'every item once, nothing lost in overflow'); assert.equal(ids(G).length, 60);
const grid = G.document.querySelectorAll('[data-testid^=inv-slot-]'), hot = G.document.querySelectorAll('[data-testid^=inv-hot-]'); assert.equal(grid.length, S.length); assert.equal(hot.length, 9);
assert(G.document.querySelectorAll('#inv22 .gslot.empty').length > 0, 'real empty squares');
// 2) swaps by clicks (mouse, touch and controller A all fire click)
const clickIn = (X, t) => X.document.querySelector('[data-testid=' + t + ']').dispatchEvent(new X.document.defaultView.Event('click')); const click = t => G.document.querySelector('[data-testid=' + t + ']').dispatchEvent(new G.document.defaultView.Event('click'));
const g0 = S[0]; click('inv-slot-0'); click('inv-hot-0'); assert.equal(G.MODE.hotbar[0], g0); assert.equal(G.prog.inv22.includes(3), true, 'occupied <-> occupied');
click('inv-hot-2'); click('inv-slot-1'); const moved = G.MODE.hotbar[2]; assert(moved && !G.prog.inv22.includes(moved), 'grid item into an empty hotbar slot');
const e = G.prog.inv22.indexOf(0); click('inv-slot-5'); const v5 = G.prog.inv22[5]; click('inv-slot-' + e); assert.equal(G.prog.inv22[e], v5); assert.equal(G.prog.inv22[5], 0, 'grid item into an empty square stays there');
click('inv-hot-0'); click('inv-slot-' + G.prog.inv22.indexOf(0)); assert.equal(G.MODE.hotbar[0], 0, 'hotbar item to an empty square');
click('inv-slot-7'); click('inv-slot-7'); assert.equal(G.__inv1222.picked(), null, 'tap twice cancels');
assert.equal(total(G), t0, 'counts never change by moving'); assert.equal(new Set(ids(G)).size, 60); assert.equal(ids(G).length, 60, 'no duplicates');
// 3) save round trip keeps positions; old build style save (no inv22) still loads
const saved = JSON.parse(JSON.stringify({inv: G.inv, hotbar: G.MODE.hotbar, prog: G.prog})); const G2 = boot(saved.inv, saved.hotbar, saved.prog); G2.renderBag();
assert.deepEqual(G2.prog.inv22, G.prog.inv22); assert.deepEqual(G2.MODE.hotbar, G.MODE.hotbar);
// using up an item frees its square, a new item fills the first free square
const s0 = G2.prog.inv22.find(Boolean), at = G2.prog.inv22.indexOf(s0); G2.inv[s0] = 0; G2.__inv1222.layout(); assert.equal(G2.prog.inv22[at], 0);
G2.MODE.hotbar = G2.MODE.hotbar.map(() => 77); G2.inv[77] = 0; G2.addItem(70, 0); G2.inv[80] = 1; G2.__inv1222.layout(); assert(G2.prog.inv22.includes(80));
// 4) new world loadout once, Bag of Everything flag; a loaded world gets nothing
const G3 = boot({}, [0, 0, 0, 0, 0, 0, 0, 0, 0], {}); G3.enterWorld(null); assert.equal(G3.inv[761], 1); assert.equal(G3.inv[291], 1); assert.equal(G3.ls.get('glen_bagG_w1'), 'inv1222');
G3.enterWorld(null); assert.equal(G3.inv[761], 1, 'flag stops a second grant'); const G4 = boot({5: 1}, null, {}); G4.enterWorld({saved: 1}); assert.equal(G4.inv[761], undefined, 'loading a save gives nothing');
const G5 = boot({5: 1}, null, {}); G5.MODE.name = 'creative'; G5.renderBag(); assert.equal(G5.oldBag, 1, 'creative keeps its own bag screen');
// 5) creative bag in survival
G3.renderBag(); clickIn(G3, 'inv-creative-bag'); assert(G3.document.querySelector('[data-testid=inv-creative-grid]')); G3.__inv1222.take(10); assert.equal(G3.inv[10], 64); G3.__inv1222.take(761); assert.equal(G3.inv[761], 2, 'tools come one at a time');
// 6) tabs: icon only with names kept, LB / RB walk all three; responsive CSS
assert.deepEqual(G.TABS, ['bag', 'craft', 'char']); for (const id of ['tabInv', 'tabCraft', 'tabChar']) assert(G.$(id).getAttribute('aria-label') && G.$(id).title);
const css = [...G.document.querySelectorAll('style')].map(x => x.textContent).join('\n'); assert(/repeat\(auto-fill,var\(--s\)\)/.test(css) && /max-width:420px/.test(css) && /pointer:coarse/.test(css) && /overflow-y:auto/.test(css) && /font-size:0/.test(css));
console.log('v1222-inventory ok', JSON.stringify({squares: S.length, swaps: G.__inv1222.swaps}));
