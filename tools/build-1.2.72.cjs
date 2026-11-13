#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function must(cond, msg) { if (!cond) throw new Error(msg); }
function replaceOnce(s, a, b, label) {
  const n = s.split(a).length - 1;
  must(n === 1, (label || a.slice(0, 80)) + ': expected 1 occurrence, got ' + n);
  return s.split(a).join(b);
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const before = html.length;

if (html.includes("const GAME_VERSION = '1.2.71';") && !html.includes("const GAME_VERSION = '1.2.72';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.71';", "const GAME_VERSION = '1.2.72';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.72';"), 'GAME_VERSION is not 1.2.72');

if (!html.includes('<!-- glencraft-build: b1272-v1.2.72 -->')) {
  must(html.includes('<!-- glencraft-build: b1271-v1.2.71 -->'), 'b1271 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1271-v1.2.71 -->',
    '<!-- glencraft-build: b1271-v1.2.71 -->\n<!-- glencraft-build: b1272-v1.2.72 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.72","d":"2026-11-13","notes":["Fix: the pickaxe, torch and bucket no longer repeat their swing, place or use on their own. Those actions only fire while you are actually pressing (a mouse button, a finger on Mine or Place, or a controller trigger). Stuck attack and place-hold flags are cleared when the pointer, the trigger or the window is no longer down, including when pointer lock is lost or a gamepad disappears.","Fix: the \\"world is taking too long to start\\" box, and its request to take a screenshot and send it, is gone. A slow or partial load no longer toasts \\"some parts were skipped — the world is safe\\". The same recovery still runs, and it only logs to the console. Ordinary gameplay toasts (pickups and the like) are unchanged.","First-person hands, grips and animations are left as they are. First-person hands stay hidden in third person, and the gold D-pad is left alone.","Hard-refresh to load this build."]},';
if (!html.includes('"v":"v1.2.72"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.71"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.71"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.72","d":"2026-11-13","notes":\[[\s\S]*?\]\},/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

/* ---- surgical: silence c272 diagnostic modal (local box() closure) ---- */
const BOX_OLD = "  function box(title, txt, w, rebuild) { try { let b = document.getElementById('c272box'); if (b) b.remove(); b = document.createElement('div'); b.id = 'c272box'; U.box++;\n" +
    "    b.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483600;max-width:min(92vw,560px);background:#1c120a;border:2px solid #e0a548;border-radius:12px;padding:14px 16px;color:#f3ead0;font:14px/1.4 system-ui,sans-serif;box-shadow:0 8px 40px #000';\n" +
    "    b.innerHTML = '<b style=\"font-size:16px\"></b><div style=\"margin:8px 0;white-space:pre-wrap;word-break:break-word;font-size:12px;opacity:.9\"></div><div style=\"display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end\"></div>';\n" +
    "    b.children[0].textContent = title; b.children[1].textContent = txt; const row = b.children[2];\n" +
    "    const btn = (t, id, fn) => { const x = document.createElement('button'); x.className = 'btn'; x.textContent = t; x.id = id; x.onclick = fn; row.appendChild(x); };\n" +
    "    /* v1.0.93: no Rebuild world button */\n" +
    "    btn('Close', 'c272close', () => b.remove()); document.body.appendChild(b); } catch (e) { U.err = String(e); } }";
const BOX_NEW = "  function box(title, txt, w, rebuild) { try { U.box++; try { console.info('[glencraft load]', title || '', txt || ''); } catch (_) {} const _b = document.getElementById('c272box'); if (_b) _b.remove(); } catch (e) { U.err = String(e); } }";
if (html.includes("b.id = 'c272box'; U.box++;")) {
  html = replaceOnce(html, BOX_OLD, BOX_NEW, 'c272 box()');
}
must(html.includes("console.info('[glencraft load]', title || '', txt || '')"), 'box() is not silent');
must(!/b\.id = 'c272box'; U\.box\+\+/.test(html), 'c272box is still created in box()');

/* ---- surgical: skipped-parts toast ---- */
const TOAST_OLD = "if (save) toast(window.__loadSafe ? 'Loaded ' + current.name + ' (some parts were skipped - the world is safe)' : 'Welcome back to ' + current.name);";
const TOAST_NEW = "if (save) { if (window.__loadSafe) { try { console.info('[glencraft load]', 'Loaded ' + current.name + ' (some parts were skipped - the world is safe)'); } catch (_) {} } toast('Welcome back to ' + current.name); }";
if (html.includes("some parts were skipped - the world is safe)' : 'Welcome back")) {
  html = replaceOnce(html, TOAST_OLD, TOAST_NEW, 'loadSafe toast');
}
must(html.includes("console.info('[glencraft load]', 'Loaded ' + current.name + ' (some parts were skipped - the world is safe)')"), 'loadSafe log missing');
must(!html.includes("toast(window.__loadSafe ? 'Loaded '"), 'loadSafe still toasts the skipped-parts notice');

/* ---- surgical: other diagnostic recovery toasts ---- */
const SNAG_OLD = "try { toast('That world hit a snag starting - your save is kept safe'); } catch (_) {}";
const SNAG_NEW = "try { console.info('[glencraft load]', 'That world hit a snag starting - your save is kept safe'); } catch (_) {}";
if (html.includes(SNAG_OLD)) {
  html = replaceOnce(html, SNAG_OLD, SNAG_NEW, 'c271 snag toast');
}
must(!html.includes("toast('That world hit a snag starting - your save is kept safe')"), 'snag toast still shown');

const FRESH_OLD = "saveWorld(true); toast('Started a fresh ' + (w.name || 'world') + ' (the old save ' + why + ')');";
const FRESH_NEW = "saveWorld(true); try { console.info('[glencraft load]', 'Started a fresh ' + (w.name || 'world') + ' (the old save ' + why + ')'); } catch (_) {}";
if (html.includes(FRESH_OLD)) {
  html = replaceOnce(html, FRESH_OLD, FRESH_NEW, 'c272 fresh toast');
}
must(!html.includes("toast('Started a fresh ' + (w.name || 'world')"), 'fresh-start toast still shown');

must(html.includes('/* GLX-HANDS1271'), 'HANDS1271 must stay');
must(html.includes('/* GLX-HANDS1270'), 'HANDS1270 must stay');
must(html.includes('/* GLX-EG1269'), 'EG1269 must stay');
must(html.includes('/* GLX-CASTLE1268'), 'CASTLE1268 must stay');
must(html.includes('/* GLX-MOBS1267'), 'MOBS1267 must stay');
must(html.includes('/* GLX-HANDS1266'), 'HANDS1266 must stay');
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay');
must(html.includes("restoredFrom: '1e9db15'"), '1263 restore must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 must stay removed');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');

const files = ['tools/content-source/fix-1272.js'].filter(f => fs.existsSync(path.join(root, f)));
must(files.length === 1, 'fix-1272.js is required');
{
  const bundled = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').trim() + '\n').join('');
  const INJECT_MARK = '/* GLX-FIX1272 (v1.2.72):';
  if (html.includes(INJECT_MARK)) {
    const i = html.indexOf(INJECT_MARK);
    const j = html.indexOf('</script>', i);
    must(j > i, 'cannot find </script> after existing 1272 IIFE');
    html = html.slice(0, i) + bundled + html.slice(j);
  } else {
    const k = html.lastIndexOf('</script>');
    must(k > 0, 'no closing script');
    html = html.slice(0, k) + '\n' + bundled + html.slice(k);
  }
}

must(html.includes("const GAME_VERSION = '1.2.72';"), 'version not bumped');
must(html.includes('"v":"v1.2.72"'), 'patch notes missing');
must(html.includes('GLX-FIX1272'), 'fix 1272 IIFE missing');
must(html.includes('gold D-pad is left alone'), '1272 must record that the gold D-pad is left alone');
must(html.includes('some parts were skipped'), 'recovery still logs the skipped-parts text');
{
  const i = html.indexOf('GLX-FIX1272');
  const next = html.indexOf('\n/* GLX-', i + 10);
  const scr = html.indexOf('</script>', i);
  let end = scr > i ? scr : html.length;
  if (next > i && next < end) end = next;
  const body = html.slice(i, end);
  must(body.includes('attackPad'), '1272 must clear stuck attackPad');
  must(body.includes('pointerlockchange'), '1272 must clear flags on pointer-lock loss');
  must(body.includes('c272box'), '1272 must remove a leftover diagnostic box');
  must(!body.includes("['dU', 'dL', 'dR'].forEach"), '1272 must not touch the gold D-pad');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.72"}\n');
console.log('version.json written');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.72 Actions only on real input, and the load boxes are gone

- Fix: the pickaxe, torch and bucket no longer repeat their swing, place or use on their own. Those actions only fire while you are actually pressing (a mouse button, a finger on Mine or Place, or a controller trigger). Stuck attack and place-hold flags are cleared when the pointer, the trigger or the window is no longer down — including when pointer lock is lost, a gamepad disappears, or an overlay ate the pointer-up.
- Fix: the "world is taking too long to start" box (and its "take a screenshot and send it" request) is gone, and a slow or partial load no longer toasts "some parts were skipped — the world is safe". The same recovery still runs, and it only logs to the console. Ordinary gameplay toasts (pickups and the like) are unchanged.
- First-person hands, grips and animations are left as they are. First-person hands stay hidden in third person. The gold D-pad is left alone.

`;
if (!credits.includes('## v1.2.72')) {
  credits = credits.replace('## v1.2.71 A second sculpt pass', block + '## v1.2.71 A second sculpt pass');
} else {
  const a = credits.indexOf('## v1.2.72');
  const b = credits.indexOf('## v1.2.71', a + 1);
  if (a >= 0 && b > a) credits = credits.slice(0, a) + block + credits.slice(b);
}
fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
console.log('CREDITS.md updated');

console.log('build 1.2.72 done');
