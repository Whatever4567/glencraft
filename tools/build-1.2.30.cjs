#!/usr/bin/env node
'use strict';
// Release v1.2.30: tools/build-1.2.30-sculpt.cjs (sculpted player body and sash) plus version and patch notes.
// Usage: node tools/build-1.2.29.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1230-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.30-sculpt.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("const GAME_VERSION = '1.2.29';","const GAME_VERSION = '1.2.30';");
one('<!-- glencraft-build: b1229-v1.2.29 sculpt-local -->','<!-- glencraft-build: b1230-v1.2.30 -->');
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({"v":"v1.2.30","d":"2026-11-08","notes":[
 "Player model reshaped: the block head is now a sculpted head with a shaped skull, brow, eye sockets, nose, cheekbones, jaw and chin, and the hair follows the head from a real hairline.",
 "The body is reshaped too: a chest that narrows to the waist, rounded shoulders, arms that taper from shoulder to wrist, shaped calves, slimmer hands and shoes shaped heel to toe.",
 "The sash is now a smooth band lying across the shirt.",
 "Same kilted Highlander, same joints, hand grips and armour fit, with no extra draws or materials."]})+',');
fs.writeFileSync(out,s);
