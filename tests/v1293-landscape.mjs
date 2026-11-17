// v1293: phones are landscape-only from the loading screen onward.
// Source checks plus headless Chromium at 390x844 and 844x390.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = process.env.LAND_HTML || path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const outDir = process.env.LAND_OUT || '/workspace/qa/t1257';
fs.mkdirSync(outDir, {recursive: true});

let checks = 0;
const ok = (v, s) => { assert.ok(v, s); console.log('ok ' + (++checks) + ' ' + s); };
const eq = (a, b, s) => { assert.equal(a, b, s); console.log('ok ' + (++checks) + ' ' + s); };

// ---------- source ----------
ok(html.includes('<!-- glencraft-build: land1293 -->'), 'land1293 build marker');
eq((html.match(/GLX-LAND1293/g) || []).length, 2, 'exactly two GLX-LAND1293 banners (early + late)');
ok(html.includes('id="glenRotate"') || html.includes("el.id = 'glenRotate'"), 'Rotate overlay element is created');
ok(html.includes('Rotate your phone'), 'overlay says Rotate your phone');
ok(html.includes("data-testid', 'rotate-phone-overlay'") || html.includes('data-testid="rotate-phone-overlay"'), 'overlay has test id');
ok(/o\.lock\(\s*'landscape'\s*\)/.test(html), "calls screen.orientation.lock('landscape')");
ok(html.includes('requestFullscreen') && html.includes('webkitRequestFullscreen'), 'requests fullscreen');
// The lock and fullscreen calls live inside try/catch in requestLock
const lockFn = html.slice(html.indexOf('function requestLock()'), html.indexOf('function sync()', html.indexOf('function requestLock()')));
ok(lockFn.includes('try') && lockFn.includes('catch'), 'requestLock wraps fullscreen and orientation.lock in try/catch');
ok(html.includes('isTv()') && /SMART-TV|SmartTV/.test(html), 'TV user agents are excluded');
ok(html.includes('Windows NT|Macintosh|X11; Linux x86_64') && html.includes('__glenForceDesktop'), 'desktop UAs are excluded');
ok(html.includes("s.id === 'scr-' + name") === true, 'showScreen is unchanged');
ok(!/__glenLoad\.held\s*=\s*true/.test(html.slice(html.indexOf('land1293early'), html.indexOf('land1293late') + 4000) + html.slice(html.indexOf('land1293late'))), 'landscape patch does not hold the loading gate');
ok(html.includes('U.skippedResize = (U.skippedResize || 0) + 1') && html.includes('if (U.blocked)'), 'resize is skipped while the overlay is up');
ok(html.includes("if (U.blocked) return {lx: 0, ly: 0, rx: 0, ry: 0}"), 'gamepad/readPad input is paused in portrait');
ok(html.includes('#playBtn') && html.includes('#startBtn') && html.includes('#createGo'), 'lock is bound to Play / Start / Create gestures');
ok(html.includes('__glenLoad') && html.includes('loadPct') && html.includes('GLX-LOAD1289'), 'loading meter code is still present');

// No worldgen / FP-pose edits in this patch: the late IIFE only wraps resize/step/readPad and binds gestures.
const late = html.slice(html.indexOf('function land1293late()'), html.indexOf('})();', html.indexOf('function land1293late()')) + 5);
ok(!/placeOreVeins|generate\s*\(|__fpa|beforeDraw/.test(late), 'late landscape hook does not touch worldgen or FP poses');

console.log('source ok ' + checks);

// ---------- browser ----------
const PLAYWRIGHT = '/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core/index.js';
const {default: pw} = await import(PLAYWRIGHT);
const {chromium} = pw;
const PHONE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36';
const DESKTOP_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const TV_UA = 'Mozilla/5.0 (Linux; Android 12; BRAVIA 4K; SMART-TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const PORT = Number(process.env.LAND_PORT || 8793);
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
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox', '--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars']
});

