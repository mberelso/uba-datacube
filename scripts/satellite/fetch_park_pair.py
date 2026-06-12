"""Phase 3a — Schritt 2: Vorher/Nachher-Echtfarben-Composite für einen Windpark.

Holt zwei wolkenfreie Sommer-RGB-Composites (Sentinel-2 L2A, 10 m) über CDSE
OpenEO und rendert sie als PNG mit Perzentil-Stretch.

Prototyp-Park: Cluster #3 aus find_wind_parks.py —
16 Anlagen, 105,6 MW, Inbetriebnahme 2025, Region Bad Schmiedeberg (ST).

Lauf:  ../../.venv-sat/Scripts/python.exe fetch_park_pair.py
"""

import os
import sys

import numpy as np
import openeo
import rasterio
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "output")

PARK_SLUG = "bad-schmiedeberg"
CENTER_LAT, CENTER_LON = 51.8334, 12.8746
HALF_KM = 2.6  # halbe Kantenlänge des Ausschnitts (Park-Ausdehnung 2,7 km + Rand)

YEAR_BEFORE = 2023  # Sommer vor Baubeginn (Inbetriebnahme 2025)
YEAR_AFTER = 2025   # erster Sommer in Betrieb

SUMMER = ("05-01", "09-30")
MAX_CLOUD = 60
SCL_MASK = [3, 8, 9, 10, 11]

dlat = HALF_KM / 111.32
dlon = HALF_KM / (111.32 * np.cos(np.radians(CENTER_LAT)))
BBOX = {
    "west": CENTER_LON - dlon, "east": CENTER_LON + dlon,
    "south": CENTER_LAT - dlat, "north": CENTER_LAT + dlat,
}


def fetch_composite(con, year, path):
    if os.path.exists(path):
        print(f"vorhanden, überspringe: {path}")
        return
    s2 = con.load_collection(
        "SENTINEL2_L2A",
        spatial_extent=BBOX,
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
    print(f"Batch-Job Sommer-Composite {year} …")
    composite.execute_batch(
        outputfile=path, out_format="GTiff",
        title=f"Windpark {PARK_SLUG} RGB {year}",
    )
    print(f"  -> {path}")


def to_png(tif_path, png_path, p_low=2, p_high=98):
    """GTiff (B04,B03,B02) -> 8-bit-PNG mit Perzentil-Stretch über beide Bilder identisch."""
    with rasterio.open(tif_path) as src:
        arr = src.read().astype(np.float32)  # (3, H, W) Reflektanz * 10000
    lo, hi = np.nanpercentile(arr, [p_low, p_high])
    img = np.clip((arr - lo) / (hi - lo), 0, 1)
    img = (img ** 0.9 * 255).astype(np.uint8)  # leichte Gamma-Anhebung
    Image.fromarray(np.moveaxis(img, 0, -1)).save(png_path)
    print(f"  PNG: {png_path} ({Image.open(png_path).size})")


def main():
    os.makedirs(OUT, exist_ok=True)
    print(f"BBOX: {BBOX}")
    con = openeo.connect("openeo.dataspace.copernicus.eu").authenticate_oidc()
    print("Authentifiziert.")

    for year in (YEAR_BEFORE, YEAR_AFTER):
        tif = os.path.join(OUT, f"park_{PARK_SLUG}_{year}.tif")
        fetch_composite(con, year, tif)
        to_png(tif, os.path.join(OUT, f"park_{PARK_SLUG}_{year}.png"))

    print("FERTIG")


if __name__ == "__main__":
    main()
