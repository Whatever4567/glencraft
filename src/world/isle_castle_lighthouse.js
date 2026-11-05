/* GLX-LHSE (v1.1.93): a stone castle lighthouse on a rocky skerry just off a little isle in the far north of Scotland (Orkney way, north east of the Agartha cave).
   Our own design: three round stone tiers that get narrower going up, each with battlements, a stone walkway that spirals round the outside
   from the door to the top, a glass lantern room with a lamp burning in it and a pointed roof. It is part of the land, so blocks you place or dig there are kept. */
(function lhse() {
  const U = window.__lhse = {err: null, ok: 0, base: null, X: 792, Z: -404};
  const ERR = (w, e) => { if (!U.err) U.err = w + ': ' + (e && e.message || e); };
  let X = U.X, Z = U.Z; const TIERS = [[6.5, 12], [5.3, 10], [4.2, 8]], LR = 3.2, LH = 5, R0 = 10;
  let B = null, TOP = 0;
  function blk(x, y, z) { const dx = x + 0.5 - X, dz = z + 0.5 - Z, r = Math.hypot(dx, dz); if (r > R0) return undefined; const y0 = B, j = y - y0;
    if (j < -30 || j > TOP + 8) return undefined; const SB = T.STONEBRICK || T.STONE, MB = T.MOSSYBRICK || SB, CB = T.COBBLE || SB;
    if (j < 0) { const rr = 8.6 + (h(x >> 1, 0, z >> 1) - 0.5) * 2.2 - (j === -1 ? 1.2 : 0); return r < rr ? (j === -1 ? (r < 7 ? SB : (h(x, j, z) < 0.5 ? T.MOSS || CB : CB)) : (T.STONE || CB)) : undefined; }   // a rocky skerry for it to stand on
    const ang = Math.atan2(dz, dx);
    // the walkway: a ledge two blocks wide that climbs once round per tier on the outside, with a little wall on its edge
    let y1 = 0; for (let t = 0; t < TIERS.length; t++) { const [tr, th] = TIERS[t]; if (j >= y1 && j < y1 + th + 1) { const a = ((ang + Math.PI) / (2 * Math.PI)), lj = y1 + Math.floor(a * th);
        if (r >= tr && r < tr + 2 && j === lj) return SB; if (r >= tr + 2 && r < tr + 2.7 && j === lj + 1) return CB; if (r >= tr && r < tr + 2.7 && j > lj && j <= lj + 3) { /* headroom */ } }
      if (j >= y1 && j < y1 + th) { if (r < tr) { const wall = r > tr - 1.2; if (!wall) return j === y1 ? SB : 0;
          if (t === 0 && j < y1 + 3 && j > y1 && Math.abs(dx) < 1.2 && dz > 0) return 0;   // door, facing south
          if ((j - y1) % 4 === 2 && Math.abs(Math.sin(ang * 2)) < 0.18) return 0;            // small windows
          return h(x, y, z) < 0.18 ? MB : SB; } return r < tr + 2.7 ? 0 : undefined; }
      if (j === y1 + th && r < tr + 0.2) return SB;   // floor between tiers
      if (j === y1 + th + 1 && r >= tr - 1.2 && r < tr + 0.2 && Math.floor((ang + Math.PI) * 4) % 2 === 0) return SB;   // battlements
      y1 += th + 1; }
    // lantern room
    if (j > y1 && j <= y1 + LH) { if (r < LR) { if (r > LR - 1.1) return (j === y1 + LH || Math.floor((ang + Math.PI) * 1.3) % 3 === 0) ? SB : (T.GLASS || 0); if (r < 1.2 && j <= y1 + 3) return T.LAMP || T.GLOWROCK; return 0; } return r < LR + 1 ? 0 : undefined; }
    if (j === y1 && r < LR + 0.6) return SB;
    // pointed roof
    const rj = j - (y1 + LH); if (rj > 0 && rj <= 5) { const rr = LR + 0.4 - rj * 0.75; if (r < rr) return rj === 5 ? (T.GLOWROCK || SB) : (T.DSBRICK || CB); return 0; }
    return undefined; }
  const h = (x, y, z) => { let k = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791); k = Math.imul(k ^ (k >>> 13), 1274126177); return ((k ^ (k >>> 16)) >>> 0) / 4294967296; };
  U.blk = blk;
  function hook() { const e = window.__c320; if (!e || !e.flat || !e.fearth || e.fearth.lh) return; const f0 = e.fearth;
    if (B === null) { let bd = null; for (const [a, c] of [[0, -1], [0, 1], [1, 0], [-1, 0], [1, -1], [-1, -1]]) { let k = 0; while (k < 160) { const q = f0(X + a * k, SEA, Z + c * k); if (!q || q === T.WATER) break; k++; } if (k < 160 && (!bd || k < bd[0])) bd = [k, a, c]; } if (bd) { U.dir = [bd[1], bd[2]]; X = U.X = X + bd[1] * (bd[0] + 12); Z = U.Z = Z + bd[2] * (bd[0] + 12); } B = SEA + 2; U.base = B; TOP = TIERS.reduce((s, t) => s + t[1] + 1, 0) + LH + 6; U.top = B + TOP; }
    const f = function (x, y, z) { if (x > X - 11 && x < X + 11 && z > Z - 11 && z < Z + 11) { const q = blk(x, y, z); if (q !== undefined) return q; } return f0.apply(this, arguments); };
    for (const k in f0) f[k] = f0[k]; f.lh = 1; if (f0.top) { const t0 = f0.top; f.top = function (x, z) { const v = t0.apply(this, arguments); return (x > X - 11 && x < X + 11 && z > Z - 11 && z < Z + 11) ? Math.max(v, B + TOP - SEA + 2) : v; }; } e.fearth = f; U.ok = 1; try { const c = window.__c324; if (c && c.cache) c.cache.clear(); e.dirty = 1; if (c && c.dirty) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) c.dirty.add(Math.floor((X + a * 12) / 16) + ',' + Math.floor((Z + b * 12) / 16)); } catch (_) {} }
  // a soft glow round the lamp that shows from far away at night
  let glow = null; try { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,236,170,1)'); gr.addColorStop(0.3, 'rgba(255,210,120,0.45)'); gr.addColorStop(1, 'rgba(255,200,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    glow = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false})); glow.scale.set(14, 14, 1); glow.visible = false; scene.add(glow); } catch (e) { ERR('glow', e); }
  setInterval(() => { try { if (typeof started === 'undefined' || !started) return; hook();
      if (glow) { const on = U.ok && !(typeof DIM !== 'undefined' && DIM.cur) && P.y > SEA - 20 && Math.hypot(P.x - X, P.z - Z) < 900 && window.__c320 && __c320.flat; glow.visible = !!on;
        if (on) { const night = 1 - (typeof daylight === 'number' ? daylight : 1); glow.material.opacity = 0.25 + 0.75 * Math.max(0, Math.min(1, night * 1.5)); glow.position.set(X + 0.5, B + TIERS.reduce((s, t) => s + t[1] + 1, 0) + 2.5, Z + 0.5); } } } catch (e) { ERR('tick', e); } }, 400);
  U.go = () => { P.x = X + 0.5; P.z = Z + 10.5; P.y = (B || SEA + 40) + 1; };
})();
