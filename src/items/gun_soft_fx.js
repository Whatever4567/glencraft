/* GLX-GFX (v1.1.57): no square shot particles. Every puff made while a gun fires (the muzzle, the smoke line, the impact and the hit)
   is a round soft sprite instead of a cube: warm colours are glowing fire sparks (additive), grey ones are soft smoke wisps that rise
   and fade, the impact gives sparks plus dust puffs. A small pool is reused so phones stay smooth. */
(function gfx() {
  const U = window.__gfx = {err: null, n: 0, cubes: 0}; let on = 0;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(cv), pool = [], live = [], MAX = 90;
  function get(add) { let s = pool.find(q => !q.visible && q.userData.add === add); if (!s) { if (live.length >= MAX) return null; s = new THREE.Sprite(new THREE.SpriteMaterial({map: tex, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending})); s.userData.add = add; s.renderOrder = 3; pool.push(s); scene.add(s); } s.visible = true; live.push(s); return s; }
  function puff(x, y, z, col, n, sp) { const c = new THREE.Color(col), hsl = {}; c.getHSL(hsl); const warm = hsl.s > 0.3 && hsl.h < 0.17 && hsl.l > 0.45;
    for (let i = 0; i < Math.min(n || 6, 16); i++) { const s = get(warm); if (!s) return; U.n++; const d = s.userData; s.position.set(x, y, z); s.material.color.copy(c);
      const a = Math.random() * 6.28, r = (sp || 0.4) * (0.5 + Math.random());
      d.v = new THREE.Vector3(Math.cos(a) * r, (warm ? 0.4 : 0.6) + Math.random() * (warm ? 1.2 : 0.5), Math.sin(a) * r).multiplyScalar(warm ? 2.2 : 0.8);
      d.life = d.max = warm ? 0.18 + Math.random() * 0.15 : 0.6 + Math.random() * 0.6; d.s0 = warm ? 0.06 + Math.random() * 0.05 : 0.12 + Math.random() * 0.12; d.grow = warm ? 0.3 : 1.6; d.warm = warm; } }
  try { const b0 = burst; burst = function (x, y, z, col, n, sp) { let gh = 0; try { gh = GUN[selId] && cnt(selId) > 0; } catch (_) {} if (on || gh) { try { puff(x, y, z, col, n, sp); } catch (e) { if (!U.err) U.err = String(e); } return; } return b0.apply(this, arguments); }; } catch (e) { U.err = String(e); }
  try { const f0 = fireGun; fireGun = function () { on++; try { return f0.apply(this, arguments); } finally { on--; } }; } catch (e) { U.err = String(e); }
  try { const uh = updateHand; updateHand = function (dt) { const r = uh.apply(this, arguments); try { const t = Math.min(0.05, dt || 0.016);
      for (let i = live.length - 1; i >= 0; i--) { const s = live[i], d = s.userData; d.life -= t; if (d.life <= 0) { s.visible = false; live.splice(i, 1); continue; }
        const k = d.life / d.max; s.position.addScaledVector(d.v, t); d.v.multiplyScalar(d.warm ? 0.9 : 0.96); if (!d.warm) d.v.y += 0.4 * t; s.scale.setScalar(d.s0 * (1 + (1 - k) * d.grow * 3)); s.material.opacity = d.warm ? k : k * 0.45; } } catch (_) {} return r; }; } catch (_) {}
})();
