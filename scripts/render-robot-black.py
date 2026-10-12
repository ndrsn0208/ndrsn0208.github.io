#!/usr/bin/env python3
"""Create the black CW10 delivery assets without changing research pixels.

Requires existing Pillow, NumPy, and FFmpeg with libx264; installs nothing.
Run from any directory:
    python3 scripts/render-robot-black.py [--ffmpeg /path/to/ffmpeg]

All boxes use zero-based, half-open [left, top, right, bottom] coordinates.
Only cw10-hammer-black* outputs and artifacts/site-redesign/black-media/*
are written. The source GIF is decoded directly, avoiding a lossy MP4 input.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, __version__ as PILLOW_VERSION


ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "public/blog-assets/diffusion"
REPORTS = ROOT / "artifacts/site-redesign/black-media"
SOURCE = MEDIA / "cw10-hammer.gif"
SOURCE_POSTER = MEDIA / "cw10-hammer-poster.png"
VIDEO = MEDIA / "cw10-hammer-black.mp4"
POSTER = MEDIA / "cw10-hammer-black-poster.png"
MANIFEST = MEDIA / "cw10-hammer-black-manifest.json"
SIZE = (1200, 756)
FRAME_COUNT = 151
FRAME_MS = 50
POSTER_FRAME = 150
EXPECTED_SOURCE_SHA256 = (
    "52e08edc51095b5c9097149cfbdd49d138399d68dae760b821da07b244fc680e"
)
OFFWHITE = np.array([245, 241, 232], dtype=np.int32)

# Measured on the author-supplied poster, then checked over every GIF frame.
# Each 234 x 234 rollout box includes its entire success/failure frame and badge.
ROLLOUTS = [
    ("after-task-1-trust-region", (213, 134, 447, 368)),
    ("after-task-1-replay", (458, 134, 692, 368)),
    ("after-task-1-ewc", (702, 134, 936, 368)),
    ("after-task-1-fine-tuning", (947, 134, 1181, 368)),
    ("after-task-10-trust-region", (213, 503, 447, 737)),
    ("after-task-10-replay", (458, 503, 692, 737)),
    ("after-task-10-ewc", (702, 503, 936, 737)),
    ("after-task-10-fine-tuning", (947, 503, 1181, 737)),
]
THUMBNAILS = [
    ("task-2", (240, 393, 325, 478)),
    ("task-3", (344, 393, 429, 478)),
    ("task-4", (447, 393, 533, 478)),
    ("task-5", (551, 393, 636, 478)),
    ("task-6", (655, 393, 740, 478)),
    ("task-7", (758, 393, 843, 478)),
    ("task-8", (862, 393, 947, 478)),
    ("task-9", (965, 393, 1050, 478)),
    ("task-10", (1069, 393, 1154, 478)),
]
REGIONS = ROLLOUTS + THUMBNAILS
PILL_WINDOW = (230, 80, 430, 130)
SAMPLE_FRAMES = (0, 50, 100, 150)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT))


def crop(array: np.ndarray, box: tuple[int, int, int, int]) -> np.ndarray:
    x0, y0, x1, y1 = box
    return array[y0:y1, x0:x1]


def bounding_box(mask: np.ndarray, window: tuple[int, int, int, int]) -> tuple:
    ys, xs = np.nonzero(mask)
    require(bool(xs.size), f"Empty source region: {window}")
    x0, y0, _, _ = window
    return (x0 + int(xs.min()), y0 + int(ys.min()),
            x0 + int(xs.max()) + 1, y0 + int(ys.max()) + 1)


def resolve_ffmpeg(argument: str | None) -> Path:
    bundled = (
        ROOT / "artifacts/diffusion-blog/media-tools/imageio_ffmpeg/binaries"
    )
    candidates = [
        argument,
        os.environ.get("CW10_BLACK_FFMPEG"),
        shutil.which("ffmpeg"),
        *sorted(bundled.glob("ffmpeg-*")),
    ]
    for candidate in candidates:
        if candidate and Path(candidate).is_file() and os.access(candidate, os.X_OK):
            return Path(candidate).resolve()
    raise RuntimeError("Use --ffmpeg with an existing FFmpeg binary with libx264.")


def inspect_source() -> tuple[np.ndarray, list, list]:
    """Recheck measured envelopes and derive the pill's exact row silhouette."""
    # Rollouts are on near-white canvas; thumbnails sit on pale gray canvas.
    windows = [
        (x0 - 3, y0 - 3, x1 + 3, y1 + 3) for _, (x0, y0, x1, y1) in REGIONS
    ]
    envelopes = [
        np.zeros((y1 - y0, x1 - x0), dtype=bool) for x0, y0, x1, y1 in windows
    ]
    pill_support = np.zeros((50, 200), dtype=bool)
    source_poster = np.asarray(Image.open(SOURCE_POSTER).convert("RGB"))
    require(source_poster.shape == (756, 1200, 3), "Unexpected source poster size.")
    durations = []
    poster_matches = []
    with Image.open(SOURCE) as gif:
        require(gif.size == SIZE and gif.n_frames == FRAME_COUNT,
                "Unexpected source dimensions or frame count.")
        for index in range(gif.n_frames):
            gif.seek(index)
            durations.append(gif.info.get("duration"))
            frame = np.asarray(gif.convert("RGB"))
            for region_index, (window, envelope) in enumerate(zip(windows, envelopes)):
                threshold = 248 if region_index < len(ROLLOUTS) else 230
                envelope |= crop(frame, window).min(axis=2) < threshold
            pill_support |= crop(frame, PILL_WINDOW).min(axis=2) < 248
            if np.array_equal(frame, source_poster):
                poster_matches.append(index)
    require(durations == [FRAME_MS] * FRAME_COUNT, "Source frame timing changed.")
    require(POSTER_FRAME in poster_matches, "Poster no longer matches source frame 150.")
    for (name, expected), envelope, window in zip(REGIONS, envelopes, windows):
        measured = bounding_box(envelope, window)
        require(measured == expected,
                f"{name}: measured {measured}, expected {expected}; inspect new source.")

    mask = np.zeros((756, 1200), dtype=bool)
    for _, box in REGIONS:
        crop(mask, box)[:] = True
    pill_rows = []
    for local_y in np.flatnonzero(pill_support.any(axis=1)):
        xs = np.flatnonzero(pill_support[local_y])
        y = int(local_y) + PILL_WINDOW[1]
        x0, x1 = int(xs[0]) + PILL_WINDOW[0], int(xs[-1]) + PILL_WINDOW[0] + 1
        mask[y, x0:x1] = True  # Includes the white lettering inside the blue pill.
        pill_rows.append([y, x0, x1])
    return mask, pill_rows, poster_matches


