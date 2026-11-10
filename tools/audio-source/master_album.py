#!/usr/bin/env python3
"""Per-section loudness matching for energetic Album tracks.

Drops are aimed at about -9 LUFS short-term without a global gain that
would flatten intros and breaks. Order: section gain envelope, light glue,
parallel compression, saturation, soft clipper, then a true-peak limiter
at -1 dB TP. Calm / beatless cues should keep album_lib.loop_master.
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np

import album_lib as A
import album_cinema as C
import engine1260 as E

SR = A.SR

DROP_KEYS = (
    "drop", "flash", "flare", "whiteout", "coil", "stand", "clash",
    "hunt", "rally", "last_stand", "press", "clash", "chase", "prism", "close_in",
)
BUILD_KEYS = ("build", "lift", "kindle", "climb", "call", "pre", "undertow", "path", "eye", "pulse")
BREAK_KEYS = ("break", "ash", "blackwater", "heather", "bare", "mist", "bind", "slip")
INTRO_KEYS = (
    "intro", "spark", "depth", "approach", "lights", "curtain", "outro",
    "ember", "home", "surface", "last", "home", "mist", "open",
)

TARGETS = {"drop": -9.0, "build": -12.0, "break": -16.0, "intro": -18.0, "mid": -13.5}


def role_of(name: str) -> str:
    n = (name or "").lower()
    for k in DROP_KEYS:
        if k in n:
            return "drop"
    for k in BUILD_KEYS:
        if k in n:
            return "build"
    for k in BREAK_KEYS:
        if k in n:
            return "break"
    for k in INTRO_KEYS:
        if k in n:
            return "intro"
    return "mid"


def _lufs(x, sr=SR):
    try:
        v = A.lufs_integrated(x, sr)
        return float(v) if math.isfinite(v) else -70.0
    except Exception:
        rms = float(np.sqrt(np.mean(np.square(x))) + 1e-12)
        return 20.0 * math.log10(rms) - 0.5


def _soft_clip(y, drive_db=3.0, ceiling=10 ** (-2.2 / 20.0)):
    g = 10 ** (drive_db / 20.0)
    z = np.asarray(y, dtype=np.float64) * g
    a = ceiling
    z = a * np.tanh(z / max(a, 1e-9))
    return z


def _parallel_comp(y, mix=0.38):
    comp = E.compress_bus(y, thresh=0.16, ratio=4.2, att_s=0.0035, rel_s=0.070, makeup=1.0)
    # match peak-ish level so the mix is colour, not a jump
    py = float(np.max(np.abs(y)) + 1e-12)
    pc = float(np.max(np.abs(comp)) + 1e-12)
    comp = comp * (py / pc)
    return (1.0 - mix) * y + mix * comp


def section_gains(audio, sections, sr=SR, targets=None, max_boost_db=8.0, max_cut_db=10.0):
    """Return a smooth per-sample gain envelope from section LUFS targets."""
    targets = dict(TARGETS if targets is None else {**TARGETS, **targets})
    n = len(audio)
    t = np.arange(n) / sr
    knots_t, knots_g = [0.0], [1.0]
    measured = []
    for item in sections:
        name, a, b = item[0], float(item[1]), float(item[2])
        role = item[3] if len(item) > 3 else role_of(name)
        i0, i1 = int(max(0, a * sr)), int(min(n, b * sr))
        if i1 - i0 < sr // 4:
            continue
        cur = _lufs(audio[i0:i1], sr)
        tgt = targets.get(role, targets["mid"])
        db = tgt - cur
        db = max(-max_cut_db, min(max_boost_db, db))
        # intros/breaks may be much quieter than -18; don't boost them up to target if
        # they were intentionally almost silent (e.g. till_the_hills mist at -47).
        if role in ("intro", "break") and cur < tgt - 8:
            db = min(db, 3.0)
        g = 10 ** (db / 20.0)
        knots_t.append((a + b) * 0.5)
        knots_g.append(g)
        measured.append(dict(name=name, role=role, start=a, end=b, lufs=cur, target=tgt, gain_db=db))
    knots_t.append(n / sr)
    knots_g.append(knots_g[-1])
    # gentle ramps: interpolate in dB
    db = 20.0 * np.log10(np.clip(knots_g, 1e-4, 20))
    env_db = np.interp(t, knots_t, db)
    env = 10 ** (env_db / 20.0)
    # 80 ms smoothing
    win = max(8, int(0.08 * sr))
    ker = np.hanning(win)
    ker /= ker.sum()
    pad = win // 2
    env = np.convolve(np.pad(env, (pad, pad), mode="edge"), ker, mode="same")[pad:pad + n]
    return env.astype(np.float64), measured


def festive_master(audio, sections, sr=SR, ceiling_db=-1.0, xfade_s=1.4,
                   clip_drive_db=3.2, sat_drive=1.6, par_mix=0.36, targets=None):
    """Master an energetic track with per-section loudness matching."""
    y = np.asarray(audio, dtype=np.float64)
    if y.ndim == 1:
        y = np.stack([y, y], 1)
    if xfade_s and xfade_s > 0:
        y = E.seamless_loop(y, xfade_s=xfade_s, polish_s=0.02)
    y = A.highpass(y, 28.0)
    # Colour first (parallel comp, sat, clipper, presence), then match
    # section loudness so the clipper cannot flatten intros into the drops.
    y = E.glue(y, thresh=0.50, ratio=1.45, att_s=0.008, rel_s=0.16)
    y = A.mono_low_wide_high(y, split=118, side_gain=1.10)
    y = _parallel_comp(y, mix=par_mix)
    y = C.saturate(y, drive=sat_drive, mix=0.32)
    y = E.parallel_sat(y, drive=2.1, mix=0.22, hp=70, focus_hz=90)
    try:
        from scipy.signal import sosfilt, butter
        sos_p = butter(1, [2200, 5600], btype="band", fs=sr, output="sos")
        presence = np.stack([sosfilt(sos_p, y[:, 0]), sosfilt(sos_p, y[:, 1])], 1)
        y = y + 0.18 * presence
        sos_a = butter(1, 8000, btype="highpass", fs=sr, output="sos")
        air = np.stack([sosfilt(sos_a, y[:, 0]), sosfilt(sos_a, y[:, 1])], 1)
        y = y + 0.06 * air
    except Exception:
        pass
    y = _soft_clip(y, drive_db=clip_drive_db, ceiling=10 ** (-2.0 / 20.0))
    env, measured = section_gains(y, sections, sr=sr, targets=targets)
    y = y * env[:, None]
    # If a drop is hotter than about -8.4 LUFS, trim it before the limiter.
    for rec in measured:
        if rec["role"] != "drop":
            continue
        i0, i1 = int(rec["start"] * sr), int(min(len(y), rec["end"] * sr))
        cur = _lufs(y[i0:i1], sr)
        if cur > -8.4:
            pad = int(0.08 * sr)
            a0, a1 = max(0, i0 - pad), min(len(y), i1 + pad)
            g = 10 ** ((-8.8 - cur) / 20.0)
            ramp = np.ones(a1 - a0)
            ramp[: max(1, i0 - a0)] = np.linspace(1.0, g, max(1, i0 - a0))
            if a1 > i1:
                ramp[-(a1 - i1):] = np.linspace(g, 1.0, max(1, a1 - i1))
            ramp[i0 - a0: i1 - a0] = g
            y[a0:a1] *= ramp[:, None]
    if xfade_s and xfade_s > 0:
        y = E.seamless_loop(y, xfade_s=min(0.4, xfade_s * 0.25), polish_s=0.015)
    ceiling = 10 ** (ceiling_db / 20.0)
    y = E.limiter(y, ceiling=ceiling, look_ms=6)
    tp = A.true_peak(y)
    if tp > ceiling:
        y = y * (ceiling / tp)
        y = E.limiter(y, ceiling=ceiling, look_ms=4)
    # Short wrap after the limiter so the loop join stays clean, then a
    # downward scale only (no second limiter) if the crossfade nudges TP.
    y = E.seamless_loop(y, xfade_s=0.04, polish_s=0.008)
    tp = A.true_peak(y)
    if tp > ceiling:
        y = y * (ceiling / tp)
    post = []
    for rec in measured:
        i0, i1 = int(rec["start"] * sr), int(min(len(y), rec["end"] * sr))
        post.append({**rec, "post_lufs": _lufs(y[i0:i1], sr)})
    return y, post


def remaster_wav(path, sections, dest=None, **kw):
    import soundfile as sf
    y, sr = sf.read(str(path), always_2d=True)
    if sr != SR:
        # rare; album is 44.1k
        import librosa
        y = np.stack([librosa.resample(y[:, 0], orig_sr=sr, target_sr=SR),
                      librosa.resample(y[:, 1], orig_sr=sr, target_sr=SR)], 1)
        sr = SR
    out, post = festive_master(y, sections, sr=sr, **kw)
    dest = Path(dest) if dest else Path(path)
    sf.write(str(dest), out, sr, subtype="FLOAT")
    return out, post