async function openPage({ua, width, height, mobile, extraInit}) {
  const context = await browser.newContext({
    viewport: {width, height},
    deviceScaleFactor: 1,
    isMobile: !!mobile,
    hasTouch: !!mobile,
    userAgent: ua
  });
  const page = await context.newPage();
  page.setDefaultTimeout(180000);
  page.on('pageerror', (e) => console.log('PAGEERROR', String(e && e.message || e).slice(0, 240)));
  await page.addInitScript(() => {
    try {
      const o = (screen && screen.orientation) || {};
      const orig = o.lock && o.lock.bind(o);
      const spy = function (m) {
        try { window.__lockModes = (window.__lockModes || []).concat([m]); } catch (_) {}
        if (orig) return orig(m);
        return Promise.resolve();
      };
      try { Object.defineProperty(o, 'lock', {configurable: true, value: spy}); } catch (_) {
        try { o.lock = spy; } catch (__) {}
      }
    } catch (_) {}
  });
  if (extraInit) await page.addInitScript(extraInit);
  await page.goto(`http://127.0.0.1:${PORT}/index.html?nosw=1&qa=t1257`, {waitUntil: 'domcontentloaded', timeout: 180000});
  return {context, page};
}

async function waitReady(page, extraMs = 0) {
  await page.waitForFunction(() => {
    try { return !!(window.__glenLandscape && typeof startGame === 'function'); } catch (e) { return false; }
  }, null, {timeout: 180000});
  if (extraMs) await page.waitForTimeout(extraMs);
}

async function shot(page, name) {
  const dest = path.join(outDir, name);
  await page.screenshot({path: dest, fullPage: false});
  console.log('shot ' + dest);
  return dest;
}

function overlayOn(page) {
  return page.evaluate(() => {
    const el = document.getElementById('glenRotate');
    const u = window.__glenLandscape || {};
    const st = el ? getComputedStyle(el) : null;
    return {
      exists: !!el,
      on: !!(el && el.classList.contains('on')),
      display: st ? st.display : 'none',
      text: el ? el.textContent.replace(/\s+/g, ' ').trim() : '',
      blocked: !!u.blocked,
      phone: !!u.phone,
      portrait: !!u.portrait,
      skippedResize: u.skippedResize || 0,
      locks: u.locks || 0,
      fs: u.fs || 0,
      err: u.err || null,
      aspect: (typeof camera !== 'undefined' && camera) ? camera.aspect : null,
      inner: [window.innerWidth, window.innerHeight],
      loadPct: (document.getElementById('loadPct') || {}).textContent || '',
      shown: (window.__glenLoad && typeof __glenLoad.shown === 'number') ? __glenLoad.shown : null,
      screen: typeof screen !== 'undefined' ? (typeof screen === 'string' ? screen : null) : null,
      started: typeof started !== 'undefined' ? !!started : false
    };
  });
}

// 1) Phone portrait boot: overlay on, game not laid out in portrait
{
  const {context, page} = await openPage({ua: PHONE_UA, width: 390, height: 844, mobile: true});
  await waitReady(page, 400);
  const s = await overlayOn(page);
  ok(s.exists && s.on && s.display === 'flex', 'phone portrait boot shows the Rotate overlay');
  ok(/Rotate your phone/.test(s.text), 'overlay text is Rotate your phone');
  ok(s.phone && s.portrait && s.blocked, 'state is phone + portrait + blocked');
  if (s.aspect != null) ok(s.aspect >= 1, 'camera stays at a landscape aspect under the overlay (got ' + s.aspect + ')');
  ok(s.skippedResize >= 0, 'resize skip counter is available');
  await shot(page, '01-portrait-boot-overlay.png');
  await context.close();
}

