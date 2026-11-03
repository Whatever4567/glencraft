/* ===================== GLX-C200 (v1.0.39): the Creative bag is grouped like the crafting Blocks tab - labelled groups (planks, logs, stairs, corner stairs,
   slabs, fences, gates, doors, trapdoors, walls, stone & brick, glass & panes, wool & carpet, lighting, decor, then natural, ores, plants, tools, armour,
   food, items) in one fixed order. Craftable / not craftable never reorders the crafting list (only dims it) ===================== */
(function c200() {
  const U = window.__c200 = {err: null, n: 0, heads: 0};
  const warn = (w, e) => { U.err = w + ' ' + String(e && e.stack || e); console.warn('c200', w, e); };
  const C = () => window.__c197;
  const nm = id => String(NAMES[id] || '').toLowerCase();
  const EXTRA = ['Natural', 'Ores', 'Plants', 'Tools', 'Armour', 'Food & brews', 'Items'];
  const plant = (id, n) => (typeof isPlant === 'function' && (() => { try { return isPlant(id); } catch (_) { return false; } })())
    || (!/spawn egg|cobweb/.test(n) && /flower|sapling|hawthorn|juniper|blackthorn|rowan tree|heather|thistle|dandelion|daffodil|bluebell|poppy|tall grass|fern|mushroom|reed|bush|blossom|cobweb|lily|bracken|gorse|seed/.test(n));
  function cat(id) { try { return window.categorise ? window.categorise(id) : (PLACEABLE.has(id) ? 'blocks' : 'items'); } catch (_) { return 'items'; } }
  // group index: 0-14 the crafting groups, 15+ the extras
  function group(id) { const n = nm(id), c = cat(id), G = C().GROUPS.length;
    if (c === 'tools') return G + 3; if (c === 'armour') return G + 4; if (c === 'food') return G + 5;
    if (c !== 'blocks') return /\bore\b/.test(n) ? G + 1 : plant(id, n) ? G + 2 : G + 6;
    if (/\bore\b/.test(n)) return G + 1;
    if (/needles$|leaves$|^magma block|^soul sand/.test(n)) return G;
    if (plant(id, n)) return G + 2;
    if (/^(grass|dirt|sand|red sand|gravel|peat|mud|clay|snow|ice|packed ice|moss|podzol|farmland|bedrock|leaves|magma block|soul sand)\b|leaves$|needles$|^(stone|deep slate|deepslate|granite|basalt|obsidian|netherrack|hell)/.test(n) && !/brick|stairs|slab|wall|polished|tile/.test(n)) return G;
    return C().group(id); }
  U.group = group;
  const label = g => g < C().GROUPS.length ? C().GROUPS[g] : EXTRA[g - C().GROUPS.length];
  function sortBag() { try { const grid = document.getElementById('bagGrid'); if (!grid || !C()) return 0;
      const btns = Array.from(grid.children).filter(b => b.dataset && /^bag-\d+$/.test(b.dataset.testid || ''));
      const k = b => { const id = +b.dataset.testid.slice(4), kk = C().key(id), n = nm(id); return [group(id), kk[1], /^(log|leaves|planks)$/.test(n) ? 0 : kk[2], kk[3], id]; };
      const cmp = (a, b) => { for (let i = 0; i < 5; i++) { if (a[i] < b[i]) return -1; if (a[i] > b[i]) return 1; } return 0; };
      const ks = new Map(btns.map(b => [b, k(b)])); btns.sort((a, b) => cmp(ks.get(a), ks.get(b)));
      grid.querySelectorAll('.c200h').forEach(h => h.remove());
      let last = -1; U.heads = 0; const frag = document.createDocumentFragment();
      for (const b of btns) { const g = ks.get(b)[0]; if (g !== last) { last = g; const h = document.createElement('div'); h.className = 'c200h'; h.textContent = label(g); h.dataset.testid = 'bag-group-' + g; frag.appendChild(h); U.heads++; } frag.appendChild(b); }
      grid.appendChild(frag); U.sig = btns.length; U.n++; return btns.length; } catch (e) { warn('sort', e); return 0; } }
  U.sortBag = sortBag;
  try { const st = document.createElement('style'); st.id = 'glx200';
    st.textContent = '#bagGrid .c200h{grid-column:1/-1;font:800 11px/1.2 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#e8c46a;opacity:.9;padding:6px 2px 1px;border-bottom:1px solid rgba(232,196,106,.25);pointer-events:none}' +
      '.recgrid .rec2.no{order:0 !important}';
    document.head.appendChild(st); } catch (e) { warn('css', e); }
  // sort whenever the bag is opened, and if new items get added to it
  const check = () => { try { const grid = document.getElementById('bagGrid'); if (!grid) return; const n = grid.querySelectorAll('[data-testid^="bag-"]:not(.c200h)').length;
      const first = grid.firstElementChild; if (n !== U.sig || !first || !first.classList.contains('c200h')) sortBag(); } catch (e) { warn('check', e); } };
  U.check = check;
  try { document.addEventListener('click', e => { if (e.target && e.target.closest && e.target.closest('#tabBag')) setTimeout(check, 0); }, true); } catch (_) {}
  setInterval(check, 1500); setTimeout(check, 500);
})();
