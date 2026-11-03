/* ===================== GLX-C107 (v0.9.88): new Glencraft ore textures - iron, silver, gold, cobalt and lazurite each look like themselves (drawn in code over the game's own stone) ===================== */
(function c107() {
  const U = window.__c107 = {made: {}, n: 0};
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x9e3779b9 >>> 0) / 4294967296); }
  // draw fn(g) at every wrapped copy near the edges so the tile repeats seamlessly
  function wrapDraw(g, S, x, y, r, fn) { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { if (x + ox + r < 0 || x + ox - r > S || y + oy + r < 0 || y + oy - r > S) continue; g.save(); g.translate(x + ox, y + oy); fn(g); g.restore(); } }
  function blobPath(g, R, pts, jag, rnd, sx, sy) { const a0 = rnd() * 6.28, P = []; for (let i = 0; i < pts; i++) { const a = a0 + i / pts * 6.283, rr = R * (1 - jag + rnd() * jag * 2); P.push([Math.cos(a) * rr * sx, Math.sin(a) * rr * sy]); }
    g.beginPath(); for (let i = 0; i < pts; i++) { const p = P[i], q = P[(i + 1) % pts], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (i === 0) g.moveTo(mx, my); else g.quadraticCurveTo(p[0], p[1], mx, my); } const p = P[0], q = P[1]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); g.closePath(); }
  function polyPath(g, P) { g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); }
  // a socket: darker stone rim and soft shadow around each nugget so it sits in the rock
  function socket(g, u, path) { g.save(); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 10 * u; g.shadowOffsetX = 3 * u; g.shadowOffsetY = 5 * u; path(); g.fillStyle = 'rgba(30,26,24,0.9)'; g.fill(); g.restore(); }

  const STYLE = {
    // chunky peach-tan nuggets with rusty edges
    iron: {seed: 11, clusters: 6, per: [3, 5], R: [52, 84], spread: 1.5, draw(g, u, R, rnd) {
      const path = () => blobPath(g, R, 7, 0.28, rnd, 1, 0.85); const r2 = rnd;
      socket(g, u, () => { g.save(); g.scale(1.1, 1.1); path(); g.restore(); });
      path(); const gr = g.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R * 1.1); gr.addColorStop(0, '#f6d0ae'); gr.addColorStop(0.45, '#dc9f78'); gr.addColorStop(1, '#a8583a'); g.fillStyle = gr; g.fill();
      g.lineWidth = 5 * u; g.strokeStyle = '#6a2c16'; g.stroke();
      for (let k = 0; k < 4; k++) { g.beginPath(); g.arc((r2() - .5) * R, (r2() - .3) * R * 0.9, R * (0.08 + r2() * 0.1), 0, 6.3); g.fillStyle = 'rgba(140,60,30,0.55)'; g.fill(); }   // rust pits
      g.beginPath(); g.ellipse(-R * 0.32, -R * 0.36, R * 0.28, R * 0.13, -0.6, 0, 6.3); g.fillStyle = 'rgba(255,238,220,0.75)'; g.fill(); }},
    // v1.0.0: native silver - branching wiry veins and bright flakes threaded through the stone (no more raindrops)
    silver: {seed: 23, clusters: 6, per: [2, 3], R: [78, 110], spread: 1.3, draw(g, u, R, rnd) {
      const segs = []; const grow = (x, y, a, L, w, d) => { const n = 4 + (rnd() * 3 | 0), pts = [[x, y]]; for (let i = 0; i < n; i++) { a += (rnd() - .5) * 0.9; x += Math.cos(a) * L / n; y += Math.sin(a) * L / n; pts.push([x, y]); }
        segs.push([pts, w]); if (d < 2) for (let k = 0; k < 2; k++) { const p = pts[1 + (rnd() * (pts.length - 1) | 0)]; grow(p[0], p[1], a + (rnd() < .5 ? 1 : -1) * (0.6 + rnd() * 0.7), L * 0.55, w * 0.62, d + 1); } };
      grow(-R * 0.9, (rnd() - .5) * R * 0.6, (rnd() - .5) * 0.8, R * 1.9, R * 0.27, 0);
      const line = (pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
      g.lineCap = g.lineJoin = 'round';
      g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 8 * u; g.shadowOffsetY = 3 * u; for (const [pts, w] of segs) { line(pts); g.strokeStyle = '#14171f'; g.lineWidth = w + 11 * u; g.stroke(); } g.restore();
      for (const [pts, w] of segs) { line(pts); g.strokeStyle = '#b4c2d6'; g.lineWidth = w; g.stroke(); }
      for (const [pts, w] of segs) { g.save(); g.translate(-w * 0.18, -w * 0.18); line(pts); g.strokeStyle = '#eef3fa'; g.lineWidth = w * 0.42; g.stroke(); g.restore(); }
      for (let k = 0; k < 5; k++) { const x = (rnd() - .5) * R * 2, y = (rnd() - .5) * R * 1.4, r = R * (0.12 + rnd() * 0.12), P = []; for (let i = 0; i < 5; i++) { const an = i / 5 * 6.283 + rnd(); P.push([x + Math.cos(an) * r, y + Math.sin(an) * r * 0.7]); }
        polyPath(g, P); g.fillStyle = '#c9d4e4'; g.fill(); g.lineWidth = 2.5 * u; g.strokeStyle = '#2a3040'; g.stroke(); g.beginPath(); g.arc(x - r * 0.3, y - r * 0.25, r * 0.3, 0, 6.3); g.fillStyle = '#fff'; g.fill(); }
      const p0 = segs[0][0][2] || segs[0][0][0]; g.fillStyle = '#ffffff'; const s2 = R * 0.2; g.beginPath(); g.moveTo(p0[0], p0[1] - s2); g.lineTo(p0[0] + s2 * 0.15, p0[1] - s2 * 0.15); g.lineTo(p0[0] + s2, p0[1]); g.lineTo(p0[0] + s2 * 0.15, p0[1] + s2 * 0.15); g.lineTo(p0[0], p0[1] + s2); g.lineTo(p0[0] - s2 * 0.15, p0[1] + s2 * 0.15); g.lineTo(p0[0] - s2, p0[1]); g.lineTo(p0[0] - s2 * 0.15, p0[1] - s2 * 0.15); g.closePath(); g.fill(); }},
    // v1.0.0: copper - rounded native-copper nuggets with green verdigris, sunk into the stone
    copper: {seed: 91, clusters: 6, per: [3, 5], R: [40, 66], spread: 1.4, draw(g, u, R, rnd) {
      const path = () => blobPath(g, R, 8, 0.3, rnd, 1, 0.8); const r2 = rnd;
      socket(g, u, () => { g.save(); g.scale(1.12, 1.12); path(); g.restore(); });
      path(); const gr = g.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.08, 0, 0, R * 1.1); gr.addColorStop(0, '#ffc79a'); gr.addColorStop(0.4, '#e07a3c'); gr.addColorStop(0.8, '#a8461c'); gr.addColorStop(1, '#6a2a0e'); g.fillStyle = gr; g.fill();
      g.lineWidth = 4.5 * u; g.strokeStyle = '#3a1508'; g.stroke();
      for (let k = 0; k < 4; k++) { const an = r2() * 6.28, d = R * (0.45 + r2() * 0.35); g.beginPath(); g.ellipse(Math.cos(an) * d, Math.sin(an) * d * 0.8, R * (0.12 + r2() * 0.14), R * (0.07 + r2() * 0.08), an, 0, 6.3); g.fillStyle = 'rgba(70,175,145,0.7)'; g.fill(); }
      g.beginPath(); g.ellipse(-R * 0.3, -R * 0.34, R * 0.26, R * 0.11, -0.6, 0, 6.3); g.fillStyle = 'rgba(255,232,205,0.8)'; g.fill(); }},
    // v1.0.0: diamond - small faceted cyan-white crystals bedded in the stone
    diamond: {seed: 103, clusters: 6, per: [2, 4], R: [30, 50], spread: 1.3, draw(g, u, R, rnd) {
      const n = 6, a0 = rnd() * 6.28, P = []; for (let i = 0; i < n; i++) { const a = a0 + i / n * 6.283, rr = R * (0.85 + rnd() * 0.3); P.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.9]); }
      socket(g, u, () => polyPath(g, P.map(p => [p[0] * 1.18, p[1] * 1.18])));
      const cols = ['#f4ffff', '#b8f6ff', '#6fe0f4', '#2fb2d2', '#58d2ea', '#a4f0ff']; const C = [(rnd() - .5) * R * 0.3, (rnd() - .5) * R * 0.3];
      for (let i = 0; i < n; i++) { polyPath(g, [C, P[i], P[(i + 1) % n]]); g.fillStyle = cols[i]; g.fill(); }
      polyPath(g, P.map(p => [C[0] + (p[0] - C[0]) * 0.45, C[1] + (p[1] - C[1]) * 0.45])); g.fillStyle = 'rgba(235,255,255,0.75)'; g.fill();
      polyPath(g, P); g.lineWidth = 4 * u; g.lineJoin = 'round'; g.strokeStyle = '#0a3a4a'; g.stroke();
      const sx = P[0][0] * 0.4, sy = P[0][1] * 0.4, s2 = R * 0.45; g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(sx, sy - s2); g.lineTo(sx + s2 * 0.13, sy - s2 * 0.13); g.lineTo(sx + s2, sy); g.lineTo(sx + s2 * 0.13, sy + s2 * 0.13); g.lineTo(sx, sy + s2); g.lineTo(sx - s2 * 0.13, sy + s2 * 0.13); g.lineTo(sx - s2, sy); g.lineTo(sx - s2 * 0.13, sy - s2 * 0.13); g.closePath(); g.fill(); }},
    // rich saturated gold with orange shading and sparkles
    gold: {seed: 37, clusters: 6, per: [4, 6], R: [38, 64], spread: 1.5, draw(g, u, R, rnd) {
      const P = []; const n = 5 + (rnd() * 3 | 0), a0 = rnd() * 6.28; for (let i = 0; i < n; i++) { const a = a0 + i / n * 6.283, rr = R * (0.7 + rnd() * 0.45); P.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.85]); }
      socket(g, u, () => polyPath(g, P.map(p => [p[0] * 1.12, p[1] * 1.12])));
      polyPath(g, P); const gr = g.createLinearGradient(-R, -R, R, R); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(0.3, '#ffd21e'); gr.addColorStop(0.7, '#f39a12'); gr.addColorStop(1, '#a8520a'); g.fillStyle = gr; g.fill();
      g.lineWidth = 4.5 * u; g.strokeStyle = '#5e2e04'; g.lineJoin = 'round'; g.stroke();
      // a facet line and a star sparkle
      g.beginPath(); g.moveTo(P[0][0] * 0.2, P[0][1] * 0.2); g.lineTo(P[2][0] * 0.8, P[2][1] * 0.8); g.strokeStyle = 'rgba(190,90,10,0.7)'; g.lineWidth = 3 * u; g.stroke();
      const sx = -R * 0.3, sy = -R * 0.3, s = R * 0.32; g.fillStyle = '#fffbe0'; g.beginPath(); g.moveTo(sx, sy - s); g.lineTo(sx + s * 0.18, sy - s * 0.18); g.lineTo(sx + s, sy); g.lineTo(sx + s * 0.18, sy + s * 0.18); g.lineTo(sx, sy + s); g.lineTo(sx - s * 0.18, sy + s * 0.18); g.lineTo(sx - s, sy); g.lineTo(sx - s * 0.18, sy - s * 0.18); g.closePath(); g.fill(); }},
    // deep royal-blue crystal shards with cyan facet highlights
    cobalt: {seed: 51, clusters: 6, per: [3, 4], R: [80, 120], spread: 1.1, draw(g, u, R, rnd) {
      const ang = rnd() * 6.28, w = R * (0.26 + rnd() * 0.12), L = R * (0.9 + rnd() * 0.5);
      g.rotate(ang);
      const P = [[0, -L], [w, -L * 0.55], [w * 0.9, L * 0.35], [0, L * 0.5], [-w * 0.9, L * 0.35], [-w, -L * 0.55]];
      socket(g, u, () => polyPath(g, P.map(p => [p[0] * 1.15, p[1] * 1.08])));
      // two facets: lit left, dark right, plus a top cap
      polyPath(g, [[0, -L], [0, L * 0.5], [-w * 0.9, L * 0.35], [-w, -L * 0.55]]); let gr = g.createLinearGradient(-w, -L, 0, L); gr.addColorStop(0, '#5f8cff'); gr.addColorStop(1, '#1f3fbe'); g.fillStyle = gr; g.fill();
      polyPath(g, [[0, -L], [w, -L * 0.55], [w * 0.9, L * 0.35], [0, L * 0.5]]); gr = g.createLinearGradient(0, -L, w, L); gr.addColorStop(0, '#2446c8'); gr.addColorStop(1, '#0c1c6e'); g.fillStyle = gr; g.fill();
      polyPath(g, [[0, -L], [w * 0.45, -L * 0.62], [0, -L * 0.42], [-w * 0.45, -L * 0.62]]); g.fillStyle = 'rgba(170,240,255,0.85)'; g.fill();
      polyPath(g, P); g.lineWidth = 4.5 * u; g.lineJoin = 'round'; g.strokeStyle = '#08103e'; g.stroke();
      g.beginPath(); g.moveTo(-w * 0.55, -L * 0.45); g.lineTo(-w * 0.5, L * 0.2); g.strokeStyle = 'rgba(140,235,255,0.9)'; g.lineWidth = 3.5 * u; g.stroke();
      g.beginPath(); g.moveTo(0, -L * 0.42); g.lineTo(0, L * 0.5); g.strokeStyle = 'rgba(120,200,255,0.55)'; g.lineWidth = 2 * u; g.stroke(); }},
    // v1.0.45 lazurite (lapis lazuli): like the redstone redo - clusters of deep-blue specks joined by thin crooked veins, sunk into the plain stone, dark rims, a soft blue highlight and the odd gold pyrite fleck
    laz: {seed: 67, clusters: 6, per: [6, 9], R: [14, 27], spread: 1.25, draw(g, u, R, rnd) {
      g.lineCap = g.lineJoin = 'round';
      if (rnd() < 0.6) { const pts = [[0, 0]]; let x = 0, y = 0, an = rnd() * 6.28; for (let i = 0; i < 3; i++) { an += (rnd() - .5) * 1.2; x += Math.cos(an) * R * 1.1; y += Math.sin(an) * R * 1.1; pts.push([x, y]); }
        const line = () => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
        line(); g.strokeStyle = 'rgba(6,10,40,0.85)'; g.lineWidth = R * 0.34 + 5 * u; g.stroke(); line(); g.strokeStyle = '#2140c8'; g.lineWidth = R * 0.24; g.stroke();
        line(); g.strokeStyle = 'rgba(120,150,255,0.5)'; g.lineWidth = R * 0.1; g.stroke(); }
      const path = () => blobPath(g, R, 6, 0.35, rnd, 1, 0.85);
      socket(g, u, () => { g.save(); g.scale(1.15, 1.15); path(); g.restore(); });
      path(); const gr = g.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.05, 0, 0, R * 1.1); gr.addColorStop(0, '#6f8cff'); gr.addColorStop(0.45, '#2647d6'); gr.addColorStop(1, '#0f1f7a'); g.fillStyle = gr; g.fill();
      g.lineWidth = 3.5 * u; g.strokeStyle = '#060c38'; g.stroke();
      g.beginPath(); g.ellipse(-R * 0.3, -R * 0.32, R * 0.26, R * 0.12, -0.6, 0, 6.3); g.fillStyle = 'rgba(200,215,255,0.7)'; g.fill();
      if (rnd() < 0.45) { g.beginPath(); g.arc(R * 0.3, R * 0.2, R * 0.12, 0, 6.3); g.fillStyle = '#e8c45a'; g.fill(); } }},
    // v1.0.41 coal: bigger, darker coal seams - clusters of black lumps sunk into the stone, each with a faint glassy edge and sheen so they read against the rock
    coal: {seed: 79, clusters: 6, per: [3, 4], R: [70, 110], spread: 1.05, draw(g, u, R, rnd) {
      const P = []; const n = 6 + (rnd() * 3 | 0), a0 = rnd() * 6.28; for (let i = 0; i < n; i++) { const a = a0 + i / n * 6.283, rr = R * (0.62 + rnd() * 0.5); P.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.85]); }
      socket(g, u, () => polyPath(g, P.map(p => [p[0] * 1.12, p[1] * 1.12])));
      polyPath(g, P); const gr = g.createLinearGradient(-R, -R, R, R); gr.addColorStop(0, '#2a2a2f'); gr.addColorStop(0.4, '#121215'); gr.addColorStop(1, '#030304'); g.fillStyle = gr; g.fill();
      g.lineWidth = 7 * u; g.lineJoin = 'round'; g.strokeStyle = '#000'; g.stroke();
      // lit upper-left edge (a thin grey rim like a fractured coal face)
      g.save(); polyPath(g, P); g.clip(); g.translate(5 * u, 6 * u); polyPath(g, P); g.lineWidth = 9 * u; g.strokeStyle = 'rgba(120,124,136,0.55)'; g.stroke(); g.restore();
      g.beginPath(); g.moveTo(P[0][0] * 0.15, P[0][1] * 0.15); g.lineTo(P[2][0] * 0.75, P[2][1] * 0.75); g.strokeStyle = 'rgba(70,72,82,0.7)'; g.lineWidth = 3 * u; g.stroke();
      g.beginPath(); g.ellipse(-R * 0.28, -R * 0.3, R * 0.24, R * 0.08, -0.6, 0, 6.3); g.fillStyle = 'rgba(205,210,225,0.42)'; g.fill();
      g.beginPath(); g.arc(R * 0.22, R * 0.12, R * 0.05, 0, 6.3); g.fillStyle = 'rgba(225,230,245,0.45)'; g.fill(); }},
    // v1.0.41 redstone: clusters of small red specks joined by thin crooked veins, sunk into the plain stone, each speck with a dark rim and a soft pink highlight
    red: {seed: 131, clusters: 6, per: [6, 9], R: [13, 26], spread: 1.25, draw(g, u, R, rnd) {
      g.lineCap = g.lineJoin = 'round';
      if (rnd() < 0.65) { const pts = [[0, 0]]; let x = 0, y = 0, an = rnd() * 6.28; for (let i = 0; i < 3; i++) { an += (rnd() - .5) * 1.2; x += Math.cos(an) * R * 1.1; y += Math.sin(an) * R * 1.1; pts.push([x, y]); }
        const line = () => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
        line(); g.strokeStyle = 'rgba(40,6,6,0.85)'; g.lineWidth = R * 0.34 + 5 * u; g.stroke(); line(); g.strokeStyle = '#c4161a'; g.lineWidth = R * 0.24; g.stroke();
        line(); g.strokeStyle = 'rgba(255,120,100,0.55)'; g.lineWidth = R * 0.1; g.stroke(); }
      const path = () => blobPath(g, R, 6, 0.35, rnd, 1, 0.85);
      socket(g, u, () => { g.save(); g.scale(1.15, 1.15); path(); g.restore(); });
      path(); const gr = g.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.05, 0, 0, R * 1.1); gr.addColorStop(0, '#ff6a52'); gr.addColorStop(0.45, '#e01e1e'); gr.addColorStop(1, '#8a0a0c'); g.fillStyle = gr; g.fill();
      g.lineWidth = 3.5 * u; g.strokeStyle = '#3a0405'; g.stroke();
      g.beginPath(); g.ellipse(-R * 0.3, -R * 0.32, R * 0.26, R * 0.12, -0.6, 0, 6.3); g.fillStyle = 'rgba(255,205,190,0.7)'; g.fill(); }},
  };
  const KEYS = {redstone_ore: 'red', coal_ore: 'coal', iron_ore: 'iron', silver_ore: 'silver', gold_ore: 'gold', cobalt_ore: 'cobalt', lazurite_ore: 'laz', copper_ore: 'copper', diamond_ore: 'diamond'};
  function paint(key, base) {
    const st = STYLE[KEYS[key]], S = base.width, u = S / 1024, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'); g.drawImage(base, 0, 0, S, S);
    const rnd = rng(st.seed * 7919 + 13);
    for (let k = 0; k < st.clusters; k++) {
      // clusters spread over the tile on a jittered grid so no face is bare
      const gx = (k % 3 + 0.5 + (rnd() - .5) * 0.6) / 3 * S, gy = ((k / 3 | 0) % 3 + 0.5 + (rnd() - .5) * 0.6) / Math.ceil(st.clusters / 3) * S, n = st.per[0] + (rnd() * (st.per[1] - st.per[0] + 1) | 0);
      for (let j = 0; j < n; j++) { const R = (st.R[0] + rnd() * (st.R[1] - st.R[0])) * u, sp = (st.spread || 1) * 70 * u, x = gx + (rnd() - .5) * sp * 2, y = gy + (rnd() - .5) * sp * 2, seed = rnd() * 1e9 | 0;
        wrapDraw(g, S, x, y, R * 2.2, gg => st.draw(gg, u, R, rng(seed))); }
    }
    return c;
  }
  function css(key, c) { try { const s = document.createElement('canvas'); s.width = s.height = 64; s.getContext('2d').drawImage(c, 0, 0, 64, 64);
    let el = document.getElementById('c107css'); if (!el) { el = document.createElement('style'); el.id = 'c107css'; document.head.appendChild(el); }
    el.textContent = el.textContent.split('\n').filter(l => l && !l.startsWith('.ic-' + key + '{')).concat('.ic-' + key + '{background-image:url(' + s.toDataURL() + ') !important}').join('\n'); } catch (_) {} }
  function pass() {
    const base = texImg.stone; if (!base || !base.width) return false;
    for (const key in KEYS) {
      if (U.made[key] && (U.mb = U.mb || {})[key] !== base) delete U.made[key];   // v1.0.37: repaint if the stone tile changed under us (lazurite was left on a flat early stone)
      if (!U.made[key]) { try { (U.mb = U.mb || {})[key] = base; U.made[key] = paint(key, base); css(key, U.made[key]); U.n++; } catch (e) { console.warn('c107', key, e); continue; } }
      const c = U.made[key], ts = new Set([texCache[key] || tex(key)]);
      try { if (matCache[key] && matCache[key].map) ts.add(matCache[key].map); for (const id in FACES) if (FACES[id] === key && BLOCK_MATS[id] && BLOCK_MATS[id].map) ts.add(BLOCK_MATS[id].map); } catch (_) {}
      if (texImg[key] !== c) { texImg[key] = c; css(key, c); }
      for (const t of ts) if (t.image !== c) { t.image = c; t.needsUpdate = true; }
    }
    return true;
  }
  U.pass = pass; U.paint = paint;
  // keep our versions in place even if an older recolour pass runs late
  let tries = 0; const iv = setInterval(() => { try { pass(); } catch (e) { console.warn('c107', e); } if (++tries > 150) clearInterval(iv); }, 500);
})();
