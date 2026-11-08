    // Smaller attached ears: a swept ovoid helix, nonconcentric antihelix, shallow concha and tragus.
    // Front/back share the very same edge and tangent; the old sheet jumped in X at the rim.
    SC.earRaw = sx => (S, nu, nt) => { const P=[],UV=[],I=[],rows=2*nu;
      for(let i=0;i<=rows;i++){const front=i<=nu,u=front?i/nu:(rows-i)/nu;
        for(let j=0;j<=nt;j++){const th=j/nt*Math.PI*2,c=Math.cos(th),s=Math.sin(th);
          const lobe=1-0.16*SC.sm(-0.1,0.8,-s)*SC.sm(-0.2,0.7,-c),Y=u*0.046*s*(s<0?0.94:1),Z=u*0.027*lobe*c-0.004*u*s;
          const edge=0.003+0.010*u*u*SC.sm(-0.1,0.9,-c),fade=1-SC.sm(0.9,1,u);
          const rim=0.008*SC.gs(u-0.83,0.10)*(0.5+0.5*SC.sm(-0.7,0.1,s))*(1-0.65*SC.sm(0.3,0.95,c)*(1-SC.sm(-0.02,0.02,Y)));
          // A Y-shaped antihelix, specified in ear coordinates rather than another concentric ring.
          const stem=0.007*SC.gs(Z-(-0.003-0.006*SC.sm(0.005,0.03,Y)),0.0045)*SC.sm(-0.026,-0.008,Y)*(1-SC.sm(0.027,0.039,Y));
          const branch=0.0055*SC.gs(Z-(0.001+0.33*(Y-0.008)),0.0045)*SC.sm(0.002,0.014,Y)*(1-SC.sm(0.027,0.039,Y)),fork=stem+branch;
          const bowl=-0.006*SC.ell(Z,Y,-0.002,-0.004,0.014,0.022),tragus=0.0065*SC.ell(Z,Y,0.015,-0.008,0.007,0.011);
          const X=front?edge+fade*(rim+fork+bowl+tragus+0.0045*SC.ell(Z,Y,0.006,-0.024,0.007,0.006)):edge-0.020*(1-u*u);
          P.push(sx*X,Y,Z);UV.push(j/nt,i/rows);}}
      for(let i=0;i<rows;i++)for(let j=0;j<nt;j++){const a=i*(nt+1)+j,b=a+nt+1;if(sx>0)I.push(a,a+1,b,b,a+1,b+1);else I.push(a,b,a+1,b,b+1,a+1);}
      return {P,UV,I,rows,cols:nt};};
    SC.earOut=sx=>(x,y,z,nx,ny,nz)=>(sx*x-.002)*sx*nx+y*ny+z*nz;
