# Space v2 (after v1.1.17 extension + builder removal ships), from user t619u/t620u/t621u
- NO teleport or scene switch anywhere in space. The Moon, Mars and the other planets are real ROUND voxel planets (spheres of blocks) in the same continuous coordinates.
- Spherical gravity toward each planet's centre within its gravity radius. The player's up-vector and camera roll smoothly so you can walk all the way round and stand on any side. Mining and placing work on any side.
- LOD: far = an impostor sphere, near = streamed chunks. Land and take off seamlessly with the rocket and the jetpack. Save edits per planet.
- EARTH is a FLAT disc/map in the same space (user t622u/t623u: "real flat earth I can see from the moon"). No teleport leaving Earth: fly straight up off the actual map into space. From space or the Moon, the actual flat Earth (map impostor with its terrain colours, ice wall rim, firmament dome) is visible hanging in space. Descending lands you back on the real map seamlessly.
- Keep the phone FPS OK. Test a real flight Earth to Moon, landing and walking to the far side, with no teleport.
Ship with patch notes. Report in 3 plain sentences.
- ALSO for v1.1.17: remove the Builder Tool entirely (library, edit mode, Save, applying saved builds in worldgen); keep Packed snow.
- PLAYER UFO (user t624u): at spawn the player gets their own flyable UFO parked next to them, saved with its position. Easy hover controls: no gravity while piloting, smooth 6-direction movement, boost, gentle auto-level to the local gravity, auto-hover landing on any surface/planet, and a third-person camera. It's separate from the wild Agartha UFO. Existing worlds get one near the player on load if missing.
- v1.1.17 ALSO (user t625u): DISABLE the freezing-temperature damage past the ice wall/edge for now (keep the code behind a flag set off).
