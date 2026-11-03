# Glencraft code map

How the game is built and where each part lives.

## Build

- Base game: `/workspace/s1_0968final.js` (v0.9.68 single file, not in this repo).
- `build87.py` applies the string patches in its `R` list to the base, then appends every module listed in `src/ORDER.txt`, in that order, into `s1.js`.
- `build.py` puts `s1.js` into `site/index.html`; `extract_inline.py` moves inline images to `site/assets/x`.
- `ship250.sh` runs the whole build, sets the version and the patch notes. Run: `git -C site checkout index.html -q; bash ship250.sh`.
- Order matters: later modules wrap functions from earlier ones (for example `renderer.render`, `buildChunk`, `cullChunks`). Add new modules at the end of `src/ORDER.txt` unless they must run earlier.
- Each module is one self-running function that keeps its state on `window.__cNNN` (the old part number) so other modules and test probes can find it. Those names did not change.

## Folders

- `src/ui/` (32): Menus, settings, loading, worlds list, phone layout, touch and controller UI
- `src/items/` (43): Items, tools, guns, blocks, crafting, held models and icons, the held map
- `src/mobs/` (46): Mobs, animals, people, HD models and their animation and voices
- `src/audio/` (6): Music and sound effects
- `src/world/` (56): Glencraft (Scotland) world generation: terrain, caves, castles, islands, water, weather
- `src/hell/` (7): Hell (nether) dimension
- `src/space/` (23): Space, planets, the saucer and aliens, the player UFO
- `src/agartha/` (6): Agartha and the hollow Earth
- `src/earth/` (18): The world past Scotland: UK and Ireland land, sea, Earth layers, chunk streaming
- `src/render/` (1): Rendering performance

## Modules in build order

