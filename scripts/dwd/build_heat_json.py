"""Hitze-Phase 1: DWD-Jahresraster (Heiße Tage, Sommertage) → Kreis-JSON.

Lädt alle Jahre beider Indizes (gecacht in cache/), reprojiziert die
Kreis-Polygone nach EPSG:31467, baut EINMAL ein AGS-Index-Grid (mehrteilige
Kreise/Exklaven korrekt zusammengefasst) und aggregiert je Jahr den
Zell-Mittelwert pro Kreis.

  public/heat_kreise.json   je Kreis hotDays[]/summerDays[] pro Jahr (Choropleth)
  public/heat_summary.json  nationale Jahres-Mittelwerte (Dashboard/Analysen)

Lauf:  .venv-sat/Scripts/python.exe scripts/dwd/build_heat_json.py
"""

import gzip
import json
import sys
import urllib.request
from datetime import date
from pathlib import Path

import numpy as np
import rasterio.features
from affine import Affine
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform as shp_transform

sys.stdout.reconfigure(encoding="utf-8")

HERE = Path(__file__).resolve().parent
CACHE = HERE / "cache"
PUB = HERE.parents[1] / "public"
KREISE = PUB / "kreise.geo.json"

START, END = 1951, 2025
BASE = "https://opendata.dwd.de/climate_environment/CDC/grids_germany/annual"
SOURCE = "Deutscher Wetterdienst (DWD), Climate Data Center — gegitterte Jahreswerte (1 km), DL-DE/BY-2.0"

# DWD-Index → (Verzeichnis, JSON-Schlüssel)
METRICS = {
    "hotDays": "hot_days",       # Tmax >= 30 °C
    "summerDays": "summer_days",  # Tmax >= 25 °C
}


def grid_url(dwd_dir, year):
    return f"{BASE}/{dwd_dir}/grids_germany_annual_{dwd_dir}_{year}_17.asc.gz"


def cache_path(dwd_dir, year):
    return CACHE / f"{dwd_dir}_{year}.asc.gz"


def download(dwd_dir, year):
    p = cache_path(dwd_dir, year)
    if p.exists() and p.stat().st_size > 0:
        return p
    urllib.request.urlretrieve(grid_url(dwd_dir, year), p)
    return p


def read_dwd_ascii(path):
    with gzip.open(path, "rt") as f:
        hdr = {}
        for _ in range(6):
            k, v = f.readline().split()
            hdr[k.upper()] = float(v)
        ncols, nrows = int(hdr["NCOLS"]), int(hdr["NROWS"])
        data = np.loadtxt(f, dtype=np.float32)
    data = data.reshape(nrows, ncols)
    data[data == hdr["NODATA_VALUE"]] = np.nan
    cell = hdr["CELLSIZE"]
    transform = Affine(cell, 0, hdr["XLLCORNER"], 0, -cell, hdr["YLLCORNER"] + nrows * cell)
    return data, transform


def build_id_grid(shape_hw, transform):
    """AGS-Index-Grid: jede Zelle bekommt den Code ihres Kreises (mehrteilige
    Kreise teilen sich einen Code). Gibt (id_grid, codes, names) zurück."""
    geo = json.loads(KREISE.read_text(encoding="utf-8"))
    to_gk = Transformer.from_crs("EPSG:4326", "EPSG:31467", always_xy=True).transform

    ags_order, names = [], {}
    code_of = {}
    shapes = []
    for f in geo["features"]:
        ags = f["properties"]["ags"]
        names[ags] = f["properties"]["name"]
        if ags not in code_of:
            code_of[ags] = len(ags_order) + 1
            ags_order.append(ags)
        geom = shp_transform(to_gk, shape(f["geometry"]))
        shapes.append((geom, code_of[ags]))

    id_grid = rasterio.features.rasterize(
        shapes, out_shape=shape_hw, transform=transform, fill=0,
        all_touched=False, dtype=np.int32,
    )
    return id_grid, ags_order, code_of, names


def main():
    CACHE.mkdir(exist_ok=True)
    years = list(range(START, END + 1))

    # Alle Raster laden (gecacht)
    print("Lade DWD-Raster …")
    for key, dwd_dir in METRICS.items():
        for y in years:
            download(dwd_dir, y)
        print(f"  {dwd_dir}: {len(years)} Jahre im Cache")

    # Index-Grid einmal aus dem ersten Raster aufbauen
    sample, transform = read_dwd_ascii(cache_path("hot_days", START))
    id_grid, ags_order, code_of, names = build_id_grid(sample.shape, transform)
    print(f"Index-Grid: {len(ags_order)} eindeutige Kreise")

    # Pro Kreis die flachen Zellindizes vorberechnen
    flat = id_grid.ravel()
    cells_by_code = {}
    order = np.argsort(flat, kind="stable")
    sorted_codes = flat[order]
    bounds = np.searchsorted(sorted_codes, np.arange(1, len(ags_order) + 1, dtype=np.int32), side="left")
    bounds = np.append(bounds, np.searchsorted(sorted_codes, len(ags_order), side="right"))
    for i, ags in enumerate(ags_order):
        cells_by_code[ags] = order[bounds[i]:bounds[i + 1]]

    # Pro Metrik & Jahr aggregieren
    kreise = {ags: {"name": names[ags]} for ags in ags_order}
    summary = {"years": years}
    for key, dwd_dir in METRICS.items():
        nat = []
        for ags in ags_order:
            kreise[ags][key] = []
        for y in years:
            data, _ = read_dwd_ascii(cache_path(dwd_dir, y))
            flat_data = data.ravel()
            tot_sum = tot_n = 0.0
            for ags in ags_order:
                idxs = cells_by_code[ags]
                vals = flat_data[idxs]
                vals = vals[np.isfinite(vals)]
                if vals.size:
                    m = float(vals.mean())
                    kreise[ags][key].append(round(m, 1))
                    tot_sum += m * vals.size
                    tot_n += vals.size
                else:
                    kreise[ags][key].append(None)
            nat.append(round(tot_sum / tot_n, 1))
        summary[key] = nat
        print(f"  {key}: {nat[0]} ({START}) … {nat[-1]} ({END}), Max {max(nat)}")

    out = {
        "generated": date.today().isoformat(),
        "source": SOURCE,
        "years": years,
        "metrics": {"hotDays": "Heiße Tage (Tmax ≥ 30 °C)", "summerDays": "Sommertage (Tmax ≥ 25 °C)"},
        "kreise": kreise,
    }
    (PUB / "heat_kreise.json").write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    (PUB / "heat_summary.json").write_text(
        json.dumps({"generated": date.today().isoformat(), "source": SOURCE, **summary},
                   separators=(",", ":"), ensure_ascii=False), encoding="utf-8")

    import gzip as gz
    for f in ("heat_kreise.json", "heat_summary.json"):
        p = PUB / f
        g = len(gz.compress(p.read_bytes()))
        print(f"  {f}: {p.stat().st_size/1e6:.2f} MB roh / {g/1e6:.2f} MB gzip")
    print(f"\nKreise: {len(ags_order)} · Jahre: {START}–{END}")


if __name__ == "__main__":
    main()
