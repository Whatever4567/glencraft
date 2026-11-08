    /* v1.2.32: loosely after the player portrait: a fringe of separate rounded locks
       resting on the forehead instead of a zigzag edge. */
    { const h0 = SC.hairY, LK = [[-0.52, 0.02], [-0.37, 0.036], [-0.22, 0.028], [-0.07, 0.044], [0.07, 0.034], [0.21, 0.042], [0.36, 0.026], [0.5, 0.018]];
      SC.hairY = a => { const s = a > Math.PI ? a - Math.PI * 2 : a, x = Math.abs(s); if (x > 0.62) return h0(a); let k = 0; for (const [c, dp] of LK) k += dp * 0.5 * Math.exp(-(((s - c) / 0.095) ** 2)); return (0.39 - k) * (1 - SC.sm(0.5, 0.62, x)) + h0(a) * SC.sm(0.5, 0.62, x); }; }
    // the skin of the brow no longer pokes through the hair grooves at the front edge (the old zigzag), and the
    // grooves fade out at the fringe so each lock reads as one soft rounded lock
    { const o0 = SC.hairOff2; SC.hairOff2 = (a, t, y) => { const aa = Math.abs(a > Math.PI ? a - Math.PI * 2 : a), fr = 1 - SC.sm(0.5, 0.9, aa); return o0(a, t, y) - 0.013 * SC.sm(0.25, 0.45, y) + 0.004 * Math.sin(a * 9 + y * 31) * SC.sm(0.36, 0.48, y) + fr * (0.016 * (1 - SC.sm(0.38, 0.47, y))); }; }
