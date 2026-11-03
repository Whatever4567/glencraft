s=open('s1.js').read()
def R(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:70]); s=s.replace(a,b)
# 5 glass: cutout-style transparency, writes depth, front faces only -> no sorting / z-fight shimmer
R("key === 'glass' ? new THREE.MeshLambertMaterial({map: tex(key), transparent: true, depthWrite: false, side: THREE.DoubleSide})",
  "key === 'glass' ? new THREE.MeshLambertMaterial({map: tex(key), transparent: true, opacity: 1, depthWrite: true, alphaTest: 0.02, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1})")
# furnace pop
R("""  $('fArrow').firstChild.style.width = Math.min(100, f.cook / 6 * 100) + '%';
}""","""  $('fArrow').firstChild.style.width = Math.min(100, f.cook / 6 * 100) + '%';
  $('fArrow').classList.toggle('cooking', f.burn > 0 && !!f.inp);
  // GLX-B4: finished item pops into the output slot
  const on = f.out ? f.out[1] : 0;
  if (updateFurnaceBars.last !== undefined && updateFurnaceBars.key === openFurnaceKey && on > updateFurnaceBars.last) {
    const o = $('fOut'); o.classList.remove('pop'); void o.offsetWidth; o.classList.add('pop'); sfx('pop', .5);
  }
  updateFurnaceBars.last = on; updateFurnaceBars.key = openFurnaceKey;
}""")
# 4 tree felling: drop everything as items when it lands
R("""      if (getB(cx, cy, cz) === T.AIR || isPlant(getB(cx, cy, cz))) { setB(cx, cy, cz, T.LOG); placed.push(1); }
      else dropItem(T.LOG, 1, vv.x, vv.y + 0.5, vv.z, 0, 2, 0, 0.4);""",
"""      // GLX-B4: the felled trunk breaks apart into log items where it landed, with a puff of dust
      dropItem(T.LOG, 1, vv.x, Math.max(vv.y, cy) + 0.6, vv.z, (Math.random() - .5) * 1.5, 2.5 + Math.random() * 1.5, (Math.random() - .5) * 1.5, 0.4);
      burst(vv.x, cy + 0.4, vv.z, 0xa08a68, 5, 0.9); placed.push(1);""")
R("""    dropItem(IT.STICK, 1 + Math.floor(Math.random() * 2), f.x""","""    sfx('thud'); shake(0.25, 0.02);
    dropItem(IT.STICK, 2 + Math.floor(Math.random() * 3), f.x""")
# 1 haggis grab: shake + stumble, any held item can be knocked out
R("""  grabT = 1.1; stumbleT = 0.6; a.grabbing = 1.1;
  // sometimes it knocks the tool clean out of your hand
  if (Math.random() < 0.3 && cnt(selId) > 0 && !MODE.infinite && TOOL && TOOL[selId]) {""",
"""  grabT = 1.1; stumbleT = 0.6; a.grabbing = 1.1; shake(0.45, 0.05);
  // sometimes you stumble and it knocks the tool / weapon clean out of your hand (dropped as an item you can pick back up)
  if (Math.random() < 0.35 && cnt(selId) > 0 && !MODE.infinite && TOOL && TOOL[selId]) {""")
# 3 skeleton: aim + release recoil
R("""  arrows.push({m, v, life: 2.5});""","""  arrows.push({m, v, life: 2.5}); a.relT = 0.3;""")
R("""        a.arms[0].rotation.set(-1.45 * up - sw * .2 * (1 - up), 0.32 * up, 0);
        a.arms[1].rotation.set(-1.45 * up + 0.25 * draw + sw * .2 * (1 - up), -0.5 * up + 0.3 * draw, 0);
        a.bow.visible = true; a.bow.position.y = 1.36 - (1 - up) * 0.35;
        a.str.position.z = -draw * 0.2; a.nock.visible = draw > 0.05; a.nock.position.z = 0.15 - draw * 0.2;""",
"""        // GLX-B4: left arm holds the bow out, right hand pulls the string to the cheek, aims up/down at you, snaps on release
        if (a.relT > 0) a.relT -= dt;
        const rel = a.relT > 0 ? a.relT / 0.3 : 0, aim = up > 0.5 ? clamp(Math.atan2(dy + 0.3, Math.max(1, dist)), -0.6, 0.6) : 0;
        a.aimV = (a.aimV || 0) + (aim - (a.aimV || 0)) * Math.min(1, dt * 6);
        a.arms[0].rotation.set(-1.5 * up - a.aimV - sw * .2 * (1 - up), 0.3 * up, 0);
        a.arms[1].rotation.set(-1.5 * up - a.aimV + 0.35 * draw + sw * .2 * (1 - up), -0.55 * up + 0.45 * draw - rel * 0.3, 0);
        a.bow.visible = true; a.bow.position.set(-0.06, 1.36 - (1 - up) * 0.35 + a.aimV * 0.5, 0.62 + rel * 0.06);
        a.bow.rotation.set(-a.aimV, 0, 0.18 * up + Math.sin(rel * 30) * 0.08 * rel);
        a.str.position.z = -draw * 0.22 + Math.sin(rel * 40) * 0.02 * rel; a.nock.visible = draw > 0.05 && rel === 0; a.nock.position.z = 0.15 - draw * 0.22;
        if (a.head) a.head.rotation.x = -a.aimV * 0.6;""")
