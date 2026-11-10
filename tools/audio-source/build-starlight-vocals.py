#!/usr/bin/env python3
"""Original WORLD-sung hooks for Starlight Show (122 BPM dance-pop).

Reuses the Piper + WORLD pipeline. Lyrics and melody are new and must not
quote the live remix, the bounce-side hooks, or the pop star's diegetic song.
Run under /workspace/tools/audio-venv.
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

# 122 BPM dance-pop phrasing (not the 165 BPM hardcore grid)
BPM = 122.0
V.BPM = BPM
V.SPB = 60.0 / BPM
V.BAR = 4 * V.SPB
V.PHRASE_DUR = 2 * V.BAR
EIGHTH = V.SPB / 2.0
PHRASE_DUR = V.PHRASE_DUR

OUT = Path("/workspace/qa/album/vocals")
SR = V.SR

# Ab ionian mid register (Ab4=68 … Ab5=80). +3 in WORLD.
# "Flash a signal, I'll be there"
STAR_A = [
    (0, 72, 2, "Flash"), (2, 70, 1, "a"), (3, 75, 2, "sig"), (5, 73, 1, "nal"),
    (6, 75, 2, "Ill"), (8, 73, 1, "be"), (9, 68, 7, "there"),
]
# "Raise the volume, fill the air"
STAR_B = [
    (0, 75, 2, "Raise"), (2, 73, 1, "the"), (3, 77, 2, "vol"), (5, 75, 1, "ume"),
    (6, 73, 2, "fill"), (8, 72, 1, "the"), (9, 70, 7, "air"),
]
# "Keep this feeling, I am here"
STAR_C = [
    (0, 73, 2, "Keep"), (2, 72, 1, "this"), (3, 77, 3, "feel"), (6, 75, 2, "ing"),
    (8, 73, 1, "I"), (9, 75, 2, "am"), (11, 72, 5, "here"),
]
STAR_TAG = [(0, 75, 2, "Ill"), (2, 77, 2, "be"), (4, 80, 8, "there")]

V.SAY.update({
    "Flash": "Flash", "sig": "sig", "nal": "nal", "Ill": "I'll", "be": "be", "there": "there",
    "Raise": "Raise", "vol": "vol", "ume": "ume", "fill": "fill", "air": "air",
    "Keep": "Keep", "feel": "feel", "ing": "ing", "am": "am", "here": "here",
    "this": "this", "I": "I", "a": "a", "the": "the",
})

SETS = {
    "star_a": (STAR_A, 3.0, "lead"),
    "star_b": (STAR_B, 3.0, "lead"),
    "star_c": (STAR_C, 3.0, "lead"),
    "star_a_soft": (STAR_A, 1.5, "intimate"),
    "star_tag": (STAR_TAG, 3.0, "tag"),
}


def harmony(events):
    return [(pos, mid + 4, dur, word) for pos, mid, dur, word in events]  # major third, ionian


def render_set(events, cache, pitch_st, kind):
    lead = V.render_hook(events, V.MODEL_LEAD, cache, phrase_dur=PHRASE_DUR, pitch_st=pitch_st)
    dbl = V.render_hook(events, V.MODEL_DOUBLE, cache, phrase_dur=PHRASE_DUR, pitch_st=pitch_st)
    harm = V.render_hook(harmony(events), V.MODEL_LEAD, cache, phrase_dur=PHRASE_DUR, pitch_st=pitch_st)
    octv = V.octave_down(lead)
    if kind == "intimate":
        lead_fx = V.finish_intimate(lead, formant_shift=0.02)
        dbl_fx = V.finish_intimate(dbl, formant_shift=-0.02)
        harm_fx = V.finish_intimate(harm, formant_shift=0.03)
        oct_fx = V.plate_reverb(V.stereoize(octv, width_ms=8, width=0.08), wet=0.30, predelay_s=0.03, decay=1.6)
    elif kind == "tag":
        tag = V.plate_reverb(V.stereoize(lead, width_ms=10, width=0.22), wet=0.36, predelay_s=0.018, decay=1.5)
        tag = tag + V.plate_reverb(V.stereoize(dbl, width_ms=16, width=0.3), wet=0.34, predelay_s=0.028, decay=1.6) * 0.45
        peak = max(float(abs(tag).max()), 0.95)
        lead_fx = tag * (0.95 / peak)
        dbl_fx = lead_fx
        harm_fx = lead_fx
        oct_fx = V.stereoize(octv, width_ms=6, width=0.08)
    else:
        pos, _m, dur, _w = events[-1]
        throws = [(pos * EIGHTH, dur * EIGHTH)]
        lead_fx = V.finish_lead(lead, throws=throws, formant_shift=0.028)
        dbl_fx = V.finish_layer(dbl, wet=0.16, width=0.30, delay_mix=0.08, formant_shift=-0.025)
        harm_fx = V.finish_layer(harm, wet=0.20, width=0.38, delay_mix=0.12, formant_shift=0.02)
        oct_fx = V.stereoize(octv, width_ms=6, width=0.08)
    return dict(lead=lead_fx, double=dbl_fx, harm=harm_fx, oct=oct_fx, dry=lead)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    cache = OUT / "_cache"
    cache.mkdir(exist_ok=True)
    manifest = {}
    for key, (events, st, kind) in SETS.items():
        print(f"rendering {key}  pitch_st={st}  {kind}  phrase={PHRASE_DUR:.3f}s", flush=True)
        stems = render_set(events, cache, st, kind)
        for part, audio in stems.items():
            V.write(OUT / f"hook_{key}_{part}.wav", audio)
        listen = V.listen_stem(OUT / f"hook_{key}_dry.wav", events, pitch_st=st, sr=SR)
        manifest[key] = {"pitch_st": st, "kind": kind, "events": events,
                         "listen": {k: listen[k] for k in listen if k != "per_note"}}
        print(f"  listen ok={listen.get('ok')}  med_err_cents={listen.get('median_abs_cents')}", flush=True)
    (OUT / "STARLIGHT_MANIFEST.json").write_text(json.dumps(manifest, indent=2))
    fails = [k for k, m in manifest.items() if m.get("listen") and not m["listen"].get("ok", True)]
    print("done", "FAIL" if fails else "PASS", "fails=", fails)


if __name__ == "__main__":
    main()
