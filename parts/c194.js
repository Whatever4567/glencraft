/* ===================== GLX-C194 (v1.0.37): louder mob voices - gentler distance falloff for every mob call, and a soft limiter on the final output so the louder voices never clip ===================== */
(function c194() {
  const U = window.__c194 = {lim: 0, calls: 0, err: null};
  // ---- one gentle limiter right before the speakers: everything that connects to the destination goes through it ----
  const NATIVE = AudioNode.prototype.connect; let LIM = null, LAC = null;
  function lim() { if (!AC) return null; if (LIM && LAC === AC) return LIM;
    try { LIM = AC.createDynamicsCompressor(); LIM.threshold.value = -4; LIM.knee.value = 6; LIM.ratio.value = 12; LIM.attack.value = 0.003; LIM.release.value = 0.25; NATIVE.call(LIM, AC.destination); LAC = AC; U.lim++; } catch (e) { U.err = String(e); LIM = null; }
    return LIM; }
  const prev = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (t) { try { if (AC && t === AC.destination && this !== LIM) { const L = lim(); if (L) arguments[0] = L; } } catch (_) {} return prev.apply(this, arguments); };
  // ---- mob calls through sfx3d: reach 40% further and fade gently (was a steep (1-d/r)^1.4) ----
  const MOB = new Set(['growl', 'squeal', 'scream', 'baa', 'roar', 'groan', 'quack', 'chirp', 'oink', 'oink2', 'snort']);
  try { const s3 = sfx3d; sfx3d = function (kind, pos, radius) {
      if (!MOB.has(kind) || !AC || !pos) return s3.apply(this, arguments);
      const R = (radius || 16) * 1.4, dx = pos.x - P.x, dy = pos.y - P.y, dz = pos.z - P.z, d = Math.hypot(dx, dy, dz); if (d > R) return;
      const vol = Math.pow(1 - d / R, 0.85), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw), pan = d > 0.1 ? (dx * rx + dz * rz) / d : 0; U.calls++;
      return playSound(kind, vol, pan * 0.85); }; } catch (e) { U.err = String(e); }
  U.limNode = () => LIM;
})();
