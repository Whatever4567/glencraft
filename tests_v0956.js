const {chromium}=require('playwright-core');const dir='/workspace/game/shots/g15/';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:800,height:450}});const errs=[];p.on('pageerror',e=>{errs.push(e.message);console.log('ERR',e.message)});p.on('console',m=>{if(/warn|error/.test(m.type())&&/c70|ao|gfx|puddle|rdist/.test(m.text()))console.log('CON',m.text())});
await p.goto('http://localhost:8765/index.html?t224');await p.waitForFunction(()=>screen==='title',null,{timeout:300000});
await p.evaluate(()=>{current={id:'t224',name:'S',mode:'survival',created:Date.now()};enterWorld(null)});await p.waitForFunction(()=>started,null,{timeout:300000});await p.waitForTimeout(1500);
let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' '+JSON.stringify(x):''));if(!c)fails++;};
await p.evaluate(()=>{setInterval(()=>{paused=false;menuOpen=false;},100);setInterval(()=>{hp=20;},100);});
console.log('version',await p.evaluate(()=>GAME_VERSION),'light build',JSON.stringify(await p.evaluate(()=>__lightStats())),'rdist',await p.evaluate(()=>SET.rdist));
const noon=()=>p.evaluate(()=>{dayClock=CYCLE*0.25;setWeather('clear');weather.dark=0;window.__setWet(0);});
const lum=async()=>{const buf=await p.screenshot();return buf;};
const shotL=async(n)=>{await p.screenshot({path:dir+n+'.png'});return p.evaluate(()=>{const c=renderer.domElement;const g=document.createElement('canvas');g.width=80;g.height=45;const x=g.getContext('2d');renderer.render(scene,camera);x.drawImage(c,0,0,80,45);const d=x.getImageData(0,0,80,45).data;let s=0;for(let i=0;i<d.length;i+=4)s+=d[i]*.3+d[i+1]*.59+d[i+2]*.11;return Math.round(s/(d.length/4));});};
await noon();
// 1. ravine: narrow deep cut
let rv=await p.evaluate(()=>{let best=null;for(let x=10;x<W-10;x+=2)for(let z=10;z<D-10;z+=2){const t=groundTop(x,z);if(world[(x*H+t)*D+z]===T.WATER)continue;const a=Math.min(groundTop(x-5,z),groundTop(x+5,z)),b=Math.min(groundTop(x,z-5),groundTop(x,z+5));const dep=Math.max(a,b)-t;if(dep>(best?best.d:7)&&t>SEA-2)best={x,z,t,d:dep,ax:a>b};}return best;});
if(!rv||rv.d>30){rv=await p.evaluate(()=>{const x0=Math.floor(W/2)+20,z0=Math.floor(D/2);const t=groundTop(x0,z0);for(let x=x0-1;x<=x0+1;x++)for(let z=z0-15;z<=z0+15;z++)for(let y=t-14;y<=t;y++)setB(x,y,z,T.AIR);for(let z=z0-15;z<=z0+15;z++)for(let x=x0-1;x<=x0+1;x++)setB(x,t-15,z,T.STONE);return {x:x0,z:z0,t:t-15,d:15,ax:false,carved:true};});await p.waitForTimeout(3000);}
console.log('ravine',JSON.stringify(rv));
if(rv){await p.evaluate(r=>{P.x=r.x+.5;P.z=r.z+.5;P.y=r.t+1;P.vy=0;flying=true;P.yaw=r.ax?0:Math.PI/2;if(r.carved)P.yaw=0;P.pitch=0.25;},rv);await p.waitForTimeout(3000);
 const L=await shotL('ravine_noon');const lr=await p.evaluate(r=>__lightRegion(r.x,r.t+1,r.z),rv);ok(L>40,'ravine at noon is bright',{L,cell:lr,hemi:await p.evaluate(()=>hemi.intensity)});}
