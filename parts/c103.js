/* ===================== GLX-C103 (v0.9.84): spawn island looks like Glencraft (log trees, natural blocks, deeper sea), longer days and nights, mocap-driven zombies and skeleton archers ===================== */
(function c103() {
  const U = window.__c103 = {err: null, isl: null};
  // ---------------- 1) worlds made with v0.9.82-83: swap the island's old blocks for the new ones (only blocks still exactly as generated) ----------------
  const S101 = window.__c101, V82_AT = 1792912483000;
  async function loadBin(url) { const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status); let b = new Uint8Array(await r.arrayBuffer());
    if (b[0] === 0x1f && b[1] === 0x8b) b = new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    const v = new DataView(b.buffer, b.byteOffset); return {NX: v.getUint16(4, true), NZ: v.getUint16(6, true), NY: v.getUint16(8, true), x0: v.getInt16(10, true), z0: v.getInt16(12, true), gy0: v.getInt16(14, true), d: b.subarray(18)}; }
  let need84 = false;
  async function upgradeIsland() {
    if (!S101 || !S101.isl || DIM.cur || !current || !(current.created > V82_AT) || current.mode === 'creative') { U.isl = 'skip'; return; }
    const [A, B] = await Promise.all([loadBin('world/spawn82.bin'), loadBin('world/spawn84.bin')]);
    if (A.NX !== B.NX || A.NZ !== B.NZ || A.NY !== B.NY || A.gy0 !== B.gy0 || A.x0 !== B.x0) { U.isl = 'dims'; return; }
    const ox = W >> 1, oz = D >> 1, top = H - 1; let n = 0;
    for (let ix = 0; ix < A.NX; ix++) for (let iz = 0; iz < A.NZ; iz++) { const base = (ix * A.NZ + iz) * A.NY; if (A.d[base] === 255) continue;
      const X = ox + A.x0 + ix, Z = oz + A.z0 + iz; if (X < 1 || Z < 1 || X >= W - 1 || Z >= D - 1) continue; let c = 0;
      for (let k = 0; k < A.NY && A.gy0 + k < top; k++) { const o = A.d[base + k], nv = B.d[base + k]; if (o === nv) continue; const i = idx(X, A.gy0 + k, Z);
        if (world[i] !== o || (placedSet && placedSet.has(i))) continue; world[i] = nv; c++; }
      if (c) { n += c; markDirty(X, Z); } }
    need84 = false; U.isl = n; if (n) { try { rebuild(); } catch (_) {} toast('Spawn island refreshed: real tree trunks, no more coloured wool'); }
  }
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); d.c103 = {isl84: need84 ? 0 : 1}; return d; };
  const ew = enterWorld;
  enterWorld = function (save) { need84 = !!save && !(save.c103 && save.c103.isl84);
    const r = ew.apply(this, arguments);
    if (need84) { const t = setInterval(() => { if (!started) return; clearInterval(t); upgradeIsland().catch(e => { U.err = String(e); console.warn('c103 island', e); }); }, 700); }
    return r; };

  // ---------------- 2) days and nights last three times as long (18 min for a full day); sleeping still skips the night ----------------
  const DAYX = 3; U.DAYX = DAYX;
  const us = updateSky; updateSky = function (dt) { if (dt > 0 && dt < 1) dayClock = (dayClock - dt * (1 - 1 / DAYX) + CYCLE) % CYCLE; return us.apply(this, arguments); };

  // ---------------- 3) mocap-driven mobs: poses sampled offline from a licensed animation library and baked to joint angles for our blocky rigs ----------------
  // channels per frame: torso lean, right arm pitch/roll, left arm pitch/roll, right leg pitch/roll, left leg pitch/roll, head pitch/yaw (radians)
