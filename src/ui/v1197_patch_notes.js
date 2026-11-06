/* GLX-C405 (v1.1.97): version bump and patch notes (no apostrophes in notes). */
(function c405() {
  const NOTE = {v: 'v1.1.97', d: '2026-11-06', notes: [
    'New: Nature inventory category. Seeds, crops, grasses, flowers and related plants live there instead of under Blocks.',
    'New: survival bag groups ordinary blocks together, then fences, then gates, then doors. Controller and touch category tabs include Nature, with focused slot names.',
    'New: red wool, green wool and pink wool, with the same style of dye recipes as the other coloured wools.',
    'Fix: Block of diamond shows in survival inventory and crafting without a duplicate recipe.',
    'Change: inner and outer corner stair items are removed from inventory, crafting and creative access. Straight stairs stay. Existing placed corner stairs still render and work in old saves.'
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
