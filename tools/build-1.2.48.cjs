#!/usr/bin/env node
'use strict';
// 1.2.48: friendly-NPC spider fix, pig pools/scale/anims/texture/voices,
// sparse Scottish birds, Glencraft mood music, rare cave one-shots, UFO hover,
// selectable soundtrack (Calm / Classic / Happy Hardcore remix of the old OST).
// Does not touch first-person arms, world-block atlas, 4K settings, or v12 armour files.
const fs = require('node:fs');
const path = require('node:path');
const out = process.argv[2] || path.join(__dirname, '../index.html');
let s = fs.readFileSync(out, 'utf8');
function one(a, b, label) {
  const i = s.indexOf(a);
  if (i < 0) throw new Error('missing ' + (label || a.slice(0, 100)));
  if (s.indexOf(a, i + 1) >= 0) throw new Error('not unique ' + (label || a.slice(0, 100)));
  s = s.slice(0, i) + b + s.slice(i + a.length);
}
function maybe(a, b, label) {
  if (!s.includes(a)) return false;
  one(a, b, label);
  return true;
}

if (!s.includes("const GAME_VERSION = '1.2.47';")) {
  if (!s.includes("const GAME_VERSION = '1.2.48';")) throw new Error('expected 1.2.47 base');
} else {
  one("const GAME_VERSION = '1.2.47';", "const GAME_VERSION = '1.2.48';", 'ver');
  one('<!-- glencraft-build: b1247-v1.2.47 -->', '<!-- glencraft-build: b1248-v1.2.48 -->', 'marker');
  one('window.PATCH_NOTES = [', 'window.PATCH_NOTES = [\n' + JSON.stringify({
    v: 'v1.2.48', d: '2026-11-09', notes: [
      'Spiders and other hostile mobs no longer hunt or damage clansmen and other friendly people.',
      'Mud pools are back in grassland and farmland for pigs. Pigs spawn near them, wander to the mud, wallow and roll, then stand up clean — they no longer lie on their side on the grass looking dead. While muddy they pick up a light tint that fades back to a warm pinkish skin.',
      'Pigs are a little bigger, with a proper four-leg walk, a trot when they flee, idle head, ear and tail movement, and snout rooting. Their oinks are quieter and less often.',
      'Birdsong is now sparse, quiet Scottish birds (robin, blackbird, wren, skylark, curlew, and gulls by the coast) in the daytime outdoors only, with the odd owl at night, and none in caves.',
      'Relaxing Glencraft music returns for day, night, the first cave layer, the blue cave, the purple cave and the deep hell cave, with quiet gaps and rare sounds unique to each cave.',
      'The flying saucer now hums with a soft alien hover that fades as it passes.',
      'The old Glencraft soundtrack is back as Classic: highland mist, glen dawn, loch night, heather air, under the glen, and the later pine, Skye, stone, cairn and ember sea pieces, shuffled with quiet gaps.',
      'Settings now has a Soundtrack picker: Calm (the new day, night and cave moods), Classic (the restored tracks), and a Happy Hardcore remix that turns those same melodies into a looping 170 BPM four-on-the-floor mix.'
    ]
  }) + ',', 'notes');
  one(
    "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.47'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.47')",
    "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.48'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.48')",
    'cache'
  );
}

// Sparse, quieter Scottish birds — daytime 20–90 s, night owl occasional 45–180 s.
maybe('nextB = t + R(3, 9)', 'nextB = t + R(20, 90)', 'bird-day');
maybe('nextB = t + R(14, 30)', 'nextB = t + R(45, 180)', 'bird-night');
maybe(
  "if (outdoor > 0.3 && t > nextB) { const p = R(-0.9, 0.9), v = R(0.3, 0.7);",
  "if (outdoor > 0.3 && t > nextB) { const p = R(-0.9, 0.9), v = R(0.14, 0.32);",
  'bird-vol'
);
// Rare cave one-shots (45–180 s). UKS pads are lowered so the new mood music can lead.
maybe('nextN = t + R(1.5, 4)', 'nextN = t + R(45, 180)', 'cave-fx');
maybe(
  'caveBus.gain.setTargetAtTime(band >= 0 ? Math.max(0, Math.min(1, SET.music)) * 0.8 : 0, t, 2)',
  'caveBus.gain.setTargetAtTime(band >= 0 ? Math.max(0, Math.min(1, SET.music)) * 0.18 : 0, t, 2)',
  'cave-bus'
);

// Spiders must not pick friendly NPCs as prey.
maybe(
  "m.kind === 'nspider' || m.kind === 'spider' || m.kind === 'treeman' || m.kind === 'dragon' || m.boss || m.tamed || m.mounted",
  "m.kind === 'nspider' || m.kind === 'spider' || m.kind === 'treeman' || m.kind === 'dragon' || m.boss || m.tamed || m.mounted || (window.__v1248 && __v1248.isFriendly(m))",
  'prey'
);

// Pigs spawn standing, clean, near the pool — they walk in and wallow themselves.
maybe(
  "st: 'lie', t: 0, r: sd * 1.45, side: sd, mud: 0.85, next: 4, tw: 1, twT: 0, snd: 2, sink: MUDON ? -0.17 : 0, dur: 15 + Math.random() * 30, wig: 1 + Math.random() * 3",
  "st: 'roam', t: 0, r: 0, side: sd, mud: 0, next: 2 + Math.random() * 6, tw: 1, twT: 0, snd: 8 + Math.random() * 17, sink: 0, dur: 0, wig: 0",
  'pig-spawn'
);
maybe("pig: {f: 'pig2', k: 1.0},", "pig: {f: 'pig2', k: 1.4},", 'pig-k');
maybe('S.mud = Math.max(0, S.mud - dt / 40)', 'S.mud = Math.max(0, S.mud - dt / 10)', 'mud-fade');

