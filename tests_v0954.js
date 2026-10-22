const {chromium}=require('playwright-core');const dir='/workspace/game/shots/g13/';require('fs').mkdirSync(dir,{recursive:true});
const which=process.argv[2]||'all';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' '+JSON.stringify(x):''));if(!c)fails++;};
const boot=async(q)=>{const p=await b.newPage({viewport:{width:1000,height:580}});p.on('pageerror',e=>console.log('ERR',e.message));await p.goto('http://localhost:8765/index.html?'+q);await p.waitForFunction(()=>screen==='title',null,{timeout:300000});return p;};
if(which==='all'||which==='presets'){
 for(const pr of ['flat','glen','clydebank']){const p=await boot('t221'+pr);
  await p.evaluate(pr=>{newMode='creative';__setPreset(pr);$('worldName').value='P '+pr;$('createGo').click();},pr);
  await p.waitForFunction(()=>started&&current&&current.mode==='creative',null,{timeout:300000});await p.waitForTimeout(3000);
  const r=await p.evaluate(()=>{let above=0,grass=0;for(let x=0;x<W;x+=7)for(let z=0;z<D;z+=7){for(let y=44;y<H;y++)if(world[idx(x,y,z)])above++;if(world[idx(x,43,z)]===T.GRASS)grass++;}
    return {preset:current.preset||null,flat:!!current.flat,W,D,above,grass,castles:(g9castles||[]).length,island:g9Island,gold:typeof isGold==='function'?isGold(current):null,mode:current.mode};});
  console.log(pr,JSON.stringify(r));
  if(pr==='flat')ok(r.flat&&r.above===0&&r.grass>50,'Flat World is flat grass',r);
  if(pr==='glen')ok(!r.flat&&r.island&&r.castles>0,'Glen preset makes the glen',r);
  if(pr==='clydebank')ok(!r.flat&&!r.island&&r.above>0,'Clydebank preset makes Clydebank',r);
  await p.screenshot({path:dir+'preset_'+pr+'.png'});await p.close();}}
if(which==='all'||which==='pause'){const p=await boot('t221p');
 await p.evaluate(()=>{current={id:'t221p',name:'S',mode:'survival',created:Date.now()};enterWorld(null)});await p.waitForFunction(()=>started,null,{timeout:300000});await p.waitForTimeout(1500);
 await p.evaluate(()=>setPause(true));await p.waitForTimeout(300);
 await p.click('[data-testid=pause-todSeg-sunset]');await p.click('[data-testid=pause-wxSeg-storm]');await p.click('[data-testid=pause-frzSeg-1]');await p.waitForTimeout(400);
 await p.screenshot({path:dir+'pause_menu.png'});
 const a=await p.evaluate(()=>__c68());ok(a.wlock==='storm'&&a.type==='thunder'&&a.freeze&&Math.abs(a.p-0.49)<0.01,'pause buttons set weather/time/freeze',a);
 await p.evaluate(()=>setPause(false));await p.waitForTimeout(6000);const b2=await p.evaluate(()=>__c68());ok(Math.abs(b2.p-0.49)<0.002,'time stays frozen',b2);
 await p.evaluate(()=>setWeather('clear'));ok((await p.evaluate(()=>weather.type))==='thunder','weather lock holds against auto changes');
 const sv=await p.evaluate(()=>{const d=JSON.parse(JSON.stringify(serialize()));return d.wset;});ok(sv.freeze&&sv.wlock==='storm','saved per world',sv);
 // controller: focus moves through new buttons, A clicks
 await p.evaluate(()=>setPause(true));const pc=await p.evaluate(()=>{const it=pauseItems();const i=it.findIndex(e=>e.dataset.testid==='pause-todSeg-day');pFocus=i;padPause(0,0,true);return __c68().p;});ok(Math.abs(pc-0.25)<0.01,'controller A selects Day',pc);
 await p.screenshot({path:dir+'pause_menu_day.png'});
 await p.evaluate(()=>setPause(false));await p.waitForTimeout(2000);await p.screenshot({path:dir+'storm_day_frozen.png'});await p.close();}
