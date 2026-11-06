/* GLX-C340 (v1.1.45): GUNS HELD PROPERLY. Whenever a gun is held (the Highland pistol or the Highland rifle) it sits at a fixed spot to the
   right of the view, pointing straight at the crosshair, clear of the arm, at a real size. Holding LT (right mouse) brings its own iron
   sights to the middle of the screen. Each shot kicks the gun back and up and eases it home; the flash and smoke come out of the barrel,
   and a bright streak runs from the barrel straight to whatever the shot hits (the shot itself is instant). */
(function c340() {
  const U = window.__c340 = {err: null, on: 0, shots: 0, k: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const M1 = new THREE.Matrix4(), M2 = new THREE.Matrix4(), Md = new THREE.Matrix4(), v = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), E = new THREE.Euler();
  const relTo = (o, top, out) => { out.identity(); for (let x = o; x && x !== top; x = x.parent) { x.updateMatrix(); out.premultiply(x.matrix); if (x.parent === top) return true; } return false; };
  const gun = () => { try { const g = held && held.children[0]; return g && g.userData && g.userData.gun && GUN[selId] && cnt(selId) > 0 ? g : null; } catch (_) { return null; } };
  const tp = () => !!(window.__thirdPerson || (typeof camMode !== 'undefined' && camMode));
  const aim = () => { try { return !!((window.__c288 && __c288.aiming) || (window.__c145 && __c145.hold)); } catch (_) { return false; } };
  let hid = []; const armVis = (on, g) => { try { if (on) { for (const o of hid) o.visible = true; hid = []; return; } if (hid.length) return; for (const ch of hand.children) { let a = g, inG = false; while (a) { if (a === ch) { inG = true; break; } a = a.parent; } if (!inG && ch.visible) { ch.visible = false; hid.push(ch); } } U.hid = hid.length; } catch (_) {} };
  let k = 0, kick = 0, last = performance.now();
  const HIP = {pistol: [0.19, -0.12, -0.44], rifle: [0.19, -0.14, -0.5]};
  try { const uh = updateHand; updateHand = function (dt) { const r = uh.apply(this, arguments); try { const g = gun(); U.on = g ? 1 : 0; if (!g || tp()) { armVis(true); return r; }
        if (window.__vm) { U.poseOff = 1; return r; }   /* v1.1.96: viewmodel owns pose+scale; C340 keeps shot FX only */
        const now = performance.now(), d = Math.min(0.1, (now - last) / 1000); last = now; k += ((aim() ? 1 : 0) - k) * (1 - Math.exp(-d * 14)); U.k = +k.toFixed(2); kick *= Math.exp(-d * 11);
        if (now - (U.lt || 0) > 400) { U.lt = now; held.traverse(o => { if (o.isMesh && o.material) for (const m of [].concat(o.material)) if (m.emissive && m.color && !m.emissive.getHex()) { U.lit = (U.lit || 0) + 1; m.emissive.copy(m.color).multiplyScalar(0.45); if (m.emissiveMap === null && m.map) m.emissiveMap = m.map; m.needsUpdate = true; } }); }
        if (!relTo(g, hand, M1)) return r; M1.decompose(v, q, sc); const u = g.userData; if (!u.__s0Base) { const s0 = Math.abs(sc.x * (hand.scale.x || 1)); if (s0 > 0.05 && s0 < 20) u.__s0Base = s0; } const s = u.__s0 = u.__s0Base || 1, isP = u.gun === IT.PISTOL, sg = u.sight ? u.sight.clone().multiplyScalar(s) : new THREE.Vector3(0, 0.04 * s, 0);
        const h0 = HIP[isP ? 'pistol' : 'rifle'], asp = Math.min(1, (camera.aspect || 1.6) / 1.6), h = [h0[0] * (0.35 + 0.65 * asp), h0[1], h0[2]], ads = [0, (isP ? -0.035 : -0.03), (isP ? -0.26 : -0.42) - 0.16 * s];
        const tx = h[0] + (ads[0] - h[0]) * k, ty = h[1] + (ads[1] - h[1]) * k + 0.01 * kick, tz = h[2] + (ads[2] - h[2]) * k + (isP ? 0.05 : 0.08) * kick;
        const tgt = new THREE.Vector3(tx, ty, tz).sub(sg.clone().multiplyScalar(k)); E.set((isP ? 0.28 : 0.16) * kick, -0.04 * (1 - k), 0); const Q = new THREE.Quaternion().setFromEuler(E);
        Md.compose(tgt, Q, new THREE.Vector3(s, s, s)); M2.copy(M1).invert(); Md.multiply(M2); Md.decompose(v, q, sc); hand.position.copy(v); hand.quaternion.copy(q); hand.scale.copy(sc); armVis(k < 0.5, g); } catch (e) { ERR('hand', e); } return r; }; } catch (e) { ERR('uh', e); }
  // the streak from the barrel to the hit, and the flash and smoke at the barrel (not in front of the eyes)
  const LM = new THREE.LineBasicMaterial({color: 0xffe6a0, transparent: true, opacity: 0.9, depthWrite: false, fog: false}), lines = [];
  const muzzle = () => { const g = gun(); if (!g || !g.userData.muzzle) return null; const w = new THREE.Vector3(); g.updateMatrixWorld(true); g.userData.muzzle.getWorldPosition(w); return w; };
  try { const fg = fireGun; fireGun = function (id) { const d = lookDir(), o = new THREE.Vector3(P.x, P.y + EYE, P.z), mz = tp() ? null : muzzle(), b0 = burst;
      burst = function (x, y, z, col, n, sz) { if (col === 0xd0d0d0 && n === 1) return; if (col === 0xb8b8b8) { n = 3; sz = 0.12; } if (col === 0xffd080) { n = 3; sz = 0.07; } if (col === 0x8a8070) { n = 4; sz = 0.12; } if (mz && (col === 0xffd080 || col === 0xb8b8b8)) { x = mz.x; y = mz.y; z = mz.z; } const p0 = parts.length, rr = b0.apply(this, [x, y, z, col, n, sz].concat([].slice.call(arguments, 6))); if (col === 0xffd080 || col === 0xb8b8b8) for (let i = p0; i < parts.length; i++) { const q = parts[i]; q.m.scale.multiplyScalar(0.3); q.vx *= 0.25; q.vy *= 0.25; q.vz *= 0.25; q.life *= 0.5; q.grav = false; } return rr; };
      let r; try { r = fg.apply(this, arguments); } finally { burst = b0; }
      try { kick = 1; U.shots++; const G = GUN[id]; let t = G.range || 60; { let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z); const dx = d[0], dy = d[1], dz = d[2], sx = dx > 0 ? 1 : dx < 0 ? -1 : 0, sy = dy > 0 ? 1 : dy < 0 ? -1 : 0, sz = dz > 0 ? 1 : dz < 0 ? -1 : 0; const tDx = sx ? Math.abs(1 / dx) : 1e9, tDy = sy ? Math.abs(1 / dy) : 1e9, tDz = sz ? Math.abs(1 / dz) : 1e9; let tMx = sx ? ((sx > 0 ? (x + 1 - o.x) : (o.x - x)) * tDx) : 1e9, tMy = sy ? ((sy > 0 ? (y + 1 - o.y) : (o.y - y)) * tDy) : 1e9, tMz = sz ? ((sz > 0 ? (z + 1 - o.z) : (o.z - z)) * tDz) : 1e9, tt = 0; for (let i = 0; i < Math.ceil(t) + 4; i++) { if (tt > 0.05 && solid(x, y, z)) { t = Math.min(t, tt); break; } if (tMx < tMy) { if (tMx < tMz) { tt = tMx; tMx += tDx; x += sx; } else { tt = tMz; tMz += tDz; z += sz; } } else { if (tMy < tMz) { tt = tMy; tMy += tDy; y += sy; } else { tt = tMz; tMz += tDz; z += sz; } } if (tt >= t) break; } }
        const a = mz || o.clone().add(new THREE.Vector3(d[0], d[1] - 0.2, d[2]).multiplyScalar(0.6)), e = o.clone().add(new THREE.Vector3(d[0], d[1], d[2]).multiplyScalar(t));
        const L = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, e]), LM.clone()); L.frustumCulled = false; L.userData.t = 0.09; scene.add(L); lines.push(L); } catch (e2) { ERR('tr', e2); }
      return r; }; } catch (e) { ERR('fg', e); }
  setInterval(() => { for (let i = lines.length - 1; i >= 0; i--) { const L = lines[i]; L.userData.t -= 0.03; L.material.opacity = Math.max(0, L.userData.t / 0.09); if (L.userData.t <= 0) { scene.remove(L); L.geometry.dispose(); L.material.dispose(); lines.splice(i, 1); } } }, 30);
})();
