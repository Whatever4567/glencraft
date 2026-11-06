'use strict';
// Actual C320 edit hook + C324 geometry/light/AO owner, ordinary started movement.
// Synthetic cave substrate and scene handles: ownership proof, not browser/FPS proof.
const assert=require('node:assert/strict'),h=require('./cave-test-helpers.cjs');
const {text,production,run,vm,T}=h;
const timers=[],P={x:39,y:-4,z:39,vy:0};
const three=h.minimalThree();three.Matrix4=class{makeBasis(){return this;}compose(){return this;}};three.Quaternion=class{setFromRotationMatrix(){return this;}setFromAxisAngle(){return this;}};three.Vector3=class{set(){return this;}};three.Vector4=class{set(){}};
// Match THREE.remove: a non-child is a no-op (shared stub removes last child).
three.Group.prototype.remove=function(g){const i=this.children.indexOf(g);if(i>=0)this.children.splice(i,1);return this;};
const edits=new Map([['39,-2,39',7],['39,-4,39',0],['39,0,39',9],['39,1,39',8]]);
const c=vm.createContext({console,Date,Math,Map,Set,Uint8Array,Uint16Array,Uint32Array,Int16Array,Int32Array,Float32Array,performance,THREE:three,
 navigator:{userAgent:''},T:Object.assign({},T),CH:26,W:600,H:100,D:600,SEA:41,P,
 started:false,current:{id:'test-save',mode:'flat'},DIM:{cur:null},__c317:{on:()=>!c.__c317mesh&&!c.DIM.cur&&c.W>=600,foot:(x,z)=>x>=0&&x<600&&z>=0&&z<600},
 __c321:{ax:2,piv:[0,0,0],pw:()=>({x:P.x,y:P.y,z:P.z})},__c309:{on:false},
 __c320:{flat:true,edits,E:()=>[0,0,0],R:5000,alt:()=>P.y-41,space:()=>false,
  earth(x,y,z){if(y>=0)return 0;const ix=((x%26)+26)%26,iz=((z%26)+26)%26;return (ix<3||ix>22||iz<3||iz>22||y===-1||y===-72)?1:0;}},
 world:new Uint8Array(600*100*600),aboveWorld:()=>0,dirtyAll:false,dirtyCh:new Set(),chunkObjs:new Map(),chunkLists:new Map(),blockGroup:new three.Group(),scene:new three.Group(),
 chunkST:null,chunkFQ:null,patched:new Set(),FANCY:false,REAL:false,BLOCK_MATS:[null,{transparent:false,userData:{tmat:true}}],PLANT:{},ENT:{},LEAFY:{},
 getB(){return 0},setB(){},updatePlayer(){},updateSky(){},isPlant(){return false},buildWaterGeo(){return null},waterMat:{},crossGeo:{},PLANT_MATS:{},PLANT_H:{},PLANT_W:{},vf:()=>96,
 streamT:0,loadErr(where,e){throw Error(where+': '+e)},syncCauldrons(){},syncEntities(){},clearInterval(){},clearTimeout(){},setTimeout(){},
 surfaceBuilds:0,syncCalls:0,setInterval(fn){timers.push(fn);},flying:false,TA:false});
c.window=c;
c.__c317.wall=()=>false;
c.setB=(x,y,z,v)=>{if(y>=0&&y<c.H)c.world[(x*c.H+y)*c.D+z]=v;};
const editHook=production('  try { const s0 = setB; setB = function (x, y, z, v) { if (!on())','  // ---------- drawing:',text.indexOf('(function c320()'));
run(`(()=>{const U=__c320,on=__c317.on,S7=()=>__c317,key=(x,y,z)=>x+','+y+','+z,earth=U.earth,mine=(x,y,z)=>!(__c317.foot(x,z)&&y>=0),ERR=(w,e)=>{throw e;};${editHook}})();`,{},c);
run(production('  const op = n => n !== 0','  // ---- shadows (Realistic)'),{},c);
// The exact existing production light algorithms, not test conditionals or mocks.
const baseC324='  const U = window.__c324';
const cave=production(baseC324,'  // no grey ground fog',text.indexOf('(function c324()'));
assert(!cave.includes('beginEntry')&&!cave.includes('U.loading'),'no bespoke saved-entry scheduler remains');
const caveMarker='  setInterval(() => { try { const f = F(), e = E(); if (DIM.cur || !on() || !f || !e)';
assert(cave.includes('  function scheduleOnce(){try{ const f = F(), e = E(); if (!on()||DIM.cur||!f||!e) {'),'actual C324 scheduler stays independent of started for saved loader pump');
run(cave+'window.__state=()=>({root,meshes,partial,pendingLight,stale,band,generation});\n',{},c);
const tick=timers[0];
c.started=true;c.P.y=4;
// Same original normal world and original scheduler, not startSaved/chunksReady.

const originalWorld=c.world;const surface=new three.Group();surface.add(new three.Mesh(new three.BufferGeometry(),{}));c.blockGroup.add(surface);
const trace=[];
for(const y of [4,2,1,0,-1,-2,-4]){
 c.P.y=y;
 for(let frame=0;frame<30;frame++){if(frame%5===0)c.setB(39,Math.min(-1,y-2),39,0);tick();}
 const q=c.__state();trace.push({y,active:c.__c317.on(),visible:q.root.visible,band:q.band,near:!!q.meshes.get('1,1'),partial:q.partial.size,pending:q.pendingLight.size,rootChildren:q.root.children.length,farSurfaceBuilds:c.surfaceBuilds});
}
console.log('CROSSING_TRACE',JSON.stringify(trace));
assert.equal(c.__c324.err,null);
assert(trace.find(q=>q.y===0).near,'near wall published by Y0 during repeated digs');
assert(trace.at(-1).near,'normal downward boundary digging must publish nearest negative-Y wall without saved loader');

// Crossing again with an already-published owner must never clear/hide that wall.
const warm=[];
for(const y of [4,2,1,0,-1,-2,-4]){c.P.y=y;c.setB(39,-1,39,0);tick();const q=c.__state();assert(q.root.visible&&q.meshes.get('1,1'),'retains published nearest owner through edit/band transition '+y);assert(q.pendingLight.size<=1,'one private incremental owner');assert.equal(c.world,originalWorld,'no world replacement');warm.push({y,band:q.band,near:true,pending:q.pendingLight.size});}
assert(c.blockGroup.children.includes(surface),'surface column remains drawn, not evidence of far builds');
assert.equal(c.surfaceBuilds,0,'no far surface producer invoked by boundary test');
console.log('WARM_CROSSING_TRACE',JSON.stringify(warm));

// Preserve global source invalidation instead of treating it as a local edit.
c.__c320.dirty=1;c.setB(39,-9,39,0);assert.equal(c.__c320.dirty,1,'pre-existing global dirty survives local edit');tick();assert.equal(c.__c320.dirty,0);assert.equal(c.__c324.err,null);
assert.equal(edits.get('39,-1,39'),0,'AIR edit retained');
