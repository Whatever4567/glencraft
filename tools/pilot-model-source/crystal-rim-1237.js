    // v11 local (post-1.2.38): glassy ice for faceted armour (r128 MeshStandardMaterial).
    // Near: semi-transparent outer shell (opacity ~0.82, depthWrite on) over an opaque dark-blue inner layer.
    // Shader: stronger fresnel rim, inner-depth tint, cheap specular sparkle. Far stays opaque.
    // Applied only to ArmorTintable / Far_ArmorTintable, after the 1.2.36 display transfer (which it preserves).
    function crystalRim1237(material){
      if(!material.isMeshStandardMaterial||!/^(Far_)?ArmorTintable$/.test(material.name)||material.onBeforeCompile.crystalRim1237)return material;
      // Scottish crystal is authored as a depth-writing blend (~0.82). Do not force
      // transparency on opaque ArmorTintable (legacy pilot repair armour).
      if(!/^Far_/.test(material.name)&&(material.transparent||(material.opacity>0&&material.opacity<1))){
        material.transparent=true;
        if(!(material.opacity>0&&material.opacity<1))material.opacity=0.82;
        material.depthWrite=true;material.depthTest=true;
      }
      const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
      const patched=function(shader,renderer){
        previous.call(this,shader,renderer);
        const seam='#include <emissivemap_fragment>';
        if(!shader.fragmentShader.includes(seam))throw Error('Crystal rim shader seam missing');
        shader.fragmentShader=shader.fragmentShader.replace(seam,seam+'\n{ vec3 crV = normalize( vViewPosition ); float crNdotV = clamp( abs( dot( normal, crV ) ), 0.0, 1.0 ); float crF = pow( 1.0 - crNdotV, 1.6 ); float crDeep = pow( crNdotV, 1.4 ); diffuseColor.rgb *= mix( vec3( 0.30, 0.48, 0.70 ), vec3( 1.15, 1.20, 1.28 ), crF ); diffuseColor.rgb *= mix( vec3( 0.52, 0.66, 0.86 ), vec3( 1.0 ), 1.0 - 0.50 * crDeep ); float crSpec = pow( max( dot( reflect( -crV, normal ), normalize( vec3( 0.25, 0.85, 0.45 ) ) ), 0.0 ), 48.0 ); float crSpark = pow( fract( sin( dot( normal.xy + crV.yz, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ), 12.0 ); totalEmissiveRadiance += vec3( 0.55, 0.85, 1.0 ) * ( crF * 1.15 + crSpec * 0.75 + crSpark * 0.45 ) * ( 0.65 + 0.35 * diffuseColor.rgb ); } // CRYSTAL_RIM_1237');
      };
      for(const k of Object.keys(previous))patched[k]=previous[k];
      patched.crystalRim1237=true;material.onBeforeCompile=patched;
      material.customProgramCacheKey=function(){return previousKey+'|crystal-rim-1237';};
      material.needsUpdate=true;return material;
    }
    // Electric-blue pack core: boost the authored emissive, and turn Pack_CoreHalo into a cheap additive sprite (depthWrite off).
    function packHalo1238(material){
      if(!material||!/^Pack_Core(Glow|Halo)$/.test(material.name)||material.userData.packHalo1238)return material;
      material.userData.packHalo1238=true;
      if('toneMapped' in material)material.toneMapped=false;
      if(/Halo/.test(material.name)){
        material.transparent=true;material.depthWrite=false;material.depthTest=true;
        material.blending=2;
        if(!(material.opacity>0&&material.opacity<1))material.opacity=0.32;
      }else if('emissiveIntensity' in material)material.emissiveIntensity=(material.emissiveIntensity||1)*2.8;
      return material;
    }
