#!/usr/bin/env node
'use strict';
// 1.2.42: keep prism tools/mobs/item icons; restore world block atlas to 1.2.40;
// cap 4K UHD pixel ratio on touch and extend adaptive quality to HIGH+touch.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const out=process.argv[2]||path.join(__dirname,'../index.html');
cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.41.cjs'),out],{stdio:'inherit'});
let s=fs.readFileSync(out,'utf8');
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('Need exactly one hotfix seam: '+a.slice(0,120));s=s.slice(0,i)+b+s.slice(i+a.length);}
function all(a,b){if(!s.includes(a))throw Error('Missing seam: '+a.slice(0,120));s=s.split(a).join(b);}

one("const GAME_VERSION = '1.2.41';","const GAME_VERSION = '1.2.42';");
one('<!-- glencraft-build: b1241-v1.2.41 -->','<!-- glencraft-build: b1242-v1.2.42 -->');
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.42',d:'2026-11-09',notes:[
  'World block tiles, textures and terrain materials are back to exactly how they were in 1.2.40. The prism gleam no longer rewrites the shared block atlas (that was causing slideshow-level lag on entering a world).',
  'Inventory item icons, held tools and listed mobs keep the prism / crystal look. Icons are generated a few at a time after the world is playable and cached — not all at once on the first click.',
  'First-person view now hides the old box / mcArm / gripHand / __fpa arms so only the new scottish-base-v2 arms show (empty hand, held items, after respawn/reload).',
  '4K UHD stays the default label and look, but on touch devices the effective pixel ratio is capped at 1.5 (antialias off, lighter anisotropy) and the adaptive quality / dynamic-resolution guard also runs under 4K UHD.',
  'The slow-load / safe-mode popup and its buttons are gone — loading just continues.',
  '4K UHD stays looking nice but is now adaptive on phones and slower devices: resolution, shadows and view distance scale with measured FPS (no popup).'
]})+',');
one("fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.41'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.41')",
    "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.42'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.42')");

// Cap 4K UHD pixel ratio on touch; keep uncapped-ish desktop 4K (2.5 max).
one(
  "renderer.setPixelRatio(PERF ? Math.max(0.55, Math.min(DPR, 1.5) * 0.7) : HIGH ? DPR : Math.min(DPR, 2));",
  "const __weakBoot1242 = !!(touchMode || /Android|iPhone|iPad|iPod|Mobile/i.test((typeof navigator!=='undefined'&&navigator.userAgent)||'') || ((typeof navigator!=='undefined')&&navigator.hardwareConcurrency>0&&navigator.hardwareConcurrency<=4) || ((typeof navigator!=='undefined')&&navigator.deviceMemory>0&&navigator.deviceMemory<=4));\nrenderer.setPixelRatio(PERF ? Math.max(0.55, Math.min(DPR, 1.5) * 0.7) : HIGH ? Math.min(DPR, __weakBoot1242 ? 1.25 : 2.5) : Math.min(DPR, 2));"
);
one(
  "const renderer = new THREE.WebGLRenderer({canvas, antialias: HIGH && !PERF, powerPreference: 'high-performance'});",
  "const renderer = new THREE.WebGLRenderer({canvas, antialias: HIGH && !PERF && !(touchMode || /Android|iPhone|iPad|Mobile/i.test((typeof navigator!=='undefined'&&navigator.userAgent)||'')), powerPreference: 'high-performance'});"
);
// Anisotropy lighter on touch 4K.
one(
  "const TEXANISO = PERF ? Math.min(2, MAXANISO) : Math.min(HIGH ? 16 : 8, MAXANISO);   // GLX-C30",
  "const TEXANISO = PERF ? Math.min(2, MAXANISO) : Math.min(HIGH ? (touchMode ? 4 : 16) : 8, MAXANISO);   // GLX-C30 / 1.2.42 touch 4K"
);

// Extend phone dyn-res to touch devices even when QUALITY is 4k (label stays 4K UHD).
// Only the c79 dynres PHONE flag (unique comment context).
one(
  "  // ---- phone: dynamic resolution (lower pixel ratio when frames are slow, raise it again when there is headroom) ----\n  const PHONE = touchMode && !HIGH;",
  "  // ---- phone/touch: dynamic resolution (also under 4K UHD label; pixel ratio was uncapped and dynres was off when HIGH) ----\n  const PHONE = !!touchMode;"
);

// Extend the older perfGuard (torch + PR drop) to HIGH+touch as well as Phone quality.
one(
  "    if (QUALITY !== 'phone' || !started || paused || !(dt > 0) || dt > 0.5) return;",
  "    if (!((QUALITY === 'phone') || (HIGH && touchMode)) || !started || paused || !(dt > 0) || dt > 0.5) return;"
);

// Replace embedded prism source with the patched 1.2.42 file (build-1.2.41 embeds the file at build time,
// so re-running after our edit already embeds the new prism — verify marker).

