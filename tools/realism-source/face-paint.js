/* LOCAL 1.2.33 painted-realism experiment: the in game face type of v1.2.31 kept (big blue eyes looking slightly in, block brows, nose, wide mouth, at the
   same places and sizes on the 512 map), repainted at full resolution with soft anti aliased edges, rounded shapes, iris detail, lid shading,
   catch lights and gentle skin shading. Original work; seeded, so every build paints the same pixels. */
function paintFaceV1232(g, w) {
  let sd = 1232; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647, S = w / 512;
  const blob = (x, y, rx, ry, c) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, c); gr.addColorStop(1, c.replace(/[\d.]+\)$/, '0)')); g.save(); g.translate(x * S, y * S); g.scale(rx * S, ry * S); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore(); };
  const rr = (x, y, ww, hh, r) => { g.beginPath(); g.roundRect(x * S, y * S, ww * S, hh * S, r * S); };
  // skin: the live warm gradient, fine seeded grain, soft cheek warmth and form shading
  const gr = g.createRadialGradient(256 * S, 300 * S, 40 * S, 256 * S, 280 * S, 360 * S); gr.addColorStop(0, '#e9bc9d'); gr.addColorStop(1, '#d5a887'); g.fillStyle = gr; g.fillRect(0, 0, w, w);
  for (let i = 0; i < 12000; i++) { const v = R(); g.fillStyle = `rgba(${170 + v * 70 | 0},${110 + v * 50 | 0},${80 + v * 40 | 0},0.05)`; g.fillRect(R() * w, R() * w, 1.3 * S, 1.3 * S); }
  for (const sx of [-1, 1]) { blob(256 + sx * 150, 330, 60, 44, 'rgba(220,127,112,0.11)'); blob(256 + sx * 205, 250, 50, 120, 'rgba(175,118,95,0.07)'); }
  blob(256, 140, 150, 50, 'rgba(255,230,205,0.09)'); blob(256, 455, 70, 40, 'rgba(255,225,200,0.07)');
  // Low-contrast mottling and subpixel pores, no age lines or photographic content.
  for(let i=0;i<1100;i++){const x=55+R()*402,y=80+R()*420;blob(x,y,3+R()*9,2+R()*7,i%3?'rgba(180,112,88,0.025)':'rgba(255,224,198,0.04)');}
  for(let i=0;i<18000;i++){const x=48+R()*416,y=85+R()*420,r=(.16+R()*.38)*S;g.fillStyle=i%3?'rgba(130,85,65,0.08)':'rgba(255,226,203,0.12)';g.beginPath();g.ellipse(x*S,y*S,r,r*.7,0,0,Math.PI*2);g.fill();}

  // hair band at the top (under the hair cap edge), dark brown with strands
  g.fillStyle = '#2e1d12'; g.fillRect(0, 0, w, 66 * S); g.fillRect(0, 60 * S, 40 * S, 80 * S); g.fillRect(w - 40 * S, 60 * S, 40 * S, 80 * S);
  for (let i = 0; i < 900; i++) { const x = R() * w, y = (40 + R() * 34) * S; g.strokeStyle = `rgba(${40 + R() * 40 | 0},${25 + R() * 25 | 0},${15 + R() * 12 | 0},0.6)`; g.lineWidth = 2 * S; g.beginPath(); g.moveTo(x, y - 20 * S); g.lineTo(x + (R() - 0.5) * 8 * S, y + 6 * S); g.stroke(); }
  // Feathered brows in the approved brow envelope, not opaque block fill or a high arch.
  for(const [x0,sx]of [[78,-1],[310,1]]){const inner=sx<0?x0+124:x0,outer=sx<0?x0:x0+124;
    blob((inner+outer)/2,170,62,10,'rgba(100,66,45,0.2)');
    for(let k=0;k<420;k++){const t=R(),x=inner+(outer-inner)*t,centre=172-4*Math.sin(t*Math.PI),y=centre+(R()-.5)*(16-10*t),len=4+R()*5;
      g.strokeStyle=`rgba(${40+R()*24|0},${27+R()*14|0},${17+R()*12|0},${.27+R()*.45})`;g.lineWidth=(.45+R()*.65)*S;g.beginPath();g.moveTo(x*S,y*S);g.quadraticCurveTo((x-sx*len*.35)*S,(y-2)*S,(x-sx*len)*S,(y-2-R()*2)*S);g.stroke();}}
  // eyes: the live big eyes (96..192 / 328..424 by 206..264), iris at the inner side as before, now rounded and detailed
  for (const ex of [96, 328]) { const cx = ex + 48, cy = 235, ix = ex + (ex < 200 ? 68 : 28), iy = 236;
    // Generous natural eye opening, same large bounding envelope, continuously curved rather than a rounded rectangle.
    const opening=()=>{g.beginPath();g.moveTo(ex*S,235*S);g.bezierCurveTo((ex+4)*S,213*S,(ex+16)*S,205*S,(ex+34)*S,205*S);g.bezierCurveTo((ex+56)*S,203*S,(ex+82)*S,204*S,(ex+96)*S,233*S);g.bezierCurveTo((ex+89)*S,259*S,(ex+78)*S,265*S,(ex+59)*S,266*S);g.bezierCurveTo((ex+34)*S,268*S,(ex+9)*S,264*S,ex*S,235*S);g.closePath();};
    blob(cx, cy - 6, 62, 44, 'rgba(150,90,70,0.22)');   // socket shade
    g.save(); opening(); g.clip();
    const wg = g.createLinearGradient(0, 206 * S, 0, 264 * S); wg.addColorStop(0, '#cfc8be'); wg.addColorStop(0.35, '#eee8de'); wg.addColorStop(1, '#dcd5c9'); g.fillStyle = wg; g.fillRect(ex * S, 196 * S, 96 * S, 80 * S);
    blob(ex+3,235,10,9,'rgba(190,120,115,0.21)');blob(ex+93,235,10,9,'rgba(190,120,115,0.21)');
    const ig = g.createRadialGradient(ix * S, iy * S, 2 * S, ix * S, iy * S, 30 * S); ig.addColorStop(0, '#84b1c9'); ig.addColorStop(0.45, '#467fa8'); ig.addColorStop(0.85, '#2b5d85'); ig.addColorStop(1, '#1c3b59');
    g.fillStyle = ig; g.beginPath(); g.ellipse(ix * S, iy * S, 28 * S, 30 * S, 0, 0, Math.PI * 2); g.fill();
    // Original iris fibres, collarette and subtle crypts, still the same large blue iris/pupil footprint.
    for(let k=0;k<200;k++){const a=k/200*Math.PI*2+R()*.03,r0=13+R()*4,r1=24+R()*4;g.strokeStyle=k%3?'rgba(166,209,226,0.24)':'rgba(15,42,65,0.32)';g.lineWidth=(.35+R()*.6)*S;g.beginPath();g.moveTo((ix+Math.cos(a)*r0)*S,(iy+Math.sin(a)*r0*1.05)*S);g.quadraticCurveTo((ix+Math.cos(a+.04)*20)*S,(iy+Math.sin(a+.04)*21)*S,(ix+Math.cos(a)*r1)*S,(iy+Math.sin(a)*r1*1.06)*S);g.stroke();}
    g.strokeStyle='rgba(115,154,171,0.3)';g.lineWidth=1.2*S;g.beginPath();g.ellipse(ix*S,iy*S,16*S,18*S,0,0,Math.PI*2);g.stroke();
    g.fillStyle = '#0d1116'; g.beginPath(); g.ellipse(ix * S, iy * S, 13 * S, 16 * S, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse((ix - 8) * S, (iy - 10) * S, 4.8 * S, 4 * S, -0.3, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc((ix + 9) * S, (iy + 9) * S, 1.8 * S, 0, Math.PI * 2); g.fill();
    const lg = g.createLinearGradient(0, 206 * S, 0, 226 * S); lg.addColorStop(0, 'rgba(55,55,60,0.5)'); lg.addColorStop(1, 'rgba(25,45,80,0)'); g.fillStyle = lg; g.fillRect(ex * S, 206 * S, 96 * S, 20 * S);   // upper lid shadow (was the dark strip)
    g.restore();
    g.strokeStyle = 'rgba(75,52,42,0.75)'; g.lineWidth = 2.2 * S; opening(); g.save(); g.clip(); g.beginPath(); g.moveTo((ex - 4) * S, 214 * S); g.quadraticCurveTo(cx * S, 196 * S, (ex + 100) * S, 214 * S); g.stroke(); g.restore();   // lash line, top only
    g.strokeStyle = 'rgba(155,110,90,0.26)'; g.lineWidth = 2 * S; g.beginPath(); g.moveTo((ex + 8) * S, 266 * S); g.quadraticCurveTo(cx * S, 272 * S, (ex + 88) * S, 266 * S); g.stroke();   // soft lower lid (was the brown bar)
    g.strokeStyle = 'rgba(160,110,90,0.2)'; g.lineWidth = 2.5 * S; g.beginPath(); g.moveTo((ex + 4) * S, 200 * S); g.quadraticCurveTo(cx * S, 188 * S, (ex + 92) * S, 200 * S); g.stroke(); }   // lid crease
  // 1.2.33 nose aligned to the new geometry: tip y .196, wings .177, nostrils .169.
  const X = x => (x + 0.22) / 0.44 * 512, Y = y => (1 - (y - 0.01) / 0.48) * 512;
  blob(256, Y(0.236), 12, 46, 'rgba(255,230,205,0.16)');
  for (const sx of [-1, 1]) {
    blob(X(sx * 0.023), Y(0.229), 10, 37, 'rgba(155,100,75,0.09)');
    blob(X(sx * 0.016), Y(0.169), 6, 3.2, 'rgba(100,60,45,0.46)');
    blob(X(sx * 0.034), Y(0.178), 6, 10, 'rgba(160,105,80,0.12)');
  }
  blob(256, Y(0.196), 18, 12, 'rgba(255,225,200,0.19)');
  blob(256, Y(0.163), 19, 5, 'rgba(160,105,80,0.1)');
  // A modest closed mouth, narrower than the live painted bar, following the same line curve as the actual mesh.
  const LY = x => 0.115 + 0.0018 * (Math.abs(x) / 0.05) ** 2 - 0.0012 * Math.exp(-((x / 0.012) ** 2));
  const traceLine = (rev=false) => { for (let j = 0; j <= 60; j++) { const x = (rev ? 0.057 - j * 0.114 / 60 : -0.057 + j * 0.114 / 60); if (!j) g.moveTo(X(x)*S,Y(LY(x))*S);else g.lineTo(X(x)*S,Y(LY(x))*S); } };
  // Subtle warm rose near the skin colour, no dark lipstick slab. Each lip tapers smoothly to the corners.
  g.fillStyle='#c9957c'; g.beginPath(); traceLine();
  for(let j=60;j>=0;j--){const x=-0.057+j*0.114/60, taper=Math.max(0,1-(x/0.057)**2);const h=0.009*taper+0.002*Math.exp(-(((Math.abs(x)-0.014)/0.009)**2))*taper;g.lineTo(X(x)*S,Y(LY(x)+h)*S);}g.closePath();g.fill();
  const lp=g.createLinearGradient(0,Y(0.114)*S,0,Y(0.098)*S);lp.addColorStop(0,'#c38a73');lp.addColorStop(1,'#d1a085');g.fillStyle=lp;g.beginPath();traceLine();
  for(let j=60;j>=0;j--){const x=-0.057+j*0.114/60,taper=Math.max(0,1-(x/0.057)**2);g.lineTo(X(x)*S,Y(LY(x)-0.014*taper)*S);}g.closePath();g.fill();
  // Fine vertical lip grain, clipped to the existing lower-lip silhouette (not cracks or lipstick).
  g.save();g.beginPath();traceLine();for(let j=60;j>=0;j--){const x=-.057+j*.114/60,taper=Math.max(0,1-(x/.057)**2);g.lineTo(X(x)*S,Y(LY(x)-.014*taper)*S);}g.closePath();g.clip();
  for(let i=0;i<85;i++){const x=-.055+R()*.11;g.strokeStyle=i%2?'rgba(130,82,64,0.12)':'rgba(255,218,193,0.14)';g.lineWidth=.55*S;g.beginPath();g.moveTo(X(x)*S,Y(LY(x)-.003)*S);g.lineTo(X(x+(R()-.5)*.002)*S,Y(LY(x)-.014)*S);g.stroke();}g.restore();
  blob(256,Y(0.103),22,3,'rgba(255,225,200,0.15)');
  g.strokeStyle='rgba(125,74,58,0.65)';g.lineWidth=1.8*S;g.lineCap='round';g.beginPath();traceLine();g.stroke();
  for(const sx of [-1,1])blob(X(sx*0.058),Y(0.117),3.2,2,'rgba(140,88,67,0.25)');
  blob(256,Y(0.086),33,6,'rgba(170,115,90,0.1)');
}
