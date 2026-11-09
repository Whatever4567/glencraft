// Regression for actual r128/glTF output mismatch. Shader-source + numeric transfer proof, NOT a GPU capture.
import {execFileSync}from 'node:child_process';import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import{T,load}from './lib/pilot-native-r128.mjs';
const file=process.argv[2]||'index.html',html=fs.readFileSync(file,'utf8');let n=0;const ok=(c,label)=>{assert.ok(c,label);console.log('ok '+(++n)+' '+label);};
const marker=html.lastIndexOf('/* GLX-APPROVED-PILOT-1235 */'),end=html.indexOf('/* Install after the final production animation/equipment wrappers. */',marker);assert(marker>0&&end>marker);
const W={};new Function('window',html.slice(marker,end))(W);
const equip=[129,130,131,132,291];let requests=0;const U=W.PilotRuntimeFactory(T,{load:name=>{requests++;return load(new URL('../assets/models/pilot-v1/'+name,import.meta.url));},equipment:()=>equip,tier:id=>id>=129?'diamond':id>=112?'gold':id>=108?'iron':'copper'});
// Real control interfaces, independent from any WebGL renderer.
function controls(){const g=new T.Group(),u=g.userData;u.head=new T.Group();u.torso=new T.Group();g.add(u.head,u.torso);u.arms=[];u.fore=[];u.legs=[];u.shin=[];u.armourParts=[];u.lod=[];
 for(let i=0;i<2;i++){const a=new T.Group(),f=new T.Group(),grip=new T.Group(),hand=new T.Group(),l=new T.Group(),k=new T.Group();a.add(f);f.add(grip,hand);hand.userData.hand=1;hand.userData.fg=Array.from({length:4},()=>new T.Group());a.userData.el=f;a.userData.grip=grip;l.add(k);l.userData.kn=k;u.arms.push(a);u.fore.push(f);u.legs.push(l);u.shin.push(k);g.add(a,l);}return g;}
const a=controls(),b=controls();await Promise.all([U.attach(a),U.attach(b)]);ok(!U.error,'approved near/far GLBs parse in the actual shipped r128 loader');
const mats=r=>Array.from(r.mats.values()),near=a.userData.pilot.near,far=a.userData.pilot.far,portrait=b.userData.pilot.near;
const linearRenderer={outputEncoding:T.LinearEncoding,getRenderTarget:()=>null},sRGBRenderer={outputEncoding:T.sRGBEncoding,getRenderTarget:()=>null};
function compile(m,r){const sh={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{}};m.onBeforeCompile(sh,r);return sh;}
for(const [name,r]of [['near',near],['far',far]])for(const m of mats(r)){
 const original=m.color.toArray(),rough=m.roughness,metal=m.metalness,normal=m.normalMap,map=m.map;
 const sh=compile(m,linearRenderer);ok(sh.fragmentShader.includes('PILOT_DISPLAY_TRANSFER_1236'),name+' '+m.name+': world gets missing sRGB display transfer');
 const tone=sh.fragmentShader.indexOf('#include <tonemapping_fragment>'),enc=sh.fragmentShader.indexOf('PILOT_DISPLAY_TRANSFER_1236'),fog=sh.fragmentShader.indexOf('#include <fog_fragment>');ok(tone<enc&&enc<fog,name+' '+m.name+': transfer after ACES and before legacy fog');
 ok(m.color.toArray().every((v,k)=>v===original[k])&&m.roughness===rough&&m.metalness===metal&&m.normalMap===normal&&m.map===map,'no material-factor/map replacement for '+m.name);
 ok(m.skinning&&m.depthWrite&&!m.transparent,'skinning/opaque/depth preserved for '+m.name);
 if(map)ok(map.encoding===T.sRGBEncoding,'base colour remains sRGB encoded: '+m.name);
 if(normal)ok(normal.encoding===T.LinearEncoding,'normal data remains linear: '+m.name);
 if(m.roughnessMap)ok(m.roughnessMap.encoding===T.LinearEncoding,'roughness data remains linear: '+m.name);
}
for(const m of mats(portrait)){const sh=compile(m,sRGBRenderer);ok(!sh.fragmentShader.includes('PILOT_DISPLAY_TRANSFER_1236'),'sRGB inventory has no second transfer: '+m.name);}
const first=mats(near)[0];ok(!compile(first,{outputEncoding:T.LinearEncoding,getRenderTarget:()=>({texture:{encoding:T.sRGBEncoding}})}).fragmentShader.includes('PILOT_DISPLAY_TRANSFER_1236'),'sRGB render target is not double encoded');
ok(compile(first,{outputEncoding:T.sRGBEncoding,getRenderTarget:()=>({texture:{encoding:T.LinearEncoding}})}).fragmentShader.includes('PILOT_DISPLAY_TRANSFER_1236'),'linear render target follows actual r128 target-encoding selection');
const baseTexture=U.templates[0].getObjectByName('gear_boots_slot0').material.map;ok(baseTexture===mats(near).find(m=>m.name==='ArmorTintable').map&&baseTexture.encoding===T.sRGBEncoding,'cached authored texture is not mutated for world/portrait');
equip.splice(0,4,104,109,114,132);U.dressed(a);for(const r of [near,far]){ok(r.tintVariants.size===3,'all mixed-tier variants exist');for(const m of r.tintVariants.values())ok(compile(m,linearRenderer).fragmentShader.includes('PILOT_DISPLAY_TRANSFER_1236')&&m.customProgramCacheKey().includes('pilot-display-transfer-1236'),'tier clone retains transfer hook and shader-cache key');}
ok(portrait.mats!==near.mats&&requests===2,'portrait materials independent, assets still loaded once');
const srgb=x=>x<=.0031308?x*12.92:1.055*x**(1/2.4)-.055,decode=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const mult=(m,v)=>m.map(row=>row.reduce((sum,x,j)=>sum+x*v[j],0));
function aces(v){v=mult([[.59719,.35458,.04823],[.076,.90834,.01566],[.0284,.13383,.83777]],v.map(c=>c*1.05/.6));v=v.map(x=>(x*(x+.0245786)-.000090537)/(x*(.983729*x+.432951)+.238081));return mult([[1.60475,-.53108,-.07367],[-.10208,1.10813,-.00605],[-.00327,-.07276,1.07602]],v).map(x=>Math.max(0,Math.min(1,x)));}
const values=[];for(const m of mats(near))if(m.map&&['FlightFabricTeal','HairDarkBrown','EyesBlue.001'].includes(m.name)||m.name.includes('anatomical skin')){
 const im=m.map.image,d=im.getContext('2d').getImageData(0,0,im.width,im.height).data;let sum=[0,0,0],count=0;for(let i=0;i<d.length;i+=4*37){if(d[i+3]<255)continue;count++;for(let k=0;k<3;k++)sum[k]+=decode(d[i+k]/255)*m.color.toArray()[k];}const linear=sum.map(c=>c/count),tone=aces(linear),fixed=tone.map(srgb),before=tone.reduce((a,b)=>a+b)/3,after=fixed.reduce((a,b)=>a+b)/3;
 ok(after>before+.02,m.name+': actual atlas-mean sample shows missing-transfer darkening');values.push({material:m.name,linearAtlasMean:linear,oldDisplayRGB:tone,correctedDisplayRGB:fixed,ratio:after/before});}
