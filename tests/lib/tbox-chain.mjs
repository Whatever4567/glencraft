// Frame chain harness for the time box: runs the game's own TBOX, TBOX2, TBOX3, V130, CAB1221, V1220T and CAB1222 blocks (sliced from
// index.html, real wrappers on updatePlayer / collides / solid / renderer.render in game order) over a stand in world: flat ground at
// y < GY, and a stand in base updatePlayer (gravity, move, collides) - the only reimplemented part. Anything else the blocks call is a
// recorded no op, listed in H.missing. Proves the per frame chain order and positions, not drawing.
import fs from 'node:fs'; import assert from 'node:assert';
import * as THREE0 from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const blk = k => { const i = html.indexOf('/* GLX-' + k + ' '), j = html.indexOf('/* GLX-', i + 8); assert(i > 0 && j > i, k); return html.slice(i, j); };
export function make(opt = {}) {
  const THREE = Object.assign({}, THREE0), GY = opt.GY ?? 10, missing = new Set();
  const noop = new Proxy(function () {}, {get: (t, k) => k === Symbol.toPrimitive ? () => 0 : noop, apply: () => noop, construct: () => noop});
  const el = () => ({style: {}, dataset: {}, classList: {add() {}, remove() {}, toggle() {}, contains: () => false}, appendChild() {}, addEventListener() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [], remove() {}, after() {}, before() {}, children: [], textContent: '', innerHTML: ''});
  const document = {createElement: () => Object.assign(el(), {getContext: () => new Proxy({}, {get: () => () => ({addColorStop() {}})})}), getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], body: el(), head: el(), addEventListener() {}, visibilityState: 'visible'};
  const ls = new Map(), timers = [];
  const G = {THREE, Math, JSON, Object, Array, Map, Set, Number, String, Boolean, Error, isFinite, isNaN, parseInt, parseFloat, Float32Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Promise, Symbol, Proxy, Reflect, console, performance, document,
    navigator: {userAgent: 'node', getGamepads: () => []}, innerWidth: 1600, innerHeight: 1000, devicePixelRatio: 1,
    localStorage: {getItem: k => ls.has(k) ? ls.get(k) : null, setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k)},
    setTimeout: (f, t) => { timers.push({f, t: (t || 0) / 1000, iv: 0}); return timers.length; }, setInterval: (f, t) => { timers.push({f, t: (t || 0) / 1000, iv: (t || 16) / 1000}); return timers.length; }, clearInterval: id => { if (timers[id - 1]) timers[id - 1].dead = 1; }, clearTimeout: id => { if (timers[id - 1]) timers[id - 1].dead = 1; },
    requestAnimationFrame: () => 0, listeners: [], addEventListener(t, f) { G.listeners.push([t, f]); }, removeEventListener() {},
    scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(70, 1.6, 0.05, 1000), renderer: {render() {}, getRenderTarget: () => null, setRenderTarget() {}, clear() {}, autoClear: true, capabilities: {}, domElement: el(), getPixelRatio: () => 1},
    P: {x: 40.5, y: GY, z: 40.5, vy: 0, yaw: 0, pitch: 0, onGround: true, fallTop: null}, R: 0.3, HEIGHT: 1.8, EYE: 1.62, SEA: 8, W: 2000, D: 2000, H: 256,
    started: true, dead: false, paused: false, menuOpen: false, DIM: {cur: null}, SET: {sfx: 0.8, hd: 1}, MODE: {}, current: {id: 'w1'}, camMode: 0, swimming: false, flying: false, groundT: 0, PH: false,
    T: {AIR: 0, STONE: 3}, BLOCK_MATS: {}, NAMES: {}, PLACEABLE: new Set(), selId: 0, prog: {}, inv: {}, cnt: () => 0, toast: m => { G.toasts.push(String(m)); }, toasts: [], sfx() {}, playSound() {}};
  G.window = G; G.self = G;
  G.solid = (x, y, z) => y < GY || (opt.rock && opt.rock(x, y, z));
  G.getB = (x, y, z) => G.solid(x, y, z) ? 3 : 0; G.groundTop = () => GY - 1; G.solidTop = () => GY - 1;
  G.collides = (x, y, z) => { for (const [ox, oz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) for (const oy of [0, 0.9, 1.75]) if (G.solid(Math.floor(x + ox), Math.floor(y + oy), Math.floor(z + oz))) return true; return false; };
  // stand in base step: gravity, then the vertical move with the (wrapped) collides
  G.updatePlayer = function (dt) { const P = G.P; P.vy -= 28 * dt; const ny = P.y + P.vy * dt; if (G.collides(P.x, ny, P.z)) { if (P.vy < 0) P.onGround = true; P.vy = 0; } else { P.y = ny; P.onGround = false; } };
  G.placeCamera = () => { G.camera.position.set(G.P.x, G.P.y + 1.62, G.P.z); G.camPlaced = (G.camPlaced || 0) + 1; };
  const scope = new Proxy(G, {has: (t, k) => typeof k === 'string' && !(k in globalThis && !(k in t)) ? true : k in t,
    get: (t, k) => { if (k in t) return t[k]; if (typeof k === 'symbol') return undefined; missing.add(k); return noop; }, set: (t, k, v) => { t[k] = v; return true; }});
  if (opt.real) {
    // REAL shipped base, sliced verbatim: placeCamera, collides/moveAxis/moveY/updatePlayer/updateCamFx, keydown/keyup handlers, readPad,
    // step, render. Only rewrite: top level 'function X(' -> 'X = function X(' and top level let/const -> assignment, so wrappers that
    // reassign the global name are seen by step and render as in the page.
    const L = html.split('\n'), at = (re, from = 0) => { for (let i = from; i < L.length; i++) if (re.test(L[i])) return i; throw new Error('no ' + re); };
    const cut = (a, b) => L.slice(a, b).join('\n'), endFn = a => at(/^}/, a + 1) + 1;
    const pc = at(/^function placeCamera\(/), co = at(/^function collides\(/), cf = at(/^function updateCamFx\(/), ky = at(/^const keys = \{\};/), kyE = at(/^window\.addEventListener\('keyup'/, ky), rp = at(/^function readPad\(/), st = at(/^function step\(dt, g\)/), rd = at(/^function render\(\)/), pk = at(/^function pickPad\(/);
    const kyEnd = at(/^\}\);/, kyE) + 1;
    let src = [cut(pc, endFn(pc)), cut(co, endFn(cf)), cut(ky, kyEnd), 'const gpPrev = {};', cut(rp, endFn(rp)), cut(st, endFn(st)), cut(rd, endFn(rd)), cut(pk, endFn(pk))].join('\n');
    src = src.replace(/^function (\w+)\(/gm, '$1 = function $1(').replace(/^(let|const) /gm, '');
    Object.assign(G, {heldBy: null, sprinting: false, sprintShift: false, sprintDbl: false, sprintTouch: false, sprintPad: false, food: 20, exh: 0, GATE: {x: 1e9, z: 1e9, g: 0}, jumpReq: false, tjx: 0, tjy: 0, padConnected: false, padPick: {id: ''}, padFwd: false, padFwdT: 0, attackPad: false, lastW: 0,
      sleeping: false, stumbleT: 0, shakeT: 0, shakeAmp: 0, brewWobble: 0, armour: opt.armour || [0, 0, 0, 0, 0], hand: {visible: true}, clamp: (v, a, b) => Math.max(a, Math.min(b, v)), $: () => el(), warnT: 0, clouds: [], waterUniforms: {uTime: {value: 0}}, lavaTex: {offset: {x: 0, y: 0}}, spawnPt: null, hp: 20, riding: null, setPause: v => { G.paused = !!v; }});
    G.SET.pad = 1; G.SET.bob = true; G.P.kbx = G.P.kbz = 0; G.T.WATER = 9; G.T.LAVA = 10; G.T.COBWEB = 11; G.T.BED = 12;
    G.pad = null; G.navigator.getGamepads = () => [G.pad];
    new Function('S', 'with(S){' + src + '\n}').call(G, scope);
    G.realBase = true; G.placeCamera0 = G.placeCamera;
  }
  const order = ['TBOX', 'TBOX2', 'TBOX3', 'V130', 'CAB1221', 'V1220T', 'CAB1222'], errs = [];
  if (opt.real) { order.splice(order.indexOf('TBOX'), 0, 'C102J'); order.push('EQJET'); }
  const extra = {C102J: () => { const i = html.indexOf('const S = window.__c102j = '), j = html.indexOf('let lt = performance.now(); (function loop()', i); return 'JET = 291; flames = []; puff = function () {}; ' + html.slice(i, j); },
    EQJET: () => { const i = html.indexOf('/* GLX-EQ1222 '), a = html.indexOf('  // white jetpack twice as fast', i), b = html.indexOf('  // new worlds: no Golden Jetpack', a); return 'JET = 291; ' + html.slice(a, b); }};
  for (const k of order) { let src; try { src = extra[k] ? extra[k]() : blk(k); } catch (e) { errs.push(k + ' missing'); continue; } try { new Function('S', 'with(S){' + src + '\n}').call(G, scope); } catch (e) { errs.push(k + ': ' + String(e).slice(0, 160)); } }
  const H = {G, missing, errs, timers, T: () => G.__tbox, F: () => G.__tbox3, C: () => G.__cab1222,
    frame(dt = 1 / 60) { if (G.realBase) { let mv = 0; try { mv = G.step(dt, G.readPad()); } catch (e) { errs.push('step ' + String(e).slice(0, 160)); } try { G.updateCamFx(G.paused ? 0 : dt, mv); } catch (e) { errs.push('camfx ' + e); }
        for (const t of timers) if (!t.dead) { t.t -= dt; if (t.t <= 0) { try { t.f(); } catch (e) { errs.push('timer ' + String(e).slice(0, 120)); } if (t.iv) t.t += t.iv; else t.dead = 1; } }
        try { G.render(); } catch (e) { errs.push('render ' + String(e).slice(0, 160)); } return; }
      G.updatePlayer(dt); for (const t of timers) if (!t.dead) { t.t -= dt; if (t.t <= 0) { try { t.f(); } catch (e) { errs.push('timer ' + String(e).slice(0, 120)); } if (t.iv) t.t += t.iv; else t.dead = 1; } } try { G.renderer.render(G.scene, G.camera); } catch (e) { errs.push('render ' + String(e).slice(0, 120)); } },
    padSet(axes = [0, 0, 0, 0], down = []) { G.pad = {id: 'Xbox pad', mapping: 'standard', connected: true, axes: axes.slice(), buttons: Array.from({length: 17}, (_, i) => ({pressed: down.includes(i), value: down.includes(i) ? 1 : 0}))}; },
    key(code, on) { for (const [t, f] of G.listeners) if (t === (on ? 'keydown' : 'keyup')) f({code, key: code, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {}}); } };
  return H;
}
