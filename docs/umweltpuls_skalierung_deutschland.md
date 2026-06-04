# Planung: Vegetationsdaten über ganz Deutschland — günstig skalieren + Event-Hochauflösung

**Stand:** Juni 2026
**Ausgangslage:** NDVI-Prototyp läuft für *einen* Landkreis (Ebersberg), als echte
React-Seite `/vegetation` integriert (siehe `scripts/satellite/`,
`src/pages/VegetationPage.tsx`). Ein Landkreis bei 10 m Auflösung dauert aber
schon ~10–25 Min pro Batch-Job.

**Ziel:** ganz Deutschland abdecken, ohne Budget (< 20 €/Mt) und ohne ewige
Laufzeiten — **plus** ein „Auf-Zuruf"-Modus für aktuelle Hochauflösung bei
Ereignissen (z. B. Waldbrand), und ein Konzept, wie sich die grobe Dauerschicht
und der scharfe Ausschnitt **verschmelzen** lassen.

---

## 1 — Warum „dasselbe, nur größer" scheitert

Deutschland ist ~650× größer als der Landkreis Ebersberg (357.000 km² vs. 550 km²).

| | 10 m (nativ) | 100 m | 150 m |
|---|---|---|---|
| Pixel für ganz DE / Zeitschritt | ~3,6 Mrd. | ~36 Mio. | ~16 Mio. |
| sinnvoll als ein PNG? | nein | grenzwertig | ja (→ Web ~2000 px) |

Kernfehler des naiven Ansatzes: Wir rechnen 10 m, obwohl die Web-Karte ohnehin
auf ~1000 px runterskaliert — **99 % der Auflösung werfen wir sofort weg.**
Außerdem hieße „pro Landkreis ein Raster" = **401 Jobs**.

> ⚠️ **Erkenntnis aus dem Proof (Juni 2026):** Ein **großflächiges Raster** (ganz
> DE als Bild) ist auf dem OpenEO-Free-Tier praktisch nicht erzeugbar — zwei
> Versuche (400 m und 1000 m) liefen je **>2 h ohne Ergebnis und wurden abgebrochen**.
> Die Ausgabe-Auflösung ist dabei **egal**; teuer ist der Raster-Ausgabe-Pfad
> selbst (großflächig mosaikieren + reprojizieren + schreiben). Zum Vergleich,
> jeweils gleicher Input (DE, 1 Monat, 10 m Szenen):
>
> | Job | Fläche | Ausgabe | Dauer |
> |---|---|---|---|
> | `aggregate_spatial` (Choropleth) | ganz DE | 16 Zahlen | ~8 Min ✅ |
> | Raster-Komposit | Landkreis Ebersberg | Bild | ~9–26 Min ✅ |
> | Raster-Komposit | **ganz DE** | Bild | **>2 h ❌** |
>
> **Folgerung:** Raster nur für **kleine** Flächen (Landkreis/Event), Aggregation
> für die **große** Fläche. Das „Satellitenbild durch ganz Deutschland
> durchscheinen lassen" ist genau die nicht-machbare Kombination und wurde
> verworfen. Das „Durchscheinen" gehört an die Detail-/Event-Ebene (kleine AOIs),
> wo Raster billig sind.

---

## 2 — Die zwei Schichten

Die Lösung ist nicht eine Karte, sondern **zwei Schichten mit unterschiedlichem Zweck**:

### Schicht A — Dauer-Basis (ganz Deutschland, grob, immer da)

- **Darstellung: Choropleth.** Nicht 401 Raster, sondern die **Landkreise
  eingefärbt** nach ihrem NDVI-Wert. Die App hat dafür schon alles: `d3-geo` +
  `GermanyMap`-Komponente + Vektor-GeoJSON (`bundeslaender.geo.json`).
- **Erzeugung: EIN Job.** `aggregate_spatial` über alle Landkreis-Polygone
  gleichzeitig → **ein NDVI-Wert je Kreis je Monat** als kompakte Tabelle.
  Keine Pixel, nur Zahlen (~200 KB JSON für 401 Kreise × 60 Monate).
