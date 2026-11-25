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

## v1.2.134 Volcano eruption upgrade

- Code only: the existing V1300 eruption is upgraded in place (full-mouth fountain, molten shader, bombs, overflow streams, shockwave, haptics). Flag __noErupt1379 brings back the old jet. No new artwork files.

## v1.2.133 First-person arms

- Code only: first-person glove seats, linen cuff visibility and empty-hand cleanup on the existing __fpa / 1285 rig. No new models, textures or sounds. Flag: window.__noArm1373 = 1 puts the previous seats back.

## v1.2.132 Menu theme and Scottish birds

- Menu theme (`music/menu_theme.ogg` and `.mp3`): an original remix made for Glencraft from its own tracks — `music/album/the_glen_opens`, `music/glencraft_theme_extended.mp3`, `music/highland_mist.mp3`, `music/glen_dawn.mp3`, `music/heather_air.mp3` and `music/old_pine.mp3`. No outside music.

- Outdoor bird one-shots in `assets/sfx/birds1377/` are real recordings with a CC0 or CC-BY licence (no NC or ND). CC-BY recordings are credited below. The old synthesised birds stay in the code behind `__noBird1377`.

  CC-BY recordings:
  - `wren.ogg` — "Eurasian Wren close CLEAN 1124AM 220124_0326.wav" by klankbeeld, https://creativecommons.org/licenses/by/4.0/. Source: https://freesound.org/people/klankbeeld/sounds/616767
  - `blackbird.ogg` — "Common Blackbird song (Turdus merula)" by Diana Tudor, https://creativecommons.org/licenses/by/4.0/. Source: https://commons.wikimedia.org/wiki/File:Common_Blackbird_song_(Turdus_merula).ogg
  - `song_thrush.ogg` — "Song Thrush processed.wav" by evernaut, https://creativecommons.org/licenses/by/4.0/. Source: https://freesound.org/people/evernaut/sounds/35721
  - `great_tit.ogg` — "Great Tit song.mp3" by Gaina, https://creativecommons.org/licenses/by/4.0/. Source: https://freesound.org/people/Gaina/sounds/89952
  - `curlew.ogg` — "curlew River ScheldeNL 751AM 210303_0264.wav" by klankbeeld, https://creativecommons.org/licenses/by/4.0/. Source: https://freesound.org/people/klankbeeld/sounds/565300
  - `snipe.ogg` — "Common Snipe (Gallinago gallinago)" by The British Library (via Wikimedia Commons), https://creativecommons.org/licenses/by/4.0/. Source: https://commons.wikimedia.org/wiki/File:Common_Snipe_(Gallinago_gallinago)_(W_GALLINAGO_GALLINAGO_R3_C5).ogg
  - `yellowhammer.ogg` — "2012_04_14_Yellowhammer.wav" by reinsamba, https://creativecommons.org/licenses/by/4.0/. Source: https://freesound.org/people/reinsamba/sounds/152224
  - `lapwing.ogg` — "Lapwing.wav" by juskiddink, https://creativecommons.org/licenses/by/4.0/. Source: https://freesound.org/people/juskiddink/sounds/72560
  - `buzzard.ogg` — "Female Common Buzzard calling" by johnmessingham, https://creativecommons.org/licenses/by/4.0/. Source: https://freesound.org/people/johnmessingham/sounds/508873
  - `oystercatcher.ogg` — "Eurasian Oystercatcher 804PM 210626_0299.wav" by klankbeeld, https://creativecommons.org/licenses/by/4.0/. Source: https://freesound.org/people/klankbeeld/sounds/615621
  - `gull_bh.ogg` — "Mouette rieuse - Chroicocephalus ridibundus" by Simon Elliott, https://creativecommons.org/licenses/by/4.0/. Source: https://commons.wikimedia.org/wiki/File:Mouette_rieuse_-_Chroicocephalus_ridibundus.wav
  - `crossbill.ogg` — "Loxia curvirostra.mp3" by goran1709, https://creativecommons.org/licenses/by/4.0/. Source: https://freesound.org/people/goran1709/sounds/240249
  - `golden_eagle.ogg` — "Golden eagle.ogg" by Bubulcus, https://creativecommons.org/licenses/by/3.0/. Source: https://commons.wikimedia.org/wiki/File:Golden_eagle.ogg
  - `stonechat.ogg` — "20130418_stonechat.08.flac" by dobroide, https://creativecommons.org/licenses/by/4.0/. Source: https://freesound.org/people/dobroide/sounds/185511
  - `whitethroat.ogg` — "Sylvia communis" by Justin Jansen, https://creativecommons.org/licenses/by/3.0/. Source: https://commons.wikimedia.org/wiki/File:Sylvia_communis.mp3

  CC0 / public domain recordings:
  - `robin.ogg` — "Robin song (Erithacus Rubecula)" by Sacha.Julien. Source: https://freesound.org/people/Sacha.Julien/sounds/725024
  - `chaffinch.ogg` — "Common Chaffinch (Fringilla coelebs) song" by Sacha.Julien. Source: https://freesound.org/people/Sacha.Julien/sounds/725328
  - `nuthatch.ogg` — "Eurasian Nuthatch.wav" by rjbaker_uk. Source: https://freesound.org/people/rjbaker_uk/sounds/680657
  - `woodpecker.ogg` — "CourtshipDrummingOfWoodpecker.wav" by JKata. Source: https://freesound.org/people/JKata/sounds/620236
  - `blue_tit.ogg` — "Blue Tit and Great Tit" by naturenotesuk. Source: https://freesound.org/people/naturenotesuk/sounds/427402
  - `skylark.ogg` — "Single Skylark" by Kinoton. Source: https://freesound.org/people/Kinoton/sounds/387426
  - `cuckoo.ogg` — "CUCKOO - 3" by SamuelGremaud. Source: https://freesound.org/people/SamuelGremaud/sounds/517780
  - `corn_bunting.ogg` — "Miliaria calandra.ogg" by unknown (public domain). Source: https://commons.wikimedia.org/wiki/File:Miliaria_calandra.ogg
  - `reed_warbler.ogg` — "reed warbler sings in the windy reeds" by Garuda1982. Source: https://freesound.org/people/Garuda1982/sounds/572502
  - `sedge_warbler.ogg` — "Sedge Warbler" by SiliconeSound. Source: https://freesound.org/people/SiliconeSound/sounds/475048
  - `raven.ogg` — "Common Raven - Yellowstone National Park" by Nivatius. Source: https://freesound.org/people/Nivatius/sounds/519591
  - `corncrake.ogg` — "Corn crake voice" by Kedziorek1998d. Source: https://commons.wikimedia.org/wiki/File:Corn_crake_voice.ogg
  - `gull.ogg` — "Herring Gull 1.wav" by Canardo55. Source: https://freesound.org/people/Canardo55/sounds/538016
  - `owl.ogg` — "Tawny owl.wav" by Elanor1995. Source: https://freesound.org/people/Elanor1995/sounds/688869

