/* GLX-C296 (v1.0.103): far-terrain FPS. Every chunk drew its grass, flowers and undergrowth as several small instanced meshes, one draw each,
   even far away where the fog hides them. Past about 40 blocks the chunk now draws only its one merged terrain mesh (and water). */
(function c296() {
  const U = window.__c296 = {err: null, hid: 0, lod: 40};
  const cc = cullChunks; cullChunks = function (cam) { const r = cc.apply(this, arguments);
    try { const px = cam.position.x, pz = cam.position.z, L = U.lod + (SET.rdist > 8 ? 8 : 0); let n = 0;
      for (const [id, g] of chunkObjs) { if (!g.visible) continue; const x0 = Math.floor(id / 64) * CH, z0 = (id % 64) * CH;
        const dx = Math.max(0, x0 - px, px - x0 - CH), dz = Math.max(0, z0 - pz, pz - z0 - CH), far = dx * dx + dz * dz > L * L;
        const ch = g.children; for (let i = 0; i < ch.length; i++) { const m = ch[i]; if (m.isInstancedMesh) { m.visible = !far; if (far) n++; } } }
      U.hid = n; } catch (e) { if (!U.err) U.err = String(e && e.stack || e).slice(0, 300); }
    return r; };
})();
