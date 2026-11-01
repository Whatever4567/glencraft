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
| pig.glb | pig | Pig | Quaternius | https://poly.pizza/m/u35l6uP5vj | CC0 1.0 |
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
Cleaned, trimmed and normalised by Glencraft (site/assets/sfx/sheep1-4.ogg, pig1-4.ogg). Sources on Wikimedia Commons:
- sheep1: "Sheep bleat.ogg" by InverseHypercube - CC0 - https://commons.wikimedia.org/wiki/File:Sheep_bleat.ogg
- sheep2: "Mudchute sheep 1.ogg" by Secretlondon (Mudchute City Farm, London) - CC BY-SA 3.0 - https://commons.wikimedia.org/wiki/File:Mudchute_sheep_1.ogg
- sheep3: "Sheep bleating.ogg" by earthcalling - Public domain - https://commons.wikimedia.org/wiki/File:Sheep_bleating.ogg
- sheep4: "Lamb bleating and its mother's response.flac" by Yosef Ben Melamed - CC BY-SA 4.0 - https://commons.wikimedia.org/wiki/File:Lamb_bleating_and_its_mother%27s_response.flac
- pig1-3: "Mudchute pig 1/2/3.ogg" by Secretlondon (Mudchute City Farm, London) - CC BY-SA 3.0 - https://commons.wikimedia.org/wiki/File:Mudchute_pig_1.ogg (and _2, _3)
- pig4: "Pig grunt - Erdie.ogg" by Erdie (Freesound) - CC BY 3.0 - https://commons.wikimedia.org/wiki/File:Pig_grunt_-_Erdie.ogg
The modified CC BY-SA clips are shared under the same licence.

## Alien encounter voice and music (v1.0.66)
- Voice: original lines synthesised with Piper TTS using the en_US LJSpeech voice (LJ Speech dataset, public domain - https://keithito.com/LJ-Speech-Dataset/), then pitched up, vocoded, ring-modulated and glitched by Glencraft. site/assets/sfx/alien/*.ogg
- Music: site/assets/sfx/alien/music.ogg, an original track synthesised by Glencraft from scratch (pad, beat, riser) plus chops of the voice above.
- The lines paraphrase public statements: David Grusch (House Oversight hearing, 26 July 2023), Cmdr David Fravor (same hearing; USS Nimitz 2004), Ryan Graves (same hearing), Luis Elizondo (former AATIP head, public interviews). Paraphrases, not quotes.

## v1.0.69
- assets/music/desert.ogg and assets/music/dance.ogg - original compositions made for Glencraft (synthesised oud, qanun, ney, drone, darbuka and riq; 96 and 97 BPM). No samples from other songs.
- assets/sfx/alien/b1.ogg and the regenerated alien lines - Piper TTS with the LJSpeech voice (public domain), processed with our own vocoder, echo, chorus and reverb.
- Pig model: Quaternius animated pig (CC0), re-textured with the players own pig photo.
- `assets/flow/water_n.jpg` - water normal map from the three.js examples (`examples/textures/waternormals.jpg`), three.js authors, MIT licence. Resized to 256 px.
- `assets/flow/lava_c.jpg` - "Lava004" by ambientCG (https://ambientcg.com/view?id=Lava004), CC0 1.0. Resized to 256 px.
- `assets/music/dance.ogg` (v1.0.78) - original Egyptian dance tune (97 BPM, Phrygian dominant, flute, oud, hand drums), generated for Glencraft by `musicgen/arab_gen.py`. No third-party melody or samples.
- `assets/music/temple.ogg` - original Egyptian temple / desert biome tune, generated by `musicgen/arab_gen.py`. No third-party melody or samples.
