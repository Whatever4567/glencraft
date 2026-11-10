# Blender 4.2: voxel-remesh the Grab3D sheep, bake albedo, rig, idle+walk, export.
# Run: /tmp/blender/blender --background --python tools/mob-source/build_sheep3.py
import bpy
import math
import os
import json
from mathutils import Vector

SRC = "/tmp/sheep-bases/sheep.glb"
ALBEDO = "/tmp/sheep-bases/tex/Image_0.png"
BAKE_PNG = "/tmp/sheep-bases/tex/sheep3_baked_2k.png"
OUT_GLB = "/workspace/gc-phase3/assets/models/sheep3.glb"
OUT_TEX = "/workspace/gc-phase3/assets/tex"
VOXEL = 0.009
HEIGHT = 1.0
LOG = "/tmp/sheep-bases/build_sheep3.log"

def log(*a):
    msg = "[sheep3] " + " ".join(str(x) for x in a)
    print(msg, flush=True)
    with open(LOG, "a") as f:
        f.write(msg + "\n")

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

open(LOG, "w").write("")
wipe()
bpy.ops.import_scene.gltf(filepath=SRC)
hi = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
hi.name = "sheep_hi"
log("imported", len(hi.data.polygons), "faces", len(hi.data.vertices), "verts")

# Scale to 1 m tall, plant at z=0 (Blender Z-up, +Y forward in the source)
mn, mx = bounds(hi)
hi.scale = (HEIGHT / (mx[2] - mn[2]),) * 3
apply_tr(hi)
mn, mx = bounds(hi)
hi.location.z -= mn[2]
apply_tr(hi)
mn, mx = bounds(hi)
log("hi bounds", tuple(round(v, 4) for v in mn), tuple(round(v, 4) for v in mx))

# Grab3D farm animals are authored Blender Z-up, +Y forward (same as the pig).
# Face direction is confirmed in studio shots after export; rotate here if needed.
log("assuming face at +Y (Grab3D convention)")

# Emission material on high poly so bake is lighting-free colour
img_hi = bpy.data.images.load(ALBEDO)
img_hi.colorspace_settings.name = "sRGB"
mat_hi = bpy.data.materials.new("SheepHi")
mat_hi.use_nodes = True
nt = mat_hi.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
out_n = nt.nodes.new("ShaderNodeOutputMaterial")
emit = nt.nodes.new("ShaderNodeEmission")
tex_hi = nt.nodes.new("ShaderNodeTexImage")
tex_hi.image = img_hi
# Source glTF typically uses +V from bottom; Blender image node default is Fine
nt.links.new(tex_hi.outputs["Color"], emit.inputs["Color"])
emit.inputs["Strength"].default_value = 1.0
nt.links.new(emit.outputs["Emission"], out_n.inputs["Surface"])
hi.data.materials.clear()
hi.data.materials.append(mat_hi)

# Duplicate and voxel remesh to a watertight game mesh (keeps wool clumps)
bpy.ops.object.select_all(action="DESELECT")
hi.select_set(True)
bpy.context.view_layer.objects.active = hi
bpy.ops.object.duplicate()
low = bpy.context.view_layer.objects.active
low.name = "sheep"
low.data = low.data.copy()
low.data.remesh_voxel_size = VOXEL
low.data.remesh_voxel_adaptivity = 0.04
bpy.ops.object.voxel_remesh()
log("remesh", "verts", len(low.data.vertices), "faces", len(low.data.polygons))
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

# Bake target image (cream wool fill)
bake_img = bpy.data.images.new("sheep3_bake", 2048, 2048, alpha=False)
bake_img.generated_color = (0.90, 0.86, 0.76, 1)
mat_lo = bpy.data.materials.new("SheepWool")
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
bsdf.inputs["Roughness"].default_value = 0.82
if "Specular IOR Level" in bsdf.inputs:
    bsdf.inputs["Specular IOR Level"].default_value = 0.18
nt.links.new(bsdf.outputs["BSDF"], out_n.inputs["Surface"])
low.data.materials.clear()
low.data.materials.append(mat_lo)
nt.nodes.active = tex_lo

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 8
scene.cycles.use_denoising = False
scene.render.bake.use_selected_to_active = True
scene.render.bake.margin = 8
scene.render.bake.cage_extrusion = 0.04
scene.render.bake.max_ray_distance = 0.12
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

