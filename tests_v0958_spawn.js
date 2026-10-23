const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:800,height:450}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/index.html?t230');await p.waitForFunction(()=>screen==='title',null,{timeout:300000});
await p.evaluate(()=>{current={id:'t230',name:'S',mode:'survival',created:Date.now()};enterWorld(null)});await p.waitForFunction(()=>started,null,{timeout:300000});await p.waitForTimeout(2000);
let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' '+JSON.stringify(x):''));if(!c)fails++;};
const r=await p.evaluate(()=>{setInterval(()=>{paused=false;menuOpen=false;hp=20},100);dayClock=CYCLE*0.25;updateSky&&updateSky(0.01);
 const out={};const x=Math.floor(P.x)+30,z=Math.floor(P.z),top=groundTop(x,z),y=Math.max(8,top-25);
 // dark room 9x9x5 deep underground, stone floor
 for(let a=-4;a<=4;a++)for(let c=-4;c<=4;c++){for(let k=-1;k<=6;k++)setB(x+a,y+k,z+c,T.STONE);for(let k=0;k<5;k++)setB(x+a,y+k,z+c,T.AIR);}
 out.day=isNight;out.darkCave=__c73check(x,y,z);out.bigCave=__c73check(x,y,z,true);
 setB(x+2,y-1,z,T.GLASS);out.glass=__c73check(x+2,y,z);
 const st=[...Array(256).keys()].find(i=>IS_STAIR[i]);setB(x-2,y-1,z,st);out.stair=__c73check(x-2,y,z);
 setB(x,y-1,z+3,T.LEAVES);out.leaves=__c73check(x,y,z+3);
 setB(x,y,z-2,T.WATER);out.water=__c73check(x,y,z-2);setB(x,y,z-2,T.AIR);
 setB(x+4,y,z+4,T.TORCH);out.torchNear=__c73check(x+3,y,z+3);out.torchFar=__c73check(x,y,z);out.unlitBeyond=(()=>{for(let a=-4;a<=4;a++)for(let c=-4;c<=4;c++)setB(x+a+40,y-1,z+c,T.STONE),setB(x+a+40,y,z+c,T.AIR),setB(x+a+40,y+1,z+c,T.AIR),setB(x+a+40,y+2,z+c,T.STONE);return __c73check(x+40,y,z)})();
 // surface: open sky at day vs night
 const sx=Math.floor(P.x)+28,sz=Math.floor(P.z)+5,sy=groundTop(sx,sz)+1;setB(sx,sy-1,sz,T.GRASS);for(let k=0;k<4;k++)setB(sx,sy+k,sz,T.AIR);out.surfFloor=getB(sx,sy-1,sz);out.surfDay=__c73check(sx,sy,sz);
 dayClock=CYCLE*0.75;updateSky(0.01);out.night=isNight;out.surfNight=__c73check(sx,sy,sz);dayClock=CYCLE*0.25;updateSky(0.01);
 out.room=[x,y,z];return out;});
console.log(JSON.stringify(r));
ok(r.darkCave==='ok','dark cave spawns by day',r.darkCave);ok(r.glass==='floor','glass floor blocks',r.glass);ok(r.stair==='floor','slab/stair floor blocks',r.stair);
ok(r.leaves==='floor','leaves block');ok(r.water!=='ok','water blocks',r.water);ok(r.torchNear==='blocklight'&&r.torchFar==='blocklight','torch stops spawns around it (light reaches 7 blocks)',[r.torchNear,r.torchFar]);
ok(r.unlitBeyond==='ok','dark again beyond the torch light',r.unlitBeyond);ok(r.surfDay==='skylight','surface by day: no spawn',r.surfDay);ok(r.night&&r.surfNight==='ok','surface at night: spawns',[r.surfNight,r.surfFloor]);
// live spawner, daytime, player in a deep cave
const live=await p.evaluate(async()=>{for(const a of mobs.slice())if(a.hostile||a.giant)removeMob(a);const cv=__deepCaves[0];P.x=cv[0];P.z=cv[2];P.y=cv[1];
 await new Promise(r=>setTimeout(r,1500));const bad=[];for(let i=0;i<400&&__c73().natural<12;i++){__c73tick();}
 for(const a of mobs.filter(m=>m.natural)){const q=a.g.position,x=Math.floor(q.x),y=Math.round(q.y),z=Math.floor(q.z);const L=__lightChunk(Math.floor(x/CH),Math.floor(z/CH))(x,y,z);const d=Math.hypot(q.x-P.x,q.y-P.y,q.z-P.z);if(!L||L[1]>0||L[0]>7||d<24||world[idx(x,y-1,z)]===T.GLASS||world[idx(x,y,z)]===T.WATER)bad.push([a.kind,x,y,z,L,d|0]);}
 return {c:__c73(),bad,day:!isNight};});
console.log(JSON.stringify(live.c));
ok(live.c.natural>0&&live.c.natural<=12,'spawner fills dark caves by day, capped',live.c.kinds);ok(!live.bad.length,'every spawn obeys light/floor/distance',live.bad);
const t=await p.evaluate(()=>{const t0=performance.now();for(let i=0;i<20;i++)__c73tick();return (performance.now()-t0)/20;});ok(t<15,'tick cost ms',t.toFixed(2));
ok(!errs.length&&!(await p.evaluate(()=>window.__c73err)),'no errors',errs);
const sp=await p.evaluate(()=>[__spawn('yellow_creeper'),__spawn('giant_spider')]);ok(/yellow_creeper/.test(sp[0])&&/giant_spider/.test(sp[1]),'__spawn debug hook',sp);
console.log(fails?'SOME FAIL':'ALL PASS');await b.close();})();
