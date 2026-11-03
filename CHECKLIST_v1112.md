# v1.0.112 (one push)
1. Agartha: the black/Blackstone skeleton castle is ONLY the nearby landmark. The cave hole is IN the ice wall at the point nearest that castle. The tunnel runs straight out of the map for 2000 blocks to Agartha, outside the map. Don't attach it to the castle. Nothing under the mainland.
2. UFO (user t610u): it never despawns. By day it is parked in Agartha. At dusk it flies out through the tunnel at medium-fast speed to the pyramid/desert and does its tic-tac zig-zag moves all night. At dawn it flies back through the tunnel to Agartha at medium-fast speed. Its path follows the tunnel (no clipping through terrain); handle unloaded chunks gracefully (simulate its position if the player isn't near).
Patch notes, push, verify live, report in 2-3 plain sentences with the entrance coordinates.

# v1.0.113 SPACE (user t611u), after the UFO route ships
- Height: raise the effective ceiling to 1000. Order going up: firmament, then atmosphere (Earth map visible below, fading), then 1000+ = space/orbit (zero-g drift, "perpetual orbit" feel). Use a separate-area approach like the Agartha tunnel if needed; keep the phone FPS OK.
- Deep space: 10000x10000, zero-g, jetpack thrust works in all directions (no gravity), starfield.
- Mars: its own voxel planet made of red sand blocks (plus some rock), about 1/3 of the Earth map's size (~288x288), landable and buildable (saves blocks), Mars gravity.
- Moon: a real voxel moon much closer than Mars, smaller, grey regolith, low gravity, buildable. The overworld sky moon must be this moon (same position/phase logic).
- Structure it so more planets can be added easily later (solar system list).
- Rocket camera: third person looking along the flight direction (pitches with the rocket, so it looks straight up while ascending), so planet-to-planet flight is easy. Landing on Mars and the Moon works.
Patch notes, push, verify live, report in 3 plain sentences.
- User sent a solar system reference zip: /cursor/stores/store-6b099320-889b-4c23-9eca-54f85c129a7b/grok-bot/agents/146d0e47-1004-4f9b-a662-3b480f6050c9/attachments/01M6E6KK36DJXSXM2CWHWYJJQQ.zip. Unzip and use it as the reference for planet look, colours and layout, but the planets must be VOXEL / made of blocks. Use its textures only if the licence is free or the user made them; otherwise use it as inspiration. Don't commit the raw zip.
- User (t613u): you have creative freedom; make space bigger if that's more fun, but keep phone FPS OK.
