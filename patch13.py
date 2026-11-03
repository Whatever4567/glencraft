s=open('s1.js').read()
def R(a,b,n=1):
    global s
    assert s.count(a)==n,(a,s.count(a)); s=s.replace(a,b)
R("const SET = {sens: 1.8, pad: 1.8, sfx: 0.8, music: 0.6, fov: 75, bob: 1};","const SET = {sens: 1.8, pad: 1.8, sfx: 0.8, music: 0.6, fov: 75, bob: 1, touch: 'auto', perf: 0};")
R("function saveSet() { try { localStorage.setItem('glen_set', JSON.stringify(SET)); } catch (_) {} }",
  "function saveSet() { try { localStorage.setItem('glen_set', JSON.stringify(SET)); } catch (_) {} }\n// GLX-B7: one version string, bump on every push\nconst GAME_VERSION = 'v0.7.0 \\u2022 b7';\nconst PERF = !!SET.perf;   // Performance mode (read once at boot; toggling reloads)")
R("{canvas, antialias: HIGH, powerPreference","{canvas, antialias: HIGH && !PERF, powerPreference")
R("renderer.setPixelRatio(HIGH ? DPR : Math.min(DPR, 1.5));","renderer.setPixelRatio(PERF ? Math.max(0.55, Math.min(DPR, 1.5) * 0.7) : HIGH ? DPR : Math.min(DPR, 1.5));")
R("scene.fog = new THREE.Fog(0xb9c6c9, 14, 52);","scene.fog = new THREE.Fog(0xb9c6c9, PERF ? 10 : 14, PERF ? 34 : 52);")
R("    : new THREE.MeshPhongMaterial({map: tex(key), shininess: 2, specular: 0x000000});","    : PERF ? new THREE.MeshLambertMaterial({map: tex(key)}) : new THREE.MeshPhongMaterial({map: tex(key), shininess: 2, specular: 0x000000});")
R("for (let i = 0; i < (HIGH ? 8 : 5); i++) { const l = new THREE.PointLight","for (let i = 0; i < (PERF ? 2 : HIGH ? 8 : 5); i++) { const l = new THREE.PointLight")
R("    if (dist > 30 && a.kind !== 'treeman'","    if (dist > (PERF ? 16 : 30) && a.kind !== 'treeman'")
R("  n = n || 12; spread = spread || 1;","  n = n || 12; spread = spread || 1; if (PERF) n = Math.ceil(n / 2);")
R("  for (let i = 0; i < (count || 18); i++) {\n    const m = new THREE.Mesh(mistGeo","  for (let i = 0; i < Math.ceil((count || 18) / (PERF ? 2 : 1)); i++) {\n    const m = new THREE.Mesh(mistGeo")
R("charR.shadowMap.enabled = true;","charR.shadowMap.enabled = !PERF;")
# light cap instead of removing lights (removing lights recompiles every lit material)
R("const want = list.slice(0, torchLights.length),","const want = list.slice(0, Math.min(torchLights.length, torchCap)),")
R("      while (torchLights.length > keep) { const l = torchLights.pop(); scene.remove(l); }","      torchCap = keep;   // lights stay in the scene at intensity 0: changing the light count recompiles every shader")
R("var perfGuard = {ema: 60, lowT: 0, step: 0};","var perfGuard = {ema: 60, lowT: 0, step: 0};\nvar torchCap = 99;")
# rays: no per-frame allocations
R("""  const toSun = sunV.clone().sub(camera.position).normalize();
  const camF = new THREE.Vector3(); camera.getWorldDirection(camF);""","""  const toSun = raySun.copy(sunV).sub(camera.position).normalize();
  const camF = rayCamF; camera.getWorldDirection(camF);""")
R("  const p = sunV.clone().project(camera);","  const p = rayP.copy(sunV).project(camera);")
R("const sunV = new THREE.Vector3();","const sunV = new THREE.Vector3(), raySun = new THREE.Vector3(), rayCamF = new THREE.Vector3(), rayP = new THREE.Vector3();")
# mob material upgrade re-uploaded 1024px textures on every spawn
R("    if (n.map) { n.map.anisotropy = Math.max(n.map.anisotropy || 1, HIGH ? 8 : 4); n.map.needsUpdate = true; }",
  "    if (n.map) { const an = HIGH ? 8 : 4; if ((n.map.anisotropy || 1) < an) { n.map.anisotropy = an; n.map.needsUpdate = true; } }")
