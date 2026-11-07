/* GLX-GRIP1222 (v1.2.22): grip sockets for the first person hands. Each held tool gets a handle socket worked out once from its own meshes
   (the longest thin part is the handle, the end nearest the other parts is the head), stored in the item's own space and carried through the
   item's world matrix every frame, so the hand follows the real handle through every swing. Guns use their own up, forward and side axes. */
(function grip1222() {
  const U = window.__gs1222 = {err: null, socks: 0, fall: 0};
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z), AX = [V3(1, 0, 0), V3(0, 1, 0), V3(0, 0, 1)];
  const gbox = geo => { const p = geo.attributes.position, A = p.array, n = p.normalized ? (A instanceof Int16Array ? 1 / 32767 : A instanceof Int8Array ? 1 / 127 : A instanceof Uint16Array ? 1 / 65535 : A instanceof Uint8Array ? 1 / 255 : 1) : 1, b = new THREE.Box3(), v = V3(0, 0, 0); for (let i = 0; i < p.count; i++) b.expandByPoint(v.fromBufferAttribute(p, i).multiplyScalar(n)); return b; };
  // handle socket in item space: {b: butt end, h: head end, r: handle radius} or null when the item has no separate handle part
  function sock(item) { const ud = item.userData; if (ud.__gs !== undefined) return ud.__gs; let best = null; const parts = [];
    item.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(item.matrixWorld).invert(), m = new THREE.Matrix4();
    item.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return; let vis = true; for (let x = o; x && x !== item; x = x.parent) if (!x.visible) vis = false; if (!vis) return;
      m.multiplyMatrices(inv, o.matrixWorld); const bb = gbox(o.geometry), c = bb.getCenter(V3(0, 0, 0)), s = bb.getSize(V3(0, 0, 0)).toArray();
      const L = [0, 1, 2].map(i => s[i] * V3(m.elements[i * 4], m.elements[i * 4 + 1], m.elements[i * 4 + 2]).length()); const ai = L[0] >= L[1] && L[0] >= L[2] ? 0 : L[1] >= L[2] ? 1 : 2, th = Math.max(...L.filter((_, i) => i !== ai)) || 1e-4;
      const e0 = c.clone(), e1 = c.clone(); e0.setComponent(ai, bb.min.getComponent(ai)); e1.setComponent(ai, bb.max.getComponent(ai)); e0.applyMatrix4(m); e1.applyMatrix4(m);
      const q = {e0, e1, len: L[ai], r: th / 2, ratio: L[ai] / th, c: c.clone().applyMatrix4(m), vol: L[0] * L[1] * L[2]}; parts.push(q); if (q.len > 0.12 && q.ratio > 2.2 && (!best || q.ratio * q.len > best.ratio * best.len)) best = q; });
    let out = null; if (best && parts.length > 1) { const cen = V3(0, 0, 0); let w = 0; for (const q of parts) if (q !== best) { cen.addScaledVector(q.c, q.vol + 1e-6); w += q.vol + 1e-6; } cen.divideScalar(w);
      const headIs1 = best.e1.distanceTo(cen) < best.e0.distanceTo(cen); out = {b: headIs1 ? best.e0 : best.e1, h: headIs1 ? best.e1 : best.e0, r: Math.max(0.012, Math.min(0.04, best.r))}; U.socks++; } else U.fall++;
    ud.__gs = out; return out; }
  const pp = new Map();
  // grip frame in camera space for a tool: G = point on the handle axis, x = thumb axis (towards the head for the right hand), z = palm normal
  U.tool = (item, cam, S, side) => { const k = sock(item); if (!k) return null; item.updateMatrixWorld(true);
    const b = cam.worldToLocal(item.localToWorld(k.b.clone())), h = cam.worldToLocal(item.localToWorld(k.h.clone())); const a = h.clone().sub(b); const len = a.length(); if (!(len > 1e-4)) return null; a.divideScalar(len);
    const G = b.clone().addScaledVector(a, len * 0.27); let z = G.clone().sub(S); z.addScaledVector(a, -z.dot(a)); const key = item.uuid + side;
    if (z.lengthSq() < 1e-8) z = (pp.get(key) || V3(-side, 0, 0)).clone(); z.normalize(); pp.set(key, z.clone());
    const x = a.clone().multiplyScalar(side), y = V3(0, 0, 0).crossVectors(z, x).normalize(); const sr = k.r * item.matrixWorld.getMaxScaleOnAxis() / Math.max(1e-6, cam.matrixWorld.getMaxScaleOnAxis());
    const c0 = Math.max(0.85, Math.min(1.3, 1.3 - (sr - 0.012) * 12)); return {G, x, y, z, r: sr, c: [c0, c0 + 0.03, c0 + 0.06, c0 + 0.09]}; };
  // gun axes in camera space: forward (muzzle), up (gun +y) and right
  U.gun = (g, cam, fw) => { g.updateMatrixWorld(true); const o = cam.worldToLocal(g.localToWorld(V3(0, 0, 0))), u = cam.worldToLocal(g.localToWorld(V3(0, 1, 0))).sub(o); u.addScaledVector(fw, -u.dot(fw)); if (u.lengthSq() < 1e-10) u.set(0, 1, 0); u.normalize(); const r = V3(0, 0, 0).crossVectors(fw, u).normalize(); return {fw: fw.clone(), up: u, rt: r}; };
  U.sock = sock;
})();
