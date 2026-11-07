#!/usr/bin/env node
'use strict';
// v1.2.20: lighter water on top of v1.2.19. Usage: node tools/build-1.2.20.cjs out.html
// (1) ripple shader: every water pixel looped over all 8 (4 on phones) ripple slots each frame even when none was alive.
//     A uniform u41End (latest ripple end time) now skips the whole loop when no ripple is alive (same for all pixels, so no divergence).
//     Inside the loop a ring further than its own reach (k > 1.2, contribution below e^-31) is skipped before the exp math.
// (2) sky shine: pow(x, 3.0) replaced with x*x*x (same value).
// (3) flSet marked the same chunk dirty twice (markDirty(x,z) then again if y > 0); the duplicate call is removed (dirty set, same result).
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1220-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.19.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("u41Rip: {value: RIP}};","u41Rip: {value: RIP}, u41End: {value: -1}};");
one("r.set(x, z, u.u41T.value, a); U.rips++; };","r.set(x, z, u.u41T.value, a); u.u41End.value = u.u41T.value + 2.6; U.rips++; };");
one("f = 'uniform float u41T; uniform vec4 u41Rip['","f = 'uniform float u41T; uniform float u41End; uniform vec4 u41Rip['");
one(" { float rr = 0.0; for (int i = 0; i < ${NR}; i++) { vec4 q = u41Rip[i]; float age = u41T - q.z; if (age < 0.0 || age > 2.6) continue; float d = distance(v41W.xz, q.xy);\n     float k = d - age * 1.5; rr +="," if (u41T < u41End) { float rr = 0.0; for (int i = 0; i < ${NR}; i++) { vec4 q = u41Rip[i]; float age = u41T - q.z; if (age < 0.0 || age > 2.6) continue; float d = distance(v41W.xz, q.xy);\n     float k = d - age * 1.5; if (k > 1.2) continue; rr +=");
one("float fr = pow(1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0), 3.0);","float fr0 = 1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0), fr = fr0 * fr0 * fr0;");
one("markDirty(x, z); if (y > 0) markDirty(x, z); flQueue(x, y, z); }","markDirty(x, z); flQueue(x, y, z); }");
// t907u: (a) item id tag in slot icons for hover names, (b) hell biome name pop up removed, (c) new world first save waits 4 s after entry
one("function slotHTML(id, n) { return id ? '<div class=\"ic' + iconClass(id) + '\" style=","function slotHTML(id, n) { return id ? '<div data-gid=\"' + id + '\" class=\"ic' + iconClass(id) + '\" style=");
one("if (bi >= 0) toast(C.BIOME[bi]);","");
one("if (!save) saveWorld(true);","if (!save) { const cw = current; setTimeout(() => { try { if (started && current === cw) saveWorld(true); } catch (_) {} }, 4000); }");
s=s.replace('/* GLX-C400',fs.readFileSync(path.join(__dirname,'content-source','quiet-1220.js'),'utf8')+'\n/* GLX-C400');
one('<!-- glencraft-build: b1219-v1.2.19 -->','<!-- glencraft-build: b1220-v1.2.20 -->');
one("const GAME_VERSION = '1.2.19';","const GAME_VERSION = '1.2.20';");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.20',d:'2026-11-07',notes:['Lighter water: the ripple rings are only worked out while a ripple is actually spreading, rings skip water they cannot reach, and flowing water no longer asks for the same rebuild twice. Waves, flow, foam, shine and splashes look the same.','Fewer pop ups: the welcome, tip, weather and biome messages that appeared on their own are gone. Messages about what you just did, warnings and save problems still show.','Hover over any item in your inventory, a chest, creative tabs or the hotbar to see its name straight away.','Entering a brand new world no longer saves the whole world in the same moment you arrive; the first save follows a few seconds later.']})+',');
fs.writeFileSync(out,s);console.log(crypto.createHash('sha256').update(s).digest('hex'));
