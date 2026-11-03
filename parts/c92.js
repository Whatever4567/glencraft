
/* ===================== GLX-C92: the DS plays ON the in-world TV (v0.9.70) ===================== */
(function dsOnTV() {
  const A = window.__arcade; if (!A) return;
  // Hybrid Top: big top screen + small touch screen beside it (2:1, the closest fit for the TV's screen)
  A.dsOpts = {'melonds_screen_layout': 'Hybrid Top', 'melonds_hybrid_ratio': '2', 'melonds_hybrid_small_screen': 'Bottom', 'melonds_screen_gap': '0'};
  A.dsFrame = [768, 384];
  const st = document.createElement('style'); st.textContent = '#arcFrame{width:' + A.dsFrame[0] + 'px!important;height:' + A.dsFrame[1] + 'px!important}'; document.head.appendChild(st);
  // loading card
  const lc = document.createElement('canvas'); lc.width = 384; lc.height = 216; const lg = lc.getContext('2d');
  const loadTex = new THREE.CanvasTexture(lc); loadTex.minFilter = loadTex.magFilter = THREE.LinearFilter; loadTex.generateMipmaps = false;
  function card(t) { lg.fillStyle = '#0b1020'; lg.fillRect(0, 0, 384, 216); lg.fillStyle = '#3cb043'; lg.font = 'bold 26px sans-serif'; lg.textAlign = 'center'; lg.fillText('DS', 192, 92); lg.fillStyle = '#cfe'; lg.font = '18px sans-serif'; lg.fillText(t, 192, 128); loadTex.needsUpdate = true; }
  const dsMat = new THREE.MeshBasicMaterial({color: 0xffffff, map: loadTex});
  dsMat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n#ifdef USE_MAP\n if (vUv.x < 0.0 || vUv.x > 1.0 || vUv.y < 0.0 || vUv.y > 1.0) diffuseColor.rgb = vec3(0.0);\n#endif'); };
  let dsTex = null, upT = 0, cw = 0, ch = 0;
  const S = window.__dstv = {uploads: 0, lastMs: 0};
  A.onTVStart = k => { card('Starting…'); dsMat.map = loadTex; dsMat.needsUpdate = true; S.k = k; S.lock = 0; };
  A.onDSCanvas = cv => {
    if (!cv) return; if (dsTex) dsTex.dispose();
    dsTex = new THREE.CanvasTexture(cv); dsTex.minFilter = THREE.LinearFilter; dsTex.magFilter = THREE.NearestFilter; dsTex.generateMipmaps = false;
    dsTex.wrapS = dsTex.wrapT = THREE.ClampToEdgeWrapping; try { dsTex.encoding = renderer.outputEncoding; } catch (_) {}
    cw = ch = 0; dsMat.map = dsTex; dsMat.needsUpdate = true;
  };
  A.onTVEnd = () => { if (dsTex) { dsTex.dispose(); dsTex = null; } dsMat.map = loadTex; S.k = null; };
  const tvObj = () => (A.tvPlay && entObjs.get(A.tvPlay.k)) || null;
  const v3 = new THREE.Vector3();
  // screen + sound every frame
  const baseUpd = updateTV;
  updateTV = function (dt) {
    const r = baseUpd.apply(this, arguments);
    const o = tvObj(); if (!o) return r;
    if (o.screen.material !== dsMat) o.screen.material = dsMat;
    o.led.material.color.setHex(0x30a0ff);
    const cv = A.dsCanvas, now = performance.now();
    if (dsTex && cv && cv.width && now - upT > 30) {
      upT = now;
      if (cv.width !== cw || cv.height !== ch) { cw = cv.width; ch = cv.height; const ar = cw / ch, sa = 0.8 / 0.54;
        if (ar < sa) { dsTex.repeat.set(sa / ar, 1); dsTex.offset.set(-(sa / ar - 1) / 2, 0); } else { dsTex.repeat.set(1, ar / sa); dsTex.offset.set(0, -(ar / sa - 1) / 2); } }
      const t0 = performance.now(); dsTex.needsUpdate = true; try { renderer.initTexture(dsTex); } catch (_) {} S.lastMs = +(performance.now() - t0).toFixed(2); S.uploads++;
    }
    if (A.dsAud && AC) {
      const t = AC.currentTime, set = (p, v) => { if (p && p.setTargetAtTime) p.setTargetAtTime(v, t, 0.05); };
      const pn = A.dsAud.pn; o.screen.getWorldPosition(v3);
      if (pn.positionX) { set(pn.positionX, v3.x); set(pn.positionY, v3.y); set(pn.positionZ, v3.z); } else pn.setPosition(v3.x, v3.y, v3.z);
      const L = AC.listener, d = lookDir(), cp = camera.position;
      if (L.positionX) { set(L.positionX, cp.x); set(L.positionY, cp.y); set(L.positionZ, cp.z); set(L.forwardX, d[0]); set(L.forwardY, d[1]); set(L.forwardZ, d[2]); set(L.upX, 0); set(L.upY, 1); set(L.upZ, 0); }
      else { L.setPosition(cp.x, cp.y, cp.z); L.setOrientation(d[0], d[1], d[2], 0, 1, 0); }
      const vol = clamp(Number(SET.sfx), 0, 1); A.dsAud.g.gain.value = Number.isFinite(vol) ? vol : 0.8;
    }
    return r;
  };
  // controller goes to the emulator, not the player
  const baseRead = readPad;
  readPad = function () {
    if (A.mode === 'ds' && !A.open) {
      const gp = pickPad(); A.dsPad(gp);
      if (gp) for (let i = 0; i < 17; i++) { const b = gp.buttons[i]; gpPrev[i] = !!(b && (b.pressed || b.value > 0.4)); }
      return {lx: 0, ly: 0, rx: 0, ry: 0};
    }
    return baseRead.apply(this, arguments);
  };
  // camera turns to face the TV and zooms so the screen fills the view; hand hidden
  const baseFrame = frame;
  frame = function (now) {
    const o = tvObj();
    if (o && !A.open) {
      o.screen.getWorldPosition(v3); const cp = camera.position, dx = v3.x - cp.x, dy = v3.y - cp.y, dz = v3.z - cp.z;
      const ty = Math.atan2(-dx, -dz), tp = Math.atan2(dy, Math.hypot(dx, dz));
      let dyaw = ty - P.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
      const k = S.lock < 1 ? 0.18 : 1; S.lock = Math.min(1, (S.lock || 0) + 0.02);
      P.yaw += dyaw * k; P.pitch += (tp - P.pitch) * k;
      S.dist = Math.hypot(dx, dy, dz);
    }
    return baseFrame.apply(this, arguments);
  };
  // applied right before the world render so nothing later in the frame undoes it
  const baseRender = renderer.render.bind(renderer);
  let zf = 0;
  renderer.render = function (sc, cam) {
    const o = cam === camera && tvObj();
    if (o) {
      hand.visible = false;
      const d = Math.max(0.6, S.dist || 2), asp = camera.aspect || 1.7;
      const half = Math.max(0.54 / 2 / 0.62, 0.8 / 2 / 0.7 / asp);   // screen fills ~2/3 of the view, world still around it
      const f = clamp(2 * Math.atan(half / d) * 180 / Math.PI, 8, SET.fov);
      zf = zf ? zf + (f - zf) * 0.12 : camera.fov;
      camera.fov = zf; camera.updateProjectionMatrix(); S.fov = +zf.toFixed(1);
    } else if (cam === camera) zf = 0;
    return baseRender(sc, cam);
  };
  // hostile mobs hold still while you play
  const baseMobs = updateMobs;
  updateMobs = function (dt) { if (A.mode === 'ds') return; return baseMobs.apply(this, arguments); };
  // tap / click the TV's touch screen
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let tdown = false;
  function toDS(e, type) {
    const o = tvObj(), cv = A.dsCanvas; if (!o || !cv || !dsTex) return false;
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    const h = ray.intersectObject(o.screen, false)[0]; if (!h || !h.uv) return false;
    const u = h.uv.x * dsTex.repeat.x + dsTex.offset.x, v = h.uv.y * dsTex.repeat.y + dsTex.offset.y;
    if (u < 0 || u > 1 || v < 0 || v > 1) return false;
    const w = A.dsWin, rc = cv.getBoundingClientRect(), x = rc.left + u * rc.width, y = rc.top + (1 - v) * rc.height;
    const ev = new w.MouseEvent(type, {bubbles: true, cancelable: true, clientX: x, clientY: y, screenX: x, screenY: y, button: 0, buttons: type === 'mouseup' ? 0 : 1, view: w});
    cv.dispatchEvent(ev); S.lastTouch = [+u.toFixed(3), +v.toFixed(3), type]; return true;
  }
  A.toDS = toDS;
  const cap = e => { if (!(A.mode === 'ds' && !A.open) || e.target && e.target.id === 'dsX') return false; e.stopPropagation(); if (e.cancelable) e.preventDefault(); return true; };
  addEventListener('pointerdown', e => { if (cap(e)) { tdown = toDS(e, 'mousedown'); } }, true);
  addEventListener('pointermove', e => { if (cap(e) && tdown) toDS(e, 'mousemove'); }, true);
  addEventListener('pointerup', e => { if (cap(e)) { if (tdown) { toDS(e, 'mouseup') || A.dsWin && A.dsCanvas && A.dsCanvas.dispatchEvent(new A.dsWin.MouseEvent('mouseup', {bubbles: true})); } tdown = false; } }, true);
  for (const t of ['mousedown', 'mouseup', 'click', 'touchstart', 'touchmove', 'touchend', 'contextmenu', 'wheel']) addEventListener(t, e => { if (A.mode === 'ds' && !A.open && !(e.target && e.target.id === 'dsX')) { e.stopPropagation(); } }, {capture: true, passive: true});
})();
