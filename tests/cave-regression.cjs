'use strict';
// Runs production algorithms extracted from index.html. No browser, Playwright or duplicate solver.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const text = fs.readFileSync(__dirname + '/../index.html', 'utf8');
const segment = (a,b,start=0) => {const i=text.indexOf(a,start);assert.ok(i>=0,a);const j=text.indexOf(b,i+a.length);assert.ok(j>=0,b);return text.slice(i,j);};
function context(extra={},src='') {const c=vm.createContext({console,Math,performance,Map,Set,Uint8Array,Int16Array,Int32Array,Float32Array,...extra});new vm.Script(src).runInContext(c);c.window=c;return c;}
const T={AIR:0,STONE:1,TORCH:2,WATER:3,LAVA:4,LAVAB:5,GLOWROCK:6,LAMP:7,QLANTERN:8,FIRE:9,LEAVES:10};
function light(deep,hell=false) {
 const c=context({world0:new Uint8Array(54*6*54)},`var T=${JSON.stringify(T)},CH=26,LEAFY={},chunkST=new Uint8Array(256),DIM={cur:${JSON.stringify(hell?'hell':null)}},W=54,H=6,D=54,world=world0,performance={now:()=>0};`);
 c.__c317mesh=deep;const put=(x,y,z,v)=>c.world[(x*6+y)*54+z]=v;
 for(let x=0;x<54;x++)for(let z=0;z<54;z++)put(x,0,z,T.STONE);
 new vm.Script(segment('  const op = n => n !== 0','  function addAO(grp, cx, cz)')).runInContext(c);
 c.__lightChunk(1,1);return c;
}
function testLighting(){
 const deep=light(true),surface=light(false),hell=light(false,true),cell=c=>c.__caveLightCore.cells(26,1,27);
 assert.equal(cell(deep).sky,0,'deep must get no sunlight through slice top');assert.equal(cell(deep).sampled,0);
 assert.equal(cell(surface).sky,1,'surface keeps skylight');assert.equal(cell(hell).sky,0,'Hell y0 is rock as before');
 for(let x=20;x<=36;x++)deep.world[(x*6+1)*54+27]=0;deep.world[(26*6+1)*54+27]=T.TORCH;deep.__lightChunk(1,1);
 assert.equal(deep.world[(26*6+1)*54+27],T.TORCH,'fixture torch index agrees with solver');const r=deep.__caveRegion(1,1),idx=x=>((x-r.x0)*r.RS+(27-r.z0))*deep.H+1;
 assert.equal(r.B[idx(26)],14,'torch source');assert.equal(r.B[idx(29)],11,'three-block falloff');assert.equal(r.B[idx(35)],5);
 for(let x=12;x<50;x++)surface.world[(x*6+1)*54+27]=0;surface.world[(26*6+1)*54+27]=T.TORCH;surface.__lightChunk(1,1);
 const sr=surface.__caveRegion(1,1),si=x=>((x-sr.x0)*sr.RS+(27-sr.z0))*surface.H+1;assert.equal(sr.B[si(29)],11);
 hell.world[(26*6+1)*54+27]=T.TORCH;hell.__lightChunk(1,1);const hr=hell.__caveRegion(1,1),hi=x=>((x-hr.x0)*hr.RS+(27-hr.z0))*hell.H+1;assert.equal(hr.B[hi(29)],11,'Hell uses same local torch solver, not virtual coordinates');
 // Instrument a full real region including its two flood passes.
 const start=performance.now();deep.__lightChunk(1,1);const ms=performance.now()-start;assert.ok(Number.isFinite(ms)&&ms>=0);console.log('PASS real light solver (deep/surface/Hell + falloff), region',ms.toFixed(2),'ms');
}

function run(src, extra = {}, ctx = null) {
  if (!ctx) ctx = vm.createContext({console, Map, Set, Uint8Array, Int16Array, Int32Array, Float32Array, performance, ...extra});
  else Object.assign(ctx, extra);
  try {new vm.Script(src, {filename:'production-extract.js'}).runInContext(ctx);} catch(e) { e.message += '\n' + src; console.error(src); throw e; }
  ctx.window = ctx;
  return ctx;
}
function production(begin, end, from = 0) {
  const a=text.indexOf(begin,from), b=text.indexOf(end,a+begin.length);
  assert.ok(a>=0 && b>a,`missing production segment: ${begin}`);
  return text.slice(a,b);
}
function measure(n, fn) {const out=[];for(let i=0;i<n;i++){const t=performance.now();fn();out.push(performance.now()-t);}return out;}
function report(a) {a=[...a].sort((x,y)=>x-y);return {n:a.length,medianMs:+a[Math.floor(a.length/2)].toFixed(2),maxMs:+a[a.length-1].toFixed(2)};}

function testDeepEditStore() {
  // The existing C320 serializer and write path remain the source of truth.
  const start = text.indexOf('(function c320()');
  const c = run(`
    var W = 600, H = 10, D = 600, __XZ = 0;
    var T = ${JSON.stringify(T)};
    function getB(x, y, z) { return y >= 0 && y < H ? 7 : 0; }
    function setB() {}
    const on = () => true, foot = (x, z) => x >= 0 && x < W && z >= 0 && z < D;
    var __c318 = {bodies: []};
    const wall = () => false;
    const __c317 = {on: () => true, wall};
  `, {T: Object.assign({}, T), PLANT: {}, __c320: {edits: new Map(), earth: () => 1}});
  const defs = production('  const key = (x, y, z)', '  let GB = null;', start);
  const writes = production('  try { const s0 = setB; setB = function', '  // ---------- drawing: ocean', start);
  run('const U = __c320, earth = U.earth, S7 = () => __c317;' + defs + writes, {}, c);
  c.setB(26, -72, 27, 1);
  assert.deepEqual([...c.__c320.edits], [['26,-72,27', 1]]);
  c.setB(26, -72, 27, 0);
  assert.deepEqual([...c.__c320.edits], [['26,-72,27', 0]], 'mining persists an explicit air edit');
  for (let i = 0; i < 3; i++) c.setB(26, -72, 27, i);
  assert.equal(c.__c320.edits.size, 1, 'delegated deep writes do not duplicate serialized edits');
  assert.ok(text.includes('o.c320 = {v: 1, e: Array.from(U.edits)}'), 'existing save schema retained');
}

