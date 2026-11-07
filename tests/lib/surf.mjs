export function surf(T, root, rel, skip, step = 0.004) { const inv = new T.Matrix4().copy(rel.matrixWorld).invert(), out = []; root.updateMatrixWorld(true);
  root.traverse(m => { if (!m.isMesh || (skip && skip.test(m.name))) return; for (let x = m; x; x = x.parent) if (!x.visible) return; const mw = new T.Matrix4().multiplyMatrices(inv, m.matrixWorld), g = m.geometry, p = g.attributes.position, ix = g.index;
    const n = ix ? ix.count : p.count, a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
    for (let i = 0; i < n; i += 3) { const i0 = ix ? ix.getX(i) : i, i1 = ix ? ix.getX(i + 1) : i + 1, i2 = ix ? ix.getX(i + 2) : i + 2;
      a.fromBufferAttribute(p, i0).applyMatrix4(mw); b.fromBufferAttribute(p, i1).applyMatrix4(mw); c.fromBufferAttribute(p, i2).applyMatrix4(mw);
      const L = Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)), k = Math.max(1, Math.ceil(L / step));
      for (let u = 0; u <= k; u++) for (let v = 0; v <= k - u; v++) { const w = k - u - v; out.push({p: new T.Vector3().addScaledVector(a, u / k).addScaledVector(b, v / k).addScaledVector(c, w / k), m: m.name}); } } });
  return out; }
