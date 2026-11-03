/* ===================== GLX-C186 (v1.0.35): creepers are heard again - a hiss when one spots you and a soft servo whirr as it stalks you, through the mob voices bus (the quieter Siren Head alarm is unchanged) ===================== */
// Why they were silent: the cyborg brain (c116) marks a creeper 'aggro' the moment it sees you, which skips the old notice step - the only place the hiss played - so a creeper made
// no sound at all until it was close enough to start its fuse.
(function c186() {
  const U = window.__c186 = {hiss: 0, whirr: 0, err: null};
  const bus = () => (window.creepDst ? creepDst() : window.mobDst ? mobDst() : master);   // v1.0.37: the quieter creeper sub-bus
  function viaBus(fn) { if (!AC || !master) return; const m = master; try { master = bus() || m; fn(); } catch (e) { U.err = String(e); } finally { master = m; } }
  function whirr(pos) { if (!AC || !master) return; const d = Math.hypot(pos.x - P.x, pos.y - P.y, pos.z - P.z); if (d > 18) return;
    try { const t = AC.currentTime, v = 0.07 * Math.pow(1 - d / 18, 1.4), out = AC.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(v + 0.0002, t + 0.05); out.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      let o2 = out; if (AC.createStereoPanner) { const pn = AC.createStereoPanner(); const yaw = P.yaw || 0, dx = pos.x - P.x, dz = pos.z - P.z; pn.pan.value = Math.max(-1, Math.min(1, (dx * Math.cos(yaw) - dz * Math.sin(yaw)) / Math.max(1, d))); out.connect(pn); o2 = pn; }
      o2.connect(bus());
      const o = AC.createOscillator(), f = AC.createBiquadFilter(); o.type = 'square'; f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 3; const f0 = 260 + Math.random() * 60;
      o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * 1.6, t + 0.22); o.frequency.linearRampToValueAtTime(f0 * 1.15, t + 0.5); o.connect(f); f.connect(out); o.start(t); o.stop(t + 0.6);
      const b = AC.createOscillator(), bg = AC.createGain(); b.type = 'sine'; b.frequency.value = 1320; bg.gain.setValueAtTime(0.0001, t + 0.3); bg.gain.exponentialRampToValueAtTime(0.35, t + 0.32); bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.42); b.connect(bg); bg.connect(out); b.start(t + 0.3); b.stop(t + 0.45);
      U.whirr++; } catch (e) { U.err = String(e); } }
  U.whirrAt = whirr;
  try { const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
      try { if (started && !dead && !paused) for (const a of mobs) { if (a.kind !== 'creeper' || !a.g) continue; const p = a.g.position, d = Math.hypot(p.x - P.x, p.z - P.z);
          if (a.arm > 0) continue;   // the fuse siren takes over
          if (a.aggro > 0 && d < 16) { if (!a.c186h) { a.c186h = true; a.c186w = 1.2 + Math.random(); viaBus(() => hiss(p, 1)); U.hiss++; }
            if ((a.c186w -= dt) <= 0) { a.c186w = 2.4 + Math.random() * 1.8; whirr(p); } }
          else if (!(a.aggro > 0) || d > 24) { a.c186q = (a.c186q || 0) + dt; if (a.c186q > 5) { a.c186h = false; a.c186q = 0; } } } } catch (e) { U.err = String(e); }
      return r; }; } catch (e) { U.err = String(e); }
})();
/* GLX-C186b (v1.0.35): ores in the spawn hills. The world's ore pass skips the spawn island's stone to keep its buildings clean, and the later terrain passes
   leave the new mainland hills bare - so seed the same ore table there afterwards, only in natural rock 3+ blocks under grass / dirt / snow / stone. */
(function c186b() {
  const U = window.__c186b = {st: null, err: null};
  const NAT = () => new Set([T.GRASS, T.DIRT, T.SNOW, T.HEATHER, T.STONE, T.GRAVEL, T.PEAT, T.COBBLE].filter(v => v !== undefined));
  const ge = generate; generate = function () { const r = ge.apply(this, arguments);
    try { if (!DIM.cur && window.__c181 && __c181.on() && window.__c104 && __c104.ORES && window.__c101 && __c101.isl) U.st = pass(); } catch (e) { U.err = String(e && e.stack || e); }
    return r; };
  function pass() { const t0 = performance.now(), I = __c101.isl, R = I.R + 4, N = NAT(); let sd = ((gSeed || 1) ^ 0x186b0e) >>> 0 || 17; const rnd = () => (sd = (Math.imul(sd, 16807) >>> 0) % 2147483647) / 2147483647;
    const placed = i => typeof placedSet !== 'undefined' && placedSet && placedSet.has(i), host = b => b === T.STONE || b === T.DEEPSLATE;
    const tops = new Map(), top = (x, z) => { const k = x * D + z; let t = tops.get(k); if (t === undefined) { t = solidTop(x, z); tops.set(k, t); } return t; };
    const ok = (x, y, z) => { if (x < 2 || z < 2 || x > W - 3 || z > D - 3 || y < SEA - 8 || Math.hypot(x - I.cx, z - I.cz) > R) return false; const tp = top(x, z); return y <= tp - 3 && N.has(world[idx(x, tp, z)]); };
    const cols = Math.PI * R * R / 1000, put = {};
    for (const [name, id, per, lo, hi, s0, s1, rule] of __c104.ORES()) { if (id === undefined || rule === 'hide') continue; const n = Math.round(per * cols); let pl = 0;
      for (let v = 0; v < n; v++) { let got = null;
        for (let t = 0; t < 10 && !got; t++) { const an = rnd() * 6.2832, rr = Math.sqrt(rnd()) * R, x = Math.round(I.cx + Math.cos(an) * rr), z = Math.round(I.cz + Math.sin(an) * rr); if (x < 2 || z < 2 || x > W - 3 || z > D - 3) continue;
          const tp = top(x, z); if (rule === 'mtn' && tp < SEA + 28) continue; const yl = lo, yh = Math.min(hi, tp - 3); if (yh < yl) continue;
          const y = Math.round(rule === 'u' ? yl + rnd() * (yh - yl) : yl + (yh - yl) * (rnd() + rnd()) / 2); if (y < SEA - 8) break; if (host(world[idx(x, y, z)]) && ok(x, y, z)) got = [x, y, z]; }
        if (!got) continue; let [x, y, z] = got; const len = Math.round(s0 + rnd() * (s1 - s0));
        for (let k = 0; k < len; k++) { if (ok(x, y, z)) { const i = idx(x, y, z); if (host(world[i]) && !placed(i)) { world[i] = id; pl++; } }
          const q = rnd() * 6 | 0; if (q === 0) x++; else if (q === 1) x--; else if (q === 2) z++; else if (q === 3) z--; else if (q === 4) y++; else y--; } }
      put[name] = pl; }
    return {ms: Math.round(performance.now() - t0), put}; }
})();
