#!/usr/bin/env node
'use strict';
// v1.2.26 (local, unreleased) on top of v1.2.25: character look save schema (foundation, no model change). Usage: node tools/build-1.2.26.cjs out.html
// Version labels stay 1.2.25 until a release is asked for.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1226-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.25.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
one('/* GLX-GRIP1222',fs.readFileSync(path.join(__dirname,'content-source','look-1226.js'),'utf8')+'\n/* GLX-GRIP1222');
fs.writeFileSync(out,s);
