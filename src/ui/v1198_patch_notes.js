/* GLX-C407 (v1.1.98): version bump and patch notes (no apostrophes in notes). */
(function c407() {
  const NOTE = {v: 'v1.1.98', d: '2026-11-06', notes: [
    'New: bedrock floor at world Y -237 under the UK deep caves for natural rock. Columns with older builds below that stay open so those edits stay reachable.',
    'New: deep caves restacked to fit: shallow gray halls, lush giant mushrooms, deep dark slate, volcanic basalt and lava, purple crystals, then a tall hell chamber.',
    'New: one giant golden eye floats in the hell landmark chamber, with a green iris, black slit pupil and fiery tendrils. Steady glow only, culled by distance.',
    'Keep: Agartha from Y -50 to -2, the surface UK map, and every block you placed. Heat shimmer stays off. Mining, placing, drops and deep entities from v1.1.96 stay.',
    'Fix: you are only lifted if you are stuck inside bedrock, never thrown out of a saved deep build.'
  ]};
  try {
    const boot = setInterval(() => {
      try {
        if (typeof GAME_VERSION === 'undefined') return;
        if (window.PATCH_NOTES && Array.isArray(PATCH_NOTES)) {
          if (!PATCH_NOTES.some(n => n && n.v === NOTE.v)) PATCH_NOTES.unshift(NOTE);
        }
        clearInterval(boot);
      } catch (e) { clearInterval(boot); }
    }, 200);
  } catch (_) {}
})();
