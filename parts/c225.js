/* ===================== GLX-C225 (v1.0.48): Highland "hive" villagers - wool tunic, tartan kilt, leather belt + pouch with a cyan gem, boots + bracers, glowing cyan eyes, circuit marks, a floating rune (hair kept) ===================== */
(function c225() {
  const U = window.__c225 = {n: 0, hd: 0, err: null}; const ERR = e => { if (!U.err) U.err = String(e && e.stack || e); };
  const CY = '#5fe8ff', CY2 = '#d8ffff';
  // ---- one shared 128px atlas (colour + glow) and ONE material for every villager's extra pieces ----
  const R = {TART: [0, 0, 64, 64], LEA: [64, 0, 32, 32], LEA2: [96, 0, 16, 16], CYAN: [112, 0, 16, 16], CREAM: [96, 16, 32, 16], CHEEK: [64, 32, 32, 32], BACK: [96, 32, 32, 32], PFACE: [0, 64, 64, 64], RUNE: [64, 64, 16, 16]};
  let MAT = null, RUNEM = null;
  function atlas() { if (MAT) return MAT;
    const mk = () => { const c = document.createElement('canvas'); c.width = c.height = 128; return c; }, A = mk(), E = mk(), a = A.getContext('2d'), e = E.getContext('2d');
    e.fillStyle = '#000'; e.fillRect(0, 0, 128, 128);
    const px = (x, y, w, h, col, glow) => { a.fillStyle = col; a.fillRect(x, y, w, h); if (glow) { e.fillStyle = col; e.fillRect(x, y, w, h); } };
    const noise = (r, base, d) => { px(r[0], r[1], r[2], r[3], base); for (let y = 0; y < r[3]; y += 2) for (let x = 0; x < r[2]; x += 2) { const h = ((x * 73 + y * 151 + r[0] * 7) % 17) / 17; a.fillStyle = `rgba(${h > .5 ? '255,255,255' : '0,0,0'},${d * Math.abs(h - .5)})`; a.fillRect(r[0] + x, r[1] + y, 2, 2); } };
    // tartan: the game's own tartan (as on the bed / old sash), with dark pleat lines
    let ok = false; try { try { playerTextures(); } catch (_) {} if (typeof tartanTex !== 'undefined' && tartanTex && tartanTex.image) { a.imageSmoothingEnabled = true; a.drawImage(tartanTex.image, 0, 0, 64, 64); ok = true; } } catch (_) {}
    if (!ok) { px(0, 0, 64, 64, '#22344a'); for (const s of [6, 38]) { px(s, 0, 14, 64, 'rgba(44,74,48,.85)'); px(0, s, 64, 14, 'rgba(44,74,48,.6)'); } for (const s of [26, 58]) { px(s, 0, 3, 64, '#9a2a24'); px(0, s, 64, 3, '#9a2a24'); } }
    for (let x = 0; x < 64; x += 8) px(x, 0, 1, 64, 'rgba(0,0,0,.28)');
    noise(R.LEA, '#5a3820', .5); for (let x = 66; x < 94; x += 4) px(x, 2, 2, 1, '#8a6040'), px(x, 29, 2, 1, '#8a6040');   // belt leather + stitching
    noise(R.LEA2, '#7a5032', .45); px(112, 0, 16, 16, CY, 1); px(116, 4, 8, 8, CY2, 1);   // lighter leather; the glowing gem
    noise(R.CREAM, '#d9cdb0', .35);   // wool tunic
    a.clearRect(64, 32, 64, 32); a.clearRect(0, 64, 80, 64);   // see-through decal regions
    const ln = (pts, ox, oy, s) => { for (const [x, y, w, h] of pts) px(ox + x * s, oy + y * s, w * s, h * s, CY, 1); };
    const CHEEK = [[2, 2, 1, 6], [2, 7, 4, 1], [5, 7, 1, 5], [5, 11, 3, 1], [7, 4, 1, 4], [7, 4, 3, 1], [1, 12, 2, 2]];
    ln(CHEEK, 64, 32, 2);
    const BACKL = [[7, 1, 2, 5], [3, 5, 10, 1], [3, 5, 1, 4], [12, 5, 1, 4], [7, 9, 2, 5], [1, 9, 3, 1], [12, 9, 3, 1], [6, 13, 4, 1]];
    ln(BACKL, 96, 32, 2);
    // procedural face overlay (same 32-px grid as the painted faces): glowing cyan-blue eyes + cheek lines
    for (const ex of [7, 19]) { px(ex * 2, 64 + 26, 12, 8, '#3fc8f0', 1); const ix = ex === 7 ? ex + 2 : ex + 1; px(ix * 2, 64 + 26, 6, 8, CY, 1); px((ix + 1) * 2, 64 + 28, 2, 4, CY2, 1); }
    ln([[4, 18, 1, 5], [4, 22, 3, 1], [6, 22, 1, 3], [2, 19, 2, 1]], 0, 64, 2); ln([[27, 18, 1, 5], [25, 22, 3, 1], [25, 22, 1, 3], [28, 19, 2, 1]], 0, 64, 2);
    px(64, 64, 16, 16, CY, 1);
    const T = c => { const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; return t; };
    MAT = new THREE.MeshLambertMaterial({map: T(A), emissiveMap: T(E), emissive: 0xffffff, alphaTest: 0.5, side: THREE.DoubleSide});
    RUNEM = new THREE.MeshBasicMaterial({color: 0x7ff0ff}); U.atlas = A; return MAT; }
  // ---- geometry helpers: UV-mapped boxes / quads merged into one mesh per body part ----
  function uvTo(geo, r) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (r[0] + uv.getX(i) * r[2]) / 128, 1 - (r[1] + (1 - uv.getY(i)) * r[3]) / 128); return geo; }
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E3 = new THREE.Euler(), V1 = new THREE.Vector3(), SC = new THREE.Vector3(1, 1, 1);
  const B = (w, h, d, r, x, y, z, rx, ry, rz) => ({g: uvTo(new THREE.BoxGeometry(w, h, d).toNonIndexed(), R[r]), p: [x, y, z], r: [rx || 0, ry || 0, rz || 0]});
  const PL = (w, h, r, x, y, z, ry, flip) => { const g = uvTo(new THREE.PlaneGeometry(w, h).toNonIndexed(), R[r]); if (flip) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (2 * R[r][0] + R[r][2]) / 128 - uv.getX(i)); } return {g, p: [x, y, z], r: [0, ry || 0, 0]}; };
  function merge(list) { let n = 0; for (const it of list) n += it.g.attributes.position.count;
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), T = new Float32Array(n * 2); let o = 0;
    for (const it of list) { M4.compose(V1.set(...it.p), Q.setFromEuler(E3.set(...it.r)), SC); const g = it.g.applyMatrix4(M4), a = g.attributes;
      P.set(a.position.array, o * 3); N.set(a.normal.array, o * 3); T.set(a.uv.array, o * 2); o += a.position.count; g.dispose(); }
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(P, 3)); G.setAttribute('normal', new THREE.BufferAttribute(N, 3)); G.setAttribute('uv', new THREE.BufferAttribute(T, 2)); G.computeBoundingSphere(); return G; }
  const GEO = {}; const geo = (k, f) => GEO[k] || (GEO[k] = merge(f()));
  const mesh = (k, f) => { const m = new THREE.Mesh(geo(k, f), atlas()); m.castShadow = false; m.userData.c225 = 1; return m; };
  const rune = () => { if (!GEO.rune) { GEO.rune = new THREE.OctahedronGeometry(0.085, 0); GEO.rune.scale(1, 1.45, 1); } atlas(); const m = new THREE.Mesh(GEO.rune, RUNEM); m.castShadow = false; m.userData.c225 = 1; return m; };
  // ===================== procedural (non-HD) villager =====================
  const PBODY = () => [B(0.52, 0.62, 0.3, 'CREAM', 0, 1.17, 0), B(0.54, 0.1, 0.32, 'CREAM', 0, 1.45, 0),   // wool tunic + collar
    B(0.56, 0.38, 0.34, 'TART', 0, 0.68, 0), B(0.56, 0.08, 0.34, 'LEA', 0, 0.88, 0),   // kilt + belt
    B(0.08, 0.07, 0.02, 'LEA2', 0, 0.88, 0.18), B(0.12, 0.13, 0.06, 'LEA2', 0.18, 0.78, 0.19), B(0.05, 0.06, 0.02, 'CYAN', 0.18, 0.78, 0.225),   // buckle, pouch, gem
    PL(0.16, 0.16, 'BACK', 0, 1.25, -0.152, Math.PI)];
  const PARM = () => [B(0.2, 0.36, 0.2, 'CREAM', 0, -0.18, 0), B(0.21, 0.16, 0.21, 'LEA', 0, -0.42, 0)];   // sleeve + bracer (hand stays)
  const PLEG = () => [B(0.2, 0.2, 0.2, 'LEA2', 0, -0.1, 0), B(0.22, 0.2, 0.22, 'LEA', 0, -0.29, 0), B(0.23, 0.14, 0.3, 'LEA', 0, -0.43, 0.03)];   // leather boots to the knee
  const PFACE = () => [PL(0.5, 0.5, 'PFACE', 0, 0.25, 0.252, 0)];
  const m0 = window.__c100 && __c100.model;
  if (m0) __c100.model = function () { const r = m0.apply(this, arguments); try { restyle(r); } catch (e) { ERR(e); } return r; };
  function restyle(r) { const lk = r.look; if (!lk) return;
    if (lk.OF) for (const k in lk.OF) for (const o of lk.OF[k]) if (o.parent) o.parent.remove(o);
    lk.OF = null;   // no outfit swaps any more; hair (cap/back boxes) stays exactly as it was
    r.g.add(mesh('pbody', PBODY)); for (const p of r.arms) p.add(mesh('parm', PARM)); for (const p of r.legs) p.add(mesh('pleg', PLEG));
    const ov = mesh('pface', PFACE); r.head.add(ov); const ru = rune(); ru.position.y = 2.85; r.g.add(ru);
    r.g.userData.c225 = {ov, ru, y: 2.85, ph: Math.random() * 6.28}; U.n++; }
  // ===================== HD villager (keeps its own hair mesh) =====================
  try { const H = window.__c135; if (H && H.cat && H.cat.clansman) { H.cat.clansman.tartan = []; H.post.push(postHD); } } catch (e) { ERR(e); }
  const COL = {Shirt: 0xd9cdb0, UnderShirt: 0xece4d2, Detail: 0x7a5030, Boots: 0x3e2818, Pants: 0x5a3a22, 'Material.006': 0x4a2e1a};
  const GLOW = {Eye: 0x2fb8e8, Pupil: 0xbff8ff, White: 0x46d0f4};
  const KILT = () => [B(0.46, 0.4, 0.38, 'TART', 0, -0.04, 0.03), B(0.1, 0.11, 0.06, 'LEA2', 0.14, 0.05, 0.22), B(0.045, 0.055, 0.02, 'CYAN', 0.14, 0.05, 0.255)];
  const BRACER = () => [B(0.12, 0.15, 0.12, 'LEA', 0, 0.28, 0)];
  const CHEEKS = () => [PL(0.1, 0.1, 'CHEEK', 0.12, 0.06, 0.3, 0), PL(0.1, 0.1, 'CHEEK', -0.12, 0.06, 0.3, 0, 1)];
  const BACKM = () => [PL(0.13, 0.13, 'BACK', 0, 0.12, -0.2, Math.PI)];
  const IM = new THREE.Matrix4(), IV = new THREE.Vector3(), IS = new THREE.Vector3(), IQ = new THREE.Quaternion();
  function boneRest(m, re) { let b = null; m.traverse(o => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; }
  // put g on bone b so that, in the rest pose, g's axes/units match the villager's own space (offsets read like the procedural model)
  function onRest(a, hd, m, re, g, bone) { const b = boneRest(m, re); if (!b) return null;
    hd.updateMatrixWorld(true);   // hd is not on the villager yet: its world = the villager's own space
    IM.copy(b.matrixWorld);   // a fresh clone is still in its rest pose
    IM.decompose(IV, IQ, IS); if (bone) { g.scale.setScalar(1 / (IS.x || 1)); } else { g.quaternion.copy(IQ).invert(); g.scale.setScalar(1 / (IS.x || 1)); } b.add(g); return IV.clone(); }
  function postHD(a, c, M, m, hd, s, mats) { if (a.kind !== 'clansman') return;
    for (const x of mats) { if (COL[x.name] !== undefined) { x.color.setHex(COL[x.name]); if (x.name === 'Pants') x.map = null; x.needsUpdate = true; }
      if (GLOW[x.name] !== undefined) { x.color.setHex(GLOW[x.name]); x.emissive.setHex(GLOW[x.name]); x.emissive.multiplyScalar(0.8); } }
    const at = (re, k, f, bone) => { const g = new THREE.Group(); g.add(mesh(k, f)); return onRest(a, hd, m, re, g, bone) ? g : null; };
    at(/^Hips$/, 'kilt', KILT); at(/^Head$/, 'cheek', CHEEKS); at(/^Torso$/, 'backm', BACKM); at(/^LowerArm\.?L$/, 'brac', BRACER, 1); at(/^LowerArm\.?R$/, 'brac', BRACER, 1);
    const ru = rune(); ru.position.y = 3.0; hd.add(ru); a.__c225hd = {ru, y: 3.0, ph: Math.random() * 6.28}; U.hd++; }
  // ---- the rune bobs and turns slowly; the eye glow closes when they sleep (cheap: ~20 updates a second) ----
  let last = 0;
  function tick(t) { requestAnimationFrame(tick); if (t - last < 50) return; last = t; const s = t / 1000;
    try { for (const a of mobs) { if (!a || a.kind !== 'clansman') continue; const q = a.g && a.g.userData.c225; if (q) { q.ru.position.y = q.y + 0.04 * Math.sin(s * 2 + q.ph); q.ru.rotation.y = s * 0.8 + q.ph; q.ov.visible = a.moodShown !== 'sleep' && !a.sleeping; }
        const h = a.__c225hd; if (h && a.__hd && a.__hd.on) { h.ru.position.y = h.y + 0.04 * Math.sin(s * 2 + h.ph); h.ru.rotation.y = s * 0.8 + h.ph; } } } catch (e) { ERR(e); } }
  requestAnimationFrame(tick);
})();
