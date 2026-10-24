const {chromium}=require('playwright-core');const fs=require('fs');const dir='/workspace/game/shots/g20/';fs.mkdirSync(dir,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--enable-precise-memory-info','--js-flags=--expose-gc']});
const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>{errs.push(e.message);console.log('ERR',e.message)});p.on('console',m=>{const t=m.text();if(/c77|underground/i.test(t))console.log('LOG',t.slice(0,900))});
await p.goto('http://localhost:8765/index.html?t242');await p.waitForFunction(()=>screen==='title',null,{timeout:300000});
const t0=Date.now();
await p.evaluate(()=>{current={id:'t242',name:'H',mode:'survival',created:Date.now(),newCastles:true};enterWorld(null)});await p.waitForFunction(()=>started,null,{timeout:900000});
console.log('gen ms',Date.now()-t0);
await p.evaluate(()=>{window.__hold=setInterval(()=>{paused=false;menuOpen=false;hp=20;food=20;MODE.noDamage=true;},100);dayClock=CYCLE*0.3;try{mobs.slice().forEach(removeMob)}catch(_){}});
const heap=await p.evaluate(()=>{try{gc()}catch(_){}return Math.round(performance.memory.usedJSHeapSize/1e6)});console.log('heap MB',heap);
fs.writeFileSync('/workspace/pw/t242_hist.json',JSON.stringify(await p.evaluate(()=>__c77hist())));
// tool speed table
const tt=await p.evaluate(()=>{const blocks=[['Stone',T.STONE],['Deepslate',T.DEEPSLATE],['Iron ore',T.IRONORE],['Diamond ore',T.DIAMONDORE],['Cobalt ore',T.COBALTORE],['Obsidian',T.OBSIDIAN],['Log',T.LOG],['Dirt',T.DIRT]];
 const tools=[['Hand',0],['Wood pick',40],['Stone pick',41],['Iron pick',92],['Gold pick',96],['Diamond pick',124],['Cobalt pick',264],['Diamond shovel (wrong tool)',127],['Wood axe',44],['Iron axe',93],['Diamond axe',125],['Cobalt axe',265],['Diamond shovel',127],['Cobalt shovel',267]];
 const keep=selId;const out=[];for(const [tn,id] of tools){if(id)inv[id]=1;selId=id||0;const row={tool:tn};for(const [bn,bb] of blocks){const s=mcBreakSeconds(bb);row[bn]=s.toFixed(2)+(underTooled(bb)?'*':'');}out.push(row);}selId=keep;return out;});
fs.writeFileSync('/workspace/pw/t242_tools.json',JSON.stringify(tt,null,1));
const info=await p.evaluate(()=>({W,D,H,sp:[P.x,P.y,P.z],c77:window.__c77,c53:(window.__c53||[]).map(o=>[o.k,o.cx,o.cz,o.gy])}));console.log(JSON.stringify(info).slice(0,1500));
const look=async(name,x,y,z,tx,ty,tz,wait)=>{await p.evaluate(([x,y,z,tx,ty,tz])=>{P.x=x;P.y=y;P.z=z;P.vy=0;const dx=tx-x,dz=tz-z,dy=ty-y;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(dy,Math.hypot(dx,dz));window.__fly=[x,y,z];if(!window.__flyI)window.__flyI=setInterval(()=>{if(__fly){P.x=__fly[0];P.y=__fly[1];P.z=__fly[2];P.vy=0}},16)},[x,y,z,tx,ty,tz]);await p.waitForTimeout(wait||6000);await p.screenshot({path:dir+name+'.png'});console.log('shot',name);};
const sp=info.sp;await look('spawn',sp[0],sp[1]+2,sp[2],info.c53[0][1],sp[1]+4,info.c53[0][2],8000);
for(const [k,cx,cz,gy] of info.c53){const S=k==='black'?13:15;await look('gate_'+k,cx+0.5,gy+6,cz+S+20,cx+0.5,gy+3,cz+S,7000);await look('aerial_'+k,cx+30,gy+40,cz+50,cx,gy,cz,7000);}
await look('border_west',6,60,432,0,58,436,6000);await look('border_corner',30,70,30,0,40,0,6000);await look('border_aerial',40,90,400,0,40,432,6000);
// new blocks showcase near spawn
await p.evaluate(()=>{const x0=Math.floor(P.x),z0=Math.floor(P.z);});
const sx=Math.floor(sp[0])+4,sz=Math.floor(sp[2]);const row=await p.evaluate(([sx,sz])=>{const ids=[T.RUBYORE,T.LAZORE,T.COBALTORE,T.RUBYBLOCK,T.LAZBLOCK,T.COBALTBLOCK,T.DIAMONDORE,T.IRONBLOCK];const y=solidTop(sx,sz)+1;ids.forEach((id,i)=>{world[idx(sx,y,sz+i*2-7)]=id;world[idx(sx,y+1,sz+i*2-7)]=0;markDirty(sx,sz+i*2-7);});return y;},[sx,sz]);
await look('newblocks',sx-4.5,row+1.2,sz+0.5,sx,row+0.4,sz+0.5,6000);
await p.evaluate(()=>{for(const id of [IT.RUBY,IT.LAZURITE,IT.RAWCOBALT,IT.COBALTINGOT,IT.CPICK,IT.CSWORD,IT.CHELM,T.RUBYORE,T.COBALTBLOCK])inv[id]=3;MODE.hotbar=[IT.RUBY,IT.LAZURITE,IT.RAWCOBALT,IT.COBALTINGOT,IT.CPICK,IT.CSWORD,IT.CHELM,T.RUBYORE,T.COBALTBLOCK];try{renderHotbar()}catch(e){}});
await p.waitForTimeout(1500);await p.screenshot({path:dir+'hotbar_new.png',clip:{x:240,y:560,width:800,height:160}});
// hell
await p.evaluate(()=>{window.__fly=null;});
await p.evaluate(()=>{P.x=600;P.z=300;});
await p.evaluate(()=>enterDim('hell',genHell,spawnHell));await p.waitForFunction(()=>DIM.cur==='hell'&&!DIM.busy,null,{timeout:300000});await p.waitForTimeout(6000);
const hi=await p.evaluate(()=>{let co=0,go=0,cy=new Array(64).fill(0);for(let i=0;i<world.length;i++){if(world[i]===T.COBALTORE){co++;cy[Math.floor(i/D)%H]++}else if(world[i]===T.GOLDORE)go++;}return {W,D,H,HELL_W,P:[P.x|0,P.y|0,P.z|0],co,go,cy,fort:hellFort,st:window.__c77hell,edge:[world[idx(0,30,100)],world[idx(W-1,30,100)]]}});console.log('HELL',JSON.stringify(hi));
await p.screenshot({path:dir+'hell_arrival.png'});
console.log('errors',errs.length);await b.close();})();