def transform(frame: np.ndarray, protected: np.ndarray) -> np.ndarray:
    """Remap only unprotected, nearly neutral canvas/lettering pixels."""
    values = frame.astype(np.int32)
    neutral = (values.max(axis=2) - values.min(axis=2)) <= 32
    # Integer luminance, with flat endpoints to remove GIF canvas dithering.
    luminance = (
        values[:, :, 0] * 54 + values[:, :, 1] * 183 + values[:, :, 2] * 19 + 128
    ) // 256
    coverage = np.clip(235 - luminance, 0, 207)  # 28 -> offwhite; 235 -> black.
    remapped = ((coverage[:, :, None] * OFFWHITE + 103) // 207).astype(np.uint8)
    result = frame.copy()
    eligible = ~protected & neutral
    result[eligible] = remapped[eligible]
    return result


def new_stat(name: str, box: tuple | None, pixels: int) -> dict:
    return {
        "name": name, "box": box, "pixelsPerFrame": pixels,
        "changedPixels": 0, "sourceHasher": hashlib.sha256(),
        "outputHasher": hashlib.sha256(),
    }


def write_roi_map(protected: np.ndarray, pill_rows: list) -> None:
    image = Image.open(SOURCE_POSTER).convert("RGB")
    draw = ImageDraw.Draw(image)
    for index, (_, (x0, y0, x1, y1)) in enumerate(REGIONS):
        draw.rectangle((x0, y0, x1 - 1, y1 - 1), outline="#ff00c8", width=2)
        label = f"R{index + 1}" if index < 8 else f"T{index - 6}"
        draw.rectangle((x0 + 3, y0 + 3, x0 + 34, y0 + 17), fill="black")
        draw.text((x0 + 5, y0 + 4), label, fill="white")
    for y, x0, x1 in pill_rows:
        draw.point((x0, y), fill="#00ffff")
        draw.point((x1 - 1, y), fill="#00ffff")
    image.save(REPORTS / "protected-regions.png", optimize=True)
    Image.fromarray((protected * 255).astype(np.uint8)).save(
        REPORTS / "protected-mask.png", optimize=True
    )


def render(ffmpeg: Path, protected: np.ndarray, pill_rows: list) -> tuple[list, int]:
    pill_mask = np.zeros_like(protected)
    for y, x0, x1 in pill_rows:
        pill_mask[y, x0:x1] = True
    stats = [
        new_stat(name, box, (box[2] - box[0]) * (box[3] - box[1]))
        for name, box in REGIONS
    ]
    stats.append(new_stat("trust-region-blue-pill", None, int(pill_mask.sum())))
    temporary = VIDEO.with_name("cw10-hammer-black-rendering.mp4")
    command = [
        str(ffmpeg), "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
        "-f", "rawvideo", "-pixel_format", "rgb24", "-video_size", "1200x756",
        "-framerate", "20", "-i", "pipe:0", "-an", "-frames:v", str(FRAME_COUNT),
        "-vf", "scale=in_range=pc:out_range=tv:out_color_matrix=bt709",
        "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
        "-color_range", "tv", "-video_track_timescale", "20000",
        "-movflags", "+faststart", str(temporary),
    ]
    (REPORTS / "encode-command.json").write_text(json.dumps(command, indent=2) + "\n")
    changed_total = 0
    with (REPORTS / "encode.log").open("w") as log, Image.open(SOURCE) as gif:
        process = subprocess.Popen(command, stdin=subprocess.PIPE,
                                   stdout=subprocess.DEVNULL, stderr=log)
        try:
            for index in range(FRAME_COUNT):
                gif.seek(index)
                source = np.asarray(gif.convert("RGB"))
                output = transform(source, protected)
                changed = np.any(source != output, axis=2)
                require(not changed[protected].any(),
                        f"Protected pixel changed before encoding at frame {index}.")
                saturated = np.ptp(source.astype(np.int16), axis=2) > 32
                require(not changed[saturated].any(),
                        f"Meaningful color changed at frame {index}.")
                require(not output[0:10, 0:10].any() and not output[-10:, -10:].any(),
                        f"Canvas is not true black at frame {index}.")
                for stat in stats:
                    before = crop(source, stat["box"]) if stat["box"] else source[pill_mask]
                    after = crop(output, stat["box"]) if stat["box"] else output[pill_mask]
                    stat["changedPixels"] += int(np.any(before != after, axis=-1).sum())
                    stat["sourceHasher"].update(before.tobytes())
                    stat["outputHasher"].update(after.tobytes())
                changed_total += int(changed.sum())
                if index == POSTER_FRAME:
                    Image.fromarray(output).save(POSTER, optimize=True)
                    Image.fromarray((changed * 255).astype(np.uint8)).save(
                        REPORTS / "poster-changed-pixels.png", optimize=True
                    )
                process.stdin.write(output.tobytes())
            process.stdin.close()
            require(process.wait() == 0, "FFmpeg failed; see encode.log.")
        finally:
            if process.poll() is None:
                process.kill()
                process.wait()
    temporary.replace(VIDEO)
    for stat in stats:
        stat["sourceRgbSha256"] = stat.pop("sourceHasher").hexdigest()
        stat["outputRgbSha256"] = stat.pop("outputHasher").hexdigest()
        require(stat["sourceRgbSha256"] == stat["outputRgbSha256"],
                f"RGB hash mismatch in {stat['name']}.")
        stat["framesChecked"] = FRAME_COUNT
    return stats, changed_total


def read_frame(stream, size: int) -> bytes:
    data = bytearray()
    while len(data) < size:
        chunk = stream.read(size - len(data))
        if not chunk:
            break
        data.extend(chunk)
    require(len(data) in (0, size), "Truncated decoded video frame.")
    return bytes(data)


def verify_video(ffmpeg: Path) -> dict:
    log_path = REPORTS / "decode.log"
    command = [
        str(ffmpeg), "-hide_banner", "-nostdin", "-i", str(VIDEO),
        "-map", "0:v:0", "-vf", "showinfo", "-fps_mode", "passthrough",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
    ]
    decoded_count = 0
    sample_images = []
    corners_black = True
    with log_path.open("w") as log:
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=log)
        try:
            while data := read_frame(process.stdout, 1200 * 756 * 3):
                frame = np.frombuffer(data, dtype=np.uint8).reshape((756, 1200, 3))
                corners_black &= bool(
                    not frame[:10, :10].any() and not frame[-10:, -10:].any()
                )
                if decoded_count in SAMPLE_FRAMES:
                    sample_images.append((decoded_count, Image.fromarray(frame.copy())))
                decoded_count += 1
            require(process.wait() == 0, "MP4 decode failed; see decode.log.")
        finally:
            if process.poll() is None:
                process.kill()
                process.wait()
    log = log_path.read_text()
    frame_lines = [
        line for line in log.splitlines()
        if "Parsed_showinfo" in line and re.search(r"\bn:\s*\d+", line)
    ]
    timings = []
    dimensions = set()
    for line in frame_lines:
        timings.append({
            "frame": int(re.search(r"\bn:\s*(\d+)", line).group(1)),
            "ptsSeconds": float(re.search(r"\bpts_time:([\d.]+)", line).group(1)),
            "durationSeconds": float(
                re.search(r"\bduration_time:([\d.]+)", line).group(1)
            ),
        })
        dimensions.add(tuple(map(int, re.search(r"\bs:(\d+)x(\d+)", line).groups())))
    require(decoded_count == FRAME_COUNT == len(timings), "MP4 frame count mismatch.")
    require(dimensions == {SIZE}, "MP4 dimensions mismatch.")
    for index, timing in enumerate(timings):
        require(timing["frame"] == index
                and abs(timing["ptsSeconds"] - index / 20) < 1e-8
                and abs(timing["durationSeconds"] - 0.05) < 1e-8,
                f"MP4 timing mismatch: {timing}")
    require(corners_black, "Decoded MP4 black canvas changed at sampled corners.")
    duration = timings[-1]["ptsSeconds"] + timings[-1]["durationSeconds"]
    require(abs(duration - 7.55) < 1e-8, "MP4 duration mismatch.")
    require("yuv420p" in log and "h264" in log, "Unexpected MP4 delivery format.")
    mp4_bytes = VIDEO.read_bytes()
    require(0 <= mp4_bytes.find(b"moov") < mp4_bytes.find(b"mdat"),
            "MP4 does not have a front-loaded moov atom.")
    sheet = Image.new("RGB", (1200, 800), "black")
    draw = ImageDraw.Draw(sheet)
    for slot, (index, image) in enumerate(sample_images):
        x, y = (slot % 2) * 600, (slot // 2) * 400
        draw.text((x + 10, y + 4), f"Decoded MP4: frame {index}, {index / 20:.2f}s",
                  fill=tuple(map(int, OFFWHITE)))
        sheet.paste(image.resize((600, 378), Image.Resampling.LANCZOS), (x, y + 22))
    sheet.save(REPORTS / "decoded-contact-sheet.png", optimize=True)
    return {
        "codec": "h264", "pixelFormat": "yuv420p", "dimensions": list(SIZE),
        "frames": decoded_count, "fps": 20, "durationSeconds": duration,
        "everyFrameDurationSeconds": 0.05, "firstFramePtsSeconds": 0.0,
        "lastFramePtsSeconds": 7.5, "everyFrameTimingChecked": True,
        "decodedCanvasCornersExactBlackEveryFrame": corners_black,
        "fastStart": True, "sampledFrames": list(SAMPLE_FRAMES),
        "frameTimings": timings,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg", help="Existing FFmpeg binary; nothing is installed.")
    args = parser.parse_args()
    ffmpeg = resolve_ffmpeg(args.ffmpeg)
    originals = sorted(
        path for path in MEDIA.glob("cw10-hammer*")
        if path.is_file() and not path.name.startswith("cw10-hammer-black")
    )
    original_hashes = {relative(path): sha256(path) for path in originals}
    require(sha256(SOURCE) == EXPECTED_SOURCE_SHA256,
            "Source GIF changed; re-inspect the poster and all ROI coordinates.")
    protected, pill_rows, poster_matches = inspect_source()
    REPORTS.mkdir(parents=True, exist_ok=True)
    write_roi_map(protected, pill_rows)
    print("Source dimensions, timing, final poster, and all 17 ROI envelopes verified.",
          flush=True)
    stats, changed_total = render(ffmpeg, protected, pill_rows)
    print("Protected RGB pixels verified across 151 frames; checking the encoded MP4.",
          flush=True)
    video_info = verify_video(ffmpeg)
    source_poster = np.asarray(Image.open(SOURCE_POSTER).convert("RGB"))
    output_poster = np.asarray(Image.open(POSTER).convert("RGB"))
    require(np.array_equal(output_poster, transform(source_poster, protected)),
            "Lossless output poster differs from transformed original poster.")
    require(np.array_equal(source_poster[protected], output_poster[protected]),
            "Lossless poster changed protected pixels.")
    for path in originals:
        require(sha256(path) == original_hashes[relative(path)],
                f"An original asset changed during rendering: {path}")
    assets = {
        relative(path): {"bytes": path.stat().st_size, "sha256": sha256(path)}
        for path in (VIDEO, POSTER)
    }
    treatment = (
        "Decode the original GIF directly. Preserve all RGB pixels in the eight "
        "rollout boxes, nine complete thumbnail boxes (including rounded corners), "
        "and the blue Trust Region pill silhouette. Outside those masks, preserve "
        "any chromatic pixel with RGB channel spread >32. Map neutral pixels using "
        "integer luminance Y=(54R+183G+19B+128)//256 and coverage=clip(235-Y,0,207): "
        "RGB=(coverage*[245,241,232]+103)//207. Thus dark lettering becomes #f5f1e8, "
        "gray lettering/arrows retain intermediate contrast, and white/pale-gray "
        "canvas becomes #000000. No crop, rescale, synthesis, or footage repainting. "
        "H.264 delivery encoding is lossy; pre-encoding RGB and the PNG poster "
        "preserve every protected pixel exactly."
    )
    manifest = {
        "source": relative(SOURCE), "sourceSha256": sha256(SOURCE),
        "width": 1200, "height": 756, "frames": FRAME_COUNT,
        "durationSeconds": 7.55, "fps": 20, "posterFrame": POSTER_FRAME,
        "background": "#000000", "foreground": "#f5f1e8",
        "treatment": treatment,
        "coordinateConvention": "zero-based half-open [left, top, right, bottom]",
        "protectedRegions": [
            {"name": name, "box": box} for name, box in REGIONS
        ],
        "trustRegionPillRows": pill_rows,
        "protectedPixelsIdenticalBeforeEncoding": True,
        "posterProtectedPixelsIdentical": True,
        "assets": assets,
        "script": relative(Path(__file__).resolve()),
        "verification": relative(REPORTS / "verification.json"),
        "gif": "Not generated; MP4 plus PNG satisfy this delivery task.",
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    command = [sys.executable, "-B", str(Path(__file__).resolve()), "--ffmpeg", str(ffmpeg)]
    report = {
        "status": "PASS", "treatment": treatment,
        "reproduceCommand": shlex.join(command),
        "runtime": {
            "python": sys.version.split()[0], "pillow": PILLOW_VERSION,
            "numpy": np.__version__,
            "ffmpeg": subprocess.check_output(
                [str(ffmpeg), "-version"], text=True
            ).splitlines()[0],
        },
        "source": {
            "frames": FRAME_COUNT, "dimensions": list(SIZE),
            "frameDurationsMs": [FRAME_MS] * FRAME_COUNT,
            "durationSeconds": 7.55, "posterFrame": POSTER_FRAME,
            "posterExactlyMatchesSourceFrames": poster_matches,
            "originalAssetSha256": original_hashes, "originalAssetsUnchanged": True,
            "roiEnvelopesMeasuredAcrossEverySourceFrame": True,
        },
        "rawVerification": {
            "allProtectedPixelsIdentical": True,
            "protectedPixelsPerFrame": int(protected.sum()),
            "protectedPixelComparisons": int(protected.sum()) * FRAME_COUNT,
            "changedProtectedPixels": 0, "changedMeaningfulColorPixels": 0,
            "changedExternalNeutralPixelsAcrossAllFrames": changed_total,
            "regions": stats, "pillRows": pill_rows,
        },
        "poster": {
            "path": relative(POSTER), "dimensions": list(SIZE),
            "sourceSemanticFrame": POSTER_FRAME,
            "exactlyMatchesTransformedOriginalPoster": True,
            "changedProtectedPixels": 0,
        },
        "video": video_info, "assets": assets,
    }
    (REPORTS / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
    lines = [
        "# CW10 black-background media verification", "",
        "PASS — 151 frames, 20 fps, 7.55 seconds, 1200 × 756.", "",
        treatment, "",
        f"Compared {int(protected.sum()) * FRAME_COUNT:,} protected RGB pixels "
        "across all 151 raw frames: **zero differences**. "
        "Per-region source/output SHA-256 values are in `verification.json`.", "",
        "The PNG matches the transformation of the existing poster exactly. "
        "Its semantic frame is 150 (the source holds that same final pose from "
        "frames 100–150). All original media hashes remained unchanged.", "",
        "Every decoded MP4 frame was counted and checked for 1200 × 756 dimensions, "
        "50 ms duration, and sequential timestamps from 0.00 to 7.50 seconds. "
        "Total duration is 7.55 seconds. H.264 uses CRF 17, yuv420p, BT.709, and "
        "fast start. Decoded exterior corner samples are exact black in every frame.", "",
        "## Outputs", "",
        f"- `{relative(VIDEO)}`",
        f"- `{relative(POSTER)}`",
        f"- `{relative(MANIFEST)}`", "",
        "## Reproduce with the existing runtime", "", "```sh",
        shlex.join(command), "```", "",
        "With Pillow and NumPy already available, another machine can use "
        "`python3 scripts/render-robot-black.py --ffmpeg /path/to/ffmpeg`. "
        "The script rejects a changed source hash or different ROI envelopes. "
        "It writes only the black asset prefix and this report directory.", "",
        "## Protected coordinates", "",
        "Zero-based half-open coordinates: `[left, top, right, bottom]`. "
        "Full thumbnail rectangles, including their original pale rounded corner "
        "pixels, are deliberately retained. The small original antialiased edge "
        "pixels on colored borders and the blue pill are retained too.", "",
        "| Region | Coordinates |", "| --- | --- |",
    ]
    lines += [f"| {name} | `{list(box)}` |" for name, box in REGIONS]
    lines += [
        "",
        "The blue pill uses row spans recorded as `[y, left, right-exclusive]` "
        "in the manifest and verification report, preserving its lettering while "
        "allowing the external corners to become black.", "",
        "## Visual checks", "",
        "- `protected-regions.png`: source poster with the 17 measured boxes annotated.",
        "- `protected-mask.png`: white pixels are immutable; black pixels are eligible.",
        "- `poster-changed-pixels.png`: white pixels changed; protected regions are black.",
        "- `decoded-contact-sheet.png`: decoded MP4 frames 0, 50, 100, and 150.",
        "- `encode-command.json`, `encode.log`, `decode.log`: delivery encoding evidence.",
        "", "No optional GIF was generated.", "",
    ]
    (REPORTS / "README.md").write_text("\n".join(lines))
    print(json.dumps({
        "status": "PASS", "frames": video_info["frames"],
        "durationSeconds": video_info["durationSeconds"],
        "changedProtectedPixels": 0, "assets": assets,
        "report": relative(REPORTS / "verification.json"),
    }, indent=2), flush=True)


if __name__ == "__main__":
    main()
