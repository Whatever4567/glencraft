/* v1.2.49 item art: rope-handled bucket, bigger torch with sparks,
   musket/pistol sight-point correction for a clean ADS picture. */
(function itemsArt1249(W) {
  const U = W.__itemsArt1249 = {on: 0, err: null, version: '1.2.49'};
  const T = W.THREE;
  if (!T) return;
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  function ropeTex() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#c8a46a'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(80,50,20,0.55)'; g.lineWidth = 3;
    for (let y = 0; y < 128; y += 6) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(128, y + 4); g.stroke();
    }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(2, 6);
    return t;
  }
  function sparkTex() {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(16, 16, 1, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,240,180,1)');
    grd.addColorStop(0.4, 'rgba(255,160,40,0.8)');
    grd.addColorStop(1, 'rgba(255,40,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
    return new T.CanvasTexture(c);
  }

  function raggedFlameTex() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 256;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 128, 256);
    // Several irregular tongues so the sprite is not a smooth teardrop.
    const tongues = [
      {x: 64, w: 28, h: 230, col0: 'rgba(255,250,200,0.95)', col1: 'rgba(255,140,20,0.75)', col2: 'rgba(255,40,0,0)'},
      {x: 40, w: 16, h: 170, col0: 'rgba(255,180,40,0.8)', col1: 'rgba(255,70,0,0.55)', col2: 'rgba(180,0,0,0)'},
      {x: 88, w: 15, h: 160, col0: 'rgba(255,200,60,0.75)', col1: 'rgba(255,90,10,0.5)', col2: 'rgba(180,0,0,0)'},
      {x: 54, w: 11, h: 200, col0: 'rgba(255,160,30,0.7)', col1: 'rgba(255,50,0,0.45)', col2: 'rgba(120,0,0,0)'},
      {x: 76, w: 10, h: 190, col0: 'rgba(255,220,80,0.65)', col1: 'rgba(255,80,0,0.4)', col2: 'rgba(120,0,0,0)'}
    ];
    for (const t of tongues) {
      g.save();
      // Jagged edge via a path with wobble.
      g.beginPath();
      g.moveTo(t.x, 250);
      const steps = 14;
      for (let i = 0; i <= steps; i++) {
        const k = i / steps;
        const y = 250 - t.h * k;
        const wob = Math.sin(k * 17 + t.x) * (t.w * 0.35) * (1 - k);
        const half = t.w * (1 - k * 0.92) + wob;
        g.lineTo(t.x - half, y);
      }
      for (let i = steps; i >= 0; i--) {
        const k = i / steps;
        const y = 250 - t.h * k;
        const wob = Math.cos(k * 19 + t.x) * (t.w * 0.35) * (1 - k);
        const half = t.w * (1 - k * 0.92) + wob;
        g.lineTo(t.x + half, y);
      }
      g.closePath();
      const grd = g.createLinearGradient(t.x, 250, t.x, 250 - t.h);
      grd.addColorStop(0, t.col0);
      grd.addColorStop(0.45, t.col1);
      grd.addColorStop(1, t.col2);
      g.fillStyle = grd;
      g.fill();
      g.restore();
    }
    const tex = new T.CanvasTexture(c);
    tex.needsUpdate = 1;
    return tex;
  }

  function upgradeBucket(g, water) {
    if (!g || g.userData.art1249) return g;
    g.userData.art1249 = 1;
    g.userData.bucket = true;
    // Replace the thin iron bail with a rope handle if we can find a torus bail.
    const remove = [];
    g.traverse(o => {
      if (!o.isMesh) return;
      const typ = o.geometry && o.geometry.type;
      if (typ === 'TorusGeometry' && o.geometry.parameters && o.geometry.parameters.arc && o.geometry.parameters.arc < Math.PI * 1.2) {
        remove.push(o);
      }
    });
    for (const o of remove) { try { if (o.parent) o.parent.remove(o); } catch (_) {} }
    const ropeM = new T.MeshPhongMaterial({color: 0xd2b07a, map: ropeTex(), shininess: 8, specular: 0x221800});
    if (typeof T.TorusGeometry === 'function') {
      const bail = new T.Mesh(new T.TorusGeometry(0.105, 0.007, 6, 20, Math.PI), ropeM);
      bail.position.y = 0.155;
      g.add(bail);
    }
    // Water: slightly higher quality, keep transparency.
    let hasWater = false;
    if (water) {
      g.traverse(o => {
        if (!o.isMesh || !o.material) return;
        const m = o.material;
        if (m.transparent && m.color && m.color.b > m.color.r) {
          m.opacity = 0.72; m.shininess = 140; m.userData.keepTransparent = 1;
          m.transparent = true; m.depthWrite = false;
          hasWater = true;
        }
      });
      if (!hasWater) {
        const waterM = new T.MeshPhongMaterial({
          color: 0x3a7aC8, transparent: true, opacity: 0.72, shininess: 140,
          specular: 0xaad4ff, depthWrite: false
        });
        waterM.userData.keepTransparent = 1;
        const disc = new T.Mesh(new T.CircleGeometry(0.09, 20), waterM);
        disc.rotation.x = -Math.PI / 2;
        disc.position.y = 0.07;
        g.add(disc);
      }
    }
    return g;
  }

  function upgradeTorch(g) {
    if (!g || g.userData.art1249) return g;
    g.userData.art1249 = 1;
    // Scale the existing torch up a little and add extra flame + sparks.
    try {
      const inner = g.children && g.children[0];
      if (inner && inner.scale) inner.scale.setScalar(Math.max(inner.scale.x || 0.42, 1.00));
    } catch (_) {}
    const flameT = raggedFlameTex();
    const flames = [];
    function addFlame(color, sx, sy, x, y, z, op) {
      const spr = new T.Sprite(new T.SpriteMaterial({
        map: flameT, color: color, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: op
      }));
      spr.scale.set(sx, sy, 1);
      spr.position.set(x, y, z);
      spr.material.userData.keepTransparent = 1;
      spr.userData.glow1249 = 1;
      spr.userData.flame1249 = 1;
      g.add(spr);
      flames.push({s: spr, sx: sx, sy: sy, op: op, p: Math.random() * Math.PI * 2, sp: 6 + Math.random() * 5});
      return spr;
    }
    // Layered ragged tongues — a roaring fire, not a single teardrop bloom.
    addFlame(0xff6a14, 0.42, 0.95, 0, 0.70, 0, 0.82);
    addFlame(0xff3a00, 0.28, 0.78, -0.05, 0.68, -0.02, 0.70);
    addFlame(0xffa018, 0.24, 0.70, 0.06, 0.74, 0.02, 0.62);
    addFlame(0xff2200, 0.18, 0.88, 0.02, 0.78, -0.01, 0.50);
    addFlame(0xffc040, 0.16, 0.32, 0, 0.58, 0.03, 0.45);
    const sparks = [];
    const st = sparkTex();
    for (let i = 0; i < 26; i++) {
      const ember = (i % 3 === 0) ? 0xffc040 : ((i % 2) ? 0xff6a10 : 0xff2200);
      const s = new T.Sprite(new T.SpriteMaterial({
        map: st, color: ember, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.85
      }));
      const sz = 0.018 + (i % 6) * 0.006;
      s.scale.set(sz, sz, 1);
      s.position.set((Math.random() - 0.5) * 0.20, 0.52 + Math.random() * 0.48, (Math.random() - 0.5) * 0.20);
      s.material.userData.keepTransparent = 1;
      s.userData.spark1249 = 1;
      g.add(s);
      sparks.push({s, p: Math.random() * Math.PI * 2, sp: 0.7 + Math.random() * 1.1, sz});
    }
    g.userData.sparks1249 = sparks;
    g.userData.flames1249 = flames;
    return g;
  }

  function tickSparks() {
    try {
      const held = (typeof W.held !== 'undefined' ? W.held : null) || (W.__fpLegacy && W.__fpLegacy.held);
      const mesh = held && held.children && held.children[0];
      const ud = mesh && mesh.userData;
      const sparks = ud && ud.sparks1249;
      const flames = ud && ud.flames1249;
      const t = (performance.now() / 1000);
      if (flames) {
        for (const f of flames) {
          const k = 0.88 + 0.18 * Math.sin(t * f.sp + f.p);
          const k2 = 0.90 + 0.16 * Math.sin(t * (f.sp * 0.7) + f.p * 1.7);
          f.s.scale.set(f.sx * k, f.sy * k2, 1);
          f.s.material.opacity = f.op * (0.75 + 0.25 * Math.abs(Math.sin(t * f.sp * 1.3 + f.p)));
          f.s.position.x += Math.sin(t * 11 + f.p) * 0.0007;
        }
      }
      if (!sparks) return;
      for (const sp of sparks) {
        const y = 0.52 + ((t * sp.sp + sp.p) % 0.85);
        const a = t * 2.4 + sp.p;
        const fade = 1 - ((t * sp.sp + sp.p) % 0.85) / 0.85;
        sp.s.position.set(Math.sin(a) * 0.12, y, Math.cos(a * 1.3) * 0.12);
        sp.s.material.opacity = (0.15 + 0.7 * fade) * (0.5 + 0.5 * Math.abs(Math.sin(t * 8 + sp.p)));
        const sc = (sp.sz || 0.03) * (0.7 + 0.5 * fade);
        sp.s.scale.set(sc, sc, 1);
      }
    } catch (_) {}
  }

  function wrapMake() {
    if (typeof makeItemMesh !== 'function' || makeItemMesh.__art1249) return false;
    const prev = makeItemMesh;
    makeItemMesh = function (id) {
      const g = prev.apply(this, arguments);
      try {
        if (!g) return g;
        const isBucket = (g.userData && g.userData.bucket) || id === 39 || id === 48 || (typeof IT !== 'undefined' && (id === IT.BUCKET || id === IT.WATERB));
        const isWater = id === 48 || (typeof IT !== 'undefined' && id === IT.WATERB);
        const isTorch = (g.userData && g.userData.torch) || id === 67 || (typeof IT !== 'undefined' && id === IT.TORCH);
        if (isBucket) upgradeBucket(g, isWater);
        if (isTorch) upgradeTorch(g);
      } catch (e) { ERR('item', e); }
      return g;
    };
    makeItemMesh.__art1249 = 1;
    U.on = 1;
    return true;
  }

  function isPistolGun(u) {
    return !!(u && ((typeof IT !== 'undefined' && u.gun === IT.PISTOL) || u.gun === 212 || u.kind === 'pistol'));
  }
  function isMusketGun(u) {
    return !!(u && ((typeof IT !== 'undefined' && u.gun === IT.MUSKET) || u.gun === 213 || u.kind === 'musket'));
  }

  // Replace the modern service-pistol / bolt-action mesh with a procedural
  // flintlock (wood stock, hammer, brass). No flintlock GLB exists in the repo.
  // Fitted into the existing rig the same way C322 fits a GLB, so hip/ADS
  // poses and the muzzle stay in the viewmodel frame.
  function boxIn(o, rel) {
    const b = new T.Box3();
    o.updateMatrixWorld(true);
    const inv = new T.Matrix4().copy(rel.matrixWorld).invert();
    o.traverse(function (m) {
      if (m.isMesh && m.visible && m.geometry) {
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        b.union(m.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inv, m.matrixWorld)));
      }
    });
    return b;
  }
  function dressFlintlock(g) {
    const u = g && g.userData;
    if (!u || !u.rig || u.__flint1255) return false;
    // Pistol must be a flintlock (goal t1141). The musket keeps the C322
    // rig frame so ADS/hip poses stay out of the stock; forestock hands are posed separately.
    if (!isPistolGun(u)) return false;
    const P = W.__prism1241;
    if (!P || typeof P.buildGun !== 'function') return false;
    const isP = isPistolGun(u);
    const kind = isP ? 'pistol' : 'musket';
    const flint = P.buildGun(kind);
    if (!flint) return false;
    const rig = u.rig;
    rig.updateMatrixWorld(true);
    const ob = boxIn(rig, rig);
    if (ob.isEmpty()) return false;
    // Clear the modern/blocky parts but keep the rig's world pose.
    while (rig.children.length) rig.remove(rig.children[0]);
    const hold = new T.Group();
    hold.name = 'flintlock1255';
    hold.add(flint);
    rig.add(hold);
    hold.updateMatrixWorld(true);
    const nb = boxIn(hold, hold);
    const L0 = ob.max.z - ob.min.z, L1 = nb.max.z - nb.min.z, k = (L1 > 1e-6) ? L0 / L1 : 1;
    hold.scale.setScalar(k);
    flint.position.set(0, 0, 0);
    const nb2 = boxIn(hold, hold);
    flint.position.set(
      -(nb2.min.x + nb2.max.x) / 2 / k,
      ((ob.min.y + ob.max.y) / 2 - (nb2.min.y + nb2.max.y) / 2) / k,
      (ob.max.z - nb2.max.z) / k
    );
    hold.updateMatrixWorld(true);
    const fb = boxIn(hold, rig);
    const mz = new T.Object3D();
    mz.name = 'muzzle';
    mz.position.set((fb.min.x + fb.max.x) / 2, fb.max.y - (fb.max.y - fb.min.y) * (isP ? 0.22 : 0.30), fb.min.z - 0.01);
    rig.add(mz);
    u.muzzle = mz;
    // Sight: highest point over the front half of the barrel, so ADS looks
    // down the sights and not into the stock.
    rig.updateMatrixWorld(true);
    let fy = -1e9, fz = fb.min.z + (fb.max.z - fb.min.z) * (isP ? 0.35 : 0.20);
    const P0 = new T.Vector3(), inv = new T.Matrix4().copy(rig.matrixWorld).invert();
    const zc = fb.min.z + (fb.max.z - fb.min.z) * (isP ? 0.30 : 0.12);
    hold.traverse(function (o) {
      if (!o.isMesh || !o.visible || !o.geometry || !o.geometry.attributes.position) return;
      const p = o.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        P0.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).applyMatrix4(inv);
        if (P0.z < zc && P0.y > fy && P0.y <= fb.max.y + 1e-3) { fy = P0.y; fz = P0.z; }
      }
    });
    if (fy < -1e8) fy = fb.max.y;
    // Sight is mid-barrel, slightly above the bore — never the muzzle
    // (that would put the whole gun behind the camera) and never the
    // stock (that would put the camera inside it).
    u.sight = new T.Vector3(mz.position.x, fy + 0.002, -0.12);
    u.__sight1253 = 1;
    u.slide = new T.Group(); rig.add(u.slide);
    u.mag = new T.Group(); rig.add(u.mag);
    try {
      const S = W.__gs1222;
      if (S && S.addAnch) {
        const key = isP ? 'pistol' : 'rifle';
        const saved = S.ANCH && S.ANCH[key];
        if (S.ANCH) {
          S.ANCH[key] = isP
            ? [['grip', 'rig', 0, -0.07, 0.05], ['sup', 'rig', -0.028, -0.065, 0.045], ['well', 'rig', 0, -0.08, 0.06]]
            : [['grip', 'rig', 0, -0.03, 0.16], ['fore', 'rig', 0, -0.02, -0.22], ['bolt', 'rig', 0.04, 0.02, 0.10]];
        }
        u.anch = {};
        S.addAnch(g, key);
        if (S.ANCH && saved) S.ANCH[key] = saved;
      }
    } catch (e) { ERR('anch', e); }
    u.__flint1255 = 1;
    u.c322 = 1;
    u.prismBuilt = 1;
    return true;
  }

  function wrapSight() {
    const C = W.__c322;
    if (!C || !C.swap || C.__sight1249) return !!C && !!C.__sight1249;
    const prev = C.swap;
    C.swap = function (g) {
      try {
        if (dressFlintlock(g)) return;
      } catch (e) { ERR('flint', e); }
      const r = prev.apply(this, arguments);
      try {
        const u = g && g.userData;
        if (u && u.sight && !u.__flint1255) {
          const isP = isPistolGun(u);
          if (isP) {
            if (u.sight.z > 0.02) u.sight.z = 0.02;
          } else if (!u.__sight1253) {
            u.sight.z = Math.min(u.sight.z, -0.32);
            u.sight.y += 0.012;
            u.__sight1253 = 1;
          }
        }
      } catch (e) { ERR('sight', e); }
      return r;
    };
    C.__sight1249 = 1;
    return true;
  }

  function scanFlintlock() {
    try {
      const h = (typeof held !== 'undefined') ? held : (W.__fpLegacy && W.__fpLegacy.held);
      if (!h || !h.traverse) return;
      h.traverse(function (o) {
        const u = o.userData;
        if (!u || !u.gun || !u.rig || u.__flint1255) return;
        try { dressFlintlock(o); } catch (e) { ERR('flintScan', e); }
      });
    } catch (_) {}
  }

  let n = 0;
  const boot = setInterval(function () {
    n++;
    const a = wrapMake(), b = wrapSight();
    scanFlintlock();
    if ((a && b) || n > 80) clearInterval(boot);
  }, 150);
  try {
    const hook = function () { tickSparks(); scanFlintlock(); };
    const t = setInterval(hook, 50);
    W.addEventListener && W.addEventListener('beforeunload', function () { clearInterval(t); });
  } catch (_) {}
})(typeof window !== 'undefined' ? window : this);
