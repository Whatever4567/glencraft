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
const features={fungus:0,crystal:0,basalt:0,lava:0,coreLava:0};
for(let x=365;x<501;x++)for(let y=-235;y<=-48;y++)for(let z=109;z<=251;z++){const b=g(x,y,z);assert(Number.isInteger(b)&&Object.values(T).includes(b),"known existing material id");
    if(b===T.WOOLPURPLE)features.fungus++;if(b===T.CRYVIOLET)features.crystal++;if(b===T.BASALTCOL)features.basalt++;if(y<=-145&&y>-176&&b===T.LAVA)features.lava++;if(y<=-201&&y>=-236&&b===T.LAVA)features.coreLava++;}
for(const [name,n] of Object.entries(features))assert(n>0,'actual '+name+' geometry');
// Specific bounded full-depth sample disproves material-only full cylinders / zero volume.
assert(!c.__dw.err,c.__dw.err);
for(const q of c.__dw.rooms){let air=0,blocks=0;const offset=(q.name==='abyssal-crystal'||q.name==='molten')?36:0;for(let x=424;x<=440;x+=3)for(let y=q.floor;y<=q.roof-2;y+=3)for(let z=172;z<=188;z+=3){const b=g(x+offset,y,z);if(b===0)air++;else blocks++;}assert(air>100&&blocks>=30,q.name+' actual open/solid voxel volume');}
for(const y of [-52,-87,-122,-157]){let portal=0;for(let x=440;x<=480;x++)for(let z=168;z<=192;z++)if(g(x,y,z)===0)portal++;assert(portal>50,'shaft/landing joins chamber');}
// Direct owner domain only; unchanged later Agartha wrapper owns -50..-2 exactly.
const agu=html.slice(html.indexOf('/* GLX-AGU'),html.indexOf('/* GLX-UKB',html.indexOf('/* GLX-AGU')));
assert(!agu.includes('verticalPass')&&!agu.includes('deep-world-terrain'),'original Agartha wrapper untouched');
assert.equal(c.__c320.fearth(500,50,74),99,'surface delegation');
const edits=[['400,-120,180',5],['399,-120,180',0],['400,-250,180',0]];for(const q of edits)c.__c320.edits.set(...q);c.__dw.rebuildLegacy();
assert.equal(c.__c320.edits.size,3,'generation does not reset/change edits');assert.equal(c.__c320.edits.get('399,-120,180'),0,'AIR preserved');assert(c.__dw.legacyOpen(400,-238,180),'old below-floor paths stay open');
assert.equal(g(432,-237,180),211,'bedrock still -237 after read');
console.log(JSON.stringify({pass:true,rooms:c.__dw.rooms.map(q=>({name:q.name,floor:q.floor,ceiling:q.roof})),eye:[432,-209,180],route:[486,-52,180,'square ramp starts below protected Agartha'],features,editsPreserved:[...c.__c320.edits],floors:[-237],agarthaWrapper:'unchanged extraction, reserved -50..-2',surfaceDelegate:99,limitations:'non-browser generator proof only; separate primitive walk proof; no full updatePlayer/browser/pixel proof; no surface tunnel added'}));

// Deterministic two-block-tall AIR connectivity; this is not walking-physics proof.
const minX=425,maxX=496,minZ=170,maxZ=190,minY=-235,maxY=-52,W=maxX-minX+1,D=maxZ-minZ+1,H=maxY-minY+1,N=W*D*H;
const state=new Uint8Array(N),queue=new Int32Array(N),idx=(x,y,z)=>((y-minY)*D+(z-minZ))*W+x-minX;
const targets=[[432,-60,180],[432,-85,180],[432,-122,180],[432,-157,180],[472,-178,180],[472,-197,180],[432,-220,180]];
let first=0,last=0;queue[last++]=idx(...targets[0]);state[queue[0]]=2;
while(first<last){const n=queue[first++],x=n%W+minX,z=Math.floor(n/W)%D+minZ,y=Math.floor(n/(W*D))+minY;
for(const [dx,dy,dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const X=x+dx,Y=y+dy,Z=z+dz;if(X<minX||X>maxX||Z<minZ||Z>maxZ||Y<minY||Y>maxY)continue;const k=idx(X,Y,Z);if(state[k])continue;if(g(X,Y,Z)===0&&g(X,Y+1,Z)===0){state[k]=2;queue[last++]=k;}else state[k]=1;}}
const reachable=targets.map(q=>({xyz:q,reached:state[idx(...q)]===2}));console.log({reachable,visited:last});assert(reachable.every(q=>q.reached),'connected two-block-tall air volume (not walking physics)');

for(let x=408;x<=456;x+=3)for(let y=-233;y<=-185;y+=3)for(let z=156;z<=204;z+=3){if((x-432)**2+(y+209)**2+(z-180)**2<24**2)assert.equal(g(x,y,z),0,'original 24-radius eye clearance');}
assert(!c.__dw.err,c.__dw.err);
console.log('PASS connected seven-room air volume and unchanged giant-eye clearance');

let moltenLava=0;for(let x=370;x<=495;x+=2)for(let z=118;z<=242;z+=2)for(let y=-185;y<=-169;y++)if(g(x,y,z)===T.LAVA)moltenLava++;
assert(moltenLava>20,'distinct localized molten river/fall geometry');
console.log('PASS separate molten-depth lava features',moltenLava);
