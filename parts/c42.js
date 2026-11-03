/* ===================== GLX-C42 (v0.9.43): creepers - classic shape + mottled hi-res skin, quiet hiss, fuse only when hit; silver bullets as gun ammo ===================== */
IT.SILVERSHOT = 231; NAMES[231] = 'Silver bullets';
function ammoCount() { return (inv[IT.SILVERSHOT] || 0) + (inv[IT.CARTRIDGE] || 0); }
function ammoPick() { return (inv[IT.SILVERSHOT] || 0) > 0 ? IT.SILVERSHOT : IT.CARTRIDGE; }
(function c42() {
  ICONS[231] = drawIcon(g => { for (const [x, y] of [[-8, 4], [0, -2], [8, 4]]) { g.fillStyle = '#b8862e'; g.fillRect(x - 4, y, 8, 12); g.fillStyle = '#e4e8ee'; g.beginPath(); g.arc(x, y, 4, Math.PI, 0); g.fill(); g.fillStyle = '#9aa2ac'; g.fillRect(x - 4, y + 10, 8, 2); } });
  if (!ORDER.includes(231)) ORDER.push(231); if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(231);
  RECIPES.push(rc('Silver bullets (x8)', '1 Silver ingot + 1 Gunpowder', 231, 8, [[IT.SILVERINGOT, 1], [IT.GUNPOWDER, 1]], 1));
  // creeper: fuse starts only when hit
  const dm = damageMob; damageMob = function (a, dmg, byPlayer) { const r = dm.apply(this, arguments); if (a && a.kind === 'creeper' && a.hp > 0) a.lit = true; return r; };
  // classic creeper: tall body, head, four short legs, no arms, mottled green skin + face (512 px)
  const cv = f => { const c = document.createElement('canvas'); c.width = c.height = 1024; { const g2 = c.getContext('2d'); g2.scale(2, 2); f(g2); } const t = new THREE.CanvasTexture(c); t.anisotropy = 8; if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const skinPx = g => { const P = ['#8f0f12', '#b8302c', '#d1504a', '#6e1a18', '#e07a70', '#a42c28', '#c6b6b4']; for (let y = 0; y < 512; y += 32) for (let x = 0; x < 512; x += 32) { g.fillStyle = P[(Math.random() * (Math.random() < .06 ? 7 : 6)) | 0]; g.fillRect(x, y, 32, 32);
      for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(' + (Math.random() < .5 ? '40,0,0' : '255,200,190') + ',' + (Math.random() * .18) + ')'; g.fillRect(x + Math.random() * 30, y + Math.random() * 30, 3, 3); } } };
  const skinT = cv(skinPx);
  const faceT = cv(g => { skinPx(g); g.fillStyle = '#0b0b0b'; g.fillRect(96, 128, 112, 112); g.fillRect(304, 128, 112, 112); g.fillRect(208, 240, 96, 128); g.fillRect(144, 304, 64, 144); g.fillRect(304, 304, 64, 144); g.fillStyle = '#1a1a1a'; g.fillRect(208, 368, 96, 32); });
  makeCreeper = function () {
    const g = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({map: skinT}), face = new THREE.MeshLambertMaterial({map: faceT});
    const head = new THREE.Mesh(roundBox(0.5, 0.5, 0.5), [skin, skin, skin, skin, face, skin]); head.position.y = 1.37; g.add(head);
    const body = new THREE.Mesh(roundBox(0.5, 0.78, 0.26), skin); body.position.y = 0.73; g.add(body);
    const legs = [[-0.13, 0.13], [0.13, 0.13], [0.13, -0.13], [-0.13, -0.13]].map(([x, z]) => limb(g, 0.24, 0.34, 0.24, skin, x, 0.34, z));
    return {g, legs, arms: [], mats: [skin, face], head, speed: 1.25, hp: 5, hitY: 0.9, hitR: 0.55, hostile: true, tall: 2};
  };
})();
