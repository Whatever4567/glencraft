#!/usr/bin/env python3
"""Render batch 4 of the Glencraft Original Soundtrack.

Eight through-composed pieces: two more day colours, a bothy-warm pastoral,
a very still northern night, a high-ridge cue, an older beatless Agartha
memory, a boss cue with the Glen motif in the bass, and a crystal-cave
combat pulse. Same art bar as earlier batches. Recorded instruments are
only from the CC0 / MIT libraries in LICENSES.md. Stone Memory is beatless.
No piano-led writing. No copyrighted melodies or lyrics.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import engine1260 as E
import album_lib as A
import album_cinema as C
import master_album as M

_spec = importlib.util.spec_from_file_location("album_batch1", HERE / "render-album-batch1.py")
B1 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(B1)
spb, tbar, make_bus, put_theme = B1.spb, B1.tbar, B1.make_bus, B1.put_theme
inv_theme, retro_theme, hz, chord_hz = B1.inv_theme, B1.retro_theme, B1.hz, B1.chord_hz
_bells = B1._bells

SR = E.SR
QA = Path("/workspace/qa/album")
WAV = QA / "wav"
AN = QA / "analysis"


def write_wav(path, x):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), np.clip(x, -1.0, 1.0), SR, subtype="FLOAT")


def _pad_at(bus, t0, length, freqs, gain, lp, lfo=0.04):
    nn = int((length + 1.2) * SR)
    L, R = A.soft_pad(nn, freqs, gain=gain, lp=lp, lfo=lfo)
    E.add_stereo(bus, t0, L, R)


def _strings_at(bus, t0, length, freqs, gain, attack=1.0, release=1.1, bright=0.3):
    L, R = C.string_ensemble(int((length + 1.4) * SR), freqs, gain=gain,
                             attack=attack, release=release, bright=bright)
    E.add_stereo(bus, t0, L, R)


def _choir_at(bus, t0, length, freqs, form, gain, lp, rng, f0=92):
    nn = int((length + 2.0) * SR)
    L, R = A.choir_chord(nn, freqs, form, gain=gain, rng=rng)
    L, R = C.lp_tv(L, lp, Q=0.78), C.lp_tv(R, lp, Q=0.78)
    E.add_stereo(bus, t0, L, R)
    car = 0.5 * (L + R)
    path = [(0.0, (form[0], form[1], form[2])),
            (0.5, (form[0] * 1.12, form[1] * 0.95, form[2] * 1.08)),
            (1.0, (form[0] * 0.92, form[1], form[2] * 0.88))]
    mod = C.vowel_modulator(len(car), path, f0=f0)
    v = C.vocoder(car, mod, bands=13, lo=140, hi=4200)
    E.add_mono(bus, t0, C.fade_edges(v * 0.32, 0.5, 0.6), gain=1.0)


def _shape(bus, times, gains):
    t = np.arange(len(bus)) / SR
    bus *= np.interp(t, times, gains)[:, None]


def _hit(perc, rng, bpm, bar, kind, vel, pan=0.0, hard=False):
    t = C.humanize(tbar(bar, bpm), rng, 0.005)
    if kind == "bodhran":
        E.add_mono(perc, t, A.bodhran(rng, dur=0.3, tight=vel < 0.4, vel=vel), gain=1.0, pan=pan)
    elif kind == "hat":
        E.add_mono(perc, t, C.hat(rng, vel=vel, open_hat=hard), gain=1.0, pan=pan)
    elif kind == "ghost":
        E.add_mono(perc, t, C.ghost_stick(rng, vel=vel), gain=1.0, pan=pan)
    elif kind == "taiko":
        E.add_mono(perc, t, C.taiko(rng, vel=vel), gain=1.0, pan=pan)
    elif kind == "kick":
        E.add_mono(perc, t, C.cinematic_kick(rng, vel=vel, hard=hard), gain=1.0, pan=pan)
    elif kind == "snare":
        E.add_mono(perc, t, C.layered_snare(rng, vel=vel, tight=not hard), gain=1.0, pan=pan)
    return t


# ---------------------------------------------------------------------------
# 1. Moor Light — overworld day on the open moor. Bb mixolydian, airy.
# ---------------------------------------------------------------------------
def render_moor_light():
    bpm, bars = 70.0, 56  # 192.0 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9401)
    mode, root, root_lo = "mixolydian", 70, 58  # Bb
    shade_mode, shade_root = "dorian", 65       # F dorian peat-shadow (brief)
    n = close.shape[0]

    air_L, air_R = A.air_noise(n, rng, lo=280, hi=3200, gain=0.022)
    dL, dR = A.bagpipe_drone(n, A.midi(root_lo), gain=0.03)
    far[:n] += np.stack([air_L + dL, air_R + dR], 1)

    # A wide, rising-then-open figure — not the Glen theme
    MOOR = [5, 6, 8, 10, 9, 8, 6]
    MOOR_DUR = [2, 2, 2, 3, 2, 2, 3]
    MOOR_B = [8, 6, 5, 8, 10, 8, 5]
    MOOR_B_DUR = [2, 2, 2, 2, 3, 2, 3]

    _strings_at(mid, tbar(0, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.04, 1.4, 1.5, 0.18)
    _strings_at(mid, tbar(8, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.07, 1.0, 1.1, 0.28)
    _strings_at(mid, tbar(16, bpm), tbar(10, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.1, 0.7, 1.0, 0.38)
    _strings_at(mid, tbar(28, bpm), tbar(8, bpm), chord_hz(shade_root, [1, 5, 8], shade_mode, octave=-1), 0.045, 1.3, 1.5, 0.15)
    _strings_at(mid, tbar(36, bpm), tbar(12, bpm), chord_hz(root_lo, [1, 5, 8, 10], mode), 0.11, 0.6, 1.0, 0.4)
    _strings_at(mid, tbar(48, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.05, 1.2, 1.5, 0.2)

    def harp(b0, b1, root_, mode_, vel, pattern, bright=0.5):
        A.harp_arpeggio(close, tbar(b0, bpm), chord_hz(root_, [1, 3, 5, 8], mode_),
                        (b1 - b0) * 4, bpm, vel=vel, pattern=pattern, bright=bright)

    harp(0, 8, root, mode, 0.22, [0, 2, 1, 2], 0.42)
    harp(8, 16, root, mode, 0.3, [0, 2, 1, 3, 2, 1], 0.5)
    harp(16, 28, root, mode, 0.34, [0, 3, 1, 3, 2, 0], 0.54)
    harp(28, 36, shade_root, shade_mode, 0.16, [0, 2, 0, 1], 0.32)
    harp(36, 48, root, mode, 0.32, [0, 2, 3, 1, 3, 2], 0.52)
    harp(48, 56, root, mode, 0.22, [0, 2, 1], 0.4)

    A.add_phrase(close, tbar(8, bpm), MOOR, MOOR_DUR, root, mode, A.tin_whistle, bpm, vel=0.64, pan=-0.14)
    A.add_phrase(close, tbar(16, bpm), MOOR_B, MOOR_B_DUR, root, mode, A.fiddle_note, bpm, vel=0.5, pan=0.26)
    A.add_phrase(close, tbar(22, bpm), list(reversed(MOOR)), [2, 2, 2, 2, 2, 2, 4], root, mode, A.tin_whistle, bpm, vel=0.58, pan=-0.1)
    A.add_phrase(close, tbar(29, bpm), [5, 6, 5], [4, 4, 8], shade_root, shade_mode, A.tin_whistle, bpm, vel=0.34, low=True, pan=-0.2)
    A.add_phrase(close, tbar(36, bpm), MOOR, MOOR_DUR, root + 12, mode, A.tin_whistle, bpm, vel=0.7, pan=-0.1)
    A.add_phrase(close, tbar(44, bpm), MOOR_B, MOOR_B_DUR, root, mode, A.fiddle_note, bpm, vel=0.48, pan=0.24)
    A.add_phrase(close, tbar(48, bpm), [8, 6, 5, 1], [2, 3, 3, 8], root, mode, A.tin_whistle, bpm, vel=0.4, pan=-0.12)

    hL, hR = C.horn_swell(hz(root_lo, 5, mode), 3.4, vel=0.26, bright=0.32)
    E.add_stereo(mid, tbar(35.2, bpm), hL, hR)

    for b in range(8, 16):
        if b % 2 == 0:
            _hit(perc, rng, bpm, float(b), "bodhran", 0.2)
    for b in range(16, 28):
        _hit(perc, rng, bpm, float(b), "bodhran", 0.28 if b % 2 == 0 else 0.2)
        if b % 4 == 3:
            _hit(perc, rng, bpm, b + 0.5, "ghost", 0.1, -0.2)
    _hit(perc, rng, bpm, 31.0, "bodhran", 0.12)
    for b, k, v, p in [(36, "bodhran", 0.3, 0.0), (38, "bodhran", 0.22, 0.0), (40, "bodhran", 0.26, 0.0),
                       (44, "bodhran", 0.2, 0.0), (48, "bodhran", 0.18, 0.0), (52, "bodhran", 0.12, 0.0)]:
        _hit(perc, rng, bpm, b, k, v, p)

    close = C.polish_stem(close, hp=60, air_db=2.0)
    mid = C.polish_stem(mid, hp=30, mud_cut_db=-1.0)
    far = C.polish_stem(far, hp=26)
    perc = C.polish_stem(perc, hp=24)
    mixed = C.depth_mix(close, mid, far, perc, 1.0, 0.88, 0.92, 0.62)
    mixed = A.apply_reverb(mixed, np.random.default_rng(41), ir_s=3.2, wet=0.3, dry=1.0, pre=0.04, dark=2800)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=2.6, target_lufs=-14.5, split=125)
    sections = [
        ("open_heath", 0.0, tbar(8, bpm)),
        ("long_view", tbar(8, bpm), tbar(16, bpm)),
        ("wind_comb", tbar(16, bpm), tbar(28, bpm)),
        ("peat_shadow", tbar(28, bpm), tbar(36, bpm)),
        ("wide_return", tbar(36, bpm), tbar(48, bpm)),
        ("fade_ridge", tbar(48, bpm), dur),
    ]
    return out, sections, dict(title="Moor Light", context="moor", bpm=bpm, target_lufs=-14.5)


# ---------------------------------------------------------------------------
# 2. Midday Glen — brighter noon colour of the Glen theme. A ionian.
# ---------------------------------------------------------------------------
def render_midday_glen():
    bpm, bars = 92.0, 74  # 193.0 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9402)
    mode, root, root_lo = "ionian", 69, 57  # A
    haze_mode, haze_root = "lydian", 69     # A lydian heat-haze (#4)
    n = close.shape[0]

    air_L, air_R = A.air_noise(n, rng, lo=350, hi=3600, gain=0.016)
    far[:n] += np.stack([air_L, air_R], 1)

    _strings_at(mid, tbar(0, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.045, 1.1, 1.2, 0.22)
    _strings_at(mid, tbar(8, bpm), tbar(10, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.09, 0.7, 0.9, 0.4)
    _strings_at(mid, tbar(18, bpm), tbar(10, bpm), chord_hz(root_lo, [1, 5, 8, 10], mode), 0.12, 0.5, 0.8, 0.5)
    _strings_at(mid, tbar(32, bpm), tbar(10, bpm), chord_hz(haze_root, [1, 3, 5, 8], haze_mode, octave=-1), 0.05, 1.2, 1.4, 0.22)
    _strings_at(mid, tbar(42, bpm), tbar(16, bpm), chord_hz(root_lo, [1, 3, 5, 8, 10], mode), 0.13, 0.45, 0.8, 0.52)
    _strings_at(mid, tbar(58, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.05, 1.2, 1.4, 0.2)
    _strings_at(mid, tbar(66, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.07, 0.9, 1.2, 0.28)

    def harp(b0, b1, root_, mode_, vel, pattern, bright=0.55):
        A.harp_arpeggio(close, tbar(b0, bpm), chord_hz(root_, [1, 3, 5, 8], mode_),
                        (b1 - b0) * 4, bpm, vel=vel, pattern=pattern, bright=bright)

    harp(0, 8, root, mode, 0.26, [0, 2, 1, 2], 0.5)
    harp(8, 18, root, mode, 0.34, [0, 2, 1, 3, 2, 1], 0.58)
    harp(18, 32, root, mode, 0.38, [0, 3, 1, 3, 2, 0], 0.62)
    harp(32, 42, haze_root, haze_mode, 0.2, [0, 2, 0, 1], 0.4)
    harp(42, 58, root, mode, 0.36, [0, 2, 3, 1, 3, 2], 0.6)
    harp(58, 66, root, mode, 0.18, [0, 2], 0.4)
    harp(66, 74, root, mode, 0.28, [0, 2, 1, 2], 0.5)

    # Brighter noon colour of the Glen theme, then inversion, then a climbing midday figure
    put_theme(close, tbar(8, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.7, pan=-0.12)
    put_theme(close, tbar(14, bpm), root, mode, bpm, A.fiddle_note, "b", vel=0.58, pan=0.26)
    A.add_phrase(close, tbar(18, bpm), [5, 6, 8, 10, 9, 8], [1, 1, 2, 2, 2, 8], root, mode, A.fiddle_note, bpm, vel=0.6, pan=0.24)
    put_theme(close, tbar(24, bpm), root + 12, mode, bpm, A.tin_whistle, "a", vel=0.76, pan=-0.1)
    A.add_phrase(close, tbar(33, bpm), [8, 9, 8], [3, 3, 6], haze_root, haze_mode, A.tin_whistle, bpm, vel=0.36, pan=-0.16)
    A.add_phrase(close, tbar(37, bpm), [5, 7, 8], [3, 3, 6], haze_root, haze_mode, A.tin_whistle, bpm, vel=0.34, pan=0.14)
    put_theme(close, tbar(42, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.72, pan=-0.12)
    A.add_phrase(close, tbar(48, bpm), *inv_theme(), root, mode, A.fiddle_note, bpm, vel=0.58, pan=0.28)
    put_theme(close, tbar(54, bpm), root + 12, mode, bpm, A.tin_whistle, "b", vel=0.7, pan=-0.1)
    A.add_phrase(close, tbar(60, bpm), [8, 5, 3], [3, 3, 6], root, mode, A.tin_whistle, bpm, vel=0.32, low=True, pan=-0.18)
    A.add_phrase(close, tbar(66, bpm), [8, 6, 5, 1], [2, 2, 3, 9], root, mode, A.tin_whistle, bpm, vel=0.48, pan=-0.1)

    for b0, degs in ((18, [1, 5, 8, 5]), (20, [3, 5, 8, 10]), (22, [1, 5, 9, 8]),
                     (42, [1, 5, 8, 10, 8, 5]), (46, [3, 5, 8, 9, 8, 5]), (50, [1, 4, 8, 10, 8, 4])):
        for i, d in enumerate(degs):
            L, R = C.avicii_pluck(hz(root_lo, d, mode), spb(bpm) * 1.2, vel=0.34, bright=0.7)
            E.add_stereo(mid, tbar(b0, bpm) + i * 0.5 * spb(bpm), L, R, gain=0.65)

    hL, hR = C.horn_swell(hz(root_lo, 5, mode), 3.0, vel=0.3, bright=0.42)
    E.add_stereo(mid, tbar(41.2, bpm), hL, hR)

    for b in range(8, 18):
        _hit(perc, rng, bpm, float(b), "bodhran", 0.28 if b % 2 == 0 else 0.2)
        if b % 4 == 3:
            _hit(perc, rng, bpm, b + 0.5, "hat", 0.12, 0.2)
    for b in range(18, 32):
        _hit(perc, rng, bpm, float(b), "bodhran", 0.36 if b % 2 == 0 else 0.24)
        _hit(perc, rng, bpm, b + 0.5, "hat", 0.14, 0.18 if b % 2 else -0.16)
        if b % 4 == 1:
            _hit(perc, rng, bpm, b + 0.75, "ghost", 0.12, -0.2)
    _hit(perc, rng, bpm, 34.0, "bodhran", 0.14)
    _hit(perc, rng, bpm, 38.0, "bodhran", 0.12)
    for b, k, v, p in [
        (42.00, "bodhran", 0.4, 0.0), (42.50, "hat", 0.16, 0.2), (43.00, "bodhran", 0.28, 0.0),
        (44.00, "bodhran", 0.36, 0.0), (45.75, "ghost", 0.14, -0.2), (46.00, "bodhran", 0.34, 0.0),
        (48.00, "bodhran", 0.38, 0.0), (50.00, "bodhran", 0.3, 0.0), (52.00, "bodhran", 0.28, 0.0),
        (54.00, "bodhran", 0.32, 0.0), (58.00, "bodhran", 0.18, 0.0), (62.00, "bodhran", 0.14, 0.0),
        (66.00, "bodhran", 0.22, 0.0), (70.00, "bodhran", 0.16, 0.0),
    ]:
        _hit(perc, rng, bpm, b, k, v, p)

    close = C.polish_stem(close, hp=60, air_db=2.0)
    mid = C.polish_stem(mid, hp=32, mud_cut_db=-1.2)
    far = C.polish_stem(far, hp=28)
    perc = C.polish_stem(perc, hp=24)
    mixed = C.depth_mix(close, mid, far, perc, 1.05, 0.9, 0.75, 0.8)
    mixed = A.apply_reverb(mixed, np.random.default_rng(42), ir_s=2.3, wet=0.22, dry=1.0, pre=0.025, dark=3200)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=2.0, target_lufs=-14.0, split=125)
    sections = [
        ("dawn_gone", 0.0, tbar(8, bpm)),
        ("high_sun", tbar(8, bpm), tbar(18, bpm)),
        ("fiddle_noon", tbar(18, bpm), tbar(32, bpm)),
        ("heat_haze", tbar(32, bpm), tbar(42, bpm)),
        ("glen_full", tbar(42, bpm), tbar(58, bpm)),
        ("siesta", tbar(58, bpm), tbar(66, bpm)),
        ("walk_on", tbar(66, bpm), dur),
    ]
    return out, sections, dict(title="Midday Glen", context="day", bpm=bpm, target_lufs=-14.0)


# ---------------------------------------------------------------------------
# 3. Bothy Smoke — warmer, indoor-adjacent pastoral. F mixolydian, close.
# ---------------------------------------------------------------------------
def render_bothy_smoke():
    bpm, bars = 62.0, 50  # 193.55 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9403)
    mode, root, root_lo = "mixolydian", 65, 53  # F
    n = close.shape[0]

    # Closer room: less outdoor air, a short wooden room tone
    air_L, air_R = A.air_noise(n, rng, lo=120, hi=900, gain=0.01)
    dL, dR = A.bagpipe_drone(n, A.midi(root_lo), gain=0.045)
    far[:n] += np.stack([air_L + dL * 0.6, air_R + dR * 0.6], 1)

    BOTHY = [1, 3, 5, 6, 5, 3, 1]
    BOTHY_DUR = [2, 2, 2, 2, 2, 2, 4]
    STORY = [8, 6, 5, 8, 9, 8, 6, 5]
    STORY_DUR = [2, 1, 1, 2, 2, 2, 2, 4]

    _pad_at(far, 0, tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.06, 1100, 0.03)
    _strings_at(mid, tbar(6, bpm), tbar(10, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.06, 1.4, 1.4, 0.18)
    _strings_at(mid, tbar(16, bpm), tbar(10, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.09, 0.9, 1.1, 0.26)
    _choir_at(mid, tbar(18, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode),
              [480, 820, 1500], 0.045, 1300, rng, f0=84)
    _strings_at(mid, tbar(28, bpm), tbar(10, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.08, 1.0, 1.2, 0.24)
    _pad_at(far, tbar(38, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.04, 800, 0.025)
    _strings_at(mid, tbar(42, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.05, 1.3, 1.5, 0.18)

    A.harp_arpeggio(close, tbar(0, bpm), chord_hz(root, [1, 3, 5], mode), 32, bpm, vel=0.28, pattern=[0, 2, 1, 2], bright=0.35)
    A.harp_arpeggio(close, tbar(8, bpm), chord_hz(root, [1, 3, 5, 8], mode), 32, bpm, vel=0.32, pattern=[0, 2, 1, 3, 2, 1], bright=0.4)
    A.harp_arpeggio(close, tbar(16, bpm), chord_hz(root, [1, 3, 5, 8], mode), 40, bpm, vel=0.3, pattern=[0, 2, 0, 1, 3, 2], bright=0.38)
    A.harp_arpeggio(close, tbar(28, bpm), chord_hz(root, [1, 3, 5, 8], mode), 40, bpm, vel=0.3, pattern=[0, 3, 1, 2], bright=0.4)
    A.harp_arpeggio(close, tbar(38, bpm), chord_hz(root, [1, 5], mode), 32, bpm, vel=0.18, pattern=[0, 1], bright=0.3)
    A.harp_arpeggio(close, tbar(42, bpm), chord_hz(root, [1, 3, 5], mode), 32, bpm, vel=0.24, pattern=[0, 2, 1], bright=0.34)

    A.add_phrase(close, tbar(4, bpm), BOTHY, BOTHY_DUR, root, mode, A.tin_whistle, bpm, vel=0.48, low=True, pan=-0.1)
    A.add_phrase(close, tbar(12, bpm), BOTHY, BOTHY_DUR, root, mode, A.tin_whistle, bpm, vel=0.55, pan=-0.12)
    A.add_phrase(close, tbar(20, bpm), STORY, STORY_DUR, root, mode, A.tin_whistle, bpm, vel=0.58, pan=-0.1)
    A.add_phrase(close, tbar(28, bpm), list(reversed(STORY)), list(reversed(STORY_DUR)), root, mode, A.fiddle_note, bpm, vel=0.42, pan=0.2)
    A.add_phrase(close, tbar(36, bpm), [5, 3, 1], [4, 4, 8], root, mode, A.tin_whistle, bpm, vel=0.32, low=True, pan=-0.16)
    A.add_phrase(close, tbar(42, bpm), BOTHY, BOTHY_DUR, root, mode, A.tin_whistle, bpm, vel=0.46, pan=-0.12)

    for b, v in ((8.0, 0.16), (12.0, 0.14), (16.0, 0.2), (20.0, 0.16), (24.0, 0.18),
                 (28.0, 0.16), (32.0, 0.14), (42.0, 0.14), (46.0, 0.1)):
        _hit(perc, rng, bpm, b, "bodhran", v)

    _shape(far,   [0, tbar(8, bpm), tbar(16, bpm), tbar(28, bpm), tbar(38, bpm), tbar(42, bpm), dur],
                  [0.55, 0.75, 1.0, 0.9, 0.45, 0.7, 0.45])
    _shape(mid,   [0, tbar(8, bpm), tbar(16, bpm), tbar(28, bpm), tbar(38, bpm), tbar(42, bpm), dur],
                  [0.35, 0.7, 1.05, 0.95, 0.35, 0.7, 0.4])
    _shape(close, [0, tbar(8, bpm), tbar(16, bpm), tbar(28, bpm), tbar(38, bpm), tbar(42, bpm), dur],
                  [0.7, 0.9, 1.05, 1.0, 0.4, 0.8, 0.5])

    close = C.polish_stem(close, hp=50, air_db=0.6)
    mid = C.polish_stem(mid, hp=28, mud_cut_db=-0.6)
    far = C.polish_stem(far, hp=22)
    perc = C.polish_stem(perc, hp=22)
    mixed = C.depth_mix(close, mid, far, perc, 1.15, 0.85, 0.65, 0.55)
    mixed = A.apply_reverb(mixed, np.random.default_rng(43), ir_s=1.7, wet=0.18, dry=1.0, pre=0.015, dark=1800)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=2.8, target_lufs=-15.0, split=120)
    sections = [
        ("door_latch", 0.0, tbar(8, bpm)),
        ("hearth", tbar(8, bpm), tbar(16, bpm)),
        ("kettle", tbar(16, bpm), tbar(28, bpm)),
        ("story", tbar(28, bpm), tbar(38, bpm)),
        ("ember_quiet", tbar(38, bpm), tbar(42, bpm)),
        ("late_word", tbar(42, bpm), dur),
    ]
    return out, sections, dict(title="Bothy Smoke", context="day", bpm=bpm, target_lufs=-15.0)


# ---------------------------------------------------------------------------
# 4. Northern Quiet — overworld night, cold high ridge, almost still. Eb aeolian.
# ---------------------------------------------------------------------------
def render_northern_quiet():
    bpm, bars = 44.0, 36  # 196.36 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9404)
    mode, root, root_lo = "aeolian", 63, 51  # Eb
    n = close.shape[0]

    sL, sR = A.sub_drone(n, A.midi(27), gain=0.1, lfo=0.015)  # Eb0
    air_L, air_R = A.air_noise(n, rng, lo=160, hi=1400, gain=0.016)
    far[:n] += np.stack([sL + air_L, sR + air_R], 1)

    _pad_at(far, 0, tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.05, 800, 0.02)
    _strings_at(mid, tbar(8, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.04, 1.8, 2.0, 0.14)
    _strings_at(mid, tbar(16, bpm), tbar(6, bpm), chord_hz(root_lo, [1], mode), 0.025, 2.0, 2.2, 0.1)  # no bird
    _choir_at(mid, tbar(22, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode),
              [420, 780, 1600], 0.07, 1600, rng, f0=72)  # aurora
    _strings_at(mid, tbar(24, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.05, 1.6, 1.8, 0.16)
    _pad_at(far, tbar(30, bpm), tbar(6, bpm), chord_hz(root_lo, [1, 5], mode), 0.04, 700, 0.02)

    A.add_phrase(close, tbar(2, bpm), [5, 8], [6, 10], root, mode, A.tin_whistle, bpm, vel=0.32, low=True, pan=-0.2)
    A.add_phrase(close, tbar(8, bpm), [8, 5, 3], [6, 6, 8], root, mode, A.tin_whistle, bpm, vel=0.4, low=True, pan=-0.14)
    # no_bird: one far harmonic only
    A.add_phrase(close, tbar(17, bpm), [5], [10], root - 12, mode, A.tin_whistle, bpm, vel=0.2, low=True, pan=0.22)
    A.add_phrase(close, tbar(22, bpm), [5, 8, 10, 8], [4, 4, 6, 8], root, mode, A.tin_whistle, bpm, vel=0.38, pan=-0.12)
    A.add_phrase(close, tbar(30, bpm), [8, 5, 1], [4, 6, 10], root, mode, A.tin_whistle, bpm, vel=0.28, low=True, pan=-0.1)
    # a few icy bells only in the aurora
    _bells(close, [(tbar(24, bpm), hz(root + 12, 8, mode), 6.0, 0.22),
                   (tbar(27.5, bpm), hz(root + 12, 5, mode), 7.0, 0.18),
                   (tbar(32, bpm), hz(root, 8, mode), 8.0, 0.14)], rng, vel_scale=0.45)

    _shape(far,   [0, tbar(8, bpm), tbar(16, bpm), tbar(22, bpm), tbar(30, bpm), dur],
                  [0.55, 0.8, 0.4, 1.15, 0.7, 0.45])
    _shape(mid,   [0, tbar(8, bpm), tbar(16, bpm), tbar(22, bpm), tbar(30, bpm), dur],
                  [0.25, 0.65, 0.2, 1.2, 0.55, 0.3])
    _shape(close, [0, tbar(8, bpm), tbar(16, bpm), tbar(22, bpm), tbar(30, bpm), dur],
                  [0.45, 0.7, 0.25, 1.05, 0.6, 0.35])

    close = C.polish_stem(close, hp=55, air_db=1.8)
    mid = C.polish_stem(mid, hp=24)
    far = C.polish_stem(far, hp=18)
    mixed = C.depth_mix(close, mid, far, None, 1.0, 0.95, 1.1)
    mixed = A.apply_reverb(mixed, np.random.default_rng(44), ir_s=5.4, wet=0.48, dry=0.85, pre=0.07, dark=1800)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=4.0, target_lufs=-16.0, split=105)
    sections = [
        ("first_frost", 0.0, tbar(8, bpm)),
        ("long_ridge", tbar(8, bpm), tbar(16, bpm)),
        ("no_bird", tbar(16, bpm), tbar(22, bpm)),
        ("aurora", tbar(22, bpm), tbar(30, bpm)),
        ("still", tbar(30, bpm), dur),
    ]
    return out, sections, dict(title="Northern Quiet", context="night", bpm=bpm, target_lufs=-16.0)


# ---------------------------------------------------------------------------
# 5. Ridge Wind — dedicated high-country cue. D lydian, airy.
# ---------------------------------------------------------------------------
def render_ridge_wind():
    bpm, bars = 68.0, 54  # 190.6 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9405)
    mode, root, root_lo = "lydian", 62, 50  # D lydian (#4), distinct from the D mixolydian Glen home
    n = close.shape[0]

    air_L, air_R = A.air_noise(n, rng, lo=200, hi=3800, gain=0.026)
    dL, dR = A.bagpipe_drone(n, A.midi(root_lo), gain=0.03)
    far[:n] += np.stack([air_L + dL, air_R + dR], 1)

    RIDGE = [5, 7, 8, 9, 8, 7, 5]          # the raised 7 is the lydian #4 colour
    RIDGE_DUR = [2, 2, 2, 2, 2, 2, 4]
    RIDGE_B = [8, 7, 5, 8, 10, 8, 5]
    RIDGE_B_DUR = [2, 2, 2, 2, 3, 2, 3]

    _strings_at(mid, tbar(0, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.045, 1.3, 1.4, 0.2)
    _strings_at(mid, tbar(8, bpm), tbar(10, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.09, 0.8, 1.0, 0.36)
    _strings_at(mid, tbar(18, bpm), tbar(10, bpm), chord_hz(root_lo, [1, 5, 7, 8], mode), 0.11, 0.6, 0.9, 0.42)
    _strings_at(mid, tbar(28, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.06, 1.2, 1.4, 0.18)  # cairn
    _strings_at(mid, tbar(36, bpm), tbar(10, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.08, 0.9, 1.1, 0.3)
    _strings_at(mid, tbar(46, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.045, 1.3, 1.5, 0.18)

    def harp(b0, b1, vel, pattern, bright=0.5):
        A.harp_arpeggio(close, tbar(b0, bpm), chord_hz(root, [1, 3, 5, 7], mode),
                        (b1 - b0) * 4, bpm, vel=vel, pattern=pattern, bright=bright)

    harp(0, 8, 0.24, [0, 2, 1, 2], 0.48)
    harp(8, 18, 0.32, [0, 2, 3, 1, 3, 2], 0.55)
    harp(18, 28, 0.36, [0, 3, 1, 3, 2, 0], 0.58)
    harp(28, 36, 0.2, [0, 2, 0, 1], 0.4)
    harp(36, 46, 0.3, [0, 2, 1, 3, 2, 1], 0.5)
    harp(46, 54, 0.22, [0, 2, 1], 0.42)

    A.add_phrase(close, tbar(8, bpm), RIDGE, RIDGE_DUR, root, mode, A.tin_whistle, bpm, vel=0.66, pan=-0.14)
    A.add_phrase(close, tbar(18, bpm), RIDGE_B, RIDGE_B_DUR, root, mode, A.fiddle_note, bpm, vel=0.52, pan=0.26)
    A.add_phrase(close, tbar(24, bpm), list(reversed(RIDGE)), [2, 2, 2, 2, 2, 2, 4], root + 12, mode, A.tin_whistle, bpm, vel=0.64, pan=-0.1)
    hL, hR = C.horn_swell(hz(root_lo, 5, mode), 3.8, vel=0.34, bright=0.4)
    E.add_stereo(mid, tbar(27.4, bpm), hL, hR)
    A.add_phrase(close, tbar(30, bpm), [5, 7, 5], [4, 4, 8], root, mode, A.tin_whistle, bpm, vel=0.36, low=True, pan=-0.18)
    A.add_phrase(close, tbar(36, bpm), RIDGE, RIDGE_DUR, root, mode, A.tin_whistle, bpm, vel=0.6, pan=-0.12)
    A.add_phrase(close, tbar(46, bpm), [8, 7, 5, 1], [2, 3, 3, 10], root, mode, A.tin_whistle, bpm, vel=0.4, pan=-0.1)

    for b in range(8, 18):
        if b % 2 == 0:
            _hit(perc, rng, bpm, float(b), "bodhran", 0.22)
    for b in range(18, 28):
        _hit(perc, rng, bpm, float(b), "bodhran", 0.3 if b % 2 == 0 else 0.2)
        if b % 4 == 3:
            _hit(perc, rng, bpm, b + 0.5, "ghost", 0.12, -0.2)
    _hit(perc, rng, bpm, 29.0, "bodhran", 0.14)
    for b, v in ((36.0, 0.24), (40.0, 0.18), (46.0, 0.16), (50.0, 0.12)):
        _hit(perc, rng, bpm, b, "bodhran", v)

    close = C.polish_stem(close, hp=58, air_db=2.2)
    mid = C.polish_stem(mid, hp=30, mud_cut_db=-1.0)
    far = C.polish_stem(far, hp=24)
    perc = C.polish_stem(perc, hp=24)
    mixed = C.depth_mix(close, mid, far, perc, 1.0, 0.88, 1.0, 0.65)
    mixed = A.apply_reverb(mixed, np.random.default_rng(45), ir_s=3.4, wet=0.32, dry=0.98, pre=0.04, dark=2600)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=2.6, target_lufs=-14.5, split=125)
    sections = [
        ("ascent", 0.0, tbar(8, bpm)),
        ("knife_edge", tbar(8, bpm), tbar(18, bpm)),
        ("wind_scroll", tbar(18, bpm), tbar(28, bpm)),
        ("cairn", tbar(28, bpm), tbar(36, bpm)),
        ("descent", tbar(36, bpm), tbar(46, bpm)),
        ("last_look", tbar(46, bpm), dur),
    ]
    return out, sections, dict(title="Ridge Wind", context="high", bpm=bpm, target_lufs=-14.5)


# ---------------------------------------------------------------------------
# 6. Stone Memory — older, more hollow Agartha. Beatless, liturgical.
# ---------------------------------------------------------------------------
def render_stone_memory():
    dur = 220.0
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9406)
    n = close.shape[0]
    # A aeolian / plainsong world, older and more hollow than Inner Sun (F lydian)
    a1, e2, a2, c3, e3, f3, g3, a3, b3, c4, e4, a4 = (
        A.midi(33), A.midi(40), A.midi(45), A.midi(48), A.midi(52),
        A.midi(53), A.midi(55), A.midi(57), A.midi(59), A.midi(60),
        A.midi(64), A.midi(69)
    )
    sL, sR = A.sub_drone(n, a1, gain=0.2, lfo=0.014)
    air_L, air_R = A.air_noise(n, rng, lo=140, hi=1200, gain=0.014)
    far[:n] += np.stack([sL + air_L, sR + air_R], 1)

    rooms = [
        (16, 30, [a2, e3], [360, 640, 1100], 0.07, 1100, 68),            # nave
        (48, 32, [a2, c3, e3, a3], [400, 720, 1300], 0.1, 1500, 76),    # inscription
        (86, 28, [e2, a2, e3], [300, 540, 900], 0.05, 800, 58),          # hollow aisle
        (120, 30, [c3, e3, g3, c4], [480, 880, 1700], 0.11, 1800, 84),   # votive
        (158, 28, [a2, e3, a3], [380, 680, 1200], 0.08, 1300, 72),
        (192, 28, [a2, e3], [320, 560, 960], 0.055, 900, 64),            # dust
    ]
    for t0, length, freqs, form, gain, lp, f0 in rooms:
        _choir_at(mid, t0, length, freqs, form, gain, lp, rng, f0=f0)

    # Sparse bells — a votive, not a shimmer
    ev = [
        (54, a3, 7.0, 0.22), (68, e4, 6.0, 0.2),
        (100, a2, 8.0, 0.14),
        (126, e4, 5.0, 0.28), (138, a4, 6.0, 0.24), (148, c4, 7.0, 0.2),
        (170, a3, 7.0, 0.18), (200, e3, 9.0, 0.14), (212, a2, 8.0, 0.12),
    ]
    _bells(close, ev, rng, vel_scale=0.42)

    _shape(far,   [0, 16, 48, 86, 120, 158, 192, 220], [0.55, 0.8, 1.0, 0.45, 1.1, 0.8, 0.55, 0.4])
    _shape(mid,   [0, 16, 48, 86, 120, 158, 192, 220], [0.25, 0.7, 1.05, 0.3, 1.15, 0.75, 0.45, 0.3])
    _shape(close, [0, 16, 48, 86, 120, 158, 192, 220], [0.15, 0.4, 0.7, 0.2, 1.0, 0.55, 0.35, 0.22])

    mid[:, :] = C.lp_tv(mid, C.sweep_cutoff(len(mid), 800, 1800, curve=0.65, hold_end=0.32), Q=0.85)
    close = C.polish_stem(close, hp=70, air_db=1.6)
    mid = C.polish_stem(mid, hp=22)
    far = C.polish_stem(far, hp=16)
    mixed = C.depth_mix(close, mid, far, None, 0.95, 1.05, 1.1)
    mixed = A.apply_reverb(mixed, np.random.default_rng(46), ir_s=8.0, wet=0.68, dry=0.7, pre=0.1, dark=1500)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=4.6, target_lufs=-16.0, split=90)
    sections = [
        ("nave", 0.0, 44.0),
        ("inscription", 44.0, 84.0),
        ("hollow_aisle", 84.0, 118.0),
        ("votive", 118.0, 156.0),
        ("recessional", 156.0, 192.0),
        ("dust", 192.0, dur),
    ]
    return out, sections, dict(title="Stone Memory", context="agartha", bpm=0, target_lufs=-16.0)


# ---------------------------------------------------------------------------
# 7. Boss of the Glen — Ember Wyrm / boss. E phrygian, motif in the bass.
# ---------------------------------------------------------------------------
def render_boss_of_the_glen():
    bpm, bars = 94.0, 76  # 193.6 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9407)
    mode, root, root_lo = "phrygian", 64, 52  # E phrygian
    lift_mode, lift_root = "phrygian", 69     # A phrygian second coil
    n = close.shape[0]
    beat = spb(bpm)

    sL, sR = A.sub_drone(n, A.midi(40), gain=0.14, lfo=0.028)  # E1
    rL, rR = A.rumble(n, rng, gain=0.06)
    far[:n] += np.stack([sL + rL, sR + rR], 1)

    # Glen theme degrees forced into the bass in phrygian — a heavy, original reading
    # (interval colours change; this is not a copy of the whistle theme).
    BASS_MOTIF = [1, 1, 2, 1, 5, 4, 2, 1]  # b2 is the phrygian bite
    BASS_DUR = [1, 1, 1, 1, 2, 1, 1, 0]    # last is a spacer; handled in the walker

    def bass_walk(bar0, bar1, root_, mode_, vel, pattern):
        t, end, i = tbar(bar0, bpm), tbar(bar1, bpm), 0
        while t < end - 0.02:
            deg = pattern[i % len(pattern)]
            sig = C.funk_bass(hz(root_ - 12, deg, mode_), beat * 1.2,
                              vel=vel * (1.05 if i % 8 == 0 else 0.9),
                              dead=(i % 8 == 3))
            E.add_mono(mid, t, sig, gain=1.0)
            if i % 2 == 0:
                L, R = C.string_ensemble(int(beat * 2.1 * SR),
                                         [hz(root_ - 12, deg, mode_)],
                                         gain=0.045, attack=0.02, release=0.18, bright=0.18)
                E.add_stereo(mid, t, L, R)
            t += beat * 0.5
            i += 1

    bass_walk(8, 16, root_lo, mode, 0.48, [1, 1, 2, 1])
    bass_walk(16, 28, root_lo, mode, 0.58, BASS_MOTIF)
    bass_walk(28, 32, root_lo, mode, 0.6, [1, 5, 4, 2, 1, 1, 2, 1])
    bass_walk(32, 40, root_lo, mode, 0.58, [1, 2, 5, 2, 4, 1, 7, 1])
    bass_walk(40, 48, root_lo, mode, 0.32, [1, 1, 1, 1, 1, 1, 2, 1])  # bare
    bass_walk(48, 64, lift_root, lift_mode, 0.64, BASS_MOTIF)
    bass_walk(64, 76, root_lo, mode, 0.5, [1, 1, 5, 1, 2, 1, 1, 1])

    _strings_at(mid, tbar(0, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.055, 0.8, 1.0, 0.16)
    _strings_at(mid, tbar(8, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 2, 5], mode), 0.08, 0.4, 0.7, 0.28)
    _strings_at(mid, tbar(16, bpm), tbar(12, bpm), chord_hz(root_lo, [1, 2, 5, 8], mode), 0.13, 0.25, 0.5, 0.4)
    _strings_at(mid, tbar(28, bpm), tbar(4, bpm), chord_hz(root_lo, [1, 4, 5, 8], mode), 0.14, 0.2, 0.5, 0.44)
    _strings_at(mid, tbar(32, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 2, 7], mode), 0.11, 0.15, 0.4, 0.55)
    _strings_at(mid, tbar(40, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.05, 0.9, 1.2, 0.12)
    _strings_at(mid, tbar(48, bpm), tbar(16, bpm), chord_hz(lift_root - 12, [1, 2, 5, 8], lift_mode), 0.15, 0.2, 0.5, 0.5)
    _strings_at(mid, tbar(64, bpm), tbar(12, bpm), chord_hz(root_lo, [1, 2, 5, 8], mode), 0.11, 0.3, 0.7, 0.36)

    # Horn and low whistle state a phrygian reading of the Glen contour
    A.add_phrase(close, tbar(10, bpm), [5, 6, 8, 9, 8, 6, 5], [1, 1, 2, 2, 2, 2, 6],
                 root_lo, mode, A.tin_whistle, bpm, vel=0.42, low=True, pan=-0.16)
    hL, hR = C.horn_swell(hz(root_lo, 1, mode), 2.6, vel=0.44, bright=0.48)
    E.add_stereo(close, tbar(16, bpm), hL, hR)
    A.add_phrase(close, tbar(20, bpm), [8, 9, 11, 8, 6, 5], [1, 1, 2, 2, 2, 8],
                 root, mode, A.fiddle_note, bpm, vel=0.5, pan=0.22)
    hL, hR = C.horn_swell(hz(root_lo, 5, mode), 2.4, vel=0.46, bright=0.5)
    E.add_stereo(close, tbar(27.4, bpm), hL, hR)
    A.add_phrase(close, tbar(32, bpm), [1, 2, 5, 4, 2, 1], [1, 1, 2, 2, 2, 8],
                 root, mode, A.fiddle_note, bpm, vel=0.48, pan=0.18)
    hL, hR = C.horn_swell(hz(root_lo, 7, mode), 2.8, vel=0.40, bright=0.62)
    E.add_stereo(close, tbar(36, bpm), hL, hR)
    A.add_phrase(close, tbar(50, bpm), [1, 2, 5, 8, 9, 8], [1, 1, 1, 2, 2, 9],
                 lift_root, lift_mode, A.tin_whistle, bpm, vel=0.58, pan=-0.1)
    hL, hR = C.horn_swell(hz(lift_root, 1, lift_mode), 3.2, vel=0.5, bright=0.55)
    E.add_stereo(close, tbar(56, bpm), hL, hR)
    A.add_phrase(close, tbar(64, bpm), [8, 6, 5, 2, 1], [2, 2, 2, 2, 8],
                 root, mode, A.tin_whistle, bpm, vel=0.5, pan=-0.12)
    hL, hR = C.horn_swell(hz(root_lo, 1, mode), 3.6, vel=0.36, bright=0.35)
    E.add_stereo(mid, tbar(70, bpm), hL, hR)

    hits = []
    def hit(bar, kind, vel, pan=0.0, hard=False):
        hits.append(_hit(perc, rng, bpm, bar, kind, vel, pan, hard))

    for b in (0.0, 2.0, 4.0, 6.0, 7.5):
        hit(b, "taiko", 0.38 if b < 6 else 0.52)
    for b in range(8, 16):
        hit(float(b), "taiko", 0.5 if b % 2 == 0 else 0.34)
        hit(b + 0.5, "hat", 0.14, 0.2)
        if b % 4 == 3:
            hit(b + 0.75, "ghost", 0.16, -0.2)
    for b, k, v, p, h in [
        (16.00, "kick", 0.66, 0.0, True), (16.00, "taiko", 0.52, 0.0, False),
        (16.50, "hat", 0.18, 0.2, False), (17.00, "snare", 0.42, 0.08, False),
        (18.00, "taiko", 0.5, 0.0, False), (18.75, "snare", 0.3, 0.1, False),
        (19.00, "kick", 0.5, 0.0, False), (20.00, "kick", 0.68, 0.0, True),
        (21.00, "snare", 0.46, 0.08, True), (22.00, "taiko", 0.5, 0.0, False),
        (23.00, "snare", 0.36, 0.1, False), (24.00, "kick", 0.64, 0.0, True),
        (25.00, "snare", 0.44, 0.08, False), (26.00, "taiko", 0.46, 0.0, False),
        (27.00, "hat", 0.16, -0.18, False),
        (28.00, "kick", 0.7, 0.0, True), (28.00, "taiko", 0.55, 0.0, False),
        (29.00, "snare", 0.5, 0.08, True), (30.00, "taiko", 0.48, 0.0, False),
        (30.75, "ghost", 0.16, 0.2, False), (31.00, "kick", 0.56, 0.0, False),
        (32.00, "kick", 0.70, 0.0, True), (32.00, "taiko", 0.48, 0.0, False),
        (32.50, "hat", 0.18, 0.2, False), (32.75, "ghost", 0.16, -0.18, False),
        (33.00, "snare", 0.52, 0.08, True), (33.50, "hat", 0.16, -0.16, False),
        (34.00, "kick", 0.50, 0.0, False), (34.50, "taiko", 0.36, 0.0, False),
        (35.00, "snare", 0.44, 0.1, False), (35.75, "snare", 0.28, 0.12, False),
        (36.00, "kick", 0.72, 0.0, True), (36.50, "hat", 0.2, 0.2, False),
        (37.00, "snare", 0.46, 0.08, False), (37.50, "hat", 0.18, -0.2, False),
        (38.00, "taiko", 0.5, 0.0, False), (38.75, "ghost", 0.18, 0.16, False),
        (39.00, "kick", 0.56, 0.0, False), (39.50, "snare", 0.34, 0.1, False),
        # bare
        (40.00, "taiko", 0.3, 0.0, False), (42.00, "hat", 0.1, 0.15, False),
        (44.00, "taiko", 0.28, 0.0, False), (46.00, "ghost", 0.12, -0.2, False),
    ]:
        hit(b, k, v, p, h)

    for base in range(48, 64, 4):
        shift = (base - 48) // 4
        pattern = [
            (0.00, "kick", 0.74, True), (0.00, "taiko", 0.58, False),
            (0.50, "hat", 0.2, False), (1.00, "snare", 0.54, True),
            (1.50, "ghost", 0.16, False), (2.00, "taiko", 0.5, False),
            (2.50, "hat", 0.18, False), (2.75, "snare", 0.3 + 0.04 * shift, False),
            (3.00, "kick", 0.6, False), (3.50, "ghost", 0.14, False),
        ]
        if shift == 1:
            pattern.append((3.25, "taiko", 0.4, False))
        if shift == 3:
            pattern.append((1.75, "hat", 0.16, False))
        for off, k, v, h in pattern:
            pan = 0.0 if k in ("kick", "taiko") else (0.15 if k == "snare" else -0.18 if k == "ghost" else 0.2)
            hit(base + off, k, v, pan, h)

    for b, k, v, p, h in [
        (64.00, "kick", 0.66, 0.0, True), (64.00, "taiko", 0.52, 0.0, False),
        (65.00, "snare", 0.42, 0.08, False), (66.00, "taiko", 0.44, 0.0, False),
        (68.00, "kick", 0.58, 0.0, False), (70.00, "taiko", 0.36, 0.0, False),
        (72.00, "taiko", 0.28, 0.0, False), (74.00, "taiko", 0.22, 0.0, False),
    ]:
        hit(b, k, v, p, h)

    rL, rR = C.riser(rng, tbar(2.8, bpm), start_hz=140, end_hz=7200, vel=0.44)
    E.add_stereo(far, tbar(13.2, bpm), rL, rR)
    iL, iR = C.impact(rng, dur=2.2, vel=0.68)
    E.add_stereo(perc, tbar(16, bpm), iL, iR)
    rL, rR = C.riser(rng, tbar(3.2, bpm), start_hz=160, end_hz=9000, vel=0.52)
    E.add_stereo(far, tbar(44.8, bpm), rL, rR)
    iL, iR = C.impact(rng, dur=2.4, vel=0.76)
    E.add_stereo(perc, tbar(48, bpm), iL, iR)
    dwn = C.downlifter(rng, dur=1.6, vel=0.3)
    E.add_mono(far, tbar(64, bpm), dwn, gain=1.0)

    mid[:, :] = C.apply_sidechain(mid, [h for h in hits if tbar(16, bpm) <= h < tbar(40, bpm) or tbar(48, bpm) <= h < tbar(64, bpm)],
                                  depth=0.44, rel=0.15)
    far[:, :] = C.apply_sidechain(far, [h for h in hits if tbar(48, bpm) <= h < tbar(64, bpm)], depth=0.26, rel=0.2)

    close = C.polish_stem(close, hp=48, air_db=1.0)
    mid = C.polish_stem(mid, hp=26, mud_cut_db=-1.6)
    far = C.polish_stem(far, hp=20)
    perc = C.polish_stem(perc, hp=22)
    mixed = C.depth_mix(close, mid, far, perc, 0.95, 0.98, 0.82, 1.08)
    mixed = A.apply_reverb(mixed, np.random.default_rng(47), ir_s=2.2, wet=0.22, dry=1.0, pre=0.02, dark=2200)
    sections = [
        ("approach", 0.0, tbar(8, bpm)),
        ("eye_open", tbar(8, bpm), tbar(16, bpm)),
        ("first_coil", tbar(16, bpm), tbar(28, bpm)),
        ("bind", tbar(28, bpm), tbar(40, bpm)),
        ("bare", tbar(40, bpm), tbar(48, bpm)),
        ("second_coil", tbar(48, bpm), tbar(64, bpm)),
        ("last_stand", tbar(64, bpm), dur),
    ]
    out, loud_map = M.festive_master(mixed[: int(dur * SR)], sections, xfade_s=1.8)
    return out, sections, dict(title="Boss of the Glen", context="boss", bpm=bpm, target_lufs=-9.0, section_lufs=loud_map)


# ---------------------------------------------------------------------------
# 8. Crystal Hunt — cave combat. C# dorian, liminal colours under a pulse.
# ---------------------------------------------------------------------------
def render_crystal_hunt():
    bpm, bars = 106.0, 84  # 190.2 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9408)
    mode, root, root_lo = "dorian", 61, 49  # C#
    n = close.shape[0]
    beat = spb(bpm)

    sL, sR = A.sub_drone(n, A.midi(25), gain=0.12, lfo=0.02)
    air_L, air_R = A.air_noise(n, rng, lo=220, hi=2600, gain=0.012)
    far[:n] += np.stack([sL + air_L, sR + air_R], 1)

    # Choir rooms under the pulse — still liminal, not a dance pad
    _choir_at(mid, tbar(0, bpm), tbar(12, bpm), chord_hz(root_lo, [1, 5], mode),
              [420, 760, 1500], 0.05, 1400, rng, f0=80)
    _choir_at(mid, tbar(16, bpm), tbar(16, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode),
              [500, 900, 1900], 0.08, 2000, rng, f0=92)
    _choir_at(mid, tbar(36, bpm), tbar(12, bpm), chord_hz(root_lo, [1, 5, 8, 10], mode),
              [620, 1100, 2300], 0.11, 2600, rng, f0=104)  # prism
    _choir_at(mid, tbar(52, bpm), tbar(10, bpm), chord_hz(root_lo, [1, 5], mode),
              [360, 640, 1100], 0.04, 900, rng, f0=70)     # slip
    _choir_at(mid, tbar(64, bpm), tbar(12, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode),
              [540, 980, 2000], 0.09, 2200, rng, f0=96)
    _choir_at(mid, tbar(76, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode),
              [400, 720, 1300], 0.05, 1200, rng, f0=76)

    _strings_at(mid, tbar(8, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.05, 0.8, 1.0, 0.22)
    _strings_at(mid, tbar(24, bpm), tbar(12, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.07, 0.4, 0.7, 0.3)
    _strings_at(mid, tbar(64, bpm), tbar(12, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.06, 0.5, 0.8, 0.28)

    # Glass bells develop, go quiet in the slip, return
    ev = [
        (tbar(10, bpm), hz(root + 12, 8, mode), 4.5, 0.32), (tbar(18, bpm), hz(root + 12, 5, mode), 4.0, 0.3),
        (tbar(26, bpm), hz(root + 12, 10, mode), 4.0, 0.36), (tbar(32, bpm), hz(root + 12, 8, mode), 3.5, 0.34),
        (tbar(38, bpm), hz(root + 24, 5, mode), 3.5, 0.4), (tbar(42, bpm), hz(root + 12, 10, mode), 3.5, 0.38),
        (tbar(46, bpm), hz(root + 24, 8, mode), 4.0, 0.36), (tbar(50, bpm), hz(root + 12, 5, mode), 4.0, 0.3),
        (tbar(56, bpm), hz(root, 8, mode), 6.0, 0.16), (tbar(60, bpm), hz(root, 5, mode), 6.0, 0.14),
        (tbar(66, bpm), hz(root + 12, 8, mode), 4.0, 0.3), (tbar(72, bpm), hz(root + 12, 10, mode), 4.0, 0.28),
        (tbar(78, bpm), hz(root, 8, mode), 6.0, 0.2),
    ]
    _bells(close, ev, rng, vel_scale=0.55)

    # A hunt figure, angular, not the Glen theme
    HUNT = [1, 3, 5, 2, 5, 8, 5]
    HUNT_DUR = [1, 1, 1, 1, 2, 2, 8]
    A.add_phrase(close, tbar(12, bpm), HUNT, HUNT_DUR, root, mode, A.tin_whistle, bpm, vel=0.42, pan=-0.14)
    A.add_phrase(close, tbar(28, bpm), [5, 8, 10, 8, 6, 5], [1, 1, 2, 2, 2, 8], root + 12, mode,
                 A.tin_whistle, bpm, vel=0.5, pan=-0.1)
    A.add_phrase(close, tbar(40, bpm), list(reversed(HUNT)), [1, 1, 2, 1, 1, 2, 8], root, mode,
                 A.tin_whistle, bpm, vel=0.48, pan=-0.12)
    A.add_phrase(close, tbar(66, bpm), HUNT, HUNT_DUR, root, mode, A.tin_whistle, bpm, vel=0.46, pan=-0.12)

    # Written pulse — tense, not four-on-the-floor hardcore; changes every section
    hits = []
    def hit(bar, kind, vel, pan=0.0, hard=False):
        hits.append(_hit(perc, rng, bpm, bar, kind, vel, pan, hard))

    # first_glint: almost no pulse, two distant skins
    for b in (4.0, 10.0):
        hit(b, "taiko", 0.22)
    # pulse_in
    for b in range(16, 28):
        if b % 2 == 0:
            hit(float(b), "kick", 0.42)
        if b % 4 == 2:
            hit(float(b), "snare", 0.28, 0.1)
        hit(b + 0.5, "hat", 0.12, 0.18)
    # chase: denser, written
    for b in range(28, 36):
        hit(float(b), "kick", 0.58 if b % 2 == 0 else 0.4, hard=(b % 4 == 0))
        hit(b + 0.5, "hat", 0.16, 0.2 if b % 2 else -0.16)
        if b % 2 == 1:
            hit(float(b), "snare", 0.4, 0.08)
        if b % 4 == 3:
            hit(b + 0.75, "ghost", 0.14, -0.2)
    # prism: brighter hats, a different kick cell
    for b in range(36, 52):
        hit(float(b), "kick", 0.62, hard=(b % 4 == 0))
        if b % 4 == 2:
            hit(b + 0.75, "kick", 0.32)  # syncopated pickup
        if b % 2 == 1:
            hit(float(b), "snare", 0.46, 0.08, hard=True)
        hit(b + 0.5, "hat", 0.2, 0.2 if b % 2 else -0.18)
        if b % 2 == 0:
            hit(b + 0.25, "hat", 0.12, -0.12)
    # slip: pulse almost withdraws
    for b in (52.0, 56.0, 60.0):
        hit(b, "taiko", 0.24)
        hit(b + 0.5, "hat", 0.08, 0.15)
    # close_in
    for b in range(64, 76):
        hit(float(b), "kick", 0.6 if b % 2 == 0 else 0.44, hard=(b % 4 == 0))
        if b % 2 == 1:
            hit(float(b), "snare", 0.42, 0.08)
        hit(b + 0.5, "hat", 0.16, 0.18)
        if b % 4 == 3:
            hit(b + 0.75, "ghost", 0.14, -0.18)
    # after_image
    for b in (76.0, 80.0, 82.0):
        hit(b, "taiko", 0.22)

    rL, rR = C.riser(rng, tbar(2.2, bpm), start_hz=200, end_hz=8000, vel=0.36)
    E.add_stereo(far, tbar(25.8, bpm), rL, rR)
    iL, iR = C.impact(rng, dur=1.6, vel=0.48)
    E.add_stereo(perc, tbar(28, bpm), iL, iR)
    rL, rR = C.riser(rng, tbar(2.0, bpm), start_hz=220, end_hz=8500, vel=0.34)
    E.add_stereo(far, tbar(34.0, bpm), rL, rR)
    dwn = C.downlifter(rng, dur=1.4, vel=0.24)
    E.add_mono(far, tbar(52, bpm), dwn, gain=1.0)

    mid[:, :] = C.apply_sidechain(mid, [h for h in hits if tbar(28, bpm) <= h < tbar(52, bpm) or tbar(64, bpm) <= h < tbar(76, bpm)],
                                  depth=0.38, rel=0.16)
    _shape(far,   [0, tbar(16, bpm), tbar(28, bpm), tbar(36, bpm), tbar(52, bpm), tbar(64, bpm), tbar(76, bpm), dur],
                  [0.6, 0.85, 1.0, 1.15, 0.4, 1.0, 0.6, 0.45])
    _shape(mid,   [0, tbar(16, bpm), tbar(28, bpm), tbar(36, bpm), tbar(52, bpm), tbar(64, bpm), tbar(76, bpm), dur],
                  [0.4, 0.8, 1.05, 1.2, 0.3, 1.05, 0.55, 0.35])
    _shape(perc,  [0, tbar(16, bpm), tbar(28, bpm), tbar(36, bpm), tbar(52, bpm), tbar(64, bpm), tbar(76, bpm), dur],
                  [0.3, 0.7, 1.05, 1.15, 0.25, 1.05, 0.4, 0.3])

    close = C.polish_stem(close, hp=70, air_db=2.0)
    mid = C.polish_stem(mid, hp=28, mud_cut_db=-1.2)
    far = C.polish_stem(far, hp=22)
    perc = C.polish_stem(perc, hp=24)
    mixed = C.depth_mix(close, mid, far, perc, 1.0, 1.0, 0.95, 0.95)
    mixed = A.apply_reverb(mixed, np.random.default_rng(48), ir_s=3.6, wet=0.36, dry=0.92, pre=0.04, dark=2000)
    sections = [
        ("first_glint", 0.0, tbar(16, bpm)),
        ("pulse_in", tbar(16, bpm), tbar(28, bpm)),
        ("chase", tbar(28, bpm), tbar(36, bpm)),
        ("prism", tbar(36, bpm), tbar(52, bpm)),
        ("slip", tbar(52, bpm), tbar(64, bpm)),
        ("close_in", tbar(64, bpm), tbar(76, bpm)),
        ("after_image", tbar(76, bpm), dur),
    ]
    out, loud_map = M.festive_master(mixed[: int(dur * SR)], sections, xfade_s=2.2)
    return out, sections, dict(title="Crystal Hunt", context="crystal", bpm=bpm, target_lufs=-9.0, section_lufs=loud_map)


TRACKS = {
    "moor_light": render_moor_light,
    "midday_glen": render_midday_glen,
    "bothy_smoke": render_bothy_smoke,
    "northern_quiet": render_northern_quiet,
    "ridge_wind": render_ridge_wind,
    "stone_memory": render_stone_memory,
    "boss_of_the_glen": render_boss_of_the_glen,
    "crystal_hunt": render_crystal_hunt,
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--track", default="all")
    args = ap.parse_args()
    names = list(TRACKS) if args.track == "all" else [args.track]
    WAV.mkdir(parents=True, exist_ok=True)
    AN.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for name in names:
        print("rendering", name, flush=True)
        audio, sections, meta = TRACKS[name]()
        st = A.stats(audio)
        meta = dict(meta)
        meta.update(st)
        meta["sections"] = [(n, float(a), float(b)) for n, a, b in sections]
        write_wav(WAV / f"{name}.wav", audio)
        (AN / f"{name}.json").write_text(json.dumps(meta, indent=2))
        manifest[name] = meta
        print("  dur={dur:.1f}s  LUFS={lufs:.2f}  TP={tp_db:.2f} dB  join={join:.5f}".format(**st), flush=True)
    (AN / "batch4-render.json").write_text(json.dumps(manifest, indent=2))
    print("done", names)


if __name__ == "__main__":
    main()