if(which==='all'||which==='spider'){const p=await boot('t221s');
 await p.evaluate(()=>{current={id:'t221s',name:'S',mode:'survival',created:Date.now()};enterWorld(null)});await p.waitForFunction(()=>started,null,{timeout:300000});await p.waitForTimeout(1500);
 // cave mobs by day: spawn a zombie under cover, check it never burns
 const cm=await p.evaluate(async()=>{setInterval(()=>{paused=false;menuOpen=false;hp=20;},100);dayClock=CYCLE*0.25;const cv=__deepCaves[0];let y=cv[1];while(world[idx(Math.floor(cv[0]),y-1,Math.floor(cv[2]))]===0)y--;P.x=cv[0];P.z=cv[2];P.y=y;
  window.__egg=true;window.__eggSpot=[cv[0]+3,y,cv[2],cv[0],cv[2]];const z=spawnMob('zombie');window.__egg=false;window.__eggSpot=null;z.g.position.set(cv[0]+3,y,cv[2]);
  const X=Math.floor(P.x)+0;let burned=false;for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,500));if(z.burning>0)burned=true;}return {alive:mobs.includes(z),burned,cov:z.covered};});
 ok(cm.alive&&!cm.burned,'cave zombie by day does not burn or vanish',cm);
 const sk=await p.evaluate(async()=>{const X=Math.floor(P.x)+60,Z=Math.floor(P.z);P.x=X;P.z=Z;P.y=solidTop(X,Z)+1;window.__egg=true;window.__eggSpot=[X+3,P.y,Z,X,Z];const z=spawnMob('zombie');window.__egg=false;window.__eggSpot=null;if(!z)return null;z.g.position.set(X+3,P.y,Z);
  let burned=false;for(let i=0;i<12;i++){await new Promise(r=>setTimeout(r,500));if(z.burning>0||!mobs.includes(z))burned=true;}return {burned};});
 ok(!sk||sk.burned,'surface zombie by day still burns',sk);
 // giant spider on the surface: spawn at cave, then put it outside and let it walk
 const sp=await p.evaluate(async()=>{dayClock=CYCLE*0.25;mobs.filter(a=>a.giant).forEach(removeMob);const X=Math.floor(P.x),Z=Math.floor(P.z);const a=__newGiant([X,solidTop(X,Z)+1,Z,12],X+14.5,Z+.5)||__newGiant([X,solidTop(X,Z)+1,Z,12],X-14.5,Z+.5);if(!a)return null;window.__G=a;a.state='walk';a.st=6;a.tgtAng=0;
  const p0=a.g.position.clone();await new Promise(r=>setTimeout(r,6000));const gt=0;return {moved:+a.g.position.distanceTo(p0).toFixed(2),pos:a.g.position.toArray().map(v=>+v.toFixed(1)),spd:+a.spd.toFixed(2),state:a.state,n:mobs.filter(m=>m.giant).length};});
 console.log('spider',JSON.stringify(sp));ok(sp&&sp.spd<=1.0||sp&&sp.state!=='walk','spider walks slowly by default',sp);
 await p.evaluate(()=>{const a=__G.g.position;P.x=a.x-12;P.z=a.z-6;P.y=solidTop(Math.floor(P.x),Math.floor(P.z))+1;P.yaw=Math.atan2(-(a.x-P.x),-(a.z-P.z));P.pitch=-0.1;__G.state='walk';__G.st=4;});await p.waitForTimeout(2500);
 await p.evaluate(()=>{const a=__G.g.position;P.yaw=Math.atan2(-(a.x-P.x),-(a.z-P.z));});await p.waitForTimeout(400);await p.screenshot({path:dir+'spider_surface.png'});
 // climbing: build a 6-high wall in front, see it gets over
 const cl=await p.evaluate(async()=>{const a=__G,p=a.g.position;const X=Math.floor(p.x),Z=Math.floor(p.z),y0=Math.floor(p.y);for(let dx=-6;dx<=6;dx++)for(let y=y0;y<y0+6;y++)setB(X+dx,y,Z+3,T.STONE);rebuild();a.ang=0;a.tgtAng=0;a.state='walk';a.st=30;a.spd=0.75;
  const st=performance.now();let maxY=p.y;for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,500));a.tgtAng=0;a.state='walk';a.st=30;maxY=Math.max(maxY,p.y);if(p.z>Z+4)break;}return {y0,maxY:+maxY.toFixed(1),z:+p.z.toFixed(1),Z,err:window.__gsErr||null};});
 ok(cl.maxY>=cl.y0+4||cl.z>cl.Z+4,'giant spider climbs over a wall',cl);
 await p.close();}
console.log(fails?'SOME FAIL':'ALL PASS');await b.close();})();
