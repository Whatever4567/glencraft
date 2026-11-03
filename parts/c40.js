/* ===================== GLX-C40 (v0.9.43): chest items never vanish - every item id shows in the bag, creative/close keeps the held stack ===================== */
(function c40() {
  // root cause: the bag only listed ids in ORDER, so loot like the Mystery painting, claymore, targe, silver, quaich... went into inv but could never be seen or used
  bagItems = function () { const out = ORDER.filter(id => cnt(id) > 0), seen = new Set(out);
    for (const k of Object.keys(inv)) { const id = +k; if (id > 0 && !seen.has(id) && cnt(id) > 0 && NAMES[id]) { out.push(id); seen.add(id); } } return out; };
  for (const k in NAMES) { const id = +k; if (id > 0 && !ORDER.includes(id) && ICON_KEY && ICON_KEY[id] !== undefined && typeof IT !== 'undefined' && Object.values(IT).includes(id)) ORDER.push(id); }
  // a held stack is never thrown away: back to the bag, or (creative) back into the open chest, or dropped at your feet
  const rc = returnCursor;
  returnCursor = function () {
    if (cursor && cursor.n > 0 && MODE.infinite) {
      const c = openChestKey && chests.get(openChestKey);
      if (c) { let i = c.slots.findIndex(s => s && s[0] === cursor.id); if (i < 0) i = c.slots.indexOf(null); if (i >= 0) { c.slots[i] = c.slots[i] ? [cursor.id, c.slots[i][1] + cursor.n] : [cursor.id, cursor.n]; cursor = null; showCursor(); return; } }
      if (!MODE.infiniteHas || true) { try { dropItem(cursor.id, cursor.n, P.x, P.y + 1, P.z, 0, 2, 0, 0.5); } catch (_) {} cursor = null; showCursor(); return; }
    }
    return rc.apply(this, arguments);
  };
  // dropItem is only muted while a world is being generated, never in play
  const di0 = dropItem;
  window.__c40drop = di0;
})();
