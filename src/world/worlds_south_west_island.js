/* ===================== GLX-C142 (v1.0.21): new worlds - the south-west island becomes a sand island with a sandstone pyramid and a tomb under it, a moss hag's hut by the black castle, the longship back in the channel ===================== */
(function c142() {
  const U = window.__c142 = {sites: null, st: null, err: null};
  const elig = () => { try { return !!(current && current.mode !== 'creative' && current.g21 && current.g12 && !DIM.cur && !cityGen && W >= 600); } catch (_) { return false; } };
  const ew = enterWorld; enterWorld = function (save) { try { if (current) current.g21 = save ? !!(save.c141 && save.c141.g21) : true; U.sites = save && save.c141 && save.c141.s || null; } catch (_) {} return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && current && current.g21) d.c141 = {g21: 1, s: U.sites}; } catch (_) {} return d; };
  const gen = generate; generate = function () { const r = gen.apply(this, arguments);
    if (elig()) { try { U.sites = post(); U.err = null; } catch (e) { U.err = String(e && e.stack || e); console.warn('c142', e); } } else if (!DIM.cur) U.sites = null;
    return r; };
  const SH = 'Ag8ICgIQCAoDCwgKAwwICgMNCAoDDggKAw8ICgMQCAoECwcKBAwHCgQNBwoECggKBAsICgQMCAoEDQgKBA4ICgQPCAoEEAgKBAsJCgQMCQoEDQkKBQoHCgULBwoFDAcKBQkICgUKCAoFCwgKBQwICgUPCAoFEAgKBREICgUKCQoFCwkKBQwJCgYKBwoGCwcKBgkICgYKCAoGCwgKBg8ICgYQCAoGCgkKBgsJCgcLBgoHCQcKBwoHCgcLBwoHCQgKBwoICgcLCAoHCQkKBwoJCgcLCQoHCwoKCAoGCggLBgoICQcKCAoHCggLBwoICAgKCAkICggKCAoICQkKCAoJCggLCQoICgoKCAsKCgkIAAoJCAEKCQkCCgkJAwoJCgQKCQoFCgkKBgoJCwYKCQkHCgkKBwoJCAgKCQkICgkJCQoJCgkKCQoKCgkLCgoJCgsKCQoMCgkJDQoJCQ4KCQgPCgkIEAoKCgWcCgsFCgoKBgoKCAcKCgkHCgoKBwoKCAgKCgkICgoKCAoKCAkKCgkJCgoKCQoKCgoKCgoLTQoLCwoLCgUKCwsFnAsSBU4LCQYKCwoGCgsRBpwLEgacCxMGnAsIBwoLCQcKCxEHnAsSB5wLEwecCwgICgsJCAoLEQhOCxIITgsTCE4LCAkKCwkJCgsRCU4LEglOCxMJTgsJCgoLCgoKCxEKnAsSCpwLEwqcCwoLCgsLC00LEgucDAgACgwIAQoMCQIKDAkDCgwPA5wMEAOcDBED4wwUA5wMFQOcDAoECgwPBE4MEARODBEETgwSBE4MEwRODBQETgwVBE4MCgUKDA8FTgwQBU4MEQVODBMFTgwUBU4MFQVODAkGCgwKBgoMDwacDBAGnAwUBpwMFQacDAgHCgwJBwoMEAecDBQHnAwVB5wMCAgKDAkICgwQCE4MFAhODBUITgwICQoMCQkKDBAJTgwUCU4MFQlODAkKCgwKCgoMDwqcDBAKnAwUCpwMFQqcDAoLCgwPC5wMEAucDBELnAwTC5wMFAucDBULnAwKDAoMDwxODBAMTgwRDE4MEgxODBMMTgwUDE4MFQxODAkNCgwPDU4MEA1ODBEN4wwSDeMMFA3jDBUNTgwJDgoMCA8KDAgQCg0OApwNFgKcDQ4DnA0PA5wNFgOcDQ4ETg0WBE4NCgWWDQsFnA0OBU4NDwWcDRYFTg0JBgoNCgYKDQ4GnA0PBpwNFgacDQgHCg0JBwoNCgcKDQ4HnA0PB5wNFgecDQgICg0JCAoNCggKDQ8ITg0WCE4NCAkKDQkJCg0KCQoNDwlODRYJTg0JCgoNCgoKDQ4KnA0PCpwNFgqcDQoLTg0LC5wNDgucDQ8LnA0WC5wNDgxODRYMTg0ODU4NFg1ODRYOnA4OAqIOFgKiDhcCCg4MA6IODQOiDg4Dog4WA6IOFwMKDgwEog4OBKIOFgSiDhcECg4KBZwOCwWWDg4Fog4WBaIOFwUKDgkGCg4KBgoODgaiDhYGog4XBgoOCAcKDgkHCg4OB6IOFgeiDhcHCg4ICAoOCQgKDgoIDA4OCKIOFgiiDhcICg4ICQoOCQkKDg4Jog4WCaIOFwkKDgkKCg4KCgoODgqiDhYKog4XCgoOCgucDgsLTg4OC6IOFguiDhcLCg4MDKIODQyiDg4Mog4WDKIOFwwKDhkMnA4NDaIODg2iDhYNog4XDQoOFg6iDhcOCg8IAAoPCAEKDwkCCg8JAwoPCgQKDwsEog8MBKIPCgUKDwsFog8JBgoPCgYKDwgHCg8JBwoPCAgKDwkICg8KCAgPCwgIDwwICA8NCAgPDggIDw8ICA8QCAgPEQgIDxIICA8TCAgPFAgIDxUICA8WCAgPFwgIDxgICA8ZCKIPGgiiDxsIog8ICQoPCQkKDxoJmQ8bCZkPCQoKDwoKCg8LCqIPGQqcDxoKnA8KCwoPCwuiDwwLog8ZC04PCgwKDwwMog8JDQoPCQ4KDwgPCg8IEAoQCgWcEAsFThAJBgoQCgYKEAgHChAJBwoQCgcKEAgIChAJCAoQCggKEAgJChAJCQoQCgkKEAkKChAKCgoQCgucEAsLChEKBU4RCwWcEQkGChEKBgoRCAcKEQkHChEICAoRCQgKEQgJChEJCQoRCQoKEQoKChEKCwoRCwucEggAChIIAQoSCQIKEgkDChIKBAoSCgUKEgoGChIIBwoSCQcKEgoHChIICAoSCQgKEggJChIJCQoSCgkKEgoKChIKCwoSCgwKEgkNChIJDgoSCA8KEggQChMKBgoTCwYKEwgHChMJBwoTCgcKEwgIChMJCAoTCggKEwgJChMJCQoTCgkKEwoKChMLCgoUCwYKFAkHChQKBwoUCAgKFAkIChQKCAoUCQkKFAoJChQLCgoVCwYKFQkHChUKBwoVCwcKFQgIChUJCAoVCggKFQkJChUKCQoVCwkKFQsKChYKBwoWCwcKFgkIChYKCAoWCgkKFgsJChcKBwoXCwcKFwkIChcKCAoXCwgKFwwIChcNCAoXDggKFwoJChcLCQoYCwcKGAwHChgKCAoYCwgKGAwIChgOCAoYCwkKGAwJCg==';
  const N = (x, z) => x * D + z, inW = (x, z) => x > 2 && z > 2 && x < W - 3 && z < D - 3;
  const SKIP = b => !b || PLANT[b] || LEAFY[b] || LOGGY[b];
  function topOf(x, z) { for (let y = H - 2; y > 0; y--) { const b = world[idx(x, y, z)]; if (SKIP(b)) continue; return [y, b]; } return [0, 0]; }
  const setW = (x, y, z, v) => { if (y > 0 && y < H - 1 && inW(x, z)) world[idx(x, y, z)] = v; };
  const gw = (x, y, z) => (inW(x, z) && y >= 0 && y < H) ? world[idx(x, y, z)] : 0;
  const SOLIDB = b => b && b !== T.WATER && b !== T.LAVA && !PLANT[b] && !LEAFY[b] && b !== T.TORCH;
  function torch(x, y, z) { setW(x, y, z, T.TORCH); try { lightSrc.set((x * 4096 + z) * 256 + y, [x + .5, y + .7, z + .5, T.TORCH]); } catch (_) {} }
  function col(x, z, h, kind) { try { if (g9cols && g9cols.length > (N(x, z) * 2 + 1)) { g9cols[N(x, z) * 2] = h + 1; g9cols[N(x, z) * 2 + 1] = kind; } } catch (_) {} }
  function clearMeta(test) { for (const M of [entMeta, chests]) for (const k of [...M.keys()]) { const [x, y, z] = String(k).split(',').map(Number); if (test(x, y, z)) M.delete(k); }
    try { for (const k of [...lightSrc.keys()]) { const v = lightSrc.get(k); if (v && test(Math.floor(v[0]), Math.floor(v[1]), Math.floor(v[2])) && world[idx(Math.floor(v[0]), Math.floor(v[1]), Math.floor(v[2]))] !== v[3]) lightSrc.delete(k); } } catch (_) {} }
  // carve boxes as one set, then seal every face that touches water, lava, air or an old chest with sandstone (below yTop only)
  function carve(boxes, isle, yTop) { const cells = new Set(), K = (x, y, z) => (x * H + y) * D + z, ok = [];
    for (const bx of boxes) { let g = true; for (let x = bx[0] - 1; x <= bx[3] + 1 && g; x++) for (let z = bx[2] - 1; z <= bx[5] + 1; z++) if (!isle.has(N(x, z))) { g = false; break; } ok.push(g); if (!g) continue;
      for (let x = bx[0]; x <= bx[3]; x++) for (let y = bx[1]; y <= bx[4]; y++) for (let z = bx[2]; z <= bx[5]; z++) cells.add(K(x, y, z)); }
    for (const k of cells) { const x = Math.floor(k / (H * D)), y = Math.floor(k / D) % H, z = k % D;
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { const X = x + dx, Y = y + dy, Z = z + dz; if (Y > yTop || cells.has(K(X, Y, Z))) continue; const b = gw(X, Y, Z); if (!SOLIDB(b) || b === T.CHEST) setW(X, Y, Z, T.SANDSTONE); } }
    for (const k of cells) world[k] = 0; return ok; }
  function post() {
    const t0 = performance.now(), st = {}; let s = ((gSeed | 0) ^ 0x21c142) >>> 0;
    const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const sites = {};
    try { sites.isle = island(rnd, st); } catch (e) { st.isleErr = String(e && e.stack || e); }
    try { sites.hut = hut(rnd, st); } catch (e) { st.hutErr = String(e && e.stack || e); }
    try { sites.boat = boat(st); } catch (e) { st.boatErr = String(e && e.stack || e); }
    st.ms = Math.round(performance.now() - t0); U.st = st; return sites; }
  // ---------- 1) the sand island + pyramid + tomb ----------
  function island(rnd, st) {
    if (window.__c181 && __c181.on()) return __c181.island(rnd, st);   // v1.0.35: the desert museum park
    const cx0 = MT_C[0], cz0 = MT_C[1], R = 150; let sx = -1, sz = -1;
    for (let r = 0; r < 40 && sx < 0; r += 2) for (let a = 0; a < 6.28 && sx < 0; a += 0.4) { const x = Math.round(cx0 + Math.cos(a) * r), z = Math.round(cz0 + Math.sin(a) * r); if (inW(x, z) && topOf(x, z)[0] > SEA && topOf(x, z)[1] !== T.WATER) { sx = x; sz = z; } }
    if (sx < 0 && !(window.__c147 && __c147.shape)) { st.isle = 'no land'; return null; } if (sx < 0) { sx = cx0; sz = cz0; }
    let isle, tops; if (window.__c147 && __c147.shape) { const r = __c147.shape(cx0, cz0, rnd, st); isle = r.isle; tops = r.tops; } else { isle = new Set([N(sx, sz)]); tops = new Map(); const q = [[sx, sz]];
    while (q.length) { const [x, z] = q.pop(); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Z = z + dz, k = N(X, Z); if (isle.has(k) || !inW(X, Z) || Math.hypot(X - cx0, Z - cz0) > R) continue;
      const t = topOf(X, Z); if (t[0] <= SEA || t[1] === T.WATER) continue; isle.add(k); tops.set(k, t[0]); q.push([X, Z]); } } }
    tops.set(N(sx, sz), topOf(sx, sz)[0]); st.isleCells = isle.size; if (isle.size < 1500) { st.isle = 'small'; return null; }
    // distance to the shore
    const E = new Map(), bq = []; for (const k of isle) { const x = (k / D) | 0, z = k - x * D; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !isle.has(N(x + dx, z + dz)))) { E.set(k, 1); bq.push(k); } }
    for (let i = 0; i < bq.length; i++) { const k = bq[i], x = (k / D) | 0, z = k - x * D, e = E.get(k); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = N(x + dx, z + dz); if (isle.has(n) && !E.has(n)) { E.set(n, e + 1); bq.push(n); } } }
    let best = null, be = -1, mx = 0, mz = 0; for (const k of isle) { const x = (k / D) | 0, z = k - x * D; mx += x; mz += z; } mx /= isle.size; mz /= isle.size;
    for (const [k, e] of E) { const x = (k / D) | 0, z = k - x * D, sc = e - Math.hypot(x - mx, z - mz) * 0.15; if (sc > be) { be = sc; best = k; } }
    const px = (best / D) | 0, pz = best - px * D, pe = E.get(best); st.pe = pe;
    // reshape: low dunes, sand over sandstone, old caves near the top sealed
    const HT = new Map();
    for (const k of isle) { const x = (k / D) | 0, z = k - x * D, e = E.get(k);
      const dune = e > 8 ? Math.max(0, Math.round(1.1 + Math.sin(x * 0.11 + Math.sin(z * 0.07) * 2) + Math.cos(z * 0.09 + x * 0.03) * 0.8)) : 0;
      const h = SEA + 1 + Math.min(5, Math.floor((e - 1) / 5)) + Math.min(2, dune); HT.set(k, h);
      for (let y = h + 1; y < H - 1; y++) world[idx(x, y, z)] = 0;
      for (let y = h; y >= Math.max(2, h - 12); y--) world[idx(x, y, z)] = y > h - 4 ? T.SAND : T.SANDSTONE;
      col(x, z, h, 4); }
    clearMeta((x, y, z) => isle.has(N(x, z)) && y > (HT.get(N(x, z)) || 0) - 13);
    // the pyramid
    const B = Math.max(9, Math.min(17, pe - 7)), y0 = SEA + 3; st.B = B;
    for (let x = px - B - 3; x <= px + B + 3; x++) for (let z = pz - B - 3; z <= pz + B + 3; z++) { if (!isle.has(N(x, z))) continue; for (let y = y0 + 1; y < H - 1; y++) setW(x, y, z, 0); for (let y = y0; y > y0 - 5; y--) setW(x, y, z, y === y0 ? T.SANDSTONE : T.SAND); col(x, z, y0, 4); }
    for (let k = 0; k <= B; k++) { const y = y0 + 1 + k, r = B - k, band = k % 4 === 3 ? 150 : T.SANDSTONE;
      for (let x = px - r; x <= px + r; x++) for (let z = pz - r; z <= pz + r; z++) setW(x, y, z, k === B ? T.GOLDBLOCK : (Math.abs(x - px) === r || Math.abs(z - pz) === r) ? band : T.SANDSTONE); col(px, pz, y0 + B + 1, 4); }
    // entrance on the south face -> passage -> burial hall
    for (let z = pz + 3; z <= pz + B + 1; z++) for (let x = px - 1; x <= px + 1; x++) for (let y = y0 + 1; y <= y0 + 3; y++) setW(x, y, z, 0);
    for (let y = y0 + 1; y <= y0 + 4; y++) { setW(px - 2, y, pz + B, 150); setW(px + 2, y, pz + B, 150); } for (let x = px - 2; x <= px + 2; x++) setW(x, y0 + 4, pz + B, 150);
    for (let x = px - 3; x <= px + 3; x++) for (let z = pz - 3; z <= pz + 3; z++) for (let y = y0 + 1; y <= y0 + 5; y++) setW(x, y, z, 0);
    torch(px - 3, y0 + 1, pz - 3); torch(px + 3, y0 + 1, pz - 3); torch(px - 1, y0 + 1, pz + B - 2); torch(px + 1, y0 + 1, pz + 6);
    // obelisks either side of the door
    for (const ox of [-6, 6]) { const x = px + ox, z = pz + B + 5; if (!isle.has(N(x, z))) continue; for (let y = y0 + 1; y <= y0 + 6; y++) setW(x, y, z, T.SANDSTONE); setW(x, y0 + 7, z, T.GOLDBLOCK); }
    // stairs down from the hall to the tomb (north), then the crypt and two side chambers - all under dry land
    const ty = SEA - 12, sites = {x: px, z: pz, y: y0, B, door: [px + .5, y0 + 1, pz + B + 2.5]}; let zz = pz - 4, yy = y0; const boxes = [];
    while (yy > ty) { boxes.push([px - 1, yy, zz, px + 1, yy + 2, zz]); zz--; yy--; }
    const cz = zz - 6, tomb = {x: px, y: ty, z: cz, pts: []};
    boxes.push([px - 1, ty, zz - 1, px + 1, ty + 2, zz + 1]);
    const nB = boxes.length; boxes.push([px - 6, ty, cz - 6, px + 6, ty + 4, cz + 5], [px - 15, ty, cz - 2, px - 8, ty + 3, cz + 2], [px - 8, ty, cz - 1, px - 6, ty + 2, cz + 1], [px + 8, ty, cz - 2, px + 15, ty + 3, cz + 2], [px + 6, ty, cz - 1, px + 8, ty + 2, cz + 1]);
    const okB = carve(boxes, isle, y0); const ok1 = okB.slice(0, nB + 2).every(Boolean); st.tomb = okB.map(v => v ? 1 : 0).join('');
    for (let i = 0; i < nB - 1; i++) { const b = boxes[i]; for (let x = b[0]; x <= b[3]; x++) setW(x, b[1] - 1, b[2], T.SANDSTONE); }
    if (ok1) { for (let x = px - 6; x <= px + 6; x++) for (let z = cz - 6; z <= cz + 5; z++) setW(x, ty - 1, z, (x + z) % 2 ? T.SANDSTONE : 150);
      for (const [x, z] of [[-6, -6], [6, -6], [-6, 5], [6, 5]]) for (let y = ty; y <= ty + 4; y++) setW(px + x, y, cz + z, 150);
      setW(px - 1, ty, cz - 2, 150); setW(px, ty, cz - 2, 150); setW(px + 1, ty, cz - 2, 150); setW(px, ty + 1, cz - 2, T.GOLDBLOCK);
      for (const [x, z] of [[-4, -5], [4, -5], [-4, 4], [4, 4], [-2, 5]]) torch(px + x, ty, cz + z);
      try { const L = [[IT.GOLDINGOT, 4, 0.9], [IT.BONE || 171, 4, 0.7], [IT.DIAMOND, 1, 0.35], [IT.RUBY, 2, 0.5], [IT.ROTTEN || 320, 3, 0.6]].filter(r => r[0] != null); lootChest(px, ty, cz - 5, L, rnd); } catch (e) { st.chest = String(e); }
      for (const [j, x0] of [[nB + 1, px - 15], [nB + 3, px + 8]]) if (okB[j] && okB[j + 1]) { torch(x0 + 3, ty, cz + 2); for (let x = x0; x <= x0 + 7; x += 2) tomb.pts.push([x + .5, ty, cz + .5]); }
      for (let x = px - 4; x <= px + 4; x += 2) for (const z of [cz - 3, cz + 2]) tomb.pts.push([x + .5, ty, z + .5]); }
    try { if (window.__c147 && __c147.caverns) __c147.caverns(px, pz, B, ty, isle, rnd, st); } catch (e) { st.cavErr = String(e && e.stack || e); }
    for (let x = px - 20; x <= px + 20; x++) for (let z = cz - 10; z <= pz + B + 8; z++) if (isle.has(N(x, z))) { try { markDirty(x, z); } catch (_) {} }
    const surf = []; for (const k of isle) { const e = E.get(k); if (e > 4 && (k % 7) === 0) { const x = (k / D) | 0, z = k - x * D; if (Math.abs(x - px) > B + 2 || Math.abs(z - pz) > B + 2) surf.push([x, z]); } }
    const pick = []; for (let i = 0; i < 60 && surf.length; i++) pick.push(surf[(rnd() * surf.length) | 0]);
    return {c: [Math.round(mx), Math.round(mz)], r: Math.round(Math.sqrt(isle.size / Math.PI)) + 6, pyr: sites, tomb: ok1 ? tomb : null, surf: pick}; }
  // ---------- 2) the moss hag's hut, a short walk from the black castle ----------
  function hut(rnd, st) {
    const bc = (g9castles || []).find(c => c[0] === 'black'); if (!bc) { st.hut = 'no castle'; return null; }
    const rav = ((window.__c131 && __c131.st && __c131.st.ravines) || []).filter(r => /black/.test(r.land || ''));
    let best = null, bs = 1e9;
    for (let r = 38; r <= 58; r += 4) for (let a = 0; a < 6.28; a += 0.26) { const x = Math.round(bc[1] + Math.cos(a) * r), z = Math.round(bc[2] + Math.sin(a) * r); if (!inW(x - 6, z - 6) || !inW(x + 6, z + 6)) continue;
      if (rav.some(v => Math.hypot(v.x - x, v.z - z) < 26)) continue; try { if (window.__c113 && __c113.nearBridge && __c113.nearBridge(x, z, 10)) continue; } catch (_) {}
      let lo = 1e9, hi = -1, bad = false; for (let dx = -4; dx <= 4 && !bad; dx++) for (let dz = -4; dz <= 4; dz++) { const t = topOf(x + dx, z + dz); if (t[1] === T.WATER || t[0] <= SEA + 1) { bad = true; break; } lo = Math.min(lo, t[0]); hi = Math.max(hi, t[0]); }
      if (bad) continue; const sc = (hi - lo) * 10 + Math.abs(r - 46); if (sc < bs) { bs = sc; best = [x, z, hi]; } }
    if (!best) { st.hut = 'no spot'; return null; }
    const [hx, hz, fy] = best, dir = Math.atan2(bc[2] - hz, bc[1] - hx), dz0 = Math.abs(Math.sin(dir)) > Math.abs(Math.cos(dir)) ? Math.sign(Math.sin(dir)) : 0, dx0 = dz0 ? 0 : Math.sign(Math.cos(dir));
    const LOG = 138, PL = 141, MOSS = 144;
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) { const x = hx + dx, z = hz + dz; for (let y = fy + 1; y < Math.min(H - 1, fy + 16); y++) setW(x, y, z, 0);
      for (let y = fy; y > fy - 6; y--) { const b = gw(x, y, z); if (y === fy || !SOLIDB(b)) setW(x, y, z, Math.abs(dx) <= 3 && Math.abs(dz) <= 3 ? (y === fy ? PL : T.COBBLE) : y === fy ? 142 : T.DIRT); } col(x, z, fy, 0); }
    for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) { const edge = Math.abs(dx) === 3 || Math.abs(dz) === 3, corner = Math.abs(dx) === 3 && Math.abs(dz) === 3; if (!edge) continue;
      for (let y = fy + 1; y <= fy + 3; y++) setW(hx + dx, y, hz + dz, corner ? LOG : y === fy + 1 ? T.MOSSYBRICK : PL); }
    for (let k = 0; k <= 3; k++) { const r = 4 - k; for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (Math.abs(dx) === r || Math.abs(dz) === r || k === 3) setW(hx + dx, fy + 4 + k, hz + dz, k % 2 ? MOSS : 9); }
    const ddx = dx0 * 3, ddz = dz0 * 3; setW(hx + ddx, fy + 1, hz + ddz, 0); setW(hx + ddx, fy + 2, hz + ddz, 0);
    for (const [wx, wz] of dx0 ? [[0, 3], [0, -3]] : [[3, 0], [-3, 0]]) setW(hx + wx, fy + 2, hz + wz, T.GLASS);
    setW(hx - dx0 * 2, fy + 1, hz - dz0 * 2, T.CAULDRON); setW(hx + (dz0 ? 2 : 0), fy + 1, hz + (dx0 ? 2 : 0), T.COBWEB); torch(hx - (dz0 ? 2 : 0), fy + 1, hz - (dx0 ? 2 : 0));
    for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) try { markDirty(hx + dx, hz + dz); } catch (_) {}
    clearMeta((x, y, z) => Math.abs(x - hx) <= 4 && Math.abs(z - hz) <= 4 && y > fy);
    st.hut = [hx, fy, hz]; return {x: hx + .5, y: fy + 1, z: hz + .5, door: [hx + dx0 * 5 + .5, fy + 1, hz + dz0 * 5 + .5]}; }
  // ---------- 3) the longship the spawn asset used to carry, back out in the channel ----------
  function boat(st) {
    const raw = atob(SH), L = []; for (let i = 0; i + 3 < raw.length; i += 4) L.push([raw.charCodeAt(i), raw.charCodeAt(i + 1), raw.charCodeAt(i + 2), raw.charCodeAt(i + 3)]);
    const g35 = !!(window.__c181 && __c181.on()), g36 = g35 && current && current.g36, bx = g36 ? Math.round(W * 0.22) - 11 : g35 ? (W >> 1) - 80 : (W >> 1) - 128 + 94, bz = g36 ? Math.round(D * 0.22) - 7 : g35 ? Math.round(D * 0.227) - 7 : (D >> 1) - 124 + 4, by = 21 + 12; let best = 0, bd = -1;
    const foot = [...new Set(L.map(b => b[0] + ',' + b[2]))].map(s => s.split(',').map(Number));
    const wet = (x, z) => { const t = topOf(x, z); return t[1] === T.WATER && t[0] <= SEA; };
    for (let dz = -14; dz <= 14; dz++) { let n = 0; for (const [x, z] of foot) if (wet(bx + x, bz + z + dz)) n++; const sc = n * 10 - Math.abs(dz + 4); if (sc > bd) { bd = sc; best = dz; } }
    st.boatShift = best; st.boatWet = Math.round(bd / 10) + '/' + foot.length; if (bd / 10 < foot.length * 0.8) { st.boat = 'no room'; return null; }
    const WET = new Set(foot.filter(([x, z]) => wet(bx + x, bz + z + best)).map(([x, z]) => x + ',' + z));
    if (window.__c191 && __c191.entity) {   // v1.0.36: the longship is a sailing entity (GLX-C191), not blocks
      const has = new Set(L.map(([x, y, z]) => x + ',' + y + ',' + z)), dk = [];
      for (const [x, y, z, v] of L) if (v === 10 && !has.has(x + ',' + (y + 1) + ',' + z) && !has.has(x + ',' + (y + 2) + ',' + z) && by + y >= SEA) dk.push([bx + x + .5, by + y + 1, bz + z + best + .5]);
      const cx = bx + 11, cz = bz + 7 + best; dk.sort((p, q) => Math.hypot(p[0] - cx, p[2] - cz) - Math.hypot(q[0] - cx, q[2] - cz));
      st.boat = ['ship', cx, cz, dk.length]; return {x: cx, z: cz, y: by + 9, deck: dk.slice(0, 12), ship: {bx, bz: bz + best, by, cx, cz}}; }
    if (true) { st.boat = 'entity only'; return null; }   // v1.0.41: the longship is never built from blocks any more (only Admiral Skelp's sailing ship)
    const deck = []; for (const [x, y, z, v] of L) { const X = bx + x, Z = bz + z + best, Y = by + y; if (!WET.has(x + ',' + z) && Y > SEA) continue; setW(X, Y, Z, v); }
    for (const [x, y, z, v] of L) { const X = bx + x, Z = bz + z + best, Y = by + y; if (v === 10 && gw(X, Y, Z) === 10 && !gw(X, Y + 1, Z) && !gw(X, Y + 2, Z) && Y >= SEA) deck.push([X + .5, Y + 1, Z + .5]); }
    for (const [x, z] of foot) try { markDirty(bx + x, bz + z + best); } catch (_) {}
    const cx = bx + 11, cz = bz + 7 + best; deck.sort((p, q) => Math.hypot(p[0] - cx, p[2] - cz) - Math.hypot(q[0] - cx, q[2] - cz));
    st.boat = [cx, cz, deck.length]; return {x: cx, z: cz, y: by + 9, deck: deck.slice(0, 12)}; }
  U.SH = () => { const raw = atob(SH), L = []; for (let i = 0; i + 3 < raw.length; i += 4) L.push([raw.charCodeAt(i), raw.charCodeAt(i + 1), raw.charCodeAt(i + 2), raw.charCodeAt(i + 3)]); return L; };
  U.post = () => { U.sites = post(); return U.st; };
})();
