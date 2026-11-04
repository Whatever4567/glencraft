/* GLX-UKS (v1.1.53): UK soundscape. Outdoors: UK and Scottish birds by day (robin, blackbird, wren, skylark, curlew, gulls near the coast) and the odd
   distant plane; tawny owls, wind and light rain or a river at night. All made live in the browser (no recordings). The outdoor sound fades out
   indoors and underground. Every cave layer has its own ambient music. Rooms and caves get a reverb and echo on ALL game sounds, and the tail
   grows with the size of the space. */
(function uks() {
  const U = window.__uks = {err: null, on: 0, enc: 0, cave: 0, size: 0, band: -1, out: 0, birds: 0, planes: 0, owls: 0, rev: 'none'};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  let wired = 0, outBus, caveBus, revIn, dryG, wetA, wetB, convA, convB, useA = 1, dly, dlyFb, dlyG, nbuf, wind, windF, rain, rainF, curIR = '';
  const IR = {};
  function mkIR(sec, decay, bright) { const n = Math.max(1, Math.floor(AC.sampleRate * sec)), b = AC.createBuffer(2, n, AC.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let lp = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; lp += (w - lp) * bright; d[i] = lp * Math.pow(1 - i / n, decay); } }
    return b; }
  function wire() {
    if (wired) return true; if (typeof AC === 'undefined' || !AC || typeof master === 'undefined' || !master) return false;
    try {
      IR.room = mkIR(0.45, 3, 0.6); IR.hall = mkIR(1.1, 3, 0.5); IR.cave = mkIR(2.2, 2.6, 0.35); IR.big = mkIR(3.8, 2.2, 0.3); IR.huge = mkIR(5.5, 2, 0.25);
      revIn = AC.createGain(); dryG = AC.createGain(); dryG.gain.value = 1;
      convA = AC.createConvolver(); convB = AC.createConvolver(); convA.buffer = IR.room; convB.buffer = IR.room;
      wetA = AC.createGain(); wetB = AC.createGain(); wetA.gain.value = 0; wetB.gain.value = 0;
      dly = AC.createDelay(2); dlyFb = AC.createGain(); dlyG = AC.createGain(); dly.delayTime.value = 0.2; dlyFb.gain.value = 0; dlyG.gain.value = 0;
      const dlp = AC.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2200;
      revIn.connect(dryG); dryG.connect(AC.destination);
      revIn.connect(convA); convA.connect(wetA); wetA.connect(AC.destination);
      revIn.connect(convB); convB.connect(wetB); wetB.connect(AC.destination);
      revIn.connect(dly); dly.connect(dlp); dlp.connect(dlyFb); dlyFb.connect(dly); dlp.connect(dlyG); dlyG.connect(AC.destination);
      try { master.disconnect(AC.destination); } catch (_) { try { master.disconnect(); } catch (_) {} }
      master.connect(revIn);
      caveBus = AC.createGain(); caveBus.gain.value = 0; caveBus.connect(revIn);
      outBus = AC.createGain(); outBus.gain.value = 0; outBus.connect(AC.destination);
      const n = AC.sampleRate * 4; nbuf = AC.createBuffer(1, n, AC.sampleRate); const d = nbuf.getChannelData(0); let b = 0; for (let i = 0; i < n; i++) { b = 0.985 * b + 0.15 * (Math.random() * 2 - 1); d[i] = b; }
      const loop = (f, q, g) => { const s = AC.createBufferSource(); s.buffer = nbuf; s.loop = true; s.playbackRate.value = 0.7 + Math.random() * 0.3; const fl = AC.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q; const gg = AC.createGain(); gg.gain.value = g; s.connect(fl); fl.connect(gg); gg.connect(outBus); s.start(); return [gg, fl]; };
      [wind, windF] = loop(380, 0.6, 0.0); [rain, rainF] = loop(3200, 0.4, 0.0);
      // every other sound that goes straight to the speakers goes through the room too (mob voices, guns, mining); music buses stay dry
      const MINE = new Set([dryG, wetA, wetB, dlyG, outBus]), oc = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function (d) { if (d === AC.destination && !MINE.has(this) && !this.__dry) { U.routed = (U.routed || 0) + 1; return oc.call(this, revIn); } return oc.apply(this, arguments); };
      wired = 1; U.on = 1; return true;
    } catch (e) { ERR('wire', e); return false; }
  }
  // one bird or owl note: a sine sweep with a soft second harmonic, panned
  function note(t, f0, f1, dur, vol, pan, dst, type) { const o = AC.createOscillator(), g = AC.createGain(), p = AC.createStereoPanner ? AC.createStereoPanner() : null; o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); if (p) { p.pan.value = pan; g.connect(p); p.connect(dst || outBus); } else g.connect(dst || outBus); o.start(t); o.stop(t + dur + 0.05); }
  const R = (a, b) => a + Math.random() * (b - a);
  const SONG = {
    robin(t, v, p) { let x = t; for (let i = 0, n = 6 + R(0, 6) | 0; i < n; i++) { const f = R(2600, 7200); note(x, f, f * R(0.7, 1.3), R(0.05, 0.14), v * 0.5, p); x += R(0.06, 0.18); } },
    blackbird(t, v, p) { let x = t; for (let i = 0, n = 4 + R(0, 4) | 0; i < n; i++) { const f = R(1500, 2800); note(x, f, f * R(0.85, 1.2), R(0.12, 0.3), v * 0.6, p); x += R(0.15, 0.32); } note(x, 5000, 3000, 0.12, v * 0.25, p); },
    wren(t, v, p) { let x = t; const f = R(4200, 6500); for (let i = 0; i < 26; i++) { note(x, f + (i & 1 ? 600 : 0), f * 0.95, 0.035, v * 0.45, p); x += 0.045; } },
    skylark(t, v, p) { let x = t; for (let i = 0; i < 40; i++) { const f = R(2500, 5500); note(x, f, f * R(0.8, 1.25), 0.06, v * 0.22, p); x += 0.07; } },
    curlew(t, v, p) { note(t, 1500, 2400, 0.55, v * 0.5, p); note(t + 0.7, 1700, 2600, 0.5, v * 0.45, p); let x = t + 1.3; for (let i = 0; i < 10; i++) { note(x, 2300 + i * 40, 2700 + i * 40, 0.09, v * 0.4, p); x += 0.1; } },
    gull(t, v, p) { let x = t; for (let i = 0, n = 2 + R(0, 4) | 0; i < n; i++) { note(x, 1500, 850, 0.32, v * 0.35, p, null, 'sawtooth'); x += R(0.35, 0.5); } },
    owl(t, v, p) { if (Math.random() < 0.5) { note(t, 1100, 1700, 0.3, v * 0.35, p); return; } note(t, 520, 480, 0.6, v * 0.5, p); note(t + 1.5, 480, 470, 0.15, v * 0.35, p); note(t + 1.75, 520, 470, 1.1, v * 0.5, p); },
    plane(t, v, p) { const s = AC.createBufferSource(); s.buffer = nbuf; s.loop = true; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(260, t); f.frequency.linearRampToValueAtTime(520, t + 14); f.frequency.linearRampToValueAtTime(220, t + 30);
      const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.9, t + 13); g.gain.linearRampToValueAtTime(0.0001, t + 30); const pn = AC.createStereoPanner ? AC.createStereoPanner() : null;
      s.connect(f); f.connect(g); if (pn) { pn.pan.setValueAtTime(-p, t); pn.pan.linearRampToValueAtTime(p, t + 30); g.connect(pn); pn.connect(outBus); } else g.connect(outBus); s.start(t); s.stop(t + 31); U.planes++; }
  };
  U.play = (k, v) => { if (wire() && SONG[k]) SONG[k](AC.currentTime + 0.05, v || 0.5, 0); };
  // ---------- where the player is: enclosure, room size, cave layer, coast ----------
  const solid = (x, y, z) => { const b = getB(x, y, z); return b && b !== T.WATER && b !== T.LAVA && !(T.LEAVES && b === T.LEAVES); };
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
  let coast = 0, water = 0, lastC = 0;
  function sense() { const px = Math.floor(P.x), py = Math.floor(P.y + 1.6), pz = Math.floor(P.z); let roof = 0;
    for (let y = 1; y <= 24; y++) if (solid(px, py + y, pz)) { roof = y; break; }
    let hit = 0, sum = 0; for (const [dx, dz] of DIRS) { let r = 0; for (let s = 1; s <= 32; s++) { if (solid(Math.floor(P.x + dx * s), py, Math.floor(P.z + dz * s))) { r = s; break; } } if (r) { hit++; sum += r; } else sum += 40; }
    const deepIn = !DIM.cur && P.y < SEA - 25;
    const up = roof ? roof : 40, size = (sum / 8 + up) / 2, enc = deepIn || (roof && hit >= 5) ? 1 : roof && hit >= 3 ? 0.5 : 0;
    const ck = typeof caveK === 'number' ? caveK : 0, cave = DIM.cur === 'agartha' ? 1 : (deepIn || (enc && (ck > 0.3 || size > 9 || roof > 6))) ? 1 : 0;
    U.enc = enc; U.size = Math.round(size); U.cave = cave; U.roof = roof;
    const now = performance.now(); if (now - lastC > 4000) { lastC = now; let w = 0; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, b = getB(Math.floor(P.x + Math.cos(a) * 36), SEA - 1, Math.floor(P.z + Math.sin(a) * 36)); if (b === T.WATER) w++; }
      coast = w >= 3 && P.y < SEA + 40 ? 1 : 0; let rv = 0; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; for (let y = -3; y < 2; y++) if (getB(Math.floor(P.x + Math.cos(a) * 9), py + y, Math.floor(P.z + Math.sin(a) * 9)) === T.WATER) { rv++; break; } } water = rv >= 2 ? 1 : 0; U.coast = coast; U.water = water; }
    // cave layer: 0 limestone, 1 lush, 2 deep dark, 3 magma and basalt, 4 crystal depths, 5 abyssal shell, 6 hollow Earth, 7 cavern city
    let band = -1; try { const E = window.__c320, L = window.__c334; if (DIM.cur === 'agartha') band = 7; else if (cave && L && E && E.E) { const c = E.E(), RR = E.R || 5000; let d = E.flat ? (SEA - P.y) : RR - Math.hypot(P.x - c[0], P.y - c[1], P.z - c[2]); band = d < 20 ? 0 : d > 940 ? 7 : L.band(d); } else if (cave) band = 0; } catch (_) { band = cave ? 0 : -1; }
    U.band = band; }
  // ---------- cave layer music ----------
  const LAY = [
    {n: 'limestone', root: 110, ch: [0, 7, 12], wave: 'sine', drip: 1, flow: 1},
    {n: 'lush', root: 146.8, ch: [0, 4, 7, 11], wave: 'triangle', chime: 1},
    {n: 'deep dark', root: 55, ch: [0, 3, 7], wave: 'sine', click: 1},
    {n: 'lava and basalt', root: 41.2, ch: [0, 6, 12], wave: 'sawtooth', rumble: 1},
    {n: 'crystal', root: 220, ch: [0, 7, 14, 19], wave: 'sine', glass: 1},
    {n: 'molten shell', root: 36.7, ch: [0, 5, 12], wave: 'triangle', throb: 1},
    {n: 'abyssal shell', root: 49, ch: [0, 7, 10], wave: 'sawtooth', rumble: 1, throb: 1},
    {n: 'hollow Earth and cavern cities', root: 130.8, ch: [0, 4, 7, 9], wave: 'triangle', bell: 1}];
  let pad = null;
  function mkPad(i) { const L = LAY[i], g = AC.createGain(), f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = L.wave === 'sawtooth' ? 380 : 1400; g.gain.value = 0; f.connect(g); g.connect(caveBus); const os = [];
    for (const s of L.ch) for (const det of [-4, 4]) { const o = AC.createOscillator(); o.type = L.wave; o.frequency.value = L.root * Math.pow(2, s / 12); o.detune.value = det; const og = AC.createGain(); og.gain.value = 0.05 / L.ch.length; o.connect(og); og.connect(f); o.start(); os.push(o); }
    if (L.throb) { const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 0.35; lg.gain.value = 0.4; lfo.connect(lg); lg.connect(g.gain); lfo.start(); os.push(lfo); }
    g.gain.setTargetAtTime(1, AC.currentTime, 3); return {i, g, os, L}; }
  function dropPad() { if (!pad) return; const p = pad; pad = null; p.g.gain.setTargetAtTime(0, AC.currentTime, 2); setTimeout(() => { for (const o of p.os) try { o.stop(); } catch (_) {} try { p.g.disconnect(); } catch (_) {} }, 9000); }
  function caveFx(t) { if (!pad) return; const L = pad.L, v = 0.3;
    if (L.drip && Math.random() < 0.5) { const f = R(1200, 2600); note(t, f, f * 1.6, 0.06, v * 0.4, R(-0.8, 0.8), caveBus); }
    if (L.chime && Math.random() < 0.25) { const f = L.root * 4 * [1, 1.25, 1.5, 2][Math.random() * 4 | 0]; note(t, f, f, 1.6, v * 0.2, R(-0.6, 0.6), caveBus, 'triangle'); }
    if (L.click && Math.random() < 0.35) for (let k = 0; k < 4; k++) note(t + k * 0.04, 900, 300, 0.03, v * 0.25, R(-1, 1), caveBus, 'square');
    if (L.rumble && Math.random() < 0.3) { const s = AC.createBufferSource(); s.buffer = nbuf; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 120; const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 1); g.gain.linearRampToValueAtTime(0.0001, t + 3.5); s.connect(f); f.connect(g); g.connect(caveBus); s.start(t); s.stop(t + 4); }
    if (L.glass && Math.random() < 0.4) { const f = R(1800, 4200); note(t, f, f, 2.2, v * 0.12, R(-1, 1), caveBus); }
    if (L.bell && Math.random() < 0.2) { const f = L.root * 2 * [1, 1.5, 2][Math.random() * 3 | 0]; note(t, f, f * 0.99, 2.5, v * 0.25, R(-0.5, 0.5), caveBus, 'triangle'); }
    if (L.flow && water) note(t, R(500, 900), R(300, 600), 0.2, v * 0.1, R(-0.5, 0.5), caveBus); }
  // ---------- the reverb follows the space ----------
  function setRev() { const t = AC.currentTime, s = U.size, in_ = U.enc > 0; let k = 'none', wet = 0, echo = 0;
    if (in_ && U.cave) { k = s < 8 ? 'cave' : s < 18 ? 'big' : 'huge'; wet = Math.min(0.55, 0.3 + s / 60); echo = Math.min(0.45, 0.12 + s / 70); }
    else if (in_) { k = s < 5 ? 'room' : 'hall'; wet = s < 5 ? 0.18 : 0.26; echo = 0; }
    if (k !== 'none' && k !== curIR) { curIR = k; useA = !useA; const c = useA ? convA : convB; c.buffer = IR[k]; }
    const ws = useA ? wetA : wetB, wo = useA ? wetB : wetA; ws.gain.setTargetAtTime(k === 'none' ? 0 : wet, t, 0.4); wo.gain.setTargetAtTime(0, t, 0.4);
    dly.delayTime.setTargetAtTime(Math.min(1.6, Math.max(0.08, s * 2 / 60)), t, 0.5); dlyFb.gain.setTargetAtTime(echo * 0.8, t, 0.5); dlyG.gain.setTargetAtTime(echo, t, 0.5); U.rev = k; }
  // ---------- main loop ----------
  let nextB = 0, nextP = 0, nextN = 0;
  function tick() { try { if (!started || !wire() || AC.state === 'suspended') return; sense(); setRev(); const t = AC.currentTime, hid = document.visibilityState === 'hidden';
      const vol = hid ? 0 : Math.max(0, Math.min(1, (SET.music + SET.sfx) / 2)), dim = !DIM.cur, night = typeof isNight !== 'undefined' && isNight, rainy = typeof raining !== 'undefined' && raining;
      const outdoor = dim && !U.enc ? 1 : dim && U.enc === 0.5 ? 0.35 : 0; U.out = outdoor;
      outBus.gain.setTargetAtTime(vol * outdoor * 0.7, t, 1.2);
      wind.gain.setTargetAtTime(night ? 0.5 : 0.22 + Math.min(0.4, Math.max(0, (P.y - SEA) / 200)), t, 2); windF.frequency.setTargetAtTime(300 + Math.random() * 200, t, 3);
      rain.gain.setTargetAtTime(rainy ? 0.0 : night && water ? 0.25 : 0, t, 2); rainF.frequency.setTargetAtTime(night && water ? 900 : 3200, t, 1);
      if (outdoor > 0.3 && t > nextB) { const p = R(-0.9, 0.9), v = R(0.3, 0.7);
        if (night) { if (Math.random() < 0.6) { SONG.owl(t + 0.1, v, p); U.owls++; } nextB = t + R(14, 30); }
        else { const pool = ['robin', 'robin', 'blackbird', 'blackbird', 'wren', 'skylark', 'curlew']; if (coast) pool.push('gull', 'gull', 'gull'); const k = pool[Math.random() * pool.length | 0]; SONG[k](t + 0.1, v, p); U.birds++; U.last = k; nextB = t + R(3, 9); } }
      if (outdoor > 0.3 && !night && t > nextP) { if (nextP) SONG.plane(t + 0.1, R(0.25, 0.45), Math.random() < 0.5 ? -0.8 : 0.8); nextP = t + R(150, 330); }
      const band = U.cave ? U.band : -1; caveBus.gain.setTargetAtTime(band >= 0 ? Math.max(0, Math.min(1, SET.music)) * 0.8 : 0, t, 2);
      if (band >= 0 && (!pad || pad.i !== band)) { dropPad(); pad = mkPad(band); U.layer = LAY[band].n; } else if (band < 0 && pad) { dropPad(); U.layer = null; }
      if (pad && t > nextN) { caveFx(t + 0.05); nextN = t + R(1.5, 4); }
    } catch (e) { ERR('tick', e); } }
  setInterval(tick, 500); U.tick = tick;
})();
