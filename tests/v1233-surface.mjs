// Concrete geometry + packed-map checks, separate from any GPU appearance claim.
import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';import {load,stats} from './lib/tph-harness.mjs';
const {createCanvas}=createRequire('/workspace/qa/tools/index.js')('@napi-rs/canvas');let n=0,bad=0;const ok=(c,m)=>{n++;console.log((c?'ok   ':'FAIL ')+m);if(!c)bad++;};
const f=new URL('../index.html',import.meta.url).pathname,s=fs.readFileSync(f,'utf8'),base='/tmp/surface-test-fe45.html';fs.writeFileSync(base,execFileSync('git',['show','fe45cdf:index.html'],{maxBuffer:1<<28}));
const A=load(base),B=load(f),a=A.build(false),b=B.build(false),face=g=>g.userData.head.children.find(o=>o.userData.face),p0=face(a).geometry.attributes.position,p=face(b).geometry.attributes.position;
const z=(g,x,y)=>{const p=face(g).geometry.attributes.position;let best=9,zz=0;for(let i=0;i<p.count;i++)if(p.getZ(i)>.05){const d=Math.hypot(p.getX(i)-x,p.getY(i)-y);if(d<best){best=d;zz=p.getZ(i);}}return zz;};
let changed=0,delta=0;for(let i=0;i<p.count;i++){const d=Math.abs(p.getZ(i)-p0.getZ(i));if(d>.001)changed++;delta=Math.max(delta,d);}
ok(changed>500&&delta>.006&&delta<.015,`rebuilt orbital/nasal surfaces: ${changed} vertices move over 1mm; max ${delta.toFixed(4)}`);
ok(z(b,.1,.27)>z(a,.1,.27)+.006,`globe centre is genuinely domed: ${z(a,.1,.27).toFixed(4)} -> ${z(b,.1,.27).toFixed(4)}`);
// Sample cap against socket and canthus, not a generic subdivision/count claim.
ok(z(b,.1,.27)>z(b,.1,.307)+.003&&z(b,.1,.298)>z(b,.1,.307),`globe/lid/socket depths ${z(b,.1,.27).toFixed(4)} / ${z(b,.1,.298).toFixed(4)} / ${z(b,.1,.307).toFixed(4)}`);
ok(Math.abs(z(b,.057,.27)-z(a,.057,.27))>.001&&Math.abs(z(b,.143,.271)-z(a,.143,.271))>.001,'both canthus corner surfaces are rebuilt');
const wing=g=>z(g,.028,.178),nostril=g=>z(g,.016,.168);ok(wing(b)-nostril(b)>wing(a)-nostril(a)+.003,`alar-to-nostril relief ${ (wing(a)-nostril(a)).toFixed(4)} -> ${(wing(b)-nostril(b)).toFixed(4)}`);
const ear=g=>g.userData.head.children.find(o=>o.userData.merged===2&&o.material.roughness===.48&&!o.material.map).geometry.attributes.position.array;
{const aa=ear(a),bb=ear(b);let changed=0,m=0;const oldRows=40,newRows=56,cols=45,oldCount=41*45,newCount=57*45;
for(let side=0;side<2;side++)for(let i=0;i<=oldRows;i++)for(let j=0;j<cols;j++){const t=i/oldRows*newRows,r0=Math.floor(t),r1=Math.min(newRows,r0+1),f=t-r0;
 for(let c=0;c<3;c++){const old=aa[((side*oldCount+i*cols+j)*3)+c],now=bb[((side*newCount+r0*cols+j)*3)+c]*(1-f)+bb[((side*newCount+r1*cols+j)*3)+c]*f,d=Math.abs(old-now);if(d>.0001)changed++;m=Math.max(m,d);}}
ok(changed>100&&m>.0015&&m<.006,`actual helix/antihelix/concha/tragus change ${changed} matched ear coordinates, max ${m.toFixed(4)}`);
ok(bb.length/aa.length>1.35&&bb.length/aa.length<1.45,'2816 additional near triangles sample the rebuilt ear folds, not flat subdivision');}
// Execute the ACTUAL 1024 atlas callback, not the canonical 512 feature test painter alone.
const paint=()=>{const i=s.indexOf('function paintFaceV1232'),j=s.indexOf('    faceTexP = cv(1024, 1024',i),end=s.indexOf('    const shirtT',j),body=s.slice(j,end).replace('faceTexP = cv(1024, 1024,','const __f = (').replace(/\}\);[^\n]*\n?\s*$/,'});__f(g,1024);'),c=createCanvas(1024,1024),g=c.getContext('2d');new Function('g',s.slice(i,j)+body)(g);return g.getImageData(0,0,1024,1024).data;};
const D=paint(),D2=paint(),px=(x,y)=>Array.from(D.slice((Math.round(y*2)*1024+Math.round(x*2))*4,(Math.round(y*2)*1024+Math.round(x*2))*4+4));
ok(D.length===1024*1024*4&&Buffer.from(D).equals(Buffer.from(D2)),'actual 1024 packed albedo/detail atlas is deterministic');
const sk=px(120,320)[3]/255,ey=px(144,235)[3]/255,lp=px(256,412)[3]/255;ok(sk>.60&&sk<.68&&ey>.19&&ey<.24&&lp>.45&&lp<.51,`authored alpha roughness: skin ${sk.toFixed(3)}, eye ${ey.toFixed(3)}, lip ${lp.toFixed(3)}`);
{let lo=255,hi=0;for(let y=600;y<650;y++)for(let x=180;x<230;x++){const v=D[(y*1024+x)*4+3];lo=Math.min(lo,v);hi=Math.max(hi,v);}ok(hi-lo>=7&&hi-lo<15,`restrained authored pore-height alpha variation ${lo}..${hi}`);}
const m=face(b).material;ok(m.transparent===false&&m.alphaTest===0,'packed alpha does not enable transparency or alpha-test holes');ok(m.map===m.roughnessMap&&m.map===m.bumpMap&&m.bumpScale===.00025,'RGB albedo plus alpha roughness/height reuse ONE existing face texture');
{const shader={fragmentShader:'#include <roughnessmap_fragment>\n#include <bumpmap_pars_fragment>'};m.onBeforeCompile(shader);const f=shader.fragmentShader;ok(f.includes('roughnessFactor = texelRoughness.a;')&&!f.includes('roughnessFactor *= texelRoughness.g;'),'supported shader hook reads packed alpha roughness, not skin colour');ok((f.match(/texture2D\( bumpMap[^;]+?\)\.a/g)||[]).length===3&&!/texture2D\( bumpMap[^;]+?\)\.x/.test(f),'supported bump shader differentiates packed alpha height on both axes');}
{let err=0;const u=face(b).geometry.attributes.uv;for(let i=0;i<p.count;i++)if(p.getZ(i)>.1)err=Math.max(err,Math.abs(u.getX(i)-(p.getX(i)+.22)/.44),Math.abs(u.getY(i)-(p.getY(i)-.01)/.48));ok(err<1e-6,`UVs recomputed after orbital/nasal sculpt (error ${err})`);}
{const alpha=px(164,236),blue=px(144,236);ok(alpha[0]<40&&alpha[1]<40&&blue[2]>blue[0]+35,'large blue eyes and original pupil positions retained in actual 1024 atlas');}
const st=stats(B.T,b);ok(b.userData.surface===1233&&st.tris===98496&&st.trisFar===4999&&st.meshes===48&&st.mats===11&&st.texs===8,`unchanged budgets ${JSON.stringify(st)}`);
console.log(bad?`${bad} failed of ${n}`:`all ok (${n})`);process.exitCode=bad?1:0;
