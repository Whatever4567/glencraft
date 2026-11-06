    if (dirtyAll) return false;
    if(window.__c324&&__c324.savedEntry&&(!save||!save.c317||DIM.cur||save.dim||!__c317.on()))__c324.cancelSaved();
    let caveStarted=false;
    // An ordinary saved negative-Y C317 restore uses its exactly unchanged
    // serialized coordinates. New C321 frame conversion belongs in its own scope.
    if(save&&save.c317&&Array.isArray(save.c317.p)&&save.c317.p.length===3&&save.c317.p.every(Number.isFinite)&&save.c317.p[1]<0&&window.__c320&&__c320.flat&&current.mode==='flat'&&!DIM.cur&&!save.dim&&!enterWorld._savedDimension&&__c317.on()&&!(window.__c309&&__c309.on)){
      const U=window.__c324, w=__c321.pw(), q=save.c317.p;
      let state;
      try { state=U.startSaved(q); }
      catch(e) { U.cancelSaved();loadErr('saved-cave geometry',e);loadSafe();chunksReady.need=1;chunksReady.got=0;return false; }
      if(state!==true){
        chunksReady.need=1;chunksReady.got=0;
        return false;
      }
      if(Math.floor(w.x)!==Math.floor(q[0])||Math.floor(q[1]+0.05)!==Math.floor(w.y)||Math.floor(w.z)!==Math.floor(q[2])){
        chunksReady.need=1;chunksReady.got=0;return false;
      }
      caveStarted=true;
    }
    chunksReady.savedCave=caveStarted;
