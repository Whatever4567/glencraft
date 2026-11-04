/* GLX-TPM (v1.1.86): A TELEPORT BUTTON YOU CAN FIND. Pause the game (the pause button on a phone, Start or Menu on a controller,
   Esc on a keyboard) and press Teleport, right under Resume. It opens a small list:
   - North Scotland cave entrance: the hills on the north coast, at the mouth of the spiral cave that leads down the tunnel to Agartha.
   - Agartha: straight into the crystal city under Scotland, where the saucer sleeps.
   - Back. Works with touch, mouse and the controller (the buttons are normal menu buttons). */
(function tpm() {
  const U = window.__tpm = {err: null, used: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const $ = id => document.getElementById(id);
  const close = () => { try { setPause(false); } catch (_) {} };
  async function toIsland() { try { if (window.__agw && __agw.toMouth()) { close(); U.used++; } } catch (e) { ERR('isl', e); } }
  async function toTube() { try { if (window.__agw && __agw.toCity()) { close(); U.used++; } } catch (e) { ERR('tube', e); } }
  U.toIsland = toIsland; U.toTube = toTube;
  const mk = (id, txt, fn, small) => { const b = document.createElement('button'); b.id = id; b.className = small ? 'btn small' : 'btn'; b.textContent = txt; b.setAttribute('data-testid', id);
    b.addEventListener('click', e => { e.preventDefault(); fn(); }); return b; };
  function add() { const pz = $('pause'), pn = pz && pz.querySelector('.panel'), btns = pn && pn.querySelector('.btns'), res = $('resumeBtn'); if (!btns || !res) return; if ($('tpmBtn')) return;
    const box = document.createElement('div'); box.id = 'tpmBox'; box.style.cssText = 'display:none;flex-direction:column;gap:8px;margin:8px 0';
    const t = document.createElement('div'); t.textContent = 'Teleport'; t.style.cssText = 'font-weight:bold;text-align:center;font-size:1.1em'; box.appendChild(t);
    const back = () => { box.style.display = 'none'; btns.style.display = ''; try { navRefresh(); } catch (_) {} };
    box.appendChild(mk('tpmIsland', 'North Scotland cave to Agartha', () => { back(); toIsland(); }));
    box.appendChild(mk('tpmTube', 'Agartha (crystal city)', () => { back(); toTube(); }));
    box.appendChild(mk('tpmBack', 'Back', back, true));
    btns.after(box);
    const b = mk('tpmBtn', 'Teleport', () => { btns.style.display = 'none'; box.style.display = 'flex'; try { navRefresh(); } catch (_) {} try { $('tpmIsland').focus(); } catch (_) {} });
    res.after(b); }
  setInterval(() => { try { add(); } catch (e) { ERR('add', e); } }, 800);
  try { const sp = setPause; setPause = function (on) { const r = sp.apply(this, arguments); try { if (on) { add(); const bx = $('tpmBox'); if (bx && bx.style.display !== 'none') { bx.style.display = 'none'; const bt = document.querySelector('#pause .btns'); if (bt) bt.style.display = ''; } } } catch (e) { ERR('sp', e); } return r; }; } catch (e) { ERR('wrap', e); }
})();
