/* GLX-TORSO1262 (v1.2.62): Restore the missing sides of the Scottish shirt
   so the waist and stomach are a solid wrap in third person, in mirrors and
   in other players' views. The 1.2.35–1.2.53 scottish-base-v2 linen mesh
   has no side triangles from the hem up through mid-chest (the left and
   right azimuth bins are empty), which is why the white tee shows big
   holes at the waist. Side panels are added as a skinned sibling bound to
   the same skeleton, and are culled ONLY for the local player's first-person
   camera so the chest still does not block the view. */
(function torso1262() {
  const U = window.__torso1262 = { err: null, patched: 0, sides: 0, version: '1.2.62' };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 260); };

  const Y0 = 0.990, Y1 = 1.365, RINGS = 14, SEGS = 8;
  /* Outward half-width of the waist, matching the v1 shirt (~0.156) and a
     slightly fuller midriff under the sleeves. */
  function sideRadius(y) {
    const t = (y - Y0) / (Y1 - Y0);
    return 0.148 + 0.022 * t;
  }

  function attrArr(geo, name) {
    const a = geo.getAttribute && geo.getAttribute(name);
    return a ? a.array : null;
  }

  function nearestVert(pos, x, y, z, n) {
    let best = 0, bd = 1e9;
    for (let i = 0; i < n; i++) {
      const dx = pos[i * 3] - x, dy = pos[i * 3 + 1] - y, dz = pos[i * 3 + 2] - z;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  /* Collect front and back "seam" points of the linen shirt at each height
     on one side (sx = ±1), by picking the existing vertex closest to the
     missing side opening. */
  function seamAt(pos, n, y, sx, front) {
    let best = -1, score = -1e9;
    const yTol = 0.028;
    for (let i = 0; i < n; i++) {
      const vx = pos[i * 3], vy = pos[i * 3 + 1], vz = pos[i * 3 + 2];
      if (Math.abs(vy - y) > yTol) continue;
      if (sx * vx < -0.005) continue;          /* wrong side of the body */
      if (front && vz < 0.015) continue;
      if (!front && vz > -0.015) continue;
      /* prefer verts near the side opening (larger |x| on that half, and
         not the mid-line). */
      const s = (sx * vx) * 2 + (front ? vz : -vz) * 0.3 - Math.abs(vy - y) * 4;
      if (s > score) { score = s; best = i; }
    }
    if (best < 0) return null;
    return { i: best, x: pos[best * 3], y: pos[best * 3 + 1], z: pos[best * 3 + 2] };
  }

  function buildSideGeo(src) {
    const pos = attrArr(src, 'position');
    if (!pos) return null;
    const n = pos.length / 3;
    const uv = attrArr(src, 'uv') || attrArr(src, 'TEXCOORD_0');
    const jnt = attrArr(src, 'skinIndex') || attrArr(src, 'joint') || (src.attributes && src.attributes.JOINTS_0 && src.attributes.JOINTS_0.array);
    const wgt = attrArr(src, 'skinWeight') || (src.attributes && src.attributes.WEIGHTS_0 && src.attributes.WEIGHTS_0.array);
    const jItem = (src.attributes && src.attributes.JOINTS_0 && src.attributes.JOINTS_0.itemSize) || 4;
    const wItem = (src.attributes && src.attributes.WEIGHTS_0 && src.attributes.WEIGHTS_0.itemSize) || 4;

    const P = [], N = [], UV = [], J = [], W = [], I = [];
    let v = 0;

    function pushVert(x, y, z, nx, ny, nz, srcI) {
      P.push(x, y, z);
      N.push(nx, ny, nz);
      if (uv && srcI >= 0) {
        UV.push(uv[srcI * 2], uv[srcI * 2 + 1]);
      } else {
        /* unused linen region; cream is near-uniform so a mid UV is fine */
        UV.push(0.55 + 0.08 * Math.atan2(z, x) / Math.PI, 0.25 + (y - Y0) / (Y1 - Y0) * 0.35);
      }
      if (jnt && wgt && srcI >= 0) {
        for (let k = 0; k < jItem; k++) J.push(jnt[srcI * jItem + k] || 0);
        for (let k = 0; k < wItem; k++) W.push(wgt[srcI * wItem + k] || 0);
      } else {
        const nb = nearestVert(pos, x, y, z, n);
        if (jnt && wgt) {
          for (let k = 0; k < jItem; k++) J.push(jnt[nb * jItem + k] || 0);
          for (let k = 0; k < wItem; k++) W.push(wgt[nb * wItem + k] || 0);
        }
      }
      return v++;
    }

    for (const sx of [-1, 1]) {
      const rings = [];
      for (let r = 0; r <= RINGS; r++) {
        const y = Y0 + (Y1 - Y0) * (r / RINGS);
        const fr = seamAt(pos, n, y, sx, true);
        const bk = seamAt(pos, n, y, sx, false);
        if (!fr || !bk) { rings.push(null); continue; }
        const rad = sideRadius(y);
        const row = [];
        for (let s = 0; s <= SEGS; s++) {
          const t = s / SEGS;
          /* arc from the front seam, out around the side, to the back seam.
             t=0 is front, t=1 is back. Angle goes from atan2(fr.z, fr.x) to
             atan2(bk.z, bk.x) passing through the outward side (sx, 0). */
          const a0 = Math.atan2(fr.z, fr.x);
          const a1 = Math.atan2(bk.z, bk.x);
          /* go the long way around the SIDE, not through the body centre.
             For +x (right): front ~+0.5 rad, side ~0? wait front is +z so
             atan2(+z, +x) ≈ +π/2? atan2(z,x): +z front ≈ π/2, +x side ≈ 0,
             -z back ≈ -π/2. For +x we go π/2 → 0 → -π/2 (decreasing).
             For -x: front atan2(+z, -x) ≈ π-ε or π/2+ , side ≈ π, back ≈ -π+ .
             We'll lerp in a space that passes through atan2(0, sx*rad)= sx>0? 0 : π. */
          const amid = Math.atan2(0, sx * rad); /* 0 for +x, π for -x */
          function lerpAng(a, b, tt) {
            let d = b - a;
            while (d > Math.PI) d -= Math.PI * 2;
            while (d < -Math.PI) d += Math.PI * 2;
            return a + d * tt;
          }
          let ang;
          if (t <= 0.5) ang = lerpAng(a0, amid, t * 2);
          else ang = lerpAng(amid, a1, (t - 0.5) * 2);
          const rFront = Math.hypot(fr.x, fr.z);
          const rBack = Math.hypot(bk.x, bk.z);
          const rMid = rad;
          const rr = t <= 0.5
            ? rFront + (rMid - rFront) * (t * 2)
            : rMid + (rBack - rMid) * ((t - 0.5) * 2);
          const x = Math.cos(ang) * rr;
          const z = Math.sin(ang) * rr;
          const nx = Math.cos(ang), nz = Math.sin(ang);
          const srcI = t < 0.35 ? fr.i : (t > 0.65 ? bk.i : -1);
          row.push(pushVert(x, y, z, nx, 0, nz, srcI));
        }
        rings.push(row);
      }
      for (let r = 0; r < RINGS; r++) {
        const a = rings[r], b = rings[r + 1];
        if (!a || !b) continue;
        for (let s = 0; s < SEGS; s++) {
          const a0 = a[s], a1 = a[s + 1], b0 = b[s], b1 = b[s + 1];
          /* outward winding: for +x, +z is front. Use a0,b0,b1 and a0,b1,a1
             so the normal points outward. */
          if (sx > 0) {
            I.push(a0, b0, b1, a0, b1, a1);
          } else {
            I.push(a0, b1, b0, a0, a1, b1);
          }
        }
      }
    }

    if (v < 8 || I.length < 24) return null;
    const T = window.THREE;
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(P, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(UV, 2));
    if (J.length && W.length) {
      const JArr = (v > 65535 || (jnt && jnt instanceof Uint16Array) ? Uint16Array : Uint16Array);
      geo.setAttribute('skinIndex', new T.BufferAttribute(new Uint16Array(J), jItem));
      geo.setAttribute('skinWeight', new T.Float32BufferAttribute(W, wItem));
      /* Three.js also reads JOINTS_0 / WEIGHTS_0 on skinned meshes from glTF */
      geo.setAttribute('JOINTS_0', geo.getAttribute('skinIndex'));
      geo.setAttribute('WEIGHTS_0', geo.getAttribute('skinWeight'));
    }
    geo.setIndex(I);
    try { geo.computeVertexNormals(); } catch (_) {}
    geo.computeBoundingSphere();
    return geo;
  }

  /* Hide these meshes ONLY when the local first-person camera is drawing,
     so a mirror or another player's camera still sees a solid torso. */
  function attachFpCull(mesh) {
    if (!mesh || mesh.userData._fpCull1262) return;
    mesh.userData._fpCull1262 = 1;
    const prevB = mesh.onBeforeRender;
    const prevA = mesh.onAfterRender;
    mesh.onBeforeRender = function (renderer, scene, cam) {
      try { if (typeof prevB === 'function') prevB.apply(this, arguments); } catch (_) {}
      this.userData._vis1262 = this.visible;
      try {
        const local = (typeof camera !== 'undefined' && cam === camera);
        const fp = (typeof camMode !== 'undefined' && camMode === 0);
        if (local && fp) this.visible = false;
      } catch (_) {}
    };
    mesh.onAfterRender = function () {
      try {
        if (this.userData._vis1262 != null) this.visible = this.userData._vis1262;
      } catch (_) {}
      try { if (typeof prevA === 'function') prevA.apply(this, arguments); } catch (_) {}
    };
  }

  function patchMesh(mesh) {
    try {
      if (!mesh || !(mesh.isMesh || mesh.isSkinnedMesh)) return false;
      if (mesh.userData.torsoSides1262) { attachFpCull(mesh); return false; }
      const n = (mesh.name || '') + ' ' + ((mesh.parent && mesh.parent.name) || '');
      if (!/visual_torso_outfit/.test(n)) return false;
      /* only the linen shirt primitive — skip sash / buttons if they are
         separate meshes; if they share one mesh with groups, still add
         sides using the linen-sized position attribute. */
      const geo = mesh.geometry;
      if (!geo || !geo.attributes || !geo.attributes.position) return false;
      /* Build the fill once per source geometry, then clone it for each
         instance so world, character and other players all get sides. */
      U._sideGeo = U._sideGeo || (typeof WeakMap === 'function' ? new WeakMap() : null);
      let sideGeo = null;
      try { sideGeo = U._sideGeo && U._sideGeo.get(geo); } catch (_) {}
      if (!sideGeo) {
        sideGeo = buildSideGeo(geo);
        if (sideGeo && U._sideGeo) { try { U._sideGeo.set(geo, sideGeo); } catch (_) {} }
      }
      if (!sideGeo) { attachFpCull(mesh); return false; }
      try { sideGeo = sideGeo.clone(); } catch (_) {}
      const T = window.THREE;
      let mat = mesh.material;
      /* prefer the linen material if the shirt uses an array (linen, tartan, buttons) */
      if (Array.isArray(mat)) {
        mat = mat.find(m => m && /Linen|eee6d6|linen|cloth|shirt/i.test((m.name || '') + (m.uuid || ''))) || mat[0];
      }
      /* clone so DoubleSide on the fill does not change the authored shirt */
      try { mat = mat.clone(); mat.side = T.DoubleSide; mat.needsUpdate = true; } catch (_) {}
      const side = mesh.isSkinnedMesh
        ? new T.SkinnedMesh(sideGeo, mat)
        : new T.Mesh(sideGeo, mat);
      side.name = 'torsoSides1262';
      side.userData.torsoSides1262 = 1;
      side.frustumCulled = false;
      side.castShadow = !!mesh.castShadow;
      side.receiveShadow = !!mesh.receiveShadow;
      side.renderOrder = (mesh.renderOrder || 0);
      if (mesh.isSkinnedMesh && mesh.skeleton) {
        try {
          const bm = mesh.bindMatrix && mesh.bindMatrix.clone ? mesh.bindMatrix.clone() : mesh.bindMatrix;
          side.bind(mesh.skeleton, bm);
        } catch (e) { ERR('bind', e); }
      }
      /* sibling, same parent — avoid a nested skinned transform */
      const parent = mesh.parent;
      if (parent) {
        parent.add(side);
        try { side.position.copy(mesh.position); side.quaternion.copy(mesh.quaternion); side.scale.copy(mesh.scale); } catch (_) {}
      } else {
        mesh.add(side);
      }
      mesh.userData.torsoSides1262 = 1;
      attachFpCull(mesh);
      attachFpCull(side);
      U.sides++;
      return true;
    } catch (e) { ERR('patch', e); return false; }
  }

  function patchRoot(root) {
    if (!root || root.userData && root.userData._torso1262) return 0;
    let n = 0;
    try {
      root.traverse(o => { if (patchMesh(o)) n++; });
      if (n) root.userData._torso1262 = 1;
    } catch (e) { ERR('root', e); }
    return n;
  }

  function tick() {
    try {
      if (typeof THREE === 'undefined') return;
      if (typeof worldModel !== 'undefined' && worldModel) U.patched += patchRoot(worldModel);
      if (typeof charModel !== 'undefined' && charModel) U.patched += patchRoot(charModel);
      /* other players / clones hanging off the pilot adapter */
      try {
        const p = window.__pilot1235;
        if (p && p.instances) {
          (p.instances.forEach ? p.instances : []).forEach && p.instances.forEach(m => { U.patched += patchRoot(m); });
        }
      } catch (_) {}
    } catch (e) { ERR('tick', e); }
  }
  U.tick = tick;
  U.patchRoot = patchRoot;

  try {
    if (typeof buildPlayerModel === 'function' && !buildPlayerModel._t1262) {
      const bpm = buildPlayerModel;
      window.buildPlayerModel = buildPlayerModel = function () {
        const model = bpm.apply(this, arguments);
        try { setTimeout(() => patchRoot(model), 0); } catch (_) {}
        try { setTimeout(() => patchRoot(model), 400); } catch (_) {}
        try { setTimeout(() => patchRoot(model), 1200); } catch (_) {}
        return model;
      };
      buildPlayerModel._t1262 = 1;
    }
  } catch (e) { ERR('bpm', e); }

  /* The Scottish GLB is attached asynchronously; patch as soon as it lands. */
  try {
    const hook = (p) => {
      if (!p || typeof p.attach !== 'function' || p._t1262) return;
      const a = p.attach.bind(p);
      p.attach = function (model) {
        const r = a.apply(this, arguments);
        const go = () => { try { if (model) patchRoot(model); tick(); } catch (_) {} };
        try { if (r && typeof r.then === 'function') r.then(go, go); } catch (_) {}
        [0, 100, 300, 800, 1600, 3200].forEach(ms => setTimeout(go, ms));
        return r;
      };
      p._t1262 = 1;
    };
    hook(window.__pilot1235);
    setTimeout(() => { try { hook(window.__pilot1235); } catch (_) {} }, 500);
    setTimeout(() => { try { hook(window.__pilot1235); } catch (_) {} }, 2000);
  } catch (e) { ERR('att', e); }

  [0, 200, 600, 1400, 3000, 6000, 10000].forEach(t => setTimeout(tick, t));
  setInterval(tick, 1500);
})();
