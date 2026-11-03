s=open('s1.js').read()
def R(a,b,c=1):
    global s
    n=s.count(a); assert n==c,(n,a[:70]); s=s.replace(a,b)
# ---- audio: separate music gain node + lazy menu-theme.mp3
R("""function applyMusicVol() { if (!musicFade) music.volume = clamp(SET.music, 0, 1); }
function playMusic() {
  if (!musicWanted || !music.src) return;
  applyMusicVol();
  const p = music.play(); if (p && p.catch) p.catch(() => {});
}
function fadeMusic() {
  musicWanted = false; clearInterval(musicFade);
  musicFade = setInterval(() => { music.volume = Math.max(0, music.volume - 0.05); if (music.volume <= 0.01) { music.pause(); clearInterval(musicFade); musicFade = null; } }, 80);
}""",
"""// GLX-B3: music runs through its own gain node (separate from the SFX 'master' gain)
let musicGain = null, musicLvl = 0, musicProbe = null;
function hookMusic() {
  if (musicGain || !AC) return;
  try { const n = AC.createMediaElementSource(music); musicGain = AC.createGain(); musicGain.gain.value = 0; n.connect(musicGain); musicGain.connect(AC.destination); music.volume = 1; applyMusicVol(); } catch (_) { musicGain = null; }
}
function applyMusicVol() {
  const v = clamp(SET.music, 0, 1) * musicLvl;
  if (musicGain) { try { musicGain.gain.setTargetAtTime(v, AC.currentTime, 0.06); } catch (_) { musicGain.gain.value = v; } }
  else music.volume = clamp(v, 0, 1);
}
// the menu theme: 'menu-theme.mp3' next to index.html is used when present (loaded lazily); otherwise the built-in track, or silence
function probeMusic() {
  if (musicProbe) return musicProbe;
  musicProbe = (location.protocol.indexOf('http') === 0 ? fetch('menu-theme.mp3', {method: 'HEAD', cache: 'no-cache'}).then(r => r.ok, () => false) : Promise.resolve(false))
    .then(ok => { if (ok) { music.src = 'menu-theme.mp3'; music.load(); } return ok; });
  return musicProbe;
}
music.addEventListener('error', () => { if (music.src.indexOf('menu-theme') >= 0 && MUSIC_SRC.indexOf('data:') === 0) { music.src = MUSIC_SRC; if (musicWanted) playMusic(); } });
function playMusic() {
  if (!musicWanted) return;
  probeMusic().then(() => {
    if (!musicWanted || !music.src) return;
    hookMusic();
    const p = music.play(); if (p && p.catch) p.catch(() => {});
    clearInterval(musicFade);
    musicFade = setInterval(() => { musicLvl = Math.min(1, musicLvl + 0.05); applyMusicVol(); if (musicLvl >= 1) { clearInterval(musicFade); musicFade = null; } }, 80);
  });
}
function fadeMusic() {
  musicWanted = false; clearInterval(musicFade);
  musicFade = setInterval(() => { musicLvl = Math.max(0, musicLvl - 0.05); applyMusicVol(); if (musicLvl <= 0.01) { music.pause(); clearInterval(musicFade); musicFade = null; } }, 80);
}""")
# ---- IndexedDB worlds
R("""function worldList() { try { return JSON.parse(localStorage.getItem(WORLD_INDEX) || '[]'); } catch (_) { return []; } }""",
"""// GLX-B3: worlds live in IndexedDB under a fixed name (same for every build / URL path on this site), localStorage is only a backup
const SAVE_DB = 'glencraft-saves', SAVE_VER = 2;
let idbP = null, worldCache = null;
function idbOpen() {
  if (idbP) return idbP;
  idbP = new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error('no indexedDB'));
    const r = indexedDB.open(SAVE_DB, 1);
    r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('worlds')) d.createObjectStore('worlds'); if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  idbP.catch(() => {});
  return idbP;
}
function idbDo(store, mode, fn) {
  return idbOpen().then(d => new Promise((res, rej) => { const t = d.transaction(store, mode), q = fn(t.objectStore(store)); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }));
}
const idbGet = (st, k) => idbDo(st, 'readonly', o => o.get(k)).catch(() => undefined);
const idbPut = (st, k, v) => idbDo(st, 'readwrite', o => o.put(v, k));
const isGold = w => !!w && w.mode !== 'creative';
function lsList() { try { return JSON.parse(localStorage.getItem(WORLD_INDEX) || '[]'); } catch (_) { return []; } }
function mergeLists(a, b) {
  const m = new Map();
  for (const w of [...(a || []), ...(b || [])]) { if (!w || !w.id) continue; const o = m.get(w.id); if (!o || (w.updated || 0) > (o.updated || 0)) m.set(w.id, w); }
  return [...m.values()].map(w => Object.assign(w, {gold: isGold(w)})).sort((x, y) => (y.updated || 0) - (x.updated || 0));
}
function worldList() { return worldCache || lsList(); }
function writeIndex() { const l = worldList(); try { localStorage.setItem(WORLD_INDEX, JSON.stringify(l)); } catch (_) {} return idbPut('meta', 'index', l).catch(() => {}); }
// load the index at boot and move any older localStorage-only worlds into IndexedDB
const worldsReady = idbGet('meta', 'index').then(async idx => {
  worldCache = mergeLists(idx || [], lsList());
  for (const w of worldCache) {
    const have = await idbGet('worlds', w.id);
    if (!have) { try { const d = JSON.parse(localStorage.getItem('glen_w_' + w.id) || 'null'); if (d) await idbPut('worlds', w.id, d); } catch (_) {} }
  }
  await writeIndex();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if (typeof screen !== 'undefined' && screen === 'worlds') renderWorlds();
}).catch(() => { worldCache = lsList(); });
// Gold worlds can never be deleted. There is deliberately no delete button; this guard stops any code path doing it.
function deleteWorld(id) {
  const w = worldList().find(x => x.id === id);
  if (!w || isGold(w)) { toast('Gold worlds are permanent and can never be deleted'); return false; }
  worldCache = worldList().filter(x => x.id !== id); writeIndex();
  idbDo('worlds', 'readwrite', o => o.delete(id)).catch(() => {}); try { localStorage.removeItem('glen_w_' + id); } catch (_) {}
  return true;
}""")
R("""  return {v: 1, id: current.id,""","""  return {v: SAVE_VER, build: 'b3', id: current.id,""")
R("""    const data = serialize();
    localStorage.setItem('glen_w_' + current.id, JSON.stringify(data));
    const list = worldList().filter(w => w.id !== current.id);
    list.unshift({id: current.id, name: current.name, mode: current.mode, created: current.created, updated: data.updated, day: dayNum, gold: true});
    localStorage.setItem(WORLD_INDEX, JSON.stringify(list));
    if (!quiet) showSaving();
    return true;
  } catch (e) { toast('Could not save: this device is out of storage space'); return false; }""",
"""    const data = serialize();
    const list = worldList().filter(w => w.id !== current.id);
    list.unshift({id: current.id, name: current.name, mode: current.mode, created: current.created, updated: data.updated, day: dayNum, gold: isGold(current), v: SAVE_VER});
    worldCache = list;
    let lsOk = true;
    try { localStorage.setItem('glen_w_' + current.id, JSON.stringify(data)); } catch (_) { lsOk = false; try { localStorage.removeItem('glen_w_' + current.id); } catch (__) {} }
    let idbOk = !!window.indexedDB;
    idbPut('worlds', current.id, data).catch(() => { if (!lsOk) toast('Could not save: this device is out of storage space'); });
    writeIndex();
    if (!lsOk && !idbOk) { toast('Could not save: this device is out of storage space'); return false; }
    if (!quiet) showSaving();
    return true;
  } catch (e) { toast('Could not save: ' + (e && e.message || e)); return false; }""")
