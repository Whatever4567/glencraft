#!/usr/bin/env node
'use strict';
// LOCAL hotfix candidate. Frozen approved GLBs and all 1.2.35 gameplay/rig code stay unchanged.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const out=process.argv[2]||path.join(__dirname,'../index.html');
cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.35.cjs'),out],{stdio:'inherit'});
let s=fs.readFileSync(out,'utf8');
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('Need exactly one hotfix seam: '+a.slice(0,100));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("const GAME_VERSION = '1.2.35';","const GAME_VERSION = '1.2.36';");
one('<!-- glencraft-build: b1235-v1.2.35 -->','<!-- glencraft-build: b1236-v1.2.36 -->');
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.36',d:'2026-11-09',notes:['Corrected the pilot model display colour transfer in the legacy world renderer.','The approved character assets, equipment, skeleton and gameplay are unchanged.']})+',');
const helper=fs.readFileSync(path.join(__dirname,'pilot-model-source/display-transfer-1236.js'),'utf8');
one('    function rig(template) {',helper+'\n    function rig(template) {');
one('const c=m.clone();c.userData.pilotOriginalColor','const c=installPilotDisplayTransfer(m.clone());c.userData.pilotOriginalColor');
one('const m=original.clone(),hex=','const m=installPilotDisplayTransfer(original.clone()),hex=');
fs.writeFileSync(out,s);fs.writeFileSync(path.join(path.dirname(path.resolve(out)),'version.json'),JSON.stringify({v:'1.2.36'})+'\n');
console.log('Built LOCAL 1.2.36 pilot display-transfer hotfix: '+out);
