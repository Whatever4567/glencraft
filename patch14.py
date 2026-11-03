import re, base64
s=open('s1.js').read()
def R(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a)); s=s.replace(a,b)
# ---------- textures ----------
def b64(f): return 'data:image/jpeg;base64,'+base64.b64encode(open('tex8/'+f,'rb').read()).decode()
for k in ['zombie_skin','bone_skin']:
    m=re.search(r'"%s": "data:image/[a-z]+;base64,[A-Za-z0-9+/=]+"'%k, s); assert m, k
    s=s[:m.start()]+'"%s": "%s"'%(k,b64(k+'.jpg'))+s[m.end():]
new=''.join('"%s": "%s", '%(k,b64(k+'.jpg')) for k in ['bone_rib','creeper_skin','creeper_face','blossom'])
R('const TEX = {','const TEX = {'+new)
R("'zombie_skin', 'bone_skin', 'haggis_fur', 'treeman_bark'].forEach(tex);","'zombie_skin', 'bone_skin', 'haggis_fur', 'treeman_bark', 'bone_rib', 'creeper_skin', 'creeper_face'].forEach(tex);")
# ---------- blossom block ----------
R("DEEPSLATE:133};","DEEPSLATE:133, BLOSSOM:134};")
R("133:'deepslate'\n};","133:'deepslate', 134:'blossom'\n};")
R("const ICON_KEY = {69:'diamond_ore',","const ICON_KEY = {134:'blossom', 69:'diamond_ore',")
R("const HARD = {69:3.4, ","const HARD = {134:0.25, 69:3.4, ")
R("const PLACEABLE = new Set([133,","const PLACEABLE = new Set([134,133,")
R("Object.assign(NAMES, {133: 'Deep slate',","Object.assign(NAMES, {134: 'Purple blossom', 133: 'Deep slate',")
R("|| n === T.BED) return true;","|| n === T.BED || n === 134) return true;")
# ---------- world size / chunks ----------
R("let W = 56, D = 56;","const NEW_W = 156;   // GLX-B8: new worlds are 156 x 156 (older 40/56 saves keep their own size)\nlet W = NEW_W, D = NEW_W;")
R("if (W !== 56) { setWorldSize(56); generate(); placeTrees(); placeDecor(); rebuildAll(); }","if (W !== NEW_W) { setWorldSize(NEW_W); generate(); placeTrees(); placeDecor(); dirtyAll = true; }")
R("const CH = 28;","const CH = 26;")
R("if (dirtyAll || dirtyCh.size) rebuild();","if (dirtyAll || dirtyCh.size) rebuild(30);")
R("""  if (dirtyAll) {
    for (const g of chunkObjs.values()) { blockGroup.remove(g); g.children.forEach(c => { if (c.isInstancedMesh) c.dispose(); else if (c.geometry) c.geometry.dispose(); }); }
    chunkObjs.clear(); chunkLists.clear();
    for (let cx = 0; cx < ncx; cx++) for (let cz = 0; cz < ncz; cz++) buildChunk(cx, cz);
    dirtyAll = false;
  } else for (const id of dirtyCh) buildChunk(Math.floor(id / 64), id % 64);
  dirtyCh.clear();""","""  if (dirtyAll) {
    for (const g of chunkObjs.values()) { blockGroup.remove(g); g.children.forEach(c => { if (c.isInstancedMesh) c.dispose(); else if (c.geometry) c.geometry.dispose(); }); }
    chunkObjs.clear(); chunkLists.clear();
    for (let cx = 0; cx < ncx; cx++) for (let cz = 0; cz < ncz; cz++) dirtyCh.add(cx * 64 + cz);
    dirtyAll = false;
  }
  // GLX-B8: with a time budget (loading / background) chunks nearest the player are meshed first and the rest wait for later frames
  let ids = [...dirtyCh];
  if (budget) { const pcx = P.x / CH - 0.5, pcz = P.z / CH - 0.5; ids.sort((a, b) => Math.hypot(Math.floor(a / 64) - pcx, a % 64 - pcz) - Math.hypot(Math.floor(b / 64) - pcx, b % 64 - pcz)); }
  const tB = performance.now();
  for (const id of ids) { buildChunk(Math.floor(id / 64), id % 64); dirtyCh.delete(id); if (budget && performance.now() - tB > budget) break; }""")
R("function rebuild() {\n  const ncx = Math.ceil(W / CH)","function rebuild(budget) {\n  const ncx = Math.ceil(W / CH)")
R("    im.instanceMatrix.needsUpdate = true;\n    if (tid === T.GLASS)","    im.instanceMatrix.needsUpdate = true; im.frustumCulled = false;   // culled per chunk instead\n    if (tid === T.GLASS)")
R("if (ENT[tid]) continue;","if (ENT[tid] || tid === T.FURNACE || tid === T.BED) continue;")
# ---------- terrain ----------
R("function terrainHeight(x, z) {","function terrainHeightHome(x, z) {")
R("    const h = terrainHeight(x, z);\n    for (let y = 0; y < H; y++) {","    const h = terrainHeight(x, z), fk = farK(x, z);\n    for (let y = 0; y < H; y++) {")
R("      if (b === T.AIR && y >= h && y < SEA) b = T.WATER;","      if (b === T.AIR && y >= h && y < SEA) b = T.WATER;\n      if (fk > 0.5 && y >= h - 3 && y < h) b = farTop(x, z, h, y);")
R("  // caves show only coal, copper","  if (W > 100) exploreGen();\n  // caves show only coal, copper")
R("  const want = Math.round(18 * W * D / 1600);","  const want = Math.round(18 * Math.min(W, 56) * Math.min(D, 56) / 1600);")
R("    const x = 3 + Math.floor(Math.random() * (W - 6));\n    const z = 3 + Math.floor(Math.random() * (D - 6));","    const x = 3 + Math.floor(Math.random() * (Math.min(W, 56) - 6));\n    const z = 3 + Math.floor(Math.random() * (Math.min(D, 56) - 6));")
R("      x = 3 + Math.floor(Math.random() * (W - 6)); z = 3 + Math.floor(Math.random() * (D - 6));",
  "      if (W > 80) { x = Math.floor(P.x + (Math.random() - .5) * 90); z = Math.floor(P.z + (Math.random() - .5) * 90); } else { x = 3 + Math.floor(Math.random() * (W - 6)); z = 3 + Math.floor(Math.random() * (D - 6)); }")
