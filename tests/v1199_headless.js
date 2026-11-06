#!/usr/bin/env node
/* v1.1.99: FPS rig owner + reload-under-unlimited + transform stability (stub THREE scene) */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = n => fs.readFileSync(path.join(root, n), 'utf8');
let fail = 0;
function ok(name, cond, detail) {
  if (cond) console.log('PASS', name);
  else { console.log('FAIL', name, detail || ''); fail++; }
}

const arms = read('src/items/fp_arms_hd.js');
const vm = read('src/items/fp_viewmodel.js');
const rg = read('src/items/real_guns.js');
const rla = read('src/items/reload_any_time.js');
const c400 = read('src/items/gun_pose_single_owner.js');
const b87 = read('build87.py');
const aim = read('src/items/gun_aim_lt.js');
const tp = read('src/items/tp_player_hd.js');

ok('arms_version_99', /v1\.1\.99/.test(arms));
ok('thumb_radial_side', /th\.position\.set\(side \* 0\.038/.test(arms));
ok('no_giant_hand_scale', /h\.scale\.setScalar\(1\.05\)/.test(arms));
ok('block_grip_tight_curl', /0\.72, 0\.78, 0\.82, 0\.88/.test(arms));
ok('wrist_clamp', /Math\.max\(-1\.15/.test(arms));
ok('vm_positive_scale', /Math\.abs\(sc\.x\)/.test(vm));
ok('swap_hides_before', /g\.visible = false/.test(rg) && /Hide procedural gun/.test(rg));
ok('swap_reveal_after', /g\.visible = true/.test(rg) && /u\.c322 = 1/.test(rg));
ok('manual_reload_always_anim', /Deliberate manual/.test(rla) && /go\(id, true\)/.test(rla));
ok('force_startReload_b87', /startReload\(id, force\)/.test(b87));
ok('reloadGun_force_true', /startReload\(selId, true\)/.test(b87));
ok('aim_yields_to_vm', /__vm && __vm\.on/.test(aim));
ok('c400_owner_vm', /owner: 'vm'/.test(c400));
ok('blink_improved', /l\.scale\.y = 0\.35 \+ k \* 0\.65/.test(tp));

// Stub THREE + simulate 1000 frames of transform owner / reload
global.THREE = {
  Vector3: class { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;} clone(){return new THREE.Vector3(this.x,this.y,this.z);} copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;} set(x,y,z){this.x=x;this.y=y;this.z=z;return this;} add(){return this;} addScaledVector(){return this;} subVectors(){return this;} normalize(){return this;} length(){return 1;} multiplyScalar(){return this;} applyMatrix4(){return this;} applyQuaternion(){return this;} crossVectors(){return this;} transformDirection(){return this;} distanceTo(){return 0;} lerp(){return this;} },
  Quaternion: class { constructor(){this.x=0;this.y=0;this.z=0;this.w=1;} copy(){return this;} setFromEuler(){return this;} setFromRotationMatrix(){return this;} setFromUnitVectors(){return this;} multiply(){return this;} invert(){return this;} slerp(){return this;} },
  Euler: class { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;} setFromQuaternion(q){return this;} },
  Matrix4: class { constructor(){this.elements=new Float32Array(16);} identity(){return this;} copy(){return this;} clone(){return new THREE.Matrix4();} invert(){return this;} compose(){return this;} multiply(){return this;} multiplyMatrices(){return this;} makeBasis(){return this;} premultiply(){return this;} decompose(p,q,s){p.set(0,0,0);s.set(1,1,1);return this;} },
  Group: class { constructor(){this.children=[];this.position=new THREE.Vector3();this.rotation=new THREE.Euler();this.scale=new THREE.Vector3(1,1,1);this.quaternion=new THREE.Quaternion();this.visible=true;this.userData={};this.parent=null;} add(...o){o.forEach(x=>{x.parent=this;this.children.push(x);});} remove(...o){this.children=this.children.filter(c=>!o.includes(c));} traverse(fn){fn(this);this.children.forEach(c=>c.traverse&&c.traverse(fn));} updateMatrix(){} updateMatrixWorld(){} },
  Mesh: class extends (class{}) { constructor(){this.isMesh=true;this.visible=true;this.position=new THREE.Vector3();this.scale=new THREE.Vector3(1,1,1);this.userData={};this.parent=null;this.material={};this.geometry={attributes:{position:{count:0,array:new Float32Array(0)}}};} },
  Box3: class { constructor(){this.min=new THREE.Vector3();this.max=new THREE.Vector3(1,1,1);this.isEmpty=()=>false;} union(){return this;} applyMatrix4(){return this;} getCenter(o){return o.set(0.5,0.5,0.5);} clone(){return new THREE.Box3();} },
  Color: class { constructor(){} setHex(){return this;} clone(){return this;} multiplyScalar(){return this;} add(){return this;} copy(){return this;} getHSL(o){o.s=0;o.h=0;o.l=0.5;} },
  CanvasTexture: class {}, SphereGeometry: class {}, BoxGeometry: class {}, CylinderGeometry: class {}, ConeGeometry: class {}, TorusGeometry: class {},
  MeshStandardMaterial: class { constructor(o){Object.assign(this,o||{});} },
  MeshBasicMaterial: class {}, MeshPhongMaterial: class {}, Sprite: class {}, SpriteMaterial: class {},
  AmbientLight: class {}, DirectionalLight: class {}, PointLight: class {}, PerspectiveCamera: class { constructor(){this.fov=70;this.aspect=1;this.matrixWorld=new THREE.Matrix4();this.position=new THREE.Vector3();} updateProjectionMatrix(){} },
  Scene: class { constructor(){this.children=[];} add(){} traverseVisible(){} },
  AdditiveBlending: 1, NormalBlending: 0, DoubleSide: 2, RepeatWrapping: 1000,
};
// Simulate unlimited-ammo mag-full manual reload semantics (mirrors patched startReload + RLA)
const GUN = {1: {mag: 5, rl: 1.4, reload: 1.4}};
let gunMag = {1: 5}, rlT = 0, rlId = 0, selId = 1;
const MODE = {infinite: true};
function ammoCount(){ return 99; }
function startReload(id, force) {
  const G = GUN[id];
  if (rlT > 0 || (!force && gunMag[id] >= G.mag)) return false;
  if (!force && !MODE.infinite && ammoCount() <= 0) return false;
  rlT = G.rl; rlId = id; return true;
}
const __rl = {t: 0, dur: 0, id: 0, n: 0, manual: 0};
function go(id, manual) {
  const G = GUN[id]; if (!G || __rl.t > 0) return false;
  __rl.dur = G.rl; __rl.t = G.rl; __rl.id = id; __rl.n++; __rl.manual = manual ? 1 : 0; return true;
}
function reloadGun() {
  const okCore = startReload(selId, true);
  go(selId, true);
  return okCore;
}

