/* Original Glencraft anatomical hands (v1.1.101), no imported photographs or third-party mesh.
   A single indexed, weighted skin surface contains the wrist, shaped palm, thenar/hypothenar
   pads, four three-joint fingers and a two-joint opposing thumb. Mirroring is at build time,
   not by negative Object3D scale. Callers own one rigid hand root and its item-child matrices. */
(function (root) {
  'use strict';
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const FINGERS = [
    {name: 'little', x: -0.034, y: 0.080, z: 0.000, len: [0.029, 0.024, 0.023], r: 0.0077, fan: 0.15},
    {name: 'ring', x: -0.0115, y: 0.091, z: 0.000, len: [0.034, 0.027, 0.025], r: 0.0086, fan: 0.06},
    {name: 'middle', x: 0.0115, y: 0.094, z: 0.000, len: [0.036, 0.028, 0.026], r: 0.0090, fan: -0.025},
    {name: 'index', x: 0.034, y: 0.086, z: 0.003, len: [0.034, 0.024, 0.025], r: 0.0088, fan: -0.13}
  ];
  function makeHand(side, skinMaterial, nailMaterial) {
    side = side < 0 ? -1 : 1;
    const P = [], IDX = [], SW = [], SI = [], UV = [], bones = [new THREE.Bone()], fingers = [];
    bones[0].name = 'palm'; const groups = [0];
    function bone(name, parent) { const b = new THREE.Bone(); b.name = name; parent.add(b); bones.push(b); return bones.length - 1; }
    function vertex(p, weights) { weights = weights.slice();
      const id = P.length / 3, sum = weights.reduce((s, w) => s + w[1], 0) || 1;
      P.push(side * p.x, p.y, p.z); UV.push(p.x / 0.13 + 0.5, p.y / 0.21);
      const w = [0, 0, 0, 0], ix = [0, 0, 0, 0];
      for (let i = 0; i < Math.min(4, weights.length); i++) { ix[i] = weights[i][0]; w[i] = weights[i][1] / sum; }
      SI.push(...ix); SW.push(...w); return id;
    }
    function ring(n) { const a = []; for (let i = 0; i < n; i++) a.push(IDX.length / 3 + i); return a; }
    // Each cap belongs to its distal bone, so metacarpal and flexion loops never open.
    function tube(nodes, radii, circular, weights) {
      const start = P.length / 3, K = nodes.length, N = 12;
      for (let j = 0; j < K; j++) {
        const t0 = nodes[Math.max(0, j - 1)], t1 = nodes[Math.min(K - 1, j + 1)];
        const d = t1.clone().sub(t0).normalize(), ref = Math.abs(d.y) > 0.90 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
        const u = new THREE.Vector3().crossVectors(d, ref).normalize(), v = new THREE.Vector3().crossVectors(d, u).normalize();
        const rr = Array.isArray(radii[j]) ? radii[j] : [radii[j], radii[j]];
        for (let k = 0; k < N; k++) {
          const a = k / N * Math.PI * 2, p = nodes[j].clone().addScaledVector(u, Math.cos(a) * rr[0]).addScaledVector(v, Math.sin(a) * rr[1]);
          if (circular) p.copy(nodes[j]).addScaledVector(u, Math.cos(a) * rr[0]).addScaledVector(v, Math.sin(a) * rr[0]);
          vertex(p, weights[j]);
        }
      }
      for (let j = 0; j < K - 1; j++) for (let k = 0; k < N; k++) {
        const a = start + j * N + k, b = start + j * N + (k + 1) % N, c = a + N, d = b + N;
        if (side > 0) IDX.push(a, c, b, b, c, d); else IDX.push(a, b, c, b, d, c);
      }
      for (const end of [0, K - 1]) {
        const bi = weights[end][0][0], ci = vertex(nodes[end], [[bi, 1]]);
        for (let k = 0; k < N; k++) {
          const a = start + end * N + k, b = start + end * N + (k + 1) % N;
          if ((side > 0) !== (end === K - 1)) IDX.push(ci, a, b); else IDX.push(ci, b, a);
        }
      }

    }
    const P0 = new THREE.Vector3();
    const palmY = [-0.028, -0.016, 0.000, 0.022, 0.047, 0.068, 0.083, 0.095];
    const palmW = [0.020, 0.026, 0.030, 0.033, 0.037, 0.040, 0.037, 0.026];
    const palmD = [0.014, 0.016, 0.017, 0.018, 0.017, 0.013, 0.010, 0.008];
    const palm = palmY.map(y => P0.set(0, y, 0).clone()).concat([P0.set(0, 0.100, 0).clone()]);
    tube(palm, palmW.map((w, i) => [w, i === palmY.length ? 0.003 : palmD[i]]).concat([[0.003, 0.003]]), false,
      palmY.concat([0.100]).map(y => y >= 0.1 ? [[0, 1]] : [[0, 1]]));
    // Thenar/hypothenar eminences share palm weights: real padded relief, not sphere joints.
    for (const em of [-1, 1]) for (let i = 0; i < 8; i++) {
      const y = 0.009 + i * 0.009, a = em * (0.69 + i * 0.035), x = Math.sin(a) * 0.029, z = Math.cos(a) * 0.0165;
      const dy = (i / 7 - 0.45) * 0.034, bulge = Math.sin((i + 1) / 9 * Math.PI) * (em > 0 ? 0.0065 : 0.0038);
      // Surface relief is applied to nearby vertices below, preserving one watertight palm.
      for (let v = 0; v < palmY.length * 12; v++) {
        const ox = P[v * 3] * side, oy = P[v * 3 + 1], oz = P[v * 3 + 2];
        if (ox * em > 0 && Math.abs(oy - y) < 0.012 && oz > 0.004) {
          const dx = ox - x, dz = oz - z, f = Math.exp(-(dx * dx / 0.00018 + dy * dy / 0.00018 + dz * dz / 0.00012)) * bulge;
          P[v * 3 + 2] += f;
        }
      }
    }
    const PALM_INDICES = IDX.length;
    function bindPositions(b0, b1, b2, b3, a, b, c, d) {
      bones[b0].position.copy(a); bones[b1].position.copy(b.sub(a)); bones[b2].position.copy(c.sub(b)); bones[b3].position.copy(d.sub(c));
    }
    // Every finger is one connected tube. Each named joint is at its real bind ring and
    // neighbouring rings blend the parent/child; no independent cylinders slide apart.
    const restQ = new Map();
    for (let fi = 0; fi < FINGERS.length; fi++) {
      const f = FINGERS[fi], fan = f.fan * 0.12;
      const pts = [new THREE.Vector3(f.x, f.y - 0.009, f.z)];
      let y = f.y - 0.001;
      for (let seg = 0; seg < 3; seg++) for (let j = 0; j < 4; j++) { const yy = y + f.len[seg] * j / 4; pts.push(new THREE.Vector3(f.x + fan * yy, yy, f.z)); y += seg === 3 ? f.len[seg] / 4 : 0; if (j === 3) y += f.len[seg]; }
      pts.push(new THREE.Vector3(f.x + fan * y, y + 0.001, f.z));
      // Correct ring-centre lookup along the continuous phalanges.
      let yy = f.y - 0.001; pts.length = 1;
      for (let seg = 0; seg < 3; seg++) { for (let j = 0; j < 4; j++) { const v = yy + f.len[seg] * j / 4; pts.push(new THREE.Vector3(f.x + fan * v, v, f.z)); } yy += f.len[seg]; }
      pts.push(new THREE.Vector3(f.x + fan * yy, yy + 0.001, f.z));
      const met = bone(f.name + '_metacarpal', bones[0]), prox = bone(f.name + '_proximal', bones[met]), mid = bone(f.name + '_middle', bones[prox]), dist = bone(f.name + '_distal', bones[mid]);
      bindPositions(met, prox, mid, dist, pts[1], pts[5], pts[9], pts[13]);
      bones[prox].rotation.z = -side * fan;
      const radii = pts.map((p, j) => { const seg = Math.min(2, Math.floor((j - 1) / 4)), t = ((j - 1) % 4) / 4; return f.r * (1 - seg * 0.12) * (0.94 + 0.06 * Math.cos(t * Math.PI * 2)); });
      radii[0] = f.r * 1.025; radii[radii.length - 1] = 0.0018;
      const ids = [met, met, mid, dist, dist];
      const weights = pts.map((p, j) => { if (j <= 1) return [[prox, 1]]; const k = (j - 1) % 4, seg = Math.min(2, Math.floor((j - 1) / 4)); return [[ids[seg], k <= 1 ? 1 : k === 2 ? 0.6 : 0.2], [ids[seg + 1], k <= 1 ? 0 : k === 2 ? 0.4 : 0.8]]; });
      // Subtle dorsal knuckle pads and a flattened fingertip underside, in the same indexed surface.
      for (let j = 5; j < 14; j += 4) radii[j] *= 1.08;
      const first = P.length / 3; tube(pts, radii, true, weights);
      for (let j = 0; j < pts.length; j++) for (let k = 0; k < 12; k++) { const vi = first + j * 12 + k; if (P[vi * 3 + 2] < pts[j].z) P[vi * 3 + 2] = pts[j].z + (P[vi * 3 + 2] - pts[j].z) * 0.90; }
      nails.push({bone: dist, length: f.len[2] * 0.74, width: f.r * 1.36});
      fingers.push({name: f.name, met, prox, mid, dist, index: first, count: P.length / 3 - first});
    }
    // Thumb opposition: metacarpal on radial +X, crossing the palm towards -Z.
    const t0 = bone('thumb_metacarpal', bones[0]), t1 = bone('thumb_proximal', bones[t0]), t2 = bone('thumb_distal', bones[t1]);
    const tp = [new THREE.Vector3(0.026, 0.026, 0.003), new THREE.Vector3(0.032, 0.037, 0.005), new THREE.Vector3(0.037, 0.049, 0.012), new THREE.Vector3(0.042, 0.060, 0.022), new THREE.Vector3(0.044, 0.070, 0.033), new THREE.Vector3(0.043, 0.077, 0.044), new THREE.Vector3(0.040, 0.081, 0.055), new THREE.Vector3(0.038, 0.083, 0.060)];
    bindPositions(t0, t1, t2, t1, tp[0], tp[1], tp[3], tp[5]);
    // The distal bone inherits proximal support, then adds the last bending segment.
    bones[t2].position.copy(tp[5].clone().sub(tp[3]));
    const thumbIndex = P.length / 3;
    tube(tp, [0.014, 0.013, 0.0115, 0.0105, 0.0098, 0.009, 0.008, 0.002], true, [[[0, 0.65], [t0, 0.35]], [[t0, 1]], [[t0, 0.6], [t1, 0.4]], [[t1, 1]], [[t1, 0.4], [t2, 0.6]], [[t2, 1]], [[t2, 1]], [[t2, 1]]]);
    const thumbNail = {bone: t2, length: 0.024, width: 0.0105};
    bones[0].updateMatrixWorld(true);
    for (const b of bones) restQ.set(b, b.quaternion.clone());
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW, 4));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
    geo.setIndex(IDX); geo.clearGroups(); geo.addGroup(0, PALM_INDICES, 0); geo.addGroup(PALM_INDICES, IDX.length - PALM_INDICES, 0); geo.computeVertexNormals();
    const mesh = new THREE.SkinnedMesh(geo, skinMaterial); mesh.add(bones[0]); mesh.bind(new THREE.Skeleton(bones));
    mesh.frustumCulled = false; mesh.normalizeSkinWeights(); mesh.name = side > 0 ? 'right_anatomical_hand' : 'left_anatomical_hand';
    const hand = new THREE.Group(); hand.add(mesh); hand.userData.handSide = side; hand.userData.anatomical = 1;
    const nailM = nailMaterial || new THREE.MeshStandardMaterial({color: 0xd9aa91, roughness: 0.56});
    function nail(n) { const g = new THREE.SphereGeometry(1, 12, 6), p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * n.width, p.getY(i) * n.length * 0.48, p.getZ(i) * 0.0011); g.computeVertexNormals(); const m = new THREE.Mesh(g, nailM); m.position.set(0, n.length * 0.33, -0.0078); bones[n.bone].add(m); return m; }
    nails.forEach(nail); nail(thumbNail); nails.length = 0;
    const f = FINGERS.map((d, i) => [bones[fingers[i].prox], bones[fingers[i].mid]]);
    hand.userData.f = f;
    bones[t0].rotation.set(0,0,0); bones[t1].rotation.set(0,0,0); bones[t2].rotation.set(0,0,0);
    const th = bones[t0], tk = bones[t1]; th.userData.k = tk; hand.userData.th = th;
    hand.userData.anatomy = {side, thumbX: side * tp[0].x, radialSign: 1, bones, mesh, fingers: ['little', 'ring', 'middle', 'index'], thumb: [t0, t1, t2], vertices: P.length / 3, triangles: IDX.length / 3};
    pose.api = 1;
    function pose(curls, thumbCurl, spread) {
      curls = curls || [0.35, 0.40, 0.45, 0.35];
      for (let i = 0; i < 4; i++) {
        const c = clamp(curls[i] == null ? 0.4 : curls[i], 0, 1.25), row = f[i];
        row[0].quaternion.copy(restQ.get(row[0])).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.06 + c * 1.06, 0, side * (spread || 0) * (i - 1.5) * 0.10)));
        row[1].rotation.set(0.08 + c * 1.32, 0, 0); bones[fingers[i].dist].rotation.x = c * 0.65;
      }
      const t = clamp(thumbCurl == null ? 0.4 : thumbCurl, 0, 1);
      th.rotation.set(0.16 + t * 0.18, side * -t * 0.25, side * t * 0.16); tk.rotation.set(0.35 + t * 0.44, 0, side * t * 0.1); bones[t2].rotation.x = t * 0.36;
      hand.updateMatrixWorld(true);
    }
    hand.userData.pose = pose; pose();
    return hand;
  }
  const nails = [];
  root.GlenAnatomy = {makeHand};
})(typeof window !== 'undefined' ? window : globalThis);
