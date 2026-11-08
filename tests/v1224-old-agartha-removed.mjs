// v1.2.24: the old tunnel Agartha (separate world entry), its north ice extension (GLX-C307 / C307b) and the extension carver are gone
// from the page; the current Agartha maker (__c294.genAg, used by the Scotland stamp) and the Agartha teleports are still there.
import fs from 'node:fs'; import assert from 'node:assert';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
ok(!html.includes('/* GLX-C307 (') && !html.includes('/* GLX-C307b ('), 'north extension blocks GLX-C307 and C307b are not in the page');
ok(!html.includes('__XG = getE') && !html.includes('function genExt(') && !html.includes('__c294.genExt'), 'no extension writer, no extension carver');
ok(!html.includes("await enterDim('agartha', genAg, spawnAg)"), 'the old walk-in entry to the separate Agartha world is gone');
ok(!html.includes('/* GLX-LEG1224 '), 'the cf84407 disabling timer is gone (replaced by removal)');
ok(html.includes('function genAg() {') && html.includes('U.build = build; U.genAg = genAg;'), 'current Agartha maker __c294.genAg is still there (Scotland stamp needs it)');
ok(html.includes('__c294.genAg(); A = __c294.A;'), 'GLX-AGU still builds the Scotland stamp from it');
ok(html.includes("U.toCity = () => {") && html.includes("go: () => __tpm.toTube()"), 'Agartha teleport route (Teleport list -> __tpm.toTube -> __agw.toCity) is there');
ok(html.includes('fresh7') && html.includes('build(); } catch (e) { ERR(\'ens\''), 'new worlds still get the Agartha mouth record once (keep out for GLX-V1214 / Watcher bowl)');
// every remaining reference to the removed module is guarded
const refs = [...html.matchAll(/__c307\b(?!b)/g)].map(m => html.slice(m.index - 12, m.index));
ok(refs.every(r => /window\.$|&& $|\($|typeof $/.test(r) || /window\.__c307 && \($/.test(r) || r.includes('(window.') || r.includes('&& ') || r.includes('window.')), 'all ' + refs.length + ' remaining __c307 references are guarded reads');
// the C294 block still runs: load it with no extension present
const i = html.indexOf('/* GLX-C294 '), j = html.indexOf('/* GLX-', i + 8); const src = html.slice(i, j);
const noop = new Proxy(function () {}, {get: (t, k) => k === Symbol.toPrimitive ? () => 0 : noop, apply: () => noop, construct: () => noop});
const G = {Math, Object, Array, Map, Set, Number, String, Error, Uint16Array, console, performance, setInterval: () => 0, setTimeout: () => 0, requestAnimationFrame: () => 0, DIM: {cur: null}, W: 864, D: 864, H: 128, SEA: 40, T: {STONE: 3}, generate() {}, enterWorld() {}, setWorldSize() {}, serialize: () => ({}), applySave() {}};
G.window = G; const scope = new Proxy(G, {has: (t, k) => typeof k === 'string' && !(k in globalThis && !(k in t)), get: (t, k) => k in t ? t[k] : typeof k === 'symbol' ? undefined : noop, set: (t, k, v) => { t[k] = v; return true; }});
let err = null; try { new Function('S', 'with(S){' + src + '\n}').call(G, scope); } catch (e) { err = e; }
ok(!err && typeof G.__c294.genAg === 'function' && typeof G.__c294.build === 'function' && G.__c294.genExt === undefined, 'GLX-C294 loads: genAg and build there, genExt gone' + (err ? ' ' + err : ''));
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok');
