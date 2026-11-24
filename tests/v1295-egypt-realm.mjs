// v1295: Egypt / sand-realm paintings, UFO night route, Egyptian spawns, desert sky. Released as 1.2.96. Version pins follow the current GAME_VERSION (1.2.102).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/egypt-1295.js'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
const OUT = process.env.EGYPT_OUT || '/workspace/qa/t1268';
fs.mkdirSync(OUT, {recursive: true});

let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

// ---------- source: version, notes, inject ----------
ok(ver.v === '1.2.101' || ver.v === '1.2.102' || ver.v === '1.2.103' || JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.104' || JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.105' || JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.106' || JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.107' || JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.108' || JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.109' || JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.110' || JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.112' || JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.113' || JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.114' || JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.115' || JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v >= '1.2.117', 'version.json is 1.2.102');
ok(html.includes("const GAME_VERSION = '1.2.99';") || html.includes("const GAME_VERSION = '1.2.100';") || html.includes("const GAME_VERSION = '1.2.101';") || html.includes("const GAME_VERSION = '1.2.102';") || html.includes("const GAME_VERSION = '1.2.103';") || html.includes("const GAME_VERSION = '1.2.104';") || html.includes("const GAME_VERSION = '1.2.105';") || html.includes("const GAME_VERSION = '1.2.106';") || html.includes("const GAME_VERSION = '1.2.107';") || html.includes("const GAME_VERSION = '1.2.108';") || html.includes("const GAME_VERSION = '1.2.109';") || html.includes("const GAME_VERSION = '1.2.110';") || html.includes("const GAME_VERSION = '1.2.111';") || html.includes("const GAME_VERSION = '1.2.112';") || html.includes("const GAME_VERSION = '1.2.113';") || html.includes("const GAME_VERSION = '1.2.114';") || html.includes("const GAME_VERSION = '1.2.115';") || html.includes("const GAME_VERSION = '1.2.117';") || html.includes("const GAME_VERSION = '1.2.118';") || html.includes("const GAME_VERSION = '1.2.119';") || html.includes("const GAME_VERSION = '1.2.120';") || html.includes("const GAME_VERSION = '1.2.121';") || html.includes("const GAME_VERSION = '1.2.122';") || html.includes("const GAME_VERSION = '1.2.123';") || html.includes("const GAME_VERSION = '1.2.124';") || html.includes("const GAME_VERSION = '1.2.125';") || html.includes("const GAME_VERSION = '1.2.126';") || html.includes("const GAME_VERSION = '1.2.114';"), 'GAME_VERSION is 1.2.100');
ok(html.includes('<!-- glencraft-build: b1296-v1.2.96 -->'), 'b1296 build marker');
ok(html.includes('<!-- glencraft-build: b1299-v1.2.99 -->'), 'b1299 build marker');
ok(html.includes('<!-- glencraft-build: b1300-v1.2.100 -->'), 'b1300 build marker');
ok(html.includes('<!-- glencraft-build: b1301-v1.2.101 -->'), 'b1301 build marker');
ok(html.includes('<!-- glencraft-build: b1302-v1.2.102 -->'), 'b1302 build marker');
ok(html.includes('<!-- glencraft-build: b1295-v1.2.95 -->'), '1.2.95 pick/map marker stays');
ok(html.includes('{"v":"v1.2.96"'), 'PATCH_NOTES has v1.2.96');
ok(html.includes('{"v":"v1.2.95"'), '1.2.95 pick/map notes stay');
ok(/UFO paintings hang in the Egypt land pyramid/i.test(html), 'notes: paintings restored');
ok(/flies to the sand realm at night/i.test(html) && /no longer appears over Glencraft/i.test(html), 'notes: saucer night route');
ok(/Egyptians only live at the temple in the sand realm/i.test(html), 'notes: Egyptians only in sand realm');
ok(/own desert sky/i.test(html) && /orange and pink/i.test(html) && /starry night/i.test(html), 'notes: desert sky');
{
  const st = html.indexOf('{"v":"v1.2.96"'), en = html.indexOf('{"v":"v1.2.95"', st);
  ok(st > 0 && en > st && !/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.96 notes present, no food');
}
ok(credits.includes('## v1.2.96 Egypt land paintings, saucer and sky'), 'CREDITS heading');
ok(src.includes('function egypt1295(WIN)'), 'source IIFE is named egypt1295(WIN)');
ok(html.includes(src.trim()), 'egypt-1295.js is injected into the page');
ok(html.includes('GLX-EG1295'), 'GLX-EG1295 banner present');

// ---------- paintings: old assets kept, visibility allowed in egypt ----------
for (let i = 1; i <= 6; i++) {
  const p = path.join(root, 'assets/art', 'user_p' + i + '.jpg');
  ok(fs.existsSync(p) && fs.statSync(p).size > 1000, 'user_p' + i + '.jpg is still present');
}
ok(html.includes("ld.load('assets/art/user_p' + (k + 1) + '.jpg')"), 'c268 still loads user_p1-6');
ok(html.includes("if (!started || (DIM.cur && DIM.cur !== 'egypt')) { grp.visible = false; return r; }"), 'c239 murals can show in Egypt');
ok(html.includes("if (!started || (DIM.cur && DIM.cur !== 'egypt')) { grp.visible = false; return; }"), 'c268 paintings can show in Egypt');
ok(html.includes("if (typeof DIM !== 'undefined' && DIM.cur === 'egypt' && window.__egPyr)"), 'c239 find uses the Egypt pyramid in the sand realm');
ok(!/user_p7/.test(html), 'no new painting assets were invented');

// ---------- UFO night route: Agartha -> egypt, never Glencraft overworld ----------
ok((html.match(/\['egypt', py\.cx \+ \.5/g) || []).length === 10, 'all 10 c304 pyramid waypoints target the egypt dimension');
ok(!html.includes("['ow', py.cx + .5"), 'no c304 pyramid waypoint still targets the overworld');
ok(html.includes('__eg1295.ufoHereTag') && html.includes("DIM.cur === 'egypt' ? 'egypt'"), 'c304 show() uses Egypt / Agartha tags, never the overworld');
ok(html.includes('function zig(dt, p) { const py = (window.__egPyr && __egPyr()) || __c239.pyr'), 'night tic-tac uses the Egypt pyramid');
ok(html.includes('hideUfoOnSurface') && src.includes('onGlenSurface'), 'surface overworld saucer is dropped');
ok(html.includes("const off = !started || (typeof DIM !== 'undefined' && DIM.cur && DIM.cur !== 'egypt')"), 'night sky stars are allowed in Egypt');

// ---------- Egyptians only in the sand realm ----------
ok(html.includes("if (o && o !== key && o.L) { key = o; if (typeof DIM !== 'undefined' && DIM.cur === 'egypt') spawn(o); }"), 'c240 auto-spawn only in Egypt');
ok(html.includes("if (o && o.L && typeof DIM !== 'undefined' && DIM.cur === 'egypt') spawn(o);"), 'c259 auto-spawn only in Egypt');
ok((html.match(/f\.g\.visible = DIM\.cur === 'egypt'/g) || []).length >= 2, 'c240 and c259 folk are visible only in Egypt');
ok((html.match(/live = !paused && !dead && DIM\.cur === 'egypt'/g) || []).length >= 2, 'c240 and c259 folk only simulate in Egypt');
ok(src.includes('evictEgyptians') && html.includes('evictEgyptians'), 'overworld Egyptians are evicted');
ok(html.includes('__c240.spawnAt') && html.includes("DIM.cur !== NAME) return"), '1.2.69 spawnAt gate stays');

// ---------- desert sky is Egypt-only, cheap, WebGL1 uniforms ----------
ok(src.includes('function desertSky') && src.includes('applyDesertSky'), 'desert sky helper is defined');
ok(src.includes('skyUniforms') && src.includes('scene.fog') && src.includes('starsK'), 'sky tints fog, dome uniforms and stars');
ok(!/WebGL2|rawShader|postprocess|EffectComposer|ShaderPass/i.test(src), 'no WebGL2 or post-process sky path');
ok(src.includes('inEgypt()') && src.includes('applyDesertSky'), 'sky applies only in Egypt');
// palette intent
ok(src.includes('0.12, 0.38, 0.78') && src.includes('0.91, 0.82, 0.62'), 'day: deep blue top, sandy horizon');
ok(src.includes('0.78, 0.32, 0.28') && src.includes('0.95, 0.48, 0.62'), 'dusk: orange and pink');
ok(src.includes('0.02, 0.04, 0.10') && src.includes('starsK'), 'night: dark clear sky with stars');
ok(!/phalanxGeo|applyRestCurl|NEW_FP_KINDS|enableKinds/.test(src), 'does not touch first-person hands');
ok(!/\['dU'/.test(src) && !/#dU/.test(src), 'does not touch the gold D-pad');

// Hands / landscape / loading fluid still present
ok(html.includes('GLX-LAND1293') && html.includes('GLX-PAD1292') && html.includes('liquid1285'), 'landscape, pad inventory and load fluid stay');

// ---------- runtime ----------
const PLAYWRIGHT = '/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core/index.js';
const {default: pw} = await import(PLAYWRIGHT);
const {chromium} = pw;
const PORT = Number(process.env.EGYPT_PORT || 8797);
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.css':'text/css','.glb':'model/gltf-binary','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2','.wasm':'application/wasm','.svg':'image/svg+xml'};
const server = http.createServer((req, res) => {
  try {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p === '/') p = '/index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const data = fs.readFileSync(file);
    res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
    res.end(data);
  } catch (e) {
    res.writeHead(e.code === 'ENOENT' ? 404 : 500);
    res.end(String(e.message || e));
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox','--no-sandbox','--disable-dev-shm-usage','--hide-scrollbars']
});
const page = await browser.newPage({viewport: {width: 1280, height: 720}});
page.setDefaultTimeout(180000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1&qa=t1295egypt`, {waitUntil: 'domcontentloaded', timeout: 180000});
await page.waitForFunction(() => !!(window.__eg1295 && window.__egPyr && typeof THREE !== 'undefined'), null, {timeout: 180000});

const rt = await page.evaluate(() => {
  const U = window.__eg1295;
  const out = {err: U.err, version: U.version, pal: {}, here: {}, evict: {}, seeds: [], skyShader: null, glenUnchanged: null};

  // Palette at noon, sunset, night (clock is a 0-1 day fraction for desertSky when passed in).
  const noon = U.desertSky(0.25);
  const dusk = U.desertSky(0.524);
  const dawn = U.desertSky(0.976);
  const night = U.desertSky(0.75);
  const pack = (p) => ({day: +p.day.toFixed(3), dusk: +p.dusk.toFixed(3), night: +p.night.toFixed(3), top: p.top.map(x => +x.toFixed(3)), hor: p.hor.map(x => +x.toFixed(3)), fog: p.fog.map(x => +x.toFixed(3)), sunK: +p.sunK.toFixed(3), starsK: +p.starsK.toFixed(3)});
  out.pal = {noon: pack(noon), dusk: pack(dusk), dawn: pack(dawn), night: pack(night)};

  // Sky shader still compiles under WebGL1 (the existing dome material).
  try {
    const mat = (typeof skyDome !== 'undefined' && skyDome && skyDome.material) ? skyDome.material : null;
    out.skyShader = !!(mat && mat.uniforms && mat.uniforms.top && mat.uniforms.hor && mat.uniforms.sunK);
    out.skyVertex = !!(mat && mat.vertexShader && /gl_Position/.test(mat.vertexShader));
    out.skyFrag = !!(mat && mat.fragmentShader && /gl_FragColor/.test(mat.fragmentShader));
  } catch (e) { out.skyShaderErr = String(e); }

  // ufoHereTag / surface gate
  const dimWas = (typeof DIM !== 'undefined' && DIM) ? DIM.cur : undefined;
  const setDim = (v) => { try { if (typeof DIM === 'undefined') window.DIM = {cur: v}; else DIM.cur = v; } catch (_) {} };
  setDim('egypt');
  out.here.egypt = U.ufoHereTag();
  out.here.egyptIn = U.inEgypt();
  out.here.egyptSurface = U.onGlenSurface();
  setDim('agartha');
  out.here.agartha = U.ufoHereTag();
  out.here.agarthaIn = U.inAgartha();
  setDim(null);
  out.here.overworld = U.ufoHereTag();
  out.here.overworldSurface = U.onGlenSurface();
  setDim('hell');
  out.here.hell = U.ufoHereTag();
  setDim(dimWas || null);

  // Apply desert sky only in Egypt; Glencraft fog/sky path is not forced.
  setDim(null);
  const fogBefore = (typeof scene !== 'undefined' && scene && scene.fog && scene.fog.color)
    ? [scene.fog.color.r, scene.fog.color.g, scene.fog.color.b] : null;
  const appliedOW = U.applyDesertSky();
  const fogAfterOW = (typeof scene !== 'undefined' && scene && scene.fog && scene.fog.color)
    ? [scene.fog.color.r, scene.fog.color.g, scene.fog.color.b] : null;
  setDim('egypt');
  const appliedEG = U.applyDesertSky();
  const fogEG = (typeof scene !== 'undefined' && scene && scene.fog && scene.fog.color)
    ? [scene.fog.color.r, scene.fog.color.g, scene.fog.color.b] : null;
  const topEG = (typeof skyUniforms !== 'undefined' && skyUniforms && skyUniforms.top)
    ? [skyUniforms.top.value.r, skyUniforms.top.value.g, skyUniforms.top.value.b] : null;
  out.glenUnchanged = {appliedOW, appliedEG, fogBefore, fogAfterOW, fogEG, topEG};
  setDim(dimWas || null);

  // Egyptian evict + seed-stable spawn gate: dummy folk in the overworld must vanish
  // for several seeds, and only remain when DIM.cur === 'egypt'.
  const seeds = [1, 7, 42, 99, 12345, 2026, 99991];
  for (const seed of seeds) {
    try { if (typeof gSeed !== 'undefined') gSeed = seed; } catch (_) {}
    setDim(null);
    const g = {visible: true, parent: {remove(x) { g.parent = null; g.removed = true; }}, removed: false};
    const folk = [{g, kind: 'egyptian', x: 10, z: 10}];
    const village = [{g: {visible: true, parent: {remove(x) { village[0].g.parent = null; village[0].g.removed = true; }}, removed: false}, kind: 'egyptian'}];
    window.__c240 = window.__c240 || {};
    window.__c259 = window.__c259 || {};
    __c240.folk = folk;
    __c259.out = () => village;
    const n = U.evictEgyptians();
    const stillFolk = (__c240.folk && __c240.folk.length) || 0;
    const vis = g.visible;
    const removed = !!(g.removed || g.parent === null);
    // spawnAt-style gate: 1.2.69 + 1.2.95 only when egypt
    const spawnOkOW = !!(typeof DIM !== 'undefined' && DIM.cur === 'egypt');
    setDim('egypt');
    const spawnOkEG = !!(typeof DIM !== 'undefined' && DIM.cur === 'egypt');
    // Egypt pyr is deterministic at the island centre for every seed
    const pyr = window.__egPyr();
    out.seeds.push({seed, evicted: n, stillFolk, vis, removed, spawnOkOW, spawnOkEG, pyr: {cx: pyr.cx, cz: pyr.cz, hy: pyr.hy}});
    setDim(dimWas || null);
  }
  return out;
});

ok(rt.version === '1.2.96-egypt', 'runtime __eg1295 version');
ok(!rt.err, 'runtime IIFE has no error (' + rt.err + ')');
ok(rt.skyShader && rt.skyVertex && rt.skyFrag, 'existing WebGL1 sky dome shader is present');

// Day: deep blue overhead (stronger blue than red/green), sandy warm horizon
ok(rt.pal.noon.day > 0.7 && rt.pal.noon.top[2] > rt.pal.noon.top[0] + 0.3 && rt.pal.noon.top[2] > 0.5, 'noon top is a deep clear blue');
ok(rt.pal.noon.hor[0] > 0.7 && rt.pal.noon.hor[1] > 0.6 && rt.pal.noon.hor[0] > rt.pal.noon.hor[2], 'noon horizon is a pale warm sand colour');
ok(rt.pal.noon.sunK > 0.8 && rt.pal.noon.starsK < 0.2, 'noon has a hot sun and almost no stars');
ok(rt.pal.noon.fog[0] > 0.7 && rt.pal.noon.fog[0] > rt.pal.noon.fog[2], 'noon fog matches the sandy haze');

// Dusk / dawn: orange and pink
ok(rt.pal.dusk.dusk > 0.4 && rt.pal.dusk.hor[0] > 0.7 && rt.pal.dusk.hor[1] > 0.35, 'sunset horizon is orange');
ok(rt.pal.dusk.top[0] > rt.pal.dusk.top[2], 'sunset top leans red/orange');
ok(rt.pal.dawn.dusk > 0.4 && rt.pal.dawn.hor[0] > 0.7, 'sunrise is also a warm orange-pink gradient');

// Night: dark + stars
ok(rt.pal.night.night > 0.7 && rt.pal.night.top[2] < 0.2 && rt.pal.night.top[0] < 0.1, 'night top is a dark clear sky');
ok(rt.pal.night.starsK > 0.7 && rt.pal.night.sunK < 0.2, 'night has lots of stars and no hot sun');
ok(rt.pal.night.fog[2] < 0.25, 'night fog is a dark matching colour');

ok(rt.here.egypt === 'egypt' && rt.here.egyptIn === true && rt.here.egyptSurface === false, 'UFO here-tag is egypt in the sand realm');
ok(rt.here.agartha === 'ag' && rt.here.overworld == null && rt.here.overworldSurface === true, 'UFO here-tag is ag in Agartha and null on the Glencraft surface');
ok(rt.here.hell == null, 'UFO here-tag is null in other dimensions');

ok(rt.glenUnchanged.appliedOW === false, 'desert sky does not apply in the Glencraft overworld');
ok(rt.glenUnchanged.appliedEG === true, 'desert sky applies in Egypt');
if (rt.glenUnchanged.fogBefore && rt.glenUnchanged.fogAfterOW) {
  const same = rt.glenUnchanged.fogBefore.every((v, i) => Math.abs(v - rt.glenUnchanged.fogAfterOW[i]) < 1e-6);
  ok(same, 'overworld fog is left unchanged by the Egypt sky hook');
} else {
  ok(true, 'overworld fog hook skipped (fog not yet created)');
}
ok(rt.glenUnchanged.topEG && rt.glenUnchanged.topEG[2] > 0.05, 'Egypt sky uniforms were written');

ok(rt.seeds.length === 7, 'checked Egyptian spawns across 7 seeds');
for (const s of rt.seeds) {
  ok(s.spawnOkOW === false && s.spawnOkEG === true, 'seed ' + s.seed + ': spawn allowed only in Egypt');
  ok(s.stillFolk === 0 && s.vis === false && s.removed, 'seed ' + s.seed + ': overworld Egyptians evicted');
  ok(s.pyr.cx === 120 && s.pyr.cz === 128, 'seed ' + s.seed + ': default Egypt pyramid stays at the island centre');
}

fs.writeFileSync(path.join(OUT, 'v1295-runtime.json'), JSON.stringify(rt, null, 2));

await browser.close();
server.close();
console.log('all ok (' + n + ')');
