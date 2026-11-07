/* GLX-V128 (v1.2.8): oak and silver birch retired; Scots pine is the replacement wood. Ids stay registered (saves still load);
   they leave the inventory/creative lists and their own recipes, any gained piece turns into the Scots pine equivalent, and newly
   generated terrain grows pine instead. Pooled "any planks" recipes (sticks, crafting table...) keep working with pine.
   Existing saved worlds are not rewritten. */
(function v128() {
  const U = window.__v128 = {err: null, conv: 0, gen: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const byName = n => { for (const k in NAMES) if (String(NAMES[k]).toLowerCase() === n.toLowerCase()) return +k; return null; };
  const MAP = new Map([[T.LOG, 135], [136, 135], [T.LEAVES, 146], [147, 146], [T.PLANKS, 229], [220, 229]]);
  const KEEP = new Set([T.DOOR, T.DOORTOP]);   // the generic door stays
  function collect() { for (const k in NAMES) { const id = +k, n = String(NAMES[k]); if (KEEP.has(id) || MAP.has(id)) continue;
      const m = /^(oak|silver birch)\s+(.+)$/i.exec(n); if (!m) continue; const to = byName('Scots pine ' + m[2]); MAP.set(id, to); } U.map = [...MAP]; }
  try { collect(); } catch (e) { ERR('collect', e); }
  const OFF = U.off = () => MAP;
  const conv = id => MAP.has(id) ? MAP.get(id) : id;
  const strip = () => { try { for (const L of [ORDER, typeof CREATIVE_ALL !== 'undefined' ? CREATIVE_ALL : null]) if (L) for (let i = L.length - 1; i >= 0; i--) if (MAP.has(L[i])) L.splice(i, 1);
      for (let i = RECIPES.length - 1; i >= 0; i--) { const r = RECIPES[i]; if (MAP.has(r.out)) RECIPES.splice(i, 1); else if (r.need && r.need.length === 1 && (r.need[0][0] === T.LOG || r.need[0][0] === 136)) RECIPES.splice(i, 1); }
      for (const [a, b] of MAP) if (inv[a] > 0) { const n = inv[a]; delete inv[a]; if (b) inv[b] = (inv[b] || 0) + n; U.conv += n; } } catch (e) { ERR('strip', e); } };
  try { const ai = addItem; addItem = function (id, n) { if (MAP.has(id)) { const b = MAP.get(id); if (!b) return; U.conv += n || 0; return ai.call(this, b, n); } return ai.apply(this, arguments); }; } catch (e) { ERR('add', e); }
  try { const di = dropItem; dropItem = function (id) { if (MAP.has(id)) { const b = MAP.get(id); if (!b) return; const a = [...arguments]; a[0] = b; return di.apply(this, a); } return di.apply(this, arguments); }; } catch (e) { ERR('drop', e); }
  // new terrain: natural trees grow as Scots pine (runs on the freshly generated world, before any save is applied over it)
  const TREE = new Map([[T.LOG, 135], [136, 135], [T.LEAVES, 146], [147, 146]]);
  U.convertWorld = (arr) => { let n = 0; for (let i = 0; i < arr.length; i++) { const v = arr[i]; if (v === T.LOG || v === 136 || v === T.LEAVES || v === 147) { arr[i] = TREE.get(v); n++; } } return n; };
  try { const g = generate; generate = function () { const r = g.apply(this, arguments); try { if (!DIM.cur) U.gen += U.convertWorld(world); } catch (e) { ERR('gen', e); } return r; }; } catch (e) { ERR('genwrap', e); }
  U.strip = strip; strip(); { let t = 0; const iv = setInterval(() => { strip(); if (++t > 30) clearInterval(iv); }, 2000); }
})();
