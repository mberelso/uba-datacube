"""Hitze-Phase 0: DWD-Jahresraster zu Landkreisen aggregieren + plausibilisieren.

Liest ein DWD-ESRI-ASCII-Grid (1 km, EPSG:31467), reprojiziert die
Kreis-Polygone (public/kreise.geo.json, WGS84) dorthin, rasterisiert sie zu
einem AGS-Index-Grid und bildet den Mittelwert je Kreis. Sanity-Check gegen
die UBA-Bundesland-Werte desselben Jahres.

Lauf:  .venv-sat/Scripts/python.exe scripts/dwd/phase0_dwd_heat.py
"""

import gzip
import io
import json
import sys
import urllib.request
from collections import defaultdict
from pathlib import Path

import numpy as np
import rasterio.features
from affine import Affine
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform as shp_transform

sys.stdout.reconfigure(encoding="utf-8")

HERE = Path(__file__).resolve().parent
KREISE = HERE.parents[1] / "public" / "kreise.geo.json"
YEAR = 2003  # extremes Hitzejahr — guter Stresstest

# AGS-Präfix (2-stellig) → UBA D_FEDERAL_STATES-Code
AGS_TO_BL = {
    "01": "SH", "02": "HH", "03": "NI", "04": "HB", "05": "NW", "06": "HE",
    "07": "RP", "08": "BW", "09": "BY", "10": "SL", "11": "BE", "12": "BB",
    "13": "MV", "14": "SN", "15": "ST", "16": "TH",
}


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
    # Oben-links = untere Ecke + nrows*cell nach oben; y läuft nach unten
    transform = Affine(cell, 0, hdr["XLLCORNER"], 0, -cell, hdr["YLLCORNER"] + nrows * cell)
    return data, transform


def fetch_uba_bundesland(dataflow, year):
    """UBA-Wert je Bundesland für ein Jahr aus dem CSV (Spalten: ...,D_FEDERAL_STATES,TIME_PERIOD,OBS_VALUE,...)."""
    url = f"https://daten.uba.de/release/rest/data/UBA,{dataflow},1.0/all?format=csv"
    with urllib.request.urlopen(url, timeout=60) as r:
        lines = r.read().decode("utf-8").splitlines()
    hdr = lines[0].split(",")
    i_bl, i_t, i_v = hdr.index("D_FEDERAL_STATES"), hdr.index("TIME_PERIOD"), hdr.index("OBS_VALUE")
    out = {}
    for ln in lines[1:]:
        c = ln.split(",")
        if c[i_t] == str(year):
            out[c[i_bl]] = float(c[i_v])
    return out


def main():
    geo = json.loads(KREISE.read_text(encoding="utf-8"))
    feats = geo["features"]
    print(f"{len(feats)} Kreis-Features")

    data, transform = read_dwd_ascii(HERE / "cache" / f"hot_{YEAR}.asc.gz")
    nrows, ncols = data.shape
    print(f"Raster {ncols}×{nrows}, gültige Zellen: {np.isfinite(data).sum():,}")

    # Polygone WGS84 → EPSG:31467
    to_gk = Transformer.from_crs("EPSG:4326", "EPSG:31467", always_xy=True).transform
    shapes = []
    ags_list = []
    for idx, f in enumerate(feats, start=1):
        geom = shp_transform(to_gk, shape(f["geometry"]))
        shapes.append((geom, idx))
        ags_list.append(f["properties"]["ags"])

    # Index-Grid: jede Zelle bekommt die Kreis-ID (1..N), 0 = kein Kreis
    id_grid = rasterio.features.rasterize(
        shapes, out_shape=(nrows, ncols), transform=transform,
        fill=0, all_touched=False, dtype=np.int32,
    )

    # Mittelwert je Kreis
    result = {}
    for idx, ags in enumerate(ags_list, start=1):
        mask = (id_grid == idx) & np.isfinite(data)
        if mask.sum() == 0:
            continue
        result[ags] = (float(np.mean(data[mask])), int(mask.sum()))

    print(f"Kreise mit Werten: {len(result)}/{len(feats)}")
    matched_cells = sum(n for _, n in result.values())
    print(f"Zugeordnete Rasterzellen: {matched_cells:,}")

    name_by_ags = {f["properties"]["ags"]: f["properties"]["name"] for f in feats}
    ranked = sorted(result.items(), key=lambda kv: kv[1][0], reverse=True)
    print(f"\n=== Heiße Tage {YEAR} — Top 8 Kreise ===")
    for ags, (v, n) in ranked[:8]:
        print(f"  {ags} {name_by_ags[ags]:<28} {v:5.1f} Tage  ({n} Zellen)")
    print("=== Bottom 5 ===")
    for ags, (v, n) in ranked[-5:]:
        print(f"  {ags} {name_by_ags[ags]:<28} {v:5.1f} Tage  ({n} Zellen)")

    # Flächengewichteter nationaler Mittelwert
    nat = sum(v * n for v, n in result.values()) / sum(n for _, n in result.values())
    print(f"\nNationaler Mittelwert (zellgewichtet): {nat:.1f} Heiße Tage")

    # Sanity-Check: Kreis-Aggregation je Bundesland vs. UBA
    print(f"\n=== Sanity-Check gegen UBA-Bundesland-Werte {YEAR} ===")
    uba = fetch_uba_bundesland("DF_CLIMATE_GERMANY_HOT_DAYS", YEAR)
    bl_sum = defaultdict(float)
    bl_cells = defaultdict(int)
    for ags, (v, n) in result.items():
        bl = AGS_TO_BL.get(ags[:2])
        if bl:
            bl_sum[bl] += v * n
            bl_cells[bl] += n
    print(f"  {'BL':<4} {'DWD→Kreise':>11} {'UBA':>7} {'Δ':>6}")
    for bl in sorted(bl_cells):
        dwd_bl = bl_sum[bl] / bl_cells[bl]
        u = uba.get(bl)
        if u is not None:
            print(f"  {bl:<4} {dwd_bl:>11.1f} {u:>7.1f} {dwd_bl - u:>+6.1f}")
        else:
            print(f"  {bl:<4} {dwd_bl:>11.1f} {'—':>7}")
    if "DE" in uba:
        print(f"\n  UBA Deutschland {YEAR}: {uba['DE']:.1f} | DWD national: {nat:.1f}")


if __name__ == "__main__":
    main()
