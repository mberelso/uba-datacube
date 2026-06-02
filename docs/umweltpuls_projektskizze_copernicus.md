# Projektskizze: Copernicus-Dashboards für umweltpuls.de

**Stand:** Juni 2026  
**Projektstand:** Website live auf GitHub Pages, UBA Datacube bereits integriert  
**Nächster Schritt:** Copernicus Satellitendaten einbinden — **zunächst lokaler Prototyp, ausgiebig getestet, bevor irgendetwas live geht**  
**Budget:** < 20 €/Monat · **Stack:** Statische Site, GitHub Actions, Cloudflare R2

> **Arbeitsweise:** Wie schon bei der UBA-API gilt — erst lokal in Python simulieren und validieren, dann implementieren. Jede Phase startet als kleiner Prototyp für *eine* Testregion, nicht als Deutschlandkarte. Erst wenn Datenqualität, Wolken und Datenmenge im Griff sind, geht es ins Frontend und in die Cloud.

---

## Aktueller Stand

umweltpuls.de ist bereits live und hat zwei funktionierende Dashboards auf Basis des UBA Datacube:

| Dashboard | Datenquelle | Status |
|---|---|---|
| Luftqualität | UBA Datacube | ✅ Live |
| Dürre / Bodenfeuchte | UBA Datacube | ✅ Live |

Die technische Infrastruktur (GitHub Pages, statische Site) ist etabliert und bildet die Basis für alle weiteren Ausbaustufen.

---

## Strategie: Kein Sentinel Hub Processing

Sentinel Hub Processing Units sind für ein Budget von < 20 €/Monat nicht skalierbar. Stattdessen: **Rohdaten kostenlos herunterladen, lokal verarbeiten, fertige Tiles statisch hosten.**

| Schritt | Tool | Kosten |
|---|---|---|
| Daten herunterladen | Copernicus OData/STAC API | kostenlos |
| Verarbeitung (NDVI, Chlorophyll etc.) | Python (rasterio, GDAL) via GitHub Action | kostenlos |
| Tile-Hosting | Cloudflare R2 | ~0–2 €/Monat |
| Kartendarstellung | Leaflet.js (bereits im Stack) | kostenlos |

---

## Phase 0 — Lokaler NDVI-Prototyp (Testregion) · 0 €

**Bevor irgendetwas live geht.** Ziel: an *einer* Region beweisen, dass die Pipeline trägt — und früh aufdecken, ob Wolken oder Datenmenge zum Problem werden.

### Umfang
- **Eine Testregion:** ein Landkreis (z. B. Ebersberg oder Bodensee-Umland), nicht Deutschland.
- Python-Script lokal: Sentinel-2-Szene über Copernicus OData/STAC ziehen → **Cloud-Masking** (Scene Classification Layer) → NDVI berechnen → als PNG + Zeitreihen-JSON ablegen.
- Mehrere Szenen über ein paar Monate durchrechnen, um zu sehen, wie oft Deutschland wolkenfrei ist und wie groß die Datenmenge real wird.

### Erfolgskriterien (erst danach Phase 1)
- [ ] Cloud-Masking funktioniert, NDVI ist plausibel (Wald grün, Acker saisonal, Wasser raus)
- [ ] Klar, wie viele nutzbare (wolkenfreie) Szenen pro Monat realistisch sind
- [ ] Datenmenge pro Region/Zeitschritt bekannt → R2-Kosten hochrechenbar
- [ ] Format steht: **PNG-Tiles für die Kartenansicht, vorberechnetes JSON pro Landkreis für Zeitreihen** (kein Tile-Overhead für Charts)

---

## Phase 1 — Vegetationsgesundheit (Monat 1–2) · ~2 €/Monat

**Voraussetzungen:** Phase 0 erfolgreich, Copernicus-Account (kostenlos), GitHub Action einrichten

### Was es zeigt
NDVI-Karte für Deutschland — Gesundheitszustand von Wäldern und Feldern, wöchentlich aktualisiert. Klick auf Landkreis zeigt Zeitreihe der letzten 5 Jahre.

### Warum zuerst
Ergänzt das bestehende Dürre-Dashboard perfekt: Dürre (UBA) zeigt die Ursache, Vegetation (Copernicus) zeigt die Folge. Ihr baut kein isoliertes Feature, sondern erweitert eine Story, die schon live ist — der inhaltlich anschlussfähigste Einstieg.

### Datenquelle
- **Satellit:** Sentinel-2 (10 m Auflösung, alle 5 Tage)
- **Verarbeitung:** Cloud-Masking → NDVI = (NIR − Rot) / (NIR + Rot), lokal per Python
- **Update:** Jeden Montag via GitHub Action → PNG-Tiles (Karte) + JSON (Zeitreihen) → Cloudflare R2

