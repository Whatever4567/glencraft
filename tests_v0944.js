const {chromium}=require('playwright-core');const dir='/workspace/game/shots/g8/';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1000,height:580}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8765/index.html?t182');await p.waitForFunction(()=>screen==='title',null,{timeout:300000});
await p.evaluate(()=>{window.confirm=()=>true;current={id:'t182',name:'S',mode:'survival',created:Date.now(),newCastles:true};enterWorld(null)});await p.waitForFunction(()=>started,null,{timeout:300000});await p.waitForTimeout(2000);
await p.evaluate(()=>{setInterval(()=>{paused=false;menuOpen=false;if(!window.__hpLock)hp=20;food=20;if(!DIM.cur)dayClock=CYCLE*0.3},100);window.__gt=0;const up=updatePlayer;updatePlayer=function(dt){window.__gt+=dt;return up.apply(this,arguments);};window.gwait=s=>new Promise(r=>{const t0=__gt;const f=()=>__gt-t0>=s?r():setTimeout(f,100);f();});TS=4;});
let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' '+JSON.stringify(x):''));if(!c)fails++;};
// interiors: most open roofed floor inside each castle
const spots=await p.evaluate(()=>{const out=[];for(const c of g9castles){if(c[0]==='peak')continue;let best=null;const g=solidTop(c[1],c[2]);for(let x=c[1]-18;x<=c[1]+18;x++)for(let z=c[2]-18;z<=c[2]+18;z++)for(let y=Math.max(3,g-6);y<g+14;y++){const f=world[idx(x,y-1,z)];if(!f||f===T.WATER||world[idx(x,y,z)]||world[idx(x,y+1,z)])continue;let roof=0;for(let yy=y+2;yy<y+9;yy++)if(world[idx(x,yy,z)]){roof=1;break;}if(!roof)continue;let o=0;for(let a=-4;a<=4;a++)for(let d=-4;d<=4;d++)if(!world[idx(x+a,y,z+d)]&&!world[idx(x+a,y+1,z+d)]&&world[idx(x+a,y-1,z+d)])o++;if(!best||o>best[0])best=[o,x,y,z];}if(best)out.push([c[0],...best]);}return out;});
console.log('halls',JSON.stringify(spots));
for(const [k,o,x,y,z] of spots.slice(0,3))for(const yaw of [0.3,2.4]){await p.evaluate(([x,y,z,yaw])=>{P.x=x+.5;P.z=z+.5;P.y=y;P.vy=0;P.yaw=yaw;P.pitch=-0.1;if(camMode)toggleCamera();rebuild();},[x,y,z,yaw]);await p.waitForTimeout(3500);await p.screenshot({path:dir+`hall_${k}_${yaw}.png`});}
// bullets
const bl=await p.evaluate(()=>{{const x=Math.floor(P.x)+1,z=Math.floor(P.z);setB(x,Math.floor(P.y),z,T.TABLE);}inv[IT.SILVERINGOT]=1;inv[IT.GUNPOWDER]=1;const b0=inv[231]||0;const i=RECIPES.findIndex(r=>r.out===231);craft(i);return [b0,inv[231]||0,inv[IT.SILVERINGOT],inv[IT.GUNPOWDER]];});
ok(bl[1]-bl[0]===8&&bl[2]===0&&bl[3]===0,'silver bullets: 1 ingot + 1 gunpowder -> 8',bl);
// cauldron/furnace: no particles
const cf=await p.evaluate(async()=>{const x=Math.floor(P.x)+3,z=Math.floor(P.z);const g=solidTop(x,z)+1;setB(x,g,z,T.FURNACE);setB(x+2,g,z,T.CAULDRON);try{const c=[...cauldrons.values()].find(c=>c.x===x+2&&c.z===z);if(c){c.boil=true;c.water=3;c.heat=1;}}catch(_){}const fk=keyOf(x,g,z);try{furnaces.set(fk,Object.assign(furnaces.get(fk)||{},{fuel:9999,burn:99,inp:{id:T.SAND,n:8},cook:0}))}catch(_){}rebuild();let mx=0;for(let i=0;i<20;i++){await gwait(0.3);const n=parts.filter(q=>Math.abs(q.m.position.x-(x+1.5))<2.5&&Math.abs(q.m.position.z-(z+.5))<2&&Math.abs(q.m.position.y-g)<2.5).length;mx=Math.max(mx,n);}return {maxNew:mx};});
ok(cf.maxNew===0,'no mini-block particles from cauldron/furnace',cf);
// swim
const sw=await p.evaluate(async()=>{for(let t=0;t<60000;t++){const x=20+Math.floor(Math.random()*(W-40)),z=20+Math.floor(Math.random()*(D-40));const st=solidTop(x,z);let wy=-1;for(let y=H-3;y>3;y--){if(world[idx(x,y,z)]===T.WATER){wy=y;break;}if(world[idx(x,y,z)])break;}if(wy>0&&world[idx(x,wy-2,z)]===T.WATER&&world[idx(x+3,wy-1,z)]===T.WATER){const SEA2=wy+1;let sp=0;const sf=sfx;sfx=function(n){if(n==='splash')sp++;return sf.apply(this,arguments)};if(!camMode)toggleCamera();P.x=x+.5;P.z=z+.5;P.y=SEA2+4;P.vy=-8;P.yaw=-Math.PI/2;await gwait(1.5);const u=worldModel.userData;keys.KeyW=true;await gwait(2);const mv=u.swimMv||0;const rotM=worldModel.rotation.x;keys.KeyW=false;await gwait(2.5);const idle=u.swimMv||0;sfx=sf;return {sp,deep:!!window.swimDeep,mv:+mv.toFixed(2),idle:+idle.toFixed(2),rotM:+rotM.toFixed(2)};}}return null;});
ok(sw&&sw.sp>=1&&sw.mv>0.5&&sw.idle<0.3,'splash on entry; crawl when moving, tread when idle',sw);
await p.screenshot({path:dir+'swim_tread.png'});await p.evaluate(()=>{keys.KeyW=true});await p.waitForTimeout(2500);await p.screenshot({path:dir+'swim_crawl.png'});await p.evaluate(()=>{keys.KeyW=false;if(camMode)toggleCamera();});
// bees
const bee=await p.evaluate(async()=>{const hv=[];for(let x=0;x<W;x++)for(let z=0;z<D;z++)for(let y=3;y<H-2;y++)if(world[idx(x,y,z)]===T.BEEHIVE)hv.push([x,y,z]);if(!hv.length)return {hives:0};
 hv.sort((a,b)=>Math.hypot(a[0]-P.x,a[2]-P.z)-Math.hypot(b[0]-P.x,b[2]-P.z));const h=hv[0];P.x=h[0]+4.5;P.z=h[2]+.5;P.y=solidTop(h[0]+4,h[2])+1;P.yaw=Math.PI/2;P.pitch=Math.atan2(h[1]-P.y-1.6,4)*-1*-1;
 await gwait(5);const bs=mobs.filter(a=>a.kind==='bee');const mine=bs.filter(b=>b.home&&b.home.join()===h.join()).length;const p0=bs.map(b=>b.g.position.clone());await gwait(3);const moved=bs.filter((b,i)=>b.g.position.distanceTo(p0[i])>0.2).length;
 const under=world[idx(h[0],h[1]+1,h[2])];const m=__beeHive.hiveMeta(h);
 inv[IT.SHEARS]=1;selId=IT.SHEARS;const d0=drops.length;const look=()=>{const dx=h[0]+.5-P.x,dy=h[1]+.5-(P.y+1.6),dz=h[2]+.5-P.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(dy,Math.hypot(dx,dz));};look();P.x=h[0]+.5;P.z=h[2]+.5;P.y=h[1]-2.3;P.vy=0;P.pitch=1.55;const rh=raycast(5);window.__rh=rh&&rh.hit;P.vy=0;P.y=h[1]-2.3;useItem();const comb=drops.slice(d0).filter(d=>d.id===IT.HONEYCOMB).reduce((s,d)=>s+d.n,0);
 m.honey=2;inv[IT.BOTTLE]=1;selId=IT.BOTTLE;P.y=h[1]-2.3;P.pitch=1.55;useItem();const honey=inv[IT.HONEYBOTTLE]||0;
 const b=bs[0];const hp0=hp;b.g.position.set(P.x+1.5,P.y+1.2,P.z);damageMob(b,1,true);const ang=b.angry>0;
 return {rh:window.__rh,h,hives:hv.length,bees:bs.length,mine,moved,under,comb,honey,ang};});
