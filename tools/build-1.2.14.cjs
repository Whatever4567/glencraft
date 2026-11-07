#!/usr/bin/env node
'use strict';
// v1.2.14: Watcher bowl cave links on top of v1.2.13. Usage: node tools/build-1.2.14.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1214-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.13.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
const mod=fs.readFileSync(path.join(__dirname,'content-source/links-1214.js'),'utf8');new vm.Script(mod);
one('/* GLX-C400',mod+'\n/* GLX-C400');
one('<!-- glencraft-build: b1213-v1.2.13 -->','<!-- glencraft-build: b1214-v1.2.14 -->');
one("const GAME_VERSION = '1.2.13';","const GAME_VERSION = '1.2.14';");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.14',d:'2026-11-07',notes:['New worlds: the Watcher chamber deep under the island is now joined to the nearby caves by a winding tunnel, so you can walk in without digging.','On the way there are two new halls: one with a lava fall and lava runnel, one with an old ruined bridge and broken arch over a lava trench.','Older worlds keep their own caves unchanged.']})+',');
fs.writeFileSync(out,s);console.log(crypto.createHash('sha256').update(s).digest('hex'));
