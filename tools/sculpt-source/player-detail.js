    /* v1.2.31 finer sculpt. The same lofted Highlander with many more rings where the eye reads form (face, ears, hair, neck, joints) and
       smooth shading instead of flat facets, so the bands across the face are gone but creases stay where the shape makes them: deeper eye
       sockets with an eyeball and lid folds, a nose with bridge, tip, wings and nostrils, real upper and lower lips with a mouth line and corners,
       a philtrum, smile folds, cheekbones, chin and jaw; ears with a rim, inner fold, bowl and lobe; hair in locks; neck, collarbones, elbows, knees,
       knuckles. Built once per model, shared materials, a much coarser copy far away. */
    // smooth version of the loft: shared vertices, the seam down the back welded so it shades as one surface
    SC.geoS = (S, nr, ns, F, o) => { o = o || {}; const r = (o.raw || SC.raw)(S, nr, ns, F, o.off), P = r.P, I = r.I.slice();
      const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      let UV = r.UV; if (o.vuv) { UV = []; for (let i = 0; i < P.length; i += 3) { const w = o.vuv(P[i], P[i + 1], P[i + 2]); UV.push(w[0], w[1]); } } ge.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
      ge.setIndex(I); ge.computeVertexNormals();
      const weld = () => { if (o.seam === false) return; const na = ge.attributes.normal; for (let i = 0; i <= (r.rows || nr); i++) { const a = i * ((r.cols || ns) + 1), b = a + (r.cols || ns); if (b >= na.count) break; const x = na.getX(a) + na.getX(b), y = na.getY(a) + na.getY(b), z = na.getZ(a) + na.getZ(b), l = Math.hypot(x, y, z) || 1; na.setXYZ(a, x / l, y / l, z / l); na.setXYZ(b, x / l, y / l, z / l); } };
      weld(); const pa = ge.attributes.position.array, nn = ge.attributes.normal.array; let dot = 0; for (let i = 0; i < pa.length; i += 3) dot += o.out ? o.out(pa[i], pa[i + 1], pa[i + 2], nn[i], nn[i + 1], nn[i + 2]) : pa[i] * nn[i] + pa[i + 2] * nn[i + 2] * 0.3;
      if (dot < 0) { const ix = ge.index.array; for (let k = 0; k < ix.length; k += 3) { const t = ix[k + 1]; ix[k + 1] = ix[k + 2]; ix[k + 2] = t; } ge.computeVertexNormals(); weld(); }
      if (o.rot) ge.rotateX(o.rot); ge.computeBoundingSphere(); ge.userData = {sculpt: o.tag || 1, smooth: 1}; return ge; };
    SC.loftS = (S, nr, ns, F, o) => { o = o || {}; const hi = SC.geoS(S, nr, ns, F, o), d = o.lod || 1; if (LODS) LODS.push([hi, (o.loGeo || SC.geo)(S, Math.max(3, nr >> d), Math.max(6, ns >> d), F, Object.assign({}, o, {uv: o.vuv ? ((cx, cy, cz, tri) => tri.map(p => o.vuv(p[0], p[1], p[2]))) : null}))]); return hi; };
    // the head grid is denser where the face is: columns gather at the front (2.5 times), rings gather between chin and brow
    SC.warpA = s => Math.PI * 2 * s - 0.6 * Math.sin(Math.PI * 2 * s);
    SC.mkTW = dens => { const n = 400, c = [0]; for (let i = 1; i <= n; i++) c.push(c[i - 1] + dens((i - 0.5) / n)); return u => { const v = u * c[n]; let i = 0; while (i < n - 1 && c[i + 1] < v) i++; return (i + (v - c[i]) / ((c[i + 1] - c[i]) || 1)) / n; }; };
    SC.headTW = SC.mkTW(t => 1 + 1.6 * Math.exp(-(((t - 0.42) / 0.2) ** 2)));
    SC.torsoTW = SC.mkTW(t => 1 + 2.2 * Math.exp(-(((t - 0.9) / 0.07) ** 2)));   // rings gather at the collarbones
    SC.warped = (fn, aw, tw) => { SC.aw = aw === undefined ? SC.warpA : aw; SC.tw = tw || SC.headTW; try { return fn(); } finally { SC.aw = SC.tw = null; } };
    // face: every term is a smooth fall off around a feature centre (head space, before the 0.9 head scale)
    SC.ell = (x, y, cx, cy, rx, ry) => Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2));
    SC.headF2 = (a, t, y, x, z) => { const g = SC.gs, e = SC.ell, ax = Math.abs(x), r = Math.hypot(x, z) || 1, f = SC.sm(0.04, 0.14, z), aa = Math.abs(a > Math.PI ? a - Math.PI * 2 : a); let dr = 0, dz = 0;
      // brow ridge and glabella
      dr += f * (0.012 * g(y - 0.316, 0.017) * g(ax - 0.09, 0.075) + 0.005 * e(x, y, 0, 0.3, 0.03, 0.02));
      // eye socket, the eyeball inside it, upper lid fold and lower lid
      dr -= f * 0.02 * e(ax, y, 0.1, 0.273, 0.058, 0.038); dr += f * 0.011 * e(ax, y, 0.1, 0.27, 0.036, 0.024);
      { const re = Math.hypot((ax - 0.1) / 0.048, (y - 0.284) / 0.026); dr -= f * 0.003 * g(re - 1, 0.18) * SC.sm(0.265, 0.285, y); }
      dr += f * 0.0035 * e(ax, y, 0.1, 0.246, 0.032, 0.008);
      // nose: bridge narrowing up to the brow, tip, wings, nostrils, the crease round the wings
      { const pr = y > 0.3 ? 0 : y > 0.19 ? 0.008 + (0.3 - y) / 0.11 * 0.034 : y > 0.155 ? 0.042 + 0.004 * Math.sin((0.19 - y) / 0.035 * Math.PI) - (0.19 - y) / 0.035 * 0.034 : 0; const wn = 0.014 + 0.016 * SC.sm(0.3, 0.18, y);
        dz += f * (pr * g(x, wn) + 0.016 * e(x, y, 0, 0.186, 0.02, 0.017)); }
      dz += f * (0.016 * e(ax, y, 0.028, 0.17, 0.014, 0.016) - 0.008 * e(ax, y, 0.013, 0.158, 0.008, 0.006)); dr -= f * 0.004 * e(ax, y, 0.046, 0.17, 0.006, 0.02);
      // smile folds from the nose wings down and out, a little fullness beside them
      { const t2 = Math.min(1, Math.max(0, (0.165 - y) / 0.07)), lx = 0.047 + 0.028 * t2, d = ax - lx; const wv = SC.sm(0.08, 0.1, y) * (1 - SC.sm(0.165, 0.18, y)); dr -= f * wv * 0.0035 * g(d, 0.007); dr += f * wv * 0.0035 * g(d - 0.016, 0.012); }
      // mouth: a muzzle the lips sit on, philtrum, upper and lower lip, the line between them and the corners
      dz += f * 0.01 * e(x, y, 0, 0.12, 0.06, 0.036);
      dz -= f * 0.0028 * g(x, 0.006) * g(y - 0.14, 0.012); dz += f * 0.0016 * (g(ax - 0.011, 0.004)) * g(y - 0.14, 0.012);
      dz += f * 0.012 * g(y - 0.124, 0.0085) * g(x, 0.046) * (1 + 0.25 * g(ax - 0.014, 0.01)); dz += f * 0.014 * g(y - 0.103, 0.01) * g(x, 0.04);
      dz -= f * 0.007 * g(y - 0.1135, 0.0028) * g(x, 0.052); dz -= f * 0.005 * e(ax, y, 0.055, 0.113, 0.008, 0.009);
      // chin and the dip above it
      dz += f * 0.015 * e(x, y, 0, 0.05, 0.042, 0.022); dz -= f * 0.005 * g(y - 0.084, 0.008) * g(x, 0.04);
      // cheekbones, the hollow under them, temples, jaw line
      dr += f * 0.013 * e(ax, y, 0.138, 0.214, 0.042, 0.03); dr -= f * 0.005 * e(ax, y, 0.13, 0.14, 0.04, 0.035);
      dr -= 0.006 * g(y - 0.37, 0.05) * g(aa - 1.45, 0.25);
      dr -= (1 - SC.sm(0.0, 0.17, y)) * 0.055 * SC.sm(0.7, 1.8, aa);
      return [x / r * dr, 0, z / r * dr + dz]; };
    SC.faceVUV = (x, y) => [(x + 0.22) / 0.44, (y - 0.01) / 0.48];   // the painted face, projected from the front as before
    // hair in locks: grooves that sweep back and down, fuller on top, a side parting, fringe locks
    SC.hairOff2 = (a, t, y) => { const s = Math.sin(a * 15 + y * 18), lock = 0.008 * (s > 0 ? Math.sqrt(s) : -0.5 * Math.sqrt(-s)) * SC.sm(0.2, 0.36, y); return 0.014 + 0.022 * SC.sm(0.3, 0.47, y) + 0.008 * SC.gs(SC.ad(a, Math.PI), 0.9) * SC.sm(0.1, 0.3, y) + lock - 0.004 * SC.gs(SC.ad(a, -0.45), 0.05) * SC.sm(0.36, 0.44, y); };
    // ear: outline taller than wide with a lobe; front sheet with rim (helix), inner fold (antihelix), bowl (concha) and tragus; flat back sheet
    SC.earRaw = sx => (S, nu, nt) => { const P = [], UV = [], I = [], rows = 2 * nu;
      for (let i = 0; i <= rows; i++) { const front = i <= nu, u = front ? i / nu : (rows - i) / nu;
        for (let j = 0; j <= nt; j++) { const th = j / nt * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), lobe = s < 0 ? 1 - 0.25 * SC.sm(0.3, 1, -c) * (-s) : 1;
          const ry = 0.056 * (s > 0 ? 1 : 0.92), rz = 0.034 * lobe * (c > 0 ? 0.85 : 1), Y = u * ry * s, Z = u * rz * c - 0.006 * u * s;
          let X = front ? 0.006 + 0.012 * SC.gs(u - 0.86, 0.11) * (s > -0.7 ? 1 : 0.6) + 0.006 * SC.gs(u - 0.6, 0.09) * SC.sm(-0.3, 0.4, s) - 0.008 * SC.gs(u - 0.3, 0.22) * SC.sm(-0.2, 0.6, -s + 0.4) + 0.007 * SC.ell(Z, Y, 0.022, -0.006, 0.007, 0.01) + 0.006 * SC.sm(0.4, 1, -s) * SC.gs(u - 0.6, 0.3) : 0.003 * (1 - u * u);
          X += 0.016 * u * u * SC.sm(-0.2, 0.8, -c);   // the ear stands out more at the back
          P.push(sx * X, Y, Z); UV.push(j / nt, i / rows); } }
      for (let i = 0; i < rows; i++) for (let j = 0; j < nt; j++) { const a = i * (nt + 1) + j, b = a + nt + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
      return {P, UV, I, rows, cols: nt}; };
    SC.earOut = sx => (x, y, z, nx, ny, nz) => Math.abs(x) > 0.008 ? sx * nx : 0;
    // neck with the side muscles and a slight throat
    SC.neckS = SC.K([[-0.02, 0.1, 0.09, 0.09], [0.04, 0.082, 0.076, 0.082], [0.1, 0.073, 0.07, 0.076], [0.16, 0.075, 0.07, 0.08]]);
    SC.neckF = (a, t, y, x, z) => { const aa = Math.abs(a > Math.PI ? a - Math.PI * 2 : a), r = Math.hypot(x, z) || 1, sl = 0.6 + (0.16 - y) * 4; let dr = 0.006 * SC.gs(aa - sl, 0.18) - 0.004 * SC.gs(aa - sl - 0.4, 0.15); dr += 0.007 * SC.gs(y - 0.07, 0.015) * SC.gs(aa, 0.18); return [x / r * dr, 0, z / r * dr]; };
    // torso extras: collarbones and the notch between them
    SC.torsoF2 = (a, t, y, x, z) => { const d = SC.torsoF(a, t, y, x, z), r = Math.hypot(x, z) || 1, ax = Math.abs(x); let dr = 0;
      if (z > 0) { dr += 0.006 * SC.gs(y - (1.425 - 0.08 * ax), 0.009) * SC.sm(0.025, 0.06, ax) * (1 - SC.sm(0.17, 0.23, ax)); dr -= 0.006 * SC.ell(x, y, 0, 1.44, 0.02, 0.014); }
      return [d[0] + x / r * dr, 0, d[2] + z / r * dr]; };
    // joints: elbow point at the back of the forearm top, kneecap and shin bone, knuckles on the back of the hand
    SC.foreF = (a, t, y, x, z) => [0, 0, -0.008 * SC.ell(x, y, 0, -0.01, 0.02, 0.02) * (z < 0 ? 1 : 0)];
    SC.shinF = (a, t, y, x, z) => [0, 0, z > 0 ? 0.012 * SC.ell(x, y, 0, -0.012, 0.03, 0.025) + 0.003 * SC.gs(x, 0.012) * SC.sm(-0.3, -0.06, y) * (1 - SC.sm(-0.06, -0.03, y)) : 0];
    SC.handF2 = (a, t, y, x, z) => { const d = SC.handF(a, t, y, x, z); let k = 0; if (z < 0) for (let i = 0; i < 4; i++) k += 0.004 * SC.ell(x, y, -0.033 + i * 0.022, -0.056, 0.008, 0.008); return [d[0], 0, d[2] - k]; };
    SC.thighF = (a, t, y, x, z) => [0, 0, z > 0 ? 0.005 * SC.ell(x, y, 0, -0.19, 0.035, 0.02) : 0];
