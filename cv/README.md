# Editable CV

This editable LaTeX CV was reconstructed from the site's **four-page, May 2026
CV** and updated in **September 2026** with the user's revised research interests
and Amazon research internship.

Research Interests is now one sentence about continual learning of generative
models for deployment-time generalization and adaptation without forgetting.
Industry Experience follows Education and records a Research Intern position
at Amazon in Washington, USA, researching one-shot harness adaptation to novel
environments. The internship date range is awaiting confirmation and is omitted.

## Edit

| File | Content |
| --- | --- |
| `metadata.tex` | Name, contact links, and the visible “Last updated” date |
| `sections/01-research.tex` | Research interests |
| `sections/02-education.tex` | Degrees, dates, advisor, major/minor |
| `sections/industry-experience.tex` | Amazon research internship, location, and research focus |
| `sections/03-selected-publications.tex` | Five selected publications and their project descriptions |
| `sections/04-all-publications.tex` | Sixteen publications, authors, venues, dates, and URLs |
| `sections/05-research-experiences.tex` | Research positions |
| `sections/06-teaching.tex` | Teaching positions |
| `sections/07-talks.tex` | Talks and guest lectures |
| `sections/08-service-and-advising.tex` | Service and advising |
| `sections/09-skills.tex` | Skills |
| `style.tex` | Fonts, measurements, and reusable entry commands |
| `cv.tex` | Section order and the page break before Teaching Experiences |

Each publication uses this five-field command:

```tex
\CVPublication
  {Paper title}
  {Month Year}
  {https://arxiv.org/abs/...}
  {\CVNameInAuthors\CVEqual, Another Author}
  {Venue}
```

`\CVNameInAuthors` makes the CV owner's name bold; `\CVEqual` prints the
equal-contribution star. An empty URL `{}` leaves a title unlinked. Selected
publications use `\CVPaperHeading` plus `CVHighlights` bullet points.

Use `\&`, `\%`, `\_`, and `\#` in prose where necessary. Use `--` for a date
range and `---` for an em dash. Titles wrap automatically and the page count
in the footer updates during compilation. Recheck pagination after editing;
the baseline's four-page count is not forced.

The date in `metadata.tex` is intentional: it does **not** change to today's
date during a build. Website metadata and the publication-update pipeline do
not overwrite this CV.

## Build and review

Requires **Python 3.9+** and **Tectonic 0.17.0**. The helper uses only Python's
standard library. From the repository root:

```sh
python3 scripts/build_cv.py
# Equivalent npm command:
npm run cv:build
```

Output:

```text
cv/build/Zekun-Wang-CV.pdf
cv/build/Zekun-Wang-CV.log
cv/build/last-build.log
```

The helper resolves paths from its own location, so this also works:

```sh
python3 /path/to/ndrsn0208.github.io/scripts/build_cv.py
```

It compiles in a fresh temporary build directory, then replaces the review PDF
only after success. A failed compiler or missing font glyph leaves existing
PDFs intact. The build directory, compiler downloads, and visual previews are
ignored by Git.

Compiler lookup order is `--tectonic PATH`, the `TECTONIC` environment variable,
the portable executable at `artifacts/cv/tools/tectonic`, then `tectonic` on
`PATH`. An installed `pdflatex` is the final automatic fallback.

```sh
python3 scripts/build_cv.py --tectonic /path/to/tectonic
python3 scripts/build_cv.py --offline
python3 scripts/build_cv.py --engine pdflatex
```

The first Tectonic build downloads TeX packages and font files. Subsequent builds
can use `--offline`. Its default cache is `cv/build/tectonic-cache`; an explicitly
set `TECTONIC_CACHE_DIR` overrides that location. For example, CI may set it to
`$HOME/.cache/Tectonic` and cache that directory.

The pdfLaTeX alternative requires a TeX distribution containing `libertine`,
`newtx`, `microtype`, `geometry`, `xcolor`, `titlesec`, `enumitem`, `array`,
`tabularx`, `needspace`, `fancyhdr`, `lastpage`, and `hyperref`.
The helper performs three pdfLaTeX passes for references and page counts.
For Overleaf, upload the contents of `cv/` without `build/`, select `cv.tex`
as the main document, and use pdfLaTeX. Tectonic is the verified baseline engine;
other TeX distribution versions can alter spacing slightly.

## Portable Tectonic, without a global install

`toolchain.json` records the official 0.17.0 release URLs and SHA-256 checksums
for Apple Silicon, Intel macOS, and Linux x86-64. Run this once from the repository
root to download just the executable into the ignored artifacts directory:

