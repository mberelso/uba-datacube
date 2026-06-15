# PV-Phase 0: Solar-Tabellen aus dem MaStR-Gesamtdatenexport in SQLite parsen.
# Achtung: ~4-5 Mio. Anlagen — Parse dauert deutlich länger als Wind.
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from open_mastr import Mastr

db = Mastr()
print(f"SQLite: {db.engine.url}")
db.download(data="solar")
print("FERTIG")
