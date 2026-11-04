/* GLX-DPX (v1.1.55): THE DIAMOND PICKAXE DIGS LIKE EFFICIENCY 10. Held, it breaks every breakable block fast: stone, ores, obsidian,
   blackstone, deepslate, sculk, wood, glass and the rest (obsidian in about half a second, stone almost at once). Bedrock and other
   blocks that can never be broken stay unbreakable. */
(function dpx() {
  const U = window.__dpx = {err: null, fast: 0};
  const NOBREAK = b => { try { return (T.BEDROCK && b === T.BEDROCK) || (T.HBEDROCK && b === T.HBEDROCK) || (T.BARRIER && b === T.BARRIER); } catch (_) { return false; } };
  try { const mb = mcBreakSeconds; mcBreakSeconds = function (b) { const r = mb.apply(this, arguments);
      try { if (typeof IT === 'undefined' || heldToolId() !== IT.DPICK || NOBREAK(b) || !isFinite(r) || r <= 0.05 || r > 1e4) return r;
        const h = MC_HARD[b] != null ? MC_HARD[b] : (HARD[b] || 1) * 0.8; if (!(h > 0) || h > 1e3) return r; U.fast++; return Math.min(r, Math.max(0.05, h * 0.011)); } catch (e) { if (!U.err) U.err = String(e); }
      return r; }; } catch (e) { U.err = 'w ' + e; }
  try { const tts = toolTierSpeed; toolTierSpeed = function (id) { const v = tts.apply(this, arguments); return (typeof IT !== 'undefined' && id === IT.DPICK) ? Math.max(v, 24 + 101) : v; }; } catch (_) {}
})();
