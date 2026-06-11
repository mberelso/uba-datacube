# Phase 1: Erzeugt public/wind_units.json aus der open-mastr SQLite-DB.
# Spaltenorientiertes Format (parallele Arrays) — deutlich kleiner als
# Objekt-Listen und direkt Canvas-tauglich.
#
# Voraussetzung: scripts/mastr/phase0_download.py wurde ausgeführt.
import sys
import io
import json
import sqlite3
from datetime import date
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

DB = Path.home() / ".open-MaStR" / "data" / "sqlite" / "open-mastr.db"
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

import gzip
gz = len(gzip.compress(OUT.read_bytes()))
print(f"{n} Einheiten geschrieben ({skipped} übersprungen)")
print(f"{OUT.name}: {OUT.stat().st_size / 1e6:.2f} MB roh, {gz / 1e6:.2f} MB gzip")

by_status = {s: cols["status"].count(c) for s, c in (("in Betrieb", 0), ("stillgelegt", 1), ("geplant", 2))}
print(f"Status: {by_status}")
print(f"Jahre: {min(y for y in cols['year'] if y)}–{max(cols['year'])}")
print(f"Offshore: {sum(cols['offshore'])}")
