/* GLX-AG1220 (v1.2.20): Agartha calm. The crystal city floor is Gloamstone with Glowcap paths, its trees are gone, the cool blue and violet
   inner sky dome is back, and seven Agarthans (in their own lore an old Egyptian people who call their elder Sekhen, old friend) walk the
   ring path on the real floor. Hit one and all seven stop, turn to stare at you with glowing eyes, and speak together once. */
(function ag1220() {
  const U = window.__ag1220 = {err: null, post: null, trees: 0, floor: 0, path: 0, ring: null, stares: 0, voice: 0, n: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const GLOAM = 771, CAP = (T.GLOWCAP || 100);
  let LOG = null; const isLog = b => { if (!LOG) { LOG = new Set(); for (const k in NAMES) { const n = String(NAMES[k] || ''); if (/\blog\b|\bwood\b|trunk/i.test(n) && !/plank|stair|slab|fence|door|sign/i.test(n)) LOG.add(+k); } } return LOG.has(b); };
  const GROUND = b => b === T.GRASS || b === T.DIRT || b === 218 || b === 770 || b === T.SAND || b === T.MUD || b === T.MOSS || b === T.PEAT || b === T.GRAVEL;
  // ---- one pass over the Agartha stamp, right after it is made (the stamp is rebuilt from the generator at every load, edits stay on top) ----
  U.post = (st, A, SW, SD, YN, ZS, AX, AY) => { const ix = (x, z, y) => (x * SD + z) * YN + y, cx = A.city[0], cz = A.city[1] - ZS, R = A.city[2], F = A.FL;
    for (let i = 0; i < st.length; i++) { const b = st[i]; if (b && (LEAFY[b] || isLog(b))) { st[i] = 0; U.trees++; } }
    const spires = (A.spires || []).map(s => [s[0], s[1] - ZS, s[3] || 3]);
    const clearAt = (x, z) => { x = Math.floor(x); z = Math.floor(z); if (x < 1 || z < 1 || x >= SW - 1 || z >= SD - 1) return false; if (!st[ix(x, z, F - 1)]) return false; for (let y = F; y < F + 3; y++) { const b = st[ix(x, z, y)]; if (b && !PLANT[b]) return false; } return true; };
    // ring radius with the clearest floor
    let best = null; for (let f = 0.34; f <= 0.8; f += 0.04) { const r = R * f; let ok = 0; for (let k = 0; k < 72; k++) { const a = k / 72 * 6.283, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (clearAt(x, z) && !spires.some(s => Math.hypot(x - s[0], z - s[1]) < s[2] + 2.5)) ok++; } if (!best || ok > best.ok) best = {r, ok}; }
    const rp = best.r; U.ring = {X: cx + AX + 0.5, Z: cz + 0.5, R: rp, ok: best.ok, Y: F + AY};   // world x = stamp x + AX, world z = stamp z, world y = stamp y + AY
    const onPath = (x, z) => { const dx = x + 0.5 - cx, dz = z + 0.5 - cz, d = Math.hypot(dx, dz); if (Math.abs(d - rp) < 1.2) return true;
      if (d > 3 && d < R - 4) { const a = Math.atan2(dz, dx); for (let k = 0; k < 6; k++) { const q = k / 6 * 6.283, e = Math.abs(Math.sin(a - q)) * d; if (e < 0.9 && Math.cos(a - q) > 0) return true; } } return false; };
    for (let x = Math.max(0, cx - R); x < Math.min(SW, cx + R); x++) for (let z = Math.max(0, cz - R); z < Math.min(SD, cz + R); z++) { if (Math.hypot(x + 0.5 - cx, z + 0.5 - cz) > R - 1) continue;
      const i = ix(x, z, F - 1), b = st[i]; if (!b || !(GROUND(b) || b === GLOAM)) continue; const p = onPath(x, z); st[i] = p ? CAP : GLOAM; if (p) U.path++; else U.floor++;
      const a = ix(x, z, F); if (p && st[a] && PLANT[st[a]]) st[a] = 0; } };
  // ---- the seven ----
  const LORE = 'You monkeys are destroying our planet. You must stop wars and stop destroying our planet. Listen to Sekhen.';
  U.LORE = LORE;
  let grp = null, folk = [], built = null, stareT = 0, voiceT = -1e9, sub = null; const M = c => new THREE.MeshBasicMaterial({color: c});
  const EYE0 = 0x2a6e9e, EYE1 = 0xaaf4ff;
  function make(ring) { grp = new THREE.Group(); grp.visible = false; scene.add(grp); const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const linen = M(0xdfe8f2), sash = M(0x3a5fb0), skin = M(0xc89a74), hair = M(0x1a1a24), band = M(0x4a7ad0), eyeM = M(EYE0); U.eyeM = eyeM;
    const G = {leg: bx(.16, 1.2, .16), body: bx(.42, .95, .24), arm: bx(.12, 1.0, .12), head: bx(.34, .42, .34), nem: bx(.4, .2, .4), lap: bx(.12, .34, .06), belt: bx(.44, .08, .26), eye: bx(.1, .05, .02)};
    for (let k = 0; k < 7; k++) { const p = new THREE.Group(), mk = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o; };
      const lg = [mk(G.leg, linen, -.1, .6, 0), mk(G.leg, linen, .1, .6, 0)]; mk(G.body, linen, 0, 1.68, 0); mk(G.belt, sash, 0, 1.25, 0);
      const ar = [mk(G.arm, skin, -.28, 1.65, 0), mk(G.arm, skin, .28, 1.65, 0)]; const hd = new THREE.Group(); hd.position.set(0, 2.38, 0); p.add(hd);
      const mh = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); hd.add(o); return o; };
      mh(G.head, skin, 0, 0, 0); mh(G.nem, hair, 0, .22, 0); mh(G.lap, band, -.2, -.05, .02); mh(G.lap, band, .2, -.05, .02); mh(G.eye, eyeM, -.08, .04, .175); mh(G.eye, eyeM, .08, .04, .175);
      p.traverse(o => { o.frustumCulled = false; });
      const a0 = k / 7 * 6.283; const f = {g: p, lg, ar, hd, a: a0, ph: k, kind: 'agarthan', __ag: 1, hitY: 1.6, hitR: 0.6, hp: 20, hostile: false};
      grp.add(p); folk.push(f); }
    built = ring; U.n = folk.length; }
  const place = (f, ring) => { const x = ring.X + Math.cos(f.a) * ring.R, z = ring.Z + Math.sin(f.a) * ring.R; f.g.position.set(x, ring.Y, z); };
  function voice() { const now = performance.now(); if (now - voiceT < 45000) return; voiceT = now; U.voice++;
    try { const a = new Audio('assets/voice/agarthan_choir.mp3'); a.volume = Math.min(1, (typeof SET !== 'undefined' ? SET.sfx : 0.8) + 0.15); a.play().catch(() => {}); } catch (_) {}
    try { if (!sub) { sub = document.createElement('div'); sub.style.cssText = 'position:fixed;left:50%;bottom:22%;transform:translateX(-50%);z-index:60;max-width:80vw;text-align:center;font:600 18px/1.35 system-ui,sans-serif;color:#cfefff;text-shadow:0 0 8px #3ad0ff,0 2px 3px #000;pointer-events:none;opacity:0;transition:opacity .4s'; document.body.appendChild(sub); }
      sub.textContent = LORE; sub.style.opacity = 1; clearTimeout(sub._t); sub._t = setTimeout(() => { sub.style.opacity = 0; }, 7200); } catch (_) {} }
  U.trigger = () => { stareT = 22; U.stares++; try { U.eyeM.color.setHex(EYE1); } catch (_) {} voice(); };
  U.tick = (dt) => { const ring = window.__ag1220.ring, l = window.__agw && __agw.L; const ok = ring && l && started && !DIM.cur && !(typeof SET !== 'undefined' && SET.noMobs) && !(typeof dead !== 'undefined' && dead);
    const near = ok && Math.hypot(P.x - ring.X, P.z - ring.Z) < ring.R + 70 && Math.abs(P.y - ring.Y) < 40;
    if (!near) { if (grp) grp.visible = false; if (stareT > 0 && !ok) { stareT = 0; try { U.eyeM.color.setHex(EYE0); } catch (_) {} } return; }
    if (built !== ring) { if (grp) { scene.remove(grp); folk = []; } make(ring); }
    grp.visible = true;
    if (stareT > 0) { stareT -= dt; for (const f of folk) { const p = f.g.position; f.g.rotation.y = Math.atan2(P.x - p.x, P.z - p.z); const dy = P.y + 1.6 - (p.y + 2.4), dh = Math.hypot(P.x - p.x, P.z - p.z) || 1; f.hd.rotation.x = Math.max(-0.6, Math.min(0.6, -Math.atan2(dy, dh))); f.lg[0].rotation.x = f.lg[1].rotation.x = f.ar[0].rotation.x = f.ar[1].rotation.x = 0; }
      if (stareT <= 0) { try { U.eyeM.color.setHex(EYE0); } catch (_) {} for (const f of folk) f.hd.rotation.x = 0; } return; }
    const w = 0.75 / ring.R; for (const f of folk) { f.a += w * dt; place(f, ring); f.g.rotation.y = Math.atan2(-Math.sin(f.a), Math.cos(f.a)) ; f.ph += dt * 4.5; const s = Math.sin(f.ph) * 0.4; f.lg[0].rotation.x = s; f.lg[1].rotation.x = -s; f.ar[0].rotation.x = -s * .6; f.ar[1].rotation.x = s * .6; } };
  U.folk = () => folk;
  let last = performance.now(); (function loop() { requestAnimationFrame(loop); const t = performance.now(), dt = Math.min(0.1, (t - last) / 1000); last = t; try { U.tick(dt); } catch (e) { ERR('tick', e); } })();
  // ---- hits: melee finds them like any mob; any damage route that reaches one wakes the stare instead of hurting it ----
  try { const rm = reachMob; reachMob = function () { if (!grp || !grp.visible || !folk.length) return rm.apply(this, arguments); const n = mobs.length; for (const f of folk) mobs.push(f); try { return rm.apply(this, arguments); } finally { mobs.length = n; } }; } catch (e) { ERR('rm', e); }
  try { const hm = hitMob; hitMob = function (a) { if (a && a.__ag) { try { sfx('hit'); } catch (_) {} U.trigger(); return; } return hm.apply(this, arguments); }; } catch (e) { ERR('hm', e); }
  try { const dm = damageMob; damageMob = function (a) { if (a && a.__ag) { U.trigger(); return; } return dm.apply(this, arguments); }; } catch (e) { ERR('dm', e); }
})();
