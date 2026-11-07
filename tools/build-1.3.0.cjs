#!/usr/bin/env node
'use strict';
// v1.3.0: time box (TARDIS) cockpit on top of v1.2.9. Usage: node tools/build-1.3.0.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b130-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.9.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
// room about twice as big inside and twice as tall; the walk-through space matches the new height
one('const RR = 4.6, RH = 4.4, HW = 0.85','const RR = 6.5, RH = 8.8, HW = 0.85');
one('if (y >= fy && y < fy + 4) return false;','if (y >= fy && y < fy + 9) return false;');
// controls: right stick = up/down + left/right, left stick = spin only, LS (stick click) = boost with a whoosh
one("const f = (K.KeyW ? 1 : 0) - (K.KeyS ? 1 : 0) - ax(1) + tin.f, tr = (K.KeyA ? 1 : 0) - (K.KeyD ? 1 : 0) - ax(0) + tin.t, up = (K.Space ? 1 : 0) - (K.ShiftLeft || K.ShiftRight ? 1 : 0) + bt(0) - bt(1) + tin.u;",
 "const LSb = bt(10), st = ax(2), f = (K.KeyW ? 1 : 0) - (K.KeyS ? 1 : 0) + tin.f + (LSb ? 1 : 0), tr = (K.KeyA ? 1 : 0) - (K.KeyD ? 1 : 0) - ax(0) + tin.t, up = (K.Space ? 1 : 0) - (K.ShiftLeft || K.ShiftRight ? 1 : 0) + bt(0) - bt(1) - ax(3) + tin.u;\n    U.inp = [st, ax(3)]; if (LSb && !U._ls) { whoosh(0.9); try { window.__v130 && __v130.boosts++; } catch (_) {} } U._ls = LSb;");
one("const alt = S.y - SEA, sp = alt > 1500 ? 420 : alt > 400 ? 160 : alt > 80 ? 40 : 14, tx = -Math.sin(U.H) * f * sp, tz = -Math.cos(U.H) * f * sp,",
 "const alt = S.y - SEA, sp = (alt > 1500 ? 420 : alt > 400 ? 160 : alt > 80 ? 40 : 14) * (LSb ? 3 : 1), tx = -Math.sin(U.H) * f * sp + Math.cos(U.H) * st * sp, tz = -Math.cos(U.H) * f * sp - Math.sin(U.H) * st * sp,");
one("toast(U.pilot ? 'You have the wheel. W S A D to fly, Space up, Shift down, G to let go' : 'You let go of the wheel')",
 "toast(U.pilot ? 'You have the stick. Right stick: up/down and left/right. Left stick: spin. LS: boost. X to let go (keys: W S A D, Space, Shift, G)' : 'You let go of the stick')");
const mod=fs.readFileSync(path.join(__dirname,'content-source/tardis-130.js'),'utf8');new vm.Script(mod);
one('/* GLX-C400',mod+'\n/* GLX-C400');
one('<!-- glencraft-build: b1209-v1.2.9 -->','<!-- glencraft-build: b1300-v1.3.0 -->');
one("const GAME_VERSION = '1.2.9';","const GAME_VERSION = '1.3.0';");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.3.0',d:'2026-11-07',notes:['Time box: about twice as big and twice as tall inside, with a chrome, purple and blue look.','A blue glass column with flowing yellow energy stands on the console, with a pilot stick beside it.','Flying: press X at the console. Right stick moves up, down, left and right, left stick spins the box, LS boosts with a whoosh. The big screen shows the view outside.','A steady time-travel hum plays while you fly.']})+',');
fs.writeFileSync(out,s);console.log(crypto.createHash('sha256').update(s).digest('hex'));
