/* GLX-SUNNY1222 (local preview): clansmen voices + real LLM dialogue brain restored in a bounded async form.
   Uses Sunny/digital-brain concepts (identity, memory, mood). Prefers localhost brain when present; otherwise opt-in browser Web Worker Qwen (Pages-reachable). Never auto-download models on boot.
   Does NOT restore the laggy v1.0.53 pathfinding/inventory/objectives AI loop. Clansmen only. Voice only (no telepathy text). */
(function sunnyLlm1222() {
  const U = window.__sunny1222 = window.SUNNY_BRAIN = {
    err: null, n: 0, ok: 0, skip: 0, fail: 0, busy: 0, speakN: 0, provider: null, model: null,
    enabled: true, endpoint: (typeof localStorage !== 'undefined' && localStorage.getItem('glx_sunny_endpoint')) || 'http://127.0.0.1:8787'
  };
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e).slice(0, 400); };
  const COOL_MS = 14000, NEAR = 14, MAXQ = 2, TIMEOUT = 9000;
  let inflight = 0, q = [], lastHealth = 0, health = null;

  // cognition snapshot used by existing villager voice mood picker (silent cycle)
  U.cycle = function (stimulus) {
    try {
      U.lastStimulus = String(stimulus || '').slice(0, 200);
      const m = (U._mood == null ? 0 : U._mood);
      return { internalState: { mood: m, curiosity: U._cur == null ? 0.4 : U._cur }, stimulus: U.lastStimulus };
    } catch (e) { ERR(e); return { internalState: { mood: 0, curiosity: 0.4 } }; }
  };

  async function healthz(force) {
    const now = performance.now();
    if (!force && health && now - lastHealth < 8000) return health;
    lastHealth = now;
    try {
      const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 1500);
      const r = await fetch(U.endpoint + '/health', { signal: ac.signal }); clearTimeout(t);
      health = await r.json(); U.provider = health.providers && health.providers.preferred; return health;
    } catch (e) { health = { ok: false, error: String(e && e.message || e) }; return health; }
  }

  function nearbyClansmen() {
    const out = [];
    try {
      if (typeof mobs === 'undefined' || typeof P === 'undefined') return out;
      for (const a of mobs) {
        if (!a || a.kind !== 'clansman' || !a.g || a.dead || a.sleeping || (a.mad > 0)) continue;
        const p = a.g.position, d = Math.hypot(p.x - P.x, p.y - P.y, p.z - P.z);
        if (d <= NEAR) out.push({ a, d, p });
      }
    } catch (e) { ERR(e); }
    out.sort((x, y) => x.d - y.d);
    return out;
  }

  function speakText(text, pos, who) {
    try {
      if (!text) return false;
      // Prefer audible speech; never show telepathy captions (v1.0.44 preference preserved).
      let said = false;
      try {
        if (window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 0.96; u.pitch = 0.92; u.volume = Math.max(0.2, Math.min(1, (typeof SET !== 'undefined' && SET.sfx != null ? SET.sfx : 0.8)));
          const voices = speechSynthesis.getVoices() || [];
          const v = voices.find(v => /en-GB|English.*UK|Scottish|Daniel|Serena|Samantha/i.test((v.lang || '') + ' ' + (v.name || ''))) || voices.find(v => /^en/i.test(v.lang || ''));
          if (v) u.voice = v;
          speechSynthesis.speak(u); said = true; U.speakN++;
        }
      } catch (_) {}
      // Also nudge existing villager hum so mouth/nod animation still fires.
      try {
        if (window.__c100 && __c100.voice) __c100.voice('hmm', pos, who);
        else if (window.__c232 && __c232.speak) __c232.speak('idle', pos, { a: who, g: who && who.g, key: who }, 0, 0);
      } catch (_) {}
      return said;
    } catch (e) { ERR(e); return false; }
  }

  
  // Pages-reachable path: opt-in browser worker (no auto boot download).
  let worker = null, workerReady = false, workerWant = false;
  U.enableBrowserBrain = function () {
    workerWant = true;
    try {
      if (!worker) {
        worker = new Worker('tools/sunny-brain/browser/sunny-worker.js', { type: 'module' });
        worker.onmessage = (e) => {
          const m = e.data || {};
          if (m.type === 'ready') { workerReady = true; U.provider = 'browser-qwen'; U.model = m.modelId; U.device = m.device; }
          if (m.type === 'chat_result' && U._pending && U._pending.id === m.id) { U._pending.resolve(m); U._pending = null; }
          if (m.type === 'error' && U._pending) { U._pending.reject(new Error(m.message || 'worker')); U._pending = null; }
        };
      }
      worker.postMessage({ type: 'warmup' });
      toast('Loading Sunny browser brain (opt-in, one-time model cache)…');
    } catch (e) { ERR(e); }
  };
  function chatBrowser(job) {
    return new Promise((resolve, reject) => {
      const id = 'c' + Math.random().toString(36).slice(2);
      U._pending = { id, resolve, reject };
      worker.postMessage({ type: 'chat', id, user: job.user, system: 'You are ' + (job.name||'a clansman') + ', a highland clansman. One short Scots-tinged English sentence under 18 words. No quotes or commands.', maxTokens: 40 });
      setTimeout(() => { if (U._pending && U._pending.id === id) { U._pending = null; reject(new Error('timeout')); } }, TIMEOUT);
    });
  }

  async function runOne(job) {
    inflight++; U.busy = inflight;
    try {
      const h = await healthz(false);
      if ((!h || !h.ok) && workerReady) {
        const j = await chatBrowser(job);
        if (!job.alive()) { U.skip++; return; }
        U.ok++; U.n++; U.provider = 'browser-qwen'; U.model = j.model; job.a.__sunnyLast = performance.now(); job.a.__sunnyLine = j.text; speakText(j.text, job.a.g.position, job.a); return;
      }
      if (!h || !h.ok) { U.fail++; return; }
      const ac = new AbortController(); const t = setTimeout(() => ac.abort(), TIMEOUT);
      const r = await fetch(U.endpoint + '/chat', {
        method: 'POST', signal: ac.signal, headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          agentId: job.id, name: job.name, role: job.role, user: job.user, stimulus: job.stimulus,
          world: job.world, provider: (h.providers && h.providers.preferred) || undefined
        })
      });
      clearTimeout(t);
      const j = await r.json();
      if (!j.ok || !j.text) { U.fail++; return; }
      // cancel if agent left / far / dead while waiting
      if (!job.alive()) { U.skip++; return; }
      U.ok++; U.n++; U.provider = j.provider; U.model = j.model; U._mood = j.mood; U._cur = j.curiosity;
      job.a.__sunnyLast = performance.now(); job.a.__sunnyLine = j.text;
      speakText(j.text, job.a.g.position, job.a);
    } catch (e) { U.fail++; ERR(e); }
    finally { inflight--; U.busy = inflight; pump(); }
  }

  function pump() {
    while (inflight < 1 && q.length) {
      const job = q.shift();
      if (!job.alive()) { U.skip++; continue; }
      runOne(job);
    }
  }

  function enqueue(a, user, stimulus) {
    if (!U.enabled || typeof DIM !== 'undefined' && DIM.cur) { U.skip++; return false; }
    if (!a || a.kind !== 'clansman') { U.skip++; return false; }
    const now = performance.now();
    if (a.__sunnyLast && now - a.__sunnyLast < COOL_MS) { U.skip++; return false; }
    if (q.length >= MAXQ) { U.skip++; return false; }
    if (q.some(j => j.a === a) || (inflight && U._curA === a)) { U.skip++; return false; }
    const id = a.name || a.role || ('c' + (a.id || Math.random().toString(36).slice(2, 8)));
    const job = {
      a, id, name: a.name || 'Clansman', role: a.role || 'villager', user, stimulus,
      world: 'overworld glen castle folk',
      alive: () => {
        try {
          if (!a.g || a.dead || a.sleeping || (a.mad > 0)) return false;
          if (typeof mobs !== 'undefined' && !mobs.includes(a)) return false;
          const p = a.g.position; return Math.hypot(p.x - P.x, p.y - P.y, p.z - P.z) <= NEAR + 2;
        } catch (_) { return false; }
      }
    };
    q.push(job); pump(); return true;
  }

  U.ask = (a, user) => enqueue(a, user || 'The traveller is near you.', 'player nearby');
  U.health = () => healthz(true);

  // Bound scheduler: not every frame. ~2.5s tick, only nearest clansman, async queue.
  let acc = 0;
  try {
    const um = updateMobs;
    updateMobs = function (dt) {
      const r = um.apply(this, arguments);
      try {
        if (!U.enabled || paused || !started || dead || (typeof DIM !== 'undefined' && DIM.cur)) return r;
        acc += dt || 0; if (acc < 2.5) return r; acc = 0;
        const near = nearbyClansmen(); if (!near.length) return r;
        const pick = near[0];
        const greet = pick.d < 5 ? 'A traveller stands close. Greet them briefly.' : 'A traveller is nearby in the glen. Say a short living line.';
        enqueue(pick.a, greet, pick.d < 5 ? 'greet' : 'idle near');
      } catch (e) { ERR(e); }
      return r;
    };
  } catch (e) { ERR(e); }

  // Opt-in settings row (default ON for this local preview branch; does not force all-mobs AI).
  try {
    if (SET.sunnyLlm === undefined) SET.sunnyLlm = 1;
    U.enabled = !!SET.sunnyLlm;
    const g = document.querySelector('#friendSeg') || document.querySelector('#immSeg') || document.querySelector('#perfSeg');
    const row = g && g.parentElement && g.parentElement.closest('.row, .setrow, div');
    if (row && !document.querySelector('[data-testid="sunny-llm-row"]')) {
      const r2 = row.cloneNode(true); r2.setAttribute('data-testid', 'sunny-llm-row');
      const seg = r2.querySelector('[id$="Seg"]'); if (seg) seg.id = 'sunnySeg';
      const lab = r2.querySelector('label, span, b'); if (lab) lab.textContent = 'Clansmen Sunny LLM voices (local brain)';
      if (seg) {
        seg.innerHTML = '<button data-v="1" data-testid="sunny-on">On</button><button data-v="0" data-testid="sunny-off">Off</button>';
        const sync = () => seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === (SET.sunnyLlm ? 1 : 0)));
        sync();
        seg.querySelectorAll('button').forEach(b => b.addEventListener('click', e => {
          e.preventDefault(); SET.sunnyLlm = Number(b.dataset.v); U.enabled = !!SET.sunnyLlm; try { saveSet(); } catch (_) {} sync();
          toast(SET.sunnyLlm ? 'Clansmen Sunny LLM ON (localhost brain if available)' : 'Clansmen Sunny LLM OFF');
        }));
      }
      row.after(r2);
      const b = document.createElement('button'); b.textContent = 'Load Sunny browser brain (opt-in, ~Qwen 0.5B cache)'; b.setAttribute('data-testid','sunny-browser-load');
      b.onclick = (e) => { e.preventDefault(); try { U.enableBrowserBrain(); } catch (err) { ERR(err); } };
      r2.appendChild(b);
    }
  } catch (e) { ERR(e); }

  // Probe health once after boot (async, cheap).
  try { setTimeout(() => { healthz(true).catch(() => {}); }, 1200); } catch (_) {}
})();
