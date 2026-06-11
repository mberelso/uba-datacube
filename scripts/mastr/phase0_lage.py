# Phase 0 Nachprüfung: Lage-Codes (Onshore/Offshore) und Bundesland-Verteilung
import sys
import io
import sqlite3
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
con = sqlite3.connect(Path.home() / ".open-MaStR" / "data" / "sqlite" / "open-mastr.db")

print("Lage-Werte (Wert, Anzahl, davon ohne Bundesland):")
for r in con.execute("SELECT Lage, COUNT(*), SUM(Bundesland IS NULL) FROM wind_extended GROUP BY Lage"):
    print(" ", r)

print("\nBundesland Top 8:")
for r in con.execute("SELECT Bundesland, COUNT(*) FROM wind_extended GROUP BY Bundesland ORDER BY 2 DESC LIMIT 8"):
    print(" ", r)

print("\nSeelage-Werte:")
for r in con.execute("SELECT Seelage, COUNT(*) FROM wind_extended GROUP BY Seelage"):
    print(" ", r)
