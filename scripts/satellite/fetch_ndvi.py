"""Phase 0 — Schritt 1: NDVI für Ebersberg über CDSE OpenEO holen.

Macht das schwere Processing (Cloud-Masking + NDVI + zeitliche Aggregation)
serverseitig bei Copernicus und lädt nur kleine Ergebnisse herunter:

  output/ndvi_timeseries_<region>.json   monatlicher Mittelwert über die Region
  output/ndvi_years_<region>.tif         ein Sommer-Komposit pro Jahr (mehrbändig)

Die Zeitreihe wird nur geholt, wenn sie noch fehlt (teurer Job). Die
Jahres-Komposite kommen in EINEM Batch-Job (alle Sommer als Bänder).

Voraussetzung: kostenloser Copernicus-Account (dataspace.copernicus.eu).
Beim ersten Lauf öffnet sich ein Browser-Login (OIDC Device Flow) — der Token
wird danach lokal zwischengespeichert.

Lauf:  ../../.venv-sat/Scripts/python.exe fetch_ndvi.py
"""

import json
import os
import sys

import openeo

import config

# Windows-Konsole ist cp1252 — UTF-8 erzwingen, damit Pfeile/Umlaute nicht crashen.
sys.stdout.reconfigure(encoding="utf-8")


def cloud_masked_ndvi(s2):
    """Wolken über SCL maskieren, dann NDVI = (NIR - Rot) / (NIR + Rot)."""
    scl = s2.band("SCL")
    cloud = None
    for cls in config.SCL_MASK_CLASSES:
        flag = scl == cls
        cloud = flag if cloud is None else (cloud | flag)
    # .mask() ersetzt Pixel dort, wo die Maske wahr ist, durch nodata.
    s2_clean = s2.mask(cloud)
    red = s2_clean.band("B04")
    nir = s2_clean.band("B08")
    return (nir - red) / (nir + red)


def main():
    os.makedirs(config.OUTPUT_DIR, exist_ok=True)

    print(f"Verbinde mit {config.OPENEO_BACKEND} …")
    con = openeo.connect(config.OPENEO_BACKEND).authenticate_oidc()
    print("Authentifiziert.")

    s2 = con.load_collection(
        "SENTINEL2_L2A",
        spatial_extent=config.BBOX,
        temporal_extent=[config.START, config.END],
        bands=["B04", "B08", "SCL"],
        max_cloud_cover=config.MAX_SCENE_CLOUD_COVER,
    )
    print(f"Sentinel-2 L2A geladen: {config.START} bis {config.END}, "
          f"max. {config.MAX_SCENE_CLOUD_COVER}% Bewölkung pro Szene.")

    ndvi = cloud_masked_ndvi(s2)
    # Auf die echte Landkreis-Form zuschneiden (statt rechteckige Box):
    # so zählen nur Pixel innerhalb von Ebersberg.
    ndvi = ndvi.mask_polygon(config.REGION_GEOMETRY)

    # --- 1) Monatliche Zeitreihe (nur holen, wenn noch nicht vorhanden) ---
    ts_path = os.path.join(config.OUTPUT_DIR, f"ndvi_timeseries_{config.REGION_SLUG}.json")
    if os.path.exists(ts_path):
        print(f"Zeitreihe bereits vorhanden, überspringe: {ts_path}")
    else:
        ndvi_monthly = ndvi.aggregate_temporal_period(period="month", reducer="median")
        ts = ndvi_monthly.aggregate_spatial(
            geometries=config.REGION_GEOMETRY, reducer="mean"
        )
        print(f"Berechne monatliche Zeitreihe über {config.YEARS_BACK} Jahre (Batch-Job) …")
        ts.execute_batch(
            outputfile=ts_path, out_format="JSON",
            title=f"NDVI Zeitreihe {config.REGION_SLUG}",
        )
        print(f"  → {ts_path}")

    # --- 2) Ein Sommer-Komposit pro Jahr (ein Batch-Job, mehrere Asset-Dateien) ---
    years = config.composite_years()
    intervals = [[f"{y}-{config.SUMMER_START}", f"{y}-{config.SUMMER_END}"] for y in years]
    labels = [str(y) for y in years]
    yearly = ndvi.aggregate_temporal(
        intervals=intervals, labels=labels, reducer="median", dimension="t"
    )
    print(f"Berechne {len(years)} Sommer-Komposite ({years[0]}–{years[-1]}, Batch-Job) …")
    job = yearly.create_job(
        out_format="GTiff", title=f"NDVI Sommer-Komposite {config.REGION_SLUG}",
    )
    job.start_and_wait()
    download_year_assets(job, labels)

    print("\nFertig. Weiter mit:  python process_ndvi.py")


def download_year_assets(job, labels):
    """Jahres-Assets eines fertigen Jobs holen und nach Jahr benennen.

    aggregate_temporal liefert pro Intervall eine eigene Datei (openEO_<jahr>...tif).
    Wir ordnen sie über das Jahr im Dateinamen unseren Labels zu.
    """
    results = job.get_results()
    written = []
    for asset in results.get_assets():
        if not asset.name.lower().endswith(".tif"):
            continue
        year = next((y for y in labels if y in asset.name), None)
        if year is None:
            continue
        target = os.path.join(config.OUTPUT_DIR, f"ndvi_year_{year}_{config.REGION_SLUG}.tif")
        asset.download(target=target)
        written.append(year)
        print(f"  → {target}")
    written.sort()
    with open(os.path.join(config.OUTPUT_DIR, f"years_{config.REGION_SLUG}.json"),
              "w", encoding="utf-8") as f:
        json.dump(written, f)


if __name__ == "__main__":
    main()
