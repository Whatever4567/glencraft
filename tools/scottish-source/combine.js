/* SCOTTISH_BASE_1236: approved base; optional genuine armour is separate from pack. */
(function(W){
 W.__mergeScottish1236=function(T,base,old,far){
  const scene=base.scene,find=(r,n)=>r.getObjectByName(n)||r.getObjectByName(T.PropertyBinding.sanitizeNodeName(n))||r.getObjectByName(n+'_LOD1');
  scene.updateMatrixWorld(true);old.scene.updateMatrixWorld(true);
  const targetBones={};scene.traverse(o=>{if(o.isBone)targetBones[o.name]=o;});
  // Transfer only actual optional armour regions, never the old flight suit/head.
  const pieces=['gear_helmet','gear_chest_harness','gear_chest_slot0','gear_chest_slot1','gear_legs_slot0','gear_legs_slot1','gear_boots_slot0','gear_boots_slot1'];
  const copy=(sourceName,name)=>{
   const source=find(old.scene,sourceName);if(!source)throw Error('Optional armour region missing: '+sourceName);
   const copy=source.clone(true);copy.name=name;scene.add(copy);
   copy.traverse(o=>{if(!o.isSkinnedMesh)return;const bones=o.skeleton.bones.map(b=>{if(!targetBones[b.name])throw Error('Scottish armour bone missing '+b.name);return targetBones[b.name];});
    o.bind(new T.Skeleton(bones,o.skeleton.boneInverses.map(m=>m.clone())),o.bindMatrix.clone());
   });return copy;
  };
  for(const name of pieces)copy(name,name);
  // Leg armour has its own trousers; removing it restores Scottish hose/kilt, not a flight suit.
  for(let slot=0;slot<2;slot++)copy('visual_leg_slot'+slot,'armoured_leg_slot'+slot);
  // Standard under-clothing occlusion: remove only leg triangles entirely covered by
  // the kilt at bind pose. Keep original vertex/normal/UV arrays, exposed knees/hose
  // and the untouched approved files. This prevents thigh poke-through in stride.
  let occludedTriangles=0;
  for(let slot=0;slot<2;slot++)find(scene,'visual_leg_slot'+slot).traverse(o=>{
   if(!o.isSkinnedMesh)return;const ge=o.geometry.clone(),pa=ge.attributes.position,ix=ge.index,ys=[],keep=[];o.updateWorldMatrix(true,false);o.skeleton.update();
   for(let i=0;i<pa.count;i++){const v=new T.Vector3().fromBufferAttribute(pa,i);o.boneTransform(i,v);ys.push(v.applyMatrix4(o.matrixWorld).y);}
   const count=ix?ix.count:pa.count;for(let i=0;i<count;i+=3){const ids=[0,1,2].map(j=>ix?ix.getX(i+j):i+j);if(ids.reduce((a,j)=>a+ys[j],0)/3>.63)occludedTriangles++;else keep.push(...ids);}
   ge.setIndex(keep);o.geometry=ge;
  });
  // Cloth corrective: fixed waistband, soft hem following the two native thighs.
  // Rest vertex positions/UVs/normals remain identical to the approved GLB.
  const kilt=find(scene,'visual_kilt_clothing');let corrected=0;
  kilt.traverse(o=>{if(!o.isSkinnedMesh)return;o.updateWorldMatrix(true,false);o.skeleton.update();const ge=o.geometry.clone(),pa=ge.attributes.position,indices=new Uint16Array(pa.count*4),weights=new Float32Array(pa.count*4),names=o.skeleton.bones.map(b=>b.name),pelvis=names.indexOf('pelvis'),left=names.indexOf('thighL'),right=names.indexOf('thighR');if(Math.min(pelvis,left,right)<0)throw Error('Kilt corrective bones missing');
   const p=new T.Vector3();for(let i=0;i<pa.count;i++){p.fromBufferAttribute(pa,i);o.boneTransform(i,p);p.applyMatrix4(o.matrixWorld);const t=Math.max(0,Math.min(1,(.90-p.y)/.28)),w=.35*t*t*(3-2*t),blend=Math.max(0,Math.min(1,(p.x+.12)/.24)),s=blend*blend*(3-2*blend);indices.set([pelvis,left,right,0],i*4);weights.set([1-w,w*s,w*(1-s),0],i*4);if(w>0)corrected++;}
   ge.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));ge.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));o.geometry=ge;
  });
  scene.userData.scottish1236={far:!!far,occludedTriangles,kiltCorrectedVertices:corrected,base:'approved-scottish-v1',packOnly:true};
  return base;
 };
})(window);
