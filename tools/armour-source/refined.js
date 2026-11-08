  // Refined continuous diamond plate. Separate experiment; the busy layered candidate is rejected.
  const AR = (()=>{
    const geometry=new Map(),materials=new WeakMap();let tx;
    function atlas(){if(tx)return tx;const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
      const grad=g.createLinearGradient(0,0,256,256);grad.addColorStop(0,'#dce8e8');grad.addColorStop(.43,'#b6cdcf');grad.addColorStop(1,'#94aeb2');g.fillStyle=grad;g.fillRect(0,0,256,256);
      // Broad, quiet crystal planes. The trim has light/dark sidedness, not repeated scratches.
      for(const [pts,color]of [[[[24,25],[128,72],[128,180],[24,232]],'#b6ced0'],[[[128,72],[231,25],[231,232],[128,180]],'#acc7c9'],[[[24,25],[128,72],[231,25]],'#d4e4e4']]){g.fillStyle=color;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
      // Sparse fitted panel boundaries: an arcing pectoral line and two long side seams.
      for(const s of [-1,1]){for(const [off,col]of [[0,'#8ca8ad'],[2,'#d7e7e7']]){g.strokeStyle=col;g.lineWidth=1;g.beginPath();g.moveTo(128+s*102+off,28);g.quadraticCurveTo(128+s*86+off,68,128+s*28+off,96);g.stroke();g.beginPath();g.moveTo(128+s*90+off,104);g.lineTo(128+s*72+off,230);g.stroke();}}
      g.strokeStyle='#718e93';g.lineWidth=3;g.strokeRect(4,4,248,248);g.strokeStyle='#e4eeee';g.lineWidth=2;g.strokeRect(8,8,240,240);
      // One restrained diamond hallmark; no wallpaper of grooves or rivets.
      const diamond=(r,col)=>{g.strokeStyle=col;g.lineWidth=1;g.beginPath();g.moveTo(128,128-r);g.lineTo(128+r*.55,128);g.lineTo(128,128+r);g.lineTo(128-r*.55,128);g.closePath();g.stroke();};diamond(25,'#8ba7ac');diamond(21,'#d3e4e4');
      tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.magFilter=THREE.NearestFilter;return tx;
    }
    function material(m){if(materials.has(m))return materials.get(m);const a=m.clone();a.map=atlas();if(a.isMeshStandardMaterial){a.roughness=.34;a.metalness=.32;}a.userData={...a.userData,armourRefined:1};materials.set(m,a);return a;}
    // Each cross section is designed around the body, never an extruded rounded rectangle.
    function shell(key,rings,opts={}){if(geometry.has(key))return geometry.get(key);if(rings[0][0]>rings[rings.length-1][0])rings=[...rings].reverse();const n=opts.n||16,p=[],uv=[],ix=[];
      for(let r=0;r<rings.length;r++){const [y,w,d,z0=0]=rings[r];for(let j=0;j<=n;j++){const a=(j/n-.5)*Math.PI*2,s=Math.sin(a),c=Math.cos(a);let Y=y,Z=z0+c*d,X=s*w;
        if(opts.chest){Z+=Math.pow(Math.max(0,c),6)*.025*Math.sin(r/(rings.length-1)*Math.PI);if(r===rings.length-1)Y-=.12*Math.pow(Math.abs(s),1.5);}
        if(opts.collar)Y-=.12*Math.pow(Math.abs(s),1.5);
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
    return{material,shell};
  })();
  try{const old=fitPiece;fitPiece=function(add,u,slot,m){if(!u.hd)return old.apply(this,arguments);const mat=AR.material(m);
    const attach=(par,key,rings,opts)=>{const o=new THREE.Mesh(AR.shell(key,rings,opts),mat);o.castShadow=true;o.userData.armourRefined=1;par.add(o);u.armourParts.push(o);return o;};
    if(slot===0){attach(u.head,'helm',[[.405,.246,.235,-.025],[.47,.247,.24,-.025],[.54,.20,.208,-.025],[.585,.115,.13,-.025],[.605,.004,.008,-.025]],{helmet:1,n:24});}
    if(slot===1){attach(u.torso,'cuirass',[[.875,.223,.148],[.888,.225,.15],[.965,.218,.158],[1.08,.248,.178],[1.24,.279,.194],[1.36,.266,.18],[1.455,.20,.145]],{chest:1,n:24});attach(u.torso,'collar',[[1.451,.202,.147],[1.465,.202,.147]],{collar:1,n:24});
      u.arms.forEach(a=>{attach(a,'shoulder',[[.075,.020,.04],[.055,.095,.105],[.005,.128,.123],[-.095,.115,.109],[-.215,.096,.095]],{n:16,keel:.008});if(a.userData.el)attach(a.userData.el,'vambrace',[[.018,.078,.081],[-.045,.091,.091],[-.14,.084,.082],[-.255,.070,.071]],{n:16,keel:.014});});}
    if(slot===2){u.legs.forEach(l=>attach(l,'cuisses',[[.225,.108,.115],[.15,.112,.119],[.015,.105,.114],[-.135,.091,.099]],{n:16,keel:.012}));}
    if(slot===3)u.legs.forEach(l=>{const k=l.userData.kn||l;attach(k,'greaves',[[.028,.081,.10],[-.015,.095,.112],[-.095,.088,.095],[-.23,.075,.08],[-.32,.071,.075]],{n:16,keel:.022});
      attach(k,'sabatons',[[-.415,.072,.14,.045],[-.39,.088,.17,.05],[-.345,.081,.15,.047],[-.305,.067,.085,.012]],{n:16,keel:.008});});
  };}catch(e){ERR('armour-refined',e);}
  // Adjust worn straps only; production jetpack buffers, nozzles and effects are unchanged.
  function fitRefinedHarness(u){if(!u||!u.armourParts.some(p=>p.userData.armourRefined))return;const pack=u.armourParts.find(p=>p.name==='jetpack1222');if(!pack||pack.userData.refinedHarness)return;
    for(const p of pack.children){const q=p.geometry&&p.geometry.parameters;if(!q)continue;if(q.width===.06&&q.height===.36)p.position.z+=.095;if(q.width===.06&&q.height===.025){p.scale.z=1.55;p.position.z+=.045;}if(q.width===.34&&q.height===.04||q.width===.05&&q.height===.05)p.position.z+=.095;}pack.userData.refinedHarness=1;
  }
  U.fitArmourHarness=fitRefinedHarness;
  try{const prior=dressModel;dressModel=function(model){const r=prior.apply(this,arguments);fitRefinedHarness(model&&model.userData);return r;};}catch(e){ERR('armour-refined-harness',e);}
