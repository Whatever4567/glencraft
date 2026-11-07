/* GLX-DEAD1222 (v1.2.22): dead look, per kind of mob.
   When a mob falls as a body (or a skeleton falls into a bone pile) it switches once to a dead look made for its kind:
   - eyes: small parts on the head (and anything named eye or pupil) close or go dark. A head with a plain skin colour gets closed lids in a
     darker shade of that skin; a textured or glowing head gets dark empty eyes. Glowing parts and emissive bits go out.
   - skin and fur: people go pale and grey, zombies and creepers go grey green and dull, skeletons and bone piles go dull and yellowed,
     animals get dull, flat fur, spiders go darker, stone and metal mobs lose their shine, ghosts, wisps, slimes and puffers fade, the
     nightmare mobs, imps and dragons go dark. Textures are kept (the colour only tints them), so every skin pattern stays.
   - the head droops forward a little (once), on mobs that have a head part.
   Each dead look is a copy made once per kind and look, kept in a bounded cache (at most 256) and shared by every body of that kind; live
   mobs keep their own materials and are never changed. Corpse cleanup no longer disposes shared live materials or the cached dead looks.
   Nothing is painted per frame and no new textures are made. Mob lights go out, animation stops and any cloud zap stops (as before).
   Treemen and bees are not touched: they still crumble or vanish at once and leave no body, so there is nothing to show dead. */
