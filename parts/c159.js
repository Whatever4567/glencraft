/* ===================== GLX-C159 (v1.0.27): HD bee - CC0 Quaternius bee (flying, bite, hit, death clips) dressed in Glencraft honeybee colours and fur grain ===================== */
(function c159() {
  const U = window.__c135; if (!U || !U.add) return;
  U.add({bee: {f: 'bee', k: 1.0, run: 0, gl: {p: 'fur', a: 0.6, m: {Wings: 'plain', Eyes: 'plain', Teeth: 'plain', Tongue: 'plain'}, col: {Main: 0xf2b42a, Main_2: 0x231a12, Wings: 0xd8eef2}}}});
  // see-through wings
  U.post.push((a, c, M, m) => { if (a.kind !== 'bee') return; m.traverse(o => { if (!o.isMesh) return; for (const x of [].concat(o.material)) if (x && x.name === 'Wings') { x.transparent = true; x.opacity = 0.6; x.depthWrite = false; } }); });
})();
