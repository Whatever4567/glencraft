/* GLX-Q1220 (v1.2.20): quiet play and item names on hover.
   (1) automatic chatter pop ups (welcome, tutorial tip, weather and biome announcements, one off notices) are dropped; messages from your own actions, warnings, errors and save problems still show.
   (2) hovering a filled slot in any inventory, chest, creative or hotbar grid shows the item name at once (mouse and pen only, touch and controller unchanged). */
(function q1220() {
  const U = window.__q1220 = {err: null, quiet: 0, tips: 0, skipped: []};
  const QUIET = [/^Welcome back to /, /^Find a tree and hold MINE/, /^Starter chests by the spawn/, /^Good morning! The skies have cleared/,
    /^(The rain eases off\.|A light rain drifts across the glen\.|Heavy rain sweeps in\.|Thunder rumbles\. A storm is coming!)$/, /^A full moon rises/,
    /^You come upon /, /^The hot desert stretches/, /^A sandstorm is blowing in/, /^Spawn island refreshed/, /^Glencraft is now the real shape/,
    /old worlds? found on this device/, /^Your XP is back/, /^A Bag of Everything is in your inventory/, /^You have a Golden Jetpack/, /^Welcome to your new world!/];
  U.QUIET = QUIET;
  try { const t0 = toast; toast = function (m) { if (typeof m === 'string' && QUIET.some(r => r.test(m))) { U.quiet++; if (U.skipped.length < 30) U.skipped.push(m); return; } return t0.apply(this, arguments); }; } catch (e) { U.err = 't ' + e; }
  // ---- hover names ----
  try {
    const tip = document.createElement('div'); tip.id = 'q1220tip';
    tip.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483000;pointer-events:none;display:none;padding:4px 9px;border-radius:6px;background:rgba(8,14,28,.94);color:#fff;font:600 13px/1.25 system-ui,sans-serif;border:1px solid rgba(160,210,255,.55);white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.5)';
    const SEL = '.gslot,.slot,.fslot,.aslot';
    let cur = null;
    const nameOf = el => { if (el.classList.contains('empty')) return ''; let n = el.dataset.gname || el.getAttribute('title') || '';
      if (el.hasAttribute('title')) { el.dataset.gname = n; el.removeAttribute('title'); }
      if (!n) { const g = el.querySelector('[data-gid]'); const id = g && +g.dataset.gid; if (id && typeof NAMES !== 'undefined' && NAMES[id]) n = NAMES[id]; }
      return n; };
    const hide = () => { cur = null; tip.style.display = 'none'; };
    const place = (x, y) => { const w = tip.offsetWidth, h = tip.offsetHeight; let l = x + 14, t = y + 18; if (l + w > innerWidth - 4) l = x - w - 10; if (t + h > innerHeight - 4) t = y - h - 10; tip.style.transform = 'translate(' + Math.max(2, l) + 'px,' + Math.max(2, t) + 'px)'; };
    U.nameOf = nameOf;
    document.addEventListener('pointerover', e => { try { if (e.pointerType === 'touch') return; const el = e.target && e.target.closest && e.target.closest(SEL); if (!el) { if (cur) hide(); return; }
        const n = nameOf(el); if (!n) { hide(); return; } cur = el; if (!tip.parentNode) document.body.appendChild(tip); tip.textContent = n; tip.style.display = 'block'; place(e.clientX, e.clientY); U.tips++; } catch (_) {} }, true);
    document.addEventListener('pointermove', e => { if (cur && e.pointerType !== 'touch') place(e.clientX, e.clientY); }, {capture: true, passive: true});
    document.addEventListener('pointerout', e => { if (cur && (!e.relatedTarget || !cur.contains(e.relatedTarget))) hide(); }, true);
    document.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') hide(); }, true);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'e' || e.key === 'E' || e.key === 'Tab') hide(); }, true);
    setInterval(() => { if (cur && (!cur.isConnected || cur.offsetParent === null || document.pointerLockElement)) hide(); }, 200);
  } catch (e) { U.err = 'h ' + e; }
})();
