# Glencraft – game spec (maintained by the agent)

## Architecture
- Single-page Three.js voxel game, shipped as one file: `site/index.html` (repo Whatever4567/glencraft, GitHub Pages).
- Base engine: `/workspace/s1_0968final.js` (v0.9.68), patched by exact-match string replacements (`R` list in `build87.py`; each must match exactly once).
- Features are layered as wrapper "parts" in `parts/cNN.js`, appended in order after the base. Each part wraps globals (`generate`, `enterWorld`, `serialize`, `updateSky`, …) and exposes a debug object `window.__cNN`.
- World: W=D=864, H=128, SEA=41, `idx(x,y,z)=(x*H+y)*D+z`; `g9cols[(x*D+z)*2]` = top+1. Saves (IndexedDB `glencraft-saves`) store the full world RLE; per-part flags live in the save (`d.c113`, `d.c131`, …).
- Lights: `lightSrc` map keyed `(x*4096+z)*256+y`.

## Build
```
cd /workspace/game && python3 build87.py v1.0.NN >/dev/null && node --check s1.js && python3 build.py <tag> >/dev/null 2>&1; cp site/index.html /tmp/srv/new112.html
```
- `NOG12=1` drops c131 from the build (used to ship v1.0.12 without the world gen).
- `build87.py` = base + R patches + parts list → `s1.js`; `build.py` injects `s1.js` into `site/index.html` and stamps the build tag.
- Patch notes: `parts/c114.js` (`['v1.0.NN',[...]]`, newest first) and the `{v:'v1.0.NN',…}` list in `site/index.html`.
- Local test server: `localhost:8766` serves `/tmp/srv`.

## Headless tests (`/workspace/pw`, playwright-core + Chrome swiftshader)
- `probe.js PAGE SCRIPT [png]` – eval a script after world start (`SEED` env → `window.__forceSeed`).
- `wgdump.js PAGE TAG` – top-down map + land ratio / castle-shore stats → `/tmp/wg/TAG-top.png`.
- `/tmp/wg/q3.js` – cave/sea verification (air under water, flood fill, caverns reached, entrance, ravines).
- `shots12.js` – cave sky test at low render distance, entrance, ravine, held map; prints PAGEERR count.
- `mus14.js` – remix playback, crossfade (playbackRate 16), Hell track switch. `musicgen/analyse.py FILES` – peak/RMS/energy above 2 kHz/clipping.
- `shots14.js` – map + Great Cave bowl/spiral/cavern shots; `ftest14.js` – phone smoke test; `/tmp/wg/q11.js` air-under-water list, `/tmp/wg/q12.js` pocket inspector.
- `mus12.js` – music engine on menu/in game, chime, offline spectrum (energy above 1.5 kHz) per track.
- `ftest.js` – general smoke test. Screenshots are for local inspection only (never sent to the user).

