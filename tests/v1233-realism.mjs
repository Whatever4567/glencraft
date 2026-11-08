// LOCAL painted-realism experiment. Actual texture generators and material data; no claim of photographic or GPU proof.
import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';import {load,stats} from './lib/tph-harness.mjs';
const {createCanvas}=createRequire('/workspace/qa/tools/index.js')('@napi-rs/canvas');
let n=0,fail=0;const ok=(c,m)=>{n++;console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const file=new URL('../index.html',import.meta.url).pathname,html=fs.readFileSync(file,'utf8');
const baseline='/tmp/realism-test-c399355.html';fs.writeFileSync(baseline,execFileSync('git',['show','c399355:index.html'],{maxBuffer:1<<28}));
const A=load(baseline),B=load(file),a=A.build(false),b=B.build(false);a.updateMatrixWorld(true);b.updateMatrixWorld(true);
const face=()=>{const i=html.indexOf('function paintFaceV1232'),j=html.indexOf('    faceTexP = cv(512, 512',i),c=createCanvas(512,512),g=c.getContext('2d');new Function('g',html.slice(i,j)+';paintFaceV1232(g,512)')(g);return g.getImageData(0,0,512,512).data;};
const hair=()=>{const i=html.indexOf('function paintHairV1233'),j=html.indexOf('  let TX = null',i),c=createCanvas(512,512),g=c.getContext('2d');new Function('g',html.slice(i,j)+';paintHairV1233(g,512)')(g);return g.getImageData(0,0,512,512).data;};
const F=face(),H=hair(),pix=(d,x,y)=>Array.from(d.slice((y*512+x)*4,(y*512+x)*4+3)),lum=c=>.3*c[0]+.59*c[1]+.11*c[2];
ok(Buffer.from(F).equals(Buffer.from(face())),'seeded face texture deterministic');ok(Buffer.from(H).equals(Buffer.from(hair())),'seeded actual hair texture deterministic');
let mean=[0,0,0],lo=255,hi=0;for(let i=0;i<H.length;i+=4){for(let c=0;c<3;c++)mean[c]+=H[i+c]/(512*512);const l=.3*H[i]+.59*H[i+1]+.11*H[i+2];lo=Math.min(lo,l);hi=Math.max(hi,l);}
ok(mean[0]>45&&mean[0]<90&&mean[1]>28&&mean[1]<60&&mean[2]>16&&mean[2]<40&&mean[0]>mean[1]*1.4&&mean[1]>mean[2]*1.2,`actual hair albedo is dark warm brown (mean RGB ${mean.map(v=>v.toFixed(1))})`);
ok(hi-lo>20&&hi<130,`original strands have subtle brown variation, not flat black or blond: luminance ${lo.toFixed(1)}..${hi.toFixed(1)}`);
const hm=b.userData.head.children.find(o=>o.userData.sculpt==='hair');ok(hm.material.color.getHex()===0xffffff&&hm.material.roughness===.55&&hm.material.bumpScale===.003,'hair albedo not multiplied into near-black; original map plus small bump scale');
const oldHair=a.userData.head.children.find(o=>o.userData.sculpt==='hair');let delta=0,changed=0;for(let i=0;i<hm.geometry.attributes.position.array.length;i++){const d=Math.abs(hm.geometry.attributes.position.array[i]-oldHair.geometry.attributes.position.array[i]);delta=Math.max(delta,d);if(d>1e-5)changed++;}ok(delta>.002&&delta<.006&&changed>100,`actual swept hair-clump geometry changes ${changed} coordinates, max ${delta.toFixed(4)}`);
// Both original big eye footprints and original inward pupil centres are retained, unlike the discarded brown-eye experiment.
for(const ix of [164,356]){const p=pix(F,ix,236),iris=pix(F,ix-20,236),glint=pix(F,ix-8,226);ok(lum(p)<35&&iris[2]>iris[0]+35&&lum(glint)>180,`blue eye at original pupil ${ix},236: pupil ${p}, iris ${iris}, catchlight ${glint}`);}
// Realistic brow opacity is carried by hair strokes instead of an opaque block in the same original envelope.
{let dark=0,count=0;for(let y=158;y<186;y++)for(let x=78;x<202;x++){count++;if(lum(pix(F,x,y))<135)dark++;}ok(dark/count>.15&&dark/count<.5,`feathered brow dark coverage ${(dark/count*100).toFixed(1)}%`);}
// Low-contrast skin detail: adjacent pixel changes remain small, but this is not a single flat colour.
{const values=[];let step=0;for(let y=295;y<320;y++)for(let x=92;x<122;x++){const l=lum(pix(F,x,y));values.push(l);step=Math.max(step,Math.abs(l-lum(pix(F,x+1,y))));}const mu=values.reduce((a,b)=>a+b)/values.length,sd=Math.sqrt(values.reduce((a,b)=>a+(b-mu)**2,0)/values.length);ok(sd>.35&&sd<6&&step<12,`skin microvariation SD ${sd.toFixed(2)}, largest adjacent step ${step.toFixed(2)}; no harsh aged cracks`);}
// The subtle eye dome is geometry, not a painted specular blob. The original x/y landmark positions remain exact.
{const f=g=>g.userData.head.children.find(o=>o.userData.face).geometry,p0=f(a).attributes.position,p=f(b).attributes.position;let xy=0,zmax=0,zmin=0;for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i))>.075&&Math.abs(p.getX(i))<.13&&p.getY(i)>.25&&p.getY(i)<.293){xy=Math.max(xy,Math.abs(p.getX(i)-p0.getX(i)),Math.abs(p.getY(i)-p0.getY(i)));zmax=Math.max(zmax,p.getZ(i)-p0.getZ(i));zmin=Math.min(zmin,p.getZ(i)-p0.getZ(i));}ok(xy<1e-7&&zmax>.003&&zmax<.004&&zmin>=-1e-7,`same eye footprint, genuine outward dome: xy delta ${xy}, z ${zmin.toFixed(4)}..${zmax.toFixed(4)}`);}
{let bad=0;b.userData.head.traverse(o=>{if(!o.isMesh)return;for(const key of ['position','normal','uv'])if(o.geometry.attributes[key])for(const v of o.geometry.attributes[key].array)if(!Number.isFinite(v))bad++;});ok(!bad,'finite head geometry, normals and texture coordinates');}
const st=stats(B.T,b);ok(st.tris===95680&&st.tris<=100000&&st.trisFar===4823&&st.meshes===48&&st.mats===11&&st.texs===8,`unchanged triangle/draw/texture budgets ${JSON.stringify(st)}`);
ok(b.userData.realism===1233&&b.userData.anatomy===1233,'separate realism experiment layered over retained anatomy candidate');
console.log(fail?`${fail} failed of ${n}`:`all ok (${n})`);process.exitCode=fail?1:0;
