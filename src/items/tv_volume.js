// GLX-TVV v1.1.61: the TV is much louder by default (full gain, bigger refDistance, slower rolloff) and has its own TV volume slider in Settings, saved and applied live.
(function () {
  const U = window.__tvv = {n: 0, err: null};
  try { if (!(SET.tvv >= 0 && SET.tvv <= 3)) SET.tvv = 1; } catch (_) {}
  const BOOST = 2.5;
  function tune() { try { if (tvPanner && !tvPanner.__tvv) { tvPanner.refDistance = 6; tvPanner.rolloffFactor = 0.5; tvPanner.maxDistance = 40; tvPanner.__tvv = 1; } } catch (_) {} }
  function fadeAt() { try { const [x, y, z] = tvOnKey.split(',').map(Number), d = Math.hypot(x + .5 - P.x, y + .5 - P.y, z + .5 - P.z); return d <= 18 ? 1 : Math.max(0, 1 - (d - 18) / 14); } catch (_) { return 1; } }
  try {
    const up = updateTV; updateTV = function () { const r = up.apply(this, arguments);
      try { if (tvOnKey && tvGain) { tune(); const mute = Number(SET.sfx) === 0; tvGain.gain.value = mute ? 0 : SET.tvv * BOOST * fadeAt(); U.n++; U.g = tvGain.gain.value; } } catch (e) { U.err = String(e); }
      return r; };
  } catch (e) { U.err = String(e); }
  const fmt = v => Math.round(v * 100) + '%';
  try {
    const sfxRow = document.querySelector('label.set[data-k="sfx"]');
    if (sfxRow && !document.getElementById('tvVol')) {
      const row = document.createElement('label'); row.className = 'set'; row.dataset.k = 'tvv';
      row.innerHTML = '<span>TV volume<b id="tvVV"></b></span><input type="range" id="tvVol" min="0" max="3" step="0.05" data-testid="settings-tv-volume">';
      sfxRow.after(row);
      const inp = row.querySelector('input'); inp.value = SET.tvv; document.getElementById('tvVV').textContent = fmt(SET.tvv);
      inp.addEventListener('input', () => { SET.tvv = Number(inp.value); document.getElementById('tvVV').textContent = fmt(SET.tvv); saveSet(); });
    }
  } catch (e) { U.err = String(e); }
  try { const su = syncSettingsUI; syncSettingsUI = function () { const r = su.apply(this, arguments);
    try { const i = document.getElementById('tvVol'); if (i) { i.value = SET.tvv; document.getElementById('tvVV').textContent = fmt(SET.tvv); } } catch (_) {} return r; }; } catch (_) {}
})();
