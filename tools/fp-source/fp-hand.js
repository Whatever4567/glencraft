  /* v1.2.33 local FP shape pass: the first person hand and forearm are lofted anatomical surfaces (like the v1.2.30/31 third person sculpt)
     in place of the box palm and plain tubes. Same groups, joint origins, pivots and child order, so IK, grips, finger curl and poses are unchanged.
     loft(keys, len, opt): a closed tube along +y from 0 to len; keys [t, half width x, half depth z, centre z shift] eased between,
     superellipse sections (opt.p), rounded caps; opt.f(t, a, x, z) adds a radial offset (thenar mound, knuckle ridges, finger pads). */
  function loft(keys, len, o) { o = o || {}; const S = o.seg || 16, N = o.rings || 14, pw = o.p || 2.2, pos = [], idx = [];
    const at = t => { let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++; const a = keys[i], b = keys[i + 1], u = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0] || 1))), s = u * u * (3 - 2 * u); return [a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s, (a[3] || 0) + ((b[3] || 0) - (a[3] || 0)) * s]; };
    const cap0 = o.cap0 == null ? 0.35 : o.cap0, cap1 = o.cap1 == null ? 0.35 : o.cap1;
    const uv = [], RG = o.reg == null ? 3 : o.reg, S1 = S + 1;
    for (let r = 0; r <= N; r++) { const t = r / N, [rx, rz, cz] = at(t); let k = 1; if (r === 0) k = cap0; if (r === N) k = cap1;
      for (let jj = 0; jj <= S; jj++) { const j = jj % S; uv.push((RG + jj / S * 0.98 + 0.01) / 4, Math.min(0.99, Math.max(0.01, t))); const a = j / S * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), e = 2 / pw, x0 = Math.sign(c) * Math.pow(Math.abs(c), e), z0 = Math.sign(sn) * Math.pow(Math.abs(sn), e);
        let x = x0 * rx * k, z = z0 * rz * k; const d = o.f ? o.f(t, a, x, z) : 0; if (d) { const l = Math.hypot(x0, z0) || 1; x += x0 / l * d * k; z += z0 / l * d * k; } pos.push(x, t * len + (r === 0 ? -rz * 0.25 : r === N ? rz * 0.35 : 0), z + cz); } }
    const cA = pos.length / 3; pos.push(0, -(o.e0 == null ? 0.4 : o.e0) * at(0)[1] * 0.5, at(0)[2]); uv.push((RG + 0.5) / 4, 0.01); const cB = pos.length / 3; pos.push(0, len + at(1)[1] * (o.e1 == null ? 0.6 : o.e1), at(1)[2]); uv.push((RG + 0.5) / 4, 0.99);
    for (let r = 0; r < N; r++) for (let j = 0; j < S; j++) { const a = r * S1 + j, b = a + 1, c = a + S1, d = b + S1; idx.push(a, c, b, b, c, d); }
    for (let j = 0; j < S; j++) { idx.push(cA, j, j + 1); idx.push(cB, N * S1 + j + 1, N * S1 + j); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    { const nn = g.attributes.normal; for (let r = 0; r <= N; r++) { const a = r * S1, b = a + S; const x = nn.getX(a) + nn.getX(b), y = nn.getY(a) + nn.getY(b), z = nn.getZ(a) + nn.getZ(b), l = Math.hypot(x, y, z) || 1; nn.setXYZ(a, x / l, y / l, z / l); nn.setXYZ(b, x / l, y / l, z / l); } }   // smooth across the uv seam
    g.userData.fpLoft = 1233; return g; }
  const LM = (g, m) => { const x = new THREE.Mesh(g, m); x.userData.fpLoft = 1; return x; };
  // a finger bone: knuckle swell at the base, a waist, a joint pad at the far end; the back flatter than the pad side
  const bone = (r0, r1, len, tip) => (r0 *= 0.93, r1 *= 0.9, loft(tip ? [[0, r0 * 1.04, r0 * 0.86, 0], [0.3, r0 * 0.95, r0 * 0.8, 0.0004], [0.7, r1 * 0.98, r1 * 0.74, 0.0006], [1, r1 * 0.7, r1 * 0.55, 0.0003]]
      : [[0, r0 * 1.1, r0 * 0.88, 0], [0.18, r0 * 1.02, r0 * 0.82, 0], [0.55, r1 * 0.86, r1 * 0.74, 0.0004], [0.88, r1 * 1.0, r1 * 0.82, 0.0002], [1, r1 * 1.06, r1 * 0.88, 0]], len,
    {seg: 12, rings: tip ? 9 : 8, p: 2.3, reg: tip ? 2 : 1, cap0: 0.8, cap1: tip ? 0.55 : 0.85, e1: tip ? 0.9 : 0.3, f: tip ? (t, a, x, z) => z > 0 ? 0.0012 * Math.sin(Math.PI * Math.min(1, t * 1.3)) : (t > 0.42 && t < 0.96 && Math.abs(x) < r1 * 0.68 ? 0.0007 : 0) : null}));   /* pad underneath, a raised nail plate on the back of the end bone */
  /* skin atlas (original, painted in code, the same pixels every build): 4 strips (palm, finger bone, end bone, forearm); u runs round the
     section (0.25 = palm side +z, 0.75 = back -z), v along it. Near white multipliers on the shared skin colour: soft blotch, palm creases,
     joint creases and knuckle wrinkles, warmer knuckles and pads, a pale nail with a lunula and a darker rim. Also the bump map. */
  let SKA = null; function skinAtlas() { if (SKA) return SKA; const W = 512, H = 256, D = new Uint8Array(W * H * 4); let sd = 12345; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const G = []; for (let i = 0; i < 64 * 32; i++) G.push(R()); const nz = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, g = (a, b) => G[((b & 31) * 64 + (a & 63))], s = t => t * t * (3 - 2 * t); return (g(xi, yi) * (1 - s(fx)) + g(xi + 1, yi) * s(fx)) * (1 - s(fy)) + (g(xi, yi + 1) * (1 - s(fx)) + g(xi + 1, yi + 1) * s(fx)) * s(fy); };
    const line = (d, w) => Math.exp(-d * d / (w * w));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const rg = x >> 7, u = (x & 127) / 128, v = y / H, palm = u > 0.06 && u < 0.44, back = u > 0.56 && u < 0.94;
      let k = 0.955 + 0.03 * (nz(x / 9, y / 9) - 0.5) + 0.015 * (nz(x / 3, y / 3) - 0.5), r = 1, gg = 1, b = 1;
      if (rg === 0) { if (palm) { const pu = (u - 0.06) / 0.38; k -= 0.11 * line(v - (0.78 - 0.08 * pu * pu), 0.012) * (pu > 0.15 ? 1 : 0); k -= 0.1 * line(v - (0.68 - 0.1 * pu), 0.012) * (pu < 0.85 ? 1 : 0); k -= 0.12 * line(pu - (0.72 - 0.35 * Math.pow(1 - v, 1.5)), 0.02) * (v > 0.12 && v < 0.7 ? 1 : 0); k -= 0.06 * line(v - 0.06, 0.012); r = 1.0; gg = 0.97; b = 0.96; }
        if (back) { for (let i = 0; i < 4; i++) k += 0.025 * line(u - (0.62 + i * 0.09), 0.012) * Math.min(1, v * 1.5); if (v > 0.9) { gg = 0.96; b = 0.95; } } }
      else if (rg === 1 || rg === 2) { if (palm) { k -= 0.12 * line(v - 0.03, 0.012) + (rg === 1 ? 0.12 * line(v - 0.97, 0.012) : 0); if (rg === 2) { r = 1; gg = 0.95; b = 0.94; } }
        if (back) { const bu = (u - 0.75) / 0.19; if (rg === 1) { for (let i = 0; i < 3; i++) k -= 0.07 * line(v - 0.08 - i * 0.04 + 0.03 * bu * bu, 0.008) * (1 - Math.abs(bu)); gg -= 0.04 * line(v - 0.05, 0.08); b -= 0.05 * line(v - 0.05, 0.08); }
          else { const nl = Math.abs(bu) < 0.7 && v > 0.42 && v < 0.96; if (nl) { const e = Math.min(1 - Math.abs(bu) / 0.7, (v - 0.42) / 0.06, (0.96 - v) / 0.04); k = 0.99 - 0.05 * Math.max(0, 1 - e * 4) + 0.02 * line(v - 0.47, 0.025); r = 1; gg = 0.9; b = 0.93; if (v > 0.9) { gg = 0.97; b = 0.97; } } else { for (let i = 0; i < 3; i++) k -= 0.05 * line(v - 0.06 - i * 0.035, 0.007) * (1 - Math.abs(bu)); } } } }
      else { k = 0.965 + 0.02 * (nz(x / 12, y / 12) - 0.5); }
      const o = (y * W + x) * 4; D[o] = Math.max(0, Math.min(255, 255 * k * r)); D[o + 1] = Math.max(0, Math.min(255, 255 * k * gg)); D[o + 2] = Math.max(0, Math.min(255, 255 * k * b)); D[o + 3] = 255; }
    SKA = new THREE.DataTexture(D, W, H, THREE.RGBAFormat); SKA.magFilter = THREE.LinearFilter; SKA.minFilter = THREE.LinearMipmapLinearFilter; SKA.generateMipmaps = true; SKA.needsUpdate = true; SKA.userData = {fp: 1233}; return SKA; }
  const plainUV = g => { const p = g.attributes.position, a = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { a[i * 2] = 0.875; a[i * 2 + 1] = 0.5; } g.setAttribute('uv', new THREE.BufferAttribute(a, 2)); return g; };
  const sball = (r) => { const b = ball(r, skinM); plainUV(b.geometry); return b; };
  function mkHand(side) { const h = new THREE.Group(); if (!skinM.map) { try { skinM.map = skinAtlas(); skinM.bumpMap = skinM.map; skinM.bumpScale = 0.25; skinM.needsUpdate = true; } catch (e) { ERR('atlas', e); } }
    // palm: narrow thick heel at the wrist widening to the metacarpal arch at the knuckles; thenar mound on the thumb side, hypothenar
    // edge on the little finger side, cupped centre on the palm side (+z), metacarpal ridges on the back (-z)
    const pg = loft([[0, 0.026, 0.0135, 0.001], [0.16, 0.031, 0.0145, 0.002], [0.45, 0.034, 0.013, 0.0015], [0.8, 0.0365, 0.0115, 0.001], [1, 0.0355, 0.0105, 0.002]], 0.095,
      {seg: 28, rings: 18, p: 2.6, reg: 0, cap0: 0.75, cap1: 0.7, e0: 0.2, e1: 0.5, f: (t, a, x, z) => { let d = 0; const th = side * x > 0.012 ? (side * x - 0.012) / 0.024 : 0;
        if (z > 0) { d += 0.0085 * th * Math.exp(-Math.pow((t - 0.32) / 0.22, 2)); d += 0.0018 * (side * x < -0.014 ? 1 : 0) * Math.exp(-Math.pow((t - 0.4) / 0.3, 2)); d -= 0.0022 * Math.exp(-x * x / 2e-4) * Math.exp(-Math.pow((t - 0.55) / 0.25, 2)); d += 0.0016 * Math.exp(-Math.pow((t - 0.93) / 0.06, 2)); }
        else { for (let i = 0; i < 4; i++) d += 0.0012 * Math.exp(-Math.pow((x - (i - 1.5) * 0.0215) / 0.0045, 2)) * Math.min(1, t * 1.6); d += 0.0008 * Math.exp(-Math.pow((t - 0.95) / 0.07, 2)); }
        return d; }});
    pg.translate(0, -0.0475, 0); const palm = LM(pg, skinM); palm.position.set(0, 0.05, 0); h.add(palm);
    h.userData.f = []; const FL = [0.9, 1.0, 0.95, 0.78];   // index, middle, ring, little: length
    for (let i = 0; i < 4; i++) { const sc = 1, gw = 0.9 + 0.1 * FL[side > 0 ? 3 - i : i],   /* joint lengths kept (grips are fitted to them); girth differs per finger */ f = new THREE.Group(); f.position.set((i - 1.5) * 0.0215, 0.097 - Math.abs(i - 1.2) * 0.006, 0.004); f.rotation.z = (i - 1.5) * -0.05;
      f.add(LM(bone(0.0078 * gw, 0.0068 * gw, 0.036 * sc), skinM)); const k = new THREE.Group(); k.position.y = 0.036 * sc; f.add(k); k.add(LM(bone(0.0068 * gw, 0.006 * gw, 0.017 * sc), skinM));
      const kb = sball(0.0064 * gw); kb.scale.set(1, 0.7, 0.85); k.add(kb); const dj = new THREE.Group(); dj.position.y = 0.017 * sc; k.add(dj); const db = sball(0.0058 * gw); db.scale.set(1, 0.7, 0.85); dj.add(db); dj.add(LM(bone(0.006 * gw, 0.0056 * gw, 0.013 * sc, 1), skinM));
      const tip = sball(0.004 * gw); tip.scale.set(1, 0.6, 0.7); tip.position.y = 0.013 * sc; dj.add(tip); k.userData.d = dj;
      f.rotation.x = 1.0; k.rotation.x = 1.2; h.add(f); h.userData.f.push([f, k]); }
    // thumb: a broad metacarpal out of the thenar mound, then two tapering bones with a pad
    const th = new THREE.Group(); th.position.set(side * 0.038, 0.028, 0.01); th.rotation.set(0.85, side * 0.55, side * 0.85); th.add(LM(loft([[0, 0.0125, 0.0105, 0.002], [0.4, 0.0105, 0.0088, 0.001], [0.85, 0.0082, 0.0072, 0], [1, 0.0085, 0.0075, 0]], 0.05, {seg: 14, rings: 9, p: 2.3, reg: 1, cap0: 0.7, cap1: 0.85, e1: 0.3}), skinM));
    const tk = new THREE.Group(); tk.position.y = 0.05; tk.add(LM(bone(0.0082, 0.0074, 0.018), skinM)); const td = new THREE.Group(); td.position.y = 0.018; tk.add(td); const tb = sball(0.0072); tb.scale.set(1, 0.7, 0.85); td.add(tb); td.add(LM(bone(0.0074, 0.0068, 0.014, 1), skinM)); const tt = sball(0.0048); tt.scale.set(1, 0.6, 0.7); tt.position.y = 0.014; td.add(tt); tk.userData.d = td; th.add(tk); th.userData.k = tk; h.userData.th = th; h.add(th);
    // wrist: wider than deep, flaring into the heel of the palm so there is no step
    const wr = LM(loft([[0, 0.03, 0.023, 0], [0.5, 0.027, 0.0185, 0.0005], [1, 0.0262, 0.0142, 0.001]], 0.047, {seg: 24, rings: 8, p: 2.3, cap0: 1, cap1: 0.95, e0: 0, e1: 0.1, reg: 3}), skinM); wr.position.y = -0.035;
    { const kn = []; for (let i = 0; i < 4; i++) { const b = sball(0.0074); b.scale.set(1, 0.8, 0.6); b.position.set((i - 1.5) * 0.0215, 0.094, -0.006); h.add(b); kn.push(b); } h.userData.kn = kn; } h.add(wr); h.userData.fp = 1233; return h; }
  // forearm: round under the elbow, a muscle belly a quarter down, narrowing to a flat wide wrist
  const foreArm = () => LM(loft([[0, 0.044, 0.042, 0], [0.24, 0.046, 0.04, 0.002], [0.5, 0.042, 0.035, 0.001], [0.82, 0.036, 0.028, 0], [1, 0.034, 0.0265, 0]], LF, {seg: 26, rings: 16, p: 2.15, cap0: 0.9, cap1: 0.92, e1: 0.15,
    f: (t, a) => 0.0025 * Math.exp(-Math.pow((t - 0.3) / 0.15, 2)) * Math.max(0, Math.cos(a - 2.4)) + 0.0015 * Math.exp(-Math.pow((t - 0.85) / 0.1, 2)) * Math.max(0, -Math.sin(a))}), skinM);

  // forearm roll: the flat wrist turns with the palm (twist about the forearm axis to the nearer of the hand's +x/-x), so the wrist never
  // shows a slab edge across the hand; the cuff follows
  const twY = new THREE.Vector3(), twX = new THREE.Vector3(), twH = new THREE.Vector3(), twQ = new THREE.Quaternion();
  function twistFo(A) { if (!A || !A.visible) return; const p = A.userData.p; twY.set(0, 1, 0).applyQuaternion(p.fo.quaternion); twH.set(1, 0, 0).applyQuaternion(p.h.quaternion); twH.addScaledVector(twY, -twH.dot(twY)); if (twH.lengthSq() < 1e-6) return; twH.normalize();
    twX.set(1, 0, 0).applyQuaternion(p.fo.quaternion); let an = Math.atan2(twY.dot(twX.clone().cross(twH)), twX.dot(twH)); if (an > Math.PI / 2) an -= Math.PI; if (an < -Math.PI / 2) an += Math.PI;
    twQ.setFromAxisAngle(twY, an); p.fo.quaternion.premultiply(twQ); p.cuff.quaternion.copy(p.fo.quaternion); A.userData.tw = an; }