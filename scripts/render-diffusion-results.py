#!/usr/bin/env python3
"""Regenerate the measured diffusion bar plots directly from evidence.ts.

Requires matplotlib, fonttools and brotli, plus the project's Node dependencies.
Run with Python. Optional --preview-dir writes cell PNGs at their 1:1 size.
No article build or browser is involved.
"""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/blog-assets/diffusion/results"
EVIDENCE = ROOT / "src/blog/diffusion/evidence.ts"
LIMITS = {
    "iclr-imagenet1k": {"performance": (100, 25), "forgetting": (60, 15)},
    "trust-imagenet500": {"performance": (200, 50), "forgetting": (150, 50)},
    "trust-cw10": {"performance": (100, 25), "forgetting": (80, 20)},
}
THEMES = {
    "paper": {
        "background": "#f5f1e8", "ink": "#292c29", "muted": "#64685f",
        "grid": "#d7d7cd", "baseline": "#808c82", "trust": "#3d716c",
    },
    "black": {
        "background": "#000000", "ink": "#e9e8e1", "muted": "#a3aaa1",
        "grid": "#343a35", "baseline": "#818d83", "trust": "#99bfb1",
    },
}
CELL_LABELS = {
    "Non-continual": "Non-CL",
    "Diagonal EWC only": "Diag. EWC",
    "Rank-1 EWC only": "Rank-1 EWC",
    "Replay (GD)": "Replay (GD)",
    "Diagonal EWC + replay": "Diag. + replay",
    "Trust Region": "Trust Region",
    "Fine-tuning": "Fine-tuning",
    "Replay": "Replay",
    "VR-MCL": "VR-MCL",
}


def read_evidence():
    program = """
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
const source = fs.readFileSync('src/blog/diffusion/evidence.ts', 'utf8')
const exports = {}
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
vm.runInNewContext(compiled, { exports })
console.log(JSON.stringify({
  benchmarks: exports.diffusionBenchmarks,
  papers: exports.diffusionPapers,
}))
"""
    return json.loads(subprocess.run(
        ["node", "--input-type=module", "-e", program],
        cwd=ROOT, check=True, capture_output=True, text=True,
    ).stdout)


def fonts(directory):
    source = ROOT / "public/fonts/typography/source-sans-3-normal-latin.woff2"
    paths = {}
    for weight in (400, 600):
        font = TTFont(source)
        instantiateVariableFont(font, {"wght": weight}, inplace=True)
        font.flavor = None
        target = directory / f"source-sans-{weight}.ttf"
        font.save(target)
        paths[weight] = target
    return lambda size, bold=False: font_manager.FontProperties(
        fname=paths[600 if bold else 400], size=size,
    )


