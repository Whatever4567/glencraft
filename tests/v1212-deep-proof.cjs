'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');const {createCanvas}=require('canvas');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');const i=html.indexOf('(function v1212() {'),code=html.slice(i,html.indexOf('\n})();',i))+'\n})();';
const ti=html.indexOf('!function(t,e){"object"==typeof exports');const ctx=vm.createContext({console,setInterval:()=>0,clearInterval(){},document:{createElement:()=>createCanvas(1,1)}});ctx.window=ctx;ctx.self=ctx;vm.runInContext(html.slice(ti,html.indexOf('\n',ti)),ctx);
vm.runInContext(`var W=80,D=80,H=40,T={STONE:3,DEEPSLATE:133,AIR:0,LAVA:52,DIAMONDORE:69},DIM={cur:null},cityGen=false,started=false,current={},ISL_C=[40,40];
var NAMES={},FACES={},ICON_KEY={},HARD={},MC_HARD={},NEEDS_PICK=new Set(),PLACEABLE=new Set(),ORDER=[],CREATIVE_ALL=[],texCache={},texImg={},AVG={},BLOCK_MATS={},matCache={},ICONS={};
var world=new Uint16Array(W*H*D);const idx=(x,y,z)=>(x*H+y)*D+z;function dropsFor(b){return [[b,1]]}
function generate(){for(let x=0;x<W;x++)for(let z=0;z<D;z++){for(let y=1;y<30;y++)world[idx(x,y,z)]=y<21?133:3;world[idx(x,0,z)]=211;}world[idx(5,15,5)]=69;world[idx(6,12,6)]=0;}
var saved=null;function serialize(){return {}}function applySave(d){}function updatePlayer(){}`,ctx);
vm.runInContext(code,ctx);vm.runInContext('generate()',ctx);const R=s=>JSON.parse(vm.runInContext('JSON.stringify('+s+')',ctx));let p=0;const t=(n,f)=>{f();p++;console.log('PASS',n);};
t('5 blocks registered on 770-774 with own materials/icons',()=>{assert.equal(R('__v1212.err'),null);assert.deepEqual(R('Object.values(__v1212.ids)'),[770,771,772,773,774]);assert(R('[770,771,772,773,774].every(i=>BLOCK_MATS[i]&&ICONS[i]&&PLACEABLE.has(i))'));});
t('ordered smooth bands down a column (no random mixing); ores/air/bedrock and rock above y21 untouched',()=>{const col=R('Array.from({length:30},(_,y)=>world[idx(10,y,10)])');const seq=col.slice(1,22).filter((v,i,a)=>i===0||v!==a[i-1]);assert.deepEqual(seq.filter(v=>v>=770),[773,772,771,770]);assert.equal(col[0],211);assert.equal(col[25],3);assert.equal(R('world[idx(5,15,5)]'),69);assert.equal(R('world[idx(6,12,6)]'),0);});
t('watcher chamber: hollow bowl, brick shell, pillars, lava ring, eye saved',()=>{assert.equal(R('world[idx(40,10,40)]'),0);assert.equal(R('world[idx(40,3,40)]'),774);assert(R('world.indexOf(52)')>=0);assert.equal(R('world[idx(47,8,40)]'),772);const s=R('(applySave({v1212eye:[1,2,3]}),serialize())');assert.deepEqual(s.v1212eye,[1,2,3]);});
console.log(p,'passed');
