'use strict';
const assert=require('assert/strict'),h=require('./cave-regression.cjs'),vm=require('vm');
const from=h.text.indexOf('(function c320()');
const defs=h.production('  const key = (x, y, z)','  let GB = null;',from);
const writes=h.production("  try { const s0 = setB; setB = function", '  // ---------- drawing: ocean',from);
const saves=h.production("  try { const se = serialize; serialize = function", '})();',from);
const c=vm.createContext({console,Map,Set,Math,Uint8Array,T:h.T,W:64,H:12,D:64,PLANT:{},__c320:{edits:new Map(),earth:()=>1},DIM:{cur:null},current:{id:'isolated-test-slot'},__c317:{on:()=>true,wall:()=>false},__c318:{bodies:[],by:{mars:null}},__XZ:()=>0,
 s0:void 0,getB(x,y,z){return y>=0&&y<12?7:0;},setB(){},serialize(){return {world:'isolated-synthetic-bytes',inv:{1:17},armour:[1,0,3],placedOriginal:true};},enterWorld(save){c.entered=(c.entered||0)+1;return 'loaded';}});
c.window=c;c.ERR=(where,err)=>{ throw where+': '+err; };vm.runInContext(`const U = __c320, earth = U.earth, S7 = () => __c317, on=()=>true, foot=()=>false, wall=()=>false;${defs}${writes}${saves}`,c);
c.setB(4,-2,7,1);c.setB(4,-3,7,0);assert.deepEqual([...c.__c320.edits],[['4,-2,7',1],['4,-3,7',0]],'AIR remains a first-class saved edit');
const save=c.serialize();assert.deepEqual(Array.from(save.c320.e),[['4,-2,7',1],['4,-3,7',0]]);assert.equal(save.inv[1],17);
for(const dim of ['agartha','hell']){c.DIM.cur=dim;const dd=c.serialize();assert.equal(dd.c320,undefined,'dimension save not aliasing Earth edits');
 c.__c320.edits.clear();c.enterWorld(dd);assert.equal(c.__c320.edits.size,0,'dimension entry cannot overwrite current deep edit map');
 c.__c320.edits.set('8,-4,9',dim==='hell'?5:7);const other=c.__c320.edits;const dif=new Map([['8,-4,9',9]]);c.__c320.edits=dif;
 c.DIM.cur='agartha'===dim?'hell':'agartha';assert.equal(c.__c320.edits.get('8,-4,9'),9,'independent per-dimension own voxel store');
 c.DIM.cur=null;c.enterWorld(save);assert.equal(c.__c320.edits.get('4,-2,7'),1);assert.equal(c.__c320.edits.get('4,-3,7'),0,'AIR survives enterWorld loader');assert.equal(save.placedOriginal,true);
}
const st=vm.runInNewContext(`function dimKey(name){return 'dim_'+current.id+'_'+name;} current={id:'isolated-test-slot'}; ['agartha','hell'].map(dimKey)`);assert.deepEqual(JSON.parse(JSON.stringify(st)),['dim_isolated-test-slot_agartha','dim_isolated-test-slot_hell']);
console.log(JSON.stringify({pass:true,airRestored:c.__c320.edits.get('4,-3,7'),buildPreserved:c.__c320.edits.get('4,-2,7'),inventoryPreserved:save.inv,dimensionKeys:st.slice(0,2),recordsTouched:'none, synthetic vm only'}));
