import base64
s=open('s1.js').read()
def R(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:70]); s=s.replace(a,b)
b64=base64.b64encode(open('deepslate.jpeg','rb').read()).decode()
R('const TEX = {"diamond_ore":','const TEX = {"deepslate": "data:image/jpeg;base64,'+b64+'", "diamond_ore":')
R("const BASE = 25, H = 56, SEA = 6 + BASE;","// GLX-B7: 10 more layers of deep stone (DEEP) under everything; saves from 56-high worlds are shifted up on load\nconst DEEP = 10, BASE = 25 + DEEP, H = 56 + DEEP, SEA = 6 + BASE;")
R("TV:120, DIAMONDORE:69};","TV:120, DIAMONDORE:69, DEEPSLATE:133};")
R("91:'redstone_ore', 69:'diamond_ore'\n};","91:'redstone_ore', 69:'diamond_ore', 133:'deepslate'\n};")
R("const ICON_KEY = {69:'diamond_ore',","const ICON_KEY = {69:'diamond_ore', 133:'deepslate',")
R("const HARD = {69:3.4, ","const HARD = {69:3.4, 133:2.4, ")
R("const REQ = {69:3, ","const REQ = {69:3, 133:1, ")
R("const PLACEABLE = new Set([69,","const PLACEABLE = new Set([133,69,")
R("Object.assign(NAMES, {69: 'Diamond ore',","Object.assign(NAMES, {133: 'Deep slate', 69: 'Diamond ore',")
R("IT.DIAMOND, T.DIAMONDORE, IT.REDSTONE","IT.DIAMOND, T.DIAMONDORE, T.DEEPSLATE, IT.REDSTONE")
R("    if (getB(x, y, z) === T.STONE && y > 0) setB(x, y, z, ore);","    { const vb = getB(x, y, z); if ((vb === T.STONE || vb === T.DEEPSLATE) && y > 0) setB(x, y, z, ore); }")
R("[31, GATE.g - 26, 16], [24, 5, 21]];","[31, GATE.g - 26, 16], [24, 5 + DEEP, 21]];")
R("  carveBlob(24, 7, 21, 6.5, 3.6);","  carveBlob(24, 7 + DEEP, 21, 6.5, 3.6);")
R("    for (let y = 2; y < 9; y++) if (getB(x, y, z) === T.AIR","    for (let y = 2 + DEEP; y < 9 + DEEP; y++) if (getB(x, y, z) === T.AIR")
# deep layer + count-based iron/diamond
R("""  // ores: coal is common and shallow, copper mid-depth, iron deeper
  for (let x = 1;""","""  // GLX-B7: the deepest layers are dark deep slate (ragged boundary)
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const top = DEEP + 1 + Math.round(Math.sin(x * 0.45) * Math.cos(z * 0.38) * 1.5 + Math.random() * 0.8);
    for (let y = 1; y <= top; y++) if (world[idx(x, y, z)] === T.STONE) world[idx(x, y, z)] = T.DEEPSLATE;
  }
  // ores: coal is common and shallow, copper mid-depth, iron deeper
  for (let x = 1;""")
R("    if (world[idx(x, y, z)] !== T.STONE) continue;\n    const r = Math.random();","    if (world[idx(x, y, z)] !== T.STONE && world[idx(x, y, z)] !== T.DEEPSLATE) continue;\n    const r = Math.random();")
R("    else if (r < 0.0155 && y >= 2 && y <= BASE) vein(x, y, z, T.IRONORE, 3 + Math.floor(Math.random() * 4));","    else if (r < 0.0155 && y >= 2 && y <= BASE && false) vein(x, y, z, T.IRONORE, 3);")
R("    else if (r < 0.0203 && y >= 1 && y <= 6) vein(x, y, z, T.DIAMONDORE, 1 + Math.floor(Math.random() * 3));   // rare, small, deepest layers only",
  "")
R("""  // a few natural caves
  for (let c = 0;""","""  placeOreVeins(T.IRONORE, Math.round(52 * W * D / 3136), 2, BASE + 4, 3, 6);
  placeOreVeins(T.DIAMONDORE, Math.round(10 * W * D / 3136), 1, 12, 2, 5);
  // a few natural caves
  for (let c = 0;""")
