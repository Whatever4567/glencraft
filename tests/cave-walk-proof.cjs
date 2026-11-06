'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const start=html.indexOf('(function deepWorld()'),end=html.indexOf('\n/* GLX-AGU',start);
assert(start>=0&&end>start,'exact one authoritative deepWorld');const src=html.slice(start,end);
const T={AIR:0,GRASS:1,STONE:3,LOG:8,LEAVES:9,WSTONE:156,WOOLPURPLE:70,LAVA:52,HBEDROCK:211,CRYVIOLET:246,CRYCYAN:245,GEODE:190,BASALTCOL:200,MAGMA:208,DEEPSLATE:133,DSCOBBLE:249,DSTILE:229,GRAVEL:202,MOSSYBRICK:29,OBSIDIAN:189,BLACKSTONE:248,MOONBASALT:193,HELLROCK:206,GLOWROCK:209};
const callbacks=[],c=vm.createContext({console,Math,Map,Set,performance,SEA:41,T,__c317:{on:()=>true},setB(){},DIM:{cur:null},P:{},__c324:{cache:{clear(){}}},__c320:{flat:true,fearth:()=>99,edits:new Map()},HARD:[],MC_HARD:[],REQ:[],NEEDS_PICK:new Set(),NAMES:[],setInterval:f=>callbacks.push(f)});
c.window=c;vm.runInContext(src,c);callbacks.find(f=>String(f).includes('try { hook(); }'))();
assert.equal(c.__dw.on,1);assert(!c.__dw.err,c.__dw.err);assert.equal(c.__dw.ver,'1.2.2');
const g=(x,y,z)=>c.__dw.gen(x,y,z,41-y);
for(const y of [-60,-85,-122,-157]){let air=0;for(let x=428;x<=436;x+=2)for(let z=176;z<=184;z+=2)if(g(x,y,z)===0)air++;assert(air>=12,'open central chamber '+y+' '+air);}assert.equal(g(432,-209,180),0,'original eye-posited dry open space');
for(const y of [-70,-106,-142,-167,-188])assert.notEqual(g(472,y,180),0,'solid off-passage strata');
assert.equal(g(432,-237,180),211,'unaltered floor');

const cut=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
const collide=cut('function collides(x, y, z)', '// stepping up');
const axes=cut('function moveAxis(dx, dz)', 'function moveY(dt)');
const gravity=cut('function moveY(dt)', 'function spawnPlayer()');
c.R=.3;c.HEIGHT=1.8;c.P={x:432.5,y:-67,z:180.5,vy:0,onGround:true,fallTop:null};
c.solid=(x,y,z)=>{const b=g(x,y,z);return b!==0&&b!==T.LAVA;};c.sfx=()=>{};c.matOf=()=>'';c.getB=g;const fallDamage=[];c.hurt=(n,why)=>{if(why.includes('long fall'))fallDamage.push(n);};c.spawnPlayer=()=>{};c.groundT=0;c.landDip=0;
vm.runInContext(collide+axes+gravity,c);
let frames=0,maxDrop=0,prevY=c.P.y;
function go(x,z){for(let f=0;f<1800;f++){const dx=x-c.P.x,dz=z-c.P.z,r=Math.hypot(dx,dz);if(r<.02){for(let k=0;k<40;k++)c.moveY(1/60);assert(c.P.onGround,'each waypoint settles on support');return;}
 const step=Math.min(.045,r);c.moveAxis(dx/r*step,0);c.moveAxis(0,dz/r*step);c.moveY(1/60);frames++;assert(!c.collides(c.P.x,c.P.y,c.P.z),'AABB no penetration');for(const ox of [-.3,.3])for(const oz of [-.3,.3])for(const dy of [.01,.9,1.79])assert.notEqual(g(Math.floor(c.P.x+ox),Math.floor(c.P.y+dy),Math.floor(c.P.z+oz)),T.LAVA,'dry body clearance');maxDrop=Math.max(maxDrop,prevY-c.P.y);prevY=c.P.y;
 }throw Error('route obstructed approaching '+JSON.stringify({x,z,P:c.P}));}
go(432.5,178.5);go(492.5,178.5);
for(let n=16;n<=183;n++){const q=c.__dw.routePoint(n);go(q[0]+.5,q[1]+.5);}
go(480.5,180.5);go(432.5,180.5);
assert(c.P.y>=-235.01&&c.P.y<=-234.99,'lands on dry core approach');assert(c.P.onGround,'gravity settles on support');assert.equal(fallDamage.length,0,'no damaging unsupported fall');
// Executes exact collision/moveAxis/moveY primitives, not full updatePlayer wrappers.
// Generic old-world respawn callback is inert; no gravity/collision code is changed.
console.log('PASS production .6x1.8 AABB, moveAxis and gravity descent, no jump/fly/teleport',{frames,final:c.P,maxDrop});