## v1.2.131 Gold logo on the loading screen and page icon

- The existing chunky gold Glencraft logo (from 1.2.112) now sits in the page from the first paint, including the boot screen before the late scripts finish, and is used for the page icon, Apple touch icon, manifest icons and the share image. The older drawn wordmark stays in the file and is only hidden. No new logo artwork.

## v1.2.48 audio and pig skin
- Birdsong, the Calm soundtrack beds (outdoors day and night, cave level 1, blue cave, purple cave, deep hell cave), rare cave one-shots, the UFO hover hum, the quieter pig voices (oink, snuffle, happy grunt, hurt squeal), and the Happy Hardcore drums, hoover, supersaw and piano (170 BPM remix) are all original procedural Web Audio synthesis made for Glencraft. No recordings or third-party samples.
- The Classic soundtrack restores Glencraft's own original mp3 themes from v0.9.9–v1.0.105 (`music/highland_mist.mp3`, `glen_dawn.mp3`, `loch_night.mp3`, `heather_air.mp3`, `under_the_glen.mp3`, `glencraft_theme_extended.mp3`, `old_pine.mp3`, `skye_embers.mp3`, `stone_and_peat.mp3`, `cairn.mp3`, `ember_sea.mp3`). These were removed as unused in v1.0.105 and are brought back in 1.2.48. The Happy Hardcore remix layers slices of those same tracks over the procedural beat. No outside copyrighted music.
- `assets/tex/pig2_2k.webp` and `assets/tex/pig2_4k.webp` (v1.2.48): the existing pig colour textures, regraded to a slightly more pinkish farm-pig skin with pores, fine bristles and light dirt only on the legs and belly. Still based on the v1.1.23 upscale of the player-supplied pig2 texture (see Pig model v1.0.109). No other source.

