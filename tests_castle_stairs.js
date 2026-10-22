const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const dir='/workspace/game/shots/g7/';const p=await b.newPage({viewport:{width:1000,height:580}}); p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8765/index.html?t176'); await p.waitForFunction(()=>screen==='title',null,{timeout:300000});
await p.evaluate(()=>{window.confirm=()=>true;current={id:"t176",name:'G',mode:'survival',created:Date.now(),newCastles:true};enterWorld(null)}); await p.waitForFunction(()=>started,null,{timeout:300000});
await p.waitForTimeout(2000);
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
await p.evaluate(()=>{setInterval(()=>{hp=20;food=20;paused=false;menuOpen=false;},100);window.__gt=0;const up=updatePlayer;updatePlayer=function(dt){window.__gt+=dt;return up.apply(this,arguments);};window.gwait=s=>new Promise(r=>{const t=__gt;const i=setInterval(()=>{if(__gt-t>=s){clearInterval(i);r();}},10);});});
const stc=await p.evaluate(()=>{let n=0,items=0;for(const [k,c] of chests)if(c.starter){n++;items+=c.slots.filter(s=>s).length;}return {n,items,all:starterItems().length,placed:[...chests].filter(([k,c])=>c.starter&&placedSet.has(idx(...k.split(',').map(Number)))).length};});console.log('starter',JSON.stringify(stc));
// stairs: physics walk every straight keep run
const runs=await p.evaluate(()=>{const out=[];for(const c of g9castles){if(c[0]==='peak')continue;const R=c[0]==='citadel'?30:26;for(let x=c[1]-R;x<=c[1]+R;x++)for(let z=c[2]-R;z<=c[2]+R;z++)for(let y=2;y<H-6;y++){const b=world[idx(x,y,z)];if(b!==167)continue;const m=entMeta.get(keyOf(x,y,z));if(!m)continue;const f=m.face,dx=f===1?-1:f===3?1:0,dz=f===0?-1:f===2?1:0;
  // bottom of a straight run: no stair behind-below, 4 more stairs ahead-up
  if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,c])=>world[idx(x+a,y-1,z+c)]===167))continue;let n=1;while(n<8&&world[idx(x+dx*n,y+n,z+dz*n)]===167)n++;if(n>=4)out.push([c[0],x,y,z,dx,dz,n]);}}return out;});
console.log('runs',runs.length);await p.evaluate(()=>{TS=4});
let walked=0;
for(const r of runs){const res=await p.evaluate(r=>{const [k,x,y,z,dx,dz,n]=r;let ap=null;const A=(a,b,c)=>{const q=world[idx(a,b,c)];return !q||PLANT[q]===1;};for(const [ax,az] of [[-dx,-dz],[dz,dx],[-dz,-dx]]){const tx=x+ax,tz=z+az;for(const yy of [y,y+1]){if(A(tx,yy,tz)&&A(tx,yy+1,tz)&&!A(tx,yy-1,tz)){ap=[ax,az,yy];break;}}if(ap)break;}
 if(!ap)return [-99,n];P.x=x+ap[0]+.5;P.z=z+ap[1]+.5;P.y=ap[2];P.vy=0;P.yaw=Math.atan2(ap[0],ap[1]);P.pitch=0;keys.KeyW=true;const y0=ap[2];
 let top=-9;const fol=async()=>{for(let t=0;t<(n+4)*3;t++){await gwait(0.22);top=Math.max(top,P.y-y);const fx=Math.floor(P.x),fz=Math.floor(P.z);for(const yy of [Math.floor(P.y),Math.floor(P.y-0.3)]){if(world[idx(fx,yy,fz)]===167){const m=entMeta.get(keyOf(fx,yy,fz));let nx=null;for(const [a,c] of [[1,0],[-1,0],[0,1],[0,-1]])if(world[idx(fx+a,yy+1,fz+c)]===167)nx=[a,c];if(nx){P.yaw=Math.atan2(-nx[0],-nx[1]);}else if(m){const f=m.face,ex=f===1?-1:f===3?1:0,ez=f===0?-1:f===2?1:0;P.yaw=Math.atan2(-ex,-ez);}break;}}}};return gwait(1.0).then(()=>{P.yaw=Math.atan2(-dx,-dz);return fol()}).then(()=>{keys.KeyW=false;return [top,n,y0-y];});},r);
  const good=res[0]>=res[1]-0.6+(res[2]||0)*0; if(good)walked++; console.log(good?'  ok':'  stuck',JSON.stringify(r),JSON.stringify(res));}
ok(walked>=runs.length-2,`walked ${walked}/${runs.length} keep stair runs to the next floor`);
console.log('c47',JSON.stringify(await p.evaluate(()=>window.__c47)));await b.close();})();
