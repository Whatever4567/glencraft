/* GLX-V127 (v1.2.7): Disable mobs setting (persisted in glen_set as SET.noMobs) and retired foods. */
(function v127() {
  const U = window.__v127 = {err: null, removed: 0, blocked: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  // ---- Disable mobs: no new spawns; existing mobs (only the mobs[] list) are removed with removeMob (disposes geometry/materials) ----
  try { const sm = spawnMob; spawnMob = function () { if (SET.noMobs) { U.blocked++; return null; } return sm.apply(this, arguments); }; } catch (e) { ERR('spawn', e); }
  U.sweep = () => { if (!SET.noMobs) return 0; let n = 0; for (const a of mobs.slice()) { if (a && a.kind === 'popstar') continue; try { removeMob(a); n++; } catch (e) { ERR('rm', e); const i = mobs.indexOf(a); if (i >= 0) mobs.splice(i, 1); } } U.removed += n; return n; };
  setInterval(() => { try { if (SET.noMobs && mobs.length) U.sweep(); } catch (e) { ERR('sweep', e); } }, 1000);
  U.ui = () => { const ts = document.getElementById('touchSeg'); if (!ts || document.getElementById('mobSeg')) return !!ts; const row = ts.closest('.set') || ts.parentNode;
    const d = document.createElement('div'); d.className = 'set inline'; d.innerHTML = '<span>Disable mobs</span><div class="seg" id="mobSeg"><button data-v="1" data-testid="settings-mobSeg-1">On</button><button data-v="0" data-testid="settings-mobSeg-0">Off</button></div>';
    row.after(d); const sync = () => d.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === (SET.noMobs ? 1 : 0)));
    d.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { SET.noMobs = Number(b.dataset.v) === 1; saveSet(); sync(); U.sweep(); })); sync(); return true; };
  { let t = 0; const iv = setInterval(() => { try { if (U.ui() || ++t > 60) clearInterval(iv); } catch (e) { ERR('ui', e); clearInterval(iv); } }, 500); }
  // ---- retired foods (ids kept for saves) ----
  const OFF = new Set([IT.POTATO, IT.TATTIES].filter(v => v != null)); U.off = OFF;
  const strip = () => { try { for (const L of [ORDER, typeof CREATIVE_ALL !== 'undefined' ? CREATIVE_ALL : null]) if (L) for (let i = L.length - 1; i >= 0; i--) if (OFF.has(L[i])) L.splice(i, 1);
      for (let i = RECIPES.length - 1; i >= 0; i--) { const r = RECIPES[i]; if (OFF.has(r.out) || (r.need || r.ing || []).some(q => OFF.has(Array.isArray(q) ? q[0] : q))) RECIPES.splice(i, 1); }
      for (const id of OFF) if (inv[id]) delete inv[id]; } catch (e) { ERR('strip', e); } };
  try { const ai = addItem; addItem = function (id) { if (OFF.has(id)) return; return ai.apply(this, arguments); }; } catch (e) { ERR('add', e); }
  try { const di = dropItem; dropItem = function (id) { if (OFF.has(id)) return; return di.apply(this, arguments); }; } catch (e) { ERR('drop', e); }
  U.strip = strip; strip(); { let t = 0; const iv = setInterval(() => { strip(); if (++t > 30) clearInterval(iv); }, 2000); }
})();
