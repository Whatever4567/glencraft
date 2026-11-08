// Original human-reference-informed atlas. No reference pixels copied.
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
  g.fillStyle = '#1d140f'; g.fillRect(0, 0, w, 66 * S); g.fillRect(0, 60 * S, 40 * S, 80 * S); g.fillRect(w - 40 * S, 60 * S, 40 * S, 80 * S);
  for (let i = 0; i < 900; i++) { const x = R() * w, y = (40 + R() * 34) * S; g.strokeStyle = `rgba(${40 + R() * 40 | 0},${25 + R() * 25 | 0},${15 + R() * 12 | 0},0.6)`; g.lineWidth = 2 * S; g.beginPath(); g.moveTo(x, y - 20 * S); g.lineTo(x + (R() - 0.5) * 8 * S, y + 6 * S); g.stroke(); }
  // Human eye placement shared with the sculpt in head-space metres; BLUE colour, not oversized dimensions.
  const X=x=>(x+.22)/.44*512,Y=y=>(1-(y-.01)/.48)*512;
  for(const sx of [-1,1]){
    // Individual brow hairs in a short straight low-density arch.
    for(let k=0;k<270;k++){const u=R()*2-1,x=sx*(.085+u*.046),y=.307+.003*(1-u*u)+(R()-.5)*.006;
      g.strokeStyle=`rgba(39,28,22,${.23+R()*.4})`;g.lineWidth=(.38+R()*.36)*S;g.beginPath();g.moveTo(X(x)*S,Y(y)*S);g.lineTo(X(x+sx*.0025)*S,Y(y+.003)*S);g.stroke();}
    const opening=()=>{g.beginPath();for(let j=0;j<=80;j++){const u=-1+j/40,q=Math.pow(Math.max(0,1-u*u),.68),x=sx*(.085+u*.033),y=.271+.0018*u+.012*q;if(j)g.lineTo(X(x)*S,Y(y)*S);else g.moveTo(X(x)*S,Y(y)*S);}for(let j=80;j>=0;j--){const u=-1+j/40,q=Math.pow(Math.max(0,1-u*u),.68);g.lineTo(X(sx*(.085+u*.033))*S,Y(.271+.0018*u-.010*q)*S);}g.closePath();};
    g.save();opening();g.clip();const white=g.createLinearGradient(0,Y(.285)*S,0,Y(.258)*S);white.addColorStop(0,'#bdb6ad');white.addColorStop(.45,'#e4dfd6');white.addColorStop(1,'#d5d0c6');g.fillStyle=white;g.fillRect(X(sx*.085)*S-45*S,Y(.29)*S,90*S,40*S);
    const cx=X(sx*.085),cy=Y(.2735),rx=.0115/.44*512,ry=.0115/.48*512,ig=g.createRadialGradient(cx*S,cy*S,2*S,cx*S,cy*S,rx*S);ig.addColorStop(0,'#7097af');ig.addColorStop(.65,'#477994');ig.addColorStop(.87,'#305d7a');ig.addColorStop(1,'#233e54');g.fillStyle=ig;g.beginPath();g.ellipse(cx*S,cy*S,rx*S,ry*S,0,0,Math.PI*2);g.fill();
    for(let k=0;k<150;k++){const a=k/150*Math.PI*2,r0=4+R()*2,r1=11+R()*2;g.strokeStyle=k%3?'rgba(169,199,214,.24)':'rgba(20,49,72,.32)';g.lineWidth=.45*S;g.beginPath();g.moveTo((cx+Math.cos(a)*r0)*S,(cy+Math.sin(a)*r0)*S);g.lineTo((cx+Math.cos(a)*r1)*S,(cy+Math.sin(a)*r1)*S);g.stroke();}
    g.fillStyle='#121b23';g.beginPath();g.ellipse(cx*S,cy*S,5*S,5.2*S,0,0,Math.PI*2);g.fill();g.fillStyle='rgba(246,248,243,.8)';g.beginPath();g.ellipse((cx-3.5)*S,(cy-3.8)*S,1.8*S,1.4*S,0,0,Math.PI*2);g.fill();g.restore();
    // Top lash only; no black oval outline or heavy lower-eye ink.
    g.strokeStyle='rgba(72,48,38,.55)';g.lineWidth=.9*S;g.beginPath();for(let j=0;j<=60;j++){const u=-1+j/30,q=Math.pow(Math.max(0,1-u*u),.68),x=sx*(.085+u*.033),y=.271+.0018*u+.012*q;if(j)g.lineTo(X(x)*S,Y(y)*S);else g.moveTo(X(x)*S,Y(y)*S);}g.stroke();
  }
  // Recess paint follows the new nostril floor exactly, with no bright tip dots or baked bridge lighting.
  for(const sx of [-1,1]){blob(X(sx*.016),Y(.171),6.7,6.7,'rgba(62,38,30,.88)');blob(X(sx*.016),Y(.165),4.7,4.3,'rgba(70,43,33,.65)');blob(X(sx*.031),Y(.180),3.2,6,'rgba(156,103,81,.10)');g.fillStyle='rgba(65,40,31,.90)';g.beginPath();g.ellipse(X(sx*.016)*S,Y(.168)*S,5.2*S,3.7*S,0,0,Math.PI*2);g.fill();}
  // A modest closed mouth, narrower than the live painted bar, following the same line curve as the actual mesh.
  const LY = x => 0.119 + 0.0018 * (Math.abs(x) / 0.05) ** 2 - 0.0012 * Math.exp(-((x / 0.012) ** 2));
  const traceLine = (rev=false) => { for (let j = 0; j <= 60; j++) { const x = (rev ? 0.050 - j * 0.100 / 60 : -0.050 + j * 0.100 / 60); if (!j) g.moveTo(X(x)*S,Y(LY(x))*S);else g.lineTo(X(x)*S,Y(LY(x))*S); } };
  // Subtle warm rose near the skin colour, no dark lipstick slab. Each lip tapers smoothly to the corners.
  g.fillStyle='#c9957c'; g.beginPath(); traceLine();
  for(let j=60;j>=0;j--){const x=-0.050+j*0.114/60, taper=Math.max(0,1-(x/0.050)**2);const h=0.006*taper+0.002*Math.exp(-(((Math.abs(x)-0.014)/0.009)**2))*taper;g.lineTo(X(x)*S,Y(LY(x)+h)*S);}g.closePath();g.fill();
  const lp=g.createLinearGradient(0,Y(0.114)*S,0,Y(0.098)*S);lp.addColorStop(0,'#c38a73');lp.addColorStop(1,'#d1a085');g.fillStyle=lp;g.beginPath();traceLine();
  for(let j=60;j>=0;j--){const x=-0.050+j*0.114/60,taper=Math.max(0,1-(x/0.050)**2);g.lineTo(X(x)*S,Y(LY(x)-0.009*taper)*S);}g.closePath();g.fill();
  // Fine vertical lip grain, clipped to the existing lower-lip silhouette (not cracks or lipstick).
  g.save();g.beginPath();traceLine();for(let j=60;j>=0;j--){const x=-.050+j*.100/60,taper=Math.max(0,1-(x/.050)**2);g.lineTo(X(x)*S,Y(LY(x)-.009*taper)*S);}g.closePath();g.clip();
  for(let i=0;i<85;i++){const x=-.055+R()*.11;g.strokeStyle=i%2?'rgba(130,82,64,0.12)':'rgba(255,218,193,0.14)';g.lineWidth=.55*S;g.beginPath();g.moveTo(X(x)*S,Y(LY(x)-.003)*S);g.lineTo(X(x+(R()-.5)*.002)*S,Y(LY(x)-.014)*S);g.stroke();}g.restore();
  blob(256,Y(0.103),22,3,'rgba(255,225,200,0.15)');
  g.strokeStyle='rgba(125,74,58,0.65)';g.lineWidth=1.1*S;g.lineCap='round';g.beginPath();traceLine();g.stroke();
  for(const sx of [-1,1])blob(X(sx*0.058),Y(0.117),3.2,2,'rgba(140,88,67,0.25)');
  blob(256,Y(0.086),33,6,'rgba(170,115,90,0.1)');
}
