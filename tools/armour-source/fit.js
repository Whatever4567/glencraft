  // Sculpted armour preview: cached finite shells, no changes to the underlying rig.
  const armourSculpt = (() => {
    const cache = new Map(), materials = new WeakMap(); let atlas;
    function texture() {
      if (atlas) return atlas;
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const g = c.getContext('2d'); g.fillStyle = '#b9c6c8'; g.fillRect(0,0,256,256);
      // Authored pixel-scale forged grain, recessed perimeter, chased chevrons and rivets.
      let seed=7183; const rnd=()=>((seed=(seed*16807)%2147483647)/2147483647);
      for(let i=0;i<1400;i++){const v=174+Math.floor(rnd()*33);g.fillStyle=`rgb(${v},${v+6},${v+7})`;g.fillRect(8+Math.floor(rnd()*240),8+Math.floor(rnd()*240),1,1);}
      g.strokeStyle='#526669'; g.lineWidth=5; g.strokeRect(5,5,246,246);
      g.strokeStyle='#e4ecec'; g.lineWidth=2; g.strokeRect(10,10,236,236);
      // Reference: Met field armour 04.3.289 (ca.1525). Tapered fluting, not pasted museum pixels.
      // The block painter also succeeds through broad directional facets before fine detail.
      for(let i=0;i<12;i++){const top=37+i*16;for(let y=28;y<180;y++){const x=Math.round(128+(top-128)*(1-(y-28)/420));
        g.fillStyle='#899da0';g.fillRect(x,y,2,1);g.fillStyle='#dce7e7';g.fillRect(x+2,y,2,1);g.fillStyle='#aebfc1';g.fillRect(x+4,y,1,1);
      }}
      g.strokeStyle='#7d9194';g.lineWidth=2;
      for(const y of [53,190]){g.beginPath();g.moveTo(30,y);g.lineTo(128,y+18);g.lineTo(226,y);g.stroke();}
      for(const x of [19,237])for(const y of [20,128,236]){g.fillStyle='#495d60';g.fillRect(x-4,y-3,8,8);g.fillStyle='#e6eeee';g.fillRect(x-2,y-3,4,3);g.fillStyle='#94a6a8';g.fillRect(x-2,y,4,3);}
      // Short directional edge nicks, not random full-surface scratches.
      g.fillStyle='#f0f5f4';for(let i=0;i<32;i++)g.fillRect(14+Math.floor(rnd()*228),10,2+Math.floor(rnd()*4),1);
      atlas=new THREE.CanvasTexture(c); atlas.colorSpace=THREE.SRGBColorSpace; atlas.magFilter=THREE.NearestFilter; return atlas;
    }
    function material(m){if(materials.has(m))return materials.get(m);const a=m.clone();a.map=texture();a.bumpMap=a.map;a.bumpScale=.0012;if(a.isMeshStandardMaterial){a.roughness=.64;a.metalness=.22;}a.userData={...a.userData,armourSculpt:1};materials.set(m,a);return a;}
    // An octagonal plate with inset bevel rings and a raised medial keel. All detail changes silhouette.
    function plate(w,h,d,keel=.012){const key=[w,h,d,keel].join(',');if(cache.has(key))return cache.get(key);
      const xy=[[-.33,-.5],[.33,-.5],[.5,-.30],[.5,.28],[.30,.5],[-.30,.5],[-.5,.28],[-.5,-.30]],p=[],uv=[],ix=[];
      for(const [scale,z] of [[1,-d/2],[1,d*.18],[.78,d/2]])for(const [x,y]of xy){p.push(x*w*scale,y*h*scale,z);uv.push(x*scale+.5,y*scale+.5);}
      p.push(0,0,d/2+keel,0,0,-d/2);uv.push(.5,.5,.5,.5);
      for(let j=0;j<8;j++){const k=(j+1)%8;for(let r=0;r<2;r++){const a=r*8+j,b=r*8+k;ix.push(a,b,b+8,a,b+8,a+8);}ix.push(16+j,16+k,24,k,j,25);}
      // Four shallow pyramidal rivet heads share this plate buffer: no extra meshes/draw calls.
      for(const x of [-.27,.27])for(const y of [-.26,.26]){const a=p.length/3,r=Math.min(w,h)*.024,z=d/2+keel*.4+.002;
        p.push(x*w-r,y*h-r,z,x*w+r,y*h-r,z,x*w+r,y*h+r,z,x*w-r,y*h+r,z,x*w,y*h,z+.003);
        uv.push(.073,.077,.086,.077,.086,.087,.073,.087,.079,.078);for(let j=0;j<4;j++)ix.push(a+j,a+(j+1)%4,a+4);
      }
      const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(p,3));ge.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));ge.setIndex(ix);ge.computeVertexNormals();cache.set(key,ge);return ge;
    }
    // Fitted continuous cuirass: narrow waist, broad upper ribs, sloping collar (not a larger cuboid).
    function cuirass(){const key='cuirass';if(cache.has(key))return cache.get(key);const rings=[[.91,.245,.159],[.96,.263,.180],[1.13,.296,.205],[1.34,.302,.194],[1.43,.247,.165]],p=[],uv=[],ix=[],n=12;
      for(let r=0;r<rings.length;r++){const[y,w,d]=rings[r];for(let j=0;j<n;j++){const a=j/n*Math.PI*2;p.push(Math.sin(a)*w,y,Math.cos(a)*d*(Math.cos(a)<0?.8:1));uv.push(j/n,r/(rings.length-1));}}
      for(let r=0;r<rings.length-1;r++)for(let j=0;j<n;j++){const a=r*n+j,b=r*n+(j+1)%n;ix.push(a,b,b+n,a,b+n,a+n);}
      const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(p,3));ge.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));ge.setIndex(ix);ge.computeVertexNormals();cache.set(key,ge);return ge;
    }
    function crown(){const key='crown';if(cache.has(key))return cache.get(key);const rings=[[.38,.249,.235],[.46,.255,.244],[.535,.212,.211],[.585,.13,.135],[.609,.012,.014]],p=[],uv=[],ix=[],n=12;
      for(let r=0;r<rings.length;r++){const[y,w,d]=rings[r];for(let j=0;j<n;j++){const a=j/n*Math.PI*2;p.push(Math.sin(a)*w,y,Math.cos(a)*d-.025);uv.push(j/n,r/4);}}
      for(let r=0;r<4;r++)for(let j=0;j<n;j++){const a=r*n+j,b=r*n+(j+1)%n;ix.push(a,b,b+n,a,b+n,a+n);}const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(p,3));ge.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));ge.setIndex(ix);ge.computeVertexNormals();cache.set(key,ge);return ge;}
    return {plate,cuirass,crown,material,cache};
  })();
  try { const fp0=fitPiece; fitPiece=function(add,u,slot,m){if(!u.hd)return fp0.apply(this,arguments);
    const mat=armourSculpt.material(m), P=(par,w,h,d,x,y,z,rot=0,keel=.012)=>{const o=new THREE.Mesh(armourSculpt.plate(w,h,d,keel),mat);o.position.set(x,y,z);o.rotation.y=rot;o.castShadow=true;o.userData.armourSculpt=1;par.add(o);u.armourParts.push(o);return o;};
    if(slot===0){
      // Crown retains an open face; narrow separate cheek plates replace the temple slabs.
      const cap=new THREE.Mesh(armourSculpt.crown(),mat);cap.castShadow=true;cap.userData.armourSculpt=1;u.head.add(cap);u.armourParts.push(cap);
      P(u.head,.46,.065,.075,0,.395,.246,0,.006);
      for(const s of [-1,1]){P(u.head,.12,.245,.065,s*.225,.265,.12,s*.55,.005);P(u.head,.16,.24,.06,s*.218,.31,-.12,s*1.32,.005);}
      P(u.head,.39,.26,.065,0,.30,-.24,Math.PI,.005);
    }
    if(slot===1){const o=new THREE.Mesh(armourSculpt.cuirass(),mat);o.castShadow=true;o.userData.armourSculpt=1;u.torso.add(o);u.armourParts.push(o);
      for(const s of [-1,1]){P(u.torso,.265,.30,.055,s*.137,1.265,.190,s*.18,.024);P(u.torso,.21,.35,.045,s*.12,1.22,-.155,Math.PI-s*.10,.012);}
      for(let i=0;i<2;i++)P(u.torso,.48-i*.025,.075,.045,0,.965+i*.073,.174,0,.005);
      u.arms.forEach((a,i)=>{const s=i?1:-1;P(a,.255,.19,.235,0,-.015,0,0,.018);P(a,.21,.13,.215,0,-.125,0,0,.012);if(a.userData.el){P(a.userData.el,.175,.14,.07,0,-.018,.085,0,.020);P(a.userData.el,.17,.19,.18,0,-.16,0,0,.009);}});
    }
    if(slot===2){
      // Split tassets follow each thigh; no rigid bell skirt bridges the stride.
      P(u.torso,.49,.115,.34,0,.875,0,0,.004);
      u.legs.forEach(l=>{P(l,.235,.33,.065,0,.065,.108,0,.018);for(const s of [-1,1])P(l,.12,.30,.06,s*.105,.065,0,s*1.25,.006);P(l,.21,.30,.055,0,.065,-.105,Math.PI,.005);});
    }
    if(slot===3)u.legs.forEach(l=>{const k=l.userData.kn||l;P(k,.205,.15,.08,0,-.018,.112,0,.027);P(k,.20,.235,.15,0,-.20,.035,0,.025);P(k,.22,.115,.295,0,-.365,.06,0,.012);});
  }; }catch(e){ERR('armour-sculpt',e);}
  // The existing jetpack is cloned from its cached template; adjust only worn strap transforms.
  function fitArmourHarness(u){if(!u||!u.armourParts.some(p=>p.userData.armourSculpt))return;
    const pack=u.armourParts.find(p=>p.name==='jetpack1222');if(!pack||pack.userData.armourHarness)return;
    for(const p of pack.children){const q=p.geometry&&p.geometry.parameters;if(!q)continue;
      if(q.width===.06&&q.height===.36){p.position.z+=.115;}
      if(q.width===.06&&q.height===.025){p.scale.z=1.65;p.position.z+=.055;}
      if(q.width===.34&&q.height===.04||q.width===.05&&q.height===.05)p.position.z+=.115;
    }pack.userData.armourHarness=1;
  }
  U.fitArmourHarness=fitArmourHarness;
  try{const prior=dressModel;dressModel=function(model){const r=prior.apply(this,arguments);fitArmourHarness(model&&model.userData);return r;};}catch(e){ERR('armour-harness',e);}
