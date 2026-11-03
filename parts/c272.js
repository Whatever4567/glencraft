/* GLX-C272 (v1.0.88): worlds that will not start. (1) If a world has no readable save (lost during a reset cut short before v1.0.88),
   its newest backup in the browser database is loaded; with none, a box explains it and offers Rebuild world (same name, a new glen).
   (2) If a start fails or hangs for 15 s a small box shows the error text. (3) Each world gets a Repair button that clears stuck
   loading / reset flags and overlays - it never touches blocks or inventory. */
(function () {
  const U = window.__c272 = {err: null, recovered: 0, box: 0, repaired: 0};
  function box(title, txt, w, rebuild) { try { let b = document.getElementById('c272box'); if (b) b.remove(); b = document.createElement('div'); b.id = 'c272box'; U.box++;
    b.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483600;max-width:min(92vw,560px);background:#1c120a;border:2px solid #e0a548;border-radius:12px;padding:14px 16px;color:#f3ead0;font:14px/1.4 system-ui,sans-serif;box-shadow:0 8px 40px #000';
    b.innerHTML = '<b style="font-size:16px"></b><div style="margin:8px 0;white-space:pre-wrap;word-break:break-word;font-size:12px;opacity:.9"></div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end"></div>';
    b.children[0].textContent = title; b.children[1].textContent = txt; const row = b.children[2];
    const btn = (t, id, fn) => { const x = document.createElement('button'); x.className = 'btn'; x.textContent = t; x.id = id; x.onclick = fn; row.appendChild(x); };
    /* v1.0.93: no Rebuild world button */
    btn('Close', 'c272close', () => b.remove()); document.body.appendChild(b); } catch (e) { U.err = String(e); } }
  U.box = box;
  const errTxt = () => { const a = []; try { const ld = JSON.parse(localStorage.getItem('glen_load') || 'null'); if (ld) a.push('step: ' + ld.step + ' (' + ld.v + ')'); } catch (_) {} if (window.__loadErrTxt) a.push(window.__loadErrTxt); if (window.__loadErr) a.push(String(window.__loadErr).slice(0, 300)); if (window.__c271 && __c271.err) a.push(__c271.err); return a.join('\n') || 'no error text - it got stuck at: ' + (window.__loadStepName || '?'); };
  async function backup(id) { try { const keys = await idbDo('worlds', 'readonly', o => o.getAllKeys()); const ks = (keys || []).filter(k => typeof k === 'string' && k.indexOf('backup_' + id + '_') === 0).sort((a, b) => parseInt(b.split('_').pop(), 36) - parseInt(a.split('_').pop(), 36));
    for (const k of ks) { const d = await idbGet('worlds', k); if (d && d.world) return d; } } catch (e) { U.err = String(e); } return null; }
  function repair() { try { for (const k of ['glen_load', 'glen_safe', 'glen_starterr']) localStorage.removeItem(k); } catch (_) {} try { const o = document.getElementById('c263ov'); if (o) o.remove(); if (window.__c263) __c263.busy = 0; if (window.__c105 && __c105.phase) __c105.phase = null; window.__safeLoad = 0; window.__loadErrTxt = ''; } catch (_) {} U.repaired++; }
  U.repair = repair;
  // v1.0.89 (t560u): a missing or broken save starts a fresh new world in the same slot (same name), no prompt. Old backups stay in the browser untouched.
  const TW = w => !!w && w.name === 'Test World';
  function fresh(w, why) { try { repair(); const b = document.getElementById('c272box'); if (b) b.remove(); localStorage.removeItem('glen_bagG_' + w.id); U.fresh = (U.fresh || 0) + 1; U.freshWhy = why;
      current = {id: w.id, name: w.name, mode: w.mode || 'survival', created: Date.now()}; enterWorld(null); setTimeout(() => { try { if (started) { saveWorld(true); toast('Started a fresh ' + (w.name || 'world') + ' (the old save ' + why + ')'); } } catch (_) {} }, 8000); } catch (e) { U.err = 'fresh ' + e; } }
  U.fresh = 0; U.freshFn = fresh;
  try { const pw = playWorld; playWorld = async function (w) {
    let d = null, l = null; try { d = await idbGet('worlds', w.id); } catch (_) {} try { l = JSON.parse(localStorage.getItem('glen_w_' + w.id) || 'null'); } catch (_) {}
    if (!(d && d.world) && !(l && l.world)) { fresh(w, 'had no save'); return; }
    const t0 = Date.now(); let r; try { r = pw.apply(this, arguments); if (r && r.catch) r = r.catch(e => { if (TW(w)) fresh(w, 'save would not load'); else throw e; }); } catch (e) { if (TW(w)) { fresh(w, 'save would not load'); return; } throw e; }
    setTimeout(function chk() { try { if (typeof started !== 'undefined' && started) return; if (screen === 'loading' || Date.now() - t0 < 16000) { if (Date.now() - t0 >= 15000 && !document.getElementById('c272box')) box('The world is taking too long to start', errTxt() + '\nTake a screenshot of this box and send it.', w, 0); if (screen === 'loading') setTimeout(chk, 2000); } else if (!started && screen !== 'loading') { if (TW(w)) fresh(w, 'save would not start'); else box('The world did not start', errTxt(), w, 0); } } catch (_) {} }, 15000);
    return r; }; } catch (e) { U.err = String(e); }
  // v1.0.93: the Repair world button is gone (repair() still runs quietly before a fresh start)
})();
