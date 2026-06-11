# Phase 0: MaStR-Gesamtdatenexport laden und Wind-Tabellen in SQLite parsen.
# Download ist ~4 GB gezippt — Laufzeit je nach Leitung 10-30 Minuten.
import sys
import io

# Windows-Konsole liefert sonst UnicodeEncodeError bei Fortschrittsausgaben
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from open_mastr import Mastr

db = Mastr()
print(f"SQLite: {db.engine.url}")
db.download(data="wind")
print("FERTIG")