// Remove slow-load / safe-mode popup (timer, dialog, buttons). Loading continues.
one(
  "    let sb = document.getElementById('loadSafeBtn'); if (!sb && host && host.parentNode) { sb = document.createElement('button'); sb.id = 'loadSafeBtn'; sb.textContent = 'Load safe mode'; sb.style.cssText = 'display:none;margin:10px auto 0;padding:8px 16px;font:600 14px system-ui,sans-serif;border-radius:10px';\n      sb.onclick = () => { try { localStorage.setItem('glen_safe', current.id); } catch (_) {} location.reload(); }; host.parentNode.insertBefore(sb, el ? el.nextSibling : host.nextSibling); }\n    if (sb) { sb.style.display = 'none'; clearTimeout(enterWorld._sbT); enterWorld._sbT = setTimeout(() => { if (screen === 'loading') sb.style.display = 'block'; }, 15000); }\n  } catch (_) {}\n  window.__loadErrTxt = ''; loadStep('start' + (window.__safeLoad ? ' (safe mode)' : ''));",
  "    try { const sb = document.getElementById('loadSafeBtn'); if (sb && sb.parentNode) sb.parentNode.removeChild(sb); } catch (_) {}\n    try { clearTimeout(enterWorld._sbT); } catch (_) {}\n  } catch (_) {}\n  window.__loadErrTxt = ''; loadStep('start');"
);
one(
  "  function openSafe(id) {\n    window.__safeLoad = true;\n    const go = () => { const w = (worldList() || []).find(q => q && q.id === id) || (worldList() || [])[0]; if (!w) { toast('No world to open'); return; } playWorld(w); };\n    const wait = setInterval(() => { if (screen === 'title' || screen === 'worlds') { clearInterval(wait); Promise.race([worldsReady, new Promise(r => setTimeout(r, 6000))]).then(go, go); } }, 300);\n  }\n  S.openSafe = openSafe;",
  "  function openSafe(id) {\n    try { localStorage.removeItem('glen_safe'); } catch (_) {}\n  }\n  S.openSafe = openSafe;"
);
one(
  "  let safeId = null; try { safeId = localStorage.getItem('glen_safe'); localStorage.removeItem('glen_safe'); } catch (_) {}\n  if (safeId) { openSafe(safeId); return; }\n  // the last load never finished (page froze or was closed on the loading screen): offer safe mode on the title screen\n  let ld = null; try { ld = JSON.parse(localStorage.getItem('glen_load') || 'null'); } catch (_) {}\n  if (ld && ld.id && Date.now() - (ld.hb || ld.t || 0) > 5000) {\n    S.lastLoad = ld;\n    const show = () => {\n      if (document.getElementById('c99note')) return;\n      const el = document.createElement('div'); el.id = 'c99note';\n      el.style.cssText = 'position:fixed;left:50%;top:10%;transform:translateX(-50%);z-index:70;max-width:min(520px,92vw);background:rgba(20,28,22,.95);color:#f3ead2;border:2px solid #d9b45a;border-radius:14px;padding:14px 18px;font:15px/1.4 system-ui,sans-serif;text-align:center';\n      const esc = t => String(t || '').replace(/[&<>\"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;'}[c]));\n      el.innerHTML = '<b>' + esc(ld.name || 'Your world') + ' did not finish loading last time</b><br><small>stuck at: ' + esc(ld.step) + ' (' + esc(ld.v) + ')</small><br>' +\n        '<button id=\"c99safe\" style=\"margin:10px 6px 0;padding:8px 14px;font:600 14px system-ui\">Open in safe mode</button><button id=\"c99no\" style=\"margin:10px 6px 0;padding:8px 14px;font:14px system-ui\">Dismiss</button>';\n      document.body.appendChild(el);\n      document.getElementById('c99safe').onclick = () => { el.remove(); try { localStorage.removeItem('glen_load'); } catch (_) {} openSafe(ld.id); };\n      document.getElementById('c99no').onclick = () => { el.remove(); try { localStorage.removeItem('glen_load'); } catch (_) {} };\n    };\n    const w = setInterval(() => { if (screen === 'title') { clearInterval(w); show(); } }, 400);\n  }",
  "  try { localStorage.removeItem('glen_safe'); } catch (_) {}\n  try { const note = document.getElementById('c99note'); if (note) note.remove(); } catch (_) {}\n  S.safeModeUiRemoved = 1;\n  try { const ld = JSON.parse(localStorage.getItem('glen_load') || 'null'); if (ld && ld.id && Date.now() - (ld.hb || ld.t || 0) > 5000) { S.lastLoad = ld; localStorage.removeItem('glen_load'); } } catch (_) {}"
);
one(
  "  // in safe mode the extras that run on top of the world stay off for this session\n  const tg = setInterval(() => { if (window.__safeLoad && started) { clearInterval(tg); setTimeout(() => toast('Safe mode: bots and castle doors were reset, your land, inventory and chests are kept'), 1500); } }, 500);\n})();",
  "  S.openSafe = function () { try { localStorage.removeItem('glen_safe'); } catch (_) {} };\n})();"
);

const adapt=fs.readFileSync(path.join(__dirname,'visuals-source/adaptive-4k-1242.js'),'utf8');
if (!s.includes('__adapt4k1242')) {
  const mark='U.worldTilesUntouched = 1;';
  const i=s.lastIndexOf(mark);
  if (i<0) throw Error('missing worldTilesUntouched for adaptive inject');
  const j=s.indexOf('</script>', i);
  if (j<0) throw Error('missing script end for adaptive inject');
  s=s.slice(0,j)+'\n'+adapt+'\n'+s.slice(j);
}
if (!s.includes('worldTilesUntouched')) {
  throw new Error('Built index is missing 1.2.42 worldTilesUntouched marker — prism source not embedded');
}
if (s.includes('texCache[key].needsUpdate = true') && s.includes('U.prismTile(src, key)')) {
  // old restyleTexKey body must not remain
  const i = s.indexOf('function restyleTexKey');
  const slice = s.slice(i, i+200);
  if (slice.includes('prismTile')) throw new Error('old restyleTexKey still mutates tiles');
}

fs.writeFileSync(out,s);
fs.writeFileSync(path.join(path.dirname(path.resolve(out)),'version.json'),JSON.stringify({v:'1.2.42'})+'\n');
console.log('Built 1.2.42 block-atlas revert + touch 4K cap: '+out);
