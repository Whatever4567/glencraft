/* GLX-C258 (v1.0.69): desert soundtrack - walk into the sand and the music crossfades to an original Egyptian-style remix
   (oud and ney synths in the hijaz scale over a drone and maqsum hand drums, made for Glencraft). When the UFO shows up its own
   music takes over; leave the desert and the normal music fades back in. */
(() => {
  const U = window.__c258 = {err: null, mix: 0, want: 0, ok: 0, sand: 0};
  const SANDY = new Set([T.SAND, T.SANDSTONE, T.CACTUS, T.REDSAND, T.DEADBUSH].filter(v => v !== undefined));
  let buf = null, src = null, g = null, raw = null, chk = 0, last = performance.now();
  /* v1.0.78: desert tune: a loop made from the players own clip (v1.0.83) for the desert / temple biome */
  const load = () => { if (raw || buf) return; raw = 1; fetch('assets/music/desert2.ogg').then(r => r.ok ? r.arrayBuffer() : null).then(ab => { raw = ab; }).catch(() => { raw = null; }); };
  function dec() { if (!AC || !raw || raw === 1 || buf) return; const ab = raw; raw = 2; AC.decodeAudioData(ab, b => { buf = b; U.ok = 1; }, () => {}); }
  try { const am = applyMusicVol; applyMusicVol = function () { const l = musicLvl; musicLvl = l * (1 - U.mix); try { return am.apply(this, arguments); } finally { musicLvl = l; } }; } catch (e) { U.err = 'amv ' + e; }
  function topSand(x, z) { /* v1.0.83: the topmost block of the column, so flying high over the desert keeps the music; 4 s hold before it fades */ for (let y = H - 2; y > 1; y--) { const v = world[idx(x, y, z)]; if (v && !PLANT[v]) return SANDY.has(v); } return false; }
  /* v1.0.91: the desert tune belongs to the pyramid desert area only, not to every sand block (beaches, loch shores) */
  function inArea() { try { const m = __c208.MT(), r = (window.__g89 && __g89()) ? 140 * W / 864 : 150; return Math.hypot(P.x - m[0], P.z - m[1]) < r; } catch (_) { return true; } }
  U.inArea = inArea;
  function inDesert() { if (!inArea()) { U.sand = 0; return 0; } let n = 0; const px = Math.floor(P.x), pz = Math.floor(P.z); for (const [dx, dz] of [[0, 0], [7, 0], [-7, 0], [0, 7], [0, -7], [5, 5], [-5, 5], [5, -5], [-5, -5]]) if (topSand(px + dx, pz + dz)) n++; U.sand = n; return n; }
  function ufo() { try { return (window.__c246b && __c246b.on) || (window.__c246 && __c246.ufo && __c246.ufo()) || (window.__c248 && __c248.on24) || (window.__c259 && __c259.on); } catch (_) { return false; } }
  function tick() { const now = performance.now(), dt = Math.min(0.5, (now - last) / 1000); last = now;
    if (typeof started === 'undefined' || !started || typeof AC === 'undefined' || !AC) return;
    if ((chk -= dt) <= 0) { chk = 1; const n = inDesert(); if (n >= 6) U.want = 1; else if (n <= 2) { if ((U.out = (U.out || 0) + 1) >= 4) U.want = 0; } if (n > 2) U.out = 0; if (ufo()) U.want = 0; if (U.want) { load(); dec(); } }
    const tgt = U.want && buf ? 1 : 0, prev = U.mix; U.mix += Math.max(-dt / 4, Math.min(dt / 4, tgt - U.mix));
    if (U.mix > 0.001 && !src && buf) { g = AC.createGain(); g.gain.value = 0; g.connect(AC.destination); src = mkLoop(g); }
    if (src) src.feed();
    if (g) g.gain.value = U.mix * Math.max(0, Math.min(1, SET.music)) * 0.8;
    if (src && U.mix <= 0.001 && tgt === 0) { try { src.stop(); } catch (_) {} src = null; g = null; }
    /* v1.0.79: keep the main music crossfaded against the desert tune every tick, so other code can never bring it back on top */ if (prev !== U.mix || U.mix > 0.001 || U.was) { U.was = U.mix > 0.001 ? 1 : 0; try { applyMusicVol(); } catch (_) {} } }
  /* v1.0.84: endless desert music from one short clean loop - overlapping grains from random start points, 1.5 s crossfades,
     tiny pitch and level drift, so it never audibly repeats however long you stay */
  function mkGrains(out) { const live = [], X = 1.5; let next = AC.currentTime + 0.05, last = -1; U.grains = 0;
    function grain(t) { const D = buf.duration, len = 4.5 + Math.random() * 3.5, rate = 0.985 + Math.random() * 0.03, span = len * rate;
      let off; do { off = Math.random() * Math.max(0.01, D - span); } while (Math.abs(off - last) < 1.2 && D - span > 3); last = off;
      const s = AC.createBufferSource(), gg = AC.createGain(), lv = 0.85 + Math.random() * 0.15; s.buffer = buf; s.playbackRate.value = rate; s.connect(gg); gg.connect(out);
      gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(lv, t + X); gg.gain.setValueAtTime(lv, t + len - X); gg.gain.linearRampToValueAtTime(0, t + len);
      s.start(t, off); s.stop(t + len + 0.05); live.push(s); s.onended = () => { const i = live.indexOf(s); if (i >= 0) live.splice(i, 1); }; U.grains++; return t + len - X; }
    return {feed() { while (next < AC.currentTime + 2) next = grain(Math.max(next, AC.currentTime + 0.02)); }, stop() { for (const s of live.slice()) { try { s.stop(); } catch (_) {} } live.length = 0; }}; }
  /* v1.0.92: the players new desert track, TikTok sound cut, baked 1.5 s crossfade at the loop seam so it repeats smoothly forever */
  function mkLoop(out) { const s = AC.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(out); s.start(AC.currentTime + 0.05); U.grains = -1; return {feed() {}, stop() { try { s.stop(); } catch (_) {} }}; }
  U.reset = () => { try { if (src) src.stop(); } catch (_) {} src = null; g = null; buf = null; raw = null; U.ok = 0; };
  setInterval(() => { try { tick(); } catch (e) { if (!U.err) U.err = String(e).slice(0, 200); } }, 200);
})();
