/* GLX-L567 (v1.1.78, item 54): a block of its own for layers 5, 6 and 7, in the ids freed by the clean up, plus heat shimmer.
   Geode crust (id 190, layer 5): purple crystal pockets. Columnar basalt (id 200, layer 6): six sided grey columns.
   Sunstone (id 184, layer 7): a glowing gold stone near the core. All three can be mined, drop themselves, can be placed, show in the
   bag and creative menu and save like any block. Deep in layers 6 and 7 the air wobbles with a soft heat shimmer. */
(function l567() {
  const U = window.__l567 = {err: null, made: 0, on: 0, shim: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent), S = PH ? 256 : 512;
  const rng = s => () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  function grain(g, base, r, n, a) { g.fillStyle = base; g.fillRect(0, 0, S, S); for (let i = 0; i < n; i++) { const w = 1 + r() * S / 40; g.fillStyle = 'rgba(' + (r() < 0.5 ? '0,0,0' : '255,255,255') + ',' + (r() * a) + ')'; g.fillRect(r() * S, r() * S, w, w); } }
  const DEFS = [
    [190, 'geode_crust', 'Geode crust', 2.0, 1, 0, g => { const r = rng(190); grain(g, '#3a3340', r, 6000, 0.2);
      for (let i = 0; i < 18; i++) { const x = r() * S, y = r() * S, R = S * (0.04 + r() * 0.07); g.fillStyle = '#d9d2c4'; g.beginPath(); g.arc(x, y, R, 0, 6.283); g.fill(); g.fillStyle = r() < 0.5 ? '#8e4fd6' : '#b98cf0'; g.beginPath(); g.arc(x, y, R * 0.75, 0, 6.283); g.fill();
        g.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 5; k++) { const a = r() * 6.283; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * R * 0.7, y + Math.sin(a) * R * 0.7); g.lineTo(x + Math.cos(a + 0.3) * R * 0.5, y + Math.sin(a + 0.3) * R * 0.5); g.fill(); } } }],
    [200, 'columnar_basalt', 'Columnar basalt', 2.6, 1, 0, g => { const r = rng(200); grain(g, '#3c3d40', r, 6000, 0.18); g.strokeStyle = '#1b1c1f'; g.lineWidth = S / 90; const h = S / 4;
      for (let row = -1; row < 6; row++) for (let col = -1; col < 6; col++) { const cx = col * h * 0.87 * 1.0 + (row & 1 ? h * 0.43 : 0), cy = row * h * 0.75; g.fillStyle = 'rgba(' + (r() < 0.5 ? '0,0,0' : '255,255,255') + ',' + r() * 0.12 + ')'; g.beginPath();
        for (let k = 0; k < 6; k++) { const a = k * 1.047 + 0.5236; g.lineTo(cx + Math.cos(a) * h / 2, cy + Math.sin(a) * h / 2); } g.closePath(); g.fill(); g.stroke(); } }],
    [184, 'sunstone', 'Sunstone', 2.8, 1, 1, g => { const r = rng(184); grain(g, '#b8731a', r, 5000, 0.2);
      for (let i = 0; i < 30; i++) { const x = r() * S, y = r() * S, R = S * (0.02 + r() * 0.05), q = g.createRadialGradient(x, y, 0, x, y, R); q.addColorStop(0, 'rgba(255,250,200,.95)'); q.addColorStop(1, 'rgba(255,170,20,0)'); g.fillStyle = q; g.fillRect(x - R, y - R, 2 * R, 2 * R); } }]];
  const IDS = U.IDS = new Set();
  for (const [id, key, name, hard, req, glow, paint] of DEFS) { try {
      for (const k in IT) if (IT[k] === id) delete IT[k]; try { if (typeof ICONS !== 'undefined') delete ICONS[id]; } catch (_) {}
      const c = document.createElement('canvas'); c.width = c.height = S; paint(c.getContext('2d')); TEX[key] = c.toDataURL('image/png'); try { delete texCache[key]; delete matCache[key]; } catch (_) {}
      FACES[id] = key; NAMES[id] = name; ICON_KEY[id] = key; HARD[id] = hard; MC_HARD[id] = hard; REQ[id] = req; const m = mat(key);
      BLOCK_MATS[id] = glow ? new THREE.MeshBasicMaterial({map: [].concat(m)[0].map}) : m;
      try { if (req) NEEDS_PICK.add(id); PLACEABLE.add(id); } catch (_) {} for (const L of [ORDER, typeof CREATIVE_ALL !== 'undefined' ? CREATIVE_ALL : []]) if (!L.includes(id)) L.push(id);
      IDS.add(id); U.made++; } catch (e) { ERR(key, e); } }
  Object.assign(T, {GEODE: 190, BASALTCOL: 200, SUNSTONE: 184});
  try { const df = dropsFor; dropsFor = function (b) { if (IDS.has(b)) return [[b, 1]]; return df.apply(this, arguments); }; } catch (e) { ERR('drop', e); }
  const h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const BY = {4: 190, 5: 200, 6: 184}, CH = {4: 0.05, 5: 0.08, 6: 0.04};
  const iv = setInterval(() => { try { const c = window.__c334; if (!c || !c.deep || !c.deep.c373) return; clearInterval(iv); if (c.deep.l567) return; const d0 = c.deep;
    const w = function (x, y, z, d) { const v = d0.apply(this, arguments); try { if (!v || v === T.WATER || v === T.LAVA || v === T.MAGMA || d < 540) return v; const i = c.band(d), nb = BY[i]; if (!nb) return v;
        if (h3(x >> 2, y >> 2, z >> 2) < CH[i] && h3(x, y, z) < 0.7) return nb; } catch (_) {} return v; };
    for (const k in d0) w[k] = d0[k]; w.l567 = 1; c.deep = w; U.on = 1; try { if (window.__c324 && __c324.cache) __c324.cache.clear(); if (window.__c320) __c320.dirty = 1; } catch (_) {} } catch (e) { ERR('wrap', e); } }, 300);
  // ---------- heat shimmer: a soft wobbling glow over the view deep down ----------
  const el = document.createElement('div'); el.id = 'l567shim'; el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;opacity:0;transition:opacity 1.5s;mix-blend-mode:screen;' +
    'background:repeating-linear-gradient(0deg,rgba(255,120,30,0) 0px,rgba(255,140,40,.07) 6px,rgba(255,120,30,0) 12px);';
  const st = document.createElement('style'); st.textContent = '@keyframes l567w{0%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-6px) scaleY(1.02)}100%{transform:translateY(0) scaleY(1)}}#l567shim{display:none}';
  try { document.head.appendChild(st); document.body.appendChild(el); } catch (e) { ERR('el', e); }
  function depth() { const e = window.__c320; if (!e || !e.E) return 0; if (e.flat) return SEA - P.y; const c = e.E(); return (e.R || 5000) - Math.hypot(P.x - c[0], P.y - c[1], P.z - c[2]); }
  setInterval(() => { try { const on = typeof started !== 'undefined' && started && !(typeof DIM !== 'undefined' && DIM.cur) && depth() > 690; U.shim = on ? 1 : 0; el.style.opacity = '0'; el.style.display = 'none';   /* v1.1.93: the striped heat shimmer is off for good, it looked like a broken TV deep down */ } catch (e) { ERR('sh', e); } }, 700);
})();
