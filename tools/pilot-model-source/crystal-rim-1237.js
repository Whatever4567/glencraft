    // v14 local: light icy shard crystal for faceted armour (r128 MeshStandardMaterial).
    // Near: semi-transparent icy shell (opacity ~0.80, depthWrite on) over a lighter opaque ice under-layer.
    // Shader: studio matcap glints (procedural env-map), white specular sparkles, fresnel edge highlights. Far stays opaque.
    // Applied only to ArmorTintable / Far_ArmorTintable, after the 1.2.36 display transfer (which it preserves).
    // No THREE / document references — this hook also runs inside the pilot factory (tests have no THREE global).
    function crystalRim1237(material){
      if(!material.isMeshStandardMaterial||!/^(Far_)?ArmorTintable$/.test(material.name)||material.onBeforeCompile.crystalRim1237)return material;
      // Scottish crystal is authored as a depth-writing blend (~0.80). Do not force
      // transparency on opaque ArmorTintable (legacy pilot repair armour).
      if(!/^Far_/.test(material.name)&&(material.transparent||(material.opacity>0&&material.opacity<1))){
        material.transparent=true;
        if(!(material.opacity>0&&material.opacity<1))material.opacity=0.80;
        material.depthWrite=true;material.depthTest=true;
      }
      if(material.roughness>0.2)material.roughness=0.08;
      const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
      const patched=function(shader,renderer){
        previous.call(this,shader,renderer);
        const seam='#include <emissivemap_fragment>';
        if(!shader.fragmentShader.includes(seam))throw Error('Crystal rim shader seam missing');
        shader.fragmentShader=shader.fragmentShader.replace(seam,seam+'\n{ vec3 crV = normalize( vViewPosition ); vec3 crN = normalize( normal ); float crNdotV = clamp( abs( dot( crN, crV ) ), 0.0, 1.0 ); float crF = pow( 1.0 - crNdotV, 1.85 ); vec2 crMuv = normalize( vec3( crN.xy, 1.0 ) ).xy; float crNz = sqrt( max( 0.0, 1.0 - dot( crMuv, crMuv ) ) ); float crKey = pow( max( 0.0, crMuv.x * 0.22 + crMuv.y * 0.72 + crNz * 0.62 ), 10.0 ); float crFill = pow( max( 0.0, -crMuv.x * 0.35 + crMuv.y * 0.15 + crNz * 0.55 ), 2.0 ) * 0.40 ; float crRim = pow( max( 0.0, 1.0 - crNz ), 2.2 ) * 0.22 ; vec3 crCap = vec3( min( 1.0, 0.58 + crKey * 1.05 + crFill * 0.22 + crRim * 0.10 ), min( 1.0, 0.74 + crKey * 0.90 + crFill * 0.28 + crRim * 0.16 ), min( 1.0, 0.90 + crKey * 0.55 + crFill * 0.30 + crRim * 0.22 ) ); diffuseColor.rgb *= mix( vec3( 0.96, 0.99, 1.04 ), vec3( 1.14, 1.18, 1.22 ), crF * 0.90 ); diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * crCap * 1.12 + crCap * 0.28, 0.48 + 0.38 * crF ); float crSpec = pow( max( dot( reflect( -crV, crN ), normalize( vec3( 0.32, 0.82, 0.48 ) ) ), 0.0 ), 96.0 ); float crSpark = pow( fract( sin( dot( crN.xy + crV.yz, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ), 20.0 ); totalEmissiveRadiance += vec3( 0.96, 0.99, 1.0 ) * ( crSpec * 1.25 + crSpark * 0.65 + crF * 0.20 ); totalEmissiveRadiance += crCap * vec3( 0.20, 0.35, 0.50 ) * ( 0.12 + 0.30 * crF ); } // CRYSTAL_RIM_1237');
      };
      for(const k of Object.keys(previous))patched[k]=previous[k];
      patched.crystalRim1237=true;material.onBeforeCompile=patched;
      material.customProgramCacheKey=function(){return previousKey+'|crystal-rim-1237';};
      material.needsUpdate=true;return material;
    }
    // Electric-blue pack core: modest authored emissive, Pack_CoreHalo is a cheap additive sprite (depthWrite off).
    function packHalo1238(material){
      if(!material||!/^Pack_(Core(Glow|Halo)|NozzleGlow)$/.test(material.name)||material.userData.packHalo1238)return material;
      material.userData.packHalo1238=true;
      if(/Halo/.test(material.name)){
        if('toneMapped' in material)material.toneMapped=false;
        material.transparent=true;material.depthWrite=false;material.depthTest=true;
        material.blending=2;
        if(!(material.opacity>0&&material.opacity<1))material.opacity=0.20;
        if('emissiveIntensity' in material)material.emissiveIntensity=Math.min(material.emissiveIntensity||1,1.05);
      }else if('emissiveIntensity' in material){
        // Core/nozzle stay tone-mapped so the hot centre reads electric blue (#1E7BFF-#3FA9FF), not blown white.
        material.emissiveIntensity=(material.emissiveIntensity||1)*(/Nozzle/.test(material.name)?1.05:1.08);
      }
      return material;
    }
