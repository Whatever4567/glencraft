    /* v1.2.30 sculpted body. Taken from how the in game unicorn is made (one continuous low poly skin, flat facets, an animal outline and flat
       colour regions, no stacked boxes): the head, hair, torso, sash, arms, hands, legs and shoes are now single lofted surfaces whose cross
       sections change along the body (skull, brow, eye sockets, nose, cheekbones, jaw and chin; chest, waist and shoulders; deltoid, biceps,
       forearm, calf). Same pivots, joints, grips and face texture placement. Faceted normals, shared materials, a coarser copy far away. */
    const SC = {};
    SC.gs = (d, w) => Math.exp(-(d * d) / (w * w));
    SC.ad = (a, b) => { let d = a - b; d -= Math.round(d / (Math.PI * 2)) * Math.PI * 2; return d; };
    SC.sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    // keys [y, rx, zf, zb, n, z0]: half width, front depth, back depth, superellipse power, depth offset; smooth between keys
    SC.K = keys => t => { const y0 = keys[0][0], y1 = keys[keys.length - 1][0], y = y0 + (y1 - y0) * t; let i = 0; while (i < keys.length - 2 && y > keys[i + 1][0]) i++;
      const A = keys[i], B = keys[i + 1], u0 = Math.min(1, Math.max(0, (y - A[0]) / ((B[0] - A[0]) || 1))), u = u0 * u0 * (3 - 2 * u0), L = (k, d) => (A[k] == null ? d : A[k]) + ((B[k] == null ? d : B[k]) - (A[k] == null ? d : A[k])) * u;
      return {y, rx: L(1, 0), zf: L(2, 0), zb: L(3, 0), n: L(4, 2), z0: L(5, 0)}; };
    // rings along y, ns around (angle a: 0 front +z, pi/2 +x), closed ends; F adds [dx, dy, dz]; off pushes outward; keep filters triangles
    SC.raw = (S, nr, ns, F, off) => { const P = [], UV = [], I = [], C = [];
      for (let i = 0; i <= nr; i++) { const t = i / nr, s = S(t); C.push([s.y, s.z0 || 0]);
        for (let j = 0; j <= ns; j++) { const a = j / ns * Math.PI * 2, sa = Math.sin(a), ca = Math.cos(a), p = 2 / (s.n || 2), ex = Math.sign(sa) * Math.pow(Math.abs(sa), p), ez = Math.sign(ca) * Math.pow(Math.abs(ca), p);
          let x = s.rx * ex, z = (ca > 0 ? s.zf : s.zb) * ez, y = s.y; const o = off ? off(a, t, y) : 0; if (o) { const l = Math.hypot(x, z) || 1; x += x / l * o; z += z / l * o; }
          if (F) { const d = F(a, t, y, x, z); if (d) { x += d[0] || 0; y += d[1] || 0; z += d[2] || 0; } } P.push(x, y, z + (s.z0 || 0)); UV.push(j / ns, t); } }
      for (let i = 0; i < nr; i++) for (let j = 0; j < ns; j++) { const a = i * (ns + 1) + j, b = a + ns + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
      const cb = P.length / 3; P.push(0, C[0][0], C[0][1]); UV.push(0.5, 0); const ct = cb + 1; P.push(0, C[nr][0], C[nr][1]); UV.push(0.5, 1);
      for (let j = 0; j < ns; j++) { I.push(cb, j, j + 1); const b = nr * (ns + 1) + j; I.push(ct, b + 1, b); }
      return {P, UV, I}; };
    SC.geo = (S, nr, ns, F, o) => { o = o || {}; const r = (o.raw || SC.raw)(S, nr, ns, F, o.off), P = r.P, UV = r.UV, I = r.I, out = [], uv = [];
      for (let k = 0; k < I.length; k += 3) { const a = I[k] * 3, b = I[k + 1] * 3, c = I[k + 2] * 3, cx = (P[a] + P[b] + P[c]) / 3, cy = (P[a + 1] + P[b + 1] + P[c + 1]) / 3, cz = (P[a + 2] + P[b + 2] + P[c + 2]) / 3;
        if (o.keep && !o.keep(cx, cy, cz)) continue; const tri = [a, b, c]; for (const q of tri) out.push(P[q], P[q + 1], P[q + 2]);
        if (o.uv) { const u3 = o.uv(cx, cy, cz, tri.map(q => [P[q], P[q + 1], P[q + 2]])); for (const w of u3) uv.push(w[0], w[1]); } else for (const q of tri) uv.push(UV[q / 3 * 2], UV[q / 3 * 2 + 1]); }
      const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ge.computeVertexNormals();
      // outward check against the loft axis; flip the winding if the surface came out inside out
      const pa = ge.attributes.position.array, na = ge.attributes.normal.array; let dot = 0; for (let i = 0; i < pa.length; i += 3) dot += pa[i] * na[i] + pa[i + 2] * na[i + 2] * 0.3;
      if (dot < 0) { for (let i = 0; i < pa.length; i += 9) for (let k = 0; k < 3; k++) { const t = pa[i + 3 + k]; pa[i + 3 + k] = pa[i + 6 + k]; pa[i + 6 + k] = t; } const ua = ge.attributes.uv.array; for (let i = 0; i < ua.length; i += 6) for (let k = 0; k < 2; k++) { const t = ua[i + 2 + k]; ua[i + 2 + k] = ua[i + 4 + k]; ua[i + 4 + k] = t; } ge.computeVertexNormals(); }
      if (o.rot) { ge.rotateX(o.rot); } ge.computeBoundingSphere(); ge.userData = {sculpt: o.tag || 1}; return ge; };
    SC.loft = (S, nr, ns, F, o) => { const hi = SC.geo(S, nr, ns, F, o); if (LODS) LODS.push([hi, SC.geo(S, Math.max(3, nr >> 1), Math.max(6, ns >> 1), F, o)]); return hi; };
    // head (head space: neck join y -0.02 to crown 0.505; face on +z)
    SC.headS = SC.K([[-0.04, 0.068, 0.06, 0.075, 2, -0.02], [0.0, 0.085, 0.09, 0.1, 2, -0.015], [0.03, 0.125, 0.17, 0.14, 2.2, 0], [0.07, 0.15, 0.19, 0.17, 2.3], [0.12, 0.18, 0.198, 0.192, 2.4], [0.2, 0.196, 0.205, 0.212, 2.5], [0.28, 0.202, 0.205, 0.22, 2.5], [0.36, 0.2, 0.198, 0.222, 2.4], [0.43, 0.18, 0.172, 0.203, 2.2], [0.48, 0.128, 0.118, 0.148, 2], [0.505, 0.02, 0.02, 0.03, 2]]);
    SC.headF = (a, t, y, x, z) => { const g = SC.gs, aa = Math.abs(a > Math.PI ? a - Math.PI * 2 : a), r = Math.hypot(x, z) || 1; let dz = 0, dr = 0;
      dz += (0.042 * g(y - 0.19, 0.028) + 0.016 * SC.sm(0.17, 0.2, y) * (1 - SC.sm(0.27, 0.3, y))) * g(aa, 0.11);   // nose tip and bridge, a real profile
      dz -= 0.008 * g(y - 0.155, 0.012) * g(aa, 0.14);   // under the nose
      dr -= 0.016 * g(aa - 0.5, 0.2) * g(y - 0.27, 0.034);   // eye sockets
      dr += 0.012 * g(y - 0.315, 0.018) * g(aa, 0.7);   // brow ridge
      dr += 0.012 * g(aa - 0.85, 0.3) * g(y - 0.215, 0.035);   // cheekbones
      dr -= 0.01 * g(aa - 0.9, 0.35) * g(y - 0.13, 0.03);   // hollow under the cheekbone
      dr += 0.008 * g(y - 0.115, 0.022) * g(aa, 0.35);   // mouth
      dr += 0.012 * g(y - 0.05, 0.022) * g(aa, 0.28);   // chin
      dr -= 0.006 * g(y - 0.37, 0.05) * g(aa - 1.45, 0.25);   // temples
      dr -= (1 - SC.sm(0.02, 0.15, y)) * 0.055 * SC.sm(0.7, 1.7, aa);   // the jaw line rises from the chin to below the ear, the neck shows under it
      return [x / r * dr, 0, z / r * dr + dz]; };
    // the painted face goes on the front by straight projection, as on the old block (eyes, brows and mouth stay where the eyelids are)
    SC.faceUV = (cx, cy, cz, tri) => (cz > 0.08 && Math.abs(cx) < cz * 1.25 && cy < 0.43 && cy > 0.0) ? tri.map(p => [(p[0] + 0.22) / 0.44, (p[1] - 0.01) / 0.48]) : [[0.5, 0.56], [0.5, 0.56], [0.5, 0.56]];
    SC.hairY = a => { const x = Math.abs(a > Math.PI ? a - Math.PI * 2 : a); return x < 0.55 ? 0.392 + 0.012 * Math.cos(x * 22) : x < 1.2 ? 0.392 - (x - 0.55) / 0.65 * 0.07 : x < 1.9 ? 0.322 : x < 2.6 ? 0.322 - (x - 1.9) / 0.7 * 0.25 : 0.072; };
    // hair: a cap that starts exactly on the hairline (front fringe, above the ears, low at the nape) and follows the skull to the crown
    SC.hairRaw = (S, nr, ns, F, off) => { const P = [], UV = [], I = [], y0 = -0.04, y1 = 0.505;
      for (let i = 0; i <= nr; i++) { const t = i / nr;
        for (let j = 0; j <= ns; j++) { const a = j / ns * Math.PI * 2, h = SC.hairY(a), y = h + (y1 - h) * Math.pow(t, 0.85), s = S((y - y0) / (y1 - y0)), sa = Math.sin(a), ca = Math.cos(a), p = 2 / (s.n || 2);
          let x = s.rx * Math.sign(sa) * Math.pow(Math.abs(sa), p), z = (ca > 0 ? s.zf : s.zb) * Math.sign(ca) * Math.pow(Math.abs(ca), p); const d = SC.headF(a, 0, y, x, z), o = off(a, t, y); x += d[0]; z += d[2]; const l = Math.hypot(x, z) || 1; x += x / l * o; z += z / l * o; P.push(x, y, z + (s.z0 || 0)); UV.push(j / ns, t); } }
      for (let i = 0; i < nr; i++) for (let j = 0; j < ns; j++) { const a = i * (ns + 1) + j, b = a + ns + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
      const ct = P.length / 3, st = S(1); P.push(0, y1 + 0.012, st.z0 || 0); UV.push(0.5, 1); for (let j = 0; j < ns; j++) { const b = nr * (ns + 1) + j; I.push(ct, b + 1, b); }
      return {P, UV, I}; };
    SC.hairKeep = (cx, cy, cz) => cy > SC.hairY(Math.atan2(cx, cz) < 0 ? Math.atan2(cx, cz) + Math.PI * 2 : Math.atan2(cx, cz));
    SC.hairOff = (a, t, y) => 0.014 + 0.02 * SC.sm(0.3, 0.47, y) + 0.008 * SC.gs(SC.ad(a, Math.PI), 0.9) * SC.sm(0.1, 0.3, y);
    // torso (body space): hips, waist, ribs, chest, broad shoulder line, trapezius, neck base
    SC.torsoS = SC.K([[0.86, 0.17, 0.115, 0.115, 2.3], [0.9, 0.19, 0.12, 0.125, 2.4], [1.0, 0.171, 0.112, 0.11, 2.3], [1.12, 0.19, 0.125, 0.12, 2.4], [1.24, 0.214, 0.138, 0.13, 2.6], [1.33, 0.236, 0.134, 0.126, 2.8], [1.4, 0.262, 0.11, 0.114, 3], [1.45, 0.16, 0.092, 0.09, 2.2], [1.48, 0.085, 0.075, 0.075, 2]]);
    SC.torsoF = (a, t, y, x, z) => { const g = SC.gs, r = Math.hypot(x, z) || 1; let dr = 0;
      dr += 0.012 * g(y - 1.26, 0.05) * (g(SC.ad(a, 0.6), 0.35) + g(SC.ad(a, -0.6), 0.35));   // chest
      dr += 0.008 * g(y - 1.3, 0.06) * (g(SC.ad(a, Math.PI - 0.6), 0.35) + g(SC.ad(a, Math.PI + 0.6), 0.35));   // shoulder blades
      dr -= 0.006 * g(SC.ad(a, Math.PI), 0.12) * SC.sm(0.95, 1.05, y) * (1 - SC.sm(1.3, 1.4, y));   // spine
      return [x / r * dr, 0, z / r * dr]; };
    SC.sashKeep = (cx, cy, cz) => Math.abs(cx * Math.cos(0.62) + (cy - 1.18) * Math.sin(0.62)) < 0.05 && cy > 0.9 && cy < 1.46;
    // limbs: sx is the side so the deltoid swells outward
    SC.upperS = SC.K([[-0.31, 0.045, 0.045, 0.045], [-0.27, 0.05, 0.05, 0.048], [-0.2, 0.054, 0.064, 0.05], [-0.12, 0.064, 0.064, 0.056], [-0.04, 0.078, 0.072, 0.07], [0.0, 0.08, 0.074, 0.072], [0.035, 0.064, 0.058, 0.058], [0.065, 0.012, 0.012, 0.012]]);   // rounded deltoid cap over the shoulder pivot
    SC.upperF = sx => (a, t, y, x) => [sx * x > 0 ? sx * 0 + x / (Math.abs(x) || 1) * 0.01 * SC.gs(y + 0.08, 0.06) : 0, 0, 0];
    SC.foreS = SC.K([[-0.29, 0.034, 0.024, 0.024], [-0.24, 0.037, 0.027, 0.027], [-0.14, 0.048, 0.042, 0.04], [-0.06, 0.054, 0.05, 0.047], [0.0, 0.05, 0.048, 0.046]]);
    SC.handS = SC.K([[-0.062, 0.04, 0.015, 0.017, 3], [-0.03, 0.048, 0.021, 0.02, 3.2], [0.02, 0.045, 0.023, 0.02, 2.8], [0.06, 0.034, 0.02, 0.018, 2.2]]);
    SC.handF = (a, t, y, x, z) => [0, 0, x > 0.015 && z > 0 ? 0.006 * SC.gs(y - 0.01, 0.03) : 0];   // thumb mound
    SC.thighS = SC.K([[-0.21, 0.06, 0.06, 0.06], [-0.17, 0.066, 0.07, 0.062], [-0.1, 0.078, 0.08, 0.075], [0.0, 0.088, 0.085, 0.085]]);
    SC.shinS = SC.K([[-0.33, 0.042, 0.04, 0.04], [-0.28, 0.045, 0.045, 0.046], [-0.2, 0.054, 0.05, 0.068], [-0.12, 0.062, 0.055, 0.074], [-0.05, 0.066, 0.062, 0.064], [0.0, 0.064, 0.064, 0.06]]);
    // shoe lofted heel to toe (loft y is forward, loft front is down after the turn): heel, instep, ball, toe
    SC.soleS = SC.K([[-0.112, 0.034, 0.015, 0.015, 3, 0.03], [-0.1, 0.059, 0.015, 0.015, 3, 0.03], [0.05, 0.066, 0.015, 0.015, 3, 0.03], [0.12, 0.063, 0.015, 0.015, 3, 0.03], [0.17, 0.044, 0.015, 0.015, 3, 0.028], [0.193, 0.012, 0.012, 0.012, 2, 0.026]]);
    SC.shoeS = SC.K([[-0.115, 0.03, 0.03, 0.03, 2], [-0.1, 0.055, 0.04, 0.045, 3], [-0.03, 0.06, 0.04, 0.056, 3], [0.05, 0.062, 0.04, 0.05, 3], [0.12, 0.059, 0.04, 0.03, 2.8], [0.17, 0.04, 0.035, 0.02, 2.4], [0.19, 0.01, 0.02, 0.01, 2]]);
