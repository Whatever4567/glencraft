/* GLX-C323 (v1.1.30): hotfix - passive animals stay about, and sheared sheep keep the new model.
   - The old despawn pass dropped any mob out of view for 10 s beyond 16 blocks, so pigs, sheep and haggis vanished as soon as you turned round
     and the tiny world-wide caps never refilled them. Farm animals within 72 blocks are now kept, and a gentle spawner tops up sheep, pigs
     and haggis on open grass 20-40 blocks away (lower numbers on phones). Health, damage and drops are unchanged.
   - Shearing no longer swaps back to the old blocky sheep: the HD sheep2 model stays, wears our short-fleece texture (sheep2s, made by
     tools/sheep_shorn.py from the sheep2 texture) and is a touch slimmer; when the wool grows back the full texture returns. */
(() => {
  const U = window.__c323 = {err: null, kept: 0, spawned: 0, far: 0, shorn: 0, unshorn: 0, tries: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const LOW = (typeof touchMode !== 'undefined' && !!touchMode) || (typeof PERF !== 'undefined' && PERF) || matchMedia('(pointer: coarse)').matches;
  const FARM = new Set(['sheep', 'pig', 'haggis']), KEEP = 72;
  U.WANT = LOW ? {sheep: 4, pig: 3, haggis: 3} : {sheep: 6, pig: 4, haggis: 5};
  const dist = a => Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z);
  const free = a => !(a.named || a.tamed || a.tame || a.owner || a.leash);
  // ---- keep farm animals through the out-of-view despawn ----
  try { const dp = despawnPass; despawnPass = function () {
      const keep = []; try { for (let i = mobs.length - 1; i >= 0; i--) { const a = mobs[i]; if (!a || !a.g || !FARM.has(a.kind)) continue;
          if (dist(a) < KEEP || !free(a)) { keep.push(a); mobs.splice(i, 1); } } } catch (e) { ERR('keep', e); }
      try { return dp.apply(this, arguments); } finally { for (const a of keep) mobs.push(a); U.kept = keep.length; } };
  } catch (e) { ERR('wrap', e); }
  // ---- top-up spawner ----
  const GOOD = () => new Set([T.GRASS, T.HEATHER, T.DIRT, T.PEAT, T.SNOW, T.MUD].filter(v => v !== undefined));
  let good = null, spT = 3;
  function spot() { good = good || GOOD();
    for (let t = 0; t < 14; t++) { U.tries++; const an = Math.random() * 6.283, r = 20 + Math.random() * 20, x = Math.floor(P.x + Math.sin(an) * r), z = Math.floor(P.z + Math.cos(an) * r);
      if (x < 4 || z < 4 || x > W - 5 || z > D - 5) continue; const top = solidTop(x, z), y = top + 1;
      if (y <= SEA || !good.has(getB(x, top, z)) || Math.abs(y - P.y) > 16) continue; const b = getB(x, y, z), b2 = getB(x, y + 1, z);
      if ((b && !(PLANT && PLANT[b])) || (b2 && !(PLANT && PLANT[b2]))) continue; return [x + 0.5, y, z + 0.5, x, z]; } return null; }
  function topUp() {
    if (!started || paused || dead || (typeof DIM !== 'undefined' && DIM.cur) || (typeof caveK !== 'undefined' && caveK > 0.45) || (window.__c321 && __c321.ax !== 2)) return;   // v1.1.31: only in the normal frame (the glen side of the round Earth)
    const n = {sheep: 0, pig: 0, haggis: 0}; for (const a of mobs) if (a && a.g && FARM.has(a.kind) && dist(a) < 60) n[a.kind]++;
    const need = Object.keys(U.WANT).filter(k => n[k] < U.WANT[k]); if (!need.length) return;
    const k = need[(Math.random() * need.length) | 0], s = spot(); if (!s) return;
    window.__eggSpot = s; let m = null; try { m = spawnMob(k); } finally { window.__eggSpot = null; }
    if (m) U.spawned++; }
  // ---- sheared sheep: same model, short fleece ----
  const C = window.__c135; let shornT = null, shornWait = [];
  function shorn(fn) { if (shornT) return fn(shornT); shornWait.push(fn); if (shornWait.length > 1) return;
    const big = window.__c313 && __c313.size === 4096;
    new THREE.TextureLoader().load('assets/tex/sheep2s_' + (big ? '4k' : '2k') + '.webp?' + (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : ''), x => {
      x.flipY = false; x.colorSpace = THREE.SRGBColorSpace; x.generateMipmaps = true; x.minFilter = THREE.LinearMipmapLinearFilter; x.magFilter = THREE.LinearFilter;
      try { x.anisotropy = Math.min(big ? 8 : 4, renderer.capabilities.getMaxAnisotropy()); } catch (_) {}
      shornT = x; const w = shornWait; shornWait = []; w.forEach(f => f(x)); }, undefined, e => ERR('tex', e)); }
  if (C && C.cat && C.cat.sheep) {
    C.cat.sheep.proc = null;   // the HD sheep stays visible when sheared
    C.post.push((a, c, M, m) => { if (a.kind === 'sheep' && c.f === 'sheep2') { a.__c323m = m; a.__c323s = undefined; } });
  }
  function mats(m) { const out = []; m.traverse(o => { if (o.isMesh) for (const mm of [].concat(o.material)) if (mm && mm.map) out.push(mm); }); return out; }
  function sheep() {
    for (const a of mobs) { if (!a || a.kind !== 'sheep' || !a.__c323m) continue; const m = a.__c323m, want = !!a.sheared;
      const L = mats(m); if (!L.length) continue;
      if (want) { if (!shornT) { shorn(() => {}); continue; }
        for (const mm of L) if (mm.map !== shornT) { if (mm.map) mm.__c323full = mm.map; shornT.wrapS = mm.map.wrapS; shornT.wrapT = mm.map.wrapT; shornT.channel = mm.map.channel || 0; mm.map = shornT; mm.needsUpdate = true; }
        if (a.__c323s !== true) { m.scale.x *= 0.88; m.scale.z *= 0.88; a.__c323s = true; U.shorn++; } }
      else { for (const mm of L) if (mm.map === shornT && mm.__c323full) { mm.map = mm.__c323full; mm.needsUpdate = true; }
        if (a.__c323s === true) { m.scale.x /= 0.88; m.scale.z /= 0.88; U.unshorn++; } a.__c323s = false; } } }
  let shT = 0;
  try { const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
      try { const t = Math.min(0.1, +dt || 0.016); if ((spT -= t) <= 0) { spT = LOW ? 5 : 4; topUp(); } if ((shT -= t) <= 0) { shT = 0.25; sheep(); } } catch (e) { ERR('tick', e); }
      return r; }; } catch (e) { ERR('um', e); }
})();
