/* ===================== GLX-C166 (v1.0.30): dinosaur voices - synthesised calls per species, through the Mob voices bus ===================== */
(function c166() {
  const U = window.__c166 = {calls: 0};
  function env(g, t, a, peak, len) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + len); }
  function tone(type, f0, f1, t, len, out, peak, vib) { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + len);
    if (vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = vib[0]; lg.gain.value = vib[1]; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + len + 0.05); }
    env(g, t, Math.min(0.12, len * 0.2), peak, len); o.connect(g); g.connect(out); o.start(t); o.stop(t + len + 0.05); }
  function call(kind, pos, d) { if (!AC || AC.state !== 'running') return; const R = kind === 'd_apato' ? 48 : 32; if (d > R) return;
    const vol = Math.pow(1 - d / R, 0.9), t = AC.currentTime + 0.02, dst = window.mobDst ? mobDst() : master, out = AC.createGain(); out.gain.value = vol;
    let pn = null; try { pn = AC.createStereoPanner(); const rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw); pn.pan.value = d > 0.1 ? ((pos.x - P.x) * rx + (pos.z - P.z) * rz) / d * 0.8 : 0; out.connect(pn); pn.connect(dst); } catch (_) { out.connect(dst); }
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.connect(out);
    const p = 0.92 + Math.random() * 0.16;
    if (kind === 'd_apato') { lp.frequency.value = 420; tone('sine', 62 * p, 44 * p, t, 2.4, lp, 0.5); tone('triangle', 124 * p, 88 * p, t + 0.05, 2.2, lp, 0.22); }
    else if (kind === 'd_para') { const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 3; bp.connect(out); tone('sawtooth', 190 * p, 150 * p, t, 1.5, bp, 0.5, [5, 3]); tone('sawtooth', 285 * p, 225 * p, t, 1.4, bp, 0.2); }
    else if (kind === 'd_stego' || kind === 'd_trike') { lp.frequency.value = 600; for (let i = 0; i < 2; i++) tone('square', (kind === 'd_trike' ? 110 : 85) * p, 70 * p, t + i * 0.32, 0.26, lp, 0.32); }
    else if (kind === 'd_galli') { const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 2; bp.connect(out); for (let i = 0; i < 2; i++) tone('square', 460 * p, 330 * p, t + i * 0.22, 0.16, bp, 0.3); }
    else if (kind === 'd_compy') { lp.frequency.value = 5000; for (let i = 0; i < 3; i++) tone('sine', 1900 * p, 2600 * p, t + i * 0.12, 0.07, lp, 0.18); }
    else { lp.frequency.value = 700; tone('sawtooth', 120 * p, 70 * p, t, 1.0, lp, 0.45, [7, 6]); tone('square', 80 * p, 52 * p, t, 1.0, lp, 0.2); }
    U.calls++; }
  window.__c165v = (k, p, d) => { try { call(k, p, d); } catch (_) {} };
  U.call = call;
})();
