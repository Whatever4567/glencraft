const s=require('fs').readFileSync(__dirname+'/../index.html','utf8');
const a=s.indexOf('const tg = i => g && g.buttons[i]'),b=s.indexOf('U.H += tr * dt * 1.3',a);
const body=s.slice(a,b);
function run(axes,btn,K={}){const g={axes,buttons:Array.from({length:17},(_,i)=>({pressed:!!btn[i],value:btn[i]||0}))};const U={},tin={f:0,t:0,u:0};
 const ax=i=>Math.abs(g.axes[i]||0)>0.2?g.axes[i]:0,bt=i=>g.buttons[i].pressed?1:0,whoosh=()=>{};
 return new Function('g','ax','bt','K','tin','U','whoosh','window',body+';return {f,st,tr,up,LSb};')(g,ax,bt,K,tin,U,whoosh,{});}
const eq=(n,o,e)=>{for(const k in e)if(Math.abs(o[k]-e[k])>1e-9){console.log('FAIL',n,k,o[k],e[k]);process.exitCode=1;}};
eq('left fwd',run([0,-1,0,0],{}),{f:1,st:0,tr:0,up:0});
eq('left strafe',run([1,0,0,0],{}),{st:1,f:0,tr:0});
eq('right yaw',run([0,0,1,0],{}),{tr:-1,f:0,st:0});
eq('right climb',run([0,0,0,-1],{}),{up:1,f:0});
eq('RT up',run([0,0,0,0],{7:1}),{up:1});
eq('LT down',run([0,0,0,0],{6:1}),{up:-1});
eq('LS boost',run([0,0,0,0],{10:1}),{LSb:1,f:1});
console.log(process.exitCode?'pilot map FAIL':'pilot map ok');
