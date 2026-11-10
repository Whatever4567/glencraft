#!/usr/bin/env python3
"""Original WORLD-sung hooks for the Album hardcore sides.

Reuses the Piper + WORLD pipeline in build-vocals-1260.py (cc3d230).
Lyrics and melodies are new and must not quote the live remix hooks
("Up the glen, we never sleep", "Dance till the sun's on the hills",
"Over the loch, the heather glows", "Keep the fire on the hills",
"When the mist comes down the glen / I'll find my way home again",
"Call me over the high ground", "To the hills") or the Glen whistle theme.

Run under /workspace/tools/audio-venv (pyworld-prebuilt, praat-parselmouth).
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("build_vocals_1260", HERE / "build-vocals-1260.py")
V = importlib.util.module_from_spec(spec)
sys.modules["build_vocals_1260"] = V
spec.loader.exec_module(V)

OUT = Path("/workspace/qa/album/vocals")
SR = V.SR
BAR = V.BAR
SPB = V.SPB
PHRASE_DUR = V.PHRASE_DUR
EIGHTH = SPB / 2.0

# ---------------------------------------------------------------------------
# Original hooks. Values: (eighth-index 0..15, midi mid-register, dur 8ths, word)
# Nightcore +6 is applied inside WORLD so formants stay with the singer.
# Midis stay at or below 81 so +6 does not enter the unstable G#6 region.
# ---------------------------------------------------------------------------

# Bounce the Glen — E dorian (E F# G A B C# D). Mid: G4–F#5.
BOUNCE_A = [  # "Take the ridge, don't you wait"
    (0, 71, 2, "Take"), (2, 69, 1, "the"), (3, 74, 3, "ridge"),
    (6, 73, 2, "dont"), (8, 71, 1, "you"), (9, 69, 7, "wait"),
]
BOUNCE_B = [  # "Stamp the peat and let it fly"
    (0, 74, 2, "Stamp"), (2, 71, 1, "the"), (3, 76, 3, "peat"),
    (6, 73, 1, "and"), (7, 71, 1, "let"), (8, 73, 2, "it"), (10, 78, 6, "fly"),
]
BOUNCE_C = [  # "Hold this night a little more"
    (0, 73, 2, "Hold"), (2, 71, 1, "this"), (3, 76, 3, "night"),
    (6, 74, 1, "a"), (7, 73, 2, "little"), (9, 71, 7, "more"),
]
BOUNCE_TAG = [(0, 74, 2, "Take"), (2, 76, 2, "the"), (4, 78, 8, "ridge")]

# Nightcore Loch — F# aeolian (F# G# A B C# D E)
NIGHT_A = [  # "Blue as midnight, pull me close"
    (0, 73, 2, "Blue"), (2, 71, 1, "as"), (3, 74, 2, "mid"), (5, 76, 3, "night"),
    (8, 73, 2, "pull"), (10, 71, 1, "me"), (11, 69, 5, "close"),
]
NIGHT_B = [  # "I won't surface, I won't fade"
    (0, 76, 2, "I"), (2, 74, 2, "wont"), (4, 78, 2, "sur"), (6, 76, 2, "face"),
    (8, 74, 1, "I"), (9, 73, 2, "wont"), (11, 71, 5, "fade"),
]
NIGHT_C = [  # "Stars go under, I stay here"
    (0, 78, 2, "Stars"), (2, 76, 1, "go"), (3, 74, 3, "under"),
    (6, 73, 1, "I"), (7, 76, 2, "stay"), (9, 74, 7, "here"),
]
NIGHT_TAG = [(0, 73, 2, "Pull"), (2, 76, 2, "me"), (4, 78, 8, "close")]

# Cairn Flash — B dorian (B C# D E F# G# A)
CAIRN_A = [  # "Strike a spark against the dark"
    (0, 76, 2, "Strike"), (2, 74, 1, "a"), (3, 78, 3, "spark"),
    (6, 76, 1, "a"), (7, 74, 2, "gainst"), (9, 73, 1, "the"), (10, 71, 6, "dark"),
]
CAIRN_B = [  # "Watch it run from stone to sky"
    (0, 78, 2, "Watch"), (2, 76, 1, "it"), (3, 80, 2, "run"),
    (5, 76, 1, "from"), (6, 74, 2, "stone"), (8, 73, 1, "to"), (9, 78, 7, "sky"),
]
CAIRN_C = [  # "Leave a mark they'll never miss"
    (0, 74, 2, "Leave"), (2, 73, 1, "a"), (3, 76, 3, "mark"),
    (6, 74, 1, "theyll"), (7, 73, 2, "never"), (9, 71, 7, "miss"),
]
CAIRN_TAG = [(0, 76, 2, "Strike"), (2, 78, 2, "a"), (4, 80, 8, "spark")]

# Till the Hills — A dorian (A B C D E F# G). Avoid "hills" / "till the sun".
HILLS_A = [  # "Walk this path until we rise"
    (0, 71, 2, "Walk"), (2, 69, 1, "this"), (3, 74, 3, "path"),
    (6, 72, 1, "un"), (7, 74, 2, "til"), (9, 76, 1, "we"), (10, 78, 6, "rise"),
]
HILLS_B = [  # "Every step a brighter line"
    (0, 76, 1, "Ev"), (1, 74, 1, "ery"), (2, 76, 2, "step"),
    (4, 74, 1, "a"), (5, 78, 3, "brigh"), (8, 76, 2, "ter"), (10, 74, 6, "line"),
]
HILLS_C = [  # "Carry on, the sky is wide"
    (0, 74, 2, "Carry"), (2, 76, 2, "on"), (4, 74, 1, "the"),
    (5, 78, 3, "sky"), (8, 76, 1, "is"), (9, 79, 7, "wide"),
]
HILLS_TAG = [(0, 74, 2, "Walk"), (2, 76, 2, "this"), (4, 78, 8, "path")]

CHOPS = {
    "ridge": (74, "ridge"),
    "wait": (69, "wait"),
    "peat": (76, "peat"),
    "fly": (78, "fly"),
    "close": (69, "close"),
    "fade": (71, "fade"),
    "spark": (78, "spark"),
    "sky": (78, "sky"),
    "rise": (78, "rise"),
    "line": (74, "line"),
    "yeah": (76, "yeah"),
    "hey": (74, "hey"),
    "oh": (71, "ohhh"),
}

# Phonetic helpers for tight or clipped syllables.
V.SAY.update({
    "Take": "Take", "ridge": "ridge", "dont": "don't", "you": "you", "wait": "wait",
    "Stamp": "Stamp", "peat": "peat", "and": "and", "let": "let", "it": "it", "fly": "fly",
    "Hold": "Hold", "this": "this", "night": "night", "a": "a", "little": "little", "more": "more",
    "Blue": "Blue", "as": "as", "mid": "mid", "pull": "pull", "me": "me", "close": "close",
    "I": "I", "wont": "won't", "sur": "sir", "face": "face", "fade": "fade",
    "Pull": "Pull", "Stars": "Stars", "go": "go", "under": "under", "stay": "stay", "here": "here",
    "Strike": "Strike", "spark": "spark", "gainst": "gainst", "dark": "dark",
    "Watch": "Watch", "run": "run", "from": "from", "stone": "stone", "to": "to", "sky": "sky",
    "Leave": "Leave", "mark": "mark", "theyll": "they'll", "miss": "miss",
    "Walk": "Walk", "path": "path", "un": "un", "til": "til", "we": "we", "rise": "rise",
    "Ev": "Ev", "ery": "ery", "step": "step", "brigh": "bry", "ter": "ter", "line": "line",
    "Carry": "Carry", "on": "on", "is": "is", "wide": "wide",
    "ohhh": "ohhh",
})

SETS = {
    "bounce_a": (BOUNCE_A, 6.0, "lead"),
    "bounce_b": (BOUNCE_B, 6.0, "lead"),
    "bounce_c": (BOUNCE_C, 6.0, "lead"),
    "bounce_a_soft": (BOUNCE_A, 3.0, "intimate"),
    "bounce_tag": (BOUNCE_TAG, 6.0, "tag"),
    "night_a": (NIGHT_A, 6.0, "lead"),
    "night_b": (NIGHT_B, 6.0, "lead"),
    "night_c": (NIGHT_C, 6.0, "lead"),
    "night_a_lift": (NIGHT_A, 9.0, "lead"),
    "night_b_lift": (NIGHT_B, 9.0, "lead"),
    "night_c_lift": (NIGHT_C, 9.0, "lead"),
    "night_a_soft": (NIGHT_A, 3.0, "intimate"),
    "night_tag": (NIGHT_TAG, 6.0, "tag"),
    "cairn_a": (CAIRN_A, 6.0, "lead"),
    "cairn_b": (CAIRN_B, 6.0, "lead"),
    "cairn_c": (CAIRN_C, 6.0, "lead"),
    "cairn_a_soft": (CAIRN_A, 3.0, "intimate"),
    "cairn_tag": (CAIRN_TAG, 6.0, "tag"),
    "hills_a": (HILLS_A, 6.0, "lead"),
    "hills_b": (HILLS_B, 6.0, "lead"),
    "hills_c": (HILLS_C, 6.0, "lead"),
    "hills_a_soft": (HILLS_A, 3.0, "intimate"),
    "hills_tag": (HILLS_TAG, 6.0, "tag"),
}


def harmony_events(events, minor=True):
    iv = 3 if minor else 4
    return [(pos, mid + iv, dur, word) for pos, mid, dur, word in events]


def last_throw(events):
    pos, _m, dur, _w = events[-1]
    return [(pos * EIGHTH, dur * EIGHTH)]


def render_set(events, cache, pitch_st, kind):
    lead = V.render_hook(events, V.MODEL_LEAD, cache, pitch_st=pitch_st)
    dbl = V.render_hook(events, V.MODEL_DOUBLE, cache, pitch_st=pitch_st)
    harm = V.render_hook(harmony_events(events), V.MODEL_LEAD, cache, pitch_st=pitch_st)
    octv = V.octave_down(lead)
    if kind == "intimate":
        lead_fx = V.finish_intimate(lead, formant_shift=0.02)
        dbl_fx = V.finish_intimate(dbl, formant_shift=-0.02)
        harm_fx = V.finish_intimate(harm, formant_shift=0.03)
        oct_fx = V.plate_reverb(V.stereoize(octv, width_ms=8, width=0.08), wet=0.30, predelay_s=0.03, decay=1.6)
    elif kind == "tag":
        tag = V.plate_reverb(V.stereoize(lead, width_ms=10, width=0.2), wet=0.38, predelay_s=0.018, decay=1.6)
        tag = tag + V.plate_reverb(V.stereoize(dbl, width_ms=16, width=0.3), wet=0.40, predelay_s=0.03, decay=1.7) * 0.45
        peak = max(float(abs(tag).max()), 0.95)
        lead_fx = tag * (0.95 / peak)
        dbl_fx = lead_fx
        harm_fx = lead_fx
        oct_fx = V.stereoize(octv, width_ms=6, width=0.08)
    else:
        lead_fx = V.finish_lead(lead, throws=last_throw(events), formant_shift=0.035)
        dbl_fx = V.finish_layer(dbl, wet=0.18, width=0.32, delay_mix=0.08, formant_shift=-0.03)
        harm_fx = V.finish_layer(harm, wet=0.22, width=0.40, delay_mix=0.14, formant_shift=0.02)
        oct_fx = V.stereoize(octv, width_ms=6, width=0.08)
    return dict(lead=lead_fx, double=dbl_fx, harm=harm_fx, oct=oct_fx, dry=lead)


def render_chop(word, midi, cache, pitch_st=6.0):
    raw = V.get_word(word, V.MODEL_LEAD, cache)
    # hold about a beat and a half, WORLD onto the nightcore pitch
    dur8 = 3.0
    events = [(0.0, midi, dur8, word)]
    y = V.world_sing_hold(raw, midi, pitch_st=pitch_st, sr=SR, vibrato=True)
    return V.finish_layer(y, wet=0.14, width=0.22, delay_mix=0.08, formant_shift=0.02)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    cache = OUT / "_cache"
    cache.mkdir(exist_ok=True)
    manifest = {}
    for key, (events, st, kind) in SETS.items():
        print(f"rendering {key}  pitch_st={st}  {kind}", flush=True)
        stems = render_set(events, cache, st, kind)
        for part, audio in stems.items():
            path = OUT / f"hook_{key}_{part}.wav"
            V.write(path, audio)
        manifest[key] = {"pitch_st": st, "kind": kind, "events": events}
        # pitch self-listen on the dry WORLD lead
        dry_path = OUT / f"hook_{key}_dry.wav"
        listen = V.listen_stem(dry_path, events, pitch_st=st, sr=SR)
        manifest[key]["listen"] = {k: listen[k] for k in listen if k != "per_note"}
        print(f"  listen ok={listen.get('ok')}  med_err_cents={listen.get('median_abs_cents')}", flush=True)

    print("rendering chops…", flush=True)
    for name, (midi, word) in CHOPS.items():
        y = render_chop(word, midi, cache, pitch_st=6.0)
        V.write(OUT / f"chop_{name}.wav", y)

    (OUT / "MANIFEST.json").write_text(json.dumps(manifest, indent=2))
    fails = [k for k, m in manifest.items() if m.get("listen") and not m["listen"].get("ok", True)]
    print("done", "FAIL" if fails else "PASS", "fails=", fails)


if __name__ == "__main__":
    main()
