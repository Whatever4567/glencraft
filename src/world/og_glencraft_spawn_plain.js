/* GLX-C276 (v1.0.90): the OG Glencraft spawn - plain oak trees, grass, tall grass and flowers round the spawn meadow, and haggis
   that always live there. No dinosaurs within 150 blocks of spawn (and only one in the world at a time, in GLX-C165). */
(function c276() {
  const U = window.__c276 = {err: null, oaks: 0, tufts: 0, hag: 0, culled: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const on = () => !!(window.__g89 && __g89());
  const gtop = (x, z) => { const c = x * H * D + z; for (let y = H - 2; y > 1; y--) { const b = world[c + y * D]; if (b && !PLANT[b]) return y; } return 0; };
  function grow() { const cx = W >> 1, cz = D >> 1; let s = ((gSeed | 0) ^ 0x0a4) >>> 0; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; let n = 0, t = 0;
    const LOG = T.LOG, LEAF = T.LEAVES;
    const clear = (x, z) => { for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) for (let dy = 1; dy <= 6; dy++) { const g = gtop(x + dx, z + dz); const b = world[idx(x + dx, g + dy, z + dz)]; if (b && !PLANT[b]) return false; } return true; };
    for (let k = 0; k < 900 && n < 70; k++) { const a = r() * 6.283, d = 24 + r() * 85, x = Math.round(cx + Math.cos(a) * d), z = Math.round(cz + Math.sin(a) * d), g = gtop(x, z);
      if (g <= SEA + 1 || world[idx(x, g, z)] !== T.GRASS || !clear(x, z)) continue;
      // a plain OG oak: 4-6 log trunk, a round leaf crown
      const th = 4 + Math.floor(r() * 3); world[idx(x, g, z)] = T.DIRT; for (let y = 1; y <= th; y++) world[idx(x, g + y, z)] = LOG;
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = -2; dy <= 1; dy++) { const q = Math.abs(dx) + Math.abs(dz) + Math.max(0, dy) * 2; if (q > 3 || (Math.abs(dx) === 2 && Math.abs(dz) === 2)) continue;
        const i = idx(x + dx, g + th + dy, z + dz); if (!world[i] || PLANT[world[i]]) world[i] = LEAF; }
      world[idx(x, g + th + 1, z)] = LEAF; n++; }
    const FL = [T.TALLGRASS, T.TALLGRASS, T.TALLGRASS, T.DANDELION, T.BLUEBELL, T.DAFFODIL].filter(v => v !== undefined);
    for (let x = cx - 110; x <= cx + 110; x++) for (let z = cz - 110; z <= cz + 110; z++) { if (Math.hypot(x - cx, z - cz) > 110 || r() > 0.2) continue; const g = gtop(x, z);
      if (world[idx(x, g, z)] !== T.GRASS || world[idx(x, g + 1, z)]) continue; world[idx(x, g + 1, z)] = FL[Math.floor(r() * FL.length)]; t++; }
    U.oaks = n; U.tufts = t; }
  const gen = generate; generate = function () { const r = gen.apply(this, arguments); try { if (on()) { grow(); try { dirtyAll = true; } catch (_) {} } } catch (e) { ERR('grow', e); } return r; };
  // haggis at spawn; no dinosaurs near it
  setInterval(() => { try { if (typeof started === 'undefined' || !started || DIM.cur || !current || current.mode === 'creative') return; const cx = W >> 1, cz = D >> 1;
      const D5 = window.__c165; if (D5 && D5.isD) for (const a of mobs.slice()) if (D5.isD(a) && !a.egg && Math.hypot(a.g.position.x - cx, a.g.position.z - cz) < 150) { try { removeMob(a); U.culled++; } catch (_) {} }
      if (!on() || Math.hypot(P.x - cx, P.z - cz) > 120) return;
      const near = mobs.filter(a => a.kind === 'haggis' && Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z) < 60).length; if (near >= 4) return;
      for (let k = 0; k < 12; k++) { const a = Math.random() * 6.283, d = 18 + Math.random() * 26, x = Math.floor(P.x + Math.cos(a) * d), z = Math.floor(P.z + Math.sin(a) * d);
        if (Math.hypot(x - cx, z - cz) > 120) continue; const g = gtop(x, z); if (world[idx(x, g, z)] !== T.GRASS || (world[idx(x, g + 1, z)] && !PLANT[world[idx(x, g + 1, z)]]) || world[idx(x, g + 2, z)]) continue;
        window.__eggSpot = [x + .5, g + 1, z + .5, x, z]; try { if (spawnMob('haggis')) U.hag++; } finally { window.__eggSpot = null; } break; } } catch (e) { ERR('mob', e); } }, 6000);
})();
