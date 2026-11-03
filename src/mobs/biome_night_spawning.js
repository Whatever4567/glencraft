
/* ===================== GLX-C126 (v1.0.8): biome-native night spawning - the classic four live underground, the Treeman only in alder woods ===================== */
(function c126() {
  const U = window.__c126 = {blocked: {}, allowed: {}, tree: {}, census: {}};
  const CLASSIC = new Set(['zombie', 'skeleton', 'creeper', 'spider', 'nspider', 'puffer']);   // 'puffer' is turned into a creeper further down
  const under = (x, y, z) => solidTop(Math.floor(x), Math.floor(z)) > Math.floor(y) + 2;   // a real roof of rock/earth over the spot (leaves don't count)
  const alder = (x, z) => { try { return window.__bio && __bio.at ? __bio.at(Math.floor(x), Math.floor(z)) === 'alder' : false; } catch (_) { return false; } };
  U.under = under; U.alder = alder;
  const tick = (o, k) => { o[k] = (o[k] || 0) + 1; };
  const exempt = () => !!(window.__egg || DIM.cur || (current && current.flat));   // spawn eggs, castle garrisons, saved yellow creepers, Hell, flat worlds
  const okSpot = (kind, x, y, z) => kind === 'treeman' ? alder(x, z) : under(x, y, z);
  const sm0 = spawnMob;
  spawnMob = function (kind) {
    if ((!CLASSIC.has(kind) && kind !== 'treeman') || exempt()) return sm0.apply(this, arguments);
    const sp = window.__eggSpot || window.__caveSpawn;
    if (sp && !okSpot(kind, sp[0], sp[1], sp[2])) { tick(U.blocked, kind); return null; }
    if (kind === 'puffer' && !sp && !(caveK > 0.45)) { tick(U.blocked, kind); return null; }   // the old surface creeper respawn - don't even build it
    const n0 = mobs.length;
    for (let t = 0; t < (kind === 'treeman' && !sp ? 8 : 1); t++) {
      let a = sm0.apply(this, arguments); if (!a && mobs.length > n0) a = mobs[mobs.length - 1];
      if (!a) return null;
      const p = sp ? {x: sp[0], y: sp[1], z: sp[2]} : a.g.position;
      if (sp && kind !== 'treeman' && okSpot(kind, p.x, p.y, p.z) && !under(a.g.position.x, a.g.position.y, a.g.position.z)) a.g.position.set(sp[0], sp[1], sp[2]);   // some models snap to the top - keep them in the cave
      if (okSpot(kind, p.x, p.y, p.z)) { tick(U.allowed, kind); if (kind === 'treeman') tick(U.tree, alder(p.x, p.z) ? 'alder' : 'other'); return a; }
      try { removeMob(a); } catch (_) {} }
    tick(U.blocked, kind); return null; };
  // anything classic that still ends up on the surface (old saves, other spawners) is quietly cleared at night; Treemen outside alder too
  let sweepT = 2;
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
    try { if ((sweepT -= dt) <= 0) { sweepT = 2; if (started && !DIM.cur && !(current && current.flat)) for (const a of mobs.slice()) { if (!a || a.egg || a.home) continue;
        const p = a.g.position, d = Math.hypot(p.x - P.x, p.z - P.z);
        if (a.kind === 'treeman' && !alder(p.x, p.z) && d > 24 && a !== heldBy) { removeMob(a); tick(U.blocked, 'treeman-swept'); }
        else if (CLASSIC.has(a.kind) && !under(p.x, p.y, p.z) && d > 24 && !(a.cf > 0) && !a.lit && !a.arm) { removeMob(a); tick(U.blocked, a.kind + '-swept'); } } } } catch (e) { U.err = String(e); }
    return r; };
})();