## Parts (selected)
| part | purpose |
|---|---|
| c101/c103 | castles in three corners, spawn island asset |
| c102 | jetpack; castle islet terrain (`island()`, G12-gated) |
| c132 | v1.0.12/13/14 soundtrack: plays the remixes from `site/assets/music/*.mp3` through 1.5 kHz low-pass + limiter, mood rotation, 9 s crossfades; procedural binaural fallback (TRACKS recipes), pink-noise surf, drone, 1.5 kHz low-pass + limiter, mood rotation; old mp3s retired (Hell drone kept); soft level-up chime. `__c132.offline(ctx,id,hp)` for spectrum tests |
| c112 | held map item (palette, coastline, crofts/ravines/Great Cave markers, round local inset) + HD held tools |
| c113 | mainland + 3 castle islands, bridges, crofts (`setP`, OFF 302 for G12) |
| c114 | patch notes panel |
| c120 | tidy spawn (REM list), XP, misc |
| c123 | 29 night mobs (procedural models) |
| c128/c129 | theme + phone layout/touch controls |
| c130 | spawn eggs, creative rules |
| c131 | v1.0.14 world gen: carving, caverns, Great Cave, 4 ravines, cave graph (no dead ends; wiggles fall back to the checked line near water/roof), solid seabeds, no-sky-underground, `cavey()` for ponds |
| c133 | v1.0.14 mineshafts for G12 worlds: 2–4 per world, start in a live mainland tunnel, land-only (dW≥10, under the roof), crossings clear each other's frames |
| c134 | v1.0.15 water: overrides global buildWaterGeo (corner heights averaged over 4 cells, drops pull corners to 0, attrs aScr/aFl/aFoam), wraps waterMat.onBeforeCompile (ripples along flow, foam), rivers U.rivers(rnd) called from c131 post before step 2 (BFS dist-to-water trace, nearest-centre-line levels, sloped banks/levees, falls → FLV 1 set after the outer generate), RIV flow map rebuilt from saved centre lines `d.c134={g15,p}`, splash Points pool (70 PERF / 150), rush noise via master, current 0.9 m/s for player + drops |
| c135 | v1.0.16 HD mob models: catalogue U.cat (kind→file, k height×procedural or h fixed, tint, bright, clip aliases, proc(a) = show procedural now), lazy assets/models/lib.js (+WebAssembly) and GLBs (?v1016, Cache Storage 'glencraft-models'), attach = procedural meshes to layer 31 (still animated/hitbox), SkeletonUtils clone + per-mob Lambert mats pushed into a.mats (flash/dispose), scaled to procedural height, yaw from head z; AnimationMixer roles idle/walk/run/attack/eat (attack = biteCd/shootCd reset or swing), far mobs update 1/4; wraps updateSky + removeMob (detach before dispose so shared geometry survives); Settings hdSeg + hdCredit; SET.hd |
| c136 | v1.0.17 HD batch 2 + Glencraft dressing: helpers palTex (swatch remap), tartan() + planarUV (tartan on named materials), procCap/headTop/addTam (tam o' shanter on the HD Head bone sized/placed from the procedural tam, shared geometry), headCol (recolour one swatch on the head or top fraction via vertex colours), spos (skinned rest position); post hook applies c.pal/mcol/op/emis/tartan/tam/headCol; sheep fleece colours; catalogue pig, duck, haggis, imp, ghost, blazeskel, dragon; clears old Cache Storage versions |
| c137 | v1.0.18 HD batch 3 (night mobs): catalogue for nm07/15/25/18/03/28/10/20/29 + nmwisp/nmdrop; post hooks c.lift (raise floaters) and userData.e0 (hit flash); glowy() keep filter |
| c138 | v1.0.19 HD unicorn: catalogue nmunicorn (whorse) + c.horn post hook (addHorn on the HD Head bone) |
| c141 | v1.0.20b: the wild c125 Unicorn (not in mobs[]) gets HD via U.xs() extra list ticked by c135 (cat.unicorn = copy of nmunicorn); stronger pixel-fur gl style for the unicorn |
| c142 | v1.0.21 worldgen: sand island (centre 172,696) with sandstone pyramid + red bands, tomb caves under it, Moss Hag hut by black castle (712,46,732), boat moved out into the river; save key d.c141 |
| c143 | v1.0.21 spawn rules: DIS list (disabled mobs), SPEC/HOMES home sites, sweeper, Lang Hat Lurker at death spot, farmer kill → Cleek Jack (nm27), Thunner Cloudies in rain |
| c144 | v1.0.21 universal spawn egg (id 790): LT opens list of enabled (36) + disabled (19) mobs, spawn any in creative; `__c144.entries()` → {on,off}, `spawnWith(id)` |
| c145 | v1.0.21 Highland flintlock musket (IT 213): pixel-textured walnut/brass/iron model + icon; LT/right-click/Place = aim down sights (FOV ×0.6, sight aligned), RT/left click/Break = fire; kick ×0.4 when aiming |
| c146 | v1.0.22: HD skeleton / blaze skeleton keep the procedural bow visible (c135 keep) and move it to the HD hand bone after updateMobs; HD black skeleton gets a clone of its sword on the hand bone (hand/wrist name, else forearm e.g. RDownLeg001, nearest to old weapon); `__c146` |
| c139 | v1.0.20 HD restyle engine: pat(kind,amp) canvas pixel patterns (NearestFilter), bake() geometry with vertex colours from atlas/swatch + box UVs (cached by geo/map/scale), U.glStyle(a,c,m,hd,mats), U.glOff |
| c140 | v1.0.20 style table S → U.cat[k].gl {p pattern, m name→pattern, col name→hex, sw swatch remap, a amp, b bright}; post hook calls U.glStyle; nm28 tint ffffff/emis 0a1028 |

## World generation flags
- `current.l94` (c113 islands) and `current.g12` (c131) are per-world; old saves keep old land. New worlds and Reset world get the new gen. "Reset terrain" (Keep markers → keepMove, and the old resetOverworld) sets l94/g12 before generating, so it gets the new gen too (build87 R entries).

## Assets / rules
- Music (v1.0.14): `musicgen/remix.py` re-renders the original songs (`musicgen/gen_src.py` = the old generator's composition code: same chords + seeded melodies) with warm pads / low soft plucks / sine lead / Highland drone, half-time sub pulse + sidechain breathing, over the processed frequency beds in `musicgen/beds/` → `site/assets/music/{mist,dawn,heather,pine,skye,loch,glen,stone,cairn,ember}.mp3` (11 MB, -21.5 dB RMS, 1.7 kHz low-pass, loudnorm -20, limiter). c132 `RX` maps song → bed/mood; Hell plays `ember`.
- Frequency beds: source `ref/music_user/track01-11.mp3` (never commit ref/). Processed with ffmpeg: `bandreject 230/270 Hz (Beyond, Focus 21), highpass 35, lowpass 1600 x2, loudnorm I=-20 TP=-3, afade in 5 / out 6, 22.05 kHz stereo 48 kbps` → `musicgen/beds/<id>.mp3` (no longer shipped on their own).
- Only `tv/clip1-5.mp4`, world bins, sky/bg webp, music mp3, `placeholders/nightmobs/NN.jpg`, `assets/models/*.glb` (CC0, listed in CREDITS.md) may be tracked (media-check regex in todo.md). Never commit ROMs/APKs, ref/ photos, zips.
- Future HD models: CC0 GLB (Quaternius/Kenney/Poly Pizza), ~1024px textures, bundled, async, procedural fallback, credited in CREDITS.md + Settings.
- Map credit: "© OpenStreetMap contributors". No Google data.

## Engine config
- Render distance `SET.dist` 0/1/2 → fog far 62/110/210 (PERF 40); stream radius follows fog.far.
- Phone performance must stay ≥ v0.9.67.
| c147 | v1.0.23 pyramid island shape (separate, channel, sealed seabed) + caverns w/ boosted ore |
| c148 | v1.0.24 log orientation (entMeta.ax) + wood shades |
| c149 | v1.0.24 per-biome undergrowth variants of tall grass + new-world density |
| c150 | v1.0.25 castle decor props (atlas, merged meshes, anchors, save d.c150p) |
| c151 | v1.0.25 castle builder kit + clan castle exterior |
| c152 | v1.0.25 great hall + bedrooms, skeleton crag castle + crypt |
| c153 | v1.0.25 black castle, lava moat, throne room, broken portal |
| c154 | v1.0.26 Mob voices volume slider + gain bus |
| c155 | v1.0.26 bridge/tunnel tidy: floating lanterns and tree bits removed |
| c156 | v1.0.26 safe spawn lava pool; rare line-of-sight Ghost |
| c157 | v1.0.26 HD green classic creeper, single egg, cave spawning; v1.0.27 egg creepers persist, night surface spawns (survival), cap 2 |
| c158 | v1.0.27 Admiral Skelp voice line (positional, Mob voices bus, cooldown) + amplitude-driven jaw |
| c159 | v1.0.27 HD bee model (Quaternius Bee Enemy, CC0) with Glencraft honeybee styling |
| c160 | v1.0.28 texture-array pre-warm per world/dimension (stride-5 block census -> __TA.layers queued 6 ms/frame, __taNeed capacity hint) + >100 ms frame spike counter |
| c161 | v1.0.28 human dance (farmers + idle clansfolk, groups within 10, 4-beat 2 s loop + 2 variations, synced to human_dance.mp3 at 124.8 BPM, Mob voices bus, 75 s cooldown, day/overworld only) |
| c162 | v1.0.29 red sky + mist round the black castle; one-time castle rebuild in existing g25 worlds (d.c162), chests kept, local light re-read |
| c163 | v1.0.29 Brightness slider (SET.bright), settings tabs Audio/Video/Controls/World (#setTabs, #setHold, LB/RB), smaller HUD + item name above hotbar, hazard creeper egg icon |
| c164 | v1.0.29 rain: roll fix (d.dry29), camera rain sheets + drops + splashes, grey storm sky, sheet lightning, snow on snowy ground |
| c165 | v1.0.30 dinosaurs: species table SP, habitat(), make() (invisible rig + HD model), tryHerd spawner, hunter/neutral AI, kill drops, eggs via __c130.addEggs |
| c166 | v1.0.30 dinosaur voices (synth, Mob voices bus) |

### v1.0.31 Hell overhaul parts
| part | role |
|---|---|
| c167 | __c167: hell sites (pick/siteOk/fortDist), biomes (biomeAt/column), caverns, raise builds, fortLights; genHell wrapper |
| c168 | __c168.build(K,kind): gothic builder (moat, bridge, nave, facade towers, great spire, pinnacles, red windows, chains, portal, chests) |
| c169 | __c169: prop mesh groups per build (<150), save d.c167/d.c167p, retro for old hells, red sky/fog/camera.far, biome + build toasts |
| c170 | __c170: hellSpawn replacement (mobs per build, ghosts on soul sand), hellPopulate, dragon gate, 6s top-up |
| edits | c108 hell min light 0.5; c143 orb keep -> __c170.orbOK/soulSpot; build87.py R entry HELL_W 384/224 |
- v1.0.32: HELL_W fixed 384 (all worlds); c105 reset ask handles dims (label/ask per dim, calls __resetDim, window.__dimNoAsk skips the native confirm in resetDim); separate Reset Hell button (resetTerrainBtn) hidden.
| c171 | __c171: tunnel tidy (roof stairs/lamps, sconces), __stQ corner-stair quadrant masks (build87 R line 54), lantern chunkST fix, inTunnel caveDepth 0 |
| c172 | __c172: black zone char shader flag via bioC, scorch + lava pools (d.c172) |
| c173 | __c173: crimson cloud dome (Hell + __c162.k) |
| c174 | __c174: Red glass pane (item 700, 227 + wood:'R'), instanced render, window.__rpane |
| c175 | __c175: hell(K,kind,o) interiors + shapes, black(K,o) wings, one-time upgrades d.c175 / d.c175h |
| c176 | __c176: jetpack double-tap gate + speed cap |
- v1.0.33: parts c171-c176 added; c162 mist/sky rewrite; c153/c168 windows -> __rpane, outside banners removed

## v1.0.34
- Copy/Template tools (c177-c179), Test World = world name containing "test". Templates in IndexedDB 'glencraft-templates' (global).
- c180: spawn water pool + cave lava pools + underground streams, once per seed (save key c180).

## v1.0.35
- c181 G35 sketch map (mainland centre; black N, skeleton/mossy W, clan E, sand SW diagonal bridge, forest croft SE), c182 pink pyramid + chest-room stairs to deep cave, c183 museum park, c185 Sphinx (ear tunnel + head hatch -> chamber), c184 colour overlays (InstancedMesh in blockGroup; scene-level InstancedMesh does not render), c186 creeper hiss/whirr + c186b spawn-hill ores.
- c187: landscape crafting grid fix (#recipes display:grid !important, padhint hidden), #tplHint/#itemName hidden in menus, iso icons for flat/missing blocks (MINE re-asserted), live icon refresh in open recipe grid, corner stairs items 331-343 (3 stairs -> 2, table), place outer corner via entMeta.q + qf=1 on the side aimed at.
- c174 red pane mesh moved to blockGroup (was invisible since v1.0.33).

## v1.0.36
- current.g36 (saved in d.c181.g36; new/reset worlds only): c113 ISL G36 - black (W/2, D*.1424, sx1.5 sz1.0), mossy (W*.1354, D/2, sx1.0 sz1.5), human (W*.8611, D/2, sx1.05 sz1.5), forest (W*.7083, D*.8345, sx1.75 sz1.0, nc); island channel carve narrowed to sstep(.84,.95)*(1-sstep(1.0,1.1)); MT_C (park) = (W*.2384, D*.7778), c181 park shape R 92. Gaps to mainland ~16-35 (seed dependent), border ring 30-100. Top-down PNGs: layout_current.png (before), layout_new.png (after); tools /tmp/w35/dump.js, gaps.py, render.py.
- c192 mainland river (g36): two ring arms R~163 (sin 4θ meanders, cross = loops), half-width 1.4-5.2, 4 sea outlets (28/160/225/315 deg) + 2 inner-loch outlets (112/245), 8 side ponds + 3 lone ponds; water at SEA (1-3 deep), banks cut to SEA+1+0.72*dist out to 15 blocks, reeds (239) on low banks, cut trees removed whole; skips spawn island r<112, non-natural tops, tunnels; under bridges carves SEA-1..SEA+3 keeping the deck. Runs inside __c134.rivers (survival, before caves); creative falls back to after generate with an 8-deep stone seal. No current/flow codes.
- c189 snow: settling overlay + permanent caps; cap height now adaptive = clamp(p99.6 of land tops + 1, 74, 87).
- c190 sandstone procedural texture (strata + grain), icons 77/168/335/348. c182 true 21-course pyramid with red front jambs/lintel. c187 inner corner stair items 344-356 (4 stairs -> 3), HALF=[3,5,12,10]; collision via c171 q bits.
- c191 Skelp ship entity (SH mesh from c142, white wool sails, follows player within 80, Skelp frozen on deck); c123 parry spd 0 (never attacks); after his death: board with use/LT, stick steers, B/use exits; d.c191 {x,z,yaw,dead}. Ship spawn g36 = (W*.22-11, D*.22-7). Ship is not solid unless riding.
- c188 Reset world version catch + update check on return to tab.
- v1.0.37 c193 gravity: comp() flood from changed blocks (limit 1500), natural logs/leaves/terrain only, break/explode hooks, one-time cleanTrees of floating trees.
- c196 falling bodies + tree felling (topple, break into drops, logDrops cap 14), leaves fall and fade.
- c194 master limiter + gentler mob falloff. c154 SET.mob 0..3, MOBK 1.6*2.6, creepDst sub-bus 0.42.
- c195 lag: local findTreeSpot search; underground/far natural hostiles blocked and culled. c120 autosaveAsync.
- c197 crafting Blocks groups (catRecipes + setCat wraps, .c197h headings). c198 held-block shapes (makeItemMesh wrap, doorRot/stairRot).
- c104 ore table: iron 60 + iron-deep 30 (y1-22), silver 24, diamond 7.5 (y1-13, size 2-6). c107 repaints ores if the stone base changes.
- c199 (v1.0.38): iron->silver display rename (fix(), toast wrap, NAMES accessors), held wood doors use own door texture.
- c200 (v1.0.39): Creative bag grouping (sortBag moves existing buttons, .c200h headers, check every 1.5 s / on tab click); uses __c197.group/key.
- c201 (v1.0.40): snow/rain split (__snowWx/__rainWx), snow hush ambience, no thunder/lightning/rain sound in snow, snow labels, save.precip. c143 rain mob gated on __rainWx.

## v1.0.41
- Water mobs: off unless localStorage glx_waterMobs='1'. Longship is only the sailing entity; saves get old block ship removed (shape match, non-placed cells) and d.c206 {boat, sw} keeps the ship site.
- Templates: record field e = {c chests, f furnaces, k cauldrons, d doors, m object entMeta} as [cellIndex, data]; restored on placement.

## v1.0.42 map (GLX-C208, current.g42)
New and reset worlds: mainland (spawn centre, skull+lava, pool, winding river with a valley) + black isle N, skeleton isle W, clan isle E, croft/forest isle SE, desert isle SW; natural coasts with beaches and cliffs, NE snowy mountains, E plains, S marsh, lakes. Islands are close but never touch (channels ~19-32), crossed by short bridges. Old saves keep their land.

### v1.0.43 People voices / telepathy (c209, c210)
- __c209.speak(mood,pos,q,force,conv) -> calls __c210.said(); __c210.ev(trade|open|strike|mine|chop|ore|deep|build).
- Telepathy div [data-testid=telepathy], top 19vh, shows when speaker within 7.5 (4 for convo replies, 12 hurt/alarm/death), 6 s throttle.

## v1.0.45
- Mobs speak (Piper Scots clips hive_m/hive_f + en-GB Web Speech fallback), per-world SUNNY v206 brain (c209-c213), free will for clansmen (never unprovoked attacks), gifts via LT, 4-layer reflection, optional AI replies (LanguageModel -> localStorage key -> built-in), dance from video poses (c161).
- c214 terrain features (new worlds created after 01:00 GMT 28 Oct 2026), c215 shaders Low/High (SET.vfx), c216 rain occlusion heightmap + 3D rain audio, c217 gravel=dirt, id 133 = "Stone" (drops cobble), cave-block texture/shader pre-warm.
- c218: smart pick tool (RS / pad button 11, keyboard T; RS was unbound before). Snaw Yeti = nm07 redesigned: passive 'wander', dmg 0, procedural shaggy fur model (HD GLB 'yeti' retired for nm07), soft low grumble >=16 s apart, spawns rarely on snowy peaks (ground >= SEA+30), a.spec='yeti' so c143 doesn't sweep it, never fades by day.
- c219 (new/reset worlds only): carves the spawn skull's mouth + hollow interior (lanterns), and lays gravel/cobble roads with fences + lamps from spawn to the first bridge, between bridges, and on to each castle/island (detours round the skull).
- c215: Shaders default Low on phones (touch, not HIGH), High on desktop.

## v1.0.46
- c220: indoors/caves keep the outdoor sky, sun and fog (no false night); only deep closed caves get the dark cave look; only the rain sound changes under a roof.

## v1.0.47
- c221 + c121 WOODS w:7: wisteria wood (191 log, 192 leaves, 193 planks; reuses the Backrooms ids, that dimension is gone) - variants 607..657, corners 357/358; c214 wist() uses only 191/192.
- c113 (G47: created >= 1793156400000) bridge decks follow the max ground, slope-limited, never tunnels; c214 no trees in lanes; c219 road segments go through c155 tidy (floating tree parts removed); c222 lamp-161 iron stem on non-post blocks.
- Voices: c212/c212a dropped from the build, hive_m/hive_f mp3s deleted. c209 = 100 warm hummed tones (14 moods incl. happy/sad), no ring/shimmer, SUNNY_BRAIN.cycle per tone picks mood, 12-deep no-repeat; c213 say() -> c209.
- c223: clansman inventory (a.__inv, saved as d.c223 keyed "cx,cz,role"), pickup of useful drops (not within 3 of the player), eat from bag, gifts into bag, spill on death, visible held item + armour (procedural arm/head/legs and HD bones Fist.R/Head/Torso/UpperLeg/Foot).
- c224: SUNNY-chosen goals (fetch/chop/mine/rest), chop natural trees via fellTree, mine exposed stone/ore at or above feet under open sky (no placed blocks, nothing placed within 6 sideways / 3 below / 12 above), bag crafting wood->stone->iron/diamond tools, copper/iron armour, weapon dmg bonus on their swings, armour softens non-player hits. Only within castle S+9, player < 40, day.

## v1.0.48
- C225: Highland villager look (tunic, tartan kilt, belt pouch with cyan gem, boots/bracers, cyan eyes, cheek circuit lines, bobbing cyan rune); hair, mouth, dance, gear display kept. One shared atlas/material for phone perf.
- Creepers drop 0-2 gunpowder (existing IT.GUNPOWDER 172).
- C226: door/gate/trapdoor toggles no longer call saveWorld (dirty only); double doors pair with mirrored hinges and toggle together; never trapped (push-out, else stays open); Howk pickaxe enchant (c117) digs 2x3 facing the player, 1 wear per block (pick breaks at tier max), skips bedrock/containers/ENT blocks and player builds when digging natural rock.

## v1.0.49
- C227: a paired door with hinge 1 gets its panel UVs mirrored (u=1-u) so handles meet in the middle; neighbours re-check on door place/break and on load; unpaired doors revert.

## v1.0.50
- C228 fire rework: PLANT_MATS[FIRE] hidden; instanced lathe flame tongues (shader flicker/wobble, additive), glow discs, ember Points; fireTick replaced by creeping model (burn map: flammable blocks smoulder 1.6-8s then become FIRE), scorch decals (InstancedMesh, saved as d.c228), rain + sky-exposed extinguish, placed blocks never catch, cap 64.
- C229: c205 skull stamp + c219 carve skipped; volcano (R20, ~26 high, crater R5 with 2-deep lava, magma flows, obsidian rim) at the skull footprint, lush grass within 52 of spawn; FX smoke sprites, embers, glow, procedural rumble (current.c229 / d.c229). Menu hint CSS fix.
- C123: Thunner Cloudie targets hostile mobs only (bolts damageMob 6, never hurt the player).
- C230: dino footprint collision in moveMob (ring at r*0.78, knee..back height), look-ahead steering + unstick, stride footsteps (procedural), formant roars for allo/bary/apato.

## v1.0.51
- Markup: new SVG Celtic logo (.glogo, GlenUncial) in boot/title/loading; old .logo hidden via head CSS (#c231css); menuhint, loadRunner removed; menuDl hidden. C231: creative preset forced flat, Clydebank/Glen disabled.
- C132: track fade-out 3 s (less overlap). C111 chatter 10-24 s; C213 approach/away loop fixed (__metT 75 s cooldown).
- C161: Catmull-Rom keys + eased slerp follow (secondary motion). C225 rune y 2.85 / 3.0.
- C232: lips/mouth/brows (HD Head bone via __c135.post; procedural on head), mouth driven by __vT; player-drop rush + grab; stuck watchdog (3 s, hop 1-block steps, re-path, give up on 3rd), pathLimit 1400; POV cone (7/11 rays, 16 blocks, LOS mobs/player/held) -> a.__pov / a.__povV; __c232sel picks the tone (c209); home tower (8-ring x 8 levels, 1 block / 25 s, current.c232); raid via __bots.ff('war') after 20 min play.
- C233 awareness kernel: 40 ms setInterval, LOD (48 / 120), 24-filament lattice, blue/red/gold, self-attribution, observer, stable torus; IndexedDB glencraft_kernel/w per world id every 200 ms; gap catch-up <=1500 coarse steps, 60 per tick; f2 pulse, 3 gold resumes -> persist + f3 floor; LineSegments rings at the rune (<=3, 1 on low/phone); reset wipes.

## v1.0.52
- c234: castle folk 3D voxel A* (2 air over solid; steps/stairs, doors/gates opened; glass/fences blocked), exits via main entrance when goal outside, player collides() body + moveY physics, stuck -> ban/replan/give up, budgeted per frame; errands (a.__errand); folk exempt from despawn and LOD while on an errand.
- c235: hive plans per castle with turn-taking talk, votes/refusals, repetition penalty, cooldowns, boredom; player gestures (jump follow, nod yes, shake no), folk proposals, own nods/shakes.
- c209: villager words w_yes..w_mine, brighter voice, muffled only when a wall is between, replies within 18 blocks.

## v1.0.53
Reverted clansmen brain/AI parts (c210 c211 c213 c223 c224 c225 c232-c235); HD clansman model off; c236 cleanup; farmer/clansman hip box; dino spawn faster; volcano particles lighter on phone.

## v1.0.54
- c237 fire rewrite (point front, painted flame frames as CPU quad batches - InstancedMesh is skipped by the c79dc draw cull so batches carry userData.__dcR=1e9; char decals saved as d.c237).
- c238 photo pigs; nm25 Puddock Gob, nm18 Sludge Sooker, nmdrop removed.
- c239 pyramid murals (runtime capstone detection, decorative planes), c240 Egyptians + pharaoh (decorative).
- Logo/spinner: c128 theme and loading-block faces baked into the head (style#c128theme, style#c239cube), one SVG GLENCRAFT logo, spinner 1.4s, glen_cube_v3 removed.

## v1.0.55
- UI reskin via head <style id=uiskin>, art in site/assets/ui (slots, 9-slice panel, pills, hearts, XP bar, tab icons). Ships all of v1.0.54 as one update.

## v1.0.56
- c241: water swell/tide/slow rivers/ripples (u41Rip ring buffer), puddles + wetness, rain bed sound. c242: volcano eruption on gunshot hit (fireGun wrap), bombs/craters/lava fronts/ash, phases erupt 45s / calm 90s / cool 600s, saved current.c242. UI polish in #uiskin.

## v1.0.57
- c243: desert detection (rain/snow suppressed), sandstorms (fog/particles/wind), tic-tac UFOs (shoot -> crash crater, 14s freeze, alien visions with procedural voice), Element 115 puddles saved in current.c243.p.
- c244: IT.B115=391 bucket; scoop puddles; pour into volcano after current.c242ever -> blue eruption + wave -> Matrix mode (current.c244 {u,on}), pause toggle, Reset world clears.
- c242: blue eruption mode, c242ever flag, 70% bombs on spawn with bigger craters, stronger ash damage; player blocks still protected via mine().

## v1.0.58
- c243: desert factor dK from sand fraction (every 0.25s, 17 samples), constant sandstorm = dK with smooth lerp; weather.type getter masks rain/snow for all systems in desert (real weather kept); classic saucer UFO model; alien faces player, louder voice (AC.resume).
- c245: wind lifts light passive mobs (cap 2 phone / 4) with scripted float (no fall damage), drops drift.
- c244: Matrix tint via static multiply overlay (no CSS filter on canvas). c239: only green + purple murals. c114: panel shows PATCH_NOTES entries newer than its list.

## v1.0.59
- c246: classic saucer x4, 36 (24 LOW) emissive rainbow lights, tic-tac movement; shot -> 9s spiral with smoke/sparks -> crater (skips placed blocks), boom, shake, dust, smoking wreck.
- c246b: encounter LEN 200s (about 3.5 min with emerge/exit): iridescent bubble, orbiting shapes, glyph rings; alien with the players rainbow art skin (assets/ui/alien_skin.png), purple star eyes, raised hand; speechSynthesis voice + chirps; panes with c243/c248 scenes and PD clips (assets/video); YEAR 24000 at t 150-188; sets current.c246.met.
- c247: TV after met -> static + meteor (45s ETA), carve sandy region over frames (skips mine()/water), shockwave damage.
- c248: kaleido/tunnel/mandala/walls scenes, procedural soundtrack, chirp layers, YEAR 24000 (teleport near pyramid, chrome ground, mechs + mirrored reflections, skyline, red sky; restores position/fog/far).
- c239: third mural = the players alien painting (assets/ui/alien_art.png) on the hall back wall.

## v1.0.60
- c249: 4 NASA sprite billboards (assets/sky) at 85 from camera, additive, night only (fade by daylight), rotate with dayClock, green in Matrix mode, hidden in DIM.
- c243: storm dK forced to 0 while __c248.y===1 (YEAR 24000).

## v1.0.61
- build.py writes marker `glencraft-build: b1061-v1.0.61` (whole marker replaced; it used to append). c99/c188 regex [a-z0-9.-]+; c188 auto-updates on title screen once per live build (sessionStorage glen_autoupd).
- c114 renders one merged list (PATCH_NOTES wins over hard-coded NEW), sorted newest first.

## v1.0.62
- c249 planets in one ~85deg band (az -0.7..0.75, el 0.5-1.15), rotate about Y with dayClock.
- c250: moon texture assets/sky/moon.png, moon scale x MS (2.8x Jupiter), halo scaled; clouds onBeforeRender restore fog far to __c243.baseFar in storm (no fog pop) and cloudMat opacity fades by fadeK (tau 3s) from __c243.dKv.

## v1.0.63
- c243: storm target 0 while __c68().wlock === clear (pause-menu weather, saved in wset); U.clearLock.

## v1.0.64
- Boot: no 2.2 s minimum on the loading screen (c251); menu opens when textures are ready.
- Inline base64 images moved to site/assets/x/<sha1>.ext by extract_inline.py (run after build.py); index.html 30 MB -> 4.5 MB.
- Planet/moon textures and Skelp/dance sfx deferred until after the menu (window.__AM).
- Moon visible only when daylight < 0.45 and above horizon; opacity fades with night.

## v1.0.69
- Animal sounds: HRTF PannerNode, linear falloff to 24 blocks, max 4 voices, 1.1 s per animal. Non-animal sounds get occlusion (lowpass + gain) from roofs and blocks in the line of sight (c256).
- Desert music (c258) crossfades over 4 s when 6 of 9 samples are sand; off during UFO, encounter, YEAR 24000 or dance.
- Egyptians (c259): 14 outdoor folk (8 on low-end) around the pyramid with carry/pray/farm/drum. LT while aiming at one within 6 blocks starts a 33 s looping keyframed dance for all Egyptians within 18 blocks, with dance.ogg on an HRTF panner at their centre; LT again or moving 22+ blocks away stops it.
- Alien painting (c239) hidden until the alien encounter is done; placed on the first solid wall block.
