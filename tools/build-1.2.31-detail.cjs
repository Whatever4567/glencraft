#!/usr/bin/env node
'use strict';
// Local finer sculpt candidate on top of release v1.2.30: tools/build-1.2.30.cjs, then the third person player builder gets smooth shaded,
// higher resolution lofts and face, ear, hair, neck and joint detail from tools/sculpt-source/player-detail.js. No new assets.
// Usage: node tools/build-1.2.31-detail.cjs out.html   (GC_BASE=file skips rebuilding v1.2.30 when that file is its exact output)
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1231-')),f=path.join(dir,'b.html');let s;
try{if(process.env.GC_BASE)fs.copyFileSync(process.env.GC_BASE,f);else cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.30.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
const a0=s.indexOf('(function tph() {'),a1=s.indexOf('U.built++; return g; }',a0);if(a0<0||a1<0)throw Error('tph build not found');
let b=s.slice(a0,a1);
function one(x,y){const i=b.indexOf(x);if(i<0||b.indexOf(x,i+1)>=0)throw Error('need exactly one: '+x.slice(0,90));b=b.slice(0,i)+y+b.slice(i+x.length);}
const SRC=fs.readFileSync(path.join(__dirname,'sculpt-source','player-detail.js'),'utf8').replace(/\s+$/,'');
one("{ const hm = M(SC.loft(SC.headS, 30, 32, SC.headF, {uv: SC.faceUV, tag: 'head'}), faceM, 0, 0, 0, head);","{ const hm = M(SC.warped(() => SC.loftS(SC.headS, 72, 80, SC.headF2, {vuv: SC.faceVUV, lod: 2, tag: 'head'})), faceM, 0, 0, 0, head);");
one("M(SC.loft(SC.headS, 14, 40, null, {raw: SC.hairRaw, off: SC.hairOff, tag: 'hair'})","M(SC.loftS(SC.headS, 22, 72, null, {raw: SC.hairRaw, off: SC.hairOff2, lod: 2, tag: 'hair'})");
one("for (const sx of [-1, 1]) { const e = M(new THREE.SphereGeometry(0.05, 14, 10), skin, sx * 0.226, 0.24, 0, head); e.scale.set(0.35, 1.05, 0.7); M(new THREE.TorusGeometry(0.03, 0.008, 6, 14), skin, sx * 0.24, 0.24, 0.002, head).rotation.y = Math.PI / 2; }",
 "for (const sx of [-1, 1]) M(SC.loftS(null, 12, 28, null, {raw: SC.earRaw(sx), out: SC.earOut(sx), lod: 1, tag: 'ear'}), skin, sx * 0.198, 0.235, -0.01, head);   // sculpted ears");
one("M(lathe([[0, 0.085], [0.07, 0.075], [0.14, 0.08]], 1, 1, 20), skin, 0, 1.4, 0);","M(SC.loftS(SC.neckS, 12, 32, SC.neckF, {lod: 2, tag: 'neck'}), skin, 0, 1.4, 0);");
one("M(SC.loft(SC.torsoS, 26, 36, SC.torsoF, {tag: 'torso'})","M(SC.warped(() => SC.loftS(SC.torsoS, 40, 48, SC.torsoF2, {lod: 2, tag: 'torso'}), null, SC.torsoTW)");
one("M(SC.loft(SC.torsoS, 28, 4, null, {raw: SC.sashRaw(sd), tag: 'sash'})","M(SC.loftS(SC.torsoS, 40, 6, null, {raw: SC.sashRaw(sd), seam: false, lod: 2, tag: 'sash'})");
one("M(SC.loft(SC.upperS, 18, 18, SC.upperF(sx), {tag: 'upper'})","M(SC.loftS(SC.upperS, 24, 24, SC.upperF(sx), {lod: 2, tag: 'upper'})");
one("M(SC.loft(SC.foreS, 14, 16, null, {tag: 'fore'})","M(SC.loftS(SC.foreS, 22, 22, SC.foreF, {lod: 2, tag: 'fore'})");
one("M(SC.loft(SC.handS, 8, 16, SC.handF, {tag: 'hand'})","M(SC.loftS(SC.handS, 12, 20, SC.handF2, {lod: 2, tag: 'hand'})");
one("M(SC.loft(SC.thighS, 10, 16, null, {tag: 'thigh'})","M(SC.loftS(SC.thighS, 12, 20, SC.thighF, {lod: 2, tag: 'thigh'})");
one("M(SC.loft(SC.shinS, 16, 16, null, {tag: 'shin'})","M(SC.loftS(SC.shinS, 24, 22, SC.shinF, {lod: 2, tag: 'shin'})");
one("M(SC.loft(SC.shoeS, 18, 16, null, {rot: Math.PI / 2, tag: 'shoe'})","M(SC.loftS(SC.shoeS, 24, 20, null, {rot: Math.PI / 2, lod: 2, tag: 'shoe'})");
one("M(SC.loft(SC.soleS, 18, 16, null, {rot: Math.PI / 2, tag: 'sole'})","M(SC.loftS(SC.soleS, 20, 12, null, {rot: Math.PI / 2, lod: 2, tag: 'sole'})");
one("rbox = function (w, h, d, r, seg) { const hi = RB(w, h, d, Math.min(r * 1.35, Math.min(w, h, d) * 0.48), seg || 8);","rbox = function (w, h, d, r, seg) { const hi = RB(w, h, d, Math.min(r * 1.35, Math.min(w, h, d) * 0.48), seg || (Math.max(w, h, d) < 0.1 ? 3 : 8));   /* v1.2.31: small trims (laces, flashes, buckles) need far fewer rounding steps */");
one("    SC.K = keys => t => {", "    /* v1.2.31: cross sections blend with smooth slopes through each key (Hermite), so smooth shading shows no ridge at every key ring */\n    SC.KH = keys => t => { const N = keys.length, y0 = keys[0][0], y1 = keys[N - 1][0], y = y0 + (y1 - y0) * t; let i = 0; while (i < N - 2 && y > keys[i + 1][0]) i++; const A = keys[i], B = keys[i + 1], h = (B[0] - A[0]) || 1, u = Math.min(1, Math.max(0, (y - A[0]) / h)), u2 = u * u, u3 = u2 * u;\n      const val = (K, k, d) => K[k] == null ? d : K[k], tan = (j, k, d) => { const a = keys[Math.max(0, j - 1)], c = keys[Math.min(N - 1, j + 1)]; return (val(c, k, d) - val(a, k, d)) / ((c[0] - a[0]) || 1); };\n      const L = (k, d) => { const p = val(A, k, d), q = val(B, k, d), v = (2 * u3 - 3 * u2 + 1) * p + (u3 - 2 * u2 + u) * h * tan(i, k, d) + (-2 * u3 + 3 * u2) * q + (u3 - u2) * h * tan(i + 1, k, d); return Math.min(Math.max(p, q), Math.max(Math.min(p, q), v)); };   // no overshoot past the keys\n      return {y, rx: Math.max(0.001, L(1, 0)), zf: Math.max(0.001, L(2, 0)), zb: Math.max(0.001, L(3, 0)), n: L(4, 2), z0: L(5, 0)}; };\n    SC.K = keys => SC.KH(keys); SC.K0 = keys => t => {");
one("const a = j / ns * Math.PI * 2, sa = Math.sin(a)","const a = SC.aw ? SC.aw(j / ns) : j / ns * Math.PI * 2, sa = Math.sin(a)");
one("for (let i = 0; i <= nr; i++) { const t = i / nr, s = S(t); C.push","for (let i = 0; i <= nr; i++) { const t = SC.tw ? SC.tw(i / nr) : i / nr, s = S(t); C.push");
one("detail: 1226, sculpt: 1230};","detail: 1226, sculpt: 1230, fine: 1231};");
one("    const head = new THREE.Group(); head.position.y = 1.5;",SRC+"\n    const head = new THREE.Group(); head.position.y = 1.5;");
s=s.slice(0,a0)+b+s.slice(a1);
s=s.replace('<!-- glencraft-build: b1230-v1.2.30 -->','<!-- glencraft-build: b1230-v1.2.30 detail-local -->');
fs.writeFileSync(out,s);
