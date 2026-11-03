/* ===================== GLX-C137 (v1.0.18): HD models batch 3: night mobs (land / floating), skull wisps, droplets ===================== */
(function c137() {
  const U = window.__c135; if (!U || !U.add) return;
  // night-mob hit flash restores emissive from userData.e0
  U.post.push((a, c, M, m, hd, s, mats) => { for (const q of mats) if (q.emissive && !q.userData.e0) q.userData.e0 = q.emissive.clone(); });
  // lift: raise the model (world units) for floaters; keep(o) leaves chosen procedural parts (glows, hats, horns) showing
  U.post.push((a, c, M, m) => { if (c.lift) m.position.y += c.lift; });
  const glowy = o => !!(o.material && o.material.isMeshBasicMaterial && o.material.transparent);
  // the sheet ghosts share the ghost model, each in its own colour (see-through like the ghost)
  const sheet = (col, op) => ({f: 'ghost', mcol: {Ghost_Main: col}, op: op || 0.62});
  U.add({
    nm07: {f: 'yeti'},                                        // Snaw Brute
    nm15: {f: 'giant', pal: {'966f39': '8c8a7e', '705d40': '5e5c54'}},                       // Crag Gruff
    nm25: {f: 'frog', mcol: {Frog_Main: 0x6f8a4a, Frog_Secondary: 0xb8b088}},           // Puddock Gob
    nm18: {f: 'slime', mcol: {Body: 0x6f8a5a}, op: 0.88},      // Sludge Sooker
    nmdrop: {f: 'slime', mcol: {Body: 0x7f9a66}, op: 0.88},    // its droplets
    nmwisp: {f: 'skull', mcol: {Main: 0xd8ccae, Main_Light: 0xf0e8d0}, emis: 0x2a2418, lift: 0.45, keep: glowy},  // Skull Wisp
    nm03: {f: 'robot', mcol: {Main: 0x9aa3ab}},               // Govan Gearheid
    nm28: {f: 'hound', tint: 0x7a96e0, emis: 0x101c40},       // Comet Collie
    nm10: sheet(0xf2f2f2), nm20: sheet(0xd0d6dc, 0.5), nm29: sheet(0xe6eef2)   // Linen Ghaist, Mist Moaner, Greetin' Bairn
  });
})();
