#!/usr/bin/env python3
"""Render batch 2 of the Glencraft Original Soundtrack.

Eight through-composed, fallback-filling pieces. Same art bar as batch 1:
motif development, contrasting sections, no tiled 4-8 bar loops. Techniques
from award-level dance and film-hybrid production applied only to original
writing. Recorded instruments are only from the CC0 / MIT libraries in
LICENSES.md, layered with the original synths. Purple Chamber is beatless
ethereal liminal ambient. No piano-led writing. No copyrighted melodies
or lyrics.
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

# Reuse batch-1 helpers (spb, buses, Glen-theme placement, bells).
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


def _bubbles(n, rng, gain=0.025):
    L = np.zeros(n)
    t = 0.2
    while t < n / SR - 0.15:
        dur = 0.05 + rng.random() * 0.14
        nn = int(dur * SR)
        lo = 350 + rng.random() * 900
        hi = lo + 800 + rng.random() * 1800
        sig = E.sos_bp(rng.standard_normal(nn), lo, hi) * np.hanning(nn)
        i = int(t * SR)
        sl = slice(i, min(n, i + nn))
        L[sl] += sig[: sl.stop - sl.start] * gain * (0.4 + 0.7 * rng.random())
        t += 0.18 + rng.random() * 0.85
    R = np.roll(L, int(0.016 * SR))
    return L, R


# ---------------------------------------------------------------------------
# 1. Drove Road — overworld day (brisker companion to Heather Road)
# ---------------------------------------------------------------------------
def render_drove_road():
    bpm, bars = 88.0, 66  # 180.0 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9101)
    mode, root, root_lo = "mixolydian", 69, 57  # A
    alt_mode, alt_root = "dorian", 66  # F# dorian moor gap
    n = close.shape[0]

    air_L, air_R = A.air_noise(n, rng, lo=250, hi=2200, gain=0.018)
    dL, dR = A.bagpipe_drone(n, A.midi(root_lo), gain=0.05)
    far[:n] += np.stack([air_L + dL, air_R + dR], 1)

    # Sectional strings — not a bed for the whole walk
    _strings_at(mid, tbar(8, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.055, 0.9, 1.0, 0.25)
    _strings_at(mid, tbar(16, bpm), tbar(8, bpm), chord_hz(root_lo, [5, 8, 10], mode, octave=0), 0.07, 0.7, 0.9, 0.32)
    _strings_at(mid, tbar(24, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 4, 7, 10], mode), 0.1, 0.6, 0.8, 0.4)
    _strings_at(mid, tbar(32, bpm), tbar(8, bpm), chord_hz(root, [1, 3, 5, 8], mode, octave=-1), 0.13, 0.45, 0.7, 0.5)
    _strings_at(mid, tbar(40, bpm), tbar(8, bpm), chord_hz(alt_root, [1, 5, 8], alt_mode, octave=-1), 0.04, 1.2, 1.4, 0.15)
    _strings_at(mid, tbar(48, bpm), tbar(10, bpm), chord_hz(root_lo, [1, 5, 8, 10], mode), 0.1, 0.7, 1.0, 0.38)
    _strings_at(mid, tbar(58, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.05, 1.0, 1.4, 0.2)

    # Harp: a walking figure that changes grouping each section
    def harp_walk(bar0, bar1, root_, mode_, vel, pattern, bright=0.5):
        chord = chord_hz(root_, [1, 3, 5, 8], mode_)
        beat = spb(bpm)
        t = tbar(bar0, bpm)
        end = tbar(bar1, bpm)
        i = 0
        while t < end - 0.03:
            hz_ = chord[pattern[i % len(pattern)] % len(chord)]
            L, R = A.harp_pluck(hz_, beat * 1.6, vel=vel * (0.85 + 0.15 * (i % 4 == 0)), bright=bright)
            E.add_stereo(close, t, L, R)
            t += beat * (0.5 if (i % 8) < 6 else 1.0)
            i += 1

    harp_walk(0, 8, root, mode, 0.28, [0, 2, 1, 2], 0.4)
    harp_walk(8, 16, root, mode, 0.34, [0, 2, 1, 3, 2, 1], 0.48)
    harp_walk(16, 24, root, mode, 0.32, [0, 1, 3, 2, 3, 1], 0.5)
    harp_walk(24, 32, root, mode, 0.38, [0, 3, 1, 3, 2, 0], 0.55)
    harp_walk(32, 40, root, mode, 0.42, [0, 2, 3, 1, 3, 2], 0.58)
    harp_walk(40, 48, alt_root, alt_mode, 0.22, [0, 2, 0, 1], 0.35)
    harp_walk(48, 58, root, mode, 0.36, [0, 2, 1, 3, 1, 2], 0.5)
    harp_walk(58, 66, root, mode, 0.24, [0, 2, 1], 0.4)

    # Folk leads — Glen theme, then inversion, then a new climbing figure
    put_theme(close, tbar(8, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.7, pan=-0.12)
    put_theme(close, tbar(12, bpm), root, mode, bpm, A.tin_whistle, "b", vel=0.68, pan=-0.1)
    A.add_phrase(close, tbar(16, bpm), *inv_theme(), root, mode, A.fiddle_note, bpm, vel=0.52, pan=0.28)
    A.add_phrase(close, tbar(20, bpm), [5, 6, 8, 9, 11], [2, 2, 2, 2, 8], root, mode, A.tin_whistle, bpm, vel=0.58, pan=-0.15)
    A.add_phrase(close, tbar(24, bpm), [5, 7, 8, 9, 8, 6], [1, 1, 2, 2, 2, 8], root, mode, A.fiddle_note, bpm, vel=0.55, pan=0.25)
    put_theme(close, tbar(28, bpm), root + 12, mode, bpm, A.tin_whistle, "a", vel=0.74, pan=-0.1)
    put_theme(close, tbar(32, bpm), root + 12, mode, bpm, A.tin_whistle, "b", vel=0.76, pan=-0.08)
    A.add_phrase(close, tbar(36, bpm), [8, 9, 11, 12, 11, 9, 8], [1, 1, 1, 2, 1, 1, 9], root, mode, A.fiddle_note, bpm, vel=0.58, pan=0.3)
    # moor gap: fragments in F# dorian, low whistle
    A.add_phrase(close, tbar(41, bpm), [5, 6, 5], [3, 3, 6], alt_root, alt_mode, A.tin_whistle, bpm, vel=0.36, low=True, pan=-0.18)
    A.add_phrase(close, tbar(44.5, bpm), [8, 6, 5], [3, 3, 6], alt_root, alt_mode, A.tin_whistle, bpm, vel=0.34, low=True, pan=0.12)
    put_theme(close, tbar(48, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.7, pan=-0.12)
    A.add_phrase(close, tbar(52, bpm), A.GLEN_DEGREES, A.GLEN_DUR, root, mode, A.fiddle_note, bpm, vel=0.56, pan=0.26)
    put_theme(close, tbar(56, bpm), root + 12, mode, bpm, A.tin_whistle, "b", vel=0.68, pan=-0.1)
    A.add_phrase(close, tbar(60, bpm), [8, 5, 1], [2, 3, 9], root, mode, A.tin_whistle, bpm, vel=0.42, pan=-0.1)

    # Folk-electronic plucks on the climb / crest only (original figures)
    for b0, degs in ((24, [1, 5, 8, 5]), (26, [3, 6, 8, 6]), (28, [1, 5, 9, 8]),
                     (32, [1, 5, 8, 10, 8, 5]), (34, [3, 5, 8, 9, 8, 5]), (36, [1, 4, 8, 10, 8, 4])):
        for i, d in enumerate(degs):
            L, R = C.avicii_pluck(hz(root_lo, d, mode), spb(bpm) * 1.3, vel=0.38, bright=0.65)
            pan = (-0.2, 0.2)[i % 2]
            gL = (0.5 * (1 - pan)) ** 0.5
            gR = (0.5 * (1 + pan)) ** 0.5
            E.add_stereo(mid, tbar(b0, bpm) + i * 0.5 * spb(bpm), L * gL / 0.7071, R * gR / 0.7071, gain=0.7)

    # Funk bass under climb and crest, written (not a loop)
    bass_line = [
        (24.00, 1, 4.0, False, None), (25.00, 5, 2.0, False, None), (25.50, 5, 2.0, True, None),
        (26.00, 4, 4.0, False, None), (27.00, 1, 2.0, False, 4), (27.50, 1, 2.0, True, None),
        (28.00, 1, 2.0, False, None), (28.50, 3, 2.0, False, None), (29.00, 5, 4.0, False, None),
        (32.00, 1, 2.0, False, None), (32.50, 1, 1.0, True, None), (32.75, 5, 1.0, False, None),
        (33.00, 5, 2.0, False, None), (33.50, 8, 2.0, False, 5),
        (34.00, 4, 2.0, False, None), (34.50, 4, 2.0, True, None), (35.00, 1, 4.0, False, None),
        (36.00, 1, 8.0, False, None),
        (48.00, 1, 4.0, False, None), (49.00, 5, 4.0, False, None), (50.00, 4, 4.0, False, None),
        (51.00, 1, 4.0, False, None), (52.00, 1, 8.0, False, None),
    ]
    for b0, deg, beats, dead, sdeg in bass_line:
        freq = hz(root_lo - 12, deg, mode) if root_lo >= 57 else hz(root_lo, deg, mode)
        # keep bass around A2
        freq = hz(45, deg, mode)
        sl = hz(45, sdeg, mode) if sdeg else None
        sig = C.funk_bass(freq, beats * spb(bpm), vel=0.58 if not dead else 0.28, dead=dead, slide_from=sl)
        E.add_mono(mid, tbar(b0, bpm), sig, gain=1.0, pan=0.0)

    hL, hR = C.horn_swell(hz(root_lo, 5, mode), 3.4, vel=0.3, bright=0.4)
    E.add_stereo(mid, tbar(31.2, bpm), hL, hR)
    hL, hR = C.horn_swell(hz(root_lo, 1, mode), 3.6, vel=0.28, bright=0.35)
    E.add_stereo(mid, tbar(50.5, bpm), hL, hR)

    # Bodhran-led ceremonial groove — written, denser than Heather, not 4-on-the-floor
    hits = []
    def hit_at(bar, kind, vel, pan=0.0):
        t = tbar(bar, bpm)
        if kind == "bodhran":
            sig = A.bodhran(rng, dur=0.28, tight=(vel < 0.45), vel=vel)
            E.add_mono(perc, C.humanize(t, rng, 0.005), sig, gain=1.0, pan=pan)
        elif kind == "kick":
            sig = C.cinematic_kick(rng, vel=vel, hard=False)
            E.add_mono(perc, C.humanize(t, rng, 0.003), sig, gain=1.0, pan=pan)
        elif kind == "ghost":
            sig = C.ghost_stick(rng, vel=vel)
            E.add_mono(perc, C.humanize(t, rng, 0.007), sig, gain=1.0, pan=pan)
        elif kind == "snare":
            sig = C.layered_snare(rng, vel=vel, tight=True)
            E.add_mono(perc, C.humanize(t, rng, 0.004), sig, gain=1.0, pan=pan)
        elif kind == "hat":
            sig = C.hat(rng, vel=vel, open_hat=False)
            E.add_mono(perc, C.humanize(t, rng, 0.003), sig, gain=1.0, pan=pan)
        hits.append(t)

    # intro: footsteps only
    for b in (0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0):
        hit_at(b, "bodhran", 0.28 + 0.04 * (b % 2 == 0), 0.05 * ((b % 4) - 1.5))
        if b % 2 == 1:
            hit_at(b + 0.5, "ghost", 0.12, -0.2)
    # road_step: add off-beat hats
    for b in range(8, 16):
        hit_at(float(b), "bodhran", 0.4 if b % 2 == 0 else 0.32, 0.0)
        hit_at(b + 0.5, "hat", 0.16, 0.22)
        if b % 4 == 3:
            hit_at(b + 0.75, "ghost", 0.18, -0.15)
    # fiddle_call
    for b in range(16, 24):
        hit_at(float(b), "bodhran", 0.44 if b % 2 == 0 else 0.34)
        hit_at(b + 0.5, "hat", 0.18, -0.18 if b % 2 else 0.18)
        if b % 4 == 1:
            hit_at(b + 0.75, "snare", 0.22, 0.1)
    # climb + crest: denser, written variations each two bars
    for b, k, v, p in [
        (24.00, "bodhran", 0.5, 0.0), (24.50, "hat", 0.2, 0.2), (25.00, "kick", 0.32, 0.0),
        (25.50, "ghost", 0.16, -0.25), (26.00, "bodhran", 0.48, 0.0), (26.75, "snare", 0.26, 0.12),
        (27.00, "bodhran", 0.4, 0.0), (27.50, "hat", 0.18, -0.2),
        (28.00, "bodhran", 0.55, 0.0), (28.50, "ghost", 0.18, 0.25), (29.00, "kick", 0.3, 0.0),
        (29.75, "snare", 0.28, 0.1),
        (32.00, "kick", 0.55, 0.0), (32.00, "bodhran", 0.5, 0.0), (32.50, "hat", 0.22, 0.2),
        (33.00, "bodhran", 0.42, 0.0), (33.50, "ghost", 0.16, -0.2), (33.75, "snare", 0.3, 0.12),
        (34.00, "kick", 0.5, 0.0), (34.50, "hat", 0.2, -0.15), (35.00, "bodhran", 0.48, 0.0),
        (35.50, "ghost", 0.18, 0.2), (36.00, "kick", 0.58, 0.0), (36.50, "bodhran", 0.4, 0.0),
        (37.00, "hat", 0.2, 0.18), (37.50, "snare", 0.32, 0.08),
        (38.00, "bodhran", 0.45, 0.0), (39.00, "bodhran", 0.35, 0.0),
        # moor gap: almost drop out
        (42.00, "bodhran", 0.22, 0.0), (45.00, "bodhran", 0.2, 0.0),
        # home stride
        (48.00, "bodhran", 0.48, 0.0), (48.50, "hat", 0.18, 0.2), (49.00, "bodhran", 0.38, 0.0),
        (49.75, "ghost", 0.16, -0.2), (50.00, "kick", 0.36, 0.0), (50.50, "hat", 0.16, -0.15),
        (51.00, "bodhran", 0.4, 0.0), (51.50, "snare", 0.24, 0.1),
        (52.00, "bodhran", 0.5, 0.0), (53.00, "bodhran", 0.36, 0.0), (54.00, "kick", 0.34, 0.0),
        (55.00, "bodhran", 0.4, 0.0), (56.00, "bodhran", 0.46, 0.0), (57.00, "bodhran", 0.32, 0.0),
        (58.00, "bodhran", 0.3, 0.0), (60.00, "bodhran", 0.24, 0.0), (63.00, "bodhran", 0.2, 0.0),
    ]:
        hit_at(b, k, v, p)

    rL, rR = C.riser(rng, tbar(2.5, bpm), start_hz=200, end_hz=7500, vel=0.34)
    E.add_stereo(far, tbar(29.5, bpm), rL, rR)
    iL, iR = C.impact(rng, dur=2.0, vel=0.48)
    E.add_stereo(perc, tbar(32, bpm), iL, iR)
    dwn = C.downlifter(rng, dur=1.3, vel=0.26)
    E.add_mono(far, tbar(40, bpm), dwn, gain=1.0)

    mid[:, :] = C.apply_sidechain(mid, [h for h in hits if tbar(32, bpm) <= h < tbar(40, bpm)], depth=0.36, rel=0.18)
    far[:, :] = C.apply_sidechain(far, [h for h in hits if tbar(32, bpm) <= h < tbar(40, bpm)], depth=0.2, rel=0.22)

    # Filter journey: brighter at the crest, darker in the moor gap
    mid[:, :] = C.lp_tv(mid, C.sweep_cutoff(len(mid), 1600, 4200, curve=0.6, hold_start=tbar(24, bpm) / dur,
                                            hold_end=1.0 - tbar(40, bpm) / dur), Q=0.8)

    close = C.polish_stem(close, hp=55, air_db=1.6)
    mid = C.polish_stem(mid, hp=32, mud_cut_db=-1.4)
    far = C.polish_stem(far, hp=28)
    perc = C.polish_stem(perc, hp=26)
    mixed = C.depth_mix(close, mid, far, perc, 1.0, 0.9, 0.78, 0.88)
    mixed = A.apply_reverb(mixed, np.random.default_rng(91), ir_s=2.6, wet=0.24, dry=1.0, pre=0.03, dark=2800)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=2.0, target_lufs=-14.0, split=125)
    sections = [
        ("intro", 0.0, tbar(8, bpm)),
        ("road_step", tbar(8, bpm), tbar(16, bpm)),
        ("fiddle_call", tbar(16, bpm), tbar(24, bpm)),
        ("climb", tbar(24, bpm), tbar(32, bpm)),
        ("crest", tbar(32, bpm), tbar(40, bpm)),
        ("moor_gap", tbar(40, bpm), tbar(48, bpm)),
        ("home_stride", tbar(48, bpm), dur),
    ]
    return out, sections, dict(title="Drove Road", context="day", bpm=bpm, target_lufs=-14.0)


# ---------------------------------------------------------------------------
# 2. Peat Fire — overworld night (warmer, closer than Watcher on the Ridge)
# ---------------------------------------------------------------------------
def render_peat_fire():
    bpm, bars = 58.0, 46  # ~189.7 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9102)
    mode, root, root_lo = "dorian", 55, 43  # G dorian
    n = close.shape[0]

    sL, sR = A.sub_drone(n, A.midi(31), gain=0.16, lfo=0.025)  # G1
    air_L, air_R = A.air_noise(n, rng, lo=120, hi=900, gain=0.016)
    # warm crackle (embers, not volcanic)
    crack = E.sos_bp(rng.standard_normal(n), 800, 4500) * 0.016
    crack *= 0.55 + 0.45 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.06 * np.arange(n) / SR))
    far[:n] += np.stack([sL + air_L + crack, sR + air_R + np.roll(crack, 280)], 1)

    _pad_at(far, tbar(0, bpm), tbar(10, bpm), chord_hz(root_lo, [1, 5], mode), 0.04, 1100, 0.03)
    _strings_at(mid, tbar(8, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.05, 1.3, 1.4, 0.18)
    _strings_at(mid, tbar(16, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.075, 1.0, 1.2, 0.25)
    _strings_at(mid, tbar(24, bpm), tbar(8, bpm), chord_hz(root_lo, [4, 6, 8, 11], mode), 0.1, 0.9, 1.1, 0.32)
    _strings_at(mid, tbar(32, bpm), tbar(6, bpm), chord_hz(root_lo, [1, 5], mode), 0.035, 1.4, 1.6, 0.12)
    _strings_at(mid, tbar(38, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.06, 1.2, 1.5, 0.2)

    # Close harp, slower than day pieces
    A.harp_arpeggio(close, tbar(2, bpm), chord_hz(root, [1, 3, 5, 8], mode, octave=-1), 12, bpm, vel=0.26, bright=0.35)
    A.harp_arpeggio(close, tbar(16, bpm), chord_hz(root, [1, 3, 5, 8], mode, octave=-1), 16, bpm, vel=0.32, bright=0.4)
    A.harp_arpeggio(close, tbar(24, bpm), chord_hz(root, [3, 5, 7, 10], mode, octave=-1), 14, bpm, vel=0.34, bright=0.45)
    A.harp_arpeggio(close, tbar(38, bpm), chord_hz(root, [1, 5, 8], mode, octave=-1), 14, bpm, vel=0.24, bright=0.32)

    A.add_phrase(close, tbar(8, bpm), [5, 6, 5], [3, 3, 6], root, mode, A.tin_whistle, bpm, vel=0.34, low=True, pan=-0.2)
    A.add_phrase(close, tbar(12, bpm), [8, 6, 5], [3, 3, 6], root, mode, A.tin_whistle, bpm, vel=0.32, low=True, pan=0.1)
    put_theme(close, tbar(16, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.52, pan=-0.12, low=True)
    A.add_phrase(close, tbar(20, bpm), [8, 9, 8, 6, 5], [2, 2, 2, 2, 8], root, mode, A.tin_whistle, bpm, vel=0.48, low=True, pan=-0.1)
    put_theme(close, tbar(24, bpm), root, mode, bpm, A.fiddle_note, "a", vel=0.4, pan=0.22)
    A.add_phrase(close, tbar(28, bpm), *inv_theme(), root, mode, A.tin_whistle, bpm, vel=0.46, low=True, pan=-0.14)
    # flicker: two long tones
    A.add_phrase(close, tbar(33, bpm), [5], [10], root, mode, A.tin_whistle, bpm, vel=0.28, low=True, pan=-0.18)
    A.add_phrase(close, tbar(35.5, bpm), [8], [8], root, mode, A.tin_whistle, bpm, vel=0.24, low=True, pan=0.14)
    put_theme(close, tbar(38, bpm), root, mode, bpm, A.tin_whistle, "b", vel=0.4, pan=-0.1, low=True)
    A.add_phrase(close, tbar(42, bpm), [8, 5, 1], [3, 3, 8], root, mode, A.tin_whistle, bpm, vel=0.3, low=True)

    hL, hR = C.horn_swell(hz(root_lo, 5, mode), 5.5, vel=0.26, bright=0.22)
    E.add_stereo(mid, tbar(24.5, bpm), hL, hR)

    # Very sparse skin hits — a hearth pulse, not a groove
    for b, v in ((8.0, 0.22), (12.0, 0.2), (16.0, 0.28), (20.0, 0.24),
                 (24.0, 0.3), (26.0, 0.22), (28.0, 0.26), (38.0, 0.22), (42.0, 0.18)):
        sig = A.bodhran(rng, dur=0.34, tight=False, vel=v)
        E.add_mono(perc, C.humanize(tbar(b, bpm), rng, 0.01), sig, gain=1.0, pan=0.0)

    close = C.polish_stem(close, hp=50, air_db=0.8)
    mid = C.polish_stem(mid, hp=28)
    far = C.polish_stem(far, hp=22)
    perc = C.polish_stem(perc, hp=30)
    mixed = C.depth_mix(close, mid, far, perc, 0.95, 0.95, 1.0, 0.7)
    mixed = A.apply_reverb(mixed, np.random.default_rng(92), ir_s=4.2, wet=0.4, dry=0.9, pre=0.05, dark=1800)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=3.2, target_lufs=-16.0, split=110)
    sections = [
        ("glow", 0.0, tbar(8, bpm)),
        ("low_air", tbar(8, bpm), tbar(16, bpm)),
        ("hearth", tbar(16, bpm), tbar(24, bpm)),
        ("ember_swell", tbar(24, bpm), tbar(32, bpm)),
        ("flicker", tbar(32, bpm), tbar(38, bpm)),
        ("banked", tbar(38, bpm), dur),
    ]
    return out, sections, dict(title="Peat Fire", context="night", bpm=bpm, target_lufs=-16.0)


# ---------------------------------------------------------------------------
# 3. Purple Chamber — purple crystal cave, beatless liminal ambient
# ---------------------------------------------------------------------------
def render_purple_chamber():
    dur = 220.0
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9103)
    n = close.shape[0]
    # Darker than Blue Vault: G# / D# minor world (no pulse)
    gs1, ds2, gs2, b2, cs3, ds3, e3, fs3, gs3, b3, cs4, ds4, e4, fs4, gs4 = (
        A.midi(32), A.midi(39), A.midi(44), A.midi(47), A.midi(49), A.midi(51),
        A.midi(52), A.midi(54), A.midi(56), A.midi(59), A.midi(61), A.midi(63),
        A.midi(64), A.midi(66), A.midi(68)
    )
    sL, sR = A.sub_drone(n, gs1 / 2, gain=0.2, lfo=0.016)
    air_L, air_R = A.air_noise(n, rng, lo=140, hi=1400, gain=0.02)
    far[:n] += np.stack([sL + air_L, sR + air_R], 1)

    # Distinct choir rooms: darker vowels, later entry, a thin rift, then a sink
    areas = [
        (24, 28, [gs2, ds3], [400, 720, 1300], 0.07, 1000, 72),
        (50, 32, [gs2, b2, ds3, gs3], [460, 820, 1500], 0.12, 1500, 80),
        (86, 28, [b2, e3, gs3, b3], [520, 960, 1800], 0.13, 2000, 88),
        (118, 26, [ds3, gs3], [360, 620, 1100], 0.04, 800, 64),  # thin rift
        (150, 30, [fs3, b3, cs4, e4], [580, 1100, 2000], 0.1, 1700, 84),
        (186, 34, [gs2, ds3, gs3], [380, 700, 1200], 0.085, 1200, 70),
    ]
    for t0, length, freqs, form, gain, lp, f0 in areas:
        _choir_at(mid, t0, length, freqs, form, gain, lp, rng, f0=f0)

    # Glassy bells: enter later than Blue Vault, develop, go quiet in the rift, retrograde
    ev = [
        (54, gs4, 5.0, 0.42), (64, b3, 4.5, 0.36), (74, ds4, 5.0, 0.4),
        (90, e4, 4.0, 0.45), (96, gs4, 3.5, 0.4), (102, b3, 4.0, 0.34), (110, ds4, 4.5, 0.38),
        # rift: two distant bells only
        (126, ds3, 7.0, 0.22), (138, gs3, 7.0, 0.2),
        # retrograde of the 90–110 figure
        (154, ds4, 4.0, 0.34), (162, b3, 4.0, 0.32), (170, gs4, 4.5, 0.3), (178, e4, 5.0, 0.28),
        (192, gs3, 6.0, 0.26), (204, ds3, 7.0, 0.22), (214, gs2, 6.0, 0.18),
    ]
    _bells(close, ev, rng, vel_scale=0.5)

    t = np.arange(len(mid)) / SR
    mid_g = np.interp(t, [0, 24, 50, 86, 118, 148, 186, 220],
                      [0.2, 0.5, 0.95, 1.15, 0.3, 0.9, 0.7, 0.5])
    far_g = np.interp(t, [0, 24, 86, 118, 150, 220], [0.75, 0.9, 1.05, 0.5, 0.85, 0.7])
    mid *= mid_g[:, None]
    far *= far_g[:, None]
    close *= np.interp(t[:len(close)], [0, 50, 86, 118, 150, 220], [0.4, 0.85, 1.15, 0.35, 0.8, 0.55])[:, None]

    mid[:, :] = C.lp_tv(mid, C.sweep_cutoff(len(mid), 900, 2200, curve=0.65, hold_end=0.3), Q=0.82)
    close = C.polish_stem(close, hp=70, air_db=2.0)
    mid = C.polish_stem(mid, hp=26)
    far = C.polish_stem(far, hp=18)
    mixed = C.depth_mix(close, mid, far, None, 1.0, 1.0, 1.05)
    mixed = A.apply_reverb(mixed, np.random.default_rng(93), ir_s=7.5, wet=0.66, dry=0.72, pre=0.09, dark=1700)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=4.2, target_lufs=-16.0, split=95)
    sections = [
        ("veil", 0.0, 48.0),
        ("choir_low", 48.0, 84.0),
        ("violet_bells", 84.0, 118.0),
        ("thin_rift", 118.0, 150.0),
        ("retrograde", 150.0, 186.0),
        ("sink", 186.0, dur),
    ]
    return out, sections, dict(title="Purple Chamber", context="purple", bpm=0, target_lufs=-16.0)


# ---------------------------------------------------------------------------
# 4. White Pass — snow, hushed and icy
# ---------------------------------------------------------------------------
def render_white_pass():
    bpm, bars = 50.0, 40  # 192.0 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9104)
    mode, root, root_lo = "aeolian", 66, 54  # F#
    sun_mode, sun_root = "lydian", 61  # C# lydian brief warmth
    n = close.shape[0]

    # Little low end — ice and air
    air_L, air_R = A.air_noise(n, rng, lo=500, hi=3200, gain=0.022)
    far[:n] += np.stack([air_L, air_R], 1)
    sL, sR = A.sub_drone(int(tbar(14, bpm) * SR), A.midi(42), gain=0.07, lfo=0.02)  # F#1, mid-piece only
    E.add_stereo(far, tbar(16, bpm), sL, sR)

    _pad_at(far, tbar(0, bpm), tbar(10, bpm), [A.midi(66), A.midi(73)], 0.03, 2000, 0.05)
    _strings_at(mid, tbar(8, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.04, 1.6, 1.6, 0.12)
    _strings_at(mid, tbar(16, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.065, 1.3, 1.4, 0.2)
    _choir_at(mid, tbar(24, bpm), tbar(7, bpm),
              chord_hz(sun_root, [1, 3, 5, 8], sun_mode, octave=-1),
              (620, 1180, 2100), 0.08, 2400, rng, f0=110)
    _strings_at(mid, tbar(24, bpm), tbar(6, bpm), chord_hz(sun_root, [1, 5, 8], sun_mode, octave=-1), 0.07, 1.0, 1.2, 0.35)
    _pad_at(far, tbar(30, bpm), tbar(6, bpm), [A.midi(54), A.midi(66)], 0.025, 1400, 0.04)
    _strings_at(mid, tbar(36, bpm), tbar(4, bpm), chord_hz(root_lo, [1, 5], mode), 0.035, 1.5, 1.6, 0.1)

    # Sparse icy harp (high, short rings)
    for bar, deg, vel in (
        (2, 8, 0.28), (4.5, 10, 0.24), (7, 12, 0.26),
        (9, 5, 0.3), (11, 8, 0.28), (13.5, 10, 0.26),
        (17, 8, 0.32), (19, 9, 0.3), (21, 12, 0.34), (23, 10, 0.28),
        (25, 8, 0.3), (26.5, 11, 0.32), (28, 12, 0.28),
        (36, 8, 0.24), (38, 5, 0.22),
    ):
        L, R = A.harp_pluck(hz(root, deg, mode), 2.4, vel=vel, bright=0.7)
        E.add_stereo(close, tbar(bar, bpm), L, R)
    # sun-on-snow harp in C# lydian
    for bar, deg, vel in ((24.5, 5, 0.3), (26, 8, 0.28), (27.5, 9, 0.26)):
        L, R = A.harp_pluck(hz(sun_root, deg, sun_mode), 2.2, vel=vel, bright=0.65)
        E.add_stereo(close, tbar(bar, bpm), L, R)

    ev = [
        (tbar(5, bpm), hz(root, 12, mode), 5.0, 0.28),
        (tbar(14, bpm), hz(root, 10, mode), 5.5, 0.24),
        (tbar(25, bpm), hz(sun_root, 8, sun_mode), 4.0, 0.3),
        (tbar(31.5, bpm), hz(root, 8, mode), 6.0, 0.2),
        (tbar(37, bpm), hz(root, 5, mode), 6.0, 0.18),
    ]
    _bells(close, ev, rng, vel_scale=0.55)

    A.add_phrase(close, tbar(8, bpm), [8, 10], [5, 7], root, mode, A.tin_whistle, bpm, vel=0.28, pan=-0.15)
    A.add_phrase(close, tbar(12, bpm), [5, 8], [5, 7], root, mode, A.tin_whistle, bpm, vel=0.26, pan=0.12)
    put_theme(close, tbar(16, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.42, pan=-0.1)
    A.add_phrase(close, tbar(20, bpm), [8, 9, 8, 5], [2, 2, 3, 7], root, mode, A.tin_whistle, bpm, vel=0.38, pan=-0.08)
    A.add_phrase(close, tbar(25, bpm), [5, 6, 8], [3, 3, 6], sun_root, sun_mode, A.tin_whistle, bpm, vel=0.34, pan=0.1)
    # wind gap: no lead
    A.add_phrase(close, tbar(36, bpm), [8, 5, 1], [3, 3, 8], root, mode, A.tin_whistle, bpm, vel=0.28, pan=-0.12)

    close = C.polish_stem(close, hp=90, air_db=3.0)
    mid = C.polish_stem(mid, hp=40)
    far = C.polish_stem(far, hp=35)
    mixed = C.depth_mix(close, mid, far, None, 1.05, 0.85, 1.05)
    mixed = A.apply_reverb(mixed, np.random.default_rng(94), ir_s=5.5, wet=0.5, dry=0.82, pre=0.07, dark=2600)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=3.6, target_lufs=-16.0, split=130)
    sections = [
        ("ice_air", 0.0, tbar(8, bpm)),
        ("first_step", tbar(8, bpm), tbar(16, bpm)),
        ("theme_frost", tbar(16, bpm), tbar(24, bpm)),
        ("white_swell", tbar(24, bpm), tbar(30, bpm)),
        ("wind_gap", tbar(30, bpm), tbar(36, bpm)),
        ("last_ridge", tbar(36, bpm), dur),
    ]
    return out, sections, dict(title="White Pass", context="snow", bpm=bpm, target_lufs=-16.0)


# ---------------------------------------------------------------------------
# 5. Long Sand — desert, dry and open
# ---------------------------------------------------------------------------
def render_long_sand():
    bpm, bars = 70.0, 54  # ~185.1 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9105)
    mode, root, root_lo = "dorian", 65, 53  # F dorian
    mir_mode, mir_root = "lydian", 60  # C lydian mirage
    n = close.shape[0]

    air_L, air_R = A.air_noise(n, rng, lo=400, hi=2600, gain=0.02)
    far[:n] += np.stack([air_L, air_R], 1)
    # dry, not lush — short string gestures, no long bed
    _strings_at(mid, tbar(8, bpm), tbar(7, bpm), chord_hz(root_lo, [1, 5], mode), 0.04, 0.8, 0.9, 0.22)
    _strings_at(mid, tbar(16, bpm), tbar(7, bpm), chord_hz(root_lo, [1, 4, 8], mode), 0.05, 0.7, 0.8, 0.28)
    _strings_at(mid, tbar(24, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode), 0.07, 0.6, 0.8, 0.35)
    _strings_at(mid, tbar(32, bpm), tbar(8, bpm), chord_hz(mir_root, [1, 5, 8], mir_mode, octave=-1), 0.045, 1.1, 1.2, 0.4)
    _strings_at(mid, tbar(40, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.05, 0.8, 1.0, 0.22)
    _strings_at(mid, tbar(48, bpm), tbar(6, bpm), chord_hz(root_lo, [1, 5], mode), 0.03, 1.0, 1.2, 0.15)

    # Guitar-like harp: brighter, more picked, patterns change by section
    def pick_ost(bar0, bar1, root_, mode_, vel, step_beats, pattern, bright):
        chord = chord_hz(root_, [1, 3, 5, 8, 10], mode_)
        beat = spb(bpm)
        t = tbar(bar0, bpm)
        end = tbar(bar1, bpm)
        i = 0
        while t < end - 0.03:
            f = chord[pattern[i % len(pattern)] % len(chord)]
            L, R = A.harp_pluck(f, beat * 1.5, vel=vel * (0.8 + 0.2 * (i % 5 == 0)), bright=bright)
            E.add_stereo(close, t, L, R)
            t += step_beats * beat
            i += 1

    pick_ost(0, 8, root, mode, 0.3, 0.75, [0, 2, 1, 2], 0.62)
    pick_ost(8, 16, root, mode, 0.36, 0.5, [0, 2, 4, 2, 3, 1], 0.68)
    pick_ost(16, 24, root, mode, 0.34, 0.5, [0, 3, 1, 4, 2, 3], 0.7)
    pick_ost(24, 32, root, mode, 0.4, 0.5, [0, 2, 4, 3, 1, 4, 2], 0.75)
    pick_ost(32, 40, mir_root, mir_mode, 0.26, 1.0, [0, 2, 1, 3], 0.55)
    pick_ost(40, 48, root, mode, 0.34, 0.5, [0, 2, 1, 3, 2, 1], 0.65)
    pick_ost(48, 54, root, mode, 0.24, 1.0, [0, 2, 1], 0.55)

    # Thin whistle — dry, not lush vibrato rooms
    A.add_phrase(close, tbar(8, bpm), [5, 6, 8], [3, 3, 6], root, mode, A.tin_whistle, bpm, vel=0.44, pan=-0.12)
    put_theme(close, tbar(16, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.62, pan=-0.1)
    A.add_phrase(close, tbar(20, bpm), [8, 9, 11, 9, 8], [2, 2, 2, 2, 8], root, mode, A.tin_whistle, bpm, vel=0.58, pan=-0.08)
    put_theme(close, tbar(24, bpm), root, mode, bpm, A.tin_whistle, "b", vel=0.66, pan=-0.1)
    # folk plucks under noon (original, not a copied hook)
    for i, d in enumerate([1, 5, 8, 10, 8, 5, 3, 5]):
        L, R = C.avicii_pluck(hz(root, d, mode), spb(bpm) * 1.4, vel=0.34, bright=0.72)
        pan = (i % 2) * 0.3 - 0.15
        gL = (0.5 * (1 - pan)) ** 0.5
        gR = (0.5 * (1 + pan)) ** 0.5
        E.add_stereo(mid, tbar(24, bpm) + i * 0.5 * spb(bpm), L * gL / 0.7071, R * gR / 0.7071, gain=0.65)
    A.add_phrase(close, tbar(28, bpm), [5, 8, 9, 8, 6, 5], [1, 1, 2, 2, 2, 8], root, mode, A.tin_whistle, bpm, vel=0.6)
    # mirage: lydian fragments
    A.add_phrase(close, tbar(33, bpm), [5, 7, 8, 7, 5], [2, 2, 3, 2, 7], mir_root, mir_mode, A.tin_whistle, bpm, vel=0.38, pan=0.12)
    put_theme(close, tbar(40, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.58, pan=-0.1)
    A.add_phrase(close, tbar(44, bpm), *inv_theme(), root, mode, A.tin_whistle, bpm, vel=0.48, pan=-0.08)
    A.add_phrase(close, tbar(48, bpm), [8, 5, 1], [3, 3, 8], root, mode, A.tin_whistle, bpm, vel=0.36)

    # Foot-on-sand: very dry, irregular, not a drum kit
    for b, v in (
        (8.0, 0.2), (10.0, 0.18), (12.0, 0.22), (14.5, 0.16),
        (16.0, 0.24), (18.0, 0.2), (20.0, 0.22), (22.5, 0.18),
        (24.0, 0.26), (25.0, 0.2), (26.5, 0.22), (28.0, 0.24), (30.0, 0.2),
        (40.0, 0.22), (42.0, 0.18), (44.0, 0.2), (48.0, 0.16),
    ):
        sig = A.bodhran(rng, dur=0.22, tight=True, vel=v)
        E.add_mono(perc, C.humanize(tbar(b, bpm), rng, 0.012), E.sos_lp(sig, 900) if hasattr(E, 'sos_lp') else sig, gain=0.8, pan=rng.uniform(-0.2, 0.2))

    close = C.polish_stem(close, hp=70, air_db=2.0)
    mid = C.polish_stem(mid, hp=40, mud_cut_db=-2.0)
    far = C.polish_stem(far, hp=35)
    perc = C.polish_stem(perc, hp=50)
    mixed = C.depth_mix(close, mid, far, perc, 1.05, 0.8, 0.85, 0.55)
    # drier room than the glen
    mixed = A.apply_reverb(mixed, np.random.default_rng(95), ir_s=2.2, wet=0.16, dry=1.0, pre=0.02, dark=3200)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=2.4, target_lufs=-15.0, split=135)
    sections = [
        ("heat_haze", 0.0, tbar(8, bpm)),
        ("track", tbar(8, bpm), tbar(16, bpm)),
        ("open_mile", tbar(16, bpm), tbar(24, bpm)),
        ("noon", tbar(24, bpm), tbar(32, bpm)),
        ("mirage", tbar(32, bpm), tbar(40, bpm)),
        ("long_return", tbar(40, bpm), dur),
    ]
    return out, sections, dict(title="Long Sand", context="desert", bpm=bpm, target_lufs=-15.0)


# ---------------------------------------------------------------------------
# 6. Red Horizon — Mars, dry rust winds, beatless
# ---------------------------------------------------------------------------
def render_red_horizon():
    dur = 200.0
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9106)
    n = close.shape[0]
    # Bb aeolian / rust: drier and lower than Silver Sea's A lydian
    bb1, f2, bb2, db3, eb3, f3, gb3, ab3, bb3, c4, db4, eb4, f4 = (
        A.midi(34), A.midi(41), A.midi(46), A.midi(49), A.midi(51), A.midi(53),
        A.midi(54), A.midi(56), A.midi(58), A.midi(60), A.midi(61), A.midi(63),
        A.midi(65)
    )
    air_L, air_R = A.air_noise(n, rng, lo=180, hi=1600, gain=0.028)
    # dust: mid-band wind, not sparkle
    dust = E.sos_bp(rng.standard_normal(n), 200, 900) * 0.02
    dust *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.04 * np.arange(n) / SR)
    far[:n] += np.stack([air_L + dust, air_R + np.roll(dust, 400)], 1)

    # Sectional pads (no 3-minute bed)
    _pad_at(far, 0.0, 40, [bb2, f3], 0.035, 1200, 0.03)
    _strings_at(mid, 36, 40, [bb2, db3, f3], 0.055, 2.0, 2.0, 0.12)
    _pad_at(far, 36, 42, [f2, bb2, f3], 0.04, 1100, 0.025)
    _strings_at(mid, 80, 44, [eb3, gb3, bb3, db4], 0.075, 1.8, 1.8, 0.22)
    sL, sR = A.sub_drone(int(46 * SR), A.midi(34), gain=0.1, lfo=0.02)
    E.add_stereo(far, 80.0, sL, sR)
    hL, hR = C.horn_swell(f3, 9.0, vel=0.2, bright=0.15)
    E.add_stereo(mid, 92.0, hL, hR)
    _strings_at(mid, 128, 40, [bb2, f3, bb3], 0.04, 2.2, 2.2, 0.08)
    _pad_at(far, 130, 50, [bb2, f3], 0.028, 1000, 0.03)

    # Darker, mid bells — not icy glass; fewer, rustier
    ev = [
        (12, f3, 6.0, 0.22), (28, bb3, 5.5, 0.2),
        (48, db4, 5.0, 0.28), (62, ab3, 5.0, 0.24), (74, f3, 5.5, 0.22),
        (88, bb3, 4.0, 0.32), (98, eb4, 4.0, 0.3), (108, db4, 4.5, 0.26), (118, f4, 4.0, 0.24),
        (140, bb3, 6.0, 0.2), (156, f3, 7.0, 0.18), (174, db4, 6.0, 0.16), (190, bb2, 7.0, 0.14),
    ]
    _bells(close, ev, rng, vel_scale=0.4)

    # A dry, slow whistle figure in the warmer mid (original, not the full theme)
    A.add_phrase(close, 96.0, [5, 6, 8, 6, 4, 5], [3, 2, 3, 2, 3, 6], 58, "aeolian", A.tin_whistle, 42,
                 vel=0.3, low=True, pan=0.08)
    A.add_phrase(close, 112.0, [8, 5, 3], [3, 3, 7], 58, "aeolian", A.tin_whistle, 42,
                 vel=0.26, low=True, pan=-0.1)

    close = C.polish_stem(close, hp=80, air_db=1.2)
    mid = C.polish_stem(mid, hp=35, mud_cut_db=-1.0)
    far = C.polish_stem(far, hp=28)
    mixed = C.depth_mix(close, mid, far, None, 0.9, 0.95, 1.1)
    mixed = A.apply_reverb(mixed, np.random.default_rng(96), ir_s=6.0, wet=0.48, dry=0.82, pre=0.1, dark=1500)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=4.0, target_lufs=-16.0, split=115)
    sections = [
        ("dust", 0.0, 36.0),
        ("ridge", 36.0, 80.0),
        ("rust_light", 80.0, 128.0),
        ("dusk", 128.0, dur),
    ]
    return out, sections, dict(title="Red Horizon", context="mars", bpm=0, target_lufs=-16.0)


# ---------------------------------------------------------------------------
# 7. Between Worlds — deep space, almost empty
# ---------------------------------------------------------------------------
def render_between_worlds():
    dur = 200.0
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9107)
    n = close.shape[0]
    # Open fifths on B, a distant C as "wrong" colour in the signal section
    b1, fs2, b2, fs3, b3, cs4, e4, fs4, c4 = (
        A.midi(35), A.midi(42), A.midi(47), A.midi(54), A.midi(59),
        A.midi(61), A.midi(64), A.midi(66), A.midi(60)
    )
    air_L, air_R = A.air_noise(n, rng, lo=600, hi=3400, gain=0.016)
    far[:n] += np.stack([air_L, air_R], 1)
    # Almost no low end in "black"; a hint of sub only during "signal"
    sL, sR = A.sub_drone(int(44 * SR), A.midi(23), gain=0.06, lfo=0.012)
    E.add_stereo(far, 96.0, sL, sR)

    # Long tones, sectional, huge contrast
    _pad_at(far, 48.0, 44, [b2, fs3], 0.03, 1600, 0.02)
    _strings_at(mid, 52.0, 36, [b2, fs3], 0.035, 3.0, 3.0, 0.08)
    _strings_at(mid, 96.0, 40, [fs3, b3, fs4], 0.06, 2.2, 2.4, 0.2)
    _choir_at(mid, 104.0, 28, [b2, fs3, b3], (500, 900, 1700), 0.055, 1800, rng, f0=70)
    _pad_at(far, 148.0, 44, [b2, fs3], 0.018, 1300, 0.02)
    _strings_at(mid, 152.0, 28, [b2, fs3], 0.025, 2.8, 3.0, 0.06)

    ev = [
        (8, fs4, 7.0, 0.22), (28, e4, 7.0, 0.18),
        (60, b3, 6.0, 0.24), (78, fs4, 6.0, 0.2),
        # signal: closer, including the "wrong" C
        (100, fs4, 4.5, 0.32), (108, c4, 5.0, 0.28), (116, b3, 4.5, 0.26), (126, e4, 5.0, 0.24),
        (156, fs3, 8.0, 0.16), (176, b3, 8.0, 0.14), (192, fs4, 7.0, 0.12),
    ]
    _bells(close, ev, rng, vel_scale=0.45)

    # Isolated Glen-degree pitches, huge gaps, very slow
    A.add_phrase(close, 108.0, [5, 8, 5], [4, 5, 8], 59, "aeolian", A.tin_whistle, 36,
                 vel=0.22, pan=0.08)
    A.add_phrase(close, 128.0, [8, 5], [5, 8], 59, "aeolian", A.tin_whistle, 36,
                 vel=0.18, pan=-0.1)

    t = np.arange(len(mid)) / SR
    mid *= np.interp(t, [0, 48, 90, 96, 140, 200], [0.15, 0.55, 0.5, 1.15, 0.35, 0.25])[:, None]
    far *= np.interp(t, [0, 48, 96, 140, 200], [0.55, 0.7, 1.0, 0.55, 0.5])[:, None]
    close *= np.interp(t[:len(close)], [0, 48, 96, 140, 200], [0.4, 0.6, 1.1, 0.45, 0.35])[:, None]

    close = C.polish_stem(close, hp=140, air_db=3.2)
    mid = C.polish_stem(mid, hp=50)
    far = C.polish_stem(far, hp=45)
    mixed = C.depth_mix(close, mid, far, None, 1.0, 0.75, 1.15)
    mixed = A.apply_reverb(mixed, np.random.default_rng(97), ir_s=8.0, wet=0.62, dry=0.78, pre=0.16, dark=2800)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=4.5, target_lufs=-16.0, split=150)
    sections = [
        ("black", 0.0, 48.0),
        ("tone", 48.0, 96.0),
        ("signal", 96.0, 144.0),
        ("fade_out", 144.0, dur),
    ]
    return out, sections, dict(title="Between Worlds", context="space", bpm=0, target_lufs=-16.0)


# ---------------------------------------------------------------------------
# 8. Down Among the Reeds — underwater, muffled harp and slow choir
# ---------------------------------------------------------------------------
def render_down_among_the_reeds():
    bpm, bars = 52.0, 40  # ~184.6 s
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(9108)
    mode, root, root_lo = "dorian", 60, 48  # C dorian
    n = close.shape[0]

    sL, sR = A.sub_drone(n, A.midi(36), gain=0.14, lfo=0.02)  # C2
    air_L, air_R = A.air_noise(n, rng, lo=80, hi=600, gain=0.02)
    bL, bR = _bubbles(n, rng, gain=0.03)
    far[:n] += np.stack([sL + air_L + bL, sR + air_R + bR], 1)

    _pad_at(far, tbar(0, bpm), tbar(10, bpm), chord_hz(root_lo, [1, 5], mode), 0.045, 900, 0.03)
    _choir_at(mid, tbar(8, bpm), tbar(9, bpm), chord_hz(root_lo, [1, 5, 8], mode),
              (420, 760, 1300), 0.07, 1100, rng, f0=82)
    _strings_at(mid, tbar(8, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode), 0.045, 1.6, 1.6, 0.12)
    _choir_at(mid, tbar(16, bpm), tbar(9, bpm), chord_hz(root_lo, [1, 3, 5, 8], mode),
              (480, 880, 1500), 0.1, 1400, rng, f0=86)
    # open_water: brighter vowels, slightly more air
    _choir_at(mid, tbar(24, bpm), tbar(9, bpm), chord_hz(root_lo, [3, 5, 8, 10], mode),
              (580, 1100, 1900), 0.12, 2000, rng, f0=96)
    _strings_at(mid, tbar(24, bpm), tbar(8, bpm), chord_hz(root, [1, 5, 8], mode, octave=-1), 0.07, 1.2, 1.3, 0.28)
    _choir_at(mid, tbar(32, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5, 8], mode),
              (400, 700, 1200), 0.08, 1000, rng, f0=78)
    _pad_at(far, tbar(32, bpm), tbar(8, bpm), chord_hz(root_lo, [1, 5], mode), 0.04, 800, 0.025)

    # Muffled harp — slower, darker than Still Water
    A.harp_arpeggio(close, tbar(2, bpm), chord_hz(root, [1, 3, 5, 8], mode, octave=-1), 12, bpm, vel=0.3, bright=0.28)
    A.harp_arpeggio(close, tbar(8, bpm), chord_hz(root, [1, 3, 5, 8], mode, octave=-1), 16, bpm, vel=0.34, bright=0.3)
    A.harp_arpeggio(close, tbar(16, bpm), chord_hz(root, [1, 4, 5, 8], mode, octave=-1), 16, bpm, vel=0.32, bright=0.28)
    A.harp_arpeggio(close, tbar(24, bpm), chord_hz(root, [3, 5, 8, 10], mode, octave=-1), 16, bpm, vel=0.36, bright=0.4)
    A.harp_arpeggio(close, tbar(32, bpm), chord_hz(root, [1, 5, 8], mode, octave=-1), 16, bpm, vel=0.26, bright=0.22)

    A.add_phrase(close, tbar(8, bpm), [5, 6, 5], [4, 3, 7], root, mode, A.tin_whistle, bpm, vel=0.28, low=True, pan=-0.1)
    A.add_phrase(close, tbar(16, bpm), [5, 8, 6, 5], [3, 3, 3, 7], root, mode, A.tin_whistle, bpm, vel=0.32, low=True, pan=-0.12)
    put_theme(close, tbar(24, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.46, pan=-0.08, low=True)
    A.add_phrase(close, tbar(28, bpm), [8, 9, 8, 5], [2, 2, 3, 9], root, mode, A.tin_whistle, bpm, vel=0.4, low=True)
    A.add_phrase(close, tbar(34, bpm), [8, 5, 1], [3, 4, 9], root, mode, A.tin_whistle, bpm, vel=0.28, low=True)

    # Filter journey: muffled → slightly open mid-piece → close again
    # hold_start/end are 0-1 fractions of the buffer
    tot = len(mid)
    mid[:, :] = C.lp_tv(mid, C.sweep_cutoff(tot, 700, 2400, curve=0.7,
                                            hold_start=tbar(16, bpm) / dur,
                                            hold_end=1.0 - tbar(32, bpm) / dur), Q=0.75)
    close[:, :] = C.lp_tv(close, C.sweep_cutoff(len(close), 900, 2800, curve=0.7,
                                                hold_start=tbar(16, bpm) / dur,
                                                hold_end=1.0 - tbar(32, bpm) / dur), Q=0.75)

    close = C.polish_stem(close, hp=40, air_db=-0.5)
    mid = C.polish_stem(mid, hp=24)
    far = C.polish_stem(far, hp=20)
    mixed = C.depth_mix(close, mid, far, None, 0.9, 1.05, 1.1)
    mixed = A.apply_reverb(mixed, np.random.default_rng(98), ir_s=5.0, wet=0.55, dry=0.78, pre=0.08, dark=1400)
    # extra underwater muff on the whole master bed (gentle)
    mixed = np.stack([C.lp_tv(mixed[:, 0], 2200, Q=0.7), C.lp_tv(mixed[:, 1], 2200, Q=0.7)], 1)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=3.4, target_lufs=-16.0, split=100)
    sections = [
        ("surface_memory", 0.0, tbar(8, bpm)),
        ("among_reeds", tbar(8, bpm), tbar(16, bpm)),
        ("current", tbar(16, bpm), tbar(24, bpm)),
        ("open_water", tbar(24, bpm), tbar(32, bpm)),
        ("depth", tbar(32, bpm), dur),
    ]
    return out, sections, dict(title="Down Among the Reeds", context="underwater", bpm=bpm, target_lufs=-16.0)


TRACKS = {
    "drove_road": render_drove_road,
    "peat_fire": render_peat_fire,
    "purple_chamber": render_purple_chamber,
    "white_pass": render_white_pass,
    "long_sand": render_long_sand,
    "red_horizon": render_red_horizon,
    "between_worlds": render_between_worlds,
    "down_among_the_reeds": render_down_among_the_reeds,
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
    (AN / "batch2-render.json").write_text(json.dumps(manifest, indent=2))
    print("done", names)


if __name__ == "__main__":
    main()
