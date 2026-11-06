'use strict';
// Real B9e surface wrapper, synthetic mesh handles + clock, no renderer/FPS measurement.
const assert=require('node:assert/strict'),h=require('./cave-test-helpers.cjs');
const {text,production,run}=h,from=text.indexOf('rebuild = function (budget)');assert(from>=0);
const fn=production('rebuild = function (budget)','  const all = {};',from)+'}',clock={value:0,now(){return this.value;}};
const c=run(`var CH=26,W=624,D=624,blockGroup=new THREE.Group(),dirtyCh=new Set(),chunkObjs=new Map(),chunkLists=new Map();
var dirtyAll=false,P={x:80,z:80},STREAM_R=0;
var streamRadius=()=>4,streamT=0,loadErr=(where,e)=>{throw new Error(where+':'+e)},INVENTORYCODEBOOK={};
var savedEdits=new Map([['80,30,80',9],['80,30,81',0]]);this.savedEdits=savedEdits;
var buildChunk=(x,z)=>{buildTimes.push(x*64+z);assert(maxDistanceToPlayer(x,z)<=4+1e-7,'active build within policy radius');const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.BufferGeometry(),{}));chunkObjs.set(x*64+z,g);chunkLists.set(x*64+z,{});dirtyCh.delete(x*64+z);};
var maxDistanceToPlayer=(x,z)=>Math.max(Math.abs(x-(P.x/CH-.5)),Math.abs(z-(P.z/CH-.5))),buildTimes=[];
${fn}`,{THREE:h.minimalThree(),T:Object.assign({},h.T),performance:clock,assert});
for(let x=0;x<24;x++)for(let z=0;z<24;z++)c.dirtyCh.add(x*64+z);
c.rebuild(0);assert(c.chunkObjs.size<=81,'normal surface demand constrained to existing radius');assert(c.dirtyCh.size>0,'far dirty identities not saved-data erasure');
assert(!c.__chErr,c.__chErr);assert(c.chunkObjs.size>0,'surface actually builds its nearby geometry');const old=[...c.chunkObjs.entries()].map(([id,g])=>({id,g}));
for(const {g}of old)g.traverse(o=>{if(o.geometry)assert(!o.geometry.disposed);});
clock.value=1000;c.P.x=340;c.P.z=340;c.buildTimes=[];c.rebuild(0);
for(const {id,g}of old){const [x,z]=[Math.floor(id/64),id%64];if(Math.max(Math.abs(x-(340/26-.5)),Math.abs(z-(340/26-.5)))>5.5){assert(!c.chunkObjs.has(id),'out of radius old surface group unloaded');g.traverse(o=>{if(o.geometry)assert(o.geometry.disposed,'old group GPU geometry handle disposed');});}}
for(const [id,g]of c.chunkObjs){const [x,z]=[Math.floor(id/64),id%64];assert(Math.max(Math.abs(x-(340/26-.5)),Math.abs(z-(340/26-.5)))<=5.5);g.traverse(o=>{if(o.geometry)assert(!o.geometry.disposed,'fresh destination not disposed');});}
assert(c.buildTimes.length<=81);assert.deepEqual([...c.savedEdits],[['80,30,80',9],['80,30,81',0]]);
clock.value=2000;c.P.x=80;c.P.z=80;c.rebuild(0);
for(const {id}of old){assert(!c.chunkObjs.has(id)||Math.max(Math.abs(Math.floor(id/64)-(80/26-.5)),Math.abs(id%64-(80/26-.5)))<=5.5,'old view restored once without stale surface duplicates');}
console.log('PASS normal B9e surface traversal hysteresis, disposal and return; groups='+c.chunkObjs.size+' pendingDirty='+c.dirtyCh.size+' edits retained='+c.savedEdits.size);
