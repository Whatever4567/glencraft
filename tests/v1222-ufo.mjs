// v1.2.22 white spawn saucer gone: its loop hides it and its Fly UFO button unless already piloting; alien saucer code untouched
import fs from 'node:fs'; import assert from 'node:assert';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8'), old = fs.readFileSync('/tmp/i21.html', 'utf8');
const cut = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i + 10); assert(i > 0 && j > i, a); return s.slice(i, j); };
const k = "if (!started || DIM.cur || (!U.on && window.__nu1222 !== false)) { G.visible = false; for (const k in B) B[k].style.display = 'none'; return; }"; assert.equal(html.split(k).length, 2);
const gate = new Function('started', 'DIM', 'U', 'window', 'return !started || DIM.cur || (!U.on && window.__nu1222 !== false);');
assert.equal(gate(true, {cur: null}, {on: false}, {}), true, 'hidden in a normal world'); assert.equal(gate(true, {cur: null}, {on: true}, {}), false, 'a flight already under way can still land');
for (const m of ['/* ===================== GLX-C246', '/* GLX-C252', '/* GLX-C267']) assert.equal(cut(html, m, '\n/*').replace(' (window.__ufo1222 && __ufo1222.blocked()) ||', '').replace(" try { if (window.__ufo1222) __ufo1222.depart(); } catch (_) {}", ''), cut(old, m, '\n/*'), 'alien saucer unchanged apart from the leave-for-good hooks ' + m);
console.log('v1222-ufo ok');
