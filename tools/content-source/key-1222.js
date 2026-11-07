/* GLX-KEY1222 (v1.2.22): TIME BOX KEY. A key fob you start with (new worlds, and once in old saves, kept in the save so it is never given
   twice). Hold it and press LT (or right click / USE): it chirps like a car key and calls YOUR time box (the same one, its saved spots and
   name kept) to land beside you on flat, dry, open ground, never on you. It says why when it cannot: inside the box, flying it, another
   realm, no clear ground near you, or just called (short wait). Other items keep their LT action. */
(function key1222() {
  const U = window.__key1222 = {err: null, id: 0, given: 0, calls: 0, lands: 0, denied: 0, why: '', chirps: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const TB = () => window.__tbox, F = () => window.__tbox3, say = t => { try { toast(t); } catch (_) {} };
  // ---------- the item: first free id from 905 ----------
  try { let id = 905; while (NAMES[id] !== undefined && NAMES[id] !== 'Time Box Key') id++; U.id = id; IT.TBKEY = id; NAMES[id] = 'Time Box Key';
    if (!ORDER.includes(id)) ORDER.push(id); try { if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(id)) CREATIVE_ALL.push(id); } catch (_) {}
  } catch (e) { ERR('item', e); }
  U.icon = () => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#c9a54a'; g.beginPath(); g.arc(34, 34, 18, 0, 7); g.lineWidth = 8; g.strokeStyle = '#c9a54a'; g.stroke();
    const q = g.createLinearGradient(40, 40, 110, 110); q.addColorStop(0, '#2c6cc4'); q.addColorStop(1, '#123a78'); g.fillStyle = q; g.beginPath(); g.roundRect ? g.roundRect(46, 40, 52, 74, 12) : g.rect(46, 40, 52, 74); g.fill();
    g.strokeStyle = '#0a2148'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#e9f2ff'; g.fillRect(58, 52, 28, 6); g.fillStyle = '#9fd0ff'; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g.fillRect(58 + i * 15, 64 + j * 15, 12, 12);
    g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(72, 100, 6, 0, 7); g.fill(); return c.toDataURL('image/png'); };
  try { ICONS[U.id] = U.icon(); } catch (e) { ERR('icon', e); }
  let FOB = null; U.model = s => { if (!FOB) { const box = new THREE.BoxGeometry(0.5, 0.75, 0.16), ring = new THREE.TorusGeometry(0.18, 0.045, 6, 16);
      FOB = {box, ring, blue: new THREE.MeshStandardMaterial({color: 0x1f4e8c, roughness: 0.45, metalness: 0.15}), gold: new THREE.MeshStandardMaterial({color: 0xc9a54a, roughness: 0.3, metalness: 0.8}), lamp: new THREE.MeshBasicMaterial({color: 0xffe9a0})}; }
    const g = new THREE.Group(), b = new THREE.Mesh(FOB.box, FOB.blue), r = new THREE.Mesh(FOB.ring, FOB.gold), l = new THREE.Mesh(FOB.box, FOB.lamp);
    r.position.y = 0.5; l.scale.set(0.25, 0.12, 1.05); l.position.y = -0.24; g.add(b, r, l); g.scale.setScalar(s || 0.18); g.userData.__gs = null; return g; };
  try { const mi = makeItemMesh; makeItemMesh = function (id) { if (id === U.id) { try { const g = new THREE.Group(), m = U.model(0.16); m.rotation.set(0.3, 0.5, 0); g.add(m); g.userData.__gs = null; return g; } catch (e) { ERR('mi', e); } } return mi.apply(this, arguments); }; } catch (e) { ERR('miw', e); }
  // ---------- given once per world, saved with the world ----------
  U.give = () => { try { if (typeof started === 'undefined' || !started || typeof prog === 'undefined' || !prog) return false; if (prog.key1222) return false; prog.key1222 = 1; addItem(U.id, 1); U.given++; return true; } catch (e) { ERR('give', e); return false; } };
  setInterval(U.give, 1500);
  // ---------- car key chirp (made in code) ----------
  U.chirp = ok => { try { if (typeof AC === 'undefined' || !AC) return; const t = AC.currentTime + 0.01, out = master || AC.destination, beeps = ok ? [[2350, 0], [2350, 0.16]] : [[620, 0]];
      for (const [f, d] of beeps) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'square'; o.frequency.setValueAtTime(f, t + d); o.frequency.exponentialRampToValueAtTime(f * 1.08, t + d + 0.07);
        g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.09, t + d + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.11); o.connect(g); g.connect(out); o.start(t + d); o.stop(t + d + 0.13); }
      U.chirps++; } catch (e) { ERR('chirp', e); } };
  // ---------- safe landing beside you ----------
  let wat = null;
  const wet = (x, y, z) => { if (!wat) { wat = new Set(); for (const k of ['WATER', 'LAVA']) if (T[k] !== undefined) wat.add(T[k]); } return wat.has(getB(x, y, z)); };
  const sol = (x, y, z) => { const t = TB(); if (t) t.__raw = 1; try { return !!solid(x, y, z); } finally { if (t) t.__raw = 0; } };
  U.ok = (cx, gy, cz) => { for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const x = cx + dx, z = cz + dz; if (!sol(x, gy, z) || wet(x, gy, z)) return false; for (let y = gy + 1; y <= gy + 3; y++) if (sol(x, y, z) || wet(x, y, z)) return false; } return true; };
  U.spot = () => { const px = P.x, pz = P.z, py = Math.floor(P.y);
    for (const r of [3, 4, 5]) for (let k = 0; k < 16; k++) { const a = P.yaw + Math.PI / 2 + k * Math.PI / 8, cx = Math.floor(px + Math.sin(a) * r), cz = Math.floor(pz + Math.cos(a) * r);
      for (let gy = py; gy >= py - 3; gy--) { if (!sol(cx, gy, cz)) continue; if (U.ok(cx, gy, cz)) { const bx = cx + 0.5, bz = cz + 0.5; if (Math.hypot(bx - px, bz - pz) > 1.6 + 0.4 + 0.85) return [bx, gy + 1, bz]; } break; } }
    return null; };
  let last = -1e9, lastOk = -1e9;
  U.call = () => { const now = performance.now(); if (now - last < 400) return 'debounce'; last = now; U.calls++;
    const t = TB(), deny = w => { U.denied++; U.why = w; U.chirp(false); say(w); return w; };
    if (!t || !t.place) return deny('The time box is not here');
    if (typeof DIM !== 'undefined' && DIM.cur) return deny('The time box cannot reach you here');
    if (t.inside) return deny('You are already in the time box');
    if (F() && F().pilot) return deny('Land the time box first');
    if (now - lastOk < 3000) return deny('The time box is on its way');
    const s = U.spot(); if (!s) return deny('No clear flat ground here for the time box');
    if (t.S && t.S.on && Math.hypot(t.S.x - s[0], t.S.z - s[2]) < 0.5 && Math.abs(t.S.y - s[1]) < 0.5) { U.chirp(true); return 'here'; }
    t.place(s[0], s[1], s[2]); lastOk = now; U.lands++; U.chirp(true); say('Your time box lands beside you'); return 'landed'; };
  try { const ui = useItem; useItem = function () { if (typeof selId !== 'undefined' && selId === U.id && cnt(U.id) > 0) { if (menuOpen || paused || dead || !started) return; U.call(); return; } return ui.apply(this, arguments); }; } catch (e) { ERR('use', e); }
})();

