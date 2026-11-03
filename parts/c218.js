/* ===================== GLX-C218 (v1.0.45): RS (right stick click) = smart pick tool; the Snaw Yeti - the mountain beast is now a gentle shaggy yeti that never attacks,
   with a soft low grumble, met only rarely up on the snowy peaks. ===================== */
(function c218() {
  const U = window.__c218 = {err: null, picks: 0, last: null, yetis: 0, grum: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e); };
  // ---------------- 1) smart pick tool ----------------
  const nm = id => String(NAMES[id] || '');
  const have = id => id && (MODE.infinite || cnt(id) > 0);
  const own = () => { const s = new Set(); try { for (const k in inv) if (inv[k] > 0) s.add(+k); } catch (_) {} try { for (const id of (MODE.hotbar || [])) if (id) s.add(id); } catch (_) {} return [...s].filter(have); };
  const tools = (kind, minLv) => own().filter(id => TOOL[id] && TOOL[id][0] === kind && TOOL[id][1] >= (minLv || 0));
  const best = (list, key) => list.sort((a, b) => key(b) - key(a))[0] || 0;
  const ammo = id => { try { if (MODE.infinite) return true; if (window.gunMag && gunMag[id] > 0) return true; for (const k in inv) if (inv[k] > 0 && /bullet|cartridge|shot\b/i.test(nm(+k))) return true; } catch (_) {} return false; };
  function kindOf(b) { const n = nm(b).toLowerCase();
    if (b === T.WATER || b === T.LAVA || /^(water|lava)$/.test(n)) return 'bucket';
    if (LEAFY[b] || b === T.COBWEB || /leaves|wool|cobweb|web|blossom|tall grass|fern|vine/.test(n)) return 'shears';
    if (LOGGY[b] || /log|plank|wood|oak|pine|birch|rowan|alder|yew|hawthorn|table|chest|door|fence|ladder|bookshelf|barrel|sign|trapdoor/.test(n)) return 'axe';
    if (b === T.FARM || /wheat|crop|tattie|potato|neep|carrot|barley|oats|seedling/.test(n)) return 'hoe';
    if (/^(grass|dirt|sand|gravel|snow|clay|mud|peat|podzol|farmland|coarse dirt|path|soul sand)|snow|mud|clay|gravel|peat|podzol/.test(n) && !/stone|brick/.test(n)) return 'shovel';
    if (/stone|ore|cobble|brick|slate|granite|marble|obsidian|basalt|tile|rock|ice|furnace|anvil|lantern|blackstone|quartz/.test(n) || (REQ[b] || 0) > 0 || (HARD[b] || 0) >= 1.5) return 'pick';
    return null; }
  function choose() {
    // a hostile mob in the crosshair: a loaded gun, else the best sword
    let mob = null; try { mob = reachMob(24); } catch (_) {}
    if (mob && mob.hostile && mob.kind !== 'clansman' && !mob.tame) { const g = own().filter(id => GUN[id] && ammo(id)); if (g.length) return [best(g, id => GUN[id].dmg), 'gun'];
      const s = tools('sword'); if (s.length) return [best(s, id => TOOL[id][3]), 'sword']; return [0, 'a sword or a loaded gun']; }
    let r = null; try { r = raycast(8, false, true); } catch (_) {} if (!r || !r.hit) return [0, null];
    const b = getB(...r.hit), k = kindOf(b); if (!k) return [0, null];
    if (k === 'bucket') { const l = own().filter(id => id === IT.BUCKET); return [l[0] || 0, 'a bucket']; }
    if (k === 'shears') { if (have(IT.SHEARS)) return [IT.SHEARS, 'shears']; const s = tools('sword'); return [best(s, id => TOOL[id][3]), 'shears or a sword']; }
    if (k === 'pick') { const need = REQ[b] || 0, l = tools('pick', need); return [best(l, id => TOOL[id][2] * 10 + TOOL[id][1]), need > 1 ? 'a pickaxe strong enough for ' + nm(b) : 'a pickaxe']; }
    const l = tools(k); return [best(l, id => TOOL[id][2] * 10 + TOOL[id][1]), k === 'axe' ? 'an axe' : 'a ' + k]; }
  function pickTool() {
    if (menuOpen || paused || dead || !started) return; let id = 0, what = null; try { [id, what] = choose(); } catch (e) { ERR('pick', e); }
    if (!id) { toast(what ? 'No ' + what.replace(/^(a|an) /, '') + ' for that' : 'No tool for that'); return; }
    try { ensureHotbar(); if (MODE.hotbar) { let i = MODE.hotbar.indexOf(id); if (i < 0) { i = MODE.hotbar.indexOf(selId); if (i < 0) i = 0; MODE.hotbar[i] = id; } } } catch (_) {}
    selId = id; U.picks++; U.last = id; try { renderHotbar(); } catch (_) {} try { sfx('pop', .3); } catch (_) {} toast(NAMES[id] || 'Tool'); }
  U.pickTool = pickTool; U.choose = choose;
  let rsPrev = false;
  try { const rp = readPad; readPad = function () { const r = rp.apply(this, arguments); try { const now = pressed(11); if (now && !rsPrev) pickTool(); rsPrev = now; } catch (_) {} return r; }; } catch (e) { ERR('pad', e); }
  // keyboard too: middle mouse stays pick-block; T = pick tool
  addEventListener('keydown', e => { if (e.code === 'KeyT' && !e.repeat && !menuOpen && started && !(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) pickTool(); });
  // ---------------- 2) the Snaw Yeti ----------------
  const C = window.__c123, DEF = C && C.DEF && C.DEF.nm07;
  if (DEF) { DEF.name = 'Snaw Yeti'; DEF.ai = 'wander'; DEF.dmg = 0; DEF.spd = 2.2; DEF.snd = 'yeti'; }
  let FUR = null;
  function furTex(base, dark) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 128, 128);
    let s = 91; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 900; i++) { const x = r() * 128, y = r() * 128, l = 6 + r() * 14, v = r(); g.strokeStyle = v < 0.45 ? dark : v < 0.8 ? '#f4f3ef' : '#c9cbcf'; g.globalAlpha = 0.35 + r() * 0.5; g.lineWidth = 1 + r() * 1.4;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - .5) * 6, y + l * .5, x + (r() - .5) * 8, y + l); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
  function fringeTex() { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d'); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 260; i++) { const x = r() * 128, l = 20 + r() * 44, w = 1.5 + r() * 2.5; g.fillStyle = r() < 0.5 ? '#eeedea' : r() < 0.6 ? '#cfd1d4' : '#b9bcc2'; g.beginPath(); g.moveTo(x - w, 0); g.lineTo(x + w, 0); g.lineTo(x + (r() - .5) * 4, l); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; return t; }
  function mats() { if (FUR) return FUR; FUR = {fur: new THREE.MeshLambertMaterial({map: furTex('#dcdcdc', '#a6aab2')}), fr: new THREE.MeshLambertMaterial({map: fringeTex(), alphaTest: 0.4, side: THREE.DoubleSide}),
      face: new THREE.MeshLambertMaterial({color: 0x6f7480}), eye: new THREE.MeshBasicMaterial({color: 0x1a1d24}), shine: new THREE.MeshBasicMaterial({color: 0xffffff}), mouth: new THREE.MeshLambertMaterial({color: 0x3a3238})}; return FUR; }
  function shag(r, h, sy) { const g = new THREE.SphereGeometry(r, 20, 14), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + 0.07 * Math.sin(x * 23 + z * 17) * Math.cos(y * 19);
      p.setXYZ(i, x * n, y * n * (sy || 1), z * n); } g.computeVertexNormals(); return g; }
  function fringe(r, len, y) { const g = new THREE.CylinderGeometry(r, r * 1.08, len, 18, 1, true); const m = new THREE.Mesh(g, FUR.fr); m.position.y = y; return m; }
  const noHD = () => { try { if (window.__c135 && __c135.cat) delete __c135.cat.nm07; } catch (_) {} }; noHD(); setTimeout(noHD, 3000);   // the old boxy HD model is retired
  function build(a) { noHD(); const M = mats(), g = a.g; for (const ch of [...g.children]) g.remove(ch); a.__hd = null; a.__hdTry = 2;
    const rig = new THREE.Group(); g.add(rig); const mk = (geo, m, x, y, z, par) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); (par || rig).add(o); return o; };
    const body = mk(shag(0.62, 1, 1.25), M.fur, 0, 1.55, 0); body.add(fringe(0.6, 0.45, -0.7)); body.add(fringe(0.66, 0.35, 0.1));
    const head = new THREE.Group(); head.position.set(0, 2.45, 0.12); rig.add(head); mk(shag(0.38, 1, 1.05), M.fur, 0, 0, 0, head); head.add(fringe(0.36, 0.25, 0.22));
    const face = mk(new THREE.SphereGeometry(0.24, 16, 12), M.face, 0, -0.04, 0.22, head); face.scale.set(1.05, 0.9, 0.55);
    for (const sx of [-1, 1]) { mk(new THREE.SphereGeometry(0.045, 10, 8), M.eye, sx * 0.09, 0.03, 0.33, head); mk(new THREE.SphereGeometry(0.014, 6, 5), M.shine, sx * 0.09 + 0.012, 0.045, 0.37, head); }
    const mo = mk(new THREE.SphereGeometry(0.07, 10, 6), M.mouth, 0, -0.12, 0.33, head); mo.scale.set(1.3, 0.35, 0.5);
    mk(new THREE.SphereGeometry(0.035, 8, 6), M.mouth, 0, -0.03, 0.36, head);
    const limb = (x, y, len, r) => { const p = new THREE.Group(); p.position.set(x, y, 0); rig.add(p); const m = mk(shag(r, 1, len / (2 * r)), M.fur, 0, -len / 2, 0, p); m.add(fringe(r * 0.95, len * 0.35, -len * 0.25)); 
      mk(new THREE.SphereGeometry(r * 0.75, 10, 8), M.face, 0, -len + r * 0.3, 0.05, p); return p; };
    a.la = limb(-0.68, 2.0, 1.25, 0.2); a.ra = limb(0.68, 2.0, 1.25, 0.2); a.ll = limb(-0.28, 0.95, 0.9, 0.24); a.rl = limb(0.28, 0.95, 0.9, 0.24);
    a.head = head; a.body = body; a.rig = rig; a.manim = null; a.lod = null; a.legs4 = null; a.model = null;
    a.mats = [M.fur, M.fr, M.face, M.eye, M.mouth].map(m => { const c = m.clone(); c.transparent = true; c.opacity = 1; return c; });
    // per-mob clones so the hurt flash / fade work on this one only
    let i = 0; const map = new Map([[M.fur, a.mats[0]], [M.fr, a.mats[1]], [M.face, a.mats[2]], [M.eye, a.mats[3]], [M.mouth, a.mats[4]]]); rig.traverse(o => { if (o.isMesh && map.has(o.material)) { o.material = map.get(o.material); i++; } });
    for (const m of a.mats) m.transparent = m === a.mats[1] ? false : false;
    a.hostile = false; a.yeti = 1; a.hitY = 1.4; a.tall = 3; U.yetis++; }
  function fix(a) { if (!a || a.kind !== 'nm07' || a.yeti) return; try { build(a); } catch (e) { ERR('build', e); } }
  if (C && C.spawnKind) { const sk = C.spawnKind; C.spawnKind = function (kind) { const a = sk.apply(this, arguments); if (kind === 'nm07') fix(a); return a; }; }
  // voice: a soft, low grumble, not often
  let lastG = 0;
  function grumble(pos) { if (!AC || !window.mobOut) return; const now = performance.now(); if (now - lastG < 16000 || Math.random() < 0.45) return; lastG = now;
    const d = Math.hypot(pos.x - P.x, pos.y - P.y, pos.z - P.z); if (d > 26) return; const vol = 0.22 * Math.pow(1 - d / 26, 1.6); if (vol < 0.01) return;
    const yaw = P.yaw || 0, ang = Math.atan2(pos.x - P.x, pos.z - P.z) - yaw, pan = Math.max(-0.8, Math.min(0.8, -Math.sin(ang)));
    const out = mobOut(vol, pan), t = AC.currentTime, dur = 1.1 + Math.random() * 0.8, f0 = 62 + Math.random() * 18;
    const o = AC.createOscillator(), o2 = AC.createOscillator(), lp = AC.createBiquadFilter(), g = AC.createGain(), trem = AC.createOscillator(), tg = AC.createGain();
    o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.setValueAtTime(f0 * 1.12, t); o.frequency.exponentialRampToValueAtTime(f0, t + dur * 0.4); o.frequency.exponentialRampToValueAtTime(f0 * 0.86, t + dur);
    o2.frequency.value = f0 * 0.5; lp.type = 'lowpass'; lp.frequency.setValueAtTime(260, t); lp.frequency.linearRampToValueAtTime(420, t + dur * 0.35); lp.frequency.linearRampToValueAtTime(220, t + dur); lp.Q.value = 2.5;
    trem.frequency.value = 7 + Math.random() * 3; tg.gain.value = 0.35; trem.connect(tg); tg.connect(g.gain);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.7, t + 0.18); g.gain.setValueAtTime(0.7, t + dur - 0.35); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(out); for (const q of [o, o2, trem]) { q.start(t); q.stop(t + dur + 0.05); } U.grum++; }
  try { const s3 = sfx3d; sfx3d = function (kind, pos) { if (typeof kind === 'string' && kind.slice(0, 7) === 'nm:yeti') { try { grumble(pos); } catch (e) { ERR('grum', e); } return; } return s3.apply(this, arguments); }; } catch (e) { ERR('s3', e); }
  // spawning: only very high on snowy peaks, rare, one at a time; day or night
  const SNOWY = b => b === T.SNOW || b === 178 || /snow/i.test(nm(b));
  let chk = 3;
  function peakSpot() { const g = (x, z) => { try { return groundTop(x, z); } catch (_) { return 0; } };
    for (let t = 0; t < 30; t++) { const an = Math.random() * 6.283, r = 22 + Math.random() * 30, x = Math.floor(P.x + Math.sin(an) * r), z = Math.floor(P.z + Math.cos(an) * r);
      if (x < 6 || z < 6 || x > W - 6 || z > D - 6) continue; const y = g(x, z); if (y < SEA + 30) continue;
      let snow = 0; for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const q = g(x + dx, z + dz); if (SNOWY(getB(x + dx, q, z + dz)) || SNOWY(getB(x + dx, q + 1, z + dz))) snow++; } if (snow < 3) continue;
      let peak = true; for (const [dx, dz] of [[6, 0], [-6, 0], [0, 6], [0, -6], [4, 4], [-4, -4], [4, -4], [-4, 4]]) if (g(x + dx, z + dz) > y + 1) { peak = false; break; } if (!peak) continue;
      if (getB(x, y + 1, z) && !SNOWY(getB(x, y + 1, z)) || getB(x, y + 2, z) || getB(x, y + 3, z)) continue; return [x, y + 1 + (SNOWY(getB(x, y + 1, z)) ? 1 : 0), z]; } return null; }
  function tick(dt) { if (!started || paused || DIM.cur || !C || !C.spawnKind) return; if (MODE && MODE.name === 'creative') return;
    for (const a of mobs) if (a.kind === 'nm07') { fix(a); a.fade = 0; a.hostile = false; }
    if ((chk -= dt) > 0) return; chk = 6; if (mobs.some(a => a.kind === 'nm07')) return; if (P.y < SEA + 18 || Math.random() > 0.12) return;
    const s = peakSpot(); if (!s) return; try { const a = C.spawnKind('nm07', s[0], s[1], s[2], {grp: Math.random(), home: 'peak'}); if (a) { a.home = 'peak'; a.spec = 'yeti';   /* only peak yetis survive c143's sweep of stray nm07s */ U.spawned = (U.spawned || 0) + 1; } } catch (e) { ERR('spawn', e); } }
  try { const umY = updateMobs; updateMobs = function () { for (const a of mobs) if (a.kind === 'nm07') a.fade = 0; return umY.apply(this, arguments); }; } catch (e) { ERR('um', e); }   // the yeti never fades at daybreak
  let lt = performance.now(); setInterval(() => { const n = performance.now(), dt = Math.min(1, (n - lt) / 1000); lt = n; try { tick(dt); } catch (e) { ERR('tick', e); } }, 500);
})();
