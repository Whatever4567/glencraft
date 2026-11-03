/* GLX-C338 (v1.1.40): GOD MODE. A switch in the pause menu settings. When it is on nothing can hurt you: no fall, mob, lava, fire, void,
   drowning or hunger damage, and your health and food stay full. Saved with your settings. */
(function c338() {
  const U = window.__c338 = {err: null, saved: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const on = U.on = () => !!SET.god;
  try { const h0 = hurt; hurt = function () { if (on()) return; return h0.apply(this, arguments); }; } catch (e) { ERR('hurt', e); }
  try { const d0 = die; die = function () { if (on()) { hp = 20; U.saved++; return; } return d0.apply(this, arguments); }; } catch (e) { ERR('die', e); }
  setInterval(() => { try { if (!on() || !started || dead) return; if (hp < 20) hp = 20; if (food < 20) food = 20; if (sat < 5) sat = 5; exh = 0; starveT = 0;
      try { if (typeof air === 'number') air = 300; } catch (_) {} try { if (P.fallTop !== undefined) P.fallTop = null; } catch (_) {} try { if (typeof updateHUD === 'function') updateHUD(); } catch (_) {} } catch (e) { ERR('tick', e); } }, 100);
  function row() { const bob = document.getElementById('bobSeg'); if (!bob || document.getElementById('godSeg')) return !!bob;
    const d = document.createElement('div'); d.className = 'set inline'; d.innerHTML = '<span>God mode</span><div class="seg" id="godSeg"><button data-god="1" data-testid="settings-god-on">On</button><button data-god="0" data-testid="settings-god-off">Off</button></div>';
    bob.parentNode.after(d); const sync = () => d.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.god) === (SET.god ? 1 : 0)));
    d.querySelectorAll('button').forEach(b => b.addEventListener('click', e => { e.preventDefault(); SET.god = Number(b.dataset.god) ? 1 : 0; saveSet(); sync(); try { toast(SET.god ? 'God mode on' : 'God mode off'); } catch (_) {} })); sync(); return true; }
  if (!row()) { const iv = setInterval(() => { if (row()) clearInterval(iv); }, 1000); }
})();
