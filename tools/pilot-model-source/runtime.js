/* Approved frozen pilot v1: native skin adapter for embedded Three r128.
 * Retains gameplay controls, not their old visual geometry. No authoring/export at runtime. */
(function (W) {
  'use strict';
  function create(T, options) {
    const O = options || {}, V = () => new T.Vector3(), Q = () => new T.Quaternion();
    const instances = new Set(), down = new T.Vector3(0,-1,0), up = new T.Vector3(0,1,0);
    const names = ['visual_head_hair_eyes','visual_arm_slot0_hand','visual_arm_slot1_hand','visual_torso_outfit','visual_leg_slot0','visual_leg_slot1','gear_helmet','gear_chest_harness','gear_chest_slot0','gear_chest_slot1','gear_legs_slot0','gear_legs_slot1','gear_boots_slot0','gear_boots_slot1','gear_white_pack'];
    const gearSlots = {gear_helmet:0,gear_chest_harness:1,gear_chest_slot0:1,gear_chest_slot1:1,gear_legs_slot0:2,gear_legs_slot1:2,gear_boots_slot0:3,gear_boots_slot1:3,gear_white_pack:4};
    const find = (r,n) => r.getObjectByName(n) || r.getObjectByName(T.PropertyBinding.sanitizeNodeName(n)) || r.getObjectByName(n+'_LOD1');
    const state = {error:null,loaded:false,instances,asset:'pilot-v1',revision:T.REVISION};
    let promise;
    function validate(g) {
      const r = g.scene || g; r.updateMatrixWorld(true);
      for (const n of names) if (!find(r,n)) throw Error('Pilot region missing: '+n);
      for (const n of ['upper_arm.L','forearm.L','hand.L','hand.R','head','thigh.L','shin.R','weapon_grip_slot1','nozzle_mouth_slot0']) if (!find(r,n)) throw Error('Pilot rig missing: '+n);
      let skins=0; r.traverse(o=>{if(o.isSkinnedMesh){skins++; if(o.skeleton.bones.length!==40) throw Error('Pilot skeleton mismatch'); if(!o.material.skinning) throw Error('Skin shader disabled');}});
      if(!skins) throw Error('Pilot is not skinned'); return r;
    }
    state.ready = function () {
      if (!promise) promise = Promise.resolve().then(()=>O.ensureLibrary&&O.ensureLibrary()).then(()=>Promise.all([O.load('pilot.glb'),O.load('pilot-far.glb')])).then(a=>{const p=a.map(validate);state.templates=p;state.loaded=true;return p;}).catch(e=>{state.error=String(e&&e.message||e);throw e;});
      return promise;
    };
    function rig(template) {
      const root = T.SkeletonUtils.clone(template), bones = {}, rest = {}, regions = {}, mats = new Map();
      root.updateMatrixWorld(true);
      root.traverse(o=>{
        o.matrixAutoUpdate=true;
        if(o.isBone){bones[o.name]=o;rest[o.name]={q:o.quaternion.clone(),p:o.position.clone(),s:o.scale.clone(),w:o.getWorldQuaternion(Q()),pos:o.getWorldPosition(V())};}
        if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
          const cloneMat=m=>{if(!mats.has(m)){const c=m.clone();c.userData.pilotOriginalColor=c.color.clone();mats.set(m,c);}return mats.get(m);};
          o.material=Array.isArray(o.material)?o.material.map(cloneMat):cloneMat(o.material);
        }
      });
      for(const n of names){const o=find(root,n);regions[n]={o,parent:o.parent};}
      const bone=n=>bones[T.PropertyBinding.sanitizeNodeName(n)];
      return {root,bones,rest,regions,mats,bone};
    }
    function native(r,n){return r.rest[r.bone(n).name];}
    function restore(r){for(const n in r.bones){const b=r.bones[n],s=r.rest[n];b.position.copy(s.p);b.quaternion.copy(s.q);b.scale.copy(s.s);}}
    function worldRotation(b,q){b.parent.updateWorldMatrix(true,false);b.quaternion.copy(b.parent.getWorldQuaternion(Q()).invert().multiply(q));b.updateMatrix();b.updateWorldMatrix(false,true);}
    function descendant(o,p){for(;o;o=o.parent)if(o===p)return true;return false;}
    function clearOld(model) {
      const p=model.userData.pilot, remove=[];
      model.traverse(o=>{if(o.isMesh&&!descendant(o,p.container)&&!o.userData.jetFlame)remove.push(o);});
      for(const o of remove)if(o.parent)o.parent.remove(o);
      // The old distance/blink pass must never reinsert procedural geometry.
      model.userData.lod=[];
    }
    state.attach = function (model) {
      if(model.userData.pilotPending)return model.userData.pilotPending;
      model.userData.pilotPending=state.ready().then(templates=>{
        if(model.userData.pilot)return model;
        const near=rig(templates[0]),far=rig(templates[1]),container=new T.Group();container.name='ApprovedPilotV1';
        const p={near,far,container,gear:[],flames:[],equipment:[0,0,0,0,0],farActive:false};
        container.add(near.root,far.root);far.root.visible=false;
        // Transactional replacement: any adapter error restores the complete prior graph.
        const saved=[],oldLOD=model.userData.lod,oldParts=model.userData.armourParts;
        model.traverse(o=>{if(o!==model)saved.push({o,parent:o.parent,p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()});});
        try {
        model.userData.pilot=p;model.add(container);
        for(const r of [near,far])for(const n in gearSlots)p.gear.push(r.regions[n]);
        const u=model.userData;
        // Control pivots remain -Y oriented. Mesh bones keep their native rests/roll.
        for(let slot=0;slot<2;slot++){
          const side=slot?'L':'R',a=u.arms[slot],el=a.userData.el;
          a.position.copy(native(near,'upper_arm.'+side).pos);
          const l1=native(near,'forearm.'+side).pos.distanceTo(a.position),l2=native(near,'hand.'+side).pos.distanceTo(native(near,'forearm.'+side).pos);
          a.userData.pilot={length1:l1,length2:l2};
          if(el)el.position.set(0,-l1,0);
          if(a.userData.grip)a.userData.grip.position.set(0,-l2,0);
          const leg=u.legs[slot];leg.position.copy(native(near,'thigh.'+side).pos);if(leg.userData.kn)leg.userData.kn.position.set(0,-native(near,'shin.'+side).pos.distanceTo(leg.position),0);
        }
        clearOld(model);state.dressed(model);state.sync(model);instances.add(model);return model;
        } catch(error) {
          model.remove(container);delete model.userData.pilot;
          for(const item of saved){if(item.o.parent!==item.parent)item.parent.add(item.o);item.o.position.copy(item.p);item.o.quaternion.copy(item.q);item.o.scale.copy(item.s);}
          model.userData.lod=oldLOD;model.userData.armourParts=oldParts;
          for(const arm of model.userData.arms){delete arm.userData.pilot;delete arm.userData.pilotTarget;}
          throw error;
        }
      }).catch(e=>{state.error=String(e&&e.message||e);if(O.warn)O.warn(e);return model;});
      return model.userData.pilotPending;
    };
    state.dressed = function (model) {
      const u=model.userData,p=u.pilot;if(!p)return;
      // Existing jetpack code owns these flame meshes and their fuel/sound lifecycle.
      p.flames=(u.armourParts||[]).filter(o=>o.userData.jetFlame);
      for(const o of (u.armourParts||[]))if(!o.userData.jetFlame&&o.parent)o.parent.remove(o);
      for(const r of p.gear)if(r.o.parent!==r.parent)r.parent.add(r.o);
      clearOld(model);
      u.armourParts=[...p.flames,...p.gear.map(r=>r.o)];
      p.equipment=Array.from(O.equipment?O.equipment():[0,0,0,0,0]);
      for(const r of [p.near,p.far]){
        // Per-slot tier variants share the authored material until a different tier is equipped.
        if(!r.tintVariants)r.tintVariants=new Map();
        for(const n in gearSlots){const region=r.regions[n].o,slot=gearSlots[n],tier=O.tier?O.tier(p.equipment[slot]):null;
          region.traverse(o=>{if(!o.isMesh)return;const original=Array.from(r.mats.values()).find(m=>m.name==='ArmorTintable'||m.name==='Far_ArmorTintable');
            if(!original||!(o.material.name==='ArmorTintable'||o.material.name==='Far_ArmorTintable'))return;
            if(!tier||tier==='diamond'){o.material=original;return;}
            if(!r.tintVariants.has(tier)){const m=original.clone(),hex={copper:0xc8703f,iron:0xd4d8dc,gold:0xf2c440}[tier];if(hex!==undefined)m.color.setHex(hex).convertSRGBToLinear();r.tintVariants.set(tier,m);}o.material=r.tintVariants.get(tier);
          });
        }
        for(const material of r.mats.values())if(material.name==='PackWhite'){material.color.copy(material.userData.pilotOriginalColor);if(p.equipment[4]===777)material.color.setHex(0xf2c440).convertSRGBToLinear();}
      }
      // Far pack shares a palette material, so recolour just neutral casing vertices in a private geometry.
      const region=p.far.regions.gear_white_pack.o;
      region.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.color)return;if(!o.userData.pilotOriginalGeometry)o.userData.pilotOriginalGeometry=o.geometry;
        if(p.equipment[4]!==777){o.geometry=o.userData.pilotOriginalGeometry;return;}
        if(!o.userData.pilotGoldGeometry){const g=o.geometry.clone(),c=g.attributes.color,tint=new T.Color(0xf2c440).convertSRGBToLinear();for(let i=0;i<c.count;i++){const a=c.getX(i),b=c.getY(i),d=c.getZ(i);if(a>.2&&Math.abs(a-b)<.09&&Math.abs(b-d)<.09)c.setXYZ(i,a*tint.r,b*tint.g,d*tint.b);}o.userData.pilotGoldGeometry=g;}o.geometry=o.userData.pilotGoldGeometry;});
      state.sync(model);
    };
    function ik(model,r,slot,target,rootQ){
      const side=slot?'L':'R',upper=r.bone('upper_arm.'+side),fore=r.bone('forearm.'+side),hand=r.bone('hand.'+side),socket=find(r.root,'weapon_grip_slot'+slot);
      const a=model.userData.arms[slot],l1=a.userData.pilot.length1,l2=a.userData.pilot.length2;
      const start=upper.getWorldPosition(V()),wrist=target.position.clone(),pole=target.side.clone().multiplyScalar(.8).add(new T.Vector3(0,-1,0)).addScaledVector(target.forward,-.3);
      let clamped=false;
      function aim(b,n,direction){const restWorld=rootQ.clone().multiply(native(r,n).w),restDir=up.clone().applyQuaternion(restWorld);worldRotation(b,Q().setFromUnitVectors(restDir,direction.clone().normalize()).multiply(restWorld));}
      for(let pass=0;pass<5;pass++){
        const delta=wrist.clone().sub(start),distance=delta.length(),L=Math.max(.005,Math.min(distance,l1+l2-.002));clamped=clamped||distance>l1+l2-.002;const dir=delta.normalize();
        const ca=Math.max(-1,Math.min(1,(l1*l1+L*L-l2*l2)/(2*l1*L))),perp=pole.clone().addScaledVector(dir,-pole.dot(dir)).normalize();
        const elbow=start.clone().addScaledVector(dir,l1*ca).addScaledVector(perp,l1*Math.sqrt(1-ca*ca));
        aim(upper,'upper_arm.'+side,elbow.clone().sub(start));
        const actualElbow=fore.getWorldPosition(V());
        aim(fore,'forearm.'+side,start.clone().addScaledVector(dir,L).sub(actualElbow));
        hand.updateWorldMatrix(true,true);
        wrist.add(target.position.clone().sub(socket.getWorldPosition(V())));
      }
      const error=socket.getWorldPosition(V()).distanceTo(target.position);a.userData.pilotGripError=error;a.userData.pilotClamped=clamped;
    }
    function pose(model,r){
      const u=model.userData,rootQ=model.getWorldQuaternion(Q());restore(r);model.updateMatrixWorld(true);
      const torso=u.torso.quaternion.clone();
      // Apply model-space control deltas, corrected by each native bone rest basis.
      const rotate=(name,delta)=>worldRotation(r.bone(name),rootQ.clone().multiply(delta).multiply(native(r,name).w));
      rotate('spine.001',torso);
      rotate('head',torso.clone().multiply(u.head.quaternion));
      for(let slot=0;slot<2;slot++){
        const side=slot?'L':'R',a=u.arms[slot],el=a.userData.el,leg=u.legs[slot],knee=leg.userData.kn;
        if(a.userData.pilotTarget)ik(model,r,slot,a.userData.pilotTarget,rootQ);
        else {const armDelta=torso.clone().multiply(a.quaternion);rotate('upper_arm.'+side,armDelta);rotate('forearm.'+side,armDelta.multiply(el?el.quaternion:Q()));}
        rotate('thigh.'+side,leg.quaternion);rotate('shin.'+side,leg.quaternion.clone().multiply(knee?knee.quaternion:Q()));
        const hn=el&&el.children.find(c=>c.userData.hand),fg=hn&&hn.userData.fg;
        // Legacy fg order is little/ring/middle/index. The thumb has its own native controls.
        for(let digit=0;digit<4;digit++)for(let part=1;part<=2;part++){
          const b=r.bone('finger.'+side+'.'+digit+'.0'+part);if(!b)continue;
          const angle=fg&&fg[3-digit]?fg[3-digit].rotation.x:0;
          b.quaternion.copy(r.rest[b.name].q).multiply(Q().setFromAxisAngle(new T.Vector3(1,0,0),Math.max(0,angle-.35)*(part===1?.58:.42)));
        }
        for(let part=1;part<=2;part++){const b=r.bone('thumb.'+side+'.0'+part);const angle=a.userData.pilotTarget ? .20 : 0;b.quaternion.copy(r.rest[b.name].q).multiply(Q().setFromAxisAngle(new T.Vector3(1,0,0),angle));}
      }
      model.updateMatrixWorld(true);
    }
    function visibility(model,r){
      const u=model.userData,p=u.pilot;
      for(const n of names){let visible=true;const slot=gearSlots[n];if(slot!==undefined)visible=slot===4?(p.equipment[4]===291||p.equipment[4]===777):!!p.equipment[slot];
        if((n==='visual_head_hair_eyes'||n==='gear_helmet')&&!u.head.visible)visible=false;
        for(let a=0;a<2;a++)if((n==='visual_arm_slot'+a+'_hand'||n==='gear_chest_slot'+a)&&!u.arms[a].visible)visible=false;
        r.regions[n].o.visible=visible;
      }
    }
    state.sync=function(model){
      const u=model.userData,p=u.pilot;if(!p)return;
      pose(model,p.near);
      // Exact same native rest rig in both frozen exports; copy local poses, not geometry indices.
      for(const n in p.far.bones){const a=p.near.bones[n],b=p.far.bones[n];if(a){b.position.copy(a.position);b.quaternion.copy(a.quaternion);b.scale.copy(a.scale);}}
      const far=O.distance?O.distance(model)>16:false;p.farActive=far;p.near.root.visible=!far;p.far.root.visible=far;
      visibility(model,p.near);visibility(model,p.far);model.updateMatrixWorld(true);
      for(let slot=0;slot<2;slot++){
        const grip=u.arms[slot].userData.grip,socket=find(p.near.root,'weapon_grip_slot'+slot);
        if(grip&&grip.parent){grip.parent.updateWorldMatrix(true,false);grip.position.copy(grip.parent.worldToLocal(socket.getWorldPosition(V())));}
      }
      for(let i=0;i<p.flames.length;i++){
        const f=p.flames[i],nozzle=find(p.near.root,'nozzle_mouth_slot'+(i%2));if(!f.parent)continue;
        const point=nozzle.getWorldPosition(V()).add(new T.Vector3(0,-.35,0));f.position.copy(f.parent.worldToLocal(point));
      }
      model.updateMatrixWorld(true);
    };
    state.syncAll=function(){for(const m of instances){if(m.parent)state.sync(m);}};
    state.nozzleWorld=function(model,slot){const p=model&&model.userData.pilot;return p?find(p.near.root,'nozzle_mouth_slot'+slot).getWorldPosition(V()):null;};
    state.stats=function(model){const p=model.userData.pilot;const count=r=>{let triangles=0,draws=0;const materials=new Set();r.root.traverse(o=>{if(!o.isMesh)return;for(let a=o;a&&a!==r.root.parent;a=a.parent)if(!a.visible)return;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;draws++;materials.add(o.material);});return{triangles,draws,materials:materials.size};};return{near:count(p.near),far:count(p.far),farActive:p.farActive};};
    return state;
  }
  W.PilotRuntimeFactory=create;
})(window);
