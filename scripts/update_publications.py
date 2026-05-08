#!/usr/bin/env python3
"""Build src/data/publications.json from papers.toml.

The user maintains a hand-edited papers.toml at the repo root. Each entry
is one arxiv paper plus venue metadata; the script does the rest:

  1. Fetch arxiv metadata (title, authors, abstract) via the `arxiv` library.
  2. Cache the HTML version under public/arxiv-cache/{id}.html.
  3. Summarize via the LOCAL Claude Code CLI (no Anthropic SDK, no API key).
  4. Generate the per-paper foil gradient (deterministic from id + tags).
  5. Merge with the existing publications.json (preserves addedAt timestamps).

Why no Google Scholar? Scholar's index lags arxiv by weeks/months and
sometimes misses papers entirely. The user supplies the canonical list.

Usage:
  python scripts/update_publications.py
  python scripts/update_publications.py --force
  python scripts/update_publications.py --paper 2401.12345
  python scripts/update_publications.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import tomllib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import arxiv

from fetch_arxiv_html import extract_body_text, fetch_arxiv_html
from gradient import generate_gradient
from summarize import summarize_paper

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "src" / "data" / "config.json"
PUBS_PATH = ROOT / "src" / "data" / "publications.json"
PAPERS_PATH = ROOT / "papers.toml"


# ----------------------------- IO --------------------------------------------


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, obj: dict[str, Any]) -> None:
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


# ----------------------------- helpers ---------------------------------------


_STOPWORDS = {"a", "an", "the", "of", "for", "and", "in", "on", "to", "with"}


def _slugify(title: str, year: int | None) -> str:
    base = re.sub(r"[^a-z0-9\s-]", "", title.lower())
    words = [w for w in base.split() if w not in _STOPWORDS]
    short = "-".join(words)[:48].strip("-") or "paper"
    return f"{short}-{year}" if year else short


def _year_from_arxiv_id(arxiv_id: str) -> int | None:
    """arxiv ids since April 2007 are YYMM.NNNNN — first two digits encode the year."""
    m = re.match(r"^(\d{2})(\d{2})\.\d{4,5}", arxiv_id)
    if not m:
        return None
    return 2000 + int(m.group(1))


def _normalize_arxiv_id(raw: str) -> str:
    """Accept a bare id, a full URL, or an id with a `vN` suffix; return the bare id."""
    s = raw.strip()
    s = re.sub(r"^https?://(?:www\.)?arxiv\.org/(?:abs|pdf|html)/", "", s)
    s = re.sub(r"\.pdf$", "", s)
    s = re.sub(r"v\d+$", "", s)
    return s


def _fetch_arxiv_meta(client: arxiv.Client, arxiv_id: str, *, max_attempts: int = 5):
    """Fetch arxiv metadata with explicit exponential backoff on HTTP 429.

    The library's own retry path uses a fixed `delay_seconds`; if arxiv
    burst-limits us, that's not enough. Wait 8s → 16s → 32s → 60s → 60s.
    """
    last_err: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            search = arxiv.Search(id_list=[arxiv_id])
            return next(client.results(search))
        except StopIteration:
            print(f"  ! arxiv {arxiv_id} not found, skipping", file=sys.stderr)
            return None
        except Exception as e:
            last_err = e
            msg = str(e)
            is_rate = "429" in msg or "rate" in msg.lower()
            if not is_rate or attempt == max_attempts:
                break
            wait = min(60, 8 * (2 ** (attempt - 1)))
            print(f"  ... rate-limited (attempt {attempt}/{max_attempts}); waiting {wait}s")
            time.sleep(wait)
    print(f"  ! arxiv lookup failed for {arxiv_id}: {last_err}", file=sys.stderr)
    return None


def _parse_venue(raw: str | None, arxiv_id: str) -> tuple[str, int | None]:
    """`raw` is the user-supplied venue string; we extract a year if one is present."""
    if not raw:
        year = _year_from_arxiv_id(arxiv_id)
        return (f"arXiv {year}" if year else "arXiv", year)
    raw = raw.strip()
    m = re.search(r"\b(20\d{2})\b\s*$", raw)
    year = int(m.group(1)) if m else _year_from_arxiv_id(arxiv_id)
    return raw, year


# ----------------------------- main ------------------------------------------


def update(args: argparse.Namespace) -> None:
    if not PAPERS_PATH.exists():
        sys.exit(
            f"error: {PAPERS_PATH.relative_to(ROOT)} doesn't exist.\n"
            "       Create it with one [[paper]] block per arxiv id (see README)."
        )

    config = _load_json(CONFIG_PATH)
    allowed_tags: list[str] = config["researchInterests"]

    with PAPERS_PATH.open("rb") as f:
        papers_data = tomllib.load(f)
    entries: list[dict[str, Any]] = papers_data.get("paper", [])
    if not entries:
        sys.exit(
            f"error: {PAPERS_PATH.relative_to(ROOT)} has no [[paper]] entries.\n"
            "       Add at least one entry with `arxiv = \"<id>\"`."
        )

    existing = (_load_json(PUBS_PATH).get("publications", []) if PUBS_PATH.exists() else [])
    by_arxiv = {p["arxivId"]: p for p in existing if p.get("arxivId")}

    out: list[dict[str, Any]] = []
    new_count = 0
    updated_count = 0
    unchanged_count = 0

    # 5s inter-request + 5 retries: arxiv is generous with patient clients
    # but throws HTTP 429 fast for bursts. Our own backoff below catches the rest.
    arxiv_client = arxiv.Client(page_size=10, delay_seconds=5.0, num_retries=5)

    for entry in entries:
        arxiv_id_raw = entry.get("arxiv")
        if not arxiv_id_raw:
            print(f"  ! skipping entry without `arxiv` key: {entry}", file=sys.stderr)
            continue
        arxiv_id = _normalize_arxiv_id(str(arxiv_id_raw))

        if args.paper and args.paper != arxiv_id:
            # Carry the existing record through unchanged when targeting a single paper.
            prior = by_arxiv.get(arxiv_id)
            if prior:
                out.append(prior)
                unchanged_count += 1
            continue

        venue, year = _parse_venue(entry.get("venue"), arxiv_id)
        award = entry.get("award")

        prior = by_arxiv.get(arxiv_id)

        # Lightweight refresh: if the paper already exists and we're not forcing,
        # keep the cached summary/gradient but still pick up venue/award edits.
        if prior and not args.force:
            updated = dict(prior)
            updated["venue"] = venue
            updated["year"] = year or updated.get("year") or 0
            if award:
                updated["award"] = award
            elif "award" in updated:
                del updated["award"]
            out.append(updated)
            unchanged_count += 1
            continue

        print(f"\n→ {arxiv_id}  ({venue}{f' · {award}' if award else ''})")
        arxiv_meta = _fetch_arxiv_meta(arxiv_client, arxiv_id)
        if arxiv_meta is None:
            continue

        title = arxiv_meta.title.strip().replace("\n", " ")
        authors = [a.name for a in arxiv_meta.authors]
        abstract = arxiv_meta.summary.strip()

        # Fetch + cache the HTML rendering, if available.
        html, html_available = fetch_arxiv_html(arxiv_id, force=args.force)
        body_text = extract_body_text(html) if html else None

        try:
            summary = summarize_paper(
                title=title,
                authors=authors,
                abstract=abstract,
                body_text=body_text,
                allowed_tags=allowed_tags,
            )
        except Exception as e:
            print(f"  ! summarize failed: {e}", file=sys.stderr)
            summary = {"tldr": title, "summary": abstract[:280] or title, "tags": []}

        slug = _slugify(title, year)
        gradient = generate_gradient(slug, summary["tags"])

        record: dict[str, Any] = {
            "id": slug,
            "title": title,
            "authors": authors,
            "venue": venue,
            "year": year or 0,
            "arxivId": arxiv_id,
            "arxivUrl": f"https://arxiv.org/abs/{arxiv_id}",
            "arxivHtmlUrl": f"https://arxiv.org/html/{arxiv_id}",
            "arxivHtmlAvailable": html_available,
            "pdfUrl": f"https://arxiv.org/pdf/{arxiv_id}",
            "summary": summary["summary"],
            "tldr": summary["tldr"],
            "tags": summary["tags"],
            "gradient": gradient,
            "addedAt": (prior or {}).get("addedAt")
                       or datetime.now(timezone.utc).isoformat(timespec="seconds"),
        }
        if award:
            record["award"] = award

        if prior is None:
            new_count += 1
            tag = "+ NEW    "
        else:
            updated_count += 1
            tag = "~ UPDATED"
        print(f"  {tag} {title[:80]}")
        out.append(record)

    # Newest first.
    out.sort(key=lambda p: (p.get("year") or 0, p.get("addedAt", "")), reverse=True)
    payload = {
        "lastUpdated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "publications": out,
    }

    if args.dry_run:
        print("\n--dry-run: not writing publications.json")
    else:
        _write_json(PUBS_PATH, payload)
        print(f"\nwrote {PUBS_PATH.relative_to(ROOT)} ({len(out)} papers)")

    print(f"\nsummary: +{new_count} new · ~{updated_count} updated · ={unchanged_count} unchanged")


# ----------------------------- CLI -------------------------------------------


def _parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n", 1)[0])
    p.add_argument("--force", action="store_true", help="re-fetch and re-summarize every paper")
    p.add_argument("--dry-run", action="store_true", help="don't write publications.json")
    p.add_argument("--paper", metavar="ARXIV_ID", help="update just one paper by arxiv id")
    return p.parse_args(argv)


if __name__ == "__main__":
    update(_parse_args(sys.argv[1:]))
