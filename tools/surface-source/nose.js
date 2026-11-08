    // Separate alar wings, recessed nostril floors and septum/columella underside, blended in the actual nose surface.
    {const baseNoseF=SC.headF2;SC.headF2=(a,t,y,x,z)=>{const d=baseNoseF(a,t,y,x,z),ax=Math.abs(x),f=SC.sm(.08,.15,z);
      d[2]+=f*(.004*SC.ell(ax,y,.028,.178,.014,.014)-.0042*SC.ell(ax,y,.016,.168,.007,.005)+.003*SC.ell(x,y,0,.162,.007,.009));
      d[1]-=f*.0015*SC.ell(ax,y,.024,.172,.015,.01);return d;};}
