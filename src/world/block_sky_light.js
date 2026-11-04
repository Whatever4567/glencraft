/* ===================== GLX-C108 (v0.9.89): Minecraft-style block + sky light ===================== */
(function c108() {
  const U = window.__c108 = {wide: 0};
  // the baked voxel light replaces the old fake torch point lights (fewer real lights = faster); the held torch keeps its own light
  try { for (const l of torchLights) { l.intensity = 0; scene.remove(l); } torchLights.length = 0; } catch (e) { console.warn('c108 lights', e); }
  // never pitch black: a minimum brightness everywhere (a bit higher in Hell)
  const LM = window.__lminU || (window.__lminU = {value: 0.3});
  setInterval(() => { try { LM.value = DIM.cur === 'hell' ? 0.5 : 0.28; } catch (_) {} }, 500);
  // torches and other lights shine 14-15 blocks now, so placing / breaking one re-lights the chunks around it too
  const SRC = new Set([T.TORCH, T.LAVA, T.LAVAB, T.GLOWROCK, T.LAMP, T.QLANTERN, T.FIRE].filter(v => v !== undefined));
  const sb = setB;
  setB = function (x, y, z, v) {
    let old = 0; try { if (x >= 0 && z >= 0 && x < W && z < D && y >= 0 && y < H) old = world[(x * H + y) * D + z]; } catch (_) {}
    const r = sb.apply(this, arguments);
    try { if (started && old !== v && (SRC.has(old) || SRC.has(v))) { U.wide++; const cx = Math.floor(x / CH), cz = Math.floor(z / CH), lx = x - cx * CH, lz = z - cz * CH;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { if ((a < 0 && lx > 13) || (a > 0 && lx < 2) || (b < 0 && lz > 13) || (b > 0 && lz < 2)) continue; const X = cx + a, Z = cz + b; if (X >= 0 && Z >= 0 && X * CH < W && Z * CH < D) dirtyCh.add(X * 64 + Z); } } } catch (_) {}
    return r;
  };
})();
