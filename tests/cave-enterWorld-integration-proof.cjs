'use strict';
// Real C324 + exact B9e source. Ordinary enterWorld readiness is unchanged.
// Exact ordinary chunksReady calls real C324 nearest-owner callback. No save writes or browser performance claim.
const assert=require('node:assert/strict'),h=require('./cave-test-helpers.cjs');
const {text,production,run,vm,T}=h;
const timers=[],P={x:39,y:-4,z:39,vy:0};
const three=h.minimalThree();three.Matrix4=class{makeBasis(){return this;}compose(){return this;}};three.Quaternion=class{setFromRotationMatrix(){return this;}setFromAxisAngle(){return this;}};three.Vector3=class{set(){return this;}};three.Vector4=class{set(){}};
const edits=new Map([['39,-2,39',7],['39,-4,39',0],['39,0,39',9],['39,1,39',8]]);
const c=vm.createContext({console,Math,Map,Set,Uint8Array,Uint16Array,Uint32Array,Int16Array,Int32Array,Float32Array,performance,THREE:three,
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
c.window=c;c.__c317mesh=0;
run(production('  const op = n => n !== 0','  // ---- shadows (Realistic)'),{},c);
// The exact existing production light algorithms, not test conditionals or mocks.
const baseC324='  const U = window.__c324';
const cave=production(baseC324,'  // no grey ground fog',text.indexOf('(function c324()'));
assert(!cave.includes('beginEntry')&&!cave.includes('U.loading'),'no bespoke saved-entry scheduler remains');
const caveMarker='  setInterval(() => { try { const f = F(), e = E(); if (DIM.cur || !on() || !f || !e)';
assert(cave.includes('  function scheduleOnce(){try{ const f = F(), e = E(); if (!on()||DIM.cur||!f||!e) {'),'actual C324 scheduler stays independent of started for saved loader pump');
run(cave+'window.__state=()=>({root,meshes,partial,pendingLight,stale,band,generation});\n',{},c);
const tick=timers[0];c._timers=timers;
// Pull exact B9e assignment and its simple startup deferral, no other streamer changes.
const b9e=production('rebuild = function (budget) {','(function streamTick()',text.indexOf('/* ===================== GLX-B9e'));
assert(b9e.includes("!started)&&window.__c324&&__c324.savedEntry&&!__c324.savedEntryDone"));
const surfaceRadius=production('function streamRadius','rebuild = function (budget) {');

run('var STREAM_R=4;'+surfaceRadius+b9e+';window.pumpSurface=rebuild;',{},c);
const save={P:{x:P.x,y:P.y,z:P.z},c317:{p:[P.x,P.y,P.z]},W:600};
// Actual enterWorld phase sequencing with lightweight browser/assets surrounding
// the real loading state machine and real geometry/meshing code above.
Object.assign(c,{
 screen:'loading',LOAD_STEPS:['assets'],
 mobs:[],removeMob(){},
 applySave(d){c.applied=true;assert.equal(d,save);P.x=20;P.y=64;P.z=20;P.vy=-5;
  // production original 25 chunk groups, not an asynchronous test shortcut
  for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const id=(1+dx)*64+1+dz,g=new three.Group();g.children.push(new three.Mesh(new three.BufferGeometry(),{}));c.chunkObjs.set(id,g);c.chunkLists.set(id,{});c.dirtyCh.add(id);}
  P.x=d.P.x;P.y=d.P.y;P.z=d.P.z;c.__c321.pw=()=>({x:P.x,y:P.y,z:P.z});
 },loadStep(){},
 localStorage:{getItem(){return null},setItem(){},removeItem(){}},
 loadSafe(){throw Error('valid saved load must not force safe mode')},
 addItem(){},ensureHotbar(){},spawnMob(){},refreshArmour(){},MODE:{},installCreative(){},
 saveWorld(){throw Error('loading existing save must not write world')},
 requestAnimationFrame(fn){(c.frames||(c.frames=[])).push(fn);},
 renderer:{compile(){c.compiled=true;},render(){c.rendered=true;}},camera:{},canvas:{requestPointerLock(){}},
 touchMode:false,lastAutosave:0,paused:false,screen:'loading',
});
// enterWorld's strict UI routine is preserved; only host elements are ordinary stub DOM.
const ids={loadW:{firstChild:{style:{}}},loadTip:{textContent:''},loadPct:{textContent:''}};
c.$=id=>{if(!ids[id])ids[id]={textContent:'',firstChild:{style:{}},style:{}};return ids[id];};
c.loadErr=(where,e)=>{throw Error(where+':'+e);};
// Preserve loadSignal only where browser balloons require real notification/UI.
c.showScreen=v=>{c.screen=v;};c.toast=()=>{};
const source317=production('(function c317c()','\n\n/* ===================== GLX-C316',text.indexOf('(function c317c()'));vm.runInContext(source317,c);
const ew=production('function enterWorld(save)','function finishBoot()',text.indexOf('function enterWorld(save)'));
vm.runInContext(ew,c);c.__testSave=save;
c.enterWorld(save);assert.equal(c.P.x,39);assert.equal(c.P.y,-4);
// CSS loading transition runs even after the land-ready phase removes the display.
if(c.frames&&c.frames.length){const f=c.frames.shift();f();}c.__steps=c._timers;
c._timers=timers;const caveTimer=timers[0];

console.log("timers",c._timers.length);const loadTimer=c._timers[c._timers.length-1];assert(loadTimer);
// actual i=1...8; existing C317 global restore flag initialized by helper.
for(let n=0;n<8;n++)loadTimer();
assert(c.applied,'actual applySave executed');
let calls=0;
while(c.started!==true&&calls<320){
 // full enterWorld timer owns ordering. C324 timer reproduces the actual setInterval fire order before gate; no surface yields before start.
 caveTimer();loadTimer();for(let z=0;z<20&&c.frames.length;z++){const f=c.frames.shift();f();}calls++;
 assert.equal(c.__c324.err,null,c.__c324.err);
 assert.equal(c.surfaceBuilds,0,'full actual loader does not eagerly build far/ocean surface during saved start');if(calls%10===0)console.log("phase",calls,c.P.y,c.__state().meshes.size,c.__c324.savedEntryDone,c.screen,c.__c324.err,c.__c324.savedEntryAttempts,c.__c324.ticks);;if(calls>150){console.log("blocked",c.__loadErrTxt,ids.loadTip);throw Error("saved load did not complete bounded source state");}
}
assert.equal(c.started,true);assert.equal(c.rendered,true);assert.equal(c.compiled,true);assert.equal(c.P.y,-4);assert.equal(c.dirtyAll,false);
assert(c.__state().meshes.has('1,1'),'full actual loader has proven near private cave geometry');
console.log('PASS actual enterWorld saved underground applySave -> near C324 -> first render -> started',JSON.stringify({calls,edits:[...edits],publicBuilds:c.surfaceBuilds,deepGroups:c.__state().root.children.length}));
