const {chromium}=require('playwright-core');const fs=require('fs');const dir='/workspace/game/shots/g21c/';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--enable-precise-memory-info']});
const p=await b.newPage({viewport:{width:1024,height:640}});const errs=[];p.on('pageerror',e=>{errs.push(e.message);console.log('ERR',e.message)});p.on('console',m=>{const t=m.text();if(/c78|warn|error/i.test(t)&&!/GPU|WebGL/.test(t))console.log('LOG',t.slice(0,400))});
await p.goto('http://localhost:8765/index.html?t244');await p.waitForFunction(()=>screen==='title',null,{timeout:300000});
await p.evaluate(()=>{current={id:'t244',name:'H',mode:'survival',created:Date.now(),newCastles:true};enterWorld(null)});await p.waitForFunction(()=>started,null,{timeout:900000});
await p.evaluate(()=>{window.__hold=setInterval(()=>{paused=false;menuOpen=false;hp=20;food=20;MODE.noDamage=true;},100);dayClock=CYCLE*0.28;
 // test accelerator: extra AI steps so the slow software renderer doesn't make everything crawl
 window.__pt={ms:0,n:0,max:0};{const fp=findPath;findPath=function(){const t=performance.now();const r=fp.apply(this,arguments);const d=performance.now()-t;__pt.ms+=d;__pt.n++;if(d>__pt.max)__pt.max=d;findPath.n=fp.n;return r;};}
 window.__acc=setInterval(()=>{if(!started||paused)return;for(let k=0;k<3;k++){try{updateMobs(0.05);updateCrops(0.05);updateFurnaces(0.05);}catch(e){console.log('acc err '+e)}}},60);});
const C=await p.evaluate(()=>{const o=__c53.find(q=>q.k==='human');return o;});console.log('castle',JSON.stringify(C));
const fly=async(x,y,z,tx,ty,tz)=>p.evaluate(([x,y,z,tx,ty,tz])=>{P.x=x;P.y=y;P.z=z;P.vy=0;const dx=tx-x,dz=tz-z,dy=ty-y;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(dy,Math.hypot(dx,dz));window.__fly=[x,y,z];if(!window.__flyI)window.__flyI=setInterval(()=>{if(__fly){P.x=__fly[0];P.y=__fly[1];P.z=__fly[2];P.vy=0}},16)},[x,y,z,tx,ty,tz]);
await fly(C.cx+0.5,C.gy+14,C.cz+30,C.cx,C.gy,C.cz);
for(let i=0;i<4;i++){await p.waitForTimeout(5000);const s=await p.evaluate(()=>__c78());console.log('T',i,JSON.stringify(s).slice(0,1600));}
// walking human: follow a moving one from the side
const shotNear=async(name,filter,tries)=>{for(let t=0;t<(tries||20);t++){const m=await p.evaluate((f)=>{const L=mobs.filter(m=>m.kind==='clansman'&&new Function('m','return '+f)(m));if(!L.length)return null;const m=L[0];const x=m.g.position.x,y=m.g.position.y,z=m.g.position.z,yw=m.yawVis;
  for(const da of [Math.PI/2,-Math.PI/2,Math.PI/3,-Math.PI/3,2*Math.PI/3,-2*Math.PI/3,0.4,-0.4,Math.PI])for(const r of [4.2,3.4,2.6]){const an=yw+da,cx=x+Math.sin(an)*r,cz=z+Math.cos(an)*r;let ok=true;for(let k=0;k<=10&&ok;k++){const qx=cx+(x-cx)*k/10,qz=cz+(z-cz)*k/10,qy=y+1.7-0.6*k/10;if(solid(Math.floor(qx),Math.floor(qy),Math.floor(qz))||solid(Math.floor(qx),Math.floor(qy)-1,Math.floor(qz))&&k<8)ok=false;}
   if(ok)return {x,y,z,cx,cz,role:m.role,job:m.job&&m.job.type,ph:m.job&&m.job.ph};}return null;},filter);
 if(m){await fly(m.cx,m.y+1.7,m.cz,m.x,m.y+1.0,m.z);await p.waitForTimeout(400);await p.screenshot({path:dir+name+'.png'});console.log('shot',name,JSON.stringify(m));return true;}await p.waitForTimeout(2500);}console.log('noshot',name);return false;};
await shotNear('human_walk','m.moving&&!m.sleeping',30);
await p.waitForTimeout(800);await shotNear('human_walk2','m.moving&&!m.sleeping',30);
await shotNear('farmer_hoe2',"m.role==='farmer'&&m.job&&m.job.type==='farm'&&m.job.ph==='work'",60);
//await shotNear('miner',"m.role==='miner'&&m.job&&m.job.type==='mine'",30);
//await shotNear('cook',"m.role==='cook'&&m.job&&m.job.type==='cook'&&/work/.test(m.job.ph)",30);
console.log('S',JSON.stringify(await p.evaluate(()=>__c78())).slice(0,2500));
// skeleton aiming: an open spot, a skeleton 6 blocks ahead, shaded so it doesn't burn
await p.evaluate(()=>{dayClock=CYCLE*0.7;});
const spot=await p.evaluate(([cx,cz])=>{const gY=(x,z)=>{for(let y=H-3;y>2;y--){if(solid(x,y,z))return y+1;}return 0};let best=null;
 for(let r=36;r<90&&!best;r+=6)for(let k=0;k<16&&!best;k++){const an=k/16*Math.PI*2,x=Math.floor(cx+Math.sin(an)*r),z=Math.floor(cz+Math.cos(an)*r);const y=gY(x,z);let ok=y>SEA;
  for(let ax=-7;ax<=7&&ok;ax++)for(let az=-7;az<=9&&ok;az++){const yy=gY(x+ax,z+az);if(Math.abs(yy-y)>1||world[idx(x+ax,yy-1,z+az)]===T.WATER||world[idx(x+ax,yy-1,z+az)]===T.LEAVES)ok=false;}
  if(ok)best=[x+.5,y,z+.5];}return best;},[C.cx,C.cz]);console.log('spot',JSON.stringify(spot));
