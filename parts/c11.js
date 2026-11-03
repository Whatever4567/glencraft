
/* ===================== GLX-E2 (v0.9.11): boat input fixed on touch/controller, Iron Motorboat ===================== */
IT.PROPELLER = 174; IT.LEVER = 175; IT.MOTORBOAT = 176;
NAMES[IT.PROPELLER] = 'Propeller'; NAMES[IT.LEVER] = 'Lever'; NAMES[IT.MOTORBOAT] = 'Iron Motorboat';
ICONS[IT.PROPELLER] = drawIcon(g => { g.fillStyle = '#b8bec4'; g.strokeStyle = '#4a5056'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.save(); g.rotate(i * 2.094); g.beginPath(); g.ellipse(0, -13, 7, 14, 0.35, 0, 7); g.fill(); g.stroke(); g.restore(); } g.fillStyle = '#6a7076'; g.beginPath(); g.arc(0, 0, 5, 0, 7); g.fill(); });
ICONS[IT.LEVER] = drawIcon(g => { g.fillStyle = '#7d7d7d'; g.fillRect(-14, 10, 28, 10); g.strokeStyle = '#6b4a22'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 12); g.lineTo(10, -16); g.stroke(); g.fillStyle = '#3a2a14'; g.beginPath(); g.arc(10, -17, 4, 0, 7); g.fill(); });
ICONS[IT.MOTORBOAT] = drawIcon(g => { g.fillStyle = '#9aa2a8'; g.strokeStyle = '#3a4046'; g.lineWidth = 2; g.beginPath(); g.moveTo(-26, -4); g.lineTo(28, -4); g.lineTo(18, 12); g.lineTo(-20, 12); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#c0392b'; g.fillRect(-24, -8, 48, 4); g.fillStyle = '#2c3034'; g.fillRect(-30, -14, 9, 14); g.fillStyle = '#d9b45a'; g.fillRect(-28, 0, 4, 10); });
RECIPES.push(rc('Propeller', '4 Iron ingots + 1 Copper ingot', IT.PROPELLER, 1, [[IT.IRONINGOT, 4], [IT.COPPERINGOT, 1]], 1));
RECIPES.push(rc('Lever', '1 Stick + 1 Cobblestone', IT.LEVER, 1, [[IT.STICK, 1], [T.COBBLE, 1]], 1));
RECIPES.push(rc('Iron Motorboat', '5 Iron ingots + 2 Redstone + Propeller + Lever', IT.MOTORBOAT, 1, [[IT.IRONINGOT, 5], [IT.REDSTONE, 2], [IT.PROPELLER, 1], [IT.LEVER, 1]], 1));
if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(IT.PROPELLER, IT.LEVER, IT.MOTORBOAT);
const ironMat = new THREE.MeshLambertMaterial({color: 0x9aa2a8}), redMat = new THREE.MeshLambertMaterial({color: 0xb03a2e}), darkMat = new THREE.MeshLambertMaterial({color: 0x2c3034});
function makeMotorMesh() {
  const g = new THREE.Group(), add = (w, h, d, x, y, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
  add(1.3, 0.12, 2.6, 0, 0.06, 0, ironMat); add(0.1, 0.45, 2.6, -0.68, 0.28, 0, ironMat); add(0.1, 0.45, 2.6, 0.68, 0.28, 0, ironMat);
  add(0.12, 0.08, 2.64, -0.7, 0.52, 0, redMat); add(0.12, 0.08, 2.64, 0.7, 0.52, 0, redMat); add(1.46, 0.08, 0.12, 0, 0.52, 1.3, redMat); add(1.0, 0.45, 0.1, 0, 0.28, -1.3, ironMat); add(1.4, 0.45, 0.1, 0, 0.28, 1.3, ironMat);
  add(0.9, 0.3, 0.5, 0, 0.62, -0.95, ironMat);   // bow deck
  add(1.2, 0.06, 0.34, 0, 0.32, 0.35, darkMat);
  add(0.36, 0.5, 0.36, 0, 0.55, 1.5, darkMat);   // engine
  const prop = new THREE.Group(); prop.position.set(0, -0.05, 1.72); g.add(prop);
  for (let i = 0; i < 3; i++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.03), ironMat); bl.position.y = 0.16; const pv = new THREE.Group(); pv.rotation.z = i * 2.094; pv.add(bl); prop.add(pv); }
  g.userData.oars = [new THREE.Object3D(), new THREE.Object3D()]; g.userData.prop = prop;
  return g;
}
(function () {
  const ab = addBoat;
  addBoat = function (x, y, z, yaw, motor) {
    if (!motor) return ab.apply(this, arguments);
    const g = makeMotorMesh(); scene.add(g); const b = {g, x, y, z, yaw: yaw || 0, v: 0, t: Math.random() * 6, motor: 1}; boats.push(b); placeBoatMesh(b); return b;
  };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); d.boats = boats.map(b => [+b.x.toFixed(2), +b.y.toFixed(2), +b.z.toFixed(2), +b.yaw.toFixed(3), b.motor ? 1 : 0]); return d; };
  const ap = applySave; applySave = function (d) { const bs = d && d.boats; if (d) d.boats = (bs || []).filter(a => !a[4]); const r = ap.apply(this, arguments); (bs || []).filter(a => a[4]).forEach(a => addBoat(a[0], a[1], a[2], a[3], 1)); if (d) d.boats = bs; return r; };
  const ui = useItem;
  useItem = function () {
    if (!riding && selId === IT.MOTORBOAT && !boatLookedAt()) {
      const h = raycast(6, true, true);
      if (h && h.water) { const wt = waterTopAt(h.hit[0] + 0.5, h.hit[2] + 0.5, h.hit[1]); if (wt >= 0) { addBoat(h.hit[0] + 0.5, wt + 0.78, h.hit[2] + 0.5, P.yaw, 1); if (!MODE.infinite) { inv[IT.MOTORBOAT]--; if (inv[IT.MOTORBOAT] <= 0) delete inv[IT.MOTORBOAT]; } renderHotbar(); boatSplash(0.9); return; } }
      toast('Boats go on water'); return;
    }
    if (!riding && sneakHeld) { const lb = boatLookedAt(); if (lb && lb.motor) { scene.remove(lb.g); boats.splice(boats.indexOf(lb), 1); inv[IT.MOTORBOAT] = (inv[IT.MOTORBOAT] || 0) + 1; renderHotbar(); toast('Picked up the motorboat'); return; } }
    return ui.apply(this, arguments);
  };
})();
// engine: two detuned saws through a lowpass; pitch follows speed, throttle opens the filter
var engNodes = null;
function engineSnd(sp, thr, stop) {
  if (!AC) return;
  if (stop) { if (engNodes) { const n = engNodes; engNodes = null; try { n.g.gain.setTargetAtTime(0, AC.currentTime, 0.15); setTimeout(() => { n.o1.stop(); n.o2.stop(); }, 800); } catch (_) {} } return; }
  if (!engNodes) {
    try {
      const o1 = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
      o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.Q.value = 2; g.gain.value = 0;
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(master); o1.start(); o2.start(); engNodes = {o1, o2, f, g};
    } catch (_) { return; }
  }
  const t = AC.currentTime, base = 38 + sp * 5.5;
  engNodes.o1.frequency.setTargetAtTime(base, t, 0.1); engNodes.o2.frequency.setTargetAtTime(base * 0.502, t, 0.1);
  engNodes.f.frequency.setTargetAtTime(260 + sp * 45 + Math.abs(thr) * 500, t, 0.1);
  engNodes.g.gain.setTargetAtTime(0.06 + Math.abs(thr) * 0.06, t, 0.1);
}
