/* ===================== GLX-C239 (v1.0.54): the pyramid hall gets painted alien murals - grey heads with big almond eyes, glyph rows,
   circuit lines, saucers and triangles, in five palettes. All drawn in-game (no images). Works in existing worlds: the hall is found
   from the gold capstone. Murals are thin panels on the hall walls, they never change blocks. ===================== */
(function c239() {
  const U = window.__c239 = {err: null, pyr: null, murals: 0};
  try {
    const PAL = [ // bg, fg (head), eye, glyph, circuit, accent
      ['#07090a', '#7fe8b4', '#0a0a0a', '#a46bd8', '#3fae7c', '#c99cff'],
      ['#f4f1ee', '#f3a6c8', '#121212', '#7b4bbf', '#43b56b', '#e05a99'],
      ['#0d1a5c', '#5a7de0', '#ffd83a', '#ffb000', '#ff4fd8', '#39e6ff'],
      ['#f6dde0', '#efc0c8', '#18b3a8', '#b3131c', '#151515', '#7a2030'],
      ['#efe6cf', '#9a9a9c', '#151515', '#c89418', '#6d6d70', '#e0b444']];
    let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    function head(g, p, cx, cy, s) { // grey head: wide cranium, narrow chin, almond eyes, tiny lips
      g.fillStyle = p[1]; for (let y = -s; y <= s * 1.3; y++) { const t = y < 0 ? Math.sqrt(1 - (y / s) ** 2) : 1 - (y / (s * 1.3)) ** 1.6 * 0.82; const w = Math.round(s * 0.95 * t); g.fillRect(cx - w, cy + y, w * 2 + 1, 1); }
      g.fillStyle = p[2]; for (const sd of [-1, 1]) for (let k = 0; k < Math.max(2, s * 0.42); k++) { const y = cy + Math.round(s * 0.05) + Math.round(k * 0.5 * sd * 0) + Math.floor(k / 2); const w = Math.max(1, Math.round(s * 0.42 - k * 0.6)); g.fillRect(sd < 0 ? cx - Math.round(s * 0.18) - w : cx + Math.round(s * 0.18) + 1, y - (k % 2 ? 0 : 0), w, 1); }
      g.fillStyle = p[5]; g.fillRect(cx - 1, cy + Math.round(s * 0.95), 3, 1);
    }
    function saucer(g, p, x, y, s) { g.fillStyle = p[4]; g.fillRect(x - s, y, s * 2 + 1, 2); g.fillRect(x - s + 2, y + 2, s * 2 - 3, 1); g.fillStyle = p[1]; g.fillRect(x - Math.round(s / 2), y - 2, s + 1, 2); g.fillStyle = p[5]; for (let i = -s + 2; i < s; i += 3) g.fillRect(x + i, y + 1, 1, 1); }
    function tri(g, p, x, y, s) { g.fillStyle = p[3]; for (let k = 0; k < s; k++) { g.fillRect(x - k, y + k, 1, 1); g.fillRect(x + k, y + k, 1, 1); } g.fillRect(x - s + 1, y + s - 1, s * 2 - 1, 1); g.fillStyle = p[2]; g.fillRect(x, y + Math.round(s * 0.55), 1, 1); }
    function glyphRow(g, p, x0, y, w) { g.fillStyle = p[3]; for (let x = x0; x < x0 + w - 3; x += 5) { const t = ri(0, 5);
      if (t === 0) { g.fillRect(x, y, 3, 1); g.fillRect(x + 1, y, 1, 4); } else if (t === 1) { g.fillRect(x, y, 1, 4); g.fillRect(x + 2, y, 1, 4); g.fillRect(x, y + 3, 3, 1); }
      else if (t === 2) { g.fillRect(x + 1, y, 1, 1); g.fillRect(x, y + 1, 3, 1); g.fillRect(x + 1, y + 2, 1, 2); } else if (t === 3) { g.fillRect(x, y, 3, 1); g.fillRect(x, y + 3, 3, 1); g.fillRect(x + 1, y + 1, 1, 2); }
      else if (t === 4) { g.fillRect(x, y + 1, 1, 1); g.fillRect(x + 2, y + 1, 1, 1); g.fillRect(x + 1, y + 3, 1, 1); } else { g.fillRect(x, y, 1, 1); g.fillRect(x + 1, y + 1, 1, 1); g.fillRect(x + 2, y + 2, 1, 2); } } }
    function circuits(g, p, W, H) { g.fillStyle = p[4]; for (let n = 0; n < 9; n++) { let x = ri(0, W - 1), y = ri(0, H - 1); const L = ri(6, 18);
      for (let k = 0; k < L; k++) { g.fillRect(x, y, 1, 1); if (rnd() < 0.2) { if (rnd() < 0.5) y += rnd() < 0.5 ? 1 : -1; } else x += 1; } g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = p[0]; g.fillRect(x, y, 1, 1); g.fillStyle = p[4]; } }
    function mural(pi, W, H, sd) { seed = 977 + sd * 131; const p = PAL[pi], c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
      g.fillStyle = p[0]; g.fillRect(0, 0, W, H); circuits(g, p, W, H);
      g.fillStyle = p[3]; g.fillRect(0, 0, W, 1); g.fillRect(0, H - 1, W, 1); g.fillRect(0, 0, 1, H); g.fillRect(W - 1, 0, 1, H);
      glyphRow(g, p, 3, 3, W - 4); glyphRow(g, p, 3, H - 8, W - 4);
      const n = W > 40 ? 3 : 2, s = Math.round(H * 0.17); for (let i = 0; i < n; i++) head(g, p, Math.round(W * (i + 0.5) / n), Math.round(H * 0.5), i === 1 && n === 3 ? s + 2 : s);
      saucer(g, p, ri(8, W - 8), 10, 5); tri(g, p, ri(5, W - 6), H - 16, 4); if (W > 40) tri(g, p, ri(5, W - 6), 11, 3);
      const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t; }
    U.mural = mural;
    // ---- find the pyramid: the gold capstone near the desert island, then which way the hall faces ----
    const air = (x, y, z) => !solid(x, y, z), wall = (x, y, z) => solid(x, y, z);
    function orient(cx, cy, cz) { const hy = cy - 23;
      for (const [fx, fz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const rx = -fz, rz = fx, L = (u, v) => [cx + u * fx + v * rx, cz + u * fz + v * rz]; let ok = 0;
        for (const [u, v] of [[-4, 0], [0, 4], [0, -4], [3, 0], [-3, 3], [2, -3]]) { const [x, z] = L(u, v); if (air(x, hy + 1, z)) ok++; }
        for (const v of [-6, 6]) for (const u of [-2, 1]) { const [x, z] = L(u, v); if (wall(x, hy + 2, z)) ok++; }
        for (const v of [-4, 4]) { const [x, z] = L(-5, v); if (wall(x, hy + 2, z)) ok++; }
        { const [x, z] = L(6, 0); if (air(x, hy + 1, z)) ok++; }
        if (ok >= 11) return {cx, cy, cz, hy, fx, fz, rx, rz, L}; } return null; }
    function find() { const R = 160, x0 = MT_C[0], z0 = MT_C[1], ys = SEA + 18, ye = Math.min(H - 2, SEA + 45);
      for (let x = Math.max(1, x0 - R); x < Math.min(W - 1, x0 + R); x++) for (let z = Math.max(1, z0 - R); z < Math.min(D - 1, z0 + R); z++)
        for (let y = ys; y < ye; y++) if (world[idx(x, y, z)] === T.GOLDBLOCK && world[idx(x, y - 1, z)] === T.SANDSTONE && world[idx(x, y + 1, z)] === 0) { const o = orient(x, y, z); if (o) return o; }
      return null; }
    const grp = new THREE.Group(); grp.userData.__dcR = 1e9; scene.add(grp);
    function build(o) { while (grp.children.length) { const m = grp.children.pop(); m.geometry.dispose(); m.material.map && m.material.map.dispose(); m.material.dispose(); }
      const put = (u, v, du, dv, w, h, y, pi, sd) => { // panel centre (u,v) in hall cells, facing (du,dv)
        const [x, z] = o.L(u, v), nx = du * o.fx + dv * o.rx, nz = du * o.fz + dv * o.rz;
        const pw = Math.round(w * 8), ph = Math.round(h * 8), m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: mural(pi, pw, ph, sd), color: 0xdddddd}));
        m.position.set(x + 0.5 + nx * 0.52, y, z + 0.5 + nz * 0.52); m.rotation.y = Math.atan2(nx, nz); grp.add(m); };
      const y = o.hy + 3.1; // hall air is hy..hy+5
      put(-0.5, 6, 0, -1, 6, 4, y, 0, 1); put(-0.5, -6, 0, 1, 6, 4, y, 1, 2);   // v1.0.58: only the green and the purple murals stay
      try { const tx = new THREE.TextureLoader().load('assets/ui/alien_art.png'); let x, z, nx, nz, ay;   // v1.0.75: the players alien painting hangs INSIDE the chest room under the pyramid staircase
        { const cnt = {}; let fy = null, best = 0; for (let X = o.cx - 70; X < o.cx + 70; X++) for (let Z = o.cz - 70; Z < o.cz + 70; Z++) for (let Y = o.hy - 30; Y < o.hy - 4; Y++) if (world[idx(X, Y, Z)] === 150 && !world[idx(X, Y + 1, Z)]) { cnt[Y] = (cnt[Y] || 0) + 1; if (cnt[Y] > best) { best = cnt[Y]; fy = Y; } }
          if (fy !== null && best > 20) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let X = o.cx - 70; X < o.cx + 70; X++) for (let Z = o.cz - 70; Z < o.cz + 70; Z++) if (world[idx(X, fy, Z)] === 150 && !world[idx(X, fy + 1, Z)]) { x0 = Math.min(x0, X); x1 = Math.max(x1, X); z0 = Math.min(z0, Z); z1 = Math.max(z1, Z); }
            const mx = (x0 + x1) / 2 + 0.5, mz = (z0 + z1) / 2 + 0.5, c = [[x0, mz, 1, 0], [x1 + 1, mz, -1, 0], [mx, z0, 0, 1], [mx, z1 + 1, 0, -1]];
            c.sort((a, b) => Math.hypot(b[0] - o.cx, b[1] - o.cz) - Math.hypot(a[0] - o.cx, a[1] - o.cz)); const w = c[0]; x = w[0] + w[2] * 0.03; z = w[1] + w[3] * 0.03; nx = w[2]; nz = w[3]; ay = fy + 3.1; U.room = [x0, x1, z0, z1, fy]; } }
        if (x === undefined) { const q = o.L(-5, 0); x = q[0] + 0.5; z = q[1] + 0.5; nx = o.fx; nz = o.fz; ay = o.hy + 2.9; }
        const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.56), new THREE.MeshBasicMaterial({map: tx, color: 0xeeeeee})); m.position.set(x, ay, z); m.rotation.y = Math.atan2(nx, nz); m.userData.alienArt = 1; m.visible = false; U.art = m; grp.add(m); } catch (_) {}
      U.murals = grp.children.length; }
    let lastWorld = null, t = 0;
    const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { if (U.art) U.art.visible = !!((window.__c246b && __c246b.done) || (current && (localStorage.getItem('glen_met_' + current.id) || (current.c246 && current.c246.met)))); } catch (_) {}
      try { if (!started || DIM.cur) { grp.visible = false; return r; } grp.visible = true; if ((t -= dt || 0.016) > 0) return r; t = 4;
        if (world !== lastWorld || !U.pyr) { if (world !== lastWorld) { U.pyr = null; while (grp.children.length) grp.remove(grp.children[0]); } lastWorld = world; U.pyr = find(); if (U.pyr) build(U.pyr); else t = 15; }
        else { const o = U.pyr; if (!o.L) return; const [x, z] = o.L(-0.5, 0); grp.visible = Math.hypot(P.x - x, P.z - z) < 90; }
      } catch (e) { if (!U.err) { U.err = String(e); console.warn('c239', e); } } return r; };
  } catch (e) { U.err = String(e); console.warn('c239 init', e); }
})();
