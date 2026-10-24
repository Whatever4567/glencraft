const {chromium}=require('playwright-core');const dir='/workspace/game/shots/g19/';const page=process.argv[2]||'index.html',tag=process.argv[3]||'after';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for(const [name,opt] of [['desktop',{viewport:{width:1280,height:720}}],['phone_portrait',{viewport:{width:412,height:915},deviceScaleFactor:2,isMobile:true,hasTouch:true}],['phone_landscape',{viewport:{width:915,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true}]]){
const ctx=await b.newContext(opt);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/'+page+'?t237');await p.waitForFunction(()=>screen==='title',null,{timeout:300000});
await p.evaluate(()=>{current={id:'t237',name:'H',mode:'survival',created:Date.now(),newCastles:true};enterWorld(null)});await p.waitForFunction(()=>started,null,{timeout:300000});await p.waitForTimeout(2500);
await p.evaluate(()=>{setInterval(()=>{paused=false;menuOpen=false;hp=13;food=9},100);dayClock=CYCLE*0.3;try{inv[IT.STICK]=5;inv[T.PLANKS]=10;inv[T.COBBLE]=20;renderHotbar&&renderHotbar();}catch(_){}});
await p.waitForTimeout(1500);const r=await p.evaluate(()=>window.__statPlace?__statPlace():null);
await p.screenshot({path:dir+tag+'_hud_'+name+'.png'});console.log(tag,name,JSON.stringify(r),'errors',errs);await ctx.close();}
await b.close();})();
