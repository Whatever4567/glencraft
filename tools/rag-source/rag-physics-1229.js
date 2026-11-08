  // v1.2.29 ragdoll physics (local): fixed 1/120 s steps so a throw is the same at 30, 60 or 120 fps; the floor is looked up below the body
  // wherever it is (a body thrown off a cliff or bumped off a ledge falls to the real ground instead of hanging at its death height);
  // bodies in the air always keep falling (the 4 body cap only limits sliding on the ground, and a capped body holds its pose instead of
  // snapping back to the old tip over); the throw is scaled by the animal size (a cow goes less far than a rabbit from the same shot).
  // Plain semi implicit Euler with a fixed step (the usual game approach), written for this game.
  U.DT = 1 / 120; U.GRAV = 16; U.LOOK = 12; U.FLOOR = -237; U.OUT = U.FLOOR - 64;   // bedrock at y -237 (GLX-V1217 and the older deep layers), empty void below it
  U.ground = (c, r, p, sol) => { const cx = Math.floor(p.x), cz = Math.floor(p.z), y0 = Math.floor(p.y + 0.6);
    if (r.gk === cx * 65536 + cz && r.gg != null && r.gg <= p.y + 0.6) return r.gg; U.gLook = (U.gLook || 0) + 1;
    if (!sol) { r.gk = cx * 65536 + cz; r.gg = c.gy; return c.gy; }
    for (let y = y0; y > y0 - U.LOOK; y--) if (sol(cx + 0.5, y + 0.5, cz + 0.5)) { r.gk = cx * 65536 + cz; r.gg = y + 1; c.gy = y + 1; return y + 1; }
    r.gk = null; r.gg = null; return -1e9; };   // nothing solid in the 12 blocks below: keep falling under gravity and look again next step (no made up floor)
  U.mass = c => { if (c.__m) return c.__m; let m = 1; try { const b = new THREE.Box3().setFromObject(c.g), s = b.getSize(new THREE.Vector3()), v = s.x * s.y * s.z; if (v > 1e-4 && isFinite(v)) m = Math.min(2.2, Math.max(0.55, Math.cbrt(v / 0.5))); } catch (_) {} return (c.__m = m); };
  U.step = (c, dt) => { try { if (c.kind !== 'body') return false; let r = c.__r;
      if (!r) { const gun = c.w > 2, k = gun ? 9 : 2.2, m = U.mass(c), f = 1 / Math.sqrt(m); r = c.__r = {vx: c.dir.x * k * f, vz: c.dir.z * k * f, vy: (gun ? 4.2 : 1.0) * Math.min(1.15, f), spin: (gun ? 11 : 3) / m, air: 1, sleep: 0, rest: null, cd: 0, acc: 0, off: 0.25}; U.launched++; }
      if (r.sleep) { if (typeof P !== 'undefined' && moving < U.MAXM) { const p = c.g.position, dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz), sp = Math.hypot(pvx, pvz);
          if (d < 0.9 && Math.abs(p.y - P.y) < 1.6 && sp > 1.5) { const n = d > 1e-3 ? 1 / d : 0, m = U.mass(c); r.vx = (dx * n * 2 + pvx * 0.6) / m; r.vz = (dz * n * 2 + pvz * 0.6) / m; r.vy = 1.6 / Math.sqrt(m); r.spin = 5 / m; r.sleep = 0; r.air = 1;
            if (r.rest !== null) { r.off = r.rest - (r.gg != null ? r.gg : c.gy); if (!(r.off > -0.5 && r.off < 1.5)) r.off = 0.25; r.rest = null; } U.woke++; } }
        if (r.sleep) return false; }
      if (!r.air && moving >= U.MAXM) return true;   // capped on the ground: hold where it is this frame (no snap to the old pose)
      moving++; U.moving = moving;
      const p = c.g.position, G = window.__gore, sol = G && G.sol; r.cd = Math.max(0, (r.cd || 0) - dt);
      r.acc = Math.min((r.acc || 0) + dt, 0.1); let ran = 0;
      while (r.acc >= U.DT - 1e-9) { r.acc -= U.DT; ran++; const n = Math.min(4, Math.max(1, Math.ceil(Math.hypot(r.vx, r.vy, r.vz) * U.DT / 0.25))), h = U.DT / n;   // never more than 0.25 per sub step, no passing through walls
        for (let s = 0; s < n; s++) { r.vy = Math.max(-40, r.vy - U.GRAV * h);
          for (const ax of ['x', 'z']) { const v = ax === 'x' ? r.vx : r.vz, nx = p[ax] + v * h; const q = {x: p.x, y: p.y + 0.3, z: p.z}; q[ax] = nx + Math.sign(v) * 0.3;
            if (sol && Math.abs(v) > 0.01 && sol(q.x, q.y, q.z)) { const sp = Math.abs(v); if (sp > U.HIT) U.hitSurf(c, r, ax === 'x' ? Math.floor(q.x) + (v > 0 ? 0 : 1) : p.x, p.y + 0.3, ax === 'z' ? Math.floor(q.z) + (v > 0 ? 0 : 1) : p.z, ax === 'x' ? -Math.sign(v) : 0, 0, ax === 'z' ? -Math.sign(v) : 0, sp);
              if (ax === 'x') r.vx *= -0.25; else r.vz *= -0.25; r.spin *= 0.7; } else p[ax] = nx; }
          p.y += r.vy * h; const gr = U.ground(c, r, p, sol), floor = gr + (r.off != null ? r.off : 0.25);
          if (p.y <= floor) { p.y = floor; const sp = -r.vy; if (sp > U.HIT) U.hitSurf(c, r, p.x, gr + 0.01, p.z, 0, 1, 0, sp); if (r.vy < -1.5) { r.vy *= -0.32; r.spin *= 0.6; r.air = 1; } else { r.vy = 0; r.air = 0; } const f = Math.exp(-h * (r.air ? 2 : 7)); r.vx *= f; r.vz *= f; }
          else if (p.y > floor + 0.05) r.air = 1; } }
      if (p.y < U.OUT && !c.fade) { c.fade = 1; U.retired = (U.retired || 0) + 1; }   // fell into the void under the bedrock: the normal 4 s fade and removal, no hovering
      if (ran && r.spin > 0.05) { const t = ran * U.DT; Q.setFromAxisAngle(c.axis, r.spin * t); c.g.quaternion.premultiply(Q); r.spin *= Math.exp(-t * 2.2); }
      if (!r.air && Math.hypot(r.vx, r.vz) < 0.15 && r.spin < 0.3) { r.sleep = 1; U.slept++; if (r.rest === null) { r.rest = p.y; if (c.q0 && c.axis && !c.settle) { c.ang = Math.PI / 2; c.w = 0; c.slide = 0; c.q0 = new THREE.Quaternion().setFromAxisAngle(c.axis, Math.PI / 2).invert().multiply(c.g.quaternion); } return false; } return true; }
      return true; } catch (e) { if (!U.err) U.err = String(e).slice(0, 200); return false; } };
