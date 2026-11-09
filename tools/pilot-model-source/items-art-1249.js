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
    const flameT = (function () {
      try {
        const u = g.userData && g.userData.torch;
        if (u && u.flame && u.flame.material && u.flame.material.map) return u.flame.material.map;
      } catch (_) {}
      return sparkTex();
    })();
    const extra = new T.Sprite(new T.SpriteMaterial({
      map: flameT, color: 0xff8a28, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.62
    }));
    extra.scale.set(0.42, 0.70, 1);
    extra.position.set(0, 0.56, 0);
    extra.material.userData.keepTransparent = 1;
    extra.userData.glow1249 = 1;
    g.add(extra);
    const sparks = [];
    const st = sparkTex();
    // Small orange core — not a blown-out white ball.
    const core = extra.clone(); core.scale.set(0.20, 0.32, 1); core.position.set(0, 0.50, 0.01); core.material = extra.material.clone(); core.material.color.setHex(0xff6a14); core.material.opacity = 0.55; g.add(core);
    for (let i = 0; i < 8; i++) {
      const s = new T.Sprite(new T.SpriteMaterial({
        map: st, color: 0xffa030, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7
      }));
      s.scale.set(0.028, 0.028, 1);
      s.position.set((Math.random() - 0.5) * 0.10, 0.48 + Math.random() * 0.20, (Math.random() - 0.5) * 0.10);
      s.material.userData.keepTransparent = 1;
      s.userData.spark1249 = 1;
      g.add(s);
      sparks.push({s, p: Math.random() * Math.PI * 2, sp: 0.6 + Math.random() * 0.8});
    }
    g.userData.sparks1249 = sparks;
    return g;
  }

  function tickSparks() {
    try {
      const held = (typeof W.held !== 'undefined' ? W.held : null) || (W.__fpLegacy && W.__fpLegacy.held);
      const mesh = held && held.children && held.children[0];
      const sparks = mesh && mesh.userData && mesh.userData.sparks1249;
      if (!sparks) return;
      const t = (performance.now() / 1000);
      for (const sp of sparks) {
        const y = 0.48 + ((t * sp.sp + sp.p) % 0.42);
        const a = t * 2 + sp.p;
        sp.s.position.set(Math.sin(a) * 0.07, y, Math.cos(a * 1.3) * 0.07);
        sp.s.material.opacity = 0.25 + 0.4 * Math.abs(Math.sin(t * 6 + sp.p));
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

  function wrapSight() {
    const C = W.__c322;
    if (!C || !C.swap || C.__sight1249) return !!C && !!C.__sight1249;
    const prev = C.swap;
    C.swap = function (g) {
      const r = prev.apply(this, arguments);
      try {
        const u = g && g.userData;
        if (u && u.sight) {
          const isP = (typeof IT !== 'undefined' && u.gun === IT.PISTOL) || u.gun === 212;
          if (isP) {
            // Keep the pistol sight on the barrel, slightly forward of the lock.
            if (u.sight.z > 0.02) u.sight.z = 0.02;
          } else {
            // Sit the musket sight on the barrel, forward of the lock so ADS
            // looks down the sights instead of into the stock.
            u.sight.z = Math.min(u.sight.z, -0.20);
            u.sight.y += 0.018;
          }
        }
      } catch (e) { ERR('sight', e); }
      return r;
    };
    C.__sight1249 = 1;
    return true;
  }

  let n = 0;
  const boot = setInterval(function () {
    n++;
    const a = wrapMake(), b = wrapSight();
    if ((a && b) || n > 80) clearInterval(boot);
  }, 150);
  try {
    const hook = function () { tickSparks(); };
    const t = setInterval(hook, 50);
    W.addEventListener && W.addEventListener('beforeunload', function () { clearInterval(t); });
  } catch (_) {}
})(typeof window !== 'undefined' ? window : this);
