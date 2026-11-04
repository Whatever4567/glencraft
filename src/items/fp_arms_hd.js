/* GLX-FPA (v1.1.54): FIRST PERSON HD ARMS. The block arm and fist are replaced by two slim, shaped arms with sleeves, wrists and hands with
   fingers. Each arm reaches from the shoulder to its hand with a real elbow bend (two bone IK), so they follow every swing, recoil and aim.
   Rifles are held with both hands (the left hand on the foregrip); pistols take a two hand grip while aiming. Guns sway with the view, bob
   when walking, drop when sprinting, kick the arms on each shot, dip out and back in on a weapon switch, and the reload moves the hands:
   the pistol mag comes out and goes back in, the rifle bolt is worked. Chest armour shows on the sleeves. Looking down shows your stomach
   and kilt joined to your legs. */
(function fpa() {
  const U = window.__fpa = {err: null, on: 0, two: 0, rel: 0, reach: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z), Y = V3(0, 1, 0);
  const LU = 0.38, LF = 0.36; let offL = [];
  const hideOld = on => { if (!on) { for (const o of offL) o.visible = true; offL = []; return; } for (const c of [...armPivot.children, ...hand.children]) if (c !== armPivot && c !== held && c !== grabHaggis && c.visible) { c.visible = false; if (!offL.includes(c)) offL.push(c); } };
  let rig = null, skinM, shirtM, cuffM, curSleeve = -1;
  function fabric() { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#efe7d8'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) { const v = 200 + Math.random() * 40 | 0; g.fillStyle = `rgba(${v},${v - 8},${v - 20},.35)`; g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2, 1); }
    for (let y = 0; y < 128; y += 3) { g.fillStyle = 'rgba(120,100,80,.06)'; g.fillRect(0, y, 128, 1); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 3); return t; }
  function limb(r0, r1, len, m, seg) { const g = new THREE.CylinderGeometry(r1, r0, len, seg || 14, 3); g.translate(0, len / 2, 0); const p = g.attributes.position; // a slight swell along the limb
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / len, s = 1 + 0.12 * Math.sin(y * Math.PI); p.setX(i, p.getX(i) * s); p.setZ(i, p.getZ(i) * s * 0.92); } g.computeVertexNormals(); return new THREE.Mesh(g, m); }
  function ball(r, m) { return new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m); }
  function mkHand(side) { const h = new THREE.Group(); const palm = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.095, 0.03, 3, 3, 2), skinM); palm.position.set(0, 0.05, 0); h.add(palm);
    const pp = palm.geometry.attributes.position; for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), z = pp.getZ(i); pp.setZ(i, z * (1 - Math.abs(x) * 4)); } palm.geometry.computeVertexNormals();
    h.userData.f = [];
    for (let i = 0; i < 4; i++) { const f = new THREE.Group(); f.position.set((i - 1.5) * 0.019, 0.097, 0.004); const a = limb(0.0085, 0.0075, 0.036, skinM, 8); f.add(a); const k = new THREE.Group(); k.position.y = 0.036; f.add(k); const b = limb(0.0075, 0.0065, 0.03, skinM, 8); k.add(b); const tip = ball(0.0066, skinM); tip.position.y = 0.03; k.add(tip);
      f.rotation.x = 1.0; k.rotation.x = 1.2; h.add(f); h.userData.f.push([f, k]); }
    const th = new THREE.Group(); th.position.set(-side * 0.036, 0.03, 0.012); th.rotation.set(0.6, 0, side * 0.9); th.add(limb(0.01, 0.008, 0.05, skinM, 8)); h.add(th);
    const wr = limb(0.03, 0.028, 0.03, skinM, 12); wr.position.y = -0.02; h.add(wr); return h; }
  function mkArm(side) { const a = new THREE.Group(); a.userData.side = side;
    const up = limb(0.078, 0.066, LU, shirtM); a.add(up); const el = ball(0.066, shirtM); a.add(el); const fo = limb(0.06, 0.042, LF, skinM); a.add(fo);
    const cuff = limb(0.07, 0.066, 0.12, cuffM); a.add(cuff); const h = mkHand(side); h.scale.setScalar(1.3); a.add(h);
    a.userData.p = {up, el, fo, cuff, h}; a.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; o.renderOrder = 2; } }); return a; }
  function make() { skinM = new THREE.MeshStandardMaterial({color: 0xe3b08c, roughness: 0.55}); shirtM = new THREE.MeshStandardMaterial({map: fabric(), roughness: 0.9}); cuffM = shirtM;
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
    const cu = O && O.c; p.h.userData.f.forEach(([f, k], i) => { const g2 = cu ? cu[i] : grip; f.rotation.x = 0.2 + g2 * 1.25; k.rotation.x = 0.15 + g2 * 1.45; }); }
  // v1.1.55: per item grips - the hand is turned so the palm faces what it holds, the wrist sits back from the grip point and each finger curls on its own
  const hb = new THREE.Matrix4(), bb = new THREE.Box3(); let O = null;
  function grip(G, pn, fd, c) { const z = pn.clone().normalize(), y = fd.clone().addScaledVector(z, -fd.dot(z)).normalize(), x = V3(0, 0, 0).crossVectors(y, z); O = {x, y, z, c}; return G.clone().addScaledVector(y, -0.075).addScaledVector(z, -0.032); }
  const local = (o, out) => { o.updateMatrixWorld(true); o.getWorldPosition(out); return camera.worldToLocal(out); };
  let lastYaw = 0, lastPitch = 0, swx = 0, swy = 0, sel = -1, sw = 1, tm = 0, sp = 0;
  const gunNow = () => { try { const g = held && held.children[0]; return g && g.userData && g.userData.gun && GUN[selId] && cnt(selId) > 0 ? g : null; } catch (_) { return null; } };
  try { const uh = updateHand; updateHand = function (dt) { const r = uh.apply(this, arguments); try { step(Math.min(0.05, dt || 0.016)); } catch (e) { ERR('step', e); } return r; }; } catch (e) { ERR('uh', e); }
  function step(dt) { const on = camMode === 0 && hand.visible && started && SET.hd !== 0 && !(window.__fpaOff); U.on = on ? 1 : 0; if (!on) { if (rig) rig.visible = false; hideOld(false); return; }
    if (!rig) make(); sleeves(); rig.visible = true; hideOld(true); tm += dt;
    // sway with the view, breathing, bob, sprint drop and the weapon switch dip (added on top of whatever placed the hand)
    let dy = P.yaw - lastYaw; if (dy > Math.PI) dy -= 2 * Math.PI; if (dy < -Math.PI) dy += 2 * Math.PI; const dp = P.pitch - lastPitch; lastYaw = P.yaw; lastPitch = P.pitch;
    const k = window.__c340 ? +__c340.k || 0 : 0, sk = 1 - 0.85 * k; swx += (Math.max(-0.08, Math.min(0.08, -dy * 0.5)) - swx) * Math.min(1, dt * 10); swy += (Math.max(-0.06, Math.min(0.06, -dp * 0.5)) - swy) * Math.min(1, dt * 10);
    if (selId !== sel) { sel = selId; sw = 0; } sw = Math.min(1, sw + dt * 3.2); const dip = (1 - Math.sin(sw * Math.PI / 2)) * 0.35;
    sp += ((typeof sprinting !== 'undefined' && sprinting && P.onGround ? 1 : 0) * (1 - k) - sp) * Math.min(1, dt * 6);
    const g = gunNow(), br = Math.sin(tm * 1.6) * 0.004 * sk, bob = (typeof bobAmt === 'number' ? bobAmt : 0) * sk;
    if (g) { hand.position.x += swx * sk + Math.cos(walkPhase) * 0.012 * bob + sp * 0.05; hand.position.y += swy * sk + br - Math.abs(Math.sin(walkPhase)) * 0.012 * bob - sp * 0.08; hand.rotation.y += swx * 1.2 * sk + sp * 0.6; hand.rotation.x += -swy * sk - sp * 0.35; }
    else { hand.position.x += swx * 0.6; hand.position.y += swy * 0.6 + br; }
    hand.position.y -= dip; hand.rotation.x -= dip * 1.5;
    // reload: the gun tips, the hands work it
    let rp = -1; try { if (gunReload > 0 && GUN[gunReloadId] && gunReloadId === selId) rp = 1 - gunReload / GUN[gunReloadId].reload; } catch (_) {} U.rel = rp >= 0 ? +rp.toFixed(2) : 0;
    const rw = rp >= 0 ? Math.sin(Math.min(1, rp) * Math.PI) : 0; if (g && rw) { hand.rotation.z += 0.5 * rw; hand.rotation.x += 0.25 * rw; hand.position.y -= 0.03 * rw; }
    hand.updateMatrixWorld(true);
    const SR = V3(0.2, -0.36, 0.02), SL = V3(-0.17, -0.34, -0.04), R = rig.userData.R, L = rig.userData.L;
    const isP = g && g.userData.gun === IT.PISTOL;
    let TR; if (g) { TR = local(g, V3(0, 0, 0)); TR.y -= isP ? 0.07 : 0.03; if (isP) TR.z += 0.03; if (isP) { try { bb.setFromObject(g); const a = camera.worldToLocal(bb.min.clone()), b = camera.worldToLocal(bb.max.clone()); TR.set((a.x + b.x) / 2, Math.min(a.y, b.y) + Math.abs(b.y - a.y) * 0.3, Math.max(a.z, b.z) - Math.abs(b.z - a.z) * 0.22); TR.y -= 0.07 * k; TR.z += 0.05 * k; } catch (_) {} } } else if (held.children.length) { TR = local(held, V3(0, 0, 0)); TR.y -= held.children[0].userData.block ? 0.1 : 0.03; TR.z += 0.03; } else { TR = local(held, V3(0, 0, 0)); TR.y -= 0.02; }
    if (g && !isP && rp >= 0 && rw) { const mz = g.userData.muzzle ? local(g.userData.muzzle, V3(0, 0, 0)) : TR.clone().add(V3(0, 0, -0.6)); const ax = mz.clone().sub(TR).normalize(); TR = TR.clone().addScaledVector(ax, 0.12 * rw).add(V3(0.04 * rw, 0.03 * rw, 0)); }
    let OR = null; const fw = g && g.userData.muzzle ? local(g.userData.muzzle, V3(0, 0, 0)).sub(local(g, V3(0, 0, 0))).normalize() : V3(0, 0, -1);
    if (g) { TR = grip(TR, V3(-1, 0.1, 0).addScaledVector(fw, -0.1), V3(0, -0.55, 0).addScaledVector(fw, 0.85), [0.45, 1, 1, 1]); OR = O; }
    else if (held.children.length && held.children[0].userData.block) { TR = grip(TR.add(V3(-0.04, 0.1, -0.03)), V3(-0.25, 1, 0.1), V3(-0.3, 0.2, -1), [0.35, 0.3, 0.28, 0.3]); OR = O; }
    else if (held.children.length) { TR = grip(TR, V3(-1, 0.05, 0.1), V3(0.1, -0.15, -1), [1, 1.05, 1.1, 1.15]); OR = O; }
    solve(R, SR, TR, held.children.length ? 1 : 0.85, -0.3, OR);
    let two = false; if (g) { two = !isP || k > 0.3; if (two) { let TL;
        if (!isP) { const mz = g.userData.muzzle ? local(g.userData.muzzle, V3(0, 0, 0)) : TR.clone().add(V3(0, 0, -0.6)); TL = null; for (let f = 0.55; f >= 0.15; f -= 0.05) { const c = TR.clone().lerp(mz, f); c.y -= 0.03; if (c.distanceTo(SL) <= LU + LF - 0.01) { TL = c; break; } } if (!TL) { TL = TR.clone().lerp(mz, 0.15); TL.y -= 0.03; } }
        else { TL = TR.clone().add(V3(-0.035, -0.02, 0.015)); }
        if (rp >= 0 && rw && isP) TL.add(V3(-0.05 * rw, -0.22 * rw, 0.06 * rw));
        const OL0 = isP ? grip(TL, V3(1, 0.1, 0), V3(0, -0.5, 0).addScaledVector(fw, 0.8), [0.95, 1, 1, 1]) : grip(TL, V3(0.1, 1, 0), V3(1, 0.15, 0).addScaledVector(fw, -0.35), [0.85, 0.9, 0.95, 1]); solve(L, SL, OL0, 0.9, 0.5, O); } }
    L.visible = !!two; U.two = two ? 1 : 0; }
  // first person torso: your stomach, belt and kilt joined to the legs when you look down
  let torso = null;
  function mkTorso() { torso = new THREE.Group(); const sh = shirtM || new THREE.MeshStandardMaterial({color: 0xf0e9dc, roughness: 0.9}), lea = new THREE.MeshStandardMaterial({color: 0x4a2e1b, roughness: 0.45});
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.5, 18, 2), sh); b.scale.z = 0.62; b.position.y = 1.08; torso.add(b);
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.07, 18), lea); belt.scale.z = 0.64; belt.position.y = 0.86; torso.add(belt);
    let kt = null; try { kt = new THREE.MeshStandardMaterial({map: tartanTex, roughness: 0.8, side: THREE.DoubleSide}); } catch (_) {}
    const k = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.36, 22, 1, true), kt || lea); k.scale.z = 0.66; k.position.y = 0.66; torso.add(k);
    const sp2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.04, 2, 2, 1), lea); sp2.position.set(0, 0.72, 0.18); torso.add(sp2);
    torso.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; } }); scene.add(torso); }
  try { const uw = updateWorldModel; updateWorldModel = function () { const r = uw.apply(this, arguments); try { const on = camMode === 0 && started && !DIM.cur && !(window.__swimHide) && SET.legs !== 0 && !(MODE.fly && flying) && P.pitch < -0.5;
        if (on && !torso) mkTorso(); if (torso) { torso.visible = on; if (on) { const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), back = 0.12; torso.position.set(P.x - fx * back, P.y + (typeof landDip === 'number' ? landDip * 0.5 : 0), P.z - fz * back); torso.rotation.y = P.yaw + Math.PI; } } U.torso = on ? 1 : 0; if (U.on) hideOld(true); } catch (e) { ERR('torso', e); } return r; }; } catch (e) { ERR('uw', e); }
})();
