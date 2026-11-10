# Blender 4.2: voxel-remesh the Grab3D pig, bake albedo, rig, idle+walk, export.
# Run: /tmp/blender/blender --background --python tools/mob-source/build_pig3.py
import bpy
import math
import os
from mathutils import Vector

SRC = "/tmp/pig-bases/pig.glb"
ALBEDO = "/tmp/pig-bases/tex/pig3_albedo_2k.png"
ALBEDO_1K = "/tmp/pig-bases/tex/pig3_albedo_1k.png"
BAKE_PNG = "/tmp/pig-bases/tex/pig3_baked_2k.png"
OUT_GLB = "/workspace/gc-phase3/assets/models/pig3.glb"
OUT_TEX = "/workspace/gc-phase3/assets/tex"
VOXEL = 0.012
HEIGHT = 1.0

def log(*a):
    print("[pig3]", *a, flush=True)

def wipe():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def world_pts(o):
    mw = o.matrix_world
    return [mw @ v.co for v in o.data.vertices]

def bounds(o):
    pts = world_pts(o)
    xs, ys, zs = [p.x for p in pts], [p.y for p in pts], [p.z for p in pts]
    return (min(xs), min(ys), min(zs)), (max(xs), max(ys), max(zs))

def mean_pts(sel):
    if not sel:
        return Vector((0, 0, 0.4))
    s = Vector((0, 0, 0))
    for p in sel:
        s += p
    return s / len(sel)

def apply_tr(o):
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

wipe()
bpy.ops.import_scene.gltf(filepath=SRC)
hi = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
hi.name = "pig_hi"
log("imported", len(hi.data.polygons), "faces")

# Scale to 1 m tall, plant at z=0 (Blender Z-up, +Y forward)
mn, mx = bounds(hi)
hi.scale = (HEIGHT / (mx[2] - mn[2]),) * 3
apply_tr(hi)
mn, mx = bounds(hi)
hi.location.z -= mn[2]
apply_tr(hi)
mn, mx = bounds(hi)
log("hi bounds", mn, mx)

# Emission material on high poly so bake is lighting-free colour
img_hi = bpy.data.images.load(ALBEDO)
img_hi.colorspace_settings.name = "sRGB"
mat_hi = bpy.data.materials.new("PigHi")
mat_hi.use_nodes = True
nt = mat_hi.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
out_n = nt.nodes.new("ShaderNodeOutputMaterial")
emit = nt.nodes.new("ShaderNodeEmission")
tex_hi = nt.nodes.new("ShaderNodeTexImage")
tex_hi.image = img_hi
nt.links.new(tex_hi.outputs["Color"], emit.inputs["Color"])
emit.inputs["Strength"].default_value = 1.0
nt.links.new(emit.outputs["Emission"], out_n.inputs["Surface"])
hi.data.materials.clear()
hi.data.materials.append(mat_hi)

# Duplicate and voxel remesh to a watertight game mesh
bpy.ops.object.select_all(action="DESELECT")
hi.select_set(True)
bpy.context.view_layer.objects.active = hi
bpy.ops.object.duplicate()
low = bpy.context.view_layer.objects.active
low.name = "pig"
low.data = low.data.copy()
low.data.remesh_voxel_size = VOXEL
low.data.remesh_voxel_adaptivity = 0.05
bpy.ops.object.voxel_remesh()
log("remesh", "verts", len(low.data.vertices), "faces", len(low.data.polygons))
# Consistent normals, plant
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode="OBJECT")
mn, mx = bounds(low)
low.location.z -= mn[2]
apply_tr(low)
log("low bounds", *bounds(low))

# New UVs
bpy.ops.object.select_all(action="DESELECT")
low.select_set(True)
bpy.context.view_layer.objects.active = low
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003)
bpy.ops.object.mode_set(mode="OBJECT")

