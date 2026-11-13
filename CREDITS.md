# Credits

## HD mob models (`assets/models/*.glb`)
All mob models are **CC0 1.0 (public domain)**: no attribution is required, but credit is given here anyway.
They were downloaded from Poly Pizza, re-compressed (meshopt, quantised) and their animation clips were renamed. The geometry and textures in the files are unchanged; some are recoloured or dressed in game (tartan trews and tams, fleece colours, mallard colours, tints).

Since v1.0.20 the game also restyles every model when it loads: the original colours are kept as vertex colours (some swapped back to each mob's Glencraft colours), and the textures are replaced with Glencraft's own pixel patterns. The shapes, rigs and animations are the originals.

| File | Used for | Model | Author | Source | Licence |
|---|---|---|---|---|---|
| sheep.glb | sheep | Sheep (animated) | Quaternius | https://poly.pizza/m/rgJXF570ZK | CC0 1.0 |
| zombie.glb | zombie | Zombie | Quaternius | https://poly.pizza/m/JoBvxIUpZP | CC0 1.0 |
| skeleton.glb | skeleton, black skeleton, blazing skeleton (tinted) | Skeleton | Quaternius | https://poly.pizza/m/wODZYCgX5Z | CC0 1.0 |
| spider.glb | spiders | Spider | Quaternius | https://poly.pizza/m/yRYJiAJyiM | CC0 1.0 |
| clansman.glb | clansman | Character Animated | Quaternius | https://poly.pizza/m/DgOCW9ZCRJ | CC0 1.0 |
| hound.glb | demon hound and Comet Collie (tinted) | Wolf | Quaternius | https://poly.pizza/m/XU7oNeKShV | CC0 1.0 |
| pig2.glb | pig (v1.0.109) | prase low poly (animated pig, Sketchfab download supplied by the player) | author not named in the file | https://sketchfab.com/3d-models/prase-not-mine-a43957cd79ab476e81e20bafc6ed0cbc (closest public match, CC Attribution 4.0; original author unconfirmed) | licence not stated in the download |
| bee.glb | bee | Bee Enemy (Low Poly Animals Animated) | Quaternius | https://poly.pizza/m/6HsU6GQt3a | CC0 1.0 |
| duck.glb | duck (recoloured as a mallard) | Chicken | Quaternius | https://poly.pizza/m/Z3RCoCYss4 | CC0 1.0 |
| haggis.glb | haggis (recoloured, tartan tam) | Raccoon | Quaternius | https://poly.pizza/m/xMmx6VQP3r | CC0 1.0 |
| imp.glb | imp | Demon | Quaternius | https://poly.pizza/m/IkB63XOPvr | CC0 1.0 |
| ghost.glb | ghost (see-through); also the sheet ghosts (Linen Ghaist, Mist Moaner, Greetin' Bairn), recoloured | Ghost | Quaternius | https://poly.pizza/m/Iip30bDHmu | CC0 1.0 |
| dragon.glb | Ember Wyrm | Dragon | Quaternius | https://poly.pizza/m/VBvzjFIYws | CC0 1.0 |
| yeti.glb | Snaw Brute | Yeti | Quaternius | https://poly.pizza/m/xtMYEVzyw0 | CC0 1.0 |
| giant.glb | Crag Gruff (recoloured to stone grey) | Giant | Quaternius | https://poly.pizza/m/BldaiPtyJa | CC0 1.0 |
| frog.glb | Puddock Gob (recoloured) | Frog | Quaternius | https://poly.pizza/m/37wofOCOzG | CC0 1.0 |
| slime.glb | Sludge Sooker and its droplets (recoloured) | Slime | Quaternius | https://poly.pizza/m/LyjSUKHKnh | CC0 1.0 |
| skull.glb | Skull Wisp (recoloured) | Skull Enemy | Quaternius | https://poly.pizza/m/EHHwZ17lWD | CC0 1.0 |
| robot.glb | Govan Gearheid (recoloured steel) | Animated Robot | Quaternius | https://poly.pizza/m/QCm7qe9uNJ | CC0 1.0 |
| whorse.glb | Unicorn (recoloured; horn added in-game) | White Horse | Quaternius | https://poly.pizza/m/bEdE4rmZy9 | CC0 1.0 |

Quaternius: https://quaternius.com

## Libraries bundled in `assets/models/lib.js`
- three.js r128 `GLTFLoader` and `SkeletonUtils`: MIT, © 2010-2021 three.js authors
- meshoptimizer 0.20 `MeshoptDecoder`: MIT, © 2016-2023 Arseny Kapoulkine

## Map data
Clydebank map data © OpenStreetMap contributors (ODbL).

## Speech (v1.0.45, removed in v1.0.47)
- The people's spoken-word clips were removed in v1.0.47; they now only hum procedural tones (no third-party assets).
- Shaders, terrain features and rain sound in v1.0.45 are procedural (no third-party assets).

## Alien encounter vision clips (v1.0.59, `assets/video/`)
Re-encoded to short 360p silent H.264 clips. All public domain.
- `v1_nuke.mp4`, `v2_blast.mp4` - excerpts of "Actual footage of nuclear bomb testing.ogv", Wikimedia Commons (US federal government work, public domain).
- `v3_storm.mp4` - excerpt of "Landfall of Hurricane Michael from Space.webm", Wikimedia Commons (NASA, public domain).
- `v4_earth.mp4` - excerpt of "Hurricane Florence From Space on September 13.webm", Wikimedia Commons (NASA, public domain).
- `v5_aurora.mp4` - excerpt of "Aurora Australis from ISS 2011 - 1.ogv", Wikimedia Commons (NASA, Crew Earth Observations team at Johnson Space Center, public domain). Added v1.0.74.
- `v6_flare.mp4` - "Solar flare X2.1 2011-09-06.ogv", Wikimedia Commons (NASA/SDO/LMSAL/GOES, public domain). Added v1.0.74.
- `v7_volcano.mp4` - excerpt of "Sarychev Peak eruption on 12 June 2009, oblique satellite view.ogv", Wikimedia Commons (NASA, ISS Crew Earth Observations, public domain). Added v1.0.74.

## Player artwork (v1.0.59)
- `assets/ui/alien_art.png` and `assets/ui/alien_skin.png` - the players own rainbow alien drawing, cropped; used for the pyramid painting and the alien skin.

## Night sky planets (v1.0.60, `assets/sky/`)
Images by NASA (public domain), cropped with the black background made transparent:
- `nebula.png` - Hourglass Nebula (MyCn18), NASA / Hubble Space Telescope.
- `neptune.png` - Neptune in false colour, NASA / Voyager 2.
- `jupiter.png` - Jupiter, NASA / Pioneer.
- `jupiter2.png` - Jupiter with a moon shadow, NASA / Hubble Space Telescope.
- `moon.png` (v1.0.62) - "Moon nearside LRO", NASA / GSFC / Arizona State University (Lunar Reconnaissance Orbiter), public domain, via Wikimedia Commons.

## Sheep and pig sounds (v1.0.65)
Cleaned, trimmed and normalised by Glencraft (site/assets/sfx/sheep1, 3 and 4.ogg, pig1-4.ogg). Sources on Wikimedia Commons:
- sheep1: "Sheep bleat.ogg" by InverseHypercube - CC0 - https://commons.wikimedia.org/wiki/File:Sheep_bleat.ogg
- sheep3: "Sheep bleating.ogg" by earthcalling - Public domain - https://commons.wikimedia.org/wiki/File:Sheep_bleating.ogg
- sheep4: "Lamb bleating and its mother's response.flac" by Yosef Ben Melamed - CC BY-SA 4.0 - https://commons.wikimedia.org/wiki/File:Lamb_bleating_and_its_mother%27s_response.flac
- pig1-3: "Mudchute pig 1/2/3.ogg" by Secretlondon (Mudchute City Farm, London) - CC BY-SA 3.0 - https://commons.wikimedia.org/wiki/File:Mudchute_pig_1.ogg (and _2, _3)
- pig4: "Pig grunt - Erdie.ogg" by Erdie (Freesound) - CC BY 3.0 - https://commons.wikimedia.org/wiki/File:Pig_grunt_-_Erdie.ogg
The modified CC BY-SA clips are shared under the same licence.

## v1.0.69
- assets/music/dance.ogg - original composition made for Glencraft (synthesised oud, qanun, ney, drone, darbuka and riq; 97 BPM). No samples from other songs.
- Pig model: Quaternius animated pig (CC0), re-textured with the players own pig photo.
- `assets/flow/water_n.jpg` - water normal map from the three.js examples (`examples/textures/waternormals.jpg`), three.js authors, MIT licence. Resized to 256 px.
- `assets/flow/lava_c.jpg` - "Lava004" by ambientCG (https://ambientcg.com/view?id=Lava004), CC0 1.0. Resized to 256 px.

- `assets/music/dance.ogg` (v1.0.80) - Egyptian dance track by Frankie Maxwell (supplied by the user). Re-encoded to Ogg Vorbis, looped during the dance.

- `assets/art/user_p1.jpg` - `user_p6.jpg` (v1.0.83) - paintings by the user (@universo.sin.descubrir), hung in the pyramid gallery rooms.
- `assets/music/dance.ogg` (v1.0.83) - same Frankie Maxwell track, tail trimmed and crossfaded into its start so it loops cleanly.

## v1.0.90 - v1.0.91
- Gold / custom-colour UI theme, carved gold CSS logo, growing selected button: original CSS by the Glencraft team (no fonts or images added).
- Highlands terrain (lochs, rivers, ice wall, caves, winding paths, pine forests, heather moors), eruption ash column, pyroclastic surge, embers and lightning: original procedural code and canvas-drawn textures.
- Foliage edge fix (colour bleed and shading): applied to the existing original plant art.
- The menu mockups used as art direction are the game owner's own.

## v1.0.92
- `assets/music/desert2.ogg` - desert / pyramid music from a track supplied by the user (v1.0.92). TikTok sound at the end cut off, trimmed to a 142 s loop with a baked 1.5 s crossfade seam, played endlessly.


## v1.0.105
- Unused files removed: the old alien encounter voice and music (assets/sfx/alien), sheep2.ogg, the old desert and temple tunes (replaced by desert2.ogg), unused HD UI icons, and the retired mp3 soundtrack in music/ (only highland_mist.mp3 is still loaded).
- Cyan, violet and white crystal blocks: textures painted in code by Glencraft.
## v1.0.106 and v1.0.107

- Agartha sky, glow grass, glow plants, the Highland Rocket Base, the rocket, the stars, The Firmament and Mars are all drawn in code for Glencraft (no outside assets).

## Pig model (v1.0.109)
- pig2.glb: "prase low poly" animated pig, supplied by the player as a Sketchfab download (no licence or author file included). Converted from FBX, reduced to about 6k triangles with a 1024px colour texture by Glencraft. If you are the author, please get in touch for credit or removal.

## Sheep model (v1.0.109)
- sheep2.glb: animated textured sheep supplied by the player (Blender glTF export, no licence or author file included). Reduced to a 1024px colour texture with mesh compression by Glencraft. If you are the author, please get in touch for credit or removal.

## Solar system planet colours (v1.0.114)
- "Solar System animation" by Samer_Arab_S5 - https://sketchfab.com/3d-models/solar-system-animation-b7c69a6b655b47c99f871d5ec5aee854 - licensed CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/). The voxel planets use small colour grids sampled from its planet textures (changed: reduced to 32 x 16 colour samples and drawn as blocks). The model and textures themselves are not included.

## v1.1.23
- assets/models/haggis2.glb: original Glencraft haggis model, generated from scratch by a procedural script (tools/haggis_gen.py). CC0.
- assets/tex/pig2_*.webp, sheep2_*.webp: 4K/2K upscales of the existing pig and sheep textures, made with Real-ESRGAN (BSD-3-Clause, xinntao/Real-ESRGAN).
- assets/tex/sheep2s_*.webp (v1.1.30): the sheared sheep texture, made by Glencraft from sheep2_*.webp with tools/sheep_shorn.py (wool flattened to short stubble over pinkish skin, face, ears and hooves kept). No other source.

- Moon and Mars blocks (Moon regolith, Moon rock, Lunar basalt, Lunar crystal ore, Moon bricks, Mars stone, Iron oxide ore, Mars crystal ore, Mars bricks), v1.1.25: procedural original textures painted in code by Glencraft.

## v1.1.29 guns
- assets/guns/gun_rifle_*.glb: "Bolt Action Rifle 7.62" by Mateusz Sadek, Poly Haven (https://polyhaven.com/a/bolt_action_rifle_7_62), CC0. Changed: spare parts removed, textures resized to 4K and 2K, WebP and mesh compression.
- assets/guns/gun_pistol_*.glb: "Service Pistol" by Mateusz Sadek, Poly Haven (https://polyhaven.com/a/service_pistol), CC0. Changed as above.
- gun_pistol_shot.mp3, gun_rifle_shot.mp3: from "Gunshot Sounds" by Tabasco, OpenGameArt (https://opengameart.org), CC0. Cut and cleaned up.
- gun_pistol_reload.mp3: "Handgun Reload Sound Effect" by zer0_sol, OpenGameArt, CC0.
- gun_rifle_bolt.mp3: "shotguncock" by SpringySpringo, OpenGameArt, CC0.
- gun_rifle_load.mp3, gun_dry.mp3: "clipload1" and "singlebullet1" by Brian MacIntosh (BMacZero), OpenGameArt, CC0. Cut.

## Real world map (v1.1.35)
- Land and sea layout of the Earth: Natural Earth 1:50m land polygons (https://www.naturalearthdata.com), public domain. Rasterised to a 2048 x 1024 land mask and embedded in the game.

- `assets/music/nature_day.mp3` and `assets/music/nature_night.mp3` (v1.1.51) - original nature ambience made for Glencraft (synthesised wind, a burn, birdsong by day, crickets and an owl at night; musicgen/nat.py). No samples or recordings from anyone else, released CC0. They replace the old remix soundtrack (bass and soft piano tones), whose files were removed.
- UK soundscape (birds, owl, planes, wind, river, cave layer music, room and cave reverb and echo) in v1.1.53: procedural Web Audio synthesis, no recordings or third-party assets.
- HD first and third person player, arms, armour and animations, death bodies, bone heaps, blood, bullet sparks and holes in v1.1.54: original procedural code and canvas-drawn textures (no third-party assets).

## TV
- assets/tv/edit1-3.mp4: the players own video edits, shown on the in game TV with permission of the owner.

## Visitor voice (v1.2.13)
`assets/voice/agartha1-9.mp3` are synthetic computer-generated speech made offline with Piper TTS (voice model `en_GB-alba-medium`, trained on the CC BY 4.0 Alba dataset), then processed with ffmpeg. They are not recordings of a person and do not imitate anyone.

## Agartha clip (v1.2.13)
`assets/video/v6_agartha.mp4` is original procedurally generated artwork (node-canvas + ffmpeg), made for Glencraft.

## v1.2.48 audio and pig skin
- Birdsong, the Calm soundtrack beds (outdoors day and night, cave level 1, blue cave, purple cave, deep hell cave), rare cave one-shots, the UFO hover hum, the quieter pig voices (oink, snuffle, happy grunt, hurt squeal), and the Happy Hardcore drums, hoover, supersaw and piano (170 BPM remix) are all original procedural Web Audio synthesis made for Glencraft. No recordings or third-party samples.
- The Classic soundtrack restores Glencraft's own original mp3 themes from v0.9.9–v1.0.105 (`music/highland_mist.mp3`, `glen_dawn.mp3`, `loch_night.mp3`, `heather_air.mp3`, `under_the_glen.mp3`, `glencraft_theme_extended.mp3`, `old_pine.mp3`, `skye_embers.mp3`, `stone_and_peat.mp3`, `cairn.mp3`, `ember_sea.mp3`). These were removed as unused in v1.0.105 and are brought back in 1.2.48. The Happy Hardcore remix layers slices of those same tracks over the procedural beat. No outside copyrighted music.
- `assets/tex/pig2_2k.webp` and `assets/tex/pig2_4k.webp` (v1.2.48): the existing pig colour textures, regraded to a slightly more pinkish farm-pig skin with pores, fine bristles and light dirt only on the legs and belly. Still based on the v1.1.23 upscale of the player-supplied pig2 texture (see Pig model v1.0.109). No other source.

## v1.2.74 Tools sit still, and the held map is a live map again

- Fix: the pickaxe, bucket and torch no longer swing on their own. They sit still in your hand, and the pickaxe head stays on the handle.
- Fix: the map in your hand is a working map again. It shows the land, updates with your position and heading, and is tilted up and close so you can read it.
- First-person hands stay hidden in third person. The gold D-pad is left alone.

## v1.2.73 Magazine in the gun, RT lets go, TARDIS cap, rare dogs

- Fix: the Highland pistol's magazine sits in the grip, in hip fire and when you aim, on every gun that has a magazine.
- Fix: letting go of the on-screen RT / Mine button stops the pickaxe (and other tools). The swing no longer keeps going after you take your finger off. The pickaxe arm is a connected sleeve and hand, not a floating stump.
- Fix: aiming the Highland pistol no longer drives your arms through the gun, and aiming the Highland musket no longer leaves the arms as floating twisted pieces. Reloading the musket keeps the gun together — it no longer explodes, spins apart, or vanishes.
- New: the TARDIS cannot fly faster than 100,000 miles an hour (at the game's scale of one block to one metre). If you are piloting it, your speed is shown in mph.
- Change: Scottish dogs only turn up near trees, in small groups of at most three, spaced a few blocks apart, and much more rarely than before.
- First-person hands stay hidden in third person. The gold D-pad is left alone.

## v1.2.72 Actions only on real input, and the load boxes are gone

- Fix: the pickaxe, torch and bucket no longer repeat their swing, place or use on their own. Those actions only fire while you are actually pressing (a mouse button, a finger on Mine or Place, or a controller trigger). Stuck attack and place-hold flags are cleared when the pointer, the trigger or the window is no longer down — including when pointer lock is lost, a gamepad disappears, or an overlay ate the pointer-up.
- Fix: the "world is taking too long to start" box (and its "take a screenshot and send it" request) is gone, and a slow or partial load no longer toasts "some parts were skipped — the world is safe". The same recovery still runs, and it only logs to the console. Ordinary gameplay toasts (pickups and the like) are unchanged.
- First-person hands, grips and animations are left as they are. First-person hands stay hidden in third person. The gold D-pad is left alone.

## v1.2.71 A second sculpt pass: a narrower palm, a real thumb, a cream cuff

- A second sculpt pass on the classic 1.2.59 `__fpa` path, the 1.2.57 meshes, the 1.2.66 fingers and the 1.2.70 flesh — the arm is not replaced, and no animation (swing, mine, place, idle, hip-fire, aim-down-sights) is touched.
- The open palm is narrower and thinner, with a slight cup and a bevel. Skin is a softer, desaturated natural pink-beige (less orange / terracotta), with a palm-centre shade and a rim light.
- The thumb is a proper 2-segment tapered digit angled off the palm, not a sphere. Finger cross-sections are rounder, with less ring segmentation, and the nails are slightly lighter at the tips.
- The cuff reads as a white / cream shirt sleeve: lighter, with fold shading, a soft hem line, and a slight flare rather than a box. A static view-model offset (not an animation change) lifts the pistol and torch so the knuckles and wrapped fingers show at the bottom right. Grips still wrap the torch, pistol, sword, block and bucket.
- First-person hands stay hidden in third person. The gold D-pad is left alone.

## v1.2.70 A solid sculpt pass: lighter flesh, fleshy fingers, a slimmer sleeve

- A sculpt pass on the classic 1.2.59 `__fpa` path, the 1.2.57 meshes and the 1.2.66 fingers — the arm is not replaced, and no animation (swing, mine, place, idle, hip-fire, aim-down-sights) is touched.
- Skin is a lighter, warmer natural flesh tone matching the v1262 refs, not dark wood-brown. Fingers are fleshy rather than claw-like: rounder padded tips, a subtler knuckle shade, a sparse specular highlight, and a limited palette.
- The forearm and cuff are slimmer and less blocky, with a taper and a bevelled, better-shaded sleeve cuff. Grips still wrap the torch, pistol, sword, block and bucket.
- First-person hands stay hidden in third person. The gold D-pad is left alone.

## v1.2.69 Egypt land

- Egypt land is a new Earth-like dimension (sky, sun, sea and sand) with the old pyramid island at its heart: the sandstone pyramid and its gold capstone, the hall and galleries, the chest room, and the Great Sphinx. The island is not in the Glencraft overworld.
- A portal framed in gold blocks, lit the same way as a Nether portal, takes you there. The portal surface reuses the Nether portal texture, recoloured gold. A return portal sits by the pyramid, and the pause menu can teleport you to Egypt land.
- The Egyptian people have moved out of Glencraft and live at the pyramid in Egypt land. The dimension is saved with the world, and if you quit while you are there you come back to Egypt land.
- First-person hands and the gold D-pad are left alone. The view-model stays hidden in third person.

## v1.2.68 Castle garrisons and a path to the farmers

- The Black Castle is home to 100 black skeletons that live around and inside it (idle and patrol; shaded so they do not burn in daylight). Each white (mossy) skeleton castle has 50 white skeletons. You can kill them all. Some respawn slowly, but a garrison can never refill to its original lot: the respawn cap decays with the kill count (`max(floor(max*0.12), max - kills)`), which is saved with the world (`glen_garrison_`). Only nearby skeletons in loaded chunks are simulated and drawn (live cap 28).
- A path of modular kit pieces (3-wide gravel, stairs, lamp posts) and bridges (plank decks, rails, posts over water and ravines) connects the human castle to the farmers. 25 humans live at the human castle. Some of them occasionally walk the path to visit the farmers, linger, and walk back. Only simulated in loaded chunks.
- First-person hands and the gold D-pad are left alone. The view-model stays hidden in third person. The Egypt dimension is not in this release.

## v1.2.67 Wild wolves, Scottish dogs, and a hag upgrade

- Wild wolves spawn naturally in packs. Hitting one angers the whole pack. Feed them bones (several tries, with heart particles) to tame them: their coat swaps from a grey-brown wolf to a Scottish collie look (black body, white blaze and ruff, tan legs). LT (touch LT and controller LT) toggles sit when you are near or targeting your tamed dog; otherwise LT is unchanged (TARDIS doors). Sitting dogs stay still. Otherwise they follow you (teleporting if far) and bite only mobs that harmed you. They trot, sit, wag, tilt, bite and sniff, with bark, howl and growl sounds (Web Audio). Tamed dogs and sit state are saved with the world.
- Moss Hag Morag has a paler hag head with long grey hair and sunken, faintly glowing eyes (blocky modular base with pixel shading: limited palette, dither, AO). Her laugh is replaced with a quieter randomised set of softer cackles and mutters, at lower volume and with a cooldown. Merry Mischanter and Sneerin' Swaddle keep their existing cackle. A black cat appears with her and follows her.
- First-person hands and the gold D-pad are left alone. The view-model stays hidden in third person. Skeleton garrisons, the human castle paths, and the Egypt dimension are not in this release.

## v1.2.66 Sausage fingers sculpted toward realistic proportions

- Hands: sausage fingers sculpted toward realistic proportions, on the existing 1.2.59 `__fpa` / 1.2.57 / 1.2.65 classic hands. Each finger tapers from a thicker base to a narrower, rounded and slightly flattened tip, built as three phalanx segments (two for the thumb) with visible narrowing at the joints and slight knuckle bulges. The middle finger is longest, then the ring and index, then the pinky. The cross-section is a slightly flattened oval. On the empty hand the fingers take a natural resting curl (the pinky curls the most); item grip poses are unchanged. Nails are thin inset plates on the last segment. The thumb has a thicker thenar base, visually lower on the palm. Fingers are a bit thinner relative to the palm. 1.2.65 pixel shading (dither, crease AO, knuckle highlights) is kept. Geometry is cached. Same objects, hierarchy, pivots, grip poses and every animation. The 1.2.60 and 1.2.61 arm paths are not used. The view-model stays hidden in third person. The gold D-pad is left alone.

## v1.2.65 Further pixel-sculpt detail on the classic hands

- Hands: further pixel-sculpt detail on the classic hands (the 1.2.59 `__fpa` path with the 1.2.57–1.2.58 sculpt, restored in 1.2.63 from `1e9db15`). Finer pixel-polygon facets on the existing hand, forearm and sleeve meshes: knuckle and finger segmentation, a thumb pad, nail tips, palm creases, and skin-tone shading in small faceted steps (lighter on top, warmer and darker in the creases and between the fingers), plus wrist tendons. The sleeve has a rolled linen cuff with fold facets. Geometry is cached and merged so there are no stutter spikes.
- The same objects, hierarchy, pivots, rig, per-item grips, hold offsets and every animation (swing, mine, place, idle, gun hip and ADS, torch) are kept. The 1.2.60 HANDS1260 path and the 1.2.61 voxel arm are not used. The first-person view-model stays hidden in third person. The gold D-pad is left alone.

## v1.2.64 TARDIS floor, touch piloting, and raised scanner

- The in-cabin floor is a thick, fully opaque tartan disc with depth-write and polygon offset, so it stays solid and correctly depth-sorted. While you are inside, terrain and grass in the interior footprint are hidden (chunk faces are skipped for the visual mesh only; the world is not edited) and nearby grass tufts are scaled away. They come back when you step out.
- On-screen left-stick axes drive the TARDIS: forward and back, and strafe left and right, relative to the way the box is facing (horizontal, no pitch). The right stick yaws it. A "TARDIS spin sensitivity" slider (0.3x–3x, default 1x) is in Settings. Jump still lifts the box and Down still sinks it. Gamepad left/right sticks and WASD are kept. First-person arms, gun holds, and the gold D-pad are not changed.
- The in-cabin TV / scanner is raised to 2.68 (above typical eye height of ~1.62) and tilted down (−0.34 rad) so it is clearly visible over the console.

## v1.2.63 Hands restored to the pre-1.2.60 version

- First-person arms and gun holds are restored exactly as they were in 1.2.59 (commit `1e9db15`, the last release before the 1.2.60 merge). That is the 1.2.49 `__fpa` path with the 1.2.57–1.2.58 sculpt and the 1.2.59 torch-pose freeze and pickaxe rightward shift, including pistol and musket hip and ADS with the original gun models.
- The 1.2.60 sculpted-hands re-enable (`GLX-HANDS1260` turning `NEW_FP_KINDS` on for every item, plus two-handed gun wraps) and the 1.2.62 wrist-pose tweak (`shiftPoses` in `GLX-HANDS1262`) are undone for the arm/hands only, by `GLX-HANDS1263`. The 1.2.61 voxel arm stays removed.
- The first-person view-model stays hidden in third person (the 1.2.62 hide is kept).
- Everything else from 1.2.60–1.2.62 is kept: TARDIS shell and rotor room, doors, shirt torso sides, render-distance cap, pop-star setting, touch LT doors. The gold D-pad is untouched.

## v1.2.62 Original arm restored, shirt sides, time-box door

- The 1.2.61 voxel / pixel-polygon first-person arm is removed. The 1.2.60 arm (`__fpVm1259` with the sculpted 1.2.49/1260 hands) is restored, including swing, mining, place, idle bob and per-item grips. Rest-pose wrist positions and hold offsets are shifted so the forearm comes in from the bottom-right, the sleeve sits at the screen edge, the empty hand is palm-up, and each item has a sensible grip. The view-model is hidden in third person. No new geometry or animation system is added. The 1.2.59 torch-arm freeze and pickaxe rightward shift stay.
- The Scottish shirt's missing waist and stomach sides are filled in, so third person, mirrors and other players see a solid white tee with the sash, belt, sporran and kilt. The torso is culled only for the local first-person camera, so the chest still does not block the view.
- Time-box doors: leftover closed door faces (the 1.2.60 shell that was being un-hidden, and the doorway-sized slab behind the leaves) are hidden. With a leaf open you see the rotor room and can walk in and back out; a shut leaf still blocks. Each leaf still toggles independently from LT and from a tap on the leaf.
- Gold on-screen D-pad, 1.2.61 police-box windows, pop-star setting, touch LT doors and render-distance cap are unchanged.

## v1.2.61 Police-box windows, dark navy, arm framing, performance

- The police-box windows are resized to match a real Series TARDIS: a six-pane window on each door, on every side, about a fifth of the door height and nearly the width of each leaf, with thick dark frames and a warm unlit glow. The shell is a very dark navy (MeshBasic, so game lighting cannot wash it to royal blue). The signs glow from inside, the blue lamp sits on the roof, and the plinth, posts and roof stack follow the same plan as 1.2.60 with a taller, visible base step. No third-party meshes.
- The rotor-room ceiling is a lit gallery ring with a hole for the column, not a huge blank disc. Roundels line the walls. The 1.2.60 interior console and procedural hum stay; the older v130 in-flight hum is gated so the box only hums once.
- First-person arms are reframed (hand centre-to-lower-right, palm up, wrist low, linen cuff at the bottom edge, short mostly-vertical forearm) and rebuilt as a pixel-polygon voxel sculpt with per-item grips. The 1.2.59 torch-arm freeze and pickaxe rightward shift are kept. Pistol and musket meshes are forced visible with the two-handed wrap.
- The extra touch flight pad is hidden by button labels as well as grid style, so it stays gone on Safari and Chrome. The gold D-pad is left alone.
- On-screen LT (the Place button) toggles the time-box door under the crosshair, the same as gamepad LT. Each leaf's hitbox is the leaf mesh itself and swings with the door. The older 1.2.60 point-in-space test and hidden-door raycasts are no longer used.
- Settings has a Disable pop star toggle (default off, so she stays on; persisted in glen_set as SET.noPopstar). When it is on she is not spawned or drawn, her song and the pop-star album cue do not play, her per-frame work is skipped, and Teleport to Pop Star is hidden.
- Render distance now caps the work: streamRadius cannot grow past SET.rdist (the 1.1.49 "see further when you fly up" wrap no longer meshes 200–700 extra blocks), chunks past the slider are unloaded, and fog, the camera far plane and the sun shadow camera stay inside that range. The unset default on phones is 4 chunks. The 1.2.60 per-frame whole-DOM scan for the blue travel overlay is skipped during render.

## v1.2.60 TARDIS overhaul and sculpted hands

- The time box exterior is an original procedural police-box shell modelled on the Series 1-4 TARDIS plan (Bill Rudloff transcription, used for shape accuracy). Panelled dark navy, six-pane windows, POLICE PUBLIC CALL BOX signs, a phone panel, and a blue roof lamp. No third-party meshes or textures.
- The tall rotor-room interior (roundels, central console, glowing column, purple/pink lighting) is original Glencraft procedural art. The in-or-near hum and the speed-harsh engine are procedural Web Audio, as is the existing travel whoosh (the blue travel overlay is removed).
- Sculpted first-person hands already in the game (the 1.2.54–1.2.55 viewmodel and the 1.2.57 cube-arm sculpt, with the in-game hand atlas) are turned back on for every item. They were switched off in 1.2.56. The 1.2.59 torch-arm freeze and pickaxe rightward shift are kept. No third-party hand scans.

## v1.2.59 Torch arm and first-person pickaxe

- The first-person arm no longer jitters or snaps when holding a torch.
- The pickaxe is moved further to the right in first person, coming in from the bottom-right corner.

## v1.2.58 First-person hands sculpting

- First-person hands sculpting: pick, sword, bucket, palm and sleeve upgrades.

## v1.2.57 Pop star presence and first-person hands

- The giant singer no longer shakes the camera or the ground. Teleport to her always spawns a present, visible actor; she is exempt from animal spawn caps, despawn, distance culling, the Disable mobs toggle, and chunk-load gating (she appears once the land is ready). A solid feet/legs collider stops the player at her feet, and her meshes stay visible up close.
- Third person uses the approved Scottish base (scottish-base-v2) with v15 crystal armour again. The rounded v1.2.26 procedural body is only a fallback after a genuine model load failure.
- First-person hands are a sculpting upgrade of the existing `__fpa` cube-arm rig (p14), with the original gun models. The 1.2.55 baked-fist / FpPistol path stays off.

## v1.2.56 Album soundtrack (36 tracks)

- First-person arms in 1.2.56 use the 1.2.49 `__fpa` rig again for every item (empty hands, tools, blocks, map, bucket, pistol and musket, including hip and ADS). Switch, reload, swing and aim animations and grip positions are unchanged. Original gun models are used in first person; the baked MakeHuman fist and the purpose-made `FpPistol1282` / `FpMusket1282` viewmodels are not used in play. The 1.2.49 sculpted hand look (cream linen sleeve, knuckle shading, rounded finger and palm meshes on the existing joints) stays on that rig.


- Album soundtrack mode now ships the full 36-track original Glencraft score (batches 1–5). Classic, Calm, and the Happy Hardcore remix (`music/hardcore_remix.mp3` / `.ogg`) are unchanged. The remix is not part of the album file set and is not replaced.
- Batch 2 fills previously falling-back contexts: `drove_road` (day), `peat_fire` (night), `purple_chamber` (purple crystal cave), `white_pass` (snow), `long_sand` (desert), `red_horizon` (Mars), `between_worlds` (deep space), `down_among_the_reeds` (underwater). Purple Chamber is a darker beatless sibling of Blue Vault. Same through-composed, sample-layered production as batch 1 (VSCO-2-CE CC0 and FluidR3 MIT; see `tools/audio-source/LICENSES.md`). No piano-led writing.
- Batch 3: `below_the_map` (hell / void, beatless), `open_sketch` (creative), `inner_sun` (warmer beatless Agartha companion), `pine_shelter` (day), `owl_hour` (night), `claymore` (combat; tense written percussion, not hardcore), `starlight_show` (original dance-pop when near the pop star; the player ducks or skips it while her diegetic song is playing), `last_light` (credits reprise of the Glen theme). `detectContext` returns `combat`, `popstar` and `credits`.
- Batch 4: `moor_light` (moor biome), `midday_glen` (brighter day), `bothy_smoke` (warmer indoor-adjacent day), `northern_quiet` (still night), `ridge_wind` (high / ridge biome), `stone_memory` (older beatless Agartha), `boss_of_the_glen` (Ember Wyrm / boss; Glen motif in the bass), `crystal_hunt` (crystal-cave combat, liminal colours under a written pulse). `detectContext` returns `moor`, `high`, `pine`, `boss` and `crystal`.
- Batch 5: four original 165 BPM UK happy-hardcore / bounce album sides, `bounce_the_glen`, `nightcore_loch`, `cairn_flash` and `till_the_hills`. They live in an opt-in `bounce` pool (`__v126x.bounce`, `__albumBounce`, or `#bounce`) so they are not shuffled into pastoral day/night cues.
- Perfection and weakest-track passes: the four hardcore sides and `starlight_show` carry original WORLD-sung hooks (Piper + pyworld; new lyrics and melodies, not the live remix hook and not the pop star's diegetic song). Energetic cues use per-section loudness matching so drops sit near −9 LUFS. `heather_road`, `boss_of_the_glen` and `crystal_hunt` were rebalanced. Renderers: `tools/audio-source/render-album-batch2.py` through `render-album-batch5.py`. Vocal builders: `build-album-vocals.py` and `build-starlight-vocals.py`. Master: `master_album.py`. Self-listen: `critique_album.py`. Licence notes remain in `tools/audio-source/LICENSES.md`.

## v1.2.55 first-person flintlock pistol and musket

- First-person pistol, musket and ADS now use the purpose-made FP flintlock models (1282/1283) on the hybrid Scottish-arm viewmodel (`fpHybrid1272`, `__fpVm1259`, `__fpa`), including the ADS left cup, fist atlas contrast, and furniture bevels. World and third-person gun meshes stay on the live 1.2.54 look. Empty hand, pickaxe, sword, torch, cobblestone, map and bucket are unchanged from 1.2.54.

## v1.2.54 pop star, pig, soundtrack, and first-person hands

- The giant pop star only steps up or down one block at a time, walks at a slow 3-block stride, will not climb onto castle roofs or similar structures, and stays visible when the player is right next to her (DoubleSide materials, a keep-out radius, and `frustumCulled = false`). Teleport to Pop Star is unchanged.
- Pigs use a new realistic pig3 model derived from Grab3D's CC0 domestic farm pig (warm-pink 2K albedo, idle and walk clips). The mesh and armature face -Z in the GLB, so the HD overlay is yawed 180° (`c.yaw = Math.PI`) so the snout leads the body's +Z walk; hooves sit on the ground (bind minY = 0). The old pig2 hang (snout-down in mid-air from `skeleton.pose()`) is also fixed. Sheep and haggis are unchanged. Licence: `tools/mob-source/LICENSES-pig3.md`.
- First-person empty hand, pickaxe, sword, torch, cobblestone, bucket and map use the new Scottish-arm hybrid viewmodel (`fpHybrid1272`, `__fpVm1259`, `__fpa`). Pistol, musket and ADS stay on the live 1.2.49 look, off the allowlist. World blocks stay on the 1.2.40 atlas. Crystal armour remains v15.

## v1.2.54 Happy Hardcore vocal remix

- The Happy Hardcore remix (`music/hardcore_remix.mp3` / `.ogg`) is an original 165 BPM UK-bounce / happy-hardcore arrangement, through-composed as 18 unique 8-bar cells (intro, festival build, four distinct drop-1 cells, a 16-bar breakdown with a new melody, a bigger festival build, six distinct drop-2 cells with a +2-semitone lift to E, and a three-cell outro). The hook is an original pitched-up female vocal, not a synth formant lead: short original lyrics about the Highlands ("Up the glen, we never sleep / Dance till the sun's on the hills"; drop 2 "Over the loch, the heather glows / Keep the fire on the hills"; breakdown "When the mist comes down the glen / I'll find my way home again"; countermelody "Call me over the high ground"), sung from Piper TTS (lead `en_GB-jenny_dioco-medium`, double `en_GB-alba-medium`, both CC-licensed datasets), time-stretched and roughly retuned onto an original D-dorian melody derived from Glencraft's own highland-mist D–E–F shape, then resynthesised in one WORLD pass (Morise et al.; pyworld-prebuilt, MIT) onto an exact sung F0 — scoop into notes, portamento, delayed vibrato on holds, consonants left unvoiced — with the nightcore +6 (breakdown +3) applied as a formant-preserving F0 multiply in that same pass, and a pro vocal chain (de-ess, compression, presence, air, a light exciter), plus an octave double, dorian harmonies, vocal chops, vocoder layers and delay throws. Production uses original emotive i–VI–III–VII and bounce i–VII–VI–VII voicings, filtered disco stabs, layered custom drum kits, alternate basses (FM donk, reese, pluck, growl, sub-fifth) so drop cells do not share one groove, a hollow metallic 2-op FM donk used as one bass voice among several, tight side-chain pump, and a short room / longer plate for mix depth — techniques inspired by festival, folk-EDM and filtered-disco records, not a copy of any melody, lyric or sample. No piano, and no supersaw or synth lead carrying the hook. The in-game player still loops the pre-rendered file and falls back to the lighter procedural Web Audio groove if the file is missing. Vocal stem builder: `tools/audio-source/build-vocals-1260.py`. Arrangement renderer: `tools/audio-source/render-hardcore-arrange.py`. A pitch/voicing self-listen writes `VOCAL_LISTEN.json` via `tools/audio-source/vocal-listen-1260.py`. No pretrained English singing-voice or RVC model is used: surveyed options were either missing a ready English female voicebank, required a GPU we do not have, or carried a licence that forbids shipping a trained model (or is non-commercial / no-derivatives). The sung line is WORLD resynthesis of the original Piper English voices only.

## v1.2.54 Album soundtrack mode

- A new opt-in **Album** soundtrack mode, alongside (and not replacing) Calm, Classic, and Happy Hardcore. The Classic mp3 themes stay unchanged.
- Batch 1 of an original Glencraft album, composed and produced for the game: `the_glen_opens` (menu), `heather_road` (overworld day), `still_water` (lochs), `watcher_on_the_ridge` (night), `blue_vault` (blue crystal cave), `choir_of_the_hollow` (Agartha), `silver_sea` (Moon), `ash_line` (volcano). Each piece is through-composed (motif development, contrasting sections, no tiled 4–8 bar loops). Crystal-cave and Agartha tracks are beatless ethereal liminal ambient. No piano-led writing. Melodies, chords and lyrics are original.
- Production techniques (filter journeys, vocoder formants, funk-bass articulation, folk-electronic plucks, cinematic builds and impacts, layered custom drums, mid-side mix depth, BS.1770 mastering) are original implementations applied to this writing only.
- Recorded instrumental colour is layered with those synths from two permissively licensed libraries only (raw files are not in this repo; see `tools/audio-source/LICENSES.md` and `fetch-samples.sh`):
  - **VS Chamber Orchestra: Community Edition** (VSCO-2-CE) by Versilian Studios / Sam Gossner; recorded by Sam Gossner and Simon Dalzell (Ivy Audio); sample cutting by Elan Hickler / Soundemote. [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Credit requested by the authors: Versilian Studios / Sam Gossner and Ivy Audio / Simon Dalzell, https://github.com/sgossner/VSCO-2-CE and http://vis.versilstudios.net/vsco-community.html.
  - **Fluid (R3) General MIDI SoundFont** (`FluidR3_GM.sf2`). Copyright (c) 2000-2002, 2008 Frank Wen; packaging acknowledgement Copyright 2008 Toby Smithe. MIT License (full text in `tools/audio-source/LICENSES.md`). Obtained from the [pianobooster/fluid-soundfont v3.1 release](https://github.com/pianobooster/fluid-soundfont/releases/tag/v3.1).
- Renderers: `tools/audio-source/album_lib.py`, `album_cinema.py`, `render-album-batch1.py`. In-game player: `tools/content-source/v126x-album.js` (per-context playlists, shuffle-bag rotation, silence gaps, lazy Ogg Vorbis with MP3 fallback under `music/album/`).
- Planned later batches (snow, desert, Mars, space, combat, pop star, creative, underwater, credits, and original hardcore album sides) are listed in `tools/audio-source/TRACKLIST.md` and are not in this release.

## v1.2.53 soundtrack, pop star, and player / armour

- The Happy Hardcore remix (`music/hardcore_remix.mp3` / `.ogg`) is replaced with an original 165 BPM UK-bounce / happy-hardcore arrangement synthesised for Glencraft (punchy kick, off-beat donk bass, pitched-up hooks, no piano, no third-party samples). Crystal-cave and Agartha Calm beds are re-rendered as beatless ethereal liminal ambient (choir pad, glassy bells, drone and long reverb). Renderers: `tools/audio-source/render-hardcore-1260.py` and `tools/audio-source/render-cave-1260.py`.
- The giant pop star has a glow-up: a clearer oval face, long wavy side-parted hair, a sequin dress, gold heels, and the microphone held in her hand. Still original Glencraft art after the user's own AI TikTok, used with their permission.
- New kilt outfit and saturated steel-blue faceted crystal armour (v15), with a slimmer plate shape, rounded helm, and cylindrical jetpack tanks.

## v1.2.50 soundtrack
- The Happy Hardcore remix (`music/hardcore_remix.mp3` / `.ogg`) is an original 170 BPM UK-bounce / happy-hardcore arrangement synthesised for Glencraft (clean punchy kick, off-beat donk / reverse-bass, supersaw pads, pitched-up formant synth chops of the old highland-mist / glen-dawn / heather-air melodies, plus time-aligned in-key grains of Glencraft's own Classic mp3 themes). No piano, no third-party samples, no copyrighted vocals or lyrics. The in-game player loops the pre-rendered file and falls back to a lighter procedural Web Audio groove (same kick + donk, no piano) if the file is missing. Renderer: `tools/audio-source/render-hardcore-1250.py`.
- Calm soundtrack, blue and purple crystal caves: new beatless liminal 'choir pad' beds (breathy Mellotron-like synth choir, sparse glassy crystal bells, deep sub drone, long cavernous convolver reverb). Agartha now has its own Calm mood instead of sharing the purple cave's music. The first cave layer and the hell cave keep their 1.2.48 beds so they stay distinct. All procedural Web Audio. Preview renderer: `tools/audio-source/render-cave-1250.py`. No recordings or third-party assets.

## v1.2.52 held-item rollback

- Held items and guns are temporarily restored to the 1.2.49 look while the new versions are finished. The giant pop star, Teleport to Pop Star, and the 1.2.51 visibility / land-only fixes are unchanged.

## v1.2.51 pop star visibility and land-only walking

- The giant pop star is fully visible at any distance: her materials ignore scene fog, stay opaque (`depthWrite` on, no transparency or distance fade), are not frustum- or draw-distance culled, and she carries her own fill light so the gold dress and blonde hair stay vivid.
- She only spawns, wanders and teleports on solid dry land (never water, lava, leaves or air). Her wandering AI turns back from water and steep drops and snaps her feet to the ground. Teleport to Pop Star places you both on dry land at a distance where her whole body fits in a portrait view, facing her.

## v1.2.49 giant pop star (originally v1.2.51)
- The rare giant pop-star mob's look and dance are original low-poly Glencraft art, modelled after the user's own AI-generated TikTok (used with their permission). No third-party meshes or textures.
- `assets/sfx/popstar_song.mp3` and `assets/sfx/popstar_song.ogg`: the song from that same TikTok, extracted with ffmpeg, trimmed of the TikTok outro sting, the end-screen / office epilogue after the rooftop dance, and looped over 12 bars at the measured 93.75 BPM. Song vocals that are part of the track are kept; no separate voiceover track could be isolated in the dance section. Footstep thuds and the near-field camera shake are procedural Web Audio, not from the video.
