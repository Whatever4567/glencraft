/* ===================== GLX-C226 (v1.0.48): doors & gates - no save hitch, proper double doors, never trapped; Howk pickaxe enchant ===================== */
(function c226() {
  const U = window.__c226 = {err: null, skipped: 0, paired: 0, pushed: 0, held: 0, howk: 0, dirty: 0};
  const ERR = e => { U.err = String(e && e.stack || e).slice(0, 300); };
  try {
    const isD = (x, y, z) => getB(x, y, z) === T.DOOR;
    const lat = (f, d) => { const a = f * Math.PI / 2; return [Math.round(Math.cos(a)) * d, -Math.round(Math.sin(a)) * d]; };   // world step for local +x * d
    const meta = (x, y, z) => entMeta.get(keyOf(x, y, z)) || {face: 0};
    // ---- 1) toggling a gate / door never forces a save: the normal periodic autosave (and quitting) keeps it ----
    let quiet = 0;
    const sw = saveWorld;
    saveWorld = function () { if (quiet) { U.skipped++; U.dirty = 1; return false; } return sw.apply(this, arguments); };
    // ---- 2) double doors: the partner is the door next to the latch side, same facing, mirrored hinge ----
    function partnerOf(x, ly, z) {
      const m = meta(x, ly, z), f = m.face || 0, [dx, dz] = lat(f, m.hinge ? -1 : 1), nx = x + dx, nz = z + dz;
      if (!isD(nx, ly, nz)) return null; const n = meta(nx, ly, nz);
      return (n.face || 0) === f && !!n.hinge !== !!m.hinge ? [nx, nz] : null;
    }
    function rebuildDoor(x, ly, z) {
      const k = keyOf(x, ly, z), o = entObjs.get(k);
      try { if (o) { scene.remove(o.g); if (typeof disposeObj === 'function') disposeObj(o.g); entObjs.delete(k); } const e = buildEnt(T.DOOR, x, ly, z); if (e) entObjs.set(k, e); } catch (e) { ERR(e); }
    }
    function pairDoor(x, ly, z) {
      if (!isD(x, ly, z) || partnerOf(x, ly, z)) return null;
      const k = keyOf(x, ly, z), m = meta(x, ly, z), f = m.face || 0;
      for (const d of [1, -1]) {
        const [dx, dz] = lat(f, d), nx = x + dx, nz = z + dz;
        if (!isD(nx, ly, nz)) continue;            // only the two door blocks matter; walls/blocks around them are ignored
        const nk = keyOf(nx, ly, nz), n = meta(nx, ly, nz);
        if ((n.face || 0) % 2 !== f % 2) continue;  // must stand in the same line
        if (partnerOf(nx, ly, nz)) continue;        // already half of another pair
        m.face = f; m.hinge = d > 0 ? 0 : 1; n.face = f; n.hinge = d > 0 ? 1 : 0;   // hinges on the outer edges
        entMeta.set(k, m); entMeta.set(nk, n);
        doorState.set(nk, !!doorState.get(k));
        rebuildDoor(x, ly, z); rebuildDoor(nx, ly, nz);
        U.paired++; return [nx, nz];
      }
      return null;
    }
    U.pairDoor = pairDoor; U.partnerOf = partnerOf;
    // catch doors as they are placed, pair them once the placing code has set face/hinge
    const q = [];
    const sb = setB;
    setB = function (x, y, z, v) { const r = sb.apply(this, arguments); if (v === T.DOOR && q.length < 8) q.push([x, y, z]); return r; };
    // ---- 3) never trapped by a door: push out to the nearest free side, or keep it open ----
    const nearDoor = () => { for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let dy = 0; dy <= 1; dy++) { const b = getB(Math.floor(P.x) + dx, Math.floor(P.y) + dy, Math.floor(P.z) + dz); if (b === T.DOOR || b === T.DOORTOP) return true; } return false; };
    function unstick() {
      if (!collides(P.x, P.y, P.z)) return true;
      for (let s = 0.08; s <= 1.0; s += 0.08) for (const [ux, uz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [.7, .7], [-.7, .7], [.7, -.7], [-.7, -.7]])
        if (!collides(P.x + ux * s, P.y, P.z + uz * s)) { P.x += ux * s; P.z += uz * s; U.pushed++; return true; }
      return false;
    }
    const td = toggleDoor;
    toggleDoor = function (x, y, z) {
      const ly = getB(x, y, z) === T.DOORTOP ? y - 1 : y;
      try { pairDoor(x, ly, z); } catch (e) { ERR(e); }
      const was = started && !collides(P.x, P.y, P.z), k = keyOf(x, ly, z), pr = partnerOf(x, ly, z), pk = pr && keyOf(pr[0], ly, pr[1]);
      const r = td.apply(this, arguments);
      try {
        if (pk) doorState.set(pk, !!doorState.get(k));
        if (was && !unstick()) { const o = !doorState.get(k); doorState.set(k, o); if (pk) doorState.set(pk, o); U.held++; }   // nowhere to go: the door stays as it was
      } catch (e) { ERR(e); }
      return r;
    };
    const ui = useItem;
    useItem = function () {
      let r0 = null; try { r0 = raycast(5); } catch (_) {}
      const tb = r0 ? getB(...r0.hit) : 0;
      quiet = (tb === 226 || tb === T.DOOR || tb === T.DOORTOP) && !sneakHeld ? 1 : 0; q.length = 0;
      try { return ui.apply(this, arguments); }
      finally { quiet = 0; try { while (q.length) { const [x, y, z] = q.shift(); pairDoor(x, y, z); } } catch (e) { ERR(e); } }
    };
    // villagers shut doors too: a light watchdog nudges you out if one ever closes on you
    setInterval(() => { try { if (started && !dead && nearDoor() && collides(P.x, P.y, P.z)) unstick(); } catch (e) { ERR(e); } }, 200);
    // ---- 4) Howk: an enchanted pickaxe digs a 2 wide x 3 tall face (or a 2 x 3 patch of floor/ceiling) ----
    let busy = false;
    const okB = b => b && b !== T.WATER && b !== T.LAVA && !ENT[b] && !isPlant(b) && !(LOGGY[b]) && !(LEAFY[b]) && b !== T.TORCH && b !== T.CAULDRON && !(T.BEDROCK && b === T.BEDROCK) && !(T.HBEDROCK && b === T.HBEDROCK);
    // Howk wears the pickaxe: one use per block it digs; when it is used up the pickaxe breaks
    function wear(id, E) { const t = TOOL[id], lv = (t && t[1]) | 0, max = [60, 60, 132, 251, 1562, 2000][Math.min(5, lv)] || 200; E.wear = (E.wear || 0) + 1; U.wear = E.wear;
      if (E.wear < max || MODE.infinite) return false; E.wear = 0; useUp(id, 1); U.broke = (U.broke || 0) + 1; try { sfx('break'); toast('Your Howk pickaxe broke'); renderHotbar(); } catch (_) {}
      if (cnt(id) <= 0) try { delete __c117.ENCH[id]; } catch (_) {} return true; }
    U.wearOf = wear;
    function howk(x, y, z, natural) {
      const id = heldToolId(); if (!id || !TOOL[id] || TOOL[id][0] !== 'pick') return;
      const E = window.__c117 && __c117.ENCH && __c117.ENCH[id]; if (!E || !E.howk) return;
      if (menuOpen || !(attackMouse || attackPad || attackTouch)) return;   // only your own digging
      if (Math.hypot(x + .5 - P.x, z + .5 - P.z) > 7) return;
      const d = lookDir(), alongX = Math.abs(d[0]) >= Math.abs(d[2]);
      const px = alongX ? 0 : 1, pz = alongX ? 1 : 0;                       // sideways step
      const sPerp = alongX ? Math.sign(P.z - (z + .5)) || 1 : Math.sign(P.x - (x + .5)) || 1;
      const cells = [];
      if (Math.abs(d[1]) > 0.8) {                                           // looking at floor / ceiling: 2 across x 3 ahead
        const fx = alongX ? Math.sign(d[0]) || 1 : 0, fz = alongX ? 0 : Math.sign(d[2]) || 1;
        for (let a = 0; a < 3; a++) for (let w = 0; w < 2; w++) cells.push([x + fx * a + px * w * sPerp, y, z + fz * a + pz * w * sPerp]);
      } else {
        const fy = Math.floor(P.y), y0 = y >= fy && y <= fy + 2 ? fy : y - 1;   // a walk-through tunnel when digging at body height
        for (let h = 0; h < 3; h++) for (let w = 0; w < 2; w++) cells.push([x + px * w * sPerp, y0 + h, z + pz * w * sPerp]);
      }
      busy = true;
      try {
        if (wear(id, E)) return;   // the block you dug yourself
        for (const [cx, cy, cz] of cells) {
          if (cx === x && cy === y && cz === z) continue;
          if (cy <= 0 || cy >= H || cx < 0 || cz < 0 || cx >= W || cz >= D) continue;
          const b = getB(cx, cy, cz);
          if (!okB(b) || !canMine(b, cy) || underTooled(b) || HARD[b] < 0 || HARD[b] > 40) continue;
          if (natural && placedSet.has(idx(cx, cy, cz))) continue;          // digging rock never chews into your builds
          breakAt(cx, cy, cz); U.howk++; if (wear(id, E)) break;
        }
      } finally { busy = false; }
    }
    const ba = breakAt;
    breakAt = function (x, y, z) {
      let nat = true; try { nat = !placedSet.has(idx(x, y, z)); } catch (_) {}
      const r = ba.apply(this, arguments);
      if (!busy) try { howk(x, y, z, nat); } catch (e) { ERR(e); }
      return r;
    };
  } catch (e) { ERR(e); }
})();
