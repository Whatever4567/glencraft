/* GLX-C312 (v1.1.22): Xbox controller for the player UFO, and the touch buttons hide while a gamepad is in use.
   On the UFO: left stick moves, right stick looks (the normal Sensitivity), RT up, LT down, A boost, B exit (once landed), Y lands by itself.
   Any gamepad input hides the on-screen touch controls (walking, rocket and UFO); the next touch shows them again. */
(function c312() {
  const U = window.__c312 = {err: null, pad: false, autoLand: false, exits: 0};
  const ERR = (w, e) => { U.err = w + ': ' + (e && e.message || e); };
  const st = document.createElement('style'); st.textContent = 'body.c312pad #touch,body.c312pad #c311ring,body.c312pad .touchOnly{display:none!important}body.padOn.c312touch:not(.c312pad) #touch{display:block!important}'; document.head.appendChild(st);
  const setPad = on => { if (U.pad === on) return; U.pad = on; document.body.classList.toggle('c312pad', on); document.body.classList.toggle('c312touch', !on); };
  addEventListener('pointerdown', e => { if (e.pointerType === 'touch') setPad(false); }, true);
  addEventListener('touchstart', () => setPad(false), true);
  let prev = {};
  function tick() { try { const gs = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : []; const g = gs[0];
      if (g) { const act = g.buttons.some(b => b && (b.pressed || b.value > 0.3)) || g.axes.some(a => Math.abs(a) > 0.35); if (act) setPad(true);
        const C = window.__c309, B = i => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.4));
        if (C && C.on) { C.padOn = true; const rt = B(7), lt = B(6), a = B(0), b = B(1), y = B(3);
          if (y && !prev.y) U.autoLand = !U.autoLand; if (rt || (lt && false)) U.autoLand = false; if (C.landed) U.autoLand = false;
          C.upHeld = rt; C.dnHeld = lt || U.autoLand; C.boostHeld = a;
          if (b && !prev.b) { U.exits++; C.exit(); }
          prev = {y, b}; }
        else if (C && C.padOn) { C.padOn = false; C.upHeld = C.dnHeld = C.boostHeld = false; U.autoLand = false; prev = {}; } } } catch (e) { ERR('tick', e); }
    requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
})();
