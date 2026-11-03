/* ===================== GLX-C164 (v1.0.29): rain is back and better - fixed weather rolls, dense slanted rain round the camera, splashes, grey storm sky, sheet lightning, snow in snowy places ===================== */
(function c164() {
  const U = window.__c164 = {dry: 0, rolls: 0, rains: 0, on: false, k: 0, snowB: false, err: null, flashes: 0};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e); };
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // ---------- the bug: sleeping reset the dry-day count and skipped the next roll, so a player who sleeps every night never saw rain again ----------
  // our own dry count (sleep does not reset it): the usual 50% roll after two dry days, and rain is certain after four
  try { const od = onDawn; onDawn = function () { const keep = U.dry; skipRoll = false; daysDry = keep; const r = od.apply(this, arguments);
      try { if (!weather.pending && keep + 1 >= 4 && !DIM.cur) { const q = Math.random(); weather.pending = q < 0.6 ? 'light' : q < 0.88 ? 'heavy' : 'thunder'; weather.startAt = CYCLE * (0.04 + Math.random() * 0.3); }
        if (weather.pending) { U.dry = 0; U.rolls++; } else U.dry = keep + 1; } catch (e) { ERR(e); } return r; }; } catch (e) { ERR(e); }
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { d.dry29 = U.dry; } catch (_) {} return d; };
    const ew = enterWorld; enterWorld = function (save) { U.dry = save && typeof save.dry29 === 'number' ? save.dry29 : 1; return ew.apply(this, arguments); }; } catch (e) { ERR(e); }
  const PH = typeof touchMode !== 'undefined' && touchMode;
  // ---------- rain sheets: two open cylinders round the camera with a scrolling slanted-streak texture (2 draw calls, cheap on phones) ----------
  function streakTex(n, a) { const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d'); g.lineCap = 'round';
    for (let i = 0; i < n; i++) { const x = Math.random() * 128, y = Math.random() * 256, l = 14 + Math.random() * 26; g.strokeStyle = 'rgba(210,222,236,' + (a * (0.4 + Math.random() * 0.6)).toFixed(3) + ')'; g.lineWidth = 0.8 + Math.random() * 0.9;
      for (const dx of [0, -128, 128]) for (const dy of [0, -256, 256]) { g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx - l * 0.22, y + dy + l); g.stroke(); } }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
  const sheets = [[4.5, 7, 3, PH ? 70 : 90, 0.42], [10, 13, 4, PH ? 60 : 80, 0.3]].map(([r, rx, ry, n, op]) => { const t = streakTex(n, 1); t.repeat.set(rx, ry);
    const m = new THREE.MeshBasicMaterial({map: t, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: true});
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 26, 18, 1, true), m); o.frustumCulled = false; o.renderOrder = 5; o.visible = false; scene.add(o); return {o, m, t, op, ry}; });
  // ---------- near drops: slanted line streaks in the columns round you, stopped by roofs, splash where they land ----------
  const NL = PH ? 320 : 800, R = PH ? 9 : 12, lp = new Float32Array(NL * 6), dx = new Float32Array(NL), dy = new Float32Array(NL), dz = new Float32Array(NL), dt0 = new Float32Array(NL);
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({color: 0xc6d3e2, transparent: true, opacity: 0.6, depthWrite: false, fog: true})); lines.frustumCulled = false; lines.visible = false; lines.renderOrder = 5; scene.add(lines);
  const NS = PH ? 70 : 160, sp = new Float32Array(NS * 3).fill(-999), sT = new Float32Array(NS); let si = 0;
  const ring = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); g.strokeStyle = 'rgba(230,240,255,.95)'; g.lineWidth = 3; g.beginPath(); g.ellipse(16, 20, 12, 6, 0, 0, 7); g.stroke(); g.fillStyle = 'rgba(230,240,255,.9)'; g.fillRect(14, 4, 4, 9); return new THREE.CanvasTexture(c); })();
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const spl = new THREE.Points(sg, new THREE.PointsMaterial({map: ring, size: 0.32, transparent: true, opacity: 0.8, depthWrite: false, fog: true})); spl.frustumCulled = false; spl.visible = false; scene.add(spl);
  const tops = new Map(); let topsT = 0; const topAt = (x, z) => { const k = x * 4096 + z; let v = tops.get(k); if (v === undefined) { v = colTop(x, z); tops.set(k, v); } return v; };
  const WX = 0.24, WZ = 0.1;   // the wind slant
  function drop(i, fresh) { const x = P.x + (Math.random() * 2 - 1) * R, z = P.z + (Math.random() * 2 - 1) * R; dx[i] = x; dz[i] = z; dt0[i] = topAt(Math.floor(x), Math.floor(z)); dy[i] = Math.max(dt0[i], P.y - 4) + (fresh ? Math.random() * 16 : 10 + Math.random() * 6); }
  // the old rain draws (thin world quads + old splash points) are retired in favour of these
  let old = null; function oldBits() { if (old) return old; old = []; scene.traverse(o => { try { if (o === lines || o === spl || sheets.some(s => s.o === o)) return;
      if ((o.isInstancedMesh && o.renderOrder === 5 && o.material && o.material.color && o.material.color.getHex() === 0xb4c4d6) || (o.isPoints && o.material && o.material.color && [0xd6e4ff, 0xcfe0ff].includes(o.material.color.getHex()))) old.push(o); } catch (_) {} }); return old; }
  let was = false, fr = 0, sheetT = 10, snowT = 0;
  const uw = updateWeather; updateWeather = function (dt) { const r = uw.apply(this, arguments);
    try { const w = WEATHER[weather.type], over = !DIM.cur, raining = !!w.drops && over;
      // snow instead of rain in snowy places (snow-covered ground round you, or high up)
      if ((snowT -= dt) <= 0) { snowT = 1; let s = false; if (raining && T.SNOW !== undefined) { let n = 0; for (const [ox, oz] of [[0, 0], [5, 0], [-5, 0], [0, 5], [0, -5]]) { const x = Math.floor(P.x) + ox, z = Math.floor(P.z) + oz; if (x > 0 && z > 0 && x < W && z < D && getB(x, groundTop(x, z), z) === T.SNOW) n++; } s = n >= 3; }
        const lock = (() => { const b = document.querySelector('#wxSeg button.on'); return b && b.dataset.v === 'snow'; })();
        if (s !== U.snowB) { U.snowB = s; if (!lock) window.__forceSnow = s; } }
      const snowing = !!window.__snowing, dk = window.__c216 ? __c216.deep : caveK, on = raining && !snowing && dk < 0.6; U.on = on;   // v1.0.45: only deep underground stops it (c216 occludes per column)
      for (const o of oldBits()) o.visible = false;
      const inten = Math.min(1, weather.dark / Math.max(0.01, w.dark || 1) + 0.15) * (weather.type === 'light' ? 0.6 : 1), cov = typeof rainCover === 'number' ? rainCover : 0, vis = on ? inten * (window.__c216 ? 1 : 1 - cov) * (1 - dk) : 0;
      const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z, spd = (w.speed || 20);
      for (const s of sheets) { s.o.visible = vis > 0.02; if (!s.o.visible) continue; s.o.position.set(cx, cy + 6, cz); s.m.opacity = s.op * vis; s.t.offset.y += dt * spd / 26 * s.ry * 0.9; s.t.offset.x -= dt * 0.05; }
      lines.visible = on; spl.visible = on;
      if (on) { const now = performance.now(); if (now - topsT > 500) { tops.clear(); topsT = now; } if (!was) { for (let i = 0; i < NL; i++) drop(i, true); was = true; }
        const n = Math.round(NL * inten), len = weather.type === 'light' ? 0.55 : 0.9; fr++;
        for (let i = 0; i < n; i++) { let y = dy[i] - spd * dt; dx[i] += WX * spd * dt * 0.25; dz[i] += WZ * spd * dt * 0.25;
          if ((i & 3) === (fr & 3)) dt0[i] = topAt(Math.floor(dx[i]), Math.floor(dz[i]));
          if (y < dt0[i]) { if (Math.random() < 0.35 && Math.abs(dx[i] - P.x) < R && Math.abs(dz[i] - P.z) < R) { si = (si + 1) % NS; sp[si * 3] = dx[i]; sp[si * 3 + 1] = dt0[i] + 0.06; sp[si * 3 + 2] = dz[i]; sT[si] = 0.22; } drop(i, false); y = dy[i]; }
          else if (Math.abs(dx[i] - P.x) > R || Math.abs(dz[i] - P.z) > R || y < P.y - 10) { drop(i, true); y = dy[i]; }
          dy[i] = y; const k = i * 6; lp[k] = dx[i]; lp[k + 1] = y; lp[k + 2] = dz[i]; lp[k + 3] = dx[i] - WX * len; lp[k + 4] = y + len; lp[k + 5] = dz[i] - WZ * len; }
        lg.setDrawRange(0, n * 2); lg.attributes.position.needsUpdate = true;
        for (let i = 0; i < NS; i++) if (sT[i] > 0) { sT[i] -= dt; if (sT[i] <= 0) sp[i * 3 + 1] = -999; } sg.attributes.position.needsUpdate = true; }
      else was = false;
      // storms: lightning more often, plus distant sheet lightning with a late rumble
      if (weather.type === 'thunder' && over) { if (weather.strikeT > 45) weather.strikeT = 14 + Math.random() * 30;
        if ((sheetT -= dt) <= 0) { sheetT = 7 + Math.random() * 14; flashA = Math.max(flashA, 0.45 + Math.random() * 0.35); U.flashes++; const v = 0.3 + Math.random() * 0.3; setTimeout(() => { try { sfx('thunder', v); } catch (_) {} }, 700 + Math.random() * 2200); } }
    } catch (e) { ERR(e); }
    return r; };
  // ---------- storm sky: darker grey sky, clouds and fog while it rains (not in Hell, eased by the castle's red sky) ----------
  const G_FOG = new THREE.Color(0.37, 0.4, 0.43), G_TOP = new THREE.Color(0.28, 0.31, 0.35), G_HOR = new THREE.Color(0.46, 0.49, 0.52), G_CL = new THREE.Color(0.38, 0.4, 0.43), tc = new THREE.Color();
  const us = updateSky; updateSky = function () { const r = us.apply(this, arguments);
    try {
      const red = window.__c162 ? __c162.k : 0, k = DIM.cur ? 0 : sm(0, 0.5, weather.dark) * (1 - red) * (1 - caveK * 0.7); U.k = k;
      if (k > 0.001) { const lift = 0.3 + 0.7 * Math.max(0, Math.min(1, daylight)); try { cloudMat.color.lerp(G_CL, k * 0.85); if (skyUniforms.texK) skyUniforms.texK.value *= 1 - 0.85 * k; if (skyUniforms.sunK) skyUniforms.sunK.value *= 1 - 0.75 * k; } catch (_) {}
        tc.copy(G_FOG).multiplyScalar(lift); scene.fog.color.lerp(tc, k * 0.85); try { if (scene.background && scene.background.isColor) scene.background.lerp(tc, k * 0.85); } catch (_) {}
        try { tc.copy(G_TOP).multiplyScalar(lift); skyUniforms.top.value.lerp(tc, k * 0.85); tc.copy(G_HOR).multiplyScalar(lift); skyUniforms.hor.value.lerp(tc, k * 0.85); } catch (_) {}
        scene.fog.far = Math.max(scene.fog.near + 20, scene.fog.far * (1 - 0.3 * k)); } } catch (e) { ERR(e); }
    return r; };
  U.sheets = sheets; U.lines = lines; U.spl = spl;
  U.force = t => { setWeather(t || 'heavy'); weather.pending = null; };
})();
