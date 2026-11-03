/* GLX-C306 (v1.0.114): LANDABLE VOXEL PLANETS + ZERO-G. The Moon (192 x 192, grey regolith = gravel over stone, craters, low gravity 0.17)
   and Mars (288 x 288, red sand over rock, dunes, mesas, craters and a canyon, gravity 0.38) are real block worlds (own DIM slots, so every
   block you place or break there is saved like any other dimension). No mobs spawn there, no fall damage, the sky is black on the Moon (with
   Earth hanging in it) and dusty pink on Mars. Also the space walk: EXIT the rocket in deep space and you drift in zero-g; a jetpack gives
   real thrust in every direction (look + move, JUMP up, SHIFT down), without one you only get a little push. */
(function c306() {
  const U = window.__c306 = {err: null, eva: false, E: {x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0}};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const PL = U.PL = {moon: {size: 192, H: 80, g: 0.17, sky: 0x04050b, name: 'The Moon', base: 34}, mars: {size: 288, H: 96, g: 0.38, sky: 0xd59a80, name: 'Mars', base: 40}};
  U.is = () => !!(DIM.cur && PL[DIM.cur]); U.g = () => (U.is() ? PL[DIM.cur].g : 1);
  let s = 1; const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  function vn(seed) { const N = 64, a = new Float32Array(N * N); for (let i = 0; i < a.length; i++) a[i] = rnd(); return (x, z, f) => { x *= f; z *= f; const xi = Math.floor(x), zi = Math.floor(z), tx = x - xi, tz = z - zi, g = (i, j) => a[((i & 63) * 64 + (j & 63))];
    const sx = tx * tx * (3 - 2 * tx), sz = tz * tz * (3 - 2 * tz); return (g(xi, zi) * (1 - sx) + g(xi + 1, zi) * sx) * (1 - sz) + (g(xi, zi + 1) * (1 - sx) + g(xi + 1, zi + 1) * sx) * sz; }; }
  function craters(n, rmin, rmax, S) { const c = []; for (let i = 0; i < n; i++) { const r = rmin + Math.pow(rnd(), 2.2) * (rmax - rmin); c.push({x: rnd() * S, z: rnd() * S, r, d: r * (0.28 + rnd() * 0.12)}); } return c; }
  const crat = (C, x, z) => { let h = 0; for (const c of C) { const dx = x - c.x, dz = z - c.z, q = dx * dx + dz * dz; if (q > c.r * c.r * 2.6) continue; const d = Math.sqrt(q) / c.r;
    h += d < 1 ? -c.d * (1 - d * d) + c.d * 0.35 : c.d * 0.35 * Math.exp(-Math.pow((d - 1) / 0.25, 2)); } return h; };
  function fill(p, hf, top, depth, rock) { const S = p.size, cx = S >> 1, BR = T.HBEDROCK || T.BEDROCK || T.STONE; H = p.H; setWorldSize(S); world.fill(0);
    let mid = 0; for (let dx = -10; dx <= 10; dx++) mid += hf(cx + dx, cx); mid = Math.round(mid / 21);
    for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) { const fd = Math.hypot(x - cx, z - cx); let h = hf(x, z); if (fd < 14) h = mid + (h - mid) * Math.max(0, (fd - 9) / 5);
      h = Math.max(3, Math.min(H - 6, Math.round(h))); const tp = top(x, z, h); world[idx(x, 0, z)] = BR;
      for (let y = 1; y <= h; y++) world[idx(x, y, z)] = y > h - depth ? tp : rock(x, y, z); }
    U.mid = mid; }
  function genMoon() { const p = PL.moon; s = 0x3f00 + ((typeof gSeed !== 'undefined' ? gSeed | 0 : 0) >>> 0); const n = vn(), C = craters(70, 3, 26, p.size);
    fill(p, (x, z) => p.base + (n(x, z, 0.03) - 0.5) * 10 + (n(x, z, 0.11) - 0.5) * 2.5 + crat(C, x, z), () => T.GRAVEL, 3, () => T.STONE); }
  function genMars() { const p = PL.mars; s = 0x3a25 + ((typeof gSeed !== 'undefined' ? gSeed | 0 : 0) >>> 0); const n = vn(), m = vn(), C = craters(26, 4, 30, p.size), S = p.size, ROCK = T.BLACKSTONE || T.COBBLE || T.STONE;
    const can = (x, z) => { const cz = S * 0.72 + Math.sin(x * 0.035) * 22, d = Math.abs(z - cz); return d < 12 ? -16 * (1 - Math.pow(d / 12, 2)) : 0; };
    const mesa = (x, z) => { const v = m(x, z, 0.045); return v > 0.66 ? 10 : v > 0.6 ? (v - 0.6) / 0.06 * 10 : 0; };
    fill(p, (x, z) => p.base + (n(x, z, 0.02) - 0.5) * 14 + Math.sin(x * 0.21 + n(x, z, 0.05) * 6) * 1.4 + mesa(x, z) + crat(C, x, z) + can(x, z),
      (x, z) => (mesa(x, z) > 3 ? ROCK : T.RSAND), 4, (x, y, z) => ((y * 7 + x + z) % 11 === 0 ? ROCK : T.STONE)); }
  function spawn() { const S = (PL[DIM.cur] || PL.moon).size, c = S >> 1; P.x = c + 3.5; P.z = c + 0.5; let y = H - 2; while (y > 1 && !world[idx(c + 3, y - 1, c)]) y--; P.y = y + 0.05; P.vy = 0; }
  U.land = async b => { if (!PL[b.id]) return false; await enterDim(b.id, b.id === 'moon' ? genMoon : genMars, spawn); if (DIM.cur !== b.id) return false; try { toast(PL[b.id].name + ' - gravity ' + PL[b.id].g + ' g. Ease off THRUST to land'); } catch (_) {} return true; };
  U.leave = async () => { if (!U.is()) return true; await exitDim(); return !DIM.cur; };
  // ---------- gravity, no fall damage, no mobs ----------
  try { const mv = moveY; moveY = function (dt) { try { if (U.is()) { const g = PL[DIM.cur].g; P.vy += 24 * dt * (1 - g); P.fallTop = null; if (P.vy < -40 * g - 6) P.vy = -40 * g - 6; } } catch (e) { ERR('mv', e); } return mv.apply(this, arguments); }; } catch (e) { ERR('mv0', e); }
  try { const sm = spawnMob; spawnMob = function () { if (U.is()) return null; return sm.apply(this, arguments); }; } catch (e) { ERR('sm0', e); }
  // ---------- space walk ----------
  U.jet = () => { try { return /jet/i.test(NAMES[armour[4]] || '') || armour.some(a => a && /jet/i.test(NAMES[a] || '')); } catch (_) { return false; } };
  U.startEva = (V, vel) => { U.eva = true; Object.assign(U.E, {x: V.x + 3, y: V.y + 6, z: V.z, vx: vel.x, vy: vel.y, vz: vel.z}); try { toast(U.jet() ? 'Space walk! Jetpack: move to thrust where you look, JUMP up, SHIFT down. Get within 12 blocks of the rocket to board' : 'Space walk! No jetpack - only a gentle push. Get within 12 blocks of the rocket to board'); } catch (_) {} };
  U.evaStep = (dt, mx, mz) => { const E = U.E, a = U.jet() ? 6 : 1.5, cy = Math.cos(P.pitch || 0), fx = -Math.sin(P.yaw) * cy, fy = Math.sin(P.pitch || 0), fz = -Math.cos(P.yaw) * cy, rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    const up = (keys.Space || jumpHeld || jumpHeldPad) ? 1 : 0, dn = (keys.ShiftLeft || keys.ShiftRight || sneakHeld) ? 1 : 0; jumpReq = false; jumpBuf = 0;
    E.vx += (fx * -mz + rx * mx) * a * dt; E.vy += (fy * -mz + up - dn) * a * dt; E.vz += (fz * -mz + rz * mx) * a * dt;
    E.x += E.vx * dt; E.y += E.vy * dt; E.z += E.vz * dt; const L = (window.__c305 && __c305.BOUND) || 12000, c = (W >> 1);
    for (const k of ['x', 'z']) if (!(window.__c309 && __c309.on) && Math.abs(E[k] - c) > L) { E[k] = c + Math.sign(E[k] - c) * L; E['v' + k] = 0; }
    if (false && E.x > -200 && E.x < W + 200 && E.z > -200 && E.z < D + 200 && E.y < 1000) { E.y = 1000; E.vy = Math.max(0, E.vy); } };
  // ---------- sky in the planet worlds ----------
  const C0 = new THREE.Color(), BK = new THREE.Color(0x000000);
  U.sky = (sc, c, alt) => { const p = PL[DIM.cur]; if (!p || !sc.background || !sc.background.isColor) return; C0.setHex(p.sky); const f = Math.max(0, Math.min(1, (alt - p.H) / 160));
    if (DIM.cur === 'mars') { const day = typeof daylight !== 'undefined' ? Math.max(0.3, daylight) : 1; C0.multiplyScalar(day); }
    C0.lerp(BK, f); sc.background.copy(C0); if (sc.fog) { sc.fog.color.copy(C0); sc.fog.near = 60 + f * 600; sc.fog.far = 200 + f * 900; } return DIM.cur === 'moon' || f > 0.2 || (typeof daylight !== 'undefined' && daylight < 0.4); };
})();
