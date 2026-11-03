/* ===================== GLX-C139 (v1.0.20): Glencraft look for HD models: pixel-noise textures (nearest filter) on box-projected UVs ===================== */
// Each HD mesh keeps its shape, rig and clips. Its stock colours (atlas texel or vertex colour) are baked into vertex colours,
// its UVs are replaced by a box projection at ~20 texels per block, and the map becomes a small Glencraft-style pixel pattern.
(function c139() {
  const U = window.__c135; if (!U || !U.rd || !U.spos) return;
  const rd = U.rd, N = 32, TX = {}, GEO = new Map();
  const RNG = s => { let x = s % 2147483647 || 7; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
  // ---- pattern painters: grey multipliers around 0.9 (stars is coloured) ----
  function pat(kind, amp) { amp = amp || 1; const key = kind + amp; if (TX[key] !== undefined) return TX[key]; if (kind === 'plain') return TX[key] = null;
    const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), d = g.createImageData(N, N), p = d.data, r = RNG(kind.length * 977 + kind.charCodeAt(0) * 31);
    const V = new Float32Array(N * N), C = new Float32Array(N * N * 3); let col = false;
    const at = (x, y) => ((y + N) % N) * N + ((x + N) % N), add = (x, y, v) => { V[at(x, y)] += v; };
    for (let i = 0; i < N * N; i++) V[i] = 0.9 + (r() - 0.5) * 0.14;
    const blot = (k, a, s) => { for (let i = 0; i < k; i++) { const x = r() * N | 0, y = r() * N | 0, w = 1 + r() * s | 0, v = (r() - 0.5) * a; for (let yy = 0; yy < w; yy++) for (let xx = 0; xx < w; xx++) add(x + xx, y + yy, v); } };
    if (kind === 'skin') { blot(30, 0.12, 3); for (let i = 0; i < 4; i++) { const x = r() * N | 0, y = r() * N | 0; for (let k = -1; k <= 1; k++) add(x + k, y, -0.08), add(x, y + k, -0.08); } }
    else if (kind === 'fur' || kind === 'feather') { for (let x = 0; x < N; x++) for (let y = 0; y < N; ) { const l = 2 + r() * 4 | 0, v = (r() - 0.5) * 0.2; for (let k = 0; k < l; k++) kind === 'fur' ? add(x, y + k, v) : add(y + k, x, v); y += l; } if (kind === 'feather') for (let y = 0; y < N; y += 4) for (let x = 0; x < N; x++) add(x, y + (Math.abs((x % 8) - 4) >> 1), -0.07); }
    else if (kind === 'wool') { for (let i = 0; i < 26; i++) { const x = r() * N | 0, y = r() * N | 0; for (let a = 0; a < 8; a++) add(x + Math.round(Math.cos(a * 0.785) * 2), y + Math.round(Math.sin(a * 0.785) * 2), 0.09); add(x, y, -0.1); } }
    else if (kind === 'cloth') { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) add(x, y, ((x + y) % 2 ? 0.03 : -0.03) + (y % 4 === 0 ? -0.05 : 0)); for (let i = 0; i < 4; i++) { const x = r() * N | 0; for (let y = 0; y < N; y++) add(x, y, -0.06); } }
    else if (kind === 'bone') { blot(20, 0.08, 2); for (let i = 0; i < 4; i++) { let x = r() * N | 0, y = r() * N | 0; for (let k = 0; k < 7; k++) { add(x, y, -0.16); x += r() < 0.5 ? 1 : 0; y += 1; } } }
    else if (kind === 'scales') { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const row = y >> 2, xx = (x + (row % 2) * 2) % 4, yy = y % 4; add(x, y, 0.08 - yy * 0.045 - (xx === 0 ? 0.05 : 0)); } }
    else if (kind === 'slime') { blot(14, 0.16, 4); for (let i = 0; i < 10; i++) { const x = r() * N | 0, y = r() * N | 0; add(x, y, 0.14); } }
    else if (kind === 'metal') { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) add(x, y, 0.06 - (y % 8) * 0.012 + (y % 8 === 7 ? -0.1 : 0)); for (let i = 0; i < 6; i++) { const x = r() * N | 0, y = (r() * 4 | 0) * 8 + 3; add(x, y, 0.14); add(x + 1, y + 1, -0.12); } }
    else if (kind === 'rock') { blot(40, 0.2, 3); for (let i = 0; i < 3; i++) { let x = r() * N | 0, y = r() * N | 0; for (let k = 0; k < 9; k++) { add(x, y, -0.18); x += 1; y += r() < 0.4 ? 1 : 0; } } }
    else if (kind === 'stars') { col = true; for (let i = 0; i < N * N; i++) { const v = V[i] - 0.9; C[i * 3] = 0.16 + v; C[i * 3 + 1] = 0.22 + v; C[i * 3 + 2] = 0.52 + v * 1.5; }
      for (let i = 0; i < 22; i++) { const x = r() * N | 0, y = r() * N | 0, b = 0.6 + r() * 0.4; const j = at(x, y); C[j * 3] = C[j * 3 + 1] = b; C[j * 3 + 2] = 1; if (r() < 0.3) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = at(x + dx, y + dy); C[q * 3] += 0.25; C[q * 3 + 1] += 0.25; C[q * 3 + 2] += 0.25; } } }
    if (amp !== 1) for (let i = 0; i < N * N; i++) V[i] = 0.9 + (V[i] - 0.9) * amp;
    for (let i = 0; i < N * N; i++) { const o = i * 4; if (col) { for (let k = 0; k < 3; k++) p[o + k] = Math.max(0, Math.min(255, C[i * 3 + k] * 255)); } else p[o] = p[o + 1] = p[o + 2] = Math.max(0, Math.min(255, V[i] * 255)); p[o + 3] = 255; }
    g.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.LinearEncoding; t.anisotropy = 1;
    return TX[key] = t; }
  U.glPat = pat;
  // ---- texel reader for a material map (atlas swatches / palette-swapped canvases), cached per image ----
  const PX = new WeakMap();
  function pixels(map) { const im = map && map.image; if (!im || !im.width) return null; let e = PX.get(im); if (e) return e;
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0); e = {d: x.getImageData(0, 0, cv.width, cv.height).data, W: cv.width, H: cv.height}; PX.set(im, e); return e; }
  // ---- per-geometry bake: vertex colour = old vertex colour x texel; uv = box projection (world-scaled) ----
  function bake(o, mats, dens, skip, sw) { const SW = sw ? Object.entries(sw).map(([f, t]) => [parseInt(f, 16), parseInt(t, 16)]).map(([f, t]) => [[f >> 16, f >> 8 & 255, f & 255], [(t >> 16) / 255, (t >> 8 & 255) / 255, (t & 255) / 255]]) : null; const g = o.geometry, A = g.attributes, n = A.position.count;
    // world scale of this mesh (skinned world size / raw size), bucketed so every mob of a kind shares one geometry
    const v = new THREE.Vector3(), wb = new THREE.Box3(), rb = new THREE.Box3(); for (let i = 0; i < n; i += Math.max(1, n / 200 | 0)) { wb.expandByPoint(o.isSkinnedMesh ? U.spos(o, i, v) : v.set(rd(A.position, i, 0), rd(A.position, i, 1), rd(A.position, i, 2)).applyMatrix4(o.matrixWorld)); rb.expandByPoint(v.set(rd(A.position, i, 0), rd(A.position, i, 1), rd(A.position, i, 2))); }
    const ws = wb.getSize(new THREE.Vector3()), rs = rb.getSize(new THREE.Vector3()), k = Math.max(ws.x, ws.y, ws.z) / Math.max(1e-6, rs.x, rs.y, rs.z), kq = Math.round(Math.log(k) * 12);
    const key = g.uuid + '|' + mats.map(m => (m.map ? m.map.uuid : '-') + (m.vertexColors ? 'v' : '')).join(',') + '|' + kq + '|' + dens + '|' + (skip || []).join() + '|' + JSON.stringify(sw || 0); if (GEO.has(key)) return GEO.get(key);
    const ng = new THREE.BufferGeometry(); for (const nm in A) if (nm !== 'uv' && nm !== 'color') ng.setAttribute(nm, A[nm]); if (g.index) ng.setIndex(g.index); for (const gr of g.groups) ng.addGroup(gr.start, gr.count, gr.materialIndex); ng.morphAttributes = g.morphAttributes;
    if (g.boundingSphere) ng.boundingSphere = g.boundingSphere.clone(); if (g.boundingBox) ng.boundingBox = g.boundingBox.clone();
    const col = new Float32Array(n * 3).fill(1), uv = new Float32Array(n * 2), mi = new Int8Array(n);   // material index per vertex (from groups)
    if (g.groups.length && g.index) for (const gr of g.groups) for (let j = gr.start; j < gr.start + gr.count; j++) mi[g.index.getX(j)] = gr.materialIndex || 0;
    const sc = Math.exp(kq / 12) * dens / N, nA = A.normal, M3 = new THREE.Matrix3();
    for (let i = 0; i < n; i++) { const m = mats[mi[i]] || mats[0];
      if (skip && skip.includes(m.name)) { if (A.uv) { uv[i * 2] = rd(A.uv, i, 0); uv[i * 2 + 1] = rd(A.uv, i, 1); } continue; }   // tartan keeps its planar UVs
      if (A.color && m.vertexColors) for (let c = 0; c < 3; c++) col[i * 3 + c] = rd(A.color, i, c);
      const P = m.map && A.uv && pixels(m.map); if (P) { let u = rd(A.uv, i, 0), q = rd(A.uv, i, 1); if (m.map.matrix) { m.map.updateMatrix(); M3.copy(m.map.matrix); const x = M3.elements; const u2 = x[0] * u + x[3] * q + x[6], q2 = x[1] * u + x[4] * q + x[7]; u = u2; q = q2; }
        u -= Math.floor(u); q -= Math.floor(q); const X = Math.min(P.W - 1, u * P.W | 0), Y = Math.min(P.H - 1, (m.map.flipY ? 1 - q : q) * P.H | 0), j = (Y * P.W + X) * 4; const hit = SW && SW.find(([f]) => Math.abs(P.d[j] - f[0]) < 8 && Math.abs(P.d[j + 1] - f[1]) < 8 && Math.abs(P.d[j + 2] - f[2]) < 8); for (let c = 0; c < 3; c++) col[i * 3 + c] *= hit ? hit[1][c] : P.d[j + c] / 255; }
      const x = rd(A.position, i, 0), y = rd(A.position, i, 1), z = rd(A.position, i, 2); let ax = 1, ay = 1, az = 1; if (nA) { ax = Math.abs(rd(nA, i, 0)); ay = Math.abs(rd(nA, i, 1)); az = Math.abs(rd(nA, i, 2)); }
      if (ax >= ay && ax >= az) { uv[i * 2] = z * sc; uv[i * 2 + 1] = y * sc; } else if (ay >= az) { uv[i * 2] = x * sc; uv[i * 2 + 1] = z * sc; } else { uv[i * 2] = x * sc; uv[i * 2 + 1] = y * sc; } }
    ng.setAttribute('color', new THREE.BufferAttribute(col, 3)); ng.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); ng.userData.gl = 1; GEO.set(key, ng); return ng; }
  // ---- the restyle pass: c.gl = {p: default pattern, m: {materialNameRegex: pattern}, col: {materialName: hex}, b: brightness} ----
  const EYE = /eye|pupil|iris|teeth|tooth|mouth/i;
  U.glStyle = (a, c, m, hd, mats) => { const G = c.gl; if (!G || U.glOff) return 0; hd.updateMatrixWorld(true); let n = 0;
    m.traverse(o => { if (!o.isMesh || !o.geometry || o.geometry.parameters || o.geometry.userData.gl) return; const ms = [].concat(o.material), sk = c.tartan || null;
      o.geometry = bake(o, ms, G.d || 20, sk, G.sw); n++;
      for (const x of ms) { if (sk && sk.includes(x.name)) { x.vertexColors = true; x.needsUpdate = true; continue; } let p = G.p || 'skin'; for (const re in (G.m || {})) if (new RegExp(re, 'i').test(x.name)) p = G.m[re]; if (EYE.test(x.name) && !(G.m && Object.keys(G.m).some(re => new RegExp(re, 'i').test(x.name)))) p = 'plain';
        x.map = pat(p, G.a); x.vertexColors = true; if (G.col && G.col[x.name] !== undefined) x.color.setHex(G.col[x.name]); if (p !== 'plain') x.color.multiplyScalar(G.b || (p === 'stars' ? 1 : 1.1)); x.needsUpdate = true; } });
    return n; };
})();
