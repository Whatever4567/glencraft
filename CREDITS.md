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
| pig.glb | (old pig, no longer used since v1.0.109) | Pig | Quaternius | https://poly.pizza/m/u35l6uP5vj | CC0 1.0 |
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
| dino_apato.glb | Apatosaurus (recoloured, Glencraft scales) | Apatosaurus (Animated Dinosaur Bundle) | Quaternius | https://poly.pizza/m/fvo0x8Zk3z | CC0 1.0 |
| dino_para.glb | Parasaurolophus (recoloured, Glencraft scales) | Parasaurolophus (Animated Dinosaur Bundle) | Quaternius | https://poly.pizza/m/KeeQrrouRK | CC0 1.0 |
| dino_stego.glb | Stegosaurus (recoloured, Glencraft scales) | Stegosaurus (Animated Dinosaur Bundle) | Quaternius | https://poly.pizza/m/eFcNbOlpvl | CC0 1.0 |
| dino_trike.glb | Triceratops (recoloured, Glencraft scales) | Triceratops (Animated Dinosaur Bundle) | Quaternius | https://poly.pizza/m/IGvrUqGrRM | CC0 1.0 |
| dino_raptor.glb | Gallimimus, Compsognathus and Baryonyx (rescaled and recoloured) | Velociraptor (Animated Dinosaur Bundle) | Quaternius | https://poly.pizza/m/cnlGH2UcDd | CC0 1.0 |
| dino_trex.glb | Allosaurus (recoloured) | T-Rex (Animated Dinosaur Bundle) | Quaternius | https://poly.pizza/m/UYtneO5FpF | CC0 1.0 |

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
