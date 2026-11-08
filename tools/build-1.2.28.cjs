#!/usr/bin/env node
'use strict';
// Release v1.2.28 on top of tools/build-paladiens.cjs (v1.2.27 + the Paladiens and the cosmic Agartha sky). Usage: node tools/build-1.2.28.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1228-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-paladiens.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("const GAME_VERSION = '1.2.27';","const GAME_VERSION = '1.2.28';");
one('<!-- glencraft-build: b1227-v1.2.27 -->','<!-- glencraft-build: b1228-v1.2.28 -->');
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({"v": "v1.2.28", "d": "2026-11-08", "notes": ["Agartha: the seven city residents are now called the Paladiens. They wear fitted blue suits with a black high collar and a gold brooch, and have long blond hair and blue eyes. Their leader wears gold shoulder pieces, a turquoise sash and a turquoise pendant.", "Agartha: the city sky is now deep navy and violet space with cyan nebula, stars, planets and soft glows."]})+',');
fs.writeFileSync(out,s);
