#!/usr/bin/env node
'use strict';
// v1.2.26 candidate (local, unpublished, version label unchanged) on top of v1.2.25: the seven Agarthans are city residents, not mobs,
// so Disable mobs (SET.noMobs) no longer hides them. Normal mobs stay blocked/swept by GLX-V127. Usage: node tools/build-1.2.26.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1226-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.25.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("  U.tick = (dt) => { const ring = window.__ag1222","  /* v1.2.26: the seven are city residents, not mobs, so Disable mobs no longer hides them (it did, which is why they were missing for players with mobs off) */\n  U.tick = (dt) => { const ring = window.__ag1222");
one("&& !DIM.cur && !(typeof SET !== 'undefined' && SET.noMobs) && !(typeof dead","&& !DIM.cur && !(typeof dead");
one("!ok ? ((typeof SET !== 'undefined' && SET.noMobs) ? 'mobs off' : 'not ready')","!ok ? 'not ready'");
fs.writeFileSync(out,s);
