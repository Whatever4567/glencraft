/* ===================== GLX-C209 (v1.0.43): the people talk - 100 seeded voice lines (villager "hmm / hrrm" mumbles crossed with alien-AI chatter: formant babble, pitch glides, question / answer tunes, faint AI shimmer, rolled r's, a Scottish lilt; no chirps), little back-and-forth conversations, hurt and death cries; each line is paired with a telepathy phrase (GLX-C210); v1.0.45: real Scots words via GLX-C212; v1.0.47: the words are gone again - only warm hummed tones, 100 of them, moods picked by the hive mind ===================== */
(function c209() {
  const U = window.__c209 = {n: 0, conv: 0, skip: 0, act: 0, last: -1, err: null, lines: null};
  // ---- the 100 lines: each mood gets its own share; every line is a fixed seeded recipe ----
  const MOODS = [['idle', 14], ['greet', 9], ['question', 10], ['agree', 9], ['disagree', 6], ['curious', 8], ['alarm', 6], ['farewell', 7], ['trade', 6], ['thanks', 6], ['hurt', 5], ['death', 3], ['happy', 6], ['sad', 5]];   // v1.0.47: 100 tones, happy + sad added
  const VOW = {a: [720, 1150], o: [500, 860], u: [350, 760], e: [520, 1550], i: [330, 1900], m: [260, 1000], n: [280, 1350], r: [470, 1250]};
  const VK = Object.keys(VOW);
  const LINES = [], BY = {};
  (function make() { let s = 0x2091ace; const r = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const pick = a => a[(r() * a.length) | 0];
    for (const [mood, n] of MOODS) { BY[mood] = [];
      for (let k = 0; k < n; k++) {
        const P = {idle: [2, 5, 0.9, 0.11], greet: [2, 3, 1.1, 0.15], question: [2, 5, 1.05, 0.12], agree: [1, 3, 1.0, 0.14], disagree: [1, 3, 0.9, 0.13], curious: [2, 4, 1.15, 0.1], alarm: [3, 6, 1.35, 0.08],
          farewell: [2, 3, 0.95, 0.17], trade: [3, 5, 1.0, 0.11], thanks: [2, 3, 1.1, 0.13], hurt: [1, 2, 1.3, 0.12], death: [2, 3, 1.0, 0.3], happy: [2, 4, 1.12, 0.12], sad: [2, 4, 0.85, 0.19]}[mood];
        const ns = P[0] + ((r() * (P[1] - P[0] + 1)) | 0), base = (92 + r() * 34) * P[2], syl = [], lilt = 0.08 + r() * 0.1;
        for (let i = 0; i < ns; i++) { const last = i === ns - 1, u = ns > 1 ? i / (ns - 1) : 1; const lc = 1 + lilt * Math.sin(Math.PI * u); let a = base * lc * (0.92 + r() * 0.18), b = a * (0.9 + r() * 0.2);   // rise-and-fall lilt over the line
          if (mood === 'idle' && r() < 0.5) { a = base * 0.85; b = a * 0.92; }                                   // "hmm" hums
          if (mood === 'question' && last) { b = a * (1.45 + r() * 0.4); }                                       // rising end
          if ((mood === 'agree' || mood === 'farewell') && last) { b = a * (0.62 + r() * 0.12); }
          if ((mood === 'idle' || mood === 'greet' || mood === 'trade') && last && r() < 0.5) { b = a * (1.08 + r() * 0.1); }   // the wee Scottish lift at the end               // falling end
          if (mood === 'disagree') { a *= 1.08; b = a * (0.7 + r() * 0.1); }
          if (mood === 'curious') { b = a * (1.2 + 0.4 * Math.sin(u * 3 + r())); }
          if (mood === 'alarm') { a *= 1.1 + 0.2 * r(); b = a * (0.8 + r() * 0.5); }
          if (mood === 'greet' && i === 0) { b = a * 1.3; }
          if (mood === 'happy') { b = a * (i % 2 ? 0.9 : 1.16 + r() * 0.1); }
          if (mood === 'sad') { a *= 1 - u * 0.12; b = a * (0.78 + r() * 0.08); }
          if (mood === 'hurt') { a = base * (1.3 + r() * 0.3); b = a * 0.65; }
          if (mood === 'death') { a = base * (1.1 - u * 0.25); b = a * (last ? 0.35 : 0.8); }
          const hum = mood === 'idle' || mood === 'agree' || mood === 'thanks' || mood === 'sad' ? r() < 0.65 : r() < 0.35;
          syl.push({d: P[3] + r() * 0.13 + (last && (mood === 'question' || mood === 'death' || mood === 'farewell') ? 0.14 : 0) + (mood === 'death' && last ? 0.35 : 0), a, b,
            v1: hum ? 'm' : pick(VK), v2: hum ? pick(['m', 'n', 'u']) : pick(VK), gap: 0.02 + r() * (mood === 'alarm' ? 0.03 : 0.08), step: r() < 0.06, nz: r() < 0.12, rr: r() < (hum ? 0.45 : 0.25) ? 22 + r() * 8 : 0 });
        }
        const L = {id: LINES.length, k, mood, syl, wave: r() < 0.85 ? 'sawtooth' : 'square', fk: 0.86 + r() * 0.3, ring: 30 + r() * 90, rd: 0.04 + r() * 0.1, sh: 0.04 + r() * 0.1, sd: 2 + r() * 1.02, lp: 1100 + r() * 1000};
        L.dur = syl.reduce((t, q) => t + q.d + q.gap, 0) + 0.1; LINES.push(L); BY[mood].push(L); } } })();
  // v1.0.52: a few plain villager words, still hummed in the same voice (no speech synth): the brain picks them by meaning
  const WORDS = {yes: [['a', 'e', 1.0, 0.72], ['e', 'i', 1.05, 0.8]], no: [['n', 'a', 1.08, 0.7], ['o', 'u', 0.98, 0.66]], come: [['u', 'm', 1.0, 1.0], ['o', 'n', 1.12, 0.78]], look: [['u', 'u', 1.15, 1.25]],
    help: [['e', 'e', 1.3, 1.1], ['e', 'u', 1.35, 0.9]], hello: [['e', 'e', 1.05, 1.25], ['o', 'u', 1.1, 1.12]], thanks: [['a', 'a', 1.08, 0.95], ['n', 'm', 0.98, 0.72]], danger: [['o', 'i', 1.45, 1.2], ['o', 'i', 1.5, 0.9]],
    food: [['m', 'm', 0.95, 1.0], ['u', 'm', 1.0, 0.8]], mine: [['a', 'i', 1.0, 1.05], ['n', 'n', 0.95, 0.82]]};
  for (const [w, sy] of Object.entries(WORDS)) { const key = 'w_' + w; BY[key] = [];
    for (let v = 0; v < 3; v++) { const base = 100 + v * 14, syl = sy.map((q, i) => ({d: 0.14 + (i === sy.length - 1 ? 0.06 : 0) + v * 0.015, a: base * q[2], b: base * q[2] * q[3], v1: q[0], v2: q[1], gap: 0.04, step: false, nz: w === 'thanks' && !i || w === 'help' && i, rr: w === 'come' && !i ? 24 : 0}));
      const L = {id: LINES.length, k: v, mood: key, word: w, syl, wave: 'sawtooth', fk: 0.95 + v * 0.06, ring: 60, rd: 0.06, sh: 0.06, sd: 2.4, lp: 1700 + v * 150}; L.dur = syl.reduce((t, q) => t + q.d + q.gap, 0) + 0.1; LINES.push(L); BY[key].push(L); } }
  U.words = Object.keys(WORDS);
  U.lines = LINES.length; U.moods = Object.fromEntries(Object.entries(BY).map(([k, v]) => [k, v.length]));
  // ---- the synth ----
  let NB = null; const nbuf = () => { if (!NB) { const n = (AC.sampleRate * 0.5) | 0; NB = AC.createBuffer(1, n, AC.sampleRate); const d = NB.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; } return NB; };
  const active = []; let lastStart = 0;
  // v1.0.47: warm villager hums - no ring-modulated "AI" shimmer, no stepped digital glides, no spoken words: a soft voiced buzz through two mouth formants, a gentle
  // vibrato, a wee chest "hrrm" an octave down, a breath of air and the rolled-r flutter, all under a low-pass so it sounds like a person mumbling, not a machine
  function play(L, pos, vk, vol, pan) {
    const out = (window.mobOut || outNode)(vol, pan), t0 = AC.currentTime + 0.02, end = t0 + L.dur;
    const bus = AC.createGain(), lp = AC.createBiquadFilter(); bus.gain.value = 1; lp.type = 'lowpass'; lp.frequency.value = U.muf ? 480 : 1500 + (L.lp - 1100) * 0.6; lp.Q.value = 0.5; bus.connect(lp); lp.connect(out);
    const vib = AC.createOscillator(), vg = AC.createGain(); vib.frequency.value = 4.6 + L.rd * 12; vg.gain.value = 0; vib.connect(vg); vib.start(t0); vib.stop(end + 0.1);
    let t = t0;
    for (const q of L.syl) { const d = q.d, os = AC.createOscillator(), env = AC.createGain(), A = VOW[q.v1], B = VOW[q.v2];
      os.type = 'sawtooth'; os.frequency.setValueAtTime(q.a * vk, t); os.frequency.exponentialRampToValueAtTime(Math.max(30, q.b * vk), t + d);
      const vd = AC.createGain(); vd.gain.value = q.a * vk * 0.014; vib.connect(vd); vd.connect(os.frequency);
      env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(0.42, t + Math.min(0.05, d * 0.35)); env.gain.setValueAtTime(0.42, t + d * 0.6); env.gain.exponentialRampToValueAtTime(0.0001, t + d);
      for (let i = 0; i < 2; i++) { const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = i ? 4 : 3; f.frequency.setValueAtTime(A[i] * L.fk * (i ? 0.85 : 1), t); f.frequency.linearRampToValueAtTime(B[i] * L.fk * (i ? 0.85 : 1), t + d); os.connect(f); f.connect(env); }
      { const o2 = AC.createOscillator(), g2 = AC.createGain(); o2.type = 'sine'; o2.frequency.setValueAtTime(q.a * vk * 0.5, t); o2.frequency.exponentialRampToValueAtTime(Math.max(20, q.b * vk * 0.5), t + d); g2.gain.value = 0.22; o2.connect(g2); g2.connect(env); o2.start(t); o2.stop(t + d + 0.03); }
      if (q.nz || q.v1 === 'm') { const s = AC.createBufferSource(), f = AC.createBiquadFilter(), e = AC.createGain(); s.buffer = nbuf(); f.type = 'lowpass'; f.frequency.value = 800; e.gain.setValueAtTime(0.05, t); e.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(f); f.connect(e); e.connect(bus); s.start(t); s.stop(t + d + 0.02); }
      if (q.rr) { const am = AC.createGain(), lo = AC.createOscillator(), lg = AC.createGain(); am.gain.value = 0.82; lo.frequency.value = q.rr; lg.gain.value = 0.18; lo.connect(lg); lg.connect(am.gain); env.connect(am); am.connect(bus); lo.start(t); lo.stop(t + d + 0.03); } else env.connect(bus);
      os.start(t); os.stop(t + d + 0.03); t += d + q.gap; }
    return end; }
  // ---- who is talking (clansfolk are mobs; croft farmers are GLX-C113 folk) ----
  const people = () => { const o = []; try { for (const a of mobs) if (a && a.kind === 'clansman' && a.g && !a.dead) o.push({a, g: a.g, head: a.head, key: a}); } catch (_) {}
    try { const F = window.__c113 && __c113.folk; if (F) for (const f of F) if (f && f.m && f.m.g && !f.dead) o.push({f, g: f.m.g, head: f.m.head, key: f.who || f}); } catch (_) {} return o; };
  const whoOf = (who, pos) => { const P0 = people(); if (who) { const q = P0.find(p => p.key === who || p.a === who || p.f === who); if (q) return q; } if (!pos) return null; let b = null, bd = 4;
    for (const q of P0) { const p = q.g.position, d = Math.hypot(p.x - pos.x, p.y - pos.y, p.z - pos.z); if (d < bd) { bd = d; b = q; } } return b; };
  const vkOf = q => { const o = q && q.key; if (!o) return 1; if (o.__vk == null) { let h = 0; const s = String(o.name || o.role || '') + (o.id || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; o.__vk = 0.84 + ((h >>> 0) % 1000) / 1000 * 0.34 + (o.role === 'miner' ? 0.06 : 0); } return o.__vk; };
  // say one line: distance-faded, at most 3 at once, not too close together, and each person waits a moment between lines
  const RECENT = [];
  function speak(mood, pos, q, force, conv) {
    try { if (!AC || !pos || typeof P === 'undefined' || DIM.cur) return 0; const now = AC.currentTime;
      for (let i = active.length - 1; i >= 0; i--) if (active[i] < now) active.splice(i, 1);
      const big = mood === 'hurt' || mood === 'death';
      if (active.length >= (big ? 4 : 3) || (!big && now - lastStart < 0.35)) { U.skip++; return 0; }
      if (q && q.key && !big && q.key.__vT > now) { U.skip++; return 0; }
      const dx = pos.x - P.x, dz = pos.z - P.z, d = Math.hypot(dx, pos.y - P.y, dz), R = big ? 30 : 24; if (d > R) return 0;
      U.muf = 0; try { const ex = P.x, ey = P.y + 1.6, ez = P.z, sx = pos.x, sy = pos.y + 1.5, sz = pos.z, n = Math.ceil(d * 2); for (let i = 2; i < n - 1; i++) { const f = i / n; if (solid(Math.floor(sx + (ex - sx) * f), Math.floor(sy + (ey - sy) * f), Math.floor(sz + (ez - sz) * f))) { U.muf = 1; break; } } } catch (_) {}
      const vol = Math.pow(1 - d / R, 1.2) * (U.muf ? 0.7 : 1) * (big ? 0.6 : 0.45), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw), pan = d > 0.1 ? (dx * rx + dz * rz) / d * 0.8 : 0;
      // the hive mind (SUNNY) runs one silent cycle per tone and picks the mood it comes out in
      try { if (window.SUNNY_BRAIN && !big) { const st = SUNNY_BRAIN.cycle('Event: ' + mood + (d != null ? ', ' + Math.round(d) + ' blocks from the traveller' : '') + (q && q.a && q.a.__pov ? '; sees ' + q.a.__pov : ''), U.outcome); U.st = st; U.outcome = null; U.cyc = (U.cyc || 0) + 1;
          const m = st && st.internalState && st.internalState.mood, cu = st && st.internalState && st.internalState.curiosity;
          if (mood === 'idle' && m > 0.35 && Math.random() < 0.5) mood = 'happy'; else if (mood === 'idle' && m < -0.35 && Math.random() < 0.5) mood = 'sad'; else if (mood === 'idle' && cu > 0.6 && Math.random() < 0.3) mood = 'curious'; } } catch (_) {}
      // never the same tone again until a dozen others have been heard
      const L0 = BY[mood] || BY.idle; let L, tries = 0; const SEL = window.__c232sel; do L = (SEL && tries < 6 ? L0[SEL(q, L0.length, tries, U.st) % L0.length] : null) || L0[(Math.random() * L0.length) | 0]; while (tries++ < 12 && L0.length > 1 && RECENT.includes(L.id)); RECENT.push(L.id); if (RECENT.length > 12) RECENT.shift();
      let end = play(L, pos, vkOf(q) * (0.97 + Math.random() * 0.06), vol, pan); const LD = Math.max(0.3, end - now); active.push(end); lastStart = now; U.n++; U.last = L.id; U.lastMood = mood;
      try { if (window.__c210) __c210.said(mood, L, d, q, conv); } catch (e) { if (!U.err) U.err = String(e && e.stack || e); }
      if (q && q.key) { q.key.__vT = end + 1.2; q.talk = end; TALK.set(q.key, {q, end, t: 0}); if (q.a) q.a.chatT = Math.max(q.a.chatT || 0, LD + 1.5); if (q.f) q.f.chatT = Math.max(q.f.chatT || 0, LD + 1.5); }
      return LD; } catch (e) { if (!U.err) U.err = String(e && e.stack || e); return 0; } }
  U.speak = speak; U.BY = BY;
  // ---- conversations: now and then someone close by answers, up to a few turns ----
  const REPLY = {greet: ['greet', 'curious', 'question'], question: ['agree', 'disagree', 'curious', 'agree'], curious: ['question', 'agree', 'curious'], idle: ['idle', 'question', 'agree'],
    agree: ['idle', 'thanks', 'farewell', 'happy'], happy: ['happy', 'agree', 'thanks'], sad: ['sad', 'question', 'agree'], hurt: ['alarm', 'sad'], disagree: ['question', 'disagree', 'agree'], alarm: ['alarm', 'question'], trade: ['agree'], thanks: ['farewell', 'agree'], farewell: ['farewell']};
  const queue = [];
  function maybeReply(mood, q, dur, turn) { if (!q || !REPLY[mood] || turn > 3 || Math.random() > (turn ? 0.5 : 0.55)) return; const p = q.g.position; let b = null, bd = 18;
    for (const o of people()) { if (o.key === q.key) continue; const r = o.g.position, d = Math.hypot(r.x - p.x, r.z - p.z); if (d < bd) { bd = d; b = o; } }
    if (!b) return; const opts = REPLY[mood]; queue.push({at: AC.currentTime + dur + 0.25 + Math.random() * 0.5, q: b, to: q, mood: opts[(Math.random() * opts.length) | 0], turn: turn + 1}); }
  // ---- the old voice hook: the people now often speak in the new voices instead (sleepy yawns and mumbles stay) ----
  const IDLEK = {ochaye: 1, hmmph: 1, hmm: 1, aye: 1, ach: 1, rright: 1, hrr: 1, hehheh: 1, wheesht: 1, oohaye: 1, happy: 1, grumble: 1};
  const v0 = window.__c100 && __c100.voice;
  if (v0) __c100.voice = function (kind, pos, who) {
    try { if (AC && pos && Math.random() < 0.6 && (IDLEK[kind] || kind === 'open')) { const q = whoOf(who, pos);
        const d = Math.hypot(pos.x - P.x, pos.z - P.z);
        const mood = kind === 'open' ? (Math.random() < 0.5 ? 'trade' : 'greet') : kind === 'aye' && !who ? 'thanks' : kind === 'ach' && !who ? 'disagree' : kind === 'aye' ? 'agree' : kind === 'ach' ? 'disagree'
          : d < 5 && Math.random() < 0.4 ? 'greet' : ['idle', 'idle', 'question', 'curious', 'idle', 'question'][(Math.random() * 6) | 0];
        if (kind === 'open' && window.__c210) __c210.ev('open'); if (kind === 'aye' && !who && window.__c210) __c210.ev('trade');
        const dur = speak(mood, pos, q, 0, !!who && d > 6); if (dur) { if (kind !== 'open' && who) maybeReply(mood, q, dur, 0); return; } } } catch (e) { if (!U.err) U.err = String(e && e.stack || e); }
    return v0.apply(this, arguments); };
  // ---- hurt and death ----
  const dm = damageMob; damageMob = function (a, dmg, byPlayer) { const hp0 = a && a.hp, pos = a && a.g && a.g.position && a.g.position.clone(); const r = dm.apply(this, arguments);
    try { if (a && a.kind === 'clansman' && pos && dmg > 0) { const q = {a, g: a.g, head: a.head, key: a}; if (a.hp <= 0 && hp0 > 0) speak('death', pos, q, 1); else if (a.hp > 0) speak('hurt', pos, q, 1);
        if (byPlayer && window.__c210) __c210.ev('strike', a);
        let k = 0; for (const o of people())  /* the hive reacts together */ { if (o.key === a || k >= 3) continue; const p = o.g.position; if (Math.hypot(p.x - pos.x, p.z - pos.z) < 12) queue.push({at: AC.currentTime + 0.35 + k++ * 0.45 + Math.random() * 0.3, q: o, mood: 'alarm', turn: 9}); } } } catch (e) { if (!U.err) U.err = String(e && e.stack || e); }
    return r; };
  // ---- the replies come in, and heads nod / mouths move while talking ----
  const TALK = new Map();
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
    try { if (AC) { const now = AC.currentTime;
        for (let i = queue.length - 1; i >= 0; i--) { const j = queue[i]; if (j.at > now) continue; queue.splice(i, 1); if (paused || !started) continue; const dur = speak(j.mood, j.q.g.position, j.q, 0, j.turn > 0 && j.turn < 9); if (dur) { U.conv++; maybeReply(j.mood, j.q, dur, j.turn); } }
        if (queue.length > 6) queue.splice(0, queue.length - 6);
        for (const [k, s] of TALK) { const h = s.q.head, live = now < s.end; s.t += dt; const nb = live ? 0.06 * Math.abs(Math.sin(s.t * 13)) * (0.6 + 0.4 * Math.sin(s.t * 3.1)) : 0;
          if (h) { h.rotation.x += nb - (s.nb || 0); } s.nb = nb; const m = s.q.a && s.q.a.__mouth; if (m) m.scale.y = 1 + nb * 18;
          if (!live) TALK.delete(k); }
        U.act = active.length; } } catch (e) { if (!U.err) U.err = String(e && e.stack || e); }
    return r; };
})();