- **Vorher `resample_spatial(100 m)`** — für einen Regionsmittelwert ist 100 m
  mehr als genau und spart ~100× Rechenlast (sonst aggregiert der Server
  Milliarden 10-m-Pixel je Zeitschritt).
- **Optional:** zusätzlich EIN grobes Deutschland-Komposit (~150 m) als
  Hintergrund-Textur (ein PNG, klein).

### Schicht B — Event / „Auf Zuruf" (kleiner Ausschnitt, scharf, aktuell)

- Bei einem Ereignis (Waldbrand, Hochwasser, Dürreschaden) wird für ein
  **kleines AOI** (Area of Interest, Bounding-Box/Polygon) ein **10-m-Komposit
  der neuesten wolkenfreien Szene** erzeugt — wie unser Ebersberg-Bild, aber für
  einen Ausschnitt und einen Zeitpunkt → schnell (Minuten), weil klein.
- Typisch als **Vorher/Nachher-Paar** (zwei Zeitpunkte des gleichen AOI).
- Auslöser: manuell (bbox + Datum angeben) **oder** automatisiert über den
  Anomalie-Alert (Phase 4 der Hauptskizze liefert dann das AOI).

---

## 3 — Wie die beiden „verschmelzen"

Drei Ebenen — die ersten beiden sind das eigentliche „Verschmelzen":

### a) Gemeinsame Farbskala (der wichtigste Trick)

Beide Schichten nutzen **dieselbe feste NDVI→Farbe-Abbildung** (die Stützpunkte
aus `process_ndvi.py`). Dadurch sind grobe Choropleth-Fläche und scharfer
Raster-Ausschnitt **farblich kontinuierlich** — sie sehen aus wie *eine* Karte,
obwohl die Auflösung springt. Ohne gemeinsame Skala wirkt der Ausschnitt wie ein
Fremdkörper.

### b) Layer-Stapel statt Pixel-Mischung (UI)

Wie bei Kartendiensten: die grobe Schicht ist die Basis, der scharfe Ausschnitt
liegt als **Overlay darüber**, nur innerhalb seines AOI. Kein echtes
Pixel-Verrechnen, sondern Z-Stapelung. Zwei Varianten für den Übergang am Rand:

- **Hart, auf Polygon geclippt** (wie wir schon auf den Landkreis clippen) —
  saubere, definierte Kante.
- **Weich, mit Alpha-Feder** — der Ausschnitt blendet zum Rand hin in die grobe
  Schicht über (Alpha-Verlauf am bbox-Rand, im Export-Schritt oder via
  CSS `mask-image`). Kein sichtbarer Naht-Sprung.

Empfehlung: weiche Alpha-Feder + gemeinsame Farbskala → der scharfe Ausschnitt
„wächst" nahtlos aus der groben Übersicht heraus.

### c) Vorher/Nachher-Wischer (zeitliches Verschmelzen, für Events)

Für das Ereignis selbst: zwei 10-m-Bilder desselben AOI (vor/nach) per
Swipe-Slider überblenden (CSS `clip-path`). Das ist das „aus dem Weltraum"-Bild,
das die Hauptskizze als Ereignis-Modul beschreibt.

### Datenmodell, das beides zusammenhält — ein Manifest

```jsonc
// public/data/vegetation/index.json
{
  "baseline": {
    "type": "choropleth",
    "level": "kreise",
    "geojson": "/data/vegetation/kreise.geo.json",
    "values":  "/data/vegetation/ndvi_kreise.json",   // { kreisId: { "YYYY-MM": ndvi } }
    "composite": "/data/vegetation/de_150m_latest.png", // optional grobe Textur
    "updated": "2026-06-01"
  },
  "events": [
    {
      "id": "waldbrand-ebersberg-2026-08",
      "title": "Waldbrand nördlicher Ebersberger Forst",
      "aoi_bbox": [11.90, 48.05, 12.05, 48.15],
      "resolution_m": 10,
      "before": { "date": "2026-07-20", "img": "events/waldbrand-.../before.png" },
      "after":  { "date": "2026-08-05", "img": "events/waldbrand-.../after.png" }
    }
  ]
}
```

