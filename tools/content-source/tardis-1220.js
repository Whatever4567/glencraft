/* GLX-V1220T (v1.2.20): time box interior finish. The 1.2.10 cockpit tint skipped every textured surface, so the wooden plank
   walls, lintel and tartan floor (most of what you see) stayed brown; the old teal crystal column and its six brass bars stood in
   the same spot as the new blue tube; and the outside view screen was still 3.1 m wide. Now: chrome, purple and blue panelled walls
   and a dark blue floor, the old column hidden so the blue tube with yellow energy is the main console column, the new parts drawn
   in the same pass as the room, and a 55 inch (1.22 m) live view screen at eye height. Nothing is saved, so old worlds are unchanged. */
(function v1220t() {
  const T = window.__tbox, V = () => window.__v130, F = () => window.__tbox3; if (!T) return;
  const U = window.__v1220t = {err: null, walls: 0, col: 0, ro: 0, scr: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const RR = T.RR, DW = T.DW;
  function tex(kind) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    if (kind === 'wall') { const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, '#b9c2d6'); gr.addColorStop(0.5, '#eef2fa'); gr.addColorStop(1, '#9aa6c0'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      g.fillStyle = '#5a2a9a'; g.fillRect(0, 0, 256, 18); g.fillRect(0, 238, 256, 18); g.fillStyle = '#2f6bff'; g.fillRect(0, 120, 256, 10);
      g.strokeStyle = 'rgba(40,30,90,.55)'; g.lineWidth = 3; g.strokeRect(14, 30, 228, 80); g.strokeRect(14, 140, 228, 90);
      g.fillStyle = 'rgba(120,80,230,.35)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(64 + i * 64, 185, 20, 0, 6.3); g.fill(); } }
    else { g.fillStyle = '#141a3a'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#3a4fb0'; g.lineWidth = 3; for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
      g.fillStyle = '#7a3cff'; for (let x = 32; x < 256; x += 64) for (let y = 32; y < 256; y += 64) g.fillRect(x - 3, y - 3, 6, 6); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
  let WT = null, FT = null;
  function tick() { const room = T.parts && T.parts.room; if (!room || !T.inside) return;
    let RO = 0; room.traverse(q => { if (q.isMesh && q.renderOrder) RO = q.renderOrder; });
    if (!U.walls) { WT = WT || tex('wall'); FT = FT || tex('floor'); let n = 0;
      for (const q of room.children) { if (!q.isMesh || !q.geometry) continue; const p = q.geometry.parameters || {}, m = q.material; if (!m || !m.map) continue;
        if (q.geometry.type === 'CylinderGeometry' && Math.abs(p.radiusTop - RR) < 0.01) { WT.repeat.set(9, 2); m.map = WT; m.color && m.color.setHex(0xffffff); m.needsUpdate = true; n++; }
        else if (q.geometry.type === 'PlaneGeometry' && Math.abs(p.width - (2 * DW + 0.2)) < 0.01) { m.map = WT; m.needsUpdate = true; n++; }
        else if (q.geometry.type === 'CircleGeometry' && q.position.y < 0.5) { FT.repeat.set(4, 4); m.map = FT; m.needsUpdate = true; n++; } }
      U.walls = n; }
    if (!U.col) { if (T.col) { T.col.visible = false; U.col = 1; }
      for (const q of room.children) { const p = q.geometry && q.geometry.parameters; if (q.isMesh && q.geometry.type === 'BoxGeometry' && p && Math.abs(p.height - 1.9) < 0.01 && Math.abs(p.width - 0.04) < 0.01) q.visible = false; } }
    const v = V(); if (v && v.built && !U.ro && RO) { let n = 0; room.traverse(q => { if (q.isMesh && !q.renderOrder) { q.renderOrder = RO; q.frustumCulled = false; n++; } }); U.ro = n || 1; }
  }
  setInterval(() => { try { tick(); } catch (e) { ERR('t', e); } }, 400);
  // pilot mode owns the controller: the walking/look/mining pad code is skipped while you hold the stick (Start still pauses)
  let st9 = false; try { const rp = readPad; readPad = function () { try { const f = F(); if (f && f.pilot && started && !paused && !menuOpen && !dead) { const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(p => p) : null;
        const s = !!(gp && gp.buttons[9] && gp.buttons[9].pressed); if (s && !st9) setPause(true); st9 = s; U.padHeld = (U.padHeld || 0) + 1; return {lx: 0, ly: 0, rx: 0, ry: 0}; } } catch (e) { ERR('pad', e); } return rp.apply(this, arguments); }; } catch (e) { ERR('rp', e); }
})();