// 2. cave mouth: dig a 3x3 tunnel 16 deep into a hillside, look out and in, sample skylight along it
const tn=await p.evaluate(()=>{for(let i=0;i<6000;i++){const x=20+Math.floor(Math.random()*(W-40)),z=20+Math.floor(Math.random()*(D-40)),t=groundTop(x,z);if(t<=SEA+1||world[(x*H+t)*D+z]===T.WATER)continue;const t2=groundTop(x+16,z);if(t2<t+10)continue;let ok=true;for(let k=1;k<=16;k++)if(groundTop(x+k,z)<t+4)ok=false;if(!ok)continue;
 for(let k=1;k<=16;k++)for(let dz=-1;dz<=1;dz++)for(let y=t+1;y<=t+3;y++)setB(x+k,y,z+dz,T.AIR);return {x,z,t};}return null;});
console.log('tunnel',JSON.stringify(tn));
if(tn){await p.waitForTimeout(3000);const prof=await p.evaluate(t=>{const o=[];for(let k=0;k<=16;k+=2){const r=__lightRegion(t.x+k,t.t+2,t.z);o.push(r.sky);}return o;},tn);
 ok(prof[0]===15&&prof[8]<prof[2]&&prof.every((v,i)=>i===0||v<=prof[i-1]),'skylight falls off smoothly into the tunnel',prof);
 await p.evaluate(t=>{P.x=t.x-2.5;P.z=t.z+.5;P.y=t.t+1;P.vy=0;flying=true;P.yaw=-Math.PI/2;P.pitch=0;},tn);await p.waitForTimeout(3000);await shotL('cave_mouth');
 await p.evaluate(t=>{P.x=t.x+8.5;},tn);await p.waitForTimeout(2000);await shotL('tunnel_8_in_looking_deeper');
 await p.evaluate(t=>{P.x=t.x+14.5;P.yaw=Math.PI/2;},tn);await p.waitForTimeout(2000);await shotL('tunnel_end_looking_out');}
