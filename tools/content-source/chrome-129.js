/* GLX-V129 (v1.2.9): Chrome Mode setting replaces the revisit portal (unlocked by the abduction encounter, per world);
   the player's own UFO can no longer be flown. The abduction encounter itself is unchanged. */
(function v129() {
  const U = window.__v129 = {err: null, chrome: 0, ufoBlocked: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const Y = () => window.__y24p, C = () => window.__c248;
  const unlocked = () => { try { return !!(Y() && (Y().unlocked || (Y().met && Y().met()))); } catch (_) { return false; } };
  const inside = () => !!(C() && C().y === 1);
  U.on = () => { try { if (!started || dead || DIM.cur || inside() || !unlocked()) return false; Y().cd = 0; return !!Y().enter(); } catch (e) { ERR('on', e); return false; } };
  U.off = () => { try { if (!inside()) return true; Y().cd = 0; if (Y().exit()) return true; C().stop24(); return true; } catch (e) { ERR('off', e); try { C().stop24(); } catch (_) {} return false; } };
  U.ui = () => { const ts = document.getElementById('touchSeg'); if (!ts) return false; if (document.getElementById('chromeSeg')) return true; const row = ts.closest('.set') || ts.parentNode;
    const d = document.createElement('div'); d.className = 'set inline'; d.innerHTML = '<span>Chrome mode <small id="chromeLock"></small></span><div class="seg" id="chromeSeg"><button data-v="1" data-testid="settings-chromeSeg-1">On</button><button data-v="0" data-testid="settings-chromeSeg-0">Off</button></div>';
    row.after(d); U.sync = () => { const lk = document.getElementById('chromeLock'); if (lk) lk.textContent = unlocked() ? '' : '(locked - meet the visitor first)'; d.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === (SET.chrome ? 1 : 0))); };
    d.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { const v = Number(b.dataset.v) === 1;
      if (v && !unlocked()) { try { toast('Chrome mode unlocks after you meet the visitor'); } catch (_) {} U.sync(); return; }
      SET.chrome = v; saveSet(); if (v) U.on(); else U.off(); U.sync(); })); U.sync(); return true; };
  { let t = 0; const iv = setInterval(() => { try { if (U.ui() || ++t > 60) clearInterval(iv); } catch (e) { ERR('ui', e); clearInterval(iv); } }, 500); }
  // persisted: re-enter chrome after a world loads if the setting is on and this world has unlocked it; Off always leaves
  try { const ew = enterWorld; enterWorld = function () { const r = ew.apply(this, arguments); try { setTimeout(() => { try { if (SET.chrome && unlocked()) U.on(); if (U.sync) U.sync(); } catch (_) {} }, 2500); } catch (_) {} return r; }; } catch (e) { ERR('ew', e); }
  // ---- player UFO: no flying. Leave it if somehow already flying; hide the Fly button. ----
  const boot = setInterval(() => { try { const u = window.__c309; if (!u) return; clearInterval(boot);
      u.board = () => { U.ufoBlocked++; return false; };
      setInterval(() => { try { if (u.on && u.exit) u.exit(); for (const b of document.querySelectorAll('button')) if (b.textContent === 'Fly UFO' && b.style.display !== 'none') b.style.display = 'none'; } catch (_) {} }, 1000);
    } catch (e) { ERR('ufo', e); clearInterval(boot); } }, 500);
})();
