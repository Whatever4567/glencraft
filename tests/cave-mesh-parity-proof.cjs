'use strict';
const assert=require('assert/strict'),h=require('./cave-regression.cjs');
function make(){
 const three=h.minimalThree(), c=h.run(`var W=79,H=72,D=79,CH=26,world=new Uint8Array(79*72*79),T=${JSON.stringify(h.T)},FANCY=true,REAL=false;
 var BLOCK_MATS=[null,{transparent:false,userData:{tmat:true}},null,{water:true},null,null,{stone:true},null,{multi:true}];
 BLOCK_MATS[1]=['a','b','c','d','e','f'];this.__waterCount=0;
 var PLANT={11:1},ENT={},LEAFY={};var crossGeo={cross:true},PLANT_MATS={11:'plant11'},PLANT_H={11:0.83},PLANT_W={11:0.72};
 var waterMat='water-material';
 var chunkST=null,chunkFQ=null,window=this,chunkLists=new Map(),chunkObjs=new Map(),blockGroup=new THREE.Group();
 var __XN=null,__YB=null, __c317mesh=1,__c317mesh_unused=0; var __TA={on:true,mat:'TA-mat',layers(t){return {1:[3,3,1,2,1,1],4:[10,11,12,13,14,15]}[t]}};
 var __caveCull=null; function aboveWorld(){return 0;} function getB(){return 0;} function isPlant(t){return PLANT[t]===1;}
 function buildWaterGeo(A){this.__waterCount=A.length/3;const g=new THREE.BufferGeometry(),n=A.length/3,p=new Float32Array(n*4*3),ind=new Uint16Array(n*6);for(let i=0;i<n;i++)for(let j=0;j<3;j++){p[i*12+j]=A[i*3];p[i*12+3+j]=A[i*3]+1;p[i*12+6+j]=A[i*3]+1;p[i*12+9+j]=A[i*3];}for(let i=0;i<n;i++){ind.set([i*4,i*4+1,i*4+2,i*4,i*4+2,i*4+3],i*6);}g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setIndex(new THREE.BufferAttribute(ind,1));return g;}
 const put=(x,y,z,v)=>world[(x*H+y)*D+z]=v;for(let x=26;x<52;x++)for(let y=0;y<72;y++)for(let z=26;z<52;z++)world[(x*H+y)*D+z]=1;
 for(let x=32;x<47;x++)for(let y=12;y<55;y++)for(let z=32;z<47;z++)world[(x*H+y)*D+z]=0;
 put(29,23,30,4);put(29,24,30,1);put(33,20,33,11);put(33,19,33,1);put(35,20,35,1);put(36,20,35,3);put(35,22,35,4);put(28,24,30,11);put(27,24,30,1);put(30,40,30,4);put(31,42,32,1);
 var times=[];this.__synctime=()=>{const t=performance.now();__bcBase(1,1);times.push(performance.now()-t);return times[times.length-1];};
 `,{T:Object.assign({},h.T),THREE:three,performance:{now(){return this.t||0;},t:0},__time(){} }); // real timing injected explicitly below
 // Rebind instrumentation performance to real after static setup.
 c.performance=performance;
 run('var dummy=0',{},c);
 return c;
}
const run=h.run;
function snapshot(c,k){const g=c.chunkObjs.get(k)||c.meshes?.get(k),rows=[];g.traverse(o=>{if(o.isMesh){const geo=o.geometry,attr={},index={},mat=m=>Array.isArray(m)?m.map(String):m;
 for(const [k,v] of Object.entries(geo.attributes||{})){const ja=JSON.stringify(Array.from(v.array));attr[k]={array:v.array.constructor.name,sha:require('crypto').createHash('sha256').update(ja).digest('hex'),sum:Array.from(v.array).reduce((a,b)=>a+b,0),length:v.array.length,itemSize:v.itemSize,normalized:!!v.normalized};}
 index.array=geo.index?.array.constructor.name;index.BPE=geo.index?.array.BYTES_PER_ELEMENT;index.sha=geo.index?require('crypto').createHash('sha256').update(JSON.stringify(Array.from(geo.index.array))).digest('hex'):null;
 let inst=o.matrices?.map(x=>({q:x.q?.a,s:[x.s?.x,x.s?.y,x.s?.z],p:[x.p?.x,x.p?.y,x.p?.z]}));rows.push({material:mat(o.material),attr,index,drawRange:geo.drawRange||{start:0,count:'Infinity'},groups:JSON.parse(JSON.stringify(geo.groups||[])),renderOrder:o.renderOrder||0,count:o.count,needsUpdate:o.instanceMatrix?.needsUpdate,inst,primitive:geo===c.crossGeo});}});return rows;}
const a=make();
h.run(h.segment("function buildChunk(cx, cz) {","\nvar __bcBase = buildChunk;",h.text.indexOf("var chunkST = null")),{},a);h.run("var __bcBase=buildChunk;",{},a);a.buildChunk(1,1);const expected=snapshot(a,65);assert.equal(expected.length,3);
const b=make();h.run(h.production("function* deepMeshGenerator(","  const pendingLight=new Map()",h.text.indexOf("(function c324()")),{},b);h.run(`window.__step=(job)=>{const gen=deepMeshGenerator(1,1,job);let n=0,tmax=0,out;while(true){const t=performance.now();out=gen.next();const ms=performance.now()-t;tmax=Math.max(tmax,ms);n++;if(out.done)break;}return {out,n,tmax};}`,{},b);
const output=b.__step({rev:1,expiry:Infinity,geo:null});b.chunkObjs.set(65,output.out.value.group);const got=snapshot(b,65);
assert.deepEqual(got,expected,"all buffer hashes/index types/draw groups/materials/plant transforms match");
console.log(JSON.stringify({detailed:got,match:true,objects:got.length,indexTypes:got.map(x=>x.index.array),drawGroups:got.map(x=>x.groups),count:got.map(x=>x.count),syntheticOriginalMs:a.__synctime(),syntheticGenerator:output.tmax}));