R("function upgradeMobMaterials(a) {\n","function upgradeMobMaterials(a) {\n  if (PERF) return;\n")
# 30 fps pacing in performance mode
R("""function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);""","""function frame(now) {
  if (PERF && now - last < 1000 / 30 - 4) { requestAnimationFrame(frame); return; }
  const dt = Math.min(0.05, (now - last) / 1000);""")
R("if (touchMode) { document.body.classList.add('touch'); setupTouch(); }","var touchReady = false;\nif (touchMode && SET.touch !== 'off') { document.body.classList.add('touch'); setupTouch(); touchReady = true; }")
s+=r'''

/* ===================== GLX-B7: version tag, touch-controls setting, performance mode ===================== */
(function versionTag() {
  const v = document.createElement('div'); v.id = 'verTag'; v.textContent = GAME_VERSION; v.setAttribute('data-testid', 'version-tag');
  v.style.cssText = 'position:absolute;left:12px;bottom:10px;font:600 13px system-ui,sans-serif;color:rgba(255,255,255,.75);text-shadow:0 1px 3px #000;pointer-events:none;z-index:5';
  ($('scr-title') || document.body).appendChild(v);
})();
var touchShown = touchMode, padSeen = false;
function applyTouch() {
  const want = SET.touch === 'on' ? true : SET.touch === 'off' ? false : touchShown;
  if (want && !touchReady) { try { setupTouch(); } catch (_) {} touchReady = true; }
  document.body.classList.toggle('touch', !!want);
}
window.addEventListener('gamepadconnected', () => { padSeen = true; touchShown = false; applyTouch(); });
window.addEventListener('touchstart', () => { if (!touchShown) { touchShown = true; applyTouch(); } }, {passive: true, capture: true});
(function hookPadForTouch() {
  const base = readPad;
  readPad = function () {
    const r = base.apply(this, arguments);
    if (touchShown && navigator.getGamepads) {
      for (const gp of navigator.getGamepads()) if (gp && (gp.buttons.some(b => b && b.pressed) || gp.axes.some(a => Math.abs(a) > 0.4))) { touchShown = false; applyTouch(); break; }
    }
    return r;
  };
})();
(function settingsRows() {
  const q = $('qSeg2'); if (!q) return;
  const row = q.closest('.set');
  const mk = (label, id, opts) => {
    const d = document.createElement('div'); d.className = 'set inline';
    d.innerHTML = '<span>' + label + '</span><div class="seg" id="' + id + '">' + opts.map(([v, t]) => '<button data-v="' + v + '" data-testid="settings-' + id + '-' + v + '">' + t + '</button>').join('') + '</div>';
    return d;
  };
  const perfRow = mk('Performance mode', 'perfSeg', [['1', 'On'], ['0', 'Off']]);
  const touchRow = mk('Touch controls', 'touchSeg', [['auto', 'Auto'], ['on', 'On'], ['off', 'Off']]);
  row.after(perfRow); perfRow.after(touchRow);
  touchRow.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { SET.touch = b.dataset.v; saveSet(); applyTouch(); syncSettingsUI(); }));
  perfRow.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const v = Number(b.dataset.v); if (v === (SET.perf ? 1 : 0)) return;
    if (started && !confirm('Changing performance mode restarts the game. Continue?')) return;
    if (started) { try { saveWorld(true); } catch (_) {} }
    SET.perf = v; saveSet(); location.reload();
  }));
  const baseSync = syncSettingsUI;
  syncSettingsUI = function () {
    baseSync.apply(this, arguments);
    document.querySelectorAll('#touchSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === SET.touch));
    document.querySelectorAll('#perfSeg button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === (SET.perf ? 1 : 0)));
  };
  syncSettingsUI();
})();
applyTouch();
// warm the shader cache once the world is up so the first torch / mob / drop doesn't stall a frame compiling
(function warmShaders() {
  let done = false;
  const tick = () => { if (done) return; if (started) { done = true; setTimeout(() => { try { renderer.compile(scene, camera); } catch (_) {} }, 300); return; } setTimeout(tick, 500); };
  tick();
})();
'''
open('s1.js','w').write(s)
