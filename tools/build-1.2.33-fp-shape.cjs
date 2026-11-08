#!/usr/bin/env node
'use strict';
// Local first person shape pass on top of build-1.2.33-fp.cjs output: GLX-FPA mkHand() and the forearm are replaced by the lofted hand in
// tools/fp-source/fp-hand.js. Same node graph (groups, joint origins, pivots, child order). Usage: node tools/build-1.2.33-fp-shape.cjs in.html out.html
const fs=require('node:fs'),path=require('node:path');const [,,inp,out]=process.argv;if(!inp||!out)throw Error('usage: in.html out.html');let s=fs.readFileSync(inp,'utf8');
if(!s.includes('__tph.fpMats'))throw Error('apply build-1.2.33-fp.cjs first');
const a=s.indexOf('  function mkHand(side) {',s.indexOf('/* GLX-FPA (v1.1.99)')),b=s.indexOf('  function mkArm(side) {',a);if(a<0||b<0||b-a>6000)throw Error('FPA mkHand not found');
s=s.slice(0,a)+fs.readFileSync(path.join(__dirname,'fp-source','fp-hand.js'),'utf8').replace(/\s+$/,'')+'\n'+s.slice(b);
const k='const fo = limb(0.054, 0.036, LF, skinM); a.add(fo);',i=s.indexOf(k,b);if(i<0||s.indexOf(k,i+1)>=0)throw Error('forearm');s=s.slice(0,i)+'const fo = foreArm(); a.add(fo);   /* v1.2.33 shaped forearm */'+s.slice(i+k.length);
fs.writeFileSync(out,s);
