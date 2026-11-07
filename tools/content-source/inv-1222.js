/* GLX-INV1222 (v1.2.22): survival inventory redesign.
   Storage model (honest): item counts stay in the one count per item store the whole game uses (inv), so crafting, chests, furnaces,
   armour, saves and every older module keep working unchanged. On top of it the inventory now has real positions: prog.inv22 is a list
   of slots (item id or 0 for an empty square) and MODE.hotbar is the 9 hotbar slots. Each item type sits in exactly one slot with its
   full count (stacks are not split into 64s). Positions are saved with the world inside prog, so older builds simply ignore them.
   Moving: pick a slot (filled or empty), then pick another; the two swap. Counts never change by moving.
   Also: three icon tabs (Inventory, Crafting, Character), LB / RB cycle them, the hotbar row sits under the grid, a scrolling grid
   that gets denser on phones, the creative bag inside the inventory in survival in place of the Bag of Everything for new worlds,
   and new worlds start once with the Purple crystal pickaxe and a Jetpack. */
(function inv1222() {
  const U = window.__inv1222 = {err: null, swaps: 0, renders: 0, granted: 0, bagOff: 0, given: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const PICK = 761, JET = 291, MINS = 36;
  const surv = () => !(typeof MODE !== 'undefined' && MODE.name === 'creative');
  const has = id => !!id && (MODE.infinite || cnt(id) > 0);
  // ---- model ----
  U.layout = () => { if (!Array.isArray(prog.inv22)) prog.inv22 = []; const S = prog.inv22; if (!MODE.hotbar || MODE.hotbar.length !== 9) ensureHotbar(); const hot = new Set((MODE.hotbar || []).filter(has)), seen = new Set();
    for (let i = 0; i < S.length; i++) { const id = S[i]; if (!id || !has(id) || hot.has(id) || seen.has(id)) S[i] = 0; else seen.add(id); }
    for (const id of bagItems()) { if (hot.has(id) || seen.has(id)) continue; let j = S.indexOf(0); if (j < 0) { j = S.length; S.push(0); } S[j] = id; seen.add(id); }
    let last = -1; for (let i = S.length - 1; i >= 0; i--) if (S[i]) { last = i; break; }
    const want = Math.max(MINS, Math.ceil((last + 1 + 9) / 9) * 9); while (S.length < want) S.push(0); if (S.length > want) S.length = want; return S; };
  const get = r => r.k === 'h' ? (MODE.hotbar[r.i] || 0) : (prog.inv22[r.i] || 0), put = (r, v) => { if (r.k === 'h') MODE.hotbar[r.i] = v; else prog.inv22[r.i] = v; };
  U.swap = (a, b) => { if (!a || !b || (a.k === b.k && a.i === b.i)) return false; U.layout(); const va = has(get(a)) ? get(a) : 0, vb = has(get(b)) ? get(b) : 0; put(a, vb); put(b, va);
    if (a.k === 'h' || b.k === 'h') { const nh = a.k === 'h' ? vb : va; if (nh) selId = nh; } U.layout(); U.swaps++; return true; };
  U.total = () => { let n = 0; for (const k in inv) n += inv[k] || 0; return n; };
  // ---- loadout and bag for NEW worlds only (a saved world never gets them again; respawn does not call this) ----
  try { const ew = enterWorld; enterWorld = function (save) { const r = ew.apply(this, arguments); try { if (!save && current && surv()) {
          try { localStorage.setItem('glen_bagG_' + current.id, 'inv1222'); U.bagOff++; } catch (_) {}
          const give = () => { if (typeof started === 'undefined' || !started) return false; if (prog.load1222) return true; prog.load1222 = 1; if (NAMES[PICK]) addItem(PICK, 1); if (NAMES[JET]) addItem(JET, 1); U.given++; try { toast('You start with a Purple crystal pickaxe and a Jetpack'); } catch (_) {} return true; };
          if (!give()) { let n = 0; const t = setInterval(() => { if (give() || ++n > 120) clearInterval(t); }, 500); } } } catch (e) { ERR('ew', e); } return r; }; } catch (e) { ERR('eww', e); }
  // ---- UI ----
  const css = document.createElement('style'); css.textContent = [
    '#craft .tabs{justify-content:center;gap:10px}',
    '#craft .tabs #tabInv,#craft .tabs #tabCraft,#craft .tabs #tabChar{font-size:0!important;width:56px;height:48px;padding:0!important;display:inline-flex;align-items:center;justify-content:center}',
    '#craft .tabs #tabInv::before,#craft .tabs #tabCraft::before,#craft .tabs #tabChar::before{width:30px!important;height:30px!important;margin:0!important}',
    "html body #craft .tabs #tabChar::before{background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='5' r='3.2' fill='%23e8c39e'/%3E%3Crect x='7.5' y='9' width='9' height='7' rx='1.5' fill='%232f6fbf'/%3E%3Crect x='5' y='9.5' width='2.4' height='6' rx='1' fill='%232f6fbf'/%3E%3Crect x='16.6' y='9.5' width='2.4' height='6' rx='1' fill='%232f6fbf'/%3E%3Crect x='8' y='16' width='3.4' height='6' fill='%231d4a2c'/%3E%3Crect x='12.6' y='16' width='3.4' height='6' fill='%231d4a2c'/%3E%3C/svg%3E\")!important}",
    'body.inv22 #invPane>:not(#inv22){display:none!important}',
    '#inv22{display:flex;flex-direction:column;gap:6px;min-height:0;flex:1;--s:clamp(40px,10.5vw,56px)}',
    '#inv22 .g{display:grid;grid-template-columns:repeat(auto-fill,var(--s));gap:4px;justify-content:center;overflow-y:auto;overscroll-behavior:contain;max-height:46vh;padding:2px}',
    '#inv22 .h{display:grid;grid-template-columns:repeat(9,var(--s));gap:4px;justify-content:center;padding-top:6px;border-top:2px solid rgba(255,255,255,.15)}',
    '#inv22 .gslot{width:var(--s);height:var(--s);min-width:0;min-height:0;margin:0}', '#inv22 .gslot.pick{outline:3px solid #8fd0ff!important}',
    '#inv22 .bar{display:flex;gap:8px;align-items:center;justify-content:space-between;font-size:12px;color:var(--muted)}',
    '#inv22 .cb{display:grid;grid-template-columns:repeat(auto-fill,var(--s));gap:4px;justify-content:center;overflow-y:auto;max-height:40vh}',
    '@media (max-width:700px),(pointer:coarse){#inv22{--s:clamp(36px,9.6vw,46px)}#inv22 .g{max-height:42vh}}',
    '@media (max-width:420px){#inv22{--s:clamp(32px,10vw,40px)}#inv22 .h{gap:2px}}'].join('\n');
  document.head.appendChild(css);
  let pickR = null, bagOn = false, root = null;
  function lab() { try { const L = [['tabInv', 'Inventory'], ['tabCraft', 'Crafting'], ['tabChar', 'Character and armour']]; for (const [id, t] of L) { const b = $(id); if (b) { b.setAttribute('aria-label', t); b.title = t; if (id === 'tabInv') b.textContent = 'Inventory'; } } } catch (_) {} }
  const stackOf = id => (TOOL[id] || (typeof ARMOUR !== 'undefined' && ARMOUR[id])) ? 1 : 64;
  function cell(id, r) { const d = document.createElement('button'); const on = has(id); d.className = 'gslot' + (on ? '' : ' empty') + (pickR && pickR.k === r.k && pickR.i === r.i ? ' pick' : '') + (r.k === 'h' && on && id === selId ? ' hint' : '');
    d.dataset.testid = (r.k === 'h' ? 'inv-hot-' : 'inv-slot-') + r.i; d.setAttribute('aria-label', on ? NAMES[id] + ' ' + cnt(id) : 'Empty slot'); if (on) { d.innerHTML = slotHTML(id, cnt(id)); d.title = NAMES[id]; }
    d.addEventListener('click', () => U.tap(r)); return d; }
  U.tap = r => { if (!pickR) { pickR = r; try { sfx('pop', .25); } catch (_) {} } else if (pickR.k === r.k && pickR.i === r.i) pickR = null; else { U.swap(pickR, r); pickR = null; try { sfx('pop', .35); } catch (_) {} } U.render(); };
  U.picked = () => pickR;
  U.render = () => { const pane = $('invPane'); if (!pane) return; U.renders++; let fk = null; try { if (typeof navEl !== 'undefined' && navEl && root && root.contains(navEl)) fk = navEl.dataset.testid || null; } catch (_) {} document.body.classList.add('inv22'); lab();
    if (!root || root.parentNode !== pane) { root = document.createElement('div'); root.id = 'inv22'; root.dataset.testid = 'inventory-slots'; pane.appendChild(root); }
    const S = U.layout(); root.innerHTML = '';
    const bar = document.createElement('div'); bar.className = 'bar'; bar.innerHTML = '<span>Pick a slot, then another slot to swap them</span>'; const bb = document.createElement('button'); bb.className = 'btn small'; bb.dataset.testid = 'inv-creative-bag'; bb.textContent = bagOn ? 'Back to inventory' : 'Creative bag'; bb.addEventListener('click', () => { bagOn = !bagOn; pickR = null; U.render(); }); bar.appendChild(bb); root.appendChild(bar);
    if (bagOn) { const g = document.createElement('div'); g.className = 'cb'; g.dataset.testid = 'inv-creative-grid'; const all = (typeof CREATIVE_ALL !== 'undefined' ? CREATIVE_ALL : ORDER).filter(id => NAMES[id] && id !== 990);
      for (const id of all) { const b = document.createElement('button'); b.className = 'gslot'; b.title = NAMES[id]; b.dataset.testid = 'inv-cb-' + id; b.setAttribute('aria-label', 'Take ' + NAMES[id] + (cnt(id) > 0 ? ', you have ' + cnt(id) : '')); b.innerHTML = cnt(id) > 0 ? slotHTML(id, cnt(id)) : '<div class="ic' + iconClass(id) + '" style="' + iconStyle(id) + '"></div>'; b.addEventListener('click', () => U.take(id)); g.appendChild(b); }
      root.appendChild(g); }
    else { const g = document.createElement('div'); g.className = 'g'; g.dataset.testid = 'inv-grid'; S.forEach((id, i) => g.appendChild(cell(id, {k: 'g', i}))); root.appendChild(g); }
    const h = document.createElement('div'); h.className = 'h'; h.dataset.testid = 'inv-hotbar'; for (let i = 0; i < 9; i++) h.appendChild(cell(MODE.hotbar[i], {k: 'h', i})); root.appendChild(h);
    try { renderHotbar(); } catch (_) {} try { if (fk) { const e = root.querySelector('[data-testid="' + fk + '"]'); if (e) navEl = e; } } catch (_) {} try { navRefresh(); } catch (_) {} };
  U.take = id => { addItem(id, stackOf(id)); U.layout(); U.took = (U.took || 0) + 1; try { sfx('pop', .35); } catch (_) {} try { toast(NAMES[id] + ': you have ' + cnt(id)); } catch (_) {} U.render(); };
  // v1.2.23: controller Y (quick move) works on the new storage: storage item to the next free hotbar slot, armour goes on, hotbar item back to storage, creative bag item taken
  U.quick = el => { const t = el && el.dataset && el.dataset.testid || ''; let m;
    if ((m = /^inv-cb-(\d+)$/.exec(t))) { U.take(+m[1]); return true; }
    if ((m = /^inv-hot-(\d+)$/.exec(t))) { const i = +m[1]; if (MODE.hotbar[i]) { MODE.hotbar[i] = 0; U.layout(); try { sfx('pop', .3); } catch (_) {} U.render(); } return true; }
    if ((m = /^inv-slot-(\d+)$/.exec(t))) { U.layout(); const id = prog.inv22[+m[1]]; if (!has(id)) return true; pickR = null;
      if (typeof ARMOUR !== 'undefined' && ARMOUR[id] && typeof equipArmour === 'function') equipArmour(id);
      else { const hb = MODE.hotbar; let i = hb.findIndex(x => !x || !has(x)); if (i < 0) { i = hb.indexOf(selId); if (i < 0) i = 0; } U.swap({k: 'g', i: +m[1]}, {k: 'h', i}); }
      try { sfx('pop', .3); } catch (_) {} U.render(); return true; } return false; };
  if (typeof quickMove === 'function') try { const qm = quickMove; quickMove = function () { try { if (surv() && typeof invTab !== 'undefined' && invTab === 'bag' && typeof navEl !== 'undefined' && navEl && root && root.contains(navEl) && (typeof cursor === 'undefined' || !cursor) && U.quick(navEl)) return; } catch (e) { ERR('qm', e); } return qm.apply(this, arguments); }; } catch (e) { ERR('qmw', e); }
  try { const rb = renderBag; renderBag = function () { if (!surv()) { document.body.classList.remove('inv22'); return rb.apply(this, arguments); } try { return U.render(); } catch (e) { ERR('render', e); document.body.classList.remove('inv22'); return rb.apply(this, arguments); } }; } catch (e) { ERR('rbw', e); }
  try { if (typeof TABS !== 'undefined' && !TABS.includes('char')) TABS.push('char'); } catch (e) { ERR('tabs', e); }
  try { const om = openMenu; openMenu = function (open) { if (!open) pickR = null; lab(); return om.apply(this, arguments); }; } catch (e) { ERR('om', e); }
  lab();
})();
