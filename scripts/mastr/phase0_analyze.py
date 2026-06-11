# Phase 0: Datenqualität der Wind-Einheiten prüfen.
# Beantwortet: Reichen Koordinaten + Inbetriebnahmedaten für die animierte Karte?
import sys
import io
import sqlite3
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

DB = Path.home() / ".open-MaStR" / "data" / "sqlite" / "open-mastr.db"
con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row


def q(sql: str):
    return con.execute(sql).fetchall()


tables = [r[0] for r in q("SELECT name FROM sqlite_master WHERE type='table'")]
print(f"Tabellen: {tables}\n")

T = "wind_extended"
cols = [r[1] for r in q(f"PRAGMA table_info({T})")]
print(f"{T}: {len(cols)} Spalten")
print([c for c in cols if any(k in c.lower() for k in (
    "laengengrad", "breitengrad", "inbetriebnahme", "leistung", "status",
    "stilllegung", "nabenhoehe", "rotor", "bundesland", "lage", "hersteller"))])
print()

total = q(f"SELECT COUNT(*) c FROM {T}")[0]["c"]
print(f"Einheiten gesamt: {total}")

for label, cond in [
    ("mit Koordinaten", "Laengengrad IS NOT NULL AND Breitengrad IS NOT NULL"),
    ("mit Inbetriebnahmedatum", "Inbetriebnahmedatum IS NOT NULL"),
    ("mit Bruttoleistung", "Bruttoleistung IS NOT NULL"),
    ("Onshore (Lage = Windkraft an Land)", "Lage LIKE '%Land%'"),
    ("Offshore", "Lage LIKE '%See%'"),
    ("in Betrieb", "EinheitBetriebsstatus LIKE '%In Betrieb%'"),
    ("endgültig stillgelegt", "EinheitBetriebsstatus LIKE '%stillgelegt%'"),
    ("in Planung", "EinheitBetriebsstatus LIKE '%Planung%'"),
]:
    c = q(f"SELECT COUNT(*) c FROM {T} WHERE {cond}")[0]["c"]
    print(f"  {label}: {c} ({100 * c / total:.1f} %)")

print("\nBetriebsstatus-Werte:")
for r in q(f"SELECT EinheitBetriebsstatus s, COUNT(*) c FROM {T} GROUP BY s ORDER BY c DESC"):
    print(f"  {r['s']}: {r['c']}")

print("\nKoordinaten-Abdeckung nach Inbetriebnahme-Dekade (nur in Betrieb):")
for r in q(f"""
    SELECT substr(Inbetriebnahmedatum, 1, 3) || '0er' dekade,
           COUNT(*) c,
           SUM(CASE WHEN Laengengrad IS NOT NULL THEN 1 ELSE 0 END) mit_koord
    FROM {T}
    WHERE Inbetriebnahmedatum IS NOT NULL AND EinheitBetriebsstatus LIKE '%In Betrieb%'
    GROUP BY dekade ORDER BY dekade
"""):
    print(f"  {r['dekade']}: {r['c']} Anlagen, Koordinaten: {100 * r['mit_koord'] / r['c']:.1f} %")

print("\nZubau pro Jahr (in Betrieb, ab 1990):")
for r in q(f"""
    SELECT substr(Inbetriebnahmedatum, 1, 4) jahr, COUNT(*) c,
           ROUND(SUM(Bruttoleistung) / 1000.0, 2) gw
    FROM {T}
    WHERE Inbetriebnahmedatum >= '1990' AND EinheitBetriebsstatus LIKE '%In Betrieb%'
    GROUP BY jahr ORDER BY jahr
"""):
    print(f"  {r['jahr']}: {r['c']:>5} Anlagen, {r['gw']:>8} GW kumulierbar")

print("\nPlausibilität Koordinaten (Bounding Box Deutschland 5.5-15.5 / 47-56):")
bad = q(f"""
    SELECT COUNT(*) c FROM {T}
    WHERE Laengengrad IS NOT NULL
      AND (Laengengrad < 5.5 OR Laengengrad > 15.5 OR Breitengrad < 47 OR Breitengrad > 56)
""")[0]["c"]
print(f"  außerhalb der Box: {bad}")

con.close()
