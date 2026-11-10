// SwiftShader headless WebGL captures of a pig GLB (close-up studio + grassy shot).
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
const ADDONS = '/workspace/glencraft-anatomy-tools/node_modules/three/examples/jsm';
const OUT = process.argv[2] || '/workspace/qa/phase3/pig/before';
const MODEL = process.argv[3] || '/assets/models/pig2.glb';
const TEX = process.argv[4] !== undefined ? process.argv[4] : '/assets/tex/pig2_2k.webp';
fs.mkdirSync(OUT, {recursive: true});

const MIME = {
  '.html':'text/html', '.js':'application/javascript', '.mjs':'application/javascript',
  '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg',
  '.webp':'image/webp', '.glb':'model/gltf-binary', '.svg':'image/svg+xml'
};
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/') u = '/preview-pig.html';
  let fp;
  if (u.startsWith('/three-addons/')) fp = path.join(ADDONS, u.slice('/three-addons/'.length));
  else if (u.startsWith('/three/')) fp = path.join(THREE_DIR, u.slice('/three/'.length));
  else if (u.startsWith('/assets/')) fp = path.join(ROOT, u);
  else if (u.startsWith('/baked/')) fp = path.join(HERE, 'baked', path.basename(u));
  else fp = path.join(HERE, path.basename(u));
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found '+u); return; }
    res.writeHead(200, {'content-type': MIME[path.extname(fp)] || 'application/octet-stream', 'cache-control':'no-store'});
    res.end(data);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
console.log('studio serving', port);

const q = new URLSearchParams({
  model: MODEL,
  tex: TEX,
  w: '1280',
  h: '720',
  scale: process.argv[5] || '1', face: process.argv[6] || 'z'
});
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
const page = await browser.newPage({viewport: {width: 1280, height: 720}, deviceScaleFactor: 1});
page.on('pageerror', e => console.log('pageerror', e.message));
page.on('console', m => console.log('console', m.text().slice(0, 400)));
await page.goto('http://127.0.0.1:' + port + '/preview-pig.html?' + q.toString(), {waitUntil: 'domcontentloaded', timeout: 60000});
await page.waitForFunction(() => !!(window.__qa && window.__qa.ready), {timeout: 45000});
const info = await page.evaluate(() => window.__qa.info());
console.log('info', JSON.stringify(info));
fs.writeFileSync(path.join(OUT, 'info.json'), JSON.stringify(info, null, 2));

const shots = [
  {clip: '', t: 0, cam: 'close', back: 'studio', name: 'close.png'},
  {clip: '', t: 0, cam: 'threeq', back: 'studio', name: 'threeq.png'},
  {clip: '', t: 0, cam: 'front', back: 'studio', name: 'front.png'},
  {clip: '', t: 0, cam: 'portrait', back: 'studio', name: 'portrait.png'},
  {clip: '', t: 0, cam: 'side', back: 'studio', name: 'side.png'},
  {clip: 'walk', t: 0.2, cam: 'threeq', back: 'studio', name: 'walk-a.png'},
  {clip: 'walk', t: 0.55, cam: 'threeq', back: 'studio', name: 'walk-b.png'},
  {clip: '', t: 0, cam: 'world', back: 'world', name: 'grassy.png'},
];
for (const s of shots) {
  await page.evaluate(({clip, t, cam, back}) => window.__qa.pose(clip, t, cam, back), s);
  await page.waitForTimeout(60);
  const buf = Buffer.from((await page.evaluate(() => window.__qa.capture())).split(',')[1], 'base64');
  const fp = path.join(OUT, s.name);
  fs.writeFileSync(fp, buf);
  console.log('wrote', fp, buf.length);
}
await browser.close();
server.close();
console.log('studio done');
