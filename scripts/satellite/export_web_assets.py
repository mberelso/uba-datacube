"""Phase 0 → Frontend: web-optimierte Assets fürs Dashboard erzeugen.

Liest die (großen, gitignorierten) Ergebnisse aus output/ und schreibt kleine,
repo-taugliche Assets nach public/data/vegetation/<slug>/:

  <jahr>.png      verkleinert + quantisiert (~100 KB statt mehrere MB)
  meta.json       Region, Quelle, Stand, Kennzahlen je Jahr, Monats-Zeitreihe

Damit braucht es (vorerst) kein Cloudflare R2: die Assets sind klein genug, um
direkt im Repo zu liegen und von GitHub Pages ausgeliefert zu werden — 0 €.
Wenn die Datenmenge später wächst (viele Regionen/Zeitpunkte), kann derselbe
Exporter stattdessen nach R2 schreiben.

Lauf:  ../../.venv-sat/Scripts/python.exe export_web_assets.py
"""

import json
import os
import sys

from PIL import Image

import config

sys.stdout.reconfigure(encoding="utf-8")

# Lange Kante der Web-PNGs. Dashboard-Karte braucht keine 3380 px.
MAX_EDGE = 1000

# Zielordner im Frontend (relativ zum Repo-Root, zwei Ebenen über scripts/satellite).
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
WEB_DIR = os.path.join(REPO_ROOT, "public", "data", "vegetation", config.REGION_SLUG)


def optimize_png(src_path, dst_path):
    """Verkleinern und auf eine Palette quantisieren (Transparenz bleibt erhalten)."""
    img = Image.open(src_path).convert("RGBA")
    img.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
    # Alpha sichern, RGB quantisieren, Alpha als Palettentransparenz zurückspielen.
    alpha = img.getchannel("A")
    quant = img.convert("RGB").quantize(colors=128, method=Image.FASTOCTREE)
    quant.info["transparency"] = 0
    # Voll transparente Pixel auf den (reservierten) Index 0 setzen.
    mask = alpha.point(lambda a: 255 if a < 128 else 0)
    quant.paste(0, (0, 0), mask)
    quant.save(dst_path, optimize=True)
    return os.path.getsize(dst_path), img.size


def main():
    os.makedirs(WEB_DIR, exist_ok=True)

    periods = json.load(open(
        os.path.join(config.OUTPUT_DIR, f"periods_{config.REGION_SLUG}.json"),
        encoding="utf-8"))["periods"]
    timeline = json.load(open(
        os.path.join(config.OUTPUT_DIR, f"ndvi_timeseries_{config.REGION_SLUG}_clean.json"),
        encoding="utf-8"))["values"]

    out_periods, total = [], 0
    for p in periods:
        src = os.path.join(config.OUTPUT_DIR, p["png"])
        if not os.path.exists(src):
            print(f"!! {src} fehlt — überspringe {p['year']}")
            continue
        name = f"{p['year']}.png"
        size, dims = optimize_png(src, os.path.join(WEB_DIR, name))
        total += size
        out_periods.append({
            "year": p["year"], "img": name,
            "median": p["median"], "veg_pct": p["veg_pct"], "gap_pct": p["gap_pct"],
        })
        print(f"  {p['year']}.png  {dims[0]}×{dims[1]}  {size/1024:.0f} KB")

    meta = {
        "region": config.REGION_NAME,
        "slug": config.REGION_SLUG,
        "source": "Copernicus Sentinel-2 · CDSE OpenEO",
        "indicator": "NDVI (Sommer-Median, Mai–September)",
        "updated": __import__("datetime").date.today().isoformat(),
        "periods": out_periods,
        "timeline": timeline,
    }
    meta_path = os.path.join(WEB_DIR, "meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"\nmeta.json + {len(out_periods)} PNGs → {WEB_DIR}")
    print(f"Gesamtgröße Bilder: {total/1024:.0f} KB  (repo-tauglich, kein R2 nötig)")


if __name__ == "__main__":
    main()
