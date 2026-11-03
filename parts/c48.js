
/* ===================== GLX-C48 (v0.9.44): guns sit properly in the hand (first and third person) ===================== */
(function c48() {
  const GUNS = new Set([IT.PISTOL, IT.MUSKET]);
  window.GUNPOSE = {p1: [0.02, 0.05, -0.1], r1: [0, 0, 0], s1: 1.25, r3: [0, 0, 0], p3: [0, -0.04, -0.04], s3: 1.8};
  const fix = () => { const id = parseInt(heldId); if (!GUNS.has(id)) return; const G = GUNPOSE;
    const h = held.children[0]; if (h) { h.rotation.set(...G.r1); h.position.set(...G.p1); h.scale.setScalar(G.s1); }
    if (heldMesh3p) { heldMesh3p.rotation.set(...G.r3); heldMesh3p.position.set(...G.p3); heldMesh3p.scale.setScalar(G.s3); } };
  const sh = setHeld; setHeld = function () { const r = sh.apply(this, arguments); try { fix(); } catch (_) {} return r; };
  window.__gunFix = fix;
})();
