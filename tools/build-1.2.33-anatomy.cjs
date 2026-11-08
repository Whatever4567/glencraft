#!/usr/bin/env node
'use strict';
// LOCAL anatomy refinement chained from the exact public 1.2.32, including its version.json fix on main.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1233-')), f=path.join(dir,'b.html');let s;
try { if(process.env.GC_BASE32)fs.copyFileSync(process.env.GC_BASE32,f);else cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.32.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8'); }finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need one '+a.slice(0,90));s=s.slice(0,i)+b+s.slice(i+a.length);}
function block(a,b,replacement){const i=s.indexOf(a),j=s.indexOf(b,i);if(i<0||j<i)throw Error('block missing');s=s.slice(0,i)+replacement+'\n'+s.slice(j);}
// Preserve the approved eye surface exactly inside the openings, with smooth transitions to the nose/cheek edits.
{const oldField=s.slice(s.indexOf('    SC.headF2 ='),s.indexOf('    SC.faceVUV')).replace('SC.headF2 =','const face1232F =');
block('    SC.headF2 =','    SC.faceVUV',oldField+'\n'+fs.readFileSync(path.join(__dirname,'anatomy-source/face-shape.js'),'utf8').trimEnd()+`
    {const anatomyF=SC.headF2;SC.headF2=(a,t,y,x,z)=>{const d=anatomyF(a,t,y,x,z),old=face1232F(a,t,y,x,z),ax=Math.abs(x),keep=SC.sm(.05,.07,ax)*(1-SC.sm(.135,.16,ax))*SC.sm(.225,.245,y)*(1-SC.sm(.30,.325,y));return d.map((v,i)=>v+(old[i]-v)*keep);};}
`);}

const originalHeadLine=s.slice(s.indexOf('    SC.headS ='),s.indexOf('\n',s.indexOf('    SC.headS ='))).replace('SC.headS =','const approvedHeadS =');
one('[0.0, 0.085, 0.09, 0.1, 2, -0.015], [0.03, 0.125, 0.17, 0.14, 2.2, 0], [0.07, 0.15, 0.19, 0.17, 2.3], [0.12, 0.18, 0.198, 0.192, 2.4]',
    '[0.0, 0.08, 0.09, 0.1, 2, -0.015], [0.03, 0.116, 0.168, 0.14, 2.15, 0], [0.07, 0.141, 0.187, 0.17, 2.25], [0.12, 0.174, 0.196, 0.192, 2.35]');
{const marker='    SC.headF ='; const i=s.indexOf(marker);s=s.slice(0,i)+originalHeadLine+`
    {const lowerHeadS=SC.headS;SC.headS=t=>{const v=lowerHeadS(t),old=approvedHeadS(t),k=SC.sm(.16,.23,v.y);for(const key of ['rx','zf','zb','n','z0'])v[key]=(v[key]||0)+((old[key]||0)-(v[key]||0))*k;return v;};}
`+s.slice(i);}
block('    function paintFaceV1232','    faceTexP = cv(512, 512,', '    '+fs.readFileSync(path.join(__dirname,'anatomy-source/face-paint.js'),'utf8').trimEnd().replace(/\n/g,'\n    '));
block('    SC.earRaw =','    // neck with', fs.readFileSync(path.join(__dirname,'anatomy-source/ears.js'),'utf8').trimEnd());
one('look: 1232};','look: 1232, anatomy: 1233};');
one('<!-- glencraft-build: b1232-v1.2.32 -->','<!-- glencraft-build: b1233-v1.2.33 anatomy-local -->');
fs.writeFileSync(out,s);
