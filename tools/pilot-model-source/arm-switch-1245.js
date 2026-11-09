/* v1.2.45: switch the Scottish character GLB arm meshes (cream linen sleeve +
 * skin hand with finger bones) onto the existing __fpa / mcArm / fist animation
 * pivots. Box meshes become invisible drivers only — every swing / place /
 * reload / gun / swim timing still comes from the live __fpa step. */
(function armSwitch1245(W) {
  'use strict';
  const T = W.THREE || (typeof THREE !== 'undefined' ? THREE : null);
  const U = W.__armSwitch1245 = W.__armSwitch1245 || {version: '1.2.45', err: null, on: 0};
  if (!T) { U.err = 'no THREE'; return; }
  const V = () => new T.Vector3(), Q = () => new T.Quaternion(), M4 = () => new T.Matrix4();
  const find = (r, n) => r && (r.getObjectByName(n) || (T.PropertyBinding && r.getObjectByName(T.PropertyBinding.sanitizeNodeName(n))));

  // Closed-finger curl amounts per digit (proximal, distal), radians.
  U.GRIP = {
    empty:  [0.15, 0.1],
    tool:   [1.05, 0.95],   // pickaxe/axe/shovel/hoe/sword/torch
    bucket: [0.85, 0.7],
    map:    [0.55, 0.4],
    food:   [0.7, 0.55],
    pistol: [0.95, 0.75],
    musket: [1.0, 0.85],
    swim:   [0.35, 0.25]
  };

  function isArmMesh(o) {
    for (let p = o; p; p = p.parent) {
      const n = p.name || '';
      if (/^visual_arm_slot[01]_hand/.test(n)) return 'arm';
      if (/^gear_chest_slot[01]/.test(n)) return 'gear';
    }
    return null;
  }

  U.buildFromTemplate = function (template) {
    if (!template) return null;
    const src = template.scene || template.root || template;
    const clone = (T.SkeletonUtils && T.SkeletonUtils.clone) ? T.SkeletonUtils.clone(src) : src.clone(true);
    clone.name = 'ArmSwitch1245';
    clone.traverse(o => {
      o.matrixAutoUpdate = true;
      if (o.isMesh || o.isSkinnedMesh) {
        const kind = isArmMesh(o);
        o.visible = kind === 'arm'; // sleeve+skin hands only; armour gauntlets toggled later
        o.frustumCulled = false;
        o.castShadow = false;
        o.receiveShadow = false;
        o.renderOrder = 3;
        if (o.material) {
          const mats = [].concat(o.material);
          o.material = mats.map(m => {
            if (!m) return m;
            const c = m.clone();
            c.depthTest = true; c.depthWrite = true;
            // Keep authored maps (linen / skin)
            return c;
          });
          if (!Array.isArray(o.material) && o.material.length === 1) o.material = o.material[0];
          else if (Array.isArray(o.material) && mats.length === 1) o.material = o.material[0];
        }
      }
    });
    const bones = {};
    clone.traverse(o => {
      if (o.isBone || (o.name && /^(clavicle|upper_arm|forearm|hand|finger|thumb|weapon_grip)/.test(o.name))) bones[o.name] = o;
    });
    clone.userData.bones = bones;
    clone.userData.bone = n => bones[n] || find(clone, n);
    // Phone-friendly first-person scale: slightly smaller so arms don't fill 9:20.
    clone.scale.setScalar(0.92);
    return clone;
  };

  function hideDriverMeshes(rig) {
    if (!rig) return;
    rig.traverse(o => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.visible = false;
        o.userData.armSwitchHid = 1;
      }
    });
  }

  function hideLegacyBoxes() {
    try {
      if (typeof fist !== 'undefined' && fist) { fist.visible = false; fist.userData.armSwitchHid = 1; }
      if (typeof armMesh !== 'undefined' && armMesh) { armMesh.visible = false; armMesh.userData.armSwitchHid = 1; }
      if (W.mcArm) W.mcArm.traverse(o => { if (o.isMesh) { o.visible = false; o.userData.armSwitchHid = 1; } });
    } catch (_) {}
  }

  // Copy a driver object's world transform onto a bone (local to its parent).
  function boneFollow(bone, driver) {
    if (!bone || !driver) return;
    driver.updateWorldMatrix(true, false);
    const pw = bone.parent ? bone.parent.matrixWorld : M4().identity();
    const inv = M4().copy(pw).invert();
    const world = M4().copy(driver.matrixWorld);
    const local = M4().multiplyMatrices(inv, world);
    local.decompose(bone.position, bone.quaternion, bone.scale);
    bone.updateMatrix();
  }

  function curlFingers(bone, side /* 'R'|'L' */, curl, thumbCurl) {
    // finger{S}{digit}{01|02} — 01 proximal, 02 distal. Axis is typically X or Z depending on bind.
    const s = side;
    for (let d = 0; d < 4; d++) {
      const prox = bone('finger' + s + d + '01');
      const dist = bone('finger' + s + d + '02');
      const c0 = curl[0], c1 = curl[1];
      if (prox) { prox.rotation.x = c0; prox.rotation.z = (s === 'R' ? -1 : 1) * 0.04 * (d - 1.5); }
      if (dist) { dist.rotation.x = c1; }
    }
  }

  function gripClass(kind, id) {
    if (kind === 'swim') return 'swim';
    if (kind === 'map') return 'map';
    if (kind === 'pistol') return 'pistol';
    if (kind === 'musket') return 'musket';
    if (kind === 'bucket') return 'bucket';
    if (kind === 'drink' || kind === 'food') return 'food';
    if (!kind || kind === 'empty') return 'empty';
    return 'tool';
  }

  U.syncFromFpa = function (dt) {
    const fpa = W.__fpa;
    const cam = (typeof camera !== 'undefined') ? camera : W.camera;
    if (!cam || !fpa) return;
    const runtime = W.__pilot1235;
    if (!runtime || !runtime.templates || !runtime.templates[0]) return;
    const H = W.__held1240;

    let fp = cam.getObjectByName('ArmSwitch1245');
    if (!fp) {
      fp = U.buildFromTemplate(runtime.templates[0]);
      if (!fp) return;
      // Face the camera look (-Z), skull near camera; same convention as Held1240FpArms.
      fp.position.set(0, -1.35, 0.02);
      fp.rotation.set(0, Math.PI, 0);
      fp.scale.setScalar(0.95);
      cam.add(fp);
      U.fp = fp;
    }

    try {
      const old = cam.getObjectByName('Held1240FpArms');
      if (old) { old.visible = false; old.traverse(o => { if (o.isMesh || o.isSkinnedMesh) o.visible = false; }); }
    } catch (_) {}

    const rig = fpa.rig && fpa.rig();
    if (!rig || !rig.visible) { fp.visible = false; U.on = 0; return; }
    if (typeof camMode !== 'undefined' && camMode !== 0) { fp.visible = false; U.on = 0; return; }
    if (typeof started !== 'undefined' && !started) { fp.visible = false; U.on = 0; return; }

    hideDriverMeshes(rig);
    hideLegacyBoxes();
    fp.visible = true;
    U.on = 1;

    // Attach Scottish arm bones to the live __fpa pivots (up / fo / h):
    // 1) slide the clone so the shoulder bone sits on the __fpa arm root,
    // 2) aim upper→fore→hand along the driver joint chain (same timings/poses).
    function camLocal(obj) {
      return cam.worldToLocal(obj.getWorldPosition(V()));
    }
    const bone = fp.userData.bone;
    const Rarm = rig.userData.R, Larm = rig.userData.L;
    const showL = !!(Larm && Larm.visible);
    const targets = {R: null, L: null};

    // On tall phone aspects, pull joints toward the view center so cream
    // sleeves stay on-screen (game cam is FOV 70 / 9:20 on Android).
    const portrait = (cam.aspect || 1) < 0.75;
    function frameJoint(v) {
      if (!portrait) return v;
      v.x *= 0.5;
      v.y = v.y * 0.9 - 0.03;
      return v;
    }

    try {
      // Align shoulders to __fpa arm roots so limb length can reach the hands.
      fp.updateMatrixWorld(true);
      const uR = bone('upper_armR') || bone('upper_arm.R');
      if (uR && Rarm) {
        const now = camLocal(uR);
        const want = frameJoint(camLocal(Rarm));
        fp.position.x += (want.x - now.x) * 0.9;
        fp.position.y += (want.y - now.y);
        fp.position.z += (want.z - now.z);
        fp.updateMatrixWorld(true);
      }
    } catch (_) {}

    try {
      if (Rarm && Rarm.userData && Rarm.userData.p) {
        const p = Rarm.userData.p;
        targets.R = {
          shoulder: frameJoint(camLocal(Rarm)),
          elbow: frameJoint(camLocal(p.el || p.fo || p.up)),
          wrist: frameJoint(camLocal(p.h))
        };
      }
      if (showL && Larm && Larm.userData && Larm.userData.p) {
        const p = Larm.userData.p;
        targets.L = {
          shoulder: frameJoint(camLocal(Larm)),
          elbow: frameJoint(camLocal(p.el || p.fo || p.up)),
          wrist: frameJoint(camLocal(p.h))
        };
      }
    } catch (_) {}

    // Two-bone aim along driver joints. Limb lengths match __fpa LU/LF.
    try {
      const sc = fp.scale.x || 1;
      const L1 = 0.38 * sc, L2 = 0.36 * sc;
      function aim(b, fromPt, toPt) {
        if (!b || !b.parent) return;
        const d = toPt.clone().sub(fromPt); if (d.lengthSq() < 1e-10) return;
        d.normalize();
        b.parent.updateWorldMatrix(true, false);
        const q = Q().setFromUnitVectors(new T.Vector3(0, 1, 0), d);
        b.quaternion.copy(b.parent.getWorldQuaternion(Q()).invert().multiply(q));
        b.updateMatrix();
      }
      function drive(side, t) {
        if (!t) return;
        const upper = bone('upper_arm' + side) || bone('upper_arm.' + side);
        const fore = bone('forearm' + side) || bone('forearm.' + side);
        const hand = bone('hand' + side) || bone('hand.' + side);
        if (!upper || !fore) return;
        fp.updateMatrixWorld(true);
        const start = upper.getWorldPosition(V());
        const elbowHint = V().copy(t.elbow); if (fp.parent) elbowHint.applyMatrix4(fp.parent.matrixWorld);
        const wristGoal = V().copy(t.wrist); if (fp.parent) wristGoal.applyMatrix4(fp.parent.matrixWorld);
        const toWrist = wristGoal.clone().sub(start);
        const dist = Math.min(Math.max(toWrist.length(), 0.05), L1 + L2 - 0.01);
        const dir = toWrist.lengthSq() > 1e-10 ? toWrist.normalize() : V().set(0, 0, -1);
        let pole = elbowHint.clone().sub(start);
        pole.addScaledVector(dir, -pole.dot(dir));
        if (pole.lengthSq() < 1e-6) pole.set(side === 'R' ? -0.25 : 0.25, -1, -0.1);
        else pole.normalize();
        const ca = Math.max(-1, Math.min(1, (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist)));
        const sa = Math.sqrt(Math.max(0, 1 - ca * ca));
        const elbow = start.clone().addScaledVector(dir, L1 * ca).addScaledVector(pole, L1 * sa);
        // Real __fpa puts el on the IK elbow — blend when the hint is a true mid-limb joint.
        if (elbowHint.distanceTo(start) > 0.12) elbow.lerp(elbowHint, 0.55);
        aim(upper, start, elbow);
        upper.updateWorldMatrix(true, true);
        const elbowNow = fore.getWorldPosition(V());
        aim(fore, elbowNow, wristGoal);
        fore.updateWorldMatrix(true, true);
        if (hand) {
          const ahead = wristGoal.clone().addScaledVector(dir, 0.05);
          aim(hand, hand.getWorldPosition(V()), ahead);
        }
      }
      drive('R', targets.R);
      if (showL) drive('L', targets.L);
    } catch (e) { if (!U.err) U.err = 'ik: ' + (e && e.message || e); }

    // Grip class + finger curl on GLB finger bones
    let kind = 'empty';
    try {
      if (W.__swimHide || (typeof swimDeep !== 'undefined' && swimDeep && !camMode)) kind = 'swim';
      else if (typeof held !== 'undefined' && held && held.children[0] && H && H.kindOf) {
        kind = H.kindOf(held.children[0], typeof heldId !== 'undefined' ? heldId : null);
      }
    } catch (_) {}
    const gclass = gripClass(kind);
    const curl = U.GRIP[gclass] || U.GRIP.tool;
    try {
      curlFingers(bone, 'R', curl);
      if (targets.L) curlFingers(bone, 'L', (gclass === 'musket' || gclass === 'pistol' || gclass === 'map') ? curl : U.GRIP.empty);
    } catch (e) { if (!U.err) U.err = 'curl: ' + (e && e.message || e); }

    // Match side visibility to __fpa drivers (don't leave bind-pose opposite arm on screen).
    try {
      fp.traverse(o => {
        if (!(o.isMesh || o.isSkinnedMesh)) return;
        const n = o.name || '';
        if (/GLOVE_\|_L_/.test(n) || /visual_arm_slot1/.test(n)) o.visible = showL;
        if (/GLOVE_\|_R_/.test(n) || /visual_arm_slot0/.test(n)) o.visible = true;
      });
    } catch (_) {}

    try {
      fp.traverse(o => { if (o.isSkinnedMesh && o.skeleton) o.skeleton.update(); });
    } catch (_) {}
    fp.updateMatrixWorld(true);

    // Snap held to weapon grip socket (contact).
    try {
      const sock = bone('weapon_grip_slot0') || bone('weapon_grip_slot1') || bone('handR');
      if (sock && typeof held !== 'undefined' && held && held.parent) {
        sock.updateWorldMatrix(true, true);
        held.parent.updateWorldMatrix(true, false);
        const inv = M4().copy(held.parent.matrixWorld).invert();
        const local = M4().multiplyMatrices(inv, sock.matrixWorld);
        const p = V(), q = Q(), s = V();
        local.decompose(p, q, s);
        const dist = held.position.distanceTo(p);
        const k = dist > 0.05 ? 1 : Math.min(1, (dt || 0.016) * 18);
        held.position.lerp(p, k);
        held.quaternion.slerp(q, k);
      }
    } catch (e) { if (!U.err) U.err = 'heldSnap: ' + (e && e.message || e); }

    U.kind = kind;
    U.gclass = gclass;
  };

  U.install = function () {
    if (U._hooked) return U;
    U._hooked = 1;
    try {
      const wrap = (fn) => {
        const prev = fn;
        return function (dt) {
          const r = prev.apply(this, arguments);
          try { U.syncFromFpa(typeof dt === 'number' ? dt : 0.016); } catch (e) { if (!U.err) U.err = String(e && e.message || e); }
          return r;
        };
      };
      if (typeof updateHand === 'function') updateHand = wrap(updateHand);
    } catch (e) { U.err = 'install: ' + e; }
    // Also tick after __fpa if present
    try {
      if (W.__fpa && typeof W.__fpa.step === 'function' && !W.__fpa.__armSwitchWrapped) {
        const prev = W.__fpa.step.bind(W.__fpa);
        W.__fpa.step = function (dt) {
          const r = prev(dt);
          try { U.syncFromFpa(dt); } catch (e) { if (!U.err) U.err = String(e && e.message || e); }
          return r;
        };
        W.__fpa.__armSwitchWrapped = 1;
      }
    } catch (_) {}
    return U;
  };

  // Auto-install when runtime is ready; otherwise tests call U.install().
  try {
    if (W.__pilot1235) U.install();
    else {
      const t = setInterval(() => {
        if (W.__pilot1235) { clearInterval(t); try { U.install(); } catch (_) {} }
      }, 200);
      setTimeout(() => clearInterval(t), 30000);
    }
  } catch (_) {}
})(typeof window !== 'undefined' ? window : this);
