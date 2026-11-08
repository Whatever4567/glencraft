// Measurements on the real hand rig: palm to surface, fingertip penetration, thumb side, wrist angle, elbow.
// Surfaces are dense samples of the item meshes (triangles sampled every few mm, each with its face normal), hashed in a 5 mm grid.
export function measurer(T) {
  const V = () => new T.Vector3();
  function surface(root, rel, skip, step = 0.0035, stop) { const inv = V().constructor && new T.Matrix4().copy(rel.matrixWorld).invert(), pts = []; root.updateMatrixWorld(true);
    root.traverse(m => { if (!m.isMesh || (skip && skip.test(m.name))) return; for (let x = m; x && x !== root.parent; x = x.parent) { if (!x.visible) return; if (stop && x !== rel && stop.includes(x)) return; }
      const mw = new T.Matrix4().multiplyMatrices(inv, m.matrixWorld), g = m.geometry, p = g.attributes.position, ix = g.index, n = ix ? ix.count : p.count, a = V(), b = V(), c = V(), nn = V();
      for (let i = 0; i < n; i += 3) { a.fromBufferAttribute(p, ix ? ix.getX(i) : i).applyMatrix4(mw); b.fromBufferAttribute(p, ix ? ix.getX(i + 1) : i + 1).applyMatrix4(mw); c.fromBufferAttribute(p, ix ? ix.getX(i + 2) : i + 2).applyMatrix4(mw);
        nn.subVectors(c, b).cross(V().subVectors(a, b)); if (nn.lengthSq() < 1e-14) continue; nn.normalize(); if (m.matrixWorld.determinant() < 0) nn.negate();
        const L = Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)), k = Math.max(1, Math.ceil(L / step));
        for (let u = 0; u <= k; u++) for (let v = 0; v <= k - u; v++) pts.push({p: V().addScaledVector(a, u / k).addScaledVector(b, v / k).addScaledVector(c, (k - u - v) / k), n: nn.clone(), m: m.name}); } });
    const H = new Map(), C = 0.005, key = (x, y, z) => x + ',' + y + ',' + z;
    for (const o of pts) { const k = key(Math.floor(o.p.x / C), Math.floor(o.p.y / C), Math.floor(o.p.z / C)); let l = H.get(k); if (!l) H.set(k, l = []); l.push(o); }
    // nearest sample within r (in rel space); signed by the face normal (negative = inside the mesh)
    const near = (q, r = 0.03, filt) => { const R = Math.ceil(r / C), x0 = Math.floor(q.x / C), y0 = Math.floor(q.y / C), z0 = Math.floor(q.z / C); let best = null, bd = r * r;
      for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) for (let k = -R; k <= R; k++) { const l = H.get(key(x0 + i, y0 + j, z0 + k)); if (l) for (const o of l) { if (filt && !filt.test(o.m)) continue; const d = o.p.distanceToSquared(q); if (d < bd) { bd = d; best = o; } } }
      if (!best) return {d: r, s: r, m: null}; const d = Math.sqrt(bd), s = V().subVectors(q, best.p).dot(best.n) < 0 ? -d : d; return {d, s, m: best.m, n: best.n}; };
    return {pts, near, rel}; }
  const inRel = (o, rel, at) => rel.worldToLocal(o.localToWorld(at ? at.clone() : V()));
  // hand parts of one HD arm in rel space: palm front (the palm faces local +z), palm centre, four fingertips, thumb tip, wrist
  function handPts(arm, rel) { const h = arm.userData.p.h, palm = h.children[0], out = {palmF: inRel(palm, rel, V().set(0, 0, 0.016)), palmC: inRel(palm, rel), tips: [], wrist: inRel(h, rel)};
    const end = k => k.userData.d ? end(k.userData.d) : k;   /* v1.2.27: the tip sits on the end joint when the finger has one */
    for (const [f, k0] of h.userData.f) { const k = end(k0); out.tips.push(inRel(k.children[k.children.length - 1], rel)); } const tk = end(h.userData.th.userData.k); out.thumb = inRel(tk.children[tk.children.length - 1], rel); return out; }
  const wristAng = arm => { const p = arm.userData.p, a = new T.Vector3(0, 1, 0).applyQuaternion(p.fo.quaternion), b = new T.Vector3(0, 1, 0).applyQuaternion(p.h.quaternion); return a.angleTo(b); };
  const relScale = rel => { const s = V(); rel.updateMatrixWorld(true); rel.matrixWorld.decompose(V(), new T.Quaternion(), s); return s.x; };
  // a gun is several rigid parts (the rig, the magazine holder, the slide or bolt holder) that move against each other in the animation:
  // each part has its own surface in its own space, queried with the point brought into that space
  function parts(list, held) { const S = list.map(([root, stop]) => surface(root, root, /trigger|hammer|Circle|glass/i, 0.0035, stop));
    return {near(q, r = 0.03) { let best = {d: r, s: r, m: null}; const w = held.localToWorld(q.clone()), hs = relScale(held);
      for (const P of S) { const k = relScale(P.rel) / hs, p = P.rel.worldToLocal(w.clone()), o = P.near(p, r / k); if (o.m && o.d * k < best.d) best = {d: o.d * k, s: o.s * k, m: o.m}; } return best; }}; }
  return {parts, surface, handPts, wristAng, relScale, inRel};
}
