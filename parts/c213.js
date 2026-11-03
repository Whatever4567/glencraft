/* ===================== GLX-C213 (v1.0.45): free will - the hive mind picks what each castle person does next (hunt beasties, fetch food, eat, flee, shelter, trade, dance, blether,
   come say hello or keep their distance, wander, work), from their needs, the time, danger and what they remember of you; every choice is a prediction checked afterwards, and said out loud.
   Gifts: tap a person while holding something and they get one; they dance for joy. They never attack you unprovoked (the old one-swing-back stays). ===================== */
(function c213() {
  const U = window.__c213 = {goals: {}, decided: 0, done: 0, ok: 0, bad: 0, gifts: 0, refl: 0, err: null, log: []};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e); };
  const now = () => performance.now() / 1000, ri = n => (Math.random() * n) | 0;
  const SB = () => window.SunnyBrain, B = () => window.__c211 && __c211.B();
  const qOf = a => ({a, g: a.g, head: a.head, key: a});
  const say = (cat, a, mood) => { try { const q = a.m ? {f: a, g: a.m.g, head: a.m.head, key: a.who || a} : qOf(a); return window.__c209 && q && q.g ? __c209.speak(mood || 'agree', q.g.position, q) : 0; } catch (e) { ERR(e); return 0; } };   // v1.0.47: tones only
  const dP = p => Math.hypot(p.x - P.x, p.z - P.z);
  const people = () => { const o = []; try { for (const m of mobs) if (m && m.kind === 'clansman' && m.g && !m.dead && m.hp > 0 && m.ci) o.push(m); } catch (_) {} return o; };
  function nearMob(p, r, test) { let b = null, bd = r; for (const m of mobs) { if (!m || !m.g || !(m.hp > 0) || !test(m)) continue; const d = Math.hypot(m.g.position.x - p.x, m.g.position.z - p.z); if (d < bd) { bd = d; b = m; } } return b; }
  const hostile = m => m.hostile && m.kind !== 'clansman', beast = m => /^(sheep|pig|haggis|cow|coo)$/.test(m.kind);
  const fy = y => Math.floor(y + 0.05);
  const EXP = {hunt: 'beastie sorted', food: 'got food', eat: 'ate', flee: 'safe', sleep: 'in bed', trade: 'traded', dance: 'danced', social: 'chatted', approach: 'reached the traveller', away: 'kept distance', wander: 'explored', work: 'worked'};
  // ---- choosing a goal: needs, time, danger, the player memory and the reflection-shaped weights ----
  function choose(a) { const p = a.g.position, W = window.__c211 ? __c211.weights() : {care: 0, social: 0.5, safety: 0.5, dance: 0.35, explore: 0.5, food: 0.5, hunt: 0.5}, b = B() || {}, d = dP(p);
    const hz = nearMob(p, 16, hostile), an = nearMob(p, 20, beast), pal = people().find(o => o !== a && Math.hypot(o.g.position.x - p.x, o.g.position.z - p.z) < 12 && !o.sleeping);
    const wary = (b.harm || 0) > (b.kind || 0) + 1, w = {};
    if (isNight) w.sleep = 3; else {
      if (hz) { w.hunt = a.hp > 8 ? 0.8 + W.safety * 0.6 + (a.role === 'guard' || a.role === 'hunter' ? 0.8 : 0) : 0.1; w.flee = a.hp <= 8 ? 2 : 0.15; }
      if ((a.food || 16) < 9) w.eat = 1.4; if (an && (a.food || 16) < 14) w.food = 0.4 + W.food * 0.4;
      if (d < 16 && !wary) w.trade = 0.15 + Math.max(0, W.care) * 0.5; w.dance = d < 24 ? 0.08 + W.dance * 0.25 : 0; if (pal) w.social = 0.2 + W.social * 0.35;
      if (d < 22 && d > 4 && !((a.__metT || -1e9) > now() - 75)) w.approach = wary ? 0.02 : 0.15 + Math.max(0, W.care) * 0.7; w.away = wary ? 0.9 : 0.01; if ((a.__metT || -1e9) > now() - 75) { w.trade = (w.trade || 0) * 0.3; w.dance = (w.dance || 0) * 0.5; }
      w.wander = 0.25 + W.explore * 0.3; w.work = 0.6; }
    let tot = 0; for (const k in w) tot += w[k]; let r = Math.random() * tot; for (const k in w) { r -= w[k]; if (r <= 0) return {g: k, hz, an, pal}; } return {g: 'work'}; }
  function startGoal(a, c) { const p = a.g.position, g = c.g, G = {g, t0: now(), a}, ci = a.ci;
    switch (g) {
      case 'hunt': G.m = c.hz; a.job = {type: 'walk', x: Math.floor(c.hz.g.position.x), y: fy(c.hz.g.position.y), z: Math.floor(c.hz.g.position.z), wait: 1, ph: 'go'}; break;   // within 3 blocks their own fight takes over
      case 'food': G.m = c.an; a.job = {type: 'hunt', m: c.an, t: 0}; break;
      case 'eat': a.job = {type: 'eat', ph: ci && ci.chests && ci.chests[0] ? 'go' : 'eat', t: 0}; break;
      case 'flee': { const h = c.hz.g.position; G.m = c.hz; try { if (window.__c78flee) __c78flee(a, p.x - h.x, p.z - h.z); } catch (_) {} const dx = p.x - h.x, dz = p.z - h.z, L = Math.hypot(dx, dz) || 1; a.job = {type: 'walk', x: Math.floor(p.x + dx / L * 9), y: fy(p.y), z: Math.floor(p.z + dz / L * 9), wait: 2, ph: 'go'}; break; }
      case 'sleep': G.passive = 1; break;   // their own bedtime routine does the work
      case 'trade': case 'approach': { if (g === 'trade') U.tr = 0; const dx = p.x - P.x, dz = p.z - P.z, L = Math.hypot(dx, dz) || 1; a.job = {type: 'walk', x: Math.floor(P.x + dx / L * 2.4), y: fy(P.y), z: Math.floor(P.z + dz / L * 2.4), wait: g === 'trade' ? 6 : 3, ph: 'go'}; break; }
      case 'away': { const dx = p.x - P.x, dz = p.z - P.z, L = Math.hypot(dx, dz) || 1; a.job = {type: 'walk', x: Math.floor(p.x + dx / L * 7), y: fy(p.y), z: Math.floor(p.z + dz / L * 7), wait: 3, ph: 'go'}; break; }
      case 'social': { G.m = c.pal; const q = c.pal.g.position; a.job = {type: 'walk', x: Math.floor((p.x + q.x) / 2 + 1), y: fy(q.y), z: Math.floor((p.z + q.z) / 2), wait: 5, ph: 'go'}; break; }
      case 'wander': { const an = Math.random() * 6.28; a.job = {type: 'walk', x: Math.floor(p.x + Math.cos(an) * 8), y: fy(p.y), z: Math.floor(p.z + Math.sin(an) * 8), wait: 2 + Math.random() * 3, ph: 'go'}; break; }
      case 'dance': a.job = {type: 'wait', t: 6}; try { if (window.__c161) __c161.gift(a, 6); } catch (_) {} break;
      default: G.passive = 1; }
    G.job = a.job; G.food0 = a.food; G.d0 = dP(p); G.exp = EXP[g];
    try { if (SB()) SB().predict((a.name || 'One o us') + ' chose to ' + g, G.exp, B() ? B().state.confidence : 0.5); B().state.currentGoal = g; } catch (_) {}
    a.__goal = G; U.goals[g] = (U.goals[g] || 0) + 1; U.decided++; U.log.push(g); if (U.log.length > 30) U.log.shift();
    if (dP(p) < 18 && g !== 'work' && (g !== 'sleep' || Math.random() < 0.4) && Math.random() < 0.75) say('g_' + g, a, g === 'flee' ? 'alarm' : 'agree'); }
  function outcome(a, G) { const p = a.g.position;
    switch (G.g) { case 'hunt': case 'food': return !G.m || !(G.m.hp > 0) || !mobs.includes(G.m) ? EXP[G.g] : 'it got away';
      case 'eat': return (a.food || 0) > (G.food0 || 0) + 2 ? 'ate' : 'still hungry'; case 'flee': return !G.m || !(G.m.hp > 0) || Math.hypot(G.m.g.position.x - p.x, G.m.g.position.z - p.z) > 8 ? 'safe' : 'caught';
      case 'sleep': return a.sleeping ? 'in bed' : 'still up'; case 'trade': return U.tr ? 'traded' : 'no trade';
      case 'approach': return dP(p) < 4.5 ? 'reached the traveller' : 'could not reach'; case 'away': return dP(p) > (G.d0 || 0) + 2 ? 'kept distance' : 'stuck close';
      default: return EXP[G.g]; } }
  function finish(a, G) { a.__goal = null; if (G.g === 'approach' || G.g === 'trade' || G.g === 'away') a.__metT = now(); U.done++; let r = null; const out = outcome(a, G);
    try { const b = B(); if (b && (!b.lastPrediction || b.lastPrediction.expected !== G.exp)) SB().predict((a.name || 'One o us') + ' chose to ' + G.g, G.exp); r = SB().reflect(out); } catch (e) { ERR(e); }
    if (r) { if (r.success) U.ok++; else U.bad++; if (window.__c209) __c209.outcome = out; if (dP(a.g.position) < 14 && !G.passive && Math.random() < 0.5) setTimeout(() => say(r.success ? 'g_ok' : 'g_bad', a, r.success ? 'agree' : 'disagree'), 900); }
    if (r && !r.success) reflectSoon('prediction error', a); }
  // ---- the 4-layer self-reflection, spoken now and then ----
  let rq = [];
  function reflectSoon(why, a) { try { const r = window.__c211 && __c211.selfReflect(why); if (!r) return; U.refl++; const t = now();
      rq = [['r_l1', 0], ['r_l2', 4], ['r_l3', 8.5], ['r_l4', 13]].map(([c, dt]) => ({c, at: t + 1 + dt, a})); if (r.care) rq.push({c: 'r_care', at: t + 18, a}); } catch (e) { ERR(e); } }
  // ---- gifts ----
  function gift(o, isFarmer, idName) { try { U.gifts++; const nm = idName || 'a present'; if (window.__c161) __c161.gift(o, 6);
      setTimeout(() => say('gift', o, 'thanks'), 250); if (window.__c211) __c211.kind('gift'); if (SB()) { SB().remember('The traveller gave ' + (o.name || 'one o us') + ' ' + nm + '. Kindness.', 'gift', 0.9); const h = SB().addHypothesis("The traveller: ye're kind.", 0.55); SB().updateHypothesis(h.id, true, 0.2, 'gift'); }
      o.mood = 'smile'; o.moodT = 3; } catch (e) { ERR(e); } }
  U.gift = gift;
  const ui0 = useItem; useItem = function () {
    try { if (!menuOpen && !paused && !dead && started && !DIM.cur && window.__c113 && __c113.aim && cnt(selId) > 0) { const h = __c113.aim(4.5);
        if (h && h.f && h.f.st !== 'sleep') { let m = null, md = 1e9; try { m = reachMob(4); } catch (_) {} if (m && m.g) md = Math.hypot(m.g.position.x - P.x, m.g.position.z - P.z);
          if (!m || h.d < md || m.kind !== 'clansman') { const id = selId, nm = String(NAMES[id] || 'something').toLowerCase(); useUp(id, 1); try { renderHotbar(); } catch (_) {} gift(h.f, true, nm); return; } } } } catch (e) { ERR(e); }
    return ui0.apply(this, arguments); };
  // a hit on one of them: the hive remembers (their own one swing back is unchanged)
  const dm = damageMob; damageMob = function (a, dmg, byPlayer) { const r = dm.apply(this, arguments);
    try { if (byPlayer && a && a.kind === 'clansman' && dmg > 0 && window.__c211) { __c211.harm('struck one o us'); if (SB()) { const h = SB().addHypothesis("The traveller: ye're dangerous.", 0.4); SB().updateHypothesis(h.id, true, 0.2, 'strike'); } } } catch (e) { ERR(e); } return r; };
  // ---- the loop: one decision at a time, staggered, only near you ----
  let acc = 0, rr = 0, tr0 = -1, night0 = null, greetT = {}, hypT = 0;
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
    try { acc += dt; if (acc < 0.5 || !started || paused || dead || DIM.cur) return r; acc = 0; const t = now(), list = people();
      // trades completed count as gifts too
      const tr = window.__c100 ? __c100.trades : 0; if (tr0 < 0) tr0 = tr; if (tr > tr0) { tr0 = tr; U.tr = 1; const m = list.find(o => o.trading) || list.sort((x, y) => dP(x.g.position) - dP(y.g.position))[0]; if (m) { gift(m, false, 'a fair trade'); if (window.__c211) __c211.kind('trade', 0.5); } }
      // night falls: a warning from someone close
      if (night0 !== null && isNight && !night0) { const m = list.find(o => dP(o.g.position) < 16); if (m) { if (SB()) SUNNY_BRAIN.cycle('Event: night falls', null); say('night', m, 'alarm'); } } night0 = isNight;
      // a hello when you come close after a while away
      for (const m of list) { const d = dP(m.g.position); if (d < 5 && !m.sleeping && !(greetT[m.id || m.name] > t)) { greetT[m.id || m.name] = t + 120; const sp = window.__c212 && __c212.speakRaw || window.__c209 && __c209.speak; if (sp) sp('greet', m.g.position, qOf(m)); break; } }
      // the reflection lines
      if (rq.length && rq[0].at <= t) { const j = rq.shift(); if (j.a && j.a.g && dP(j.a.g.position) < 20) say(j.c, j.a, 'idle'); }
      // what you do shapes the hive's hypotheses (cheap, every 20 s)
      if (t > hypT && window.__c210 && SB()) { hypT = t + 20; const M = __c210.M(); if (M.mined > 60) SB().addHypothesis("The traveller: ye're a miner at heart.", 0.5); if (M.built > 60) SB().addHypothesis("The traveller: ye're a builder.", 0.5); if (isNight && M.visits > 2) SB().addHypothesis("The traveller: ye like the night.", 0.4); }
      if (!list.length) return r; rr = (rr + 1) % list.length; const a = list[rr], p = a.g.position, d = dP(p); if (d > 40 || a.sleeping) return r;
      const G = a.__goal; if (G) { if (a.job !== G.job || (G.job && G.job.done) || t - G.t0 > 30 || (G.passive && t - G.t0 > 12)) finish(a, G); return r; }
      if (a.mad > 0 || (a.job && a.job.type === 'fight') || a.trading) return r;   // their own fight / trade takes priority
      if (!(a.__gT > t)) { a.__gT = t + 14 + Math.random() * 22; if (!a.job || a.job.done || a.job.type === 'walk' || a.job.type === 'wait' || isNight) startGoal(a, choose(a)); }
      // idle, curious or unsure: now and then the 4-layer reflection
      const b = B(); if (b && !rq.length && d < 14 && Math.random() < 0.02 && (b.state.curiosity > 0.72 || b.state.uncertainty > 0.6 || (a.job && a.job.type === 'wait'))) reflectSoon(b.state.uncertainty > 0.6 ? 'uncertain' : b.state.curiosity > 0.72 ? 'curious' : 'idle', a);
    } catch (e) { ERR(e); }
    return r; };
})();
