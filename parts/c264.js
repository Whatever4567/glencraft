/* GLX-C264 (v1.0.76): Patch notes button on the main menu (under Play and Settings, blue, controller-focusable),
   and the Bag of Everything - a bag in your inventory holding one stack of every item and block in the game, given once per world */
(() => {
  const U = window.__c264 = {err: null, menu: 0, bag: 0, granted: 0, items: 0};
  // ---- main menu: Patch notes under Play + Settings ----
  try {
    const box = document.getElementById('m65btns'), set = $('setBtn');
    const old = document.getElementById('pnTitleBtn'); if (old) old.remove();
    const b = document.createElement('button'); b.id = 'pnMenuBtn'; b.className = 'tile'; b.setAttribute('data-testid', 'title-patch-notes-btn'); b.textContent = 'Patch notes';
    b.addEventListener('click', e => { e.preventDefault(); window.__c114 && __c114.open(); });
    (box || set.parentNode).insertBefore(b, set.nextSibling);
    const st = document.createElement('style'); st.textContent = '#m65btns #pnMenuBtn{width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;flex:none!important;margin:0!important;min-height:58px;height:auto;font-size:22px!important;font-weight:900;letter-spacing:2px;text-transform:uppercase;display:flex;align-items:center;justify-content:center;border-radius:10px;padding:10px 0!important}@media (orientation:landscape) and (max-height:500px){#m65btns #pnMenuBtn{min-height:48px;font-size:19px!important}}'; document.head.appendChild(st);
    U.menu = 1;
  } catch (e) { U.err = 'menu ' + e; }
  // ---- Bag of Everything ----
  try {
    const BAG = 990; U.id = BAG; IT.BAG = BAG; NAMES[BAG] = 'Bag of Everything';
    try { ICON_KEY[BAG] = ICON_KEY[T.CHEST]; if (ICONS[T.CHEST]) ICONS[BAG] = ICONS[T.CHEST]; } catch (_) {}
    if (!ORDER.includes(BAG)) ORDER.unshift(BAG);
    const KEY = '__bag__', LS = () => 'glen_bag_' + (current && current.id), FLAG = () => 'glen_bagG_' + (current && current.id);
    const stackOf = id => (TOOL[id] || (typeof ARMOUR !== 'undefined' && ARMOUR[id])) ? 1 : 64;
    function all() { const seen = new Set(), out = []; for (const id of ORDER) { if (id === BAG || seen.has(id) || !NAMES[id]) continue; seen.add(id); out.push([id, stackOf(id)]); } return out; }
    function slots() { try { const s = JSON.parse(localStorage.getItem(LS()) || 'null'); if (Array.isArray(s)) return s; } catch (_) {} const a = all(); U.items = a.length; return a; }
    function store(s) { try { localStorage.setItem(LS(), JSON.stringify(s)); } catch (_) {} }
    function grant() {
      if (!current || !started) return; if (localStorage.getItem(FLAG())) return;
      localStorage.setItem(FLAG(), String(Date.now())); store(all()); U.items = all().length;
      if (cnt(BAG) < 1) addItem(BAG, 1); selId = BAG; try { showItemName(); } catch (_) {} U.granted++;
      try { toast('A Bag of Everything is in your inventory - hold it and use it to open'); } catch (_) {}
    }
    U.grant = grant; U.slots = slots;
    // v1.0.89: every NEW or reset world gets its own Bag of Everything (with the starter kit)
    try { const ew = enterWorld; enterWorld = function (save) { if (!save) try { localStorage.removeItem(FLAG()); localStorage.removeItem(LS()); } catch (_) {} return ew.apply(this, arguments); }; } catch (_) {}
    setInterval(() => { try { grant(); } catch (e) { U.err = 'grant ' + e; } }, 2000);
    function openBag() {
      closePanels(); const s = slots(); chests.set(KEY, {slots: s}); openChestKey = KEY;
      menuOpen = true; $('chestUI').classList.add('c264bag'); $('chestUI').classList.remove('hidden'); renderChest(); try { sfx('chestOpen'); } catch (_) {}
      if (document.pointerLockElement) document.exitPointerLock(); U.bag++;
    }
    U.open = openBag;
    const sw = saveWorld; saveWorld = function () { const c = chests.get(KEY); if (c) chests.delete(KEY); try { return sw.apply(this, arguments); } finally { if (c) chests.set(KEY, c); } };
    const cp = closePanels; closePanels = function () {
      if (openChestKey === KEY) { const c = chests.get(KEY); if (c) store(c.slots.filter(x => x)); chests.delete(KEY); $('chestUI').classList.remove('c264bag'); }
      return cp.apply(this, arguments);
    };
    const st = document.createElement('style'); st.textContent = '#chestUI.c264bag #chestGrid{max-height:52vh;overflow-y:auto}'; document.head.appendChild(st);
    const ui = useItem; useItem = function () { if (!menuOpen && !paused && !dead && started && selId === BAG && cnt(BAG) > 0) { openBag(); return; } return ui.apply(this, arguments); };
    // never place, drop or lose the bag by accident
    if (typeof PLACEABLE !== 'undefined') PLACEABLE.delete(BAG);
  } catch (e) { U.err = 'bag ' + e; }
})();
