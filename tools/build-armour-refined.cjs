#!/usr/bin/env node
'use strict';
// Local preview only: composes the live base, replacing only the HD equipment fitter.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'armour-preview-'));let s;
try{const f=path.join(dir,'base.html');cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.32.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
const a=s.indexOf('  // HD armour fitted to the new body'),b=s.indexOf('  // v1.1.57: the new model blinks',a);if(a<0||b<a)throw Error('armour fitter anchors missing');
s=s.slice(0,a)+fs.readFileSync(path.join(__dirname,'armour-source/refined.js'),'utf8')+s.slice(b);
fs.writeFileSync(out,s);