```sh
python3 - <<'PY'
import hashlib
import io
import json
from pathlib import Path
import platform
import tarfile
import urllib.request

targets = {
    ("Darwin", "arm64"): "macos-arm64",
    ("Darwin", "x86_64"): "macos-x86_64",
    ("Linux", "x86_64"): "linux-x86_64",
}
target = targets.get((platform.system(), platform.machine()))
if target is None:
    raise SystemExit("Use an official Tectonic build for this platform and set TECTONIC.")
manifest = json.loads(Path("cv/toolchain.json").read_text())
release = manifest["downloads"][target]
with urllib.request.urlopen(release["url"], timeout=120) as response:
    archive = response.read()
if hashlib.sha256(archive).hexdigest() != release["sha256"]:
    raise SystemExit("Tectonic archive checksum mismatch.")
with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as bundle:
    members = [
        item for item in bundle.getmembers()
        if item.isfile() and Path(item.name).name == "tectonic"
    ]
    if len(members) != 1:
        raise SystemExit("Unexpected Tectonic archive contents.")
    executable = bundle.extractfile(members[0]).read()
destination = Path("artifacts/cv/tools/tectonic")
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_bytes(executable)
destination.chmod(0o755)
print(destination)
PY
python3 scripts/build_cv.py
```

The verified Apple Silicon archive is:

```text
https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.17.0/tectonic-0.17.0-aarch64-apple-darwin.tar.gz
SHA-256: a3f1cac7c5678f01661a92212f58480ae3b0634115d880dbc59e2953ded45667
```

The Linux x86-64 archive suitable for GitHub-hosted runners is:

```text
https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.17.0/tectonic-0.17.0-x86_64-unknown-linux-musl.tar.gz
SHA-256: 8533d07f9ccbd7a65824b9e0459041bca34af1eb33daba48f59215593753a3b7
```

The helper explicitly selects the versioned TeX bundle:

```text
https://relay.fullyjustified.net/default_bundle_v33.tar
Validated Tectonic bundle identity:
6ffe055852f8faf66c0acbe1a7fb27f87b869a90bad1204f3bf4d9683f597c7c
```

The bundle identity is Tectonic's resource identifier, not a checksum of the
compiler archive. Pin the executable and preserve the resource cache for
repeatable layout. PDF timestamps and internal IDs may vary between builds.

## Publish intentionally

After reviewing the compiled PDF:

```sh
python3 scripts/build_cv.py --publish
# Equivalent npm command:
npm run cv:publish
```

This performs a **fresh build**, then atomically copies that output to
`public/cv.pdf`. It does not commit, push, or deploy anything.

Review the source changes and PDF, commit `cv/`, `scripts/build_cv.py`, and
`public/cv.pdf`, then push the intended deployment branch. The website's existing
GitHub Pages workflow deploys `public/cv.pdf` when the change reaches `master`.
Do not add `cv/build/` or `artifacts/` to Git.

The repository's `build-cv.yml` workflow builds CV source changes on
push/pull request and supports manual runs. Its Actions run provides a downloadable
`Zekun-Wang-CV.pdf` artifact. That workflow does not replace the website PDF;
`cv:publish` remains an explicit local step.

## Baseline fidelity and content to revisit

The reconstruction uses the source's actual **Linux Libertine Type 1** regular,
bold, and italic fonts, with the same `txsys` circular bullet. All are supplied
by the TeX bundle and embedded in the PDF; no installed macOS/Windows fonts
are used. See [font licensing](FONT-LICENSES.md).

The source is US Letter, with an 11 pt body, 30 pt name, 12 pt section headings,
blue `#1E4E8C` links, gray section rules, italic dates, and running page footers.
The source was produced by pdfTeX 1.40.21 / TeX Live 2020. Tectonic uses XeTeX,
whose microtype support does not include pdfTeX's font expansion. Consequently
a few justified line breaks, hyphenation choices, and small text positions
differ. This is a close typeset reconstruction, not a pixel-identical image.

The May 2026 baseline was validated against the original: four pages, matching
normalized text and punctuation, identical 18 link destinations across 38
link rectangles, embedded fonts, and no text outside the pages. Review assets:

```text
artifacts/cv/original/page-1.png … page-4.png
artifacts/cv/reproduced/page-1.png … page-4.png
artifacts/cv/validation.json
```

The original PDF's SHA-256 is:

```text
3fea484cdf9334b365edf4a67d45fcef582479821f184664f703180ac0c57eb5
```

These assets document the original reconstruction, before the September 2026
content edits. The source PDF did not include Amazon; the new entry uses the
user's supplied role, state, and research focus. No employment dates have been
inferred. Other sections retain the baseline content: the PhD date reads
`2024 – 2029` without “expected,” and the publication list has 16 entries.
The original `ACL 2026 (63rd Annual Meeting …)` wording is retained verbatim
and should be confirmed during a future publication update.
