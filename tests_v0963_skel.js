const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:800,height:500}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8765/index.html?t247');await p.waitForFunction(()=>screen==='title',null,{timeout:300000});
await p.evaluate(()=>{current={id:'t247',name:'S',mode:'survival',created:Date.now()};enterWorld(null)});await p.waitForFunction(()=>started,null,{timeout:900000});
await p.evaluate(()=>{setInterval(()=>{paused=false;menuOpen=false;hp=20;MODE.noDamage=true;},100);dayClock=CYCLE*0.7;});
const spot=await p.evaluate(()=>{const gY=(x,z)=>{for(let y=H-3;y>2;y--){if(solid(x,y,z))return y+1;}return 0};for(let r=20;r<300;r+=7)for(let k=0;k<16;k++){const an=k/16*6.283,x=Math.floor(P.x+Math.sin(an)*r),z=Math.floor(P.z+Math.cos(an)*r);const y=gY(x,z);let ok=y>SEA;for(let ax=-7;ax<=7&&ok;ax++)for(let az=-7;az<=7&&ok;az++){const yy=gY(x+ax,z+az);if(Math.abs(yy-y)>0||world[idx(x+ax,yy-1,z+az)]===T.WATER||world[idx(x+ax,yy-1,z+az)]===T.LEAVES)ok=false;}if(ok)return[x+.5,y,z+.5];}return null;});
console.log('spot',spot);
await p.evaluate(([x,y,z])=>{P.x=x;P.y=y;P.z=z;P.yaw=0;setInterval(()=>{P.x=x;P.z=z;P.vy=0;},16);},spot);await p.waitForTimeout(1500);
await p.evaluate(()=>{mobs.filter(m=>m.hostile).forEach(removeMob);__spawn('skeleton');const s=mobs.find(m=>m.kind==='skeleton');s.__t=1;s.aggro=30;window.__S=s;
 window.__lg=[];const mm=moveMob;moveMob=function(a,dx,dz){const r=mm.apply(this,arguments);if(a===__S&&__lg.length<400)__lg.push([+(dx).toFixed(3),+(dz).toFixed(3),r,new Error().stack.split('\n')[2].trim().slice(0,60)]);return r;};});
for(let i=0;i<6;i++){await p.waitForTimeout(1500);console.log(JSON.stringify(await p.evaluate(()=>{const s=__S;const dx=s.g.position.x-P.x,dz=s.g.position.z-P.z;return{d:Math.hypot(dx,dz).toFixed(2),ex:[dx.toFixed(2),dz.toFixed(2)],see:s.see,str:s.strafing,cd:s.shootCd.toFixed(2),kb:[s.kbx,s.kbz]}})));}
const lg=await p.evaluate(()=>{const c={};for(const l of __lg){c[l[3]]=(c[l[3]]||0)+1;}return {c,sample:__lg.slice(0,30)}});console.log(JSON.stringify(lg));
await b.close();})();
