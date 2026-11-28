// GLX-WATER1450: static checks for the water detail patch, plus (when a glslang binary is available via
// GLSLANG=/path/to/glslang or on PATH) a real GLSL compile of the full water shader chain through three.js r128.
// No browser: three.js runs in node against a stub WebGL context that only records the final shader sources.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process'), os = require('os');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const lines = html.split('\n');
let n = 0, fail = 0;
const ok = (c, m) => { n++; if (!c) { fail++; console.error('FAIL', m); } else console.log('ok', m); };

const start = html.indexOf('GLX-WATER1450 (');
ok(start > 0, 'GLX-WATER1450 is inlined');
const sTag = html.lastIndexOf('<script>', start), eTag = html.indexOf('</script>', start);
const src = html.slice(sTag + 8, eTag);
try { new vm.Script(src, {filename: 'water1450.js'}); ok(true, 'water1450 script parses'); } catch (e) { ok(false, 'water1450 script parses: ' + e.message); }
ok(src.includes('__noWater1450') && src.includes("glen_water1450"), 'off switch present');
ok(!/WebGLRenderTarget|CubeCamera|Reflector/.test(src), 'no extra render targets or reflection passes');
ok(html.indexOf('GLX-WATER1450 (') > html.indexOf('GLX-C369 (') && html.indexOf('GLX-WATER1450 (') > html.indexOf('U.waterIn = 0'), 'patch is the outermost water wrapper');
ok(/const GAME_VERSION = '[^']*';/.test(html), 'GAME_VERSION present');
const gv = html.match(/const GAME_VERSION = '([^']*)';/)[1], jv = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v;
ok(gv === jv, 'GAME_VERSION matches version.json (' + gv + ')');
// gameplay untouched: the block table and water flow code are unchanged
ok(html.includes('WATER:5, SAND:6'), 'water block id unchanged');

