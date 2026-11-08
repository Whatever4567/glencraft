    /* v1.2.32: loosely after the player portrait: a fringe of separate rounded locks
       resting on the forehead instead of a zigzag edge. */
    { const h0 = SC.hairY, LK = [[-0.52, 0.02], [-0.37, 0.036], [-0.22, 0.028], [-0.07, 0.044], [0.07, 0.034], [0.21, 0.042], [0.36, 0.026], [0.5, 0.018]];
      SC.hairY = a => { const s = a > Math.PI ? a - Math.PI * 2 : a, x = Math.abs(s); if (x > 0.62) return h0(a); let k = 0; for (const [c, dp] of LK) { const u = (s - c) / 0.072; if (Math.abs(u) < 1) k = Math.max(k, dp * Math.sqrt(1 - u * u) * (0.85 + 0.15 * Math.cos(u * 3))); } const edge = 0.405 + (0.392 - 0.07 * Math.max(0, (0.62 - 0.55) / 0.65) - 0.405) * SC.sm(0.5, 0.62, x); return edge - k; }; }
    // the skin of the brow no longer pokes through the hair grooves at the front edge (the old zigzag), and the
    // grooves fade out at the fringe so each lock reads as one soft rounded lock
    { const o0 = SC.hairOff2; SC.hairOff2 = (a, t, y) => { const aa = Math.abs(a > Math.PI ? a - Math.PI * 2 : a), fr = 1 - SC.sm(0.5, 0.9, aa); return o0(a, t, y) + fr * (0.016 * (1 - SC.sm(0.4, 0.47, y))); }; }
