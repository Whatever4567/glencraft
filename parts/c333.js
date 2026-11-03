/* GLX-C333 (v1.1.37): DRAWING THE HOLLOW EARTH. Inside the shell a floating yellow and orange sun glows in the middle, the sky is a soft
   sky blue haze, and the far land, lakes and seas on the inside of the shell are painted on one big inside-out ball, so the horizon curves
   up round you. Near you the real blocks are drawn (the painted shell has a hole round you, like the sea). In Agartha and the drop shaft
   the sky is hidden and a dark haze hangs in the cavern, with a few floating disc saucers over the towers. Light inside: about 80% of
   daylight under the inner sun, never under 60% in Agartha. Cheap on phones: one ball, a sun and a few textures. */
(function c333() {
  const U = window.__c333 = {err: null, on: '', painted: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent) || (typeof PERF !== 'undefined' && PERF), TW = PH ? 96 : 192, RN = PH ? 2 : 3;
  const H2 = () => window.__c332, E = () => window.__c320;
  const IN = new THREE.Scene(); IN.background = new THREE.Color(0x8ccbee); IN.fog = new THREE.Fog(0x9fd3f0, 400, 6500);
  const cam = new THREE.PerspectiveCamera(70, 1, 5, 30000);
  // the inner sun
  const sun = new THREE.Mesh(new THREE.SphereGeometry(170, PH ? 16 : 28, PH ? 12 : 20), new THREE.MeshBasicMaterial({color: 0xffc23a, fog: false}));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({map: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 10, 64, 64, 64); g.addColorStop(0, 'rgba(255,220,120,1)'); g.addColorStop(0.35, 'rgba(255,170,60,0.55)'); g.addColorStop(1, 'rgba(255,150,40,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })(), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending}));
  halo.scale.setScalar(900); IN.add(sun); IN.add(halo); IN.add(new THREE.AmbientLight(0xffffff, 0.6)); const pl = new THREE.PointLight(0xffe2a0, 0.9, 0, 0); IN.add(pl);
  // the painted shell: six inside faces
  const cvs = [], texs = []; let box = null, face = 0, row = 0, boxFor = '';
  const uP = {value: new THREE.Vector3()}, uN = {value: new THREE.Vector3(0, 1, 0)}, uR = {value: 0};
  function holeMat(t) { const m = new THREE.MeshLambertMaterial({map: t, side: THREE.BackSide}); m.onBeforeCompile = sh => { sh.uniforms.uP333 = uP; sh.uniforms.uN333 = uN; sh.uniforms.uR333 = uR;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW333;').replace('#include <project_vertex>', '#include <project_vertex>\nvW333 = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vW333; uniform vec3 uP333; uniform vec3 uN333; uniform float uR333;')
        .replace('void main() {', 'void main() {\n vec3 d333 = vW333 - uP333; d333 -= dot(d333, uN333) * uN333; if (length(d333) < uR333) discard;'); }; return m; }
  let tex = null, cv = null;
  function make() { const e = E(), h = H2(); if (!e || !h) return false; const c = e.E(), k = c.join() + (h.SH() ? h.SH().x + ',' + h.SH().z : ''); if (box && boxFor === k) return true; boxFor = k;
    if (!box) { cv = document.createElement('canvas'); cv.width = TW * 2; cv.height = TW; tex = new THREE.CanvasTexture(cv); try { tex.colorSpace = THREE.SRGBColorSpace; } catch (_) {} tex.magFilter = THREE.LinearFilter;
      box = new THREE.Mesh(new THREE.SphereGeometry(h.HR() + 0.5, PH ? 48 : 96, PH ? 24 : 48), holeMat(tex)); box.frustumCulled = false; IN.add(box); }
    box.position.set(c[0], c[1], c[2]); sun.position.copy(box.position); halo.position.copy(box.position); pl.position.copy(box.position); face = 0; row = 0; return true; }
  // one picture wrapped round the ball (rows run from the top down), painted from the land function seen from inside
  function paint(ms) { const e = E(), h = H2(), c = e.E(), HR = h.HR(), sh = h.SH(), t0 = performance.now(), x = cv.getContext('2d');
    for (; face < 1 && performance.now() - t0 < ms;) { if (row === 0) U.img = x.createImageData(TW * 2, 1); const d = U.img.data, th = (row + 0.5) / TW * Math.PI;
      for (let i = 0; i < TW * 2; i++) { const ph = (i + 0.5) / (TW * 2) * Math.PI * 2, n = [-Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th)];
        const wx = c[0] + n[0] * HR, wy = c[1] + n[1] * HR, wz = c[2] + n[2] * HR, g = h.ig(wx, wy, wz, 1);
        let col = g < 0 ? [60 + 10 * g, 130 + 12 * g, 190] : g < 0.6 ? [214, 200, 150] : [70 + 6 * g, 140 - 4 * g, 60];
        if (sh && n[1] > 0.5) { const hd = Math.hypot(wx - sh.x, wz - sh.z); if (Math.abs(hd - 600) < 8) col = [235, 242, 250]; }
        const o = i * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255; }
      x.putImageData(U.img, 0, row); if (++row >= TW) { tex.needsUpdate = true; row = 0; face = 1; U.painted++; } } }
  setInterval(() => { try { if (U.on === 'hollow' && make() && face < 1) paint(PH ? 10 : 24); } catch (e) { ERR('paint', e); } }, 100);
  // floating disc saucers over the city
  const ufos = new THREE.Group(); ufos.visible = false; scene.add(ufos); let ufoFor = '';
  function saucers() { const h = H2(), sh = h && h.SH(), e = E(); if (!sh || !e) return; const k = sh.x + ',' + sh.z; if (ufoFor === k) return; ufoFor = k; while (ufos.children.length) ufos.remove(ufos.children[0]);
    const body = new THREE.MeshLambertMaterial({color: 0x8a9098}), glow = new THREE.MeshBasicMaterial({color: 0x9ff3ff}), y0 = e.E()[1] + h.CF();
    for (const [a, rr, hy] of [[0.6, 55, 58], [2.4, 75, 44], [4.3, 40, 62]]) { const g = new THREE.Group(); const d = new THREE.Mesh(new THREE.CylinderGeometry(6, 7.5, 1.4, 20), body), t = new THREE.Mesh(new THREE.SphereGeometry(3, 14, 8, 0, 6.283, 0, 1.6), glow), r = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.25, 6, 24), glow);
      r.rotation.x = Math.PI / 2; t.position.y = 0.6; g.add(d, t, r); g.position.set(sh.x + Math.cos(a) * rr, y0 + hy, sh.z + Math.sin(a) * rr); g.userData.a = a; ufos.add(g); } }
  // light floor: 80% under the inner sun, 60% in Agartha
  function hookLight() { const L = window.__lminU; if (!L || L.__c333) return; const d = Object.getOwnPropertyDescriptor(L, 'value'); if (!d || !d.get) return;
    Object.defineProperty(L, 'value', {configurable: true, enumerable: true, get() { const v = d.get.call(L); return U.on === 'hollow' ? Math.max(v, 0.8) : U.on === 'city' || U.on === 'shaft' ? Math.max(v, 0.6) : U.on === 'deep' ? Math.max(v, 0.35) : v; }, set(v) { d.set.call(L, v); }}); L.__c333 = 1; }
  setInterval(() => { try { hookLight(); const w = H2() ? H2().where() : ''; U.on = w; ufos.visible = w === 'city'; if (w === 'city') saucers(); } catch (e) { ERR('w', e); } }, 250);
  const QS = (() => { const f = window.__c321; return [0, 1, 2, 3, 4, 5].map(a => { const m = [f.toW(a, [1, 0, 0]), f.toW(a, [0, 1, 0]), f.toW(a, [0, 0, 1])]; return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...m[0]), new THREE.Vector3(...m[1]), new THREE.Vector3(...m[2]))); }); })();
  const HIDE = () => { const a = []; try { a.push(skyDome, stars, sunDisc, moonDisc); } catch (_) {} for (const n of ['earth320', 'planets318', 'earth324far']) { const o = scene.getObjectByName(n); if (o) a.push(o); } return a; };
  const DARK = new THREE.Color(0x07080c), HAZE = new THREE.Color(0x9fd3f0), CAVE = new THREE.Color(0x15171d);
  let t = 0;
  try { const rd = renderer.render; renderer.render = function (s, c) { const w = U.on; if (s !== scene || !c || !c.isPerspectiveCamera || !w || (typeof DIM !== 'undefined' && DIM.cur)) return rd.apply(this, arguments);
      const hid = [], bg = scene.background, fog = scene.fog, f0 = fog ? [fog.color.getHex(), fog.near, fog.far] : null, ac = renderer.autoClear;
      try { for (const o of HIDE()) if (o && o.visible) { o.visible = false; hid.push(o); } t += 0.016; for (const g of ufos.children) { g.rotation.y += 0.01; g.position.y += Math.sin(t + g.userData.a * 3) * 0.02; }
        if (w === 'hollow') { const f = window.__c321, p = f.pW(c.position.x, c.position.y, c.position.z); cam.position.set(p[0], p[1], p[2]); cam.quaternion.copy(QS[f.ax]).multiply(c.quaternion); if (f.TQ && Math.abs(f.TQ.w) < 0.99999) cam.quaternion.premultiply(f.TQ); if (cam.fov !== c.fov || cam.aspect !== c.aspect) { cam.fov = c.fov; cam.aspect = c.aspect; cam.updateProjectionMatrix(); } cam.updateMatrixWorld(true);
          const q = f.pw(), e = E(), cc = e.E(), d = [q.x - cc[0], q.y - cc[1], q.z - cc[2]], dl = Math.hypot(d[0], d[1], d[2]) || 1; uP.value.set(q.x, q.y, q.z); uN.value.set(d[0] / dl, d[1] / dl, d[2] / dl); uR.value = RN * CH - CH / 2 - 1;
          if (box) { renderer.autoClear = true; rd.call(this, IN, cam); renderer.autoClear = false; renderer.clearDepth(); } scene.background = null; if (fog) { fog.color.copy(HAZE); fog.near = 40; fog.far = RN * CH * 1.6; } }
        else { scene.background = w === 'city' ? CAVE : DARK; if (fog) { fog.color.copy(w === 'city' ? CAVE : DARK); fog.near = w === 'city' ? 30 : w === 'deep' ? 20 : 12; fog.far = w === 'city' ? 95 : w === 'deep' ? 80 : 60; } }
        return rd.apply(this, arguments); } catch (e) { ERR('rd', e); return rd.apply(this, arguments); }
      finally { scene.background = bg; if (fog && f0) { fog.color.setHex(f0[0]); fog.near = f0[1]; fog.far = f0[2]; } renderer.autoClear = ac; for (const o of hid) o.visible = true; } }; } catch (e) { ERR('rd0', e); }
})();