# tolerant loader
R("""  setWorldSize(d.W || 40); dirtyAll = true;
  rleDecode(d.world, world);""","""  // tolerant of saves from any older build: every field is optional except the block data
  d = Object.assign({inv: null, hp: 20, food: 20, sat: 5, dayClock: 0.3, dayNum: 1}, d);
  if (!(d.v >= 1)) d.v = 1;
  setWorldSize(d.W || 40); dirtyAll = true;
  try { rleDecode(d.world, world); } catch (e) { console.warn('world data damaged, regenerating terrain', e); generate(); placeTrees(); placeDecor(); }
  if (typeof d.hp !== 'number' || !(d.hp > 0)) d.hp = 20;""")
R("""function playWorld(w) {
  let d = null;
  try { d = JSON.parse(localStorage.getItem('glen_w_' + w.id) || 'null'); } catch (_) {}
  if (!d) { toast('That world could not be read'); return; }""","""async function playWorld(w) {
  let d = null, l = null;
  try { d = await idbGet('worlds', w.id); } catch (_) {}
  try { l = JSON.parse(localStorage.getItem('glen_w_' + w.id) || 'null'); } catch (_) {}
  if (l && (!d || (l.updated || 0) > (d.updated || 0))) d = l;   // use whichever copy is newest
  if (!d || !d.world) { toast('That world could not be read'); return; }""")