function streamSetup() {
  const time = {ticks:0};
  const clock = {now:()=>time.ticks++};
  const E = {flat:true,R:5000,E:()=>[0,0,0],earth:(x,y,z)=>x>=40&&x<44&&z>=40&&z<44?1:0,edits:new Map()};
  const setup = {T:Object.assign({},T),CH:26,W:600,H:100,D:600,SEA:41,__XZ:0,PH:false,performance:clock};
  const MS = [
    [[0,-1,0],[1,0,0],[0,0,1]],[[0,1,0],[-1,0,0],[0,0,1]],
    [[1,0,0],[0,1,0],[0,0,1]],[[1,0,0],[0,-1,0],[0,0,-1]],
    [[1,0,0],[0,0,1],[0,-1,0]],[[1,0,0],[0,0,-1],[0,1,0]]
  ];
  const from = text.indexOf('(function c324()');
  const body = production('  function slab(ax, piv, cx, cz, sy)', '  U.cache = cache;', from)
    + production('  function fill(ax, piv, cx, cz, y0, t1, bud)', '  // Fill can stop after each slab', from)
    + 'return {U,Earth:E(),cache,slab,fill,_partial:partial,clock:time,invalidate:()=>{eV=-1;},TMP:()=>TMP};';
  const source = `(function(T,CH,W,H,D,SEA,__XZ,performance,MS,E,mockTime) {
    const time = {ticks:0};
  const PH=false,C=CH,PW=3*C+1,NB=72,SL=8,SW=C+2;
    let TMP=null,partial=new Map(),eV=-1,eL=[];
    const eB={k:null,v:null,m:null},cache=new Map(),U={deferred:0,gen:0};
    ${body}
  })`;
  return vm.runInNewContext(source, {}, {filename:'production-c324-extract.js'})(
    Object.assign({},T),26,600,100,600,41,0,clock,MS,()=>E,time);
}

function testStreaming() {
  const c = streamSetup(), E = c.Earth, piv = [0, 0, 0];
  const key = (cx, cz) => `2|0,0,0|${cx},${cz},-72`;
  const cell = (x,y,z) => (x*72+y)*79+z;
  c.slab(2, piv, 0, 0, -72);
  assert.equal(c.U.gen, 1);
  c.slab(2, piv, 0, 0, -72);
  assert.equal(c.U.gen, 1, 'cached slabs do not regenerate');
  c.cache.clear(); c.U.gen = 0;
  assert.equal(c.fill(2, piv, 0, 0, -72, 0, 0), null);
  assert.equal(c.U.gen, 1, 'one whole slab is allowed to finish');
  c.clock.ticks = 5;
  assert.equal(c.U.deferred, 1);
  assert.equal(c._partial.get(key(0, 0)).done, 8);
  assert.equal(c.U.gen, 1, 'expired budget does not start another slab');
  c.fill(2, piv, 0, 0, -72, c.clock.ticks, Infinity);
  assert.equal(c.U.gen, 9);
  assert.equal(c._partial.size, 0);
  const resumed = c.TMP().slice();

  c.cache.clear(); c.clock.ticks = 0;
  c.fill(2, piv, 0, 0, -72, 0, Infinity);
  assert.deepEqual(Array.from(c.TMP()), Array.from(resumed), 'resuming produces the same real cells as one-shot fill');
  c.cache.clear(); c._partial.clear(); c.clock.ticks = 1; c.U.gen = 0;
  assert.equal(c.fill(2, piv, 0, 0, -72, c.clock.ticks, 1), null);
  const inProgress = c._partial.get(key(0, 0));
  c.fill(2, piv, 1, 1, -72, c.clock.ticks, 1);
  assert.notEqual(c._partial.get(key(1, 1)).data, inProgress.data, 'pending chunks own independent buffers');
  assert.equal(c._partial.size, 2);
  for (let x = 2; x <= 40; x++) {
    c.clock.ticks = 1 + x;
    c.fill(2, piv, x, 0, -72, 0, 0);
  }
  assert.equal(c._partial.size, 32, 'cancelled view tasks retain at most 33 x 448KiB (including active job)');
  c.fill(2, piv, 0, 0, -72, 0, Infinity);
  c.invalidate();
  E.edits.set('40,-70,42', 7);
  c.fill(2, piv, 1, 1, -72, 0, Infinity);
  assert.equal(c.TMP()[cell(40,2,42)], 7, 'deep edit maps to the real local mesh cell');
  const earth = E.earth;
  E.earth = (...args) => earth(...args) + 3;
  c.cache.clear();
  c.invalidate(); E.edits.set('40,-70,42',0);
  c.fill(2, piv, 1, 1, -72, 0, Infinity);
  assert.equal(c.TMP()[cell(40,2,42)], 0, 'explicit air survives changing cave generation');
  assert.deepEqual([...E.edits], [['40,-70,42', 0]], 'remeshing does not mutate saved edits');
  // A planetary pivot is essential: off-ground transformed coordinates must stay outside the surface world.
  c.invalidate(); c.cache.clear(); c._partial.clear(); c.clock.ticks=0;
  // No artificial world edits are asserted here; check the actual supplied empty slice.
  c.fill(1,[5000,300,-5000],0,0,-72,0,Infinity);
  assert.equal(c._partial.size,0,'planetary transformed cave generation completes with its void edit bucket');
  E.edits.set('-2,-66,42',7); // remains a valid above-ground base edit in the overworld; no reset here

  const times = measure(12, () => {
    const x = Math.floor(Math.random() * 10000) - 5000;
    c.cache.clear();
    c.slab(2, piv, x, -x, -72);
  });
  console.log('PERF production slab generation, flat synthetic', report(times));
}

