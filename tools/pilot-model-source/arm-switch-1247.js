/* v1.2.47: switch the Scottish character GLB arm meshes (cream linen sleeve +
 * skin hand) onto the existing __fpa / mcArm / fist animation pivots.
 * Box meshes become invisible drivers only — swing, place, reload, gun and
 * swim timings, plus the proven 1.2.27 three-joint finger curls, 1.2.24 /
 * 42d5925 rifle-bolt / pistol-wrist caps, and 1.2.40 shortest-path reload
 * slerp, all stay on __fpa. Held items stay parented where __fpa / __vm put
 * them (no snap-to-socket feedback loop).
 *
 * The 1.2.45 clone put the full bind-pose body in the first-person camera
 * (stomach in view, grey clipped texture, arms and tools hidden). This
 * build PHYSICALLY REMOVES every non-arm mesh (torso, kilt, head, pack,
 * legs) so the body can never appear in first person. */
(function armSwitch1247(W) {
  'use strict';
  const T = W.THREE || (typeof THREE !== 'undefined' ? THREE : null);
  const U = W.__armSwitch1247 = W.__armSwitch1247 || {version: '1.2.47', err: null, on: 0};
  U.version = '1.2.47';
  // After world-retarget spikes and bind-local+rotateX mittens/claws, default
  // to the user's literal ask: paint the new skin and cream linen onto the
  // proven 1.2.46 procedural __fpa arms so animations never reset. Set
  // U.hybrid = 0 to review the GLB-mesh path again.
  if (U.hybrid == null) U.hybrid = 1;
  if (!T) { U.err = 'no THREE'; return; }
  const _v1 = new T.Vector3(), _v2 = new T.Vector3();
  const _m1 = new T.Matrix4(), _m2 = new T.Matrix4();
  const _s = new T.Vector3();
  const Y_UP = new T.Vector3(0, 1, 0);
  const find = (r, n) => r && (r.getObjectByName(n) || (T.PropertyBinding && r.getObjectByName(T.PropertyBinding.sanitizeNodeName(n))));

  function isArmRegion(o) {
    for (let p = o; p; p = p.parent) {
      const n = p.name || '';
      if (/^visual_arm_slot[01]_hand/.test(n)) return 'arm';
      if (/^gear_chest_slot[01]/.test(n)) return 'gear';
      if (o.userData && o.userData.armSwitchSleeve) return 'sleeve';
      if (/^ArmSwitchSleeve/.test(n)) return 'sleeve';
    }
    return null;
  }

  function aliasBoneName(name) {
    if (!name) return [];
    const out = [name];
    if (T.PropertyBinding && T.PropertyBinding.sanitizeNodeName)
      out.push(T.PropertyBinding.sanitizeNodeName(name));
    out.push(name.replace(/[.\s]/g, ''));
    const finger = name.match(/^finger[._]?([RL])[._]?(\d)[._]?0?(\d)$/i);
    if (finger) {
      const s = finger[1].toUpperCase(), d = finger[2], j = finger[3];
      out.push('finger' + s + d + '0' + j, 'finger.' + s + '.' + d + '.0' + j);
    }
    const thumb = name.match(/^thumb[._]?([RL])[._]?0?(\d)$/i);
    if (thumb) {
      const s = thumb[1].toUpperCase(), j = thumb[2];
      out.push('thumb' + s + '0' + j, 'thumb.' + s + '.0' + j);
    }
    const limb = name.match(/^(clavicle|upper_arm|forearm|hand)[._]?([RL])$/i);
    if (limb) out.push(limb[1] + limb[2].toUpperCase(), limb[1] + '.' + limb[2].toUpperCase());
    return out;
  }
  function registerBone(bones, o) {
    if (!o || !o.name) return;
    for (const n of aliasBoneName(o.name)) bones[n] = o;
  }
  function getBone(bones, name) {
    if (!bones) return null;
    for (const n of aliasBoneName(name)) if (bones[n]) return bones[n];
    return null;
  }
  function boneMap(root) {
    const bones = {};
    root.traverse(o => {
      if (o.isBone || (o.name && /^(clavicle|upper_arm|forearm|hand|finger|thumb|weapon_grip|palm_center)/.test(o.name)))
        registerBone(bones, o);
    });
    return bones;
  }

  function lookY(from, to, outQ) {
    const d = _v1.copy(to).sub(from);
    if (d.lengthSq() < 1e-10) { outQ.identity(); return outQ; }
    d.normalize();
    return outQ.setFromUnitVectors(Y_UP, d);
  }

  function frameAt(pos, quat, outM) {
    return outM.compose(pos, quat, _v2.set(1, 1, 1));
  }

  function applyWorld(bone, worldMat) {
    if (!bone) return;
    if (!bone.parent) { worldMat.decompose(bone.position, bone.quaternion, _s); bone.updateMatrix(); return; }
    bone.parent.updateWorldMatrix(true, false);
    const local = _m1.copy(bone.parent.matrixWorld).invert().multiply(worldMat);
    local.decompose(bone.position, bone.quaternion, _s);
    bone.updateMatrix();
  }

  function vertsWeight(geo, i, idxSet) {
    const si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
    if (!si || !sw) return 0;
    const n = si.itemSize || 4, ia = si.array, wa = sw.array;
    let w = 0;
    for (let k = 0; k < n; k++) {
      if (idxSet.has(ia[i * n + k])) w += wa[i * n + k];
    }
    return w;
  }

  function renormalizeArmWeights(geo, armIdx) {
    const si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
    if (!si || !sw) return;
    const n = si.itemSize || 4, ia = si.array, wa = sw.array, count = si.count;
    let fallback = 0;
    armIdx.forEach(i => { if (fallback === 0) fallback = i; });
    for (let i = 0; i < count; i++) {
      let sum = 0, firstArm = -1;
      for (let k = 0; k < n; k++) {
        const bi = ia[i * n + k];
        if (armIdx.has(bi)) {
          if (firstArm < 0) firstArm = k;
          sum += wa[i * n + k];
        } else {
          wa[i * n + k] = 0;
        }
      }
      if (sum < 1e-5) {
        for (let k = 0; k < n; k++) wa[i * n + k] = 0;
        ia[i * n] = firstArm >= 0 ? ia[i * n + firstArm] : fallback;
        wa[i * n] = 1;
      } else {
        const inv = 1 / sum;
        for (let k = 0; k < n; k++) wa[i * n + k] *= inv;
      }
    }
    sw.needsUpdate = true;
  }

  function boneIndexSet(skel, re) {
    const set = new Set();
    if (!skel) return set;
    skel.bones.forEach((b, i) => { if (re.test(b.name || '')) set.add(i); });
    return set;
  }

  function hardenMat(m, skinned) {
    if (!m) return m;
    const map = m.map || null;
    const color = m.color ? m.color.clone() : new T.Color(0xffffff);
    const c = new T.MeshPhongMaterial({
      color: color,
      map: map,
      specular: new T.Color(0x222222),
      shininess: 18,
      skinning: !!skinned,
      morphTargets: !!m.morphTargets,
      transparent: !!m.transparent,
      opacity: m.opacity == null ? 1 : m.opacity,
      side: m.side != null ? m.side : T.FrontSide,
      depthTest: true,
      depthWrite: true,
      alphaTest: m.alphaTest || 0
    });
    if (m.alphaMap) c.alphaMap = m.alphaMap;
    c.name = m.name || '';
    c.needsUpdate = true;
    return c;
  }

  function hardenMesh(o) {
    if (!(o.isMesh || o.isSkinnedMesh) || !o.material) return;
    const skinned = !!o.isSkinnedMesh;
    const mats = [].concat(o.material).map(m => hardenMat(m, skinned));
    o.material = mats.length === 1 ? mats[0] : mats;
    o.frustumCulled = false;
    if (o.isSkinnedMesh) o.bindMode = 'attached';
  }

  function extractSleeve(srcMesh, armIdx, thresh) {

    const geo = srcMesh.geometry;
    if (!geo || !geo.attributes || !geo.attributes.position) return null;
    const pos = geo.attributes.position;
    const count = pos.count;
    const keepVert = new Uint8Array(count);
    let keptV = 0;
    for (let i = 0; i < count; i++) {
      if (vertsWeight(geo, i, armIdx) >= thresh) { keepVert[i] = 1; keptV++; }
    }
    if (keptV < 24) return null;
    const index = geo.index ? geo.index.array : null;
    const triCount = index ? (index.length / 3) : (count / 3);
    const keepTri = [];
    for (let t = 0; t < triCount; t++) {
      const a = index ? index[t * 3] : t * 3;
      const b = index ? index[t * 3 + 1] : t * 3 + 1;
      const c = index ? index[t * 3 + 2] : t * 3 + 2;
      const hits = (keepVert[a] ? 1 : 0) + (keepVert[b] ? 1 : 0) + (keepVert[c] ? 1 : 0);
      if (hits >= 2) keepTri.push(a, b, c);
    }
    if (keepTri.length < 36) return null;
    const map = new Map();
    const used = [];
    for (let i = 0; i < keepTri.length; i++) {
      const old = keepTri[i];
      if (!map.has(old)) { map.set(old, used.length); used.push(old); }
      keepTri[i] = map.get(old);
    }
    const dst = geo.clone();
    function remapAttr(name) {
      const attr = geo.attributes[name];
      if (!attr) return;
      const item = attr.itemSize, Arr = attr.array.constructor;
      const out = new Arr(used.length * item);
      for (let i = 0; i < used.length; i++) {
        for (let k = 0; k < item; k++) out[i * item + k] = attr.array[used[i] * item + k];
      }
      dst.setAttribute(name, new T.BufferAttribute(out, item, attr.normalized));
    }
    Object.keys(geo.attributes).forEach(remapAttr);
    dst.setIndex(new T.BufferAttribute(new (keepTri.length > 65535 ? Uint32Array : Uint16Array)(keepTri), 1));
    try { dst.computeVertexNormals(); } catch (_) {}
    const mesh = srcMesh.clone();
    mesh.geometry = dst;
    // Keep the authored linen map — never a flat grey.
    if (srcMesh.material) {
      hardenMesh(mesh);
    }
    if (srcMesh.isSkinnedMesh && srcMesh.skeleton) {
      try { mesh.bind(srcMesh.skeleton, srcMesh.bindMatrix && srcMesh.bindMatrix.clone ? srcMesh.bindMatrix.clone() : srcMesh.bindMatrix); } catch (_) {}
    }
    // Residual spine/root weights pull sleeve verts back to the un-retargeted
    // bind torso and tear a floating sheet. Keep only the arm-chain weights.
    try { if (armIdx && mesh.geometry) renormalizeArmWeights(mesh.geometry, armIdx); } catch (_) {}
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.renderOrder = 3;
    mesh.visible = true;
    mesh.userData.armSwitchSleeve = 1;
    return mesh;
  }

  function captureBind(fp) {
    fp.updateMatrixWorld(true);
    const bones = fp.userData.bones;
    const bind = {}, drivers = {}, Toff = {};
    function wp(o, t) { return o.getWorldPosition(t || new T.Vector3()); }
    function recordDriver(key, from, to) {
      const p = wp(from, new T.Vector3());
      const q = new T.Quaternion();
      if (to) lookY(p, wp(to, new T.Vector3()), q);
      else from.getWorldQuaternion(q);
      const m = new T.Matrix4();
      frameAt(p, q, m);
      drivers[key] = m;
    }
    function recordBone(name) {
      const b = getBone(bones, name);
      if (!b) return;
      bind[name] = new T.Matrix4().copy(b.matrixWorld);
    }
    function off(boneName, driverKey) {
      if (!bind[boneName] || !drivers[driverKey]) return;
      Toff[boneName] = new T.Matrix4().copy(drivers[driverKey]).invert().multiply(bind[boneName]);
    }
    for (const side of ['R', 'L']) {
      const u = getBone(bones, 'upper_arm' + side), f = getBone(bones, 'forearm' + side), h = getBone(bones, 'hand' + side);
      const cl = getBone(bones, 'clavicle' + side);
      if (u && f) recordDriver('upper' + side, u, f);
      if (f && h) recordDriver('fore' + side, f, h);
      if (h) {
        const mid = bones['finger' + side + '201'] || bones['finger' + side + '101'];
        recordDriver('hand' + side, h, mid || null);
      }
      if (cl && u) recordDriver('clav' + side, cl, u);
      ['clavicle', 'upper_arm', 'forearm', 'hand'].forEach(n => recordBone(n + side));
      recordBone('weapon_grip_slot' + (side === 'R' ? '0' : '1'));
      for (let d = 0; d < 4; d++) {
        const p1 = getBone(bones, 'finger' + side + d + '01');
        const p2 = getBone(bones, 'finger' + side + d + '02');
        if (p1 && p2) recordDriver('finger' + side + d + '01', p1, p2);
        else if (p1) recordDriver('finger' + side + d + '01', p1, null);
        if (p2) recordDriver('finger' + side + d + '02', p2, null);
        recordBone('finger' + side + d + '01');
        recordBone('finger' + side + d + '02');
        off('finger' + side + d + '01', 'finger' + side + d + '01');
        off('finger' + side + d + '02', 'finger' + side + d + '02');
      }
      const t1 = getBone(bones, 'thumb' + side + '01'), t2 = getBone(bones, 'thumb' + side + '02');
      if (t1 && t2) recordDriver('thumb' + side + '01', t1, t2);
      else if (t1) recordDriver('thumb' + side + '01', t1, null);
      if (t2) recordDriver('thumb' + side + '02', t2, null);
      recordBone('thumb' + side + '01');
      recordBone('thumb' + side + '02');
      off('clavicle' + side, 'clav' + side);
      off('upper_arm' + side, 'upper' + side);
      off('forearm' + side, 'fore' + side);
      off('hand' + side, 'hand' + side);
      off('thumb' + side + '01', 'thumb' + side + '01');
      off('thumb' + side + '02', 'thumb' + side + '02');
    }
    // Bind-local finger / thumb poses (the GLB's own rest). Curl is applied
    // around each bone's local +X, which in this rig is toward the palm.
    const bindLocal = {};
    function recordLocal(name) {
      const b = getBone(bones, name);
      if (!b) return;
      bindLocal[name] = {
        pos: b.position.clone(),
        quat: b.quaternion.clone(),
        scale: b.scale.clone()
      };
    }
    for (const side of ['R', 'L']) {
      for (let d = 0; d < 4; d++) {
        recordLocal('finger' + side + d + '01');
        recordLocal('finger' + side + d + '02');
      }
      recordLocal('thumb' + side + '01');
      recordLocal('thumb' + side + '02');
    }
    fp.userData.bindLocal = bindLocal;
    fp.userData.bind = bind;
    fp.userData.drivers = drivers;
    fp.userData.Toff = Toff;
    const uR = getBone(bones, 'upper_armR'), fR = getBone(bones, 'forearmR'), hR = getBone(bones, 'handR');
    let glen = 0.47;
    if (uR && fR && hR) glen = wp(uR).distanceTo(wp(fR)) + wp(fR).distanceTo(wp(hR));
    fp.userData.glbArmLen = glen;
    return {bind, drivers, Toff, glen};
  }

  function stripBody(clone) {
    const doomed = [];
    clone.traverse(o => {
      if (!(o.isMesh || o.isSkinnedMesh)) return;
      const kind = isArmRegion(o);
      if (kind === 'arm' || kind === 'sleeve' || kind === 'gear' || o.userData.armSwitchSleeve) return;
      doomed.push(o);
    });
    for (const o of doomed) {
      try { if (o.parent) o.parent.remove(o); } catch (_) {}
      o.visible = false;
      o.userData.armSwitchStripped = 1;
    }
    U.stripped = doomed.length;
    return doomed.length;
  }

  U.buildFromTemplate = function (template) {
    if (!template) return null;
    const src = template.scene || template.root || template;
    const clone = (T.SkeletonUtils && T.SkeletonUtils.clone) ? T.SkeletonUtils.clone(src) : src.clone(true);
    clone.name = 'ArmSwitch1247';
    clone.userData.armSwitchVer = '1.2.47';
    const bones = boneMap(clone);
    clone.userData.bones = bones;
    clone.userData.bone = n => bones[n] || find(clone, n);

    clone.traverse(o => {
      o.matrixAutoUpdate = true;
      if (o.isMesh || o.isSkinnedMesh) {
        o.visible = false;
        o.frustumCulled = false;
        o.castShadow = false;
        o.receiveShadow = false;
        o.renderOrder = 3;
        if (o.isSkinnedMesh) o.bindMode = 'attached';
        if (o.material) hardenMesh(o); // Phong + authored maps; Standard fails on SwiftShader
      }
    });

    clone.traverse(o => {
      if ((o.isMesh || o.isSkinnedMesh) && isArmRegion(o) === 'arm') o.visible = true;
    });

    // Cream linen upper sleeves: extract per side from the torso outfit,
    // dropping any vertex that still carries spine/pelvis weight so the
    // stomach cannot leak. The glove mesh already carries the cuff.
    const sleeves = [];
    clone.traverse(o => {
      if (!(o.isSkinnedMesh && o.skeleton)) return;
      const n = (o.name || '') + ' ' + ((o.parent && o.parent.name) || '');
      if (!/visual_torso_outfit/.test(n)) return;
      const mats = [].concat(o.material || []);
      const linen = mats.some(m => m && /Linen|eee6d6|shirt|cloth/i.test((m.name || '') + (o.name || '')));
      const cream = mats.some(m => {
        if (!m || !m.color) return false;
        const c = m.color;
        return (m.map && c.r > 0.9) || (c.r > 0.7 && c.g > 0.65 && c.b > 0.5);
      });
      if (!(linen || cream || /torso_outfit/.test(o.name || ''))) return;
      const torsoIdx = boneIndexSet(o.skeleton, /^(spine|pelvis|root|thigh|neck|head)/);
      for (const side of ['R', 'L']) {
        const sleeveIdx = boneIndexSet(o.skeleton, new RegExp('^(clavicle|upper_arm|forearm)[._]?' + side + '$'));
        const sleeve = extractSleeve(o, sleeveIdx, 0.48);
        if (!sleeve) continue;
        // Drop leftover torso-weighted verts instead of rejecting the sleeve.
        const geo = sleeve.geometry, pos = geo.attributes.position, idx = geo.index && geo.index.array;
        if (pos && idx) {
          const keepTri = [];
          for (let t = 0; t < idx.length; t += 3) {
            const a = idx[t], b = idx[t + 1], c = idx[t + 2];
            const tw = Math.max(vertsWeight(geo, a, torsoIdx), vertsWeight(geo, b, torsoIdx), vertsWeight(geo, c, torsoIdx));
            if (tw < 0.22) keepTri.push(a, b, c);
          }
          if (keepTri.length >= 36) {
            const ia = keepTri.length > 65535 ? Uint32Array : Uint16Array;
            geo.setIndex(new T.BufferAttribute(new ia(keepTri), 1));
            try { geo.computeVertexNormals(); } catch (_) {}
          } else {
            try { if (sleeve.parent) sleeve.parent.remove(sleeve); } catch (_) {}
            continue;
          }
        }
        sleeve.visible = true;
        sleeve.userData.armSwitchSleeve = 1;
        sleeve.userData.armSwitchSide = side;
        o.parent.add(sleeve);
        sleeves.push(sleeve);
      }
    });
    sleeves.forEach((sl, i) => { sl.name = 'ArmSwitchSleeve' + i; });
    clone.userData.sleeves = sleeves;

    stripBody(clone);

    captureBind(clone);
    clone.scale.set(1, 1, 1);
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    return clone;
  };

  function hideDriverMeshes(rig) {
    if (!rig) return;
    const hybrid = U.hybrid !== 0;
    rig.traverse(o => {
      if (!(o.isMesh || o.isSkinnedMesh)) return;
      if (hybrid) {
        o.visible = true;
        o.userData.armSwitchKeep = 1;
        o.userData.armSwitchHid = 0;
        return;
      }
      if (o.userData && o.userData.armSwitchKeep) return;
      o.visible = false;
      o.userData.armSwitchHid = 1;
    });
  }
  function under(o, ancestor) {
    if (!ancestor) return false;
    for (let p = o; p; p = p.parent) if (p === ancestor) return true;
    return false;
  }
  function hideObj(o) {
    if (!o) return;
    o.visible = false;
    o.userData && (o.userData.armSwitchHid = 1);
    if (o.traverse) o.traverse(c => {
      if (c.isMesh || c.isSkinnedMesh) { c.visible = false; c.userData.armSwitchHid = 1; }
    });
  }
  // The game keeps doing fist.visible = true on the empty hand (and again in
  // render). Pin the leftover box palm and classic arm mesh hidden so they
  // cannot come back over the painted procedural fist.
  function pinHidden(o) {
    if (!o || o.userData && o.userData.armSwitchPinned) return;
    try {
      if (o.userData) { o.userData.armSwitchHid = 1; o.userData.armSwitchPinned = 1; }
      o.visible = false;
      try { o.scale.set(0, 0, 0); } catch (_) {}
      try { if (o.parent) o.parent.remove(o); } catch (_) {}
    } catch (_) { try { o.visible = false; } catch (e) {} }
  }
  function posePistolTrigger() {
    try {
      const held = (W.__fpLegacy && W.__fpLegacy.held) || (typeof W.held !== 'undefined' ? W.held : null);
      const mesh = held && held.children && held.children[0];
      const isP = !!(mesh && mesh.userData && (mesh.userData.gun === 212 || mesh.userData.pistol));
      if (!isP) return;
      const rig = W.__fpa && W.__fpa.rig && W.__fpa.rig();
      const h = rig && rig.userData && rig.userData.R && rig.userData.R.userData && rig.userData.R.userData.p && rig.userData.R.userData.p.h;
      const fingers = h && h.userData && h.userData.f;
      if (!fingers || !fingers[0]) return;
      // Index (digit 0) stays extended along the trigger; the other three wrap the grip.
      const ix = fingers[0];
      ix[0].rotation.x = 0.22;
      ix[1].rotation.x = 0.16;
      if (ix[1].userData && ix[1].userData.d) ix[1].userData.d.rotation.x = 0.06;
      ix[0].updateMatrix(); ix[1].updateMatrix();
    } catch (_) {}
  }
  function findGripHand() {
    const L = W.__fpLegacy || {};
    if (L.gripHand && L.gripHand.parent) return L.gripHand;
    if (W.gripHand && W.gripHand.parent) return W.gripHand;
    const ap = L.armPivot || W.armPivot;
    if (!ap || !ap.traverse) return L.gripHand || W.gripHand || null;
    let found = null;
    ap.traverse(o => {
      if (found || !o.children || o.children.length < 4) return;
      let tubes = 0, box = 0;
      for (const c of o.children) {
        const typ = c.geometry && c.geometry.type;
        if (typ === 'TubeGeometry') tubes++;
        if (typ === 'BoxGeometry') box++;
      }
      if (tubes >= 3 && box >= 1) found = o;
    });
    return found || L.gripHand || W.gripHand || null;
  }
  function hideLegacyBoxes() {
    try {
      const L = W.__fpLegacy || {};
      const gh = findGripHand();
      if (gh) {
        L.gripHand = gh;
        try { if (W.__fpLegacy) W.__fpLegacy.gripHand = gh; } catch (_) {}
      }
      pinHidden(L.fist);
      pinHidden(L.armMesh);
      hideObj(gh);
      hideObj(W.mcArm || L.mcArm);
      // 1.2.47 unparented the dirt-box fist; if it was left in the scene it
      // still draws under the wrist. Hide any orphan fist-sized box.
      try {
        const sc = (typeof scene !== 'undefined') ? scene : W.scene;
        const fist = L.fist;
        if (fist && (!fist.parent || fist.parent === sc)) pinHidden(fist);
        if (sc && sc.traverse) {
          sc.traverse(o => {
            if (!o.isMesh || !o.geometry || o.geometry.type !== 'BoxGeometry') return;
            if (under(o, held)) return;
            const pms = o.geometry.parameters;
            if (pms && Math.abs((pms.width || 0) - 0.14) < 0.02 && Math.abs((pms.height || 0) - 0.14) < 0.02)
              pinHidden(o);
          });
        }
      } catch (_) {}
      const held = L.held;
      const cam = (typeof camera !== 'undefined') ? camera : W.camera;
      const roots = [L.armPivot, L.hand, L.fist && L.fist.parent, cam].filter(Boolean);
      const seen = new Set();
      for (const r of roots) {
        r.traverse(o => {
          if (!(o.isMesh || o.isSkinnedMesh) || seen.has(o)) return;
          seen.add(o);
          if (under(o, held)) return;
          let p = o;
          while (p) {
            if (p.name === 'ArmSwitch1247' || p.userData && p.userData.armSwitchVer) return;
            p = p.parent;
          }
          const typ = o.geometry && o.geometry.type;
          if (o.userData && (o.userData.armSwitchKeep || (U.hybrid !== 0 && W.__fpaR && W.__fpaR(o)))) return;
          if (typ === 'BoxGeometry' || typ === 'CylinderGeometry' || typ === 'SphereGeometry' || typ === 'TorusGeometry') {
            pinHidden(o);
          }
        });
      }
    } catch (_) {}
  }

  function retarget(fp, side, arm) {
    if (!fp || !arm) return;
    const bones = fp.userData.bones, Toff = fp.userData.Toff;
    if (!Toff) return;
    const p = arm.userData && arm.userData.p;
    if (!p) return;
    function apply(boneName, driverObj) {
      const bone = getBone(bones, boneName), off = Toff[boneName];
      if (!bone || !off || !driverObj) return;
      driverObj.updateWorldMatrix(true, false);
      applyWorld(bone, _m2.multiplyMatrices(driverObj.matrixWorld, off));
    }
    // Parent-first: changing clavicle after the arm would invalidate
    // the children's locals / matrixWorld.
    if (p.up && Toff['clavicle' + side] && getBone(bones, 'clavicle' + side)) apply('clavicle' + side, p.up);
    apply('upper_arm' + side, p.up);
    apply('forearm' + side, p.fo);
    apply('hand' + side, p.h);
    // Fingers stay on the GLB bind pose relative to the (now placed) hand,
    // then curl around local +X using the __fpa joint angles. World-matrix
    // retarget of these short bones caused the spike / claw hands.
    const bindLocal = fp.userData.bindLocal || {};
    function restoreLocal(name) {
      const bone = getBone(bones, name), loc = bindLocal[name];
      if (!bone || !loc) return null;
      bone.position.copy(loc.pos);
      bone.quaternion.copy(loc.quat);
      if (loc.scale) bone.scale.copy(loc.scale);
      bone.updateMatrix();
      return bone;
    }
    const fingers = p.h && p.h.userData && p.h.userData.f;
    for (let d = 0; d < 4; d++) {
      const b1 = restoreLocal('finger' + side + d + '01');
      const b2 = restoreLocal('finger' + side + d + '02');
      const pair = fingers && fingers[d];
      // fpa rest is already a closed-ish pose (~1.0 / 1.2). GLB bind is nearly
      // straight, so the fpa rotation.x maps directly onto +X curl.
      const cx = pair && pair[0] ? pair[0].rotation.x : 1.15;
      const kx = pair && pair[1] ? pair[1].rotation.x : 1.25;
      if (b1) { b1.rotateX(cx); b1.updateMatrix(); }
      if (b2) { b2.rotateX(kx); b2.updateMatrix(); }
    }
    const th = p.h && p.h.userData && p.h.userData.th;
    const t1 = restoreLocal('thumb' + side + '01');
    const t2 = restoreLocal('thumb' + side + '02');
    let tg = 1;
    if (th) {
      tg = (th.rotation.x - 0.85) / 0.4;
      if (!isFinite(tg)) tg = 1;
      tg = Math.max(0, Math.min(1.4, tg));
    }
    // Thumb curls across the palm; +X is still the flex axis on this rig.
    if (t1) { t1.rotateX(0.35 + tg * 0.55); t1.updateMatrix(); }
    if (t2) { t2.rotateX(0.2 + tg * 0.7); t2.updateMatrix(); }
  }

  function leakGuard(fp) {
    const leak = [];
    fp.traverse(o => {
      if (!(o.isMesh || o.isSkinnedMesh) || o.visible === false) return;
      const kind = isArmRegion(o);
      if (kind === 'arm' || kind === 'sleeve' || kind === 'gear' || o.userData.armSwitchSleeve) return;
      o.visible = false;
      leak.push(o);
      try { if (o.parent) o.parent.remove(o); } catch (_) {}
    });
    if (leak.length) U.leaks = (U.leaks || 0) + leak.length;
  }

  U.syncFromFpa = function (dt) {
    const fpa = W.__fpa;
    const cam = (typeof camera !== 'undefined') ? camera : W.camera;
    if (!cam || !fpa) return;
    const runtime = W.__pilot1235;
    if (!runtime || !runtime.templates || !runtime.templates[0]) return;

    let fp = cam.getObjectByName('ArmSwitch1247') || U.fp;
    if (!fp) {
      fp = U.buildFromTemplate(runtime.templates[0]);
      if (!fp) return;
      // Identity under the camera: bones are written in world space from __fpa
      // drivers. The body has already been stripped, so nothing sits in the
      // near plane in bind pose.
      fp.position.set(0, 0, 0);
      fp.rotation.set(0, 0, 0);
      fp.scale.set(1, 1, 1);
      cam.add(fp);
      U.fp = fp;
    }

    try {
      const old = cam.getObjectByName('Held1240FpArms') || cam.getObjectByName('ArmSwitch1245');
      if (old) { old.visible = false; old.traverse(o => { if (o.isMesh || o.isSkinnedMesh) o.visible = false; }); }
    } catch (_) {}

    const rig = fpa.rig && fpa.rig();
    if (!rig || !rig.visible) { fp.visible = false; U.on = 0; return; }
    if (typeof camMode !== 'undefined' && camMode !== 0) { fp.visible = false; U.on = 0; return; }
    if (typeof started !== 'undefined' && !started) { fp.visible = false; U.on = 0; return; }

    hideDriverMeshes(rig);
    hideLegacyBoxes();
    if (U.hybrid !== 0) {
      fp.visible = false;
      try { fp.traverse(o => { if (o.isMesh || o.isSkinnedMesh) o.visible = false; }); } catch (_) {}
      try {
        if (W.__held1240 && typeof W.__held1240.retextureProceduralArms === 'function')
          W.__held1240.retextureProceduralArms();
        if (W.__held1240 && typeof W.__held1240.hardenFpa === 'function')
          W.__held1240.hardenFpa();
      } catch (e) { if (!U.err) U.err = 'hybrid paint: ' + (e && e.message || e); }
      U.on = 1;
    } else {
      fp.visible = true;
      U.on = 1;
    }

    const Rarm = rig.userData.R, Larm = rig.userData.L;
    const showL = !!(Larm && Larm.visible);
    const armourOn = (function () {
      try { if (typeof armour !== 'undefined' && armour && armour[1]) return true; } catch (_) {}
      return false;
    })();

    try {
      if (Rarm) retarget(fp, 'R', Rarm);
      if (showL && Larm) retarget(fp, 'L', Larm);
    } catch (e) { if (!U.err) U.err = 'retarget: ' + (e && e.message || e); }

    try {
      fp.traverse(o => {
        if (!(o.isMesh || o.isSkinnedMesh)) return;
        const kind = isArmRegion(o);
        const n = o.name || '';
        if (kind === 'gear') {
          const left = /slot1|_L_|GLOVE_\|_L_/.test(n + (o.parent && o.parent.name || ''));
          o.visible = armourOn && (left ? showL : true);
          return;
        }
        if (kind === 'sleeve' || o.userData.armSwitchSleeve) {
          o.visible = !armourOn;
          return;
        }
        if (kind === 'arm') {
          const left = /GLOVE_\|_L_|visual_arm_slot1/.test(n + ' ' + (o.parent && o.parent.name || ''));
          o.visible = left ? showL : true;
          return;
        }
        o.visible = false;
      });
    } catch (_) {}

    // matrixWorld must be current BEFORE skeleton.update() reads it.
    // Otherwise skinned vertices stay at the unparented bind origin
    // and never appear in the first-person view.
    try { fp.updateMatrixWorld(true); } catch (_) {}
    try {
      fp.traverse(o => {
        if (!o.isSkinnedMesh || !o.skeleton) return;
        o.bindMode = 'attached';
        o.updateMatrixWorld(true);
        o.skeleton.update();
      });
    } catch (_) {}
    leakGuard(fp);
    try { fp.updateMatrixWorld(true); } catch (_) {}
    if (U.hybrid !== 0) posePistolTrigger();

    // Do NOT snap `held` to the GLB socket. __fpa / __vm already place the
    // item and then reach the driver hands to it (1.2.22–1.2.27 gun project).
    U.kind = (function () {
      try {
        if (W.__swimHide || (typeof swimDeep !== 'undefined' && swimDeep && !camMode)) return 'swim';
        const H = W.__held1240;
        if (typeof held !== 'undefined' && held && held.children[0] && H && H.kindOf) {
          return H.kindOf(held.children[0], typeof heldId !== 'undefined' ? heldId : null);
        }
      } catch (_) {}
      return 'empty';
    })();
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
