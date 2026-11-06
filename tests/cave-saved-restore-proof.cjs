'use strict';
// Executes actual scoped C317 restore + original enterWorld i===2/clock sequences.
const assert=require('node:assert/strict'),h=require('./cave-test-helpers.cjs');const {production,text,vm}=h;
const timers=[];const C={console,Math,Map,Set,Uint8Array,performance:{now:()=>10000},window:null,
 P:{x:20,y:64,z:20,vy:-3,fallTop:{bad:1}},DIM:{cur:null,busy:false},W:600,D:600,H:100,CH:26,NEW_W:600,
 current:{id:'mock-save',mode:'survival',flat:false},setWorldSize(){},__c317:{on:()=>true,foot:(x,z)=>x>=0&&x<600&&z>=0&&z<600,soft:false,leave(){C.leaves++;},err:null},
 __c320:{flat:true,alt:()=>0},__c309:{on:false,set:false},__c299:{on:false},__c105:{phase:null},__c324:{savedEntry:null,err:null},__c321:{ax:2},
 started:true,dead:false,paused:false,MODE:{},IT:{},T:{DIRT:1},prog:{},seenGate:false,crops:new Map(),chests:new Map(),doorState:new Map(),furnaces:new Map(),entMeta:new Map(),inv:{},armour:[],MODE:{hotbar:null},
 setInterval(fn){timers.push(fn);return timers.length;},setTimeout(){},clearInterval(){},clearTimeout(){},
 serialize(){return {P:{x:C.P.x,y:C.P.y,z:C.P.z}};},enterWorld(){return 'original-load';},applySave(){throw Error('main-entry apply stub may not call itself recursively');},startT:0,leaves:0,
 mobs:[],removeMob(){},rebuild(){C.rebuilds++;return 0;},loadStep(name){C.steps=(C.steps||[]).concat(name);},loadErr(w,e){throw Error(w+':'+e);},generate(){},placeTrees(){},placeDecor(){},spawnPlayer(){},installCreative(){},addItem(){},ensureHotbar(){},spawnMob(){},refreshArmour(){},renderer:{compile(){C.compiled=true;},render(){C.rendered=true;}},compileShader(){},scene:{},camera:{},
 vf:()=>96,weather:{},updatePlayer(){},updateSky(){},
};C.window=C;const ctx=vm.createContext(C);
const source317=production('(function c317c()','\n\n/* ===================== GLX-C316',text.indexOf('(function c317c()'));
new vm.Script(source317,{filename:'real-c317-restore.js'}).runInContext(ctx);
const save={P:{x:20,y:64,z:20},c317:{p:[39,-4,39]},c320:{e:[['39,-4,39',0]],}};
C.enterWorld(save);assert.equal(C.P.x,20,'full ordinary load is not synchronously replaced by the same wrapper');
assert.equal(typeof C.__c317.restoreSavePosition,'function');
C.started=false;C.current.mode='creative';assert.equal(C.__c317.restoreSavePosition(),true);assert.equal(C.P.x,39);assert.equal(C.P.y,-3.95);assert.equal(C.P.z,39);assert.equal(C.P.vy,0);assert.equal(C.P.fallTop,null);assert.equal(C.__c317.soft,true);assert.equal(C.leaves,0,'flat-world cave does not alter frame/rotations');
// Legacy after-start timer still applies exactly the same restore contract when necessary.
C.current.mode='survival';C.started=true;C.P.x=20;C.P.y=64;C.P.z=20;timers[0]();assert.equal(C.P.y,-3.95);
// Match original stage: saved P restored, no ordinary chunks yet. Actual readiness
// restores C317 negative-Y cave once; C339 has initialized flat mode by this point.
ctx.chunkObjs=new Map();ctx.dirtyAll=false;ctx.i=2;
const source=production('  const chunksReady = () => {','  const tick = setInterval',text.indexOf('function enterWorld(save)'));
const before={...ctx.P};ctx.enterWorld={_savedDimension:null};ctx.__testSave=save;
ctx.__c321.pw=()=>({x:ctx.P.x,y:ctx.P.y,z:ctx.P.z});ctx.current.mode='flat';
 ctx.__c324.startSaved=q=>{ctx.__c324.savedEntry=true;ctx.__c324.savedEntryDone=false;return false;};
 ctx.__c324.cancelSaved=()=>{ctx.__c324.savedEntry=null;};
const nr=new vm.Script(`(()=>{var save=__testSave;${source}return chunksReady;})()`,{filename:'actual-readiness-metadata.js'}).runInContext(ctx);
assert.equal(nr(),false,'near cave handoff entered before public surface readiness');
assert.equal(ctx.P.x,39);assert.equal(ctx.P.y,-3.95,'C317 exact formula restored useful underground point');
assert.equal(ctx.__c324.savedEntry, true);
ctx.__c324.cancelEntry=()=>{ctx.__c324.loading=false;};
// Surface readiness does not manufacture ordinary off-map terrain to cover absent cave work.
const checkpoint={...ctx.P};
for(const [label,change]of [['reset',()=>ctx.__c105.phase='gen'],['UFO',()=>ctx.__c309.on=true],['dimension',()=>ctx.DIM.cur='agartha']]){
 change();ctx.save=save;assert.equal(nr(),false,'incomplete cave work cannot publish empty public owner in any loading transition');assert.deepEqual({...ctx.P},checkpoint,'no frame changes under '+label+' loading guard');
 ctx.__c105.phase=null;ctx.__c309.on=false;ctx.DIM.cur=null;
}
console.log('PASS real C317 saved restore and actual cave readiness ordering; negative expectations retained');
