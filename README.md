# UBA-Datacube

UBA-Datacube ist eine moderne Web-Applikation zur Visualisierung und Analyse von Umweltdaten des Umweltbundesamtes (UBA). Die Anwendung nutzt die offizielle UBA SDMX REST API, um Datensätze zu Klima, Energie, Abfall und weiteren Umweltthemen interaktiv zugänglich zu machen.

## 🚀 Features

- **Dashboard**: Übersichtliche Darstellung ausgewählter Schlüsselindikatoren (Treibhausgasemissionen, Temperaturen, Erneuerbare Energien etc.).
- **Emotionales Visual Design (Story First)**: Die Startseite nutzt ein bildstarkes Layout ("Kompass für die Umwelt") mit atmosphärischen Natur-Fotografien und Hover-Effekten, um einen emotionalen Zugang zu den Umweltdaten zu schaffen.
- **Katalog**: Durchsuchen und Filtern aller verfügbaren UBA-Datensätze (Dataflows).
- **Regional-Explorer & Bundesland-Dashboard (`/regionen`)**: Interaktiver Vergleich aller 16 deutschen Bundesländer mit 4 zentralen Umweltindikatoren (Heiße Tage, Windkraft-Ausbau MW, Solarenergie-Ausbau MW, PRTR-Industrie-Emissionen), regionalen Klimafakten und direkter Tabellensortierung.
- **SEO-Booster & Google Rich Snippets**:
  - **Sitemap-Generator (`public/sitemap.xml`)**: Automatischer Build-Schritt (`scripts/generate-sitemap.ts`) erzeugt für alle 89 gerenderten Routen eine XML-Sitemap mit Prioritäten und Datumsstempeln.
  - **Robots.txt (`public/robots.txt`)**: Vollständige Crawler-Freigabe für Suchmaschinenbot-Indexing.
  - **JSON-LD Schema Integration (`src/components/SEO.tsx`)**: Automatische Generierung von `BreadcrumbList` (Pfad-Hierarchie im Google-Snippet), `FAQPage` Rich Snippets für Q&A-Dropdowns in den Google-Suchergebnissen sowie `Dataset`-Schemas für Google Dataset Search.
- **Datenvergleich & Indikatoren-Analyse (`/vergleich`)**: Interaktive Gegenüberstellung zweier Umwelt-Indikatoren auf einer gemeinsamen Zeitachse mit Dual-Y-Achse, relativem Trendmodus (% Index = 100), automatischer Pearson-Korrelationsberechnung und kombinierter CSV-Exportfunktion.
- **Smart Data Discovery**:
  - **Dimensionale Filter**: Komplexe Datensätze (z. B. mit >6000 Serien) können komfortabel über Dropdown-Menüs gefiltert werden.
  - **Smart Defaults**: Das System berechnet automatisch die relevantesten Datenreihen (Hauptemittenten) und wählt diese beim Laden eines Datensatzes als Startansicht aus.
  - **Guided Analytics UX**: Schließbare Onboarding-Tipps (`GuidedTip`), Info-Tooltips an Filtern und kontextsensitive Deep-Links zwischen Analysen und Rohdaten führen Nutzer sicher durch die Anwendung.
  - **Share-Funktion**: Jede Datensatzansicht kann per Share-Button als URL geteilt werden.
  - **Spezial-Analysen**: Maßgeschneiderte Ansichten für komplexe Datensätze (z. B. Waldbrände), die verschiedene Einheiten (Anzahl vs. Fläche) trennen und abgeleitete Metriken (wie "Brandintensität") on-the-fly berechnen, um echte Erkenntnisse zu liefern.
  - **Wissenschaftliche Notation**: Extrem kleine Messwerte werden zur besseren Lesbarkeit automatisch skaliert (z. B. `1.2e-6`).

## 🛠️ Tech Stack & Code-Qualität

