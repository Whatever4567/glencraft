// Actual production r128 engine + shipped GLTFLoader + original GLB maps. CPU, not GPU/FPS proof.
import vm from 'node:vm';import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import{T,load,runtime,legacy,animation,skinnedVertices}from './lib/pilot-native-r128.mjs';
let n=0;const check=(condition,label)=>{assert.ok(condition,label);console.log('ok '+(++n)+' '+label);};
const dir=new URL('../assets/models/pilot-v1/',import.meta.url),html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const [name,sha]of Object.entries({'pilot.glb':'1e91f94225cee58c4ff5b0d0c42ea39ee1356bbdaf256784fc909af5b7a809a0','pilot-far.glb':'3b6a836790fe501fe89ff5c23d865188af3c2764c72715c02ca836714a7d263c'}))check(crypto.createHash('sha256').update(fs.readFileSync(new URL(name,dir))).digest('hex')===sha,'approved byte-exact '+name);
let scriptCount=0;for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(match[1].includes('application/'))continue;new vm.Script(match[2],{filename:'inline-'+scriptCount++});}check(scriptCount>=5,'all built inline scripts parse, including the late installer');
check(T.REVISION==='128'&&T.GLTFLoader&&T.SkeletonUtils,'actual embedded r128 and shipped loader/clone');
const equip=[129,130,131,132,291],B=legacy(equip),a=B.build(false),b=B.build(true),scene=new T.Scene();scene.add(a,b);
const tier=id=>id>=129&&id<=132?'diamond':id>=112&&id<=115?'gold':id>=108&&id<=111?'iron':id>=104&&id<=107?'copper':null;
let requests=0,distance=0;const U=runtime({load:name=>{requests++;return load(new URL(name,dir));},equipment:()=>equip,tier,distance:g=>g===a?distance:0});
const beforeFallback=a.children.length;let loaded=false;const slow=runtime({load:()=>Promise.reject(Error('test offline'))});const fail=B.build(false);await slow.attach(fail);check(!fail.userData.pilot&&fail.children.length>0&&slow.error.includes('test offline'),'network failure leaves valid prior avatar');
await Promise.all([U.attach(a),U.attach(b)]);check(!U.error&&a.userData.pilot&&b.userData.pilot,'both production avatars attach successfully');check(requests===2,'two assets requested once across independent avatars');
const p=a.userData.pilot,pb=b.userData.pilot;
check(p.near.bones.head!==pb.near.bones.head,'independent cloned head bones');check(p.near.regions.visual_head_hair_eyes.o!==pb.near.regions.visual_head_hair_eyes.o,'independent visibility regions');
check(p.near.regions.gear_white_pack.o.parent&&Object.keys(p.near.regions).length===15,'all 15 native regions registered');
check(a.userData.lod.length===0,'old geometry-swap LOD disabled for replacement');
let oldMeshes=0;a.traverse(o=>{if(o.isMesh){let inside=false;for(let q=o;q;q=q.parent)if(q===p.container)inside=true;if(!inside&&!o.userData.jetFlame)oldMeshes++;}});check(oldMeshes===0,'no old avatar or armour rendered underneath');
check(U.stats(a).near.triangles===85107&&U.stats(a).near.draws===38&&U.stats(a).near.materials===12,'equipped approved near budget 85107 triangles / 38 primitives / 12 materials');
distance=30;U.sync(a);check(U.stats(a).far.triangles===11295&&U.stats(a).far.materials===2&&p.far.root.visible&&!p.near.root.visible,'whole-rig far LOD 11295 triangles / 2 materials');distance=0;U.sync(a);check(p.near.root.visible&&!p.far.root.visible,'near LOD restoration');
let maps=0,normal=0,rough=0,skin=true,opaque=true;p.near.root.traverse(o=>{if(o.isMesh){maps+=!!o.material.map;normal+=!!o.material.normalMap;rough+=!!o.material.roughnessMap;skin=skin&&o.material.skinning;opaque=opaque&&!o.material.transparent&&o.material.depthWrite;}});check(maps>15&&normal>10&&rough>10&&skin&&opaque,'actual embedded maps, normals, roughness and opaque skin shader enabled');
const find=(r,name)=>r.getObjectByName(name)||r.getObjectByName(T.PropertyBinding.sanitizeNodeName(name));
check(p.near.bone('hand.L').getWorldPosition(new T.Vector3()).x>0&&p.near.bone('hand.R').getWorldPosition(new T.Vector3()).x<0,'main hand slot1 remains +X hand.L');
check(Math.abs(a.userData.arms[1].userData.pilot.length1-.2413976)<1e-5&&Math.abs(a.userData.arms[1].userData.pilot.length2-.2287561)<1e-5,'native arm lengths, not old .32/.33 distortion');
// Identity controls must reproduce the frozen GLB, including native head scale and vertex positions.
for(const model of [a,b]){const u=model.userData;u.head.quaternion.identity();u.torso.quaternion.identity();for(const o of [...u.arms,...u.fore,...u.legs,...u.shin])o.quaternion.identity();U.sync(model);}
const baseline=T.SkeletonUtils.clone(U.templates[0]);baseline.updateMatrixWorld(true);const baselinePoints=skinnedVertices(baseline),adapted=skinnedVertices(p.near.root);let max=0;for(const [name,pts]of baselinePoints){const other=adapted.get(name);for(let i=0;i<pts.length;i++)max=Math.max(max,pts[i].distanceTo(other[i]));}check(max<2e-6,'identity retarget matches approved mesh within '+max.toExponential(2)+' m');
const allMaterials=new Map();p.near.root.traverse(o=>{if(o.isMesh)allMaterials.set(o.material.name,o.material)});check(allMaterials.get('EyesBlue.001').map.image.width===512&&allMaterials.get('HairDarkBrown').map.image.width===512,'approved blue eye and dark brown hair maps preserved');
a.userData.head.visible=false;a.userData.arms.forEach(o=>o.visible=false);U.sync(a);check(!p.near.regions.visual_head_hair_eyes.o.visible&&!p.near.regions.gear_helmet.o.visible,'FP hides actual head/helmet renderables');check(!p.near.regions.visual_arm_slot0_hand.o.visible&&!p.near.regions.gear_chest_slot1.o.visible,'FP hides actual arms/arm guards');check(p.near.regions.visual_torso_outfit.o.visible&&p.near.regions.visual_leg_slot0.o.visible,'FP look-down keeps torso and legs');check(pb.near.regions.visual_head_hair_eyes.o.visible,'world FP never hides inventory head');a.userData.head.visible=true;a.userData.arms.forEach(o=>o.visible=true);U.sync(a);check(p.near.regions.visual_head_hair_eyes.o.visible&&p.near.regions.visual_arm_slot0_hand.o.visible,'3P restores actual renderables');
for(let i=0;i<5;i++)equip[i]=0;B.dress(a);U.dressed(a);check(Object.keys(p.near.regions).filter(n=>n.startsWith('gear_')).every(n=>!p.near.regions[n].o.visible),'all detachable equipment removed');check(p.near.regions.visual_leg_slot0.o.visible&&p.near.regions.visual_head_hair_eyes.o.visible,'foundation footwear and helmetless head remain');
let disposed=0;for(const r of [p.near,p.far])r.root.traverse(o=>{if(o.isMesh)o.geometry.addEventListener('dispose',()=>disposed++);});
for(let pass=0;pass<8;pass++){equip.splice(0,5,104,109,114,132,pass%2?291:777);B.dress(a);U.dressed(a);}check(!disposed&&p.gear.every(r=>r.o.parent===r.parent),'repeated mixed-tier dress restores regions without disposing shared assets');
const colorFor=n=>{let found;p.near.regions[n].o.traverse(o=>{if(o.isMesh&&o.material.name==='ArmorTintable')found=o.material.color.getHexString();});return found;};check(new Set(['gear_helmet','gear_chest_slot0','gear_legs_slot0','gear_boots_slot0'].map(colorFor)).size===4,'mixed tiers tint only independent authored armour panels');
const fabric=Array.from(p.near.mats.values()).find(m=>m.name==='FlightFabricTeal');check(fabric.color.equals(fabric.userData.pilotOriginalColor),'armour never recolours skin/fabric/harness');
equip.splice(0,5,129,130,131,132,777);B.dress(a);U.dressed(a);const packMat=Array.from(p.near.mats.values()).find(m=>m.name==='PackWhite');check(p.near.regions.gear_white_pack.o.visible&&!packMat.color.equals(packMat.userData.pilotOriginalColor),'gold pack policy: same frozen casing, gold material variant');
equip[4]=291;B.dress(a);U.dressed(a);check(packMat.color.equals(packMat.userData.pilotOriginalColor),'white pack exact material restored');
// Actual flame meshes remain owned by the production jetpack lifecycle.
const flames=[-1,1].map(()=>{const f=new T.Mesh(new T.ConeGeometry(.055,.7,12,1,true),new T.MeshBasicMaterial());f.userData.jetFlame=1;f.rotation.x=Math.PI;a.userData.torso.add(f);return f;});a.userData.armourParts.push(...flames);U.dressed(a);check(p.flames.length===2,'existing flame objects retained');for(let i=0;i<2;i++){const tip=flames[i].getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.35,0));check(tip.distanceTo(U.nozzleWorld(a,i))<1e-6,'flame tip matches native nozzle '+i);}
const A=animation(a,U),poses=[];
function finitePose(label){const points=skinnedVertices(p.near.root);let maxAbs=0;for(const pts of points.values())for(const v of pts){assert.ok(v.toArray().every(Number.isFinite),label);maxAbs=Math.max(maxAbs,...v.toArray().map(Math.abs));}check(maxAbs<4,label+' finite native skin deformation');poses.push({label,maxAbs});}
for(const mode of ['walk','sprint','jump','landing']){for(let frame=0;frame<12;frame++){A.P.x+=.015;A.P.z+=.025;A.P.onGround=mode!=='jump';A.P.vy=mode==='jump'?3:0;A.set('sprinting',mode==='sprint');A.tick();}finitePose(mode);}
for(const [name,id]of [['rifle',14],['pistol',13]]){
 const hm=new T.Group();hm.userData.g3=id;A.scene.add(hm);A.set('heldId',id);A.set('heldMesh3p',hm);
 for(const pitch of [-.5,0,.5]){A.P.pitch=pitch;A.P.onGround=true;for(let i=0;i<8;i++)A.tick();finitePose(name+' pitch '+pitch);check(a.userData.arms[1].userData.pilotGripError<.025,name+' main grip error '+a.userData.arms[1].userData.pilotGripError.toFixed(5)+' m');if(name==='rifle')check(a.userData.arms[0].userData.pilotGripError<.025,'rifle support grip error '+a.userData.arms[0].userData.pilotGripError.toFixed(5)+' m');}
 hm.parent.remove(hm);
}
check(!A.G.__tpa.err&&!U.error,'no production procedural-animation or adapter errors');
const expectedRelease=process.env.PILOT_EXPECT_VERSION||'1.2.35';check(['1.2.35','1.2.36'].includes(expectedRelease)&&html.includes("const GAME_VERSION = '"+expectedRelease+"'")&&JSON.parse(fs.readFileSync(new URL('../version.json',import.meta.url))).v===expectedRelease,'release metadata '+expectedRelease+' aligned');
check(html.indexOf('/* GLX-APPROVED-PILOT-1235 */')>html.indexOf('/* GLX-TP-ANIM'),'adapter installs after production pose wrappers');
check(requests===2,'poses, LOD and dress make no additional network requests');
// Execute the final browser installer with the actual shipped loader (only file transport is stubbed).
const originalLoad=T.GLTFLoader.prototype.load;let installerRequests=0;
T.GLTFLoader.prototype.load=function(url,onLoad,progress,onError){installerRequests++;load(new URL(url.split('/').pop().split('?')[0],dir)).then(onLoad,onError);};
try{
 const world=B.build(false),portrait=B.build(true),worldScene=new T.Scene(),charScene=new T.Scene();worldScene.add(world);charScene.add(portrait);let beforeCalls=0,charCalls=0;worldScene.onBeforeRender=()=>beforeCalls++;
 const ARMOUR={};for(const [base,name]of [[104,'copper'],[108,'iron'],[112,'gold'],[129,'diamond']])for(let k=0;k<4;k++)ARMOUR[base+k]={mat:name};
 const J={THREE:T,console,setTimeout,clearTimeout,document:{},scene:worldScene,charScene,worldModel:world,charModel:portrait,camera:new T.PerspectiveCamera(),armour:equip,ARMOUR,buildPlayerModel:B.build,dressModel:B.dress,renderChar(){charCalls++;}};J.window=J;
 const marker=html.lastIndexOf('/* GLX-APPROVED-PILOT-1235 */'),end=html.indexOf('</script>',marker);new Function('with(this){'+html.slice(marker,end)+'}').call(J);
 await J.__pilot1235.ready();await Promise.all([world.userData.pilotPending,portrait.userData.pilotPending]);
 check(!!world.userData.pilot&&!!portrait.userData.pilot,'actual late installer upgrades already-created world and portrait models');
 const newModel=J.buildPlayerModel(true);charScene.add(newModel);J.dressModel(newModel);await newModel.userData.pilotPending;
 check(!!newModel.userData.pilot&&installerRequests===2,'actual build/dress wrapper upgrades future models from one cached load');
 worldScene.onBeforeRender();J.renderChar();charScene.onBeforeRender();check(beforeCalls===1&&charCalls===1&&charScene.userData.pilot1235Hook,'actual scene and inventory hooks preserve previous callbacks');
 equip[0]=0;J.dressModel(world);check(!world.userData.pilot.near.regions.gear_helmet.o.visible,'actual late dress wrapper removes native helmet');
 check(!J.__pilot1235.error,'actual installer/loader/control lifecycle has no runtime error');
}finally{T.GLTFLoader.prototype.load=originalLoad;}
const out={scope:'Actual embedded Three r128, shipped GLTFLoader, original maps and production controls/animation. CPU only; no browser/GPU/FPS claim.',checks:n,sourceTriangles:85107,farTriangles:11295,identityMaxErrorMetres:max,poses};if(process.env.PILOT_QA_OUTPUT)fs.writeFileSync(process.env.PILOT_QA_OUTPUT,JSON.stringify(out,null,2)+'\n');console.log('PASS '+n+' native integration checks');
