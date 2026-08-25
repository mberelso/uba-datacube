# MaStR Data Pipeline Runbook

Dieses Runbook beschreibt die Ausführung der Datenaufbereitung für die Windkraft- und Solar-Karten aus dem Marktstammdatenregister (MaStR) der Bundesnetzagentur.

## 1. Voraussetzungen

- Python 3.10+
- ca. 10 GB freier Festplattenspeicher
- Internetverbindung für den ca. 4 GB großen MaStR-Gesamtexport

```bash
pip install -r scripts/mastr/requirements.txt
```

## 2. Ausführungsschritte

### Schritt 1: MaStR-Export herunterladen
```bash
python scripts/mastr/phase0_download.py
```
*Dauer: ca. 15–30 Minuten je nach Bandbreite.*
Lädt den neuesten Gesamtdatenexport der Bundesnetzagentur nach `~/.open-MaStR/data/xml_download/` herunter.

### Schritt 2: Wind-Daten generieren
```bash
python scripts/mastr/build_wind_json.py
```
Erzeugt:
- `public/wind_units.json` (Karte)
- `public/wind_summary.json` (Dashboard/Analysen)

Optionale Umgebungsvariable: `MASTR_DB_PATH=/pfad/zur/open-mastr.db`

### Schritt 3: Photovoltaik-Daten generieren
```bash
python scripts/mastr/build_pv_json.py
```
Erzeugt:
- `public/pv_points.json` (Freiflächen-Solarparks)
- `public/pv_kreise.json` (Kreis-Aggregation)
- `public/pv_summary.json` (Jahresreihen)

Optionale Umgebungsvariable: `MASTR_XML_DIR=/pfad/zu/xml_download`

## 3. Stolpersteine & Hinweise

- **UTF-16 XMLs:** Der Solar-Parser liest UTF-16 XMLs direkt streamend, da `open-mastr 0.17.1` das Feld `solar_extended` nicht befüllt.
- **Veraltete Kreisschlüssel:** Veraltete Schlüssel (z. B. Göttingen-Reform 03152/03156) werden automatisch auf aktuelle AGS5 gemappt (`AGS_REMAP`).
