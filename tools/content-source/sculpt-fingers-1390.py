#!/usr/bin/env python3
"""t1390: clay-method sculpt on the existing GLOVE finger meshes.

Primary forms, then secondary, then fine detail. Same vertex count,
same bones, same vertex groups and UVs. Linen / upper-arm verts are left
alone. Run with:
  PYTHONPATH=/workspace/pilot-asset/python-deps python3 sculpt_fingers.py
"""
import bpy, bmesh, math, os, json, struct
from mathutils import Vector, Matrix, Quaternion
from collections import defaultdict

ROOT = '/workspace/gc-arm-1390'
GLB = os.path.join(ROOT, 'assets/models/scottish-base-v2/scottish-base.glb')
OUT_ASSET = os.path.join(ROOT, 'assets/models/fp-hands-1390')
QA = '/workspace/qa/t1390'
WIP = os.path.join(QA, 'wip')
os.makedirs(OUT_ASSET, exist_ok=True)
os.makedirs(WIP, exist_ok=True)
os.makedirs(os.path.join(QA, 'after'), exist_ok=True)


def smoothstep(e0, e1, x):
    if e1 == e0:
        return 0.0 if x < e0 else 1.0
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3.0 - 2.0 * t)


def gauss(x, s):
    return math.exp(-0.5 * (x / max(s, 1e-8)) ** 2)


def clamp(x, a, b):
    return a if x < a else b if x > b else x


def load():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=GLB)
    for o in list(bpy.data.objects):
        if o.type == 'MESH' and 'Ico' in o.name:
            bpy.data.objects.remove(o, do_unlink=True)
    arm = bpy.data.objects['Pilot_Humanoid']
    hands = {}
    for o in bpy.data.objects:
        if o.type != 'MESH':
            continue
        if o.data.name.startswith('GLOVE | R'):
            hands['R'] = o
        elif o.data.name.startswith('GLOVE | L'):
            hands['L'] = o
    assert 'R' in hands and 'L' in hands, hands
    return arm, hands


def mat_of_verts(mesh):
    m = {}
    for p in mesh.polygons:
        for vi in p.vertices:
            m[vi] = p.material_index
    return m


def bone_axes(arm, bname):
    b = arm.data.bones[bname]
    axis = (b.tail_local - b.head_local).normalized()
    return b, b.head_local.copy(), b.tail_local.copy(), axis, b.length


def side_palmar(arm, side):
    """Palmar unit vector in armature/object space.
    finger_axis × thumb_dir, signed so it points toward the palm
    (the side opposite the thumbnail / toward the other hand's facing).
    """
    f_axis = Vector((0, 0, 0))
    for i in range(4):
        _, _, _, ax, L = bone_axes(arm, f'finger.{side}.{i}.01')
        f_axis += ax
    f_axis.normalize()
    _, th_h, th_t, th_ax, _ = bone_axes(arm, f'thumb.{side}.01')
    _, _, th2_t, _, _ = bone_axes(arm, f'thumb.{side}.02')
    thumb_dir = (th2_t - th_h).normalized()
    pal = f_axis.cross(thumb_dir)
    if pal.length < 1e-6:
        pal = f_axis.cross(Vector((1, 0, 0) if side == 'R' else (-1, 0, 0)))
    pal.normalize()
    # Sign: palm should face roughly toward -Y in this bind (hands hang
    # slightly pronated). Check which sign points more toward -Y / body.
    if pal.y > 0:
        pal = -pal
    return pal, f_axis, thumb_dir


def classify(obj, arm, side):
    mesh = obj.data
    gi = {g.index: g.name for g in obj.vertex_groups}
    mo = mat_of_verts(mesh)
    # dominant bone per vert
    dom = [None] * len(mesh.vertices)
    for v in mesh.vertices:
        if not v.groups:
            continue
        g = max(v.groups, key=lambda x: x.weight)
        dom[v.index] = gi.get(g.group)
    return gi, mo, dom