# ---------- mobs ----------
R("const hostile = kind === 'zombie' || kind === 'skeleton';","const hostile = kind === 'zombie' || kind === 'skeleton' || kind === 'creeper';")
R("duck: makeDuck};","duck: makeDuck, creeper: makeCreeper};")
R("(kind === 'zombie' || kind === 'skeleton') ? 'hostile'","(kind === 'zombie' || kind === 'skeleton' || kind === 'creeper') ? 'hostile'")
R("spawnMob(Math.random() < .55 ? 'zombie' : 'skeleton')","spawnMob(((r) => r < .42 ? 'zombie' : r < .74 ? 'skeleton' : 'creeper')(Math.random()))")
R("        if (a.kind === 'zombie') {\n          spd = dist > 1.0","        if (a.kind === 'zombie' || a.kind === 'creeper') {\n          spd = dist > 1.0")
R("if (dist < 1.4 && Math.abs(dy) < 1.6 && a.biteCd <= 0)","if (a.kind === 'zombie' && dist < 1.4 && Math.abs(dy) < 1.6 && a.biteCd <= 0)")
R("sfx3d(a.kind === 'zombie' ? 'groan' : 'bow', pos, 14)","(a.kind === 'creeper' ? hiss(pos, 0.5) : sfx3d(a.kind === 'zombie' ? 'groan' : 'bow', pos, 14))")
R("'Blown sky-high by a turf puffer.'","(boomMsg || 'Blown sky-high by a turf puffer.')")
R("const red = new THREE.MeshBasicMaterial({color: 0xff1a10});","const red = new THREE.MeshBasicMaterial({color: 0xe8f6ff});   // pale glowing eyes")
R("glowSprite(0xff2010, 0.5)","glowSprite(0xcfeaff, 0.45)")
R("""c.width = c.height = 256;
    const g = c.getContext('2d');
    if (src) g.drawImage(src, 0, 0, 256, 256); else { g.fillStyle = '#555'; g.fillRect(0, 0, 256, 256); }""","""c.width = c.height = 1024;
    const g = c.getContext('2d');
    if (src) g.drawImage(src, 0, 0, 1024, 1024); else { g.fillStyle = '#555'; g.fillRect(0, 0, 1024, 1024); }
    g.scale(4, 4);""")
R("  const body = new THREE.Mesh(roundBox(0.5, 0.75, kind === 'skeleton' ? 0.18 : 0.26), skin);",
  "  const ribM = kind === 'skeleton' ? new THREE.MeshLambertMaterial({map: tex('bone_rib')}) : null;\n  const body = new THREE.Mesh(roundBox(0.5, 0.75, kind === 'skeleton' ? 0.18 : 0.26), ribM ? [skin, skin, skin, skin, ribM, ribM] : skin);")
# ---------- furnace / bed facing ----------
R("if (id === T.CHEST || id === T.DOOR || id === T.TV) entMeta","if (id === T.CHEST || id === T.DOOR || id === T.TV || id === T.FURNACE) entMeta")
a=s.index("  if (id === T.BED) {\n    const ax = Math.sin(-P.yaw)"); b=s.index("  setB(x, y, z, id);", a)
s=s[:a]+"""  if (id === T.BED) {
    // GLX-B8: 2-block bed: foot where you click, head one block further away from you
    const f = faceFromYaw(), hx = x - Math.round(Math.sin(f * Math.PI / 2)), hz = z - Math.round(Math.cos(f * Math.PI / 2));
    if (getB(hx, y, hz) !== T.AIR || !solid(hx, y - 1, hz) || !solid(x, y - 1, z) || (hx < P.x + R && hx + 1 > P.x - R && y < P.y + HEIGHT && y + 1 > P.y && hz < P.z + R && hz + 1 > P.z - R)) { toast('A bed needs 2 blocks of flat floor'); return; }
    entMeta.set(keyOf(x, y, z), {face: f, bed: 'foot'}); entMeta.set(keyOf(hx, y, hz), {face: f, bed: 'head'});
    setB(hx, y, hz, T.BED); refreshBedsNear(x, y, z); refreshBedsNear(hx, y, hz);
  }
"""+s[b:]
R("  if (b === T.BED) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) if (getB(x + dx, y, z + dz) === T.BED) setB(x + dx, y, z + dz, T.AIR);",
  "  if (b === T.BED) breakBedPartner(x, y, z);")
R("const want = list.slice(0, Math.min(torchLights.length, torchCap)),","const want = list.slice(0, Math.min(torchLights.length, torchCap || 99)),")
s+=open('b8_append.js').read()
open('s1.js','w').write(s)
print('ok')
