"""Phase 0 — Schritt 2: NDVI-Ergebnisse lokal verarbeiten.

Liest die von fetch_ndvi.py heruntergeladenen Dateien und erzeugt:

  output/ndvi_year_<jahr>_<region>.png        eingefärbte Karte je Sommer-Komposit
  output/periods_<region>.json                 Kennzahlen je Jahr (für die Vorschau)
  output/ndvi_timeseries_<region>_clean.json   aufgeräumte Monats-Zeitreihe

Gibt außerdem Plausibilitäts-Kennzahlen aus (NDVI-Bereich, Wolkenlücke je relativ
zur Landkreis-Fläche), mit denen sich die Phase-0-Kriterien prüfen lassen.

Lauf:  ../../.venv-sat/Scripts/python.exe process_ndvi.py
"""

import json
import os
import sys

import numpy as np
import rasterio
from PIL import Image
from rasterio.features import geometry_mask
from rasterio.warp import transform_geom

import config

sys.stdout.reconfigure(encoding="utf-8")


# NDVI-Farbskala: Stützpunkte (ndvi, R, G, B). Rot = gestresst, dunkelgrün = gesund.
COLOR_STOPS = [
    (-1.0, (0x42, 0x6e, 0xa8)),   # Wasser / negativ → blau
    (0.0,  (0x8c, 0x6d, 0x3f)),   # nackter Boden → braun
    (0.2,  (0xd9, 0xae, 0x4e)),   # spärlich → ocker
    (0.4,  (0xc6, 0xd6, 0x4e)),   # mäßig → gelbgrün
    (0.6,  (0x5a, 0xa8, 0x3a)),   # gesund → grün
    (1.0,  (0x16, 0x5e, 0x1f)),   # sehr dicht → dunkelgrün
]


def ndvi_to_rgb(ndvi):
    """Vektorisiertes Mapping NDVI → RGB über lineare Interpolation der Stützpunkte."""
    stops = np.array([s[0] for s in COLOR_STOPS])
    cols = np.array([s[1] for s in COLOR_STOPS], dtype=float)
    flat = np.clip(ndvi.ravel(), -1.0, 1.0)
    r = np.interp(flat, stops, cols[:, 0])
    g = np.interp(flat, stops, cols[:, 1])
    b = np.interp(flat, stops, cols[:, 2])
    rgb = np.stack([r, g, b], axis=-1).reshape(ndvi.shape + (3,))
    return rgb.astype(np.uint8)


def inside_mask(src):
    """Bool-Maske: True für Pixel innerhalb des Landkreis-Polygons."""
    geom = transform_geom("EPSG:4326", src.crs, config.REGION_GEOMETRY)
    return ~geometry_mask([geom], out_shape=(src.height, src.width),
                          transform=src.transform, invert=False)


def band_stats(ndvi, inside, nodata):
    """Kennzahlen für ein NDVI-Band. Wolkenlücke relativ zur Landkreis-Fläche."""
    valid = np.isfinite(ndvi)
    if nodata is not None:
        valid &= ndvi != nodata
    valid &= inside
    n_inside, n_valid = int(inside.sum()), int(valid.sum())
    vals = ndvi[valid]
    return {
        "valid_mask": valid,
        "n_inside": n_inside,
        "n_valid": n_valid,
        "gap_pct": 100.0 * (n_inside - n_valid) / n_inside if n_inside else 0.0,
        "median": float(np.median(vals)) if n_valid else None,
        "veg_pct": float(100.0 * (vals > 0.4).mean()) if n_valid else None,
        "vmin": float(vals.min()) if n_valid else None,
        "vmax": float(vals.max()) if n_valid else None,
    }


def save_png(ndvi, valid, path):
    rgb = ndvi_to_rgb(np.where(valid, ndvi, 0))
    alpha = np.where(valid, 255, 0).astype(np.uint8)
    Image.fromarray(np.dstack([rgb, alpha]), mode="RGBA").save(path)


def render_years():
    """Pro Jahres-GeoTIFF ein PNG + Kennzahlen."""
    years_json = os.path.join(config.OUTPUT_DIR, f"years_{config.REGION_SLUG}.json")
    if not os.path.exists(years_json):
        print(f"!! {years_json} fehlt — erst fetch_ndvi.py laufen lassen.")
        return []
    with open(years_json, encoding="utf-8") as f:
        years = json.load(f)

    periods = []
    for year in years:
        tif = os.path.join(config.OUTPUT_DIR, f"ndvi_year_{year}_{config.REGION_SLUG}.tif")
        if not os.path.exists(tif):
            print(f"!! {tif} fehlt — überspringe {year}.")
            continue
        with rasterio.open(tif) as src:
            inside = inside_mask(src)
            ndvi = src.read(1).astype(float)
            s = band_stats(ndvi, inside, src.nodata)
        png_name = f"ndvi_year_{year}_{config.REGION_SLUG}.png"
        save_png(ndvi, s["valid_mask"], os.path.join(config.OUTPUT_DIR, png_name))
        periods.append({
            "year": year, "png": png_name,
            "median": round(s["median"], 3) if s["median"] is not None else None,
            "veg_pct": round(s["veg_pct"], 1) if s["veg_pct"] is not None else None,
            "gap_pct": round(s["gap_pct"], 1),
        })
        med = f"{s['median']:.2f}" if s["median"] is not None else "—"
        print(f"  {year}: Median {med}, Vegetation "
              f"{s['veg_pct']:.0f}%, Wolkenlücke {s['gap_pct']:.1f}%")

    out = os.path.join(config.OUTPUT_DIR, f"periods_{config.REGION_SLUG}.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"region": config.REGION_NAME, "periods": periods}, f,
                  ensure_ascii=False, indent=2)
    print(f"Kennzahlen je Jahr → {out}")
    return periods


def _flatten_value(v):
    """aggregate_spatial-JSON verschachtelt den Wert unterschiedlich tief — flach holen."""
    while isinstance(v, list):
        if not v:
            return None
        v = v[0]
    return v


def clean_timeseries():
    raw = os.path.join(config.OUTPUT_DIR, f"ndvi_timeseries_{config.REGION_SLUG}.json")
    if not os.path.exists(raw):
        print(f"!! {raw} fehlt — erst fetch_ndvi.py laufen lassen.")
        return
    with open(raw, encoding="utf-8") as f:
        data = json.load(f)

    series = []
    if isinstance(data, dict):
        for ts, value in sorted(data.items()):
            mean = _flatten_value(value)
            if mean is not None and np.isfinite(mean):
                series.append({"date": ts[:10], "ndvi": round(float(mean), 3)})

    out = os.path.join(config.OUTPUT_DIR, f"ndvi_timeseries_{config.REGION_SLUG}_clean.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"region": config.REGION_NAME, "slug": config.REGION_SLUG,
                   "bbox": config.BBOX, "values": series}, f,
                  ensure_ascii=False, indent=2)
    print(f"Zeitreihe → {out}  ({len(series)} Monate mit Daten)")


def main():
    render_years()
    clean_timeseries()


if __name__ == "__main__":
    main()
