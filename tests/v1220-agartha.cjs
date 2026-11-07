const fs=require('fs'),vm=require('vm');const src=fs.readFileSync(__dirname+'/../tools/content-source/agartha-1220.js','utf8');
const ctx={window:{},T:{GRASS:1,DIRT:2,GLOWCAP:100},NAMES:{1:'Grass',2:'Dirt',5:'Oak log',6:'Leaves',9:'Stone'},LEAFY:{6:1},PLANT:{7:1},THREE:{},performance:{now:()=>0},requestAnimationFrame:()=>{},mobs:[],reachMob:()=>null,hitMob:()=>{},damageMob:()=>{},console};
ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);const U=ctx.__ag1220;
const SW=80,SD=80,YN=20,F=6,ix=(x,z,y)=>(x*SD+z)*YN+y,st=new Uint16Array(SW*SD*YN);
for(let x=0;x<SW;x++)for(let z=0;z<SD;z++){for(let y=0;y<F-1;y++)st[ix(x,z,y)]=9;st[ix(x,z,F-1)]=1;}
for(let y=F;y<F+5;y++)st[ix(20,40,y)]=5;st[ix(20,40,F+5)]=6;st[ix(30,30,F)]=7;
const A={city:[40,40+1000,30],FL:F,spires:[]};U.post(st,A,SW,SD,YN,1000,400,-50);
let bad=0;const ok=(n,v)=>{if(!v){bad++;console.log('FAIL',n);}};
ok('trees gone',st[ix(20,40,F+2)]===0&&st[ix(20,40,F+5)]===0&&U.trees===6);
let gl=0,cap=0;for(let x=0;x<SW;x++)for(let z=0;z<SD;z++){const b=st[ix(x,z,F-1)];if(b===771)gl++;if(b===100)cap++;}
ok('gloam floor',gl>1000);ok('glowcap paths',cap>100);ok('outside city untouched',st[ix(1,1,F-1)]===1);ok('under floor stone kept',st[ix(40,40,2)]===9);
const r=U.ring;ok('ring world coords',r.X===440.5&&r.Z===40.5&&r.Y===F-50&&r.R>5);
// every ring node stands on a path or gloam block with air above
let onCap=0;for(let k=0;k<70;k++){const a=k/70*6.283,x=Math.floor(r.X-400+Math.cos(a)*r.R),z=Math.floor(r.Z+Math.sin(a)*r.R);if(st[ix(x,z,F-1)]===100&&!st[ix(x,z,F)])onCap++;}
ok('actors walk on glowcap',onCap>=60);
console.log('trees',U.trees,'gloam',gl,'cap',cap,'ring',JSON.stringify(r),'onCap',onCap);console.log(bad?'FAIL':'agartha ok');process.exit(bad?1:0);
