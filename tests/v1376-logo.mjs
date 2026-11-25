// v1376: the chunky gold logo is in the page from the first paint; flag restores the old wordmark.
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
const root = process.env.GC_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const headStart = html.slice(0, 4000);
const iifeFrom = html.indexOf('<script id="glx-logo1376">');
const src = iifeFrom >= 0 ? html.slice(iifeFrom, html.indexOf('</script>', iifeFrom) + 9) : '';
let n = 0, fail = 0;
const ok = (c, m) => { n++; if (!c) { fail++; console.log('FAIL', m); } };

ok(headStart.includes('id="logo1376-early"'), 'early CSS is in the first 4k of the file');
ok(headStart.includes('rel="preload"') && headStart.includes('assets/ui/logo-glencraft-blocky-gold.webp'), 'logo is preloaded at the top of the head');
ok(headStart.includes('assets/ui/favicon-32.png') && headStart.includes('assets/ui/favicon-16.png'), 'favicon links use the new gold logo icons');
ok(headStart.includes('rel="apple-touch-icon"') && headStart.includes('assets/ui/apple-touch-icon.png'), 'apple-touch-icon uses the new logo');
ok(headStart.includes('rel="manifest"') && headStart.includes('site.webmanifest'), 'web manifest is linked');
ok(headStart.includes('property="og:image"') && headStart.includes('assets/ui/og-image.jpg'), 'og:image uses the new logo');
ok(headStart.includes('twitter:image'), 'twitter:image is set');
ok(headStart.includes('html:not(.noLogo1376) .glogo>svg'), 'early CSS hides the old SVG wordmark unless the flag is on');
ok(headStart.includes('if(window.__noLogo1376)'), 'tiny early script honours __noLogo1376');

ok((html.match(/class="glogo v1313has"/g) || []).length === 3, 'all three glogo blocks have the new logo class');
ok((html.match(/src="assets\/ui\/logo-glencraft-blocky-gold\.webp"/g) || []).length >= 5, 'webp logo is in boot, title, loading, start and pause');
ok((html.match(/viewBox="22 22 636 190"/g) || []).length === 3, 'old SVG wordmarks are still in the file');
ok(html.includes('<h1 class="v1313old">Glencraft</h1>'), 'start-screen heading is kept and marked old');
ok(html.includes('img class="v1313logo v1313start"'), 'start screen has the new logo image');
ok(html.includes('img class="v1313logo v1313pause"'), 'pause title has the new logo image');

ok(html.includes('<script id="glx-logo1376">') && html.includes('GLX-LOGO1376'), 'LOGO1376 IIFE is in the page');
ok(src.includes('window.__noLogo1376') || src.includes('WIN.__noLogo1376'), 'flag __noLogo1376 restores the old wordmark');
ok(src.includes('noLogo1376') && src.includes('classList.add'), 'flag adds the restore class');
ok(!/food|hunger|drumstick|\beat\b/i.test(src) && !/food|hunger|drumstick|\beat\b/i.test(headStart), 'patch has no food words');

ok(html.includes('__fpa') && html.includes('__noPhand1360') && html.includes('__noCave1366') && html.includes('__noG1367') && html.includes('__noMap1367') && html.includes('__noSky1371'), 'keeps existing feature flags');
ok(html.includes('GLX-V1313UI') && html.includes("const LOGO = 'assets/ui/logo-glencraft-blocky-gold.webp'"), '1.2.112 logo IIFE is still present');

const assets = [
  'assets/ui/logo-glencraft-blocky-gold.webp',
  'assets/ui/favicon-16.png',
  'assets/ui/favicon-32.png',
  'assets/ui/favicon-grass-block.svg',
  'assets/ui/apple-touch-icon.png',
  'assets/ui/icon-192.png',
  'assets/ui/icon-512.png',
  'assets/ui/og-image.jpg',
  'site.webmanifest',
];
for (const a of assets) ok(existsSync(join(root, a)), a + ' exists');

const man = JSON.parse(readFileSync(join(root, 'site.webmanifest'), 'utf8'));
ok(man.short_name === 'Glencraft' && man.icons.some(i => i.src.includes('icon-192')), 'manifest names the game and the new icons');

// preload and favicon must appear before the huge stylesheet (first 800 bytes is ideal)
const favPos = html.indexOf('assets/ui/favicon-32.png');
const stylePos = html.indexOf('<style>\n:root{');
ok(favPos >= 0 && (stylePos < 0 || favPos < stylePos), 'favicon is linked before the main stylesheet');
ok(html.indexOf('logo-glencraft-blocky-gold.webp') < 800, 'logo preload is in the first 800 bytes');

if (fail) { console.log('v1376-logo FAIL', fail + '/' + n); process.exit(1); }
console.log('v1376-logo ok', n);
