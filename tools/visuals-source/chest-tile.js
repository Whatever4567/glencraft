/* GLX-V126C (v1.2.6): procedural chest world tiles (side/top/front) replacing the TEX chest images before the atlas is built.
   Same keys, same block id and faces, so chest open/close, contents and interaction are unchanged. 256px, mobile budget. */
(function v126c() {
  try {
    const rng = seed => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };
    const N = 256, paint = (kind) => { const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), R = rng(kind === 'front' ? 641 : kind === 'top' ? 642 : 643), k = N / 64;
      g.fillStyle = '#9a6a36'; g.fillRect(0, 0, N, N);
      for (let y = 0; y < 64; y += 16) { g.fillStyle = 'rgba(60,34,12,.6)'; g.fillRect(0, y * k, N, 2 * k);
        for (let i = 0; i < 60; i++) { g.fillStyle = R() < .5 ? 'rgba(120,78,38,.5)' : 'rgba(190,140,80,.35)'; g.fillRect(R() * N, (y + 2 + R() * 13) * k, (6 + R() * 12) * k, k * 0.6); } }
      g.fillStyle = '#3a3a42'; for (const [x, y, w, h] of [[0, 0, 64, 4], [0, 60, 64, 4], [0, 0, 4, 64], [60, 0, 4, 64]]) g.fillRect(x * k, y * k, w * k, h * k);
      g.fillStyle = '#8a8a96'; for (const [x, y] of [[2, 2], [61, 2], [2, 61], [61, 61]]) g.fillRect((x - 1) * k, (y - 1) * k, 2 * k, 2 * k);
      if (kind === 'front') { g.fillStyle = '#2a2a30'; g.fillRect(0, 22 * k, N, 3 * k); g.fillStyle = '#d8b040'; g.fillRect(27 * k, 18 * k, 10 * k, 14 * k); g.fillStyle = '#6a4a10'; g.fillRect(30 * k, 24 * k, 4 * k, 5 * k); g.fillStyle = 'rgba(255,240,180,.85)'; g.fillRect(28 * k, 19 * k, 3 * k, 2 * k); }
      if (kind === 'side') { g.fillStyle = '#2a2a30'; g.fillRect(0, 22 * k, N, 3 * k); }
      return c.toDataURL(); };
    window.__v126c = {front: paint('front'), top: paint('top'), side: paint('side')};
    TEX.chest_front = __v126c.front; TEX.chest_top = __v126c.top; TEX.chest_side = __v126c.side;
  } catch (e) { window.__v126cErr = String(e); }
})();