# Bake target image
bake_img = bpy.data.images.new("pig3_bake", 2048, 2048, alpha=False)
bake_img.generated_color = (0.83, 0.55, 0.48, 1)
mat_lo = bpy.data.materials.new("PigSkin")
mat_lo.use_nodes = True
nt = mat_lo.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
out_n = nt.nodes.new("ShaderNodeOutputMaterial")
bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
tex_lo = nt.nodes.new("ShaderNodeTexImage")
tex_lo.image = bake_img
nt.links.new(tex_lo.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Metallic"].default_value = 0.0
bsdf.inputs["Roughness"].default_value = 0.72
if "Specular IOR Level" in bsdf.inputs:
    bsdf.inputs["Specular IOR Level"].default_value = 0.25
nt.links.new(bsdf.outputs["BSDF"], out_n.inputs["Surface"])
low.data.materials.clear()
low.data.materials.append(mat_lo)
# The image node must be active for bake
nt.nodes.active = tex_lo

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 8
scene.cycles.use_denoising = False
scene.render.bake.use_selected_to_active = True
scene.render.bake.margin = 8
scene.render.bake.cage_extrusion = 0.05
scene.render.bake.max_ray_distance = 0.15
scene.render.bake.use_clear = True

bpy.ops.object.select_all(action="DESELECT")
hi.select_set(True)
low.select_set(True)
bpy.context.view_layer.objects.active = low
log("baking...")
bpy.ops.object.bake(type="EMIT")
os.makedirs(os.path.dirname(BAKE_PNG), exist_ok=True)
bake_img.filepath_raw = BAKE_PNG
bake_img.file_format = "PNG"
bake_img.save()
log("baked", BAKE_PNG)

# Write game sidecars from the bake, and pack a 1k PNG for the GLB
import subprocess, sys
subprocess.check_call(["/usr/bin/python3", "-c", r"""
from PIL import Image, ImageDraw
import numpy as np
im = Image.open('/tmp/pig-bases/tex/pig3_baked_2k.png').convert('RGB')
arr = np.array(im)
# Flood-fill unused UV background (black) with skin pink so mipmaps do not fringe.
bg = (210, 145, 122)
# only fill if corners are near-black
mask = Image.fromarray((arr.max(2) < 8).astype('uint8')*255)
# reconstruct: paint background only where connected to the border
from PIL import Image as _I
work = Image.new('L', im.size, 0)
# mark border black pixels, flood
# use ImageDraw flood via a scratch RGB
scratch = Image.new('RGB', im.size, (0,0,0))
# put white where we want to keep (non-black)
keep = (arr.max(2) >= 8)
scratch_arr = np.zeros_like(arr)
scratch_arr[keep] = (255,255,255)
scratch = Image.fromarray(scratch_arr)
# flood fill from every border pixel that is background
from collections import deque
h,w = arr.shape[:2]
bgmask = ~keep
visited = np.zeros((h,w), dtype=bool)
q = deque()
for x in range(w):
    if bgmask[0,x]: q.append((0,x)); visited[0,x]=True
    if bgmask[h-1,x]: q.append((h-1,x)); visited[h-1,x]=True
for y in range(h):
    if bgmask[y,0]: q.append((y,0)); visited[y,0]=True
    if bgmask[y,w-1]: q.append((y,w-1)); visited[y,w-1]=True
while q:
    y,x = q.popleft()
    for ny,nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
        if 0<=ny<h and 0<=nx<w and not visited[ny,nx] and bgmask[ny,nx]:
            visited[ny,nx]=True; q.append((ny,nx))
arr[visited] = bg
im = Image.fromarray(arr)
im.save('/tmp/pig-bases/tex/pig3_baked_2k.png')
im.save('/workspace/gc-phase3/assets/tex/pig3_2k.webp', 'WEBP', quality=90, method=6)
im.resize((1024,1024), Image.Resampling.LANCZOS).save('/tmp/pig-bases/tex/pig3_baked_1k.png', 'PNG', optimize=True)
print('sidecars', im.size, 'mean', arr.mean(axis=(0,1)), 'bgfrac', visited.mean())
"""])

# Swap the material image to the packed 1k for a smaller GLB
img_1k = bpy.data.images.load("/tmp/pig-bases/tex/pig3_baked_1k.png")
img_1k.pack()
img_1k.colorspace_settings.name = "sRGB"
tex_lo.image = img_1k

# Hide / remove high poly so it is not exported
bpy.data.objects.remove(hi, do_unlink=True)

# ---------- armature ----------
obj = low
pts = world_pts(obj)
mn, mx = bounds(obj)
x0, y0, z0 = mn
x1, y1, z1 = mx
cy = 0.5 * (y0 + y1)

snout_sel = [p for p in pts if p.y > y1 - 0.06 * (y1 - y0)]
snout_c = mean_pts(snout_sel)
snout_c = Vector((0.0, snout_c.y, snout_c.z))
head_sel = [p for p in pts if p.y > cy + 0.22 * (y1 - y0) and p.z > 0.50]
head_c = mean_pts(head_sel) if head_sel else Vector((0, y1 * 0.55, 0.68))
head_c = Vector((0.0, min(head_c.y, snout_c.y - 0.10), max(head_c.z, 0.62)))

def ear_tip(sign, fallback):
    cand = [p for p in pts if p.y > 0.25 and p.z > 0.65 and p.x * sign > 0.08]
    if not cand:
        cand = [p for p in pts if p.y > 0.15 and p.z > 0.60 and p.x * sign > 0.05]
    if not cand:
        return fallback
    cand = sorted(cand, key=lambda p: p.z + 0.45 * abs(p.x) + 0.08 * p.y, reverse=True)[:6]
    return mean_pts(cand)
ear_lc = ear_tip(-1, Vector((-0.22, head_c.y + 0.02, 0.92)))
ear_rc = ear_tip(+1, Vector((0.22, head_c.y + 0.02, 0.92)))
# If the +X ear tip was missed (shoulder/back picked), mirror the good ear.
if abs(ear_rc.x) < 0.20 or ear_rc.y < head_c.y - 0.15 or abs(ear_rc.x) < abs(ear_lc.x) * 0.5:
    ear_rc = Vector((-ear_lc.x, ear_lc.y, ear_lc.z))

tail_sel = [p for p in pts if p.y < y0 + 0.08 * (y1 - y0) and p.z > 0.40]
tail_c = mean_pts(tail_sel) if tail_sel else Vector((0, y0 + 0.04, 0.55))
tail_c = Vector((0.0, tail_c.y, tail_c.z))
body_c = Vector((0.0, cy, 0.48))

# Hooves: lowest isolated patches that have a vertical leg column (skip the belly)
# Ignore the dewlap/chin (very far forward) and the far belly mid-line.
cands = sorted([p for p in pts if p.z < 0.10 and 0.16 < abs(p.y) < 0.55 and abs(p.x) > 0.06], key=lambda p: p.z)
picked = []
for p in cands:
    if any((p.x - q.x) ** 2 + (p.y - q.y) ** 2 < 0.16 ** 2 for q in picked):
        continue
    col = [q for q in pts if (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < 0.07 ** 2 and 0.08 < q.z < 0.35]
    if len(col) < 8:
        continue
    picked.append(p)
    if len(picked) == 4:
        break
log("hoof candidates", [(round(p.x, 3), round(p.y, 3), round(p.z, 3)) for p in picked])
# Label by x/y
labels_map = {}
if len(picked) == 4:
    mx = sum(p.x for p in picked) / 4
    my = sum(p.y for p in picked) / 4
    for p in picked:
        k = ("F" if p.y >= my else "B") + ("R" if p.x >= mx else "L")
        labels_map[k] = p
hips, hoofs = {}, {}
for k, fb in {"FL": (-0.18, 0.38, 0.28), "FR": (0.18, 0.38, 0.28), "BL": (-0.18, -0.38, 0.28), "BR": (0.18, -0.38, 0.28)}.items():
    if k in labels_map:
        hoof_p = labels_map[k]
        hoofs[k] = Vector((hoof_p.x, hoof_p.y, min(0.025, max(0.0, hoof_p.z))))
        col = [q for q in pts if (q.x - hoof_p.x) ** 2 + (q.y - hoof_p.y) ** 2 < 0.09 ** 2 and 0.16 < q.z < 0.40]
        hip_p = mean_pts(col) if col else Vector((hoof_p.x, hoof_p.y, 0.28))
        hips[k] = Vector((hoof_p.x, hoof_p.y, max(0.22, min(0.36, hip_p.z))))
    else:
        hips[k] = Vector(fb)
        hoofs[k] = Vector((fb[0], fb[1], 0.02))
    log("leg", k, "hip", tuple(hips[k]), "hoof", tuple(hoofs[k]))

log("head", tuple(head_c), "snout", tuple(snout_c), "tail", tuple(tail_c))
log("ears", tuple(ear_lc), tuple(ear_rc))

bpy.ops.object.add(type="ARMATURE", enter_editmode=True, location=(0, 0, 0))
arm = bpy.context.object
arm.name = "Armature"
ad = arm.data
ad.name = "Armature"

def bone(name, parent, head, tail):
    b = ad.edit_bones.new(name)
    b.head = Vector(head)
    b.tail = Vector(tail)
    if (b.tail - b.head).length < 0.02:
        b.tail = b.head + Vector((0, 0, 0.04))
    b.use_connect = False
    if parent:
        b.parent = ad.edit_bones[parent]
    return b

bone("Root", None, (0, 0, 0), (0, 0, 0.08))
spine0 = Vector((0, cy - 0.20 * (y1 - y0), body_c.z))
spine1 = Vector((0, cy + 0.18 * (y1 - y0), max(body_c.z, head_c.z - 0.12)))
bone("Body", "Root", spine0, spine1)
neck = Vector((0, head_c.y - 0.08, head_c.z - 0.04))
skull = Vector((0, head_c.y + 0.04, head_c.z + 0.04))
bone("Head", "Body", neck, skull)
snout_tail = Vector((0, snout_c.y + 0.02, snout_c.z))
if (snout_tail - skull).length < 0.04:
    snout_tail = skull + Vector((0, 0.10, -0.02))
bone("Snout", "Head", skull, snout_tail)
ear_root_l = Vector((ear_lc.x * 0.45, ear_lc.y * 0.6 + head_c.y * 0.4, max(head_c.z, ear_lc.z - 0.08)))
ear_root_r = Vector((ear_rc.x * 0.45, ear_rc.y * 0.6 + head_c.y * 0.4, max(head_c.z, ear_rc.z - 0.08)))
bone("EarL", "Head", ear_root_l, ear_lc)
bone("EarR", "Head", ear_root_r, ear_rc)
rump = Vector((0, tail_c.y + 0.08, tail_c.z))
bone("Tail", "Body", rump, tail_c)
bone("Tail2", "Tail", tail_c, tail_c + Vector((0, -0.06, 0.04)))
for k in ("FL", "FR", "BL", "BR"):
    hip_p = hips[k]
    hoof_p = Vector((hoofs[k].x, hoofs[k].y, min(0.03, hoofs[k].z)))
    mid = (hip_p + hoof_p) * 0.5
    bone("Leg" + k, "Body", hip_p, mid)
    bone("Hoof" + k, "Leg" + k, mid, hoof_p)

bpy.ops.object.mode_set(mode="OBJECT")
obj.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type="ARMATURE_AUTO")
log("skinned, vgroups", len(obj.vertex_groups))

scene.render.fps = 24
for pb in arm.pose.bones:
    pb.rotation_mode = "XYZ"
    pb.rotation_euler = (0, 0, 0)

def action(name, frames, fn):
    act = bpy.data.actions.new(name=name)
    if not arm.animation_data:
        arm.animation_data_create()
    arm.animation_data.action = act
    for pb in arm.pose.bones:
        pb.rotation_euler = (0, 0, 0)
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)
    for f in frames:
        fn(f, len(frames))
        for pb in arm.pose.bones:
            pb.keyframe_insert("rotation_euler", frame=f)
            pb.keyframe_insert("location", frame=f)
            if pb.name == "Body":
                pb.keyframe_insert("scale", frame=f)
    for fc in act.fcurves:
        fc.extrapolation = "LINEAR"
        if not fc.modifiers:
            m = fc.modifiers.new("CYCLES")
            m.mode_before = "REPEAT"
            m.mode_after = "REPEAT"
    log("action", name, "frames", frames[0], "..", frames[-1], "fcurves", len(act.fcurves))
    return act

