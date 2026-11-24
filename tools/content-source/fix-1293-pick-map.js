/* GLX-FIX1293 (v1.2.95 map-visibility remnant): keep the held map sheet
   on-screen. 1.2.95 also re-seated the pick and tightened 1285 finger
   curls; those changes are reverted so first-person hands, fingers and
   the pickaxe pose match 1.2.94. This IIFE only unstashes the live
   0.34 C112 sheet, faces it at the camera, and keeps it inside the
   frustum. It does not mutate __handsFp1285.POSES, move the glove,
   lock FRAME, or re-aim the pick. The 1281 path, 1.2.88 gloves, TP
   hands, __fpa animations, 1279 seat, and jitter fixes are left
   alone. No geometry is deleted.
*/
(function fix1293() {
  const U = window.__pickMap1293 = {
    err: null, on: 1, version: '1.2.98-map-only',
    hook: 0, mapSeat: 0, last: ''
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  const T3 = () => (typeof THREE !== 'undefined' && THREE) || window.THREE || null;
  const MAP_ID = () => { try { return (typeof IT !== 'undefined' && IT.MAP) || 410; } catch (_) { return 410; } };

  function kindOf() {
    try {
      const H = window.__heldFrame1251;
      if (H && typeof H.kindOf === 'function') return H.kindOf() || H.kind || '';
      if (H && H.kind) return H.kind;
    } catch (_) {}
    try {
      if (typeof selId !== 'undefined' && (selId === MAP_ID() || selId === 410)) return 'map';
    } catch (_) {}
    return '';
  }
  function isTp() {
    try { return typeof camMode !== 'undefined' && camMode !== 0; } catch (_) { return false; }
  }
  function isMapHeld() {
    try { return selId === MAP_ID() || selId === 410 || kindOf() === 'map'; } catch (_) { return false; }
  }
  function rig() {
    try { return window.__fpa && __fpa.rig ? __fpa.rig() : null; } catch (_) { return null; }
  }
  function rightHand(R) {
    try {
      const g = (R || rig()) && (R || rig()).userData && (R || rig()).userData.R;
      return g && g.userData && g.userData.p && g.userData.p.h || null;
    } catch (_) { return null; }
  }
  function palmNode() {
    try {
      const H = window.__handsFp1285;
      const st = H && H.sides && H.sides.R;
      const o = st && (st.hand || st.wrap);
      if (o && o.isObject3D) return o;
    } catch (_) {}
    return rightHand();
  }
  function sheet() {
    try {
      const C = window.__c112; if (!C) return null;
      const p = C.inset && C.inset.parent;
      if (p && p.isMesh && p.geometry && p.geometry.parameters && p.geometry.parameters.width === 0.34) return p;
      const s = C._sheet1274;
      if (s && s.isMesh && s.geometry && s.geometry.parameters && s.geometry.parameters.width === 0.34) return s;
    } catch (_) {}
    return null;
  }
  function aspectOf(cam) {
    try {
      const el = (typeof renderer !== 'undefined' && renderer && renderer.domElement)
        || document.querySelector('canvas');
      if (el && (el.clientHeight || el.height)) return (el.clientWidth || el.width) / (el.clientHeight || el.height);
    } catch (_) {}
    return (cam && cam.aspect) || 1;
  }

  let D = {};
  function tmp(THREE) {
    if (D.ready) return D;
    D.v = new THREE.Vector3();
    D.palmW = new THREE.Vector3();
    D.palmC = new THREE.Vector3();
    D.mw = new THREE.Matrix4();
    D.inv = new THREE.Matrix4();
    D.camInv = new THREE.Matrix4();
    D.ready = 1;
    return D;
  }

  function unstash(plane, R) {
    try {
      if (!plane) return;
      const st = plane.parent && plane.parent.name === 'mapStash1275';
      if (st || (plane.parent && plane.parent !== R)) {
        if (plane.parent) plane.parent.remove(plane);
        R.add(plane);
      }
    } catch (e) { ERR('unstash', e); }
  }

  function refreshMapTex(plane, THREE) {
    try {
      try {
        if (window.__c345 && window.__c345.uk) window.__c345.uk.want = 1;
        if (window.__c112 && typeof window.__c112.frame === 'function') window.__c112.frame();
      } catch (_) {}
      const C = window.__c112;
      if (!plane || !C || !C.TX || !THREE) return;
      try { const M7 = window.__map1357; if (M7 && M7.bind && M7.bind(plane)) return; } catch (_) {}   /* t1357 sharp texture */
      let mat = plane.material;
      const img = C.TX;
      const map = mat && mat.map;
      if (!map || map.image !== img) {
        const tex = new THREE.CanvasTexture(img);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        if (mat) { mat.map = tex; mat.needsUpdate = true; }
      } else if ((U._texTick = (U._texTick || 0) + 1) % 6 === 1) {
        map.needsUpdate = true;
      }
    } catch (e) { ERR('tex', e); }
  }

  /* Re-seat the sheet only. The right glove and 1285 curls stay as 1.2.94 left them. */
  function seatMap(R, THREE) {
    if (!isMapHeld() || isTp() || !U.on || U._inSeat) return;
    const plane = sheet();
    const cam = (typeof camera !== 'undefined' && camera) || (R && R.parent);
    if (!plane || !cam || !R) return;
    U._inSeat = 1;
    try {
      unstash(plane, R);
      cam.updateWorldMatrix(true, false);
      const d = tmp(THREE);
      const pn = palmNode();
      if (pn && pn.updateWorldMatrix) pn.updateWorldMatrix(true, false);
      if (pn) d.palmW.setFromMatrixPosition(pn.matrixWorld);
      else d.palmW.set(0, 0, 0);
      d.camInv.copy(cam.matrixWorld).invert();
      d.palmC.copy(d.palmW).applyMatrix4(d.camInv);

      const depth = d.palmC.z < -0.28 ? d.palmC.z : -0.48;
      const vFov = ((cam.fov || 75) * Math.PI) / 180;
      const halfY = Math.tan(vFov * 0.5) * Math.abs(depth);
      const asp = aspectOf(cam);
      const halfX = halfY * asp;
      const land = asp >= 1;
      /* Modest scale: large enough to read, not a hand-moving FRAME lock. */
      const maxHalf = Math.min(halfX, halfY) * (land ? 0.55 : 0.82);
      const sCap = land ? 0.95 : 0.88;
      let s = Math.max(0.42, Math.min(sCap, (2 * maxHalf) / 0.34));
      const hs = 0.17 * s;

      let cx = d.palmC.x;
      let cy = d.palmC.y + hs * 0.92;
      let z = depth + 0.01;
      const limitX = Math.max(hs + 0.01, halfX * 0.90);
      const limitY = Math.max(hs + 0.01, halfY * 0.90);
      if (cx + hs > limitX) cx = limitX - hs;
      if (cx - hs < -limitX) cx = -limitX + hs;
      if (cy + hs > limitY) cy = limitY - hs;
      if (cy - hs < -limitY) cy = -limitY + hs;
      /* t1357: GLX-MAP1357 holds the sheet big, flat and square-on (window.__noMap1357 = 1 restores the seat above) */
      let tilt = -0.22, flat = 0;
      try { const M7 = window.__map1357; if (M7 && M7.on && !window.__noMap1357 && M7.seat) { const o = M7.seat({palm: d.palmC, halfX, halfY, depth, asp, cam}); if (o) { cx = o.cx; cy = o.cy; z = o.z; s = o.s; tilt = o.tilt; flat = o.flat ? 1 : 0; } } } catch (e) { ERR('m1357', e); }
      U.lastSeat = { asp: +asp.toFixed(3), halfX: +halfX.toFixed(3), halfY: +halfY.toFixed(3),
        cx: +cx.toFixed(3), cy: +cy.toFixed(3), z: +z.toFixed(3), s: +s.toFixed(3),
        palm: [+d.palmC.x.toFixed(3), +d.palmC.y.toFixed(3), +d.palmC.z.toFixed(3)] };

      const O = U._o || (U._o = new THREE.Object3D());
      O.position.set(cx, cy, z);
      O.quaternion.identity();
      O.up.set(0, 1, 0);
      if (!flat) O.lookAt(0, 0, 0);
      O.rotateX(tilt);
      O.updateMatrix();

      d.mw.copy(cam.matrixWorld).multiply(O.matrix);
      d.inv.copy(R.matrixWorld).invert().multiply(d.mw);
      d.inv.decompose(plane.position, plane.quaternion, plane.scale);
      plane.scale.set(s, s, s);
      plane.visible = true;
      plane.frustumCulled = false;
      plane.renderOrder = 0;
      try {
        if (plane.material) {
          plane.material.depthTest = true;
          plane.material.depthWrite = true;
          plane.material.transparent = false;
          plane.material.opacity = 1;
          plane.material.side = THREE.DoubleSide;
          if (plane.material.color) plane.material.color.setHex(0xffffff);
          refreshMapTex(plane, THREE);
        }
      } catch (_) {}
      try {
        const C = window.__c112;
        if (C && C.g) C.g.visible = false;
        if (C && C.inset) C.inset.visible = false;
      } catch (_) {}
      try {
        if (typeof held !== 'undefined' && held && held.traverse) {
          held.traverse(function (c) {
            const u = c.userData || {};
            if (u.held1240Map || u.art1249) c.visible = false;
          });
        }
      } catch (_) {}
      if (!plane.onBeforeRender || !plane.onBeforeRender.__pickMap1293) {
        plane.onBeforeRender = function () {
          try { if (U.on) seatMap(rig(), T3()); } catch (e) { ERR('obr', e); }
        };
        plane.onBeforeRender.__pickMap1293 = 1;
      }
      U.mapSeat++;
    } finally { U._inSeat = 0; }
  }

  function measure() {
    const THREE = T3();
    const info = { kind: kindOf(), mapSeat: U.mapSeat, err: U.err };
    try {
      const plane = sheet();
      const cam = typeof camera !== 'undefined' ? camera : null;
      if ((info.kind === 'map' || isMapHeld()) && plane && cam && THREE) {
        plane.updateWorldMatrix(true, false);
        const wp = new THREE.Vector3(); plane.getWorldPosition(wp);
        cam.worldToLocal(wp);
        info.sheetCam = [+wp.x.toFixed(3), +wp.y.toFixed(3), +wp.z.toFixed(3)];
        info.sheetVis = !!plane.visible;
        info.sheetParent = plane.parent ? (plane.parent.name || plane.parent.type) : null;
        info.sheetScale = plane.scale ? +plane.scale.x.toFixed(3) : null;
        const depth = Math.abs(wp.z) || 0.5;
        const vFov = ((cam.fov || 75) * Math.PI) / 180;
        const halfY = Math.tan(vFov * 0.5) * depth;
        const halfX = halfY * aspectOf(cam);
        const hs = 0.17 * (plane.scale && plane.scale.x || 1);
        info.sheetInView = (Math.abs(wp.x) + hs) < halfX * 1.02 && (Math.abs(wp.y) + hs) < halfY * 1.02 && wp.z < -0.2;
        const n = new THREE.Vector3(0, 0, 1).transformDirection(plane.matrixWorld);
        n.transformDirection(cam.matrixWorld.clone().invert());
        info.faceDot = +n.z.toFixed(3);
      }
    } catch (e) { info.mapErr = String(e); }
    info.lastSeat = U.lastSeat || null;
    U.debug = info;
    return info;
  }

  function tick() {
    if (!U.on || isTp()) return;
    const THREE = T3();
    if (!THREE) return;
    try {
      const R = rig();
      if (R) seatMap(R, THREE);
    } catch (e) { ERR('map', e); }
  }

  function install() {
    try {
      const R = rig();
      if (R && R.updateMatrixWorld && !R.updateMatrixWorld.__pickMap1293) {
        const prev = R.updateMatrixWorld.bind(R);
        R.updateMatrixWorld = function () {
          const r = prev.apply(this, arguments);
          try { if (U.on) tick(); } catch (e) { ERR('hook', e); }
          return r;
        };
        R.updateMatrixWorld.__pickMap1293 = 1;
        U.hook++;
      }
    } catch (e) { ERR('install', e); }
    try {
      if (typeof renderer !== 'undefined' && renderer && renderer.render && !renderer.__pickMap1293) {
        const rd = renderer.render.bind(renderer);
        renderer.render = function (sc, cam) {
          try { if (U.on) tick(); } catch (e) { ERR('rd', e); }
          return rd.apply(this, arguments);
        };
        renderer.__pickMap1293 = 1;
        U.hook++;
      }
    } catch (e) { ERR('render', e); }
    try { tick(); } catch (e) { ERR('boot', e); }
  }

  U.install = install;
  U.tick = tick;
  U.measure = measure;
  try { install(); } catch (e) { ERR('init', e); }
  [200, 800, 2000, 5000, 12000, 30000, 70000].forEach(function (t) {
    try { setTimeout(install, t); } catch (_) {}
  });
  try {
    setInterval(function () { try { install(); } catch (e) { ERR('int', e); } }, 1000);
  } catch (_) {}
  (function loop() {
    try { if (U.on) { install(); tick(); } } catch (e) { ERR('raf', e); }
    try { requestAnimationFrame(loop); } catch (_) {}
  })();
})();
