/* GLX-C271 (v1.0.87): a world must always start. If entering a saved world throws, the error is kept (glen_starterr) and the other
   saved copy (browser database vs. local storage) is tried; the save itself is never wiped or overwritten here. */
(function () {
  const U = window.__c271 = {err: null, fails: 0, retry: 0};
  try { const pw = playWorld; playWorld = async function (w) {
    try { return await pw.apply(this, arguments); } catch (e) { U.fails++; U.err = String(e && e.stack || e).slice(0, 600); try { localStorage.setItem('glen_starterr', U.err); } catch (_) {} }
    try { let d = null, l = null; try { d = await idbGet('worlds', w.id); } catch (_) {} try { l = JSON.parse(localStorage.getItem('glen_w_' + w.id) || 'null'); } catch (_) {}
      for (const c of [d, l]) { if (!c || !c.world) continue; try { U.retry++; current = {id: w.id, name: w.name, mode: c.mode || w.mode, created: w.created}; enterWorld(c); return; } catch (e2) { U.err2 = String(e2).slice(0, 400); } }
    } catch (_) {} try { toast('That world hit a snag starting - your save is kept safe'); } catch (_) {} }; } catch (e) { U.err = String(e); }
  try { const ew = enterWorld; enterWorld = function (save) { try { return ew.apply(this, arguments); } catch (e) { U.fails++; U.err = String(e && e.stack || e).slice(0, 600); try { localStorage.setItem('glen_starterr', U.err); } catch (_) {} console.error('c271 enterWorld', e);
      if (started) return; throw e; } }; } catch (e) { U.err = String(e); }
})();
