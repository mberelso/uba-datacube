# Phase 1: Erzeugt public/wind_units.json aus der open-mastr SQLite-DB.
# Spaltenorientiertes Format (parallele Arrays) — deutlich kleiner als
# Objekt-Listen und direkt Canvas-tauglich.
#
# Voraussetzung: scripts/mastr/phase0_download.py wurde ausgeführt.
import os
import sys
import io
import json
import sqlite3
from datetime import date
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

DB_PATH = os.environ.get("MASTR_DB_PATH")
DB = Path(DB_PATH) if DB_PATH else Path.home() / ".open-MaStR" / "data" / "sqlite" / "open-mastr.db"
OUT = Path(__file__).resolve().parents[2] / "public" / "wind_units.json"

STATUS = {"In Betrieb": 0, "Vorübergehend stillgelegt": 0, "Endgültig stillgelegt": 1, "In Planung": 2}

con = sqlite3.connect(DB)
rows = con.execute("""
    SELECT Laengengrad, Breitengrad, Inbetriebnahmedatum, GeplantesInbetriebnahmedatum,
           Bruttoleistung, EinheitBetriebsstatus, DatumEndgueltigeStilllegung, Seelage
    FROM wind_extended
    WHERE Laengengrad IS NOT NULL AND Breitengrad IS NOT NULL
      AND Laengengrad BETWEEN 5.5 AND 15.5 AND Breitengrad BETWEEN 47 AND 56
""").fetchall()
con.close()

cols = {k: [] for k in ("lon", "lat", "year", "kw", "status", "endYear", "offshore")}
skipped = 0

for lon, lat, ibn, ibn_plan, kw, status_txt, still, seelage in rows:
    status = STATUS.get(status_txt)
    if status is None:
        skipped += 1
        continue
    year = int(ibn[:4]) if ibn else (int(ibn_plan[:4]) if ibn_plan else 0)
    if status != 2 and year == 0:
        # Bestandsanlage ohne Datum — für die Zeitanimation unbrauchbar
        skipped += 1
        continue
    cols["lon"].append(round(lon, 4))
    cols["lat"].append(round(lat, 4))
    cols["year"].append(year)
    cols["kw"].append(int(kw or 0))
    cols["status"].append(status)
    cols["endYear"].append(int(still[:4]) if still else 0)
    cols["offshore"].append(1 if seelage else 0)

n = len(cols["lon"])
out = {
    "generated": date.today().isoformat(),
    "source": "Marktstammdatenregister (MaStR), Bundesnetzagentur — Datenlizenz Deutschland dl-de/by-2-0",
    "statusCodes": {"0": "in Betrieb", "1": "endgültig stillgelegt", "2": "in Planung"},
    "count": n,
    "units": cols,
}

OUT.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")

# Kompakte Jahres-Summary für Dashboard-Teaser und Analysen-Chart
SUMMARY_OUT = OUT.parent / "wind_summary.json"
start_year = 1990
end_year = date.today().year
span = end_year - start_year + 1
new_count = [0] * span
delta_count = [0] * span
delta_mw = [0.0] * span
for i in range(n):
    if cols["status"][i] == 2 or cols["year"][i] == 0:
        continue
    a = min(max(cols["year"][i] - start_year, 0), span - 1)
    yi = cols["year"][i] - start_year
    if 0 <= yi < span:
        new_count[yi] += 1
    delta_count[a] += 1
    delta_mw[a] += cols["kw"][i] / 1000
    if cols["endYear"][i] > 0:
        e = min(max(cols["endYear"][i] - start_year, 0), span - 1)
        delta_count[e] -= 1
        delta_mw[e] -= cols["kw"][i] / 1000

cum_count, cum_gw = [], []
c, m = 0, 0.0
for i in range(span):
    c += delta_count[i]
    m += delta_mw[i]
    cum_count.append(c)
    cum_gw.append(round(m / 1000, 2))

summary = {
    "generated": date.today().isoformat(),
    "source": out["source"],
    "years": list(range(start_year, end_year + 1)),
    "newCount": new_count,
    "cumCount": cum_count,
    "cumGw": cum_gw,
}
SUMMARY_OUT.write_text(json.dumps(summary, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
print(f"{SUMMARY_OUT.name}: {SUMMARY_OUT.stat().st_size / 1e3:.1f} kB")

import gzip
gz = len(gzip.compress(OUT.read_bytes()))
print(f"{n} Einheiten geschrieben ({skipped} übersprungen)")
print(f"{OUT.name}: {OUT.stat().st_size / 1e6:.2f} MB roh, {gz / 1e6:.2f} MB gzip")

by_status = {s: cols["status"].count(c) for s, c in (("in Betrieb", 0), ("stillgelegt", 1), ("geplant", 2))}
print(f"Status: {by_status}")
print(f"Jahre: {min(y for y in cols['year'] if y)}–{max(cols['year'])}")
print(f"Offshore: {sum(cols['offshore'])}")
