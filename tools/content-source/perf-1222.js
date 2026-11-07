/* GLX-PERF1222 (v1.2.22): repeated blocks and the Purple crystal pickaxe.
   1. Railings and fences: each one was a group of separate boxes (a railing with two joins is about 26 draws). Each shape is now merged once
      into a single shared geometry per joint pattern, so every railing or fence is one draw. Same look, same collision (collision never used
      the meshes).
   2. Glass panes and chests: the pane and chest boxes are shared geometries instead of new ones for every block (panes also leaked theirs).
   3. Purple crystal pickaxe (761): breaks every mineable block fast with any block type (no wrong tool slowdown), still one block per frame on
      a fresh aim and reach check, never bedrock or the world bottom. A richer layered crystal chime on each hit (rate limited, few voices).
      Slightly bigger, thinner model with a pink and purple faceted crystal head texture. */
(function perf1222() {
  const U = window.__perf1222 = {err: null, merged: 0, mergeHit: 0, paneGeo: 0, chimeSkip: 0, chimes: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  // ---- shared box geometries ----
  const BG = new Map(); U.box = (w, h, d) => { const k = w.toFixed(4) + ',' + h.toFixed(4) + ',' + d.toFixed(4); let g = BG.get(k); if (!g) { g = new THREE.BoxGeometry(w, h, d); g.userData.shared = 1; BG.set(k, g); U.paneGeo = BG.size; } return g; };
  window.__bg1222 = U.box;
  // ---- merge a fence or railing group into one mesh, cached per shape ----
  const MG = new Map();
  // groups the boxes by material: one merged mesh per material (railings are usually one or two). Anything that is not a plain mesh
  // (lights, sprites, animated parts) leaves the group untouched.
  function scan(g) { const parts = [], mats = []; let ok = true; g.updateMatrixWorld(true);
    g.traverse(o => { if (o === g) return; if (o.isLight || o.isSprite || o.isPoints || o.isLine || o.isInstancedMesh || o.isSkinnedMesh) ok = false; else if (o.isMesh) { if (!o.geometry || Array.isArray(o.material) || !o.geometry.attributes.position) ok = false; else { parts.push(o); if (!mats.includes(o.material)) mats.push(o.material); } } else if (o.children.length === 0 && !o.isGroup && !o.isObject3D) ok = false; });
    return ok && parts.length > 1 ? {parts, mats} : null; }
  function bake(g, parts, mats) { g.updateMatrix(); const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), m = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3(), out = [];
    for (const mat of mats) { const ps = parts.filter(o => o.material === mat); let n = 0; for (const o of ps) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count);
      const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2); let k = 0;
      for (const o of ps) { m.multiplyMatrices(inv, o.matrixWorld); nm.getNormalMatrix(m); const ge = o.geometry, pa = ge.attributes.position, na = ge.attributes.normal, ua = ge.attributes.uv, ix = ge.index, c = ix ? ix.count : pa.count;
        for (let i = 0; i < c; i++) { const j = ix ? ix.getX(i) : i; v.fromBufferAttribute(pa, j).applyMatrix4(m); P[k * 3] = v.x; P[k * 3 + 1] = v.y; P[k * 3 + 2] = v.z;
          if (na) { v.fromBufferAttribute(na, j).applyMatrix3(nm).normalize(); N[k * 3] = v.x; N[k * 3 + 1] = v.y; N[k * 3 + 2] = v.z; } if (ua) { UV[k * 2] = ua.getX(j); UV[k * 2 + 1] = ua.getY(j); } k++; } }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(N, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); geo.computeBoundingSphere(); geo.userData.shared = 1;
      const ro = ps.reduce((a, o) => Math.max(a, o.renderOrder || 0), 0); out.push({geo, mat, ro}); }
    return out; }
  U.parts = 0;
  U.merge = (g, key) => { const sc = scan(g); if (!sc) return false; const k2 = key + '|' + sc.mats.map(x => x.uuid).join(','); let r = MG.get(k2);
    if (!r) { r = bake(g, sc.parts, sc.mats); MG.set(k2, r); U.merged = MG.size; } else U.mergeHit++;
    U.parts += sc.parts.length; for (const o of sc.parts) { if (!(o.geometry.userData && o.geometry.userData.shared)) o.geometry.dispose(); }
    for (const c of g.children.slice()) g.remove(c); for (const q of r) { const mesh = new THREE.Mesh(q.geo, q.mat); mesh.renderOrder = q.ro; g.add(mesh); } g.userData.merged1222 = r.length; return true; };
  window.__mergeG = U.merge;
  // ---- Purple crystal pickaxe ----
  const PP = 761, SPEED = 150;
  const held761 = () => { try { return heldToolId() === PP; } catch (_) { return false; } };
  try { const mb = mcBreakSeconds; mcBreakSeconds = function (b) { if (!held761() || MODE.instantBreak) return mb.apply(this, arguments);
      const h = MC_HARD[b] != null ? MC_HARD[b] : (HARD[b] || 1) * 0.8; if (!(h > 0.06)) return mb.apply(this, arguments); return Math.max(0.05, Math.ceil(h * 30 / SPEED) / 20); }; } catch (e) { ERR('mb', e); }
  U.breakSeconds = b => mcBreakSeconds(b);
  // richer crystal chime: two detuned partials, a bright shimmer and a soft body thump; at most 10 a second and 4 voices
  let lastC = 0, voices = 0;
  U.chime = (vol) => { const ac = typeof AC !== 'undefined' ? AC : (window.AC || null); if (!ac || !ac.createOscillator) return false; const now = performance.now(); if (now - lastC < 100 || voices >= 4) { U.chimeSkip++; return false; } lastC = now; voices++; U.chime_n = (U.chime_n || 0) + 1;
    try { const t = ac.currentTime, out = ac.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.22 * (vol || 1), t + 0.008); out.gain.exponentialRampToValueAtTime(0.0001, t + 0.42); out.connect(typeof master !== 'undefined' && master ? master : ac.destination);
      const base = 1180 + Math.random() * 140; for (const [f, g0] of [[1, 0.5], [2.01, 0.28], [2.76, 0.18], [4.07, 0.1]]) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(base * f, t); g.gain.value = g0; o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.45); }
      const th = ac.createOscillator(), tg = ac.createGain(); th.type = 'triangle'; th.frequency.setValueAtTime(180, t); th.frequency.exponentialRampToValueAtTime(70, t + 0.08); tg.gain.setValueAtTime(0.35, t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.1); th.connect(tg); tg.connect(out); th.start(t); th.stop(t + 0.12);
      setTimeout(() => { voices = Math.max(0, voices - 1); }, 460); U.chimes++; return true; } catch (e) { voices = Math.max(0, voices - 1); ERR('chime', e); return false; } };
  try { const sf = sfx; sfx = function (k) { if ((k === 'dig' || k === 'break') && held761()) { if (U.chime(k === 'break' ? 1 : 0.7)) return; } return sf.apply(this, arguments); }; } catch (e) { ERR('sfx', e); }
  // crystal head texture (one shared texture and material), slimmer and slightly longer model
  let HM = null; const headTex = () => { const N = (matchMedia && matchMedia('(pointer:coarse)').matches) ? 512 : 1024, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'); let sd = 761; const r = () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296;
    const gr = g.createLinearGradient(0, 0, N, N); gr.addColorStop(0, '#5a1aa8'); gr.addColorStop(0.5, '#a64dff'); gr.addColorStop(1, '#ff5fc8'); g.fillStyle = gr; g.fillRect(0, 0, N, N);
    for (let i = 0; i < 140; i++) { const x = r() * N, y = r() * N, s = N * (0.03 + r() * 0.09); g.fillStyle = ['rgba(255,140,230,.55)', 'rgba(190,120,255,.5)', 'rgba(255,255,255,.35)', 'rgba(80,20,150,.45)'][i % 4]; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.6, y); g.lineTo(x, y + s); g.lineTo(x - s * 0.6, y); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,230,255,.5)'; g.lineWidth = Math.max(1, N / 512); g.stroke(); }
    for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.3 + r() * 0.6) + ')'; g.fillRect(r() * N, r() * N, N / 256, N / 256); }
    const t = new THREE.CanvasTexture(c); try { t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); } catch (_) {} U.headTex = N; return t; };
  try { const hm = headMatFor; headMatFor = function (mat) { if (mat === 'crystalpurple') { if (!HM) HM = new THREE.MeshPhongMaterial({color: 0xffffff, map: headTex(), emissive: 0x2a0850, shininess: 170, specular: 0xffd8ff, transparent: true, opacity: 0.94}); return HM; } return hm.apply(this, arguments); }; } catch (e) { ERR('hm', e); }
  try { const mi = makeItemMesh; makeItemMesh = function (id) { const g = mi.apply(this, arguments); try { if (id === PP && g && !g.userData.block) { g.scale.multiply(new THREE.Vector3(0.86, 1.12, 0.62)); g.userData.p761 = 1; } } catch (e) { ERR('mi', e); } return g; }; } catch (e) { ERR('miw', e); }

  // ---- Purple pickaxe rapid mining: block edits and collision happen at once, the chunk remesh is coalesced ----
  // breakAt still changes the world, drops and collision immediately. Only its trailing full remesh call is held back while the purple
  // pickaxe mines: one remesh at most every 60 ms, never later than 120 ms after the first held edit, and at once when you let go.
  U.deferred = 0; U.flushes = 0; U.maxAge = 0; let inBrk = 0, pend = 0, lastR = 0;
  try { const rb = rebuild; U._rb = rb;
    rebuild = function () { if (inBrk && !arguments.length) { if (!pend) pend = performance.now(); U.deferred++; return; } return rb.apply(this, arguments); };
    const ba = breakAt; breakAt = function () { const f = held761(); if (f) inBrk++; try { return ba.apply(this, arguments); } finally { if (f) inBrk--; } };
    U.flush = force => { if (!pend) return false; const now = performance.now(); if (!force && now - lastR < 60 && now - pend < 120) return false; U.maxAge = Math.max(U.maxAge, now - pend); pend = 0; lastR = now; rb(); U.flushes++; return true; };
    U.pending = () => !!pend;
    const ui = updateInteraction; updateInteraction = function () { const r = ui.apply(this, arguments); try { let att = true; try { att = !!(attackMouse || attackPad || attackTouch); } catch (_) {} U.flush(!att || !held761()); } catch (e) { ERR('flush', e); } return r; };
  } catch (e) { ERR('coalesce', e); }
  // ---- far ocean meshing: water cells whose six neighbours are all water make no faces; skip them before the per face checks ----
  // Every water cell of a chunk goes to buildWaterGeo and each face check goes through the stacked getB wrappers. Only in the overworld,
  // only for cells fully inside the world array; edge cells and every cell that could show a face take the old path unchanged.
  U.waterIn = 0; U.waterKept = 0;
  try { const bw = buildWaterGeo; buildWaterGeo = function (arr) { try { if (!(typeof DIM !== 'undefined' && DIM.cur) && arr && arr.length > 300) { const WT = T.WATER, HD = H * D, out = [];
          for (let i = 0; i < arr.length; i += 3) { const x = arr[i], y = arr[i + 1], z = arr[i + 2];
            if (x > 0 && x < W - 1 && z > 0 && z < D - 1 && y > 0 && y < H - 1) { const j = (x * H + y) * D + z;
              if (world[j] === WT && world[j + D] === WT && world[j - D] === WT && world[j + 1] === WT && world[j - 1] === WT && world[j + HD] === WT && world[j - HD] === WT) continue; }
            out.push(x, y, z); }
          U.waterIn += arr.length / 3; U.waterKept += out.length / 3; arr = out; } } catch (e) { ERR('water', e); } return bw.call(this, arr); }; } catch (e) { ERR('bw', e); }
})();
