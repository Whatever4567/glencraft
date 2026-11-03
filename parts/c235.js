/* ===================== GLX-C235 (v1.0.52): the folk as a people - hive plans talked over (through walls), roles, your gestures (jump = follow me, nod = yes, shake = no),
   their own proposals, nods and shakes, plain villager words, and no loops: boredom, repetition penalty, cooldowns, novelty, refusals. Budgeted: one castle think per frame. ===================== */
(function c235() {
  const U = window.__c235 = {plans: {}, talks: 0, refusals: 0, follows: 0, nods: 0, shakes: 0, yes: 0, no: 0, props: 0, acted: {}, ms: 0, err: null, log: []};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e).slice(0, 400); };
  const now = () => performance.now() / 1000, rnd = Math.random;
  const isC = a => a && a.kind === 'clansman' && a.g && a.ci && !a.dead;
  const say = (a, mood, conv) => { try { return window.__c209 ? __c209.speak(mood, a.g.position, {a, g: a.g, key: a}, false, conv) || 0 : 0; } catch (e) { ERR(e); return 0; } };
  const brain = (fn, txt) => { try { if (window.SUNNY_BRAIN && SUNNY_BRAIN[fn]) SUNNY_BRAIN[fn](txt, fn === 'predict' ? 'ok' : undefined); } catch (_) {} };
  const mood01 = () => { try { const m = __c209.st && __c209.st.internalState; return m ? {m: m.mood || 0, c: m.curiosity || 0.5} : {m: 0, c: 0.5}; } catch (_) { return {m: 0, c: 0.5}; } };
  const log = s => { U.log.push(Math.round(now()) + ' ' + s); if (U.log.length > 40) U.log.shift(); };
  // a person: seeded temper so each has their own leanings
  function me(a) { if (a.__me) return a.__me; let h = 0; for (const ch of String(a.name || 'x') + (a.role || '')) h = (h * 31 + ch.charCodeAt(0)) | 0; const r = k => ((Math.sin(h * (k + 1) * 12.9898) * 43758.5453) % 1 + 1) % 1;
    return a.__me = {stub: 0.15 + r(1) * 0.35, likes: {wood: r(2), mine: r(3) + (a.role === 'miner' ? 0.6 : 0), build: r(4), defend: r(5) + (a.role === 'hunter' ? 0.5 : 0), eat: 0.3, rest: r(6), wander: r(7), store: r(8)}, bored: 0, hist: [], nodT: 0, nodK: 0}; }
  // ---- head gestures of their own ----
  function nod(a, k) { const M = me(a); M.nodT = 0.9; M.nodK = k; if (k === 1) U.nods++; else if (k === 2) U.shakes++; }
  // ---- hive plans per castle ----
  const PLANS = ['wood', 'mine', 'build', 'defend', 'eat', 'rest', 'wander', 'store', 'raid'];
  const WORD = {wood: 'w_come', mine: 'w_mine', build: 'w_help', defend: 'w_look', eat: 'w_food', rest: 'idle', wander: 'w_come', store: 'w_help', raid: 'w_danger'};
  const H = new Map(); let rr = 0;
  function score(g, folk, ci) { const t = now(), st = mood01(); let s = 0.4 + rnd() * 0.5;
    for (const a of folk) { const M = me(a); s += (M.likes[g] || 0) * 0.3; const rep = M.hist.filter(x => x === g).length; s -= rep * 0.35; }   // repetition penalty
    const h = H.get(ci); if (h && h.last === g) s -= 1.2; if (h && h.cd[g] > t) s -= 2;                                                          // no same plan twice running, cooldowns
    if (g === 'eat') s += folk.some(a => (a.food != null ? a.food : 20) < 9) ? 1.5 : -0.8;
    if (g === 'raid' || g === 'defend') { let host = null; try { host = C78.api.hostileNear(folk[0], 22); } catch (_) {} s += host ? 1.6 : (g === 'raid' ? -2 : -0.2); }
    if (g === 'wander') s += st.c * 0.6; if (g === 'rest') s += st.m < -0.2 ? 0.4 : 0;
    return s; }
  function decide(ci, folk) { const t = now(); let h = H.get(ci); if (!h) H.set(ci, h = {next: t + 4 + rnd() * 6, last: null, cd: {}, conv: null});
    if (h.conv) return talk(h, folk); if (t < h.next || isNight) return;
    if (folk.some(a => a.tgt || a.trading || a.sleeping)) { h.next = t + 5; return; }
    let best = 'rest', bs = -1e9; for (const g of PLANS) { const s = score(g, folk, ci); if (s > bs) { bs = s; best = g; } }
    const lead = folk[(rnd() * folk.length) | 0];
    h.conv = {g: best, lead, turn: 0, at: t, folk: folk.slice(), votes: new Map()}; }
  // turn-taking: lead proposes (question + word), each answers (agree/disagree by own leaning), lead sums up, then they act
  function talk(h, folk) { const c = h.conv, t = now(); if (t < c.at) return;
    if (c.turn === 0) { const d = say(c.lead, 'question', 1); setTimeout(() => say(c.lead, WORD[c.g] || 'idle', 1), 450); U.talks++; c.turn = 1; c.at = t + Math.max(1.1, d + 0.9); brain('predict', c.lead.name + ' proposes ' + c.g); log(c.lead.name + ' proposes ' + c.g); return; }
    const others = c.folk.filter(a => a !== c.lead && isC(a));
    if (c.turn <= others.length) { const a = others[c.turn - 1], M = me(a), like = (M.likes[c.g] || 0.3) - M.hist.filter(x => x === c.g).length * 0.25 + mood01().m * 0.2;
      const yes = like + rnd() * 0.6 > M.stub + 0.35; c.votes.set(a, yes); nod(a, yes ? 1 : 2); const d = say(a, yes ? (rnd() < 0.5 ? 'w_yes' : 'agree') : (rnd() < 0.5 ? 'w_no' : 'disagree'), 1);
      if (!yes) { U.refusals++; log(a.name + ' says no to ' + c.g); } c.turn++; c.at = t + Math.max(0.9, d + 0.6); return; }
    // sum up: the ones who said no go their own way (independent, not assistants)
    const yesN = [...c.votes.values()].filter(Boolean).length; const go = others.length === 0 || yesN * 2 >= others.length;
    say(c.lead, go ? 'happy' : 'sad', 1); nod(c.lead, go ? 1 : 2);
    if (go) { act(c.lead, c.g, 0); others.forEach((a, i) => act(a, c.votes.get(a) ? c.g : pickOwn(a, c.g), i + 1)); h.last = c.g; h.cd[c.g] = t + 90; U.plans[c.g] = (U.plans[c.g] || 0) + 1; brain('reflect', 'the folk agree to ' + c.g); }
    else { for (const a of c.folk) if (isC(a)) act(a, pickOwn(a, c.g), 0); h.cd[c.g] = t + 45; brain('reflect', 'the folk argue about ' + c.g); }
    h.conv = null; h.next = t + 35 + rnd() * 30; }
  function pickOwn(a, not) { const M = me(a); let b = 'wander', bs = -9; for (const g of ['wood', 'mine', 'rest', 'wander', 'eat']) { if (g === not) continue; const s = (M.likes[g] || 0) - M.hist.filter(x => x === g).length * 0.4 + rnd() * 0.5; if (s > bs) { bs = s; b = g; } } return b; }
  // ---- doing it: through the real task code (c224), the inventory (c223) and the walker (c234) ----
  function act(a, g, i) { const M = me(a); M.hist.push(g); if (M.hist.length > 6) M.hist.shift(); U.acted[g] = (U.acted[g] || 0) + 1; a.__plan = {g, t0: now()};
    const T = window.__c224, C = window.__c223, ci = a.ci; a.idle = 0;
    try {
      if (g === 'wood' && T) { const tr = T.findTree(a); if (tr) { if (a.__task) T.done(a, false); T.give(a, {g: 'chop', tr, s: tr.s}); return; } }
      if ((g === 'mine' || g === 'build' || g === 'store') && T) { const rk = T.findRock(a, true); if (rk) { if (a.__task) T.done(a, false); T.give(a, {g: 'mine', rk, s: rk.s}); return; } }
      if (g === 'eat' && C && C.eat) { C.eat(a); say(a, 'w_food'); return; }
      if (g === 'raid' || g === 'defend') { let h = null; try { h = C78.api.hostileNear(a, 22); } catch (_) {} if (h && g === 'raid') { a.tgt = h; return; }
        const E = window.__c234 && __c234.entrances(ci); if (E && E.length) { const e = E[i % E.length]; a.__errand = {x: e.o[0], y: e.o[1], z: e.o[2], near: 1.5, until: performance.now() + 40000, done: b => { say(b, 'w_look'); }}; return; } }
      // rest / wander / fallback: somewhere in the yard or a stroll outside
      const r = g === 'wander' ? 10 + rnd() * 14 : 5, an = rnd() * 6.283, x = Math.floor(ci.cx + Math.cos(an) * r), z = Math.floor(ci.cz + Math.sin(an) * r);
      let y = null; try { y = C78.api.groundY ? C78.api.groundY(x, z) : null; } catch (_) {}
      if (y != null && isFinite(y)) a.__errand = {x, y: Math.floor(y), z, near: 1.6, until: performance.now() + 30000};
    } catch (e) { ERR(e); } }
  // ---- your gestures, read off the camera (what they see through their POV: you, facing them) ----
  const HI = []; let jumpArm = false, lastMove = 0, lastP = null;
  function sees(a, r) { const p = a.g.position, dx = P.x - p.x, dz = P.z - p.z, d = Math.hypot(dx, dz); if (d > r || d < 0.5) return false;
    const yaw = a.yawVis !== undefined ? a.yawVis : (a.ang || 0), want = Math.atan2(dx, dz); let df = Math.abs(((want - yaw + Math.PI) % 6.283 + 6.283) % 6.283 - Math.PI); if (df > 1.1 && !(a.stare > 0)) return false;
    try { const n = Math.ceil(d * 2); for (let i = 2; i < n - 1; i++) { const f = i / n; if (solid(Math.floor(p.x + dx * f), Math.floor(p.y + 1.6 + (P.y + 1.6 - p.y - 1.6) * f), Math.floor(p.z + dz * f))) return false; } } catch (_) {}
    return true; }
  function watcher(folk, r) { let b = null, bd = r; for (const a of folk) { const d = Math.hypot(P.x - a.g.position.x, P.z - a.g.position.z); if (d < bd && sees(a, r)) { bd = d; b = a; } } return b; }
  function gestures(dt, folk) { const t = now(); HI.push([t, P.yaw, P.pitch]); while (HI.length && HI[0][0] < t - 0.9) HI.shift();
    if (lastP && Math.hypot(P.x - lastP[0], P.z - lastP[1]) > 0.05) lastMove = t; lastP = [P.x, P.z];
    // jump
    const up = !P.onGround && P.vy > 3; if (up && !jumpArm) { jumpArm = true; onJump(folk); } if (P.onGround) jumpArm = false;
    // nod / shake: two or more turns of direction inside a second, big enough, one axis only
    if (HI.length > 5 && t > (U.gT || 0)) { const turns = k => { let n = 0, s = 0, lo = 1e9, hi = -1e9; for (let i = 1; i < HI.length; i++) { const d = HI[i][k] - HI[i - 1][k]; if (Math.abs(d) < 0.004) continue; const sg = Math.sign(d); if (s && sg !== s) n++; s = sg; } for (const h of HI) { lo = Math.min(lo, h[k]); hi = Math.max(hi, h[k]); } return [n, hi - lo]; };
      const [np, rp] = turns(2), [ny, ry] = turns(1);
      if (np >= 2 && rp > 0.3 && ry < 0.25) { U.gT = t + 1.2; HI.length = 0; answer(folk, true); }
      else if (ny >= 2 && ry > 0.35 && rp < 0.25) { U.gT = t + 1.2; HI.length = 0; answer(folk, false); } } }
  function onJump(folk) { const t = now(); const f = folk.find(a => a.__follow); if (f && t - f.__follow.t0 > 1) { endFollow(f, 'jump'); return; }
    const a = watcher(folk, 14); if (!a || a.tgt || a.sleeping || a.trading) return;
    const M = me(a); if (M.bored > 2 && rnd() < M.stub) { say(a, 'w_no'); nod(a, 2); U.refusals++; log(a.name + ' will not follow just now'); return; }
    a.__follow = {t0: t}; U.follows++; nod(a, 1); say(a, 'happy'); setTimeout(() => say(a, 'w_come'), 500); brain('reflect', 'the traveller jumped: follow me - ' + a.name + ' follows'); log(a.name + ' follows you'); }
  function endFollow(a, why) { a.__follow = null; a.__errand = null; say(a, why === 'jump' ? 'farewell' : 'idle'); nod(a, why === 'jump' ? 1 : 0); log(a.name + ' stops following (' + why + ')'); }
  function answer(folk, yes) { yes ? U.yes++ : U.no++; const t = now(); const a = folk.find(b => b.__ask && b.__ask.until > t) || watcher(folk, 12); if (!a) return;
    brain('reflect', 'the traveller ' + (yes ? 'nodded yes' : 'shook no') + ' to ' + a.name); const q = a.__ask; a.__ask = null; nod(a, yes ? 1 : 2);
    if (!q) { say(a, yes ? 'w_yes' : 'curious'); return; }
    if (!yes) { say(a, rnd() < 0.5 ? 'sad' : 'w_no'); me(a).bored += 0.5; log(a.name + ': you said no to ' + q.k); return; }
    say(a, 'w_thanks'); log(a.name + ': you said yes to ' + q.k);
    if (q.k === 'follow') { const T = window.__c224, tr = T && T.findTree(a); act(a, tr ? 'wood' : 'wander', 0); }
    else if (q.k === 'help' || q.k === 'trade') { a.__follow = {t0: t, lim: t + 60}; U.follows++; }
    else if (q.k === 'fight') { let h = null; try { h = C78.api.hostileNear(a, 24); } catch (_) {} if (h) a.tgt = h; } }
  // they ask you things now and then (a question tone and a word), and act on your nod or shake
  function propose(folk) { const t = now(); if (t < (U.pT || 0)) return; U.pT = t + 50 + rnd() * 60; const a = watcher(folk, 9); if (!a || a.__follow || a.tgt || a.__ask) return;
    let host = null; try { host = C78.api.hostileNear(a, 20); } catch (_) {}
    const k = host ? 'fight' : ['follow', 'help', 'trade'][(rnd() * 3) | 0]; a.__ask = {k, until: t + 9}; U.props++;
    say(a, k === 'fight' ? 'w_danger' : k === 'follow' ? 'w_come' : k === 'help' ? 'w_help' : 'w_look'); setTimeout(() => say(a, 'question'), 600); log(a.name + ' asks: ' + k + '?'); }
  function follow(a, dt) { const F = a.__follow, t = now(), d = Math.hypot(P.x - a.g.position.x, P.z - a.g.position.z);
    if (d > 40) return endFollow(a, 'far'); if (t - lastMove > 25) return endFollow(a, 'idle'); if (F.lim && t > F.lim) return endFollow(a, 'done'); if (isNight && t - F.t0 > 120) return endFollow(a, 'tired');
    if ((F.rt = (F.rt || 0) - dt) > 0) return; F.rt = 0.6;
    if (d > 3) a.__errand = {x: Math.floor(P.x), y: Math.floor(P.y + 0.05), z: Math.floor(P.z), near: 2.6, until: performance.now() + 4000}; else a.__errand = null; }
  // ---- per frame: one castle thinks; gestures read once; heads animated ----
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments); const T0 = performance.now();
    try { if (!started || DIM.cur || window.__c235off) return r; const by = new Map(); for (const a of mobs) if (isC(a)) { let L = by.get(a.ci); if (!L) by.set(a.ci, L = []); L.push(a); }
      const cis = [...by.keys()]; if (cis.length) { const ci = cis[rr++ % cis.length], f = by.get(ci); const d = Math.hypot(ci.cx - P.x, ci.cz - P.z); if (d < 90) decide(ci, f); }
      const near = []; for (const [ci, f] of by) if (Math.hypot(ci.cx - P.x, ci.cz - P.z) < 60) near.push(...f);
      if (near.length) { gestures(dt, near); propose(near); }
      for (const a of near) { if (a.__follow) follow(a, dt); const M = a.__me; if (M) { M.bored = Math.max(0, Math.min(5, M.bored + (a.moving ? -0.05 : 0.02) * dt));
          if (M.nodT > 0 && a.head) { M.nodT -= dt; const w = Math.sin((0.9 - M.nodT) * 14) * Math.min(1, M.nodT * 3); if (M.nodK === 1) a.head.rotation.x = w * 0.35; else if (M.nodK === 2) a.head.rotation.y = w * 0.45; if (M.nodT <= 0) { a.head.rotation.x = 0; a.head.rotation.y = 0; } } } }
    } catch (e) { ERR(e); } U.ms += performance.now() - T0; return r; };
  U.act = act; U.answer = answer; U.onJump = onJump; U.H = H; U.me = me;
})();
// v1.0.52: the stray controller badge on the title screen is gone
(function () { try { const st = document.createElement('style'); st.textContent = '#padBadge{display:none!important}'; document.head.appendChild(st); const kill = () => { const b = document.getElementById('padBadge'); if (b) b.remove(); }; kill(); setInterval(kill, 1000); } catch (_) {} })();
