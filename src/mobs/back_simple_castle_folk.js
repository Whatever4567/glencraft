/* ===================== GLX-C236 (v1.0.53): back to simple castle folk - the brain, goals, inventory, A* and the rest are gone;
   old brain saves cleared once; the pad badge stays hidden ===================== */
(function () {
  try { if (!localStorage.getItem('glx_c236_clean')) { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.indexOf('glx_sunny_') === 0) localStorage.removeItem(k); }
      try { indexedDB.deleteDatabase('glencraft_kernel'); } catch (_) {} localStorage.setItem('glx_c236_clean', '1'); } } catch (_) {}
  try { const st = document.createElement('style'); st.textContent = '#padBadge{display:none!important}'; document.head.appendChild(st);
    const kill = () => { const b = document.getElementById('padBadge'); if (b) b.remove(); }; kill(); setInterval(kill, 1000); } catch (_) {}
})();
