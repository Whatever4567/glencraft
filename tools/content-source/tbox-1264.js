/* GLX-TBOX1264 (v1.2.64): opaque TARDIS floor, hide terrain under the interior
   while inside; on-screen left stick pilots (forward/back/strafe relative to
   facing), right stick yaws, 'TARDIS spin sensitivity' slider; Jump up and
   Down sink; in-cabin scanner raised above eye level and angled down.
   First-person arms/hands/gun code is not touched. The gold D-pad is left alone. */
(function tbox1264() {
  const U = window.__tbox1264 = {
    version: '1.2.64',
    frames: 0,
    err: '',
    lx: 0, ly: 0, rx: 0,
    holdUp: 0, holdDown: 0,
    floorBuilt: 0,
    terrHid: 0,
    scrY: 2.68,
    scrRx: -0.34,
    spinDefault: 1,
    hiddenChunks: 0,
    lastInside: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const T0 = () => window.__tbox;
  const F0 = () => window.__tbox3;
  const A0 = () => window.__tbox1260;
  const S0 = () => { const T = T0(); return T && T.S; };

  function getSET() {
    try { if (typeof SET !== 'undefined' && SET) return SET; } catch (_) {}
    try { if (window.SET) return window.SET; } catch (_) {}
    return null;
  }
  function spinSens() {
    let s = U.spinDefault;
    try {
      if (U._spin != null && isFinite(Number(U._spin))) s = Number(U._spin);
      const st = getSET();
      if (st && st.tboxSpin != null && isFinite(Number(st.tboxSpin))) s = Number(st.tboxSpin);
      else {
        const raw = JSON.parse(localStorage.getItem('glen_set') || '{}');
        if (raw && raw.tboxSpin != null && isFinite(Number(raw.tboxSpin))) s = Number(raw.tboxSpin);
      }
    } catch (_) {}
    if (!isFinite(s)) s = U.spinDefault;
    return Math.max(0.3, Math.min(3, s));
  }
  U.spinSens = spinSens;
  U.setSpin = function (v) {
    v = Math.max(0.3, Math.min(3, Number(v)));
    if (!isFinite(v)) v = U.spinDefault;
    U._spin = v;
    try { const st = getSET(); if (st) st.tboxSpin = v; } catch (_) {}
    try {
      const raw = JSON.parse(localStorage.getItem('glen_set') || '{}');
      raw.tboxSpin = v;
      localStorage.setItem('glen_set', JSON.stringify(raw));
    } catch (_) {}
    try {
      const inp = document.getElementById('tboxSpin');
      if (inp) inp.value = String(v);
      const b = document.getElementById('tboxSpinV');
      if (b) b.textContent = (Math.round(v * 10) / 10).toFixed(1) + 'x';
    } catch (_) {}
    return v;
  };

  function ensureSpinDefault() {
    try {
      const st = getSET();
      if (st && (st.tboxSpin == null || !isFinite(Number(st.tboxSpin)))) st.tboxSpin = U.spinDefault;
    } catch (_) {}
  }

  /* ---------- 1) opaque, depth-sorted floor + hide terrain while inside ---------- */
  function roomOf() {
    const T = T0();
    if (!T) return null;
    return (T.parts && T.parts.room) || T.room || null;
  }
  U.roomOf = roomOf;

  function SM(m) {
    try {
      const T = T0();
      if (T && T.SM) T.SM(m);
      if (T) {
        m.stencilFunc = T.camIn ? THREE.AlwaysStencilFunc : THREE.EqualStencilFunc;
        if (T.RM) T.RM.push(m);
      }
      m.fog = false;
    } catch (_) {}
    return m;
  }

  function tartanMap() {
    try {
      const room = roomOf();
      if (room) {
        let found = null;
        room.traverse(o => {
          if (found || !o.isMesh || !o.material) return;
          const g = o.geometry;
          if (g && g.type === 'CircleGeometry' && o.material.map && !o.userData.t1264floor) found = o.material.map;
        });
        if (found) return found;
      }
    } catch (_) {}
    try {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d');
      g.fillStyle = '#1d3b2a'; g.fillRect(0, 0, 64, 64);
      g.strokeStyle = '#c9a227'; g.lineWidth = 3;
      for (let i = 0; i < 64; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(64, i); g.stroke(); }
      g.strokeStyle = '#5a1e24'; g.lineWidth = 2;
      for (let i = 8; i < 64; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(64, i); g.stroke(); }
      const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(6, 6); tex.needsUpdate = true;
      return tex;
    } catch (_) { return null; }
  }

  function hardenMat(m) {
    if (!m) return;
    m.transparent = false;
    m.opacity = 1;
    m.depthWrite = true;
    m.depthTest = true;
    m.alphaTest = 0;
    if (m.alphaMap) m.alphaMap = null;
    m.polygonOffset = true;
    m.polygonOffsetFactor = -4;
    m.polygonOffsetUnits = -4;
    try { if (typeof m.premultipliedAlpha !== 'undefined') m.premultipliedAlpha = false; } catch (_) {}
    m.needsUpdate = true;
  }

  function hardenExistingFloors() {
    const room = roomOf();
    if (!room) return 0;
    let n = 0;
    try {
      room.traverse(o => {
        if (!o.isMesh) return;
        const g = o.geometry;
        const ty = g && g.type;
        const isFl = ty === 'CircleGeometry' || ty === 'RingGeometry' || o.userData.tboxFloor || o.userData.t1264floor;
        if (!isFl) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(hardenMat);
        if (o.position && o.position.y < 0.08 && ty === 'CircleGeometry') o.position.y = 0.08;
        o.renderOrder = Math.max(o.renderOrder || 0, 12);
        o.visible = true;
        n++;
      });
    } catch (e) { ERR('hard', e); }
    return n;
  }

  function buildOpaqueFloor() {
    const T = T0();
    const room = roomOf();
    if (!T || !room || typeof THREE === 'undefined') return false;
    if (U._floor && U._floor.parent === room) {
      hardenExistingFloors();
      return true;
    }
    try {
      if (U._floor && U._floor.parent) U._floor.parent.remove(U._floor);
    } catch (_) {}
    try {
      const RR = T.RR || 9.2, CZ = (T.HW || 0.85) - RR;
      const map = tartanMap();
      const mat = SM(new THREE.MeshBasicMaterial({
        map: map || undefined,
        color: map ? 0xffffff : 0x1d3b2a,
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
        fog: false
      }));
      hardenMat(mat);
      /* Thick disc so the floor has real depth and wins z-order against terrain. */
      const geo = new THREE.CylinderGeometry(RR + 0.12, RR + 0.12, 0.22, 48);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, 0.12, CZ);
      mesh.renderOrder = 20;
      mesh.userData.t1264floor = 1;
      mesh.userData.tboxFloor = 1;
      mesh.frustumCulled = false;
      mesh.visible = true;
      room.add(mesh);
      U._floor = mesh;
      U.floorBuilt = 1;
      U.floorY = 0.12;
      hardenExistingFloors();
      return true;
    } catch (e) { ERR('floor', e); return false; }
  }
  U.buildOpaqueFloor = buildOpaqueFloor;

  function inFootprint(x, z, pad) {
    const T = T0(), S = S0();
    if (!T || !S || !S.on) return false;
    const RR = (T.RR || 9.2) + (pad == null ? 0.5 : pad);
    const CZ = (T.HW || 0.85) - (T.RR || 9.2);
    const dx = x - S.x, dz = z - (S.z + CZ);
    return dx * dx + dz * dz < RR * RR;
  }
  U.inFootprint = inFootprint;

  function shouldHideTerrain() {
    const T = T0(), S = S0();
    return !!(T && S && S.on && (T.camIn || T.inside));
  }

  /* Visual-only hide: discard terrain fragments in the interior footprint
     while inside. The world array is never edited. Materials are patched
     through scene traversal so we do not need same-script access to CH / world. */
  const clipC = { value: null };
  const clipOn = { value: 0 };
  function ensureClipUni() {
    if (clipC.value) return;
    try { clipC.value = new THREE.Vector4(0, 0, 0, 0); } catch (_) { clipC.value = { x: 0, y: 0, z: 0, w: 0, set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;} }; }
  }

  function patchMat(m) {
    if (!m || m.userData.t1264clip) return;
    m.userData.t1264clip = 1;
    ensureClipUni();
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = function (sh) {
      try { if (prev) prev.apply(this, arguments); } catch (_) {}
      sh.uniforms.t1264c = clipC;
      sh.vertexShader = 'varying vec3 t1264wp;\n' + sh.vertexShader.replace(
        '#include <project_vertex>',
        '#include <project_vertex>\n#ifdef USE_INSTANCING\n t1264wp = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#else\n t1264wp = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#endif'
      );
      sh.fragmentShader = 'uniform vec4 t1264c; varying vec3 t1264wp;\n' + sh.fragmentShader.replace(
        /void\s+main\s*\(\s*\)\s*\{/,
        'void main() {\n  if (t1264c.w > 0.5) { float dx = t1264wp.x - t1264c.x, dz = t1264wp.z - t1264c.y; if (dx * dx + dz * dz < t1264c.z) discard; }\n'
      );
    };
    m.customProgramCacheKey = function () { return (prev && prev.customProgramCacheKey ? prev.customProgramCacheKey() : '') + 't1264clip'; };
    m.needsUpdate = true;
  }

  function patchTerrainMats() {
    try {
      if (typeof scene === 'undefined' || !scene) return 0;
      const T = T0();
      let n = 0;
      scene.traverse(o => {
        if (!o.isMesh && !o.isInstancedMesh) return;
        if (o.userData && (o.userData.t1264floor || o.userData.tboxFloor)) return;
        /* Do not clip the time-box's own meshes (shell lives in the main scene). */
        let p = o, skip = false;
        while (p) {
          if (T && T.parts && (p === T.parts.all || p === T.parts.room || p === T.parts.ext || p === T.parts.doors)) { skip = true; break; }
          p = p.parent;
        }
        if (skip) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(m => { if (m && !m.userData.t1264clip) { patchMat(m); n++; } });
      });
      U.hiddenChunks = n;
      return n;
    } catch (e) { ERR('pm', e); return 0; }
  }
  U.patchTerrainMats = patchTerrainMats;

  function applyClipUniforms() {
    try {
      ensureClipUni();
      const hide = shouldHideTerrain();
      const T = T0(), S = S0();
      if (hide && T && S) {
        const RR = (T.RR || 9.2) + 0.55;
        const CZ = (T.HW || 0.85) - (T.RR || 9.2);
        clipC.value.set(S.x, S.z + CZ, RR * RR, 1);
        clipOn.value = 1;
        U.terrHid = 1;
      } else {
        clipC.value.set(0, 0, 0, 0);
        clipOn.value = 0;
        U.terrHid = 0;
      }
    } catch (e) { ERR('cu', e); }
  }

  const _tuftSaved = [];
  let _tuftHidden = 0;
  function hideTufts(hide) {
    try {
      const im = window.__c81tuft;
      if (!im || !im.isInstancedMesh) return;
      const m4 = new THREE.Matrix4();
      const p = new THREE.Vector3();
      const s0 = new THREE.Vector3();
      const q = new THREE.Quaternion();
      if (hide) {
        _tuftSaved.length = 0; _tuftHidden = 0;
        for (let i = 0; i < im.count; i++) {
          im.getMatrixAt(i, m4);
          p.setFromMatrixPosition(m4);
          if (!inFootprint(p.x, p.z, 1.6)) continue;
          if (!_tuftHidden) _tuftSaved.push([i, m4.clone()]);
          m4.decompose(p, q, s0);
          s0.set(0, 0, 0);
          m4.compose(p, q, s0);
          im.setMatrixAt(i, m4);
        }
        im.instanceMatrix.needsUpdate = true;
        _tuftHidden = 1;
      } else if (_tuftHidden) {
        for (let i = 0; i < _tuftSaved.length; i++) im.setMatrixAt(_tuftSaved[i][0], _tuftSaved[i][1]);
        im.instanceMatrix.needsUpdate = true;
        _tuftSaved.length = 0;
        _tuftHidden = 0;
      }
    } catch (e) { ERR('tuft', e); }
  }

  function syncTerrainHide() {
    const hide = shouldHideTerrain();
    const T = T0(), S = S0();
    const key = hide && S ? (Math.round(S.x) + ',' + Math.round(S.z) + ',' + Math.round(S.y)) : 'off';
    try { patchTerrainMats(); } catch (e) { ERR('pt', e); }
    try { applyClipUniforms(); } catch (e) { ERR('ac', e); }
    if (hide !== !!U.lastInside) {
      hideTufts(hide);
      U.lastInside = hide ? 1 : 0;
      U._hideKey = key;
    } else if (hide && U._hideKey !== key) {
      _tuftHidden = 0;
      hideTufts(true);
      U._hideKey = key;
    } else if (hide) {
      hideTufts(true);
    } else {
      hideTufts(false);
    }
  }
  U.syncTerrainHide = syncTerrainHide;

  /* ---------- 2) touch-stick piloting + spin sensitivity ---------- */
  function bindSticks() {
    try {
      const left = document.getElementById('stickZone');
      if (left && !left._t1264) {
        let id = null, sx = 0, sy = 0;
        left.addEventListener('pointerdown', e => {
          if (!piloting()) return;
          id = e.pointerId; sx = e.clientX; sy = e.clientY;
        }, { capture: true });
        left.addEventListener('pointermove', e => {
          if (!piloting() || e.pointerId !== id) return;
          const dx = Math.max(-56, Math.min(56, e.clientX - sx));
          const dy = Math.max(-56, Math.min(56, e.clientY - sy));
          U.lx = dx / 56; U.ly = dy / 56;
        }, { capture: true });
        const endL = e => {
          if (e && id != null && e.pointerId !== id) return;
          id = null; U.lx = 0; U.ly = 0;
        };
        left.addEventListener('pointerup', endL, { capture: true });
        left.addEventListener('pointercancel', endL, { capture: true });
        left._t1264 = 1;
      }
      const right = document.getElementById('rStick');
      if (right && !right._t1264) {
        let id = null, sx = 0, sy = 0;
        const knob = right.querySelector('b') || right;
        right.style.pointerEvents = 'auto';
        right.addEventListener('pointerdown', e => {
          if (!piloting()) return;
          id = e.pointerId; sx = e.clientX; sy = e.clientY;
          try { right.setPointerCapture(e.pointerId); } catch (_) {}
          e.stopPropagation();
          e.preventDefault();
        });
        right.addEventListener('pointermove', e => {
          if (!piloting() || e.pointerId !== id) return;
          const dx = Math.max(-56, Math.min(56, e.clientX - sx));
          const dy = Math.max(-56, Math.min(56, e.clientY - sy));
          U.rx = dx / 56;
          e.stopPropagation();
        });
        const endR = e => {
          if (e && id != null && e.pointerId !== id) return;
          id = null; U.rx = 0;
        };
        right.addEventListener('pointerup', endR);
        right.addEventListener('pointercancel', endR);
        right._t1264 = 1;
        U.rStickBound = 1;
      }
    } catch (e) { ERR('stick', e); }
  }
  U.bindSticks = bindSticks;

  function piloting() {
    try {
      const F = F0(), T = T0(), S = S0();
      return !!(F && F.pilot && T && T.inside && S && S.on);
    } catch (_) { return false; }
  }
  U.piloting = piloting;

  function leftAxes() {
    let x = U.lx || 0, y = U.ly || 0;
    try {
      if (typeof tjx === 'number' && Math.abs(tjx) > Math.abs(x)) x = tjx;
      if (typeof tjy === 'number' && Math.abs(tjy) > Math.abs(y)) y = tjy;
    } catch (_) {}
    return [x, y];
  }
  U.leftAxes = leftAxes;

  function padAxes() {
    try {
      if (!navigator.getGamepads) return [0, 0, 0, 0, 0, 0];
      const g = [...navigator.getGamepads()].find(p => p && !p._t1264);
      if (!g) return [0, 0, 0, 0, 0, 0];
      const ax = i => (g.axes && Math.abs(g.axes[i] || 0) > 0.15) ? g.axes[i] : 0;
      const bt = i => (g.buttons && g.buttons[i] && g.buttons[i].pressed) ? 1 : 0;
      return [ax(0), ax(1), ax(2), ax(3), bt(0), bt(1), bt(10)];
    } catch (_) { return [0, 0, 0, 0, 0, 0, 0]; }
  }

  function held(code) {
    try {
      const A = A0();
      if (A && A._keys && A._keys[code]) return 1;
    } catch (_) {}
    try { if (typeof keys !== 'undefined' && keys && keys[code]) return 1; } catch (_) {}
    return 0;
  }

  function jumpOn() {
    if (U.holdUp) return 1;
    try { if (typeof jumpHeld !== 'undefined' && jumpHeld) return 1; } catch (_) {}
    try { if (typeof jumpHeldPad !== 'undefined' && jumpHeldPad) return 1; } catch (_) {}
    try { if (typeof jumpReq !== 'undefined' && jumpReq) return 1; } catch (_) {}
    if (held('Space')) return 1;
    return 0;
  }
  function downOn() {
    if (U.holdDown) return 1;
    try { if (typeof sneakHeld !== 'undefined' && sneakHeld) return 1; } catch (_) {}
    if (held('ShiftLeft') || held('ShiftRight') || held('KeyC')) return 1;
    return 0;
  }
  U.jumpOn = jumpOn;
  U.downOn = downOn;

  function blocked(x, y, z) {
    const T = T0();
    if (!T || typeof solid !== 'function') return false;
    T.__raw = 1;
    try {
      const HW = T.HW || 0.85;
      for (const [ox, oz] of [[-HW, -HW], [HW, -HW], [-HW, HW], [HW, HW], [0, 0]])
        for (const oy of [0.1, 1.3, 2.5])
          if (solid(Math.floor(x + ox), Math.floor(y + oy), Math.floor(z + oz))) return true;
    } catch (_) {}
    finally { try { T.__raw = 0; } catch (_) {} }
    return false;
  }

  /* Own fly: left stick is horizontal move relative to facing, right stick
     is yaw only (scaled by TARDIS spin sensitivity). Jump up, Down sink.
     1260's closed-over fly is skipped from our updatePlayer wrap. */
  function fly1264(dt) {
    const T = T0(), F = F0(), S = S0();
    if (!T || !F || !S || !S.on || !F.pilot) return;
    dt = Math.min(0.1, dt || 0.016);
    const A = A0();
    const [plX, plY, plRx, _plRy, bt0, bt1, LSb] = padAxes();
    const [tx, ty] = leftAxes();
    const pick = (a, b) => (Math.abs(a) >= Math.abs(b) ? a : b);
    const lx = pick(tx, plX);
    const ly = pick(ty, plY);
    const rx = pick(U.rx || 0, plRx);
    let sprint = false;
    try {
      sprint = !!(typeof sprintTouch !== 'undefined' && sprintTouch) ||
               !!(typeof sprinting !== 'undefined' && sprinting) ||
               !!(typeof sprintPad !== 'undefined' && sprintPad) ||
               !!(typeof sprintShift !== 'undefined' && sprintShift);
    } catch (_) {}
    const boost = (LSb || sprint) ? 10 : 1;
    const st = (Math.abs(lx) > 0.15 ? lx : 0);
    const f = -(Math.abs(ly) > 0.15 ? ly : 0) + (held('KeyW') - held('KeyS'));
    const tr = -(Math.abs(rx) > 0.12 ? rx : 0) * spinSens() + (held('KeyA') - held('KeyD'));
    const up = jumpOn() + bt0 - downOn() - bt1;
    const turnT = tr * 2.6;
    const ease = 1 - Math.exp(-dt * 9);
    if (A) {
      A.turnV = (A.turnV || 0) + (turnT - (A.turnV || 0)) * ease;
      A.pitchV = (A.pitchV || 0) * (1 - ease);
      F.H = (F.H || 0) + A.turnV * dt;
    } else {
      F.H = (F.H || 0) + turnT * dt;
    }
    /* Yaw only: do not tilt from the right stick. Horizontal facing. */
    F.Pt = 0;
    const fwdX = -Math.sin(F.H), fwdZ = -Math.cos(F.H);
    const rightX = Math.cos(F.H), rightZ = -Math.sin(F.H);
    const wishX = fwdX * f + rightX * st;
    const wishY = up * 0.85;
    const wishZ = fwdZ * f + rightZ * st;
    const wLen = Math.hypot(wishX, wishY, wishZ);
    if (!F.v) F.v = [0, 0, 0];
    const acc = 16 * boost;
    if (wLen > 0.08) {
      F.v[0] += (wishX / wLen) * acc * dt;
      F.v[1] += (wishY / wLen) * acc * dt;
      F.v[2] += (wishZ / wLen) * acc * dt;
    } else {
      const damp = Math.exp(-dt * 1.6);
      F.v[0] *= damp; F.v[1] *= damp; F.v[2] *= damp;
    }
    /* 1.2.73: cap at 100,000 mph (1 block = 1 m → 44704.0 blocks/s). Boost is also clamped by this ceiling. */
    const MAX_V1273 = 100000 * 1609.344 / 3600;
    let spd1273 = Math.hypot(F.v[0], F.v[1], F.v[2]);
    if (spd1273 > MAX_V1273 && spd1273 > 0) {
      const s1273 = MAX_V1273 / spd1273;
      F.v[0] *= s1273; F.v[1] *= s1273; F.v[2] *= s1273;
      spd1273 = MAX_V1273;
    }
    if (A) { A.speed = spd1273; A.speedMph = spd1273 * 3600 / 1609.344; }
    try { const _U = window.__tbox1260; if (_U) { _U.speed = spd1273; _U.speedMph = spd1273 * 3600 / 1609.344; } } catch (_) {}
    let nx = S.x, ny = S.y, nz = S.z;
    const ddx = F.v[0] * dt, ddy = F.v[1] * dt, ddz = F.v[2] * dt;
    const n = Math.min(64, Math.max(1, Math.ceil(Math.max(Math.abs(ddx), Math.abs(ddy), Math.abs(ddz)) / 1.0)));
    for (let k = 0; k < n; k++) {
      const ax = nx + ddx / n, ay = ny + ddy / n, az = nz + ddz / n;
      try { if (window.__ukb && __ukb.wall && __ukb.wall(ax, ay + 1, az)) { F.v[0] = F.v[2] = 0; break; } } catch (_) {}
      if (F.v[0] && blocked(ax, ny, nz)) F.v[0] = 0; else if (F.v[0]) nx = ax;
      if (F.v[2] && blocked(nx, ny, az)) F.v[2] = 0; else if (F.v[2]) nz = az;
      if (F.v[1] && blocked(nx, ay, nz)) F.v[1] = 0;
      else if (F.v[1]) ny = ay;
    }
    try { T.place(nx, ny, nz); } catch (e) { ERR('place', e); }
    try { if (A && A.lockSeat) A.lockSeat(); } catch (_) {}
    try { if (A && A.engineTick) A.engineTick(); } catch (_) {}
  }
  U.fly = fly1264;

  function wrapUpdate() {
    try {
      if (typeof updatePlayer !== 'function' || updatePlayer._t1264) return !!updatePlayer._t1264;
      const up = updatePlayer;
      function wrapped(dt) {
        const F = F0(), T = T0(), S = S0();
        const pil = !!(F && F.pilot && T && T.inside && S && S.on);
        if (pil) {
          /* Skip 1260's closed-over fly (it would run if F.pilot stayed true)
             and run fly1264 instead, so touch sticks and yaw-only spin apply. */
          F.pilot = false;
          let r;
          try { r = up.apply(this, arguments); } finally { F.pilot = true; }
          try { fly1264(Math.min(0.1, dt || 0.016)); } catch (e) { ERR('fly', e); }
          try { const A = A0(); if (A && A.lockSeat) A.lockSeat(); } catch (_) {}
          return r;
        }
        return up.apply(this, arguments);
      }
      wrapped._t1264 = 1;
      try { updatePlayer = wrapped; } catch (_) {}
      try { window.updatePlayer = wrapped; } catch (_) {}
      try { const A = A0(); if (A) A.fly = fly1264; } catch (_) {}
      return true;
    } catch (e) { ERR('upw', e); return false; }
  }
  U.wrapUpdate = wrapUpdate;

  function setPilotChrome() {
    try {
      const on = piloting();
      document.body.classList.toggle('tboxPilot', on);
      const r = document.getElementById('rStick');
      if (r) {
        const b = r.querySelector('b');
        if (b) b.textContent = on ? 'SPIN' : 'LOOK';
      }
    } catch (_) {}
  }

  function injectSpinSlider() {
    try {
      if (document.getElementById('tboxSpin')) return true;
      ensureSpinDefault();
      const after = document.querySelector('label.set[data-k="fov"]') ||
                    document.getElementById('fov') && document.getElementById('fov').closest('label, .set') ||
                    document.getElementById('padSens') && document.getElementById('padSens').closest('label, .set');
      if (!after || !after.parentNode) return false;
      const lab = document.createElement('label');
      lab.className = 'set';
      lab.dataset.k = 'tboxSpin';
      lab.innerHTML = '<span>TARDIS spin sensitivity<b id="tboxSpinV"></b></span>' +
        '<input type="range" id="tboxSpin" min="0.3" max="3" step="0.1" data-testid="settings-tardis-spin-sensitivity">';
      after.parentNode.insertBefore(lab, after.nextSibling);
      const inp = document.getElementById('tboxSpin');
      const fmt = v => (Math.round(Number(v) * 10) / 10).toFixed(1) + 'x';
      const apply = () => {
        const v = spinSens();
        if (inp) inp.value = String(v);
        const b = document.getElementById('tboxSpinV');
        if (b) b.textContent = fmt(v);
      };
      inp.addEventListener('input', () => {
        const v = Math.max(0.3, Math.min(3, Number(inp.value)));
        try { const st = getSET(); if (st) st.tboxSpin = v; } catch (_) {}
        try { if (typeof saveSet === 'function') saveSet(); } catch (_) {}
        try {
          const raw = JSON.parse(localStorage.getItem('glen_set') || '{}');
          raw.tboxSpin = v;
          localStorage.setItem('glen_set', JSON.stringify(raw));
        } catch (_) {}
        const b = document.getElementById('tboxSpinV');
        if (b) b.textContent = fmt(v);
      });
      apply();
      try {
        if (typeof window.syncSettingsUI === 'function' && !window.syncSettingsUI._t1264) {
          const ss = window.syncSettingsUI;
          window.syncSettingsUI = function () {
            const r = ss.apply(this, arguments);
            try { apply(); } catch (_) {}
            return r;
          };
          window.syncSettingsUI._t1264 = 1;
        }
      } catch (_) {}
      U.slider = 1;
      return true;
    } catch (e) { ERR('ui', e); return false; }
  }
  U.injectSpinSlider = injectSpinSlider;

  /* ---------- 3) raise the in-cabin TV / scanner ---------- */
  function raiseScreen() {
    try {
      const T3 = F0(), T = T0();
      const g = T3 && T3.scrG;
      if (!g || !g.position) return false;
      const CZ = T ? ((T.HW || 0.85) - (T.RR || 9.2)) : g.position.z - 0.85;
      g.position.set(0, U.scrY, CZ + 0.85);
      g.rotation.x = U.scrRx;
      g.userData.t1264scr = 1;
      U.scrMoved = 1;
      return true;
    } catch (e) { ERR('scr', e); return false; }
  }
  U.raiseScreen = raiseScreen;

  /* ---------- style: show Down while piloting; gold D-pad is left alone ---------- */
  function injectCSS() {
    if (document.getElementById('t1264css')) return;
    const st = document.createElement('style');
    st.id = 't1264css';
    st.textContent = [
      'body.tboxPilot #bDown{display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}',
      'body.tboxPilot #rStick{opacity:1;pointer-events:auto}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function tick() {
    U.frames++;
    try { bindSticks(); } catch (e) { ERR('tb', e); }
    try { setPilotChrome(); } catch (e) { ERR('ch', e); }
    try { if (!U.floorBuilt) buildOpaqueFloor(); } catch (e) { ERR('tf', e); }
    try { syncTerrainHide(); } catch (e) { ERR('th', e); }
    try { if (!U.scrMoved || (U.frames % 30 === 0)) raiseScreen(); } catch (e) { ERR('ts', e); }
    try { if (!U.slider) injectSpinSlider(); } catch (e) { ERR('tu', e); }
    try { if (!U._wrapped) U._wrapped = wrapUpdate(); } catch (e) { ERR('tw', e); }
  }

  function boot() {
    try { injectCSS(); } catch (e) { ERR('css', e); }
    try { ensureSpinDefault(); } catch (_) {}
    try { patchTerrainMats(); } catch (e) { ERR('bcb', e); }
    try { wrapUpdate(); } catch (e) { ERR('upb', e); }
    try { bindSticks(); } catch (_) {}
    try { injectSpinSlider(); } catch (_) {}
    try { buildOpaqueFloor(); } catch (_) {}
    try { raiseScreen(); } catch (_) {}
  }

  boot();
  let n = 0;
  const iv = setInterval(() => {
    try { boot(); tick(); if ((U.floorBuilt && U.scrMoved && U._wrapped && U.slider) || ++n > 80) { /* keep ticking */ } } catch (e) { ERR('boot', e); }
  }, 400);
  try {
    if (typeof scene !== 'undefined' && scene && !scene._t1264br) {
      const prev = scene.onBeforeRender;
      scene.onBeforeRender = function (r, s, c) {
        try { if (prev) prev.apply(this, arguments); } catch (_) {}
        try { if (c === camera || !c) tick(); } catch (e) { ERR('br', e); }
      };
      scene._t1264br = 1;
    }
  } catch (_) {}
  setInterval(() => { try { tick(); } catch (e) { ERR('iv', e); } }, 250);
})();
