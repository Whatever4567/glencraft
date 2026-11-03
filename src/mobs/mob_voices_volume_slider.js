/* ===================== GLX-C154 (v1.0.26): Mob voices volume - its own slider in Settings, saved; every mob call, idle noise, hurt and death cry goes through a mob bus under the effects volume ===================== */
(function c154() {
  const U = window.__c154 = {n: 0, err: null};
  if (!(SET.mob >= 0 && SET.mob <= 3)) SET.mob = 1;   // v1.0.37: the slider goes to 300%
  let bus = null, cbus = null; const MOBK = 1.6 * 2.6;   // v1.0.37: mob voices about 2.6x louder; creeper sounds go through a quieter sub-bus
  window.creepDst = () => { const b = dst(); if (!AC || !b || b === master) return b; if (!cbus) { cbus = AC.createGain(); cbus.gain.value = 0.42; cbus.connect(b); } return cbus; };
  // the mob bus sits after the effects master, so the effects slider still scales it and the mute still silences it
  function dst() { if (!AC || !master) return master; if (!bus) { bus = AC.createGain(); bus.gain.value = SET.mob * MOBK; let o = master; try { const c = AC.createDynamicsCompressor(); c.threshold.value = -10; c.knee.value = 8; c.ratio.value = 4; c.attack.value = 0.005; c.release.value = 0.2; c.connect(master); o = c; } catch (_) {} bus.connect(o); }   /* v1.0.29: louder voices, a soft limiter so 2x never clips */ return bus; }
  window.mobDst = dst;
  window.mobOut = function (vol, pan) { const m = master; try { master = dst(); return outNode(vol, pan); } finally { master = m; } };
  const KINDS = new Set(['growl', 'hiss', 'squeal', 'scream', 'baa', 'roar', 'groan', 'quack', 'chirp', 'oink', 'oink2', 'snort']);
  const isMob = k => typeof k === 'string' && (KINDS.has(k) || k.slice(0, 3) === 'nm:');
  const via = (fn) => function () { if (!AC || !master) return fn.apply(this, arguments); const m = master; try { master = dst(); U.n++; return fn.apply(this, arguments); } finally { master = m; } };
  const ps = playSound; const psMob = via(ps);
  playSound = function (kind) { return isMob(kind) ? psMob.apply(this, arguments) : ps.apply(this, arguments); };
  try { const viaC = (fn) => function () { if (!AC || !master) return fn.apply(this, arguments); const m = master; try { master = creepDst(); U.n++; return fn.apply(this, arguments); } finally { master = m; } }; hiss = viaC(hiss); } catch (e) { U.err = String(e); }
  try { guardianRoar = via(guardianRoar); } catch (e) { U.err = String(e); }
  // ---- the slider, same black/gold row as the others, right under Sound effects ----
  const fmt = v => Math.round(v * 100) + '%';
  function apply() { if (bus) bus.gain.value = SET.mob * MOBK; }
  try {
    const sfxRow = document.querySelector('label.set[data-k="sfx"]');
    if (sfxRow && !document.getElementById('mobVol')) {
      const row = document.createElement('label'); row.className = 'set'; row.dataset.k = 'mob';
      row.innerHTML = '<span>Mob voices volume<b id="mobV"></b></span><input type="range" id="mobVol" min="0" max="3" step="0.05" data-testid="settings-mob-volume">';
      sfxRow.after(row);
      const inp = row.querySelector('input');
      inp.value = SET.mob; document.getElementById('mobV').textContent = fmt(SET.mob);
      inp.addEventListener('input', () => { SET.mob = Number(inp.value); document.getElementById('mobV').textContent = fmt(SET.mob); apply(); saveSet(); });
    }
  } catch (e) { U.err = String(e); }
  const su = syncSettingsUI; syncSettingsUI = function () { const r = su.apply(this, arguments);
    try { const i = document.getElementById('mobVol'); if (i) { i.value = SET.mob; document.getElementById('mobV').textContent = fmt(SET.mob); } } catch (_) {} return r; };
  U.bus = () => bus;
})();
