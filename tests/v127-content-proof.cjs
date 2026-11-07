'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(process.env.V127_HTML||path.join(__dirname,'../index.html'),'utf8');
const i=html.indexOf('(function v127() {'),code=html.slice(i,html.indexOf('\n})();',i))+'\n})();';
const store={};const ctx=vm.createContext({console,setInterval:()=>0,clearInterval(){},document:{getElementById:()=>null},localStorage:{setItem:(k,v)=>store[k]=v}});ctx.window=ctx;
vm.runInContext(`var SET={},IT={POTATO:36,TATTIES:38,BREAD:35},inv={36:4,38:2,35:3},ORDER=[35,36,38,1],CREATIVE_ALL=[36,38,1],RECIPES=[{out:38,need:[[36,1]]},{out:89,need:[[38,1],[37,1]]},{out:35,need:[[34,3]]}];
var mobs=[],removed=[],other=[{kind:'boat'}];function removeMob(a){removed.push(a);mobs.splice(mobs.indexOf(a),1);}function spawnMob(k){const a={kind:k};mobs.push(a);return a;}
function saveSet(){localStorage.setItem('glen_set',JSON.stringify(SET));}var added=[],dropped=[];function addItem(id,n){added.push(id);}function dropItem(id){dropped.push(id);}`,ctx);
vm.runInContext(code,ctx);let p=0;const t=(n,f)=>{f();p++;console.log('PASS',n);};
const R=s=>JSON.parse(vm.runInContext('JSON.stringify('+s+')',ctx));
t('mobs spawn normally when setting off',()=>{vm.runInContext('spawnMob("sheep");spawnMob("zombie")',ctx);assert.equal(R('mobs.length'),2);});
t('Disable mobs: spawns blocked, existing removed via removeMob, other entities untouched, persisted',()=>{vm.runInContext('SET.noMobs=true;saveSet();__v127.sweep();var r=spawnMob("zombie");',ctx);assert.equal(R('mobs.length'),0);assert.equal(R('removed.length'),2);assert.equal(R('r'),null);assert.equal(R('other.length'),1);assert.equal(JSON.parse(store.glen_set).noMobs,true);});
t('turning it off restores spawning',()=>{vm.runInContext('SET.noMobs=false;spawnMob("sheep")',ctx);assert.equal(R('mobs.length'),1);});
t('retired foods hidden from lists/recipes/inventory, cannot be gained or dropped; other items fine',()=>{assert.deepEqual(R('ORDER'),[35,1]);assert.deepEqual(R('CREATIVE_ALL'),[1]);assert.deepEqual(R('RECIPES.map(r=>r.out)'),[35]);assert.deepEqual(R('Object.keys(inv)'),['35']);
 vm.runInContext('addItem(36,1);addItem(35,1);dropItem(38);dropItem(35)',ctx);assert.deepEqual(R('added'),[35]);assert.deepEqual(R('dropped'),[35]);});
t('no public mention of the retired foods in v1.2.7 notes',()=>{const n=html.slice(html.indexOf('{"v":"v1.2.7"'),html.indexOf('}',html.indexOf('{"v":"v1.2.7"')));assert(!/potato|tattie/i.test(n));});
console.log(p,'passed');
