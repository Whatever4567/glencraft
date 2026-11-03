/* ===================== GLX-C188 (v1.0.36): Reset world always uses the newest map - an old page left open (or cached) is caught and updated first ===================== */
(function c188() {
  const S = window.__c188 = {checks: 0, stale: null, live: null, blocked: 0};
  const mine = () => { try { if (window.__c99 && __c99.build) return __c99.build; for (const n of document.head.childNodes) if (n.nodeType === 8) { const m = /glencraft-build: ([a-z0-9.-]+)/.exec(n.nodeValue); if (m) return m[1]; } } catch (_) {} return null; };
  const remote = () => !!(/^https?:/.test(location.protocol) && !/localhost|127\.0\.0\.1/.test(location.host));
  let lastAt = 0, pending = null;
  // ask the live site which build it serves (first 2 KB only, never from cache); tests can set window.__c188live
  function check(force) {
    if (pending) return pending;
    if (!force && performance.now() - lastAt < 120000 && S.stale !== null) return Promise.resolve(S.stale);
    const me = mine(); if (!me) return Promise.resolve(false);
    const get = window.__c188live !== undefined ? Promise.resolve(window.__c188live) : !remote() ? Promise.resolve(null) :
      fetch(location.origin + location.pathname + '?nc=' + Date.now(), {cache: 'no-store', headers: {Range: 'bytes=0-2047'}}).then(r => r.text()).then(t => { const m = /glencraft-build: ([a-z0-9.-]+)/.exec(t); return m && m[1]; });
    S.checks++;
    pending = get.then(live => { lastAt = performance.now(); S.live = live || null; S.stale = !!(live && live !== me); if (S.stale) { banner(); try { if (!started && sessionStorage.getItem('glen_autoupd') !== live) { sessionStorage.setItem('glen_autoupd', live); update(); } } catch (_) {} } return S.stale; })   // v1.0.61: on the title screen an out-of-date page updates itself (once per new build)
      .catch(() => false).finally(() => { pending = null; });
    return pending;
  }
  function update() { try { if (started) saveWorld(true); } catch (_) {} setTimeout(() => location.replace(location.origin + location.pathname + '?v=' + (S.live || Date.now())), 800); }
  function banner() {
    if (document.getElementById('c99upd')) return;
    const el = document.createElement('div'); el.id = 'c99upd';
    el.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:71;background:rgba(20,28,22,.95);color:#f3ead2;border:2px solid #7fbf6a;border-radius:12px;padding:10px 14px;font:14px system-ui,sans-serif';
    el.innerHTML = 'A newer version is out. <button style="margin-left:8px;padding:6px 12px;font:600 14px system-ui">Update now</button>';
    document.body.appendChild(el); el.querySelector('button').onclick = update;
  }
  // a phone tab left open for hours never reloads: check again when the game comes back to the front
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(false); });
  window.addEventListener('pageshow', e => { if (e.persisted) check(true); });
  setInterval(() => { if (document.visibilityState === 'visible') check(false); }, 30 * 60000);
  // opening the reset question starts a fresh check; saying Yes on an out-of-date page updates first instead of building the old map
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target.closest('#resetWorldBtn, #resetYes') : null; if (!t) return;
    if (t.id === 'resetWorldBtn') { check(true); return; }
    if (DIM.cur || !S.stale) return;
    e.preventDefault(); e.stopImmediatePropagation(); S.blocked++;
    try { document.getElementById('resetNo').click(); } catch (_) {}
    banner(); toast('This page is an old version - updating now. Then tap Reset world again for the new map.');
    setTimeout(update, 1200);
  }, true);
  // belt and braces: an overworld reset is always a brand-new world, so it always gets the current layout flags
  const ew = enterWorld; enterWorld = function (save) {
    if (!save && window.__c105 && __c105.phase === 'gen') { S.resets = (S.resets || 0) + 1; try { if (window.__c181) { __c181.zones = []; __c181.signs = []; } } catch (_) {} }
    const r = ew.apply(this, arguments);
    try { if (!save && current && current.mode !== 'creative' && !current.g35) { console.warn('c188: g35 was off after a new world'); current.g35 = true; } } catch (_) {}
    return r; };
})();