ok(values.length===4,'skin, fabric, hair and blue-eye atlas samples evaluated');
let scripts=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(m[1].includes('application/'))continue;new vm.Script(m[2]);scripts++;}ok(scripts>=5,'all built scripts parse');
for(const [name,sha]of Object.entries({'pilot.glb':'1e91f94225cee58c4ff5b0d0c42ea39ee1356bbdaf256784fc909af5b7a809a0','pilot-far.glb':'3b6a836790fe501fe89ff5c23d865188af3c2764c72715c02ca836714a7d263c'}))ok(crypto.createHash('sha256').update(fs.readFileSync(new URL('../assets/models/pilot-v1/'+name,import.meta.url))).digest('hex')===sha,'frozen '+name+' unchanged');
const baseline=execFileSync('git',['show','8fa1159196367644bfabf3425e81462f4b2be7b6:index.html'],{maxBuffer:50*1024*1024}).toString();
let normalized=html.replace("const GAME_VERSION = '1.2.36';","const GAME_VERSION = '1.2.35';").replace('<!-- glencraft-build: b1236-v1.2.36 -->','<!-- glencraft-build: b1235-v1.2.35 -->').replace(/window\.PATCH_NOTES = \[\n\{"v":"v1\.2\.36"[^\n]+\},/,'window.PATCH_NOTES = [');
const helper=fs.readFileSync(new URL('../tools/pilot-model-source/display-transfer-1236.js',import.meta.url),'utf8');
normalized=normalized.replace(helper+'\n','').replace('const c=installPilotDisplayTransfer(m.clone());c.userData.pilotOriginalColor','const c=m.clone();c.userData.pilotOriginalColor').replace('const m=installPilotDisplayTransfer(original.clone()),hex=','const m=original.clone(),hex=');
ok(normalized===baseline,'entire game is byte-identical to live after reversing only the output helper, its two clone hooks and release metadata');
console.log(JSON.stringify({scope:'Actual r128 shader transformation and numeric ACES/display-transfer proof; no GPU capture.',samples:values},null,2));console.log('PASS '+n+' display-transfer checks');
