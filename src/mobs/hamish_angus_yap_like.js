/* ===================== GLX-C111 (v0.9.92): Hamish & Angus yap like villagers (procedural Scottish gibberish), and hit back once if you hit them ===================== */
(function c111() {
  const U = window.__c111 = {n: 0, last: null, rants: 0, hitsBack: 0, bubble: null, err: null};
  const VOW = {a: [750, 1200, 2500], o: [500, 900, 2400], u: [350, 800, 2300], e: [550, 1500, 2500], m: [260, 1100, 2400], i: [320, 2100, 2800], n: [280, 1600, 2500]};
  let NB = null; const nbuf = () => { if (!NB) { const n = AC.sampleRate | 0, d = (NB = AC.createBuffer(1, n, AC.sampleRate)).getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; } return NB; };
  // one voiced syllable: a buzzing sawtooth "voice" through three vowel formants, optional rolled-r flutter; rough = extra grit
  function syl(o, t, dur, f0a, f0b, v1, v2, roll, gain) {
    const os = AC.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(f0a * o.k, t); os.frequency.linearRampToValueAtTime(f0b * o.k, t + dur);
    const vib = AC.createOscillator(), vg = AC.createGain(); vib.frequency.value = 5 + o.rough * 3; vg.gain.value = f0a * o.k * (0.02 + o.rough * 0.03); vib.connect(vg); vg.connect(os.frequency);
    const g = gain || 0.5, env = AC.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(g, t + Math.min(0.03, dur * 0.3)); env.gain.setValueAtTime(g, t + dur * 0.7); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let src = os; const r = roll || (o.rough > 0.5 ? 38 : 0);
    if (r) { const am = AC.createGain(); am.gain.value = 0.55; const l = AC.createOscillator(); l.type = 'square'; l.frequency.value = r; const lg = AC.createGain(); lg.gain.value = roll ? 0.45 : 0.18; l.connect(lg); lg.connect(am.gain); os.connect(am); src = am; l.start(t); l.stop(t + dur + 0.05); }
    const A = VOW[v1], B = VOW[v2 || v1];
    for (let i = 0; i < 3; i++) { const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = i ? 9 : 6; f.frequency.setValueAtTime(A[i] * o.fk, t); f.frequency.linearRampToValueAtTime(B[i] * o.fk, t + dur); const fg = AC.createGain(); fg.gain.value = [1, 0.55, 0.25][i]; src.connect(f); f.connect(fg); fg.connect(env); }
    env.connect(o.out); os.start(t); vib.start(t); os.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
  }
  // breath / "ch" / "sh" / "t" noise
  function nz(o, t, dur, freq, q, g) { const s = AC.createBufferSource(); s.buffer = nbuf(); const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; const e = AC.createGain(); e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(e); e.connect(o.out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02); }
  const V = ['a', 'o', 'u', 'e', 'i', 'm', 'n'], rv = () => V[Math.floor(Math.random() * V.length)];
  const SAY = {
    huh: (o, t) => { nz(o, t, 0.09, 1200, 1, 0.3); syl(o, t + 0.06, 0.36, 112, 235, 'a', 'u', 0, 0.6); },
    ochaye: (o, t) => { syl(o, t, 0.16, 128, 140, 'o', 'o', 0, 0.45); nz(o, t + 0.15, 0.12, 2600, 2, 0.32); syl(o, t + 0.3, 0.42, 150, 105, 'a', 'i', 0, 0.45); syl(o, t + 0.76, 0.22, 100, 92, 'm', 'm', 0, 0.25); },
    hmmph: (o, t) => { syl(o, t, 0.36, 108, 94, 'm', 'm', 0, 0.55); nz(o, t + 0.34, 0.1, 700, 1.2, 0.4); syl(o, t + 0.5, 0.2, 96, 84, 'm', 'u', 20, 0.3); },
    aye: (o, t) => { syl(o, t, 0.38, 165, 118, 'a', 'i', 0, 0.6); },
    ach: (o, t) => { syl(o, t, 0.2, 170, 125, 'a', 'a', 0, 0.6); nz(o, t + 0.18, 0.22, 2300, 1.6, 0.42); },
    rright: (o, t) => { syl(o, t, 0.34, 120, 135, 'u', 'a', 29, 0.5); syl(o, t + 0.34, 0.2, 140, 112, 'a', 'i', 0, 0.45); nz(o, t + 0.56, 0.04, 4200, 2, 0.35);
      if (Math.random() < 0.6) { syl(o, t + 0.75, 0.16, 115, 110, 'e', 'a', 0, 0.35); syl(o, t + 0.92, 0.2, 118, 100, rv(), rv(), 25, 0.35); } },
    hehheh: (o, t) => { for (let i = 0; i < 3; i++) { nz(o, t + i * 0.17, 0.05, 1500, 1, 0.25); syl(o, t + i * 0.17 + 0.03, 0.1, 160 - i * 10, 150 - i * 12, 'e', 'e', 0, 0.45); } },
    wheesht: (o, t) => { syl(o, t, 0.26, 115, 150, 'u', 'i', 0, 0.45); nz(o, t + 0.24, 0.34, 2700, 1.4, 0.36); nz(o, t + 0.58, 0.04, 4300, 2, 0.3); },
    oohaye: (o, t) => { syl(o, t, 0.3, 105, 165, 'u', 'u', 0, 0.5); syl(o, t + 0.32, 0.34, 170, 235, 'a', 'i', 0, 0.5); },
    yawn: (o, t) => { nz(o, t, 0.25, 900, 0.8, 0.18); syl(o, t + 0.05, 0.85, 175, 98, 'a', 'o', 0, 0.35); syl(o, t + 0.95, 0.28, 95, 88, 'm', 'n', 0, 0.2); syl(o, t + 1.26, 0.22, 92, 86, 'm', 'm', 0, 0.15); },
    mumble: (o, t) => { let x = t; for (let i = 0; i < 3 + (Math.random() * 3 | 0); i++) { const d = 0.12 + Math.random() * 0.14; syl(o, x, d, 95 + Math.random() * 15, 88 + Math.random() * 10, 'm', rv(), Math.random() < .3 ? 22 : 0, 0.2); x += d + 0.03; } },
    grr: (o, t) => { syl(o, t, 0.35, 92, 78, 'u', 'a', 31, 0.5); },
    rant: (o, t) => { let x = t; const n = 11 + (Math.random() * 5 | 0); for (let i = 0; i < n; i++) { const d = 0.07 + Math.random() * 0.1, f = 165 + Math.random() * 85;
        if (Math.random() < 0.25) nz(o, x, 0.07, 2200 + Math.random() * 1500, 1.5, 0.45); syl(o, x, d, f, f * (0.75 + Math.random() * 0.4), rv(), rv(), Math.random() < .35 ? 30 : 0, 0.85); x += d + 0.015 + Math.random() * 0.03; }
      syl(o, x + 0.05, 0.4, 230, 150, 'a', 'i', 26, 0.9); }
  };
  SAY.hrr = SAY.rright; SAY.hmm = SAY.hmmph; SAY.happy = SAY.ochaye; SAY.grumble = SAY.ach; SAY.open = SAY.ochaye;
  const IDLE = ['ochaye', 'hmmph', 'aye', 'ach', 'rright', 'hehheh', 'wheesht', 'oohaye', 'rright', 'mumble'];
  const near = pos => { let b = null, bd = 9; for (const m of mobs) if (m.kind === 'clansman' && m.g) { const q = m.g.position, d = (q.x - pos.x) ** 2 + (q.z - pos.z) ** 2 + (q.y - pos.y) ** 2; if (d < bd) { bd = d; b = m; } } return b; };
  // Hamish (hunter): deeper, smoother.  Angus (miner): a touch higher but rough, gravelly
  function say(kind, pos, who) {
    try { if (!AC || !SAY[kind]) return; if (pos && !who) who = near(pos); const loud = kind === 'rant';
      let vol = 1, pan = 0, R = loud ? 40 : 28;
      if (pos) { const dx = pos.x - P.x, dz = pos.z - P.z, d = Math.hypot(dx, pos.y - P.y, dz); if (d > R) return; vol = Math.pow(1 - d / R, 0.85); const rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw); pan = d > 0.1 ? (dx * rx + dz * rz) / d * 0.8 : 0; }
      const ang = who && who.role === 'miner', j = 0.94 + Math.random() * 0.12;
      const o = {out: (window.mobOut || outNode)(vol * (loud ? 0.95 : 0.55), pan), k: (ang ? 1.0 : 0.8) * j, fk: ang ? 1.0 : 0.9, rough: ang ? 0.8 : 0.2};
      SAY[kind](o, AC.currentTime + 0.01); if (ang) nz(o, AC.currentTime + 0.01, 0.12, 500, 0.7, 0.08);
      U.n++; U.last = kind; if (who) { who.lastSay = kind; who.chatT = Math.max(who.chatT || 0, 1.6); }
    } catch (e) { if (!U.err) U.err = String(e && e.stack || e); }
  }
  window.__c100.voice = say; U.say = say;
  // ---- swearing bubble over his head ----
  const LINES = ["What the fuck ye piece o' fuckin' shite!?", "Ya wee bawbag! Fuck off!", "Och ye fuckin' numpty!", "Ah'll skelp yer arse ye wee shite!", "Whit the fuck wis that fur!?", "Ye fuckin' radge! Dae that again an' see!", "Haw! Ya wee fud! Away an' bile yer heid!", "Fuckin' hell, ya clattie wee bastart!", "Ah'll gie ye a skelpin' ye dobber!", "Ya manky wee shitebag! Hoof it!"];
  let bub = null, bubWho = null, bubT = 0, lastLine = -1;
  function bubble(a) { if (!bub) { bub = document.createElement('div'); bub.dataset.testid = 'clan-bubble'; bub.style.cssText = 'position:fixed;left:0;top:0;z-index:40;pointer-events:none;max-width:260px;padding:6px 10px;border-radius:10px;background:rgba(255,255,255,.95);color:#a01010;font:bold 14px system-ui,sans-serif;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.35);transform:translate(-50%,-100%);display:none'; document.body.appendChild(bub); }
    let i; do i = Math.floor(Math.random() * LINES.length); while (i === lastLine); lastLine = i;
    bub.textContent = (a.name || 'Clansman') + ': ' + LINES[i]; U.bubble = bub.textContent; bubWho = a; bubT = 3.8; }
  const v3 = new THREE.Vector3();
  function bubStep(dt) { if (!bub || bubT <= 0) return; bubT -= dt; const a = bubWho;
    if (bubT <= 0 || !a || !a.g || mobs.indexOf(a) < 0 || screen !== 'game') { bub.style.display = 'none'; bubT = 0; return; }
    v3.copy(a.g.position); v3.y += 2.5; v3.project(camera); if (v3.z > 1 || Math.abs(v3.x) > 1.1 || Math.abs(v3.y) > 1.1) { bub.style.display = 'none'; return; }
    bub.style.display = 'block'; bub.style.left = ((v3.x + 1) / 2 * innerWidth) + 'px'; bub.style.top = ((1 - v3.y) / 2 * innerHeight) + 'px'; }
  // ---- you hit him: he turns, swings back once (small, knocks you back), angry face ~5 s, loud rant + bubble, then he calms down ----
  const dm = damageMob; damageMob = function (a, dmg, byPlayer) { const r = dm.apply(this, arguments);
    try { if (a && a.kind === 'clansman' && byPlayer && a.hp > 0 && mobs.indexOf(a) >= 0) { a.angryT = 5; a.mood = 'angry'; a.moodT = 5; a.idle = 1.6; a.wp = null; if (!(a.retT > 0) && !(a.backCd > 0)) a.retT = 0.35; say('rant', a.g.position, a); bubble(a); U.rants++; } } catch (e) { if (!U.err) U.err = String(e && e.stack || e); }
    return r; };
  const ca = clanAI; clanAI = function (a, dt) {
    if (a.angryT > 0) { a.moodT = Math.max(a.moodT || 0, 0.2); a.idle = Math.max(a.idle || 0, 0.2); }
    const r = ca.apply(this, arguments);
    if (a.angryT > 0) { a.angryT -= dt; a.mood = 'angry'; if (a.angryT <= 0) { a.mood = 'focused'; a.moodT = 0; } }
    if (a.backCd > 0) a.backCd -= dt;
    if (a.retT > 0) { const p = a.g.position, dx = P.x - p.x, dz = P.z - p.z, d = Math.hypot(dx, dz); a.ang = Math.atan2(dx, dz); a.yawVis = a.ang; a.retT -= dt;
      if (a.retT <= 0) { a.backCd = 4; a.swingT = 0.4;   // exactly one punch back, no chasing
        if (d < 3.6 && Math.abs(P.y - p.y) < 2.5 && !dead) { try { hurt(2, (a.name || 'A clansman') + ' skelped you.'); knockPlayer(dx / (d || 1), dz / (d || 1), 5, 4); sfx('thud'); } catch (_) {} U.hitsBack++; } } }
    return r; };
  // ---- villager-style chatter: each one every ~2-5 s when you're within 16 blocks, never the same sound twice in a row ----
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
    try { if (!paused && started) { for (const a of mobs) { if (a.kind !== 'clansman' || !a.g || a.trading || a.tgt || a.angryT > 0) continue;
        const q = a.g.position, d = Math.hypot(q.x - P.x, q.z - P.z); if (d > 16) continue;
        a.chatT = (a.chatT == null ? 0.5 + Math.random() * 2.5 : a.chatT) - dt; if (a.chatT > 0) continue;
        a.chatT = a.sleeping ? 6 + Math.random() * 6 : 10 + Math.random() * 14;
        let k; if (a.sleeping) k = a.lastSay === 'yawn' ? 'mumble' : Math.random() < 0.45 ? 'yawn' : 'mumble';
        else do k = IDLE[Math.floor(Math.random() * IDLE.length)]; while (k === a.lastSay);
        if (a.sleeping || !window.__c100.voice || window.__c100.voice === say) say(k, q, a); else window.__c100.voice(k, q, a); a.chatT = a.sleeping ? 6 + Math.random() * 6 : 10 + Math.random() * 14; } }
      bubStep(dt); } catch (e) { if (!U.err) U.err = String(e && e.stack || e); }
    return r; };
})();
