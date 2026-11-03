/* GLX-C345 (v1.1.49): REGIONAL GROUND ACROSS THE UK AND IRELAND. Out past the Scotland map the real block ground now changes with the
   region: peat bogs in Ireland, black basalt under the Antrim hills, slate hills in Wales, heather moors on the Pennines and the Lake
   District, granite moors in Devon and Cornwall, white chalk downs and chalk cliffs in the south east, muddy fens in East Anglia and red
   sandstone under the Midlands. The far ground drawn from the air uses the same blocks, so the colours match. */
(function c345() {
  const U = window.__c345 = {err: null, on: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  // region from latitude and longitude (only south of the Scottish border, so the Scotland map is untouched)
  function reg(lat, lon) {
    if (lat < 55.35 && lon < -5.45) return lat > 54.55 && lon > -6.6 ? 35 : 30;
    if (lat > 55.0) return 0;
    if (lat > 54.2 && lat < 54.8 && lon > -3.6 && lon < -2.6) return 33;
    if (lat > 51.35 && lat < 53.45 && lon < -2.95 && lon > -5.4) return 31;
    if (lat < 50.95 && lon < -3.35) return 37;
    if (lat > 53.1 && lat < 55.0 && lon > -2.65 && lon < -1.4) return 33;
    if (lat > 52.0 && lat < 53.1 && lon > -0.45 && lon < 1.9) return 34;
    if (lat < 51.65 && lon > -2.4) return 32;
    if (lat > 52.0 && lat < 53.4 && lon > -2.9 && lon < -0.45) return 36;
    return 0; }
  U.reg = reg;
  const G = () => T.GRASS, ST = () => T.STONE;
  function lay(kind, dd, g) {
    switch (kind) {
      case 30: return g < 14 ? (dd < 2 ? T.PEAT : dd < 4 ? T.MUD : ST()) : (dd < 1 ? G() : dd < 3 ? T.DIRT : ST());
      case 35: return dd < 1 ? G() : dd < 3 ? T.DIRT : (T.BLACKSTONE || ST());
      case 31: return g > 22 ? (dd < 1 ? (T.SLATE || ST()) : (T.SLATE || ST())) : dd < 1 ? G() : dd < 3 ? T.DIRT : (T.SLATE || ST());
      case 33: return g > 12 ? (dd < 1 ? (T.HEATHER || G()) : dd < 3 ? T.PEAT : ST()) : dd < 1 ? G() : dd < 3 ? T.DIRT : ST();
      case 37: return g > 12 ? (dd < 1 ? (T.HEATHER || G()) : ST()) : dd < 1 ? G() : dd < 3 ? T.DIRT : ST();
      case 32: return g <= 4 ? (T.WSTONE || ST()) : dd < 1 ? G() : dd < 2 ? T.DIRT : (T.WSTONE || ST());
      case 34: return g < 4 ? (dd < 3 ? T.MUD : ST()) : dd < 1 ? G() : dd < 4 ? T.DIRT : ST();
      case 36: return dd < 1 ? G() : dd < 3 ? T.DIRT : (T.SANDSTONE || ST()); }
    return 0; }
  U.lay = lay;
  // the held map: the whole UK and Ireland, worked out from the same ground, a few rows at a time
  const UK = U.uk = {cv: document.createElement('canvas'), N: 512, row: 0, done: 0, X0: 0, Z0: 0, S: 1, k: ''};
  function frame() { const c = __c339, K = c.K, xz = (lat, lon) => [(W >> 1) + (lon - c.LON0) * K * Math.cos(lat * Math.PI / 180), (D >> 1) + (c.LAT0 - lat) * K];
    const a = xz(61.0, -11), b = xz(49.8, -11), d = xz(49.8, 2.2), f = xz(61, 2.2); const x0 = Math.min(a[0], b[0]), x1 = Math.max(d[0], f[0]), z0 = a[1], z1 = b[1];
    const S = Math.max(x1 - x0, z1 - z0); UK.S = S; UK.X0 = (x0 + x1) / 2 - S / 2; UK.Z0 = (z0 + z1) / 2 - S / 2; }
  function ukRows(ms) { const e = window.__c320, c = window.__c339; if (!UK.want || !e || !e.g345 || !c || !c.fll || UK.done) return; const N = UK.N; if (!UK.row) { frame(); UK.cv.width = UK.cv.height = N; UK.g = UK.cv.getContext('2d'); UK.im = UK.g.createImageData(N, N); }
    const t0 = performance.now(), px = UK.im.data, s = UK.S / N;
    while (UK.row < N && performance.now() - t0 < ms) { const j = UK.row++; for (let i = 0; i < N; i++) { const x = UK.X0 + (i + 0.5) * s, z = UK.Z0 + (j + 0.5) * s, o = (j * N + i) * 4; let col;
        try { const q = e.ground(x, SEA, z, 0, 1, 0), g = q[0]; if (g <= 0) col = __seaCol(Math.min(8, -g));
          else { const b = e.layer(e.R || 5000, 0.5, q[1], x, SEA + g, z); col = BC(b, q[1]); const sh = 0.86 + 0.24 * Math.min(1, g / 50); col = col.map(v => v * sh); } } catch (_) { col = __seaCol(8); }
        px[o] = col[0]; px[o + 1] = col[1]; px[o + 2] = col[2]; px[o + 3] = 255; } }
    if (UK.row >= N) { UK.g.putImageData(UK.im, 0, 0); UK.done = 1; U.ukT = performance.now(); } }
  const BCC = {}; function BC(b, k) { if (k === 2) return [236, 240, 246]; if (BCC[b]) return BCC[b]; const P = {[T.GRASS]: [112, 178, 76], [T.HEATHER]: [150, 104, 150], [T.PEAT]: [96, 76, 58], [T.MUD]: [110, 90, 64], [T.SAND]: [232, 214, 150], [T.STONE]: [150, 150, 146], [T.LAVA]: [235, 95, 25]};
    let c = P[b]; if (!c) { try { const f = FACES[b], t = Array.isArray(f) ? f[2] : f, h = AVG[t]; c = h !== undefined ? [(h >> 16) & 255, (h >> 8) & 255, h & 255] : [120, 140, 100]; } catch (_) { c = [120, 140, 100]; } } return BCC[b] = c; }
  setInterval(() => { try { ukRows(6); } catch (er) { ERR('uk', er); } }, 60);
  setInterval(() => { try { const e = window.__c320; if (!e || !e.g342 || e.g345 || !window.__c339 || !__c339.fll) return; e.g345 = 1; U.on = 1;
      const g0 = e.ground, l0 = e.layer;
      e.ground = function (x, y, z) { const q = g0.apply(this, arguments); try { if (!e.flat || !q || q[0] <= 0) return q; const k = q[1]; if (k !== 1 && k !== 10 && k !== 11 && k !== 0) return q;
          if (x >= 0 && z >= 0 && x < W && z < D) return q; const ll = __c339.fll(x, z), r = reg(ll[0], ll[1]); if (!r) return q; if (k === 0 && r !== 32) return q;
          return [q[0], r + 0 * 0, q[2]]; } catch (er) { ERR('g', er); return q; } };
      e.layer = function (r, dd, kind, x, y, z) { if (kind >= 30 && kind <= 37) { const g = y - SEA + dd; const b = lay(kind, dd, g); if (b) return b; } return l0.apply(this, arguments); };
      try { __c339.fresh && __c339.fresh(); } catch (_) {} } catch (er) { ERR('hook', er); } }, 900);
})();
