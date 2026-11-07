#!/usr/bin/env node
'use strict';
// v1.2.11: crystal pickaxes on top of v1.2.10. Usage: node tools/build-1.2.11.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1211-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.10.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
const mod=fs.readFileSync(path.join(__dirname,'content-source/picks-1211.js'),'utf8');new vm.Script(mod);
one('/* GLX-C400',mod+'\n/* GLX-C400');
one('<!-- glencraft-build: b1210-v1.2.10 -->','<!-- glencraft-build: b1211-v1.2.11 -->');
one("const GAME_VERSION = '1.2.10';","const GAME_VERSION = '1.2.11';");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.11',d:'2026-11-07',notes:['New: Blue crystal pickaxe (15x mining speed) and Purple crystal pickaxe (50x). Craft the blue one from 2 Blocks of diamond, 3 Diamonds and 2 Sticks, then upgrade it with 4 Blocks of diamond.']})+',');
fs.writeFileSync(out,s);console.log(crypto.createHash('sha256').update(s).digest('hex'));
