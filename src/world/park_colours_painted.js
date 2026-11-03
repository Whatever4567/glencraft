/* ===================== GLX-C184 (v1.0.35): the park's colours - painted overlays for cells inside the park zones (no free block ids left), and the flat signs / sundial numerals ===================== */
// A zone is [key, baseBlock, x0,y0,z0, x1,y1,z1]. Every exposed cell of that base block inside it gets a thin painted box (one InstancedMesh per colour).
// Break the block and the paint goes with it; the block itself (and what it drops) is unchanged.
(function c184() {
  const U = window.__c181; if (!U) return;
  const R = U.R = {n: 0, ms: 0, err: null, dirty: true, sig: -1};
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  function paint(key) { const c = cv(64), g = c.getContext('2d'); seed = 11 + key.length * 97;
    const fill = col => { g.fillStyle = col; g.fillRect(0, 0, 64, 64); }, dots = (n, cols, s0, s1) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; const s = s0 + rnd() * (s1 - s0); g.fillRect(rnd() * 64, rnd() * 64, s, s); } };
    if (key === 'pink') { fill('#e9a3a9'); dots(260, ['#f6d4d6', '#c97880', '#ffffff', '#8a5a5e', '#f2bcc0'], 1, 3); }
    else if (key === 'pinkg') { fill('#d7a19c'); dots(420, ['#e9bdb7', '#b98078', '#f4d8d2', '#a06a64'], 2, 5); }
    else if (key === 'cream') { fill('#efe2c2'); dots(200, ['#f7edd6', '#e0d0aa', '#e8dab8'], 2, 6); }
    else if (key === 'terra') { fill('#8a3e22'); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#c4643a' : '#b85a32'; g.fillRect(i * 32 + 2, j * 32 + 2, 28, 28); } dots(80, ['#d47a4c', '#a04a28'], 1, 3); }
    else if (key === 'gran') { fill('#9c3c32'); dots(380, ['#5a1e18', '#c86a5c', '#2a1a18', '#e09a8a'], 1, 3); }
    else if (key === 'wgrav') { fill('#e9e7df'); dots(420, ['#ffffff', '#c9c6bc', '#f4f2ea', '#b5b2a8'], 2, 5); }
    else if (key === 'rdoor') { fill('#b3221a'); g.strokeStyle = '#6a0e0a'; g.lineWidth = 4; g.strokeRect(6, 6, 52, 52); g.strokeStyle = '#d8483c'; g.lineWidth = 2; g.strokeRect(12, 12, 40, 40); dots(60, ['#a01c14', '#c22c22'], 1, 3); }
    else fill('#ff00ff');
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t; }
  const MAT = {}, MESH = {}, box = new THREE.BoxGeometry(1.006, 1.006, 1.006), M4 = new THREE.Matrix4();
  const mat = key => MAT[key] || (MAT[key] = new THREE.MeshLambertMaterial({map: paint(key)}));
  const CLEAR = new Set([0, T.WATER, T.GLASS, T.TORCH, 161, 162, 164, 165, 166, 167, 227, T.DOOR, T.DOORTOP, T.CHEST, T.COBWEB, T.LAVA]);
  const open = b => CLEAR.has(b) || (PLANT && PLANT[b]) || (LEAFY && LEAFY[b]);
  let BB = null; const bbox = () => { BB = null; for (const z of U.zones) { if (!BB) BB = [z[2], z[3], z[4], z[5], z[6], z[7]]; else { BB[0] = Math.min(BB[0], z[2]); BB[1] = Math.min(BB[1], z[3]); BB[2] = Math.min(BB[2], z[4]); BB[3] = Math.max(BB[3], z[5]); BB[4] = Math.max(BB[4], z[6]); BB[5] = Math.max(BB[5], z[7]); } } };
  function rebuild() { const t0 = performance.now(), per = {};
    for (const zn of U.zones) { const [key, base, x0, y0, z0, x1, y1, z1] = zn, L = per[key] || (per[key] = []);
      for (let x = Math.max(1, x0); x <= Math.min(W - 2, x1); x++) for (let z = Math.max(1, z0); z <= Math.min(D - 2, z1); z++) for (let y = Math.max(1, y0); y <= Math.min(H - 2, y1); y++) {
        const i = idx(x, y, z); if (world[i] !== base) continue;
        if (open(world[i + D]) || open(world[i - D]) || open(world[idx(x + 1, y, z)]) || open(world[idx(x - 1, y, z)]) || open(world[i + 1]) || open(world[i - 1])) L.push(x, y, z); } }
    for (const k in MESH) if (!per[k]) { MESH[k].visible = false; MESH[k].count = 0; }
    let n = 0; for (const key in per) { const L = per[key], c = L.length / 3; let m = MESH[key];
      if (!m || m.userData.cap < c) { if (m) { if (m.parent) m.parent.remove(m); m.dispose && m.dispose(); } m = new THREE.InstancedMesh(box, mat(key), Math.max(64, Math.ceil(c * 1.3))); m.userData.cap = Math.max(64, Math.ceil(c * 1.3)); m.frustumCulled = false; m.raycast = () => {}; m.matrixAutoUpdate = false; (typeof blockGroup !== 'undefined' && blockGroup ? blockGroup : scene).add(m); MESH[key] = m; }
      for (let j = 0; j < c; j++) { M4.makeTranslation(L[j * 3] + .5, L[j * 3 + 1] + .5, L[j * 3 + 2] + .5); m.setMatrixAt(j, M4); }
      m.count = c; m.instanceMatrix.needsUpdate = true; m.visible = c > 0; n += c; }
    bbox(); R.n = n; R.ms = Math.round(performance.now() - t0); }
  // ---------- signs ----------
  let SG = null, sgVer = -1;
  function signs() { if (SG) { scene.remove(SG); SG.traverse(o => { if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } if (o.geometry) o.geometry.dispose(); }); } SG = new THREE.Group(); scene.add(SG);
    for (const s of U.signs) { const c = cv(Math.max(64, Math.round(128 * s.w / s.h)), 128), g = c.getContext('2d'); if (s.bg && s.bg !== 'rgba(0,0,0,0)') { g.fillStyle = s.bg; g.fillRect(0, 0, c.width, c.height); }
      g.fillStyle = s.c || '#222'; g.font = 'bold 92px Georgia,serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s.t, c.width / 2, 68, c.width - 8);
      const t = new THREE.CanvasTexture(c); if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), new THREE.MeshLambertMaterial({map: t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, depthWrite: false})); m.raycast = () => {};
      if (s.flat) { m.rotation.x = -Math.PI / 2; m.rotation.z = -(s.rot || 0) + Math.PI / 2; m.position.set(s.x + .5, s.y + 1.02, s.z + .5); }
      else { m.position.set(s.x + .5 + s.dx * 0.52, s.y + .5, s.z + .5 + s.dz * 0.52); m.rotation.y = Math.atan2(s.dx, s.dz); }
      SG.add(m); } sgVer = U.ver; }
  // ---------- upkeep ----------
  try { const sb = setB; setB = function (x, y, z, v) { const r = sb.apply(this, arguments); try { if (BB && x >= BB[0] - 1 && x <= BB[3] + 1 && y >= BB[1] - 1 && y <= BB[4] + 1 && z >= BB[2] - 1 && z <= BB[5] + 1) R.dirty = true; } catch (_) {} return r; }; } catch (e) { R.err = 'setB ' + e; }
  let wait = 0;
  setInterval(() => { try { if (typeof started === 'undefined' || !started) return; const here = !DIM.cur && U.zones.length > 0;
      if (R.sig !== U.ver) { R.sig = U.ver; R.dirty = true; if (!U.zones.length) bbox(); }
      if (here && R.dirty && performance.now() > wait) { R.dirty = false; rebuild(); wait = performance.now() + 250; }
      if (sgVer !== U.ver) signs();
      let near = false; if (here && BB) { const cx = (BB[0] + BB[3]) / 2, cz = (BB[2] + BB[5]) / 2; near = Math.hypot(P.x - cx, P.z - cz) < 260; }
      for (const k in MESH) { const m = MESH[k]; m.visible = near && m.count > 0; if (m.parent !== blockGroup && typeof blockGroup !== 'undefined' && blockGroup) { if (m.parent) m.parent.remove(m); blockGroup.add(m); } } if (SG) SG.visible = near;
    } catch (e) { R.err = String(e && e.stack || e); } }, 200);
  U.rebuild = rebuild;
})();
