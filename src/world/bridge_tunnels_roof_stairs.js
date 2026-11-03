/* ===================== GLX-C171 (v1.0.33): bridge tunnels (no roof stairs or roof lamps, wall lanterns, corner stairs on the ramps, daylight stays day inside),
   corner stairs (inner + outer, auto-connect like Minecraft), lamps no longer make the block they touch see-through ===================== */
(function c171() {
  const U = window.__c171 = {err: null, up: 0, fixed: {roof: 0, lamp: 0, ramp: 0, sconce: 0}, ms: 0};
  const warn = (w, e) => { U.err = w + ' ' + String(e && e.stack || e); console.warn('c171', w, e); };
  const LAMP = 161, LPOST = 160;
  // ---------- 1) lamps / lamp posts are drawn as small models, so the blocks touching them must keep their faces ----------
  let stFix = 0;
  setInterval(() => { try { if (!chunkST) return; let ch = 0;
      for (const b of [LAMP, LPOST]) if (chunkST[b] !== 1) { chunkST[b] = 1; ch = 1; }
      if (ch && stFix++ < 3 && typeof dirtyAll !== 'undefined') { dirtyAll = true; } } catch (e) { warn('st', e); } }, 250);

  // ---------- 2) corner stairs: entMeta.q = which top quarters are raised (bit0 -x-z, bit1 +x-z, bit2 -x+z, bit3 +x+z) ----------
  const HALF = [3, 5, 12, 10];            // face 0..3 back half as quarters
  const BV = [[0, -1], [-1, 0], [0, 1], [1, 0]];   // back direction of each face
  const qbit = (sx, sz) => 1 << ((sx > 0 ? 1 : 0) + (sz > 0 ? 2 : 0));
  window.__stQ = function (x, y, z) { const m = entMeta.get(keyOf(x, y, z)); return m && m.q > 0 && m.q < 15 ? m.q : 0; };
  try { const sh = shapeHit; shapeHit = function (b, x, y, z, px, py, pz) {
      if (IS_STAIR[b] && b !== 145) { const q = __stQ(x, y, z); if (q) { if (py - y < 0.5) return true; return !!(q & qbit(px - x - 0.5, pz - z - 0.5)); } }
      return sh.apply(this, arguments); }; } catch (e) { warn('hit', e); }
  const isSt = b => b && IS_STAIR[b] && b !== 145;
  const faceAt = (x, y, z) => { const m = entMeta.get(keyOf(x, y, z)); return m ? (m.face | 0) & 3 : 0; };
  function connect(x, y, z) {   // Minecraft rule: a perpendicular stair behind = outer corner, in front = inner corner
    const k = keyOf(x, y, z), m = entMeta.get(k); if (!m || m.qf) return false;
    const f = (m.face | 0) & 3, [bx, bz] = BV[f]; let q = 0;
    const gb = getB(x + bx, y, z + bz), gf = getB(x - bx, y, z - bz);
    if (isSt(gb)) { const f2 = faceAt(x + bx, y, z + bz), [cx, cz] = BV[f2]; if (cx * bx + cz * bz === 0) q = qbit(bx + cx, bz + cz); }
    if (!q && isSt(gf)) { const f2 = faceAt(x - bx, y, z - bz), [cx, cz] = BV[f2]; if (cx * bx + cz * bz === 0) q = HALF[f] | qbit(-bx + cx, -bz + cz); }
    if ((m.q || 0) === q) return false; if (q) m.q = q; else delete m.q; return true; }
  function relink(x, y, z) { let ch = false;
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (isSt(getB(x + dx, y, z + dz))) ch = connect(x + dx, y, z + dz) || ch;
    if (ch) try { dirtyAround(x, z); } catch (_) {} }
  U.relink = relink;
  try { const sb = setB; setB = function (x, y, z, v) { const old = getB(x, y, z), r = sb.apply(this, arguments);
      if (!window.__c171gen && (isSt(v) || isSt(old))) setTimeout(() => { try { relink(x, y, z); } catch (e) { warn('relink', e); } }, 0);
      return r; }; } catch (e) { warn('setB', e); }

  // ---------- 3) bridge tunnels: tidy pass for new and existing worlds (natural blocks only) ----------
  const mine = i => typeof placedSet !== 'undefined' && placedSet && placedSet.has(i);
  const inb = (x, y, z) => x > 0 && z > 0 && x < W - 1 && z < D - 1 && y > 0 && y < H - 1;
  const get = (x, y, z) => inb(x, y, z) ? world[idx(x, y, z)] : 0;
  const put = (x, y, z, b) => { if (!inb(x, y, z)) return false; const i = idx(x, y, z); if (mine(i)) return false; world[i] = b; return true; };
  const full = b => b && !IS_STAIR[b] && !ENT[b] && b !== T.WATER && b !== T.LAVA && PLANT[b] !== 1 && !LEAFY[b] && b !== T.TORCH && b !== T.COBWEB;
  function lining(x, y, z) { const c = {}; let best = 0, bn = 0;
    for (const [dx, dy, dz] of [[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [1, 1, 0], [-1, 1, 0], [0, 1, 1], [0, 1, -1]]) { const b = get(x + dx, y + dy, z + dz); if (full(b)) { c[b] = (c[b] || 0) + 1; if (c[b] > bn) { bn = c[b]; best = b; } } }
    return best || T.STONEBRICK; }
  const roofy = (x, y, z) => !get(x, y - 1, z) && !get(x, y - 2, z) && !get(x, y - 3, z) && (full(get(x, y - 4, z)) || (!get(x, y - 4, z) && full(get(x, y - 5, z))));
  function tidy(br) { const t0 = performance.now(), DK = SEA + 4, chunks = new Set();
    for (const b of br || []) { if (!b || !b.a) continue; const [ax, az, ux, uz, ta, tb] = b.a, nx = -uz, nz = ux;
      const x0 = Math.floor(Math.min(ax + ux * ta, ax + ux * tb)) - 6, x1 = Math.ceil(Math.max(ax + ux * ta, ax + ux * tb)) + 6, z0 = Math.floor(Math.min(az + uz * ta, az + uz * tb)) - 6, z1 = Math.ceil(Math.max(az + uz * ta, az + uz * tb)) + 6;
      const ramps = [];
      for (let x = Math.max(1, x0); x <= Math.min(W - 2, x1); x++) for (let z = Math.max(1, z0); z <= Math.min(D - 2, z1); z++) {
        const px = x + 0.5 - ax, pz = z + 0.5 - az, t = px * ux + pz * uz, ap = Math.abs(px * nx + pz * nz); if (t < ta - 8 || t > tb + 8 || ap > 4.2) continue;
        for (let y = Math.max(2, SEA - 6); y <= Math.min(H - 3, DK + 22); y++) { const v = world[idx(x, y, z)]; if (!v) continue; const i = idx(x, y, z); if (mine(i)) continue;
          const below = get(x, y - 1, z), above = get(x, y + 1, z);
          if (isSt(v) && !below && y > DK - 8 && roofy(x, y, z)) {   // a stair hanging under a roof or capping a mouth
            if (put(x, y, z, full(above) ? above : lining(x, y, z))) { entMeta.delete(keyOf(x, y, z)); U.fixed.roof++; chunks.add(Math.floor(x / CH) + ',' + Math.floor(z / CH)); } continue; }
          if (v === LAMP && !below && full(above) && ap < 1.6 && roofy(x, y, z)) {   // a roof lamp: the roof closes, a lantern goes on each wall instead
            if (put(x, y, z, above)) { U.fixed.lamp++; chunks.add(Math.floor(x / CH) + ',' + Math.floor(z / CH)); for (const sd of [-1, 1]) sconce(x + 0.5, y - 1, z + 0.5, nx * sd, nz * sd, chunks); } continue; }
          if (isSt(v) && full(below) && ap <= 2.6 && !above) ramps.push([x, y, z]); } }
      // ramp stairs: raise the quarters that touch the higher deck, so a diagonal ramp has inner / outer corner steps instead of sideways stairs
      for (const [x, y, z] of ramps) { let q = 0; const hi = (a, c) => full(get(a, y, c)) && !get(a, y + 1, c);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) if (hi(x + sx, z) || hi(x, z + sz) || hi(x + sx, z + sz)) q |= qbit(sx, sz);
        if (!q || q === 15) continue;
        const k = keyOf(x, y, z), m = entMeta.get(k) || {face: 0}; let f = m.face | 0; for (let ff = 0; ff < 4; ff++) if (HALF[ff] === q || (HALF[ff] & q) === HALF[ff]) { f = ff; break; }
        entMeta.set(k, Object.assign({}, m, {face: f, q, qf: 1})); U.fixed.ramp++; chunks.add(Math.floor(x / CH) + ',' + Math.floor(z / CH)); } }
    U.ms = Math.round(performance.now() - t0); return chunks; }
  function sconce(cx, y, cz, dx, dz, chunks) {   // walk out from the middle to the wall; hang the lantern on the last air cell
    for (const hy of [y, y - 1, y - 2]) { let px = Math.floor(cx), pz = Math.floor(cz); if (get(px, hy, pz)) continue;
      for (let s = 1; s <= 5; s++) { const x = Math.floor(cx + dx * s), z = Math.floor(cz + dz * s); if (x === px && z === pz) continue;
        const v = get(x, hy, z); if (!v) { px = x; pz = z; continue; } if (!full(v)) break;
        let ww = [x - px, z - pz]; if (Math.abs(ww[0]) + Math.abs(ww[1]) !== 1) ww = Math.abs(dx) >= Math.abs(dz) ? [Math.sign(dx), 0] : [0, Math.sign(dz)];
        if (!full(get(px + ww[0], hy, pz + ww[1]))) break; if (!full(get(px, hy - 1, pz)) && !get(px, hy - 2, pz) && get(px, hy - 1, pz)) break;
        if (put(px, hy, pz, T.TORCH)) { entMeta.set(keyOf(px, hy, pz), {face: 0, lamp: 1, wall: ww}); U.fixed.sconce++; chunks && chunks.add(Math.floor(px / CH) + ',' + Math.floor(pz / CH)); } return; } } }
  U.tidy = tidy;
  const ok = () => typeof current !== 'undefined' && current && !DIM.cur && window.__c113 && __c113.bridges && __c113.bridges.length;
  const ge = generate; generate = function () { const r = ge.apply(this, arguments); try { if (ok()) { window.__c171gen = 1; try { tidy(__c113.bridges); } finally { window.__c171gen = 0; } current.c171u = true; } } catch (e) { warn('gen', e); } return r; };
  const ew = enterWorld; enterWorld = function (save) { try { if (current) current.c171u = save ? !!save.c171 : true; } catch (_) {} return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && current && current.c171u) d.c171 = 1; } catch (_) {} return d; };
  let wait = 2;
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments);
    try { if (started && !paused && ok() && !current.c171u && (wait -= (+dt || 0.016)) < 0) { current.c171u = true; window.__c171gen = 1; let ch; try { ch = tidy(__c113.bridges); } finally { window.__c171gen = 0; }
        for (const c of ch) { const [a, b] = c.split(',').map(Number); try { markDirty(a * CH + 2, b * CH + 2); } catch (_) {} } try { scanLights(); validateLights(); } catch (_) {} U.up = 1; } } catch (e) { warn('up', e); }
    return r; };

  // ---------- 4) inside a bridge tunnel it is still day: the cave fog / night look only belongs to real caves ----------
  let tT = 0, tIn = false;
  function inTunnel() { const now = performance.now(); if (now - tT < 200) return tIn; tT = now; tIn = false;
    try { if (DIM.cur || !window.__c113 || !__c113.bridges) return false; const DK = SEA + 4;
      for (const b of __c113.bridges) { const [ax, az, ux, uz, ta, tb] = b.a, px = P.x - ax, pz = P.z - az, t = px * ux + pz * uz; if (t < ta - 2 || t > tb + 2) continue;
        if (Math.abs(-px * uz + pz * ux) > 3.2) continue; if (P.y < SEA - 4 || P.y > DK + 6) continue; tIn = true; break; } } catch (_) {}
    return tIn; }
  U.inTunnel = inTunnel;
  const cd = caveDepth; caveDepth = function () { const v = cd.apply(this, arguments); return inTunnel() ? 0 : v; };
})();
