/* GLX-FPA (v1.1.101 anatomical weighted hands): FIRST PERSON HD ARMS. The block arm and fist are replaced by two slim, shaped arms with sleeves, wrists and hands with
   fingers. Each arm reaches from the shoulder to its hand with a real elbow bend (two bone IK), so they follow every swing, recoil and aim.
   Rifles are held with both hands (the left hand on the foregrip); pistols take a two hand grip while aiming. Guns sway with the view, bob
   when walking, drop when sprinting, kick the arms on each shot, dip out and back in on a weapon switch, and the reload moves the hands:
   the pistol mag comes out and goes back in, the rifle bolt is worked. Chest armour shows on the sleeves. Looking down shows your stomach
   and kilt joined to your legs. */
(function fpa() {
  const U = window.__fpa = {err: null, on: 0, two: 0, rel: 0, reach: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z), Y = V3(0, 1, 0);
  const LU = 0.36, LF = 0.35; let offL = [];
  const hideOld = on => { if (!on) { for (const o of offL) o.visible = true; offL = []; return; } for (const c of [...armPivot.children, ...hand.children]) if (c !== armPivot && c !== held && c !== grabHaggis && c.visible) { c.visible = false; if (!offL.includes(c)) offL.push(c); } };
  let rig = null, skinM, shirtM, cuffM, curSleeve = -1;
  function fabric() { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#efe7d8'; g.fillRect(0, 0, 128, 128);
    let seed = 98171; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 900; i++) { const v = 200 + rnd() * 40 | 0; g.fillStyle = `rgba(${v},${v - 8},${v - 20},.35)`; g.fillRect(rnd() * 128, rnd() * 128, 1 + rnd() * 2, 1); }
    for (let y = 0; y < 128; y += 3) { g.fillStyle = 'rgba(120,100,80,.06)'; g.fillRect(0, y, 128, 1); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 3); return t; }
  function skin() { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), im = g.createImageData(256, 256);
    let seed = 7331; for (let i = 0; i < im.data.length; i += 4) { seed = (seed * 1664525 + 1013904223) >>> 0; const n = ((seed >>> 8) & 15) - 7; im.data[i] = 218 + n; im.data[i + 1] = 164 + n; im.data[i + 2] = 128 + n; im.data[i + 3] = 255; } g.putImageData(im, 0, 0);
    // Faint superficial veins, no photo overlays and no first-load procedural/model swap.
    g.strokeStyle = 'rgba(99,121,105,.07)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(36, 250); g.bezierCurveTo(94, 188, 78, 150, 134, 105); g.bezierCurveTo(162, 84, 147, 52, 188, 16); g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  function limb(r0, r1, len, m, seg) {
    const rows = 9, N = seg || 16, P = [], IX = [], UV = [];
    for (let j = 0; j <= rows; j++) { const t = j / rows, bulge = Math.sin(Math.PI * t), r = mixRadius(r0, r1, t) + bulge * len * 0.025;
      for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; P.push(Math.cos(a) * r, t * len, Math.sin(a) * r * 0.91); UV.push(i / N, t); } }
    for (let j = 0; j < rows; j++) for (let i = 0; i < N; i++) { const a = j * N + i, b = j * N + (i + 1) % N; IX.push(a, b, a + N, b, b + N, a + N); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(IX); g.computeVertexNormals(); return new THREE.Mesh(g, m); }
  const mixRadius = (a, b, t) => a + (b - a) * (t * t * (3 - 2 * t));
  function mkHand(side) {
    const h = GlenAnatomy.makeHand(side, skinM); h.userData.anatomicalRig = 1;
    if (!window.__fpaHands) window.__fpaHands = []; window.__fpaHands.push(h); return h;
  }
  function mkArm(side) { const a = new THREE.Group(); a.userData.side = side;
    const up = limb(0.078, 0.057, LU, shirtM); a.add(up); const el = limb(0.057, 0.055, 0.026, shirtM); a.add(el); const fo = limb(0.054, 0.028, LF, skinM); a.add(fo);
    const cuff = limb(0.064, 0.046, 0.085, cuffM); a.add(cuff); const h = mkHand(side); a.add(h);
    a.userData.p = {up, el, fo, cuff, h}; a.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; o.renderOrder = 2; } }); return a; }
  function make() { const st = skin(); skinM = new THREE.MeshStandardMaterial({color: 0xffffff, map: st, roughness: 0.67, metalness: 0, bumpMap: st, bumpScale: 0.00018}); shirtM = new THREE.MeshStandardMaterial({map: fabric(), roughness: 0.9}); cuffM = shirtM;
    rig = new THREE.Group(); rig.userData.R = mkArm(1); rig.userData.L = mkArm(-1); rig.add(rig.userData.R, rig.userData.L); camera.add(rig); window.__fpaR = m => { for (let a = m; a; a = a.parent) if (a === rig) return true; return false; }; U.made = 1; }
  function sleeves() { const id = armour[1] || 0; if (id === curSleeve) return; curSleeve = id; let m = shirtM; try { if (id && ARMOUR[id]) m = armourMat(ARMOUR[id].mat, true); } catch (_) {}
    for (const a of [rig.userData.R, rig.userData.L]) { a.userData.p.up.material = m; a.userData.p.el.material = m; a.userData.p.cuff.material = m; } }
  const q = new THREE.Quaternion(), tv = V3(0, 0, 0), dv = V3(0, 0, 0);
  function aimLimb(m, from, to) { m.position.copy(from); dv.subVectors(to, from); const l = dv.length() || 1; q.setFromUnitVectors(Y, dv.divideScalar(l)); m.quaternion.copy(q); return l; }
  function solve(a, S, T, grip, roll, o) { O = o || null; const side = a.userData.side, p = a.userData.p, d = V3(0, 0, 0).subVectors(T, S); let L = d.length(); const mx = LU + LF - 0.004; U.reach = Math.max(U.reach, L);
    if (L > mx) { S = T.clone().addScaledVector(d, -mx / L); d.multiplyScalar(mx / L); L = mx; } const dir = d.clone().normalize();
    const ca = Math.max(-1, Math.min(1, (LU * LU + L * L - LF * LF) / (2 * LU * L))), sa = Math.sqrt(1 - ca * ca);
    const pole = V3(side * 0.7, -1, 0.35); const perp = pole.sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize(); const E = S.clone().add(dir.clone().multiplyScalar(LU * ca)).add(perp.multiplyScalar(LU * sa));
    aimLimb(p.up, S, E); p.el.position.copy(E); aimLimb(p.fo, E, T); const fdir = V3(0, 0, 0).subVectors(T, E).normalize(); p.cuff.position.copy(E).addScaledVector(fdir, LF * 0.05); p.cuff.quaternion.copy(p.fo.quaternion);
    p.h.position.copy(T); if (O) { hb.makeBasis(O.x, O.y, O.z); p.h.quaternion.setFromRotationMatrix(hb); } else { p.h.quaternion.copy(p.fo.quaternion); p.h.rotateY(roll || 0); }
    const cu = O && O.c, gripCurls = cu || [grip, grip * 1.05, grip, grip * 0.9];
    // The sole finger-pose writer. Wrist targets and the item root are never multiplied frame-on-frame.
    if (p.h.userData.pose) p.h.userData.pose(gripCurls, O && O.t != null ? O.t : grip * 0.62, 0);
  }
  // v1.1.55: per item grips - the hand is turned so the palm faces what it holds, the wrist sits back from the grip point and each finger curls on its own
  const hb = new THREE.Matrix4(), bb = new THREE.Box3(); let O = null;
  function grip(G, pn, fd, c) { const z = pn.clone().normalize(), y = fd.clone().addScaledVector(z, -fd.dot(z)).normalize(), x = V3(0, 0, 0).crossVectors(y, z); O = {x, y, z, c}; return G.clone().addScaledVector(y, -0.075).addScaledVector(z, -0.032); }
  const local = (o, out) => { o.updateMatrixWorld(true); o.getWorldPosition(out); return camera.worldToLocal(out); };
  let lastYaw = 0, lastPitch = 0, swx = 0, swy = 0, sel = -1, sw = 1, tm = 0, sp = 0;
  const gunNow = () => { try { const g = held && held.children[0]; return g && g.userData && g.userData.gun && GUN[selId] && cnt(selId) > 0 ? g : null; } catch (_) { return null; } };
  try { const uh = updateHand; updateHand = function (dt) { const r = uh.apply(this, arguments); try { step(Math.min(0.05, dt || 0.016)); } catch (e) { ERR('step', e); } return r; }; } catch (e) { ERR('uh', e); }
  // a bounding box that also reads squeezed (normalized integer) model data right
  const gbox = geo => { const p = geo.attributes.position, A = p.array, n = p.normalized ? (A instanceof Int16Array ? 1 / 32767 : A instanceof Int8Array ? 1 / 127 : A instanceof Uint16Array ? 1 / 65535 : A instanceof Uint8Array ? 1 / 255 : 1) : 1, b = new THREE.Box3(), v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) b.expandByPoint(v.fromBufferAttribute(p, i).multiplyScalar(n)); return b; };
  U.step = dt => step(dt); U.rig = () => rig;
  function step(dt) { const on = camMode === 0 && hand.visible && started && SET.hd !== 0 && !(window.__fpaOff); U.on = on ? 1 : 0; if (!on) { if (rig) rig.visible = false; hideOld(false); return; }
    if (!rig) make(); sleeves(); rig.visible = true; hideOld(true); tm += dt;
    // sway with the view, breathing, bob, sprint drop and the weapon switch dip (added on top of whatever placed the hand)
    let dy = P.yaw - lastYaw; if (dy > Math.PI) dy -= 2 * Math.PI; if (dy < -Math.PI) dy += 2 * Math.PI; const dp = P.pitch - lastPitch; lastYaw = P.yaw; lastPitch = P.pitch;
    const k = window.__c340 ? +__c340.k || 0 : 0, sk = 1 - 0.85 * k; swx += (Math.max(-0.08, Math.min(0.08, -dy * 0.5)) - swx) * Math.min(1, dt * 10); swy += (Math.max(-0.06, Math.min(0.06, -dp * 0.5)) - swy) * Math.min(1, dt * 10);
    if (selId !== sel) { sel = selId; sw = 0; } sw = Math.min(1, sw + dt * 3.2); const dip = (1 - Math.sin(sw * Math.PI / 2)) * 0.35;
    sp += ((typeof sprinting !== 'undefined' && sprinting && P.onGround ? 1 : 0) * (1 - k) - sp) * Math.min(1, dt * 6);
    const g = gunNow(), br = Math.sin(tm * 1.6) * 0.004 * sk, bob = (typeof bobAmt === 'number' ? bobAmt : 0) * sk;
    const VM = !!(window.__vm && __vm.on); if (VM && !U.fromVm) return;   /* v1.1.94: with a gun the viewmodel owns the pose and calls back once it is placed */
    if (VM) {} else if (g) { const ss = sp * sp * (3 - 2 * sp), fb = Math.abs(Math.sin(walkPhase)); hand.position.x += swx * sk * (1 - ss) + Math.cos(walkPhase) * 0.012 * bob * (1 - ss) + ss * 0.015; hand.position.y += swy * sk * (1 - ss) + br - fb * 0.012 * bob * (1 - ss) - ss * (0.04 + fb * 0.015); hand.position.z += ss * 0.03; hand.rotation.y += swx * 1.2 * sk * (1 - ss) - ss * 0.22; hand.rotation.x += -swy * sk * (1 - ss) - ss * 0.32; hand.rotation.z += ss * 0.42; U.sp = +ss.toFixed(2); }
    else { hand.position.x += swx * 0.6; hand.position.y += swy * 0.6 + br; }
    if (!VM) { hand.position.y -= dip; hand.rotation.x -= dip * 1.5; }
    // reload: the gun tips, the hands work it
    let rp = -1; try { if (gunReload > 0 && GUN[gunReloadId] && gunReloadId === selId) rp = 1 - gunReload / GUN[gunReloadId].reload; } catch (_) {} try { const R = window.__rl; if (rp < 0 && R && R.t > 0 && R.id === selId) { const x = 1 - R.t / R.dur; rp = x * x * (3 - 2 * x); } } catch (_) {} U.rel = rp >= 0 ? +rp.toFixed(2) : 0;
    const rw = rp >= 0 ? Math.sin(Math.min(1, rp) * Math.PI) : 0; if (g && rw && !VM) { hand.rotation.z += 0.5 * rw; hand.rotation.x += 0.25 * rw; hand.position.y -= 0.03 * rw; }
    hand.updateMatrixWorld(true);
    const SR = V3(0.2, -0.36, 0.02), SL = V3(-0.17, -0.34, -0.04), R = rig.userData.R, L = rig.userData.L;
    const isP = g && g.userData.gun === IT.PISTOL;
    let TR; if (g) { TR = local(g, V3(0, 0, 0)); TR.y -= isP ? 0.07 : 0.03; if (isP) TR.z += 0.03; { try { let lb = g.userData.__lb; if (lb && g.userData.__lbc !== g.userData.c322) lb = null; if (!lb) { g.userData.__lbc = g.userData.c322; lb = new THREE.Box3(); const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), mm = new THREE.Matrix4(); g.traverse(m => { let vis = true; for (let x = m; x && x !== g; x = x.parent) if (!x.visible) vis = false; if (m.isMesh && m.geometry && vis) { mm.multiplyMatrices(inv, m.matrixWorld); lb.union(gbox(m.geometry).applyMatrix4(mm)); } }); g.userData.__lb = lb; }
          const fwL = g.userData.muzzle ? g.worldToLocal(g.userData.muzzle.getWorldPosition(V3(0, 0, 0))).sub(lb.getCenter(V3(0, 0, 0))) : V3(0, 0, -1), back = fwL.z < 0 ? lb.max.z : lb.min.z, dz = (lb.max.z - lb.min.z) * (fwL.z < 0 ? -1 : 1);
          TR = camera.worldToLocal(g.localToWorld(V3((lb.min.x + lb.max.x) / 2, lb.min.y + (lb.max.y - lb.min.y) * (isP ? 0.3 : 0.22), back + dz * (isP ? 0.22 : 0.3)))); if (isP) { TR.y -= 0.07 * k; TR.z += 0.05 * k; } } catch (_) {} } } else if (held.children.length) { TR = local(held, V3(0, 0, 0)); TR.y -= held.children[0].userData.block ? 0.1 : 0.03; TR.z += 0.03; } else { TR = local(held, V3(0, 0, 0)); TR.y -= 0.02; }
    if (g && !isP && rp >= 0 && rw) { const mz = g.userData.muzzle ? local(g.userData.muzzle, V3(0, 0, 0)) : TR.clone().add(V3(0, 0, -0.6)); const ax = mz.clone().sub(TR).normalize(); TR = TR.clone().addScaledVector(ax, 0.12 * rw).add(V3(0.04 * rw, 0.03 * rw, 0)); }
    // Avoid the eye without independently moving palms off the gun grip: shoulders follow target at extreme reach.
    { if (g && TR.z > -0.30) TR.z = -0.30; }
    let OR = null; const fw = g && g.userData.muzzle ? local(g.userData.muzzle, V3(0, 0, 0)).sub(local(g, V3(0, 0, 0))).normalize() : V3(0, 0, -1);
    if (g) { if (!isP) { const tu = window.__fpaT || (window.__vm && __vm.on ? [0.012, -0.012, 0] : [0.03, 0.06, 0]); TR.add(V3(tu[0], tu[1], tu[2])); } TR = grip(TR, V3(-1, 0.08, 0).addScaledVector(fw, -0.08), V3(0, -1, 0.05).addScaledVector(fw, isP ? 0.5 : 0.35), [isP ? 0.7 : 0.95, isP ? 0.95 : 1.15, isP ? 1.0 : 1.2, isP ? 1.05 : 1.25]); OR = O; if (OR) OR.t = isP ? 0.9 : 1.05; }
    else if (held.children.length && held.children[0].userData.block) { TR = grip(TR.add(V3(0.01, 0.05, -0.02)), V3(0.15, 0.1, 1), V3(0, 1, 0.05), [0.72, 0.78, 0.82, 0.88]); OR = O; if (OR) OR.t = 0.85; }
    else if (held.children.length) { TR = grip(TR.add(V3(0.01, -0.01, 0.01)), V3(-0.2, 0.05, 0.95), V3(0.05, 1, 0), [0.9, 0.95, 1.0, 1.05]); OR = O; if (OR) OR.t = 1.0; }
    solve(R, SR, TR, held.children.length ? 1 : 0.85, -0.3, OR);
    let two = false; if (g) { two = !isP || k > 0.3; if (two) { let TL;
        if (!isP) { const mz = g.userData.muzzle ? local(g.userData.muzzle, V3(0, 0, 0)) : TR.clone().add(V3(0, 0, -0.6)); TL = null; for (let f = 0.55; f >= 0.15; f -= 0.05) { const c = TR.clone().lerp(mz, f); c.y -= 0.03; if (c.distanceTo(SL) <= LU + LF - 0.01) { TL = c; break; } } if (!TL) { TL = TR.clone().lerp(mz, 0.15); TL.y -= 0.03; } }
        else { TL = TR.clone().add(V3(-0.035, -0.02, 0.015)); }
        if (rp >= 0 && rw && isP) TL.add(V3(-0.05 * rw, -0.22 * rw, 0.06 * rw));
        const OL0 = isP ? grip(TL, V3(1, 0.15, 0), V3(0, -0.35, 0).addScaledVector(fw, 0.75), [0.9, 0.95, 1, 1]) : grip(TL, V3(0.05, 1, 0.1), V3(0.85, 0.2, 0).addScaledVector(fw, -0.25), [0.8, 0.88, 0.92, 0.98]); if (O) O.t = isP ? 0.85 : 0.7; solve(L, SL, OL0, 0.9, 0.5, O); } }
    L.visible = !!two; U.two = two ? 1 : 0; }
  // first person torso: your stomach, belt and kilt joined to the legs when you look down
  let torso = null;
  function mkTorso() { torso = new THREE.Group(); const sh = shirtM || new THREE.MeshStandardMaterial({color: 0xf0e9dc, roughness: 0.9}), lea = new THREE.MeshStandardMaterial({color: 0x4a2e1b, roughness: 0.45});
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.5, 18, 2), sh); b.scale.z = 0.62; b.position.y = 1.08; torso.add(b);
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.07, 18), lea); belt.scale.z = 0.64; belt.position.y = 0.86; torso.add(belt);
    let kt = null; try { kt = new THREE.MeshStandardMaterial({map: tartanTex, roughness: 0.8, side: THREE.DoubleSide}); } catch (_) {}
    const k = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.36, 22, 1, true), kt || lea); k.scale.z = 0.66; k.position.y = 0.66; torso.add(k);
    const sp2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.04, 2, 2, 1), lea); sp2.position.set(0, 0.72, 0.18); torso.add(sp2);
    const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.32, 22), sh); lg.scale.z = 0.66; lg.position.y = 0.68; lg.visible = false; torso.add(lg); torso.userData = {k, b, sh, lg}; torso.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; } }); scene.add(torso); }
  try { const uw = updateWorldModel; updateWorldModel = function () { const r = uw.apply(this, arguments); try { const on = camMode === 0 && started && !DIM.cur && !(window.__swimHide) && SET.legs !== 0 && !(MODE.fly && flying) && P.pitch < -0.5;
        if (on && typeof worldModel !== 'undefined' && !worldModel) { try { worldModel = buildPlayerModel(false); scene.add(worldModel); dressModel(worldModel); heldId = -1; } catch (_) {} }
        window.__fpHD = 1; if (torso) torso.visible = false;   /* v1.1.57: looking down shows the new HD model body (torso, kilt or leggings, legs and armour), not the old meshes */
        const wm = typeof worldModel !== 'undefined' ? worldModel : null, u = wm && wm.userData; if (wm && u && u.hd && camMode === 0) { wm.visible = on; if (on) { const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), back = 0.3;
            wm.position.set(P.x - fx * back, P.y + (typeof landDip === 'number' ? landDip * 0.5 : 0), P.z - fz * back); wm.rotation.y = P.yaw + Math.PI; u.head.visible = false; for (const a of u.arms) a.visible = false;
            const sw2 = Math.sin(typeof bobPhase === 'number' ? bobPhase : 0) * 0.7 * (typeof bobAmp === 'number' ? bobAmp : 0); if (u.legs[0]) { u.legs[0].rotation.x = sw2; u.legs[1].rotation.x = -sw2; } } }
        else if (wm && u && u.head) { u.head.visible = true; for (const a of u.arms || []) a.visible = true; } U.torso = on ? 1 : 0; if (U.on) hideOld(true); } catch (e) { ERR('torso', e); } return r; }; } catch (e) { ERR('uw', e); }
})();
