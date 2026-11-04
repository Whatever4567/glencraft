/* GLX-C289 (v1.0.95): first person body - look down and you see only your two legs, walking in step, set just behind the camera and hidden
   unless you look down, so they never clip into the view (v1.0.96: torso and kilt removed). Limb swing is eased
   for smoother walking in first and third person. */
(function c289() {
  const U = window.__c289 = {err: null, on: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  let body = null, sw = 0, k3 = 0;
  function make() { body = new THREE.Group(); body.userData.legs = []; const m = new THREE.MeshLambertMaterial({color: 0x3a3a46}), sh = new THREE.MeshLambertMaterial({color: 0x2a1c12});
    for (const sx of [-0.12, 0.12]) { const piv = new THREE.Group(); piv.position.set(sx, 0.82, 0); const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.72, 0.2), m); leg.position.y = -0.4; const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.28), sh); shoe.position.set(0, -0.77, 0.03);
      piv.add(leg, shoe); body.add(piv); body.userData.legs.push(piv); } body.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; } }); scene.add(body); }
  try { const uw = updateWorldModel; updateWorldModel = function (dt, moved) { const r = uw.apply(this, arguments);
      try { const on = camMode === 0 && started && !DIM.cur && !(window.__swimHide) && !(window.__c248 && __c248.y === 1); if (on && !body) make(); if (body) body.visible = !window.__fpHD && on && P.pitch < -0.5 && SET.legs !== 0 && !(MODE.fly && flying) && P.y < H + 4; U.on = on ? 1 : 0;
        const tgt = Math.sin(bobPhase) * 0.7 * bobAmp; sw += (tgt - sw) * (1 - Math.exp(-(dt || 0.016) * 18));
        if (on) { const back = 0.06, fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); body.position.set(P.x - fx * back, P.y + (typeof landDip === 'number' ? landDip * 0.5 : 0), P.z - fz * back); body.rotation.y = P.yaw + Math.PI;
          const u = body.userData; u.legs[0].rotation.x = sw; u.legs[1].rotation.x = -sw; }
        // third person: eased limbs instead of the raw swing
        if (camMode && worldModel) { const u = worldModel.userData; k3 += (tgt - k3) * (1 - Math.exp(-(dt || 0.016) * 18)); u.legs[0].rotation.x = k3; u.legs[1].rotation.x = -k3; u.arms[0].rotation.x = -k3 * 0.8; }
      } catch (e) { ERR('fp', e); } return r; }; } catch (e) { ERR('uw', e); }
})();
