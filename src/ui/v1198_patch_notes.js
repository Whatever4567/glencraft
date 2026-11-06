/* GLX-C407 (v1.1.98): version bump and patch notes (no apostrophes in notes). */
(function c407() {
  const NOTE = {v: 'v1.1.98', d: '2026-11-06', notes: [
    'New: bedrock floor at world Y -237 under the UK deep caves. Natural rock stops there and cannot be dug through.',
    'New: deep caves are restacked to fit that floor: shallow gray halls, lush mushroom caverns, deep dark slate, volcanic basalt, purple crystal pockets, then a tall hell chamber with flames.',
    'New: a giant 3D eye watches from the hell chamber, with a steady glow. It is culled by distance so phones stay smooth.',
    'Keep: Agartha from Y -50 to -2, the surface UK map, and every block you placed. Old deeper edits stay. If you load below the floor you are lifted up safely.',
    'Keep: single deep terrain owner, mining, placing, drops and deep entity blocks from v1.1.96.'
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