- **Frontend**: React 19
- **Framework & Build**: Vite, TypeScript (strikte Typensicherheit ohne `any`)
- **Performance & Splitting**: `React.lazy` Route-Code-Splitting, dedizierte Vendor-Chunks (`vendor-react`, `vendor-recharts`, `vendor-d3`), In-Memory & SessionStorage API-Caching mit TTL
- **Visualisierung**: Recharts, D3-Geo
- **Quality Gates**: ESLint (0 Errors, 0 Warnings), Static Type Checking (`tsc --noEmit`), Playwright Prerendering (89/89 Routen statisch vorgeneriert)
- **Styling**: Vanilla CSS, TailwindCSS (mit modernen CSS-Variablen)
- **API**: UBA SDMX REST API (SDMX-JSON v1/v2)

## 📦 Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Code-Qualität & Linting überprüfen
npm run lint

# Typen prüfen
npx tsc --noEmit

# Produktionsbuild & Playwright Prerender erstellen
npm run build
```

## 🏗️ Architektur & Datenfluss

Die Kernlogik für den Datenabruf befindet sich in `src/api/sdmx.ts`. 
Die UBA-API liefert Daten im SDMX-JSON Format. Da die API-Struktur zwischen verschiedenen Datensätzen variieren kann, wurde ein fehlertolerantes Parsing implementiert:
- **API-Caching (2-Stufen)**: `cachedFetchJson` cached API-Responses in-Memory und in `sessionStorage` (1 Std. TTL). Beim erneuten Betreten von Seiten oder Tab-Wechseln werden Daten sofort ohne Netzwerkverzögerung geladen.
- **Typensicherheit**: Vollständig typisierte SDMX-Netzwerk- und Struktur-Interfaces (`RawSDMXHeader`, `RawSDMXStructure`, `RawSDMXDataSet`, `Dataflow`, `Dimension`).
- **Code-Splitting**: Alle Hauptseiten (`AnalysePage`, `CatalogPage`, `WindPage`, `SolarPage`, `HeatPage` etc.) werden dynamisch per `React.lazy` geladen. Das initiale Hauptbundle wurde dadurch um über 55 % verkleinert.
- **Zeitdimensionen**: Werden flexibel über ihre Rolle (`time`) oder ID (`TIME_PERIOD`) identifiziert.
- **Beobachtungen (Observations)**: Es werden sowohl klassische Arrays (`[Wert, Flag]`) als auch direkte numerische Werte unterstützt.
- **Robustes Fallback**: Wenn eine Datenreihe komplett leer ist, wird sie vom System intelligent ignoriert, um "leere" Charts zu vermeiden.
- **Hook-Architektur & Rendering**: React-Hooks sind für reaktive Abfragen optimiert (`useMemo`, `useCallback`) ohne Mutationen von Ref-Werten während des Rendering-Passes.
- **Spezial-Komponenten (Custom Views)**: Für Datensätze, bei denen Standard-Visualisierungen an ihre Grenzen stoßen (z. B. `DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA` wegen gemischter Einheiten), existieren maßgeschneiderte Komponenten (wie `ForestFiresAnalysis.tsx`). Diese werden dynamisch eingebunden, nutzen synchrone Diagramme (`syncId`) und berechnen auf Basis des API-Responses abgeleitete Metriken für tiefere Einblicke.
- **Automatisierte Daten-Pipelines**: Für Offline- und DWD-Stationsmessungen (z. B. Hitzerekorde auf `/hitze`) existiert eine Python-Datenpipeline (`scripts/dwd/build_heat_thresholds.py`). Diese wird per **GitHub Actions Cronjob** (`.github/workflows/deploy.yml`) jeden Montag um 04:00 Uhr UTC automatisch ausgeführt. Sie zieht frische Tageshöchstwerte (`recent/kl`), aktualisiert `public/heat_thresholds.json` und deployt die vorgenerierte Seite neu auf GitHub Pages.