// The old 1 s interval rolled pigs onto their side (even after they left the mud).
maybe(
  "if (!a.wallow && (under === T.MUD || under === T.PEAT) && Math.random() < 0.12) { a.wallow = 4 + Math.random() * 3; a.spd0 = a.speed; a.speed = 0; }\n    if (a.wallow) { a.wallow -= 1; a.rig.rotation.z = a.wallow > 0 ? Math.sin(a.wallow * 2.2) * 1.2 : 0; if (a.wallow <= 0) { a.wallow = 0; a.speed = a.spd0 || 1; a.rig.rotation.z = 0; } if (Math.random() < 0.3) burst(p.x, p.y + 0.2, p.z, 0x5a4030, 4, .4); }",
  "/* 1.2.48: old 1s side-roll disabled; tickPig + v1248 keep pigs upright off the mud */",
  'old-wallow-int'
);


// Soundtrack picker in the pause / title settings, just under Music volume.
const musLabel = '    <label class="set" data-k="music"><span>Music volume<b id="musV"></b></span><input type="range" id="musVol" min="0" max="1" step="0.05" data-testid="settings-music-volume"></label>\n';
const ostHtml = musLabel +
  '    <div class="set inline"><span>Soundtrack</span><div class="seg" id="ostSeg">' +
  '<button data-ost="calm" data-testid="settings-ost-calm">Calm</button>' +
  '<button data-ost="classic" data-testid="settings-ost-classic">Classic</button>' +
  '<button data-ost="hardcore" data-testid="settings-ost-hardcore">Happy Hardcore</button>' +
  '</div></div>\n';
if (!s.includes('id="ostSeg"')) one(musLabel, ostHtml, 'ost-ui');

// Restore the later classic pieces into the old BGM bag (player is used as a fallback list).
if (!s.includes("id: 'pine', src: 'music/old_pine.mp3'")) {
  one(
    "{id: 'cave', src: 'music/under_the_glen.mp3', cave: 1}]}",
    "{id: 'cave', src: 'music/under_the_glen.mp3', cave: 1}, {id: 'pine', src: 'music/old_pine.mp3'}, {id: 'skye', src: 'music/skye_embers.mp3'}, {id: 'stone', src: 'music/stone_and_peat.mp3'}, {id: 'cairn', src: 'music/cairn.mp3'}, {id: 'embersea', src: 'music/ember_sea.mp3', cave: 1}]}",
    'bgm-tracks'
  );
}

// If this build already has 1.2.48 notes from an earlier pass, append the soundtrack bullets once.
if (s.includes('The flying saucer now hums with a soft alien hover that fades as it passes.')
    && !s.includes('Happy Hardcore remix')) {
  maybe(
    '"The flying saucer now hums with a soft alien hover that fades as it passes."]',
    '"The flying saucer now hums with a soft alien hover that fades as it passes.","The old Glencraft soundtrack is back as Classic: highland mist, glen dawn, loch night, heather air, under the glen, and the later pine, Skye, stone, cairn and ember sea pieces, shuffled with quiet gaps.","Settings now has a Soundtrack picker: Calm (the new day, night and cave moods), Classic (the restored tracks), and a Happy Hardcore remix that turns those same melodies into a looping 170 BPM four-on-the-floor mix."]',
    'notes-ost'
  );
}

// Inject or replace the 1.2.48 runtime at the end of the main script.
const src = fs.readFileSync(path.join(__dirname, 'content-source/v1248.js'), 'utf8');
if (s.includes('GLX-V1248')) {
  const start = s.indexOf('/* GLX-V1248');
  const end = s.indexOf('</script>', start);
  if (start < 0 || end < 0) throw new Error('cannot replace v1248 module');
  s = s.slice(0, start) + src + '\n' + s.slice(end);
} else {
  const i = s.lastIndexOf('</script>');
  if (i < 0) throw new Error('missing </script> to inject v1248');
  s = s.slice(0, i) + '\n' + src + '\n' + s.slice(i);
}


if (!s.includes("const GAME_VERSION = '1.2.48';")) throw new Error('missing 1.2.48 version');
if (!s.includes('GLX-V1248')) throw new Error('missing v1248 module');
if (!s.includes('worldTilesUntouched')) throw new Error('block-atlas revert marker missing — refused to ship a build that re-prisms world tiles');
if (!s.includes('__v1248') || !s.includes('isFriendly')) throw new Error('friendly-NPC guard missing');
if (!s.includes('id="ostSeg"') || !s.includes('Happy Hardcore')) throw new Error('soundtrack picker missing');
if (!s.includes("music/glen_dawn.mp3") || !s.includes('HC_BPM')) throw new Error('classic / hardcore soundtrack missing');

fs.writeFileSync(out, s);
fs.writeFileSync(path.join(path.dirname(path.resolve(out)), 'version.json'), JSON.stringify({v: '1.2.48'}) + '\n');
console.log('Built 1.2.48 audio-mobs: ' + out);
