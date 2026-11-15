/* GLX-TORSO1262 (v1.2.62): Restore the missing sides of the Scottish shirt
   so the waist and stomach are a solid wrap in third person, in mirrors and
   in other players' views. The 1.2.35–1.2.53 scottish-base-v2 linen mesh
   has no side triangles from the hem up through mid-chest (the left and
   right azimuth bins are empty), which is why the white tee shows big
   holes at the waist. Side panels are added as a skinned sibling bound to
   the same skeleton, and are culled ONLY for the local player's first-person
   camera so the chest still does not block the view.

   1.2.82 (t1200): the chest is back. 1.2.62 also built "side panels" from
   the tartan sash primitive (and from the far-LOD vertex-palette shirt,
   which has no colour attribute for them, so they drew black). Those
   panels wrapped right across the chest and back, so in third person the
   white shirt and sash looked deleted under a dark slab. The fill is now
   off by default (U.SIDES) so the shirt draws exactly as in 1.2.61; if it
   is turned back on it only uses the linen shirt itself (and copies vertex
   colour where the source has it). Nothing on the player model is deleted.
   The first-person hide also never worked: setting visible=false inside
   onBeforeRender is too late in three r128 (the draw is already queued).
   The torso is now hidden by a visibility toggle around the local
   first-person camera's render only, and only on your own player model,
   so third person, mirrors and other players still see the full chest. */