## v1.2.130 Sunset sky stays behind the land

- Code only: the painted sunset plate is now depth-tested and written at the far plane, the usual way a sky is drawn. No new artwork.

## v1.2.129 The land matches the painted map, regional woods

- Code and data made for the game: the land mask and map registration were measured from the player's own painted UK map (assets/ui/uk-hand-map.webp) and the existing generated terrain. No outside data or artwork added.

## v1.2.128 Smooth map zoom, castle drawings

- Code-only. The castle drawings on the map are in-game vector art drawn by the game code (no images, fonts or outside artwork). The map itself is unchanged (the player's own painted UK map).

## v1.2.126 England, Wales and Ireland relief

- Height data: ETOPO1 1 Arc-Minute Global Relief Model (ice surface), NOAA National Centers for Environmental Information (formerly NGDC). Amante, C. and B. W. Eakins, 2009, NOAA Technical Memorandum NESDIS NGDC-24. Downloaded from NOAA ERDDAP (etopo180). Licence: "The data may be used and redistributed for free" (US Government data, no warranty). Only land south of 55.9N was kept, resampled to whole metres/4 and stored inline in index.html.
- Coastline unchanged (Natural Earth 1:50m, public domain). Painted-map guide unchanged (the player's own map).

## v1.2.125 Pistol hands closed

- Code-only: preset finger-curl tables on the existing first-person glove bones (from the earlier first-person hands credits). No new textures, models or sounds.

## v1.2.124 Pistol reload rebuilt

- Code-only: the reload moves the pistol's existing magazine, slide and glove models (from the earlier pistol and first-person hands credits). No new textures, models or sounds.

## v1.2.123 Bigger, clearer held map, full-screen map, rifle walnut restored

- `assets/ui/uk-hand-map-hd.webp` (v1.2.123): a 1200x1648 copy of the player's own painted UK map (the same artwork as `assets/ui/uk-hand-map.webp`, from the full-size original the player supplied), with the old Borders castle marker removed as in v1.2.117. No other source.
- The rifle textures are the existing 1.2.119 rifle wood and steel maps, re-applied in game. No new textures, models or sounds.
- Everything else is code-only.

## v1.2.122 Taller mountains, white snow, purple heather

- Code-only: world height, terrain shaping and colour grading changes; the heather texture is re-toned in game from the existing one. No new textures, models or sounds.

## v1.2.121 Smoother frame rate near the hamlets

- Code-only fix: the timber wall texture is set once instead of being swapped between two in-game painted versions. No new textures, models or sounds.

## v1.2.120 Graphics edition, map-guided terrain, farmer hamlets

- The clear-day lighting is the game's own code: lights, fog and sky colours, and a saturation step after the existing ACES tone mapping. No new textures.
- New worlds use the hand-painted UK map already in the game (`assets/ui/uk-hand-map.webp`, see v1.2.117) as a large-scale guide. Three small blurred masks for mountains, heather and forest are made from its colours and stored in the code. No other images are used.
- The farmer hamlets are built only from existing blocks (alder logs, yew and rowan planks, cobblestone, gravel, oak, thistles). No new models or textures.

## v1.2.119 Minecraft-style UK terrain, cumulus clouds, map-based woods

- The cumulus cloud sheet is original procedural artwork painted in game (tileable value-noise fBm on a canvas) and drawn on a sky dome as a classic planar cloud layer. No outside images.
- On new twice-scale worlds the woods follow a map of Scotland worked out from the game's own latitude and longitude, and steep mountainsides use the game's existing stone, gravel and red sandstone blocks in layered bands. No new textures or models.

## v1.2.117 New hand-drawn UK map when you hold the map

- The map you hold in your hand now shows the hand-drawn UK chart, with the labelled woods, highlands and the gold frame. Your position marker stays on it. The old generated chart is still in the code, hidden under this picture.

## v1.2.115 Singer you can place on any block to dance

- The pop star is now a cup-sized Singer item (about a third of a block tall). Press LT (right-click, or tap Place) to put her on top of any block; she struts round that one block doing her dance to a quiet loop of her song. Hit her to pick her up again. The giant pop star no longer roams the glen. Her model and song are the original Glencraft ones from v1.2.51.

## v1.2.114 New twice-scale worlds play as soon as the land around you is ready

- Creating a new twice-scale Highlands Survival world no longer sits on the loading screen after the land itself has been built. Trees, keeps and the wider country finish loading in the background, so you can walk as soon as the ground around spawn is meshed. Older saved worlds are unchanged.

## v1.2.112 Time-of-day skies and a literal overworld sunset plate

- Each realm keeps its own sky. In the Highlands the sky now shifts through the day: a warmer sunset of deep orange, pink and purple with a golden glow at the horizon, and a dark starry night.
- Egypt land has a real desert sky: clear blue fading to a hazy sandy horizon by day, orange and pink at sunset, and a dark starry night.
- Clouds are raymarched 3D volumes — white with grey bases by day, orange and red edges with purple undersides at sunset, dark at night. The desert stays mostly clear. A Clouds Low, Medium or High setting is in the pause menu (phones and Performance mode default to Low; other devices default to Medium). Low keeps the cheaper sun-lit impostor layer.
- Hell, Agartha and the other realms keep their own skies.

## v1.2.111 New-world load and title wallpapers

- Starting a new twice-scale Highlands world no longer holds two full world arrays at once (that peak could stop the world loading on a phone). The loading screen stays up until the land around spawn is meshed.
- The title menu slideshow uses six new 16:9 highland pictures (1920×1080 WebP on phones; 3840×2160 when the screen width times device pixel ratio is 2560 or more). The seventh title slide (red-sky castle with a portal) and the castle, isle and mossy screen backgrounds have been removed. Remaining menu screen backgrounds use the updated sunset picture only. Older 864 saves are unchanged.

## v1.2.110 Jagged Highland peaks, summit snow

- New twice-scale Highlands worlds have taller jagged rock peaks and deep glens. Snow sits only on the true summits and north-facing tops, and the steep faces are grey and dark rock rather than a sheet of snow.
- Starting a new bigger world still takes about as long as 1.2.109. Walking those worlds stays in line with the smaller ones. Older 864 saves are unchanged.

## v1.2.109 Smoother big Highlands, snow on the peaks

- On twice-scale Highlands worlds, walking frame times stay in line with the smaller worlds. A heather search that used to scan the whole map while you walked now only looks near you.
- Snow stays on the high ridges and peaks; mid slopes are heather and grass again, so the country reads as green glens and sea lochs rather than a sheet of snow. Older 864 saves are unchanged.

## v1.2.108 Bigger-scale Scotland

- New Highlands worlds are twice the scale (more blocks between real places), with spawn on Loch Ness in the Great Glen, snowy jagged highlands, sea lochs, denser pine woods and Ben Glencraft near the glen.
- Older saved worlds keep their original size and land. The held map still shows the whole country and is still built once per world in the background.

## v1.2.107 Held map shows the new UK terrain

- When you start a new world, the map in your hand is drawn from the real generated land (Scotland's rivers, village and volcanoes, plus the rest of the UK and Ireland), not the old height-only chart.
- The map is still built once per world in the background, so frame times stay at the 1.2.106 level.

## v1.2.106 Smoother frames in caverns and halls

- A hall-repair pass that reran every frame after the 1.2.102–1.2.103 cave updates is stopped, so frame times stay lower and steadier.
- Deep remesh is cheaper. Ravines, deep caverns, Highland peaks, streamed England/Ireland/Wales land, volcano eruptions, and cave moss are unchanged.

## v1.2.105 Green moss in deep caves

- Hanging moss in deep caves no longer shows as a white glitched placeholder; it renders as proper green moss. Rope is fixed the same way.
- Cave halls, Highland peaks, streamed England/Ireland/Wales land, and volcano eruptions are unchanged.

## v1.2.104 Smoother frames after the caverns and peaks updates

- A remesh loop that stacked work the longer you played after 1.2.100–1.2.103 is stopped, so frame times stay level.
- Cave and village torches share a merged model, so those lights cost far fewer draw calls. The flame and glow are still there.
- Ravines, deep caverns, Highland peaks, streamed England/Ireland/Wales land, and volcano eruptions are unchanged.

## v1.2.103 Wide river hall, generated deep caverns and a jagged Highland ridge

- The underground river hall is a wide multi-arch colonnade over blue water, with a grass lid, hanging moss and lamps.
- Deep caves players can actually find include a lush moss chamber with a cyan pool, a dark hall of long cyan crystal spikes, and a basalt mines cavern with a magma river and plank walkways. Block textures 401–412 no longer show white faces or scribble veins.
- New and reset Highlands worlds have a taller jagged northern stone ridge above heather and sea. Ben Glencraft stays the highest added peak.
- England, Ireland and Wales on the land beyond the main Highlands map are unchanged. The 1.2.101 volcano work is unchanged.

## v1.2.102 Deep caves, river arches, northern crags and UK biomes

- The underground river hall has stone arches over blue water, a grass lid, hanging moss and lamps.
- Deep cave layers can be seen in first person: mossy green caves, dark crystal halls, and wooden mines with magma.
- New and reset Highlands worlds have sharper snowy crags in the far north. Ben Glencraft stays the high volcano south of spawn.
- England, Ireland and Wales have their own look on the land beyond the main Highlands map.

## v1.2.101 Volcano eruptions

- Every lava crater can erupt from its real crater on the ground; the old mid-air volcano no longer erupts.
- Ben Glencraft, a bigger volcano, stands about 180 blocks south of spawn.
- Eruptions rumble, the crater lava sinks then gushes up under a black ash cloud, and long lava floods cool to basalt and obsidian. No blasts or lava bombs.

## v1.2.100 Blue spawn river, sea cliffs and northern snow

- The river at spawn is clearly blue.
- New and reset Highlands worlds have steeper sea cliffs with columnar basalt, and the edge-isle keeps sit more naturally on the coast.
- The far north of the map holds snowy highland ground.

## v1.2.99 Surface ravines and spawn village

- New and reset Highlands worlds have visible ravines and cave openings on the surface, joining the underground cave network.
- A small village stands at spawn, with wooden cottages, gravel paths, flowers and a winding river. The player starts on solid ground on the path by the houses.

## v1.2.98 First-person fingers

- First-person fingers and the pickaxe grip are back to how they were in 1.2.94.
- The held map still shows on screen.

## v1.2.97 Castles, Egypt portal and underground blocks

- The three keeps sit on the official map-edge isles, away from spawn, and the ground at spawn is solid grass and dirt.
- The desert, pyramid and ruined temple are no longer generated in the Glencraft overworld. They live only in Egypt land, reached through a gold portal at the clan castle.
- Garrison skeleton and clan-folk counts stay at the earlier published numbers (black 100, mossy 50, human 25) and they remain at their own keeps rather than crowding spawn.
- New underground blocks 401–412 (moss, hanging moss, cyan vein, gold drip, dark stone, basalt, magma vein, purple crystal, purple spiral, core glow, mine plank, rope) for the cave layers under the UK.

## v1.2.96 Egypt land paintings, saucer and sky

- The player's UFO and alien paintings (`assets/art/user_p1-6.jpg`, drawn by the player) hang again in the pyramid gallery in Egypt land, together with the original hall murals. They had been hidden since Egypt became its own dimension in v1.2.69.
- The Agartha saucer now flies to the sand realm at night and does not appear in the Glencraft overworld.
- Egyptians only spawn and stay visible in the sand / temple realm.
- Egypt land has its own desert sky and matching fog (deep blue day with a hot sun and a slight dust haze, orange-pink sunrise and sunset, a dark clear starry night). The Glencraft, Agartha and space skies are unchanged. The existing WebGL1 sky dome is re-tinted; no new heavy shaders.

## v1.2.92 Controller inventory

- Fixed the controller inventory freeze. You can move around the menu and close it again.

## v1.2.91 Highlands caves

- Caves on the Highlands now connect into one network, opening into bigger caverns the deeper you go.
- Ravines and sinkholes open from the surface across the UK map and lead down into that network.
- There are now caves under the water, sealed or flooded so the sea doesn't leak.
- Rare ores like diamond, gold and silver are more common the deeper you go.

## v1.2.90 First-person reload hands

- First-person hands now stay on the pistol and musket during reloads.

## v1.2.89 Smoother, deterministic loading

- World generation is sliced so the loading percentage keeps ticking and never goes backwards, including during the last stretch while the land around you is being built. The label holds at 99.x until the world can actually appear, then glides to 100.
- The same seed always produces the same world, even when loading yields to the browser.

## v1.2.88 First-person hands and loading bar

- First-person hands use the smooth third-person glove mesh with knuckles, tendons, creases and nails shaded into the skin. The older blocky prism pieces stay in the mesh but are hidden. Local third-person arms and gloves are hidden in the first-person camera only; nothing is deleted.
- The loading bar's fill and shimmer run on the compositor, so the meter keeps moving during long tasks instead of looking frozen. The percent label still counts up from elapsed time and glides to 100 when the world is ready.

## v1.2.87 Loading bar

- The loading bar fills on a time curve for the whole load, so it keeps moving instead of sitting at 84% while the world finishes. After a hitch it catches up at most 8% per second, and the last stretch creeps toward 99 until the world is ready.

## v1.2.86 Smoother performance

- The game runs more smoothly: first-person arm movement no longer piles up extra work while you play (the 1.2.80–1.2.82 sculpt wrappers were wrapping each other every second), and the crafting grid is only rebuilt when recipes actually change.
- Skeleton bone textures are uploaded only when the pose changes.
- Quality now follows your display's refresh rate, with no frame-rate cap: when the GPU is busy the game lowers pixel ratio first, then trims the stream radius by at most one chunk, and restores them when there is headroom. The older c79 dynamic-resolution path stands down.

## v1.2.85 Original shirt sides

- The 1.2.84 stitched side bridges and their side glow are replaced with the original 1.2.36 scottish-base-v1 shirt side and stomach geometry (SHIRT_|_sewn_torso_with_open_throat, plus the far-LOD visual_torso_outfit), skinned to the current torso bones and aligned to the current shirt so there are no gaps or z-fighting.
- The 1.2.84 width/depth scale is off so the chest matches the original 1.2.36 shape. Sash-back hide and first-person-only torso hide are unchanged. Nothing on the player is deleted.
- First-person hands now use the same third-person hand mesh and HeadSkin shading, attached to the existing __fpa wrist and coming out of the cream linen cuff. The old box and tube first-person hand pieces are hidden, not deleted. The cloned third-person forearm skin is clipped in first person only so the linen sleeve shows at the wrist. Fingers curl around each held item. On the first-person clone only, knuckles, tendons, creases and nails are shaded into the smooth skin (the older blocky prism pieces stay in the mesh but are hidden). Animations, torch and pick jitter, and third-person hands are unchanged.
- The world loading bar fills smoothly like liquid and keeps moving while the world is built. New worlds also load faster, because the game can keep drawing the bar during generation and no longer stalls the meter. Terrain work yields cooperatively and post-column wrappers are sliced so the bar rises without jumps.

## v1.2.84 Chest restored with volume

- The scottish-base-v2 shirt has been a separate front and back panel since 1.2.37 (open sides from hem to armpit, open henley slit). The gaps are now zipped from the shirt's own boundary vertices (same positions and skin weights); nothing is rebuilt or deleted.
- Shirt core widened and deepened by spine/pelvis skin weight (width x1.38, front x1.34, back x1.18); sash and buttons follow the same mapping.
- Side fill shading matched to the front (edge normals, faint cream glow); sash hidden behind the back mid-plane by discard.
- Torso fill hidden only for your own first-person camera.

## v1.2.83 Tartan colour, clear first-person view, finished hands

- Kilt and sash tartan no longer render black: the time-box clip patch (1.2.64) dropped each material's shader cache key, so the tartan and hand skin shared a world shader without the display colour transfer. The previous key is kept now.
- Kilt, belt and sporran are hidden only from your own first-person camera, like the torso.
- Third-person hands: baked knuckle creases, fingernails and gauntlet joint seams through shading, with no added triangles.

## v1.2.82 Smooth first person, chest restored

- Fixed the first-person slideshow from 1.2.81: the view-model cull no longer re-runs the arm rig for every mesh, and the pickaxe hand pass scans once per frame.
- The player chest (white shirt and sash) draws as it did in 1.2.61 in third person; it is hidden only from your own first-person camera. No body geometry is deleted.
- Pickaxe fist a little lower; musket hip dark blob hidden.

## v1.2.81 First-person pickaxe grip

- In first person, the pickaxe is held in a closed fist at a proper angle and follows the mining swing.

## v1.2.80 First-person hands

- In first person, the pickaxe fist comes in from the bottom-right corner.
- The pistol is lower and bigger in first person.
- Tools have cream linen sleeves.

## v1.2.79 Map in hand, forearms, right-hand items

- Map is held in the hand: thumb on the sheet, tilted up so you can read it.
- First person: your hands now have forearms and sleeves.
- Third person: held items are in the right hand.

## v1.2.78 Less lag, deeper ores, no deep-cave portals

- Less lag: rain, drops, animations and mobs only run near you.
- Ores get more common the deeper you go; diamonds common near y -200.
- Removed obsidian/gold portal blocks from deep caves.

## v1.2.77 Reverted 1.2.76 cave/view-distance changes (lag)

- Reverted 1.2.76 cave/view-distance changes (lag).

## v1.2.76 Map is now held in your hand

- Map is now held in your hand.
- Cave walls no longer go see-through; longer view distance.
- First-person hands stay hidden in third person. The gold D-pad is left alone.

## v1.2.75 Guns restored to how they were in 1.2.73

- Guns restored to how they were in 1.2.73.
- Fix: the pickaxe, bucket and torch sit still in your hand, on-screen, and the pickaxe head stays on the handle.
- Fix: the map in your hand is still a working map. It shows the land, updates with your position and heading, and is tilted up and close so you can read it.
- First-person hands stay hidden in third person. The gold D-pad is left alone.

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
