"""Summarize a paper using the LOCAL Claude Code CLI (`claude -p ...`).

We invoke the `claude` CLI as a subprocess. It uses the user's own
Claude Code subscription/auth — no API key is required, no Anthropic
SDK is imported, and once src/data/publications.json is committed and
pushed, the deployed site runs zero AI calls in production.

The CLI is asked to return STRICT JSON with three keys per the system
prompt below. We strip code fences if present and pull the first
{...} block out of the response.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from typing import TypedDict

SYSTEM_PROMPT = """\
You are summarizing an academic paper for a personal website. Your reader is
a technically literate visitor who may not be in the same subfield. Be
specific and concrete — name the technique, the setting, and the result.
Avoid hype words ("groundbreaking", "novel", "state-of-the-art" without a
number). Avoid passive voice when it hides who did what.

Output STRICT JSON with three keys:
- "tldr": a single sentence, ≤ 25 words, that names what the paper actually
  does (not what topic it's about).
- "summary": 2-3 sentences, ≤ 60 words total. First sentence = problem.
  Second sentence = approach. Third sentence (optional) = result or
  implication.
- "tags": an array of 1-3 strings, chosen ONLY from this list: {ALLOWED_TAGS}.
  If none fit well, return an empty array. Do not invent tags.

Output JSON only — no surrounding prose, no markdown fence."""


class Summary(TypedDict):
    tldr: str
    summary: str
    tags: list[str]


def _claude_cli_available() -> bool:
    return shutil.which("claude") is not None


def _build_prompt(
    title: str,
    authors: list[str],
    abstract: str,
    body_text: str | None,
    allowed_tags: list[str],
) -> str:
    sys_part = SYSTEM_PROMPT.replace("{ALLOWED_TAGS}", json.dumps(allowed_tags))
    parts = [
        sys_part,
        "",
        "---",
        "",
        f"Title: {title}",
        f"Authors: {', '.join(authors)}",
        "Abstract:",
        abstract.strip(),
    ]
    if body_text:
        clipped = body_text[:8000].strip()
        if clipped:
            parts.extend(["", "Body (truncated):", clipped])
    return "\n".join(parts)


def _try_parse(raw: str) -> Summary | None:
    raw = raw.strip()
    # Strip ```json … ``` fence if the model added one despite the system prompt.
    fence_match = re.match(r"^```(?:json)?\s*\n(.*?)\n```\s*$", raw, re.DOTALL)
    if fence_match:
        raw = fence_match.group(1).strip()
    # Find the first {…} block — robust against leading prose.
    brace_match = re.search(r"\{[\s\S]*\}", raw)
    if not brace_match:
        return None
    try:
        obj = json.loads(brace_match.group(0))
    except json.JSONDecodeError:
        return None
    if not isinstance(obj, dict):
        return None
    tldr = obj.get("tldr")
    summary = obj.get("summary")
    tags = obj.get("tags")
    if not isinstance(tldr, str) or not isinstance(summary, str) or not isinstance(tags, list):
        return None
    return {
        "tldr": tldr.strip(),
        "summary": summary.strip(),
        "tags": [t for t in tags if isinstance(t, str)],
    }


def summarize_paper(
    title: str,
    authors: list[str],
    abstract: str,
    body_text: str | None,
    allowed_tags: list[str],
) -> Summary:
    if not _claude_cli_available():
        sys.exit(
            "error: 'claude' CLI not found in PATH.\n"
            "       Install Claude Code from https://claude.com/claude-code first."
        )

    prompt = _build_prompt(title, authors, abstract, body_text, allowed_tags)

    try:
        result = subprocess.run(
            ["claude", "-p", prompt],
            capture_output=True,
            text=True,
            timeout=240,
        )
    except subprocess.TimeoutExpired as e:
        raise RuntimeError(f"claude CLI timed out summarizing {title!r}") from e

    if result.returncode != 0:
        stderr = result.stderr.strip()[:600]
        raise RuntimeError(f"claude CLI failed for {title!r} (exit {result.returncode}): {stderr}")

    parsed = _try_parse(result.stdout)
    if parsed is None:
        head = result.stdout[:300].replace("\n", " ⏎ ")
        raise RuntimeError(f"claude CLI returned non-JSON for {title!r}. First 300 chars: {head!r}")

    # Drop any tag the model invented despite the constraint.
    parsed["tags"] = [t for t in parsed["tags"] if t in allowed_tags][:3]
    return parsed
