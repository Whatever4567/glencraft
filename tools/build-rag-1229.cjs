#!/usr/bin/env node
'use strict';
// Ragdoll physics patch (local, no version change) on top of tools/build-1.2.28.cjs. Swaps the GLX-RAG1222 floor and step code for
// tools/rag-source/rag-physics-1229.js. Other streams can chain this builder or call apply(html). Usage: node tools/build-rag-1229.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
function apply(s){const A='  U.ground = (c, r, p, sol) =>',a=s.indexOf(A);if(a<0||s.indexOf(A,a+1)>=0)throw Error('rag ground');if(s.indexOf('/* GLX-RAG1222 ')>a||s.indexOf('/* GLX-RAG1222 ')<0)throw Error('rag block');
  const b=s.indexOf('})();',a);if(b<0)throw Error('rag end');return s.slice(0,a)+fs.readFileSync(path.join(__dirname,'rag-source','rag-physics-1229.js'),'utf8')+s.slice(b);}
module.exports={apply};
if(require.main===module){const out=process.argv[2];if(!out)throw Error('output path required');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'brag-')),f=path.join(dir,'b.html');let s;
  try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.28.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
  fs.writeFileSync(out,apply(s));}
