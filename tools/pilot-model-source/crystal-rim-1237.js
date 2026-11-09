    // v1.2.37: cheap crystal look for the faceted armour (r128 MeshStandardMaterial only, flat-shaded GLB; untested on GPU).
    // View-facing facets are tinted deeper (fake inner depth); grazing facets brighten and gain a blue fresnel rim.
    // Applied only to the tier-tintable crystal material, after the 1.2.36 display transfer (which it preserves).
    function crystalRim1237(material){
      if(!material.isMeshStandardMaterial||!/^(Far_)?ArmorTintable$/.test(material.name)||material.onBeforeCompile.crystalRim1237)return material;
      const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
      const patched=function(shader,renderer){
        previous.call(this,shader,renderer);
        const seam='#include <emissivemap_fragment>';
        if(!shader.fragmentShader.includes(seam))throw Error('Crystal rim shader seam missing');
        shader.fragmentShader=shader.fragmentShader.replace(seam,seam+'\n{ vec3 crV = normalize( vViewPosition ); float crF = pow( 1.0 - clamp( abs( dot( normal, crV ) ), 0.0, 1.0 ), 2.0 ); diffuseColor.rgb *= mix( vec3( 0.62, 0.74, 0.92 ), vec3( 1.06 ), crF ); totalEmissiveRadiance += vec3( 0.30, 0.62, 1.0 ) * crF * 0.55 * diffuseColor.rgb; } // CRYSTAL_RIM_1237');
      };
      for(const k of Object.keys(previous))patched[k]=previous[k];
      patched.crystalRim1237=true;material.onBeforeCompile=patched;
      material.customProgramCacheKey=function(){return previousKey+'|crystal-rim-1237';};
      material.needsUpdate=true;return material;
    }
