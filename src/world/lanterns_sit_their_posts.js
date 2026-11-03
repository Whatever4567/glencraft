/* ===================== GLX-C222 (v1.0.47): lanterns sit on their posts. A street lamp (block 161) standing on a fence post, a magma block, stone or anything else
   (not a lamp post, not hanging from a roof) used to float a hand's width above it - the model's base plate is 0.15 up the block. Now it gets a short iron stem and
   collar down to the block below, so road, bridge and castle lanterns look fixed on top of the post. ===================== */
(function c222() {
  const U = window.__c222 = {err: null, stems: 0};
  if (typeof fenceObjs === 'undefined') return;
  const done = new WeakSet(); let geo = null;
  setInterval(() => { try { if (typeof started !== 'undefined' && !started) return;
      for (const o of fenceObjs.values()) { if (!o || o.t !== 161 || !o.g || done.has(o.g)) continue; done.add(o.g);
        const below = getB(o.x, o.y - 1, o.z), above = getB(o.x, o.y + 1, o.z);
        if (!below || below === 160 || below === T.WATER || (above && below !== 160 && !(below === 162 || below === 226))) continue;   // lamp post / hanging lamps keep their own fittings
        const m = (o.g.children[0] && o.g.children[0].material) || new THREE.MeshPhongMaterial({color: 0x1e3426});
        if (!geo) geo = [new THREE.BoxGeometry(0.14, 0.17, 0.14), new THREE.BoxGeometry(below === 162 ? 0.3 : 0.32, 0.035, below === 162 ? 0.3 : 0.32)];
        for (const gg of geo) gg.userData.shared = 1;
        const st = new THREE.Mesh(geo[0], m); st.position.set(0, 0.085, 0); o.g.add(st);
        const co = new THREE.Mesh(geo[1], m); co.position.set(0, 0.017, 0); o.g.add(co); U.stems++; } } catch (e) { if (!U.err) U.err = String(e && e.stack || e); } }, 300);
})();
