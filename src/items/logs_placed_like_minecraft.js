/* ===================== GLX-C148 (v1.0.24): logs placed like Minecraft - upright, or lying along X / Z by the face you click (kept in block data, saved);
   natural wood shades - every plank colour matches its own log's cut end ===================== */
(function c148() {
  const U = window.__c148 = {err: null, st: {fix: 0, quads: 0, placed: 0, wood: 0}};
  // ---------- 1) orientation: entMeta {ax: 1} = lying along X, {ax: 2} = lying along Z (no ax = upright, like every worldgen tree) ----------
  const AX = new Map(), BYC = new Map();
  const cidOf = (x, z) => Math.floor(x / CH) * 64 + Math.floor(z / CH);
  function track(k, ax) { const p = k.split(','), x = +p[0], z = +p[2], c = cidOf(x, z); let s = BYC.get(c);
    if (ax) { AX.set(k, ax); if (!s) BYC.set(c, s = new Set()); s.add(k); } else { AX.delete(k); if (s) { s.delete(k); if (!s.size) BYC.delete(c); } } }
  function sync() { AX.clear(); BYC.clear(); try { for (const [k, m] of entMeta) if (m && (m.ax === 1 || m.ax === 2)) track(k, m.ax); } catch (_) {} U.n = AX.size; }
  U.sync = sync; U.AX = AX;
  function setAx(x, y, z, ax) { const k = keyOf(x, y, z), m = entMeta.get(k);
    if (ax) { const o = m || {}; o.ax = ax; entMeta.set(k, o); track(k, ax); }
    else if (m && m.ax) { delete m.ax; if (!Object.keys(m).length) entMeta.delete(k); track(k, 0); } }
  U.setAx = setAx;
  U.axAt = (x, y, z) => { const m = entMeta.get(keyOf(x, y, z)); return m && m.ax || 0; };
  // a cell that stops being a log forgets its direction
  let cap = null;
  const sb = setB; setB = function (x, y, z, v) { const r = sb.apply(this, arguments);
    try { if (cap && LOGGY[v]) cap.push([x, y, z]); else if (AX.size && !LOGGY[v]) { const k = keyOf(x, y, z); if (AX.has(k)) setAx(x, y, z, 0); } } catch (_) {}
    return r; };
  // placing: the clicked face decides (side of a block -> lies pointing at that face, top / bottom -> upright); no block hit -> where you look
  const ui = useItem; useItem = function () {
    let r0 = null; try { r0 = raycast(5, true); } catch (_) {}
    const mine = []; const was = cap; cap = mine; let out;
    try { out = ui.apply(this, arguments); } finally { cap = was; }
    try { for (const [x, y, z] of mine) { if (!LOGGY[getB(x, y, z)]) continue; let ax = 0;
        if (r0 && r0.hit && r0.prev) { const dx = r0.prev[0] - r0.hit[0], dy = r0.prev[1] - r0.hit[1], dz = r0.prev[2] - r0.hit[2]; ax = dy ? 0 : dx ? 1 : dz ? 2 : 0; }
        else { const d = lookDir(); if (Math.abs(d[1]) < 0.55) ax = Math.abs(d[0]) > Math.abs(d[2]) ? 1 : 2; }
        setAx(x, y, z, ax); U.st.placed++; dirtyAround(x, z); } } catch (e) { U.err = 'place ' + e.message; }
    return out; };
  // saves already carry entMeta: re-read the directions whenever a world is entered / loaded
  let lastN = -1; const resync = () => { lastN = entMeta.size; sync(); try { for (const c of BYC.keys()) dirtyCh.add(c); } catch (_) {} };
  const ew = enterWorld; enterWorld = function () { const r = ew.apply(this, arguments); try { resync(); } catch (_) {} return r; };
  setInterval(() => { try { if (entMeta.size !== lastN) resync(); } catch (_) {} }, 3000);
  // ---------- meshing: re-texture the faces of lying logs (cut end on the two ends, bark along the length, grain turned) ----------
  const DF = (nx, ny, nz) => nx > 0.5 ? 0 : nx < -0.5 ? 1 : ny > 0.5 ? 2 : ny < -0.5 ? 3 : nz > 0.5 ? 4 : 5;
  // which of the upright faces' textures a face uses (0 bark, 2 cut end) and whether the bark grain turns
  const SRC = (ax, d) => ax === 1 ? (d < 2 ? [2, 0] : [0, 1]) : (d > 3 ? [2, 0] : d < 2 ? [0, 1] : [0, 0]);
  function fix(cx, cz) {
    const id = cx * 64 + cz, S = BYC.get(id), grp = chunkObjs.get(id); if (!S || !S.size || !grp) return;
    const cell = new Map(); for (const k of S) { const p = k.split(','), x = +p[0], y = +p[1], z = +p[2], b = getB(x, y, z); if (LOGGY[b]) cell.set((x * H + y) * D + z, [AX.get(k), b]); }
    if (!cell.size) return; U.st.fix++;
    const TAx = window.__TA && __TA.on ? __TA : null;
    for (const m of grp.children) { if (!m.isMesh || m.isInstancedMesh || !m.geometry) continue; const g = m.geometry, P = g.attributes.position, N = g.attributes.normal, UV = g.attributes.uv; if (!P || !N || !UV || P.count % 4) continue;
      const merged = !!(m.userData.merged && g.attributes.lay), multi = !merged && Array.isArray(m.material) && Object.keys(BLOCK_MATS).some(k => LOGGY[k] && BLOCK_MATS[k] === m.material);
      if (!merged && !multi) continue;
      const pa = P.array, na = N.array, ua = UV.array, nq = P.count / 4, LA = merged ? g.attributes.lay : null;
      let dq = null; if (multi) { dq = new Uint8Array(nq); for (const gr of g.groups) for (let f = gr.start / 6; f < (gr.start + gr.count) / 6; f++) dq[f] = gr.materialIndex; }
      let ch = false;
      for (let f = 0; f < nq; f++) { const o = f * 12, nx = na[o], ny = na[o + 1], nz = na[o + 2];
        const cxm = (pa[o] + pa[o + 3] + pa[o + 6] + pa[o + 9]) / 4 - nx * 0.5, cym = (pa[o + 1] + pa[o + 4] + pa[o + 7] + pa[o + 10]) / 4 - ny * 0.5, czm = (pa[o + 2] + pa[o + 5] + pa[o + 8] + pa[o + 11]) / 4 - nz * 0.5;
        const e = cell.get((Math.floor(cxm) * H + Math.floor(cym)) * D + Math.floor(czm)); if (!e) continue;
        const d = DF(nx, ny, nz), [src, turn] = SRC(e[0], d);
        if (merged) { const L = TAx && TAx.layers(e[1]); if (!L) continue; for (let v = 0; v < 4; v++) LA.array[f * 4 + v] = L[src]; }
        else dq[f] = src;
        if (turn) for (let v = 0; v < 4; v++) { const q = (f * 4 + v) * 2, t = ua[q]; ua[q] = ua[q + 1]; ua[q + 1] = t; }
        ch = true; U.st.quads++; }
      if (!ch) continue;
      UV.needsUpdate = true; if (LA) LA.needsUpdate = true;
      if (multi) { const idx = [], gs = []; for (let mi = 0; mi < 6; mi++) { const s0 = idx.length; for (let f = 0; f < nq; f++) if (dq[f] === mi) { const b4 = f * 4; idx.push(b4, b4 + 1, b4 + 2, b4, b4 + 2, b4 + 3); } if (idx.length > s0) gs.push([s0, idx.length - s0, mi]); }
        g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1)); g.clearGroups(); for (const [s0, n, mi] of gs) g.addGroup(s0, n, mi); } } }
  const bc = buildChunk; buildChunk = function (cx, cz) { const r = bc.apply(this, arguments); try { if (entMeta.size !== lastN) { lastN = entMeta.size; sync(); } if (AX.size) fix(cx, cz); } catch (e) { U.err = 'mesh ' + e.message; } return r; };
  // ---------- 2) wood shades: each wood gets one natural shade, and its planks are recoloured to the very same shade as the log's cut end ----------
  const SHADE = {0: '#b48c56', 1: '#d0a26a', 2: '#e2d1aa', 3: '#c3936a', 4: '#c4834f', 5: '#b2663c'};   // oak, Scots pine, silver birch, rowan, alder, yew
  const LOGS = {0: T.LOG, 1: 135, 2: 136, 3: 137, 4: 139, 5: 143};
  const done = new WeakSet(); const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  function recolour(m, tgt) { const t = m && m.map, im = t && t.image; if (!im || done.has(im)) return 0; const w = im.width || im.videoWidth, h = im.height || im.videoHeight; if (!(w > 8 && h > 8) || im.complete === false) return 0;
    const own = im.getContext && !(im instanceof HTMLImageElement); const c = own ? im : document.createElement('canvas'); if (!own) { c.width = w; c.height = h; }
    const g = c.getContext('2d'); if (!own) g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, w, h), p = d.data; let r = 0, gg = 0, b = 0, n = 0;
    for (let i = 0; i < p.length; i += 16) if (p[i + 3] > 200) { r += p[i]; gg += p[i + 1]; b += p[i + 2]; n++; } if (!n) return 0;
    const T3 = hex(tgt), k = [T3[0] / (r / n), T3[1] / (gg / n), T3[2] / (b / n)];
    for (let i = 0; i < p.length; i += 4) { p[i] = Math.min(255, p[i] * k[0]); p[i + 1] = Math.min(255, p[i + 1] * k[1]); p[i + 2] = Math.min(255, p[i + 2] * k[2]); }
    g.putImageData(d, 0, 0); done.add(c); if (!own) { t.image = c; } t.needsUpdate = true; U.st.wood++; return 1; }
  function plankMats(w) { const out = new Set(); try { const C = window.__c121; if (C && C.PLMAT && C.PLMAT[w]) [].concat(C.PLMAT[w]).forEach(m => out.add(m));
      const pl = w ? C && C.WOODS && C.WOODS[w] && C.WOODS[w].pl : 10; if (pl && BLOCK_MATS[pl]) [].concat(BLOCK_MATS[pl]).forEach(m => out.add(m)); } catch (_) {} return out; }
  function woodPass() { try { if (window.__noWood24) return; for (const w in SHADE) { const lm = BLOCK_MATS[LOGS[w]]; if (Array.isArray(lm)) { recolour(lm[2], SHADE[w]); if (lm[3] !== lm[2]) recolour(lm[3], SHADE[w]); }
      for (const m of plankMats(+w)) recolour(m, SHADE[w]); } } catch (e) { U.err = 'wood ' + e.message; } }
  U.woodPass = woodPass; U.SHADE = SHADE;
  let wn = 0; const wt = () => { woodPass(); wn++; setTimeout(wt, wn < 40 ? 1500 : 6000); }; setTimeout(wt, 800);
})();
