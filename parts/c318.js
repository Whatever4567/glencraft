/* GLX-C318 (v1.1.27): THE MOON AND MARS IN THE SPACE BOX. Two big round planets of real blocks hanging in the box (the Moon above Earth, Mars
   below it), in the same world coordinates as the map. They answer the game's own block helpers (getB, setB, solid via C317), so walking,
   falling, jumping, mining, placing, the jetpack and the UFO all just work there with normal downward gravity, and you land on top. Near you
   they are drawn by the game's own chunk mesher (real textures and lighting, so every block you place looks right); from afar each is one
   low detail block ball. Only the blocks you change are saved. */
(function c318() {
  const U = window.__c318 = {err: null, cols: 0, meshed: 0, ms: 0, gms: 0, edits: 0, cms: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); console.warn('c318', w, e); };
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent) || (typeof PERF !== 'undefined' && PERF), C = CH;
  const CX = () => W / 2, CZ = () => D / 2;
  const DEF = [{id: 'moon', name: 'The Moon', R: 120, off: [2600, 2400, -2400], bump: 1.5, cr: 40, top: () => T.MOONDUST, rock: () => T.MOONROCK, deep: () => T.MOONBASALT, ores: [[() => T.MOONORE, 0.012, 14]], td: 3, core: () => T.MAGMA, mant: () => T.MOONBASALT, str: [() => T.MOONROCK, () => T.MOONROCK, () => T.MOONBASALT]},
    {id: 'mars', name: 'Mars', R: 160, off: [-6500, -2600, 4600], bump: 5, cr: 26, top: () => T.RSAND || T.SAND, rock: () => T.MARSSTONE, deep: () => T.STONE, ores: [[() => T.MARSOXIDE, 0.03, 4], [() => T.MARSORE, 0.008, 16]], td: 2, dune: 2.2, core: () => T.MAGMA, mant: () => 206, str: [() => T.MARSSTONE, () => T.RSAND, () => T.MARSSTONE, () => T.SANDSTONE || T.RSAND]}];
  function Body(d) { const B = {id: d.id, name: d.name, R: d.R, d, cols: new Map(), edits: new Map(), meshes: new Map(), dirty: new Set(), coarse: null};
    const BM = Math.ceil(d.bump + (d.dune || 0) + 4), N = 2 * (d.R + BM) + 4; B.N = N;
    B.c = () => d.cc || [Math.round(CX() + d.off[0]), d.off[1], Math.round(CZ() + d.off[2])];
    B.ylo = () => B.c()[1] - (d.R + BM) - 2;
    let CR = null, P1 = 0, P2 = 0, seedOf = -1;
    function craters() { const sd = (typeof gSeed !== 'undefined' ? gSeed | 0 : 0); if (CR && seedOf === sd) return; seedOf = sd; let s = (0x5eed + d.id.charCodeAt(1) * 977 + (sd >>> 0) * 7) >>> 0; const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
      CR = []; for (let i = 0; i < d.cr; i++) { const u = rnd() * 2 - 1, a = rnd() * 6.283, w = Math.sqrt(1 - u * u), r = 0.05 + Math.pow(rnd(), 2) * 0.3; CR.push([w * Math.cos(a), u, w * Math.sin(a), Math.cos(r), r, r * d.R * (0.2 + rnd() * 0.1)]); } P1 = rnd() * 6; P2 = rnd() * 6; }
    B.craters = craters;
    B.hgt = (nx, ny, nz) => { let h = d.R + d.bump * Math.sin(nx * 7 + nz * 3 + P1) * Math.sin(ny * 6 - nx * 2 + P2); if (d.dune) h += d.dune * Math.abs(Math.sin(nx * 47 + nz * 19 + ny * 11 + P1)) * (0.6 + 0.4 * Math.sin(ny * 13 - nz * 5 + P2));
      for (const c of CR) { const dot = nx * c[0] + ny * c[1] + nz * c[2]; if (dot < Math.cos(c[4] * 1.6)) continue; const q = Math.acos(Math.min(1, dot)) / c[4]; if (q < 1) h -= c[5] * (1 - q * q) - c[5] * 0.3; else h += c[5] * 0.3 * (1 - (q - 1) / 0.6); } return h; };
    const hash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    function block(x, y, z, c) { if (d.cell) return 0; const dx = x + 0.5 - c[0], dy = y + 0.5 - c[1], dz = z + 0.5 - c[2], r = Math.hypot(dx, dy, dz); if (r > d.R + BM) return 0; if (r < d.R * 0.13) return T.GLOWROCK || T.HBEDROCK;
      let h = d.R - BM - 6; if (r > h) h = B.hgt(dx / r, dy / r, dz / r); if (r > h) return 0; const dep = h - r;
      if (dep < d.td) return d.top(); if (d.ores) for (const o of d.ores) if (dep > o[2] && hash(x, y, z) < o[1]) return o[0](); const q = r / d.R; if (q < 0.3) return d.core ? d.core() : T.MAGMA; if (q < 0.5) return d.mant ? d.mant() : T.MAGMA; if (q < 0.62 && d.deep()) return d.deep();
      if (d.str && dep < 26) { const L = d.str, i = Math.floor(r / 2.5 + 0.8 * Math.sin(x * 0.11 + z * 0.07)) % L.length; return L[(i + L.length) % L.length](); } return d.rock(); }
    // one column of C x C blocks, full planet height
    B.col = (cx, cz) => { const k = cx + ',' + cz; let a = B.cols.get(k); if (a) { a.t = performance.now(); return a; } craters(); const t0 = performance.now(), c = B.c(), y0 = B.ylo();
      a = new Uint8Array(C * C * N); const x0 = cx * C, z0 = cz * C;
      for (let lx = 0; lx < C; lx++) for (let lz = 0; lz < C; lz++) { const dx = x0 + lx + 0.5 - c[0], dz = z0 + lz + 0.5 - c[2], q = (d.R + BM) ** 2 - dx * dx - dz * dz; if (q <= 0) continue; const hy = Math.sqrt(q);
        for (let y = Math.max(0, Math.floor(c[1] - hy - y0) - 1); y <= Math.min(N - 1, Math.ceil(c[1] + hy - y0) + 1); y++) { const b = block(x0 + lx, y0 + y, z0 + lz, c); if (b) a[(lx * N + y) * C + lz] = b; } }
      for (const [ek, b] of B.edits) { const [x, y, z] = ek.split(',').map(Number); if (Math.floor(x / C) === cx && Math.floor(z / C) === cz && y - y0 >= 0 && y - y0 < N) a[((x - x0) * N + (y - y0)) * C + (z - z0)] = b; }
      a.t = performance.now(); B.cols.set(k, a); U.cols++; U.gms = Math.round(performance.now() - t0); return a; };
    B.inside = (x, y, z) => { const c = B.c(), r = d.R + BM + 1; return Math.abs(x + 0.5 - c[0]) < r && Math.abs(y + 0.5 - c[1]) < r && Math.abs(z + 0.5 - c[2]) < r; };
    B.get = (x, y, z) => { if (!B.inside(x, y, z)) return 0; const y0 = B.ylo(), ly = y - y0; if (ly < 0 || ly >= N) return 0; const cx = Math.floor(x / C), cz = Math.floor(z / C), a = B.col(cx, cz); return a[((x - cx * C) * N + ly) * C + (z - cz * C)]; };
    B.set = (x, y, z, b) => { if (!B.inside(x, y, z)) return false; const y0 = B.ylo(), ly = y - y0; if (ly < 0 || ly >= N) return false; const cx = Math.floor(x / C), cz = Math.floor(z / C), a = B.col(cx, cz);
      a[((x - cx * C) * N + ly) * C + (z - cz * C)] = b; B.edits.set(x + ',' + y + ',' + z, b); U.edits++;
      for (const [ax, az] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const qx = Math.floor((x + ax) / C), qz = Math.floor((z + az) / C); B.dirty.add(qx + ',' + qz); } return true; };
    B.top = (x, z) => { const c = B.c(); for (let y = c[1] + d.R + BM; y > c[1] - d.R - BM; y--) if (B.get(x, y, z)) return y + 1; return null; };
    B.reset = () => { for (const k of [...B.meshes.keys()]) B.dropMesh(k); B.cols.clear(); B.dirty.clear(); if (B.coarse) { B.coarse.parent && B.coarse.parent.remove(B.coarse); B.coarse.geometry.dispose(); B.coarse = null; } CR = null; };
    return B; }
  const BS = U.bodies = DEF.map(Body), BY = U.by = {}; for (const b of BS) BY[b.id] = b;
  U.get = (x, y, z) => { for (const b of BS) if (b.inside(x, y, z)) return b.get(x, y, z); return 0; };
  U.set = (x, y, z, v) => { for (const b of BS) if (b.inside(x, y, z)) return b.set(x, y, z, v); if (!v || v === T.WATER || v === T.LAVA || (T.LAVAB && v === T.LAVAB) || (T.FIRE && v === T.FIRE)) return false; return cellOf(Math.round(x / SG), Math.round(y / SG), Math.round(z / SG)).set(x, y, z, v); };
  // blocks you place out in empty space live in small build cells (same mesher, saved the same way)
  const SG = 30, cellOf = (gx, gy, gz) => { const id = 'c' + gx + '_' + gy + '_' + gz; if (BY[id]) return BY[id]; const B = Body({id, name: '', R: 12, off: [0, 0, 0], bump: 0, cr: 0, cell: 1, cc: [gx * SG, gy * SG, gz * SG], top: () => T.STONE, rock: () => T.STONE, deep: () => 0, td: 0}); dm(B); BS.push(B); BY[id] = B; return B; };
  U.cellOf = cellOf;
  U.near = (p, m) => { for (const b of BS) { if (b.d.cell) continue; const c = b.c(); if (Math.hypot(p.x - c[0], p.y - c[1], p.z - c[2]) < b.R + (m || 0)) return b; } return null; };
  U.top = id => { const b = BY[id], c = b.c(), x = c[0] + 3, z = c[2] + 2, t = b.top(x, z); return t === null ? null : [x + 0.5, t + 0.02, z + 0.5]; };
  // ---------- near: the game's own chunk mesher on a padded scratch copy (like the north extension) ----------
  const grp = new THREE.Group(); grp.name = 'planets318'; scene.add(grp);
  const dm = B => B.dropMesh = k => { const g = B.meshes.get(k); if (!g) return; grp.remove(g); g.traverse(o => { if (o.isInstancedMesh) o.dispose(); else if (o.geometry) o.geometry.dispose(); }); B.meshes.delete(k); }; BS.forEach(dm);
  const PW = 3 * C + 1; let TMP = null, TMPN = 0;
  function mesh(B, cx, cz) { const t0 = performance.now(), N = B.N, y0 = B.ylo(); if (!TMP || TMPN !== N) { TMP = new Uint8Array(PW * N * PW); TMPN = N; } else TMP.fill(0);
    let any = false; for (let ax = -1; ax <= 1; ax++) for (let az = -1; az <= 1; az++) { const a = B.col(cx + ax, cz + az);
      for (let lx = 0; lx < C; lx++) { const tx = (ax + 1) * C + lx; if (tx < C - 1 || tx > 2 * C) continue; for (let lz = 0; lz < C; lz++) { const tz = (az + 1) * C + lz; if (tz < C - 1 || tz > 2 * C) continue;
          const s = (lx * N) * C + lz, o = (tx * N) * PW + tz; for (let y = 0; y < N; y++) { const b = a[s + y * C]; if (b) { TMP[o + y * PW] = b; if (!ax && !az) any = true; } } } } }
    const k = cx + ',' + cz; B.dropMesh(k); if (!any) { B.meshes.set(k, null); return; }
    const sv = [world, W, H, D], cc = window.__caveCull, o = chunkObjs.get(65), ol = chunkLists.get(65); let g = null;
    chunkObjs.delete(65); chunkLists.delete(65); window.__caveCull = null; window.__c317mesh = 1;
    try { world = TMP; W = PW; H = N; D = PW; __bcBase(1, 1); g = chunkObjs.get(65); } catch (e) { ERR('bc', e); }
    finally { world = sv[0]; W = sv[1]; H = sv[2]; D = sv[3]; window.__caveCull = cc; window.__c317mesh = 0; chunkObjs.delete(65); chunkLists.delete(65); if (o) chunkObjs.set(65, o); if (ol) chunkLists.set(65, ol); }
    if (!g) return; blockGroup.remove(g); g.position.set(cx * C - C, y0, cz * C - C); g.userData.p318 = k; grp.add(g); B.meshes.set(k, g); U.meshed++; U.ms = Math.round(performance.now() - t0); }
  U.mesh = mesh;
  const RN = PH ? 3 : 4;
  U.eye = () => { const u = window.__c309; return u && u.on ? u.pos : window.__c321 ? __c321.pw() : P; };
  setInterval(() => { try { if (typeof started === 'undefined' || !started || DIM.cur) { grp.visible = false; return; } grp.visible = true; const e = U.eye(), t = performance.now(), pcx = Math.floor(e.x / C), pcz = Math.floor(e.z / C);
      for (const B of BS) { const c = B.c(), dd = Math.hypot(e.x - c[0], e.y - c[1], e.z - c[2]) - B.R, near = dd < 140;
        for (const k of [...B.meshes.keys()]) { const [cx, cz] = k.split(',').map(Number); if (!near || Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz)) > RN + 1) B.dropMesh(k); }
        for (const [k, a] of B.cols) if (t - a.t > 30000) B.cols.delete(k);
        if (!near) continue; const want = [];
        for (let cx = pcx - RN; cx <= pcx + RN; cx++) for (let cz = pcz - RN; cz <= pcz + RN; cz++) { const k = cx + ',' + cz, dx = (cx + 0.5) * C - c[0], dz = (cz + 0.5) * C - c[2]; if (Math.hypot(dx, dz) > B.R + 30) continue;
          if (!B.meshes.has(k) || B.dirty.has(k)) want.push([Math.hypot(cx - pcx, cz - pcz) - (B.dirty.has(k) ? 99 : 0), cx, cz, k]); }
        want.sort((a, b) => a[0] - b[0]); for (let i = 0; i < Math.min(PH ? 1 : 2, want.length); i++) { B.dirty.delete(want[i][3]); mesh(B, want[i][1], want[i][2]); } } } catch (e) { ERR('loop', e); } }, 80);
  // ---------- far: one low detail ball each (drawn in the C317 far pass) ----------
  U.coarse = B => { if (B.coarse) return B.coarse; B.craters(); const t0 = performance.now(), S = PH ? 6 : 4, c = B.c(), R = B.R + B.d.bump + 4, n = Math.ceil(2 * R / S) + 2, o = -n * S / 2;
    const sol = new Uint8Array(n * n * n), id = (i, j, k) => (i * n + j) * n + k, pos = [], col = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) { const x = Math.floor(c[0] + o + i * S + S / 2), y = Math.floor(c[1] + o + j * S + S / 2), z = Math.floor(c[2] + o + k * S + S / 2);
      const dx = x + 0.5 - c[0], dy = y + 0.5 - c[1], dz = z + 0.5 - c[2], r = Math.hypot(dx, dy, dz); if (r > R) continue; sol[id(i, j, k)] = r < B.R - 12 || r <= B.hgt(dx / r, dy / r, dz / r) ? 1 : 0; }
    const rgb = b => { try { const a = AVG[[].concat(FACES[b])[0]]; if (a !== undefined) return [(a >> 16) / 255, (a >> 8 & 255) / 255, (a & 255) / 255]; } catch (_) {} return [0.5, 0.5, 0.5]; };
    const cT = rgb(B.d.top()), cR = rgb(B.d.rock()), SUN = [0.45, 0.6, 0.66], FD = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    const QV = [[[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]], [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) { if (!sol[id(i, j, k)]) continue; const up = j + 1 < n && sol[id(i, j + 1, k)];
      for (let f = 0; f < 6; f++) { const a = i + FD[f][0], b = j + FD[f][1], e = k + FD[f][2]; if (a >= 0 && b >= 0 && e >= 0 && a < n && b < n && e < n && sol[id(a, b, e)]) continue;
        const base = !up ? cT : cR, sh = Math.max(0.3, 0.45 + 0.55 * Math.max(0, FD[f][0] * SUN[0] + FD[f][1] * SUN[1] + FD[f][2] * SUN[2])), q = QV[f];
        for (const v of [0, 1, 2, 0, 2, 3]) { pos.push(o + (i + q[v][0]) * S, o + (j + q[v][1]) * S, o + (k + q[v][2]) * S); col.push(base[0] * sh, base[1] * sh, base[2] * sh); } } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({vertexColors: true, fog: false})); m.position.set(c[0], c[1], c[2]); m.scale.setScalar((B.R - S - 1) / B.R); m.userData.sys = 1;
    B.coarse = m; U.cms = Math.round(performance.now() - t0); U.cverts = (U.cverts || 0) + pos.length / 3; return m; };
  // ---------- save: only the blocks you changed ----------
  try { const se = serialize; serialize = function () { const o = se.apply(this, arguments); try { if (o && !DIM.cur) { const e = {}; for (const b of BS) if (b.edits.size) e[b.id] = Array.from(b.edits); o.c318 = {v: 1, e}; } } catch (e) { ERR('ser', e); } return o; }; } catch (e) { ERR('ser0', e); }
  try { const ew = enterWorld; enterWorld = function (save) { try { if (!DIM.cur) { const sv = save && save.c318; for (const b of BS) b.reset(); for (let i = BS.length - 1; i >= 0; i--) if (BS[i].d.cell) { delete BY[BS[i].id]; BS.splice(i, 1); } const se = sv && sv.e || {}; for (const k in se) { const m = /^c(-?\d+)_(-?\d+)_(-?\d+)$/.exec(k); if (m) cellOf(+m[1], +m[2], +m[3]); } for (const b of BS) b.edits = new Map(se[b.id] || []); } } catch (e) { ERR('ew', e); } return ew.apply(this, arguments); }; } catch (e) { ERR('ew0', e); }
})();
