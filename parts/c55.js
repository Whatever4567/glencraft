
/* ===================== GLX-C55 (v0.9.47): Creative new-world presets - Glen, Clydebank, Flat World ===================== */
(function c55() {
  let preset = 'clydebank';
  const info = $('modeInfo');
  const box = document.createElement('div'); box.id = 'presetBox'; box.style.cssText = 'margin-top:10px;display:none';
  box.innerHTML = '<div style="font-size:13px;opacity:.8;margin-bottom:4px">World</div><div id="presetSeg" class="seg" style="display:flex;gap:6px;justify-content:center">' +
    [['glen', 'Glen'], ['clydebank', 'Clydebank'], ['flat', 'Flat World']].map(([k, n]) => '<button data-preset="' + k + '" data-testid="create-preset-' + k + '"' + (k === preset ? ' class="on"' : '') + '>' + n + '</button>').join('') + '</div>' +
    '<div id="presetInfo" style="font-size:12px;opacity:.75;margin-top:4px"></div>';
  info.after(box);
  const DESC = {glen: 'The Highland glen: mountains, lochs, castles and caves.', clydebank: 'A blocky Clydebank built from map data (\u00a9 OpenStreetMap contributors).', flat: 'Endless flat grass to build on. No mobs that hurt you.'};
  const sync = () => { box.style.display = newMode === 'creative' ? 'block' : 'none'; box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.preset === preset)); $('presetInfo').textContent = DESC[preset]; };
  box.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { preset = b.dataset.preset; sync(); }));
  document.querySelectorAll('#modeSeg button').forEach(b => b.addEventListener('click', sync)); sync();
  window.__setPreset = p => { preset = p; sync(); };
  function flatten() {
    const top = 43, BR = T.BEDROCK || 211;
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) world[idx(x, y, z)] = y === 0 ? BR : y < top - 3 ? T.STONE : y < top ? T.DIRT : y === top ? T.GRASS : T.AIR;
    try { chests.clear(); entMeta.clear(); } catch (_) {}
    g9castles = []; window.__deepCaves = []; window.__hives = [];
    mobs.slice().forEach(removeMob);
    P.x = W / 2 + .5; P.z = D / 2 + .5; P.y = top + 1; P.vy = 0; dirtyAll = true;
  }
  const cw = createWorld;
  createWorld = function () {
    if (newMode !== 'creative' || preset === 'clydebank') return cw.apply(this, arguments);
    // Glen / Flat: generate the Highland glen (as survival does), then switch to creative once it is ready
    newMode = 'survival';
    try { cw.apply(this, arguments); } finally { newMode = 'creative'; }
    current.preset = preset; current.starterDone = true; const want = preset;
    const t = setInterval(() => { if (!started) return; clearInterval(t);
      current.mode = 'creative'; current.flat = want === 'flat';
      if (want === 'flat') flatten();
      try { installCreative(); ensureHotbar(); } catch (e) { console.warn(e); }
      saveWorld(true); }, 200);
  };
  // flat worlds stay mob-free (apart from eggs you throw)
  const sm = spawnMob; spawnMob = function (kind) { if (current && current.flat && !window.__egg && !window.__eggSpot) return null; return sm.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); if (current && current.preset) { d.preset = current.preset; d.flat = !!current.flat; d.starterDone = true; } return d; };
  const pw = playWorld; playWorld = async function (w) { const r = await pw.apply(this, arguments); return r; };
  const ap = applySave; applySave = function (d) { if (d && d.preset && current) { current.preset = d.preset; current.flat = !!d.flat; current.starterDone = true; } return ap.apply(this, arguments); };
})();
