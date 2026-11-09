    // The game's main r128 renderer intentionally emits LinearEncoding/display-space
    // legacy colours. glTF inputs are linear-light PBR values, unlike that legacy art.
    // Add the missing display transfer ONLY for this model, after ACES and before fog.
    // Keep glTF map encodings, PBR factors and data maps intact; do not brighten the world.
    function installPilotDisplayTransfer(material) {
      if(material.onBeforeCompile.pilotDisplayTransfer1236)return material;
      const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
      material.onBeforeCompile=function(shader,renderer){
        previous.call(this,shader,renderer);
        const target=renderer.getRenderTarget?renderer.getRenderTarget():null;
        const encoding=target&&target.texture?target.texture.encoding:renderer.outputEncoding;
        const active=encoding===T.LinearEncoding;
        this.userData.pilotDisplayTransfer1236={active,encoding,renderTarget:!!target};
        if(active){
          const seam='#include <encodings_fragment>';
          if(!shader.fragmentShader.includes(seam))throw Error('Pilot output transfer shader seam missing');
          shader.fragmentShader=shader.fragmentShader.replace(seam,seam+'\n gl_FragColor = LinearTosRGB( gl_FragColor ); // PILOT_DISPLAY_TRANSFER_1236');
        }
      };
      material.onBeforeCompile.pilotDisplayTransfer1236=true;
      material.customProgramCacheKey=function(){return previousKey+'|pilot-display-transfer-1236';};
      material.needsUpdate=true;return material;
    }