def walk_pose(f, n):
    t = (f - 1) / 24.0
    w = 2 * math.pi * (t / 1.2)
    amp = math.radians(26)
    lift = 0.03
    def leg(name, phase):
        ang = math.sin(w + phase) * amp
        up = max(0.0, math.sin(w + phase)) * lift
        arm.pose.bones["Leg" + name].rotation_euler = (ang, 0, 0)
        arm.pose.bones["Hoof" + name].rotation_euler = (-ang * 0.55, 0, 0)
        arm.pose.bones["Leg" + name].location = (0, 0, up)
    leg("FL", 0)
    leg("BR", 0)
    leg("FR", math.pi)
    leg("BL", math.pi)
    bob = math.sin(w * 2) * 0.012
    arm.pose.bones["Body"].location = (0, 0, bob)
    arm.pose.bones["Body"].rotation_euler = (0, math.sin(w) * math.radians(3), 0)
    arm.pose.bones["Head"].rotation_euler = (math.sin(w * 2) * math.radians(4), 0, 0)
    arm.pose.bones["Tail"].rotation_euler = (0, 0, math.sin(w * 2) * math.radians(18))
    arm.pose.bones["Tail2"].rotation_euler = (0, 0, math.sin(w * 2 + 0.4) * math.radians(22))
    arm.pose.bones["EarL"].rotation_euler = (math.sin(w * 2) * math.radians(6), 0, 0)
    arm.pose.bones["EarR"].rotation_euler = (math.sin(w * 2 + 0.3) * math.radians(6), 0, 0)

