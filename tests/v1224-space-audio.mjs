// v1.2.24: space is silent. Runs the real GLX-VAC1224, GLX-UKS (outdoor birds, planes, wind bus) and GLX-WX1222 (rain bed, thunder)
// blocks with a fake Web Audio context that records every gain target. Stand ins: the fake audio graph, __c320.space (flat Earth rule:
// height above sea > H + 40 - SEA, as GLX-C320 space()), and a no op scene. No sound is played or listened to.
import fs from 'node:fs'; import assert from 'node:assert';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const blk = k => { const i = html.indexOf('/* GLX-' + k + ' '), j = html.indexOf('/* GLX-', i + 8); assert(i > 0, k); return html.slice(i, j); };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const noop = new Proxy(function () {}, {get: (t, k) => k === Symbol.toPrimitive ? () => 0 : noop, apply: () => noop, construct: () => noop});
const param = v => ({value: v, last: v, setTargetAtTime(x) { this.last = x; this.value = x; return this; }, setValueAtTime(x) { this.last = x; return this; }, linearRampToValueAtTime(x) { this.last = x; return this; }, exponentialRampToValueAtTime(x) { this.last = x; return this; }, cancelScheduledValues() { return this; }});
const node = () => ({gain: param(1), frequency: param(0), Q: param(0), delayTime: param(0), detune: param(0), playbackRate: param(1), pan: param(0), threshold: param(0), knee: param(0), ratio: param(0), attack: param(0), release: param(0), connect(n) { return n; }, disconnect() {}, start() {}, stop() {}, buffer: null, loop: false, type: ''});
const gains = []; const AC = {currentTime: 1, sampleRate: 8000, state: 'running', destination: node(), createGain() { const n = node(); gains.push(n); return n; }, createBiquadFilter: node, createDelay: node, createConvolver: node, createOscillator: node, createBufferSource: node, createStereoPanner: node, createDynamicsCompressor: node,
  createBuffer: (c, n) => ({getChannelData: () => new Float32Array(n), length: n, numberOfChannels: c}), decodeAudioData: () => Promise.resolve({})};
const SEA = 8, H = 256, G = {Math, JSON, Object, Array, Map, Set, Number, String, Error, Float32Array, Uint8Array, Promise, console, performance, atob: s => Buffer.from(s, 'base64').toString('binary'),
  AC, master: node(), started: true, paused: false, dead: false, DIM: {cur: null}, P: {x: 400, y: 20, z: 400}, SEA, H, SET: {music: 1, sfx: 1}, isNight: false, raining: true, document: {visibilityState: 'visible', getElementById: () => null, createElement: () => ({style: {}})},
  setInterval: () => 0, setTimeout: () => 0, requestAnimationFrame: () => 0, playSound: () => 'synth', sounds: []};
G.window = G; G.__c320 = {space: (x, y, z) => y - SEA > H + 40 - SEA};
const scope = new Proxy(G, {has: (t, k) => typeof k === 'string' && !(k in globalThis && !(k in t)), get: (t, k) => k in t ? t[k] : typeof k === 'symbol' ? undefined : noop, set: (t, k, v) => { t[k] = v; return true; }});
for (const k of ['UKS', 'VAC1224', 'WX1222']) new Function('S', 'with(S){' + blk(k) + '\n}').call(G, scope);
const K = G.__uks, X = G.__wx1222, V = G.__vac1224;
const run = () => { K.enc = 0; K.cave = 0; G.AC.currentTime += 50; K.tick(); X.tick(); };
G.P.y = 20; run(); const b0 = K.birds; run(); run();
ok(K.out === 1 && K.birds > b0 - 1, 'on Earth outdoors: outdoor bus on, birds keep coming (birds ' + K.birds + ')'); ok(X.want > 0, 'on Earth: rain bed on (' + X.want + ')');
G.P.y = 600; const b1 = K.birds; run(); run(); run();
ok(K.out === 0 && K.birds === b1, 'deep space: outdoor bus 0 (birds, planes, owls, wind), no new birds (out ' + K.out + ', birds ' + (K.birds - b1) + ')'); ok(X.want === 0, 'deep space: rain bed 0');
ok(X.thunder(1) === true && X.vacSkip >= 1 && X.plays === 0, 'deep space: thunder swallowed, nothing played'); ok(G.playSound('thunder', 1) === undefined, 'deep space: playSound(thunder) does not fall through to the synth');
ok(G.playSound('click', 1) === 'synth', 'deep space: other sounds (UI, machines) still pass through');
G.P.y = 20; const b2 = K.birds; run(); run(); run(); ok(K.out === 1 && X.want > 0, 'back on Earth: outdoor bus and rain bed back'); 
G.DIM.cur = 'moonbase'; G.P.y = 600; ok(G.__vac() === false, 'inside a realm (not the open sky): not treated as space'); G.DIM.cur = null;
ok(V.flips >= 2 && !V.err, 'vacuum test flipped in and out (' + V.flips + ')');
ok(html.includes("function duck() { try { if (window.__vac && __vac()) return 0;") && html.includes("(window.__vac && __vac()) ? 0 : tgt"), 'nature music (C132) and snow hush are ducked by the same test');
if (fails) { console.log(fails + ' failing'); process.exit(1); } console.log('all ok');
