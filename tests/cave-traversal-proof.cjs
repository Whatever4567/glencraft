'use strict';
// Executes the actual C324 scheduler/original resumable production mesher in Node.
// It asserts lifecycle counts and data ownership; Node timings are not device FPS.
const assert=require('node:assert/strict'),h=require('./cave-test-helpers.cjs');
const three=h.minimalThree(),timers=[],P={x:39,y:-64,z:39},DIM={cur:null};
const privateGeometry=[],Base=three.BufferGeometry;
three.BufferGeometry=class extends Base{constructor(){super();privateGeometry.push(this);}};
three.Matrix4=class{makeBasis(){return this;}compose(){return this;}};
three.Quaternion=class{setFromRotationMatrix(){return this;}setFromAxisAngle(){return this;}};
const c=h.vm.createContext({console,Math,Map,Set,Uint8Array,Uint16Array,Uint32Array,Int16Array,Int32Array,Float32Array,performance,
 navigator:{userAgent:''},THREE:three,T:Object.assign({},h.T),CH:26,W:1200,H:100,D:1200,SEA:41,
 P,DIM,scene:new three.Group(),started:true,__c317:{on:()=>true},__c321:{ax:2,piv:[0,0,0],pw:()=>({...P})},__c309:{on:false},
 __c320:{flat:true,edits:new Map([['39,-4,39',7],['39,-16,39',0]]),E:()=>[0,0,0],R:5000,earth:(x,y,z)=>((x*17+z*11+(y|0)*7)%67!==0?1:0),alt:()=>24,space:()=>false},
 world:new Uint8Array(1200*100*1200),aboveWorld:()=>false,patched:new Set(),FANCY:false,REAL:false,
 BLOCK_MATS:[null,{transparent:false}],PLANT:{},ENT:{},LEAFY:{},chunkST:new Uint8Array(256),chunkFQ:null,chunkObjs:new Map(),chunkLists:new Map(),blockGroup:new three.Group(),
 getB(){return 0},isPlant(){return false},buildWaterGeo(){return null},waterMat:{},crossGeo:{},PLANT_MATS:{},PLANT_H:{},PLANT_W:{},
 setInterval(f){timers.push(f);},setTimeout(){},setB(){},updatePlayer(){},flying:false,vf:()=>96,fixturePauseLight:false,
});c.window=c;
c.chunkST=null;
h.run(h.production('  const op = n => n !== 0','  // ---- shadows (Realistic)'),{},c);
const actualLightStep=c.__deepLightStep,actualAOStep=c.__deepAOStep;
c.__deepLightStep=(...a)=>c.fixturePauseLight?false:actualLightStep(...a);
c.__deepAOStep=(...a)=>c.fixturePauseLight?false:actualAOStep(...a);


h.run(h.production('  const U = window.__c324','  // no grey ground fog',h.text.indexOf('(function c324()'))+`window.__inspect=()=>({root,meshes,cache,partial,pendingLight,stale,eV,eL,eB,band});`,{},c);
function tick(){timers[0]();assert(!c.__c324.err,c.__c324.err);const live=c.__inspect();for(const [key,g]of live.meshes)if(g){assert.equal(live.root.children.filter(x=>x===g).length,1,'exactly one live owner for '+key);g.traverse(o=>{if(o.isMesh)assert(!o.geometry.disposed,'cannot dispose visible mesh');});}assert(live.pendingLight.size<=49,'one bounded active demand at each column, not incessantly spawning');assert.equal(live.root.children.length,[...live.meshes.values()].filter(Boolean).length,'no retired-live duplicate scene groups');}
function move(x,z=39,y=-64){Object.assign(P,{x,y,z});tick();}
tick();assert.equal(c.__c324.band,-136);assert.equal(c.world.length,1200*100*1200,'temporary sliced world restored');
// Actual unfinished fill: no synthetic job-counter mutations.
assert.deepEqual([...c.__inspect().partial.keys()],['2|0,0,0|1,1,-136'],'actual partial origin fill suspended');
const originalPartial=c.__inspect().partial,originPartialBytes=[...originalPartial.values()][0].data.byteLength;

