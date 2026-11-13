/* GLX-GRIP1222 (v1.2.22): grip sockets for the first person hands. Each held tool gets a handle socket worked out once from its own meshes
   (the longest thin part is the handle, the end nearest the other parts is the head), stored in the item's own space and carried through the
   item's world matrix every frame, so the hand follows the real handle through every swing. Guns use their own up, forward and side axes. */
(function grip1222() {
  const U = window.__gs1222 = {err: null, socks: 0, fall: 0};
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z), AX = [V3(1, 0, 0), V3(0, 1, 0), V3(0, 0, 1)];
  const gbox = geo => { const p = geo.attributes.position, A = p.array, n = p.normalized ? (A instanceof Int16Array ? 1 / 32767 : A instanceof Int8Array ? 1 / 127 : A instanceof Uint16Array ? 1 / 65535 : A instanceof Uint8Array ? 1 / 255 : 1) : 1, b = new THREE.Box3(), v = V3(0, 0, 0); for (let i = 0; i < p.count; i++) b.expandByPoint(v.fromBufferAttribute(p, i).multiplyScalar(n)); return b; };
  // handle socket in item space: {b: butt end, h: head end, r: handle radius} or null when the item has no separate handle part
  function sock(item) { const ud = item.userData; if (ud.__gs !== undefined) return ud.__gs; { let card = null; item.traverse(o => { if (!card && o.isMesh && o.geometry && (item.userData.c122card || o.userData.c122card)) card = o; });
      if (card) { const bb = gbox(card.geometry), w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y, cz = (bb.min.z + bb.max.z) / 2; item.updateMatrixWorld(true);
        const m = new THREE.Matrix4().copy(item.matrixWorld).invert().multiply(card.matrixWorld), sc = new THREE.Vector3().setFromMatrixScale(m);
        // flat card icons: the handle runs corner to corner, bottom left (butt) to top right (head)
        ud.__gs = {b: new THREE.Vector3(bb.min.x + 0.1 * w, bb.min.y + 0.1 * h, cz).applyMatrix4(m), h: new THREE.Vector3(bb.max.x - 0.1 * w, bb.max.y - 0.1 * h, cz).applyMatrix4(m), r: Math.max(0.012, Math.min(0.03, w * sc.x * 0.06)), card: 1}; U.socks++; return ud.__gs; } } let best = null; const parts = [];
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
    // v1.2.22: the fingers point from the shoulder side towards the handle and the palm faces across it (thumb towards the head), so the
    // wrist stays in line with the forearm; before, the palm faced straight away from the shoulder and the wrist was bent about 90 degrees
    const x = a.clone().multiplyScalar(side), y = z.clone(); z = V3(0, 0, 0).crossVectors(x, y).normalize(); const sr = k.r * item.matrixWorld.getMaxScaleOnAxis() / Math.max(1e-6, cam.matrixWorld.getMaxScaleOnAxis());
    const c0 = Math.max(0.85, Math.min(1.3, 1.3 - (sr - 0.012) * 12)); return {G, x, y, z, r: sr, c: [c0, c0 + 0.03, c0 + 0.06, c0 + 0.09]}; };
  // gun axes in camera space: forward (muzzle), up (gun +y) and right
  U.gun = (g, cam, fw) => { g.updateMatrixWorld(true); const gr = (g.userData && g.userData.rig) || g; /* v1.2.22: the rig, so the hands turn with the reload tilt and recoil */ const o = cam.worldToLocal(gr.localToWorld(V3(0, 0, 0))), u = cam.worldToLocal(gr.localToWorld(V3(0, 1, 0))).sub(o); u.addScaledVector(fw, -u.dot(fw)); if (u.lengthSq() < 1e-10) u.set(0, 1, 0); u.normalize(); const r = V3(0, 0, 0).crossVectors(fw, u).normalize(); return {fw: fw.clone(), up: u, rt: r}; };
  U.sock = sock;
})();
/* GLX-GS1222B: named grip anchors on the gun models (model space) and reload phases for the front hand. */
(function gs1222b() {
  const U = window.__gs1222; if (!U) return;
  // anchors: [name, parent key ('rig' or 'slide'), x, y, z]; the hand palm centre goes on the anchor
  U.ANCH = {pistol: [['grip', 'rig', 0, -0.065, 0.05], ['sup', 'rig', -0.034, -0.075, 0.05], ['well', 'rig', 0, -0.15, 0.065]],
            rifle: [['grip', 'rig', 0, -0.04, 0.13], ['fore', 'rig', 0, -0.035, -0.18], ['bolt', 'slide', 0.05, 0.03, 0.07]]};
  U.addAnch = (g, kind) => { const ud = g.userData; ud.anch = ud.anch || {}; for (const [n, p, x, y, z] of U.ANCH[kind]) { const par = ud[p] || g, o = new THREE.Object3D(); o.name = 'anch_' + n; o.position.set(x, y, z); par.add(o); ud.anch[n] = o; } return g; };
  // camera local position of a named anchor, or null when the model has none (an old or swapped model keeps the old hand spot)
  U.af = (g, cam, name) => { const a = g && g.userData && g.userData.anch && g.userData.anch[name]; if (!a || !a.parent) return null; let p = a; while (p.parent) p = p.parent; a.updateWorldMatrix(true, false); const v = new THREE.Vector3().setFromMatrixPosition(a.matrixWorld); return cam.worldToLocal(v); };
  const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // reload phases. Pistol: the front hand leaves the grip, goes to the belt for a fresh magazine, pushes it into the well, returns.
  // Musket: the front hand goes from the fore stock to the bolt knob, pulls and pushes it, returns. The main grip never moves.
  // v1.2.22: when the gun animation (C43) is running its own reload, its timeline drives the hands: the left hand takes the magazine as it
  // drops, carries it back up into the grip and returns (pistol), or works the bolt while the bolt itself racks (rifle)
  U.rl2 = (isP, x) => { if (isP) { const w = ss(0.03, 0.1, x) * (1 - ss(0.6, 0.72, x)); return {phase: x < 0.1 ? 'release' : x < 0.25 ? 'mag out' : x < 0.6 ? 'insert' : 'return', to: 'well', w, belt: 0, well: 1}; }
    const w = ss(0.6, 0.76, x) * (1 - ss(0.95, 0.995, x)); return {phase: x < 0.76 ? 'reach' : x < 0.8 ? 'grab' : x < 0.95 ? 'cycle' : 'return', to: 'bolt', w, pull: 0, belt: 0}; };
  U.rl = (isP, rp) => { const rf = window.__c43rf; if (rf > 0 && rf <= 1) return U.rl2(isP, rf); if (!(rp >= 0 && rp <= 1)) return {phase: 'idle', to: null, w: 0, belt: 0}; return U.rl2(isP, rp);
    if (isP) { const out = ss(0.04, 0.14, rp) * (1 - ss(0.9, 0.99, rp)), belt = ss(0.12, 0.25, rp) * (1 - ss(0.38, 0.5, rp)), well = ss(0.42, 0.55, rp) * (1 - ss(0.9, 0.99, rp));
      return {phase: rp < 0.12 ? 'release' : rp < 0.45 ? 'belt' : rp < 0.9 ? 'insert' : 'return', to: belt > well ? 'belt' : 'well', w: out, belt, well}; }
    const w = ss(0.05, 0.16, rp) * (1 - ss(0.86, 0.97, rp)), pull = ss(0.3, 0.45, rp) * (1 - ss(0.62, 0.78, rp));
    return {phase: rp < 0.16 ? 'reach' : rp < 0.3 ? 'grab' : rp < 0.78 ? 'cycle' : 'return', to: 'bolt', w, pull, belt: 0}; };
  U.mix = (a, b, t) => a.clone().lerp(b, t);
  // v1.2.22: the real (GLB) guns. The swap to the real model empties the rig, which took the anchors with it, so the hands fell back to
  // the old guessed spot (a few cm off the real grip). These anchors were measured on the real models in rig space after the swap:
  // pistol grip centre, the left side of the grip for the support palm and the mag well under it; the rifle wrist (wrap), the fore stock
  // and the bolt handle (the right most part of the bolt, found from the mesh itself; searched in the rig, as the swap has already moved
  // the bolt and magazine into their own holders).
  U.ANCH_HD = {pistol: [['grip', 'rig', 0, -0.062, -0.011], ['sup', 'rig', -0.03, -0.066, -0.004], ['well', 'mag', 0, -0.108, -0.014]],
               rifle: [['grip', 'rig', -0.007, 0.012, 0.12], ['fore', 'rig', -0.007, 0.056, -0.24], ['bolt', 'slide', 0, 0, 0]]};
  U.reanch = (g, n, model) => { const ud = g.userData, rig = ud.rig; if (!rig || !U.ANCH_HD[n]) return 0; ud.anch = {}; rig.updateMatrixWorld(true);
    for (const [nm, p, x, y, z] of U.ANCH_HD[n]) { const o = new THREE.Object3D(); o.name = 'anch_' + nm; o.position.set(x, y, z);
      if (nm === 'bolt' && model) { let b = null; rig.traverse(m => { if (!b && m.isMesh && /bolt_a$/.test(m.name)) b = m; });
        if (b) { const inv = new THREE.Matrix4().copy(rig.matrixWorld).invert(), mw = new THREE.Matrix4().multiplyMatrices(inv, b.matrixWorld), q = b.geometry.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3(); let mx = -1e9, k = 0;
          for (let i = 0; i < q.count; i++) { v.fromBufferAttribute(q, i).applyMatrix4(mw); if (v.x > mx) mx = v.x; }
          for (let i = 0; i < q.count; i++) { v.fromBufferAttribute(q, i).applyMatrix4(mw); if (v.x > mx - 0.008) { c.add(v); k++; } } if (k) o.position.copy(c.divideScalar(k)); } }
      if (nm === 'well' && model) { let b = null; rig.traverse(m => { if (!b && m.isMesh && /magazine_loaded$/.test(m.name)) b = m; });
        if (b) { const inv = new THREE.Matrix4().copy(rig.matrixWorld).invert(), mw = new THREE.Matrix4().multiplyMatrices(inv, b.matrixWorld), q = b.geometry.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3(); let mn = 1e9, k = 0;
          for (let i = 0; i < q.count; i++) { v.fromBufferAttribute(q, i).applyMatrix4(mw); if (v.y < mn) mn = v.y; }
          for (let i = 0; i < q.count; i++) { v.fromBufferAttribute(q, i).applyMatrix4(mw); if (v.y < mn + 0.002) { c.add(v); k++; } } if (k) o.position.copy(c.divideScalar(k)); } }
      rig.add(o); if (p === 'slide' && ud.slide) ud.slide.attach(o); if (p === 'mag' && ud.mag) ud.mag.attach(o); ud.anch[nm] = o; } ud.anchHD = 1; return 1; };
  // the real pistol model keeps its spare magazine beside the gun (as shown in the asset); move it into the grip so it sits in the well
  U.magFix = m => { let F = null, M = null; m.traverse(o => { if (o.isMesh && /pistol_a$/.test(o.name)) F = o; if (o.isMesh && /magazine_loaded$/.test(o.name)) M = o; }); if (!F || !M) return 0;
    m.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(m.matrixWorld).invert(), rb = o => { const b = new THREE.Box3(), v = new THREE.Vector3(), X = new THREE.Matrix4(); o.traverse(c => { if (!c.isMesh || !c.geometry) return; X.multiplyMatrices(inv, c.matrixWorld); const q = c.geometry.attributes.position; for (let i = 0; i < q.count; i++) b.expandByPoint(v.fromBufferAttribute(q, i).applyMatrix4(X)); }); return b; }, bf = rb(F), bm = rb(M);   /* v1.2.27: in the model frame */
    const _cx = ((bf.min.x + bf.max.x) / 2) - ((bm.min.x + bm.max.x) / 2); const _ov = bm.max.x > bf.min.x + 0.002 && bm.min.x < bf.max.x - 0.002; if (_ov && Math.abs(_cx) < 0.012) return 1; const t = new THREE.Object3D(), par = M.parent; m.add(t); t.attach(M); M.position.x += _cx; par.attach(M); m.remove(t); return 1; };
})();

