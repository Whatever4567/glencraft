/* GLX-V1215 (v1.2.15): generation order fix for the Watcher bowl + cave link. GLX-C294 places the Agartha mouth inside generate()
   only when __g89() is already on; otherwise GLX-C307 places it a moment later for the same NEW world (ens() -> __c294.build(),
   only when there is no save). Before, the bowl saw "mouth not known" and was skipped for good. Now that skip is remembered for the
   freshly generated world only, and when __c294.build() finishes for that same world (no save loaded, home dimension) the bowl and
   link run once, with the same Agartha keep-out (fail closed if the mouth is still unknown). Loading any save clears the flag, so
   saves are never edited. No scheduler, surface, save-format or renderer change. */
(function v1215() {
  const U = window.__v1215 = {err: null, pending: false, late: 0, why: null};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  try { const g = generate; generate = function () { U.pending = false; const r = g.apply(this, arguments);
      try { const A = window.__v1212; U.pending = !!(A && !A.eye && !DIM.cur && !cityGen && H >= 40 && /not known/.test(A.why || '')); U.wid = current && current.id; } catch (e) { ERR('gen', e); } return r; }; } catch (e) { ERR('gw', e); }
  try { const ap = applySave; applySave = function () { U.pending = false; return ap.apply(this, arguments); }; } catch (e) { ERR('ap', e); }
  function late() { if (!U.pending) return; if (DIM.cur || (current && current.id) !== U.wid || !window.__c294 || !__c294.M) return; U.pending = false;
    const A = window.__v1212, L = window.__v1214; if (!A || !A.chamber) return; const e = A.chamber(); U.why = A.why || null;
    if (e) { try { if (L && L.build) { L.link = null; L.why = null; L.cells = 0; L.build(e); } } catch (x) { ERR('link', x); } U.late++; try { dirtyAll = true; } catch (_) {} } }
  const hook = () => { try { const C = window.__c294; if (!C || !C.build || C.build.__v1215) return !!(C && C.build); const b = C.build; C.build = function () { const r = b.apply(this, arguments); try { late(); } catch (x) { ERR('late', x); } return r; }; C.build.__v1215 = 1; return true; } catch (x) { ERR('hook', x); return true; } };
  if (!hook()) { const t = setInterval(() => { if (hook()) clearInterval(t); }, 250); }
})();