const CLIPS = {"RUN":[0.26,-1.18,-0.12,-1.4,0.12,-0.07,-0.17,-0.41,0.17,-0.26,-0.0,0.26,-1.11,-0.1,-1.32,0.12,-0.12,-0.17,-0.74,0.18,-0.28,-0.02,0.26,-1.06,-0.1,-1.26,0.13,-0.13,-0.17,-0.85,0.18,-0.29,-0.04,0.26,-1.15,-0.13,-1.37,0.12,-0.08,-0.17,-0.53,0.18,-0.27,-0.01,0.26,-1.07,-0.12,-1.33,0.12,-0.46,-0.19,-0.39,0.16,-0.25,0.03,0.26,-0.98,-0.13,-1.29,0.11,-0.4,-0.2,-0.39,0.17,-0.24,0.04,0.26,-1.14,-0.12,-1.37,0.12,-0.2,-0.19,-0.48,0.17,-0.26,0.01,0.26,-1.1,-0.11,-1.32,0.11,-0.01,-0.18,-0.63,0.18,-0.28,-0.03,0.26,-1.06,-0.09,-1.26,0.12,-0.1,-0.17,-0.78,0.17,-0.28,-0.04,0.26,-1.16,-0.11,-1.37,0.12,-0.13,-0.19,-0.64,0.17,-0.27,-0.01,0.26,-1.07,-0.12,-1.33,0.11,-0.3,-0.2,-0.46,0.16,-0.25,0.02,0.26,-0.99,-0.12,-1.29,0.1,-0.62,-0.18,-0.38,0.16,-0.24,0.04],"SWIPE":[0.12,-1.29,-0.05,-0.92,-0.34,0.05,-0.15,-0.3,0.15,-0.07,-0.0,0.06,-1.82,-0.24,-0.98,-0.29,0.12,-0.15,-0.26,0.15,-0.04,-0.0,-0.02,-2.18,0.12,-1.33,-0.25,0.2,-0.15,-0.18,0.15,-0.01,-0.0,-0.1,-2.07,0.48,-2.21,-0.27,0.29,-0.14,-0.08,0.14,0.03,-0.0,-0.18,-2.04,0.51,-2.48,-0.18,0.38,-0.14,0.01,0.14,0.07,-0.0,-0.19,-2.07,0.51,-2.54,-0.17,0.42,-0.13,0.06,0.13,0.07,-0.0,-0.18,-2.13,0.49,-2.57,-0.17,0.44,-0.13,-0.04,0.15,0.07,-0.0,-0.13,-2.2,0.5,-2.48,-0.21,0.44,-0.14,-0.19,0.16,0.04,-0.0,0.02,-2.34,0.57,-1.79,-0.29,0.35,-0.14,-0.41,0.17,-0.02,-0.0,0.35,-2.04,-0.39,-1.27,-0.39,0.11,-0.14,-0.73,0.17,-0.17,-0.0,0.35,-1.95,-0.42,-1.23,-0.38,0.11,-0.15,-0.75,0.17,-0.17,-0.0,0.32,-1.92,-0.39,-1.24,-0.37,0.13,-0.16,-0.74,0.17,-0.15,-0.0,0.28,-1.89,-0.35,-1.25,-0.37,0.16,-0.16,-0.73,0.17,-0.14,-0.0,0.25,-1.87,-0.3,-1.26,-0.37,0.18,-0.16,-0.7,0.17,-0.12,-0.0,0.22,-1.84,-0.25,-1.28,-0.37,0.2,-0.16,-0.66,0.17,-0.11,-0.0,0.22,-1.79,-0.19,-1.27,-0.37,0.19,-0.16,-0.66,0.17,-0.11,-0.0],"SABER":[0.09,0.28,0.88,-1.85,-0.06,0.3,-0.15,-0.46,0.15,-0.09,-0.0,0.08,0.29,0.87,-1.68,-0.08,0.3,-0.16,-0.45,0.16,-0.1,0.05,0.07,0.37,0.84,-1.43,-0.02,0.3,-0.2,-0.42,0.19,-0.11,0.19,0.06,0.45,0.8,-1.18,0.07,0.29,-0.23,-0.38,0.23,-0.12,0.32,0.04,0.53,0.76,-1.1,0.1,0.28,-0.27,-0.33,0.26,-0.13,0.47,0.01,-0.42,0.73,-1.96,0.43,0.19,-0.35,-0.19,0.33,-0.21,0.88,-0.02,-0.85,0.74,3.08,0.77,0.1,-0.39,-0.04,0.37,-0.53,1.14,-0.01,-1.17,0.89,2.72,1.0,0.04,-0.4,0.01,0.36,-0.82,1.32,-0.0,2.57,1.28,2.81,-0.37,0.02,-0.41,0.0,0.37,-1.6,1.58,0.0,1.91,0.94,2.8,-0.36,0.01,-0.41,0.0,0.37,-0.94,1.44],"ADS":[0.06,-1.2,0.35,-1.39,-0.73,0.13,-0.17,-0.21,0.17,-0.06,0.0,0.06,-1.2,0.35,-1.39,-0.73,0.13,-0.17,-0.21,0.17,-0.06,-0.0,0.02,-1.21,0.38,-1.38,-0.75,0.18,-0.17,-0.16,0.17,-0.06,-0.0,0.02,-1.21,0.37,-1.37,-0.74,0.18,-0.17,-0.16,0.17,-0.06,-0.0,0.06,-1.21,0.36,-1.4,-0.73,0.14,-0.17,-0.21,0.17,-0.06,-0.0,0.06,-1.2,0.35,-1.39,-0.73,0.13,-0.17,-0.21,0.17,-0.06,-0.0,-0.02,-1.23,0.42,-1.38,-0.77,0.21,-0.17,-0.13,0.17,-0.06,-0.0,0.04,-1.2,0.36,-1.39,-0.73,0.16,-0.17,-0.19,0.17,-0.06,-0.0,0.05,-1.2,0.35,-1.39,-0.73,0.14,-0.17,-0.2,0.17,-0.06,-0.0,0.06,-1.2,0.35,-1.39,-0.73,0.14,-0.17,-0.2,0.17,-0.06,-0.0,-0.01,-1.22,0.41,-1.38,-0.76,0.2,-0.17,-0.14,0.17,-0.06,-0.0],"RELOAD":[0.02,-1.36,0.34,-0.63,0.12,0.21,-0.16,-0.14,0.16,-0.02,-0.03,0.02,-1.35,0.36,-0.98,-0.43,0.21,-0.16,-0.14,0.16,-0.02,0.0,0.02,-1.35,0.36,-0.89,-0.25,0.21,-0.16,-0.14,0.16,-0.02,-0.0,0.02,-1.35,0.36,-0.81,-0.08,0.21,-0.16,-0.14,0.16,-0.02,-0.0,0.02,-1.35,0.36,-0.72,0.06,0.21,-0.16,-0.14,0.16,-0.02,-0.0,0.02,-1.35,0.36,-0.44,0.17,0.21,-0.16,-0.14,0.16,-0.02,-0.0,0.02,-1.35,0.36,-0.15,0.32,0.21,-0.16,-0.14,0.16,-0.02,-0.0,0.02,-1.35,0.36,-0.03,0.37,0.21,-0.16,-0.14,0.16,-0.02,-0.0,0.02,-1.35,0.36,-0.19,0.21,0.21,-0.16,-0.14,0.16,-0.02,-0.0,0.02,-1.35,0.36,-0.35,0.05,0.21,-0.16,-0.14,0.16,-0.02,-0.0,0.02,-1.35,0.36,-0.53,-0.1,0.21,-0.16,-0.14,0.16,-0.02,-0.0,0.02,-1.35,0.36,-0.69,-0.16,0.21,-0.16,-0.14,0.16,-0.02,-0.0,0.02,-1.35,0.36,-0.85,-0.2,0.21,-0.16,-0.14,0.16,-0.02,-0.0,0.02,-1.35,0.35,-1.01,-0.23,0.21,-0.16,-0.14,0.16,-0.02,-0.0,0.02,-1.37,0.34,-1.24,-0.37,0.21,-0.16,-0.14,0.16,-0.02,-0.0,0.02,-1.38,0.34,-1.21,-0.3,0.21,-0.16,-0.14,0.16,-0.02,-0.0,0.02,-1.38,0.34,-0.7,0.21,0.21,-0.16,-0.14,0.16,-0.02,-0.0]};
  const NC = 11, cl = {}; for (const k in CLIPS) cl[k] = {d: CLIPS[k], n: CLIPS[k].length / NC};
  const mean = k => { const c = cl[k], m = new Array(NC).fill(0); for (let f = 0; f < c.n; f++) for (let j = 0; j < NC; j++) m[j] += c.d[f * NC + j] / c.n; return m; };
  for (const k in cl) cl[k].m = mean(k);
  // sample a clip at phase u (0..1), looping or clamped; linear between baked frames
  function pose(k, u, loop, out) { const c = cl[k], n = c.n; let f = loop ? ((u % 1) + 1) % 1 * n : Math.max(0, Math.min(0.9999, u)) * (n - 1);
    const i0 = Math.floor(f), t = f - i0, i1 = loop ? (i0 + 1) % n : Math.min(n - 1, i0 + 1); for (let j = 0; j < NC; j++) out[j] = c.d[i0 * NC + j] * (1 - t) + c.d[i1 * NC + j] * t; return out; }
  const tmp = new Array(NC), tmp2 = new Array(NC), lerp = (a, b, t) => a + (b - a) * t, cl01 = v => Math.max(0, Math.min(1, v));
  const ease = (cur, tgt, k) => cur === undefined ? tgt : cur + (tgt - cur) * k;
  function setLimb(l, p, r, k) { if (!l) return; l.rotation.x = ease(l.rotation.x, p, k); l.rotation.z = ease(l.rotation.z, r, k); l.rotation.y *= (1 - k); }
  // player velocity, for skeletons that lead their shots
  const PV = {x: 0, y: 0, z: 0, px: null, py: 0, pz: 0};
  // ---- sounds: a creaking bow being drawn, and a twang on release ----
  function at3d(pos, radius) { if (!AC || !master) return null; const dx = pos.x - P.x, dz = pos.z - P.z, d = Math.hypot(dx, pos.y - P.y, dz); if (d > radius) return null;
    const rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw); return {vol: Math.pow(1 - d / radius, 1.3), pan: d > 0.1 ? (dx * rx + dz * rz) / d * 0.85 : 0}; }
  function creak(pos, dur) { const s = at3d(pos, 20); if (!s || !noiseBuf) return null; try {
    const t = AC.currentTime, out = AC.createGain(); let node = out; if (AC.createStereoPanner) { const pn = AC.createStereoPanner(); pn.pan.value = s.pan; out.connect(pn); pn.connect(master); } else out.connect(master);
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.55 * s.vol, t + 0.1); out.gain.setValueAtTime(0.55 * s.vol, t + dur * 0.85); out.gain.linearRampToValueAtTime(0, t + dur + 0.05);
    // stick-slip: noise through a rising resonant band, chopped by a speeding-up pulse
    const src = AC.createBufferSource(); src.buffer = noiseBuf; src.loop = true; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 7;
    bp.frequency.setValueAtTime(420, t); bp.frequency.linearRampToValueAtTime(980, t + dur);
    const am = AC.createGain(); am.gain.value = 0.5; const lfo = AC.createOscillator(); lfo.type = 'square'; lfo.frequency.setValueAtTime(14, t); lfo.frequency.linearRampToValueAtTime(38, t + dur);
    const lg = AC.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain); src.connect(bp); bp.connect(am); am.connect(out);
    // the wood groaning under it
    const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(72, t); o.frequency.linearRampToValueAtTime(118, t + dur); const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    const og = AC.createGain(); og.gain.value = 0.22; o.connect(lp); lp.connect(og); og.connect(am);
    src.start(t); lfo.start(t); o.start(t); const end = t + dur + 0.08; src.stop(end); lfo.stop(end); o.stop(end);
    return {stop() { try { const n = AC.currentTime; out.gain.cancelScheduledValues(n); out.gain.setValueAtTime(out.gain.value, n); out.gain.linearRampToValueAtTime(0, n + 0.04); src.stop(n + 0.05); lfo.stop(n + 0.05); o.stop(n + 0.05); } catch (_) {} }}; } catch (e) { return null; } }
  function twang(pos) { const s = at3d(pos, 22); if (!s) return; try { const t = AC.currentTime, g = AC.createGain(); let dst = master; if (AC.createStereoPanner) { const pn = AC.createStereoPanner(); pn.pan.value = s.pan; pn.connect(master); dst = pn; }
    g.connect(dst); g.gain.setValueAtTime(0.5 * s.vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    const o = AC.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(95, t + 0.25); o.connect(g); o.start(t); o.stop(t + 0.3); } catch (_) {} }
  U.creak = creak; U.twang = twang;

  // ---- skeleton archers: chase you, stop about 4 blocks away, draw (creak), loose a well-led arrow, reach for the next one ----
  const SK_RANGE = 4.3, DRAW = 0.5, NOCK = 0.25, ARROW_V = 17, AG = 6;   // AG: arrow gravity used by updateArrows
  function handLocal(arm, len, out) { const th = arm.rotation.x, ph = arm.rotation.z, c = Math.cos(ph); out.x = arm.position.x + len * Math.sin(ph); out.y = arm.position.y - len * c * Math.cos(th); out.z = arm.position.z - len * c * Math.sin(th); return out; }
  function fire(a) { const p = a.g.position, yw = a.yawVis || 0, s = Math.sin(yw), c = Math.cos(yw), h = a.bowHand || {x: 0, y: 1.4, z: 0.6};
    let fx = p.x + h.x * c + h.z * s, fy = p.y + h.y, fz = p.z - h.x * s + h.z * c; if (solid(Math.floor(fx), Math.floor(fy), Math.floor(fz))) { fx = p.x; fy = p.y + 1.4; fz = p.z; }
    // lead the target: where you'll be when the arrow gets there, then lift for the drop
    let tx = P.x, ty = P.y + 1.0, tz = P.z, t = 0.1;
    for (let k = 0; k < 4; k++) { t = Math.max(0.05, Math.hypot(tx - fx, tz - fz) / ARROW_V); tx = P.x + PV.x * t; tz = P.z + PV.z * t; ty = P.y + 1.0 + (P.onGround ? 0 : Math.max(-3, PV.y * t * 0.6)); }
    const v = new THREE.Vector3((tx - fx) / t, (ty - fy) / t + 0.5 * AG * t, (tz - fz) / t);
    const m = new THREE.Mesh(arrowGeo, arrowMat); m.position.set(fx, fy, fz); scene.add(m); arrows.push({m, v, life: 2.5});
    a.relT = 0.3; U.shots = (U.shots || 0) + 1; U.lastShot = {t, v: [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)]};
    try { sfx3d('bow', p, 18); } catch (_) {} twang(p); }
  U.fire = fire;
  window.__c78skel = function (a, dt, dist, dpx, dpz) {
    a.seeT = (a.seeT || 0) - dt; if (a.seeT <= 0) { a.seeT = 0.2; a.see = dist < 32 && canSee(a, 32); }
    const B = a.bs || (a.bs = {ph: 'nock', t: 0, draw: 0, hold: 0});
    let pa = null; const close = a.see && dist <= SK_RANGE;
    if (!close) { pa = pathAngle(a, P.x, P.z, P.y); a.noPath = pa === null ? (a.noPath || 0) + dt : 0; }
    const shootFromHere = close || (a.see && dist < 20 && a.noPath > 0.8);   // can't reach you (up a tower, across water): shoot from where it stands
    a.strafing = false;
    if (!shootFromHere) { a.ang = pa !== null ? pa : Math.atan2(dpx, dpz) + (a.detourT > 0 ? a.detour : 0); a.engaged = false;
      if (B.ph === 'draw') { B.ph = 'nock'; B.t = NOCK * 0.6; if (B.snd) { B.snd.stop(); B.snd = null; } }
      return 3.1; }
    a.engaged = true; a.ang = Math.atan2(dpx, dpz); a.path = null; a.pathProg = null;
    if (dist < 2.0) { const l = dist || 1; moveMob(a, -dpx / l * 1.2 * dt, -dpz / l * 1.2 * dt); }   // too close: a half step back while drawing
    B.t += dt;
    if (B.ph === 'nock' && B.t >= NOCK) { B.ph = 'draw'; B.t = 0; B.hold = 0.05 + Math.random() * 0.3; if (B.snd) B.snd.stop(); B.snd = creak(a.g.position, DRAW); }
    if (B.ph === 'draw' && B.t >= DRAW + B.hold && a.see) { if (B.snd) { B.snd.stop(); B.snd = null; } fire(a); B.ph = 'nock'; B.t = 0; }
    return 0; };

  // ---- the pose pass: runs after every other mob update, so it has the last word on limbs ----
  const um = updateMobs;
  updateMobs = function (dt) {
    for (const a of mobs) if (a.kind === 'zombie' && !a.giant && !a.big) { if (a.spd0z === undefined) a.spd0z = a.speed; a.speed = a.aggro > 0 ? 4.25 : Math.max(0.85, a.spd0z * 0.85); }
    const r = um.apply(this, arguments);
    if (dt > 0) { if (PV.px === null) { PV.px = P.x; PV.py = P.y; PV.pz = P.z; } const k = Math.min(1, dt * 8);
      PV.x += ((P.x - PV.px) / dt - PV.x) * k; PV.y += ((P.y - PV.py) / dt - PV.y) * k; PV.z += ((P.z - PV.pz) / dt - PV.z) * k; PV.px = P.x; PV.py = P.y; PV.pz = P.z;
      if (Math.abs(PV.x) > 30 || Math.abs(PV.z) > 30) { PV.x = PV.z = 0; } }
    for (const a of mobs) { try {
      if (Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z) > 40 || a.burning || !a.arms || a.arms.length < 2 || !a.legs || a.legs.length < 2) continue;
      if (a.kind === 'zombie') poseZombie(a, dt); else if (a.kind === 'skeleton' && a.bow) poseSkeleton(a, dt); else if (a.kind === 'blackskel') poseBlack(a, dt);
    } catch (e) { if (!U.err) U.err = String(e && e.stack || e); } }
    return r; };
  function runPhase(a, dt, stride) { const p = a.g.position, mv = a.lpx === undefined ? 0 : Math.hypot(p.x - a.lpx, p.z - a.lpz) / Math.max(dt, 1e-3); a.lpx = p.x; a.lpz = p.z;
    a.vel = ease(a.vel, Math.min(8, mv), Math.min(1, dt * 6)); a.rph = (a.rph || Math.random()) + dt * a.vel / stride; return cl01(a.vel / 4.5); }
  function poseZombie(a, dt) {
    const k = Math.min(1, dt * 14), g = a.g; g.rotation.order = 'YXZ';
    const run = runPhase(a, dt, 2.3), chase = a.aggro > 0, now = performance.now() / 1000 + (a.walk || 0) * 0.1;
    pose('RUN', a.rph, true, tmp); const m = cl.RUN.m;
    // hunched, lurching run: deep forward lean, a sideways roll every step, head cocked
    const amp = 0.35 + run * 1.25;
    a.zl = ease(a.zl, (chase ? 0.2 : 0.1) + tmp[0] * (0.4 + run), k); g.rotation.x = a.zl;
    g.rotation.z = Math.sin(a.rph * Math.PI * 2) * (0.04 + 0.09 * run) + Math.sin(now * 0.7) * 0.02;
    const lean = a.zl;
    setLimb(a.legs[0], (tmp[5] - m[5]) * amp * 1.5 + m[5] * 0.3 - lean * 0.85, tmp[6] * 0.3, k);
    setLimb(a.legs[1], (tmp[7] - m[7]) * amp * 1.5 + m[7] * 0.3 - lean * 0.85, tmp[8] * 0.3, k);
    // arms reach for you, clawing with the stride; the swipe comes from a heavy sword slash
    if ((a.swing || 0) > (a.zsw || 0) + 0.01) a.swT = 0.55; a.zsw = a.swing || 0; a.swT = Math.max(0, (a.swT || 0) - dt);
    const reach = chase ? -1.45 : -1.15, claw = Math.sin(now * 9 + (a.walk || 0)) * 0.08;
    let rP = reach + (tmp[1] - m[1]) * 1.6 - lean + claw, lP = reach + (tmp[3] - m[3]) * 1.6 - lean - claw, rR = -0.12 + (tmp[2] - m[2]) * 0.6, lR = 0.12 + (tmp[4] - m[4]) * 0.6;
    if (a.swT > 0) { pose('SWIPE', 1 - a.swT / 0.55, false, tmp2); const w = Math.sin(Math.PI * cl01((1 - a.swT / 0.55) * 1.15));
      rP = lerp(rP, tmp2[1] - lean * 0.5, w); rR = lerp(rR, tmp2[2] * 0.7, w); lP = lerp(lP, tmp2[3] - lean * 0.5, w * 0.8); lR = lerp(lR, tmp2[4] * 0.5, w * 0.8); g.rotation.x = lean + tmp2[0] * w * 0.8; }
    setLimb(a.arms[0], rP, rR, a.swT > 0 ? 1 : k); setLimb(a.arms[1], lP, lR, a.swT > 0 ? 1 : k);
    if (a.head) { a.head.rotation.order = 'YXZ'; a.head.rotation.x = ease(a.head.rotation.x, tmp[9] * 0.5 - lean * 0.75 + Math.sin(now * 1.3) * 0.05, k);
      a.head.rotation.z = 0.3 + Math.sin(a.rph * Math.PI * 2) * 0.07 + Math.sin(now * 0.9) * 0.05; a.head.rotation.y = Math.sin(now * 0.6) * 0.12; }
  }
  const hv = {x: 0, y: 0, z: 0};
  function poseSkeleton(a, dt) {
    const k = Math.min(1, dt * 12), g = a.g; g.rotation.order = 'YXZ'; g.rotation.z = 0;
    const run = runPhase(a, dt, 2.0), B = a.bs || {ph: 'nock', t: 0}, eng = !!a.engaged && a.aggro > 0;
    pose('RUN', a.rph, true, tmp); const m = cl.RUN.m; pose('ADS', performance.now() / 1000 / 0.77, true, tmp2);
    const lean = eng ? tmp2[0] + 0.04 : tmp[0] * (0.3 + 0.6 * run); g.rotation.x = ease(g.rotation.x, lean, k);
    const la = eng ? 0.25 : 0.3 + run;
    setLimb(a.legs[0], (eng ? tmp2[5] * 0.5 : (tmp[5] - m[5]) * la * 1.4) - lean, eng ? -0.1 : tmp[6] * 0.2, k);
    setLimb(a.legs[1], (eng ? tmp2[7] * 0.5 : (tmp[7] - m[7]) * la * 1.4) - lean, eng ? 0.1 : tmp[8] * 0.2, k);
    // aim: pitch from the bow hand to where the arrow will meet you
    const p = a.g.position, d = Math.hypot(P.x - p.x, P.z - p.z), aimT = Math.atan2(P.y + 1.0 - (p.y + 1.45), Math.max(1, d));
    a.aimV = ease(a.aimV, eng ? Math.max(-0.9, Math.min(0.9, aimT)) : 0, Math.min(1, dt * 8));
    const arms = a.arms, bowArm = arms[1], drawArm = arms[0], armLen = 0.7;
    // bow arm (left): straight out at you like the support arm of a rifle aim; lowered while running
    const bP = eng ? -Math.PI / 2 - a.aimV - lean - (a.relT > 0 ? a.relT / 0.3 : 0) * 0.22 + Math.sin(performance.now() / 260) * 0.015 : -0.55 + (tmp[3] - m[3]) * run - lean, bR = eng ? -0.22 : -0.15;   // v0.9.87: bow arm fully up at shoulder height, pointed at you, kicks on release
    setLimb(bowArm, bP, bR, eng ? Math.min(1, dt * 10) : k);
    handLocal(bowArm, armLen, hv); const bx = hv.x, by = hv.y, bz = hv.z; a.bowHand = {x: bx, y: by, z: bz};
    let draw = 0; if (eng && B.ph === 'draw') draw = cl01(B.t / DRAW);
    const rel = a.relT > 0 ? a.relT / 0.3 : 0;
    // draw arm (right): hand on the string, pulled back to the cheek; after the shot it reaches back over the shoulder for a fresh arrow
    if (eng) {
      const sx = bx * 0.6, sy = by + 0.02, sz = bz - 0.12 - draw * 0.42, px = drawArm.position.x, py = drawArm.position.y, pz = drawArm.position.z;
      const vx = sx - px, vy = sy - py, vz = sz - pz, L = Math.hypot(vx, vy, vz) || 1;
      let th = Math.atan2(-vz, -vy), ph = Math.asin(Math.max(-1, Math.min(1, vx / L))), sc = Math.max(0.62, Math.min(1, L / armLen));
      if (B.ph === 'nock') { pose('RELOAD', cl01(B.t / NOCK), false, tmp); const w = 0.3 * Math.sin(Math.PI * cl01(B.t / NOCK)); th = lerp(th, tmp[3] - lean, w); ph = lerp(ph, -tmp[4], w); sc = lerp(sc, 1, w); }
      if (rel > 0) { th += rel * 0.25; ph -= rel * 0.3; }
      setLimb(drawArm, th, ph, Math.min(1, dt * 18)); drawArm.scale.y = ease(drawArm.scale.y, sc, Math.min(1, dt * 18));
    } else { setLimb(drawArm, -0.2 + (tmp[1] - m[1]) * (0.6 + run) - lean, -0.08, k); drawArm.scale.y = ease(drawArm.scale.y, 1, k); }
    // the bow in the bow hand, string and nocked arrow following the draw
    const bow = a.bow; bow.visible = true; bow.position.set(bx, by, bz); bow.rotation.set(eng ? -a.aimV : 0.9, 0, (eng ? 0.12 : 0.3) + Math.sin(rel * 30) * 0.06 * rel);
    if (a.str) a.str.position.z = -draw * 0.3 + Math.sin(rel * 40) * 0.02 * rel;
    if (a.nock) { a.nock.visible = eng && B.ph === 'draw'; a.nock.position.z = 0.15 - draw * 0.3; }
    if (a.head) { a.head.rotation.order = 'YXZ'; a.head.rotation.x = ease(a.head.rotation.x, (eng ? -a.aimV * 0.8 : tmp[9] * 0.5) - lean * 0.8, k); a.head.rotation.y = eng ? -0.2 : 0; a.head.rotation.z = eng ? -0.12 : 0; }
  }
  function poseBlack(a, dt) {
    const k = Math.min(1, dt * 12), g = a.g; g.rotation.order = 'YXZ';
    const run = runPhase(a, dt, 2.0); pose('RUN', a.rph, true, tmp); const m = cl.RUN.m;
    const lean = a.zl = ease(a.zl, tmp[0] * (0.3 + run * 0.8), k); g.rotation.x = lean;
    setLimb(a.legs[0], (tmp[5] - m[5]) * (0.3 + run * 1.2) * 1.4 - lean, tmp[6] * 0.2, k); setLimb(a.legs[1], (tmp[7] - m[7]) * (0.3 + run * 1.2) * 1.4 - lean, tmp[8] * 0.2, k);
    const cut = a.cutT > 0 ? 1 - a.cutT / 0.45 : -1;
    if (cut >= 0) { pose('SABER', cut, false, tmp2); setLimb(a.arms[1], tmp2[1] - lean, -tmp2[2] * 0.8, 1); setLimb(a.arms[0], tmp2[3] * 0.6 - lean, -tmp2[4] * 0.5, 1); g.rotation.x += tmp2[0]; }
    else { setLimb(a.arms[1], -0.9 - lean + (tmp[3] - m[3]) * run * 0.5, -0.1, k); setLimb(a.arms[0], (tmp[1] - m[1]) * (0.4 + run) - 0.2 - lean, 0.1, k); }
    if (a.head) a.head.rotation.x = ease(a.head.rotation.x, tmp[9] * 0.5 - lean * 0.8, k);
  }
  U.pose = pose; U.PV = PV;
})();