console.log('bees',JSON.stringify(bee));
ok(bee.hives>=3&&bee.under===9,'hives hang under trees',bee);ok(bee.mine>=2&&bee.moved>=1,'2-3 bees per hive, flying',bee);ok(bee.comb===3&&bee.honey===1,'shears -> honeycomb, bottle -> honey',bee);ok(bee.ang,'bee turns angry when hit',bee);
const st=await p.evaluate(()=>{const ids=starterItems().map(i=>i[0]);return [ids.includes(T.BEEHIVE),ids.includes(IT.EGG_BEE)];});ok(st[0]&&st[1],'starter chest has hive + bee egg',st);
await p.evaluate(()=>{const b=mobs.find(a=>a.kind==='bee');if(b){b.angry=0;P.x=b.g.position.x+1.6;P.z=b.g.position.z+0.4;P.y=b.g.position.y-1.4;const dx=b.g.position.x-P.x,dz=b.g.position.z-P.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=0.05;}});await p.waitForTimeout(2500);await p.screenshot({path:dir+'bee_close.png'});
await p.evaluate(()=>{P.x-=3;P.pitch=0.3});await p.waitForTimeout(2500);await p.screenshot({path:dir+'beehive.png'});
// hell
await p.evaluate(()=>enterDim('hell',genHell,spawnHell));await p.waitForFunction(()=>DIM.cur==='hell',null,{timeout:300000});await p.waitForTimeout(3000);
const hc=await p.evaluate(async()=>{let mx=0;for(let i=0;i<30;i++){await gwait(2);const n=mobs.filter(a=>a.hell&&a.kind!=='dragon'&&Math.hypot(a.g.position.x-P.x,a.g.position.z-P.z)<48).length;mx=Math.max(mx,n);}return {max:mx,total:mobs.filter(a=>a.hell).length};});
ok(hc.max<=6,'Hell cap ~6 near you',hc);
const dr=await p.evaluate(async()=>{window.__egg=true;const d=hellMake('dragon',P.x+8,P.y+8,P.z);window.__egg=false;const a=d||mobs.find(m=>m.kind==='dragon');let inside=0,far=0,samples=0;for(let i=0;i<60;i++){await gwait(0.5);if(!mobs.includes(a))break;const q=a.g.position;samples++;if(solid(Math.floor(q.x),Math.floor(q.y+0.5),Math.floor(q.z)))inside++;if(Math.hypot(q.x-P.x,q.z-P.z)>40)far++;}return {samples,inside,far};});
ok(dr.samples>20&&dr.inside===0&&dr.far===0,'dragon: never inside blocks, stays near you',dr);
const kd=await p.evaluate(async()=>{const res={};for(const k of ['ghost','hound','imp','blazeskel']){window.__egg=true;const a=hellMake(k,P.x+2,P.y,P.z)||mobs[mobs.length-1];window.__egg=false;const d0=drops.length,w0=__wisps.length;killMob(a);await gwait(0.2);res[k]={drops:drops.slice(d0).map(d=>d.id),wisps:__wisps.length-w0};}return res;});
console.log('kills',JSON.stringify(kd));
ok(kd.ghost.wisps>=1,'ghost leaves a soul wisp',kd.ghost);ok(kd.hound.drops.some(i=>i===171||i===320),'hound drops bones/rotten flesh',kd.hound);
ok(kd.imp.drops.length>0&&kd.blazeskel.drops.length>0,'imp + blaze skeleton drop items',[kd.imp,kd.blazeskel]);
await p.evaluate(()=>{if(!camMode)toggleCamera()});await p.waitForTimeout(2500);await p.screenshot({path:dir+'hell_wisp.png'});
console.log('FAILURES',fails);await b.close();})();
