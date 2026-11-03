/* ===================== GLX-C228 (v1.0.50): FIRE REWORK - round flickering flames with embers and glow, slow creeping spread that burns blocks out, black scorch marks, rain puts it out ===================== */
(function c228() {
  const U = window.__c228 = {err: null, cells: 0, burning: 0, decals: 0, caught: 0, out: 0, rained: 0};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e).slice(0, 300); };
  try {
    const PH = typeof touchMode !== 'undefined' && !!touchMode, MAXC = PH ? 40 : 72, TPC = PH ? 3 : 4, NE = PH ? 60 : 120, MAXD = 320, CAP = 64;
    const mine = i => typeof placedSet !== 'undefined' && placedSet && placedSet.has(i);
    const ix = i => [Math.floor(i / (H * D)), Math.floor(i / D) % H, i % D];
    // ---- the old flat fire picture is hidden; the new flames draw on top of the same fire blocks ----
    try { PLANT_MATS[T.FIRE].visible = false; } catch (_) {}
    // ---- flame tongue: a round teardrop lathe, wobbled + flickered in the shader, additive ----
    const prof = []; for (let k = 0; k <= 8; k++) { const t = k / 8; prof.push(new THREE.Vector2(Math.max(0.001, 0.24 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.7) * (1 - t * 0.55)), t)); }
    const tg = new THREE.LatheGeometry(prof, PH ? 7 : 10);
    const seeds = new THREE.InstancedBufferAttribute(new Float32Array(MAXC * TPC * 2), 2); tg.setAttribute('aS', seeds);
    const fm = new THREE.ShaderMaterial({transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: {uT: {value: 0}},
      vertexShader: `attribute vec2 aS; uniform float uT; varying float vY; varying float vF; varying float vI;
        void main(){ vec3 p = position; float h = p.y; float s = aS.x;
          float fl = 0.82 + 0.18 * sin(uT * 9.0 + s * 7.0) + 0.1 * sin(uT * 23.0 + s * 3.0);
          p.y *= fl; p.x += sin(uT * 6.0 + h * 5.0 + s * 11.0) * 0.07 * h; p.z += cos(uT * 5.3 + h * 4.0 + s * 5.0) * 0.07 * h;
          vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0); vec3 n = normalize(mat3(modelMatrix * instanceMatrix) * normal);
          vec3 v = normalize(cameraPosition - w.xyz); vF = abs(dot(n, v)); vY = h; vI = aS.y; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `varying float vY; varying float vF; varying float vI;
        void main(){ vec3 c = mix(vec3(1.0, 0.92, 0.55), vec3(1.0, 0.45, 0.08), smoothstep(0.1, 0.6, vY)); c = mix(c, vec3(0.7, 0.12, 0.02), smoothstep(0.55, 1.0, vY));
          float a = pow(vF, 1.6) * (1.0 - smoothstep(0.55, 1.0, vY)) * vI; gl_FragColor = vec4(c * a * 1.25, a); }`});
    const flames = new THREE.InstancedMesh(tg, fm, MAXC * TPC); flames.frustumCulled = false; flames.count = 0; flames.renderOrder = 5; scene.add(flames);
    // ---- soft glow disc under each flame ----
    const gc = document.createElement('canvas'); gc.width = gc.height = 64; { const g = gc.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,170,60,0.9)'); r.addColorStop(0.4, 'rgba(255,110,20,0.35)'); r.addColorStop(1, 'rgba(255,80,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
    const glowM = new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4});
    const glow = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), glowM, MAXC); glow.frustumCulled = false; glow.count = 0; scene.add(glow);
    // ---- embers ----
    const EP = new Float32Array(NE * 3), EV = new Float32Array(NE * 4); const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(EP, 3));
    const em = new THREE.PointsMaterial({color: 0xffa040, size: PH ? 0.09 : 0.07, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending});
    const embers = new THREE.Points(eg, em); embers.frustumCulled = false; scene.add(embers); for (let i = 0; i < NE; i++) EP[i * 3 + 1] = -999;
    // ---- scorch / ash marks ----
    const sc = document.createElement('canvas'); sc.width = sc.height = 128; { const g = sc.getContext('2d'); let s = 77; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let k = 0; k < 26; k++) { const x = 64 + (r() - .5) * 60, y = 64 + (r() - .5) * 60, rr = 14 + r() * 30, q = g.createRadialGradient(x, y, 0, x, y, rr); q.addColorStop(0, 'rgba(12,10,8,0.55)'); q.addColorStop(1, 'rgba(12,10,8,0)'); g.fillStyle = q; g.fillRect(0, 0, 128, 128); }
      for (let k = 0; k < 140; k++) { const v = 60 + r() * 70 | 0; g.fillStyle = `rgba(${v},${v},${v},${0.35 + r() * 0.4})`; g.fillRect(16 + r() * 96, 16 + r() * 96, 1 + r() * 2, 1 + r() * 2); } }
    const dm = new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -3});
    const decals = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.02, 1.02).rotateX(-Math.PI / 2), dm, MAXD); decals.frustumCulled = false; decals.count = 0; scene.add(decals);
    let DL = []; const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S3 = new THREE.Vector3(), YA = new THREE.Vector3(0, 1, 0);
    function layDecals() { decals.count = Math.min(MAXD, DL.length); for (let i = 0; i < decals.count; i++) { const [x, y, z, r] = DL[i]; Q.setFromAxisAngle(YA, r); M4.compose(V.set(x + .5, y + 1.005, z + .5), Q, S3.set(1, 1, 1)); decals.setMatrixAt(i, M4); } decals.instanceMatrix.needsUpdate = true; U.decals = decals.count; }
    function scorch(x, y, z) { if (y < 1 || !solid(x, y, z) || solid(x, y + 1, z)) return; for (const d of DL) if (d[0] === x && d[1] === y && d[2] === z) return; DL.push([x, y, z, Math.random() * 6.283]); if (DL.length > MAXD) DL.shift(); layDecals(); }
    U.scorch = scorch;
    // ---- the fire model: catching blocks smoulder and creep, then burn away into fire ----
    const burn = new Map(); U.burnMap = burn;
    const sky = (x, y, z) => { for (let yy = y + 1; yy < H; yy++) { const b = world[idx(x, yy, z)]; if (b && b !== T.FIRE && !(PLANT[b]) ) return false; } return true; };
    const raining = () => typeof weather !== 'undefined' && weather.type !== 'clear' && weather.type !== 'snow' && !DIM.cur;
    const N6 = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]];
    function catchAt(j, sx, sy, sz) { if (burn.has(j) || fires.size + burn.size >= CAP) return; const b = world[j]; if (!FLAMMABLE.has(b) || mine(j)) return;
      const fast = b === T.LEAVES || b === T.TALLGRASS || (LEAFY && LEAFY[b]) || b === T.BLOSSOM; burn.set(j, {t: 0, dur: fast ? 1.6 + Math.random() * 1.4 : 4 + Math.random() * 4, sx, sy, sz}); U.caught++; }
    let dirtyB = false;
    const setW = (i, v) => { const [x, , z] = ix(i); world[i] = v; markDirty(x, z); dirtyB = true; };
    function tick() { const rain = raining();
      for (const [j, o] of burn) { const [x, y, z] = ix(j); if (!FLAMMABLE.has(world[j])) { burn.delete(j); continue; }
        if (rain && sky(x, y, z) && Math.random() < 0.5) { burn.delete(j); U.rained++; try { burst(x + .5, y + 1, z + .5, 0xc8c8c8, 6, 0.5); } catch (_) {} continue; }
        o.t += 0.5; if (o.t >= o.dur) { burn.delete(j); setW(j, T.FIRE); fires.set(j, 3 + Math.random() * 4); } }
      for (const [i, life] of fires) { const [x, y, z] = ix(i); if (world[i] !== T.FIRE) { fires.delete(i); continue; }
        const base = y > 0 ? world[i - D] : 0, eternal = ETERNAL.has(base) && DIM.cur === 'hell'; let nl = eternal ? life : life - 0.5;
        if (rain && sky(x, y, z) && Math.random() < 0.45) { nl = 0; U.rained++; try { burst(x + .5, y + .6, z + .5, 0xd0d0d0, 8, 0.6); sfx3d && sfx3d('hit', {x: x + .5, y, z: z + .5}, 10); } catch (_) {} }
        if (nl > 0) for (const [dx, dy, dz] of N6) { const nx = x + dx, ny = y + dy, nz = z + dz; if (nx < 0 || nz < 0 || nx >= W || nz >= D || ny < 1 || ny >= H) continue; if (Math.random() < (dy > 0 ? 0.16 : dy < 0 ? 0.12 : 0.15)) catchAt(idx(nx, ny, nz), x, y, z); }
        if (nl > 0 && Math.random() < 0.03) { const nx = x + (Math.random() * 3 | 0) - 1, ny = y + (Math.random() * 2 | 0), nz = z + (Math.random() * 3 | 0) - 1; if (nx > 0 && nz > 0 && nx < W && nz < D && ny < H) catchAt(idx(nx, ny, nz), x, y, z); }
        if (nl <= 0) { setW(i, T.AIR); fires.delete(i); U.out++; try { scorch(x, y - 1, z); } catch (_) {} if (FLAMMABLE.has(base) && !rain) catchAt(i - D, x, y, z); }
        else fires.set(i, nl); }
      if (dirtyB) { dirtyB = false; try { rebuild(); } catch (_) {} } U.burning = burn.size; }
    fireTick = function () {};   // the old instant spread is replaced by the creeping one above
    U.tick = tick; U.raining = raining; U.sky = sky;
    // ---- drawing: fire blocks near you plus the blocks that are catching ----
    const live = new Map(); let scanT = 0, tickT = 0, tm = 0;
    function scan() { const X = Math.floor(P.x), Y = Math.floor(P.y), Z = Math.floor(P.z), R = 22, seen = new Set();
      for (const [i] of fires) seen.add(i);
      for (let x = Math.max(0, X - R); x <= Math.min(W - 1, X + R); x++) for (let z = Math.max(0, Z - R); z <= Math.min(D - 1, Z + R); z++) for (let y = Math.max(1, Y - 10); y <= Math.min(H - 1, Y + 12); y++) if (world[idx(x, y, z)] === T.FIRE) seen.add(idx(x, y, z));
      for (const i of seen) if (!live.has(i) && world[i] === T.FIRE) { const [x, y, z] = ix(i); let src = null; for (const [dx, dy, dz] of N6) { const k = idx(x + dx, y + dy, z + dz); if (live.has(k) || burn.has(k)) { src = [dx * .7, dy * .5, dz * .7]; break; } } live.set(i, {b: tm, d: 0, src, burn: 0}); }
      for (const [j] of burn) if (!live.has(-j - 1)) live.set(-j - 1, {b: tm, d: 0, src: null, burn: 1}); }
    function frame(dt) {
      tm += dt; fm.uniforms.uT.value = tm;
      if ((tickT += dt) > 0.5) { tickT = 0; if (started && !paused && (fires.size || burn.size)) tick(); }
      if ((scanT -= dt) <= 0) { scanT = 0.6; if (started) scan(); }
      let n = 0, g = 0; const cx = P.x, cz = P.z;
      const arr = [...live.entries()].map(([k, o]) => { const j = k < 0 ? -k - 1 : k, [x, y, z] = ix(j); return [k, o, x, y, z, (x - cx) * (x - cx) + (z - cz) * (z - cz)]; }).sort((a, b) => a[5] - b[5]);
      for (const [k, o, x, y, z] of arr) { const j = k < 0 ? -k - 1 : k, alive = o.burn ? burn.has(j) : world[j] === T.FIRE;
        if (!alive) { o.d += dt; if (o.d > 0.7) { live.delete(k); continue; } } if (n >= MAXC * TPC) continue;
        const age = tm - o.b, grow = o.burn ? Math.min(1, (burn.get(j) || {t: 1, dur: 1}).t / Math.max(0.5, (burn.get(j) || {dur: 1}).dur) + 0.25) * 0.75 : Math.min(1, age / 1.4), fade = alive ? 1 : 1 - o.d / 0.7, sc = Math.max(0.05, grow * fade), cr = o.src ? 1 - Math.min(1, age / 1.6) : 0;
        const by = o.burn ? y + 1.0 : y + 0.02, h = o.burn ? 0.8 : 1.15;
        for (let t = 0; t < TPC; t++) { const s = (j * 0.618 + t * 0.37) % 1, an = t * 2.4 + s * 6, rr = t ? 0.26 : 0, ox = Math.sin(an) * rr + (o.src ? o.src[0] * cr : 0), oz = Math.cos(an) * rr + (o.src ? o.src[2] * cr : 0), hh = (t ? 0.65 + s * 0.3 : 1) * h * sc;
          M4.compose(V.set(x + .5 + ox, by + (o.src ? o.src[1] * cr : 0), z + .5 + oz), Q.identity(), S3.set(sc * (t ? 0.7 : 1.15), hh, sc * (t ? 0.7 : 1.15))); flames.setMatrixAt(n, M4); seeds.setXY(n, s * 10 + t, Math.min(1, 0.6 + sc * 0.5)); n++; }
        if (g < MAXC) { M4.compose(V.set(x + .5, by + 0.02, z + .5), Q.identity(), S3.set(1.8 * sc, 1, 1.8 * sc)); glow.setMatrixAt(g++, M4); } }
      flames.count = n; glow.count = g; if (n) { flames.instanceMatrix.needsUpdate = true; seeds.needsUpdate = true; } if (g) glow.instanceMatrix.needsUpdate = true; U.cells = arr.length;
      // embers drift up from random live cells
      for (let i = 0; i < NE; i++) { const b = i * 3, v = i * 4; if (EV[v + 3] > 0) { EV[v + 3] -= dt; EP[b] += EV[v] * dt; EP[b + 1] += EV[v + 1] * dt; EP[b + 2] += EV[v + 2] * dt; EV[v + 1] += dt * 0.4; EV[v] += Math.sin(tm * 3 + i) * dt * 0.6; if (EV[v + 3] <= 0) EP[b + 1] = -999; }
        else if (arr.length && Math.random() < dt * 3) { const c = arr[(Math.random() * Math.min(arr.length, MAXC)) | 0]; EP[b] = c[2] + .3 + Math.random() * .4; EP[b + 1] = c[3] + (c[1].burn ? 1.2 : 0.6); EP[b + 2] = c[4] + .3 + Math.random() * .4; EV[v] = (Math.random() - .5) * .5; EV[v + 1] = 0.8 + Math.random() * 1.2; EV[v + 2] = (Math.random() - .5) * .5; EV[v + 3] = 0.9 + Math.random() * 1.4; } }
      eg.attributes.position.needsUpdate = true; em.opacity = 0.7 + 0.3 * Math.sin(tm * 13);
      // scorch marks go when their block is dug out or built over
      if ((tm % 2) < dt && DL.length) { const n0 = DL.length; DL = DL.filter(([x, y, z]) => solid(x, y, z) && !solid(x, y + 1, z)); if (DL.length !== n0) layDecals(); } }
    const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { frame(Math.min(0.1, +dt || 0.016)); } catch (e) { ERR(e); } return r; };
    // scorch marks are kept with the world
    const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && !DIM.cur) d.c228 = DL.slice(-MAXD).map(q => [q[0], q[1], q[2]]); } catch (_) {} return d; };
    const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { DL = (d && d.c228 || []).map(q => [q[0], q[1], q[2], Math.random() * 6.283]); layDecals(); } catch (_) {} return r; };
    const ew = enterWorld; enterWorld = function (save) { DL = []; burn.clear(); live.clear(); layDecals(); return ew.apply(this, arguments); };
  } catch (e) { ERR(e); }
})();
