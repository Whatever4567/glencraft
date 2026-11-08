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
// GLX-C317: the space box clamped the PLAYER to 2.5 blocks inside its walls after every step. Same bigger on the inside problem: the box
// itself may fly to within a block or two of the wall, the seat then sits up to 6.35 blocks past it, and the clamp pulled the pilot out of the
// room (measured: 1102 of 1200 frames outside the box at the -z wall). Inside the time box the room keeps you in.
one("if (P.vy < -110) P.vy = -110; U.clampBox(P, 2.5); }","if (P.vy < -110) P.vy = -110; if (!(window.__tbox && __tbox.inside)) U.clampBox(P, 2.5); }");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({"v": "v1.2.25", "d": "2026-11-08", "notes": ["Time box: both hands and arms stay on the pilot stick while you fly. Before, they were placed where the stick was one frame earlier, so the faster you flew the further they trailed behind it.", "Time box: flying up to the north edge of the UK no longer shoves you off the pilot seat towards the door. The seat sits well inside the bigger room, and the edge barrier was pushing you instead of stopping only the box.", "Time box: flying fast to the outer wall of space no longer pulls you out of the box. The space wall now stops only the box, not you on the seat inside.", "Hands: on the rifle bolt reload the left hand now takes a wider path to the bolt, so its fingertips no longer sink into the gun on the way in (measured 14 mm before, under 8 mm now).", "Hands: during a pistol reload the right wrist no longer bends past about 52 degrees while the gun tips. The right elbow moves to line the forearm up and the hand stays on the grip.", "Hands: the support hand wrist is limited while it travels and on the rifle bolt, and the fingers curl less on the bolt knob.", "World: the old round Earth code that was no longer used is removed (the ball of the Earth seen from far away, its sea names and its sheet hole). The flat UK, your current city, space, the Moon and Mars are kept as they were."]})+',');
fs.writeFileSync(out,s);
