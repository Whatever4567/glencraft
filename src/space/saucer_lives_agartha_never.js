/* GLX-C304 (v1.0.112): THE SAUCER LIVES IN AGARTHA. It never despawns. By day it is parked in the crystal city; at dusk it flies out along
   the 2000 block tunnel, out of the ice wall mouth, climbs above everything and crosses to the pyramid desert at a medium-fast 35 blocks a
   second, then does its tic-tac darts over the desert all night. At dawn it flies the same route back. Its position is simulated all the
   time (wherever you are); the saucer mesh (C246) is only made when you are in the same place and near it. Old saves keep the old saucer. */
(function c304() {
  const U = window.__c304 = {err: null, ph: 'park', s: 0, sp: 35, pos: null, sh: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const C = () => window.__c246, A = () => window.__c294;
  const night = () => { try { return (typeof isNight !== 'undefined' && isNight) || (typeof daylight === 'number' && daylight < 0.3); } catch (_) { return false; } };
  U.on = () => { try { const a = A(); return !!(started && a && (a.M || big()) && a.AG && window.__c239 && __c239.pyr); } catch (_) { return false; } };
  let PTS = null, LEN = 0, key = '';
  // v1.1.39: on the round Earth the saucer's home is on the sand beside the desert pyramid (the old ice wall mouth is gone)
  const big = () => { try { return !!(window.__c317 && __c317.on() && !DIM.cur); } catch (_) { return false; } };
  // v1.1.40: the saucer lives at the North Pole beside the way down to Agartha, and flies FAST (about 260 blocks a second) round the curve of the Earth to the pyramids
  function buildN(py, po) { const k = 'n' + py.cx + ',' + po.x + ',' + po.z; if (k === key && PTS) return true; key = k; const e = __c320, c = e.E(), R = e.R, ty = Math.min(H - 6, 122), hy = Math.min(H - 8, (py.cy || SEA + 20) + 38);
    if (e.flat) { const hx = po.x + 12, hz = po.z, R0 = window.__agw && __agw.route && __agw.route(); if (window.__agw && !R0) key = ''; PTS = (R0 || [['ow', hx + .5, po.top + 4, hz + .5]]).concat([['ow', hx + .5, SEA + 160, hz + .5], ['ow', py.cx + .5, SEA + 160, py.cz + .5], ['ow', py.cx + .5, hy, py.cz + .5]]);   /* v1.1.87: it sleeps in the crystal city under Scotland and flies out up the spiral cave */
      let L = 0; PTS[0].push(0); for (let i = 1; i < PTS.length; i++) { const p = PTS[i], q = PTS[i - 1]; L += Math.hypot(p[1] - q[1], p[2] - q[2], p[3] - q[3]); p.push(L); } LEN = L; U.len = Math.round(L); U.home = 'north pole'; U.sp = 260; return true; }
    const hx = po.x + 9, hz = po.z, A = [hx - c[0], po.top + 4 - c[1], hz - c[2]], B = [py.cx + .5 - c[0], ty - c[1], py.cz + .5 - c[2]], la = Math.hypot(...A), lb = Math.hypot(...B), a = A.map(v => v / la), b = B.map(v => v / lb);
    const om = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))), so = Math.sin(om) || 1;
    PTS = [['ow', hx + .5, po.top + 4, hz + .5], ['ow', hx + .5, po.top + 140, hz + .5]]; const N = 24;
    for (let i = 1; i < N; i++) { const t = i / N, ka = Math.sin((1 - t) * om) / so, kb = Math.sin(t * om) / so, rr = R + 170; PTS.push(['ow', c[0] + (a[0] * ka + b[0] * kb) * rr, c[1] + (a[1] * ka + b[1] * kb) * rr, c[2] + (a[2] * ka + b[2] * kb) * rr]); }
    PTS.push(['ow', py.cx + .5, ty, py.cz + .5], ['ow', py.cx + .5, hy, py.cz + .5]);
    let L = 0; PTS[0].push(0); for (let i = 1; i < PTS.length; i++) { const p = PTS[i], q = PTS[i - 1]; L += Math.hypot(p[1] - q[1], p[2] - q[2], p[3] - q[3]); p.push(L); } LEN = L; U.len = Math.round(L); U.home = 'north pole'; U.sp = 260; return true; }
  function buildP() { const py = __c239.pyr, po = window.__c332 && __c332.pole; if (po && window.__c320 && buildN(py, po)) return; const k = 'p' + py.cx + ',' + py.cz; if (k === key && PTS) return; key = k; const hx = py.cx + 70, hz = py.cz, ty = Math.min(H - 6, 122), hy = Math.min(H - 8, (py.cy || SEA + 20) + 38);
    let gy = SEA + 2; try { gy = groundTop(hx, hz) + 1; } catch (_) {} PTS = [['ow', hx + .5, gy + 6, hz + .5], ['ow', hx + .5, ty, hz + .5], ['ow', py.cx + .5, ty, py.cz + .5], ['ow', py.cx + .5, hy, py.cz + .5]];
    let L = 0; PTS[0].push(0); for (let i = 1; i < PTS.length; i++) { const p = PTS[i], q = PTS[i - 1]; L += Math.hypot(p[1] - q[1], p[2] - q[2], p[3] - q[3]); p.push(L); } LEN = L; U.len = Math.round(L); U.home = 'pyramid'; }
  function build() { const a = A(), M = a.M; if (!M || big()) return buildP(); const G = a.AG, py = __c239.pyr, k = M.x + ',' + M.z + ',' + py.cx; if (k === key && PTS) return; key = k;
    const X7 = window.__c307; if (X7 && X7.ready && X7.route) { const o2 = a.WP(M.df + 26, 0), ty = Math.min(H - 6, 122), hy = Math.min(H - 8, (py.cy || SEA + 20) + 38), c = X7.L.city;
      PTS = [['ow', c[0] + .5, X7.L.FL + 14, c[1] - 40]].concat(X7.route.slice().reverse().map(p => ['ow', p[0] + .5, p[1], p[2] + .5]));
      PTS.push(['ow', o2[0] + .5, (M.f0 || SEA + 2) + 11, o2[1] + .5], ['ow', o2[0] + .5, ty, o2[1] + .5], ['ow', py.cx + .5, ty, py.cz + .5], ['ow', py.cx + .5, hy, py.cz + .5]);
      let L = 0; PTS[0].push(0); for (let i = 1; i < PTS.length; i++) { const p = PTS[i], q = PTS[i - 1]; L += Math.hypot(p[1] - q[1], p[2] - q[2], p[3] - q[3]); p.push(L); } LEN = L; U.len = Math.round(L); return; }
    const o1 = a.WP(1, 0), o2 = a.WP(M.df + 26, 0), ty = Math.min(H - 6, 122), hy = Math.min(H - 8, (py.cy || SEA + 20) + 38);
    PTS = [['ag', G.CX + .5, 19, G.CZ + 40], ['ag', G.CX + .5, 20, G.TL + 6], ['ag', G.CX + .5, 22, G.TL - 150], ['ag', G.CX + .5, 24, 1],
      ['ow', o1[0] + .5, SEA + 13, o1[1] + .5], ['ow', o2[0] + .5, (M.f0 || SEA + 2) + 11, o2[1] + .5], ['ow', o2[0] + .5, ty, o2[1] + .5], ['ow', py.cx + .5, ty, py.cz + .5], ['ow', py.cx + .5, hy, py.cz + .5]];
    let L = 0; PTS[0].push(0); for (let i = 1; i < PTS.length; i++) { const p = PTS[i], q = PTS[i - 1]; if (p[0] === q[0]) L += Math.hypot(p[1] - q[1], p[2] - q[2], p[3] - q[3]); p.push(L); } LEN = L; U.len = Math.round(L); }
  function at(s) { for (let i = 1; i < PTS.length; i++) { const p = PTS[i], q = PTS[i - 1]; if (s <= p[4]) { if (p[0] !== q[0]) return [p[0], p[1], p[2], p[3]];
        const k = (s - q[4]) / Math.max(1e-6, p[4] - q[4]); return [p[0], q[1] + (p[1] - q[1]) * k, q[2] + (p[2] - q[2]) * k, q[3] + (p[3] - q[3]) * k]; } }
    const e = PTS[PTS.length - 1]; return [e[0], e[1], e[2], e[3]]; }
  // all-night tic-tac over the desert
  const Z = {wp: null, hold: 0};
  function zig(dt, p) { const py = __c239.pyr, e = PTS[PTS.length - 1]; if (Z.hold > 0) { Z.hold -= dt; return; }
    if (!Z.wp) { Z.n = ((Z.n || 0) + 1) % 4; Z.wp = [py.cx + (Math.random() - .5) * 160, e[2] - 8 + Math.random() * 26, py.cz + (Math.random() - .5) * 160]; }
    const dx = Z.wp[0] - p[1], dy = Z.wp[1] - p[2], dz = Z.wp[2] - p[3], L = Math.hypot(dx, dy, dz), st = Math.min(L, 140 * dt);
    p[1] += dx / Math.max(L, 1e-3) * st; p[2] += dy / Math.max(L, 1e-3) * st; p[3] += dz / Math.max(L, 1e-3) * st;
    if (L < 1) { Z.wp = null; Z.hold = Z.n ? 0.25 + Math.random() * 0.6 : 1.5 + Math.random() * 3; } }
  function step(dt) { build(); const n = night();
    if (!U.pos) { U.ph = n ? 'zig' : 'park'; U.s = n ? LEN : 0; U.pos = at(U.s); }
    if (n && (U.ph === 'park' || U.ph === 'back')) U.ph = 'out';
    if (!n && (U.ph === 'zig' || U.ph === 'out' || U.ph === 'home')) U.ph = U.ph === 'zig' ? 'home' : 'back';
    const p = U.pos;
    if (U.ph === 'out') { U.s = Math.min(LEN, U.s + U.sp * dt); U.pos = at(U.s); if (U.s >= LEN) U.ph = 'zig'; }
    else if (U.ph === 'zig') zig(dt, p);
    else if (U.ph === 'home') { const e = at(LEN), dx = e[1] - p[1], dy = e[2] - p[2], dz = e[3] - p[3], L = Math.hypot(dx, dy, dz), st = Math.min(L, U.sp * dt);
      p[1] += dx / Math.max(L, 1e-3) * st; p[2] += dy / Math.max(L, 1e-3) * st; p[3] += dz / Math.max(L, 1e-3) * st; if (L < 1) { U.ph = 'back'; U.s = LEN; } }
    else if (U.ph === 'back') { U.s = Math.max(0, U.s - U.sp * dt); U.pos = at(U.s); if (U.s <= 0) U.ph = 'park'; }
    else { U.s = 0; U.pos = at(0); U.pos[2] += Math.sin(performance.now() / 900) * 0.6; } }
  function show() { const c = C(); if (!c || !c.spawnAt) return; const here = DIM.cur === 'agartha' ? 'ag' : !DIM.cur ? 'ow' : null, p = U.pos, u = c.ufo();
    const near = p && here === p[0] && Math.hypot(p[1] - P.x, p[3] - P.z) < 640;
    if (!near) { if (u && u.st === 'fly') c.drop(); return; }
    if (!u) { c.spawnAt(p[1], p[2], p[3]); U.sh++; } }
  try { const c = () => C(); const hook = () => { const x = c(); if (!x || x.__c304) return !!x; x.ctlOn = () => U.on();
      x.ctl = (u, dt) => { const g = u.g.position, p = U.pos; if (!p) return; const dx = p[1] - g.x, dy = p[2] - g.y, dz = p[3] - g.z, L = Math.hypot(dx, dy, dz);
        if (L > 3) { const st = Math.min(L, Math.max(140, U.sp * 1.4) * dt); g.x += dx / L * st; g.y += dy / L * st; g.z += dz / L * st; } else g.set(p[1], p[2], p[3]);
        u.g.rotation.z = Math.max(-0.25, Math.min(0.25, -dx * 0.05)); }; x.__c304 = 1; return true; };
    if (!hook()) { const t = setInterval(() => { if (hook()) clearInterval(t); }, 500); } } catch (e) { ERR('hook', e); }
  let last = performance.now();
  setInterval(() => { const t = performance.now(), dt = Math.min(1, (t - last) / 1000); last = t; try { if (!U.on() || DIM.busy) return; step(dt); show(); } catch (e) { ERR('step', e); } }, 50);
  try { const ew = enterWorld; enterWorld = function () { U.pos = null; key = ''; PTS = null; return ew.apply(this, arguments); }; } catch (e) { ERR('ew', e); }
})();
