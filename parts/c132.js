/* ===================== GLX-C132 (v1.0.12/13/14): relaxed ambient soundtrack - v1.0.14: remixes of the original Glencraft songs over the user's frequency tracks - the user's binaural tracks (assets/music, low-passed + quieter, gamma removed), procedural fallback, no chimes/bells/leads ===================== */
(function c132() {
  const U = window.__c132 = {on: false, cur: null, next: null, err: null, n: 0};
  // the user's track list (ref/music_tracks.js); gamma (40 Hz) layers are left out, carriers are warm 100-250 Hz sines
  const TR = {
    delta2:   {t: 'Delta Drift', L: [[100, 2]], surf: 0.5, mood: 'night'},
    theta4:   {t: 'Theta Gate', L: [[140, 4]], surf: 0.45, mood: 'night'},
    theta6:   {t: 'Theta Window', L: [[160, 6]], surf: 0.4, mood: 'night'},
    schumann: {t: 'Schumann', L: [[136.1, 7.83]], surf: 0.45, mood: 'day'},
    alpha10:  {t: 'Alpha Calm', L: [[200, 10]], surf: 0.4, mood: 'day'},
    focus10:  {t: 'Focus 10', L: [[100, 4], [200, 1.5]], surf: 0.6, mood: 'night'},
    focus12:  {t: 'Focus 12', L: [[120, 7], [240, 10]], surf: 0.5, mood: 'day'},
    focus15:  {t: 'Focus 15', L: [[100, 3], [150, 1.5]], surf: 0.55, mood: 'night'},
    focus21:  {t: 'Focus 21', L: [[110, 2], [220, 4]], surf: 0.5, mood: 'night'},
    beyond:   {t: 'Beyond the Matrix', L: [[150, 6], [100, 1]], surf: 0.45, mood: 'magic'},
    stargate: {t: 'Stargate', L: [[180, 5], [130, 7.83]], surf: 0.45, mood: 'magic'}};
  // v1.0.13: the user's own recordings (ref/music_user, processed: 1.6 kHz low-pass, 40 Hz gamma layers notched out, -20 LUFS, soft fades). Gamma Focus 40 Hz is left out.
  // v1.0.14: one remix per original song (musicgen/remix.py): the old melodies on warm pads / low plucks / sub + drone, each over one of the user's frequency tracks
  const RX = {mist: {bed: 'schumann', mood: 'day'}, dawn: {bed: 'alpha10', mood: 'day'}, heather: {bed: 'focus12', mood: 'day'}, pine: {bed: 'beyond', mood: 'magic'}, skye: {bed: 'stargate', mood: 'magic'},
    loch: {bed: 'delta2', mood: 'night'}, glen: {bed: 'theta4', mood: 'night'}, stone: {bed: 'focus15', mood: 'night'}, cairn: {bed: 'theta6', mood: 'night'}, ember: {bed: 'focus21', mood: 'hell'}};
  const FILES = Object.keys(RX), bad = new Set(), moodOf = id => (RX[id] || TR[id] || {}).mood, bedOf = id => RX[id] ? RX[id].bed : id;
  U.tracks = FILES.slice(); U.files = 0; U.fallback = 0;
  const LEVEL = 0.55, XF = 14;   // overall level vs the slider (sits under game sounds), crossfade seconds
  let bus = null, pink = null, A = null;
  function ensure() {
    if (bus || !AC) return !!bus;
    try {
      const g = AC.createGain(); g.gain.value = 0;
      const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = 0.5;   // nothing shrill
      const lim = AC.createDynamicsCompressor(); lim.threshold.value = -22; lim.knee.value = 6; lim.ratio.value = 14; lim.attack.value = 0.005; lim.release.value = 0.4;
      g.connect(lp); lp.connect(lim); lim.connect(AC.destination); bus = g;
      // stereo pink noise (Paul Kellet), 6 s loop
      const n = AC.sampleRate * 6; pink = AC.createBuffer(2, n, AC.sampleRate);
      for (let c = 0; c < 2; c++) { const d = pink.getChannelData(c); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; }
        const f = 2048; for (let i = 0; i < f; i++) { const k = i / f; d[i] = d[i] * k + d[n - f + i] * (1 - k); } }
      return true;
    } catch (e) { U.err = String(e); bus = null; return false; }
  }
  // one playing voice = a track; returns {g, stop()}
  function voice(id, X, dst) { X = X || AC; dst = dst || bus;
    const T = TR[id], t = X.currentTime, out = X.createGain(), nodes = []; out.gain.setValueAtTime(0.0001, t); out.connect(dst);
    const osc = (type, f, dst, det) => { const o = X.createOscillator(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det; o.connect(dst); o.start(t); nodes.push(o); return o; };
    const gain = (v, dst) => { const g = X.createGain(); g.gain.value = v; g.connect(dst); nodes.push(g); return g; };
    const lfo = (rate, depth, param, ph) => { const o = X.createOscillator(), g = X.createGain(); o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(param); o.start(t + (ph || 0)); nodes.push(o, g); };
    // binaural layers: left = carrier - beat/2, right = carrier + beat/2, each with a slow swell
    T.L.forEach(([c, b], i) => { const m = X.createChannelMerger(2), lg = gain(i ? 0.09 : 0.13, out); m.connect(lg); nodes.push(m);
      const l = gain(1, m), r = gain(1, m); l.disconnect(); r.disconnect(); l.connect(m, 0, 0); r.connect(m, 0, 1);
      osc('sine', c - b / 2, l); osc('sine', c + b / 2, r); lfo(0.021 + i * 0.013, 0.045, lg.gain, i * 7); });
    // Highland drone pad: root an octave below the lowest carrier plus a fifth, soft detuned triangles through a dark filter
    const root = Math.min(...T.L.map(l => l[0])) / 2, pf = X.createBiquadFilter(); pf.type = 'lowpass'; pf.frequency.value = 420; pf.Q.value = 0.3; nodes.push(pf);
    const pg = gain(0.05, out); pf.connect(pg); lfo(0.017, 0.02, pg.gain, 3);
    for (const [f, d] of [[root, -6], [root, 6], [root * 1.5, -4], [root * 2, 3]]) osc('triangle', f, pf, d);
    lfo(0.05, 80, pf.frequency);
    // surf bed: low-passed pink noise rising and falling like slow waves
    const s = X.createBufferSource(); s.buffer = pink; s.loop = true; s.loopStart = Math.random() * 3; const sf = X.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 520; sf.Q.value = 0.2;
    const sg = gain(0.16 * T.surf, out); s.connect(sf); sf.connect(sg); s.start(t); nodes.push(s, sf); lfo(0.07 + Math.random() * 0.03, 0.09 * T.surf, sg.gain); lfo(0.031, 160, sf.frequency, 2);
    out.gain.exponentialRampToValueAtTime(1, t + XF);
    return {id, g: out, t0: performance.now(), stop() { const t2 = X.currentTime; try { out.gain.cancelScheduledValues(t2); out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), t2); out.gain.exponentialRampToValueAtTime(0.0001, t2 + XF); } catch (_) {}
      setTimeout(() => { for (const n of nodes) { try { n.stop && n.stop(); } catch (_) {} try { n.disconnect(); } catch (_) {} } try { out.disconnect(); } catch (_) {} }, XF * 1000 + 500); }};
  }
  U.offline = async (oc, id, hp) => { ensure(); const sink = oc.createGain(); let f = null; if (hp) { f = oc.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; f.Q.value = 0.7; const f2 = oc.createBiquadFilter(); f2.type = 'highpass'; f2.frequency.value = hp; f.connect(f2); sink.connect(f); f2.connect(oc.destination); } else sink.connect(oc.destination);
    const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.connect(sink); voice(id, oc, lp); const buf = await oc.startRendering(); let e = 0, pk = 0; for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let k = buf.length >> 1; k < d.length; k++) { e += d[k] * d[k]; pk = Math.max(pk, Math.abs(d[k])); } } return {rms: Math.sqrt(e / buf.length), pk}; };
  function fileVoice(id) {
    const el = new Audio('assets/music/' + id + '.mp3'); el.preload = 'auto'; el.loop = false; let src = null, sub = null, dead = false; const out = AC.createGain(), t = AC.currentTime; out.gain.setValueAtTime(0.0001, t); out.connect(bus);
    try { src = AC.createMediaElementSource(el); src.connect(out); } catch (e) { U.err = 'mes ' + e; }
    out.gain.exponentialRampToValueAtTime(1, t + 8);
    const v = {id, t0: performance.now(), el, left() { if (sub) return sub.left(); return el.duration ? el.duration - el.currentTime : 999; },
      stop() { dead = true; if (sub) return sub.stop(); const t2 = AC.currentTime; try { out.gain.cancelScheduledValues(t2); out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), t2); out.gain.exponentialRampToValueAtTime(0.0001, t2 + 3); } catch (_) {}
        setTimeout(() => { try { el.pause(); el.removeAttribute('src'); el.load(); } catch (_) {} try { src && src.disconnect(); out.disconnect(); } catch (_) {} }, 3500); }};
    // a file that will not load falls back to the synthesised version of the same recipe
    el.addEventListener('error', () => { if (dead || sub) return; bad.add(id); U.fallback++; try { out.disconnect(); } catch (_) {} if (TR[bedOf(id)]) sub = voice(bedOf(id)); });
    const pp = el.play(); if (pp && pp.catch) pp.catch(() => {}); U.files++; return v; }
  const near = () => { try { for (const m of mobs) if ((m.kind === 'unicorn' || m.kind === 'nmwizard') && Math.hypot(m.g.position.x - P.x, m.g.position.z - P.z) < 28) return true; } catch (_) {} return false; };
  function mood() { if (!started) return 'day'; if (typeof DIM !== 'undefined' && DIM.cur === 'hell') return 'hell'; if (near()) return 'magic'; const under = typeof caveK === 'number' && caveK > 0.5, night = typeof isNight !== 'undefined' && isNight; return under || night ? 'night' : 'day'; }
  let last = [], len = 0;
  function pick(md) { const pool = U.tracks.filter(k => !bad.has(k)).filter(k => moodOf(k) === md && !last.includes(k)); const ids = pool.length ? pool : U.tracks.filter(k => moodOf(k) === md); const id = ids[Math.floor(Math.random() * ids.length)]; last.push(id); if (last.length > 3) last.shift(); return id; }
  function want() { if (document.visibilityState === 'hidden') return 0; if (master && master.gain.value === 0 && SET.sfx > 0) return 0; return Math.max(0, Math.min(1, SET.music)) * LEVEL * duck(); }
  /* v1.0.79: one music at a time - the desert / temple tune crossfades this out, and the Egyptian dance silences it */
  function duck() { try { if (window.__c259 && __c259.on) return 0; const m = window.__c258 ? +__c258.mix || 0 : 0; return Math.max(0, 1 - m); } catch (_) { return 1; } }
  function tick() {
    try { if (!AC || !ensure()) return; if (AC.state === 'suspended') return;
      const v = want(); bus.gain.setTargetAtTime(v, AC.currentTime, (window.__c259 && __c259.on) ? 0.3 : 0.8); U.on = v > 0;
      if (!v) return;
      const md = mood(), age = A ? (performance.now() - A.t0) / 1000 : 1e9;
      // a new track after 3-4 minutes, or (after at least 40 s) when the mood changes (day/night, caves, wizards/unicorn)
      if (!A || age > len || (A.left && A.left() < 9) || (age > 40 && moodOf(A.id) !== md) || (md === 'hell') !== (moodOf(A.id) === 'hell')) { if (A) A.stop(); const id = pick(md); A = bad.has(id) ? voice(bedOf(id)) : fileVoice(id); len = A.left ? 1e9 : 180 + Math.random() * 60; U.cur = A.id; U.n++; }
    } catch (e) { U.err = String(e && e.message || e); }
  }
  setInterval(tick, 1000); U.tick = tick; U._rate = r => { if (A && A.el) A.el.playbackRate = r; }; U.el = () => A && A.el && {t: A.el.currentTime, d: A.el.duration, paused: A.el.paused, err: A.el.error && A.el.error.code}; U.level = () => bus && bus.gain.value;
  // the old mp3 soundtrack (piano / bells / leads) is retired everywhere; Hell plays the 'ember' remix through the same bus
  playMusic = function () { try { music.pause(); } catch (_) {} };
  const bt = bgmTick; bgmTick = function () { const r = bt.apply(this, arguments); try { if (!music.paused) music.pause(); } catch (_) {} return r; };
  // level-up: a warm, soft low chord (no high bells); every 5 levels a fuller one, level 30 fuller still
  levelChime = function () { try { if (!AC) return; if (AC.state === 'suspended') AC.resume(); let L = 0; try { L = xpState().lvl; } catch (_) {}
    const big = L > 0 && L % 30 === 0, mid = L > 0 && L % 5 === 0, out = outNode(big ? 0.5 : mid ? 0.42 : 0.34, 0), t0 = AC.currentTime + 0.01;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300; lp.connect(out);
    const N = big ? [196, 293.7, 392, 493.9, 587.3] : mid ? [196, 293.7, 392, 493.9] : [293.7, 392, 493.9];
    N.forEach((f, i) => { const t = t0 + i * 0.09, d = 1.4 + (big ? 1 : 0); for (const [m, a, ty] of [[1, 0.16, 'sine'], [2, 0.03, 'triangle']]) { const o = AC.createOscillator(), g = AC.createGain(); o.type = ty; o.frequency.value = f * m;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(a, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(lp); o.start(t); o.stop(t + d + 0.05); } });
    setTimeout(() => { try { lp.disconnect(); } catch (_) {} }, 4500); window.__lastChime = performance.now(); U.chime = big ? 'big' : mid ? 'mid' : 'small'; } catch (e) { U.err = String(e); } };
})();
