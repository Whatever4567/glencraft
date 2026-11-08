#!/usr/bin/env node
'use strict';
// LOCAL feature-sculpt follow-up: actual orbital/canthus/globe patches, nasal underside, stronger ear fold surfaces, 1024 packed face atlas.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),out=process.argv[2];if(!out)throw Error('output required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'surface33-')),f=path.join(dir,'b.html');let s;
try{if(process.env.GC_REALISM)fs.copyFileSync(process.env.GC_REALISM,f);else cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.33-realism.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need one '+a.slice(0,90));s=s.slice(0,i)+b+s.slice(i+a.length);}
const read=n=>fs.readFileSync(path.join(__dirname,'surface-source',n),'utf8').trimEnd();
one(fs.readFileSync(path.join(__dirname,'realism-source','eye-shape.js'),'utf8').trimEnd(),read('orbits.js')+'\n'+read('nose.js'));
one('SC.loftS(null, 20, 44, null, {raw: SC.earRaw(sx)', 'SC.loftS(null, 28, 44, null, {raw: SC.earRaw(sx)');
one('const stem=0.0055*','const stem=0.0075*');one('const branch=0.0045*','const branch=0.006*');
one('const bowl=-0.0045*SC.ell','const bowl=-0.0065*SC.ell');one('tragus=0.006*SC.ell','tragus=0.0085*SC.ell');
// Albedo RGB + authored detail/roughness alpha in ONE existing face texture. Same eight texture objects.
one('    faceTexP = cv(512, 512, (g, w) => { paintFaceV1232(g, w); });',read('detail-paint.js')+'\n    faceTexP = cv(1024, 1024, (g, w) => { paintFaceV1232(g, w); packSurfaceDetail1233(g,w); });');
one('faceM = std({map: faceTexP, roughness: .48});','faceM = std({map: faceTexP, roughness: .48, roughnessMap: faceTexP, bumpMap: faceTexP, bumpScale: .00025}); '+read('detail-material.js'));
one('realism: 1233};','realism: 1233, surface: 1233};');
one('<!-- glencraft-build: b1233-v1.2.33 realism-experiment-local -->','<!-- glencraft-build: b1233-v1.2.33 surface-experiment-local -->');fs.writeFileSync(out,s);
