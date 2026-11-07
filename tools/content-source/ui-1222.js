/* GLX-UI1222 (v1.2.22): menus.
   - One Teleport list in the pause menu: Glencraft spawn, the North Scotland cave, Agartha city, the unicorn, each clansman and your builds,
     all in one place. A place that is not ready says why and its button is off. The Moon and Mars have no teleport (you fly there), and the
     old separate Agartha world is not offered.
   - Settings: smaller text, same big tap areas; on and off buttons are strongly inverted (the chosen one is white with dark text and a tick,
     the other is dark and dim), they report pressed state to screen readers, and focus has a clear gold ring.
   - Save and quit asks first, in the game (not a browser box). Cancel does nothing; Yes runs the save and quit once.
   - Offhand slot sits on the right of the character, the armour on the left. */
(function ui1222() {
  const U = window.__ui1222 = {err: null, tp: 0, renders: 0, asks: 0, quits: 0, ariaN: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const $ = id => document.getElementById(id);
  const close = () => { try { setPause(false); } catch (_) {} };
  const has = f => { try { return typeof eval(f) === 'function'; } catch (_) { return false; } };
  // ---------- teleport registry ----------
  const clan = () => [...document.querySelectorAll('[data-testid^="pause-tp-"]')].filter(b => b.dataset.testid !== 'pause-tp-unicorn' && !b.closest('#tpmBox'));
  U.list = () => { const L = [], ok = () => typeof started === 'undefined' || started, ow = () => typeof DIM === 'undefined' || !DIM.cur;
    L.push({id: 'tpmSpawn', g: 'Glencraft', label: 'Glencraft spawn', why: !ok() ? 'Start a world first' : !ow() ? 'Leave this realm first' : !has('spawnPlayer') ? 'Not ready' : '', go: () => { spawnPlayer(); close(); }});
    L.push({id: 'tpmIsland', g: 'Agartha', label: 'North Scotland cave to Agartha', why: window.__agw && __agw.toMouth ? '' : 'Not ready', go: () => __tpm.toIsland()});
    L.push({id: 'tpmTube', g: 'Agartha', label: 'Agartha (crystal city)', why: window.__agw && __agw.toCity ? '' : 'Not ready', go: () => __tpm.toTube()});
    const uni = $('tpUniBtn'); L.push({id: 'tpmUni', g: 'Friends', label: 'Unicorn', why: uni ? '' : 'Not ready', go: () => uni.click()});
    for (const b of clan()) { const t = (b.textContent || '').replace(/^Teleport to /, ''); L.push({id: 'tpmC_' + b.dataset.testid.slice(9), g: 'Friends', label: t, why: '', go: () => b.click()}); }
    L.push({id: 'tpmBuilds', g: 'Builds', label: 'My builds\u2026', why: has('openTeleportMenu') ? '' : 'Not ready', go: () => openTeleportMenu()});
    const seen = new Set(); return L.filter(e => !seen.has(e.id) && seen.add(e.id)); };
  function render() { const box = $('tpmBox'); if (!box) return; U.renders++;
    const back = () => { box.style.display = 'none'; const bt = document.querySelector('#pause .btns'); if (bt) bt.style.display = ''; try { navRefresh(); } catch (_) {} };
    box.textContent = ''; const h = document.createElement('div'); h.textContent = 'Teleport'; h.className = 'ui22h'; box.appendChild(h); let g0 = '';
    for (const e of U.list()) { if (e.g !== g0) { g0 = e.g; const s = document.createElement('div'); s.className = 'ui22g'; s.textContent = e.g; box.appendChild(s); }
      const b = document.createElement('button'); b.className = 'btn'; b.id = e.id; b.setAttribute('data-testid', e.id); b.textContent = e.label + (e.why ? ' \u2014 ' + e.why : '');
      if (e.why) { b.disabled = true; b.setAttribute('aria-disabled', 'true'); }
      b.addEventListener('click', ev => { ev.preventDefault(); if (b.disabled || b.__busy) return; b.__busy = 1; back(); U.tp++; try { e.go(); } catch (er) { ERR('go ' + e.id, er); } setTimeout(() => { b.__busy = 0; }, 600); });
      box.appendChild(b); }
    const bk = document.createElement('button'); bk.className = 'btn small'; bk.id = 'tpmBack'; bk.setAttribute('data-testid', 'tpmBack'); bk.textContent = 'Back'; bk.addEventListener('click', ev => { ev.preventDefault(); back(); }); box.appendChild(bk); }
  U.render = render;
  document.addEventListener('click', e => { const t = e.target && e.target.closest && e.target.closest('#tpmBtn'); if (t) try { render(); } catch (er) { ERR('render', er); } }, true);
  // the separate teleport buttons now live in the one list (kept hidden so their own code still runs)
  const hideOld = () => { for (const b of [$('tpUniBtn'), $('teleportBuildsBtn'), ...clan()]) if (b && b.style.display !== 'none') b.style.display = 'none'; };
  // ---------- settings look ----------
  try { const st = document.createElement('style'); st.id = 'ui1222css';
    st.textContent = '#pause .panel{font-size:14px}#pause label.set>span,#pause div.set>span{font-size:13px;line-height:1.3}#pause .btn{font-size:14px;min-height:44px}' +
      '#setTabs button{font-size:13px!important}#pause .seg button{font-size:13px;min-height:44px;min-width:56px}' +
      '#pause .seg button.on{background:#fff!important;color:#0b0b0b!important;border:2px solid #fff!important;font-weight:800!important;box-shadow:0 0 0 2px #0b0b0b inset!important}' +
      '#pause .seg button.on::before{content:"\\2713  "}#pause .seg button:not(.on){background:#121417!important;color:#8d949c!important;border:2px solid #3a3f45!important;font-weight:600}' +
      '#pause button:focus-visible,#pause button.focus,#ui22ask button:focus-visible{outline:3px solid #ffd84a!important;outline-offset:2px}' +
      '#tpmBox .ui22h{font-weight:800;text-align:center;font-size:16px}#tpmBox .ui22g{font-size:12px;opacity:.75;margin:6px 2px 0;text-transform:uppercase;letter-spacing:.06em}#tpmBox .btn[disabled]{opacity:.5}' +
      '#ui22row{display:flex;gap:8px;align-items:stretch;min-height:0}#ui22row>#charView{flex:1 1 auto}#ui22off{display:flex;flex-direction:column;gap:8px;width:96px}';
    document.head.appendChild(st); } catch (e) { ERR('css', e); }
  U.aria = () => { for (const b of document.querySelectorAll('#pause .seg button')) { const v = b.classList.contains('on') ? 'true' : 'false'; if (b.getAttribute('aria-pressed') !== v) { b.setAttribute('aria-pressed', v); U.ariaN++; } } };
  try { new MutationObserver(() => U.aria()).observe(document.body, {subtree: true, attributes: true, attributeFilter: ['class']}); } catch (e) { ERR('mo', e); }
  // ---------- offhand on the right ----------
  U.lay = () => { const tab = $('charTab'), cv = $('charView'), ar = $('armour'), off = document.querySelector('[data-testid="armour-slot-offhand"]'); if (!tab || !cv || !ar) return false;
    let row = $('ui22row'); if (!row) { row = document.createElement('div'); row.id = 'ui22row'; tab.insertBefore(row, tab.firstChild); }
    if (ar.parentNode !== row || row.firstChild !== ar) row.insertBefore(ar, row.firstChild); if (cv.parentNode !== row) row.insertBefore(cv, ar.nextSibling);
    let oc = $('ui22off'); if (!oc) { oc = document.createElement('div'); oc.id = 'ui22off'; row.appendChild(oc); } if (off && off.parentNode !== oc) oc.appendChild(off); return !!off; };
  // ---------- in game "are you sure" for Save and quit ----------
  let ask = null, pass = 0, aF = 0, prevFocus = null;
  function mkAsk() { if (ask) return ask; ask = document.createElement('div'); ask.id = 'ui22ask'; ask.setAttribute('role', 'dialog'); ask.setAttribute('aria-modal', 'true'); ask.setAttribute('aria-labelledby', 'ui22askH'); ask.setAttribute('data-testid', 'quit-confirm');
    ask.style.cssText = 'position:fixed;inset:0;z-index:9001;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.6)';
    ask.innerHTML = '<div class="panel" style="max-width:400px;text-align:center"><h2 id="ui22askH" style="margin:0 0 10px;font-size:18px">Save and quit?</h2><p style="margin:0 0 16px;font-size:14px">Your world is saved first, then you go back to the title screen.</p>' +
      '<div style="display:flex;gap:10px;justify-content:center"><button class="btn" id="ui22no" data-testid="quit-cancel">Cancel</button><button class="btn alt" id="ui22yes" data-testid="quit-yes" style="background:#b3261e;color:#fff">Save and quit</button></div></div>';
    document.body.appendChild(ask);
    ask.querySelector('#ui22no').addEventListener('click', e => { e.preventDefault(); U.closeAsk(); });
    ask.querySelector('#ui22yes').addEventListener('click', e => { e.preventDefault(); if (pass) return; pass = 1; setTimeout(() => { pass = 0; }, 3000); U.closeAsk(true); U.quits++; const q = $('saveQuit'); if (q) q.click(); });
    return ask; }
  U.open = () => !!(ask && ask.style.display === 'flex');
  U.openAsk = () => { mkAsk(); if (U.open()) return; pass = 0; prevFocus = document.activeElement; ask.style.display = 'flex'; aF = 0; U.asks++; try { $('ui22no').focus(); } catch (_) {} };
  U.closeAsk = keep => { if (!ask) return; ask.style.display = 'none'; if (!keep) { try { prevFocus && prevFocus.focus && prevFocus.focus(); } catch (_) {} } };
  window.addEventListener('click', e => { const t = e.target && e.target.closest && e.target.closest('#saveQuit'); if (!t || pass) return; e.stopImmediatePropagation(); e.preventDefault(); U.openAsk(); }, true);
  window.addEventListener('keydown', e => { if (!U.open()) return; const bs = [$('ui22no'), $('ui22yes')];
    if (e.key === 'Escape') { U.closeAsk(); } else if (/^(ArrowLeft|ArrowRight|Tab)$/.test(e.key)) { aF = (aF + 1) % 2; bs[aF].focus(); } else if (e.key === 'Enter' || e.key === ' ') { (document.activeElement && bs.includes(document.activeElement) ? document.activeElement : bs[aF]).click(); } else return;
    e.preventDefault(); e.stopImmediatePropagation(); }, true);
  try { const pp = padPause; padPause = function (dir, adj, act, back) { if (!U.open()) return pp.apply(this, arguments); const bs = [$('ui22no'), $('ui22yes')]; if (dir || adj) { aF = (aF + 1) % 2; bs[aF].focus(); } if (act) bs[aF].click(); if (back) U.closeAsk(); }; } catch (e) { ERR('pad', e); }
  try { const sp = setPause; setPause = function (on) { if (U.open() && !on) { U.closeAsk(); return; } return sp.apply(this, arguments); }; } catch (e) { ERR('sp', e); }
  setInterval(() => { try { hideOld(); U.lay(); U.aria(); } catch (e) { ERR('tick', e); } }, 700);
})();
