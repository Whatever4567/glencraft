/* GLX-TBOX2 (v1.1.55): TIME BOX WALLS AND CONSOLE. Inside, the room has its own floor and round walls, so the hills the box stands on
   never get in the way, and you leave the same way you came in, through the doors. Stand at the console and press F, the controller Y
   button, or tap the Console button, then pick where to go: places around Britain, Earth spawn, the Moon, Mars, Agartha, or spots you
   saved. The column rises and falls, the box makes its own grinding wheeze (made in code, no recordings), and when it lands the box and
   you are there together. Step out of the doors into the new place. */
(function tbox2() {
  const T = window.__tbox; if (!T) return; const U = window.__tbox2 = {err: null, trips: 0, opens: 0}; const S = T.S;
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const RR = T.RR, HW = T.HW, DW = T.DW, CZ = HW - RR, R = 0.32;
  // ---------- threshold and walls ----------
  try { const so = solid; solid = function (x, y, z) { if (T.inside && S.on) { const dx = x + 0.5 - S.x, dz = z + 0.5 - (S.z + CZ);
      if (dx * dx + dz * dz < (RR + 0.6) * (RR + 0.6) && z + 0.5 < S.z + HW + 0.2) { const fy = Math.floor(S.y + 0.01); if (y === fy - 1) return true; if (y >= fy && y < fy + 4) return false; } }
      return so.apply(this, arguments); }; } catch (e) { ERR('so', e); }
  function walls() { if (!S.on || DIM.cur) return; const fz = S.z + HW, dx = P.x - S.x, open = T.door > 0.6;
    if (T.inside) { if (P.z > fz + 0.02) { T.inside = false; return; }
      const door = Math.abs(dx) < DW && P.z > fz - 0.9; if (door) { const m = DW - R; if (Math.abs(dx) > m) P.x = S.x + Math.sign(dx) * m; }
      else { const cx = S.x, cz = S.z + CZ, ddx = P.x - cx, ddz = P.z - cz, d = Math.hypot(ddx, ddz) || 1, mx = RR - R - 0.1; if (d > mx) { P.x = cx + ddx / d * mx; P.z = cz + ddz / d * mx; } }
      { const ddx = P.x - S.x, ddz = P.z - (S.z + CZ), d = Math.hypot(ddx, ddz) || 1, mn = 1.15 + R; if (d < mn) { P.x = S.x + ddx / d * mn; P.z = S.z + CZ + ddz / d * mn; } }
      if (P.y < S.y) { P.y = S.y; if (P.vy < 0) P.vy = 0; } return; }
    if (P.y > S.y + 3.4 || P.y + 1.8 < S.y) return; const ox = HW + R - Math.abs(dx), oz = HW + R - Math.abs(P.z - S.z); if (ox <= 0 || oz <= 0) return;
    if (open && Math.abs(dx) < DW - R + 0.05 && P.z > S.z) { if (P.z < fz - 0.02 && Math.abs(P.y - S.y) < 0.6) { T.inside = true; } return; }
    if (ox < oz) P.x += Math.sign(dx || 1) * ox; else P.z += Math.sign(P.z - S.z || 1) * oz; }
  try { const up = updatePlayer; updatePlayer = function () { const r = up.apply(this, arguments); try { walls(); } catch (e) { ERR('w', e); } return r; }; } catch (e) { ERR('up', e); }
  // ---------- sound: made in code ----------
  let AC = null; function wheeze(dur) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t = AC.currentTime, v = (typeof SET !== 'undefined' ? SET.sfx : 0.8) * 0.5;
      const out = AC.createGain(); out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(v, t + 0.4); out.gain.setValueAtTime(v, t + dur - 0.8); out.gain.linearRampToValueAtTime(0, t + dur); out.connect(AC.destination);
      const n = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = AC.createBufferSource(); src.buffer = n; src.loop = true; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 6; src.connect(bp);
      const ng = AC.createGain(); ng.gain.value = 0.5; bp.connect(ng); ng.connect(out);
      for (let k = 0; k < dur / 1.1; k++) { const a = t + k * 1.1; bp.frequency.setValueAtTime(300, a); bp.frequency.exponentialRampToValueAtTime(1500, a + 0.7); bp.frequency.exponentialRampToValueAtTime(300, a + 1.1); }
      for (const f of [55, 82.4, 110.3]) { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; const g = AC.createGain(); g.gain.value = 0.12;
        const lf = AC.createOscillator(); lf.frequency.value = 0.9; const lg = AC.createGain(); lg.gain.value = 0.1; lf.connect(lg); lg.connect(g.gain); o.connect(lp); lp.connect(g); g.connect(out); o.start(t); lf.start(t); o.stop(t + dur); lf.stop(t + dur); }
      src.start(t); src.stop(t + dur); U.sounds = (U.sounds || 0) + 1; } catch (e) { ERR('snd', e); } }
  U.wheeze = wheeze;
  // ---------- places ----------
  const UK = [['Edinburgh', 55.95, -3.19], ['Glasgow', 55.86, -4.25], ['Inverness', 57.48, -4.22], ['Aberdeen', 57.15, -2.1], ['Ben Nevis', 56.8, -5.0], ['Loch Ness', 57.32, -4.43],
    ['Isle of Skye', 57.3, -6.2], ['Stirling', 56.12, -3.94], ['Oban', 56.41, -5.47], ['Thurso', 58.59, -3.52], ['Belfast', 54.6, -5.93], ['Newcastle', 54.97, -1.61], ['York', 53.96, -1.08],
    ['Manchester', 53.48, -2.24], ['Snowdon', 53.07, -4.08], ['Cardiff', 51.48, -3.18], ['London', 51.51, -0.13], ['Lerwick', 60.15, -1.15], ['Stornoway', 58.21, -6.39]];
  function llxz(lat, lon) { try { const g = window.__c339; if (!g || !g.K) return null; const z = Math.round((D >> 1) + (g.LAT0 - lat) * g.K), x = Math.round((W >> 1) + (lon - g.LON0) * g.K * Math.cos(lat * Math.PI / 180));
      return x > 8 && z > 8 && x < W - 8 && z < D - 8 ? [x, z] : null; } catch (_) { return null; } }
  const spotsK = () => 'glx_tbox_spots_' + ((typeof current !== 'undefined' && current && current.id) || 'w');
  const spots = () => { try { return JSON.parse(localStorage.getItem(spotsK()) || '[]'); } catch (_) { return []; } };
  function dests() { const L = [['home', 'Earth spawn'], ['moon', 'The Moon'], ['mars', 'Mars'], ['agartha', 'Agartha']]; for (const u of UK) if (llxz(u[1], u[2])) L.push(['uk:' + u[0], u[0]]);
    spots().forEach((s, i) => L.push(['spot:' + i, s.n])); L.push(['save', 'Save this spot']); L.push(['x', 'Close']); return L; }
  U.dests = dests;
  // ---------- travel: the box and you move together ----------
  function land(k) { const rx = P.x - S.x, ry = P.y - S.y, rz = P.z - S.z, px = P.x, py = P.y, pz = P.z;
    if (k === 'moon' || k === 'mars' || k === 'home') { if (k === 'home') { const x = Math.floor(W / 2) + 6, z = Math.floor(D / 2) + 4; return at(x, z, rx, ry, rz); } return false; }
    else if (k === 'agartha') { const c = window.__c337; if (!c || !c.go) return false; c.go(); }
    else if (k.startsWith('uk:')) { const u = UK.find(v => v[0] === k.slice(3)), p = u && llxz(u[1], u[2]); return p ? at(p[0], p[1], rx, ry, rz) : false; }
    else if (k.startsWith('spot:')) { const s = spots()[+k.slice(5)]; if (!s) return false; return at(Math.floor(s.x), Math.floor(s.z), rx, ry, rz); }
    if (P.x === px && P.y === py && P.z === pz) return false; T.place(P.x - rx, P.y - ry, P.z - rz); T.inside = true; return true; }
  function at(x, z, rx, ry, rz) { const y = groundTop(x, z) + 1; T.inside = false; T.place(x + 0.5, y, z + 0.5); P.x = S.x + rx; P.y = S.y + ry + 0.02; P.z = S.z + rz; P.vy = 0; P.fallTop = null; T.inside = true; return true; }
  let busy = false; U.go = function (k, name) { if (busy) return; if (DIM.cur) { toast('The time box only travels in the overworld'); return; } close(); busy = true; wheeze(5.5); T.fly = 1; const t0 = performance.now();
    const spin = () => { const t = (performance.now() - t0) / 1000; try { T.col.position.y = 1.1 + 0.45 * Math.sin(t * 2.6) + 0.45; T.col.rotation.y = t * 1.4; } catch (_) {} if (t < 5.5) requestAnimationFrame(spin); else { T.col.position.y = 1.1; T.fly = 0; busy = false; } };
    spin(); setTimeout(() => { let ok = false; try { ok = land(k); } catch (e) { ERR('land', e); } if (ok) { U.trips++; toast('Landed: ' + name); } else toast('The box could not land there'); }, 2600); };
  // ---------- console panel: keys, touch and controller ----------
  const ov = document.createElement('div'); ov.style.cssText = 'position:fixed;inset:0;z-index:310;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.45)';
  ov.innerHTML = '<div class="panel" style="text-align:center;min-width:270px;max-height:80vh;overflow:auto"><h2 style="margin:0 0 10px">Time box console</h2><div></div></div>'; document.body.appendChild(ov);
  const list = ov.querySelector('.panel div'); let foc = 0;
  const btns = () => [...list.querySelectorAll('button')], fo = () => btns().forEach((b, i) => { b.classList.toggle('focus', i === foc); if (i === foc) try { b.focus(); b.scrollIntoView({block: 'nearest'}); } catch (_) {} });
  function open() { if (ov.style.display === 'flex') return; list.innerHTML = ''; for (const [k, n] of dests()) { const b = document.createElement('button'); b.className = 'btn' + (k === 'x' ? ' alt' : ''); b.textContent = n; b.dataset.testid = 'tbox-' + k;
      b.style.cssText = 'display:block;width:100%;margin:5px 0'; b.addEventListener('click', e => { e.preventDefault(); pick(k, n); }); list.appendChild(b); }
    ov.style.display = 'flex'; foc = 0; fo(); U.opens++; try { document.exitPointerLock(); } catch (_) {} }
  function close() { ov.style.display = 'none'; }
  function pick(k, n) { if (k === 'x') return close(); if (k === 'save') { const L = spots(); L.unshift({n: 'Spot ' + (L.length + 1) + ' (' + Math.round(S.x) + ', ' + Math.round(S.z) + ')', x: S.x, z: S.z}); localStorage.setItem(spotsK(), JSON.stringify(L.slice(0, 6))); toast('Spot saved'); return close(); } U.go(k, n); }
  U.open = open; U.close = close; U.pick = pick;
  const atConsole = () => T.inside && Math.hypot(P.x - S.x, P.z - (S.z + CZ)) < 2.3;
  const tb = document.createElement('button'); tb.className = 'btn'; tb.textContent = 'Console'; tb.dataset.testid = 'tbox-console'; tb.style.cssText = 'position:fixed;right:14px;top:38%;z-index:120;display:none';
  tb.addEventListener('click', e => { e.preventDefault(); open(); }); tb.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); open(); }, {passive: false}); document.body.appendChild(tb);
  addEventListener('keydown', e => { if (ov.style.display === 'flex') { if (e.code === 'Escape') close(); else if (e.code === 'ArrowDown' || e.code === 'ArrowUp') { foc = (foc + (e.code === 'ArrowDown' ? 1 : btns().length - 1)) % btns().length; fo(); } return; }
    if (e.code === 'KeyF' && atConsole()) { e.stopImmediatePropagation(); open(); } }, true);
  let pb = [];
  (function poll() { try { tb.style.display = atConsole() && ov.style.display !== 'flex' ? 'block' : 'none'; const g = navigator.getGamepads ? [...navigator.getGamepads()].find(p => p) : null;
      if (g) { const b = i => g.buttons[i] && g.buttons[i].pressed, ed = i => b(i) && !pb[i];
        if (ov.style.display === 'flex') { if (ed(12) || ed(13)) { foc = (foc + (ed(13) ? 1 : btns().length - 1)) % btns().length; fo(); } if (ed(0)) btns()[foc].click(); if (ed(1)) close(); }
        else if (ed(3) && atConsole()) open(); pb = g.buttons.map(x => x.pressed); } } catch (e) { ERR('pad', e); } requestAnimationFrame(poll); })();
})();
