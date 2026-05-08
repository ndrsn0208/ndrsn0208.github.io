"""Fetch and cache arxiv HTML versions.

Polite client: 1 req/sec rate limit, single retry on 5xx, descriptive UA.
Returns (html_text, available) where `available` is False on 404 and on
papers without an HTML5 render.
"""
from __future__ import annotations

import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

UA = "ndrsn0208.github.io publications updater (+https://ndrsn0208.github.io)"
# Cache lives under public/ so Vite copies it into dist/ on build and the
# frontend can fetch /arxiv-cache/{id}.html directly. No build-time plugin
# needed.
CACHE_DIR = Path(__file__).resolve().parent.parent / "public" / "arxiv-cache"
RATE_LIMIT_S = 1.0

_last_call = 0.0


def _throttle() -> None:
    global _last_call
    now = time.monotonic()
    delta = now - _last_call
    if delta < RATE_LIMIT_S:
        time.sleep(RATE_LIMIT_S - delta)
    _last_call = time.monotonic()


def fetch_arxiv_html(arxiv_id: str, *, force: bool = False) -> tuple[str | None, bool]:
    """Return (html, available). HTML is None when unavailable."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cached = CACHE_DIR / f"{arxiv_id}.html"
    if cached.exists() and not force:
        return cached.read_text(encoding="utf-8"), True

    url = f"https://arxiv.org/html/{arxiv_id}"
    headers = {"User-Agent": UA}

    for attempt in (1, 2):
        _throttle()
        try:
            r = requests.get(url, headers=headers, timeout=30)
        except requests.RequestException as e:
            if attempt == 2:
                print(f"  → arxiv HTML fetch failed for {arxiv_id}: {e}")
                return None, False
            continue

        if r.status_code == 404:
            return None, False
        if r.status_code >= 500 and attempt == 1:
            continue
        r.raise_for_status()
        # Some arxiv URLs return a soft-fail 200 with "no HTML available"
        # — detect and treat as unavailable.
        if "no html version" in r.text.lower()[:4000]:
            return None, False
        cached.write_text(r.text, encoding="utf-8")
        return r.text, True

    return None, False


def extract_body_text(html: str, max_chars: int = 8000) -> str:
    """Plain-text extract for feeding the summarizer.

    Strips arxiv chrome (toolbar, nav), keeps article body. Best-effort —
    arxiv HTML5 documents aren't perfectly structured.
    """
    soup = BeautifulSoup(html, "html.parser")

    # Drop the obvious cruft.
    for sel in ("script", "style", "nav", "header", ".ltx_page_navbar", ".ltx_pagination"):
        for el in soup.select(sel):
            el.decompose()

    # Prefer the article tag if present, otherwise the body.
    root = soup.find("article") or soup.find(class_="ltx_document") or soup.body or soup
    text = root.get_text(separator=" ", strip=True)
    # Collapse runs of whitespace.
    text = " ".join(text.split())
    return text[:max_chars]
