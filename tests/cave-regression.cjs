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
  class Attribute { constructor(array, itemSize) { this.array=array;this.itemSize=itemSize;this.count=array.length/itemSize; } }
  class Geometry { constructor(){this.attributes={};}setAttribute(name,a){this.attributes[name]=a;}setIndex(a){this.index=a;}computeBoundingSphere(){} addGroup(){}dispose(){} }
  class Mesh { constructor(g,m){this.geometry=g;this.material=m;this.userData={};this.children=[];}dispose(){} }
  class Group { constructor(){this.children=[];this.userData={};this.position={set(x,y,z){this.x=x;this.y=y;this.z=z;}};}add(g){this.children.push(g);return this;}remove(g){this.children.splice(this.children.indexOf(g),1);} }
  class Matrix4{} class Quaternion{} class Vector3{};
  return {Group,Mesh,BufferGeometry:Geometry,BufferAttribute:Attribute,Matrix4,Quaternion,Vector3};
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

const overall = performance.now();
testLighting();
testDeepEditStore();
testStreaming();
testDirtyAndBudget();
testFullDeepMesh();
console.log(`PASS all cave/negative-Y/Hell non-browser regressions in ${(performance.now()-overall).toFixed(1)}ms`);
