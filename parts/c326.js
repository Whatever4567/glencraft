// v1.1.33: Earth from far away is a round painted planet - Glencraft as a snowy island and big green and brown continents, no flat card
(function () {
  const U = window.__c326 = {err: null, on: false, hid: 0, built: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const ph = /Android|iPhone|iPad/i.test(navigator.userAgent), TW = ph ? 512 : 1024, TH = TW >> 1;
  const E3 = () => window.__c320 && __c320.E ? __c320.E() : null;
  let ball = null, cv = null, ctx = null, img = null, row = 0, tex = null, key = '';
  const S = Math.sin;
  function col(dx, dy, dz, c, R) { const x = c[0] + dx * R, z = c[2] + dz * R, y = c[1] + dy * R;
    const ex = Math.max(0, -x, x - W), ez = Math.max((typeof __XZ !== 'undefined' && __XZ) ? __XZ : 0, 0) - z, df = Math.hypot(ex, Math.max(0, ez, z - D));
    if (df < 1) { const t = S(x * 0.009 + 1) * S(z * 0.008 + 2) + 0.4 * S(x * 0.021 + z * 0.017); return t > 0.55 ? [236, 240, 245] : t > -0.2 ? [86, 140, 62] : [64, 112, 50]; }
    if (df < 14) return [238, 242, 248];
    /* v1.1.36: the round planet is painted from the same real world map the ground is built from */
    const gk = __c320.ground(x, y, z, dx, dy, dz), g = gk[0], kd = gk[1];
    if (g <= 0) { const k = Math.max(0, (g + 6) / 6); return df < 40 ? [70, 150, 190] : [30 + 40 * k, 80 + 60 * k, 160 + 30 * k]; }
    if (kd === 3) return [214, 196, 140]; if (kd === 0) return [214, 200, 150]; if (kd === 2 || kd === 4) return [236, 240, 245];
    const v = 0.9 + 0.1 * S(dx * 40 + dz * 33);
    if (g > 24) return [150 * v, 120 * v, 90 * v]; if (g > 14) return [120 * v, 105 * v, 62 * v]; return [72 * v, 130 * v, 52 * v]; }
  function paint(n) { const c = E3(), R = __c320.R; const t0 = performance.now(); for (; row < TH && performance.now() - t0 < n; row++) { const th = (row + 0.5) / TH * Math.PI, st = Math.sin(th), ct = Math.cos(th);
      for (let i = 0; i < TW; i++) { const p = (i + 0.5) / TW * Math.PI * 2, q = col(-Math.cos(p) * st, ct, Math.sin(p) * st, c, R), o = (row * TW + i) * 4; img.data[o] = q[0]; img.data[o + 1] = q[1]; img.data[o + 2] = q[2]; img.data[o + 3] = 255; } }
    U.row = row; if (row >= TH) { ctx.putImageData(img, 0, 0); tex.needsUpdate = true; ball.visible = true; U.built++; U.gen = (U.gen || 0) + 1; } }
  function make() { const F = window.__c317 && __c317.FAR; if (!F || !E3()) return false; const c = E3(), k = c.join() + W + D; if (ball && key === k) return true; key = k;
    if (!ball) { cv = document.createElement('canvas'); cv.width = TW; cv.height = TH; ctx = cv.getContext('2d'); img = ctx.createImageData(TW, TH); tex = new THREE.CanvasTexture(cv); try { tex.colorSpace = THREE.SRGBColorSpace; } catch (_) {}
      tex.anisotropy = 4; ball = new THREE.Mesh(new THREE.SphereGeometry(__c320.R + 2, ph ? 72 : 128, ph ? 36 : 64), new THREE.MeshBasicMaterial({map: tex, fog: false})); ball.name = 'earth326'; ball.frustumCulled = false; ball.visible = false; F.add(ball); }
    ball.position.set(c[0], c[1], c[2]); row = 0; ball.visible = false; return true; }
  setInterval(() => { try { if (typeof started !== 'undefined' && started && make() && row < TH) paint(ph ? 8 : 14); } catch (e) { ERR('paint', e); } }, 120);
  /* v1.1.34: the near and middle-distance sea balls wear the same painted continents, so other lands look the same from the ground, the air and orbit */
  let mtex = null, mgen = -1;
  function skin() { try { if (!U.gen || !window.__c320) return; const R = __c320.R;
      if (mgen !== U.gen) { mgen = U.gen; const mc = document.createElement('canvas'); mc.width = TW; mc.height = TH; const x = mc.getContext('2d'), d = x.getImageData(0, 0, TW, TH); const s = img.data;
        for (let o = 0; o < s.length; o += 4) { d.data[o] = s[o]; d.data[o + 1] = s[o + 1]; d.data[o + 2] = s[o + 2]; const sea = s[o + 2] > s[o] + 60 && s[o + 2] > s[o + 1] + 20; d.data[o + 3] = sea ? 209 : 255; }
        x.putImageData(d, 0, 0); if (mtex) mtex.dispose(); mtex = new THREE.CanvasTexture(mc); try { mtex.colorSpace = THREE.SRGBColorSpace; } catch (_) {} mtex.anisotropy = 4; U.skinned = 0; }
      const fix = g => { if (!g || g.userData.c326uv || !g.parameters || !g.attributes.uv) return; const P0 = g.attributes.position, uv = g.attributes.uv, r = g.parameters.radius;
        for (let i = 0; i < P0.count; i++) uv.setY(i, 1 - Math.acos(Math.max(-1, Math.min(1, P0.getY(i) / r))) / Math.PI); uv.needsUpdate = true; g.userData.c326uv = 1; };
      const grab = (grp, near) => { if (!grp) return; grp.traverse(m => { if (!m.isMesh || !m.geometry || !m.geometry.parameters || Math.abs(m.geometry.parameters.radius - R) > 0.5) return; if (m.userData.c326 === mgen) return; fix(m.geometry);
          m.material = near ? new THREE.MeshLambertMaterial({map: mtex, transparent: true, depthWrite: false}) : new THREE.MeshBasicMaterial({map: tex, fog: false}); m.userData.c326 = mgen; U.skinned++; }); };
      grab(scene.getObjectByName('earth320'), true); grab(__c317.FAR && __c317.FAR.getObjectByName('earth320far'), false); } catch (e) { ERR('skin', e); } }
  setInterval(skin, 700);
  const near = new Set(['earth320']);
  const keep = new Set(['planets318', 'ramps327']);
  function inMap(o) { if (keep.has(o.name)) return false; if (near.has(o.name)) return true; const p = o.position; return p.x > -2600 && p.x < W + 2600 && p.z > -3200 && p.z < D + 2600 && p.y > -500 && p.y < 900; }
  try { const rd = renderer.render; renderer.render = function (s, cam) {
      if (s !== scene || !cam || !cam.isPerspectiveCamera || typeof started === 'undefined' || !started || (typeof DIM !== 'undefined' && DIM.cur) || !make()) { U.on = false; return rd.apply(this, arguments); }
      const c = E3(), cp = cam.position, far = Math.hypot(cp.x - c[0], cp.y - c[1], cp.z - c[2]) > __c320.R + 1100 && row >= TH;
      U.on = far; const F = __c317.FAR, f320 = F.getObjectByName('earth320far'), v320 = f320 && f320.visible; if (f320 && far) f320.visible = false; ball.visible = far;
      if (!far) return rd.apply(this, arguments);
      const hid = []; for (const o of s.children) if (o.visible && o !== cam && inMap(o)) { o.visible = false; hid.push(o); } U.hid = hid.length;
      try { return rd.apply(this, arguments); } finally { for (const o of hid) o.visible = true; if (f320) f320.visible = v320; } }; } catch (e) { ERR('wrap', e); }
})();
