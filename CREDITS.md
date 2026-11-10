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

## v1.2.6x Album batches 2+ (unpublished)

- Batch 2 fills previously falling-back contexts and is on this branch only, not in the live 1.2.54 release: `drove_road` (day), `peat_fire` (night), `purple_chamber` (purple crystal cave), `white_pass` (snow), `long_sand` (desert), `red_horizon` (Mars), `between_worlds` (deep space), `down_among_the_reeds` (underwater). Same through-composed, sample-layered production as batch 1. Purple Chamber is a darker beatless sibling of Blue Vault (choir pad, glassy bells, drone, cavernous reverb). No piano-led writing.
- Batch 3, also unpublished: `below_the_map` (hell / void, beatless), `open_sketch` (creative), `inner_sun` (warmer beatless Agartha companion), `pine_shelter` (day), `owl_hour` (night), `claymore` (combat; tense written percussion, not hardcore), `starlight_show` (original dance-pop when near the pop star; the player ducks or skips it while her diegetic song is playing), `last_light` (credits reprise of the Glen theme). `detectContext` now returns `combat`, `popstar` and `credits`.
- Batch 4, also unpublished: `moor_light` (moor biome), `midday_glen` (brighter day), `bothy_smoke` (warmer indoor-adjacent day), `northern_quiet` (still night), `ridge_wind` (high / ridge biome), `stone_memory` (older beatless Agartha), `boss_of_the_glen` (Ember Wyrm / boss; Glen motif in the bass), `crystal_hunt` (crystal-cave combat, liminal colours under a written pulse). `detectContext` now returns `moor`, `high`, `pine`, `boss` and `crystal`.
- Renderers: `tools/audio-source/render-album-batch2.py`, `render-album-batch3.py`, `render-album-batch4.py`. Later batches (original hardcore album sides) remain listed in `tools/audio-source/TRACKLIST.md`.

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
