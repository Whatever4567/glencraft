/* ===================== GLX-C201 (v1.0.40): snow is not rain - when it snows you hear a soft wind / hush instead of rain patter and thunder, no lightning,
   the Thunner Cloudie (rain mob) only comes in real rain, the weather tag and messages say snow, and saves record which one is falling ===================== */
(function c201() {
  const U = window.__c201 = {err: null, hush: 0, blocked: 0};
  const warn = (w, e) => { U.err = w + ' ' + String(e && e.message || e); console.warn('c201', w, e); };
  const precip = () => typeof weather !== 'undefined' && weather.type && weather.type !== 'clear' && !DIM.cur;
  const snowyHere = () => { try { return !!window.__forceSnow || P.y > (window.__snowY || SEA + 30); } catch (_) { return false; } };
  // snow = precipitation where it falls as snow (high up, snowy ground, or the Snow weather setting); rain = every other precipitation
  window.__snowWx = () => precip() && (!!window.__snowing || snowyHere());
  window.__rainWx = () => precip() && !window.__snowWx();
  // weather tag
  const SL = {light: 'Light snow', heavy: 'Heavy snow', thunder: 'Blizzard'};
  try { for (const k in SL) { const w = WEATHER[k]; if (!w) continue; const rl = w.label; Object.defineProperty(w, 'label', {get: () => window.__snowWx && __snowWx() ? SL[k] : rl, configurable: true}); } } catch (e) { warn('label', e); }
  // messages
  const MSG = {'The rain eases off.': 'The snow stops falling.', 'A light rain drifts across the glen.': 'Light snow drifts across the glen.', 'Heavy rain sweeps in.': 'Heavy snow sweeps in.', 'Thunder rumbles. A storm is coming!': 'The wind howls. A blizzard is coming!'};
  try { const t0 = toast; toast = function (m) { if (typeof m === 'string' && MSG[m] && snowyHere()) arguments[0] = MSG[m]; return t0.apply(this, arguments); }; } catch (e) { warn('toast', e); }
  // no thunder or lightning in snow
  try { const sf = sfx; sfx = function (k) { if (k === 'thunder' && __snowWx()) { U.blocked++; return; } return sf.apply(this, arguments); }; } catch (e) { warn('sfx', e); }
  try { const st = strike; strike = function () { if (__snowWx()) { U.blocked++; return; } return st.apply(this, arguments); }; } catch (e) { warn('strike', e); }
  // soft snow ambience: low band-passed noise with slow gusts
  let hush = null, hushF = null, gustT = 0;
  function mkHush() { if (hush || typeof AC === 'undefined' || !AC || !master) return hush; try {
      const len = AC.sampleRate * 4, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0); let b = 0;
      for (let i = 0; i < len; i++) { b = (b + (Math.random() * 2 - 1) * 0.06) * 0.985; d[i] = b * 3; }   // brown-ish noise: a soft hush, no patter
      const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
      hushF = AC.createBiquadFilter(); hushF.type = 'bandpass'; hushF.frequency.value = 520; hushF.Q.value = 0.6;
      hush = AC.createGain(); hush.gain.value = 0; src.connect(hushF); hushF.connect(hush); hush.connect(master); src.start(); } catch (e) { warn('hush', e); hush = null; } return hush; }
  const zero = g => { try { if (g && g.gain) { g.gain.cancelScheduledValues(AC.currentTime); g.gain.value = 0; } } catch (_) {} };
  try { const ur = updateRain; updateRain = function (dt) { const r = ur.apply(this, arguments);
      try { if (__snowWx()) { zero(typeof rainGain !== 'undefined' && rainGain); zero(typeof roofOut !== 'undefined' && roofOut); } } catch (e) { warn('rain', e); } return r; }; } catch (e) { warn('ur', e); }
  try { const uw = updateWeather; updateWeather = function (dt) { const r = uw.apply(this, arguments);
      try { const sn = __snowWx(); U.snow = sn;
        if (sn) { flashA = 0; const fl = document.getElementById('flash'); if (fl && fl.style.opacity !== '0') fl.style.opacity = '0'; }
        const h = (sn || hush) && mkHush();
        if (h) { gustT += dt; const cave = typeof caveK === 'number' ? caveK : 0, cov = typeof rainCover === 'number' ? rainCover : 0;
          const lvl = weather.type === 'light' ? 0.05 : weather.type === 'thunder' ? 0.11 : 0.08, gust = 0.75 + 0.25 * Math.sin(gustT * 0.37) * Math.sin(gustT * 0.13 + 1);
          const tgt = sn ? lvl * gust * (1 - cave) * (1 - 0.5 * cov) * (typeof SET !== 'undefined' && SET.sfx != null ? SET.sfx : 1) : 0;
          h.gain.setTargetAtTime(tgt, AC.currentTime, 0.6); if (hushF) hushF.frequency.setTargetAtTime(420 + 260 * gust, AC.currentTime, 0.8); U.hush = Math.round(tgt * 1000) / 1000; } } catch (e) { warn('uw', e); }
      return r; }; } catch (e) { warn('uwrap', e); }
  // saves: which kind is falling
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && typeof d === 'object') d.precip = __snowWx() ? 'snow' : __rainWx() ? 'rain' : 'none'; } catch (_) {} return d; }; } catch (e) { warn('save', e); }
})();
