/* ===================== GLX-C140 (v1.0.20): per-mob Glencraft styling for the HD models (pattern per material + original colour identity) ===================== */
(function c140() {
  const U = window.__c135; if (!U || !U.glStyle) return;
  // gl: p = default pattern, m = {material-name regex: pattern}, col = {material name: hex} (colour identity of the old procedural mob)
  const S = {
    zombie: {p: 'skin', sw: {'74861c': '7f9a76', '7d2647': '3e4436', '62357d': '3a302a'}},   // grey-green skin, dark hair and rags, dark breeks
    skeleton: {p: 'bone', col: {Skeleton: 0xdcd8cc}}, blackskel: {p: 'bone'}, blazeskel: {p: 'bone'},
    spider: {p: 'fur'}, nspider: {p: 'fur'},
    hound: {p: 'fur'},
    sheep: {p: 'wool', m: {skin: 'skin', face: 'skin', leg: 'skin'}},
    clansman: {p: 'cloth', m: {skin: 'skin', hair: 'fur', boots: 'skin'}, col: {Shirt: 0x2a2a30, UnderShirt: 0xe6e2d8, Detail: 0xc9a640, Boots: 0x221c18, Hair: 0x2a2018}},   // black jacket, white shirt, gold buttons
    pig: {p: 'skin'},
    duck: {p: 'feather'},
    haggis: {p: 'fur'},
    imp: {p: 'skin'},
    ghost: {p: 'cloth'},
    dragon: {p: 'scales'},
    nm07: {p: 'fur', sw: {'408ead': 'e6e6ea', 'a7a392': '6e7286'}},   // white fur, slate face
    nm15: {p: 'rock'}, nm25: {p: 'skin', col: {Frog_Main: 0x4f5e44, Frog_Secondary: 0x6a7060}}, nm18: {p: 'slime'}, nmdrop: {p: 'slime'}, nmwisp: {p: 'bone'},
    nm03: {p: 'metal', col: {Main: 0xc23a30, Grey: 0xd8d8dc}},   // red and white tin robot
    nm28: {p: 'stars', b: 1.6},   // night-sky coat with star specks
    nm10: {p: 'cloth'}, nm20: {p: 'cloth'}, nm29: {p: 'cloth'},
    nmunicorn: {p: 'fur', a: 0.5, b: 1.16}   // pearly white: gentler grain
  };
  for (const k in S) if (U.cat[k]) U.cat[k].gl = S[k];
  if (U.cat.nm28) { U.cat.nm28.tint = 0xffffff; U.cat.nm28.emis = 0x0a1028; }   // the stars carry the colour now
  U.post.push((a, c, M, m, hd, s, mats) => { try { U.glStyle(a, c, m, hd, mats); } catch (e) { U.err.push('gl ' + e); } });
})();
