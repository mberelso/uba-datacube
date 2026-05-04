# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

## [Unreleased]

---

## [0.5.0] – 2026-05-04

### Added
- **ChartRenderer** (`src/components/charts/ChartRenderer.tsx`): Zentraler Router, der je nach `dataflow.category` automatisch den passenden Diagrammtyp auswählt.
- **ClimateChart** (`src/components/charts/ClimateChart.tsx`): Gestapeltes Flächendiagramm (Area Chart) für die Kategorien `CLIMATE` und `CROSS` (GHG-Projektionen). Inspiriert von *Our World in Data*. Zeigt automatisch eine Netto-Null-Referenzlinie bei negativen Werten.
- **EconomyChart** (`src/components/charts/EconomyChart.tsx`): Dual-Achsen-Diagramm (Balken links, Linie rechts) für die Kategorie `ENV` (Umwelt & Wirtschaft) zur Visualisierung von Entkopplungseffekten.
- **FallbackChart** (`src/components/charts/FallbackChart.tsx`): Ausgelagerter Standard Line/Bar-Chart als Fallback für alle Kategorien ohne spezifischen Chart-Typ.
- **ChartStyles** (`src/components/charts/ChartStyles.tsx`): Geteilter Glassmorphismus-Tooltip, `formatVal`-Formatter und zentrale Farbpalette für alle Chart-Komponenten.

### Changed
- `DatasetPage.tsx`: Inline-Recharts-Logik durch den neuen `<ChartRenderer />` ersetzt. Vereinfacht und wartbarer.
- Alle Diagramme nutzen jetzt einheitliche Premium-Tooltips mit Glassmorphismus-Effekt.

### Fixed
- Build-Fehler: Unbenutzte Recharts-Imports in `DatasetPage.tsx` entfernt.
- Build-Fehler: `CHART_COLORS` Export fehlte in `ChartStyles.tsx` (hat `ClimateChart` und `EconomyChart` geblockt).

---

## [0.4.0] – 2026-04-29

### Added
- **Verwandte Publikationen** (`RelatedPublications.tsx`): Kontextuelle Infobox mit UBA-Studien und Pressemitteilungen zu jedem geöffneten Datensatz. Intelligente Such-Fallback-Logik.
- **Preset-Ansichten für Treibhausgase**: 10 klickbare Filter-Presets für den GHG-Datensatz (`DatasetPresets.tsx`).

### Fixed
- Leere Zeiträume (Beobachtungen ohne Werte) werden global aus Diagrammen herausgefiltert.
- Einzelne Datenpunkte werden als Punkt dargestellt (kein leerer Chart).
- UBA-Publikations-URLs auf aktive, erreichbare Seiten aktualisiert.

---

## [0.3.0] – 2026-04-28

### Added
- **Guided Analytics UX**: Hinweistexte (`InfoTooltip`) an Filtern und Datensatz-Header.
- **Erweiterte Waldbrand-Analyse** (`ForestFiresAnalysis.tsx`): Dedizierter Tab mit Brandintensitäts-Chart (Hektar pro Brand) und Ursachen-/Flächenanalyse.
- **Empty State**: Klare Meldung wenn keine Datenreihen ausgewählt sind.

### Changed
- Initiale Top-5-Serien werden automatisch anhand der höchsten Durchschnittswerte (Absolutwerte) vorausgewählt (Smart Defaults).
- Y-Achse: Unterstützung für wissenschaftliche Notation (`toExponential`) bei sehr kleinen Werten.
- Sidebar-Anzeige auf max. 100 gefilterte Serien begrenzt (Performance).

---

## [0.2.0] – 2026-04-28

### Added
- **Superpowers Framework** (`.agent/`): Workflows, Skills und Artefakte für strukturierte Feature-Entwicklung.
- **Datenkatalog** (`CatalogPage.tsx`): Übersicht aller Datensätze nach Kategorien gruppiert, mit Suchfunktion und Kategorie-Filter-Chips.

### Changed
- `DatasetPage`: Dynamische Dropdown-Filter für jede Dimension (Substanz, Sektor, etc.).
- Kategorien-System mit Farben, Icons und Labels (`utils/categories.ts`).

---

## [0.1.0] – 2026-04-27

### Added
- Initiales Projekt: React/Vite-App mit SDMX REST API Anbindung ans Umweltbundesamt.
- Dashboard (`DashboardPage.tsx`) mit Überblick über Kategorien.
- Datensatz-Detailseite (`DatasetPage.tsx`) mit Line- und Bar-Charts.
- Analyse-Seite (`AnalysePage.tsx`).
