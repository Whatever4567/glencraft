    // Original swept clumps follow the existing hair shell, breaking the uniform helmet grooves without extra draws.
    {const baseOff=SC.hairOff2;SC.hairOff2=(a,t,y)=>{
      const front=1-SC.sm(.6,1.7,Math.abs(a>Math.PI?a-2*Math.PI:a)),top=SC.sm(.35,.44,y)*(1-SC.sm(.49,.505,y));
      const swept=a+0.23*Math.sin((y-.35)*12)+0.08*Math.sin(a*3);
      return baseOff(a,t,y)+front*top*(.0035*Math.sin(swept*23)+.002*Math.sin(swept*37+y*8));};}