R("""setInterval(() => { if (started && !dead && performance.now() - lastAutosave > 10 * 60 * 1000) { lastAutosave = performance.now(); saveWorld(); } }, 5000);""",
  """setInterval(() => { if (started && !dead && performance.now() - lastAutosave > 60 * 1000) { lastAutosave = performance.now(); saveWorld(); } }, 5000);""")
# worlds list rendering: gold only for survival
R("""    make('<span class="gold">GOLD</span><b>' + escapeHtml(w.name) + '</b><small>' + (w.mode === 'creative' ? 'Creative' : 'Survival') + ' · Day ' + (w.day || 1) + ' · ' + d.toLocaleDateString() + '</small>', 'world', () => playWorld(w), 'world-tile-' + w.id);""",
"""    const g = isGold(w);
    make((g ? '<span class="gold">&#9733; GOLD</span>' : '<span class="gold cre">CREATIVE</span>') + '<b>' + escapeHtml(w.name) + '</b><small>' + (g ? 'Survival · permanent' : 'Creative') + ' · Day ' + (w.day || 1) + ' · ' + d.toLocaleDateString() + '</small>', 'world' + (g ? ' goldw' : ''), () => playWorld(w), 'world-tile-' + w.id);""")
R("""function showScreen(name) {
  screen = name;""","""function showScreen(name) {
  screen = name;
  if (name === 'worlds' && !worldCache) worldsReady.then(() => { if (screen === 'worlds') renderWorlds(); });""")
# ---- loading screen: real readiness
R("""  const bar = $('loadW').firstChild, tip = $('loadTip');
  let i = 0;
  const tick = setInterval(() => {
    i++; bar.style.width = Math.min(100, i / LOAD_STEPS.length * 100) + '%';
    tip.textContent = LOAD_STEPS[Math.min(i, LOAD_STEPS.length - 1)] + '...';
    if (i === 2) {""","""  const bar = $('loadW').firstChild, tip = $('loadTip'), pct = $('loadPct');
  let i = 0, shown = 0, target = 0, t0 = performance.now(), ready = false;
  // GLX-B3: the bar eases toward the real progress and only finishes when every chunk mesh around spawn is built and the GPU has compiled it
  const anim = () => { shown += (target - shown) * 0.12; bar.style.width = shown.toFixed(1) + '%'; if (pct) pct.textContent = Math.round(shown) + '%'; if (screen === 'loading') requestAnimationFrame(anim); };
  requestAnimationFrame(anim);
  const chunksReady = () => {
    if (dirtyAll || dirtyCh.size) return false;
    const pcx = Math.floor(P.x / CH), pcz = Math.floor(P.z / CH);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const cx = pcx + a, cz = pcz + b; if (cx < 0 || cz < 0 || cx * CH >= W || cz * CH >= D) continue; if (!chunkObjs.has(cx * 64 + cz)) return false; }
    return true;
  };
  const tick = setInterval(() => {
    if (i <= LOAD_STEPS.length) i++;
    target = Math.min(i, LOAD_STEPS.length) / (LOAD_STEPS.length + 1) * 100;
    tip.textContent = LOAD_STEPS[Math.min(i, LOAD_STEPS.length - 1)] + '...';
    if (i === 2) {""")
R("""    if (i > LOAD_STEPS.length) {
      clearInterval(tick);""","""    if (i > LOAD_STEPS.length && !ready) {
      if (!chunksReady()) { if (dirtyAll || dirtyCh.size) rebuild(); tip.textContent = 'Building the land around you...'; return; }
      ready = true;
      try { renderer.compile(scene, camera); renderer.render(scene, camera); } catch (_) {}
      target = 100; tip.textContent = 'Ready!';
      return;
    }
    if (ready && shown > 98.5) {
      clearInterval(tick);""")
open('s1.js','w').write(s)
