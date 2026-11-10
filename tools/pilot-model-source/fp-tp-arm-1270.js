/* v1.2.49 / 1270: first-person arms use the live third-person Scottish
 * player mesh — the same skinned arm / forearm / hand, HeadSkin_CC0_toned
 * and Scottish_Linen_eee6d6 shirt sleeve — posed in the 1259 camera-space
 * rig. Procedural tube sleeves and sculpted mitten hands are hidden once
 * the clone is ready. The held item stays parented to the FpGrip socket.
 * Identifier: fpTpArm1270 */
(function fpTpArm1270(W) {
  'use strict';
  const U = W.__fpTpArm1270 = W.__fpTpArm1270 || { version: '1270', on: 0, err: null };
  U.version = '1270';
  const T = W.THREE || (typeof THREE !== 'undefined' ? THREE : null);
  if (!T) { U.err = 'no THREE'; return; }

  const _v1 = new T.Vector3(), _v2 = new T.Vector3(), _v3 = new T.Vector3();
  const _m1 = new T.Matrix4(), _m2 = new T.Matrix4();
  const _s = new T.Vector3();
  const _q = new T.Quaternion();
  const Y_UP = new T.Vector3(0, 1, 0);
  const _identQ = new T.Quaternion();

  function find(r, n) {
    return r && (r.getObjectByName(n) || (T.PropertyBinding && r.getObjectByName(T.PropertyBinding.sanitizeNodeName(n))));
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
  // Stable Y-along-bone frame with an explicit up (dorsum) hint so the
  // twist does not flip when the fingertip axis is near world -Y.
  function frameYUp(from, to, upHint, outM) {
    const y = _v1.copy(to).sub(from);
    if (y.lengthSq() < 1e-10) y.set(0, 1, 0);
    y.normalize();
    const z = _v2.copy(upHint);
    z.addScaledVector(y, -z.dot(y));
    if (z.lengthSq() < 1e-8) {
      z.set(0, 0, 1);
      z.addScaledVector(y, -z.dot(y));
      if (z.lengthSq() < 1e-8) z.set(1, 0, 0);
    }
    z.normalize();
    const x = _v3.crossVectors(y, z).normalize();
    z.crossVectors(x, y).normalize();
    outM.makeBasis(x, y, z);
    outM.setPosition(from);
    return outM;
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
  function wp(o, t) { return o.getWorldPosition(t || new T.Vector3()); }
  function boneIndexSet(skel, re) {
    const set = new Set();
    if (!skel || !skel.bones) return set;
    for (let i = 0; i < skel.bones.length; i++) {
      const n = (skel.bones[i] && skel.bones[i].name) || '';
      if (re.test(n)) set.add(i);
    }
    return set;
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
          sum += wa[i * n + k];
          if (firstArm < 0) firstArm = k;
        } else {
          wa[i * n + k] = 0;
        }
      }
      if (sum < 1e-8) {
        for (let k = 0; k < n; k++) { ia[i * n + k] = fallback; wa[i * n + k] = 0; }
        ia[i * n] = fallback;
        wa[i * n] = 1;
      } else {
        const inv = 1 / sum;
        for (let k = 0; k < n; k++) wa[i * n + k] *= inv;
      }
    }
    sw.needsUpdate = true;
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
    if (srcMesh.isSkinnedMesh && srcMesh.skeleton) {
      try { mesh.bind(srcMesh.skeleton, srcMesh.bindMatrix && srcMesh.bindMatrix.clone ? srcMesh.bindMatrix.clone() : srcMesh.bindMatrix); } catch (_) {}
    }
    try { if (armIdx && mesh.geometry) renormalizeArmWeights(mesh.geometry, armIdx); } catch (_) {}
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.renderOrder = 4;
    mesh.visible = true;
    mesh.userData.armSwitchSleeve = 1;
    mesh.userData.fpTpArm1270 = 1;
    return mesh;
  }

  function tagSide(o) {
    const n = ((o.name || '') + ' ' + ((o.parent && o.parent.name) || '') + ' ' + (o.userData && o.userData.armSwitchSide || '')).toLowerCase();
    if (/slot0|glove\s*\|\s*r|_r_|side['"]?r|armswitchside['":\s]*r/.test(n) || o.userData.armSwitchSide === 'R') o.userData.fpTpSide = 'R';
    if (/slot1|glove\s*\|\s*l|_l_|side['"]?l|armswitchside['":\s]*l/.test(n) || o.userData.armSwitchSide === 'L') o.userData.fpTpSide = 'L';
  }

  function isKeepMesh(o) {
    if (o.userData && (o.userData.armSwitchSleeve || o.userData.fpTpArm1270 || o.userData.fpLinenCuff1275)) return true;
    const n = ((o.name || '') + ' ' + ((o.parent && o.parent.name) || ''));
    if (/visual_arm_slot[01]_hand/.test(n)) return true;
    if (/GLOVE\s*\|\s*[RL]/.test(n)) return true;
    return false;
  }

  function handBasis(hand, mid, thumb, outM, side) {
    const origin = wp(hand, new T.Vector3());
    const y = wp(mid, new T.Vector3()).sub(origin);
    if (y.lengthSq() < 1e-10) y.set(0, 1, 0);
    y.normalize();
    const t = wp(thumb, new T.Vector3()).sub(origin);
    // +Z = dorsum. In the Scottish T-pose the right-hand fingers point
    // out along +X and the thumb along +Z, so thumb × fingers (+Z × +X)
    // is +Y — the back of the hand. Flip the left so it matches.
    const z = new T.Vector3().crossVectors(t, y);
    if (z.lengthSq() < 1e-10) z.set(0, 0, 1);
    z.normalize();
    if (side === 'L') z.negate();
    const x = new T.Vector3().crossVectors(y, z);
    if (x.lengthSq() < 1e-10) x.set(1, 0, 0);
    x.normalize();
    z.crossVectors(x, y).normalize();
    outM.makeBasis(x, y, z);
    outM.setPosition(origin);
    return outM;
  }

  function captureBind(fp) {
    fp.updateMatrixWorld(true);
    const bones = fp.userData.bones;
    const bind = {}, Toff = {}, bindLocal = {}, lens = {}, handOff = {};
    function recordLocal(name) {
      const b = getBone(bones, name);
      if (!b) return;
      bindLocal[name] = { pos: b.position.clone(), quat: b.quaternion.clone(), scale: b.scale.clone() };
    }
    for (const side of ['R', 'L']) {
      const cl = getBone(bones, 'clavicle' + side);
      const u = getBone(bones, 'upper_arm' + side);
      const f = getBone(bones, 'forearm' + side);
      const h = getBone(bones, 'hand' + side);
      const mid = getBone(bones, 'finger' + side + '201') || getBone(bones, 'finger' + side + '101');
      const th = getBone(bones, 'thumb' + side + '01') || getBone(bones, 'thumb' + side + '02');
      function offLook(bone, from, to, key) {
        if (!bone || !from || !to) return;
        const p = wp(from, new T.Vector3());
        const q = new T.Quaternion();
        lookY(p, wp(to, new T.Vector3()), q);
        const drv = new T.Matrix4();
        frameAt(p, q, drv);
        bind[key] = bone.matrixWorld.clone();
        Toff[key] = drv.clone().invert().multiply(bone.matrixWorld);
      }
      if (cl && u) offLook(cl, cl, u, 'clavicle' + side);
      if (u && f) offLook(u, u, f, 'upper_arm' + side);
      if (f && h) offLook(f, f, h, 'forearm' + side);
      if (h && mid) {
        const origin = wp(h, new T.Vector3());
        const midP = wp(mid, new T.Vector3());
        let up = new T.Vector3(0, 0, 1);
        if (th) {
          const yb = midP.clone().sub(origin).normalize();
          const tb = wp(th, new T.Vector3()).sub(origin);
          up.crossVectors(tb, yb);
          if (side === 'L') up.negate();
          if (up.lengthSq() < 1e-8) up.set(0, 1, 0);
          up.normalize();
        }
        const drv = new T.Matrix4();
        frameYUp(origin, midP, up, drv);
        bind['hand' + side] = h.matrixWorld.clone();
        Toff['hand' + side] = drv.clone().invert().multiply(h.matrixWorld);
      }
      if (u && f) lens['upper' + side] = wp(u).distanceTo(wp(f));
      if (f && h) lens['fore' + side] = wp(f).distanceTo(wp(h));
      if (h && mid && th) {
        const basis = new T.Matrix4();
        handBasis(h, mid, th, basis, side);
        bind['hand' + side] = h.matrixWorld.clone();
        handOff[side] = basis.clone().invert().multiply(h.matrixWorld);
      } else if (h) {
        bind['hand' + side] = h.matrixWorld.clone();
        handOff[side] = new T.Matrix4().copy(h.matrixWorld).invert().multiply(h.matrixWorld);
      }
      ['clavicle', 'upper_arm', 'forearm', 'hand'].forEach(n => recordLocal(n + side));
      for (let d = 0; d < 4; d++) {
        recordLocal('finger' + side + d + '01');
        recordLocal('finger' + side + d + '02');
      }
      recordLocal('thumb' + side + '01');
      recordLocal('thumb' + side + '02');
    }
    fp.userData.bind = bind;
    fp.userData.Toff = Toff;
    fp.userData.handOff = handOff;
    fp.userData.bindLocal = bindLocal;
    fp.userData.lens = lens;
    const uR = lens.upperR || 0.26, fR = lens.foreR || 0.24;
    fp.userData.glbArmLen = uR + fR;
    return fp.userData;
  }

  function buildFromTemplate(template) {
    if (!template) return null;
    const src = template.scene || template.root || template;
    const clone = (T.SkeletonUtils && T.SkeletonUtils.clone) ? T.SkeletonUtils.clone(src) : src.clone(true);
    clone.name = 'FpTpArm1270';
    clone.userData.fpTpArm1270 = 1;
    clone.userData.armSwitchVer = '1270';
    const bones = boneMap(clone);
    clone.userData.bones = bones;

    clone.traverse(o => {
      o.matrixAutoUpdate = true;
      if (o.isMesh || o.isSkinnedMesh) {
        o.visible = false;
        o.frustumCulled = false;
        o.castShadow = false;
        o.receiveShadow = false;
        o.renderOrder = 4;
        if (o.isSkinnedMesh) o.bindMode = 'attached';
        tagSide(o);
        if (isKeepMesh(o)) {
          o.visible = true;
          o.userData.fpTpArm1270 = 1;
          o.userData.sculptKeep = 1;
        }
      }
    });

    const sleeves = [];
    clone.traverse(o => {
      if (!(o.isSkinnedMesh && o.skeleton)) return;
      const n = (o.name || '') + ' ' + ((o.parent && o.parent.name) || '');
      if (!/visual_torso_outfit/.test(n)) return;
      const torsoIdx = boneIndexSet(o.skeleton, /^(spine|pelvis|root|thigh|neck|head)/);
      for (const side of ['R', 'L']) {
        const sleeveIdx = boneIndexSet(o.skeleton, new RegExp('^(clavicle|upper_arm|forearm)[._]?' + side + '$'));
        const sleeve = extractSleeve(o, sleeveIdx, 0.48);
        if (!sleeve) continue;
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
        sleeve.userData.fpTpSide = side;
        sleeve.userData.fpTpArm1270 = 1;
        sleeve.userData.sculptKeep = 1;
        o.parent.add(sleeve);
        sleeves.push(sleeve);
      }
    });
    sleeves.forEach((sl, i) => { sl.name = 'FpTpSleeve1270_' + i; });
    clone.userData.sleeves = sleeves;

    // Physically remove every non-arm mesh so a stomach / kilt / pack can
    // never appear in the first-person camera.
    const doomed = [];
    clone.traverse(o => {
      if (!(o.isMesh || o.isSkinnedMesh)) return;
      if (isKeepMesh(o) || (o.userData && o.userData.armSwitchSleeve)) return;
      doomed.push(o);
    });
    for (const o of doomed) {
      try { if (o.parent) o.parent.remove(o); } catch (_) {}
      o.visible = false;
    }
    U.stripped = doomed.length;

    // Drop leftover spine/root weights on anything that remains.
    clone.traverse(o => {
      if (!(o.isSkinnedMesh && o.skeleton && o.geometry)) return;
      const side = o.userData.fpTpSide || o.userData.armSwitchSide;
      const re = side
        ? new RegExp('^(clavicle|upper_arm|forearm|hand|finger|thumb)[._]?' + side)
        : /^(clavicle|upper_arm|forearm|hand|finger|thumb)/;
      try { renormalizeArmWeights(o.geometry, boneIndexSet(o.skeleton, re)); } catch (_) {}
    });

    captureBind(clone);
    clone.scale.set(1, 1, 1);
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    return clone;
  }

  function hideProcedural(arm) {
    if (!arm || !arm.userData || !arm.userData.p) return;
    const p = arm.userData.p;
    [p.sleeve, p.cuff, p.roll, p.roll2].forEach(o => { if (o) o.visible = false; });
    if (p.h) {
      p.h.traverse(o => {
        if (!(o.isMesh || o.isSkinnedMesh)) return;
        if (p.grip) {
          for (let n = o; n; n = n.parent) if (n === p.grip) return;
        }
        o.visible = false;
      });
    }
  }

  function solveElbow(sh, wr, uLen, fLen, bendHint) {
    const sw = wr.clone().sub(sh);
    let dist = sw.length();
    if (dist < 1e-5) return sh.clone().add(new T.Vector3(0, -0.1, 0));
    const dir = sw.clone().multiplyScalar(1 / dist);
    const maxD = uLen + fLen - 1e-4;
    const minD = Math.abs(uLen - fLen) + 1e-4;
    const d = Math.min(maxD, Math.max(minD, dist));
    const a = (uLen * uLen - fLen * fLen + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, uLen * uLen - a * a));
    const mid = sh.clone().addScaledVector(dir, a * (d / dist));
    let n = (bendHint || new T.Vector3(0, -1, 0.15)).clone();
    n.addScaledVector(dir, -n.dot(dir));
    if (n.lengthSq() < 1e-6) n.set(0, -1, 0);
    n.normalize();
    return mid.addScaledVector(n, h);
  }

  function curlFingers(fp, side, p) {
    const bindLocal = fp.userData.bindLocal || {};
    const bones = fp.userData.bones;
    function restoreLocal(name) {
      const bone = getBone(bones, name), loc = bindLocal[name];
      if (!bone || !loc) return null;
      bone.position.copy(loc.pos);
      bone.quaternion.copy(loc.quat);
      if (loc.scale) bone.scale.copy(loc.scale);
      bone.updateMatrix();
      return bone;
    }
    // 1271: explicit joint angles (radians). Identifier: fpCurl1271
    // Empty is a loose 30-45° curl, not a splayed wave. Tool fists wrap
    // the haft without punching through; gun support uses a cup, not a mash.
    const vm = W.__fpVm1259 || {};
    const key = vm.poseKey || vm.kind || '';
    const k = vm.kind || '';
    const isLeft = side === 'L';
    const opts = (p && p.side && vm.armR && vm.armL)
      ? ((isLeft ? vm.armL : vm.armR) && (isLeft ? vm.armL : vm.armR).userData && (isLeft ? vm.armL : vm.armR).userData.curlOpts1271) || {}
      : {};
    let cx = 0.70, kx = 0.78, t1a = 0.50, t2a = 0.55, tY = 0;
    const dex = [1, 1, 1, 1]; // per-digit scale, index..pinky
    if (k === 'empty') {
      // t1153: open palm, slight natural curve, not a fist.
      cx = 0.20; kx = 0.16; t1a = 0.22; t2a = 0.16;
    } else if (k === 'block') {
      // t1153: fingers under the cube, a cradle not a tight fist.
      cx = 0.32; kx = 0.28; t1a = 0.34; t2a = 0.28;
    } else if (k === 'map') {
      // t1153: thumb on the bottom edge, fingers under the sheet.
      cx = 0.22; kx = 0.18; t1a = 0.40; t2a = 0.28;
    } else if (k === 'bucket') {
      cx = 0.72; kx = 0.80; t1a = 0.55; t2a = 0.60;
    } else if (key === 'pistol') {
      // Wrapped grip, index along the trigger/frame, no thumb paddle.
      cx = 0.72; kx = 0.78; t1a = 0.42; t2a = 0.36; tY = 0.18;
      dex[0] = 0.18;
    } else if (key === 'pistolAds') {
      if (isLeft) { cx = 0.58; kx = 0.62; t1a = 0.40; t2a = 0.36; tY = 0.10; }
      else { cx = 0.70; kx = 0.74; t1a = 0.42; t2a = 0.36; tY = 0.16; dex[0] = 0.18; }
    } else if (key === 'musketAds') {
      if (isLeft) { cx = 0.58; kx = 0.62; t1a = 0.40; t2a = 0.36; }
      else { cx = 0.68; kx = 0.72; t1a = 0.48; t2a = 0.50; }
    } else if (key === 'musket') {
      if (isLeft) { cx = 0.58; kx = 0.62; t1a = 0.42; t2a = 0.40; }
      else { cx = 0.68; kx = 0.72; t1a = 0.48; t2a = 0.52; }
    } else {
      // pick / sword / torch: a tight fist wrap around the haft.
      cx = 0.88; kx = 0.82; t1a = 0.72; t2a = 0.70; tY = 0.24;
      dex[0] = 0.96; dex[3] = 0.88;
    }
    if (opts.mode === 'cup') { cx = 0.20; kx = 0.16; t1a = 0.22; t2a = 0.18; }
    if (opts.mode === 'relax') { cx = 0.52; kx = 0.48; t1a = 0.28; t2a = 0.22; }
    if (opts.mode === 'open') { cx = 0.10; kx = 0.08; t1a = 0.18; t2a = 0.12; }
    if (opts.trigger) dex[0] = 0.18;
    if (U.curlMul != null) {
      cx *= U.curlMul; kx *= U.curlMul; t1a *= U.curlMul; t2a *= U.curlMul;
    }
    const fingers = p.h && p.h.userData && p.h.userData.f;
    for (let d = 0; d < 4; d++) {
      const b1 = restoreLocal('finger' + side + d + '01');
      const b2 = restoreLocal('finger' + side + d + '02');
      const sc = dex[d] != null ? dex[d] : 1;
      if (b1) {
        b1.rotateX(cx * sc);
        if (k === 'empty') b1.rotateZ((1.5 - d) * 0.10);
        b1.updateMatrix();
      }
      if (b2) { b2.rotateX(kx * sc); b2.updateMatrix(); }
    }
    const t1 = restoreLocal('thumb' + side + '01');
    const t2 = restoreLocal('thumb' + side + '02');
    // Thumb wraps over the haft (or stays modest on empty). A large
    // rotateX alone flattens it into the pistol "paddle".
    const sideSign = (side === 'L') ? -1 : 1;
    if (t1) {
      t1.rotateX(t1a);
      if (tY) t1.rotateY(sideSign * tY);
      t1.updateMatrix();
    }
    if (t2) { t2.rotateX(t2a); t2.updateMatrix(); }
  }

  function lightenLinenMat(mat) {
    // Always Phong — a cloned MeshStandard linen goes black on SwiftShader.
    if (mat && mat.userData && mat.userData.fpLinenLight1275 && mat.isMeshPhongMaterial) return mat;
    const map = (mat && mat.map) ? mat.map : null;
    const m = new T.MeshPhongMaterial({
      color: 0xf6eedc,
      map: map,
      shininess: 10,
      specular: 0x3a3020,
      side: T.DoubleSide,
      skinning: !!(mat && (mat.skinning || mat.isMeshPhongMaterial && mat.skinning))
    });
    m.userData = Object.assign({}, (mat && mat.userData) || {});
    m.userData.fpLinenLight1275 = 1;
    m.userData.sculptKeep = 1;
    m.userData.fpTpArm1270 = 1;
    return m;
  }
  function sleeveMatOf(fp) {
    const sleeves = (fp && fp.userData && fp.userData.sleeves) || [];
    for (let i = 0; i < sleeves.length; i++) {
      if (sleeves[i] && sleeves[i].material) return sleeves[i].material;
    }
    return null;
  }
  function dressSleeveCream(fp) {
    const sleeves = (fp && fp.userData && fp.userData.sleeves) || [];
    for (let i = 0; i < sleeves.length; i++) {
      const sl = sleeves[i];
      if (!sl) continue;
      sl.material = lightenLinenMat(sl.material);
      sl.visible = true;
    }
    fp.userData.fpLinenDressed1275 = 1;
  }
  function ensureWristCuff(fp, side, wr, el) {
    if (!fp || !wr || !el) return;
    const key = 'linenCuff' + side;
    let cuff = fp.userData[key];
    const mat = lightenLinenMat(sleeveMatOf(fp));
    if (!cuff) {
      cuff = new T.Group();
      cuff.name = 'FpLinenCuff1275_' + side;
      cuff.userData.fpLinenCuff1275 = 1;
      cuff.userData.sculptKeep = 1;
      cuff.userData.fpTpArm1270 = 1;
      cuff.userData.armSwitchSleeve = 1;
      cuff.userData.fpTpSide = side;
      cuff.userData.armSwitchSide = side;
      function tag(m) {
        m.userData.fpLinenCuff1275 = 1;
        m.userData.sculptKeep = 1;
        m.userData.fpTpArm1270 = 1;
        m.userData.armSwitchSleeve = 1;
        m.userData.fpTpSide = side;
        m.castShadow = false;
        m.frustumCulled = false;
        cuff.add(m);
        return m;
      }
      // Short cream band ending in a modest rolled lip at the wrist —
      // uses the TP linen texture, not the old procedural foam stack.
      const band = tag(new T.Mesh(new T.CylinderGeometry(0.030, 0.033, 0.030, 22, 1, true), mat));
      const roll = tag(new T.Mesh(new T.TorusGeometry(0.032, 0.0065, 10, 22), mat));
      roll.rotation.x = Math.PI / 2;
      roll.position.y = 0.015;
      fp.add(cuff);
      fp.userData[key] = cuff;
    }
    fp.updateWorldMatrix(true, false);
    const axisW = wr.clone().sub(el);
    if (axisW.lengthSq() < 1e-10) axisW.set(0, 1, 0);
    axisW.normalize();
    const posW = wr.clone().addScaledVector(axisW, -0.015);
    const inv = new T.Matrix4().copy(fp.matrixWorld).invert();
    cuff.position.copy(posW).applyMatrix4(inv);
    const axisL = axisW.clone().transformDirection(inv).normalize();
    cuff.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), axisL);
    cuff.visible = true;
    cuff.traverse(function (o) { o.visible = true; });
    cuff.updateMatrix();
  }

  function poseSide(fp, side, arm, vc) {
    if (!fp || !arm || !arm.visible || !arm.userData || !arm.userData.p) return;
    const p = arm.userData.p;
    const bones = fp.userData.bones;
    const Toff = fp.userData.Toff || {};
    const handOff = fp.userData.handOff || {};
    const lens = fp.userData.lens || {};
    const u = getBone(bones, 'upper_arm' + side);
    const f = getBone(bones, 'forearm' + side);
    const h = getBone(bones, 'hand' + side);
    const cl = getBone(bones, 'clavicle' + side);
    if (!u || !f || !h) return;

    arm.updateWorldMatrix(true, true);
    const wr = wp(p.wrist || p.h, new T.Vector3());
    let sh = wp(arm, new T.Vector3());
    // Keep the Scottish bind bone lengths (no per-bone scale). Scaling
    // the hand independently of the forearm tore the wrist seam. If the
    // posed shoulder is closer than the bind arm, push it back so the
    // wrist stays put and the sleeve stays off-screen.
    const uBind = lens['upper' + side] || 0.26;
    const fBind = lens['fore' + side] || 0.24;
    const bindTotal = uBind + fBind;
    const dir = _v1.copy(sh).sub(wr);
    if (dir.lengthSq() < 1e-8) dir.set(0.2, -0.8, 0.15);
    dir.normalize();
    // 1271: fpSleeveNudge1271 — point the forearm so the shirt cuff
    // (a bind-length point along the arm) sits just inside the bottom
    // or right frame edge. Wrist stays put; no bone scaling.
    const vmKey = ((W.__fpVm1259 && (W.__fpVm1259.poseKey || W.__fpVm1259.kind)) || '');
    // t1153: the Scottish shirt cuff sits ~0.24m from the wrist (elbow).
    // Nudge the forearm so that cuff reads at the frame edge as a wrist
    // cuff; the authored wr stays put. skipCuff stays false.
    const kind0 = ((W.__fpVm1259 && (W.__fpVm1259.poseKey || W.__fpVm1259.kind)) || '');
    const skipCuff = (kind0 === 'empty' || kind0 === 'block' || kind0 === 'map');
    if (vc && !skipCuff) {
      try {
        vc.updateWorldMatrix(true, false);
        const cuffDist = Math.min(0.28, (lens["fore" + side] || 0.24) + 0.04);
        const isLeft = side === 'L';
        const nx = isLeft ? -0.70 : 0.70;
        const ny = -0.90;
        const wrCam = wr.clone().applyMatrix4(new T.Matrix4().copy(vc.matrixWorld).invert());
        const z = wrCam.z;
        const hy = Math.tan((vc.fov || 70) * 0.5 * Math.PI / 180) * Math.abs(z);
        const hx = hy * (vc.aspect || (412 / 915));
        const cuffCam = new T.Vector3(nx * hx, ny * hy, z);
        const cuffW = cuffCam.applyMatrix4(vc.matrixWorld);
        const d = cuffW.sub(wr);
        if (d.lengthSq() > 1e-8) dir.copy(d.normalize());
      } catch (_) {}
    }
    const target = bindTotal * 0.94;
    const shDir = dir.clone();
    sh = wr.clone().addScaledVector(shDir, target);
    // Uniform scale about the wrist: shortens the sleeve into frame
    // without stretching verts (every bone, including the hand, shares
    // this scale; finger locals stay at their bind scale).
    const suit = 1;
    const uLen = uBind, fLen = fBind;
    U.fit = suit;

    // Elbow bends slightly down / toward the camera so the sleeve has a
    // natural arm shape instead of a straight tube.
    const camDown = new T.Vector3(0, -1, 0);
    const camFwd = new T.Vector3(0, 0, -1);
    try {
      if (vc) {
        vc.updateWorldMatrix(true, false);
        camDown.set(0, -1, 0).transformDirection(vc.matrixWorld);
        camFwd.set(0, 0, -1).transformDirection(vc.matrixWorld);
      }
    } catch (_) {}
    const vmKey2 = ((W.__fpVm1259 && (W.__fpVm1259.poseKey || W.__fpVm1259.kind)) || '');
    const oneHand = (vmKey2 === 'empty' || vmKey2 === 'p761' || vmKey2 === 'sword' || vmKey2 === 'torch' || vmKey2 === 'block' || vmKey2 === 'map' || vmKey2 === 'pistol');
    const bend = camDown.multiplyScalar(oneHand ? 0.25 : 0.85).addScaledVector(camFwd, oneHand ? -0.08 : -0.25);
    let el = solveElbow(sh, wr, uLen, fLen, bend);
    // suit already set above (uniform scale about the wrist)
    if (Math.abs(suit - 1) > 1e-3) {
      sh.lerp(wr, 1 - suit);
      el.lerp(wr, 1 - suit);
    }

    function applyLook(bone, from, to, key, scale) {
      if (!bone) return;
      const q = new T.Quaternion();
      lookY(from, to, q);
      const m = new T.Matrix4();
      frameAt(from, q, m);
      if (Toff[key]) m.multiply(Toff[key]);
      if (scale && Math.abs(scale - 1) > 1e-3) {
        m.decompose(_v3, _q, _s);
        _s.set(scale, scale, scale);
        m.compose(_v3, _q, _s);
      }
      applyWorld(bone, m);
    }
    if (cl) applyLook(cl, sh.clone().addScaledVector(wr.clone().sub(sh).normalize(), -0.04), sh, 'clavicle' + side, suit);
    applyLook(u, sh, el, 'upper_arm' + side, suit);
    applyLook(f, el, wr, 'forearm' + side, suit);

    // Stable fingertip-axis frame, using the 1259 hand's +Z (dorsum)
    // as the up hint so the twist cannot flip on vertical grips.
    p.h.updateWorldMatrix(true, false);
    const tip = new T.Vector3(0, 1, 0).transformDirection(p.h.matrixWorld);
    if (tip.lengthSq() < 1e-8) tip.set(0, 1, 0);
    tip.normalize();
    const dorsum = new T.Vector3(0, 0, 1).transformDirection(p.h.matrixWorld);
    if (dorsum.lengthSq() < 1e-8) dorsum.set(0, 0, 1);
    dorsum.normalize();
    // Default bind: the 1270 hand bone +Z is opposite the 1259 driver, so
    // we negate when the driver is showing the dorsum (knuckles to camera).
    // palmUp already has the driver dorsum pointing away — leave it so
    // the palm stays facing the camera. Pronation of the forearm (below)
    // carries that twist, not a 180 at the wrist.
    const face = (arm.userData && arm.userData.face) || '';
    if (face !== 'palmUp' && face !== 'palmUpHigh') dorsum.negate();

    // Pronate/supinate the forearm so the wrist skin follows the hand
    // palm instead of tearing when the driver asks for palm-up.
    if (f) {
      f.updateWorldMatrix(true, false);
      const axis = wr.clone().sub(el);
      if (axis.lengthSq() > 1e-8) {
        axis.normalize();
        function sideOf(mat, axisV) {
          const z = new T.Vector3(0, 0, 1).transformDirection(mat);
          const x = new T.Vector3(1, 0, 0).transformDirection(mat);
          z.addScaledVector(axisV, -z.dot(axisV));
          x.addScaledVector(axisV, -x.dot(axisV));
          return (z.lengthSq() >= x.lengthSq()) ? z : x;
        }
        const cur = sideOf(f.matrixWorld, axis);
        const des = dorsum.clone().addScaledVector(axis, -dorsum.dot(axis));
        if (cur.lengthSq() > 1e-8 && des.lengthSq() > 1e-8) {
          cur.normalize(); des.normalize();
          const ang = Math.atan2(new T.Vector3().copy(cur).cross(des).dot(axis), cur.dot(des));
          const pW = new T.Vector3(), qW = new T.Quaternion(), sW = new T.Vector3();
          f.matrixWorld.decompose(pW, qW, sW);
          qW.premultiply(new T.Quaternion().setFromAxisAngle(axis, ang));
          applyWorld(f, new T.Matrix4().compose(pW, qW, sW));
        }
      }
    }

    const mid = wr.clone().addScaledVector(tip, 0.08);
    const hm = new T.Matrix4();
    frameYUp(wr, mid, dorsum, hm);
    if (Toff['hand' + side]) hm.multiply(Toff['hand' + side]);
    if (Math.abs(suit - 1) > 1e-3) {
      hm.decompose(_v3, _q, _s);
      _s.set(suit, suit, suit);
      hm.compose(_v3, _q, _s);
    }
    const kindH = ((W.__fpVm1259 && (W.__fpVm1259.poseKey || W.__fpVm1259.kind)) || '');
    const faceH = (arm.userData && arm.userData.face) || ((kindH === 'empty' || kindH === 'block' || kindH === 'map') ? 'palmUp' : '');
    if ((faceH === 'palmUp' || faceH === 'palmUpHigh') && vc) {
      // Explicit palm-toward-camera frame. Fingers point left-up, palm
      // faces the camera and slightly up, dorsum down/away. Forearm
      // pronation (above) has already aligned the wrist skin to this.
      try {
        const cRight = new T.Vector3(1, 0, 0).transformDirection(vc.matrixWorld).normalize();
        const cUp = new T.Vector3(0, 1, 0).transformDirection(vc.matrixWorld).normalize();
        const cToward = new T.Vector3(0, 0, 1).transformDirection(vc.matrixWorld).normalize();
        const fingers = cRight.clone().multiplyScalar(-0.88).addScaledVector(cUp, 0.18).addScaledVector(cToward, 0.08).normalize();
        const palm = cToward.clone().addScaledVector(cUp, 0.18).normalize();
        const z = palm.clone().negate(); // dorsum
        const x = new T.Vector3().crossVectors(fingers, z).normalize();
        z.crossVectors(x, fingers).normalize();
        hm.makeBasis(x, fingers, z);
        hm.setPosition(wr);
        // Toff is a knuckles-to-camera bind offset and fights palm-up.
      } catch (_) {}
    }
    applyWorld(h, hm);
    curlFingers(fp, side, p);
    try { if (!fp.userData.fpLinenDressed1275) dressSleeveCream(fp); } catch (_) {}
    try { ensureWristCuff(fp, side, wr, el); } catch (_) {}
  }

  function parkUnused(fp, at) {
    const bones = fp.userData.bones;
    if (!bones || !at) return;
    const names = ['pelvis', 'spine001', 'spine.001', 'spine002', 'spine.002', 'neck', 'head',
      'thighL', 'thigh.L', 'shinL', 'shin.L', 'footL', 'foot.L',
      'thighR', 'thigh.R', 'shinR', 'shin.R', 'footR', 'foot.R'];
    const q = new T.Quaternion();
    const m = new T.Matrix4();
    for (let i = 0; i < names.length; i++) {
      const b = getBone(bones, names[i]) || bones[names[i]];
      if (!b) continue;
      frameAt(at, q, m);
      applyWorld(b, m);
    }
  }

  function setSideVisible(fp, side, on) {
    if (!fp) return;
    fp.traverse(o => {
      if (!(o.isMesh || o.isSkinnedMesh)) return;
      tagSide(o);
      const s = o.userData.fpTpSide || o.userData.armSwitchSide;
      // Only touch this side — a later call for the other side must not
      // wipe the first (that hid the right arm whenever the left was off).
      if (s === side) o.visible = !!on;
      else if (!s) o.visible = false;
    });
  }

  function leakGuard(fp) {
    fp.traverse(o => {
      if (!(o.isMesh || o.isSkinnedMesh) || o.visible === false) return;
      if (isKeepMesh(o) || (o.userData && o.userData.armSwitchSleeve)) return;
      o.visible = false;
      try { if (o.parent) o.parent.remove(o); } catch (_) {}
    });
  }

  function templateOf() {
    try {
      const r = W.__pilot1235;
      if (r && r.templates && r.templates[0]) return r.templates[0];
    } catch (_) {}
    return null;
  }

  function ensure(vm) {
    if (U.fp && U.fp.parent) return U.fp;
    const tpl = templateOf();
    if (!tpl) { U.pending = 1; return null; }
    let fp;
    try { fp = buildFromTemplate(tpl); } catch (e) { U.err = 'build: ' + (e && e.message || e); return null; }
    if (!fp) { U.err = 'build returned null'; return null; }
    const host = vm.vc || vm.rig;
    if (!host) { U.err = 'no vc'; return null; }
    fp.position.set(0, 0, 0);
    fp.rotation.set(0, 0, 0);
    fp.scale.set(1, 1, 1);
    host.add(fp);
    U.fp = fp;
    U.pending = 0;
    U.built = 1;
    return fp;
  }

  function updateSkins(fp) {
    try { fp.updateMatrixWorld(true); } catch (_) {}
    try {
      fp.traverse(o => {
        if (!o.isSkinnedMesh || !o.skeleton) return;
        o.bindMode = 'attached';
        o.updateMatrixWorld(true);
        o.skeleton.update();
      });
    } catch (_) {}
    try { fp.updateMatrixWorld(true); } catch (_) {}
  }

  U.sync = function () {
    const vm = W.__fpVm1259;
    if (!vm || !vm.active || vm.disabled) {
      hideAll();
      return;
    }
    const fp = ensure(vm);
    if (!fp) return;
    try {
      const armR = vm.armR, armL = vm.armL;
      const showR = !!(armR && armR.visible);
      const showL = !!(armL && armL.visible);
      fp.visible = showR || showL;
      if (!fp.visible) { U.on = 0; return; }

      const shPos = showR ? wp(armR, new T.Vector3()) : wp(armL, new T.Vector3());
      parkUnused(fp, shPos);

      if (showR) {
        hideProcedural(armR);
        setSideVisible(fp, 'R', true);
        poseSide(fp, 'R', armR, vm.vc);
      } else setSideVisible(fp, 'R', false);
      if (showL) {
        hideProcedural(armL);
        setSideVisible(fp, 'L', true);
        poseSide(fp, 'L', armL, vm.vc);
      } else setSideVisible(fp, 'L', false);

      updateSkins(fp);
      leakGuard(fp);
      U.on = 1;
      U.kind = vm.kind;
    } catch (e) {
      if (!U.err) U.err = 'sync: ' + String(e && e.stack || e).slice(0, 280);
    }
  };

  function hideAll() {
    U.on = 0;
    const root = U.fp || (typeof fp !== 'undefined' ? fp : null);
    if (!root) return;
    root.visible = false;
    try { setSideVisible(root, 'R', false); } catch (_) {}
    try { setSideVisible(root, 'L', false); } catch (_) {}
    try {
      root.traverse(function (o) {
        if (o.isMesh || o.isSkinnedMesh) o.visible = false;
      });
    } catch (_) {}
  }
  U.hideAll = hideAll;

  U.buildFromTemplate = buildFromTemplate;
})(typeof window !== 'undefined' ? window : this);
