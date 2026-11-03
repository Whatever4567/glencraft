
/* ===================== GLX-E5 (v0.9.13): open sea to the horizon around the island world ===================== */
var seaRing = null;
function ensureSeaRing() {
  const want = started && g9Island;
  if (!want) { if (seaRing) seaRing.visible = false; return; }
  if (!seaRing) {
    const m = new THREE.MeshLambertMaterial({color: 0x2f5f78, transparent: true, opacity: 0.92});
    seaRing = new THREE.Group(); const R = 6000;
    const rect = (x0, z0, x1, z1) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); const o = new THREE.Mesh(g, m); o.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); seaRing.add(o); };
    seaRing.userData.build = (w, d) => { while (seaRing.children.length) seaRing.remove(seaRing.children[0]); const zz = typeof __XZ !== 'undefined' && __XG ? __XZ : 0; rect(-R, -R, R, zz); rect(-R, d, R, R); rect(-R, zz, 0, d); rect(w, zz, R, d); };
    scene.add(seaRing);
  }
  if (seaRing.userData.w !== W + ':' + (__XG ? __XZ : 0)) { seaRing.userData.build(W, D); seaRing.userData.w = W + ':' + (__XG ? __XZ : 0); }
  seaRing.position.y = SEA + 0.86; seaRing.visible = true;
}
setInterval(() => { try { ensureSeaRing(); } catch (_) {} }, 1000);