(function torso1262() {
  const U = window.__torso1262 = { err: null, patched: 0, sides: 0, version: '1.2.84', fpHid: 0, SIDES: 1, KILT_FP: 1, BRIDGE: 1, WIDEN: 1, SASH_BACK: 1, BRIDGE_NB: 0.7, FILL_GLOW: 0.4,
    /* 1.2.84 torso volume (t1203): width / depth factors for the shirt core */
    SX: 1.38, SZF: 1.34, SZB: 1.18, FADE_Y0: 1.33, FADE_Y1: 1.42 };
  try { Object.assign(U, window.__torso1262cfg || {}); } catch (_) {}
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
    const col = attrArr(src, 'color');
    const cItem = (src.attributes && src.attributes.color && src.attributes.color.itemSize) || 3;
    const jItem = (src.attributes && src.attributes.JOINTS_0 && src.attributes.JOINTS_0.itemSize) || 4;
    const wItem = (src.attributes && src.attributes.WEIGHTS_0 && src.attributes.WEIGHTS_0.itemSize) || 4;

    const P = [], N = [], UV = [], J = [], W = [], I = [], C = [];
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
      if (col) {
        const ci = srcI >= 0 ? srcI : nearestVert(pos, x, y, z, n);
        for (let k = 0; k < cItem; k++) C.push(col[ci * cItem + k]);
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
    if (col && C.length === v * cItem) geo.setAttribute('color', new T.Float32BufferAttribute(C, cItem));
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

  /* 1.2.84 (t1203): close the shirt from its own edges. The scottish-base-v2
     linen (since 1.2.37, and narrower again in the v13 asset) is a front
     panel and a back panel: both sides are open from the hem to the
     armpit, and the henley placket is an open slit. Through those gaps the
     back-face-culled inside of the shirt draws nothing, so the torso reads
     as a flat white patch with holes. This zips each open side edge of the
     front panel to the matching edge of the back panel, and the two placket
     edges to each other, using the shirt's existing boundary vertices
     (exact positions and skin weights), so the seams meet with no cracks and
     nothing on the authored model is moved, rebuilt or deleted. */
  function buildBridgeGeo(src) {
    const T = window.THREE;
    const pa = src.getAttribute('position');
    const ix = src.index;
    if (!pa || !ix) return null;
    const pos = pa.array, n = pa.count, id = ix.array;
    const uvA = src.getAttribute('uv');
    const siA = src.getAttribute('skinIndex'), swA = src.getAttribute('skinWeight');
    const colA = src.getAttribute('color');
    const nA = src.getAttribute('normal');
    const NB = U.BRIDGE_NB == null ? 0.6 : U.BRIDGE_NB;
    /* weld by position so glTF seam duplicates count as one vertex */
    const keyOf = i => Math.round(pos[i * 3] * 1e4) + ',' + Math.round(pos[i * 3 + 1] * 1e4) + ',' + Math.round(pos[i * 3 + 2] * 1e4);
    const wmap = new Map(), rep = new Int32Array(n);
    for (let i = 0; i < n; i++) { const k = keyOf(i); let r = wmap.get(k); if (r === undefined) { r = i; wmap.set(k, r); } rep[i] = r; }
    const ecount = new Map();
    const ek = (a, b) => a < b ? a * 1048576 + b : b * 1048576 + a;
    for (let t = 0; t < id.length; t += 3) {
      const a = rep[id[t]], b = rep[id[t + 1]], c = rep[id[t + 2]];
      for (const [u, v] of [[a, b], [b, c], [c, a]]) { const k = ek(u, v); ecount.set(k, (ecount.get(k) || 0) + 1); }
    }
    const bset = new Set();
    ecount.forEach((c, k) => { if (c === 1) { bset.add(Math.floor(k / 1048576)); bset.add(k % 1048576); } });
    const X = i => pos[i * 3], Y = i => pos[i * 3 + 1], Z = i => pos[i * 3 + 2];
    /* the shirt's own extents decide the bands, so the far LOD works too */
    let y0 = 1e9, y1 = -1e9, zf = -1e9, zb = 1e9;
    for (let i = 0; i < n; i++) { if (Y(i) < y0) y0 = Y(i); if (Y(i) > y1) y1 = Y(i); if (Z(i) > zf) zf = Z(i); if (Z(i) < zb) zb = Z(i); }
    const zMid = (zf + zb) * 0.5, H = y1 - y0;
    const yLo = y0 + H * 0.05, yArm = y0 + H * 0.73;
    function chain(filter) {
      const out = [];
      bset.forEach(i => { if (filter(i)) out.push(i); });
      out.sort((a, b) => Y(a) - Y(b));
      const c = [];
      for (const i of out) if (!c.length || Y(i) - Y(c[c.length - 1]) > 0.002) c.push(i);
      return c;
    }
    const P = [], N = [], UV = [], SI = [], SW = [], C = [], I = [];
    let nv = 0;
    /* plain linen UV: the shirt vertex nearest the middle of the front */
    let uvPlain = null;
    if (uvA) {
      let best = -1, bd = 1e9;
      for (let i = 0; i < n; i++) { const d = Math.abs(X(i) - 0.04) + Math.abs(Y(i) - (y0 + H * 0.3)) + Math.abs(Z(i) - zf) * 2; if (d < bd) { bd = d; best = i; } }
      if (best >= 0) uvPlain = [uvA.getX(best), uvA.getY(best)];
    }
    function vert(i, nx, ny, nz) {
      P.push(X(i), Y(i), Z(i));
      /* blend the shirt's own edge normal with the outward hint so the
         fill shades continuously from the panel it joins */
      if (nA) { const l0 = Math.hypot(nx, ny, nz) || 1; nx = nA.getX(i) * NB + (nx / l0) * (1 - NB); ny = nA.getY(i) * NB + (ny / l0) * (1 - NB); nz = nA.getZ(i) * NB + (nz / l0) * (1 - NB); }
      const l = Math.hypot(nx, ny, nz) || 1; N.push(nx / l, ny / l, nz / l);
      if (uvPlain) UV.push(uvPlain[0] + (X(i) * 0.02), uvPlain[1] + (Y(i) - y0) * 0.02); else if (uvA) UV.push(uvA.getX(i), uvA.getY(i));
      if (siA && swA) { for (let k = 0; k < 4; k++) { SI.push(siA.getComponent ? siA.getComponent(i, k) : siA.array[i * 4 + k]); SW.push(swA.getComponent ? swA.getComponent(i, k) : swA.array[i * 4 + k]); } }
      if (colA) for (let k = 0; k < colA.itemSize; k++) C.push(colA.array[i * colA.itemSize + k]);
      return nv++;
    }
    /* zip two y-sorted chains; out = outward normal hint */
    function zip(A, B, outF) {
      if (A.length < 2 || B.length < 2) return 0;
      const va = A.map(i => { const o = outF(i); return vert(i, o[0], o[1], o[2]); });
      const vb = B.map(i => { const o = outF(i); return vert(i, o[0], o[1], o[2]); });
      let a = 0, b = 0, made = 0;
      const tri = (p, q, r) => {
        /* wind so the face normal agrees with the outward hint */
        const ax = P[q * 3] - P[p * 3], ay = P[q * 3 + 1] - P[p * 3 + 1], az = P[q * 3 + 2] - P[p * 3 + 2];
        const bx = P[r * 3] - P[p * 3], by = P[r * 3 + 1] - P[p * 3 + 1], bz = P[r * 3 + 2] - P[p * 3 + 2];
        const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx;
        const d = cx * (N[p * 3] + N[q * 3] + N[r * 3]) + cy * (N[p * 3 + 1] + N[q * 3 + 1] + N[r * 3 + 1]) + cz * (N[p * 3 + 2] + N[q * 3 + 2] + N[r * 3 + 2]);
        if (d >= 0) I.push(p, q, r); else I.push(p, r, q);
        made++;
      };
      while (a < A.length - 1 || b < B.length - 1) {
        if (b >= B.length - 1 || (a < A.length - 1 && Y(A[a + 1]) <= Y(B[b + 1]))) { tri(va[a], va[a + 1], vb[b]); a++; }
        else { tri(va[a], vb[b + 1], vb[b]); b++; }
      }
      return made;
    }
    let tris = 0;
    for (const sx of [-1, 1]) {
      const side = i => sx * X(i) > 0.045 && Y(i) > yLo && Y(i) < yArm;
      const F = chain(i => side(i) && Z(i) > zMid);
      const B = chain(i => side(i) && Z(i) <= zMid);
      tris += zip(F, B, i => [sx, 0, (Z(i) - zMid) * 3]);
    }
    /* henley placket slit: centre front, below the collar */
    {
      const slit = i => Math.abs(X(i)) < 0.03 && Z(i) > zMid + (zf - zMid) * 0.5 && Y(i) > y0 + H * 0.35 && Y(i) < y0 + H * 0.82;
      const L = chain(i => slit(i) && X(i) < 0);
      const R = chain(i => slit(i) && X(i) >= 0);
      tris += zip(L, R, () => [0, 0, 1]);
    }
    if (tris < 8) return null;
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(P, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
    if (UV.length) geo.setAttribute('uv', new T.Float32BufferAttribute(UV, 2));
    if (SI.length) { geo.setAttribute('skinIndex', new T.Uint16BufferAttribute(SI, 4)); geo.setAttribute('skinWeight', new T.Float32BufferAttribute(SW, 4)); }
    if (C.length && colA) geo.setAttribute('color', new T.Float32BufferAttribute(C, colA.itemSize));
    geo.setIndex(I);
    geo.computeBoundingSphere();
    geo.userData.bridgeTris1284 = tris;
    U.bridgeTris = (U.bridgeTris || 0) + tris;
    return geo;
  }
  U.buildBridgeGeo = buildBridgeGeo;

  /* Hide these meshes ONLY when the local first-person camera is drawing,
     so a mirror or another player's camera still sees a solid torso. */
  function attachFpCull(mesh) {
    if (!mesh || mesh.userData._fpCull1262) return;
    mesh.userData._fpCull1262 = 1;
    FP_SET.add(mesh);
  }

  /* 1.2.82: hide the registered torso meshes only while the renderer is
     drawing the local first-person camera, and only on your own player
     model (worldModel). Restored straight after that draw. */
  const FP_SET = new Set();
  function ownModel(o) {
    let wm = null;
    try { wm = (typeof worldModel !== 'undefined') ? worldModel : null; } catch (_) {}
    if (!wm) return false;
    for (let p = o; p; p = p.parent) if (p === wm) return true;
    return false;
  }
  function wrapRender() {
    try {
      if (typeof renderer === 'undefined' || !renderer || !renderer.render) return;
      if (renderer.render.__torso1282) return;
      const r0 = renderer.render;
      const wrapped = function (sc, cam) {
        let n = 0, hid = null;
        try {
          const fp = (typeof camMode !== 'undefined' && camMode === 0) && (typeof camera !== 'undefined' && cam === camera);
          if (fp && FP_SET.size) {
            FP_SET.forEach(function (m) {
              if (!m.parent) { FP_SET.delete(m); return; }
              if (m.visible && ownModel(m)) { m.visible = false; (hid || (hid = []))[n++] = m; }
            });
            if (n) U.fpHid++;
          }
        } catch (_) {}
        try { return r0.apply(this, arguments); }
        finally { for (let i = 0; i < n; i++) hid[i].visible = true; }
      };
      wrapped.__torso1282 = 1;
      renderer.render = wrapped;
    } catch (e) { ERR('wrap', e); }
  }
  U.FP_SET = FP_SET;
  U.wrapRender = wrapRender;

  /* 1.2.84 (t1203): give the v2 shirt the refs' chest, waist and back
     volume by moving its existing vertices outward, weighted by how much
     each vertex follows the spine / pelvis bones (so sleeves, collar and
     armholes stay put and nothing tears). The sash and buttons get the same
     mapping so they stay on the cloth. Same vertices, same skin weights,
     same bones: nothing is rebuilt, added or deleted here. */
  const WIDENED = (typeof WeakSet === 'function') ? new WeakSet() : null;
  function widenMesh(mesh) {
    try {
      if (!U.WIDEN || !WIDENED || !mesh.isSkinnedMesh || !mesh.skeleton) return false;
      const geo = mesh.geometry;
      if (!geo || WIDENED.has(geo)) return false;
      const n0 = (mesh.name || '');
      if (!/visual_torso_outfit00\d/.test(n0)) return false;     /* near LOD only */
      const pa = geo.getAttribute('position'), si = geo.getAttribute('skinIndex'), sw = geo.getAttribute('skinWeight');
      if (!pa || !si || !sw) return false;
      WIDENED.add(geo);
      const torso = new Set();
      mesh.skeleton.bones.forEach((b, i) => { if (/^(spine|pelvis)/.test(b.name || '')) torso.add(i); });
      const ZC = U.ZC == null ? -0.026 : U.ZC;
      const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
      for (let i = 0; i < pa.count; i++) {
        let w = 0;
        const sIdx = [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)], sWt = [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)];
        for (let k = 0; k < 4; k++) if (torso.has(sIdx[k])) w += sWt[k];
        if (w <= 0.001) continue;
        const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
        const f = w * (1 - sm(U.FADE_Y0, U.FADE_Y1, y));
        if (f <= 0) continue;
        /* fuller chest than waist, like the refs */
        const chest = sm(1.12, 1.30, y);
        const sx = 1 + (U.SX - 1) * f * (0.75 + 0.25 * chest);
        const sz = 1 + ((z > ZC ? U.SZF : U.SZB) - 1) * f * (z > ZC ? (0.55 + 0.45 * chest) : 1);
        pa.setXYZ(i, x * sx, y, ZC + (z - ZC) * sz);
      }
      pa.needsUpdate = true;
      try { geo.computeBoundingSphere(); geo.computeBoundingBox(); } catch (_) {}
      U.widened = (U.widened || 0) + 1;
      return true;
    } catch (e) { ERR('widen', e); return false; }
  }
  U.widenMesh = widenMesh;

  /* 1.2.84 (t1203): the refs show no sash across the back. Hide (discard)
     only the sash fragments behind the body's mid-plane. A baked per-vertex
     flag drives it; nothing is deleted, and meshes sharing the material
     without the flag read 0 and draw as before. */
  function hideSashBack(mesh) {
    try {
      if (!U.SASH_BACK || !mesh.isMesh) return;
      const m = Array.isArray(mesh.material) ? null : mesh.material;
      if (!m || !/Tartan/i.test(m.name || '') || !/visual_torso_outfit00\d/.test(mesh.name || '')) return;
      const geo = mesh.geometry;
      if (!geo.getAttribute('aBack1284')) {
        const pa = geo.getAttribute('position'), a = new Float32Array(pa.count);
        const ZC = U.ZC == null ? -0.026 : U.ZC;
        for (let i = 0; i < pa.count; i++) a[i] = pa.getZ(i) < ZC - 0.01 ? 1 : 0;
        geo.setAttribute('aBack1284', new THREE.BufferAttribute(a, 1));
      }
      if (m.onBeforeCompile && m.onBeforeCompile.__sash1284) return;
      const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey;
      m.onBeforeCompile = function (sh, r) {
        if (typeof prev === 'function') prev.call(this, sh, r);
        if (sh.vertexShader.indexOf('aBack1284') >= 0) return;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aBack1284;\nvarying float vBack1284;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBack1284 = aBack1284;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vBack1284;')
          .replace(/void\s+main\s*\(\s*\)\s*\{/, 'void main() {\n  if (vBack1284 > 0.5) discard;\n');
      };
      try { if (prev) for (const k of Object.keys(prev)) m.onBeforeCompile[k] = prev[k]; } catch (_) {}
      m.onBeforeCompile.__sash1284 = 1;
      m.customProgramCacheKey = function () { return (typeof prevKey === 'function' ? prevKey.call(this) : '') + '|sash1284'; };
      m.needsUpdate = true;
      U.sashBack = (U.sashBack || 0) + 1;
    } catch (e) { ERR('sash', e); }
  }

  function patchMesh(mesh) {
    try {
      if (!mesh || !(mesh.isMesh || mesh.isSkinnedMesh)) return false;
      if (mesh.userData.torsoSides1262) { attachFpCull(mesh); return false; }
      const n = (mesh.name || '') + ' ' + ((mesh.parent && mesh.parent.name) || '');
      /* 1.2.82: the kilt, belt and sporran made a dark ring across the
         bottom of the screen when looking down in first person. Hide them
         for your own FP camera only, like the torso. */
      if (U.KILT_FP && /visual_(kilt|sporran)_clothing/.test(n)) { attachFpCull(mesh); return false; }
      if (!/visual_torso_outfit/.test(n)) return false;
      widenMesh(mesh);
      hideSashBack(mesh);
      /* only the linen shirt primitive — skip sash / buttons if they are
         separate meshes; if they share one mesh with groups, still add
         sides using the linen-sized position attribute. */
      const geo = mesh.geometry;
      if (!geo || !geo.attributes || !geo.attributes.position) return false;
      /* 1.2.82: only the linen shirt (or a vertex-coloured far-LOD shirt)
         gets side panels. The tartan sash / buttons primitives made dark
         slabs across the chest. */
      {
        const m0 = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const mn = (m0 && m0.name) || '';
        const linen = /Linen|eee6d6|shirt|cloth/i.test(mn) || (Array.isArray(mesh.material) && mesh.material.some(m => m && /Linen|eee6d6/i.test(m.name || '')));
        const vcol = !!(m0 && m0.vertexColors && geo.attributes.color);
        if (!linen && !vcol) { attachFpCull(mesh); return false; }
      }
      /* 1.2.82 (t1200) turned the old procedural fill off (it drew grey
         bands). 1.2.84 (t1203) turns the fill back on as the BRIDGE: the
         shirt's own open edges zipped together, see buildBridgeGeo. */
      if (!U.SIDES) { attachFpCull(mesh); return false; }
      /* Build the fill once per source geometry, then clone it for each
         instance so world, character and other players all get sides. */
      U._sideGeo = U._sideGeo || (typeof WeakMap === 'function' ? new WeakMap() : null);
      let sideGeo = null;
      try { sideGeo = U._sideGeo && U._sideGeo.get(geo); } catch (_) {}
      if (!sideGeo) {
        sideGeo = U.BRIDGE ? buildBridgeGeo(geo) : buildSideGeo(geo);
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
      /* 1.2.82: the glTF linen uses per-vertex tangents for its normal map;
         the fill has none, which lit it pitch black. Use screen-space
         tangents on the fill only. */
      try { if (mat.vertexTangents) mat.vertexTangents = false; } catch (_) {}
      /* 1.2.84: the bridge has flat linen UVs, so drop the weave normal map
         on the fill (screen-space tangents on flat UVs shade it grey). */
      if (U.BRIDGE) { try { mat.normalMap = null; mat.needsUpdate = true; } catch (_) {} }
      /* the flat side panel faces away from the key light; lift it with a
         faint cream glow so it blends with the lit front (FILL_GLOW) */
      if (U.BRIDGE && U.FILL_GLOW > 0) { try { if (mat.emissive) { mat.emissive.setRGB(0.93, 0.90, 0.84).multiplyScalar(U.FILL_GLOW); mat.needsUpdate = true; } } catch (_) {} }
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
      wrapRender();
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
