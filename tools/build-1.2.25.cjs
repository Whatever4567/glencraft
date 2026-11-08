#!/usr/bin/env node
'use strict';
// v1.2.25 (local candidate, unpublished) on top of v1.2.24: time box repairs. Usage: node tools/build-1.2.25.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1225-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.24.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("const GAME_VERSION = '1.2.24';","const GAME_VERSION = '1.2.25';");
one('<!-- glencraft-build: b1224-v1.2.24 -->','<!-- glencraft-build: b1225-v1.2.25 -->');
// GLX-CAB1221 hands on the stick: they were put on the T bar using the room's world matrix from the PREVIOUS frame (the room scene is only
// moved to the box, and its matrices updated, when it is drawn after the main scene). So while flying both hands and arms trailed the
// stick by one frame of box movement (speed x frame time: 0.23 m at 14 blocks/s and 60 fps, metres at cruise speed or low fps).
// The room is now moved to the box and its matrices (with the stick lean) brought up to date first.
one("function place(on) { if (!built) build(); if (!built) return; for (let i = 0; i < 2; i++) { H[i].visible = A[i][0].visible = on; } if (!on) return;\n    bar.updateMatrixWorld(true);",
    "function place(on) { if (!built) build(); if (!built) return; for (let i = 0; i < 2; i++) { H[i].visible = A[i][0].visible = on; } if (!on) return;\n    { const rm = T.parts && T.parts.room; if (rm && T.S) { rm.position.set(T.S.x, T.S.y, T.S.z); rm.updateMatrixWorld(true); } else bar.updateMatrixWorld(true); }   /* v1.2.25: this frame's room, not last frame's */");
// GLX-UKB: the barrier clamped the PLAYER every frame after the flight step. The time box is bigger on the inside: the pilot seat sits 6.35
// blocks north of the box itself, so flying north to the edge put the seat past the line while the box was still allowed on, and the player
// was pushed off the seat towards the door (6.35 to 6.84 blocks) every frame, and right out of the door when the box stopped within 0.65 of the
// line. Inside the time box the room keeps you in, and the box itself is already stopped at the barrier by the flight code (__ukb.wall).
one("try { if (live() && started && band(P.y)) { const w = window.__c321","try { if (live() && started && band(P.y) && !(window.__tbox && __tbox.inside && __tbox.S && __tbox.S.on)) { const w = window.__c321");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({"v": "v1.2.25", "d": "2026-11-08", "notes": ["Time box: both hands and arms stay on the pilot stick while you fly. Before, they were placed where the stick was one frame earlier, so the faster you flew the further they trailed behind it.", "Time box: flying up to the north edge of the UK no longer shoves you off the pilot seat towards the door. The seat sits well inside the bigger room, and the edge barrier was pushing you instead of stopping only the box."]})+',');
fs.writeFileSync(out,s);
