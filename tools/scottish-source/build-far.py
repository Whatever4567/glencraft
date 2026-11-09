"""Derived distant LOD only; approved near GLBs are never re-exported or overwritten."""
import bpy,os,json,sys,math
from mathutils import Vector
R=os.path.abspath(os.path.join(os.path.dirname(__file__),'../../assets/models/scottish-base-v1'))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=R+'/scottish-base-with-jetpack.glb')
valid=set(json.load(open(R+'/rig-regions.json'))['base_region_names'])|{'gear_white_pack'}
for o in list(bpy.data.objects):
 if o.type=='MESH' and o.name not in valid:bpy.data.objects.remove(o,do_unlink=True)
mat=bpy.data.materials.new('FarScottish_VertexPalette');mat.use_nodes=True;mat.use_backface_culling=False
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.72;bs.inputs['Metallic'].default_value=0
vc=mat.node_tree.nodes.new('ShaderNodeVertexColor');vc.layer_name='FarPalette';mat.node_tree.links.new(vc.outputs['Color'],bs.inputs['Base Color'])
def color(m):
 n=m.name.lower() if m else ''
 if 'hair' in n:return (.014,.009,.006,1)
 if 'eyes' in n:return (.04,.20,.4,1)
 if 'skin' in n:return (.65,.42,.30,1)
 if 'tartan' in n:return (.018,.075,.035,1)
 if 'linen' in n:return (.855,.791,.672,1)
 if 'hose' in n:return (.791,.730,.597,1)
 if 'sporranfur' in n:return (.70,.64,.51,1)
 if 'leather' in n:return (.068,.027,.011,1)
 if 'sole' in n:return (.012,.006,.004,1)
 if 'silver' in n:return (.65,.68,.71,1)
 if 'ceramic white' in n:return (.68,.69,.66,1)
 if 'aluminium' in n:return (.43,.45,.43,1)
 if 'red' in n:return (.5,.012,.008,1)
 if 'brown' in n:return (.085,.065,.04,1)
 return (.023,.029,.030,1)
rows=[]
for o in sorted([o for o in bpy.data.objects if o.type=='MESH'],key=lambda x:x.name):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 o.data=o.data.copy();old=[slot.material for slot in o.material_slots];print('LOD input',o.name,'slots',len(old),'indices',sorted(set(p.material_index for p in o.data.polygons)),flush=True);d=o.modifiers.new('Distant surface collapse','DECIMATE');d.ratio=.07 if o.name=='visual_head_hair_eyes' or o.name=='gear_white_pack' else .12;bpy.ops.object.modifier_apply(modifier=d.name)
 palette=o.data.color_attributes.new(name='FarPalette',type='BYTE_COLOR',domain='CORNER')
 for p in o.data.polygons:
  c=color(old[p.material_index] if p.material_index<len(old) else None);
  for li in p.loop_indices:palette.data[li].color=c
 o.data.materials.clear();o.data.materials.append(mat)
 for p in o.data.polygons:p.material_index=0
 o.data.validate(verbose=True);o.data.update()
 rows.append({'region':o.name,'triangles':sum(len(p.vertices)-2 for p in o.data.polygons)})
bpy.ops.export_scene.gltf(filepath=R+'/scottish-far.glb',export_format='GLB',export_animations=False,export_skins=True,export_morph=False,export_tangents=False,export_materials='EXPORT',export_extras=True)
json.dump({'scope':'Derived cheap distant LOD, not approved near-art modification','regions':rows,'triangles':sum(r['triangles']for r in rows),'material_count':1,'image_count':0},open(R+'/far-validation.json','w'),indent=2)
print('FAR',sum(r['triangles']for r in rows),flush=True)
