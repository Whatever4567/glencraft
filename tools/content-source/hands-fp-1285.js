/* GLX-HANDSFP1285 (v1.2.85, t1210): first-person hands match the current
   third-person hand look. Builds on the existing __fpa cube-arm rig and the
   1.2.71 sculpt (same groups, pivots, grips and animations). Fingers and
   the palm are remeshed with a rounder welded cross-section and smooth
   normals (the 1.2.71 tubes were flat-shaded 14-gons on a beveled box
   palm). Crease, knuckle and nail shading is the 1.2.83 TP recipe from
   hands-tp-1282.js, baked for the __fpa segment/joint topology rather than
   skin weights. Third-person GLOVE hands and hands-tp-1282 are not
   touched. No geometry is deleted, no grips or animation curves change,
   and fpa.step / held-frame / torch-pick jitter hooks are not wrapped. */
(function handsFp1285(W) {
  const U = W.__handsFp1285 = {
    err: null, on: 1, version: '1.2.85-fp-hands',
    rounded: 0, meshes: 0, mats: 0, baked: 0, sculpted: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };

  function T3() { return (typeof THREE !== 'undefined' && THREE) || W.THREE || null; }

  function roleOf(i, side) { return side >= 0 ? (3 - i) : i; }
  const WIDTH = [0.0072, 0.0073, 0.0067, 0.0058];
  const PROX = [0.0356, 0.0360, 0.0354, 0.0310];
  const MID  = [0.0166, 0.0172, 0.0164, 0.0136];
  const DIST = [0.0138, 0.0162, 0.0140, 0.0098];
  const BEND = [0.08, 0.07, 0.11, 0.16];

  const GEO = {};
  function share(key, build) {
    if (!GEO[key]) GEO[key] = build();
    return GEO[key];
  }

  function bagToGeo(bag) {
    const T = T3();
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(bag.pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(bag.nrm, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(bag.uv, 2));
    if (bag.col && bag.col.length) g.setAttribute('color', new T.Float32BufferAttribute(bag.col, 3));
    if (bag.idx && bag.idx.length) g.setIndex(bag.idx);
    g.computeVertexNormals();
    return g;
  }

  /* Rounded, welded palm — same overall size as 1.2.71 (W 0.066, H 0.100,
     D 0.023), same placement, but a fleshy rounded slab with smooth
     normals instead of a faceted BoxGeometry. */
  function palmGeo(side) {
    return share('palm85-' + (side >= 0 ? 'r' : 'l'), function () {
      const T = T3();
      const Wd = 0.066, Ht = 0.100, Dp = 0.023;
      const SU = 18, SV = 20, ST = 10;
      const pos = [], nrm = [], uv = [], col = [], idx = [];
      const ths = side >= 0 ? 1 : -1;
      const rx = 0.011, ry = 0.013, rz = 0.0075;
      function signedD(q, half, rad) {
        const a = Math.abs(q) - (half - rad);
        if (a <= 0) return q;
        return Math.sign(q) * (half - rad + Math.sqrt(rad * rad - Math.max(0, rad * rad - a * a)));
      }
      /* Build a rounded box by projecting a grid on each face, then
         rounding into the fillet. Easier and watertight: sample a
         superellipsoid and apply the 1.2.71 cup / waist / thenar. */
      const nu = SU, nv = SV;
      function deform(x, y, z) {
        const yn = (y + Ht * 0.5) / Ht;
        const xn = x / (Wd * 0.5);
        const wrist = 1 - 0.30 * Math.pow(Math.max(0, 1 - yn), 1.55);
        const tip = 1 - 0.08 * Math.pow(Math.max(0, yn - 0.78) / 0.22, 2);
        x *= wrist * tip;
        const cup = (1 - xn * xn) * Math.sin(Math.max(0.05, Math.min(0.95, yn)) * Math.PI);
        if (z < 0) z = z * 0.78 - 0.007 * cup;
        else z = z * 0.78 + 0.0025 * yn;
        if ((x * ths) > 0 && yn > 0.18 && yn < 0.72 && z <= 0.002) {
          const tu = (x * ths) / (Wd * 0.5);
          const tv = (yn - 0.42) / 0.28;
          const mound = Math.exp(-(Math.pow((tu - 0.62) * 3.2, 2) + tv * tv * 3.4));
          z += -0.006 * mound;
          x += ths * 0.003 * mound;
        }
        return { x: x, y: y, z: z, yn: yn, xn: xn };
      }
      /* Parametric rounded box: for each of 6 faces, a (su x sv) grid,
         vertices snapped onto the rounded-box surface. */
      const faces = [
        { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], su: SU, sv: SV },
        { n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0], su: SU, sv: SV },
        { n: [1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], su: ST, sv: SV },
        { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], su: ST, sv: SV },
        { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], su: SU, sv: ST },
        { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], su: SU, sv: ST }
      ];
      function onRoundedBox(px, py, pz) {
        const hx = Wd * 0.5 - rx, hy = Ht * 0.5 - ry, hz = Dp * 0.5 - rz;
        const cx = Math.max(-hx, Math.min(hx, px));
        const cy = Math.max(-hy, Math.min(hy, py));
        const cz = Math.max(-hz, Math.min(hz, pz));
        const dx = px - cx, dy = py - cy, dz = pz - cz;
        const L = Math.hypot(dx, dy, dz);
        if (L < 1e-8) return { x: px, y: py, z: pz };
        /* points already inside the inner box keep their face; points in
           the fillet are pushed onto the quarter-cylinder / sphere. */
        const k = 1 / L;
        return { x: cx + dx * k * rx, y: cy + dy * k * ry, z: cz + dz * k * rz };
      }
      for (let f = 0; f < faces.length; f++) {
        const F = faces[f];
        const hx = Wd * 0.5, hy = Ht * 0.5, hz = Dp * 0.5;
        const base = pos.length / 3;
        for (let j = 0; j <= F.sv; j++) {
          for (let i = 0; i <= F.su; i++) {
            const su = (i / F.su) * 2 - 1, sv = (j / F.sv) * 2 - 1;
            let px = F.n[0] * hx + F.u[0] * su * hx + F.v[0] * sv * hy;
            let py = F.n[1] * hy + F.u[1] * su * hx + F.v[1] * sv * hy;
            let pz = F.n[2] * hz + F.u[2] * su * hz + F.v[2] * sv * hz;
            /* remap v extent per axis (faces use hy or hz as v scale above
               inconsistently); rebuild from n/u/v unit axes. */
            px = F.n[0] * (Wd * 0.5) + F.u[0] * su * (F.u[0] ? Wd * 0.5 : (F.u[2] ? Dp * 0.5 : Ht * 0.5))
               + F.v[0] * sv * (F.v[0] ? Wd * 0.5 : (F.v[1] ? Ht * 0.5 : Dp * 0.5));
            py = F.n[1] * (Ht * 0.5) + F.u[1] * su * (F.u[0] ? Wd * 0.5 : (F.u[2] ? Dp * 0.5 : Ht * 0.5))
               + F.v[1] * sv * (F.v[0] ? Wd * 0.5 : (F.v[1] ? Ht * 0.5 : Dp * 0.5));
            pz = F.n[2] * (Dp * 0.5) + F.u[2] * su * (F.u[0] ? Wd * 0.5 : (F.u[2] ? Dp * 0.5 : Ht * 0.5))
               + F.v[2] * sv * (F.v[0] ? Wd * 0.5 : (F.v[1] ? Ht * 0.5 : Dp * 0.5));
            const rb = onRoundedBox(px, py, pz);
            const d = deform(rb.x, rb.y, rb.z);
            pos.push(d.x, d.y, d.z);
            nrm.push(0, 0, 0);
            const u = 0.5 + 0.5 * (d.z < 0 ? 0.5 + 0.5 * (d.x / (Wd * 0.5)) : 0.5 * (d.x / (Wd * 0.5) * 0.5 + 0.5));
            uv.push(d.z < 0 ? 0.5 + 0.5 * (0.5 + 0.5 * d.xn) : 0.5 * (0.5 + 0.5 * d.xn), d.yn);
            const cx = d.xn, cy = d.yn - 0.5;
            const well = (d.z < 0) ? Math.exp(-(cx * cx * 2.8 + cy * cy * 3.2)) : 0;
            const rim = Math.max(0, Math.abs(d.xn) - 0.55) + Math.max(0, Math.abs(d.yn - 0.5) - 0.42);
            let cr = 0.97, cg = 0.90, cb = 0.86;
            if (d.z < 0) { cr = 0.92; cg = 0.80; cb = 0.76; }
            cr -= well * 0.10; cg -= well * 0.12; cb -= well * 0.10;
            const rl = Math.min(1, rim * 1.4);
            col.push(cr + rl * 0.06, cg + rl * 0.06, cb + rl * 0.07);
          }
        }
        const rw = F.su + 1;
        for (let j = 0; j < F.sv; j++) {
          for (let i = 0; i < F.su; i++) {
            const a = base + j * rw + i, b = a + 1, c = a + rw, d = c + 1;
            if (F.n[0] + F.n[1] + F.n[2] > 0) idx.push(a, c, b, b, c, d);
            else idx.push(a, b, c, b, d, c);
          }
        }
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    });
  }

  /* Same 1.2.71 phalanx proportions, higher RAD, indexed, smooth normals. */
  function phalanxGeo(len, r0, r1, ovalZ, knuckle, bend, tipR) {
    const key = ['phx85', len, r0, r1, ovalZ, knuckle ? 1 : 0, bend || 0, tipR || 0].join(',');
    return share(key, function () {
      const RAD = 16;
      const rings = [];
      function pushRing(t, rm, sh) { rings.push({ t: t, rm: rm, sh: sh }); }
      pushRing(0.00, 1.00, 0.98);
      pushRing(0.16, 0.97, 0.97);
      if (knuckle) {
        pushRing(0.36, 1.06, 0.95);
        pushRing(0.58, 0.99, 0.99);
      } else {
        pushRing(0.40, 0.98, 0.99);
      }
      pushRing(0.80, 0.97, 1.00);
      pushRing(1.00, 0.96, 1.02);
      const cap = (tipR && tipR > 0) ? tipR : r1 * 0.55;
      const steps = [[0.22, 0.90], [0.45, 0.74], [0.68, 0.50], [0.88, 0.28], [1.00, 0.12]];
      for (let s = 0; s < steps.length; s++) {
        pushRing(1.00 + (cap * steps[s][0]) / Math.max(len, 0.001), steps[s][1], 1.05);
      }
      const oval = ovalZ || 0.90;
      function radiusAt(ring) {
        const tt = Math.min(1, ring.t);
        return (r0 + (r1 - r0) * Math.pow(tt, 0.85)) * ring.rm;
      }
      function centerAt(t) {
        const b = bend || 0;
        if (b < 1e-4) return { y: t * len, z: 0 };
        const R = len / b, a = b * Math.min(t, 1);
        return { y: R * Math.sin(a) + Math.max(0, t - 1) * len, z: -R * (1 - Math.cos(a)) };
      }
      const pos = [], nrm = [], uv = [], col = [], index = [];
      const rc = rings.length;
      for (let i = 0; i < rc; i++) {
        const ring = rings[i];
        const c = centerAt(ring.t);
        const r = radiusAt(ring);
        const vUv = (ring.t >= 0.995) ? 0.15 : Math.min(0.82, Math.max(0, ring.t));
        let cr = 1, cg = 0.98, cb = 0.96;
        if (ring.t >= 0.995) { cr = 1; cg = 0.98; cb = 0.95; }
        else if ((ring.sh || 1) < 0.96) { cr = 0.95; cg = 0.88; cb = 0.85; }
        for (let k = 0; k <= RAD; k++) {
          const a = (k / RAD) * Math.PI * 2;
          const palmar = Math.max(0, -Math.sin(a));
          const oz = oval * (1 - 0.08 * palmar);
          pos.push(Math.cos(a) * r, c.y, c.z + Math.sin(a) * r * oz);
          nrm.push(0, 0, 0);
          uv.push(k / RAD, vUv);
          col.push(cr, cg, cb);
        }
      }
      const rw = RAD + 1;
      for (let i = 0; i < rc - 1; i++) {
        for (let k = 0; k < RAD; k++) {
          const a = i * rw + k, b = a + 1, c = a + rw, d = c + 1;
          index.push(a, c, b, b, c, d);
        }
      }
      /* Solid shallow-dome caps so an end-on view is a fleshy pad, not a
         hollow tube. Winding is checked against the outward axis. */
      function capPole(ringIdx, outwardY) {
        const ring = rings[ringIdx];
        const c = centerAt(ring.t);
        const bump = Math.max(radiusAt(ring) * 0.45, 0.0012);
        const py = c.y + outwardY * bump;
        const pi = pos.length / 3;
        pos.push(0, py, c.z);
        nrm.push(0, outwardY, 0);
        uv.push(0.5, 0.15);
        col.push(1, 0.98, 0.95);
        const base = ringIdx * rw;
        const a0 = base, b0 = base + 1;
        const ax = pos[a0 * 3], ay = pos[a0 * 3 + 1], az = pos[a0 * 3 + 2];
        const bx = pos[b0 * 3], by = pos[b0 * 3 + 1], bz = pos[b0 * 3 + 2];
        const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
        const e2x = 0 - ax, e2y = py - ay, e2z = c.z - az;
        const ny = e1z * e2x - e1x * e2z;
        const flip = (ny * outwardY) < 0;
        for (let k = 0; k < RAD; k++) {
          const a = base + k, b = base + k + 1;
          if (flip) index.push(pi, b, a);
          else index.push(pi, a, b);
        }
      }
      capPole(0, -1);
      capPole(rc - 1, 1);
      return bagToGeo({ pos: pos, nrm: nrm, uv: uv, col: col, idx: index });
    });
  }

  function knuckleGeo(r, ovalZ) {
    return share(['kn85', r, ovalZ].join(','), function () {
      const RAD = 16, SEG = 6, oval = ovalZ || 0.90;
      const rr = r * 0.72;
      const pos = [], nrm = [], uv = [], col = [], index = [];
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG;
        const y = (t - 0.5) * rr * 0.95;
        const f = Math.sin(t * Math.PI);
        for (let k = 0; k <= RAD; k++) {
          const a = (k / RAD) * Math.PI * 2;
          pos.push(Math.cos(a) * rr * f, y, Math.sin(a) * rr * f * oval);
          nrm.push(0, 0, 0);
          uv.push(k / RAD, t);
          col.push(0.96, 0.90, 0.87);
        }
      }
      const rw = RAD + 1;
      for (let i = 0; i < SEG; i++) {
        for (let k = 0; k < RAD; k++) {
          const a = i * rw + k, b = a + 1, c = a + rw, d = c + 1;
          index.push(a, c, b, b, c, d);
        }
      }
      return bagToGeo({ pos: pos, nrm: nrm, uv: uv, col: col, idx: index });
    });
  }

  function matOf(mesh, kind) {
    const H71 = W.__hands1271, H70 = W.__hands1270, H65 = W.__hands1265;
    const src = H71 || H70 || H65;
    if (src) {
      if (kind === 'finger' && src._finger) return src._finger;
      if (kind === 'knuckle' && src._kn) return src._kn;
      if (kind === 'nail' && src._nail) return src._nail;
      if (kind === 'palm' && src._palm) return src._palm;
      if (kind === 'skin' && (src._skin || src._finger)) return src._skin || src._finger;
    }
    return mesh && mesh.material;
  }

  function directMeshes(group, pred) {
    const out = [];
    if (!group || !group.children) return out;
    for (let i = 0; i < group.children.length; i++) {
      const o = group.children[i];
      if (o && o.isMesh && (!pred || pred(o))) out.push(o);
    }
    return out;
  }

  function setGeo(mesh, geo, kind) {
    if (!mesh || !geo) return;
    mesh.geometry = geo;
    const m = matOf(mesh, kind);
    if (m) mesh.material = m;
    mesh.userData = mesh.userData || {};
    mesh.userData.sculpt1285geo = 1;
    mesh.userData.sculpt1285 = 1;
    mesh.userData.sculptKeep = 1;
    mesh.frustumCulled = false;
    U.rounded++;
  }

  /* Bake 1.2.83 crease / nail / knuckle attributes for __fpa topology. */
  function bake(mesh, kind) {
    const T = T3();
    const g = mesh && mesh.geometry;
    if (!g || !g.attributes || !g.attributes.position) return;
    if (g.userData.handsFp1285) return;
    const pos = g.attributes.position;
    const nrm = g.attributes.normal;
    const n = pos.count;
    const crease = new Float32Array(n), nail = new Float32Array(n), knk = new Float32Array(n);
    let ymin = Infinity, ymax = -Infinity;
    for (let i = 0; i < n; i++) {
      const y = pos.getY(i);
      if (y < ymin) ymin = y;
      if (y > ymax) ymax = y;
    }
    const span = Math.max(1e-5, ymax - ymin);
    for (let i = 0; i < n; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const yn = (y - ymin) / span;
      const nx = nrm ? nrm.getX(i) : 0;
      const ny = nrm ? nrm.getY(i) : 0;
      const nz = nrm ? nrm.getZ(i) : 0;
      const dorsal = Math.max(0, nz);
      if (kind === 'nail') {
        nail[i] = 0.55 + 0.45 * yn;
        knk[i] = 0;
        crease[i] = 0;
      } else if (kind === 'knuckle') {
        knk[i] = Math.min(1, dorsal * 1.2);
        crease[i] = Math.max(0, 1 - Math.abs(yn - 0.5) * 2) * 0.35;
      } else if (kind === 'palm') {
        /* Finger-root crease near the top edge; palmar life/head lines. */
        const root = Math.max(0, (yn - 0.78) / 0.22);
        const palmar = Math.max(0, -nz);
        crease[i] = Math.min(1, root * 0.9 + palmar * Math.exp(-((yn - 0.42) * (yn - 0.42) * 18 + x * x * 900)) * 0.55);
        knk[i] = Math.min(1, dorsal * Math.max(0, (yn - 0.72) / 0.28) * 1.1);
      } else if (kind === 'wrist') {
        crease[i] = Math.max(0, 1 - Math.abs(yn - 0.0) * 4) * 0.4;
      } else {
        /* Phalanx: crease at the proximal joint (and a soft mid-joint),
           knuckle sheen on the dorsal bulge. */
        const joint0 = Math.max(0, 1 - yn * 6);
        const joint1 = (yn > 0.85) ? Math.max(0, (yn - 0.85) / 0.15) : 0;
        crease[i] = Math.min(1, Math.pow(Math.max(joint0, joint1 * 0.45), 1.2));
        const bulge = Math.max(0, 1 - Math.abs(yn - 0.36) / 0.22);
        knk[i] = Math.min(1, dorsal * bulge * 1.15);
      }
    }
    g.setAttribute('aCrease1282', new T.BufferAttribute(crease, 1));
    g.setAttribute('aNail1282', new T.BufferAttribute(nail, 1));
    g.setAttribute('aKnk1282', new T.BufferAttribute(knk, 1));
    g.userData.handsFp1285 = 1;
    U.baked++;
    U.meshes++;
  }

  /* Same skin snippet as hands-tp-1282.js (crease / knuckle / nail). */
  function patchMat(m) {
    if (!m || (m.onBeforeCompile && m.onBeforeCompile.__handsFp1285)) return;
    const prev = m.onBeforeCompile;
    const prevKey = m.customProgramCacheKey;
    m.onBeforeCompile = function (sh, r) {
      if (typeof prev === 'function') prev.call(this, sh, r);
      if (!U.on) return;
      if (sh.vertexShader.indexOf('aCrease1282') >= 0) return;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aCrease1282;\nattribute float aNail1282;\nattribute float aKnk1282;\nvarying float vCrease1282;\nvarying float vNail1282;\nvarying float vKnk1282;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCrease1282 = aCrease1282; vNail1282 = aNail1282; vKnk1282 = aKnk1282;');
      let frag = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vCrease1282;\nvarying float vNail1282;\nvarying float vKnk1282;');
      frag = frag.replace('#include <lights_physical_fragment>', `
        {
          float cr = smoothstep(0.45, 1.0, vCrease1282);
          /* fold shadow, slightly warm (blood under thin skin) */
          diffuseColor.rgb *= mix(vec3(1.0), vec3(0.80, 0.70, 0.66), cr);
          /* knuckle sheen: lighter, a touch desaturated */
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.12 + vec3(0.03, 0.02, 0.02), clamp(vKnk1282 * 1.4, 0.0, 1.0));
          /* nail plate, lunula-ish pale base, lighter free edge */
          float nl = smoothstep(0.2, 0.7, vNail1282);
          vec3 nailC = diffuseColor.rgb * vec3(1.18, 1.05, 1.02) + vec3(0.07, 0.04, 0.04);
          nailC = mix(nailC, nailC + vec3(0.08, 0.07, 0.06), smoothstep(0.85, 1.0, vNail1282));
          diffuseColor.rgb = mix(diffuseColor.rgb, min(nailC, vec3(1.0)), nl * 0.7);

        roughnessFactor = mix(roughnessFactor, 0.28, smoothstep(0.2, 0.8, vNail1282));
        roughnessFactor = mix(roughnessFactor, min(1.0, roughnessFactor + 0.15), smoothstep(0.1, 0.9, vCrease1282));
        }
        #include <lights_physical_fragment>`);
      sh.fragmentShader = frag;
    };
    try { if (prev) for (const k of Object.keys(prev)) m.onBeforeCompile[k] = prev[k]; } catch (_) {}
    m.onBeforeCompile.__handsFp1285 = 1;
    m.customProgramCacheKey = function () {
      const k = typeof prevKey === 'function' ? prevKey.call(this) : '';
      return k + '|handsFp1285:' + (U.on ? 1 : 0);
    };
    m.needsUpdate = true;
    U.mats++;
  }

  function patchMesh(o, kind) {
    if (!o || !o.isMesh) return;
    bake(o, kind);
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (let i = 0; i < mats.length; i++) patchMat(mats[i]);
  }

  function refineFinger(f, k, role, isThumb) {
    const r = isThumb ? 0.0092 : (WIDTH[role] || 0.0066);
    const oval = isThumb ? 0.88 : 0.90;
    const bend = isThumb ? 0.07 : (BEND[role] || 0.09);
    if (isThumb) {
      directMeshes(f, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
        setGeo(o, phalanxGeo(0.054, 0.0132, 0.0100, oval, 1, bend, 0), 'finger');
        patchMesh(o, 'finger');
      });
      directMeshes(f, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
        setGeo(o, knuckleGeo(0.0088, oval), 'knuckle');
        patchMesh(o, 'knuckle');
      });
      if (k) {
        directMeshes(k, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
          setGeo(o, phalanxGeo(0.028, 0.0100, 0.0082, oval, 0, bend * 0.7, 0), 'finger');
          patchMesh(o, 'finger');
        });
        const d = k.userData && k.userData.d;
        if (d) {
          directMeshes(d, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
            setGeo(o, phalanxGeo(0.022, 0.0082, 0.0068, oval * 0.98, 0, bend * 0.45, 0.0105), 'finger');
            patchMesh(o, 'finger');
          });
          directMeshes(d, function (o) { return o.userData && (o.userData.nail1249 || o.userData.nail1265 || o.userData.nail1266 || o.userData.nail1270 || o.userData.nail1271); }).forEach(function (o) {
            /* Geometry only — keep 1.2.71 nail position / rotation. */
            patchMesh(o, 'nail');
          });
        }
      }
      return;
    }
    const lp = PROX[role], lm = MID[role], ld = DIST[role];
    const r0 = r, r1 = r * 0.92, r2 = r * 0.86, r3 = r * 0.82;
    const tipR = r3 * 0.98;
    directMeshes(f, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
      setGeo(o, phalanxGeo(lp, r0, r1, oval, 1, bend, 0), 'finger');
      patchMesh(o, 'finger');
    });
    directMeshes(f, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
      setGeo(o, knuckleGeo(r0 * 0.85, oval), 'knuckle');
      patchMesh(o, 'knuckle');
    });
    if (k) {
      directMeshes(k, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
        setGeo(o, phalanxGeo(lm, r1, r2, oval * 0.99, 1, bend * 0.85, 0), 'finger');
        patchMesh(o, 'finger');
      });
      directMeshes(k, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
        setGeo(o, knuckleGeo(r1 * 0.80, oval), 'knuckle');
        patchMesh(o, 'knuckle');
      });
      const d = k.userData && k.userData.d;
      if (d) {
        directMeshes(d, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
          setGeo(o, phalanxGeo(ld, r2, r3, oval * 0.98, 0, bend * 0.55, tipR), 'finger');
          patchMesh(o, 'finger');
        });
        directMeshes(d, function (o) { return o.userData && (o.userData.nail1249 || o.userData.nail1265 || o.userData.nail1266 || o.userData.nail1270 || o.userData.nail1271); }).forEach(function (o) {
          patchMesh(o, 'nail');
        });
      }
    }
  }

  function upgradeHand(h, side) {
    if (!h || h.userData.sculpt1285) return;
    h.userData.sculpt1285 = 1;
    const fingers = h.userData.f || [];
    for (let i = 0; i < fingers.length; i++) {
      const pair = fingers[i];
      if (!pair) continue;
      refineFinger(pair[0], pair[1], roleOf(i, side), false);
    }
    if (h.userData.th) {
      refineFinger(h.userData.th, h.userData.th.userData && h.userData.th.userData.k, 0, true);
    }
    try {
      h.traverse(function (o) {
        if (!o.isMesh || !o.userData) return;
        if (o.userData.palmAtlas) {
          setGeo(o, palmGeo(side), 'palm');
          patchMesh(o, 'palm');
        }
        if (o.userData.thenar1271) {
          setGeo(o, phalanxGeo(0.032, 0.0130, 0.0088, 0.62, 0, 0.18, 0.008), 'skin');
          patchMesh(o, 'finger');
        }
        if (o.userData.slimWrist1271) patchMesh(o, 'wrist');
      });
    } catch (e) { ERR('palm', e); }
    try {
      const kn = h.userData && h.userData.kn;
      if (kn) {
        for (let i = 0; i < kn.length; i++) {
          if (kn[i] && kn[i].isMesh) {
            setGeo(kn[i], knuckleGeo(0.0086, 0.88), 'skin');
            patchMesh(kn[i], 'knuckle');
          }
        }
      }
    } catch (_) {}
  }

  function upgradeArm(arm) {
    if (!arm || !arm.userData || !arm.userData.p) return;
    const p = arm.userData.p;
    const side = arm.userData.side || 1;
    if (p.h) upgradeHand(p.h, side);
  }

  function apply() {
    if (U._applying) return !!U.sculpted;
    U._applying = 1;
    try {
      const fpa = W.__fpa;
      if (!fpa) return false;
      const rig = (typeof fpa.rig === 'function' ? fpa.rig() : fpa.g);
      if (!rig) return false;
      /* Let 1.2.71 finish first so we build on its proportions. */
      try {
        if (W.__hands1271 && typeof W.__hands1271.apply === 'function' && !W.__hands1271.sculpted) {
          W.__hands1271.apply();
        }
      } catch (_) {}
      if (rig.userData.R) upgradeArm(rig.userData.R);
      if (rig.userData.L) upgradeArm(rig.userData.L);
      U.sculpted = 1;
      U.on = 1;
      return true;
    } catch (e) { ERR('apply', e); return false; }
    finally { U._applying = 0; }
  }
  U.apply = apply;

  /* Wrap 1271.apply only — not fpa.step, held-frame, or renderer. */
  function hook() {
    try {
      const H = W.__hands1271;
      if (H && typeof H.apply === 'function' && !H.__wrap1285) {
        const pa = H.apply.bind(H);
        H.apply = function () {
          const r = pa.apply(this, arguments);
          try { apply(); } catch (_) {}
          return r;
        };
        H.__wrap1285 = 1;
      }
    } catch (e) { ERR('hook', e); }
  }

  let n = 0;
  const boot = setInterval(function () {
    n++;
    hook();
    try { apply(); } catch (_) {}
    if (n > 80) clearInterval(boot);
  }, 50);
  [200, 500, 1000, 1800, 3000, 5000].forEach(function (ms) {
    setTimeout(function () { try { hook(); apply(); } catch (_) {} }, ms);
  });
  if (W.addEventListener) W.addEventListener('load', function () { hook(); apply(); });
})(typeof window !== 'undefined' ? window : this);
