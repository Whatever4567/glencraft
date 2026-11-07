#!/usr/bin/env node
'use strict';
// v1.2.6: item visuals on top of the v1.2.5 build (aqua diamond palette lives in diamond-source; icons in visuals-source).
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b126-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.5.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
const mod=fs.readFileSync(path.join(__dirname,'visuals-source/item-visuals.js'),'utf8');new vm.Script(mod);
one('/* GLX-C400',mod+'\n/* GLX-C400');
one('<!-- glencraft-build: b1205-v1.2.5 -->','<!-- glencraft-build: b1206-v1.2.6 -->');
one("const GAME_VERSION = '1.2.5';","const GAME_VERSION = '1.2.6';");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.6',d:'2026-11-07',notes:['Block of diamond: polished shiny aqua look on every face, in hand and as a drop.','New 3D block icons for grass, chest and diamond block.','New icons: folded relief map, detailed bread and rotten flesh.']})+',');
fs.writeFileSync(out,s);console.log(crypto.createHash('sha256').update(s).digest('hex'));
