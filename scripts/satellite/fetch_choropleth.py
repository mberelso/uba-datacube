"""Deutschland-Choropleth (Proof, 16 Bundesländer).

Beweist das skalierbare Vorgehen aus docs/umweltpuls_skalierung_deutschland.md:
NICHT 16 Raster, sondern EIN aggregate_spatial-Job über alle Bundesland-Polygone
→ ein NDVI-Wert je Land je Monat. Vorher grob resamplen (200 m), damit der Server
nicht Milliarden 10-m-Pixel je Zeitschritt aggregieren muss.

Schreibt direkt das Frontend-Asset:
  public/data/vegetation/ndvi_bundeslaender.json

Lauf:  ../../.venv-sat/Scripts/python.exe fetch_choropleth.py
"""

import json
import os
import sys
from datetime import date

import openeo

import config
from fetch_ndvi import cloud_masked_ndvi

sys.stdout.reconfigure(encoding="utf-8")


def add_months(y, m, delta):
    """(Jahr, Monat) + delta Monate, normalisiert."""
    idx = (y * 12 + (m - 1)) + delta
    return idx // 12, idx % 12 + 1


def recent_months(n):
    """Liste der letzten n (Jahr, Monat)-Paare, ältester zuerst."""
    y, m = date.today().year, date.today().month
    return [add_months(y, m, -(n - 1 - i)) for i in range(n)]


def flatten(v):
    while isinstance(v, list):
        if not v:
            return None
        v = v[0]
    return v


def main():
    os.makedirs(config.OUTPUT_DIR, exist_ok=True)
    with open(config.CHORO_GEOJSON_PATH, encoding="utf-8") as f:
        fc = json.load(f)
    ids = [feat["properties"]["id"] for feat in fc["features"]]
    print(f"{len(ids)} Bundesländer geladen.")

    con = openeo.connect(config.OPENEO_BACKEND).authenticate_oidc()
    print("Authentifiziert.")

    # Vorhandene Werte einlesen (inkrementell — schon berechnete Monate behalten).
    web_dir = os.path.join(config.REPO_ROOT, "public", "data", "vegetation")
    web_path = os.path.join(web_dir, "ndvi_bundeslaender.json")
    values = {i: {} for i in ids}
    if os.path.exists(web_path):
        prev = json.load(open(web_path, encoding="utf-8"))
        for gid, vv in prev.get("values", {}).items():
            if gid in values:
                values[gid].update(vv)

    months = recent_months(config.CHORO_MONTHS)
    print(f"Verarbeite {len(months)} Monate, je ein Batch-Job (unter dem 1e11-Limit).")
    for (y, m) in months:
        ym = f"{y:04d}-{m:02d}"
        if all(ym in values[i] for i in ids):
            print(f"  {ym}: schon vorhanden, überspringe.")
            continue
        ny, nm = add_months(y, m, 1)
        start, end = f"{ym}-01", f"{ny:04d}-{nm:02d}-01"
        s2 = con.load_collection(
            "SENTINEL2_L2A",
            spatial_extent=config.DE_BBOX,
            temporal_extent=[start, end],
            bands=["B04", "B08", "SCL"],
            max_cloud_cover=config.MAX_SCENE_CLOUD_COVER,
        )
        ndvi = cloud_masked_ndvi(s2)
        ndvi = ndvi.resample_spatial(
            resolution=config.CHORO_RES_M, projection=config.CHORO_PROJECTION
        )
        comp = ndvi.aggregate_temporal_period(period="month", reducer="median")
        ts = comp.aggregate_spatial(geometries=fc, reducer="mean")
        raw_path = os.path.join(config.OUTPUT_DIR, f"ndvi_de_{ym}_raw.json")
        print(f"  {ym}: aggregiere über {len(ids)} Polygone (Batch-Job) …")
        ts.execute_batch(outputfile=raw_path, out_format="JSON",
                         title=f"NDVI Bundesländer {ym}")
        raw = json.load(open(raw_path, encoding="utf-8"))
        for ts_key, per_geom in raw.items():
            for idx, gid in enumerate(ids):
                val = flatten(per_geom[idx]) if idx < len(per_geom) else None
                if val is not None and val == val:  # not NaN
                    values[gid][ts_key[:7]] = round(float(val), 3)
        got = sum(1 for i in ids if ym in values[i])
        print(f"    {got}/{len(ids)} Bundesländer mit Wert für {ym}")

    all_months = sorted({mm for vv in values.values() for mm in vv})

    out = {
        "level": "bundeslaender",
        "source": "Copernicus Sentinel-2 · CDSE OpenEO",
        "indicator": "NDVI (Monatsmedian)",
        "resolution_m": config.CHORO_RES_M,
        "updated": date.today().isoformat(),
        "months": all_months,
        "values": values,
    }
    os.makedirs(web_dir, exist_ok=True)
    with open(web_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"\nFrontend-Asset → {web_path}")
    print(f"  {len(all_months)} Monate gesamt, {len(ids)} Bundesländer")
    if all_months:
        for gid in ids:
            vv = values[gid]
            latest = vv.get(all_months[-1])
            print(f"    {gid}: {len(vv)} Monate, {all_months[-1]} = {latest}")


if __name__ == "__main__":
    main()
