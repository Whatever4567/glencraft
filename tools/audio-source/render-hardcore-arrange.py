#!/usr/bin/env python3
"""1.2.6x Happy Hardcore — through-composed festival arrangement (v4).

Original music only. Production *techniques* (emotive minor/modal progressions,
festival builds and drops, filtered disco grooves, vocoder layers, side-chain
pump, mix depth) — no copied melodies, lyrics, or samples.

165 BPM, D dorian lifting to E in drop 2. Vocal hook is the star of the
drops; breakdown introduces a new melody; drop 2 adds a countermelody,
new donk patterns and a brighter groove. Every 8-bar cell is unique.
No user-facing previews are written.
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
OUT_DIR = Path(os.environ.get("HC_OUT", "/workspace/qa/audio-1260/v5"))
VOC = Path(os.environ.get("VOC_DIR", "/workspace/qa/audio-1260/v5/vocals"))
WIRE_GAME = os.environ.get("WIRE_GAME", "1") != "0"

SR = E.SR
BPM = 165.0
SPB = 60.0 / BPM
BAR = 4 * SPB
BARS = 144
PREROLL_BARS = 2
SEED = 1264
SWING = 0.011  # seconds, even 16ths only

# Section map for mix envelope / analysis (18 unique 8-bar cells inside)
SEC = {
    "intro": (0, 8),
    "build1": (8, 16),
    "drop1": (16, 48),
    "break": (48, 64),
    "build2": (64, 72),
    "drop2": (72, 120),
    "outro": (120, 144),
}

# Original emotive / bounce voicings (Highland modal, not a lifted hit)
CHORDS = {
    # i–VI–III–VII in D: Dm Bb F C
    "emote_d": [
        [146.83, 174.61, 220.00, 293.66],
        [116.54, 146.83, 174.61, 233.08],
        [174.61, 220.00, 261.63, 349.23],
        [130.81, 164.81, 196.00, 261.63],
    ],
    # i–VII–VI–VII in D: Dm C Bb C
    "bounce_d": [
        [146.83, 174.61, 220.00, 293.66],
        [130.81, 164.81, 196.00, 261.63],
        [116.54, 146.83, 174.61, 233.08],
        [130.81, 164.81, 196.00, 261.63],
    ],
    # i–VI–III–VII in E: Em C G D
    "emote_e": [
        [164.81, 196.00, 246.94, 329.63],
        [130.81, 164.81, 196.00, 261.63],
        [196.00, 246.94, 293.66, 392.00],
        [146.83, 185.00, 220.00, 293.66],
    ],
    # i–VII–VI–VII in E: Em D C D
    "bounce_e": [
        [164.81, 196.00, 246.94, 329.63],
        [146.83, 185.00, 220.00, 293.66],
        [130.81, 164.81, 196.00, 261.63],
        [146.83, 185.00, 220.00, 293.66],
    ],
}
BASSES = {
    "emote_d": [73.42, 58.27, 87.31, 65.41],
    "bounce_d": [73.42, 65.41, 58.27, 65.41],
    "emote_e": [82.41, 65.41, 98.00, 73.42],
    "bounce_e": [82.41, 73.42, 65.41, 73.42],
}

# Donk onsets in beats within a bar (original patterns, not a looped offbeat)
DONK_PAT = {
    "offbeat": [0.5, 1.5, 2.5, 3.5],
    "gallop": [0.5, 0.75, 1.5, 1.75, 2.5, 2.75, 3.5, 3.75],
    "skip": [0.5, 1.5, 3.5],
    "half": [0.5, 2.5],
    "drive": [0.5, 1.25, 1.5, 2.5, 3.25, 3.5],
    "late": [0.75, 1.75, 2.75, 3.75],
    "three": [0.5, 0.75, 1.5, 2.5, 2.75, 3.5],
}

# Original disco 16th velocities (four variations, not a lifted riff)
DISCO_VEL = {
    "a": [1.00, 0.00, 0.00, 0.55, 0.18, 0.00, 0.85, 0.00,
          0.70, 0.35, 0.00, 0.50, 0.20, 0.00, 0.90, 0.18],
    "b": [0.85, 0.00, 0.40, 0.00, 0.15, 0.00, 0.95, 0.25,
          0.55, 0.00, 0.30, 0.60, 0.00, 0.20, 0.80, 0.00],
    "c": [1.00, 0.22, 0.00, 0.40, 0.00, 0.00, 0.70, 0.15,
          0.85, 0.00, 0.45, 0.00, 0.30, 0.00, 1.00, 0.28],
    "d": [0.70, 0.00, 0.25, 0.55, 0.00, 0.35, 0.80, 0.00,
          0.40, 0.00, 0.00, 0.65, 0.15, 0.00, 0.90, 0.40],
}

# 18 unique 8-bar cells. Each has its own kit / bass / bed so neighbouring
# drops are not the same groove in a new hat pattern.
CELLS = [
    dict(name="intro_mist",    start=0,   kit="soft", kick_pat="sparse", donk=None, bass=None, bed="shimmer",
         hats=0.16, hat="dark", shaker=0.00, clap=0.00, chords="emote_d", chord_g=0.28,
         cut0=520, cut1=2200, disco=0.00, dvel="a", vocal="intro"),
    dict(name="build_festival", start=8,  kit="tight", kick_pat="four", donk="half", bass=None, bed="saw",
         hats=0.50, hat="tight", shaker=0.10, clap=0.18, chords="bounce_d", chord_g=0.24,
         cut0=800, cut1=5200, disco=0.10, dvel="b", vocal="build1", build=1),
    dict(name="drop1_hit",     start=16,  kit="punch", kick_pat="four", donk="offbeat", bass="donk", bed="saw",
         hats=0.78, hat="sizzle", shaker=0.24, clap=0.44, chords="bounce_d", chord_g=0.26,
         cut0=3800, cut1=4200, disco=0.08, dvel="a", vocal="drop1_hit"),
    dict(name="drop1_disco",   start=24,  kit="tight", kick_pat="four", donk=None, bass=None, bed="none",
         hats=0.86, hat="metal", shaker=0.52, clap=0.40, chords="bounce_d", chord_g=0.10,
         cut0=2200, cut1=2800, disco=0.88, dvel="a", vocal="drop1_disco"),
    dict(name="drop1_call",    start=32,  kit="punch", kick_pat="four", donk="skip", bass="donk", bed="pulse",
         hats=0.70, hat="tick", shaker=0.28, clap=0.40, chords="bounce_d", chord_g=0.20,
         cut0=3600, cut1=4000, disco=0.22, dvel="b", vocal="drop1_call"),
    dict(name="drop1_peak",    start=40,  kit="rave", kick_pat="four", donk=None, bass="sub", bed="none",
         hats=0.90, hat="metal", shaker=0.34, clap=0.36, chords="bounce_d", chord_g=0.10,
         cut0=4400, cut1=2800, disco=0.16, dvel="c", vocal="drop1_peak"),
    dict(name="brk_mist",      start=48,  kit="deep", kick_pat="half", donk=None, bass=None, bed="pulse",
         hats=0.14, hat="dark", shaker=0.00, clap=0.08, chords="emote_d", chord_g=0.24,
         cut0=1800, cut1=1100, disco=0.00, dvel="a", vocal="brk_mist"),
    dict(name="brk_home",      start=56,  kit="soft", kick_pat="half", donk=None, bass="sub", bed="pulse",
         hats=0.20, hat="dark", shaker=0.06, clap=0.10, chords="emote_d", chord_g=0.24,
         cut0=1400, cut1=3200, disco=0.08, dvel="d", vocal="brk_home"),
    dict(name="build_lift",    start=64,  kit="tight", kick_pat="four", donk="offbeat", bass="donk", bed="pulse",
         hats=0.64, hat="sizzle", shaker=0.18, clap=0.28, chords="emote_d", chord_g=0.26,
         cut0=900, cut1=6200, disco=0.12, dvel="c", vocal="build2", build=2),
    dict(name="drop2_lift",    start=72,  kit="rave", kick_pat="four", donk=None, bass="sub", bed="pulse",
         hats=0.70, hat="metal", shaker=0.20, clap=0.40, chords="bounce_e", chord_g=0.22,
         cut0=4200, cut1=4600, disco=0.20, dvel="c", vocal="drop2_lift", pitch=2),
    dict(name="drop2_counter", start=80,  kit="deep", kick_pat="four", donk=None, bass="reese", bed="pulse",
         hats=0.42, hat="dark", shaker=0.08, clap=0.18, chords="emote_e", chord_g=0.34,
         cut0=2600, cut1=3200, disco=0.00, dvel="b", vocal="drop2_counter", pitch=2),
    dict(name="drop2_chops",   start=88,  kit="click", kick_pat="four", donk=None, bass="pluck", bed="none",
         hats=0.98, hat="tick", shaker=0.58, clap=0.30, chords="bounce_e", chord_g=0.06,
         cut0=2600, cut1=3400, disco=0.85, dvel="d", vocal="drop2_chops", pitch=2),
    dict(name="drop2_recall",  start=96,  kit="punch", kick_pat="four", donk=None, bass="growl", bed="saw",
         hats=0.62, hat="metal", shaker=0.18, clap=0.36, chords="emote_e", chord_g=0.18,
         cut0=3400, cut1=3800, disco=0.10, dvel="a", vocal="drop2_recall", pitch=2),
    dict(name="drop2_hole",    start=104, kit="rave", kick_pat="hole", donk="half", bass="donk", bed="saw",
         hats=0.55, hat="sizzle", shaker=0.16, clap=0.30, chords="emote_e", chord_g=0.20,
         cut0=1600, cut1=4500, disco=0.18, dvel="c", vocal="drop2_hole", pitch=2),
    dict(name="drop2_final",   start=112, kit="rave", kick_pat="four", donk="three", bass="sub", bed="saw",
         hats=0.90, hat="sizzle", shaker=0.40, clap=0.52, chords="bounce_e", chord_g=0.34,
         cut0=5200, cut1=4200, disco=0.24, dvel="b", vocal="drop2_final", pitch=2),
    dict(name="outro_echo",    start=120, kit="soft", kick_pat="half", donk=None, bass=None, bed="shimmer",
         hats=0.00, hat="dark", shaker=0.00, clap=0.00, chords="emote_d", chord_g=0.10,
         cut0=2000, cut1=1400, disco=0.00, dvel="a", vocal="outro_echo"),
    dict(name="outro_sparse",  start=128, kit="soft", kick_pat="sparse", donk=None, bass=None, bed="none",
         hats=0.00, hat="dark", shaker=0.00, clap=0.00, chords="emote_d", chord_g=0.10,
         cut0=1200, cut1=900, disco=0.00, dvel="a", vocal="outro_sparse"),
    dict(name="outro_horizon", start=136, kit="soft", kick_pat="horizon", donk=None, bass=None, bed="shimmer",
         hats=0.18, hat="sizzle", shaker=0.00, clap=0.00, chords="emote_d", chord_g=0.12,
         cut0=800, cut1=2400, disco=0.00, dvel="a", vocal="outro_horizon"),
]



def section_at(bar):
    for name, (a, b) in SEC.items():
        if a <= bar < b:
            return name
    return "outro"


def cell_at(bar):
    idx = max(0, min(bar, BARS - 1)) // 8
    return CELLS[idx]


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
        raise FileNotFoundError(f"missing vocal stem {p}")
    y, sr = sf.read(str(p), always_2d=True)
    if sr != SR:
        import librosa
        y = np.stack([librosa.resample(y[:, ch], orig_sr=sr, target_sr=SR)
                      for ch in range(y.shape[1])], 1)
    return y.astype(np.float64)


def pitch_shift_stem(y, semitones, tag):
    cache = VOC / "_pitch"
    cache.mkdir(parents=True, exist_ok=True)
    outp = cache / f"{tag}_{semitones:+.0f}st.wav"
    if outp.exists():
        y2, _ = sf.read(str(outp), always_2d=True)
        return y2.astype(np.float64)
    tmp = cache / f"_in_{tag}.wav"
    sf.write(str(tmp), y, SR, subtype="FLOAT")
    subprocess.check_call([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(tmp),
        "-af", f"rubberband=pitch={semitones}:formant=preserved:tempo=1",
        "-c:a", "pcm_f32le", str(outp),
    ])
    tmp.unlink(missing_ok=True)
    y2, _ = sf.read(str(outp), always_2d=True)
    return y2.astype(np.float64)


def place_stem(bus, t0, stem, gain=1.0):
    if stem is None or len(stem) == 0 or gain == 0:
        return
    E.add_stereo(bus, t0, stem[:, 0], stem[:, 1] if stem.shape[1] > 1 else stem[:, 0], gain=gain)


def make_room_ir(sec, rng, decay=3.5, dark=5500):
    n = int(sec * SR)
    ir = np.zeros((n, 2))
    env = np.exp(-np.linspace(0, 1, n) ** 0.75 * decay)
    for ch in (0, 1):
        sig = rng.standard_normal(n) * env
        sig = E.sos_lp(sig, dark * (1.0 if ch == 0 else 0.96))
        sig[0] = 1.0
        ir[:, ch] = sig
    ir /= np.max(np.abs(ir)) + 1e-12
    return ir


def kick_times_for(pat, bar_t, style_bar=0):
    """Return kick onset times in a bar given a pattern name."""
    if pat == "four":
        return [bar_t + b * SPB for b in range(4)]
    if pat == "half":
        return [bar_t + b * SPB for b in (0, 2)]
    if pat == "sparse":
        # first downbeat only, plus downbeat of bar+4 in 8-bar (handled per bar)
        return [bar_t] if style_bar % 2 == 0 else []
    if pat == "horizon":
        # last 8 bars: kick on 1 of bars 6 and 7 (of the cell) only, growing
        if style_bar >= 6:
            return [bar_t, bar_t + 2 * SPB]
        if style_bar >= 4:
            return [bar_t]
        return []
    if pat == "hole":
        # first 2 bars of the cell: downbeat only; then four-on-the-floor
        if style_bar < 2:
            return [bar_t]
        return [bar_t + b * SPB for b in range(4)]
    return [bar_t + b * SPB for b in range(4)]


def load_bank():
    bank = {"tag": load_stem("tag_to_the_hills.wav")}
    for key in "abcdefg":
        bank[f"{key}_lead"] = load_stem(f"hook_{key}_lead.wav")
        bank[f"{key}_dbl"] = load_stem(f"hook_{key}_double.wav")
        bank[f"{key}_harm"] = load_stem(f"hook_{key}_harm.wav")
        bank[f"{key}_oct"] = load_stem(f"hook_{key}_oct.wav")
        bank[f"{key}_dry"] = load_stem(f"hook_{key}_lead_dry.wav")
    for name in ("oh", "hey", "yeah", "glen", "sleep", "dance", "up"):
        bank[f"chop_{name}"] = load_stem(f"chop_{name}.wav")
        dry = VOC / f"chop_{name}_dry.wav"
        if dry.exists():
            bank[f"chop_{name}_dry"] = load_stem(f"chop_{name}_dry.wav")
    bank["ef_layered"] = load_stem("hook_ef_layered.wav")
    bank["g_layered"] = load_stem("hook_g_layered.wav")
    # +2 st (formant preserved) copies for the key lift
    print("pitch-shifting drop-2 stems +2 st (formant preserved)…")
    for key in list(bank.keys()):
        bank[f"{key}_p2"] = pitch_shift_stem(bank[key], 2.0, key)
    return bank


def vocode_stem(stem, tonic, tag):
    cache = VOC / "_pitch"
    cache.mkdir(parents=True, exist_ok=True)
    outp = cache / f"voc_{tag}.wav"
    if outp.exists():
        y, _ = sf.read(str(outp), always_2d=True)
        return y.astype(np.float64)
    n = len(stem)
    dur = n / SR
    L1, R1 = E.supersaw_stereo(tonic, dur, det=14, n_osc=7, cutoff=6200)
    L2, R2 = E.supersaw_stereo(tonic * 1.5, dur, det=10, n_osc=5, cutoff=5400)
    car = np.stack([L1 + 0.55 * L2, R1 + 0.55 * R2], 1)
    v = E.vocoder(car, stem, n_bands=14, lo=160, hi=7000, rel_s=0.045)
    peak = np.max(np.abs(v)) + 1e-12
    v = v / peak * 0.85
    sf.write(str(outp), v, SR, subtype="FLOAT")
    return v


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
        return v / (np.max(v) + 1e-16)

    va, vb = pows(a), pows(b)
    return float(np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb) + 1e-16)), va, vb


def _band_sig(x, lo, hi, sr):
    if lo <= 20:
        return E.sos_lp(x, hi)
    if hi >= sr / 2 - 1:
        return E.sos_hp(x, lo)
    return E.sos_bp(x, lo, hi)


def cell_feature(x, sr):
    """Features that hear timbre and level, not just a shared 8-bar envelope shape."""
    if x.ndim == 2:
        mid = np.mean(x, axis=1)
        side = (x[:, 0] - x[:, 1]) * 0.5
    else:
        mid, side = x, np.zeros_like(x)
    n = len(mid)
    low = _band_sig(mid, 30, 150, sr)
    voc = _band_sig(mid, 400, 4000, sr)
    air = _band_sig(mid, 6000, 16000, sr)

    def env8(sig):
        chunk = max(n // 8, 1)
        v = np.array([np.sqrt(np.mean(sig[i * chunk:(i + 1) * chunk] ** 2) + 1e-16) for i in range(8)])
        return v / (np.max(v) + 1e-16)

    def flux16(sig):
        fl = n // 16
        en = np.array([np.sqrt(np.mean(sig[i * fl:(i + 1) * fl] ** 2) + 1e-16) for i in range(16)])
        fx = np.clip(np.diff(en, prepend=en[0]), 0, None)
        return fx / (np.max(fx) + 1e-16)

    spec = np.abs(np.fft.rfft(mid * np.hanning(n))) ** 2
    freqs = np.fft.rfftfreq(n, 1 / sr)
    chroma = np.zeros(12)
    for k, f0 in enumerate(freqs):
        if f0 < 80 or f0 > 2000:
            continue
        pc = int(np.round(12 * np.log2(f0 / 146.83))) % 12
        chroma[pc] += spec[k]
    chroma = chroma / (np.linalg.norm(chroma) + 1e-16)
    be_bands = [(30, 80), (80, 150), (150, 400), (400, 1000), (1000, 3000), (3000, 8000), (8000, 16000)]
    be = []
    for lo, hi in be_bands:
        m = (freqs >= lo) & (freqs < hi)
        be.append(float(np.mean(spec[m])) if np.any(m) else 0.0)
    be = np.array(be) + 1e-16
    be_shape = be / np.sum(be)
    # absolute log-band energy (fixed scale) — this is the palette
    be_log = np.log10(be) / 8.0  # roughly [-4, 0] typical
    rms = float(np.sqrt(np.mean(mid ** 2)) + 1e-16)
    rms_feat = np.log10(rms) / 4.0
    tot = float(np.sum(spec)) + 1e-16
    cent = float(np.sum(freqs * spec) / tot)
    cent_feat = np.log10(max(cent, 20.0)) / 4.0
    low_ratio = float(np.sqrt(np.mean(low ** 2)) / (rms + 1e-16))
    air_ratio = float(np.sqrt(np.mean(air ** 2)) / (rms + 1e-16))
    voc_ratio = float(np.sqrt(np.mean(voc ** 2)) / (rms + 1e-16))
    width = float(np.sqrt(np.mean(side ** 2)) / (rms + 1e-16))
    # Repeat scalars so timbre/level is not drowned by the long envelope vectors
    scalars = np.array([rms_feat, cent_feat, low_ratio, air_ratio, voc_ratio, width])
    feat = np.concatenate([
        env8(low), env8(voc), env8(air),
        flux16(low), flux16(voc),
        chroma, be_shape, be_log,
        np.tile(scalars, 8),
    ])
    return feat / (np.linalg.norm(feat) + 1e-16)



def similarity_report(body, sr, path):
    """Mean-centered cosine: shared song DNA (key, tempo, 4-on-the-floor) is
    removed so the score measures whether two cells have the same identity.
    Raw (uncentered) cosine of same-key drops is always ~0.95+ and is not a
    useful uniqueness test.
    """
    feats = []
    names = []
    for c in CELLS:
        a = int(c["start"] * BAR * sr)
        b = int((c["start"] + 8) * BAR * sr)
        feats.append(cell_feature(body[a:b], sr))
        names.append(c["name"])
    F = np.stack(feats)
    # undo the per-vector L2 so centering has meaning, then re-center
    # cell_feature already L2-normalizes; rebuild from that still works if we
    # center in that space, but better to center first. We re-normalize after.
    Fc = F - F.mean(axis=0, keepdims=True)
    Fn = Fc / (np.linalg.norm(Fc, axis=1, keepdims=True) + 1e-16)
    sim = Fn @ Fn.T
    pairs = []
    n = len(names)
    for i in range(n):
        for j in range(i + 1, n):
            pairs.append((float(sim[i, j]), names[i], names[j]))
    pairs.sort(reverse=True)
    flagged = [p for p in pairs if p[0] >= 0.85]
    report = {
        "threshold": 0.85,
        "method": "mean-centered cosine (shared track DNA removed)",
        "flagged": [{"cos": a, "a": b, "b": c} for a, b, c in flagged],
        "top10": [{"cos": a, "a": b, "b": c} for a, b, c in pairs[:10]],
        "matrix": {names[i]: {names[j]: round(float(sim[i, j]), 4) for j in range(n)} for i in range(n)},
    }
    path.write_text(json.dumps(report, indent=2))
    print("similarity flagged", len(flagged), "top", pairs[:5])
    return report



def true_peak_limit(body, path_pre, path_post):
    sf.write(str(path_pre), body, SR, subtype="FLOAT")
    subprocess.check_call([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(path_pre),
        "-af", "aresample=176400,alimiter=limit=0.851138:attack=3:release=40:level=false,aresample=44100",
        "-c:a", "pcm_f32le", str(path_post),
    ])
    y, _ = sf.read(str(path_post), always_2d=True)
    path_pre.unlink(missing_ok=True)
    path_post.unlink(missing_ok=True)
    return y.astype(np.float64)


def write_critique(y, sr, report, sim, path):
    """Spectral / structural self-critique vs the reference and commercial targets."""
    bands = [(40, 80), (80, 150), (150, 500), (500, 2000), (2000, 4000),
             (4000, 8000), (8000, 12000), (12000, 16000)]

    def band_db(x):
        if x.ndim == 2:
            x = np.mean(x, axis=1)
        spec = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2
        f = np.fft.rfftfreq(len(x), 1 / sr)
        tot = float(np.sum(spec)) + 1e-16
        out = {}
        for lo, hi in bands:
            m = (f >= lo) & (f < hi)
            out[f"{lo}-{hi}"] = float(10 * np.log10(np.sum(spec[m]) / tot + 1e-16))
        return out

    drop = y[int(SEC["drop1"][0] * BAR * sr): int((SEC["drop1"][0] * BAR + 17.28) * sr)]
    mix_db = band_db(drop)
    critique = {
        "loudness": {
            "drop_S_max": report.get("drop", {}).get("S_max"),
            "drop_TP": report.get("drop", {}).get("TP"),
            "target_S": "-9 to -8 LUFS",
            "target_TP": "<= -1 dB",
            "ok_loudness": (report.get("drop", {}).get("S_max") or -99) >= -9.05
                           and (report.get("drop", {}).get("S_max") or 0) <= -8.0,
            "ok_tp": (report.get("drop", {}).get("TP") or 0) <= -1.0,
            "clips": report.get("clips"),
            "wrap": report.get("wrap_step"),
        },
        "similarity": {
            "target": 0.85,
            "flagged_0.85": [
                {"cos": a, "a": b, "b": c}
                for a, b, c in [
                    (p["cos"], p["a"], p["b"]) for p in sim.get("top10", [])
                ] if a >= 0.85
            ],
            "worst": (sim.get("top10") or [{}])[0],
        },
        "drop_band_db": mix_db,
    }
    ref_path = Path("/workspace/qa/audio-1260/ref/t1132-ref.wav")
    if ref_path.exists():
        ref, ref_sr = sf.read(str(ref_path), always_2d=True)
        if ref_sr != sr:
            import librosa
            ref = np.stack([librosa.resample(ref[:, ch], orig_sr=ref_sr, target_sr=sr)
                            for ch in range(ref.shape[1])], 1)
        n = min(len(ref), len(drop))
        ref_db = band_db(ref[:n])
        critique["ref_band_db"] = ref_db
        critique["band_delta_db"] = {k: mix_db[k] - ref_db[k] for k in mix_db}
        # commercial-ish air target: 2–8 kHz within ~4 dB of the ref
        d2 = critique["band_delta_db"].get("2000-4000", 0)
        d4 = critique["band_delta_db"].get("4000-8000", 0)
        critique["air_ok"] = (d2 >= -4.0 and d4 >= -4.0)
    # intro lift / loop join
    n2 = int(2.0 * sr)
    intro_rms = float(20 * np.log10(np.sqrt(np.mean(y[:n2] ** 2)) + 1e-12))
    outro_rms = float(20 * np.log10(np.sqrt(np.mean(y[-n2:] ** 2)) + 1e-12))
    critique["loop_join_db"] = {"first_2s": intro_rms, "last_2s": outro_rms, "delta": intro_rms - outro_rms}
    critique["loop_join_ok"] = abs(intro_rms - outro_rms) <= 6.0 and intro_rms > -36.0
    path.write_text(json.dumps(critique, indent=2))
    print("critique air_ok", critique.get("air_ok"), "join", critique["loop_join_db"],
          "sim_worst", critique["similarity"]["worst"])
    return critique


def render():
    rng = np.random.default_rng(SEED)
    body_len = BARS * 4 * SPB
    preroll = PREROLL_BARS * 4 * SPB
    N = int(round((preroll + body_len) * SR))

    def t_body(bar, beat=0, eighth=0, six=0):
        return preroll + bar * BAR + beat * SPB + eighth * (SPB / 2) + six * (SPB / 4)

    kick_bus = np.zeros((N, 2))
    donk_bus = np.zeros((N, 2))
    bass_bus = np.zeros((N, 2))
    drums = np.zeros((N, 2))
    music = np.zeros((N, 2))
    disco = np.zeros((N, 2))
    vocals = np.zeros((N, 2))
    vocod = np.zeros((N, 2))
    fx = np.zeros((N, 2))
    kick_times = []

    print("loading vocal stems…")
    bank = load_bank()

    print("building vocoder layers…")
    voc_e = vocode_stem(bank["e_lead"], 146.83, "e_d")
    voc_f = vocode_stem(bank["f_lead"], 174.61, "f_d")
    voc_g = vocode_stem(bank["g_lead_p2"], 164.81, "g_e")
    voc_a = vocode_stem(bank["a_lead"], 146.83, "a_d")
    voc_c2 = vocode_stem(bank["c_lead_p2"], 164.81, "c_e")

    print("building one-shots…")
    kicks = {s: [E.make_kick_kit(rng, s) for _ in range(3)]
             for s in ("punch", "slam", "tight", "soft", "click", "deep", "rave")}
    clap = E.make_clap(rng)
    snares = {k: E.make_snare_pro(rng, k) for k in ("hit", "ghost", "rim")}
    hats = {st: [E.make_hat_pro(rng, st) for _ in range(4)]
            for st in ("sizzle", "tight", "dark", "metal", "tick", "open")}
    hat_o = E.make_hat_pro(rng, "open")
    shakers = [E.make_shaker(rng) for _ in range(4)]
    crash = E.make_crash_pro(rng, "wash")
    splash = E.make_crash_pro(rng, "splash")
    ride = E.make_ride(rng)
    impact = E.make_impact_pro(rng, "festival")
    impact_soft = E.make_impact_pro(rng, "soft")
    toms = {f: E.make_tom(rng, f) for f in (82.0, 98.0, 130.0, 155.0)}
    # donks for every bass we use
    donk_cache = {}
    for name, freqs in BASSES.items():
        donk_cache[name] = [E.make_donk(f, rng, SPB) for f in freqs]
    riser8 = E.make_riser(rng, 8 * BAR)
    riser4 = E.make_riser(rng, 4 * BAR)
    sweep8 = E.make_noise_sweep(rng, 8 * BAR, up=True, lo=150, hi=14000)
    sweep4 = E.make_noise_sweep(rng, 4 * BAR, up=True)
    sweep2 = E.make_noise_sweep(rng, 2 * BAR, up=True)
    down_8th = E.make_noise_sweep(rng, SPB, up=False, lo=300, hi=8000)
    rev_cym = E.make_reverse_cymbal(rng, 0.70)
    zaps = [E.make_zap(f, 0.09) for f in (440.0, 554.37, 659.25, 783.99)]

    def hook(bus, t0, key, gain=1.0, layers="full", dry=False, pitched=False):
        sfx = "_p2" if pitched else ""
        lead = bank[f"{key}_dry{sfx}"] if dry else bank[f"{key}_lead{sfx}"]
        place_stem(bus, t0, lead, gain=gain)
        if layers in ("full", "thick"):
            place_stem(bus, t0, bank[f"{key}_oct{sfx}"], gain=gain * 0.34)
            place_stem(bus, t0, bank[f"{key}_dbl{sfx}"], gain=gain * 0.36)
        if layers == "full":
            place_stem(bus, t0, bank[f"{key}_harm{sfx}"], gain=gain * 0.30)
        if layers == "harm":
            place_stem(bus, t0, bank[f"{key}_harm{sfx}"], gain=gain * 0.42)
            place_stem(bus, t0, bank[f"{key}_oct{sfx}"], gain=gain * 0.22)
        if layers == "lead":
            pass
        if layers == "oct":
            place_stem(bus, t0, bank[f"{key}_oct{sfx}"], gain=gain * 0.40)

    print("scheduling 144 unique-cell bars…")
    for bar in range(-PREROLL_BARS, BARS):
        src = bar if bar >= 0 else bar + BARS
        cell = cell_at(src)
        local = src - cell["start"]  # 0..7
        ci = src % 4
        chords = CHORDS[cell["chords"]]
        basses = BASSES[cell["chords"]]
        # last two bars of the lift build tease the E tonic
        if cell["name"] == "build_lift" and local >= 6:
            basses = BASSES["bounce_e"]
            chords = CHORDS["bounce_e"]
            ci = (src - 2) % 4
        predrop = (cell["name"] == "build_festival" and local == 7) or (
            cell["name"] == "build_lift" and local == 7
        )
        # hole in drop2_hole first two bars already in kick_pat
        kick_style = cell.get("kit", "punch")
        # drop2_hole first bars stay soft
        if cell["name"] == "drop2_hole" and local < 2:
            kick_style = "soft"
        kick_g = {
            "soft": 0.48, "tight": 0.78, "deep": 0.70, "click": 0.82,
            "punch": 1.00, "slam": 1.08, "rave": 1.10,
        }.get(kick_style, 1.00)
        if kick_style == "tight":
            kick_g = 0.78 + 0.04 * local
        if cell["name"] == "intro_mist":
            kick_g = 0.40 + 0.05 * local
        if cell["name"] == "brk_home" and local >= 6:
            kick_g = 0.70
            kick_style = "tight"
        if cell["name"] == "drop1_peak" and local >= 6:
            kick_g *= 0.55 if local == 6 else 0.30
        if cell["name"] == "drop2_final" and local == 7:
            kick_g *= 0.65
        if cell["name"] == "outro_echo":
            kick_g = 0.40
        if cell["name"] == "outro_sparse":
            kick_g = 0.28
        if cell["name"] == "outro_horizon":
            kick_g = 0.22 + 0.08 * max(local - 4, 0)
        if cell["name"] == "drop2_chops":
            kick_g = 0.82
        if cell["name"] == "drop2_counter" and local < 4:
            kick_g = 0.78
        if cell["name"] == "drop1_call" and local % 2 == 1:
            kick_g *= 0.52
        if cell["name"] == "drop2_final" and local == 3:
            kick_g *= 0.42
        if cell["name"] == "drop1_disco" and local == 0:
            kick_g *= 0.85

        donk_g = 0.0
        if cell["donk"]:
            donk_g = {
                "half": 0.70, "offbeat": 1.12, "gallop": 1.00, "skip": 1.10,
                "drive": 1.08, "late": 1.05, "three": 1.10,
            }[cell["donk"]]
            if cell["name"].startswith("build"):
                donk_g *= 0.55 + 0.07 * local
            if cell["name"] == "brk_home":
                donk_g = 0.45
            if cell["name"] == "drop1_peak" and local >= 6:
                donk_g *= 0.40
            if cell["name"] == "drop2_hole" and local < 2:
                donk_g = 0.35
            if cell["name"] == "drop2_lift":
                donk_g = 1.16
            if cell["name"] == "drop2_chops":
                donk_g = 0.92
            if cell["name"] == "drop2_counter" and local < 4:
                donk_g = 0.70
            if cell["name"] == "drop1_call" and local % 2 == 1:
                donk_g *= 0.42
            if cell["name"] == "build_festival" and local < 3:
                donk_g = 0.0
            if cell["name"] == "drop2_final" and local == 3:
                donk_g *= 0.30
            if cell["name"] == "drop1_disco" and local == 0:
                donk_g *= 0.40
            if cell["name"] == "drop1_disco" and local == 7:
                donk_g *= 0.15

        hat_g = cell["hats"]
        shak_g = cell["shaker"]
        clap_g = cell["clap"]
        if cell["name"] == "build_festival":
            hat_g = 0.22 + 0.07 * local
            shak_g = 0.04 * local
            clap_g = 0.08 + 0.03 * local
        if cell["name"] == "build_lift":
            hat_g = 0.30 + 0.07 * local
            clap_g = 0.14 + 0.03 * local
        if cell["name"] == "drop1_peak" and local >= 6:
            hat_g *= 0.35
            shak_g *= 0.25
        if cell["name"] == "drop2_hole" and local < 2:
            hat_g *= 0.25
            clap_g *= 0.20
            shak_g *= 0.15
        if cell["name"] == "drop2_counter" and local < 4:
            hat_g *= 0.55
            shak_g *= 0.40
            clap_g *= 0.60
        if cell["name"] == "drop1_call" and local % 2 == 1:
            hat_g *= 0.50
            shak_g *= 0.45
            clap_g *= 0.55
        eighth_hats = (cell["name"] == "build_festival" and local < 4)
        double_hats = (cell["name"] == "drop2_final" and local >= 4)
        if cell["name"] == "drop2_final" and local == 3:
            hat_g *= 0.35
            shak_g *= 0.30
            clap_g *= 0.35
        if cell["name"] == "drop1_disco" and local == 7:
            hat_g *= 1.25
            shak_g *= 1.20

        # kicks / claps / hats / donks / shakers
        kpat = cell["kick_pat"]
        if cell["name"] == "brk_home" and local >= 6:
            kpat = "four"
        if cell["name"] == "drop2_counter" and local < 4:
            kpat = "half"
        if predrop:
            # first three beats only; last beat is the hole
            kt = [t for t in kick_times_for(kpat, t_body(bar), local) if t < t_body(bar, 3)]
        else:
            kt = kick_times_for(kpat, t_body(bar), local)
        kit_alias = {"drop": "punch"}.get(kick_style, kick_style)
        if kit_alias not in kicks:
            kit_alias = "punch"
        k_hit = kicks[kit_alias][src % 3]
        for t in kt:
            if kick_g > 0.02:
                E.add_mono(kick_bus, t, k_hit, gain=kick_g * 1.18, pan=0.0)
                kick_times.append(t)

        if clap_g > 0.02 and not predrop:
            for beat in (1, 3):
                # drop2_hole first bars: clap on 3 only
                if cell["name"] == "drop2_hole" and local < 2 and beat == 1:
                    continue
                E.add_mono(drums, t_body(bar, beat), clap, gain=clap_g * 1.25, pan=0.10)
                E.add_mono(drums, t_body(bar, beat), snares["hit"], gain=clap_g * 0.22, pan=-0.08)

        # ghost snare / rim for groove on drops
        if hat_g > 0.4 and local % 2 == 1 and not predrop:
            E.add_mono(drums, t_body(bar, 1) + SPB * 0.75, snares["ghost"],
                       gain=0.10, pan=-0.18)

        if hat_g > 0.02:
            n16 = 12 if predrop else 16
            for s16 in range(n16):
                vel = 0.90 if s16 % 2 == 0 else 0.40
                if s16 % 4 == 2:
                    vel *= 1.15
                dt = SWING if (s16 % 2 == 1) else 0.0
                if eighth_hats and (s16 % 2 == 1):
                    continue
                hat_bank = hats.get(cell.get("hat", "sizzle"), hats["sizzle"])
                E.add_mono(drums, t_body(bar) + s16 * (SPB / 4) + dt,
                           hat_bank[s16 % 4], gain=hat_g * 0.40 * vel, pan=-0.16 + 0.04 * (s16 % 3))
                if double_hats:
                    E.add_mono(drums, t_body(bar) + s16 * (SPB / 4) + (SPB / 8) + dt,
                               hat_bank[(s16 + 1) % 4], gain=hat_g * 0.24 * vel, pan=0.14)
            if hat_g > 0.08 and not predrop:
                E.add_mono(drums, t_body(bar, 0) + SPB / 2, hat_o, gain=hat_g * 0.42, pan=0.16)
                if hat_g > 0.5:
                    E.add_mono(drums, t_body(bar, 2) + SPB / 2, hat_o, gain=hat_g * 0.34, pan=0.12)

        if shak_g > 0.02 and not predrop:
            for s16 in range(16):
                if s16 % 2 == 1 or s16 % 4 == 0:
                    dt = SWING if s16 % 2 == 1 else 0.0
                    E.add_mono(drums, t_body(bar) + s16 * (SPB / 4) + dt,
                               shakers[s16 % 4], gain=shak_g * 0.38 * (0.7 + 0.3 * (s16 % 3 == 0)),
                               pan=0.22 if s16 % 2 else -0.20)

        if donk_g > 0.02 and cell["donk"]:
            onsets = DONK_PAT[cell["donk"]]
            # drop2_hole first 2 bars: half only
            if cell["name"] == "drop2_hole" and local < 2:
                onsets = DONK_PAT["half"]
            if cell["name"] == "drop2_counter" and local < 4:
                onsets = DONK_PAT["half"]
            donk_bank = donk_cache["bounce_e" if (cell["name"] == "build_lift" and local >= 6) else cell["chords"]]
            for off in onsets:
                if predrop and off >= 3.0:
                    continue
                E.add_mono(donk_bus, t_body(bar) + off * SPB, donk_bank[ci],
                           gain=donk_g * 1.22, pan=0.0)

        # Alternate basses (reese / pluck / growl / sub) — different timbre, not a second donk
        bass_kind = cell.get("bass")
        if bass_kind and bass_kind != "donk" and not predrop:
            root = basses[ci]
            if bass_kind == "reese":
                L, R = E.make_reese(root, BAR * 0.98, cutoff=480 + 40 * local, det=9)
                E.add_stereo(bass_bus, t_body(bar), L, R, gain=0.55)
            elif bass_kind == "pluck":
                # mid plucks on the same syncopation as the disco groove
                for s16, v in enumerate(DISCO_VEL.get(cell.get("dvel", "a"), DISCO_VEL["a"])):
                    if v < 0.4:
                        continue
                    L, R = E.make_pluck(root, dur=0.16)
                    E.add_stereo(bass_bus, t_body(bar) + s16 * (SPB / 4), L, R, gain=0.42 * v)
            elif bass_kind == "growl":
                L, R = E.make_growl(root, BAR * 0.92, rng)
                E.add_stereo(bass_bus, t_body(bar), L, R, gain=0.48)
            elif bass_kind == "sub":
                L, R = E.make_sub_fifth(root, BAR * 0.95)
                E.add_stereo(bass_bus, t_body(bar), L, R, gain=0.70)

        # emotive / bounce pads (beds, not a lead)
        cg = cell["chord_g"]
        if cell["name"] == "drop1_peak" and local >= 6:
            cg *= 0.35
        if cell["name"] == "drop2_hole" and local < 2:
            cg *= 0.55
        if cg > 0.04 and not (predrop and True):
            cut0, cut1 = cell["cut0"], cell["cut1"]
            # interpolate cutoff across the 8-bar cell
            p = (local + 0.5) / 8.0
            cutoff = cut0 + (cut1 - cut0) * p
            if predrop:
                cutoff *= 0.6
            freqs = chords[ci]
            # voicing varies by cell so pads are not a copied block
            if cell["name"] in ("intro_mist", "outro_sparse"):
                freqs = [freqs[0], freqs[2], freqs[3]]
            elif cell["name"] in ("brk_mist", "outro_echo"):
                freqs = [freqs[0] * 0.5, freqs[1], freqs[2], freqs[3]]
            elif cell["name"] == "drop1_disco":
                freqs = [freqs[1], freqs[2], freqs[3]]
            elif cell["name"] == "outro_horizon":
                freqs = [freqs[0], freqs[2], freqs[3] * 2]
            elif cell["name"] == "drop2_final":
                freqs = list(freqs) + [freqs[-1] * 2]
            det = 14 if "brk" in cell["name"] or "outro" in cell["name"] or "intro" in cell["name"] else 9
            dur = BAR * (0.98 if "brk" in cell["name"] or "outro" in cell["name"] else 0.88)
            if not (predrop):
                pad_boost = 1.0
                if cell["name"] in ("intro_mist", "outro_sparse", "outro_horizon"):
                    pad_boost = 12.0
                elif cell["name"] in ("outro_echo", "brk_mist"):
                    pad_boost = 2.4
                bed = cell.get("bed", "saw")
                if bed in ("saw", "shimmer") and cg > 0.04:
                    for f in freqs:
                        L, R = E.supersaw_stereo(f, dur, det=det, n_osc=6, cutoff=cutoff)
                        E.add_stereo(music, t_body(bar), L, R, gain=cg * 0.15 * pad_boost)
                if bed in ("pulse",) and cg > 0.04:
                    for f in freqs[1:]:
                        L, R = E.pulse_pad_stereo(f, dur, cutoff=min(cutoff, 2800), pw=0.30)
                        E.add_stereo(music, t_body(bar), L, R, gain=cg * 0.22 * pad_boost)
                if bed in ("shimmer",) or cell["name"] in ("intro_mist", "outro_horizon", "outro_sparse"):
                    L, R = E.shimmer_bed(BAR, rng)
                    g = 0.28 if cell["name"] == "intro_mist" else 0.16
                    E.add_stereo(music, t_body(bar), L, R, gain=g)

        # filtered disco stabs (original pattern / voicing)
        if cell["disco"] > 0.05 and not predrop:
            vel = DISCO_VEL[cell["dvel"]]
            # slightly rotate the pattern each cell-bar so no 8-bar xerox
            rot = local % 8
            stab_cut = 700 + 2600 * ((local + 0.5) / 8.0)
            if cell["name"] == "drop1_disco":
                stab_cut = 500 + 3400 * ((local + 0.5) / 8.0)
            n16 = 16
            for s16 in range(n16):
                v = vel[(s16 + rot) % 16]
                if v < 0.12:
                    continue
                freqs = chords[ci][1:]  # mid voicing, leave the bass to the donk
                L, R = E.muted_stab(freqs, dur=0.075, cutoff=stab_cut, det=6)
                E.add_stereo(disco, t_body(bar) + s16 * (SPB / 4), L, R,
                             gain=cell["disco"] * 0.80 * v)

        # festival rolls, fills, toms
        do_roll = False
        steps, span, roll_g = 0, BAR, 0.14
        if cell["name"] == "build_festival" and local >= 5:
            do_roll, steps, span, roll_g = True, (8 if local == 5 else (16 if local == 6 else 12)), (BAR if local < 7 else SPB * 3), 0.13
        if cell["name"] == "build_lift" and local >= 4:
            do_roll, steps, span, roll_g = True, (8 if local == 4 else (16 if local == 5 else (20 if local == 6 else 14))), (BAR if local < 7 else SPB * 3), 0.15
        if cell["name"] in ("drop1_call", "drop1_peak", "drop2_chops", "drop2_final") and local == 7:
            do_roll, steps, span, roll_g = True, 20, BAR, 0.13
        if cell["name"] == "drop2_hole" and local == 1:
            # roll into the slam at bar 106
            do_roll, steps, span, roll_g = True, 16, BAR, 0.16
        if do_roll:
            for k in range(steps):
                pos = t_body(bar) + k * (span / steps)
                vel = 0.18 + 0.82 * (k / max(steps - 1, 1))
                E.add_mono(drums, pos, snares["hit"], gain=roll_g * vel, pan=0.0)
                if k % 4 == 3:
                    E.add_mono(drums, pos, snares["rim"], gain=roll_g * 0.5 * vel, pan=0.1)

        # tom fills (unique per cell)
        if cell["name"] == "drop1_call" and local == 7:
            for off, f, g in ((0.0, 155.0, 0.35), (0.5, 130.0, 0.38), (1.0, 98.0, 0.42), (2.0, 82.0, 0.50)):
                E.add_mono(drums, t_body(bar, 1) + off * SPB, toms[f], gain=g, pan=-0.1)
        if cell["name"] == "drop2_chops" and local == 7:
            for off, f, g in ((0.0, 130.0, 0.32), (0.25, 155.0, 0.28), (0.5, 98.0, 0.40), (1.5, 82.0, 0.48)):
                E.add_mono(drums, t_body(bar, 2) + off * SPB, toms[f], gain=g, pan=0.08)
        if cell["name"] == "drop2_final" and local == 7:
            for off, f, g in ((0.0, 155.0, 0.30), (0.33, 130.0, 0.34), (0.66, 98.0, 0.40), (1.0, 82.0, 0.50)):
                E.add_mono(drums, t_body(bar, 2) + off * SPB, toms[f], gain=g, pan=-0.06)

        # ---------------- FX: festival builds, impacts, ear candy ----------------
        if bar == 8:
            E.add_mono(fx, t_body(8), riser8, gain=0.32, pan=0.0)
            E.add_mono(fx, t_body(8), sweep8, gain=0.22, pan=0.0)
        if bar == 12:
            E.add_mono(fx, t_body(12), riser4, gain=0.28, pan=0.0)
        if bar == 14:
            E.add_mono(fx, t_body(14), sweep2, gain=0.40, pan=0.0)
            E.add_mono(fx, t_body(14), rev_cym, gain=0.30, pan=-0.1)
        if bar == 16:
            E.add_mono(fx, t_body(16), crash, gain=0.62, pan=0.0)
            E.add_mono(drums, t_body(16), impact, gain=0.85, pan=0.0)
        if bar == 64:
            E.add_mono(fx, t_body(64), riser8, gain=0.36, pan=0.0)
            E.add_mono(fx, t_body(64), sweep8, gain=0.26, pan=0.0)
        if bar == 68:
            E.add_mono(fx, t_body(68), riser4, gain=0.30, pan=0.0)
        if bar == 70:
            E.add_mono(fx, t_body(70), sweep2, gain=0.46, pan=0.0)
            E.add_mono(fx, t_body(70), rev_cym, gain=0.34, pan=0.1)
        if bar == 72:
            E.add_mono(fx, t_body(72), crash, gain=0.70, pan=0.0)
            E.add_mono(drums, t_body(72), impact, gain=0.95, pan=0.0)
        if bar == 106:
            E.add_mono(fx, t_body(106), crash, gain=0.55, pan=0.0)
            E.add_mono(drums, t_body(106), impact, gain=0.80, pan=0.0)
        if bar in (24, 32, 40, 80, 88, 96, 112):
            E.add_mono(fx, t_body(bar), crash, gain=0.30, pan=0.0)
        if bar == 48:
            E.add_mono(fx, t_body(48), impact_soft, gain=0.35, pan=0.0)
        # ear candy unique-ish by cell
        if local == 3 and cell["hats"] > 0.3:
            E.add_mono(fx, t_body(bar, 2), rev_cym, gain=0.20, pan=-0.12)
        if local == 0 and cell["name"].startswith("drop") and src not in (16, 72, 106):
            E.add_mono(fx, t_body(bar) - 0.02, down_8th, gain=0.12, pan=0.1)
        if local == 2 and cell["name"].startswith("drop"):
            E.add_mono(fx, t_body(bar, 3, 1), zaps[(src // 4) % len(zaps)], gain=0.16, pan=0.22)
        if cell["name"] == "drop2_final" and local in (0, 4):
            E.add_mono(fx, t_body(bar, 0), crash, gain=0.22, pan=0.0)
        if cell["name"] == "drop2_final" and local == 4:
            E.add_mono(fx, t_body(bar), sweep4, gain=0.28, pan=0.0)

        # ---------------- vocals (unique per cell) ----------------
        pitched = bool(cell.get("pitch"))
        plan = cell["vocal"]
        t0 = t_body(bar)

        if plan == "intro" and local == 4:
            place_stem(vocals, t0, bank["chop_glen_dry"] if "chop_glen_dry" in bank else bank["chop_glen"], gain=0.38)
        if plan == "intro" and local == 6:
            place_stem(vocals, t0, bank["tag"], gain=0.32)

        if plan == "build1" and local == 2:
            hook(vocals, t0, "a", gain=0.42, layers="lead", dry=True)
        if plan == "build1" and local == 4:
            hook(vocals, t0, "a", gain=0.62, layers="thick")
        if plan == "build1" and local == 6:
            hook(vocals, t0, "b", gain=0.80, layers="thick")
        if plan == "build1" and local == 7:
            place_stem(vocals, t_body(bar, 2), bank["tag"], gain=1.05)

        if plan == "drop1_hit" and local % 2 == 0:
            hook(vocals, t0, "a" if local % 4 == 0 else "b", gain=1.00, layers="full")
        if plan == "drop1_hit" and local == 3:
            place_stem(vocals, t_body(bar, 3, 1), bank["chop_hey"], gain=0.42)
        if plan == "drop1_hit" and local == 7:
            place_stem(vocals, t_body(bar, 3), bank["chop_yeah"], gain=0.40)

        if plan == "drop1_disco" and local in (0, 2):
            hook(vocals, t0, "a" if local == 0 else "b", gain=0.92, layers="full")
        if plan == "drop1_disco" and local == 4:
            hook(vocals, t0, "a", gain=0.80, layers="oct")
        if plan == "drop1_disco" and local == 1:
            place_stem(vocals, t_body(bar, 1), bank["chop_oh"], gain=0.55)
        if plan == "drop1_disco" and local == 5:
            place_stem(vocals, t0, bank["chop_dance"], gain=0.60)
            place_stem(vocals, t_body(bar, 2), bank["chop_glen"], gain=0.50)
        if plan == "drop1_disco" and local == 6:
            hook(vocals, t0, "b", gain=0.70, layers="lead")
        if plan == "drop1_disco" and local == 7:
            place_stem(vocals, t_body(bar, 2), bank["chop_up"], gain=0.48)

        if plan == "drop1_call" and local in (0, 2, 4):
            hook(vocals, t0, "a" if local % 4 == 0 else "b", gain=0.95, layers="full")
        if plan == "drop1_call" and local == 1:
            place_stem(vocals, t0, bank["chop_glen"], gain=0.70)
            place_stem(vocals, t_body(bar, 2), bank["chop_sleep"], gain=0.55)
        if plan == "drop1_call" and local == 3:
            place_stem(vocals, t0, bank["chop_dance"], gain=0.65)
            place_stem(vocals, t_body(bar, 2), bank["chop_hey"], gain=0.50)
        if plan == "drop1_call" and local == 5:
            place_stem(vocals, t0, bank["chop_oh"], gain=0.55)
            place_stem(vocals, t_body(bar, 2), bank["chop_yeah"], gain=0.55)
        if plan == "drop1_call" and local == 6:
            hook(vocals, t0, "a", gain=0.85, layers="thick")

        if plan == "drop1_peak" and local == 0:
            hook(vocals, t0, "a", gain=0.85, layers="lead")
        if plan == "drop1_peak" and local in (1, 2, 3, 4, 5):
            cycle = ["chop_hey", "chop_yeah", "chop_oh", "chop_glen", "chop_dance"]
            name = cycle[local % len(cycle)]
            place_stem(vocals, t0, bank[name], gain=0.72)
            place_stem(vocals, t_body(bar, 2), bank[cycle[(local + 2) % len(cycle)]], gain=0.55)
        if plan == "drop1_peak" and local == 6:
            place_stem(vocals, t0, bank["chop_oh"], gain=0.50)
            place_stem(vocals, t_body(bar, 2), bank["tag"], gain=0.55)

        if plan == "brk_mist" and local == 0:
            hook(vocals, t0, "e", gain=0.78, layers="thick", dry=False)
        if plan == "brk_mist" and local == 2:
            place_stem(vocod, t0, voc_e, gain=0.55)
            hook(vocals, t0, "e", gain=0.28, layers="harm", dry=True)
        if plan == "brk_mist" and local == 4:
            place_stem(vocod, t0, voc_e, gain=0.40)
        if plan == "brk_mist" and local == 6:
            hook(vocals, t0, "e", gain=0.45, layers="lead", dry=True)

        if plan == "brk_home" and local == 0:
            hook(vocals, t0, "f", gain=0.82, layers="full")
        if plan == "brk_home" and local == 2:
            hook(vocals, t0, "f", gain=0.55, layers="harm")
            place_stem(vocod, t0, voc_f, gain=0.45)
        if plan == "brk_home" and local == 4:
            hook(vocals, t0, "f", gain=0.70, layers="thick")
        if plan == "brk_home" and local == 6:
            place_stem(vocod, t0, voc_f, gain=0.35)
            place_stem(vocals, t_body(bar, 2), bank["tag"], gain=0.40)

        if plan == "build2" and local == 0:
            hook(vocals, t0, "c", gain=0.55, layers="thick")
        if plan == "build2" and local == 2:
            hook(vocals, t0, "d", gain=0.70, layers="thick")
        if plan == "build2" and local == 4:
            hook(vocals, t0, "c", gain=0.85, layers="full")
        if plan == "build2" and local == 6:
            hook(vocals, t0, "d", gain=0.90, layers="full")
        if plan == "build2" and local == 7:
            place_stem(vocals, t_body(bar, 2), bank["tag_p2"], gain=1.08)

        if plan == "drop2_lift" and local % 2 == 0:
            hook(vocals, t0, "c" if local % 4 == 0 else "d", gain=1.04, layers="full", pitched=True)
        if plan == "drop2_lift" and local == 3:
            place_stem(vocals, t_body(bar, 3, 1), bank["chop_yeah_p2"], gain=0.42)
        if plan == "drop2_lift" and local == 7:
            place_stem(vocals, t_body(bar, 2), bank["chop_up_p2"], gain=0.48)

        if plan == "drop2_counter" and local == 0:
            hook(vocals, t0, "g", gain=0.95, layers="full", pitched=True)
            place_stem(vocod, t0, voc_g, gain=0.38)
        if plan == "drop2_counter" and local == 2:
            hook(vocals, t0, "c", gain=0.72, layers="thick", pitched=True)
        if plan == "drop2_counter" and local == 4:
            hook(vocals, t0, "g", gain=0.98, layers="full", pitched=True)
            place_stem(vocod, t0, voc_g, gain=0.40)
        if plan == "drop2_counter" and local == 6:
            hook(vocals, t0, "d", gain=0.75, layers="thick", pitched=True)
        if plan == "drop2_counter" and local == 5:
            place_stem(vocals, t_body(bar, 2), bank["chop_hey_p2"], gain=0.45)

        if plan == "drop2_chops":
            cycle = ["chop_oh_p2", "chop_hey_p2", "chop_yeah_p2", "chop_glen_p2",
                     "chop_dance_p2", "chop_up_p2", "chop_sleep_p2"]
            # rhythmic chop hook, unique 16th placements per bar
            hits = {
                0: [(0, 0), (1, 0), (2, 1), (3, 0)],
                1: [(0, 1), (1, 1), (3, 1)],
                2: [(0, 0), (2, 0), (3, 1)],
                3: [(1, 0), (1, 1), (2, 1), (3, 0)],
                4: [(0, 0), (1, 0), (2, 0)],
                5: [(0, 1), (2, 1), (3, 1)],
                6: [(0, 0), (3, 0)],
                7: [(2, 0)],
            }[local]
            for beat, eighth in hits:
                name = cycle[(local * 3 + beat + eighth) % len(cycle)]
                place_stem(vocals, t_body(bar, beat, eighth), bank[name], gain=0.62)
            if local == 4:
                hook(vocals, t0, "c", gain=0.55, layers="lead", pitched=True)

        if plan == "drop2_recall" and local == 0:
            hook(vocals, t0, "a", gain=0.92, layers="full", pitched=True)
        if plan == "drop2_recall" and local == 1:
            hook(vocals, t0, "g", gain=0.80, layers="thick", pitched=True)
            place_stem(vocod, t0, voc_g, gain=0.30)
        if plan == "drop2_recall" and local == 2:
            hook(vocals, t0, "b", gain=0.92, layers="full", pitched=True)
        if plan == "drop2_recall" and local == 3:
            place_stem(vocals, t_body(bar, 0), bank["chop_glen_p2"], gain=0.55)
            place_stem(vocals, t_body(bar, 2), bank["chop_yeah_p2"], gain=0.50)
        if plan == "drop2_recall" and local == 4:
            hook(vocals, t0, "a", gain=0.88, layers="thick", pitched=True)
            hook(vocals, t0, "g", gain=0.55, layers="lead", pitched=True)
        if plan == "drop2_recall" and local == 6:
            hook(vocals, t0, "b", gain=0.85, layers="full", pitched=True)

        if plan == "drop2_hole" and local == 0:
            hook(vocals, t0, "c", gain=0.45, layers="lead", pitched=True, dry=True)
            place_stem(vocod, t0, voc_c2, gain=0.35)
        if plan == "drop2_hole" and local == 1:
            place_stem(vocals, t_body(bar, 2), bank["chop_oh_p2"], gain=0.40)
        if plan == "drop2_hole" and local in (2, 4, 6):
            hook(vocals, t0, "c" if local % 4 == 2 else "d", gain=1.05, layers="full", pitched=True)
        if plan == "drop2_hole" and local == 5:
            hook(vocals, t0, "g", gain=0.70, layers="thick", pitched=True)

        if plan == "drop2_final" and local in (0, 2):
            hook(vocals, t0, "c" if local == 0 else "d", gain=1.02, layers="full", pitched=True)
            place_stem(vocod, t0, voc_c2 if local == 0 else voc_g, gain=0.22)
        if plan == "drop2_final" and local == 4:
            hook(vocals, t0, "g", gain=0.95, layers="full", pitched=True)
            hook(vocals, t0, "c", gain=0.55, layers="oct", pitched=True)
            place_stem(vocod, t0, voc_g, gain=0.32)
        if plan == "drop2_final" and local == 6:
            hook(vocals, t0, "d", gain=0.90, layers="full", pitched=True)
        if plan == "drop2_final" and local == 5:
            place_stem(vocals, t_body(bar, 3, 1), bank["chop_yeah_p2"], gain=0.48)
        if plan == "drop2_final" and local == 7:
            place_stem(vocals, t_body(bar, 2), bank["tag_p2"], gain=0.60)

        if plan == "outro_echo" and local == 0:
            place_stem(vocod, t0, voc_e, gain=0.62)
            hook(vocals, t0, "e", gain=0.35, layers="lead", dry=True)
        if plan == "outro_echo" and local == 4:
            place_stem(vocod, t0, voc_f, gain=0.50)
            hook(vocals, t0, "f", gain=0.30, layers="harm", dry=True)

        if plan == "outro_sparse" and local == 2:
            place_stem(vocals, t0, bank["chop_glen"], gain=0.28)
        if plan == "outro_sparse" and local == 6:
            place_stem(vocals, t0, bank["tag"], gain=0.22)

        if plan == "outro_horizon" and local == 4:
            place_stem(vocod, t0, voc_e, gain=0.28)
        if plan == "outro_horizon" and local == 6:
            place_stem(vocals, t0, bank["chop_glen_dry"] if "chop_glen_dry" in bank else bank["chop_glen"], gain=0.18)

    print("sidechain, disco filter, depth, glue…")
    duck = E.sidechain(N, kick_times, depth=0.92, rel=0.145)
    duck_v = 0.32 + 0.68 * duck
    duck_disco = E.sidechain(N, kick_times, depth=0.96, rel=0.120)
    music *= duck[:, None]
    drums *= duck[:, None]
    fx *= duck[:, None]
    vocals *= duck_v[:, None]
    vocod *= duck[:, None]
    bass_bus *= duck[:, None]
    # talking filter on the disco bus, then a hard pump
    # unique cutoff motion per section so it is not a static wah
    cutoff = np.full(N, 1800.0)
    for c in CELLS:
        a = int(round((preroll + c["start"] * BAR) * SR))
        b = int(round((preroll + (c["start"] + 8) * BAR) * SR))
        b = min(b, N)
        if c["disco"] <= 0.05:
            cutoff[a:b] = 900
            continue
        lo, hi = 450.0, 3800.0
        if c["name"] == "drop1_disco":
            lo, hi = 380.0, 4600.0
        if c["name"].startswith("drop2"):
            lo, hi = 550.0, 4200.0
        tlin = np.linspace(0, 1, max(b - a, 1))
        # two-hump open/close so it breathes inside the cell
        motion = 0.5 - 0.5 * np.cos(2 * np.pi * (tlin * 2 + (c["start"] % 5) * 0.07))
        cutoff[a:b] = lo + (hi - lo) * motion
    disco = E.tv_lowpass_stereo(disco, cutoff, Q=1.15, block=256)
    disco *= duck_disco[:, None]

    duck_low = E.sidechain(N, kick_times, depth=0.94, rel=0.075)
    duck_mid = 0.62 + 0.38 * duck
    donk_sat = E.parallel_sat(donk_bus, drive=2.6, mix=0.45, hp=70, focus_hz=92)
    low = np.stack([E.sos_lp(donk_sat[:, 0], 120, 2), E.sos_lp(donk_sat[:, 1], 120, 2)], 1)
    mid = donk_sat - low
    donk_bus = low * duck_low[:, None] + mid * duck_mid[:, None]

    # Mix depth: short room on drums, longer plate on pads/vocoder, predelay
    print("mix depth (rooms / plates)…")
    drum_ir = make_room_ir(0.32, rng, decay=4.2, dark=6500)
    pad_ir = make_room_ir(1.55, rng, decay=3.0, dark=3800)
    drums = E.convolve_stereo(drums, drum_ir, wet=0.16, dry=0.84, predelay_s=0.010)
    music = E.convolve_stereo(music, pad_ir, wet=0.26, dry=0.74, predelay_s=0.032)
    vocod = E.convolve_stereo(vocod, pad_ir, wet=0.35, dry=0.65, predelay_s=0.040)
    # vocal delay throws already in stems; a light ping-pong for width on chops/vocoder
    vocod = E.ping_pong_delay(vocod, SPB * 0.75, fb=0.22, mix=0.18)

    # Pre-drop holes (~120 ms near-silence before drop downbeats)
    for hit_bar in (16, 72):
        t_hit = t_body(hit_bar)
        i1 = int(round(t_hit * SR))
        i0 = int(round((t_hit - 0.12) * SR))
        i0 = max(0, i0)
        fade_n = int(0.04 * SR)
        hole = np.ones(i1 - i0)
        if fade_n < len(hole):
            hole[:fade_n] = np.linspace(1.0, 0.04, fade_n)
            hole[fade_n:] = 0.04
        for bus in (drums, donk_bus, bass_bus, music, disco, fx, vocals, vocod, kick_bus):
            bus[i0:i1] *= hole[:, None]

    tops = music + fx + disco * 1.05 + vocod * 0.85
    mix = kick_bus * 1.10 + drums * 1.28 + donk_bus * 1.10 + bass_bus * 1.05 + tops * 1.08 + vocals * 2.10

    i0 = int(round(preroll * SR))
    target = int(round(BARS * 4 * SPB * SR))
    body = mix[i0:i0 + target].copy()
    if body.shape[0] < target:
        body = np.pad(body, ((0, target - body.shape[0]), (0, 0)))
    elif body.shape[0] > target:
        body = body[:target]

    body = body - np.mean(body, axis=0)
    body = E.mono_below(body, hz=150)
    body = E.widen_highs(body, hz=550, amount=1.42)
    # Kick-led low end; lighter 80–100 boost so the donk does not bury the air
    body[:, 0] = E.rbj(E.rbj(E.rbj(body[:, 0], 50, 0.90, "peak", gain_db=3.0), 72, 1.1, "peak", gain_db=2.0), 95, 1.2, "peak", gain_db=0.8)
    body[:, 1] = E.rbj(E.rbj(E.rbj(body[:, 1], 50, 0.90, "peak", gain_db=3.0), 72, 1.1, "peak", gain_db=2.0), 95, 1.2, "peak", gain_db=0.8)
    # Presence + air: commercial masters live in 2–8 kHz; we were ~9 dB shy
    body[:, 0] = E.rbj(E.rbj(body[:, 0], 1800, 0.9, "peak", gain_db=1.6), 3300, 0.80, "peak", gain_db=4.2)
    body[:, 1] = E.rbj(E.rbj(body[:, 1], 1800, 0.9, "peak", gain_db=1.6), 3300, 0.80, "peak", gain_db=4.2)
    body[:, 0] = E.rbj(body[:, 0], 6000, 0.85, "peak", gain_db=3.6)
    body[:, 1] = E.rbj(body[:, 1], 6000, 0.85, "peak", gain_db=3.6)
    body[:, 0] = E.rbj(body[:, 0], 9000, 0.65, "highshelf", gain_db=2.6)
    body[:, 1] = E.rbj(body[:, 1], 9000, 0.65, "highshelf", gain_db=2.6)
    body = E.harmonic_exciter(body, amount=0.24, freq=4200, ceil=14000)

    from scipy.ndimage import uniform_filter1d
    n = len(body)
    sec_db = {
        "intro": -1.4, "build1": -0.8, "drop1": 0.0, "break": -3.0,
        "build2": -0.6, "drop2": 0.18, "outro": -1.8,
    }
    env = np.ones(n)
    for name, (a, b) in SEC.items():
        ia, ib = int(a * BAR * SR), min(int(b * BAR * SR), n)
        env[ia:ib] = 10 ** (sec_db[name] / 20.0)
    env = uniform_filter1d(env, size=int(0.25 * SR), mode="nearest")
    body *= env[:, None]

    peak = np.max(np.abs(body)) + 1e-12
    body = body / peak * 0.78
    body = E.glue(body, thresh=0.34, ratio=2.5, att_s=0.007, rel_s=0.13)
    body = E.seamless_loop(body, xfade_s=0.08, polish_s=0.012)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    tmp = OUT_DIR / "_premaster.wav"
    sf.write(str(tmp), body, SR, subtype="FLOAT")

    tmp_drop = OUT_DIR / "_drop_measure.wav"
    d1 = body[int(SEC["drop1"][0] * BAR * SR): int(SEC["drop1"][1] * BAR * SR)]
    d2 = body[int(SEC["drop2"][0] * BAR * SR): int(SEC["drop2"][1] * BAR * SR)]
    sf.write(str(tmp_drop), np.concatenate([d1, d2], axis=0), SR, subtype="FLOAT")
    st = lufs_ffmpeg(tmp_drop)
    print("drop LUFS before gain", {k: st[k] for k in st if k != "S"})
    cur_s = st.get("S_max")
    if cur_s is None:
        cur_s = st.get("I", -14.0) + 1.0
    target_s = -8.5
    gain_db = float(np.clip(target_s - cur_s, -6.0, 10.0))
    print(f"applying {gain_db:+.2f} dB to reach short-term ~{target_s} LUFS")
    body = body * (10 ** (gain_db / 20.0))
    pre = OUT_DIR / "_prelimit.wav"
    post = OUT_DIR / "_postlimit.wav"
    body = true_peak_limit(body, pre, post)
    body = E.seamless_loop(body, xfade_s=0.06, polish_s=0.010)

    sf.write(str(tmp_drop), np.concatenate([
        body[int(SEC["drop1"][0] * BAR * SR): int(SEC["drop1"][1] * BAR * SR)],
        body[int(SEC["drop2"][0] * BAR * SR): int(SEC["drop2"][1] * BAR * SR)],
    ], axis=0), SR, subtype="FLOAT")
    st2 = lufs_ffmpeg(tmp_drop)
    print("drop LUFS after limit", {k: st2[k] for k in st2 if k != "S"})
    smax = st2.get("S_max")
    if smax is not None and smax < -8.85 and st2.get("TP", 0) <= -1.0:
        make_up = min(-8.55 - smax, 1.2)
        print(f"makeup {make_up:+.2f} dB")
        body = body * (10 ** (make_up / 20.0))
        body = true_peak_limit(body, pre, post)
        sf.write(str(tmp_drop), np.concatenate([
            body[int(SEC["drop1"][0] * BAR * SR): int(SEC["drop2"][1] * BAR * SR)][0:0],  # placeholder
        ], axis=0) if False else np.concatenate([
            body[int(SEC["drop1"][0] * BAR * SR): int(SEC["drop1"][1] * BAR * SR)],
            body[int(SEC["drop2"][0] * BAR * SR): int(SEC["drop2"][1] * BAR * SR)],
        ], axis=0), SR, subtype="FLOAT")
        st2 = lufs_ffmpeg(tmp_drop)
        print("drop LUFS after makeup", {k: st2[k] for k in st2 if k != "S"})

    body = E.seamless_loop(body, xfade_s=0.06, polish_s=0.010)

    wav = OUT_DIR / "music-hardcore.wav"
    mp3 = OUT_DIR / "music-hardcore.mp3"
    sf.write(str(wav), body, SR, subtype="PCM_24")

    def enc(src, dst, *codec):
        subprocess.check_call(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-i", str(src), *codec, "-ar", "44100", str(dst)]
        )

    enc(wav, mp3, "-codec:a", "libmp3lame", "-b:a", "192k")
    if WIRE_GAME:
        enc(wav, MUSIC / "hardcore_remix.mp3", "-codec:a", "libmp3lame", "-b:a", "160k")
        enc(wav, MUSIC / "hardcore_remix.ogg", "-codec:a", "libvorbis", "-q:a", "4")
        print("game assets", (MUSIC / "hardcore_remix.mp3").stat().st_size,
              (MUSIC / "hardcore_remix.ogg").stat().st_size)

    y, sr = sf.read(str(wav), always_2d=True)

    # Internal section wavs only (no preview-*.mp3)
    for name, (a, b) in SEC.items():
        ia, ib = int(a * BAR * sr), int(b * BAR * sr)
        sf.write(str(OUT_DIR / f"section-{name}.wav"), y[ia:ib], sr, subtype="PCM_24")

    n2 = int(2.0 * sr)
    join = np.concatenate([y[-n2:], y[:n2]], axis=0)
    sf.write(str(OUT_DIR / "loop-join.wav"), join, sr, subtype="PCM_24")

    # Similarity
    sim = similarity_report(y, sr, OUT_DIR / "SIMILARITY.json")

    # A/B vs reference (internal)
    ref_path = Path("/workspace/qa/audio-1260/ref/t1132-ref.wav")
    report = {"drop": {k: st2[k] for k in st2 if k != "S"}, "similarity_flagged": sim["flagged"], "similarity_top10": sim["top10"]}
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

    full_st = lufs_ffmpeg(wav)
    report["full"] = {k: full_st[k] for k in full_st if k != "S"}
    report["clips"] = int(np.sum(np.abs(y) >= 0.999))
    report["peak"] = float(np.max(np.abs(y)))
    report["wrap_step"] = float(np.max(np.abs(y[0] - y[-1])))
    report["duration_s"] = float(len(y) / sr)
    (OUT_DIR / "ANALYSIS.json").write_text(json.dumps(report, indent=2))
    print("full", report["full"], "clips", report["clips"], "peak", report["peak"], "wrap", report["wrap_step"])
    write_critique(y, sr, report, sim, OUT_DIR / "CRITIQUE.json")

    tmp.unlink(missing_ok=True)
    tmp_drop.unlink(missing_ok=True)
    print("done", wav, "dur", len(y) / sr)
    return wav


if __name__ == "__main__":
    render()
