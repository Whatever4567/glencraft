/* GLX-C293 (v1.0.99): menu checklist gaps - crafting tabs All / Construction / Nature / Items (Search looks through all), bag
   category tabs, readable armour slot labels (3 x 2), and in the pause menu a turning 3D character with small Patch notes and Help
   icon buttons. */
(function c293() {
  const U = window.__c293 = {err: null, bagTab: 'All'};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const $$ = id => document.getElementById(id);
  const NAT = /seed|sapling|flower|wool|leaf|leaves|moss|dye|bone|meal|hay|honey|wax|feather|string|vine|mushroom|peat|heather|thistle|clay|sand|grass/i;
  function grp(r) { let c = 'items'; try { c = categorise(r); } catch (_) {} const n = (NAMES[r.out] || r.name || '');
    if (c === 'food' || NAT.test(n)) return 'nature'; if (c === 'blocks') return 'construction'; return 'items'; }
  U.grp = grp;
  try { CATS.length = 0; CATS.push(['all', 'All'], ['construction', 'Construction'], ['nature', 'Nature'], ['items', 'Items']);
    CAT_ICON.all = T.TABLE; CAT_ICON.construction = T.STONEBRICK || T.COBBLE; CAT_ICON.nature = T.LEAVES; CAT_ICON.items = IT.IPICK || T.TABLE;
    catRecipes = function () { const out = []; RECIPES.forEach((r, i) => { if (craftCat === 'all' || grp(r) === craftCat) out.push(i); }); return out; };
    craftCat = 'all'; if ($$('recipes')) buildCraftList(); } catch (e) { ERR('cats', e); }
  // c122 rebuilds the bar when its own tabs are missing - keep ours
  setInterval(() => { try { const b = document.querySelector('[data-testid=craft-categories]'); if (b && !b.querySelector('[data-testid=craft-cat-all]') && $$('recipes')) { if (!['all', 'construction', 'nature', 'items'].includes(craftCat)) craftCat = 'all'; buildCraftList(); } } catch (_) {} }, 1500);
  // search: switch to All, then filter
  setInterval(() => { try { const s = $$('c292search'); if (!s || s.dataset.c293) return; s.dataset.c293 = 1; s.addEventListener('input', () => { if (craftCat !== 'all' && s.value.trim()) { setCat('all'); s.dispatchEvent(new Event('input')); } }, true); } catch (_) {} }, 1000);
  const st = document.createElement('style'); st.textContent = `
.rec2.no{background:linear-gradient(rgba(170,30,30,.45),rgba(120,20,20,.45))!important;border-color:#b33!important}
#c293bt{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 4px;grid-column:2}
#c293bt button{padding:2px 9px;border-radius:7px;border:1px solid rgba(232,190,90,.5);background:rgba(0,0,0,.35);color:#e8d7a0;font:bold 11px sans-serif}
#c293bt button.on{background:rgba(242,196,64,.2);border-color:#f2c440;color:#ffe7a0}
#c293pv{position:absolute;right:-210px;top:10px;width:200px;height:300px;border-radius:12px;border:2px solid rgba(232,190,90,.5);background:rgba(10,8,4,.75)}
#c293pv canvas{width:100%;height:100%}
#c293ic{display:flex;gap:8px;justify-content:center;margin-top:8px}
#c293ic button{width:46px;height:40px;border-radius:10px;font-size:20px;padding:0}
@media (max-width:900px){#c293pv{width:110px;height:165px;right:-118px;top:6px}}@media (max-height:500px){#c293pv{width:100px;height:150px;right:-108px}}
#pause.titleMode #c293pv,#pause.titleMode #c293ic{display:none}`; document.head.appendChild(st);
  // ---------- bag category tabs ----------
  function bagTabs() { const g = $$('invGrid'), pane = $$('invPane'); if (!g || !pane) return; let bar = $$('c293bt'); if (!bar) { bar = document.createElement('div'); bar.id = 'c293bt'; bar.setAttribute('data-testid', 'bag-tabs'); g.before(bar); }
    const heads = [...g.querySelectorAll('.c121cat')].map(h => h.textContent.replace(/\s*\(\d+\)\s*$/, '')); const names = ['All', ...heads]; if (!names.includes(U.bagTab)) U.bagTab = 'All';
    const sig = names.join('|') + '#' + U.bagTab; if (bar.dataset.sig !== sig) { bar.dataset.sig = sig; bar.innerHTML = ''; for (const n of names) { const b = document.createElement('button'); b.textContent = n; b.className = n === U.bagTab ? 'on' : ''; b.setAttribute('data-testid', 'bag-tab-' + n.toLowerCase().replace(/[^a-z]+/g, '-'));
        b.addEventListener('click', () => { U.bagTab = n; bagTabs(); try { navRefresh(); } catch (_) {} }); bar.appendChild(b); } }
    let cur = null; for (const c of g.children) { if (c.classList.contains('c121cat')) cur = c.textContent.replace(/\s*\(\d+\)\s*$/, ''); c.style.display = U.bagTab === 'All' || cur === U.bagTab ? '' : 'none'; } }
  /* v1.0.108: bag category tabs removed again - the bag is back to its pre v1.0.98 layout */ void bagTabs;
  // ---------- pause: 3D character + icon buttons ----------
  let pv = null, pc = null, yaw = 0.45, tm = null;
  function pauseExtras() { const pz = $$('pause'), pn = pz && pz.querySelector('.panel'); if (!pn) return; if (getComputedStyle(pn).position === 'static') pn.style.position = 'relative';
    if (!$$('c293ic')) { const row = document.createElement('div'); row.id = 'c293ic'; const mk = (txt, title, tid, fn) => { const b = document.createElement('button'); b.className = 'btn small'; b.innerHTML = txt; b.title = title; b.setAttribute('aria-label', title); b.setAttribute('data-testid', tid); b.addEventListener('click', fn); row.appendChild(b); };
      mk('&#128220;', 'Patch notes', 'pause-icon-patch-notes', () => { const b = $$('pnPauseBtn'); if (b) b.click(); });
      mk('?', 'Help and controls', 'pause-icon-help', () => { const s = $$('c292set'); if (s) s.click(); const t = document.querySelector('[data-testid=settings-tab-controls]'); if (t) t.click(); });
      const btns = pn.querySelector('.btns'); btns.appendChild(row); } }
  function drawPv() { try { if (!pc || !paused || $$('pause').classList.contains('hidden')) { clearInterval(tm); tm = null; return; } if (!charR) initChar(); if (!charR || !charModel) return;
      charR.setSize(200, 300, false); charCam.aspect = 200 / 300; charCam.updateProjectionMatrix(); yaw += 0.02; charModel.rotation.y = yaw; charR.render(charScene, charCam);
      const g = pc.getContext('2d'); g.clearRect(0, 0, 200, 300); g.drawImage(charR.domElement, 0, 0, 200, 300); const cv = $$('charCv'); if (cv) cv._w = 0; } catch (e) { ERR('pv', e); } }
  try { const sp = setPause; setPause = function (on) { const r = sp.apply(this, arguments); try { if (on && !$$('pause').classList.contains('titleMode')) { pauseExtras(); /* v1.0.108: no 3D character in the pause menu */ } } catch (e) { ERR('pause', e); } return r; }; } catch (e) { ERR('sp', e); }
})();

;(function(){const pp=padPause;padPause=function(dir,adj,act){const b=pFocus;const r=pp.call(this,dir,adj,act);
 if(dir&&pFocus===b){const it=pauseItems();const vis=it.filter(e=>e.offsetParent!==null);let i=vis.indexOf(it[b]);if(vis.length){i=(i+dir+vis.length)%vis.length;pFocus=it.indexOf(vis[i]);refocusPause();}}return r;};})();
