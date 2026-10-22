const {chromium}=require('playwright-core');const dir='/workspace/game/shots/g14/';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1000,height:580}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.addInitScript(()=>{const gp={id:'Xbox Wireless Controller (STANDARD GAMEPAD)',index:0,mapping:'standard',connected:true,timestamp:0,buttons:Array.from({length:17},()=>({pressed:false,value:0,touched:false})),axes:[0,0,0,0]};window.__gp=gp;navigator.getGamepads=()=>[gp];});
let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' '+JSON.stringify(x):''));if(!c)fails++;};
const press=async(i)=>{await p.evaluate(i=>{__gp.buttons[i].pressed=true;__gp.buttons[i].value=1;},i);await p.waitForTimeout(250);await p.evaluate(i=>{__gp.buttons[i].pressed=false;__gp.buttons[i].value=0;},i);await p.waitForTimeout(250);};
const stick=async(x,y,ms)=>{await p.evaluate(([x,y])=>{__gp.axes[0]=x;__gp.axes[1]=y;},[x,y]);await p.waitForTimeout(ms);await p.evaluate(()=>{__gp.axes[0]=0;__gp.axes[1]=0;});await p.waitForTimeout(200);};
const foc=()=>p.evaluate(()=>{const e=document.querySelector('#menu .scr.on .focus')||document.querySelector('#pause .focus');return e?(e.id||e.dataset.testid||e.textContent.trim().slice(0,20)):null;});
await p.goto('http://localhost:8765/index.html?t223');await p.waitForFunction(()=>screen==='title',null,{timeout:300000});await p.waitForTimeout(800);
await p.evaluate(()=>showScreen('title'));await press(13);await press(12);
const f0=await foc();ok(f0==='playBtn','Play Game focused on load',f0);
const rects=await p.evaluate(()=>menuItems().map(e=>{const r=e.getBoundingClientRect();return [e.id||e.textContent.trim().slice(0,12),Math.round(r.left),Math.round(r.top),Math.round(r.width)];}));console.log(JSON.stringify(rects));
await p.screenshot({path:dir+'main_menu_focus.png'});
await press(13);const f1=await foc();await press(12);const f2=await foc();ok(f2==='playBtn'&&f1!=='playBtn','d-pad down then up returns to Play',{f1,f2});
await stick(0,1,300);const f3=await foc();ok(f3===f1,'left stick down moves like d-pad',f3);
await stick(0,-1,300);
// world list + create via A
await press(0);await p.waitForTimeout(500);console.log('screen',await p.evaluate(()=>screen),await foc());
await press(1);await p.waitForTimeout(300);ok((await p.evaluate(()=>screen))==='title','B goes back');
// in game: inventory free cursor
await p.evaluate(()=>{current={id:'t223',name:'S',mode:'survival',created:Date.now()};enterWorld(null)});await p.waitForFunction(()=>started,null,{timeout:300000});await p.waitForTimeout(1500);
await p.evaluate(()=>{inv[T.PLANKS]=20;inv[T.STONE]=12;inv[T.DIRT]=30;inv[IT.STICK]=8;});
await press(3);await p.waitForTimeout(500);   // Y opens inventory
const open=await p.evaluate(()=>({menuOpen,tab:invTab,panel:activePanel()&&activePanel().id}));console.log('open',JSON.stringify(open));
if(!open.menuOpen){await p.evaluate(()=>openMenu(true));await p.waitForTimeout(400);}
// switch to bag tab with RB until bag
for(let i=0;i<5&&(await p.evaluate(()=>invTab))!=='bag';i++)await press(5);
console.log('tab',await p.evaluate(()=>invTab));
const c0=await p.evaluate(()=>__padPointer());await p.evaluate(()=>{__gp.axes[0]=0.8;});for(let i=0;i<4;i++){await p.waitForTimeout(400);console.log('mid',JSON.stringify(await p.evaluate(()=>[__padPointer(),__gp.axes[0],readPad.toString().length])));}await stick(0.8,0,100);const c1=await p.evaluate(()=>__padPointer());
ok(c1.cx>c0.cx+40,'left stick moves a free cursor',{c0,c1});
await stick(0,0.7,1800);await p.waitForTimeout(600);const c2=await p.evaluate(()=>__padPointer());
await p.screenshot({path:dir+'inventory_cursor.png'});
// A picks up hovered stack, shows held stack following cursor
await p.evaluate(()=>{const e=[...document.querySelectorAll('#craft .gslot')].find(e=>e.offsetParent&&!e.classList.contains('empty')&&!e.classList.contains('hint')&&/\d/.test(e.textContent));navEl=e;navRefresh();__padPointerTo(e);});await p.waitForTimeout(500);
const before=await p.evaluate(()=>({nav:navEl&&navEl.className,id:navEl&&navEl._id}));
await press(0);const held=await p.evaluate(()=>cursor&&{id:cursor.id,n:cursor.n});console.log('held',JSON.stringify(held),JSON.stringify(before));
await stick(0.6,0.3,1500);await p.waitForTimeout(500);await p.screenshot({path:dir+'inventory_cursor_holding.png'});
await press(1);const after=await p.evaluate(()=>({cursor,menuOpen}));console.log('after B',JSON.stringify(after));
const tot=await p.evaluate(()=>[inv[T.PLANKS],inv[T.STONE],inv[T.DIRT],inv[IT.STICK]]);ok(JSON.stringify(tot)==='[20,12,30,8]','no items lost',tot);
ok(await p.evaluate(()=>!!document.querySelector('#padHints')),'hint bar exists');
// pause: spatial
if(await p.evaluate(()=>menuOpen))await press(1);await press(9);await p.waitForTimeout(400);
const pf=[];for(let i=0;i<3;i++){await press(13);pf.push(await foc());}await press(15);pf.push(await foc());console.log('pause path',JSON.stringify(pf));
ok(pf.length===4&&pf[3]!==pf[2],'pause d-pad moves spatially (right moves within a row)',pf);
await p.screenshot({path:dir+'pause_focus.png'});
console.log(fails?'SOME FAIL':'ALL PASS');await b.close();})();
