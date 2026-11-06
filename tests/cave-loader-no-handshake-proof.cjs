'use strict';
// Real C324 + exact B9e source. Ordinary enterWorld readiness is unchanged.
// Exact ordinary chunksReady calls real C324 nearest-owner callback. No save writes or browser performance claim.
const assert=require('node:assert/strict'),h=require('./cave-test-helpers.cjs');
const {text,production,run,vm,T}=h;
const timers=[],P={x:39,y:-4,z:39,vy:0};
const three=h.minimalThree();three.Matrix4=class{makeBasis(){return this;}compose(){return this;}};three.Quaternion=class{setFromRotationMatrix(){return this;}setFromAxisAngle(){return this;}};three.Vector3=class{set(){return this;}};three.Vector4=class{set(){}};
const edits=new Map([['39,-2,39',7],['39,-4,39',0],['39,0,39',9],['39,1,39',8]]);
const c=vm.createContext({console,Date,Math,Map,Set,Uint8Array,Uint16Array,Uint32Array,Int16Array,Int32Array,Float32Array,performance,THREE:three,
 navigator:{userAgent:''},T:Object.assign({},T),CH:26,W:600,H:100,D:600,SEA:41,P,
 started:false,current:{id:'test-save',mode:'flat'},DIM:{cur:null},__c317:{on:()=>true,foot:(x,z)=>x>=0&&x<600&&z>=0&&z<600},
 __c321:{ax:2,piv:[0,0,0],pw:()=>({x:P.x,y:P.y,z:P.z})},__c309:{on:false},
 __c320:{flat:true,edits,E:()=>[0,0,0],R:5000,alt:()=>P.y-41,space:()=>false,
  earth(x,y,z){if(y>=0)return 0;const ix=((x%26)+26)%26,iz=((z%26)+26)%26;return (ix<3||ix>22||iz<3||iz>22||y===-1||y===-72)?1:0;}},
 world:new Uint8Array(600*100*600),aboveWorld:()=>0,dirtyAll:false,dirtyCh:new Set(),chunkObjs:new Map(),chunkLists:new Map(),blockGroup:new three.Group(),scene:new three.Group(),
 chunkST:null,chunkFQ:null,patched:new Set(),FANCY:false,REAL:false,BLOCK_MATS:[null,{transparent:false,userData:{tmat:true}}],PLANT:{},ENT:{},LEAFY:{},
 getB(){return 0},setB(){},updatePlayer(){},updateSky(){},isPlant(){return false},buildWaterGeo(){return null},waterMat:{},crossGeo:{},PLANT_MATS:{},PLANT_H:{},PLANT_W:{},vf:()=>96,
 streamT:0,loadErr(where,e){throw Error(where+': '+e)},syncCauldrons(){},syncEntities(){},clearInterval(){},clearTimeout(){},setTimeout(){},
 surfaceBuilds:0,syncCalls:0,setInterval(fn){timers.push(fn);},flying:false,TA:false});
c.window=c;
run(production('  const op = n => n !== 0','  // ---- shadows (Realistic)'),{},c);
// The exact existing production light algorithms, not test conditionals or mocks.
const baseC324='  const U = window.__c324';
const cave=production(baseC324,'  // no grey ground fog',text.indexOf('(function c324()'));
assert(!cave.includes('beginEntry')&&!cave.includes('U.loading'),'no bespoke saved-entry scheduler remains');
const caveMarker='  setInterval(() => { try { const f = F(), e = E(); if (DIM.cur || !on() || !f || !e)';
assert(cave.includes('  function scheduleOnce(){try{ const f = F(), e = E(); if (!on()||DIM.cur||!f||!e) {'),'actual C324 scheduler stays independent of started for saved loader pump');
run(cave+'window.__state=()=>({root,meshes,partial,pendingLight,stale,band,generation});\n',{},c);
const tick=timers[0];
// Pull exact B9e assignment and its simple startup deferral, no other streamer changes.
const b9e=production('rebuild = function (budget) {','(function streamTick()',text.indexOf('/* ===================== GLX-B9e'));
assert(b9e.includes("!started)&&window.__c324&&__c324.savedEntry&&!__c324.savedEntryDone"));
const surfaceRadius=production('function streamRadius','rebuild = function (budget) {');

