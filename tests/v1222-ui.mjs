// v1.2.22 menus: one teleport list (known places, no duplicates, not-ready disabled, handlers once), settings on/off styles + aria, quit confirm in game, offhand right
import fs from 'node:fs'; import assert from 'node:assert';
import {parseHTML} from '/workspace/domtools/node_modules/linkedom/esm/index.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
const src = cut('/* GLX-UI1222', '/* GLX-VOX1222');
const {document, window: W} = parseHTML(`<html><head></head><body><div id="pause"><div class="panel"><div class="btns"><button id="resumeBtn">Resume</button><button id="tpmBtn">Teleport</button>
<button id="tpUniBtn" data-testid="pause-tp-unicorn">Teleport to Unicorn</button><button data-testid="pause-tp-chief">Teleport to Chief</button><button data-testid="pause-tp-piper">Teleport to Piper</button><button id="teleportBuildsBtn">Teleport to my builds</button><button id="saveQuit">Save &amp; quit to title</button></div>
<div id="tpmBox" style="display:none"></div><div class="seg"><button class="on" data-v="1">On</button><button data-v="0">Off</button></div></div></div>
<div id="charTab"><div id="charView"></div><div id="armour"><div class="aslot" data-testid="armour-slot-helmet"></div><div class="aslot" data-testid="armour-slot-offhand"></div><div id="charStats"></div></div></div></body></html>`);
const calls = {}; const hit = k => { calls[k] = (calls[k] || 0) + 1; };
let confirmCalled = 0, fsExit = 0; document.exitFullscreen = () => { fsExit++; };
const ivs = []; let pausedOn = true;
const G = {document, MutationObserver: class { observe() {} }, setInterval: f => ivs.push(f), setTimeout: f => 0, started: true, DIM: {cur: null},
  spawnPlayer: () => hit('spawn'), openTeleportMenu: () => hit('builds'), __agw: {toMouth() {}, toCity() {}}, __tpm: {toIsland: () => hit('cave'), toTube: () => hit('city')},
  setPause: on => { pausedOn = on; hit('pause' + on); }, padPause: () => hit('pad'), navRefresh() {}, confirm: () => { confirmCalled++; return true; }};
G.window = G; G.addEventListener = (t, f, c) => document.addEventListener(t, f, c);  // linkedom has no window phase: stand in for window capture, registered before the game handler as in the browser order
new Function('with(this){' + src + '}').call(G); const U = G.__ui1222; assert.equal(U.err, null, U.err);
// old per-place buttons
document.getElementById('tpUniBtn').addEventListener('click', () => hit('uni')); document.querySelector('[data-testid=pause-tp-chief]').addEventListener('click', () => hit('chief'));
let saved = 0; document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#saveQuit')) saved++; }, true);
ivs.forEach(f => f());
// teleport list
document.getElementById('tpmBtn').click(); const ids = [...document.querySelectorAll('#tpmBox button')].map(b => b.id);
assert.deepEqual(ids, ['tpmSpawn', 'tpmIsland', 'tpmTube', 'tpmUni', 'tpmC_chief', 'tpmC_piper', 'tpmBuilds', 'tpmBack']); assert.equal(new Set(ids).size, ids.length, 'no duplicates');
assert(!/moon|mars|dim/i.test(ids.join()), 'no Moon, Mars or old realm');
for (const [id, k] of [['tpmSpawn', 'spawn'], ['tpmIsland', 'cave'], ['tpmTube', 'city'], ['tpmUni', 'uni'], ['tpmC_chief', 'chief'], ['tpmBuilds', 'builds']]) { document.getElementById(id).click(); document.getElementById(id).click(); assert.equal(calls[k], 1, id + ' runs once'); }
for (const b of ['tpUniBtn', 'teleportBuildsBtn']) assert.equal(document.getElementById(b).style.display, 'none', 'old button folded in');
G.DIM.cur = 'hell'; G.__agw = null; U.render(); const sp = document.getElementById('tpmSpawn'); assert(sp.disabled && /Leave this realm/.test(sp.textContent)); assert(document.getElementById('tpmTube').disabled);
sp.click(); assert.equal(calls.spawn, 1, 'disabled does nothing'); G.DIM.cur = null;
// settings on/off
U.aria(); const [on, off] = document.querySelectorAll('.seg button'); assert.equal(on.getAttribute('aria-pressed'), 'true'); assert.equal(off.getAttribute('aria-pressed'), 'false');
on.classList.remove('on'); off.classList.add('on'); U.aria(); assert.equal(off.getAttribute('aria-pressed'), 'true'); const n0 = U.ariaN; U.aria(); assert.equal(U.ariaN, n0, 'no rewrite when unchanged');
const css = document.getElementById('ui1222css').textContent; assert(/\.seg button\.on\{background:#fff!important;color:#0b0b0b/.test(css) && /\\2713/.test(css) && /min-height:44px/.test(css) && /font-size:13px/.test(css) && /focus-visible/.test(css)); assert(css.includes('.c277ctl{background:linear-gradient') && css.includes('prefers-reduced-motion:reduce){.c277ctl{animation:none'), 'gold shimmer on the controller mark only, static when reduced motion');
// quit confirm
const q = document.getElementById('saveQuit'); q.click(); assert.equal(saved, 0, 'not saved yet'); assert(U.open()); assert.equal(confirmCalled, 0, 'no browser confirm');
document.getElementById('ui22no').click(); assert(!U.open()); assert.equal(saved, 0, 'cancel does nothing');
pausedOn = true; q.click(); G.setPause(false); assert(!U.open() && pausedOn, 'B / resume closes the question, stays paused'); assert.equal(saved, 0);
q.click(); const y = document.getElementById('ui22yes'); y.click(); y.click(); assert.equal(saved, 1, 'save and quit once'); assert.equal(fsExit, 0, 'never leaves fullscreen');
// offhand on the right
const row = document.getElementById('ui22row'); assert.deepEqual([...row.children].map(e => e.id), ['armour', 'charView', 'ui22off']); assert(document.querySelector('#ui22off [data-testid=armour-slot-offhand]'));
ivs.forEach(f => f()); assert.deepEqual([...row.children].map(e => e.id), ['armour', 'charView', 'ui22off'], 'layout stable on repeat');
assert.equal(U.err, null, U.err); console.log('v1222-ui ok', JSON.stringify({tp: U.tp, asks: U.asks, quits: U.quits}));
