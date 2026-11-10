// Real WebGL captures of the popstar model via SwiftShader headless Chromium.
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire('/home/box/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/package.json');
const {chromium} = require('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const THREE_DIR = '/workspace/glencraft-anatomy-tools/node_modules/three/build';
const OUT = process.argv[2] || '/workspace/qa/meme-mob/webgl';
fs.mkdirSync(OUT, {recursive: true});

const MIME = {
  '.html':'text/html', '.js':'application/javascript', '.mjs':'application/javascript',
  '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg',
  '.glb':'model/gltf-binary', '.ogg':'audio/ogg', '.mp3':'audio/mpeg'
};
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/') u = '/preview.html';
  let fp;
  if (u.startsWith('/three/')) fp = path.join(THREE_DIR, u.slice(7));
  else if (u.startsWith('/assets/')) fp = path.join(ROOT, u);
  else fp = path.join(HERE, path.basename(u));
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found '+u); return; }
    res.writeHead(200, {'content-type': MIME[path.extname(fp)] || 'application/octet-stream', 'cache-control':'no-store'});
    res.end(data);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
console.log('serving preview on', port);

async function shoot(viewport, namePrefix, shots) {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--disable-web-security',
    ]
  });
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('pageerror', e.message));
  page.on('console', m => { const t=m.text(); if (/popstar|error|Error|WebGL/i.test(t)) console.log('console', t.slice(0,300)); });
  await page.goto('http://127.0.0.1:' + port + '/preview.html?w=' + viewport.width + '&h=' + viewport.height, {waitUntil: 'domcontentloaded', timeout: 60000});
  await page.waitForFunction(() => !!(window.__qa && window.__qa.holdPose), {timeout: 30000});
  for (const shot of shots) {
    if (shot.hold) {
      const t = await page.evaluate(({id, mid, cam}) => window.__qa.holdPose(id, mid, cam), {id: shot.hold, mid: true, cam: shot.cam});
      console.log(namePrefix, shot.name, 't=', t);
    } else if (shot.t != null) {
      await page.evaluate(({t, cam}) => window.__qa.pose(t, cam), {t: shot.t, cam: shot.cam});
    }
    await page.waitForTimeout(80);
    const buf = Buffer.from((await page.evaluate(() => window.__qa.capture())).split(',')[1], 'base64');
    const fp = path.join(OUT, shot.name);
    fs.writeFileSync(fp, buf);
    console.log('wrote', fp, buf.length);
  }
  await browser.close();
}

const portrait = {width: 412, height: 915};
const wide = {width: 1280, height: 720};
const QUICK = process.argv.includes('quick');
if (QUICK) {
  await shoot(portrait, 'portrait', [
    {hold: 2, cam: 'close', name: 'pose2-close.png'},
    {hold: 2, cam: 'side', name: 'pose2-side.png'},
    {hold: 2, cam: 'portrait', name: 'pose2-portrait.png'},
  ]);
  server.close();
  console.log('done quick');
  process.exit(0);
}
await shoot(portrait, 'portrait', [
  {hold: 1, cam: 'portrait', name: 'pose1-portrait.png'},
  {hold: 2, cam: 'portrait', name: 'pose2-portrait.png'},
  {hold: 3, cam: 'portrait', name: 'pose3-portrait.png'},
  {hold: 4, cam: 'portrait', name: 'pose4-portrait.png'},
  {hold: 2, cam: 'close', name: 'pose2-close.png'},
  {hold: 4, cam: 'close', name: 'pose4-close.png'},
  {hold: 2, cam: 'side', name: 'pose2-side.png'},
  {hold: 1, cam: 'up', name: 'pose1-up.png'},
  {hold: 2, cam: 'up', name: 'pose2-up.png'},
  {hold: 3, cam: 'up', name: 'pose3-up.png'},
  {hold: 4, cam: 'up', name: 'pose4-up.png'},
  {hold: 2, cam: 'upclose', name: 'pose2-upclose.png'},
  {hold: 4, cam: 'upclose', name: 'pose4-upclose.png'},
  {hold: 1, cam: 'close', name: 'pose1-close.png'},
  {hold: 3, cam: 'close', name: 'pose3-close.png'},
]);
await shoot(wide, 'wide', [
  {hold: 1, cam: 'wide', name: 'pose1-wide.png'},
  {hold: 2, cam: 'wide', name: 'pose2-wide.png'},
  {hold: 4, cam: 'wide', name: 'pose4-wide.png'},
  {hold: 2, cam: 'portrait', name: 'pose2-wide-full.png'},
]);
server.close();
console.log('done');
