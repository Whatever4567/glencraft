// c251 (v1.0.64): fast boot - no artificial minimum on the loading screen; menu opens the instant textures are ready
(() => {
  try { bootT0 = -1e9; } catch (_) {}
  const t = () => { try { finishBoot(); } catch (_) {} if (screen === 'boot') requestAnimationFrame(t); else window.__bootMs = Math.round(performance.now()); };
  try { requestAnimationFrame(t); } catch (_) {}
})();
