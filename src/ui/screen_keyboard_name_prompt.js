/* ===================== GLX-C178 (v1.0.34): on-screen keyboard name prompt, template list, ghost preview + placing (TEMPLATE tool) ===================== */
// TEMPLATE: LT opens the list of saved templates (Use / Delete with a Yes-No check). The chosen one follows your aim as a blue ghost,
// LB / RB turn it, RT places it (a slice of blocks per frame), B puts it away. Placing never replaces anything you built yourself.
(function c178() {
  const U = window.__c178 = {err: null, tpl: null, rot: 0, job: null, open: null, placed: 0};
  const C = () => window.__c177;
  const st = document.createElement('style');
  st.textContent = '#tplUI{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);font:600 15px system-ui,sans-serif;color:#fff}' +
    '#tplUI .pn{background:#1d2a22;border:2px solid #5d8a6a;border-radius:12px;padding:14px;max-width:94vw;max-height:88vh;overflow:auto;box-shadow:0 6px 30px #000}' +
    '#tplUI h3{margin:0 0 10px;font-size:17px}#tplUI .fld{background:#0d1510;border:1px solid #5d8a6a;border-radius:8px;padding:8px 10px;min-height:22px;margin-bottom:10px;font-size:18px;letter-spacing:.5px}' +
    '#tplUI .row{display:flex;gap:5px;justify-content:center;margin:4px 0}#tplUI button{background:#33473a;color:#fff;border:2px solid transparent;border-radius:7px;padding:8px 10px;min-width:36px;font:600 15px system-ui,sans-serif}' +
    '#tplUI button.focus{border-color:#ffd54a;background:#4f6b57}#tplUI .li{display:flex;align-items:center;gap:8px;margin:4px 0}#tplUI .li span{flex:1;min-width:150px}#tplUI .sm{opacity:.7;font-size:12px}';
  document.head.appendChild(st);
  let ui = null, focus = 0, padNav = null;
  const btns = () => ui ? [...ui.querySelectorAll('button')] : [];
  function refocus() { const b = btns(); if (!b.length) return; focus = Math.max(0, Math.min(focus, b.length - 1)); b.forEach((e, i) => e.classList.toggle('focus', i === focus)); try { b[focus].scrollIntoView({block: 'nearest'}); } catch (_) {} }
  function show(html, kind, nav) { close(true); ui = document.createElement('div'); ui.id = 'tplUI'; ui.dataset.testid = 'template-ui'; ui.innerHTML = '<div class="pn">' + html + '</div>'; document.body.appendChild(ui);
    U.open = kind; padNav = nav || null; focus = 0; menuOpen = true; attackMouse = attackPad = attackTouch = false; try { if (document.pointerLockElement) document.exitPointerLock(); } catch (_) {} refocus(); return ui; }
  function close(keepMenu) { if (ui) { ui.remove(); ui = null; } const was = U.open; U.open = null; padNav = null; if (was && !keepMenu) { try { openMenu(false); } catch (_) { menuOpen = false; } } }
  U.close = close;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
  // ---- name prompt with an on-screen keyboard ----
  const ROWS = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM-'];
  U.prompt = function (title, def, cb) { let txt = '', caps = true; const done = v => { close(); try { cb(v); } catch (e) { U.err = 'cb ' + e; } };
    const keys = ROWS.map(r => '<div class="row">' + [...r].map(k => '<button data-k="' + k + '">' + k + '</button>').join('') + '</div>').join('') +
      '<div class="row"><button data-k="caps">Aa</button><button data-k=" " style="min-width:120px">Space</button><button data-k="bs">&#9003;</button></div><div class="row"><button data-k="cancel">Cancel</button><button data-k="ok" style="min-width:90px">Save</button></div>';
    show('<h3>' + esc(title) + '</h3><div class="fld" data-testid="template-name"></div>' + keys + '<div class="sm">A types - X deletes - B cancels - Menu saves</div>', 'prompt', null);
    const fld = ui.querySelector('.fld'), draw = () => { fld.textContent = txt || ''; fld.style.opacity = txt ? 1 : .5; if (!txt) fld.textContent = def; for (const b of btns()) if (b.dataset.k && b.dataset.k.length === 1 && /[A-Z]/i.test(b.dataset.k)) b.textContent = caps ? b.dataset.k.toUpperCase() : b.dataset.k.toLowerCase(); };
    const press = k => { if (k === 'ok') return done(txt.trim() || def); if (k === 'cancel') return done(null); if (k === 'bs') txt = txt.slice(0, -1); else if (k === 'caps') caps = !caps;
      else if (txt.length < 24) { txt += /[A-Z]/i.test(k) ? (caps ? k.toUpperCase() : k.toLowerCase()) : k; if (caps && txt.length === 1) caps = false; } draw(); };
    for (const b of btns()) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); focus = btns().indexOf(b); refocus(); press(b.dataset.k); });
    U.key = e => { if (e.key === 'Enter') press('ok'); else if (e.key === 'Escape') press('cancel'); else if (e.key === 'Backspace') press('bs'); else if (e.key.length === 1 && /[a-z0-9 \-]/i.test(e.key)) { if (txt.length < 24) txt += e.key; draw(); } };
    U.padX = () => press('bs'); U.padB = () => press('cancel'); U.padStart = () => press('ok'); U.padA = () => { const b = btns()[focus]; if (b) press(b.dataset.k); };
    draw(); };
  // grid-ish D-pad movement: left/right within a row, up/down to the nearest button in the next row
  function move(dx, dy) { const b = btns(); if (!b.length) return; const cur = b[focus].getBoundingClientRect(); if (dx) { focus = (focus + dx + b.length) % b.length; refocus(); return; }
    let best = -1, bd = 1e9; b.forEach((e, i) => { const r = e.getBoundingClientRect(); const vy = (r.top - cur.top) * dy; if (vy <= 4) return; const d = vy * 3 + Math.abs(r.left + r.width / 2 - cur.left - cur.width / 2); if (d < bd) { bd = d; best = i; } });
    if (best >= 0) { focus = best; refocus(); } }
  // ---- template list ----
  U.list = async function () { let all = []; try { all = await C().all(); } catch (e) { U.err = 'list ' + e; }
    const rows = all.length ? all.map((r, i) => '<div class="li"><span>' + esc(r.name) + ' <span class="sm">' + r.w + 'x' + r.h + 'x' + r.d + ', ' + r.n + ' blocks</span></span><button data-u="' + i + '">Use</button><button data-x="' + i + '">Delete</button></div>').join('') : '<div class="sm" style="margin:10px 0">No templates yet - save one with the Copy tool.</div>';
    show('<h3>Templates</h3>' + rows + '<div class="row"><button data-c="1">Close</button></div><div class="sm">Saved on this device for every world</div>', 'list', null);
    const pick = b => { if (b.dataset.c) return close(); if (b.dataset.u !== undefined) { const r = all[+b.dataset.u]; close(); U.use(r); return; }
      if (b.dataset.x !== undefined) { const r = all[+b.dataset.x]; show('<h3>Delete "' + esc(r.name) + '"?</h3><div class="row"><button data-y="1">Yes, delete</button><button data-n="1">No</button></div>', 'confirm', null);
        focus = 1; refocus(); const yes = async () => { try { await C().del(r.name); toast('Deleted "' + r.name + '"'); if (U.tpl && U.tpl.name === r.name) U.tpl = null; } catch (_) {} U.list(); };
        for (const q of btns()) q.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (q.dataset.y) yes(); else U.list(); });
        U.padA = () => { const q = btns()[focus]; if (q && q.dataset.y) yes(); else U.list(); }; U.padB = () => U.list(); U.padX = null; U.padStart = null; U.key = e => { if (e.key === 'Escape') U.list(); else if (e.key === 'Enter') U.padA(); }; } };
    for (const b of btns()) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); pick(b); });
    U.padA = () => { const b = btns()[focus]; if (b) pick(b); }; U.padB = () => close(); U.padX = () => { const b = btns()[focus]; if (b && b.dataset.u !== undefined) pick(b.nextSibling); }; U.padStart = null;
    U.key = e => { if (e.key === 'Escape') close(); else if (e.key === 'Enter') U.padA(); }; };
  // controller + keyboard while a panel is open
  try { const mpi = menuPadInput; menuPadInput = function (E, axes, gp) { if (!U.open) return mpi.apply(this, arguments);
    if (E[1]) { U.padB && U.padB(); return; } if (E[0]) { U.padA && U.padA(); return; } if (E[2]) { U.padX && U.padX(); return; } if (E[9]) { U.padStart && U.padStart(); return; }
    if (E[12]) move(0, -1); else if (E[13]) move(0, 1); else if (E[14]) move(-1, 0); else if (E[15]) move(1, 0);
    const t = performance.now(); if (!U._st || t - U._st > 170) { const ax = gp && gp.axes ? gp.axes : [0, 0]; if (Math.abs(ax[0]) > .6) { move(Math.sign(ax[0]), 0); U._st = t; } else if (Math.abs(ax[1]) > .6) { move(0, Math.sign(ax[1])); U._st = t; } } }; } catch (e) { U.err = 'mpi ' + e; }
  try { const rp = readPad; readPad = function () { if (U.open && paused) { try { setPause(false); } catch (_) {} } return rp.apply(this, arguments); }; } catch (_) {}
  window.addEventListener('keydown', e => { if (!U.open) return; e.stopImmediatePropagation(); e.preventDefault(); try { U.key && U.key(e); } catch (er) { U.err = 'key ' + er; } }, true);
  try { const cp = closePanels; closePanels = function () { if (U.open) { if (ui) { ui.remove(); ui = null; } U.open = null; } return cp.apply(this, arguments); }; } catch (_) {}
})();
