
/* ===================== GLX-C31 (v0.9.31): Minecraft-style offhand: slot, swap hands (F / D-pad left), held light, shields that block ===================== */
Object.assign(IT, {WSHIELD: 224, ISHIELD: 225});
Object.assign(NAMES, {224: 'Wooden shield', 225: 'Iron shield'});
const shieldIcon = (face, rim, boss) => drawIcon(g => { g.fillStyle = rim; g.beginPath(); g.moveTo(-22, -26); g.lineTo(22, -26); g.lineTo(22, 4); g.quadraticCurveTo(20, 22, 0, 30); g.quadraticCurveTo(-20, 22, -22, 4); g.closePath(); g.fill();
  g.fillStyle = face; g.beginPath(); g.moveTo(-17, -21); g.lineTo(17, -21); g.lineTo(17, 3); g.quadraticCurveTo(15, 18, 0, 24); g.quadraticCurveTo(-15, 18, -17, 3); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; for (const x of [-8, 0, 8]) { g.beginPath(); g.moveTo(x, -21); g.lineTo(x, 22); g.stroke(); } g.fillStyle = boss; g.beginPath(); g.arc(0, -2, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-3, -6, 3, 3); });
ICONS[224] = shieldIcon('#9a6a3a', '#5a3a1e', '#8a8e94'); ICONS[225] = shieldIcon('#b8bec6', '#5a6068', '#e8ecf0');
RECIPES.push(rc('Wooden shield', '6 Planks', 224, 1, [[T.PLANKS, 6]], 1), rc('Iron shield', '4 Iron ingots + 2 Planks', 225, 1, [[IT.IRONINGOT, 4], [T.PLANKS, 2]], 1));
if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(224, 225);
const SHIELD = {224: 0.6, [IT.TARGE]: 0.75, 225: 0.85};   // share of each blow a raised shield stops
var offhand = null;   // {id, n}
var shieldUp = 0, shieldHold = false, SHIELD_SIDE = 0.6, SHIELD_ROT = 0.9;
const OFF_LIGHT = new Set([T.TORCH, 161, 216]);
(function offhandMod() {
  // ---- inventory slot, next to the armour ----
  function slotEl() {
    let el = document.querySelector('[data-testid="armour-slot-offhand"]'); if (el) return el;
    const boots = document.querySelector('[data-testid="armour-slot-boots"]'); if (!boots) return null;
    el = boots.cloneNode(true); el.setAttribute('data-testid', 'armour-slot-offhand'); boots.parentNode.insertBefore(el, boots.nextSibling); return el;
  }
  window.updateOffhandSlot = function () {
    const el = slotEl(); if (!el) return; const id = offhand && offhand.id;
    el.querySelector('div').innerHTML = '<b>Offhand</b>' + (id ? NAMES[id] + (offhand.n > 1 ? ' \u00d7' + offhand.n : '') : 'Empty \u00b7 tap to hold selected');
    const i = el.querySelector('i'); i.className = id ? 'ic' + iconClass(id) : ''; i.setAttribute('style', id ? iconStyle(id) + ';background-size:cover;opacity:1' : ''); i.textContent = id ? '' : '\u{1F6E1}';
    el.onclick = () => {
      if (typeof cursor !== 'undefined' && cursor && cursor.id) { const c = cursor; const old = offhand; offhand = {id: c.id, n: c.n}; cursor = null; try { showCursor && showCursor(null); } catch (_) {} if (old) addItem(old.id, old.n); }
      else if (offhand) { addItem(offhand.id, offhand.n); offhand = null; }
      else if (selId && (MODE.infinite || cnt(selId) > 0)) { const n = MODE.infinite ? 1 : inv[selId]; offhand = {id: selId, n}; if (!MODE.infinite) inv[selId] = 0; }
      sfx('pop', .4); afterChange();
    };
  };
  function afterChange() { try { renderHotbar(); } catch (_) {} try { if (typeof renderInv === 'function') renderInv(); } catch (_) {} updateOffhandSlot(); offMesh(true); }
  const ua = updateArmourSlots; updateArmourSlots = function () { ua.apply(this, arguments); updateOffhandSlot(); };
  // ---- swap hands ----
  window.swapHands = function () {
    if (!started || dead || paused) return;
    const main = selId && (MODE.infinite || cnt(selId) > 0) ? {id: selId, n: MODE.infinite ? 1 : inv[selId]} : null;
    const old = offhand;
    if (main && !MODE.infinite) inv[main.id] = 0;
    offhand = main;
    if (old) { if (!MODE.infinite) addItem(old.id, old.n); selId = old.id; if (MODE.hotbar && MODE.infinite && !MODE.hotbar.includes(old.id)) MODE.hotbar[MODE.hotbar.indexOf(main ? main.id : -1) >= 0 ? MODE.hotbar.indexOf(main.id) : 0] = old.id; }
    sfx('pop', .5); afterChange();
  };
  addEventListener('keydown', e => { if (e.code === 'KeyF' && started && !menuOpen && !e.repeat) { e.stopImmediatePropagation(); e.preventDefault(); swapHands(); } if (e.code === 'KeyG' && started && !menuOpen && !e.repeat) eat(); }, true);
  // ---- first-person left hand ----
  const offG = new THREE.Group(); camera.add(offG);
  const offArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.55), sleeveMat); offArm.position.set(0, 0, 0.12); offG.add(offArm);
  const offItem = new THREE.Group(); offItem.position.set(0, 0.04, -0.24); offG.add(offItem);
  let offKey = '', off3p = null;
  function shieldMesh(id) {
    const g = new THREE.Group(); const t = new THREE.TextureLoader().load(ICONS[id]); t.encoding = THREE.sRGBEncoding;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshLambertMaterial({map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide})); g.add(face);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.36, 0.025), new THREE.MeshLambertMaterial({color: id === 225 ? 0x6a7078 : 0x5a3a1e})); back.position.z = -0.016; g.add(back); g.userData.shield = true; return g;
  }
  function offMesh(force) {
    const id = offhand && offhand.id, k = String(id || 0);
    if (!force && k === offKey && (!offhand || off3p || !worldModel)) return; offKey = k;
    while (offItem.children.length) offItem.remove(offItem.children[0]);
    if (off3p && off3p.parent) off3p.parent.remove(off3p); off3p = null;
    offG.visible = !!id; if (!id) return;
    const m = SHIELD[id] ? shieldMesh(id) : makeItemMesh(id);
    if (SHIELD[id]) { m.rotation.set(0, 0.35, 0); m.position.set(0.05, 0.05, -0.04); }
    offItem.add(m);
    if (worldModel && worldModel.userData.arms && worldModel.userData.arms[0] && worldModel.userData.arms[0].userData.grip) {
      off3p = SHIELD[id] ? shieldMesh(id) : makeItemMesh(id); if (SHIELD[id]) { off3p.rotation.set(0, SHIELD_ROT, 0); off3p.position.set(SHIELD_SIDE, 0.95, 0.02); off3p.scale.setScalar(1.6); worldModel.add(off3p); } else { if (off3p.userData.tool) off3p.rotation.set(-Math.PI / 2, 0, Math.PI / 2); off3p.scale.setScalar(1.6); worldModel.userData.arms[0].userData.grip.add(off3p); }
    }
  }
  window.__offMesh = offMesh;
  // ---- blocking input: right click / LT / USE button held with a shield in the offhand, when the main hand has nothing to place or use ----
  let rmb = false, lt = false, tb = false;
  addEventListener('mousedown', e => { if (e.button === 2) rmb = true; }); addEventListener('mouseup', e => { if (e.button === 2) rmb = false; });
  addEventListener('blur', () => { rmb = lt = tb = false; });
  const bp = document.getElementById('bPlace'); if (bp) { bp.addEventListener('pointerdown', () => tb = true); for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) bp.addEventListener(ev, () => tb = false); }
  const mainUsable = () => { const s = selId; if (!s || !(MODE.infinite || cnt(s) > 0)) return false; return PLACEABLE.has(s) || !!FOOD[s] || !!(typeof GUN !== 'undefined' && GUN[s]) || (TOOL[s] && TOOL[s][0] === 'hoe') || [IT.BUCKET, IT.WATERB, IT.FLINTSTEEL, IT.BREW, IT.IRONBREW, IT.WSEEDS, IT.FLARE, 201, 219].includes(s); };
  window.isBlocking = () => shieldUp > 0.6;
  // ---- damage: a raised shield turns aside most of a blow from the front ----
  const hu = hurt;
  hurt = function (n, cause) {
    if (shieldUp > 0.6 && offhand && SHIELD[offhand.id] && !dead && !MODE.noDamage && invuln <= 0 && !/fell|drown|lava|burn|fire|starv|void/i.test(String(cause || ''))) {
      n = n * (1 - SHIELD[offhand.id]); sfx('armour', 0.9); shake(0.04, 0.004);
      if (n < 0.5) { invuln = 0.4; return; }
    }
    return hu.call(this, n, cause);
  };
  // ---- per frame: input, raise animation, held light ----
  const ul = updateLights;
  updateLights = function (dt) {
    ul.apply(this, arguments);
    if (!offhand && !worldModel) { offG.visible = false; }
    offMesh(false);
    let pad = false; try { const gp = pickPad(); pad = !!(gp && gp.buttons[6] && (gp.buttons[6].pressed || gp.buttons[6].value > 0.4)); } catch (_) {}
    shieldHold = !!(offhand && SHIELD[offhand.id]) && started && !paused && !menuOpen && !dead && (rmb || pad || tb) && !mainUsable();
    shieldUp += ((shieldHold ? 1 : 0) - shieldUp) * Math.min(1, dt * 10);
    offG.visible = !!offhand && hand.visible && camera.children.includes(hand);
    const k = shieldUp, b = Math.sin(performance.now() / 260) * 0.012;
    offG.position.set(-0.44 + k * 0.2, -0.42 + b + k * 0.16, -0.55 + k * 0.05); offG.rotation.set(k * 0.05, -k * 0.35, 0);
    // third person: carried items held out a little so they show from behind (Minecraft pose), shield raised forward when blocking
    if (worldModel && worldModel.userData.arms) { const [la, ra] = worldModel.userData.arms; if (off3p && SHIELD[offhand && offhand.id]) { off3p.position.z = 0.02 + k * 0.3; off3p.rotation.y = SHIELD_ROT * (1 - k); } if (typeof heldMesh3p !== 'undefined' && heldMesh3p && heldMesh3p.parent && false) { }
      if (typeof heldMesh3p !== 'undefined' && heldMesh3p && heldMesh3p.userData.side) { const sw = Math.max(0, swingT || 0) / (swingDur || 0.3); heldMesh3p.position.set(-0.56, 0.95 + sw * 0.3, 0.1); if (heldMesh3p.userData.tool) heldMesh3p.rotation.set(-2.5 + sw * 1.4, 0, Math.PI / 2); } }
    // offhand torch / lantern lights the way like a held one
    if (offhand && OFF_LIGHT.has(offhand.id) && started && !dead) {
      handLight.userData.k = (handLight.userData.k || 0) + (1 - (handLight.userData.k || 0)) * Math.min(1, dt * 8);
      const now = performance.now() / 1000; handLight.intensity = handLight.userData.k * (1.6 + Math.sin(now * 13) * 0.08);
      const d = lookDir(); handLight.position.set(P.x + d[0] * 0.6 - Math.cos(P.yaw) * 0.3, P.y + EYE - 0.25, P.z + d[2] * 0.6 + Math.sin(P.yaw) * 0.3);
    }
  };
  // ---- saves ----
  const se = serialize; serialize = function () { const d = se.apply(this, arguments); if (d && offhand) d.offhand = [offhand.id, offhand.n]; return d; };
  // a world load (not yet started) takes the saved offhand; dimension crossings keep what you are holding
  const ap = applySave; applySave = function (d) { const fresh = !started; const r = ap.apply(this, arguments); if (d && fresh) offhand = d.offhand && d.offhand[0] ? {id: d.offhand[0], n: d.offhand[1] || 1} : null; try { updateOffhandSlot(); offMesh(true); } catch (_) {} return r; };
  const ew = enterWorld; enterWorld = function (save) { if (!save) offhand = null; return ew.apply(this, arguments); };
})();
