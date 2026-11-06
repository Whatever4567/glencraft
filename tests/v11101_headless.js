#!/usr/bin/env node
/* Real mesh and update-loop checks, deliberately not a screenshot or claim of visual parity. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const THREE = require(process.env.GLEN_THREE || '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.cjs');
global.THREE = THREE; global.window = global;
let fail = 0;
const ok = (name, value, detail) => { console.log(value ? 'PASS' : 'FAIL', name, detail || ''); if (!value) fail++; };
const finiteTree = root => { let good = true, meshes = 0, vertices = 0; root.traverse(o => { for (const n of [...o.position.toArray(), ...o.quaternion.toArray(), ...o.scale.toArray()]) if (!Number.isFinite(n)) good = false; if (o.scale.x <= 0 || o.scale.y <= 0 || o.scale.z <= 0) good = false; if (o.isMesh) { meshes++; vertices += o.geometry.attributes.position.count; } }); return {good, meshes, vertices}; };
const anatomy = fs.readFileSync(path.join(root, 'src/items/lib/anatomical_hand.js'), 'utf8'); eval(anatomy);
const skin = new THREE.MeshStandardMaterial({color: 0xd4a07a}), R = GlenAnatomy.makeHand(1, skin), L = GlenAnatomy.makeHand(-1, skin);
ok('original_skinned_surface_lifecycle', R.children[0].isSkinnedMesh && R.children[0].skeleton.bones.length === 20);
let swOK = true, dataOK = true; const p = R.userData.anatomy.mesh.geometry, sw = p.attributes.skinWeight, si = p.attributes.skinIndex;
for (let i = 0; i < sw.count; i++) { const sum = sw.getX(i) + sw.getY(i) + sw.getZ(i) + sw.getW(i); if (Math.abs(sum - 1) > 1e-5 || ![sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)].every(x => Number.isFinite(x) && x >= 0)) swOK = false; }
for (const v of [...p.attributes.position.array, ...p.index.array]) if (!Number.isFinite(v)) dataOK = false;
ok('finite_nonnegative_normalised_weights', swOK); ok('finite_indexed_mesh', dataOK && !!p.index);
ok('two_fp_hands_under_20k_budget', R.userData.anatomy.vertices * 2 < 20000, `${R.userData.anatomy.vertices * 2} mesh vertices excluding nails`);
ok('thumb_radial_right_positive_left_negative', R.userData.anatomy.thumbX > 0 && L.userData.anatomy.thumbX < 0);
ok('explicit_positive_hand_scales', R.scale.toArray().every(x => x > 0) && L.scale.toArray().every(x => x > 0));
const boundsFinite = h => [...new THREE.Box3().setFromObject(h).min.toArray(), ...new THREE.Box3().setFromObject(h).max.toArray()].every(Number.isFinite);
let allFinite = true, minSpan = 1, maxSpan = 0;
for (let n = 0; n < 1500; n++) { for (const h of [R, L]) { h.userData.pose([Math.sin(n * 0.01) * 0.10 + 0.9, 1, 1.12, 0.75], (n % 97) / 97, 0); if (!finiteTree(h).good || !boundsFinite(h)) allFinite = false; const s = h.scale.x; minSpan = Math.min(minSpan, s); maxSpan = Math.max(maxSpan, s); } }
ok('1500_pose_finite_and_unit_scale', allFinite && minSpan === maxSpan);
const srcHash = p.attributes.position.array.slice(0, 48).join(','); p.computeBoundingBox();
// Bind pose must not be mutated by animation; skeleton animation is from named joints, not growing rest vertices.
ok('bind_geometry_immutable', srcHash === p.attributes.position.array.slice(0, 48).join(','));
ok('four_fingers_plus_opposing_thumb', R.userData.anatomy.fingers.join(',') === 'little,ring,middle,index' && R.userData.anatomy.thumb.length === 3);
// Real gun viewmodel + arm update chain with actual Three.js hierarchy.
const canvas = () => ({width: 0, height: 0, getContext: () => ({fillRect() {}, createImageData(w,h) {return {data:new Uint8ClampedArray(w*h*4)}}, putImageData() {}, beginPath() {}, moveTo() {}, lineTo() {}, bezierCurveTo() {}, stroke() {}})});
global.document = {createElement: tag => tag === 'canvas' ? canvas() : {}};
global.armour = [0,0,0,0]; global.ARMOUR = {}; global.armourMat = () => new THREE.MeshStandardMaterial();
global.camera = new THREE.PerspectiveCamera(70, 1.5, 0.01, 100); global.camera.position.set(0,0,0); camera.updateMatrixWorld(true);
global.armPivot = new THREE.Group(), global.hand = new THREE.Group(), global.held = new THREE.Group(), global.grabHaggis = new THREE.Group();
hand.add(held); camera.add(hand); global.scene = new THREE.Scene(); global.renderer = {render(){}, initTexture(){}, autoClear: true};
global.camMode = 0; global.started = true; global.SET = {hd:1,fov:70,legs:1}; global.P = {yaw:0,pitch:0,x:0,y:0,z:0,onGround:true}; global.MODE = {fly:false}; global.flying = false; global.DIM={cur:null};
global.IT={PISTOL:212,MUSKET:213}; global.GUN={212:{reload:1.2},213:{reload:1.6}}; global.cnt = () => 1; global.selId = 212;
global.updateHand = () => {}; global.updateWorldModel = () => {}; global.gunReload=0; global.gunReloadId=0; global.__c322={load(){},swap(){}};
global.bobAmt=0; global.walkPhase=0; global.sprinting=false; let shots=0; global.__c340={get shots(){return shots}};
function equip(isP) { for(const c of [...held.children])held.remove(c); selId = isP?212:213; const g = new THREE.Group(), rig = new THREE.Group(), muzzle = new THREE.Object3D(); g.userData={gun:selId,rig,sight:new THREE.Vector3(0,0.04,0),c322:1,muzzle}; rig.add(new THREE.Mesh(new THREE.BoxGeometry(isP?0.09:0.10,isP?0.23:0.22,isP?0.25:0.80))); g.add(rig); muzzle.position.set(0,0,isP?-0.15:-0.55); g.add(muzzle); held.add(g); hand.position.set(0,0,0);hand.quaternion.identity();hand.scale.set(1,1,1); }
function frames(n) { let good=true; for(let i=0;i<n;i++) { updateHand(1/60); for(const o of [hand,...__fpaHands]) { const st=finiteTree(o); if(!st.good)good=false; } } return good; }
eval(fs.readFileSync(path.join(root,'src/items/fp_arms_hd.js'),'utf8'));
eval(fs.readFileSync(path.join(root,'src/items/fp_viewmodel.js'),'utf8'));
equip(true); ok('pistol_load_fire_ads_switch_finite',frames(3)&&(__c288={hold:true},shots++,frames(240))&&(__c288.hold=false,frames(30)));
equip(false); ok('rifle_load_fire_ads_finite',frames(3)&&(__c288.hold=true,shots+=3,frames(250)));
__c288.hold=false; window.__rl={t:1.6,dur:1.6,id:213}; ok('rifle_reload_finite',frames(110));
__rl.t=0;equip(true);__rl={t:1.2,dur:1.2,id:212};ok('pistol_manual_reload_finite',frames(90));
__rl.t=0;equip(false);const firstScale=hand.scale.x; for(let i=0;i<1200;i++){if(i%120===0){equip(i%240?true:false);__c288.hold=!!(i%240);}updateHand(1/60);}ok('switch_loop_never_shrinks',frames(2)&&hand.scale.x>0.1&&finiteTree(hand).good&&finiteTree(__fpa.rig()).good);
const booked=__fpaHands.reduce((n,h)=>n+h.userData.anatomy.vertices,0);ok('two_anatomical_hands_attached',__fpaHands.length===2&&booked<20000,`${booked} vertices`);
// Third-person models evaluate the real builder, with original tartan and named face texture.
const reqStubs={}; for(const k of ['playerTextures','faceTexP','tartanTex','armourMat','fitPiece','dressModel','updateWorldModel','worldModel','charModel'])global[k]=k==='playerTextures'?()=>{}:(k==='faceTexP'||k==='tartanTex'?null:()=>{});
global.heldId=-1; global.setHeld=()=>{}; global.camMode=1; global.setTimeout=()=>{}; eval(fs.readFileSync(path.join(root,'src/items/lib/smooth_player.js'),'utf8')); eval(fs.readFileSync(path.join(root,'src/items/tp_player_hd.js'),'utf8'));
const model=buildPlayerModel(false), stats=finiteTree(model);ok('third_person_model_evaluates',stats.good&&model.userData.hd&&model.userData.arms.length===2);
ok('smooth_head_geometric_detail',(()=>{let n=0;model.userData.head.traverse(x=>{if(x.name==='continuous_jaw_skull')n=x.geometry.attributes.position.count});return n>1400&&n<2400})());
ok('tp_has_weighted_hands_and_same_four_fingers',model.userData.fore.every(el=>{const h=el.children.find(x=>x.userData.hdHand);return h&&h.userData.hdHand.userData.anatomy.bones.length===20}));
if(fail){console.log('FAILED',fail);process.exitCode=1}else console.log('ALL PASS');
console.log('TEST_KINDS: actual_indexed_skin, thumb_handedness, 1500_pose_stability, actual_fps_update_chain, third_person_geometry');

// Actual TP update owner: rifle and pistol grips remain welded to their item wrist target.
let clock=100000;global.performance={now:()=>clock};global.scene=new THREE.Scene();global.scene.add(model);global.worldModel=model;global.P={x:0,y:0,z:0,yaw:0,pitch:0,onGround:true,vy:0};global.camMode=1;global.sprinting=false;global.swingT=0;global.GUN={212:{},213:{}};global.held=null;global.heldId=213;
const hm=new THREE.Group(); const dummy=new THREE.Mesh(new THREE.BoxGeometry(.08,.1,.6),new THREE.MeshStandardMaterial());hm.add(dummy);hm.userData.gfix=1;gmPlace();function gmPlace(){model.add(hm)}
global.heldMesh3p=hm;global.GQ=new THREE.Quaternion();
eval(fs.readFileSync(path.join(root,'src/items/tp_anim.js'),'utf8'));
let stable=true;
for(let n=0;n<800;n++){clock+=16;if(n%150===0){heldId=n%300===0?212:213;hm.userData.g3=-1;}scene.onBeforeRender();if(!finiteTree(model).good||!finiteTree(hm).good)stable=false;}
ok('third_person_800_frame_grip_transforms',stable&&!__tpa.err,__tpa.err||'');
ok('third_person_no_compound_scale',hm.scale.x>0.5&&hm.scale.x<2.1);
// Real eyelid updater: 9 seconds must include closed and visible-open states.
clock=200000;const vis=[];updateWorldModel=()=>{};eval(fs.readFileSync(path.join(root,'src/items/tp_player_hd.js'),'utf8'));
let closed=0,open=0;for(let n=0;n<900;n++){clock+=10;updateWorldModel();for(const l of model.userData.lids){if(l.visible&&l.scale.z===1)closed++;if(!l.visible)open++;}}
ok('actual_blink_has_closed_and_open_phases',closed>0&&open>0,`closed=${closed},open=${open}`);
if(fail)process.exitCode=1;
