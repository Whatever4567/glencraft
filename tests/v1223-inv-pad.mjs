// v1.2.23 regression: controller (A / Y) and mouse through the REAL menuPadInput, navRefresh, navItems, activePanel, quickMove (B9b + C101c)
// and the v1.2.22 storage UI (INV1222). DOM is linkedom; this proves event routing and state, not real-device FPS or rendering.
import fs from 'node:fs'; import assert from 'node:assert';
import {parseHTML} from '/workspace/domtools/node_modules/linkedom/esm/index.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const fn = (name) => { const i = html.indexOf('function ' + name + '('); assert(i > 0, name); let d = 0, j = html.indexOf('{', i); for (; j < html.length; j++) { if (html[j] === '{') d++; else if (html[j] === '}' && --d === 0) break; } return html.slice(i, j + 1); };
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
const inv = cut('/* GLX-INV1222', '/* GLX-EQ1222');
const c101 = cut('(function c101y() {', '// ---- armour points');
const bi = html.indexOf('function bagItems()'), bagDef = html.slice(bi, html.indexOf('function visibleItems()', bi));
function boot() {
  const {document, window} = parseHTML('<html><head></head><body><div id="craft"><div class="tabs"><button id="tabInv">Bag</button><button id="tabCraft">Crafting</button><button id="tabChar">Character</button></div><div id="invPane"><div id="invHot"></div><div id="invGrid"></div></div></div><div id="chestUI" class="hidden"></div><div id="furnUI" class="hidden"></div></body></html>');
  Object.defineProperty(window.HTMLElement.prototype, 'offsetParent', {get() { return this.parentNode; }, configurable: true});
  const ORDER = [], NAMES = {}; for (let i = 1; i <= 40; i++) { ORDER.push(i); NAMES[i] = 'Item ' + i; } NAMES[300] = 'Helmet'; ORDER.push(300);
  const G = {document, ORDER, NAMES, CREATIVE_ALL: ORDER.slice(), TOOL: {}, ARMOUR: {300: {}}, inv: {1: 5, 2: 3}, MODE: {name: 'survival', hotbar: [1, 0, 0, 0, 0, 0, 0, 0, 0]}, prog: {load1222: 1},
    selId: 1, started: true, current: {id: 'w1'}, TABS: ['bag', 'craft'], invTab: 'bag', cursor: null, navEl: null, padConnected: true, navDir: '', navRep: 0, charYaw: 0, SET: {pad: 1.8}, CATS: [], craftCat: '', RECIPES: [], craftFocus: 0,
    localStorage: {setItem() {}, getItem: () => null}, performance: {now: () => 0}, equipped: [],
    $: id => document.getElementById(id), slotHTML: (id, n) => '<i>' + id + '</i><b>' + n + '</b>', iconClass: () => '', iconStyle: () => '', renderHotbar() {}, sfx() {}, toast() {}, setInterval, clearInterval,
    renderBag: () => {}, openMenu() {}, enterWorld() {}, navMove() {}, scrollActive() {}, setTab() {}, setCat() {}, craft() {}, returnCursor() { G.cursor = null; }, renderChest() {}, renderFurnace() {}, quickMoveOld: 0,
    equipArmour(id) { G.equipped.push(id); }};
  G.cnt = id => G.inv[id] || 0; G.addItem = (id, n) => { G.inv[id] = G.cnt(id) + n; };
  G.window = G;
  const code = bagDef + ';' + [fn('activePanel'), fn('navItems'), fn('navRefresh'), fn('menuPadInput'), fn('quickMove')].join('\n') +
    ';this.bagItems=bagItems;this.ensureHotbar=ensureHotbar;' + c101 + ' })();\n' + inv + ';this.pad=menuPadInput;this.nr=navRefresh;';
  new Function('with(this){' + code + '}').call(G); assert.equal(G.__inv1222.err, null, G.__inv1222.err); G.renderBag(); return G; }
const E = (b) => { const e = []; e[b] = true; return e; }, AX = {lx: 0, ly: 0, rx: 0, ry: 0};
const press = (G, b) => G.pad(E(b), AX, null);
const T = (G, id) => G.document.querySelector('[data-testid="' + id + '"]');
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
{ // A on a grid slot keeps focus on that slot; second A on another slot swaps
  const G = boot(); G.nr(); G.navEl = T(G, 'inv-slot-0'); G.nr(); press(G, 0);
  ok(G.navEl && G.navEl.isConnected && G.navEl.dataset.testid === 'inv-slot-0', 'pad A on a storage slot keeps the focus on that slot after the redraw (was ' + (G.navEl && G.navEl.dataset.testid) + ')');
  G.navEl = T(G, 'inv-hot-3'); press(G, 0); ok(G.MODE.hotbar[3] === 2, 'pad A then A moves the item to the hotbar slot');
}
{ // creative bag with A: take, focus stays, count visible
  const G = boot(); G.navEl = T(G, 'inv-creative-bag'); press(G, 0); ok(!!T(G, 'inv-creative-grid'), 'pad A opens the creative bag');
  const b = [...T(G, 'inv-creative-grid').children][9]; G.navEl = b; press(G, 0); ok(G.cnt(10) === 64, 'pad A takes the item');
  ok(G.navEl && G.navEl.isConnected && G.navEl.getAttribute('aria-label').startsWith('Take Item 10'), 'focus stays on the taken item (was ' + (G.navEl && G.navEl.getAttribute('aria-label')) + ')');
  press(G, 0); ok(G.cnt(10) === 128 && !G.cnt(1 + 0 * 1 + 0) !== undefined, 'second A takes the same item again'); ok(G.cnt(1) === 5, 'second A did not take a different item');
  ok(/128/.test(G.navEl.textContent), 'the bag cell shows the count you now have');
}
{ // mouse click in the creative bag
  const G = boot(); T(G, 'inv-creative-bag').click(); const b = [...T(G, 'inv-creative-grid').children][4]; b.click(); ok(G.cnt(5) === 64, 'mouse click takes the item');
}
{ // Y quick move from the new storage grid to the hotbar, armour equips
  const G = boot(); G.navEl = T(G, 'inv-slot-0'); const id = G.prog.inv22[0]; press(G, 3); ok(G.MODE.hotbar.includes(id), 'pad Y moves a storage item to the hotbar');
  G.inv[300] = 1; G.renderBag(); const j = G.prog.inv22.indexOf(300); G.navEl = T(G, 'inv-slot-' + j); press(G, 3); ok(G.equipped.includes(300), 'pad Y on armour equips it');
}
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok');
