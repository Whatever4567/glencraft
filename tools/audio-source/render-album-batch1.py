#!/usr/bin/env python3
"""Render batch 1 of the Glencraft Original Soundtrack.

Eight through-composed pieces. Techniques from award-level dance and
film-hybrid production (filter journeys, side-chain, vocoder formants,
funk bass articulation, folk plucks, cinematic builds and impacts,
layered custom drums, mix depth) applied only to original writing.
No copyrighted melodies or lyrics. Recorded instruments are only from
the CC0 / MIT libraries in LICENSES.md, layered with the original synths.
No tiled 4-8 bar loops.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import engine1260 as E
import album_lib as A
import album_cinema as C

SR = E.SR
QA = Path("/workspace/qa/album")
WAV = QA / "wav"
PREV = QA / "previews"
SPEC = QA / "spectrograms"
AN = QA / "analysis"
MUSIC = Path("/workspace/gc-album/music/album")


def spb(bpm):
    return 60.0 / bpm


def tbar(bar, bpm, bpb=4):
    return bar * bpb * 60.0 / bpm


def make_bus(seconds, pad=4.0):
    return np.zeros((int((seconds + pad) * SR) + 1, 2), dtype=np.float64)


def put_theme(bus, t0, root, mode, bpm, instr, which="a", vel=0.7, **kw):
    deg, dur = (A.GLEN_DEGREES, A.GLEN_DUR) if which == "a" else (A.GLEN_ANSWER, A.GLEN_ANSWER_DUR)
    return A.add_phrase(bus, t0, deg, dur, root, mode, instr, bpm, vel=vel, **kw)


def inv_theme():
    # inversion around degree 5
    return [5, 4, 2, 1, 2, 4, 5, 6, 5], [1, 1, 1, 1.5, 0.5, 1, 1, 1, 2]


def retro_theme():
    return list(reversed(A.GLEN_DEGREES)), list(reversed(A.GLEN_DUR))


def hz(root, deg, mode="mixolydian"):
    return A.degree_to_hz(root, deg, mode)


def chord_hz(root, degs, mode, octave=0):
    return [hz(root + 12 * octave, d, mode) for d in degs]


# ---------------------------------------------------------------------------
# 1. The Glen Opens — title / menu
# ---------------------------------------------------------------------------
def render_the_glen_opens():
    bpm, bars, name = 72.0, 48, "the_glen_opens"
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(1107)
    mode, root, root_lo = "mixolydian", 62, 50  # D4 / D3
    ir_rng = np.random.default_rng(11)

    # Atmosphere: drone + air for the whole piece, filter opens then re-closes
    n = close.shape[0]
    drone_L, drone_R = A.bagpipe_drone(n, A.midi(root_lo), gain=0.055)
    air_L, air_R = A.air_noise(n, rng, lo=250, hi=1600, gain=0.022)
    pad_freqs_d = chord_hz(root_lo, [1, 5, 8, 10], mode)
    pL, pR = A.soft_pad(n, pad_freqs_d, gain=0.085, lp=1400, lfo=0.04)
    amb = np.stack([drone_L + air_L + pL, drone_R + air_R + pR], 1)
    cut = C.sweep_cutoff(n, 700, 8200, curve=0.8, hold_start=0.02, hold_end=0.18)
    # close again in the last 12 bars toward a loopable dusk
    cut2 = C.sweep_cutoff(n, 8200, 900, curve=1.2)
    # blend: open over first 30 bars, hold, close last 10
    t = np.arange(n) / SR
    close_from = tbar(38, bpm)
    alpha = np.clip((t - close_from) / (tbar(10, bpm)), 0, 1)
    cutoff = cut * (1 - alpha) + cut2 * alpha
    amb = C.lp_tv(amb, cutoff, Q=0.75)
    far[:len(amb)] += amb

    # Section strings (unique voicings, not one pad held unchanged)
    def add_strings(bar0, bar1, degs, gain, bright=0.3, attack=1.0):
        t0, t1 = tbar(bar0, bpm), tbar(bar1, bpm)
        nn = int((t1 - t0 + 1.2) * SR)
        L, R = C.string_ensemble(nn, chord_hz(root_lo, degs, mode), gain=gain, attack=attack, release=1.0, bright=bright)
        E.add_stereo(mid, t0, L, R)

    add_strings(4, 8, [1, 5, 8], 0.05, 0.2, 2.0)
    add_strings(8, 12, [1, 5, 8, 9], 0.07, 0.25, 0.8)
    add_strings(12, 16, [4, 6, 8, 11], 0.08, 0.3, 0.7)          # G colour
    add_strings(16, 20, [6, 8, 10, 13], 0.09, 0.28, 0.6)        # Bm
    add_strings(20, 24, [2, 5, 7, 9], 0.09, 0.33, 0.6)          # C–A colour (2,7 = E,C#)
    add_strings(24, 30, [1, 4, 5, 8], 0.11, 0.4, 0.5)
    add_strings(30, 38, [4, 6, 8, 11, 13], 0.13, 0.48, 0.4)     # lift, brighter, wider voicing
    add_strings(38, 42, [6, 8, 10], 0.06, 0.15, 0.8)
    add_strings(42, 48, [1, 5, 8], 0.07, 0.22, 1.2)

    # Harp: unique figures per section (not a tiled ostinato)
    # Intro: sparse pickups and harmonics
    intro_notes = [
        (0.5, 5, 2.0, 0.28), (2.0, 8, 1.5, 0.22), (5.0, 9, 2.0, 0.3),
        (7.5, 6, 1.2, 0.2), (10.0, 8, 1.8, 0.26), (13.0, 5, 2.5, 0.32),
        (17.0, 4, 1.4, 0.22), (20.5, 8, 2.0, 0.28), (24.0, 9, 1.0, 0.18),
        (27.0, 12, 2.2, 0.3),
    ]
    for beat, deg, d, vel in intro_notes:
        L, R = A.harp_pluck(hz(root, deg, mode), d * spb(bpm) * 2, vel=vel, bright=0.35)
        E.add_stereo(close, beat * spb(bpm), L, R, gain=1.0)

    # Statement harp: changing shape every two bars
    def harp_figure(bar0, beats, pattern, chord, vel=0.3, bright=0.5, step=0.5):
        t0 = tbar(bar0, bpm)
        for i, idx in enumerate(pattern):
            if tbar(0, bpm) + i * step * spb(bpm) >= tbar(beats, bpm):
                break
            note = chord[idx % len(chord)]
            L, R = A.harp_pluck(note, spb(bpm) * 1.8, vel=vel * (0.85 + 0.15 * (i % 3 == 0)), bright=bright)
            E.add_stereo(close, t0 + i * step * spb(bpm), L, R)

    harp_figure(8, 8, [0, 2, 1, 0, 3, 1, 2, 0], chord_hz(root, [1, 3, 5, 8], mode), 0.32, 0.5, 0.5)
    harp_figure(10, 8, [0, 1, 3, 2, 3, 1, 0, 2, 4, 2], chord_hz(root, [1, 3, 5, 8, 9], mode), 0.3, 0.55, 0.5)
    harp_figure(12, 8, [2, 0, 1, 3, 1, 0, 4, 3, 2, 0], chord_hz(root, [4, 6, 8, 11, 13], mode), 0.33, 0.55, 0.5)
    harp_figure(14, 8, [0, 3, 1, 4, 2, 0, 1, 3], chord_hz(root, [1, 5, 8, 9, 10], mode), 0.3, 0.48, 0.5)
    # later sections get electronic plucks mixed with harp (folk-meets-electronic)
    def pluck_figure(bar0, nsteps, pattern, chord, vel=0.28, step=0.5):
        t0 = tbar(bar0, bpm)
        for i, idx in enumerate(pattern[:nsteps]):
            L, R = C.avicii_pluck(chord[idx % len(chord)], spb(bpm) * 1.4, vel=vel * (0.75 + 0.25 * ((i % 4) == 0)), bright=0.72)
            E.add_stereo(close, t0 + i * step * spb(bpm), L, R)

    pluck_figure(24, 16, [0, 2, 3, 1, 0, 3, 2, 4, 1, 0, 3, 2, 4, 2, 1, 0], chord_hz(root, [1, 4, 5, 8, 9], mode), 0.24)
    pluck_figure(30, 32, [0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 1, 0, 5, 4, 2,
                          0, 3, 1, 4, 2, 5, 3, 1, 0, 2, 4, 1, 3, 0, 2, 5],
                 chord_hz(root, [4, 6, 8, 11, 13, 15], mode), 0.3, 0.5)
    pluck_figure(42, 16, [0, 2, 1, 0, 3, 1, 2, 0, 4, 2, 1, 3, 0, 2, 1, 0], chord_hz(root, [1, 3, 5, 8, 10], mode), 0.22)

    # Leads
    put_theme(close, tbar(8, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.72, pan=-0.15)
    put_theme(close, tbar(12, bpm), root, mode, bpm, A.tin_whistle, "b", vel=0.7, pan=-0.1)
    # fiddle answer — inverted theme, lower
    inv, invd = inv_theme()
    A.add_phrase(close, tbar(16, bpm), inv, invd, 59, "aeolian", A.fiddle_note, bpm, vel=0.58, pan=0.25)
    # whistle long-tone counter (not the same rhythm)
    A.add_phrase(close, tbar(16.5, bpm), [8, 9, 8, 6, 5], [3, 2, 3, 3, 5], root, mode, A.tin_whistle, bpm, vel=0.38, pan=-0.2)
    # second fiddle phrase, sequenced up, original continuation (not a copy of the first)
    A.add_phrase(close, tbar(20, bpm), [5, 6, 8, 10, 9, 8, 6, 5, 4], [1, 1, 1, 1.5, 0.5, 1, 1, 1, 2],
                 59, "aeolian", A.fiddle_note, bpm, vel=0.6, pan=0.28)

    # Build fragments, rising (bars 24-30)
    A.add_phrase(close, tbar(24, bpm), [5, 6, 8], [2, 2, 4], root, mode, A.tin_whistle, bpm, vel=0.55)
    A.add_phrase(close, tbar(26, bpm), [6, 8, 9], [2, 2, 4], root, mode, A.tin_whistle, bpm, vel=0.6)
    A.add_phrase(close, tbar(28, bpm), [8, 9, 11, 12], [1, 1, 2, 4], root, mode, A.tin_whistle, bpm, vel=0.68)

    # Lift: theme in a higher octave + fiddle counter in a different rhythm
    put_theme(close, tbar(30, bpm), root + 12, mode, bpm, A.tin_whistle, "a", vel=0.74, pan=-0.12)
    A.add_phrase(close, tbar(30, bpm), [1, 3, 5, 6, 5, 4, 3, 1], [2, 2, 2, 2, 2, 2, 2, 2],
                 root, mode, A.fiddle_note, bpm, vel=0.5, pan=0.3)
    put_theme(close, tbar(34, bpm), root + 12, mode, bpm, A.tin_whistle, "b", vel=0.74, pan=-0.08)
    A.add_phrase(close, tbar(34, bpm), [5, 4, 3, 5, 6, 8, 6, 5], [2, 1, 1, 2, 2, 2, 2, 4],
                 root, mode, A.fiddle_note, bpm, vel=0.52, pan=0.28)

    # Vocoder hook on the lift: original Glen theme as formant vocal, not a sampled singer
    def voc_hook(bar0, root_m, length_beats, f0=180):
        t0 = tbar(bar0, bpm)
        nn = int(length_beats * spb(bpm) * SR)
        # carrier: supersaw-ish stack of the phrase pitches, retriggered
        car = np.zeros(nn)
        # build carrier from a held chord
        freqs = chord_hz(root_m, [1, 3, 5, 8], mode)
        t = np.arange(nn) / SR
        for f in freqs:
            car += E.blep_saw(nn, f, phase0=f * 0.01)
        car /= max(1, len(freqs))
        path = [(0.0, (700, 1200, 2500)), (0.35, (500, 1600, 2600)), (0.7, (800, 1400, 2800)), (1.0, (600, 1100, 2400))]
        mod = C.vowel_modulator(nn, path, f0=f0)
        vL, vR = C.vocoder_stereo(car, np.roll(car, 80), mod, bands=16)
        # also play the theme as a lead-shaped vocoder at the phrase notes
        E.add_stereo(mid, t0, C.fade_edges(vL * 0.22, 0.05, 0.08), C.fade_edges(vR * 0.22, 0.05, 0.08))

    voc_hook(30, root, 16, f0=196)
    # horn swell into the lift
    hL, hR = C.horn_swell(hz(root_lo, 5, mode), 3.2, vel=0.32, bright=0.45)
    E.add_stereo(mid, tbar(28.5, bpm), hL, hR)

    # Break: inverted theme, low whistle, almost dry
    inv, invd = inv_theme()
    A.add_phrase(close, tbar(38, bpm), inv, [2, 2, 2, 2, 2, 2, 2, 1, 1], root - 12, "aeolian",
                 A.tin_whistle, bpm, vel=0.48, pan=-0.15, low=True)
    # Recap canon: whistle, fiddle two beats later, then thin
    put_theme(close, tbar(42, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.62, pan=-0.12)
    A.add_phrase(close, tbar(42, bpm) + 2 * spb(bpm), A.GLEN_DEGREES, A.GLEN_DUR,
                 root, mode, A.fiddle_note, bpm, vel=0.42, pan=0.3)
    # coda tail: three falling notes into the drone
    A.add_phrase(close, tbar(46, bpm), [8, 5, 1], [2, 2, 4], root, mode, A.tin_whistle, bpm, vel=0.4)

    # Bass: enters at the build, written line (not a tiled riff)
    bass_ev = [
        # build 24-30
        (24, 1, 3, False, None), (24.75, 1, 0.25, True, None), (25, 5, 1.5, False, None), (26.5, 4, 1.5, False, None),
        (28, 1, 1, False, None), (29, 5, 0.5, False, None), (29.5, 7, 0.5, False, None),
        # lift 30-38 — moving, unique bars
        (30, 4, 1.5, False, None), (31.5, 6, 0.5, False, None), (32, 1, 1, False, None), (33, 5, 1, False, None),
        (34, 6, 1, False, None), (35, 4, 0.5, False, None), (35.5, 5, 0.5, False, None),
        (36, 1, 1.5, False, None), (37.5, 5, 0.5, False, hz(root_lo, 4, mode)),
        # recap 42-46
        (42, 1, 2, False, None), (44, 4, 2, False, None), (46, 1, 2, False, None),
    ]
    for bar, deg, durs, dead, sl in bass_ev:
        t = tbar(bar, bpm) if bar >= 8 else bar * spb(bpm)
        # bar here is in bar units already for integers >= 24; wait, 24 means bar 24, 24.75 is bar 24 + 0.75 beats? I used mixed units. Fix:
        # I'll interpret numbers >= 16 as bars (float bars), not beats.
        sig = C.funk_bass(hz(root_lo, deg, mode), durs * 4 * spb(bpm) if durs >= 1 and bar >= 24 else durs * spb(bpm),
                          vel=0.55 if not dead else 0.35, dead=dead, slide_from=sl)
        # The duration logic is messy. Use bar as fractional bars, durs as beats.
    # redo bass cleanly below (clear the mistaken block by writing a clean one only)

    # Clear any accidental bass? We didn't add yet in the loop if I skip E.add — I'll just write a clean pass.
    # (the loop above computed sig but I did not add — good, I stopped before add.)

    bass_line = [
        # (time in bars, degree, duration in beats, dead, slide_deg or None)
        (24.00, 1, 3.0, False, None), (24.75, 1, 0.25, True, None),
        (25.00, 5, 4.0, False, None),
        (26.50, 4, 4.0, False, None),
        (28.00, 1, 4.0, False, None),
        (29.00, 5, 2.0, False, None), (29.50, 7, 2.0, False, None),
        (30.00, 4, 6.0, False, None), (31.50, 6, 2.0, False, None),
        (32.00, 1, 4.0, False, None), (33.00, 5, 4.0, False, None),
        (34.00, 6, 4.0, False, None), (35.00, 4, 2.0, False, None), (35.50, 5, 2.0, False, None),
        (36.00, 1, 6.0, False, None), (37.50, 5, 2.0, False, 4),
        (42.00, 1, 8.0, False, None), (44.00, 4, 8.0, False, None), (46.00, 1, 8.0, False, None),
    ]
    for b0, deg, beats, dead, sdeg in bass_line:
        freq = hz(root_lo, deg, mode)
        sl = hz(root_lo, sdeg, mode) if sdeg else None
        sig = C.funk_bass(freq, beats * spb(bpm), vel=0.62 if not dead else 0.3, dead=dead, slide_from=sl)
        E.add_mono(mid, tbar(b0, bpm), sig, gain=1.0, pan=0.0)

    # Percussion and FX — ceremonial, written, no 4-on-the-floor
    hits = []  # times for sidechain
    def hit_at(bar, kind, vel, pan=0.0):
        t = tbar(bar, bpm)
        if kind == "taiko":
            sig = C.taiko(rng, vel=vel)
            E.add_mono(perc, C.humanize(t, rng, 0.006), sig, gain=1.0, pan=pan)
        elif kind == "kick":
            sig = C.cinematic_kick(rng, vel=vel, hard=False)
            E.add_mono(perc, C.humanize(t, rng, 0.004), sig, gain=1.0, pan=pan)
        elif kind == "ghost":
            sig = C.ghost_stick(rng, vel=vel)
            E.add_mono(perc, C.humanize(t, rng, 0.008), sig, gain=1.0, pan=pan * 0.5)
        elif kind == "snare":
            sig = C.layered_snare(rng, vel=vel, tight=True)
            E.add_mono(perc, C.humanize(t, rng, 0.005), sig, gain=1.0, pan=pan)
        hits.append(t)

    # first presence
    hit_at(24.00, "taiko", 0.42)
    hit_at(26.00, "taiko", 0.48)
    hit_at(27.50, "ghost", 0.2, 0.2)
    hit_at(28.00, "taiko", 0.55)
    hit_at(29.00, "ghost", 0.18, -0.2)
    hit_at(29.50, "snare", 0.28, 0.1)
    # lift: ceremonial pattern, different each two bars
    for b, k, v, p in [
        (30.00, "taiko", 0.7, 0.0), (30.50, "ghost", 0.16, -0.3), (31.00, "kick", 0.35, 0.0),
        (31.75, "ghost", 0.2, 0.25), (32.00, "taiko", 0.62, 0.0), (32.75, "snare", 0.3, 0.15),
        (33.00, "kick", 0.32, 0.0), (33.50, "ghost", 0.18, -0.2),
        (34.00, "taiko", 0.68, 0.0), (34.50, "ghost", 0.15, 0.3), (35.25, "ghost", 0.2, -0.15),
        (36.00, "taiko", 0.72, 0.0), (36.50, "kick", 0.3, 0.0), (37.00, "ghost", 0.16, 0.2),
        (37.50, "snare", 0.34, 0.1),
        (42.00, "taiko", 0.4, 0.0),
    ]:
        hit_at(b, k, v, p)

    rL, rR = C.riser(rng, tbar(3, bpm), start_hz=180, end_hz=8000, vel=0.38)
    E.add_stereo(far, tbar(27, bpm), rL, rR)
    iL, iR = C.impact(rng, dur=2.4, vel=0.55)
    E.add_stereo(perc, tbar(30, bpm), iL, iR)
    dwn = C.downlifter(rng, dur=1.4, vel=0.28)
    E.add_mono(far, tbar(38, bpm), dwn, gain=1.0)

    # sidechain pads (musical, not slammed) to ceremonial hits
    mid[:, :] = C.apply_sidechain(mid, [h for h in hits if h >= tbar(30, bpm) and h < tbar(38, bpm)], depth=0.38, rel=0.2)
    far[:, :] = C.apply_sidechain(far, [h for h in hits if h >= tbar(30, bpm) and h < tbar(38, bpm)], depth=0.22, rel=0.24)

    close = C.polish_stem(close, hp=60, air_db=1.5)
    mid = C.polish_stem(mid, hp=35, mud_cut_db=-1.5)
    far = C.polish_stem(far, hp=30)
    perc = C.polish_stem(perc, hp=28)
    mixed = C.depth_mix(close, mid, far, perc, close_g=1.0, mid_g=0.9, far_g=0.8, perc_g=0.85)
    mixed = A.apply_reverb(mixed, ir_rng, ir_s=3.0, wet=0.28, dry=1.0, pre=0.035, dark=2600)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=2.2, target_lufs=-14.5, split=125)
    sections = [
        ("intro", 0.0, tbar(8, bpm)),
        ("folk_statement", tbar(8, bpm), tbar(16, bpm)),
        ("fiddle_answer", tbar(16, bpm), tbar(24, bpm)),
        ("build", tbar(24, bpm), tbar(30, bpm)),
        ("lift", tbar(30, bpm), tbar(38, bpm)),
        ("break", tbar(38, bpm), tbar(42, bpm)),
        ("recap_coda", tbar(42, bpm), dur),
    ]
    return out, sections, dict(title="The Glen Opens", context="menu", bpm=bpm, target_lufs=-14.5)



# ---------------------------------------------------------------------------
# 2. Heather Road — overworld day
# ---------------------------------------------------------------------------
def render_heather_road():
    bpm, bars = 76.0, 60
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(2208)
    mode, root, root_lo = "mixolydian", 62, 50
    alt_mode, alt_root = "dorian", 64  # E dorian breakdown

    n = close.shape[0]
    # walking air + pad, filter journey (Daft-style opening, then close in the break, reopen)
    air_L, air_R = A.air_noise(n, rng, lo=300, hi=2200, gain=0.02)
    pL, pR = A.soft_pad(n, chord_hz(root_lo, [1, 5, 8], mode), gain=0.07, lp=1600, lfo=0.05)
    dL, dR = A.bagpipe_drone(n, A.midi(root_lo), gain=0.06)
    subL, subR = A.sub_drone(n, A.midi(38), gain=0.10, lfo=0.03)  # D1 warmth
    amb = np.stack([air_L + pL + dL + subL, air_R + pR + dR + subR], 1)
    t = np.arange(n) / SR
    # three-stage cutoff path
    c1 = C.sweep_cutoff(n, 420, 9000, curve=0.7)
    c2 = np.interp(t,
                   [0, tbar(24, bpm), tbar(32, bpm), tbar(40, bpm), tbar(48, bpm), tbar(56, bpm), dur + 4],
                   [0, 1, 0.15, 0.2, 1, 0.55, 0.35])
    # use c1 shape early, closed in breakdown (32-40), open for lift 2
    cutoff = 420 + (9000 - 420) * np.clip(c2, 0, 1)
    amb = C.lp_tv(amb, cutoff, Q=0.8)
    far[:len(amb)] += amb

    def add_strings(bar0, bar1, degs, gain, bright=0.3, md=mode, rt=root_lo):
        t0, t1 = tbar(bar0, bpm), tbar(bar1, bpm)
        nn = int((t1 - t0 + 1.0) * SR)
        L, R = C.string_ensemble(nn, chord_hz(rt, degs, md), gain=gain, attack=0.7, release=0.9, bright=bright)
        E.add_stereo(mid, t0, L, R)

    add_strings(0, 8, [1, 5, 8], 0.045, 0.2)
    add_strings(8, 16, [1, 3, 5, 8], 0.07, 0.3)
    add_strings(16, 24, [1, 4, 6, 8], 0.08, 0.35)
    add_strings(24, 32, [1, 3, 5, 8, 9], 0.11, 0.45)
    add_strings(32, 40, [1, 3, 5, 7], 0.06, 0.15, alt_mode, alt_root - 12)
    add_strings(40, 48, [1, 4, 5, 8], 0.1, 0.4)
    add_strings(48, 56, [1, 3, 5, 8, 10], 0.18, 0.55)
    add_strings(56, 60, [1, 5, 8], 0.06, 0.22)

    # Bodhran + layered kicks — 60 unique-ish bars from a long written vocabulary, never 2 identical in a row
    # Each pattern is a list of (beat_in_bar, kind, vel)
    vocab = [
        [(0, "bod", 0.55), (1.5, "ghost", 0.18), (2, "bod", 0.4), (3.5, "ghost", 0.14)],
        [(0, "bod", 0.58), (1, "ghost", 0.16), (2.5, "bod", 0.35), (3, "ghost", 0.12)],
        [(0, "bod", 0.5), (0.75, "ghost", 0.2), (2, "bod", 0.45), (3.25, "ghost", 0.15)],
        [(0, "bod", 0.62), (2, "bod", 0.3), (2.75, "ghost", 0.18), (3.5, "bod", 0.28)],
        [(0, "bod", 0.48), (1.75, "bod", 0.4), (3, "ghost", 0.16)],
        [(0, "kick", 0.4), (0.5, "ghost", 0.14), (2, "bod", 0.5), (3.5, "ghost", 0.16)],
        [(0, "bod", 0.6), (1.25, "ghost", 0.2), (2, "kick", 0.28), (3, "bod", 0.32)],
        [(0, "bod", 0.52), (0.5, "ghost", 0.12), (1.5, "ghost", 0.14), (2, "bod", 0.44), (3.75, "ghost", 0.18)],
        [(0, "bod", 0.65), (1, "bod", 0.25), (2.25, "ghost", 0.16), (3.5, "bod", 0.3)],
        [(0, "kick", 0.36), (1.5, "bod", 0.48), (2.75, "ghost", 0.2), (3.5, "ghost", 0.14)],
        [(0, "bod", 0.5), (2, "bod", 0.55), (3.25, "ghost", 0.17)],
        [(0, "bod", 0.58), (0.75, "ghost", 0.15), (2.5, "bod", 0.38), (3, "ghost", 0.12), (3.5, "bod", 0.22)],
    ]
    # style maps: which vocab slice, density, swing
    kick_times = []
    def drum_bar(bar, pat, swing=0.1):
        for beat, kind, vel in pat:
            t = tbar(bar, bpm) + C.swing_time(beat, swing=swing, spb=spb(bpm)) - beat * spb(bpm)
            # swing_time already returns time offset from 0 for that beat; simpler:
            t = tbar(bar, bpm) + C.swing_time(beat, swing=swing, spb=spb(bpm)) - 0
            # wait, swing_time(beat_pos) returns beat_pos*spb + delay, so:
            t = tbar(bar, bpm) + C.swing_time(beat, swing=swing, spb=spb(bpm))
            # NO - swing_time does beat_pos * spb + delay, and tbar(bar)+that would be correct if beat_pos is beat in bar.
            # C.swing_time(beat_pos, swing, spb) = beat_pos * spb + delay. Yes.
            t = tbar(bar, bpm) + C.swing_time(beat, swing=swing, spb=spb(bpm)) - beat * 0
            # Let me just use:
            t = tbar(bar, bpm) + C.swing_time(beat, swing=swing, spb=spb(bpm))
            t = C.humanize(t, rng, 0.006)
            if kind == "bod":
                sig = A.bodhran(rng, dur=0.3, tight=(vel < 0.4), vel=vel)
                E.add_mono(perc, t, sig, gain=1.0, pan=rng.uniform(-0.15, 0.15))
                kick_times.append(t)
            elif kind == "kick":
                sig = C.cinematic_kick(rng, vel=vel, hard=False)
                E.add_mono(perc, t, sig, gain=0.85, pan=0.0)
                kick_times.append(t)
            else:
                sig = C.ghost_stick(rng, vel=vel)
                E.add_mono(perc, t, sig, gain=1.0, pan=rng.uniform(-0.35, 0.35))

    # Walk-in 0-8: lighter, first 2 bars almost just 1 and 3, then grow
    light = [
        [(0, "bod", 0.4), (2, "ghost", 0.12)],
        [(0, "bod", 0.42), (2, "bod", 0.28)],
        [(0, "bod", 0.45), (1.5, "ghost", 0.14), (2, "bod", 0.3)],
        [(0, "bod", 0.48), (1.5, "ghost", 0.16), (2, "bod", 0.32), (3.5, "ghost", 0.12)],
    ]
    for b in range(0, 8):
        drum_bar(b, light[b % 4] if b < 4 else vocab[b % 12], swing=0.08)
    for b in range(8, 24):
        drum_bar(b, vocab[(b + 3) % 12], swing=0.11)
    # lift 1: denser, add hats on selected bars (written, not every 8th)
    for b in range(24, 32):
        drum_bar(b, vocab[(b + 7) % 12], swing=0.12)
        if b % 2 == 0:
            for hb, hv in ((0.5, 0.16), (1.5, 0.12), (2.5, 0.18), (3.5, 0.12)):
                tt = tbar(b, bpm) + C.swing_time(hb, swing=0.12, spb=spb(bpm))
                E.add_mono(perc, C.humanize(tt, rng, 0.004), C.hat(rng, vel=hv, open_hat=(hb == 2.5)), gain=1.0, pan=0.2)
    # breakdown 32-40: almost drop out, a few heartbeat bodhrans
    for b, pat in (
        (32, [(0, "bod", 0.28)]),
        (34, [(0, "bod", 0.22), (3.5, "ghost", 0.1)]),
        (36, [(0, "bod", 0.25)]),
        (38, [(0, "ghost", 0.12), (2, "bod", 0.2)]),
    ):
        drum_bar(b, pat, swing=0.05)
    # build 40-48: accelerating bodhran figures (written rolls, not a machine)
    for b in range(40, 48):
        if b < 44:
            drum_bar(b, vocab[(b + 1) % 12], swing=0.1)
        else:
            # roll: 8th then 16th figures unique per bar
            if b == 44:
                pat = [(0, "bod", 0.5), (1, "bod", 0.4), (2, "bod", 0.45), (3, "bod", 0.4)]
            elif b == 45:
                pat = [(0, "bod", 0.52), (0.5, "ghost", 0.2), (1, "bod", 0.42), (1.5, "ghost", 0.18),
                       (2, "bod", 0.48), (3, "bod", 0.4)]
            elif b == 46:
                pat = [(i * 0.5, "bod" if i % 2 == 0 else "ghost", 0.5 - 0.04 * i) for i in range(8)]
            else:
                pat = [(i * 0.25, "bod" if i % 2 == 0 else "ghost", 0.55 - 0.03 * i) for i in range(12)]
            drum_bar(b, pat, swing=0.06)
    # lift 2
    for b in range(48, 56):
        drum_bar(b, vocab[(b + 5) % 12], swing=0.13)
        if b % 2 == 1:
            for hb, hv in ((0.5, 0.14), (1.5, 0.12), (2.5, 0.2), (3.5, 0.12)):
                tt = tbar(b, bpm) + C.swing_time(hb, swing=0.13, spb=spb(bpm))
                E.add_mono(perc, C.humanize(tt, rng, 0.004), C.hat(rng, vel=hv, open_hat=(hb == 2.5)), gain=1.0, pan=-0.15)
    # outro: thin back
    drum_bar(56, [(0, "bod", 0.4), (2, "bod", 0.25)], swing=0.08)
    drum_bar(57, [(0, "bod", 0.35), (3.5, "ghost", 0.12)], swing=0.08)
    drum_bar(58, [(0, "bod", 0.3)], swing=0.06)
    drum_bar(59, [(0, "ghost", 0.14)], swing=0.05)

    rL, rR = C.riser(rng, tbar(4, bpm), start_hz=150, end_hz=8500, vel=0.34)
    E.add_stereo(far, tbar(44, bpm), rL, rR)
    iL, iR = C.impact(rng, dur=2.4, vel=0.62)
    E.add_stereo(perc, tbar(48, bpm), iL, iR)

    # Funk bass — original written line, different vocabulary per section
    def bass_evt(bar, deg, beats, dead=False, slide=None, md=mode, rt=root_lo, vel=0.7):
        freq = hz(rt, deg, md)
        sl = hz(rt, slide, md) if slide else None
        sig = C.funk_bass(freq, beats * spb(bpm), vel=vel, dead=dead, slide_from=sl)
        E.add_mono(mid, tbar(bar, bpm), sig, gain=1.0)

    # 0-8 establish (unique bars)
    for b, evs in {
        0: [(0, 1, 2.5, False, None), (2.75, 1, 0.25, True, None), (3.0, 5, 1.0, False, None)],
        1: [(0, 1, 1.5, False, None), (1.5, 4, 0.5, False, None), (2.0, 5, 1.0, False, None), (3.0, 1, 1.0, False, None)],
        2: [(0, 1, 2.0, False, None), (2.0, 7, 1.0, False, None), (3.0, 5, 1.0, False, None)],
        3: [(0, 4, 1.5, False, None), (1.5, 4, 0.25, True, None), (2.0, 5, 2.0, False, None)],
        4: [(0, 1, 1.0, False, None), (1.0, 1, 0.5, True, None), (1.5, 5, 0.5, False, None), (2.0, 8, 1.0, False, None), (3.0, 5, 1.0, False, 4)],
        5: [(0, 1, 2.0, False, None), (2.0, 4, 1.0, False, None), (3.0, 5, 1.0, False, None)],
        6: [(0, 6, 2.0, False, None), (2.0, 5, 1.0, False, None), (3.0, 4, 1.0, False, None)],
        7: [(0, 1, 1.5, False, None), (1.5, 5, 0.5, False, None), (2.0, 7, 1.0, False, None), (3.0, 8, 1.0, False, 5)],
    }.items():
        for off, deg, beats, dead, sl in evs:
            bass_evt(b + off / 4.0, deg, beats, dead, sl)
    # 8-24: more movement, still not a copy of 0-8
    for b in range(8, 24):
        variants = [
            [(0, 1, 1.5, False, None), (1.5, 5, 0.5, False, None), (2.0, 4, 1.0, False, None), (3.0, 5, 1.0, False, None)],
            [(0, 1, 0.75, False, None), (0.75, 1, 0.25, True, None), (1.0, 8, 1.0, False, None), (2.0, 5, 1.0, False, None), (3.0, 4, 1.0, False, None)],
            [(0, 4, 2.0, False, None), (2.0, 6, 1.0, False, None), (3.0, 5, 1.0, False, 1)],
            [(0, 1, 1.0, False, None), (1.0, 3, 1.0, False, None), (2.0, 5, 1.5, False, None), (3.5, 5, 0.5, True, None)],
        ]
        for off, deg, beats, dead, sl in variants[(b - 8) % 4]:
            # tweak degree every cycle so 4-bar sets aren't identical
            deg2 = deg if (b - 8) // 4 == 0 else (deg + (0 if deg == 1 else (1 if b % 5 == 0 else 0)))
            bass_evt(b + off / 4.0, deg2, beats, dead, sl)
    # 24-32 lift 1: busier
    for b in range(24, 32):
        line = [
            (0, 1, 0.5, False, None), (0.5, 1, 0.5, True, None), (1.0, 5, 1.0, False, None),
            (2.0, 4, 0.5, False, None), (2.5, 5, 0.5, False, None), (3.0, 7, 0.5, False, None), (3.5, 8, 0.5, False, 5)
        ]
        if b % 2:
            line = [(0, 6, 1.0, False, None), (1.0, 5, 1.0, False, None), (2.0, 4, 1.0, False, None), (3.0, 1, 1.0, False, None)]
        for off, deg, beats, dead, sl in line:
            bass_evt(b + off / 4.0, deg, beats, dead, sl, vel=0.78)
    # breakdown: long E, then a crawl
    bass_evt(32.0, 1, 8.0, False, None, alt_mode, alt_root - 12, vel=0.4)
    bass_evt(34.0, 5, 8.0, False, None, alt_mode, alt_root - 12, vel=0.38)
    bass_evt(36.0, 4, 4.0, False, None, alt_mode, alt_root - 12, vel=0.36)
    bass_evt(37.0, 1, 4.0, False, 5, alt_mode, alt_root - 12, vel=0.4)
    bass_evt(38.0, 1, 8.0, False, None, alt_mode, alt_root - 12, vel=0.42)
    # 40-48 return to D, climbing
    for b, evs in {
        40: [(0, 1, 2.0, False, None), (2.0, 5, 2.0, False, None)],
        42: [(0, 4, 2.0, False, None), (2.0, 5, 1.0, False, None), (3.0, 7, 1.0, False, None)],
        44: [(0, 1, 1.0, False, None), (1.0, 5, 1.0, False, None), (2.0, 8, 1.0, False, None), (3.0, 9, 1.0, False, None)],
        46: [(0, 8, 2.0, False, None), (2.0, 5, 1.0, False, None), (3.0, 4, 1.0, False, 1)],
    }.items():
        for off, deg, beats, dead, sl in evs:
            bass_evt(b + off / 4.0, deg, beats, dead, sl, vel=0.72)
    # lift 2 new line
    for b in range(48, 56):
        line = [
            (0, 1, 0.75, False, None), (0.75, 1, 0.25, True, None), (1.0, 4, 1.0, False, None),
            (2.0, 5, 1.0, False, None), (3.0, 1, 0.5, False, None), (3.5, 5, 0.5, False, None)
        ]
        if b >= 52:
            line = [(0, 4, 1.0, False, None), (1.0, 6, 1.0, False, None), (2.0, 5, 1.0, False, None), (3.0, 1, 1.0, False, None)]
        for off, deg, beats, dead, sl in line:
            bass_evt(b + off / 4.0, deg, beats, dead, sl, vel=0.86)
    bass_evt(56.0, 1, 8.0, False, None, vel=0.5)
    bass_evt(58.0, 5, 4.0, False, None, vel=0.4)
    bass_evt(59.0, 1, 4.0, False, None, vel=0.35)

    # Harp / plucks evolving
    def harp_figure(bar0, nsteps, pattern, chord, vel=0.28, step=0.5, pluck=False):
        t0 = tbar(bar0, bpm)
        for i, idx in enumerate(pattern[:nsteps]):
            if pluck:
                L, R = C.avicii_pluck(chord[idx % len(chord)], spb(bpm) * 1.3, vel=vel, bright=0.7)
            else:
                L, R = A.harp_pluck(chord[idx % len(chord)], spb(bpm) * 1.7, vel=vel, bright=0.5)
            E.add_stereo(close, t0 + i * step * spb(bpm), L, R)

    harp_figure(0, 16, [0, 2, 1, 0, 3, 1, 2, 0, 4, 2, 1, 3, 0, 2, 1, 0], chord_hz(root, [1, 3, 5, 8, 9], mode), 0.22, 0.5)
    harp_figure(8, 32, [0, 1, 3, 2, 4, 1, 0, 3, 2, 4, 0, 1, 3, 5, 4, 2] * 2, chord_hz(root, [1, 3, 5, 8, 9, 10], mode), 0.3)
    harp_figure(16, 32, [2, 0, 3, 1, 4, 2, 0, 5, 3, 1, 0, 2, 4, 1, 3, 0] * 2, chord_hz(root, [1, 4, 5, 6, 8, 10], mode), 0.3)
    harp_figure(24, 32, [0, 2, 4, 1, 3, 5, 2, 0, 4, 6, 3, 1, 0, 2, 5, 3] * 2, chord_hz(root, [1, 3, 5, 8, 9, 10, 12], mode), 0.26, 0.5, pluck=True)
    harp_figure(32, 16, [0, 3, 1, 0, 2, 4, 1, 0], chord_hz(alt_root, [1, 3, 5, 8, 10], alt_mode), 0.2, 1.0)
    harp_figure(40, 32, [0, 1, 2, 4, 3, 1, 0, 5, 2, 4, 1, 0, 3, 5, 2, 1] * 2, chord_hz(root, [1, 3, 5, 8, 9, 11], mode), 0.28, 0.5, pluck=True)
    harp_figure(48, 32, [0, 3, 5, 2, 4, 1, 0, 6, 3, 5, 1, 2, 0, 4, 6, 3] * 2, chord_hz(root, [1, 3, 5, 8, 9, 10, 12], mode), 0.32, 0.5, pluck=True)
    harp_figure(56, 16, [0, 2, 1, 0, 3, 1, 2, 0], chord_hz(root, [1, 5, 8, 10], mode), 0.2, 0.5)

    # Leads — through-composed
    put_theme(close, tbar(8, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.7, pan=-0.12)
    put_theme(close, tbar(12, bpm), root, mode, bpm, A.tin_whistle, "b", vel=0.68, pan=-0.1)
    A.add_phrase(close, tbar(16, bpm), [5, 6, 8, 9, 11, 9, 8, 6, 5], [1, 1, 1, 1, 2, 1, 1, 1, 3],
                 root, mode, A.tin_whistle, bpm, vel=0.7, pan=-0.12)
    A.add_phrase(close, tbar(16, bpm) + 2 * spb(bpm), [1, 3, 5, 6, 5, 4, 3, 1], [2, 2, 2, 2, 2, 2, 2, 2],
                 root, mode, A.fiddle_note, bpm, vel=0.48, pan=0.28)
    A.add_phrase(close, tbar(20, bpm), [8, 9, 8, 6, 8, 11, 9, 8, 5], [1, 0.5, 0.5, 1, 1, 2, 1, 1, 4],
                 root, mode, A.tin_whistle, bpm, vel=0.72)
    A.add_phrase(close, tbar(20, bpm), [5, 6, 8, 6, 5, 4, 3, 5], [2, 2, 2, 2, 2, 2, 2, 2],
                 root, mode, A.fiddle_note, bpm, vel=0.5, pan=0.3)
    # lift 1: theme high + new counter
    put_theme(close, tbar(24, bpm), root + 12, mode, bpm, A.tin_whistle, "a", vel=0.72, pan=-0.1)
    A.add_phrase(close, tbar(24, bpm), [3, 5, 6, 8, 6, 5, 3, 1], [1, 1, 2, 2, 2, 2, 2, 4],
                 root, mode, A.fiddle_note, bpm, vel=0.55, pan=0.3)
    put_theme(close, tbar(28, bpm), root + 12, mode, bpm, A.tin_whistle, "b", vel=0.7)
    # breakdown: low whistle, inverted, E dorian
    inv, invd = inv_theme()
    A.add_phrase(close, tbar(33, bpm), inv, [2, 2, 2, 2, 2, 2, 2, 1, 1], alt_root, alt_mode,
                 A.tin_whistle, bpm, vel=0.5, pan=-0.15, low=True)
    A.add_phrase(close, tbar(37, bpm), [5, 4, 2, 1, 2], [2, 2, 2, 4, 6], alt_root, alt_mode,
                 A.tin_whistle, bpm, vel=0.45, low=True)
    # lift 2 call and response
    put_theme(close, tbar(48, bpm), root + 12, mode, bpm, A.tin_whistle, "a", vel=0.74, pan=-0.12)
    A.add_phrase(close, tbar(50, bpm), A.GLEN_DEGREES, A.GLEN_DUR, root, mode, A.fiddle_note, bpm, vel=0.58, pan=0.28)
    put_theme(close, tbar(52, bpm), root + 12, mode, bpm, A.tin_whistle, "b", vel=0.72)
    A.add_phrase(close, tbar(54, bpm), [8, 6, 5, 4, 5, 3, 1], [2, 1, 1, 2, 2, 2, 6],
                 root, mode, A.fiddle_note, bpm, vel=0.5, pan=0.25)
    A.add_phrase(close, tbar(56, bpm), [8, 5, 1], [2, 3, 7], root, mode, A.tin_whistle, bpm, vel=0.48)

    # Vocoder colour on lifts only (vowel hook, original theme as carrier pitches)
    def voc_pad(bar0, beats, rt, md, f0=170, gain=0.18):
        t0 = tbar(bar0, bpm)
        nn = int(beats * spb(bpm) * SR)
        car = np.zeros(nn)
        for f in chord_hz(rt, [1, 3, 5, 8], md):
            car += E.blep_saw(nn, f)
        car /= 4
        path = [(0.0, (650, 1300, 2400)), (0.4, (480, 1700, 2600)), (0.75, (800, 1400, 2700)), (1.0, (600, 1200, 2300))]
        mod = C.vowel_modulator(nn, path, f0=f0)
        vL, vR = C.vocoder_stereo(car, np.roll(car, 64), mod)
        E.add_stereo(mid, t0, C.fade_edges(vL * gain, 0.08, 0.1), C.fade_edges(vR * gain, 0.08, 0.1))

    voc_pad(24, 32, root, mode, f0=184, gain=0.16)
    voc_pad(48, 32, root, mode, f0=196, gain=0.18)

    hL, hR = C.horn_swell(hz(root_lo, 5, mode), 3.5, vel=0.28, bright=0.4)
    E.add_stereo(mid, tbar(23.2, bpm), hL, hR)
    hL, hR = C.horn_swell(hz(root_lo, 4, mode), 3.8, vel=0.3, bright=0.5)
    E.add_stereo(mid, tbar(46.5, bpm), hL, hR)

    # Sidechain mid/far only during lifts
    lift_hits = [t for t in kick_times if (tbar(24, bpm) <= t < tbar(32, bpm)) or (tbar(48, bpm) <= t < tbar(56, bpm))]
    mid[:, :] = C.apply_sidechain(mid, lift_hits, depth=0.4, rel=0.16)
    far[:, :] = C.apply_sidechain(far, lift_hits, depth=0.22, rel=0.2)

    close = C.polish_stem(close, hp=50, air_db=1.8)
    mid = C.polish_stem(mid, hp=24, mud_cut_db=-0.6)
    far = C.polish_stem(far, hp=20)
    perc = C.polish_stem(perc, hp=22)
    # Quiet walk-in, bigger lift_two — the lift has to be felt, not just a return of the verse
    t = np.arange(close.shape[0]) / SR
    g = np.interp(t,
                  [0, tbar(8, bpm), tbar(24, bpm), tbar(32, bpm), tbar(40, bpm), tbar(48, bpm), tbar(56, bpm), dur],
                  [0.42, 0.75, 1.05, 0.62, 0.88, 1.28, 0.7, 0.55])
    close *= g[:, None]; mid *= g[:, None]; far *= g[:, None]; perc *= (g * np.clip(g, 0.5, 1.15))[:, None]
    mixed = C.depth_mix(close, mid, far, perc, 1.0, 0.92, 0.82, 0.95)
    mixed = A.apply_reverb(mixed, np.random.default_rng(22), ir_s=2.6, wet=0.22, dry=1.0, pre=0.03, dark=2800)
    mixed = C.stereo_shelf(mixed, 110, 3.2, typ="low")
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=2.0, target_lufs=-14.0, split=125)
    sections = [
        ("walk_in", 0.0, tbar(8, bpm)),
        ("folk_verse", tbar(8, bpm), tbar(16, bpm)),
        ("counter_verse", tbar(16, bpm), tbar(24, bpm)),
        ("lift_one", tbar(24, bpm), tbar(32, bpm)),
        ("dorian_break", tbar(32, bpm), tbar(40, bpm)),
        ("build", tbar(40, bpm), tbar(48, bpm)),
        ("lift_two", tbar(48, bpm), tbar(56, bpm)),
        ("outro", tbar(56, bpm), dur),
    ]
    return out, sections, dict(title="Heather Road", context="day", bpm=bpm, target_lufs=-14.0)


# ---------------------------------------------------------------------------
# 3. Still Water — lochs
# ---------------------------------------------------------------------------
def render_still_water():
    bpm, bars = 60.0, 50
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(3309)
    mode, root, root_lo = "ionian", 67, 55  # G
    shadow_mode, shadow_root = "phrygian", 64  # E phrygian mid
    n = close.shape[0]

    air_L, air_R = A.air_noise(n, rng, lo=180, hi=1400, gain=0.03)
    # water-like resonant drips: slow band-moved noise
    water = C.lp_tv(np.stack([
        E.sos_bp(rng.standard_normal(n), 400, 1600) * 0.04,
        E.sos_bp(rng.standard_normal(n), 500, 1800) * 0.04
    ], 1), C.sweep_cutoff(n, 800, 2400, curve=0.6))
    pL, pR = A.soft_pad(n, chord_hz(root_lo, [1, 3, 5, 8], mode), gain=0.08, lp=1300, lfo=0.03)
    far[:n] += np.stack([air_L + pL, air_R + pR], 1) + water
    # mid-piece darker pad swap
    t0, t1 = tbar(28, bpm), tbar(34, bpm)
    nn = int((t1 - t0 + 2) * SR)
    dL, dR = A.soft_pad(nn, chord_hz(shadow_root - 12, [1, 2, 5, 8], shadow_mode), gain=0.1, lp=900, lfo=0.025)
    E.add_stereo(mid, t0, dL, dR)

    def strings(bar0, bar1, degs, gain, bright, md=mode, rt=root_lo, att=1.4):
        t0, t1 = tbar(bar0, bpm), tbar(bar1, bpm)
        L, R = C.string_ensemble(int((t1 - t0 + 1.5) * SR), chord_hz(rt, degs, md), gain=gain, attack=att, release=1.4, bright=bright)
        E.add_stereo(mid, t0, L, R)

    strings(0, 10, [1, 5, 8], 0.05, 0.15)
    strings(10, 20, [1, 3, 5, 8], 0.07, 0.22)
    strings(20, 28, [1, 4, 6, 8], 0.08, 0.28)
    strings(28, 34, [1, 2, 5, 8], 0.07, 0.12, shadow_mode, shadow_root - 12, 1.0)
    strings(34, 44, [1, 3, 5, 8, 10], 0.09, 0.3)
    strings(44, 50, [1, 5, 8], 0.05, 0.15)

    # Harp is the lead colour — unique, unhurried figures
    def harp_at(bar, deg, dbeats, vel=0.4, bright=0.45, md=mode, rt=root, pan=0.0):
        L, R = A.harp_pluck(hz(rt, deg, md), dbeats * spb(bpm), vel=vel, bright=bright)
        if pan:
            gL, gR = math.sqrt(0.5 * (1 - pan)), math.sqrt(0.5 * (1 + pan))
            E.add_stereo(close, tbar(bar, bpm), L * gL / 0.707, R * gR / 0.707)
        else:
            E.add_stereo(close, tbar(bar, bpm), L, R)

    # intro harmonics
    for b, deg, d, v in [(1, 5, 4, 0.28), (3.5, 8, 3, 0.24), (6, 10, 4, 0.3), (8, 5, 3, 0.22)]:
        harp_at(b, deg, d, v, 0.35)
    # stretched motif on harp (bars 10-20)
    A.add_phrase(close, tbar(10, bpm), A.GLEN_DEGREES, [2, 2, 2, 3, 1, 2, 2, 2, 4],
                 root, mode, A.harp_pluck, bpm, vel=0.55, bright=0.5)
    A.add_phrase(close, tbar(15, bpm), A.GLEN_ANSWER, [2, 2, 2, 2, 2, 2, 2, 2, 4],
                 root, mode, A.harp_pluck, bpm, vel=0.5, bright=0.45)
    # flowing but new pattern 18-20
    A.add_phrase(close, tbar(18, bpm), [8, 10, 8, 6, 5, 3, 5], [2, 2, 2, 2, 3, 2, 3],
                 root, mode, A.harp_pluck, bpm, vel=0.48, bright=0.5)
    # whistle enters late, soft
    A.add_phrase(close, tbar(21, bpm), [5, 6, 8, 9, 8, 6, 5], [2, 2, 3, 3, 2, 2, 4],
                 root, mode, A.tin_whistle, bpm, vel=0.46, pan=-0.1)
    A.add_phrase(close, tbar(25, bpm), [8, 6, 5, 4, 5, 3, 1], [2, 2, 2, 2, 3, 2, 3],
                 root, mode, A.tin_whistle, bpm, vel=0.44, pan=-0.12)
    # shadow: low whistle inverted, one distant boom
    inv, _ = inv_theme()
    A.add_phrase(close, tbar(28.5, bpm), inv, [2, 2, 2, 2, 2, 2, 2, 2, 4],
                 shadow_root, shadow_mode, A.tin_whistle, bpm, vel=0.38, pan=0.1, low=True)
    iL, iR = C.impact(rng, dur=3.0, vel=0.28)
    E.add_stereo(perc, tbar(30.5, bpm), iL, iR)
    # light returns — call and response harp / whistle, new continuation
    A.add_phrase(close, tbar(34, bpm), [5, 6, 8, 10, 8, 6, 5, 3, 5], [1, 1, 2, 2, 2, 1, 1, 2, 4],
                 root, mode, A.harp_pluck, bpm, vel=0.52, bright=0.55)
    A.add_phrase(close, tbar(36, bpm), [8, 9, 12, 10, 8, 6, 5], [2, 2, 2, 2, 2, 2, 4],
                 root, mode, A.tin_whistle, bpm, vel=0.55, pan=-0.15)
    A.add_phrase(close, tbar(39, bpm), [3, 5, 6, 8, 6, 5, 3, 1], [2, 2, 2, 2, 2, 2, 2, 4],
                 root, mode, A.fiddle_note, bpm, vel=0.36, pan=0.3)
    A.add_phrase(close, tbar(42, bpm), [8, 5, 6, 5, 1], [2, 2, 2, 2, 8],
                 root, mode, A.tin_whistle, bpm, vel=0.4)
    # dissolve
    for b, deg, d, v in [(44.5, 8, 4, 0.3), (46, 5, 4, 0.26), (47.5, 3, 5, 0.22), (49, 1, 4, 0.18)]:
        harp_at(b, deg, d, v, 0.3)

    close = C.polish_stem(close, hp=50, air_db=2.0)
    mid = C.polish_stem(mid, hp=30, mud_cut_db=-1.0)
    far = C.polish_stem(far, hp=25)
    mixed = C.depth_mix(close, mid, far, perc, 1.0, 0.85, 0.9, 0.6)
    mixed = A.apply_reverb(mixed, np.random.default_rng(33), ir_s=4.5, wet=0.42, dry=0.95, pre=0.06, dark=2200)
    # a light ping-pong on the close image already in the verb
    mixed = E.ping_pong_delay(mixed, 0.62, fb=0.22, mix=0.12)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=3.0, target_lufs=-16.0, split=120)
    sections = [
        ("shore", 0.0, tbar(10, bpm)),
        ("harp_theme", tbar(10, bpm), tbar(20, bpm)),
        ("whistle_enters", tbar(20, bpm), tbar(28, bpm)),
        ("shadow", tbar(28, bpm), tbar(34, bpm)),
        ("light_returns", tbar(34, bpm), tbar(44, bpm)),
        ("dissolve", tbar(44, bpm), dur),
    ]
    return out, sections, dict(title="Still Water", context="loch", bpm=bpm, target_lufs=-16.0)


# ---------------------------------------------------------------------------
# 4. Watcher on the Ridge — overworld night
# ---------------------------------------------------------------------------
def render_watcher_on_the_ridge():
    bpm, bars = 54.0, 44
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(4410)
    mode, root, root_lo = "aeolian", 64, 52  # E
    moon_mode, moon_root = "lydian", 60  # C lydian warmth
    n = close.shape[0]
    air_L, air_R = A.air_noise(n, rng, lo=150, hi=900, gain=0.025)
    pL, pR = A.soft_pad(n, chord_hz(root_lo, [1, 3, 5, 8], mode), gain=0.07, lp=1000, lfo=0.03)
    sL, sR = A.sub_drone(n, A.midi(root_lo), gain=0.12, lfo=0.025)
    far[:n] += np.stack([air_L + pL + sL, air_R + pR + sR], 1)

    def strings(bar0, bar1, degs, gain, bright, md=mode, rt=root_lo, att=1.6):
        L, R = C.string_ensemble(int((tbar(bar1, bpm) - tbar(bar0, bpm) + 1.5) * SR),
                                 chord_hz(rt, degs, md), gain=gain, attack=att, release=1.6, bright=bright)
        E.add_stereo(mid, tbar(bar0, bpm), L, R)

    strings(4, 12, [1, 5, 8], 0.05, 0.12)
    strings(12, 22, [1, 3, 5, 8], 0.08, 0.18)
    strings(22, 30, [1, 3, 5, 8, 10], 0.12, 0.32)  # swell
    strings(30, 36, [1, 3, 5, 7, 8], 0.08, 0.35, moon_mode, moon_root - 12, 1.0)
    strings(36, 44, [1, 5, 8], 0.05, 0.1)

    # isolated early whistle tones (not the full theme yet)
    A.add_phrase(close, tbar(4, bpm), [5], [6], root, mode, A.tin_whistle, bpm, vel=0.32, low=True, pan=-0.2)
    A.add_phrase(close, tbar(7.5, bpm), [8], [5], root, mode, A.tin_whistle, bpm, vel=0.28, low=True, pan=0.15)
    A.add_phrase(close, tbar(10, bpm), [3], [5], root, mode, A.tin_whistle, bpm, vel=0.26, low=True, pan=-0.1)
    # theme fragment
    A.add_phrase(close, tbar(13, bpm), [5, 6, 8, 6, 5], [3, 2, 4, 3, 6],
                 root, mode, A.tin_whistle, bpm, vel=0.48, low=True, pan=-0.12)
    A.add_phrase(close, tbar(18, bpm), [8, 6, 5, 4, 1], [3, 2, 3, 3, 5],
                 root, mode, A.tin_whistle, bpm, vel=0.46, low=True)
    # swell: fuller theme + horn + choir/vocoder
    put_theme(close, tbar(23, bpm), root, mode, bpm, A.tin_whistle, "a", vel=0.58, pan=-0.1)
    hL, hR = C.horn_swell(hz(root_lo, 5, mode), 5.0, vel=0.34, bright=0.3)
    E.add_stereo(mid, tbar(22, bpm), hL, hR)
    nn = int(tbar(8, bpm) * SR)
    car = np.zeros(nn)
    for f in chord_hz(root_lo, [1, 3, 5, 8], mode):
        car += E.blep_saw(nn, f)
    car /= 4
    mod = C.vowel_modulator(nn, [(0, (500, 900, 1800)), (0.5, (620, 1200, 2000)), (1, (480, 850, 1700))], f0=110)
    vL, vR = C.vocoder_stereo(car, np.roll(car, 90), mod, bands=14, lo=160, hi=4000)
    E.add_stereo(mid, tbar(22, bpm), C.fade_edges(vL * 0.16, 0.2, 0.25), C.fade_edges(vR * 0.16, 0.2, 0.25))
    # moonlight C lydian — high harp, new fragment
    A.add_phrase(close, tbar(30.5, bpm), [5, 6, 8, 9, 8, 5], [2, 2, 3, 2, 3, 4],
                 moon_root + 12, moon_mode, A.harp_pluck, bpm, vel=0.42, bright=0.6)
    A.add_phrase(close, tbar(33, bpm), [8, 7, 5, 3, 1], [2, 2, 3, 3, 4],
                 moon_root, moon_mode, A.tin_whistle, bpm, vel=0.4, pan=0.1)
    # sparser return, not a copy of the opening: falling phrase, then one long tone
    A.add_phrase(close, tbar(37, bpm), [8, 5, 4, 3, 1], [3, 3, 3, 3, 6],
                 root, mode, A.tin_whistle, bpm, vel=0.36, low=True, pan=-0.18)
    A.add_phrase(close, tbar(41, bpm), [5], [8], root, mode, A.tin_whistle, bpm, vel=0.28, low=True)

    close = C.polish_stem(close, hp=50, air_db=1.2)
    mid = C.polish_stem(mid, hp=28)
    far = C.polish_stem(far, hp=22)
    mixed = C.depth_mix(close, mid, far, perc, 1.0, 0.9, 0.95, 0.4)
    mixed = A.apply_reverb(mixed, np.random.default_rng(44), ir_s=5.0, wet=0.48, dry=0.9, pre=0.07, dark=1800)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=3.5, target_lufs=-16.0, split=110)
    sections = [
        ("ridge_air", 0.0, tbar(12, bpm)),
        ("fragment", tbar(12, bpm), tbar(22, bpm)),
        ("swell", tbar(22, bpm), tbar(30, bpm)),
        ("moonlight", tbar(30, bpm), tbar(36, bpm)),
        ("return_sparse", tbar(36, bpm), dur),
    ]
    return out, sections, dict(title="Watcher on the Ridge", context="night", bpm=bpm, target_lufs=-16.0)


# ---------------------------------------------------------------------------
# 5–7 beatless / weightless pieces
# ---------------------------------------------------------------------------
def _bells(bus, events, rng, vel_scale=0.4):
    for t, freq, dur, vel in events:
        L, R = A.glass_bell(freq, dur, rng, vel=vel * vel_scale)
        E.add_stereo(bus, t, L, R)


def render_blue_vault():
    dur = 210.0
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(5511)
    n = close.shape[0]
    # C# / F# modal world
    cs2, fs2, gs2, b2 = A.midi(37), A.midi(42), A.midi(44), A.midi(47)
    cs3, e3, fs3, gs3, b3 = A.midi(49), A.midi(52), A.midi(54), A.midi(56), A.midi(59)
    cs4, e4, fs4, gs4, a4, b4 = A.midi(61), A.midi(64), A.midi(66), A.midi(68), A.midi(69), A.midi(71)
    sL, sR = A.sub_drone(n, cs2 / 2, gain=0.18, lfo=0.02)
    air_L, air_R = A.air_noise(n, rng, lo=200, hi=2000, gain=0.02)
    far[:n] += np.stack([sL + air_L, sR + air_R], 1)

    # seven unique choir areas — different vowels, voicings, filter
    areas = [
        (16, 18, [cs3, gs3], [520, 980, 1800], 0.06, 1200, 0.15),  # choir enters after a sub-only prelude
        (32, 28, [cs3, e3, gs3, cs4], [600, 1200, 2100], 0.11, 2000, 0.35),
        (60, 28, [fs3, cs4, e4, gs4], [700, 1400, 2400], 0.14, 2600, 0.5),
        (90, 24, [e4, a4, cs4 * 2, e4 * 2], [800, 1600, 2700], 0.13, 3600, 0.7),  # high shards, no overlap
        (118, 24, [cs3, gs3], [450, 800, 1500], 0.045, 900, 0.12),  # sudden thin and quiet
        (144, 28, [fs3, b3, cs4, e4], [580, 1100, 2000], 0.11, 1800, 0.4),
        (176, 34, [cs2, cs3, gs3], [480, 900, 1600], 0.08, 1400, 0.22),  # darker, lower than area 2
    ]
    for t0, length, freqs, form, gain, lp, bri in areas:
        nn = int((length + 2) * SR)
        L, R = A.choir_chord(nn, freqs, form, gain=gain, rng=rng)
        # filter identity per area
        L, R = C.lp_tv(L, lp, Q=0.8), C.lp_tv(R, lp, Q=0.8)
        E.add_stereo(mid, t0, L, R)
        # vocoder vowel layer, unique path per area
        car = (L + R) * 0.5
        path = [(0.0, (form[0] * 0.9, form[1] * 0.9, form[2])),
                (0.5, (form[0] * 1.15, form[1] * 1.1, form[2] * 1.05)),
                (1.0, (form[0], form[1] * 0.95, form[2] * 0.9))]
        mod = C.vowel_modulator(len(car), path, f0=98)
        v = C.vocoder(car, mod, bands=14, lo=160, hi=5000)
        E.add_mono(mid, t0, C.fade_edges(v * 0.35, 0.4, 0.5), gain=1.0)

    # Bell motifs that develop (Glen theme as isolated pitches, then retrograde, then shards)
    def gp(*notes):  # map scale-ish C# dorian-ish
        return notes
    # area 2-3: motif 5-6-8 as bells (gs4, b4, cs4*2?  G# A# C# — use gs4, b4, e4)
    ev = []
    ev += [(34, gs4, 4.5, 0.55), (42, b4, 4.0, 0.45), (50, e4 * 2 / 1, 5.0, 0.5)]
    ev += [(64, gs4, 3.5, 0.5), (68, b4, 3.0, 0.48), (73, cs4 * 2, 4.0, 0.6), (80, b4, 3.5, 0.4), (85, gs4, 4.0, 0.42)]
    # area 4 brighter, more bells, new order
    ev += [(92, e4 * 2, 3.0, 0.55), (96, a4, 2.5, 0.5), (100, gs4, 3.0, 0.45),
           (104, cs4 * 2, 3.5, 0.58), (109, e4 * 2, 4.0, 0.5)]
    # area 5: two bells only
    ev += [(122, cs4, 6.0, 0.3), (132, gs3, 6.5, 0.28)]
    # area 6 retrograde
    ev += [(148, e4, 3.5, 0.4), (154, b4, 3.5, 0.42), (160, gs4, 4.0, 0.38), (168, fs4, 4.5, 0.35)]
    # area 7: spaced, preparing the loop
    ev += [(180, gs4, 5.0, 0.36), (190, cs4, 6.0, 0.3), (200, gs3, 7.0, 0.26)]
    _bells(close, ev, rng, vel_scale=0.55)

    # slow filter journey on the mid choir
    mid[:, :] = C.lp_tv(mid, C.sweep_cutoff(len(mid), 1200, 3600, curve=0.7, hold_end=0.25), Q=0.85)

    t = np.arange(len(mid)) / SR
    mid_g = np.interp(t, [0, 16, 32, 60, 90, 118, 144, 176, 210],
                      [0.25, 0.45, 0.85, 1.15, 1.25, 0.35, 0.95, 0.65, 0.5])
    far_g = np.interp(t, [0, 16, 60, 118, 144, 210], [0.7, 0.85, 1.0, 0.55, 0.9, 0.7])
    mid *= mid_g[:, None]
    far *= far_g[:, None]
    close *= np.interp(t[:len(close)], [0, 30, 90, 118, 144, 210], [0.5, 0.8, 1.2, 0.45, 0.9, 0.6])[:, None]
    close = C.polish_stem(close, hp=80, air_db=2.5)
    mid = C.polish_stem(mid, hp=30)
    far = C.polish_stem(far, hp=20)
    mixed = C.depth_mix(close, mid, far, None, 1.0, 0.95, 1.0)
    mixed = A.apply_reverb(mixed, np.random.default_rng(55), ir_s=7.0, wet=0.62, dry=0.75, pre=0.08, dark=2000)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=4.0, target_lufs=-16.0, split=100)
    sections = [
        ("sub_entry", 0.0, 30.0),
        ("choir_opens", 30.0, 60.0),
        ("bell_motif", 60.0, 90.0),
        ("lydian_shards", 90.0, 118.0),
        ("thin_drop", 118.0, 144.0),
        ("retrograde", 144.0, 174.0),
        ("dark_return", 174.0, dur),
    ]
    return out, sections, dict(title="Blue Vault", context="blue", bpm=0, target_lufs=-16.0)


def render_choir_of_the_hollow():
    dur = 225.0
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(6612)
    n = close.shape[0]
    d1, a1, d2, f2, a2, c3, d3, e3, f3, a3, c4 = (
        A.midi(26), A.midi(33), A.midi(38), A.midi(41), A.midi(45), A.midi(48),
        A.midi(50), A.midi(52), A.midi(53), A.midi(57), A.midi(60)
    )
    sL, sR = A.sub_drone(n, d1, gain=0.22, lfo=0.018)
    air_L, air_R = A.air_noise(n, rng, lo=80, hi=700, gain=0.018)
    far[:n] += np.stack([sL + air_L, sR + air_R], 1)

    areas = [
        (16, 22, [d2, a2], [420, 780, 1400], 0.07, 1000),  # prelude is sub-only until 16s
        (36, 30, [d2, f2, a2, d3], [480, 880, 1600], 0.13, 1400),
        (66, 32, [f2, a2, c3, f3], [620, 1100, 1900], 0.15, 2000),  # inner sun, ends before upper
        (108, 26, [e3, a3, c4, e3 * 2], [820, 1500, 2600], 0.11, 2800),  # upper vault: high, thinner, later
        (138, 32, [d2, a2, d3], [380, 680, 1200], 0.09, 1000),  # stone memory, darker and lower
        (174, 51, [d2, f2, a2, d3], [450, 820, 1500], 0.10, 1300),
    ]
    for t0, length, freqs, form, gain, lp in areas:
        nn = int((length + 3) * SR)
        L, R = A.choir_chord(nn, freqs, form, gain=gain, rng=rng)
        L, R = C.lp_tv(L, lp, Q=0.75), C.lp_tv(R, lp, Q=0.75)
        E.add_stereo(mid, t0, L, R)
        car = (L + R) * 0.5
        path = [(0.0, (form[0], form[1], form[2])),
                (0.45, (form[0] * 1.2, form[1] * 0.9, form[2] * 1.1)),
                (1.0, (form[0] * 0.9, form[1], form[2] * 0.85))]
        mod = C.vowel_modulator(len(car), path, f0=78)
        v = C.vocoder(car, mod, bands=12, lo=120, hi=3600)
        E.add_mono(mid, t0, C.fade_edges(v * 0.4, 0.6, 0.7), gain=1.0)

    # very few bells, developing
    ev = [
        (48, a3, 7, 0.28), (88, f3, 6, 0.32), (96, a3, 5, 0.26),
        (118, c4, 6, 0.3), (126, a3, 7, 0.24),
        (150, d3, 8, 0.22), (188, a2, 8, 0.2), (210, d3, 9, 0.18),
    ]
    _bells(close, ev, rng, vel_scale=0.45)

    # a low horn "inner sun" entrance
    hL, hR = C.horn_swell(f2, 8.0, vel=0.22, bright=0.2)
    E.add_stereo(mid, 70.0, hL, hR)

    t = np.arange(len(mid)) / SR
    mid_g = np.interp(t, [0, 16, 36, 66, 100, 108, 136, 170, 225],
                      [0.25, 0.45, 0.8, 1.2, 0.7, 1.0, 0.5, 0.85, 0.55])
    far_g = np.interp(t, [0, 16, 66, 108, 138, 225], [0.65, 0.8, 1.05, 0.85, 0.55, 0.7])
    mid *= mid_g[:, None]
    far *= far_g[:, None]
    close = C.polish_stem(close, hp=70, air_db=1.0)
    mid = C.polish_stem(mid, hp=25)
    far = C.polish_stem(far, hp=18)
    mixed = C.depth_mix(close, mid, far, None, 0.9, 1.0, 1.05)
    mixed = A.apply_reverb(mixed, np.random.default_rng(66), ir_s=8.0, wet=0.7, dry=0.7, pre=0.1, dark=1600)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=4.5, target_lufs=-16.0, split=90)
    sections = [
        ("depth", 0.0, 34.0),
        ("choir_rises", 34.0, 68.0),
        ("inner_sun", 68.0, 104.0),
        ("upper_vault", 104.0, 136.0),
        ("stone_memory", 136.0, 172.0),
        ("hollow_return", 172.0, dur),
    ]
    return out, sections, dict(title="Choir of the Hollow", context="agartha", bpm=0, target_lufs=-16.0)


def render_silver_sea():
    dur = 180.0
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(7713)
    n = close.shape[0]
    # A lydian cold, mid F# dorian warmer
    a1, e2, a2, b2, cs3, e3, fs3, gs3, a3, b3, cs4, e4 = (
        A.midi(33), A.midi(40), A.midi(45), A.midi(47), A.midi(49), A.midi(52),
        A.midi(54), A.midi(56), A.midi(57), A.midi(59), A.midi(61), A.midi(64)
    )
    # almost no low end, a gentle sub only mid-piece (earth in view)
    air_L, air_R = A.air_noise(n, rng, lo=400, hi=2800, gain=0.024)
    far[:n] += np.stack([air_L, air_R], 1)
    # pads are sectional, not a 3-minute bed
    nn = int(44 * SR)
    pL, pR = A.soft_pad(nn, [a2, e3, a3], gain=0.05, lp=1800, lfo=0.04)
    E.add_stereo(far, 40.0, pL, pR)
    nn = int(50 * SR)
    wL, wR = A.soft_pad(nn, [fs3, a3, cs4, e4], gain=0.08, lp=1600, lfo=0.03)
    sL, sR = A.sub_drone(nn, A.midi(30), gain=0.08, lfo=0.02)
    E.add_stereo(mid, 80.0, wL + sL, wR + sR)
    nn = int(52 * SR)
    cL, cR = A.soft_pad(nn, [a2, e3], gain=0.03, lp=1400, lfo=0.035)
    E.add_stereo(far, 128.0, cL, cR)

    def whisper(t0, length, freqs, gain, bright):
        L, R = C.string_ensemble(int((length + 1.5) * SR), freqs, gain=gain, attack=2.0, release=2.0, bright=bright)
        E.add_stereo(mid, t0, L, R)

    whisper(40, 36, [a2, b2, e3], 0.055, 0.22)
    whisper(80, 40, [fs3, a3, cs4], 0.08, 0.38)
    whisper(130, 30, [a2, e3, a3], 0.04, 0.12)

    # sparse high bells, gaps develop (tighter mid-piece, then wider)
    ev = [
        (6, e4, 6, 0.35), (18, cs4, 5, 0.3), (32, a3, 6, 0.28), (48, b3, 5, 0.32),
        (58, e4, 4.5, 0.36), (70, gs3, 5, 0.25),
        # warmer closer events
        (84, a3, 4, 0.4), (90, cs4, 3.5, 0.38), (96, e4, 4, 0.42), (103, b3, 3.5, 0.34),
        (110, fs3 * 2, 4.5, 0.36), (118, cs4, 4, 0.3),
        # colder, wider gaps, new high figure
        (136, e4, 6, 0.28), (148, a3, 7, 0.24), (162, cs4, 6, 0.26), (174, e4, 6, 0.22),
    ]
    _bells(close, ev, rng, vel_scale=0.5)
    # a thin whistle-like sine phrase in the warm window (original, not the full theme)
    A.add_phrase(close, 92.0, [5, 6, 8, 6, 5], [2.5, 2, 3, 2, 5], 69, "dorian", A.tin_whistle, 48,
                 vel=0.28, pan=0.1)  # very slow

    close = C.polish_stem(close, hp=120, air_db=3.0)
    mid = C.polish_stem(mid, hp=40)
    far = C.polish_stem(far, hp=35)
    mixed = C.depth_mix(close, mid, far, None, 1.05, 0.8, 1.0)
    mixed = A.apply_reverb(mixed, np.random.default_rng(77), ir_s=6.5, wet=0.58, dry=0.8, pre=0.12, dark=2400)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=4.0, target_lufs=-16.0, split=140)
    sections = [
        ("vacuum", 0.0, 40.0),
        ("drift", 40.0, 80.0),
        ("earth_in_view", 80.0, 128.0),
        ("colder", 128.0, dur),
    ]
    return out, sections, dict(title="Silver Sea", context="moon", bpm=0, target_lufs=-16.0)


# ---------------------------------------------------------------------------
# 8. Ash Line — volcano, cinematic climax, no dance beat
# ---------------------------------------------------------------------------
def render_ash_line():
    bpm, bars = 66.0, 52
    dur = tbar(bars, bpm)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(8814)
    mode, root, root_lo = "phrygian", 62, 38  # D phrygian, very low root for drones
    n = close.shape[0]
    rum_L, rum_R = A.rumble(n, rng, gain=0.1)
    sL, sR = A.sub_drone(n, A.midi(root_lo), gain=0.2, lfo=0.04)
    air_L, air_R = A.air_noise(n, rng, lo=100, hi=800, gain=0.02)
    # crackle (ember)
    crack = E.sos_hp(rng.standard_normal(n), 4000) * 0.02
    crack *= 0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * np.arange(n) / SR)
    far[:n] += np.stack([rum_L + sL + air_L + crack * 0.45, rum_R + sR + air_R + np.roll(crack, 200) * 0.45], 1)
    t = np.arange(n) / SR
    # rumble grows through the ascent, then ducks under the climax (smoke hole), then returns thin
    grow = np.clip(np.interp(t, [0, tbar(12, bpm), tbar(24, bpm), tbar(36, bpm), tbar(37, bpm), tbar(42, bpm), tbar(52, bpm) + 2],
                             [0.4, 0.65, 1.05, 1.2, 0.45, 0.55, 0.4]), 0, 2)
    far *= grow[:, None]
    # climax opens the top
    far = C.lp_tv(far, np.interp(t, [0, tbar(24, bpm), tbar(36, bpm), tbar(42, bpm), tbar(52, bpm)],
                                 [600, 900, 4000, 1800, 700]), Q=0.8)

    def strings(bar0, bar1, degs, gain, bright, att=1.2):
        L, R = C.string_ensemble(int((tbar(bar1, bpm) - tbar(bar0, bpm) + 1.2) * SR),
                                 chord_hz(root_lo, degs, mode), gain=gain, attack=att, release=1.3, bright=bright)
        E.add_stereo(mid, tbar(bar0, bpm), L, R)

    strings(12, 24, [1, 5, 8], 0.07, 0.14, 1.4)
    strings(24, 36, [1, 2, 5, 8, 10], 0.13, 0.32, 0.7)
    strings(36, 42, [1, 3, 5, 8, 11], 0.22, 0.55, 0.2)  # climax much brighter and denser
    strings(42, 52, [1, 5], 0.05, 0.08, 1.8)

    # low horn / fifths motif, developing
    A.add_phrase(mid, tbar(12, bpm), [1, 2, 5], [6, 5, 8], root_lo, mode, lambda f, d, vel=0.4, **k: C.horn_swell(f, d, vel=vel, bright=0.15), bpm, vel=0.4)
    A.add_phrase(mid, tbar(18, bpm), [5, 2, 1, 5], [4, 4, 4, 6], root_lo, mode, lambda f, d, vel=0.38, **k: C.horn_swell(f, d, vel=vel, bright=0.18), bpm, vel=0.38)
    # mid build: theme in inversion, low
    inv, invd = inv_theme()
    A.add_phrase(close, tbar(24, bpm), inv, [2, 2, 2, 2, 2, 2, 2, 2, 4], root, mode,
                 A.tin_whistle, bpm, vel=0.36, low=True, pan=-0.1)
    A.add_phrase(mid, tbar(28, bpm), [1, 2, 5, 8, 5], [4, 4, 4, 4, 8], root_lo, mode,
                 lambda f, d, vel=0.42, **k: C.horn_swell(f, d, vel=vel, bright=0.28), bpm, vel=0.42)
    # climax: choir + horn + high fragment
    nn = int(tbar(8, bpm) * SR)
    L, R = A.choir_chord(nn, chord_hz(root_lo, [1, 3, 5, 8], "aeolian"), (450, 800, 1400), gain=0.2, rng=rng)
    E.add_stereo(mid, tbar(36, bpm), L, R)
    hL, hR = C.horn_swell(hz(root_lo, 5, mode), 6.0, vel=0.62, bright=0.55)
    E.add_stereo(mid, tbar(36, bpm), hL, hR)
    A.add_phrase(close, tbar(37, bpm), [8, 5, 4, 1], [2, 2, 3, 6], root, mode,
                 A.tin_whistle, bpm, vel=0.4, low=True)
    # aftermath: broken motif
    A.add_phrase(close, tbar(44, bpm), [5, 4, 1, 5], [4, 4, 5, 8], root, mode,
                 A.tin_whistle, bpm, vel=0.3, low=True, pan=-0.2)

    # Irregular cinematic impacts, increasing toward climax, then almost none
    impacts = [
        (8.0, 0.28, 2.0), (14.5, 0.3, 2.2), (20.0, 0.32, 2.0),
        (24.0, 0.36, 2.2), (27.5, 0.34, 1.8), (30.0, 0.4, 2.4),
        (32.5, 0.42, 2.0), (34.5, 0.45, 2.2),
        (36.0, 0.85, 3.2),  # the one
        (39.0, 0.4, 2.4),
        (46.0, 0.22, 2.6),
    ]
    for b, vel, d in impacts:
        L, R = C.impact(rng, dur=d, vel=vel)
        E.add_stereo(perc, tbar(b, bpm), L, R)
    # short riser only in the last two bars of the ascent, then a breath before the hit
    rL, rR = C.riser(rng, tbar(2.0, bpm), start_hz=120, end_hz=8000, vel=0.5)
    E.add_stereo(far, tbar(34, bpm), rL, rR)
    dwn_in = C.downlifter(rng, dur=0.8, vel=0.4)
    E.add_mono(far, tbar(35.7, bpm), dwn_in, gain=1.0)
    dwn = C.downlifter(rng, dur=2.0, vel=0.35)
    E.add_mono(far, tbar(42, bpm), dwn, gain=1.0)
    # climax-only bright metal / glass, not used earlier
    for freq, dur_s, vel, off in (
        (A.midi(74), 3.2, 0.55, 0.0),
        (A.midi(81), 2.6, 0.48, 0.4),
        (A.midi(86), 3.0, 0.42, 1.1),
        (A.midi(78), 2.4, 0.4, 2.0),
    ):
        L, R = A.glass_bell(freq, dur_s, rng, vel=vel)
        E.add_stereo(close, tbar(36, bpm) + off, L, R)
    # a few taiko at the climax only (not a beat)
    E.add_mono(perc, tbar(36, bpm), C.taiko(rng, vel=0.7), gain=1.0)
    E.add_mono(perc, tbar(37.5, bpm), C.taiko(rng, vel=0.4), gain=1.0)

    t = np.arange(len(mid)) / SR
    mid_g = np.interp(t, [0, tbar(24, bpm), tbar(35.7, bpm), tbar(36.0, bpm), tbar(36.3, bpm), tbar(42, bpm), tbar(52, bpm)],
                      [1.0, 1.0, 0.55, 0.2, 1.25, 1.15, 0.7])
    close_g = np.interp(t[:len(close)], [0, tbar(36, bpm), tbar(42, bpm), tbar(52, bpm)], [0.85, 1.3, 1.2, 0.7])
    mid *= mid_g[:, None]
    close *= close_g[:, None]
    # open the top only in the climax
    shelf = np.interp(t, [0, tbar(36, bpm), tbar(42, bpm), tbar(52, bpm)], [0.0, 4.0, 1.0, 0.0])
    # apply a static shelf on the climax span via a faded copy
    i0, i1 = int(tbar(36, bpm) * SR), int(tbar(43, bpm) * SR)
    mid[i0:i1] = C.stereo_shelf(mid[i0:i1], 2500, 5.0, typ="high")
    close[i0:min(i1, len(close))] = C.stereo_shelf(close[i0:min(i1, len(close))], 3000, 3.5, typ="high")
    close = C.polish_stem(close, hp=40, air_db=0.5)
    mid = C.polish_stem(mid, hp=28, mud_cut_db=-1.2)
    far = C.polish_stem(far, hp=20)
    perc = C.polish_stem(perc, hp=22)
    mixed = C.depth_mix(close, mid, far, perc, 0.9, 0.95, 1.0, 1.0)
    mixed = A.apply_reverb(mixed, np.random.default_rng(88), ir_s=4.2, wet=0.4, dry=0.95, pre=0.05, dark=1500)
    out = A.loop_master(mixed[: int(dur * SR)], xfade_s=3.0, target_lufs=-14.0, split=100)
    sections = [
        ("ember", 0.0, tbar(12, bpm)),
        ("low_motif", tbar(12, bpm), tbar(24, bpm)),
        ("ascent", tbar(24, bpm), tbar(34, bpm)),
        ("climax", tbar(34, bpm), tbar(42, bpm)),
        ("aftermath", tbar(42, bpm), dur),
    ]
    return out, sections, dict(title="Ash Line", context="volcano", bpm=bpm, target_lufs=-14.0)


TRACKS = {
    "the_glen_opens": render_the_glen_opens,
    "heather_road": render_heather_road,
    "still_water": render_still_water,
    "watcher_on_the_ridge": render_watcher_on_the_ridge,
    "blue_vault": render_blue_vault,
    "choir_of_the_hollow": render_choir_of_the_hollow,
    "silver_sea": render_silver_sea,
    "ash_line": render_ash_line,
}


def write_wav(path, x):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), np.clip(x, -1.0, 1.0), SR, subtype="FLOAT")


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
    (AN / "batch1-render.json").write_text(json.dumps(manifest, indent=2))
    print("done", names)


if __name__ == "__main__":
    main()
