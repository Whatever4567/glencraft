#!/usr/bin/env node
'use strict';
// v1.2.23 on top of v1.2.22 (inventory controller and creative bag fixes live in tools/content-source/inv-1222.js). Usage: node tools/build-1.2.23.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1223-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.22.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
one('<!-- glencraft-build: b1222-v1.2.22 -->','<!-- glencraft-build: b1223-v1.2.23 -->');
one("const GAME_VERSION = '1.2.22';","const GAME_VERSION = '1.2.23';");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.23',d:'2026-11-08',notes:[
 'Controller in the inventory: pressing A on a slot or a creative bag item keeps the focus on that box instead of jumping back to the first one, so a second press takes or moves the item you meant.',
 'Controller Y in the new inventory works again: an item goes to the next free hotbar slot, armour goes straight on, a hotbar item goes back to storage, and in the creative bag Y takes the item.',
 'Creative bag: items you already have show their count on the box, and taking one shows how many you now have.']})+',');
fs.writeFileSync(out,s);
