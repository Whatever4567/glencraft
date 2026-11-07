// v1.2.22 weather sound: one rain bus, old loop locked, thunder on its own bus (never touches rain), voice cap, pause/hidden fade, credits
import fs from 'node:fs'; import assert from 'node:assert';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
const src = cut('/* GLX-WX1222', '/* GLX-C400');
assert(fs.existsSync(new URL('../tools/content-source/audio/CREDITS.txt', import.meta.url)) && /CC BY-SA 4\.0/.test(src) && /Jud McCranie/.test(src) && /Amuzujoe/.test(src), 'credits');
assert(src.length > 150000 && src.includes('data:audio/mpeg;base64,'), 'both recordings bundled');
for (const t of ['out.connect((window.__wx1222 && __wx1222.bus()) || master);', "g.connect((window.__wx1222 && __wx1222.bus()) || (typeof master"]) assert(html.includes(t), t);
// fake audio graph
class Param { constructor(v) { this._v = v; this.log = []; } get value() { return this._v; } set value(v) { this._v = v; } setTargetAtTime(v, t, c) { this.log.push(['tgt', v]); this._v = v; return this; } setValueAtTime(v) { this._v = v; return this; } linearRampToValueAtTime(v) { this._v = v; return this; } exponentialRampToValueAtTime(v) { this._v = v; return this; } }
class Node { constructor(n) { this.n = n; this.out = []; } connect(d) { this.out.push(d); return d; } disconnect() { this.out = []; } }
const srcs = [];
const AC = {currentTime: 0, destination: new Node('dest'), sampleRate: 32000,
  createGain() { const g = new Node('gain'); g.gain = new Param(1); return g; }, createBiquadFilter() { const f = new Node('filt'); f.frequency = new Param(350); f.Q = new Param(1); return f; },
  createBufferSource() { const s = new Node('src'); s.playbackRate = new Param(1); s.start = () => {}; srcs.push(s); return s; },
  decodeAudioData(buf, ok) { ok({dur: 1}); }};
const master = new Node('master'), rainGain = AC.createGain(); rainGain.gain.value = 0.3;
let synth = 0; const G = {AC, master, rainGain, paused: false, document: {visibilityState: 'visible'}, atob: s => Buffer.from(s, 'base64').toString('binary'), requestAnimationFrame: () => 0, playSound: (k) => { synth++; }};
G.window = G; new Function('with(this){' + src + '}').call(G); const U = G.__wx1222;
G.playSound = G.playSound; const rb = U.bus(); assert(rb && U.ready(), 'bus and recordings ready');
// old loop locked: writes ignored
rainGain.gain.value = 0.3; rainGain.gain.setTargetAtTime(0.5, 0, 0.3); assert.equal(rainGain.gain.value, 0, 'old loop held silent'); assert(U.locks >= 2);
// the rain graph outputs go through the bus; only the bus writes its gain
const before = rb.gain.log.length; U.tick(); U.tick(); U.tick(); assert.equal(rb.gain.log.length, before, 'no repeated writes while level unchanged');
// thunder: overlapping strikes, rain bus untouched, voice cap
const lvl = rb.gain.value; for (let i = 0; i < 5; i++) G.playSound('thunder', i % 2 ? 0.4 : 1);
assert.equal(U.plays, 3, 'three voices'); assert.equal(U.skip, 2, 'rest skipped'); assert.equal(synth, 0, 'no old synth thunder'); assert.equal(rb.gain.value, lvl, 'rain bus untouched by thunder');
assert(srcs.every(s => s.out[0].out[0] === U.tb), 'thunder only on the thunder bus'); assert(!U.tb.out.includes(rb) && U.tb.out[0] === master);
srcs.forEach(s => s.onended && s.onended()); assert.equal(U.voices, 0); G.playSound('thunder', 0.5); assert.equal(U.plays, 4, 'voices freed');
// non thunder sounds untouched
G.playSound('baa', 1); assert.equal(synth, 1);
// pause and hidden fade the rain, resume brings it back
G.paused = true; U.tick(); assert.equal(rb.gain.value, 0, 'paused: rain fades out'); G.paused = false; U.tick(); assert.equal(rb.gain.value, U.RB_LEVEL);
G.document.visibilityState = 'hidden'; U.tick(); assert.equal(rb.gain.value, 0); G.document.visibilityState = 'visible'; U.tick(); assert.equal(rb.gain.value, U.RB_LEVEL);
// headroom: thunder bus level times full volume stays well under the -4 dB final limiter threshold for -1.5 dBTP clips
assert(20 * Math.log10(U.TB_LEVEL) - 1.5 < -4, 'thunder below the limiter');
assert.equal(U.err, null, U.err); console.log('v1222-weather ok', JSON.stringify({plays: U.plays, skip: U.skip, locks: U.locks, sets: U.sets}));
