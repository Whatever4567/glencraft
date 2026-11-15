/* GLX-HANDSTP1282 (local WIP, t1201/t1202): third-person hand finish.

   The TP Scottish hands (GLOVE articulated fingers, skin) and the v15
   crystal gauntlet fingers read as flat, unfinished blocks. In the t1202
   "UHD with tricks" style this adds detail with baked per-vertex shading,
   not triangles:
   - joint creases at every knuckle and the finger/palm fold, baked from
     where the skin weights split between two finger bones;
   - knuckle highlights on the back of the hand;
   - fingernails on every fingertip (pale, glossy, with a lighter free
     edge), masked from the distal bone's own vertices;
   - on the crystal gauntlets, dark articulation seams and a silver edge at
     each finger joint so the fingers read as plated segments.
   Only vertices weighted to hand / finger / thumb bones change, so the
   rest of the v15 armour and the body look the same. No geometry is
   added or removed; two float attributes and a cloned material per hand. */
(function handsTp1282() {
  const U = window.__handsTp1282 = { err: null, on: 1, version: '1.2.82-wip', meshes: 0, mats: 0 };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 260); };
  const FINGER = /^(finger[LR]\d\d\d|thumb[LR]\d\d)$/;
  const HANDB = /^hand[LR]$/;
  const TIP = /^(finger[LR]\d02|thumb[LR]02)$/;
  const sideOf = nm => { const m = /^[a-z]+([LR])/.exec(nm || ''); return m ? m[1] : 'R'; };

  function isSkinHand(o) {
    const n = (o.name || '') + '|' + ((o.parent && o.parent.name) || '');
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    return /visual_arm_slot\d_hand/.test(n) && /articulated_finger/i.test(n) && m && /Skin/i.test(m.name || '');
  }
  function isGauntlet(o) {
    const n = (o.name || '') + '|' + ((o.parent && o.parent.name) || '');
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    return /gear_chest_slot\d/.test(n) && m && /ArmorTintable|Crystal_SilverRim|Crystal_IceInner/.test(m.name || '');
  }

  /* Bake aCrease / aNail / aKnuckle from bind-pose skin weights. */
  function bake(mesh, T) {
    const g = mesh.geometry;
    if (!g || g.userData.handsTp1282 || !g.attributes.skinIndex || !mesh.skeleton) return !!(g && g.userData.handsTp1282);
    const bones = mesh.skeleton.bones, inv = mesh.skeleton.boneInverses;
    const names = bones.map(b => b.name || '');
    const pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    const n = pos.count;
    const crease = new Float32Array(n), nail = new Float32Array(n), knk = new Float32Array(n);
    const v = new T.Vector3();
    /* per tip bone: bone-local centroid (finger axis) and extent */
    const tipInfo = {};
    const handVerts = { L: [], R: [] }, thumbTip = { L: null, R: null };
    for (let i = 0; i < n; i++) {
      const b = si.getX(i), w = sw.getX(i), nm = names[b];
      if (w > 0.85 && TIP.test(nm)) {
        v.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix).applyMatrix4(inv[b]);
        const t = tipInfo[b] || (tipInfo[b] = { c: new T.Vector3(), n: 0, verts: [] });
        t.c.add(v); t.n++; t.verts.push(i);
      }
      if (w > 0.9 && HANDB.test(nm)) handVerts[sideOf(nm)].push(i);
    }
    /* dorsal axis per hand: smallest-spread axis of the hand-bone verts,
       signed away from the thumb tip (the thumb sits palm-side). */
    const dorsalW = {};
    for (const side of ['L', 'R']) {
      const hv = handVerts[side]; if (hv.length < 12) continue;
      const c = new T.Vector3(); const p = new T.Vector3();
      for (const i of hv) { p.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix); c.add(p); } c.multiplyScalar(1 / hv.length);
      let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
      for (const i of hv) { p.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix).sub(c); xx += p.x * p.x; xy += p.x * p.y; xz += p.x * p.z; yy += p.y * p.y; yz += p.y * p.z; zz += p.z * p.z; }
      /* smallest eigenvector by inverse power iteration on (M + eps I) */
      const M = new T.Matrix3().set(xx, xy, xz, xy, yy, yz, xz, yz, zz);
      let inv3; try { inv3 = new T.Matrix3().copy(M).invert(); } catch (_) { inv3 = null; }
      if (!inv3 || !isFinite(inv3.elements[0])) continue;
      const e = new T.Vector3(0.3, 0.5, 0.8);
      for (let k = 0; k < 30; k++) e.applyMatrix3(inv3).normalize();
      /* thumb tip centroid in bind space */
      let tt = null;
      for (const b in tipInfo) if (names[b] === 'thumb' + side + '02') { tt = new T.Vector3(); for (const i of tipInfo[b].verts) { p.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix); tt.add(p); } tt.multiplyScalar(1 / tipInfo[b].verts.length); }
      if (tt && tt.clone().sub(c).dot(e) > 0) e.negate();
      dorsalW[side] = e;
    }
    for (const b in tipInfo) {
      const t = tipInfo[b]; t.c.multiplyScalar(1 / t.n);
      t.len = t.c.length() * 2;
      t.axis = t.c.clone().normalize();
      const side = sideOf(names[b]);
      const dw = dorsalW[side];
      if (dw) {
        /* dorsal direction into bone-local space */
        const bw = new T.Matrix4().copy(inv[b]).multiply(mesh.bindMatrix);
        const m3 = new T.Matrix3().setFromMatrix4(bw);
        t.dorsal = dw.clone().applyMatrix3(m3).normalize();
      }
    }
    const p2 = new T.Vector3();
    for (let i = 0; i < n; i++) {
      const b0 = si.getX(i), b1 = si.getY(i), w0 = sw.getX(i), w1 = sw.getY(i);
      const n0 = names[b0], n1 = names[b1];
      const f0 = FINGER.test(n0) || HANDB.test(n0), f1 = FINGER.test(n1) || HANDB.test(n1);
      if (b0 !== b1 && (FINGER.test(n0) || FINGER.test(n1)) && (f0 || f1) && w1 > 0.05) {
        crease[i] = Math.min(1, Math.pow(4 * w0 * w1, 1.6));
      }
      const t = tipInfo[b0];
      if (t && w0 > 0.85 && t.dorsal) {
        p2.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix).applyMatrix4(inv[b0]);
        const along = p2.dot(t.axis) / Math.max(1e-4, t.len);       /* 0 at joint, ~1 at tip */
        const rad = p2.clone().sub(t.axis.clone().multiplyScalar(p2.dot(t.axis)));
        const rl = rad.length();
        const d = rl > 1e-5 ? rad.dot(t.dorsal) / rl : 0;            /* 1 = straight up the back */
        const a = Math.max(0, Math.min(1, (along - 0.38) / 0.18)) * Math.max(0, Math.min(1, (0.98 - along) / 0.06 + 0.4));
        const s = Math.max(0, Math.min(1, (d - 0.45) / 0.3));
        nail[i] = Math.min(1, a * s * 1.2);
      }
      /* knuckle: back of the hand at the hand/finger-01 fold */
      if (b0 !== b1 && ((HANDB.test(n0) && /01$/.test(n1)) || (HANDB.test(n1) && /01$/.test(n0)))) {
        const side = HANDB.test(n0) ? sideOf(n0) : sideOf(n1);
        const dw = dorsalW[side];
        if (dw) {
          const nr = g.attributes.normal; if (nr) { p2.fromBufferAttribute(nr, i).transformDirection(mesh.bindMatrix); knk[i] = Math.max(0, p2.dot(dw)) * Math.min(1, 4 * w0 * w1); }
        }
      }
    }
    g.setAttribute('aCrease1282', new T.BufferAttribute(crease, 1));
    g.setAttribute('aNail1282', new T.BufferAttribute(nail, 1));
    g.setAttribute('aKnk1282', new T.BufferAttribute(knk, 1));
    g.userData.handsTp1282 = 1;
    U.meshes++;
    return true;
  }

  const MATS = new Map();
  function handMat(src, kind, T) {
    const key = src.uuid + ':' + kind;
    let m = MATS.get(key);
    if (m) return m;
    m = src.clone();
    m.name = (src.name || '') + '_hands1282';
    const skin = kind === 'skin';
    m.onBeforeCompile = function (sh) {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aCrease1282;\nattribute float aNail1282;\nattribute float aKnk1282;\nvarying float vCrease1282;\nvarying float vNail1282;\nvarying float vKnk1282;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCrease1282 = aCrease1282; vNail1282 = aNail1282; vKnk1282 = aKnk1282;');
      let frag = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vCrease1282;\nvarying float vNail1282;\nvarying float vKnk1282;');
      if (skin) {
        frag = frag.replace('#include <map_fragment>', `#include <map_fragment>
        {
          float cr = smoothstep(0.08, 0.9, vCrease1282);
          /* fold shadow, slightly warm (blood under thin skin) */
          diffuseColor.rgb *= mix(vec3(1.0), vec3(0.62, 0.50, 0.46), cr);
          /* knuckle sheen: lighter, a touch desaturated */
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.12 + vec3(0.03, 0.02, 0.02), clamp(vKnk1282 * 1.4, 0.0, 1.0));
          /* nail plate, lunula-ish pale base, lighter free edge */
          float nl = smoothstep(0.15, 0.75, vNail1282);
          vec3 nailC = mix(vec3(0.93, 0.76, 0.72), vec3(0.98, 0.93, 0.88), smoothstep(0.75, 1.0, vNail1282));
          diffuseColor.rgb = mix(diffuseColor.rgb, nailC, nl * 0.82);
        }`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.28, smoothstep(0.2, 0.8, vNail1282));
        roughnessFactor = mix(roughnessFactor, min(1.0, roughnessFactor + 0.15), smoothstep(0.1, 0.9, vCrease1282));`);
      } else {
        frag = frag.replace('#include <map_fragment>', `#include <map_fragment>
        {
          float cr = smoothstep(0.12, 0.85, vCrease1282);
          float seam = smoothstep(0.55, 0.95, cr);
          float rim = cr * (1.0 - seam);
          /* dark articulation seam with a bright silver lip beside it */
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.07, 0.10), seam * 0.85);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.90, 0.95), rim * 0.55);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.80, 0.86, 0.92), clamp(vKnk1282 * 1.2, 0.0, 1.0) * 0.4);
        }`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.18, smoothstep(0.2, 0.8, vCrease1282) * 0.6);`);
      }
      sh.fragmentShader = frag;
    };
    m.customProgramCacheKey = function () { return 'handsTp1282:' + kind; };
    m.needsUpdate = true;
    MATS.set(key, m);
    U.mats++;
    return m;
  }

  function patchMesh(o, T) {
    if (!o || !o.isSkinnedMesh || o.userData.handsTp1282) return;
    const skin = isSkinHand(o), gaunt = !skin && isGauntlet(o);
    if (!skin && !gaunt) return;
    o.userData.handsTp1282 = 1;
    if (!bake(o, T)) return;
    if (Array.isArray(o.material)) return;
    o.userData.handsTp1282Src = o.material;
    o.material = handMat(o.material, skin ? 'skin' : 'gauntlet', T);
  }

  function patchRoot(r, T) { try { r.traverse(o => patchMesh(o, T)); } catch (e) { ERR('root', e); } }

  function tick() {
    try {
      if (!U.on) return;
      const T = (typeof THREE !== 'undefined' && THREE) || window.THREE; if (!T) return;
      try { if (typeof worldModel !== 'undefined' && worldModel) patchRoot(worldModel, T); } catch (_) {}
      try { if (typeof charModel !== 'undefined' && charModel) patchRoot(charModel, T); } catch (_) {}
      try { const p = window.__pilot1235; if (p && p.instances && p.instances.forEach) p.instances.forEach(m => patchRoot(m, T)); } catch (_) {}
    } catch (e) { ERR('tick', e); }
  }
  U.tick = tick;
  [500, 1500, 4000, 8000].forEach(t => setTimeout(tick, t));
  setInterval(tick, 1500);
})();
