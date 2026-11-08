#!/usr/bin/env node
'use strict';
// Local candidate on top of v1.2.27 (no version change): the seven Agartha residents are renamed the Paladiens and restyled from the user's
// reference art (fitted blue suits with seams and a black high collar band, gold throat brooch, long blond hair, blue eyes; the leader has
// gold epaulettes, a turquoise sash and pendant), and the city sky dome becomes a cosmic navy, violet and cyan sky with planets and soft glows.
// Usage: node tools/build-paladiens.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bpal-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.27.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
// ---- name ----
one('"The Agarthans are keepers of that inner world.','"The Paladiens are keepers of that inner world.');
one("kind: 'agarthan', __ag: 1","kind: 'paladien', name: 'Paladien', __ag: 1");
// ---- atlas: the costume from the reference art ----
{const A="    at('linen', q =>",E="    const t = new THREE.CanvasTexture(c); try { t.anisotropy";const a=s.indexOf(A);if(a<0||s.indexOf(A,a+1)>=0)throw Error('atlas start');const b=s.indexOf(E,a);if(b<0)throw Error('atlas end');
 s=s.slice(0,a)+`    /* Paladiens: fitted blue cloth suit (not armour), fine vertical seams, black high collar band, gold round throat brooch, long blond hair, blue eyes */
    const cloth = (q, base) => { g.fillStyle = base; g.fillRect(0, 0, q, q); for (let y = 0; y < q; y += 2) { g.fillStyle = \`rgba(10,30,70,\${0.04 + r() * 0.05})\`; g.fillRect(0, y, q, 1); } for (let i = 0; i < q * 2; i++) { g.fillStyle = \`rgba(200,235,255,\${r() * 0.07})\`; g.fillRect(r() * q, r() * q, 1 + r() * 2, 1); } };
    const seams = (q, xs) => { for (const x of xs) { g.fillStyle = 'rgba(8,30,70,0.45)'; g.fillRect(q * x, 0, Math.max(1, q / 90), q); g.fillStyle = 'rgba(170,225,255,0.35)'; g.fillRect(q * x + Math.max(1, q / 90), 0, Math.max(1, q / 120), q); } };
    const blond = q => { g.fillStyle = '#e2c25c'; g.fillRect(0, 0, q, q); for (let i = 0; i < q * 1.5; i++) { const x = r() * q; g.fillStyle = r() < 0.5 ? 'rgba(255,236,160,0.5)' : 'rgba(170,125,40,0.35)'; g.fillRect(x, 0, Math.max(1, q / 160), q); } };
    at('linen', q => { cloth(q, '#2f7fd0'); seams(q, [0.22, 0.5, 0.78]); g.fillStyle = '#10131c'; g.fillRect(0, 0, q, q * 0.09); g.fillStyle = '#5fb6f0'; g.fillRect(0, q * 0.09, q, q * 0.012);
      const bx = q * 0.5, by = q * 0.16, br = q * 0.06, gr = g.createLinearGradient(bx - br, by - br, bx + br, by + br); gr.addColorStop(0, '#fff2b0'); gr.addColorStop(0.6, '#e0ac30'); gr.addColorStop(1, '#8a6210'); g.fillStyle = gr; g.beginPath(); g.arc(bx, by, br, 0, 6.283); g.fill(); g.strokeStyle = '#6a4a08'; g.lineWidth = Math.max(1, q / 150); g.stroke(); });
    at('legs', q => { cloth(q, '#2a74c2'); seams(q, [0.5]); });
    at('sash', q => { g.fillStyle = '#1fb8b0'; g.fillRect(0, 0, q, q); for (let y = 0; y < q; y += q / 10) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, y, q, q / 40); } g.fillStyle = '#e8b830'; g.fillRect(0, 0, q, q * 0.06); g.fillRect(0, q * 0.94, q, q * 0.06); });
    at('skin', q => { cloth(q, '#2f7fd0'); seams(q, [0.5]); g.fillStyle = '#e8c4a4'; g.fillRect(0, q * 0.88, q, q * 0.12); });   // sleeves: long blue sleeves, hand at the end
    at('face', q => { g.fillStyle = '#ecc8a8'; g.fillRect(0, 0, q, q); blondTop(q); const ey = q * 0.44; for (const s2 of [-1, 1]) { const ex = q / 2 + s2 * q * 0.19; g.fillStyle = '#f4f6fa'; g.beginPath(); g.ellipse(ex, ey, q * 0.085, q * 0.04, 0, 0, 6.283); g.fill(); g.fillStyle = '#2f8fe8'; g.beginPath(); g.arc(ex, ey, q * 0.032, 0, 6.283); g.fill(); g.fillStyle = '#0c1a30'; g.beginPath(); g.arc(ex, ey, q * 0.013, 0, 6.283); g.fill(); g.fillStyle = '#b8902e'; g.fillRect(ex - q * 0.09, ey - q * 0.085, q * 0.18, q * 0.022); }
      g.fillStyle = 'rgba(160,110,80,0.4)'; g.fillRect(q * 0.48, q * 0.5, q * 0.04, q * 0.14); g.fillStyle = '#b06a5a'; g.fillRect(q * 0.42, q * 0.73, q * 0.16, q * 0.025); });
    function blondTop(q) { const k = q * 0.2; g.save(); g.beginPath(); g.rect(0, 0, q, k); g.clip(); blond(q); g.restore(); g.fillStyle = '#e2c25c'; g.fillRect(0, 0, q * 0.07, q * 0.75); g.fillRect(q * 0.93, 0, q * 0.07, q * 0.75); }
    at('nemes', q => blond(q));
    at('band', q => blond(q));
    at('hair', q => blond(q));
`+s.slice(b);}
// ---- leader regalia and a gold brooch for all; longer hair at the back ----
one("mh(G.eye, eyeM, -.08, .04, .175); mh(G.eye, eyeM, .08, .04, .175);","mh(G.eye, eyeM, -.08, .04, .175); mh(G.eye, eyeM, .08, .04, .175);\n      { const gold = M(0xe6b432), tq = M(0x26d0c4); mh(G.lap, band, 0, -.2, -.17).scale.set(3, 1.6, 1); mk(G.belt, k === 0 ? tq : sash, 0, 1.25, 0).visible = k === 0;\n        if (k === 0) { const ep = new THREE.BoxGeometry(.17, .06, .28); mk(ep, gold, -.27, 2.15, 0); mk(ep, gold, .27, 2.15, 0); const sa = mk(new THREE.BoxGeometry(.06, 1.0, .02), tq, 0, 1.72, .125); sa.rotation.z = 0.62; const pd = mk(new THREE.OctahedronGeometry(.055), tq, .07, 1.9, .14); pd.scale.z = 0.5; mk(new THREE.BoxGeometry(.05, .05, .015), gold, -.12, 1.95, .128); } }");
// ---- the cosmic sky (background style only: no faces, borders or words) ----
{const A="void main(){ vec3 d = normalize(vP); float y = clamp(d.y, 0.0, 1.0);\n  vec3 sky = mix(vec3(0.17, 0.11, 0.34), vec3(0.04, 0.09, 0.27), pow(y, 0.7));",E="  gl_FragColor = vec4(mix(col, rk, clamp(rock, 0.0, 1.0)), 1.0); }";const a=s.indexOf(A);if(a<0||s.indexOf(A,a+1)>=0)throw Error('sky start');const b=s.indexOf(E,a)+E.length;
 s=s.slice(0,a)+`vec3 planet(vec3 d, vec3 c, float r, vec3 col, vec3 bg){ float a = acos(clamp(dot(d, normalize(c)), -1.0, 1.0)); float disc = smoothstep(r, r * 0.97, a); vec3 lit = col * (0.55 + 0.6 * clamp(dot(d - normalize(c), normalize(vec3(-0.6, 0.5, 0.2))) / r * 0.8 + 0.4, 0.0, 1.0)); float halo = exp(-max(a - r, 0.0) * 22.0) * 0.45; return mix(bg + col * halo, lit, disc); }
void main(){ vec3 d = normalize(vP); float y = clamp(d.y, 0.0, 1.0);
  /* Paladien sky: deep navy and violet space with cyan nebula, stars, planets and soft lens glows */
  vec3 sky = mix(vec3(0.10, 0.06, 0.26), vec3(0.02, 0.03, 0.12), pow(y, 0.6));
  vec2 q = d.xz / (y + 0.35) * 1.6; float neb = fb(q * 1.3 + vec2(uT * 0.006, 0.0)), neb2 = fb(q * 2.7 - 3.0);
  vec3 col = sky + vec3(0.30, 0.10, 0.45) * smoothstep(0.45, 0.85, neb) * 0.7 + vec3(0.05, 0.55, 0.75) * smoothstep(0.55, 0.9, neb2) * 0.55;
  vec2 sp = d.xz / (y + 0.2) * 60.0; float st = step(0.985, h(floor(sp))) * (0.6 + 0.4 * sin(uT * 2.0 + h(floor(sp) + 3.0) * 30.0)); col += vec3(0.85, 0.92, 1.0) * st * smoothstep(0.05, 0.3, y);
  col = planet(d, vec3(0.55, 0.62, -0.55), 0.16, vec3(0.20, 0.45, 0.85), col);
  col = planet(d, vec3(-0.7, 0.45, 0.35), 0.07, vec3(0.75, 0.45, 0.85), col);
  col = planet(d, vec3(0.1, 0.9, 0.5), 0.035, vec3(0.95, 0.8, 0.5), col);
  for (int i = 0; i < 5; i++) { float fi = float(i); vec3 c = normalize(vec3(sin(fi * 2.4 + 1.0), 0.35 + 0.12 * fi, cos(fi * 2.4 + 1.0))); float a = acos(clamp(dot(d, c), -1.0, 1.0)); col += vec3(0.25, 0.75, 1.0) * (smoothstep(0.05, 0.035, a) - smoothstep(0.035, 0.02, a) * 0.7) * 0.35; }
  float rock = smoothstep(0.12, 0.0, y);
  vec3 rk = vec3(0.07, 0.07, 0.15) * (0.75 + 0.5 * n(d.xz * 40.0));
  gl_FragColor = vec4(mix(col, rk, clamp(rock, 0.0, 1.0)), 1.0); }`+s.slice(b);}
fs.writeFileSync(out,s);
