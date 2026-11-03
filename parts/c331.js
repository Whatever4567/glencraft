/* GLX-C331 (v1.1.35): NO FLAT SEA PICTURE IN YOUR WAY. The painted sea sheet round the island (C320 and C326) is only a stand-in for water
   far away. Near you the real block water and land are drawn by the chunk mesher, so the sheet now has a hole cut round you the size of the
   near block area: you see the real water, the real sea bed and the real coast when you stand at the shore, swim or fly low. */
(function c331() {
  const U = window.__c331 = {err: null, n: 0};
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent) || (typeof PERF !== 'undefined' && PERF), RN = PH ? 2 : 3;
  const uP = {value: new THREE.Vector3()}, uN = {value: new THREE.Vector3(0, 1, 0)}, uR = {value: 0};
  function hook(m) { if (!m || m.userData.c331) return; m.userData.c331 = 1; U.n++; const ob = m.onBeforeCompile;
    m.onBeforeCompile = function (sh) { if (ob) ob.apply(this, arguments); sh.uniforms.uP331 = uP; sh.uniforms.uN331 = uN; sh.uniforms.uR331 = uR;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW331;').replace('#include <project_vertex>', '#include <project_vertex>\nvW331 = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vW331; uniform vec3 uP331; uniform vec3 uN331; uniform float uR331;')
        .replace('void main() {', 'void main() {\n vec3 d331 = vW331 - uP331; d331 -= dot(d331, uN331) * uN331; if (length(d331) < uR331) discard;'); };
    m.needsUpdate = true; }
  const tick = () => { try { if (typeof scene === 'undefined') return; for (const n of ['sea320', 'floor320', 'seaBall320', 'floorBall320']) { const o = scene.getObjectByName(n); if (o) [].concat(o.material).forEach(hook); }   // v1.1.37: round Earth sheets too
      const w = window.__c321 && __c321.pw ? __c321.pw() : {x: P.x, y: P.y, z: P.z}, c = __c320.E(), d = [w.x - c[0], w.y - c[1], w.z - c[2]], dl = Math.hypot(d[0], d[1], d[2]) || 1;
      uP.value.set(w.x, w.y, w.z); uN.value.set(d[0] / dl, d[1] / dl, d[2] / dl); const alt = __c320.alt(w.x, w.y, w.z);
      uR.value = alt < 140 ? RN * CH - CH / 2 - 1 : 0; } catch (e) { if (!U.err) U.err = String(e && e.stack || e).slice(0, 300); } };
  try { const rd = renderer.render; renderer.render = function (s) { if (s === scene) tick(); return rd.apply(this, arguments); }; } catch (e) { U.err = 'wrap ' + e; }
})();
