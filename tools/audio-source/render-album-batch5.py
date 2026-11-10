#!/usr/bin/env python3
"""Render batch 5 of the Glencraft Original Soundtrack.

Four original 165 BPM UK happy-hardcore / bounce album sides, festival
level, through-composed (unique 8-bar cells, no tiled loops). They do not
replace the live Happy Hardcore remix. Techniques from award-level dance
production applied only to original writing: punchy layered kicks, off-beat
FM donk, alternate basses, filter journeys, side-chain pump, festival
builds and impacts, pitched-up original hook contours. No piano-led
writing. No copyrighted melodies, lyrics or samples.
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
spb, tbar, make_bus, hz = B1.spb, B1.tbar, B1.make_bus, B1.hz
chord_hz = B1.chord_hz

SR = E.SR
QA = Path("/workspace/qa/album")
WAV = QA / "wav"
AN = QA / "analysis"
BPM = 165.0
BEAT = 60.0 / BPM


def write_wav(path, x):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), np.clip(x, -1.0, 1.0), SR, subtype="FLOAT")


def _shape(bus, times, gains):
    t = np.arange(len(bus)) / SR
    bus *= np.interp(t, times, gains)[:, None]



VOC_DIR = Path("/workspace/qa/album/vocals")
_voc_cache = {}


def load_voc(name):
    if name not in _voc_cache:
        path = VOC_DIR / f"{name}.wav"
        if not path.exists():
            raise FileNotFoundError(f"missing vocal stem {path}")
        y, _sr = sf.read(str(path), always_2d=True)
        _voc_cache[name] = np.asarray(y, dtype=np.float64)
    return _voc_cache[name]


def place_vocal(bus, t0, key, gain=0.85, layers="full"):
    def add(stem, g):
        y = load_voc(stem)
        E.add_stereo(bus, t0, y[:, 0], y[:, 1], gain=g)
    if layers == "dry":
        add(f"hook_{key}_dry", gain)
        return
    if layers in ("lead", "tag", "intimate"):
        add(f"hook_{key}_lead", gain)
        return
    add(f"hook_{key}_lead", gain)
    if layers in ("thick", "full"):
        add(f"hook_{key}_oct", gain * 0.32)
        add(f"hook_{key}_double", gain * 0.34)
    if layers == "full":
        add(f"hook_{key}_harm", gain * 0.28)


def place_chop(bus, t0, name, gain=0.7):
    y = load_voc(f"chop_{name}")
    E.add_stereo(bus, t0, y[:, 0], y[:, 1], gain=gain)


def hook_phrase(close, t0, degrees, durs, root, mode, vel=0.7, cut=4200, pan=-0.05):
    t = t0
    gL = (1.0 - pan) * 0.5 * vel * 2  # keep overall level; pan is a slight lean
    gR = (1.0 + pan) * 0.5 * vel * 2
    for deg, dur_b in zip(degrees, durs):
        if deg:
            out = E.lead_note(hz(root, deg, mode), dur_b * BEAT * 1.05, cutoff=cut)
            L, R = out if isinstance(out, tuple) else (out, out)
            E.add_stereo(close, t, C.fade_edges(np.asarray(L) * gL, 0.008, 0.04),
                         C.fade_edges(np.asarray(R) * gR, 0.008, 0.04), gain=1.0)
        t += dur_b * BEAT
    return t


def saw_stab(mid, t0, freqs, dur, cut, vel):
    L, R = E.muted_stab(freqs, dur=dur, cutoff=cut, det=8)
    E.add_stereo(mid, t0, L, R, gain=vel)


def saw_bed(far, t0, freq, length, cut, vel):
    L, R = E.supersaw_stereo(freq, length + 0.3, det=16, n_osc=7, cutoff=cut)
    E.add_stereo(far, t0, L, R, gain=vel)


# ---------------------------------------------------------------------------
# Shared 165 BPM cell renderer. Each cell must be a unique arrangement.
# ---------------------------------------------------------------------------
def render_side(title, context, seed, root, mode, bars, cells, hooks, lifts, target_lufs, sections, vocals=None):
    """cells: list of dicts covering the track, each unique.
    hooks: list of (bar, degrees, durs, vel, cut, root_off)
    lifts: dict bar->semitone shift applied to bass/hook root from that bar.
    """
    dur = tbar(bars, BPM)
    close, mid, far, perc = make_bus(dur), make_bus(dur), make_bus(dur), make_bus(dur)
    rng = np.random.default_rng(seed)
    n = close.shape[0]
    air_L, air_R = A.air_noise(n, rng, lo=400, hi=6000, gain=0.008)
    far[:n] += np.stack([air_L, air_R], 1)
    kicks = []

    def root_at(bar):
        st = 0
        for item in lifts:
            if bar >= item[0]:
                st = item[1]
        return root + st

    def mode_at(bar):
        # optional mode lift is encoded as a second value in lifts entries of len 3
        m = mode
        for item in lifts:
            if len(item) == 3 and bar >= item[0]:
                m = item[2]
        return m

    for cell in cells:
        b0, b1 = cell["bars"]
        kit = cell.get("kit", "drop")
        kpat = cell.get("kick", "four")
        spat = cell.get("snare", "back")
        hpat = cell.get("hat", "off")
        dpat = cell.get("donk", "off")
        bass = cell.get("bass")
        stabs = cell.get("stabs", 0)
        bed = cell.get("bed")
        cut = cell.get("cut", 3200)
        energy = cell.get("e", 1.0)

        for b in range(b0, b1):
            tbar0 = tbar(b, BPM)
            r = root_at(b)
            mo = mode_at(b)
            # kicks
            times = {
                "none": [],
                "half": [0.0],
                "sparse": [0.0, 2.0],
                "four": [0.0, 1.0, 2.0, 3.0],
                "build": [0.0, 2.0, 3.0, 3.5],
                "sync": [0.0, 1.0, 2.0, 2.75, 3.0],
                "drive": [0.0, 0.75, 1.0, 2.0, 3.0],
                "rush": [0.0, 1.0, 1.75, 2.0, 3.0, 3.5],
            }[kpat]
            # slight rewrite every other bar so 8-bar windows differ inside a cell too
            if (b - b0) % 8 >= 4 and kpat == "four":
                times = [0.0, 1.0, 2.0, 2.5, 3.0] if (b - b0) % 2 == 0 else [0.0, 1.0, 2.0, 3.0, 3.5]
            if (b - b0) % 8 >= 4 and kpat == "sync":
                times = [0.0, 1.0, 1.75, 2.0, 3.0]
            for off in times:
                t = C.humanize(tbar0 + off * BEAT, rng, 0.002)
                kicks.append(t)
                style = kit if kit in ("drop", "tight", "soft", "slam") else "drop"
                E.add_mono(perc, t, E.make_kick_pro(rng, style=style) * (0.85 + 0.2 * energy), gain=1.0)

            # snares
            if spat == "back":
                offs = [1.0, 3.0]
            elif spat == "back_extra":
                offs = [1.0, 3.0] + ([2.5] if (b - b0) % 2 else [3.5])
            elif spat == "clap":
                offs = [1.0, 3.0]
            elif spat == "sparse":
                offs = [2.0] if (b - b0) % 2 == 0 else []
            else:
                offs = []
            for off in offs:
                t = C.humanize(tbar0 + off * BEAT, rng, 0.003)
                if spat == "clap":
                    E.add_mono(perc, t, E.make_clap(rng) * 0.7 * energy, gain=1.0, pan=0.08)
                else:
                    kind = "hit" if off in (1.0, 3.0) else "ghost"
                    E.add_mono(perc, t, E.make_snare_pro(rng, kind=kind) * (0.75 if kind == "hit" else 0.35) * energy,
                               gain=1.0, pan=0.1)

            # hats
            if hpat == "off":
                for off in (0.5, 1.5, 2.5, 3.5):
                    E.add_mono(perc, C.humanize(tbar0 + off * BEAT, rng, 0.002),
                               E.make_hat_pro(rng, style="sizzle") * 0.22 * energy, gain=1.0, pan=0.2 if int(off) % 2 else -0.18)
            elif hpat == "16":
                for i in range(8):
                    vel = 0.28 if i % 2 else 0.14
                    E.add_mono(perc, C.humanize(tbar0 + i * 0.5 * BEAT, rng, 0.002),
                               E.make_hat_pro(rng, style="sizzle") * vel * energy, gain=1.0, pan=(0.2 if i % 2 else -0.16))
            elif hpat == "open":
                for off in (0.5, 1.5, 2.5, 3.5):
                    E.add_mono(perc, C.humanize(tbar0 + off * BEAT, rng, 0.002),
                               C.hat(rng, vel=0.28 * energy, open_hat=(off in (1.5, 3.5))), gain=1.0, pan=0.18)
            elif hpat == "sparse":
                for off in (1.5, 3.5):
                    E.add_mono(perc, tbar0 + off * BEAT, E.make_hat_pro(rng, style="sizzle") * 0.14 * energy, gain=1.0, pan=0.15)

            # donk off-beats
            if dpat:
                donk_offs = {
                    "off": [0.5, 1.5, 2.5, 3.5],
                    "late": [0.5, 1.5, 2.5, 3.25, 3.5],
                    "sync": [0.5, 1.25, 1.5, 2.5, 3.5],
                    "half": [0.5, 2.5],
                }[dpat]
                deg = cell.get("donk_deg", 1)
                # walk the donk degree inside the cell
                walk = cell.get("donk_walk", [deg])
                deg = walk[(b - b0) % len(walk)]
                freq = hz(r - 24, deg, mo)
                for off in donk_offs:
                    sig = E.make_donk(freq, rng, BEAT, style="bounce")
                    E.add_mono(mid, tbar0 + off * BEAT, sig, gain=0.7 * energy)

            # bass (written, changes with cell)
            if bass:
                kind, deg, beats = bass if len(bass) == 3 else (*bass, 4.0)
                # optional per-bar degree cycle
                if cell.get("bass_walk"):
                    deg = cell["bass_walk"][(b - b0) % len(cell["bass_walk"])]
                freq = hz(r - 24, deg, mo)
                def _stereo(out, g):
                    L, R = out if isinstance(out, tuple) else (out, out)
                    return C.fade_edges(np.asarray(L) * g, 0.01, 0.04), C.fade_edges(np.asarray(R) * g, 0.01, 0.04)
                if kind == "donksub":
                    pass  # donk already carries it
                elif kind == "reese":
                    L, R = _stereo(E.make_reese(freq, beats * BEAT, cutoff=480 + 80 * energy, det=8), 0.55 * energy)
                    E.add_stereo(mid, tbar0, L, R, gain=1.0)
                elif kind == "funk":
                    sig = C.funk_bass(freq, beats * BEAT, vel=0.6 * energy, dead=False)
                    E.add_mono(mid, tbar0, sig, gain=1.0)
                elif kind == "pluck":
                    L, R = _stereo(E.make_pluck(freq, dur=min(0.22, beats * BEAT)), 0.7 * energy)
                    E.add_stereo(mid, tbar0, L, R, gain=1.0)
                    if beats >= 2:
                        deg2 = cell.get("bass_walk", [deg, 5])
                        deg2 = deg2[1] if len(deg2) > 1 else deg
                        L, R = _stereo(E.make_pluck(hz(r - 24, deg2, mo), dur=0.2), 0.55 * energy)
                        E.add_stereo(mid, tbar0 + 2 * BEAT, L, R, gain=1.0)
                elif kind == "growl":
                    L, R = _stereo(E.make_growl(freq, beats * BEAT, rng), 0.5 * energy)
                    E.add_stereo(mid, tbar0, L, R, gain=1.0)

            if stabs:
                freqs = [hz(r, d, mo) for d in cell.get("stab_deg", [1, 3, 5])]
                saw_stab(mid, tbar0 + 0.5 * BEAT, freqs, 0.08, cut, 0.28 * energy * stabs)
                if stabs >= 2 and (b - b0) % 2:
                    saw_stab(mid, tbar0 + 1.5 * BEAT, freqs, 0.07, cut * 0.9, 0.2 * energy)

        # beds once per cell, not every bar (arrangement contrast)
        if bed:
            r0 = root_at(b0)
            mo0 = mode_at(b0)
            length = tbar(b1, BPM) - tbar(b0, BPM)
            freq = hz(r0 - 12, 1, mo0)
            saw_bed(far, tbar(b0, BPM), freq, length, cut, 0.12 * energy)
            if bed == "fifth":
                saw_bed(far, tbar(b0, BPM), hz(r0 - 12, 5, mo0), length, cut, 0.08 * energy)

    # hooks — sung WORLD leads take the memorable motif; synth answers stay quiet
    vocal_bars = {int(v[0]) for v in (vocals or [])}
    for bar, degs, durs, vel, cut, roff in hooks:
        if int(bar) in vocal_bars:
            vel = min(vel, 0.16)
        hook_phrase(close, tbar(bar, BPM), degs, durs, root_at(bar) + roff, mode_at(bar), vel=vel, cut=cut)
    for item in (vocals or []):
        bar, key, gain, layers = item[0], item[1], item[2], item[3]
        place_vocal(close, tbar(bar, BPM), key, gain=gain, layers=layers)
        if len(item) > 4:
            for chop_off, chop_name, chop_g in item[4]:
                place_chop(close, tbar(bar, BPM) + chop_off * BEAT, chop_name, gain=chop_g)

    # festival builds / impacts at planned joins
    for bar, kind, vel in cell_fx(cells):
        if kind == "riser":
            L, R = C.riser(rng, tbar(3.2, BPM), start_hz=200, end_hz=11000, vel=vel)
            E.add_stereo(far, tbar(bar, BPM), L, R)
        elif kind == "impact":
            L, R = C.impact(rng, dur=1.8, vel=vel)
            E.add_stereo(perc, tbar(bar, BPM), L, R)
        elif kind == "down":
            E.add_mono(far, tbar(bar, BPM), C.downlifter(rng, dur=1.4, vel=vel), gain=1.0)
        elif kind == "crash":
            E.add_mono(perc, tbar(bar, BPM), E.make_crash_pro(rng, style="wash") * vel, gain=1.0)

    # sidechain drops harder than breaks
    drop_k = [k for k in kicks if any(tbar(c["bars"][0], BPM) <= k < tbar(c["bars"][1], BPM) and c.get("e", 1) >= 0.95
                                       for c in cells)]
    mid[:, :] = C.apply_sidechain(mid, drop_k, depth=0.58, rel=0.12)
    far[:, :] = C.apply_sidechain(far, drop_k, depth=0.36, rel=0.16)
    close[:, :] = C.apply_sidechain(close, drop_k, depth=0.22, rel=0.10)
    close[:, :] = E.ping_pong_delay(close, BEAT * 0.75, fb=0.2, mix=0.12)

    # sectional gain from cell energy, with extra quiet on intro/break/outro names
    times, gains = [0.0], [cells[0].get("e", 1.0)]
    for c in cells:
        times.append(tbar(c["bars"][0], BPM))
        g = c.get("e", 1.0)
        gains.append(0.45 + 0.75 * g)
    times.append(dur)
    gains.append(gains[-1] * 0.7)
    for bus in (close, mid, far, perc):
        _shape(bus, times, gains)

    close = C.polish_stem(close, hp=80, air_db=2.4)
    mid = C.polish_stem(mid, hp=32, mud_cut_db=-2.2)
    far = C.polish_stem(far, hp=28)
    perc = C.polish_stem(perc, hp=24)
    mixed = C.depth_mix(close, mid, far, perc, 1.08, 0.95, 0.78, 1.12)
    mixed = A.apply_reverb(mixed, np.random.default_rng(seed + 7), ir_s=1.8, wet=0.16, dry=1.0, pre=0.015, dark=4200)
    sec = [(n, tbar(a, BPM) if a else 0.0, tbar(b, BPM) if b < bars else dur) for n, a, b in sections]
    if sec[-1][2] < dur:
        sec[-1] = (sec[-1][0], sec[-1][1], dur)
    out, loud_map = M.festive_master(mixed[: int(dur * SR)], sec, xfade_s=1.4)
    return out, sec, dict(title=title, context=context, bpm=BPM, target_lufs=target_lufs, section_lufs=loud_map)


def cell_fx(cells):
    """Impacts/rises just before high-energy cells and downs into breaks."""
    out = []
    prev_e = 0.4
    for c in cells:
        e = c.get("e", 1.0)
        b0 = c["bars"][0]
        if e >= 0.95 and prev_e < 0.9:
            out.append((max(0, b0 - 4), "riser", 0.55 if e >= 1.05 else 0.42))
            out.append((b0, "impact", 0.72 if e >= 1.05 else 0.58))
            out.append((b0, "crash", 0.7))
        if e <= 0.55 and prev_e >= 0.9:
            out.append((b0, "down", 0.32))
        prev_e = e
    return out


# Original hook contours — not the remix, not the Glen whistle theme.
H_BOUNCE_A = ([5, 5, 8, 7, 5, 3, 5, 8], [0.5, 0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0])
H_BOUNCE_B = ([3, 5, 7, 8, 10, 8, 7, 5], [0.5, 0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0])
H_NIGHT_A = ([8, 7, 5, 3, 5, 2, 3, 5], [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0])
H_NIGHT_B = ([10, 8, 7, 5, 8, 5, 3, 1], [0.5, 0.5, 1.0, 1.5, 1.0, 1.0, 1.5, 1.0])
H_CAIRN_A = ([1, 5, 8, 10, 8, 7, 5, 8], [0.5, 0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0])
H_CAIRN_B = ([5, 8, 10, 12, 10, 8, 7, 5], [0.5, 0.5, 1.0, 1.0, 1.5, 1.0, 1.0, 1.5])
H_HILLS_A = ([5, 7, 8, 10, 8, 6, 5, 3], [1.0, 0.5, 0.5, 1.5, 1.0, 1.0, 1.0, 1.5])
H_HILLS_B = ([8, 10, 8, 7, 5, 7, 8, 5], [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0])
H_CNT = ([8, 10, 12, 10, 8, 7, 5, 8], [1, 1, 2, 1, 1, 1, 1, 0])  # last 0 skipped if deg 0 — use 8
H_CNT = ([8, 10, 12, 10, 8, 7, 5, 8], [1, 1, 2, 1, 1, 1, 0.5, 0.5])


def render_bounce_the_glen():
    # E dorian, 136 bars = 197.8 s
    bars = 136
    root, mode = 64, "dorian"
    cells = [
        dict(bars=(0, 16), kit="soft", kick="sparse", snare="sparse", hat="sparse", donk=None, bass=None, bed="pad", cut=1400, e=0.35),
        dict(bars=(16, 32), kit="tight", kick="build", snare="back", hat="off", donk="half", bass=("funk", 1, 4),
             bass_walk=[1, 1, 7, 5], stabs=1, stab_deg=[1, 3, 5], bed="pad", cut=2400, e=0.7),
        dict(bars=(32, 48), kit="drop", kick="four", snare="back", hat="off", donk="off", donk_walk=[1, 1, 5, 1],
             bass=("reese", 1, 4), bass_walk=[1, 1, 5, 7], stabs=1, bed="fifth", cut=4200, e=1.0),
        dict(bars=(48, 56), kit="drop", kick="sync", snare="back_extra", hat="16", donk="late", donk_walk=[1, 5, 7, 5],
             bass=("growl", 1, 4), bass_walk=[1, 5, 4, 7], stabs=2, bed="fifth", cut=5000, e=1.05),
        dict(bars=(56, 64), kit="slam", kick="rush", snare="clap", hat="open", donk="sync", donk_walk=[1, 7, 8, 4],
             bass=("reese", 1, 2), bass_walk=[1, 8, 7, 5], stabs=1, cut=6200, e=1.08),
        dict(bars=(64, 72), kit="soft", kick="half", snare="sparse", hat="sparse", donk=None,
             bass=("funk", 1, 8), bed="pad", cut=1600, e=0.4),
        dict(bars=(72, 80), kit="soft", kick="none", snare="", hat="off", donk=None,
             bass=("pluck", 1, 4), bass_walk=[1, 6, 7, 5], bed="pad", cut=2400, e=0.34),
        dict(bars=(80, 88), kit="tight", kick="sparse", snare="sparse", hat="open", donk="half",
             bass=("funk", 1, 4), bass_walk=[1, 7, 5, 4], stabs=1, bed="fifth", cut=2800, e=0.52),
        dict(bars=(88, 104), kit="tight", kick="build", snare="back", hat="open", donk="half",
             bass=("pluck", 1, 2), bass_walk=[1, 7, 5, 4], stabs=1, bed="pad", cut=3000, e=0.75),
        dict(bars=(104, 120), kit="slam", kick="four", snare="back", hat="16", donk="off", donk_walk=[1, 5, 1, 7],
             bass=("reese", 1, 4), bass_walk=[1, 5, 7, 1], stabs=2, bed="fifth", cut=4800, e=1.1),
        dict(bars=(120, 128), kit="slam", kick="rush", snare="back_extra", hat="16", donk="sync", donk_walk=[1, 7, 5, 8],
             bass=("growl", 1, 4), bass_walk=[1, 7, 5, 4], stabs=2, bed="fifth", cut=5500, e=1.15),
        dict(bars=(128, 136), kit="soft", kick="sparse", snare="", hat="sparse", donk=None, bass=None, bed="pad", cut=1800, e=0.4),
    ]
    hooks = [
        (24, *H_BOUNCE_A, 0.45, 3600, 0),
        (32, *H_BOUNCE_A, 0.8, 4200, 0),
        (40, *H_BOUNCE_B, 0.78, 4200, 0),
        (48, *H_BOUNCE_A, 0.82, 4500, 0),
        (56, *H_BOUNCE_B, 0.8, 4500, 0),
        (96, *H_BOUNCE_A, 0.5, 3800, 0),
        (104, *H_BOUNCE_A, 0.86, 4600, 0),
        (112, *H_BOUNCE_B, 0.84, 4600, 0),
        (120, *H_BOUNCE_A, 0.88, 4800, 0),
        (124, *H_CNT, 0.5, 5000, 12),
    ]
    sections = [
        ("intro", 0, 16), ("build1", 16, 32), ("drop1a", 32, 48), ("drop1b", 48, 64),
        ("break", 64, 88), ("build2", 88, 104), ("drop2a", 104, 120), ("drop2b", 120, 128), ("outro", 128, 136),
    ]
    vocals = [
        (24, "bounce_a_soft", 0.48, "thick"),
        (32, "bounce_a", 0.86, "full"),
        (40, "bounce_b", 0.84, "full"),
        (48, "bounce_a", 0.90, "full"),
        (56, "bounce_c", 0.88, "full"),
        (64, "bounce_a_soft", 0.50, "intimate" if False else "thick"),
        (80, "bounce_b", 0.46, "thick"),
        (96, "bounce_a_soft", 0.52, "thick"),
        (104, "bounce_a", 0.94, "full"),
        (112, "bounce_b", 0.92, "full"),
        (120, "bounce_c", 0.90, "full"),
        (124, "bounce_tag", 0.70, "tag"),
    ]
    return render_side("Bounce the Glen", "bounce", 9501, root, mode, bars, cells, hooks, lifts=[], target_lufs=-10.0, sections=sections, vocals=vocals)


def render_nightcore_loch():
    # F# aeolian, drop 2 lifts +3 to A aeolian (nightcore colour, original)
    bars = 136
    root, mode = 66, "aeolian"
    cells = [
        dict(bars=(0, 16), kit="soft", kick="half", snare="", hat="sparse", donk=None, bass=None, bed="pad", cut=1100, e=0.3),
        dict(bars=(16, 32), kit="tight", kick="sparse", snare="back", hat="off", donk="half",
             bass=("funk", 1, 4), bass_walk=[1, 1, 6, 7], stabs=1, stab_deg=[1, 3, 5], bed="pad", cut=2000, e=0.65),
        dict(bars=(32, 48), kit="drop", kick="four", snare="back", hat="off", donk="off", donk_walk=[1, 1, 6, 1],
             bass=("reese", 1, 4), bass_walk=[1, 6, 7, 1], stabs=1, bed="fifth", cut=3600, e=1.0),
        dict(bars=(48, 56), kit="drop", kick="drive", snare="clap", hat="16", donk="late", donk_walk=[1, 6, 5, 7],
             bass=("growl", 1, 4), bass_walk=[1, 5, 6, 7], stabs=2, bed="fifth", cut=4400, e=1.05),
        dict(bars=(56, 64), kit="slam", kick="sync", snare="back_extra", hat="open", donk="sync", donk_walk=[1, 8, 6, 3],
             bass=("pluck", 1, 2), bass_walk=[1, 7, 8, 5], stabs=0, cut=6000, e=1.10),
        dict(bars=(64, 72), kit="soft", kick="half", snare="sparse", hat="sparse", donk=None,
             bass=("funk", 1, 8), bed="pad", cut=1400, e=0.38),
        dict(bars=(72, 80), kit="soft", kick="none", snare="", hat="off", donk=None,
             bass=None, bed="pad", cut=2000, e=0.30),
        dict(bars=(80, 88), kit="tight", kick="sparse", snare="back", hat="open", donk="half",
             bass=("pluck", 1, 2), bass_walk=[1, 6, 7, 5], stabs=1, bed="fifth", cut=2600, e=0.50),
        dict(bars=(88, 104), kit="tight", kick="build", snare="back", hat="open", donk="half",
             bass=("pluck", 1, 2), bass_walk=[1, 6, 7, 5], stabs=1, bed="pad", cut=2800, e=0.72),
        dict(bars=(104, 120), kit="slam", kick="four", snare="back", hat="16", donk="off", donk_walk=[1, 5, 1, 6],
             bass=("reese", 1, 4), bass_walk=[1, 5, 7, 1], stabs=2, bed="fifth", cut=5000, e=1.12),
        dict(bars=(120, 128), kit="slam", kick="sync", snare="back_extra", hat="16", donk="sync", donk_walk=[1, 7, 6, 8],
             bass=("growl", 1, 4), bass_walk=[1, 7, 5, 6], stabs=2, bed="fifth", cut=5600, e=1.18),
        dict(bars=(128, 136), kit="soft", kick="sparse", snare="", hat="sparse", donk=None, bass=None, bed="pad", cut=1600, e=0.35),
    ]
    hooks = [
        (24, *H_NIGHT_A, 0.42, 3400, 0),
        (32, *H_NIGHT_A, 0.78, 4000, 0),
        (40, *H_NIGHT_B, 0.76, 4000, 0),
        (48, *H_NIGHT_A, 0.8, 4300, 0),
        (56, *H_NIGHT_B, 0.78, 4300, 0),
        (96, *H_NIGHT_A, 0.48, 3600, 0),
        (104, *H_NIGHT_A, 0.86, 4600, 0),
        (112, *H_NIGHT_B, 0.84, 4600, 0),
        (120, *H_NIGHT_A, 0.88, 5000, 0),
        (124, *H_CNT, 0.52, 5200, 12),
    ]
    # +3 semitones from drop 2 (bar 104) — nightcore lift, still original contour
    lifts = [(104, 3, "aeolian")]
    sections = [
        ("depth", 0, 16), ("undertow", 16, 32), ("drop1a", 32, 48), ("drop1b", 48, 64),
        ("blackwater", 64, 88), ("lift", 88, 104), ("drop2a", 104, 120), ("drop2b", 120, 128), ("surface", 128, 136),
    ]
    vocals = [
        (24, "night_a_soft", 0.48, "thick"),
        (32, "night_a", 0.86, "full"),
        (40, "night_b", 0.84, "full"),
        (48, "night_a", 0.90, "full"),
        (56, "night_c", 0.88, "full"),
        (64, "night_a_soft", 0.50, "thick"),
        (80, "night_b", 0.46, "thick"),
        (96, "night_a_soft", 0.52, "thick"),
        (104, "night_a_lift", 0.94, "full"),
        (112, "night_b_lift", 0.92, "full"),
        (120, "night_c_lift", 0.90, "full"),
        (124, "night_tag", 0.70, "tag"),
    ]
    return render_side("Nightcore Loch", "bounce", 9502, root, mode, bars, cells, hooks, lifts=lifts, target_lufs=-10.0, sections=sections, vocals=vocals)


def render_cairn_flash():
    # B dorian, brighter festival side
    bars = 132  # 192.0 s
    root, mode = 71, "dorian"
    cells = [
        dict(bars=(0, 12), kit="soft", kick="sparse", snare="", hat="sparse", donk=None, bass=None, bed="pad", cut=1500, e=0.32),
        dict(bars=(12, 28), kit="tight", kick="four", snare="back", hat="off", donk="half",
             bass=("funk", 1, 4), bass_walk=[1, 5, 7, 4], stabs=1, bed="pad", cut=2600, e=0.7),
        dict(bars=(28, 44), kit="drop", kick="four", snare="back", hat="off", donk="off", donk_walk=[1, 1, 5, 4],
             bass=("reese", 1, 4), bass_walk=[1, 5, 4, 7], stabs=2, bed="fifth", cut=4400, e=1.02),
        dict(bars=(44, 60), kit="drop", kick="sync", snare="back_extra", hat="16", donk="late", donk_walk=[1, 4, 7, 5],
             bass=("pluck", 1, 1), bass_walk=[1, 5, 7, 8], stabs=2, bed="fifth", cut=5200, e=1.08),
        dict(bars=(60, 68), kit="soft", kick="half", snare="sparse", hat="sparse", donk=None,
             bass=("funk", 1, 8), bed="pad", cut=1700, e=0.42),
        dict(bars=(68, 80), kit="soft", kick="none", snare="", hat="open", donk=None,
             bass=("pluck", 1, 4), bass_walk=[1, 7, 5, 8], bed="fifth", cut=2600, e=0.36),
        dict(bars=(80, 96), kit="tight", kick="build", snare="clap", hat="open", donk="half",
             bass=("funk", 1, 4), bass_walk=[1, 7, 5, 4], stabs=1, bed="pad", cut=3200, e=0.78),
        dict(bars=(96, 112), kit="slam", kick="drive", snare="back", hat="16", donk="off", donk_walk=[1, 5, 7, 1],
             bass=("growl", 1, 4), bass_walk=[1, 5, 7, 4], stabs=2, bed="fifth", cut=5000, e=1.12),
        dict(bars=(112, 124), kit="slam", kick="rush", snare="back_extra", hat="16", donk="sync", donk_walk=[1, 8, 7, 5],
             bass=("reese", 1, 4), bass_walk=[1, 7, 5, 8], stabs=2, bed="fifth", cut=5800, e=1.16),
        dict(bars=(124, 132), kit="soft", kick="sparse", snare="", hat="sparse", donk=None, bass=None, bed="pad", cut=1800, e=0.38),
    ]
    hooks = [
        (20, *H_CAIRN_A, 0.44, 3600, 0),
        (28, *H_CAIRN_A, 0.8, 4300, 0),
        (36, *H_CAIRN_B, 0.78, 4300, 0),
        (44, *H_CAIRN_A, 0.84, 4600, 0),
        (52, *H_CAIRN_B, 0.82, 4600, 0),
        (88, *H_CAIRN_A, 0.5, 3800, 0),
        (96, *H_CAIRN_A, 0.88, 4800, 0),
        (104, *H_CAIRN_B, 0.86, 4800, 0),
        (112, *H_CAIRN_A, 0.9, 5200, 0),
        (116, *H_CNT, 0.55, 5400, 12),
    ]
    sections = [
        ("spark", 0, 12), ("kindle", 12, 28), ("flash1", 28, 44), ("flash2", 44, 60),
        ("ash", 60, 80), ("rally", 80, 96), ("flare", 96, 112), ("whiteout", 112, 124), ("ember", 124, 132),
    ]
    vocals = [
        (20, "cairn_a_soft", 0.46, "thick"),
        (28, "cairn_a", 0.86, "full"),
        (36, "cairn_b", 0.84, "full"),
        (44, "cairn_a", 0.90, "full"),
        (52, "cairn_c", 0.88, "full"),
        (60, "cairn_a_soft", 0.50, "thick"),
        (72, "cairn_b", 0.44, "thick"),
        (88, "cairn_a_soft", 0.52, "thick"),
        (96, "cairn_a", 0.94, "full"),
        (104, "cairn_b", 0.92, "full"),
        (112, "cairn_c", 0.90, "full"),
        (116, "cairn_tag", 0.70, "tag"),
    ]
    return render_side("Cairn Flash", "bounce", 9503, root, mode, bars, cells, hooks, lifts=[], target_lufs=-10.0, sections=sections, vocals=vocals)


def render_till_the_hills():
    # A dorian, more emotive folk-EDM build into bounce drops
    bars = 140  # 203.6 s
    root, mode = 69, "dorian"
    cells = [
        dict(bars=(0, 16), kit="soft", kick="none", snare="", hat="sparse", donk=None, bass=None, bed="pad", cut=1200, e=0.28),
        dict(bars=(16, 32), kit="soft", kick="sparse", snare="sparse", hat="off", donk=None,
             bass=("funk", 1, 4), bass_walk=[1, 7, 6, 5], stabs=0, bed="pad", cut=1800, e=0.5),
        dict(bars=(32, 48), kit="tight", kick="four", snare="back", hat="off", donk="half",
             bass=("funk", 1, 4), bass_walk=[1, 5, 7, 6], stabs=1, bed="pad", cut=2600, e=0.72),
        dict(bars=(48, 64), kit="drop", kick="four", snare="back", hat="off", donk="off", donk_walk=[1, 1, 7, 5],
             bass=("reese", 1, 4), bass_walk=[1, 7, 6, 5], stabs=1, bed="fifth", cut=4000, e=1.0),
        dict(bars=(64, 72), kit="drop", kick="sync", snare="clap", hat="16", donk="late", donk_walk=[1, 5, 6, 7],
             bass=("growl", 1, 4), bass_walk=[1, 5, 7, 4], stabs=2, bed="fifth", cut=4800, e=1.06),
        dict(bars=(72, 80), kit="slam", kick="rush", snare="back_extra", hat="open", donk="sync", donk_walk=[1, 8, 5, 10],
             bass=("reese", 1, 2), bass_walk=[1, 8, 6, 4], stabs=0, cut=6200, e=1.10),
        dict(bars=(80, 104), kit="soft", kick="half", snare="", hat="sparse", donk=None,
             bass=("funk", 1, 8), bed="pad", cut=1500, e=0.36),
        dict(bars=(104, 116), kit="tight", kick="build", snare="back", hat="open", donk="half",
             bass=("pluck", 1, 2), bass_walk=[1, 6, 7, 5], stabs=1, bed="pad", cut=3000, e=0.76),
        dict(bars=(116, 132), kit="slam", kick="drive", snare="back_extra", hat="16", donk="off", donk_walk=[1, 7, 5, 8],
             bass=("reese", 1, 4), bass_walk=[1, 7, 5, 6], stabs=2, bed="fifth", cut=5200, e=1.14),
        dict(bars=(132, 140), kit="soft", kick="sparse", snare="", hat="sparse", donk=None, bass=None, bed="pad", cut=1600, e=0.38),
    ]
    hooks = [
        (16, *H_HILLS_A, 0.4, 3200, 0),
        (32, *H_HILLS_A, 0.55, 3600, 0),
        (48, *H_HILLS_A, 0.8, 4200, 0),
        (56, *H_HILLS_B, 0.78, 4200, 0),
        (64, *H_HILLS_A, 0.84, 4500, 0),
        (72, *H_HILLS_B, 0.82, 4500, 0),
        (88, *H_HILLS_A, 0.36, 3000, 0),
        (108, *H_HILLS_A, 0.55, 3800, 0),
        (116, *H_HILLS_A, 0.88, 4800, 0),
        (124, *H_HILLS_B, 0.86, 5000, 0),
        (128, *H_CNT, 0.5, 5200, 12),
    ]
    sections = [
        ("mist", 0, 16), ("path", 16, 32), ("climb", 32, 48), ("drop1a", 48, 64),
        ("drop1b", 64, 80), ("heather", 80, 104), ("call", 104, 116), ("drop2", 116, 132), ("home", 132, 140),
    ]
    vocals = [
        (16, "hills_a_soft", 0.42, "thick"),
        (32, "hills_a_soft", 0.50, "thick"),
        (48, "hills_a", 0.86, "full"),
        (56, "hills_b", 0.84, "full"),
        (64, "hills_a", 0.90, "full"),
        (72, "hills_c", 0.88, "full"),
        (88, "hills_a_soft", 0.42, "thick"),
        (108, "hills_a_soft", 0.52, "thick"),
        (116, "hills_a", 0.94, "full"),
        (124, "hills_b", 0.90, "full"),
        (128, "hills_tag", 0.70, "tag"),
    ]
    return render_side("Till the Hills", "bounce", 9504, root, mode, bars, cells, hooks, lifts=[], target_lufs=-10.0, sections=sections, vocals=vocals)


TRACKS = {
    "bounce_the_glen": render_bounce_the_glen,
    "nightcore_loch": render_nightcore_loch,
    "cairn_flash": render_cairn_flash,
    "till_the_hills": render_till_the_hills,
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
    (AN / "batch5-render.json").write_text(json.dumps(manifest, indent=2))
    print("done", names)


if __name__ == "__main__":
    main()
