#!/usr/bin/env python3
"""1.2.50 Happy Hardcore remix — UK bounce / donk, no piano.

Pro-quality offline render: layered kick, FM+resonant donk / reverse-bass,
detuned supersaw chords with hard sidechain, stacked claps, and a musical
Glencraft-derived lead (not chopped grains). 170 BPM, short builds, long
drops, a clearer filtered break, seamless loop. Drops target -14 LUFS;
builds must not peak louder than the drops; LRA aims for 6+ LU.
Procedural synthesis plus the game's own music/ assets only.
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
import engine1250 as E

ROOT = Path(__file__).resolve().parents[2]
MUSIC = ROOT / "music"
OUT_DIR = Path(os.environ.get("HC_OUT", "/workspace/qa/audio-1250"))

SR = E.SR
BPM = 170.0
SPB = 60.0 / BPM
BAR = 4 * SPB
BARS = 144
PREROLL_BARS = 2
SEED = 1250

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

CHORD_HZ = [
    [146.83, 185.00, 220.00, 293.66],  # D
    [220.00, 277.18, 329.63, 440.00],  # A
    [123.47, 185.00, 246.94, 293.66],  # Bm
    [196.00, 246.94, 293.66, 392.00],  # G
]
BASS = [73.42, 110.00, 61.74, 98.00]

# Musical hooks: (eighth-index in a 2-bar phrase 0..15, midi, duration in 8ths)
# Derived from the highland-mist D–E–F shape, raised to D major, nightcore register.
# Two-bar phrases sit over D→A (ci % 4 == 0) or Bm→G (ci % 4 == 2).
# Notes are chosen so they are chord tones or safe extensions on both bars
# of the phrase (no G-against-F# on D/Bm, no long C# against G).
HOOK_A_DA = [
    (0, 86, 2), (2, 88, 1), (3, 90, 1), (4, 93, 2), (6, 90, 1), (7, 88, 1),
    (8, 90, 2), (10, 93, 1), (11, 95, 1), (12, 93, 2), (14, 90, 1), (15, 86, 1),
]
HOOK_A_BmG = [
    (0, 86, 2), (2, 88, 1), (3, 90, 1), (4, 93, 2), (6, 90, 1), (7, 88, 1),
    (8, 91, 2), (10, 93, 1), (11, 95, 1), (12, 93, 2), (14, 86, 1), (15, 91, 1),
]
HOOK_B_DA = [
    (0, 90, 2), (2, 88, 1), (3, 93, 1), (4, 95, 2), (6, 93, 1), (7, 90, 1),
    (8, 90, 1), (9, 93, 1), (10, 95, 1), (11, 98, 1), (12, 97, 2), (14, 95, 1), (15, 90, 1),
]
HOOK_B_BmG = [
    (0, 90, 2), (2, 88, 1), (3, 93, 1), (4, 95, 2), (6, 93, 1), (7, 86, 1),
    (8, 91, 2), (10, 93, 1), (11, 95, 1), (12, 98, 2), (14, 95, 1), (15, 91, 1),
]
# Break colour: highland dorian, sparse (not a hook wall)
HOOK_PIPE = [
    (0, 74, 2), (2, 76, 2), (4, 77, 2), (6, 79, 2),
    (8, 81, 2), (10, 79, 2), (12, 77, 2), (14, 76, 2),
]


def midi_hz(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def section_at(bar):
    for name, (a, b) in SEC.items():
        if a <= bar < b:
            return name
    return "outro"


def lufs_ffmpeg(path):
    r = subprocess.check_output(
        ["ffmpeg", "-hide_banner", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
        stderr=subprocess.STDOUT, text=True,
    )
    sm = r.split("Summary:")[-1]
    out = {}
    for line in sm.splitlines():
        if line.strip().startswith("I:"):
            out["I"] = float(line.split("I:")[1].split("LUFS")[0].strip())
        if line.strip().startswith("LRA:"):
            out["LRA"] = float(line.split("LRA:")[1].split("LU")[0].strip())
        if "Peak:" in line and "dBFS" in line:
            out["TP"] = float(line.split("Peak:")[1].split("dBFS")[0].strip())
    return out


def cap_sections(body, sr=SR):
    """Guarantee drops are the loudest (RMS and short-term peak)."""
    drop_slices = []
    for name in ("drop1", "drop2"):
        a, b = SEC[name]
        drop_slices.append(body[int(a * BAR * sr): int(b * BAR * sr)])
    drop = np.concatenate(drop_slices, axis=0)
    drop_rms = float(np.sqrt(np.mean(drop ** 2)))
    drop_peak = float(np.max(np.abs(drop)))
    # 80 ms windows
    win = int(0.08 * sr)
    rms = np.sqrt(np.convolve(np.mean(body ** 2, axis=1), np.ones(win) / win, mode="same"))
    peak = np.max(np.abs(body), axis=1)
    peak_s = np.convolve(peak, np.ones(win) / win, mode="same")
    target_rms = drop_rms * 0.92  # ~ -0.7 dB under the drop
    target_peak = drop_peak * 0.95
    gain = np.ones(len(body))
    # only cap non-drop regions
    mask = np.ones(len(body), dtype=bool)
    for name in ("drop1", "drop2"):
        a, b = SEC[name]
        mask[int(a * BAR * sr): int(b * BAR * sr)] = False
    need = mask & ((rms > target_rms) | (peak_s > target_peak))
    scale = np.ones(len(body))
    scale[need] = np.minimum(
        target_rms / (rms[need] + 1e-12),
        target_peak / (peak_s[need] + 1e-12),
    )
    scale = np.clip(scale, 0.4, 1.0)
    # smooth
    k = int(0.04 * sr)
    scale = np.convolve(scale, np.hanning(k * 2 + 1) / np.hanning(k * 2 + 1).sum(), mode="same")
    scale = np.minimum(scale, 1.0)
    return body * scale[:, None], drop_rms, drop_peak



def shape_arrangement(body, sr=SR):
    """Widen LRA (~6 LU) and deepen the break; drop loudness is retargeted after."""
    from scipy.ndimage import uniform_filter1d
    n = len(body)
    sec_db = {
        "intro": 4.6, "build1": -0.4, "drop1": 0.0, "break": -6.4,
        "build2": -1.0, "drop2": 0.0, "outro": 0.5,
    }
    env = np.ones(n)
    for name, (a, b) in SEC.items():
        ia, ib = int(a * BAR * sr), min(int(b * BAR * sr), n)
        env[ia:ib] = 10 ** (sec_db[name] / 20.0)
    env = uniform_filter1d(env, size=int(0.35 * sr), mode="nearest")
    y = body * env[:, None]
    ia = int(SEC["break"][0] * BAR * sr)
    ib = min(int(SEC["break"][1] * BAR * sr), n)
    xf = int(0.25 * sr)
    br = y[ia:ib].copy()
    br_lp = np.stack([E.sos_lp(br[:, 0], 1400, 2), E.sos_lp(br[:, 1], 1400, 2)], 1)
    w = np.ones(len(br))
    w[:xf] = np.linspace(0, 1, xf)
    w[-xf:] = np.linspace(1, 0, xf)
    y[ia:ib] = br * (1 - w)[:, None] + br_lp * w[:, None]
    return y


def render():
    rng = np.random.default_rng(SEED)
    body_len = BARS * 4 * SPB
    preroll = PREROLL_BARS * 4 * SPB
    N = int(round((preroll + body_len) * SR))

    def t_body(bar, beat=0, eighth=0):
        return preroll + bar * BAR + beat * SPB + eighth * (SPB / 2)

    drums = np.zeros((N, 2))
    donk_bus = np.zeros((N, 2))
    music = np.zeros((N, 2))
    lead = np.zeros((N, 2))
    fx = np.zeros((N, 2))
    kick_times = []

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

    print("scheduling 144 bars…")
    for bar in range(-PREROLL_BARS, BARS):
        src_bar = bar if bar >= 0 else bar + BARS
        sec = section_at(src_bar)
        ci = src_bar % 4

        # Last 4 outro bars musically match intro bars 0–3 (loop join).
        if sec == "outro" and src_bar >= 140:
            sec_arr = "intro"
            arr_bar = src_bar - 140  # 0..3
        else:
            sec_arr = sec
            arr_bar = src_bar

        kick_gain = {
            "intro": 0.0 if arr_bar % 144 < 4 else 0.62,
            "build1": 0.82,
            "drop1": 1.0,
            "break": 0.86,
            "build2": 0.88,
            "drop2": 1.0,
            "outro": 0.55,
        }[sec_arr]
        if sec_arr == "intro" and (arr_bar % 144) >= 4:
            kick_gain = 0.48 + 0.07 * ((arr_bar % 144) - 4)

        donk_gain = {
            "intro": 0.0 if (arr_bar % 144) < 6 else 0.4,
            "build1": 0.62 if arr_bar < 12 else 0.82,
            "drop1": 1.0,
            "break": 0.92,
            "build2": 0.88,
            "drop2": 1.04,
            "outro": 0.4,
        }[sec_arr]

        hat_gain = {
            "intro": 0.12 if (arr_bar % 144) >= 6 else 0.0,
            "build1": 0.35 if arr_bar < 12 else 0.55,
            "drop1": 0.70,
            "break": 0.22,
            "build2": 0.6,
            "drop2": 0.78,
            "outro": 0.12,
        }[sec_arr]

        chord_gain = {
            "intro": 0.16 if (arr_bar % 144) >= 2 else 0.12,
            "build1": 0.32,
            "drop1": 0.52,
            "break": 0.16,
            "build2": 0.36,
            "drop2": 0.54,
            "outro": 0.14,
        }[sec_arr]

        lead_on = sec_arr in ("drop1", "drop2") or (sec_arr == "build2" and arr_bar >= 76)
        pipe_on = sec_arr == "break"

        for beat in range(4):
            t = t_body(bar, beat)
            if kick_gain > 0.02:
                E.add_mono(drums, t, kick, gain=kick_gain * 1.12, pan=0.0)
                kick_times.append(t)
            if sec_arr in ("drop1", "drop2", "build1", "build2") and beat in (1, 3):
                g = 0.40 if sec_arr.startswith("drop") else 0.22
                E.add_mono(drums, t, clap, gain=g, pan=0.08)
                E.add_mono(drums, t, snare, gain=g * 0.28, pan=-0.1)
            elif sec_arr == "break" and beat in (1, 3):
                E.add_mono(drums, t, clap, gain=0.12, pan=0.08)
            if hat_gain > 0.02:
                # 16ths are quiet; the off-beat open hat is the "tss"
                for s16 in range(4):
                    vel = 0.85 if s16 % 2 == 0 else 0.45
                    E.add_mono(drums, t + s16 * (SPB / 4), hat_c,
                               gain=hat_gain * 0.14 * vel, pan=-0.14)
            if hat_gain > 0.05 and sec_arr not in ("intro", "outro"):
                E.add_mono(drums, t + SPB / 2, hat_o, gain=hat_gain * 0.28, pan=0.12)
            if donk_gain > 0.02:
                E.add_mono(donk_bus, t + SPB / 2, donks[ci], gain=donk_gain * 1.05, pan=0.0)

        if chord_gain > 0.04:
            cutoff = 4000 if sec_arr in ("intro", "break", "outro") else (
                6200 if sec_arr.startswith("build") else 8200
            )
            if sec_arr == "drop2":
                cutoff = 8800
            # Break keeps open fifths so the highland dorian pipe doesn't clash
            # with a major 3rd (F vs F#).
            freqs = CHORD_HZ[ci]
            if sec_arr == "break":
                freqs = [freqs[0], freqs[2], freqs[3]] if len(freqs) >= 4 else freqs
            for j, f in enumerate(freqs):
                L, R = E.supersaw_stereo(f, BAR * 0.98, det=17 if sec_arr.startswith("drop") else 13,
                                         cutoff=cutoff)
                E.add_stereo(music, t_body(bar), L, R, gain=chord_gain * 0.20)

        # Quiet snare rolls — builds must not out-peak the drop
        do_roll = (
            (sec_arr == "build1" and arr_bar >= 12)
            or (sec_arr == "build2" and arr_bar >= 76)
            or (sec_arr in ("drop1", "drop2") and arr_bar % 16 >= 14)
        )
        if do_roll:
            last = arr_bar in (15, 79) or (sec_arr in ("drop1", "drop2") and arr_bar % 16 == 15)
            div = 8 if last else 4
            steps = 4 * div
            for k in range(steps):
                pos = t_body(bar) + k * (BAR / steps)
                vel = 0.15 + 0.85 * (k / max(steps - 1, 1))
                g = (0.11 if sec_arr.startswith("build") else 0.14) * vel
                E.add_mono(drums, pos, snare, gain=g, pan=0.0)

        # Risers kept modest so the build does not out-shout the drop
        if bar == 8:
            E.add_mono(fx, t_body(8), riser8, gain=0.28, pan=0.0)
        if bar == 12:
            E.add_mono(fx, t_body(12), riser4, gain=0.20, pan=0.0)
        if bar == 72:
            E.add_mono(fx, t_body(72), riser8, gain=0.30, pan=0.0)
        if bar == 76:
            E.add_mono(fx, t_body(76), riser4, gain=0.22, pan=0.0)
        if bar in (15, 79):
            E.add_mono(fx, t_body(bar, 2), E.make_sweep(rng, SPB * 2), gain=0.28, pan=0.0)
        if bar in (16, 80):
            E.add_mono(fx, t_body(bar), crash, gain=0.48, pan=0.0)
            E.add_mono(drums, t_body(bar), impact, gain=0.55, pan=0.0)
        if sec_arr in ("drop1", "drop2") and src_bar % 8 == 7:
            E.add_mono(fx, t_body(bar, 2), E.make_sweep(rng, SPB * 2), gain=0.18, pan=0.04)

        # Musical lead (not grains). Off during the break.
        if lead_on:
            if sec_arr in ("drop1", "build2"):
                hook = HOOK_A_DA if ci % 4 == 0 else HOOK_A_BmG
            else:
                hook = HOOK_B_DA if ci % 4 == 0 else HOOK_B_BmG
            if arr_bar % 2 == 0:
                t0 = t_body(bar)
                g = 0.68 if sec_arr.startswith("drop") else 0.38
                for pos, mid, dur in hook:
                    L, R = E.lead_note(midi_hz(mid), dur * (SPB / 2) * 0.95)
                    E.add_stereo(lead, t0 + pos * (SPB / 2), L, R, gain=g)

        # Break: highland chanter colour, sparse, no hook wall
        if pipe_on and arr_bar % 2 == 0:
            t0 = t_body(bar)
            for pos, mid, dur in HOOK_PIPE:
                # slightly bagpipe-ish: two close saws already in lead_note; keep quieter
                L, R = E.lead_note(midi_hz(mid), dur * (SPB / 2) * 0.9, cutoff=3200)
                E.add_stereo(lead, t0 + pos * (SPB / 2), L, R, gain=0.28)

    print("sidechain, delay, break filter, glue…")
    duck = E.sidechain(N, kick_times, depth=0.80, rel=0.12)
    music *= duck[:, None]
    lead *= (0.32 + 0.68 * duck)[:, None]
    lead = E.ping_pong_delay(lead, delay_s=SPB * 0.75, fb=0.26, mix=0.20)
    lead[:, 0] = E.rbj(lead[:, 0], 1500, 1.0, "peak", gain_db=-2.5)
    lead[:, 1] = E.rbj(lead[:, 1], 1500, 1.0, "peak", gain_db=-2.5)

    # Break scene change: sweep the tops (music+lead+fx) down, keep kick+donk
    br_a = int(round((preroll + 64 * BAR) * SR))
    br_b = int(round((preroll + 72 * BAR) * SR))
    tops = music + lead + fx
    # filter in 8 chunks across the break: close, stay dark, open into build 2
    chunks = 16
    length = br_b - br_a
    for k in range(chunks):
        a = br_a + int(k * length / chunks)
        b = br_a + int((k + 1) * length / chunks)
        p = k / max(chunks - 1, 1)
        # down to ~700 Hz in the middle, reopen at the end
        if p < 0.7:
            cut = 4200 - 3400 * (p / 0.7)
        else:
            cut = 700 + 5000 * ((p - 0.7) / 0.3)
        tops[a:b, 0] = E.sos_lp(tops[a:b, 0], cut)
        tops[a:b, 1] = E.sos_lp(tops[a:b, 1], cut)
    music = np.zeros_like(music)  # already summed into tops
    lead = np.zeros_like(lead)
    fx = tops  # reuse

    mix = drums * 1.00 + donk_bus * 2.20 + fx * 1.0

    i0 = int(round(preroll * SR))
    target = int(round(BARS * 4 * SPB * SR))
    body = mix[i0:i0 + target].copy()
    if body.shape[0] < target:
        body = np.pad(body, ((0, target - body.shape[0]), (0, 0)))
    elif body.shape[0] > target:
        body = body[:target]

    body = body - np.mean(body, axis=0)
    body, drop_rms, drop_peak = cap_sections(body)
    print(f"after cap: drop_rms={drop_rms:.4f} drop_peak={drop_peak:.4f}")

    # Gentle glue, plenty of headroom, then aim drops at -14 LUFS
    peak = np.max(np.abs(body)) + 1e-12
    body = body / peak * 0.80
    body = E.glue(body, thresh=0.48, ratio=1.6)
    body = E.limiter(body, ceiling=10 ** (-1.3 / 20.0))
    body = E.seamless_loop(body, xfade_s=0.08, polish_s=0.012)
    body = shape_arrangement(body)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    raw = OUT_DIR / "music-hardcore-pre-loudnorm.wav"
    sf.write(str(raw), body, SR, subtype="FLOAT")

    # Measure drop loudness and apply a linear gain so drops sit at -14 LUFS
    tmp_drop = OUT_DIR / "_drop_measure.wav"
    d1 = body[int(SEC["drop1"][0] * BAR * SR): int(SEC["drop1"][1] * BAR * SR)]
    d2 = body[int(SEC["drop2"][0] * BAR * SR): int(SEC["drop2"][1] * BAR * SR)]
    sf.write(str(tmp_drop), np.concatenate([d1, d2], axis=0), SR, subtype="FLOAT")
    st = lufs_ffmpeg(tmp_drop)
    print("drop LUFS before gain", st)
    target_lufs = -14.0
    cur = st.get("I", -16.0)
    gain_db = target_lufs - cur
    # leave 0.3 dB so the limiter doesn't have to crush
    gain = 10 ** ((gain_db - 0.15) / 20.0)
    body = body * gain
    body = E.limiter(body, ceiling=10 ** (-1.1 / 20.0))
    body = E.seamless_loop(body, xfade_s=0.06, polish_s=0.010)
    tmp_drop.unlink(missing_ok=True)

    wav = OUT_DIR / "music-hardcore.wav"
    mp3 = OUT_DIR / "music-hardcore.mp3"
    sf.write(str(wav), body, SR, subtype="PCM_24")
    # rewrite through ffmpeg to guarantee 44.1 kHz pcm
    subprocess.check_call(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-i", str(wav), "-c:a", "pcm_s24le", "-ar", "44100", str(wav) + ".tmp.wav"]
    )
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
    raw.unlink(missing_ok=True)
    print("done", wav, "dur", len(y) / sr, "wrap step", float(np.max(np.abs(y[0] - y[-1]))))
    return wav


if __name__ == "__main__":
    render()
