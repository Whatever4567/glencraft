/* ===================== GLX-C138 (v1.0.19): HD unicorn (white horse + golden-pearl horn on the HD head bone) ===================== */
(function c138() {
  const U = window.__c135; if (!U || !U.add || !U.headTop) return;
  let HG = null;
  // horn: spiral-banded cone on the front-top of the head, tilted forward; world-sized from the mob's scale
  function addHorn(a, m, hd) { const h = U.headTop(m, hd); if (!h) return null; hd.updateMatrixWorld(true);
    const b = h.b, len = Math.max(0.22, Math.min(0.4, (b.max.y - b.min.y) * 0.55));
    if (!HG) { HG = new THREE.ConeGeometry(0.06, 1, 10); HG.translate(0, 0.5, 0); }
    const HM = new THREE.MeshLambertMaterial({color: 0xf0e0b0, emissive: 0x6a5a30});
    const g = new THREE.Group(), c = new THREE.Mesh(HG, HM); c.scale.set(len / 0.62, len, len / 0.62); g.add(c);
    for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(U.ringG || (U.ringG = new THREE.TorusGeometry(1, 0.16, 4, 10)), HM); const k = 0.05 * (1 - i * 0.25) * len / 0.62; r.scale.setScalar(k); r.rotation.x = Math.PI / 2; r.position.y = len * (0.15 + i * 0.22); g.add(r); }
    // front of the head = the +z end in world (the HD group faces the mob's heading)
    const f = new THREE.Vector3(0, 0, 1).applyQuaternion(a.g.getWorldQuaternion(new THREE.Quaternion())), cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, hl = Math.max(b.max.x - b.min.x, b.max.z - b.min.z);
    g.position.set(cx + f.x * hl * 0.12, b.max.y - len * 0.08, cz + f.z * hl * 0.12);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(f.x * 0.9, 1, f.z * 0.9).normalize());
    g.updateMatrixWorld(true); h.bone.attach(g); g.traverse(o => o.userData.hd = 1); return HM; }
  U.post.push((a, c, M, m, hd, s, mats) => { if (c.horn) { const q = addHorn(a, m, hd); if (q && !mats.includes(q)) mats.push(q); } });
  U.add({nmunicorn: {f: 'whorse', horn: 1, mcol: {Main: 0xf4f2f6, Main_Light: 0xe2e0ea, Hair: 0xd8e4f4, Hooves: 0xb8c0d0, Muzzle: 0xd8ccd4}, emis: 0x1a1a22}});
})();
