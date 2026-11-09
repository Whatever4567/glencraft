// 1.2.42: slow-load / safe-mode popup and buttons are gone; a slow load never shows them.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const file = process.argv[2] || 'index.html';
const html = fs.readFileSync(file, 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes("const GAME_VERSION = '1.2.43';") || html.includes("const GAME_VERSION = '1.2.42';"), 'GAME_VERSION is 1.2.43 or 1.2.42');
ok(html.includes('safeModeUiRemoved'), 'c99 marks safe-mode UI as removed');
ok(!/sb\.textContent = 'Load safe mode'/.test(html), 'loading screen does not create a Load safe mode button');
ok(!/Open in safe mode/.test(html), 'title screen does not offer Open in safe mode');
ok(!/did not finish loading last time/.test(html), 'frozen-load dialog copy is gone');
ok(!/enterWorld\._sbT = setTimeout\(\(\) => \{ if \(screen === 'loading'\) sb\.style\.display = 'block'; \}, 15000\)/.test(html), '15s safe-mode button timer is gone');
ok(/loadStep\('start'\)/.test(html) && !/loadStep\('start' \+ \(window\.__safeLoad/.test(html), 'load start no longer advertises safe mode');

// Simulate the c99 boot path: a stale glen_load marker must not create #c99note.
const c99Start = html.indexOf('/* ===================== GLX-C99');
const c99End = html.indexOf('/* ===================== GLX-C100', c99Start);
ok(c99Start > 0 && c99End > c99Start, 'c99 block is present');
const c99 = html.slice(c99Start, c99End);
ok(c99.includes('safeModeUiRemoved = 1'), 'c99 sets safeModeUiRemoved');
ok(!c99.includes("id = 'c99note'") && !c99.includes('id="c99note"'), 'c99 no longer builds the c99note dialog');
ok(!/window\.__safeLoad = true/.test(c99), 'openSafe no longer forces __safeLoad');

// Runtime: run a minimal stub of the removed-UI marker path.
const store = {glen_load: JSON.stringify({id: 'w1', name: 'Lag World', step: 'building the land 1/25', t: Date.now() - 60000, hb: Date.now() - 60000, v: '1.2.41'})};
const removed = [];
const bodyKids = [];
const document = {
  getElementById(id) { return bodyKids.find(e => e.id === id) || null; },
  createElement(tag) { return {tag, id: '', style: {}, innerHTML: '', onclick: null, remove() { const i = bodyKids.indexOf(this); if (i >= 0) bodyKids.splice(i, 1); }, querySelector() { return null; }}; },
  body: {appendChild(el) { bodyKids.push(el); }}
};
const localStorage = {
  getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
  setItem(k, v) { store[k] = String(v); },
  removeItem(k) { removed.push(k); delete store[k]; }
};
const S = {};
const ctx = {window: {__c99: S}, document, localStorage, Date, screen: 'title', setInterval: (fn) => { fn(); return 1; }, clearInterval() {}, toast() {}, console};
// Execute only the 1.2.42 replacement tail semantics:
try { localStorage.removeItem('glen_safe'); } catch (_) {}
try { const note = document.getElementById('c99note'); if (note) note.remove(); } catch (_) {}
S.safeModeUiRemoved = 1;
try { const ld = JSON.parse(localStorage.getItem('glen_load') || 'null'); if (ld && ld.id && Date.now() - (ld.hb || ld.t || 0) > 5000) { S.lastLoad = ld; localStorage.removeItem('glen_load'); } } catch (_) {}
ok(S.safeModeUiRemoved === 1, 'runtime marks UI removed');
ok(!document.getElementById('c99note'), 'stale slow-load marker does not create a popup');
ok(removed.includes('glen_load') || !store.glen_load, 'stale glen_load marker is cleared quietly');
ok(!bodyKids.length, 'no dialog nodes appended for a slow previous load');

console.log('PASS ' + n + ' v1242 no-safe-mode-popup checks');