(function dead1222() {
  const U = window.__dead1222 = {err: null, made: 0, used: 0, lights: 0, eyes: 0, droops: 0, evicted: 0, size: 0, kinds: {}};
  const CAP = 256, CACHE = new Map();   // key -> {m, refs}
  const PROF = [
    [/skel|bone/i, 'bone', {sat: 0.65, mul: 0.8, mix: 0x9a8f72, mk: 0.15}],
    [/zombie|creeper|ycreeper|cyborg/i, 'rot', {sat: 0.45, mul: 0.72, mix: 0x56604e, mk: 0.2}],
    [/golem|guardian|rock|stone|metal|robot|mech/i, 'stone', {sat: 0.4, mul: 0.7, mix: 0x5a5a5a, mk: 0.2, dull: 1}],
    [/ghost|wisp|slime|puffer|nmdrop/i, 'fade', {sat: 0.5, mul: 0.85, fade: 0.55}],
    [/spider/i, 'spider', {sat: 0.8, mul: 0.62}],
    [/^nm|imp|dragon|wizard|blaze/i, 'dark', {sat: 0.6, mul: 0.66, mix: 0x2a2230, mk: 0.15}],
    [/sheep|haggis|duck|pig|cow|deer|dog|hound|horse|unicorn|cat|fox|bird|hen|goat|boar|stag/i, 'fur', {sat: 0.7, mul: 0.8, dull: 1}],
    [/clansman|farmer|villager|piper|chief|agarthan|human|man|woman|player|giant|nmwizard/i, 'pale', {sat: 0.55, mul: 0.88, mix: 0x8e949a, mk: 0.25}],
  ];
  const DEF = ['dull', {sat: 0.65, mul: 0.82}];
  U.prof = kind => { for (const [re, n, p] of PROF) if (re.test(kind || '')) return [n, p]; return DEF; };
  const C = new THREE.Color(), HSL = {h: 0, s: 0, l: 0};
  const lit = m => (m.emissive && m.emissive.getHex() && (m.emissiveIntensity ?? 1) > 0) || (m.isMeshBasicMaterial && m.color && (m.color.r + m.color.g + m.color.b) > 0.9);
  const sig = (m, extra) => [m.type, m.color ? m.color.getHex() : '-', m.map ? m.map.uuid : '-', m.emissive ? m.emissive.getHex() : '-', m.opacity, m.transparent ? 1 : 0, m.side, m.vertexColors ? 1 : 0, m.skinning ? 1 : 0, extra].join('|');
  function tone(d, p) { if (d.color) { d.color.getHSL(HSL); d.color.setHSL(HSL.h, HSL.s * p.sat, HSL.l); d.color.multiplyScalar(p.mul); if (p.mix != null) d.color.lerp(C.setHex(p.mix), p.mk || 0.2); }
    if (d.emissive) { d.emissive.setHex(0); d.emissiveIntensity = 0; } if (d.emissiveMap) d.emissiveMap = null;
    if (d.isMeshBasicMaterial && d.color && lit(d)) d.color.multiplyScalar(0.25);
    { if ('shininess' in d) d.shininess = (d.shininess || 0) * 0.25; if (d.specular) d.specular.multiplyScalar(0.25); if ('roughness' in d) d.roughness = Math.max(d.roughness || 0, p.dull ? 1 : 0.85); if ('metalness' in d && p.dull) d.metalness = 0; }
    if (p.fade) { d.transparent = true; d.opacity = (d.opacity ?? 1) * p.fade; d.depthWrite = false; } }
  function get(m, pn, p, eye) { const key = pn + '|' + sig(m, eye ? 'eye' + eye : ''); let e = CACHE.get(key);
    if (e) { CACHE.delete(key); CACHE.set(key, e); e.refs++; return e.m; }   // newest at the end
    const d = m.clone(); d.userData = Object.assign({}, m.userData, {dead1222: 1, deadKind: pn});
    if (eye) { d.map = null; if (d.emissive) { d.emissive.setHex(0); d.emissiveIntensity = 0; } d.emissiveMap = null; if (d.color) d.color.setHex(eye === 'dark' ? 0x15110e : +eye); if ('shininess' in d) d.shininess = 0; if (d.specular) d.specular.setHex(0); d.transparent = false; d.opacity = 1; }
    else tone(d, p);
    d.needsUpdate = true; e = {m: d, refs: 1}; CACHE.set(key, e); U.made++;
    if (CACHE.size > CAP) for (const [k, v] of CACHE) { if (CACHE.size <= CAP) break; if (v.refs <= 0) { CACHE.delete(k); try { v.m.dispose(); } catch (_) {} U.evicted++; } }
    U.size = CACHE.size; return d; }
  U.release = root => { try { root.traverse(o => { if (!o.isMesh || !o.material) return; for (const m of [].concat(o.material)) if (m && m.userData && m.userData.dead1222) for (const v of CACHE.values()) if (v.m === m) { v.refs = Math.max(0, v.refs - 1); break; } }); } catch (_) {} };
  const under = (o, root) => { for (let q = o; q; q = q.parent) if (q === root) return true; return false; };
  function isEye(o, a) { const n = (o.name || '') + ' ' + ((o.userData && o.userData.part) || ''); if (/eye|pupil|iris/i.test(n)) return true; if (/lid|brow|lash/i.test(n)) return false;
    if (!a.head || !under(o, a.head) || !o.geometry) return false; const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); const s = o.getWorldScale ? o.getWorldScale(new THREE.Vector3()) : {x: 1};
    if (!(g.boundingSphere && g.boundingSphere.radius * Math.abs(s.x || 1) < 0.075)) return false;
    const m = [].concat(o.material)[0]; if (!m || !m.color) return false; if (lit(m) || m.isMeshBasicMaterial) return true; m.color.getHSL(HSL, THREE.SRGBColorSpace || undefined); return HSL.l < 0.12 || HSL.l > 0.6; }   // small and eye coloured: dark pupils, bright or glowing eyes, highlights
  function lidOf(a) { let best = null, r = 0; if (!a.head) return 'dark'; a.head.traverse(o => { if (!o.isMesh || !o.geometry) return; const m = [].concat(o.material)[0]; if (!m || m.map || !m.color) return; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const rr = o.geometry.boundingSphere ? o.geometry.boundingSphere.radius : 0; if (rr > r) { r = rr; best = m; } });
    if (!best) return 'dark'; return String(C.copy(best.color).multiplyScalar(0.55).getHex()); }
  U.on = a => { try { if (!a || !a.g || a.__dead) return; a.__dead = 1; const [pn, p] = U.prof(a.kind); U.kinds[pn] = (U.kinds[pn] || 0) + 1; const lid = pn === 'bone' ? 'dark' : lidOf(a);
      a.g.updateMatrixWorld(true);
      a.g.traverse(o => { if (o.isLight) { o.visible = false; U.lights++; return; } if (!o.isMesh || !o.material) return; const eye = isEye(o, a);
        const sw = m => { if (!m || !m.isMaterial || (m.userData && m.userData.dead1222)) return m; U.used++; return get(m, pn, p, eye ? (lit(m) || m.map ? 'dark' : lid) : ''); };
        if (eye) U.eyes++; o.material = Array.isArray(o.material) ? o.material.map(sw) : sw(o.material); });
      if (a.head && a.head.rotation && pn !== 'fade') { a.head.rotation.x += 0.42; U.droops++; }
      if (a.mixer && a.mixer.stopAllAction) try { a.mixer.stopAllAction(); } catch (_) {}
      if (window.__cl1222 && __cl1222.stop) __cl1222.stop(a);
    } catch (e) { if (!U.err) U.err = String(e && e.stack || e).slice(0, 200); } };
  U.isDead = m => !!(m && m.userData && m.userData.dead1222);
  U.cache = () => CACHE;
  U.clear = () => { for (const v of CACHE.values()) try { v.m.dispose(); } catch (_) {} CACHE.clear(); U.size = 0; };
})();
