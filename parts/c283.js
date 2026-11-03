/* GLX-C283 (v1.0.93): pistol + musket in every new world with infinite bullets, gravel in caves (shovels dig it fast), lava pools deep in the caves,
   stone-matched lazurite ore, shiny real-silver ore, and an unstick so you can never end up frozen inside a block. */
(function c283() {
  const U = window.__c283 = {err: null, gravel: 0, lava: 0, unstuck: 0, tex: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  // ---------- guns: never run dry ----------
  setInterval(() => { try { if (typeof GUN === 'undefined' || !window.gunMag) return; for (const id of [IT.PISTOL, IT.MUSKET]) if (GUN[id] && GUN[id].mag) gunMag[id] = GUN[id].mag; } catch (_) {} }, 100);
  // ---------- spiders back, in caves only (the cave spawner; surface spawning stays off) ----------
  try { window.__c143 && __c143.DIS && __c143.DIS.delete('nspider'); } catch (e) { ERR('spd', e); }
  setInterval(() => { try { if (!started || paused || dead || DIM.cur || !window.__c104s || !__c104s.spawnAt || (MODE && MODE.name === 'creative') || !(typeof caveK !== 'undefined' && caveK > 0.45)) return;
      if (mobs.some(a => a.kind === 'nspider' || a.kind === 'spider') || Math.random() > 0.4) return;
      for (let t = 0; t < 30; t++) { const an = Math.random() * 6.283, rr = 9 + Math.random() * 12, x = Math.floor(P.x + Math.sin(an) * rr), z = Math.floor(P.z + Math.cos(an) * rr), y = Math.floor(P.y) + ((Math.random() * 9) | 0) - 4;
        if (x < 3 || z < 3 || x > W - 4 || z > D - 4 || y < 2 || getB(x, y, z) || getB(x, y + 1, z) || !solid(x, y - 1, z) || getB(x, y - 1, z) === T.LAVA || y > solidTop(x, z) - 4) continue;
        __c104s.spawnAt(x, y, z, true); U.spiders = (U.spiders || 0) + 1; break; } } catch (e) { ERR('spw', e); } }, 5000);
  // ---------- shovel digs gravel much faster ----------
  try { SHOVEL_ON.add(T.GRAVEL); MC_HARD[T.GRAVEL] = 0.6; } catch (e) { ERR('shov', e); }
  try { const mb = mcBreakSeconds; mcBreakSeconds = function (b) { const s = mb.apply(this, arguments); try { if (b === T.GRAVEL) { const id = heldToolId(), t = id && TOOL[id]; if (t && t[0] === 'shovel') return Math.min(s, 0.15); } } catch (_) {} return s; }; } catch (e) { ERR('mbs', e); }
  // ---------- ore textures on the real stone texture ----------
  const MY = U.MY = {};
  function oreTex() { try { const sm = BLOCK_MATS[T.STONE], m0 = Array.isArray(sm) ? sm[0] : sm, img = m0 && m0.map && m0.map.image; if (!img || !img.width) return false;
      const S = Math.min(256, img.width); let s = 283; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
      const mk = fn => { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); g.drawImage(img, 0, 0, S, S); const sc = m0.color; if (sc && sc.getHex() !== 0xffffff) { g.globalCompositeOperation = 'multiply'; g.fillStyle = '#' + sc.getHexString(); g.fillRect(0, 0, S, S); g.globalCompositeOperation = 'source-over'; } fn(g, S); const t = m0.map.clone(); t.image = c; t.needsUpdate = true; /* v1.0.94: locked - the old ore painters kept swapping it back and re-uploading every frame */ try { Object.defineProperty(t, 'image', {get: () => c, set() {}, configurable: true}); Object.defineProperty(t, 'needsUpdate', {set() {}, configurable: true}); } catch (_) {} return t; };
      const blobs = (g, S, cols, hi, sh) => { for (let k = 0; k < 6; k++) { const cx = (0.15 + r() * 0.7) * S, cy = (0.15 + r() * 0.7) * S, R = S * (0.05 + r() * 0.04);
          for (let j = 0; j < 7; j++) { const x = (cx + (r() - 0.5) * R * 1.6) | 0, y = (cy + (r() - 0.5) * R * 1.6) | 0, w = Math.max(2, R * (0.4 + r() * 0.6)) | 0; if (sh) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 1, y + 1, w, w); } g.fillStyle = cols[(r() * cols.length) | 0]; g.fillRect(x, y, w, w); g.fillStyle = hi; g.fillRect(x, y, Math.max(1, w >> 1), Math.max(1, w >> 2)); } } };
      if (T.LAZORE !== undefined) MY[T.LAZORE] = mk((g, S) => blobs(g, S, ['#1d3f9a', '#2654c4', '#3567d8', '#173282'], '#7fa2ff', 0));
      { let sv = null; for (const sid of [T.SILVERORE, T.IRONORE]) if (sid !== undefined) MY[sid] = sv = sv || mk((g, S) => blobs(g, S, ['#e4e8ee', '#cfd5dd', '#bcc3cc', '#f4f6f9'], '#ffffff', 1)); }
      U.tex = 1; return true; } catch (e) { ERR('tex', e); return true; } }
  setInterval(() => { try { if (!U.tex && !oreTex()) return; for (const id in MY) { const bm = BLOCK_MATS[id]; for (const m of [].concat(bm || [])) if (m && m.map !== MY[id]) { m.map = MY[id]; if (m.color) m.color.setHex(0xffffff); if (m.emissive) m.emissive.setHex(0); m.needsUpdate = true; } } } catch (e) { ERR('tex2', e); } }, 1000);
  // ---------- caves: gravel patches + veins, lava pools at the bottom (new worlds only, g89) ----------
  const on = () => !!(window.__g89 && __g89());
  function caves() { let s = ((gSeed | 0) ^ 0x283) >>> 0; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    const ST = T.STONE, DS = T.DEEPSLATE, GV = T.GRAVEL, LV = T.LAVA, host = b => b === ST || b === DS || b === T.DIRT;
    const at = (x, y, z) => x > 1 && z > 1 && x < W - 2 && z < D - 2 && y > 0 && y < H - 1 ? idx(x, y, z) : -1;
    const C = window.__c273, cx = W >> 1, cz = D >> 1, inside = (x, z) => !C || !C.edgeQ || C.edgeQ(x, z) < C.RE() - C.WS - 4;
    let g = 0, l = 0;
    // gravel: blobs on cave walls/floors, and veins through the rock
    for (let k = 0; k < Math.round(W * D / 280); k++) { const x = 3 + (r() * (W - 6)) | 0, z = 3 + (r() * (D - 6)) | 0, y = 4 + (r() * (SEA - 6)) | 0; if (!inside(x, z)) continue;
      const cave = k % 3 !== 2; if (cave) { let ok = false; for (let d = -3; d <= 3 && !ok; d++) { const i = at(x, y + d, z); if (i >= 0 && !world[i]) ok = true; } if (!ok) continue; }
      if (cave) { const R = 2 + r() * 2.5; for (let dx = -3; dx <= 3; dx++) for (let dy = -2; dy <= 2; dy++) for (let dz = -3; dz <= 3; dz++) { if (dx * dx + dy * dy * 2 + dz * dz > R * R) continue; const i = at(x + dx, y + dy, z + dz); if (i >= 0 && host(world[i])) { world[i] = GV; g++; } } }
      else { let X = x, Y = y, Z = z; for (let n = 0; n < 14 + r() * 16; n++) { const i = at(X, Y, Z); if (i >= 0 && host(world[i])) { world[i] = GV; g++; } const q = (r() * 6) | 0; if (q === 0) X++; else if (q === 1) X--; else if (q === 2) Z++; else if (q === 3) Z--; else if (q === 4) Y++; else Y--; } } }
    // lava: air in the deepest cave levels fills with lava where a slow noise says so (keeps clear of spawn)
    const LY = 12; for (let x = 3; x < W - 3; x++) for (let z = 3; z < D - 3; z++) { if (!inside(x, z) || Math.hypot(x - cx, z - cz) < 40) continue;
      let f = 0; try { f = g9fbm(x / 22 + 31.7, z / 22 - 9.3, 2); } catch (_) { f = Math.sin(x / 13) * Math.cos(z / 11) * 0.3; } if (f < 0.12) continue;
      for (let y = 2; y <= LY; y++) { const i = at(x, y, z); if (i >= 0 && !world[i]) { const b = world[at(x, y - 1, z)]; if (b || y === 2) { world[i] = LV; l++; } } } }
    U.gravel = g; U.lava = l; }
  try { const gen = generate; generate = function () { const res = gen.apply(this, arguments); try { if (on()) { const t0 = performance.now(); caves(); U.ms = Math.round(performance.now() - t0); try { dirtyAll = true; } catch (_) {} } } catch (e) { ERR('caves', e); } return res; }; } catch (e) { ERR('gen', e); }
  // ---------- never stuck inside a block ----------
  let safe = null;
  const inBlk = (x, y, z) => { try { return solid(Math.floor(x), Math.floor(y + 0.5), Math.floor(z)) && solid(Math.floor(x), Math.floor(y + 1.4), Math.floor(z)); } catch (_) { return false; } };
  try { const up = updatePlayer; updatePlayer = function () { const r0 = up.apply(this, arguments); try { if (!started || DIM.cur || (MODE && MODE.fly)) { safe = null; return r0; }
        if (!inBlk(P.x, P.y, P.z)) { safe = [P.x, P.y, P.z]; return r0; }
        if (safe && Math.hypot(safe[0] - P.x, safe[1] - P.y, safe[2] - P.z) < 3 && !inBlk(safe[0], safe[1], safe[2])) { P.x = safe[0]; P.y = safe[1]; P.z = safe[2]; }
        else { let done = false; for (let rr = 1; rr <= 3 && !done; rr++) for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { for (let dy = 0; dy <= rr && !done; dy++) { const x = Math.floor(P.x) + dx * rr + 0.5, z = Math.floor(P.z) + dz * rr + 0.5, y = Math.floor(P.y) + dy; if (!inBlk(x, y, z) && !solid(Math.floor(x), y, Math.floor(z)) && !solid(Math.floor(x), y + 1, Math.floor(z))) { P.x = x; P.y = y; P.z = z; done = true; } } if (done) break; }
          if (!done) P.y = Math.floor(P.y) + 1; }
        P.vx = 0; P.vz = 0; if (P.vy < 0) P.vy = 0; U.unstuck++; } catch (e) { ERR('stk', e); } return r0; }; } catch (e) { ERR('up', e); }
})();
