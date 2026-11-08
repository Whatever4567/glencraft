#!/usr/bin/env node
'use strict';
// Release v1.2.32: tools/build-1.2.32-face.cjs (finer smooth player sculpt) plus version and patch notes.
// Usage: node tools/build-1.2.32.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1232-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.32-face.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("const GAME_VERSION = '1.2.31';","const GAME_VERSION = '1.2.32';");
one('<!-- glencraft-build: b1231-v1.2.31 face-local -->','<!-- glencraft-build: b1232-v1.2.32 -->');
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.32',d:'2026-11-08',notes:[
 'The familiar player face keeps its big blue eyes, with rounded painted eyes, detailed irises, catch lights, soft lids and finer brows.',
 'The nose and mouth are repainted with softer edges, warm skin shading and natural lip detail. Darker hair has a softer uneven fringe.',
 'The near player model uses 95680 triangles, with finer head, hair, ear and torso surfaces. The far model stays small at 4823 triangles.',
 'The Highlander outfit, rig, joints, hand grips and armour fit are kept, with the same 48 meshes, 11 materials and 8 textures.'
]})+',');
fs.writeFileSync(out,s);
