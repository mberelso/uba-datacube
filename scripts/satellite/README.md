# NDVI-Prototyp — Phase 0 (Testregion: Landkreis Ebersberg)

Lokaler Prototyp für das Vegetationsgesundheits-Dashboard. Beweist an *einer*
Region, dass die Pipeline trägt, und deckt früh auf, ob Wolken oder Datenmenge
zum Problem werden — **bevor** irgendetwas live geht.

Siehe [../../docs/umweltpuls_projektskizze_copernicus.md](../../docs/umweltpuls_projektskizze_copernicus.md).

## Idee

Das schwere Processing (Cloud-Masking + NDVI + zeitliche Aggregation) läuft
serverseitig über **CDSE OpenEO** (kostenloser Tier mit Quota). Wir laden nur
kleine Ergebnisse herunter und verarbeiten sie lokal zu PNG + JSON. Kein
Download von Gigabyte-Tiles, keine Sentinel-Hub Processing Units.

## Einmalig: Setup

1. Kostenlosen Copernicus-Account anlegen: <https://dataspace.copernicus.eu>
2. venv ist bereits unter `../../.venv-sat/` angelegt. Falls neu:
   ```pwsh
   python -m venv ..\..\.venv-sat
   ..\..\.venv-sat\Scripts\python.exe -m pip install -r requirements.txt
   ```

## Lauf

```pwsh
# Schritt 1 — Daten holen (beim ersten Mal Browser-Login, OIDC Device Flow)
..\..\.venv-sat\Scripts\python.exe fetch_ndvi.py

# Schritt 2 — lokal verarbeiten zu PNGs (je Jahr) + Zeitreihe + Kennzahlen
..\..\.venv-sat\Scripts\python.exe process_ndvi.py

# Schritt 3 (optional) — Vorschau-Seite im Umweltpuls-Look bauen
..\..\.venv-sat\Scripts\python.exe generate_preview.py
```

Ergebnisse landen in `output/` (nicht eingecheckt).

## Was geholt wird

- **Monatliche Zeitreihe** (`aggregate_spatial`-Mittel über den Landkreis,
  `YEARS_BACK` Jahre) — wird nur geholt, wenn die Datei noch fehlt.
- **Ein Sommer-Komposit pro Jahr** (Mai–Sep-Median), alle Jahre als Bänder in
  EINEM Batch-Job. So lassen sich Jahre auf der Karte vergleichen.

### Erkenntnisse (wichtig für Phase 1)

- Schwere Komposite **müssen als `execute_batch()`** laufen — synchroner
  `.download()` läuft bei 10 m über die ganze Box in einen 30-Min-Timeout.
- `mask_polygon(REGION_GEOMETRY)` schneidet auf die echte Landkreis-Form zu;
  die Wolkenlücke wird **relativ zur Landkreisfläche** gemessen (sonst zählen
  die leeren Bounding-Box-Ecken fälschlich als Lücke).
- `sys.stdout.reconfigure(encoding="utf-8")` nötig, sonst crasht jeder `print`
  mit Pfeil/Umlaut auf der cp1252-Windows-Konsole.

## Phase-0-Erfolgskriterien (hieran messen)

- [ ] Cloud-Masking funktioniert, NDVI plausibel (Wald grün, Acker saisonal, Wasser raus)
- [ ] Klar, wie viele wolkenfreie Monate/Jahr realistisch sind → `process_ndvi.py` gibt das aus
- [ ] Datenmenge pro Region/Zeitschritt bekannt → R2-Kosten hochrechenbar
- [ ] Format steht: PNG-Tile für die Karte, JSON für Zeitreihen

## Konfiguration

Alles in [config.py](config.py): Zeitraum (`YEARS_BACK`), Sommer-Monate für die
Komposite, Wolken-Schwelle, SCL-Maskenklassen. Die Region kommt aus dem echten
Landkreis-Polygon `ebersberg.geojson` (Quelle: OSM Nominatim); die Bounding-Box
wird daraus abgeleitet.

## Dateien

| Datei | Zweck |
|---|---|
| `config.py` | gemeinsame Konfiguration, lädt das Region-Polygon |
| `ebersberg.geojson` | Landkreis-Grenze (OSM) |
| `fetch_ndvi.py` | OpenEO: Cloud-Masking + NDVI, lädt Zeitreihe (JSON) + Jahres-Komposite (mehrbändiges GeoTIFF) |
| `process_ndvi.py` | rendert PNG je Jahr, schreibt `periods_*.json` + Kennzahlen, räumt Zeitreihe auf |
| `generate_preview.py` | baut self-contained Vorschau-HTML im Umweltpuls-Look mit Jahres-Umschalter |
| `requirements.txt` | gepinnte Abhängigkeiten |
