/* v1.1.83: the far sea ring and sea bed stop at the UK ice walls, so no water shows outside the UK. */
/* GLX-ONEW (v1.1.64): ONE WATER (item 39). The old flat sea ring from v0.9.13 sat one block higher than the real sea and had its own flat
   colour, which drew a seam line at the map edge. Now the ring uses the very same water material as the map and the UK sea (same texture,
   colour, waves and ripples), sits at the same water level, and has a hole cut round you where the real block water is drawn, so there is
   one water surface everywhere with no double layer. */
(function () {
  const U = window.__onew = {err: null, n: 0};
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent) || (typeof PERF !== 'undefined' && PERF);
  const uP = {value: new THREE.Vector3()}, uR = {value: 0};
  let M = null;
  function mat() { if (M) return M; const w = waterMat; try { if (w.map) { w.map.wrapS = w.map.wrapT = THREE.RepeatWrapping; w.map.needsUpdate = true; } } catch (_) {} M = new THREE.MeshPhongMaterial(); M.copy(w); M.name = 'oneWater';
    M.onBeforeCompile = function (sh, r) { if (w.onBeforeCompile) w.onBeforeCompile.call(this, sh, r); sh.uniforms.uP1w = uP; sh.uniforms.uR1w = uR;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW1w;').replace('#include <project_vertex>', '#include <project_vertex>\nvW1w = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vW1w; uniform vec3 uP1w; uniform float uR1w;')
        .replace('void main() {', 'void main() {\n if (vW1w.x < -1216.0 || vW1w.x > 1484.0 || vW1w.z < -628.0 || vW1w.z > 2756.0) discard; if (uR1w > 0.0 && max(abs(vW1w.x - uP1w.x), abs(vW1w.z - uP1w.z)) < uR1w) discard;'); };
    M.customProgramCacheKey = () => 'oneWater'; return M; }
  // under the far ring there was nothing, so the sky showed through the clear water and the far sea looked paler than the near sea
  // (which has a real sea bed under it). A sea bed sheet under the ring, with the same hole, makes the two read the same.
  let BED = null; function bed() { if (BED) return BED; const m = new THREE.MeshLambertMaterial({color: 0x1f4c6a}); m.onBeforeCompile = sh => { sh.uniforms.uP1w = uP; sh.uniforms.uR1w = uR; sh.uniforms.uWD1w = {value: new THREE.Vector2(W, D)};
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW1w;').replace('#include <project_vertex>', '#include <project_vertex>\nvW1w = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vW1w; uniform vec3 uP1w; uniform float uR1w; uniform vec2 uWD1w;')
        .replace('void main() {', 'void main() {\n if (vW1w.x < -1216.0 || vW1w.x > 1484.0 || vW1w.z < -628.0 || vW1w.z > 2756.0) discard; if (uR1w > 0.0 && max(abs(vW1w.x - uP1w.x), abs(vW1w.z - uP1w.z)) < uR1w) discard; if (vW1w.x > 0.0 && vW1w.z > 0.0 && vW1w.x < uWD1w.x && vW1w.z < uWD1w.y) discard;'); }; m.customProgramCacheKey = () => 'oneWaterBed';
    const g = new THREE.PlaneGeometry(12000, 12000); g.rotateX(-Math.PI / 2); BED = new THREE.Mesh(g, m); BED.name = 'oneWaterBed'; BED.renderOrder = -2; scene.add(BED); return BED; }
  function fix() { try { if (typeof seaRing === 'undefined' || !seaRing || !seaRing.visible) { if (BED) BED.visible = false; return; } const m = mat();
      for (const c of seaRing.children) if (c.material !== m) { c.material = m; U.n++; const g = c.geometry, p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) + c.position.x, -(p.getZ(i) + c.position.z)); uv.needsUpdate = true; }
      seaRing.position.y = SEA - 0.1; seaRing.renderOrder = -1; const b = bed(); let cy = 0; try { cy = camera.getWorldPosition(new THREE.Vector3()).y; } catch (_) {} b.visible = cy < SEA + 60; b.position.set(W / 2, SEA - 14, D / 2);
      const flat = window.__c320 && __c320.flat, w = window.__c321 && __c321.pw ? __c321.pw() : P; uP.value.set(Math.floor(w.x / CH) * CH + CH / 2, 0, Math.floor(w.z / CH) * CH + CH / 2);
      // the real chunk water covers a square of chunks round you; cut the ring there (none of it shows inside the map anyway)
      const RN = PH ? 2 : 3; uR.value = flat ? RN * CH + CH / 2 - 1 : 0; } catch (e) { if (!U.err) U.err = String(e && e.stack || e).slice(0, 300); } }
  // the earth chunks draw the sea as whole water blocks, so from above you also saw their side walls at the edge of the drawn area and their
  // bottoms through the clear water (a darker, flat band). Keep only the top faces of the open sea there, like the map water.
  function tops(g) { const n = g.attributes.normal, ix = g.index; if (!n) return; const keep = []; const tri = ix ? ix.count / 3 : n.count / 3;
    for (let t = 0; t < tri; t++) { const a = ix ? ix.getX(t * 3) : t * 3, b = ix ? ix.getX(t * 3 + 1) : t * 3 + 1, c = ix ? ix.getX(t * 3 + 2) : t * 3 + 2; if (n.getY(a) > 0.5) keep.push(a, b, c); }
    g.setIndex(keep); g.userData.onew = 1; U.t = (U.t || 0) + 1; }
  setInterval(() => { try { if (!(window.__c320 && __c320.flat)) return; const r = scene.getObjectByName('earth324'); if (!r) return; r.traverse(o => { if (o.isMesh && o.material === waterMat && o.geometry && !o.geometry.userData.onew) tops(o.geometry); }); } catch (e) { if (!U.err) U.err = 'tops ' + e; } }, 300);
  try { const rd = renderer.render; renderer.render = function (s) { if (s === scene) fix(); return rd.apply(this, arguments); }; } catch (e) { U.err = 'wrap ' + e; }
})();
