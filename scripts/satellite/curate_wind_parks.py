"""Phase 3b — Schritt 1: Parks kuratieren.

Nimmt die größten Cluster aus find_wind_parks.py, klassifiziert sie anhand
der MaStR-Standort-Vorgeschichte als Neubau/Repowering, holt Ortsnamen per
Nominatim-Reverse-Geocoding und schreibt die Auswahl als parks_curated.json.

Lauf:  ../../.venv-sat/Scripts/python.exe curate_wind_parks.py
"""

import json
import math
import os
import sys
import time
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(__file__)
UNITS_PATH = os.path.join(HERE, "..", "..", "public", "wind_units.json")
OUT_PATH = os.path.join(HERE, "parks_curated.json")

# Manuell ausgewählte Cluster aus find_wind_parks.py (Rang, regional gestreut)
CANDIDATES = [
    {"lat": 51.5256, "lon": 8.8259,  "year": 2020, "rank": 1},
    {"lat": 51.8334, "lon": 12.8746, "year": 2025, "rank": 3},
    {"lat": 52.7913, "lon": 7.0842,  "year": 2021, "rank": 4},
    {"lat": 53.3869, "lon": 12.0847, "year": 2025, "rank": 6},
    {"lat": 54.6150, "lon": 8.9128,  "year": 2022, "rank": 9},
    {"lat": 52.0781, "lon": 10.7899, "year": 2024, "rank": 12},
]

with open(UNITS_PATH, encoding="utf-8") as f:
    u = json.load(f)["units"]
n = len(u["lat"])


def units_in_box(lat0, lon0, half_km):
    dlat = half_km / 111.32
    dlon = half_km / (111.32 * math.cos(math.radians(lat0)))
    return [i for i in range(n)
            if abs(u["lat"][i] - lat0) <= dlat and abs(u["lon"][i] - lon0) <= dlon]


def reverse_geocode(lat, lon):
    url = (f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}"
           f"&format=json&zoom=10&accept-language=de")
    req = urllib.request.Request(url, headers={"User-Agent": "umweltpuls.de wind-park-curation"})
    with urllib.request.urlopen(req, timeout=30) as r:
        a = json.load(r).get("address", {})
    place = a.get("town") or a.get("city") or a.get("village") or a.get("municipality") or a.get("county") or "?"
    return place, a.get("state", "?")


parks = []
for c in CANDIDATES:
    idx = units_in_box(c["lat"], c["lon"], 2.6)
    new = [i for i in idx if u["status"][i] == 0 and abs(u["year"][i] - c["year"]) <= 1]
    old_decom = [i for i in idx if u["status"][i] == 1]
    old_active = [i for i in idx if u["status"][i] == 0 and u["year"][i] < c["year"] - 3]
    park_type = "repowering" if len(old_decom) >= 3 else "neubau"

    place, state = reverse_geocode(c["lat"], c["lon"])
    time.sleep(1.1)  # Nominatim-Limit: 1 Request/s

    ext = 0
    for a in new:
        for b in new:
            kx = 111.32 * math.cos(math.radians(u["lat"][a]))
            d = math.hypot((u["lon"][a] - u["lon"][b]) * kx, (u["lat"][a] - u["lat"][b]) * 111.32)
            ext = max(ext, d)

    slug = place.lower().replace(" ", "-").replace("(", "").replace(")", "")
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        slug = slug.replace(a, b)
    park = {
        "slug": slug,
        "name": place,
        "state": state,
        "lat": round(sum(u["lat"][i] for i in new) / len(new), 4),
        "lon": round(sum(u["lon"][i] for i in new) / len(new), 4),
        "year": c["year"],
        "units": len(new),
        "mw": round(sum(u["kw"][i] for i in new) / 1000, 1),
        "type": park_type,
        "oldUnits": len(old_decom),
        "extentKm": round(ext, 1),
        "halfKm": round(max(ext / 2 + 0.8, 1.6), 1),
    }
    parks.append(park)
    print(f"#{c['rank']:>2}  {place} ({state}): {park['units']} Anlagen, {park['mw']} MW, "
          f"{c['year']}, {park_type}{f' ({len(old_decom)} Altanlagen stillgelegt)' if old_decom else ''}, "
          f"Ausdehnung {park['extentKm']} km")

with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(parks, f, ensure_ascii=False, indent=2)
print(f"\n-> {OUT_PATH}")
