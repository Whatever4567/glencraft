/* ===================== GLX-C160 (v1.0.28): smoother play - block textures for the whole world are readied once at the start (no hitch on reaching a castle), frame-spike watch ===================== */
(function c160() {
  const U = window.__c160 = {warm: 0, ms: 0, types: 0, need: 0, err: null, spikes: 0, worst: 0};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e); };
  let key = null, q = [];
  // the same test the texture array uses, so the size estimate matches what it will really hold
  const okM = m => !!m && (m.isMeshPhongMaterial || m.isMeshLambertMaterial) && !m.transparent && m.visible !== false && !!m.map && !m.alphaMap && !(m.alphaTest > 0) && m.side === THREE.FrontSide && !m.vertexColors && m.opacity >= 1
    && m.map.repeat.x === 1 && m.map.repeat.y === 1 && m.map.offset.x === 0 && m.map.offset.y === 0 && !m.envMap && !m.lightMap && !m.normalMap && !m.bumpMap && !m.wireframe && !(m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.001);
  // every block type that really appears in this world gets its texture layers now, a few per frame, and the array grows once instead of
  // stalling (re-uploading every layer) the first time a castle's blackstone, obsidian or glowing windows come into view
  function warm() { const TA = window.__TA; if (!TA || !TA.on || !TA.layers || !TA.info) return; const t0 = performance.now();
    const n = world.length, seen = new Uint32Array(65536), ST = 5; for (let i = 0; i < n; i += ST) seen[world[i]]++;
    const mats = new Set(), types = []; for (let t = 1; t < 65536; t++) { if (seen[t] < 12 || !BLOCK_MATS[t] || (chunkST && chunkST[t] === 2)) continue; types.push(t); for (const m of [].concat(BLOCK_MATS[t])) if (okM(m)) mats.add(m); }
    const I = TA.info(); U.need = window.__taNeed = Math.min(256, Math.max(I.layers + 4, mats.size + 16));
    q = types;     U.types = types.length; U.warm++; U.ms = Math.round(performance.now() - t0); }
  // spike watch (for tests): frames over 100 ms
  let lt = 0;
  try { const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments);
      try { if (started) { const k = (current && current.id) + ':' + W + ':' + H + ':' + (DIM.cur || ''); if (k !== key) { key = k; warm(); } else if (q.length) { const t0 = performance.now(); while (q.length && performance.now() - t0 < 6) { try { window.__TA.layers(q.shift()); } catch (_) {} } if (!q.length) U.info = window.__TA.info(); } }
        const nw = performance.now(); if (lt && started && !paused) { const d = nw - lt; if (d > 100) { U.spikes++; if (d > U.worst) U.worst = Math.round(d); } } lt = nw; } catch (e) { ERR(e); }
      return r; }; } catch (e) { ERR(e); }
})();