// 3. enclosed deep cave
const dc=await p.evaluate(()=>{const cv=__deepCaves[0];let y=Math.floor(cv[1]);while(y>1&&world[idx(Math.floor(cv[0]),y-1,Math.floor(cv[2]))]===0)y--;P.x=cv[0];P.z=cv[2];P.y=y;P.vy=0;P.pitch=0;return [Math.floor(cv[0]),y,Math.floor(cv[2])];});
await p.waitForTimeout(4000);const Lc=await shotL('deep_cave');const cl=await p.evaluate(c=>__lightRegion(c[0],c[1],c[2]),dc);
const hemiCave=await p.evaluate(()=>hemi.intensity);ok(cl.sky<=4,'enclosed deep cave is dark from low skylight',{L:Lc,cell:cl});
// torch in the cave lights locally
await p.evaluate(c=>{P.yaw=0;const x=c[0],z=c[2]-3;for(let y=c[1];y<c[1]+3;y++)if(world[idx(x,y,z)]===0){setB(x,y,z,T.TORCH);break;}},dc);await p.waitForTimeout(3000);const Lt=await shotL('deep_cave_torch');ok(Lt>Lc,'torch lights the cave locally',{before:Lc,after:Lt});
// held torch in the dark cave + underwater douse
await p.evaluate(c=>{inv[T.TORCH]=8;if(MODE.hotbar)MODE.hotbar[0]=T.TORCH;selId=T.TORCH;P.yaw=Math.PI;},dc);await p.waitForTimeout(2500);const Lh=await shotL('deep_cave_held_torch');ok(Lh>Lc,'held torch lights the cave',{dark:Lc,held:Lh,hand:await p.evaluate(()=>handLight.intensity)});
const wt=await p.evaluate(()=>{let best=null;for(let i=0;i<4000&&!best;i++){const x=10+Math.floor(Math.random()*(W-20)),z=10+Math.floor(Math.random()*(D-20));for(let y=H-2;y>4;y--){const b=world[(x*H+y)*D+z];if(b===0)continue;if(b===T.WATER&&world[(x*H+y-4)*D+z]===T.WATER)best=[x,y,z];break;}}return best;});let wt2=wt;if(!wt2)wt2=await p.evaluate(()=>{const x=Math.floor(W/2)-30,z=Math.floor(D/2)-30,t=groundTop(x,z);for(let a=-3;a<=3;a++)for(let b=-3;b<=3;b++)for(let y=t-6;y<=t;y++)setB(x+a,y,z+b,T.WATER);return [x,t,z];});console.log('water',wt,wt2);const wtt=wt2;
if(wtt){await noon();await p.evaluate(w=>{P.x=w[0]+.5;P.z=w[2]+.5;P.y=w[1]-3.5;P.vy=0;flying=false;P.pitch=0;},wtt);await p.waitForTimeout(2000);const u=await p.evaluate(()=>({sel:selId,unlit:inv[257]||0,torch:inv[T.TORCH]||0,hand:handLight.intensity}));const uwL=await shotL('underwater_torch_out');
 const blue=await p.evaluate(()=>({uw:!!window.__uw,ov:document.getElementById('uwBlue').style.display,fog:scene.fog.color.getHexString()}));
 ok(u.sel===257&&u.unlit>0&&!u.torch,'torch goes out under water (Unlit torch)',u);ok(blue.uw&&blue.ov==='block','underwater blue filter on',blue);
 // sprint swim
 await p.evaluate(()=>{P.pitch=-0.5;sprintShift=true;keys.KeyW=true;});const y0=await p.evaluate(()=>P.y);await p.waitForTimeout(2500);const sw=await p.evaluate(()=>({y:P.y,fast:__swimFast,plank:__swimPlank}));
 await p.evaluate(()=>{camMode=1;});await p.waitForTimeout(1200);await shotL('swim_3rd_person');await p.evaluate(()=>{camMode=0;});await p.waitForTimeout(600);await shotL('swim_1st_person');
 await p.evaluate(()=>{sprintShift=false;keys.KeyW=false;P.pitch=0;});ok(sw.fast&&sw.plank>0.5,'sprint-swim: body flat, swims where you look',{y0,...sw});
 // relight with flint and steel
 await p.evaluate(()=>{P.y=groundTop(Math.floor(P.x),Math.floor(P.z))+1;inv[IT.FLINTSTEEL]=1;selId=257;useItem();});const rl=await p.evaluate(()=>({sel:selId,torch:inv[T.TORCH]||0}));ok(rl.torch>0&&rl.sel!==257,'relit with flint and steel',rl);}
