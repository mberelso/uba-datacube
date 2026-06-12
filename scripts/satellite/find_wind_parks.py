"""Phase 3a — Schritt 1: Windpark-Kandidaten für Vorher/Nachher-Satellitenbilder.

Clustert Anlagen aus public/wind_units.json, die räumlich eng beieinanderliegen
und im selben Jahr in Betrieb gingen — das sind mit hoher Sicherheit gemeinsam
errichtete Parks. Kandidaten: Baujahr >= 2019 (sauberes "Vorher" im
Sentinel-2-Archiv), onshore, möglichst viele Anlagen und MW.

Lauf:  ../../.venv-sat/Scripts/python.exe find_wind_parks.py
"""

import json
import math
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(__file__)
UNITS_PATH = os.path.join(HERE, "..", "..", "public", "wind_units.json")

MIN_YEAR = 2019          # Inbetriebnahme ab — Sentinel-2 L2A flächig ab ~2017
CLUSTER_RADIUS_KM = 1.5  # Nachbarschaftsradius innerhalb eines Parks
MIN_UNITS = 6            # kleinere Gruppen sind als Bild unspektakulär


def dist_km(lat1, lon1, lat2, lon2):
    """Schnelle äquirektangulare Näherung — für 1-2 km völlig ausreichend."""
    kx = 111.32 * math.cos(math.radians((lat1 + lat2) / 2))
    return math.hypot((lon1 - lon2) * kx, (lat1 - lat2) * 111.32)


with open(UNITS_PATH, encoding="utf-8") as f:
    u = json.load(f)["units"]

# Kandidaten-Anlagen: onshore, in Betrieb, Baujahr >= MIN_YEAR
cand = [
    (u["lat"][i], u["lon"][i], u["year"][i], u["kw"][i])
    for i in range(len(u["lat"]))
    if u["status"][i] == 0 and not u["offshore"][i] and u["year"][i] >= MIN_YEAR
]
print(f"{len(cand)} Onshore-Anlagen in Betrieb mit Baujahr >= {MIN_YEAR}\n")

# Einfaches Single-Linkage-Clustering pro Jahrgang (Union-Find)
clusters = []
by_year = {}
for c in cand:
    by_year.setdefault(c[2], []).append(c)

for year, units in by_year.items():
    n = len(units)
    parent = list(range(n))

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    for i in range(n):
        for j in range(i + 1, n):
            if dist_km(units[i][0], units[i][1], units[j][0], units[j][1]) <= CLUSTER_RADIUS_KM:
                parent[find(i)] = find(j)

    groups = {}
    for i in range(n):
        groups.setdefault(find(i), []).append(units[i])
    for g in groups.values():
        if len(g) >= MIN_UNITS:
            clusters.append(g)

# Ranking: Anlagenzahl, dann Leistung
clusters.sort(key=lambda g: (len(g), sum(x[3] for x in g)), reverse=True)

print(f"{len(clusters)} Park-Kandidaten (>= {MIN_UNITS} Anlagen, Radius {CLUSTER_RADIUS_KM} km)\n")
print(f"{'#':>2}  {'Jahr':>4}  {'Anlagen':>7}  {'MW':>6}  {'Zentrum (lat, lon)':>22}  Ausdehnung km")
for rank, g in enumerate(clusters[:15], 1):
    lat = sum(x[0] for x in g) / len(g)
    lon = sum(x[1] for x in g) / len(g)
    mw = sum(x[3] for x in g) / 1000
    ext = max(dist_km(a[0], a[1], b[0], b[1]) for a in g for b in g)
    print(f"{rank:>2}  {g[0][2]:>4}  {len(g):>7}  {mw:>6.1f}  {lat:>11.4f}, {lon:.4f}  {ext:.1f}")
