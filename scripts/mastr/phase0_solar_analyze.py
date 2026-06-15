# PV-Phase 0: Direktanalyse der EinheitenSolar-XMLs aus dem Gesamtdatenexport.
#
# Hintergrund: Der Solar-Export (20260615) enthaelt KEINE Katalogwerte.xml,
# weshalb open-mastr 0.17.1 solar_extended nicht befuellt. Fuer die
# Datenqualitaets-Bewertung parsen wir die XMLs streamend selbst (UTF-16).
#
# Codes (aus MaStR-Katalog, stabil): EinheitBetriebsstatus 35=In Betrieb,
# 31=In Planung, 37=Voruebergehend stillgelegt, 38=Endgueltig stillgelegt.
# Lage 853=Freiflaeche, 852=Bauliche Anlagen (Dach/Fassade).
import io
import sys
import zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace", line_buffering=True)

ZIP = Path.home() / ".open-MaStR" / "data" / "xml_download" / "Gesamtdatenexport_20260615.zip"
FIELDS = ("Laengengrad", "Breitengrad", "Bruttoleistung", "Inbetriebnahmedatum",
          "EinheitBetriebsstatus", "Lage", "Bundesland")

STATUS = {"35": "In Betrieb", "31": "In Planung", "37": "Vorüb. stillgelegt", "38": "Endg. stillgelegt"}
LAGE = {"853": "Freifläche", "852": "Bauliche Anlage (Dach/Fassade)"}

total = 0
has_coord = 0
coord_by_lage = Counter()
n_by_lage = Counter()
status_c = Counter()
lage_c = Counter()
year_c = Counter()
year_coord = Counter()
power_sum_kw = 0.0
power_coord_kw = 0.0
big_with_coord = 0  # >=750 kW (etwa Freiflaechen-Groesse) mit Koordinaten

z = zipfile.ZipFile(ZIP)
solar_files = sorted(n for n in z.namelist() if n.startswith("EinheitenSolar"))
print(f"{len(solar_files)} EinheitenSolar-Dateien")

for fi, name in enumerate(solar_files, 1):
    with z.open(name) as f:
        raw = f.read().decode("utf-16")
    ctx = ET.iterparse(io.StringIO(raw), events=("start", "end"))
    _, root = next(ctx)  # <EinheitenSolar> Root festhalten zum Leeren
    for ev, el in ctx:
        if ev != "end" or el.tag != "EinheitSolar":
            continue
        total += 1
        d = {c.tag: c.text for c in el}
        lon, lat = d.get("Laengengrad"), d.get("Breitengrad")
        coord = bool(lon and lat)
        status = STATUS.get(d.get("EinheitBetriebsstatus", ""), "?")
        lage = LAGE.get(d.get("Lage", ""), d.get("Lage") or "?")
        status_c[status] += 1
        lage_c[lage] += 1
        n_by_lage[lage] += 1
        kw = 0.0
        try:
            kw = float(d.get("Bruttoleistung") or 0)
        except ValueError:
            pass
        power_sum_kw += kw
        ibn = d.get("Inbetriebnahmedatum")
        yr = int(ibn[:4]) if ibn else 0
        if yr:
            year_c[yr] += 1
        if coord:
            has_coord += 1
            coord_by_lage[lage] += 1
            power_coord_kw += kw
            if yr:
                year_coord[yr] += 1
            if kw >= 750:
                big_with_coord += 1
        root.clear()  # verarbeitete Elemente freigeben — sonst waechst der Root unbegrenzt
    del raw, ctx, root
    print(f"  [{fi}/{len(solar_files)}] {name}: kumuliert {total:,} Einheiten, {has_coord:,} mit Koord.")

print("\n================ PV-PHASE-0-REPORT ================")
print(f"Einheiten gesamt:           {total:,}")
print(f"Mit Koordinaten:            {has_coord:,} ({has_coord/total*100:.1f} %)")
print(f"Bruttoleistung gesamt:      {power_sum_kw/1e6:.2f} GW")
print(f"Leistung mit Koordinaten:   {power_coord_kw/1e6:.2f} GW ({power_coord_kw/power_sum_kw*100:.1f} %)")
print(f"Anlagen >=750 kW mit Koord.: {big_with_coord:,}")

print("\nStatus:")
for k, v in status_c.most_common():
    print(f"  {k:<22} {v:>10,}")

print("\nLage (Dach vs. Freifläche):")
for k, v in lage_c.most_common():
    cc = coord_by_lage.get(k, 0)
    print(f"  {k:<32} {v:>10,}  davon mit Koord. {cc:,} ({cc/v*100:.1f} %)")

print("\nZubau pro Jahr (alle / mit Koordinaten):")
for y in sorted(year_c):
    if y >= 2000:
        print(f"  {y}: {year_c[y]:>9,}  /  {year_coord.get(y,0):>9,}")