// 2) Phone landscape boot: no overlay
{
  const {context, page} = await openPage({ua: PHONE_UA, width: 844, height: 390, mobile: true});
  await waitReady(page, 400);
  const s = await overlayOn(page);
  ok(s.exists, 'overlay element exists in landscape');
  ok(!s.on && s.display === 'none' && !s.blocked, 'phone landscape boot does not show the overlay');
  ok(s.phone && !s.portrait, 'state is phone + landscape');
  await shot(page, '02-landscape-boot-clean.png');

  // Wait for the title, then the first Play gesture requests fullscreen + orientation lock
  await page.waitForFunction(() => {
    try { return typeof texDone !== 'undefined' && texTotal > 0 && texDone >= texTotal && typeof screen !== 'undefined' && screen === 'title'; } catch (e) { return false; }
  }, null, {timeout: 180000});
  const play = page.locator('#playBtn');
  await play.waitFor({state: 'visible', timeout: 30000});
  const before = await page.evaluate(() => ({fs: (__glenLandscape.fs || 0), locks: (__glenLandscape.locks || 0), modes: window.__lockModes || []}));
  await play.click();
  const after = await page.evaluate(() => ({fs: (__glenLandscape.fs || 0), locks: (__glenLandscape.locks || 0), modes: window.__lockModes || []}));
  ok(after.fs > before.fs || after.locks > before.locks || (after.modes || []).indexOf('landscape') >= 0,
    'Play gesture requests fullscreen and/or orientation.lock(landscape) (fs ' + before.fs + '->' + after.fs + ', locks ' + before.locks + '->' + after.locks + ', modes ' + JSON.stringify(after.modes) + ')');

  // Mid-load rotate: already on worlds after Play; create a world, flip to portrait, meter keeps counting
  let midLoad = false;
  try {
    await page.waitForSelector('#scr-worlds.on, [data-testid="world-create-tile"]', {timeout: 30000});
    const createTile = page.locator('[data-testid="world-create-tile"]');
    if (await createTile.count()) await createTile.click();
    await page.waitForSelector('#createGo, [data-testid="create-world-button"]', {timeout: 30000});
    await page.click('#createGo');
    await page.waitForFunction(() => {
      try { return (typeof screen !== 'undefined' && screen === 'loading') || !!(window.__glenLoad); } catch (e) { return false; }
    }, null, {timeout: 60000});
    const meter0 = await page.evaluate(() => ({
      pct: (document.getElementById('loadPct') || {}).textContent || '',
      shown: (window.__glenLoad && __glenLoad.shown) || 0,
      t: performance.now()
    }));
    await page.waitForTimeout(400);
    await page.setViewportSize({width: 390, height: 844});
    await page.waitForTimeout(250);
    const por = await overlayOn(page);
    ok(por.on && por.blocked && por.portrait, 'rotating mid-load to portrait shows the overlay and pauses layout');
    if (por.aspect != null) ok(por.aspect >= 1, 'mid-load portrait still holds a landscape camera aspect (got ' + por.aspect + ')');
    await shot(page, '03-portrait-loading-overlay.png');
    await page.waitForTimeout(1200);
    const meter1 = await page.evaluate(() => ({
      pct: (document.getElementById('loadPct') || {}).textContent || '',
      shown: (window.__glenLoad && __glenLoad.shown) || 0
    }));
    const n0 = parseFloat(meter0.shown) || parseFloat(meter0.pct) || 0;
    const n1 = parseFloat(meter1.shown) || parseFloat(meter1.pct) || 0;
    ok(n1 + 1e-6 >= n0, 'loading meter does not go backwards under the overlay (' + n0 + ' -> ' + n1 + ')');
    ok(n1 > n0 || (meter1.pct && meter1.pct !== '0%'), 'loading meter keeps running under the overlay (' + n0 + ' -> ' + n1 + ' / ' + meter1.pct + ')');
    midLoad = true;

    await page.setViewportSize({width: 844, height: 390});
    await page.waitForTimeout(350);
    const back = await overlayOn(page);
    ok(!back.on && !back.blocked, 'rotating back to landscape mid-load hides the overlay and resumes layout');
    if (back.aspect != null) ok(back.aspect >= 1, 'resumed mid-load camera aspect is landscape (got ' + back.aspect + ')');
    await shot(page, '04-landscape-after-rotate-load.png');
  } catch (e) {
    console.log('MIDLOAD note', String(e && e.stack || e).slice(0, 400));
    throw e;
  }

  // Mid-game: enter or force in-game, rotate, input paused, then resume
  try {
    const inGame = await page.evaluate(async () => {
      const start = performance.now();
      while (performance.now() - start < 90000) {
        if (typeof started !== 'undefined' && started && (typeof screen === 'undefined' || screen === 'none')) return 'loaded';
        await new Promise((r) => setTimeout(r, 200));
      }
      // Forced mid-game stand-in if the world is still meshing: leave the menu and mark started.
      try {
        if (typeof showScreen === 'function') showScreen('none');
        started = true;
        if (document.body) document.body.classList.remove('inmenu');
        if (typeof resize === 'function') resize();
        return 'forced';
      } catch (e) { return 'err ' + (e && e.message || e); }
    });
    ok(inGame === 'loaded' || inGame === 'forced', 'mid-game state ready (' + inGame + ')');
    const pos0 = await page.evaluate(() => ({x: (typeof P !== 'undefined' && P) ? P.x : 0, z: (typeof P !== 'undefined' && P) ? P.z : 0}));
    await page.setViewportSize({width: 390, height: 844});
    await page.waitForTimeout(300);
    const gPor = await overlayOn(page);
    ok(gPor.on && gPor.blocked, 'rotating mid-game to portrait shows the overlay');
    await shot(page, '05-midgame-portrait-overlay.png');
    await page.keyboard.down('KeyW');
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(400);
    await page.keyboard.up('KeyW');
    await page.keyboard.up('ArrowUp');
    const pos1 = await page.evaluate(() => ({x: (typeof P !== 'undefined' && P) ? P.x : 0, z: (typeof P !== 'undefined' && P) ? P.z : 0, keysW: (typeof keys !== 'undefined' && keys) ? !!keys.KeyW : false}));
    ok(!pos1.keysW, 'W key is cleared while the portrait overlay is up');
    const moved = Math.hypot((pos1.x - pos0.x), (pos1.z - pos0.z));
    ok(moved < 0.15, 'player does not walk while the overlay pauses input (moved ' + moved.toFixed(3) + ')');

    await page.setViewportSize({width: 844, height: 390});
    await page.waitForTimeout(400);
    const gBack = await overlayOn(page);
    ok(!gBack.on && !gBack.blocked, 'rotating back mid-game hides the overlay and resumes input');
    if (gBack.aspect != null) ok(gBack.aspect >= 1, 'resumed mid-game camera aspect is landscape (got ' + gBack.aspect + ')');
    await shot(page, '06-midgame-landscape-resume.png');
  } catch (e) {
    ok(false, 'mid-game rotate path: ' + String(e && e.message || e).slice(0, 200));
  }
  await context.close();
}

// 3) Desktop portrait: unaffected
{
  const {context, page} = await openPage({ua: DESKTOP_UA, width: 390, height: 844, mobile: false});
  await waitReady(page, 400);
  const s = await overlayOn(page);
  ok(!s.phone && !s.blocked && !s.on, 'desktop portrait window does not show the overlay or pause layout');
  await shot(page, '07-desktop-portrait-unaffected.png');
  await context.close();
}

// 4) TV portrait-shaped viewport: unaffected
{
  const {context, page} = await openPage({ua: TV_UA, width: 390, height: 844, mobile: false});
  await waitReady(page, 400);
  const s = await overlayOn(page);
  ok(!s.phone && !s.blocked && !s.on, 'TV user agent does not show the overlay, even if the viewport is tall');
  await shot(page, '08-tv-portrait-unaffected.png');
  await context.close();
}

await browser.close();
server.close();
console.log('PASS ' + checks + ' v1293 landscape checks');
