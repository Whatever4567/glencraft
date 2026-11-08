# Local feature-sculpt experiment (follow-up to fe45cdf)

Build: `node tools/build-1.2.33-surface.cjs index.html`.
Chain: surface -> realism -> anatomy -> public 1.2.32.
Branch: experiment/v1.2.33-feature-sculpt. No push, PR, release metadata change or publication.

## Concrete methods actually implemented

1. **Reconstructed orbital surface.** The existing 45,120-triangle head is resculpted into a fitted ellipsoidal globe cap, upper and lower lid rolls, two canthus corners and a surrounding socket recess. The cap is tilted to follow the real sloping orbital plane, so it does not float as a forward-facing sphere in front of the skull. This is analytic surface reconstruction on the existing grid, NOT a claim of hand-retopologized edge loops. Early overly protruding fits were rejected during six multiview iterations.
2. **Nasal underside/alar sculpt.** Independent blended wing volumes, recessed nostril floors and a columella/septum volume change the actual mesh, rather than darkening a painted hole.
3. **Ear fold reconstruction.** Stronger branching antihelix, concha and tragus relief is sampled with 28 instead of 20 radial segments (44 around), adding exactly 2,816 near triangles to the curved ear surfaces. No added torus/ring objects, meshes or draw calls. The lower-detail ear mesh remains inexpensive.
4. **Explicit texel density.** The face is authored directly at 1024x1024, not raster-resized from the previous 512 image. The same planar map spans .44 by .48 head units (2327 x 2133 texels per head unit before head scale). Eye features therefore get twice the linear texel density while maintaining their canonical large-blue-eye footprint and original pupil positions.
5. **Packed authored material detail.** RGB stores albedo; alpha stores feature-specific roughness and restrained pore-height variation in ONE face atlas. Skin alpha is about .64, eyes .22, lips .48. The same texture object is bound as map, roughnessMap and bumpMap, keeping eight textures total. A MeshStandardMaterial onBeforeCompile hook reads alpha rather than green for roughness, and alpha rather than red for bump derivatives. It is a packed roughness/height compromise, NOT an independent tangent-space normal map. The ordinary opaque material path remains enabled, so detail alpha does not enable transparency or alpha-test holes.

The dark-brown strand hair from fe45cdf is unchanged. Clothing, hands, rig, grips, armour, mouth and prior fixes remain.

## Measured results vs fe45cdf

- 922 head vertices move more than .001 head units; largest change .0080.
- Globe centre depth .1843 -> .1911; upper lid .1857; socket sample .1856.
- Alar-to-nostril relief .0077 -> .0150.
- 1,600 matched ear-coordinate samples change, max .0020, in addition to the finer fold sampling.
- Near triangles 95,680 -> 98,496. Far 4,823 -> 4,999. Still 48 meshes, 11 materials and 8 textures.
- Face atlas adds approximately 3 MiB of base RGBA storage (512 to 1024), roughly another 1 MiB for mipmaps. It retains the existing linear/mipmapped CanvasTexture filtering and anisotropy 4. Runtime performance is unmeasured.

## Validation

Two full builds without shortcuts match one another and index.html exactly.
All 19 targeted regression invocations pass (including fire-cost EXPECT=fixed and tbox-fast REAL=1).
Face 22/22, anatomy 21/21, realism 14/14, new surface 17/17.
Logs: /workspace/qa/surface33/test-*.log.

Intentional legacy-test adaptations are explicit/gated:
- Accept 512 or 1024 face callback boundaries when reading painter source; canonical painter checks still run at 512, while the new test executes the real 1024 callback including alpha packing.
- Surface-tagged orbital checks allow the actual fitted cap and its socket depth rather than insisting that a new globe remains behind the old brow. Separate new measurements require meaningful cap/lid/canthus relief.
- Eye Z-change bounds and count expectations reflect the explicit surface experiment; eye footprint/pupil identity and existing UV/body/rig checks remain.
- Ear edge continuity samples the real new radial centre (28), not the previous row 20.
- Ear shape comparisons interpolate matched UV parameters across old/new sampling, rather than falsely comparing unrelated array indices.
- Count gates remain under the user-authorized 100,000 near budget and 6,500 far limit, with exact 98,496/4,999 checks for this experiment.

## Evidence and limits

Overview: /workspace/qa/surface33/index.html.
Comparisons: final-surface-cmp-head-front.png, head-threeq, head-side, front, threeq, side, back, head-eye-front and head-nose-front.
Actual triangle-wire eye camera: final-wire-head-eye-front.png.
Actual map exports: actual-albedo1024-rgb.png and actual-packed-alpha-roughness-height.png. The RGB export is displayed opaque for inspection; the actual packed alpha is shown separately, unchanged.

The CPU renderer uses actual meshes and real face/hair albedo with bilinear sampling. Its wire overlay uses real triangle barycentrics. It does NOT emulate the new roughness/bump/PBR path; the material hook is shader-source-expansion tested against Three r160, not GPU-compiled or visually GPU-verified. No shader appearance is invented in the comparisons.

This remains stylized and experimental, NOT achieved photorealism or an exact likeness. The reconstructed large globes are visibly more rounded and may still read too prominent; that artistic choice needs approval. Geometry changes and real map data do not establish GPU quality or frame-rate claims. The approved public version is untouched.