import subprocess
subprocess.check_call(["/usr/bin/python3", "-c", r"""
from PIL import Image
import numpy as np
from collections import deque
im = Image.open('/tmp/sheep-bases/tex/sheep3_baked_2k.png').convert('RGB')
arr = np.array(im)
bg = (230, 219, 194)  # cream wool, so mipmaps do not fringe
keep = (arr.max(2) >= 8)
h, w = arr.shape[:2]
bgmask = ~keep
visited = np.zeros((h, w), dtype=bool)
q = deque()
for x in range(w):
    if bgmask[0, x]: q.append((0, x)); visited[0, x] = True
    if bgmask[h-1, x]: q.append((h-1, x)); visited[h-1, x] = True
for y in range(h):
    if bgmask[y, 0]: q.append((y, 0)); visited[y, 0] = True
    if bgmask[y, w-1]: q.append((y, w-1)); visited[y, w-1] = True
while q:
    y, x = q.popleft()
    for ny, nx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
        if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and bgmask[ny, nx]:
            visited[ny, nx] = True
            q.append((ny, nx))
arr[visited] = bg
im = Image.fromarray(arr)
im.save('/tmp/sheep-bases/tex/sheep3_baked_2k.png')
os_ok = True
import os
os.makedirs('/workspace/gc-phase3/assets/tex', exist_ok=True)
im.save('/workspace/gc-phase3/assets/tex/sheep3_2k.webp', 'WEBP', quality=90, method=6)
im.resize((1024, 1024), Image.Resampling.LANCZOS).save('/tmp/sheep-bases/tex/sheep3_baked_1k.png', 'PNG', optimize=True)
# shorn variant: cream wool -> short stubble over pale skin; keep dark face/legs/eyes
from PIL import ImageFilter
a = arr.astype(np.float32) / 255.0
mx, mn = a.max(2), a.min(2)
s = (mx - mn) / np.maximum(mx, 1e-3)
L = a.mean(2)
# wool: bright, low-ish saturation cream
wool = ((L > 0.42) & (s < 0.28)).astype(np.float32)
# keep anything quite dark (face, ears, legs, hooves, eyes)
wool[L < 0.32] = 0
wool = np.asarray(Image.fromarray((wool * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.0))).astype(np.float32) / 255.0
blur = np.asarray(Image.fromarray(arr).filter(ImageFilter.GaussianBlur(2048 / 48))).astype(np.float32) / 255.0
detail = (L - blur.mean(2))[..., None]
skin = np.array([0.86, 0.74, 0.66], np.float32)
rng = np.random.default_rng(11)
sp = np.asarray(Image.fromarray((rng.random((h, w)) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32)[..., None] / 255.0
stub = blur * 0.45 + skin * 0.55 + detail * 0.10 + (sp - 0.5) * 0.10
out = a * (1 - wool[..., None]) + stub * wool[..., None]
sh = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))
sh.save('/workspace/gc-phase3/assets/tex/sheep3s_2k.webp', 'WEBP', quality=88, method=6)
sh.resize((512, 512), Image.Resampling.LANCZOS).save('/tmp/sheep-bases/tex/sheep3s_preview.png')
Image.fromarray(arr).resize((512, 512), Image.Resampling.LANCZOS).save('/tmp/sheep-bases/tex/sheep3_preview.png')
print('sidecars', im.size, 'mean', arr.mean(axis=(0, 1)), 'bgfrac', float(visited.mean()), 'woolfrac', float(wool.mean()))
"""])

# Swap the material image to the packed 1k for a smaller GLB
img_1k = bpy.data.images.load("/tmp/sheep-bases/tex/sheep3_baked_1k.png")
img_1k.pack()
img_1k.colorspace_settings.name = "sRGB"
tex_lo.image = img_1k

bpy.data.objects.remove(hi, do_unlink=True)

# ---------- armature ----------
obj = low
pts = world_pts(obj)
mn, mx = bounds(obj)
x0, y0, z0 = mn
x1, y1, z1 = mx
cy = 0.5 * (y0 + y1)
ylen = y1 - y0
zlen = z1 - z0

# Head: front (+Y) and upper
head_sel = [p for p in pts if p.y > y1 - 0.28 * ylen and p.z > z0 + 0.45 * zlen]
head_c = mean_pts(head_sel) if head_sel else Vector((0, y1 * 0.72, 0.72))
head_c = Vector((0.0, head_c.y, head_c.z))
# Muzzle: furthest +Y
muzzle_sel = [p for p in pts if p.y > y1 - 0.08 * ylen]
muzzle_c = mean_pts(muzzle_sel)
muzzle_c = Vector((0.0, muzzle_c.y, min(head_c.z, muzzle_c.z)))

