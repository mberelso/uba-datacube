# UBA-Datacube

UBA-Datacube ist eine moderne Web-Applikation zur Visualisierung und Analyse von Umweltdaten des Umweltbundesamtes (UBA). Die Anwendung nutzt die offizielle UBA SDMX REST API, um Datensätze zu Klima, Energie, Abfall und weiteren Umweltthemen interaktiv zugänglich zu machen.

## 🚀 Features

- **Dashboard**: Übersichtliche Darstellung ausgewählter Schlüsselindikatoren (Treibhausgasemissionen, Temperaturen, Erneuerbare Energien etc.).
- **Katalog**: Durchsuchen und Filtern aller verfügbaren UBA-Datensätze (Dataflows).
- **Dataset-Analyse**: Detaillierte interaktive Charts (Linie, Balken, Fläche) für jeden Datensatz.
- **Smart Data Discovery**:
  - **Dimensionale Filter**: Komplexe Datensätze (z. B. mit >6000 Serien) können komfortabel über Dropdown-Menüs gefiltert werden.
  - **Smart Defaults**: Das System berechnet automatisch die relevantesten Datenreihen (Hauptemittenten) und wählt diese beim Laden eines Datensatzes als Startansicht aus.
  - **Guided Analytics UX**: Info-Tooltips an Filtern, "Empty States" bei abgewählten Serien und Onboarding-Tipps führen Anfänger sicher durch die Daten.
  - **Wissenschaftliche Notation**: Extrem kleine Messwerte werden zur besseren Lesbarkeit automatisch skaliert (z. B. `1.2e-6`).

## 🛠️ Tech Stack

- **Frontend**: React 18
- **Framework & Build**: Vite, TypeScript
- **Visualisierung**: Recharts
- **Styling**: Vanilla CSS (mit modernen CSS-Variablen)
- **API**: UBA SDMX REST API (SDMX-JSON v1/v2)

## 📦 Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Produktionsbuild erstellen
npm run build
```

## 🏗️ Architektur & Datenfluss

Die Kernlogik für den Datenabruf befindet sich in `src/api/sdmx.ts`. 
Die UBA-API liefert Daten im SDMX-JSON Format. Da die API-Struktur zwischen verschiedenen Datensätzen variieren kann, wurde ein fehlertolerantes Parsing implementiert:
- **Zeitdimensionen**: Werden flexibel über ihre Rolle (`time`) oder ID (`TIME_PERIOD`) identifiziert.
- **Beobachtungen (Observations)**: Es werden sowohl klassische Arrays (`[Wert, Flag]`) als auch direkte numerische Werte unterstützt.
- **Robustes Fallback**: Wenn eine Datenreihe komplett leer ist, wird sie vom System intelligent ignoriert, um "leere" Charts zu vermeiden.
