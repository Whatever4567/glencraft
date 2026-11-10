#!/usr/bin/env python3
"""Pitch / voicing / naturalness proxy for the v1.2.6x vocal stems.

Re-runs the harvest F0 check against each hook's target contour. This is a
self-listen so we are not judging the vocal blind; it is not a MOS or a claim
that the stem is a professional singer.
"""
from __future__ import annotations

import argparse
import importlib.util
import sys
from pathlib import Path

HERE = Path(__file__).resolve()
spec = importlib.util.spec_from_file_location("build_vocals_1260", HERE.parent / "build-vocals-1260.py")
mod = importlib.util.module_from_spec(spec)
sys.modules["build_vocals_1260"] = mod
spec.loader.exec_module(mod)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=str(mod.OUT), help="Directory of vocal stems")
    ap.add_argument("--out", default=None, help="VOCAL_LISTEN.json path")
    args = ap.parse_args()
    summary = mod.listen_stems(Path(args.dir), dest=Path(args.out) if args.out else None)
    sys.exit(0 if summary.get("ok") else 1)


if __name__ == "__main__":
    main()
