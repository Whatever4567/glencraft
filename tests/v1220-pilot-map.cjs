const s=require('fs').readFileSync(__dirname+'/../index.html','utf8');
const a=s.indexOf('const tg = i => g && g.buttons[i]'),b=s.indexOf('U.H += tr * dt * 1.3',a);
const c=s.indexOf('cP = Math.cos(U.Pt || 0)',a),d=s.indexOf(';',s.indexOf('ty = sP * f * sp',c));
const body=s.slice(a,b), vel=s.slice(c,d);
function run(axes,btn,Pt=0,H=0,K={}){const g={axes,buttons:Array.from({length:17},(_,i)=>({pressed:!!btn[i],value:btn[i]||0}))};const U={Pt,H},tin={f:0,t:0,u:0};
 const ax=i=>Math.abs(g.axes[i]||0)>0.2?g.axes[i]:0,bt=i=>g.buttons[i].pressed?1:0;
 return new Function('g','ax','bt','K','tin','U','whoosh','window','dt',body+'; const sp=10, alt=0, '+vel+'; return {f,st,tr,pr,up,LSb,Pt:U.Pt,tx,ty,tz};')(g,ax,bt,K,tin,U,()=>{},{},0.1);}
let bad=0;const ok=(n,v)=>{if(!v){bad++;console.log('FAIL',n);}};const near=(x,y)=>Math.abs(x-y)<1e-6;
let r=run([0,0,0,-1],{});ok('right up pitches up, no altitude',r.pr===1&&r.Pt>0&&r.up===0&&near(r.ty,0));
r=run([0,0,1,0],{});ok('right x yaws',r.tr===-1&&r.up===0);
r=run([0,-1,0,0],{},0.5);ok('left fwd pitched climbs',r.ty>0&&r.tz<0&&near(r.ty,Math.sin(0.5)*10));
r=run([0,-1,0,0],{},0,Math.PI/2);ok('left fwd yawed 90 goes -x',near(r.tx,-10)&&near(r.tz,0));
r=run([1,0,0,0],{},0,Math.PI/2);ok('left strafe yawed 90 goes -z',near(r.tx,0)&&near(r.tz,-10));
r=run([0,0,0,-1],{},1.47);ok('pitch clamp',r.Pt<=1.48);
r=run([0,0,0,0],{7:1});ok('RT up',r.up===1);r=run([0,0,0,0],{6:1});ok('LT down',r.up===-1);
r=run([0,0,0,0],{10:1});ok('LS boost forward',r.LSb===1&&r.f===1);
console.log(bad?'pilot map FAIL':'pilot map ok');process.exit(bad?1:0);