# 1/2 animations for haggis and sheep extras
R("""    if (a.kind === 'haggis') { a.head.rotation.x = a.moving ? Math.sin(a.walk * 2) * 0.12 : 0;""",
"""    if (a.kind === 'haggis' && a.body) {
      const tn = performance.now() / 1000;
      a.body.position.y = 0.5 + (a.moving ? Math.abs(Math.sin(a.walk * 2)) * 0.06 : Math.sin(tn * 2 + a.walk) * 0.01);
      a.body.rotation.z = a.moving ? Math.sin(a.walk) * 0.08 : 0;
      if (a.ears) a.ears.forEach((e, k) => { e.rotation.x = Math.sin(tn * 3 + k) * 0.15 + (a.moving ? -0.4 : 0); });
      if (a.fringe) a.fringe.rotation.y = Math.sin(tn * 1.5 + a.walk) * 0.05;
      if (a.leapT) { a.g.rotation.x = -0.5 * Math.sin(a.leapT / 0.7 * Math.PI); } else a.g.rotation.x = 0;
    }
    if (a.kind === 'sheep' && a.tail) {
      const tn = performance.now() / 1000;
      a.tail.rotation.x = 0.4 + Math.sin(tn * (a.moving ? 14 : 4) + a.walk) * (a.moving ? 0.5 : 0.15);
      if (a.ears) a.ears.forEach((e, k) => { e.rotation.x = (Math.sin(tn * 1.3 + k * 2) > 0.95 ? 0.6 : 0); });
      // funny wee pronk: idle sheep sometimes spring straight up
      a.pronkT = (a.pronkT === undefined ? 4 + Math.random() * 10 : a.pronkT) - dt;
      if (a.pronkT <= 0) { a.pronkT = 8 + Math.random() * 14; if (!a.moving && a.onGround && dist < 20) { a.vy = 5; a.onGround = false; if (Math.random() < .6) sfx3d('baa', pos, 13); } }
      if (!a.onGround) a.fleece.rotation.x = Math.sin(tn * 20) * 0.05; else a.fleece.rotation.x = 0;
    }
    if (a.kind === 'haggis') { a.head.rotation.x = a.moving ? Math.sin(a.walk * 2) * 0.12 : 0;""")
# sheep: tail + ear refs
R("""    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.08), dk); ear.position.set(sx * 0.24, -0.04, 0.2); ear.rotation.z = sx * 0.4; head.add(ear);
  }""","""    const ep = new THREE.Group(); ep.position.set(sx * 0.2, -0.04, 0.2); ep.rotation.z = sx * 0.4; head.add(ep); ears.push(ep);
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.08), dk); ear.position.x = sx * 0.06; ep.add(ear);
  }
  // shaggy forelock of wool falling over the eyes, and a wee tail
  for (const sx of [-0.1, 0.05, 0.14]) { const lk = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 5), wool); lk.position.set(sx, 0.17, 0.3); lk.rotation.x = 2.6; head.add(lk); }
  const tail = new THREE.Group(); tail.position.set(0, 0.95, -0.62); g.add(tail);
  const tm0 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.14), wool); tm0.position.y = -0.14; tail.add(tm0);""")
