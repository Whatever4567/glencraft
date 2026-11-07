#!/usr/bin/env node
'use strict';
// v1.2.5 batch1 on top of the v1.2.4 rollback build: castle decor props removed, held-item scale fix, map old arm off.
// Usage: node tools/build-1.2.5.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b125-')),f=path.join(dir,'b.html');
let s;try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-rollback-1.2.4.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
// 1) Overworld castle decor props (GLX-C150: banners, chandeliers, fires, braziers, tables/tableware, cages...). Castle blocks, doors,
//    chests, torches and Hell builds (GLX-C167 props) are untouched. New castle generation keeps no props; saved c150p records are
//    discarded on load so nothing is meshed; with no props the C150 tick drops+disposes groups and then returns at once.
one('U.ms = Math.round(performance.now() - t0); U.st.props = window.__c150.props.length; }',
    'window.__c150.props = []; /* v1.2.5: castle decor removed */ U.ms = Math.round(performance.now() - t0); U.st.props = 0; }');
one('U.props = (d.c150p || []).map(', 'U.props = [/* v1.2.5: saved castle decor (d.c150p) discarded */].map(');
// save passthrough must not resurrect the discarded c150p records
one("for(const k in src)if(!(k in d))d[k]=src[k];","for(const k in src)if(!(k in d)&&k!=='c150p')d[k]=src[k];");
// 2) Held items shrinking: hand.scale is only ever written by the gun viewmodel and was never put back, and new guns measured
//    their base scale through the already-shrunk hand, compounding. Keep an immutable bind scale and measure/restore against it.
one("  const U = window.__vm = {err: null, on: 0, k: 0, pre: 0, hidden: 0};",
    "  const U = window.__vm = {err: null, on: 0, k: 0, pre: 0, hidden: 0};\n  const HS0 = Object.freeze(hand.scale.clone()); U.HS0 = HS0;   /* v1.2.5: immutable bind scale of the hand */\n  const restoreHS = () => { if (hand.scale.x !== HS0.x || hand.scale.y !== HS0.y || hand.scale.z !== HS0.z) hand.scale.copy(HS0); };");
one("  function step(d) { const g = gun(); U.on = 0; if (!g || tp() || !hand.visible) { ready = null; return; }",
    "  function step(d) { const g = gun(); U.on = 0; if (!g || tp() || !hand.visible) { ready = null; restoreHS(); return; }");
one("    if (!u.__s0Base) { const s0 = Math.abs(sc.x * (hand.scale.x || 1)); if (s0 > 0.05 && s0 < 20) u.__s0Base = s0; }",
    "    if (!u.__s0Base) { const s0 = Math.abs(sc.x * (HS0.x || 1)); if (s0 > 0.05 && s0 < 20) u.__s0Base = s0; }");
// 3) Map: the legacy block fist/arm/sleeve drawn on the map corner is hidden; the map and the new HD hand stay.
one("fists[1].visible = s === 1; fists[-1].visible = s === -1;","fists[1].visible = false; fists[-1].visible = false; /* v1.2.5: old map arm off */");
// version
one("<!-- glencraft-build: b1204-v1.2.4 -->","<!-- glencraft-build: b1205-v1.2.5 -->");
one("const GAME_VERSION = '1.2.4';","const GAME_VERSION = '1.2.5';");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.5',d:'2026-11-07',notes:['Castles: decorative props (banners, chandeliers, fake fires, braziers, tables and tableware and similar) removed for performance. Walls, doors, chests and torches stay.','Fix: held items no longer shrink after holding a gun.','Fix: holding the map no longer shows the old blocky arm.']})+',');
fs.writeFileSync(out,s);console.log(sha(s));
