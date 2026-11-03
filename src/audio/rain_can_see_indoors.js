/* ===================== GLX-C216 (v1.0.45): rain you can see from indoors, never inside - and 3D rain sound.
   - a small heightmap round you (the highest solid block of each column, refreshed every 0.5 s) goes to the rain shaders: rain only draws ABOVE the roof/overhang/hill
     of its own column, so it falls everywhere under open sky (seen through windows and doors) and never inside a house, a base or a tunnel mouth;
   - going indoors no longer switches rain off; only deep underground with no opening in reach does;
   - sound: an open all-round rain bed outdoors; indoors it crossfades into cosy muffled rain-on-the-roof (low-passed patter, soft taps on wood and glass, a gentle rumble);
     3D emitters (PannerNodes) sit at the nearest openings (windows, glass, doors, gaps to the sky) and on the roof above you, so it is louder from the window side and shifts as you
     turn and move. Scanned every 0.5 s, eased, follows the sound volume slider. ===================== */
(function c216() {
  const U = window.__c216 = {deep: 0, open: 1, cov: 0, ems: [], err: null, n: 0, ms: 0};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e); };
  const PH = typeof touchMode !== 'undefined' && !!touchMode, N = PH ? 40 : 56;
  // ---------- column heightmap ----------
  const hm = new Uint8Array(N * N), tx = new Uint8Array(N * N * 4), tex = new THREE.DataTexture(tx, N, N, THREE.RGBAFormat);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const uni = {uHM: {value: tex}, uHO: {value: new THREE.Vector2(-9999, -9999)}, uHN: {value: N}};
  let ox = -9999, oz = -9999;
  const top = (x, z) => { if (x < 0 || z < 0 || x >= W || z >= D) return 0; const b0 = x * H * D + z, A0 = T.AIR; for (let y = H - 1; y > 0; y--) { const b = world[b0 + y * D]; if (b !== A0 && solid(x, y, z)) return y + 1; } return 0; };
  U.top = (x, z) => { const i = x - ox, k = z - oz; return i >= 0 && k >= 0 && i < N && k < N ? hm[k * N + i] : top(x, z); };
  function scanHM() { ox = Math.floor(P.x) - (N >> 1); oz = Math.floor(P.z) - (N >> 1);
    for (let k = 0; k < N; k++) for (let i = 0; i < N; i++) { const v = Math.min(255, top(ox + i, oz + k)), j = k * N + i; hm[j] = v; tx[j * 4] = v; tx[j * 4 + 3] = 255; }
    tex.needsUpdate = true; uni.uHO.value.set(ox, oz); }
  // rain shaders: discard any rain fragment below its column's top
  function occlude(m) { if (!m || m.__c216) return; m.__c216 = 1; const ob = m.onBeforeCompile;
    m.onBeforeCompile = function (sh, r) { if (ob) ob.call(this, sh, r); Object.assign(sh.uniforms, uni);
      sh.vertexShader = 'varying vec3 vWp216;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWp216 = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'varying vec3 vWp216;\nuniform sampler2D uHM; uniform vec2 uHO; uniform float uHN;\n' + sh.fragmentShader.replace(/void main\(\) \{/, 'void main() {\n vec2 c216 = (floor(vWp216.xz) - uHO + 0.5) / uHN;\n if (c216.x > 0.0 && c216.y > 0.0 && c216.x < 1.0 && c216.y < 1.0 && vWp216.y < texture2D(uHM, c216).r * 255.0 - 0.02) discard;'); };
    m.customProgramCacheKey = () => 'c216' + (m.type || ''); m.needsUpdate = true; }
  function hook() { const c = window.__c164; if (!c || !c.sheets) return false; for (const s of c.sheets) occlude(s.m); occlude(c.lines && c.lines.material); return true; }
  // ---------- openings: rays from your head to the nearest places with open sky ----------
  const DIRS = []; for (let a = 0; a < 16; a++) for (const e of [-0.25, 0.15, 0.6]) { const az = a / 16 * Math.PI * 2, ce = Math.cos(e); DIRS.push([Math.cos(az) * ce, Math.sin(e), Math.sin(az) * ce]); }
  DIRS.push([0, 1, 0]);
  function openings() { const ex = P.x, ey = P.y + 1.6, ez = P.z, hit = [];
    for (const d of DIRS) { for (let s = 0.7; s <= 9; s += 0.6) { const x = ex + d[0] * s, y = ey + d[1] * s, z = ez + d[2] * s, bx = Math.floor(x), by = Math.floor(y), bz = Math.floor(z);
        if (solid(bx, by, bz)) break; if (by >= U.top(bx, bz)) { hit.push({x, y, z, s, d}); break; } } }
    return hit; }
  // ---------- audio graph ----------
  let A = null, tapT = 0;
  function mk() { if (A || !AC || !master) return A; try {
      const len = AC.sampleRate * 3, buf = AC.createBuffer(1, len, AC.sampleRate), ch = buf.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = 0.997 * b0 + w * 0.03; b1 = 0.96 * b1 + w * 0.3; b2 = 0.6 * b2 + w * 0.5; ch[i] = (b0 + b1 + b2 + w * 0.2) * 0.35; }
      const src = o => { const s = AC.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, o); return s; };
      const out = AC.createGain(); out.gain.value = 1; out.connect(master);
      const chain = (o, f, type, q, dest) => { const s = src(o), fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = AC.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(dest || out); return {g, fl}; };
      const open = chain(0, 2600, 'bandpass', 0.35), inn = chain(0.9, 480, 'lowpass', 0.8), rum = chain(1.7, 110, 'lowpass', 0.7);
      const pan = () => { const p = AC.createPanner(); p.panningModel = PH ? 'equalpower' : 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 1.5; p.rolloff = 1; p.rolloffFactor = 1; p.connect(out); return p; };
      const ems = [0, 1, 2].map(k => { const p = pan(), c = chain(0.4 + k * 0.6, 1700 + k * 400, 'bandpass', 0.45, p); return {p, g: c.g}; });
      const roofP = pan(), roof = chain(2.3, 900, 'lowpass', 0.6, roofP), taps = AC.createGain(); taps.gain.value = 1; taps.connect(roofP);
      A = {out, open, inn, rum, ems, roofP, roof, taps}; } catch (e) { ERR(e); A = null; } return A; }
  const tgt = (p, v, tc) => { try { p.setTargetAtTime(v, AC.currentTime, tc || 0.4); } catch (_) { p.value = v; } };
  const pos = (p, x, y, z) => { if (p.positionX) { tgt(p.positionX, x, 0.25); tgt(p.positionY, y, 0.25); tgt(p.positionZ, z, 0.25); } else p.setPosition(x, y, z); };
  function listener() { const L = AC.listener, cp = camera.position, d = new THREE.Vector3(); camera.getWorldDirection(d);
    if (L.positionX) { L.positionX.value = cp.x; L.positionY.value = cp.y; L.positionZ.value = cp.z; L.forwardX.value = d.x; L.forwardY.value = d.y; L.forwardZ.value = d.z; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
    else { L.setPosition(cp.x, cp.y, cp.z); L.setOrientation(d.x, d.y, d.z, 0, 1, 0); } }
  let t5 = 0, hooked = false, roofY = 0;
  const uw = updateWeather; updateWeather = function (dt) { const r = uw.apply(this, arguments);
    try { if (!hooked) hooked = hook();
      const w = WEATHER[weather.type], raining = !!(w && w.drops) && !DIM.cur && !window.__snowing && !(window.__snowWx && __snowWx());
      t5 -= dt;
      if (t5 <= 0 && raining) { t5 = 0.5; const t0 = performance.now(); scanHM();
        const ex = Math.floor(P.x), ez = Math.floor(P.z), hy = P.y + 1.6, cov = U.top(ex, ez) > hy ? 1 : 0, hit = cov ? openings() : [];
        U.cov = cov; roofY = U.top(ex, ez);
        // openness: share of rays that reach the sky, weighted towards near ones
        let o = 0; for (const h of hit) o += 1 / (1 + h.s * 0.35); U.open = cov ? Math.min(1, o / 6) : 1;
        // keep the nearest openings in different directions as emitters
        hit.sort((a, b) => a.s - b.s); const pick = []; for (const h of hit) { if (pick.length >= 3) break; if (pick.every(p => p.d[0] * h.d[0] + p.d[1] * h.d[1] + p.d[2] * h.d[2] < 0.6)) pick.push(h); }
        U.ems = pick.map(h => [Math.round(h.x * 10) / 10, Math.round(h.y * 10) / 10, Math.round(h.z * 10) / 10, Math.round(h.s * 10) / 10]);
        U.deep += ((typeof caveK === 'number' ? caveK : 0) * (cov && U.open < 0.05 ? 1 : 0) - U.deep) * 0.5;
        U.n++; U.ms = Math.round((performance.now() - t0) * 10) / 10; }
      if (!raining) { U.deep = 0; }
      if (!AC || !master || !mk()) return r;
      // mute the older single rain loop; this graph carries the rain now
      try { if (rainGain) tgt(rainGain.gain, 0, 0.2); } catch (_) {}
      const vol = Math.max(0, Math.min(1, Number(SET.sfx))) || 0, base = raining ? (weather.type === 'light' ? 0.06 : weather.type === 'thunder' ? 0.16 : 0.13) * Math.min(1, weather.dark / Math.max(0.01, w.dark) + 0.1) * vol : 0;
      const inK = U.cov, deepK = U.deep, op = U.open;
      tgt(A.open.g.gain, base * (1 - inK * 0.92) * (1 - deepK));
      tgt(A.inn.g.gain, base * inK * 1.25 * (1 - deepK * 0.75), 0.6);
      tgt(A.rum.g.gain, base * inK * 0.9 * (1 - deepK * 0.6), 0.8);
      A.ems.forEach((e, k) => { const h = U.ems[k]; if (h && inK) { pos(e.p, h[0], h[1], h[2]); tgt(e.g.gain, base * 1.1 * Math.min(1, 0.4 + op), 0.5); } else tgt(e.g.gain, 0, 0.5); });
      pos(A.roofP, camera.position.x, Math.max(camera.position.y + 1.5, roofY), camera.position.z); tgt(A.roof.g.gain, base * inK * 0.5, 0.6);
      // soft taps on wood and glass while you are under cover
      if (base > 0 && inK && typeof grain === 'function') { tapT -= dt; const heavy = weather.type === 'light' ? 0.5 : 1;
        while (tapT < 0) { tapT += (0.05 + Math.random() * 0.12) / heavy; const t = AC.currentTime + 0.02 + Math.random() * 0.05, glass = Math.random() < 0.3;
          grain(t, glass ? 2600 + Math.random() * 2200 : 500 + Math.random() * 700, glass ? 6 : 3, glass ? 0.03 : 0.06 + Math.random() * 0.05, (glass ? 0.05 : 0.08) * base * heavy * (0.5 + Math.random()), A.taps, 'bandpass'); } }
      listener();
    } catch (e) { ERR(e); }
    return r; };
})();
