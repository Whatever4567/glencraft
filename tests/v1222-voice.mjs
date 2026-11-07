// v1.2.22 alien voice: every spoken line routes to a recording from the same pipeline; year 24000 lines mapped; fallback fixed
import fs from 'node:fs'; import assert from 'node:assert';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
const i = html.indexOf('const LINES = ["Do not be afraid'); const LINES = eval(html.slice(i + 14, html.indexOf('];', i) + 1));
const qi = html.indexOf("U.q.push('This is your world"); const Q = eval('[' + html.slice(qi + 9, html.indexOf(');', qi)) + ']');
const G = {window: null, SET: {sfx: 0.8}}; G.window = G; new Function('with(this){' + cut('/* GLX-VOX1222', '/* GLX-C400') + '}').call(G); const U = G.__vox1222;
const all = [...LINES, ...Q, 'Brace for impact.']; assert.equal(Q.length, 4);
for (const l of all) { const p = U.clip(l, LINES); assert(p, 'recorded: ' + l); assert(fs.existsSync(new URL('../' + p, import.meta.url)), p); }
assert.equal(U.clip(Q[0], LINES), 'assets/voice/agartha_y1.mp3', 'year 24000 line');
assert.equal(U.clip(LINES[0], LINES), 'assets/voice/agartha1.mp3', 'opening unchanged');
// same pipeline: same rate, channels and bit rate as the opening clips (checked from the MP3 frame header)
const hdr = p => { const b = fs.readFileSync(new URL('../' + p, import.meta.url)); let k = 0; if (b.slice(0, 3).toString() === 'ID3') k = 10 + ((b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9]); while (!(b[k] === 0xff && (b[k + 1] & 0xe0) === 0xe0)) k++; return [b[k + 1], b[k + 2] & 0xfc, b[k + 3] >> 6]; };
const ref = JSON.stringify(hdr('assets/voice/agartha1.mp3')); for (const l of all) assert.equal(JSON.stringify(hdr(U.clip(l, LINES))), ref, 'same format: ' + l);
// no line left to the browser voice; the old paths are rerouted
assert(!html.includes("new Audio('assets/voice/agartha' + (vi + 1)")); assert(!html.includes("u.pitch = 1.45")); assert(html.includes('__vox1222.fallback(u)'));
// fallback: one fixed voice and settings for every line
const vA = {lang: 'en-GB', name: 'Daniel'}, vB = {lang: 'en-US', name: 'Google US English Natural'}; G.speechSynthesis = {getVoices: () => [vA, vB]};
const u1 = U.fallback({}), u2 = U.fallback({}); assert.equal(u1.voice, vB); assert.equal(u2.voice, vB); assert.deepEqual([u1.pitch, u1.rate], [1, 0.94]);
G.speechSynthesis.getVoices = () => [vA]; assert.equal(U.fallback({}).voice, vB, 'same choice mid sequence');
// brace: plays its recording; load failure falls back once to the fixed voice
let spoke = []; G.speechSynthesis = {getVoices: () => [vB], cancel() {}, speak: u => spoke.push(u)}; G.SpeechSynthesisUtterance = function (t) { this.text = t; };
G.Audio = function (src) { this.src = src; this.play = () => Promise.reject(new Error('x')); }; const a = U.brace(); assert.equal(a.src, 'assets/voice/agartha_brace.mp3');
await new Promise(r => setTimeout(r, 0)); assert.equal(spoke.length, 1); assert.equal(spoke[0].voice, vB); assert.equal(spoke[0].pitch, 1);
assert.equal(U.err, null); console.log('v1222-voice ok', all.length, 'lines');
