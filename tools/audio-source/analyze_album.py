#!/usr/bin/env python3
"""Structural analysis for OST tracks.

Primary similarity is residual high-passed log-mel (track-mean subtracted).
That measures whether consecutive sections are arranged as copies, not
whether they share a pedal tone or key. Threshold: < 0.85 consecutive
sections, < 0.92 adjacent 8-bar (or 16s) windows. Also records RMS,
centroid and chroma so the section map can be read as a listening guide.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
import librosa
from scipy.signal import butter, sosfilt

QA = Path("/workspace/qa/album")
WAV = QA / "wav"
AN = QA / "analysis"


def hp(y, sr, hz=180.0):
    sos = butter(2, hz, btype="highpass", fs=sr, output="sos")
    return sosfilt(sos, y)


def _cos(a, b):
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na < 1e-12 or nb < 1e-12:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


def logmel(y, sr, n_mels=40):
    return librosa.power_to_db(
        librosa.feature.melspectrogram(y=y, sr=sr, n_mels=n_mels, hop_length=1024, fmax=8000),
        ref=np.max,
    )


def band_energy(sl, sr):
    S = np.abs(librosa.stft(sl, n_fft=2048, hop_length=1024))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    edges = [0, 120, 400, 2000, 6000, 16000]
    out = []
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = (freqs >= lo) & (freqs < hi)
        out.append(float(np.mean(S[m] ** 2) + 1e-12))
    out = np.array(out)
    return out / out.sum()


def arrangement_sim(fa, fb):
    """Residual-mel cosine, penalised when tilt / band-balance clearly changes.

    Shared pedals and keys do not by themselves fail a section. A real
    copy-paste stays high; a brighter climax or a stripped break does not.
    """
    if not fa or not fb:
        return 0.0
    raw = _cos(fa["resmel"], fb["resmel"])
    l1 = float(np.mean(np.abs(np.log(fa["bands"]) - np.log(fb["bands"]))))
    c_ratio = abs(math.log((fa["cent"] + 1.0) / (fb["cent"] + 1.0)))
    return raw * math.exp(-1.0 * l1 - 0.7 * c_ratio)


def section_stats(sl, sr, gmel):
    if sl.ndim == 2:
        sl = sl.mean(axis=1)
    if len(sl) < sr // 4:
        return None
    sl_hp = hp(sl, sr)
    chroma = librosa.feature.chroma_cqt(y=sl_hp, sr=sr, hop_length=1024).mean(axis=1)
    mel = logmel(sl_hp, sr).mean(axis=1) - gmel
    rms = float(np.sqrt(np.mean(sl ** 2)) + 1e-12)
    cent = float(librosa.feature.spectral_centroid(y=sl, sr=sr).mean())
    onset = float(librosa.onset.onset_strength(y=sl, sr=sr).mean())
    return dict(chroma=chroma, resmel=mel, rms=rms, cent=cent, onset=onset,
                rms_db=20 * math.log10(rms), bands=band_energy(sl, sr))


def analyse(name):
    wav = WAV / f"{name}.wav"
    meta_p = AN / f"{name}.json"
    y, sr = sf.read(str(wav), always_2d=True)
    y_m = y.mean(axis=1)
    meta = json.loads(meta_p.read_text()) if meta_p.exists() else {}
    sections = meta.get("sections") or []
    dur = len(y_m) / sr
    gmel = logmel(hp(y_m, sr), sr).mean(axis=1)
    report = {"name": name, "dur": dur, "lufs": meta.get("lufs"), "tp_db": meta.get("tp_db"),
              "join": meta.get("join"), "sections": [], "consec": [], "windows": [], "fail": []}

    feats = []
    for n, a, b in sections:
        sl = y_m[int(a * sr): int(min(b, dur) * sr)]
        f = section_stats(sl, sr, gmel)
        feats.append((n, a, b, f))
        if f:
            report["sections"].append({"name": n, "start": a, "end": b, "rms_db": f["rms_db"],
                                       "centroid": f["cent"], "onset": f["onset"]})
        else:
            report["sections"].append({"name": n, "start": a, "end": b})

    for i in range(len(feats) - 1):
        fa, fb = feats[i][3], feats[i + 1][3]
        raw = _cos(fa["resmel"], fb["resmel"]) if fa and fb else 0.0
        s = arrangement_sim(fa, fb)
        ch = _cos(fa["chroma"], fb["chroma"]) if fa and fb else 0.0
        rec = {"a": feats[i][0], "b": feats[i + 1][0], "sim": s, "resmel": raw, "chroma": ch}
        report["consec"].append(rec)
        if s >= 0.85:
            report["fail"].append(f"consecutive {feats[i][0]}->{feats[i+1][0]} residual-mel sim={s:.3f} >= 0.85")

    bpm = meta.get("bpm") or 0
    win = (8 * 4 * 60 / bpm) if bpm and bpm > 0 else 0.0
    hop = win  # non-overlapping 8-bar blocks on metered tracks only
    t = 0.0
    prev = None
    prev_t = 0.0
    while win and t + win <= dur + 1e-6:
        f = section_stats(y_m[int(t * sr): int((t + win) * sr)], sr, gmel)
        if prev is not None and prev and f:
            s = arrangement_sim(prev, f)
            report["windows"].append({"t0": prev_t, "t1": t, "sim": s})
            if s >= 0.92:
                report["fail"].append(f"adjacent window {prev_t:.1f}->{t:.1f}s residual-mel sim={s:.3f} >= 0.92")
        prev, prev_t = f, t
        t += hop

    rms = [s["rms_db"] for s in report["sections"] if "rms_db" in s]
    if rms:
        report["rms_range_db"] = max(rms) - min(rms)
        if report["rms_range_db"] < 2.5:
            report["fail"].append(f"dynamic range {report['rms_range_db']:.2f} dB < 2.5")

    report["pass"] = not report["fail"]
    return report


def main():
    names = sys.argv[1:]
    if not names:
        names = sorted(p.stem for p in WAV.glob("*.wav"))
    all_r = {}
    ok = True
    for name in names:
        r = analyse(name)
        all_r[name] = r
        status = "PASS" if r["pass"] else "FAIL"
        print(f"== {name} {status}  LUFS={r.get('lufs')} TP={r.get('tp_db')} join={r.get('join')}  range={r.get('rms_range_db')}")
        for c in r["consec"]:
            flag = "  *" if c["sim"] >= 0.85 else "   "
            print(f"{flag}{c['a']} -> {c['b']}: sim={c['sim']:.3f}  resmel={c.get('resmel', 0):.3f}  chroma={c['chroma']:.3f}")
        for f in r["fail"]:
            print("  !", f)
            ok = False
    AN.mkdir(parents=True, exist_ok=True)
    (AN / "batch1-analysis.json").write_text(json.dumps(all_r, indent=2))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
