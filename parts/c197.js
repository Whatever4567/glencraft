/* ===================== GLX-C197 (v1.0.37): the crafting Blocks tab sorted into labelled groups (planks, logs, stairs, corner stairs, slabs, fences, gates, doors,
   trapdoors, walls, stone & brick, glass & panes, wool & carpet, lighting, decor), the same wood / material order inside every group ===================== */
(function c197() {
  const U = window.__c197 = {err: null, n: 0};
  const warn = (w, e) => { U.err = w + ' ' + String(e && e.stack || e); console.warn('c197', w, e); };
  const GROUPS = ['Planks', 'Logs', 'Stairs', 'Corner stairs', 'Slabs', 'Fences', 'Gates', 'Doors', 'Trapdoors', 'Walls', 'Stone & brick', 'Glass & panes', 'Wool & carpet', 'Lighting', 'Decor'];
  const nm = id => String(NAMES[id] || '').toLowerCase();
  function group(id) { const n = nm(id);
    if (/planks/.test(n)) return 0;
    if (/\blog\b|\bwood\b/.test(n)) return 1;
    if (/corner stairs/.test(n)) return 3;
    if (/stairs/.test(n)) return 2;
    if (/slab/.test(n)) return 4;
    if (/gate/.test(n)) return 6;
    if (/fence|railing/.test(n)) return 5;
    if (/trapdoor/.test(n)) return 8;
    if (/door/.test(n)) return 7;
    if (/\bwall\b/.test(n)) return 9;
    if (/glass|pane/.test(n)) return 11;
    if (/wool|carpet|tapestry|rug/.test(n)) return 12;
    if (/torch|lamp|lantern|candle|glow/.test(n)) return 13;
    if (/stone|brick|cobble|slate|granite|marble|basalt|sandstone|obsidian|tile|gravel|concrete|block of/.test(n)) return 10;
    return 14; }
  // one material order for every group: oak, the other woods (as the planks run), then stone-type materials, then the rest by name
  const MAT = ['oak', 'scots pine', 'silver birch', 'rowan', 'alder', 'yew', 'rotting', 'cobblestone', 'stone brick', 'stone', 'sandstone', 'brick', 'deepslate', 'hell', 'copper', 'iron', 'silver', 'gold', 'lazurite', 'ruby', 'diamond', 'red'];
  function matRank(n) { if (/rotting/.test(n)) return 6; if (n === 'planks') return 0; for (let i = 0; i < MAT.length; i++) { const m = MAT[i]; if (m === 'stone' ? /^stone\b/.test(n) : m === 'brick' ? /^brick\b|^house brick/.test(n) : n.includes(m)) return i; } return MAT.length; }
  const key = id => { const n = nm(id); return [group(id), /inner/.test(n) ? 1 : 0, matRank(n), n]; };
  const cmp = (a, b) => { for (let i = 0; i < 4; i++) { if (a[i] < b[i]) return -1; if (a[i] > b[i]) return 1; } return 0; };
  U.group = group; U.key = key; U.GROUPS = GROUPS;
  try { const cr = catRecipes; catRecipes = function () { const out = cr.apply(this, arguments); if (craftCat !== 'blocks') return out;
      const seen = new Set(), list = [];   // one button per output (the duplicate torch recipe stays reachable from its first button)
      for (const i of out) { const r = RECIPES[i]; const k = r.out + ':' + r.n + ':' + JSON.stringify(r.need); if (seen.has(k)) continue; seen.add(k); list.push(i); }
      return list.map(i => [i, key(RECIPES[i].out)]).sort((a, b) => cmp(a[1], b[1]) || a[0] - b[0]).map(p => p[0]); }; } catch (e) { warn('cat', e); }
  // group headings across the full width of the grid
  try { const st = document.createElement('style'); st.id = 'glx197';
    st.textContent = '.recgrid .c197h{grid-column:1/-1;font:800 11px/1.2 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#e8c46a;opacity:.9;padding:6px 2px 1px;border-bottom:1px solid rgba(232,196,106,.25);pointer-events:none}';
    document.head.appendChild(st); } catch (e) { warn('css', e); }
  try { const sc = setCat; setCat = function (k) { const r = sc.apply(this, arguments);
      try { if (k !== 'blocks') return r; const grid = document.getElementById('recGrid'); if (!grid) return r; let last = -1; U.n = 0;
        for (const b of Array.from(grid.children)) { if (b._ri === undefined) continue; const g = group(RECIPES[b._ri].out); if (g === last) continue; last = g;
          const h = document.createElement('div'); h.className = 'c197h'; h.textContent = GROUPS[g]; h.dataset.testid = 'craft-group-' + g; grid.insertBefore(h, b); U.n++; } } catch (e) { warn('heads', e); }
      return r; }; } catch (e) { warn('setCat', e); }
})();
