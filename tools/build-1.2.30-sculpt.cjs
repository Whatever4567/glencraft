#!/usr/bin/env node
'use strict';
// Local (unpublished) sculpt pass on top of release v1.2.29: tools/build-1.2.29.cjs, then the third person player builder (tph build())
// gets the lofted body from tools/sculpt-source/player-sculpt.js. No new assets. Usage: node tools/build-1.2.30-sculpt.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1230-')),f=path.join(dir,'b.html');let s;
try{if(process.env.GC_BASE)fs.copyFileSync(process.env.GC_BASE,f);else cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.29.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
const a0=s.indexOf('(function tph() {'),a1=s.indexOf('U.built++; return g; }',a0);if(a0<0||a1<0)throw Error('tph build not found');
let b=s.slice(a0,a1);
function one(x,y){const i=b.indexOf(x);if(i<0||b.indexOf(x,i+1)>=0)throw Error('need exactly one: '+x.slice(0,90));b=b.slice(0,i)+y+b.slice(i+x.length);}
// replace the whole line that holds a unique marker
function line(mark,y){const i=b.indexOf(mark);if(i<0||b.indexOf(mark,i+1)>=0)throw Error('need exactly one line: '+mark.slice(0,90));const l0=b.lastIndexOf('\n',i)+1,l1=b.indexOf('\n',i);b=b.slice(0,l0)+y+b.slice(l1);}
const SRC=fs.readFileSync(path.join(__dirname,'sculpt-source','player-sculpt.js'),'utf8').replace(/\s+$/,'');
// head: one sculpted skin with the face projected on the front, a hair cap that follows the skull, in place of the block, hair slabs, nose and 1.2.29 bumps
line("M(rb(0.44, 0.48, 0.44, 0.09), [skin, skin, hair, skin, faceM, hair], 0, 0.25, 0, head);","    { const hm = M(SC.loft(SC.headS, 30, 32, SC.headF, {uv: SC.faceUV, tag: 'head'}), faceM, 0, 0, 0, head); hm.userData.sculpt = 'head'; hm.userData.face = 1;\n      M(SC.loft(SC.headS, 14, 40, null, {raw: SC.hairRaw, off: SC.hairOff, tag: 'hair'}), hair, 0, 0, 0, head).userData.sculpt = 'hair'; }");
for(const m of["M(rb(0.47, 0.12, 0.47, 0.06), hair, 0, 0.475, -0.01, head);","// fringe locks","// sideburns, brows","rotation.x = -Math.PI / 2 + 0.25;   // nose","/* v1.2.29: face relief */","F(rb(0.3, 0.03, 0.03, 0.012), 0, 0.312, 0.208, 1, 1, 1);","F(rb(0.034, 0.075, 0.03, 0.013)","// cheekbones","// under eye","// ear fold","// lip ridge","F(new THREE.SphereGeometry(0.055, 16, 10), 0, 0.06, 0.205"])line(m,"");
// torso, placket clear of the chest, sash as a band on the chest surface
line("M(lathe([[0.86, 0.001], [0.865, 0.19]","    M(SC.loft(SC.torsoS, 26, 36, SC.torsoF, {tag: 'torso'}), shirt, 0, 0, 0, torso).userData.sculpt = 'torso';");
one("M(rb(0.012, 0.3, 0.01, 0.004), shirt, 0, 1.24, 0.138, torso);","M(rb(0.012, 0.3, 0.01, 0.004), shirt, 0, 1.24, 0.14, torso);");
line("const sash = M(rb(0.1, 0.76, 0.3, 0.03), kiltM, 0, 1.18, 0.004, torso); sash.rotation.z = 0.62;","    M(SC.loft(SC.torsoS, 70, 96, SC.torsoF, {off: () => 0.008, keep: SC.sashKeep, tag: 'sash'}), kiltM, 0, 0, 0, torso).userData.sculpt = 'sash';");
// arms, hands, legs, shoes
one("M(new THREE.SphereGeometry(0.085, 18, 12), shirt, -sx * 0.01, -0.02, 0, piv); M(lathe(capP(-0.3, -0.04, 0.058, 0.07, 0.006), 1, 1, 18), shirt, 0, 0, 0, piv);","M(SC.loft(SC.upperS, 18, 18, SC.upperF(sx), {tag: 'upper'}), shirt, 0, 0, 0, piv);");
one("M(lathe(capP(-0.27, -0.02, 0.043, 0.054, 0.007), 1, 1, 18), skin, 0, 0, 0, el);","M(SC.loft(SC.foreS, 14, 16, null, {tag: 'fore'}), skin, 0, 0, 0, el);");
one("const hnd = M(rb(0.1, 0.12, 0.065, 0.03), skin, 0, -0.32, 0.005, el);","const hnd = M(SC.loft(SC.handS, 8, 16, SC.handF, {tag: 'hand'}), skin, 0, -0.32, 0.005, el);");
one("M(lathe(capP(-0.19, 0.0, 0.07, 0.085), 1, 1, 18), skin, 0, 0, 0, piv);","M(SC.loft(SC.thighS, 10, 16, null, {tag: 'thigh'}), skin, 0, 0, 0, piv);");
one("M(lathe(capP(-0.3, -0.02, 0.05, 0.068, 0.012), 1, 1, 18), sock, 0, 0, 0, kn);","M(SC.loft(SC.shinS, 16, 16, null, {tag: 'shin'}), sock, 0, 0, 0, kn);");
one("M(rb(0.14, 0.024, 0.3, 0.01), sole, 0, -0.4025, 0.04, kn); M(rb(0.125, 0.075, 0.27, 0.035), leather, 0, -0.355, 0.035, kn);","M(SC.loft(SC.shoeS, 18, 16, null, {rot: Math.PI / 2, tag: 'shoe'}), leather, 0, -0.375, 0, kn); M(SC.loft(SC.soleS, 18, 16, null, {rot: Math.PI / 2, tag: 'sole'}), sole, 0, -0.375, 0, kn);");
line("const toe = M(new THREE.SphereGeometry(0.064, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), leather, 0, -0.39, 0.13, kn); toe.scale.set(1, 0.7, 1.05);","");
one("skin, sx * 0.1, 0.27, 0.205, head); l.rotation.x","skin, sx * 0.1, 0.27, 0.188, head); l.rotation.x");
one("hd: 1, kilts, lids, blk: 1 + Math.random() * 3, detail: 1226};","hd: 1, kilts, lids, blk: 1 + Math.random() * 3, detail: 1226, sculpt: 1230};");
// helpers go in right after the round limb profile helper
one("const head = new THREE.Group(); head.position.y = 1.5; g.add(head);",SRC+"\n    const head = new THREE.Group(); head.position.y = 1.5; head.scale.setScalar(0.9); g.add(head);");
one("M(rb(0.07, 0.008, 0.012, 0.003), dark, 0, -0.315 + i * 0.002,","M(rb(0.07, 0.008, 0.012, 0.003), dark, 0, -0.325 + i * 0.002,");
b=b.replace(/\n[ \t]*\n/g,'\n');
s=s.slice(0,a0)+b+s.slice(a1);
s=s.replace('<!-- glencraft-build: b1229-v1.2.29 -->','<!-- glencraft-build: b1229-v1.2.29 sculpt-local -->');
fs.writeFileSync(out,s);
