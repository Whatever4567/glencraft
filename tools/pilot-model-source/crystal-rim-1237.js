    // v15 local: saturated steel-to-ice blue crystal (r128 MeshStandardMaterial).
    // Near: depth-writing blend (~0.80) over a deep #1c3a66 under-layer.
    // Shader: steel-blue matcap, dark crack valleys stay in the albedo, WHITE only on tight specular + sparkles.
    // Applied only to ArmorTintable / Far_ArmorTintable, after the 1.2.36 display transfer (which it preserves).
    // No THREE / document references — this hook also runs inside the pilot factory (tests have no THREE global).
    function crystalRim1237(material){
      if(!material.isMeshStandardMaterial||!/^(Far_)?ArmorTintable$/.test(material.name)||material.onBeforeCompile.crystalRim1237)return material;
      if(!/^Far_/.test(material.name)&&(material.transparent||(material.opacity>0&&material.opacity<1))){
        material.transparent=true;
        if(!(material.opacity>0&&material.opacity<1))material.opacity=0.80;
        material.depthWrite=true;material.depthTest=true;
      }
      if(material.roughness>0.25)material.roughness=0.10;
      const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
      const patched=function(shader,renderer){
        previous.call(this,shader,renderer);
        const seam='#include <emissivemap_fragment>';
        if(!shader.fragmentShader.includes(seam))throw Error('Crystal rim shader seam missing');
        shader.fragmentShader=shader.fragmentShader.replace(seam,seam+'\n{ vec3 crV = normalize( vViewPosition ); vec3 crN = normalize( normal ); float crNdotV = clamp( abs( dot( crN, crV ) ), 0.0, 1.0 ); float crF = pow( 1.0 - crNdotV, 2.0 ); vec2 crMuv = normalize( vec3( crN.xy, 1.0 ) ).xy; float crNz = sqrt( max( 0.0, 1.0 - dot( crMuv, crMuv ) ) ); float crKey = pow( max( 0.0, crMuv.x * 0.22 + crMuv.y * 0.72 + crNz * 0.62 ), 12.0 ); float crFill = pow( max( 0.0, -crMuv.x * 0.35 + crMuv.y * 0.15 + crNz * 0.55 ), 2.0 ) * 0.30 ; vec3 crCap = vec3( 0.36, 0.56, 0.79 ) * ( 0.75 + crFill ) + vec3( 0.72, 0.86, 1.0 ) * crKey; diffuseColor.rgb *= mix( vec3( 0.92, 0.95, 1.00 ), vec3( 1.06, 1.10, 1.16 ), crF * 0.45 ); diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * crCap, 0.22 + 0.18 * crF ); float crSpec = pow( max( dot( reflect( -crV, crN ), normalize( vec3( 0.32, 0.82, 0.48 ) ) ), 0.0 ), 110.0 ); float crSpark = pow( fract( sin( dot( crN.xy + crV.yz, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ), 22.0 ); totalEmissiveRadiance += vec3( 0.96, 0.98, 1.0 ) * ( crSpec * 1.15 + crSpark * 0.70 ); totalEmissiveRadiance += vec3( 0.36, 0.56, 0.85 ) * crF * 0.10 ; } // CRYSTAL_RIM_1237');
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
        if(!(material.opacity>0&&material.opacity<1))material.opacity=0.18;
        if('emissiveIntensity' in material)material.emissiveIntensity=Math.min(material.emissiveIntensity||1,0.95);
      }else if('emissiveIntensity' in material){
        material.emissiveIntensity=(material.emissiveIntensity||1)*(/Nozzle/.test(material.name)?1.00:1.00);
      }
      return material;
    }