### Features
- Deutschlandkarte mit Farbskala (rot = gestresst, dunkelgrün = gesund)
- Landkreis anklicken → Zeitreihen-Diagramm (5 Jahre, Monatsauflösung)
- Vergleich: aktueller Wert vs. Fünfjahresmittel
- Saisonale Normierung (kein unfairer Winter/Sommer-Vergleich)
- **Ehrliche Datenangabe im Frontend:** „Daten vom TT.MM., Bewölkung X %" — keine kaschierten veralteten Szenen

### Aufwand
- Python-Script + GitHub Action: ca. 2–3 Wochen (Prototyp aus Phase 0 vorhanden)
- Frontend-Integration (Leaflet, bereits vorhanden): ca. 1 Woche

---

## Phase 2 — Gewässer-Monitor (Monat 3–4) · ~2–5 €/Monat

**Vorgezogen** gegenüber dem Hitzeinsel-Monitor — stärkster direkter Nutzerbezug: „Kann ich da baden?"

### Was es zeigt
Wasserqualität deutscher Seen: Algenblüten, Wassertrübung, Chlorophyll-Konzentration — konkreter Alltagsnutzen für Nutzer.

### Datenquelle
- **Satellit:** Sentinel-2 (Chlorophyll-a Index, NDWI)
- **Gewässer:** zunächst 1–2 als Prototyp (z. B. Bodensee), dann ausbauen (Müritz, Chiemsee, Oder, Elbe, Rhein)
- **Update:** alle 5 Tage, lokal verarbeitet, gecacht — gleiche Pipeline wie Phase 1

### Features
- Gewässer anklicken → aktuelle Satellitenansicht
- Ampelsystem: grün / gelb / rot (Algenalarm)
- Zeitreihe Mai–Oktober (Badesaison)
- Verknüpfung mit offiziellen Badegewässer-Daten (EEA)

### Aufwand
- Script + Validierung: ca. 3–4 Wochen (Gewässer-Auswahl zeitintensiv)

---

## Phase 3 — Hitzeinsel-Monitor (Monat 5–6) · ~0 €/Monat

