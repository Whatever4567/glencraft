    // Smaller attached ears: a swept ovoid helix, nonconcentric antihelix, shallow concha and tragus.
    // Front/back share the very same edge and tangent; the old sheet jumped in X at the rim.
    SC.earRaw = sx => (S, nu, nt) => { const P=[],UV=[],I=[],rows=2*nu;
      for(let i=0;i<=rows;i++){const front=i<=nu,u=front?i/nu:(rows-i)/nu;
        for(let j=0;j<=nt;j++){const th=j/nt*Math.PI*2,c=Math.cos(th),s=Math.sin(th);
          const lobe=1-0.16*SC.sm(-0.1,0.8,-s)*SC.sm(-0.2,0.7,-c),Y=u*0.049*s*(s<0?0.94:1),Z=u*0.029*lobe*c-0.004*u*s;
          const edge=0.003+0.010*u*u*SC.sm(-0.1,0.9,-c),fade=1-SC.sm(0.9,1,u);
          const rim=0.010*SC.gs(u-0.82,0.115)*(0.75+0.25*SC.sm(-0.5,0.5,s));
          // A Y-shaped antihelix, specified in ear coordinates rather than another concentric ring.
          const stem=0.0055*SC.gs(Z-(-0.003-0.006*SC.sm(0.005,0.03,Y)),0.0045)*SC.sm(-0.026,-0.008,Y)*(1-SC.sm(0.027,0.039,Y));
          const branch=0.0045*SC.gs(Z-(0.001+0.33*(Y-0.008)),0.0045)*SC.sm(0.002,0.014,Y)*(1-SC.sm(0.027,0.039,Y)),fork=stem+branch;
          const bowl=-0.0045*SC.ell(Z,Y,-0.002,-0.004,0.014,0.022),tragus=0.006*SC.ell(Z,Y,0.015,-0.008,0.007,0.011);
          const X=front?edge+fade*(rim+fork+bowl+tragus):edge-0.005*(1-u*u);
          P.push(sx*X,Y,Z);UV.push(j/nt,i/rows);}}
      for(let i=0;i<rows;i++)for(let j=0;j<nt;j++){const a=i*(nt+1)+j,b=a+nt+1;I.push(a,b,a+1,b,b+1,a+1);}
      return {P,UV,I,rows,cols:nt};};
    SC.earOut=sx=>(x,y,z,nx,ny,nz)=>sx*nx;
