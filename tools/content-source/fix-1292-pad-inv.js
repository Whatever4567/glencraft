/* GLX-PAD1292 (v1.2.92): opening inventory with a controller no longer
   freezes the game. updateCraftList used to throw
   TypeError: Cannot read properties of undefined (reading 'tool')
   when later patches spliced retired recipes out of RECIPES but left
   stale craftBtns behind (186 buttons vs 149 recipes after boot).
   openMenu always calls updateCraftList, so the Y (inventory) / X
   (crafting) pad path threw inside readPad, which is not try/caught,
   and the animation frame died. The same throw then hit updateHud on
   the next frame if the menu was already marked open, so the player
   could not move around the menu or close it.

   This patch (1) makes canCraft reject a missing recipe instead of
   reading r.tool, (2) rebuilds the craft button list with setCat /
   buildCraftList when it is stale, before the existing
   updateCraftList runs. Keyboard and touch use the same openMenu
   path and are covered too. The pad mapping is unchanged: Y opens
   the character / inventory tab, D-pad and left stick move focus,
   A activates, B closes. */
(function padInv1292() {
  const U = window.__padInv1292 = {err: null, rebuilt: 0, guarded: 0, hook: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  function stale() {
    try {
      if (typeof craftBtns === 'undefined' || typeof RECIPES === 'undefined' || !craftBtns) return false;
      for (let i = 0; i < craftBtns.length; i++) if (craftBtns[i] && !RECIPES[i]) return true;
      return false;
    } catch (e) { ERR('stale', e); return false; }
  }
  function rebuild() {
    try {
      if (typeof setCat === 'function' && typeof craftCat !== 'undefined') setCat(craftCat);
      else if (typeof buildCraftList === 'function') buildCraftList();
      U.rebuilt++;
    } catch (e) { ERR('rebuild', e); }
  }
  try {
    const cc = canCraft;
    canCraft = function (r, near) {
      if (!r) { U.guarded++; return false; }
      return cc.apply(this, arguments);
    };
    try { window.canCraft = canCraft; } catch (_) {}
    U.hook++;
  } catch (e) { ERR('cc', e); }
  try {
    const uc = updateCraftList;
    updateCraftList = function () {
      try {
        if (!updateCraftList._fixing && stale()) {
          updateCraftList._fixing = 1;
          try { rebuild(); } finally { updateCraftList._fixing = 0; }
        }
      } catch (e) { ERR('ucpre', e); try { updateCraftList._fixing = 0; } catch (_) {} }
      return uc.apply(this, arguments);
    };
    try { window.updateCraftList = updateCraftList; } catch (_) {}
    U.hook++;
  } catch (e) { ERR('uc', e); }
})();
