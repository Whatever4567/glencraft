/* v1.2.32 face texture. A painted face in the old style of N64 era games (a real looking face carried mostly by the texture, with soft light
   and shadow baked in), drawn here from scratch and loosely after the player own portrait (described, not traced): natural almond eyes with iris, pupil, catch light, lash line and lid crease; tapered brows
   made of strokes; a nose shown by shadow at the sides, under the tip and in the nostrils; shaped lips with a bow, a darker line between them
   and soft corners; smile folds, eye socket and under lip shading, warm cheeks and a slight stubble shadow. Every feature sits where the
   sculpted mesh has it (planar UV u = (x + 0.22) / 0.44, v = (y - 0.01) / 0.48 in head space). Seeded noise, so it is the same every time. */
function paintFaceV1232(g, w) {
  const S = w / 512, X = x => (x + 0.22) / 0.44 * w, Y = y => (1 - (y - 0.01) / 0.48) * w;
  let seed = 1232; const R = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const rg = (x, y, r0, r1, stops) => { const gr = g.createRadialGradient(x, y, r0, x, y, r1); for (const [o, c] of stops) gr.addColorStop(o, c); return gr; };
  const blob = (x, y, rx, ry, col, rot) => { g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(1, ry / rx); g.fillStyle = rg(0, 0, 0, rx, [[0, col], [1, col.replace(/[\d.]+\)$/, '0)')]]); g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill(); g.restore(); };
  // skin: warm base, lighter forehead and nose, a touch darker at the jaw, fine grain
  g.fillStyle = rg(w * 0.5, w * 0.42, w * 0.05, w * 0.75, [[0, '#f0c8ab'], [0.55, '#e6b797'], [1, '#cf9f82']]); g.fillRect(0, 0, w, w);
  for (let i = 0; i < 9000; i++) { const v = R(); g.fillStyle = `rgba(${150 + v * 70 | 0},${95 + v * 50 | 0},${70 + v * 40 | 0},0.05)`; g.fillRect(R() * w, R() * w, 1.2 * S, 1.2 * S); }
  // baked shading that follows the mesh: temples, under the cheekbones, jaw, stubble shadow round mouth and chin
  for (const sx of [-1, 1]) { blob(X(sx * 0.16), Y(0.36), 60 * S, 70 * S, 'rgba(150,95,70,0.22)'); blob(X(sx * 0.13), Y(0.14), 46 * S, 34 * S, 'rgba(150,90,68,0.2)'); blob(X(sx * 0.135), Y(0.21), 34 * S, 22 * S, 'rgba(225,120,105,0.16)'); }
  blob(X(0), Y(0.075), 92 * S, 56 * S, 'rgba(110,85,70,0.13)'); blob(X(0), Y(0.33), 70 * S, 36 * S, 'rgba(255,225,200,0.16)');
  // eye sockets and lids
  for (const sx of [-1, 1]) { const cx = X(sx * 0.1), cy = Y(0.272);
    blob(cx, cy - 4 * S, 44 * S, 30 * S, 'rgba(120,70,55,0.28)'); blob(cx + sx * 10 * S, cy + 16 * S, 30 * S, 10 * S, 'rgba(120,75,65,0.18)');
    // almond eye opening
    const ew = 39 * S, eh = 13.5 * S, path = () => { g.beginPath(); g.moveTo(cx - ew, cy + sx * 0 + 1 * S); g.bezierCurveTo(cx - ew * 0.45, cy - eh * 1.25, cx + ew * 0.45, cy - eh * 1.25, cx + ew, cy - 1 * S); g.bezierCurveTo(cx + ew * 0.45, cy + eh * 0.95, cx - ew * 0.45, cy + eh * 0.95, cx - ew, cy + 1 * S); g.closePath(); };
    g.save(); path(); g.clip(); g.fillStyle = rg(cx, cy, 2 * S, ew, [[0, '#f3eee6'], [1, '#cfc4b8']]); g.fillRect(cx - ew, cy - eh * 1.5, ew * 2, eh * 3);
    const ix = cx - sx * 2 * S; g.fillStyle = rg(ix, cy, 1, 11.5 * S, [[0, '#7a5638'], [0.55, '#4e3421'], [0.9, '#2e1e13'], [1, '#21150d']]); g.beginPath(); g.arc(ix, cy, 13 * S, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; g.strokeStyle = 'rgba(25,15,8,0.3)'; g.lineWidth = 0.8 * S; g.beginPath(); g.moveTo(ix + Math.cos(a) * 4.5 * S, cy + Math.sin(a) * 4.5 * S); g.lineTo(ix + Math.cos(a) * 11 * S, cy + Math.sin(a) * 11 * S); g.stroke(); }
    g.fillStyle = '#0c0f12'; g.beginPath(); g.arc(ix, cy, 4.6 * S, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(ix - 3.5 * S, cy - 3.5 * S, 2.2 * S, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(70,40,30,0.35)'; g.fillRect(cx - ew, cy - eh * 1.5, ew * 2, eh * 0.75); g.restore();   // upper lid shadow on the eyeball
    g.strokeStyle = '#2a1a12'; g.lineWidth = 2.6 * S; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - ew, cy + 1 * S); g.bezierCurveTo(cx - ew * 0.45, cy - eh * 1.25, cx + ew * 0.45, cy - eh * 1.25, cx + ew + 2 * S, cy - 2 * S); g.stroke();   // lash line
    g.strokeStyle = 'rgba(150,95,80,0.3)'; g.lineWidth = 1.1 * S; g.beginPath(); g.moveTo(cx - ew * 0.8, cy + eh * 0.95); g.quadraticCurveTo(cx, cy + eh * 1.25, cx + ew * 0.85, cy + eh * 0.6); g.stroke();   // lower lid edge
    g.strokeStyle = 'rgba(140,85,70,0.3)'; g.lineWidth = 2 * S; g.beginPath(); g.moveTo(cx - ew * 0.9, cy - eh * 1.2); g.quadraticCurveTo(cx, cy - eh * 2.3, cx + ew * 0.95, cy - eh * 1.3); g.stroke();   // lid crease
    // brow: tapered strokes, thick at the inner end
    for (let k = 0; k < 300; k++) { const t = R(), bx = X(sx * (0.042 + 0.11 * t)), by = Y(0.31 + 0.007 * Math.sin(Math.PI * Math.min(1, t * 0.8)) - 0.003 * t) + (R() - 0.5) * (11 - 7 * t) * S, len = (5 + 4 * R()) * S, ang = -(0.75 - 0.6 * t) + (R() - 0.5) * 0.35;
      g.strokeStyle = `rgba(${48 + R() * 25 | 0},${30 + R() * 15 | 0},${18 + R() * 10 | 0},${0.4 + 0.3 * R()})`; g.lineWidth = (1.7 - 0.8 * t) * S; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(ang) * len * sx, by + Math.sin(ang) * len); g.stroke(); } }
  // nose by shadow: sides of the bridge, under the tip, nostrils, wing creases, a highlight down the bridge
  for (const sx of [-1, 1]) { for (let k = 0; k <= 12; k++) { const y = 0.29 - k * 0.009; blob(X(sx * (0.014 + 0.012 * k / 12)), Y(y), (5 + 3 * k / 12) * S, 9 * S, 'rgba(150,90,70,0.08)'); }
    blob(X(sx * 0.014), Y(0.158), 8 * S, 4.5 * S, 'rgba(60,30,25,0.85)', sx * 0.35); g.strokeStyle = 'rgba(120,65,50,0.5)'; g.lineWidth = 1.6 * S; g.beginPath(); g.arc(X(sx * 0.03), Y(0.168), 9 * S, sx > 0 ? -1.2 : Math.PI - 1.0, sx > 0 ? 1.0 : Math.PI + 1.2); g.stroke(); }
  blob(X(0), Y(0.152), 24 * S, 6 * S, 'rgba(110,60,45,0.35)'); blob(X(0), Y(0.235), 6 * S, 34 * S, 'rgba(255,230,210,0.22)'); blob(X(0), Y(0.19), 10 * S, 8 * S, 'rgba(255,225,205,0.25)');
  // smile folds
  for (const sx of [-1, 1]) for (let k = 0; k <= 10; k++) { const s2 = k / 10; blob(X(sx * (0.046 + 0.026 * s2 - 0.006 * s2 * s2)), Y(0.165 - 0.065 * s2), 5 * S, 6 * S, 'rgba(130,75,60,0.06)'); }
  // philtrum, lips with a bow, the line between them, corners; shadow under the lower lip
  blob(X(0), Y(0.14), 7 * S, 12 * S, 'rgba(160,100,80,0.18)');
  const ml = Y(0.1135), lw = 0.052;
  g.fillStyle = '#b8767a'; g.beginPath(); g.moveTo(X(-lw), ml); g.bezierCurveTo(X(-0.035), Y(0.122), X(-0.016), Y(0.13), X(-0.006), Y(0.127)); g.quadraticCurveTo(X(0), Y(0.124), X(0.006), Y(0.127)); g.bezierCurveTo(X(0.016), Y(0.13), X(0.035), Y(0.122), X(lw), ml); g.quadraticCurveTo(X(0), Y(0.11), X(-lw), ml); g.fill();
  g.fillStyle = rg(X(0), Y(0.104), 2, 46 * S, [[0, '#cf8f8c'], [1, '#ad6c6c']]); g.beginPath(); g.moveTo(X(-lw), ml); g.quadraticCurveTo(X(0), Y(0.112), X(lw), ml); g.bezierCurveTo(X(0.034), Y(0.097), X(0.016), Y(0.0905), X(0), Y(0.0905)); g.bezierCurveTo(X(-0.016), Y(0.0905), X(-0.034), Y(0.097), X(-lw), ml); g.fill();
  blob(X(0.008), Y(0.101), 14 * S, 4 * S, 'rgba(255,220,205,0.35)');
  g.strokeStyle = 'rgba(105,55,55,0.85)'; g.lineWidth = 1.8 * S; g.beginPath(); g.moveTo(X(-lw), ml); g.quadraticCurveTo(X(-0.02), Y(0.115), X(0), Y(0.1125)); g.quadraticCurveTo(X(0.02), Y(0.115), X(lw), ml); g.stroke();
  for (const sx of [-1, 1]) blob(X(sx * lw), ml, 5 * S, 4 * S, 'rgba(90,45,35,0.45)');
  blob(X(0), Y(0.086), 34 * S, 7 * S, 'rgba(120,70,55,0.3)'); blob(X(0), Y(0.05), 24 * S, 14 * S, 'rgba(255,225,205,0.14)');
  // hairline band above the brow and at the temples, under the hair cap edge, so no skin shows through gaps
  g.fillStyle = '#3a2416'; g.fillRect(0, 0, w, Y(0.405)); for (const sx of [-1, 1]) g.fillRect(sx < 0 ? 0 : X(0.19), Y(0.405), X(-0.19), Y(0.33) - Y(0.405));
  for (let i = 0; i < 700; i++) { const x = R() * w, y = Y(0.405) + R() * 14 * S; g.strokeStyle = `rgba(${55 + R() * 30 | 0},${35 + R() * 20 | 0},${20 + R() * 10 | 0},0.6)`; g.lineWidth = 1.4 * S; g.beginPath(); g.moveTo(x, Y(0.405) - 4 * S); g.lineTo(x + (R() - 0.5) * 4 * S, y); g.stroke(); }
}
