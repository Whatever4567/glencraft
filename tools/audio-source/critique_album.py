#!/usr/bin/env python3
"""Automated self-listen critique for every Album track.

Not a human listen pass and not a MOS. Scores onset/groove, melodic
interest (pitch-class entropy and motif recurrence with variation),
spectral balance against a genre target, mud/harshness, and whether
the track has a memorable motif plus an emotional lift.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

QA = Path("/workspace/qa/album")
WAV = QA / "wav"
AN = QA / "analysis"
OUT = QA / "critique"

# Band edges matching analyze_album.band_energy
BANDS = [0, 120, 400, 2000, 6000, 16000]

# Genre targets: fractions of STFT energy in those five bands.
TARGETS = {
    "bounce": np.array([0.20, 0.18, 0.30, 0.22, 0.10]),
    "combat": np.array([0.20, 0.22, 0.28, 0.20, 0.10]),
    "dance":  np.array([0.16, 0.20, 0.30, 0.22, 0.12]),
    "pastoral": np.array([0.14, 0.26, 0.32, 0.18, 0.10]),
    "ambient": np.array([0.18, 0.32, 0.30, 0.14, 0.06]),
    "space": np.array([0.22, 0.25, 0.25, 0.18, 0.10]),
    "scenic": np.array([0.16, 0.24, 0.30, 0.20, 0.10]),
}

CONTEXT_GENRE = {
    "bounce": "bounce", "combat": "combat", "crystal": "combat", "boss": "combat",
    "popstar": "dance", "day": "pastoral", "night": "pastoral", "pine": "pastoral",
    "moor": "pastoral", "high": "scenic", "loch": "scenic", "menu": "pastoral",
    "credits": "pastoral", "creative": "pastoral",
    "blue": "ambient", "purple": "ambient", "agartha": "ambient", "cave1": "ambient",
    "hell": "ambient", "underwater": "ambient",
    "moon": "space", "mars": "space", "space": "space",
    "volcano": "scenic", "snow": "scenic", "desert": "scenic",
}

# Known beatless / drone cues: groove tests are not applied the same way.
BEATLESS = {
    "blue_vault", "choir_of_the_hollow", "purple_chamber", "inner_sun",
    "stone_memory", "below_the_map", "between_worlds", "red_horizon",
    "silver_sea",
}


def band_energy(y, sr):
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=1024))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    out = []
    for lo, hi in zip(BANDS[:-1], BANDS[1:]):
        m = (freqs >= lo) & (freqs < hi)
        out.append(float(np.sum(S[m] ** 2) + 1e-12))
    out = np.array(out)
    return out / out.sum()


def entropy(p, axis=0):
    p = np.asarray(p, dtype=np.float64)
    p = np.clip(p, 1e-12, 1.0)
    if p.ndim == 1:
        p = p / p.sum()
        return float(-(p * np.log2(p)).sum())
    p = p / p.sum(axis=axis, keepdims=True)
    return -(p * np.log2(p)).sum(axis=axis)


def load(name):
    y, sr = sf.read(str(WAV / f"{name}.wav"), always_2d=True)
    meta = {}
    p = AN / f"{name}.json"
    if p.exists():
        meta = json.loads(p.read_text())
    return y, sr, meta


def groove(y, sr, bpm, beatless):
    mono = y.mean(axis=1)
    onset = librosa.onset.onset_strength(y=mono, sr=sr, hop_length=512)
    notes = []
    score = 1.0
    if beatless:
        # low, irregular onsets are expected
        density = float(onset.mean())
        notes.append(f"beatless onset density {density:.3f}")
        return dict(score=0.85 if density < 1.6 else 0.65, notes=notes, regular=None, offbeat=None)
    if not bpm:
        return dict(score=0.5, notes=["no bpm"], regular=None, offbeat=None)
    hop = 512
    ac = librosa.autocorrelate(onset, max_size=int(4 * sr / hop))
    ac[0] = 0
    beat_frames = (60.0 / bpm) * sr / hop
    # score peak at 1 beat and at 0.5 beat (off-beat donk / hats)
    def peak_at(period):
        i = int(round(period))
        if i <= 0 or i >= len(ac):
            return 0.0
        sl = ac[max(1, i - 2): min(len(ac), i + 3)]
        return float(sl.max() / (ac.max() + 1e-12))
    regular = peak_at(beat_frames)
    offbeat = peak_at(beat_frames * 0.5)
    # also 2-beat
    two = peak_at(beat_frames * 2)
    score = 0.45 * regular + 0.25 * offbeat + 0.15 * two + 0.15
    notes.append(f"beat regular={regular:.2f} offbeat={offbeat:.2f} two={two:.2f}")
    if regular < 0.25:
        notes.append("weak beat grid — groove may wander")
        score -= 0.15
    if offbeat < 0.12 and not beatless:
        notes.append("little off-beat energy — groove may feel stiff")
        score -= 0.10
    return dict(score=float(np.clip(score, 0, 1)), notes=notes, regular=regular, offbeat=offbeat)


def melody(y, sr, bpm, sections):
    mono = y.mean(axis=1)
    hop = 1024
    chroma = librosa.feature.chroma_cqt(y=mono, sr=sr, hop_length=hop)
    # entropy over ~4-bar or 8s windows
    if bpm and bpm > 0:
        win = max(4, int((4 * 4 * 60 / bpm) * sr / hop))
    else:
        win = int(8.0 * sr / hop)
    ents = []
    for i in range(0, chroma.shape[1] - win // 2, win):
        sl = chroma[:, i:i + win].mean(axis=1)
        ents.append(entropy(sl))
    ents = np.array(ents) if ents else np.array([0.0])
    mean_e, std_e = float(ents.mean()), float(ents.std())
    # sweet spot ~1.6–3.0 bits (a key with motion, not a noise wash or a single pitch)
    if 1.6 <= mean_e <= 3.1:
        e_score = 1.0 - abs(mean_e - 2.3) / 1.5
    elif mean_e < 1.2:
        e_score = 0.35
    else:
        e_score = 0.55
    if std_e < 0.08:
        e_score *= 0.75  # entropy never moves
    # motif recurrence: chroma self-similarity at 4- and 8-bar lags
    lag_scores = []
    for bars in (4, 8, 16):
        if not bpm:
            lag_s = {4: 8, 8: 16, 16: 32}[bars]
        else:
            lag_s = bars * 4 * 60 / bpm
        lag = int(lag_s * sr / hop)
        if lag < 4 or lag >= chroma.shape[1] // 2:
            continue
        a, b = chroma[:, :-lag], chroma[:, lag:]
        # mean column cosine
        na = np.linalg.norm(a, axis=0) + 1e-12
        nb = np.linalg.norm(b, axis=0) + 1e-12
        sim = float(np.mean(np.sum(a * b, axis=0) / (na * nb)))
        lag_scores.append((bars, sim))
    motif = 0.5
    notes = [f"chroma entropy mean={mean_e:.2f} std={std_e:.2f}"]
    if lag_scores:
        # want some recurrence (0.35–0.80) with variation (not >= 0.90)
        sims = [s for _, s in lag_scores]
        best = max(sims)
        if 0.35 <= best <= 0.82:
            motif = 0.7 + 0.3 * (1 - abs(best - 0.55) / 0.45)
        elif best > 0.90:
            motif = 0.35
            notes.append(f"motif lag almost a copy (sim={best:.2f})")
        elif best < 0.28:
            motif = 0.30
            notes.append(f"weak motif recurrence (best lag sim={best:.2f})")
        else:
            motif = 0.55
        notes.append("lags " + ", ".join(f"{b}={s:.2f}" for b, s in lag_scores))
    score = 0.55 * e_score + 0.45 * motif
    return dict(score=float(np.clip(score, 0, 1)), notes=notes,
                entropy_mean=mean_e, entropy_std=std_e, lags=lag_scores, motif=motif)


def spectral(y, sr, genre):
    """Musical band checks, not a flat match to an unrealistic 5-band pie.

    Kick-led energetic tracks naturally put a lot of energy below 120 Hz;
    we judge mud as 120–400 vs the 400–2000 body, and harshness as 2–6 kHz
    presence going too far, not as a failure to hit a 22% presence share.
    """
    mono = y.mean(axis=1)
    bands = band_energy(mono, sr)
    sub, mud_b, body, pres, air = [float(x) for x in bands]
    notes = [f"bands sub/mud/body/pres/air={np.round(bands,3).tolist()} ({genre})"]
    flags = []
    score = 1.0
    energetic = genre in ("bounce", "combat", "dance")
    if energetic:
        if sub < 0.18:
            flags.append("thin low end for an energetic cue")
            score -= 0.16
        elif sub > 0.82:
            flags.append("sub swallows the midrange")
            score -= 0.12
        if body < 0.06:
            flags.append("hollow mid (400–2000 Hz is thin)")
            score -= 0.16
        if pres < 0.025:
            flags.append("dull / no 2–6 kHz presence")
            score -= 0.14
        elif pres > 0.28:
            flags.append(f"harsh 2–6 kHz ({pres:.2f})")
            score -= 0.18
    else:
        if mud_b > 0.50 and body < 0.20:
            flags.append("muddy 120–400 Hz")
            score -= 0.18
        if pres > 0.26:
            flags.append(f"harsh 2–6 kHz ({pres:.2f})")
            score -= 0.16
        if sub < 0.02 and genre != "ambient":
            flags.append("very thin low end")
            score -= 0.08
    if air > 0.22:
        flags.append(f"fizzy air above 6 kHz ({air:.2f})")
        score -= 0.10
    if mud_b > 0.42 and body > 0 and (mud_b / (body + 1e-9)) > 2.2 and energetic:
        flags.append("muddy 120–400 Hz under the kick")
        score -= 0.12
    notes.extend(flags)
    return dict(score=float(np.clip(score, 0, 1)), notes=notes, bands=bands.tolist(),
                mud=mud_b, harsh=pres, air=air, flags=flags, l1=None)


def arc(y, sr, sections, meta):
    mono = y.mean(axis=1)
    notes = []
    if sections:
        rms = []
        cents = []
        for item in sections:
            name, a, b = item[0], float(item[1]), float(item[2])
            sl = mono[int(a * sr): int(min(len(mono), b * sr))]
            if len(sl) < sr // 4:
                continue
            r = float(np.sqrt(np.mean(sl ** 2)) + 1e-12)
            c = float(librosa.feature.spectral_centroid(y=sl, sr=sr).mean())
            rms.append((name, a, b, 20 * math.log10(r), c))
        if not rms:
            return dict(score=0.4, notes=["no section rms"], lift_db=0, peak_at=0)
        first = rms[0][3]
        peak = max(rms, key=lambda r: r[3])
        lift = peak[3] - first
        dur = len(mono) / sr
        pos = ((peak[1] + peak[2]) / 2) / dur
        score = 0.4
        if lift >= 3.0:
            score += 0.35
        elif lift >= 1.5:
            score += 0.18
        else:
            notes.append(f"weak lift ({lift:.1f} dB from first section)")
        if 0.25 <= pos <= 0.88:
            score += 0.25
        elif pos < 0.2:
            notes.append("loudest moment is in the opening")
            score += 0.05
        else:
            notes.append("loudest moment is very late / another fade")
            score += 0.10
        # a mid-track brightening also counts as a lift
        first_c, peak_c = rms[0][4], max(rms, key=lambda r: r[4])
        if peak_c[4] > first_c * 1.15 and peak_c[1] > dur * 0.2:
            score += 0.08
            notes.append(f"brightness lift at {peak_c[0]}")
        notes.append(f"peak '{peak[0]}' at {pos:.0%} of form, lift {lift:.1f} dB")
        return dict(score=float(np.clip(score, 0, 1)), notes=notes,
                    lift_db=lift, peak=peak[0], peak_pos=pos, sections=rms)
    # fallback: 8s RMS curve
    hop = sr * 8
    vals = [20 * math.log10(np.sqrt(np.mean(mono[i:i+hop] ** 2)) + 1e-12)
            for i in range(0, len(mono) - hop, hop)]
    if not vals:
        return dict(score=0.4, notes=["short"], lift_db=0, peak_at=0)
    lift = max(vals) - vals[0]
    pos = int(np.argmax(vals)) / max(1, len(vals) - 1)
    return dict(score=float(np.clip(0.4 + 0.3 * (lift >= 3) + 0.2 * (0.25 <= pos <= 0.88), 0, 1)),
                notes=[f"window lift {lift:.1f} dB"], lift_db=lift, peak_pos=pos)


def critique_one(name):
    y, sr, meta = load(name)
    bpm = meta.get("bpm") or 0
    context = meta.get("context") or ""
    sections = meta.get("sections") or []
    genre = CONTEXT_GENRE.get(context, "scenic")
    beatless = name in BEATLESS or not bpm
    g = groove(y, sr, bpm, beatless)
    m = melody(y, sr, bpm, sections)
    s = spectral(y, sr, genre)
    a = arc(y, sr, sections, meta)
    # motif+arc together are the "memorable motif and a moment that lifts" test
    motif_arc = 0.5 * m["score"] + 0.5 * a["score"]
    overall = 0.18 * g["score"] + 0.26 * m["score"] + 0.22 * s["score"] + 0.22 * a["score"] + 0.12 * motif_arc
    issues = []
    if g["score"] < 0.55:
        issues.append("groove")
    if m["score"] < 0.55:
        issues.append("melody/motif")
    if s["score"] < 0.55 or s.get("flags"):
        issues.append("spectral")
    if a["score"] < 0.55 or a.get("lift_db", 0) < 2.5:
        issues.append("arc")
    return {
        "name": name, "context": context, "genre": genre, "bpm": bpm,
        "overall": overall, "groove": g, "melody": m, "spectral": s, "arc": a,
        "motif_arc": motif_arc, "issues": issues,
        "lufs": meta.get("lufs"), "range": None,
    }


def main():
    names = sys.argv[1:]
    if not names:
        names = sorted(p.stem for p in WAV.glob("*.wav"))
    OUT.mkdir(parents=True, exist_ok=True)
    reports = []
    for name in names:
        print("critique", name, flush=True)
        r = critique_one(name)
        reports.append(r)
        print(f"  overall={r['overall']:.3f}  groove={r['groove']['score']:.2f}  "
              f"melody={r['melody']['score']:.2f}  spectral={r['spectral']['score']:.2f}  "
              f"arc={r['arc']['score']:.2f}  issues={r['issues']}", flush=True)
    reports.sort(key=lambda r: r["overall"])
    (OUT / "critique.json").write_text(json.dumps(reports, indent=2, default=float))
    lines = ["# Album self-listen critique (ranked weakest first)\n"]
    for i, r in enumerate(reports, 1):
        lines.append(f"## {i}. `{r['name']}`  overall={r['overall']:.3f}  context={r['context']}")
        lines.append(f"- groove {r['groove']['score']:.2f}: " + "; ".join(r['groove']['notes']))
        lines.append(f"- melody {r['melody']['score']:.2f}: " + "; ".join(r['melody']['notes']))
        lines.append(f"- spectral {r['spectral']['score']:.2f}: " + "; ".join(r['spectral']['notes']))
        lines.append(f"- arc {r['arc']['score']:.2f}: " + "; ".join(r['arc']['notes']))
        if r["issues"]:
            lines.append(f"- issues: {', '.join(r['issues'])}")
        lines.append("")
    (OUT / "CRITIQUE.md").write_text("\n".join(lines))
    Path("/workspace/qa/album/CRITIQUE.md").write_text("\n".join(lines))
    print("ranked weakest:", ", ".join(r["name"] for r in reports[:8]))
    return reports


if __name__ == "__main__":
    main()
