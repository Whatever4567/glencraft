#!/usr/bin/env node
'use strict';
// v12 local candidate builder. Wraps the live 1.2.41 (prism) builder, then hooks pale icy crystal + pack halo into installPilotDisplayTransfer. Does not rewrite prism/held-item code.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const out=process.argv[2]||path.join(__dirname,'../index.html');
cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.41.cjs'),out],{stdio:'inherit'});
let s=fs.readFileSync(out,'utf8');
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('Need exactly one hotfix seam: '+a.slice(0,100));s=s.slice(0,i)+b+s.slice(i+a.length);}
// Apply crystal/halo AFTER the 1.2.36 display-transfer wrap so crystalRim1237 remains
// the outermost onBeforeCompile (flag + cache key) and copies the transfer flag.
one('      if(material.onBeforeCompile.pilotDisplayTransfer1236)return material;',
    '      if(material.onBeforeCompile.pilotDisplayTransfer1236)return packHalo1238(crystalRim1237(material));');
one("      material.customProgramCacheKey=function(){return previousKey+'|pilot-display-transfer-1236';};\n      material.needsUpdate=true;return material;\n    }",
    "      material.customProgramCacheKey=function(){return previousKey+'|pilot-display-transfer-1236';};\n      material.needsUpdate=true;return packHalo1238(crystalRim1237(material));\n    }");
fs.writeFileSync(out,s);
console.log('Built LOCAL v12 crystal/pack candidate on 1.2.41: '+out);
