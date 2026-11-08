#!/usr/bin/env node
'use strict';
// Release v1.2.31: tools/build-1.2.31-detail.cjs (finer smooth player sculpt) plus version and patch notes.
// Usage: node tools/build-1.2.29.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1231-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.31-detail.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("const GAME_VERSION = '1.2.30';","const GAME_VERSION = '1.2.31';");
one('<!-- glencraft-build: b1230-v1.2.30 detail-local -->','<!-- glencraft-build: b1231-v1.2.31 -->');
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({"v":"v1.2.31","d":"2026-11-08","notes":[
 "Player model has much finer shape and smooth shading, so the face no longer shows flat bands.",
 "Face: eye sockets with lids, a nose with bridge, tip, wings and nostrils, real upper and lower lips, a groove above the lip, cheekbones, chin and jaw.",
 "Ears now have a rim, inner fold, bowl and lobe, and the hair falls in locks.",
 "Neck, collarbones, elbows, knees and knuckles are shaped too. Same Highlander, joints, hand grips and armour fit, with no extra draws or materials."]})+',');
fs.writeFileSync(out,s);
