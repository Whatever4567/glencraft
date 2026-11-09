# Authorship and graphical-data provenance

The fitted flight suit, continuous shoulder/arm garment, cloth-fold fields, seams,
helmet, straps, open buckles, pouches, gloves, articulated phalanges, boots and twin
cylinder pack were authored specifically for this reference. No game repository,
old game builder or PR6 asset was read or modified in this standalone phase.
The turnaround JPG was a visual reference only: its pixels are not used in maps.

## Anatomical character-authoring data

The first entirely analytic facial sculpt was visually inadequate and is NOT the
head in the delivered asset. The final head uses genuine anatomical facial loops
from MakeHuman core graphical data, with custom phenotype, proportion/likeness
adjustments, bespoke cranial fit, hairstyle and rigging. Thus the head is NOT
represented as a wholly hand-sculpted-from-zero head or a scan of the reference.

Graphical data from a published MPFB standard-authoring-tool release:
https://files2.makehumancommunity.org/releases/mpfb-2.0.6-rc2.zip

Included data: base.obj; Caucasian-male-young morph; average/max-muscle young-male
morph data; anatomical vertex-group metadata. No MPFB program code is bundled.

Core skin and eye graphical data:
https://files2.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip

Used: young_lightskinned_male_diffuse.png, blue_eye.png and low-poly anatomical
eyeball proxy. Other tiny downloaded eyebrow files are study inputs only, not
used in the runtime asset. The body portion of the skin map is not rendered:
only the head and neck are used.

Official CC0 records opened during this task:
https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html
https://static.makehumancommunity.org/makehuman/faq/are_makehuman_files_free.html

The official FAQ explicitly permits use/modification/sale of core assets and
building character generators with them under CC0. This is graphical data under
CC0, not a claim that the MPFB application's GPL code is CC0. The MakeHuman
community, Data Collection AB, Joel Palmius and Jonas Hauquier are acknowledged.
The original low-poly proxy file also contains its explicit CC0 notice.

`source-data-sha256.json` records the exact data consumed. Runtime `.blend` files
pack images; GLB files embed all required maps. No private downloads, credentials,
external model endpoints or undocumented application APIs are needed at runtime.

The copied skin atlas is tone-adjusted by RGB factors (0.87, 0.82, 0.76)
to fit the reference palette; the licensed source input remains unchanged.
Near runtime copies are resolution-budgeted; full graphical-data inputs and
editable texture masters are retained for regeneration.

V2 adds an original spatial T-zone/lip/cheek roughness map, original fine swept
fringe bundles, anatomical facial-plane refinements and reauthored cloth/gear
construction. These changes do not alter the CC0 status of the underlying inputs.
Frozen V1 render PNGs used only for comparison are copied read-only and checked
against that delivery’s original SHA256 manifest; see comparison-inputs/v1/provenance.json.
