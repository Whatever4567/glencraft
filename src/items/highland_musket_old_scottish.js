/* ===================== GLX-C145 (v1.0.21): the Highland musket - an old Scottish flintlock (no scope) + hold LT / right mouse to aim down the iron sights ===================== */
(function c145() {
  const MK = IT.MUSKET || 213, S = window.__c145 = {adsK: 0, hold: false, force: 0, fired: 0, swallowed: 0, err: null, built: 0, icon: 0};
  const warn = (w, e) => { S.err = w + ': ' + (e && e.message || e); console.warn('c145', w, e); };
  const musket = () => selId === MK && (MODE.infinite || cnt(MK) > 0);
  S.gunHeld = () => { try { return !!(GUN[selId] && cnt(selId) > 0); } catch (_) { return false; } };
  try { NAMES[MK] = 'Highland musket'; for (const r of RECIPES) if (r.out === MK) r.name = 'Highland musket'; } catch (_) {}
  // ---- Glencraft pixel textures (32 px tiles, crisp) ----
  let sd = 1451; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const px = (fn) => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); fn(g); const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.c121s = 1; if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const dots = (g, cols, n) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[(rnd() * cols.length) | 0]; g.fillRect((rnd() * 32) | 0, (rnd() * 32) | 0, 1, 1); } };
  const TX = {
    wood: px(g => { g.fillStyle = '#3b2212'; g.fillRect(0, 0, 32, 32); for (let y = 0; y < 32; y++) { if (rnd() < 0.45) { g.fillStyle = rnd() < 0.5 ? '#2c180c' : '#4a2c16'; let x = (rnd() * 32) | 0; const l = 6 + (rnd() * 20) | 0; g.fillRect(x, y, l, 1); g.fillRect(x - 32, y, l, 1); } }
      dots(g, ['#5a3820', '#23130a', '#452814'], 40); g.fillStyle = '#23130a'; g.fillRect(20, 12, 2, 2); g.fillStyle = '#2c180c'; g.fillRect(19, 11, 4, 1); }),
    brass: px(g => { g.fillStyle = '#b08a32'; g.fillRect(0, 0, 32, 32); dots(g, ['#c9a548', '#8a6a22', '#e0c070', '#9c7a2a'], 260); for (let x = 0; x < 32; x += 8) { g.fillStyle = '#d8b858'; g.fillRect(x, 0, 1, 32); } }),
    iron: px(g => { g.fillStyle = '#3c3f44'; g.fillRect(0, 0, 32, 32); dots(g, ['#2e3034', '#50545a', '#3a4250', '#5e6268'], 300); g.fillStyle = '#5a5e64'; g.fillRect(0, 0, 32, 1); g.fillRect(0, 16, 32, 1); }),
    flint: px(g => { g.fillStyle = '#8a8a80'; g.fillRect(0, 0, 32, 32); dots(g, ['#6e6e66', '#a8a89c'], 200); })
  };
  const MAT = {}; for (const k in TX) { MAT[k] = new THREE.MeshStandardMaterial({map: TX[k], roughness: k === 'wood' ? 0.8 : k === 'brass' ? 0.4 : 0.5, metalness: k === 'brass' ? 0.6 : k === 'iron' ? 0.45 : 0}); MAT[k].c121 = 1; }
  // box with world-sized UVs (one 32 px tile per 16 cm, grain along the long axis) so the pixels stay square
  const TILE = 0.16;
  function pbox(p, m, w, h, d, x, y, z, rx) { const geo = new THREE.BoxGeometry(w, h, d), P = geo.attributes.position, N = geo.attributes.normal, UV = geo.attributes.uv;
    for (let i = 0; i < P.count; i++) { const nx = Math.abs(N.getX(i)), ny = Math.abs(N.getY(i)); const X = P.getX(i) + x, Y = P.getY(i) + y, Z = P.getZ(i) + z;
      if (nx > 0.5) UV.setXY(i, Z / TILE, Y / TILE); else if (ny > 0.5) UV.setXY(i, Z / TILE, X / TILE); else UV.setXY(i, X / TILE, Y / TILE); }
    UV.needsUpdate = true; const b = new THREE.Mesh(geo, MAT[m]); b.position.set(x, y, z); if (rx) b.rotation.x = rx; b.castShadow = false; p.add(b); return b; }
  // ---- the flintlock, barrel along -z (same frame as the old rifle so poses/animations still fit) ----
  const SIGHT = new THREE.Vector3(0, 0.053, 0.04);
  function build(g) { const u = g.userData, rig = u.rig; if (!rig) return; while (rig.children.length) rig.remove(rig.children[0]);
    // long full stock in dark walnut with a drooping Highland butt
    pbox(rig, 'wood', 0.044, 0.034, 0.58, 0, 0.012, -0.21);             // fore-end, almost to the muzzle
    pbox(rig, 'wood', 0.048, 0.056, 0.12, 0, 0.0, 0.14);                // lock area
    pbox(rig, 'wood', 0.04, 0.042, 0.11, 0, -0.014, 0.25, 0.08);        // wrist
    pbox(rig, 'wood', 0.046, 0.11, 0.18, 0, -0.05, 0.385, 0.1);         // butt
    pbox(rig, 'brass', 0.049, 0.116, 0.012, 0, -0.058, 0.478, 0.1);     // brass butt plate
    pbox(rig, 'brass', 0.046, 0.036, 0.02, 0, 0.012, -0.51);            // nose cap
    pbox(rig, 'brass', 0.003, 0.026, 0.07, -0.026, 0.004, 0.14);        // side plate
    pbox(rig, 'brass', 0.03, 0.004, 0.03, 0, 0.032, 0.27);              // wrist escutcheon
    // long iron barrel, breech and muzzle ring
    pbox(rig, 'iron', 0.024, 0.024, 0.78, 0, 0.03, -0.31);
    pbox(rig, 'iron', 0.028, 0.028, 0.05, 0, 0.03, 0.075);
    pbox(rig, 'iron', 0.027, 0.027, 0.012, 0, 0.03, -0.695);
    // ramrod in brass pipes under the barrel
    pbox(rig, 'wood', 0.008, 0.008, 0.68, 0, -0.012, -0.3);
    for (const z of [-0.12, -0.3, -0.46]) pbox(rig, 'brass', 0.014, 0.014, 0.03, 0, -0.012, z);
    // brass trigger guard + iron trigger
    pbox(rig, 'brass', 0.012, 0.006, 0.1, 0, -0.04, 0.17); pbox(rig, 'brass', 0.012, 0.02, 0.006, 0, -0.03, 0.12); pbox(rig, 'brass', 0.012, 0.02, 0.006, 0, -0.03, 0.22);
    pbox(rig, 'iron', 0.006, 0.022, 0.006, 0, -0.024, 0.165, -0.3);
    // flintlock on the right: lock plate, brass pan, frizzen, and the cock holding a flint
    pbox(rig, 'iron', 0.004, 0.03, 0.1, 0.026, 0.012, 0.13);
    pbox(rig, 'brass', 0.014, 0.008, 0.018, 0.03, 0.03, 0.092);
    pbox(rig, 'iron', 0.006, 0.03, 0.006, 0.03, 0.048, 0.086, -0.2);
    const slide = new THREE.Group(); rig.add(slide); const cock = new THREE.Group(); cock.position.set(0.032, 0.022, 0.15); slide.add(cock);
    pbox(cock, 'iron', 0.006, 0.04, 0.01, 0, 0.018, 0, 0.55); pbox(cock, 'iron', 0.01, 0.012, 0.018, 0, 0.038, -0.016); pbox(cock, 'flint', 0.008, 0.006, 0.012, 0, 0.038, -0.03);
    // iron sights: brass front blade at the muzzle, notched rear sight on the breech
    pbox(rig, 'brass', 0.003, 0.014, 0.008, 0, 0.047, -0.675);
    pbox(rig, 'iron', 0.02, 0.006, 0.01, 0, 0.048, 0.04); pbox(rig, 'iron', 0.004, 0.008, 0.006, -0.0055, 0.053, 0.04); pbox(rig, 'iron', 0.004, 0.008, 0.006, 0.0055, 0.053, 0.04);
    const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.03, -0.71); rig.add(muzzle);
    const mag = new THREE.Group(); rig.add(mag);
    Object.assign(u, {slide, mag, muzzle, cock, flint: 1, sight: SIGHT.clone()});
    rig.traverse(c => { if (c.isMesh) c.layers.mask = g.layers.mask; }); S.built++; }
  try { const mi = makeItemMesh; makeItemMesh = function (id) { const m = mi.apply(this, arguments); try { if (id === MK && m && m.userData && m.userData.rig) build(m); } catch (e) { warn('build', e); } return m; }; } catch (e) { warn('wrapMesh', e); }
  // ---- pixel icon: a flintlock on the diagonal, butt bottom-left, muzzle top-right ----
  function icon() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const R = Math.SQRT1_2; sd = 77;
    const W = {wood: ['#3b2212', '#4e2e18', '#2a170b'], brass: ['#b08a32', '#e0c070', '#7a5c1c'], iron: ['#44484e', '#6a7078', '#24262a'], flint: ['#8a8a80', '#a8a89c', '#5a5a52']};
    const reg = (a, up) => {   // a: 0 butt -> 76 muzzle, up: pixels above the bore line
      if (a >= 73 && a < 75 && up >= 3 && up < 5.5) return 'brass';
      if (a >= 39 && a < 41 && up >= 3 && up < 4.8) return 'iron';
      if (a >= 30 && a < 76 && up >= 1 && up < 3.4) return 'iron';
      if (a >= 33 && a < 37 && up >= 3 && up < 7) return a > 35.5 && up > 5 ? 'flint' : 'iron';
      if (a >= 0 && a < 1.6 && up >= -8 && up < 3) return 'brass';
      if (a >= 64 && a < 66 && up >= -1.6 && up < 1.4) return 'brass';
      for (const p of [46, 54, 61]) if (a >= p && a < p + 1.6 && up >= -2.8 && up < -1.4) return 'brass';
      if (a >= 22 && a < 31 && up >= -5.6 && up < -2.6 && !(a >= 23.5 && a < 29.5 && up >= -4.4)) return 'brass';
      if (a >= 29 && a < 37 && up >= -0.6 && up < 1.8) return 'iron';
      if (a < 18) return up >= -8 + a * 0.18 && up < 2.8 ? 'wood' : null;
      if (a < 28) return up >= -3 && up < 2.4 ? 'wood' : null;
      if (a < 38) return up >= -3 && up < 3 ? 'wood' : null;
      if (a < 64) return up >= -1.4 && up < 1.2 ? 'wood' : null;
      return null; };
    const grid = []; for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const dx = x + 0.5 - 6, dy = y + 0.5 - 58; const a = (dx - dy) * R, up = -(dx + dy) * R; grid[y * 64 + x] = a >= 0 && a <= 77 ? reg(a, up) : null; }
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const k = grid[y * 64 + x]; if (k) { const above = y > 0 && x > 0 ? grid[(y - 1) * 64 + x - 1] : null, below = y < 63 && x < 63 ? grid[(y + 1) * 64 + x + 1] : null;
        const p = W[k]; g.fillStyle = above !== k ? p[1] : below !== k ? p[2] : (rnd() < 0.18 ? p[(rnd() * 3) | 0] : p[0]); g.fillRect(x, y, 1, 1); }
      else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([u, v]) => { const X = x + u, Y = y + v; return X >= 0 && Y >= 0 && X < 64 && Y < 64 && grid[Y * 64 + X]; })) { g.fillStyle = '#140a04'; g.fillRect(x, y, 1, 1); } }
    const big = document.createElement('canvas'); big.width = big.height = 256; const b = big.getContext('2d'); b.imageSmoothingEnabled = false; b.drawImage(c, 0, 0, 256, 256); return big.toDataURL(); }
  let ICON = null; try { ICON = icon(); } catch (e) { warn('icon', e); }
  const setIco = () => { if (!ICON || ICONS[MK] === ICON) return; try { if (window.__c122 && __c122.setIcon) __c122.setIcon(MK, ICON); else if (window.__c121 && __c121.setIcon) __c121.setIcon(MK, ICON); else { ICONS[MK] = ICON; } ICONS[MK] = ICON; try { if (typeof iconCache !== 'undefined') delete iconCache[MK]; } catch (_) {} S.icon++; try { renderHotbar(); } catch (_) {} } catch (e) { warn('seticon', e); } };
  setIco(); setInterval(setIco, 1500);
  // ---- input: LT / right mouse / touch Place = hold to aim; RT / left click / touch Break = fire ----
  let rmb = false, tch = false, trig = false;
  window.addEventListener('mousedown', e => { if (e.button === 2) rmb = true; if (e.button === 0 && pointerLocked && musket() && started && !menuOpen && !paused && !dead) trig = true; }, true);
  window.addEventListener('mouseup', e => { if (e.button === 2) rmb = false; }, true);
  window.addEventListener('blur', () => { rmb = tch = false; });
  /* v1.1.76: never stuck aiming after jetpack flight - a lost mouse-up or touch-up is cleared from the real button state, on pointer lock changes and on landing */
  let b2 = false, air = 0; window.addEventListener('mousemove', e => { b2 = !!(e.buttons & 2); if (rmb && !b2) rmb = false; }, true); document.addEventListener('pointerlockchange', () => { rmb = false; }); document.addEventListener('visibilitychange', () => { rmb = tch = false; });
  document.addEventListener('touchend', e => { if (tch && !(e.touches && [...e.touches].some(x => x.target && x.target.closest && x.target.closest('#bPlace')))) tch = false; }, {capture: true, passive: true});
  setInterval(() => { try { const up = !P.onGround || (typeof flying !== 'undefined' && flying) || (window.__jetOn); if (up) air++; else { if (air > 3) rmb = rmb && b2; air = 0; } } catch (_) {} }, 100);
  try { const bp = document.getElementById('bPlace'); if (bp) { bp.addEventListener('pointerdown', () => { tch = true; }); ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => bp.addEventListener(ev, () => { tch = false; })); }
    const bm = document.getElementById('bMine'); if (bm) bm.addEventListener('pointerdown', () => { if (musket()) trig = true; }); } catch (e) { warn('touch', e); }
  const padB = (i) => { try { for (const g of navigator.getGamepads ? navigator.getGamepads() : []) if (g && g.connected && g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.5)) return true; } catch (_) {} return false; };
  const fire = () => { window.__gunFire = true; try { useItem(); S.fired++; } finally { window.__gunFire = false; } };
  S.fire = fire;
  const ui = useItem;
  useItem = function () { if (musket() && !window.__gunFire && !menuOpen && !paused && !dead && started && !padB(7)) { S.swallowed++; return; } return ui.apply(this, arguments); };
  const uin = updateInteraction;
  updateInteraction = function (dt) { if (musket() && started && !menuOpen && !paused && !dead) { if (trig) { trig = false; fire(); } if (attackMouse || attackTouch) { if (attackCd > 0) attackCd -= dt; return; } } else trig = false; return uin.apply(this, arguments); };
  // less kick when aiming
  const fg = fireGun; fireGun = function (id) { const G = GUN[id], k0 = G && G.kick; S.shot = performance.now(); if (G && id === MK && S.adsK > 0.3) G.kick = k0 * 0.4; try { return fg.apply(this, arguments); } finally { if (G) G.kick = k0; } };
  // slower walking while aiming, recoil damped, the cock snaps forward on a shot
  const up = updatePlayer;
  updatePlayer = function (dt, mx, mz) { const k = 1 - 0.45 * S.adsK; if (k < 1 && typeof mx === 'number') { arguments[1] = mx * k; if (typeof mz === 'number') arguments[2] = mz * k; }
    const r = up.apply(this, arguments);
    try { const g = held.children[0]; if (g && g.userData.cock) { const u = g.userData, d = 1 - 0.55 * S.adsK; if (u.rig) { u.rig.position.z *= d; u.rig.rotation.x *= d; u.rig.position.y *= d; }
        const t = S.shot ? (performance.now() - S.shot) / 1000 : 9; u.cock.rotation.x = t < 0.06 ? -0.7 * t / 0.06 : t < 0.9 ? -0.7 * (1 - (t - 0.06) / 0.84) : 0; } } catch (_) {}
    return r; };
  // ---- aim down sights: zoom + bring the iron sights to the middle of the screen ----
  const M1 = new THREE.Matrix4(), M2 = new THREE.Matrix4(), Md = new THREE.Matrix4(), v = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), Q0 = new THREE.Quaternion();
  const relTo = (o, top, out) => { out.identity(); for (let x = o; x && x !== top; x = x.parent) { x.updateMatrix(); out.premultiply(x.matrix); if (x.parent === top) return true; } return false; };
  const uh = updateHand;
  updateHand = function (dt) {
    const want = (musket() && (rmb || tch || padB(6) || S.force) && started && !menuOpen && !paused && !dead) ? 1 : 0; S.hold = !!want;
    S.s = S.s || 0; S.adsK += (want - S.adsK) * Math.min(1, (dt || 0) * 10); if (S.adsK < 0.002) S.adsK = 0;
    const f0 = SET.fov; if (S.adsK > 0) SET.fov = f0 * (1 - 0.4 * S.adsK);
    let r; try { r = uh.apply(this, arguments); } finally { SET.fov = f0; }
    try { const g = held.children[0], tp = window.__thirdPerson || (typeof camMode !== 'undefined' && camMode);
      if (S.adsK > 0 && g && g.userData.sight && !tp && relTo(g, hand, M1)) {
        M1.decompose(v, q, sc); const s = sc.x * hand.scale.x; S.s = s; const now = performance.now() / 1000;
        const tgt = new THREE.Vector3(Math.sin(now * 1.1) * 0.0012, -0.008 + Math.sin(now * 1.7) * 0.001, -0.3 - 0.16 * s).sub(g.userData.sight.clone().multiplyScalar(s));
        Md.compose(tgt, Q0, new THREE.Vector3(s, s, s)); M2.copy(M1).invert(); Md.multiply(M2); Md.decompose(v, q, sc);
        if (!(window.__vm && __vm.on)) { hand.position.lerp(v, S.adsK); hand.quaternion.slerp(q, S.adsK); } } } catch (e) { warn('ads', e); }
    return r; };
  S.musket = musket;
})();