function testDirtyAndBudget() {
  const c = run('const CH=26,W=600,D=600; var dirtyAll=false; const dirtyCh=new Set();');
  run(production('function markDirty(x, z) {', 'function rebuildAll()')+'this.dirtyCh=dirtyCh;', {}, c);
  c.markDirty(16, 40);
  assert.deepEqual(Array.from(c.dirtyCh).sort((a,b)=>a-b), [1,2,65,66], 'light margin reaches the next chunk in each needed direction');
  c.dirtyCh.clear(); c.markDirty(29,26);
  assert.deepEqual(Array.from(c.dirtyCh).sort((a,b)=>a-b), [0,1,64,65], 'LM=14 reaches the next chunk beyond the bottom seam');
  c.dirtyCh.clear(); c.markDirty(38,64);
  assert.deepEqual(Array.from(c.dirtyCh).sort((a,b)=>a-b), [1,2,3,65,66,67,129,130,131], 'matches the 14-block light radius, including diagonal neighbors');
  // Evaluate the real Y-1 wrapper, but observe its exact markDirty calls.
  const wrapper=production('  try { const s0 = setB; setB = function', '})();', text.indexOf('(function c371()'));
  const calls=[];
  const seam = run(`var CH=26,W=600,D=600;var setB=()=>{};function markDirty(x,z){calls.push([x,z]);}${wrapper}`,{calls});
  seam.setB(26,-1,50,1);
  assert.deepEqual(Array.from(calls, v=>Array.from(v)), [[26,50],[25,50]], 'own plus west seam only; no Z-boundary calls');
  assert.deepEqual(calls.filter(v=>v[0]===25).length,1,'cross-seam west update invoked once');

  for (const streaming of [false]) {
    const from=streaming?text.indexOf('rebuild = function (budget)'):text.indexOf('function rebuild(budget)');
    const fn=production(streaming?'rebuild = function (budget)':'function rebuild(budget)','  const all = {};',from).replaceAll('performance.now()', 'clock.next()')+'}';
    const clock={values:[0,2,2,2],next(){return this.values.length?this.values.shift():2;}};
    const c=run(`var W=600,D=600,CH=26,blockGroup={remove(){}};
      var dirtyCh=new Set([0,1,2]),chunkObjs=new Map(),chunkLists=new Map();
      var dirtyAll=false,P={x:1,z:1},STREAM_R=4;
      var streamRadius=()=>4,streamT=0,__lightStats=()=>({avg:2});
      var loadErr=()=>{},buildChunk=id=>buildTimes.push(id);
      this.dirtyCh=dirtyCh;${fn}`,{clock,buildTimes:[],T:Object.assign({},T)});
    for(let remaining=2;remaining>=0;remaining--) {
      clock.values=[0,2,2,2];c.rebuild(2);
      assert.equal(c.dirtyCh.size,remaining,`true light estimator, ${streaming?'stream':'normal'} iteration ${2-remaining}`);
    }
  }

}

function minimalThree() {
  class Attribute { constructor(array, itemSize) { this.array=array;this.itemSize=itemSize;this.count=array.length/itemSize;this.normalized=(array instanceof Int8Array||array instanceof Uint8Array||array instanceof Int16Array||array instanceof Uint16Array); } }
  class Geometry { constructor(){this.attributes={};this.groups=[];}setAttribute(name,a){this.attributes[name]=a;return this;}setIndex(a){this.index=a instanceof Attribute?a:new Attribute(a,1);return this;}computeBoundingSphere(){} addGroup(start,count,materialIndex){this.groups.push({start,count,materialIndex});}dispose(){this.disposed=true;this.disposeCount=(this.disposeCount||0)+1;} }
  class Mesh { constructor(g,m){this.geometry=g;this.material=m;this.userData={};this.children=[];this.isMesh=true;this.frustumCulled=true;}dispose(){this.disposed=true;} }
  class Group { constructor(){this.children=[];this.userData={};this.position={set(x,y,z){this.x=x;this.y=y;this.z=z;}};this.quaternion={copy(){}};}updateMatrixWorld(){}add(g){this.children.push(g);return this;}traverse(fn){fn(this);for(const g of this.children)if(g.traverse)g.traverse(fn);else fn(g);}remove(g){this.children.splice(this.children.indexOf(g),1);} }
  class InstancedMesh extends Mesh{constructor(g,m,n){super(g,m);this.isInstancedMesh=true;this.count=n;this.matrices=[];this.instanceMatrix={needsUpdate:false};}setMatrixAt(i,m){this.matrices[i]=m;}}
  class Matrix4{makeBasis(){return this;}compose(p,q,s){this.p=p;this.q=q;this.s=s;return this;}} class Quaternion{setFromRotationMatrix(){return this;}setFromAxisAngle(up,a){this.a=a;return this;}} class Vector3{constructor(x,y,z){this.x=x;this.y=y;this.z=z;}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}}
  return {Group,Mesh,InstancedMesh,BufferGeometry:Geometry,BufferAttribute:Attribute,Matrix4,Quaternion,Vector3};
}
function testFullDeepMesh() {
  const c = run(`
    var W=79,H=72,D=79,CH=26,world=new Uint8Array(W*H*D);
    var T=${JSON.stringify(T)},FANCY=true,REAL=false;
    var PLANT={},ENT={},LEAFY={},BLOCK_MATS={};
    var chunkST=null,chunkFQ=null,window=this;
    var chunkObjs=new Map(),chunkLists=new Map(),blockGroup=new THREE.Group();
    const isPlant=()=>false,buildWaterGeo=()=>null;
    var __XN=null,__YB=null;
    const PW=79,NB=72,C=26;
    const U={meshed:0};var meshes=new Map();this.inspectMeshes=meshes;const root=new THREE.Group();
    const errors=[];this.testErrors=errors;
    const ERR=(where,e)=>{errors.push([where,e.message,e.stack]);};
    const drop=()=>{};
    const surfaceWorld=new Uint8Array([1,2,3]);
    const originalCull=()=>null;this.originalCull=originalCull;
    __caveCull=originalCull;
    const material={transparent:false,userData:{tmat:true}};
    BLOCK_MATS[1]=material;
    const put=(x,y,z,v)=>world[(x*H+y)*D+z]=v;
    for(let x=26;x<52;x++)for(let z=26;z<52;z++)put(x,10,z,1);
    put(39,11,39,2);
    for(let x=26;x<52;x++)for(let y=0;y<72;y++)put(x,y,26,1);
    this.slice=world.slice();
  `, {T:Object.assign({},T),THREE:minimalThree(),DIM:{cur:null},__c317mesh:1});
  run(segment('function buildChunk(cx, cz) {','\nvar __bcBase = buildChunk;',text.indexOf('var chunkST = null')),{},c);
  run('var __bcBase=buildChunk;',{},c);assert.ok(c.__bcBase);
  run(production('  const op = n => n !== 0','  function addAO(grp, cx, cz)'),{patched:new Set([c.material]),AOL:[0,.16,.27,.38]},c);
  run(production('  function addAO(grp, cx, cz)', '  // ---- shadows (Realistic)'), {patched:new Set([c.material])}, c);
  c.__caveLightBake=c.addAO;
  run(production('  function mesh(ax, piv, cx, cz, y0, fk, data)', '  U.mesh = mesh;',text.indexOf('(function c324()')),{},c);
  const t=performance.now();
  c.mesh(2,[0,0,0],0,0,-72,1,c.slice);
  console.log('PERF actual stream mesh + light bake, synthetic cavity', +(performance.now()-t).toFixed(2),'ms');
  const worldBefore=c.world;
  c.__c317mesh=1;
  run('world.fill(T.STONE);__bcBase(1,1);__c317mesh=0;',{},c);
  c.world=worldBefore;
  assert.equal(c.chunkObjs.get(65).children.length,0,'closed virtual X/Z/Y edges emit no accidental outer slice faces');
  c.testErrors.length=0;
  const deep=c.inspectMeshes.get('0,0');
  assert.ok(deep&&deep.children.length,'actual stream function emits visible cave geometry');
  const attrs=deep.children[0].geometry.attributes;
  assert.ok(attrs.litB.array.some(v=>v>100),'real torch lights real baked deep geometry');
  assert.ok(attrs.litB.array.some(v=>v===0),'dark cave geometry remains unlit');
  assert.ok(attrs.litS.array.every(v=>v===0),'no sky leaks through deep slice top');
  assert.ok(c.__lightStats().n>=1,'actual stream mesh populates production performance instrumentation');
  assert.equal(c.__c317mesh,0,'deep-mesh flag restored');
  assert.equal(c.__deepMeshY0,undefined,'temporary base coordinate flag removed');
  assert.equal(c.__caveCull,c.originalCull,'surface culling restored');
  assert.equal(c.W,79);assert.equal(c.H,72);assert.equal(c.D,79);
  assert.equal(c.testErrors.length,0,'successful actual mesh/bake reports no error');
  const sentinel=c.chunkObjs.get(65);
  c.testErrors.length=0;
  c.__bcBase=()=>{throw new Error('deliberate test failure');};
  assert.doesNotThrow(()=>c.mesh(2,[0,0,0],0,0,-72,1,c.world),'mesh reports exception through real handler');
  assert.equal(c.testErrors.at(-1)[0],'bc','world flags restored through real error handler');
  assert.equal(c.__deepMeshY0,undefined);
  assert.equal(c.chunkObjs.get(65),sentinel,'surface-group reference retained on exception');
  console.log('PASS actual stream mesh, torch lighting, sealed sky and safe world restoration');
}



