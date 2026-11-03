/* ===================== GLX-C41 (v0.9.43): no cauldron/furnace mini-block particles, 1-3 chests per castle, clear stairwells, splashes + swim animation, lava burning + under-lava view, real fire ===================== */
(function c41() {
  // ---- 1) cauldrons / furnaces: no floating mini blocks (they lagged); a soft glow instead ----
  let muteBurst = false; const bu = burst; burst = function () { if (muteBurst) return; return bu.apply(this, arguments); };
  for (const n of ['updateCauldrons', 'updateFurnaces']) { const f = window[n] || (n === 'updateCauldrons' ? updateCauldrons : updateFurnaces); const w = function () { muteBurst = true; try { return f.apply(this, arguments); } finally { muteBurst = false; } }; if (n === 'updateCauldrons') updateCauldrons = w; else updateFurnaces = w; }
  // ---- 2) castles: at most 3 chests, painting guaranteed; stairwells kept clear of decor ----
  const DECOR = new Set([T.TORCH, 161, 162, T.IRONBLOCK, T.COBWEB, T.COBBLE, T.WOOL, T.TAPESTRY, T.BOOKSHELF, T.TABLE, T.RCARPET, 221].filter(v => v !== undefined));
  window.c41Castles = function () {
    if (DIM.cur || typeof g9castles === 'undefined') return {};
    let removed = 0, cleared = 0;
    for (const c of g9castles) { const R = c[0] === 'citadel' ? 30 : 26, list = [];
      for (const [k, ch] of chests) { const [x, y, z] = k.split(',').map(Number); if (Math.abs(x - c[1]) <= R && Math.abs(z - c[2]) <= R && !(typeof placedSet !== 'undefined' && placedSet.has(idx(x, y, z)))) list.push([k, ch, x, y, z]); }
      list.sort((a, b) => a[3] - b[3]);
      const keep = list.length > 3 ? [list[0], list[Math.floor(list.length / 2)], list[list.length - 1]] : list;
      for (const e of list) if (!keep.includes(e)) { chests.delete(e[0]); world[idx(e[2], e[3], e[4])] = T.AIR; removed++; }
      if (keep.length && !keep.some(e => e[1].slots.some(s => s && s[0] === IT.PAINTING))) { const s = keep[0][1].slots; const i = s.indexOf(null); s[i >= 0 ? i : 26] = [IT.PAINTING, 1]; }
      for (let x = c[1] - R; x <= c[1] + R; x++) for (let z = c[2] - R; z <= c[2] + R; z++) { if (x < 0 || z < 0 || x >= W || z >= D) continue;
        for (let y = 2; y < H - 3; y++) if (IS_STAIR[world[idx(x, y, z)]]) for (let h = 1; h <= 2; h++) { const b = world[idx(x, y + h, z)]; if (DECOR.has(b)) { world[idx(x, y + h, z)] = T.AIR; entMeta.delete(keyOf(x, y + h, z)); cleared++; } } }
    }
    return {removed, cleared};
  };
  const ge = generate; generate = function () { const r = ge.apply(this, arguments); try { window.__c41 = c41Castles(); } catch (e) { console.warn('c41', e); } return r; };
  // ---- 3) water + lava: entry splash scaled by speed, surfacing splash, burning, under-lava view ----
  const ov = document.createElement('div'); ov.id = 'lavaOv'; ov.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:5;display:none;background:radial-gradient(ellipse at 50% 60%,rgba(255,170,40,.88),rgba(200,40,0,.96));mix-blend-mode:normal';
  const fireOv = document.createElement('div'); fireOv.id = 'burnOv'; fireOv.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:45%;pointer-events:none;z-index:5;display:none;background:linear-gradient(to top,rgba(255,110,0,.55),rgba(255,180,40,.25) 45%,rgba(255,200,80,0));animation:burnFl .18s infinite alternate';
  const st = document.createElement('style'); st.textContent = '@keyframes burnFl{from{opacity:.75;transform:scaleY(1)}to{opacity:1;transform:scaleY(1.08)}}'; document.head.appendChild(st);
  document.body.appendChild(ov); document.body.appendChild(fireOv);
  let wasIn = false, wasDeep = false, lastVy = 0, burnT = 0, burnTick = 0;
  window.playerBurning = () => burnT > 0; window.setPlayerBurn = s => { burnT = Math.max(burnT, s); };
  const tone = (f0, f1, dur, vol, type) => { try { if (!AC) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(vol * SET.sfx, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02); } catch (_) {} };
  const um = updatePlayer;
  updatePlayer = function (dt) {
    const vyBefore = P.vy; const r = um.apply(this, arguments);
    try {
      const inW = swimming, lava = !!window.swimLava, deep = !!window.swimDeep;
      if (inW && !wasIn) { const v = Math.min(1, Math.abs(Math.min(vyBefore, lastVy)) / 14);
        if (lava) { sfx('sizzle', 0.25 + 0.4 * v); tone(140, 60, 0.5, 0.25 + 0.3 * v); } else sfx('splash', 0.12 + 0.75 * v);
        const n = Math.round((PERF ? 3 : 6) + v * (PERF ? 4 : 10)); for (let i = 0; i < n; i++) burst(P.x + (Math.random() - .5) * .8, P.y + .3, P.z + (Math.random() - .5) * .8, lava ? 0xff7a20 : 0xcfe8f4, 1, .25 + v * .5); }
      if (wasDeep && !deep && inW && !lava) { sfx('splash', 0.18); for (let i = 0; i < (PERF ? 2 : 4); i++) burst(P.x, P.y + 1.3, P.z, 0xcfe8f4, 1, .2); }
      wasIn = inW; wasDeep = deep; lastVy = vyBefore;
      // burning: lava sets you alight for 15 s (MC); 1 damage per second while burning; water or rain puts it out
      if (lava) burnT = 15; else if (burnT > 0) { burnT -= dt; const wet = swimming || (weather && WEATHER[weather.type] && WEATHER[weather.type].drops && skyTop(Math.floor(P.x), Math.floor(P.z)) <= P.y + 1);
        if (wet) { burnT = 0; sfx('sizzle', 0.3); }
        burnTick -= dt; if (burnT > 0 && burnTick <= 0) { burnTick = 1; hurt(1, 'You burned to death.'); } }
      fireOv.style.display = burnT > 0 && !camMode ? 'block' : 'none';
    } catch (e) {}
    return r;
  };
  // under lava: solid orange-red screen, thick fog, very short view (water's own filter untouched)
  const us = updateSky;
  updateSky = function () { const r = us.apply(this, arguments);
    try { const b = getB(Math.floor(camera.position.x), Math.floor(camera.position.y), Math.floor(camera.position.z)), inL = b === T.LAVA;
      ov.style.display = inL ? 'block' : 'none'; if (inL) { scene.fog.color.setHex(0xd0400a); scene.background.setHex(0xd0400a); scene.fog.near = 0.05; scene.fog.far = 2.2; } } catch (_) {}
    return r; };
  // ---- 4) swimming body: horizontal front crawl when moving in deep water, treading water when still ----
  let swimK = 0, swimPh = 0, swimLast = performance.now();
  const uw = updateWorldModel;
  updateWorldModel = function () { const r = uw.apply(this, arguments);
    try { if (!worldModel || !camMode) return r; const u = worldModel.userData; const now = performance.now(), dt = Math.min(0.1, (now - swimLast) / 1000); swimLast = now;
      const deep = !!window.swimDeep, moving = deep && (keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD || bobMv > 0.001 || (typeof touchMove !== 'undefined' && touchMove && (Math.abs(touchMove.x || 0) + Math.abs(touchMove.y || 0)) > 0.1));
      const lava = !!window.swimLava, tgt = deep ? 1 : 0; swimK += (tgt - swimK) * Math.min(1, dt * 3);
      if (swimK < 0.01) return r;
      const mv = moving ? 1 : 0; u.swimMv = (u.swimMv || 0) + (mv - (u.swimMv || 0)) * Math.min(1, dt * 2.5); const m = u.swimMv;
      swimPh += dt * (lava ? 2.2 : (sprinting ? 6 : 4.2)) * (0.45 + 0.55 * m);
      const k = swimK, s = Math.sin(swimPh), c = Math.cos(swimPh);
      worldModel.rotation.x = -1.35 * k * m;                    // lie forward
      worldModel.rotation.z = Math.sin(swimPh) * 0.18 * k * m;   // body roll with each stroke
      worldModel.position.y = P.y - 0.15 * k + Math.sin(swimPh * 0.5) * 0.05 * k;
      // arms: alternating overhead strokes (moving) / slow sculling circles (treading)
      u.arms[0].rotation.x = (-Math.PI + swimPh % (Math.PI * 2)) * k * m + (s * 0.5) * k * (1 - m); u.arms[0].rotation.z = (0.6 + c * 0.25) * k * (1 - m);
      u.arms[1].rotation.x = (-Math.PI + (swimPh + Math.PI) % (Math.PI * 2)) * k * m + (-s * 0.5) * k * (1 - m); u.arms[1].rotation.z = -(0.6 + c * 0.25) * k * (1 - m);
      // legs: quick flutter kick / slow treading
      const kick = Math.sin(swimPh * (m ? 3 : 1.4)) * (m ? 0.45 : 0.3) * k; u.legs[0].rotation.x = kick; u.legs[1].rotation.x = -kick;
      u.head.rotation.x = -0.9 * k * m + u.head.rotation.x * (1 - k * m);   // head up out of the water while crawling
    } catch (_) {}
    return r; };
  // ---- 5) fire: animated layered flames, glow, embers, light, strike + crackle ----
  const FC = document.createElement('canvas'); FC.width = 256; FC.height = 1024; const fg = FC.getContext('2d');
  for (let f = 0; f < 4; f++) { const y0 = f * 256;   // 4 flicker frames stacked
    fg.clearRect(0, y0, 256, 256);
    for (let i = 0; i < 26; i++) { const x = 30 + Math.random() * 196, h = 120 + Math.random() * 120, w = 26 + Math.random() * 40;
      const gr = fg.createLinearGradient(0, y0 + 256, 0, y0 + 256 - h); gr.addColorStop(0, 'rgba(255,240,170,.95)'); gr.addColorStop(0.35, 'rgba(255,160,40,.9)'); gr.addColorStop(0.75, 'rgba(230,60,10,.6)'); gr.addColorStop(1, 'rgba(120,20,0,0)');
      fg.fillStyle = gr; fg.beginPath(); fg.moveTo(x - w / 2, y0 + 256); fg.quadraticCurveTo(x - w * 0.6 + Math.random() * 20, y0 + 256 - h * 0.55, x + (Math.random() - .5) * 30, y0 + 256 - h); fg.quadraticCurveTo(x + w * 0.6 - Math.random() * 20, y0 + 256 - h * 0.55, x + w / 2, y0 + 256); fg.fill(); } }
  const FT = new THREE.CanvasTexture(FC); FT.repeat.set(1, 0.25); if (THREE.SRGBColorSpace) FT.colorSpace = THREE.SRGBColorSpace;
  try { PLANT_MATS[T.FIRE].map = FT; PLANT_MATS[T.FIRE].blending = THREE.AdditiveBlending; PLANT_MATS[T.FIRE].alphaTest = 0.02; PLANT_MATS[T.FIRE].needsUpdate = true; } catch (_) {}
  const glows = [], NL = HIGH ? 3 : PERF ? 1 : 2, lights = [];
  for (let i = 0; i < NL; i++) { const l = new THREE.PointLight(0xff8a30, 0, 11, 1.6); scene.add(l); lights.push(l); }
  for (let i = 0; i < 10; i++) { const g = glowSprite(0xff9a40, 1.8); g.visible = false; scene.add(g); glows.push(g); }
  let crackle = null, fireAnim = 0, emberT = 0;
  function crackleLoop(vol) { try { if (!AC) return; if (!crackle) { const n = AC.sampleRate * 2, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() < 0.0015 ? (Math.random() * 2 - 1) : (Math.random() * 2 - 1) * 0.04;
      const s = AC.createBufferSource(); s.buffer = b; s.loop = true; const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 900; const g = AC.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(AC.destination); s.start(); crackle = g; }
      crackle.gain.setTargetAtTime(vol * SET.sfx, AC.currentTime, 0.3); } catch (_) {} }
  const ul = updateLights;
  updateLights = function (dt) { const r = ul.apply(this, arguments);
    try { fireAnim += (dt || 0.016); FT.offset.y = (Math.floor(fireAnim * 12) % 4) * 0.25;
      const near = []; if (fires.size) { for (const [i] of fires) { const x = Math.floor(i / (H * D)), y = Math.floor((i % (H * D)) / D), z = i % D; const d = Math.hypot(x + .5 - P.x, y - P.y, z + .5 - P.z); if (d < 40) near.push([d, x, y, z]); } near.sort((a, b) => a[0] - b[0]); }
      const t = performance.now() / 1000;
      lights.forEach((l, j) => { const f = near[j]; if (f) { l.position.set(f[1] + .5, f[2] + .6, f[3] + .5); l.intensity = 2.2 + Math.sin(t * 17 + j) * 0.35 + Math.sin(t * 7.3 + j * 2) * 0.25; } else l.intensity = 0; });
      glows.forEach((g, j) => { const f = near[j]; g.visible = !!f; if (f) { g.position.set(f[1] + .5, f[2] + .45, f[3] + .5); g.scale.setScalar(1.6 + Math.sin(t * 13 + j) * 0.15); } });
      emberT -= dt || 0.016; if (near.length && emberT <= 0) { emberT = PERF ? 0.5 : 0.22; const f = near[(Math.random() * Math.min(3, near.length)) | 0]; burst(f[1] + .5, f[2] + .8, f[3] + .5, Math.random() < .7 ? 0xffa030 : 0x555555, 1, .15); }
      crackleLoop(near.length ? Math.min(0.12, 0.6 / (1 + near[0][0])) : 0);
    } catch (_) {}
    return r; };
  // strike: spark + metallic scrape
  const ui = useItem;
  useItem = function () { const was = fires.size; const r = ui.apply(this, arguments);
    try { if (selId === IT.FLINTSTEEL) { tone(3200, 1800, 0.08, 0.18, 'square'); tone(5200, 2600, 0.05, 0.1, 'sawtooth'); const h = raycast(5); if (h && h.prev) for (let i = 0; i < 6; i++) burst(h.prev[0] + .5, h.prev[1] + .2, h.prev[2] + .5, 0xffe070, 1, .3); if (fires.size > was) sfx('sizzle', 0.15); } } catch (_) {}
    return r; };
})();
