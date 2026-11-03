/* ===================== GLX-C146 (v1.0.22): HD skeletons hold their weapons again - bow (skeleton, blaze skeleton if it has one) and sword (black skeleton) ride the HD model's hand bone ===================== */
(function c146() {
  const U = window.__c135; if (!U) return;
  const W = window.__c146 = {err: [], att: 0, kinds: ['skeleton', 'blackskel', 'blazeskel']};
  const isW = o => { for (let p = o; p; p = p.parent) if (p.userData && p.userData.c146w) return true; return false; };
  for (const k of W.kinds) { const c = U.cat[k]; if (!c) continue; const k0 = c.keep; c.keep = o => isW(o) || !!(k0 && k0(o)); }
  const v = new THREE.Vector3(), v2 = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  // the hand: a bone named hand/wrist, else the forearm, else any arm bone - whichever sits nearest the old weapon
  function findHand(m, near) { const bones = []; m.traverse(o => { if (o.isBone) bones.push(o); });
    const tiers = [/hand|wrist|palm/i, /lowerarm|forearm|elbow|downleg\.?001|arm.*low/i, /arm|upperleg\.?001/i];
    for (const re of tiers) { const c = bones.filter(b => re.test(b.name)); if (!c.length) continue; let best = null, bd = 1e9;
      for (const b of c) { const t = tip(b); const d = near ? t.distanceTo(near) : (/(^|[^a-z])r(ight)?([^a-z]|$)/i.test(b.name) ? 0 : 1); if (d < bd) { bd = d; best = b; } } return best; }
    return null; }
  function blen(b) { const kid = b.children.find(o => o.isBone); return kid ? kid.position.length() : Math.max(1e-6, b.position.length()); }
  function tip(b) { b.updateWorldMatrix(true, false); return b.localToWorld(v2.set(0, blen(b), 0)).clone(); }
  // tag the procedural bow before HD attaches, so it stays visible (its string + arrow still animate)
  const us = updateSky; updateSky = function () {
    try { for (const a of mobs) if (a && !a.__hd && W.kinds.includes(a.kind) && a.bow && !a.bow.userData.c146w) a.bow.userData.c146w = 1; } catch (e) { if (W.err.length < 10) W.err.push('tag ' + e); }
    return us.apply(this, arguments); };
  // the old pose code (in updateMobs, after the HD tick) moves the bow back to the hidden arm - put it in the HD hand again
  const um = updateMobs; updateMobs = function () { const r = um.apply(this, arguments);
    try { for (const a of mobs) { const H = a && a.__hd, w = H && H.c146; if (w && w.loc && H.on && a.bow && a.bow.parent) a.bow.position.copy(w.loc); } } catch (e) { if (W.err.length < 10) W.err.push('um ' + e); }
    return r; };
  function setup(a, H) { const w = H.c146 = {};
    a.g.updateMatrixWorld(true); H.m.updateMatrixWorld(true);
    const src = a.sword || a.bow; const near = src ? src.getWorldPosition(new THREE.Vector3()) : null;
    w.bone = findHand(H.m, near); if (!w.bone) return; w.len = blen(w.bone);
    if (a.sword) { const sw = a.sword.clone(true); sw.traverse(o => { o.layers.mask = 1; o.userData.hd = 1; o.frustumCulled = false; });
      const b = w.bone; b.updateWorldMatrix(true, false); b.matrixWorld.decompose(v, q, sc); const bs = sc.x; a.g.getWorldScale(sc); const gs = sc.x;
      sw.scale.setScalar(gs / bs); sw.position.set(0, w.len * 0.85, 0);
      // blade points forward out of the fist, like the old sword (arm down, blade ahead)
      const fw = new THREE.Vector3(0, 0, 1).applyQuaternion(a.g.getWorldQuaternion(new THREE.Quaternion())).applyQuaternion(q.clone().invert());
      fw.addScaledVector(Y, -fw.dot(Y)); if (fw.lengthSq() < 1e-6) fw.set(0, 0, 1); fw.normalize(); fw.addScaledVector(Y, -0.8).normalize();   // tipped up a bit so it reads as held, not dangling
      sw.quaternion.setFromUnitVectors(Y, fw); sw.position.addScaledVector(fw, -0.06 * gs / bs);
      b.add(sw); w.sw = sw; }
    W.att++; }
  U.frame.push((a, H) => { if (!W.kinds.includes(a.kind)) return; try {
    if (!H.c146) setup(a, H); const w = H.c146; if (!w.bone) return;
    if (w.sw) w.sw.visible = a.sword.visible !== false && a.sword.parent !== null;
    if (a.bow && a.bow.parent) { w.loc = a.bow.parent.worldToLocal(tip(w.bone)); a.bow.position.copy(w.loc); }
  } catch (e) { if (W.err.length < 10) W.err.push(a.kind + ' ' + e); } });
})();
