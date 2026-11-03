/* GLX-C292 (v1.0.98, v1.0.108: the inventory layout is back to the pre v1.0.98 one with its Character tab, only the tabs, hints and crafting grid stay): menu layout overhaul (layout only, Glencraft gold theme kept).
   Inventory: bag (hotbar column + grid) on the left, Armour on the right (slots in a row over the live 3D preview, RS turns it).
   Bottom tabs: Inventory and Crafting (LB/RB switch, B exits). Crafting: recipe browser left with a Search box; right a 3x3 grid that
   fills with the recipe, an arrow and the result with its name; recipes you cannot make are red. Pause: title banner, then a clean
   stack of big buttons - Resume, Settings, Upload world / builds (Test World only), Reset world, Save and quit. */
(function c292() {
  const U = window.__c292 = {err: null};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const $$ = id => document.getElementById(id);
  const css = `
#craft .panel{width:min(97vw,1180px)!important;max-width:none!important;height:min(94vh,94dvh,720px)!important;max-height:none!important;display:flex!important;flex-direction:column;gap:6px;padding:10px 12px!important;box-sizing:border-box;overflow:hidden}
#craft .panel>.tabs{order:98;justify-content:center;gap:10px;margin:0!important;flex:0 0 auto}
#craft .panel>.tabs>button{padding:4px 18px!important;font-size:14px!important;min-height:0!important}
#craft .panel>div:last-child{order:99;flex:0 0 auto}
#craft .panel>#invPane,#craft .panel>#craftTab,#craft .panel>#charTab{flex:1 1 auto;min-height:0;overflow-y:auto}
#c292grid{display:flex;align-items:center;gap:12px;justify-content:center;margin:6px 0}
#c292grid .g3{display:grid;grid-template-columns:repeat(3,44px);gap:4px}
#c292grid .g3 i,#c292grid .res i{width:44px;height:44px;border:2px solid rgba(232,190,90,.5);border-radius:6px;background:rgba(0,0,0,.35) center/80% no-repeat;display:flex;align-items:flex-end;justify-content:flex-end;font:bold 11px sans-serif;color:#fff;font-style:normal;text-shadow:0 1px 2px #000}
#c292grid .g3 i.miss{background-color:rgba(170,30,30,.45)}
#c292grid .arr{font-size:30px;color:#e8be5a}
#c292grid .res{display:flex;flex-direction:column;align-items:center;gap:3px;color:#f4e3b0;font:bold 12px sans-serif;max-width:110px;text-align:center}
#c292grid .res i{width:54px;height:54px;border-color:#e8be5a}
#c292search{width:100%;box-sizing:border-box;margin:2px 0 6px;padding:5px 8px;border-radius:8px;border:2px solid rgba(232,190,90,.5);background:rgba(0,0,0,.4);color:#f4e3b0;font:14px sans-serif}
#c292exit{font:bold 12px sans-serif;color:#e8be5a;opacity:.85;margin-left:auto}
#pause .panel .btns{display:flex!important;flex-direction:column;gap:8px}
#pause .panel .btns>.btn{width:100%}
#pause:not(.titleMode) .panel.c292main>#setTabs,#pause:not(.titleMode) .panel.c292main>.c163pane,#pause:not(.titleMode) .panel.c292main>#osmNote,#pause:not(.titleMode) .panel.c292main>.c292lab{display:none!important}#pause.titleMode #c292back{display:none!important}
#pause .panel #pauseTitle .c292b{display:block;font-size:12px;letter-spacing:3px;color:#e8be5a;opacity:.85}
@media (max-height:460px){#craft .gslot{width:38px!important;height:38px!important}#c292grid .g3{grid-template-columns:repeat(3,34px)}#c292grid .g3 i{width:34px;height:34px}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  // ---------- inventory = bag + armour together ----------
  try { const tb = $$('tabInv'); if (tb && !/Inventory/.test(tb.textContent)) tb.lastChild.textContent = ' Inventory'; } catch (_) {}
  try { const ft = $$('closeCraft') && $$('closeCraft').parentElement; if (ft && !$$('c292exit')) { const h = document.createElement('span'); h.id = 'c292exit'; h.textContent = 'LB / RB switch tabs   B exit'; ft.appendChild(h); } } catch (_) {}
  // ---------- crafting: 3x3 grid + result, search ----------
  function grid() { try { const det = $$('recDetail'), r = RECIPES[craftFocus]; if (!det || !r) return; let g = $$('c292grid'); if (!g) { g = document.createElement('div'); g.id = 'c292grid'; const h = $$('rdName'); h.after(g); }
      const cells = []; for (const [id, c] of r.need) { let left = c; while (left > 0 && cells.length < 9) { const n = Math.min(left, 64); cells.push([id, n]); left -= n; } }
      let h = '<div class="g3">'; for (let i = 0; i < 9; i++) { const q = cells[i]; h += q ? '<i class="' + (cnt(q[0]) >= q[1] ? '' : 'miss') + '" style="' + iconStyle(q[0]) + ';background-size:80%">' + (q[1] > 1 ? q[1] : '') + '</i>' : '<i></i>'; }
      h += '</div><span class="arr">&#10140;</span><div class="res"><i style="' + iconStyle(r.out) + ';background-size:80%">' + (r.n > 1 ? r.n : '') + '</i>' + r.name + '</div>'; g.innerHTML = h; } catch (e) { ERR('grid', e); } }
  try { const uc = updateCraftList; let last = ''; updateCraftList = function () { const r = uc.apply(this, arguments); try { const rr = RECIPES[craftFocus]; const k = craftFocus + ':' + (rr ? rr.need.map(([id]) => cnt(id)).join(',') : ''); if (k !== last || !$$('c292grid')) { last = k; grid(); } } catch (_) {} return r; }; } catch (e) { ERR('uc', e); }
  function search() { try { const rec = $$('recipes'), rg = $$('recGrid'); if (!rec || !rg || $$('c292search')) return; const inp = document.createElement('input'); inp.id = 'c292search'; inp.placeholder = 'Search recipes'; inp.setAttribute('data-testid', 'craft-search');
      rg.before(inp); inp.addEventListener('input', () => { const q = inp.value.trim().toLowerCase(); craftBtns.forEach((b, i) => { if (!b) return; const hit = !q || RECIPES[i].name.toLowerCase().includes(q); b.style.display = hit ? '' : 'none'; if (q && hit && b.parentElement !== rg) rg.appendChild(b); }); });
      inp.addEventListener('keydown', e => e.stopPropagation()); } catch (e) { ERR('search', e); } }
  setTimeout(search, 1000); setTimeout(search, 4000);
  // ---------- pause: big stack, settings behind a button ----------
  function pause() { try { const pz = $$('pause'), pn = pz && pz.querySelector('.panel'), btns = pn && pn.querySelector('.btns'); if (!btns) return;
      if (!$$('c292set')) { const b = document.createElement('button'); b.id = 'c292set'; b.className = 'btn'; b.textContent = 'Settings'; b.setAttribute('data-testid', 'pause-settings-button'); const res = $$('resumeBtn'); res.after(b);
        b.addEventListener('click', () => { pn.classList.remove('c292main'); btns.style.display = 'none'; const bk = $$('c292back'); if (bk) bk.style.display = 'block'; try { navRefresh(); } catch (_) {} });
        const bk = document.createElement('button'); bk.id = 'c292back'; bk.className = 'btn small'; bk.textContent = 'Back'; bk.style.display = 'none'; bk.setAttribute('data-testid', 'pause-settings-back'); btns.after(bk);
        bk.addEventListener('click', () => { pn.classList.add('c292main'); btns.style.display = ''; bk.style.display = 'none'; try { navRefresh(); } catch (_) {} });
        const t = $$('pauseTitle'); if (t && !t.querySelector('.c292b')) { t.innerHTML = 'Glencraft<span class="c292b">GAME PAUSED</span>'; } }
      for (const id of ['c278up', 'c285up', 'resetWorldBtn']) { const e = $$(id); if (e && e.parentElement !== btns) $$('saveQuit').before(e); }
      for (const d of pn.children) if (d.tagName === 'DIV' && !d.id && !d.className && /^\s*Settings\s*$/.test(d.textContent)) d.classList.add('c292lab');
      if (!pn.dataset.c292) { pn.dataset.c292 = 1; pn.classList.add('c292main'); } } catch (e) { ERR('pause', e); } }
  try { const sp = setPause; setPause = function (on) { const r = sp.apply(this, arguments); try { if (on) { pause(); const pn = $$('pause').querySelector('.panel'); pn.classList.add('c292main'); pn.querySelector('.btns').style.display = ''; const bk = $$('c292back'); if (bk) bk.style.display = 'none'; } } catch (_) {} return r; }; } catch (e) { ERR('sp', e); }
})();
