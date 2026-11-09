/* v1.2.40 / v1.2.44: third-person held items follow the scottish-base-v2 /
 * crystal-armour weapon_grip_slot sockets. First-person view (1.2.44) uses the
 * working procedural arm rig (mcArm / __fpa / fist) that drives swing, place,
 * reload and gun animations and keeps held items parented in the fist — NOT
 * Held1240FpArms as the main arms. Those procedural arms are retextured from
 * the new character (skin from the hand meshes, cream linen sleeve from the
 * outfit). Held1240FpArms may still be built for tests but stays hidden in play. */
(function heldFp1240(W) {
  'use strict';
  const T = W.THREE || (typeof THREE !== 'undefined' ? THREE : null);
  const U = W.__held1240 = W.__held1240 || {version: '1.2.45', err: null, on: 0};
  if (!T) { U.err = 'no THREE'; return; }
  const V = () => new T.Vector3(), Q = () => new T.Quaternion(), E = () => new T.Euler();
  const find = (r, n) => r && (r.getObjectByName(n) || (T.PropertyBinding && r.getObjectByName(T.PropertyBinding.sanitizeNodeName(n))));
  // Socket space at bind is world-aligned: +Y up, +Z character forward, +X right.
  // Item local poses are authored in that frame. Tools are built along +Y (handle)
  // with the striking part in the X-Y plane (points along ±X).
  // Shared socket-space poses. Hafted tools are built along +Y with the head in
  // the X-Y plane (points along ±X); yaw π/2 sends the working end forward (+Z).
  const TOOL_POSE = {p: [0, 0.02, 0.03], r: [0.12, Math.PI / 2, 0], s: 0.72, euler: 'YXZ'};
  U.POSE = {
    pick:   Object.assign({}, TOOL_POSE),
    axe:    Object.assign({}, TOOL_POSE, {s: 0.74}),
    shovel: Object.assign({}, TOOL_POSE, {s: 0.74}),
    hoe:    Object.assign({}, TOOL_POSE, {s: 0.72}),
    sword:  {p: [0, 0.01, 0.03], r: [0.2, Math.PI / 2, 0], s: 0.78, euler: 'YXZ'},
    claymore:{p: [0, 0.01, 0.03], r: [0.15, Math.PI / 2, 0], s: 0.85, euler: 'YXZ'},
    shears: {p: [0, 0.02, 0.04], r: [0.2, Math.PI / 2, 0], s: 0.85, euler: 'YXZ'},
    flint:  {p: [0, 0.02, 0.04], r: [0.2, Math.PI / 2, 0], s: 0.9, euler: 'YXZ'},
    stick:  Object.assign({}, TOOL_POSE, {s: 0.7}),
    p761:   Object.assign({}, TOOL_POSE, {s: 0.62}),
    p760:   Object.assign({}, TOOL_POSE, {s: 0.66}),
    map:    {p: [0.02, 0.05, 0.09], r: [-1.15, 0.12, 0.2], s: 1.08, euler: 'YXZ'},
    pistol: {p: [0.015, 0.01, 0.045], r: [0.12, -Math.PI / 2, 0.05], s: 0.92, euler: 'YXZ'},
    // Port / ready: barrel forward (+Z after yaw), stock down — never across the face.
    musket: {p: [0.06, -0.1, 0.14], r: [0.05, -Math.PI / 2, 0.12], s: 0.72, euler: 'YXZ'},
    block:  {p: [0, 0.02, 0.06], r: [0.2, 0.5, 0], s: 0.9, euler: 'YXZ'},
    bucket: {p: [0, 0.06, 0.04], r: [0.05, 0, 0], s: 0.8, euler: 'YXZ'},
    torch:  {p: [0, 0.04, 0.035], r: [0.15, 0, 0], s: 0.82, euler: 'YXZ'},
    drink:  {p: [0, 0.03, 0.05], r: [0.1, 0.3, 0], s: 0.95, euler: 'YXZ'},
    item:   {p: [0, 0.02, 0.05], r: [-0.2, 0.4, 0], s: 0.9, euler: 'YXZ'},
    jetpack:{p: [0, 0.02, 0.06], r: [0.2, 0.6, 0], s: 0.7, euler: 'YXZ'},
    remote: {p: [0, 0.02, 0.04], r: [0.3, 0, 0], s: 0.9, euler: 'YXZ'},
    key:    {p: [0, 0.02, 0.04], r: [0.2, Math.PI / 2, 0], s: 0.9, euler: 'YXZ'},
    shield: {p: [0, 0.02, 0.06], r: [0, 0.4, 0], s: 0.85, euler: 'YXZ'},
    other:  {p: [0, 0.02, 0.05], r: [-0.3, 0, 0], s: 0.9, euler: 'YXZ'}
  };
  // Every holdable tool and common held item the game can put in a hand.
  // Removed recipes (wood shovel / some hoes) stay listed so a leftover item still poses.
  U.CATALOG = [
    {id:40, kind:'pick', name:'Wood pickaxe', mat:'wood'},
    {id:41, kind:'pick', name:'Stone pickaxe', mat:'stone'},
    {id:92, kind:'pick', name:'Iron pickaxe', mat:'iron'},
    {id:96, kind:'pick', name:'Gold pickaxe', mat:'gold'},
    {id:124, kind:'pick', name:'Diamond pickaxe', mat:'diamond'},
    {id:264, kind:'pick', name:'Cobalt pickaxe', mat:'cobalt'},
    {id:760, kind:'p760', name:'Blue crystal pickaxe', mat:'crystalblue'},
    {id:761, kind:'p761', name:'Purple crystal pickaxe', mat:'crystalpurple'},
    {id:44, kind:'axe', name:'Wood axe', mat:'wood'},
    {id:45, kind:'axe', name:'Stone axe', mat:'stone'},
    {id:93, kind:'axe', name:'Iron axe', mat:'iron'},
    {id:97, kind:'axe', name:'Gold axe', mat:'gold'},
    {id:125, kind:'axe', name:'Diamond axe', mat:'diamond'},
    {id:265, kind:'axe', name:'Cobalt axe', mat:'cobalt'},
    {id:42, kind:'sword', name:'Wood sword', mat:'wood'},
    {id:43, kind:'sword', name:'Stone sword', mat:'stone'},
    {id:94, kind:'sword', name:'Iron sword', mat:'iron'},
    {id:98, kind:'sword', name:'Gold sword', mat:'gold'},
    {id:126, kind:'sword', name:'Diamond sword', mat:'diamond'},
    {id:266, kind:'sword', name:'Cobalt sword', mat:'cobalt'},
    {id:185, kind:'claymore', name:'Claymore', mat:'iron'},
    {id:217, kind:'sword', name:'Silver sword', mat:'iron'},
    {id:100, kind:'shovel', name:'Wood shovel', mat:'wood'},
    {id:101, kind:'shovel', name:'Stone shovel', mat:'stone'},
    {id:102, kind:'shovel', name:'Iron shovel', mat:'iron'},
    {id:103, kind:'shovel', name:'Gold shovel', mat:'gold'},
    {id:127, kind:'shovel', name:'Diamond shovel', mat:'diamond'},
    {id:267, kind:'shovel', name:'Cobalt shovel', mat:'cobalt'},
    {id:46, kind:'hoe', name:'Wood hoe', mat:'wood'},
    {id:47, kind:'hoe', name:'Stone hoe', mat:'stone'},
    {id:95, kind:'hoe', name:'Iron hoe', mat:'iron'},
    {id:99, kind:'hoe', name:'Gold hoe', mat:'gold'},
    {id:128, kind:'hoe', name:'Diamond hoe', mat:'diamond'},
    {id:268, kind:'hoe', name:'Cobalt hoe', mat:'cobalt'},
    {id:11, kind:'stick', name:'Stick', mat:'wood'},
    {id:116, kind:'flint', name:'Flint and steel', mat:'iron'},
    {id:117, kind:'shears', name:'Shears', mat:'iron'},
    {id:212, kind:'pistol', name:'Highland pistol', mat:'iron'},
    {id:213, kind:'musket', name:'Highland musket', mat:'iron'},
    {id:410, kind:'map', name:'Map', mat:'paper'},
    {id:39, kind:'bucket', name:'Wooden bucket', mat:'wood'},
    {id:48, kind:'bucket', name:'Water bucket', mat:'wood'},
    {id:201, kind:'bucket', name:'Lava bucket', mat:'wood'},
    {id:67, kind:'torch', name:'Torch', mat:'wood'},
    {id:257, kind:'torch', name:'Unlit torch', mat:'wood'},
    {id:291, kind:'jetpack', name:'Jetpack', mat:'metal'},
    {id:777, kind:'jetpack', name:'Golden Jetpack', mat:'gold'},
    {id:140, kind:'remote', name:'TV Remote', mat:'plastic'},
    {id:326, kind:'drink', name:'Quaich', mat:'metal'},
    {id:119, kind:'drink', name:'Brew', mat:'glass'},
    {id:121, kind:'drink', name:'Iron Brew', mat:'glass'},
    {id:12, kind:'block', name:'Cobblestone', mat:'stone'},
    {id:188, kind:'item', name:'Highland Flare', mat:'item'},
    {id:905, kind:'key', name:'Time Box Key', mat:'metal'},
    {id:186, kind:'shield', name:'Targe shield', mat:'wood'},
    {id:35, kind:'item', name:'Bread', mat:'food'}
  ];
  const KIND_BY_ID = Object.create(null);
  U.CATALOG.forEach(e => { KIND_BY_ID[e.id] = e; });
  const HAFT = new Set(['pick','axe','shovel','hoe','sword','claymore','shears','flint','stick','p761','p760']);
  U.HAFT = HAFT;
  U.entry = id => KIND_BY_ID[parseInt(id, 10)] || null;
  function kindOf(mesh, id) {
    if (!mesh && id == null) return 'other';
    const hid = id != null ? parseInt(String(id).split(':')[0], 10) : (mesh && mesh.userData && (mesh.userData.heldId || mesh.userData.pose37));
    const fromCat = KIND_BY_ID[hid];
    if (fromCat) return fromCat.kind;
    if (mesh && mesh.userData) {
      if (mesh.userData.p761 || mesh.userData.crystalPick === 'purple') return 'p761';
      if (mesh.userData.p760 || mesh.userData.crystalPick === 'blue') return 'p760';
      if (mesh.userData.map) return 'map';
      if (mesh.userData.gun) {
        const g = mesh.userData.gun;
        if (typeof IT !== 'undefined' && IT.PISTOL && g === IT.PISTOL) return 'pistol';
        if (typeof IT !== 'undefined' && IT.MUSKET && g === IT.MUSKET) return 'musket';
        if (g === 212 || g === 13 || /pistol/i.test(String(mesh.userData.gunName || ''))) return 'pistol';
        return 'musket';
      }
      if (mesh.userData.bucket) return 'bucket';
      if (mesh.userData.torch) return 'torch';
      if (mesh.userData.block) return 'block';
      if (mesh.userData.kind && U.POSE[mesh.userData.kind]) return mesh.userData.kind;
      if (mesh.userData.tool && mesh.userData.kind) return mesh.userData.kind;
      if (mesh.userData.tool) return 'pick';
    }
    if (typeof TOOL !== 'undefined' && hid && TOOL[hid] && TOOL[hid][0]) return TOOL[hid][0];
    return 'other';
  }
  U.kindOf = kindOf;
  function applyPose(mesh, pose) {
    if (!mesh || !pose) return;
    mesh.position.set(pose.p[0], pose.p[1], pose.p[2]);
    mesh.rotation.order = pose.euler || 'YXZ';
    mesh.rotation.set(pose.r[0], pose.r[1], pose.r[2]);
    const s = pose.s;
    if (typeof s === 'number') mesh.scale.setScalar(s);
    else mesh.scale.set(s[0], s[1], s[2]);
    mesh.visible = true;
    mesh.traverse(o => { if (o.isMesh) { o.visible = true; o.frustumCulled = false; } });
  }
  U.applyPose = applyPose;
  U.paintCrystalPick = function (root, tone) {
    if (!root) return root;
    const purple = tone !== 'blue';
    root.userData[purple ? 'p761' : 'p760'] = 1;
    root.userData.crystalPick = purple ? 'purple' : 'blue';
    root.userData.tool = true;
    root.userData.kind = 'pick';
    const col = purple ? (0xa64dff) : 0x3ab8ff, mapCol = purple ? 0xc090ff : 0x9ad8ff, em = purple ? 0x4a1078 : 0x0a3a66;
    // Keep the prism pick thin — never the chunky grey survival pick silhouette.
    try { root.scale.set(0.72, 1.05, 0.55); } catch (_) {}
    root.userData.held1245CrystalPrism = purple ? 'purple' : 'blue';
    root.traverse(o => {
      if (!o.isMesh || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m || !m.color) continue;
        const c = m.color, isWood = c.r > 0.25 && c.g > 0.12 && c.g < 0.55 && c.b < 0.28 && c.r > c.b + 0.08 && c.r >= c.g;
        if (isWood) continue;
        if (!m.userData) m.userData = {};
        if (m.userData.held1240Crystal === (purple ? 'p' : 'b')) continue;
        m.userData.held1240Crystal = purple ? 'p' : 'b';
        if (m.map) m.color.setHex(mapCol);
        else m.color.setHex(col);
        if ('emissive' in m) m.emissive.setHex(em);
        if ('specular' in m) m.specular = new T.Color(purple ? 0xffd8ff : 0xd8f0ff);
        if ('shininess' in m) m.shininess = Math.max(m.shininess || 0, 140);
        m.needsUpdate = true;
      }
    });
    return root;
  };
  U.buildMapCard = function (tex) {
    const g = new T.Group(); g.userData.map = true; g.userData.held1240Map = 1;
    const cover = new T.Mesh(new T.BoxGeometry(0.22, 0.015, 0.22), new T.MeshPhongMaterial({color: 0x8a6a38, shininess: 20}));
    const face = new T.Mesh(new T.PlaneGeometry(0.2, 0.2), new T.MeshLambertMaterial({color: 0xe8d6a8, side: T.DoubleSide}));
    face.position.y = 0.009; face.rotation.x = -Math.PI / 2;
    if (tex) { face.material.map = tex; face.material.color.setHex(0xffffff); face.material.needsUpdate = true; }
    const back = new T.Mesh(new T.PlaneGeometry(0.2, 0.2), new T.MeshLambertMaterial({color: 0xd9c48a, side: T.DoubleSide}));
    back.position.y = -0.009; back.rotation.x = Math.PI / 2;
    g.add(cover, face, back);
    return g;
  };
  function ensureMapMesh(mesh) {
    if (!mesh) return mesh;
    mesh.userData.map = true;
    let has = false;
    mesh.traverse(o => { if (o.isMesh) has = true; });
    if (!has) {
      let tex = null;
      try { if (W.__c112 && W.__c112.TX) { tex = new T.CanvasTexture(W.__c112.TX); } } catch (_) {}
      mesh.add(U.buildMapCard(tex));
    }
    return mesh;
  }
  U.ensureMapMesh = ensureMapMesh;
  function copySocketToGrip(grip, socket) {
    if (!grip || !socket || !grip.parent) return;
    grip.parent.updateWorldMatrix(true, false);
    socket.updateWorldMatrix(true, false);
    const wp = socket.getWorldPosition(V()), wq = socket.getWorldQuaternion(Q());
    grip.position.copy(grip.parent.worldToLocal(wp.clone()));
    const pq = grip.parent.getWorldQuaternion(Q()).invert();
    grip.quaternion.copy(pq.multiply(wq));
    grip.updateMatrix(); grip.updateWorldMatrix(false, true);
  }
  U.copySocketToGrip = copySocketToGrip;
  function prepareItem(mesh, kind, id) {
    if (!mesh) return kind;
    const k = kind || kindOf(mesh, id);
    if (k === 'p761') U.paintCrystalPick(mesh, 'purple');
    else if (k === 'p760') U.paintCrystalPick(mesh, 'blue');
    if (k === 'map') ensureMapMesh(mesh);
    return k;
  }
  U.prepareItem = prepareItem;
  U.placeItem = function (socket, mesh, kind, id) {
    if (!socket || !mesh) return null;
    const k = prepareItem(mesh, kind, id);
    if (mesh.parent !== socket) socket.add(mesh);
    applyPose(mesh, U.POSE[k] || U.POSE.other);
    mesh.userData.held1240Kind = k;
    mesh.visible = true;
    return {socket, mesh, kind: k};
  };
  U.poseHeld = function (model, opts) {
    opts = opts || {};
    const p = model && model.userData && model.userData.pilot;
    if (!p || !p.near) return null;
    const slot = opts.slot == null ? 1 : opts.slot;
    const socket = find(p.near.root, 'weapon_grip_slot' + slot);
    const arms = model.userData.arms;
    const grip = arms && arms[slot] && arms[slot].userData && arms[slot].userData.grip;
    if (socket && grip) copySocketToGrip(grip, socket);
    let mesh = opts.mesh || (slot === 1 ? (typeof heldMesh3p !== 'undefined' ? heldMesh3p : opts.heldMesh3p) : opts.mesh);
    // Fall back to the first-person held child clone source when 3p mesh is missing.
    if (!mesh && slot === 1) {
      try { if (typeof held !== 'undefined' && held && held.children[0]) mesh = held.children[0]; } catch (_) {}
    }
    if (!mesh || !socket) return {socket, grip, mesh, kind: null};
    const id = opts.heldId != null ? opts.heldId : (typeof heldId !== 'undefined' ? heldId : (typeof selId !== 'undefined' ? selId : null));
    const kind = opts.kind || kindOf(mesh, id);
    prepareItem(mesh, kind, id);
    mesh.visible = true;
    const info = Object.assign({grip}, U.placeItem(socket, mesh, kind, id));
    U.last = info; U.on = 1;
    return info;
  };
  U.poseHeldFp = function (fp, mesh, kind, heldId) {
    if (!fp || !mesh) return null;
    const bone = fp.userData.held1240Bone || (n => find(fp, n));
    const socket = bone('weapon_grip_slot1') || find(fp, 'weapon_grip_slot1');
    if (!socket) return null;
    const k = kind || kindOf(mesh, heldId);
    // Gun viewmodels keep ownership of first-person pistol / musket pose.
    const vmOn = !!(W.__vm && (W.__vm.on || W.__vm.HS0));
    if ((k === 'pistol' || k === 'musket') && vmOn) return {socket, mesh, kind: k, skipped: 'viewmodel'};
    return U.placeItem(socket, mesh, k, heldId);
  };
  function nodeKind(o) {
    for (let p = o; p; p = p.parent) {
      const n = p.name || '';
      if (n === 'gear_chest_slot0' || n === 'gear_chest_slot1' || /^gear_chest_slot[01](_|$)/.test(n)) return 'gear';
      if (n === 'visual_arm_slot0_hand' || n === 'visual_arm_slot1_hand' || /^visual_arm_slot[01]_hand/.test(n)) return 'arm';
    }
    return null;
  }
  function armKeep(o) { return !!nodeKind(o); }
  function setArmourArms(root, on) {
    if (!root) return;
    root.traverse(o => {
      if (!o.isMesh && !o.isSkinnedMesh) return;
      const kind = nodeKind(o);
      if (kind === 'gear') o.visible = !!on;
      else if (kind === 'arm') o.visible = true;
      else o.visible = false;
    });
  }
  U.setArmourArms = setArmourArms;
  U.buildFpArms = function (template) {
    if (!template) return null;
    const src = template.scene || template.root || template;
    const clone = (T.SkeletonUtils && T.SkeletonUtils.clone) ? T.SkeletonUtils.clone(src) : src.clone(true);
    clone.name = 'Held1240FpArms';
    clone.traverse(o => {
      o.matrixAutoUpdate = true;
      if (o.isMesh || o.isSkinnedMesh) {
        o.frustumCulled = false;
        o.castShadow = false;
        o.visible = armKeep(o) || armKeep(o.parent || {name: ''});
        // region node may be the parent of the skinned mesh
        let p = o; let keep = armKeep(o);
        while (p && !keep) { p = p.parent; if (p) keep = armKeep(p); }
        o.visible = !!keep;
      }
    });
    const bones = {};
    clone.traverse(o => { if (o.isBone || (o.name && /^(upper_arm|forearm|hand|clavicle|finger|thumb|weapon_grip)/.test(o.name))) bones[o.name] = o; });
    const bone = n => bones[n] || (T.PropertyBinding && bones[T.PropertyBinding.sanitizeNodeName(n)]) || find(clone, n);
    clone.userData.held1240Bones = bones;
    clone.userData.held1240Bone = bone;
    return clone;
  };
  // Camera-space first-person poses: character clone is Y-rotated 180° so it
  // faces the camera look (-Z), with the skull at the camera origin.
  U.FP_TARGETS = {
    // Camera looks down -Z. Slot1 (hand.L, the production held hand) appears
    // on the left of the view after the Y=180 character flip; raise it into
    // the lower frame so tools stay visible. Guns still yield to __vm.
    pickaxe: {R: [0.20, -0.26, -0.42], L: [-0.18, -0.12, -0.32]},
    map:     {R: [0.14, -0.16, -0.32], L: [-0.14, -0.16, -0.32]},
    pistol:  {R: [0.10, -0.18, -0.34], L: [-0.16, -0.12, -0.30]},
    musket:  {R: [0.08, -0.16, -0.38], L: [-0.12, -0.12, -0.32]},
    swim:    {R: [0.22, -0.16, -0.36], L: [-0.22, -0.16, -0.36]},
    empty:   {R: [0.22, -0.22, -0.38], L: [-0.22, -0.22, -0.38]}
  };
  function worldRotation(b, q) {
    if (!b || !b.parent) return;
    b.parent.updateWorldMatrix(true, false);
    b.quaternion.copy(b.parent.getWorldQuaternion(Q()).invert().multiply(q));
    b.updateMatrix(); b.updateWorldMatrix(false, true);
  }
  function aimBone(bone, from, to, restDir) {
    if (!bone) return;
    const dir = to.clone().sub(from); if (dir.lengthSq() < 1e-8) return;
    dir.normalize();
    const q = Q().setFromUnitVectors(restDir || new T.Vector3(0, 1, 0), dir);
    worldRotation(bone, q);
  }
  U.applyFpIk = function (fp, kind, phase) {
    if (!fp) return;
    const bone = fp.userData.held1240Bone || (n => find(fp, n));
    const targets = U.FP_TARGETS[kind] || U.FP_TARGETS.empty;
    fp.updateMatrixWorld(true);
    const rootQ = fp.getWorldQuaternion(Q());
    const restY = new T.Vector3(0, -1, 0); // arm bones' +Y points down the limb in this rig
    function reach(side, target) {
      if (!target) return;
      const upper = bone('upper_arm.' + side) || bone('upper_arm' + side), fore = bone('forearm.' + side) || bone('forearm' + side), hand = bone('hand.' + side) || bone('hand' + side);
      if (!upper || !fore) return;
      const start = upper.getWorldPosition(V());
      const goal = V().set(target[0], target[1], target[2]);
      // goal is in the fp root's parent (camera) space; convert to world
      if (fp.parent) goal.applyMatrix4(fp.parent.matrixWorld);
      const l1 = fore.getWorldPosition(V()).distanceTo(start) || 0.24;
      const l2 = (hand ? hand.getWorldPosition(V()).distanceTo(fore.getWorldPosition(V())) : 0.23) || 0.23;
      const delta = goal.clone().sub(start), distance = delta.length();
      const L = Math.max(0.01, Math.min(distance, l1 + l2 - 0.002));
      const dir = delta.normalize();
      const ca = Math.max(-1, Math.min(1, (l1 * l1 + L * L - l2 * l2) / (2 * l1 * L)));
      const pole = new T.Vector3(side === 'L' ? 0.4 : -0.4, -1, -0.2);
      if (fp.parent) pole.transformDirection(fp.parent.matrixWorld);
      const perp = pole.addScaledVector(dir, -pole.dot(dir));
      if (perp.lengthSq() < 1e-8) perp.set(0, 0, 1);
      perp.normalize();
      const elbow = start.clone().addScaledVector(dir, l1 * ca).addScaledVector(perp, l1 * Math.sqrt(Math.max(0, 1 - ca * ca)));
      // rest +Y of the bone is down the arm, so aim that at the next joint
      const rest = new T.Vector3(0, 1, 0);
      function aim(b, toPt, fromPt) {
        const d = toPt.clone().sub(fromPt); if (d.lengthSq() < 1e-10) return;
        d.normalize();
        // Bone +Y should point toward the child (down the limb)
        worldRotation(b, Q().setFromUnitVectors(new T.Vector3(0, 1, 0), d));
      }
      aim(upper, elbow, start);
      const actualElbow = fore.getWorldPosition(V());
      aim(fore, goal, actualElbow);
      if (hand) {
        hand.updateWorldMatrix(true, true);
        const sock = bone('weapon_grip_slot' + (side === 'L' ? '1' : '0'));
        // a slight inward roll so the palm faces the item
        const roll = (side === 'L' ? -1 : 1) * 0.35;
        if (sock) sock.updateWorldMatrix(true, true);
      }
    }
    if (targets.R) reach('R', targets.R);
    if (targets.L) reach('L', targets.L);
    // swim: add a stroke offset
    if (kind === 'swim' && phase != null) {
      const c = (phase % (Math.PI * 2)) / (Math.PI * 2);
      const reachAmt = c < 0.35 ? c / 0.35 : c < 0.75 ? 1 - (c - 0.35) / 0.4 : 0;
      const sweep = c < 0.35 ? 0 : c < 0.75 ? (c - 0.35) / 0.4 : 1 - (c - 0.75) / 0.25;
      if (targets.R) reach('R', [0.12 + sweep * 0.28, -0.26 + reachAmt * 0.08, -0.32 - reachAmt * 0.28 + sweep * 0.1]);
      if (targets.L) reach('L', [-(0.12 + sweep * 0.28), -0.26 + reachAmt * 0.08, -0.32 - reachAmt * 0.28 + sweep * 0.1]);
    }
    fp.updateMatrixWorld(true);
    U.fpKind = kind;
  };
  U.installFpOnCamera = function (camera, template, armourOn) {
    if (!camera || !template) return null;
    let fp = camera.getObjectByName('Held1240FpArms');
    if (!fp) {
      fp = U.buildFpArms(template);
      if (!fp) return null;
      fp.position.set(0, -1.55, 0.05);
      fp.rotation.set(0, Math.PI, 0);
      camera.add(fp);
    }
    setArmourArms(fp, armourOn);
    return fp;
  };
  function hideProceduralFp() {
    // 1.2.44: no longer retire the working procedural arms. Keep __fpa / mcArm /
    // fist / armMesh driving animations and showing held items. Hide the unused
    // Held1240FpArms clone so it cannot cover or steal the held group.
    try { W.__fpaOff = 0; } catch (_) {}
    try {
      const cam = (typeof camera !== 'undefined') ? camera : W.camera;
      if (cam) {
        const fp = cam.getObjectByName && cam.getObjectByName('Held1240FpArms');
        if (fp) { fp.visible = false; fp.traverse(o => { if (o.isMesh || o.isSkinnedMesh) o.visible = false; }); }
      }
    } catch (_) {}
  }
  U.hideProceduralFp = hideProceduralFp;

  function avgMapColor(map) {
    try {
      const im = map && map.image;
      if (!im) return null;
      const w = im.width || 0, h = im.height || 0;
      if (!w || !h) return null;
      let ctx = null, data = null;
      if (typeof im.getContext === 'function') {
        ctx = im.getContext('2d'); data = ctx.getImageData(0, 0, w, h).data;
      } else if (im.data && im.data.length) {
        data = im.data;
      }
      if (!data) return null;
      let r = 0, g = 0, b = 0, n = 0;
      const step = Math.max(4, Math.floor(data.length / 4 / 4000) * 4);
      for (let i = 0; i + 3 < data.length; i += step) {
        if (data[i + 3] < 200) continue;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
      if (!n) return null;
      return new T.Color(r / n / 255, g / n / 255, b / n / 255);
    } catch (_) { return null; }
  }
  function sampleCharacterLooks(template) {
    const looks = {skin: null, sleeve: null};
    if (!template) return looks;
    const skinNames = /visual_arm_slot[01]_hand|GLOVE_|hand|palm|finger|skin|anatomical/i;
    const sleeveNames = /visual_torso_outfit|sleeve|shirt|linen|cloth|fabric/i;
    const skipArmour = /crystal|armour|armor|metal|vambrace|gauntlet|pauldr|gear_chest|gear_helmet|gear_legs|gear_boots|harness|jetpack|pack/i;
    let skinBest = null, sleeveBest = null;
    template.traverse(o => {
      if (!(o.isMesh || o.isSkinnedMesh) || !o.material) return;
      const n = String(o.name || '');
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m || !m.color) continue;
        let c = m.color.clone();
        // Authored glTF often keeps colour at white and puts the look in the map.
        if (m.map && c.r > 0.95 && c.g > 0.95 && c.b > 0.95) {
          const avg = avgMapColor(m.map);
          if (avg) c = avg;
        }
        const entry = {map: m.map || null, color: c.clone(), roughness: m.roughness, metalness: m.metalness, name: n};
        const skinLike = c.r > 0.45 && c.g > 0.28 && c.b > 0.18 && c.r > c.b && c.r >= c.g - 0.05 && c.g > c.b;
        const creamLike = c.r > 0.62 && c.g > 0.55 && c.b > 0.42 && Math.abs(c.r - c.g) < 0.18 && c.r >= c.b;
        if (skinNames.test(n) || skinLike) {
          if (!skinBest || skinNames.test(n)) skinBest = entry;
        }
        if (!skipArmour.test(n) && sleeveNames.test(n)) {
          const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
          if (lum < 0.28) continue;
          const score = (/visual_torso_outfit/.test(n) ? 2 : 0) + (creamLike ? 1 : 0) + lum;
          entry._score = score;
          if (!sleeveBest || score >= (sleeveBest._score || 0)) sleeveBest = entry;
        }
      }
    });
    // Fallbacks matching the scottish cream shirt / warm skin if sampling missed.
    if (!looks.skin) {/* filled below */}
    looks.skin = skinBest || {map: null, color: new T.Color(0xd4a07a), name: 'fallback-skin'};
    looks.sleeve = sleeveBest || {map: null, color: new T.Color(0xe9e2d4), name: 'fallback-cream'};
    return looks;
  }

  function applyMat(dst, src, fallbackHex) {
    if (!dst) return;
    try {
      // Procedural box / limb arms rarely share the character UV layout, so prefer
      // the sampled colour (from the map average or material) over assigning the
      // character map, which would otherwise read as flat white / wrong texels.
      if (src && src.color) { dst.map = null; dst.color.copy(src.color); }
      else if (fallbackHex != null && dst.color) { dst.map = null; dst.color.setHex(fallbackHex); }
      if (src && src.roughness != null && dst.roughness != null) dst.roughness = src.roughness;
      if (src && src.metalness != null && dst.metalness != null) dst.metalness = src.metalness;
      dst.needsUpdate = true;
    } catch (_) {}
  }

  U.retextureProceduralArms = function (template) {
    if (U._retexDone && !template) return U._retexDone;
    const looks = sampleCharacterLooks(template || (W.__pilot1235 && W.__pilot1235.templates && W.__pilot1235.templates[0]));
    U._looks = looks;
    // Classic box fist / sleeve
    try {
      if (typeof armMat !== 'undefined' && armMat) applyMat(armMat, looks.skin, 0xd4a07a);
      if (typeof sleeveMat !== 'undefined' && sleeveMat) applyMat(sleeveMat, looks.sleeve, 0xe9e2d4);
      if (typeof fist !== 'undefined' && fist) fist.visible = fist.visible;
      if (typeof armMesh !== 'undefined' && armMesh) armMesh.visible = armMesh.visible;
    } catch (_) {}
    // mcArm cuboid materials
    try {
      if (typeof window !== 'undefined' && window.mcArm) {
        window.mcArm.traverse(o => {
          if (!o.isMesh || !o.material) return;
          const m = o.material;
          // forearm+fist cuboid uses skin; second box is sleeve if present
          const n = String(o.name || '');
          if (/sleeve|shirt|cloth/i.test(n)) applyMat(m, looks.sleeve, 0xe9e2d4);
          else applyMat(m, looks.skin, 0xd4a07a);
        });
      }
    } catch (_) {}
    // HD __fpa materials (skinM / shirtM closed over in that IIFE — reach via meshes)
    try {
      const rig = W.__fpa && W.__fpa.rig && W.__fpa.rig();
      if (rig) {
        rig.traverse(o => {
          if (!o.isMesh || !o.material) return;
          const m = o.material;
          const n = String(o.name || '');
          // Heuristic: shirt/sleeve meshes are larger limb boxes; hands are smaller
          const box = o.geometry && o.geometry.boundingBox;
          try { if (o.geometry && !o.geometry.boundingBox) o.geometry.computeBoundingBox(); } catch (_) {}
          const bb = o.geometry && o.geometry.boundingBox;
          let isHand = /hand|palm|finger|wrist/i.test(n);
          if (!isHand && bb) {
            const s = bb.getSize(new T.Vector3());
            if (s.x < 0.12 && s.y < 0.14 && s.z < 0.08) isHand = true;
          }
          if (isHand) applyMat(m, looks.skin, 0xd4a07a);
          else applyMat(m, looks.sleeve, 0xe9e2d4);
        });
      }
    } catch (_) {}
    U._retexDone = {skin: !!(looks.skin), sleeve: !!(looks.sleeve)};
    return U._retexDone;
  };

  function currentFpKind() {
    try {
      if (typeof window !== 'undefined' && window.__swimHide) return 'swim';
      if (typeof window !== 'undefined' && window.swimDeep && typeof camMode !== 'undefined' && !camMode) return 'swim';
    } catch (_) {}
    try {
      const id = typeof heldId !== 'undefined' ? parseInt(heldId, 10) : (typeof selId !== 'undefined' ? selId : 0);
      const mesh = (typeof held !== 'undefined' && held && held.children[0]) || (typeof heldMesh3p !== 'undefined' && heldMesh3p);
      const k = kindOf(mesh, id);
      if (k === 'p761' || k === 'p760' || k === 'pick' || k === 'axe' || k === 'shovel' || k === 'hoe' || k === 'stick') return 'pickaxe';
      if (k === 'sword' || k === 'claymore' || k === 'shears' || k === 'flint') return 'pickaxe';
      if (k === 'map' || k === 'pistol' || k === 'musket') return k;
    } catch (_) {}
    return 'empty';
  }
  function chestArmourOn() {
    try {
      if (typeof armour !== 'undefined' && armour && armour[1]) return true;
    } catch (_) {}
    return false;
  }
  U.stepFp = function (dt) {
    // 1.2.45: ArmSwitch1245 owns the visible Scottish GLB arms on __fpa drivers.
    // Keep Held1240FpArms hidden; never set __fpaOff.
    try { W.__fpaOff = 0; } catch (_) {}
    const cam = (typeof camera !== 'undefined') ? camera : W.camera;
    if (!cam) return;
    const fp = cam.getObjectByName && cam.getObjectByName('Held1240FpArms');
    if (fp) {
      fp.visible = false;
      try { fp.traverse(o => { if (o.isMesh || o.isSkinnedMesh) o.visible = false; }); } catch (_) {}
    }
    try {
      const runtime = W.__pilot1235;
      if (runtime && runtime.templates && runtime.templates[0] && !U._retexDone) {
        U.retextureProceduralArms(runtime.templates[0]);
      }
    } catch (e) { if (!U.err) U.err = 'retex: ' + (e && e.message || e); }
    // Ensure held stays under the procedural fist / armPivot / hand — never under Held1240FpArms.
    try {
      if (typeof held !== 'undefined' && held) {
        let p = held.parent, underNew = false;
        while (p) { if (p.name === 'Held1240FpArms') { underNew = true; break; } p = p.parent; }
        if (underNew) {
          const host = (typeof armPivot !== 'undefined' && armPivot) || (typeof hand !== 'undefined' && hand) || null;
          if (host) host.add(held);
        }
      }
    } catch (_) {}
    U.fpOn = 0;
    U.fpKind = currentFpKind();
  };
  U.install = function () {
    const runtime = W.__pilot1235;
    if (!runtime || runtime.__held1240Hooked) { if (runtime && runtime.__held1240Hooked) return U; }
    if (runtime) {
      runtime.__held1240Hooked = 1;
      const prev = runtime.sync;
      runtime.sync = function (model) {
        const r = prev.apply(this, arguments);
        try { U.poseHeld(model); } catch (e) { if (!U.err) U.err = String(e && e.message || e); }
        return r;
      };
    }
    try {
      if (typeof makeItemMesh === 'function') {
        const mi = makeItemMesh;
        makeItemMesh = function (id) {
          const g = mi.apply(this, arguments);
          try {
            const k = kindOf(g, id);
            if (k === 'p761' || (typeof IT !== 'undefined' && id === IT.PCPICK) || id === 761) U.paintCrystalPick(g, 'purple');
            if (k === 'p760' || (typeof IT !== 'undefined' && id === IT.BCPICK) || id === 760) U.paintCrystalPick(g, 'blue');
            if (k === 'map' || (typeof IT !== 'undefined' && id === IT.MAP) || id === 410) U.ensureMapMesh(g);
          } catch (_) {}
          return g;
        };
      }
    } catch (e) { if (!U.err) U.err = 'wrap makeItemMesh: ' + e; }
    try {
      const hook = fn => {
        const prev = fn;
        return function () {
          const r = prev.apply(this, arguments);
          try { U.stepFp(typeof arguments[0] === 'number' ? arguments[0] : 0.016); } catch (e) { if (!U.err) U.err = String(e && e.message || e); }
          return r;
        };
      };
      if (typeof updateHand === 'function') updateHand = hook(updateHand);
      else if (typeof updatePlayer === 'function') updatePlayer = hook(updatePlayer);
    } catch (e) { if (!U.err) U.err = 'wrap step: ' + e; }
    return U;
  };
  if (W.__pilot1235) U.install();
  else {
    // Install is injected after installApprovedPilotV1, so the runtime exists.
    // If this file is evaluated first in a test, the test calls U.install().
  }
})(typeof window !== 'undefined' ? window : this);