def render(benchmark, metric_id, paper, theme_name, size, font, preview_dir):
    theme = THEMES[theme_name]
    mobile = size == "mobile"
    cell = size == "cell"
    width, height = (320, 200) if cell else (360, 540) if mobile else (700, 530)
    left, right, bottom, top = (110, 8, 45, 8) if cell else (
        (78, 8, 230, 58) if mobile else (82, 18, 200, 48))
    label_size, value_size = (16.5, 16.5) if cell else (21, 20) if mobile else (22, 22)
    metric = benchmark["metrics"][metric_id]
    maximum, step = LIMITS[benchmark["id"]][metric_id]
    source = f'{paper["htmlUrl"]}#{benchmark["source"]["anchor"]}'
    stem = f'{benchmark["id"]}-{metric_id}-{theme_name}-{size}'
    fig = plt.figure(figsize=(width / 72, height / 72), dpi=72, facecolor=theme["background"])
    ax = fig.add_axes([left / width, bottom / height, (width - left - right) / width,
                       (height - bottom - top) / height], facecolor=theme["background"])
    # Leave room for exact values beyond the complete error whiskers.
    plot_maximum = maximum * 1.4
    if cell:
        ax.set_xlim(0, plot_maximum)
        ax.set_ylim(len(benchmark["results"]) - .5, -.5)
        ax.set_xticks(range(0, maximum + 1, step))
    else:
        ax.set_ylim(0, plot_maximum)
        ax.set_xlim(-.5, len(benchmark["results"]) - .5)
        ax.set_yticks(range(0, maximum + 1, step))
    ax.set_axisbelow(True)
    (ax.xaxis if cell else ax.yaxis).grid(True, color=theme["grid"], linewidth=.8)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("bottom", "left"):
        ax.spines[side].set_color(theme["ink"])
        ax.spines[side].set_linewidth(1)
    ax.tick_params(axis="both", colors=theme["ink"], length=0, pad=3 if cell else 8)
    metric_label = "Success (%)" if metric["unit"] == "percent" else metric["unit"]
    if cell:
        for tick in ax.get_xticklabels():
            tick.set_fontproperties(font(16.5))
            tick.set_linespacing(.8)
        ax.set_xlabel(metric_label, fontproperties=font(16.5), color=theme["ink"], labelpad=2)
        ax.xaxis.label.set_linespacing(.8)
    else:
        for tick in ax.get_yticklabels():
            tick.set_fontproperties(font(20))
        ax.set_ylabel(metric_label, fontproperties=font(21), color=theme["ink"], labelpad=9)
    short_metric = "Forgetting" if metric_id == "forgetting" else (
        "Final success" if metric["unit"] == "percent" else "Final FID")
    if not cell:
        ax.set_title(f'{benchmark["label"]} · {short_metric}', loc="left",
                     fontproperties=font(22, True), color=theme["ink"], pad=18)
    labels = [result["method"] for result in benchmark["results"]]
    if cell:
        labels = [CELL_LABELS.get(label, label) for label in labels]
        ax.set_yticks(range(len(labels)), labels)
        method_labels = ax.get_yticklabels()
    else:
        ax.set_xticks(range(len(benchmark["results"])))
        ax.set_xticklabels(labels, rotation=65 if mobile else 55, ha="right", va="top",
                           rotation_mode="anchor")
        method_labels = ax.get_xticklabels()
    for tick, result in zip(method_labels, benchmark["results"]):
        tick.set_fontproperties(font(label_size, result["role"] == "proposed"))
        tick.set_color(theme["trust"] if result["role"] == "proposed" else theme["ink"])

    value_labels = []
    records = []
    for x, result in enumerate(benchmark["results"]):
        estimate = result[metric_id]
        if estimate is None:
            if cell:
                text = ax.text(maximum * .04, x, "Not reported", ha="left", va="center",
                               fontproperties=font(value_size), color=theme["muted"])
            else:
                text = ax.text(x, maximum * .08, "Not\nreported", ha="center", va="bottom",
                               fontproperties=font(value_size), color=theme["muted"])
            text.set_gid(f'missing-{result["id"]}')
            value_labels.append(text)
            records.append({"method": result["id"], "estimate": None, "bar": False})
            continue
        mean, error = estimate["mean"], estimate["standardError"]
        assert 0 <= mean - error <= mean + error <= maximum
        proposed = result["role"] == "proposed"
        reference = result["role"] == "reference"
        fill = theme["trust"] if proposed else theme["baseline"]
        if reference:
            fill = theme["background"]
        bar_style = {
            "color": fill, "edgecolor": theme["trust"] if proposed else theme["muted"],
            "linewidth": 1, "hatch": "///" if reference else None,
        }
        bar = (ax.barh(x, mean, height=.62, **bar_style) if cell else
               ax.bar(x, mean, width=.62, **bar_style))[0]
        bar.set_gid(f'bar-{result["id"]}')
        if cell:
            assert bar.get_x() == 0 and bar.get_width() == mean
            errors = ax.errorbar(mean, x, xerr=error, fmt="none", ecolor=theme["ink"],
                                elinewidth=1.4, capsize=4, capthick=1.4)
        else:
            errors = ax.errorbar(x, mean, yerr=error, fmt="none", ecolor=theme["ink"],
                                elinewidth=1.4, capsize=4, capthick=1.4)
        for part, line in enumerate((*errors.lines[1], *errors.lines[2])):
            line.set_gid(f'se-{result["id"]}-{part}')
        text = ax.annotate(
            f"{mean:.1f}" if cell else f"{mean:.1f}\n±{error:.1f}",
            (mean + error, x) if cell else (x, mean + error),
            xytext=(6, 0) if cell else (0, 9), textcoords="offset points",
            ha="left" if cell else "center", va="center" if cell else "bottom",
            fontproperties=font(value_size, proposed),
            color=theme["ink"],
            linespacing=1 if cell else 1.05,
        )
        text.set_gid(f'value-{result["id"]}')
        value_labels.append(text)
        records.append({"method": result["id"], "estimate": estimate, "bar": True})

    fig.canvas.draw()
    renderer = fig.canvas.get_renderer()
    texts = [*ax.get_xticklabels(), *ax.get_yticklabels(),
             ax.xaxis.label, ax.yaxis.label, ax.title, ax._left_title, *value_labels]
    for text in texts:
        if not text.get_text():
            continue
        bounds = text.get_window_extent(renderer)
        assert bounds.x0 >= 1 and bounds.y0 >= 1 and bounds.x1 <= width - 1 and bounds.y1 <= height - 1, (
            stem, text.get_text(), tuple(bounds.bounds), (width, height))
    for i, first in enumerate(value_labels):
        for second in value_labels[i + 1:]:
            assert not first.get_window_extent(renderer).overlaps(second.get_window_extent(renderer)), (
                stem, "overlapping values", first.get_text(), second.get_text())
    if cell:
        assert min(text.get_fontsize() for text in texts if text.get_text()) >= 16.5
        assert ax.get_xlim()[0] == 0
        row_centers = [ax.transData.transform((0, row))[1] for row in range(len(labels))]
        assert all(first > second for first, second in zip(row_centers, row_centers[1:]))
        visible_texts = [text for text in texts if text.get_text()]
        for i, first in enumerate(visible_texts):
            for second in visible_texts[i + 1:]:
                assert not first.get_window_extent(renderer).overlaps(second.get_window_extent(renderer)), (
                    stem, "overlapping horizontal labels", first.get_text(), second.get_text())
        for row, (result, value) in enumerate(zip(benchmark["results"], value_labels)):
            estimate = result[metric_id]
            if estimate is not None:
                whisker_end = ax.transData.transform((
                    estimate["mean"] + estimate["standardError"], row))[0]
                assert value.get_window_extent(renderer).x0 > whisker_end
    else:
        import math
        slot_width = (width - left - right) / len(benchmark["results"])
        assert slot_width * math.sin(math.radians(65 if mobile else 55)) > label_size * 1.2
    description = (
        f'{benchmark["label"]}. {metric["label"]}. {metric["direction"].capitalize()} is better. '
        f'Means with ±1 standard error. Source: {source}. '
        + " ".join(
            f'{row["method"]}: not reported.' if row[metric_id] is None else
            f'{row["method"]}: {row[metric_id]["mean"]:.1f} ± {row[metric_id]["standardError"]:.1f} {metric["unit"]}.'
            for row in benchmark["results"]
        )
    )
    fig.savefig(OUTPUT / f"{stem}.svg", format="svg", dpi=72, metadata={
        "Date": None, "Title": f'{benchmark["label"]}: {metric["label"]}',
        "Description": description, "Creator": "Measured evidence rendered with Matplotlib",
    })
    if preview_dir and cell:
        fig.savefig(preview_dir / f"{stem}.png", dpi=72)
    plt.close(fig)
    return {
        "file": f"{stem}.svg", "benchmark": benchmark["id"], "metric": metric_id,
        "theme": theme_name, "layout": size, "width": width, "height": height,
        **({"orientation": "horizontal", "xLimits": [0, plot_maximum],
            "yLimits": [len(benchmark["results"]) - .5, -.5]} if cell else
           {"yLimits": [0, plot_maximum]}),
        "errorBars": "±1 standard error",
        "source": source, "measurements": records,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--preview-dir", type=Path)
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if args.preview_dir:
        args.preview_dir.mkdir(parents=True, exist_ok=True)
    plt.rcParams.update({"svg.fonttype": "path", "svg.hashsalt": "diffusion-measured-results"})
    data = read_evidence()
    assets = []
    with tempfile.TemporaryDirectory(prefix="diffusion-plot-fonts-") as directory:
        font = fonts(Path(directory))
        for benchmark in data["benchmarks"]:
            for metric in ("performance", "forgetting"):
                for theme in THEMES:
                    for size in ("desktop", "mobile", "cell"):
                        assets.append(render(benchmark, metric, data["papers"][benchmark["paper"]],
                                             theme, size, font, args.preview_dir))
    (OUTPUT / "manifest.json").write_text(json.dumps({
        "evidenceSha256": hashlib.sha256(EVIDENCE.read_bytes()).hexdigest(),
        "generator": "scripts/render-diffusion-results.py",
        "matplotlib": matplotlib.__version__,
        "checks": "Zero baselines, full errors, no missing-value bars, text bounds and value collisions checked",
        "assets": assets,
    }, indent=2) + "\n")
    print(f"Generated and checked {len(assets)} SVGs from evidence.ts")


if __name__ == "__main__":
    main()