// Ordinary movement beyond RN+1 evicts only the old column, preserving legitimate
// brief retention at closer boundaries and leaving saved source edits untouched.
for(const [x,z]of [[239,39],[500,500],[39,39],[239,39],[39,39],[500,39],[39,39]]){
 const keysBefore=[...c.__inspect().partial.keys()];
 move(x,z);
 for(const pk of keysBefore){
  const end=pk.lastIndexOf('|'),comma=pk.lastIndexOf(','),[cx,cz]=pk.slice(end+1,comma).split(',').map(Number);
  // Desktop RN=5, so one-chunk/teleport hysteresis is RN+1=6. Near return
  // legitimately retains/resumes work; test eviction only on actual away ticks.
  const evict=Math.max(Math.abs(cx-Math.floor(P.x/26)),Math.abs(cz-Math.floor(P.z/26)))>6;
  if(evict&&P.x!==39&&P.z!==39){
   assert(!c.__inspect().partial.has(pk),'fast traversal beyond actual hysteresis drops suspended '+pk);
  }
 }
 assert(!c.__c324.err,c.__c324.err||'failed any jump');
}
for(let i=0;i<128&&!c.__inspect().meshes.get('1,1');i++)tick();
assert(c.__inspect().meshes.has('1,1'),'original area rebuilds through normal bounded scheduling on return');
move(500,500);assert.equal([...c.__inspect().partial.keys()].some(k=>k.includes('|1,1,')),false,'partial origin voxel allocation is dropped, not accumulated invisible');
assert([...c.__inspect().meshes.keys()].every(k=>k!=='1,1'),'old origin outside immediate active radius');
for(let i=0;i<20;i++)tick();assert(!c.__inspect().meshes.has('1,1'),'no late resurrection from retiree');
// Fast return while another area is being produced: no duplicate groups for the old key.
move(39);tick();assert(c.__inspect().root.children.length<=49);assert.equal(c.__c324.generation,2,'travel leaves actual world generation alone');
assert.deepEqual([...c.__c320.edits],[['39,-4,39',7],['39,-16,39',0]],'real edited source retained, explicit AIR and nonzero ID');
// Explicit real pending geometry/light job, suspended by ordinary budget, then eviction.
c.__c324.fixturePauseLight=true;const data=new Uint8Array(79*79*72).fill(1);for(let x=30;x<50;x++)for(let y=15;y<65;y++)for(let z=30;z<50;z++)data[(x*72+y)*79+z]=0;data[(39*72+33)*79+39]=h.T.TORCH;c.__c324.meshIncremental(2,[0,0,0],19,19,c.__c324.band,1,data);
const job=c.__inspect().pendingLight.get('19,19');assert(job);
c.__c324.resumeLight('19,19',performance.now(),Infinity);assert(job===c.__inspect().pendingLight.get('19,19'),'actual job exists; flags geo='+!!job.geo+' g='+!!job.g+' light='+!!job.light);assert(job.geo||job.g||job.light,'original producer has a suspended resource');
const owns=[];job.g?.traverse(o=>{if(o.geometry)owns.push(o.geometry);});assert(owns.length>0,'actual private geometry must be allocated');
move(500);assert(!c.__inspect().pendingLight.has('19,19'),'outside RN+1 cancels the job, not just its mesh label');
assert(job.geo===null&&job.g===null&&job.light===null&&job.data===null,'canceled producer no longer reachable for late publish');
assert(owns.every(g=>g.disposed),'all private instantiated mesh allocations disposed');
c.__c324.resumeLight('19,19',performance.now(),Infinity);assert(!c.__inspect().pendingLight.has('19,19'),'canceled entry cannot be resurrected with stale resume ticket');
move(39);c.__c324.fixturePauseLight=true;const oldLight=c.__deepLightStep,oldAO=c.__deepAOStep;c.__deepLightStep=(...a)=>c.__c324.holdLight?false:oldLight(...a);c.__deepAOStep=(...a)=>c.__c324.holdLight?false:oldAO(...a);tick();const generation=c.__c324.generation;
// Saved underground and normal surface both retain data; ordinary P.y positive streams cave only inside its effective policy.
move(39,39,8);move(39,39,-64);assert.equal(c.__c324.generation,generation,'surface/underground movement is not reset');
DIM.cur='agartha';tick();assert(!c.__inspect().root.visible);assert.equal(c.__inspect().pendingLight.size,0);assert.deepEqual([...c.__c320.edits],[['39,-4,39',7],['39,-16,39',0]],'dimension displacement not data loss');
DIM.cur='hell';tick();assert(!c.__inspect().root.visible);DIM.cur=null;c.__c324.fixturePauseLight=false;move(39);assert.deepEqual([...c.__c320.edits],[['39,-4,39',7],['39,-16,39',0]]);
assert(c.__inspect().cache.size<=3000);assert(c.__inspect().partial.size<=32,'partial buffer worker budget bound');
console.log('PASS fast traversal outside radius: private fill cleared',originPartialBytes,'bytes; pending instantiated geometry disposed',owns.length,'objects; edits retained; no late resurrection; cache/partial bounded',c.__inspect().cache.size,c.__inspect().partial.size);
