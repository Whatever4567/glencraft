/* GLX-C404 (v1.1.97): t832u inventory / Nature / wool / corner stairs.
   Hide inner and outer corner stair variants from inventory, crafting and creative
   access while keeping ids, names, icons and world rendering for existing placements.
   Add red, green and pink wool (ids 256-258) with recipes matching existing dyed wool.
   Expose Block of diamond (255) in survival lists without duplicating recipes.
   Survival bag: Nature category; ordinary blocks then fences, gates, doors grouped.
   No apostrophes in user-facing strings here. */
(function c404() {
  const U = window.__c404 = {err: null, wool: 0, hide: 0, nature: 0, dia: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  /* ---------- helpers ---------- */
  const nm = id => String((typeof NAMES !== 'undefined' && NAMES[id]) || '').toLowerCase();
  const isCornerName = n => /inner corner stairs|corner stairs/.test(n);
  const isCornerId = id => {
    try { if (window.__c187 && __c187.CORN && __c187.CORN[id]) return true; } catch (_) {}
    return isCornerName(nm(id));
  };
  U.isCornerId = isCornerId;

  /* Nature: farm, crops, seeds, grasses, flowers and related plants (not building blocks). */
  function isNatureId(id) {
    id = +id;
    if (!id || isCornerId(id)) return false;
    try { if (typeof isPlant === 'function' && isPlant(id)) return true; } catch (_) {}
    const n = nm(id);
    if (!n) return false;
    if (/mossy|stone brick|brick|stairs|slab|wall|wool|carpet|door|fence|gate|planks|log\b|glass|ore\b|block of|ingot|torch|lamp|lantern|chest|furnace|table|bed\b|tv\b|painting|concrete|tile|cobble|sandstone|obsidian|deepslate|nether|hell|bedrock|ice\b|snow|gravel|clay|mud\b|dirt|sand\b|podzol/.test(n)) return false;
    if (/seed|sapling|flower|wheat|potato|neep|farmland|tall grass|^grass$|heather|thistle|dandelion|daffodil|bluebell|fern|reed|bush|blossom|mushroom|peat|\bmoss\b|lily|bracken|gorse|vine|crop|hawthorn|juniper|blackthorn|rowan tree|leaves$|needles$/.test(n)) return true;
    try { if (typeof PLANT !== 'undefined' && PLANT[id] === 1) return true; } catch (_) {}
    try { if (typeof LEAFY !== 'undefined' && LEAFY[id]) return true; } catch (_) {}
    return false;
  }
  U.isNatureId = isNatureId;

  function structKind(id) {
    const n = nm(id);
    if (/gate/.test(n)) return 'gates';
    if (/fence|railing/.test(n)) return 'fences';
    if (/trapdoor/.test(n)) return 'trapdoors';
    if (/door/.test(n)) return 'doors';
    return 'blocks';
  }
  U.structKind = structKind;

  /* ---------- 1) hide corner stair variants from access (keep CORN + world) ---------- */
  function stripCornerAccess() {
    try {
      const strip = arr => {
        if (!arr || !arr.length) return 0;
        let n = 0;
        for (let i = arr.length - 1; i >= 0; i--) if (isCornerId(arr[i])) { arr.splice(i, 1); n++; }
        return n;
      };
      strip(typeof ORDER !== 'undefined' ? ORDER : null);
      try { strip(CREATIVE_ALL); } catch (_) {}
      let r = 0;
      if (typeof RECIPES !== 'undefined') {
        for (let i = RECIPES.length - 1; i >= 0; i--) {
          const o = RECIPES[i] && RECIPES[i].out;
          if (o != null && isCornerId(o)) { RECIPES.splice(i, 1); r++; }
        }
      }
      U.hide = (U.hide || 0) + 1; U.strippedRec = r;
    } catch (e) { ERR('strip', e); }
  }
  try {
    stripCornerAccess();
    setInterval(stripCornerAccess, 2200);
    // Do not invent new corner recipes if something pushes them later
    if (typeof RECIPES !== 'undefined' && Array.isArray(RECIPES)) {
      const push = RECIPES.push.bind(RECIPES);
      RECIPES.push = function () {
        const args = [];
        for (let i = 0; i < arguments.length; i++) {
          const r = arguments[i];
          if (r && r.out != null && isCornerId(r.out)) continue;
          args.push(r);
        }
        if (!args.length) return RECIPES.length;
        return push.apply(RECIPES, args);
      };
    }
  } catch (e) { ERR('hide', e); }

  /* ---------- 2) red / green / pink wool (256-258) ---------- */
  function claimId(want, label) {
    // Refuse if already named as something else, or claimed by CORN / paint gem keys
    try {
      if (typeof NAMES !== 'undefined' && NAMES[want] && !String(NAMES[want]).toLowerCase().includes(label)) return 0;
      if (window.__c187 && __c187.CORN && __c187.CORN[want]) return 0;
      if (window.__c120 && __c120.made) {
        // diamond_block etc live in made by key, not by id - ok
      }
    } catch (_) {}
    return want;
  }

  function tintWool(baseCanvas, hex, key) {
    const S = baseCanvas.width || 64;
    const c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    g.drawImage(baseCanvas, 0, 0, S, S);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = hex; g.globalAlpha = 0.72; g.fillRect(0, 0, S, S);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // Soft fibre noise
    for (let i = 0; i < S * 2; i++) {
      g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
      g.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 2, 1);
    }
    return c;
  }

  function installWool(id, key, nice, hex, recipeHint, need) {
    try {
      if (!claimId(id, nice.split(' ')[0].toLowerCase())) { U.skip = (U.skip || 0) + 1; return; }
      if (NAMES[id] && /wool/i.test(NAMES[id]) && NAMES[id] !== nice) return; // already a different wool
      let base = null;
      try { base = (typeof texImg !== 'undefined' && (texImg.wool || texImg[FACES[T.WOOL]])) || null; } catch (_) {}
      if (!base || !base.width) {
        // Fallback solid swatch
        base = document.createElement('canvas'); base.width = base.height = 64;
        const g = base.getContext('2d'); g.fillStyle = '#f2efe6'; g.fillRect(0, 0, 64, 64);
      }
      const c = tintWool(base, hex, key);
      try {
        const t = new THREE.Texture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = typeof TEXANISO !== 'undefined' ? TEXANISO : 4;
        t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
        if (typeof texCache !== 'undefined') texCache[key] = t;
        if (typeof texImg !== 'undefined') texImg[key] = c;
      } catch (_) {}
      FACES[id] = key;
      try { BLOCK_MATS[id] = typeof mat === 'function' ? mat(key) : BLOCK_MATS[T.WOOL]; } catch (_) { BLOCK_MATS[id] = BLOCK_MATS[T.WOOL]; }
      NAMES[id] = nice; ICON_KEY[id] = key; HARD[id] = HARD[T.WOOL] || 0.8; MC_HARD[id] = MC_HARD[T.WOOL] || 0.8; REQ[id] = 0;
      PLACEABLE.add(id);
      try { if (typeof BUILT_T !== 'undefined') BUILT_T[id] = 1; } catch (_) {}
      try { if (typeof FLAMMABLE !== 'undefined' && FLAMMABLE.add) FLAMMABLE.add(id); } catch (_) {}
      if (!ORDER.includes(id)) ORDER.push(id);
      try { if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(id)) CREATIVE_ALL.push(id); } catch (_) {}
      try {
        if (typeof ICONS !== 'undefined') {
          const ic = document.createElement('canvas'); ic.width = ic.height = 64;
          ic.getContext('2d').drawImage(c, 0, 0, 64, 64);
          ICONS[id] = ic.toDataURL('image/png');
        }
      } catch (_) {}
      if (typeof RECIPES !== 'undefined' && !RECIPES.some(r => r.out === id)) {
        RECIPES.push(rc(nice, recipeHint, id, 1, need));
      }
      U.wool++;
    } catch (e) { ERR('wool' + id, e); }
  }

  function bootWool() {
    try {
      const WR = claimId(256, 'red'), WG = claimId(257, 'green'), WP = claimId(258, 'pink');
      if (!WR || !WG || !WP) { ERR('ids', 'wool id conflict'); return; }
      // Ensure unused vs CORN (331+) and diamond 255 / paint registry keys
      if (WR === 255 || WG === 255 || WP === 255) return;
      T.WOOLRED = WR; T.WOOLGREEN = WG; T.WOOLPINK = WP;
      installWool(WR, 'wool_red', 'Red wool', '#c62828', '1 Wool + 1 Redstone dust', [[T.WOOL, 1], [IT.REDSTONE, 1]]);
      installWool(WG, 'wool_green', 'Green wool', '#2e7d32', '1 Wool + 1 Tall grass', [[T.WOOL, 1], [T.TALLGRASS, 1]]);
      installWool(WP, 'wool_pink', 'Pink wool', '#ec407a', '1 Wool + 1 Heather', [[T.WOOL, 1], [T.HEATHER, 1]]);
      // Shears / material class for new wool ids
      try {
        const ot = typeof blockMatType === 'function' ? blockMatType : null;
        // Patch common range check used for wool material
        const prev = window.__c404woolSet || null;
        U.woolSet = new Set([T.WOOL, T.WOOLPURPLE, T.WOOLBLUE, T.WOOLYELLOW, T.WOOLORANGE, WR, WG, WP].filter(Boolean));
      } catch (_) {}
    } catch (e) { ERR('bootWool', e); }
  }
  // Wait briefly for wool base tex + T
  let woolTries = 0;
  const woolIv = setInterval(() => {
    try {
      if (typeof T === 'undefined' || !T.WOOL) return;
      if (woolTries++ > 40 || U.wool >= 3) { clearInterval(woolIv); return; }
      if (U.wool < 3) bootWool();
      if (U.wool >= 3) clearInterval(woolIv);
    } catch (e) { ERR('woolIv', e); clearInterval(woolIv); }
  }, 400);

  /* ---------- 3) diamond block exposure (id 255 already) ---------- */
  function ensureDiamond() {
    try {
      const DB = (T && T.DIAMONDBLOCK) || 255;
      if (T && T.DIAMONDBLOCK == null) T.DIAMONDBLOCK = DB;
      if (!NAMES[DB]) NAMES[DB] = 'Block of diamond';
      PLACEABLE.add(DB);
      if (!ORDER.includes(DB)) ORDER.push(DB);
      try { if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(DB)) CREATIVE_ALL.push(DB); } catch (_) {}
      if (typeof RECIPES !== 'undefined') {
        if (!RECIPES.some(r => r.out === DB)) RECIPES.push(rc('Block of diamond', '9 Diamonds', DB, 1, [[IT.DIAMOND, 9]], 1));
        if (!RECIPES.some(r => r.out === IT.DIAMOND && r.need && r.need.length === 1 && r.need[0][0] === DB))
          RECIPES.push(rc('Diamonds (x9)', '1 Block of diamond', IT.DIAMOND, 9, [[DB, 1]]));
      }
      U.dia = 1;
    } catch (e) { ERR('dia', e); }
  }
  setTimeout(ensureDiamond, 800);
  setTimeout(ensureDiamond, 2500);

  /* ---------- 4) categorise: Nature + keep corner ids out of blocks lists ---------- */
  function categorise2(item) {
    const id = +(item && item.out !== undefined ? item.out : item);
    if (isCornerId(id)) return 'hidden';
    if (isNatureId(id)) return 'nature';
    try {
      if (U._prevCat) {
        const c = U._prevCat(item);
        if (c === 'blocks' && isNatureId(id)) return 'nature';
        return c;
      }
    } catch (_) {}
    try { if (PLACEABLE.has(id)) return 'blocks'; } catch (_) {}
    return 'items';
  }
  try {
    if (typeof window.categorise === 'function') U._prevCat = window.categorise;
    window.categorise = categorise2; U.categorise = categorise2;
  } catch (e) { ERR('cat', e); }

  function ensureCats() {
    try {
      if (typeof CATS === 'undefined' || !Array.isArray(CATS)) return;
      // Prefer Blocks / Nature / Tools / Armour / Food / Items for craft + bag agreement
      const want = [
        ['blocks', 'Blocks'],
        ['nature', 'Nature'],
        ['tools', 'Tools'],
        ['armour', 'Armour'],
        ['food', 'Food & brews'],
        ['items', 'Items']
      ];
      // If c293-style construction tabs are active, map Nature in and keep Construction as Blocks alias
      const keys = CATS.map(c => c[0]);
      if (keys.includes('construction') || keys.includes('all')) {
        // Keep All / Construction / Nature / Items but ensure Nature exists and construction excludes nature ids via grp
        if (!keys.includes('nature')) CATS.splice(Math.min(2, CATS.length), 0, ['nature', 'Nature']);
        try { if (typeof CAT_ICON !== 'undefined') CAT_ICON.nature = T.LEAVES || T.GRASS || T.TALLGRASS; } catch (_) {}
      } else {
        CATS.length = 0;
        for (const w of want) CATS.push(w);
        try {
          if (typeof CAT_ICON !== 'undefined') {
            CAT_ICON.blocks = CAT_ICON.blocks || T.STONEBRICK || T.COBBLE;
            CAT_ICON.nature = T.LEAVES || T.GRASS || T.TALLGRASS;
          }
        } catch (_) {}
        if (typeof craftCat !== 'undefined' && !CATS.some(c => c[0] === craftCat)) craftCat = 'blocks';
      }
      U.nature = 1;
    } catch (e) { ERR('ensureCats', e); }
  }
  ensureCats();
  setInterval(ensureCats, 3000);

  // Crafting list: hide corner outputs; Nature filter
  try {
    const cr = typeof catRecipes === 'function' ? catRecipes : null;
    if (cr) {
      catRecipes = function () {
        const out = cr.apply(this, arguments);
        return out.filter(i => {
          const r = RECIPES[i]; if (!r) return false;
          if (isCornerId(r.out)) return false;
          if (craftCat === 'nature') return isNatureId(r.out) || (U._prevCat && U._prevCat(r) === 'food' && /seed|wheat|potato|neep|mushroom|berry/.test(nm(r.out)));
          if (craftCat === 'blocks' || craftCat === 'construction') return !isNatureId(r.out) && !isCornerId(r.out);
          if (craftCat === 'hidden') return false;
          return true;
        });
      };
    }
  } catch (e) { ERR('catRecipes', e); }

  // c293 grp: move nature out of construction
  try {
    if (window.__c293 && typeof __c293.grp === 'function') {
      const g0 = __c293.grp;
      __c293.grp = function (r) {
        try { if (r && isNatureId(r.out)) return 'nature'; if (r && isCornerId(r.out)) return 'hidden'; } catch (_) {}
        return g0.apply(this, arguments);
      };
    }
  } catch (e) { ERR('c293', e); }

  /* ---------- 5) survival / creative bag: Nature + block/fence/gate/door groups ---------- */
  function bagRank(id) {
    if (isNatureId(id)) return [0, nm(id), id]; // nature section sorted by name (category handles separation)
    if (isCornerId(id)) return [99, nm(id), id];
    const k = structKind(id);
    const gi = k === 'blocks' ? 1 : k === 'fences' ? 2 : k === 'gates' ? 3 : k === 'doors' ? 4 : k === 'trapdoors' ? 5 : 6;
    return [gi, nm(id), id];
  }
  U.bagRank = bagRank;

  function resortBagGrid() {
    try {
      const g = document.getElementById('invGrid'); if (!g) return;
      const heads = [...g.querySelectorAll('.c121cat, .c404h')];
      const btns = [...g.querySelectorAll('button[data-testid^="bag-item-"]')];
      if (!btns.length) return;
      const items = typeof bagItems === 'function' ? bagItems() : [];
      const byCat = {};
      btns.forEach(b => {
        const i = +String(b.dataset.testid || '').replace('bag-item-', '');
        const id = items[i];
        let c = 'items';
        try { c = window.categorise ? window.categorise(id) : 'items'; } catch (_) {}
        if (c === 'hidden') return;
        if (c === 'blocks' || c === 'struct' || c === 'decor') {
          // Split building bits into stable groups under Blocks
          const sk = structKind(id);
          c = sk === 'blocks' ? 'blocks' : sk;
        }
        (byCat[c] || (byCat[c] = [])).push({b, id});
      });
      const CATN = {
        blocks: 'Blocks', fences: 'Fences', gates: 'Gates', doors: 'Doors', trapdoors: 'Trapdoors',
        nature: 'Nature', tools: 'Tools & weapons', armour: 'Armour', food: 'Food', items: 'Items', decor: 'Decoration', struct: 'Building'
      };
      const CATO = ['blocks', 'fences', 'gates', 'doors', 'trapdoors', 'nature', 'tools', 'armour', 'food', 'decor', 'struct', 'items'];
      g.innerHTML = '';
      for (const c of CATO) {
        const list = byCat[c]; if (!list || !list.length) continue;
        list.sort((a, b) => {
          const ra = bagRank(a.id), rb = bagRank(b.id);
          for (let i = 0; i < ra.length; i++) { if (ra[i] < rb[i]) return -1; if (ra[i] > rb[i]) return 1; }
          return 0;
        });
        const h = document.createElement('div'); h.className = 'c121cat c404h'; h.textContent = (CATN[c] || c) + ' (' + list.length + ')';
        h.dataset.testid = 'bag-group-' + c; g.appendChild(h);
        list.forEach(x => g.appendChild(x.b));
      }
      try { navRefresh(); } catch (_) {}
      U.bag = (U.bag || 0) + 1;
    } catch (e) { ERR('bag', e); }
  }

  try {
    const rb = renderBag;
    renderBag = function () {
      const r = rb.apply(this, arguments);
      try { setTimeout(resortBagGrid, 0); } catch (_) {}
      return r;
    };
  } catch (e) { ERR('rb', e); }
  setInterval(() => { try { if (document.getElementById('invGrid') && !document.getElementById('invGrid').querySelector('.c404h') && document.getElementById('invGrid').querySelector('[data-testid^="bag-item-"]')) resortBagGrid(); } catch (_) {} }, 1600);

  // Controller / touch: bag category tab bar (Nature included), filters visible groups
  function bagTabs() {
    try {
      const grid = document.getElementById('invGrid'), pane = document.getElementById('invPane');
      if (!grid || !pane) return;
      let bar = document.getElementById('c404bt');
      if (!bar) {
        bar = document.createElement('div'); bar.id = 'c404bt'; bar.setAttribute('data-testid', 'bag-tabs');
        bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin:0 0 4px';
        grid.before(bar);
        if (!$('c404css')) {
          const st = document.createElement('style'); st.id = 'c404css';
          st.textContent = '#c404bt button{padding:2px 9px;border-radius:7px;border:1px solid rgba(232,190,90,.5);background:rgba(0,0,0,.35);color:#e8d7a0;font:bold 11px sans-serif}' +
            '#c404bt button.on{background:rgba(242,196,64,.2);border-color:#f2c440;color:#ffe7a0}';
          document.head.appendChild(st);
        }
      }
      const heads = [...grid.querySelectorAll('.c121cat, .c404h')].map(h => h.textContent.replace(/\s*\(\d+\)\s*$/, ''));
      const names = ['All', ...heads.filter((n, i, a) => a.indexOf(n) === i)];
      if (!U.bagTab) U.bagTab = 'All';
      if (!names.includes(U.bagTab)) U.bagTab = 'All';
      const sig = names.join('|') + '#' + U.bagTab;
      if (bar.dataset.sig !== sig) {
        bar.dataset.sig = sig; bar.innerHTML = '';
        for (const n of names) {
          const b = document.createElement('button'); b.textContent = n;
          b.className = n === U.bagTab ? 'on' : '';
          b.setAttribute('data-testid', 'bag-tab-' + n.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
          b.addEventListener('click', () => { U.bagTab = n; bagTabs(); try { navRefresh(); } catch (_) {} });
          bar.appendChild(b);
        }
      }
      let cur = null;
      for (const c of grid.children) {
        if (c.classList.contains('c121cat') || c.classList.contains('c404h')) cur = c.textContent.replace(/\s*\(\d+\)\s*$/, '');
        c.style.display = (U.bagTab === 'All' || cur === U.bagTab) ? '' : 'none';
      }
    } catch (e) { ERR('tabs', e); }
  }
  setInterval(bagTabs, 1200);

  // LB/RB-like: when inventory open, shoulder buttons cycle bag tabs if present (alongside existing inv/craft switch)
  try {
    document.addEventListener('keydown', e => {
      try {
        if (!document.getElementById('c404bt')) return;
        if (!(e.code === 'Digit9' && e.altKey)) return; // no steal of LB/RB - tabs are click/touch/focus
      } catch (_) {}
    });
  } catch (_) {}

  /* ---------- 6) crafting Blocks group heads: drop empty Corner stairs ---------- */
  try {
    if (window.__c197 && Array.isArray(__c197.GROUPS)) {
      // Keep group indices stable for key(); blank the corner label and skip empty heads via filter in setCat wrap
      const g0 = __c197.group;
      if (typeof g0 === 'function') {
        __c197.group = function (id) {
          if (isCornerId(id)) return 14; // Decor dump / unused
          const n = nm(id);
          if (isNatureId(id)) return 14;
          return g0.apply(this, arguments);
        };
      }
    }
  } catch (e) { ERR('c197', e); }

  /* ---------- 7) focused slot name: ensure bag group buttons still expose title ---------- */
  try {
    const obs = new MutationObserver(() => {
      try {
        const g = document.getElementById('invGrid'); if (!g) return;
        g.querySelectorAll('button[data-testid^="bag-item-"]').forEach(b => {
          if (b.title) return;
          const i = +String(b.dataset.testid || '').replace('bag-item-', '');
          const id = typeof bagItems === 'function' ? bagItems()[i] : 0;
          if (id && NAMES[id]) b.title = NAMES[id];
        });
      } catch (_) {}
    });
    const boot = setInterval(() => {
      const g = document.getElementById('invGrid');
      if (g) { obs.observe(g, {childList: true, subtree: true}); clearInterval(boot); }
    }, 500);
  } catch (e) { ERR('titles', e); }

  U.done = 1;
})();
