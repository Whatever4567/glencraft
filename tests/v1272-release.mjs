// 1.2.72: actions only on real input; load-watchdog and skipped-parts popups are gone.
// Targeted static checks (no full OR-chain of prior release tests).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = process.argv[2] || path.join(root, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = fs.readFileSync(path.join(root, 'version.json'), 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes("const GAME_VERSION = '1.2.72';") || html.includes("const GAME_VERSION = '1.2.71';"), 'GAME_VERSION is 1.2.72 (or 1.2.71)');
ok(/"v"\s*:\s*"1\.2\.72"/.test(ver) || /"v"\s*:\s*"1\.2\.71"/.test(ver), 'version.json is 1.2.72 (or 1.2.71)');
ok(html.includes('<!-- glencraft-build: b1272-v1.2.72 -->') || html.includes('<!-- glencraft-build: b1271-v1.2.71 -->'), 'build marker present');

if (html.includes("const GAME_VERSION = '1.2.72';")) {
  ok(html.includes('<!-- glencraft-build: b1272-v1.2.72 -->'), 'b1272 marker');
  ok(html.includes('"v":"v1.2.72"'), 'PATCH_NOTES for 1.2.72');
  ok(credits.includes('## v1.2.72'), 'CREDITS has 1.2.72');
  ok(html.includes('/* GLX-FIX1272'), 'FIX1272 IIFE is injected');

  const i = html.indexOf('/* GLX-FIX1272');
  const next = html.indexOf('\n/* GLX-', i + 10);
  const scr = html.indexOf('</script>', i);
  let end = scr > i ? scr : html.length;
  if (next > i && next < end) end = next;
  const body = html.slice(i, end);
  ok(body.includes('pointerlockchange'), '1272 clears flags when pointer lock is lost');
  ok(body.includes('attackPad'), '1272 clears a stuck attackPad');
  ok(body.includes('readPad'), '1272 wraps readPad');
  ok(body.includes('c272box'), '1272 removes leftover diagnostic boxes');
  ok(body.includes('some parts were skipped'), '1272 filters the skipped-parts toast');
  ok(!body.includes("['dU', 'dL', 'dR'].forEach"), '1272 does not touch the gold D-pad');

  // box() itself no longer builds a modal
  const boxStart = html.indexOf('function box(title, txt, w, rebuild)');
  ok(boxStart > 0, 'c272 box() is present');
  const boxEnd = html.indexOf('U.box = box', boxStart);
  const boxFn = html.slice(boxStart, boxEnd > boxStart ? boxEnd : boxStart + 800);
  ok(boxFn.includes("console.info('[glencraft load]'"), 'box() logs to the console');
  ok(!boxFn.includes("b.id = 'c272box'"), 'box() does not create #c272box');
  ok(!boxFn.includes('document.body.appendChild(b)'), 'box() does not append a modal');
  ok(!boxFn.includes('Take a screenshot'), 'box() does not ask for a screenshot');

  ok(!html.includes("toast(window.__loadSafe ? 'Loaded '"), 'loadSafe does not toast the skipped-parts notice');
  ok(html.includes("console.info('[glencraft load]', 'Loaded ' + current.name + ' (some parts were skipped - the world is safe)')"), 'loadSafe still logs the skipped-parts text');
  ok(html.includes("toast('Welcome back to ' + current.name)"), 'successful load still uses the normal welcome toast');
  ok(!html.includes("toast('That world hit a snag starting"), 'snag notice is not a toast');
  ok(html.includes("console.info('[glencraft load]', 'That world hit a snag starting"), 'snag notice is logged');
  ok(!html.includes("toast('Started a fresh ' + (w.name || 'world')"), 'fresh-start recovery is not a toast');
  ok(html.includes("console.info('[glencraft load]', 'Started a fresh '"), 'fresh-start recovery is logged');

  // 15s watchdog still runs (recovery), it just calls the silent box()
  ok(html.includes("box('The world is taking too long to start'"), '15s watchdog still invokes box() (now silent)');
  ok(html.includes("errTxt() + '\\nTake a screenshot of this box and send it.'"), 'watchdog still gathers the diagnostic text for the console');
}

// prior hands / gold D-pad / 1.2.71 stay intact
ok(html.includes('/* GLX-HANDS1271'), 'HANDS1271 stays');
ok(html.includes('/* GLX-HANDS1270'), 'HANDS1270 stays');
ok(html.includes('/* GLX-HANDS1266'), 'HANDS1266 stays');
ok(html.includes('/* GLX-HANDS1263'), 'HANDS1263 stays');
ok(html.includes("restoredFrom: '1e9db15'"), '1263 restore stays');
ok(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 stays removed');
ok(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad is not hidden by a forEach over dU/dL/dR');
ok(html.includes('id="dU"') || html.includes("id='dU'") || html.includes('id: \'dU\'') || /id=["']dU["']/.test(html) || html.includes("('dU')") || html.includes('#dU'), 'D-pad #dU is still in the page');

console.log('PASS ' + n + ' v1272-release checks');
