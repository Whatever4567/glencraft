# Local v1.2.2 cave candidate — not published

Reference labels reconcile as **surface + seven underground strata**, not eight underground chambers. No image-match claim; based on preserved descriptions.

| Stratum | Natural floor / roof Y | Shape |
| --- | --- | --- |
| Surface | unchanged | Existing landscape |
| Shallow gray | -68 / -51 | Open hall and gray supports |
| Lush fungi | -104 / -73 | Giant log-stem / purple existing-block caps, leaf vines |
| Deep dark | -140 / -109 | Deepslate pillars, tile features |
| Magma basalt | -164 / -145 | Basalt pillars and narrow local lava veins |
| Molten depths | -185 / -169 | Wider hall, lateral river and rim fall; dry center |
| Abyssal crystal | -206 / -190 | Purple crystal ring outside the eye dome |
| Core eye | -236 / -181 | Large dry bowl, taller central dome; existing 3D eye unchanged |

Central dome intentionally rises through the inner part of the two lower strata; solid separators remain outside that opening. Natural bottom stays -237. No Agartha/surface alteration or new surface tunnel.

## Tested access
Start in gray cave at (432.5,-67,180.5), walk toward z178.5 then x492.5. Eastern square staircase descends from there; follow its three-block-wide ring to the bottom, then the dry approach along z180.5 to (432.5,-235,180.5). Uppermost optional tread is near (480.5,-51,174.5). Original eye center (432,-209,180).

Proof executes the actual production collides (0.6 wide x1.8 tall), moveAxis and moveY primitives at 60 Hz: gray entry to core floor, no jumping/flying/coordinate resets, corner/head clearance, supported settled waypoints, no lava-body contact or damaging falls. It is not the whole updatePlayer wrapper stack or a browser gameplay test; generic old-world respawn callbacks are inert in the primitive harness. Return ascent and every side landing are not movement-tested. Seven-room 2-block-height AIR connectivity is separately checked. Original 24-radius eye clearance is checked.

Only authoritative deepWorld code differs in the generated artifact versus boundary-fix build. Original surface/Agartha/UFO/eye/streamer/light/mesher code is byte-identical. Materials are existing IDs; fungi use existing log/wool/leaf blocks rather than new models.

Existing saved edits, including AIR and legacy below-floor columns, retain overlay precedence. Natural terrain updates when generated chunks reload; no save rewrite/reset performed. Existing confirmed Reset World uses the generator if the user initiates it. Builds may visually intersect newly generated natural terrain; edited voxels are preserved, not entire unedited surrounding rooms.
