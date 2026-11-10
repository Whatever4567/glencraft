#!/usr/bin/env python3
"""Render batch 3 of the Glencraft Original Soundtrack.

Eight through-composed pieces: hell/void, creative, a warmer Agartha cue,
pine-day and owl-night companions, combat, an original dance-pop cue for
when the pop star is near, and a credits reprise. Same art bar as earlier
batches: motif development, contrasting sections, no tiled 4-8 bar loops.
Techniques from award-level dance and film-hybrid production applied only
to original writing. Recorded instruments are only from the CC0 / MIT
libraries in LICENSES.md, layered with the original synths. Below the Map
and Inner Sun are beatless. No piano-led writing. No copyrighted melodies
or lyrics. Starlight Show is an original dance-pop track and is not the
pop star's diegetic song.
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
MUSIC = Path("/workspace/gc-album/music/album")


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


# ---------------------------------------------------------------------------
# 1. Below the Map — hell / void / deep dark. Lowest, least human, beatless.
# ---------------------------------------------------------------------------
def render_below_the_map():
    dur = 210.0
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9301)
    n = close.shape[0]
    # C# phrygian world, well below the purple chamber. Almost no melody.
    cs1, gs1, cs2, d2, e2, gs2, b2, cs3, e3, gs3, b3, cs4 = (
        A.midi(25), A.midi(32), A.midi(37), A.midi(38), A.midi(40),
        A.midi(44), A.midi(47), A.midi(49), A.midi(52), A.midi(56),
        A.midi(59), A.midi(61)
    )
    sL, sR = A.sub_drone(n, cs1, gain=0.26, lfo=0.012)
    rL, rR = A.rumble(n, rng, gain=0.11)
    air_L, air_R = A.air_noise(n, rng, lo=80, hi=700, gain=0.016)
    far[:n] += np.stack([sL + rL + air_L, sR + rR + air_R], 1)

    # Iron-air resonances: inharmonic, not a scale run
    for t0, freq, length, vel in (
        (38, gs2 * 1.03, 9.0, 0.12), (52, cs3 * 0.97, 8.0, 0.10),
        (78, e3 * 1.04, 11.0, 0.13), (96, gs3 * 0.96, 7.5, 0.09),
        (118, cs3, 10.0, 0.11), (168, gs2, 12.0, 0.08), (190, cs2, 14.0, 0.07),
    ):
        nn = int(length * SR)
        sig = E.fm_glass_bell(freq, length, rng, ratio=2.17, index0=2.4) * vel
        sig = E.sos_lp(sig, 1200)
        E.add_mono(close, t0, C.fade_edges(sig, 1.2, 2.0), gain=1.0, pan=rng.uniform(-0.4, 0.4))

    # Choir is barely a voice — two-note cells, then a brief pale interval, then nothing
    rooms = [
        (40, 26, [cs2, gs2], [280, 480, 820], 0.045, 700, 52),
        (76, 30, [cs2, e2, gs2], [300, 520, 900], 0.07, 900, 58),
        (114, 28, [gs2, cs3, e3], [340, 620, 1100], 0.09, 1300, 64),  # hollow vein
        (154, 20, [cs2, gs2], [240, 400, 700], 0.03, 600, 48),         # absence
        (182, 28, [cs2, gs2, cs3], [260, 450, 800], 0.05, 800, 54),
    ]
    for t0, length, freqs, form, gain, lp, f0 in rooms:
        _choir_at(mid, t0, length, freqs, form, gain, lp, rng, f0=f0)

    # Distant, irregular booms — not a pulse
    for t0, vel in ((46, 0.28), (71, 0.22), (103, 0.34), (129, 0.18), (161, 0.16), (197, 0.2)):
        boom = A.distant_boom(rng, dur=2.6, vel=vel)
        E.add_mono(far, t0, boom, gain=1.0, pan=rng.uniform(-0.25, 0.25))

    _shape(far,   [0, 36, 76, 114, 148, 178, 210], [0.55, 0.8, 1.0, 1.15, 0.45, 0.75, 0.55])
    _shape(mid,   [0, 36, 76, 114, 148, 178, 210], [0.15, 0.45, 0.8, 1.2, 0.25, 0.7, 0.4])
    _shape(close, [0, 36, 76, 114, 148, 178, 210], [0.1, 0.35, 0.7, 1.0, 0.2, 0.55, 0.3])

    mid[:, :] = C.lp_tv(mid, C.sweep_cutoff(len(mid), 500, 1400, curve=0.7, hold_end=0.35), Q=0.85)
    close = C.polish_stem(close, hp=40)
    mid = C.polish_stem(mid, hp=18)
    far = C.polish_stem(far, hp=14)
    mixed = C.depth_mix(close, mid, far, None, 0.9, 1.0, 1.15)
    mixed = A.apply_reverb(mixed, np.random.default_rng(31), ir_s=8.5, wet=0.72, dry=0.62, pre=0.12, dark=1200)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=4.8, target_lufs=-16.0, split=80)
    sections = [
        ("descent", 0.0, 36.0),
        ("iron_air", 36.0, 72.0),
        ("no_horizon", 72.0, 110.0),
        ("hollow_vein", 110.0, 148.0),
        ("absence", 148.0, 178.0),
        ("residual", 178.0, dur),
    ]
    return out, sections, dict(title="Below the Map", context="hell", bpm=0, target_lufs=-16.0)


# ---------------------------------------------------------------------------
# 2. Open Sketch — creative mode. Lighter, more open day variant. C mixolydian.
# ---------------------------------------------------------------------------
def render_open_sketch():
    bpm, bars = 80.0, 64  # 192.0 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9302)
    mode, root, root_lo = "mixolydian", 60, 48  # C
    alt_mode, alt_root = "lydian", 67  # G lydian colour-wash
    n = close.shape[0]

    air_L, air_R = A.air_noise(n, rng, lo=300, hi=2800, gain=0.016)
    far[:n] += np.stack([air_L, air_R], 1)

    # Sketch motif (original — not the Glen theme): a rising-then-held figure
    SK = [1, 3, 5, 6, 8, 6, 5, 3]
    SK_DUR = [1, 1, 1, 1, 2, 2, 2, 6]
    SK2 = [8, 6, 5, 8, 10, 9, 8, 5]
    SK2_DUR = [1, 1, 2, 2, 2, 2, 2, 4]

    _pad_at(far, 0, tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.04, 1400, 0.05)
    _strings_at(mid, tbar(8, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.05, 1.1, 1.2, 0.22)
    _strings_at(mid, tbar(16, bpm), tbar(12, bpm), chord_hz(alt_root, [1, 3, 5, 8], alt_mode, octave=-1), 0.09, 0.8, 1.0, 0.38)
    _strings_at(mid, tbar(28, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.03, 1.4, 1.6, 0.15)  # erase
    _strings_at(mid, tbar(36, bpm), tbar(12, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.11, 0.6, 0.9, 0.45)
    _strings_at(mid, tbar(48, bpm), tbar(16, bpm), chord_hz(root_lo, [1, 5, 8, 9], mode), 0.08, 0.9, 1.3, 0.3)

    # Harp: blank-page single tones, then grouping changes
    def harp_fig(bar0, bar1, root_, mode_, vel, pattern, step=0.5):
        chord = chord_hz(root_, [1, 3, 5, 8], mode_)
        t, end, i = tbar(bar0, bpm), tbar(bar1, bpm), 0
        beat = spb(bpm)
        while t < end - 0.03:
            L, R = A.harp_pluck(chord[pattern[i % len(pattern)] % len(chord)], beat * 1.7,
                                vel=vel * (0.85 + 0.15 * (i % 5 == 0)), bright=0.42 + 0.08 * (i % 3 == 0))
            E.add_stereo(close, t, L, R)
            t += beat * step
            i += 1

    harp_fig(0, 8, root, mode, 0.22, [0, 0, 2], 1.0)          # sparse
    harp_fig(8, 16, root, mode, 0.3, [0, 2, 1, 2], 0.5)
    harp_fig(16, 28, alt_root, alt_mode, 0.34, [0, 2, 3, 1, 3, 2], 0.5)
    harp_fig(28, 36, root, mode, 0.16, [0, 2], 1.0)            # erase
    harp_fig(36, 48, root, mode, 0.36, [0, 3, 1, 2, 3, 1], 0.5)
    harp_fig(48, 64, root, mode, 0.26, [0, 2, 1, 3, 2], 0.5)

    A.add_phrase(close, tbar(8, bpm), SK, SK_DUR, root, mode, A.tin_whistle, bpm, vel=0.62, pan=-0.15)
    A.add_phrase(close, tbar(16, bpm), SK2, SK2_DUR, root + 12, mode, A.fiddle_note, bpm, vel=0.5, pan=0.28)
    A.add_phrase(close, tbar(22, bpm), [5, 6, 8, 10, 8], [2, 2, 2, 4, 6], alt_root, alt_mode, A.tin_whistle, bpm, vel=0.55, pan=-0.12)
    A.add_phrase(close, tbar(30, bpm), [8, 5, 3], [3, 3, 6], root, mode, A.tin_whistle, bpm, vel=0.32, low=True, pan=-0.2)
    A.add_phrase(close, tbar(36, bpm), SK, [1, 1, 1, 1, 2, 1, 2, 7], root + 12, mode, A.tin_whistle, bpm, vel=0.7, pan=-0.1)
    A.add_phrase(close, tbar(40, bpm), list(reversed(SK2)), list(reversed(SK2_DUR)), root, mode, A.fiddle_note, bpm, vel=0.52, pan=0.26)
    A.add_phrase(close, tbar(48, bpm), SK, SK_DUR, root, mode, A.tin_whistle, bpm, vel=0.58, pan=-0.12)
    A.add_phrase(close, tbar(56, bpm), [8, 6, 5, 3, 1], [2, 2, 3, 3, 8], root, mode, A.tin_whistle, bpm, vel=0.4, pan=-0.1)

    # Light folk-electronic colour only on the second pass
    for b0, degs in ((36, [1, 5, 8, 5]), (38, [3, 6, 8, 6]), (40, [1, 5, 9, 8]),
                     (42, [3, 5, 8, 10, 8, 5]), (44, [1, 4, 8, 9, 8, 4])):
        for i, d in enumerate(degs):
            L, R = C.avicii_pluck(hz(root_lo, d, mode), spb(bpm) * 1.2, vel=0.34, bright=0.6)
            E.add_stereo(mid, tbar(b0, bpm) + i * 0.5 * spb(bpm), L, R, gain=0.65)

    bass_line = [
        (36.00, 1, 4.0, False, None), (37.00, 5, 4.0, False, None),
        (38.00, 6, 4.0, False, None), (39.00, 5, 2.0, True, None), (39.50, 1, 2.0, False, 5),
        (40.00, 1, 2.0, False, None), (40.50, 3, 2.0, False, None), (41.00, 5, 4.0, False, None),
        (42.00, 4, 4.0, False, None), (43.00, 1, 4.0, False, None),
        (48.00, 1, 8.0, False, None), (52.00, 5, 4.0, False, None), (53.00, 1, 4.0, False, None),
    ]
    for b0, deg, beats, dead, sdeg in bass_line:
        sig = C.funk_bass(hz(36, deg, mode), beats * spb(bpm), vel=0.42 if not dead else 0.22,
                          dead=dead, slide_from=hz(36, sdeg, mode) if sdeg else None)
        E.add_mono(mid, tbar(b0, bpm), sig, gain=1.0, pan=0.0)

    # Soft ceremonial hits — not a dance grid
    def hit(bar, kind, vel, pan=0.0):
        t = C.humanize(tbar(bar, bpm), rng, 0.005)
        if kind == "bodhran":
            E.add_mono(perc, t, A.bodhran(rng, dur=0.3, tight=vel < 0.4, vel=vel), gain=1.0, pan=pan)
        elif kind == "hat":
            E.add_mono(perc, t, C.hat(rng, vel=vel, open_hat=False), gain=1.0, pan=pan)
        elif kind == "ghost":
            E.add_mono(perc, t, C.ghost_stick(rng, vel=vel), gain=1.0, pan=pan)

    for b in range(8, 16):
        hit(float(b), "bodhran", 0.22 if b % 2 else 0.28)
        if b % 4 == 3:
            hit(b + 0.5, "ghost", 0.1, -0.2)
    for b in range(16, 28):
        hit(float(b), "bodhran", 0.3 if b % 2 == 0 else 0.22)
        hit(b + 0.5, "hat", 0.12, 0.2 if b % 2 else -0.18)
    # erase: almost none
    hit(31.0, "bodhran", 0.14)
    for b, k, v, p in [
        (36.00, "bodhran", 0.36, 0.0), (36.50, "hat", 0.14, 0.2), (37.00, "bodhran", 0.26, 0.0),
        (37.75, "ghost", 0.14, -0.2), (38.00, "bodhran", 0.34, 0.0), (39.00, "bodhran", 0.24, 0.0),
        (40.00, "bodhran", 0.38, 0.0), (40.50, "hat", 0.16, -0.15), (41.00, "bodhran", 0.28, 0.0),
        (42.00, "bodhran", 0.34, 0.0), (43.50, "ghost", 0.14, 0.18),
        (48.00, "bodhran", 0.3, 0.0), (50.00, "bodhran", 0.24, 0.0), (52.00, "bodhran", 0.22, 0.0),
        (56.00, "bodhran", 0.18, 0.0), (60.00, "bodhran", 0.14, 0.0),
    ]:
        hit(b, k, v, p)

    hL, hR = C.horn_swell(hz(root_lo, 5, mode), 3.2, vel=0.24, bright=0.35)
    E.add_stereo(mid, tbar(35.2, bpm), hL, hR)

    close = C.polish_stem(close, hp=60, air_db=1.8)
    mid = C.polish_stem(mid, hp=32, mud_cut_db=-1.2)
    far = C.polish_stem(far, hp=28)
    perc = C.polish_stem(perc, hp=26)
    mixed = C.depth_mix(close, mid, far, perc, 1.05, 0.88, 0.75, 0.7)
    mixed = A.apply_reverb(mixed, np.random.default_rng(32), ir_s=2.4, wet=0.22, dry=1.0, pre=0.025, dark=3200)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=2.2, target_lufs=-14.0, split=125)
    sections = [
        ("blank_page", 0.0, tbar(8, bpm)),
        ("first_line", tbar(8, bpm), tbar(16, bpm)),
        ("colour_wash", tbar(16, bpm), tbar(28, bpm)),
        ("erase", tbar(28, bpm), tbar(36, bpm)),
        ("second_pass", tbar(36, bpm), tbar(48, bpm)),
        ("keep", tbar(48, bpm), dur),
    ]
    return out, sections, dict(title="Open Sketch", context="creative", bpm=bpm, target_lufs=-14.0)


# ---------------------------------------------------------------------------
# 3. Inner Sun — warmer Agartha companion. F lydian, beatless, golden.
# ---------------------------------------------------------------------------
def render_inner_sun():
    dur = 216.0
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9303)
    n = close.shape[0]
    # F lydian: F G A B C D E  — warmer, brighter than Choir of the Hollow
    f1, c2, f2, a2, c3, e3, f3, a3, b3, c4, e4, f4, a4, c5 = (
        A.midi(29), A.midi(36), A.midi(41), A.midi(45), A.midi(48), A.midi(52),
        A.midi(53), A.midi(57), A.midi(59), A.midi(60), A.midi(64),
        A.midi(65), A.midi(69), A.midi(72)
    )
    sL, sR = A.sub_drone(n, f1, gain=0.16, lfo=0.02)
    air_L, air_R = A.air_noise(n, rng, lo=220, hi=2400, gain=0.018)
    far[:n] += np.stack([sL + air_L, sR + air_R], 1)

    rooms = [
        (18, 28, [f2, c3], [520, 900, 1700], 0.07, 1600, 88),             # embers
        (40, 30, [f2, a2, c3, e3], [620, 1100, 2100], 0.12, 2200, 100), # gold rise
        (76, 30, [a2, c3, e3, a3], [700, 1300, 2500], 0.14, 2800, 110), # corona
        (114, 26, [f2, c3], [400, 700, 1200], 0.04, 900, 72),            # eclipse
        (148, 30, [c3, e3, a3, c4], [650, 1200, 2300], 0.11, 2400, 104), # after-glow (inverted voicing)
        (186, 30, [f2, a2, c3, f3], [560, 1000, 1900], 0.08, 1800, 92),
    ]
    for t0, length, freqs, form, gain, lp, f0 in rooms:
        _choir_at(mid, t0, length, freqs, form, gain, lp, rng, f0=f0)

    ev = [
        (44, f4, 5.0, 0.36), (54, a3, 4.5, 0.32), (64, c4, 5.0, 0.34),
        (80, e4, 4.0, 0.42), (88, a4, 3.8, 0.4), (96, c5, 4.5, 0.36), (104, f4, 5.0, 0.34),
        # eclipse: two distant, lower bells only
        (122, c3, 8.0, 0.18), (136, f3, 7.0, 0.16),
        # retrograde of the corona figure
        (152, f4, 4.5, 0.3), (162, c5, 4.0, 0.28), (170, a4, 4.0, 0.28), (178, e4, 5.0, 0.26),
        (192, a3, 6.0, 0.22), (204, f3, 8.0, 0.18),
    ]
    _bells(close, ev, rng, vel_scale=0.55)

    _shape(far,   [0, 36, 76, 108, 148, 186, 216], [0.6, 0.85, 1.15, 0.4, 0.95, 0.75, 0.55])
    _shape(mid,   [0, 36, 76, 108, 148, 186, 216], [0.3, 0.85, 1.2, 0.25, 0.95, 0.7, 0.45])
    _shape(close, [0, 36, 76, 108, 148, 186, 216], [0.2, 0.7, 1.15, 0.2, 0.85, 0.55, 0.35])

    mid[:, :] = C.lp_tv(mid, C.sweep_cutoff(len(mid), 1200, 2800, curve=0.6, hold_end=0.28), Q=0.8)
    close = C.polish_stem(close, hp=80, air_db=2.4)
    mid = C.polish_stem(mid, hp=28)
    far = C.polish_stem(far, hp=20)
    mixed = C.depth_mix(close, mid, far, None, 1.0, 1.05, 1.0)
    mixed = A.apply_reverb(mixed, np.random.default_rng(33), ir_s=7.2, wet=0.62, dry=0.78, pre=0.08, dark=2000)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=4.4, target_lufs=-16.0, split=100)
    sections = [
        ("embers", 0.0, 36.0),
        ("gold_rise", 36.0, 72.0),
        ("corona", 72.0, 108.0),
        ("eclipse", 108.0, 144.0),
        ("after_glow", 144.0, 186.0),
        ("held_light", 186.0, dur),
    ]
    return out, sections, dict(title="Inner Sun", context="agartha", bpm=0, target_lufs=-16.0)


# ---------------------------------------------------------------------------
# 4. Pine Shelter — overworld day, under the pines. E mixolydian ~72.
# ---------------------------------------------------------------------------
def render_pine_shelter():
    bpm, bars = 72.0, 56  # 186.67 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9304)
    mode, root, root_lo = "mixolydian", 64, 52  # E
    shade_mode, shade_root = "aeolian", 61      # C# aeolian windfall (not E aeolian)
    n = close.shape[0]

    air_L, air_R = A.air_noise(n, rng, lo=200, hi=2000, gain=0.02)
    dL, dR = A.bagpipe_drone(n, A.midi(root_lo), gain=0.04)
    far[:n] += np.stack([air_L + dL, air_R + dR], 1)

    # Pine motif: a descending canopy figure, distinct from the Glen theme
    PINE = [8, 9, 7, 6, 5, 3, 5]
    PINE_DUR = [2, 1, 1, 2, 2, 2, 6]
    PINE_B = [1, 3, 5, 7, 8, 6, 5]
    PINE_B_DUR = [1, 1, 2, 2, 2, 2, 6]

    _strings_at(mid, tbar(0, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.04, 1.4, 1.4, 0.18)
    _strings_at(mid, tbar(8, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.06, 1.0, 1.1, 0.25)
    _strings_at(mid, tbar(16, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.1, 0.7, 0.9, 0.36)
    _strings_at(mid, tbar(24, bpm), tbar(8, bpm), chord_hz(shade_root, [1, 5, 8], shade_mode, octave=-1), 0.05, 1.2, 1.4, 0.16)
    _strings_at(mid, tbar(32, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8, 10], mode), 0.12, 0.5, 0.8, 0.48)
    _strings_at(mid, tbar(40, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.05, 1.2, 1.4, 0.2)
    _strings_at(mid, tbar(48, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.07, 0.9, 1.3, 0.28)

    def harp_canopy(bar0, bar1, root_, mode_, vel, pattern, bright=0.45):
        A.harp_arpeggio(close, tbar(bar0, bpm), chord_hz(root_, [1, 3, 5, 8], mode_),
                        (bar1 - bar0) * 4, bpm, vel=vel, pattern=pattern, bright=bright)

    harp_canopy(0, 8, root, mode, 0.24, [0, 2, 1, 2], 0.4)
    harp_canopy(8, 16, root, mode, 0.3, [0, 2, 1, 3, 2, 1], 0.48)
    harp_canopy(16, 24, root, mode, 0.34, [0, 3, 1, 3, 2, 0], 0.52)
    harp_canopy(24, 32, shade_root, shade_mode, 0.18, [0, 2, 0, 1], 0.32)
    harp_canopy(32, 40, root, mode, 0.38, [0, 2, 3, 1, 3, 2], 0.56)
    harp_canopy(40, 48, root, mode, 0.22, [0, 2, 1], 0.38)
    harp_canopy(48, 56, root, mode, 0.28, [0, 2, 1, 2], 0.42)

    A.add_phrase(close, tbar(8, bpm), PINE, PINE_DUR, root, mode, A.tin_whistle, bpm, vel=0.66, pan=-0.14)
    A.add_phrase(close, tbar(16, bpm), PINE_B, PINE_B_DUR, root, mode, A.fiddle_note, bpm, vel=0.52, pan=0.26)
    A.add_phrase(close, tbar(20, bpm), list(reversed(PINE)), [2, 2, 2, 1, 1, 2, 6], root, mode, A.tin_whistle, bpm, vel=0.58, pan=-0.1)
    A.add_phrase(close, tbar(25, bpm), [5, 6, 5], [3, 3, 6], shade_root, shade_mode, A.tin_whistle, bpm, vel=0.36, low=True, pan=-0.2)
    A.add_phrase(close, tbar(28.5, bpm), [8, 6, 5], [3, 3, 6], shade_root, shade_mode, A.tin_whistle, bpm, vel=0.34, low=True, pan=0.12)
    A.add_phrase(close, tbar(32, bpm), PINE, PINE_DUR, root + 12, mode, A.tin_whistle, bpm, vel=0.72, pan=-0.1)
    A.add_phrase(close, tbar(36, bpm), PINE_B, PINE_B_DUR, root, mode, A.fiddle_note, bpm, vel=0.56, pan=0.28)
    A.add_phrase(close, tbar(41, bpm), [8, 7, 5, 3], [3, 3, 4, 6], root, mode, A.tin_whistle, bpm, vel=0.4, low=True, pan=-0.16)
    A.add_phrase(close, tbar(48, bpm), PINE, PINE_DUR, root, mode, A.tin_whistle, bpm, vel=0.6, pan=-0.12)
    A.add_phrase(close, tbar(52, bpm), [8, 5, 1], [2, 3, 9], root, mode, A.tin_whistle, bpm, vel=0.4, pan=-0.1)

    hL, hR = C.horn_swell(hz(root_lo, 5, mode), 3.6, vel=0.3, bright=0.38)
    E.add_stereo(mid, tbar(31.2, bpm), hL, hR)

    def hit(bar, kind, vel, pan=0.0):
        t = C.humanize(tbar(bar, bpm), rng, 0.006)
        if kind == "bodhran":
            E.add_mono(perc, t, A.bodhran(rng, dur=0.32, tight=vel < 0.4, vel=vel), gain=1.0, pan=pan)
        elif kind == "hat":
            E.add_mono(perc, t, C.hat(rng, vel=vel), gain=1.0, pan=pan)
        elif kind == "ghost":
            E.add_mono(perc, t, C.ghost_stick(rng, vel=vel), gain=1.0, pan=pan)

    for b in range(0, 8):
        if b % 2 == 0:
            hit(float(b), "bodhran", 0.18)
    for b in range(8, 16):
        hit(float(b), "bodhran", 0.3 if b % 2 == 0 else 0.22)
        if b % 4 == 3:
            hit(b + 0.5, "ghost", 0.12, -0.2)
    for b in range(16, 24):
        hit(float(b), "bodhran", 0.36 if b % 2 == 0 else 0.26)
        hit(b + 0.5, "hat", 0.12, 0.2 if b % 2 else -0.16)
    hit(26.0, "bodhran", 0.16)
    hit(29.0, "bodhran", 0.14)
    for b, k, v, p in [
        (32.00, "bodhran", 0.42, 0.0), (32.50, "hat", 0.16, 0.2), (33.00, "bodhran", 0.3, 0.0),
        (33.75, "ghost", 0.14, -0.2), (34.00, "bodhran", 0.4, 0.0), (35.00, "bodhran", 0.28, 0.0),
        (36.00, "bodhran", 0.38, 0.0), (37.50, "hat", 0.14, -0.15),
        (40.00, "bodhran", 0.24, 0.0), (44.00, "bodhran", 0.18, 0.0),
        (48.00, "bodhran", 0.3, 0.0), (50.00, "bodhran", 0.22, 0.0), (52.00, "bodhran", 0.18, 0.0),
        (54.00, "bodhran", 0.14, 0.0),
    ]:
        hit(b, k, v, p)

    close = C.polish_stem(close, hp=55, air_db=1.5)
    mid = C.polish_stem(mid, hp=30, mud_cut_db=-1.0)
    far = C.polish_stem(far, hp=26)
    perc = C.polish_stem(perc, hp=24)
    mixed = C.depth_mix(close, mid, far, perc, 1.0, 0.9, 0.8, 0.78)
    mixed = A.apply_reverb(mixed, np.random.default_rng(34), ir_s=2.8, wet=0.26, dry=1.0, pre=0.03, dark=2600)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=2.4, target_lufs=-14.5, split=125)
    sections = [
        ("canopy", 0.0, tbar(8, bpm)),
        ("needle_path", tbar(8, bpm), tbar(16, bpm)),
        ("resin", tbar(16, bpm), tbar(24, bpm)),
        ("windfall", tbar(24, bpm), tbar(32, bpm)),
        ("clearing", tbar(32, bpm), tbar(40, bpm)),
        ("under_bough", tbar(40, bpm), tbar(48, bpm)),
        ("treeline", tbar(48, bpm), dur),
    ]
    return out, sections, dict(title="Pine Shelter", context="day", bpm=bpm, target_lufs=-14.5)


# ---------------------------------------------------------------------------
# 5. Owl Hour — overworld night. B aeolian, very slow, sparse.
# ---------------------------------------------------------------------------
def render_owl_hour():
    bpm, bars = 48.0, 40  # 200.0 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9305)
    mode, root, root_lo = "aeolian", 59, 47  # B
    n = close.shape[0]

    sL, sR = A.sub_drone(n, A.midi(35), gain=0.1, lfo=0.018)  # B0
    air_L, air_R = A.air_noise(n, rng, lo=180, hi=1600, gain=0.014)
    far[:n] += np.stack([sL + air_L, sR + air_R], 1)

    # A two-note "call" interval (perfect fifth, then a minor sixth answer) — not an owl sample
    CALL = [5, 8, 5]
    CALL_DUR = [4, 6, 6]
    ANSWER = [8, 6, 5, 3]
    ANSWER_DUR = [4, 4, 4, 8]

    _pad_at(far, 0, tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.05, 900, 0.03)
    _strings_at(mid, tbar(8, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.045, 1.6, 1.8, 0.18)
    _strings_at(mid, tbar(16, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.08, 1.0, 1.3, 0.28)
    _choir_at(mid, tbar(18, bpm), tbar(6, bpm), chord_hz(root_lo, [1, 5, 8], mode),
              [480, 820, 1500], 0.06, 1400, rng, f0=78)
    _pad_at(far, tbar(24, bpm), tbar(8, bpm), chord_hz(root_lo, [1], mode), 0.03, 700, 0.02)  # still ground
    _strings_at(mid, tbar(32, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.06, 1.4, 1.6, 0.2)
    _choir_at(mid, tbar(33, bpm), tbar(6, bpm), chord_hz(root_lo, [5, 8], mode),
              [440, 760, 1300], 0.05, 1200, rng, f0=72)

    A.add_phrase(close, tbar(2, bpm), CALL, CALL_DUR, root, mode, A.tin_whistle, bpm, vel=0.4, low=True, pan=-0.22)
    A.add_phrase(close, tbar(8, bpm), [8, 5], [6, 10], root, mode, A.tin_whistle, bpm, vel=0.48, low=True, pan=-0.15)
    A.add_phrase(close, tbar(16, bpm), ANSWER, ANSWER_DUR, root, mode, A.tin_whistle, bpm, vel=0.52, pan=-0.12)
    A.harp_arpeggio(close, tbar(17, bpm), chord_hz(root, [1, 3, 5, 8], mode),
                    24, bpm, vel=0.16, pattern=[0, 2, 0, 1], bright=0.3)
    # still ground: one far call only
    A.add_phrase(close, tbar(26, bpm), [5, 8], [6, 10], root - 12, mode, A.tin_whistle, bpm, vel=0.28, low=True, pan=0.18)
    A.add_phrase(close, tbar(32, bpm), list(reversed(ANSWER)), list(reversed(ANSWER_DUR)),
                 root, mode, A.tin_whistle, bpm, vel=0.44, pan=-0.14)
    A.add_phrase(close, tbar(36, bpm), [8, 5, 1], [4, 4, 8], root, mode, A.tin_whistle, bpm, vel=0.32, low=True, pan=-0.1)

    # A single soft skin hit, like a distant wing — not a groove
    for b, v in ((19.0, 0.16), (22.5, 0.12), (34.0, 0.14)):
        E.add_mono(perc, tbar(b, bpm), A.bodhran(rng, dur=0.4, tight=True, vel=v), gain=1.0, pan=-0.1)

    _shape(far,   [0, tbar(8, bpm), tbar(16, bpm), tbar(24, bpm), tbar(32, bpm), dur],
                  [0.55, 0.75, 1.0, 0.4, 0.8, 0.5])
    _shape(mid,   [0, tbar(8, bpm), tbar(16, bpm), tbar(24, bpm), tbar(32, bpm), dur],
                  [0.2, 0.6, 1.15, 0.25, 0.85, 0.45])
    _shape(close, [0, tbar(8, bpm), tbar(16, bpm), tbar(24, bpm), tbar(32, bpm), dur],
                  [0.45, 0.7, 1.05, 0.3, 0.9, 0.4])

    close = C.polish_stem(close, hp=50, air_db=1.2)
    mid = C.polish_stem(mid, hp=26)
    far = C.polish_stem(far, hp=20)
    perc = C.polish_stem(perc, hp=22)
    mixed = C.depth_mix(close, mid, far, perc, 1.0, 0.95, 0.95, 0.5)
    mixed = A.apply_reverb(mixed, np.random.default_rng(35), ir_s=4.6, wet=0.4, dry=0.9, pre=0.05, dark=2000)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=3.6, target_lufs=-16.0, split=110)
    sections = [
        ("dusk_call", 0.0, tbar(8, bpm)),
        ("watch", tbar(8, bpm), tbar(16, bpm)),
        ("circle", tbar(16, bpm), tbar(24, bpm)),
        ("still_ground", tbar(24, bpm), tbar(32, bpm)),
        ("answer", tbar(32, bpm), dur),
    ]
    return out, sections, dict(title="Owl Hour", context="night", bpm=bpm, target_lufs=-16.0)


# ---------------------------------------------------------------------------
# 6. Claymore — combat. D aeolian, tense written percussion, not hardcore.
# ---------------------------------------------------------------------------
def render_claymore():
    bpm, bars = 100.0, 76  # 182.4 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9306)
    mode, root, root_lo = "aeolian", 62, 50  # D
    lift_mode, lift_root = "aeolian", 67     # G aeolian press
    n = close.shape[0]

    sL, sR = A.sub_drone(n, A.midi(38), gain=0.12, lfo=0.03)  # D1
    rL, rR = A.rumble(n, rng, gain=0.05)
    far[:n] += np.stack([sL + rL, sR + rR], 1)

    # Ostinato cells that change every section (written, not a tiled loop)
    def ostinato(bar0, bar1, root_, mode_, pattern, vel=0.45):
        t, end, i = tbar(bar0, bpm), tbar(bar1, bpm), 0
        beat = spb(bpm)
        while t < end - 0.02:
            deg = pattern[i % len(pattern)]
            sig = C.funk_bass(hz(root_ - 24 if root_ >= 50 else root_, deg, mode_), beat * 1.15,
                              vel=vel * (0.9 if i % 4 else 1.05), dead=(i % 8 == 3))
            E.add_mono(mid, t, sig, gain=1.0)
            # low string bite on the same degrees, longer
            if i % 2 == 0:
                L, R = C.string_ensemble(int(beat * 2.2 * SR),
                                         [hz(root_ - 12, deg, mode_)],
                                         gain=0.04, attack=0.02, release=0.2, bright=0.2)
                E.add_stereo(mid, t, L, R)
            t += beat * 0.5
            i += 1

    ostinato(8, 16, root_lo, mode, [1, 1, 3, 2], 0.4)
    ostinato(16, 24, root_lo, mode, [1, 1, 3, 2, 5, 3, 2, 1], 0.5)
    ostinato(24, 32, root_lo, mode, [1, 5, 4, 3, 1, 1, 3, 2], 0.52)
    # lock: almost held, rare nudges
    ostinato(32, 40, root_lo, mode, [1, 1, 1, 1, 1, 1, 5, 1], 0.28)
    ostinato(40, 56, lift_root, lift_mode, [1, 1, 3, 5, 4, 3, 2, 1], 0.55)
    ostinato(56, 68, root_lo, mode, [1, 3, 5, 3, 1, 1, 2, 1], 0.46)
    ostinato(68, 76, root_lo, mode, [1, 1, 5, 1], 0.32)

    _strings_at(mid, tbar(0, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.05, 0.8, 1.0, 0.15)
    _strings_at(mid, tbar(8, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 3, 5], mode), 0.08, 0.4, 0.7, 0.25)
    _strings_at(mid, tbar(16, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.12, 0.25, 0.5, 0.4)
    _strings_at(mid, tbar(24, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 4, 5, 8], mode), 0.13, 0.2, 0.5, 0.42)
    _strings_at(mid, tbar(32, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.06, 0.8, 1.2, 0.12)
    _strings_at(mid, tbar(40, bpm), tbar(16, bpm), chord_hz(lift_root - 12, [1, 3, 5, 8], lift_mode), 0.14, 0.2, 0.5, 0.5)
    _strings_at(mid, tbar(56, bpm), tbar(12, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.11, 0.3, 0.7, 0.36)
    _strings_at(mid, tbar(68, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.05, 0.8, 1.2, 0.18)

    # Horn / whistle calls as war figures, not a folk dance
    CLAY = [1, 3, 5, 8, 7, 5]
    CLAY_DUR = [1, 1, 2, 2, 2, 8]
    A.add_phrase(close, tbar(10, bpm), CLAY, CLAY_DUR, root_lo, mode, A.tin_whistle, bpm, vel=0.4, low=True, pan=-0.15)
    A.add_phrase(close, tbar(18, bpm), [5, 8, 10, 8, 7, 5], [1, 1, 2, 2, 2, 8], root, mode, A.fiddle_note, bpm, vel=0.5, pan=0.22)
    hL, hR = C.horn_swell(hz(root_lo, 5, mode), 2.4, vel=0.42, bright=0.5)
    E.add_stereo(close, tbar(16, bpm), hL, hR)
    hL, hR = C.horn_swell(hz(root_lo, 1, mode), 2.2, vel=0.4, bright=0.45)
    E.add_stereo(close, tbar(23.2, bpm), hL, hR)
    A.add_phrase(close, tbar(42, bpm), [1, 3, 5, 8, 10, 8], [1, 1, 1, 2, 2, 9], lift_root, lift_mode,
                 A.tin_whistle, bpm, vel=0.55, pan=-0.1)
    hL, hR = C.horn_swell(hz(lift_root, 1, lift_mode), 3.0, vel=0.46, bright=0.55)
    E.add_stereo(close, tbar(48, bpm), hL, hR)
    A.add_phrase(close, tbar(56, bpm), list(reversed(CLAY)), [2, 2, 2, 2, 2, 6], root, mode,
                 A.tin_whistle, bpm, vel=0.5, pan=-0.12)
    hL, hR = C.horn_swell(hz(root_lo, 1, mode), 3.4, vel=0.34, bright=0.35)
    E.add_stereo(mid, tbar(68, bpm), hL, hR)

    hits = []
    def hit(bar, kind, vel, pan=0.0, hard=False):
        t = C.humanize(tbar(bar, bpm), rng, 0.003)
        hits.append(t)
        if kind == "taiko":
            E.add_mono(perc, t, C.taiko(rng, vel=vel), gain=1.0, pan=pan)
        elif kind == "kick":
            E.add_mono(perc, t, C.cinematic_kick(rng, vel=vel, hard=hard), gain=1.0, pan=pan)
        elif kind == "snare":
            E.add_mono(perc, t, C.layered_snare(rng, vel=vel, tight=not hard), gain=1.0, pan=pan)
        elif kind == "hat":
            E.add_mono(perc, t, C.hat(rng, vel=vel, open_hat=hard), gain=1.0, pan=pan)
        elif kind == "ghost":
            E.add_mono(perc, t, C.ghost_stick(rng, vel=vel), gain=1.0, pan=pan)

    # steel_draw: sparse taiko
    for b in (0.0, 2.0, 4.0, 6.0, 7.5):
        hit(b, "taiko", 0.35 if b < 6 else 0.5)
    # advance
    for b in range(8, 16):
        hit(float(b), "taiko", 0.48 if b % 2 == 0 else 0.34)
        hit(b + 0.5, "hat", 0.14, 0.2)
        if b % 4 == 3:
            hit(b + 0.75, "ghost", 0.16, -0.2)
    # clash + bind: written, denser, not 4-on-the-floor hardcore
    for b, k, v, p, h in [
        (16.00, "kick", 0.62, 0.0, True), (16.00, "taiko", 0.5, 0.0, False),
        (16.50, "hat", 0.18, 0.2, False), (17.00, "snare", 0.4, 0.08, False),
        (17.50, "ghost", 0.16, -0.2, False), (18.00, "taiko", 0.52, 0.0, False),
        (18.75, "snare", 0.32, 0.1, False), (19.00, "kick", 0.48, 0.0, False),
        (19.50, "hat", 0.16, -0.18, False),
        (20.00, "kick", 0.64, 0.0, True), (20.50, "taiko", 0.4, 0.0, False),
        (21.00, "snare", 0.44, 0.08, True), (21.75, "ghost", 0.16, 0.2, False),
        (22.00, "taiko", 0.5, 0.0, False), (22.50, "hat", 0.18, -0.15, False),
        (23.00, "snare", 0.38, 0.1, False), (23.50, "kick", 0.4, 0.0, False),
        (24.00, "kick", 0.66, 0.0, True), (24.50, "hat", 0.2, 0.2, False),
        (25.00, "snare", 0.46, 0.08, False), (25.50, "taiko", 0.36, 0.0, False),
        (26.00, "kick", 0.58, 0.0, False), (26.75, "snare", 0.34, 0.12, False),
        (27.00, "taiko", 0.48, 0.0, False), (27.50, "hat", 0.16, -0.2, False),
        (28.00, "kick", 0.62, 0.0, True), (28.50, "ghost", 0.16, 0.2, False),
        (29.00, "snare", 0.42, 0.08, False), (30.00, "taiko", 0.44, 0.0, False),
        (31.00, "kick", 0.5, 0.0, False), (31.50, "snare", 0.3, 0.1, False),
        # lock: hats and a ticking ghost only
        (32.00, "taiko", 0.28, 0.0, False), (33.00, "hat", 0.1, 0.15, False),
        (34.00, "ghost", 0.12, -0.2, False), (35.00, "hat", 0.1, 0.2, False),
        (36.00, "taiko", 0.3, 0.0, False), (38.00, "hat", 0.12, -0.15, False),
        (39.00, "ghost", 0.1, 0.18, False),
    ]:
        hit(b, k, v, p, h)

    # press: heavier, written variations each two bars, G aeolian
    for base in range(40, 56, 4):
        shift = (base - 40) // 4
        pattern = [
            (0.00, "kick", 0.7, True), (0.00, "taiko", 0.55, False),
            (0.50, "hat", 0.2, False), (1.00, "snare", 0.5, True),
            (1.50, "ghost", 0.16, False), (2.00, "taiko", 0.48, False),
            (2.50, "hat", 0.18, False), (2.75, "snare", 0.28 + 0.04 * shift, False),
            (3.00, "kick", 0.58, False), (3.50, "ghost", 0.14, False),
        ]
        if shift == 1:
            pattern.append((3.25, "taiko", 0.4, False))
        if shift == 2:
            pattern[3] = (1.00, "snare", 0.58, True)
        if shift == 3:
            pattern.append((1.75, "hat", 0.16, False))
        for off, k, v, h in pattern:
            pan = 0.0 if k in ("kick", "taiko") else (0.15 if k == "snare" else -0.18 if k == "ghost" else 0.2)
            hit(base + off, k, v, pan, h)

    for b, k, v, p, h in [
        (56.00, "kick", 0.62, 0.0, True), (56.00, "taiko", 0.5, 0.0, False),
        (57.00, "snare", 0.4, 0.08, False), (58.00, "taiko", 0.44, 0.0, False),
        (59.00, "hat", 0.16, 0.2, False), (60.00, "kick", 0.58, 0.0, False),
        (61.00, "snare", 0.36, 0.1, False), (62.00, "taiko", 0.4, 0.0, False),
        (64.00, "kick", 0.5, 0.0, False), (66.00, "taiko", 0.34, 0.0, False),
        (68.00, "taiko", 0.3, 0.0, False), (72.00, "taiko", 0.24, 0.0, False),
        (74.00, "taiko", 0.2, 0.0, False),
    ]:
        hit(b, k, v, p, h)

    rL, rR = C.riser(rng, tbar(2.5, bpm), start_hz=150, end_hz=7000, vel=0.4)
    E.add_stereo(far, tbar(13.5, bpm), rL, rR)
    iL, iR = C.impact(rng, dur=2.2, vel=0.62)
    E.add_stereo(perc, tbar(16, bpm), iL, iR)
    rL, rR = C.riser(rng, tbar(3.0, bpm), start_hz=180, end_hz=8500, vel=0.48)
    E.add_stereo(far, tbar(37.0, bpm), rL, rR)
    iL, iR = C.impact(rng, dur=2.4, vel=0.7)
    E.add_stereo(perc, tbar(40, bpm), iL, iR)
    dwn = C.downlifter(rng, dur=1.6, vel=0.3)
    E.add_mono(far, tbar(56, bpm), dwn, gain=1.0)

    mid[:, :] = C.apply_sidechain(mid, [h for h in hits if tbar(16, bpm) <= h < tbar(32, bpm) or tbar(40, bpm) <= h < tbar(56, bpm)],
                                  depth=0.42, rel=0.16)
    far[:, :] = C.apply_sidechain(far, [h for h in hits if tbar(40, bpm) <= h < tbar(56, bpm)], depth=0.25, rel=0.2)

    close = C.polish_stem(close, hp=50, air_db=1.0)
    mid = C.polish_stem(mid, hp=28, mud_cut_db=-1.6)
    far = C.polish_stem(far, hp=22)
    perc = C.polish_stem(perc, hp=24)
    mixed = C.depth_mix(close, mid, far, perc, 0.95, 0.95, 0.8, 1.05)
    mixed = A.apply_reverb(mixed, np.random.default_rng(36), ir_s=2.1, wet=0.2, dry=1.0, pre=0.02, dark=2400)
    sections = [
        ("steel_draw", 0.0, tbar(8, bpm)),
        ("advance", tbar(8, bpm), tbar(16, bpm)),
        ("clash", tbar(16, bpm), tbar(24, bpm)),
        ("bind", tbar(24, bpm), tbar(32, bpm)),
        ("lock", tbar(32, bpm), tbar(40, bpm)),
        ("press", tbar(40, bpm), tbar(56, bpm)),
        ("last_guard", tbar(56, bpm), dur),
    ]
    out, loud_map = M.festive_master(mixed[: int(dur * SR)], sections, xfade_s=1.8)
    return out, sections, dict(title="Claymore", context="combat", bpm=bpm, target_lufs=-9.0, section_lufs=loud_map)


# ---------------------------------------------------------------------------
# 7. Starlight Show — original dance-pop for when the pop star is near.
#    122 BPM, Ab ionian with mixolydian colour. Not her diegetic song.
# ---------------------------------------------------------------------------
def render_starlight_show():
    bpm, bars = 122.0, 100  # 196.72 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9307)
    mode, root, root_lo = "ionian", 68, 56  # Ab
    mix_mode = "mixolydian"                 # Ab mixolydian colour (Gb)
    fm_mode, fm_root = "aeolian", 65        # F minor break
    n = close.shape[0]
    beat = spb(bpm)

    air_L, air_R = A.air_noise(n, rng, lo=400, hi=5000, gain=0.01)
    far[:n] += np.stack([air_L, air_R], 1)

    # Progressions (bar -> (root, mode, degrees of a triad-or-more))
    # Avoid a looping I–V–vi–IV as the only motion.
    def prog_at(bar):
        if bar < 16:
            cycle = [(root_lo, mix_mode, [1, 3, 5]), (root_lo, mix_mode, [7, 2, 5]),
                     (root_lo, mix_mode, [6, 1, 3]), (root_lo, mix_mode, [4, 6, 8])]
            return cycle[int(bar) % 4]
        if bar < 32:
            cycle = [(root_lo, mode, [1, 3, 5]), (root_lo, mode, [2, 4, 6]),
                     (root_lo, mix_mode, [7, 2, 5]), (root_lo, mode, [5, 7, 9])]
            return cycle[int(bar) % 4]
        if bar < 40:
            cycle = [(fm_root, fm_mode, [1, 3, 5]), (root_lo, mode, [4, 6, 8]),
                     (root_lo, mix_mode, [6, 1, 3]), (root_lo, mode, [5, 7, 9])]
            return cycle[int(bar) % 4]
        if bar < 56:
            cycle = [(root_lo, mode, [1, 3, 5, 8]), (root_lo, mode, [3, 5, 7]),
                     (root_lo, mode, [4, 6, 8]), (root_lo, mode, [5, 7, 9])]
            return cycle[int(bar) % 4]
        if bar < 64:
            cycle = [(fm_root, fm_mode, [1, 3, 5]), (fm_root, fm_mode, [7, 2, 5]),
                     (fm_root, fm_mode, [6, 1, 3]), (fm_root, fm_mode, [5, 7, 9])]
            return cycle[int(bar) % 4]
        if bar < 72:
            # second half of the break turns toward the lift — not a copy of bars 56–64
            cycle = [(fm_root, fm_mode, [1, 3, 6]), (root_lo, mix_mode, [4, 6, 8]),
                     (root_lo, mix_mode, [6, 1, 3]), (root_lo, mode, [5, 7, 9])]
            return cycle[int(bar) % 4]
        if bar < 80:
            cycle = [(fm_root, fm_mode, [1, 3, 5]), (root_lo, mode, [4, 6, 8]),
                     (root_lo, mix_mode, [6, 1, 3]), (root_lo, mode, [5, 7, 9])]
            return cycle[int(bar) % 4]
        if bar < 96:
            cycle = [(root_lo, mode, [1, 3, 5, 8]), (root_lo, mode, [5, 7, 9]),
                     (root_lo, mix_mode, [7, 2, 5]), (root_lo, mode, [1, 3, 5, 8])]
            return cycle[int(bar) % 4]
        cycle = [(root_lo, mix_mode, [1, 3, 5]), (root_lo, mix_mode, [7, 2, 5]),
                 (root_lo, mix_mode, [4, 6, 8]), (root_lo, mode, [1, 5])]
        return cycle[int(bar) % 4]

    # Filtered disco stabs — muted in the intro, open in the drops
    for b in range(0, bars):
        r, m, degs = prog_at(b)
        freqs = [hz(r, d, m) for d in degs[:3]]
        if b < 16:
            cut, vel, dur_s = 1100, 0.28, 0.09
        elif b < 32:
            cut, vel, dur_s = 1800, 0.34, 0.08
        elif b < 40:
            cut, vel, dur_s = 2600, 0.4, 0.07
        elif b < 56:
            cut, vel, dur_s = 4200, 0.46, 0.08
        elif b < 64:
            cut, vel, dur_s = 1400, 0.3, 0.1
        elif b < 72:
            cut, vel, dur_s = 2600, 0.34, 0.08
        elif b < 80:
            cut, vel, dur_s = 3000, 0.42, 0.07
        elif b < 96:
            cut, vel, dur_s = 5000, 0.5, 0.08
        else:
            cut, vel, dur_s = 1600, 0.28, 0.09
        L, R = E.muted_stab(freqs, dur=dur_s, cutoff=cut, det=7)
        # off-beat and 'and' of 4 in drops; downbeats only in intro/break
        if b < 16 or 56 <= b < 64 or b >= 96:
            E.add_stereo(mid, tbar(b, bpm) + 0.5 * beat, L, R, gain=vel)
        elif 64 <= b < 72:
            E.add_stereo(mid, tbar(b, bpm) + 0.5 * beat, L, R, gain=vel)
            if b % 2 == 1:
                E.add_stereo(mid, tbar(b, bpm) + 0.75 * beat, L, R, gain=vel * 0.55)
        else:
            E.add_stereo(mid, tbar(b, bpm) + 0.5 * beat, L, R, gain=vel)
            if b % 4 == 3:
                E.add_stereo(mid, tbar(b, bpm) + 0.75 * beat, L, R, gain=vel * 0.7)

    # Funk bass, written cells that change by section
    def bass_cell(bar0, bar1, root_, mode_, pattern):
        # pattern: list of (beat_in_bar, deg, beats, dead, slide_deg_or_None)
        for b in range(bar0, bar1):
            for off, deg, beats, dead, sdeg in pattern:
                # slight rewrite every other bar
                deg_ = deg if ((b - bar0) % 2 == 0) else (5 if deg == 1 and off >= 2 else deg)
                freq = hz(root_ - 12, deg_, mode_)
                sl = hz(root_ - 12, sdeg, mode_) if sdeg else None
                sig = C.funk_bass(freq, beats * beat, vel=0.62 if not dead else 0.3,
                                  dead=dead, slide_from=sl)
                E.add_mono(mid, tbar(b, bpm) + off * beat, sig, gain=1.0)

    bass_cell(0, 16, root_lo, mix_mode, [(0.0, 1, 2.0, False, None), (2.0, 1, 1.0, True, None), (3.0, 5, 1.0, False, None)])
    bass_cell(16, 32, root_lo, mode, [(0.0, 1, 1.0, False, None), (1.0, 1, 1.0, True, None),
                                      (2.0, 5, 1.0, False, None), (3.0, 4, 1.0, False, 5)])
    bass_cell(32, 40, fm_root, fm_mode, [(0.0, 1, 1.0, False, None), (1.5, 5, 0.5, False, None),
                                         (2.0, 1, 1.0, False, None), (3.0, 7, 1.0, False, 1)])
    bass_cell(40, 48, root_lo, mode, [(0.0, 1, 1.0, False, None), (1.0, 5, 0.5, False, None),
                                      (1.5, 1, 0.5, True, None), (2.0, 4, 1.0, False, None),
                                      (3.0, 5, 1.0, False, None)])
    bass_cell(48, 56, root_lo, mode, [(0.0, 1, 0.5, False, None), (0.5, 1, 0.5, True, None),
                                      (1.0, 5, 1.0, False, None), (2.0, 7, 0.5, False, None),
                                      (2.5, 4, 0.5, False, None), (3.0, 5, 0.5, False, 1),
                                      (3.5, 1, 0.5, False, None)])
    bass_cell(56, 64, fm_root, fm_mode, [(0.0, 1, 2.0, False, None), (2.0, 7, 2.0, False, None)])
    bass_cell(64, 72, fm_root, fm_mode, [(0.0, 1, 1.0, False, None), (1.5, 3, 0.5, True, None),
                                         (2.0, 5, 1.0, False, None), (3.0, 1, 1.0, False, 5)])
    bass_cell(72, 80, fm_root, fm_mode, [(0.0, 1, 1.0, False, None), (1.5, 5, 0.5, False, None),
                                         (2.0, 1, 1.0, False, None), (3.0, 4, 1.0, False, 1)])
    bass_cell(80, 96, root_lo, mode, [(0.0, 1, 0.5, False, None), (0.5, 1, 0.5, True, None),
                                      (1.0, 5, 1.0, False, None), (2.0, 7, 1.0, False, None),
                                      (3.0, 5, 1.0, False, 1)])
    bass_cell(96, 100, root_lo, mix_mode, [(0.0, 1, 2.0, False, None), (2.0, 5, 2.0, False, None)])

    # Avicii-style plucks: verse and drop figures (original)
    def pluck_fig(bar0, bar1, root_, mode_, degs, vel=0.4, bright=0.7):
        for b in range(bar0, bar1):
            for i, d in enumerate(degs):
                L, R = C.avicii_pluck(hz(root_, d, mode_), beat * 1.1, vel=vel, bright=bright)
                E.add_stereo(close, tbar(b, bpm) + i * 0.5 * beat, L, R, gain=0.75)

    pluck_fig(16, 32, root, mode, [1, 5, 8, 5, 7, 5, 4, 5], 0.36, 0.62)
    pluck_fig(32, 40, fm_root, fm_mode, [1, 3, 5, 8, 7, 5, 3, 5], 0.4, 0.7)
    pluck_fig(40, 48, root, mode, [1, 5, 8, 10, 8, 7, 5, 8], 0.46, 0.75)
    pluck_fig(48, 56, root + 12, mode, [5, 8, 10, 12, 10, 8, 7, 5], 0.5, 0.8)
    pluck_fig(56, 64, fm_root, fm_mode, [1, 5, 3, 5], 0.28, 0.5)
    pluck_fig(64, 72, root, mix_mode, [5, 7, 8, 10, 8, 7, 5, 3], 0.36, 0.68)
    pluck_fig(72, 80, root, mode, [1, 3, 5, 8, 10, 8, 7, 5], 0.42, 0.72)
    pluck_fig(80, 96, root + 12, mode, [1, 5, 8, 10, 8, 7, 5, 8], 0.44, 0.78)

    # Original hook: a syncopated 8-beat figure, then an answering lift.
    # Not her song, not the remix hook, not a folk Glen theme.
    HOOK = [5, 5, 8, 7, 6, 3, 5, 8]
    HOOK_DUR = [0.5, 0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0]
    HOOK2 = [3, 5, 6, 8, 10, 8, 6, 5]
    HOOK2_DUR = [0.5, 0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0]
    COUNTER = [8, 10, 12, 10, 8, 7, 5]
    COUNTER_DUR = [1, 1, 2, 1, 1, 1, 1]

    def hook_at(bar, which="a", vel=0.7, voc=True):
        degs, durs = (HOOK, HOOK_DUR) if which == "a" else (HOOK2, HOOK2_DUR)
        t0 = tbar(bar, bpm)
        # synth lead (soft saw, not the nightcore formant lead)
        t = t0
        for deg, dur_b in zip(degs, durs):
            L, R = E.supersaw_stereo(hz(root, deg, mode), dur_b * beat * 1.05, det=14, n_osc=6, cutoff=3800)
            env = C.env_curve(len(L), 0.01, 0.08, 0.7, 0.08)
            E.add_stereo(close, t, L * env, R * env, gain=vel)
            t += dur_b * beat
        if voc:
            # vocoder hook over a vowel path — wordless, original contour
            nn = int(8 * beat * SR)
            car_L, car_R = E.supersaw_stereo(hz(root, 5, mode), 8 * beat, det=10, n_osc=5, cutoff=3500)
            # retune carrier by mixing a moving saw of the hook
            path = [(0.0, (700, 1200, 2500)), (0.35, (500, 900, 2200)),
                    (0.65, (800, 1400, 2800)), (1.0, (600, 1100, 2300))]
            mod = C.vowel_modulator(nn, path, f0=185)
            v = C.vocoder(0.5 * (car_L[:nn] + car_R[:nn]), mod[:nn], bands=16, lo=200, hi=5200)
            E.add_mono(close, t0, C.fade_edges(v * 0.55 * vel, 0.02, 0.08), gain=1.0, pan=0.05)

    hook_at(24, "a", 0.42, voc=True)   # late verse teaser
    hook_at(40, "a", 0.78, voc=True)
    hook_at(48, "b", 0.74, voc=True)
    hook_at(64, "b", 0.48, voc=True)   # break second half — answering figure, not hook A again
    A.add_phrase(close, tbar(68, bpm), COUNTER, COUNTER_DUR, fm_root, fm_mode,
                 (lambda freq, dur, vel=0.6, **k: E.supersaw_stereo(freq, dur, det=8, n_osc=5, cutoff=2800)),
                 bpm, vel=0.32, pan=-0.22)
    hook_at(80, "a", 0.82, voc=True)
    hook_at(88, "b", 0.8, voc=True)
    # countermelody on drop 2 only
    A.add_phrase(close, tbar(84, bpm), COUNTER, COUNTER_DUR, root + 12, mode,
                 (lambda freq, dur, vel=0.6, **k: E.supersaw_stereo(freq, dur, det=10, n_osc=5, cutoff=4200)),
                 bpm, vel=0.45, pan=0.3)

    # Pads / supersaw beds, sectional (not a constant bed)
    def saw_pad(bar0, length_bars, root_, mode_, degs, cut, gain):
        L, R = E.supersaw_stereo(hz(root_, degs[0], mode_), length_bars * 4 * beat + 0.4,
                                 det=16, n_osc=7, cutoff=cut)
        # add fifth
        L2, R2 = E.supersaw_stereo(hz(root_, degs[1] if len(degs) > 1 else 5, mode_),
                                   length_bars * 4 * beat + 0.4, det=12, n_osc=5, cutoff=cut)
        E.add_stereo(far, tbar(bar0, bpm), (L + 0.6 * L2) * gain, (R + 0.6 * R2) * gain)

    saw_pad(8, 8, root_lo, mix_mode, [1, 5], 1600, 0.08)
    saw_pad(32, 8, fm_root, fm_mode, [1, 5], 2200, 0.12)
    saw_pad(40, 16, root_lo, mode, [1, 5], 3600, 0.16)
    saw_pad(56, 16, fm_root, fm_mode, [1, 3], 1400, 0.08)
    saw_pad(72, 8, root_lo, mode, [1, 5], 2800, 0.14)
    saw_pad(80, 16, root_lo, mode, [1, 5], 4200, 0.18)
    saw_pad(96, 4, root_lo, mix_mode, [1, 5], 1800, 0.08)

    # Drums: custom kits, written patterns that change every 8 bars
    kicks = []
    def k_at(bar, style="punch", vel=0.85):
        t = C.humanize(tbar(bar, bpm), rng, 0.002)
        kicks.append(t)
        E.add_mono(perc, t, E.make_kick_kit(rng, style=style) * vel, gain=1.0)

    def s_at(bar, kind="hit", vel=0.7, pan=0.08):
        t = C.humanize(tbar(bar, bpm), rng, 0.003)
        E.add_mono(perc, t, E.make_snare_pro(rng, kind=kind) * vel, gain=1.0, pan=pan)

    def h_at(bar, style="sizzle", vel=0.28, pan=0.22, open_hat=False):
        t = C.humanize(tbar(bar, bpm), rng, 0.002)
        if open_hat:
            E.add_mono(perc, t, C.hat(rng, vel=vel, open_hat=True), gain=1.0, pan=pan)
        else:
            E.add_mono(perc, t, E.make_hat_pro(rng, style=style) * vel, gain=1.0, pan=pan)

    # lights_up: four-on-the-floor but filtered, hats only on 2+4 later
    for b in range(0, 16):
        k_at(float(b), "soft", 0.55 if b >= 8 else 0.42)
        if b >= 8 and b % 2 == 1:
            s_at(float(b), "hit", 0.28)
        h_at(b + 0.5, "sizzle", 0.14 if b < 8 else 0.2, 0.2)
    # verse: tighter kit, ghost notes
    for b in range(16, 32):
        k_at(float(b), "tight", 0.7)
        if b % 2 == 1:
            s_at(float(b), "hit", 0.55)
        h_at(b + 0.5, "sizzle", 0.24, 0.18 if b % 2 else -0.18)
        if b % 4 == 3:
            h_at(b + 0.75, "sizzle", 0.16, -0.1)
            E.add_mono(perc, tbar(b, bpm) + 0.75 * beat, C.ghost_stick(rng, vel=0.16), gain=1.0, pan=-0.2)
    # pre: open hats, rising density
    for b in range(32, 40):
        k_at(float(b), "punch", 0.78)
        if b % 2 == 1:
            s_at(float(b), "hit", 0.62)
        h_at(b + 0.5, "sizzle", 0.28, 0.2, open_hat=(b >= 36))
        if b >= 36:
            h_at(b + 0.25, "sizzle", 0.16, -0.15)
            h_at(b + 0.75, "sizzle", 0.16, 0.15)
    # drop 1: slam kit, written 8-bar variations (two different 8-bar cells)
    for b in range(40, 56):
        style = "slam" if b < 48 else "punch"
        k_at(float(b), style, 0.9)
        if (b % 4) == 2:
            k_at(b + 0.75, "click", 0.45)  # syncopated pickup, only some bars
        if b % 2 == 1:
            s_at(float(b), "hit", 0.78 if b < 48 else 0.82)
        h_at(b + 0.5, "sizzle", 0.32, 0.2 if b % 2 else -0.18)
        if b % 2 == 0:
            h_at(b + 0.25, "sizzle", 0.16, -0.12)
        if b >= 48:
            # second drop-1 cell: 16th hats, off-beat kick, no cloned groove
            h_at(b + 0.25, "sizzle", 0.2, -0.16)
            h_at(b + 0.75, "sizzle", 0.2, 0.16)
            if b % 2 == 0:
                k_at(b + 0.5, "click", 0.42)
            E.add_mono(perc, tbar(b, bpm) + 0.375 * beat, C.ghost_stick(rng, vel=0.18), gain=1.0, pan=-0.22)
            if b % 4 == 0:
                E.add_stereo(perc, tbar(b, bpm), *C.impact(rng, dur=1.1, vel=0.35))
    # break first 8: half-time kick, dry
    for b in range(56, 64):
        if b % 2 == 0:
            k_at(float(b), "soft", 0.48)
        if b % 4 == 2:
            s_at(float(b), "hit", 0.3)
        h_at(b + 0.5, "sizzle", 0.12, 0.15)
    # break second 8: no kick, open hats, light snare — a lift toward the build
    for b in range(64, 72):
        if b % 4 == 0:
            s_at(float(b), "hit", 0.24)
        h_at(b + 0.5, "sizzle", 0.20, -0.18, open_hat=True)
        if b >= 68:
            h_at(b + 0.25, "sizzle", 0.14, 0.16)
            h_at(b + 0.75, "sizzle", 0.14, -0.12)
    # lift: build again
    for b in range(72, 80):
        k_at(float(b), "punch", 0.8)
        if b % 2 == 1:
            s_at(float(b), "hit", 0.66)
        h_at(b + 0.5, "sizzle", 0.28, 0.2, open_hat=(b >= 76))
        if b >= 76:
            h_at(b + 0.25, "sizzle", 0.18, -0.16)
            h_at(b + 0.75, "sizzle", 0.18, 0.16)
    # drop 2: bigger, extra off-beat kick in later 8
    for b in range(80, 96):
        k_at(float(b), "slam", 0.95)
        if b >= 88 and b % 2 == 0:
            k_at(b + 0.5, "click", 0.4)
        if b % 2 == 1:
            s_at(float(b), "hit", 0.86)
        h_at(b + 0.5, "sizzle", 0.34, 0.22 if b % 2 else -0.2)
        h_at(b + 0.25, "sizzle", 0.16, -0.1)
        if b % 4 == 3:
            s_at(b + 0.75, "hit", 0.3, pan=0.14)
    # curtain
    for b in range(96, 100):
        k_at(float(b), "soft", 0.5)
        if b % 2 == 1:
            s_at(float(b), "hit", 0.28)
        h_at(b + 0.5, "sizzle", 0.14, 0.15)

    # Impacts and builds
    rL, rR = C.riser(rng, tbar(3.5, bpm), start_hz=220, end_hz=10000, vel=0.5)
    E.add_stereo(far, tbar(36.5, bpm), rL, rR)
    iL, iR = C.impact(rng, dur=1.8, vel=0.7)
    E.add_stereo(perc, tbar(40, bpm), iL, iR)
    dwn = C.downlifter(rng, dur=1.3, vel=0.32)
    E.add_mono(far, tbar(56, bpm), dwn, gain=1.0)
    rL, rR = C.riser(rng, tbar(3.8, bpm), start_hz=200, end_hz=11000, vel=0.58)
    E.add_stereo(far, tbar(76.2, bpm), rL, rR)
    iL, iR = C.impact(rng, dur=2.0, vel=0.78)
    E.add_stereo(perc, tbar(80, bpm), iL, iR)
    dwn = C.downlifter(rng, dur=1.5, vel=0.3)
    E.add_mono(far, tbar(96, bpm), dwn, gain=1.0)

    # Filter journey: dark intro, open drops, darker break
    mid[:, :] = C.lp_tv(mid, C.sweep_cutoff(len(mid), 1400, 6500, curve=0.7,
                                            hold_start=tbar(40, bpm) / dur,
                                            hold_end=1.0 - tbar(56, bpm) / dur), Q=0.78)

    mid[:, :] = C.apply_sidechain(mid, [k for k in kicks if tbar(40, bpm) <= k < tbar(56, bpm) or tbar(80, bpm) <= k < tbar(96, bpm)],
                                  depth=0.55, rel=0.14)
    far[:, :] = C.apply_sidechain(far, [k for k in kicks if tbar(40, bpm) <= k < tbar(56, bpm) or tbar(80, bpm) <= k < tbar(96, bpm)],
                                  depth=0.35, rel=0.18)
    close[:, :] = C.apply_sidechain(close, [k for k in kicks if tbar(80, bpm) <= k < tbar(96, bpm)],
                                    depth=0.22, rel=0.12)

    # Sectional gain: intro, break and curtain must sit below the drops
    # (mastering must not flatten this — leave headroom, target a slightly
    # quieter LUFS so the true-peak limiter does not squash the range).
    _shape(close, [0, tbar(16, bpm), tbar(32, bpm), tbar(40, bpm), tbar(56, bpm),
                   tbar(72, bpm), tbar(80, bpm), tbar(96, bpm), dur],
                  [0.55, 0.8, 0.95, 1.15, 0.42, 0.9, 1.2, 0.55, 0.45])
    _shape(mid,   [0, tbar(16, bpm), tbar(32, bpm), tbar(40, bpm), tbar(56, bpm),
                   tbar(72, bpm), tbar(80, bpm), tbar(96, bpm), dur],
                  [0.5, 0.78, 0.95, 1.12, 0.38, 0.88, 1.15, 0.5, 0.4])
    _shape(far,   [0, tbar(16, bpm), tbar(40, bpm), tbar(56, bpm), tbar(80, bpm), tbar(96, bpm), dur],
                  [0.55, 0.85, 1.05, 0.45, 1.1, 0.55, 0.45])
    _shape(perc,  [0, tbar(16, bpm), tbar(32, bpm), tbar(40, bpm), tbar(56, bpm),
                   tbar(72, bpm), tbar(80, bpm), tbar(96, bpm), dur],
                  [0.45, 0.75, 0.92, 1.15, 0.32, 0.95, 1.2, 0.5, 0.4])

    # A touch of ping-pong on the hook bus
    close[:, :] = E.ping_pong_delay(close, beat * 0.75, fb=0.22, mix=0.14)

    close = C.polish_stem(close, hp=70, air_db=2.2)
    mid = C.polish_stem(mid, hp=32, mud_cut_db=-2.0)
    far = C.polish_stem(far, hp=28)
    perc = C.polish_stem(perc, hp=24)
    mixed = C.depth_mix(close, mid, far, perc, 1.05, 0.95, 0.8, 1.08)
    mixed = A.apply_reverb(mixed, np.random.default_rng(37), ir_s=2.0, wet=0.2, dry=1.0, pre=0.02, dark=3600)
    sections = [
        ("lights_up", 0.0, tbar(16, bpm)),
        ("verse", tbar(16, bpm), tbar(32, bpm)),
        ("pre", tbar(32, bpm), tbar(40, bpm)),
        ("drop_1", tbar(40, bpm), tbar(56, bpm)),
        ("break", tbar(56, bpm), tbar(72, bpm)),
        ("lift", tbar(72, bpm), tbar(80, bpm)),
        ("drop_2", tbar(80, bpm), tbar(96, bpm)),
        ("curtain", tbar(96, bpm), dur),
    ]
    out, loud_map = M.festive_master(mixed[: int(dur * SR)], sections, xfade_s=1.6)
    return out, sections, dict(title="Starlight Show", context="popstar", bpm=bpm, target_lufs=-9.0, section_lufs=loud_map)


# ---------------------------------------------------------------------------
# 8. Last Light — credits. D mixolydian reprise of the Glen theme, thinning out.
# ---------------------------------------------------------------------------
def render_last_light():
    bpm, bars = 64.0, 52  # 195.0 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9308)
    mode, root, root_lo = "mixolydian", 62, 50  # D, intentional Glen reprise
    n = close.shape[0]

    air_L, air_R = A.air_noise(n, rng, lo=220, hi=2000, gain=0.014)
    dL, dR = A.bagpipe_drone(n, A.midi(root_lo), gain=0.035)
    sL, sR = A.sub_drone(n, A.midi(38), gain=0.08, lfo=0.02)
    far[:n] += np.stack([air_L + dL + sL, air_R + dR + sR], 1)

    _strings_at(mid, tbar(0, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.04, 1.6, 1.6, 0.16)
    _strings_at(mid, tbar(8, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.07, 1.1, 1.2, 0.24)
    _choir_at(mid, tbar(16, bpm), tbar(12, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode),
              [520, 920, 1800], 0.08, 1800, rng, f0=90)
    _strings_at(mid, tbar(16, bpm), tbar(12, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.08, 1.0, 1.3, 0.28)
    _pad_at(far, tbar(28, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.04, 900, 0.03)  # thin air
    _strings_at(mid, tbar(36, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.06, 1.2, 1.4, 0.22)
    _choir_at(mid, tbar(37, bpm), tbar(7, bpm), chord_hz(root_lo, [1, 5, 8], mode),
              [480, 860, 1600], 0.055, 1500, rng, f0=84)
    _strings_at(mid, tbar(44, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.03, 1.6, 1.8, 0.14)

    # Harp: exposed, then almost only harmonics
    A.harp_arpeggio(close, tbar(0, bpm), chord_hz(root, [1, 3, 5, 8], mode),
                    32, bpm, vel=0.26, pattern=[0, 2, 1, 2], bright=0.4)
    A.harp_arpeggio(close, tbar(8, bpm), chord_hz(root, [1, 3, 5, 8], mode),
                    32, bpm, vel=0.3, pattern=[0, 2, 1, 3, 2, 1], bright=0.45)
    A.harp_arpeggio(close, tbar(16, bpm), chord_hz(root, [1, 3, 5, 8, 9], mode),
                    48, bpm, vel=0.28, pattern=[0, 2, 3, 1, 3, 2], bright=0.42)
    A.harp_arpeggio(close, tbar(28, bpm), chord_hz(root, [1, 5], mode),
                    32, bpm, vel=0.14, pattern=[0, 1], bright=0.3)
    A.harp_arpeggio(close, tbar(36, bpm), chord_hz(root, [1, 3, 5, 8], mode),
                    32, bpm, vel=0.26, pattern=[0, 2, 1, 2], bright=0.4)
    # fade_home: three isolated harmonics
    for b, deg in ((44, 8), (47, 5), (50, 1)):
        L, R = A.harp_pluck(hz(root, deg, mode), 4.0, vel=0.22, bright=0.28)
        E.add_stereo(close, tbar(b, bpm), L, R)

    # Glen theme, stated plainly, then inverted as a "names" roll, then far away
    put_theme(close, tbar(1, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.55, pan=-0.12)
    put_theme(close, tbar(8, bpm), root, mode, bpm, A.tin_whistle, "b", vel=0.52, pan=-0.1)
    A.add_phrase(close, tbar(16, bpm), *inv_theme(), root, mode, A.tin_whistle, bpm, vel=0.42, pan=-0.16)
    A.add_phrase(close, tbar(22, bpm), *retro_theme(), root, mode, A.fiddle_note, bpm, vel=0.36, pan=0.22)
    # thin air: a fragment only
    A.add_phrase(close, tbar(30, bpm), [5, 6, 5], [4, 4, 8], root, mode, A.tin_whistle, bpm, vel=0.28, low=True, pan=-0.18)
    put_theme(close, tbar(36, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.48, pan=-0.14)
    A.add_phrase(close, tbar(44, bpm), [8, 5, 1], [3, 4, 12], root, mode, A.tin_whistle, bpm, vel=0.3, pan=-0.1)

    hL, hR = C.horn_swell(hz(root_lo, 5, mode), 4.0, vel=0.22, bright=0.28)
    E.add_stereo(mid, tbar(14.5, bpm), hL, hR)

    # Almost no percussion — a few ceremonial steps under "names" and the reprise
    for b, v in ((16.0, 0.16), (20.0, 0.14), (36.0, 0.14), (40.0, 0.12)):
        E.add_mono(perc, tbar(b, bpm), A.bodhran(rng, dur=0.36, tight=True, vel=v), gain=1.0)

    _shape(far,   [0, tbar(8, bpm), tbar(16, bpm), tbar(28, bpm), tbar(36, bpm), tbar(44, bpm), dur],
                  [0.6, 0.8, 1.05, 0.4, 0.85, 0.55, 0.35])
    _shape(mid,   [0, tbar(8, bpm), tbar(16, bpm), tbar(28, bpm), tbar(36, bpm), tbar(44, bpm), dur],
                  [0.35, 0.7, 1.1, 0.25, 0.8, 0.45, 0.25])
    _shape(close, [0, tbar(8, bpm), tbar(16, bpm), tbar(28, bpm), tbar(36, bpm), tbar(44, bpm), dur],
                  [0.7, 0.9, 1.0, 0.35, 0.85, 0.5, 0.3])

    close = C.polish_stem(close, hp=55, air_db=1.6)
    mid = C.polish_stem(mid, hp=28)
    far = C.polish_stem(far, hp=22)
    perc = C.polish_stem(perc, hp=22)
    mixed = C.depth_mix(close, mid, far, perc, 1.05, 0.92, 0.9, 0.45)
    mixed = A.apply_reverb(mixed, np.random.default_rng(38), ir_s=3.8, wet=0.36, dry=0.92, pre=0.04, dark=2200)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=3.4, target_lufs=-15.5, split=115)
    sections = [
        ("last_look", 0.0, tbar(8, bpm)),
        ("walk_back", tbar(8, bpm), tbar(16, bpm)),
        ("names", tbar(16, bpm), tbar(28, bpm)),
        ("thin_air", tbar(28, bpm), tbar(36, bpm)),
        ("reprise", tbar(36, bpm), tbar(44, bpm)),
        ("fade_home", tbar(44, bpm), dur),
    ]
    return out, sections, dict(title="Last Light", context="credits", bpm=bpm, target_lufs=-15.5)


TRACKS = {
    "below_the_map": render_below_the_map,
    "open_sketch": render_open_sketch,
    "inner_sun": render_inner_sun,
    "pine_shelter": render_pine_shelter,
    "owl_hour": render_owl_hour,
    "claymore": render_claymore,
    "starlight_show": render_starlight_show,
    "last_light": render_last_light,
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
    (AN / "batch3-render.json").write_text(json.dumps(manifest, indent=2))
    print("done", names)


if __name__ == "__main__":
    main()
