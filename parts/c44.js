/* ===================== GLX-C44 (v0.9.43): new survival worlds get a row of starter chests holding every item and block ===================== */
(function c44() {
  const SKIP = new Set([T.AIR, T.WATER, T.LAVA, T.FIRE, T.PORTAL, T.BEDROCK, T.DOORTOP, T.FARM].filter(v => v !== undefined));
  const stage = id => (id > T.WHEAT0 && id <= T.WHEAT3) || (id > T.POTATO0 && id <= T.POTATO3) || (id > T.NEEP0 && id <= T.NEEP3);
  window.starterItems = function () {
    const ids = []; for (const k in NAMES) { const id = +k; if (!(id > 0) || SKIP.has(id) || stage(id) || !NAMES[id]) continue; if (!(ICONS[id] || BLOCK_MATS[id] || ICON_KEY[id] !== undefined || FACES[id])) continue; ids.push(id); }
    return ids.map(id => [id, (TOOL[id] || GUN[id] || ARMOUR[id] || id === IT.PISTOL || id === IT.MUSKET || id === IT.QUAICH || id === IT.TARGE || id === IT.CLAYMORE || id === IT.SILVERSWORD || id === IT.FLINTSTEEL || id === IT.BUCKET || id === IT.KILT || id === IT.BROOCH) ? 1 : (id === 231 || id === IT.CARTRIDGE) ? 64 : PLACEABLE.has(id) ? 64 : 16]);
  };
  function placeStarter() {
    if (DIM.cur || !current || current.mode === 'creative' || current.starterDone) return;
    const items = starterItems(), n = Math.ceil(items.length / 27);
    const sx = Math.floor(P.x) + 2, sz = Math.floor(P.z) + 2;
    for (let i = 0; i < n; i++) { const x = sx + i, z = sz; let g = solidTop(x, z);
      if (world[idx(x, g, z)] === T.WATER || world[idx(x, g, z)] === T.LEAVES || world[idx(x, g, z)] === T.LOG) world[idx(x, g, z)] = T.DIRT;
      world[idx(x, g + 1, z)] = T.CHEST; world[idx(x, g + 2, z)] = T.AIR;
      const slots = items.slice(i * 27, i * 27 + 27).map(q => q.slice()); while (slots.length < 27) slots.push(null);
      chests.set(keyOf(x, g + 1, z), {slots, starter: 1}); markDirty(x, z); }
    current.starterDone = true; toast('Starter chests by the spawn hold one of everything');
  }
  const se = serialize; serialize = function () { const d = se.apply(this, arguments); d.starterDone = true; return d; };
  const ew = enterWorld;
  enterWorld = function (save) {
    const fresh = !save; const r = ew.apply(this, arguments);
    if (fresh) { const w = setInterval(() => { if (started) { clearInterval(w); try { placeStarter(); } catch (e) { console.warn('starter', e); } } }, 300); }
    return r;
  };
})();
