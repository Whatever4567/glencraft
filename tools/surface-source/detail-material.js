        // Roughness and bump reuse alpha of the existing face atlas, not colour channels and not new texture objects.
        faceM.onBeforeCompile=shader=>{
          shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',THREE.ShaderChunk.roughnessmap_fragment.replace('roughnessFactor *= texelRoughness.g;','roughnessFactor = texelRoughness.a;'));
          shader.fragmentShader=shader.fragmentShader.replace('#include <bumpmap_pars_fragment>',THREE.ShaderChunk.bumpmap_pars_fragment.replace(/(texture2D\([^;]+?\))\.x/g,'$1.a'));
        };faceM.customProgramCacheKey=()=> 'gc-surface1233-alpha-detail';faceM.userData.surfaceDetail=1233;