def ear_tip(sign, fallback):
    # Drooping ears: outboard of the head, mid/low relative to the skull
    cand = [p for p in pts if p.y > head_c.y - 0.12 and p.z > 0.40 and p.x * sign > 0.08]
    if not cand:
        return fallback
    # Prefer lower-z, more outward tips (droop)
    cand = sorted(cand, key=lambda p: abs(p.x) - 0.35 * p.z + 0.15 * p.y, reverse=True)[:8]
    return mean_pts(cand)

ear_lc = ear_tip(-1, Vector((-0.16, head_c.y, head_c.z - 0.08)))
ear_rc = ear_tip(+1, Vector((0.16, head_c.y, head_c.z - 0.08)))
if abs(ear_rc.x) < abs(ear_lc.x) * 0.5:
    ear_rc = Vector((-ear_lc.x, ear_lc.y, ear_lc.z))
if abs(ear_lc.x) < abs(ear_rc.x) * 0.5:
    ear_lc = Vector((-ear_rc.x, ear_rc.y, ear_rc.z))

tail_sel = [p for p in pts if p.y < y0 + 0.10 * ylen and p.z > 0.30]
tail_c = mean_pts(tail_sel) if tail_sel else Vector((0, y0 + 0.04, 0.50))
tail_c = Vector((0.0, tail_c.y, tail_c.z))
body_c = Vector((0.0, cy, 0.52 * zlen))