R("""  const head = new THREE.Group(); head.position.set(0, 0.98, 0.62); g.add(head);""","""  const head = new THREE.Group(); head.position.set(0, 0.98, 0.62); g.add(head); const ears = [];""")
R("""  return {g, legs, arms: [], mats, head, fleece, speed: 1.1,""","""  return {g, legs, arms: [], mats, head, fleece, tail, ears, speed: 1.1,""")
# 1 haggis model override + 6 menu camera, appended (later definitions win)
s += r"""
/* ===================== WORLD B4: haggis revamp, menu camera ===================== */
let haggisTartan = null;
function makeHaggis() {
  const g = new THREE.Group();
  const fur = new THREE.MeshLambertMaterial({map: tex('haggis_fur')});
  const furDk = new THREE.MeshLambertMaterial({map: tex('haggis_fur'), color: 0x8a6650});
  const belly = new THREE.MeshLambertMaterial({map: tex('haggis_fur'), color: 0xd9b48a});
  const dark = new THREE.MeshLambertMaterial({color: 0x1a1210});
  const eye = new THREE.MeshLambertMaterial({color: 0x120c08, emissive: 0x000000});
  const shine = new THREE.MeshBasicMaterial({color: 0xffffff});
  if (!haggisTartan) { try { playerTextures(); haggisTartan = tartanTex; } catch (_) {} }
  const tart = new THREE.MeshLambertMaterial(haggisTartan ? {map: haggisTartan} : {color: 0x2b4f8a});
  const pom = new THREE.MeshLambertMaterial({color: 0xc0262d});
  const body = new THREE.Group(); body.position.y = 0.5; g.add(body);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), fur); core.scale.set(1, 0.82, 1.18); body.add(core);
  const under = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 8), belly); under.scale.set(1, 0.6, 1.05); under.position.y = -0.14; body.add(under);
  // shaggy coat: layered tufts all over the back and hanging skirt
  const fringe = new THREE.Group(); body.add(fringe);
  for (let ring = 0; ring < 3; ring++) {
    const n = 10 + ring * 4, r = 0.4 - ring * 0.1, yy = -0.16 + ring * 0.2;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + ring * 0.3, c = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.22 - ring * 0.03, 5), (i + ring) % 3 ? fur : furDk);
      c.position.set(Math.sin(a) * r, yy, Math.cos(a) * r * 1.15);
      c.rotation.set(Math.PI + Math.cos(a) * (0.5 + ring * 0.4), 0, -Math.sin(a) * (0.5 + ring * 0.4)); fringe.add(c);
    }
  }
  // a tartan sash across its back
  const sash = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 6, 20, Math.PI), tart); sash.rotation.set(0, Math.PI / 2, 0); sash.scale.set(1, 0.85, 1.15); sash.position.y = 0.02; body.add(sash);
  const head = new THREE.Group(); head.position.set(0, 0.62, 0.42); g.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), fur); skull.scale.set(1, 0.9, 1); head.add(skull);
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.2, 10), belly); snout.rotation.x = Math.PI / 2; snout.position.set(0, -0.05, 0.22); head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), dark); nose.position.set(0, -0.04, 0.33); head.add(nose);
  const ears = [];
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), eye); e.position.set(sx * 0.1, 0.05, 0.18); head.add(e);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), shine); h.position.set(sx * 0.1 + 0.012, 0.065, 0.222); head.add(h);
    const brow = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 4), furDk); brow.position.set(sx * 0.1, 0.12, 0.15); brow.rotation.z = -sx * 1.2; head.add(brow);
    const ep = new THREE.Group(); ep.position.set(sx * 0.15, 0.16, -0.02); ep.rotation.z = -sx * 0.6; head.add(ep); ears.push(ep);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 5), fur); ear.position.y = 0.05; ep.add(ear);
    // wee curly horns
    const hn = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 5, 10, 4.5), dark); hn.position.set(sx * 0.16, 0.1, 0.06); hn.rotation.y = Math.PI / 2; head.add(hn);
  }
  // a tiny tam o' shanter
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.06, 14), tart); cap.position.set(0.03, 0.2, 0); cap.rotation.z = -0.3; head.add(cap);
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), pom); p.position.set(0.06, 0.25, 0); head.add(p);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), fur); tail.position.set(0, 0.55, -0.5); tail.rotation.x = -2; g.add(tail);
  // the legend: the legs on one side are shorter, for running round the hills
  const legs = [];
  for (const [lx, lz, h] of [[-0.2, -0.16, .3], [0.2, -0.16, .22], [-0.2, 0.2, .3], [0.2, 0.2, .22]]) {
    const l = limb(g, 0.1, h, 0.1, furDk, lx, h, lz);
    const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.15), dark); hoof.position.y = -h + 0.02; l.add(hoof);
    legs.push(l);
  }
  return {g, legs, arms: [], mats: [fur, furDk, belly, dark, eye, shine, tart, pom], eye, head, tail, body, ears, fringe, speed: 1.6, hp: 3, hitY: .45, hitR: .65};
}
// shaggier first-person haggis clamped on your arm
(function betterGrabHaggis() {
  try {
    const fur = new THREE.MeshLambertMaterial({map: tex('haggis_fur')}), tm = new THREE.MeshLambertMaterial({color: 0x2b4f8a});
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, c = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 5), fur); c.position.set(Math.sin(a) * 0.12, -0.03, Math.cos(a) * 0.14); c.rotation.set(Math.PI + Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6); grabHaggis.add(c); }
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 5, 14), tm); band.rotation.x = Math.PI / 2; grabHaggis.add(band);
  } catch (_) {}
})();
// menu backdrop camera: orbit the middle of the map and always stay above the terrain with a clear view
let menuCamY = null;
function menuCamera(now) {
  const t = now / 1000 * 0.035, cx = W / 2, cz = D / 2, r = Math.max(10, W * 0.42);
  const x = clamp(cx + Math.cos(t) * r, 1, W - 2), z = clamp(cz + Math.sin(t) * r, 1, D - 2);
  const ty = groundTop(Math.floor(cx), Math.floor(cz)) + 3;
  let need = groundTop(Math.floor(x), Math.floor(z)) + 6;
  for (let k = 1; k < 12; k++) { const f = k / 12, sx = x + (cx - x) * f, sz = z + (cz - z) * f; const gy = groundTop(Math.floor(sx), Math.floor(sz)) + 2.5; const yAt = gy; need = Math.max(need, (yAt - ty * f) / Math.max(0.08, 1 - f)); }
  need = Math.max(need, BASE + 12);
  menuCamY = menuCamY === null ? need : menuCamY + (need - menuCamY) * 0.03;
  camera.position.set(x, menuCamY + Math.sin(t * 0.7) * 1.5, z);
  camera.lookAt(cx, ty, cz);
}
"""
open('s1.js','w').write(s)