| # | Module | Was | Lines | What it does |
|---|---|---|---|---|
| 1 | `items/gamepad_tv_library.js` | c90 | 345 |  |
| 2 | `items/tv_video_remote.js` | c91 | 221 |  |
| 3 | `items/ds_on_tv.js` | c92 | 114 |  |
| 4 | `ui/normal_world_list_again.js` | c94 | 103 | the normal world list again - many worlds on this device (IndexedDB 'glencraft-saves'), create play delete (with Yes No). |
| 5 | `ui/loading_robust.js` | c97 | 18 | minimap + full map removed; world loading made robust |
| 6 | `items/castle_double_doors_two.js` | c98 | 27 | castle double doors - two doors side by side work as a pair (mirrored hinges, open together) |
| 7 | `ui/load_safe_mode.js` | c99 | 82 | load safe mode + catching a frozen load on the next start |
| 8 | `mobs/two_clansmen_looks_painted.js` | c100 | 186 | the two clansmen - new looks with painted faces + moods, gruff Scottish voices (synthesised), trading for rubies |
| 9 | `world/castles_corners.js` | c101 | 172 | castles in three corners; the MHkitpvp island stamped at spawn; designed trees from the tree pack (new worlds only) |
| 10 | `items/jetpack_chestplate_slot.js` | c102 | 272 | jetpack (chestplate slot) |
| 11 | `world/spawn_island_look.js` | c103 | 198 | spawn island looks like Glencraft (log trees, natural blocks, deeper sea), longer days and nights, mocap-driven zombies and skeleton archers |
| 12 | `items/ores_depth_coalironsilver_everywhere.js` | c104 | 259 | ores by depth (coalironsilver everywhere, lapis low, gold just above diamonds, diamonds by bedrock) + ore seams on cave walls; a new raw-silver icon |
| 13 | `items/cobalt_tools_can_t.js` | c105 | 187 | cobalt tools can't be crafted, pause-menu "Reset world" live event |
| 14 | `mobs/mob_collision_treeman.js` | c106 | 91 | mobs can't walk into you, Treeman face-to-face death stare + huge throw |
| 15 | `items/glencraft_ore_textures_iron.js` | c107 | 143 | new Glencraft ore textures - iron, silver, gold, cobalt and lazurite each look like themselves (drawn in code over the game's own stone) |
| 16 | `world/block_sky_light.js` | c108 | 20 | Minecraft-style block + sky light |
| 17 | `items/quick_torch_placed_left.js` | c109 | 39 | quick torch is placed with the LEFT hand |
| 18 | `mobs/skeleton_arrows_hit_mobs.js` | c110 | 70 | skeleton arrows hit mobs in the way; a shot giant spider slams the skeleton to bits |
| 19 | `mobs/hamish_angus_yap_like.js` | c111 | 89 | Hamish & Angus yap like villagers (procedural Scottish gibberish), and hit back once if you hit them |
| 20 | `items/held_map_hd_tools.js` | c112 | 252 | held map (already explored, castles marked), HD tool models + icons from them, fewer tools |
| 21 | `world/mainland_islands.js` | c113 | 374 | round mainland + three castle islands with styled bridges, spawn houses gone, crofts with farmers; big level-30 chime |
| 22 | `ui/patch_notes.js` | c114 | 159 | Patch notes are back - title + pause menu, in-game panel, controller scroll. Shows only NEW things. |
| 23 | `items/hd_jetpack_icon_rendered.js` | c115 | 35 | HD jetpack icon rendered from a 3D model of the worn jetpack (twin tanks, nozzles, straps, metal shading) |
| 24 | `mobs/cyborg_creeper_sos_siren.js` | c116 | 359 | cyborg creeper with SOS siren, zombified people, long-legged HD spiders, skeleton archer pose, haggis herds, faster pickaxes |
| 25 | `items/bookshelf_enchanting.js` | c117 | 257 | HD bookshelf + books, enchanting table with a working enchant menu, glint, cobalt pick 27, dim zombie eyes |
| 26 | `world/wet_mud_pools_hd.js` | c118 | 346 | wet mud pools, HD pigs that live at the pools and wallow in the mud |
| 27 | `items/baseball_bat_weak_blade.js` | c119 | 227 | Baseball Bat, Weak Blade, Fine Blade, real silver sword, the Bomb (replaces the claymore), the Lighter (replaces flint and steel) |
| 28 | `world/xp_tidy_spawn_mud.js` | c120 | 348 | XP across worlds, tidy spawn, wet mud, rubies, crafting tabs, HD blocks + icons, fangs, treeman face, butterfly swim |
| 29 | `items/lazurite_wood_hd_tiles.js` | c121 | 769 | lazurite replaces cobalt, iron becomes silver, wood types, HD tiles, ponds + ducks, bees, bag, jetpack slot, crisp held items |
| 30 | `items/textures_update_hd_painted.js` | c122 | 486 | textures update - HD painted icons + 3D card dropsheld items, sharper block textures, new HUD, real-world menu backgrounds, ALPHA tag, 3D spinner, log |
| 31 | `mobs/night_mobs.js` | c123 | 901 |  |
| 32 | `mobs/friendly_mobs_setting.js` | c124 | 31 |  |
| 33 | `mobs/wizard_duo_unicorn.js` | c125 | 220 |  |
| 34 | `mobs/biome_night_spawning.js` | c126 | 36 |  |
| 35 | `mobs/teleport_to_unicorn.js` | c127 | 50 |  |
| 36 | `ui/black_gold_theme_bold.js` | c128 | 230 | black + gold theme, bold font, coords, exact grass loading block |
| 37 | `ui/phone_layout_portrait_landscape.js` | c129 | 93 | phone layout (portrait + landscape, no page scroll) + mini Xbox touch controls |
| 38 | `items/spawn_eggs_mob_egg.js` | c130 | 82 | spawn eggs for every mob, egg mobs ignore spawn rules, creative no natural hostiles + persistent egg mobs |
| 39 | `world/worldgen_overhaul.js` | c131 | 206 | world gen overhaul - bigger land, solid sea beds, 4 ravines, caves only under land with no dead ends, big skull-dent entrance, no sky in caves |
| 40 | `audio/ambient_soundtrack.js` | c132 | 103 | relaxed ambient soundtrack - v1.0.14: remixes of the original Glencraft songs over the user's frequency tracks - the user's binaural tracks (assetsmus |
| 41 | `world/abandoned_mineshafts_c131_cave.js` | c133 | 32 | abandoned mineshafts for the new (c131) cave system - each one starts inside a connected cave tunnel |
| 42 | `world/flowing_water_sloped_surfaces.js` | c134 | 149 | flowing water - sloped surfaces, flow ripples, waterfalls with foam + splash, rivers from the hills to the lochs sea, gentle current |
| 43 | `mobs/hd_mob_models_cc0.js` | c135 | 90 | HD mob models - CC0 glTF (Quaternius via Poly Pizza), bundled, lazy + cached, animated; procedural mobs stay as the fallback |
| 44 | `mobs/hd_models_batch_glencraft.js` | c136 | 87 | HD models batch 2 + Glencraft dressing (palette recolours, tartan trews, tam o' shanters, sheep fleece colours) |
| 45 | `mobs/hd_models_batch_night.js` | c137 | 23 | HD models batch 3: night mobs (land floating), skull wisps, droplets |
| 46 | `mobs/hd_unicorn_white_horse.js` | c138 | 20 | HD unicorn (white horse + golden-pearl horn on the HD head bone) |
| 47 | `mobs/glencraft_look_hd_models.js` | c139 | 63 | Glencraft look for HD models: pixel-noise textures (nearest filter) on box-projected UVs |
| 48 | `mobs/per_mob_glencraft_styling.js` | c140 | 29 | per-mob Glencraft styling for the HD models (pattern per material + original colour identity) |
| 49 | `mobs/loch_unicorn_rideable_gets.js` | c141 | 12 | the loch Unicorn (the rideable one) gets the HD model too, with the Glencraft pixel look |
| 50 | `world/worlds_south_west_island.js` | c142 | 139 | new worlds - the south-west island becomes a sand island with a sandstone pyramid and a tomb under it, a moss hag's hut by the black castle, the longs |
| 51 | `mobs/spawn_rules_many_mobs.js` | c143 | 94 | spawn rules - many mobs egg-only, the rest each have one home (castles, the sand island, the tomb, the hut, the longship, rain, the nether, your death |
| 52 | `items/spawn_egg_lt_right.js` | c144 | 73 | ONE spawn egg - LT right-click tap Place opens a list of every mob (Enabled spawns in the world, Disabled egg only); pick one and it hatches where |
| 53 | `items/highland_musket_old_scottish.js` | c145 | 130 | the Highland musket - an old Scottish flintlock (no scope) + hold LT right mouse to aim down the iron sights |
| 54 | `mobs/hd_skeletons_hold_their.js` | c146 | 43 | HD skeletons hold their weapons again - bow (skeleton, blaze skeleton if it has one) and sword (black skeleton) ride the HD model's hand bone |
| 55 | `world/pyramid_island_island_round.js` | c147 | 62 | the pyramid island is its own island - a round sand isle with a clear sea channel all round it (solid seabed), and big ore-rich caverns under the pyra |
| 56 | `items/logs_placed_like_minecraft.js` | c148 | 82 | logs placed like Minecraft - upright, or lying along X Z by the face you click (kept in block data, saved); |
| 57 | `world/biome_has_scottish_undergrowth.js` | c149 | 94 | every biome has its own Scottish undergrowth - the tall grass of each wood grows as its own plant: |
| 58 | `world/castle_decor_props_banners.js` | c150 | 142 | castle decor props (banners, antlers, chandeliers, coffins, cages, throne...) - one atlas, two merged meshes per castle |
| 59 | `world/three_castles_rebuilt_block.js` | c151 | 147 | the three castles rebuilt block by block from the concept art (new worlds only) - builder kit + the clan castle |
| 60 | `world/clan_castle_great.js` | c152 | 142 | the clan castle's great hall + bedrooms, and the skeleton castle (ruin on a crag, crypt + archery range below) |
| 61 | `world/black_castle_images_spiky.js` | c153 | 104 | the Black castle (images 5-6) - spiky blackstone + obsidian gothic towers, glowing red windows, lava moat + bridge, scorched ground, the broken portal |
| 62 | `mobs/mob_voices_volume_slider.js` | c154 | 36 | Mob voices volume - its own slider in Settings, saved; every mob call, idle noise, hurt and death cry goes through a mob bus under the effects volume |
| 63 | `world/bridge_tidy_after_world.js` | c155 | 51 | bridge tidy - after all world generation, no lamp post floats off a broken bridge and no cut tree (logs leaves) hangs over a bridge or tunnel |
| 64 | `world/spawn_lava_back_safe.js` | c156 | 52 | the spawn lava is back (safe pools only), the Ghost is rare and only hunts what it can see |
| 65 | `mobs/classic_green_creeper_hd.js` | c157 | 86 | the classic green creeper, HD - clean four-legged shape, crisp pixel skin; it lives in the caves |
| 66 | `mobs/admiral_skelp_speaks_his.js` | c158 | 52 | Admiral Skelp speaks - his own voice clip, positional, through the Mob voices slider |
| 67 | `mobs/hd_bee_cc0_quaternius.js` | c159 | 8 | HD bee - CC0 Quaternius bee (flying, bite, hit, death clips) dressed in Glencraft honeybee colours and fur grain |
| 68 | `world/smoother_play_block_textures.js` | c160 | 23 | smoother play - block textures for the whole world are readied once at the start (no hitch on reaching a castle), frame-spike watch |
| 69 | `mobs/human_folk_then_they.js` | c161 | 78 | human folk now and then they dance (alone or in a group) to their own tune |
| 70 | `world/blood_red_sky_round.js` | c162 | 70 | blood-red sky round the black castle, red mist seen from afar; castles rebuilt in existing worlds |
| 71 | `ui/brightness_slider_settings_tabs.js` | c163 | 70 | Brightness slider, Settings in tabs (Audio Video Controls World), smaller HUD at the bottom with the item name above the hotbar, hazard creeper egg |
| 72 | `world/rain_back_better_fixed.js` | c164 | 77 | rain is back and better - fixed weather rolls, dense slanted rain round the camera, splashes, grey storm sky, sheet lightning, snow in snowy places |
| 73 | `mobs/dinosaurs_daytime_hd_dinosaurs.js` | c165 | 114 | DINOSAURS - daytime HD dinosaurs (CC0 Quaternius) living in their own habitats, capped, herbivores passive, one rare hunter |
| 74 | `mobs/dinosaur_voices_synthesised_calls.js` | c166 | 23 | dinosaur voices - synthesised calls per species, through the Mob voices bus |
| 75 | `hell/hell_overhaul_bigger_nether.js` | c167 | 74 | Hell overhaul 1 - a bigger nether (384 wide), four biomes, four gothic build sites carved into great caverns |
| 76 | `hell/hell_overhaul_gothic_builder.js` | c168 | 64 | Hell overhaul 2 - the gothic builder: blackstone cathedral-castles with tall spires, glowing red lancet windows, chains, lava moats and portals |
| 77 | `hell/hell_overhaul_build_decor.js` | c169 | 58 | Hell overhaul 3 - build decor meshes (red glass, chains, banners, braziers), saveload, existing Hells get the builds bit by bit, a blood-red sky and b |
| 78 | `hell/hell_overhaul_mobs_only.js` | c170 | 41 | Hell overhaul 4 - mobs only at the builds, each build its own: skeletons at the Cathedral (and the Wyrm's lair), ghosts over the Abbey's soul sand, im |
| 79 | `world/bridge_tunnels_roof_stairs.js` | c171 | 96 | bridge tunnels (no roof stairs or roof lamps, wall lanterns, corner stairs on the ramps, daylight stays day inside), |
| 80 | `world/black_castle_island_charred.js` | c172 | 72 | the black castle island is one charred land - black grass and ground, dead black trees, lava pools |
| 81 | `hell/crimson_cloudy_sky_over.js` | c173 | 30 | a crimson cloudy sky over Hell and the black castle zone |
| 82 | `hell/red_glass_pane_thin.js` | c174 | 40 | Red glass pane - thin, see-through, glowing red-orange; used for the Hell and black castle windows |
| 83 | `hell/each_hell_build_gets.js` | c175 | 90 | each Hell build gets its own shape and every build is hollow inside - rooms, floors, stairs, doorways, furniture |
| 84 | `items/jetpack_only_quick_double.js` | c176 | 27 | jetpack only on a quick double-tap of jump; plain jumps and sprint-jumps stay normal |
| 85 | `items/copy_template_tools_two.js` | c177 | 93 | COPY and TEMPLATE tools - two extra hotbar squares in the Test World only |
| 86 | `ui/screen_keyboard_name_prompt.js` | c178 | 60 | on-screen keyboard name prompt, template list, ghost preview + placing (TEMPLATE tool) |
| 87 | `items/template_tool_ghost_preview.js` | c179 | 49 | TEMPLATE tool - ghost preview, LBRB turning, placing spread across frames |
| 88 | `world/water_pool_near_spawn.js` | c180 | 70 | a water pool near spawn, small lava pools and flowing streams in the caves |
| 89 | `world/sketch_map_c113_g35.js` | c181 | 69 | the sketch map (c113 G35 layout) + the sand island becomes a desert museum park: kit, terrain, orchestration |
| 90 | `world/sandstone_pyramid_chest_room.js` | c182 | 58 | the sandstone pyramid, its chest room, and the stairs from the chest room down into the deep cave |
| 91 | `world/desert_museum_park_forecourt.js` | c183 | 95 | the desert museum park - forecourt, tiled plaza, the two museums, lawns, sundial, the dune with its white chapel, the red granite glyph fields |
| 92 | `world/great_sphinx_sand_island.js` | c185 | 54 | the Great Sphinx on the sand island - lion body, front paws, striped nemes, restored face + beard; a tunnel from behind its ear (and a hatch on its he |
| 93 | `world/park_colours_painted.js` | c184 | 58 | the park's colours - painted overlays for cells inside the park zones (no free block ids left), and the flat signs sundial numerals |
| 94 | `mobs/creepers_heard_again_hiss.js` | c186 | 49 | creepers are heard again - a hiss when one spots you and a soft servo whirr as it stalks you, through the mob voices bus (the quieter Siren Head alarm |
| 95 | `ui/crafting_screen_fix_landscape.js` | c187 | 91 | crafting screen fix (landscape side-by-side grid + detail, no HUD text over menus), 3D iso icons for every block that had a flat |
| 96 | `ui/reset_world_always_uses.js` | c188 | 48 | Reset world always uses the newest map - an old page left open (or cached) is caught and updated first |
| 97 | `world/sandstone_redo_pale_sand.js` | c190 | 42 | sandstone redo - pale sand grain with horizontal layer bands (no wood look), on the block, stairs and corner stairs, with fresh icons |
| 98 | `mobs/admiral_skelp_longship.js` | c191 | 76 | Admiral Skelp's longship sails - a moving ship (white wool sails) that comes close and lets the Admiral stare you down; once he is dead you can board  |
| 99 | `world/mainland_river_two_meandering.js` | c192 | 60 | the mainland river - two meandering arms that wind round the mainland, cross and rejoin (loops), varying width, sloped grassy banks, reeds, side ponds |
| 100 | `items/gravity_natural_blocks_logs.js` | c193 | 76 | gravity for natural blocks - logs, leaves and loose terrain with nothing holding them up fall; floating trees from world generation are cleared |
| 101 | `world/falling_pieces_chopped_tree.js` | c196 | 74 | falling pieces - a chopped tree topples and breaks apart into a few logs on impact (big trees drop far fewer), loose leaves fall and fade away, loose  |
| 102 | `mobs/louder_mob_voices_gentler.js` | c194 | 20 | louder mob voices - gentler distance falloff for every mob call, and a soft limiter on the final output so the louder voices never clip |
| 103 | `mobs/lag_spikes_tree_monster.js` | c195 | 38 | lag spikes - the tree-monster spot search no longer scans the whole world, night hostiles only spawn near your own height, deep or far-off cave mobs a |
| 104 | `ui/crafting_blocks_tab_sorted.js` | c197 | 44 | the crafting Blocks tab sorted into labelled groups (planks, logs, stairs, corner stairs, slabs, fences, gates, doors, |
| 105 | `items/held_blocks_keep_their.js` | c198 | 37 | held blocks keep their real shape - stairs, corner + inner corner stairs, slabs, carpets, panels, doors and trapdoors |
| 106 | `items/iron_silver_everywhere_player.js` | c199 | 38 | iron is silver everywhere the player can see it - recipe names + hints, item names, messages |
| 107 | `ui/creative_bag_grouped_like.js` | c200 | 45 | the Creative bag is grouped like the crafting Blocks tab - labelled groups (planks, logs, stairs, corner stairs, |
| 108 | `world/snow_not_rain_when.js` | c201 | 43 | snow is not rain - when it snows you hear a soft wind hush instead of rain patter and thunder, no lightning, |
| 109 | `items/block_breaking_bits_little.js` | c202 | 43 | block-breaking bits are little pieces of the real block - each chip shows a random patch of the block's |
| 110 | `items/real_snow_thin_snow.js` | c203 | 98 | real snow - thin snow layer BLOCKS settle on open ground near you while it snows and melt away over a few days without snow. |
| 111 | `world/desert_island_without_museums.js` | c204 | 48 | the desert island without the museums, the shop and the white chapel - rolling dunes, two palm oases, a pair of obelisks before the pyramid, a ruined  |
| 112 | `world/skull_original_spawn_island.js` | c205 | 42 | the skull from the original spawn island (worldspawn84.bin, MHkitpvp) is back on new reset worlds, with its lava pools; the ground round it gets the  |
| 113 | `mobs/water_mobs_off_flag.js` | c206 | 58 | water mobs off (flag), Admiral Skelp and his wool-sailed longship always there (new and existing worlds), old block boats cleared out of saves |
| 114 | `items/templates_keep_what_inside.js` | c207 | 32 | templates keep what is inside - chest slots, furnace input fuel output and progress, cauldron contents, door open state and all block data are saved |
| 115 | `world/map_worlds_natural_coasts.js` | c208 | 88 | the new map for new worlds - natural coasts, beaches and cliffs, ridged snowy mountains, plains, marsh, lakes, the river valley, close islands over sh |
| 116 | `mobs/people_talk_seeded_voice.js` | c209 | 128 | the people talk - 100 seeded voice lines (villager "hmm hrrm" mumbles crossed with alien-AI chatter: formant babble, pitch glides, question answer t |
| 117 | `world/lusher_glens_more_tall.js` | c214 | 45 | lusher new glens - more tall grass, bushy bushes, flower patches, bluebell-and-heather "lavender" meadows, round oaks, wisteria-style |
| 118 | `world/main_terrain_shaders_vfx.js` | c215 | 82 | main terrain shaders + VFX. Settings > Shaders: Low High (High by default). |
| 119 | `audio/rain_can_see_indoors.js` | c216 | 88 | rain you can see from indoors, never inside - and 3D rain sound. |
| 120 | `items/small_fixes.js` | c217 | 39 | small fixes - |
| 121 | `items/rs_right_stick_click.js` | c218 | 108 | RS (right stick click) smart pick tool; the Snaw Yeti - the mountain beast is now a gentle shaggy yeti that never attacks, |
| 122 | `world/reset_worlds_spawn_skull.js` | c219 | 67 | new and reset worlds - the spawn skull's open mouth and hollow walk-in inside are back (exactly as in worldspawn84.bin: the |
| 123 | `items/going_into_house_or.js` | c220 | 25 | going into a house or a cave never turns the world to night. |
| 124 | `world/wisteria_wood_purple_tree.js` | c221 | 72 | Wisteria is its own wood. The purple tree (v1.0.45) now grows from a Wisteria log (smooth pale grey-lilac bark, twisting ridges) |
| 125 | `world/lanterns_sit_their_posts.js` | c222 | 18 | lanterns sit on their posts. A street lamp (block 161) standing on a fence post, a magma block, stone or anything else |
| 126 | `items/doors_gates_save_hitch.js` | c226 | 121 | doors & gates - no save hitch, proper double doors, never trapped; Howk pickaxe enchant |
| 127 | `items/double_doors_mirror_their.js` | c227 | 46 | double doors mirror their picture - the handles meet in the middle |
| 128 | `world/reset_worlds_lush_grass.js` | c229 | 73 | new reset worlds - lush grass round spawn and an ACTIVE VOLCANO where the big skull stood (lava crater, glowing flows, smoke, embers, rumble); menu h |
| 129 | `mobs/dinosaurs_big_bodies_collide.js` | c230 | 53 | dinosaurs - big bodies collide with their whole footprint (no walking through blocks) and steer round obstacles; heavy footsteps, richer roars and cal |
| 130 | `ui/main_menu_tidy_celtic.js` | c231 | 9 | main menu tidy - new Celtic logo is in the page markup (no old-logo flash), no music hint, no Download tile; Creative a flat world only (Clydebank an |
| 131 | `mobs/back_simple_castle_folk.js` | c236 | 9 | back to simple castle folk - the brain, goals, inventory, A and the rest are gone; |
| 132 | `items/real_fire_replaces_fire.js` | c237 | 140 | REAL FIRE - replaces the v1.0.50 fire. Fire is a moving front of little flames that sit on surfaces |
| 133 | `mobs/pig_photo_pig_round.js` | c238 | 42 | every pig is the photo pig - a round teardrop blob with the real photo (face + skin) wrapped on it, |
| 134 | `world/pyramid_hall_gets_painted.js` | c239 | 72 | the pyramid hall gets painted alien murals - grey heads with big almond eyes, glyph rows, |
| 135 | `mobs/egyptians_pyramid_few_simple.js` | c240 | 55 | Egyptians at the pyramid - a few simple villager-like folk in white and gold linen with tan |
| 136 | `audio/living_water_gentle_ocean.js` | c241 | 73 | living water - gentle ocean swell, slow tides, slower lazier rivers, ripples round anything moving in still water |
| 137 | `world/volcano_eruption_shoot_volcano.js` | c242 | 100 | VOLCANO ERUPTION - shoot the volcano and it blows: huge blasts, a lava fountain, flaming lava bombs that smash craters |
| 138 | `world/desert_rain_or_snow.js` | c243 | 142 | DESERT - no rain or snow over the sand, sandstorms (haze, blowing sand, wind), and TIC-TAC UFOs that zip over the dunes. |
| 139 | `world/element_scoop_glowing_puddle.js` | c244 | 58 | ELEMENT 115 - scoop the glowing puddle with a bucket, pour the 115 bucket into the volcano after it has erupted: |
| 140 | `world/desert_gales_constant_sandstorm.js` | c245 | 28 | DESERT GALES - in the constant sandstorm, sheep and other light passive mobs get lifted and tumble on the wind, |
| 141 | `space/big_saucer_encounter_huge.js` | c246 | 80 | THE BIG SAUCER ENCOUNTER - a huge classic flying saucer (4x) with a ring of rainbow lights darts over the desert like a tic-tac. |
| 142 | `space/encounter_original_ariel_school.js` | c246b | 100 | THE ENCOUNTER - an original Ariel-School-style alien (slender, huge glossy black star-speckled eyes) floats out of the wreck in an |
| 143 | `space/meteor_after_alien_encounter.js` | c247 | 85 | THE METEOR - after the alien encounter, switching on any TV shows static... and a huge flaming meteor appears far away, |
| 144 | `space/deeper_trip_kaleidoscope_tunnel.js` | c248 | 81 | the deeper trip - kaleidoscope tunnel mandala morphing-wall vision scenes, a procedural ambient trip soundtrack, |
| 145 | `space/planets_night_sky_nasa.js` | c249 | 24 | planets in the night sky - NASA public-domain images of Jupiter (Pioneer and Hubble), Neptune (Voyager, false colour) |
| 146 | `space/big_detailed_moon_nasa.js` | c250 | 22 | a big detailed Moon (NASA LRO nearside photo, public domain) about 2.8x the biggest planet with a soft halo, phases kept; |
| 147 | `ui/fast_boot_artificial_minimum.js` | c251 | 7 | fast boot - no artificial minimum on the loading screen; menu opens the instant textures are ready |
| 148 | `space/big_saucer_rebuilt_dark.js` | c252 | 80 | the big saucer rebuilt - dark gunmetal hull with a greebled hex-plated UNDERSIDE, radial struts to a blazing core |
| 149 | `ui/main_menu_full_width.js` | c253 | 23 | new main menu - full-width golden-brown GLENCRAFT logo at the top, just Play + Settings stacked on the left, |
| 150 | `mobs/real_sheep_pig_recordings.js` | c254 | 24 | real sheep and pig recordings (Wikimedia Commons, CC0 PD CC BY CC BY-SA - see CREDITS.md) replace the synth baaoink. |
| 151 | `space/year_rebuilt_chrome_future.js` | c255 | 73 | YEAR 24000 rebuilt as a chrome future - every block turns mirror-chrome (in-place env-map swap on the shared block |
| 152 | `mobs/true_3d_animal_voices.js` | c256 | 35 | true 3D animal voices. Every animal call (sheep, pigs, ducks, haggis, squelches...) is played through its own |
| 153 | `mobs/pigs_use_animated_low.js` | c257 | 20 | pigs use the animated low-poly Pig (Quaternius, CC0, walk idle eat run) instead of the photo blob, |
| 154 | `audio/desert_soundtrack_walk_into.js` | c258 | 41 | desert soundtrack - walk into the sand and the music crossfades to an original Egyptian-style remix |
| 155 | `mobs/many_more_egyptians_around.js` | c259 | 88 | many more Egyptians around the pyramid - stone carriers, kneeling worshippers, farmers with hoes and drummers - |
| 156 | `ui/reset_world_builds_map.js` | c260 | 61 | Reset world builds the new map nearest-first a few chunks per frame with no save errors, new worlds start with a |
| 157 | `space/encounter_staging_alien_waits.js` | c262 | 40 | encounter staging - the alien waits inside the crashed saucer until you walk within about 4 blocks of the hull, |
| 158 | `ui/reset_loading_screen.js` | c263 | 42 | Reset world hides behind the Glencraft loading screen until the new world is ready and drawn |
| 159 | `ui/patch_notes_button_main.js` | c264 | 52 | Patch notes button on the main menu (under Play and Settings, blue, controller-focusable), |
| 160 | `world/flowing_water_lava_water.js` | c265 | 37 | flowing water and lava. Water: two scrolling three.js water normal maps (MIT) that follow the river flow, |
| 161 | `audio/settings_audio_custom_dance.js` | c266 | 26 | Settings > Audio > Custom dance music - pick your own track; it is kept only on this device (IndexedDB) and never uploaded |
| 162 | `space/saucer_visits_first_night.js` | c267 | 17 | the saucer visits on the first night. Before this it could only spawn while you stood in a desert at night |
| 163 | `items/players_paintings_user_p1.js` | c268 | 25 | the players own paintings (user_p1-6.jpg, drawn by the player) hang framed in the two new gallery rooms off the |
| 164 | `mobs/monsters_spawn_inside_pyramid.js` | c269 | 16 | no monsters spawn inside the pyramid - the hall, the gallery rooms, the stairs and the chest room under it. |
| 165 | `mobs/egyptians_always_pyramid_pyramid.js` | c270 | 25 | the Egyptians are always at the pyramid. The pyramid record (__c239.pyr) is saved with the world, so if the |
| 166 | `ui/world_must_always_start.js` | c271 | 13 | a world must always start. If entering a saved world throws, the error is kept (glen_starterr) and the other |
| 167 | `ui/worlds_that_will_not.js` | c272 | 33 | worlds that will not start. (1) If a world has no readable save (lost during a reset cut short before v1.0.88), |
| 168 | `world/highlands_map_reset_worlds.js` | c273 | 102 | the Highlands map for new and reset worlds - one connected grassy mainland (no sea channels or bridges), open lochs, |
| 169 | `world/caves_highlands_map_each.js` | c274 | 61 | caves for the Highlands map - each world seed gets its own cave network (winding worm tunnels of changing width, |
| 170 | `world/winding_paths_highlands_map.js` | c275 | 52 | winding paths for the Highlands map - gravel tracks that meander from the spawn meadow out to each castle, the |
| 171 | `world/og_glencraft_spawn_plain.js` | c276 | 32 | the OG Glencraft spawn - plain oak trees, grass, tall grass and flowers round the spawn meadow, and haggis |
| 172 | `ui/ui_theme_colour_ui.js` | c277 | 52 | UI theme colour (v1.0.90). Every UI accent goes through CSS variables; default GOLD, neon green and others as presets, plus a custom colour. Saved in  |
| 173 | `ui/upload_world_test_world.js` | c278 | 53 | Upload world (Test World only), New World from the published default map, Random world toggle, UFO only over the pyramid desert at night. |
| 174 | `world/pompeii_style_eruption_effects.js` | c279 | 47 | Pompeii-style eruption effects on top of c242 - a towering ash column that mushrooms out, a ground-hugging pyroclastic |
| 175 | `world/foliage_looks_solid_3d.js` | c280 | 28 | foliage looks solid and 3D with no black edges. Grass, flowers, ferns and saplings keep their own art, but: |
| 176 | `world/highland_look_mockup_highlands.js` | c281 | 35 | the Highland look from the mockup for new Highlands worlds - tall blocky pine forests on the hills and glens, |
| 177 | `earth/ice_wall_freezing.js` | c282 | 36 | icy snow wall + freezing past the wall. |
| 178 | `items/pistol_musket_world_infinite.js` | c283 | 57 | pistol + musket in every new world with infinite bullets, gravel in caves (shovels dig it fast), lava pools deep in the caves, |
| 179 | `space/alien_abduction_fades_game.js` | c284 | 21 | alien abduction fades out every game, biome and desert tune and plays the trippy alien music, then the normal music comes back; |
| 180 | `items/packed_snow_full_opaque.js` | c287 | 16 | Packed snow - a full opaque white snow block (fine crunchy grain, slight blue shading) for the ice wall instead of |
| 181 | `items/gun_aim_lt.js` | c288 | 47 | guns - hold LT (right mouse the LT touch button) to aim down the sights: the view zooms in, the gun moves to the |
| 182 | `items/first_person_body_look.js` | c289 | 20 | first person body - look down and you see only your two legs, walking in step, set just behind the camera and hidden |
| 183 | `ui/settings_graphics_show_legs.js` | c291 | 27 | Settings - Graphics - Show legs in first person (default on); recipes you cannot craft yet are tinted red; |
| 184 | `ui/menu_layout_overhaul_layout.js` | c292 | 56 | menu layout overhaul (layout only, Glencraft gold theme kept). |
| 185 | `ui/menu_checklist_gaps_crafting.js` | c293 | 53 | menu checklist gaps - crafting tabs All Construction Nature Items (Search looks through all), bag |
| 186 | `agartha/agartha_generation_reset_worlds.js` | c294 | 125 | AGARTHA, generation. New and reset worlds only (old saves keep what they have). |
| 187 | `agartha/agartha_life_inner_sky.js` | c295 | 54 | AGARTHA, life. The inner sky (a glowing central sun, warm mist and drifting sparkles), the silent Agarthans |
| 188 | `world/far_terrain_fps_chunk.js` | c296 | 13 | far-terrain FPS. Every chunk drew its grass, flowers and undergrowth as several small instanced meshes, one draw each, |
| 189 | `agartha/agartha_crystal_blocks_warm.js` | c297 | 50 | Agartha crystal blocks and warm light. |
| 190 | `agartha/agartha_v2_extras.js` | c298 | 45 | Agartha v2 extras. |
| 191 | `space/highland_rocket_base_space.js` | c299 | 167 | Highland Rocket Base and space flight across the whole solar system. |
| 192 | `ui/responsive_menus_panel_dialog.js` | c301 | 21 | responsive menus - every panel, dialog and the HUD fit phones in portrait and landscape and desktop: |
| 193 | `mobs/pig_sheep_models_follow.js` | c302 | 34 | the new pig and sheep models follow the |
| 194 | `space/saucer_lives_agartha_never.js` | c304 | 70 | THE SAUCER LIVES IN AGARTHA. It never despawns. By day it is parked in the crystal city; at dusk it flies out along |
| 195 | `space/planet_colour_grids_x.js` | c305p | 3 | planet colour grids (32 x 16 RGB, base64) sampled from "Solar System animation" by Samer_Arab_S5, CC-BY-4.0 - see CREDITS.md |
| 196 | `space/solar_system_list_bodies.js` | c305 | 58 | THE SOLAR SYSTEM. One list of bodies (add a planet add one line). Every planet is drawn as a blocky VOXEL ball (one merged |
| 197 | `space/landable_voxel_planets_zero.js` | c306 | 51 | LANDABLE VOXEL PLANETS + ZERO-G. The Moon (192 x 192, grey regolith gravel over stone, craters, low gravity 0.17) |
| 198 | `earth/north_extension.js` | c307 | 72 | THE NORTH EXTENSION. The map now runs on 1500 blocks north past its old top edge (z 0 down to z -1500), in the same |
| 199 | `earth/north_extension_draw.js` | c307b | 35 | drawing the north extension. Ext chunks near you are meshed by the game's own chunk mesher (the original |
| 200 | `space/player_ufo.js` | c309 | 109 | THE PLAYERS OWN UFO + the flat Earth seen from space. Every world has your own silver saucer parked next to where you |
| 201 | `mobs/pig_sheep_unicorn_animation.js` | c310 | 45 | pig, sheep and unicorn animation hotfix. The new pig and sheep models are sized from what is really drawn |
| 202 | `ui/touchscreen_pack_inventory_drag.js` | c311 | 94 | touchscreen pack - inventory drag and tap-tap swap onto the hotbar and the armour jetpack slots (long press |
| 203 | `ui/xbox_controller_player_ufo.js` | c312 | 24 | Xbox controller for the player UFO, and the touch buttons hide while a gamepad is in use. |
| 204 | `mobs/our_haggis_model_sharper.js` | c313 | 22 | our own haggis model, and sharper pig and sheep fur. |
| 205 | `earth/backrooms_gone_reset_world.js` | c314a | 22 | THE BACKROOMS ARE GONE. Reset world could drop you into the Backrooms (through the Mystery painting portal |
| 206 | `space/moon_mars_blocks_nine.js` | c315 | 42 | MOON AND MARS BLOCKS. The nine old Backrooms block slots (191-199) are reused for real planet blocks with painted |
| 207 | `space/moon_mars_space_box.js` | c318 | 95 | THE MOON AND MARS IN THE SPACE BOX. Two big round planets of real blocks hanging in the box (the Moon above Earth, Mars |
| 208 | `space/space_box.js` | c317 | 80 | THE SPACE BOX. One continuous sandbox: a cube of deep space from -10000 to +10000 on X, Y and Z with solid, unbreakable |
| 209 | `earth/one_continuous_world.js` | c314 | 90 | ONE CONTINUOUS WORLD. |
| 210 | `ui/reset_world_always_makes.js` | c316 | 26 | Reset world always makes a fresh world at mainland spawn |
| 211 | `space/faster_falling_golden_jetpack.js` | c319 | 50 | faster falling and the Golden Jetpack. |
| 212 | `earth/round_earth.js` | c320 | 98 | THE ROUND EARTH. The map is one continent sitting on top of a round Earth of real blocks (radius 5000). Around it and |
| 213 | `space/down_planet_moon_mars.js` | c321 | 95 | DOWN IS THE PLANET. On the Moon, on Mars and out on the round Earth, "down" points to the middle of the planet, so you can |
| 214 | `items/real_guns.js` | c322 | 50 | REAL GUNS. The Highland rifle and the Highland pistol use real scanned style models with full PBR textures |
| 215 | `mobs/hotfix_passive_animals_stay.js` | c323 | 62 | hotfix - passive animals stay about, and sheared sheep keep the new model. |
| 216 | `earth/earth_chunk_streaming.js` | c324 | 74 | THE ROUND EARTH UP CLOSE. Out past the map the Earth was only drawn as smooth sea sheets, so the new continents, |
| 217 | `items/swept_collision.js` | c325 | 54 | zero clipping - swept move with sub steps and push out, for walking, jetpack and flying, plus a fresh version check |
| 218 | `space/earth_from_afar.js` | c326 | 50 | Earth from far away is a round painted planet - Glencraft as a snowy island and big green and brown continents, no flat card |
| 219 | `ui/touch_scrolling_inventory_crafting.js` | c328 | 39 | touch scrolling in every inventory and crafting list (a drag scrolls, a tap still picks), and real falling: |
| 220 | `earth/real_earth_land_sea.js` | c329 | 23 | THE REAL EARTH. A land and sea map of the real world (Natural Earth 1:50m land, public domain, 2048 x 1024) wrapped |
| 221 | `audio/no_phantom_bangs.js` | c330 | 12 | NO PHANTOM BANGS. Explosion and thunder sounds only play for something real near you. The saucer leaving at dawn used to |
| 222 | `earth/no_flat_sea_sheet.js` | c331 | 20 | NO FLAT SEA PICTURE IN YOUR WAY. The painted sea sheet round the island (C320 and C326) is only a stand-in for water |
| 223 | `earth/earth_layers.js` | c334 | 64 | THE LAYERS OF THE EARTH. Dig down anywhere and the rock changes as you go, each layer with a big open cavern band |
| 224 | `agartha/hollow_earth_under_thick.js` | c332 | 92 | THE HOLLOW EARTH. Under a thick crust the round Earth is hollow: a huge space with green land, lakes and seas on the |
| 225 | `agartha/drawing_hollow_earth_inside.js` | c333 | 63 | DRAWING THE HOLLOW EARTH. Inside the shell a floating yellow and orange sun glows in the middle, the sky is a soft |
| 226 | `earth/caves_go_down_blackstone.js` | c335 | 32 | CAVES GO DOWN, AND BLACKSTONE BREAKS LIKE COBBLE. |
| 227 | `ui/no_black_flashes.js` | c336 | 39 | NO BLACK FLASHES. On phones the screen resolution was changed by a timer outside the drawing step, which |
| 228 | `earth/britain_round_glencraft.js` | c337 | 45 | GREAT BRITAIN ROUND GLENCRAFT, NO OLD ICE WALL, AND AN AGARTHA TELEPORT. |
| 229 | `ui/god_mode.js` | c338 | 17 | GOD MODE. A switch in the pause menu settings. When it is on nothing can hurt you: no fall, mob, lava, fire, void, |
| 230 | `earth/uk_world.js` | c339 | 34 | v1.1.44: the UK world (lat/lon to blocks, off-map ground rules, flat mode switch). v1.1.52: old far sea disc, ice ring and painted land plane deleted |
| 231 | `items/guns_held_properly.js` | c340 | 36 | GUNS HELD PROPERLY. Whenever a gun is held (the Highland pistol or the Highland rifle) it sits at a fixed spot to the |
| 232 | `earth/scotland_map.js` | c341 | 81 | SCOTLAND IS THE MAP. The old square map with its round island and ring of sea is gone. The whole 864 x 864 world |
| 233 | `earth/scottish_land_volcanoes.js` | c342 | 48 | SCOTTISH LAND, NOT DESERT, AND THE UK VOLCANOES. The pyramid desert is gone (Scotland has no desert): its land is laid |
| 234 | `items/lt_gun_only_aims.js` | c344 | 9 | LT with a gun only aims. While a gun is held, nothing the use button does can place a block. |
| 235 | `earth/uk_regional_ground.js` | c345 | 57 | REGIONAL GROUND ACROSS THE UK AND IRELAND. Out past the Scotland map the real block ground now changes with the |
| 236 | `earth/real_blocks_from_air.js` | c346 | 21 | THE REAL BLOCKS FROM THE AIR. No stand-in ground: when you fly up the game keeps drawing the real block chunks and |
| 237 | `earth/uk_full_land.js` | c347 | 61 | THE WHOLE UK AND IRELAND IS FULL GLENCRAFT LAND. Out past the Scotland map the ground now gets the same |
| 238 | `render/idle_lights_off.js` | new | 15 | v1.1.52: idle torch point lights switched off while all are dark (phone frame rate) |

## Removed in v1.1.52

- 80 unused old parts (c4 to c96 and others that were no longer in the build list) and 102 old ship and patch scripts. They stay in git history.
- From `earth/uk_world.js`: the far sea disc, the ice ring mesh, the painted land plane and their render hook (all switched off since v1.1.51).
- `earth/no_flat_sea_sheet.js` no longer searches the scene every frame in the UK world, where those sea sheets do not exist.

## Known large modules

Some older modules are over 250 lines (for example `mobs/night_mobs.js`, `items/lazurite_wood_hd_tiles.js`). They were moved as they are; splitting them is left for later.