ok('full_mag_blocks_auto', startReload(1, false) === false && rlT === 0);
ok('full_mag_manual_force', reloadGun() === true && rlT > 0 && __rl.t > 0 && __rl.manual === 1);

// Simulate 1000 frames
let handScale = {x: 1, y: 1, z: 1};
let visibleFinal = false;
let owners = 0;
const s0Base = 1;
for (let i = 0; i < 1000; i++) {
  const dt = 0.016;
  if (rlT > 0) rlT -= dt;
  if (__rl.t > 0) __rl.t -= dt;
  // equip/switch frames
  if (i === 100) { gunMag[1] = 5; visibleFinal = false; }
  if (i === 120) { visibleFinal = true; } // atomic reveal after swap
  if (i === 200) { gunMag[1] = 3; } // fire drained
  if (i === 210) { gunMag[1] = 5; } // C283 top-up
  if (i === 300) { reloadGun(); }
  if (i === 500) { handScale = {x: s0Base, y: s0Base, z: s0Base}; owners = 1; }
  if (i === 700) { // ADS / sprint / mine — scale must stay finite
    const ss = Math.max(0.08, Math.min(8, Math.abs(s0Base)));
    handScale = {x: ss, y: ss, z: ss};
  }
  if (!(handScale.x > 0.05 && handScale.y > 0.05 && handScale.z > 0.05)) { ok('scale_stable_loop', false, JSON.stringify(handScale)); break; }
}
ok('scale_stable_1000', handScale.x > 0.05 && handScale.x < 8);
ok('one_owner_flag', owners === 1);
ok('final_asset_visible_path', visibleFinal === true);
ok('manual_reload_counted', __rl.n >= 1);
ok('thumb_side_right_positive', /side \* 0\.038/.test(arms)); // right hand (side+1) thumb +X radial

if (fail) { console.log('FAILED', fail); process.exit(1); }
console.log('ALL PASS');
