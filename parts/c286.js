/* GLX-C286 (v1.0.94): the generator uses the published builds (assets/builds_default.json, or the local Builder Tool library in a
   world called test world). New Highlands worlds stay random - each croft house, the hag hut, river bridges and scattered landmarks
   use the prefab when one exists: set on the terrain, foundations filled to the ground, the space above cleared, turned to face the
   right way, bridges stretched by repeating the middle. No prefab = the original build. Saved worlds are never touched. */
(function c286() {
  const U = window.__c286 = {err: null, pub: null, ms: 0, placed: {}, sites: {}, src: null};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const C5 = () => window.__c285;
  async function load() { const base = 'assets/builds_default.json';
    try { const r = await fetch(base + '.gz', {cache: 'no-cache'}); if (r.ok && window.DecompressionStream) { const b = new Uint8Array(await r.arrayBuffer());
        const s = b[0] === 0x1f && b[1] === 0x8b ? new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip')) : new Blob([b]).stream(); return JSON.parse(await new Response(s).text()); } } catch (_) {}
    try { const r = await fetch(base, {cache: 'no-cache'}); if (r.ok) return await r.json(); } catch (_) {} return null; }
  U.ready = load().then(j => { U.pub = j && j.builds || null; }).catch(() => {});
  try { const cw = createWorld; createWorld = async function () { const a = arguments, t = this; try { await Promise.race([U.ready, new Promise(r => setTimeout(r, 3000))]); } catch (_) {} return cw.apply(t, a); }; } catch (e) { ERR('cw', e); }
  const TW = () => !!(current && String(current.name || '').trim().toLowerCase() === 'test world');
  function builds() { let L = Object.assign({}, U.pub || {}); U.src = U.pub ? 'pub' : null; if (TW() && C5()) { const loc = C5().lib(); if (Object.keys(loc).length) { Object.assign(L, loc); U.src = 'local'; } } return L; }
  const inB = (x, z) => x >= 1 && z >= 1 && x < W - 1 && z < D - 1;
  const SOFT = b => !b || LEAFY[b] || LOGGY[b] || PLANT[b] || b === T.SNOW;
  function top(x, z) { for (let y = H - 2; y > 0; y--) { const b = world[idx(x, y, z)]; if (!SOFT(b)) return y; } return 0; }
  const setW = (x, y, z, v) => { if (inB(x, z) && y > 0 && y < H - 1) world[idx(x, y, z)] = v; };
  // turn a prefab so its front faces dir (0 +z, 1 +x, 2 -z, 3 -x); returns a getter in turned coords
  function turned(pf, dir) { const u = C5().unb64(pf.b), r = ((dir - (pf.f || 0)) % 4 + 4) % 4, sx = pf.sx, sy = pf.sy, sz = pf.sz;
    const W2 = r % 2 ? sz : sx, D2 = r % 2 ? sx : sz;
    const at = (x, y, z) => { let X, Z; if (r === 0) { X = x; Z = z; } else if (r === 1) { X = sx - 1 - z; Z = x; } else if (r === 2) { X = sx - 1 - x; Z = sz - 1 - z; } else { X = z; Z = sz - 1 - x; }
      return u[(X * sy + Y(y)) * sz + Z]; }; const Y = y => y;
    return {w: W2, h: sy, d: D2, at}; }
  // stamp a turned prefab with its min corner at (x0, gy, z0): bottom layer = ground level
  function stamp(g, x0, gy, z0, opt) { opt = opt || {}; let n = 0;
    for (let x = 0; x < g.w; x++) for (let z = 0; z < g.d; z++) { const X = x0 + x, Z = z0 + z; if (!inB(X, Z)) continue; const t = top(X, Z), wet = world[idx(X, t + 1, Z)] === T.WATER;
      // clear above: hills and trees in the way
      for (let y = gy + g.h; y <= Math.max(t, gy + g.h) + 10 && y < H - 1; y++) { const b = world[idx(X, y, Z)]; if (b && (y <= t || SOFT(b))) setW(X, y, Z, 0); }
      let low = -1; for (let y = 0; y < g.h; y++) { const v = g.at(x, y, z); if (v && low < 0) low = y; if (!v && opt.keepWater && world[idx(X, gy + y, Z)] === T.WATER) continue; setW(X, gy + y, Z, v); if (v) n++; }
      // foundations down to the ground (not into rivers for bridges)
      if (low === 0 && !(opt.bridge && wet)) { const fb = g.at(x, 0, z), fill = fb === T.GRASS || fb === T.DIRT ? T.DIRT : fb === T.SAND ? T.SAND : T.COBBLE; for (let y = gy - 1; y > t && y > 0; y--) setW(X, y, Z, fill); } }
    return n; }
  U.stamp = stamp; U.turned = turned;
  function groundAt(x0, z0, w, d) { const a = []; for (let x = x0; x < x0 + w; x += 2) for (let z = z0; z < z0 + d; z += 2) if (inB(x, z)) a.push(top(x, z)); a.sort((p, q) => p - q); return a.length ? a[a.length >> 1] : SEA + 2; }
  // ---------- crofts ----------
  function crofts(pf) { const F = (window.__c113 && __c113.farmsList && __c113.farmsList()) || []; let n = 0;
    for (const f of F) { const {x0, z0, gy} = f; for (let x = x0 - 1; x <= x0 + 7; x++) for (let z = z0 - 1; z <= z0 + 6; z++) { for (let y = gy + 1; y <= gy + 7; y++) setW(x, y, z, 0); setW(x, gy, z, T.GRASS); }
      const g = turned(pf, 0), cx = x0 + 3, cz = z0 + 6 - g.d;  // front edge lines up with the old door (field side)
      stamp(g, cx - (g.w >> 1), gy, cz, {}); n++; }
    return n; }
  // ---------- the hag hut ----------
  function hut(pf) { const S = window.__c142 && __c142.st && __c142.st.hut; if (!Array.isArray(S) || S.length < 3) return 0; const [hx, fy, hz] = S;
    for (let x = hx - 5; x <= hx + 5; x++) for (let z = hz - 5; z <= hz + 5; z++) for (let y = fy + 1; y <= fy + 10; y++) setW(x, y, z, 0);
    let dir = 0; try { const bc = (g9castles || []).find(c => c[0] === 'black'); if (bc) { const dx = bc[1] - hx, dz = bc[2] - hz; dir = Math.abs(dz) >= Math.abs(dx) ? (dz >= 0 ? 0 : 2) : (dx >= 0 ? 1 : 3); } } catch (_) {}
    const g = turned(pf, dir); stamp(g, hx - (g.w >> 1), fy, hz - (g.d >> 1), {}); return 1; }
  // ---------- landmarks: 3 flat dry spots away from spawn and each other ----------
  function landmarks(pf) { const g = turned(pf, 0), out = [], sx = W >> 1, sz = D >> 1; let seed = (window.gSeed || 7) * 9301 + 49297;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let k = 0; k < 400 && out.length < 3; k++) { const x0 = 20 + Math.floor(rnd() * (W - 40 - g.w)), z0 = 20 + Math.floor(rnd() * (D - 40 - g.d));
      if (Math.hypot(x0 - sx, z0 - sz) < 70 || out.some(o => Math.hypot(o[0] - x0, o[1] - z0) < 90)) continue;
      try { if (window.__c273 && __c273.on && __c273.on() && __c273.edgeQ && __c273.edgeQ(x0, z0) > __c273.RE() - 70) continue; } catch (_) {}
      let lo = 1e9, hi = -1, bad = false; for (let x = x0; x < x0 + g.w && !bad; x += 2) for (let z = z0; z < z0 + g.d; z += 2) { const t = top(x, z); if (t <= SEA + 1 || world[idx(x, t + 1, z)] === T.WATER || world[idx(x, t, z)] === T.WATER) { bad = true; break; } lo = Math.min(lo, t); hi = Math.max(hi, t); }
      if (bad || hi - lo > 3) continue; const dir = Math.floor(rnd() * 4), gg = turned(pf, dir); stamp(gg, x0, groundAt(x0, z0, gg.w, gg.d), z0, {}); out.push([x0, z0]); }
    U.sites.landmark = out; return out.length; }
  // ---------- bridges: find river / loch gaps along x and z, span them, stretch the middle ----------
  function span(pf, len) { const along = pf.sx >= pf.sz ? 'x' : 'z', L = along === 'x' ? pf.sx : pf.sz; if (len === L) return pf; const e = Math.max(1, Math.floor(L / 3)); if (len < 2 * e + 1) return null;
    const u = C5().unb64(pf.b), map = []; for (let i = 0; i < len; i++) map.push(i < e ? i : i >= len - e ? L - (len - i) : e + (i - e) % Math.max(1, L - 2 * e));
    const sx = along === 'x' ? len : pf.sx, sz = along === 'z' ? len : pf.sz, o = new Uint8Array(sx * pf.sy * sz);
    for (let x = 0; x < sx; x++) for (let y = 0; y < pf.sy; y++) for (let z = 0; z < sz; z++) { const X = along === 'x' ? map[x] : x, Z = along === 'z' ? map[z] : z; o[(x * pf.sy + y) * sz + z] = u[(X * pf.sy + y) * pf.sz + Z]; }
    return Object.assign({}, pf, {sx, sz, b: C5().b64(o)}); }
  U.span = span;
  function bridges(pf) { const out = [], along = pf.sx >= pf.sz ? 'x' : 'z', wid = along === 'x' ? pf.sz : pf.sx, sx0 = W >> 1, sz0 = D >> 1;
    const wet = (x, z) => { const t = top(x, z); return world[idx(x, t + 1, z)] === T.WATER || world[idx(x, t, z)] === T.WATER; };
    for (let pass = 0; pass < 2; pass++) for (let a = 24; a < (pass ? W : D) - 24 && out.length < 6; a += 6) { let run = 0;
      for (let b = 24; b < (pass ? D : W) - 24; b++) { const x = pass ? a : b, z = pass ? b : a; if (wet(x, z)) { run++; continue; }
        if (run >= 3 && run <= 22) { const x1 = pass ? x : x - run - 1, z1 = pass ? z - run - 1 : z; if (!wet(x1, z1)) { const t0 = top(x1, z1), t1 = top(x, z);
            if (Math.abs(t0 - t1) <= 2 && t0 > SEA && !out.some(o => Math.hypot(o[0] - x, o[1] - z) < 110) && Math.hypot(x - sx0, z - sz0) > 40) {
              const len = run + 4, p2 = span(pf, len); if (p2) { const dir = pass ? 0 : 1, g = turned(Object.assign({}, p2, {f: 0}), (along === 'x') === !pass ? 0 : 1), gy = Math.max(t0, t1);
                const X0 = pass ? x - (g.w >> 1) : x1 - 1, Z0 = pass ? z1 - 1 : z - (g.d >> 1); stamp(g, X0, gy, Z0, {bridge: 1, keepWater: 1}); out.push([x, z, len, dir]); } } } }
        run = 0; } }
    U.sites.bridge = out; return out.length; }
  U.find = {crofts, hut, landmarks, bridges};
  function apply() { const L = builds(), t0 = performance.now(); U.placed = {}; if (!Object.keys(L).length) return;
    for (const [k, fn] of [['croft', crofts], ['hut', hut], ['bridge', bridges], ['landmark', landmarks]]) if (L[k]) try { U.placed[k] = fn(L[k]); } catch (e) { ERR(k, e); }
    U.ms = Math.round(performance.now() - t0); try { dirtyAll = true; } catch (_) {} }
  U.apply = apply;
  try { const gen = generate; generate = function () { const r = gen.apply(this, arguments); try { if (!DIM.cur && window.__g89 && __g89()) apply(); } catch (e) { ERR('gen', e); } return r; }; } catch (e) { ERR('gw', e); }
})();
