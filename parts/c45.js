/* ===================== GLX-C45 (v0.9.43): dragon collision, Hell mob traits + drops + soul wisps, spawn eggs, XP ===================== */
function dragonMove(a, mx, my, mz) {
  const p = a.g.position, hit = (x, y, z) => { for (const [ox, oy, oz] of [[0, 0, 0], [1.6, 0, 0], [-1.6, 0, 0], [0, 0, 1.6], [0, 0, -1.6], [0, 1.2, 0], [0, -1.2, 0]]) if (solid(Math.floor(x + ox), Math.floor(y + oy), Math.floor(z + oz))) return true; return false; };
  const n = Math.max(1, Math.ceil(Math.hypot(mx, my, mz) / 0.4));
  for (let i = 0; i < n; i++) { const sx = mx / n, sy = my / n, sz = mz / n;
    if (!hit(p.x + sx, p.y + sy, p.z + sz)) { p.x += sx; p.y += sy; p.z += sz; continue; }
    // steer: climb first, then slide along whichever axis is free, else back off
    const l = Math.hypot(sx, sz) || 0.3;
    if (!hit(p.x, p.y + l, p.z)) { p.y += l; continue; }
    if (!hit(p.x + sx, p.y, p.z)) { p.x += sx; continue; }
    if (!hit(p.x, p.y, p.z + sz)) { p.z += sz; continue; }
    if (!hit(p.x - sz, p.y, p.z + sx)) { p.x -= sz; p.z += sx; continue; }
    p.x -= sx * 0.5; p.z -= sz * 0.5; break;
  }
  if (hit(p.x, p.y, p.z)) p.y += 0.5;   // safety: never rest inside rock
}
(function c45() {
  // ---- items: rotten flesh, lost soul, spawn eggs ----
  IT.ROTTEN = 320; IT.SOUL = 321; NAMES[320] = 'Rotten flesh'; NAMES[321] = 'Lost soul';
  ICONS[320] = drawIcon(g => { g.fillStyle = '#7a4a3a'; g.beginPath(); g.ellipse(0, 0, 22, 14, -0.4, 0, 7); g.fill(); g.fillStyle = '#5c7a3a'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(Math.random() * 30 - 15, Math.random() * 18 - 9, 3 + Math.random() * 3, 0, 7); g.fill(); } });
  ICONS[321] = drawIcon(g => { const gr = g.createRadialGradient(0, 0, 2, 0, 0, 24); gr.addColorStop(0, '#e8fbff'); gr.addColorStop(0.4, '#5ad0ff'); gr.addColorStop(1, 'rgba(40,120,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 24, 0, 7); g.fill(); g.fillStyle = '#103050'; g.fillRect(-7, -4, 4, 5); g.fillRect(3, -4, 4, 5); });
  FOOD && (FOOD[320] = FOOD[320] || 2);
  const MOBS = [['sheep', '#e8e6df', '#bdb6a6'], ['haggis', '#7a5a3a', '#c8a070'], ['duck', '#4a7a3a', '#e8c040'], ['pig', '#f0a8a8', '#c87878'], ['clansman', '#2e5a3a', '#9b1c22'], ['zombie', '#2f8a7a', '#3a4aa0'], ['skeleton', '#d8d5cc', '#8a8780'],
    ['creeper', '#b8282a', '#111111'], ['spider', '#3a2e2a', '#a01010'], ['guardian', '#5a6a7a', '#c0d0e0'], ['treeman', '#5a3a1a', '#3a7a2a'], ['puffer', '#e8c040', '#5a8ad0'], ['imp', '#c8401a', '#ffd040'], ['hound', '#3a1a10', '#ff6a1a'], ['ghost', '#e8e4f0', '#8a80a0'], ['blazeskel', '#ffb030', '#5a1a00'], ['dragon', '#3a0a08', '#ff4010']];
  const EGG = {}; MOBS.forEach(([k, a, b], i) => { const id = 301 + i; EGG[id] = k; IT['EGG_' + k.toUpperCase()] = id; NAMES[id] = 'Spawn egg: ' + k;
    ICONS[id] = drawIcon(g => { g.fillStyle = a; g.beginPath(); g.ellipse(0, 2, 18, 24, 0, 0, 7); g.fill(); g.fillStyle = b; for (let j = 0; j < 9; j++) { g.beginPath(); g.arc(Math.sin(j * 2.4) * 11, Math.cos(j * 1.7) * 15 + 2, 3 + (j % 3), 0, 7); g.fill(); } g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(-7, -8, 5, 8, -0.4, 0, 7); g.fill(); });
    if (!ORDER.includes(id)) ORDER.push(id); if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(id); });
  [320, 321].forEach(id => { if (!ORDER.includes(id)) ORDER.push(id); });
  const HELLK = new Set(['imp', 'hound', 'ghost', 'blazeskel', 'dragon']);
  const ui = useItem;
  useItem = function () {
    const k = EGG[selId];
    if (!k || menuOpen || paused || dead || !started || !(MODE.infinite || cnt(selId) > 0)) return ui.apply(this, arguments);
    const r = raycast(6), d = lookDir(); let x = P.x + d[0] * 3, y = P.y, z = P.z + d[2] * 3; if (r && r.prev) { x = r.prev[0] + .5; y = r.prev[1]; z = r.prev[2] + .5; }
    let a = null; window.__egg = true;
    try { if (HELLK.has(k)) { a = hellMake(k, x, k === 'dragon' ? y + 6 : y, z); if (!a) a = mobs[mobs.length - 1]; } else { const was = DIM.cur; if (was) DIM.cur = null; try { a = spawnMob(k); } finally { DIM.cur = was; } if (a) a.g.position.set(x, y, z); } } finally { window.__egg = false; }
    if (a || true) { if (!MODE.infinite) useUp(selId); swing(); burst(x, y + .5, z, 0xffffff, 8, .4); sfx('pop', .5); renderHotbar(); }
  };
  // ---- Hell mobs: traits ----
  const um = updateMobs;
  updateMobs = function (dt) { um.apply(this, arguments);
    for (const a of mobs) { if (!a.hell || !a.g) continue; const p = a.g.position, d = Math.hypot(P.x - p.x, P.z - p.z);
      if (a.kind === 'hound') { a.lunge = (a.lunge || 0) - dt; if (d < 7 && d > 2 && a.lunge <= 0) { a.lunge = 3; a.kbx = (P.x - p.x) / d * 11; a.kbz = (P.z - p.z) / d * 11; a.vy = 5; try { sfx3d('growl', p, 20); } catch (_) {} } }   // pack lunge
      else if (a.kind === 'blazeskel') { a.scorch = (a.scorch || 0) - dt; if (d < 2.2 && Math.abs(P.y - p.y) < 2 && a.scorch <= 0) { a.scorch = 2; try { setPlayerBurn(4); } catch (_) {} } }   // fire touch
      else if (a.kind === 'ghost') { const v = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(performance.now() / 600 + p.x)); a.g.traverse(o => { if (o.material && !Array.isArray(o.material)) { o.material.transparent = true; o.material.opacity = v; } }); }   // flickers in and out
    } };
  const dm = damageMob;
  damageMob = function (a, dmg, byPlayer) { const r = dm.apply(this, arguments);   // imps blink away when struck
    try { if (a.kind === 'imp' && a.hp > 0) { const p = a.g.position; for (let t = 0; t < 8; t++) { const an = Math.random() * 6.28, x = p.x + Math.cos(an) * 4, z = p.z + Math.sin(an) * 4; if (!solid(Math.floor(x), Math.floor(p.y), Math.floor(z)) && !solid(Math.floor(x), Math.floor(p.y) + 1, Math.floor(z)) && solid(Math.floor(x), Math.floor(p.y) - 1, Math.floor(z))) { burst(p.x, p.y + .8, p.z, 0xff6a1a, 6, .4); p.x = x; p.z = z; break; } } } } catch (_) {}
    return r; };
  // ---- soul wisps ----
  const wisps = [];
  function wisp(x, y, z) { if (wisps.length > 6) return; const s = glowSprite(0x6ad8ff, 0.9); s.position.set(x, y + 1, z); scene.add(s); wisps.push({s, t: 0, tgt: null});
    try { if (AC) { const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(660, t); o.frequency.exponentialRampToValueAtTime(990, t + 1.2); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06 * SET.sfx, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + 1.5); } } catch (_) {} }
  // ---- XP ----
  let xp = 0, lvl = 0; const orbs = [], CAP = PERF ? 18 : HIGH ? 60 : 32;
  const need = L => L <= 15 ? 2 * L + 7 : L <= 30 ? 5 * L - 38 : 9 * L - 158;
  window.xpState = () => ({xp, lvl, orbs: orbs.length});
  const orbMat = new THREE.SpriteMaterial({map: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, '#f6ffb0'); gr.addColorStop(0.4, '#7ef03a'); gr.addColorStop(1, 'rgba(40,160,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending});
  window.dropXP = function (x, y, z, amount) { amount = Math.round(amount); if (amount <= 0) return; const n = Math.min(5, Math.max(1, Math.ceil(amount / 4)));
    for (let i = 0; i < n; i++) { const v = Math.round(amount / n); if (orbs.length >= CAP) { orbs[(Math.random() * orbs.length) | 0].v += v; continue; }
      const s = new THREE.Sprite(orbMat); s.scale.setScalar(0.25 + Math.min(0.25, v * 0.02)); s.position.set(x, y + 0.5, z); scene.add(s); orbs.push({s, v, vx: (Math.random() - .5) * 2, vy: 3 + Math.random() * 2, vz: (Math.random() - .5) * 2, t: 0}); } };
  function addXP(v) { xp += v; let up = false; while (xp >= need(lvl)) { xp -= need(lvl); lvl++; up = true; } if (up) { try { tone2(523, 0.25, 0.12); setTimeout(() => tone2(784, 0.3, 0.12), 120); } catch (_) {} toast('Level ' + lvl + '!'); } }
  function tone2(f, dur, v) { if (!AC) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(v * SET.sfx, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02); }
  const bar = document.createElement('div'); bar.id = 'xpBar'; bar.dataset.testid = 'xp-bar'; bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(66px + var(--sab,0px));width:min(360px,70vw);height:6px;border-radius:3px;background:#0008;border:1px solid #000a;z-index:6;pointer-events:none;display:none';
  bar.innerHTML = '<i style="display:block;height:100%;width:0;border-radius:3px;background:linear-gradient(#b8ff5a,#4cc020)"></i><b style="position:absolute;left:50%;top:-17px;transform:translateX(-50%);font:800 14px system-ui;color:#8cff40;text-shadow:0 0 3px #000,0 1px 2px #000"></b>';
  document.body.appendChild(bar);
  const se = serialize; serialize = function () { const d = se.apply(this, arguments); d.xp = xp; d.lvl = lvl; return d; };
  const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); xp = (d && d.xp) || 0; lvl = (d && d.lvl) || 0; return r; };
  const ew = enterWorld; enterWorld = function (save) { if (!save) { xp = 0; lvl = 0; } return ew.apply(this, arguments); };
  // sources: mobs (Hell x2, the dragon a lot), ores, smelting
  const PASSIVE = new Set(['sheep', 'haggis', 'duck', 'pig']);
  const km = killMob;
  killMob = function (a) { const p = a.g.position.clone(), k = a.kind, hell = !!a.hell; const r = km.apply(this, arguments);
    try { let v = k === 'dragon' ? 500 : PASSIVE.has(k) ? 1 + (Math.random() * 3 | 0) : 5; if (hell && k !== 'dragon') v *= 2; dropXP(p.x, p.y, p.z, v);
      if (hell) { if (k === 'ghost') { wisp(p.x, p.y, p.z); if (Math.random() < 0.6) dropItem(IT.SOUL, 1, p.x, p.y + .6, p.z, 0, 3, 0, .4); }
        else if (k === 'hound') { dropItem(IT.BONE || 171, 1 + (Math.random() * 2 | 0), p.x, p.y + .6, p.z, 1, 3, 0, .4); dropItem(IT.ROTTEN, 1 + (Math.random() * 2 | 0), p.x, p.y + .6, p.z, -1, 3, 0, .4); }
        else if (k === 'blazeskel') dropItem(IT.COAL, 1 + (Math.random() * 3 | 0), p.x, p.y + .6, p.z, 0, 3, 1, .4); }
    } catch (_) {}
    return r; };
  const ORE = new Set([T.COALORE, T.IRONORE, T.COPPERORE, T.GOLDORE, T.REDORE, T.DIAMONDORE, T.SILVERORE, T.CAIRNGORMORE].filter(v => v !== undefined));
  const ORE_XP = {[T.COALORE]: 1, [T.REDORE]: 3, [T.DIAMONDORE]: 6, [T.CAIRNGORMORE]: 4, [T.SILVERORE]: 2};
  const sb = setB; setB = function (x, y, z, v) { const old = (started && !c37busy && v === T.AIR && x >= 0 && z >= 0 && x < W && z < D && y >= 0 && y < H) ? world[idx(x, y, z)] : 0; const r = sb.apply(this, arguments);
    if (old && ORE.has(old) && Math.hypot(x + .5 - P.x, y - P.y, z + .5 - P.z) < 7) dropXP(x + .5, y, z + .5, ORE_XP[old] || 1); return r; };
  let smeltAcc = 0; const uf = updateFurnaces;
  updateFurnaces = function (dt) { const before = [...furnaces.values()].reduce((s, f) => s + (f.out ? f.out[1] : 0), 0); const r = uf.apply(this, arguments); const after = [...furnaces.values()].reduce((s, f) => s + (f.out ? f.out[1] : 0), 0);
    if (after > before) { smeltAcc += (after - before) * 0.35; if (smeltAcc >= 1) { const n = Math.floor(smeltAcc); smeltAcc -= n; addXP(n); } } return r; };
  // per frame: orbs fly to you, wisps rise and sink into soul sand, bar, death
  let wasDead = false;
  const up = updatePlayer;
  updatePlayer = function (dt) { const r = up.apply(this, arguments);
    try {
      for (let i = orbs.length - 1; i >= 0; i--) { const o = orbs[i], s = o.s.position; o.t += dt; const dx = P.x - s.x, dy = P.y + 0.8 - s.y, dz = P.z - s.z, d = Math.hypot(dx, dy, dz);
        if (o.t > 0.4 && d < 7) { const k = (8 - d) * 1.4; o.vx += dx / d * k * dt * 4; o.vy += dy / d * k * dt * 4; o.vz += dz / d * k * dt * 4; } else o.vy -= 9 * dt;
        o.vx *= Math.exp(-2 * dt); o.vz *= Math.exp(-2 * dt); o.vy *= Math.exp(-1 * dt);
        const nx = s.x + o.vx * dt, ny = s.y + o.vy * dt, nz = s.z + o.vz * dt; if (!solid(Math.floor(nx), Math.floor(ny), Math.floor(nz))) s.set(nx, ny, nz); else { o.vy = Math.abs(o.vy) * 0.3; o.vx *= .5; o.vz *= .5; }
        o.s.material.rotation = o.t * 2;
        if ((o.t > 0.4 && d < 1.2) || o.t > 300) { scene.remove(o.s); orbs.splice(i, 1); if (d < 1.2) { addXP(o.v); tone2(1300 + Math.random() * 400, 0.12, 0.07); } } }
      for (let i = wisps.length - 1; i >= 0; i--) { const w = wisps[i], s = w.s.position; w.t += dt;
        if (w.t < 1.5) s.y += dt * 1.2; else { if (!w.tgt) { let best = null, bd = 1e9; for (let x = Math.floor(s.x) - 10; x <= s.x + 10; x++) for (let z = Math.floor(s.z) - 10; z <= s.z + 10; z++) for (let y = Math.floor(s.y) - 8; y <= s.y + 2; y++) if (getB(x, y, z) === T.SOULSAND) { const d = Math.hypot(x - s.x, y - s.y, z - s.z); if (d < bd) { bd = d; best = [x + .5, y + .5, z + .5]; } } w.tgt = best || [s.x, s.y + 6, s.z]; }
          const [tx, ty, tz] = w.tgt, dx = tx - s.x, dy = ty - s.y, dz = tz - s.z, d = Math.hypot(dx, dy, dz) || 1; s.x += dx / d * dt * 2.5; s.y += dy / d * dt * 2.5; s.z += dz / d * dt * 2.5; w.s.scale.setScalar(0.9 * Math.min(1, d / 2 + 0.2)); if (d < 0.3 || w.t > 12) { scene.remove(w.s); wisps.splice(i, 1); } }
        if (Math.random() < dt * 6) burst(s.x, s.y, s.z, 0x7ad8ff, 1, .1); }
      bar.style.display = started && !menuOpen && current && current.mode !== 'creative' ? 'block' : 'none';
      bar.firstChild.style.width = (xp / need(lvl) * 100).toFixed(1) + '%'; bar.lastChild.textContent = lvl > 0 ? lvl : '';
    } catch (_) {}
    return r; };
  setInterval(() => { if (!started) return; if (dead && !wasDead) { const drop = Math.min(100, lvl * 7); if (drop > 0) dropXP(P.x, P.y, P.z, drop); xp = 0; lvl = 0; } wasDead = dead; }, 150);
  window.addXP = addXP;
})();
