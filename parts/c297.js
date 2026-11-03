/* GLX-C297 (v1.0.104, reworked v1.0.105): Agartha crystal blocks and warm light.
   v1.0.105: the honey items (honeycomb, glass bottle, honey bottle) were the only block-range ids that could move, so they now live at 322-324
   and old saves are remapped on load (inventory, chests, furnaces, hotbar). Their old slots 245-247 are real crystal blocks (cyan, violet, white),
   opaque and self-lit through the block shader. The diamond and lazurite blocks no longer glow. Agartha keeps the 60% light floor and a golden haze. */
(function c297() {
  const U = window.__c297 = {err: null, ids: [], inA: false, remapped: 0, conv: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  let MAP = {}; const M105 = {245: 322, 246: 323, 247: 324}, M106 = {218: 325, 219: 326}; /* v1.0.106: brooch and quaich moved too, their slots are glow grass and glow plants */
  // crystal blocks
  try { const CR = [[245, 'crystal_cyan', 'Cyan crystal', ['#1f9fc4', '#7fe6ff', '#0d5f80'], 0x2aa8d0, 0.85], [246, 'crystal_violet', 'Violet crystal', ['#7a4ad8', '#c9a8ff', '#3e1f86'], 0x7a4ad8, 0.85], [247, 'crystal_white', 'White crystal', ['#dfe8f2', '#ffffff', '#9fb0c4'], 0xd8e4f0, 0.7]];
    for (const [id, key, name, [b, hi, lo], em, k] of CR) {
      const S = 64, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); let s = id * 97; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
      g.fillStyle = b; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 9; i++) { const x = r() * S, y = r() * S, w = 6 + r() * 14, h = 14 + r() * 26; g.fillStyle = r() < 0.5 ? hi : lo; g.globalAlpha = 0.35 + r() * 0.3; g.beginPath(); g.moveTo(x, y - h / 2); g.lineTo(x + w / 2, y); g.lineTo(x, y + h / 2); g.lineTo(x - w / 2, y); g.closePath(); g.fill(); }
      g.globalAlpha = 0.8; g.fillStyle = '#ffffff'; for (let i = 0; i < 26; i++) g.fillRect((r() * S) | 0, (r() * S) | 0, 1, 1); g.globalAlpha = 1;
      g.strokeStyle = lo; g.lineWidth = 2; g.strokeRect(1, 1, S - 2, S - 2);
      TEX[key] = c.toDataURL('image/png'); FACES[id] = key; NAMES[id] = name; ICON_KEY[id] = key;
      HARD[id] = 2; MC_HARD[id] = 1.5; REQ[id] = 0; PLACEABLE.add(id); if (!ORDER.includes(id)) ORDER.push(id); if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(id)) CREATIVE_ALL.push(id);
      BLOCK_MATS[id] = mat(key); [].concat(BLOCK_MATS[id]).forEach(m => { if (!m) return; m.emissive = new THREE.Color(em); m.emissiveIntensity = k; m.needsUpdate = true; });
      try { delete ICONS[id]; } catch (_) {} U.ids.push(id); }
    T.CRYCYAN = 245; T.CRYVIOLET = 246; T.CRYWHITE = 247; } catch (e) { ERR('blocks', e); }
  // diamond (shares its id with packed snow) and lazurite blocks: plain, not glowing
  try { for (const id of [T.DIAMONDBLOCK, T.LAZBLOCK]) if (id !== undefined) [].concat(BLOCK_MATS[id]).forEach(m => { if (m && m.emissive) { m.emissive.setHex(0); m.emissiveIntensity = 0; m.needsUpdate = true; } }); } catch (e) { ERR('plain', e); }
  // old saves: honey items move to their new ids (only saves written before v1.0.105, flagged ids105 after)
  const rmArr = v => { if (Array.isArray(v)) { if (v.length >= 2 && typeof v[0] === 'number' && typeof v[1] === 'number' && MAP[v[0]]) { v[0] = MAP[v[0]]; U.remapped++; } else v.forEach(rmArr); } else if (v && typeof v === 'object') { for (const k in v) { if (k === 'id' && MAP[v[k]]) { v[k] = MAP[v[k]]; U.remapped++; } else rmArr(v[k]); } } };
  try { const ap = applySave; applySave = function (d) { try { MAP = Object.assign({}, d && !d.ids105 ? M105 : {}, d && !d.ids106 ? M106 : {}); if (d && Object.keys(MAP).length) { if (d.inv) for (const k in MAP) if (d.inv[k]) { d.inv[MAP[k]] = (d.inv[MAP[k]] || 0) + d.inv[k]; delete d.inv[k]; U.remapped++; }
        for (const f of ['chests', 'furnaces', 'offhand', 'off']) if (d[f]) rmArr(d[f]); if (Array.isArray(d.hotbar)) d.hotbar = d.hotbar.map(i => MAP[i] ? (U.remapped++, MAP[i]) : i); } } catch (e) { ERR('remap', e); } const r = ap.apply(this, arguments); try { if (!DIM.cur) { const L = window.__c294 && __c294.L; if (L && d && ((d.c294 && d.c294.cry105) || d.ids105 || d.c294 && d.c294.v === 2)) L.cry105 = 1; convert(); } } catch (e) { ERR('cv', e); } return r; };
    const se = serialize; serialize = function () { const o = se.apply(this, arguments); try { if (o && typeof o === 'object') o.ids105 = 1; o.ids106 = 1; } catch (_) {} return o; }; } catch (e) { ERR('wrap', e); }
  // existing Agartha spires: diamond (packed snow id) and lazurite blocks inside the saved spire columns become crystals
  function convert() { try { const L = window.__c294 && __c294.L; if (!L || !L.spires || L.cry105) return; let n = 0;
      for (const s of L.spires) { const sx = s[0], sz = s[1], sh = s[2] || 24, R = (s[3] || 4) + 1;
        for (let x = sx - R; x <= sx + R; x++) for (let z = sz - R; z <= sz + R; z++) { if (x < 0 || z < 0 || x >= W || z >= D) continue;
          for (let y = (L.FL || 7); y < Math.min(H, (L.FL || 7) + sh); y++) { const i = idx(x, y, z), b = world[i];
            if (b === T.DIAMONDBLOCK) { world[i] = 245; n++; } else if (b === T.LAZBLOCK) { world[i] = 246; n++; } } } }
      L.cry105 = 1; U.conv = n; if (n) dirtyAll = true; } catch (e) { ERR('conv', e); } }
  let fresh = false; try { const ew = enterWorld; enterWorld = function (save) { fresh = !save; return ew.apply(this, arguments); }; } catch (e) { ERR('ew', e); }
  setInterval(() => { try { const L = window.__c294 && __c294.L; if (fresh && started && L && !L.cry105) L.cry105 = 1; } catch (_) {} }, 2000);
  // Agartha light and golden haze
  const inA = () => { const l = window.__c294 && __c294.L; if (!l || (DIM.cur && DIM.cur !== 'agartha') || !started) return false; const [X, Z, R] = l.city;
    if (Math.hypot(P.x - X, P.z - Z) < R + 4 && P.y < l.TOP + 1) return true; if (P.y > (l.v === 2 ? 64 : 34)) return false;
    for (const p of l.pts || []) { if (l.v === 2) { if (Math.abs(P.x - p[0]) < 36 && Math.abs(P.z - p[1]) < 36 && Math.abs(P.y - p[2]) < 16) return true; } else if (Math.abs(P.x - p[0]) < 28 && Math.abs(P.z - p[1]) < 28) return true; } return false; };
  let fs = null; const GOLD = new THREE.Color(0xf2c46a);
  (function loop() { requestAnimationFrame(loop); try { const a = inA(); U.inA = a; const LM = window.__lminU;
      if (LM && !LM.__c297) { const d = Object.getOwnPropertyDescriptor(LM, 'value'); if (d && d.get && LM.__c163) { Object.defineProperty(LM, 'value', {configurable: true, enumerable: true, get() { const v = d.get.call(LM); return Math.max(v, U.inA ? 0.6 : 0.3); }, set(v) { d.set.call(LM, v); }}); LM.__c297 = true; } }
      if (a && scene.fog && !fs) fs = {c: scene.fog.color.getHex()};
      if (!a && fs) { try { scene.fog.color.setHex(fs.c); } catch (_) {} fs = null; } } catch (e) { ERR('loop', e); } })();
  // the haze colour is set right before each frame so the sky and weather code cannot grey it again
  try { const rr = renderer.render; renderer.render = function (sc, cam) { try { if (U.inA && sc === scene && scene.fog) { scene.fog.color.copy(GOLD); U.fog = scene.fog.color.getHexString(); } } catch (_) {} return rr.apply(this, arguments); }; } catch (e) { ERR('render', e); }
})();
