'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');const i=html.indexOf('(function v129() {'),code=html.slice(i,html.indexOf('\n})();',i))+'\n})();';
const iv=[];const ctx=vm.createContext({console,setInterval:(f)=>{iv.push(f);return iv.length},clearInterval(){},setTimeout:f=>f(),document:{getElementById:()=>null,querySelectorAll:()=>[]}});ctx.window=ctx;
vm.runInContext(`var started=true,dead=false,DIM={cur:null},SET={},toasts=[];function toast(t){toasts.push(t)}function saveSet(){}function enterWorld(){}
var y={unlocked:0,cd:5,met:()=>false,enter(){if(this.cd>0)return false;window.__c248.y=1;return true},exit(){if(this.cd>0)return false;window.__c248.y=2;return true}};window.__y24p=y;window.__c248={y:0,stop24(){this.y=2}};
window.__c309={on:true,exit(){this.on=false},board(){this.on=true}};`,ctx);
vm.runInContext(code,ctx);const R=s=>vm.runInContext(s,ctx);let p=0;const t=(n,f)=>{f();p++;console.log('PASS',n);};
t('locked before the encounter',()=>{assert.equal(R('__v129.on()'),false);assert.equal(R('__c248.y'),0);});
t('unlocked: on enters chrome (ignores portal cooldown), off always leaves',()=>{R('y.unlocked=1');assert.equal(R('__v129.on()'),true);assert.equal(R('__c248.y'),1);R('y.cd=9');assert.equal(R('__v129.off()'),true);assert.equal(R('__c248.y'),2);});
t('off falls back to stop24 if exit fails',()=>{R('__c248.y=1;y.exit=()=>false');R('__v129.off()');assert.equal(R('__c248.y'),2);});
t('UFO: boarding blocked, already-flying gets out',()=>{for(const f of iv.slice())f();for(const f of iv.slice())f();R('__c309.board()');assert.equal(R('__c309.on'),false);assert(R('__v129.ufoBlocked')>=1);});
t('portal never placed; alien lines framed as fiction',()=>{assert(html.includes('return false; /* v1.2.9: portal replaced by Chrome mode setting */'));assert(html.includes('not what makes anyone worthy'));assert(html.includes('Every people above and below is equal'));});
console.log(p,'passed');
