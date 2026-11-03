/* ===================== GLX-C158 (v1.0.27): Admiral Skelp speaks - his own voice clip, positional, through the Mob voices slider ===================== */
(function c158() {
  const U = window.__c158 = {loaded: 0, plays: 0, err: null, last: null, why: null};
  const URL0 = 'assets/sfx/admiral_skelp.mp3', KIND = 'nm12', NOTICE = 14, RESET = 26, IDLE = 20, CD = 10, RAD = 40;
  let buf = null, raw = null, loading = false, cur = null, cdUntil = 0, eggN = -1;
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e); };
  function load() { if (buf || loading || !AC) return; loading = true;
    const dec = ab => AC.decodeAudioData(ab.slice(0)).then(b => { buf = b; env = envelope(b); U.loaded = 1; U.dur = +b.duration.toFixed(2); }).catch(e => { loading = false; ERR(e); });
    if (raw) dec(raw); else fetch(URL0).then(r => r.arrayBuffer()).then(ab => { raw = ab; dec(ab); }).catch(e => { loading = false; ERR(e); }); }
  try { (window.__AM=window.__AM||(f=>{const w=()=>(typeof screen==='string'&&screen!=='boot')?setTimeout(f,400):setTimeout(w,150);w();}))(() => fetch(URL0).then(r => r.arrayBuffer()).then(ab => { raw = raw || ab; }).catch(() => {})); 0 && fetch(URL0).then(r => r.arrayBuffer()).then(ab => { raw = raw || ab; }).catch(() => {}); } catch (_) {}   // pre-fetch; decoded once audio is unlocked
  const now = () => (AC ? AC.currentTime : 0);
  // ---- the talking jaw: a loudness envelope (50 per second) worked out once from the clip ----
  let env = null; const ER = 50;
  function envelope(b) { const d = b.getChannelData(0), step = Math.floor(b.sampleRate / ER), n = Math.ceil(d.length / step), e = new Float32Array(n); let mx = 1e-6;
    for (let i = 0; i < n; i++) { let q = 0; const a0 = i * step, a1 = Math.min(d.length, a0 + step); for (let k = a0; k < a1; k++) q += d[k] * d[k]; e[i] = Math.sqrt(q / Math.max(1, a1 - a0)); if (e[i] > mx) mx = e[i]; }
    const sorted = Array.from(e).sort((x, y) => x - y), floor = sorted[Math.floor(n * 0.15)] || 0;
    for (let i = 0; i < n; i++) e[i] = Math.max(0, Math.min(1, (e[i] - floor * 1.3) / ((mx - floor) * 0.7 || 1))); return e; }
  // a hinged bone jaw under the skull; the beard hangs off it so it wags as he talks
  function jaw(a) { if (a.__jaw !== undefined) return a.__jaw; a.__jaw = null; try { const h = a.head; if (!h) return null;
      const bone = new THREE.MeshLambertMaterial({color: 0xe6dcc0}), dark = new THREE.MeshBasicMaterial({color: 0x120c08}), tooth = new THREE.MeshLambertMaterial({color: 0xf4eedc});
      const J = new THREE.Group(); J.position.set(0, 0.19, -0.06); h.add(J); h.updateMatrixWorld(true);
      const jb = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.4), bone); jb.position.set(0, -0.09, 0.09); J.add(jb);
      for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.02), tooth); t.position.set(-0.1 + i * 0.05, -0.04, 0.28); J.add(t); }
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.02), dark); mouth.position.set(0, 0.15, 0.215); h.add(mouth);
      const beard = a.model && a.model.beard; if (beard && beard.parent === h) { J.attach(beard); }
      a.mats && a.mats.push(bone, dark, tooth); a.__jaw = J; } catch (e) { ERR(e); } return a.__jaw; }
  function jawTick(dt) { for (const a of mobs) { if (!a || a.kind !== KIND || !a.g) continue; const J = jaw(a); if (!J) continue;
      let want = 0; if (cur && cur.a === a && env) { const i = Math.floor((now() - cur.t0) * ER); want = env[Math.min(env.length - 1, Math.max(0, i))] || 0; }
      a.__jo = (a.__jo || 0) + (want - (a.__jo || 0)) * Math.min(1, dt * 18); J.rotation.x = (U.force !== undefined ? U.force : a.__jo) * 0.5; U.jaw = +J.rotation.x.toFixed(3); } }
  function level(a) { const p = a.g.position, dx = p.x - P.x, dy = p.y - P.y, dz = p.z - P.z, d = Math.hypot(dx, dy, dz);
    const rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw); return {v: d >= RAD ? 0 : Math.pow(1 - d / RAD, 0.8), pan: d > 0.1 ? Math.max(-1, Math.min(1, (dx * rx + dz * rz) / d)) : 0, d}; }
  function play(a, why) { if (!AC || !buf || cur || AC.state !== 'running') return false; try {
      const L = level(a); if (L.v <= 0) return false;
      const src = AC.createBufferSource(), g = AC.createGain(), pn = AC.createStereoPanner ? AC.createStereoPanner() : null; src.buffer = buf;
      g.gain.value = 1.6 * L.v; src.connect(g); if (pn) { pn.pan.value = L.pan * 0.8; g.connect(pn); pn.connect(window.mobDst ? mobDst() : master); } else g.connect(window.mobDst ? mobDst() : master);
      cur = {a, src, g, pn, t0: AC.currentTime}; src.onended = () => { if (cur && cur.src === src) cur = null; cdUntil = now() + CD; };
      src.start(); U.plays++; U.last = why; return true; } catch (e) { ERR(e); cur = null; return false; } }
  function follow() { if (!cur) return; const a = cur.a; if (!a.g || mobs.indexOf(a) < 0) { try { cur.g.gain.setTargetAtTime(0, now(), 0.15); cur.src.stop(now() + 0.6); } catch (_) {} cur = null; cdUntil = now() + CD; return; }
    const L = level(a); try { cur.g.gain.setTargetAtTime(1.6 * L.v, now(), 0.08); if (cur.pn) cur.pn.pan.setTargetAtTime(L.pan * 0.8, now(), 0.08); } catch (_) {} }
  function tick(dt) { try { jawTick(dt); } catch (e) { ERR(e); } if (!AC) return; load(); follow(); if (!buf || !started) return;
    const S = window.__c144, en = S ? S.spawned | 0 : 0, hatched = eggN >= 0 && en !== eggN; eggN = en;
    for (const a of mobs) { if (!a || a.kind !== KIND || !a.g) continue; const d = Math.hypot(a.g.position.x - P.x, a.g.position.y - P.y, a.g.position.z - P.z);
      if (!a.__c158) { a.__c158 = {seen: false, egg: hatched && d < 24}; }
      const s = a.__c158; if (d > RESET) s.seen = false;
      if (s.egg) { if (!cur) { s.egg = false; s.seen = true; play(a, 'egg'); } continue; }
      if (dead || paused) continue;
      if (!s.seen && d < NOTICE && now() >= cdUntil) { if (play(a, 'notice')) s.seen = true; }
      else if (s.seen && d < IDLE && now() >= cdUntil) play(a, 'loop');   /* v1.0.28: his line repeats every ~10 s while you stay near */ } }
  U.play = (why) => { const a = mobs.find(m => m.kind === KIND); return a ? play(a, why || 'test') : false; }; U.state = () => ({buf: !!buf, playing: !!cur, cd: Math.max(0, cdUntil - now())});
  try { const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments); try { tick(dt || 0); } catch (e) { ERR(e); } return r; }; } catch (e) { ERR(e); }
})();
