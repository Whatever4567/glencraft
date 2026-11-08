# Reference-led teal pilot — release 1.2.34

Base live release: 1.2.33, main 81751f1046f848d94e5652394dc3924fc1cabb52. The requested reference was actually opened with Read from `/workspace/reference-t1053/teal-pilot-turnaround.jpg` (front, back and side upper-body turnaround). It was used for shape/material hierarchy only. No reference pixels or external model assets are imported into the game.

The exact local preview f85aef4 was subsequently explicitly requested live. Release 1.2.34 composes it without further art changes. The prior release 1.2.33 fitter and builder remain unchanged. `build-pilot-preview.cjs` composes live 1.2.33 and replaces only its equipment fitter / clone-local white jetpack fitting.

## Actual geometry/material work

- Fitted continuous cuirass and longer sleeved shoulder geometry, calmer anatomically open neckline, physical upright split collar. Existing body, face, hair, eyes, hands and bones are unchanged.
- Real helmet brow lip and bevelled ear housings, rather than painting these shapes onto the face.
- Original teal pixel surface with sparse fitted seam/highlight hierarchy and attachment marks. No repeated chest emblems, groove wallpaper or random scratch field. Original brown woven/stitch atlas for webbing and pouch flaps.
- Curved, solid webbing follows the torso and crosses over the shoulder to the pack. Both edges of each front strap are ray-projected onto the **actual cached cuirass mesh**; hardware orientation follows the sampled lateral chest slope. This replaces the visibly floating flat front strap bars. One-time cache construction only, not per-frame raycasting.
- Actual rectangular buckle frames/tongues, shaped hip pouches/flaps, waist belt. Brown parts and metal parts are each merged into one cached mesh, not a new draw call per buckle bar.
- White pack clone gets a bevelled body, rigid frame rails, two actual curved service hoses and raised red indicator geometry/material. Original twin tanks, bands, vents, nozzles and flame parents/positions remain unchanged. The production template, held/dropped model, icon and gold variant are not modified. New white-specific gear is added only when the named white worn pack and pilot chest are present. Removing the chest restores the native white-pack clone and straps; no custom harness is left floating on an unarmoured torso.

Lower-leg circumference segments were reallocated to actual collar/gear detail to stay below the existing near-player budget. This is not a claim that uniform subdivision or a larger atlas makes something photorealistic. The visible character still has the live stylized face because face/first-person changes are explicitly out of scope.

## Reproduce and evidence

`mkdir -p artifacts/pilot-preview; node tools/build-1.2.33.cjs artifacts/pilot-preview/before.html`
`node tools/build-pilot-preview.cjs artifacts/pilot-preview/after.html`
`node tests/pilot-preview.mjs`
`node tools/render-armour-preview.mjs artifacts/pilot-preview/after.html artifacts/pilot-preview/after preview`
`node tools/render-armour-preview.mjs artifacts/pilot-preview/before.html artifacts/pilot-preview/before live`

Front/back/side full-body comparisons and closeups use the same live base character, equipment, camera/scale and lighting. CPU rasterizations sample the actual armour/webbing/pack painters and actual meshes. They are NOT in-game/GPU screenshots: they do not prove specular/normal lighting, emissive bloom, runtime framerate, first-person parity or physical collision clearance. No head/FP/musket worker patch is combined.

The new lifecycle test runs the actual production dress function, candidate fitter and real production white pack model/dress with real Three geometry and node-canvas painters. It checks repeated four-tier wear/unwear in world and inventory modes, bounded geometry/material/texture reuse, detached old parts, template immutability, nozzle/flame transforms, gold exclusion, posed bone transforms and grips, finite vertex/normal/UV data, budget, and byte-identical page scope outside the equipment block. Tests are mechanical evidence, not artistic approval.

## Measured budget and fit

Full live-base character + pilot equipment + white pack: 99,952 near / 9,095 far triangles, versus live 99,484 / 8,627. Meshes 89 vs 88, geometry resources 72 vs 70, materials 23 vs 21, textures 11 vs 10. No global budget increase. This is close to the existing 100,000 cap; any later head/other merge needs a fresh combined-budget check.

Independent ray tests sample 216 front webbing vertices in both inventory/world modes: 5–17 mm outside the actual chest mesh (the inner/outer faces of the 12 mm strap), rather than the earlier several-centimetre floating strip. This checks the static front strap fit, not full-body collision physics or all animated contacts.

Final validation: two final builds byte-identical; the pilot lifecycle/material-cache/partial-wear/mesh-clearance suite passes, as do 21 targeted existing equip/jetpack/player/face/hand/gun/ragdoll/tbox suites plus REAL=1 tbox simulation. That validation was performed locally before publication was authorized. Logs are in artifacts/pilot-preview/.

Release preservation: `tests/v1234-release.mjs` checks the source checksum and entire approved preview checksum after removing only release version, marker and the new note. `build-1.2.34.cjs` writes both HTML and sibling version.json.
