/* ===================== GLX-C174 (v1.0.33): Red glass pane - thin, see-through, glowing red-orange; used for the Hell and black castle windows ===================== */
// no free block ids: the red pane is a glass pane (227) with {wood: 'R'} in its cell meta (the same trick as the wood types).
// The item is 700. Red panes are drawn by one InstancedMesh (1 draw call for all of them) instead of a group per pane.
(function c174() {
  const U = window.__c174 = {n: 0, err: null}, RP = 700, GP = 227, TH = 0.125;
  const isRed = k => { const m = entMeta.get(k); return !!(m && m.wood === 'R'); };
  U.isRed = isRed;
  try { const C = window.__c121; NAMES[RP] = 'Red glass pane'; if (C && C.VARI) C.VARI[RP] = {base: GP, w: 'R', kind: 'pane'};
    if (!ORDER.includes(RP)) ORDER.push(RP); if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(RP)) CREATIVE_ALL.push(RP);
    RECIPES.push(rc('8 Red glass panes', '8 Glass panes + 1 Magma', RP, 8, [[GP, 8], [T.MAGMA || 208, 1]], 1));
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 64, 64); gr.addColorStop(0, 'rgba(255,150,70,.95)'); gr.addColorStop(0.5, 'rgba(240,60,20,.85)'); gr.addColorStop(1, 'rgba(150,20,10,.9)');
    g.fillStyle = gr; g.fillRect(14, 4, 36, 56); g.strokeStyle = '#3a0a04'; g.lineWidth = 3; g.strokeRect(14, 4, 36, 56); g.beginPath(); g.moveTo(32, 4); g.lineTo(32, 60); g.moveTo(14, 30); g.lineTo(50, 30); g.stroke();
    g.fillStyle = 'rgba(255,230,190,.55)'; g.fillRect(18, 8, 4, 18); const url = cv.toDataURL();
    if (C && C.setIcon) C.setIcon(RP, url); else { ICONS[RP] = url; delete ICON_KEY[RP]; } } catch (e) { U.err = 'item ' + e; }
  // builders: __rpane(K, x, y, z) puts a red pane in a castle / Hell build (K = the builder's local kit)
  window.__rpane = (K, x, y, z) => { K.B(x, y, z, GP); try { K.meta(x, y, z, {wood: 'R'}); } catch (_) {} };
  // breaking one gives a red pane back; the cell forgets it was red
  let brk = 0;
  try { const ba = breakAt; breakAt = function (x, y, z) { let k = null; try { if (getB(x, y, z) === GP) { k = keyOf(x, y, z); brk = isRed(k) ? 1 : 0; } } catch (_) {}
      try { return ba.apply(this, arguments); } finally { if (k) { brk = 0; try { if (getB(x, y, z) !== GP) { const m = entMeta.get(k); if (m && m.wood === 'R') { delete m.wood; if (!Object.keys(m).length) entMeta.delete(k); } } } catch (_) {} } } }; } catch (e) { U.err = 'brk ' + e; }
  try { const df = dropsFor; dropsFor = function (b) { const r = df.apply(this, arguments); if (!brk || b !== GP || !Array.isArray(r)) return r; return r.map(q => q && q[0] === GP ? [RP, q[1]] : q); }; } catch (e) { U.err = 'drops ' + e; }
  // drawing: hide the normal pane groups of red cells, one instanced mesh for all red pane boxes
  let mesh = null, cap = 0, sig = '';
  const mat = new THREE.MeshBasicMaterial({color: 0xff5a22, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide});
  const box = new THREE.BoxGeometry(1, 1, 1), M4 = new THREE.Matrix4(), V = new THREE.Vector3(), Q = new THREE.Quaternion(), S3 = new THREE.Vector3();
  const boxes = m => { const c = 0.5 - TH / 2, out = [[c, c, c + TH, c + TH]]; if (!m) return [[0, c, 1, c + TH]];
    if (m & 1) out.push([c + TH, c, 1, c + TH]); if (m & 2) out.push([0, c, c, c + TH]); if (m & 4) out.push([c, c + TH, c + TH, 1]); if (m & 8) out.push([c, 0, c + TH, c]); return out; };
  function pass() { if (typeof fenceObjs === 'undefined' || !fenceObjs) return; const list = [];
    for (const [k, o] of fenceObjs) { if (o.t !== GP || !isRed(k)) continue; if (o.g && o.g.parent) o.g.parent.remove(o.g); list.push(o); }
    const s = list.map(o => o.x + ',' + o.y + ',' + o.z + ':' + (window.paneConn ? paneConn(o.x, o.y, o.z) : 0)).join('|'); if (s === sig) return; sig = s;
    const bx = []; for (const o of list) for (const b of boxes(window.paneConn ? paneConn(o.x, o.y, o.z) : 0)) bx.push([o.x + b[0], o.y, o.z + b[1], b[2] - b[0], b[3] - b[1]]);
    if (!mesh || bx.length > cap) { if (mesh) { if (mesh.parent) mesh.parent.remove(mesh); mesh.dispose && mesh.dispose(); } cap = Math.max(64, bx.length * 2); mesh = new THREE.InstancedMesh(box, mat, cap); mesh.frustumCulled = false; mesh.renderOrder = 3; blockGroup.add(mesh); }
    bx.forEach((b, i) => { V.set(b[0] + b[3] / 2, b[1] + 0.5, b[2] + b[4] / 2); S3.set(b[3], 1, b[4]); M4.compose(V, Q, S3); mesh.setMatrixAt(i, M4); });
    if (mesh.parent !== blockGroup) { if (mesh.parent) mesh.parent.remove(mesh); blockGroup.add(mesh); } mesh.count = bx.length; mesh.instanceMatrix.needsUpdate = true; mesh.visible = bx.length > 0; U.n = list.length; }
  U.pass = pass;
  try { const sf = window.syncFences; if (sf) { window.syncFences = function () { const r = sf.apply(this, arguments); try { pass(); } catch (e) { U.err = 'pass ' + e; } return r; }; try { syncFences = window.syncFences; } catch (_) {} } } catch (e) { U.err = 'sync ' + e; }
  setInterval(() => { try { if (typeof started !== 'undefined' && started) pass(); } catch (e) { U.err = 'pass ' + e; } }, 700);
})();
