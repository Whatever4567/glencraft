/* GLX-POP1261 (v1.2.61): Disable pop star setting (persisted in glen_set as
   SET.noPopstar, default off — the singer stays on). When the setting is on
   she is not spawned or drawn, her song and the pop-star album cue do not
   play, her per-frame dance is skipped, and Teleport to Pop Star is hidden.
   Turning it off mid-game despawns her at once, which also saves the frame
   time her mesh and audio were using. */
(function pop1261() {
  const U = window.__pop1261 = { err: null, blocked: 0, off: 0 };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  const off = () => { try { return !!(typeof SET !== 'undefined' && SET.noPopstar); } catch (_) { return false; } };
  U.off = () => off();

  function hideTeleport(hide) {
    try {
      const b = document.getElementById('tpmPopstar');
      if (b) {
        b.style.display = hide ? 'none' : '';
        b.disabled = !!hide;
        if (hide) { b.setAttribute('aria-disabled', 'true'); b.setAttribute('hidden', ''); }
        else { b.removeAttribute('aria-disabled'); b.removeAttribute('hidden'); }
      }
    } catch (_) {}
  }

  function applyOff() {
    if (!off()) { hideTeleport(false); U.on = 0; return; }
    U.on = 1;
    try {
      const V = window.__v1251;
      if (V) {
        try { if (typeof V.stopSong === 'function') V.stopSong(); } catch (_) {}
        try { if (typeof V.despawn === 'function') V.despawn(); } catch (_) {}
        try { V.pendingPresent = null; V.pendingTp = null; } catch (_) {}
        try { V.songOn = 0; } catch (_) {}
      }
    } catch (e) { ERR('off', e); }
    hideTeleport(true);
  }
  U.applyOff = applyOff;

  function wrapApi() {
    const V = window.__v1251;
    if (!V || V._p1261) return !!V;
    V._p1261 = 1;
    const wrap = (name) => {
      if (typeof V[name] !== 'function') return;
      const orig = V[name].bind(V);
      V[name] = function () {
        if (off()) {
          U.blocked++;
          if (name === 'teleportTo') {
            try { toast('The pop star is turned off in Settings'); } catch (_) {}
            try { V.tp = V.tp || {}; V.tp.last = 'disabled'; } catch (_) {}
            return false;
          }
          return null;
        }
        return orig.apply(this, arguments);
      };
    };
    ['spawnAt', 'maybeSpawn', 'forcePresent', 'teleportTo', 'flushPending'].forEach(wrap);
    if (typeof V.tick === 'function') {
      const tk = V.tick.bind(V);
      V.tick = function () { if (off()) return; return tk.apply(this, arguments); };
    }
    /* Teleport menu: drop the row while she is off. */
    try {
      const tpm = window.__tpm || window.__ui22;
      if (tpm && typeof tpm.list === 'function' && !tpm._p1261) {
        const ls = tpm.list.bind(tpm);
        tpm.list = function () {
          const L = ls.apply(this, arguments) || [];
          if (!off()) return L;
          return L.filter(e => !e || e.id !== 'tpmPopstar');
        };
        tpm._p1261 = 1;
      }
    } catch (e) { ERR('tpm', e); }
    applyOff();
    return true;
  }
  U.wrapApi = wrapApi;

  U.set = function (v) {
    try { SET.noPopstar = !!v; } catch (_) {}
    try { saveSet(); } catch (_) {}
    applyOff();
    wrapApi();
    if (U.sync) U.sync();
  };

  U.ui = () => {
    if (document.getElementById('popSeg')) return true;
    const after = document.getElementById('folSeg') || document.getElementById('mobSeg') || document.getElementById('rdSeg') || document.getElementById('touchSeg') || document.getElementById('bobSeg') || document.getElementById('ostSeg');
    if (!after) return false;
    const row = after.closest('.set') || after.parentNode;
    const d = document.createElement('div');
    d.className = 'set inline';
    d.id = 'popSetRow';
    d.innerHTML = '<span>Disable pop star</span><div class="seg" id="popSeg"><button data-v="1" data-testid="settings-popSeg-1">On</button><button data-v="0" data-testid="settings-popSeg-0">Off</button></div>';
    row.after(d);
    U.sync = () => d.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === (off() ? 1 : 0)));
    d.querySelectorAll('button').forEach(b => b.addEventListener('click', () => U.set(Number(b.dataset.v) === 1)));
    U.sync();
    return true;
  };

  { let t = 0; const iv = setInterval(() => { try { wrapApi(); if ((U.ui() && wrapApi()) || ++t > 80) clearInterval(iv); } catch (e) { ERR('boot', e); clearInterval(iv); } }, 400); }
  setInterval(() => { try { if (off()) applyOff(); else hideTeleport(false); } catch (e) { ERR('keep', e); } }, 2000);
})();
