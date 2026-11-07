/* GLX-DEAD1222 (v1.2.22): dead look. When a mob falls as a body its glowing parts go dark (eyes, glow, emissive bits), its own lights go out
   and any cloud zap it owns stops. Dead looks are cached copies per original material, made once and reused, so the live mobs of the
   same kind never change. Only the mob's own model is touched. */
(function dead1222() {
  const U = window.__dead1222 = {err: null, made: 0, used: 0, lights: 0};
  const CACHE = new WeakMap();
  const lit = m => (m.emissive && m.emissive.getHex() && (m.emissiveIntensity ?? 1) > 0) || (m.isMeshBasicMaterial && m.color && (m.color.r + m.color.g + m.color.b) > 0.9);
  function variant(m) { let d = CACHE.get(m); if (d) return d; d = m.clone(); if (d.emissive) { d.emissive.setHex(0); d.emissiveIntensity = 0; } if (d.emissiveMap) d.emissiveMap = null;
    if (d.isMeshBasicMaterial && d.color) d.color.multiplyScalar(0.18); d.userData.dead1222 = 1; CACHE.set(m, d); U.made++; return d; }
  U.on = a => { try { if (!a || !a.g || a.__dead) return; a.__dead = 1;
      a.g.traverse(o => { if (o.isLight) { o.visible = false; U.lights++; return; } if (!o.isMesh || !o.material) return;
        if (Array.isArray(o.material)) { o.material = o.material.map(m => lit(m) ? (U.used++, variant(m)) : m); } else if (lit(o.material)) { o.material = variant(o.material); U.used++; } });
      if (a.mixer && a.mixer.stopAllAction) try { a.mixer.stopAllAction(); } catch (_) {}
      if (window.__cl1222 && __cl1222.stop) __cl1222.stop(a);
    } catch (e) { if (!U.err) U.err = String(e).slice(0, 200); } };
  U.isDead = m => !!(m && m.userData && m.userData.dead1222);
})();
