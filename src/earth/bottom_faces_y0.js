/* GLX-C371 (v1.1.72, item 50): no more see-through rock below Y 0. The bottom layer of the world never drew its underside, so from
   a cave below Y 0 you could look straight up through the stone into every cave and the sky above. The world now draws the bottom
   face of a Y 0 block whenever the space under it is open, and redraws it when you dig there. */
(function c371() {
  const U = window.__c371 = {n: 0};
  window.__YB = (x, z) => { try { if (!window.__c320 || !__c320.hol) return T.STONE; const b = getB(x, -1, z); if (!b || b === T.WATER || b === T.LAVA) U.n++; return b; } catch (_) { return T.STONE; } };
  // digging or placing just under Y 0 redraws the chunk above it
  try { const s0 = setB; setB = function (x, y, z, v) { const r = s0.apply(this, arguments); try { if (y === -1 && x >= 0 && z >= 0 && x < W && z < D) markDirty(x, z); } catch (_) {} return r; }; } catch (_) {}
})();
