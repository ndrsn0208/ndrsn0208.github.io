#!/usr/bin/env python3
"""Build the editable CV; update the website PDF only with explicit --publish.

Standard-library Python 3.9+. All paths are relative to this repository, not to
the caller's working directory. See cv/README.md for toolchain installation.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "cv"
BUILD_DIR = SOURCE_DIR / "build"
OUTPUT_PDF = BUILD_DIR / "Zekun-Wang-CV.pdf"
PUBLIC_PDF = ROOT / "public" / "cv.pdf"
PORTABLE_TECTONIC = ROOT / "artifacts" / "cv" / "tools" / "tectonic"


class BuildError(Exception):
    """A build failure with an actionable message for the command-line user."""


def executable(value: str) -> str:
    """Resolve a program name or a repository-relative executable path."""
    if "/" in value or "\\" in value:
        candidate = Path(value).expanduser()
        if not candidate.is_absolute():
            candidate = ROOT / candidate
        if candidate.is_file() and os.access(candidate, os.X_OK):
            return str(candidate.resolve())
    else:
        found = shutil.which(value)
        if found:
            return found
    raise BuildError(f"Compiler is not executable or was not found: {value}")


def select_engine(args: argparse.Namespace) -> tuple[str, str]:
    explicit = args.tectonic or os.environ.get("TECTONIC")
    if args.engine == "pdflatex":
        if args.tectonic:
            raise BuildError("--tectonic cannot be combined with --engine pdflatex.")
        return "pdflatex", executable("pdflatex")
    if explicit:
        return "tectonic", executable(explicit)
    if PORTABLE_TECTONIC.is_file():
        return "tectonic", executable(str(PORTABLE_TECTONIC))
    found = shutil.which("tectonic")
    if found:
        return "tectonic", found
    if args.engine == "auto" and shutil.which("pdflatex"):
        return "pdflatex", executable("pdflatex")
    raise BuildError(
        "No LaTeX compiler found. Install the pinned portable Tectonic from "
        "cv/README.md, put tectonic on PATH, or set TECTONIC=/path/to/tectonic."
    )


def run_compiler(command: list[str], environment: dict[str, str], log) -> None:
    """Stream compiler output, retain it on failure, and never invoke a shell."""
    with subprocess.Popen(
        command,
        cwd=SOURCE_DIR,
        env=environment,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    ) as process:
        try:
            assert process.stdout is not None
            for line in process.stdout:
                print(line, end="", flush=True)
                log.write(line)
                log.flush()
            returncode = process.wait()
        except BaseException:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            raise
    if returncode != 0:
        raise BuildError(
            f"Compiler exited with status {returncode}. "
            f"See {BUILD_DIR / 'last-build.log'}. Existing PDFs were preserved."
        )


def atomic_copy(source: Path, destination: Path) -> None:
    """Only replace a destination after a complete new copy is available."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        dir=destination.parent, prefix=f".{destination.name}.", delete=False
    ) as temporary:
        temporary_path = Path(temporary.name)
    try:
        shutil.copyfile(source, temporary_path)
        temporary_path.chmod(0o644)
        os.replace(temporary_path, destination)
    finally:
        temporary_path.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--publish",
        action="store_true",
        help="After a successful fresh build, replace public/cv.pdf. Does not commit or push.",
    )
    parser.add_argument(
        "--engine",
        choices=("auto", "tectonic", "pdflatex"),
        default="auto",
        help="Default: prefer Tectonic, then an installed pdflatex.",
    )
    parser.add_argument(
        "--tectonic",
        metavar="PATH",
        help="Explicit Tectonic executable; relative paths resolve from the repository root.",
    )
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Tectonic: require already cached TeX resources. pdfLaTeX is always local.",
    )
    args = parser.parse_args()

    try:
        if not (SOURCE_DIR / "cv.tex").is_file():
            raise BuildError(f"Missing LaTeX source: {SOURCE_DIR / 'cv.tex'}")
        engine, program = select_engine(args)
        toolchain = json.loads((SOURCE_DIR / "toolchain.json").read_text())
        BUILD_DIR.mkdir(parents=True, exist_ok=True)
        environment = os.environ.copy()
        environment.setdefault("TECTONIC_CACHE_DIR", str(BUILD_DIR / "tectonic-cache"))
        print(f"Building with {program}", flush=True)
        # A fresh work directory prevents a failed compilation from publishing
        # a stale PDF left over from an earlier successful build.
        with tempfile.TemporaryDirectory(prefix=".work-", dir=BUILD_DIR) as work:
            work_dir = Path(work)
            with (BUILD_DIR / "last-build.log").open("w", encoding="utf-8") as log:
                if engine == "tectonic":
                    command = [
                        program,
                        "--untrusted",
                        "--bundle", toolchain["bundle_url"],
                        "--keep-logs",
                        "--keep-intermediates",
                        "--outdir", str(work_dir),
                    ]
                    if args.offline:
                        command.append("--only-cached")
                    command.append("cv.tex")
                    run_compiler(command, environment, log)
                else:
                    command = [
                        program,
                        "-interaction=nonstopmode",
                        "-halt-on-error",
                        "-file-line-error",
                        "-no-shell-escape",
                        f"-output-directory={work_dir}",
                        "cv.tex",
                    ]
                    # Resolve the total-page footer and PDF bookmarks.
                    for _ in range(3):
                        run_compiler(command, environment, log)

            generated_pdf = work_dir / "cv.pdf"
            if not generated_pdf.is_file():
                raise BuildError("Compiler returned without producing cv.pdf.")
            with generated_pdf.open("rb") as result:
                if result.read(5) != b"%PDF-":
                    raise BuildError("Compiler output is not a PDF. Existing PDFs were preserved.")
            if generated_pdf.stat().st_size < 1024:
                raise BuildError("Compiler produced an unexpectedly small PDF.")
            generated_log = work_dir / "cv.log"
            if generated_log.is_file():
                atomic_copy(generated_log, BUILD_DIR / "Zekun-Wang-CV.log")
                if "Missing character:" in generated_log.read_text(
                    encoding="utf-8", errors="replace"
                ):
                    raise BuildError(
                        "The PDF has missing font glyphs. See "
                        f"{BUILD_DIR / 'Zekun-Wang-CV.log'}. "
                        "Existing PDFs were preserved."
                    )
            atomic_copy(generated_pdf, OUTPUT_PDF)
            print(f"\nBuilt: {OUTPUT_PDF}")
            if args.publish:
                # Copy the just-compiled file, even if another build is running.
                atomic_copy(generated_pdf, PUBLIC_PDF)
                print(f"Published locally: {PUBLIC_PDF}")
                print("Review the PDF and git diff, then commit/push when ready.")
            else:
                print("public/cv.pdf was not changed. Use --publish after reviewing the PDF.")
        return 0
    except (BuildError, OSError, ValueError) as error:
        print(f"CV build failed: {error}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("\nCV build interrupted.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
