# Separate local painted-realism experiment

Base: preserved anatomy candidate `c39935579735a986be5d563eac2a2a4bceb0b634`.
Branch: `experiment/v1.2.33-realism`.
Build: `node tools/build-1.2.33-realism.cjs index.html`.
The builder chains anatomy -> public 1.2.32. `GC_ANATOMY` is an optional exact-file shortcut only. No release/version metadata changes; live remains 1.2.32.

## Original art changes

Four multiview CPU iterations were evaluated. This is a realism-oriented experiment, not a photograph or a scan; the exaggerated approved large blue eyes keep the result stylized.

- Skin: warmer-neutral calibrated gradient, low-contrast mottling and tiny pores without age lines, harsh baked shading, makeup or added shiny materials. A representative cheek patch has luminance SD 1.15 and a maximum adjacent-pixel step of 3.99.
- Eyes: the same large eye envelope and original inward pupil positions (164/356,236 on the 512 map), blue iris fibres, collarette, small coherent catchlights, neutralized whites and curved opening edges rather than straight pill-shaped edges. Actual geometry adds a smooth 0..0.0035 head-unit dome/lid ridge, without moving the eye footprint in X/Y.
- Brows: individual tapered hairs, not opaque blocks; dark coverage in the original brow envelope is 29.5%.
- Lips: retain the anatomy contour/UV placement with subtle vertical grain, no dark lipstick slab.
- Hair: genuine 512x512 original seeded strand albedo, warm dark brown with mean RGB 67.8,42.8,28.5 and luminance range 31.0..64.5. The material tint is white, so it does not multiply brown into near-black. Bump scale is reduced from 1.4 to .003. The prior hair map was 256x256, so the base RGBA map memory increases by about 0.75 MiB before mipmaps; texture count remains unchanged.
- Hair geometry: swept clump variation changes 7013 position coordinates, maximum 0.0055 head units, in the existing shell. No extra meshes or subdivisions were added.
- Body, clothing, ears, mouth/nose anatomy, rig, grips, armour and fixes remain from c399355.

## Counts and tests

95680 near triangles; 4823 far; 48 meshes; 11 materials; 8 textures.
Two full builds without shortcuts are byte-identical to one another and index.html.
All 19 existing targeted regression invocations pass, including tbox-fast REAL=1 and fire-cost EXPECT=fixed.
Existing face suite: 22/22. Anatomy suite: 21/21. New realism suite: 14/14.
Logs: `/workspace/qa/realism33/test-*.log`.

Intentional test adaptations, gated on `userData.realism === 1233` except the improved sclera classifier:

- v1231-detail: the brow/eye depth difference minimum becomes .006 instead of .01, because the eye dome genuinely moves the eye forward .0035; all nose and mouth constraints remain.
- v1232-face: classify the sclera as bright, low-chroma pixels rather than only near-white; the same 85% sampled eye footprint and 30% blue minima still apply (actual 94-95% eye, 37% blue). Feathered brow coverage replaces an arbitrary opaque pixel test. Cheek smoothing is measured below y=.23, excluding the intentionally new lid ridge (worst normal turn 13.9 -> 5.5 degrees).
- v1233-anatomy: unchanged eye X/Y footprint plus a maximum .004 dome replaces exact unchanged Z. The intentional repaint preserves iris blue area within 15% and centroid within 3 px inside the original iris ellipse, instead of demanding byte-identical new art. Actual blue area 1843 -> 1694 and centroid shift 2.20 px; pupil centres are separately unchanged in the new suite.
- All legacy model checks remain for models without the realism tag.

## Evidence and honesty

`/workspace/qa/realism33/index.html` presents `final-r33-cmp-*.png` for head front/three-quarter/profile and body front/three-quarter/side/back. Before is c399355, not a previous rejected face.

`render-cpu.mjs` loads the actual built meshes and runs each page's actual face and hair painters. It bilinearly samples both maps through real UVs and applies the actual hair material tint. The old unseeded hair painter gets a fixed QA random seed solely to make the comparison reproducible. The new face and hair generators are intrinsically seeded. Other material maps are represented by simplified colours. The renderer does not emulate bump mapping, physically based specular response, subsurface scattering or GPU postprocessing.

The result is still stylized/illustrated, not achieved photorealism, an exact likeness or an in-game/GPU capture. No private photo content, imported models or external image uploads are used. Skin microdetail is more apparent close-up than at gameplay distance. GPU/runtime performance is unmeasured. No push, PR or publication is part of this experiment.
