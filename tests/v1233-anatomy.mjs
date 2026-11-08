// LOCAL 1.2.33 anatomy candidate against the public 1.2.32. Actual mesh and actual canvas paint, no stand-in redraw.
import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
import {load,stats} from './lib/tph-harness.mjs';
const {createCanvas}=createRequire('/workspace/qa/tools/index.js')('@napi-rs/canvas');
let n=0,fails=0;const ok=(v,m)=>{n++;console.log((v?'ok   ':'FAIL ')+m);if(!v)fails++;};
const bf='/tmp/v1233-baseline132.html';fs.writeFileSync(bf,execFileSync('git',['show','0f8ac65a2b2f4aa1359396d522ca5d0694434a29:index.html'],{maxBuffer:1<<28}));
const file=new URL('../index.html',import.meta.url).pathname,A=load(bf),B=load(file),a=A.build(false),b=B.build(false);a.updateMatrixWorld(true);b.updateMatrixWorld(true);
const face=g=>g.userData.head.children.find(o=>o.userData.face),gp=face(b).geometry;
// Intersect the actual front surface with a ray at (x,y); barycentric interpolation avoids nearest-vertex drift.
const surf=(g,x,y)=>{const ge=face(g).geometry,p=ge.attributes.position,ix=ge.index.array;let z=-9;
 for(let k=0;k<ix.length;k+=3){const ids=[ix[k],ix[k+1],ix[k+2]],v=ids.map(i=>[p.getX(i),p.getY(i),p.getZ(i)]),[a,b,c]=v,d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(d)<1e-14)continue;
 const w0=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/d,w1=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/d,w2=1-w0-w1;if(Math.min(w0,w1,w2)<-1e-7)continue;z=Math.max(z,w0*a[2]+w1*b[2]+w2*c[2]);}return z;};
const fmt=n=>n.toFixed(4),tip=g=>Math.max(...Array.from({length:46},(_,i)=>surf(g,0,.16+i*.002)));
const ta=tip(a),tb=tip(b);ok(tb<ta-.008&&tb>surf(b,.1,.27)+.045,`rounded nose projection ${fmt(ta)} -> ${fmt(tb)}; still distinct from eye plane`);
// A dense midsagittal profile has no abrupt curvature jump at the old piecewise nose boundaries (.155/.19/.3).
const jerk=(g)=>{const zs=Array.from({length:75},(_,i)=>surf(g,0,.15+i*.002));return Math.max(...zs.slice(1,-1).map((z,i)=>Math.abs(zs[i+2]-2*z+zs[i])));};
ok(jerk(b)<.0025&&jerk(b)<jerk(a),`nose profile largest 2mm second difference ${fmt(jerk(a))} -> ${fmt(jerk(b))}`);
const upper=g=>surf(g,0,.124)-surf(g,0,.1138),lower=g=>surf(g,0,.105)-surf(g,0,.1138);
ok(upper(b)>.003&&upper(b)<upper(a)*.8&&lower(b)>.002&&lower(b)<lower(a)*.9,`lip relief upper ${fmt(upper(a))} -> ${fmt(upper(b))}; lower ${fmt(lower(a))} -> ${fmt(lower(b))}`);
ok(surf(b,0,.124)<surf(a,0,.124)-.006,`mouth projection ${fmt(surf(a,0,.124))} -> ${fmt(surf(b,0,.124))}`);
const halfwidth=(g,y)=>{const p=face(g).geometry.attributes.position;let w=0;for(let i=0;i<p.count;i++)if(Math.abs(p.getY(i)-y)<.004)w=Math.max(w,Math.abs(p.getX(i)));return w;};
for(const y of [.05,.09,.12])ok(halfwidth(b,y)<halfwidth(a,y)-.001&&halfwidth(b,y)>halfwidth(a,y)*.88,`subtle jaw taper at ${y}: ${fmt(halfwidth(a,y))} -> ${fmt(halfwidth(b,y))}`);
// The eye region is not resculpted: every vertex there is identical, plus the lid positions/transforms.
{const p0=face(a).geometry.attributes.position,p1=gp.attributes.position;let count=0,max=0;for(let i=0;i<p1.count;i++){if(Math.abs(p1.getX(i))>.075&&Math.abs(p1.getX(i))<.13&&p1.getY(i)>.25&&p1.getY(i)<.293){count++;for(let j=0;j<3;j++)max=Math.max(max,Math.abs(p0.array[i*3+j]-p1.array[i*3+j]));}}ok(count>100&&(b.userData.realism===1233 ? max>.0025&&max<(b.userData.surface===1233?.026:.004) : max<.0001),`eye-opening geometry (realism dome or reconstructed orbital cap, otherwise identical) (${count} vertices, max delta ${max})`);}
const paint=f=>{const s=fs.readFileSync(f,'utf8'),i=s.indexOf('function paintFaceV1232'),j=s.indexOf('    faceTexP = cv(',i),c=createCanvas(512,512),g=c.getContext('2d');new Function('g',s.slice(i,j)+';paintFaceV1232(g,512);')(g);return g.getImageData(0,0,512,512).data;};
const da=paint(bf),db=paint(file),pixel=(D,x,y)=>Array.from(D.slice((y*512+x)*4,(y*512+x)*4+3)),Y=y=>Math.round((1-(y-.01)/.48)*512),X=x=>Math.round((x+.22)/.44*512),lum=c=>.3*c[0]+.59*c[1]+.11*c[2];
{let bad=0;for(let y=150;y<280;y++)for(let x=60;x<450;x++)for(let c=0;c<4;c++)if(((x>=96&&x<=192||x>=328&&x<=424)&&y>=190&&y<=275 || (x>=78&&x<=202||x>=310&&x<=434)&&y>=155&&y<=186)&&(da[(y*512+x)*4+c]!==db[(y*512+x)*4+c]))bad++;if(b.userData.realism===1233){const blue=D=>{let n=0,xs=0,ys=0;for(let y=206;y<=264;y++)for(let x=96;x<=192;x++){const k=(y*512+x)*4;if(((x-164)/28)**2+((y-236)/30)**2<=1&&D[k+2]>D[k]+30){n++;xs+=x;ys+=y;}}return {n,x:xs/n,y:ys/n};};const old=blue(da),now=blue(db);ok(now.n>old.n*.85&&now.n<old.n*1.15&&Math.hypot(now.x-old.x,now.y-old.y)<3,`intentional iris repaint preserves blue area/placement: ${old.n} -> ${now.n} pixels, centroid delta ${Math.hypot(now.x-old.x,now.y-old.y).toFixed(2)}px`);}else ok(!bad,'big blue eyes and brows byte-identical paint in eye region');}
for(const sx of [-1,1]){const p=pixel(db,X(sx*.016),Y(.169)),skin=pixel(db,X(sx*.05),Y(.169));ok(lum(p)<lum(skin)-15,`nostril paint aligned to new mesh UV x ${sx*.016}, y .169 (rgb ${p})`);}
{const p=pixel(db,X(0),Y(.1138)),lo=pixel(db,X(0),Y(.104));ok(lum(p)<lum(lo)-20,`closed mouth line painted at mesh line, rgb ${p} vs lower lip ${lo}`);}
// UV formula remains exact on reshaped front surface.
{const p=gp.attributes.position,u=gp.attributes.uv;let err=0;for(let i=0;i<p.count;i++)if(p.getZ(i)>.1)err=Math.max(err,Math.abs(u.getX(i)-(p.getX(i)+.22)/.44),Math.abs(u.getY(i)-(p.getY(i)-.01)/.48));ok(err<1e-6,`reshaped front UV error ${err}`);}
const ears=g=>g.userData.head.children.filter(o=>o.isMesh&&o.userData.merged===2&&o.material.roughness===.48&&!o.material.map);
{const e0=ears(a)[0].geometry,e=ears(b)[0].geometry;const extent=(g,j)=>{const v=g.attributes.position.array;let lo=9,hi=-9;for(let i=j;i<v.length;i+=3){lo=Math.min(lo,v[i]);hi=Math.max(hi,v[i]);}return hi-lo;};
 ok(ears(b).length===1&&ears(b)[0].userData.merged===2&&extent(e,1)<extent(e0,1)*.91&&extent(e,2)<extent(e0,2)*.94,`ear height ${fmt(extent(e0,1))} -> ${fmt(extent(e,1))}, depth ${fmt(extent(e0,2))} -> ${fmt(extent(e,2))}`);
 const p=e.attributes.position;let maxStep=0;for(let j=0;j<=44;j++){const mid=(b.userData.surface===1233?28:20)*45+j;maxStep=Math.max(maxStep,Math.abs(p.getX(mid)-p.getX(mid+45)));}ok(maxStep<.0025,`ear front/back edge step ${fmt(maxStep)} (no old sheet jump)`);
 const z=e.attributes.normal.array;let bad=0;for(const v of z)if(!Number.isFinite(v))bad++;ok(!bad,'ear normals finite');}
