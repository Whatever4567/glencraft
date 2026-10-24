const {chromium}=require('playwright-core');const dir='/workspace/game/shots/g19/';const page=process.argv[2],tag=process.argv[3];
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:800,height:450}});const errs=[];p.on('pageerror',e=>errs.push(e.stack.slice(0,300)));
await p.addInitScript(()=>{let s=12345;Math.random=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};});
await p.goto('http://localhost:8765/'+page+'?t236');await p.waitForFunction(()=>screen==='title',null,{timeout:300000});
await p.evaluate(()=>{current={id:'t236',name:'F',mode:'survival',created:1700000000000,newCastles:true};enterWorld(null)});await p.waitForFunction(()=>started,null,{timeout:300000});await p.waitForTimeout(3000);
const spot=await p.evaluate(()=>{setInterval(()=>{paused=false;menuOpen=false;hp=20;food=20},100);setWeather&&setWeather('clear');dayClock=CYCLE*0.3;SET.rdist=6;
 let best=null;const px=Math.floor(P.x),pz=Math.floor(P.z);
 for(let cx=Math.max(8,px-150);cx<Math.min(W-8,px+150);cx+=6)for(let cz=Math.max(8,pz-150);cz<Math.min(D-8,pz+150);cz+=6){let n=0,top=0;for(let x=cx-6;x<cx+6;x+=2)for(let z=cz-6;z<cz+6;z+=2)for(let y=H-1;y>0;y--){const v=getB(x,y,z);if(v===T.LEAVES){n++;top=Math.max(top,y);break;}if(v&&v!==T.AIR)break;}
  if(!best||n>best.n)best={n,x:cx,z:cz,top};}
 return best;});
console.log('vit',await p.evaluate(()=>{const v=document.getElementById('vitals');return [v.style.display,v.outerHTML.slice(0,400)]}));console.log('forest',JSON.stringify(spot));
await p.evaluate(s=>{const tx=s.x+0.5,tz=s.z+14.5,ty=s.top+7;setInterval(()=>{P.x=tx;P.z=tz;P.y=ty;if('vy'in P)P.vy=0;P.yaw=0;P.pitch=-0.45;},50);},spot);
await p.waitForTimeout(10000);
const meas=()=>p.evaluate(()=>{let tl=0,tt=0,ml=0,mt=0;blockGroup.traverse(o=>{if(!o.isMesh||!o.geometry||!o.geometry.index)return;const t=o.geometry.index.count/3*(o.isInstancedMesh?o.count:1);tt+=t;mt++;const mm=Array.isArray(o.material)?o.material[0]:o.material;if(mm===BLOCK_MATS[T.LEAVES]){tl+=t;ml++;}});
 return new Promise(r=>{let k=0,c=0,tr=0,last=performance.now();const f=[];const g=()=>{const n=performance.now();if(k>10)f.push(n-last);last=n;if(k>10){c+=renderer.info.render.calls;tr+=renderer.info.render.triangles;}if(++k<31)requestAnimationFrame(g);else f.sort((a,b)=>a-b);r({p50ms:f[10],drawCalls:Math.round(c/20),trisDrawn:Math.round(tr/20),trisAllChunks:tt,leafTrisAllChunks:tl,leafMeshes:ml,v:GAME_VERSION,fast:window.FASTLEAF!==false});};requestAnimationFrame(g);});});
for(const [on,tg] of [[false,'before'],[true,'after']]){await p.evaluate(on=>__fastLeaves(on),on);await p.waitForTimeout(4000);const m=await meas();console.log(tg,JSON.stringify(m));await p.screenshot({path:dir+tg+'_forest.png'});}
console.log('errors',errs);await b.close();})();
