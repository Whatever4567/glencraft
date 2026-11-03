s=open('s1.js').read()
a=s.index("function sheepTemplate(tam) {"); b=s.index("function makeSheep()", a)
new=open('sheep_v2.js').read()
s=s[:a]+new+s[b:]
old=s[s.index("  const lock = new THREE.ConeGeometry(0.06, 0.24, 6);"):s.index("  const sash = aniMesh(body")]
s=s.replace(old,'''  // shaggy coat: broad flat locks lying on the body and curling out at the tips (Highland-cow style), not spikes
  const lock = aniSculpt(0.075, 0.11, 0.02, 8, 8, (x, y, z) => { const t = (1 - y) / 2; return [x * (1 - 0.45 * t), y, z + t * t * 0.35]; });
  for (let ring = 0; ring < 3; ring++) { const lat = -0.12 + ring * 0.36, n = 15 - ring * 2;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + ring * 0.37;
      const cx = Math.cos(lat), px = Math.sin(a) * cx * 0.43, pz = Math.cos(a) * cx * 0.52, py = Math.sin(lat) * 0.34;
      const m = aniMesh(fringe, lock, (i * 7 + ring) % 4 ? coat : coatDk, px, py - 0.06, pz, 0, a, 0);
      m.rotateX(-0.35 - lat * 0.8); m.scale.setScalar(0.85 + ((i * 13 + ring * 5) % 7) * 0.05); } }
''')
A="  aniMesh(head, new THREE.CylinderGeometry(0.16, 0.12, 0.06, 18), tart, 0.03, 0.2, 0, 0, 0, -0.3);"
assert s.count(A)==1
s=s.replace(A,"  for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.28; const m = aniMesh(head, lock, i % 2 ? coat : coatDk, Math.sin(a) * 0.16, 0.13, 0.11 + Math.cos(a) * 0.06, 0, a, 0); m.rotateX(0.5); m.scale.setScalar(0.55); }\n"+A)
old=s[s.index("  for (const sx of [-1, 1]) {\n    aniMesh(rig, aniSculpt(0.045, 0.1, 0.2"):s.index("  aniMesh(rig, aniSculpt(0.06, 0.025, 0.1, 10, 6), dark")]
s=s.replace(old,'''  const wingG = aniSculpt(0.05, 0.085, 0.22, 16, 10, (x, y, z) => { const t = (z + 1) / 2; return [x * (0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, t * 1.3))), y * (0.35 + 0.65 * t), z + (z < 0 ? z * 0.25 : 0)]; });
  const specG = aniSculpt(0.012, 0.022, 0.07, 8, 6), white = aniMat(null, 0xf4f1ea);
  for (const sx of [-1, 1]) {
    aniMesh(rig, wingG, dark, sx * 0.112, 0.25, -0.05, 0.04, -sx * 0.08, sx * 0.1);
    aniMesh(rig, specG, white, sx * 0.146, 0.235, -0.06, 0.04, -sx * 0.1, 0);
    aniMesh(rig, specG, spec, sx * 0.149, 0.237, -0.067, 0.04, -sx * 0.1, 0);
  }
''')
A="  for (const sx of [-1, 1]) { aniMesh(head, new THREE.SphereGeometry(0.014, 8, 6), eye, sx * 0.062, 0.15, 0.06); aniMesh(head, new THREE.BoxGeometry(0.006, 0.012, 0.09), dark, sx * 0.07, 0.145, 0.04); }"
assert s.count(A)==1
s=s.replace(A,"  aniMesh(head, aniSculpt(0.055, 0.022, 0.075, 12, 8), dark, 0, 0.185, 0.025);\n  aniMesh(head, aniSculpt(0.022, 0.008, 0.045, 8, 4), dark, 0, 0.122, 0.17);\n  for (const sx of [-1, 1]) { aniMesh(head, new THREE.SphereGeometry(0.014, 8, 6), eye, sx * 0.062, 0.15, 0.06); aniMesh(head, aniSculpt(0.004, 0.008, 0.06, 6, 4), dark, sx * 0.072, 0.15, 0.03); }")
open('s1.js','w').write(s)
