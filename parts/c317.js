/* GLX-C317 (v1.1.27): THE SPACE BOX. One continuous sandbox: a cube of deep space from -10000 to +10000 on X, Y and Z with solid, unbreakable
   black walls, roof and floor and a starfield inside, and the Earth map floating in the middle of it as the real block world. The game's own
   block helpers now answer for everywhere in the box, so there are no swaps or teleports: walk off the edge and you fall down the side of the
   slab past its underside, jetpack straight up as far as the roof, land on the Moon or Mars from above. Normal downward gravity everywhere.
   Far things (Earth slab, planets, stars) are drawn in a first pass with their own camera range, the near world on top, so Earth shows from
   anywhere in the box and nothing flickers or shakes at huge distances. Also: the rocket stays parked for now (UFO and jetpack fly space). */
(function c317() {
  const U = window.__c317 = {err: null, L: 24000, space: false, farFrames: 0, voids: 0, soft: false, hud: ''};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); console.warn('c317', w, e); };
  const L = U.L, P8 = () => window.__c318, UF = () => window.__c309;
  const Z0 = () => (typeof __XG !== 'undefined' && __XG && typeof __XZ !== 'undefined') ? __XZ : 0;
  const on = U.on = () => !window.__c317mesh && !DIM.cur && W >= 600;
  const foot = (x, z) => x >= 0 && x < W && z < D && z >= Z0();
  /* v1.1.28: the box is centred on the middle of the Earth map */
  const C = U.C = () => [W >> 1, H >> 1, D >> 1];
  const wall = (x, y, z) => { const c = C(); return Math.abs(x + 0.5 - c[0]) >= L || Math.abs(y + 0.5 - c[1]) >= L || Math.abs(z + 0.5 - c[2]) >= L; };
  U.clampBox = (p, m) => { const c = C(), k = L - m; p.x = Math.max(c[0] - k, Math.min(c[0] + k, p.x)); p.y = Math.max(c[1] - k, Math.min(c[1] + k, p.y)); p.z = Math.max(c[2] - k, Math.min(c[2] + k, p.z)); };
  U.foot = foot; U.wall = wall; U.inSpaceXZ = 1;
  // ---------- the block helpers answer for the whole box ----------
  try { const g0 = getB; getB = function (x, y, z) { if (foot(x, z) || !on()) return g0(x, y, z); x = Math.floor(x); y = Math.floor(y); z = Math.floor(z); if (wall(x, y, z)) return T.BEDROCK; const p = P8(); return p ? p.get(x, y, z) : T.AIR; }; } catch (e) { ERR('getB', e); }
  try { const s0 = setB; setB = function (x, y, z, v) { if (foot(x, z) || !on()) return s0(x, y, z, v); x = Math.floor(x); y = Math.floor(y); z = Math.floor(z); if (wall(x, y, z)) return; const p = P8(); if (p) p.set(x, y, z, v); }; } catch (e) { ERR('setB', e); }
  const soft = b => !b || b === T.WATER || b === T.LAVA || b === T.TORCH || (typeof PLANT !== 'undefined' && PLANT[b] === 1);
  try { const so = solid; solid = function (x, y, z) { if (!on()) return so(x, y, z); if (foot(x, z)) return y < 0 ? false : so(x, y, z); if (wall(x, y, z)) return true; const p = P8(); return p ? !soft(p.get(Math.floor(x), Math.floor(y), Math.floor(z))) : false; }; } catch (e) { ERR('solid', e); }
  // bedrock walls can never be broken
  try { const sb = setB; setB = function (x, y, z, v) { if (on() && !foot(x, z) && wall(Math.floor(x), Math.floor(y), Math.floor(z))) return; return sb.apply(this, arguments); }; } catch (_) {}
  // ---------- falling: no void death inside the box, and no fall damage after space ----------
  try { const hu = hurt; hurt = function (n, why) { if (on() && /fell out of the world/i.test(String(why || ''))) { U.voids++; U.skipSpawn = 1; return; } return hu.apply(this, arguments); }; } catch (e) { ERR('hurt', e); }
  try { const sp = spawnPlayer; spawnPlayer = function () { if (U.skipSpawn) { U.skipSpawn = 0; return; } return sp.apply(this, arguments); }; } catch (e) { ERR('spawn', e); }
  const inSpace = (x, y, z) => window.__c320 ? __c320.space(x, y, z) : (!foot(x, z) || y < 0 || y > H + 40);   // v1.1.29: the round Earth has air and sea all round
  U.inSpace = () => { const w = window.__c321 ? __c321.pW(P.x, P.y, P.z) : [P.x, P.y, P.z]; return on() && inSpace(w[0], w[1], w[2]); };
  try { const up = updatePlayer; updatePlayer = function () { const r = up.apply(this, arguments); try { if (on() && started && !(UF() && UF().on)) { const w = window.__c321 ? __c321.pW(P.x, P.y, P.z) : [P.x, P.y, P.z]; if (inSpace(w[0], w[1], w[2])) U.soft = true; if (U.soft) { P.fallTop = null; if (P.onGround) U.soft = false; }
          if (P.vy < -110) P.vy = -110; U.clampBox(P, 2.5); } } catch (e) { ERR('upd', e); } return r; }; } catch (e) { ERR('upd0', e); }
  // ---------- the far pass: box, stars, Earth slab, planet balls ----------
  const FAR = U.FAR = new THREE.Scene(); FAR.background = new THREE.Color(0x000000);
  const fc = U.cam = new THREE.PerspectiveCamera(70, 1, 3, 40000);
  { const n = /Android|iPhone|iPad/i.test(navigator.userAgent) ? 5000 : 9000, a = new Float32Array(n * 3), c = new Float32Array(n * 3); let s = 12345; const r = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
    for (let i = 0; i < n; i++) { let x, y, z; do { x = (r() * 2 - 1) * (L - 50); y = (r() * 2 - 1) * (L - 50); z = (r() * 2 - 1) * (L - 50); } while (Math.hypot(x - 432, y, z - 432) < 1500);
      a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z; const b = 0.55 + r() * 0.45, t = r(); c[i * 3] = b * (t < 0.15 ? 1 : t > 0.85 ? 0.8 : 0.95); c[i * 3 + 1] = b * 0.95; c[i * 3 + 2] = b * (t > 0.85 ? 1 : t < 0.15 ? 0.75 : 0.95); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    const st = new THREE.Points(g, new THREE.PointsMaterial({size: 2, sizeAttenuation: false, vertexColors: true, fog: false})); st.frustumCulled = false; FAR.add(st); U.stars = n; U.st = st;
    const m2 = n >> 1, a2 = new Float32Array(m2 * 3); for (let i = 0; i < m2; i++) { const u = r() * 2 - 1, q = r() * 6.283, w = Math.sqrt(1 - u * u); a2[i * 3] = w * Math.cos(q) * 15000; a2[i * 3 + 1] = u * 15000; a2[i * 3 + 2] = w * Math.sin(q) * 15000; }
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.BufferAttribute(a2, 3)); g2.setAttribute('color', new THREE.BufferAttribute(c.slice(0, m2 * 3), 3)); U.shell = new THREE.Points(g2, new THREE.PointsMaterial({size: 1.5, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false})); U.shell.frustumCulled = false; U.shell.renderOrder = -4; FAR.add(U.shell);
    const bx = new THREE.Mesh(new THREE.BoxGeometry(2 * L, 2 * L, 2 * L), new THREE.MeshBasicMaterial({color: 0x030306, side: THREE.BackSide, fog: false})); bx.frustumCulled = false; bx.renderOrder = -5; bx.material.depthWrite = false; FAR.add(bx); U.bx = bx; }
  const spaceCam = (x, y, z) => on() && (window.__c320 ? __c320.spaceCam(x, y, z) : (!foot(x, z) || y > H + 60 || y < -2));
  U.isSpaceCam = c => spaceCam(c.x, c.y, c.z);
  const hidden = [];
  try { const rd = renderer.render; renderer.render = function (s, c) { if (s !== scene || !started || !c || !c.isPerspectiveCamera) return rd.apply(this, arguments);
      try { const r9 = window.__c299; if (r9 && r9.on && r9.camSet && on()) r9.camSet(c); } catch (_) {}
      let sp = false; const uf = UF(); try { const cp = uf && uf.on && uf.cam ? uf.cam : c.position; sp = spaceCam(cp.x, cp.y, cp.z); } catch (_) {}
      U.space = sp; if (!sp) return rd.apply(this, arguments);
      let bg, fog, ac, fog0 = null; try { const p8 = P8(), cp = uf && uf.on && uf.cam ? uf.cam : c.position; fc.position.copy(cp); fc.quaternion.copy(uf && uf.on && uf.cq ? uf.cq : c.quaternion);
        if (fc.fov !== c.fov || fc.aspect !== c.aspect) { fc.fov = c.fov; fc.aspect = c.aspect; fc.updateProjectionMatrix(); } { const c0 = C(); if (U.bx) { U.bx.position.set(c0[0], c0[1], c0[2]); U.st.position.copy(U.bx.position); } } fc.updateMatrixWorld(true); if (U.shell) { U.shell.position.copy(cp); U.shell.updateMatrixWorld(true); }
        if (p8) for (const b of p8.bodies) { if (b.d.cell) continue; const m = p8.coarse(b); if (!m.parent) FAR.add(m); const cc = b.c(); m.visible = Math.hypot(cp.x - cc[0], cp.y - cc[1], cp.z - cc[2]) > b.R + 40; }
        ac = renderer.autoClear; renderer.autoClear = true; rd.call(this, FAR, fc); U.farFrames++;
        bg = scene.background; fog = scene.fog; scene.background = null; if (fog) { fog0 = [fog.near, fog.far, fog.density]; fog.near = 1e7; fog.far = 2e7; if (fog.density !== undefined) fog.density = 0; } hidden.length = 0; for (const o of [window.skyDome, window.stars]) if (o && o.visible) { o.visible = false; hidden.push(o); }
        try { if (typeof skyDome !== 'undefined' && skyDome.visible) { skyDome.visible = false; hidden.push(skyDome); } if (typeof stars !== 'undefined' && stars.visible) { stars.visible = false; hidden.push(stars); } } catch (_) {}
        for (const m of scene.children) if (m.visible && ((m.renderOrder <= -10 && m.material && m.material.isShaderMaterial) || (m.isPoints && m.position.distanceTo(c.position) < 3))) { m.visible = false; hidden.push(m); }
        renderer.autoClear = false; try { renderer.state.buffers.depth.setMask(true); } catch (_) {} renderer.clearDepth(); } catch (e) { ERR('far', e); }
      try { return rd.apply(this, arguments); } finally { try { scene.background = bg; if (fog && fog0) { fog.near = fog0[0]; fog.far = fog0[1]; if (fog0[2] !== undefined) fog.density = fog0[2]; } renderer.autoClear = ac === undefined ? true : ac; for (const o of hidden) o.visible = true; } catch (_) {} } }; } catch (e) { ERR('rw0', e); }
  // ---------- HUD: true position in the box ----------
  const hd = document.createElement('div'); hd.dataset.testid = 'space-hud'; hd.style.cssText = 'position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:44;font:bold 13px monospace;color:#cfe;background:rgba(0,0,0,.5);padding:4px 10px;border-radius:8px;pointer-events:none;display:none';
  document.body.appendChild(hd);
  setInterval(() => { try { /* v1.1.28: no separate space HUD, the normal X Y Z works everywhere in the box */ const show = typeof started !== 'undefined' && started && on() && (U.space || U.inSpace()); hd.style.display = 'none'; if (!show) return; const uf = UF(), p = uf && uf.on ? uf.pos : P, b = P8() && P8().near(p, 60);
      U.hud = 'SPACE  X ' + Math.round(p.x) + '  Y ' + Math.round(p.y) + '  Z ' + Math.round(p.z) + (b ? '   ' + b.name.toUpperCase() : '') + (Math.max(Math.abs(p.x - C()[0]), Math.abs(p.y - C()[1]), Math.abs(p.z - C()[2])) > L - 300 ? '   EDGE OF SPACE' : ''); hd.textContent = U.hud; } catch (e) { ERR('hud', e); } }, 200);
  // ---------- the rocket stays parked; the old solar system balls are retired ----------
  setTimeout(() => { 
    try { const s5 = window.__c305; if (s5) { if (s5.show) { s5.show(false); s5.show = () => {}; } } } catch (e) { ERR('s5', e); } }, 0);
})();
// (t655u) no bedrock floor or edge wall on Earth: the natural bedrock becomes deepslate and the packed snow rim comes down, so you can dig out of the bottom or walk off any side
(function c317b() { let done = null; setInterval(() => { try { if (typeof started === 'undefined' || !started || DIM.cur || !__c317.on() || (done === world && world[idx(3, 0, 3)] !== T.HBEDROCK && world[idx(W - 4, 0, D - 4)] !== T.HBEDROCK) || (window.__c105 && __c105.phase === 'gen')) return; done = world;
    const HB = T.HBEDROCK, BR = T.BEDROCK, DS = T.DEEPSLATE || T.STONE, PK = T.PACKSNOW; let n = 0;
    for (let i = 0; i < world.length; i++) { const b = world[i]; if (b === HB || (BR && b === BR)) { world[i] = DS; n++; } }
    if (PK) for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { if (x > 2 && z > 2 && x < W - 3 && z < D - 3) continue; for (let y = H - 1; y > 0; y--) { const i = idx(x, y, z), b = world[i]; if (b === PK) { world[i] = 0; n++; } else if (b) break; } }
    __c317.unbed = n; if (n) dirtyAll = true; } catch (e) { __c317.err = __c317.err || 'unbed ' + e; } }, 1000); })();
