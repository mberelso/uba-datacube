# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## 🚀 Gemini Superpowers

Dieses Projekt wurde mit dem [Gemini Superpowers Framework](https://github.com/anthonylee991/gemini-superpowers-antigravity) erweitert. Dieses Framework bietet strukturierte Workflows für eine bessere Code-Qualität durch Planung und Test-getriebene Entwicklung (TDD).

### Verfügbare Befehle (Slash Commands)

Du kannst jetzt folgende Befehle in Antigravity nutzen:

- `/superpowers-write-plan` - Erstellt einen detaillierten Plan für deine Aufgabe.
- `/superpowers-execute-plan` - Führt den Plan Schritt für Schritt aus.
- `/superpowers-brainstorm` - Hilft bei der Ideenfindung.
- `/superpowers-review` - Überprüft die Code-Qualität.

### Installation Details
- Die Framework-Dateien befinden sich im Ordner `.agent/`.
- Ein Demo-Projekt mit installierten Python-Abhängigkeiten findest du unter `gemini-superpowers-antigravity/`.

## 🛠️ Letzte Optimierungen

### Dashboard & API-Parsing (April 2026)
Die Datenanzeige wurde robuster gestaltet, um Probleme mit leeren Dashboards zu beheben:
- **Smart Series Picking**: Das System sucht nun automatisch nach der ersten Datenreihe, die tatsächlich Werte enthält, anstatt blind die erste Reihe der API-Antwort zu nehmen.
- **SDMX-JSON v2 Support**: Die Parsing-Logik in `sdmx.ts` wurde verbessert, um sowohl Arrays als auch direkte numerische Werte zu verarbeiten.
- **Fehlertoleranz**: Zeitdimensionen werden nun anhand ihrer ID oder Rolle identifiziert, was die Kompatibilität mit verschiedenen Datensätzen des UBA erhöht.
- **UX**: Charts zeigen nun eine explizite Meldung an, wenn keine Daten für den gewählten Zeitraum verfügbar sind.
