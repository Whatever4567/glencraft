/* GLX-C319 (v1.1.28): faster falling and the Golden Jetpack.
   - Falling: gravity pulls harder once you are really falling, up to a terminal speed of 110 blocks a second. Fall damage is still worked out
     from the height of the fall exactly as before (no one-shots added), and space falls stay soft.
   - Golden Jetpack: ten times the speed of the normal jetpack, a gold model on your back and a gold HD icon. It is put in your inventory once,
     in new worlds and in old saves, and it is in the creative inventory. It uses the normal jetpack code with the speed raised. */
(function c319() {
  const U = window.__c319 = {GJ: 777, given: 0, err: null};
  const GJ = U.GJ, JET = IT.JETPACK;
  try {
    IT.GOLDJET = GJ; NAMES[GJ] = 'Golden Jetpack'; ARMOUR[GJ] = {slot: 4, mat: 'gjet', pts: 3}; ARMOUR_COL.gjet = 0xf2c440; MATCOL.gjet = '#f2c440';
    if (!ORDER.includes(GJ)) ORDER.push(GJ); try { if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(GJ)) CREATIVE_ALL.push(GJ); } catch (_) {}
    try { RECIPES.push(rc('Golden Jetpack', '1 Jetpack, 8 Gold ingots', GJ, 1, [[JET, 1], [IT.GOLDINGOT || IT.GOLD || JET, 8]], 1)); } catch (_) {}
  } catch (e) { U.err = String(e); }
  // ---------- gold icon: the HD jetpack icon tinted gold ----------
  function icon() { const src = ICONS[JET]; if (!src) return; const im = new Image(); im.onload = () => { try { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
      g.drawImage(im, 0, 0, 256, 256); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ffc93a'; g.fillRect(0, 0, 256, 256); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(90,60,0,0.35)'; g.fillRect(0, 0, 256, 256);
      g.globalCompositeOperation = 'destination-in'; g.drawImage(im, 0, 0, 256, 256); ICONS[GJ] = c.toDataURL('image/png'); U.icon = 1; try { renderHotbar(); } catch (_) {} } catch (e) { U.err = String(e); } }; im.src = src; }
  ICONS[GJ] = ICONS[JET]; let tries = 0; const iv = setInterval(() => { if ((window.__c115 && __c115.done) || ++tries > 40) { clearInterval(iv); icon(); } }, 250);
  // ---------- the jetpack code runs as the normal jetpack, then the gold one is put back ----------
  const gold = () => armour[4] === GJ;
  const swap = (f, self, args) => { armour[4] = JET; try { return f.apply(self, args); } finally { armour[4] = GJ; } };
  const GM = new THREE.MeshStandardMaterial({color: 0xf2c440, metalness: 0.9, roughness: 0.28, emissive: 0x3a2800}), GD = new THREE.MeshStandardMaterial({color: 0xb8860b, metalness: 0.85, roughness: 0.35});
  try { const dm = dressModel; dressModel = function (model) { if (!gold() || !model) return dm.apply(this, arguments); const r = swap(dm, this, arguments);
      try { for (const o of model.userData.armourParts || []) if (o.isMesh && !o.userData.jetFlame && o.material && o.material.isMeshLambertMaterial) o.material = o.material.color.getHex() === 0x8a9098 ? GM : GD; } catch (_) {} return r; }; } catch (e) { U.err = String(e); }
  try { const hu = hurt; hurt = function () { if (gold()) return swap(hu, this, arguments); return hu.apply(this, arguments); }; } catch (_) {}
  // still no one-shots from a fall: a long fall always leaves you at least half a heart
  try { const h2 = hurt; hurt = function (n, why) { try { if (/fall/i.test(String(why || '')) && !/out of the world/i.test(String(why || '')) && hp > 1 && n >= hp) n = hp - 1; } catch (_) {} return h2.apply(this, [n, why].concat([].slice.call(arguments, 2))); }; } catch (_) {}
  /* installed late so it wraps every other jetpack wrapper (some are added after load) */
  const wrapUp = () => { try { const up = updatePlayer; updatePlayer = function (dt, mx, mz) {
      if (!gold() || (MODE.fly && flying)) { const r = up.apply(this, arguments); fall(dt); return r; }
      const x0 = P.x, z0 = P.z, v0 = P.vy, r = swap(up, this, arguments);
      try { const S = window.__c102j; if (!P.onGround && !swimming) { const dx = P.x - x0, dz = P.z - z0; if (Math.hypot(dx, dz) < 3) { moveAxis(dx * 9, 0); moveAxis(0, dz * 9); } }
        if (S && S.boost) { const vm = P.y > H ? Math.min(700, 120 + (P.y - H) * 1.2) : 120; P.vy = Math.min(vm, Math.max(P.vy, v0) + 52 * 9 * dt); }   /* v1.1.30: the normal jetpack cap no longer holds the gold one back, so it really climbs ten times faster */ } catch (_) {}
      return r; }; U.wrapped = 1; } catch (e) { U.err = String(e); } }; setTimeout(wrapUp, 2500);
  // ---------- low gravity on the Moon (1/6 g) and Mars (0.38 g): floaty jumps, slow falls ----------
  const LG = {moon: 1 / 6, mars: 0.38}; U.lowG = 0;
  function lowG(dt) { try { if (P.onGround || swimming || (MODE.fly && flying) || !window.__c318) return false; const b = __c318.near(window.__c321 ? __c321.pw() : P, 50), g = b && LG[b.id]; if (!g) return false;
      P.vy += 24 * dt * (1 - g); if (P.vy < -30 * g * 2) P.vy = -30 * g * 2; U.lowG = g; return true; } catch (_) { return false; } }
  U.lowGTest = lowG;
  // ---------- faster falling ----------
  function fall(dt) { try { if (lowG(dt)) return; if (P.onGround || swimming || armour[4] === JET || (MODE.fly && flying) || (window.__c309 && __c309.on) || (window.__c299 && __c299.on) || DIM.busy) return;
      if (P.vy < -6) { P.vy -= 22 * dt; if (P.vy < -110) P.vy = -110; } } catch (_) {} }
  // ---------- given once, in new worlds and old saves ----------
  try { const se = serialize; serialize = function () { const o = se.apply(this, arguments); try { if (o && U.given) o.c319g = 1; } catch (_) {} return o; }; } catch (_) {}
  try { const ew = enterWorld; enterWorld = function (save) { const r = ew.apply(this, arguments); U.given = save && save.c319g ? 1 : 0;
      if (!U.given) { let n = 0; const t = setInterval(() => { if (++n > 200) clearInterval(t); if (typeof started === 'undefined' || !started) return; clearInterval(t);
          try { if (cnt(GJ) <= 0 && armour[4] !== GJ) addItem(GJ, 1); U.given = 1; renderHotbar(); toast('You have a Golden Jetpack: wear it in the jetpack slot, ten times the speed'); } catch (e) { U.err = String(e); } }, 150); }
      return r; }; } catch (e) { U.err = String(e); }
})();
