// v1.2.22 t941/t942: save and quit returns to the title in place (no reload, no exitFullscreen), stale reset no longer reloads, stable pad highlight
import fs from 'node:fs'; import assert from 'node:assert';
import {parseHTML} from '/workspace/domtools/node_modules/linkedom/esm/index.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
// 1. quit paths: both save-and-quit reloads now go to the title in place (reload only as a fallback if toTitle is missing or fails)
const sq = cut('function saveAndQuit() {', '\n}\n'); assert(/saveWorld\(\)\) setTimeout\(\(\) => \{ if \(!\(window.__ui1222 && __ui1222.toTitle && __ui1222.toTitle\(\)\)\) location.reload/.test(sq));
assert.equal(html.split('setTimeout(() => location.reload(), Math.max(0, 600').length, 1, 'C105 quit reload replaced');
assert(!/exitFullscreen/.test(html), 'game never leaves fullscreen');
// stale-version reset: no reload, no cancel, the reset runs in place
const st = cut("closest('#resetWorldBtn, #resetYes')", '}, true);'); assert(!/update|resetNo|stopImmediatePropagation/.test(st) && /S.deferred/.test(st), 'stale reset deferred');
assert(/resetYes'\)\.addEventListener\('click', e => \{ e.preventDefault\(\); closeAsk\(\); setPause\(false\);[^\n]*__c105.start\(\)/.test(html), 'reset still only rebuilds the current world');
// 2. toTitle with the real module source
const src = cut('/* GLX-UI1222', '/* GLX-VOX1222');
const {document} = parseHTML('<html><head></head><body><div id="pause" class="titleMode"><div class="panel"><div class="btns"><button id="saveQuit">Save</button></div></div></div><div id="craft"></div><div id="dead"></div><div id="charTab"><div id="charView"></div><div id="armour"></div></div></body></html>');
const log = []; let timers = [];
const G = {document, MutationObserver: class { observe() {} }, setInterval() {}, setTimeout: f => timers.push(f), started: true, paused: true, menuOpen: true, DIM: {cur: null}, worldCache: {x: 1},
  mobs: [{id: 1}, {id: 2}], removeMob(m) { G.mobs.splice(G.mobs.indexOf(m), 1); log.push('rm'); }, setPause: on => log.push('pause' + on), showScreen: s => log.push('screen:' + s), playMusic: () => log.push('music'),
  navRefresh() {}, $: id => document.getElementById(id), ERR: (k, e) => { throw e; }, localStorage: {store: {glen_set: 'prefs', glen_w_a: 'A', glen_w_b: 'B'}}};
G.window = G; G.addEventListener = (t, f, c) => document.addEventListener(t, f, c); document.exitFullscreen = () => { throw new Error('exitFullscreen'); };
let reloads = 0; G.location = {reload: () => reloads++};
new Function('with(this){' + src + '}').call(G); const U = G.__ui1222;
const keep = JSON.stringify(G.localStorage.store);
assert.equal(U.toTitle(), true); assert.equal(U.toTitle(), false, 'confirm runs once');
assert.equal(G.started, false); assert.equal(G.paused, false); assert.equal(G.menuOpen, false); assert.equal(G.worldCache, null); assert.equal(G.mobs.length, 0, 'no zombie mobs');
for (const id of ['pause', 'craft', 'dead']) assert(document.getElementById(id).classList.contains('hidden')); assert(!document.getElementById('pause').classList.contains('titleMode'));
assert.deepEqual(log.filter(x => /screen|music/.test(x)), ['screen:title', 'music']); assert.equal(reloads, 0); assert.equal(JSON.stringify(G.localStorage.store), keep, 'prefs and other worlds untouched');
timers.forEach(f => f()); timers = []; G.started = true; G.mobs.push({id: 3}); assert.equal(U.toTitle(), true, 'enter a world again and quit again'); assert.equal(U.titles, 2);
// 3. navRefresh: highlight is only moved when the focus changes
const nr = cut('function navRefresh() {', '\n}\n') + '\n}';
const d2 = parseHTML('<html><body><div id="p"><button id="a" class="gslot"></button><button id="b"></button></div></body></html>').document;
const H = {document: d2, padConnected: true, navEl: null, activePanel: () => d2.getElementById('p'), navItems: p => [...p.querySelectorAll('button')]};
new Function('with(this){' + nr + '; this.navRefresh = navRefresh;}').call(H);
let muts = 0; const a = d2.getElementById('a'), b = d2.getElementById('b'); for (const e of [a, b]) { const cl = e.classList, add = cl.add.bind(cl), rem = cl.remove.bind(cl); cl.add = (...x) => { muts++; add(...x); }; cl.remove = (...x) => { muts++; rem(...x); }; }
H.navRefresh(); assert(a.classList.contains('navf')); const m0 = muts;
for (let i = 0; i < 120; i++) H.navRefresh(); assert.equal(muts, m0, 'no remove/re-add over 120 unchanged frames'); assert(a.classList.contains('navf'));
H.navEl = b; H.navRefresh(); assert(b.classList.contains('navf') && !a.classList.contains('navf'), 'moves on a real change (keyboard, pad or touch all set navEl)');
H.navRefresh(); assert.equal(d2.querySelectorAll('.navf').length, 1);
H.activePanel = () => null; H.navRefresh(); assert.equal(d2.querySelectorAll('.navf').length, 0, 'menu closed clears it'); H.activePanel = () => d2.getElementById('p'); H.navRefresh(); assert(b.classList.contains('navf') || a.classList.contains('navf'), 'menu switch restores');
H.padConnected = false; H.navRefresh(); assert.equal(d2.querySelectorAll('.navf').length, 0, 'touch or mouse: no pad highlight');
console.log('v1222-quit ok');
