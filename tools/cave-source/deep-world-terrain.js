/* GLX-DEEP (v1.2.2): open connected strata, dry eye bowl, preserve existing worlds.
   One natural voxel producer, no new assets, no new per-frame graphics/lights.
   Existing Agartha and surface wrappers, edits/AIR, legacy below-floor shafts and
   incremental C324 load/eviction/mesher remain unchanged. */

(function deepWorld() {
  const U = window.__dw = {err: null, on: 0, n: 0, floorY: -237, ver: '1.2.2'};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const S = Math.sin, F = Math.floor;
  const h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const n2 = (x, z, s) => 0.5 * S(x * 0.011 + s) * S(z * 0.013 - s * 1.3) + 0.3 * S(x * 0.031 - z * 0.027 + s * 2.1) + 0.2 * S(x * 0.077 + z * 0.069 - s);
  const FLOOR = U.floorY;
  // Landmark hell chamber centre (Scotland mainland, well below Agartha Y range)
  const HX = U.hellX = 432, HZ = U.hellZ = 180, HR = U.hellR = 48;
  // bands by depth below sea (fitted above Y -237). Hell band is the tallest.
  const B = [[40, 72, 56, 12], [72, 110, 91, 14], [110, 148, 129, 14], [148, 186, 167, 14], [186, 214, 200, 12], [214, 290, 250, 36]];
  const band = d => { for (let i = 0; i < B.length; i++) if (d < B[i][1]) return i; return B.length - 1; };
  window.__c334 = {B, band, deep: null, dw: 1, floorY: FLOOR, hellX: HX, hellZ: HZ, hellR: HR};
  const TOP = 40;
  // Hell layer ~70 tall for the giant eye clearance; others ~32-36
  const PV_OF = i => (i === 5 ? 70 : 34);
  // Grandfather columns from saved edits below the natural floor (includes air/removal edits).
  // Per-column min edit Y + clearance; seal only below that. No fixed absolute seal. No per-frame full scan.
  const CLEAR = 12; // air/open clearance below deepest edit in a column
  const DROP_MARGIN = 48; // drops may fall a bit below the open shaft
  const legacy = U.legacy = new Set();
  const colMin = U.colMin = new Map(); // colKey -> min Y of any edit (incl. air)
  const colKey = (x, z) => (x | 0) + ',' + (z | 0);
  function refreshBounds() {
    let mn = FLOOR;
    for (const y of colMin.values()) if (y < mn) mn = y;
    U.minLegacyY = colMin.size ? mn : null;
    // Natural floor stays -237; open legacy shafts seal at minY-CLEAR; drops cull below that - margin
    U.sealFloorY = colMin.size ? (mn - CLEAR) : FLOOR;
    U.dropFloorY = (colMin.size ? (mn - CLEAR - DROP_MARGIN) : FLOOR) - 8;
    try { window.__c334.dropFloorY = U.dropFloorY; window.__c334.sealFloorY = U.sealFloorY; window.__c334.minLegacyY = U.minLegacyY; } catch (_) {}
  }
  function noteLegacy(x, y, z) {
    if (!(y < FLOOR)) return;
    const ck = colKey(x, z);
    legacy.add(ck);
    const prev = colMin.has(ck) ? colMin.get(ck) : Infinity;
    if (y < prev) colMin.set(ck, y);
    refreshBounds();
  }
  function rebuildLegacy() {
    try {
      legacy.clear(); colMin.clear();
      const e = window.__c320; if (!e || !e.edits) { refreshBounds(); return; }
      for (const [k, v] of e.edits) { // v may be 0 (air/removal) — still preserves access
        const p = k.split(','); const y = +p[1];
        if (y < FLOOR) { const ck = p[0] + ',' + p[2]; legacy.add(ck); const prev = colMin.has(ck) ? colMin.get(ck) : Infinity; if (y < prev) colMin.set(ck, y); }
      }
      U.legacyN = legacy.size; refreshBounds();
    } catch (e) { ERR('legacy', e); }
  }
  U.rebuildLegacy = rebuildLegacy; U.noteLegacy = noteLegacy;
  // Incremental update on place/break — avoid rescanning all edits every setB
  try {
    const s0 = setB;
    setB = function (x, y, z, v) {
      const r = s0.apply(this, arguments);
      try { const yi = Math.floor(y); if (yi < FLOOR) noteLegacy(Math.floor(x), yi, Math.floor(z)); } catch (_) {}
      return r;
    };
  } catch (_) {}
  setInterval(() => { try { const e = window.__c320; if (!e) return; if (e._dwLeg !== e.edits.size) { e._dwLeg = e.edits.size; rebuildLegacy(); } } catch (_) {} }, 2000);
  function legacyOpen(x, y, z) {
    const ck = colKey(x, z); if (!legacy.has(ck)) return false;
    const minY = colMin.get(ck); if (minY == null) return false;
    return y >= minY - CLEAR; // open from clearance below deepest edit up through the floor
  }
  function legacySealAt(x, z) {
    const ck = colKey(x, z); if (!legacy.has(ck)) return FLOOR;
    const minY = colMin.get(ck); return (minY == null ? FLOOR : minY - CLEAR);
  }
  U.legacyOpen = legacyOpen; U.legacySealAt = legacySealAt;

  let M = null;
  const mats = () => M || (M = {
    rock: [[T.STONE,T.WSTONE],[T.STONE,T.MOSSYBRICK],[T.DEEPSLATE,T.DSCOBBLE],
      [T.BLACKSTONE,T.MOONBASALT],[T.HELLROCK,T.BASALTCOL],[T.OBSIDIAN,T.BASALTCOL],[T.HELLROCK,T.BLACKSTONE]],
    floor: [T.GRAVEL,T.MOSS||T.GRASS,T.DSTILE,T.BLACKSTONE,T.HELLROCK,T.GEODE,T.HELLROCK],
    glow: [T.GLOWROCK,T.GLOWGRASS||T.MOSS||T.GRASS,T.CRYCYAN,T.MAGMA,T.MAGMA,T.CRYVIOLET,T.MAGMA],
    ore: [[T.COALORE,T.IRONORE,T.COPPERORE],[T.COPPERORE,T.IRONORE],[T.DIAMONDORE,T.REDORE],
      [T.GOLDORE,T.REDORE],[T.GOLDORE],[T.DIAMONDORE],[T.DIAMONDORE,T.GOLDORE]].map(a=>a.filter(Boolean))
  });
  function rock(i,x,y,z,surf) {
    const m=mats(),h=h3(x,y,z);
    if(h<.014){const o=m.ore[i];if(o.length&&h3(x>>1,y>>1,z>>1)<.5)return o[F(h*1000)%o.length];}
    if(surf)return h<.025?m.glow[i]:m.floor[i];
    return ((x>>3)+(y>>2)+(z>>3))&1?m.rock[i][0]:m.rock[i][1];
  }
  // World-space strata with a taller central eye dome through the crystal ring. Agartha
  // -50..-2, surface and the original -237 floor/legacy shafts stay intact.
  U.rooms=[
    {name:'gray',floor:-68,roof:-51,r:54},
    {name:'lush',floor:-104,roof:-73,r:57},
    {name:'blue',floor:-140,roof:-109,r:58},
    {name:'magma',floor:-164,roof:-145,r:59},
    {name:'molten',floor:-185,roof:-169,r:62},
    {name:'abyssal-crystal',floor:-206,roof:-190,r:58},
    {name:'core',floor:-236,roof:-181,r:66}
  ];
  U.entrance=[HX+54,-52,HZ];U.core=[HX,HZ,'dry ledge -236; eye centre -209'];
  U.stair=(x,y,z)=>stair(x,y,z);U.routePoint=n=>pathAxis(-52-n);
  const rr=(x,z)=>Math.hypot(x+.5-HX,z+.5-HZ);
  // Simple repeatable square spiral: complete one turn every 48 blocks depth.
  // The same deterministic path is opened in chamber rims and all separators.
  const AX=HX+54,AZ=HZ;
  function pathAxis(y){
    const n=(((-y-52)%48)+48)%48;
    if(n<12)return [AX-6+n,HZ-6];
    if(n<24)return [AX+6,HZ-6+n-12];
    if(n<36)return [AX+6-(n-24),HZ+6];
    return [AX-6,HZ+6-(n-36)];
  }
  function stair(x,y,z){const q=pathAxis(y);return Math.abs(x-q[0])<=1&&Math.abs(z-q[1])<=1;}
  // One height per ring column: no overlapping treads/low ceiling at square corners.
  function stairVoxel(x,y,z){
    const dx=x-AX,dz=z-HZ,edge=Math.max(Math.abs(dx),Math.abs(dz));
    if(edge<5||edge>7||y>-47||y<-236)return null;
    const clamp=v=>Math.max(-6,Math.min(6,v));let phase;
    if(dz<=-Math.abs(dx))phase=clamp(dx)+6;
    else if(dx>=Math.abs(dz))phase=18+clamp(dz);
    else if(dz>=Math.abs(dx))phase=30-clamp(dx);
    else phase=42-clamp(dz);
    phase%=48;
    const turn=Math.round((-52-phase-y)/48),floor=-52-phase-48*turn;
    if(turn<0||floor<-235||floor>-52)return null;
    if(y>=floor-2&&y<=floor+4)return y<=floor?T.STONE:0;
    return null;
  }
  function portal(x,y,z){
    const i=roomAt(x,y,z);if(i<0)return false;
    const q=U.rooms[i],fy=q.floor;
    return i<6?y>fy&&y<fy+8&&Math.abs(z-HZ)<9&&x>HX+25&&x<AX+9 :y>q.floor&&y<-216&&Math.abs(z-HZ)<9&&x>HX+43&&x<AX+9;
  }
  function roomAt(x,y,z){
    // The giant original eye needs a full-height central dome; crystal is its outer ring.
    if(y>=-236&&y<=-181&&(y< -206||rr(x,z)<30))return 6;
    for(let i=0;i<6;i++){const q=U.rooms[i];if(y>=q.floor&&y<=q.roof)return i;}
    return -1;
  }
  const pillar = (x,z,i,r) => r > 26 && r < U.rooms[i].r - 11 && Math.floor((Math.atan2(z-HZ,x-HX)+Math.PI)/(Math.PI/4)+i/3) % 4 === 0;
  function fungus(x,y,z,floor){
    const cx=F(x/24),cz=F(z/24),q=h3(cx,44,cz);if(q>.3)return 0;
    const px=cx*24+6+F(h3(cz,45,cx)*13),pz=cz*24+6+F(h3(cx,46,cz)*13),r=Math.hypot(x+.5-px,z+.5-pz),h=y-floor,s=9+F(q*34),cap=3+q*12;
    if(r<1.5&&h<s&&h>=0)return T.LOG;
    if(h===s-1&&r<cap||h===s&&r<cap*.72)return T.WOOLPURPLE;
    if(r<3&&h>s&&h<s+9&&h3(x,13,z)>.35||r>1.5&&r<cap&&h>2&&h<s-1&&h3(x,y,z)<.075)return T.LEAVES;
    return 0;
  }
  function isLava(x,z,i,r){const a=Math.atan2(z-HZ,x-HX);
    return i===3&&(Math.abs(a-.95)<.05||Math.abs(a+1.75)<.05)&&r>30||i===4&&r>32&&(Math.abs(z-HZ-20)<2||r>57&&Math.abs(a+1.4)<.12)||i===6&&r>58&&Math.abs(a)>.23;
  }
  function level(x,y,z,d){

    const sv=stairVoxel(x,y,z);if(sv!==null)return sv;
    // Dry final approach crosses the raised bowl rim without a jump into lava.
    if(x>=HX&&x<=AX+8&&Math.abs(z-HZ)<=7&&y>=-236&&y<=-232)return y===-236?T.HELLROCK:0;
    const i=roomAt(x,y,z);if(i<0)return rock(Math.min(6,F((d-40)/30)),x,y,z,false);
    const q=U.rooms[i],r=rr(x,z),a=Math.atan2(z-HZ,x-HX);
    const radius=q.r+Math.sin(a*7)*2;
    if(portal(x,y,z))return 0;
    if(r>radius)return rock(i,x,y,z,false);
    const floor=i===6?q.floor+F(Math.min(1,Math.max(0,(r-28)/36))**2*35):q.floor;
    const roof=i===6?q.roof-F(Math.max(0,r-28)*.55):q.roof-F(Math.max(0,r-29)*.2);
    if(y<floor-1||y>roof)return rock(i,x,y,z,false);
    if(isLava(x,z,i,r)&&y===floor)return T.LAVA;
    if(y===floor)return i===1&&h3(x,9,z)<.18?(T.GLOWGRASS||T.MOSS||T.GRASS):rock(i,x,y,z,true);
    if(y<floor)return rock(i,x,y,z,false);
    if((i===3||i===4)&&isLava(x,z,i,r)&&r>radius-3&&y<roof-2)return T.LAVA;
    if(pillar(x,z,i,r))return i===2?(T.DEEPSLATE||T.STONE):(i===3||i===4)?(T.BASALTCOL||T.BLACKSTONE||T.OBSIDIAN||T.STONE):rock(i,x,y,z,false);
    if(i===1){const f=fungus(x,y,z,floor);if(f)return f;}
    if(i===2&&y<floor+3&&(F(x/6)+F(z/6))%3===0)return T.DSTILE||T.DEEPSLATE||T.STONE;
    if(i===5&&r>39&&r<43&&y<floor+5)return T.CRYVIOLET||T.GEODE||190;
    if((i===0||i===5)&&y>roof-3&&h3(x,y,z)<.17)return i===5?(T.CRYVIOLET||T.GEODE||190):rock(i,x,y,z,false);
    return 0;
  }
  function gen(x,y,z,d){
    if(y<=FLOOR){if(legacyOpen(x,y,z))return 0;return T.BEDROCK||T.HBEDROCK||211;}
    if(legacyOpen(x,y,z))return 0;
    if(d<40)return rock(0,x,y,z,false);
    try {return level(x,y,z,d);}
    catch(e){ERR('gen',e);return T.STONE;}
  }

  window.__c334.deep=(x,y,z,d)=>gen(x,y,z,d);
  U.gen=gen;

  function hook() {
    const e = window.__c320; if (!e || !e.flat || !e.fearth || e.fearth.dw) return;
    if (window.__c341 && !e.fearth.c347) return;
    const f0 = e.fearth;
    const f = function (x, y, z) {
      if (y <= FLOOR) {
        if (window.__ukb && __ukb.out(x, z)) return 0;
        if (legacyOpen(x, y, z)) return 0;
        return T.BEDROCK || T.HBEDROCK || 211;
      }
      const a = y - SEA;
      if (a < -40) { if (window.__ukb && __ukb.out(x, z)) return 0; return gen(x, y, z, -a); }
      return f0.apply(this, arguments);
    };
    for (const k in f0) f[k] = f0[k]; f.c347 = f0.c347; f.top = f0.top; f.dw = 1; f.floorY = FLOOR; e.fearth = f; e.hol = null; e.pit = null; U.on++;
    try { if (window.__c324 && __c324.cache) __c324.cache.clear(); e.dirty = 1; e.edgeClr && e.edgeClr(); } catch (_) {}
    rebuildLegacy();
  }
  setInterval(() => { try { hook(); } catch (er) { ERR('hook', er); } }, 300);
  try {
    const BR = () => T.BEDROCK || T.HBEDROCK || 211;
    const boot = setInterval(() => {
      try {
        const id = BR(); if (!id || typeof HARD === 'undefined') return;
        HARD[id] = 600; MC_HARD[id] = 600; REQ[id] = 99; try { NEEDS_PICK.add(id); } catch (_) {}
        if (!NAMES[id]) NAMES[id] = 'Bedrock';
        clearInterval(boot);
      } catch (_) {}
    }, 400);
  } catch (_) {}
  // Keep heat shimmer hard-off if an older wrap re-enables it
  try { setInterval(() => { const el = document.getElementById('l567shim'); if (el) { el.style.opacity = '0'; el.style.display = 'none'; } }, 2000); } catch (_) {}
  const PO = {x: 432, z: -400, top: SEA + 4, lat: 90, n: [0, 1, 0]};
  window.__c332 = {err: null, pole: PO, SH: () => PO, PY: () => null, inner: () => false, ig: () => 2, towers: () => [],
    where: () => { try { const d = SEA - P.y; return DIM.cur ? '' : d > 180 ? 'deep' : ''; } catch (_) { return ''; } },
    toCity: () => { try { return !!(window.__agr && __agr.go()); } catch (_) { return false; } }};
})();
