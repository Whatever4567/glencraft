    // Original reference-led human sculpt. The uploaded model is viewed, never imported or traced.
    SC.headF2=(a,t,y,x,z)=>{const g=SC.gs,e=SC.ell,ax=Math.abs(x),r=Math.hypot(x,z)||1,f=SC.sm(.06,.145,z);let dr=0,dz=0;
      // Soft malar pads and a restrained supraorbital ridge, not a deep under-eye trough.
      dr+=f*(.007*e(ax,y,.135,.225,.044,.036)+.0035*e(ax,y,.085,.306,.055,.018));
      // Embedded orbital opening: almond lid arcs wrapped around a shallow globe, with independent canthi.
      const u=(ax-.085)/.033,q=Math.pow(Math.max(0,1-u*u),.68),mid=.271+.0018*u;
      const top=mid+.012*q,bot=mid-.010*q;
      // Socket and globe share the original curved skull surface; no flattened cap or rectangular blend ledge.
      dz+=f*(-.0045*e(ax,y,.085,.271,.043,.026)+.0030*e(ax,y,.085,.271,.027,.015));
      dz+=f*(.0013*g(y-top,.0055)+.0007*g(y-bot,.0055))*(1-SC.sm(.70,.97,Math.abs(u)));
      dz-=f*.0007*g(y-top-.007,.0048)*(1-SC.sm(.70,.97,Math.abs(u)));
      dz+=f*.0010*(e(ax,y,.052,.269,.005,.005)+e(ax,y,.118,.273,.005,.005));
      // Continuous bridge, rounded tip, paired alar wings, actual recessed nostril floor and columella.
      dz+=f*(.020*g(x,.016)*g(y-.238,.046)+.028*e(x,y,0,.192,.020,.021));
      dz+=f*(.012*e(ax,y,.023,.179,.012,.013)-.009*e(ax,y,.016,.171,.0055,.0045)+.006*e(x,y,0,.173,.006,.010));
      dz-=f*.002*e(ax,y,.036,.181,.005,.014);
      // Sculpted vermilion, philtrum columns and an occlusion slit, not a projecting muzzle patch.
      const line=.119+.0018*(ax/.05)**2-.0012*g(x,.011),tap=Math.exp(-((x/.047)**4));
      dz+=f*(.002*e(x,y,0,.124,.055,.025)+.0013*g(ax-.009,.004)*g(y-.144,.011));
      dz+=f*tap*(.0055*g(y-line-.0055-.0015*g(ax-.012,.008),.005)+.0068*g(y-line+.007,.007));
      dz-=f*(.0034*g(y-line,.0022)*Math.exp(-((x/.051)**4))+.0017*e(ax,y,.05,.121,.005,.005));
      dz+=f*.007*e(x,y,0,.065,.042,.025);
      dr-=.030*(1-SC.sm(.06,.205,y))*SC.sm(.72,1.9,Math.abs(a>Math.PI?a-2*Math.PI:a));
      return[x/r*dr,0,z/r*dr+dz];};