**Nur starten, wenn die offenen Fragen geklärt sind** (siehe „Risiken & offene Fragen").

### Was es zeigt
Oberflächentemperaturen der größten deutschen Städte im **Stadt-zu-Stadt-Vergleich**.

> ⚠️ **Auflösungs-Realität:** Sentinel-3 LST liegt bei ~1 km. Das reicht für ein Stadt-Ranking, **nicht** für eine Intrastadt-Heatmap (Parks vs. Gewerbe) — eine Stadt = nur wenige Pixel. Die ursprünglich geplante Intrastadt-Aussage entweder streichen oder auf Sentinel-2/Landsat-Thermal umstellen (= eigenes Processing, nicht mehr „kostenlos per WMS").

### Datenquelle
- **Satellit:** Sentinel-3 LST (~1 km) via OGC WMS
- **Update:** täglich gestreamt — ⚠️ Abhängigkeit von Copernicus-WMS-Verfügbarkeit (Endpunkte sind in der Vergangenheit umgezogen/abgekündigt worden). Für ein Dauer-Dashboard riskant — ggf. doch eigenes Aggregat hosten.
- **Zeitreihen:** Monatliche Aggregation via GitHub Action (vorberechnet)

### Features
- Ranking: welche Stadt ist gerade am heißesten?
- „Heute vs. vor 10 Jahren"-Slider
- Sommer-Alert bei Extremwerten (> 40 °C Oberfläche)

### Aufwand
- WMS-Integration: ca. 1 Woche
- Ranking + Charts: ca. 1–2 Wochen

---

## Phase 4 — KI-Anomalie-Alerts (Monat 7–8) · ~5–10 €/Monat

**Setzt die historische Datenbasis aus Phase 1 voraus** — „20 % unter Vorjahresmittel" ist erst belastbar, wenn mindestens eine volle Saison NDVI gesammelt wurde.

**Der redaktionelle Hebel:** KI erkennt Auffälligkeiten in den Satellitendaten und schreibt automatisch einen Textentwurf.

### Ablauf
1. GitHub Action verarbeitet wöchentlich neue Satellitendaten
2. Wenn NDVI einer Region > 20% unter Vorjahresmittel: Alert ausgelöst
3. Claude API generiert automatisch einen kurzen Nachrichtentext mit Kontext
4. Du bekommst eine E-Mail, prüfst, veröffentlichst mit einem Klick

### Beispiel-Output
> *"Im Landkreis Ebersberg liegt der Vegetationsindex aktuell 34% unter dem Fünfjahresmittel — ähnliche Werte wurden zuletzt im Dürrejahr 2022 gemessen. Betroffen sind vor allem Fichtenbestände im nördlichen Kreisgebiet."*

### Kosten
- Claude API bei ~10–20 Alerts/Monat: ca. 3–8 €/Monat
- Kein zusätzlicher Server nötig (GitHub Action)

---

## Ereignis-Modul: Satelliten-Belege bei Umweltereignissen

Ergänzend zu den Dauerdashboards — ereignisgetrieben, nicht täglich:

Bei Hochwasser, Waldbrand oder Algenalarm wird innerhalb von 24–48 Stunden ein visueller Bericht mit Sentinel-Bildern veröffentlicht. Ablauf: Sentinel Hub Browser (kostenlos) → passende Szene finden → Before/After-Slider im Artikel einbetten.

**Mehrwert:** Während andere über Ereignisse berichten, zeigt umweltpuls.de sie aus dem Weltraum.

---

## Gesamtübersicht & Roadmap

| Phase | Dashboard | Monat | Kosten/Monat | Status |
|---|---|---|---|---|
| — | Luftqualität (UBA) | — | 0 € | ✅ Live |
| — | Dürre / Bodenfeuchte (UBA) | — | 0 € | ✅ Live |
| 0 | NDVI-Prototyp lokal (eine Testregion) | 0 | 0 € | 🔜 Nächster Schritt |
| 1 | Vegetationsgesundheit (Sentinel-2) | 1–2 | ~2 € | Geplant |
| 2 | Gewässer-Monitor (Sentinel-2) | 3–4 | ~2–5 € | Geplant |
| 3 | Hitzeinsel-Monitor (Sentinel-3 WMS) | 5–6 | ~0 € | Geplant (Fragen klären) |
| 4 | KI-Anomalie-Alerts (Claude API) | 7–8 | ~5–10 € | Geplant |

**Gesamtkosten bei vollem Ausbau: 10–17 €/Monat** — im Budget.

---

## Risiken & offene technische Fragen

| Thema | Problem | Wie wir es angehen |
|---|---|---|
| **Wolken** | Optische Satelliten (Sentinel-2) sind über Deutschland oft wolkenverhangen. „Wöchentlich" wird real schnell „letzte wolkenfreie Szene von vor 12 Tagen". | Cloud-Masking (Scene Classification Layer) ist Pflicht, kein Nice-to-have. Frontend zeigt Aufnahmedatum + Bewölkung ehrlich an. In Phase 0 quantifizieren, wie viele nutzbare Szenen/Monat realistisch sind. |
| **Datenmenge / R2-Kosten** | Tiles für ganz Deutschland × 5 Jahre × Zeitreihen können R2 aus dem Budget treiben. | Aufteilen: PNG-Tiles nur für aktuelle Kartenansicht, Zeitreihen als kleines vorberechnetes JSON pro Landkreis. In Phase 0 reale Größe messen. |
| **Hitzeinsel-Auflösung** | Sentinel-3 LST (~1 km) trägt keine Intrastadt-Aussage. | Phase 3 auf Stadt-Ranking reduzieren oder auf höher aufgelöste Thermaldaten umstellen (= eigenes Processing). |
| **WMS-Abhängigkeit** | Copernicus-WMS-Endpunkte sind in der Vergangenheit umgezogen/abgekündigt worden. | Für Dauer-Dashboard nicht blind auf Live-Streaming verlassen — ggf. eigenes Monats-Aggregat hosten. |
| **KI-Datenbasis** | Anomalie-Erkennung braucht Historie. | Phase 4 erst nach ≥ 1 voller Saison Phase-1-Daten. Mensch bleibt im Loop (kein Auto-Publish). |

---

## Technischer Gesamtstack

| Schicht | Technologie |
|---|---|
| Hosting | GitHub Pages (bereits live) |
| Umweltdaten | UBA Datacube (bereits integriert) |
| Satellitendaten | Copernicus OData/STAC API (kostenlos) |
| Bildverarbeitung | Python · rasterio · GDAL · GitHub Action |
| Tile-Hosting | Cloudflare R2 |
| Kartendarstellung | Leaflet.js |
| Charts & Zeitreihen | Recharts / D3.js |
| KI-Alerts | Claude API (anthropic) |

---

## Nächste Schritte — Phase 0 zuerst, alles lokal

- [ ] Copernicus-Account anlegen (kostenlos — dataspace.copernicus.eu)
- [ ] Testregion festlegen (ein Landkreis / ein See)
- [ ] Python-Script **lokal**: Sentinel-2-Szene ziehen → Cloud-Masking → NDVI → PNG + Zeitreihen-JSON
- [ ] Mehrere Szenen über ein paar Monate durchrechnen → Wolken-Häufigkeit & Datenmenge messen
- [ ] Ausgiebig testen & Plausibilität prüfen, bis die Erfolgskriterien aus Phase 0 erfüllt sind

**Erst danach** (Phase 1): GitHub Action (Cron), R2-Bucket, Leaflet-Integration auf umweltpuls.de.

---

*Rohdaten des Copernicus-Programms sind Open Data (Registrierung erforderlich). Durch lokale Verarbeitung statt Sentinel Hub Processing Units bleiben die Kosten dauerhaft unter 20 €/Monat.*
