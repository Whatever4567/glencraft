/* ===================== GLX-C187 (v1.0.35): crafting screen fix (landscape side-by-side grid + detail, no HUD text over menus), 3D iso icons for every block that had a flat
   or no icon, live icon refresh in an open crafting list, and craftable corner stairs (3 stairs -> 2 corner stairs, every stair material) ===================== */
(function c187() {
  const U = window.__c187 = {err: null, iso: 0, corners: 0, ref: 0, placed: 0};
  const warn = (w, e) => { U.err = w + ' ' + String(e && e.stack || e); console.warn('c187', w, e); };
  /* ---------- 1) crafting screen: the menuLayoutFix landscape grid was beaten by the inline display:flex set in buildCraftList ---------- */
  try { const st = document.createElement('style'); st.id = 'glx187';
    st.textContent = `@media (orientation:landscape) and (max-height:600px){#craft #recipes{display:grid!important}#recDetail .padhint{display:none}}
@media (orientation:portrait){#recDetail{max-height:34vh;overflow-y:auto}}
body.inmenu #tplHint,body.inmenu #itemName{visibility:hidden!important}`;
    document.head.appendChild(st); } catch (e) { warn('css', e); }
  /* ---------- 2) iso icon kit (same projection and shading as the HD block icons) ---------- */
  const cv = n => { const c = document.createElement('canvas'); c.width = c.height = n; return c; };
  const small = {}; const tex = key => { const s = typeof key === 'string' ? texImg[key] : key; if (!s || !s.width) return null; const k = typeof key === 'string' ? key : null; if (k && small[k] && small[k].s === s) return small[k].c;
    let c = s; while (c.width > 256) { const n = cv(c.width / 2), g = n.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, n.width, n.width); c = n; } if (k) small[k] = {s, c}; return c; };
  const ISO = 256, PJ = (x, y, z) => [ISO * (.5 + (x - z) * .44), ISO * (.04 + (x + z) * .22 + (1 - y) * .5)];
  function face(g, img, O, Ua, Va, u0, u1, v0, v1, dark) { const w = img.width, sx = u0 * w, sy = v0 * w, sw = Math.max(1, (u1 - u0) * w), sh = Math.max(1, (v1 - v0) * w);
    const path = () => { g.beginPath(); g.moveTo(O[0], O[1]); g.lineTo(Ua[0], Ua[1]); g.lineTo(Ua[0] + Va[0] - O[0], Ua[1] + Va[1] - O[1]); g.lineTo(Va[0], Va[1]); g.closePath(); };
    g.save(); path(); g.clip(); g.setTransform((Ua[0] - O[0]) / sw, (Ua[1] - O[1]) / sw, (Va[0] - O[0]) / sh, (Va[1] - O[1]) / sh, O[0], O[1]); g.drawImage(img, sx, sy, sw, sh, -.6, -.6, sw + 1.2, sh + 1.2); g.setTransform(1, 0, 0, 1, 0, 0);
    if (dark) { g.fillStyle = 'rgba(0,0,0,' + dark + ')'; g.fill(); } g.restore(); path(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(0,0,0,.35)'; g.stroke(); }
  function box(g, F, x0, y0, z0, x1, y1, z1) { const [top, front, right] = F;
    face(g, top, PJ(x0, y1, z0), PJ(x1, y1, z0), PJ(x0, y1, z1), x0, x1, z0, z1, 0);
    face(g, front, PJ(x0, y1, z1), PJ(x1, y1, z1), PJ(x0, y0, z1), x0, x1, 1 - y1, 1 - y0, .2);
    face(g, right, PJ(x1, y1, z1), PJ(x1, y1, z0), PJ(x1, y0, z1), 1 - z1, 1 - z0, 1 - y1, 1 - y0, .38);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.4; g.beginPath(); const a = PJ(x0, y1, z1), b = PJ(x1, y1, z1), c = PJ(x1, y1, z0); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.stroke(); }
  const SHAPES = {
    cube: [[0, 0, 0, 1, 1, 1]], slab: [[0, 0, 0, 1, .5, 1]], carpet: [[0, 0, 0, 1, .1, 1]], panel: [[0, 0, 0, 1, .14, 1]],
    stairs: [[0, 0, 0, 1, .5, 1], [0, .5, 0, 1, 1, .5]], corner: [[0, 0, 0, 1, .5, 1], [.5, .5, 0, 1, 1, .5]], inner: [[0, 0, 0, 1, .5, 1], [0, .5, 0, 1, 1, .5], [.5, .5, .5, 1, 1, 1]],
    pane: [[.06, 0, .44, .94, 1, .56]], board: [[.04, .06, .8, .96, .94, .92]],
    post: [[.4, 0, .4, .6, 1, .6]], lamp: [[.42, 0, .42, .58, .72, .58], [.28, .72, .28, .72, 1, .72]],
    rail: [[.05, 0, .44, .17, .95, .56], [.83, 0, .44, .95, .95, .56], [.05, .78, .46, .95, .88, .54], [.05, .38, .46, .95, .48, .54]]};
  function isoIcon(F, shape) { const c = cv(ISO), g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(ISO / 2, ISO * .93, ISO * .34, ISO * .06, 0, 0, 7); g.fill();
    for (const b of SHAPES[shape] || SHAPES.cube) box(g, F, ...b); return c.toDataURL(); }
  const facesOf = id => { let f = FACES[id]; if (!f) return null; if (!Array.isArray(f)) f = [f, f, f, f, f, f]; const t = tex(f[2]), fr = tex(f[4]), r = tex(f[0]); return t && fr && r ? [t, fr, r] : null; };
  const shapeOf = (id, n) => /inner corner stairs/.test(n) ? 'inner' : /corner stairs/.test(n) ? 'corner' : /carpet/.test(n) ? 'carpet' : /slab/.test(n) ? 'slab' : /panel/.test(n) ? 'panel' : /pane\b/.test(n) ? 'pane' : /stairs/.test(n) || (IS_STAIR[id] && id !== 145) ? 'stairs'
    : /painting/.test(n) ? 'board' : /lamp post/.test(n) ? 'post' : /street lamp|lantern/.test(n) ? 'lamp' : /railing/.test(n) ? 'rail' : 'cube';
  const SKIPN = /water|lava|portal|wheat|potato|neep|farmland|reed|fern|grass$|thistle|sapling|bluebell|daffodil|dandelion|marker|activator|torch|door|fence|gate|bed\b|cauldron|cobweb/i;
  const MINE = U.MINE = {};
  const setIc = (id, u) => { MINE[id] = u; try { const S = (window.__c122 && __c122.setIcon) || (window.__c121 && __c121.setIcon); if (S) S(id, u); else ICONS[id] = u; } catch (_) { ICONS[id] = u; } ICONS[id] = u; delete ICON_KEY[id]; try { delete spriteMats[id]; } catch (_) {} };
  /* ---------- 3) corner stairs: items 331+, each places its stair as a fixed outer corner (entMeta.q + qf, so auto-connect leaves it alone) ---------- */
  const CORN = U.CORN = {}, BV = [[0, -1], [-1, 0], [0, 1], [1, 0]], HALF = [3, 5, 12, 10], qbit = (sx, sz) => 1 << ((sx > 0 ? 1 : 0) + (sz > 0 ? 2 : 0));
  function addCorners() { let id = 331; const mats = Object.keys(STAIRS).map(Number).concat([601, 602, 603, 604, 605, 606].filter(i => NAMES[i]));
    for (const st of mats) { const n = NAMES[st]; if (!n || !/stairs/i.test(n)) continue; const cid = id++; if (NAMES[cid] && !CORN[cid]) continue;
      CORN[cid] = {st, w: st > 600 ? st - 600 : 0}; NAMES[cid] = n.replace(/stairs/i, 'corner stairs');
      if (!ORDER.includes(cid)) ORDER.push(cid); if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(cid)) CREATIVE_ALL.push(cid);
      try { if (FUEL && FUEL[st]) FUEL[cid] = FUEL[st]; } catch (_) {} U.corners++; }
    for (const k of Object.keys(CORN).map(Number)) { const C = CORN[k]; if (C.inn) continue; const cid = k + 13; if (NAMES[cid] && !CORN[cid]) continue;   // v1.0.36: inner corners 344+
      CORN[cid] = {st: C.st, w: C.w, inn: 1}; NAMES[cid] = NAMES[C.st].replace(/stairs/i, 'inner corner stairs');
      if (!ORDER.includes(cid)) ORDER.push(cid); if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(cid)) CREATIVE_ALL.push(cid);
      try { if (FUEL && FUEL[C.st]) FUEL[cid] = FUEL[C.st]; } catch (_) {} U.corners++; }
    recipes(); }
  function recipes() { let ch = 0; for (const k in CORN) { const cid = +k, st = CORN[k].st; if (RECIPES.some(r => r.out === cid)) continue;
      RECIPES.push(CORN[k].inn ? rc('3 ' + NAMES[cid], '4 ' + NAMES[st] + ' (a square)', cid, 3, [[st, 4]], 1) : rc('2 ' + NAMES[cid], '3 ' + NAMES[st] + ' (an L)', cid, 2, [[st, 3]], 1)); ch++; } return ch; }
  try { addCorners(); } catch (e) { warn('corners', e); }
  setInterval(() => { try { if (recipes()) { const g = $('recGrid'); if (g && typeof setCat === 'function' && typeof craftCat !== 'undefined') { const s = g.scrollTop; setCat(craftCat); $('recGrid').scrollTop = s; } } } catch (e) { warn('rec', e); } }, 2000);
  let cap = null;
  try { const sb = setB; setB = function (x, y, z, v) { const r = sb.apply(this, arguments); if (cap && v && IS_STAIR[v] && v !== 145) cap.push([x, y, z]); return r; }; } catch (e) { warn('setB', e); }
  try { const ui = useItem; useItem = function () { const v = selId, C = CORN[v];
      if (!C || menuOpen || paused || dead || !(MODE.infinite || cnt(v) > 0)) return ui.apply(this, arguments);
      let side = 1; try { const r0 = raycast(5, true); if (r0) { const d = lookDir(); side = { hx: P.x + d[0] * r0.t, hz: P.z + d[2] * r0.t }; } } catch (_) {}
      const t = C.st, save = inv[t]; inv[t] = MODE.infinite ? (save || 1) : 1; selId = t; cap = []; let r;
      try { r = ui.apply(this, arguments); } finally { const cells = cap; cap = null; if (save === undefined) delete inv[t]; else inv[t] = save; selId = v;
        if (cells.length) { if (!MODE.infinite) inv[v] = Math.max(0, cnt(v) - 1); try { corner(cells[cells.length - 1], side, C); U.placed++; } catch (e) { warn('corner', e); } }
        try { renderHotbar(); } catch (_) {} }
      return r; }; } catch (e) { warn('useItem', e); }
  function corner([x, y, z], hit, C) { const k = keyOf(x, y, z); let m = entMeta.get(k); if (!m) { m = {face: faceFromYaw()}; entMeta.set(k, m); }
    const f = (m.face | 0) & 3, [bx, bz] = BV[f], lx = -bz, lz = bx;
    let s = 1; if (hit && hit.hx !== undefined) { const d = (hit.hx - x - .5) * lx + (hit.hz - z - .5) * lz; s = d < 0 ? -1 : 1; }
    m.q = C && C.inn ? HALF[f] | qbit(-bx + s * lx, -bz + s * lz) : qbit(bx + s * lx, bz + s * lz); m.qf = 1; try { dirtyAround(x, z); } catch (_) {} }
  /* ---------- 4) icons: corners, the flat oak stairs and red pane, and every block still on a flat texture swatch ---------- */
  U.kit = () => ({isoIcon, facesOf, setIc, shapeOf, tex});
  function icons() { let n = 0; const wood = w => { try { const P = window.__c121 && __c121.PLC; return P && P[w] ? tex(P[w]) : null; } catch (_) { return null; } };
    const want = new Set([...ORDER, ...(typeof CREATIVE_ALL !== 'undefined' ? CREATIVE_ALL : []), ...Object.keys(CORN).map(Number)]);
    for (const id of want) { const nm = NAMES[id] || ''; if (!nm || MINE[id]) continue;
      let F = null, sh = null;
      if (CORN[id]) { const C = CORN[id]; const w = C.w && wood(C.w); F = w ? [w, w, w] : facesOf(STAIRS[C.st] ? STAIRS[C.st][0] : C.st); sh = C.inn ? 'inner' : 'corner'; }
      else if (id === 164) { F = facesOf(10); sh = 'stairs'; }
      else if (id === 700) { const gl = tex('glass'); if (gl) { const c = cv(gl.width), g = c.getContext('2d'); g.drawImage(gl, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(235,60,20,.7)'; g.fillRect(0, 0, c.width, c.width); const t2 = cv(gl.width), g2 = t2.getContext('2d'); g2.fillStyle = 'rgba(200,40,14,.55)'; g2.fillRect(0, 0, c.width, c.width); g2.drawImage(c, 0, 0); F = [t2, t2, t2]; } sh = 'pane'; }
      else if (!ICONS[id] && id < 256 && FACES[id] && !SKIPN.test(nm)) { F = facesOf(id); sh = shapeOf(id, nm.toLowerCase()); }
      if (!F) continue; try { setIc(id, isoIcon(F, sh)); n++; } catch (e) { warn('ic' + id, e); } }
    U.iso += n; return n; }
  let tries = 0; const go = () => { const ready = typeof texDone !== 'undefined' && texDone >= texTotal && texImg.stone && (!window.__c122 || __c122.ready || tries > 12);
    if (!ready && tries++ < 80) return setTimeout(go, 500); try { icons(); renderHotbar(); } catch (e) { warn('icons', e); } };
  setTimeout(go, 600);
  setInterval(() => { try { for (const id in MINE) if (ICONS[id] !== MINE[id]) { ICONS[id] = MINE[id]; delete ICON_KEY[id]; } } catch (_) {} }, 1500);
  /* ---------- 5) an open crafting list picks up icons painted after it was built (blank slots on a fresh start) ---------- */
  setInterval(() => { try { const g = document.getElementById('recGrid'); if (!g || !g.offsetParent) return;
      for (const b of g.children) { const d = b.firstChild, r = RECIPES[b._ri]; if (!d || !r) continue; const u = ICONS[r.out]; if (u && d._u !== u) { if (d._u !== undefined || !d.style.backgroundImage.includes(u.slice(0, 40))) { d.style.backgroundImage = 'url(' + u + ')'; U.ref++; } d._u = u; } } } catch (e) { warn('refresh', e); } }, 700);
})();
