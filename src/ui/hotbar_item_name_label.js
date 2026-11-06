/* GLX-C402 (v1.1.96): HOTBAR ITEM NAME LABEL (t830u). The selected hotbar slot always shows its item name
   above the hotbar for controller, touch and mouse. Browsing inventory slots also shows the name on
   highlight / hover without needing to equip. No gameplay change. */
(function c402() {
  const U = window.__c402 = {err: null, on: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  function label(id, n) {
    try {
      const el = $('itemName'); if (!el) return;
      if (!id || !NAMES[id]) { el.textContent = ''; el.classList.remove('on'); return; }
      const c = (n != null ? n : (typeof cnt === 'function' ? cnt(id) : 0));
      el.textContent = NAMES[id] + (c > 1 ? ' x' + c : '');
      el.classList.add('on');
      U.on = 1;
    } catch (e) { ERR('label', e); }
  }
  // Keep selected hotbar name visible (no short timeout clear for hotbar selection)
  try {
    const sn = showItemName;
    showItemName = function () {
      const r = sn.apply(this, arguments);
      try {
        clearTimeout(nameT);
        label(selId);
        // Soft fade only after 8s idle, not 1.4s - and re-show on next select
        nameT = setTimeout(() => { try { if ($('itemName')) $('itemName').classList.add('on'); } catch (_) {} }, 0);
      } catch (e) { ERR('sn', e); }
      return r;
    };
  } catch (e) { ERR('wrap', e); }
  try {
    const rh = renderHotbar;
    renderHotbar = function () {
      const r = rh.apply(this, arguments);
      try { label(selId); } catch (_) {}
      return r;
    };
  } catch (e) { ERR('rh', e); }
  // Inventory / creative / chest slot highlight: pointerenter + focus
  function bindSlots(root) {
    try {
      if (!root || root.__c402) return;
      root.__c402 = 1;
      root.addEventListener('pointerover', e => {
        try {
          const t = e.target && e.target.closest && e.target.closest('.gslot, .slot, .fslot, [data-testid^="bag-"], [data-testid^="chest-"], [data-testid^="inv-"], [data-testid^="craft-"]');
          if (!t) return;
          const title = t.title || t.getAttribute('title');
          if (title) {
            const el = $('itemName'); if (!el) return;
            el.textContent = title; el.classList.add('on'); U.hover = title;
          }
        } catch (_) {}
      }, true);
      root.addEventListener('pointerout', e => {
        try { if (U.hover) { U.hover = null; label(selId); } } catch (_) {}
      }, true);
    } catch (e) { ERR('bind', e); }
  }
  const boot = setInterval(() => {
    try {
      if (!$('itemName')) return;
      bindSlots(document.body);
      label(selId);
      // CSS: keep name readable above hotbar
      if (!$('c402css')) {
        const st = document.createElement('style'); st.id = 'c402css';
        st.textContent = '#itemName.on{opacity:1!important;visibility:visible!important}#itemName{pointer-events:none;z-index:8}';
        document.head.appendChild(st);
      }
      clearInterval(boot); U.on = 1;
    } catch (e) { ERR('boot', e); }
  }, 400);
})();
