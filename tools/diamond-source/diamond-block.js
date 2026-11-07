/* GLX-D259 (v1.2.3): deterministic faceted polished aqua diamond block259 (v1.2.6 palette); snow255 and juniper250 preserved. Static 128/256px tile, not a 4K atlas. */
(function d259() {
  const U = window.__d259 = {err: null, id: 259, snow: 255, fixed: 0, painted: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const DB = 259, SNOW = 255;

  function rng(seed) { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
  function paint(S) {
    const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    const R = rng(259 * 7919 + 100);
    const lg = (x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); for (const [p, col] of stops) gr.addColorStop(p, col); return gr; };
    g.fillStyle = '#032a33'; g.fillRect(0, 0, S, S);
    const n = 3, t = S / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = i * t, y = j * t, cx = x + t / 2, cy = y + t / 2, r = t * 0.44, m = t * 0.18;
      g.fillStyle = lg(x, y, x + t, y + t, [[0, '#13707e'], [1, '#05343e']]); g.fillRect(x + 1, y + 1, t - 2, t - 2);
      const P = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
      const I = [[cx, cy - m], [cx + m, cy], [cx, cy + m], [cx - m, cy]];
      const C = ['#f0ffff', '#4fe8ec', '#0e93a6', '#9ffcf4'];
      for (let k = 0; k < 4; k++) {
        g.beginPath(); g.moveTo(P[k][0], P[k][1]); g.lineTo(P[(k + 1) % 4][0], P[(k + 1) % 4][1]);
        g.lineTo(I[(k + 1) % 4][0], I[(k + 1) % 4][1]); g.lineTo(I[k][0], I[k][1]); g.closePath(); g.fillStyle = C[k]; g.fill();
      }
      g.beginPath(); I.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
      g.fillStyle = lg(cx - m, cy - m, cx + m, cy + m, [[0, '#ffffff'], [0.45, '#c4fffa'], [1, '#2cc6d4']]); g.fill();
      g.strokeStyle = 'rgba(2,40,48,.85)'; g.lineWidth = S * 0.0045;
      g.beginPath(); P.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.stroke();
      for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(P[k][0], P[k][1]); g.lineTo(I[k][0], I[k][1]); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.95)';
      const sx = cx - r * 0.32, sy = cy - r * 0.28, z = t * 0.06;
      g.beginPath(); g.moveTo(sx, sy - z); g.lineTo(sx + z * 0.25, sy - z * 0.2); g.lineTo(sx + z, sy); g.lineTo(sx + z * 0.25, sy + z * 0.2);
      g.lineTo(sx, sy + z); g.lineTo(sx - z * 0.25, sy + z * 0.2); g.lineTo(sx - z, sy); g.lineTo(sx - z * 0.25, sy - z * 0.2); g.closePath(); g.fill();
      void R; // deterministic seed reserved for future micro-flecks without changing layout
    }
    g.strokeStyle = 'rgba(1,30,38,.9)'; g.lineWidth = S * 0.01;
    for (let k = 0; k <= n; k++) { g.beginPath(); g.moveTo(k * t, 0); g.lineTo(k * t, S); g.stroke(); g.beginPath(); g.moveTo(0, k * t); g.lineTo(S, k * t); g.stroke(); }
    /* v1.2.6 polished aqua sheen: soft diagonal gloss band + fine sparkle, deterministic */
    { const sh = g.createLinearGradient(0, 0, S, S); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.42, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(220,255,255,.28)'); sh.addColorStop(0.58, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(0, 0, S, S);
      const R2 = rng(2591); g.fillStyle = 'rgba(235,255,255,.9)'; for (let i = 0; i < 24; i++) { const x = R2() * S, y = R2() * S, z = S * (0.004 + R2() * 0.006); g.fillRect(x - z, y - z * 0.2, z * 2, z * 0.4); g.fillRect(x - z * 0.2, y - z, z * 0.4, z * 2); } }
    return c;
  }
  U.paint = paint;

  function bind(c) {
    const key = 'diamond_block';
    try {
      if (NAMES[DB] && NAMES[DB] !== 'Block of diamond') throw Error('Diamond id259 already allocated');
      T.DIAMONDBLOCK = DB; U.id = DB;
      // Never reclaim snow
      if (T.PACKSNOW == null) T.PACKSNOW = SNOW;
      if (FACES[SNOW] !== 'packsnow' && (!NAMES[SNOW] || /snow/i.test(NAMES[SNOW] || ''))) {
        /* leave snow alone if C287 already set it; do not write diamond onto 255 */
      }
      FACES[DB] = key; NAMES[DB] = 'Block of diamond'; ICON_KEY[DB] = key;
      HARD[DB] = 5.5; MC_HARD[DB] = 5; REQ[DB] = 3;
      try { NEEDS_PICK.add(DB); } catch (_) {}
      PLACEABLE.add(DB);
      if (!ORDER.includes(DB)) ORDER.push(DB);
      try { if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(DB)) CREATIVE_ALL.push(DB); } catch (_) {}
      try { if (typeof BUILT_T !== 'undefined') BUILT_T[DB] = 1; } catch (_) {}
      try { if (typeof SHOVEL_ON !== 'undefined') SHOVEL_ON.delete(DB); } catch (_) {}

      const t = new THREE.Texture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = typeof TEXANISO !== 'undefined' ? TEXANISO : 4;
      t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
      try { texCache[key] = t; texImg[key] = c; } catch (_) {}
      try {
        const s = document.createElement('canvas'); s.width = s.height = 1; s.getContext('2d').drawImage(c, 0, 0, 1, 1);
        const d = s.getContext('2d').getImageData(0, 0, 1, 1).data; AVG[key] = (d[0] << 16) | (d[1] << 8) | d[2];
      } catch (_) {}

      // Polished static material (all faces same map). Prefer MeshStandard when present.
      let m;
      try {
        if (typeof THREE.MeshStandardMaterial === 'function') {
          m = new THREE.MeshStandardMaterial({
            map: t, color: 0xffffff, roughness: 0.22, metalness: 0.55,
            emissive: new THREE.Color(0x061018), emissiveIntensity: 0.08
          });
        } else {
          m = mat(key);
          try { if (m) { m.shininess = 90; m.specular = new THREE.Color(0xb8e8ff); } } catch (_) {}
        }
      } catch (e) { ERR('mat', e); m = mat(key); }
      BLOCK_MATS[DB] = m; matCache[key] = m;
      try { ICONS[DB] = c.toDataURL(); } catch (_) {}

      // Inventory CSS icon
      try {
        const s = document.createElement('canvas'); s.width = s.height = 64; s.getContext('2d').drawImage(c, 0, 0, 64, 64);
        let el = document.getElementById('c120tex'); if (!el) { el = document.createElement('style'); el.id = 'c120tex'; document.head.appendChild(el); }
        el.textContent = el.textContent.split('\n').filter(l => l && !l.startsWith('.ic-' + key + '{')).concat('.ic-' + key + '{background-image:url(' + s.toDataURL() + ') !important}').join('\n');
      } catch (_) {}

      // Recipes: ensure craft/uncraft target DB=259, not 255
      try {
        if (typeof RECIPES !== 'undefined' && typeof rc === 'function' && typeof IT !== 'undefined') {
          for (const r of RECIPES) {
            if (r && r.out === SNOW && /diamond/i.test(r.name || '')) r.out = DB;
            if (r && r.need) for (const n of r.need) if (n && n[0] === SNOW && /diamond/i.test(r.name || '')) n[0] = DB;
          }
          if (!RECIPES.some(r => r.out === DB)) RECIPES.push(rc('Block of diamond', '9 Diamonds', DB, 1, [[IT.DIAMOND, 9]], 1));
          if (!RECIPES.some(r => r.out === IT.DIAMOND && r.need && r.need.length === 1 && r.need[0][0] === DB))
            RECIPES.push(rc('Diamonds (x9)', '1 Block of diamond', IT.DIAMOND, 9, [[DB, 1]]));
        }
      } catch (e) { ERR('rec', e); }

      // drops
      try {
        const df = dropsFor;
        dropsFor = function (b) { if (b === DB) return [[DB, 1]]; return df.apply(this, arguments); };
      } catch (_) {}

      U.fixed = 1; U.painted = 1; U.key = key; U.avg = AVG[key];
    } catch (e) { ERR('bind', e); }
  }

  function apply() {
    try {
      const S = (typeof PHONE !== 'undefined' && PHONE) || (typeof PERF !== 'undefined' && PERF) ? 128 : 256;
      const c = paint(S);
      bind(c);
      // Evidence helpers for tests / cave worker
      U.sample = (u, v) => {
        try {
          const img = texImg && texImg.diamond_block; if (!img) return null;
          const x = Math.min(img.width - 1, Math.max(0, (u * img.width) | 0));
          const y = Math.min(img.height - 1, Math.max(0, (v * img.height) | 0));
          const g = document.createElement('canvas'); g.width = g.height = 1;
          const ctx = g.getContext('2d'); ctx.drawImage(img, x, y, 1, 1, 0, 0, 1, 1);
          const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]];
        } catch (_) { return null; }
      };
      U.isSnowish = (rgb) => { if (!rgb) return true; const [r, g, b] = rgb; return r > 180 && g > 190 && b > 200 && Math.abs(r - b) < 40; };
      U.isDiamondish = (rgb) => { if (!rgb) return false; const [r, g, b] = rgb; return b > r + 20 && b > 80 && g > 60 && r < 200; };
    } catch (e) { ERR('apply', e); }
  }

  // Run after C287 packed snow (ORDER) and again a few times in case of late atlas rebuilds
  try { apply(); } catch (e) { ERR('boot', e); }
})();
