/* GLX-SEA1 (v1.1.88): ONE OCEAN. All water in the world is now one sea at one level (the top of the water is at sea level everywhere).
   - The sea round the whole UK coast, the sea lochs and any river water that sits at sea level are that one sea.
   - Water hidden under the ground in the old map (sealed pockets) is turned into stone.
   - On a new world (or Reset world) any old map pond or river water sitting above sea level is filled in with earth and grass.
     On a world you already have, only the hidden pockets are filled, so water you poured yourself is never touched.
   - The deep caves have no water pools any more (only some lava pools lower down). The far sea out past the drawn chunks uses the same
     water look and level and stops at the UK ice wall. */
(function sea1() {
  const U = window.__sea1 = {err: null, pockets: 0, ponds: 0, runs: 0, busy: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  let fresh = false, lastW = null, job = null;
  try { const g = generate; generate = function () { const r = g.apply(this, arguments); fresh = true; return r; }; } catch (e) { ERR('gen', e); }
  const SOL = b => b && b !== T.WATER && !(typeof PLANT !== 'undefined' && PLANT[b]) && !(typeof LEAFY !== 'undefined' && LEAFY[b]);
  let TER = null; const ter = () => TER || (TER = new Set([T.STONE, T.DIRT, T.GRASS, T.SAND, T.GRAVEL, T.DEEPSLATE, T.CLAY, T.SANDSTONE, T.HEATHER, T.MUD, T.COBBLE, T.BEDROCK, T.HBEDROCK, T.WSTONE].filter(Boolean)));
  // below sea level: water is the sea unless real ground (stone, earth, sand) lies over it; above sea level it is an old pond
  function column(x, z, full) { const top = SEA - 1, YM = Math.min(H - 2, SEA + 40), G = ter(); let n = 0, cov = false;
    for (let y = top; y >= 0; y--) { const i = idx(x, y, z), b = world[i]; if (b === T.WATER) { if (cov) { world[i] = T.STONE; U.pockets++; n++; } } else if (G.has(b)) cov = true; }
    if (full) for (let y = YM; y > top; y--) { const i = idx(x, y, z); if (world[i] !== T.WATER) continue; const up = world[idx(x, y + 1, z)]; world[i] = up === T.WATER || SOL(up) ? T.DIRT : T.GRASS; U.ponds++; n++; }
    return n; }
  function step() { if (!job) return; const t0 = performance.now(); let n = 0;
    while (job.x < W && performance.now() - t0 < 6) { for (let z = job.z0; z < D; z++) n += column(job.x, z, job.full); job.x++; }
    job.n += n; if (job.x >= W) { const k = job.key; try { localStorage.setItem(k, '1'); } catch (_) {} U.runs++; U.last = job.n; U.busy = 0; job = null; if (n || U.last) { try { dirtyAll = true; } catch (_) {} } } }
  setInterval(() => { try { if (typeof started === 'undefined' || !started || DIM.cur || typeof current === 'undefined' || !current || !window.__c320 || !__c320.flat) return;
      if (job) { step(); return; } if (world === lastW) return; if (window.__c341 && !__c341.done) return; lastW = world;
      const key = 'glxsea1:' + current.id; let done = null; try { done = localStorage.getItem(key); } catch (_) {} if (done) { fresh = false; return; }
      job = {x: 0, z0: (window.__c307 && __c307.z0) || 0, full: fresh, key, n: 0}; fresh = false; U.busy = 1; } catch (e) { ERR('tick', e); } }, 60);
})();
