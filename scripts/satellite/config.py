"""Gemeinsame Konfiguration für den NDVI-Prototyp (Phase 0).

Testregion: Landkreis Ebersberg (Bayern).
Die Region wird aus dem echten Landkreis-Polygon geladen (ebersberg.geojson,
Quelle: OSM Nominatim). Die Bounding-Box wird daraus abgeleitet.
"""

import json
import os
from datetime import date

# --- Testregion: Landkreis Ebersberg (echtes Polygon) ---
REGION_NAME = "Landkreis Ebersberg"
REGION_SLUG = "ebersberg"

_HERE = os.path.dirname(__file__)
REPO_ROOT = os.path.abspath(os.path.join(_HERE, "..", ".."))
GEOJSON_PATH = os.path.join(_HERE, "ebersberg.geojson")

with open(GEOJSON_PATH, encoding="utf-8") as _f:
    REGION_FEATURE = json.load(_f)
REGION_GEOMETRY = REGION_FEATURE["geometry"]


def _bbox_from_geometry(geom):
    """Umschließende Bounding-Box (west/south/east/north) eines Polygons."""
    ring = geom["coordinates"][0]
    lons = [c[0] for c in ring]
    lats = [c[1] for c in ring]
    return {
        "west": min(lons),
        "south": min(lats),
        "east": max(lons),
        "north": max(lats),
    }


BBOX = _bbox_from_geometry(REGION_GEOMETRY)

# --- Zeitraum ---
# YEARS_BACK steuert, wie weit die monatliche Zeitreihe zurückreicht.
# 1 = letztes Jahr (schnell). 5 = für das spätere Fünfjahresmittel.
YEARS_BACK = 5

END = date.today().isoformat()
START = date(date.today().year - YEARS_BACK, date.today().month, 1).isoformat()

# Für die "aktuelle" Kartenansicht: Median der letzten ~45 Tage.
LATEST_WINDOW_DAYS = 45

# --- Jahres-Komposite für die Karte ---
# Pro Jahr ein Sommer-Median (Vegetationshöhepunkt). So lassen sich die Jahre
# auf der Karte vergleichbar durchschalten.
SUMMER_START = "05-01"   # 1. Mai
SUMMER_END = "09-30"     # 30. September


def composite_years():
    """Liste der Jahre, für die ein Sommer-Komposit erzeugt wird."""
    return list(range(date.today().year - YEARS_BACK + 1, date.today().year + 1))

# --- Wolken ---
# Szenen mit mehr als so viel Bewölkung gar nicht erst laden (spart Quota).
MAX_SCENE_CLOUD_COVER = 70

# Sentinel-2 Scene Classification Layer (SCL) Klassen, die wir maskieren:
#   3 = Cloud Shadows, 8 = Cloud medium prob, 9 = Cloud high prob,
#   10 = Thin cirrus, 11 = Snow/Ice
SCL_MASK_CLASSES = [3, 8, 9, 10, 11]

# --- Deutschland-Choropleth (Proof: 16 Bundesländer) ---
# Grobe Auflösung + Aggregation über Polygone → eine Zahlentabelle statt Raster.
DE_BBOX = {"west": 5.8, "south": 47.2, "east": 15.1, "north": 55.1}
CHORO_RES_M = 200          # Zielauflösung vor der Aggregation (für Regionsmittel reicht grob)
CHORO_PROJECTION = 3035    # ETRS89-LAEA Europa (gleichflächig, Meter)
# Je Monat ein eigener Job — ganz DE × 1 Monat × 10 m ≈ 6e10 Pixel, unter dem
# OpenEO-Free-Tier-Limit von 1e11. Mehrere Monate = mehrere Jobs (so wie der
# spätere Cron monatlich appendet). Für den Proof bewusst klein halten.
CHORO_MONTHS = 3
# Vorhandenes Bundesland-GeoJSON der Website (key = properties.id, z. B. "DE-BW").
CHORO_GEOJSON_PATH = os.path.join(REPO_ROOT, "public", "bundeslaender.geo.json")

# --- OpenEO ---
OPENEO_BACKEND = "openeo.dataspace.copernicus.eu"

# --- Ausgabe ---
OUTPUT_DIR = os.path.join(_HERE, "output")
