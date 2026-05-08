"""Python port of src/lib/gradient.ts. Keep the two in sync.

Same FNV-1a 32-bit + mulberry32 + tag palette + jitter logic. The script
writes the gradient into publications.json so the client renders the
exact same conic-gradient + highlight + noise overlay.
"""
from __future__ import annotations

import math
from typing import TypedDict


class Stop(TypedDict):
    color: str
    pos: float


class PaperGradient(TypedDict):
    stops: list[Stop]
    fromAngle: int
    cx: int
    cy: int
    hx: int
    hy: int
    hIntensity: float
    noiseFreq: float
    noiseOpacity: float


TAG_PALETTE: dict[str, list[str]] = {
    "continual learning":     ["#F43F5E", "#FB7185"],
    "compositionality":       ["#C026D3", "#DB2777"],
    "language models":        ["#FFA94D", "#F97316"],
    "reinforcement learning": ["#F59E0B", "#FCA5A5"],
    "concept learning":       ["#FF6B6B", "#FFE3D8"],
    "diffusion models":       ["#A78BFA", "#FFD7B5"],
}

WARM_FILLERS = ["#FFE3D8", "#FFD7B5", "#FCA5A5", "#FBCFE8", "#FFA94D"]

_U32 = 0xFFFFFFFF


def _hash_id(s: str) -> int:
    """FNV-1a 32-bit, matching the TypeScript implementation."""
    h = 0x811C9DC5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & _U32
    return h


def _rng(seed: int):
    """mulberry32 — same as src/lib/gradient.ts."""
    state = [seed & _U32]

    def next_float() -> float:
        state[0] = (state[0] + 0x6D2B79F5) & _U32
        t = state[0]
        t = (((t ^ (t >> 15)) * (t | 1)) & _U32)
        t = (t ^ (t + (((t ^ (t >> 7)) * (t | 61)) & _U32))) & _U32
        return ((t ^ (t >> 14)) & _U32) / 4294967296.0

    return next_float


def generate_gradient(paper_id: str, tags: list[str]) -> PaperGradient:
    r = _rng(_hash_id(paper_id))

    contributors: list[str] = []
    for t in tags:
        contributors.extend(TAG_PALETTE.get(t, []))
    if not contributors:
        contributors.extend(["#FF6B6B", "#FFA94D", "#FFD7B5"])

    filler_count = 1 + math.floor(r() * 2)
    for _ in range(filler_count):
        contributors.append(WARM_FILLERS[math.floor(r() * len(WARM_FILLERS))])

    seen: set[str] = set()
    unique: list[str] = []
    for c in contributors:
        if c not in seen:
            seen.add(c)
            unique.append(c)

    shuffled = list(unique)
    for i in range(len(shuffled) - 1, 0, -1):
        j = math.floor(r() * (i + 1))
        shuffled[i], shuffled[j] = shuffled[j], shuffled[i]

    stop_count = min(len(shuffled), 4 + math.floor(r() * 3))
    chosen = shuffled[:stop_count]

    stops: list[Stop] = []
    for i, color in enumerate(chosen):
        base = (i / stop_count) * 360.0
        jitter = (r() - 0.5) * (360.0 / stop_count) * 0.5
        pos = max(0.0, min(360.0, base + jitter))
        stops.append({"color": color, "pos": pos})
    stops.sort(key=lambda s: s["pos"])

    return {
        "stops": stops,
        "fromAngle": math.floor(r() * 360),
        "cx": 20 + math.floor(r() * 60),
        "cy": 20 + math.floor(r() * 60),
        "hx": math.floor(r() * 100),
        "hy": math.floor(r() * 100),
        "hIntensity": round(0.45 + r() * 0.25, 6),
        "noiseFreq": round(0.65 + r() * 0.7, 6),
        "noiseOpacity": round(0.4 + r() * 0.25, 6),
    }
