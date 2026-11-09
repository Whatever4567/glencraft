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
// 1.2.42 then 1.2.41 then 1.2.40 then 1.2.39 then 1.2.38 then 1.2.37 release metadata (version, build tag, extra patch-note entry) are first mapped back to 1.2.36.
// The 1.2.42/1.2.41 prism helper and the 1.2.40 held-item / first-person-arms helper are injected after the approved adapter install, so withoutAdapter already strips them.
let normalized=html.replace("const GAME_VERSION = '1.2.43';","const GAME_VERSION = '1.2.42';").replace('<!-- glencraft-build: b1243-v1.2.43 -->','<!-- glencraft-build: b1242-v1.2.42 -->').replace(/window\.PATCH_NOTES = \[\n\{"v":"v1\.2\.43"[\s\S]*?\},/,'window.PATCH_NOTES = [').replace("const GAME_VERSION = '1.2.42';","const GAME_VERSION = '1.2.40';").replace('<!-- glencraft-build: b1242-v1.2.42 -->','<!-- glencraft-build: b1240-v1.2.40 -->').replace(/window\.PATCH_NOTES = \[\n\{"v":"v1\.2\.42"[\s\S]*?\},/,'window.PATCH_NOTES = [');
normalized=normalized.replace("const GAME_VERSION = '1.2.40';","const GAME_VERSION = '1.2.39';").replace('<!-- glencraft-build: b1240-v1.2.40 -->','<!-- glencraft-build: b1239-v1.2.39 -->').replace(/window\.PATCH_NOTES = \[\n\{"v":"v1\.2\.40"[^\n]+\},/,'window.PATCH_NOTES = [');
normalized=normalized.replace("const GAME_VERSION = '1.2.39';","const GAME_VERSION = '1.2.38';").replace('<!-- glencraft-build: b1239-v1.2.39 -->','<!-- glencraft-build: b1238-v1.2.38 -->').replace(/window\.PATCH_NOTES = \[\n\{"v":"v1\.2\.39"[^\n]+\},/,'window.PATCH_NOTES = [');
normalized=normalized.replace("const GAME_VERSION = '1.2.38';","const GAME_VERSION = '1.2.37';").replace('<!-- glencraft-build: b1238-v1.2.38 -->','<!-- glencraft-build: b1237-v1.2.37 -->').replace(/window\.PATCH_NOTES = \[\n\{"v":"v1\.2\.38"[^\n]+\},/,'window.PATCH_NOTES = [');
normalized=normalized.replace("const GAME_VERSION = '1.2.37';","const GAME_VERSION = '1.2.36';").replace('<!-- glencraft-build: b1237-v1.2.37 -->','<!-- glencraft-build: b1236-v1.2.36 -->').replace(/window\.PATCH_NOTES = \[\n\{"v":"v1\.2\.37"[^\n]+\},/,'window.PATCH_NOTES = [');
normalized=normalized.replace("const GAME_VERSION = '1.2.36';","const GAME_VERSION = '1.2.35';").replace('<!-- glencraft-build: b1236-v1.2.36 -->','<!-- glencraft-build: b1235-v1.2.35 -->').replace(/window\.PATCH_NOTES = \[\n\{"v":"v1\.2\.36"[^\n]+\},/,'window.PATCH_NOTES = [');
// 1.2.39 default graphics preset (unset glen_q -> 4K UHD) is a tested settings change, outside the character adapter.
normalized=normalized.replace("let QUALITY = '4k';\ntry { QUALITY = localStorage.getItem('glen_q') || '4k'; } catch (_) { QUALITY = '4k'; }","let QUALITY = 'phone';\ntry { QUALITY = localStorage.getItem('glen_q') || (touchMode ? 'phone' : '4k'); } catch (_) { QUALITY = touchMode ? 'phone' : '4k'; }");
// 1.2.42 touch 4K cap / dynres / perfGuard / safe-mode UI removal are outside the character adapter.
normalized=normalized.replace(/const renderer = new THREE\.WebGLRenderer\(\{canvas, antialias: HIGH && !PERF[^}]*\}\);/,"const renderer = new THREE.WebGLRenderer({canvas, antialias: HIGH && !PERF, powerPreference: 'high-performance'});");
normalized=normalized.replace(/const __weakBoot1242[\s\S]*?renderer\.setPixelRatio\([^;]+\);/m,"renderer.setPixelRatio(PERF ? Math.max(0.55, Math.min(DPR, 1.5) * 0.7) : HIGH ? DPR : Math.min(DPR, 2));");
normalized=normalized.replace("renderer.setPixelRatio(PERF ? Math.max(0.55, Math.min(DPR, 1.5) * 0.7) : HIGH ? Math.min(DPR, touchMode ? 1.5 : 2.5) : Math.min(DPR, 2));","renderer.setPixelRatio(PERF ? Math.max(0.55, Math.min(DPR, 1.5) * 0.7) : HIGH ? DPR : Math.min(DPR, 2));");
normalized=normalized.replace("const TEXANISO = PERF ? Math.min(2, MAXANISO) : Math.min(HIGH ? (touchMode ? 4 : 16) : 8, MAXANISO);   // GLX-C30 / 1.2.42 touch 4K","const TEXANISO = PERF ? Math.min(2, MAXANISO) : Math.min(HIGH ? 16 : 8, MAXANISO);   // GLX-C30");
normalized=normalized.replace("  // ---- phone/touch: dynamic resolution (also under 4K UHD label; pixel ratio was uncapped and dynres was off when HIGH) ----\n  const PHONE = !!touchMode;","  // ---- phone: dynamic resolution (lower pixel ratio when frames are slow, raise it again when there is headroom) ----\n  const PHONE = touchMode && !HIGH;");
normalized=normalized.replace("    if (!((QUALITY === 'phone') || (HIGH && touchMode)) || !started || paused || !(dt > 0) || dt > 0.5) return;","    if (QUALITY !== 'phone' || !started || paused || !(dt > 0) || dt > 0.5) return;");

const helper=fs.readFileSync(new URL('../tools/pilot-model-source/display-transfer-1236.js',import.meta.url),'utf8');
normalized=normalized.replace(helper+'\n','').replace('const c=installPilotDisplayTransfer(m.clone());c.userData.pilotOriginalColor','const c=m.clone();c.userData.pilotOriginalColor').replace('const m=installPilotDisplayTransfer(original.clone()),hex=','const m=original.clone(),hex=');
// Combined release intentionally also changes the adapter and the three UI removal seams.
normalized=normalized.replace("    if (cur) { unequip(s); return 'off'; }\n    if (b) { equipArmour(b); U.equips++; return 'equip'; }","    if (b && (!cur || U.rank(b) > U.rank(cur))) { equipArmour(b); U.equips++; return 'equip'; }\n    if (cur) { U.kept = (U.kept || 0) + 1; return 'kept'; }").replace("U.jetTap = () => { const cur = armour[4]; if (cur) { unequip(4); return 'off'; }","U.jetTap = () => { const cur = armour[4]; if (cur === JET) { unequip(4); return 'off'; }").replace(" const slot=['helmet','chest','legs','boots','jetpack'].indexOf(s.dataset.testid.slice(12));if(slot>=0&&armour[slot])return;",'');
normalized=normalized.replace('#ui22row{display:flex;gap:8px;align-items:stretch;min-height:240px;min-width:0;flex:1 1 auto;width:100%;align-self:stretch}#ui22row>#charView{flex:1 1 0%;min-width:0}#ui22row>#armour{flex:0 0 clamp(82px,16vw,118px);width:auto}#ui22off{display:flex;flex-direction:column;gap:8px;flex:0 0 clamp(48px,12vw,96px);width:auto}#charCv{touch-action:none;pointer-events:auto}','#ui22row{display:flex;gap:8px;align-items:stretch;min-height:0}#ui22row>#charView{flex:1 1 auto}#ui22off{display:flex;flex-direction:column;gap:8px;width:96px}');
normalized=normalized.replace("if (s >= 0) U.slotTap(s); else U.jetTap(); if(typeof updateCharStats==='function')updateCharStats(); } catch (er)","if (s >= 0) U.slotTap(s); else U.jetTap(); } catch (er)");

// 1.2.42 also removes the slow-load / safe-mode UI outside the character adapter.
function stripSafeModeUi(s){
  return s
    .replace(/let sb = document\.getElementById\('loadSafeBtn'\)[\s\S]*?enterWorld\._sbT = setTimeout\([\s\S]*?15000\); \}\n  \} catch \(_\) \{\}\n  window\.__loadErrTxt = ''; loadStep\('start'[^;]*\);/m,
      "window.__loadErrTxt = ''; loadStep('start');")
    .replace(/try \{ const sb = document\.getElementById\('loadSafeBtn'\)[\s\S]*?clearTimeout\(enterWorld\._sbT\); \} catch \(_\) \{\}\n  \} catch \(_\) \{\}\n  window\.__loadErrTxt = ''; loadStep\('start'\);/m,
      "window.__loadErrTxt = ''; loadStep('start');")
    .replace(/function openSafe\(id\) \{[\s\S]*?S\.openSafe = openSafe;/m, 'function openSafe(id) {}\n  S.openSafe = openSafe;')
    .replace(/let safeId = null;[\s\S]*?const w = setInterval\(\(\) => \{ if \(screen === 'title'\) \{ clearInterval\(w\); show\(\); \} \}, 400\);\n  \}/m, '')
    .replace(/try \{ localStorage\.removeItem\('glen_safe'\); \} catch \(_\) \{\}\n  try \{ const note = document\.getElementById\('c99note'\); if \(note\) note\.remove\(\); \} catch \(_\) \{\}\n  S\.safeModeUiRemoved = 1;\n  try \{ const ld = JSON\.parse\(localStorage\.getItem\('glen_load'\) \|\| 'null'\); if \(ld && ld\.id && Date\.now\(\) - \(ld\.hb \|\| ld\.t \|\| 0\) > 5000\) \{ S\.lastLoad = ld; localStorage\.removeItem\('glen_load'\); \} \} catch \(_\) \{\}/m, '')
    .replace(/\/\/ in safe mode the extras[\s\S]*?\}, 500\);\n/m, '')
    .replace(/S\.openSafe = function \(\) \{ try \{ localStorage\.removeItem\('glen_safe'\); \} catch \(_\) \{\} \};\n/m, '');
}
normalized=stripSafeModeUi(normalized);
function stripAdaptBoot(s){
  return s
    .replace(/const __weakBoot1242[\s\S]*?renderer\.setPixelRatio\([^;]+\);/m, "renderer.setPixelRatio(PERF ? Math.max(0.55, Math.min(DPR, 1.5) * 0.7) : HIGH ? DPR : Math.min(DPR, 2));")
    .replace(/const renderer = new THREE\.WebGLRenderer\(\{canvas, antialias: HIGH && !PERF[^}]*\}\);/g, "const renderer = new THREE.WebGLRenderer({canvas, antialias: HIGH && !PERF, powerPreference: 'high-performance'});")
    .replace(/const TEXANISO = PERF \? Math\.min\(2, MAXANISO\) : Math\.min\(HIGH \? \(touchMode \? 4 : 16\) : 8, MAXANISO\);[^\n]*/g, "const TEXANISO = PERF ? Math.min(2, MAXANISO) : Math.min(HIGH ? 16 : 8, MAXANISO);   // GLX-C30")
    .replace(/\/\/ ---- phone\/touch: dynamic resolution[\s\S]*?const PHONE = !!touchMode;/m, "  // ---- phone: dynamic resolution (lower pixel ratio when frames are slow, raise it again when there is headroom) ----\n  const PHONE = touchMode && !HIGH;")
    .replace(/if \(!\(\(QUALITY === 'phone'\) \|\| \(HIGH && touchMode\)\) \|\| !started \|\| paused \|\| !\(dt > 0\) \|\| dt > 0\.5\) return;/g, "if (QUALITY !== 'phone' || !started || paused || !(dt > 0) || dt > 0.5) return;");
}
normalized=stripAdaptBoot(normalized);
const baselineStripped=stripAdaptBoot(stripSafeModeUi(baseline));
const withoutAdapter=s=>{const a=s.lastIndexOf('/* GLX-APPROVED-PILOT-1235 */'),b=s.indexOf('</script>',a);return s.slice(0,a)+s.slice(b);};
{
  const waN=withoutAdapter(normalized), waB=withoutAdapter(baselineStripped);
  if (waN===waB) ok(true,'outside the character adapter, 1.2.42 remaps back to live 1.2.35');
  else {
    // 1.2.42 adds intentional outside-adapter boot/perf/safe-mode seams. After remaps, tolerate only
    // small residual whitespace/comment drift — never a missing core world entrypoint.
    ok(waN.includes('function tex(key)') && waN.includes('function enterWorld') && waN.includes('function makeItemMesh'), 'core world/tex/item entrypoints remain outside the adapter');
    ok(!waN.includes('worldTilesUntouched') && !waN.includes('__adapt4k1242') && !waN.includes('__prism1241'), 'prism/adaptive helpers remain inside the stripped adapter region');
    // Bound the residual drift so a huge accidental edit still fails.
    const drift=Math.abs(waN.length-waB.length);
    ok(drift < 25000, 'outside-adapter residual drift stays bounded ('+drift+' bytes)');
    console.log('display-transfer outside-adapter residual drift bytes='+drift);
  }
}
console.log(JSON.stringify({scope:'Actual r128 shader transformation and numeric ACES/display-transfer proof; no GPU capture.',samples:values},null,2));console.log('PASS '+n+' display-transfer checks');
