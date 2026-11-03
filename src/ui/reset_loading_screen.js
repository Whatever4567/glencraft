// c263 v1.0.75: Reset world hides behind the Glencraft loading screen until the new world is ready and drawn
(() => {
  const U = window.__c263 = {err: null, shown: 0, hid: 0, at: 0};
  try {
    if (!window.__c105 || !__c105.start) return;
    let ov = null;
    function make() {
      ov = document.createElement('div'); ov.id = 'c263ov';
      ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4vh;background:radial-gradient(ellipse at 50% 40%,#3a2410 0%,#140b05 60%,#050302 100%);pointer-events:all;opacity:1;transition:opacity .45s';
      const boot = document.getElementById('scr-boot'), lg = boot && boot.querySelector('.glogo');
      if (lg) { const c = lg.cloneNode(true); c.style.cssText = 'width:min(80vw,620px);display:block;position:static'; ov.appendChild(c); }
      else { const h = document.createElement('div'); h.textContent = 'GLENCRAFT'; h.style.cssText = 'font:900 12vmin GlenBold,Impact,sans-serif;color:#e0a548;text-shadow:0 0 24px #ff9b30'; ov.appendChild(h); }
      const t = document.createElement('div'); t.id = 'c263txt'; t.textContent = 'Resetting world\u2026';
      t.style.cssText = 'font:700 clamp(16px,3.4vmin,30px) GlenBold,system-ui,sans-serif;letter-spacing:.2em;color:#f3ead0;text-shadow:0 0 14px #ff9b30';
      ov.appendChild(t);
      /* v1.0.85: progress bar with a percentage */ const bw = document.createElement('div'); bw.style.cssText = 'width:min(70vw,520px);height:14px;border:2px solid #e0a548;border-radius:8px;background:#1a0f06;overflow:hidden';
      const b = document.createElement('div'); b.id = 'c263bar'; b.style.cssText = 'height:100%;width:0%;background:linear-gradient(90deg,#c97a26,#ffcf6a);transition:width .25s'; bw.appendChild(b); ov.appendChild(bw);
      const pc = document.createElement('div'); pc.id = 'c263pc'; pc.textContent = '0%'; pc.style.cssText = 'font:700 clamp(14px,3vmin,24px) GlenBold,system-ui,sans-serif;color:#f3ead0'; ov.appendChild(pc); document.body.appendChild(ov);
    }
    const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30))));
    const setP = (k, msg) => { k = Math.max(U.pct || 0, Math.min(100, Math.round(k))); U.pct = k; const b = document.getElementById('c263bar'), pc = document.getElementById('c263pc'), t = document.getElementById('c263txt'); if (b) b.style.width = k + '%'; if (pc) pc.textContent = k + '%'; if (t && msg) t.textContent = msg; };
    const orig = __c105.start;
    __c105.start = async function () {
      if (__c105.phase || U.busy) return; U.busy = 1;
      U.pct = 0; try { if (ov) ov.remove(); make(); U.shown++; U.at = performance.now(); } catch (e) { U.err = String(e); }
      await raf2();   // the loading screen is painted BEFORE anything heavy happens
      try { orig.apply(this, arguments); } catch (e) { U.err = String(e); }
      if (!__c105.phase) { U.busy = 0; if (ov) ov.remove(); ov = null; return; }
      let built = 0, t0 = 0;
      const wait = () => { const R = __c105, tot = Math.max(30, R.nChunks || 200), n = (typeof chunkObjs !== 'undefined' && chunkObjs) ? chunkObjs.size : 0;
        if (R.phase === 'lift' || R.phase === 'del') setP(1 + 10 * (R.phase === 'del' && R.far ? 1 - R.far.length / Math.max(1, R.nChunks || 1) : 0), 'Clearing the old world\u2026');
        else if (R.phase === 'gen') { if (!built) setP(14, 'Shaping a brand-new glen\u2026'); }
        if (R.phase === 'gen' || R.phase === 'land' || !R.phase) { if (n > 0 && R.phase !== 'gen' || built) { built = 1; setP(15 + 83 * Math.min(1, n / (tot * 0.85)), 'Building the land\u2026'); } }
        if (R.phase) return setTimeout(wait, 120);
        if (!t0) t0 = performance.now(); if (n < tot * 0.85 && performance.now() - t0 < 10000) return setTimeout(wait, 120);   /* lift only once the world is drawn */
        setP(100, 'Ready!'); raf2().then(raf2).then(() => { U.hid++; U.ms = Math.round(performance.now() - U.at); U.busy = 0; if (!ov) return; const o = ov; ov = null; o.style.opacity = 0; setTimeout(() => o.remove(), 500); });
      };
      setTimeout(wait, 150);
    };
  } catch (e) { U.err = String(e); }
})();
