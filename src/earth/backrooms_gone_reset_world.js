/* GLX-C314A (v1.1.24 hotfix): THE BACKROOMS ARE GONE. Reset world could drop you into the Backrooms (through the Mystery painting portal
   next to your moved house). Now there is no way in at all: no painting portals, no painting doorway, no Backrooms dimension. Anyone whose save
   is in the Backrooms is taken home to the mainland spawn, and the Backrooms save is wiped. The Mystery painting stays as a plain picture. */
(function c314a() {
  const U = window.__c314a = {err: null, kicked: 0, blocked: 0, wiped: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  try { const ed = enterDim; enterDim = async function (name) { if (name === 'backrooms') { U.blocked++; return; } return ed.apply(this, arguments); }; } catch (e) { ERR('ed', e); }
  try { const ct = crossTo; crossTo = function (src, isEnter) { if (isEnter || !DIM.cur) { U.blocked++; return; } return ct.apply(this, arguments); }; } catch (e) { ERR('ct', e); }
  try { destFor = function () { return DIM.cur === 'backrooms' ? (DIM.linkFrame || null) : null; }; } catch (e) { ERR('df', e); }
  try { window.paintUse = function () {}; } catch (e) { ERR('pu', e); }
  const spawnXZ = () => { const x = Math.floor(W / 2), z = Math.floor(D / 2); return [x + 0.5, groundTopSafe(x, z), z + 0.5]; };
  function groundTopSafe(x, z) { try { return groundTop(x, z) + 1.05; } catch (_) { return H - 20; } }
  const wipe = () => { try { if (current) { idbPut('worlds', dimKey('backrooms'), null); U.wiped++; } } catch (e) { ERR('wipe', e); } DIM.link = null; DIM.linkFrame = null; DIM.pre = null; };
  let busy = false, lastWorld = null;
  async function home() { if (busy) return; busy = true; try { await exitDim(); if (DIM.cur === 'backrooms') { DIM.cur = null; const ow = await idbGet('worlds', current.id); if (ow) { applySave(ow); dirtyAll = true; rebuild(); } }
      const s = spawnXZ(); P.x = s[0]; P.y = s[1]; P.z = s[2]; P.vy = 0; P.fallTop = null; wipe(); U.kicked++; try { saveWorld(true); } catch (_) {} try { toast('The Backrooms are gone - back home at spawn'); } catch (_) {} } catch (e) { ERR('home', e); } finally { busy = false; } }
  setInterval(() => { try { if (typeof PV !== 'undefined' && PV.portals && PV.portals.size) PV.portals.clear(); if (!started || !current) return;
      if (current.id !== lastWorld) { lastWorld = current.id; if (!DIM.cur) wipe(); }
      if (DIM.cur === 'backrooms' && !DIM.busy) home(); } catch (e) { ERR('iv', e); } }, 400);
  try { const rt = resetTerrain; resetTerrain = async function () { if (DIM.cur === 'backrooms') { await home(); } wipe(); return rt.apply(this, arguments); }; } catch (e) { ERR('rt', e); }
})();
