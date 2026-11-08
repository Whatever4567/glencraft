#!/usr/bin/env node
'use strict';
// Local face candidate on top of release v1.2.31: tools/build-1.2.31.cjs, then the player face texture painter is replaced by
// tools/face-source/face-paint.js (natural painted face lined up with the sculpted features) and the third person head gets the fringe
// change in tools/face-source/head-tweak.js. No new assets, no photos. Usage: node tools/build-1.2.32-face.cjs out.html
// (GC_BASE=file uses that file as the exact v1.2.31 output instead of rebuilding it)
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1232-')),f=path.join(dir,'b.html');let s;
try{if(process.env.GC_BASE)fs.copyFileSync(process.env.GC_BASE,f);else cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.31.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function once(x){const i=s.indexOf(x);if(i<0||s.indexOf(x,i+1)>=0)throw Error('need exactly one: '+x.slice(0,90));return i;}
// 1. face texture painter (inside the player texture block, outside the TP-HD builder)
const PAINT=fs.readFileSync(path.join(__dirname,'face-source','face-paint.js'),'utf8').replace(/\s+$/,'');
{const i=once('    faceTexP = cv(512, 512, (g, w) => {'),j=s.indexOf('    const shirtT = cv(256, 256,',i);if(j<0||j-i>6000)throw Error('old painter end not found');
 s=s.slice(0,i)+'    '+PAINT.replace(/\n/g,'\n    ')+'\n    faceTexP = cv(512, 512, (g, w) => { paintFaceV1232(g, w); });   // v1.2.32 natural face\n'+s.slice(j);}
// 2. head tweaks, right before the head group is made in the TP-HD builder
{const TW=fs.readFileSync(path.join(__dirname,'face-source','head-tweak.js'),'utf8').replace(/\s+$/,''),k='    const head = new THREE.Group(); head.position.y = 1.5; head.scale.setScalar(0.9); g.add(head);',i=once(k);s=s.slice(0,i)+TW+'\n'+s.slice(i);}
{const k='const a = j / ns * Math.PI * 2, h = SC.hairY(a)',i=once(k);s=s.slice(0,i)+'const a = SC.warpA(j / ns), h = SC.hairY(a)'+s.slice(i+k.length);}   // hair columns gather at the front so the fringe locks are drawn, not aliased
{const k='detail: 1226, sculpt: 1230, fine: 1231};',i=once(k);s=s.slice(0,i)+'detail: 1226, sculpt: 1230, fine: 1231, face: 1232};'+s.slice(i+k.length);}
s=s.replace('<!-- glencraft-build: b1231-v1.2.31 -->','<!-- glencraft-build: b1231-v1.2.31 face-local -->');
fs.writeFileSync(out,s);