# Hooves: lowest isolated patches under the four corners, not the hanging fleece
cands = sorted(
    [p for p in pts if p.z < 0.08 and abs(p.x) > 0.05 and 0.10 < abs(p.y) < 0.70],
    key=lambda p: p.z,
)
picked = []
for p in cands:
    if any((p.x - q.x) ** 2 + (p.y - q.y) ** 2 < 0.14 ** 2 for q in picked):
        continue
    col = [q for q in pts if (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < 0.05 ** 2 and 0.06 < q.z < 0.28]
    if len(col) < 5:
        continue
    picked.append(p)
    if len(picked) == 4:
        break
log("hoof candidates", [(round(p.x, 3), round(p.y, 3), round(p.z, 3)) for p in picked])
labels_map = {}
if len(picked) == 4:
    mx_ = sum(p.x for p in picked) / 4
    my_ = sum(p.y for p in picked) / 4
    for p in picked:
        k = ("F" if p.y >= my_ else "B") + ("R" if p.x >= mx_ else "L")
        labels_map[k] = p
hips, hoofs = {}, {}
for k, fb in {"FL": (-0.12, 0.32, 0.32), "FR": (0.12, 0.32, 0.32), "BL": (-0.12, -0.28, 0.32), "BR": (0.12, -0.28, 0.32)}.items():
    if k in labels_map:
        hoof_p = labels_map[k]
        hoofs[k] = Vector((hoof_p.x, hoof_p.y, min(0.02, max(0.0, hoof_p.z))))
        col = [q for q in pts if (q.x - hoof_p.x) ** 2 + (q.y - hoof_p.y) ** 2 < 0.07 ** 2 and 0.18 < q.z < 0.42]
        hip_p = mean_pts(col) if col else Vector((hoof_p.x, hoof_p.y, 0.32))
        hips[k] = Vector((hoof_p.x, hoof_p.y, max(0.24, min(0.42, hip_p.z))))
    else:
        hips[k] = Vector(fb)
        hoofs[k] = Vector((fb[0], fb[1], 0.015))
    log("leg", k, "hip", tuple(round(v, 3) for v in hips[k]), "hoof", tuple(round(v, 3) for v in hoofs[k]))

log("head", tuple(round(v, 3) for v in head_c), "muzzle", tuple(round(v, 3) for v in muzzle_c), "tail", tuple(round(v, 3) for v in tail_c))
log("ears", tuple(round(v, 3) for v in ear_lc), tuple(round(v, 3) for v in ear_rc))

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
spine0 = Vector((0, cy - 0.18 * ylen, body_c.z))
spine1 = Vector((0, cy + 0.16 * ylen, max(body_c.z, head_c.z - 0.16)))
bone("Body", "Root", spine0, spine1)
neck = Vector((0, head_c.y - 0.10, head_c.z - 0.06))
skull = Vector((0, head_c.y + 0.02, head_c.z + 0.02))
bone("Head", "Body", neck, skull)
muz_tail = Vector((0, muzzle_c.y + 0.01, muzzle_c.z))
if (muz_tail - skull).length < 0.04:
    muz_tail = skull + Vector((0, 0.10, -0.02))
bone("Muzzle", "Head", skull, muz_tail)
# Ear roots near the skull, tips droop outward/down
ear_root_l = Vector((ear_lc.x * 0.35, head_c.y, max(head_c.z - 0.02, ear_lc.z + 0.04)))
ear_root_r = Vector((ear_rc.x * 0.35, head_c.y, max(head_c.z - 0.02, ear_rc.z + 0.04)))
bone("EarL", "Head", ear_root_l, ear_lc)
bone("EarR", "Head", ear_root_r, ear_rc)
rump = Vector((0, tail_c.y + 0.06, tail_c.z))
bone("Tail", "Body", rump, tail_c)
for k in ("FL", "FR", "BL", "BR"):
    hip_p = hips[k]
    hoof_p = Vector((hoofs[k].x, hoofs[k].y, min(0.02, hoofs[k].z)))
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
    w = 2 * math.pi * (t / 1.15)
    amp = math.radians(22)
    lift = 0.025
    def leg(name, phase):
        ang = math.sin(w + phase) * amp
        up = max(0.0, math.sin(w + phase)) * lift
        arm.pose.bones["Leg" + name].rotation_euler = (ang, 0, 0)
        arm.pose.bones["Hoof" + name].rotation_euler = (-ang * 0.5, 0, 0)
        arm.pose.bones["Leg" + name].location = (0, 0, up)
    # Diagonal gait; head leads slightly
    leg("FL", 0.15)
    leg("BR", 0.15)
    leg("FR", math.pi + 0.15)
    leg("BL", math.pi + 0.15)
    bob = math.sin(w * 2) * 0.010
    arm.pose.bones["Body"].location = (0, 0, bob)
    arm.pose.bones["Body"].rotation_euler = (0, math.sin(w) * math.radians(2.5), 0)
    # Head leads the walk (nod + slight yaw ahead of the legs)
    arm.pose.bones["Head"].rotation_euler = (math.sin(w * 2 + 0.4) * math.radians(5), math.sin(w + 0.3) * math.radians(3), 0)
    arm.pose.bones["Muzzle"].rotation_euler = (math.sin(w * 2) * math.radians(1.5), 0, 0)
    arm.pose.bones["Tail"].rotation_euler = (0, 0, math.sin(w * 2) * math.radians(10))
    arm.pose.bones["EarL"].rotation_euler = (math.sin(w * 2) * math.radians(5), 0, math.sin(w) * math.radians(3))
    arm.pose.bones["EarR"].rotation_euler = (math.sin(w * 2 + 0.3) * math.radians(5), 0, math.sin(w + 0.4) * math.radians(3))

def idle_pose(f, n):
    t = (f - 1) / 24.0
    w = 2 * math.pi * (t / 2.2)
    breath = 1.0 + 0.028 * math.sin(w)
    arm.pose.bones["Body"].scale = (1.0 + 0.010 * math.sin(w), 1.0, breath)
    arm.pose.bones["Body"].location = (0, 0, 0.008 * math.sin(w))
    arm.pose.bones["Head"].rotation_euler = (math.sin(w) * math.radians(3), math.sin(w * 0.5) * math.radians(4), 0)
    arm.pose.bones["Muzzle"].rotation_euler = (math.sin(w) * math.radians(1.2), 0, 0)
    arm.pose.bones["EarL"].rotation_euler = (math.sin(w * 1.6) * math.radians(6), 0, math.sin(w) * math.radians(3))
    arm.pose.bones["EarR"].rotation_euler = (math.sin(w * 1.6 + 0.5) * math.radians(6), 0, math.sin(w + 0.3) * math.radians(3))
    arm.pose.bones["Tail"].rotation_euler = (0, 0, math.sin(w * 1.2) * math.radians(8))

action("walk", list(range(1, 29)), walk_pose)
action("idle", list(range(1, 53)), idle_pose)
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
# write a small bone report
rep = {
    "faces": len(obj.data.polygons),
    "verts": len(obj.data.vertices),
    "tris": sum(len(p.vertices) - 2 for p in obj.data.polygons),
    "vgroups": [g.name for g in obj.vertex_groups],
    "bones": [b.name for b in ad.bones],
    "actions": [a.name for a in bpy.data.actions],
    "bytes": os.path.getsize(OUT_GLB),
}
open("/tmp/sheep-bases/inspect/build_report.json", "w").write(json.dumps(rep, indent=2))
log("report", rep)
