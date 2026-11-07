/* GLX-EQ1222 (v1.2.22): armour slots, jetpacks, drink icons, baked tattie model.
   - Tapping Helmet, Chest, Legs or Boots wears the best one you own for that slot (most protection points, then the longer lasting
     material). The one you had on goes back into your inventory. If you already wear the best, tapping takes it off as before.
   - The Jetpack slot wears the normal white Jetpack only (a Golden Jetpack you wear goes back to your inventory). The white Jetpack
     climbs, glides and steers twice as fast as before; the Golden Jetpack is unchanged. New worlds start with the white one, not the gold.
   - Slot icons: helmet, chest, legs, boots, jetpack and an open hand for the offhand.
   - Drinks (ids from the source: 119 Brew, 121 Iron Brew): the orange and blue IRN can icon was drawn on Brew, so it moves to Iron Brew,
     and Brew gets a beer yellow glass. Held and dropped looks follow the icon caches.
   - Baked tattie (id 85): a small shared 3D model for the hand and for dropped ones, with painted skin, a split, fluffy inside and butter.
     Textures are 512 pixels (256 on phones) and the icon 256, not 4K. */
(function eq1222() {
  const U = window.__eq1222 = {err: null, equips: 0, gjBlocked: 0, tatN: 0, jet2: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const JET = 291, GJ = 777, BREW = 119, IRN = 121, TAT = 85, SLOTS = ['helmet', 'chest', 'legs', 'boots'];
  const DUR = {leather: 5, copper: 11, gold: 7, iron: 15, chain: 15, diamond: 33, netherite: 37};
  U.rank = id => { const a = ARMOUR[id]; return a ? (a.pts || 0) * 100 + (DUR[a.mat] || 0) : -1; };
  U.best = s => { let b = 0; for (const k in inv) { const id = +k; const a = ARMOUR[id]; if (!a || a.slot !== s || !(cnt(id) > 0)) continue; if (!b || U.rank(id) > U.rank(b)) b = id; } return b; };
  U.slotTap = s => { const cur = armour[s], b = U.best(s);
    if (b && (!cur || U.rank(b) > U.rank(cur))) { equipArmour(b); U.equips++; return 'equip'; }
    if (cur) { unequip(s); return 'off'; } try { toast('You have no ' + ['helmet', 'chest armour', 'leg armour', 'boots'][s] + ' to wear'); } catch (_) {} return 'none'; };
  U.jetTap = () => { const cur = armour[4]; if (cur === JET) { unequip(4); return 'off'; }
    if (cnt(JET) > 0) { equipArmour(JET); U.equips++; return 'white'; }
    if (cur) { unequip(4); return 'off'; } try { toast('You have no Jetpack to wear'); } catch (_) {} return 'none'; };
  // taps (mouse, touch and controller A all send click): caught before the older slot handlers
  try { document.addEventListener('click', e => { const el = e.target && e.target.closest && e.target.closest('[data-testid^="armour-slot-"]'); if (!el) return; const n = el.dataset.testid.slice(12), s = SLOTS.indexOf(n);
      if (s < 0 && n !== 'jetpack') return; e.stopImmediatePropagation(); e.preventDefault(); try { if (s >= 0) U.slotTap(s); else U.jetTap(); } catch (er) { ERR('tap', er); } }, true); } catch (e) { ERR('click', e); }
  const ICON = {helmet: '\u26D1', chest: '\uD83D\uDEE1', legs: '\uD83D\uDC56', boots: '\uD83E\uDD7E', jetpack: '\uD83D\uDE80', offhand: '\u270B'};
  U.icons = () => { for (const n in ICON) { const el = document.querySelector('[data-testid="armour-slot-' + n + '"]'); if (!el) continue; const i = el.querySelector('i'); if (!i) continue; const worn = n === 'offhand' ? !!(typeof offhand !== 'undefined' && offhand && offhand.id) : !!armour[n === 'jetpack' ? 4 : SLOTS.indexOf(n)];
      if (!worn && i.textContent !== ICON[n]) i.textContent = ICON[n]; el.setAttribute('aria-label', n); } };
  try { const ua = updateArmourSlots; updateArmourSlots = function () { const r = ua.apply(this, arguments); try { U.icons(); } catch (e) { ERR('ic', e); } return r; }; } catch (e) { ERR('uaw', e); }
  try { if (typeof window.updateOffhandSlot === 'function') { const uo = window.updateOffhandSlot; window.updateOffhandSlot = function () { const r = uo.apply(this, arguments); try { U.icons(); } catch (_) {} return r; }; } } catch (_) {}
  // white jetpack twice as fast: one more climb step to twice the climb cap and the same again of air steering, after the jetpack code ran
  try { const up = updatePlayer; updatePlayer = function (dt, mx, mz) { const r = up.apply(this, arguments); try { const S = window.__c102j;
        if (armour[4] === JET && S && !(MODE.fly && flying) && !swimming) { const d = Math.min(0.1, dt || 0);
          if (S.boost) { const vm = P.y > H ? Math.min(70, 12 + (P.y - H) * 0.12) : 12; P.vy = Math.min(vm * 2, P.vy + 52 * d); U.jet2++; }
          if (!P.onGround && S.air > 0.15 && (mx || mz)) { const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw); let dx = rx * (mx || 0) + fx * (mz || 0), dz = rz * (mx || 0) + fz * (mz || 0); const l = Math.hypot(dx, dz); if (l > 1) { dx /= l; dz /= l; } moveAxis(dx * 17.5 * d, 0); moveAxis(0, dz * 17.5 * d); } } } catch (e) { ERR('jet', e); } return r; }; } catch (e) { ERR('upw', e); }
  // new worlds: no Golden Jetpack grant (a gold one you already own is never touched)
  let blockGJ = 0;
  try { const ew = enterWorld; enterWorld = function (save) { blockGJ = !save ? 1 : 0; return ew.apply(this, arguments); }; } catch (e) { ERR('ew', e); }
  try { const ai = addItem; addItem = function (id, n) { if (id === GJ && blockGJ && n === 1 && cnt(GJ) <= 0) { blockGJ = 0; U.gjBlocked++; U.skipToast = 1; return; } return ai.apply(this, arguments); }; } catch (e) { ERR('ai', e); }
  try { const to = toast; toast = function (m) { if (U.skipToast && /Golden Jetpack: wear it/.test(String(m))) { U.skipToast = 0; return; } return to.apply(this, arguments); }; } catch (e) { ERR('to', e); }
  // ---- icons ----
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent);
  const setI = (id, url) => { try { if (window.__c121 && __c121.setIcon) __c121.setIcon(id, url); } catch (_) {} ICONS[id] = url; try { delete ICON_KEY[id]; } catch (_) {} try { delete spriteMats[id]; } catch (_) {} try { if (window.__c120ICO) __c120ICO[id] = url; } catch (_) {} try { const C = window.__c122; if (C && C.MODEL) C.MODEL[id] = url; } catch (_) {} };
  function cvs(n) { const c = document.createElement('canvas'); c.width = c.height = n; return c; }
  U.brewIcon = () => { const c = cvs(256), g = c.getContext('2d'); g.translate(128, 128); g.scale(2.4, 2.4);
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(0, 40, 26, 5, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-24, -34); g.lineTo(24, -34); g.lineTo(20, 40); g.lineTo(-20, 40); g.closePath(); g.fillStyle = 'rgba(230,240,245,.35)'; g.fill();
    const L = g.createLinearGradient(-22, 0, 22, 0); L.addColorStop(0, '#b97a0c'); L.addColorStop(0.35, '#f2b829'); L.addColorStop(0.55, '#ffd862'); L.addColorStop(1, '#a8680a'); g.fillStyle = L;
    g.beginPath(); g.moveTo(-22.6, -20); g.lineTo(22.6, -20); g.lineTo(19.6, 38); g.lineTo(-19.6, 38); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,250,220,.8)'; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(-16 + (i * 37 % 32), 34 - (i * 53 % 50), 0.9 + (i % 3) * 0.4, 0, 7); g.fill(); }
    g.fillStyle = '#fffaf0'; g.beginPath(); g.moveTo(-24, -20); for (let x = -24; x <= 24; x += 8) g.arc(x, -24, 6, Math.PI, 0); g.lineTo(24, -20); g.closePath(); g.fill(); g.fillStyle = '#f0e6cc'; g.fillRect(-23, -22, 46, 3);
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-24, -34); g.lineTo(-20, 40); g.lineTo(20, 40); g.lineTo(24, -34); g.stroke(); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(-16, -14, 3, 48);
    return c.toDataURL('image/png'); };
  U.tatIcon = () => { const c = cvs(256), g = c.getContext('2d'); g.translate(128, 136);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 70, 96, 16, 0, 0, 7); g.fill();
    const sk = g.createRadialGradient(-30, -30, 10, 0, 0, 110); sk.addColorStop(0, '#b07a44'); sk.addColorStop(0.6, '#7a4a22'); sk.addColorStop(1, '#4a2a10'); g.fillStyle = sk; g.beginPath(); g.ellipse(0, 10, 104, 66, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(40,20,5,.35)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(-90 + (i * 47 % 180), -30 + (i * 29 % 80), 2 + (i % 3), 0, 7); g.fill(); }
    const fl = g.createRadialGradient(0, -6, 4, 0, 0, 60); fl.addColorStop(0, '#fff6d2'); fl.addColorStop(0.7, '#f2dc98'); fl.addColorStop(1, '#c9a860'); g.fillStyle = fl; g.beginPath(); g.ellipse(0, -2, 70, 30, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(200,170,100,.5)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.arc(-56 + (i * 41 % 112), -18 + (i * 23 % 34), 2, 0, 7); g.fill(); }
    g.fillStyle = '#ffe066'; g.beginPath(); g.moveTo(-20, -26); g.lineTo(18, -30); g.lineTo(24, -6); g.lineTo(-14, -2); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(-12, -24, 20, 4);
    g.fillStyle = '#4c8a2a'; for (const [x, y] of [[-40, -8], [40, -4], [30, -20], [-30, -22]]) { g.fillRect(x, y, 6, 3); }
    return c.toDataURL('image/png'); };
  U.applyIcons = () => { if (typeof ICONS === 'undefined') return 0; let n = 0;   // the IRN can itself now goes to Iron Brew in GLX-C121 (build patch)
    if (!U._brew) U._brew = U.brewIcon(); if (ICONS[BREW] !== U._brew) { setI(BREW, U._brew); n++; }
    if (!U._tat) U._tat = U.tatIcon(); if (ICONS[TAT] !== U._tat) { setI(TAT, U._tat); n++; }
    U.iconSets = (U.iconSets || 0) + n; return n; };
  { let t = 0, st = 0; const iv = setInterval(() => { try { st = U.applyIcons() ? 0 : st + 1; } catch (e) { ERR('apply', e); } if (++t > 120 || st >= 10) clearInterval(iv); }, 1000); }
  // ---- baked tattie 3D (one shared set of geometry and materials) ----
  let TM = null;
  function tatParts() { if (TM) return TM; const N = PH ? 256 : 512, mk = f => { const c = cvs(N), g = c.getContext('2d'); f(g, N); const t = new THREE.CanvasTexture(c); try { t.encoding = THREE.sRGBEncoding; } catch (_) {} return t; };
    const skin = mk((g, N) => { g.fillStyle = '#7a4a22'; g.fillRect(0, 0, N, N); for (let i = 0; i < 900; i++) { const x = (i * 97 % N), y = (i * 61 % N); g.fillStyle = ['rgba(150,100,55,.5)', 'rgba(60,34,12,.5)', 'rgba(110,70,35,.6)'][i % 3]; g.beginPath(); g.arc(x, y, N / 256 * (1 + i % 4), 0, 7); g.fill(); } g.strokeStyle = 'rgba(40,20,6,.5)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.moveTo(i * 13 % N, i * 31 % N); g.lineTo((i * 13 + 20) % N, (i * 31 + 8) % N); g.stroke(); } });
    const flesh = mk((g, N) => { g.fillStyle = '#f4e2a8'; g.fillRect(0, 0, N, N); for (let i = 0; i < 1400; i++) { g.fillStyle = i % 2 ? 'rgba(255,250,225,.6)' : 'rgba(205,175,110,.4)'; g.beginPath(); g.arc(i * 53 % N, i * 89 % N, N / 256 * (1.5 + i % 3), 0, 7); g.fill(); } });
    TM = {sk: new THREE.SphereGeometry(0.5, 16, 12), fl: new THREE.SphereGeometry(0.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), bu: new THREE.BoxGeometry(0.22, 0.05, 0.18), ch: new THREE.BoxGeometry(0.03, 0.012, 0.012),
      mSk: new THREE.MeshLambertMaterial({map: skin}), mFl: new THREE.MeshLambertMaterial({map: flesh}), mBu: new THREE.MeshLambertMaterial({color: 0xffe066, emissive: 0x332200}), mCh: new THREE.MeshLambertMaterial({color: 0x4c8a2a})};
    for (const k in TM) if (TM[k].isBufferGeometry) TM[k].userData.shared = 1; U.texN = N; return TM; }
  U.tattie = size => { const p = tatParts(), g = new THREE.Group(), s = size || 0.16;
    const sk = new THREE.Mesh(p.sk, p.mSk); sk.scale.set(s * 1.5, s * 0.85, s); g.add(sk);
    const fl = new THREE.Mesh(p.fl, p.mFl); fl.scale.set(s * 1.05, s * 0.32, s * 0.5); fl.position.y = s * 0.33; g.add(fl);
    const bu = new THREE.Mesh(p.bu, p.mBu); bu.scale.setScalar(s * 2.2); bu.position.y = s * 0.47; bu.rotation.y = 0.4; g.add(bu);
    for (const [x, z] of [[-0.35, 0.05], [0.3, -0.05], [0.12, 0.1]]) { const c = new THREE.Mesh(p.ch, p.mCh); c.scale.setScalar(s * 2.2); c.position.set(x * s * 2, s * 0.44, z * s * 2); g.add(c); }
    g.userData.tat1222 = 1; g.userData.__gs = null; U.tatN = (U.tatN || 0) + 1; return g; };
  try { const mi = makeItemMesh; makeItemMesh = function (id) { if (id === TAT) { try { const g = new THREE.Group(); const t = U.tattie(0.07); t.rotation.set(0.35, 0.6, 0); g.add(t); g.userData.__gs = null; return g; } catch (e) { ERR('mi', e); } } return mi.apply(this, arguments); }; } catch (e) { ERR('miw', e); }
  try { const di = dropItem; dropItem = function (id, n) { const r = di.apply(this, arguments); try { if (id === TAT && n) { const d = drops[drops.length - 1]; if (d && d.id === TAT && d.m && d.m.isSprite) { const g = U.tattie(0.16); g.position.copy(d.m.position); scene.remove(d.m); scene.add(g); d.m = g; } } } catch (e) { ERR('drop', e); } return r; }; } catch (e) { ERR('diw', e); }
})();
