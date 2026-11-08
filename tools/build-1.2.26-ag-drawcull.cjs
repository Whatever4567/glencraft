#!/usr/bin/env node
'use strict';
// Candidate on top of v1.2.26 (no version change; fold into the next release builder). Agarthans were never drawn: their group sits at the
// world origin and GLX-C79c hides any small scene child whose origin is past fog far (the city is ~780 blocks from 0,0). The group now opts
// out of that cull (seven people, cheap). Usage: node tools/build-1.2.26-ag-drawcull.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1226d-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.26.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("    built = ring; U.n = folk.length; }","    grp.userData.__dcK = grp.children.length; grp.userData.__dcR = 1e9;   /* the group sits at the world origin: keep GLX-C79c (far props cull by origin) from hiding the city folk */\n    built = ring; U.n = folk.length; }");
fs.writeFileSync(out,s);
