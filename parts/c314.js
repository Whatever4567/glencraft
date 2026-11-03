/* GLX-C314 (v1.1.25): ONE CONTINUOUS WORLD.
   - Earth from space is the real map: a low detail mesh of the WHOLE world (mainland, islands, the north ice and the ice wall rim) built from
     its own blocks, no render cutoff. It is a floating slab: the sides show the layers of rock (soil, stone, deep slate, bedrock) and the
     underside is bare rock. Parts that change (lava, the volcano, your builds) are rebuilt a piece at a time while it is on screen, and lava
     glows so an eruption shows from the Moon.
   - No fake space layer: the firmament sheet and the flat map picture are gone. Jetpack straight up and above 700 blocks space takes over
     (no gravity, jetpack steering). Come back down over the map and normal gravity catches you. Walk off the outer edge of the world and you
     float off into space instead of dying. Fly at the Moon or Mars and their gravity pulls you in and you land on them.
   - Mine and place on the Moon and Mars with the normal buttons: mouse, controller triggers and touch.
   - TELEPORT in the pause menu: Earth spawn, the Moon or Mars.
   - Floating origin: far out in space the scene is drawn around the camera, so nothing shakes at huge distances. */
(function c314() {
  const U = window.__c314 = {err: null, tiles: 0, verts: 0, rebuilt: 0, evaIn: 0, evaOut: 0, landed: 0, edge: 0, tps: 0, mined: 0, placed: 0, shift: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const M8 = () => window.__c308, PD = () => window.__c306, R9 = () => window.__c299, UF = () => window.__c309;
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent) || (typeof PERF !== 'undefined' && PERF);
  const Z0 = () => (typeof __XG !== 'undefined' && __XG && typeof __XZ !== 'undefined') ? __XZ : 0;
  // ---------- the Earth slab ----------
  const G = new THREE.Group(); G.userData.sys = 1; G.visible = false; G.renderOrder = -1; (window.__c317 ? __c317.FAR : scene).add(G);
  const MAT = new THREE.MeshBasicMaterial({vertexColors: true, fog: false}), MAT2 = new THREE.MeshBasicMaterial({vertexColors: true, fog: false, side: THREE.DoubleSide});
  const CC = {}; const rgb = h => [(h >> 16) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
  function colB(b, wet) { if (wet) return [0.2, 0.42, 0.7]; if (CC[b]) return CC[b]; let c = null;
    if (b === T.LAVA) c = [1, 0.48, 0.12]; else if (b === T.GRASS) c = [0.36, 0.58, 0.24]; else if (/snow|ice/i.test(NAMES[b] || '')) c = [0.92, 0.95, 0.98];
    else { try { const f = FACES[b], k = f && [].concat(f)[0], a = AVG[k]; if (a !== undefined) c = rgb(a); } catch (_) {} }
    if (!c) return [0.5, 0.5, 0.5]; return (CC[b] = c); }
  function sample(x, z) { // [height, colour, lava]
    if (z >= 0) { if (x < 0 || x >= W || z >= D) return [0, [0, 0, 0], 0]; for (let y = H - 1; y > 0; y--) { const b = world[idx(x, y, z)]; if (!b) continue; if (b === T.WATER) { let yy = y; while (yy > 0 && world[idx(x, yy, z)] === T.WATER) yy--; return [y + 1, colB(0, 1), 0]; }
        if (typeof PLANT !== 'undefined' && PLANT[b] && !/leaf|leaves/i.test(NAMES[b] || '')) continue; return [y + 1, colB(b), b === T.LAVA ? 1 : 0]; } return [1, [0.2, 0.2, 0.2], 0]; }
    try { for (let y = 90; y > 0; y--) { const b = __XG(x, y, z); if (b) return [y + 1, b === T.WATER ? colB(0, 1) : colB(b), 0]; } } catch (_) {} return [SEA, [0.88, 0.92, 0.96], 0]; }
  const TL = [];  // tiles: {x0, z0, x1, z1, s, mesh, lava}
  function tile(t) { const s = t.s, nx = Math.ceil((t.x1 - t.x0) / s) + 1, nz = Math.ceil((t.z1 - t.z0) / s) + 1, pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), lava = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const x = Math.min(t.x1 - 1, t.x0 + i * s), z = Math.min(t.z1 - 1, t.z0 + j * s), q = sample(x, z), k = (i * nz + j) * 3, sh = 0.9 + ((x * 7 + z * 13) % 5) * 0.025;
      pos[k] = t.x0 + Math.min(i * s, t.x1 - t.x0); pos[k + 1] = q[0] - 0.4; pos[k + 2] = t.z0 + Math.min(j * s, t.z1 - t.z0); col[k] = q[1][0] * sh; col[k + 1] = q[1][1] * sh; col[k + 2] = q[1][2] * sh; if (q[2]) lava.push(x + 0.5, q[0] + 1, z + 0.5); }
    const ix = []; for (let i = 0; i < nx - 1; i++) for (let j = 0; j < nz - 1; j++) { const a = i * nz + j, b = a + nz; ix.push(a, a + 1, b, b, a + 1, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(ix); g.computeBoundingSphere();
    if (t.mesh) { G.remove(t.mesh); t.mesh.geometry.dispose(); } const m = new THREE.Mesh(g, MAT); m.userData.sys = 1; m.frustumCulled = false; G.add(m); t.mesh = m; t.lava = lava; U.verts += nx * nz; }
  // sides with rock layers + the bare underside
  const LAY = [[0, [0.12, 0.11, 0.12]], [6, [0.2, 0.19, 0.22]], [24, [0.3, 0.3, 0.33]], [SEA - 6, [0.46, 0.45, 0.44]]];
  let SIDE = null;
  function sides() { if (SIDE) { G.remove(SIDE); SIDE.geometry.dispose(); } const z0 = Z0(), pos = [], col = [], s = 8;
    const edge = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / s); for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, x0 = ax + (bx - ax) * t0, z0_ = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
        const h0 = sample(Math.min(W - 1, Math.max(0, Math.floor(x0))), Math.min(D - 1, Math.floor(z0_)))[0], h1 = sample(Math.min(W - 1, Math.max(0, Math.floor(x1))), Math.min(D - 1, Math.floor(z1)))[0];
        const lv = LAY.map(l => l[0]).concat([Math.min(h0, h1) - 4, Math.min(h0, h1)]).sort((a, b) => a - b), cAt = y => { let c = LAY[0][1]; for (const l of LAY) if (y >= l[0]) c = l[1]; return y >= Math.min(h0, h1) - 4 ? [0.42, 0.3, 0.18] : c; };
        for (let k = 0; k < lv.length - 1; k++) { const ya = lv[k], yb = k === lv.length - 2 ? null : lv[k + 1]; const c = cAt(ya); const y0a = ya, y0b = ya, y1a = yb === null ? h0 : yb, y1b = yb === null ? h1 : yb; if (y1a <= y0a && y1b <= y0b) continue;
          for (const v of [[x0, y0a, z0_], [x1, y0b, z1], [x1, y1b, z1], [x0, y0a, z0_], [x1, y1b, z1], [x0, y1a, z0_]]) { pos.push(...v); col.push(...c); } } } };
    edge(0, z0, W, z0); edge(W, z0, W, D); edge(W, D, 0, D); edge(0, D, 0, z0);
    for (const v of [[0, 0, z0], [W, 0, z0], [W, 0, D], [0, 0, z0], [W, 0, D], [0, 0, D]]) { pos.push(...v); col.push(0.1, 0.09, 0.1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeBoundingSphere();
    SIDE = new THREE.Mesh(g, MAT2); SIDE.userData.sys = 1; SIDE.frustumCulled = false; G.add(SIDE); }
  // lava glow (an eruption shows from the Moon)
  const GL = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), q = x.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(255,220,120,1)'); q.addColorStop(0.3, 'rgba(255,120,30,.7)'); q.addColorStop(1, 'rgba(255,60,0,0)'); x.fillStyle = q; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const GLM = new THREE.PointsMaterial({map: GL, size: 26, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false}); let GP = null;
  function glow() { const a = []; for (const t of TL) for (let i = 0; i < t.lava.length; i += 3 * 3) a.push(t.lava[i], t.lava[i + 1], t.lava[i + 2]);
    try { const v = window.__vol || window.__c262 || null; if (v && (v.erupt || v.on) && v.x !== undefined) for (let k = 0; k < 8; k++) a.push(v.x, (v.y || SEA + 40) + k * 9, v.z); } catch (_) {}
    if (GP) { G.remove(GP); GP.geometry.dispose(); GP = null; } if (!a.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); GP = new THREE.Points(g, GLM); GP.userData.sys = 1; GP.frustumCulled = false; G.add(GP); }
  let built = false, rr = 0, lastRe = 0;
  function build() { const t = performance.now(), s = PH ? 6 : 4, z0 = Z0(); TL.length = 0; U.verts = 0;
    for (let x = 0; x < W; x += 216) for (let z = 0; z < D; z += 216) TL.push({x0: x, z0: z, x1: Math.min(W, x + 216), z1: Math.min(D, z + 216), s, live: 1});
    for (let x = 0; x < W; x += 432) for (let z = z0; z < 0; z += 300) TL.push({x0: x, z0: z, x1: Math.min(W, x + 432), z1: Math.min(0, z + 300), s: 12});
    for (const q of TL) tile(q); /* v1.1.29: no cliff sides, the continent sits on the round Earth (C320) */ glow(); built = true; U.tiles = TL.length; U.ms = Math.round(performance.now() - t); }
  U.rebuild = () => { built = false; };
  const seeEarth = c => !DIM.cur && !!window.__c317 && __c317.space;
  // ---------- render: show the slab, far plane, floating origin ----------
  try { const rd = renderer.render; renderer.render = function (s, c) { if (s !== scene || !started) return rd.apply(this, arguments); let far0 = 0;
      try { const on = seeEarth(c); if (on && !built) build(); G.visible = on && built && !(window.__c320 && __c320.flat);
        if (G.visible) { const now = performance.now(); if (now - lastRe > 1800) { lastRe = now; const live = TL.filter(t => t.live); if (live.length) { tile(live[rr++ % live.length]); if (rr % live.length === 0) glow(); U.rebuilt++; } }
        }
      } catch (e) { ERR('rw', e); }
      try { return rd.apply(this, arguments); } finally { if (far0) { c.far = far0; c.updateProjectionMatrix(); } } }; } catch (e) { ERR('rw0', e); }
  // ---------- teleport ----------
  function tp(where) { try { const uf = UF(), m8 = M8(), pd = PD(); if (DIM.cur) { toast('Go back to the overworld first'); return; } if (R9() && R9().on) { toast('Get out of the rocket first'); return; }
      if (uf && uf.on) { uf.on = false; window.__spaceHud = null; } if (pd) pd.eva = false; if (window.__c321) __c321.leave(); if (m8 && m8.mode === 'moon') m8.stop(); window.__spaceHud = null;
      if (where === 'earth') { const x = Math.floor(W / 2), z = Math.floor(D / 2); P.x = x + 0.5; P.z = z + 0.5; P.y = (R9() && R9().topAt ? R9().topAt(x, z) : groundTop(x, z) + 1) + 0.05; P.vy = 0; P.fallTop = null; try { camera.up.set(0, 1, 0); } catch (_) {} }
      else if (!(window.__c317 && __c317.on())) { toast('This world is the old small map with no space. Reset world to get the big map and space'); return; }
      else { const t = window.__c318 && __c318.top(where); if (!t) { toast('Could not find the ground there'); return; } if (window.__c321) __c321.leave(); P.x = t[0]; P.y = t[1]; P.z = t[2]; P.vy = 0; P.fallTop = null; try { __c317.soft = true; } catch (_) {} }
      U.tps++; try { setPause(false); } catch (_) {} ov.style.display = 'none'; toast(where === 'earth' ? 'Home - Earth spawn' : where === 'moon' ? 'The Moon' : 'Mars'); } catch (e) { ERR('tp', e); } }
  U.tp = tp;
  const ov = document.createElement('div'); ov.style.cssText = 'position:fixed;inset:0;z-index:300;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55)';
  ov.innerHTML = '<div class="panel" style="text-align:center;min-width:260px"><h2 style="margin:0 0 12px">Teleport</h2></div>'; const pn = ov.firstChild;
  for (const [k, t] of [['earth', 'Earth spawn'], ['moon', 'The Moon'], ['mars', 'Mars'], ['x', 'Cancel']]) { const b = document.createElement('button'); b.className = 'btn' + (k === 'x' ? ' alt' : ''); b.textContent = t; b.dataset.testid = 'tp-' + k; b.style.cssText = 'display:block;width:100%;margin:6px 0';
    b.addEventListener('click', e => { e.preventDefault(); if (k === 'x') ov.style.display = 'none'; else tp(k); }); pn.appendChild(b); }
  document.body.appendChild(ov);
  try { const sq = document.getElementById('saveQuit'); const b = document.createElement('button'); b.className = 'btn alt'; b.id = 'teleportSpaceBtn'; b.dataset.testid = 'pause-teleport-button'; b.textContent = 'Teleport';
    b.addEventListener('click', e => { e.preventDefault(); ov.style.display = 'flex'; tf = 0; try { tfoc(); } catch (_) {} }); sq.parentNode.insertBefore(b, sq); } catch (e) { ERR('btn', e); }
  let tf = 0; const tb = () => [...pn.querySelectorAll('button')]; const tfoc = () => tb().forEach((b, i) => { b.classList.toggle('focus', i === tf); if (i === tf) try { b.focus(); } catch (_) {} });
  try { const pp = padPause; padPause = function (dir, adj, act) { if (ov.style.display !== 'flex') return pp.apply(this, arguments); const d = dir || adj; if (d) { tf = (tf + (d > 0 ? 1 : 3)) % 4; tfoc(); } if (act) tb()[tf].click(); }; } catch (e) { ERR('pad', e); }
  try { const sp0 = setPause; setPause = function (on) { if (ov.style.display === 'flex' && !on) { ov.style.display = 'none'; return; } return sp0.apply(this, arguments); }; } catch (e) { ERR('sp', e); }
  addEventListener('keydown', e => { if (ov.style.display !== 'flex') return; if (e.code === 'Escape') ov.style.display = 'none'; });
})();