// keep your spot in space across a save and reload (the old loader puts anyone off the map back at spawn)
(function c317c() { const U = window.__c317;
  try { const se = serialize; serialize = function () { const o = se.apply(this, arguments); try { if (o && !(window.__c299 && __c299.on) && !DIM.cur && U.on() && !(window.__c309 && __c309.on) && !U.foot(P.x, P.z) || (o && !DIM.cur && U.on() && (P.y < -2 || P.y > H + 60))) o.c317 = {p: [P.x, P.y, P.z]}; } catch (_) {} return o; }; } catch (e) { U.err = U.err || 'ser ' + e; }
  try { const ew = enterWorld; enterWorld = function (save) { const r = ew.apply(this, arguments); try { const q = save && save.c317 && save.c317.p, gen = window.__c105 && __c105.phase === 'gen';
      if (q && !gen && q.every(isFinite)) { let n = 0; const iv = setInterval(() => { if (++n > 60) clearInterval(iv); if (typeof started === 'undefined' || !started || !U.on()) return; clearInterval(iv); P.x = q[0]; P.y = q[1] + 0.05; P.z = q[2]; P.vy = 0; P.fallTop = null; U.soft = true; }, 100); } } catch (e) { U.err = U.err || 'ew ' + e; } return r; }; } catch (e) { U.err = U.err || 'ew0 ' + e; } })();