R("    if (b === T.IRONORE || b === T.GOLDORE || b === T.DIAMONDORE) {","    if (b === T.GOLDORE) {")
R("function skyOpen(x, y, z) {","""// count-based ore placement so every world gets a dependable amount: n veins of lo..hi blocks between y0 and y1
function placeOreVeins(ore, n, y0, y1, lo, hi) {
  for (let v = 0, tries = 0; v < n && tries < n * 40; tries++) {
    const x = 2 + Math.floor(Math.random() * (W - 4)), z = 2 + Math.floor(Math.random() * (D - 4)), y = y0 + Math.floor(Math.random() * (y1 - y0 + 1));
    const b = getB(x, y, z); if (b !== T.STONE && b !== T.DEEPSLATE) continue;
    const want = lo + Math.floor(Math.random() * (hi - lo + 1));
    let px = x, py = y, pz = z, placed = 0;
    for (let i = 0; i < want * 4 && placed < want; i++) {
      const c = getB(px, py, pz); if ((c === T.STONE || c === T.DEEPSLATE) && py >= y0 && py <= y1) { setB(px, py, pz, ore); placed++; }
      const r = Math.floor(Math.random() * 6); px += r === 0 ? 1 : r === 1 ? -1 : 0; py += r === 2 ? 1 : r === 3 ? -1 : 0; pz += r === 4 ? 1 : r === 5 ? -1 : 0;
      px = clamp(px, 1, W - 2); pz = clamp(pz, 1, D - 2); py = clamp(py, 1, H - 2);
    }
    v++;
  }
}
function skyOpen(x, y, z) {""")
# saves
R("  return {v: SAVE_VER, build: 'b3', id: current.id,","  return {v: 3, build: 'b7', H, DEEP, id: current.id,")
R("""  setWorldSize(d.W || 40); dirtyAll = true;
  try { rleDecode(d.world, world); }""","""  setWorldSize(d.W || 40); dirtyAll = true;
  const oldH = d.H || 56, shift = H - oldH;
  if (shift > 0) upgradeDepth(d, shift);
  try { if (shift > 0) { const tmp = new Uint8Array(W * oldH * D); rleDecode(d.world, tmp); padWorld(tmp, oldH, shift); } else rleDecode(d.world, world); }""")
R("function applySave(d) {","""// GLX-B7: older 56-high saves: lift everything up by `shift` and generate fresh deep layers underneath
function shiftKey(k, s) { const p = String(k).split(','); if (p.length !== 3) return k; return p[0] + ',' + (Number(p[1]) + s) + ',' + p[2]; }
function upgradeDepth(d, s) {
  if (d.P) d.P.y = (d.P.y || 0) + s;
  if (d.spawnPt) d.spawnPt = [d.spawnPt[0], d.spawnPt[1] + s, d.spawnPt[2]];
  for (const f of ['crops', 'chests', 'doors', 'furnaces', 'entMeta', 'cauldrons']) if (Array.isArray(d[f])) d[f] = d[f].map(([k, v]) => [shiftKey(k, s), v]);
}
function padWorld(tmp, oldH, s) {
  world.fill(T.AIR);
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    for (let y = 0; y < oldH && y + s < H; y++) world[idx(x, y + s, z)] = tmp[(x * oldH + y) * D + z];
    for (let y = 0; y < s; y++) world[idx(x, y, z)] = T.DEEPSLATE;
    if (world[idx(x, s, z)] === T.AIR || world[idx(x, s, z)] === T.LAVA) world[idx(x, s, z)] = T.DEEPSLATE;
  }
  placeOreVeins(T.DIAMONDORE, Math.round(10 * W * D / 3136), 1, Math.min(12, s + 2), 2, 5);
  placeOreVeins(T.IRONORE, Math.round(12 * W * D / 3136), 1, s + 2, 3, 6);
}
function applySave(d) {""")
open('s1.js','w').write(s)
