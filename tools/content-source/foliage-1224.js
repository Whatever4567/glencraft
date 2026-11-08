/* GLX-FOL1224 (v1.2.24): Disable foliage setting (persisted in glen_set as SET.noFoliage, default off).
   How: the shared plant and leaf materials are switched off (material.visible), so the renderer skips every grass tuft, flower,
   crop, sapling, mushroom and leaf block that uses them, in every chunk, newly streamed chunks and other realms alike.
   No block, chunk, save or geometry is touched or rebuilt, no shader changes, no scene scans; turning it off brings everything back at once.
   Not covered: logs and wood (kept, they are also building blocks), grass block ground, fire and cobwebs, far away low detail terrain,
   and plant models that do not use the shared plant materials. Held and dropped plant items get their own copy of the material when built, so they stay visible. */
(function fol1224() {
  const U = window.__fol1224 = {err: null, mats: 0, applies: 0, on: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const SKIP = () => new Set([typeof T !== 'undefined' ? T.COBWEB : -1, typeof T !== 'undefined' ? T.FIRE : -1].filter(v => v != null).map(String));
  U.list = () => { const out = [], sk = SKIP();
    try { if (typeof PLANT_MATS !== 'undefined') for (const k in PLANT_MATS) if (!sk.has(k)) out.push(...[].concat(PLANT_MATS[k])); } catch (e) { ERR('pm', e); }
    try { if (typeof BLOCK_MATS !== 'undefined' && typeof LEAFY !== 'undefined') for (const k in BLOCK_MATS) if (LEAFY[+k]) out.push(...[].concat(BLOCK_MATS[k])); } catch (e) { ERR('lm', e); }
    return [...new Set(out.filter(m => m && m.isMaterial))]; };
  U.apply = () => { const on = !!SET.noFoliage, L = U.list(); for (const m of L) { if (m.userData.fol0 === undefined) m.userData.fol0 = m.visible; m.visible = on ? false : m.userData.fol0; } U.mats = L.length; U.on = on ? 1 : 0; U.applies++; return L.length; };
  U.set = v => { SET.noFoliage = !!v; try { saveSet(); } catch (_) {} U.apply(); U.sync && U.sync(); };
  U.ui = () => { const ms = document.getElementById('mobSeg'); if (!ms || document.getElementById('folSeg')) return !!document.getElementById('folSeg'); const row = ms.closest('.set') || ms.parentNode;
    const d = document.createElement('div'); d.className = 'set inline'; d.innerHTML = '<span>Disable foliage</span><div class="seg" id="folSeg"><button data-v="1" data-testid="settings-folSeg-1">On</button><button data-v="0" data-testid="settings-folSeg-0">Off</button></div>';
    row.after(d); U.sync = () => d.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === (SET.noFoliage ? 1 : 0)));
    d.querySelectorAll('button').forEach(b => b.addEventListener('click', () => U.set(Number(b.dataset.v) === 1))); U.sync(); return true; };
  { let t = 0; const iv = setInterval(() => { try { if (U.ui() || ++t > 80) clearInterval(iv); } catch (e) { ERR('ui', e); clearInterval(iv); } }, 500); }
  // held and dropped plant items keep showing: an item mesh that uses a hidden plant material gets its own always visible copy
  // (one copy per material, made once, only when an item mesh is built; the world plants keep the shared hidden one)
  const CP = new Map(); U.copies = 0;
  const own = (m, hs) => { if (!m || !m.isMaterial || !hs.has(m)) return m; let c = CP.get(m); if (!c) { c = m.clone(); c.visible = true; c.userData = {fol: 'item'}; CP.set(m, c); U.copies++; } return c; };
  try { const mi = makeItemMesh; makeItemMesh = function () { const g = mi.apply(this, arguments); try { if (g && g.traverse) { const hs = new Set(U.list()); g.traverse(o => { if (o.material) o.material = Array.isArray(o.material) ? o.material.map(m => own(m, hs)) : own(o.material, hs); }); } } catch (e) { ERR('item', e); } return g; }; } catch (e) { ERR('miw', e); }
  try { const di = dropItem; dropItem = function () { const n0 = typeof drops !== 'undefined' ? drops.length : 0, r = di.apply(this, arguments); try { const d = drops[drops.length - 1]; if (d && drops.length !== n0 || (d && d.m && !d.m.userData.fol)) { if (d.m && d.m.material) { d.m.material = own(d.m.material, new Set(U.list())); d.m.userData.fol = 1; } } } catch (e) { ERR('drop', e); } return r; }; } catch (e) { ERR('diw', e); }
  // materials registered later by other modules are picked up by a cheap re-apply (a list of materials, not the scene)
  try { U.apply(); } catch (e) { ERR('a0', e); } setInterval(() => { try { if (SET.noFoliage) U.apply(); } catch (e) { ERR('a', e); } }, 3000);
})();
