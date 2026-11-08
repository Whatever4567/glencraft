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

// v1.2.32 art pass: the user asked (t1024) for about 100000 near triangles; the density goes to the head, hair, ears and torso
// (silhouette and face curvature), the far LOD keeps its old size via a larger LOD shift
{const k='SC.loftS(SC.headS, 72, 80, SC.headF2, {vuv: SC.faceVUV, lod: 2,',i=once(k);s=s.slice(0,i)+'SC.loftS(SC.headS, 140, 160, SC.headF2, {vuv: SC.faceVUV, lod: 3,'+s.slice(i+k.length);}
{const k='SC.loftS(SC.headS, 22, 72, null, {raw: SC.hairRaw, off: SC.hairOff2, lod: 2,',i=once(k);s=s.slice(0,i)+'SC.loftS(SC.headS, 40, 140, null, {raw: SC.hairRaw, off: SC.hairOff2, lod: 3,'+s.slice(i+k.length);}
{const k='SC.loftS(null, 12, 28, null, {raw: SC.earRaw(sx), out: SC.earOut(sx), lod: 1,',i=once(k);s=s.slice(0,i)+'SC.loftS(null, 20, 44, null, {raw: SC.earRaw(sx), out: SC.earOut(sx), lod: 2,'+s.slice(i+k.length);}
{const k='SC.loftS(SC.torsoS, 40, 48, SC.torsoF2, {lod: 2,',i=once(k);s=s.slice(0,i)+'SC.loftS(SC.torsoS, 60, 80, SC.torsoF2, {lod: 3,'+s.slice(i+k.length);}
// art pass, younger face (t1023): shallower smile folds and cheek hollows, which the denser grid would otherwise show as age lines
{const k='dr -= f * wv * 0.0035 * g(d, 0.007); dr += f * wv * 0.0035 * g(d - 0.016, 0.012);',i=once(k);s=s.slice(0,i)+'dr -= f * wv * 0.0012 * g(d, 0.01); dr += f * wv * 0.0015 * g(d - 0.016, 0.014);'+s.slice(i+k.length);}
{const k='dr += f * 0.013 * e(ax, y, 0.138, 0.214, 0.042, 0.03); dr -= f * 0.005 * e(ax, y, 0.13, 0.14, 0.04, 0.035);',i=once(k);s=s.slice(0,i)+'dr += f * 0.011 * e(ax, y, 0.138, 0.214, 0.05, 0.036); dr -= f * 0.0022 * e(ax, y, 0.13, 0.14, 0.04, 0.035);'+s.slice(i+k.length);}
{const k='dr += f * (0.012 * g(y - 0.316, 0.017) * g(ax - 0.09, 0.075)',i=once(k);s=s.slice(0,i)+'dr += f * (0.0108 * g(y - 0.316, 0.021) * g(ax - 0.09, 0.075)'+s.slice(i+k.length);}   // softer, younger brow ridge
{const k='fine: 1231, face: 1232};',i=once(k);s=s.slice(0,i)+'fine: 1231, face: 1232, art: 100000};'+s.slice(i+k.length);}
s=s.replace('<!-- glencraft-build: b1231-v1.2.31 -->','<!-- glencraft-build: b1231-v1.2.31 face-local -->');
fs.writeFileSync(out,s);