Das Frontend rendert immer die Basis (Choropleth) und legt bei einem aktiven
Event dessen Hochauflösungs-Overlay + Vorher/Nachher-Wischer darüber. Neue
Events = nur ein Eintrag in `events[]` + zwei kleine PNGs.

---

## 4 — Schnell *und* unbeaufsichtigt

- **Inkrementell:** Der wöchentliche Cron holt **nur den neuesten Monat** und
  hängt ihn an `ndvi_kreise.json` an. Die 5-Jahres-History wird **einmal**
  gerechnet, nicht jede Woche neu.
- **Cron, nicht interaktiv:** Ob ein Job 10 oder 50 Min läuft, ist egal — niemand
  wartet. GitHub Actions sind im Free-Tier dafür ausreichend.
- **Events sind selten & klein:** ein paar Mal im Jahr, kleines AOI → günstig.

---

## 5 — Kosten & Aufwand

| Posten | Kosten |
|---|---|
| Schicht A: ein aggregate_spatial-Job (100 m) + inkrementeller Cron | OpenEO Free-Tier |
| Choropleth-Daten (JSON) | ~200 KB, im Repo (kein R2) |
| Landkreis-GeoJSON (VG250, vereinfacht) | einmalig ~2–5 MB, im Repo |
| optional grobe DE-Textur (150 m PNG) | klein, im Repo |
| Schicht B: Event-Bilder (kleines AOI, web-optimiert) | je ~100–300 KB, im Repo |
| GitHub Actions (wöchentlich) | Free-Tier |
| **R2** | **weiterhin nicht nötig** — erst wenn sich viele Events/Regionen ansammeln |

Pipeline-Änderungen sind klein: vor der Aggregation ein `resample_spatial`,
und `aggregate_spatial` über eine **Polygon-Sammlung** statt ein Polygon.

---

## 6 — Roadmap

1. **Choropleth-Proof mit 16 Bundesländern** — vorhandenes `bundeslaender.geo.json`,
   ein `aggregate_spatial`-Job → NDVI je Bundesland → Vektorkarte einfärben.
   Validiert das ganze Prinzip in Minuten.
2. **Auf 401 Landkreise** — VG250-Kreisgrenzen beschaffen + vereinfachen,
   gleiche Logik, inkrementeller Cron.
3. **Event-Modul** — Manifest `index.json`, ein `fetch_event.py` (AOI + zwei
   Daten → zwei web-optimierte 10-m-PNGs), Frontend-Overlay + Vorher/Nachher-Wischer
   mit gemeinsamer Farbskala und Alpha-Feder.
4. **Kopplung an Anomalie-Alert** (Phase 4 der Hauptskizze) — Alert liefert das
   AOI automatisch, Event-Modul erzeugt die Belegbilder.

---

## 7 — Offene Fragen / Risiken

- **OpenEO-Quota für DE-weite Aggregation über 5 Jahre.** Erstlauf evtl. in
  Jahres-Häppchen aufteilen; danach nur inkrementell. Genaue Limits beim
  Bundesland-Proof messen.
- **Wolken bleiben das Thema** — DE-weiter Monats-Median bügelt sie meist aus,
  aber das Aufnahmedatum/Bewölkung je Kreis sollte mitgeführt und ehrlich
  angezeigt werden.
- **Landkreis-GeoJSON-Größe.** Stark vereinfachen (z. B. mapshaper) für kleine
  Repo-/Ladegröße, ohne dass Grenzen ausfransen.
- **Event-Aktualität vs. Wolken.** „Auf Zuruf" heißt: nächste *wolkenfreie*
  Szene — die kann ein paar Tage alt sein. Für akute Lagen ggf. Sentinel-1
  (Radar, wolkendurchdringend) als Ergänzung erwägen.
