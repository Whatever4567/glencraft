// 1.2.39: default graphics preset is 4K UHD when glen_q is unset. CPU/source evidence, not a GPU check.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let n=0;const ok=(c,s)=>{assert.ok(c,s);console.log('ok '+(++n)+' '+s);};

const seam="let QUALITY = '4k';\ntry { QUALITY = localStorage.getItem('glen_q') || '4k'; } catch (_) { QUALITY = '4k'; }";
ok(html.includes(seam),'built index defaults QUALITY to 4k when glen_q is unset');
ok(!html.includes("let QUALITY = 'phone';"),'old phone initializer is gone');
ok(!html.includes("touchMode ? 'phone' : '4k'"),'touch devices no longer default to phone when unset');
ok((html.includes("const GAME_VERSION = '1.2.57';") || html.includes("const GAME_VERSION = '1.2.56';") || html.includes("const GAME_VERSION = '1.2.55';") || html.includes("const GAME_VERSION = '1.2.54';") || html.includes("const GAME_VERSION = '1.2.53';") || html.includes("const GAME_VERSION = '1.2.52';") || html.includes("const GAME_VERSION = '1.2.51';") && html.includes('<!-- glencraft-build: b1263-v1.2.63 -->') || html.includes('<!-- glencraft-build: b1262-v1.2.62 -->') || html.includes('<!-- glencraft-build: b1261-v1.2.61 -->') || html.includes('<!-- glencraft-build: b1260-v1.2.60 -->') || html.includes('<!-- glencraft-build: b1252-held-rollback -->') || html.includes('<!-- glencraft-build: b1251-visible-land -->')) || (html.includes("const GAME_VERSION = '1.2.50';") && (html.includes('<!-- glencraft-build: b1250-held-popstar -->') || html.includes('<!-- glencraft-build: b1250-v1.2.50 -->') || html.includes('<!-- glencraft-build: b1249-v1.2.49 -->'))) || (html.includes("const GAME_VERSION = '1.2.49';") && html.includes('<!-- glencraft-build: b1249-v1.2.49 -->')) || (html.includes("const GAME_VERSION = '1.2.48';") && html.includes('<!-- glencraft-build: b1248-v1.2.48 -->')) || (html.includes("const GAME_VERSION = '1.2.47';") && html.includes('<!-- glencraft-build: b1247-v1.2.47 -->')) || (html.includes("const GAME_VERSION = '1.2.46';") && html.includes('<!-- glencraft-build: b1246-v1.2.46 -->')) || (html.includes("const GAME_VERSION = '1.2.44';") && html.includes('<!-- glencraft-build: b1244-v1.2.44 -->')) || (html.includes("const GAME_VERSION = '1.2.42';") && html.includes('<!-- glencraft-build: b1242-v1.2.42 -->')) || (html.includes("const GAME_VERSION = '1.2.40';") && html.includes('<!-- glencraft-build: b1240-v1.2.40 -->')) || (html.includes("const GAME_VERSION = '1.2.39';") && html.includes('<!-- glencraft-build: b1239-v1.2.39 -->')),'version and build marker are 1.2.46+ (4K default preserved)');
ok(html.includes('Default graphics mode is now 4K UHD.'),'patch notes mention the 4K UHD default');

const start=html.indexOf("let QUALITY = ");
const end=html.indexOf("const HIGH = QUALITY === '4k';",start);
ok(start>=0&&end>start,'QUALITY init block is present once');
const init=html.slice(start,end);

function boot(store){
  const writes=[];
  const ctx={QUALITY:undefined, localStorage:{
    getItem(k){return store&&Object.prototype.hasOwnProperty.call(store,k)?store[k]:null;},
    setItem(k,v){writes.push([k,String(v)]); if(store)store[k]=String(v);}
  }};
  vm.createContext(ctx);
  vm.runInContext(init+'\nthis.__QUALITY=QUALITY;',ctx);
  return {quality:ctx.__QUALITY, writes};
}

ok(boot({}).quality==='4k'&&boot({}).writes.length===0,'unset storage boots 4K UHD and does not auto-save glen_q');
ok(boot({glen_q:'phone'}).quality==='phone'&&boot({glen_q:'phone'}).writes.length===0,'explicitly saved Phone is kept and not overwritten');
ok(boot({glen_q:'4k'}).quality==='4k'&&boot({glen_q:'4k'}).writes.length===0,'explicitly saved 4K UHD is kept');

function selected(quality){
  const buttons=[...html.matchAll(/<button([^>]*data-q="(phone|4k)"[^>]*)>/g)].map(m=>({q:m[2],cls:/\bclass="([^"]*)"/.exec(m[1])}));
  ok(buttons.length===4,'title and settings both expose Phone and 4K UHD buttons');
  ok(buttons.every(b=>!b.cls || !/\bon\b/.test(b.cls[1])),'HTML does not hard-code a selected quality; JS applies QUALITY');
  const on=q=>q===quality;
  const titlePhone=on('phone'), title4k=on('4k');
  ok(title4k!==titlePhone,'exactly one quality is selected for a given QUALITY');
  return {title4k, settings4k:title4k, titlePhone, settingsPhone:titlePhone};
}
const unset=selected('4k');
ok(unset.title4k&&unset.settings4k&&!unset.titlePhone,'4K UHD is the selected UI state for the unset default');
const saved=selected('phone');
ok(saved.titlePhone&&!saved.title4k,'saved Phone still shows Phone selected in the UI logic');

console.log('PASS '+n+' quality-default checks');
