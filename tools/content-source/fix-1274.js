/* GLX-FIX1274 (v1.2.74): pickaxe, bucket and torch sit still, the pick
   head stays on the handle, and the held map is a live map again.
   (1) The first-person pickaxe, bucket and torch no longer chase the
   palm every frame (the grip seater for those tools had no freeze, so
   the arm and the item kept walking each other off-screen — the "up
   up up" loop). After the first good seat the pose is frozen. Mining
   and placing still work; a swing still plays on a fresh press. The
   half-finished 1274 haft/crescent dresser is not allowed to re-aim
   or un-parent the pick head every frame, so the blade stays on the
   handle (no duplicate or detached head).
   (2) The held map shows the live, navigable C112 chart again —
   terrain, landmarks, a player marker that follows your position and
   heading, and the close-up inset. It is drawn on the sheet in your
   hand (the new palm pose is kept), tilted up toward the camera and
   brought closer so you can read it. The old full-screen map overlay
   and its fake arms stay hidden. First-person hands stay hidden in
   third person. The gold D-pad is left alone. */
(function fix1274() {
  const U = window.__fix1274 = {
    err: null, on: 1, version: '1.2.74',
    frozen: 0, bladeLock: 0, mapSeat: 0, applyHook: 0, gripStable: 0,
    lastKind: '', lastWhy: ''
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  const TOOLS = { pick: 1, p761: 1, p760: 1, bucket: 1, torch: 1 };
  const PICKS = { pick: 1, p761: 1, p760: 1 };
  const MAP_ID = () => { try { return (typeof IT !== 'undefined' && IT.MAP) || 410; } catch (_) { return 410; } };
  const THREE_ = () => (typeof THREE !== 'undefined' && THREE) || window.THREE || null;

  function kindOf() {
    try {
      const H = window.__heldFrame1251;
      if (H && typeof H.kindOf === 'function') return H.kindOf() || H.kind || '';
      if (H && H.kind) return H.kind;
    } catch (_) {}
    return (U.lastKind || '');
  }

  function heldMesh() {
    try {
      if (typeof held === 'undefined' || !held) return null;
      return held;
    } catch (_) { return null; }
  }

  function isTp() {
    try {
      if (window.__thirdPerson) return true;
      if (typeof camMode !== 'undefined' && camMode) return true;
    } catch (_) {}
    return false;
  }

  function isMapHeld() {
    try {
      if (typeof started !== 'undefined' && !started) return false;
      if (typeof dead !== 'undefined' && dead) return false;
      if (isTp()) return false;
      if (typeof menuOpen !== 'undefined' && menuOpen) return false;
      const id = MAP_ID();
      if (typeof selId !== 'undefined' && selId === id) {
        try { if (typeof cnt === 'function' && !(cnt(id) > 0)) return false; } catch (_) {}
        return true;
      }
      try { if (typeof offhand !== 'undefined' && offhand && offhand.id === id) return true; } catch (_) {}
    } catch (e) { ERR('held?', e); }
    return false;
  }

  /* ---------- (1) freeze grip seating; lock the pick head ---------- */
  function stabilizeGrips() {
    try {
      const H = window.__heldFrame1251;
      const G = H && H.GRIP;
      if (!G) return;
      ['pick', 'p761', 'p760', 'bucket', 'torch'].forEach(function (k) {
        if (G[k]) G[k].stable = 1;
      });
      U.gripStable = 1;
    } catch (e) { ERR('grip', e); }
  }

  function freezeToolPose(kind, allowSnap) {
    const g = heldMesh();
    if (!g || !TOOLS[kind]) return;
    const mesh = (g.children && g.children[0]) || g;
    if (!mesh || !mesh.position || !mesh.quaternion) return;
    let key = kind;
    try { key = kind + ':' + (mesh.uuid || '') + ':' + (g.uuid || ''); } catch (_) {}
    const slot = g.userData || (g.userData = {});
    const prev = slot._freeze1274;
    if (prev && prev.key === key && prev.p && prev.q) {
      mesh.position.copy(prev.p);
      mesh.quaternion.copy(prev.q);
      if (prev.s && mesh.scale) mesh.scale.copy(prev.s);
      U.frozen++;
      U.lastWhy = 'freeze';
      return;
    }
    /* Only snapshot after a real apply()/repose() so we capture the
       seated pose, not a pre-seat default from an early rAF. */
    if (!allowSnap) return;
    const T = THREE_();
    if (!T) return;
    slot._freeze1274 = {
      key: key,
      p: mesh.position.clone(),
      q: mesh.quaternion.clone(),
      s: mesh.scale ? mesh.scale.clone() : null
    };
    /* Also write the seater's own stable snapshot so seatItem itself
       stops solving on the next frame, even before bt reaches 1. */
    try {
      mesh.userData._seatStable = {
        key: mesh.userData._seatKey || (kind + ':0:' + (mesh.uuid || '')),
        p: mesh.position.clone(),
        q: mesh.quaternion.clone()
      };
    } catch (_) {}
    U.lastWhy = 'snap';
  }

  function clearFreezeIfNotTool(kind) {
    if (TOOLS[kind]) return;
    try {
      const g = heldMesh();
      if (g && g.userData) g.userData._freeze1274 = null;
    } catch (_) {}
  }

  function isBladeMesh(o) {
    if (!o || !o.isMesh) return false;
    const ud = o.userData || {};
    if (ud.fpHook1264 || ud.fpHook1263 || ud.fpHook1262 || ud.fpHook1265) return true;
    if (ud.crystalCore1249 || ud.noGrip) return true;
    return false;
  }
  function isHaftMesh(o) {
    if (!o || !o.isMesh) return false;
    const ud = o.userData || {};
    if (ud.fpHaftCyl1274 || ud.handle1249 || ud.fpHaft1274) return true;
    if (ud.fpSockMetal1274 || ud.fpSock1265) return false;
    const mat = o.material || {};
    const c = mat.color;
    const col = c && c.getHex && c.getHex();
    if (col === 0x4a2c14 || col === 0x3a2412 || col === 0x5a3a1e || col === 0x6b4226) return true;
    return false;
  }

  function lockPickBlade(kind) {
    if (!PICKS[kind]) return;
    const g = heldMesh();
    if (!g) return;
    const T = THREE_();
    if (!T) return;
    const slot = g.userData || (g.userData = {});
    const prev = slot._bladeLock1274;
    if (prev && prev.blade && prev.p) {
      try {
        if (prev.parent && prev.blade.parent !== prev.parent) {
          try { prev.parent.attach(prev.blade); } catch (_) { prev.parent.add(prev.blade); }
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
      /* Only reparent if the blade is not already under the pick root.
         attach() keeps the world pose, so a first-time rescue will not
         jump; later frames just restore the frozen local transform. */
      let under = false, n = blade;
      while (n) { if (n === root) { under = true; break; } n = n.parent; }
      if (!under && root) {
        try { root.attach(blade); } catch (_) { root.add(blade); }
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

  /* ---------- (2) live held map, tilted up and close ---------- */
  const stash = { g: null };
  function ensureStash() {
    if (stash.g) return stash.g;
    const T = THREE_();
    if (!T) return null;
    stash.g = new T.Group();
    stash.g.name = 'mapStash1274';
    stash.g.visible = false;
    return stash.g;
  }

  function getLiveSheet(C) {
    if (C._sheet1274 && C._sheet1274.isObject3D) return C._sheet1274;
    /* The inset is a child of the live plane; that is the most reliable hook. */
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
    search(C._sheet1274);
    found.sort(function (a, b) { return (b.children ? b.children.length : 0) - (a.children ? a.children.length : 0); });
    if (found[0]) C._sheet1274 = found[0];
    return C._sheet1274 || null;
  }

  function hideDecor(held) {
    try {
      held.traverse(function (o) {
        const ud = o.userData || {};
        if (ud.held1240Map || ud.art1249) {
          o.visible = false;
        }
      });
    } catch (_) {}
  }

  function toCanvas(C, x, z) {
    /* Same mapping C112 uses when the UK overlay is off. */
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

  function ensureFallback(C, held) {
    const T = THREE_();
    if (!T || !C || !C.TX) return null;
    let sheet = held.userData && held.userData._fbMap1274;
    if (sheet && sheet.parent === held) return sheet;
    const MS = 0.36;
    let tex = null;
    try {
      tex = new T.CanvasTexture(C.TX);
      tex.minFilter = T.LinearFilter;
      tex.magFilter = T.LinearFilter;
      tex.needsUpdate = true;
    } catch (_) {}
    const mat = new T.MeshBasicMaterial({
      map: tex || null,
      color: 0xffffff,
      side: T.DoubleSide,
      depthTest: false,
      depthWrite: false,
      transparent: !!tex
    });
    sheet = new T.Mesh(new T.PlaneGeometry(MS, MS), mat);
    sheet.renderOrder = 20;
    sheet.frustumCulled = false;
    sheet.name = 'fbMap1274';
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
    sheet.frustumCulled = false;
    held.add(sheet);
    held.userData._fbMap1274 = sheet;
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
      /* Face the camera, with a slight upward tilt so the sheet reads
         like a held card, not a plate on the palm. */
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
      plane.traverse(function (o) {
        o.visible = true;
        o.frustumCulled = false;
      });
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

  function seatLiveMap() {
    const C = window.__c112;
    const g = heldMesh();
    const on = isMapHeld() && g && !isTp();
    /* Keep C112's chart, marker and inset ticking. hideMapOverlay already
       wraps frame() so it will not hide the first-person hand. */
    if (C && typeof C.frame === 'function') {
      try { C.frame(); } catch (e) { ERR('frame', e); }
    }
    if (C && C.g) {
      try { C.g.visible = false; } catch (_) {}
    }
    if (!on) {
      const sheet = C && C._sheet1274;
      if (sheet) {
        const st = ensureStash();
        if (st && sheet.parent !== st) {
          try { st.add(sheet); } catch (_) {}
        }
        sheet.visible = false;
      }
      try {
        if (g && g.userData && g.userData._fbMap1274) g.userData._fbMap1274.visible = false;
      } catch (_) {}
      return;
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
      try {
        if (sheet.material && sheet.material.map) sheet.material.map.needsUpdate = true;
      } catch (_) {}
      U.mapSeat++;
      U.lastWhy = 'live-map';
      /* Hide a fallback if the real sheet is in place. */
      try { if (g.userData._fbMap1274 && g.userData._fbMap1274 !== sheet) g.userData._fbMap1274.visible = false; } catch (_) {}
      return;
    }
    /* C112's plane was not found: still put a live CanvasTexture of TX
       on a sheet in the hand, with a heading marker. */
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

  function afterApply() {
    let kind = '';
    try { kind = kindOf(); } catch (_) {}
    U.lastKind = kind || U.lastKind;
    try {
      if (TOOLS[kind]) {
        freezeToolPose(kind, !!U._snapOk);
        lockPickBlade(kind);
      } else {
        clearFreezeIfNotTool(kind);
      }
    } catch (e) { ERR('tool', e); }
    try { seatLiveMap(); } catch (e) { ERR('map', e); }
  }

  function hookApply() {
    try {
      const H = window.__heldFrame1251;
      if (!H || H._hook1274) return !!H && !!H._hook1274;
      if (typeof H.apply === 'function') {
        const orig = H.apply;
        H.apply = function () {
          const r = orig.apply(this, arguments);
          try { U._snapOk = 1; afterApply(); } catch (e) { ERR('after', e); }
          finally { U._snapOk = 0; }
          return r;
        };
        H._hook1274 = 1;
        U.applyHook = 1;
      }
      if (typeof H.repose === 'function' && !H._repose1274) {
        const rp = H.repose;
        H.repose = function () {
          const r = rp.apply(this, arguments);
          try { U._snapOk = 1; afterApply(); } catch (e) { ERR('repose', e); }
          finally { U._snapOk = 0; }
          return r;
        };
        H._repose1274 = 1;
      }
    } catch (e) { ERR('hook', e); }
    return !!U.applyHook;
  }

  /* Also run just before a frame is drawn, so the live marker and the
     frozen tool pose win over any late seater / hideMapOverlay pass. */
  function hookRender() {
    try {
      if (typeof renderer === 'undefined' || !renderer || !renderer.render || renderer.__map1274) return;
      const rd = renderer.render.bind(renderer);
      renderer.render = function (sc, cam) {
        try { afterApply(); } catch (e) { ERR('rnd', e); }
        return rd.apply(this, arguments);
      };
      renderer.__map1274 = 1;
    } catch (e) { ERR('hookR', e); }
  }

  function tick() {
    try { stabilizeGrips(); hookApply(); hookRender(); afterApply(); } catch (e) { ERR('tick', e); }
  }

  try { tick(); } catch (e) { ERR('boot', e); }
  try {
    let n = 0;
    const iv = setInterval(function () {
      tick();
      if (++n > 80) clearInterval(iv);
    }, 50);
  } catch (_) {}
  try {
    const loop = function () {
      try { stabilizeGrips(); hookApply(); hookRender(); afterApply(); } catch (_) {}
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  } catch (_) {}
})();
