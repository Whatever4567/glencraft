    // Reconstructed orbital patch: an ellipsoidal globe cap, raised lid rolls, two canthi and a surrounding socket recess.
    // The cap is fitted to the sloping orbital plane, not a sphere floating forward of the skull; a smooth overlap joins the lids.
    {const baseOrbitalF=SC.headF2;SC.headF2=(a,t,y,x,z)=>{const d=baseOrbitalF(a,t,y,x,z),ax=Math.abs(x),u=(ax-.1)/.043,v=(y-.27)/.029,r=Math.hypot(u,v),front=SC.sm(.08,.15,z);
      const cap=.13375+.05975*Math.sqrt(Math.max(.05,1-.5*r*r))-.45*(ax-.1),cover=1-SC.sm(.72,1.1,r);
      d[2]+=front*(cap-(z+d[2]))*cover;
      const lid=.006*SC.gs(r-1,.105)*SC.sm(.26,.281,y)+.0015*SC.gs(r-1,.13)*(1-SC.sm(.25,.277,y));
      const socket=-.0023*SC.gs(r-1.28,.18)*SC.sm(.269,.3,y)-.0005*SC.gs(r-1.3,.2)*(1-SC.sm(.248,.267,y));
      const corners=.0045*(SC.ell(ax,y,.057,.27,.007,.008)+SC.ell(ax,y,.143,.271,.007,.008));
      d[2]+=front*(lid+socket+corners);return d;};}
