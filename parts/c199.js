/* ===================== GLX-C199 (v1.0.38): iron is silver everywhere the player can see it - recipe names + hints, item names, messages
   (ids stay the same so saves keep working; recipes take silver ingots). Non-oak doors in the hand use their own wood's door texture ===================== */
(function c199() {
  const U = window.__c199 = {err: [], renamed: 0, conv: 0, doors: 0};
  const warn = (w, e) => { U.err.push(w + ' ' + String(e && e.message || e)); console.warn('c199', w, e); };
  const SILV = (typeof IT !== 'undefined' && IT.SILVERINGOT) || 183, RAWS = (typeof IT !== 'undefined' && IT.RAWSILVER) || 182;
  // Iron -> Silver, but leave the Iron Brew drink (a pun on the Scottish soft drink) and the Ironjaw mob alone
  const fix = s => typeof s !== 'string' ? s : s.replace(/\ban iron\b/g, 'a silver').replace(/\bAn iron\b/g, 'A silver')
    .replace(/\bIron(?! Brew)(?!jaw)\b/g, 'Silver').replace(/\biron(?! brew)\b/g, 'silver').replace(/\bIRON\b/g, 'SILVER');
  U.fix = fix;
  // '3 Silver ingots + 1 Silver ingot' -> '4 Silver ingots'
  const merge = h => { if (typeof h !== 'string') return h; h = h.replace(/\b1 Silver ingots\b/g, '1 Silver ingot'); if ((h.match(/Silver ingot/g) || []).length < 2) return h; let n = 0, at = -1; const parts = h.split(/\s*\+\s*/), out = [];
    for (const p of parts) { const q = /^(\d+) Silver ingots?$/.exec(p); if (q) { n += +q[1]; if (at < 0) { at = out.length; out.push(''); } } else out.push(p); }
    if (at >= 0) out[at] = n + ' Silver ingot' + (n === 1 ? '' : 's'); return out.join(' + '); };
  function fixNames() { try { for (const k in NAMES) { const v = NAMES[k], n = fix(v); if (n !== v) { NAMES[k] = n; U.renamed++; } }
    if (NAMES[74]) NAMES[74] = 'Block of silver'; } catch (e) { warn('names', e); } }
  fixNames();
  // names that something resets later (world load) stay silver
  try { for (const k of [54, 74, 80, 92, 93, 95, 102, 108, 109, 110, 111, 163, 176, 225]) { let v = fix(NAMES[k]); if (k === 74) v = 'Block of silver';
      Object.defineProperty(NAMES, k, {get: () => v, set: n => { v = k === 74 ? 'Block of silver' : fix(n); }, enumerable: true, configurable: true}); } } catch (e) { warn('lock', e); }
  function fixRecipes() { try { for (const r of RECIPES) { if (!r) continue;
      if (Array.isArray(r.need)) r.need = r.need.map(q => q && q[0] === 80 ? (U.conv++, [SILV, q[1]]) : q && q[0] === 54 ? (U.conv++, [RAWS, q[1]]) : q);
      if (r.out === 80) r.out = SILV;
      if (Array.isArray(r.need)) { const m = new Map(); for (const q of r.need) if (q) m.set(q[0], (m.get(q[0]) || 0) + q[1]); if (m.size < r.need.length) r.need = [...m].map(([i, c]) => [i, c]); }
      const a = fix(r.name), b = merge(fix(r.hint)); if (a !== r.name || b !== r.hint) { r.name = a; r.hint = b; U.renamed++; } } } catch (e) { warn('recipes', e); } }
  const all = () => { fixNames(); fixRecipes(); }; U.fixRecipes = all; all(); setTimeout(all, 1200); setTimeout(all, 5000); setTimeout(all, 15000);
  try { if (typeof SMELT !== 'undefined' && SMELT[RAWS] !== SILV) SMELT[RAWS] = SILV; } catch (_) {}
  // messages (toasts, hints) that still say iron
  try { const t0 = toast; toast = function (m) { if (typeof m === 'string') arguments[0] = fix(m); return t0.apply(this, arguments); }; } catch (e) { warn('toast', e); }
  // held non-oak doors: front + back show that wood's own door design, edges its planks
  try { const mi = makeItemMesh; makeItemMesh = function (id) { const g = mi.apply(this, arguments);
      try { const w = id - 620; const C = window.__c121; if (w >= 1 && w <= 7 && g && g.userData && g.userData.c198 === 'door' && C && C.doorMat) {
          const dm = C.doorMat(w); let pm = C.PLMAT && C.PLMAT[w]; if (Array.isArray(pm)) pm = pm[0];
          if (dm) { const mats = [pm || dm, pm || dm, pm || dm, pm || dm, dm, dm]; g.traverse(o => { if (o.isMesh) o.material = mats; }); U.doors++; } } } catch (e) { warn('door' + id, e); }
      return g; }; } catch (e) { warn('wrap', e); }
  try { setTimeout(() => { try { if (typeof heldId !== 'undefined' && typeof selId !== 'undefined') { heldId = -1; setHeld(selId); } } catch (_) {} }, 1700); } catch (_) {}
})();
