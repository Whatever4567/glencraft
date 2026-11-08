#!/usr/bin/env node
'use strict';
// Release 1.2.33: ONLY the approved refined armour; prior live builder remains the base.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1233-'));let s;
try{const f=path.join(dir,'approved.html');cp.execFileSync(process.execPath,[path.join(__dirname,'build-armour-refined.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("const GAME_VERSION = '1.2.32';","const GAME_VERSION = '1.2.33';");
one('<!-- glencraft-build: b1232-v1.2.32 -->','<!-- glencraft-build: b1233-v1.2.33 -->');
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.33',d:'2026-11-08',notes:[
 'Fitted armour has a shaped chest, tapered limb plates and restrained diamond surfaces with clean edge trim.',
 'Armour tiers keep their colours, and worn jetpack straps fit over the new plates.',
 'The head, body underneath, rig, combat and saves are unchanged.'
]})+',');
fs.writeFileSync(out,s);
fs.writeFileSync(path.join(path.dirname(path.resolve(out)),'version.json'),JSON.stringify({v:'1.2.33'})+'\n');
