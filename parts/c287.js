/* GLX-C287 (v1.0.94): Packed snow - a full opaque white snow block (fine crunchy grain, slight blue shading) for the ice wall instead of
   the wool-looking block. Minable, placeable and in the Bag of Everything. */
(function c287() {
  const U = window.__c287 = {err: null, id: 0};
  try { let id = 255; /* v1.0.105: fixed at its historical id (the old scan would now land on a crystal slot) */ U.id = id; T.PACKSNOW = id;
    const S = 64, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); let s = 287; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    g.fillStyle = '#eef3f8'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 900; i++) { const x = (r() * S) | 0, y = (r() * S) | 0, v = r(); g.fillStyle = v < 0.45 ? 'rgba(170,190,215,.35)' : v < 0.8 ? 'rgba(255,255,255,.8)' : 'rgba(140,165,200,.3)'; g.fillRect(x, y, 1 + (r() * 2 | 0), 1); }
    for (let i = 0; i < 14; i++) { const x = (r() * S) | 0, y = (r() * S) | 0; g.fillStyle = 'rgba(150,175,210,.28)'; g.fillRect(x, y, 3 + (r() * 5 | 0), 2); }
    const gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(120,150,200,.12)'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
    TEX.packsnow = c.toDataURL('image/png'); FACES[id] = 'packsnow'; NAMES[id] = 'Packed snow'; ICON_KEY[id] = 'packsnow';
    HARD[id] = 1; MC_HARD[id] = 0.5; REQ[id] = 0; PLACEABLE.add(id); if (!ORDER.includes(id)) ORDER.push(id); if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(id);
    BLOCK_MATS[id] = mat('packsnow'); try { if (typeof SHOVEL_ON !== 'undefined') SHOVEL_ON.add(id); } catch (_) {}
  } catch (e) { U.err = String(e && e.stack || e).slice(0, 200); }
})();
