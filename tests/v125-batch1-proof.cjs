'use strict';
// Behavioural proof for v1.2.5 batch1 against the actual built source (and the v1.2.4 control via V125_CONTROL=path).
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const file=process.env.V125_HTML||path.join(__dirname,'../index.html');const html=fs.readFileSync(file,'utf8');
const seg=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);assert(i>=0&&j>i,'segment '+a);return html.slice(i,j);};
const ti=html.indexOf('!function(t,e){"object"==typeof exports');assert(ti>=0,'three');const three=html.slice(ti,html.indexOf('\n',ti));
const ctx=vm.createContext({console,setInterval:()=>0,clearInterval(){},performance:{now:()=>0}});ctx.window=ctx;ctx.self=ctx;
vm.runInContext(three,ctx);assert(ctx.THREE&&ctx.THREE.Group,'THREE loaded');
let pass=0;const test=(n,f)=>{f();pass++;console.log('PASS',n);};
const c350=seg('(function c350() {','\n})();')+'\n})();';
vm.runInContext(`var THREE=window.THREE;var hand=new THREE.Group();var held=new THREE.Group();hand.add(held);var camera=new THREE.PerspectiveCamera();camera.add(hand);
var document={createElement:()=>({getContext:()=>new Proxy({},{get:(t,k)=>k==="createRadialGradient"||k==="createLinearGradient"?()=>({addColorStop(){}}):()=>{}})})};var renderer={render(){} ,initTexture(){}};var started=true,camMode=0,selId=0,P={yaw:0,pitch:0},SET={},IT={PISTOL:1,MUSKET:2},GUN={1:{},2:{}};var cnt=()=>1;var walkPhase=0,bobAmt=0;
function updateHand(){} window.__c322={swap(){},load(){}};
function mkGun(id,s){held.clear();const g=new THREE.Group();g.scale.setScalar(s);const rig=new THREE.Group();g.add(rig);g.userData={gun:id,rig,c322:1};held.add(g);selId=id;return g;}
function mkPick(){held.clear();const g=new THREE.Group();g.userData={};held.add(g);selId=99;}`,ctx);
vm.runInContext(c350,ctx);
const run=n=>{for(let i=0;i<n;i++)vm.runInContext('updateHand(0.016)',ctx);};
const hs=()=>JSON.parse(vm.runInContext('JSON.stringify([hand.scale.x,hand.scale.y,hand.scale.z])',ctx));
test('hand bind scale restored after a gun is put away (pickaxe/item normal size)',()=>{
 vm.runInContext('mkGun(2,0.35)',ctx);run(30);const g=hs()[0];assert(Math.abs(g-1)>0.05,'gun pose applied '+g);
 vm.runInContext('mkPick()',ctx);run(2);assert.deepEqual(hs(),[1,1,1]);});
test('repeated gun<->gun<->item switching never compounds base scale',()=>{
 const bases=[];for(let k=0;k<12;k++){vm.runInContext(`mkGun(${k%2?1:2},0.35)`,ctx);run(5);bases.push(vm.runInContext('held.children[0].userData.__s0Base',ctx));if(k%3===2){vm.runInContext('mkPick()',ctx);run(2);}}
 for(const b of bases)assert(Math.abs(b-0.35)<1e-6,'base '+bases);});
test('map old block arm hidden',()=>{assert(html.includes('fists[1].visible = false; fists[-1].visible = false;'));assert(!html.includes('fists[1].visible = s === 1'));});
test('castle decor: generation and saved records produce no props; Hell props path intact',()=>{
 assert(html.includes("window.__c150.props = []; /* v1.2.5"));assert(html.includes('U.props = [/* v1.2.5'));assert(html.includes('C.props = (d.c167p || []).map('));
 const r=seg('/* GLX-R124 save passthrough */','/* GLX-C288');const c2={};vm.createContext(c2);
 vm.runInContext('var serialize=function(){return {id:"w"}};var applySave=function(){};'+r+';applySave({id:"w",c150p:[[1]],deepCaves:[2]});var o=serialize();',c2);
 assert.equal(c2.o.c150p,undefined);assert.equal(JSON.stringify(c2.o.deepCaves),"[2]");});
console.log(pass,'passed');