await p.evaluate(([x,y,z])=>{window.__fly=null;P.x=x;P.y=y;P.z=z;P.vy=0;P.yaw=Math.PI;P.pitch=-0.05;MODE.noDamage=true;},spot);await p.waitForTimeout(1500);
await p.evaluate(()=>{mobs.filter(m=>m.hostile&&Math.hypot(m.g.position.x-P.x,m.g.position.z-P.z)<30).forEach(removeMob);__spawn('skeleton');const s=mobs.filter(m=>m.kind==='skeleton').sort((u,v)=>Math.hypot(u.g.position.x-P.x,u.g.position.z-P.z)-Math.hypot(v.g.position.x-P.x,v.g.position.z-P.z))[0];if(s){s.__t=1;s.aggro=30;}});
await p.evaluate(()=>{window.__fly=[P.x,P.y,P.z];});
let shots=0;for(let i=0;i<50;i++){await p.waitForTimeout(400);const st=await p.evaluate(()=>{const s=mobs.find(m=>m.__t);if(!s)return null;const dx=s.g.position.x-P.x,dz=s.g.position.z-P.z;P.yaw=Math.atan2(dx,dz)+Math.PI;return {see:!!s.see,cd:s.shootCd,dist:Math.hypot(s.g.position.x-P.x,s.g.position.z-P.z),str:!!s.strafing,arrows:arrows.length};});console.log('skel',JSON.stringify(st));
 if(st&&st.cd<0.6&&st.cd>0.02&&st.dist<14&&st.see&&shots<3){await p.screenshot({path:dir+'skeleton_aim'+(shots||'')+'.png'});console.log('shot skeleton_aim');shots++;}}
await p.evaluate(()=>{mobs.filter(m=>m.kind==='skeleton').forEach(removeMob)});
// night: folk walk to bed
await p.evaluate(()=>{dayClock=CYCLE*0.74;});
await fly(C.cx+0.5,C.gy+14,C.cz+30,C.cx,C.gy,C.cz);
for(let i=0;i<10;i++){await p.waitForTimeout(5000);const s=await p.evaluate(()=>({night:isNight,f:__c78().folk.map(f=>f.role+':'+(f.sleeping?'Z':f.job+'/'+f.ph)+'@'+f.pos.join(','))}));console.log('N',i,JSON.stringify(s));if(s.f.length&&s.f.every(x=>/:Z/.test(x)))break;}
const beds=await p.evaluate(()=>{const ci=[...C78.castles.values()][0];return ci?ci.beds:null;});console.log('beds',JSON.stringify(beds));
if(beds&&beds.length){const bd=beds[0];const s=Math.round(Math.sin(bd.f*Math.PI/2)),c=Math.round(Math.cos(bd.f*Math.PI/2));
 // look at the bed from beside it, inside the room
 const cands=[[c*2.2,-s*2.2],[-c*2.2,s*2.2],[s*2.6,c*2.6]];let pos=null;for(const [ox,oz] of cands){const ok=await p.evaluate(([x,y,z])=>!solid(Math.floor(x),y,Math.floor(z))&&!solid(Math.floor(x),y+1,Math.floor(z)),[bd.x+.5+ox,bd.y,bd.z+.5+oz]);if(ok){pos=[bd.x+.5+ox,bd.z+.5+oz];break;}}
 if(!pos)pos=[bd.x+.5+s*2.6,bd.z+.5+c*2.6];
 await p.evaluate(()=>{dayClock=CYCLE*0.74;});
 await fly(pos[0],bd.y+2.2,pos[1],bd.x+.5-s*0.5,bd.y+0.4,bd.z+.5-c*0.5);await p.waitForTimeout(2500);await p.screenshot({path:dir+'human_bed.png'});console.log('shot human_bed');
 const bd2=beds[1];if(bd2){const s2=Math.round(Math.sin(bd2.f*Math.PI/2)),c2=Math.round(Math.cos(bd2.f*Math.PI/2));await fly(bd2.x+.5+s2*2.6,bd2.y+2.4,bd2.z+.5+c2*2.6,bd2.x+.5,bd2.y+0.3,bd2.z+.5);await p.waitForTimeout(2000);await p.screenshot({path:dir+'human_bed2.png'});}}
// morning
await p.evaluate(()=>{dayClock=CYCLE*0.27;});await p.waitForTimeout(6000);console.log('M',JSON.stringify(await p.evaluate(()=>({night:isNight,f:__c78().folk.map(f=>f.role+':'+(f.sleeping?'Z':f.job))}))));
console.log('pathtime',JSON.stringify(await p.evaluate(()=>__pt)));console.log('stats',JSON.stringify(await p.evaluate(()=>C78.stats)));
console.log('errors',errs.length);await b.close();})();
