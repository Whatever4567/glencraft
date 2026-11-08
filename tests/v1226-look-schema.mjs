// v1.2.26 local: character look save schema (GLX-LOOK1226), sliced from the built index.html and run against a stand in localStorage.
// Foundation only: proves defaults, old / broken / newer save fallback, clamping, persistence, and that nothing is offered before a model binds.
import fs from 'node:fs'; import assert from 'node:assert';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const i = html.indexOf('/* GLX-LOOK1226 '), j = html.indexOf('/* GLX-', i + 8); assert(i > 0 && j > i, 'block present');
const src = html.slice(i, j); let n = 0; const ok = (c, m) => { assert(c, m); console.log('ok   ' + m); n++; };
function boot(store = {}) { const ls = new Map(Object.entries(store)); const W = {localStorage: {getItem: k => ls.has(k) ? ls.get(k) : null, setItem: (k, v) => ls.set(k, String(v))}}; W.window = W;
  new Function('window', 'localStorage', src).call(W, W, W.localStorage); return {L: W.__look, ls}; }
{ const {L, ls} = boot(); const d = L.get(); ok(d.v === 1 && d.hair === 'none' && d.face === 'none' && d.hat === 'none' && d.body === 0.5, 'no save: defaults, every slot none');
  ok(!ls.has('glen_look'), 'loading writes nothing (an old save stays untouched until you change something)');
  ok(L.offered().length === 0 && L.waiting().length === Object.keys(L.OPT).length, 'before a model binds nothing is offered as a working choice (' + L.waiting().length + ' options waiting)'); }
for (const [name, raw] of [['broken JSON', '{oops'], ['array', '[1,2]'], ['null', 'null'], ['number', '7']]) { const {L} = boot({glen_look: raw}); ok(JSON.stringify(L.get()) === JSON.stringify(L.defaults()), name + ' save: falls back to defaults'); }
{ const {L} = boot({glen_look: JSON.stringify({v: 1, body: 9, muscle: -3, skin: 'red', eyes: '#00AA11', hair: 'mohawk', face: 'goatee', hat: 'cap_01', glasses: '../x'})}); const d = L.get();
  ok(d.body === 1 && d.muscle === 0, 'sliders clamped to 0..1'); ok(d.skin === '#e0ac86' && d.eyes === '#00aa11', 'bad colour falls back, good colour kept (lower case)');
  ok(d.hair === 'none' && d.face === 'goatee', 'unknown hair style falls back, goatee kept'); ok(d.hat === 'cap_01' && d.glasses === 'none', 'clothing slot keeps a plain item id, rejects anything else'); }
{ const {L} = boot({glen_look: JSON.stringify({v: 2, body: 0.2, tattoo: 'x'})}); const d = L.get(); ok(d.body === 0.2 && d.extra && d.extra.tattoo === 'x', 'newer save: known fields read, unknown ones kept'); }
{ const a = boot(); a.L.set('face', 'beard'); a.L.set('body', 0.8); ok(!a.L.set('nope', 1), 'unknown option refused');
  const b = boot(Object.fromEntries(a.ls)); ok(b.L.get().face === 'beard' && b.L.get().body === 0.8, 'saved look survives a reload'); b.L.reset(); ok(boot(Object.fromEntries(b.ls)).L.get().face === 'none', 'reset back to defaults'); }
{ const {L} = boot(); L.bind({hairCol: true, hat: ['cap_01'], face: true, bogus: true}); const o = L.offered();
  ok(o.map(x => x.k).join() === 'hairCol,face,hat' && o.find(x => x.k === 'hat').vals.join() === 'none,cap_01' && o.find(x => x.k === 'face').vals.join() === 'none,beard,goatee', 'after bind only what the model lists is offered, each list starts with none'); }
ok(!/glen_w_|glen_uni_|serialize/.test(src), 'the look block never touches world saves');
console.log('all ok (' + n + ')');
