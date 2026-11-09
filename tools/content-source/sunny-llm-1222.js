/* GLX-SUNNY1222 (local preview on 1.2.35): clansmen voices + real browser LLM brain.
   Pages-reachable opt-in Web Worker (Qwen2.5-0.5B). No auto boot download. No telepathy captions.
   Does NOT restore laggy v1.0.53 pathfinding/inventory/objectives AI. Clansmen only. */
(function sunnyLlm1222() {
  const U = window.__sunny1222 = window.SUNNY_BRAIN = {
    err: null, n: 0, ok: 0, skip: 0, fail: 0, quiet: 0, busy: 0, speakN: 0,
    provider: null, model: null, device: null, status: 'idle', progress: null,
    enabled: true, browserReady: false, bytesLabel: null
  };
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e).slice(0, 400); U.status = 'error'; setStatusUI(); };
  const COOL_MS = 14000, NEAR = 14, MAXQ = 2, TIMEOUT = 20000;
  let inflight = 0, q = [], worker = null, workerReady = false, pending = null, statusEl = null;

  U.cycle = function (stimulus) {
    try {
      U.lastStimulus = String(stimulus || '').slice(0, 200);
      return { internalState: { mood: U._mood || 0, curiosity: U._cur == null ? 0.4 : U._cur }, stimulus: U.lastStimulus };
    } catch (e) { ERR(e); return { internalState: { mood: 0, curiosity: 0.4 } }; }
  };

  function setStatusUI() {
    try {
      if (!statusEl) statusEl = document.querySelector('[data-testid="sunny-status"]');
      if (!statusEl) return;
      const parts = ['Sunny: ' + (U.status || 'idle')];
      if (U.bytesLabel) parts.push(U.bytesLabel);
      if (U.progress && U.progress.progress != null) parts.push(Math.round(U.progress.progress) + '%');
      if (U.device) parts.push(U.device);
      if (U.err) parts.push(String(U.err).slice(0, 80));
      statusEl.textContent = parts.join(' · ');
    } catch (_) {}
  }

  function workerUrl() {
    try {
      const base = document.querySelector('script[data-sunny-base]')?.getAttribute('data-sunny-base');
      if (base) return base.replace(/\/?$/, '/') + 'sunny-worker.js';
    } catch (_) {}
    return 'assets/sunny/sunny-worker.js';
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
      let said = false;
      try {
        if (window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 0.96; u.pitch = 0.92;
          u.volume = Math.max(0.2, Math.min(1, (typeof SET !== 'undefined' && SET.sfx != null ? SET.sfx : 0.8)));
          const voices = speechSynthesis.getVoices() || [];
          const v = voices.find(v => /en-GB|English.*UK|Scottish|Daniel|Serena|Samantha/i.test((v.lang || '') + ' ' + (v.name || '')))
            || voices.find(v => /^en/i.test(v.lang || ''));
          if (v) u.voice = v;
          speechSynthesis.speak(u); said = true; U.speakN++;
        }
      } catch (_) {}
      try {
        if (window.__c100 && __c100.voice) __c100.voice('hmm', pos, who);
        else if (window.__c232 && __c232.speak) __c232.speak('idle', pos, { a: who, g: who && who.g, key: who }, 0, 0);
      } catch (_) {}
      return said;
    } catch (e) { ERR(e); return false; }
  }

  function ensureWorker() {
    if (worker) return worker;
    worker = new Worker(workerUrl(), { type: 'module' });
    worker.onmessage = (e) => {
      const m = e.data || {};
      if (m.type === 'info') {
        U.bytesLabel = `WebGPU ~${m.sizes.webgpu_q4f16_MB}MB / WASM ~${m.sizes.wasm_q4_MB}MB (+tok)`;
        setStatusUI();
      }
      if (m.type === 'status') { U.status = m.status; U.bytesLabel = m.bytesLabel || U.bytesLabel; U.device = m.device; setStatusUI(); }
      if (m.type === 'progress') { U.progress = m.payload; U.status = 'loading'; setStatusUI(); }
      if (m.type === 'ready') {
        workerReady = true; U.browserReady = true; U.status = 'ready'; U.provider = 'browser-qwen';
        U.model = m.modelId; U.device = m.device; U.progress = null; setStatusUI();
        try { toast('Sunny browser brain ready'); } catch (_) {}
      }
      if (m.type === 'cancelled') { U.status = 'cancelled'; workerReady = false; U.browserReady = false; setStatusUI(); }
      if (m.type === 'chat_result' && pending && pending.id === m.id) { pending.resolve(m); pending = null; }
      if (m.type === 'error') {
        if (pending && (!m.id || pending.id === m.id)) { pending.reject(new Error(m.message || 'worker')); pending = null; }
        U.status = m.cancelled ? 'cancelled' : 'error'; U.err = m.message || U.err; setStatusUI();
      }
    };
    worker.onerror = (ev) => { U.status = 'error'; U.err = String(ev && ev.message || 'worker error'); setStatusUI(); };
    worker.postMessage({ type: 'info' });
    return worker;
  }

  U.enableBrowserBrain = function () {
    try {
      U.status = 'loading'; U.err = null; setStatusUI();
      ensureWorker().postMessage({ type: 'warmup' });
    } catch (e) { ERR(e); }
  };
  U.cancelBrowserBrain = function () {
    try {
      if (worker) {
        try { worker.postMessage({ type: 'cancel' }); } catch (_) {}
        try { worker.terminate(); } catch (_) {}
      }
      worker = null; workerReady = false; U.browserReady = false; pending = null; q.length = 0;
      U.status = 'cancelled'; U.progress = null; setStatusUI();
      try { toast('Sunny brain load cancelled'); } catch (_) {}
    } catch (e) { ERR(e); }
  };

  function chatBrowser(job) {
    return new Promise((resolve, reject) => {
      const id = 'c' + Math.random().toString(36).slice(2);
      pending = { id, resolve, reject };
      const system = `You are ${job.name || 'Hamish'}, a highland clansman (${job.role || 'villager'}). Speak aloud in first person. One short sentence under 16 words. Plain English with light Scots flavour is fine. No narration, no orders, no "alert the traveller".`;
      ensureWorker().postMessage({ type: 'chat', id, system, user: job.user, maxTokens: 36 });
      setTimeout(() => { if (pending && pending.id === id) { pending = null; reject(new Error('timeout')); } }, TIMEOUT);
    });
  }

  async function runOne(job) {
    inflight++; U.busy = inflight; setStatusUI();
    try {
      if (!workerReady) { U.skip++; return; }
      if (!job.alive()) { U.skip++; return; }
      const j = await chatBrowser(job);
      if (!job.alive()) { U.skip++; return; }
      if (!j.ok || !j.text) { U.quiet++; U.fail++; U.status = 'quiet'; setStatusUI(); return; }
      U.ok++; U.n++; U.provider = 'browser-qwen'; U.model = j.model; U.device = j.device; U._mood = 0;
      job.a.__sunnyLast = performance.now(); job.a.__sunnyLine = j.text;
      speakText(j.text, job.a.g.position, job.a);
      U.status = 'ready'; setStatusUI();
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
    if (!U.enabled || !workerReady) { U.skip++; return false; }
    if (typeof DIM !== 'undefined' && DIM.cur) { U.skip++; return false; }
    if (!a || a.kind !== 'clansman') { U.skip++; return false; }
    const now = performance.now();
    if (a.__sunnyLast && now - a.__sunnyLast < COOL_MS) { U.skip++; return false; }
    if (q.length >= MAXQ) { U.skip++; return false; }
    if (q.some(j => j.a === a)) { U.skip++; return false; }
    const job = {
      a, name: a.name || 'Hamish', role: a.role || 'villager', user, stimulus,
      alive: () => {
        try {
          if (!a.g || a.dead || a.sleeping || (a.mad > 0)) return false;
          if (typeof mobs !== 'undefined' && !mobs.includes(a)) return false;
          if (typeof DIM !== 'undefined' && DIM.cur) return false;
          const p = a.g.position; return Math.hypot(p.x - P.x, p.y - P.y, p.z - P.z) <= NEAR + 2;
        } catch (_) { return false; }
      }
    };
    q.push(job); pump(); return true;
  }

  U.ask = (a, user) => enqueue(a, user || 'A traveller is nearby. Greet them briefly.', 'player nearby');

  let acc = 0;
  try {
    const um = updateMobs;
    updateMobs = function (dt) {
      const r = um.apply(this, arguments);
      try {
        if (!U.enabled || !workerReady || paused || !started || dead || (typeof DIM !== 'undefined' && DIM.cur)) return r;
        acc += dt || 0; if (acc < 2.5) return r; acc = 0;
        const near = nearbyClansmen(); if (!near.length) return r;
        const pick = near[0];
        const user = pick.d < 5
          ? 'A traveller stands close. Greet them as yourself in one short spoken line.'
          : pick.stimulus === 'danger'
            ? 'Danger is near. Shout one short warning as yourself.'
            : 'A traveller is nearby in the glen. Say one short living line as yourself.';
        enqueue(pick.a, user, pick.d < 5 ? 'greet' : 'idle near');
      } catch (e) { ERR(e); }
      return r;
    };
  } catch (e) { ERR(e); }

  // Settings: opt-in load / cancel + status (no telepathy dialogue captions)
  try {
    if (SET.sunnyLlm === undefined) SET.sunnyLlm = 1;
    U.enabled = !!SET.sunnyLlm;
    const g = document.querySelector('#friendSeg') || document.querySelector('#immSeg') || document.querySelector('#perfSeg');
    const row = g && g.parentElement && g.parentElement.closest('.row, .setrow, div');
    if (row && !document.querySelector('[data-testid="sunny-llm-row"]')) {
      const r2 = document.createElement('div');
      r2.className = row.className || '';
      r2.setAttribute('data-testid', 'sunny-llm-row');
      r2.innerHTML = '<div><b>Clansmen Sunny LLM (browser)</b></div>'
        + '<div id="sunnySeg">'
        + '<button data-v="1" data-testid="sunny-on">On</button>'
        + '<button data-v="0" data-testid="sunny-off">Off</button>'
        + '<button data-testid="sunny-browser-load">Load brain (~461–750MB first time)</button>'
        + '<button data-testid="sunny-browser-cancel">Cancel load</button>'
        + '</div>'
        + '<div data-testid="sunny-status">Sunny: idle</div>';
      row.after(r2);
      statusEl = r2.querySelector('[data-testid="sunny-status"]');
      const seg = r2.querySelector('#sunnySeg');
      const sync = () => seg.querySelectorAll('button[data-v]').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === (SET.sunnyLlm ? 1 : 0)));
      sync(); setStatusUI();
      seg.querySelector('[data-testid="sunny-on"]').onclick = e => { e.preventDefault(); SET.sunnyLlm = 1; U.enabled = true; try { saveSet(); } catch (_) {} sync(); toast('Clansmen Sunny LLM ON'); };
      seg.querySelector('[data-testid="sunny-off"]').onclick = e => { e.preventDefault(); SET.sunnyLlm = 0; U.enabled = false; try { saveSet(); } catch (_) {} sync(); toast('Clansmen Sunny LLM OFF'); };
      seg.querySelector('[data-testid="sunny-browser-load"]').onclick = e => { e.preventDefault(); U.enableBrowserBrain(); };
      seg.querySelector('[data-testid="sunny-browser-cancel"]').onclick = e => { e.preventDefault(); U.cancelBrowserBrain(); };
    }
  } catch (e) { ERR(e); }
})();
