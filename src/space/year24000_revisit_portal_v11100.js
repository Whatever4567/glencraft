/* GLX-Y24P (v1.1.100): CHROME REALITY revisit portal. After the UFO abduction encounter finishes,
   a stable portal appears on safe ground near the crash landing. It unlocks from the existing
   glen_met_* / save c246.met flags (YEAR 24000 chrome via __c248.start24 / stop24 - same realm the
   user calls year240000). No new world. Enter and return use the existing travel restore. Cooldown
   prevents re-entry loops. Static mesh - no strobe or sky flicker. */
(function y24p() {
  const U = window.__y24p = {err: null, on: 0, unlocked: 0, inside: 0, cd: 0, placed: 0, enters: 0, exits: 0, mig: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 220); };
  const LS = () => { try { return current && current.id ? 'glen_y24p_' + current.id : null; } catch (_) { return null; } };
  const met = () => { try {
    if (window.__c246b && __c246b.done) return true;
    if (current && current.c246 && current.c246.met) return true;
    if (current && localStorage.getItem('glen_met_' + current.id)) return true;
    return false;
  } catch (_) { return false; } };
  const crater = () => { try { const v = JSON.parse(localStorage.getItem('glen_115_' + (current && current.id)) || 'null'); return Array.isArray(v) && v.length >= 3 ? v : null; } catch (_) { return null; } };
  const topY = (x, z) => { try { return (typeof groundTop === 'function' ? groundTop(Math.floor(x), Math.floor(z)) : (typeof SEA === 'number' ? SEA : 41)) + 1; } catch (_) { return 42; } };
  const inChrome = () => !!(window.__c248 && __c248.y === 1);

  let gate = null, ret = null, hintT = 0;

  function saveUnlock(pos) {
    try {
      if (!current) return;
      current.c246 = Object.assign(current.c246 || {}, {met: 1, y24p: 1, pos: pos ? [pos[0], pos[1], pos[2]] : (current.c246 && current.c246.pos) || null});
      dirty = true;
      const k = LS(); if (k) localStorage.setItem(k, JSON.stringify({v: 1, pos: current.c246.pos}));
      U.unlocked = 1;
    } catch (e) { ERR('save', e); }
  }

  function loadUnlock() {
    try {
      let pos = null;
      if (current && current.c246 && current.c246.pos) pos = current.c246.pos;
      const k = LS(); if (!pos && k) { const o = JSON.parse(localStorage.getItem(k) || 'null'); if (o && o.pos) pos = o.pos; }
      const unlocked = !!(met() || (current && current.c246 && current.c246.y24p) || (k && localStorage.getItem(k)));
      U.unlocked = unlocked ? 1 : 0;
      return unlocked ? pos : null;
    } catch (e) { ERR('load', e); return null; }
  }

  function pickPos(near) {
    // Prefer crash crater, else provided near point, else pyramid rim
    let bx = null, bz = null;
    const c = crater();
    if (c) { bx = c[0]; bz = c[2]; }
    else if (near) { bx = near.x != null ? near.x : near[0]; bz = near.z != null ? near.z : near[2]; }
    else {
      try { const p = window.__c239 && __c239.pyr; if (p) { bx = p.cx + 10; bz = p.cz + 10; } } catch (_) {}
    }
    if (bx == null || bz == null) return null;
    // Offset to solid ground beside crater (not in the glowing pool centre)
    const candidates = [];
    for (let a = 0; a < 12; a++) {
      const ang = a / 12 * Math.PI * 2, r = 11 + (a % 3) * 2;
      const x = Math.floor(bx + Math.cos(ang) * r), z = Math.floor(bz + Math.sin(ang) * r);
      if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) continue;
      let gy;
      try { gy = topY(x, z); } catch (_) { continue; }
      let bad = 0;
      try { if (getB(x, gy - 1, z) === T.WATER || getB(x, gy - 1, z) === T.LAVA) bad += 5; if (!solid(x, gy - 1, z)) bad += 3; if (solid(x, gy, z) || solid(x, gy + 1, z)) bad += 4; } catch (_) {}
      candidates.push([bad, x + 0.5, gy, z + 0.5]);
    }
    candidates.sort((a, b) => a[0] - b[0]);
    if (!candidates.length) return [bx, topY(bx, bz), bz];
    return [candidates[0][1], candidates[0][2], candidates[0][3]];
  }

  function mkFrame(matOb, matFill) {
    const g = new THREE.Group(); g.userData.c255skip = 1; g.userData.y24p = 1;
    // Static obsidian-like frame (no animated emissive pulse)
    const post = (x, y, z, w, h, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matOb); m.position.set(x, y, z); m.castShadow = false; g.add(m); };
    post(-1.2, 1.5, 0, 0.35, 3.2, 0.35); post(1.2, 1.5, 0, 0.35, 3.2, 0.35);
    post(0, 3.2, 0, 2.8, 0.35, 0.35); post(0, 0.15, 0, 2.8, 0.3, 0.35);
    // Inner fill: flat translucent chrome-violet plane - constant opacity, no strobe
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.7), matFill);
    fill.position.set(0, 1.55, 0); fill.renderOrder = 2; g.add(fill);
    g.userData.fill = fill;
    // Small steady label plate
    try {
      const c = document.createElement('canvas'); c.width = 256; c.height = 64; const ctx = c.getContext('2d');
      ctx.fillStyle = '#0a0a12'; ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = '#c8d0e0'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';
      ctx.fillText('CHROME REALITY', 128, 28); ctx.font = '16px monospace'; ctx.fillText('YEAR 24000', 128, 50);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0.92}));
      sp.scale.set(2.4, 0.6, 1); sp.position.set(0, 3.7, 0); g.add(sp);
    } catch (_) {}
    g.traverse(o => { if (o.isMesh) { o.frustumCulled = false; } });
    return g;
  }

  function mats() {
    const ob = new THREE.MeshStandardMaterial({color: 0x1a1028, roughness: 0.85, metalness: 0.15, emissive: 0x0a0614, emissiveIntensity: 0.25});
    const fill = new THREE.MeshStandardMaterial({color: 0x6a7cff, roughness: 0.4, metalness: 0.55, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, emissive: 0x2233aa, emissiveIntensity: 0.35});
    return {ob, fill};
  }

  function placeAt(pos) {
    removeGate();
    if (!pos) return false;
    const {ob, fill} = mats();
    gate = mkFrame(ob, fill);
    gate.position.set(pos[0], pos[1], pos[2]);
    // Face roughly toward crater / pyramid if known
    try {
      const c = crater(); let tx = pos[0] + 1, tz = pos[2];
      if (c) { tx = c[0]; tz = c[2]; }
      else { const p = window.__c239 && __c239.pyr; if (p) { tx = p.cx; tz = p.cz; } }
      gate.rotation.y = Math.atan2(-(tx - pos[0]), -(tz - pos[2]));
    } catch (_) {}
    scene.add(gate); U.placed = 1; U.pos = pos.slice(); saveUnlock(pos); return true;
  }

  function removeGate() {
    if (!gate) return; scene.remove(gate); gate.traverse(o => { try { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); if (o.material) { if (o.material.map && o.material.map.dispose) o.material.map.dispose(); if (o.material.dispose) o.material.dispose(); } } catch (_) {} }); gate = null; U.placed = 0;
  }

  function placeReturn() {
    removeReturn();
    const {ob, fill} = mats();
    ret = mkFrame(ob, fill);
    ret.position.set(P.x, P.y, P.z - 2.5);
    ret.rotation.y = P.yaw + Math.PI;
    // Tint fill cooler so return is distinct but still static
    try { ret.userData.fill.material.color.setHex(0x88a0ff); ret.userData.fill.material.opacity = 0.5; } catch (_) {}
    scene.add(ret); U.ret = 1;
  }
  function removeReturn() {
    if (!ret) return; scene.remove(ret); ret.traverse(o => { try { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); if (o.material) { if (o.material.map && o.material.map.dispose) o.material.map.dispose(); if (o.material.dispose) o.material.dispose(); } } catch (_) {} }); ret = null; U.ret = 0;
  }

  function near(obj, r) {
    if (!obj) return false;
    try { return Math.hypot(P.x - obj.position.x, P.z - obj.position.z) < r && Math.abs(P.y - obj.position.y) < 3.2; } catch (_) { return false; }
  }

  function enter() {
    if (U.cd > 0 || inChrome() || !(window.__c248 && __c248.start24)) return false;
    if (!U.unlocked) return false;
    try {
      U.cd = 2.5; U.enters++;
      __c248.start24();
      U.inside = 1; placeReturn();
      try { toast('Chrome Reality - YEAR 24000. Use the return portal to come back.'); } catch (_) {}
      return true;
    } catch (e) { ERR('enter', e); return false; }
  }

  function exit() {
    if (U.cd > 0 || !inChrome() || !(window.__c248 && __c248.stop24)) return false;
    try {
      U.cd = 3.5; U.exits++;
      removeReturn();
      __c248.stop24();
      U.inside = 0;
      // Ensure player stands at gate if restore drifted
      try { if (U.pos) { P.x = U.pos[0]; P.y = U.pos[1]; P.z = U.pos[2]; } } catch (_) {}
      try { toast('Back in your own time.'); } catch (_) {}
      return true;
    } catch (e) { ERR('exit', e); return false; }
  }

  function tryUse() {
    if (!started || menuOpen || dead || DIM.cur) return false;
    if (inChrome()) { if (near(ret, 2.4)) return exit(); return false; }
    if (near(gate, 2.4)) return enter();
    return false;
  }
  U.use = tryUse; U.enter = enter; U.exit = exit; U.met = met; U.placeAt = placeAt;

  function unlockNear(nearPt) {
    U.unlocked = 1;
    const pos = pickPos(nearPt);
    if (!pos) { U.mig = 'met_no_anchor'; return false; } // met but no crater/pyramid known yet
    return placeAt(pos);
  }

  // Hook encounter end: unlock + place beside wreck
  try {
    const boot = setInterval(() => {
      try {
        if (!(window.__c246b && __c246b.begin)) return;
        clearInterval(boot);
        const endProbe = () => {
          // wrap leave toast path via polling done flag
        };
        let was = 0;
        setInterval(() => {
          try {
            const done = !!(__c246b.done); if (done && !was) {
              was = 1;
              let nearPt = null;
              try { const u = window.__c246 && __c246.ufo && __c246.ufo(); if (u && u.g) nearPt = u.g.position; } catch (_) {}
              if (!nearPt) { const c = crater(); if (c) nearPt = {x: c[0], y: c[1], z: c[2]}; }
              unlockNear(nearPt);
            }
            was = done ? 1 : was;
          } catch (e) { ERR('donePoll', e); }
        }, 400);
      } catch (e) { ERR('boot', e); }
    }, 300);
  } catch (e) { ERR('hook', e); }

  // World enter: migrate prior met saves
  try {
    const ew = enterWorld;
    enterWorld = function (save) {
      const r = ew.apply(this, arguments);
      try {
        removeReturn(); U.inside = 0; U.cd = 1.0;
        const pos = loadUnlock();
        if (U.unlocked) {
          if (pos) placeAt(pos);
          else {
            // Prior abduction known (glen_met / c246.met) but no stored portal spot: use crater or pyramid
            const ok = unlockNear(null);
            if (!ok) U.mig = 'prior_met_no_crater_or_pyramid';
            else U.mig = 'migrated';
          }
        } else removeGate();
      } catch (e) { ERR('ew', e); }
      return r;
    };
  } catch (e) { ERR('ew0', e); }

  // Persist through existing c246 serialize (augment)
  try {
    const se = serialize;
    serialize = function () {
      const d = se.apply(this, arguments);
      try {
        if (d && current) {
          current.c246 = Object.assign(current.c246 || {}, {met: current.c246 && current.c246.met || (met() ? 1 : 0), y24p: U.unlocked ? 1 : 0, pos: U.pos || (current.c246 && current.c246.pos) || null});
          d.c246 = current.c246;
        }
      } catch (_) {}
      return d;
    };
  } catch (e) { ERR('ser', e); }

  // useItem / LT path
  try {
    const ui = useItem;
    useItem = function () {
      try { if (tryUse()) { U.on++; return; } } catch (e) { ERR('use', e); }
      return ui.apply(this, arguments);
    };
  } catch (e) { ERR('ui', e); }

  // Walk-in volume + cooldown tick + hint
  try {
    const up = updatePlayer;
    updatePlayer = function (dt) {
      const r = up.apply(this, arguments);
      try {
        const d = Math.min(0.1, dt || 0.016);
        if (U.cd > 0) U.cd -= d;
        if (!started || menuOpen || dead || DIM.cur) return r;
        // Sync inside flag with chrome state
        if (inChrome() && !U.inside) { U.inside = 1; if (!ret) placeReturn(); }
        if (!inChrome() && U.inside) { U.inside = 0; removeReturn(); }
        if (U.cd <= 0) {
          if (!inChrome() && near(gate, 1.35)) enter();
          else if (inChrome() && near(ret, 1.35)) exit();
        }
        if ((near(gate, 3.5) || near(ret, 3.5)) && (hintT -= d) <= 0) {
          hintT = 4;
          try { toast(inChrome() ? 'Return portal - LT / USE / walk in' : 'Chrome Reality portal - LT / USE / walk in'); } catch (_) {}
        }
        if (gate) gate.visible = !DIM.cur && !inChrome();
      } catch (e) { ERR('up', e); }
      return r;
    };
  } catch (e) { ERR('up0', e); }

  // Controller / keyboard already hit useItem for LT; also allow KeyF near the portal (KeyE stays inventory)
  try {
    addEventListener('keydown', e => {
      try {
        if (!started || menuOpen) return;
        if (e.code === 'KeyF') tryUse();
      } catch (_) {}
    });
  } catch (_) {}
})();
