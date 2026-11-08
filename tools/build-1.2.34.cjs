#!/usr/bin/env node
'use strict';
// Release 1.2.34: only the exact approved f85aef4 pilot equipment preview, composed over live 1.2.33.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1234-'));let s;
try{const f=path.join(dir,'pilot.html');cp.execFileSync(process.execPath,[path.join(__dirname,'build-pilot-preview.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("const GAME_VERSION = '1.2.33';","const GAME_VERSION = '1.2.34';");
one('<!-- glencraft-build: b1233-v1.2.33 -->','<!-- glencraft-build: b1234-v1.2.34 -->');
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.34',d:'2026-11-08',notes:[
 'Pilot armour has a fitted collar and helmet details, curved brown webbing, buckles and hip pouches.',
 'The worn white jetpack has a shaped casing, frame, hoses and red indicator. Native pack fitting returns when the pilot chest is removed.',
 'The face, hands, underlying body, rig, gold jetpack, combat and saves are unchanged.'
]})+',');
fs.writeFileSync(out,s);fs.writeFileSync(path.join(path.dirname(path.resolve(out)),'version.json'),JSON.stringify({v:'1.2.34'})+'\n');
