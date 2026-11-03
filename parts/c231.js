/* ===================== GLX-C231 (v1.0.51): main menu tidy - new Celtic logo is in the page markup (no old-logo flash), no music hint, no Download tile; Creative = a flat world only (Clydebank and the Glen preset are off for Creative); loading screen without the haggis runner ===================== */
(function c231() {
  const U = window.__c231 = {err: null, flat: 0};
  const flat = () => { try { if (window.__setPreset) __setPreset('flat'); U.flat++; } catch (e) { U.err = String(e); } const i = document.getElementById('modeInfo'); if (i && typeof newMode !== 'undefined' && newMode === 'creative') i.textContent = 'Creative: a flat grass world to build on. Fly, every block, no monsters.'; };
  flat(); document.querySelectorAll('#modeSeg button').forEach(b => b.addEventListener('click', () => setTimeout(flat, 0)));
  for (const id of ['menuDl']) { const e = document.getElementById(id); if (e) { e.style.display = 'none'; e.tabIndex = -1; e.setAttribute('aria-hidden', 'true'); } }
  document.querySelectorAll('#presetBox button[data-preset="clydebank"],#presetBox button[data-preset="glen"]').forEach(b => { b.disabled = true; });
})();
