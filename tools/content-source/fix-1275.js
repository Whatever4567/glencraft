/* GLX-FIX1275 (v1.2.75): guns restored to how they were in 1.2.73.
   1.2.74 wrapped held-frame apply/repose, wrapped renderer.render, and
   ran a rAF that called C112.frame() and afterApply on every item,
   including the Highland pistol and musket. Those wraps are gone.
   This IIFE never touches a gun, musket, sword, or any other weapon:
   it only runs for the pickaxe, crystal picks, bucket, torch and map.

   The 1.2.74 stable-pose snapshot is dropped. It froze the first
   seated pose, which for the pickaxe was already off-screen, so the
   tool sat up and away. Those tools now use the same grip path as a
   potion (kind "other"): seatItem is not used, the item keeps its
   rest pose plus the existing ITEM_NUDGE, so it stays in the hand
   on-screen and does not chase the palm. The pickaxe head stays on
   the handle. The held map is still the live C112 chart (position,
   heading, marker), tilted up and close, in the current palm pose.
   First-person hands stay hidden in third person. The gold D-pad
   is left alone. */
(function fix1275() {
  const U = window.__fix1275 = {
    err: null, on: 1, version: '1.2.75',
    potionPath: 0, bladeLock: 0, mapSeat: 0, skippedGun: 0,
    lastKind: '', lastWhy: ''
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  const TOOL_KINDS = { pick: 1, p761: 1, p760: 1, bucket: 1, torch: 1 };
  const PICK_KINDS = { pick: 1, p761: 1, p760: 1 };
  const POTION_GRIP_KEYS = ['pick', 'p761', 'p760', 'bucket', 'torch'];
  const THREE_ = () => (typeof THREE !== 'undefined' && THREE) || window.THREE || null;

  function selIdNow() {
    try { if (typeof selId !== 'undefined') return selId; } catch (_) {}
    return null;
  }

  /* ---- identity checks: guns first, then a tight whitelist ---- */
  function isWeapon() {
    try {
      const id = selIdNow();
      if (id == null) return false;
      if (typeof GUN !== 'undefined' && GUN && GUN[id]) return true;
      if (id === 212 || id === 213) return true;
      const IT_ = (typeof IT !== 'undefined') ? IT : {};
      if (IT_.PISTOL && id === IT_.PISTOL) return true;
      if (IT_.MUSKET && id === IT_.MUSKET) return true;
      /* Any other firearm or named blade / bow: still a weapon. */
      const names = ['ISWORD', 'SSWORD', 'WSWORD', 'DSWORD', 'GSWORD', 'CSWORD', 'SWORD',
        'CLAYMORE', 'BOW', 'CROSSBOW', 'DAXE', 'IAXE', 'WAXE', 'SAXE', 'GAXE', 'CAXE', 'AXE'];
      for (let i = 0; i < names.length; i++) {
        if (IT_[names[i]] && id === IT_[names[i]]) return true;
      }
      const k = kindQuick();
      if (k === 'pistol' || k === 'musket' || k === 'sword' || k === 'claymore' || k === 'axe') return true;
    } catch (e) { ERR('weap?', e); }
    return false;
  }

  function isToolId(id) {
    if (id == null) return false;
    try {
      const IT_ = (typeof IT !== 'undefined') ? IT : {};
      if (id === IT_.TORCH || id === 67) return true;
      if (id === IT_.BUCKET || id === IT_.WATERB || id === 39 || id === 48) return true;
      if (id === IT_.PCPICK || id === 761) return true;
      if (id === IT_.BCPICK || id === 760) return true;
      if (typeof TOOL === 'object' && TOOL[id] && TOOL[id][0] === 'pick') return true;
      const picks = ['WPICK', 'SPICK', 'IPICK', 'GPICK', 'DPICK', 'CPICK', 'PICK'];
      for (let i = 0; i < picks.length; i++) if (IT_[picks[i]] && id === IT_[picks[i]]) return true;
    } catch (_) {}
    return false;
  }

  function isMapId(id) {
    if (id == null) return false;
    try {
      if (id === 410) return true;
      if (typeof IT !== 'undefined' && IT.MAP && id === IT.MAP) return true;
    } catch (_) {}
    return false;
  }

  function kindQuick() {
    try {
      const H = window.__heldFrame1251;
      if (H && H.kind) return H.kind;
    } catch (_) {}
    return '';
  }

  function isTp() {
    try {
      if (window.__thirdPerson) return true;
      if (typeof camMode !== 'undefined' && camMode) return true;
    } catch (_) {}
    return false;
  }

  function heldMesh() {
    try { if (typeof held !== 'undefined' && held) return held; } catch (_) {}
    return null;
  }

  /* ---- potion grip path: drop seatItem for tools only ---- */
  function applyPotionPath() {
    try {
      const H = window.__heldFrame1251;
      const G = H && H.GRIP;
      if (!G) return;
      for (let i = 0; i < POTION_GRIP_KEYS.length; i++) {
        const k = POTION_GRIP_KEYS[i];
        if (Object.prototype.hasOwnProperty.call(G, k)) {
          try { delete G[k]; } catch (_) { try { G[k] = undefined; } catch (__) {} }
        }
      }
      /* Never touch pistol / sword / musket keys. */
      U.potionPath = 1;
    } catch (e) { ERR('potion', e); }
  }

  function clearSnapshot(g) {
    try {
      if (!g) return;
      if (g.userData) g.userData._freeze1274 = null;
      const mesh = g.children && g.children[0];
      if (mesh && mesh.userData) {
        if (mesh.userData._freeze1274) mesh.userData._freeze1274 = null;
        /* A 1.2.74 stable snapshot must not be restored. */
        if (mesh.userData._seatStable) mesh.userData._seatStable = null;
      }
    } catch (_) {}
  }

  /* ---- pickaxe head stays on the handle (no re-aim, no item move) ---- */
  function isBladeMesh(o) {
    if (!o || !o.isMesh) return false;
    const ud = o.userData || {};
    return !!(ud.fpHook1264 || ud.fpHook1263 || ud.fpHook1262 || ud.fpHook1265 || ud.crystalCore1249 || ud.noGrip);
  }
  function isHaftMesh(o) {
    if (!o || !o.isMesh) return false;
    const ud = o.userData || {};
    if (ud.fpHaftCyl1274 || ud.handle1249 || ud.fpHaft1274) return true;
    if (ud.fpSockMetal1274 || ud.fpSock1265) return false;
    const mat = o.material || {};
    const c = mat.color;
    const col = c && c.getHex && c.getHex();
    return col === 0x4a2c14 || col === 0x3a2412 || col === 0x5a3a1e || col === 0x6b4226;
  }

  function lockPickBlade() {
    const g = heldMesh();
    if (!g) return;
    const T = THREE_();
    if (!T) return;
    const slot = g.userData || (g.userData = {});
    const prev = slot._bladeLock1274;
    if (prev && prev.blade && prev.p) {
      try {
        if (prev.parent && prev.blade.parent !== prev.parent) {
          try { prev.parent.attach(prev.blade); } catch (_) { try { prev.parent.add(prev.blade); } catch (__) {} }
        }
        prev.blade.position.copy(prev.p);
        prev.blade.quaternion.copy(prev.q);
        if (prev.s) prev.blade.scale.copy(prev.s);
        if (prev.dups) {
          for (let i = 0; i < prev.dups.length; i++) {
            if (prev.dups[i] && prev.dups[i] !== prev.blade) prev.dups[i].visible = false;
          }
        }
      } catch (e) { ERR('bladeR', e); }
      return;
    }
    let blade = null, haft = null, dups = [];
    try {
      g.traverse(function (o) {
        if (!o.isMesh) return;
        if (isBladeMesh(o)) {
          if (!blade) blade = o;
          else dups.push(o);
        }
        if (!haft && isHaftMesh(o)) haft = o;
      });
    } catch (e) { ERR('bladeT', e); }
    if (!blade) return;
    const root = (haft && haft.parent) || (g.children && g.children[0]) || g;
    try {
      let under = false, n = blade;
      while (n) { if (n === root) { under = true; break; } n = n.parent; }
      if (!under && root) {
        try { root.attach(blade); } catch (_) { try { root.add(blade); } catch (__) {} }
      }
    } catch (e) { ERR('bladeP', e); }
    slot._bladeLock1274 = {
      blade: blade,
      parent: blade.parent || root,
      p: blade.position.clone(),
      q: blade.quaternion.clone(),
      s: blade.scale ? blade.scale.clone() : null,
      dups: dups
    };
    for (let i = 0; i < dups.length; i++) {
      try { dups[i].visible = false; } catch (_) {}
    }
    U.bladeLock++;
  }

  /* ---- live held map: only when the map is in hand ---- */
  const stash = { g: null };
  function ensureStash() {
    if (stash.g) return stash.g;
    const T = THREE_();
    if (!T) return null;
    stash.g = new T.Group();
    stash.g.name = 'mapStash1275';
    stash.g.visible = false;
    return stash.g;
  }

  function getLiveSheet(C) {
    if (C._sheet1274 && C._sheet1274.isObject3D) return C._sheet1274;
    try {
      if (C.inset && C.inset.parent && C.inset.parent.isMesh) {
        C._sheet1274 = C.inset.parent;
        return C._sheet1274;
      }
    } catch (_) {}
    const found = [];
    function search(root) {
      if (!root || !root.traverse) return;
      try {
        root.traverse(function (o) {
          if (!o.isMesh || !o.geometry) return;
          const t = o.geometry.type || '';
          if (!/Plane/.test(t)) return;
          if (o.material && (o.material.map || (o.children && o.children.length))) found.push(o);
        });
      } catch (_) {}
    }
    search(C.g);
    found.sort(function (a, b) { return (b.children ? b.children.length : 0) - (a.children ? a.children.length : 0); });
    if (found[0]) C._sheet1274 = found[0];
    return C._sheet1274 || null;
  }

  function hideDecor(h) {
    try {
      h.traverse(function (o) {
        const ud = o.userData || {};
        if (ud.held1240Map || ud.art1249) o.visible = false;
      });
    } catch (_) {}
  }

  function toCanvas(C, x, z) {
    const IN = 40, SZ = 1024 - 2 * IN;
    let Wd = 320, Dd = 320;
    try { if (typeof W !== 'undefined') Wd = W; } catch (_) {}
    try { if (typeof D !== 'undefined') Dd = D; } catch (_) {}
    try {
      const u = window.__c345 && __c345.uk;
      if (u && u.done) return [IN + (x - u.X0) / u.S * SZ, IN + (z - u.Z0) / u.S * SZ];
    } catch (_) {}
    return [IN + x / Wd * SZ, IN + z / Dd * SZ];
  }

  function ensureFallback(C, h) {
    const T = THREE_();
    if (!T || !C || !C.TX) return null;
    let sheet = h.userData && h.userData._fbMap1274;
    if (sheet && sheet.parent === h) return sheet;
    const MS = 0.36;
    let tex = null;
    try {
      tex = new T.CanvasTexture(C.TX);
      tex.minFilter = T.LinearFilter;
      tex.magFilter = T.LinearFilter;
      tex.needsUpdate = true;
    } catch (_) {}
    const mat = new T.MeshBasicMaterial({
      map: tex || null, color: 0xffffff, side: T.DoubleSide,
      depthTest: false, depthWrite: false, transparent: !!tex
    });
    sheet = new T.Mesh(new T.PlaneGeometry(MS, MS), mat);
    sheet.renderOrder = 20;
    sheet.frustumCulled = false;
    sheet.name = 'fbMap1275';
    const sh = new T.Shape();
    sh.moveTo(0, 0.016); sh.lineTo(0.011, -0.012); sh.lineTo(0, -0.005); sh.lineTo(-0.011, -0.012); sh.closePath();
    const arrowO = new T.Mesh(new T.ShapeGeometry(sh), new T.MeshBasicMaterial({ color: 0xffffff, depthTest: false, depthWrite: false }));
    arrowO.scale.setScalar(1.35); arrowO.renderOrder = 21;
    const arrow = new T.Mesh(new T.ShapeGeometry(sh), new T.MeshBasicMaterial({ color: 0xd01818, depthTest: false, depthWrite: false }));
    arrow.renderOrder = 22; arrow.position.z = 0.0005;
    const mark = new T.Group(); mark.add(arrowO); mark.add(arrow); mark.position.z = 0.001;
    sheet.add(mark);
    sheet.userData._mark1274 = mark;
    sheet.userData._tex1274 = tex;
    sheet.userData._ms1274 = MS;
    h.add(sheet);
    h.userData._fbMap1274 = sheet;
    return sheet;
  }

  function updateFallback(sheet) {
    if (!sheet) return;
    try {
      if (sheet.material && sheet.material.map) sheet.material.map.needsUpdate = true;
      if (sheet.userData._tex1274) sheet.userData._tex1274.needsUpdate = true;
      const mark = sheet.userData._mark1274;
      const MS = sheet.userData._ms1274 || 0.36;
      if (mark && typeof P !== 'undefined' && P) {
        const C = window.__c112;
        const xy = toCanvas(C, P.x, P.z);
        mark.position.set((xy[0] / 1024 - 0.5) * MS, (0.5 - xy[1] / 1024) * MS, 0.001);
        mark.rotation.z = P.yaw || 0;
        mark.visible = !(typeof DIM !== 'undefined' && DIM.cur);
      }
    } catch (e) { ERR('fb', e); }
  }

  function addWorld(obj, parent, dir, amt) {
    const T = THREE_();
    if (!T || !obj || !parent || !dir) return;
    const o = parent.worldToLocal(parent.getWorldPosition(new T.Vector3()));
    const t = parent.worldToLocal(parent.getWorldPosition(new T.Vector3()).addScaledVector(dir, amt));
    obj.position.add(t.sub(o));
  }

  function poseSheet(plane, parent) {
    const T = THREE_();
    const cam = (typeof camera !== 'undefined' && camera) || window.camera;
    if (!T || !plane || !parent || !cam) return;
    try {
      parent.updateWorldMatrix(true, true);
      cam.updateWorldMatrix(true, true);
      const towardCam = new T.Vector3(0, 0, 1).transformDirection(cam.matrixWorld).normalize();
      const camUp = new T.Vector3(0, 1, 0).transformDirection(cam.matrixWorld).normalize();
      const face = towardCam.clone().addScaledVector(camUp, 0.22).normalize();
      const yDir = camUp.clone().addScaledVector(face, -camUp.dot(face));
      if (yDir.lengthSq() < 1e-8) yDir.set(0, 1, 0);
      yDir.normalize();
      const xDir = new T.Vector3().crossVectors(yDir, face).normalize();
      yDir.crossVectors(face, xDir).normalize();
      const m = new T.Matrix4().makeBasis(xDir, yDir, face);
      const qWorld = new T.Quaternion().setFromRotationMatrix(m);
      const qParent = parent.getWorldQuaternion(new T.Quaternion());
      plane.quaternion.copy(qParent.clone().invert().multiply(qWorld));
      plane.position.set(0, 0.02, 0);
      addWorld(plane, parent, towardCam, 0.085);
      addWorld(plane, parent, camUp, 0.045);
      plane.scale.setScalar(1.18);
      plane.visible = true;
      plane.frustumCulled = false;
      plane.traverse(function (o) { o.visible = true; o.frustumCulled = false; });
      if (plane.material) {
        plane.material.depthTest = false;
        plane.material.depthWrite = false;
        plane.material.side = T.DoubleSide;
        plane.material.visible = true;
        if (plane.material.map) plane.material.map.needsUpdate = true;
      }
      plane.renderOrder = 20;
    } catch (e) { ERR('pose', e); }
  }

  function stashSheet(C) {
    const sheet = C && (C._sheet1274 || (C.inset && C.inset.parent));
    if (!sheet) return;
    const st = ensureStash();
    if (st && sheet.parent !== st) {
      try { st.add(sheet); } catch (_) {}
    }
    try { sheet.visible = false; } catch (_) {}
  }

  function seatLiveMap() {
    /* Called only when the held item is the map. Never when a gun is held. */
    const C = window.__c112;
    const g = heldMesh();
    if (!g || isTp()) {
      if (C) stashSheet(C);
      return;
    }
    if (C && typeof C.frame === 'function') {
      try { C.frame(); } catch (e) { ERR('frame', e); }
    }
    if (C && C.g) {
      try { C.g.visible = false; } catch (_) {}
    }
    hideDecor(g);
    let sheet = C && getLiveSheet(C);
    if (sheet) {
      if (sheet.parent !== g) {
        try { g.add(sheet); } catch (e) { ERR('addSheet', e); }
        sheet.position.set(0, 0, 0);
        sheet.rotation.set(0, 0, 0);
        sheet.scale.set(1, 1, 1);
      }
      poseSheet(sheet, g);
      try { if (sheet.material && sheet.material.map) sheet.material.map.needsUpdate = true; } catch (_) {}
      U.mapSeat++;
      U.lastWhy = 'live-map';
      try { if (g.userData._fbMap1274 && g.userData._fbMap1274 !== sheet) g.userData._fbMap1274.visible = false; } catch (_) {}
      return;
    }
    if (C && C.TX) {
      const fb = ensureFallback(C, g);
      if (fb) {
        updateFallback(fb);
        poseSheet(fb, g);
        U.mapSeat++;
        U.lastWhy = 'fb-map';
      }
    }
  }

  /* ---- per-frame: whitelist only; guns return immediately ---- */
  function tick(fromApply) {
    const id = selIdNow();
    if (isWeapon()) {
      U.skippedGun++;
      U.lastWhy = 'gun-skip';
      /* If a previous session left the live sheet on a gun mesh, stash it.
         Do not call C.frame(), do not traverse the gun, do not touch GRIP. */
      try {
        const C = window.__c112;
        if (C && C._sheet1274 && C._sheet1274.parent) {
          const p = C._sheet1274.parent;
          const g = heldMesh();
          if (g && (p === g || p === (g.children && g.children[0]))) stashSheet(C);
        }
      } catch (_) {}
      return;
    }
    applyPotionPath();
    if (isMapId(id) || kindQuick() === 'map') {
      try { seatLiveMap(); } catch (e) { ERR('map', e); }
      return;
    }
    /* Not the map: keep the live sheet off any other item. */
    try { stashSheet(window.__c112); } catch (_) {}
    if (isToolId(id) || TOOL_KINDS[kindQuick()]) {
      const g = heldMesh();
      clearSnapshot(g);
      if (PICK_KINDS[kindQuick()] || (typeof TOOL === 'object' && TOOL[id] && TOOL[id][0] === 'pick') || id === 761 || id === 760) {
        try { lockPickBlade(); } catch (e) { ERR('blade', e); }
      }
      U.lastWhy = 'potion-path';
    }
  }

  /* Do not wrap apply, repose or renderer.render: that was the 1.2.74
     leak into guns. A rAF is enough, and it no-ops on weapons. */
  U.applyPotionPath = applyPotionPath;
  U.tick = tick;
  U.isWeapon = isWeapon;
  try { applyPotionPath(); tick(); } catch (e) { ERR('boot', e); }
  try {
    let n = 0;
    const iv = setInterval(function () {
      try { applyPotionPath(); } catch (_) {}
      if (++n > 80) clearInterval(iv);
    }, 50);
  } catch (_) {}
  try {
    const loop = function () {
      try { tick(); } catch (_) {}
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  } catch (_) {}
})();
