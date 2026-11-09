/* v1.2.42: shared, cached prism / crystal-facet pass.
 * Inspired by the scottish-base-v2 crystal armour: cut-gem geometry,
 * flat facets with per-facet brightness, a deeper view-facing tint and a
 * grazing fresnel rim, without changing a subject's identity, colour or
 * overall silhouette. Used for held tool meshes, inventory icons, block
 * tiles, 3D iso icons, and the listed mobs/NPCs.
 * r128 MeshStandardMaterial only; the rim is a cheap onBeforeCompile term
 * (no transmission). Tool heads are real beveled / chamfered / tapered
 * gems (6-12 visible facets, pointed tips). Handles are faceted octagonal
 * shafts with metal ferrules. Boxy mobs get a jitter-free chamfer plus
 * short crystal-shard accents; skinned HD GLBs keep their authored
 * geometry and textures and only receive the material treatment. */
(function (W) {
  const T = W.THREE || (typeof THREE !== 'undefined' ? THREE : null);
  if (!T) return;
  const U = W.__prism1241 = W.__prism1241 || {};
  U.err = null; U.geoHits = 0; U.matHits = 0; U.geoMiss = 0; U.matMiss = 0;
  U.meshes = 0; U.icons = 0; U.tiles = 0; U.mobs = 0; U.on = 1;
  U.REV = 3;

  const geoCache = U.geoCache = new Map();
  const matCache = U.matCache = new Map();
  const tileCache = U.tileCache = new Map();
  const iconCache = U.iconCache = new Map();
  const dressed = U.dressed = new WeakSet();

  U.LISTED = {
    sheep: 1, haggis: 1, pig: 1, creeper: 1, treeman: 1,
    blackskel: 1, skeleton: 1, blazeskel: 1, clansman: 1, farmer: 1,
    alien: 1, paladien: 1, egyptian: 1, egypt: 1,
    zombie: 1, spider: 1, nspider: 1, ghost: 1,
    nm11: 1, hag: 1,           // Cailleach / Moss Hag
    nm22: 1, raincloud: 1,     // Storm Bogle / Thunner Cloudie
    wizard: 1, nmwizard: 1,
    // Reserved only. Exhaustive 1.2.40 search found no "Black Castle green
    // knight" kind: Black Castle is an island/build; the only "knight" is
    // MODELS.nm21 Plaguebeak Knight (dark plate, green lenses); castle
    // guardians (kind 'guardian') are black-armoured, red-eyed, and disabled.
    greenknight: 1, knight: 1
  };

  U.BUDGET = {tool: 800, gun: 2200, mobBox: 2500};

  function quality4k() {
    try { if (typeof QUALITY !== 'undefined' && QUALITY === '4k') return true; } catch (_) {}
    try { if (typeof HIGH !== 'undefined' && HIGH) return true; } catch (_) {}
    return !!(W.QUALITY === '4k' || W.HIGH);
  }
  U.quality4k = quality4k;
  U.iconSize = function () { return quality4k() ? 1024 : 256; };

  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function facetShade(nx, ny, nz) {
    const h = Math.sin(nx * 12.9898 + ny * 78.233 + nz * 45.164) * 43758.5453;
    const f = h - Math.floor(h);
    return 0.84 + 0.32 * (f < 0 ? f + 1 : f);
  }

  function GeoBuilder() { this.pos = []; this.nrm = []; this.col = []; }
  GeoBuilder.prototype.tri = function (a, b, c, color) {
    const n = new T.Vector3().subVectors(b, a).cross(new T.Vector3().subVectors(c, a));
    if (n.lengthSq() < 1e-16) return;
    n.normalize();
    const s = facetShade(n.x, n.y, n.z);
    const r = (color ? color[0] : 1) * s, g = (color ? color[1] : 1) * s, bcol = (color ? color[2] : 1) * s;
    this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    this.nrm.push(n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z);
    this.col.push(r, g, bcol, r, g, bcol, r, g, bcol);
  };
  GeoBuilder.prototype.quad = function (a, b, c, d, color) {
    this.tri(a, b, c, color);
    this.tri(a, c, d, color);
  };
  GeoBuilder.prototype.build = function () {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(this.col, 3));
    g.computeBoundingBox();
    g.computeBoundingSphere();
    g.userData = {prism1241: 1, prismCut: 1};
    return g;
  };

  function cached(key, fn) {
    if (geoCache.has(key)) { U.geoHits++; return geoCache.get(key); }
    U.geoMiss++;
    const g = fn();
    geoCache.set(key, g);
    return g;
  }

  function ringPts(y, rx, rz, sides, phase) {
    const pts = [];
    const ph = phase == null ? Math.PI / sides : phase;
    for (let i = 0; i < sides; i++) {
      const a = ph + i * Math.PI * 2 / sides;
      pts.push(V(Math.cos(a) * rx, y, Math.sin(a) * rz));
    }
    return pts;
  }
  function stitch(B, a, b, col) {
    const n = a.length;
    if (n === 1 && b.length > 1) {
      for (let i = 0; i < b.length; i++) B.tri(a[0], b[i], b[(i + 1) % b.length], col);
      return;
    }
    if (b.length === 1 && n > 1) {
      for (let i = 0; i < n; i++) B.tri(a[i], a[(i + 1) % n], b[0], col);
      return;
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      B.quad(a[i], a[j], b[j], b[i], col);
    }
  }

  // Cut gem along +Y, optional pointed tip / butt, mid girdle chamfer.
  // Typical viewing angle shows 6-12 facets. Deterministic, jitter-free.
  function cutGemGeometry(opts) {
    const o = opts || {};
    const L = o.length == null ? 0.4 : o.length;
    const rx = o.rx == null ? 0.06 : o.rx;
    const rz = o.rz == null ? rx : o.rz;
    const sides = Math.max(6, Math.min(12, o.sides || 8));
    const tip = o.tip == null ? 0.28 : o.tip;
    const butt = o.butt == null ? 0.18 : o.butt;
    const pointTip = o.pointTip !== false;
    const pointButt = !!o.pointButt;
    const girdle = o.girdle == null ? 0.07 : o.girdle;
    const key = 'gem:' + [L, rx, rz, sides, tip, butt, pointTip ? 1 : 0, pointButt ? 1 : 0, girdle].join(',');
    return cached(key, function () {
      const B = new GeoBuilder();
      const col = [1, 1, 1];
      const y0 = -L / 2, y1 = L / 2;
      const yb = y0 + L * butt;
      const yg0 = -L * girdle * 0.5, yg1 = L * girdle * 0.5;
      const yt = y1 - L * tip;
      const rings = [];
      if (pointButt) rings.push([V(0, y0, 0)]);
      else rings.push(ringPts(y0, rx * 0.16, rz * 0.16, sides));
      rings.push(ringPts(yb, rx * 0.92, rz * 0.92, sides));
      rings.push(ringPts(yg0, rx, rz, sides));
      rings.push(ringPts(yg1, rx * 0.96, rz * 0.96, sides));
      rings.push(ringPts(yt, rx * 0.52, rz * 0.52, sides));
      if (pointTip) rings.push([V(0, y1, 0)]);
      else rings.push(ringPts(y1, rx * 0.22, rz * 0.22, sides));
      for (let i = 0; i < rings.length - 1; i++) stitch(B, rings[i], rings[i + 1], col);
      return B.build();
    });
  }
  U.cutGemGeometry = cutGemGeometry;

  // Regular octagonal (or n-gon) shaft along +Y. Vertex radius = r so the
  // AABB matches a box of width 2r (silhouette preserved).
  function octShaftGeometry(r, length, taper, sides) {
    const sd = sides || 8;
    const tp = taper == null ? 1 : taper;
    const key = 'shaft:' + [r, length, tp, sd].join(',');
    return cached(key, function () {
      const B = new GeoBuilder();
      const col = [1, 1, 1];
      const y0 = -length / 2, y1 = length / 2;
      const r0 = r, r1 = r * tp;
      const a = ringPts(y0, r0, r0, sd);
      const mid = ringPts((y0 + y1) * 0.5, (r0 + r1) * 0.5, (r0 + r1) * 0.5, sd);
      const b = ringPts(y1, r1, r1, sd);
      stitch(B, a, mid, col);
      stitch(B, mid, b, col);
      // flat caps
      const c0 = V(0, y0, 0), c1 = V(0, y1, 0);
      for (let i = 0; i < sd; i++) {
        B.tri(c0, a[(i + 1) % sd], a[i], col);
        B.tri(c1, b[i], b[(i + 1) % sd], col);
      }
      return B.build();
    });
  }
  U.octShaftGeometry = octShaftGeometry;

  function rotateGeo(geo, axis, ang) {
    const g = geo.clone();
    if (axis === 'x') g.rotateX(ang);
    else if (axis === 'z') g.rotateZ(ang);
    else g.rotateY(ang);
    if (g.boundingBox) g.computeBoundingBox();
    if (g.boundingSphere) g.computeBoundingSphere();
    return g;
  }
  function gemAlong(axis, length, rx, rz, opts) {
    const o = Object.assign({length: length, rx: rx, rz: rz == null ? rx : rz}, opts || {});
    const g = cutGemGeometry(o);
    if (axis === 'x') return cached('rotX:' + (g.uuid || o.length), function () { return rotateGeo(g, 'z', -Math.PI / 2); });
    if (axis === 'z') return cached('rotZ:' + (g.uuid || o.length), function () { return rotateGeo(g, 'x', Math.PI / 2); });
    return g;
  }
  function shaftAlong(axis, length, r, taper, sides) {
    const g = octShaftGeometry(r, length, taper, sides);
    if (axis === 'x') return cached('shX:' + (g.uuid || length) + ':' + r, function () { return rotateGeo(g, 'z', -Math.PI / 2); });
    if (axis === 'z') return cached('shZ:' + (g.uuid || length) + ':' + r, function () { return rotateGeo(g, 'x', Math.PI / 2); });
    return g;
  }

  // Jitter-free chamfered box. Face mid-planes stay at the original extents
  // so the axis-aligned bounding box is unchanged.
  function chamferBoxGeometry(w, h, d, ch) {
    const hw = w / 2, hh = h / 2, hd = d / 2;
    let c = ch;
    if (c == null) c = Math.min(hw, hh, hd) * 0.22;
    c = Math.min(c, hw * 0.42, hh * 0.42, hd * 0.42);
    const key = 'chbox:' + [w, h, d, c].map(function (x) { return x.toFixed(5); }).join(',');
    return cached(key, function () {
      const B = new GeoBuilder();
      const col = [1, 1, 1];
      const P = V;
      // 6 inset faces
      B.quad(P(-(hw - c), hh, -(hd - c)), P((hw - c), hh, -(hd - c)), P((hw - c), hh, (hd - c)), P(-(hw - c), hh, (hd - c)), col);
      B.quad(P((hw - c), -hh, -(hd - c)), P(-(hw - c), -hh, -(hd - c)), P(-(hw - c), -hh, (hd - c)), P((hw - c), -hh, (hd - c)), col);
      B.quad(P(hw, -(hh - c), -(hd - c)), P(hw, (hh - c), -(hd - c)), P(hw, (hh - c), (hd - c)), P(hw, -(hh - c), (hd - c)), col);
      B.quad(P(-hw, (hh - c), -(hd - c)), P(-hw, -(hh - c), -(hd - c)), P(-hw, -(hh - c), (hd - c)), P(-hw, (hh - c), (hd - c)), col);
      B.quad(P(-(hw - c), -(hh - c), hd), P((hw - c), -(hh - c), hd), P((hw - c), (hh - c), hd), P(-(hw - c), (hh - c), hd), col);
      B.quad(P((hw - c), -(hh - c), -hd), P(-(hw - c), -(hh - c), -hd), P(-(hw - c), (hh - c), -hd), P((hw - c), (hh - c), -hd), col);
      // 12 edge bevels
      // +Y+X along Z
      B.quad(P(hw - c, hh, -(hd - c)), P(hw, hh - c, -(hd - c)), P(hw, hh - c, (hd - c)), P(hw - c, hh, (hd - c)), col);
      B.quad(P(-hw, hh - c, -(hd - c)), P(-(hw - c), hh, -(hd - c)), P(-(hw - c), hh, (hd - c)), P(-hw, hh - c, (hd - c)), col);
      B.quad(P(hw, -(hh - c), -(hd - c)), P(hw - c, -hh, -(hd - c)), P(hw - c, -hh, (hd - c)), P(hw, -(hh - c), (hd - c)), col);
      B.quad(P(-(hw - c), -hh, -(hd - c)), P(-hw, -(hh - c), -(hd - c)), P(-hw, -(hh - c), (hd - c)), P(-(hw - c), -hh, (hd - c)), col);
      // +Y+Z along X
      B.quad(P(-(hw - c), hh, hd - c), P((hw - c), hh, hd - c), P((hw - c), hh - c, hd), P(-(hw - c), hh - c, hd), col);
      B.quad(P((hw - c), hh, -(hd - c)), P(-(hw - c), hh, -(hd - c)), P(-(hw - c), hh - c, -hd), P((hw - c), hh - c, -hd), col);
      B.quad(P((hw - c), -hh, hd - c), P(-(hw - c), -hh, hd - c), P(-(hw - c), -(hh - c), hd), P((hw - c), -(hh - c), hd), col);
      B.quad(P(-(hw - c), -hh, -(hd - c)), P((hw - c), -hh, -(hd - c)), P((hw - c), -(hh - c), -hd), P(-(hw - c), -(hh - c), -hd), col);
      // +X+Z along Y
      B.quad(P(hw - c, -(hh - c), hd), P(hw, -(hh - c), hd - c), P(hw, (hh - c), hd - c), P(hw - c, (hh - c), hd), col);
      B.quad(P(hw, -(hh - c), -(hd - c)), P(hw - c, -(hh - c), -hd), P(hw - c, (hh - c), -hd), P(hw, (hh - c), -(hd - c)), col);
      B.quad(P(-hw, -(hh - c), hd - c), P(-(hw - c), -(hh - c), hd), P(-(hw - c), (hh - c), hd), P(-hw, (hh - c), hd - c), col);
      B.quad(P(-(hw - c), -(hh - c), -hd), P(-hw, -(hh - c), -(hd - c)), P(-hw, (hh - c), -(hd - c)), P(-(hw - c), (hh - c), -hd), col);
      // 8 corner triangles
      function corner(sx, sy, sz) {
        const fx = sx * (hw - c), fy = sy * (hh - c), fz = sz * (hd - c);
        const A = P(fx, sy * hh, sz * (hd - c));
        const Bv = P(sx * hw, fy, sz * (hd - c));
        const C = P(sx * (hw - c), fy, sz * hd);
        // winding so the normal points outward
        if (sx * sy * sz > 0) B.tri(A, Bv, C, col);
        else B.tri(A, C, Bv, col);
      }
      const s = [-1, 1];
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) corner(s[i], s[j], s[k]);
      return B.build();
    });
  }
  U.chamferBoxGeometry = chamferBoxGeometry;

  function flattenGeo(geo) {
    if (!geo || !geo.attributes || !geo.attributes.position) return geo;
    const k = 'flat:' + (geo.uuid || '') + ':' + (geo.index ? geo.index.count : 0) + ':' + geo.attributes.position.count;
    return cached(k, function () {
      let g;
      try {
        g = geo.index ? geo.toNonIndexed() : geo.clone();
        g.computeVertexNormals();
        if (!g.boundingBox) g.computeBoundingBox();
        if (!g.boundingSphere) g.computeBoundingSphere();
        g.userData = g.userData || {};
        g.userData.prism1241 = 1;
      } catch (e) { U.err = U.err || ('geo ' + e); g = geo; }
      return g;
    });
  }

  function isBoxGeo(geo) {
    if (!geo) return false;
    const p = geo.parameters;
    if (p && p.width != null && p.height != null && p.depth != null && p.radiusTop == null && p.radius == null) return true;
    const n = geo.attributes && geo.attributes.position && geo.attributes.position.count;
    if (n === 24 || n === 8) return true;
    if (geo.index && (geo.index.count === 36 || geo.index.count === 24) && n && n <= 24) return true;
    return false;
  }
  function isCylGeo(geo) {
    const p = geo && geo.parameters;
    return !!(p && p.radiusTop != null && p.height != null);
  }
  function boxSize(geo) {
    const p = geo.parameters;
    if (p && p.width != null) return [p.width, p.height, p.depth];
    if (!geo.boundingBox) geo.computeBoundingBox();
    const s = geo.boundingBox.getSize(new T.Vector3());
    return [s.x, s.y, s.z];
  }

  // Upgrade an existing mesh's geometry: boxes become chamfered (or a cut
  // gem / octagonal shaft when the aspect says "tool head / handle / barrel").
  // Low-poly only; skinned and dense HD meshes are left alone.
  function upgradeGeometry(geo, mesh) {
    if (!geo) return geo;
    if (geo.userData && geo.userData.prismCut) return geo;
    if (mesh && (mesh.isSkinnedMesh || (geo.attributes && geo.attributes.skinIndex))) return geo;
    const n = geo.attributes && geo.attributes.position && geo.attributes.position.count;
    if (isBoxGeo(geo)) {
      const dim = boxSize(geo);
      const ax = dim[0] >= dim[1] && dim[0] >= dim[2] ? 0 : (dim[1] >= dim[0] && dim[1] >= dim[2] ? 1 : 2);
      const long = dim[ax], mid = dim[(ax + 1) % 3], short = dim[(ax + 2) % 3];
      const thin = Math.min(mid, short);
      const thick = Math.max(mid, short);
      if (long > thin * 3.2 && thin < 0.09) {
        const axis = ax === 0 ? 'x' : ax === 2 ? 'z' : 'y';
        const square = thick / (thin || 1e-6) < 1.45;
        // Vertical square posts are handles; square posts along Z are gun barrels.
        // Horizontal or flattened pieces become pointed cut gems (heads / blades).
        if ((axis === 'y' || axis === 'z') && square) {
          return shaftAlong(axis, long, thick * 0.5, 1, 8);
        }
        return gemAlong(axis, long, thick * 0.5, thin * 0.5, {sides: 8, pointTip: true, pointButt: true, tip: 0.3, butt: 0.3});
      }
      return chamferBoxGeometry(dim[0], dim[1], dim[2], Math.min(dim[0], dim[1], dim[2]) * 0.2);
    }
    if (isCylGeo(geo)) {
      const p = geo.parameters;
      const r = Math.max(p.radiusTop, p.radiusBottom || p.radiusTop);
      return octShaftGeometry(r, p.height, (p.radiusTop && p.radiusBottom) ? p.radiusTop / (p.radiusBottom || p.radiusTop) : 1, 8);
    }
    if (n && n <= 36) return flattenGeo(geo);
    return geo;
  }
  U.upgradeGeometry = upgradeGeometry;

  // facetGeometry: public API used by tests and callers. Boxes become
  // chamfered (same AABB); other geo is flattened to per-face normals.
  function facetGeometry(geo) {
    if (!geo || !geo.attributes || !geo.attributes.position) return geo;
    if (isBoxGeo(geo)) {
      const dim = boxSize(geo);
      return chamferBoxGeometry(dim[0], dim[1], dim[2], Math.min(dim[0], dim[1], dim[2]) * 0.2);
    }
    return flattenGeo(geo);
  }
  U.facetGeometry = facetGeometry;

  function uniqueNormals(geo, eps) {
    if (!geo || !geo.attributes || !geo.attributes.normal) return 0;
    const e = eps || 0.04, n = geo.attributes.normal, seen = [];
    for (let i = 0; i < n.count; i++) {
      const v = [n.getX(i), n.getY(i), n.getZ(i)];
      let ok = true;
      for (let s = 0; s < seen.length; s++) {
        if (Math.abs(seen[s][0] - v[0]) < e && Math.abs(seen[s][1] - v[1]) < e && Math.abs(seen[s][2] - v[2]) < e) { ok = false; break; }
      }
      if (ok) seen.push(v);
    }
    return seen.length;
  }
  U.uniqueNormals = uniqueNormals;

  function countTris(root) {
    let n = 0;
    if (!root) return 0;
    if (root.isBufferGeometry || (root.attributes && root.attributes.position)) {
      const geo = root, ix = geo.index, pa = geo.attributes.position;
      return ix ? (ix.count / 3) : (pa.count / 3);
    }
    root.traverse(function (o) {
      if (!o.isMesh || !o.geometry) return;
      const geo = o.geometry, ix = geo.index, pa = geo.attributes && geo.attributes.position;
      if (!pa) return;
      n += ix ? (ix.count / 3) : (pa.count / 3);
    });
    return n;
  }
  U.countTris = countTris;

  function hex3(c) {
    if (!c) return [0.7, 0.78, 0.92];
    if (typeof c === 'number') return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
    if (c.isColor || (c.r != null && c.g != null)) return [c.r, c.g, c.b];
    return [0.7, 0.78, 0.92];
  }
  function rimFor(color, hint) {
    const rgb = hex3(color);
    const r = rgb[0], g = rgb[1], b = rgb[2];
    const crystal = hint === 'crystal' || hint === 'diamond' || hint === 'armour';
    if (crystal) return {deep: [0.62, 0.74, 0.92], glow: [0.30, 0.62, 1.0]};
    const deep = [Math.max(0.15, r * 0.72), Math.max(0.12, g * 0.72), Math.max(0.14, b * 0.82)];
    const glow = [
      Math.min(1, r * 0.45 + 0.35),
      Math.min(1, g * 0.50 + 0.45),
      Math.min(1, b * 0.55 + 0.65)
    ];
    if (hint === 'gold') return {deep: [0.62, 0.48, 0.18], glow: [1.0, 0.85, 0.40]};
    if (hint === 'wood') return {deep: [0.45, 0.28, 0.14], glow: [0.85, 0.70, 0.45]};
    return {deep: deep, glow: glow};
  }

  function attachRim(mat, hint) {
    if (!mat || mat.userData && mat.userData.prismRim1241) return mat;
    const rim = rimFor(mat.color, hint);
    mat.userData = mat.userData || {};
    mat.onBeforeCompile = function (shader) {
      shader.uniforms.crDeep = {value: new T.Vector3(rim.deep[0], rim.deep[1], rim.deep[2])};
      shader.uniforms.crGlow = {value: new T.Vector3(rim.glow[0], rim.glow[1], rim.glow[2])};
      // `normal` is only declared in <normal_fragment_begin>, which runs AFTER
      // <color_fragment>. Under FLAT_SHADED that declaration is the dFdx/dFdy
      // path, so injecting normalize(normal) at color_fragment fails to compile
      // on SwiftShader and on real low-end Android GPUs. Tint after the normal
      // exists; keep the emissive term on emissivemap_fragment (already after).
      const rimTint = '\n{\n  vec3 crN = normalize(normal);\n  vec3 crV = normalize(-vViewPosition);\n  float crF = pow(1.0 - clamp(abs(dot(crN, crV)), 0.0, 1.0), 1.45);\n  float facing = clamp(dot(crN, crV), 0.0, 1.0);\n  vec3 qn = sign(crN) * floor(abs(crN) * 3.0 + 0.51);\n  if (dot(qn, qn) < 1e-6) qn = crN; else qn = normalize(qn);\n  float fh = fract(sin(dot(qn, vec3(12.9898, 78.233, 45.164))) * 43758.5453);\n  diffuseColor.rgb *= mix(0.70, 1.24, fh);\n  diffuseColor.rgb *= mix(crDeep, vec3(1.16), crF);\n  diffuseColor.rgb *= mix(vec3(1.0), crDeep, facing * 0.28);\n}\n';
      let fs = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 crDeep;\nuniform vec3 crGlow;');
      if (fs.indexOf('#include <normal_fragment_maps>') >= 0)
        fs = fs.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>' + rimTint);
      else
        fs = fs.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>' + rimTint);
      fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{\n  vec3 crN = normalize(normal);\n  vec3 crV = normalize(-vViewPosition);\n  float crF = pow(1.0 - clamp(abs(dot(crN, crV)), 0.0, 1.0), 1.45);\n  totalEmissiveRadiance += crGlow * crF * 0.85;\n}\n');
      shader.fragmentShader = fs;
    };
    mat.customProgramCacheKey = function () { return 'prism1241v3-' + (hint || 'd'); };
    mat.userData.prismRim1241 = 1;
    mat.userData.prism1241 = 1;
    mat.flatShading = true;
    mat.needsUpdate = true;
    return mat;
  }

  function matKey(src, hint) {
    const c = src && src.color ? hex3(src.color) : [1, 1, 1];
    const mapId = src && src.map ? (src.map.uuid || 'map') : 'nomap';
    const em = src && src.emissive ? hex3(src.emissive) : [0, 0, 0];
    const vc = src && src.vertexColors ? 1 : 0;
    const op = src && src.opacity != null ? src.opacity : 1;
    return [hint || 'd', c[0].toFixed(3), c[1].toFixed(3), c[2].toFixed(3), mapId, em[0].toFixed(3), em[1].toFixed(3), em[2].toFixed(3), vc, op.toFixed(2)].join('|');
  }

  function prismMaterial(src, hint) {
    if (!src) src = new T.MeshStandardMaterial({color: 0x888888});
    if (typeof src === 'number') src = {color: src};
    const key = matKey(src, hint);
    if (matCache.has(key)) { U.matHits++; return matCache.get(key); }
    U.matMiss++;
    const color = src.color && src.color.clone ? src.color.clone() : new T.Color(src.color != null ? src.color : 0x888888);
    const crystal = hint === 'crystal' || hint === 'diamond' || hint === 'armour';
    const metal = hint === 'metal' || hint === 'gold' || hint === 'iron' || hint === 'cobalt';
    const mat = new T.MeshStandardMaterial({
      color: color,
      map: src.map || null,
      emissive: src.emissive && src.emissive.clone ? src.emissive.clone() : new T.Color(src.emissive || 0),
      emissiveIntensity: src.emissiveIntensity != null ? src.emissiveIntensity : 1,
      // Crystal tool heads must be solid: transparent/opacity < 1 made the
      // purple pickaxe a faint sliver on phones (t1119). Do not change armour.
      transparent: (crystal && hint !== 'armour') ? false : !!src.transparent,
      opacity: (crystal && hint !== 'armour') ? 1 : (src.opacity != null ? src.opacity : 1),
      depthWrite: true,
      side: src.side != null ? src.side : T.FrontSide,
      vertexColors: true,
      flatShading: true,
      metalness: metal ? (hint === 'gold' ? 0.7 : 0.5) : (crystal ? 0.18 : 0.04),
      roughness: metal ? 0.32 : (crystal ? 0.22 : (hint === 'wood' ? 0.58 : 0.45)),
      envMapIntensity: crystal ? 1.1 : 0.7
    });
    if (src.alphaMap) mat.alphaMap = src.alphaMap;
    if (src.normalMap) mat.normalMap = src.normalMap;
    attachRim(mat, hint || 'default');
    mat.userData.prism1241 = 1;
    matCache.set(key, mat);
    return mat;
  }
  U.prismMaterial = prismMaterial;

  function hintFromColor(c, fallback) {
    if (!c) return fallback || 'default';
    const r = c.r != null ? c.r : hex3(c)[0], g = c.g != null ? c.g : hex3(c)[1], b = c.b != null ? c.b : hex3(c)[2];
    if (r > 0.45 && g < 0.35 && b > 0.6) return 'crystal';
    if (g > 0.7 && b > 0.7 && r < 0.65) return 'crystal';
    if (r > 0.7 && g > 0.5 && b < 0.35) return 'gold';
    if (r > 0.25 && g > 0.12 && g < 0.55 && b < 0.28 && r > b + 0.08 && r >= g) return 'wood';
    return fallback || 'default';
  }

  const HEAD_HEX = {
    wood: 0xb08a55, stone: 0x8e9398, iron: 0xdfe3e8, gold: 0xf4c542,
    diamond: 0x6ff0ea, cobalt: 0x5a72e0,
    crystalpurple: 0xa64dff, crystalblue: 0x3ab8ff,
    metal: 0x9aa0a8, glass: 0xe8f4ff, paper: 0xe8d6a8, plastic: 0x15161a,
    food: 0xc9a05a, item: 0xc0392b
  };
  const FERRULE_HEX = {
    wood: 0x8a6230, stone: 0x6a6860, iron: 0x9aa0a8, gold: 0xd4a824,
    diamond: 0xc8d0d8, cobalt: 0x4a5a80,
    crystalpurple: 0x5a4630, crystalblue: 0x4a5a70, metal: 0x8a9098
  };
  const HAFT = 0x6b4a2a;

  function matFor(hex, hint, extra) {
    const src = {color: hex};
    if (extra) {
      if (extra.emissive != null) src.emissive = extra.emissive;
      if (extra.opacity != null) { src.opacity = extra.opacity; src.transparent = extra.opacity < 1; }
    }
    return prismMaterial(src, hint);
  }
  function addMesh(g, geo, mat, x, y, z, rx, ry, rz) {
    const m = new T.Mesh(geo, mat);
    if (x || y || z) m.position.set(x || 0, y || 0, z || 0);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    m.userData.prism1241Applied = 1;
    g.add(m);
    return m;
  }


  // Longer, thin, faceted crystal spike along a quadratic Bezier.
  // side = +1 / -1: two points arc out and down from the haft, like a real pick.
  function curvedPickSpikeGeometry(side, len, rise, drop, r0, r1, sides) {
    side = side < 0 ? -1 : 1;
    len = len || 0.46;
    rise = rise == null ? 0.055 : rise;
    drop = drop == null ? 0.16 : drop;
    r0 = r0 || 0.024;
    r1 = r1 == null ? 0.0022 : r1;
    sides = sides || 6;
    const zScale = (arguments.length > 7 && arguments[7] != null) ? arguments[7] : 0.55;
    const segs = 16;
    const p0 = new T.Vector3(0, 0, 0);
    const p1 = new T.Vector3(side * len * 0.36, rise, 0);
    const p2 = new T.Vector3(side * len, -drop, 0);
    const bez = function (t) {
      const u = 1 - t;
      return new T.Vector3(
        u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
        u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
        u * u * p0.z + 2 * u * t * p1.z + t * t * p2.z
      );
    };
    const pts = [], tans = [];
    for (let i = 0; i <= segs; i++) {
      const tt = i / segs;
      const a = bez(Math.max(0, tt - 0.012)), b = bez(Math.min(1, tt + 0.012));
      pts.push(bez(tt));
      const tan = b.sub(a);
      if (tan.lengthSq() < 1e-10) tan.set(side, 0, 0);
      tans.push(tan.normalize());
    }
    const pos = [], nrm = [], ix = [];
    for (let i = 0; i <= segs; i++) {
      const p = pts[i], tan = tans[i];
      let up = new T.Vector3(0, 0, 1);
      if (Math.abs(tan.dot(up)) > 0.86) up = new T.Vector3(0, 1, 0);
      const bin = new T.Vector3().crossVectors(tan, up).normalize();
      up = new T.Vector3().crossVectors(bin, tan).normalize();
      const r = r0 + (r1 - r0) * Math.pow(i / segs, 0.85);
      for (let k = 0; k < sides; k++) {
        const ang = (k / sides) * Math.PI * 2 + Math.PI / sides;
        // Flatten in Z so the blade stays slim, not chunky.
        const cx = Math.cos(ang) * r, cz = Math.sin(ang) * r * 0.48;
        const q = new T.Vector3().copy(p).addScaledVector(bin, cx).addScaledVector(up, cz);
        pos.push(q.x, q.y, q.z);
        const n = new T.Vector3().addScaledVector(bin, Math.cos(ang)).addScaledVector(up, Math.sin(ang)).normalize();
        nrm.push(n.x, n.y, n.z);
      }
    }
    const tip = pts[segs].clone().addScaledVector(tans[segs], r1 * 2.2);
    const tipI = pos.length / 3;
    pos.push(tip.x, tip.y, tip.z);
    nrm.push(tans[segs].x, tans[segs].y, tans[segs].z);
    for (let i = 0; i < segs; i++) {
      for (let k = 0; k < sides; k++) {
        const a = i * sides + k, b = i * sides + (k + 1) % sides;
        const c = (i + 1) * sides + k, d = (i + 1) * sides + (k + 1) % sides;
        ix.push(a, c, b, b, c, d);
      }
    }
    const base = segs * sides;
    for (let k = 0; k < sides; k++) ix.push(base + k, base + (k + 1) % sides, tipI);
    const rootC = pos.length / 3;
    pos.push(0, 0, 0); nrm.push(-tans[0].x, -tans[0].y, -tans[0].z);
    for (let k = 0; k < sides; k++) ix.push(rootC, (k + 1) % sides, k);
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
    geo.setIndex(ix);
    geo.computeVertexNormals();
    return geo;
  }
  U.curvedPickSpikeGeometry = curvedPickSpikeGeometry;



  // A single continuous thin crescent blade (two tips, inner glow UVs).
  // side length is the long (upper) tip; the short tip is ~0.72 of that.
  function crescentBladeGeometry(len, thick, wide) {
    len = len || 0.50; thick = thick || 0.007; wide = wide || 0.034;
    const key = 'crescentC:' + [len, thick, wide].join(',');
    if (!U._geo) U._geo = {};
    if (U._geo[key]) return U._geo[key];
    const segs = 16, sides = 6;
    // Slender full-C: long tapering tips, modest face width (not a sail),
    // enough depth to read as a blade rather than a ribbon.
    const topO = new T.Vector3(len * 0.13, len * 1.14, 0);
    const botO = new T.Vector3(len * 0.11, -len * 1.04, 0);
    const outerCtrl = new T.Vector3(len * 0.50, 0.03 * len, 0);
    const topI = new T.Vector3(len * 0.025, len * 0.96, 0);
    const botI0 = new T.Vector3(len * 0.025, -len * 0.86, 0);
    const innerCtrl = new T.Vector3(len * 0.00, 0.02 * len, 0);
    const pos = [], nrm = [], uv = [], ix = [];
    function bezier(a, c, b, t) {
      const u = 1 - t;
      return new T.Vector3(
        u * u * a.x + 2 * u * t * c.x + t * t * b.x,
        u * u * a.y + 2 * u * t * c.y + t * t * b.y,
        0
      );
    }
    const pts = [], tans = [], widths = [], inners = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const inner = bezier(botI0, innerCtrl, topI, t);
      const outer = bezier(botO, outerCtrl, topO, t);
      const p = inner.clone().add(outer).multiplyScalar(0.5);
      pts.push(p);
      inners.push(inner);
      widths.push(Math.max(0.004, inner.distanceTo(outer) * 0.5));
      const a = bezier(botO, outerCtrl, topO, Math.max(0, t - 0.01));
      const b = bezier(botO, outerCtrl, topO, Math.min(1, t + 0.01));
      const tan = b.sub(a);
      if (tan.lengthSq() < 1e-10) tan.set(0, 1, 0);
      tans.push(tan.normalize());
    }
    // Attach the haft at the inner belly (min inner x), not the tips.
    let sockI = Math.round(0.5 * segs), minX = Infinity;
    for (let i = 0; i <= segs; i++) { if (inners[i].x < minX) { minX = inners[i].x; sockI = i; } }
    const sockP = inners[sockI].clone();
    for (let i = 0; i <= segs; i++) { pts[i].sub(sockP); }
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, p = pts[i], tan = tans[i];
      const sock = 1 - Math.min(1, Math.abs(t - sockI / segs) / 0.54);
      const bladeW = widths[i] * (0.85 + 0.15 * Math.pow(sock, 0.7));
      const bladeT = thick * (0.55 + 0.45 * sock);
      // tip sharpen
      const tipFade = (t < 0.08) ? t / 0.08 : (t > 0.92 ? (1 - t) / 0.08 : 1);
      const w = bladeW * Math.pow(Math.max(0.05, tipFade), 0.55);
      const th = bladeT * Math.pow(Math.max(0.08, tipFade), 0.7);
      let bin = new T.Vector3().crossVectors(tan, new T.Vector3(0, 0, 1));
      if (bin.lengthSq() < 1e-8) bin = new T.Vector3(1, 0, 0);
      bin.normalize();
      const up = new T.Vector3().crossVectors(bin, tan).normalize();
      for (let k = 0; k < sides; k++) {
        const ang = (k / sides) * Math.PI * 2 + Math.PI / sides;
        const cx = Math.cos(ang) * w, cz = Math.sin(ang) * th;
        const q = new T.Vector3().copy(p).addScaledVector(bin, cx).addScaledVector(up, cz);
        pos.push(q.x, q.y, q.z);
        const n = new T.Vector3().addScaledVector(bin, Math.cos(ang)).addScaledVector(up, Math.sin(ang)).normalize();
        nrm.push(n.x, n.y, n.z);
        uv.push(k / sides, t);
      }
    }
    const tipI = pos.length / 3;
    const tipP = pts[segs].clone().addScaledVector(tans[segs], thick * 1.4);
    pos.push(tipP.x, tipP.y, tipP.z); nrm.push(tans[segs].x, tans[segs].y, tans[segs].z); uv.push(0.5, 1);
    const botI = pos.length / 3;
    const botP = pts[0].clone().addScaledVector(tans[0], -thick * 1.4);
    pos.push(botP.x, botP.y, botP.z); nrm.push(-tans[0].x, -tans[0].y, -tans[0].z); uv.push(0.5, 0);
    for (let i = 0; i < segs; i++) {
      for (let k = 0; k < sides; k++) {
        const a = i * sides + k, b = i * sides + (k + 1) % sides;
        const c = (i + 1) * sides + k, d = (i + 1) * sides + (k + 1) % sides;
        ix.push(a, c, b, b, c, d);
      }
    }
    const last = segs * sides;
    for (let k = 0; k < sides; k++) ix.push(last + k, last + (k + 1) % sides, tipI);
    for (let k = 0; k < sides; k++) ix.push((k + 1) % sides, k, botI);
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(ix);
    geo.computeVertexNormals();
    U._geo[key] = geo;
    return geo;
  }
  U.crescentBladeGeometry = crescentBladeGeometry;

  function crystalVeinTexture() {
    if (typeof document === 'undefined' || !document.createElement) return null;
    
    const c = document.createElement('canvas'); c.width = 256; c.height = 512;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 256, 512);
    grd.addColorStop(0, '#3a0a66'); grd.addColorStop(0.45, '#7a2ad8'); grd.addColorStop(1, '#c070ff');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 512);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 55; i++) {
      g.strokeStyle = 'rgba(255,210,255,' + (0.28 + Math.random() * 0.45) + ')';
      g.lineWidth = 0.6 + Math.random() * 1.8;
      g.beginPath();
      const x = Math.random() * 256, y = Math.random() * 512;
      g.moveTo(x, y);
      g.quadraticCurveTo(x + (Math.random() - 0.5) * 80, y + 60, x + (Math.random() - 0.5) * 40, y + 140);
      g.stroke();
    }
    for (let i = 0; i < 110; i++) {
      g.fillStyle = 'rgba(255,240,255,' + (0.25 + Math.random() * 0.5) + ')';
      g.beginPath(); g.arc(Math.random() * 256, Math.random() * 512, 0.6 + Math.random() * 1.6, 0, 7); g.fill();
    }
    const tex = new T.CanvasTexture(c);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    return tex;
  }
  function crystalEmissiveTexture() {
    if (typeof document === 'undefined' || !document.createElement) return null;
    
    const c = document.createElement('canvas'); c.width = 256; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#1a0530'; g.fillRect(0, 0, 256, 512);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 28; i++) {
      g.strokeStyle = 'rgba(220,140,255,' + (0.4 + Math.random() * 0.5) + ')';
      g.lineWidth = 1 + Math.random() * 2;
      g.beginPath();
      const x = 40 + Math.random() * 176, y = Math.random() * 512;
      g.moveTo(x, y); g.quadraticCurveTo(x + 20, y + 80, x - 10, y + 160); g.stroke();
    }
    const tex = new T.CanvasTexture(c);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    return tex;
  }
  function glowSpriteTex() {
    if (typeof document === 'undefined' || !document.createElement) return null;
    
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, 'rgba(230,180,255,0.95)');
    grd.addColorStop(0.25, 'rgba(170,80,255,0.55)');
    grd.addColorStop(0.6, 'rgba(110,30,200,0.18)');
    grd.addColorStop(1, 'rgba(40,0,80,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    const tex = new T.CanvasTexture(c);
    return tex;
  }
  function carvedSocketGeometry(r, len) {
    r = r || 0.018; len = len || 0.10;
    const segs = 8, sides = 8;
    const pos = [], nrm = [], uv = [], ix = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, y = (t - 0.15) * len;
      const swell = 1 + 0.28 * Math.sin(t * Math.PI) + 0.06 * Math.sin(t * 8);
      const rot = t * 1.4 * Math.PI;
      const rr = r * swell;
      for (let k = 0; k < sides; k++) {
        const a0 = (k / sides) * Math.PI * 2 + rot;
        const ridge = 1 + ((k % 2) ? 0.16 : -0.06);
        const x = Math.cos(a0) * rr * ridge, z = Math.sin(a0) * rr * ridge;
        pos.push(x, y, z);
        nrm.push(Math.cos(a0), 0, Math.sin(a0));
        uv.push(k / sides, t);
      }
    }
    for (let i = 0; i < segs; i++) {
      for (let k = 0; k < sides; k++) {
        const a = i * sides + k, b = i * sides + (k + 1) % sides;
        const c = (i + 1) * sides + k, d = (i + 1) * sides + (k + 1) % sides;
        ix.push(a, c, b, b, c, d);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(ix);
    geo.computeVertexNormals();
    return geo;
  }


  function woodRuneTexture() {
    if (typeof document === 'undefined' || !document.createElement) return null;
    
    const c = document.createElement('canvas'); c.width = 256; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#4a2c14'; g.fillRect(0, 0, 256, 512);
    for (let y = 0; y < 512; y += 5) {
      g.strokeStyle = y % 10 === 0 ? 'rgba(30,16,6,0.7)' : 'rgba(140,90,40,0.38)';
      g.lineWidth = 1 + (y % 4);
      g.beginPath();
      g.moveTo(0, y + Math.sin(y * 0.08) * 5);
      g.bezierCurveTo(80, y + Math.cos(y * 0.05) * 6, 160, y + Math.sin(y * 0.07) * 4, 256, y + Math.cos(y * 0.04) * 5);
      g.stroke();
    }
    // darker cracks / carved flutes
    g.strokeStyle = 'rgba(20,10,0,0.45)'; g.lineWidth = 2;
    for (let x = 24; x < 256; x += 32) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 8, 512); g.stroke();
    }
    // carved gold runes down the shaft — large and bright so they read at FP scale
    const runes = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ'];
    g.font = 'bold 42px serif'; g.textAlign = 'center';
    for (let i = 0; i < runes.length; i++) {
      const y = 48 + i * 40;
      g.fillStyle = 'rgba(20,8,0,0.7)'; g.fillText(runes[i], 132, y + 3);
      g.fillStyle = '#f0d060'; g.fillText(runes[i], 128, y);
      g.fillStyle = '#ffe9a0'; g.font = 'bold 38px serif'; g.fillText(runes[i], 128, y);
      g.font = 'bold 42px serif';
    }
    const tex = new T.CanvasTexture(c);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.repeat.set(1, 1);
    return tex;
  }
  function twistedHaftGeometry(r, len, twists) {
    r = r || 0.016; len = len || 0.62; twists = twists == null ? 1.35 : twists;
    const segs = 16, sides = 8;
    const pos = [], nrm = [], uv = [], ix = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, y = t * len - 0.02;
      const swell = 1 + 0.26 * Math.sin(t * Math.PI) + 0.10 * Math.sin(t * Math.PI * 5) + 0.05 * Math.sin(t * Math.PI * 11);
      const knot = 1 + 0.07 * Math.max(0, Math.sin(t * Math.PI * 3.2));
      const rr = r * swell * knot * (t < 0.08 ? 1.22 : (t > 0.90 ? 1.16 : 1));
      const rot = t * twists * Math.PI * 2;
      for (let k = 0; k < sides; k++) {
        const a0 = (k / sides) * Math.PI * 2 + rot;
        // slight ridge every other vertex, like carved flutes
        const ridge = 1 + ((k % 2) ? 0.14 : -0.06);
        const x = Math.cos(a0) * rr * ridge, z = Math.sin(a0) * rr * ridge;
        pos.push(x, y, z);
        nrm.push(Math.cos(a0), 0, Math.sin(a0));
        uv.push(k / sides, t);
      }
    }
    for (let i = 0; i < segs; i++) {
      for (let k = 0; k < sides; k++) {
        const a = i * sides + k, b = i * sides + (k + 1) % sides;
        const c = (i + 1) * sides + k, d = (i + 1) * sides + (k + 1) % sides;
        ix.push(a, c, b, b, c, d);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(ix);
    geo.computeVertexNormals();
    return geo;
  }
  function addGlowShell(g, geo, color, x, y, z) {
    const mat = new T.MeshBasicMaterial({
      color: color || 0xc080ff, transparent: true, opacity: 0.40,
      depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending
    });
    mat.userData.keepTransparent = 1;
    mat.userData.glow1249 = 1;
    const m = new T.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.scale.setScalar(1.06);
    m.renderOrder = 4;
    m.userData.glow1249 = 1;
    m.userData.keepTransparent = 1;
    g.add(m);
    return m;
  }

  function handleWithFerrule(g, woodM, ferM, len, r, slim) {
    const shaftR = slim ? r * 0.78 : r;
    addMesh(g, octShaftGeometry(shaftR, len, slim ? 0.92 : 0.96, 8), woodM, 0, len * 0.5 - 0.02, 0);
    addMesh(g, octShaftGeometry(shaftR * 1.35, slim ? 0.032 : 0.038, 1, 8), ferM, 0, len - 0.04, 0);
    return len;
  }

  function buildTool(kind, matName, id) {
    const g = new T.Group();
    const mat = matName || 'iron';
    const slim = kind === 'p761' || kind === 'p760';
    const crystal = mat === 'crystalpurple' || mat === 'crystalblue' || mat === 'diamond' || kind === 'p761' || kind === 'p760';
    const headHint = crystal ? 'crystal' : (mat === 'gold' ? 'gold' : (mat === 'wood' ? 'wood' : 'metal'));
    const headHex = HEAD_HEX[kind === 'p761' ? 'crystalpurple' : kind === 'p760' ? 'crystalblue' : mat] || HEAD_HEX.iron;
    const extra = {};
    if (kind === 'p761') extra.emissive = 0x551888;
    if (kind === 'p760') extra.emissive = 0x0a3a66;
    const headM = matFor(headHex, headHint, extra);
    const woodM = matFor(HAFT, 'wood');
    const ferM = matFor(FERRULE_HEX[mat] || FERRULE_HEX.iron, mat === 'gold' ? 'gold' : 'metal');
    const k = kind;

    if (k === 'p761' || k === 'p760') {
      // Glowing translucent-violet (or blue) crescent on a carved, twisted
      // wood-grained haft with gold runes. The core stays opaque/depthWrite
      // so it never vanishes on SwiftShader; glow is a sprite + additive shell.
      const len = 0.64;
      const purple = k === 'p761';
      const runeWood = matFor(0x4a2c14, 'wood');
      try {
        const wt = woodRuneTexture();
        runeWood.map = wt;
        // Dim amber runes on brown wood — never a gold/yellow haft.
        if ('emissiveMap' in runeWood) { runeWood.emissive = new T.Color(0x3a2208); runeWood.emissiveMap = wt; runeWood.emissiveIntensity = 0.40; }
        runeWood.needsUpdate = true;
      } catch (_) {}
      const haftM = addMesh(g, twistedHaftGeometry(0.020, len, 1.75), runeWood, 0, 0, 0);
      haftM.scale.z = 0.55;
      const sockM = addMesh(g, carvedSocketGeometry(0.020, 0.13), runeWood, 0, len - 0.03, 0);
      sockM.scale.z = 0.55;
      const vein = crystalVeinTexture(), emTex = crystalEmissiveTexture();
      const coreCol = purple ? 0x7a22e8 : 0x4ec0ff;
      const emCol = purple ? 0x4a1088 : 0x1560aa;
      const core = new T.MeshPhongMaterial({
        color: coreCol, map: vein, emissive: emCol, emissiveMap: emTex,
        emissiveIntensity: 1.05, shininess: 90, specular: purple ? 0xc090ff : 0xd8f0ff,
        transparent: false, opacity: 1, depthWrite: true
      });
      core.userData.crystalCore1249 = 1;
      const blade = crescentBladeGeometry(0.52, 0.0230, 0.048);
      const bladeMesh = addMesh(g, blade, core, 0, len - 0.01, 0);
      bladeMesh.rotation.z = -0.08;
      const glow = addGlowShell(g, blade, purple ? 0xc080ff : 0x66c8ff, 0, len - 0.01, 0);
      if (glow) glow.rotation.z = -0.08;
      try {
        const gtex = glowSpriteTex();
        const col = purple ? 0xaa66ee : 0x66aadd;
        // Soft violet bloom along the whole crescent, never a gold/white wash.
        const spots = [
          [0.10, len + 0.26, 0, 0.09, 0.14, 0.40],
          [0.12, len + 0.06, 0, 0.11, 0.15, 0.48],
          [0.09, len - 0.16, 0, 0.09, 0.13, 0.36]
        ];
        for (let i = 0; i < spots.length; i++) {
          const [x, y, z, sx, sy, op] = spots[i];
          const spr = new T.Sprite(new T.SpriteMaterial({
            map: gtex, color: col,
            blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: op
          }));
          spr.position.set(x, y, z);
          spr.scale.set(sx, sy, sx);
          spr.renderOrder = 5;
          spr.material.userData.keepTransparent = 1;
          spr.userData.glow1249 = 1;
          g.add(spr);
        }
      } catch (_) {}
      g.userData.__gs = {b: new T.Vector3(0, 0.10, 0), h: new T.Vector3(0, len * 0.42, 0), r: 0.016, authored: 1};
    } else if (k === 'pick') {
      const len = 0.56;
      handleWithFerrule(g, woodM, ferM, len, 0.016, false);
      addMesh(g, gemAlong('x', 0.34, 0.026, 0.024, {sides: 8, pointTip: true, pointButt: true, tip: 0.32, butt: 0.32, girdle: 0.08}), headM, 0, len - 0.01, 0);
      addMesh(g, cutGemGeometry({length: 0.06, rx: 0.028, rz: 0.028, sides: 8, pointTip: true, pointButt: true, tip: 0.3, butt: 0.3}), headM, 0, len - 0.01, 0);
    } else if (k === 'axe') {
      handleWithFerrule(g, woodM, ferM, 0.56, 0.016, false);
      // Flattened, chamfered, tapered blade: sharp bit on -X, faceted poll on +X.
      addMesh(g, gemAlong('y', 0.18, 0.09, 0.018, {sides: 8, pointTip: true, pointButt: true, tip: 0.22, butt: 0.18, girdle: 0.1}), headM, -0.05, 0.54, 0, 0, 0, 0.15);
      addMesh(g, chamferBoxGeometry(0.05, 0.07, 0.04, 0.01), headM, 0.03, 0.54, 0);
    } else if (k === 'sword' || k === 'claymore') {
      const long = k === 'claymore';
      const bladeL = long ? 0.66 : 0.54;
      const bladeW = long ? 0.034 : 0.028;
      const bladeT = long ? 0.010 : 0.0085;
      const steel = (mat === 'gold') ? matFor(0xf4c542, 'gold') : matFor(0x6a7078, 'metal');
      const guardM = (mat === 'gold') ? ferM : matFor(0x5a5e66, 'metal');
      const gripM = (mat === 'gold') ? ferM : matFor(0x4a2c14, 'wood');
      // peen / pommel
      addMesh(g, cutGemGeometry({length: 0.046, rx: 0.024, rz: 0.024, sides: 8, pointTip: true, pointButt: true}), guardM, 0, -0.04, 0);
      // leather / wood grip with a slight oval
      addMesh(g, octShaftGeometry(0.014, long ? 0.15 : 0.125, 1, 8), gripM, 0, 0.035, 0);
      // steel crossguard (straight quillons, not a gold bar)
      addMesh(g, gemAlong('x', long ? 0.20 : 0.16, 0.014, 0.014, {sides: 8, pointTip: true, pointButt: true, tip: 0.28, butt: 0.28}), guardM, 0, 0.112, 0);
      addMesh(g, chamferBoxGeometry(long ? 0.20 : 0.16, 0.016, 0.022, 0.004), guardM, 0, 0.112, 0);
      // ricasso / shoulder
      addMesh(g, chamferBoxGeometry(bladeW * 1.6, 0.03, bladeT * 1.5, 0.003), steel, 0, 0.135, 0);
      // blade
      const blade = addMesh(g, cutGemGeometry({length: bladeL, rx: bladeW, rz: bladeT, sides: 6, pointTip: true, pointButt: false, tip: 0.22, butt: 0.08, girdle: 0.05}), steel, 0, 0.15 + bladeL * 0.5, 0);
      // fuller groove (darker inset)
      const fullerM = matFor(0x4a5058, 'metal');
      addMesh(g, chamferBoxGeometry(bladeW * 0.28, bladeL * 0.62, bladeT * 0.35, 0.002), fullerM, 0, 0.18 + bladeL * 0.28, bladeT * 0.55);
    } else if (k === 'shovel') {
      handleWithFerrule(g, woodM, ferM, 0.52, 0.016, false);
      addMesh(g, cutGemGeometry({length: 0.16, rx: 0.07, rz: 0.014, sides: 8, pointTip: true, pointButt: false, tip: 0.28, butt: 0.12, girdle: 0.1}), headM, 0, 0.58, 0);
    } else if (k === 'hoe') {
      handleWithFerrule(g, woodM, ferM, 0.56, 0.016, false);
      addMesh(g, gemAlong('x', 0.18, 0.022, 0.016, {sides: 8, pointTip: true, pointButt: false, tip: 0.28, butt: 0.12}), headM, -0.05, 0.56, 0, 0, 0, -0.55);
    } else if (k === 'stick') {
      addMesh(g, octShaftGeometry(0.015, 0.50, 0.85, 8), woodM, 0, 0.23, 0);
    } else if (k === 'shears') {
      const blade = gemAlong('y', 0.22, 0.018, 0.008, {sides: 6, pointTip: true, pointButt: false, tip: 0.35, butt: 0.1});
      const a = addMesh(g, blade, headM, -0.018, 0.18, 0, 0, 0, 0.18);
      const b = addMesh(g, blade, headM, 0.018, 0.18, 0, 0, 0, -0.18);
      addMesh(g, octShaftGeometry(0.012, 0.03, 1, 8), ferM, 0, 0.07, 0);
      // faceted finger loops
      if (typeof T.TorusGeometry === 'function') {
        const loop = flattenGeo(new T.TorusGeometry(0.032, 0.007, 6, 8));
        addMesh(g, loop, woodM, -0.03, -0.01, 0, Math.PI / 2, 0, 0.4);
        addMesh(g, loop, woodM, 0.03, -0.01, 0, Math.PI / 2, 0, -0.4);
      } else {
        addMesh(g, chamferBoxGeometry(0.05, 0.06, 0.02, 0.01), woodM, -0.03, -0.02, 0);
        addMesh(g, chamferBoxGeometry(0.05, 0.06, 0.02, 0.01), woodM, 0.03, -0.02, 0);
      }
    } else if (k === 'flint') {
      // Flint and steel: faceted steel C-striker + a dark cut-flint, not a cube.
      const steel = matFor(0xc5cad0, 'metal');
      const flintM = matFor(0x3a3a44, 'default', {emissive: 0x111118});
      if (typeof T.TorusGeometry === 'function') {
        const hoop = flattenGeo(new T.TorusGeometry(0.055, 0.011, 6, 10, Math.PI * 1.55));
        addMesh(g, hoop, steel, 0, 0.06, 0, Math.PI / 2, 0, Math.PI * 0.15);
      } else {
        addMesh(g, chamferBoxGeometry(0.12, 0.04, 0.03, 0.008), steel, 0, 0.06, 0);
      }
      addMesh(g, cutGemGeometry({length: 0.07, rx: 0.028, rz: 0.022, sides: 7, pointTip: true, pointButt: true, tip: 0.28, butt: 0.28}), flintM, 0.01, 0.055, 0.01, 0.4, 0.3, 0.2);
      addMesh(g, octShaftGeometry(0.01, 0.03, 1, 8), ferM, 0, 0.0, 0);
    } else if (k === 'pistol' || k === 'musket') {
      return buildGun(k, g);
    } else {
      addMesh(g, chamferBoxGeometry(0.12, 0.16, 0.08, 0.02), headM, 0, 0.08, 0);
    }
    g.userData.kind = kind;
    g.userData.tool = true;
    g.userData.prismBuilt = 1;
    if (k === 'p761') { g.userData.p761 = 1; g.userData.crystalPick = 'purple'; }
    if (k === 'p760') { g.userData.p760 = 1; g.userData.crystalPick = 'blue'; }
    return g;
  }
  U.buildTool = buildTool;

  function gunWoodTexture() {
    if (typeof document === 'undefined' || !document.createElement) return null;
    
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#5a3a1c'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 4) {
      g.strokeStyle = y % 8 === 0 ? 'rgba(20,10,0,0.5)' : 'rgba(120,70,30,0.3)';
      g.lineWidth = 1 + (y % 3);
      g.beginPath(); g.moveTo(0, y + Math.sin(y * 0.1) * 3); g.lineTo(256, y + Math.cos(y * 0.08) * 3); g.stroke();
    }
    const tex = new T.CanvasTexture(c); tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(1, 2);
    return tex;
  }
  function buildGun(kind, into) {
    const g = into || new T.Group();
    const woodM = matFor(0x5a3a1c, 'wood');
    try { woodM.map = gunWoodTexture(); woodM.needsUpdate = true; } catch (_) {}
    const ironM = matFor(0xb0b6be, 'metal');
    const brassM = matFor(0xc0a050, 'gold');
    const musket = kind === 'musket';
    // Barrel along -Z, matching the in-game flintlock frame.
    const barLen = musket ? 0.78 : 0.28;
    addMesh(g, shaftAlong('z', barLen, musket ? 0.013 : 0.012, 1, 8), ironM, 0, 0.03, musket ? -0.31 : -0.08);
    addMesh(g, octShaftGeometry(musket ? 0.016 : 0.015, 0.04, 1, 8), ironM, 0, 0.03, musket ? 0.075 : 0.05);
    addMesh(g, shaftAlong('z', 0.014, musket ? 0.015 : 0.014, 1, 8), ironM, 0, 0.03, musket ? -0.70 : -0.22);
    // Stock, faceted
    if (musket) {
      addMesh(g, chamferBoxGeometry(0.044, 0.034, 0.58, 0.006), woodM, 0, 0.012, -0.21);
      addMesh(g, chamferBoxGeometry(0.048, 0.056, 0.12, 0.008), woodM, 0, 0.0, 0.14);
      addMesh(g, chamferBoxGeometry(0.04, 0.042, 0.11, 0.007), woodM, 0, -0.014, 0.25);
      addMesh(g, chamferBoxGeometry(0.046, 0.11, 0.18, 0.01), woodM, 0, -0.05, 0.385);
      addMesh(g, chamferBoxGeometry(0.049, 0.116, 0.012, 0.003), brassM, 0, -0.058, 0.478);
      addMesh(g, chamferBoxGeometry(0.046, 0.036, 0.02, 0.004), brassM, 0, 0.012, -0.51);
    } else {
      addMesh(g, chamferBoxGeometry(0.046, 0.13, 0.055, 0.01), woodM, 0, -0.07, 0.05, 0.22);
      addMesh(g, chamferBoxGeometry(0.05, 0.035, 0.2, 0.008), ironM, 0, 0, -0.02);
      addMesh(g, chamferBoxGeometry(0.04, 0.05, 0.08, 0.008), woodM, 0, -0.02, 0.08);
      addMesh(g, chamferBoxGeometry(0.03, 0.02, 0.04, 0.004), brassM, 0, 0.02, 0.04);
    }
    // lock / cock, frizzen, trigger and guard
    addMesh(g, chamferBoxGeometry(0.01, 0.036, 0.07, 0.002), ironM, 0.028, 0.02, musket ? 0.13 : 0.02);
    addMesh(g, chamferBoxGeometry(0.008, 0.028, 0.018, 0.002), ironM, 0.034, 0.042, musket ? 0.11 : 0.0, 0.55);
    addMesh(g, cutGemGeometry({length: 0.02, rx: 0.008, rz: 0.006, sides: 6, pointTip: true, pointButt: true}), matFor(0x3a3a44, 'default'), 0.036, 0.05, musket ? 0.10 : 0.0);
    addMesh(g, chamferBoxGeometry(0.006, 0.028, 0.01, 0.001), ironM, 0.0, -0.02, musket ? 0.18 : 0.06);
    if (typeof T.TorusGeometry === 'function') {
      const guard = flattenGeo ? flattenGeo(new T.TorusGeometry(0.028, 0.004, 5, 10, Math.PI * 1.15)) : new T.TorusGeometry(0.028, 0.004, 5, 10, Math.PI * 1.15);
      addMesh(g, guard, brassM, 0, -0.01, musket ? 0.19 : 0.07, Math.PI / 2, 0, 0);
    }
    // Readable front and rear sights, so ADS has something to look through.
    if (musket) {
      addMesh(g, chamferBoxGeometry(0.012, 0.014, 0.008, 0.001), ironM, 0, 0.048, 0.08);
      addMesh(g, chamferBoxGeometry(0.0035, 0.016, 0.0035, 0.0005), ironM, -0.005, 0.052, 0.08);
      addMesh(g, chamferBoxGeometry(0.0035, 0.016, 0.0035, 0.0005), ironM, 0.005, 0.052, 0.08);
      addMesh(g, chamferBoxGeometry(0.004, 0.016, 0.004, 0.0005), ironM, 0, 0.048, -0.68);
    } else {
      addMesh(g, chamferBoxGeometry(0.008, 0.012, 0.006, 0.001), ironM, 0, 0.042, 0.03);
      addMesh(g, chamferBoxGeometry(0.003, 0.012, 0.003, 0.0005), ironM, 0, 0.042, -0.20);
    }
    // Iron sights: rear notch near the lock, front blade at the muzzle.
    if (musket) {
      addMesh(g, chamferBoxGeometry(0.016, 0.012, 0.008, 0.001), ironM, 0, 0.046, 0.08);
      addMesh(g, chamferBoxGeometry(0.004, 0.016, 0.004, 0.001), ironM, 0, 0.054, -0.68);
    } else {
      addMesh(g, chamferBoxGeometry(0.01, 0.01, 0.006, 0.001), ironM, 0, 0.042, 0.02);
      addMesh(g, chamferBoxGeometry(0.003, 0.012, 0.003, 0.001), ironM, 0, 0.048, -0.21);
    }
    g.userData.kind = kind;
    g.userData.gun = kind === 'pistol' ? 212 : 213;
    g.userData.prismBuilt = 1;
    return g;
  }
  U.buildGun = buildGun;

  function addShardAccents(root) {
    if (!root || root.userData._prismShards) return;
    root.userData._prismShards = 1;
    const boxes = [];
    root.traverse(function (o) {
      if (!o.isMesh || !o.geometry) return;
      if (o.isSkinnedMesh || (o.geometry.attributes && o.geometry.attributes.skinIndex)) return;
      if (!isBoxGeo(o.geometry) && !(o.geometry.userData && o.geometry.userData.prismCut && o.geometry.parameters)) {
        // chamfered boxes are already cut; still use their AABB for placement
      }
      if (o.userData && o.userData._shard) return;
      boxes.push(o);
    });
    boxes.sort(function (a, b) {
      const sa = boxSize(a.geometry), sb = boxSize(b.geometry);
      return (sb[0] * sb[1] * sb[2]) - (sa[0] * sa[1] * sa[2]);
    });
    const take = boxes.slice(0, 3);
    for (let i = 0; i < take.length; i++) {
      const o = take[i];
      const dim = boxSize(o.geometry);
      const s = Math.min(dim[0], dim[1], dim[2]) * 0.28;
      const len = Math.max(0.05, Math.min(0.12, s * 1.6));
      const mat = o.material;
      const shardGeo = cutGemGeometry({length: len, rx: len * 0.22, rz: len * 0.18, sides: 6, pointTip: true, pointButt: true, tip: 0.4, butt: 0.3});
      // Two short spikes near the top / outward corners, still close to the surface.
      const spots = [
        [dim[0] * 0.28, dim[1] * 0.42, dim[2] * 0.28],
        [-dim[0] * 0.28, dim[1] * 0.38, -dim[2] * 0.22]
      ];
      for (let k = 0; k < spots.length; k++) {
        const sh = new T.Mesh(shardGeo, mat);
        sh.position.set(spots[k][0], spots[k][1], spots[k][2]);
        sh.rotation.set(0.3 * (k ? -1 : 1), 0.5 * i, 0.4 * (k ? 1 : -1));
        sh.userData._shard = 1;
        sh.userData.prism1241Applied = 1;
        o.add(sh);
      }
    }
  }

  function applyPrism(root, opts) {
    if (!root || !U.on) return root;
    opts = opts || {};
    const hint0 = opts.hint || (opts.kind ? 'default' : 'default');
    root.traverse(function (o) {
      if (!o.isMesh || !o.geometry) return;
      if (o.userData && o.userData.prism1241Applied === U.REV) return;
      const skinned = !!(o.isSkinnedMesh || (o.geometry.attributes && o.geometry.attributes.skinIndex));
      if (!skinned) {
        try {
          const next = upgradeGeometry(o.geometry, o);
          if (next && next !== o.geometry) o.geometry = next;
        } catch (e) { if (!U.err) U.err = 'upgrade ' + e; }
      }
      try {
        const src = Array.isArray(o.material) ? o.material[0] : o.material;
        const hint = opts.hint || hintFromColor(src && src.color, hint0);
        if (Array.isArray(o.material)) {
          o.material = o.material.map(function (m) { return prismMaterial(m, hint); });
        } else {
          o.material = prismMaterial(src, hint);
        }
      } catch (e) { if (!U.err) U.err = 'mat ' + e; }
      o.userData = o.userData || {};
      o.userData.prism1241Applied = 1;
      o.userData.prismRev = U.REV;
      U.meshes++;
    });
    if (opts.kind && U.LISTED[opts.kind] && !opts.noShards) {
      let hasSkinned = false;
      root.traverse(function (o) { if (o.isSkinnedMesh || (o.geometry && o.geometry.attributes && o.geometry.attributes.skinIndex)) hasSkinned = true; });
      if (!hasSkinned) {
        try { addShardAccents(root); } catch (e) { if (!U.err) U.err = 'shard ' + e; }
      }
    }
    if (root.userData) dressed.add(root);
    return root;
  }
  U.applyPrism = applyPrism;

  // Tasteful 2D overlay: work only on existing pixels, a soft per-facet
  // shade, a thin silhouette rim and one diagonal gleam. No grey lattice.
  function prismCanvas(src, key, kind) {
    if (!src) return src;
    const cacheKey = 'v2|' + (key || 'k') + '|' + (src.width || 0) + 'x' + (src.height || 0) + '|' + (kind || 'tile');
    if (tileCache.has(cacheKey)) return tileCache.get(cacheKey);
    const w = src.width || 64, h = src.height || 64;
    let c = null;
    try {
      if (typeof U.makeCanvas === 'function') c = U.makeCanvas(w, h);
      else if (typeof document !== 'undefined' && document.createElement) { c = document.createElement('canvas'); c.width = w; c.height = h; }
    } catch (_) {}
    if (!c || !c.getContext) { tileCache.set(cacheKey, src); return src; }
    const g = c.getContext('2d');
    try { g.drawImage(src, 0, 0, w, h); } catch (_) { tileCache.set(cacheKey, src); return src; }
    try {
      const img = g.getImageData(0, 0, w, h);
      const d = img.data;
      const a = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3];
      const isIcon = kind === 'icon';
      const amt = isIcon ? 0.22 : 0.13;
      const edgeK = isIcon ? 0.32 : 0.18;
      const gleamK = isIcon ? 0.20 : 0.10;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (a[i] < 10) continue;
        let edge = 0;
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = 1;
        else {
          const nsum = a[i - 1] + a[i + 1] + a[i - w] + a[i + w];
          if (nsum < a[i] * 4 - 70) edge = 1;
        }
        const u = x / w, v = y / h;
        const f = (Math.floor((u * 0.7 + v * 0.3) * 3.5) * 13 + Math.floor((u * -0.4 + v * 0.9) * 2.5) * 7 + Math.floor((u * 0.9 - v * 0.5) * 3));
        const hf = Math.sin(f * 12.9898) * 43758.5453;
        const shade = 0.93 + 0.12 * (hf - Math.floor(hf));
        let r = d[i * 4], gv = d[i * 4 + 1], b = d[i * 4 + 2];
        r = r * (1 - amt + amt * shade);
        gv = gv * (1 - amt + amt * shade);
        b = b * (1 - amt + amt * shade);
        if (edge) {
          r = r + (220 - r) * edgeK;
          gv = gv + (236 - gv) * edgeK;
          b = b + (255 - b) * edgeK;
        }
        const gleam = Math.max(0, 1 - Math.abs((u + v) - 0.85) / 0.09);
        if (gleam > 0) {
          const gk = gleam * gleamK;
          r = r + (255 - r) * gk;
          gv = gv + (255 - gv) * gk;
          b = b + (255 - b) * gk;
        }
        d[i * 4] = r < 0 ? 0 : r > 255 ? 255 : r;
        d[i * 4 + 1] = gv < 0 ? 0 : gv > 255 ? 255 : gv;
        d[i * 4 + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
      g.putImageData(img, 0, 0);
    } catch (e) { if (!U.err) U.err = 'canvas ' + e; }
    c.userData = {prism1241: 1};
    tileCache.set(cacheKey, c);
    return c;
  }
  U.prismTile = function (src, key) { U.tiles++; return prismCanvas(src, key || 'tile', 'tile'); };
  U.prismIcon2d = function (src, key) { U.icons++; return prismCanvas(src, key || 'icon', 'icon'); };

  U.styleIconUrl = function (url, key) {
    if (!url || typeof url !== 'string') return url;
    if (iconCache.has(key || url)) return iconCache.get(key || url);
    try {
      if (typeof document === 'undefined') return url;
      const size = U.iconSize();
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const im = new (W.Image || (typeof Image !== 'undefined' ? Image : function () {}))();
      im.src = url;
      if (im.complete && im.width) {
        g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
        g.drawImage(im, 0, 0, size, size);
        const out = U.prismIcon2d(c, key || url);
        const u = out.toDataURL();
        iconCache.set(key || url, u);
        return u;
      }
    } catch (e) { if (!U.err) U.err = 'icon ' + e; }
    return url;
  };

  const REBUILD = {pick: 1, p760: 1, p761: 1, axe: 1, sword: 1, claymore: 1, shovel: 1, hoe: 1, stick: 1, flint: 1, shears: 1};

  function wrapMakeItemMesh() {
    if (typeof makeItemMesh !== 'function' || makeItemMesh.__prism1241v3) return;
    const prev = makeItemMesh;
    makeItemMesh = function (id) {
      const g = prev.apply(this, arguments);
      try {
        if (!g) return g;
        // Never prism world-shared block materials or dropped/held block cubes.
        if (g.userData && g.userData.block) return g;
        try { if (typeof PLACEABLE !== 'undefined' && PLACEABLE && PLACEABLE.has && PLACEABLE.has(id) && !(typeof TOOLS !== 'undefined' && TOOLS && TOOLS.has && TOOLS.has(id))) return g; } catch (_) {}
        const entry = (W.__held1240 && W.__held1240.entry) ? W.__held1240.entry(id) : null;
        const kind = (entry && entry.kind) || (g.userData && (g.userData.p761 ? 'p761' : g.userData.p760 ? 'p760' : g.userData.kind));
        const mat = entry && entry.mat;
        if (kind && REBUILD[kind]) {
          const neu = buildTool(kind, mat, id);
          const ud = Object.assign({}, g.userData || {}, neu.userData || {});
          neu.userData = ud;
          neu.position.copy(g.position);
          neu.rotation.copy(g.rotation);
          neu.quaternion.copy(g.quaternion);
          neu.scale.set(1, 1, 1);
          return neu;
        }
        if (kind === 'pistol' || kind === 'musket' || (g.userData && g.userData.gun)) {
          applyPrism(g, {hint: 'metal', noShards: true});
          return g;
        }
        // Tools / guns only. Do not facet generic sprites or block items.
        if (g.userData && g.userData.tool) {
          applyPrism(g, {hint: hintFromId(id), noShards: true});
        }
      } catch (e) { if (!U.err) U.err = 'item ' + e; }
      return g;
    };
    makeItemMesh.__prism1241v3 = 1;
    makeItemMesh.__prism1241 = 1;
  }
  function hintFromId(id) {
    try {
      if (W.__held1240 && W.__held1240.CATALOG) {
        const e = W.__held1240.CATALOG.find(function (x) { return x.id === id; });
        if (e) {
          if (e.mat === 'crystalpurple' || e.mat === 'crystalblue' || e.mat === 'diamond') return 'crystal';
          if (e.mat === 'gold') return 'gold';
          if (e.mat === 'iron' || e.mat === 'cobalt' || e.mat === 'metal') return 'metal';
          if (e.mat === 'wood') return 'wood';
        }
      }
    } catch (_) {}
    return 'default';
  }

  // 1.2.42: do NOT wrap tex() or mutate texImg / texCache. Those are the shared
  // world block atlas used by BLOCK_MATS / terrain chunks. Prism on them made
  // every block texture re-upload and caused slideshow-level lag.
  function wrapTex() { /* intentionally empty: world tiles stay at 1.2.40 */ }
  function restyleTexKey(key) { return; }
  U.restyleAllTiles = function () { return 0; };
  U.worldTilesUntouched = 1;

  const iconDone = U.iconDone = U.iconDone || new Set();
  function restyleIcons(limit) {
    try {
      if (typeof ICONS === 'undefined') return 0;
      // Defer until the world is playable so entering a game is not paying for
      // a full 4K inventory icon restyle on the first click / pointer lock.
      try { if (typeof started !== 'undefined' && !started && !U.forceIcons) return 0; } catch (_) {}
      let n = 0;
      const max = limit == null ? 6 : limit;
      const set = function (id, url) {
        try { if (window.__c121 && __c121.setIcon) __c121.setIcon(id, url); } catch (_) {}
        ICONS[id] = url;
        iconDone.add(id);
        // Bust derived caches once when we first swap the icon, not every tick.
        try { delete ICON_KEY[id]; } catch (_) {}
        try { delete spriteMats[id]; } catch (_) {}
      };
      for (const k in ICONS) {
        if (n >= max) break;
        const id = +k, url = ICONS[k];
        if (!url) continue;
        if (iconDone.has(id)) continue;
        const styled = U.styleIconUrl(url, 'icon:' + id);
        if (styled && styled !== url) { set(id, styled); n++; }
        else if (styled === url && typeof url === 'string' && url.indexOf('data:') === 0) iconDone.add(id);
        else if (!styled || styled === url) {
          // Image not ready yet — try again later without marking done.
        }
      }
      U.iconApplied = (U.iconApplied || 0) + n;
      return n;
    } catch (e) { if (!U.err) U.err = 'icons ' + e; return 0; }
  }
  U.restyleIcons = restyleIcons;

  function hookIso() {
    try {
      const C = W.__c187;
      if (!C || !C.kit || C.__prism1241) return;
      const kit = C.kit();
      if (!kit || !kit.isoIcon || !kit.setIc) return;
      C.__prism1241 = 1;
      const prev = kit.isoIcon;
      kit.isoIcon = function (F, shape) {
        const url = prev.apply(this, arguments);
        return U.styleIconUrl(url, 'iso:' + (shape || 'cube') + ':' + ((F && F.length) || 0));
      };
      C.kit = function () { return Object.assign({}, kit, {isoIcon: kit.isoIcon}); };
    } catch (e) { if (!U.err) U.err = 'iso ' + e; }
  }

  function wrapMakers() {
    const names = ['makeSheep', 'makeHaggis', 'makeCreeper', 'makeTreeman', 'makeSpider', 'makePig', 'makeClansman', 'makeHumanoid', 'makeFarmer', 'mkAlien'];
    for (let i = 0; i < names.length; i++) {
      hookGlobal(names[i], function (g, kind) { try { applyPrism(g, {kind: kind}); U.mobs++; } catch (_) {} });
    }
    try {
      if (typeof MODELS !== 'undefined' && MODELS.wizard && !MODELS.wizard.__prism1241) {
        const prev = MODELS.wizard;
        MODELS.wizard = function () {
          const r = prev.apply(this, arguments);
          try { if (r && r.root) applyPrism(r.root, {kind: 'wizard'}); U.mobs++; } catch (_) {}
          return r;
        };
        MODELS.wizard.__prism1241 = 1;
      }
    } catch (_) {}
    try {
      const C = W.__c240;
      if (C && C.make && !C.make.__prism1241) {
        const prev = C.make;
        C.make = function () {
          const g = prev.apply(this, arguments);
          try { applyPrism(g, {kind: 'egyptian'}); U.mobs++; } catch (_) {}
          return g;
        };
        C.make.__prism1241 = 1;
      }
    } catch (_) {}
  }
  function hookGlobal(name, after) {
    try {
      const got = (new Function('return typeof ' + name + ' === "function" ? ' + name + ' : null'))();
      if (!got || got.__prism1241) return;
      const wrapped = function () {
        const r = got.apply(this, arguments);
        after(r, name.replace(/^make/, '').replace(/^mk/, '').toLowerCase());
        return r;
      };
      wrapped.__prism1241 = 1;
      (new Function('fn', name + ' = fn;'))(wrapped);
    } catch (_) {}
  }

  function dressListedMobs() {
    const go = function (root, kind) { if (root && !dressed.has(root)) { applyPrism(root, {kind: kind}); U.mobs++; } };
    try {
      if (typeof mobs !== 'undefined' && mobs && mobs.length) {
        for (let i = 0; i < mobs.length; i++) {
          const a = mobs[i];
          if (!a || !a.g) continue;
          if (!U.LISTED[a.kind] && a.kind !== 'pig') continue;
          go(a.g, a.kind);
        }
      }
    } catch (_) {}
    try { const f = W.__c240 && W.__c240.folk; if (f) for (let i = 0; i < f.length; i++) if (f[i] && f[i].g) go(f[i].g, 'egyptian'); } catch (_) {}
    try { const C = W.__c259; if (C && typeof C.all === 'function') { const f = C.all(); if (f) for (let i = 0; i < f.length; i++) if (f[i] && f[i].g) go(f[i].g, 'egyptian'); } } catch (_) {}
    try {
      if (typeof mobs !== 'undefined') for (let i = 0; i < mobs.length; i++) if (mobs[i] && mobs[i].kind === 'paladien' && mobs[i].g) go(mobs[i].g, 'paladien');
    } catch (_) {}
  }
  U.dressListedMobs = dressListedMobs;

  U.install = function () {
    if (U.hooked && U.hookRev === 3) return U;
    U.hooked = 1; U.hookRev = 3;
    wrapMakeItemMesh();
    // wrapTex intentionally not called — world block atlas stays 1.2.40.
    hookIso();
    wrapMakers();
    // Browser-only: restyle inventory item icons once they exist, dress new mobs.
    // Never restyle world tiles. Stop once icons stop changing.
    if (typeof document !== 'undefined') {
      let tries = 0, idle = 0;
      const iv = setInterval(function () {
        try {
          wrapMakeItemMesh(); hookIso(); wrapMakers();
          // After first playable frame only: a few icons per second, not the whole inventory.
          let n = 0;
          try { if (typeof started === 'undefined' || started) n = restyleIcons(4); } catch (_) { n = restyleIcons(4); }
          try { if (typeof started === 'undefined' || started) dressListedMobs(); } catch (_) {}
          if (n === 0) idle++; else idle = 0;
        } catch (e) { if (!U.err) U.err = 'tick ' + e; }
        if (++tries > 90 || idle >= 12) clearInterval(iv);
      }, 500);
    }
    return U;
  };
  try { U.install(); } catch (e) { U.err = 'install: ' + e; }
})(typeof window !== 'undefined' ? window : this);
