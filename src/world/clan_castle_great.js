/* ===================== GLX-C152 (v1.0.25): the clan castle's great hall + bedrooms, and the skeleton castle (ruin on a crag, crypt + archery range below) ===================== */
(function c152() {
  const U = window.__c151; if (!U) return;
  const GP = 227, FEN = 162, OAKST = 164, HR = T.HELLROCK || 206, WST = 156, MOSS = 144, POD = T.PODZOL || 142, GRAV = T.GRAVEL || 202, FERN = 238, ALD = 138, THORN = 253;
  // ---------------- great hall (image 2) ----------------
  U.hall = function (K, o) { const {B, box} = K, {F, CE} = o;
    for (const x of [-6, -2, 2, 6]) for (let z = -10; z <= -3; z++) K.log(x, CE, z, T.LOG, 2);   // oak beams
    // gallery along the north wall on oak posts, railing
    box(-8, F + 4, -10, 7, F + 4, -8, T.PLANKS); for (let x = -8; x <= 6; x++) B(x, F + 5, -8, FEN); for (const x of [-6, -2, 2]) for (let y = F; y < F + 4; y++) K.log(x, y, -8, T.LOG, 0);
    for (let x = -5; x <= 4; x++) if (x !== -2 && x !== 2) for (let y = F; y <= F + 2; y++) B(x, y, -10, T.BOOKSHELF);
    // oak staircase up to the gallery (east wall), and on from the gallery to the bedrooms
    for (let k = 0; k <= 4; k++) { K.stair(7, F + k, -3 - k, 0, OAKST); for (let y = F; y < F + k; y++) B(7, y, -3 - k, T.PLANKS); }
    for (let k = 0; k <= 3; k++) { const x = -1 - k; K.stair(x, F + 5 + k, -10, 1, OAKST); for (let y = F + 5; y < F + 5 + k; y++) B(x, y, -10, T.PLANKS); } for (const x of [-1, -2, -3]) B(x, CE, -10, T.AIR);
    for (const x of [-1, -2, -3]) B(x, CE + 1, -9, FEN); B(0, CE + 1, -10, FEN);
    // the big stone fireplace (west wall): chimney breast, hearth fire, mantel, stag antlers above
    box(-8, F, -7, -7, CE - 1, -3, T.STONEBRICK); box(-8, F, -6, -7, F + 1, -4, T.AIR); box(-8, F - 1, -6, -7, F - 1, -4, HR); box(-8, CE + 1, -6, -7, o.RF - 1, -4, T.STONEBRICK);
    for (let z = -6; z <= -4; z++) K.prop('fire', -8, F, z, 3, {}, 'floor'); for (let z = -7; z <= -3; z++) K.stair(-6, F + 2, z, 1, 167); B(-6, F, -7, T.STONEBRICK); B(-6, F + 1, -7, T.STONEBRICK); B(-6, F, -3, T.STONEBRICK); B(-6, F + 1, -3, T.STONEBRICK);
    K.prop('antler', -6, F + 4, -5, 3, {}, 'wall'); K.prop('candles', -6, F + 3, -7, 3, {}, 'floor'); K.prop('candles', -6, F + 3, -3, 3, {}, 'floor');
    // long oak banquet table + benches, tartan runner and rug, candles
    for (let x = -4; x <= 4; x++) { B(x, F, -5, FEN); K.prop('table', x, F, -5, 2, {}, 'floor'); K.stair(x, F, -6, 0, OAKST); K.stair(x, F, -4, 2, OAKST); }
    K.stair(-5, F, -5, 1, OAKST); K.stair(5, F, -5, 3, OAKST);
    K.prop('rug', 0, F + 1, -5, 2, {w: 9.6, d: 0.55, h: 0.012}, [0, F, -5]); K.prop('rug', 0, F, -5, 2, {w: 13, d: 5, h: 0.03}, 'floor'); K.prop('rug', 0, F + 5, -9, 2, {w: 12, d: 1.6, v: 1, h: 0.03}, 'floor');
    for (const x of [-3, 0, 3]) K.prop('candles', x, F + 1, -5, 2, {}, [x, F, -5]);
    for (const x of [-3, 2]) K.prop('chand', x, F + 5, -5, 2, {L: 2.75}, [x, CE, -5]);
    // armour stands by the door, crossed claymores + targes, tapestries, tartan banners, sconces
    K.prop('armour', -3, F, -3, 0, {}, 'floor'); K.prop('armour', 2, F, -3, 0, {}, 'floor');
    K.prop('claym', -7, F + 3, -3, 0, {}, 'wall'); K.prop('claym', 5, F + 3, -3, 0, {}, 'wall'); K.prop('claym', 0, F + 6, -10, 2, {}, 'wall');
    for (const x of [-4, -3, 1, 2]) for (let y = F + 6; y <= F + 7; y++) B(x, y, -11, T.TAPESTRY); for (const x of [-5, 4]) for (let y = F + 5; y <= F + 6; y++) B(x, y, -2, T.TAPESTRY);
    K.prop('banT', 7, F + 7, -7, 1, {}, 'wall'); K.prop('banT', -7, F + 7, -9, 3, {}, 'wall');
    for (const [x, y, z, f] of [[-7, F + 2, -10, 0], [6, F + 2, -10, 0], [-4, F + 3, -3, 2], [3, F + 3, -3, 2], [-7, F + 6, -10, 0], [7, F + 6, -9, 3]]) K.lamp(x, y, z, f, {});
  };
  // ---------------- bedrooms under the roof: a bed for each of the clan, the laird's chest ----------------
  U.beds = function (K, o) { const {F, CE} = o, y = CE + 1, beds = [];
    for (const x of [-6, -4, 1, 3, 5]) beds.push(K.bed(x, y, -4, 2));
    K.chest(-2, y, -3, 0, [[IT.GOLDINGOT, 3], [IT.SILVERINGOT || IT.GOLDINGOT, 2], [IT.QUAICH || IT.GOLDINGOT, 1], [IT.CAIRNGORM || IT.DIAMOND, 2], [IT.KILT || IT.BREAD, 1]]);
    K.prop('rug', -4, y, -6, 2, {w: 5, d: 3, v: 1}, 'floor'); K.prop('rug', 3, y, -6, 2, {w: 5, d: 3}, 'floor');
    for (const x of [-7, 0, 6]) for (let yy = y + 1; yy <= y + 2; yy++) K.B(x, yy, -11, T.TAPESTRY);
    K.lamp(-8, y + 2, -9, 1, {}); K.lamp(7, y + 2, -7, 3, {}); K.lamp(0, y + 2, -3, 2, {}); K.prop('armour', 6, y, -10, 2, {}, 'floor');
    return beds; };
  // v1.0.29: the keep's new top floor (laird's solar) and the oak stair up to it along the east wall
  U.solar = function (K, o) { const {B} = K, {CE, C2} = o, y = C2 + 1;
    for (let k = 0; k <= 3; k++) { const z = -3 - k; for (let yy = CE + 1; yy < CE + 1 + k; yy++) B(7, yy, z, T.PLANKS); K.stair(7, CE + 1 + k, z, 0, OAKST); }
    for (const z of [-4, -5, -6]) { B(7, C2, z, T.AIR); B(6, y, z, FEN); } K.stair(7, C2, -7, 0, OAKST);
    for (let x = -5; x <= 4; x++) if (x !== -1 && x !== 0) for (let yy = y; yy <= y + 1; yy++) B(x, yy, -10, T.BOOKSHELF);
    for (const x of [-3, 2]) for (let yy = y + 1; yy <= y + 3; yy++) B(x, yy, -2, T.TAPESTRY);
    K.prop('rug', -1, y, -6, 2, {w: 7, d: 4, v: 1}, 'floor'); for (const x of [-2, -1, 0, 1]) K.prop('table', x, y, -6, 2, {}, 'floor');
    K.lamp(-1, y + 2, -3, 2, {}); K.lamp(4, y + 2, -10, 0, {}); K.lamp(-6, y + 2, -10, 0, {}); K.prop('armour', -6, y, -3, 2, {}, 'floor');
    K.chest(-5, y, -3, 2, [[IT.GOLDINGOT, 2], [IT.BREAD, 4]]); };
  // ---------------- THE SKELETON CASTLE (images 3-4): crumbling pale ruin on a raised crag ----------------
  U.B.mossy = function (K) { const {B, box, h} = K, CH = 9, F = CH + 1;   // v1.0.29: a much taller crag
    const pale = (x, y, z) => { const v = h(x, y, z); return v < 0.32 ? T.STONEBRICK : v < 0.5 ? WST : v < 0.76 ? T.MOSSYBRICK : v < 0.92 ? T.COBBLE : T.STONE; };
    const rock = (x, y, z) => { const v = h(x, y + 40, z); return v < 0.5 ? T.STONE : v < 0.7 ? T.COBBLE : v < 0.85 ? (T.DEEPSLATE || T.STONE) : T.MOSSYBRICK; };
    // the crag: a flat top (r<=13) falling away in rough steps to the ground by r~21
    const top = (x, z) => { const r = Math.max(Math.abs(x), Math.abs(z)) * 0.8 + Math.hypot(x, z) * 0.2 + (h(x, 7, z) - 0.5) * 2.2; return r <= 13.5 ? CH : Math.round(CH - (r - 13.5) * 1.3); };
    for (let x = -22; x <= 22; x++) for (let z = -22; z <= 22; z++) { const t = top(x, z); if (t < 0 || Math.hypot(x, z) > 22) continue; for (let y = 0; y <= t; y++) B(x, y, z, rock(x, y, z));
      const v = h(x, 9, z); B(x, t, z, t === CH ? (v < 0.4 ? MOSS : v < 0.62 ? T.COBBLE : v < 0.8 ? GRAV : POD) : (v < 0.35 ? MOSS : v < 0.5 ? GRAV : rock(x, t, z))); }
    // steps cut into the crag up to the gate, ferns and a ladder up the rock
    for (let k = 0; k <= CH + 1; k++) for (let x = -2; x <= 1; x++) { const z = 14 + k, y = CH - 1 - k; if (y < -1) continue; for (let yy = y + 1; yy <= CH + 3; yy++) B(x, yy, z, T.AIR); if (y >= 0) { K.stair(x, y, z, 0, 165); for (let yy = 0; yy < y; yy++) B(x, yy, z, rock(x, yy, z)); } }
    for (let k = 0; k <= CH + 1; k++) for (const x of [-3, 2]) { const t = CH - k; if (t >= 0) for (let y = 0; y <= t; y++) B(x, y, 14 + k, rock(x, y, 14 + k)); }
    // curtain wall (2 thick), crumbling: a ragged top, breaches, fallen stones
    const WT = F + 5;
    for (let x = -11; x <= 11; x++) for (let z = -11; z <= 11; z++) { const d = Math.max(Math.abs(x), Math.abs(z)); if (d < 10) continue; const v = h(x, 11, z), gap = h(Math.floor(x / 3), 12, Math.floor(z / 3)) < 0.18;
      const tt = gap ? F + (v < 0.5 ? 0 : 1) : WT - (v < 0.25 ? 2 : v < 0.5 ? 1 : 0); for (let y = F - 1; y <= tt; y++) B(x, y, z, pale(x, y, z)); if (d === 11 && !gap && ((x + z) & 1) === 0 && v > 0.3) B(x, tt + 1, z, pale(x, tt + 1, z)); }
    // four broken corner towers
    for (const [tx, tz] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) { const th = F + 9 + (h(tx, 13, tz) * 4 | 0);
      for (let a = -2; a <= 2; a++) for (let q = -2; q <= 2; q++) { const e = Math.abs(a) === 2 || Math.abs(q) === 2, cut = th - (Math.abs(a + q * 0.7) * 1.4 + h(tx + a, 14, tz + q) * 3 | 0) - (a * Math.sign(tx) < 0 ? 3 : 0);
        for (let y = F - 1; y <= cut; y++) B(tx + a, y, tz + q, e ? pale(tx + a, y, tz + q) : y === F + 5 && h(a, y, q) < 0.6 ? T.PLANKS : T.AIR); }
      for (const y of [F + 2, F + 6]) { B(tx + Math.sign(tx) * 2, y, tz, T.AIR); B(tx, y, tz + Math.sign(tz) * 2, T.AIR); } for (let y = F; y <= F + 1; y++) B(tx - Math.sign(tx) * 2, y, tz - Math.sign(tz), T.AIR);
      const gz = tz + Math.sign(tz) * 2; for (let k = 0; k <= 3; k++) for (let a = -2 + k; a <= 2 - k; a++) if (h(tx + a, 60 + k, tz) < 0.8 || k === 0) for (let y = F; y <= th + k; y++) B(tx + a, y, gz, pale(tx + a, y, gz)); }
    for (const z of [10, 11]) { box(-8, F, z, -6, F + 2, z, T.AIR); B(-7, F + 3, z, T.AIR); }
    // gate: a broken arch, one door hanging on, two stumps of gate towers
    for (const tx of [-3, 2]) for (let a = -1; a <= 1; a++) for (let q = -1; q <= 1; q++) { const ht = F + 7 - (tx < 0 ? 0 : 3) - (h(tx + a, 15, q) * 2 | 0); for (let y = F - 1; y <= ht; y++) B(tx + a, y, 11 + q, pale(tx + a, y, 11 + q)); }
    box(-1, F, 10, 0, F + 2, 12, T.AIR); box(-1, F + 3, 10, 0, F + 3, 12, (x, y, z) => pale(x, y, z)); K.door(-1, F, 11, 2);
    // the ruined keep at the back (roofless, broken), stair down into the crypt
    const X0 = -8, X1 = 7, Z0 = -9, Z1 = -3;
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) { const e = x === X0 || x === X1 || z === Z0 || z === Z1, tt = F + 8 - (h(x, 16, z) * 3 | 0) - (x > 3 ? 4 : 0) - (z === Z1 && x > -2 ? 2 : 0); if (e) for (let y = F - 1; y <= tt; y++) B(x, y, z, pale(x, y, z)); else if (h(x, 17, z) < 0.12) B(x, F, z, pale(x, F, z)); }
    for (const x of [-6, -3, 2]) for (const y of [F + 2, F + 3]) B(x, y, Z0, T.AIR); box(-1, F, Z1, 0, F + 2, Z1, T.AIR); box(4, F + 1, Z1, 5, F + 4, Z1, T.AIR);
    // courtyard: graves, bones, ferns
    for (const [x, z] of [[5, 4], [7, 4], [5, 7], [7, 7], [-7, 5]]) { B(x, F, z, h(x, 18, z) < 0.5 ? T.MOSSYBRICK : T.COBBLE); if (h(x, 19, z) < 0.7) B(x, F + 1, z, T.COBBLE); B(x, CH, z + 1, POD); }
    for (let x = -9; x <= 9; x++) for (let z = -2; z <= 9; z++) { const v = h(x, 20, z); if (K.G(x, F, z) !== T.AIR || Math.abs(x + 0.5) < 2) continue; if (v < 0.08) B(x, F, z, FERN); else if (v < 0.12) K.prop('bones', x, F, z, (v * 100 | 0) & 3, {}, 'floor'); else if (v < 0.135) B(x, F, z, pale(x, F, z)); }
    U.bigKeep(K, {F, pale});
    U.crypt(K, {CH, F, rock, pale});
    U.ruinDeco(K, {CH, F, WT, pale});
    return {crag: CH};
  };
  // v1.0.29: the tall central keep tower (image 3) - broken crenellated top, a spiral stair round a stone core to a lookout
  U.bigKeep = function (K, o) { const {B, h} = K, {F, pale} = o, x0 = 0, x1 = 6, z0 = -9, z1 = -3, TOP = F + 22;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const e = x === x0 || x === x1 || z === z0 || z === z1, core = x >= 2 && x <= 4 && z >= -7 && z <= -5;
      const tt = TOP - (h(x, 70, z) * 3 | 0) - (x > 4 && z < -6 ? 5 : 0); for (let y = F; y <= tt + 1; y++) B(x, y, z, e ? pale(x, y, z) : core && y < F + 20 ? pale(x, y, z) : T.AIR);
      if (e && tt >= TOP - 1 && ((x + z) & 1) === 0) B(x, tt + 2, z, pale(x, tt + 2, z)); }
    for (let y = F; y <= F + 2; y++) for (const x of [3, 4]) B(x, y, z1, T.AIR);
    const ring = []; for (let z = -4; z >= -8; z--) ring.push([1, z]); for (let x = 2; x <= 5; x++) ring.push([x, -8]); for (let z = -7; z <= -4; z++) ring.push([5, z]); for (let x = 4; x >= 2; x--) ring.push([x, -4]);
    const fc = (a, b) => b[0] > a[0] ? 3 : b[0] < a[0] ? 1 : b[1] > a[1] ? 2 : 0;
    for (let k = 0; k < 20; k++) { const c = ring[k % 16], n = ring[(k + 1) % 16]; K.stair(c[0], F + k, c[1], fc(c, n), 165); }
    for (let x = 1; x <= 5; x++) for (let z = -8; z <= -4; z++) if (!(x === ring[2][0] && z === ring[2][1]) && !(x === ring[3][0] && z === ring[3][1])) B(x, F + 20, z, pale(x, F + 20, z));
    K.stair(ring[4][0], F + 20, ring[4][1], fc(ring[4], ring[5]), 165);
    for (const y of [F + 5, F + 11, F + 17]) { B(x1, y, -6, T.AIR); B(x0, y, -6, T.AIR); B(3, y, z0, T.AIR); }
    K.lamp(3, F + 21, -6, -1, {soul: 1}); };
  // ---------------- the crypt under the crag (image 4): coffins, bone pillars, skull niches, soul lanterns, archery range ----------------
  U.crypt = function (K, o) { const {B, box, h} = K, {CH, pale} = o, ST = new Set();
    for (let x = -10; x <= 10; x++) for (let z = -9; z <= 7; z++) { const e = Math.abs(x) === 10 || z === -9 || z === 7; if (K.G(x, CH, z) === GRAV) B(x, CH, z, T.COBBLE);
      for (let y = 0; y < CH; y++) { if (y === 0) { const v = h(x, 30, z); B(x, 0, z, v < 0.4 ? T.STONEBRICK : v < 0.62 ? T.MOSSYBRICK : v < 0.78 ? T.COBBLE : v < 0.9 ? MOSS : T.STONE); } else B(x, y, z, e ? pale(x, y, z) : T.AIR); } }
    // stair down from the keep (along the north wall), filled beneath
    for (let k = 0; k <= CH - 2; k++) for (const z of [-8, -7]) { const x = -2 - k, y = CH - 1 - k; K.stair(x, y, z, 3, 165); for (let yy = 1; yy < y; yy++) B(x, yy, z, pale(x, yy, z)); for (let yy = y + 1; yy <= Math.min(CH + 1, y + 3); yy++) B(x, yy, z, T.AIR); ST.add(x + ',' + z); }
    for (const z of [-8, -7]) B(-1, CH, z, T.COBBLE);
    // two rows of stone coffins with bone lids
    for (const x of [-8, -6, -4, -2]) for (const z0 of [-4, 3]) { B(x, 1, z0, T.STONEBRICK); B(x, 1, z0 + 1, T.STONEBRICK); K.prop('coffin', x, 1, z0, 2, {}, [x, 1, z0]); }
    for (const x of [-7, -3, 1]) for (const z of [-4, 4]) { for (let y = 1; y < CH; y++) B(x, y, z, WST); K.prop('bonecol', x, 1, z, 2, {h: CH - 1}, [x, 1, z]); }
    // skulls in wall niches
    const niche = (x, y, z, f) => { B(x, y, z, T.AIR); K.prop('skull', x, y, z, f, {}, [x, y - 1, z]); };
    for (let x = 1; x <= 9; x += 2) { niche(x, 2, -9, 2); niche(x, 4, -9, 2); niche(x, 6, -9, 2); } for (let x = -9; x <= -1; x += 2) { niche(x, 2, 7, 0); niche(x, 4, 7, 0); } for (let z = 1; z <= 5; z += 2) niche(-10, 3, z, 3);
    // archery range: targets on the east wall, a shooting line, bow racks
    for (const z of [-5, -1, 3]) K.prop('target', 9, 1, z, 1, {}, 'floor'); for (const z of [-7, -6, -5, 3, 4, 5]) B(3, 1, z, FEN);
    for (const x of [5, 7]) { K.prop('brack', x, 1, 6, 0, {}, 'wall'); K.prop('brack', x, 1, -8, 2, {}, 'wall'); } K.prop('srack', 9, 1, 6, 1, {}, 'floor');
    // broken barrels, a chest, bones, cobwebs, soul lanterns (few - it stays dark down here)
    for (const [x, z, v] of [[-9, 6, 1], [-9, 5, 0], [-8, 6, 1], [9, -8, 0], [8, -8, 1], [-9, -5, 1]]) K.prop('barrel', x, 1, z, 2, {v}, 'floor');
    K.chest(-9, 1, -1, 3, [[IT.IRONINGOT, 3], [IT.BREAD, 3], [IT.POTATO, 4], [IT.BONE, 5]]);
    for (let x = -9; x <= 9; x++) for (let z = -8; z <= 6; z++) { if (ST.has(x + ',' + z) || K.G(x, 1, z) !== T.AIR) continue; const v = h(x, 31, z), wall = Math.abs(x) === 9 || z === -8 || z === 6;
      if (wall && v < 0.3 && K.G(x, 5, z) === T.AIR) B(x, 5, z, T.COBWEB); else if (!wall && v < 0.06) K.prop('bones', x, 1, z, (v * 99 | 0) & 3, {}, 'floor'); }
    for (const [x, z] of [[-5, 0], [6, 0]]) K.lamp(x, CH - 1, z, -1, {ceil: 1, soul: 1}); for (const x of [-8, -5, -2, 1]) for (const z of [-1, 1]) { B(x, 1, z, pale(x, 1, z)); K.lamp(x, 2, z, -1, {soul: 1}); } K.lamp(-9, 3, -6, 1, {soul: 1});
    // a back tunnel out through the west side of the crag
    for (let x = -11; x >= -22; x--) { let any = false; for (let y = 1; y <= 3; y++) for (const z of [0, 1]) { if (K.G(x, y, z) !== T.AIR) any = true; B(x, y, z, y === 3 && x < -12 && h(x, 32, z) < 0.3 ? T.COBWEB : T.AIR); } for (const z of [0, 1]) if (K.G(x, 0, z) === T.AIR) B(x, 0, z, T.COBBLE); if (!any) break; }
  };
  // ---------------- ruin dressing: skulls on the battlements, grey banners, ladders, cobwebs, dead trees ----------------
  U.ruinDeco = function (K, o) { const {B, h} = K, {CH, F, WT} = o;
    const topAt = (x, z, y = WT + 3) => { for (; y >= F - 1; y--) if (K.G(x, y, z) !== T.AIR) return y; return -9; };
    for (let x = -11; x <= 11; x++) for (let z = -11; z <= 11; z++) { if (Math.max(Math.abs(x), Math.abs(z)) !== 11 || h(x, 40, z) > 0.2) continue; const t = topAt(x, z, F + 14); if (t < F + 2 || K.G(x, t + 1, z) !== T.AIR) continue;
      K.prop('skull', x, t + 1, z, z === 11 ? 2 : z === -11 ? 0 : x === 11 ? 3 : 1, {}, 'floor'); }
    for (const [x, z, f] of [[-6, 12, 2], [5, 12, 2], [12, -4, 3], [12, 5, 3], [-12, -1, 1], [-12, 6, 1], [-4, -12, 0], [5, -12, 0]]) { const fv = [[0, -1], [-1, 0], [0, 1], [1, 0]][f], t = topAt(x - fv[0], z - fv[1]); if (t >= F + 3) K.prop('banT', x, t, z, f, {v: 2}, 'wall'); }
    K.prop('ladder', -5, F, 9, 0, {L: 5}, 'wall'); K.prop('ladder', 9, F, -5, 1, {L: 5}, 'wall'); K.prop('ladder', 4, F, -4, 0, {L: 4}, 'wall');
    for (const [tx, tz] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) for (let a = -1; a <= 1; a++) for (let q = -1; q <= 1; q++) if (h(tx + a, 41, tz + q) < 0.3 && K.G(tx + a, F + 4, tz + q) === T.AIR) B(tx + a, F + 4, tz + q, T.COBWEB);
    for (const [x, y, z] of [[-1, F + 2, 10], [0, F + 2, 12], [-7, F + 3, -8], [6, F + 2, -8]]) if (K.G(x, y, z) === T.AIR) B(x, y, z, T.COBWEB);
    // dead trees on the crag and around it
    let n = 0; for (let i = 0; i < 40 && n < 8; i++) { const a = h(i, 42, 7) * Math.PI * 2, r = 9 + h(i, 43, 7) * 13, x = Math.round(Math.cos(a) * r), z = Math.round(Math.sin(a) * r);
      if (Math.abs(x + 0.5) < 5 && z > 8) continue; if (Math.max(Math.abs(x), Math.abs(z)) <= 12 && Math.max(Math.abs(x), Math.abs(z)) >= 9) continue;
      const g = topAt(x, z, CH + 1); if (g < -1 || K.G(x, g + 1, z) !== T.AIR) continue; const ht = 4 + (h(i, 44, 7) * 3 | 0); n++;
      for (let y = g + 1; y <= g + ht; y++) K.log(x, y, z, ALD, 0);
      for (const [dx, dz, k] of [[1, 0, 1], [-1, 0, 2], [0, 1, 1], [0, -1, 2]]) if (h(i, 45 + k, dx * 3 + dz) < 0.6) { const yy = g + ht - k; K.log(x + dx, yy, z + dz, ALD, dx ? 1 : 2); if (h(i, 49, dx + dz * 5) < 0.5) K.log(x + 2 * dx, yy + 1, z + 2 * dz, ALD, 0); }
      for (const [dx, dz] of [[2, 1], [-1, 2], [1, -2]]) if (K.G(x + dx, g + 1, z + dz) === T.AIR && K.G(x + dx, g, z + dz) !== T.AIR && h(i, 50, dx) < 0.5) B(x + dx, g + 1, z + dz, THORN); }
  };
})();