function deepFixture(kind){
 const c=run(`var W=79,H=72,D=79,CH=26,world=new Uint8Array(W*D*H),T=${JSON.stringify(T)},FANCY=true,REAL=false;var PLANT={},ENT={},LEAFY={},BLOCK_MATS={},patched=new Set(),chunkST=null,chunkFQ=null,chunkObjs=new Map(),chunkLists=new Map(),blockGroup=new THREE.Group(),window=this;var __XN=null,__YB=null,__c317mesh=0;var C=26,PW=79,NB=72,band=-72,fPiv='2:0,0,0';const U={meshed:0,generation:1},root=new THREE.Group();this.meshes=new Map();U.dirty=new Set();const drop=k=>{const g=meshes.get(k);if(g){root.remove(g);disposeLight(g);meshes.delete(k);U.dirty.delete(k);}};const DIM={cur:null};const isPlant=()=>false,buildWaterGeo=()=>null;const originalCull=()=>null;__caveCull=originalCull;this.roots=root;const errors=[];this.on=()=>!window.__c317mesh&&!window.DIM.cur&&W>=600;this.testErrors=errors;const ERR=(where,e)=>{errors.push([where,e.stack]);};const BLOCK_MAT0={transparent:false,userData:{tmat:true}};BLOCK_MATS[1]=BLOCK_MAT0;
  // Dense actual C324 cavity with six-direction exposed planes, marginal emissive and ordinary material.
  for(let x=25;x<54;x++)for(let z=25;z<54;z++)for(let y=0;y<72;y++)world[(x*H+y)*D+z]=T.STONE;
  for(let x=34;x<45;x++)for(let z=34;z<45;z++)for(let y=19;y<62;y++)world[(x*H+y)*D+z]=0;
  world[(39*H+20)*D+39]=2;world[(12*H+35)*D+39]=7;this.slice=world.slice();`,{T:Object.assign({},T),THREE:minimalThree(),DIM:{cur:null},__c317mesh:0});
 run(segment('function buildChunk(cx, cz) {','\nvar __bcBase = buildChunk;',text.indexOf('var chunkST = null')),{},c);run('var __bcBase=buildChunk;',{},c);
 run(segment('  const op = n =>','  function addAO(grp, cx, cz)')+segment('  function addAO(grp, cx, cz)','  // ---- shadows (Realistic)'),{},c);c.__caveLightBake=c.addAO;

 const orig=production('  function mesh(ax, piv, cx, cz, y0, fk, data)','function* deepMeshGenerator(',text.indexOf('(function c324()')),inc=production('function* deepMeshGenerator(','  U.meshIncremental=beginLight;',text.indexOf('(function c324()'))+'U.pendingJob=()=>pendingLight.values().next().value||null;U.lightEpoch=()=>lightEpoch;U.lightKeys=()=>[...pendingLight.keys()];';
 run(' const partial=new Map();'+orig+'this.beginSync=mesh;'+inc+'this.U=U;this.cull=__caveCull;window.enter=beginLight;window.advance=resumeLight;window.abandon=abandonLight;',{},c);
 if(kind==='aoFail')run('const realAO=window.__deepAOStep;window.__deepAOStep=(...a)=>{if(window.__AO_THROW__)throw new Error("deliberate incremental AO failure");return realAO(...a);};',{},c);
 if(kind==='sync'){const m=c.meshes;run('var __bcBase=buildChunk;'+orig+'window.beginSync=mesh;window.U=U;',{},c);}return c;
}
function arrays(g){const out=[];for(const m of g.children){const a=m.geometry?.attributes;if(!a)continue;const x={};for(const k of Object.keys(a))x[k]=Array.from(a[k].array);out.push(x);}return out;}
function testDeepIncrementalLifecycle(){
  const c=deepFixture('inc');run('window.__TA={on:true,mat:BLOCK_MAT0,layers:t=>[0,1,2,3,4,5]};',{},c);
  const old=new c.THREE.Group();c.meshes.set('0,0',old);c.roots.add(old);
  assert.equal(c.enter(2,[0,0,0],0,0,-72,1,c.slice),false);assert.equal(c.meshes.get('0,0'),old);
  const stamp=()=>({world:c.world,W:c.W,H:c.H,D:c.D,cm:c.__c317mesh,cd:c.__deepMeshY0,cc:c.__caveCull}),initial=stamp();
  const times=[],phaseMax={};let maxGeo=0,last=null,calls=0,start=performance.now();
  while(c.meshes.get('0,0')===old){
    const wasGeo=!last||!last.g,phase=last&&last.light?.phase,t=performance.now(),native=c.__caveLightBuffers?.();
    const done=c.advance('0,0',t,1),ms=performance.now()-t;
    if(wasGeo)maxGeo=ms;else{times.push(ms);const key=phase===undefined?'allocation':['top','sky-seed','sky-flood','block-seed','block-flood','AO'][phase];phaseMax[key]=Math.max(phaseMax[key]||0,ms);}
    assert.deepEqual(stamp(),initial,'all world/cull/slice globals restored after each tick');if(native&&c.__caveLightBuffers)for(const key of ['S','B','Q','H','x0','z0','top'])assert.equal(c.__caveLightBuffers()[key],native[key],'native queue/region globals restored after each yield');
    if(!done){assert.equal(c.meshes.get('0,0'),old,'old scene retained while exact base meshing yields');assert.equal(c.roots.children.includes(last?.g),false,'suspended group remains private');}
    last=c.U.pendingJob();assert.ok(++calls<1000,'job needs finite progress');assert.equal(c.testErrors.length,0);
  }
  const ref=deepFixture('sync');run('window.__TA={on:true,mat:BLOCK_MAT0,layers:t=>[0,1,2,3,4,5]};',{},ref);
  const t2=performance.now();ref.beginSync(2,[0,0,0],0,0,-72,1,ref.slice);const syncMs=performance.now()-t2,incMs=performance.now()-start;
  assert.deepEqual(arrays(c.meshes.get('0,0')),arrays(ref.meshes.get('0,0')),'actual packed whole-group buffers match synchronous baseline');
  // Cancellation after field preparation owns/disposes every geometry, retains old scene,
  // and never permits a stale job to republish. A world identity change does the same.
  assert.equal(c.enter(2,[0,0,0],0,0,-72,1,c.slice),false);
  while(c.U.pendingJob()&&(!c.U.pendingJob().g||!c.U.pendingJob().light)){c.advance('0,0',performance.now(),1);assert.ok(++calls<3000);}
  const j=c.U.pendingJob(),geos=[],oldPublished=c.meshes.get('0,0');j.g.traverse(o=>{if(o.geometry)geos.push(o.geometry);});
  c.abandon('0,0');assert.ok(geos.length&&geos.every(g=>g.disposed&&g.disposeCount===1));assert.equal(j.g,null);assert.equal(j.light,null);assert.equal(j.data,null);assert.equal(c.meshes.get('0,0'),oldPublished);assert.deepEqual(stamp(),initial);
  assert.equal(c.enter(2,[0,0,0],0,0,-72,1,c.slice),false);const alien=c.U.pendingJob();alien.world=null;
  assert.doesNotThrow(()=>c.advance('0,0',performance.now(),1));assert.equal(c.U.pendingJob(),null);assert.equal(c.meshes.get('0,0'),oldPublished);
  // Edit and dimension invalidation must release the unfinished private group, retain the
  // old scene, and prevent a subsequent callback from publishing an obsolete epoch.
  for(const condition of ['editEpoch','dimensionChange']){
    const invalid=deepFixture('inc'),visible=new invalid.THREE.Group();invalid.meshes.set('0,0',visible);invalid.roots.add(visible);
    const changedBand=new vm.Script('band;').runInContext(invalid);invalid.enter(2,[0,0,0],0,0,changedBand,1,invalid.slice);
    while(invalid.U.pendingJob()&&!invalid.U.pendingJob().g)invalid.advance('0,0',performance.now(),1);
    const abandoned=invalid.U.pendingJob(),oldEpoch=abandoned.epoch,geo=[];abandoned.g.traverse(o=>{if(o.geometry)geo.push(o.geometry);});
    if(condition==='editEpoch'){
      run("lightEpoch++;for(const k of [...pendingLight.keys()])abandonLight(k);",{},invalid);
      assert.equal(invalid.U.lightEpoch(),oldEpoch+1,'edit epoch advanced through actual production guard');
    }else{
      invalid.DIM.cur='hell';run("for(const k of [...pendingLight.keys()])abandonLight(k);",{},invalid);
      invalid.DIM.cur=null;
    }
    assert.equal(invalid.U.pendingJob(),null);assert.equal(invalid.meshes.get('0,0'),visible);assert.equal(abandoned.g,null);assert.equal(abandoned.light,null);assert.equal(abandoned.data,null);assert.ok(geo.every(g=>g.disposed&&g.disposeCount===1));
    assert.doesNotThrow(()=>invalid.advance('0,0',performance.now(),1),'disposed stale job cannot republish');
    assert.equal(invalid.meshes.get('0,0'),visible);
  }
  // Deliberately fail the new AO work, not a stub of the light algorithm.
  const failing=deepFixture('aoFail'),published=new failing.THREE.Group();failing.meshes.set('0,0',published);failing.roots.add(published);
  const native=failing.__caveLightBuffers(),initialNative={};for(const key of ['S','B','Q','H','x0','z0','top','flood'])initialNative[key]=native[key];
  failing.enter(2,[0,0,0],0,0,-72,1,failing.slice);
  const bad=failing.U.pendingJob();let guard=0;while((!bad.light||bad.light.phase!==5)&&++guard<200)failing.advance('0,0',performance.now(),1);assert.equal(bad.light?.phase,5,'prepared completed light field before AO fault');
  failing.__AO_THROW__=true;failing.advance('0,0',performance.now(),1);
  assert.equal(failing.meshes.get('0,0'),published,'AO exception retains old published scene');
  assert.equal(failing.testErrors.at(-1)[0],'light','real incremental error handler catches AO exception');assert.equal(bad.g,null);assert.equal(bad.light,null);assert.equal(bad.data,null);assert.equal(bad.buf,null);
  const failedNative=failing.__caveLightBuffers();for(const key of Object.keys(initialNative)){if(key==='top')assert.deepEqual(Array.from(failedNative[key]),Array.from(initialNative[key]),'native top values restored after exception');else assert.equal(failedNative[key],initialNative[key],'native field identity restored after exception '+key);}
  // A failure before the bare geometry returns must still capture/dispose its private group.
  const failedGeo=deepFixture('inc'),oldGeo=new failedGeo.THREE.Group();failedGeo.meshes.set('0,0',oldGeo);failedGeo.roots.add(oldGeo);failedGeo.enter(2,[0,0,0],0,0,-72,1,failedGeo.slice);
  const failedJob=failedGeo.U.pendingJob(),checkDispose=new c.THREE.BufferGeometry();
  failedGeo.advance('0,0',performance.now(),1);while(!failedJob.g)failedGeo.advance('0,0',performance.now(),1);failedJob.g.add(new failedGeo.THREE.Mesh(checkDispose,failedGeo.BLOCK_MATS[1]));failedGeo.__deepLightStep=()=>{throw new Error('deliberate incremental geometry publication failure');};failedGeo.advance('0,0',performance.now(),1);
  assert.equal(failedGeo.meshes.get('0,0'),oldGeo,'partial geometry exception leaves prior mesh');assert.equal(checkDispose.disposed,true,'private geometry disposed on geometry exception');assert.equal(failedJob.g,null);assert.match(failedGeo.testErrors.at(-1)[1],/deliberate incremental geometry publication failure/);assert.equal(failedGeo.testErrors.at(-1)[0],'light');
  // Empty source has the same retired-mesh/null publication semantics as synchronous mesh.
  const empty=deepFixture('inc'),emptyOld=new empty.THREE.Group();empty.roots.add(emptyOld);empty.meshes.set('0,0',emptyOld);assert.equal(empty.enter(2,[0,0,0],0,0,-72,0,empty.slice),true);assert.equal(empty.meshes.get('0,0'),null);assert.equal(emptyOld.children.length,0);assert.equal(empty.U.pendingJob(),null,'empty source leaves no perpetual light job');
  const plain=deepFixture('inc');const plainOld=new plain.THREE.Group();plain.meshes.set('0,0',plainOld);plain.roots.add(plainOld);plain.enter(2,[0,0,0],0,0,-72,1,plain.slice);while(plain.meshes.get('0,0')===plainOld)plain.advance('0,0',performance.now(),1);const plainRef=deepFixture('sync');plainRef.beginSync(2,[0,0,0],0,0,-72,1,plainRef.slice);assert.deepEqual(arrays(plain.meshes.get('0,0')),arrays(plainRef.meshes.get('0,0')),'ordinary actual material full group also matches');
  console.log('PASS actual packed async-vs-sync arrays + lifetime', {maxLightMs:+Math.max(...times).toFixed(2),phases:phaseMax,geometryResidualMs:+maxGeo.toFixed(2),synchronousMs:+syncMs.toFixed(2),incrementalMs:+incMs.toFixed(2)});
}
function testIncrementalLightingEquality(){
 for(const mode of ['surface','deep','hell']){
  const deep=mode==='deep',hell=mode==='hell';
  const mk=()=>run(`var W=79,H=72,D=79,CH=26,world=new Uint8Array(W*H*D),performance={now:()=>0},T=${JSON.stringify(T)},FANCY=true,REAL=false,PLANT={},ENT={},LEAFY={},patched=new Set(),chunkST=new Uint8Array(256),window=this;__c317mesh=${deep?1:0};`,{DIM:{cur:hell?'hell':null},THREE:minimalThree()});
  const group=c=>{const g=new c.THREE.Group(),geo=new c.THREE.BufferGeometry(),pos=[],normal=[],uv=[];for(let x=26;x<52;x+=2)for(let z=26;z<50;z+=2){const y=8+((x+z)%27);pos.push(x,y,z,x+1,y,z,x+1,y,z+1,x,y,z+1);for(let i=0;i<4;i++){normal.push(0,1,0);uv.push(0,0);}}geo.setAttribute('position',new c.THREE.BufferAttribute(new Float32Array(pos),3));geo.setAttribute('normal',new c.THREE.BufferAttribute(new Float32Array(normal),3));geo.setAttribute('uv',new c.THREE.BufferAttribute(new Float32Array(uv),2));g.add(new c.THREE.Mesh(geo,{transparent:false,userData:{tmat:true}}));return g;};
  const field=()=>{const c=mk();for(let x=12;x<67;x++)for(let z=12;z<67;z++)for(let y=0;y<72;y++)c.world[(x*72+y)*79+z]=((x*13+z*7+y*3)%53===0)?T.TORCH:T.STONE;for(let x=18;x<62;x++)for(let z=18;z<62;z++)for(let y=1;y<71;y++)if((x*23+y*7+z*19)%11<6)c.world[(x*72+y)*79+z]=0;putSources(c);return c;};
  const putSources=c=>{for(const [x,z,v] of [[12,39,T.LAMP],[65,39,T.QLANTERN],[39,12,T.GLOWROCK],[39,65,T.TORCH]])c.world[(x*72+33)*79+z]=v;};
  const base=field();run(segment('  const op = n =>','  function addAO(grp, cx, cz)')+segment('  function addAO(grp, cx, cz)','  // ---- shadows (Realistic)')+'\nwindow.__caveLightBake=addAO;',{},base);
  const expected=base.__caveRegion(1,1),g1=group(base);base.__g1=g1;base.__lightChunk(1,1);base.__caveLightBake(g1,1,1);
  const c=field();run(segment('  const op = n =>','  function addAO(grp, cx, cz)'),{},c);
  const job=c.__deepLightJob(1,1);let calls=0;while(job.phase!==5){c.__deepLightStep(job,performance.now(),0.25);assert.ok(++calls<2000);}
  assert.deepEqual(Array.from(job.S),Array.from(expected.S),mode+' full private/padded sky equality');assert.deepEqual(Array.from(job.B),Array.from(expected.B),mode+' full private/padded block equality');assert.deepEqual(Array.from(job.top),Array.from(expected.top),mode+' top-margin snapshot equality');
  const g2=group(c);let aoCalls=0;while(!c.__deepAOStep(job,g2,performance.now(),0.25)){assert.ok(aoCalls<10000);}assert.ok(g2.children[0].geometry.attributes.aoD);
  for(const key of ['aoD','wetE','litS','litB'])assert.deepEqual(Array.from(g2.children[0].geometry.attributes[key]&&g2.children[0].geometry.attributes[key].array),Array.from(g1.children[0].geometry.attributes[key]&&g1.children[0].geometry.attributes[key].array),mode+' exact AO '+key);
  // Check that an ordinary light-region call passes byte-for-byte when only discovering new jobs.
  const top=c.__deepLightJob(1,1),before=c.__caveRegion(1,1);c.__deepLightStep(top,0,0);assert.equal(top.top.every(v=>v===0),false);const beforeStep=Array.from(top.S);c.__lightChunk(1,1);assert.deepEqual(Array.from(top.S),beforeStep,"ordinary foreground lighting cannot alter private data");const after=c.__caveRegion(1,1);assert.deepEqual(Array.from(after.S),Array.from(expected.S),'public calls restore/overwrite normal light state '+mode);
  console.log('PASS exact incremental lighting/AO equality',mode,'bounded phase calls',calls,'AO meshes',job.mesh);
 }
}
function requiresBaseConfirmation(fragment){
 assert.match(fragment,/resetNo'\)\.addEventListener\('click', e => \{ e\.preventDefault\(\); closeAsk\(\); \}\)/);
 assert.match(fragment,/resetYes'\)\.addEventListener\('click'[^\n]*else window\.__c105\.start\(\);/);
 assert.match(fragment,/askBtns\(\)\[0\]\.focus\(\)/);
 return true;
}
function resetFixture(continuation){
 const timers=[],calls={n:0},three=minimalThree(),privateGeometry=[];
 three.InstancedMesh=class extends three.Mesh{constructor(g,m,n){super(g,m);this.count=n;this.isInstancedMesh=true;this.instanceMatrix={needsUpdate:false};this.matrices=[];}setMatrixAt(i,m){this.matrices[i]=m;}};
 const c=vm.createContext({console,Map,Set,Uint8Array,Int16Array,Int32Array,Float32Array,Uint32Array,Math,Date,performance,
  navigator:{userAgent:''},THREE:three,T:Object.assign({},T),DIM:{cur:null},__c317mesh:0,
  W:79,H:72,D:79,CH:26,SEA:41,PH:false,DEFAULT_R:5,P:{x:39,y:20,z:39},
  PLANT:{},ENT:{},LEAFY:{},patched:new Set(),BLOCK_MATS:[null,{transparent:false,userData:{tmat:true}}],
  chunkST:new Uint8Array(256),chunkFQ:null,chunkObjs:new Map(),chunkLists:new Map(),blockGroup:new three.Group(),scene:new three.Group(),
  started:true,dead:false,current:{id:'same-slot'},seed:0,__TA:null,__c309:{on:false},
  seedValue:1,sourceVersion:1,
  __c105:{phase:null,start(){
   if(this.phase||!c.started||c.dead||!c.current)return;
   calls.n++;if(continuation)return continuation.call(this);c.__c105.phase='gen';
  }},
  __c317:{on:()=>true},__c321:{ax:2,piv:[0,0,0],pw:()=>({x:39,y:20,z:39})},
  world:new Uint8Array(0),FANCY:true,REAL:false,DIRL:{},MODE:{},mobs:[],drops:[],armour:[],inv:{},flying:false,vf:()=>96,
  renderer:{render:()=>{}},updatePlayer:()=>{},updateSky:()=>{},setB:()=>{},getB:()=>T.AIR,isPlant:()=>false,
  buildWaterGeo:()=>null,waterMat:{},crossGeo:{},PLANT_MATS:{},PLANT_H:{},PLANT_W:{},
  setInterval(fn){timers.push(fn);},setTimeout(){},clearInterval(){},clearTimeout(){}});
 c.window=c;
 const BaseGeometry=three.BufferGeometry;
 three.BufferGeometry=class extends BaseGeometry{constructor(){super();privateGeometry.push(this);}};
 three.Matrix4=class{makeBasis(){return this;}compose(){return this;}};
 three.Quaternion=class{setFromRotationMatrix(){return this;}setFromAxisAngle(){return this;}};
 three.Vector3=class{constructor(x,y,z){this.x=x;this.y=y;this.z=z;}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}};
 three.Vector4=class{set(){}};
 const lightHelpers=production('  const op = n => n !== 0','  // ---- shadows (Realistic)');
 const source=production('  const U = window.__c324','  // no grey ground fog',text.indexOf('(function c324()'));
 new vm.Script(lightHelpers+`
   var __XZ=0,__XN=null,__YB=null,streamT=0;
   var __c320={edits:new Map(),dirty:0,E:()=>[300,-4900,300],R:5000,flat:true,
    earth(x,y,z){return sourceVersion===1?1:((x+y+z+seedValue)%3?1:0)},
    alt:()=>40,ground:()=>[10,1],layer:()=>T.STONE,space:()=>false};`).runInContext(c);
 new vm.Script(source+`
   window.__cache=cache;window.__partial=partial;window.__siteMeshes=meshes;
   window.__stale=stale;U.root=root;
   window.__bands=()=>({band,TMP,meshHost,eV,eL,eB});window.__resetStart=__c105.start;window.__inspectJob=k=>pendingLight.get(k);`,
  {filename:'real-reset-c324.js'}).runInContext(c);
 c.__timers=timers;c.__calls=calls;c.__privateGeometry=privateGeometry;return c;
}
function TickEach(ctx){for(const fn of ctx.__timers)fn();assert(!ctx.__c324.err,ctx.__c324.err);}
function testCaveResetGenerationInvalidation(){
 const c=resetFixture(),privateGeometry=c.__privateGeometry;assert.equal(c.__calls.n,0,'initialization never calls reset');
 for(let pass=0;pass<2;pass++)for(const fn of c.__timers)fn();
 const U=c.__c324,initialGeneration=U.generation;
 assert.equal(initialGeneration,2);assert.ok(c.__cache.size>0);
 c.world=new Uint8Array(1);for(const fn of c.__timers)fn();const currentGeneration=U.generation;
 assert.equal(currentGeneration,initialGeneration+1,'actual world identity change advances once');
 for(const fn of c.__timers)fn();assert.equal(U.generation,currentGeneration,'normal scheduler ticks never reset');
 assert.ok(c.__partial.size>0,'scheduler leaves partial source work');
 c.__c320.edits.set('0,-50,0',1);const beforeBand=c.__bands().band;
 U.slice(2,[0,0,0],3,3,beforeBand,performance.now(),Infinity);
 c.__stale.add('0,0');U.dirty.add('0,0');
 const band=c.__bands().band,data=new Uint8Array(79*79*72).fill(1);
 for(let x=30;x<50;x++)for(let y=15;y<65;y++)for(let z=30;z<50;z++)data[(x*72+y)*79+z]=0;
 data[(39*72+33)*79+39]=T.TORCH;
 U.meshIncremental(2,[0,0,0],0,0,band,1,data);
 const job=U.pendingJob();
 // Capture an unfinished job; next-call rev resumes its private generator if it yielded.
 const firstTime=performance.now();
 U.resumeLight('0,0',firstTime,1);
 assert.equal(U.pendingJob(),job,'real job retains ownership through actual suspended generator');
 assert.ok(job.geo||job.g||job.light,'actual geometry/light job retains pending ownership');
 assert.equal(privateGeometry.every(g=>!g.disposed),true,'private geometry begins undiscarded');
 c.__c105.phase=null;
 const group=new c.THREE.Group(),geo=new c.THREE.BufferGeometry();
 geo.setAttribute('position',new c.THREE.BufferAttribute(new Float32Array(12),3));
 group.add(new c.THREE.Mesh(geo,{}));c.__siteMeshes.set('0,0',group);U.root.add(group);
// Travel beyond the existing RN+1 boundary cancels the same real private geometry
// rather than requiring a reset epoch. Its sourceEdit store is persistent.
const traveled=resetFixture();
traveled.P.x=0;traveled.P.y=-64;traveled.P.z=0;traveled.__c321.pw=()=>({x:0,y:-64,z:0});TickEach(traveled);
traveled.chunkST=null;
const dataTravel=new Uint8Array(79*79*72).fill(1);
for(let x=30;x<50;x++)for(let y=15;y<65;y++)for(let z=30;z<50;z++)dataTravel[(x*72+y)*79+z]=0;
 dataTravel[(39*72+33)*79+39]=T.TORCH;
traveled.__c324.meshIncremental(2,[0,0,0],0,0,traveled.__c324.band,1,dataTravel);
const traveling=traveled.__inspectJob('0,0');
traveled.__c324.resumeLight('0,0',performance.now(),0);
traveled.__c324.resumeLight('0,0',performance.now(),Infinity);
assert.equal(traveled.__c324.pendingLight().includes('0,0'),true);
const buffers=[];traveling.g.traverse(o=>{if(o.geometry)buffers.push(o.geometry);});assert.ok(buffers.length>0,'actual original mesher allocated buffers');
traveled.P.x=1000;traveled.P.z=1000;traveled.__c321.pw=()=>({x:1000,y:-64,z:1000});TickEach(traveled);
assert.equal(traveled.__c324.pendingLight().includes('0,0'),false);
assert.ok(buffers.every(g=>g.disposed),'all ordinary out-of-radius group buffers disposed');
const stableTravelGeneration=traveled.__c324.generation;
traveled.__c324.resumeLight('0,0',performance.now(),0);assert.equal(traveled.__c324.pendingLight().includes('0,0'),false,'old job cannot resurrect');
traveled.__c320.edits.set('10,-40,10',9);assert.equal(traveled.__c320.edits.get('10,-40,10'),9);
traveled.P.x=0;traveled.P.z=0;TickEach(traveled);assert.equal(traveled.__c320.edits.get('10,-40,10'),9,'return preserves real edit store');
assert.equal(traveled.__c324.generation,stableTravelGeneration,'turnaround is not an unwanted reset');
console.log('PASS rapid traversal private mesh disposal, no resurrection, roundtrip edits');
 c.sourceVersion=2;c.seedValue=37;c.__resetStart();
 assert.equal(c.__calls.n,1,'only the fake test continuation executed; no reset/save function was used');
 assert.equal(U.generation,currentGeneration+1);
 for(const [field,value] of [['__cache',0],['__partial',0],['__siteMeshes',0],['__stale',0]])assert.equal(c[field].size,value,field+' invalidated');
 assert.equal(U.dirty.size,0);
 for(const k of ['TMP','meshHost','band'])assert.equal(c.__bands()[k],null,k+' reset');for(const k of ['k','v','m'])assert.equal(c.__bands().eB[k],null,'edit mapping '+k+' retired');assert.equal(c.__bands().eL.length,0,'sorted edits retired');
 assert.equal(c.__bands().eV,-1,'edit-cache version reset');
 assert.equal(c.current.id,'same-slot','world/game slot remains the current slot');
 assert.equal(geo.disposed,true,'published predecessor geometry disposed');
 assert.equal(U.pendingJob(),null,'unfinished old-generation mesh job removed');
 assert.equal(job.geo,null);assert.equal(job.g,null);assert.equal(job.data,null);assert.equal(job.light,null);
 assert.ok(privateGeometry.every(g=>g.disposed),'all actual generator-stage geometry disposed on cancellation');
 // A cancelled job cannot publish its old voxels after invalidation.
 assert.doesNotThrow(()=>U.resumeLight('0,0',performance.now(),1),'cancelled mesh job cannot publish');
 const fresh=U.slice(2,[0,0,0],3,3,-72,performance.now(),Infinity);

 assert.ok(fresh.data.some(v=>v===0),'new authoritative source produces open cave space');
 assert.equal(fresh.data[(39*72+33)*79+39],0,'interior changed from previous solid source to new cave');
 assert.ok(c.__cache.size>0,'same game/world slot refills through the new pipeline');
 c.started=false;c.__resetStart();assert.equal(c.__calls.n,1,'unstarted safely refused');assert.equal(U.generation,currentGeneration+1);
 c.started=true;c.dead=true;c.__resetStart();assert.equal(c.__calls.n,1,'dead safely refused');assert.equal(U.generation,currentGeneration+1);
 c.dead=false;c.current=null;c.__resetStart();assert.equal(c.__calls.n,1,'missing world slot refused without invalidation');assert.equal(U.generation,currentGeneration+1);
 c.current={id:'same-slot'};c.__c105.phase='lift';c.__resetStart();assert.equal(c.__calls.n,1,'already-active reset never starts twice');assert.equal(U.generation,currentGeneration+1);
 c.__c105.phase='gen';
 const failed=resetFixture(()=>{throw new Error('test-only start failure');}),beforeFailure=failed.__c324.generation;
 assert.throws(()=>failed.__resetStart(),/test-only start failure/);
 assert.equal(failed.__c324.generation,beforeFailure+1,'failed pre-replacement reset retains old-buffer ownership');
 for(const fn of failed.__timers)fn();assert.equal(failed.__c324.generation,beforeFailure+2,'genuine new buffer is the next new generation');
 const confirmed=production('  // ---------- in-game confirm dialog','  // ---------- pause-menu button',text.indexOf('  // ---------- state ----------'));
 assert.equal(requiresBaseConfirmation(confirmed),true,'existing confirmation UI byte-for-byte preserved, No focused default, Yes-only reset entry');
 console.log('PASS actual pending reset job/caches/private geometry/scene, same-slot new source, stable epoch and confirm/refusal/failure guards');
}
const overall = performance.now();
testLighting();
testDeepEditStore();
testStreaming();
testDirtyAndBudget();
testFullDeepMesh();
testIncrementalLightingEquality();
testDeepIncrementalLifecycle();
testCaveResetGenerationInvalidation();
console.log(`PASS all cave/negative-Y/Hell non-browser regressions in ${(performance.now()-overall).toFixed(1)}ms`);


// Expose the production extraction helpers to the independent proof scripts. This branch
// has no bundler/package manifest; no CommonJS artifact is used by the browser game.
module.exports={text,segment,production,run,vm,context,minimalThree,T,deepFixture,streamSetup};
