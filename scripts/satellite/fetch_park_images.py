"""Phase 3b — Schritt 2: Drei Sommer-Composites pro kuratiertem Park.

Phasen: vorher (Inbetriebnahme-2), bauphase (-1), betrieb (2025).
Liest parks_curated.json, schreibt PNGs + Metadaten nach public/wind_parks/.

TIFs werden in output/ gecacht — abgebrochene Läufe setzen fort.

Lauf:  ../../.venv-sat/Scripts/python.exe fetch_park_images.py
"""

import json
import math
import os
import shutil
import sys

import numpy as np
import openeo
import rasterio
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "output")
WEB_DIR = os.path.join(HERE, "..", "..", "public", "wind_parks")

AFTER_YEAR = 2025  # letzter vollständiger Sommer
SUMMER = ("05-01", "09-30")
MAX_CLOUD = 60
SCL_MASK = [3, 8, 9, 10, 11]


def bbox_for(park):
    dlat = park["halfKm"] / 111.32
    dlon = park["halfKm"] / (111.32 * math.cos(math.radians(park["lat"])))
    return {"west": park["lon"] - dlon, "east": park["lon"] + dlon,
            "south": park["lat"] - dlat, "north": park["lat"] + dlat}


def fetch_composite(con, park, year, path):
    if os.path.exists(path):
        print(f"  vorhanden: {os.path.basename(path)}")
        return
    s2 = con.load_collection(
        "SENTINEL2_L2A",
        spatial_extent=bbox_for(park),
        temporal_extent=[f"{year}-{SUMMER[0]}", f"{year}-{SUMMER[1]}"],
        bands=["B04", "B03", "B02", "SCL"],
        max_cloud_cover=MAX_CLOUD,
    )
    scl = s2.band("SCL")
    cloud = None
    for cls in SCL_MASK:
        flag = scl == cls
        cloud = flag if cloud is None else (cloud | flag)
    rgb = s2.mask(cloud).filter_bands(["B04", "B03", "B02"])
    composite = rgb.reduce_dimension(dimension="t", reducer="median")
    print(f"  Batch-Job {park['slug']} {year} …")
    composite.execute_batch(outputfile=path, out_format="GTiff",
                            title=f"Windpark {park['slug']} RGB {year}")
    print(f"  ok: {os.path.basename(path)}")


def render_pngs(park, phases):
    """Gemeinsamer Perzentil-Stretch über alle drei Jahre eines Parks,
    damit die Bilder im Slider farblich vergleichbar sind."""
    arrays = {}
    for phase, year in phases.items():
        with rasterio.open(os.path.join(OUT, f"park3b_{park['slug']}_{year}.tif")) as src:
            arrays[phase] = src.read().astype(np.float32)
    stacked = np.concatenate([a.ravel() for a in arrays.values()])
    lo, hi = np.nanpercentile(stacked, [2, 98])
    for phase, arr in arrays.items():
        img = np.clip((arr - lo) / (hi - lo), 0, 1)
        img = (img ** 0.9 * 255).astype(np.uint8)
        out_path = os.path.join(WEB_DIR, f"{park['slug']}_{phase}.png")
        Image.fromarray(np.moveaxis(img, 0, -1)).save(out_path, optimize=True)
        print(f"  PNG: {os.path.basename(out_path)}")


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(WEB_DIR, exist_ok=True)

    with open(os.path.join(HERE, "parks_curated.json"), encoding="utf-8") as f:
        parks = json.load(f)

    con = openeo.connect("openeo.dataspace.copernicus.eu").authenticate_oidc()
    print("Authentifiziert.")

    meta = []
    for park in parks:
        phases = {"vorher": park["year"] - 2, "bauphase": park["year"] - 1, "betrieb": AFTER_YEAR}
        print(f"\n=== {park['name']} ({park['state']}) — {park['units']} Anlagen, {park['mw']} MW ===")
        for phase, year in phases.items():
            fetch_composite(con, park, year, os.path.join(OUT, f"park3b_{park['slug']}_{year}.tif"))
        render_pngs(park, phases)
        meta.append({**park, "phases": phases})

    with open(os.path.join(WEB_DIR, "parks.json"), "w", encoding="utf-8") as f:
        json.dump({"afterYear": AFTER_YEAR, "parks": meta}, f, ensure_ascii=False, indent=1)

    total = sum(os.path.getsize(os.path.join(WEB_DIR, p)) for p in os.listdir(WEB_DIR))
    print(f"\nFERTIG — {len(meta)} Parks, {total / 1e6:.1f} MB in public/wind_parks/")
    shutil.copy(os.path.join(HERE, "parks_curated.json"), os.path.join(OUT, "parks_curated.backup.json"))


if __name__ == "__main__":
    main()
