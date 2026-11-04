/* GLX-C315 (v1.1.25): MOON AND MARS BLOCKS. Block slots 191-199 are used for real planet blocks with painted
   HD textures and icons: Moon regolith, Moon rock, Lunar basalt, Lunar crystal ore, Moon bricks, Mars stone, Iron oxide ore, Mars crystal ore
   and Mars bricks. Crafting: 4 Moon rock or 4 Mars stone make 4 bricks; Lunar basalt smelts into Moon rock. Old saves that still hold the old
   blocks in those slots get them turned into air once, so nothing odd turns up. */
(function c315() {
  const U = window.__c315 = {err: null, remapped: 0, made: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const S = (typeof PH !== 'undefined' && PH) || /Android|iPhone|iPad/i.test(navigator.userAgent) ? 256 : 512;
  const rng = s => () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const hex = (c, k) => { const n = parseInt(c.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return 'rgb(' + f(n >> 16) + ',' + f(n >> 8 & 255) + ',' + f(n & 255) + ')'; };
  function grain(g, base, amt, r, n) { g.fillStyle = base; g.fillRect(0, 0, S, S); for (let i = 0; i < n; i++) { const x = r() * S, y = r() * S, w = 1 + r() * S / 48; g.fillStyle = hex(base, 1 + (r() - 0.5) * amt); g.fillRect(x, y, w, w); } }
  function craters(g, base, r, k) { for (let i = 0; i < k; i++) { const x = r() * S, y = r() * S, R = S * (0.03 + r() * 0.07); const q = g.createRadialGradient(x - R * 0.2, y - R * 0.2, R * 0.1, x, y, R); q.addColorStop(0, hex(base, 0.72)); q.addColorStop(0.8, hex(base, 0.9)); q.addColorStop(1, hex(base, 1.12)); g.fillStyle = q; g.beginPath(); g.arc(x, y, R, 0, 6.283); g.fill(); } }
  function gems(g, cols, r, k) { for (let i = 0; i < k; i++) { const x = (0.12 + r() * 0.76) * S, y = (0.12 + r() * 0.76) * S, R = S * (0.035 + r() * 0.035); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.moveTo(x, y - R + 3); g.lineTo(x + R + 3, y + 3); g.lineTo(x, y + R + 3); g.lineTo(x - R + 3, y + 3); g.fill();
      g.fillStyle = cols[(r() * cols.length) | 0]; g.beginPath(); g.moveTo(x, y - R); g.lineTo(x + R, y); g.lineTo(x, y + R); g.lineTo(x - R, y); g.fill(); g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(x - R * 0.35, y - R * 0.45, R * 0.3, R * 0.25); } }
  function bricks(g, base, r) { grain(g, base, 0.18, r, 2400); const rows = 4, h = S / rows; g.fillStyle = hex(base, 0.55); for (let y = 0; y < rows; y++) { g.fillRect(0, y * h, S, S / 64); const off = y % 2 ? S / 4 : 0; for (let x = off; x < S + 1; x += S / 2) g.fillRect(x % S, y * h, S / 64, h); }
    g.fillStyle = hex(base, 1.15); for (let y = 0; y < rows; y++) g.fillRect(0, y * h + S / 64, S, S / 128); }
  const DEFS = [
    [191, 'moon_regolith', 'Moon regolith', 0.6, 0, g => { const r = rng(191); grain(g, '#9c9a96', 0.3, r, 9000); craters(g, '#9c9a96', r, 7); }],
    [192, 'moon_rock', 'Moon rock', 1.6, 1, g => { const r = rng(192); grain(g, '#7e7d7b', 0.28, r, 7000); craters(g, '#7e7d7b', r, 4); g.strokeStyle = 'rgba(40,40,40,.35)'; g.lineWidth = S / 160; for (let i = 0; i < 5; i++) { g.beginPath(); let x = r() * S, y = r() * S; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * S / 6; y += r() * S / 10; g.lineTo(x, y); } g.stroke(); } }],
    [193, 'moon_basalt', 'Lunar basalt', 2.2, 1, g => { const r = rng(193); grain(g, '#3f4044', 0.35, r, 8000); for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(20,20,24,.6)'; g.beginPath(); g.arc(r() * S, r() * S, 1 + r() * S / 120, 0, 6.283); g.fill(); } }],
    [194, 'moon_crystal_ore', 'Lunar crystal ore', 3, 2, g => { const r = rng(194); grain(g, '#7e7d7b', 0.28, r, 6000); gems(g, ['#9fe8ff', '#c9f4ff', '#6fd0f0'], r, 6); }],
    [195, 'moon_bricks', 'Moon bricks', 2, 1, g => bricks(g, '#8e8d8a', rng(195))],
    [196, 'mars_stone', 'Mars stone', 1.6, 1, g => { const r = rng(196); grain(g, '#8a4a2e', 0.3, r, 8000); g.fillStyle = 'rgba(60,24,10,.25)'; for (let y = 0; y < S; y += S / 8) g.fillRect(0, y + r() * 6, S, S / 40); }],
    [197, 'mars_oxide_ore', 'Iron oxide ore', 3, 1, g => { const r = rng(197); grain(g, '#8a4a2e', 0.3, r, 6000); gems(g, ['#c0391b', '#e0602a', '#7a1e0e', '#d9822b'], r, 7); }],
    [198, 'mars_crystal_ore', 'Mars crystal ore', 3, 2, g => { const r = rng(198); grain(g, '#8a4a2e', 0.3, r, 6000); gems(g, ['#ff8a5c', '#ffc09a', '#ff5a3a'], r, 6); }],
    [199, 'mars_bricks', 'Mars bricks', 2, 1, g => bricks(g, '#9a5434', rng(199))]];
  const ID = U.ID = {};
  for (const [id, key, name, hard, req, paint] of DEFS) { try { const c = document.createElement('canvas'); c.width = c.height = S; paint(c.getContext('2d')); TEX[key] = c.toDataURL('image/png'); delete texCache[key]; delete matCache[key];
      FACES[id] = key; NAMES[id] = name; ICON_KEY[id] = key; HARD[id] = hard; MC_HARD[id] = hard; REQ[id] = req; BLOCK_MATS[id] = mat(key);
      try { NEEDS_PICK.add(id); PLACEABLE.add(id); } catch (_) {} if (!ORDER.includes(id)) ORDER.push(id); try { if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(id)) CREATIVE_ALL.push(id); } catch (_) {}
      ID[key] = id; U.made++; } catch (e) { ERR(key, e); } }
  Object.assign(T, {MOONDUST: 191, MOONROCK: 192, MOONBASALT: 193, MOONORE: 194, MOONBRICK: 195, MARSSTONE: 196, MARSOXIDE: 197, MARSORE: 198, MARSBRICK: 199});
  for (const k of ['BRWALL', 'BRCARPET', 'BRCEIL', 'BRLIGHT', 'BRPILLAR', 'BRWINDOW', 'BRWHITE', 'BRGRASS', 'BRPAVE']) try { delete T[k]; } catch (_) {}
  try { const df = dropsFor; dropsFor = function (b) { if (b >= 191 && b <= 199) return [[b, 1]]; return df.apply(this, arguments); }; } catch (e) { ERR('drop', e); }
  try { RECIPES.push(rc('4 Moon bricks', '4 Moon rock', 195, 4, [[192, 4]])); RECIPES.push(rc('4 Mars bricks', '4 Mars stone', 199, 4, [[196, 4]])); } catch (e) { ERR('rc', e); }
  try { if (typeof SMELT !== 'undefined') SMELT[193] = SMELT[T.COBBLE] !== undefined ? 192 : 192; } catch (e) { ERR('sm', e); }
  // ---------- old saves: old blocks in those slots become air, once ----------
  try { const se = serialize; serialize = function () { const o = se.apply(this, arguments); try { if (o && !DIM.cur) o.c315 = 1; } catch (_) {} return o; }; } catch (e) { ERR('ser', e); }
  try { const ew = enterWorld; enterWorld = async function (save) { const r = await ew.apply(this, arguments); try { if (save && !save.c315 && !DIM.cur && world) { let n = 0; for (let i = 0; i < world.length; i++) { const b = world[i]; if (b >= 191 && b <= 199) { world[i] = 0; n++; } }
          for (let id = 191; id <= 199; id++) delete inv[id]; if (n) { dirtyAll = true; rebuild(); } U.remapped = n; } } catch (e) { ERR('remap', e); } return r; }; } catch (e) { ERR('ew', e); }
})();
