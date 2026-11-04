/* GLX-C295 (v1.0.102): AGARTHA, life. The inner sky (a glowing central sun, warm mist and drifting sparkles), the silent Agarthans
   wandering the crystal city (one shared set of geometries, only drawn and moved when you are near) and Build Editor pieces
   for the tunnel, the city and each crystal tower. */
(function c295() {
  const U = window.__c295 = {err: null, inside: false, folk: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const L = () => window.__c294 && __c294.L;
  let root = null, sun = null, spark = null, folk = [], fogSave = null, built = null;
  const M = c => new THREE.MeshBasicMaterial({color: c});
  function make(l) { root = new THREE.Group(); root.visible = false; scene.add(root); const [X, Z] = l.city;
    sun = new THREE.Mesh(new THREE.SphereGeometry(l.v === 2 ? 6 : 4, 16, 12), M(0xfff1b8)); sun.position.set(X + .5, l.TOP - (l.v === 2 ? 9 : 6), Z + .5); root.add(sun);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(l.v === 2 ? 11 : 7, 16, 12), new THREE.MeshBasicMaterial({color: 0xffd27a, transparent: true, opacity: 0.25, depthWrite: false})); halo.position.copy(sun.position); root.add(halo);
    const N = 260, pos = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - .5) * 40;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    spark = new THREE.Points(g, new THREE.PointsMaterial({color: 0xbff4ff, size: 0.18, transparent: true, opacity: 0.8, depthWrite: false})); root.add(spark);
    // Agarthans: very tall and slender, all light blue clothes, bright blond hair, big glowing blue almond eyes. Silent, peaceful, permanent
    const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d), cloth = M(0x9fd4ff), skin = M(0xf0d6c0), hair = M(0xffe45c), eye = M(0x39b8ff);
    const G = {leg: bx(.16, 1.2, .16), body: bx(.42, .95, .24), arm: bx(.12, 1.0, .12), head: bx(.34, .42, .34), hair: bx(.38, .16, .38), back: bx(.38, .4, .08), eye: bx(.1, .05, .02)};
    let sd = l.city[0] * 31 + l.city[1]; const r = () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296;
    for (let k = 0; k < (l.v === 2 ? 26 : 16); k++) { const p = new THREE.Group(), mk = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); p.add(o); return o; };
      const lg = [mk(G.leg, cloth, -.1, .6, 0), mk(G.leg, cloth, .1, .6, 0)]; lg.forEach(o => o.geometry.translate && 0);
      mk(G.body, cloth, 0, 1.68, 0); const ar = [mk(G.arm, cloth, -.28, 1.65, 0), mk(G.arm, cloth, .28, 1.65, 0)];
      mk(G.head, skin, 0, 2.38, 0); mk(G.hair, hair, 0, 2.62, 0); mk(G.back, hair, 0, 2.36, -.19); mk(G.eye, eye, -.08, 2.42, .175); mk(G.eye, eye, .08, 2.42, .175);
      const a = r() * 6.283, d = 6 + r() * (l.city[2] - 14); p.position.set(X + Math.cos(a) * d, l.FL, Z + Math.sin(a) * d); root.add(p);
      folk.push({g: p, lg, ar, tx: p.position.x, tz: p.position.z, w: 0, ph: r() * 6}); }
    U.folk = folk.length; built = l; }
  const ground = (x, z, l) => { let y = l.FL + 30; const X = Math.floor(x), Z = Math.floor(z); while (y > l.FL - 2 && (!world[idx(X, y, Z)] || PLANT[world[idx(X, y, Z)]] || LEAFY[world[idx(X, y, Z)]])) y--; return y + 1; };
  const walkable = (x, z, l) => { const g = ground(x, z, l); return g <= l.FL + 1; };
  function step(dt, l) { const [X, Z, R] = l.city;
    for (const f of folk) { const p = f.g.position, dx = f.tx - p.x, dz = f.tz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.4 || f.w > 12) { f.w = 0; for (let t = 0; t < 6; t++) { const a = Math.random() * 6.283, rr = 5 + Math.random() * (R - 12); const tx = X + Math.cos(a) * rr, tz = Z + Math.sin(a) * rr; if (walkable(tx, tz, l)) { f.tx = tx; f.tz = tz; break; } } continue; }
      f.w += dt; const sp = 0.9 * dt, nx = p.x + dx / d * sp, nz = p.z + dz / d * sp;
      if (walkable(nx, nz, l)) { p.x = nx; p.z = nz; p.y += (ground(nx, nz, l) - p.y) * Math.min(1, dt * 8); } else f.w = 99;
      f.g.rotation.y = Math.atan2(dx, dz); f.ph += dt * 5; const s = Math.sin(f.ph) * 0.45; f.lg[0].rotation.x = s; f.lg[1].rotation.x = -s; f.ar[0].rotation.x = -s * .7; f.ar[1].rotation.x = s * .7; } }
  let last = performance.now(), acc = 0;
  (function loop() { requestAnimationFrame(loop); const t = performance.now(), dt = Math.min(0.1, (t - last) / 1000); last = t;
    try { const l = L(); if (!l || !started || (DIM.cur && DIM.cur !== 'agartha')) { if (root) root.visible = false; unfog(); return; }
      if (built !== l) { if (root) { scene.remove(root); folk = []; } make(l); }
      const [X, Z, R] = l.city, d = Math.hypot(P.x - X, P.z - Z), near = d < R + 60 && P.y < l.TOP + 8, inside = d < R + 2 && P.y < l.TOP;
      root.visible = near; U.inside = inside; if (!near) { unfog(); return; }
      step(dt, l); spark.position.set(P.x, P.y + 2, P.z); spark.rotation.y += dt * 0.05; const a = spark.geometry.attributes.position; for (let i = 1; i < a.count * 3; i += 3) { a.array[i] -= dt * 0.6; if (a.array[i] < -20) a.array[i] = 20; } a.needsUpdate = true;
      spark.visible = inside; sun.scale.setScalar(1 + Math.sin(t / 900) * 0.04);
      if (inside) fogOn(); else unfog(); } catch (e) { ERR('loop', e); } })();
  function fogOn() { const l2 = L(); try { if (!scene.fog || fogSave) return; fogSave = {c: scene.fog.color.getHex(), n: scene.fog.near, f: scene.fog.far}; } catch (_) {} try { scene.fog.color.setHex(0xe8c89a); scene.fog.near = 40; scene.fog.far = l2 && l2.v === 2 ? 320 : 140; } catch (_) {} }
  // v1.1.90: Agartha owns the haze while you are inside: it is set again just before each frame is drawn, so the cave haze can not fight it
  U.sky = () => { if (!U.inside || !scene.fog) return; const l2 = L(); scene.fog.color.setHex(0xe8c89a); scene.fog.near = 40; scene.fog.far = l2 && l2.v === 2 ? 320 : 140; if (scene.background && scene.background.isColor) scene.background.setHex(0xd9b98a); };
  function unfog() { if (!fogSave) return; try { scene.fog.color.setHex(fogSave.c); scene.fog.near = fogSave.n; scene.fog.far = fogSave.f; } catch (_) {} fogSave = null; }
  // Build Editor: Agartha pieces join the auto-found list when you are near
  setInterval(() => { try { const l = L(), B = window.__c290; if (!l || !B || !B.pieces) return; const add = [], [X, Z, R] = l.city;
      add.push({t: 'agartha_city', b: [X - R, 3, Z - R, X + R, l.TOP, Z + R]});
      for (const s of l.spires || []) add.push({t: 'agartha_tower', b: [s[0] - s[3] - 2, l.FL - 1, s[1] - s[3] - 2, s[0] + s[3] + 2, l.FL + s[2] + 1, s[1] + s[3] + 2]});
      for (const p of l.pts || []) add.push({t: 'agartha_tunnel', b: l.v === 2 ? [p[0] - 20, p[2] - 14, p[1] - 20, p[0] + 20, p[2] + 14, p[1] + 20] : [p[0] - 20, 8, p[1] - 20, p[0] + 20, 34, p[1] + 20]});
      for (const p of add) { const b = p.b, dx = Math.max(b[0] - P.x, 0, P.x - b[3] - 1), dy = Math.max(b[1] - P.y, 0, P.y - b[4] - 1), dz = Math.max(b[2] - P.z, 0, P.z - b[5] - 1); p.d = Math.hypot(dx, dy, dz); }
      const near = add.filter(p => p.d < 30); if (!near.length) return; const list = B.pieces.filter(p => !/^agartha_/.test(p.t)).concat(near).sort((a, b) => a.d - b.d).slice(0, 24); B.pieces = list; B.near = list[0] && list[0].d < 12 ? list[0] : null; } catch (e) { ERR('pc', e); } }, 1000);
})();