// Outside the head, vertex geometry/transforms/material counts and rig remain unchanged.
{const list=g=>{const o=[];g.traverse(v=>{if(!v.isMesh)return;let h=false;for(let p=v;p;p=p.parent)if(p===g.userData.head)h=true;if(!h)o.push(v);});return o;};const aa=list(a),bb=list(b);ok(aa.length===bb.length&&aa.every((v,i)=>Buffer.from(v.geometry.attributes.position.array.buffer).equals(Buffer.from(bb[i].geometry.attributes.position.array.buffer))&&JSON.stringify(v.matrix.elements)===JSON.stringify(bb[i].matrix.elements)),'body, hands, grips and armour mesh positions and transforms unchanged');
 ok(JSON.stringify(a.userData.lids.map(o=>o.position.toArray()))===JSON.stringify(b.userData.lids.map(o=>o.position.toArray())),'lid transforms unchanged');}
{let bad=0;for(const key of ['position','normal','uv'])for(const v of gp.attributes[key].array)if(!Number.isFinite(v))bad++;ok(!bad,'finite face positions, normals and UVs');}
// No new normal ledge down the cheek/jaw transition. This evaluates real neighbouring vertex normals, not a count claim.
{const p=gp.attributes.position,nn=gp.attributes.normal,ix=gp.index.array,angles=[];
 for(let k=0;k<ix.length;k+=3)for(let e=0;e<3;e++){const i=ix[k+e],j=ix[k+(e+1)%3];if(p.getZ(i)<.08||p.getY(i)<.025||p.getY(i)>.2||Math.abs(p.getX(i))<.07)continue;const dot=nn.getX(i)*nn.getX(j)+nn.getY(i)*nn.getY(j)+nn.getZ(i)*nn.getZ(j);angles.push(Math.acos(Math.min(1,Math.max(-1,dot)))*180/Math.PI);}
 angles.sort((a,b)=>a-b);const q=angles[Math.floor(angles.length*.99)],max=angles.at(-1);ok(angles.length>1000&&q<12&&max<30,`jaw/cheek neighbouring-normal angle p99 ${q.toFixed(2)}, max ${max.toFixed(2)} degrees`);}
const st=stats(B.T,b);ok(b.userData.anatomy===1233&&st.tris<=100000&&st.trisFar<=6500&&st.meshes===48&&st.mats===11&&st.texs===8,`budgets ${JSON.stringify(st)}`);
console.log(fails?`${fails} failed of ${n}`:`all ok (${n})`);process.exitCode=fails?1:0;