def sculpt_side(obj, arm, side, palmar):
    mesh = obj.data
    gi, mo, dom = classify(obj, arm, side)
    n = len(mesh.vertices)
    # snapshot
    orig = [v.co.copy() for v in mesh.vertices]
    delta = [Vector((0, 0, 0)) for _ in range(n)]

    # only HeadSkin (mat 1) on hand/finger/thumb
    def is_target(i):
        if mo.get(i, -1) != 1:
            return False
        b = dom[i]
        if not b:
            return False
        return b.startswith(f'hand.{side}') or b.startswith(f'finger.{side}') or b.startswith(f'thumb.{side}')

    # Precompute per-finger frames
    fingers = []
    for i in range(4):
        b0, h0, t0, ax0, L0 = bone_axes(arm, f'finger.{side}.{i}.01')
        b1, h1, t1, ax1, L1 = bone_axes(arm, f'finger.{side}.{i}.02')
        # length scale: little finger thinner
        thick = [0.96, 1.00, 0.97, 0.86][i]
        fingers.append(dict(i=i, h0=h0, t0=t0, ax0=ax0, L0=L0, h1=h1, t1=t1, ax1=ax1, L1=L1, thick=thick,
                            name0=f'finger.{side}.{i}.01', name1=f'finger.{side}.{i}.02'))

    th0 = bone_axes(arm, f'thumb.{side}.01')
    th1 = bone_axes(arm, f'thumb.{side}.02')
    hb, hh, ht, hax, hL = bone_axes(arm, f'hand.{side}')

    def frame_at(origin, axis):
        # palmar may not be perfectly perp; gram-schmidt
        p = palmar - axis * palmar.dot(axis)
        if p.length < 1e-6:
            p = Vector((0, 0, 1)).cross(axis)
        p.normalize()
        u = axis.cross(p).normalized()  # ulnar/radial
        return p, u

    # ---- collect verts per bone ----
    by = defaultdict(list)
    for i in range(n):
        if is_target(i):
            by[dom[i]].append(i)

    def along_data(idxs, origin, axis):
        rec = []
        for i in idxs:
            p = orig[i]
            t = (p - origin).dot(axis)
            radv = p - origin - axis * t
            r = radv.length
            rec.append((i, t, r, radv))
        return rec

    # ========== PASS 0: close scooped end-cap nail wells; kill spikes ==========
    def repair_distal(idxs, origin, axis, L):
        rec = along_data(idxs, origin, axis)
        if len(rec) < 8:
            return
        pal, uax = frame_at(origin, axis)
        tmax = max(t for _, t, _, _ in rec)
        tmin = min(t for _, t, _, _ in rec)
        # Rim of the tip: verts near max t with healthy radius
        rim = [(i, t, r, radv) for i, t, r, radv in rec if t >= tmax - 0.008]
        rs = sorted(x[2] for x in rim) or sorted(x[2] for x in rec)
        r_rim = rs[int(len(rs) * 0.6)]
        # Close cookie-cutter wells: floor verts sit inside the rim
        # (smaller radius and slightly shorter t) and must be lifted
        # onto a shallow rounded cap, leaving only a 0.6 mm nail dish.
        for i, t, r, radv in rec:
            tn = (t - tmin) / max(1e-6, tmax - tmin)
            # Only the true tip cap — mid-shaft / joint rings have a
            # smaller radius and must not be pulled toward the tip.
            if tn < 0.72:
                continue
            inside = (r < 0.80 * r_rim) and (t < tmax - 0.0006)
            if inside:
                fill = smoothstep(0.72, 0.88, tn)
                t_new = t + (tmax - 0.0006 - t) * (0.92 * fill)
                r_new = r + (r_rim * 0.96 - r) * (0.88 * fill)
                # tiny remaining dish on the dorsal / end plate
                dish = 0.00055 * smoothstep(0.70, 0.95, tn)
                t_new -= dish
                dirr = radv.normalized() if radv.length > 1e-9 else pal
                new = origin + axis * t_new + dirr * r_new
                delta[i] += (new - orig[i])
            elif r > 1.6 * r_rim and tn > 0.5:
                # outward spike
                dirr = radv.normalized() if radv.length > 1e-9 else pal
                new = origin + axis * t + dirr * r_rim
                delta[i] += (new - orig[i]) * 0.8

    for f in fingers:
        repair_distal(by[f['name1']], f['h1'], f['ax1'], f['L1'])
    repair_distal(by[th1[0].name], th1[1], th1[3], th1[4])

    # apply pass 0 into a working position so later passes see repaired tips
    work = [orig[i] + delta[i] for i in range(n)]
    TIPS_ONLY = True  # fist poses tore when pads/creases/smooth ran; ship tip close first
    if TIPS_ONLY:
        moved_idx=[]
        for i in range(n):
            if delta[i].length > 1e-8:
                mesh.vertices[i].co = orig[i] + delta[i]
                moved_idx.append(i)
        mesh.update()
        moved=len(moved_idx)
        maxd=max((delta[i].length for i in moved_idx), default=0.0)
        return dict(side=side, n=n, moved=moved, maxd=round(maxd,5), targets=sum(1 for i in range(n) if is_target(i)), mode='tips-only')


    def add(i, v):
        delta[i] += v
        work[i] = orig[i] + delta[i]

    # ========== PASS 1: primary forms ==========
    def sculpt_phalanx(idxs, origin, axis, L, kind, thick=1.0):
        """kind: 'prox' | 'dist' | 'thumb0' | 'thumb1' """
        rec = along_data(idxs, origin, axis)
        if not rec:
            return
        pal, uax = frame_at(origin, axis)
        ts = [t for _, t, _, _ in rec]
        tmin, tmax = min(ts), max(ts)
        tspan = max(tmax - tmin, 1e-6)
        # typical radius
        rs = sorted(r for _, _, r, _ in rec)
        r0 = rs[len(rs) // 2] * thick
        for i, t, r, radv in rec:
            # use WORK position
            p = work[i]
            t = (p - origin).dot(axis)
            radv = p - origin - axis * t
            r = radv.length
            tn = (t - tmin) / tspan
            if radv.length > 1e-9:
                nrm = radv.normalized()
            else:
                nrm = pal
            pl = nrm.dot(pal)          # +1 palmar, -1 dorsal
            lat = abs(nrm.dot(uax))    # 1 at sides

            # --- palmar pulp / pad (primary) ---
            if kind in ('dist', 'thumb1'):
                # distal pulp: peak around tn 0.55–0.85, palmar
                pad = gauss(tn - 0.68, 0.22) * smoothstep(0.15, 0.55, pl) * r0
                add(i, pal * (0.0010 * thick) * pad / max(gauss(0, 0.22), 1e-6))
                # rounded cap at the tip: pull verts onto a soft ellipsoid
                cap = smoothstep(0.70, 0.92, tn)
                if cap > 0:
                    # target: slightly palmar-shifted rounded end
                    # palmar side extends a hair further than dorsal (no chopped end)
                    extend = (0.0012 if pl > 0 else -0.0003) * cap * thick
                    add(i, axis * extend)
                    # inflate palmar tip, keep dorsal slightly flatter
                    add(i, pal * (0.0012 * thick) * cap * max(pl, 0.0))
                    # shrink any remaining spike along the axis past the cap
                    if tn > 0.97 and pl < -0.15:
                        add(i, axis * (-0.0006 * cap))
                    # shallow nail bed: dorsal plateau, slight inset, not a hole
                    nail = smoothstep(0.72, 0.88, tn) * smoothstep(-0.05, -0.45, pl)
                    add(i, pal * (0.00045 * thick) * nail)          # push toward palmar = inset from dorsal
                    # nail rim (ring around the plate)
                    rim = gauss(tn - 0.74, 0.06) * gauss(pl + 0.35, 0.25)
                    add(i, pal * (-0.00035 * thick) * rim)          # slight raised rim on dorsal
            elif kind in ('prox', 'thumb0'):
                pad = gauss(tn - 0.45, 0.28) * smoothstep(0.10, 0.50, pl)
                add(i, pal * (0.0013 * thick) * pad)

            # --- knuckle bump (dorsal, near the ends of the bone) ---
            if kind in ('prox', 'thumb0'):
                # MCP at base (tn~0) and PIP at distal end (tn~1)
                mcp = gauss(tn - 0.08, 0.14) * smoothstep(-0.10, -0.45, pl)
                pip = gauss(tn - 0.92, 0.12) * smoothstep(-0.10, -0.45, pl)
                add(i, pal * (-1) * (0.0015 * thick) * mcp)
                add(i, pal * (-1) * (0.0013 * thick) * pip)
            elif kind in ('dist', 'thumb1'):
                # DIP region near tn~0.15–0.35
                dip = gauss(tn - 0.18, 0.12) * smoothstep(-0.10, -0.45, pl)
                add(i, pal * (-1) * (0.0010 * thick) * dip)

            # --- oval shaft (primary): flatten sides slightly, keep palmar/dorsal volume ---
            if 0.15 < tn < 0.85 and kind in ('prox', 'dist', 'thumb0', 'thumb1'):
                # pull lateral in a little, push palmar out a little
                oval = math.sin(math.pi * tn)
                add(i, pal * (0.0006 * thick) * oval * max(pl, 0.0))
                add(i, nrm * (-0.00045 * thick) * oval * lat)

            # --- taper (distal slightly slimmer than mid) ---
            if kind in ('dist', 'thumb1') and tn > 0.5:
                add(i, nrm * (-0.0004 * thick) * smoothstep(0.50, 0.90, tn) * (1.0 - max(pl, 0.0) * 0.4))

    for f in fingers:
        sculpt_phalanx(by[f['name0']], f['h0'], f['ax0'], f['L0'], 'prox', f['thick'])
        sculpt_phalanx(by[f['name1']], f['h1'], f['ax1'], f['L1'], 'dist', f['thick'])
    sculpt_phalanx(by[th0[0].name], th0[1], th0[3], th0[4], 'thumb0', 1.05)
    sculpt_phalanx(by[th1[0].name], th1[1], th1[3], th1[4], 'thumb1', 1.00)

    # --- thenar / hypothenar / mid-palm hollow (hand verts) ---
    rec = along_data(by[f'hand.{side}'], hh, hax)
    pal, uax = frame_at(hh, hax)
    # thumb base in this frame
    thumb_root = th0[1]
    # pinky MCP
    pinky_root = fingers[3]['h0']
    if rec:
        ts = [t for _, t, _, _ in rec]
        tmin, tmax = min(ts), max(ts)
        tspan = max(tmax - tmin, 1e-6)
        for i, t, r, radv in rec:
            p = work[i]
            pl = 0.0
            if (p - hh - hax * (p - hh).dot(hax)).length > 1e-9:
                nrm = (p - hh - hax * (p - hh).dot(hax)).normalized()
                pl = nrm.dot(pal)
            else:
                nrm = pal
            tn = (t - tmin) / tspan
            # thenar: near thumb root, palmar
            dth = (p - thumb_root).length
            thenar = gauss(dth, 0.028) * smoothstep(0.05, 0.45, pl)
            add(i, pal * 0.0022 * thenar)
            # hypothenar: near pinky edge, palmar
            dpk = (p - pinky_root).length
            hypo = gauss(dpk, 0.024) * smoothstep(0.05, 0.45, pl)
            add(i, pal * 0.0016 * hypo)
            # mid-palm hollow (between mounds, palmar, mid tn)
            hollow = gauss(dth - 0.030, 0.016) * gauss(dpk - 0.030, 0.016) * smoothstep(0.10, 0.50, pl)
            add(i, pal * (-0.00035) * hollow)
            # knuckle arc on the dorsal metacarpals (four soft bumps already
            # partly exist; lift middle knuckle a little more)
            if pl < -0.15:
                for fi, f in enumerate(fingers):
                    d = (p - f['h0']).length
                    bump = gauss(d, 0.012) * smoothstep(-0.15, -0.45, pl)
                    hgt = [0.85, 1.00, 0.95, 0.70][fi]
                    add(i, pal * (-1) * 0.0012 * hgt * bump)

    # ========== PASS 2: secondary — tendons, clearer nail, knuckle pads ==========
    # dorsal tendons along each finger + back of hand
    for f in fingers:
        idxs = by[f['name0']] + by[f['name1']]
        # use mid-finger axis from prox head to distal tail
        origin, axis = f['h0'], (f['t1'] - f['h0']).normalized()
        pal, uax = frame_at(origin, axis)
        rec = along_data(idxs, origin, axis)
        if not rec:
            continue
        ts = [t for _, t, _, _ in rec]
        tmin, tmax = min(ts), max(ts)
        tspan = max(tmax - tmin, 1e-6)
        for i, t, r, radv in rec:
            p = work[i]
            t = (p - origin).dot(axis)
            radv = p - origin - axis * t
            if radv.length < 1e-9:
                continue
            nrm = radv.normalized()
            pl = nrm.dot(pal)
            tn = (t - tmin) / tspan
            # a thin dorsal ridge along the finger centerline
            # (small lateral falloff)
            lat = nrm.dot(uax)
            tend = gauss(lat, 0.35) * smoothstep(-0.20, -0.55, pl) * math.sin(math.pi * clamp(tn, 0, 1))
            add(i, pal * (-1) * 0.0004 * f['thick'] * tend)

    # ========== PASS 3: fine — palmar joint creases, nail polish of the rim ==========
    def crease_ring(idxs, origin, axis, t_center, width=0.006, depth=0.0007):
        rec = along_data(idxs, origin, axis)
        pal, uax = frame_at(origin, axis)
        for i, t, r, radv in rec:
            p = work[i]
            t = (p - origin).dot(axis)
            radv = p - origin - axis * t
            if radv.length < 1e-9:
                continue
            nrm = radv.normalized()
            pl = nrm.dot(pal)
            # palmar crease only
            c = gauss(t - t_center, width) * smoothstep(0.05, 0.50, pl)
            add(i, nrm * (-depth) * c)

    for f in fingers:
        # crease near PIP (end of prox / start of dist) and DIP (mid distal)
        crease_ring(by[f['name0']], f['h0'], f['ax0'], f['L0'] * 0.92, 0.0030, 0.00035)
        crease_ring(by[f['name1']], f['h1'], f['ax1'], f['L1'] * 0.18, 0.0028, 0.00030)
        crease_ring(by[f['name1']], f['h1'], f['ax1'], f['L1'] * 0.55, 0.0028, 0.00025)
    crease_ring(by[th0[0].name], th0[1], th0[3], th0[4] * 0.9, 0.0035, 0.00030)
    crease_ring(by[th1[0].name], th1[1], th1[3], th1[4] * 0.2, 0.0030, 0.00028)

    # write, then a light relax so stacked pads do not facet
    moved_idx = []
    for i in range(n):
        if delta[i].length > 1e-8:
            mesh.vertices[i].co = orig[i] + delta[i]
            moved_idx.append(i)
    mesh.update()
    bm = bmesh.new(); bm.from_mesh(mesh); bm.verts.ensure_lookup_table()
    # smooth non-tip body a little; keep the closed cap firmer
    body = []
    for i in moved_idx:
        bm.verts[i].tag = True
    vs=[bm.verts[i] for i in moved_idx]
    for _ in range(2):
        bmesh.ops.smooth_vert(bm, verts=vs, factor=0.35,
                              use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.to_mesh(mesh); bm.free(); mesh.update()
    moved = len(moved_idx)
    maxd = max((delta[i].length for i in moved_idx), default=0.0)
    return dict(side=side, n=n, moved=moved, maxd=round(maxd, 5), targets=sum(1 for i in range(n) if is_target(i)))


def recalc_normals(obj):
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()


def setup_render():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.color_type = 'MATERIAL'
    scene.display.shading.show_shadows = True
    scene.display.shading.show_specular_highlight = True
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 960
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = False
    world = bpy.data.worlds.new('W1390')
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs[0].default_value = (0.55, 0.57, 0.60, 1)
    bg.inputs[1].default_value = 1.0
    camd = bpy.data.cameras.new('C1390')
    cam = bpy.data.objects.new('C1390', camd)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam
    camd.clip_start = 0.005
    camd.clip_end = 20
    return scene, cam, camd


def look(cam, camd, scene, pos, tgt, path, lens=70):
    cam.location = pos
    d = (tgt - pos).normalized()
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    camd.lens = lens
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print('render', path, os.path.getsize(path) if os.path.exists(path) else 'MISSING')


def hide_all_but(keep):
    for o in bpy.data.objects:
        vis = o in keep or o.type == 'CAMERA'
        o.hide_render = not vis
        o.hide_viewport = not vis and o.type != 'ARMATURE'


def linen_mute(obj):
    # dim linen so skin reads clearly
    if not obj.material_slots:
        return
    m0 = obj.material_slots[0].material
    if m0 and m0.use_nodes:
        for n in m0.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                n.inputs['Alpha'].default_value = 0.15
        m0.blend_method = 'BLEND'


def render_hand(arm, hands, tag, folder):
    scene, cam, camd = setup_render()
    rh = hands['R']
    linen_mute(rh)
    hide_all_but({rh})
    # target: mid right fingers
    b = arm.data.bones['finger.R.1.02']
    tgt = b.head_local.lerp(b.tail_local, 0.4)
    # a little toward the hand
    tgt = tgt.lerp(arm.data.bones['hand.R'].head_local, 0.25)
    # views — further back than the first attempt
    look(cam, camd, scene, tgt + Vector((0.00, 0.13, 0.08)), tgt, os.path.join(folder, f'{tag}-dorsal.png'), 60)
    look(cam, camd, scene, tgt + Vector((0.00, -0.13, 0.06)), tgt, os.path.join(folder, f'{tag}-palm.png'), 60)
    look(cam, camd, scene, tgt + Vector((0.12, 0.04, 0.06)), tgt, os.path.join(folder, f'{tag}-side.png'), 60)
    look(cam, camd, scene, tgt + Vector((0.08, 0.10, 0.10)), tgt, os.path.join(folder, f'{tag}-threequarter.png'), 55)
    # tips
    tip = arm.data.bones['finger.R.1.02'].tail_local.copy()
    look(cam, camd, scene, tip + Vector((0.03, 0.06, 0.05)), tip, os.path.join(folder, f'{tag}-tips.png'), 85)
    look(cam, camd, scene, tip + Vector((0.00, -0.05, 0.03)), tip, os.path.join(folder, f'{tag}-tips-palm.png'), 85)
    return scene, cam, camd


def export_bin(hands, stats):
    # vertex order = current Blender mesh order, which came from the glTF import
    manifest = {'nverts': 3564, 'hands': {}}
    blob = b''
    for side in ('R', 'L'):
        mesh = hands[side].data
        assert len(mesh.vertices) == 3564, (side, len(mesh.vertices))
        pos = []
        nrm = []
        mesh.update()
        for v in mesh.vertices:
            pos.extend([v.co.x, v.co.y, v.co.z])
            nrm.extend([v.normal.x, v.normal.y, v.normal.z])
        pb = struct.pack('<' + 'f' * len(pos), *pos)
        nb = struct.pack('<' + 'f' * len(nrm), *nrm)
        path_p = os.path.join(OUT_ASSET, f'hand-{side}-pos.bin')
        path_n = os.path.join(OUT_ASSET, f'hand-{side}-nrm.bin')
        open(path_p, 'wb').write(pb)
        open(path_n, 'wb').write(nb)
        # anchors for tests: a few vertex indices
        anchors = {}
        for idx in (0, 10, 100, 500, 2000, 3563):
            anchors[str(idx)] = [round(mesh.vertices[idx].co[k], 6) for k in range(3)]
        manifest['hands'][side] = {
            'verts': 3564,
            'posBytes': len(pb),
            'nrmBytes': len(nb),
            'name': hands[side].data.name,
            'object': hands[side].name,
            'anchors': anchors,
        }
    manifest['stats'] = stats
    manifest['note'] = 'Same vertex count and order as scottish-base.glb GLOVE meshes. Flag __noArm1390 skips the swap.'
    open(os.path.join(OUT_ASSET, 'manifest.json'), 'w').write(json.dumps(manifest, indent=2))
    print('exported', OUT_ASSET, 'bytes', sum(os.path.getsize(os.path.join(OUT_ASSET, f)) for f in os.listdir(OUT_ASSET)))
    return manifest


def main():
    arm, hands = load()
    pal_r, f_r, t_r = side_palmar(arm, 'R')
    pal_l, f_l, t_l = side_palmar(arm, 'L')
    print('palmar R', tuple(round(x, 4) for x in pal_r), 'finger', tuple(round(x, 4) for x in f_r))
    print('palmar L', tuple(round(x, 4) for x in pal_l), 'finger', tuple(round(x, 4) for x in f_l))

    # framed BEFORE renders from this same camera set
    render_hand(arm, hands, 'before', os.path.join(QA, 'before'))

    stats = []
    stats.append(sculpt_side(hands['R'], arm, 'R', pal_r))
    stats.append(sculpt_side(hands['L'], arm, 'L', pal_l))
    recalc_normals(hands['R'])
    recalc_normals(hands['L'])
    print('stats', stats)

    render_hand(arm, hands, 'sculpt', WIP)
    # also a copy under after/ for mesh stills
    render_hand(arm, hands, 'mesh', os.path.join(QA, 'after'))

    man = export_bin(hands, stats)
    open(os.path.join(QA, 'research', 'sculpt-stats.json'), 'w').write(json.dumps({'palmarR': list(pal_r), 'stats': stats}, indent=2))
    print('done')


if __name__ == '__main__':
    main()
