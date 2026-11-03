
/* ===================== GLX-H3 (v0.9.26): modern-Minecraft building: hold to keep placing, sneak-bridging (no falling off edges, slower) ===================== */
(function () {
  let holdMouse = false, holdTouch = false, holdT = 0, rep = 0;
  window.addEventListener('mousedown', e => { if (e.button === 2) { holdMouse = true; holdT = 0; rep = 0; } });
  window.addEventListener('mouseup', e => { if (e.button === 2) holdMouse = false; });
  window.addEventListener('blur', () => { holdMouse = holdTouch = false; });
  const bp = $('bPlace');
  if (bp) { bp.addEventListener('pointerdown', () => { holdTouch = true; holdT = 0; rep = 0; }); ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture'].forEach(ev => bp.addEventListener(ev, () => { holdTouch = false; })); }
  const padLT = () => { try { for (const g of navigator.getGamepads ? navigator.getGamepads() : []) if (g && g.connected && g.buttons[6] && (g.buttons[6].pressed || g.buttons[6].value > 0.5)) return true; } catch (_) {} return false; };
  let padWas = false;
  // hold right mouse / LT / the touch Place button: after the first block, one more every 4 ticks (0.2 s), like Minecraft
  window.glxHoldPlace = function (dt) {
    const pad = padLT(); if (pad && !padWas) { holdT = 0; rep = 0; } padWas = pad;
    const held = (holdMouse || holdTouch || pad) && started && !paused && !menuOpen && !dead;
    if (!held) { holdT = 0; return; }
    holdT += dt; if (holdT < 0.2) return;
    rep += dt; if (rep < 0.2) return; rep = 0;
    if (PLACEABLE.has(selId) && !ENT[selId] && (MODE.infinite || (inv[selId] || 0) > 0)) useItem();
  };
  // sneaking: 30% speed, and you can't walk off a ledge (so you can lean out and place against the block under your feet)
  const up = updatePlayer;
  updatePlayer = function (dt, mx, mz) {
    const sneak = sneakHeld && !riding && !(MODE.fly && flying) && started;
    if (!sneak) { try { glxHoldPlace(dt); } catch (_) {} return up.apply(this, arguments); }
    const footY = Math.floor(P.y - 0.05), grounded = P.vy <= 0.01 && supportAt(P.x, P.z, footY);
    const ox = P.x, oz = P.z, inWater = getB(Math.floor(P.x), Math.floor(P.y + 0.2), Math.floor(P.z)) === T.WATER;
    const r = up.call(this, dt, (mx || 0) * 0.3, (mz || 0) * 0.3);
    if (grounded && !inWater && P.y >= footY + 0.9 && !supportAt(P.x, P.z, footY)) {
      const nx = P.x, nz = P.z;
      if (supportAt(nx, oz, footY)) P.z = oz; else if (supportAt(ox, nz, footY)) P.x = ox; else { P.x = ox; P.z = oz; }
      P.y = Math.max(P.y, footY + 1); if (P.vy < 0) P.vy = 0;
    }
    try { glxHoldPlace(dt); } catch (_) {}
    return r;
  };
  function supportAt(x, z, fy) { for (const dx of [-R + 0.02, R - 0.02]) for (const dz of [-R + 0.02, R - 0.02]) if (solid(Math.floor(x + dx), fy, Math.floor(z + dz))) return true; return false; }
})();
