#!/usr/bin/env python3
"""Build src/data/publications.json from papers.toml.

The user maintains a hand-edited papers.toml at the repo root. Entries can
reference arxiv or supply verified metadata for a paper with a DOI or
proceedings page. Curated fields take precedence over fetched metadata.

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
  python scripts/update_publications.py --offline
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

from gradient import generate_gradient

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "src" / "data" / "config.json"
PUBS_PATH = ROOT / "src" / "data" / "publications.json"
PAPERS_PATH = ROOT / "papers.toml"


# ----------------------------- IO --------------------------------------------


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, obj: dict[str, Any]) -> None:
    temporary = path.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(path)


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


def _fetch_arxiv_meta(client: Any, arxiv_id: str, *, max_attempts: int = 5):
    """Fetch arxiv metadata with explicit exponential backoff on HTTP 429.

    The library's own retry path uses a fixed `delay_seconds`; if arxiv
    burst-limits us, that's not enough. Wait 8s → 16s → 32s → 60s → 60s.
    """
    import arxiv

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
    m = re.search(r"\b(20\d{2})\b", raw)
    year = int(m.group(1)) if m else _year_from_arxiv_id(arxiv_id)
    return raw, year


_CURATED_FIELDS = {
    "title": "title",
    "authors": "authors",
    "url": "url",
    "pdf_url": "pdfUrl",
    "summary": "summary",
    "tldr": "tldr",
    "tags": "tags",
    "equal_contribution": "equalContribution",
}
_REQUIRED_METADATA = ("title", "authors", "summary", "tldr", "tags")


def _apply_curated_fields(
    record: dict[str, Any], entry: dict[str, Any], allowed_tags: list[str]
) -> dict[str, Any]:
    for source, destination in _CURATED_FIELDS.items():
        if source in entry:
            record[destination] = entry[source]
    for field in ("title", "summary", "tldr"):
        if not isinstance(record.get(field), str) or not record[field].strip():
            raise ValueError(f"{record['id']}: {field} must be nonempty text")
    authors = record.get("authors")
    if not isinstance(authors, list) or not authors or any(
        not isinstance(author, str) or not author.strip() for author in authors
    ):
        raise ValueError(f"{record['id']}: authors must be a nonempty list of names")
    tags = record.get("tags")
    if not isinstance(tags, list) or any(tag not in allowed_tags for tag in tags):
        raise ValueError(f"{record['id']}: tags must come from config.researchInterests")
    equal = record.get("equalContribution", [])
    if not isinstance(equal, list) or any(author not in authors for author in equal):
        raise ValueError(f"{record['id']}: equal contributors must be listed authors")
    if "tags" in entry or not record.get("gradient"):
        record["gradient"] = generate_gradient(record["id"], tags)
    return record


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
            "       Add an arxiv entry or a curated entry with `id` and `url`."
        )

    existing = (_load_json(PUBS_PATH).get("publications", []) if PUBS_PATH.exists() else [])
    by_arxiv = {p["arxivId"]: p for p in existing if p.get("arxivId")}
    by_id = {p["id"]: p for p in existing}
    entry_keys = [
        _normalize_arxiv_id(str(entry["arxiv"])) if entry.get("arxiv") else entry.get("id")
        for entry in entries
    ]
    if any(not key for key in entry_keys) or len(set(entry_keys)) != len(entry_keys):
        sys.exit("error: every paper needs a unique arxiv id or curated id")
    if args.paper and args.paper not in entry_keys:
        sys.exit(f"error: {args.paper} is not present in papers.toml")

    out: list[dict[str, Any]] = []
    new_count = 0
    updated_count = 0
    unchanged_count = 0

    # 5s inter-request + 5 retries: arxiv is generous with patient clients
    # but throws HTTP 429 fast for bursts. Our own backoff below catches the rest.
    arxiv_client = None

    for entry in entries:
        arxiv_id = _normalize_arxiv_id(str(entry["arxiv"])) if entry.get("arxiv") else None
        source_id = arxiv_id or entry["id"]
        prior = by_arxiv.get(arxiv_id) if arxiv_id else by_id.get(source_id)

        if args.paper and args.paper != source_id:
            # Carry the existing record through unchanged when targeting a single paper.
            if prior:
                out.append(prior)
                unchanged_count += 1
            continue

        venue, inferred_year = _parse_venue(entry.get("venue"), arxiv_id or "")
        year = entry.get("year", inferred_year)
        if not isinstance(year, int) or not 1900 <= year <= 2100:
            sys.exit(f"error: {source_id} needs a valid publication year")
        award = entry.get("award")

        # Lightweight refresh: if the paper already exists and we're not forcing,
        # preserve its stable URL/id while applying audited metadata and copy.
        if prior and not args.force:
            updated = dict(prior)
            updated["venue"] = venue
            updated["year"] = year
            if award:
                updated["award"] = award
            elif "award" in updated:
                del updated["award"]
            updated = _apply_curated_fields(updated, entry, allowed_tags)
            out.append(updated)
            if updated == prior:
                unchanged_count += 1
            else:
                updated_count += 1
            continue

        # Complete, reviewed metadata also covers papers with no arxiv record.
        # This path is reproducible offline and does not need the arxiv/Claude tools.
        if all(field in entry for field in _REQUIRED_METADATA):
            if not arxiv_id and not entry.get("url"):
                sys.exit(f"error: {source_id} needs its canonical paper URL")
            record: dict[str, Any] = {
                "id": (prior or {}).get("id") or entry.get("id") or _slugify(entry["title"], year),
                "venue": venue,
                "year": year,
                "addedAt": (prior or {}).get("addedAt")
                    or datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
            if arxiv_id:
                record.update({
                    "arxivId": arxiv_id,
                    "arxivUrl": f"https://arxiv.org/abs/{arxiv_id}",
                    "arxivHtmlUrl": f"https://arxiv.org/html/{arxiv_id}",
                    "arxivHtmlAvailable": (ROOT / "public" / "arxiv-cache" / f"{arxiv_id}.html").exists(),
                    "pdfUrl": f"https://arxiv.org/pdf/{arxiv_id}",
                })
            if award:
                record["award"] = award
            out.append(_apply_curated_fields(record, entry, allowed_tags))
            new_count += prior is None
            updated_count += prior is not None
            print(f"  {'~ UPDATED' if prior else '+ NEW    '} {entry['title']}")
            continue

        if not arxiv_id or args.offline:
            sys.exit(
                f"error: {source_id} has no usable cache or complete curated metadata; "
                "publications.json was not changed"
            )

        import arxiv
        from fetch_arxiv_html import extract_body_text, fetch_arxiv_html
        from summarize import summarize_paper

        if arxiv_client is None:
            arxiv_client = arxiv.Client(page_size=10, delay_seconds=5.0, num_retries=5)
        print(f"\n→ {arxiv_id}  ({venue}{f' · {award}' if award else ''})")
        arxiv_meta = _fetch_arxiv_meta(arxiv_client, arxiv_id)
        if arxiv_meta is None:
            sys.exit(f"error: could not refresh {arxiv_id}; publications.json was not changed")

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

        slug = (prior or {}).get("id") or _slugify(title, year)
        gradient = generate_gradient(slug, summary["tags"])

        record = {
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
        out.append(_apply_curated_fields(record, entry, allowed_tags))

    # Newest first.
    if len({paper["id"] for paper in out}) != len(out):
        sys.exit("error: generated paper ids collide; set an explicit id in papers.toml")
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
    p.add_argument("--offline", action="store_true", help="use cached and curated metadata without network or AI calls")
    p.add_argument("--paper", metavar="PAPER_ID", help="update one paper by arxiv id or curated id")
    return p.parse_args(argv)


if __name__ == "__main__":
    update(_parse_args(sys.argv[1:]))