// 4. rain stays put while the camera moves
await noon();const op=await p.evaluate(()=>{let x=Math.floor(W/2),z=Math.floor(D/2);for(let i=0;i<400;i++){const t=groundTop(x,z);if(world[(x*H+t)*D+z]!==T.WATER&&t>SEA&&t<__snowY-8)break;x=10+Math.floor(Math.random()*(W-20));z=10+Math.floor(Math.random()*(D-20));}P.x=x+.5;P.z=z+.5;P.y=groundTop(x,z)+1;P.vy=0;flying=false;P.yaw=0;P.pitch=0.05;setWeather('heavy');weather.dark=.55;return [x,z];});
await p.waitForTimeout(3000);await shotL('rain_a');
const r1=await p.evaluate(()=>{const s=__rainInfo();return {s,P:[P.x,P.z]};});await p.evaluate(()=>{P.x+=1.5;P.yaw+=0.4;});await p.waitForTimeout(150);
const r2=await p.evaluate(()=>__rainInfo());await shotL('rain_b_camera_moved');
ok(r1.s.on&&r1.s.count>100&&Math.abs(r2.first[0]-r1.s.first[0])<0.3&&Math.abs(r2.first[2]-r1.s.first[2])<0.01,'rain drops stay in world place when camera moves',{r1,r2});
// 5. wet blocks + puddles
await p.evaluate(()=>{window.__wetHold=true;window.__setWet(1);});await p.waitForTimeout(4000);
const pu=await p.evaluate(()=>__puddles());await p.evaluate(()=>{P.pitch=0.45;});await p.waitForTimeout(800);await shotL('wet_puddles');ok(pu.n>=3&&pu.op>0.5,'puddles appear on flat open ground',pu);
await p.evaluate(()=>{setWeather('clear');weather.dark=0;window.__setWet(0);});await p.waitForTimeout(2500);await shotL('dry_after');const pd=await p.evaluate(()=>__puddles());ok(pd.op<0.01,'puddles fade when dry',pd);
await p.evaluate(()=>{window.__wetHold=false;});
// 6. under a roof in rain: no rain inside, no global darkening
await p.evaluate(()=>{setWeather('heavy');weather.dark=.55;});await p.waitForTimeout(2500);
const hOut=await p.evaluate(()=>hemi.intensity);await shotL('roof_outside');
const hs=await p.evaluate(()=>{const X=Math.floor(P.x),Z=Math.floor(P.z),g=groundTop(X,Z);for(let x=X-4;x<=X+4;x++)for(let z=Z-4;z<=Z+4;z++){for(let y=g+1;y<=g+5;y++){const wall=Math.abs(x-X)===4||Math.abs(z-Z)===4;setB(x,y,z,y===g+5?T.PLANKS:wall&&!(z===Z-4&&Math.abs(x-X)<=1&&y<=g+3)?T.PLANKS:T.AIR);}}P.x=X+.5;P.z=Z+2.5;P.y=g+1;P.yaw=0;P.pitch=0;return [X,Z,g];});
await p.waitForTimeout(5000);const inside=await p.evaluate(h=>{const s=[];let bad=0;const ri=__rainInfo();return {hemi:hemi.intensity,ri};},hs);
const dropsIn=await p.evaluate(h=>{const m=scene.children.find(o=>o.isInstancedMesh&&o.renderOrder===5);const a=m.instanceMatrix.array;let n=0;for(let i=0;i<m.count;i++){const x=a[i*16+12],y=a[i*16+13],z=a[i*16+14];if(Math.abs(x-h[0]-.5)<3.4&&Math.abs(z-h[1]-.5)<3.4&&y<h[2]+5)n++;}return n;},hs);
await shotL('roof_inside_rain');ok(dropsIn===0,'no rain inside the roofed hut',{dropsIn});ok(Math.abs(inside.hemi-hOut)<0.02,'no global darkening under the roof',{out:hOut,in:inside.hemi});
// thunder timing
const st=await p.evaluate(()=>{setWeather('thunder');return weather.strikeT;});ok(st>=40&&st<=130,'next lightning in 40-130 s',{st});
await p.evaluate(()=>{strike();});await p.waitForTimeout(150);await shotL('lightning');
// perf
const pf=await p.evaluate(async()=>{const t=[];let last=performance.now();await new Promise(r=>{let n=0;const f=()=>{const now=performance.now();t.push(now-last);last=now;if(++n<90)requestAnimationFrame(f);else r();};requestAnimationFrame(f);});t.sort((a,b)=>a-b);return {med:t[45].toFixed(1),p90:t[81].toFixed(1)};});
const lt=await p.evaluate(()=>{const t0=performance.now();for(let i=0;i<10;i++)buildChunk(Math.floor(P.x/CH),Math.floor(P.z/CH));return ((performance.now()-t0)/10).toFixed(1);});
console.log('perf frame ms (swiftshader, rain on)',JSON.stringify(pf),'chunk rebuild ms',lt,'light stats',JSON.stringify(await p.evaluate(()=>__lightStats())));
ok(!errs.length,'no page errors',errs);
console.log(fails?'SOME FAIL':'ALL PASS');await b.close();})();
