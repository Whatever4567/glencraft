    SC.headF2 = (a, t, y, x, z) => { const g = SC.gs, e = SC.ell, ax = Math.abs(x), r = Math.hypot(x, z) || 1, f = SC.sm(0.04, 0.14, z), aa = Math.abs(a > Math.PI ? a - Math.PI * 2 : a); let dr = 0, dz = 0;
      // brow ridge and glabella
      dr += f * (0.0108 * g(y - 0.316, 0.021) * g(ax - 0.09, 0.075) + 0.005 * e(x, y, 0, 0.3, 0.03, 0.02));
      // eye socket, the eyeball inside it, upper lid fold and lower lid
      dr -= f * 0.02 * e(ax, y, 0.1, 0.273, 0.058, 0.038); dr += f * 0.011 * e(ax, y, 0.1, 0.27, 0.036, 0.024);
      { const re = Math.hypot((ax - 0.1) / 0.048, (y - 0.284) / 0.026); dr -= f * 0.003 * g(re - 1, 0.18) * SC.sm(0.265, 0.285, y); }
      dr += f * 0.0035 * e(ax, y, 0.1, 0.246, 0.032, 0.008);
      // A continuous bridge into a rounded lobule. No piecewise height ramp or sharp under-tip discontinuity.
      const bridge = 0.023 * g(y - 0.237, 0.049) * g(x, 0.017);
      const tip = 0.035 * e(x, y, 0, 0.196, 0.024, 0.028);
      dz += f * (bridge + tip);
      // wings blend sideways; shallow nostril recesses are tucked under the lobule, not black pits on the front plane
      dz += f * (0.012 * e(ax, y, 0.028, 0.177, 0.014, 0.016) - 0.004 * e(ax, y, 0.016, 0.169, 0.008, 0.006));
      dr -= f * 0.0018 * e(ax, y, 0.045, 0.176, 0.009, 0.018);
      // smile folds from the nose wings down and out, a little fullness beside them
      { const t2 = Math.min(1, Math.max(0, (0.165 - y) / 0.07)), lx = 0.047 + 0.028 * t2, d = ax - lx; const wv = SC.sm(0.08, 0.1, y) * (1 - SC.sm(0.165, 0.18, y)); dr -= f * wv * 0.0012 * g(d, 0.01); dr += f * wv * 0.0015 * g(d - 0.016, 0.014); }
      // Continuous lip envelope: less muzzle projection, lips taper into their corners; the central line curves with Cupid bow.
      dz += f * 0.0038 * e(x, y, 0, 0.12, 0.065, 0.04);
      dz -= f * 0.0018 * g(x, 0.007) * g(y - 0.144, 0.013);
      dz += f * 0.0016 * g(ax - 0.011, 0.0055) * g(y - 0.144, 0.012);
      const lineY = 0.115 + 0.0018 * (ax / 0.05) ** 2 - 0.0012 * g(x, 0.012), taper = Math.exp(-((x / 0.051) ** 4));
      dz += f * taper * (0.0088 * g(y - (lineY + 0.0085 + 0.0018 * g(ax - 0.014, 0.01)), 0.008) + 0.0102 * g(y - (lineY - 0.009), 0.010));
      dz -= f * 0.0038 * g(y - lineY, 0.0035) * Math.exp(-((x / 0.06) ** 4));
      dz -= f * 0.0024 * e(ax, y, 0.059, 0.117, 0.008, 0.008);
      // rounded chin flows into the lower lip instead of a protruding knob and a hard shelf
      dz += f * 0.010 * e(x, y, 0, 0.055, 0.047, 0.028);
      dz -= f * 0.0023 * g(y - 0.084, 0.011) * g(x, 0.047);
      // cheekbones, the hollow under them, temples, jaw line
      dr += f * 0.011 * e(ax, y, 0.138, 0.214, 0.05, 0.036); dr -= f * 0.0022 * e(ax, y, 0.13, 0.14, 0.04, 0.035);
      dr -= 0.006 * g(y - 0.37, 0.05) * g(aa - 1.45, 0.25);
      dr -= (1 - SC.sm(-0.02, 0.19, y)) * 0.042 * SC.sm(0.65, 1.9, aa);
      return [x / r * dr, 0, z / r * dr + dz]; };