/* GLX-UFO1222 (v1.2.22): the alien saucer leaves for good. After the encounter, once the aliens are aboard and the saucer takes off, it
   flies away and does not come back to patrol: no more night or desert visits in that world. Its state is kept as away (gone off world,
   saved with the world and in this browser), so a reload does not bring it back. The small desert tic-tacs are not this saucer and are
   not changed. The portal to YEAR 24000 after the visit is not changed. */
(function ufo1222() {
  const U = window.__ufo1222 = {err: null, departs: 0, refused: 0};
  const key = () => { try { return 'glen_ufoaway_' + current.id; } catch (_) { return null; } };
  U.away = () => { try { if (current && current.c246 && current.c246.away) return true; const k = key(); return !!(k && localStorage.getItem(k)); } catch (_) { return false; } };
  U.met = () => { try { return !!((window.__c246b && __c246b.done) || (current && (localStorage.getItem('glen_met_' + current.id) || (current.c246 && current.c246.met)))); } catch (_) { return false; } };
  U.blocked = () => { const b = U.away() || U.met(); if (b) U.refused++; return b; };
  U.depart = () => { try { U.departs++; const k = key(); if (k) localStorage.setItem(k, 'moon'); if (current) current.c246 = Object.assign(current.c246 || {}, {away: 'moon'}); } catch (e) { if (!U.err) U.err = String(e); } };
})();
