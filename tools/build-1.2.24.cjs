#!/usr/bin/env node
'use strict';
// v1.2.24 (local candidate, unpublished) on top of v1.2.23: stability. Usage: node tools/build-1.2.24.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1224-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.23.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
// time box screen: the picture plane sat exactly on the front face of its brown frame box (both at z 0.035), so they z-fought and the
// screen flashed brown squares; the plane now sits 4 mm in front and wins the depth test
one("scr.position.z = 0.035; g.add(scr);","scr.position.z = 0.039; sm.polygonOffset = true; sm.polygonOffsetFactor = -1; sm.polygonOffsetUnits = -2; g.add(scr); /* v1.2.24: off the frame face (it z-fought, flashing brown) */");
one('/* GLX-GRIP1222',fs.readFileSync(path.join(__dirname,'content-source','foliage-1224.js'),'utf8')+'\n/* GLX-GRIP1222');
one("const GAME_VERSION = '1.2.23';","const GAME_VERSION = '1.2.24';");
one('<!-- glencraft-build: b1223-v1.2.23 -->','<!-- glencraft-build: b1224-v1.2.24 -->');
// time box room ceiling: walls() held you inside the round room sideways and above the floor but had no top, so a jetpack or creative
// flight carried you up through the 8.8 high room and out of the box (then you fell back in). Now the head stops under the ceiling.
one("if (P.y < S.y) { P.y = S.y; if (P.vy < 0) P.vy = 0; } return; }","if (P.y < S.y) { P.y = S.y; if (P.vy < 0) P.vy = 0; } if (P.y > S.y + (T.RH || 8.8) - 1.8) { P.y = S.y + (T.RH || 8.8) - 1.8; if (P.vy > 0) P.vy = 0; } return; }   /* v1.2.24: room ceiling */");
// space is silent (user: nature sounds in deep space): one vacuum test, used by each nature sound owner
one('/* GLX-GRIP1222',fs.readFileSync(path.join(__dirname,'content-source','vac-1224.js'),'utf8')+'\n/* GLX-GRIP1222');
one("const outdoor = dim && !U.enc ? 1","const outdoor = (window.__vac && __vac()) ? 0 : dim && !U.enc ? 1");
one("function duck() { try { if (window.__c259 && __c259.on) return 0;","function duck() { try { if (window.__vac && __vac()) return 0; if (window.__c259 && __c259.on) return 0;");
one("const w = hid || pz ? 0 : U.RB_LEVEL;","const w = hid || pz || (window.__vac && __vac()) ? 0 : U.RB_LEVEL;");
one("U.thunder = vol => { if (!U.bus()","U.thunder = vol => { if (window.__vac && __vac()) { U.vacSkip = (U.vacSkip || 0) + 1; return true; } if (!U.bus()");
one("h.gain.setTargetAtTime(tgt, AC.currentTime, 0.6);","h.gain.setTargetAtTime((window.__vac && __vac()) ? 0 : tgt, AC.currentTime, 0.6);");
// old north extension off in the flat UK world (ghost ice north of the old map edge)
one('/* GLX-GRIP1222',fs.readFileSync(path.join(__dirname,'content-source','leg-1224.js'),'utf8')+'\n/* GLX-GRIP1222');
fs.writeFileSync(out,s);
