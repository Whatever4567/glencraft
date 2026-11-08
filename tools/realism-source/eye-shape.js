    // Same large eye footprint, but a subtle domed corneal area and a continuous upper/lower lid ridge rather than a flat decal.
    {const anatomyEyeF=SC.headF2;SC.headF2=(a,t,y,x,z)=>{const d=anatomyEyeF(a,t,y,x,z),du=(Math.abs(x)-.1)/.043,dv=(y-.27)/.029,r=Math.hypot(du,dv),f=SC.sm(.08,.15,z);
      d[2]+=f*(.0035*Math.exp(-(r**4))+.0017*SC.gs(r-1,.13)*SC.sm(.249,.28,y)+.0006*SC.gs(r-1,.15)*(1-SC.sm(.25,.275,y)));return d;};}
