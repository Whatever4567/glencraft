const {chromium}=require('playwright-core');const dir='/workspace/game/shots/g16/';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:800,height:450}});const errs=[];p.on('pageerror',e=>{errs.push(e.message);console.log('ERR',e.message)});p.on('console',m=>{if(/c72|uw audio/.test(m.text()))console.log('CON',m.text())});
await p.goto('http://localhost:8765/index.html?t227');await p.waitForFunction(()=>screen==='title',null,{timeout:300000});
await p.mouse.click(400,300);
await p.evaluate(()=>{current={id:'t227',name:'S',mode:'survival',created:Date.now()};enterWorld(null)});await p.waitForFunction(()=>started,null,{timeout:300000});await p.waitForTimeout(1500);
let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' '+JSON.stringify(x):''));if(!c)fails++;};
await p.evaluate(()=>{setInterval(()=>{paused=false;menuOpen=false;hp=20;},100);dayClock=CYCLE*0.25;setWeather('clear');});
console.log('version',await p.evaluate(()=>GAME_VERSION));
// crawlers gone
const cr=await p.evaluate(()=>{const a=newCrawler([P.x,P.y,P.z]);return {made:a,n:mobs.filter(m=>m.kind==='crawler').length};});ok(cr.made===null&&cr.n===0,'crawlers removed',cr);
// pool 14x14x5 at a flat-ish spot
const pool=await p.evaluate(()=>{const x=Math.floor(P.x)+6,z=Math.floor(P.z),t=groundTop(x,z);for(let a=-7;a<=7;a++)for(let c=-7;c<=7;c++){for(let y=t-5;y<=t;y++)setB(x+a,y,z+c,T.WATER);setB(x+a,t-6,z+c,T.SAND);for(let y=t+1;y<t+8;y++)setB(x+a,y,z+c,T.AIR);}return [x,t,z];});
await p.waitForTimeout(3000);
// 1st person swim with a sword in hand
await p.evaluate(w=>{inv[IT.ISWORD]=1;selId=IT.ISWORD;P.x=w[0]-5;P.z=w[2]+.5;P.y=w[1]-1.6;P.vy=0;P.yaw=-Math.PI/2;P.pitch=-0.2;keys.KeyW=true;sprintShift=true;},pool);
await p.waitForTimeout(1500);await p.screenshot({path:dir+'swim_1st_person_item.png'});
const s1=await p.evaluate(()=>({fast:__swimFast,plank:__swimPlank,held:held.children.length,heldVis:(()=>{let v=true,o=held;while(o){if(!o.visible)v=false;o=o.parent;}return v;})(),uw:!!window.__uw,c72:__c72()}));
ok(s1.fast&&s1.held&&s1.heldVis,'1st person sprint-swim with item visible in hand',s1);
ok(s1.uw&&s1.c72.lp<2000&&s1.c72.caus==='block','underwater: blue filter, caustics, muffled audio',s1.c72);
await p.waitForTimeout(1500);await p.screenshot({path:dir+'underwater_bubbles.png'});const bb=await p.evaluate(()=>__c72().bubbles);ok(bb>0,'bubbles from player',{bb});
// 3rd person from outside the water: swim near the surface, camera behind and above
await p.evaluate(w=>{P.x=w[0]-4;P.z=w[2]+.5;P.y=w[1]-0.9;P.vy=0;P.pitch=-0.05;toggleCamera();},pool);await p.waitForTimeout(2500);
const s3=await p.evaluate(()=>({plank:__swimPlank,rx:worldModel.rotation.x,camY:camera.position.y,surf:0,uw:!!window.__uw}));await p.screenshot({path:dir+'swim_3rd_person.png'});
ok(s3.plank>0.6&&s3.rx<-1,'3rd person plank pose',s3);
await p.evaluate(()=>{keys.KeyW=false;sprintShift=false;});await p.waitForTimeout(8000);const s4=await p.evaluate(()=>({plank:__swimPlank,rx:worldModel.rotation.x}));await p.screenshot({path:dir+'swim_3rd_person_idle.png'});ok(s4.plank<0.3,'plank blends out when you stop sprinting',s4);
await p.evaluate(()=>{toggleCamera();P.y+=8;});await p.waitForTimeout(8000);const out=await p.evaluate(()=>__c72());ok(out.caus==='none','effects off above water',out);
// giant spider: ground only
const sp=await p.evaluate(async()=>{const cv=__deepCaves[0];const a=__newGiant(cv,cv[0],cv[2]);let maxUp=0,y0=a.g.position.y,climb=0;for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,250));if(a.climbY!==undefined)climb++;}return {climb,alive:mobs.includes(a)};});
ok(sp.climb===0,'giant spider never climbs walls',sp);
ok(!errs.length,'no page errors',errs);console.log(fails?'SOME FAIL':'ALL PASS');await b.close();})();
