/* v1.2.32 face texture: the in game face type of v1.2.31 kept (big blue eyes looking slightly in, block brows, nose, wide mouth, at the
   same places and sizes on the 512 map), repainted at full resolution with soft anti aliased edges, rounded shapes, iris detail, lid shading,
   catch lights and gentle skin shading. Original work; seeded, so every build paints the same pixels. */
function paintFaceV1232(g, w) {
  let sd = 1232; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647, S = w / 512;
  const blob = (x, y, rx, ry, c) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, c); gr.addColorStop(1, c.replace(/[\d.]+\)$/, '0)')); g.save(); g.translate(x * S, y * S); g.scale(rx * S, ry * S); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore(); };
  const rr = (x, y, ww, hh, r) => { g.beginPath(); g.roundRect(x * S, y * S, ww * S, hh * S, r * S); };
  // skin: the live warm gradient, fine seeded grain, soft cheek warmth and form shading
  const gr = g.createRadialGradient(256 * S, 300 * S, 40 * S, 256 * S, 280 * S, 360 * S); gr.addColorStop(0, '#ecbe9a'); gr.addColorStop(1, '#d2a07c'); g.fillStyle = gr; g.fillRect(0, 0, w, w);
  for (let i = 0; i < 12000; i++) { const v = R(); g.fillStyle = `rgba(${170 + v * 70 | 0},${110 + v * 50 | 0},${80 + v * 40 | 0},0.05)`; g.fillRect(R() * w, R() * w, 1.3 * S, 1.3 * S); }
  for (const sx of [-1, 1]) { blob(256 + sx * 150, 330, 60, 44, 'rgba(235,130,110,0.16)'); blob(256 + sx * 205, 250, 50, 120, 'rgba(170,110,80,0.12)'); }
  blob(256, 140, 150, 50, 'rgba(255,230,205,0.18)'); blob(256, 455, 70, 40, 'rgba(255,225,200,0.12)');
  // hair band at the top (under the hair cap edge), dark brown with strands
  g.fillStyle = '#2e1d12'; g.fillRect(0, 0, w, 66 * S); g.fillRect(0, 60 * S, 40 * S, 80 * S); g.fillRect(w - 40 * S, 60 * S, 40 * S, 80 * S);
  for (let i = 0; i < 900; i++) { const x = R() * w, y = (40 + R() * 34) * S; g.strokeStyle = `rgba(${40 + R() * 40 | 0},${25 + R() * 25 | 0},${15 + R() * 12 | 0},0.6)`; g.lineWidth = 2 * S; g.beginPath(); g.moveTo(x, y - 20 * S); g.lineTo(x + (R() - 0.5) * 8 * S, y + 6 * S); g.stroke(); }
  // brows: the live blocks (78..202 / 310..434, 158..184) as soft tapered brows, dark brown, hair strokes on top
  for (const [x0, sx] of [[78, -1], [310, 1]]) { const inner = sx < 0 ? x0 + 124 : x0, outer = sx < 0 ? x0 : x0 + 124;
    g.fillStyle = '#3a2416'; g.beginPath(); g.moveTo(inner * S, 160 * S); g.quadraticCurveTo((inner + outer) / 2 * S, 150 * S, outer * S, 166 * S); g.lineTo(outer * S, 174 * S); g.quadraticCurveTo((inner + outer) / 2 * S, 172 * S, inner * S, 186 * S); g.closePath(); g.fill();
    for (let k = 0; k < 160; k++) { const t = R(), x = inner + (outer - inner) * t, y = 162 + 18 * (1 - t) * R() + 4 * t; g.strokeStyle = `rgba(${30 + R() * 30 | 0},${18 + R() * 16 | 0},${10 + R() * 10 | 0},0.55)`; g.lineWidth = 1.6 * S; g.beginPath(); g.moveTo(x * S, (y + 4) * S); g.lineTo((x - sx * 7) * S, (y - 3) * S); g.stroke(); } }
  // eyes: the live big eyes (96..192 / 328..424 by 206..264), iris at the inner side as before, now rounded and detailed
  for (const ex of [96, 328]) { const cx = ex + 48, cy = 235, ix = ex + (ex < 200 ? 68 : 28), iy = 236;
    blob(cx, cy - 6, 62, 44, 'rgba(150,90,70,0.22)');   // socket shade
    g.save(); rr(ex, 206, 96, 58, 26); g.clip();
    const wg = g.createLinearGradient(0, 206 * S, 0, 264 * S); wg.addColorStop(0, '#dcd6cc'); wg.addColorStop(0.35, '#f6f3ec'); wg.addColorStop(1, '#e8e2d8'); g.fillStyle = wg; g.fillRect(ex * S, 206 * S, 96 * S, 58 * S);
    const ig = g.createRadialGradient(ix * S, iy * S, 2 * S, ix * S, iy * S, 30 * S); ig.addColorStop(0, '#7fc0f0'); ig.addColorStop(0.45, '#3c86c8'); ig.addColorStop(0.85, '#2a62a0'); ig.addColorStop(1, '#15365e');
    g.fillStyle = ig; g.beginPath(); g.ellipse(ix * S, iy * S, 28 * S, 30 * S, 0, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; g.strokeStyle = k % 2 ? 'rgba(200,235,255,0.25)' : 'rgba(15,40,80,0.25)'; g.lineWidth = 1.2 * S; g.beginPath(); g.moveTo((ix + Math.cos(a) * 15) * S, (iy + Math.sin(a) * 16) * S); g.lineTo((ix + Math.cos(a) * 26) * S, (iy + Math.sin(a) * 28) * S); g.stroke(); }
    g.fillStyle = '#0d1116'; g.beginPath(); g.ellipse(ix * S, iy * S, 13 * S, 16 * S, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse((ix - 8) * S, (iy - 10) * S, 6 * S, 6 * S, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc((ix + 9) * S, (iy + 9) * S, 2.6 * S, 0, Math.PI * 2); g.fill();
    const lg = g.createLinearGradient(0, 206 * S, 0, 226 * S); lg.addColorStop(0, 'rgba(25,45,80,0.75)'); lg.addColorStop(1, 'rgba(25,45,80,0)'); g.fillStyle = lg; g.fillRect(ex * S, 206 * S, 96 * S, 20 * S);   // upper lid shadow (was the dark strip)
    g.restore();
    g.strokeStyle = '#2a1c16'; g.lineWidth = 4 * S; rr(ex, 206, 96, 58, 26); g.save(); g.clip(); g.beginPath(); g.moveTo((ex - 4) * S, 214 * S); g.quadraticCurveTo(cx * S, 196 * S, (ex + 100) * S, 214 * S); g.stroke(); g.restore();   // lash line, top only
    g.strokeStyle = 'rgba(120,70,55,0.35)'; g.lineWidth = 2 * S; g.beginPath(); g.moveTo((ex + 8) * S, 266 * S); g.quadraticCurveTo(cx * S, 272 * S, (ex + 88) * S, 266 * S); g.stroke();   // soft lower lid (was the brown bar)
    g.strokeStyle = 'rgba(150,95,75,0.3)'; g.lineWidth = 2.5 * S; g.beginPath(); g.moveTo((ex + 4) * S, 200 * S); g.quadraticCurveTo(cx * S, 188 * S, (ex + 92) * S, 200 * S); g.stroke(); }   // lid crease
  // nose: the live block (224..288, 250..334) as a lit bridge and a soft rounded tip with nostrils at its foot
  blob(256, 290, 30, 52, 'rgba(255,225,200,0.2)'); for (const sx of [-1, 1]) blob(256 + sx * 30, 292, 10, 40, 'rgba(160,100,75,0.18)');
  blob(256, 322, 30, 14, 'rgba(255,215,190,0.22)'); for (const sx of [-1, 1]) { blob(256 + sx * 15, 333, 9, 5, 'rgba(90,45,35,0.6)'); blob(256 + sx * 30, 326, 9, 12, 'rgba(150,90,70,0.25)'); }
  blob(256, 342, 34, 7, 'rgba(140,85,65,0.25)');
  // mouth: the live wide mouth (176..336, 382..414), rounded lips with a soft line and corners
  g.fillStyle = '#bf8466'; g.beginPath(); g.moveTo(178 * S, 390 * S); g.bezierCurveTo(205 * S, 378 * S, 240 * S, 380 * S, 256 * S, 384 * S); g.bezierCurveTo(272 * S, 380 * S, 307 * S, 378 * S, 334 * S, 390 * S); g.quadraticCurveTo(256 * S, 398 * S, 178 * S, 390 * S); g.fill();
  const lp = g.createLinearGradient(0, 392 * S, 0, 416 * S); lp.addColorStop(0, '#a85c4a'); lp.addColorStop(1, '#b8705c'); g.fillStyle = lp; g.beginPath(); g.moveTo(186 * S, 392 * S); g.quadraticCurveTo(256 * S, 400 * S, 326 * S, 392 * S); g.bezierCurveTo(310 * S, 414 * S, 280 * S, 418 * S, 256 * S, 418 * S); g.bezierCurveTo(232 * S, 418 * S, 202 * S, 414 * S, 186 * S, 392 * S); g.fill();
  blob(262, 404, 26, 5, 'rgba(255,220,200,0.35)');
  g.strokeStyle = 'rgba(110,50,40,0.8)'; g.lineWidth = 3 * S; g.lineCap = 'round'; g.beginPath(); g.moveTo(180 * S, 391 * S); g.quadraticCurveTo(256 * S, 398 * S, 332 * S, 391 * S); g.stroke();
  blob(256, 428, 50, 8, 'rgba(150,90,70,0.2)');
}
