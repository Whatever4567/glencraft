/* ===================== GLX-C217 (v1.0.45): small fixes -
   gravel breaks as fast as dirt; the deep grey stone (old "Deep slate") is just "Stone" everywhere and drops Cobblestone like normal stone (the dark cobble / bricks made from
   it are "Dark stone ..."; no deepslate block); and no stutter / dark flash the first time a new ore shows up in a cave: every cave block's texture layer and the break-chip
   material are warmed up while the world loads, instead of mid-mining (a new layer used to re-upload and re-mip the whole texture array). ===================== */
(function c217() {
  const U = window.__c217 = {err: null, warm: 0, ren: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e); };
  // ---------- gravel = dirt ----------
  try { if (T.GRAVEL !== undefined) { HARD[T.GRAVEL] = HARD[T.DIRT] || 0.5; MC_HARD[T.GRAVEL] = MC_HARD[T.DIRT] || 0.5; REQ[T.GRAVEL] = REQ[T.DIRT] || 0; } } catch (e) { ERR('gravel', e); }
  // ---------- "Deep slate" is Stone ----------
  const DS = T.DEEPSLATE;
  function rename() { try { for (const k in NAMES) { const n = NAMES[k]; if (typeof n !== 'string') continue; let m = n;
        if (+k === DS) m = 'Stone'; else m = n.replace(/Deep ?slate/g, 'Dark stone').replace(/deep ?slate/g, 'dark stone');
        if (m !== n) { NAMES[k] = m; U.ren++; } }
      for (const r of (typeof RECIPES !== 'undefined' ? RECIPES : [])) { if (!r) continue; for (const f of ['name', 'hint']) if (typeof r[f] === 'string') r[f] = r[f].replace(/\b4 Deep ?slate\b(?! )/g, '4 Stone').replace(/Deep ?slate/g, 'Dark stone');
        if (Array.isArray(r.need)) for (const q of r.need) if (Array.isArray(q) && q[0] === DS) q[0] = T.STONE; }
      try { for (const k in STAIRS) if (STAIRS[k] && typeof STAIRS[k][1] === 'string') STAIRS[k][1] = STAIRS[k][1].replace(/Deep ?slate/g, 'Dark stone'); } catch (_) {}
    } catch (e) { ERR('ren', e); } }
  if (DS !== undefined) {
    rename(); setTimeout(rename, 3000); setTimeout(rename, 15000);
    try { HARD[DS] = HARD[T.STONE]; MC_HARD[DS] = MC_HARD[T.STONE]; } catch (_) {}
    try { const df = dropsFor; dropsFor = function (b) { if (b === DS) return [[T.COBBLE, 1]]; return df.apply(this, arguments); }; } catch (e) { ERR('drop', e); }
    // one "Stone" in the creative bag, not two
    try { const i = CREATIVE_ALL.indexOf(DS); if (i >= 0) CREATIVE_ALL.splice(i, 1); } catch (_) {}
  }
  // ---------- warm-up: cave blocks' texture layers + the break-chip shader, while the world loads ----------
  const CAVE = ['STONE', 'COBBLE', 'DEEPSLATE', 'DSCOBBLE', 'GRAVEL', 'DIRT', 'COALORE', 'IRONORE', 'COPPERORE', 'GOLDORE', 'REDORE', 'DIAMONDORE', 'SILVERORE', 'LAZORE', 'RUBYORE', 'COBALTORE', 'CAIRNGORMORE', 'BEDROCK', 'MOSS', 'CLAY', 'SANDSTONE', 'OBSIDIAN', 'LAVA', 'WATER'];
  function warm() { try { const A = window.__TA; if (A && A.layers) for (const k of CAVE) { const id = T[k]; if (id !== undefined) { A.layers(id); U.warm++; } }
      for (const id of [232, 233, 234, 181, 249]) if (A && A.layers) A.layers(id);
      if (A && A.flush) A.flush();
      // the break chips (GLX-C202) are double-sided lambert boxes with a map - compile that program now
      const tx = BLOCK_MATS[T.STONE] && (Array.isArray(BLOCK_MATS[T.STONE]) ? BLOCK_MATS[T.STONE][0] : BLOCK_MATS[T.STONE]).map;
      if (tx && renderer.compile) { const m = new THREE.MeshLambertMaterial({map: tx, alphaTest: 0, transparent: false, side: THREE.DoubleSide}), m2 = new THREE.MeshLambertMaterial({color: 0x777777}), g = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const o = new THREE.Mesh(g, m), o2 = new THREE.Mesh(g, m2); o.position.copy(camera.position); o2.position.copy(camera.position); scene.add(o); scene.add(o2);
        try { renderer.compile(scene, camera); } finally { scene.remove(o); scene.remove(o2); g.dispose(); } U.chip = 1; }
    } catch (e) { ERR('warm', e); } }
  try { const ew = enterWorld; enterWorld = function () { const r = ew.apply(this, arguments); setTimeout(warm, 1500); return r; }; } catch (e) { ERR('ew', e); }
})();