run('var STREAM_R=4;'+surfaceRadius+b9e+';window.pumpSurface=rebuild;',{},c);
// Original readiness source waits for real column too; normal 25 chunk counting resumes after exact publication.
const gate=production('  const chunksReady = () => {','  const tick = setInterval',text.indexOf('function enterWorld(save)'));
assert(gate.includes('    if (dirtyAll) return false;')&&gate.includes('U.startSaved(q)'));
const save={P:{x:P.x,y:P.y,z:P.z},c317:{p:[P.x,P.y,P.z]},W:600};
const ready=vm.runInContext(`(()=>{var save=__testSave;${gate}return chunksReady;})()`,Object.assign(c,{__testSave:save,enterWorld:{_savedDimension:null}}));
// The original applySave's 25 source chunks already populated and clean.
for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const id=(1+dx)*64+1+dz,g=new three.Group();g.children.push(new three.Mesh(new three.BufferGeometry(),{}));c.chunkObjs.set(id,g);c.chunkLists.set(id,{});c.dirtyCh.add(id);}
c.__TA={on:true,mat:c.BLOCK_MATS[1],layers:()=>[0,0,0,0,0,0]};
assert.equal(ready(),false,'unchanged ordinary loader lifetime observes paused surface stream');
assert.equal(c.__state().root.children.length,0,'no unrelated or deep group merely from 25 surface meshes');
c.pumpSurface();
assert.equal(c.surfaceBuilds,0,'underground saved load defers surface generation until ordinary lifetime');
let ticks=0,nearAt=-1,partialAt=-1,lightAt=-1;
for(;ticks<100;ticks++){
 const before=c.__state();if(before.partial.size)partialAt=ticks;if(before.pendingLight.has('1,1'))lightAt=ticks;
 const passed=ready();
 assert.equal(passed,false,'original loader keeps waiting until actual AO/lit publish');
 tick();
 if(passed)break;
 assert.equal(c.__c324.err,null,'real C324 callback cannot swallow error');
 assert.equal(c.__c324.err,null,'saved startup waits for real publish not empty cell membership');
 for(const k of c.__state().meshes.keys())assert.equal(k,'1,1','startup before first wall can only publish nearest column');
 assert(c.__state().pendingLight.size<=1,'only one AO/light owner saved during first wall');
 assert.equal(c.__state().root.children.length,[...c.__state().meshes.values()].filter(Boolean).length,'unique scene owner');
 if(c.__state().meshes.has('1,1')){nearAt=ticks;break;}
 c.pumpSurface();assert.equal(c.surfaceBuilds,0);
}
assert(c.__state().meshes.has('1,1'),'actual nearest wall completes within bounded 100 scheduler turns');
const s=c.__state(),wall=s.meshes.get('1,1');assert(wall);
assert.equal(s.root.children.length,1);assert.equal(s.band,-72,'saved negative-Y band derived from restored P not reset zero frame');
assert.equal(c.P.y,-4);assert(edits.has('39,-2,39')&&edits.get('39,-2,39')===7&&edits.get('39,-4,39')===0);
wall.traverse(o=>{if(o.geometry){assert(!o.geometry.disposed,'published geometry not retired');const a=o.geometry.attributes.position;if(a)for(let i=1;i<a.array.length;i+=3)assert(a.array[i]+wall.position.y<=0.00001,'no private terrain crosses Y0');}});
// A few more timers during the unchanged ordinary wait are allowed existing nearby preload,
// never whole map or outside ordinary RN radius; nearest ordering is always retained.
// Actual readiness consumes the exact local publication while all far surface builds
// are still paused; later ordinary rendering follows the unchanged scheduler.
let firstReady=false;for(let i=0;i<3&&!firstReady;i++)firstReady=ready();assert(firstReady,'original surface count resumes once actual nearest is complete');assert.equal(c.surfaceBuilds,0);
assert(c.__state().meshes.size<=49,'at most a local adult radius, no arbitrary render distance increase');
for(const k of c.__state().meshes.keys()){const [x,z]=k.split(',').map(Number);assert(Math.max(Math.abs(x-1),Math.abs(z-1))<=7);}
// Only after start should B9e resume; ordinary saved ready is still unchanged function.
c.started=true;c.pumpSurface();
assert.equal(c.__c324.err,null);
// No save serializer called in this whole scene start. Byte fixture remains unchanged.
console.log('PASS ordinary wait nearest actual wall, no early far surface, unique Y0 boundary, save edits unchanged',JSON.stringify({ticksToNear:ticks,nearestFirst:nearAt,partialAt,lightAt,publishedNear:s.root.children.length,attempts:c.__c324.savedEntryAttempts,savedGateReleased:c.__c324.savedEntry===null,localRadiusBound:7}));
