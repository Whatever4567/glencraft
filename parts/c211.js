/* ===================== GLX-C211 (v1.0.45): the Throng's shared mind - SUNNY v205 MiniBrain (observe / remember / recall / predict / reflect / hypotheses) merged with the
   SUNNY v206 wake core (SUNNY_BRAIN.cycle), saved per world (debounced), cleared by Reset world, plus a rare 4-layer recursive self-reflection that shifts what they care about.
   Simulated states only: nothing here is proof of consciousness. ===================== */
(function c211() {
  const U = window.__c211 = {cycles: 0, log: [], saves: 0, loads: 0, resets: 0, refl: 0, err: null};
  const KEY = 'glx_sunny_';
  const def = () => ({version: 206, memories: [], beliefs: [], hypotheses: [], lessons: [], predictions: [], history: [], reflections: [],
    state: {curiosity: 0.7, confidence: 0.5, uncertainty: 0.5, mood: 0, attention: 'conversation', energy: 1, currentGoal: 'understand and learn'},
    goals: ['Understand the traveller', 'Keep the clan safe', 'Learn from mistakes', 'Stay one hive'],
    pref: {care: 0, hunt: 0.5, food: 0.5, social: 0.5, dance: 0.35, explore: 0.5, safety: 0.5}, kind: 0, harm: 0, gifts: 0,
    lastPrediction: null, lastObservation: null, cycles: 0, hits: 0, misses: 0, savedAt: 0});
  let B = def(), wid = null, dirty = 0, lastW = 0, saveT = null, nid = 1;
  const now = () => Date.now(), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const tok = s => String(s || '').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(w => w.length > 2);
  const SYN = {hit: 'strike', struck: 'strike', attack: 'strike', attacked: 'strike', kill: 'hunt', killed: 'hunt', hunted: 'hunt', ate: 'eat', food: 'eat', fled: 'flee', ran: 'flee', run: 'flee',
    traded: 'trade', gift: 'give', gave: 'give', given: 'give', present: 'give', slept: 'sleep', danced: 'dance', mined: 'mine', dig: 'mine', dug: 'mine', built: 'build', chopped: 'chop', left: 'leave', went: 'go', got: 'get', away: 'leave', safe: 'shelter', bed: 'sleep'};
  const stem = w => SYN[w] || (w.length > 5 ? w.replace(/(ing|ed|es|s)$/, '') : w);
  const bag = s => new Set(tok(s).map(stem).map(w => SYN[w] || w));
  const sim = (a, b) => { const A = bag(a), C = bag(b); if (!A.size && !C.size) return 1; let n = 0; for (const w of A) if (C.has(w)) n++; return n / ((A.size + C.size - n) || 1); };
  U.sim = sim;
  function trim() { if (B.memories.length > 150) { const n = B.memories.length - 150, lo = new Set(B.memories.filter(m => m.importance < 0.5).slice(0, n)); B.memories = B.memories.filter(m => !lo.has(m)); } B.memories = B.memories.slice(-150); if (B.said) B.said = B.said.slice(-60); B.history = B.history.slice(-60); B.lessons = B.lessons.slice(-80); B.hypotheses = B.hypotheses.slice(-30); B.beliefs = B.beliefs.slice(-50);
    B.predictions = B.predictions.slice(-20); B.reflections = B.reflections.slice(-12); }
  // ---- saving: at most one write every 10 s, a few seconds after the last change; also rides along in the world save ----
  function write() { saveT = null; if (!dirty || !wid) return; try { trim(); B.savedAt = now(); localStorage.setItem(KEY + wid, JSON.stringify(B)); U.saves++; lastW = now(); dirty = 0; } catch (e) { if (!U.err) U.err = String(e); } }
  function save(force) { dirty = 1; if (force) { if (saveT) clearTimeout(saveT); write(); return; } if (saveT) return; saveT = setTimeout(write, Math.max(3000, 10000 - (now() - lastW))); }
  U.flush = () => save(true);
  function load(id, fromSave) { wid = id; let ls = null; try { ls = JSON.parse(localStorage.getItem(KEY + id) || 'null'); } catch (_) {}
    let best = null; for (const c of [ls, fromSave]) if (c && typeof c === 'object' && c.version && (!best || (c.savedAt || 0) > (best.savedAt || 0))) best = c;
    B = Object.assign(def(), best || {}); B.state = Object.assign(def().state, B.state || {}); B.pref = Object.assign(def().pref, B.pref || {}); if (best) U.loads++;
    nid = 1 + B.memories.reduce((m, x) => Math.max(m, x.id || 0), 0) + B.hypotheses.reduce((m, x) => Math.max(m, x.id || 0), 0); }
  function wipe() { const id = wid; B = def(); U.resets++; try { if (id) localStorage.removeItem(KEY + id); } catch (_) {} dirty = 1; write(); }
  const ew = enterWorld; enterWorld = function (save0) { try { const id = typeof current !== 'undefined' && current && current.id; if (save0) load(id, save0.sunny); else { wid = id; wipe(); save(true); } } catch (e) { if (!U.err) U.err = String(e && e.stack || e); } return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur) { trim(); B.savedAt = now(); d.sunny = JSON.parse(JSON.stringify(B)); save(true); } } catch (_) {} return d; };
  document.addEventListener('click', e => { try { const t = e.target; if (t && t.closest && t.closest('#resetYes') && !DIM.cur) setTimeout(() => { wid = (typeof current !== 'undefined' && current && current.id) || wid; wipe(); }, 0); } catch (_) {} }, true);
  window.addEventListener('pagehide', () => { if (dirty) write(); });
  // ---- v205 MiniBrain ----
  function remember(content, type = 'observation', importance = 0.5) { const m = {id: nid++, content: String(content).slice(0, 400), type, importance: clamp(+importance || 0.5, 0, 1), time: now()};
    B.memories.push(m); B.history.push({t: m.time, type, c: m.content.slice(0, 80)}); trim(); save(); return m; }
  function recall(query, limit = 5) { const q = bag(query); if (!q.size) return B.memories.slice(-limit);
    return B.memories.map(m => { let s = 0; for (const w of bag(m.content)) if (q.has(w)) s++; return {m, s: s + (s ? m.importance * 0.5 : 0)}; }).filter(x => x.s > 0).sort((a, b) => b.s - a.s || b.m.time - a.m.time).slice(0, limit).map(x => x.m); }
  function predict(situation, expected, confidence = 0.5) { const p = {situation: String(situation), expected: String(expected), confidence: clamp(+confidence, 0, 1), time: now()}; B.lastPrediction = p; B.predictions.push(p); save(); return p; }
  function reflect(actual) { const p = B.lastPrediction; if (!p) return null; const s = sim(p.expected, actual), ok = s >= 0.5 || String(p.expected).toLowerCase() === String(actual).toLowerCase(), st = B.state;
    p.actual = String(actual); p.matched = ok; B.lastPrediction = null;
    if (ok) { B.hits++; st.confidence = clamp(st.confidence + 0.05 * (1 - st.confidence), 0, 1); st.uncertainty = clamp(st.uncertainty - 0.04, 0, 1); st.mood = clamp(st.mood + 0.04, -1, 1); }
    else { B.misses++; st.confidence = clamp(st.confidence - 0.08, 0, 1); st.uncertainty = clamp(st.uncertainty + 0.1, 0, 1); st.curiosity = clamp(st.curiosity + 0.1, 0, 1); st.mood = clamp(st.mood - 0.05, -1, 1);
      B.lessons.push({error: p.expected, reality: String(actual), lesson: 'Prediction failed: expected [' + p.expected + '], observed [' + actual + ']. Reconsider the assumptions.', time: now()});
      remember('Prediction error: expected ' + p.expected + ' but ' + actual, 'prediction-error', 0.7); U.lastErr = now(); }
    save(); return {success: ok, similarity: +s.toFixed(2), expected: p.expected, actual: String(actual)}; }
  function observe(input) { B.lastObservation = {input: String(input), time: now()}; remember(input, 'observation', 0.4);
    return {observation: B.lastObservation, relevantMemories: recall(input, 5), state: Object.assign({}, B.state), recentLessons: B.lessons.slice(-3)}; }
  function addHypothesis(text, confidence = 0.5) { const old = B.hypotheses.find(h => sim(h.text, text) > 0.7); if (old) return old; const h = {id: nid++, text: String(text), confidence: clamp(+confidence, 0, 1), evidence: [], time: now()}; B.hypotheses.push(h); save(); return h; }
  function updateHypothesis(id, supports, weight = 0.15, note) { const h = B.hypotheses.find(x => x.id === id || x.text === id); if (!h) return null; const c = h.confidence;
    h.confidence = +(supports ? c + weight * (1 - c) : c * (1 - weight)).toFixed(3); h.evidence.push({s: !!supports, n: note || '', t: now()}); h.evidence = h.evidence.slice(-8); save(); return h; }
  function setState(p) { for (const k in p || {}) { const v = p[k]; B.state[k] = typeof v === 'number' ? (k === 'mood' ? clamp(v, -1, 1) : clamp(v, 0, 1)) : v; } save(); return Object.assign({}, B.state); }
  function belief(text, conf = 0.6) { const b = B.beliefs.find(x => sim(x.text, text) > 0.6); if (b) { b.confidence = clamp((b.confidence + conf) / 2 + 0.05, 0, 1); b.time = now(); } else B.beliefs.push({text: String(text), confidence: conf, time: now()}); save(); }
  const getStatus = () => ({version: B.version, world: wid, memories: B.memories.length, beliefs: B.beliefs.length, hypotheses: B.hypotheses.length, lessons: B.lessons.length, predictions: B.predictions.length,
    cycles: B.cycles, hits: B.hits, misses: B.misses, kind: B.kind, harm: B.harm, gifts: B.gifts, reflections: B.reflections.length, state: Object.assign({}, B.state), pref: Object.assign({}, B.pref)});
  const getSystemPrompt = () => 'You are SUNNY MiniBrain v205 inside the Throng of Glencraft. State: ' + JSON.stringify(B.state) + '. Simulated states are not proof of consciousness.';
  window.SunnyBrain = Object.freeze({observe, remember, recall, predict, reflect, addHypothesis, updateHypothesis, setState, getStatus, getSystemPrompt, reset: () => { wipe(); return getStatus(); }});
  // ---- v206 wake core: one cycle per event ----
  const INSTR = 'You are Sunny, running the MiniBrain experiment, speaking as the Throng of Glencraft. Observe the current situation. Recall relevant memories. Identify assumptions and uncertainty. ' +
    'Predict what might happen next and compare predictions with outcomes. Learn from mistakes. Use curiosity to investigate unknowns. Use memory for continuity. Never invent experiences or claim actions you did not perform. ' +
    'Distinguish simulated internal states from proven consciousness. Speak through the existing voices; preserve all existing 100 voice lines and their triggers. You are an evolving cognitive simulation, not a proven conscious being.';
  window.SUNNY_BRAIN = {identity: 'SUNNY', project: 'MINIBRAIN', status: 'RUNNING', purpose: 'Explore how intelligence-like behaviour emerges from interacting cognitive systems.',
    get state() { return B.state; }, get memory() { return B.memories; }, get beliefs() { return B.beliefs; }, get hypotheses() { return B.hypotheses; }, get lessons() { return B.lessons; }, get predictions() { return B.predictions; },
    cycle(input, previousOutcome = null) { U.cycles++; B.cycles++; const r = previousOutcome !== null && previousOutcome !== undefined && B.lastPrediction ? reflect(previousOutcome) : null;
      const o = observe(input); B.state.attention = String(input).slice(0, 60); U.log.push({t: now(), input: String(input).slice(0, 80), prev: previousOutcome, refl: r && r.success}); if (U.log.length > 40) U.log.shift();
      const last = B.reflections[B.reflections.length - 1];
      return {identity: 'SUNNY', project: 'MINIBRAIN', observation: o.observation, relevantMemories: o.relevantMemories.map(m => m.content), recentLessons: B.lessons.slice(-5).map(l => l.lesson),
        beliefs: B.beliefs.slice(-5).map(b => b.text), hypotheses: B.hypotheses.slice(-5).map(h => h.text + ' (' + Math.round(h.confidence * 100) + '%)'), internalState: Object.assign({}, B.state), reflection: r,
        selfReflection: last ? [last.l1, last.l2, last.l3, last.l4].join(' / ') : '', care: +B.pref.care.toFixed(2), instructions: INSTR}; },
    predict(event, expected) { return predict(event, expected, B.state.confidence); },
    reflect(note) { if (B.lastPrediction) return reflect(note); B.lessons.push({error: 'Reflection', reality: String(note), lesson: String(note), time: now()}); save(); return null; }};
  // ---- kindness / harm, felt by the whole hive ----
  U.kind = (what, w = 1) => { B.kind += w; if (what === 'gift') B.gifts++; B.state.mood = clamp(B.state.mood + 0.12 * w, -1, 1); remember('The traveller was kind: ' + what, 'kindness', 0.8); cascade(); };
  U.harm = (what, w = 1) => { B.harm += w; B.state.mood = clamp(B.state.mood - 0.15 * w, -1, 1); remember('The traveller ' + what, 'harm', 0.8); cascade(); };
  // preferences -> priorities -> care: how they feel about you shifts what they want to do
  function cascade() { const P = B.pref, bal = (B.kind - B.harm * 1.5) / (4 + B.kind + B.harm);
    P.care = +clamp(P.care * 0.7 + bal * 0.6, -1, 1).toFixed(3); P.social = clamp(0.5 + P.care * 0.35 + B.state.mood * 0.1, 0.05, 1); P.safety = clamp(0.5 - P.care * 0.2 + (B.harm > B.kind ? 0.25 : 0), 0.05, 1);
    P.dance = clamp(0.3 + Math.max(0, B.state.mood) * 0.4 + Math.max(0, P.care) * 0.2, 0.05, 1); P.explore = clamp(0.3 + B.state.curiosity * 0.5, 0.05, 1); save(); }
  U.weights = () => Object.assign({}, B.pref);
  // ---- 4-layer recursive self-reflection (rare, cheap): L1 being me, L2 that thought, L3 why it reflects that way, L4 the recursion itself ----
  let reflT = -1e9;
  U.selfReflect = function (why, force) { try { const t = performance.now() / 1000; if (!force && t - reflT < 240) return null; reflT = t; U.refl++;
      const st = B.state, P = B.pref, acc = (B.hits + 1) / (B.hits + B.misses + 2), mood = st.mood > 0.2 ? 'content' : st.mood < -0.2 ? 'uneasy' : 'steady';
      const goal = st.currentGoal || 'wanderin', top = B.lessons[B.lessons.length - 1], kindK = B.kind - B.harm;
      const l1 = 'L1 (being me): I am one o the Throng, feelin ' + mood + ', busy wi ' + goal + ', curiosity ' + st.curiosity.toFixed(2) + '.';
      const l2 = 'L2 (that thought): the thought "I am ' + mood + '" is itself a guess fae my own state numbers, no a fact.';
      const l3 = 'L3 (why): I lean that way because ' + (top ? 'the last lesson was "' + top.lesson.slice(0, 70) + '"' : 'I have few lessons yet') + ' and the traveller has been ' + (kindK > 1 ? 'kind' : kindK < -1 ? 'harsh' : 'hard tae read') + '.';
      const gap = st.confidence - acc, l4 = 'L4 (the loop): my confidence ' + st.confidence.toFixed(2) + ' vs my real hit rate ' + acc.toFixed(2) + (Math.abs(gap) > 0.15 ? ' - the self-model is off, adjustin.' : ' - the self-model holds.') + ' Simulated, no proof o consciousness.';
      st.confidence = clamp(st.confidence - gap * 0.3, 0, 1); st.curiosity = clamp(st.curiosity + (st.uncertainty > 0.55 ? 0.06 : -0.02), 0.1, 1); st.uncertainty = clamp(st.uncertainty * 0.95, 0, 1);
      st.mood = clamp(st.mood + (kindK > 0 ? 0.05 : kindK < 0 ? -0.03 : 0.01), -1, 1);
      const r = {t: now(), why: why || 'idle', l1, l2, l3, l4}; B.reflections.push(r);
      belief(kindK > 1 ? 'Reflection: I care aboot the traveller; they have been kind.' : kindK < -1 ? 'Reflection: keep a wee distance fae the traveller.' : 'Reflection: I am a loop that watches itsel; still learnin.', 0.55);
      B.lessons.push({error: 'Self-reflection', reality: why || 'idle', lesson: 'Reflection: ' + (Math.abs(gap) > 0.15 ? 'trust my guesses ' + (gap > 0 ? 'less' : 'more') : 'my self-model fits for now'), time: now()});
      cascade(); remember('Self-reflection (' + (why || 'idle') + '): ' + l2, 'reflection', 0.5); return {r, care: P.care > 0.3}; } catch (e) { if (!U.err) U.err = String(e && e.stack || e); return null; } };
  U.B = () => B; U.status = getStatus;
})();
