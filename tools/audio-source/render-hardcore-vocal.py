#!/usr/bin/env python3
"""1.2.6x Happy Hardcore remix — vocal hook revision (UK bounce / donk).

165 BPM, no piano, no synth lead on the drops. The hook is an original
pitched-up female vocal (Piper TTS, nightcore +6 st with formant shift),
layered with an octave double, a second-voice double, dorian harmonies,
chops and delay throws. Hollow metallic 2-op FM donk on every off-beat,
punchy 50 Hz kick, tight sidechain, clean mono low end, wide top,
tension-and-release arrangement, drops mastered to about -9 to -8 LUFS
short-term, true peak -1 dB, no clipping.

Previews go to /workspace/qa/audio-1260/v2/. Game assets replace
music/hardcore_remix.{mp3,ogg} the same way as the previous remix.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
import engine1260 as E

ROOT = Path(__file__).resolve().parents[2]
MUSIC = ROOT / "music"
OUT_DIR = Path(os.environ.get("HC_OUT", "/workspace/qa/audio-1260/v2"))
VOC = Path(os.environ.get("VOC_DIR", "/workspace/qa/audio-1260/v2/vocals"))

SR = E.SR
BPM = 165.0
SPB = 60.0 / BPM
BAR = 4 * SPB
BARS = 144
PREROLL_BARS = 2
SEED = 1262

# intro 8 | build 8 | drop1 48 | break 8 | build2 8 | drop2 56 | outro 8
SEC = {
    "intro": (0, 8),
    "build1": (8, 16),
    "drop1": (16, 64),
    "break": (64, 72),
    "build2": (72, 80),
    "drop2": (80, 136),
    "outro": (136, 144),
}

# D dorian / minimal harmony, roots carried by the donk: i – VII – VI – VII
# Dm, C, Bb, C
CHORD_HZ = [
    [146.83, 174.61, 220.00, 293.66],   # Dm
    [130.81, 164.81, 196.00, 261.63],   # C
    [116.54, 146.83, 174.61, 233.08],   # Bb
    [130.81, 164.81, 196.00, 261.63],   # C
]
BASS = [73.42, 65.41, 58.27, 65.41]


def section_at(bar):
    for name, (a, b) in SEC.items():
        if a <= bar < b:
            return name
    return "outro"


def lufs_ffmpeg(path):
    r = subprocess.check_output(
        ["ffmpeg", "-hide_banner", "-i", str(path),
         "-af", "ebur128=peak=true", "-f", "null", "-"],
        stderr=subprocess.STDOUT, text=True,
    )
    sm = r.split("Summary:")[-1] if "Summary:" in r else r
    out = {"S_max": None, "S": []}
    for line in sm.splitlines():
        if line.strip().startswith("I:"):
            out["I"] = float(line.split("I:")[1].split("LUFS")[0].strip())
        if line.strip().startswith("LRA:"):
            out["LRA"] = float(line.split("LRA:")[1].split("LU")[0].strip())
        if "Peak:" in line and "dBFS" in line:
            out["TP"] = float(line.split("Peak:")[1].split("dBFS")[0].strip())
    # short-term from the default ebur128 stderr log (framelog=verbose hides these)
    shorts = []
    for line in r.splitlines():
        m = re.search(r"\bS:\s*(-?\d+(?:\.\d+)?)", line)
        if m:
            val = float(m.group(1))
            if val > -70:
                shorts.append(val)
        if "LRA high:" in line:
            try:
                out["LRA_high"] = float(line.split("LRA high:")[1].split("LUFS")[0].strip())
            except (IndexError, ValueError):
                pass
    if shorts:
        out["S"] = shorts
        out["S_max"] = max(shorts)
        out["S_mean"] = float(np.mean(shorts))
    elif "LRA_high" in out:
        out["S_max"] = out["LRA_high"]
    return out


def load_stem(name):
    p = VOC / name
    if not p.exists():
        raise FileNotFoundError(f"missing vocal stem {p} — run build-vocals-1260.py first")
    y, sr = sf.read(str(p), always_2d=True)
    if sr != SR:
        import librosa
        y = np.stack([
            librosa.resample(y[:, ch], orig_sr=sr, target_sr=SR) for ch in range(y.shape[1])
        ], 1)
    return y.astype(np.float64)


def load_bank():
    bank = {
        "a_lead": load_stem("hook_a_lead.wav"),
        "b_lead": load_stem("hook_b_lead.wav"),
        "a_dbl": load_stem("hook_a_double.wav"),
        "b_dbl": load_stem("hook_b_double.wav"),
        "a_harm": load_stem("hook_a_harm.wav"),
        "b_harm": load_stem("hook_b_harm.wav"),
        "a_oct": load_stem("hook_a_oct.wav"),
        "b_oct": load_stem("hook_b_oct.wav"),
        "a_dry": load_stem("hook_a_lead_dry.wav"),
        "b_dry": load_stem("hook_b_lead_dry.wav"),
        "tag": load_stem("tag_to_the_hills.wav"),
    }
    for name in ("oh", "hey", "yeah", "glen", "sleep", "dance", "up"):
        bank[f"chop_{name}"] = load_stem(f"chop_{name}.wav")
        dry = VOC / f"chop_{name}_dry.wav"
        if dry.exists():
            bank[f"chop_{name}_dry"] = load_stem(f"chop_{name}_dry.wav")
    return bank


def place_stem(bus, t0, stem, gain=1.0):
    if stem is None or len(stem) == 0:
        return
    E.add_stereo(bus, t0, stem[:, 0], stem[:, 1] if stem.shape[1] > 1 else stem[:, 0], gain=gain)


def band_cosine(a, b, sr, bands=None):
    if bands is None:
        bands = [(20, 40), (40, 60), (60, 80), (80, 100), (100, 150), (150, 200),
                 (200, 300), (300, 500), (500, 800), (800, 1200), (1200, 2000),
                 (2000, 4000), (4000, 8000), (8000, 16000)]
    def pows(x):
        if x.ndim == 2:
            x = np.mean(x, axis=1)
        n = len(x)
        spec = np.abs(np.fft.rfft(x * np.hanning(n))) ** 2
        freqs = np.fft.rfftfreq(n, 1 / sr)
        out = []
        for lo, hi in bands:
            m = (freqs >= lo) & (freqs < hi)
            out.append(float(np.mean(spec[m])) if np.any(m) else 0.0)
        v = np.array(out)
        v = v / (np.max(v) + 1e-16)
        return v
    va, vb = pows(a), pows(b)
    return float(np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb) + 1e-16)), va, vb


def render():
    rng = np.random.default_rng(SEED)
    body_len = BARS * 4 * SPB
    preroll = PREROLL_BARS * 4 * SPB
    N = int(round((preroll + body_len) * SR))

    def t_body(bar, beat=0, eighth=0):
        return preroll + bar * BAR + beat * SPB + eighth * (SPB / 2)

    drums = np.zeros((N, 2))
    kick_bus = np.zeros((N, 2))
    donk_bus = np.zeros((N, 2))
    music = np.zeros((N, 2))
    vocals = np.zeros((N, 2))
    fx = np.zeros((N, 2))
    kick_times = []

    print("loading vocal stems…")
    bank = load_bank()

    print("building one-shots…")
    kick = E.make_kick(rng)
    clap = E.make_clap(rng)
    snare = E.make_snare(rng)
    hat_c = E.make_hat(rng, False)
    hat_o = E.make_hat(rng, True)
    crash = E.make_crash(rng)
    impact = E.make_impact(rng)
    donks = [E.make_donk(f, rng, SPB) for f in BASS]
    riser8 = E.make_riser(rng, 8 * BAR)
    riser4 = E.make_riser(rng, 4 * BAR)
    sweep_bar = E.make_noise_sweep(rng, BAR, up=True)
    sweep_2b = E.make_noise_sweep(rng, 2 * BAR, up=True)
    down_8th = E.make_noise_sweep(rng, SPB, up=False, lo=300, hi=8000)
    rev_cym = E.make_reverse_cymbal(rng, 0.65)
    zaps = [E.make_zap(midi, 0.09) for midi in (440.0, 587.0, 698.0, 880.0)]

    def hook_pair(which="wet"):
        if which == "dry":
            return bank["a_dry"], bank["b_dry"]
        return bank["a_lead"], bank["b_lead"]

    def place_hook_at(bar, gain=1.0, layers="full", dry=False):
        """Place a 2-bar A or B hook starting at `bar` (even = A, odd = B)."""
        if bar < 0:
            return
        t0 = t_body(bar)
        is_a = (bar % 4) < 2
        key = "a" if is_a else "b"
        lead = bank[f"{key}_dry"] if dry else bank[f"{key}_lead"]
        place_stem(vocals, t0, lead, gain=gain)
        if layers in ("full", "thick"):
            place_stem(vocals, t0, bank[f"{key}_oct"], gain=gain * 0.34)
            place_stem(vocals, t0, bank[f"{key}_dbl"], gain=gain * 0.36)
        if layers == "full":
            place_stem(vocals, t0, bank[f"{key}_harm"], gain=gain * 0.30)
        if layers == "harm":
            place_stem(vocals, t0, bank[f"{key}_harm"], gain=gain * 0.42)
            place_stem(vocals, t0, bank[f"{key}_oct"], gain=gain * 0.22)

    print("scheduling 144 bars…")
    for bar in range(-PREROLL_BARS, BARS):
        src_bar = bar if bar >= 0 else bar + BARS
        sec = section_at(src_bar)
        ci = src_bar % 4

        # Last 4 outro bars musically match intro bars 0–3 (loop join).
        if sec == "outro" and src_bar >= 140:
            sec_arr = "intro"
            arr_bar = src_bar - 140
        else:
            sec_arr = sec
            arr_bar = src_bar

        kick_gain = {
            "intro": 0.0 if arr_bar % 144 < 4 else 0.58,
            "build1": 0.82,
            "drop1": 1.0,
            "break": 0.70,
            "build2": 0.90,
            "drop2": 1.0,
            "outro": 0.52,
        }[sec_arr]
        if sec_arr == "intro" and (arr_bar % 144) >= 4:
            kick_gain = 0.42 + 0.08 * ((arr_bar % 144) - 4)

        donk_gain = {
            "intro": 0.0 if (arr_bar % 144) < 6 else 0.38,
            "build1": 0.62 if arr_bar < 12 else 0.88,
            "drop1": 1.12,
            "break": 0.70,
            "build2": 0.92,
            "drop2": 1.16,
            "outro": 0.36,
        }[sec_arr]

        hat_gain = {
            "intro": 0.10 if (arr_bar % 144) >= 6 else 0.0,
            "build1": 0.38 if arr_bar < 12 else 0.58,
            "drop1": 0.72,
            "break": 0.16,
            "build2": 0.62,
            "drop2": 0.80,
            "outro": 0.10,
        }[sec_arr]

        chord_gain = {
            "intro": 0.14 if (arr_bar % 144) >= 2 else 0.10,
            "build1": 0.26,
            "drop1": 0.28,   # beds under the vocal, not a synth hook
            "break": 0.14,
            "build2": 0.24,
            "drop2": 0.30,
            "outro": 0.12,
        }[sec_arr]

        phrase = arr_bar % 8
        phrase16 = arr_bar % 16
        drop_sec = sec_arr in ("drop1", "drop2")

        # 8-bar tension/release inside the drops
        if drop_sec and phrase == 6:
            chord_gain *= 0.55
            donk_gain *= 0.72
            hat_gain *= 0.80
        if drop_sec and phrase == 7:
            chord_gain *= 0.20
            donk_gain *= 0.42
            kick_gain *= 0.50
            hat_gain *= 0.35

        # Pre-drop mute (last beat of the last build bar) handled later
        predrop_bar = (sec_arr == "build1" and arr_bar == 15) or (sec_arr == "build2" and arr_bar == 79)

        for beat in range(4):
            t = t_body(bar, beat)
            # Pre-drop: kill the last beat of the build so the tag + silence can land
            mute = predrop_bar and beat == 3
            if mute:
                continue
            if kick_gain > 0.02:
                E.add_mono(kick_bus, t, kick, gain=kick_gain * 1.18, pan=0.0)
                kick_times.append(t)
            if sec_arr in ("drop1", "drop2", "build1", "build2") and beat in (1, 3):
                g = 0.42 if sec_arr.startswith("drop") else 0.24
                E.add_mono(drums, t, clap, gain=g, pan=0.10)
                E.add_mono(drums, t, snare, gain=g * 0.26, pan=-0.08)
            elif sec_arr == "break" and beat in (1, 3):
                E.add_mono(drums, t, clap, gain=0.10, pan=0.08)
            if hat_gain > 0.02:
                for s16 in range(4):
                    vel = 0.88 if s16 % 2 == 0 else 0.42
                    E.add_mono(drums, t + s16 * (SPB / 4), hat_c,
                               gain=hat_gain * 0.15 * vel, pan=-0.16)
            if hat_gain > 0.05 and sec_arr not in ("intro", "outro"):
                E.add_mono(drums, t + SPB / 2, hat_o, gain=hat_gain * 0.30, pan=0.14)
            if donk_gain > 0.02:
                E.add_mono(donk_bus, t + SPB / 2, donks[ci], gain=donk_gain * 1.22, pan=0.0)

        # Quiet minor pads (open-ish voicing, not a lead)
        if chord_gain > 0.04:
            cutoff = 2400 if sec_arr in ("intro", "break", "outro") else (
                3400 if sec_arr.startswith("build") else 4000
            )
            freqs = CHORD_HZ[ci]
            if sec_arr in ("intro", "break", "outro"):
                freqs = [freqs[0], freqs[2], freqs[3]]
            for f in freqs:
                L, R = E.supersaw_stereo(
                    f, BAR * 0.98,
                    det=11 if sec_arr.startswith("drop") else 9,
                    cutoff=cutoff,
                )
                E.add_stereo(music, t_body(bar), L, R, gain=chord_gain * 0.16)

        # Accelerating snare rolls into fills and pre-drops
        do_roll = (
            (sec_arr == "build1" and arr_bar >= 14)
            or (sec_arr == "build2" and arr_bar >= 78)
            or (drop_sec and phrase == 6)
            or (drop_sec and phrase16 == 15)
        )
        if do_roll and not (predrop_bar):  # roll lives in bar 14/78 and fill bars; predrop is silence
            last = (sec_arr == "build1" and arr_bar == 15) or (sec_arr == "build2" and arr_bar == 79) or (drop_sec and phrase16 == 15)
            # 8ths, then 16ths, then 32nds on the last bar
            if last:
                # first 3 beats 16ths, last beat skipped (pre-drop) — for in-drop last bars use 32nds all bar
                if drop_sec:
                    steps = 32
                    span = BAR
                else:
                    steps = 12
                    span = SPB * 3  # stop before the silent last beat
            else:
                steps = 16
                span = BAR
            for k in range(steps):
                pos = t_body(bar) + k * (span / steps)
                vel = 0.18 + 0.82 * (k / max(steps - 1, 1))
                g = (0.12 if sec_arr.startswith("build") else 0.15) * vel
                E.add_mono(drums, pos, snare, gain=g, pan=0.0)

        # Risers, white-noise sweeps, impacts
        if bar == 8:
            E.add_mono(fx, t_body(8), riser8, gain=0.30, pan=0.0)
        if bar == 12:
            E.add_mono(fx, t_body(12), riser4, gain=0.24, pan=0.0)
            E.add_mono(fx, t_body(14), sweep_2b, gain=0.36, pan=0.0)
        if bar == 72:
            E.add_mono(fx, t_body(72), riser8, gain=0.32, pan=0.0)
        if bar == 76:
            E.add_mono(fx, t_body(76), riser4, gain=0.26, pan=0.0)
            E.add_mono(fx, t_body(78), sweep_2b, gain=0.40, pan=0.0)
        if bar in (16, 80):
            E.add_mono(fx, t_body(bar), crash, gain=0.55, pan=0.0)
            E.add_mono(drums, t_body(bar), impact, gain=0.70, pan=0.0)
        if drop_sec and phrase == 0 and arr_bar not in (16, 80):
            # 8-bar phrase hits
            E.add_mono(fx, t_body(bar), crash, gain=0.28, pan=0.0)
        if drop_sec and phrase == 7:
            E.add_mono(fx, t_body(bar, 2), E.make_sweep(rng, SPB * 2), gain=0.20, pan=0.04)

        # Ear candy every 4 bars: reverse cymbal, chop, zap, downsweep
        if arr_bar % 4 == 3 and sec_arr in ("build1", "build2", "drop1", "drop2"):
            E.add_mono(fx, t_body(bar, 2), rev_cym, gain=0.22, pan=-0.12)
        if arr_bar % 4 == 0 and drop_sec and phrase not in (0,):
            E.add_mono(fx, t_body(bar) - 0.02, down_8th, gain=0.12, pan=0.1)
        if drop_sec and arr_bar % 4 == 2:
            E.add_mono(fx, t_body(bar, 3, 1), zaps[(arr_bar // 4) % len(zaps)], gain=0.16, pan=0.2)

        # ---------------- vocals ----------------
        # Intro: dry hook whisper in the last 4 bars (A then B)
        if sec_arr == "intro" and arr_bar in (4, 6):
            place_hook_at(bar, gain=0.42, layers="oct" if False else "thick", dry=True)
            # actually layers="thick" with dry lead: override by placing dry + quiet double
        # The above uses wet/dry lead via `dry=` and thick layers. For intro keep it intimate:
        # rebuild intro more quietly below if needed — thick is ok at 0.42.

        # Build 1: tease the hook, filtered later as a scene, growing
        if sec_arr == "build1" and arr_bar in (8, 10, 12):
            g = 0.48 if arr_bar == 8 else (0.62 if arr_bar == 10 else 0.80)
            place_hook_at(bar, gain=g, layers="thick" if arr_bar >= 10 else "thick", dry=arr_bar == 8)
        # Pre-drop vocal tag on the last beat-and-a-half of bar 15 / 79
        if predrop_bar:
            # tag starts at beat 2 so it finishes just before a short hole
            # tag file is 2 bars long but the energy is in the first ~1.1s; trim by gain envelope at place
            tag_t = t_body(bar, 2)
            place_stem(vocals, tag_t, bank["tag"], gain=1.05)

        # Drops: relentless 2-bar hook, full layers, rest/chops on bars 6-7 of each 8
        if drop_sec:
            if phrase < 6:
                # A/B alternation every 2 bars, already handled by place_hook_at
                layers = "full" if (arr_bar % 16) < 8 or phrase >= 2 else "thick"
                # first 8 of a 16: full; second 8: add more harm already in full
                place_hook_at(bar if (bar % 2 == 0) else None, gain=1.0, layers="full") if False else None
                if arr_bar % 2 == 0:
                    place_hook_at(bar, gain=1.00 if sec_arr == "drop1" else 1.04, layers="full")
            elif phrase == 6:
                # answer: chops + a dry echo of the landing word
                chop_cycle = ["chop_oh", "chop_hey", "chop_yeah", "chop_glen"]
                name = chop_cycle[(arr_bar // 8) % len(chop_cycle)]
                place_stem(vocals, t_body(bar, 0), bank[name], gain=0.85)
                place_stem(vocals, t_body(bar, 2), bank[chop_cycle[(arr_bar // 8 + 1) % len(chop_cycle)]], gain=0.70)
                # delay throw leftover of "hills"/"sleep" via dry B/A landing — already in wet stems
            elif phrase == 7:
                # pickup: last-half hook teaser or "yeah"
                place_stem(vocals, t_body(bar, 2), bank["chop_yeah"], gain=0.55)
                if arr_bar % 16 == 15:
                    # bigger throw into the next 16
                    place_stem(vocals, t_body(bar, 2, 1), bank["chop_up"], gain=0.45)

        # Break: sparse dry hook once, intimate
        if sec_arr == "break" and arr_bar in (64, 68):
            place_hook_at(bar, gain=0.55, layers="thick", dry=True)

        # Build 2: hook comes back bigger
        if sec_arr == "build2" and arr_bar in (72, 74, 76):
            g = 0.70 if arr_bar == 72 else (0.85 if arr_bar == 74 else 0.95)
            place_hook_at(bar, gain=g, layers="full")

        # Outro first 4 bars: fade the hook
        if sec == "outro" and src_bar in (136, 138):
            place_hook_at(bar, gain=0.50, layers="thick", dry=True)

        # Extra chops as ear candy every 4 bars in the drop (off-beat of bar 3)
        if drop_sec and arr_bar % 4 == 3 and phrase < 6:
            name = ["chop_oh", "chop_hey", "chop_yeah"][(arr_bar // 4) % 3]
            place_stem(vocals, t_body(bar, 3, 1), bank[name], gain=0.40)

    print("sidechain, width, low-end split, glue…")
    # Tight pump on everything except the kick. Vocals a little less so words stay clear.
    duck = E.sidechain(N, kick_times, depth=0.90, rel=0.155)
    duck_v = 0.28 + 0.72 * duck
    duck_d = 0.58 + 0.42 * duck  # donk sits on the off-beat; keep it loud
    music *= duck[:, None]
    drums *= duck[:, None]       # clap/hats/snares pump; kick is on its own bus
    fx *= duck[:, None]
    vocals *= duck_v[:, None]
    donk_bus *= duck_d[:, None]

    # Break scene: close the tops, keep kick + a quieter donk + dry-ish vocal
    br_a = int(round((preroll + 64 * BAR) * SR))
    br_b = int(round((preroll + 72 * BAR) * SR))
    tops = music + fx
    chunks = 16
    length = br_b - br_a
    for k in range(chunks):
        a = br_a + int(k * length / chunks)
        b = br_a + int((k + 1) * length / chunks)
        p = k / max(chunks - 1, 1)
        if p < 0.7:
            cut = 3800 - 3000 * (p / 0.7)
        else:
            cut = 800 + 4600 * ((p - 0.7) / 0.3)
        tops[a:b, 0] = E.sos_lp(tops[a:b, 0], cut)
        tops[a:b, 1] = E.sos_lp(tops[a:b, 1], cut)
        # also gently darken vocals in the middle of the break
        vocals[a:b, 0] = E.sos_lp(vocals[a:b, 0], cut + 800)
        vocals[a:b, 1] = E.sos_lp(vocals[a:b, 1], cut + 800)

    # Pre-drop hole: after the tag, ~120 ms of near-silence just before the downbeat
    for bar in (16, 80):
        # silence from 130 ms before the drop downbeat to the downbeat
        t_hit = t_body(bar)
        i1 = int(round(t_hit * SR))
        i0 = int(round((t_hit - 0.12) * SR))
        i0 = max(0, i0)
        # fade into the hole over 40 ms, keep a sliver of the tag tail if any
        fade_n = int(0.04 * SR)
        hole = np.ones(i1 - i0)
        if fade_n < len(hole):
            hole[:fade_n] = np.linspace(1.0, 0.04, fade_n)
            hole[fade_n:] = 0.04
        for bus in (drums, donk_bus, music, fx, vocals, kick_bus):
            bus[i0:i1] *= hole[:, None]

    mix = kick_bus * 1.00 + drums * 1.00 + donk_bus * 1.15 + tops * 1.0 + vocals * 1.95

    i0 = int(round(preroll * SR))
    target = int(round(BARS * 4 * SPB * SR))
    body = mix[i0:i0 + target].copy()
    if body.shape[0] < target:
        body = np.pad(body, ((0, target - body.shape[0]), (0, 0)))
    elif body.shape[0] > target:
        body = body[:target]

    body = body - np.mean(body, axis=0)

    # Clean low end (mono below 150 Hz) and a wide top
    body = E.mono_below(body, hz=150)
    body = E.widen_highs(body, hz=550, amount=1.40)

    # Kick-band presence without bringing the donk with it
    body[:, 0] = E.rbj(E.rbj(body[:, 0], 50, 0.90, "peak", gain_db=3.2), 72, 1.1, "peak", gain_db=1.8)
    body[:, 1] = E.rbj(E.rbj(body[:, 1], 50, 0.90, "peak", gain_db=3.2), 72, 1.1, "peak", gain_db=1.8)
    # Vocal presence shelf (intelligibility)
    body[:, 0] = E.rbj(E.rbj(body[:, 0], 3200, 0.85, "peak", gain_db=2.6), 1800, 0.9, "peak", gain_db=1.4)
    body[:, 1] = E.rbj(E.rbj(body[:, 1], 3200, 0.85, "peak", gain_db=2.6), 1800, 0.9, "peak", gain_db=1.4)

    # Arrangement envelope (tension and release across sections)
    from scipy.ndimage import uniform_filter1d
    n = len(body)
    sec_db = {
        "intro": -5.5, "build1": -1.2, "drop1": 0.0, "break": -6.0,
        "build2": -1.0, "drop2": 0.15, "outro": -4.0,
    }
    env = np.ones(n)
    for name, (a, b) in SEC.items():
        ia, ib = int(a * BAR * SR), min(int(b * BAR * SR), n)
        env[ia:ib] = 10 ** (sec_db[name] / 20.0)
    env = uniform_filter1d(env, size=int(0.25 * SR), mode="nearest")
    body *= env[:, None]

    # In-drop 8-bar movement (fill then breakdown/pickup)
    env2 = np.ones(n)
    for name in ("drop1", "drop2"):
        a, b = SEC[name]
        for bar in range(a, b):
            ph = bar % 8
            ia = int(bar * BAR * SR)
            ib = min(int((bar + 1) * BAR * SR), n)
            if ph == 6:
                env2[ia:ib] *= 0.78
            elif ph == 7:
                mid = (ia + ib) // 2
                env2[ia:mid] *= 0.42
                rise = np.linspace(0.42, 1.0, max(ib - mid, 1))
                env2[mid:ib] *= rise
    env2 = uniform_filter1d(env2, size=int(0.06 * SR), mode="nearest")
    body *= env2[:, None]

    # Bus glue then headroom
    peak = np.max(np.abs(body)) + 1e-12
    body = body / peak * 0.78
    body = E.glue(body, thresh=0.34, ratio=2.5, att_s=0.007, rel_s=0.13)
    body = E.seamless_loop(body, xfade_s=0.08, polish_s=0.012)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    tmp = OUT_DIR / "_premaster.wav"
    sf.write(str(tmp), body, SR, subtype="FLOAT")

    # Measure drop short-term LUFS and gain toward -8.5, then true-peak limit at -1 dB
    tmp_drop = OUT_DIR / "_drop_measure.wav"
    d1 = body[int(SEC["drop1"][0] * BAR * SR): int(SEC["drop1"][1] * BAR * SR)]
    d2 = body[int(SEC["drop2"][0] * BAR * SR): int(SEC["drop2"][1] * BAR * SR)]
    sf.write(str(tmp_drop), np.concatenate([d1, d2], axis=0), SR, subtype="FLOAT")
    st = lufs_ffmpeg(tmp_drop)
    print("drop LUFS before gain", {k: st[k] for k in st if k != "S"})
    # Aim short-term max at -8.5 LUFS (the brief is -9 to -8). Fall back to integrated + 1.2.
    cur_s = st.get("S_max")
    if cur_s is None:
        cur_s = st.get("I", -14.0) + 1.0
    target_s = -8.5
    gain_db = target_s - cur_s
    # don't slam more than +10 dB in one go (limiter would choke)
    gain_db = float(np.clip(gain_db, -6.0, 10.0))
    print(f"applying {gain_db:+.2f} dB to reach short-term ~{target_s} LUFS")
    body = body * (10 ** (gain_db / 20.0))
    # Oversampled true-peak limit at -1 dBTP (sample-peak limit on a 4x path)
    pre = OUT_DIR / "_prelimit.wav"
    post = OUT_DIR / "_postlimit.wav"
    sf.write(str(pre), body, SR, subtype="FLOAT")
    subprocess.check_call([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(pre),
        "-af", "aresample=176400,alimiter=limit=0.851138:attack=3:release=40:level=false,aresample=44100",
        "-c:a", "pcm_f32le", str(post),
    ])
    body, _sr = sf.read(str(post), always_2d=True)
    body = body.astype(np.float64)
    pre.unlink(missing_ok=True)
    post.unlink(missing_ok=True)
    body = E.seamless_loop(body, xfade_s=0.06, polish_s=0.010)

    # If the limiter pulled short-term well below -9, one gentle makeup pass
    sf.write(str(tmp_drop), np.concatenate([
        body[int(SEC["drop1"][0] * BAR * SR): int(SEC["drop1"][1] * BAR * SR)],
        body[int(SEC["drop2"][0] * BAR * SR): int(SEC["drop2"][1] * BAR * SR)],
    ], axis=0), SR, subtype="FLOAT")
    st2 = lufs_ffmpeg(tmp_drop)
    print("drop LUFS after limit", {k: st2[k] for k in st2 if k != "S"})
    smax = st2.get("S_max")
    if smax is not None and smax < -9.05 and st2.get("TP", 0) <= -1.0:
        make_up = min(-8.6 - smax, 1.2)
        print(f"makeup {make_up:+.2f} dB")
        body = body * (10 ** (make_up / 20.0))
        pre = OUT_DIR / "_prelimit.wav"
        post = OUT_DIR / "_postlimit.wav"
        sf.write(str(pre), body, SR, subtype="FLOAT")
        subprocess.check_call([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(pre),
            "-af", "aresample=176400,alimiter=limit=0.851138:attack=3:release=40:level=false,aresample=44100",
            "-c:a", "pcm_f32le", str(post),
        ])
        body, _sr = sf.read(str(post), always_2d=True)
        body = body.astype(np.float64)
        pre.unlink(missing_ok=True)
        post.unlink(missing_ok=True)
        sf.write(str(tmp_drop), np.concatenate([
            body[int(SEC["drop1"][0] * BAR * SR): int(SEC["drop1"][1] * BAR * SR)],
            body[int(SEC["drop2"][0] * BAR * SR): int(SEC["drop2"][1] * BAR * SR)],
        ], axis=0), SR, subtype="FLOAT")
        st2 = lufs_ffmpeg(tmp_drop)
        print("drop LUFS after makeup", {k: st2[k] for k in st2 if k != "S"})

    wav = OUT_DIR / "music-hardcore.wav"
    mp3 = OUT_DIR / "music-hardcore.mp3"
    sf.write(str(wav), body, SR, subtype="PCM_24")
    subprocess.check_call([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(wav), "-c:a", "pcm_s24le", "-ar", "44100", str(wav) + ".tmp.wav",
    ])
    Path(str(wav) + ".tmp.wav").replace(wav)

    def enc(src, dst, *codec):
        subprocess.check_call(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-i", str(src), *codec, "-ar", "44100", str(dst)]
        )

    enc(wav, mp3, "-codec:a", "libmp3lame", "-b:a", "192k")
    enc(wav, MUSIC / "hardcore_remix.mp3", "-codec:a", "libmp3lame", "-b:a", "160k")
    enc(wav, MUSIC / "hardcore_remix.ogg", "-codec:a", "libvorbis", "-q:a", "4")
    print("game assets", (MUSIC / "hardcore_remix.mp3").stat().st_size,
          (MUSIC / "hardcore_remix.ogg").stat().st_size)

    y, sr = sf.read(str(wav))

    def cut(name, bar_a, bar_b):
        a = int(bar_a * BAR * sr)
        b = int(bar_b * BAR * sr)
        p = OUT_DIR / f"section-{name}.wav"
        sf.write(str(p), y[a:b], sr, subtype="PCM_24")
        enc(p, OUT_DIR / f"section-{name}.mp3", "-codec:a", "libmp3lame", "-b:a", "192k")

    for name, (a, b) in SEC.items():
        cut(name, a, b)

    n2 = int(2.0 * sr)
    join = np.concatenate([y[-n2:], y[:n2]], axis=0)
    sf.write(str(OUT_DIR / "loop-join.wav"), join, sr, subtype="PCM_24")
    enc(OUT_DIR / "loop-join.wav", OUT_DIR / "loop-join.mp3", "-codec:a", "libmp3lame", "-b:a", "192k")

    # Drop preview (~ first 32 bars of drop 1, ~46.5 s) and a shorter 16-bar drop hit
    def preview(name, bar_a, bar_b):
        a = int(bar_a * BAR * sr)
        b = min(int(bar_b * BAR * sr), len(y))
        wav_p = OUT_DIR / f"{name}.wav"
        mp3_p = OUT_DIR / f"{name}.mp3"
        sf.write(str(wav_p), y[a:b], sr, subtype="PCM_24")
        enc(wav_p, mp3_p, "-codec:a", "libmp3lame", "-b:a", "192k")
        print(f"preview {mp3_p}  {(b-a)/sr:.2f}s")
        return mp3_p

    preview("preview-hardcore-drop", SEC["drop1"][0], SEC["drop1"][0] + 32)
    preview("preview-hardcore-arrange", 8, 40)          # build + drop hit
    preview("preview-hardcore-break-in", SEC["drop1"][1] - 16, SEC["build2"][0] + 8)
    preview("preview-hardcore-tag", 14, 20)             # pre-drop tag + impact
    # full track already at music-hardcore.mp3

    # A/B vs reference
    ref_path = Path("/workspace/qa/audio-1260/ref/t1132-ref.wav")
    report = {"drop": {k: st2[k] for k in st2 if k != "S"}}
    if ref_path.exists():
        ref, ref_sr = sf.read(str(ref_path), always_2d=True)
        if ref_sr != sr:
            import librosa
            ref = np.stack([librosa.resample(ref[:, ch], orig_sr=ref_sr, target_sr=sr) for ch in range(ref.shape[1])], 1)
        drop17 = y[int(SEC["drop1"][0] * BAR * sr): int((SEC["drop1"][0] * BAR + 17.28) * sr)]
        nref = min(len(ref), len(drop17))
        cos, va, vb = band_cosine(drop17[:nref], ref[:nref], sr)
        report["band_cosine_vs_t1132"] = cos
        bands = ["20-40", "40-60", "60-80", "80-100", "100-150", "150-200",
                 "200-300", "300-500", "500-800", "800-1200", "1200-2000",
                 "2000-4000", "4000-8000", "8000-16000"]
        report["drop_bands"] = dict(zip(bands, va.tolist()))
        report["ref_bands"] = dict(zip(bands, vb.tolist()))
        print(f"band cosine vs t1132-ref (17s drop1): {cos:.3f}")
        print("drop bands", report["drop_bands"])
        print("ref  bands", report["ref_bands"])
        # spectrogram
        ab = OUT_DIR / "ab"
        ab.mkdir(exist_ok=True)
        ref_wav = ab / "_ref17.wav"
        drop_wav = ab / "_drop17.wav"
        sf.write(str(ref_wav), ref[:nref], sr, subtype="PCM_24")
        sf.write(str(drop_wav), drop17[:nref], sr, subtype="PCM_24")

        def spec_pic(src, dst, title):
            subprocess.check_call([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-i", str(src),
                "-lavfi",
                f"showspectrumpic=s=1920x720:mode=combined:legend=1:scale=log:fscale=log:color=magma:saturation=1:start=30:stop=16000",
                str(dst),
            ])

        spec_pic(ref_wav, ab / "t1132-ref-spec.png", "ref")
        spec_pic(drop_wav, ab / "new-drop1-spec.png", "drop")
        # stacked comparison
        subprocess.check_call([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(ab / "t1132-ref-spec.png"),
            "-i", str(ab / "new-drop1-spec.png"),
            "-filter_complex", "vstack=inputs=2",
            str(ab / "drop-vs-ref-spec.png"),
        ])
        ref_wav.unlink(missing_ok=True)
        drop_wav.unlink(missing_ok=True)
        print("spectrogram", ab / "drop-vs-ref-spec.png")

    full_st = lufs_ffmpeg(wav)
    report["full"] = {k: full_st[k] for k in full_st if k != "S"}
    report["clips"] = int(np.sum(np.abs(y) >= 0.999))
    report["peak"] = float(np.max(np.abs(y)))
    (OUT_DIR / "ANALYSIS.json").write_text(json.dumps(report, indent=2))
    print("full", report["full"], "clips", report["clips"], "peak", report["peak"])

    tmp.unlink(missing_ok=True)
    tmp_drop.unlink(missing_ok=True)
    print("done", wav, "dur", len(y) / sr, "wrap step", float(np.max(np.abs(y[0] - y[-1]))))
    return wav


if __name__ == "__main__":
    render()
