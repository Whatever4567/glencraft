// regression: chest -> inventory never loses items (click, half, A/tap, close-with-held, stacking, offhand, reload, creative)
const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1000,height:580},hasTouch:true}); p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.text().includes('reset37'))console.log(m.text().slice(0,300));});
await p.goto('http://localhost:8765/index.html?t160'); await p.waitForFunction(()=>screen==='title',null,{timeout:300000});
await p.evaluate(()=>{window.confirm=()=>true;current={id:'t160',name:'G',mode:'survival',created:Date.now()};enterWorld(null)}); await p.waitForFunction(()=>started,null,{timeout:300000});
await p.waitForTimeout(1500);
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const total=()=>p.evaluate(()=>{let t=0;for(const k in inv)t+=inv[k]||0;const c=chests.get(openChestKey||window.__ck);if(c)for(const s of c.slots)if(s)t+=s[1];if(cursor)t+=cursor.n;if(offhand)t+=offhand.n||0;return t;});
const k=await p.evaluate(()=>{for(const [k,c] of chests)if(c.slots.some(s=>s&&s[0]===IT.PAINTING)){window.__ck=k;return k;}});
ok(!!k,'castle chest with painting found '+k);
await p.evaluate(k=>{inv[IT.BREAD]=3;const [x,y,z]=k.split(',').map(Number);openChest(x,y,z);},k);
const t0=await total();
// 1 mouse click each filled slot then click a bag slot (puts it in the bag)
const n=await p.evaluate(()=>chests.get(openChestKey).slots.filter(s=>s).length);
for(let i=0;i<27;i++){const has=await p.evaluate(i=>!!chests.get(openChestKey).slots[i],i);if(!has)continue;
  const mode=i%3; // 0 mouse click, 1 touch tap, 2 controller A (navEl.click)
  if(mode===0)await p.click(`[data-testid=chest-slot-${i}]`);else if(mode===1)await p.tap(`[data-testid=chest-slot-${i}]`);else await p.evaluate(i=>document.querySelector(`[data-testid=chest-slot-${i}]`).click(),i);
  if(await p.evaluate(()=>!!cursor))await p.click('[data-testid=chest-inv-0]');}
const t1=await total();ok(t1===t0,`all ${n} stacks moved, totals ${t0} -> ${t1}`);
ok(await p.evaluate(()=>bagItems().includes(IT.PAINTING)),'painting visible in bag');
ok(await p.evaluate(()=>[...document.querySelectorAll('#chestInv .gslot')].some(e=>e.title===NAMES[IT.PAINTING])),'painting shown in chest bag grid');
// half-take + close with held stack
await p.evaluate(()=>{const c=chests.get(openChestKey);c.slots[0]=[IT.BREAD,5];});
const t2=await total();await p.click('[data-testid=chest-slot-0]',{button:'right'});await p.evaluate(()=>closePanels());const t3=await p.evaluate(()=>{let t=0;for(const k in inv)t+=inv[k]||0;const c=chests.get(window.__ck);for(const s of c.slots)if(s)t+=s[1];return t;});
ok(t3===t2,`half take then close keeps items ${t2} -> ${t3}`);
// stacking with existing stack: put bread back into chest, take again
await p.evaluate(k=>{const [x,y,z]=k.split(',').map(Number);openChest(x,y,z);},k);
const b0=await p.evaluate(()=>cnt(IT.BREAD));const c0=await p.evaluate(()=>chests.get(openChestKey).slots[0]);await p.click('[data-testid=chest-slot-0]');await p.click('[data-testid=chest-inv-0]');
ok(await p.evaluate(()=>cnt(IT.BREAD))===b0+(c0?c0[1]:0),'stacks onto existing bread');
// offhand: hold an item and send to offhand
await p.evaluate(()=>{const c=chests.get(openChestKey);c.slots[1]=[IT.PAINTING,1];});const t4=await total();await p.click('[data-testid=chest-slot-1]');
await p.evaluate(()=>{offhand={id:IT.BREAD,n:1};}).catch(()=>{});const t4b=await total();
await p.evaluate(()=>closePanels());const t5=await p.evaluate(()=>{let t=0;for(const k in inv)t+=inv[k]||0;const c=chests.get(window.__ck);for(const s of c.slots)if(s)t+=s[1];return t+(offhand?offhand.n:0);});
ok(t5===t4b,`held stack + offhand survive close ${t4b} -> ${t5}`);
// save / reload
const before=await p.evaluate(()=>JSON.stringify([cnt(IT.PAINTING),cnt(IT.BREAD)]));
await p.evaluate(()=>{const d=JSON.parse(JSON.stringify(serialize()));applySave(d);});
ok(await p.evaluate(()=>JSON.stringify([cnt(IT.PAINTING),cnt(IT.BREAD)]))===before,'inventory survives save/reload '+before);
// creative: taking out then closing must not delete
await p.evaluate(()=>{MODE.infinite=true;const [x,y,z]=window.__ck.split(',').map(Number);openChest(x,y,z);chests.get(openChestKey).slots[2]=[IT.GOLDINGOT,7];});
await p.click('[data-testid=chest-slot-2]');await p.evaluate(()=>closePanels());
ok(await p.evaluate(()=>chests.get(window.__ck).slots.some(s=>s&&s[0]===IT.GOLDINGOT&&s[1]===7)),'creative: closing returns stack to chest');
await p.evaluate(()=>{MODE.infinite=false;});
// moved house chest after reset
await p.evaluate(()=>{const x0=Math.floor(P.x)+3,z0=Math.floor(P.z)+3,g=solidTop(x0,z0);for(let x=x0;x<x0+6;x++)for(let z=z0;z<z0+6;z++){setB(x,g,z,T.PLANKS);setB(x,g+1,z,(x===x0||z===z0||x===x0+5||z===z0+5)?T.PLANKS:T.AIR);}
  setB(x0+2,g+1,z0+2,T.CHEST);chests.set(keyOf(x0+2,g+1,z0+2),{slots:[[IT.PAINTING,1],[IT.BREAD,9]].concat(new Array(25).fill(null))});P.x=x0+3;P.z=z0+3;P.y=g+2;console.log('[reset37] house',x0,g,z0,JSON.stringify(g9castles));});
await p.evaluate(async()=>{await resetTerrain();});
const mv=await p.evaluate(()=>{for(const [k,c] of chests)if(c.slots[1]&&c.slots[1][0]===IT.BREAD&&c.slots[1][1]===9){const [x,y,z]=k.split(',').map(Number);return {k,block:world[idx(x,y,z)]===T.CHEST};}return null;});
ok(mv&&mv.block,'house chest moved with contents '+JSON.stringify(mv));
if(mv){await p.evaluate(k=>{window.__ck=k;const [x,y,z]=k.split(',').map(Number);openChest(x,y,z);},mv.k);const a=await p.evaluate(()=>cnt(IT.PAINTING));await p.click('[data-testid=chest-slot-0]');await p.click('[data-testid=chest-inv-0]');ok(await p.evaluate(()=>cnt(IT.PAINTING))===a+1,'take painting from moved chest');}
console.log(fails?'FAILURES '+fails:'ALL PASS');await b.close();process.exit(fails?1:0);})();
