/* GLX-RAG1222 (v1.2.22): ragdoll fun for bodies. A shot body is thrown along the shot, tumbles, bounces and slides to a stop on the
   ground; running into a resting body knocks it along again with a roll and a hop. Simple made-up physics (not any other game's), at most
   4 bodies move at once, the rest sleep. The 5 minute clean up counts from death and a bump never resets it. No loot is made here. */
(function rag1222() {
  const U = window.__rag1222 = {err: null, launched: 0, woke: 0, moving: 0, slept: 0, MAXM: 4};
  let px = null, pz = null, pvx = 0, pvz = 0, moving = 0;
  const Q = new THREE.Quaternion();
  U.HIT = 3.5; U.CD = 0.35; U.MAXS = 3; U.splats = 0; U.spam = 0;
  // blood on the surface it hit, only on a hard enough hit, once per short gap and at most 3 per body (the decal pool keeps its own cap and life)
  U.hitSurf = (c, r, x, y, z, nx, ny, nz, sp) => { if (r.cd > 0 || (r.ns || 0) >= U.MAXS) { U.spam++; return 0; } const G = window.__gore; if (!G || !G.splat) return 0;
    if (G.splat(c, x + nx * 0.01, y, z + nz * 0.01, nx, ny, nz, Math.min(1.1, 0.35 + sp * 0.07))) { r.cd = U.CD; r.ns = (r.ns || 0) + 1; U.splats++; U.last = [x, y, z, nx, ny, nz]; return 1; } return 0; };
  U.frame = dt => { if (typeof P === 'undefined' || !dt) return; if (px !== null) { pvx = (P.x - px) / dt; pvz = (P.z - pz) / dt; } px = P.x; pz = P.z; moving = 0; };
  // v1.2.24: the floor follows the ground under the body (it used to stay at the height where it died, so a body thrown off a ledge
  // hung in the air and one thrown onto a step sank into it). Looked up only when the body enters a new block column, at most 8 block checks.
  U.ground = (c, r, p, sol) => { const cx = Math.floor(p.x), cz = Math.floor(p.z); if (r.gk === cx * 65536 + cz && r.gg != null) return r.gg; r.gk = cx * 65536 + cz; U.gLook = (U.gLook || 0) + 1;
    let g = c.gy; if (sol) { const y0 = Math.floor(p.y + 0.6); for (let y = y0; y > y0 - 8; y--) if (sol(cx + 0.5, y + 0.5, cz + 0.5)) { g = y + 1; break; } } r.gg = g; c.gy = g; return g; };
  // returns true when this frame the body was moved here (skip the old fall code)
  U.step = (c, dt) => { try { if (c.kind !== 'body') return false; let r = c.__r;
      if (!r) { const gun = c.w > 2, k = gun ? 9 : 2.2; r = c.__r = {vx: c.dir.x * k, vz: c.dir.z * k, vy: gun ? 4.2 : 1.0, spin: gun ? 11 : 3, air: 1, sleep: 0, rest: null, cd: 0}; U.launched++; }
      if (r.sleep) { if (typeof P !== 'undefined' && moving < U.MAXM) { const p = c.g.position, dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz), sp = Math.hypot(pvx, pvz);
          if (d < 0.9 && Math.abs(p.y - P.y) < 1.6 && sp > 1.5) { const n = d > 1e-3 ? 1 / d : 0; r.vx = dx * n * 2 + pvx * 0.6; r.vz = dz * n * 2 + pvz * 0.6; r.vy = 1.6; r.spin = 5; r.sleep = 0; r.air = 1; U.woke++; } }
        if (r.sleep) return false; }
      if (moving >= U.MAXM) return false; moving++; U.moving = moving;
      const p = c.g.position, G = window.__gore, sol = G && G.sol; r.cd = Math.max(0, (r.cd || 0) - dt);
      const n = Math.min(6, Math.max(1, Math.ceil(Math.hypot(r.vx, r.vy, r.vz) * dt / 0.25))), h = dt / n;  // sub steps: never more than 0.25 per step, no passing through walls
      for (let s = 0; s < n; s++) { r.vy -= 16 * h;
        for (const ax of ['x', 'z']) { const v = ax === 'x' ? r.vx : r.vz, nx = p[ax] + v * h; const q = {x: p.x, y: p.y + 0.3, z: p.z}; q[ax] = nx + Math.sign(v) * 0.3;
          if (sol && Math.abs(v) > 0.01 && sol(q.x, q.y, q.z)) { const sp = Math.abs(v); if (sp > U.HIT) U.hitSurf(c, r, ax === 'x' ? Math.floor(q.x) + (v > 0 ? 0 : 1) : p.x, p.y + 0.3, ax === 'z' ? Math.floor(q.z) + (v > 0 ? 0 : 1) : p.z, ax === 'x' ? -Math.sign(v) : 0, 0, ax === 'z' ? -Math.sign(v) : 0, sp);
            if (ax === 'x') r.vx *= -0.25; else r.vz *= -0.25; r.spin *= 0.7; } else p[ax] = nx; }
        p.y += r.vy * h; const floor = r.rest !== null ? r.rest : U.ground(c, r, p, sol) + 0.25;
        if (p.y <= floor) { p.y = floor; const sp = -r.vy; if (sp > U.HIT) U.hitSurf(c, r, p.x, c.gy + 0.01, p.z, 0, 1, 0, sp); if (r.vy < -1.5) { r.vy *= -0.32; r.spin *= 0.6; } else { r.vy = 0; r.air = 0; } const f = Math.exp(-h * (r.air ? 2 : 7)); r.vx *= f; r.vz *= f; } }
      if (r.spin > 0.05) { Q.setFromAxisAngle(c.axis, r.spin * dt); c.g.quaternion.premultiply(Q); r.spin *= Math.exp(-dt * 2.2); }
      if (!r.air && Math.hypot(r.vx, r.vz) < 0.15 && r.spin < 0.3) { r.sleep = 1; U.slept++; if (r.rest === null) { r.rest = p.y; if (c.q0 && c.axis) { c.ang = Math.PI / 2; c.w = 0; c.slide = 0; c.q0 = new THREE.Quaternion().setFromAxisAngle(c.axis, Math.PI / 2).invert().multiply(c.g.quaternion); } return false; } return true; }
      return true; } catch (e) { if (!U.err) U.err = String(e).slice(0, 200); return false; } };
})();
