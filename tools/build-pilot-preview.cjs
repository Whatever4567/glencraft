#!/usr/bin/env node
'use strict';
// Local only. Compose live 1.2.33; replace only its equipment fitter and clone-local white-pack fit.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const out=process.argv[2];if(!out)throw Error('output path required');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pilot-preview-'));let s;
try{const f=path.join(dir,'base.html');cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.33.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
const a=s.indexOf('  // Refined continuous diamond plate.'),b=s.indexOf('  // v1.1.57: the new model blinks',a);if(a<0||b<a)throw Error('live fitter anchors missing');s=s.slice(0,a)+fs.readFileSync(path.join(__dirname,'pilot-source/fit.js'),'utf8')+s.slice(b);fs.writeFileSync(out,s);
