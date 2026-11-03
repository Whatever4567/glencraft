/* ===================== GLX-C212 (v1.0.45): the people speak real words - Scots voice clips (two piper voices, eerie shimmer, a pitch of their own each), lines composed from what is
   going on right now (what you hold, dig, build, the time, weather, your health, where you are, mobs about, what the hive remembers and has learned), never the same line twice in a while,
   wee conversations between them, and an optional AI voice (Chrome's built-in model, or your own OpenAI-style key kept only on this device). Every line runs one SUNNY_BRAIN.cycle. ===================== */
(function c212() {
  const U = window.__c212 = {n: 0, clips: 0, tts: 0, ai: 0, aiTry: 0, aiFail: 0, conv: 0, rep: 0, cyc: 0, err: null, last: '', lastText: '', said: [], loaded: 0, aiLog: []};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e); };
  const SM = window.__SM, TX = window.__SMT, BASE = {}; let o = 0; SM.k.forEach((k, i) => { BASE[k] = o; o += SM.n[i]; }); const NK = {}; SM.k.forEach((k, i) => NK[k] = SM.n[i]);
  const tx = f => TX[BASE[f[0]] + f[1]] || '';
  // ---- the clips: fetched + decoded the first time someone talks ----
  const BUF = {}; let fetching = 0;
  function loadClips() { if (fetching || !window.AC) return; fetching = 1;
    for (const v of ['m', 'f']) fetch('assets/sfx/hive_' + v + '.mp3').then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status)).then(a => AC.decodeAudioData(a)).then(b => { BUF[v] = b; U.loaded++; }).catch(e => { U.loadErr = String(e); }); }
  const vo = q => { const k = q && q.key; if (!k) return {v: 'm', r: 1, p: 1}; if (!k.__v2) { let h = 7; const s = String(k.name || k.role || '') + (k.id || '') + (k.who || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; h >>>= 0;
      const f = q.f ? (h % 3 === 0) : (h % 5 === 0); k.__v2 = {v: f ? 'f' : 'm', r: 0.9 + (h % 997) / 997 * 0.2, p: 0.75 + ((h >> 10) % 991) / 991 * 0.55}; } return k.__v2; };
  function playClips(line, q, vol, pan) { const V = vo(q), b = BUF[V.v] || BUF.m || BUF.f; if (!b) return 0; const M = SM[b === BUF.f ? 'f' : 'm'];
    const out = (window.mobOut || outNode)(vol, pan); let t = AC.currentTime + 0.03;
    for (const f of line) { const j = (BASE[f[0]] + f[1]) * 2, st = M[j] / 1000, du = M[j + 1] / 1000; const s = AC.createBufferSource(); s.buffer = b; s.playbackRate.value = V.r; s.connect(out); s.start(t, st, du + 0.02); t += du / V.r + 0.07; }
    U.clips++; return t; }
  // ---- Web Speech: the fallback, and the voice for AI replies ----
  let SV = null; const voice = () => { try { if (SV) return SV; const vs = speechSynthesis.getVoices(); SV = vs.find(v => /scot/i.test(v.name + v.lang)) || vs.find(v => /en-GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null; return SV; } catch (_) { return null; } };
  function speakTTS(text, q, vol) { try { if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return 0; if (speechSynthesis.speaking && speechSynthesis.pending) return 0; const u = new SpeechSynthesisUtterance(text), v = voice();
      if (v) u.voice = v; u.lang = v ? v.lang : 'en-GB'; u.pitch = Math.max(0.5, Math.min(1.8, vo(q).p)); u.rate = 0.95; u.volume = Math.max(0.05, Math.min(1, vol * 1.8 * (SET.mobVol != null ? SET.mobVol : 1))); speechSynthesis.speak(u); U.tts++;
      return AC.currentTime + 0.6 + text.length * 0.065; } catch (e) { ERR(e); return 0; } }
  // ---- what is going on right now ----
  const HOST = {zombie: 0, skeleton: 1, blackskel: 1, blazeskel: 1, creeper: 2, spider: 3, nspider: 3, sheep: 4, cow: 5, coo: 5, pig: 6, ghost: 7, imp: 8, hound: 8, creak: 8};
  const ri = n => (Math.random() * n) | 0, pickC = c => [c, ri(NK[c])];
  function heldIdx() { try { if (!(cnt(selId) > 0)) return 19; const n = String(NAMES[selId] || '').toLowerCase();
      const R = [[/pick/, 0], [/axe/, 1], [/sword|blade|claymore|dirk/, 2], [/shovel|spade/, 3], [/torch|lantern/, 4], [/bow|rifle|musket/, 5], [/bread|piece/, 6], [/meat|beef|pork|mutton|haggis|chicken|fish|steak/, 7], [/bucket/, 8],
        [/stone|cobble|brick|slate/, 9], [/log|plank|wood/, 10], [/dirt|grass|mud|peat/, 11], [/diamond/, 12], [/coal/, 13], [/iron/, 14], [/gold/, 15], [/flower|daisy|dandelion|daffodil|bluebell|rose|tulip|thistle|sunflower|lavender/, 16], [/seed/, 17], [/hoe/, 18], [/glass/, 21]];
      for (const [r, i] of R) if (r.test(n)) return i; return 20; } catch (_) { return 20; } }
  function timeIdx() { try { if (isNight) return Math.random() < 0.6 ? 1 : 0; const e = sunDisc.position.y - camera.position.y; return e > 70 ? 5 : e > 25 ? 3 : e > 0 ? (Math.random() < 0.5 ? 2 : 4) : 4; } catch (_) { return 3; } }
  function wxIdx() { try { if (window.__snowWx && __snowWx()) return 1; const t = weather.type; return t === 'thunder' ? (Math.random() < 0.5 ? 4 : 2) : t === 'light' || t === 'rain' || t === 'heavy' ? 0 : 3; } catch (_) { return 3; } }
  function hpIdx() { try { if (food <= 4) return 4; if (hp <= 6) return Math.random() < 0.5 ? 0 : 5; if (hp <= 12) return 1; if (food <= 8) return 2; if (hp >= 18) return 3; } catch (_) {} return -1; }
  function biomeIdx() { try { if (window.__snowWx && __snowWx()) return 6; const gy = groundTop(Math.floor(P.x), Math.floor(P.z)); if (P.y < gy - 5) return 7; if (P.y > SEA + 34) return 1;
      const b = getB(Math.floor(P.x), Math.floor(P.y) - 1, Math.floor(P.z)); if (b === T.SAND) return 2; if (b === T.MUD || b === T.PEAT) return 3; let lv = 0; for (let i = 0; i < 6; i++) { const x = Math.floor(P.x + Math.cos(i) * 5), z = Math.floor(P.z + Math.sin(i) * 5); for (let y = 2; y < 9; y += 2) if (LEAFY[getB(x, Math.floor(P.y) + y, z)]) { lv++; break; } }
      return lv >= 3 ? 0 : (Math.random() < 0.5 ? 5 : 4); } catch (_) { return 5; } }
  function mobNear(p) { let b = null, bd = 14; try { for (const m of mobs) { if (!m || m.dead || !m.g || HOST[m.kind] == null) continue; const d = Math.hypot(m.g.position.x - p.x, m.g.position.z - p.z); if (d < bd) { bd = d; b = m; } } } catch (_) {}
    if (!b) return null; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), dx = b.g.position.x - P.x, dz = b.g.position.z - P.z, dd = Math.hypot(dx, dz); return [HOST[b.kind], dd < 5 ? 2 : (dx * fx + dz * fz) < 0 ? 1 : 0, b]; }
  // ---- composing a line (fragments) from the state and the brain's cycle ----
  const VB = {trade: 0, strike: 1, mine: 2, build: 3, leave: 4, chop: 5, sleep: 6, explore: 7};
  function stateLines(q, ctx) { const L = [], st = window.__c210 && __c210.M ? __c210.M() : {}, B = window.__c211 ? __c211.B() : {}; const p = q && q.g ? q.g.position : P;
    const h = heldIdx(); L.push([['sub_hold', ri(2)], ['item', h], pickC('tail')]); if (h !== 19) L.push([['hold_q', ri(2)], ['item', h]]);
    if ((st.deep || 0) > 4 || (st.mined || 0) > 20) L.push([['sub_dig', ri(2)], ['dig', st.deep > 10 ? 0 : (st.ores || 0) > 3 ? 1 + ri(3) : 4 + ri(2)]]);
    if ((st.chopped || 0) > 2) L.push([['sub_chop', ri(2)], ['qty', st.chopped > 40 ? 2 : st.chopped > 10 ? 1 : 0]]);
    if ((st.built || 0) > 6) L.push([['sub_build', ri(2)], ['build', st.built > 80 ? 2 : ri(4)]]);
    L.push([pickC('open'), ['time', timeIdx()]], [['weather', wxIdx()]]); const hi = hpIdx(); if (hi >= 0) L.push([pickC('open'), ['health', hi]]);
    L.push([['sub_in', ri(2)], ['biome', biomeIdx()], pickC('biome_c')]); const mn = mobNear(p); if (mn) L.push([['there', 0], ['mob', mn[0]], ['where', mn[1]]]);
    try { if (isNight) L.push([['night', ri(4)]]); } catch (_) {}
    const kind = (B.kind || 0) + (st.kind || 0), harm = (B.harm || 0) + (st.harm || 0); if (kind > 0 || harm > 0) L.push([['mind', 0], ['mem', harm > kind ? 1 : kind > 2 ? 4 : 0]], [['mem2', harm > kind ? (ri(2) ? 1 : 2) : kind > 0 ? 0 : 3]]);
    const ls = ctx && ctx.recentLessons || []; if (ls.length) { const t = ls[ls.length - 1]; L.push([pickC('lpre'), ['lesson', /kind/i.test(t) ? 3 : /dark|night/i.test(t) ? 4 : /mine|dig/i.test(t) ? 5 : /failed/i.test(t) ? (ri(2) ? 0 : 2) : 1]]); }
    const hy = B.hypotheses || []; if (hy.length) { const hh = hy[ri(hy.length)], j = TXH.findIndex(s => hh.text.includes(s)); if (j >= 0) L.push([pickC('hpre'), ['hyp', j], ['hupd', hh.confidence > 0.7 ? 0 : hh.confidence < 0.3 ? 1 : 2 + ri(2)]]); }
    if (B.lastPrediction && VB[B.lastPrediction.expected] != null) L.push([pickC('pre'), ['subj', 0], ['verb', VB[B.lastPrediction.expected]], ['conf', B.state.confidence > 0.65 ? 0 : B.state.confidence > 0.4 ? 1 : 2]]);
    if (Math.random() < 0.15) L.push([pickC('self')]); return L; }
  const TXH = Array.from({length: NK.hyp}, (_, i) => tx(['hyp', i]));
  function thoughtLine(t) { if (!t) return null; let m;
    if (/Prediction failed|assumed wrang|surprised us|Model wrang/.test(t)) return [pickC('fail')]; if (/As predicted|Correct again|model holds/i.test(t)) return [pickC('ok')];
    if ((m = /ye'll ([a-z ]+)\./i.exec(t))) { const v = {trade: 0, strike: 1, 'go minin': 2, build: 3, leave: 4}[m[1]]; if (v != null) return [pickC('pre'), ['subj', 0], ['verb', v], ['conf', /high/.test(t) ? 0 : /medium/.test(t) ? 1 : 2]]; }
    if (/Unknown|Insufficient/.test(t)) return [pickC('unk')]; if (/Sentience|alive|therefore|Self-model/.test(t)) return [pickC('self')]; if (/Back again|Visit number/.test(t)) return [['mem2', 3]];
    if (/kind|traded fair/i.test(t)) return [['mem2', 0]]; if (/struck|distance|anger|forgive/i.test(t)) return [['mem2', ri(2) ? 1 : 2]]; if (/diggin deep|stane an dark/.test(t)) return [['sub_dig', 0], ['dig', 0]];
    if (/trees/.test(t)) return [['sub_chop', 0], ['qty', 1]]; if (/build|structure/.test(t)) return [['sub_build', 0], ['build', ri(4)]]; if (/Shiny|glowin/.test(t)) return [['sub_dig', 0], ['dig', 3]];
    if (/dark|Night/.test(t)) return [['night', ri(4)]]; if (/hurt|health/i.test(t)) return [['health', 1]]; if (/hungry|belly/i.test(t)) return [['health', 2]]; return null; }
  // ---- never the same line again within ~50 lines or ~20 minutes (kept per world, with the hive's memory) ----
  const ring = () => { const B = window.__c211 && __c211.B(); if (!B) return U.said; if (!Array.isArray(B.said)) B.said = []; return B.said; };
  const keyOf = line => line.map(f => f[0] + f[1]).join('.');
  function fresh(line) { const R = ring(), k = keyOf(line), t = Date.now(); for (let i = Math.max(0, R.length - 50); i < R.length; i++) if (R[i][0] === k && t - R[i][1] < 20 * 60000) return false; return true; }
  function mark(line) { const R = ring(); R.push([keyOf(line), Date.now()]); if (R.length > 60) R.splice(0, R.length - 60); }
  function choose(c) { for (const l of c) if (fresh(l)) return l; U.rep++; const R = ring(); let best = c[0], bt = 1e18; for (const l of c) { const k = keyOf(l); let t = 0; for (const r of R) if (r[0] === k) t = r[1]; if (t < bt) { bt = t; best = l; } } return best; }
  const shuf = a => { for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const PM = {idle: 'p_idle', greet: 'p_greet', question: 'p_question', agree: 'p_agree', disagree: 'p_disagree', curious: 'p_curious', alarm: 'p_alarm', farewell: 'p_farewell', trade: 'p_trade', thanks: 'p_thanks', hurt: 'p_hurt', death: 'p_death'};
  let lastQ = 0;
  function compose(mood, q, ctx, conv) { const pc = PM[mood] || 'p_idle', ph = shuf(Array.from({length: NK[pc]}, (_, i) => [[pc, i]]));
    if (conv && mood === 'question') { lastQ = Date.now(); return choose(shuf(Array.from({length: NK.cq}, (_, i) => [['cq', i]])).concat(ph)); }
    if (conv && Date.now() - lastQ < 6000 && /agree|disagree|curious|idle/.test(mood)) { lastQ = 0; return choose(shuf(Array.from({length: NK.ca}, (_, i) => [['ca', i]])).concat(ph)); }
    if (mood === 'hurt' && ctx && Math.random() < 0.35) return choose(shuf(Array.from({length: NK.hive}, (_, i) => [['hive', i]])).concat(ph));
    if (mood === 'alarm') { const mn = mobNear(q && q.g ? q.g.position : P); if (mn) return choose([[['there', 0], ['mob', mn[0]], ['where', mn[1]]]].concat(ph)); }
    if (/idle|greet|curious|question/.test(mood) && Math.random() < 0.6) return choose(shuf(stateLines(q, ctx)).concat(ph));
    return choose(ph); }
  // ---- the talk hook GLX-C209 calls for every line (after its own distance / 3-voice / spacing checks) ----
  U.forced = null; U.outcome = null;
  U.talk = function (mood, q, vol, pan, d) { try { if (!SM || !AC) return 0; loadClips(); const ev = 'Event: ' + mood + (q && q.key && q.key.name ? ' (' + q.key.name + ')' : '') + (d != null ? ', traveller ' + Math.round(d) + ' blocks away' : '');
      const prev = U.outcome; U.outcome = null; const ctx = window.SUNNY_BRAIN ? SUNNY_BRAIN.cycle(ev, prev) : null; U.cyc++; U.ctx = ctx;
      let line = U.forced; U.forced = null; if (!line && U.thought && window.__c210) line = thoughtLine(__c210.state().pend[0]); if (!line) line = compose(mood, q, ctx, !!U.conv0);
      const text = line.map(tx).join(' '); mark(line); U.n++; U.last = keyOf(line); U.lastText = text;
      try { if (window.__c211 && ctx) __c211.B().memories.slice(-1)[0].content += ' | said: ' + text.slice(0, 90); } catch (_) {}
      const near = d != null && d < 8, ai = near && /greet|trade|thanks|hurt|alarm|question|curious/.test(mood) ? cachedAI(ev) : null;
      if (ai) { const e = speakTTS(ai, q, vol); if (e) { U.lastText = ai; return e; } }
      if (near && ctx && /greet|trade|thanks|hurt|alarm/.test(mood)) sunnyReply(ev, ctx, q);
      return playClips(line, q, vol, pan) || speakTTS(text, q, vol); } catch (e) { ERR(e); return 0; } };
  const s0 = window.__c209 && __c209.speak; if (s0) __c209.speak = function () { U.thought = 1; try { return s0.apply(this, arguments); } finally { U.thought = 0; } };
  U.speakRaw = s0;
  // say a set line (goals, reflections, gifts) through the same voice caps
  U.say = function (cat, q, mood, i) { try { if (!window.__c209 || !q || !q.g || !NK[cat]) return 0; U.forced = [[cat, i != null ? i : ri(NK[cat])]]; const r = s0 ? s0(mood || 'agree', q.g.position, q, 1) : 0; U.forced = null; return r; } catch (e) { ERR(e); return 0; } };
  U.text = line => line.map(tx).join(' '); U.compose = compose;
  // ---- sunnyReply: cycle -> system prompt -> gameAI -> remember ----
  const AIC = new Map(); let aiT = -1e9, aiBusy = 0;
  const cachedAI = ev => { const c = AIC.get(ev.replace(/, traveller.*$/, '')); return c && Date.now() - c.t < 120000 && !c.used ? (c.used = 1, c.r) : null; };
  const cfg = () => { try { return JSON.parse(localStorage.getItem('glx_ai_voice') || 'null'); } catch (_) { return null; } };
  function sysPrompt(ctx) { const g = {time: tx(['time', timeIdx()]), weather: tx(['weather', wxIdx()]), held: tx(['item', heldIdx()]), health: hp + '/20', food: food + '/20', place: tx(['biome', biomeIdx()])};
    return 'You are one of the Throng, the people of Glencraft (a Scottish block-building game), who share one hive mind. Reply in broad Glasgow Scots, 1-2 short sentences, friendly and a wee bit eerie, no emojis, never say you are an AI model. ' +
      'Game context: ' + JSON.stringify(g) + '. Hive mind (SUNNY MiniBrain): ' + JSON.stringify({memories: ctx.relevantMemories, lessons: ctx.recentLessons, beliefs: ctx.beliefs, hypotheses: ctx.hypotheses, state: ctx.internalState, selfReflection: ctx.selfReflection, care: ctx.care}) +
      '. Rules: ' + ctx.instructions + ' Simulated states are not proof of consciousness.'; }
  async function gameAI(sys, user) { const to = ms => new Promise((_, rj) => setTimeout(() => rj(new Error('timeout')), ms));
    try { if (window.LanguageModel && (await LanguageModel.availability()) === 'available') { const s = await Promise.race([LanguageModel.create({initialPrompts: [{role: 'system', content: sys}]}), to(4000)]);
        try { const r = await Promise.race([s.prompt(user), to(4000)]); if (r) return {r: String(r), via: 'chrome'}; } finally { try { s.destroy(); } catch (_) {} } } } catch (e) { U.lmErr = String(e); }
    const c = cfg(); if (c && c.url && c.key) { const ac = new AbortController(), tt = setTimeout(() => ac.abort(), 4000);
      try { const r = await fetch(c.url, {method: 'POST', signal: ac.signal, headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + c.key}, body: JSON.stringify({model: c.model || 'gpt-4o-mini', max_tokens: 60, temperature: 0.9, messages: [{role: 'system', content: sys}, {role: 'user', content: user}]})});
        const j = await r.json(); const t = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content; if (t) return {r: String(t), via: 'key'}; } catch (e) { U.keyErr = String(e); } finally { clearTimeout(tt); } }
    return null; }
  async function sunnyReply(eventText, ctx, q) { const t = performance.now(); if (aiBusy || t - aiT < 9000) return null; if (!window.LanguageModel && !(cfg() || {}).key) return null; aiBusy = 1; aiT = t; U.aiTry++;
    try { const r = await gameAI(sysPrompt(ctx), eventText); if (!r) { U.aiFail++; return null; } const reply = r.r.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).slice(0, 2).join(' ').slice(0, 160);
      AIC.set(eventText.replace(/, traveller.*$/, ''), {r: reply, t: Date.now()}); if (AIC.size > 30) AIC.delete(AIC.keys().next().value); U.ai++; U.aiLog.push(r.via);
      if (window.SunnyBrain) SunnyBrain.remember('Event: ' + eventText + '\nThrong: ' + reply, 'conversation', 0.6); return reply; } catch (e) { U.aiFail++; return null; } finally { aiBusy = 0; } }
  U.sunnyReply = sunnyReply; U.sysPrompt = sysPrompt;
  // ---- pause menu: optional "AI voice key" (stays on this device only) ----
  try { const ref = document.querySelector('#gfxSeg') || document.querySelector('#perfSeg'), row = ref && ref.parentElement && ref.parentElement.closest('.row, .setrow, div');
    if (row) { const r = document.createElement('div'); r.className = row.className; r.dataset.testid = 'ai-voice-row'; r.style.cssText = 'flex-wrap:wrap;gap:6px;align-items:center';
      r.innerHTML = '<span style="min-width:90px">AI voice key</span><input id="aiUrl" placeholder="https://.../v1/chat/completions" style="flex:1 1 160px;min-width:0"><input id="aiKey" type="password" placeholder="key" style="flex:1 1 90px;min-width:0"><input id="aiModel" placeholder="model" style="width:90px"><button id="aiSave">Save</button><button id="aiClear">Clear</button>';
      row.parentElement.appendChild(r); const c = cfg(); if (c) { r.querySelector('#aiUrl').value = c.url || ''; r.querySelector('#aiModel').value = c.model || ''; r.querySelector('#aiKey').placeholder = 'key saved'; }
      r.querySelector('#aiSave').onclick = () => { const url = r.querySelector('#aiUrl').value.trim(), key = r.querySelector('#aiKey').value.trim() || (cfg() || {}).key, model = r.querySelector('#aiModel').value.trim(); if (!url || !key) { toast('Enter the address and key'); return; }
        if (!confirm('Use this AI service for the people\'s voices?\n\nWhat they hear about the game is sent to ' + url.replace(/^https?:\/\//, '').split('/')[0] + '. The key is kept only on this device.')) return;
        localStorage.setItem('glx_ai_voice', JSON.stringify({url, key, model})); r.querySelector('#aiKey').value = ''; r.querySelector('#aiKey').placeholder = 'key saved'; toast('AI voice saved on this device'); };
      r.querySelector('#aiClear').onclick = () => { if (!confirm('Remove the AI voice key from this device?')) return; localStorage.removeItem('glx_ai_voice'); r.querySelector('#aiKey').placeholder = 'key'; toast('AI voice key removed'); }; } } catch (e) { ERR(e); }
})();
