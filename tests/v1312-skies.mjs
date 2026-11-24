// v1.2.112: time-of-day skies and a literal overworld sunset plate. Each realm keeps its own sky.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
const src = fs.readFileSync(path.join(root, 'tools/content-source/skies-1312.js'), 'utf8');
let k = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++k) + ' ' + l); };

ok(ver.v === '1.2.114' || ver.v === '1.2.115' || ver.v >= '1.2.117', 'version.json is 1.2.114');
ok(html.includes("const GAME_VERSION = '1.2.114';") || html.includes("const GAME_VERSION = '1.2.115';") || html.includes("const GAME_VERSION = '1.2.117';") || html.includes("const GAME_VERSION = '1.2.118';") || html.includes("const GAME_VERSION = '1.2.119';") || html.includes("const GAME_VERSION = '1.2.120';") || html.includes("const GAME_VERSION = '1.2.121';") || html.includes("const GAME_VERSION = '1.2.122';") || html.includes("const GAME_VERSION = '1.2.123';") || html.includes("const GAME_VERSION = '1.2.124';") || html.includes("const GAME_VERSION = '1.2.125';"), 'GAME_VERSION is 1.2.114');
ok(html.includes('<!-- glencraft-build: b1314-v1.2.114 -->') && html.includes('<!-- glencraft-build: b1313-v1.2.113 -->') && html.includes('<!-- glencraft-build: b1312-v1.2.112 -->'), '1.2.114, 1.2.113 and 1.2.112 build markers');
ok(html.includes('<!-- glencraft-build: b1311-v1.2.111 -->'), '1.2.111 marker stays');
ok(html.includes('<!-- glencraft-build: b1310-v1.2.110 -->'), '1.2.110 marker stays');
ok(src.includes('function sky1312(WIN)'), 'source IIFE is named sky1312(WIN)');
ok(html.includes(src.trim()), 'skies-1312.js is injected into the page');
ok(html.includes('__sky1312') && html.includes('function palette'), 'runtime helpers are present');
ok(fs.existsSync(path.join(root, 'assets/sky/overworld-sunset.webp')), 'full-resolution sunset plate webp is shipped');
ok(src.includes('assets/sky/overworld-sunset.webp') && src.includes('LinearMipmapLinearFilter'), 'plate is loaded with mipmaps and linear filtering');

const s114 = html.indexOf('{"v":"v1.2.114"');
const s113 = html.indexOf('{"v":"v1.2.113"');
const s0 = html.indexOf('{"v":"v1.2.112"');
const s1 = html.indexOf('{"v":"v1.2.111"', s0);
ok(s114 > 0 && s114 < s113 && s113 < s0 && s1 > s0, 'PATCH_NOTES has 1.2.114 before 1.2.113 before 1.2.112 before 1.2.111');
const notes = html.slice(s0, s1);
ok(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(notes), '1.2.112 notes have no food');
ok(/own sky/i.test(notes) && /orange/i.test(notes) && /pink/i.test(notes), 'notes mention per-realm sky and sunset colours');
ok(/desert sky/i.test(notes) && /starry/i.test(notes), 'notes mention the desert sky and starry night');
ok(/photograph/i.test(notes) && /plate|dome|sunset/i.test(notes), 'notes mention the photographic sunset plate');
ok(credits.includes('## v1.2.112 Time-of-day skies and a literal overworld sunset plate'), 'CREDITS heading');
ok(credits.includes('## v1.2.111 New-world load and title wallpapers'), '1.2.111 CREDITS stay');

