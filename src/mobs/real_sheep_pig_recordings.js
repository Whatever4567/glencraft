/* GLX-C254 (v1.0.65): real sheep and pig recordings (Wikimedia Commons, CC0 / PD / CC BY / CC BY-SA - see CREDITS.md) replace the synth baa/oink.
   Cleaned, trimmed, normalised short ogg variants, lazy-loaded after the menu, played with a slight random pitch. Falls back to the old sound until loaded. */
(() => {
  const U = window.__c254 = {err: null, loaded: 0, played: 0, last: null};
  const SETS = {sheep: [1, 3, 4].map(i => 'assets/sfx/sheep' + i + '.ogg'), pig: [1, 2, 3, 4].map(i => 'assets/sfx/pig' + i + '.ogg')};
  const MAP = {baa: 'sheep', oink: 'pig', oink2: 'pig', snort: 'pig'}, BUF = {sheep: [], pig: []}, raw = {};
  let fetched = false;
  const fetchAll = () => { if (fetched) return; fetched = true; for (const k in SETS) SETS[k].forEach((u, i) => fetch(u).then(r => r.ok ? r.arrayBuffer() : null).then(ab => { if (ab) { raw[k + i] = ab; dec(k, i); } }).catch(() => {})); };
  const dec = (k, i) => { if (typeof AC === 'undefined' || !AC || !raw[k + i] || BUF[k][i]) return; const ab = raw[k + i]; raw[k + i] = null;
    try { AC.decodeAudioData(ab, b => { BUF[k][i] = b; U.loaded++; }, () => {}); } catch (_) {} };
  try { (window.__AM || (f => setTimeout(f, 3000)))(fetchAll); } catch (_) { setTimeout(fetchAll, 3000); }
  // v1.0.69: never left silent - keep nudging the fetch / decode until every recording is ready (the first fetch could land before the audio context existed)
  U.kick = () => { fetchAll(); for (const k in SETS) SETS[k].forEach((_, i) => raw[k + i] && dec(k, i)); };
  const kt = setInterval(() => { try { if (typeof AC !== 'undefined' && AC) U.kick(); if (U.loaded >= 7) clearInterval(kt); } catch (_) {} }, 1500);
  let lastI = {};
  function play(set, vol, pan) { const L = BUF[set].filter(Boolean); if (!L.length) return false;
    let i = Math.random() * L.length | 0; if (L.length > 1 && i === lastI[set]) i = (i + 1) % L.length; lastI[set] = i;
    const s = AC.createBufferSource(); s.buffer = L[i]; s.playbackRate.value = (set === 'pig' ? 0.9 : 0.92) + Math.random() * 0.18;
    s.connect(outNode(Math.max(0, Math.min(1, vol == null ? 1 : vol)) * 0.42, pan || 0)); s.start(); U.played++; U.last = set + i; return true; }
  try { const ps = playSound; playSound = function (kind, vol, pan) { const set = MAP[kind];
      if (set && typeof AC !== 'undefined' && AC) { for (const k in SETS) SETS[k].forEach((_, i) => raw[k + i] && dec(k, i)); try { if (play(set, vol, pan)) return; } catch (e) { U.err = String(e.message || e); } }
      return ps.apply(this, arguments); }; } catch (e) { U.err = 'wrap ' + e; }
})();
