/* ===================== GLX-C244 (v1.0.57): ELEMENT 115 - scoop the glowing puddle with a bucket, pour the 115 bucket into the volcano after it has erupted:
   it erupts BLUE, a blue wave stains the world, and the whole world drops into MATRIX MODE (green world, black sky, falling green code).
   Saved with the world; switch it on/off from the pause menu once unlocked; Reset world clears it. ===================== */
(function c244() {
  const U = window.__c244 = {err: null, on: 0, wave: 0, pours: 0, scoops: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const LOW = (typeof touchMode !== 'undefined' && !!touchMode) || (typeof PERF !== 'undefined' && PERF);
  const B115 = U.id = IT.B115 = 391;
  try { NAMES[B115] = 'Element 115 bucket';
    ICONS[B115] = drawIcon(g => { g.strokeStyle = '#3b2a1a'; g.lineWidth = 3; g.beginPath(); g.arc(0, -8, 18, Math.PI, 0); g.stroke(); g.fillStyle = '#8a6239'; g.beginPath(); g.moveTo(-18, -8); g.lineTo(18, -8); g.lineTo(13, 24); g.lineTo(-13, 24); g.closePath(); g.fill();
      g.shadowColor = '#40d8ff'; g.shadowBlur = 10; g.fillStyle = '#2ec8ff'; g.beginPath(); g.ellipse(0, -8, 17, 5, 0, 0, 7); g.fill(); g.shadowBlur = 0; g.fillStyle = '#d8f8ff'; g.fillRect(-6, -10, 5, 2); });
    if (!ORDER.includes(B115)) ORDER.push(B115); } catch (e) { ERR('item', e); }
  // ---------- bucket: scoop 115; 115 bucket: pour into the volcano ----------
  try { const ui = useItem; useItem = function () { try { if (!(menuOpen || paused || dead || !started)) { const id = selId;
        if (id === IT.BUCKET && cnt(id) > 0 && window.__c243 && __c243.scoop()) { useUp(IT.BUCKET); addItem(B115, 1); selId = B115; U.scoops++; try { swing(); sfx('splash'); } catch (_) {} renderHotbar(); toast('Scooped up Element 115 - it hums in the bucket'); return; }
        if (id === B115 && cnt(id) > 0) { const at = current && current.c229; if (!at) { toast('There is no volcano in this world'); return; } const d = Math.hypot(P.x - at[0], P.z - at[2]);
          if (d > 45) { toast('Take it to the volcano crater'); return; } if (!current.c242ever) { toast('The volcano is sleeping - it has to erupt first'); return; }
          useUp(B115); addItem(IT.BUCKET, 1); selId = IT.BUCKET; renderHotbar(); pour(); return; } } } catch (e) { ERR('use', e); } return ui.apply(this, arguments); }; } catch (e) { ERR('ui', e); }
  // ---------- the blue eruption + wave ----------
  let wave = null, waveT = -1, wT = 0;
  function pour() { U.pours++; try { toast('The 115 sinks into the crater...'); } catch (_) {} try { if (window.__c242) __c242.erupt(true); } catch (e) { ERR('er', e); } waveT = 6; wT = performance.now(); }
  U.pour = pour;
  function mkWave(at) { const g = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 64), new THREE.MeshBasicMaterial({color: 0x30b0ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false}));
    g.rotation.x = -Math.PI / 2; g.position.set(at[0], at[3] - 4, at[2]); g.userData.__dcR = 1e9; g.userData.__dcK = 1; scene.add(g); return {g, r: 2}; }
  // ---------- matrix mode ----------
  let rain = null, keep = null;
  function mkRain() { const c = document.createElement('canvas'); c.id = 'c244rain'; c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:4;opacity:.5'; document.body.appendChild(c);
    const S = LOW ? 0.4 : 0.6; c.width = Math.round(innerWidth * S); c.height = Math.round(innerHeight * S); const fs = 14, cols = Math.ceil(c.width / fs), y = new Array(cols).fill(0).map(() => Math.random() * -50);
    return {c, g: c.getContext('2d'), fs, y, t: 0}; }
  const GL = 'アカサタナハマヤラワ0123456789ABCDEFﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘ';
  function drawRain(dt) { const r = rain; r.t += dt; if (r.t < (LOW ? 0.08 : 0.05)) return; r.t = 0; const g = r.g, c = r.c; g.fillStyle = 'rgba(0,0,0,0.12)'; g.globalCompositeOperation = 'destination-out'; g.fillRect(0, 0, c.width, c.height); g.globalCompositeOperation = 'source-over';
    g.font = r.fs + 'px monospace'; for (let i = 0; i < r.y.length; i++) { const ch = GL[(Math.random() * GL.length) | 0], x = i * r.fs, yy = r.y[i] * r.fs; g.fillStyle = '#c8ffd8'; g.fillText(ch, x, yy); g.fillStyle = '#20ff60'; g.fillText(GL[(Math.random() * GL.length) | 0], x, yy - r.fs);
      if (yy > c.height && Math.random() > 0.975) r.y[i] = 0; r.y[i] += 1; } }
  // v1.0.58 perf: no CSS filters on the WebGL canvas (they force a full-screen filter pass every frame on phones) - one static multiply overlay instead
  let tv = null; function tint(k) { if (!tv) { tv = document.createElement('div'); tv.id = 'c244tint'; tv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;mix-blend-mode:multiply;display:none;transition:opacity 1.5s'; document.body.appendChild(tv); }
    if (!k) { tv.style.display = 'none'; return; } tv.style.display = 'block'; tv.style.background = k === 'm' ? 'rgb(60,255,110)' : 'rgb(110,170,255)'; }
  function apply(on) { U.on = on ? 1 : 0; tint(on ? 'm' : '');
    if (on && !rain) rain = mkRain(); if (!on && rain) { rain.c.remove(); rain = null; }
    try { skyDome.visible = !on; } catch (_) {} try { if (typeof sunDisc !== 'undefined') sunDisc.visible = !on; } catch (_) {}
    if (on) { if (!keep) keep = scene.background; scene.background = new THREE.Color(0, 0, 0); } else if (keep !== null) { scene.background = keep; keep = null; } }
  U.set = v => { if (!current) return; current.c244 = current.c244 || {}; current.c244.u = 1; current.c244.on = v ? 1 : 0; try { dirty = true; } catch (_) {} apply(!!v); };
  // pause-menu toggle (only once unlocked)
  let btn = null, bT = 0;
  function syncBtn() { const s = current && current.c244, pp = document.querySelector('#pause .panel'); if (!pp) return; if (!s || !s.u) { if (btn) { btn.remove(); btn = null; } return; }
    if (!btn) { btn = document.createElement('button'); btn.className = 'btn'; btn.dataset.testid = 'matrix-toggle'; btn.onclick = () => { U.set(!(current.c244 && current.c244.on)); syncBtn(); }; const ref = document.getElementById('resumeBtn'); if (ref) ref.parentNode.insertBefore(btn, ref.nextSibling); else pp.appendChild(btn); }
    btn.textContent = 'Matrix mode: ' + (s.on ? 'On' : 'Off'); }
  function frame(dt) { if (!started) { if (U.on) apply(false); return; } const s = current && current.c244, want = !!(s && s.on) && !(typeof DIM !== 'undefined' && DIM && DIM.cur); if (want !== !!U.on) apply(want);
    if (U.on) { try { skyDome.visible = false; scene.fog.color.setRGB(0, 0.035, 0.01); scene.background = scene.background && scene.background.isColor ? scene.background.setRGB(0, 0, 0) : new THREE.Color(0, 0, 0); } catch (_) {} if (rain) drawRain(dt); }
    if (waveT > 0) { waveT = 6 - (performance.now() - wT) / 1000; if (waveT <= 0) { wT = performance.now(); const at = current.c229; wave = mkWave(at); U.wave = 1; try { shake(2, 0.2); toast('A blue wave rolls across the world...'); } catch (_) {} } }
    if (wave) { wave.r = 2 + (performance.now() - wT) * 0.06; wave.g.scale.set(wave.r, wave.r, 1); wave.g.material.opacity = Math.max(0, 0.75 - wave.r / 500); if (!U.on && wave.r < 30) tint('b');
      if (wave.r > 420) { scene.remove(wave.g); wave = null; U.wave = 2; U.set(1); try { toast('The world is not what it seems... (Matrix mode: switch it in the pause menu)'); } catch (_) {} } } }
  setInterval(() => { try { syncBtn(); } catch (e) { ERR('btn', e); } }, 500);
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { frame(Math.min(0.1, +dt || 0.016)); } catch (e) { ERR('fr', e); } return r; };
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && current && current.c244) d.c244 = current.c244; } catch (_) {} return d; }; } catch (e) { ERR('ser', e); }
  try { const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (current) current.c244 = d && d.c244 || null; } catch (_) {} return r; }; } catch (e) { ERR('ap', e); }
  try { const ew = enterWorld; enterWorld = function (save) { if (!save && current) current.c244 = null; return ew.apply(this, arguments); }; } catch (e) { ERR('ew', e); }
})();
