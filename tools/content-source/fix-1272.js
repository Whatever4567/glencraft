/* GLX-FIX1272 (v1.2.72): pickaxe, torch and bucket actions only fire on
   real input, and load-watchdog diagnostic popups are gone.
   (1) Stuck attack and place-hold flags are cleared when the pointer, the
   controller trigger or the window is no longer actually down — including
   when pointer lock is lost, a gamepad disappears, the document hides, or
   an overlay ate the pointer-up. updateInteraction and hold-to-place then
   cannot auto-repeat a swing or a place on their own.
   (2) The "taking too long to start" box and the "parts were skipped"
   notice are not shown; the same recovery still runs and only logs to the
   console. Ordinary gameplay toasts are unchanged.
   Hands, grips and animations are left as they are. First-person hands
   stay hidden in third person. The gold D-pad is left alone. */
(function fix1272() {
  const U = window.__fix1272 = {
    err: null, on: 1, version: '1.2.72',
    boxes: 0, toasts: 0, clears: 0, padHook: 0, boxHook: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  const log = (kind, msg) => { try { console.info('[glencraft ' + kind + ']', msg); } catch (_) {} };

  /* ---------- (2) silent diagnostic popups ---------- */
  const SKIP_TOAST = [
    /some parts were skipped/i,
    /the world is safe/i,
    /taking too long to start/i,
    /Take a screenshot of this box/i,
    /That world hit a snag starting/i,
    /^Started a fresh .* \(the old save /
  ];
  function hookToast() {
    try {
      if (typeof toast !== 'function' || toast.__fix1272) return !!toast.__fix1272;
      const t0 = toast;
      toast = function (m) {
        if (typeof m === 'string' && SKIP_TOAST.some(function (r) { return r.test(m); })) {
          U.toasts++;
          log('load', m);
          return;
        }
        return t0.apply(this, arguments);
      };
      toast.__fix1272 = 1;
      try { window.toast = toast; } catch (_) {}
      return true;
    } catch (e) { ERR('toast', e); return false; }
  }
  function silentBox(title, txt) {
    U.boxes++;
    log('load', ((title || '') + (txt ? '\n' + txt : '')).replace(/^\s+|\s+$/g, ''));
    try { const b = document.getElementById('c272box'); if (b) b.remove(); } catch (_) {}
  }
  function hookBox() {
    try {
      const C = window.__c272;
      if (C && typeof C.box === 'function' && !C.box.__fix1272) {
        C.box = silentBox;
        C.box.__fix1272 = 1;
        U.boxHook = 1;
      }
    } catch (e) { ERR('box', e); }
  }
  function zapBox() {
    try {
      const b = document.getElementById('c272box');
      if (!b) return;
      U.boxes++;
      try { log('load', (b.innerText || 'c272box').replace(/\s+/g, ' ').slice(0, 400)); } catch (_) {}
      b.remove();
    } catch (_) {}
  }

  /* ---------- (1) actions only on real input ---------- */
  function clearAttack(why) {
    let n = 0;
    try { if (typeof attackMouse !== 'undefined' && attackMouse) { attackMouse = false; n++; } } catch (_) {}
    try { if (typeof attackPad !== 'undefined' && attackPad) { attackPad = false; n++; } } catch (_) {}
    try { if (typeof attackTouch !== 'undefined' && attackTouch) { attackTouch = false; n++; } } catch (_) {}
    /* holdMouse / holdTouch are local to GLX-H3; it already clears them on window blur. */
    try { window.dispatchEvent(new MouseEvent('mouseup', {button: 2, bubbles: true})); } catch (_) {}
    try { window.dispatchEvent(new Event('blur')); } catch (_) {}
    if (n) { U.clears++; U.lastClear = why || ''; }
    return n;
  }
  U.clearAttack = clearAttack;

  function rtDown() {
    try {
      const gp = (typeof pickPad === 'function') ? pickPad() : null;
      const b = gp && gp.buttons && gp.buttons[7];
      return !!(b && (b.pressed || b.value > 0.4));
    } catch (_) { return false; }
  }

  function hookPad() {
    try {
      if (typeof readPad !== 'function' || readPad.__fix1272) return !!readPad.__fix1272;
      const rp = readPad;
      readPad = function () {
        const g = rp.apply(this, arguments);
        try {
          /* pickPad() missing or RT released: do not leave attackPad stuck true. */
          if (!rtDown()) {
            try { if (typeof attackPad !== 'undefined' && attackPad) { attackPad = false; U.clears++; U.lastClear = 'pad'; } } catch (_) {}
          }
        } catch (e) { ERR('pad', e); }
        return g;
      };
      readPad.__fix1272 = 1;
      try { window.readPad = readPad; } catch (_) {}
      U.padHook = 1;
      return true;
    } catch (e) { ERR('rp', e); return false; }
  }

  function installInput() {
    if (U._in) return;
    U._in = 1;
    try {
      document.addEventListener('pointerlockchange', function () {
        try {
          if (document.pointerLockElement) return;
          try { if (typeof attackMouse !== 'undefined') attackMouse = false; } catch (_) {}
          try { window.dispatchEvent(new MouseEvent('mouseup', {button: 2, bubbles: true})); } catch (_) {}
          U.clears++; U.lastClear = 'pointerlock';
        } catch (e) { ERR('pl', e); }
      }, true);
    } catch (e) { ERR('plh', e); }
    try {
      document.addEventListener('visibilitychange', function () {
        try { if (document.hidden) clearAttack('hidden'); } catch (e) { ERR('vis', e); }
      });
    } catch (e) { ERR('vish', e); }
    try {
      window.addEventListener('pagehide', function () { try { clearAttack('pagehide'); } catch (_) {} });
    } catch (_) {}
    try {
      window.addEventListener('pointerup', function (e) {
        try {
          if (e.pointerType === 'mouse' && e.button === 0) {
            try { if (typeof attackMouse !== 'undefined') attackMouse = false; } catch (_) {}
          }
          if (e.pointerType === 'mouse' && e.button === 2) {
            try { window.dispatchEvent(new MouseEvent('mouseup', {button: 2, bubbles: true})); } catch (_) {}
          }
        } catch (err) { ERR('pu', err); }
      }, true);
      window.addEventListener('pointercancel', function (e) {
        try {
          if (e.pointerType === 'mouse') {
            try { if (typeof attackMouse !== 'undefined') attackMouse = false; } catch (_) {}
            try { window.dispatchEvent(new MouseEvent('mouseup', {button: 2, bubbles: true})); } catch (_) {}
          }
        } catch (err) { ERR('pc', err); }
      }, true);
    } catch (e) { ERR('puh', e); }
  }

  hookToast();
  hookBox();
  hookPad();
  installInput();
  zapBox();
  try {
    const mo = new MutationObserver(function () { zapBox(); });
    mo.observe(document.documentElement || document.body, {childList: true, subtree: true});
  } catch (_) {}
  let n = 0;
  const iv = setInterval(function () {
    hookToast();
    hookBox();
    hookPad();
    zapBox();
    if (++n > 40) clearInterval(iv);
  }, 50);
})();
