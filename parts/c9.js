
/* ===================== GLX-D4 (v0.9.9): in-game soundtrack - shuffle bag with Minecraft-like silences ===================== */
var BGM = {mode: '', bag: [], gapUntil: 0, cur: null, orig: null,
  tracks: [{id: 'orig', src: null}, {id: 'theme_ext', src: 'music/glencraft_theme_extended.mp3'}, {id: 'dawn', src: 'music/glen_dawn.mp3'},
    {id: 'loch', src: 'music/loch_night.mp3', night: 1}, {id: 'air', src: 'music/heather_air.mp3'}, {id: 'cave', src: 'music/under_the_glen.mp3', cave: 1}]};
function bgmPick() {
  if (!BGM.bag.length) { BGM.bag = BGM.tracks.map(t => t.id).filter(id => id !== (BGM.cur && BGM.cur.id)); }
  const under = typeof caveK === 'number' && caveK > 0.5, night = typeof isNight !== 'undefined' && isNight;
  let id = null;
  if (under && BGM.bag.includes('cave')) id = 'cave';
  else {
    let pool = BGM.bag.filter(i => i !== 'cave' || under || BGM.bag.length === 1);
    if (!pool.length) pool = BGM.bag.slice();
    if (night && pool.includes('loch') && Math.random() < 0.5) id = 'loch'; else id = pool[Math.floor(Math.random() * pool.length)];
  }
  BGM.bag.splice(BGM.bag.indexOf(id), 1);
  return BGM.tracks.find(t => t.id === id);
}
function bgmStart(t) {
  BGM.cur = t; music.loop = false; const src = t.id === 'orig' ? BGM.orig : t.src;
  if (!src) { BGM.gapUntil = performance.now() + 5000; return; }
  if (music.src.indexOf(src) < 0 && music.src !== src) { music.src = src; music.load(); }
  else music.currentTime = 0;
  musicLvl = 0; musicWanted = true; playMusic();
}
function bgmTick() {
  if (!BGM.orig && music.src) BGM.orig = music.src.indexOf('music/') < 0 ? music.src : BGM.orig;
  if (!started) {
    if (BGM.mode !== 'menu') { BGM.mode = 'menu'; music.loop = true; if (BGM.orig && music.src !== BGM.orig) { music.src = BGM.orig; music.load(); } musicLvl = 0; musicWanted = true; if (AC) playMusic(); }
    return;
  }
  const now = performance.now();
  if (BGM.mode !== 'game') { BGM.mode = 'game'; fadeMusic(); BGM.cur = null; BGM.gapUntil = now + (20 + Math.random() * 25) * 1000; return; }
  const playing = !music.paused && !music.ended && musicWanted;
  if (playing) return;
  if (BGM.cur && (music.ended || !musicWanted) && BGM.gapUntil < now - 1000 && BGM.ended !== BGM.cur) { BGM.ended = BGM.cur; BGM.gapUntil = now + (60 + Math.random() * 120) * 1000; }   // Minecraft-like silence 1-3 min
  if (now >= BGM.gapUntil && AC && document.visibilityState !== 'hidden') { const t = bgmPick(); BGM.ended = null; bgmStart(t); BGM.gapUntil = now + 4000; }
}
music.addEventListener('ended', () => { if (started) { BGM.ended = BGM.cur; BGM.gapUntil = performance.now() + (60 + Math.random() * 120) * 1000; musicWanted = false; } });
music.addEventListener('error', () => { if (started && BGM.cur && BGM.cur.id !== 'orig') { musicWanted = false; BGM.ended = BGM.cur; BGM.gapUntil = performance.now() + 15000; } });
setInterval(bgmTick, 1000);
