// v1.2.24: old c307 save data survives losslessly after GLX-C307 was removed. Runs the real GLX-KEEP1224 block plus the real realm save
// wrapper (d.dim on serialize, line 'if (DIM.cur) { d.noMigrate = 1; d.dim = DIM.cur; }') and the real enterWorld wrapper that drops a
// non hell realm on load, over a stand in base serialize / enterWorld and a JSON round trip (as localStorage / IndexedDB would store it).
import fs from 'node:fs'; import assert from 'node:assert';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const blk = k => { const i = html.indexOf('/* GLX-' + k + ' '), j = html.indexOf('/* GLX-', i + 8); assert(i > 0, k); return html.slice(i, j); };
const line = s => { const i = html.indexOf(s); assert(i > 0, s); return html.slice(html.lastIndexOf('\n', i) + 1, html.indexOf('\n', i)); };
const G = {Math, Object, JSON, Array, String, Error, console, DIM: {cur: null}, world: null, cur: null};
G.window = G;
G.serialize = function () { return {v: 1, world: G.world, P: {x: 1, y: 2, z: 3}}; };
G.enterWorld = function (save) { G.world = save ? save.world : 'fresh'; G.loaded = save || null; };
const scope = new Proxy(G, {has: (t, k) => typeof k === 'string' && !(k in globalThis && !(k in t)), get: (t, k) => t[k], set: (t, k, v) => { t[k] = v; return true; }});
const run = src => new Function('S', 'with(S){' + src + '\n}').call(G, scope);
run(line("const s = serialize; serialize = function () { const d = s.apply(this, arguments); if (DIM.cur) { d.noMigrate = 1; d.dim = DIM.cur; }"));
run(line("const ew = enterWorld; enterWorld = function (save) { if (save && save.dim && save.dim !== 'hell') { delete save.dim; delete save.dimCur; }").replace(/^\s*/, ''));
run(blk('KEEP1224'));
const store = d => JSON.parse(JSON.stringify(d));
const old = {v: 1, world: 'W1', P: {x: 5, y: 60, z: -40}, c307: {v: 1, ch: {'1234': 'rle:abc', '1300': 'rle:MY-HOUSE-blocks'}}};
G.enterWorld(store(old)); let s1 = store(G.serialize());
ok(JSON.stringify(s1.c307) === JSON.stringify(old.c307), 'old save with c307 (incl. a custom edit chunk): saved back byte for byte');
G.enterWorld(s1); const s2 = store(G.serialize()); ok(JSON.stringify(s2.c307) === JSON.stringify(old.c307), 'second load / save round trip: still identical');
ok(G.__keep1224.kept === 1 && !G.__c307, 'kept as inert data (no extension module, nothing decoded)');
G.enterWorld(store({v: 1, world: 'W2'})); const s3 = store(G.serialize()); ok(!('c307' in s3), 'normal save without old data: no c307 field added');
G.enterWorld(store(old)); G.enterWorld(null); ok(!('c307' in store(G.serialize())), 'new world after an old one: the old blob does not leak into it');
G.enterWorld(store(old)); G.DIM.cur = 'hell'; const s4 = store(G.serialize()); ok(s4.dim === 'hell' && !('c307' in s4), 'realm save (hell): no overworld c307 written into it'); G.DIM.cur = null;
ok(JSON.stringify(store(G.serialize()).c307) === JSON.stringify(old.c307), 'back home: c307 still written');
const inRealm = store(Object.assign({}, old, {dim: 'agartha', dimCur: 'agartha'})); G.enterWorld(inRealm);
ok(!G.loaded.dim && JSON.stringify(store(G.serialize()).c307) === JSON.stringify(old.c307), 'save made inside the removed old Agartha world: loads at home (realm dropped by the existing wrapper), c307 kept');
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok');
