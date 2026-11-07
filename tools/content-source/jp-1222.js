/* GLX-JP1222 (v1.2.22): the white Jetpack model and icon.
   - One detailed white model is built once (shared geometry and materials) and reused for the pack on your back, the jetpack in your
     hand and a dropped jetpack: a white panelled body with seams and rivets, top and bottom trims, three back vents, a red gauge,
     twin tanks with domed caps and brass bands, twin flared nozzles with a hot ring, and shoulder straps with a chest buckle.
   - The tall purple flames still come out of the two nozzles (same flame material and flicker; the cone geometry is shared now).
   - The inventory icon is rendered from that same model at 256 x 256 (a real 256 pixel image, nothing more). The panel texture is
     128 x 128. Phones and Low mode use fewer round segments (10 instead of 16).
   - The Golden Jetpack keeps its own model and icon exactly as before. */
(function jp1222() {
  const U = window.__jp1222 = {err: null, builds: 0, worn: 0, held: 0, dropped: 0, icon: 0, iconRes: 256, texRes: 128, segs: 0};
  const ERR = (k, e) => { U.err = k + ': ' + (e && e.message || e); try { console.warn('jp1222', k, e); } catch (_) {} };
  const JET = 291;
  const LOW = () => (typeof touchMode !== 'undefined' && !!touchMode) || (typeof PERF !== 'undefined' && PERF);
  let K = null;
  function panelTex() {
    try { const c = document.createElement('canvas'); c.width = c.height = U.texRes; const g = c.getContext && c.getContext('2d'); if (!g) return null; const S = U.texRes;
      const gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#dfe3e8'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
      g.strokeStyle = 'rgba(70,78,90,0.55)'; g.lineWidth = 2; g.strokeRect(6, 6, S - 12, S - 12); g.beginPath(); g.moveTo(6, S * 0.42); g.lineTo(S - 6, S * 0.42); g.moveTo(S / 2, S * 0.42); g.lineTo(S / 2, S - 6); g.stroke();
      g.fillStyle = 'rgba(60,66,76,0.7)'; for (const [x, y] of [[12, 12], [S - 12, 12], [12, S - 12], [S - 12, S - 12], [S / 2, S * 0.42], [12, S * 0.42], [S - 12, S * 0.42]]) { g.beginPath(); g.arc(x, y, 2.4, 0, 6.283); g.fill(); }
      const t = new THREE.CanvasTexture(c); if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t; } catch (e) { return null; } }
  function kit() { if (K) return K; const n = LOW() ? 10 : 16; U.segs = n; const L = o => new THREE.MeshLambertMaterial(o);
    const map = panelTex();
    K = {n, white: L(map ? {color: 0xffffff, map} : {color: 0xf2f4f7}), trim: L({color: 0xc9ced6}), dark: L({color: 0x3a3e46}), vent: L({color: 0x1f2226}), red: L({color: 0xc23a2a}),
      brass: L({color: 0xc8a050}), strap: L({color: 0x4a3524}), hot: new THREE.MeshBasicMaterial({color: 0xff9a30}),
      g: {body: new THREE.BoxGeometry(0.42, 0.5, 0.16), cap: new THREE.BoxGeometry(0.44, 0.05, 0.18), slat: new THREE.BoxGeometry(0.22, 0.018, 0.012), gauge: new THREE.BoxGeometry(0.1, 0.1, 0.02),
        tank: new THREE.CylinderGeometry(0.075, 0.075, 0.46, n), dome: new THREE.SphereGeometry(0.075, n, Math.max(4, n >> 1), 0, 6.2832, 0, 1.5708), band: new THREE.CylinderGeometry(0.081, 0.081, 0.025, n),
        noz: new THREE.CylinderGeometry(0.055, 0.09, 0.09, n, 1, true), ring: new THREE.CylinderGeometry(0.045, 0.045, 0.012, n), sh: new THREE.BoxGeometry(0.06, 0.025, 0.33), fr: new THREE.BoxGeometry(0.06, 0.36, 0.02),
        belt: new THREE.BoxGeometry(0.34, 0.04, 0.02), buck: new THREE.BoxGeometry(0.05, 0.05, 0.025), flame: new THREE.ConeGeometry(0.055, 0.7, 12, 1, true)}};
    K.tpl = build(); U.builds++; return K; }
  // pack-local: centre of the body; on the torso it sits at (0, 1.2, -0.27), so the nozzles are at x = +-0.15, z = -0.4 like the old flames
  U.NOZ = [[-0.15, -0.425, -0.13], [0.15, -0.425, -0.13]]; U.AT = [0, 1.2, -0.27];
  function build() { const k = K, G = k.g, grp = new THREE.Group(); grp.name = 'jetpack1222';
    const a = (geo, m, x, y, z, ry) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (ry) o.rotation.y = ry; o.castShadow = true; grp.add(o); return o; };
    a(G.body, k.white, 0, 0, 0); a(G.cap, k.trim, 0, 0.265, 0); a(G.cap, k.dark, 0, -0.255, 0);
    for (const y of [0.12, 0.07, 0.02]) a(G.slat, k.vent, 0, y, -0.085); a(G.gauge, k.red, 0, -0.1, -0.088);
    for (const sx of [-1, 1]) { const x = sx * 0.15, z = -0.13;
      a(G.tank, k.white, x, -0.1, z); a(G.dome, k.white, x, 0.13, z); a(G.band, k.brass, x, 0.05, z); a(G.band, k.brass, x, -0.25, z);
      a(G.noz, k.dark, x, -0.375, z); a(G.ring, k.hot, x, -0.42, z);
      a(G.sh, k.strap, sx * 0.13, 0.275, 0.24); a(G.fr, k.strap, sx * 0.13, 0.09, 0.415); }
    a(G.belt, k.strap, 0, 0, 0.416); a(G.buck, k.brass, 0, 0, 0.425);
    return grp; }
  U.model = () => { kit(); return K.tpl.clone(); };   // Object3D.clone shares geometry and materials: no new GPU buffers per use
  // worn: called from the jetpack dress code (a P2 patch); returns the flames so the old flame code still drives them
  U.dress = (u, mFl) => { const m = U.model(); m.position.set(U.AT[0], U.AT[1], U.AT[2]); u.torso.add(m); u.armourParts.push(m); const fl = [];
    for (const [x, y, z] of U.NOZ) { const f = new THREE.Mesh(K.g.flame, mFl); f.position.set(x + U.AT[0], U.AT[1] + y - 0.35, z + U.AT[2]); f.rotation.x = Math.PI; f.castShadow = false; f.visible = false; f.userData.jetFlame = 1; u.torso.add(f); u.armourParts.push(f); fl.push(f); }
    U.worn++; return fl; };
  // held in the hand
  try { const mi = makeItemMesh; makeItemMesh = function (id) { if (id === JET) { try { const g = new THREE.Group(), m = U.model(); m.scale.setScalar(0.42); m.rotation.set(0.25, 0.6, 0); g.add(m); g.userData.__gs = null; g.userData.jp1222 = 1; U.held++; return g; } catch (e) { ERR('mi', e); } } return mi.apply(this, arguments); }; } catch (e) { ERR('miw', e); }
  // dropped on the ground
  try { const di = dropItem; dropItem = function (id, n) { const last = drops[drops.length - 1]; const r = di.apply(this, arguments); try { const d = drops[drops.length - 1]; if (id === JET && n && d && d !== last && d.id === JET && d.m && !d.m.userData.jp1222) { const g = U.model(); g.scale.setScalar(0.7); g.userData.jp1222 = 1; g.position.copy(d.m.position); scene.remove(d.m); scene.add(g); d.m = g; U.dropped++; } } catch (e) { ERR('drop', e); } return r; }; } catch (e) { ERR('diw', e); }
  // icon: after the old icon and the gold tint made from it are done, so the Golden Jetpack icon stays exactly as before
  U.renderIcon = () => { kit(); const S = U.iconRes; let r2 = null;
    try { r2 = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true}); r2.setPixelRatio(1); r2.setSize(S, S, false); r2.setClearColor(0x000000, 0);
      try { if ('outputColorSpace' in renderer) r2.outputColorSpace = renderer.outputColorSpace; } catch (_) {}
      const sc = new THREE.Scene(); sc.add(new THREE.AmbientLight(0xffffff, 0.45)); const dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(-1.5, 2, -3); sc.add(dl); const d2 = new THREE.DirectionalLight(0xbfd8ff, 0.35); d2.position.set(2, -1, -1); sc.add(d2);
      const g = U.model(); g.rotation.set(0.25, Math.PI - 0.6, 0); sc.add(g); g.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(g), sz = new THREE.Vector3(), c = new THREE.Vector3(); bb.getSize(sz); bb.getCenter(c); const h = Math.max(sz.x, sz.y) * 0.56;
      const cam = new THREE.OrthographicCamera(c.x - h, c.x + h, c.y + h, c.y - h, -10, 10); r2.render(sc, cam); ICONS[JET] = r2.domElement.toDataURL('image/png'); U.icon++;
      try { if (typeof iconCache !== 'undefined' && iconCache && iconCache.delete) iconCache.delete(JET); } catch (_) {} try { renderHotbar(); } catch (_) {}
    } catch (e) { ERR('icon', e); } finally { try { if (r2) { r2.dispose(); r2.forceContextLoss(); } } catch (_) {} } };
  let tries = 0; const iv = setInterval(() => { tries++; const old = window.__c115 && __c115.done, gold = window.__c319 && __c319.icon;
    if ((old && (gold || tries > 40)) || tries > 60) { clearInterval(iv); U.renderIcon(); } }, 250);
})();
