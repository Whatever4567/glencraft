/* v1.2.44: adaptive 4K UHD scaler REMOVED.
 * 4K UHD renders exactly as in 1.2.41 on all devices (no weak-boot cap, no
 * dynamic pixel-ratio / shadow / view-distance scaler). This stub keeps the
 * symbol so old callers do not throw, but it never changes renderer state. */
(function adaptive4k1242(W) {
  'use strict';
  const U = W.__adapt4k1242 = W.__adapt4k1242 || {version: '1.2.44', err: null, on: 0, disabled: 1};
  U.pickTier = function () { return 'full'; };
  U.capsFor = function () {
    const dpr = (typeof DPR !== 'undefined' ? DPR : (W.devicePixelRatio || 1)) || 1;
    return {tier: 'full', prMax: dpr, prMin: Math.min(dpr, 1), shadow: 2048, rdist: 8, particles: 1, aa: 1};
  };
  U.applyTier = function () { U.on = 0; U.disabled = 1; };
  U.tick = function () { /* no-op: 1.2.41 4K path */ };
  U.install = function () { U.on = 0; U.disabled = 1; return U; };
  // Do not wrap resize / updateLights / frame.
  U.install();
})(typeof window !== 'undefined' ? window : this);
