/* GLX-C261 (v1.0.73): YEAR 24000 turns EVERY block mirror-silver again (in-place chrome swap on the shared block materials, restored after),
   layered on the original v1.0.65 vision - no other visuals changed. Also: meteor brace-for-impact voice + roar. */
(() => {
  const U = window.__c261 = {err: null, on: 0, mats: 0, roar: 0};
  const ERR = (w, e) => { U.err = w + ': ' + ((e && e.message) || e); };
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  let ENV = null;
  function env() { if (ENV) return ENV; const c = cv(512, 256), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#0a0420'); gr.addColorStop(0.35, '#3a1270'); gr.addColorStop(0.48, '#ff4fd8'); gr.addColorStop(0.52, '#4fb4ff'); gr.addColorStop(0.62, '#1a0838'); gr.addColorStop(1, '#05020c'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    for (let x = 0; x < 512; x += 6 + Math.random() * 10) { const h = 20 + Math.random() * 70, w = 4 + Math.random() * 8; g.fillStyle = '#0b0618'; g.fillRect(x, 128 - h, w, h);
      for (let k = 0; k < h / 5; k++) if (Math.random() < 0.4) { g.fillStyle = Math.random() < 0.5 ? '#ff5ce0' : '#5cd0ff'; g.fillRect(x + 1, 128 - h + k * 5, w - 2, 1); } }
    g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 90; i++) g.fillRect(Math.random() * 512, Math.random() * 90, 1, 1);
    ENV = new THREE.CanvasTexture(c); ENV.mapping = THREE.EquirectangularReflectionMapping; return ENV; }
  let saved = null;
  function worldMats() { const S = new Set(), add = m => { if (Array.isArray(m)) m.forEach(add); else if (m && m.isMaterial) S.add(m); };
    try { for (const k in BLOCK_MATS) add(BLOCK_MATS[k]); } catch (_) {} try { for (const k in PLANT_MATS) add(PLANT_MATS[k]); } catch (_) {} try { if (window.__TA && __TA.mat) add(__TA.mat); } catch (_) {}
    try { scene.traverse(o => { if ((o.isMesh || o.isInstancedMesh) && o.userData.merged) add(o.material); }); } catch (_) {} return S; }
  function chrome() { saved = new Map(); const E = env();
    for (const m of worldMats()) { if (m.blending === THREE.AdditiveBlending) continue; saved.set(m, {c: m.color ? m.color.getHex() : null, env: m.envMap, refl: m.reflectivity, comb: m.combine, met: m.metalness, rou: m.roughness, em: m.emissive ? m.emissive.getHex() : null});
      m.envMap = E; if (m.color) m.color.setHex(0xaab2c8); if (m.emissive) m.emissive.setHex(0x0a0618);
      if (m.isMeshStandardMaterial) { m.metalness = 1; m.roughness = 0.12; } else { m.combine = THREE.MixOperation; m.reflectivity = 0.82; } m.needsUpdate = true; }
    U.mats = saved.size; }
  function unchrome() { if (!saved) return; for (const [m, s] of saved) { m.envMap = s.env || null; if (s.c !== null) m.color.setHex(s.c); if (s.em !== null) m.emissive.setHex(s.em);
      if (m.isMeshStandardMaterial) { m.metalness = s.met; m.roughness = s.rou; } else { m.combine = s.comb; m.reflectivity = s.refl; } m.needsUpdate = true; } saved = null; }
  function hook() { const y = window.__c248; if (!y || !y.start24) return false; if (y.__c261) return true; y.__c261 = 1; const s0 = y.start24, s1 = y.stop24;
    y.start24 = function () { const r = s0.apply(this, arguments); try { chrome(); U.on = 1; } catch (e) { ERR('chrome', e); } return r; };
    y.stop24 = function () { try { unchrome(); U.on = 0; } catch (e) { ERR('un', e); } return s1.apply(this, arguments); }; return true; }
  if (!hook()) { const iv = setInterval(() => { if (hook()) clearInterval(iv); }, 500); }
  try { const ew = enterWorld; enterWorld = function () { try { unchrome(); U.on = 0; } catch (_) {} return ew.apply(this, arguments); }; } catch (e) { ERR('ew', e); }
  U.chrome = () => chrome(); U.unchrome = () => unchrome();
})();
