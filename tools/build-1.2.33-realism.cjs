#!/usr/bin/env node
'use strict';
// Separate LOCAL realism experiment over the preserved c399355 anatomy candidate. No release/version changes.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output required');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'r1233-')),f=path.join(dir,'b.html');let s;
try{if(process.env.GC_ANATOMY)fs.copyFileSync(process.env.GC_ANATOMY,f);else cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.33-anatomy.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need one '+a.slice(0,90));s=s.slice(0,i)+b+s.slice(i+a.length);}
function block(a,b,replacement){const i=s.indexOf(a),j=s.indexOf(b,i);if(i<0||j<i)throw Error('block missing');s=s.slice(0,i)+replacement+'\n'+s.slice(j);}
block('    function paintFaceV1232','    faceTexP = cv(512, 512,', '    '+fs.readFileSync(path.join(__dirname,'realism-source/face-paint.js'),'utf8').trimEnd().replace(/\n/g,'\n    '));
const hp=fs.readFileSync(path.join(__dirname,'realism-source/hair-paint.js'),'utf8').trimEnd();
one('  let TX = null; function texs()',hp+'\n  let TX = null; function texs()');
block('      hair: tex(', '\n  function build(pbr)', '      hair: tex((g, s) => { paintHairV1233(g,s); },512) }; return TX; }');
one('bumpScale: 1.4, roughness: .55, color: 0x6e625c','bumpScale: 0.003, roughness: .55, color: 0xffffff');
// Curved clump variation in the actual same hair shell; no extra meshes or unchanged subdivided duplicates.
one('    const head = new THREE.Group(); head.position.y = 1.5; head.scale.setScalar(0.9); g.add(head);',fs.readFileSync(path.join(__dirname,'realism-source/hair-shape.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'realism-source/eye-shape.js'),'utf8')+'\n    const head = new THREE.Group(); head.position.y = 1.5; head.scale.setScalar(0.9); g.add(head);');
one('anatomy: 1233};','anatomy: 1233, realism: 1233};');
one('<!-- glencraft-build: b1233-v1.2.33 anatomy-local -->','<!-- glencraft-build: b1233-v1.2.33 realism-experiment-local -->');
fs.writeFileSync(out,s);
