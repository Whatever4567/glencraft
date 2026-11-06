    if (i === 2) {
      loadStep('restoring the save');
      // reset the menu backdrop creatures and load / start the world
      try { mobs.slice().forEach(removeMob); } catch (e) { console.error('load: clearing menu mobs', e); }
      // This is the same original applySave ordering, not a polling restore timer.
      // Preserving the existing save.dim field only scopes out dimensions; never
      // mutating it or any C320/block bytes. Real C317 negative-Y restore precedes
      // first chunksReady, after its own original c317c wrapper has initialized.
      if (save) { try { applySave(save); } catch (e) { loadErr('applySave', e); } } else { if (W !== NEW_W) { setWorldSize(NEW_W); generate(); placeTrees(); placeDecor(); dirtyAll = true; } spawnPlayer(); P.yaw = Math.atan2(-(13 - 8), -(9.5 - 8)); P.pitch = 0; }
      try {
        if(save && typeof save.dim === 'string')enterWorld._savedDimension=save.dim;
        else enterWorld._savedDimension=null;
        const q=save && save.c317 && save.c317.p;
        if(q && q[1] < -2 && save.P && window.__c320 && __c320.flat && __c317.on() && __c317.restoreSavePosition) __c317.restoreSavePosition();
        if(save && !save.dim && save.P && save.P.y < -1 && window.__c320 && __c320.flat && P.x >= 0 && P.x < W && P.z >= 0 && P.z < D && P.y >= 0){
          // Legacy off-map replacement must not erase actual negative-Y cave save.
          P.y=save.P.y;P.vy=0;P.fallTop=null;if(window.__c317)__c317.soft=true;
        }
      } catch(e){loadErr('saved underground restore',e);}
