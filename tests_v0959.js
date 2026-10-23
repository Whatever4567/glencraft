const {chromium}=require('playwright-core');const dir='/workspace/game/shots/g17/';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:800,height:450}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/index.html?t231');await p.waitForFunction(()=>screen==='title',null,{timeout:300000});await p.mouse.click(400,300);
await p.evaluate(()=>{current={id:'t231',name:'S',mode:'survival',created:Date.now()};enterWorld(null)});await p.waitForFunction(()=>started,null,{timeout:300000});await p.waitForTimeout(2000);
let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' '+JSON.stringify(x):''));if(!c)fails++;};
console.log(await p.evaluate(()=>GAME_VERSION));
const a=await p.evaluate(()=>{setInterval(()=>{paused=false;menuOpen=false},100);dayClock=CYCLE*0.25;let c179=0,c181=0;for(let i=0;i<world.length;i++){if(world[i]===179)c179++;else if(world[i]===181)c181++;}
 const x=Math.floor(P.x),y=Math.floor(P.y),z=Math.floor(P.z);setB(x+3,y+1,z,179);inv[179]=2;inv[180]=3;const n=__c74convert();
 return {c179,c181,conv:n,blk:getB(x+3,y+1,z),inv181:inv[181]||0,raw:inv[IT.RAWSILVER]||0,has179:!!inv[179],drop:dropsFor(T.SILVERORE),smelt:SMELT[IT.RAWSILVER]===IT.SILVERINGOT,
  rec:RECIPES.filter(r=>r.out===IT.BROOCH).map(r=>r.hint+' '+JSON.stringify(r.need)),cr:[CREATIVE_ALL.includes(IT.BROOCH),CREATIVE_ALL.includes(179),CREATIVE_ALL.includes(180)],cairnRec:RECIPES.filter(r=>r.need.some(q=>q[0]===180)).length,name:NAMES[IT.BROOCH]}});
console.log(JSON.stringify(a));
ok(a.c179===0&&a.c181>0,'new world: no Cairngorm ore, silver ore present',[a.c179,a.c181]);ok(a.blk===181&&a.inv181>=2&&a.raw>=3&&!a.has179,'old blocks/items convert to silver');
ok(a.drop[0][0]===182&&a.smelt,'silver ore drops raw silver, smelts to ingot');ok(a.rec.length===1&&a.cr[0]&&!a.cr[1]&&!a.cr[2]&&a.cairnRec===0,'brooch recipe + creative menu',a.rec);
// silver ore shot: wall of silver ore in front
await p.evaluate(()=>{const x=Math.floor(P.x),y=Math.floor(P.y),z=Math.floor(P.z);P.yaw=0;P.pitch=0;const d=lookDir();for(let a=-2;a<=2;a++)for(let k=0;k<4;k++){const bx=Math.floor(x+d[0]*3+(d[2]?a:0)),bz=Math.floor(z+d[2]*3+(d[0]?a:0));setB(bx,y+k,bz,181);}});
await p.waitForTimeout(2500);await p.screenshot({path:dir+'silver_ore.png'});
// hold brooch (main hand) and screenshot
const hb=await p.evaluate(()=>{inv[IT.BROOCH]=1;if(MODE.hotbar){MODE.hotbar[0]=IT.BROOCH;}selId=IT.BROOCH;renderHotbar();return {sel:selId===IT.BROOCH,h:__broch().held}});ok(hb.sel&&hb.h==='main','brooch held in main hand',hb);
await p.waitForTimeout(1500);await p.screenshot({path:dir+'broch_item_in_hand.png'});
const s1=await p.evaluate(()=>{hp=6;invuln=0;hurt(40,'Test hit');return {dead,hp,left:inv[IT.BROOCH]||0,st:__broch()}});
await p.waitForTimeout(650);await p.screenshot({path:dir+'broch_animation.png'});await p.waitForTimeout(400);await p.screenshot({path:dir+'broch_animation2.png'});
ok(!s1.dead&&s1.hp===2&&s1.left===0,'main-hand brooch saves you (1 heart), consumed',s1);
await p.waitForTimeout(3500);const rg=await p.evaluate(()=>({hp,st:__broch()}));ok(rg.hp>2,'regeneration after save',rg);
const lv=await p.evaluate(()=>{const h0=hp;invuln=0;hurt(3,'You tried to swim in lava.');return [h0,hp]});ok(lv[0]===lv[1],'fire resistance blocks lava damage',lv);
// off hand
const s2=await p.evaluate(async()=>{await new Promise(r=>setTimeout(r,2500));offhand={id:IT.BROOCH,n:1};updateOffhandSlot();selId=T.DIRT;inv[T.DIRT]=5;invuln=0;hurt(99,'Off hand test');return {dead,hp,off:offhand}});
ok(!s2.dead&&s2.off===null,'off-hand brooch saves you',s2);
// in bag only: no save
const s3=await p.evaluate(async()=>{await new Promise(r=>setTimeout(r,2500));inv[IT.BROOCH]=1;selId=T.DIRT;offhand=null;invuln=0;__broch();hurt(99,'Bag only test');const d=dead;return {dead:d,left:inv[IT.BROOCH]}});
ok(s3.dead&&s3.left===1,'brooch in bag only does not save',s3);
await p.evaluate(()=>respawn());await p.waitForTimeout(1500);
// void
const s4=await p.evaluate(async()=>{inv[IT.BROOCH]=1;if(MODE.hotbar)MODE.hotbar[0]=IT.BROOCH;selId=IT.BROOCH;renderHotbar();hp=3;invuln=0;P.y=-9;await new Promise(r=>setTimeout(r,800));return {dead,y:P.y,hp}});ok(!s4.dead&&s4.y>0,'void: saved and back up',s4);
// douse selection
const s5=await p.evaluate(async()=>{await new Promise(r=>setTimeout(r,1000));inv[T.TORCH]=5;if(MODE.hotbar&&!MODE.hotbar.includes(T.TORCH))MODE.hotbar[1]=T.TORCH;selId=T.TORCH;renderHotbar();__douse();renderHotbar();await new Promise(r=>setTimeout(r,300));return {sel:selId===IT.UNLIT,unlit:inv[IT.UNLIT],hot:!!MODE.hotbar}});ok(s5.sel&&s5.unlit===5,'after dousing, unlit torch is selected',s5);
ok(!errs.length,'no page errors',errs);console.log(fails?'SOME FAIL':'ALL PASS');await b.close();})();
