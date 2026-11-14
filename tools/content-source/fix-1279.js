/* GLX-FIX1279 (v1.2.79): Map is held in the hand. Arms in first person. Items held in the right hand in third person.

   Map: the live C112 chart is pinched in the current __fpa right hand.
   The thumb lies on the front of the sheet at its bottom-left corner,
   the curled fingers sit behind it, and the sheet is tilted up to face
   the camera, close and readable. It is drawn in the same view-model
   pass as the hand, so the hand and sheet sort by depth. The terrain,
   the red player arrow and the heading stay live (C112 frame() keeps
   running; this only re-seats the sheet). The 1.2.76 palm seat is
   switched off so it cannot fight the pose; the 1.2.75 live-map tick
   still runs and is re-seated every render.

   Forearms: a linen sleeve is parented to each existing __fpa hand,
   running from the wrist down off the bottom of the screen. The 1.2.57
   hand meshes are not replaced or changed. They share the hand's cuff
   material, and they are hidden with the view-model in third person.

   This IIFE never wraps held-frame apply / repose or renderer.render.
   It never touches a gun, musket, or the 1.2.75 potion-style pickaxe /
   bucket / torch grip, render distance or meshing. The gold D-pad and
   the LT context action are left alone. No popups. */
(function fix1279() {
  const U = window.__fix1279 = {
    err: null, on: 1, version: '1.2.79',
    seat: 0, arms: 0, hook: 0, last: '',
    /* grip tuning (camera space, metres): sheet scale, thumb-tip offset
       from the bottom-left corner, depth behind the thumb tip, roll */
    cfg: {s: 0.8, tx: 0.028, ty: 0.04, back: 0.03, roll: 0.05, tilt: 0,
      curl: 0.75, thR: [-1.2, 0, 0.4], thK: -0.3}
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  const T3 = () => (typeof THREE !== 'undefined' && THREE) || window.THREE || null;
  const MAP_ID = () => { try { return (typeof IT !== 'undefined' && IT.MAP) || 410; } catch (_) { return 410; } };
  function isMapHeld() { try { return selId === MAP_ID() || selId === 410; } catch (_) { return false; } }
  function isTp() { try { return typeof camMode !== 'undefined' && camMode !== 0; } catch (_) { return false; } }
  function rig() { try { return window.__fpa && __fpa.rig ? __fpa.rig() : null; } catch (_) { return null; } }
  function handOf(R, side) { try { const g = R && R.userData && R.userData[side]; return g && g.userData && g.userData.p && g.userData.p.h || null; } catch (_) { return null; } }
  function sheet() {
    try {
      const C = window.__c112; if (!C) return null;
      const p = C.inset && C.inset.parent;
      if (p && p.geometry && p.geometry.parameters && p.geometry.parameters.width === 0.34) return p;
      const s = C._sheet1274;
      if (s && s.geometry && s.geometry.parameters && s.geometry.parameters.width === 0.34) return s;
    } catch (_) {}
    return null;
  }

  /* ---------------- map in hand ---------------- */
  let M = null, tex = null, texTick = 0;
  function mats() {
    const THREE = T3(); const C = window.__c112;
    if (!THREE || !C || !C.TX) return null;
    if (!M) {
      tex = new THREE.CanvasTexture(C.TX);
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      try { tex.anisotropy = 4; if (renderer.outputEncoding === THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding; } catch (_) {}
      M = {
        sheet: new THREE.MeshBasicMaterial({map: tex, side: THREE.DoubleSide}),
        white: new THREE.MeshBasicMaterial({color: 0xffffff}),
        red: new THREE.MeshBasicMaterial({color: 0xd01818})
      };
    }
    return M;
  }
  let V0, V1, O0, Mx, Mi;
  function seat(R) {
    const THREE = T3(); if (!THREE) return;
    const plane = sheet();
    if (!isMapHeld() || isTp() || !U.on) { release(R, plane); return; }
    const h = handOf(R, 'R'); const m = mats();
    if (!h || !plane || !m) return;
    if (!V0) { V0 = new THREE.Vector3(); V1 = new THREE.Vector3(); O0 = new THREE.Object3D(); Mx = new THREE.Matrix4(); Mi = new THREE.Matrix4(); }
    const cfg = U.cfg;
    /* pinch: fingers curl behind the sheet, thumb over its front */
    const fs = h.userData.f || [];
    for (let i = 0; i < fs.length; i++) { const a = fs[i] && fs[i][0], b = fs[i] && fs[i][1], c = cfg.curl + i * 0.06; if (a) a.rotation.x = 0.12 + c * 1.35; if (b) b.rotation.x = 0.15 + c * 1.45; }
    const th = h.userData.th;
    if (th) { th.rotation.set(cfg.thR[0], cfg.thR[1], cfg.thR[2]); if (th.userData.k) th.userData.k.rotation.x = cfg.thK; }
    try { const C = window.__c112; if (C.g) C.g.visible = false; } catch (_) {}
    const cam = R.parent; if (!cam) return;
    h.updateWorldMatrix(true, true);
    let tip = th || h; try { if (tip.userData.k) tip = tip.userData.k; if (tip.userData && tip.userData.d) tip = tip.userData.d; } catch (_) {}
    tip.localToWorld(V0.set(0, 0.018, 0));
    Mi.copy(cam.matrixWorld).invert(); V0.applyMatrix4(Mi);           // thumb tip, camera space
    const s = cfg.s, hs = 0.17 * s;
    O0.position.copy(V0); O0.quaternion.identity(); O0.up.set(0, 1, 0);
    O0.lookAt(V1.set(0, 0, 0));                                        // +Z faces the eye
    O0.rotateX(cfg.tilt); O0.rotateZ(cfg.roll);
    V1.set(-hs + cfg.tx * s, -hs + cfg.ty * s, cfg.back).applyQuaternion(O0.quaternion);
    O0.position.sub(V1); O0.updateMatrix();
    if (plane.parent !== R) R.add(plane);
    R.updateWorldMatrix(false, false);
    Mx.copy(cam.matrixWorld).multiply(O0.matrix);
    Mi.copy(R.matrixWorld).invert().multiply(Mx).decompose(plane.position, plane.quaternion, plane.scale);
    plane.scale.multiplyScalar(s);
    plane.material = m.sheet;
    m.sheet.depthTest = true; m.sheet.depthWrite = true; m.sheet.transparent = false; m.sheet.opacity = 1;
    plane.renderOrder = 0; plane.visible = true; plane.frustumCulled = false;
    if ((texTick -= 1) <= 0) { texTick = 30; tex.needsUpdate = true; }
    try { const C = window.__c112; if (C.inset) C.inset.visible = false;
      for (const ch of plane.children) { if (ch === C.inset) continue; ch.visible = true;
        ch.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.renderOrder = 1; o.material = o.position.z > 0.0001 ? m.red : m.white; } }); } } catch (_) {}
    try { held.traverse(c => { const u = c.userData || {}; if (u.held1240Map || u.art1249) c.visible = false; }); } catch (_) {}
    U.seat++;
  }
  function release(R, plane) {
    if (plane && plane.parent === R) { R.remove(plane); plane.visible = false; }
  }

  /* ---------------- first-person forearms ---------------- */
  const LEN = 0.42;
  let armGeo = null;
  function cuffOf(h) {
    let c = null;
    for (const o of h.children) {
      if (!o.isMesh || !o.material || o.userData.fpForearm1279) continue;
      if (o.material.type === 'MeshStandardMaterial' && o.geometry && o.geometry.type === 'BufferGeometry' && Math.abs(o.position.y + 0.048) < 0.002) c = o;
    }
    return c;
  }
  function arms(R) {
    const THREE = T3(); if (!THREE || !R) return;
    for (const side of ['R', 'L']) {
      const h = handOf(R, side); if (!h) continue;
      const cuff = cuffOf(h);
      let fa = h.userData.forearm1279;
      if (!fa) {
        if (!armGeo) { armGeo = new THREE.CylinderGeometry(0.031, 0.04, LEN, 18, 6, true); armGeo.translate(0, -LEN / 2, 0); }
        fa = new THREE.Mesh(armGeo, cuff ? cuff.material : new THREE.MeshLambertMaterial({color: 0xf2eee4}));
        fa.name = 'Forearm1279'; fa.position.set(0, -0.046, 0.001);
        fa.userData.fpForearm1279 = 1; fa.userData.sculptKeep = 1; fa.userData.armSwitchKeep = 1;
        fa.frustumCulled = false; fa.renderOrder = cuff ? cuff.renderOrder : 2;
        h.add(fa); h.userData.forearm1279 = fa; U.arms++;
      }
      if (cuff && fa.material !== cuff.material) fa.material = cuff.material;   // follow sleeve / vambrace re-skins
      fa.visible = cuff ? cuff.visible !== false : true;
    }
  }

  /* ---------------- hook: pose at view-model render time ---------------- */
  function install() {
    const THREE = T3(); const R = rig();
    if (!THREE || !R) return;
    if (!R.userData.fix1279) {
      const base = THREE.Object3D.prototype.updateMatrixWorld;
      R.updateMatrixWorld = function (force) {
        try { if (U.on) seat(this); } catch (e) { ERR('seat', e); }
        return base.call(this, force);
      };
      R.userData.fix1279 = 1; U.hook++;
    }
    try { arms(R); } catch (e) { ERR('arms', e); }
    try { if (window.__fix1276) __fix1276.on = 0; } catch (_) {}
  }
  U.install = install;
  try { install(); } catch (e) { ERR('install', e); }
  setInterval(function () { try { install(); } catch (e) { ERR('tick', e); } }, 1000);
})();