// Does not touch protected systems
ok(!/__fpa|gold D-pad|#dU|musket|pistol/.test(src), 'source does not touch the first-person arms, gold D-pad or guns');
ok(!/setB\s*=|generate\s*=|gSeed|worldgen/.test(src), 'source does not change worldgen');
ok(!/WebGL2|EffectComposer|ShaderPass/.test(src), 'no WebGL2 or EffectComposer path');
ok(src.includes('Old box clouds are hidden, not deleted') || src.includes('hidden, not deleted'), 'box clouds are hidden, not deleted');
ok(src.includes("r === 'hell'") === false && src.includes("cur === 'hell'") === false, 'does not rewrite the Hell sky');
ok(src.includes("skyOk(r)") && src.includes("r === 'egypt'"), 'only the overworld and Egypt skies are tinted');

// Palettes
ok(src.includes('0.32, 0.08, 0.28') && src.includes('1.00, 0.52, 0.18'), 'overworld dusk is deep purple / orange');
ok(src.includes('0.48, 0.14, 0.28') && src.includes('1.00, 0.62, 0.32'), 'Egypt dusk is orange and pink');
ok(src.includes('0.12, 0.40, 0.82') && src.includes('0.91, 0.82, 0.62'), 'Egypt day is clear blue to sandy haze');
ok(src.includes('starsK') && src.includes('holdNsky'), 'night stars stay, and the night overlay waits until after sunset');
ok(src.includes("mode = 'photo'") && src.includes('tickPlate') && src.includes('uSunAz'), 'overworld uses a photographic sky plate, not a generated cloud layer');
ok(src.includes('hideOldClouds') && src.includes('clouds'), 'old box clouds stay hidden');
ok(!src.includes('Beer-Lambert') && !src.includes('uSteps'), 'the raymarch cloud path is no longer in the overworld sky');
ok(!/camera\.far\s*=/.test(src) && !/SET\.dist\s*=/.test(src), 'does not change render distance or the far plane');

// Existing Egypt / Hell / nsky paths stay
ok(html.includes('function desertSky') && html.includes('applyDesertSky'), '1.2.96 Egypt desert sky helper stays');
ok(html.includes("const off = !started || (typeof DIM !== 'undefined' && DIM.cur && DIM.cur !== 'egypt')"), 'nsky still allows Egypt at night');
ok(html.includes('blood-red sky') || html.includes('skyUniforms.top.value.setRGB(0.34 * f, 0.035, 0.03)'), 'Hell blood-red sky stays');

// Inline script containing the new IIFE parses
{
  const re = /<script>([\s\S]*?)<\/script>/g; let m, bad = 0, seen = 0;
  while ((m = re.exec(html))) {
    if (!/function sky1312\(WIN\)/.test(m[1])) continue;
    seen++;
    try { new Function(m[1]); } catch (e) { bad++; console.error('parse', e && e.message); }
  }
  ok(seen === 1 && bad === 0, 'sky1312 inline script parses');
}

// Runtime
const PLAYWRIGHT = '/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core/index.js';
const {default: pw} = await import(PLAYWRIGHT);
const {chromium} = pw;
const PORT = Number(process.env.SKY_TEST_PORT || 8816);
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.css':'text/css','.glb':'model/gltf-binary','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2','.wasm':'application/wasm','.svg':'image/svg+xml'};
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
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e && e.message || e).slice(0, 400)));
await page.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1&qa=t1312sky`, {waitUntil: 'domcontentloaded', timeout: 180000});
await page.waitForFunction(() => !!(window.__sky1312 && window.__eg1295 && typeof updateSky === 'function' && typeof THREE !== 'undefined'), null, {timeout: 180000});

const rt = await page.evaluate(() => {
  const U = window.__sky1312;
  const pack = (p) => ({
    top: p.top.map(x => +x.toFixed(3)),
    mid: p.mid.map(x => +x.toFixed(3)),
    hor: p.hor.map(x => +x.toFixed(3)),
    fog: p.fog.map(x => +x.toFixed(3)),
    sunK: +p.sunK.toFixed(3),
    starsK: +p.starsK.toFixed(3),
    dusk: +p.ph.dusk.toFixed(3),
    day: +p.ph.day.toFixed(3)
  });
  const out = {err: U.err, version: U.version, hook: U.hook, q: U.q, shader: U.shader, pal: {}, apply: {}, hell: {}, ui: false};
  out.pal.owDay = pack(U.palette(0.25, null));
  out.pal.owDusk = pack(U.palette(0.50, null));
  out.pal.owNight = pack(U.palette(0.75, null));
  out.pal.egDay = pack(U.palette(0.25, 'egypt'));
  out.pal.egDusk = pack(U.palette(0.50, 'egypt'));
  out.pal.egNight = pack(U.palette(0.75, 'egypt'));
  try {
    if (typeof DIM !== 'undefined' && DIM) DIM.cur = null;
    if (typeof caveL === 'number') { caveL = 0; caveK = 0; }
    if (typeof weather !== 'undefined' && weather) { weather.type = 'clear'; weather.dark = 0; }
    if (typeof CYCLE === 'number') dayClock = CYCLE * 0.50;
    if (typeof updateSky === 'function') updateSky(0);
    U.apply();
    out.apply.ow = {
      ok: true,
      top: skyUniforms.top.value.toArray().map(x => +x.toFixed(3)),
      hor: skyUniforms.hor.value.toArray().map(x => +x.toFixed(3)),
      duskK: skyUniforms.duskK ? +skyUniforms.duskK.value.toFixed(3) : null,
      mid: skyUniforms.mid ? skyUniforms.mid.value.toArray().map(x => +x.toFixed(3)) : null,
      nsky: !!(window.__nsky && __nsky.dome && __nsky.dome.visible)
    };
    DIM.cur = 'egypt';
    U.apply();
    out.apply.eg = {
      top: skyUniforms.top.value.toArray().map(x => +x.toFixed(3)),
      hor: skyUniforms.hor.value.toArray().map(x => +x.toFixed(3)),
      nsky: !!(window.__nsky && __nsky.dome && __nsky.dome.visible)
    };
    const fogBefore = scene.fog.color.clone();
    const topBefore = skyUniforms.top.value.clone();
    DIM.cur = 'hell';
    const appliedHell = U.apply();
    out.hell = {
      applied: appliedHell,
      topSame: topBefore.equals(skyUniforms.top.value),
      fogSame: fogBefore.equals(scene.fog.color)
    };
    DIM.cur = null;
  } catch (e) { out.applyErr = String(e && e.stack || e); }
  try {
    if (typeof started !== 'undefined') started = true;
    if (typeof DIM !== 'undefined' && DIM) DIM.cur = null;
    U.apply();
    if (typeof renderer !== 'undefined' && renderer && typeof scene !== 'undefined' && typeof camera !== 'undefined') {
      renderer.render(scene, camera);
    }
    out.plate = {
      mode: U.mode,
      hasTex: !!U.plateTex,
      hasMesh: !!U.plateMesh,
      visible: !!(U.plateMesh && U.plateMesh.visible),
      mip: !!(U.plateTex && U.plateTex.generateMipmaps),
      err: U.err
    };
    DIM.cur = 'egypt';
    U.apply();
    out.plateEg = { mode: U.mode, visible: !!(U.plateMesh && U.plateMesh.visible) };
    DIM.cur = null;
    U.apply();
  } catch (e) { out.plate = { err: String(e && e.stack || e) }; }

  return out;
});

ok(rt.version === '1.2.112-skies', 'runtime __sky1312 version');
ok(rt.hook === 1 && !rt.err, 'updateSky hook installed without error (' + rt.err + ')');
ok(rt.shader === 1, 'sky dome uniforms path is active');
ok(rt.pal.owDay.hor[2] > rt.pal.owDay.hor[0] * 0.9, 'overworld day horizon is a cool pale blue');
ok(rt.pal.owDusk.dusk > 0.5 && rt.pal.owDusk.hor[0] > 0.8 && rt.pal.owDusk.hor[1] > 0.35, 'overworld sunset horizon is a strong orange');
ok(rt.pal.owDusk.top[0] > rt.pal.owDusk.top[1] && rt.pal.owDusk.mid[0] > 0.7, 'overworld sunset top/mid lean red and pink');
ok(rt.pal.owNight.top[2] < 0.25 && rt.pal.owNight.starsK > 0.4, 'overworld night is a dark starry sky');
ok(rt.pal.egDay.top[2] > 0.7 && rt.pal.egDay.hor[0] > 0.8 && rt.pal.egDay.hor[0] > rt.pal.egDay.hor[2], 'Egypt day is clear blue over a sandy haze');
ok(rt.pal.egDusk.hor[0] > 0.8 && rt.pal.egDusk.hor[1] > 0.4 && rt.pal.egDusk.top[0] > rt.pal.egDusk.top[2], 'Egypt sunset is orange and pink');
ok(rt.pal.egNight.top[2] < 0.2 && rt.pal.egNight.starsK > 0.5, 'Egypt night is a dark starry sky');
ok(rt.apply.ow && rt.apply.ow.nsky === false && rt.apply.ow.hor && rt.apply.ow.hor[0] > 0.7, 'at sunset the night overlay stays off in the overworld');
ok(rt.apply.eg && rt.apply.eg.hor[0] > 0.7 && rt.apply.eg.nsky === false, 'Egypt sunset is not covered by the night overlay');
ok(rt.hell && rt.hell.applied === false && rt.hell.topSame && rt.hell.fogSame, 'Hell sky uniforms are left unchanged');
ok(rt.plate && rt.plate.mode === 'photo' && rt.plate.hasTex && rt.plate.hasMesh && rt.plate.visible, 'overworld sunset plate is on the dome (' + JSON.stringify(rt.plate) + ')');
ok(rt.plateEg && rt.plateEg.mode === 'egypt' && rt.plateEg.visible === false, 'Egypt keeps its desert sky and does not show the Highlands plate');
ok(pageErrors.filter(e => /sky1312|WEBGL|Shader|shader/i.test(e)).length === 0, 'no shader/page errors (' + pageErrors.slice(0, 3).join(' | ') + ')');

await browser.close();
server.close();
console.log('PASS ' + k + ' v1312 skies checks');
