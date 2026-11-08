# Local natural-reference experiment, not a release

Build: `node tools/build-1.2.33-natural.cjs index.html`. Authoritative chain starts from the retained surface experiment, ultimately the exact public 1.2.32 builder. `GC_SURFACE` is an optional iteration input only; final validation uses two complete builder chains without it. Public version metadata remains unchanged. No push or deployment is authorized.

## Reference inspection

Human upload inspected locally outside the repository in `/workspace/qa/reference1046`: `teen-character.obj`, one material, 751096 triangular faces, 408344 position vertices, 397947 UV coordinates, 346440 normal records. Bounds approximately 1.033 x 1.650 x 0.310 metres. Four 4096 x 4096 JPEG maps: albedo, metallic, roughness, tangent-space normal (MTL labels it map_Bump). Static OBJ, no provided rig or animation. The model is a stylized young human, not a photorealistic scan. Its LICENSE.txt declares Grab3D CC0-1.0 and explicitly discloses AI-assisted Meshy generation followed by Blender cleanup. This is package metadata, not independent provenance verification.

Viewed the ACTUAL UV-textured model from front, three-quarter, profile and full-body. Transferable principles: lids embedded in facial volume; nose bridge/tip/wings as a continuous shape; lip volume tapers to corners; layered hair clumps have deliberate silhouettes and low-level detail follows them. The 751k triangles and four full-body atlases are not copied into this 100k browser-game character. No reference pixels, mesh vertices, topology or image maps are imported or committed. The prior alien is only a material-quality reference, not a human anatomy reference.

Public anatomy corroboration opened during this task:
- https://eyewiki.aao.org/Eyelid_Reconstruction : human fissure approximately 28-30 x 10-11 mm, lid wrap and canthus positions.
- https://anatomymasterclass.com/anatomy-video-lessons/how-to-draw-a-realistic-face : eye socket, lip, ear helix/antihelix and facial proportion guidance.

## Actually implemented methods

- Removed the old giant-eye preservation field and protruding orbital cap. New smaller almond openings, shallow globe-shaped relief sharing the curved skull, independently swept upper/lower lid rolls and medial/lateral canthi. Lid rolls fade before the canthus endpoint so the fractional-power opening has no normal kink. Blue is retained, old eye dimensions are deliberately NOT retained (latest user direction supersedes the earlier big-eye request).
- Re-authored the actual eye atlas using the same head-space opening equations. Original iris fibre strokes, smaller pupil and iris, partial upper-lid occlusion, muted sclera and a restrained lash line. Resized/repositioned blink occluders, rather than leaving the giant blink geometry behind.
- Continuous Hermite-loft narrower/shorter lower-face silhouette, softer cheek transition and less square cross-sections. Original rounded nasal bridge/lobule, alar wings, septum and recessed floor; nostril occlusion paint aligned to that floor rather than two light dots. Smaller lip envelope, tapered corners, philtrum columns and a fine occlusion slit.
- Ear C-shaped helix, Y antihelix, concha, tragus/antitragus and a soft lobe. Inspection with actual FrontSide culling exposed mirrored ear winding and an intersecting back shell; both were fixed. Deeper back shell embeds the root in the skull while leaving the concha outside it.
- Triangle allocation: face 45120 -> 47736; scalp 11340 -> 10200. Ring sampling is deliberately concentrated at the eye/lid and midface rather than uniform subdivision. UVs are recalculated from the final positions.
- Hair albedo was materially darkened: mean RGB about (67.8,42.8,28.5) -> (38.4,27.6,20.2), with lower-contrast warm brown strands. Varied swept fringe boundary and additional continuous clump ridges, reduced crown point, shorter nape, scalp follows the new skull. The open fringe now has a real inset underside (272 near triangles), rather than changing a shared outfit material or faking CPU-only backfaces. No new material/draw/texture objects.
- Retained actual 1024 face atlas with original RGB and packed alpha roughness/height, reused by albedo/roughness/bump. Opaque, depth-writing material; existing shader hook reads alpha rather than RGB. Shader source expansion tested. No offline compiler was installed, so GPU compilation/appearance is NOT established.

## QA and honest limits

`tests/v1233-natural.mjs` checks actual opening size/area, BLUE iris, dark hair reduction, purposeful geometry reallocation, embedded eye depth, nasal/lip relief, tapered jaw, exact UV alignment, normal continuity, blink alignment, unchanged body, opaque packed material and budgets. Legacy suites keep their old checks for old tags; specific giant-eye coordinates, old lip/chin landmarks, blink centres, hair brightness and identical vertex-index assumptions are conditionally migrated ONLY for `userData.natural===1233`. Body/rig/grips/armour, finite geometry, material counts, normals and budget checks remain active. The fringe silhouette samples the same frontal region of the intentionally narrower skull (natural +/-0.138 instead of +/-0.15); temple/sideburn transition is not mistaken for a front-fringe notch. The original strict step/smoother-than-baseline threshold remains. No blanket suite skip.

CPU evidence uses actual mesh, generated face/hair albedo, material tint, smooth vertex normals, z-buffer and material FrontSide culling. Other materials use flat representative colour. Lambert lighting only: packed bump/roughness, PBR environment, browser antialiasing and runtime animation are NOT simulated. Wire views are actual triangle edges, not invented topology. The result remains visibly procedural/stylized; it is not a photorealistic human or a scan, and this is not claimed as a solved likeness. No GPU frame-rate claim.

## Final validated checkpoint

- 99972 near triangles, 5039 far, 48 meshes, 11 materials, 8 texture objects.
- 19 targeted gameplay regression invocations, including REAL=1 terrain and EXPECT=fixed firing checks; all pass. Face 22, anatomy 21, realism 14, surface 17 and new natural 29 checks all pass (103 feature assertions).
- Two complete authoritative build chains produce the same index as the local candidate. SHA256: `57923ca854af4fb2933cc106c8bc0f77579979d893c5417916d75d999ab7356d`.
- Actual eye opening area 4410/4426 -> 1277/1275 canonical pixels; blue irises retained. Embedded eye depth at the same ray .1975 -> .1785. Normal-turn p99/max: orbital 9.79/14.06 degrees, cheek-jaw 6.71/12.16 degrees. Frontal fringe step 10 -> 6 mm, with natural unevenness retained.
- QA gallery: `/workspace/qa/natural33/FINAL-r11-gallery.html`; actual before/after comparisons and eye/nose/ear crops use unique FINAL-r11 filenames.
- Human-reference hand crop is at `/workspace/qa/reference1046/human-reference-hand-right-crop.png` for the separate hand task; fingers in this static reference are partly fused/occluded, so it is not ground truth for individual finger topology.
