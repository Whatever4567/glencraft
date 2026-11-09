    // v1.2.37: procedural secondary motion + face life for the refined Scottish base.
    // The legacy controls only drive torso/head/arms/legs/fingers; the native pelvis, spine.002, neck,
    // clavicles, wrists and feet were left at rest (the "stiff" look). Eyelids use the GLB 'blink' morph
    // (real lid deformation), eyes use look_* morphs. Deterministic when O.now is supplied (tests).
    const NOW=()=>O.now?O.now():performance.now()/1000;
    function addWorld(r,rootQ,name,x,y,z){const b=r.bone(name);if(!b||(!x&&!y&&!z))return;const cur=b.getWorldQuaternion(Q());worldRotation(b,rootQ.clone().multiply(Q().setFromEuler(new T.Euler(x,y,z,'YXZ'))).multiply(rootQ.clone().invert()).multiply(cur));}
    function lifeState(model){const u=model.userData;if(!u.pilotLife){const seed=Math.random();u.pilotLife={seed,phase:seed*20,nextBlink:NOW()+1+seed*2,blinkAt:-9,second:false,look:[0,0],target:[0,0],nextLook:NOW()+.8,last:NOW(),blinks:0};}return u.pilotLife;}
    function gait(u){
      const l0=u.legs[0].rotation.x,l1=u.legs[1].rotation.x,k0=u.legs[0].userData.kn?u.legs[0].userData.kn.rotation.x:0,k1=u.legs[1].userData.kn?u.legs[1].userData.kn.rotation.x:0;
      const s=(l0-l1)/2,amp=Math.min(1,Math.abs(s)/.45+Math.abs(k0-k1)*.5);return{s,amp,l:[l0,l1],k:[k0,k1],a:[u.arms[0].rotation.x,u.arms[1].rotation.x]};
    }
    function secondaryBody(model,r,rootQ){
      const u=model.userData,L=lifeState(model),t=NOW()-0+L.phase,g=gait(u),idle=1-Math.min(1,g.amp*1.5);
      const breath=Math.sin(t*1.55)*.018,shift=Math.sin(t*.37)*.025*idle;
      // hips rotate toward the forward leg and drop on the swing side; shoulders counter-rotate
      addWorld(r,rootQ,'pelvis',0,-g.s*.42,(g.k[0]-g.k[1])*.07+shift);
      L.pre={g,breath,idle,t};
    }
    function secondaryUpper(model,r,rootQ){
      const L=model.userData.pilotLife,g=L.pre.g;
      addWorld(r,rootQ,'spine.002',L.pre.breath*.8,g.s*.30,-(g.k[0]-g.k[1])*.04);
      addWorld(r,rootQ,'neck',-L.pre.breath*.4,-g.s*.18,0);
    }
    function secondaryShoulders(model,r,rootQ){
      const u=model.userData,L=u.pilotLife,g=L.pre.g;
      for(let slot=0;slot<2;slot++){const side=slot?'L':'R',sg=slot?1:-1;if(u.arms[slot].userData.pilotTarget)continue;
        addWorld(r,rootQ,'clavicle.'+side,-g.a[slot]*.10,g.a[slot]*.08*sg,L.pre.breath*.25*sg);}
    }
    function secondaryLimbs(model,r,rootQ){
      const u=model.userData,L=u.pilotLife,g=L.pre.g;
      for(let slot=0;slot<2;slot++){const side=slot?'L':'R';
        if(!u.arms[slot].userData.pilotTarget)addWorld(r,rootQ,'hand.'+side,.12+g.a[slot]*.22,0,0);
        // keep soles closer to level through the stride and roll off the toe on push-off
        const pitch=Math.max(-.55,Math.min(.55,-(g.l[slot])*.55-g.k[slot]*.35));addWorld(r,rootQ,'foot.'+side,pitch,0,0);
      }
    }
    function faceLife(model,r){
      const L=lifeState(model),now=NOW(),dt=Math.max(0,Math.min(.1,now-L.last));L.last=now;
      if(now>=L.nextBlink){L.blinkAt=now;L.blinks++;const dbl=!L.second&&((L.blinks*7919+Math.floor(L.seed*97))%5===0);L.second=dbl;L.nextBlink=now+(dbl?.28:2.2+((L.blinks*2654435761)%1000)/1000*3.6);if(!dbl)L.second=false;}
      const e=now-L.blinkAt,blink=e<0?0:e<.075?e/.075:e<.11?1:e<.24?1-(e-.11)/.13:0;
      if(now>=L.nextLook){const h=(L.blinks+1)*1013+Math.floor(now*7);L.target=[((h%997)/997-.5)*.9,((h%631)/631-.5)*.5];L.nextLook=now+.7+((h%577)/577)*2.4;}
      for(let i=0;i<2;i++)L.look[i]+=(L.target[i]-L.look[i])*Math.min(1,dt*18);
      L.blink=blink;
      if(!r.faceMeshes){r.faceMeshes=[];const head=r.regions.visual_head_hair_eyes&&r.regions.visual_head_hair_eyes.o;if(head)head.traverse(o=>{if(o.isMesh&&o.morphTargetDictionary&&o.morphTargetDictionary.blink!==undefined)r.faceMeshes.push(o);});}
      for(const o of r.faceMeshes){const d=o.morphTargetDictionary,m=o.morphTargetInfluences,lx=L.look[0],ly=L.look[1];
        m[d.blink]=Math.max(blink,.0);
        if(d.look_left!==undefined){m[d.look_left]=Math.max(0,lx);m[d.look_right]=Math.max(0,-lx);m[d.look_up]=Math.max(0,ly)*(1-blink);m[d.look_down]=Math.max(0,-ly)+blink*.15;}
      }
    }
    // v1.2.37 jetpack harness fit: the pack + straps carry an 'armour_fit' morph that moves them over the crystal cuirass.
    // crystal helm follows the skull: while the helmet region is shown, the hair is pulled onto the skull ('helm_hair' morph)
    function helmFit(model,r){
      if(!r||!r.regions)return;const hd=r.regions.visual_head_hair_eyes;if(!hd||!hd.o)return;
      if(!r.helmMeshes){r.helmMeshes=[];hd.o.traverse(o=>{if(o.isMesh&&o.morphTargetDictionary&&o.morphTargetDictionary.helm_hair!==undefined)r.helmMeshes.push(o);});}
      const g=r.regions.gear_helmet,k=g&&g.o&&g.o.visible?1:0;
      for(const o of r.helmMeshes)o.morphTargetInfluences[o.morphTargetDictionary.helm_hair]=k;
    }
    function packFit(model,r){
      if(!r||!r.regions)return;const pk=r.regions.gear_white_pack;if(!pk||!pk.o)return;
      if(!r.packMeshes){r.packMeshes=[];pk.o.traverse(o=>{if(o.isMesh&&o.morphTargetDictionary&&o.morphTargetDictionary.armour_fit!==undefined)r.packMeshes.push(o);});}
      const vis=n=>{const g=r.regions[n];return !!(g&&g.o&&g.o.visible);};
      const k=(vis('gear_chest_harness')||vis('gear_chest_slot0')||vis('gear_chest_slot1'))?1:0;
      for(const o of r.packMeshes)o.morphTargetInfluences[o.morphTargetDictionary.armour_fit]=k;
    }
