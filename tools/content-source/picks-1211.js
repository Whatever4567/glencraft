/* GLX-V1211 (v1.2.11): crystal pickaxes on the existing tool system (TOOL = [kind, level, speed, damage]).
   Blue crystal pickaxe (id 760): speed 15 (15x bare hand; diamond is 7.5). Purple crystal pickaxe (id 761): speed 50.
   Both mine everything (level 4). Held model = the standard pickaxe with a glossy crystal head; detailed 256px icons. */
(function v1211() {
  const U = window.__v1211 = {err: null, ids: [760, 761]};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const BP = 760, PP = 761;
  try {
    for (const id of [BP, PP]) if (NAMES[id] !== undefined || TOOL[id]) throw Error('id taken ' + id);
    IT.BCPICK = BP; IT.PCPICK = PP; NAMES[BP] = 'Blue crystal pickaxe'; NAMES[PP] = 'Purple crystal pickaxe';
    TOOL[BP] = ['pick', 4, 15, 5.5]; TOOL[PP] = ['pick', 4, 50, 6]; TOOLS.add(BP); TOOLS.add(PP);
    TOOL_COL.crystalblue = 0x3ab8ff; TOOL_COL.crystalpurple = 0xa64dff; TOOL_MATX[BP] = 'crystalblue'; TOOL_MATX[PP] = 'crystalpurple';
    for (const id of [BP, PP]) { if (!ORDER.includes(id)) ORDER.push(id); try { if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(id)) CREATIVE_ALL.push(id); } catch (_) {} }
    const DB = T.DIAMONDBLOCK || 259;
    RECIPES.push(rc('Blue crystal pickaxe', '2 Block of diamond + 3 Diamonds + 2 Sticks', BP, 1, [[DB, 2], [IT.DIAMOND, 3], [IT.STICK, 2]], 1, 1));
    RECIPES.push(rc('Purple crystal pickaxe', 'Blue crystal pickaxe + 4 Block of diamond', PP, 1, [[BP, 1], [DB, 4]], 1, 1));
  } catch (e) { ERR('reg', e); }
  // crystal heads read as glass-like metal
  try { const hm = headMatFor; headMatFor = function (mat) { if (mat === 'crystalblue' || mat === 'crystalpurple') return new THREE.MeshPhongMaterial({color: TOOL_COL[mat], emissive: mat === 'crystalblue' ? 0x0a3a66 : 0x3a0a66, shininess: 160, specular: 0xffffff, transparent: true, opacity: 0.92}); return hm.apply(this, arguments); }; } catch (e) { ERR('hm', e); }
  // icons
  function icon(c1, c2, c3, glow) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.translate(128, 128); g.scale(4, 4); g.lineJoin = g.lineCap = 'round';
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(2, 28, 20, 3.5, 0, 0, 7); g.fill();
    g.save(); g.rotate(-0.78); const hd = g.createLinearGradient(0, 0, 0, 20); hd.addColorStop(0, '#9a6a36'); hd.addColorStop(1, '#5a3a18'); g.fillStyle = hd; g.fillRect(-2.6, -8, 5.2, 38); g.fillStyle = '#3a2410'; for (let y = 4; y < 28; y += 5) g.fillRect(-2.6, y, 5.2, 1.2); g.restore();
    g.save(); g.translate(-6, -8); g.rotate(-0.78); g.shadowColor = glow; g.shadowBlur = 8;
    g.beginPath(); g.moveTo(-26, 4); g.quadraticCurveTo(-12, -9, 0, -9); g.quadraticCurveTo(12, -9, 26, 4); g.lineTo(18, 2); g.quadraticCurveTo(8, -3, 0, -3); g.quadraticCurveTo(-8, -3, -18, 2); g.closePath();
    const cg = g.createLinearGradient(-26, -9, 26, 4); cg.addColorStop(0, c3); cg.addColorStop(0.35, c1); cg.addColorStop(0.55, '#ffffff'); cg.addColorStop(0.7, c1); cg.addColorStop(1, c2); g.fillStyle = cg; g.fill(); g.shadowBlur = 0; g.strokeStyle = c2; g.lineWidth = 1; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 0.6; for (const x of [-16, -8, 8, 16]) { g.beginPath(); g.moveTo(x, -6 + Math.abs(x) * 0.25); g.lineTo(x * 0.85, -1.5 + Math.abs(x) * 0.12); g.stroke(); }
    g.fillStyle = c2; g.fillRect(-3.5, -9.5, 7, 8); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(-2.5, -8.5, 2, 2); g.restore();
    g.fillStyle = 'rgba(255,255,255,.95)'; for (const [x, y, z] of [[-14, -18, 2.2], [10, -22, 1.6], [16, -6, 1.2]]) { g.beginPath(); g.moveTo(x, y - z * 2); g.lineTo(x + z * .5, y - z * .5); g.lineTo(x + z * 2, y); g.lineTo(x + z * .5, y + z * .5); g.lineTo(x, y + z * 2); g.lineTo(x - z * .5, y + z * .5); g.lineTo(x - z * 2, y); g.lineTo(x - z * .5, y - z * .5); g.fill(); }
    return c; }
  U.canvases = {}; U.icons = {};
  try { U.canvases[BP] = icon('#5fd0ff', '#0b4f8a', '#1e7ad0', '#5fd0ff'); U.canvases[PP] = icon('#c58bff', '#4a1488', '#7a32d0', '#c58bff'); for (const k in U.canvases) U.icons[k] = U.canvases[k].toDataURL(); } catch (e) { ERR('icon', e); }
  const set = (id, url) => { try { if (window.__c121 && __c121.setIcon) __c121.setIcon(id, url); } catch (_) {} ICONS[id] = url; try { delete ICON_KEY[id]; } catch (_) {} try { delete spriteMats[id]; } catch (_) {} };
  U.apply = () => { let n = 0; for (const k in U.icons) if (ICONS[k] !== U.icons[k]) { set(+k, U.icons[k]); n++; } return n; };
  { let t = 0, st = 0; const iv = setInterval(() => { try { if (typeof ICONS === 'undefined') return; st = U.apply() ? 0 : st + 1; } catch (e) { ERR('apply', e); } if (++t > 120 || st >= 10) clearInterval(iv); }, 1000); }
})();
