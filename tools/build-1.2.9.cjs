#!/usr/bin/env node
'use strict';
// v1.2.9: content/settings on top of v1.2.8. Usage: node tools/build-1.2.9.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b129-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.8.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
const mod=fs.readFileSync(path.join(__dirname,'content-source/chrome-129.js'),'utf8');new vm.Script(mod);
one('/* GLX-C400',mod+'\n/* GLX-C400');
one('<!-- glencraft-build: b1208-v1.2.8 -->','<!-- glencraft-build: b1209-v1.2.9 -->');
one("const GAME_VERSION = '1.2.8';","const GAME_VERSION = '1.2.9';");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.9',d:'2026-11-07',notes:['Chrome mode is now a setting: once you have met the visitor, switch it on or off in Settings. The revisit portal is gone.','Your own UFO can no longer be flown. The visitor encounter is unchanged.','The visitor has new things to say about Agartha.','Time box: the steering wheel is gone. You still fly it from the console.']})+',');

// alien lines: fictional Agartha lore (game story only)
one("const LINES = ['Pay attention. We have watched your skies longer than you remember.'", "const LINES = "+JSON.stringify(["Do not be afraid. I come from Agartha, the hidden world deep beneath your feet.", "Far below the rock there is a sky of its own, lit by a small sun that never sets.", "The Agarthans are keepers of that inner world. They tend crystal gardens and remember old songs.", "Their keepers wear deep blue, the colour of the inner sky, so they can find each other in the glow.", "In the old stories they have pale gold hair and blue eyes. That is only how the songs paint them, not what makes anyone worthy.", "They do not rule anyone. Every people above and below is equal in their eyes.", "The way down begins in the northern hills. Go gently, and leave the crystals as you find them.", "When you are ready, the chrome light will be yours to call on. Look in your settings.", "Pay attention. We will meet again."])+".concat([]); const LINES_OLD = ['Pay attention. We have watched your skies longer than you remember.'");
// smoother delivery from the browser voice: natural/online voices first, natural pitch and pace
one("u.pitch = 1.45; u.rate = 0.9; u.volume = 1; u.onend = () => setTimeout(say, 700);","u.pitch = 1.0; u.rate = 0.94; u.volume = 1; u.onend = () => setTimeout(say, 700);");
one("return vs.find(v => /en/i.test(v.lang) && /female|zira|samantha|google uk english female|karen|moira/i.test(v.name))","return vs.find(v => /en/i.test(v.lang) && /natural|online|neural|premium|enhanced/i.test(v.name)) || vs.find(v => /en/i.test(v.lang) && /female|zira|samantha|google uk english female|karen|moira/i.test(v.name))");
// revisit portal never placed (unlock is still recorded for Chrome mode)
one("  function placeAt(pos) {\n","  function placeAt(pos) { if (pos) saveUnlock(pos); U.unlocked = 1; return false; /* v1.2.9: portal replaced by Chrome mode setting */\n");
// time box: the brass steering wheel is no longer built into the room (flying still works from the console)
one("wg.position.set(1.15, 1.25, CZ + 0.9); wg.rotation.x = -0.5; room.add(wg);","wg.position.set(1.15, 1.25, CZ + 0.9); wg.rotation.x = -0.5; /* v1.2.9: wheel removed */");
fs.writeFileSync(out,s);console.log(crypto.createHash('sha256').update(s).digest('hex'));
