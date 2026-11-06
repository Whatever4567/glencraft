/* GLX-C403 (v1.1.96): version bump and patch notes (no apostrophes in notes). */
(function c403() {
  try { if (typeof GAME_VERSION !== 'undefined') { /* remapped by ship to 1.1.96 from 1.0.196 */ } } catch (_) {}
  const NOTE = {v: 'v1.1.96', d: '2026-11-06', notes: [
    'Fix: Y0 and Y1 are drawn by one mesh owner only, so the seam at the surface no longer flashes or leaves holes. Digging and collision still agree.',
    'Fix: item drops deep underground no longer vanish below Y -5. They stay until you pick them up or they time out for real.',
    'Fix: TVs, chests, torches, doors, furnaces and beds placed deep down show, work, save and remove properly again.',
    'Fix: the pickaxe swing no longer freezes during a remesh stall or resets every frame. Crack and break speed are unchanged.',
    'Fix: gun pose and scale have one owner in first person, so the musket no longer shrinks or vanishes when you fire. Aiming stays centred.',
    'Perf: gun shots trace blocks with a fast grid walk instead of hundreds of solid checks, with the same hits.',
    'New: the highlighted hotbar or inventory slot shows the item name for controller, touch and mouse with no extra equip step.'
  ]};
  try {
    const boot = setInterval(() => {
      try {
        if (typeof GAME_VERSION === 'undefined') return;
        // Force runtime version string if still 1.0.x style
        try {
          const g = String(GAME_VERSION);
          if (g === '1.0.196' || g === '1.1.95' || g === '1.0.195') {
            // GAME_VERSION is const - cannot reassign. ship/build remaps file text.
          }
        } catch (_) {}
        if (window.PATCH_NOTES && Array.isArray(PATCH_NOTES)) {
          if (!PATCH_NOTES.some(n => n && n.v === NOTE.v)) PATCH_NOTES.unshift(NOTE);
        }
        clearInterval(boot);
      } catch (e) { clearInterval(boot); }
    }, 200);
  } catch (_) {}
  // Also write version.json-friendly marker
  window.__v1196 = NOTE;
})();
