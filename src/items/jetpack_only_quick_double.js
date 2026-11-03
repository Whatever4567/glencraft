/* ===================== GLX-C176 (v1.0.33): jetpack only on a quick double-tap of jump; plain jumps and sprint-jumps stay normal ===================== */
(function c176jet() {
  const J = window.__c176 = {armed: false, flew: false, prev: false, last: -1e9, air: 0, WIN: 320};
  const up = updatePlayer;
  updatePlayer = function (dt, mx, mz) {
    const S = window.__c102j, wear = IT.JETPACK && armour[4] === IT.JETPACK && !(MODE.fly && flying) && !heldBy && !(typeof riding !== 'undefined' && riding);
    if (!wear || !S) { J.armed = false; J.flew = false; J.prev = false; return up.apply(this, arguments); }
    const hold = !!(jumpHeld || jumpHeldPad || keys.Space), now = performance.now(), ground = P.onGround || swimming;
    J.air = ground ? 0 : J.air + dt;
    if (hold && !J.prev) {   // a fresh press: the jetpack only if it is the second tap of a quick double-tap and you are off the ground
      if (!ground && now - J.last < J.WIN && J.air > 0.03) J.armed = true;
      J.last = now; }
    if (!hold) J.armed = false;
    if (ground) { J.armed = false; J.flew = false; }
    J.prev = hold;
    if (J.armed) { J.flew = true; return up.apply(this, arguments); }
    // not flying: the jetpack code below sees no held jump in the air and no air time, so no thrust and no 3x air steering (a glide after a real flight is kept)
    const a = jumpHeld, b = jumpHeldPad, c = keys.Space; if (!ground) { jumpHeld = false; jumpHeldPad = false; keys.Space = false; }
    if (!J.flew) S.air = -1e6;
    const ox = P.x, oz = P.z;
    try { return up.apply(this, arguments); } finally {
      jumpHeld = a; jumpHeldPad = b; keys.Space = c; if (!J.flew && S.air < 0) S.air = 0;
      if (!J.flew && dt > 0 && !P.onGround && !swimming) {   // never faster than a normal sprint across the ground
        const cap = (sprinting ? 5.8 : 4.3) * 1.3 * dt, dx = P.x - ox, dz = P.z - oz, l = Math.hypot(dx, dz);
        if (l > cap && l < 3) { const k = cap / l; const tx = ox + dx * k, tz = oz + dz * k; if (!collides(tx, P.y, tz)) { P.x = tx; P.z = tz; } } } } };
})();
