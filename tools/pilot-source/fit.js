  // Reference-led teal pilot preview. Underlying character identity and all gameplay remain unchanged.
  const AR = (()=>{
    const geometry=new Map(),materials=new WeakMap();let tx;
    function atlas(){if(tx)return tx;const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
      const grad=g.createLinearGradient(0,0,256,256);grad.addColorStop(0,'#d7e6e6');grad.addColorStop(.45,'#bad0d1');grad.addColorStop(1,'#a1bdc0');g.fillStyle=grad;g.fillRect(0,0,256,256);
      // Painted panel hierarchy from the reference: large calm surfaces, curved seams, a few attachment details.
      const line=(pts,col,width=1)=>{g.strokeStyle=col;g.lineWidth=width;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
      for(const [o,col]of [[0,'#769a9f'],[2,'#e2eeee']]){line([[18+o,18],[238+o,18]],col);line([[18+o,238],[238+o,238]],col);line([[38+o,42],[65+o,72],[70+o,193]],col);line([[218+o,42],[191+o,72],[186+o,193]],col);}
      line([[90,96],[166,96]],'#97b3b7');line([[90,98],[166,98]],'#d8e7e7');
      g.fillStyle='#91afb2';for(const x of [80,176]){g.fillRect(x,110,3,6);g.fillStyle='#d9e7e7';g.fillRect(x,110,2,1);g.fillStyle='#91afb2';}
      // Fine woven/painted finish is deliberately subordinate, never dense scratches or grooves.
      g.fillStyle='rgba(255,255,255,.035)';for(let y=25;y<231;y+=3)g.fillRect(20,y,216,1);
      tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.magFilter=THREE.NearestFilter;return tx;
    }
    function material(m){if(materials.has(m))return materials.get(m);const a=m.clone();a.map=atlas();if(a.isMeshStandardMaterial){a.roughness=.34;a.metalness=.32;}a.userData={...a.userData,armourPilot:1};materials.set(m,a);return a;}
    // Each cross section is designed around the body, never an extruded rounded rectangle.
    function shell(key,rings,opts={}){if(geometry.has(key))return geometry.get(key);if(rings[0][0]>rings[rings.length-1][0])rings=[...rings].reverse();const n=opts.n||16,p=[],uv=[],ix=[];
      for(let r=0;r<rings.length;r++){const [y,w,d,z0=0]=rings[r];for(let j=0;j<=n;j++){const a=(j/n-.5)*Math.PI*2,s=Math.sin(a),c=Math.cos(a);let Y=y,Z=z0+c*d,X=s*w;
        if(opts.chest){Z+=Math.pow(Math.max(0,c),6)*.025*Math.sin(r/(rings.length-1)*Math.PI);if(r===rings.length-1)Y-=.06*Math.pow(Math.abs(s),1.5)+.045*Math.pow(Math.max(0,c),4);}
        if(opts.collar)Y-=.06*Math.pow(Math.abs(s),1.5)+.045*Math.pow(Math.max(0,c),4);
        if(opts.helmet&&r===0)Y-=.20*Math.pow(Math.max(0,-c),.6)+.18*Math.pow(Math.abs(s),4);
        if(opts.keel)Z+=Math.pow(Math.max(0,c),8)*opts.keel;
        p.push(X,Y,Z);uv.push(opts.chest?j/n:.01+j/n*.24,r/(rings.length-1));
      }}
      for(let r=0;r<rings.length-1;r++)for(let j=0;j<n;j++){const a=r*(n+1)+j,b=a+1;ix.push(a,b,b+n+1,a,b+n+1,a+n+1);}
      // Physical rolled hem thickness: narrow annular edge bands, not large belt layers.
      for(const r of [0,rings.length-1]){const start=p.length/3,base=r*(n+1),zc=rings[r][3]||0;
        for(let j=0;j<=n;j++){const k=(base+j)*3;p.push(p[k]*.967,p[k+1],zc+(p[k+2]-zc)*.967);uv.push(.02,j/n);}
        for(let j=0;j<n;j++){const a=base+j,b=a+1,c=start+j,d=c+1;if(r===0)ix.push(a,d,b,a,c,d);else ix.push(a,b,d,a,d,c);}
      }
      const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(p,3));ge.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));ge.setIndex(ix);ge.computeVertexNormals();geometry.set(key,ge);return ge;
    }
    const chestRings=[[.875,.220,.147],[.888,.221,.149],[.965,.213,.155],[1.08,.242,.176],[1.24,.273,.193],[1.36,.256,.178],[1.455,.194,.14]];
    function surface(x,y){const ge=shell('cuirass',chestRings,{chest:1,n:20}),pa=ge.attributes.position,ix=ge.index,ray=new THREE.Ray(new THREE.Vector3(x,y,1),new THREE.Vector3(0,0,-1)),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),hit=new THREE.Vector3();let z=-Infinity;
      for(let k=0;k<ix.count;k+=3){a.fromBufferAttribute(pa,ix.getX(k));b.fromBufferAttribute(pa,ix.getX(k+1));c.fromBufferAttribute(pa,ix.getX(k+2));if(ray.intersectTriangle(a,b,c,false,hit))z=Math.max(z,hit.z);}return Number.isFinite(z)?z:null;
    }
    return{material,shell,chestRings,surface};
  })();
  // Cached hand-authored pilot gear, merged by material. No new GPU buffers on rewear.
  const Pilot=(()=>{
    let kit;const matrix=new THREE.Matrix4();
    function bevel(w,h,d){const xy=[[-.37,-.5],[.37,-.5],[.5,-.35],[.5,.35],[.37,.5],[-.37,.5],[-.5,.35],[-.5,-.35]],p=[],uv=[],ix=[];
      for(const [s,z]of [[.9,-d/2],[1,d*.22],[.9,d/2]])for(const[x,y]of xy){p.push(x*w*s,y*h*s,z);uv.push(x*s+.5,y*s+.5);}
      p.push(0,0,-d/2,0,0,d/2);uv.push(.5,.5,.5,.5);for(let j=0;j<8;j++){const k=(j+1)%8;for(let r=0;r<2;r++){const a=r*8+j,b=r*8+k;ix.push(a,b,b+8,a,b+8,a+8);}ix.push(j,24,k,16+j,16+k,25);}
      const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(p,3));ge.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));ge.setIndex(ix);ge.computeVertexNormals();return ge;
    }
    function ribbon(path,w,t,axis='x',fit=false){if(axis==='x'&&path[0][1]>path[path.length-1][1])path=[...path].reverse();const p=[],uv=[],ix=[];
      for(let i=0;i<path.length;i++){const[x,y,z]=path[i],a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(axis==='x'?dy:dx,dz)||1,normal=axis==='x'?[0,-dz/len,dy/len]:[-dz/len,0,dx/len];
        for(const[u,v]of [[-1,-1],[1,-1],[1,1],[-1,1]]){let X=x+(axis==='x'?u*w/2:0)+normal[0]*v*t/2,Y=y+(axis==='y'?u*w/2:0)+normal[1]*v*t/2,Z=z+normal[2]*v*t/2;if(fit&&z>0&&y<=1.37){const hit=AR.surface(X,Y);if(hit!==null)Z=hit+.011+v*t/2;}p.push(X,Y,Z);uv.push((u+1)/2,i/(path.length-1));}}
      const tri=(a,b,c)=>{if(axis==='x')ix.push(a,c,b);else ix.push(a,b,c);};
      for(let i=0;i<path.length-1;i++)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4;tri(a,b,b+4);tri(a,b+4,a+4);}tri(0,2,1);tri(0,3,2);const a=p.length/3-4;tri(a,a+1,a+2);tri(a,a+2,a+3);
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
    }
    function merge(parts){const pos=[],normal=[],uv=[];for(const [ge,x=0,y=0,z=0,ry=0]of parts){matrix.makeRotationY(ry);matrix.setPosition(x,y,z);const g=ge.clone().applyMatrix4(matrix),p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv,ix=g.index;for(let k=0;k<(ix?ix.count:p.count);k++){const i=ix?ix.getX(k):k;pos.push(p.getX(i),p.getY(i),p.getZ(i));normal.push(n.getX(i),n.getY(i),n.getZ(i));uv.push(u?u.getX(i):0,u?u.getY(i):0);}g.dispose();}const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));ge.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));ge.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return ge;}
    function get(){if(kit)return kit;const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#b5a18a';g.fillRect(0,0,128,128);g.fillStyle='#b19c84';for(let y=0;y<128;y+=3)g.fillRect(0,y,128,1);g.fillStyle='#d5c5a9';for(const x of [4,123])for(let y=3;y<126;y+=6)g.fillRect(x,y,1,3);g.strokeStyle='#7e6c57';g.lineWidth=2;g.strokeRect(9,9,110,110);g.fillStyle='#cfbba0';g.fillRect(11,11,106,1);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.magFilter=THREE.NearestFilter;
      const brown=new THREE.MeshLambertMaterial({color:0x9c876e,map:tx}),silver=new THREE.MeshLambertMaterial({color:0xc2c5bf}),dark=new THREE.MeshLambertMaterial({color:0x343e40}),lamp=new THREE.MeshLambertMaterial({color:0xf31e12,emissive:0xb50903,emissiveIntensity:.55});const b=[],s=[],d=[];
      const box=(w,h,z)=>new THREE.BoxGeometry(w,h,z);const front=(x,y,clear=.011)=>(AR.surface(x,y)??.10)+clear;
      for(const sign of [-1,1]){b.push([ribbon([[sign*.16,1.475,-.20],[sign*.16,1.465,-.025],[sign*.16,1.435,.11],[sign*.153,1.36,front(sign*.153,1.36)],[sign*.14,1.25,front(sign*.14,1.25)],[sign*.135,1.13,front(sign*.135,1.13)],[sign*.13,.985,front(sign*.13,.985)]],.047,.012,'x',true)]);
        b.push([bevel(.11,.135,.077),sign*.245,.825,.112,sign*.20]);b.push([bevel(.113,.047,.017),sign*.245,.868,.155,sign*.20]);
      }
      b.push([ribbon([-.143,-.07,0,.07,.143].map(x=>[x,1.18,front(x,1.18)]),.033,.012,'y',true)]);
      b.push([ribbon([-.21,-.18,0,.18,.21].map(x=>[x,.917,front(x,.917,.009)]),.041,.012,'y',true)]);
      const buckle=(x,y,z,w,h)=>{const l=AR.surface(x-.005,y),r=AR.surface(x+.005,y),ry=l!==null&&r!==null?Math.atan((l-r)/.01):0,ca=Math.cos(ry),sa=Math.sin(ry),part=(ge,dx,dy)=>s.push([ge,x+dx*ca,y+dy,z-dx*sa,ry]);
        for(const sign of [-1,1]){part(box(.006,h,.008),sign*w/2,0);part(box(w,.006,.008),0,sign*h/2);}part(box(.005,h*.75,.009),0,0);};
      buckle(-.153,1.36,front(-.153,1.36,.022),.058,.052);buckle(.153,1.36,front(.153,1.36,.022),.058,.052);buckle(0,1.18,front(0,1.18,.024),.052,.035);buckle(0,.917,front(0,.917,.023),.05,.03);
      // Two irregular service hoses and the rigid pack frame: real geometry, no painted fake cables.
      for(const sign of [-1,1]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(sign*.225,.24,.005),new THREE.Vector3(sign*.247,.1,-.015),new THREE.Vector3(sign*.235,-.10,-.025),new THREE.Vector3(sign*.218,-.25,-.02)]);d.push([new THREE.TubeGeometry(curve,6,.009,4,false)]);d.push([box(.018,.51,.018),sign*.217,0,-.089]);}
      for(const y of [-.26,.26])d.push([box(.448,.015,.018),0,y,-.089]);
      const neckPath=Array.from({length:13},(_,j)=>{const a=.5+(Math.PI*2-1)*j/12;return [Math.sin(a)*.112,1.485+.008*(1-Math.cos(a)),Math.cos(a)*.107];});
      kit={neck:ribbon(neckPath,.09,.009,'y'),brown,silver,dark,lamp,harness:merge(b),hardware:merge(s),packDetails:merge(d),packBody:bevel(.42,.5,.16),lampGeo:bevel(.064,.075,.026),ear:bevel(.135,.212,.028)};
      // Intermediate construction geometries are never attached; release their CPU event ownership.
      for(const parts of [b,s,d])for(const [ge]of parts)ge.dispose();return kit;
    }
    return {get};
  })();
  try{const old=fitPiece;fitPiece=function(add,u,slot,m){if(!u.hd)return old.apply(this,arguments);const mat=AR.material(m);
    const attach=(par,key,rings,opts)=>{const o=new THREE.Mesh(AR.shell(key,rings,opts),mat);o.castShadow=true;o.userData.armourPilot=1;o.userData.pilotChest=key==='cuirass';par.add(o);u.armourParts.push(o);return o;};
    if(slot===0){attach(u.head,'helm',[[.43,.246,.235,-.025],[.47,.247,.24,-.025],[.54,.20,.208,-.025],[.585,.115,.13,-.025],[.605,.004,.008,-.025]],{helmet:1,n:20});attach(u.head,'brow',[[.425,.247,.239,-.025],[.442,.25,.251,-.025]],{n:20});
      for(const sign of [-1,1]){const ear=new THREE.Mesh(Pilot.get().ear,mat);ear.position.set(sign*.247,.295,-.035);ear.rotation.y=sign*Math.PI/2;ear.castShadow=true;ear.userData.armourPilot=1;u.head.add(ear);u.armourParts.push(ear);}}
    if(slot===1){attach(u.torso,'cuirass',AR.chestRings,{chest:1,n:20});attach(u.torso,'collar',[[1.451,.202,.147],[1.465,.202,.147]],{collar:1,n:20});const neck=new THREE.Mesh(Pilot.get().neck,mat);neck.castShadow=true;neck.userData.armourPilot=1;u.torso.add(neck);u.armourParts.push(neck);
      u.arms.forEach(a=>{attach(a,'shoulder',[[.072,.026,.05],[.056,.083,.098],[.018,.122,.122],[-.055,.125,.119],[-.12,.108,.105],[-.275,.088,.091]],{n:12,keel:.008});if(a.userData.el)attach(a.userData.el,'vambrace',[[.018,.078,.079],[-.035,.087,.089],[-.13,.081,.083],[-.205,.074,.077],[-.255,.070,.073]],{n:12,keel:.014});});}
    if(slot===2){u.legs.forEach(l=>attach(l,'cuisses',[[.225,.108,.115],[.15,.112,.119],[.015,.105,.114],[-.135,.091,.099]],{n:10,keel:.012}));}
    if(slot===3)u.legs.forEach(l=>{const k=l.userData.kn||l;attach(k,'greaves',[[.028,.081,.10],[-.015,.095,.112],[-.095,.088,.095],[-.23,.075,.08],[-.32,.071,.075]],{n:10,keel:.022});
      attach(k,'sabatons',[[-.415,.072,.14,.045],[-.39,.088,.17,.05],[-.345,.081,.15,.047],[-.305,.067,.085,.012]],{n:10,keel:.008});});
  };}catch(e){ERR('armour-refined',e);}
  function fitPilotHarness(u){if(!u||!u.armourParts.some(p=>p.userData.pilotChest))return;const pack=u.armourParts.find(p=>p.name==='jetpack1222');if(!pack||pack.userData.pilotFit)return;const k=Pilot.get();
    for(const p of [...pack.children]){const q=p.geometry&&p.geometry.parameters;if(!q)continue;
      if(q.width===.06&&q.height===.36||q.width===.06&&q.height===.025||q.width===.34&&q.height===.04||q.width===.05&&q.height===.05){pack.remove(p);continue;}
      if(q.width===.42&&q.height===.5)p.geometry=k.packBody;
      if(q.width===.1&&q.height===.1){p.geometry=k.lampGeo;p.material=k.lamp;p.position.z=-.104;}
    }
    for(const[geo,mat,par]of [[k.harness,k.brown,u.torso],[k.hardware,k.silver,u.torso],[k.packDetails,k.dark,pack]]){const o=new THREE.Mesh(geo,mat);o.castShadow=true;o.userData.pilotGear=1;par.add(o);if(par===u.torso)u.armourParts.push(o);}
    pack.userData.pilotFit=1;
  }
  U.fitArmourHarness=fitPilotHarness;
  try{const prior=dressModel;dressModel=function(model){const r=prior.apply(this,arguments);fitPilotHarness(model&&model.userData);return r;};}catch(e){ERR('pilot-harness',e);}
