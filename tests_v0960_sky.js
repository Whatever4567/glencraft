const {chromium}=require('playwright-core');const dir='/workspace/game/shots/g18/';const page=process.argv[2],tag=process.argv[3];
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:800,height:450}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/'+page+'?t235');await p.waitForFunction(()=>screen==='title',null,{timeout:300000});
await p.evaluate(()=>{current={id:'t235',name:'S',mode:'creative',created:Date.now()};enterWorld(null)});await p.waitForFunction(()=>started,null,{timeout:300000});await p.waitForTimeout(2000);
await p.evaluate(()=>{setInterval(()=>{paused=false;menuOpen=false},100);setWeather&&setWeather('clear');P.y+=6;});
for(const [rd,tod,name] of [[3,0.75,'night'],[5,0.75,'night'],[3,0.27,'day'],[4,0.47,'dusk'],[8,0.75,'night']]){
 const info=await p.evaluate(([rd,tod])=>{SET.rdist=rd;dayClock=CYCLE*tod;return new Promise(r=>setTimeout(()=>{const m=isNight?moonDisc:sunDisc;const d=m.position.clone().sub(camera.position);P.yaw=Math.atan2(-d.x,-d.z);P.pitch=Math.max(-0.2,Math.min(0.9,Math.atan2(d.y,Math.hypot(d.x,d.z))-0.25));
  setTimeout(()=>r({far:camera.far,dome:skyDome.scale.x,moonD:+d.length().toFixed(1),night:isNight}),1500)},800))},[rd,tod]);
 await p.screenshot({path:dir+tag+'_rd'+rd+'_'+name+'.png'});console.log(tag,rd,name,JSON.stringify(info));}
console.log('errors',errs);await b.close();})();
