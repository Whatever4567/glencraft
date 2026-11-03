/* ===================== GLX-C221 (v1.0.47): Wisteria is its own wood. The purple tree (v1.0.45) now grows from a Wisteria log (smooth pale grey-lilac bark, twisting ridges)
   with Wisteria leaves (purple, hanging blossom); its wood makes Wisteria planks, stairs, corner + inner corner stairs, slab, door, fence, fence gate and boat (c121 WOODS w7).
   Ids 191/192/193 were the Backrooms blocks (that dimension was removed in v0.9.51 and its blocks never appear in the overworld). ===================== */
(function c221() {
  const U = window.__c221 = {err: null, ok: 0};
  const warn = (w, e) => { if (!U.err) U.err = w + ': ' + (e && e.message || e); try { console.warn('c221', w, e); } catch (_) {} };
  const LOG = 191, LEAF = 192, PL = 193;
  U.ids = {LOG, LEAF, PL};
  let sd = 4711; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const N = Math.min(512, (typeof TEXSIZE !== 'undefined' && TEXSIZE) || 256), u = N / 256;
  const cvs = () => { const c = document.createElement('canvas'); c.width = c.height = N; return c; };
  // bark: smooth pale grey-lilac with twisting vertical ridges and a few lenticels
  function bark() { const c = cvs(), g = c.getContext('2d'); sd = 191;
    g.fillStyle = '#a99aa9'; g.fillRect(0, 0, N, N);
    for (let i = 0; i < 900; i++) { const v = (rnd() - 0.5) * 26; g.fillStyle = `rgba(${170 + v | 0},${156 + v | 0},${172 + v | 0},.35)`; g.fillRect(rnd() * N, rnd() * N, 3 * u, 6 * u); }
    for (let k = 0; k < 11; k++) { const x0 = (k / 11) * 256 + rnd() * 10, ph = rnd() * 6, amp = 4 + rnd() * 6, dark = rnd() < 0.5;
      g.strokeStyle = dark ? 'rgba(92,76,98,.75)' : 'rgba(214,202,218,.6)'; g.lineWidth = (dark ? 3 : 2) * u; g.beginPath();
      for (let y = -8; y <= 264; y += 8) { const x = x0 + Math.sin(y / 38 + ph) * amp; if (y < 0) g.moveTo(x * u, y * u); else g.lineTo(x * u, y * u); } g.stroke(); }
    for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(120,104,124,.7)'; g.fillRect(rnd() * N, rnd() * N, 6 * u, 1.6 * u); }
    return c; }
  // cut end: creamy lilac wood with rings, grey-lilac bark rim
  function top() { const c = cvs(), g = c.getContext('2d'); sd = 1191;
    g.fillStyle = '#9c8c9e'; g.fillRect(0, 0, N, N); g.fillStyle = '#e6d4cc'; g.fillRect(14 * u, 14 * u, 228 * u, 228 * u);
    for (let r = 108; r > 4; r -= 9 + rnd() * 5) { g.strokeStyle = r % 2 ? 'rgba(160,128,128,.55)' : 'rgba(176,144,140,.4)'; g.lineWidth = 2.2 * u; g.beginPath(); g.arc(128 * u, 128 * u, r * u, 0, 7); g.stroke(); }
    g.fillStyle = '#b08a88'; g.beginPath(); g.arc(128 * u, 128 * u, 7 * u, 0, 7); g.fill(); return c; }
  // leaves: a few fresh green leaflets on top, purple blossom racemes hanging down (see-through gaps like the other leaves)
  function leaves() { const c = cvs(), g = c.getContext('2d'); sd = 2192;
    g.fillStyle = '#5a4080'; g.fillRect(0, 0, N, N); for (let i = 0; i < 160; i++) { g.fillStyle = rnd() < 0.5 ? '#3e5a2e' : '#6a4c94'; g.fillRect(rnd() * N, rnd() * N, 10 * u, 10 * u); }
    for (let i = 0; i < 70; i++) { const x = rnd() * 256, y = rnd() * 256; g.fillStyle = rnd() < 0.5 ? '#5f8a3a' : '#79a24a'; g.beginPath(); g.ellipse(x * u, y * u, 9 * u, 4 * u, rnd() * 3, 0, 7); g.fill(); }
    const PUR = ['#7d4fb8', '#9466cc', '#b08ade', '#caa8ec', '#6a3fa4'];
    for (let k = 0; k < 34; k++) { const x = rnd() * 256, y0 = rnd() * 220 - 20, len = 40 + rnd() * 50;
      for (let s = 0; s < len; s += 5) { const w = (1 - s / len) * 9 + 2, x1 = x + (rnd() - 0.5) * w * 1.6, y1 = y0 + s;
        g.fillStyle = PUR[(rnd() * PUR.length) | 0]; g.beginPath(); g.arc(((x1 % 256) + 256) % 256 * u, (y1 % 256) * u, (2.2 + rnd() * 2.2) * u, 0, 7); g.fill(); } }
    return c; }
  function texOf(canvas, like) { const t = new THREE.CanvasTexture(canvas); try { const L = like && like.map; if (L) { t.magFilter = L.magFilter; t.minFilter = L.minFilter; t.wrapS = L.wrapS; t.wrapT = L.wrapT; if (L.colorSpace) t.colorSpace = L.colorSpace; if (L.encoding !== undefined) t.encoding = L.encoding; t.anisotropy = L.anisotropy; t.generateMipmaps = L.generateMipmaps; } } catch (_) {} t.needsUpdate = true; return t; }
  function matLike(like, canvas) { const base = Array.isArray(like) ? like[0] : like; const m = base && base.clone ? base.clone() : new THREE.MeshLambertMaterial(); m.map = texOf(canvas, base); m.needsUpdate = true; return m; }
  function reg(key, canvas, m) { try { texImg[key] = canvas; texCache[key] = m.map; matCache[key] = m; } catch (_) {} }
  try {
    const L135 = BLOCK_MATS[135], sideLike = Array.isArray(L135) ? L135[0] : L135, topLike = Array.isArray(L135) ? L135[2] : L135;
    const cb = bark(), ct = top(), cl = leaves(), mb = matLike(sideLike, cb), mt = matLike(topLike, ct), ml = matLike(BLOCK_MATS[147], cl);
    reg('log_side_wisteria', cb, mb); reg('log_top_wisteria', ct, mt); reg('leaves_wisteria', cl, ml);
    // Wisteria log (works like the other logs: axe, fuel, charcoal, burns, placed along its axis)
    NAMES[LOG] = 'Wisteria log'; FACES[LOG] = ['log_side_wisteria', 'log_side_wisteria', 'log_top_wisteria', 'log_top_wisteria', 'log_side_wisteria', 'log_side_wisteria'];
    BLOCK_MATS[LOG] = [mb, mb, mt, mt, mb, mb]; ICON_KEY[LOG] = 'log_side_wisteria'; delete ICONS[LOG];
    HARD[LOG] = HARD[135]; MC_HARD[LOG] = MC_HARD[135]; if (REQ[135] !== undefined) REQ[LOG] = REQ[135]; else delete REQ[LOG];
    AXE_ON.add(LOG); FUEL[LOG] = FUEL[135] || 15; SMELT[LOG] = IT.CHARCOAL; FLAMMABLE.add(LOG); PLACEABLE.add(LOG); LOGGY[LOG] = 1; LEAFY[LOG] = 0;
    // Wisteria leaves (shears keep them, otherwise sticks now and then like other leaves - the game has no saplings)
    NAMES[LEAF] = 'Wisteria leaves'; FACES[LEAF] = 'leaves_wisteria'; BLOCK_MATS[LEAF] = ml; ICON_KEY[LEAF] = 'leaves_wisteria'; delete ICONS[LEAF];
    HARD[LEAF] = HARD[147]; MC_HARD[LEAF] = MC_HARD[147]; delete REQ[LEAF]; FLAMMABLE.add(LEAF); PLACEABLE.add(LEAF); LEAFY[LEAF] = 1; LOGGY[LEAF] = 0;
    for (const id of [LOG, LEAF]) { try { NEEDS_PICK.delete(id); } catch (_) {} try { if (typeof ENT !== 'undefined') ENT[id] = 0; } catch (_) {} try { if (window.__NAT) __NAT[id] = 1; } catch (_) {} }
    try { if (typeof SHEARS_ON !== 'undefined' && SHEARS_ON.has && SHEARS_ON.has(147)) SHEARS_ON.add(LEAF); } catch (_) {}
    try { if (typeof TRANSP !== 'undefined' && TRANSP[147]) TRANSP[LEAF] = TRANSP[147]; } catch (_) {}
    U.ok++;
  } catch (e) { warn('blocks', e); }
  // the bag + crafting lists: wisteria sits with the other woods (log after the other logs, leaves after the other leaves)
  function group() { try {
      const put = (arr, id, after) => { if (!arr) return; const i0 = arr.indexOf(id); if (i0 >= 0) arr.splice(i0, 1); let j = -1; for (const a of after) j = Math.max(j, arr.indexOf(a)); arr.splice(j >= 0 ? j + 1 : arr.length, 0, id); };
      for (const arr of [ORDER, typeof CREATIVE_ALL !== 'undefined' ? CREATIVE_ALL : null]) { put(arr, LOG, [135, 136, 137, 139, 143, 138]); put(arr, LEAF, [146, 147, 148, 149, 215, 240]); }
      for (const id of [194, 195, 196, 197, 198, 199]) for (const arr of [ORDER, typeof CREATIVE_ALL !== 'undefined' ? CREATIVE_ALL : null]) { if (!arr) continue; const i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); }
    } catch (e) { warn('group', e); } }
  group();
  // corner + inner corner stairs for wisteria (c187 numbers its corners from 331; wisteria gets 357/358)
  try { const C = window.__c187 && __c187.CORN; if (C && NAMES[607]) { const add = (cid, inn) => { if (NAMES[cid] && !C[cid]) return; C[cid] = inn ? {st: 607, w: 7, inn: 1} : {st: 607, w: 7};
        NAMES[cid] = inn ? 'Wisteria inner corner stairs' : 'Wisteria corner stairs'; for (const arr of [ORDER, typeof CREATIVE_ALL !== 'undefined' ? CREATIVE_ALL : null]) if (arr && !arr.includes(cid)) arr.push(cid);
        try { if (FUEL && FUEL[607]) FUEL[cid] = FUEL[607]; } catch (_) {} };
      add(357, 0); add(358, 1);
      if (!RECIPES.some(r => r.out === 357)) RECIPES.push(rc('2 Wisteria corner stairs', '3 Wisteria stairs (an L)', 357, 2, [[607, 3]], 1));
      if (!RECIPES.some(r => r.out === 358)) RECIPES.push(rc('3 Wisteria inner corner stairs', '4 Wisteria stairs (a square)', 358, 3, [[607, 4]], 1)); U.corners = 1; } } catch (e) { warn('corners', e); }
  // smart tool picker: logs + planks -> axe, leaves -> shears (it already keys on LOGGY / LEAFY and the planks names)
  setInterval(() => { try { if (LOGGY[LOG] !== 1) LOGGY[LOG] = 1; if (LEAFY[LEAF] !== 1) LEAFY[LEAF] = 1; } catch (_) {} }, 3000);
})();
