# PV-Phase 1: Erzeugt aus dem MaStR-Solar-Export drei JSONs für die Karte.
#
# Warum eigener Parser: open-mastr 0.17.1 befüllt solar_extended nicht
# (Export ohne Katalogwerte.xml) — wir parsen die UTF-16-XMLs streamend.
# Details: memory project-pv-mastr.
#
#   public/pv_points.json   Freiflächenanlagen (ArtDerSolaranlage 852) mit
#                           Koordinaten — spaltenorientiert, Canvas-tauglich.
#   public/pv_kreise.json   Aggregation je Landkreis (AGS5): kumulierte GW &
#                           Anlagenzahl pro Jahr, für animierte Choropleth.
#   public/pv_summary.json  Nationale Jahresreihen für Dashboard/Analysen.
import io
import sys
import json
import gzip
import zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path
from xml.etree import ElementTree as ET

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace", line_buffering=True)

ZIP = Path.home() / ".open-MaStR" / "data" / "xml_download" / "Gesamtdatenexport_20260615.zip"
PUB = Path(__file__).resolve().parents[2] / "public"
SOURCE = "Marktstammdatenregister (MaStR), Bundesnetzagentur — Datenlizenz Deutschland dl-de/by-2-0"

# EinheitBetriebsstatus: 35 In Betrieb, 37 vorüb. stillgelegt (zählt als aktiv),
# 38 endgültig stillgelegt, 31 In Planung.
STATUS = {"35": 0, "37": 0, "38": 1, "31": 2}
FREIFLAECHE = "852"  # ArtDerSolaranlage — die großen Solarparks

START_YEAR = 1990
END_YEAR = date.today().year
SPAN = END_YEAR - START_YEAR + 1


def yi(year):
    return min(max(year - START_YEAR, 0), SPAN - 1)


# Punkte (nur Freifläche mit Koordinaten)
pts = {k: [] for k in ("lon", "lat", "year", "kw", "status", "endYear")}

# Kreis-Aggregation: AGS5 -> Deltas pro Jahr (alle Anlagentypen)
kreis_name = {}
kreis_dcount = defaultdict(lambda: [0] * SPAN)
kreis_dkw = defaultdict(lambda: [0.0] * SPAN)

# Nationale Jahresreihen
nat_new = [0] * SPAN
nat_dcount = [0] * SPAN
nat_dkw = [0.0] * SPAN

total = 0
z = zipfile.ZipFile(ZIP)
files = sorted(n for n in z.namelist() if n.startswith("EinheitenSolar"))
print(f"{len(files)} Dateien")

for fi, name in enumerate(files, 1):
    raw = z.read(name).decode("utf-16")
    ctx = ET.iterparse(io.StringIO(raw), events=("start", "end"))
    _, root = next(ctx)
    for ev, el in ctx:
        if ev != "end" or el.tag != "EinheitSolar":
            continue
        total += 1
        d = {c.tag: c.text for c in el}
        root.clear()

        status = STATUS.get(d.get("EinheitBetriebsstatus", ""))
        if status is None:
            continue
        ibn = d.get("Inbetriebnahmedatum") or d.get("GeplantesInbetriebnahmedatum")
        year = int(ibn[:4]) if ibn else 0
        if status != 2 and year == 0:
            continue
        try:
            kw = float(d.get("Bruttoleistung") or 0)
        except ValueError:
            kw = 0.0
        end = d.get("DatumEndgueltigeStilllegung")
        end_year = int(end[:4]) if end else 0

        # --- Punkte: Freiflächenanlagen mit Koordinaten, ohne Planung ---
        lon, lat = d.get("Laengengrad"), d.get("Breitengrad")
        if status != 2 and lon and lat and d.get("ArtDerSolaranlage") == FREIFLAECHE:
            pts["lon"].append(round(float(lon), 4))
            pts["lat"].append(round(float(lat), 4))
            pts["year"].append(year)
            pts["kw"].append(int(kw))
            pts["status"].append(status)
            pts["endYear"].append(end_year)

        # --- Kreis-Aggregation + nationale Reihen (ohne Planung) ---
        if status == 2:
            continue
        ags5 = (d.get("Gemeindeschluessel") or "")[:5]
        if year:
            nat_new[yi(year)] += 1
        a = yi(year)
        nat_dcount[a] += 1
        nat_dkw[a] += kw
        if end_year:
            e = yi(end_year)
            nat_dcount[e] -= 1
            nat_dkw[e] -= kw
        if len(ags5) == 5 and ags5.isdigit():
            if ags5 not in kreis_name and d.get("Landkreis"):
                kreis_name[ags5] = d["Landkreis"]
            kreis_dcount[ags5][a] += 1
            kreis_dkw[ags5][a] += kw
            if end_year:
                kreis_dcount[ags5][e] -= 1
                kreis_dkw[ags5][e] -= kw
    del raw, ctx, root
    print(f"  [{fi}/{len(files)}] {name}: {total:,} Einheiten, {len(pts['lon']):,} Freiflächen-Punkte")

years = list(range(START_YEAR, END_YEAR + 1))


def cumulate(deltas, to_gw=False):
    out, run = [], 0.0
    for v in deltas:
        run += v
        out.append(round(run / 1e6, 3) if to_gw else int(run))
    return out


# pv_points.json
points = {
    "generated": date.today().isoformat(),
    "source": SOURCE,
    "note": "Nur Freiflächenanlagen (ArtDerSolaranlage 852) mit Koordinaten. Dach-/Balkonanlagen siehe pv_kreise.json.",
    "statusCodes": {"0": "in Betrieb", "1": "endgültig stillgelegt"},
    "count": len(pts["lon"]),
    "units": pts,
}
(PUB / "pv_points.json").write_text(json.dumps(points, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")

# pv_kreise.json — kumulierte GW & Anzahl pro Jahr je Kreis
kreise = {}
for ags5 in sorted(kreis_dkw):
    kreise[ags5] = {
        "name": kreis_name.get(ags5, ags5),
        "cumGw": cumulate(kreis_dkw[ags5], to_gw=True),
        "cumCount": cumulate(kreis_dcount[ags5]),
    }
kreise_out = {
    "generated": date.today().isoformat(),
    "source": SOURCE,
    "years": years,
    "kreise": kreise,
}
(PUB / "pv_kreise.json").write_text(json.dumps(kreise_out, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")

# pv_summary.json — nationale Reihen
summary = {
    "generated": date.today().isoformat(),
    "source": SOURCE,
    "years": years,
    "newCount": nat_new,
    "cumCount": cumulate(nat_dcount),
    "cumGw": cumulate(nat_dkw, to_gw=True),
}
(PUB / "pv_summary.json").write_text(json.dumps(summary, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")

print("\n================ FERTIG ================")
for f in ("pv_points.json", "pv_kreise.json", "pv_summary.json"):
    p = PUB / f
    gz = len(gzip.compress(p.read_bytes()))
    print(f"  {f}: {p.stat().st_size/1e6:.2f} MB roh / {gz/1e6:.2f} MB gzip")
print(f"\nEinheiten gesamt: {total:,}")
print(f"Freiflächen-Punkte: {len(pts['lon']):,}")
print(f"Kreise: {len(kreise)}")
print(f"Kumulierte GW {END_YEAR}: {summary['cumGw'][-1]} (Anlagen {summary['cumCount'][-1]:,})")
