# 1.2.36 — character display transfer and portrait regression

Combined release approved for publication with the Scottish base and armour-removal fix.

Public GPU QA of 1.2.35 showed a lit world face and distinguishable dark teal clothing,
but a collapsed zero-width inventory portrait and a faint silhouette behind its panel.
The initial claim that missing world transfer alone explained the report was too broad.
The UI22 row lacked flex growth; its absolutely positioned canvas contributed no
intrinsic width, collapsing charView. The release also fixes that layout and pointer
interaction, with a failing-before/passing-after portrait lifecycle regression.

## Concrete cause found in the shipped runtime

The actual embedded engine is Three r128. The main renderer never changes its
r128 default `outputEncoding = LinearEncoding (3000)`. It uses ACES filmic tone
mapping, initially exposure 1.05. Existing world textures/legacy character art
are authored/handled for that display-space pipeline. The existing GLB actor
adapter explicitly compensates by using Lambert/display-space map handling.

The new pilot path instead retains GLTFLoader PBR materials: base-colour maps
are `sRGBEncoding (3001)` and decode into linear light; material factors and far
vertex colours are also linear. It did NOT compensate for the main renderer
omitting the final linear-to-sRGB display transfer. This is a separate, numerically verified display-transfer mismatch, not proof that
the entire world character was black. The Character & armour portrait has a DIFFERENT pipeline:
explicit sRGB output, ACES exposure 0.9, a PMREM environment, key 1.7, rim 1.6
and hemisphere 0.25. Its final display transfer is already present.

The prior CPU preview always encoded its output to sRGB and omitted the game's
ACES/output configuration. Consequently it hid this integration error. Those
previews were not GPU proof; passing mesh/skinning tests could not catch it.

## Narrow repair

Only cloned pilot materials gain an `onBeforeCompile` output hook. It inserts
r128's existing `LinearTosRGB(gl_FragColor)` immediately after output encoding
(and after ACES), before the legacy fog blend, ONLY when the effective output
encoding is LinearEncoding. The effective encoding follows the current render
target texture, or renderer output when no target exists, as r128 itself does.
Already-sRGB portrait/render-target paths receive no second transfer. All mixed
tier clones receive the same hook and a distinct program-cache key.

There is no global gamma/exposure/light change, no emissive brightness boost,
no Lambert conversion, no map-encoding mutation, and no approved-asset change.
Skinning, normals, tangent/data maps, depth and alpha modes remain intact.

## Evidence / limits

- Targeted test FAILS on the exact published 1.2.35 index at the first missing
  world-output-transfer assertion; candidate PASSES 108 checks.
- 63 native loader/rig/visibility/equipment/animation integration checks pass.
- Two complete authoritative builds match byte for byte.
- Outside the character adapter, HTML matches live 1.2.35 after reversing release
  metadata, four explicit armour-removal/summary seams and the portrait flex-layout fix.
  The combined adapter additionally integrates the separately approved Scottish base.
- Both GLB SHA256 values remain the approved frozen values.
- Actual cloth atlas mean, decoded and processed by r128 ACES at exposure 1.05,
  produces display code G/B 0.1585/0.2016 without the transfer versus
  0.4347/0.4863 with it, for unit illumination. This is a numeric sample, not a
  measured screenshot or GPU brightness result.
- The CPU comparison uses identical real mesh/maps and approximate diffuse
  lighting with the actual r128 ACES/output equations. It is NOT a browser
  screenshot or a complete PBR/normal/specular simulation.
- No browser/GPU execution or FPS claim. Post-release GPU appearance still requires
  approved deployment/browser QA; local browser access is intentionally blocked.

## Reproduction / browser QA for the parent

On the PUBLIC live URL, enter an existing world and allow the pilot assets to
finish loading. In open daylight, press V for third person, turn/walk and compare
body/face to nearby blocks. Press E, choose **Character & armour**, then drag
**Drag to turn** to rotate the portrait. Compare the SAME equipment and skin in
portrait versus world. E closes inventory; V restores first person. With body
look-down enabled, look down to check torso/legs remain visible without a
floating head or duplicate arms. Reopen the portrait: its head must remain.

After an approved hotfix deployment repeat this comparison: world colours should
no longer have the missing-transfer darkening, while portrait rendering should
not receive a second gamma transfer. Check white and gold packs, mixed tiers,
helmet removal, walking/jumping and a rifle grip. Genuine night/cave shadows
must still darken the model normally. Do not globally raise brightness to mask
this regression.

## Commands

`node tools/build-1.2.36.cjs`

`node tests/v1236-pilot-display-transfer.mjs`

`PILOT_EXPECT_VERSION=1.2.36 node tests/v1235-pilot-native.mjs`

`node tools/render-pilot-native.mjs /path/to/output --display-transfer-comparison`
