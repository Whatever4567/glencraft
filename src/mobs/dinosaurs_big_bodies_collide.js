/* ===================== GLX-C230 (v1.0.50): dinosaurs - big bodies collide with their whole footprint (no walking through blocks) and steer round obstacles; heavy footsteps, richer roars and calls ===================== */
(function c230() {
  const D5 = window.__c165; if (!D5 || !D5.SP) return;
  const U = window.__c230 = {err: null, blocked: 0, steer: 0, steps: 0, roars: 0, unstuck: 0};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e).slice(0, 300); };
  const SP = D5.SP, isD = a => a && typeof a.kind === 'string' && !!SP[a.kind];
  // ---- footprint: a ring of points round the body at knee to back height must be clear ----
  function hits(a, x, y, z) { const s = SP[a.kind], r = s.r * 0.78, fy = Math.floor(y + 0.05), top = Math.min(fy + Math.ceil(Math.min(s.h, 7)) - 1, fy + 6), n = s.r > 1.6 ? 12 : 8; let c = 0;
    for (let k = 0; k < n; k++) { const an = k / n * 6.283, px = Math.floor(x + Math.sin(an) * r), pz = Math.floor(z + Math.cos(an) * r); for (let yy = fy + 1; yy <= top; yy++) if (solid(px, yy, pz)) { c++; break; } }
    for (let yy = fy + 1; yy <= top; yy++) if (solid(Math.floor(x), yy, Math.floor(z))) { c += 2; break; }
    return c; }
  U.hits = hits;
  const mm = moveMob; moveMob = function (a, dx, dz) {
    if (!isD(a) || SP[a.kind].r < 0.95) return mm.apply(this, arguments);
    const p = a.g.position, nx = p.x + dx, nz = p.z + dz, now = hits(a, p.x, p.y, p.z), nxt = hits(a, nx, p.y, nz);
    if (nxt > 0 && nxt >= now) { U.blocked++; a.__blk = (a.__blk || 0) + 1; return false; }   // never push further into blocks (moving out of them is always allowed)
    a.__blk = 0; return mm.apply(this, arguments); };
  // ---- steering: look ahead, turn toward the freer side before bumping; get unstuck if wedged ----
  function steer(a, dt) { const s = SP[a.kind]; if (s.r < 0.95) return; const p = a.g.position, la = s.r + 1.6;
    if ((a.__st = (a.__st || 0) - dt) > 0) return; a.__st = 0.35;
    const ahead = an => hits(a, p.x + Math.sin(an) * la, p.y, p.z + Math.cos(an) * la);
    const base = a.ang; if (ahead(base) === 0 && !(a.__blk > 2)) return;
    let best = null; for (const off of [0.5, -0.5, 1.0, -1.0, 1.6, -1.6, 2.4, -2.4, 3.14]) { if (ahead(base + off) === 0) { best = base + off; break; } }
    if (best !== null) { a.ang = best; a.wA = best; a.timer = Math.max(a.timer || 0, 1.2); U.steer++; }
    if (hits(a, p.x, p.y, p.z) > 2) { for (let r = 0.5; r <= 3; r += 0.5) { let done = false; for (let k = 0; k < 8 && !done; k++) { const an = k / 8 * 6.283, x = p.x + Math.sin(an) * r, z = p.z + Math.cos(an) * r; if (hits(a, x, p.y, z) === 0 && !solid(Math.floor(x), Math.floor(p.y + .05), Math.floor(z))) { p.x = x; p.z = z; done = true; U.unstuck++; } } if (done) break; } } }
  // ---- sound ----
  const dst = () => window.mobDst ? mobDst() : master;
  function noiseBuf(len) { const b = AC.createBuffer(1, Math.max(1, AC.sampleRate * len | 0), AC.sampleRate), c = b.getChannelData(0); let l = 0; for (let i = 0; i < c.length; i++) { l = (l + 0.04 * (Math.random() * 2 - 1)) / 1.04; c[i] = l * 3.5; } return b; }
  let NB = null;
  function out(pos, d, R) { const o = AC.createGain(); o.gain.value = Math.pow(Math.max(0, 1 - d / R), 1.1); try { const pn = AC.createStereoPanner(), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw); pn.pan.value = d > 0.1 ? ((pos.x - P.x) * rx + (pos.z - P.z) * rz) / d * 0.8 : 0; o.connect(pn); pn.connect(dst()); } catch (_) { o.connect(dst()); } return o; }
  function thud(pos, d, big) { if (!AC || AC.state !== 'running') return; const R = big ? 46 : 26; if (d > R) return; const t = AC.currentTime + 0.01, o = out(pos, d, R);
    const os = AC.createOscillator(), g = AC.createGain(); os.type = 'sine'; os.frequency.setValueAtTime(big ? 58 : 90, t); os.frequency.exponentialRampToValueAtTime(big ? 30 : 50, t + 0.3); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(big ? 0.9 : 0.45, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38); os.connect(g); g.connect(o); os.start(t); os.stop(t + 0.42);
    if (!NB) NB = noiseBuf(0.5); const n = AC.createBufferSource(), lp = AC.createBiquadFilter(), ng = AC.createGain(); n.buffer = NB; lp.type = 'lowpass'; lp.frequency.value = big ? 260 : 520; ng.gain.setValueAtTime(big ? 0.5 : 0.3, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); n.connect(lp); lp.connect(ng); ng.connect(o); n.start(t); n.stop(t + 0.3); U.steps++; }
  // roar: breathy noise through moving formants + a growling sub, for the meat-eaters and the big ones
  function roar(kind, pos, d) { if (!AC || AC.state !== 'running') return false; const R = kind === 'd_apato' ? 60 : 44; if (d > R) return true; const t = AC.currentTime + 0.02, o = out(pos, d, R), p = 0.9 + Math.random() * 0.2;
    const len = kind === 'd_apato' ? 2.8 : kind === 'd_allo' ? 2.0 : 1.5, n = AC.createBufferSource(); n.buffer = noiseBuf(len + 0.1);
    const fs = kind === 'd_apato' ? [[180, 120], [420, 300]] : [[420, 300], [900, 640], [1700, 1100]];
    for (const [f0, f1] of fs) { const bp = AC.createBiquadFilter(), g = AC.createGain(); bp.type = 'bandpass'; bp.Q.value = 5; bp.frequency.setValueAtTime(f0 * p, t); bp.frequency.linearRampToValueAtTime(f0 * 1.15 * p, t + len * 0.3); bp.frequency.exponentialRampToValueAtTime(f1 * p, t + len);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.18); g.gain.setValueAtTime(0.9, t + len * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + len); n.connect(bp); bp.connect(g); g.connect(o); }
    const os = AC.createOscillator(), og = AC.createGain(), lf = AC.createOscillator(), lg = AC.createGain(); os.type = 'sawtooth'; os.frequency.setValueAtTime((kind === 'd_apato' ? 48 : 72) * p, t); os.frequency.exponentialRampToValueAtTime((kind === 'd_apato' ? 34 : 46) * p, t + len);
    lf.frequency.value = 23; lg.gain.value = 14; lf.connect(lg); lg.connect(os.frequency); const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.55, t + 0.2); og.gain.exponentialRampToValueAtTime(0.0001, t + len); os.connect(lp); lp.connect(og); og.connect(o); os.start(t); os.stop(t + len + 0.05); lf.start(t); lf.stop(t + len + 0.05); n.start(t); n.stop(t + len + 0.1); U.roars++; return true; }
  U.roar = roar; U.thud = thud;
  const old = window.__c165v; window.__c165v = (k, p, d) => { try { if ((k === 'd_allo' || k === 'd_bary' || k === 'd_apato') && roar(k, p, d)) { if (k !== 'd_apato' && old) old(k, p, d + 8); return; } } catch (e) { ERR(e); } if (old) old(k, p, d); };
  // ---- per frame: steering + footsteps in step with the stride ----
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
    try { const t = Math.min(0.1, +dt || 0.016); for (const a of mobs) { if (!isD(a) || !a.g) continue; const s = SP[a.kind], p = a.g.position;
        if (a.moving) steer(a, t);
        const lp = a.__lp || (a.__lp = [p.x, p.z]), v = Math.hypot(p.x - lp[0], p.z - lp[1]) / t; lp[0] = p.x; lp[1] = p.z;
        if (s.h >= 2.6 && v > 0.25 && a.onGround !== false) { a.__ph = (a.__ph || 0) + v * t / (s.h * 0.55); if (a.__ph >= 1) { a.__ph -= 1; const d = Math.hypot(p.x - P.x, p.z - P.z); thud(p, d, !!s.big || s.h > 3.5); if (s.big && d < 16) try { shake(0.12, 0.01 * (1 - d / 16)); } catch (_) {} } } } } catch (e) { ERR(e); }
    return r; };
})();