def idle_pose(f, n):
    t = (f - 1) / 24.0
    w = 2 * math.pi * (t / 2.0)
    breath = 1.0 + 0.035 * math.sin(w)
    arm.pose.bones["Body"].scale = (1.0 + 0.012 * math.sin(w), 1.0, breath)
    arm.pose.bones["Body"].location = (0, 0, 0.01 * math.sin(w))
    arm.pose.bones["Head"].rotation_euler = (math.sin(w) * math.radians(3), math.sin(w * 0.5) * math.radians(2), 0)
    arm.pose.bones["Snout"].rotation_euler = (math.sin(w) * math.radians(1.5), 0, 0)
    arm.pose.bones["EarL"].rotation_euler = (math.sin(w * 2) * math.radians(8), 0, math.sin(w) * math.radians(4))
    arm.pose.bones["EarR"].rotation_euler = (math.sin(w * 2 + 0.6) * math.radians(8), 0, math.sin(w + 0.4) * math.radians(4))
    arm.pose.bones["Tail"].rotation_euler = (0, 0, math.sin(w * 1.5) * math.radians(12))
    arm.pose.bones["Tail2"].rotation_euler = (0, 0, math.sin(w * 1.5 + 0.5) * math.radians(16))

action("walk", list(range(1, 30)), walk_pose)
action("idle", list(range(1, 49)), idle_pose)
arm.animation_data.action = bpy.data.actions.get("idle")

os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
kwargs = dict(
    filepath=OUT_GLB,
    export_format="GLB",
    export_texcoords=True,
    export_normals=True,
    export_materials="EXPORT",
    export_vertex_color="NONE",
    export_image_format="AUTO",
    export_skins=True,
    export_influence_nb=4,
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_yup=True,
    export_apply=False,
    export_cameras=False,
    export_lights=False,
)
bpy.ops.export_scene.gltf(**kwargs)
log("exported", OUT_GLB, "size", os.path.getsize(OUT_GLB))
