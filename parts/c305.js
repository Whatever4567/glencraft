/* GLX-C305 (v1.0.114): THE SOLAR SYSTEM. One list of bodies (add a planet = add one line). Every planet is drawn as a blocky VOXEL ball (one merged
   mesh of only the outside faces, vertex coloured from the reference colour grids in C305P), so the whole system is a handful of draw calls.
   Space coordinates are the overworld's own (the Highlands map sits on top of the Earth ball). The Moon is where the sky moon is: the same
   direction from the map as the moon disc in the sky (opposite the sun, follows the day clock), and the sky moon disc is painted from the voxel moon. */
(function c305() {
  const U = window.__c305 = {err: null, built: 0, faces: 0, list: null};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  // id, name, colour grid, radius (blocks), voxel radius, offset from the map centre, flags. land: a real voxel planet you can land on (C306).
  const SYS = U.SYS = [
    {id: 'sun', name: 'The Sun', pal: 'material', r: 520, n: 14, at: [-6500, 1500, -3000], glow: 1, no: 'Far too hot to land - the rocket turns back'},
    {id: 'mercury', name: 'Mercury', pal: 'mercury', r: 70, n: 6, at: [-4600, 1300, -1900], no: 'Mercury is scorching - no landing yet'},
    {id: 'venus', name: 'Venus', pal: 'venus', r: 150, n: 9, at: [-3300, 1200, 800], no: 'Venus is all crushing acid cloud - no landing yet'},
    {id: 'earth', name: 'Earth', pal: 'earth', r: 1400, n: 24, at: [0, -1500, 0], home: 1},
    {id: 'moon', name: 'The Moon', pal: 'moon', r: 110, n: 10, moon: 3600, land: {g: 0.17, size: 192}},
    {id: 'mars', name: 'Mars', pal: 'mars', r: 260, n: 14, at: [100, 1800, 3600], land: {g: 0.38, size: 288}},
    {id: 'jupiter', name: 'Jupiter', pal: 'jupiter', r: 900, n: 18, at: [5800, 2600, -5100], no: 'Jupiter is a gas giant - nothing to land on'},
    {id: 'saturn', name: 'Saturn', pal: 'saturn', r: 750, n: 16, at: [-4400, 2400, 9000], ring: 'saturn_ring', no: 'Saturn is a gas giant - nothing to land on'},
    {id: 'uranus', name: 'Uranus', pal: 'uranus', r: 420, n: 13, at: [9000, 2000, 4000], no: 'Uranus is an ice giant - no landing yet'},
    {id: 'neptune', name: 'Neptune', pal: 'neptune', r: 400, n: 13, at: [-10500, 2200, 6000], no: 'Neptune is an ice giant - no landing yet'},
    {id: 'pluto', name: 'Pluto', pal: 'pluto', r: 60, n: 5, at: [10500, 1500, -10000], no: 'Pluto is too far from home to land - for now'}];
  // v1.1.23: only the planets you can land on (plus Earth, and the Sun as the light only)
  for (let i = SYS.length - 1; i >= 0; i--) if (!['sun', 'earth', 'moon', 'mars'].includes(SYS[i].id)) SYS.splice(i, 1);
  U.BOUND = 12000;   // deep space reaches 12000 blocks out from the map each way (24000 x 24000)
  const E0 = () => ({x: W >> 1, y: 0, z: D >> 1});
  U.E0 = () => (DIM.cur ? {x: 432, y: 0, z: 432} : E0());
  U.moonDir = () => { const a = (typeof dayClock !== 'undefined' ? dayClock / CYCLE : 0) * Math.PI * 2, x = -Math.cos(a), y = -Math.sin(a), z = -1 / 3, l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
  U.pos = b => { const e = U.E0(); if (b.moon) { const d = U.moonDir(); return {x: e.x + d[0] * b.moon, y: e.y + d[1] * b.moon, z: e.z + d[2] * b.moon}; } return {x: e.x + b.at[0], y: e.y + b.at[1], z: e.z + b.at[2]}; };
  U.get = id => SYS.find(b => b.id === id);
  const grid = k => { const s = atob((window.__SSPAL || {})[k] || ''), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a.length ? a : null; };
  const col = (g, x, y, z) => { if (!g) return [0.6, 0.6, 0.6]; const u = (Math.atan2(z, x) / 6.2832 + 0.5) % 1, v = 0.5 - Math.asin(Math.max(-1, Math.min(1, y / (Math.hypot(x, y, z) || 1)))) / Math.PI;
    const i = (Math.min(15, Math.floor(v * 16)) * 32 + Math.min(31, Math.floor(u * 32))) * 3; return [g[i] / 255, g[i + 1] / 255, g[i + 2] / 255]; };
  const FACE = [[1, 0, 0, 0.82], [-1, 0, 0, 0.82], [0, 1, 0, 1], [0, -1, 0, 0.6], [0, 0, 1, 0.9], [0, 0, -1, 0.72]];
  function voxGeo(n, g, solid, extra) { const pos = [], cl = [], s = n + 1, has = (x, y, z) => solid(x, y, z);
    for (let x = -s; x <= s; x++) for (let y = -s; y <= s; y++) for (let z = -s; z <= s; z++) { if (!has(x, y, z)) continue; const c = col(g, x, y, z);
      for (const [fx, fy, fz, sh] of FACE) { if (has(x + fx, y + fy, z + fz)) continue; const q = [];
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { let px, py, pz; if (fx) { px = fx; py = a; pz = b * fx; } else if (fy) { py = fy; px = b * fy; pz = a; } else { pz = fz; px = a * fz; py = b; } q.push([x + px * 0.5, y + py * 0.5, z + pz * 0.5]); }
        for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(...q[k]); cl.push(c[0] * sh, c[1] * sh, c[2] * sh); } U.faces++; } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); geo.computeBoundingSphere(); return geo; }
  function make(b) { const g = grid(b.pal), n = b.n, grp = new THREE.Group(), m = new THREE.MeshBasicMaterial({vertexColors: true, fog: false});
    const mesh = new THREE.Mesh(voxGeo(n, g, (x, y, z) => x * x + y * y + z * z <= n * n + n * 0.6), m); mesh.scale.setScalar(b.r / n); mesh.frustumCulled = false; grp.add(mesh);
    if (b.ring) { const rg = grid(b.ring), rn = Math.round(n * 0.5), r0 = 1.3 * n / 2, r1 = 2.2 * n / 2, ring = new THREE.Mesh(voxGeo(rn * 2 + 2, rg, (x, y, z) => { const d = Math.hypot(x, z); return y === 0 && d >= r0 && d <= r1; }), m);
      ring.scale.setScalar(b.r / n * 2); ring.rotation.z = 0.35; ring.frustumCulled = false; grp.add(ring); }
    if (b.glow) { const h = new THREE.Mesh(new THREE.SphereGeometry(b.r * 1.6, 16, 12), new THREE.MeshBasicMaterial({color: 0xffc060, transparent: true, opacity: 0.18, depthWrite: false, fog: false})); grp.add(h); }
    grp.visible = false; scene.add(grp); b.g = grp; b.mesh = mesh; }
  U.build = () => { if (U.list) return; const t = performance.now(); for (const b of SYS) make(b); U.list = SYS; U.built = Math.round(performance.now() - t); };
  // show the system (space) or hide it
  U.show = (on, cam) => { if (on && !U.list) U.build(); if (!U.list) return; for (const b of SYS) { if (!on) { b.g.visible = false; continue; } const p = U.pos(b); b.g.position.set(p.x, p.y, p.z); b.g.visible = b.id !== 'sun'; b.g.rotation.y += 0.0004; } };
  U.surf = (b, v) => { const p = U.pos(b); return Math.hypot(v.x - p.x, v.y - p.y, v.z - p.z) - b.r; };
  U.nearest = v => { let best = null, bd = 1e9; for (const b of SYS) { const d = U.surf(b, v); if (d < bd) { bd = d; best = b; } } return [best, bd]; };
  // ---------- the sky moon IS this moon: its disc is painted from the voxel moon ----------
  let skyTex = null;
  function paintSky() { const g = grid('moon'); if (!g) return null; const N = 20, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d');
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const u = (i + 0.5) / N * 2 - 1, v = (j + 0.5) / N * 2 - 1, r2 = u * u + v * v; if (r2 > 1) continue; const w = Math.sqrt(1 - r2), k = col(g, u, -v, w);
      const sh = 0.75 + 0.25 * w; x.fillStyle = 'rgb(' + (k[0] * 255 * sh | 0) + ',' + (k[1] * 255 * sh | 0) + ',' + (k[2] * 255 * sh | 0) + ')'; x.fillRect(i, j, 1, 1); }
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; return t; }
  setInterval(() => { try { if (typeof moonDisc === 'undefined') return; if (!skyTex) skyTex = paintSky(); if (skyTex && moonDisc.material.map !== skyTex) { moonDisc.material.map = skyTex; moonDisc.material.transparent = true; moonDisc.material.needsUpdate = true; U.skyMoon = 1; } } catch (e) { ERR('sky', e); } }, 1500);
})();