/* ===================== GLX-C103b (v0.9.84): the tartan kilt item is gone (your character still wears a kilt); cobalt armour can't be crafted any more ===================== */
(function c103items() {
  const K = IT.KILT, CA = new Set([IT.KHELM, IT.KCHEST, IT.KLEGS, IT.KBOOTS].filter(v => v !== undefined));
  for (let i = RECIPES.length - 1; i >= 0; i--) { const r = RECIPES[i]; if (r && (r.out === K || CA.has(r.out))) RECIPES.splice(i, 1); }
  if (K !== undefined) { delete ARMOUR[K]; for (const L of [CREATIVE_ALL, ORDER]) { let j; while ((j = L.indexOf(K)) >= 0) L.splice(j, 1); } }
  // drop any kilts already in a save: bag, hotbar, worn, chests, lying on the ground
  function purge() { if (K === undefined) return 0; let n = 0;
    if (inv[K]) { n += inv[K]; delete inv[K]; }
    if (armour[2] === K) { armour[2] = 0; n++; try { refreshArmour(); } catch (_) {} }
    for (const hb of [MODE && MODE.hotbar, typeof hotbar !== 'undefined' ? hotbar : null]) if (Array.isArray(hb)) for (let i = 0; i < hb.length; i++) if (hb[i] === K) hb[i] = 0;
    for (const c of chests.values()) if (c && c.slots) for (let i = 0; i < c.slots.length; i++) if (c.slots[i] && c.slots[i][0] === K) { c.slots[i] = null; n++; }
    for (let i = drops.length - 1; i >= 0; i--) if (drops[i].id === K) { try { scene.remove(drops[i].m); } catch (_) {} drops.splice(i, 1); n++; }
    if (n) { try { renderHotbar(); } catch (_) {} } return n; }
  const ew = enterWorld; enterWorld = function () { const r = ew.apply(this, arguments); const t = setInterval(() => { if (!started) return; clearInterval(t); try { window.__c103.kilts = purge(); } catch (e) { console.warn('kilt purge', e); } }, 400); return r; };
  const ud = updateDrops; updateDrops = function () { for (let i = drops.length - 1; i >= 0; i--) if (drops[i].id === K) { try { scene.remove(drops[i].m); } catch (_) {} drops.splice(i, 1); } return ud.apply(this, arguments); };
  window.__c103.purge = purge;
})();
