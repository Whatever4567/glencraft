#!/usr/bin/env node
'use strict';
// Release v1.2.29: tools/build-1.2.29-gun-next.cjs (firing effects pools, face relief, thinner hands, animal ragdoll) plus version and patch notes.
// Usage: node tools/build-1.2.29.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1229-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.29-gun-next.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("const GAME_VERSION = '1.2.28';","const GAME_VERSION = '1.2.29';");
one('<!-- glencraft-build: b1228-v1.2.28 -->','<!-- glencraft-build: b1229-v1.2.29 -->');
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({"v":"v1.2.29","d":"2026-11-08","notes":[
 "Guns: firing no longer makes and throws away new spark, dust, bullet hole and tracer materials on every shot. They are reused, which removes a likely cause of the stutter when firing.",
 "Player model: the face has real shape now, with a brow ridge, nose bridge, cheekbones, lip ridge, chin and ear folds. No extra draw cost.",
 "Hands: first person hands are slimmer, with a thinner palm, wrist, fingers and thumb. Grips are unchanged.",
 "Animals: ragdolls fall with gravity all the way to the real ground, and launches depend on the size of the animal."]})+',');
fs.writeFileSync(out,s);