// ---------- GLSL compile through the real chain ----------
let glslang = process.env.GLSLANG || '';
if (!glslang) { try { glslang = cp.execSync('command -v glslang || command -v glslangValidator', {encoding: 'utf8'}).trim(); } catch (_) {} }
if (!glslang) { console.log('skip GLSL compile (no glslang binary)'); }
else {
  const threeLine = lines.findIndex(l => l.startsWith('!function(t,e){') && l.includes('const e="128"'));
  const sandbox = {console, Math, Date, Float32Array, Uint16Array, Uint8Array, Int32Array, Uint32Array, Int8Array, Int16Array, Float64Array, ArrayBuffer, DataView, Map, Set, WeakMap, Symbol, Promise, JSON, Object, Array, String, Number, Boolean, Error, RegExp, parseInt, parseFloat, isNaN, setTimeout: () => 0, setInterval: () => 0, clearInterval() {}};
  sandbox.window = sandbox; sandbox.self = sandbox; sandbox.navigator = {userAgent: 'node'};
  sandbox.document = {createElementNS: () => ({style: {}, getContext: () => null}), createElement: () => ({style: {}, getContext: () => null})};
  vm.createContext(sandbox);
  let threeSrc = lines[threeLine]; vm.runInContext(threeSrc, sandbox);
  const THREE = sandbox.THREE; ok(!!THREE && THREE.REVISION === '128', 'three.js r128 loaded in node');
  // pull the real water shader chain out of index.html by its markers and run it against a fresh material
  const find = (str, from = 0) => { for (let i = from; i < lines.length; i++) if (lines[i].includes(str)) return i; return -1; };
  const span = (a, isEnd) => { let b = a; while (b < lines.length && !isEnd(lines[b], b)) b++; return lines.slice(a, b + 1).join('\n'); };
  const back = (i, str) => { while (i > 0 && !lines[i].includes(str)) i--; return i; };
  const strip = s => s.trim().replace(/^try \{\s*/, '').replace(/\} catch \(e\) \{[^}]*\}\s*$/, '');
  const base = span(find('const waterUniforms = {uTime'), l => l === '};');
  const c134 = span(find('const obc = waterMat.onBeforeCompile;'), l => l.includes("'c134water'"));
  const c215 = span(find('Object.assign(sh.uniforms, {u5Day: u.u5Day'), l => l.includes("'c215'"));
  const c241 = span(back(find('fract(uTime * 0.5 * aScr.x)'), 'waterMat.onBeforeCompile = function'), l => l.includes("'c241'"));
  const c265 = span(find('sh.uniforms.uWN = u.uWN'), l => l.includes("'c265b1300'"));
  const c369 = span(back(find("v = 'attribute float aOc;"), 'waterMat.onBeforeCompile = function'), l => l.includes("'c369'"));
  const pre = `const ERR = () => {}; const U = {}; const NR = 8; const tex = () => new THREE.Texture();
    const u = {u5Day: {value: 1}, u5Haze: {value: new THREE.Color()}, u41T: {value: 0}, u41Tide: {value: 0}, u41Sea: {value: 40}, u41Rip: {value: [0,0,0,0,0,0,0,0].map(() => new THREE.Vector4())}, u41End: {value: -1},
      uWN: {value: new THREE.Texture()}, uWNon: {value: 1}, uLT: {value: 0}, uWv: {value: 1}, uRp: {value: new THREE.Vector4()}};`;
  const ctxSrc = pre + '\n' + [base, c134, c215, c241, c265, c369].map(strip).map(s => '{\n' + s + '\n}').join('\n').replace('{\nconst waterUniforms', 'var waterUniforms; var waterMat;\n{\nwaterUniforms').replace('const waterMat = new', 'waterMat = new') + '\n;globalThis.__waterMat = waterMat;';
  try { vm.runInContext(ctxSrc, sandbox); ok(true, 'existing water shader chain extracted and attached'); } catch (e) { ok(false, 'chain eval: ' + e.message); }
  // now the new patch itself, against stub globals
  const stub = `var T = {WATER: 5, LAVA: 11, AIR: 0}; var W = 4, H = 4, D = 4; var world = new Uint16Array(64); var idx = (x, y, z) => (x * H + y) * D + z; var getB = () => 0; var waterOpenTo = b => b === 0;
    var GFX = globalThis.__GFX; var PERF = false; var QUALITY = '4k'; var DIM = {cur: null};
    var scene = new THREE.Scene(); var camera = new THREE.PerspectiveCamera(); var skyUniforms = {sunDir: {value: new THREE.Vector3(1, 1, 0)}, sunK: {value: 1}, dark: {value: 0}};
    var renderer = {render() {}}; var localStorage = {getItem: () => null}; var buildWaterGeo = () => null; var waterMat = globalThis.__waterMat;`;
  const sources = [];
  for (const tier of ['fast', 'fancy', 'photo']) for (const inst of [false, true]) for (const gl2 of [false, true]) {
    const sb2 = Object.assign({}, sandbox); vm.createContext(sb2); sb2.window = sb2; sb2.THREE = THREE; sb2.__GFX = tier; sb2.__waterMat = sandbox.__waterMat;
    const mat = sandbox.__waterMat;
    // re-run the patch on a clone of the chain for each tier
    const cloneObc = mat.__baseObc || (mat.__baseObc = mat.onBeforeCompile);
    mat.onBeforeCompile = cloneObc;
    try { vm.runInContext(stub + '\n' + src, sb2); } catch (e) { ok(false, 'patch eval ' + tier + ': ' + e.message); continue; }
    ok(!sb2.__water1450.err, 'patch attached (' + tier + ')' + (sb2.__water1450.err ? ' ' + sb2.__water1450.err : ''));
    const sh = {uniforms: THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms), vertexShader: THREE.ShaderLib.phong.vertexShader, fragmentShader: THREE.ShaderLib.phong.fragmentShader};
    mat.onBeforeCompile(sh, null);
    ok(sb2.__water1450.sh === 1, 'patch applied to the chained shader (' + tier + ')');
    sources.push({tag: tier + (inst ? '-inst' : '') + (gl2 ? '-gl2' : ''), sh, inst, gl2});
  }
  // mesh data: a 4 x 4 pool, 3 deep, with stone round it
  { const sb3 = Object.assign({}, sandbox); vm.createContext(sb3); sb3.window = sb3; sb3.THREE = THREE; sb3.__GFX = 'fancy'; sb3.__waterMat = new THREE.MeshPhongMaterial();
    const pool = `W = 6; H = 6; D = 6; world = new Uint16Array(216); for (let x = 0; x < 6; x++) for (let z = 0; z < 6; z++) for (let y = 0; y < 6; y++) world[idx(x, y, z)] = y === 0 ? 3 : y <= 3 ? ((x >= 1 && x <= 4 && z >= 1 && z <= 4) ? 5 : 3) : 0;`;
    vm.runInContext(stub + '\n' + src + '\n' + pool, sb3);
    const g = new THREE.BufferGeometry(), P = [2, 3.88, 2, 2, 3.88, 3, 3, 3.88, 3, 1, 3.88, 1, 1, 3.88, 2, 2, 3.88, 2, 4, 1, 2, 4, 2, 2, 4, 2, 3];
    const Nn = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0];
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
    sb3.__water1450.addAttrs(g); const a = g.attributes.aW1, near = (x, y) => Math.abs(x - y) < 1e-3;
    ok(!!a && a.count === 9, 'aW1 attribute added per vertex');
    ok(near(a.getX(2), 0.05 + 0.95 * 2 / 9) && a.getY(2) === 0 && a.getZ(2) === 1, 'open water corner: depth 3, no foam, top');
    ok(a.getY(3) === 1, 'corner touching the stone bank gets shore foam');
    ok(a.getZ(6) === 0 && a.getY(6) === 0, 'side face: no foam, not a top');
  }
  // resolve includes and add the three.js r128 program prefix for a Phong, double-sided, mapped, fogged, transparent material
  const resolve = s => s.replace(/^[ \t]*#include +<([\w\d./]+)>/gm, (m, k) => resolve(THREE.ShaderChunk[k]));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'w1450-'));
  for (const {tag, sh, inst, gl2} of sources) {
    const defs = ['#define PHONG', '#define DOUBLE_SIDED', '#define USE_MAP', '#define USE_UV', '#define USE_FOG', '#define NUM_DIR_LIGHTS 1', '#define NUM_POINT_LIGHTS 2', '#define NUM_SPOT_LIGHTS 0', '#define NUM_RECT_AREA_LIGHTS 0', '#define NUM_HEMI_LIGHTS 1', '#define NUM_DIR_LIGHT_SHADOWS 0', '#define NUM_POINT_LIGHT_SHADOWS 0', '#define NUM_SPOT_LIGHT_SHADOWS 0', '#define NUM_CLIPPING_PLANES 0', '#define UNION_CLIPPING_PLANES 0'].concat(inst ? ['#define USE_INSTANCING'] : []).join('\n');
    const vPre = (gl2 ? '#version 300 es\n#define average three_average\n#define attribute in\n#define varying out\n#define texture2D texture\n' : '#version 100\n') + 'precision highp float;\nprecision highp int;\n' + defs + `
uniform mat4 modelMatrix; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform mat4 viewMatrix; uniform mat3 normalMatrix; uniform vec3 cameraPosition; uniform bool isOrthographic;
#ifdef USE_INSTANCING
attribute mat4 instanceMatrix;
#endif
attribute vec3 position; attribute vec3 normal; attribute vec2 uv;
`;
    const fPre = (gl2 ? '#version 300 es\n#define average three_average\n#define varying in\nout highp vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\n#define texture2D texture\n' : '#version 100\n') + 'precision highp float;\nprecision highp int;\n' + defs + `
uniform mat4 viewMatrix; uniform vec3 cameraPosition; uniform bool isOrthographic;
vec4 linearToOutputTexel( vec4 value ) { return value; }
vec4 mapTexelToLinear( vec4 value ) { return value; }
`;
    const v = vPre + resolve(sh.vertexShader), f = fPre + resolve(sh.fragmentShader);
    fs.writeFileSync(path.join(tmp, tag + '.vert'), v); fs.writeFileSync(path.join(tmp, tag + '.frag'), f);
    for (const ext of ['vert', 'frag']) {
      let out = '', code = 0; try { out = cp.execFileSync(glslang, [path.join(tmp, tag + '.' + ext)], {encoding: 'utf8'}); } catch (e) { code = 1; out = (e.stdout || '') + (e.stderr || ''); }
      ok(code === 0, 'GLSL ' + ext + ' compiles (' + tag + ')' + (code ? '\n' + out.split('\n').filter(l => /ERROR/.test(l)).slice(0, 6).join('\n') : ''));
    }
  }
  console.log('shader sources in', tmp);
}
if (fail) { console.error('FAIL', fail + '/' + n); process.exit(1); }
console.log('PASS', n + '/' + n);
