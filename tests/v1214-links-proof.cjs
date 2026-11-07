'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');const {createCanvas}=require('canvas');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');const grab=n=>{const i=html.indexOf('(function '+n+'() {');return html.slice(i,html.indexOf('\n})();',i))+'\n})();';};
function mk(cave,ag=1){const ti=html.indexOf('!function(t,e){"object"==typeof exports');const ctx=vm.createContext({console,setInterval:()=>0,clearInterval(){},document:{createElement:()=>createCanvas(1,1)}});ctx.window=ctx;ctx.self=ctx;vm.runInContext(html.slice(ti,html.indexOf('\n',ti)),ctx);
vm.runInContext(`var W=160,D=160,H=40,T={STONE:3,DEEPSLATE:133,AIR:0,LAVA:52,WATER:5,GLASS:63,DIAMONDORE:69},DIM={cur:null},cityGen=false,started=false,current={},ISL_C=[80,80];
var NAMES={},FACES={},ICON_KEY={},HARD={},MC_HARD={},NEEDS_PICK=new Set(),PLACEABLE=new Set(),ORDER=[],CREATIVE_ALL=[],texCache={},texImg={},AVG={},BLOCK_MATS={},matCache={},ICONS={};
var __c294={M:${ag}?{x:40,z:150,e:'S',c:40}:null};var world=new Uint16Array(W*H*D);const idx=(x,y,z)=>(x*H+y)*D+z;function dropsFor(b){return [[b,1]]}
function generate(){world.fill(0);for(let x=0;x<W;x++)for(let z=0;z<D;z++){for(let y=1;y<30;y++)world[idx(x,y,z)]=y<21?133:3;world[idx(x,0,z)]=211;}
 if(${cave})for(let x=120;x<150;x++)for(let y=12;y<15;y++)for(let z=60;z<64;z++)world[idx(x,y,z)]=0;
 world[idx(20,10,20)]=69;world[idx(80,2,80)]=69;}
function serialize(){return {}}function applySave(d){}function updatePlayer(){}`,ctx);
vm.runInContext(grab('v1212'),ctx);vm.runInContext(grab('v1214'),ctx);vm.runInContext('generate()',ctx);return ctx;}
let p=0;const t=(n,f)=>{f();p++;console.log('PASS',n);};
const c=mk(true),R=s=>JSON.parse(vm.runInContext('JSON.stringify('+s+')',c));
t('link built without errors, two halls',()=>{assert.equal(R('__v1212.err'),null);assert.equal(R('__v1214.err'),null);const l=R('__v1214.link');assert(l,R('__v1214.why'));assert.deepEqual(l.halls,['falls','ruin']);console.log('  ',JSON.stringify(l),'cells',R('__v1214.cells'));});
t('walkable air path (2 high) from bowl interior to the cave, no digging',()=>{assert(R(`(()=>{const ok=(x,y,z)=>x>0&&z>0&&x<W&&z<D&&y>0&&y<H-1&&world[idx(x,y,z)]===0&&world[idx(x,y+1,z)]===0;const seen=new Uint8Array(W*H*D),q=[[80,6,80]];seen[idx(80,6,80)]=1;
 while(q.length){const [x,y,z]=q.pop();if(x>=120&&y>=12&&y<15&&z>=60&&z<64)return true;for(const [a,b,e] of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0],[0,-1,0],[1,1,0],[-1,1,0],[0,1,1],[0,1,-1],[1,-1,0],[-1,-1,0],[0,-1,1],[0,-1,-1]]){const X=x+a,Y=y+b,Z=z+e;if(!ok(X,Y,Z)||seen[idx(X,Y,Z)])continue;seen[idx(X,Y,Z)]=1;q.push([X,Y,Z]);}}return false;})()`));});
t('lava fall, trench lava, ruined brick bridge present',()=>{assert(R('__v1214.fall'));const f=R('__v1214.fall');assert(f[3]-f[1]>=4);assert(R('world.filter(v=>v===774).length')>0);});
t('nothing changed at/below y2 or above y21; far ore kept; bedrock kept',()=>{assert.equal(R('world[idx(20,10,20)]'),69);assert(R(`(()=>{for(let x=0;x<W;x++)for(let z=0;z<D;z++){if(world[idx(x,0,z)]!==211)return false;for(let y=22;y<30;y++)if(world[idx(x,y,z)]!==3)return false;}return true})()`));});
t('save carries link; load restores',()=>{assert(R('serialize().v1214link'));assert.equal(R('(applySave({}),__v1214.link)'),null);});
t('every lava cell sealed: no air beside or below it',()=>{assert(R('__v1214.lava')>0);assert.equal(R(`(()=>{let n=0;for(let x=1;x<W-1;x++)for(let z=1;z<D-1;z++)for(let y=1;y<22;y++){if(world[idx(x,y,z)]!==52)continue;for(const [a,b,c] of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,-1,0]])if(world[idx(x+a,y+b,z+c)]===0)n++;}return n})()`),0);assert(R('world.indexOf(63)')>=0);});
t('nothing carved within 45 of the Agartha mouth/edge run',()=>{assert(R(`(()=>{for(let x=0;x<W;x++)for(let z=100;z<D;z++)for(let y=3;y<21;y++)if(Math.hypot(x-40,z-Math.max(150,Math.min(159,z)))<44&&world[idx(x,y,z)]!==133&&world[idx(x,y,z)]<770)return false;return true})()`));});
const c3=mk(true,0);t('Agartha record missing: fail closed, nothing carved',()=>{assert.equal(vm.runInContext('__v1214.link',c3),null);assert.match(vm.runInContext('__v1212.why',c3),/Agartha footprint/);assert.equal(vm.runInContext('__v1212.eye',c3),null);assert.equal(vm.runInContext('__v1214.cells',c3),0);});
const c2=mk(false);t('no cave nearby: exact reason, no carving',()=>{assert.equal(vm.runInContext('__v1214.link',c2),null);assert.match(vm.runInContext('__v1214.why',c2),/no natural cave air/);assert.equal(vm.runInContext('__v1214.cells',c2),0);});
console.log(p,'passed');
