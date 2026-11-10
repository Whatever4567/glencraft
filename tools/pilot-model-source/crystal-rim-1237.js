    // v12 local: pale icy glass for faceted armour (r128 MeshStandardMaterial).
    // Near: semi-transparent icy shell (opacity ~0.78, depthWrite on) over a deeper opaque cyan inner layer.
    // Shader: stronger fresnel rim, inner-depth tint, cheap specular sparkle. Far stays opaque.
    // Applied only to ArmorTintable / Far_ArmorTintable, after the 1.2.36 display transfer (which it preserves).
    function crystalRim1237(material){
      if(!material.isMeshStandardMaterial||!/^(Far_)?ArmorTintable$/.test(material.name)||material.onBeforeCompile.crystalRim1237)return material;
      // Scottish crystal is authored as a depth-writing blend (~0.82). Do not force
      // transparency on opaque ArmorTintable (legacy pilot repair armour).
      if(!/^Far_/.test(material.name)&&(material.transparent||(material.opacity>0&&material.opacity<1))){
        material.transparent=true;
        if(!(material.opacity>0&&material.opacity<1))material.opacity=0.78;
        material.depthWrite=true;material.depthTest=true;
      }
      const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
      const patched=function(shader,renderer){
        previous.call(this,shader,renderer);
        const seam='#include <emissivemap_fragment>';
        if(!shader.fragmentShader.includes(seam))throw Error('Crystal rim shader seam missing');
        shader.fragmentShader=shader.fragmentShader.replace(seam,seam+'\n{ vec3 crV = normalize( vViewPosition ); float crNdotV = clamp( abs( dot( normal, crV ) ), 0.0, 1.0 ); float crF = pow( 1.0 - crNdotV, 2.2 ); float crDeep = pow( crNdotV, 1.15 ); diffuseColor.rgb *= mix( vec3( 0.28, 0.48, 0.70 ), vec3( 0.85, 1.05, 1.18 ), crF ); diffuseColor.rgb *= mix( vec3( 0.32, 0.50, 0.68 ), vec3( 1.0 ), 1.0 - 0.62 * crDeep ); float crSpec = pow( max( dot( reflect( -crV, normal ), normalize( vec3( 0.25, 0.85, 0.45 ) ) ), 0.0 ), 64.0 ); float crSpark = pow( fract( sin( dot( normal.xy + crV.yz, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ), 16.0 ); totalEmissiveRadiance += vec3( 0.20, 0.55, 0.95 ) * ( crF * 0.55 + crSpec * 0.35 + crSpark * 0.10 ) * ( 0.55 + 0.45 * diffuseColor.rgb ); } // CRYSTAL_RIM_1237');
      };
      for(const k of Object.keys(previous))patched[k]=previous[k];
      patched.crystalRim1237=true;material.onBeforeCompile=patched;
      material.customProgramCacheKey=function(){return previousKey+'|crystal-rim-1237';};
      material.needsUpdate=true;return material;
    }
    // Electric-blue pack core: boost the authored emissive, and turn Pack_CoreHalo into a cheap additive sprite (depthWrite off).
    function packHalo1238(material){
      if(!material||!/^Pack_(Core(Glow|Halo)|NozzleGlow)$/.test(material.name)||material.userData.packHalo1238)return material;
      material.userData.packHalo1238=true;
      if(/Halo/.test(material.name)){
        if('toneMapped' in material)material.toneMapped=false;
        material.transparent=true;material.depthWrite=false;material.depthTest=true;
        material.blending=2;
        if(!(material.opacity>0&&material.opacity<1))material.opacity=0.32;
      }else if('emissiveIntensity' in material){
        // Core/nozzle stay tone-mapped so the hot centre reads electric blue (#1E7BFF-#3FA9FF), not blown white.
        material.emissiveIntensity=(material.emissiveIntensity||1)*(/Nozzle/.test(material.name)?1.25:1.35);
      }
      return material;
    }
