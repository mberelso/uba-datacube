# Arbeitspakete — Codebase-Analyse & Weiterentwicklung

**Stand:** 25.08.2026 · **Basis:** Vollständige Codebase-Analyse (Frontend, Build-Kette, Pipelines, CI, Dependencies)
**Zweck:** Selbstständige Weiterarbeit zu einem späteren Zeitpunkt. Jedes Arbeitspaket (AP) ist in sich abgeschlossen beschrieben: Fehleranalyse mit verifizierten Fundstellen, Lösungsansatz mit Code-Skizzen, Akzeptanzkriterien, Aufwand, Abhängigkeiten.

---

## Inhaltsverzeichnis

| AP | Titel | Schwere | Aufwand | Status |
|----|-------|---------|---------|--------|
| [AP-01](#ap-01) | Prerender-Titel-Bug: alle Landingpages tragen denselben `<title>` | 🔴 kritisch | 1–2 h | offen |
| [AP-02](#ap-02) | Sitemap-Vereinheitlichung: `/regionen` + `/vergleich` fehlen live | 🔴 kritisch | 0,5 h | offen |
| [AP-03](#ap-03) | Prerender-Fehlschwelle: kaputte Routen ⇒ grüner Deploy | 🔴 kritisch | 1 h | offen |
| [AP-04](#ap-04) | Error Boundary + Chunk-Load-Recovery fehlt | 🔴 kritisch | 2 h | offen |
| [AP-05](#ap-05) | API-Key-Hygiene: toter Code mit `VITE_GEMINI_API_KEY`, Key-Rotation | 🟠 hoch | 1 h | offen |
| [AP-06](#ap-06) | `sdmx.ts` Kleinigkeiten: Prod-Logging, Dummy-Flows, kein Promise-Dedup | 🟡 mittel | 1–2 h | offen |
| [AP-07](#ap-07) | Repo- & Dependency-Hygiene | 🟡 mittel | 1 h | offen |
| [AP-08](#ap-08) | Zentrale Formatierungs-Lib (`src/lib/format.ts`) | 🟠 hoch | 0,5–1 Tag | offen |
| [AP-09](#ap-09) | SDMX-Parser konsolidieren (`parseSdmxCsv`, Fallback-Ketten) | 🟠 hoch | 0,5 Tag | offen |
| [AP-10](#ap-10) | `useAsync`-Hook mit AbortController | 🟡 mittel | 0,5 Tag + Migration | offen |
| [AP-11](#ap-11) | Choropleth-Basiskomponente aus 4 Karten extrahieren | 🟡 mittel | 1–2 Tage | offen |
| [AP-12](#ap-12) | Export-System konsolidieren (5 Implementierungen → 1) | 🟡 mittel | 1 Tag | offen |
| [AP-13](#ap-13) | Vitest aufsetzen + Unit-Tests an Bug-Hotspots | 🟠 hoch | 0,5–1 Tag | offen |
| [AP-14](#ap-14) | CI PR-Gate (lint + tsc + tests) | 🟠 hoch | 1–2 h | offen |
| [AP-15](#ap-15) | DWD-Pipeline härtens (stiller Datenverlust, Validierung, Commit-back) | 🟠 hoch | 0,5–1 Tag | offen |
| [AP-16](#ap-16) | MaStR-Pipeline reproduzierbar machen + Frische-Badges | 🟡 mittel | 0,5 Tag | offen |
| [AP-17](#ap-17) | Deploy-Robustheit: Chrome-Pinning, 404.html, social-bg-Gewicht | 🟢 niedrig | 2–3 h | offen |
| [AP-18](#ap-18) | Redaktion: draft→reviewed-Review abschließen | 🟡 mittel | redaktionell | offen |
| [AP-19](#ap-19) | Feature: Zeitraum-Selektor AnalysePage | 🟢 niedrig | 0,5 Tag | offen |
| [AP-20](#ap-20) | Fix: Sub-Jahres-Granularität bricht Zeitachse | 🟠 hoch | 0,5 Tag | offen |
| [AP-21](#ap-21) | Feature: neue Analyse-Charts (Kandidatenliste) | 🟢 niedrig | je 1–2 h | offen |
| [AP-22](#ap-22) | SEO: OG-Bilder für /regionen + /vergleich | 🟢 niedrig | 1 h | offen |
| [AP-23](#ap-23) | SEO: `excludeFromCatalog`-Datasets sind indexierbare Waisen | 🟡 mittel | 1 h | offen |
| [AP-24](#ap-24) | Feature: Ko-Fi-Spendenbutton | 🟢 niedrig | 1 h | offen |

**Empfohlene Reihenfolge:** AP-01 → AP-02 → AP-03 → AP-04 → AP-05 (alle ≤ 1 Tag zusammen, größter Live-Nutzen) → danach AP-13/14 (Sicherung) → dann Wellen 2–4 frei → Features zuletzt.

---

# Welle 1 — Kritische Fixes (live betroffen)

## AP-01 — Prerender-Titel-Bug: alle Landingpages tragen denselben `<title>`

### Symptom (live verifiziert, Stand 24.08.2026-Build)

Alle statischen Routen im deployed `dist/` tragen exakt denselben Titel:

```
catalog:    <title>Umweltpuls – Umweltdaten Deutschland interaktiv</title>
analysen:   <title>Umweltpuls – Umweltdaten Deutschland interaktiv</title>
regionen:   <title>Umweltpuls – Umweltdaten Deutschland interaktiv</title>
vergleich:  … (identisch)
hitze/about/wind/solar: … (identisch)
```

Zusätzlich enthält `dist/index.html` **drei** `<title>`-Tags (ein gültiger, zwei leere) — der Head-Dedup läuft also auch auf der Startseite vor abgeschlossener Helmet-Verarbeitung.

Davon abgeleitet sind auch alle `og:title`-/`twitter:title`-Tags identisch ([prerender.ts:246-247](../scripts/prerender.ts)) ⇒ identische Social-Preview-Titel für jede Landingpage.

Nur die 81 Dataset-Seiten sind korrekt, weil sie per `datasetTitle()` hart überschrieben werden.

### Fehleranalyse (Ursachenkette, alle Stellen verifiziert)

1. **Die Seiten geben korrekte Titel weiter** — es liegt NICHT an den Pages:
   - [CatalogPage.tsx:117](../src/pages/CatalogPage.tsx): `title="Datenkatalog"`
   - [RegionalPage.tsx:84](../src/pages/RegionalPage.tsx): `title="Regional-Explorer — Wie grün ist dein Bundesland?"`
   - analog About-, Analyse-, Compare-, Heat-, Wind-, SolarPage. Nur [DashboardPage.tsx:563](../src/pages/DashboardPage.tsx) nutzt bewusst den Default (`<SEO path="/" />`).
2. **Helmet-Default:** [SEO.tsx:31](../src/components/SEO.tsx):
   ```ts
   const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Umweltdaten Deutschland interaktiv`
   ```
3. **Der Bug:** [prerender.ts:309-320](../scripts/prerender.ts) wartet auf einen routenspezifischen Titel mit dem Sentinel:
   ```ts
   const HOMEPAGE_TITLE = 'Umweltpuls'
   // Bedingung: ogTitle !== 'Umweltpuls'
   ```
   Der tatsächliche initiale og:title ist aber `'Umweltpuls – Umweltdaten Deutschland interaktiv'` — die Bedingung ist also **sofort erfüllt**, noch bevor react-helmet-async den seitenspezifischen Title geflusht hat. Der Snapshot entsteht zu früh.
4. **Vertuscher:** Das `.catch(() => {})` in [prerender.ts:320](../scripts/prerender.ts) verschluckt jeden Wait-Timeout lautlos — deshalb blieb der Defekt in CI unsichtbar (siehe auch AP-03).
5. **Verstärker:** Der Head-Dedup ([prerender.ts:325-358](../scripts/prerender.ts)) läuft ebenfalls vor vollständigem Helmet-Flush; deshalb überleben auf `/` sogar drei leere/gültige Title-Tags den Build.

### Lösungsansatz

**Schritt 1 — Single Source of Truth für den Default-Titel:** In `src/components/SEO.tsx` den Default als Konstante exportieren:

```ts
export const DEFAULT_FULL_TITLE = `${SITE_NAME} – Umweltdaten Deutschland interaktiv`
// in der Komponente:
const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_FULL_TITLE
```

**Schritt 2 — Wartebedingung korrigieren** ([prerender.ts](../scripts/prerender.ts), Block um Zeile 306–320):

```ts
import { DATASET_CONTENT } from '../src/data/datasetContent.ts'
import { DEFAULT_FULL_TITLE } from '../src/components/SEO.tsx'

await page.waitForFunction(
  (defaultTitle) => {
    if (!document.documentElement.dataset.prerenderReady) return false
    if (window.location.pathname === '/') return true
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? ''
    return ogTitle.length > 0 && ogTitle !== defaultTitle   // ← echter Vergleich
  },
  DEFAULT_FULL_TITLE,
  { timeout: 8000 }
).catch((e) => {
  // NICHT mehr stillschweigend: sichtbar machen
  console.warn(`  ⚠️ ${route}: Helmet-Flush-Timeout (og:title blieb generisch)`)
})
```

**Schritt 3 — Nachweis statt Vertrauen (Post-Check):** Nach dem Snapshot verifizieren, dass der Titel nicht mehr dem Default entspricht; sonst Fail zählen:

```ts
const titleInHtml = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] ?? ''
if (!dsTitle && route !== '/' && titleInHtml === DEFAULT_FULL_TITLE) {
  console.warn(`  ⚠️ ${route}: generischer Titel im Snapshot`)
  metaFails++
}
```

**Schritt 4 — Dedup nach dem Flush:** Den Head-Dedup (`page.evaluate`, Zeile 325) erst NACH erfolgreichem WaitForFunction ausführen (tut er schon — nur kam das „erfolgreich" bisher zu früh). Mit Schritt 2 ist das automatisch behoben.

### Akzeptanzkriterien

- [ ] `grep -o "<title>[^<]*</title>" dist/<route>/index.html` liefert für JEDE statische Route einen eigenen, seitenspezifischen Titel (z. B. `Datenkatalog | Umweltpuls`).
- [ ] `dist/index.html` enthält genau einen `<title>`.
- [ ] `og:title` je Route = Seitentitel (nicht mehr daraus abgeleiteter Generik).
- [ ] Lokaler Testlauf: `npm run build` → manuelle Sichtprüfung von 3–4 Routen.

**Aufwand:** 1–2 h · **Abhängigkeiten:** keine · **Nutzen:** direkter SEO-Hebel (Unique Titles + korrekte Social-Cards auf allen Landingpages)

---

## AP-02 — Sitemap-Vereinheitlichung: `/regionen` + `/vergleich` fehlen live

### Symptom (live verifiziert)

- Deployte `dist/sitemap.xml`: **85 URLs**, `regionen`/`vergleich` kommen **nullmal** vor.
- `public/sitemap.xml` (im Repo): 87 URLs, beide Routen enthalten.

### Fehleranalyse

Es gibt **zwei konkurrierende Sitemap-Generatoren**:

| Quelle | Routen | schreibt | läuft |
|--------|--------|----------|-------|
| [generate-sitemap.ts](../scripts/generate-sitemap.ts) (STATIC_ROUTES Zeile 18–28, inkl. `/regionen` Zeile 20, `/vergleich` Zeile 23) | 9 statisch + 78 Datasets = 87 | `public/sitemap.xml` (Zeile 59) | zuerst im Build (`package.json` Script `build`, Step 1) |
| Vite-Plugin in [vite.config.ts:49-55](../vite.config.ts) (`closeBundle`), statische Liste Zeile 12–20 **ohne** `/regionen`/`/vergleich` | 7 statisch + 78 = 85 | `dist/sitemap.xml` | am Ende von `vite build` |

Ablauf im Build: tsx-Script schreibt `public/` korrekt → Vite kopiert `public/` nach `dist/` → **das Plugin überschreibt `dist/sitemap.xml` mit der Kurzversion**. Die schlechtere der beiden Implementierungen gewinnt strukturell — bei jeder künftigen neuen Route passiert derselbe Fehler erneut.

Hinweis: Der Kommentar in [prerender.ts:407-408](../scripts/prerender.ts) („sitemap.xml wird vom generate-sitemap-Plugin in vite.config.ts erzeugt") dokumentiert genau die falsche Quelle als maßgeblich — muss mitgeändert werden.

### Lösungsansatz

1. **Vite-Plugin komplett entfernen** (vite.config.ts Zeilen 49–55 samt `generateSitemap()`-Funktion Zeilen 9–43 und den Imports `writeFileSync`, `DATASET_CONTENT`, falls sonst unbenutzt). `scripts/generate-sitemap.ts` ist die bessere Quelle (vollständigere Routenliste, eigenes CLI-Log).
2. Kommentar in prerender.ts (Zeile 407–408) auf `scripts/generate-sitemap.ts` umschreiben.
3. Optional (Robustheit): In `scripts/generate-sitemap.ts` eine Assertion einbauen, dass jede Route aus `STATIC_ROUTES` des Prerenders auch in der Sitemap landet — oder die statische Routenliste in eine gemeinsame Datei (z. B. `src/routes.ts` bzw. Import aus prerender.ts) ziehen. Minimalvariante: ein Kommentar „BEI NEUER ROUTE: hier + scripts/prerender.ts STATIC_ROUTES pflegen" an beiden Stellen.

### Akzeptanzkriterien

- [ ] `npm run build && grep -c "<loc>" dist/sitemap.xml` → ≥ 87
- [ ] `grep -o "regionen\|vergleich" dist/sitemap.xml | sort -u` → beide Treffer
- [ ] Nur noch EIN Sitemap-Generator im Repo (`grep -rn "urlset" scripts vite.config.ts`)

**Aufwand:** 30 min · **Abhängigkeiten:** keine

---

## AP-03 — Prerender-Fehlschwelle: kaputte Routen ⇒ grüner Deploy

### Fehleranalyse

[prerender.ts](../scripts/prerender.ts):

- Pro Route nur `try/catch` mit `console.warn` + `fail++` (Zeilen 398–401).
- Exit-Code ≠ 0 ausschließlich bei `ok === 0` (Zeile 411).
- Der Helmet-Wait-Timeout wird zusätzlich durch `.catch(() => {})` (Zeile 320) verschluckt.

Konsequenz: **89 von 90 fehlschlagende Routen erzeugen trotzdem einen grünen Deploy.** Genau deshalb blieb AP-01 monatelang unbemerkt. SEO-Regressionen sind strukturell unsichtbar.

### Lösungsansatz

```ts
// am Ende von run():
console.log(`\nPrerender complete: ${ok} OK, ${fail} failed.`)
if (fail > 0 || ok === 0) process.exit(1)        // ← Fehlschwelle
```

Empfehlungen dazu:

- Eine einmalige Route-Retry-Logik einbauen (Netzwerk-/Timing-Flakiness im CI):

  ```ts
  } catch (e) {
    if (!retried.has(route)) { retried.add(route); return retryRoute(route) }
    console.warn(`  FAIL ${route}: ${(e as Error).message}`); fail++
  }
  ```
- Die Warnung aus AP-01 Schritt 3 (`metaFails`) in denselben Fail-Zähler einbeziehen — sonst kann ein „grüner" Build weiterhin generische Titel deployen.
- Kurzfristig akzeptabler Mittelweg: `fail > MAX_ALLOWED` mit `MAX_ALLOWED = 0` starten; wenn sich einzelne Dataset-Routen als flaky erweisen, gezielte Whitelist statt globaler Toleranz.

### Akzeptanzkriterien

- [ ] Simulierter Fehlerfall (temporär eine Route absichtlich werfen lassen) ⇒ Build rot.
- [ ] Normaler Build bleibt grün (90/90).

**Aufwand:** 1 h · **Abhängigkeiten:** sinnvollerweise mit/nach AP-01 (dort entsteht der Meta-Fail-Zähler)

---

## AP-04 — Error Boundary + Chunk-Load-Recovery

### Fehleranalyse

- Es existiert **keine** Error Boundary im gesamten Baum (Grep über `src/`: keine Treffer für `ErrorBoundary|componentDidCatch|getDerivedStateFromError`).
- Alle Seiten außer der Startseite sind `React.lazy`-Chunks ([App.tsx:7-16](../src/App.tsx)).
- GitHub Pages deployt immutable gehashte Chunks. Klassischer Fehlerfall: Nutzer hat die App seit einem alten Deployment offen, navigiert client-seitig → alter Chunk-Name existiert nicht mehr → `ChunkLoadError` → **weißer Bildschirm ohne Recovery**.
- Zusätzlich fängt keine Boundary Laufzeitfehler einzelner Seiten ab — ein Fehler in einer Page nimmt die ganze App mit.

### Lösungsansatz

Neue Komponente `src/components/RouteErrorBoundary.tsx`:

```tsx
import { Component, type ReactNode } from 'react'

interface State { error: Error | null }

/** Fängt Render-/Chunk-Fehler pro Route ab und bietet Recovery an. */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[RouteErrorBoundary]', error)
  }

  handleReload = () => {
    // Einmalig hart neu laden, damit neue Chunk-Hashes gezogen werden;
    // Flag verhindert Reload-Schleife falls der Fehler persistsiert.
    const key = 'uba_reloaded_after_error'
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      window.location.reload()
      return
    }
    sessionStorage.removeItem(key)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Diese Seite konnte nicht geladen werden</h2>
            <p style={{ color: '#64748b', marginBottom: 16 }}>
              Möglicherweise wurde gerade ein neues Update ausgerollt.
            </p>
            <button onClick={this.handleReload}
              style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', cursor: 'pointer' }}>
              Seite neu laden
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

Einbindung in [App.tsx](../src/App.tsx) — **um jede einzelne Route** (nicht global ums Layout, damit Navbar/Footer erhalten bleiben):

```tsx
<Routes>
  <Route path="/analysen" element={<RouteErrorBoundary><AnalysePage /></RouteErrorBoundary>} />
  {/* … alle weiteren Routen analog */}
</Routes>
```

Bei `handleReload`: Beim Reload sollte idealerweise zur selben URL geladen werden — `window.location.reload()` tut das bereits. Zusätzlich erwägen: beim Mount jeder Page `sessionStorage.removeItem(key)` aufräumen (sonst greift der Auto-Reload nur einmal pro Session — gewollt).

Optional (robuster): globales `window.addEventListener('error'/​'unhandledrejection')`-Filter, das bei `ChunkLoadError`/`Failed to fetch dynamically imported module` ebenfalls den einmaligen Reload triggert — deckt den Fall ab, dass der Fehler schon beim initialen `import()` fliegt, bevor die Boundary mountet.

### Akzeptanzkriterien

- [ ] Testweise `throw new Error('test')` in einer Page ⇒ Boundary-UI statt White Screen, Navbar/Footer intakt.
- [ ] Chunk-Fall simulieren: Dev-Build deployen, alte Session offen halten, neuer Build, Navigation ⇒ einmaliger Auto-Reload, danach funktioniert die Navigation.
- [ ] Keine Reload-Schleife bei persistentem Fehler.

**Aufwand:** 2 h · **Abhängigkeiten:** keine

---

## AP-05 — API-Key-Hygiene: toter Code mit `VITE_GEMINI_API_KEY`, Key-Rotation

### Fehleranalyse

1. [src/api/gemini.ts](../src/api/gemini.ts) liest `import.meta.env.VITE_GEMINI_API_KEY` (Zeile 4). **Vite inlined alle `VITE_*`-Vars statisch ins Client-Bundle**, sobald die referenzierende Datei Teil des Graphen ist.
2. Aktuell ist der Key **nicht** im Bundle (verifiziert: `grep -rl "AIzaSy" dist/assets/` → leer), weil `gemini.ts` von keiner einzigen Datei importiert wird und weggeshaked wird. **Der Schutz ist rein zufällig**: Ein einziger künftiger `import { generateStoryText }` publiziert den privaten Gemini-Key öffentlich auf umweltpuls.de.
3. `.env.local` enthält denselben Key doppelt (`VITE_GEMINI_API_KEY` + `GEMINI_API_KEY`). Gitignored (`.gitignore:13` `*.local`) — ok.
4. Die Node-Scripts ([generate-descriptions.ts](../scripts/generate-descriptions.ts) mit `ANTHROPIC_API_KEY` ~Zeile 202, [generate-backgrounds.ts](../scripts/generate-backgrounds.ts) mit `GEMINI_API_KEY` ~Zeile 126) laden **kein dotenv** — `.env.local` wirkt dort gar nicht; Keys müssen manuell per Shell-Env gesetzt werden. Dokumentationslücke.
5. `@google/genai` steht fälschlich in `dependencies` (nur von Build-Scripts + totem Code genutzt).

### Lösungsansatz

1. **`src/api/gemini.ts` löschen.** Der Social-Card-Storytext wird aktuell nicht dynamisch generiert (kein Import, keine UI-Anbindung). Falls die Funktion später gebraucht wird: als Serverless-Function/Action neu bauen, nie client-seitig.
2. **Gemini-Key rotieren** (Google AI Studio: altes Key löschen, neues erzeugen). Begründung: Der Key stand über Monate neben einem `VITE_`-Pendant in Gebrauchsnähe; Rotation kostet Minuten und entfernt das Restrisiko endgültig. (Entspricht dem offenen Punkt „API-Key-Rotation".)
3. `.env.local` aufräumen: nur noch `GEMINI_API_KEY=…` (serverseitig für Scripts) + `ANTHROPIC_API_KEY=…`; **niemals wieder `VITE_`-Präfix für Secrets**.
4. dotenv für Scripts nachrüsten (einmalig oben in beiden Scripts):
   ```ts
   import { loadEnv } from 'util' // nein — simpler: dotenv nutzen
   ```
   Pragmatisch: `npm i -D dotenv` + jeweils als erste Zeile `import 'dotenv/config'` — dotenv liest `.env.local` allerdings nicht automatisch; entweder `.env` zusätzlich pflegen oder explizit:
   ```ts
   import dotenv from 'dotenv'
   dotenv.config({ path: '.env.local' })
   ```
5. `package.json`: `@google/genai` → `devDependencies` verschieben (siehe auch AP-07).
6. **Guard gegen Rückfall (optional, 15 min):** Im Build-Script nach `vite build` prüfen:
   ```bash
   grep -rq "AIzaSy" dist/assets/ && echo "❌ API-Key im Bundle!" && exit 1
   ```

### Akzeptanzkriterien

- [ ] `src/api/gemini.ts` existiert nicht mehr; `grep -rn "VITE_" src/` zeigt keine Secrets.
- [ ] Alter Gemini-Key ist in Google AI Studio deaktiviert; neuer Key funktioniert mit `npm run generate-backgrounds`.
- [ ] Bundle-Guard läuft im Build ohne Befund.

**Aufwand:** 1 h (zzgl. Key-Rotation im Google-Console-Login) · **Abhängigkeiten:** keine

---

## AP-06 — `sdmx.ts` Kleinigkeiten

### Fehleranalyse (Datei vollständig reviewt)

1. **Prod-Logging:** [sdmx.ts:127](../src/api/sdmx.ts): `console.log('[SDMX] Found … series …')` bei jedem Data-Load im Browser.
2. **Dummy-Dataflows in Fallbacks:** [sdmx.ts:165](../src/api/sdmx.ts) und [:204](../src/api/sdmx.ts) bauen `fetchData`-Fallbacks mit erfundenen Objekten `{ …, category: 'klima' }` — irreführendes Attribut, dreimal dupliziertes flowRef-Parsing (`split(',')`-Logik).
3. **Kein Promise-Dedup für JSON:** `cachedFetchJson` (Zeilen 9–61) cacht erst *fertige* Responses. Parallele First-Loads derselben URL (z. B. mehrere Chart-Komponenten im selben Render) feuern mehrfach aufs Netz. `fetchCsvText` (Zeilen 215–235) macht es mit Promise-Caching **richtig** — Pattern existiert also schon im File.

### Lösungsansatz

1. Log hinter Flag: `if (import.meta.env.DEV) console.log(...)` — oder ganz entfernen.
2. Kleinen Helper extrahieren und in beiden Fallbacks nutzen:
   ```ts
   function splitFlowRef(flowRef: string): { agencyID: string; id: string; version: string } {
     const parts = flowRef.split(',')
     return { agencyID: parts[0] || 'UBA', id: parts[1] ?? flowRef, version: parts[2] ?? '1.0' }
   }
   ```
   Und statt des Dummy-Dataflow-Objekts die Felder direkt übergeben (Signaturen von `fetchData` ggf. auf `{agencyID,id,version}` verschlanken — Breaking Change nur intern, Aufrufer prüfen).
3. Promise-Dedup für JSON analog `fetchCsvText`:
   ```ts
   const inflight = new Map<string, Promise<unknown>>()
   async function cachedFetchJson<T>(url: string, headers?: Record<string,string>, ttlMs = 3600_000): Promise<T> {
     const mem = memoryCache.get(url)
     if (mem && Date.now() - mem.timestamp < ttlMs) return mem.data as T
     const existing = inflight.get(url)
     if (existing) return existing as Promise<T>
     const p = doFetchAndStore<T>(url, headers, ttlMs)   // bestehende Logik
     inflight.set(url, p)
     p.finally(() => inflight.delete(url))
     return p
   }
   ```
   (sessionStorage-Lese-/Schreiblogik unverändert in `doFetchAndStore` verlagern.)

### Akzeptanzkriterien

- [ ] Kein `[SDMX]`-Log in Production-Build-Konsole.
- [ ] Netzwerk-Tab: beim Erstladen einer Seite mit mehreren gleichzeitigen Calls desselben Datensatzes nur 1 Request pro URL.
- [ ] `npx tsc --noEmit` grün; Smoke: 2–3 Datensatzseiten laden wie zuvor.

**Aufwand:** 1–2 h · **Abhängigkeiten:** kann mit AP-09 kombiniert werden (gleiche Datei)

---

## AP-07 — Repo- & Dependency-Hygiene

### Fehleranalyse

**Stale, aber getrackte Root-Dateien** (letzter Commit jeweils Mai 2026):

| Datei | Stand | Anmerkung |
|---|---|---|
| `tasks.md` | 05.05. | alt |
| `progress.md` | 07.05. | alt |
| `findings.md` | 07.05. | alt |
| `task_plan.md` | 07.05. | alt |
| `brandkit.html` | 08.05. | 21 KB Design-Referenz |
| `CHANGELOG.md` | 07.05., v0.7.1 | **irreführend**: seither landeten u. a. Hitze-Karte, Wind/Solar, Regionen, Vergleich, Social-Export — Changelog endet davor |

**Dependencies falsch einsortiert / ungenutzt** ([package.json](../package.json)):

- `@google/genai` in `dependencies` (Zeile 18) — Verbraucher nur Build-Scripts + toter Code → gehört in `devDependencies`.
- `@types/d3-geo` in `dependencies` (Zeile 19) — Typen → `devDependencies`.
- `d3-path` als direkte Dependency (Zeile 20) — **0 direkte Verwendungen**; nur transitiv via d3-geo/recharts. Wird allein namentlich in `manualChunks` erwähnt ([vite.config.ts:75](../vite.config.ts)); das Match läuft über `id.includes('node_modules/d3-path')` und funktioniert auch für transitive Module → Direktdep kann raus (nach Entfernen build-verifizieren!).

### Lösungsansatz

1. `git rm tasks.md progress.md findings.md task_plan.md brandkit.html` (falls Inhalte wichtig: vorher nach `docs/archiv/` verschieben).
2. CHANGELOG-Entscheidung treffen: (a) Lücke mit Stichworten Juni–August 2026 nachtragen, oder (b) Changelog verwerfen und README-Features als Quelle pflegen. Empfehlung: (a) mit 10 Einzeilern — die Versionierung v0.x ist ohnehin informell.
3. Dep-Umsortierung + `d3-path` entfernen → `npm install` → `npm run build` → Prerender zählen (90 Routen müssen unverändert durchlaufen; Vendor-Chunks prüfen, dass `vendor-d3` weiterhin entsteht).

### Akzeptanzkriterien

- [ ] `git ls-files | grep -E "^(tasks|progress|findings|task_plan)\.md|brandkit"` → leer.
- [ ] `npm ls d3-path` zeigt es nur noch als transitives Paket.
- [ ] Build + Prerender unverändert grün; `dist/assets/vendor-d3-*.js` existiert weiterhin.

**Aufwand:** 1 h · **Abhängigkeiten:** keine (Teile berühren AP-05/AP-16)

---

# Welle 2 — Architektur-Konsolidierung

## AP-08 — Zentrale Formatierungs-Lib `src/lib/format.ts`

### Fehleranalyse

Zahlenformatierung wird aktuell in **17 Dateien** individuell implementiert (`toLocaleString`/`toFixed`-Varianten, eigene `fmt*`-Funktionen). Verifizierte Verteilung:

```
ChartStyles, ClimateChart, CompareChart, EconomyChart, HeatExportCard,
HeatMap, HeatRecordMap, HeatRecords, heatShared, SolarMap, WindParkStories,
WindTurbineMap, SocialCardStory, AnalysePage, DashboardPage, DatasetPage, RegionalPage
```

Konsequenz: Inkonsistente Darstellung zwischen Seiten (Dezimalstellen, Tausenderpunkte, Prozent), und Bugfixes (z. B. „German number locale" im Social-Commit vom 24.08.) müssen N-mal nachgezogen werden.

### Lösungsansatz

1. Neues Modul mit kleiner, bewusst knapper API:
   ```ts
   /** Deutsche Zahlformatierung: 1234.5 → "1.234,5" */
   export function fmtNum(v: number, maxDigits = 1): string
   export function fmtInt(v: number): string                 // ganzzahlig, tausendertrennt
   export function fmtPct(fraction: number, digits = 1): string  // 0.153 → "15,3 %"
   export function fmtCompact(v: number): string             // 4_200_000 → "4,2 Mio."
   export function fmtSigned(v: number, digits = 1): string  // "+12,3" / "−4,5"
   export function fmtYear(y: number | string): string
   ```
   Implementierung über Intl: `new Intl.NumberFormat('de-DE', { maximumFractionDigits: maxDigits })`.
2. **Migrationsstrategie (wichtig, nicht Big-Bang):** Pro Seite/Component ein eigener Commit: lokale `fmt`-Funktion löschen, Import aus `lib/format`. Reihenfolge nach Duplikatgröße: erst die Charts (heatShared als Muster, da bereits Shared), dann Pages. Nach jedem Schritt visuell prüfen (die Formate dürfen sich minimal unterscheiden — vorher Screenshots/Erwartungen notieren).
3. Sonderfälle zuerst klären, bevor migriert wird: Wissenschaftliche Notation (`1.2e-6`, siehe README „Extrem kleine Messwerte"), dynamisches Font-Scaling im Social-Card (hängt an Zeichenlänge — `fmtCompact` hilft), Export-Kontexte (HeatExportCard braucht evtl. feste Dezimalstellen).

### Akzeptanzkriterien

- [ ] `grep -rln "toLocaleString\|toFixed" src/` reduziert von 17 auf ≤ 3 Dateien (Rest bewusst dokumentiert).
- [ ] Visueller Abgleich auf /regionen, /vergleich, /hitze, /wind, /solar und 2 Dataset-Seiten ohne Regression.
- [ ] Unit-Tests für die Lib existieren (mit AP-13).

**Aufwand:** 0,5–1 Tag · **Abhängigkeiten:** idealerweise nach AP-13 (Tests zuerst schreiben)

---

## AP-09 — SDMX-Parser konsolidieren

### Fehleranalyse

In [sdmx.ts](../src/api/sdmx.ts) existiert die CSV-Parsing-Logik **dreimal** nahezu identisch (Separator-Erkennung `;` vs. `,`, Header-Trim, TIME_PERIOD/OBS_VALUE-Spaltenindex, Zeilen-Split):

1. `fetchCsvSeries` (Zeilen 248–264)
2. Sparse-CSV-Fallback innerhalb von `fetchData` (Zeilen 559–621)
3. Implizit die Fallback-Ketten in `fetchAveragedSeries`/`fetchSingleSeries` (Zeilen 161–175 / 200–212), die zudem beide dieselbe `split(',')`-flowRef-Logik duplizieren (→ AP-06 Punkt 2).

Außerdem: `fetchData` gibt `structure: null` immer zurück (Interface behauptet `DatasetStructure | null`, Aufrufer bekommen nie etwas anderes) — tote API-Oberfläche.

### Lösungsansatz

1. Einen kanonischen Parser extrahieren:
   ```ts
   export interface ParsedSdmxCsv {
     colIds: string[]                       // Dimensions-Spalten-IDs in Reihenfolge
     rows: Array<{ codes: string[]; time: string; value: number | null }>
   }
   export function parseSdmxCsv(text: string): ParsedSdmxCsv { /* einmal implementieren */ }
   ```
   Alle drei Stellen konsumieren davon. `fetchCsvSeries` wird zum Thin Wrapper (Grouping by code-key), der Sparse-Fallback in `fetchData` ebenso.
2. Fallback-Ketten vereinheitlichen: gemeinsamer Helper `withCsvFallback(flowRef, key, jsonFn)` — JSON-Versuch, bei Leer-/Fehlerfall CSV-Pipeline. `fetchAveragedSeries`/`fetchSingleSeries` nutzen ihn.
3. Return-Shape von `fetchData` aufräumen (`structure` strengen oder liefern — Entscheidung dokumentieren; Aufrufer: DatasetPage).

### Akzeptanzkriterien

- [ ] CSV-Parsing existiert genau einmal (`grep -c "OBS_VALUE" src/api/sdmx.ts` → 1 Fundstelle + Tests).
- [ ] Fixture-Tests (AP-13): echte CSV-Samples (`,`- und `;`-separiert, mit `\r\n`) parsen identisch wie zuvor.
- [ ] Smoke: 3 Datensätze inkl. eines Sparse-Fallback-Kandidaten laden unverändert.

**Aufwand:** 0,5 Tag · **Abhängigkeiten:** mit AP-06 kombinierbar; Tests via AP-13

---

## AP-10 — `useAsync`-Hook mit AbortController

### Fehleranalyse

Jede Page rollt ihr eigenes Fetch-Muster (`useEffect`-Zählung verifiziert): DashboardPage 5×, DatasetPage 4×, AnalysePage/CatalogPage/ComparePage/SocialPreviewPage je 2× — jeweils mit eigenem `useState`-Loading/Error-Pair (5–7 `setLoading*`-Aufrufe pro Page). Probleme:

- **Kein Abbruch:** Navigation während laufender Requests → Race-Conditions (spätes `setState` nach Unmount), unnötiger Traffic.
- **Kein einheitlicher Zustands-Typ:** Jede Page definiert loading/error leicht anders → inkonsistente UI-Zustände.
- Erweiterungen (Retry, Stale-While-Revalidate) müssten N-mal gebaut werden.

### Lösungsansatz

```ts
// src/hooks/useAsync.ts
import { useEffect, useState, type DependencyList } from 'react'

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T }

export function useAsync<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  useEffect(() => {
    const ac = new AbortController()
    setState({ status: 'loading' })
    fn(ac.signal)
      .then((data) => { if (!ac.signal.aborted) setState({ status: 'success', data }) })
      .catch((err) => {
        if (ac.signal.aborted || err?.name === 'AbortError') return
        setState({ status: 'error', error: err })
      })
    return () => ac.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
```

Hinweise:

- Die Fetch-Funktionen in `sdmx.ts` müssten optional ein `signal` an ihr internes `fetch` durchreichen (Parameter ergänzen, `cachedFetchJson(url, headers, ttl, signal)`).
- Migration inkrementell pro Page (ein PR/Page), Start mit ComparePage (kleinste mit Fetch) als Pilot.
- Für Seiten, die Daten parallel + sequenziell mischen (DashboardPage), lohnt zusätzlich ein Blick auf `Promise.all`-Gruppierung statt vieler Einzel-Effects.

### Akzeptanzkriterien

- [ ] Pilotseite nutzt `useAsync`; schneller Seitenwechsel hinterlässt keine Warnungen („setState after unmount"-Art) und keine Zombie-Requests im Netzwerk-Tab.
- [ ] Loading/Error-UI pro Seite unverändert funktional.

**Aufwand:** 0,5 Tag Hook + Migration nach Bedarf · **Abhängigkeiten:** keine

---

## AP-11 — Choropleth-Basiskomponente aus den 4 Karten

### Fehleranalyse

Fünf Dateien betreiben eigenes d3-Geo-Projektions-/Path-Setup (Grep verifiziert): [GermanyMap.tsx](../src/components/charts/GermanyMap.tsx) (158 Z.), [HeatMap.tsx](../src/components/charts/HeatMap.tsx) (279 Z.), [SolarMap.tsx](../src/components/charts/SolarMap.tsx) (338 Z.), [WindTurbineMap.tsx](../src/components/charts/WindTurbineMap.tsx) (407 Z.), plus [heatShared.ts](../src/components/charts/heatShared.ts) (98 Z.) — letztere ist bereits der richtige erste Abstraktionsschritt (geteilte Projektion/Farbkonstanten der Heat-Familie). Gemeinsame Substanz: GeoJSON-Laden, Projektionsfit, Pfadgenerierung, Zoom/Pan, Hover-Tooltip, Legende, Farbskala.

### Lösungsansatz (phasig, kein Big Bang)

1. **Phase A — Helper-Layer (niedriges Risiko):** `src/lib/geo.ts` mit `loadGeo(path): Promise<GeoPermissibleObjects>`, `makeProjection(geojson, width, height)` (zentrale Wahl der Projektion inkl. d3-geo-Winding-Fix — siehe PV-Karten-Historie, CW-Fix), `pathGenerator`-Factory. Die 4 Karten nutzen diese Helpers, Verhalten byte-identisch.
2. **Phase B — Gemeinsame Tooltip/Legende-UI:** `MapTooltip`- und `ColorLegend`-Komponenten (rein präsentational), von HeatMap/WindTurbineMap übernommen.
3. **Phase C — (optional, erst wenn A+B stabil):** Echte `ChoroplethMap`-Basiskomponente mit Props `{ geoUrl, values: Record<regionKey, number>, colorScale, onClick, children }`. WindTurbineMap (Punkt-Layer animiert) passt nicht in reines Choropleth-Schema → bleibt Spezialfall auf Helper-Basis.

### Akzeptanzkriterien

- [ ] Phase A: alle vier Karten rendern pixelgleich (Vorher/Nachher-Screenshot-Vergleich).
- [ ] Projektion/Winding nur noch an einer Stelle definiert.

**Aufwand:** Phase A 0,5 Tag; B +0,5; C +1 Tag · **Abhängigkeiten:** nach AP-08/13 sinnvoll, nicht zwingend

---

## AP-12 — Export-System konsolidieren

### Fehleranalysis

PNG-Export via html-to-image existiert **5×**: [ExportModal.tsx](../src/components/ExportModal.tsx) (155 Z.), [HeatExportCard.tsx](../src/components/charts/HeatExportCard.tsx) (166 Z.), [HeatExportModal.tsx](../src/components/charts/HeatExportModal.tsx) (86 Z.), [SocialCardModal.tsx](../src/components/social/SocialCardModal.tsx) (204 Z.), [SocialPreviewPage.tsx](../src/pages/SocialPreviewPage.tsx) (207 Z.). Dazu `navigator.share` **2×** (HeatExportModal, SocialCardModal). Gemeinsame Substanz: DOM-Node → PNG (Skalierung/Background/Fonts), Download-Fallback, Web-Share-API, Modal-Shell mit Vorschau.

### Lösungsansatz

1. `src/lib/capture.ts`:
   ```ts
   export async function capturePng(node: HTMLElement, opts?: {
     scale?: number            // default 2 (Retina)
     backgroundColor?: string  // default '#0f172a' je nach Card-Theme
   }): Promise<Blob>
   export async function shareOrDownload(blob: Blob, filename: string, shareText?: string): Promise<'shared' | 'downloaded'>
   ```
   (`shareOrDownload` kapselt den `navigator.share`-Feature-Detect + `a[download]`-Fallback; beide vorhandenen Implementierungen als Referenz.)
2. Die 5 Oberflächen bleiben bestehen (sie haben unterschiedliche Layouts!), rendern aber alle über `capturePng` + `shareOrDownload`. Damit sind Skalierung, Font-Handling (self-hosted Fonts!) und Fehlbehandlung an einem Ort.
3. Bekannte html-to-image-Stolpersteine zentral lösen: Font-Embedding (lokale Fonts laden lassen statt CORS-Fetch), `filter: inset` für externe Nodes, Safari-Quirk `backgroundColor` erzwingen.

### Akzeptanzkriterien

- [ ] `toPng(`-Aufrufe existieren nur in `capture.ts`.
- [ ] Export auf allen 6 Seiten (/dataset, /hitze ×2, /regionen, /vergleich, /wind, /solar, /social-preview) erzeugt identische Bilder wie zuvor.
- [ ] Share-Fallback funktioniert in Browsern ohne Web-Share-API (Desktop Firefox).

**Aufwand:** 1 Tag · **Abhängigkeiten:** keine

---

# Welle 3 — Qualitätssicherung

## AP-13 — Vitest aufsetzen + Unit-Tests an Bug-Hotspots

### Fehleranalyse

Testinfrastruktur: keine. `npm test` führt [test-sdmx.ts](../scripts/test-sdmx.ts) aus (36 Zeilen, Live-Netzwerktest gegen daten.uba.de) — weder deterministisch noch CI-tauglich. Die letzten Wochen an Commits waren Bugfixes in genau den Bereichen, die Unit-Tests am billigsten absichern würden (Index-Basiswert im Vergleichsmodus, Locale-Formatierung, SDMX-URL-Fallbacks).

### Lösungsansatz

1. Setup:
   ```bash
   npm i -D vitest
   ```
   `vite.config.ts` ergänzen (test-Block; jsdom nur falls Komponententests später — für Parser/Format-Libs reicht Node):
   ```ts
   /// <reference types="vitest/config" />
   export default defineConfig({
     // …bestehende Plugins…
     test: { environment: 'node', include: ['tests/**/*.test.ts'] },
   })
   ```
   `package.json`: `"test": "vitest run"`, `"test:api": "tsx scripts/test-sdmx.ts"` (Live-API-Smoke umbenannt, bleibt manuelles Werkzeug).
2. **Priorität 1 — reine Funktionen mit hohem Regressionwert:**
   - `parseSdmxCsv` (nach AP-09): Fixtures mit `,`/`;`, CRLF, Leerspalten, `-999`-NoData.
   - `lib/format` (nach AP-08): De-Locale, Compact, Signed, Extremwerte (1.2e-6).
   - Korrelations-/Index-Mathe aus ComparePage (`/vergleich`): Pearson-r, Index=100-Basisjahr — die Logik aus der Page in `src/lib/stats.ts` extrahieren und testen (Extraktion ist Teil dieses APs).
   - Aggregationen in `heatShared.ts` (Landkreis→BW-Mittel etc.).
3. Ordnerkonvention: `tests/unit/*.test.ts`; Fixtures unter `tests/fixtures/*.csv`.

### Akzeptanzkriterien

- [ ] `npm test` läuft offline, deterministisch, < 10 s.
- [ ] ≥ 15 Tests über Parser/Format/Stats/heatShared.
- [ ] Ein bewusst eingefügter Parser-Bug wird vom Test erkannt (Mutations-Sanity-Check).

**Aufwand:** 0,5–1 Tag · **Abhängigkeiten:** AP-08/09 erhöhen den Wert, sind aber kein Blocker

---

## AP-14 — CI PR-Gate

### Fehleranalyse

Es existiert nur [deploy.yml](../.github/workflows/deploy.yml) mit Triggern `push:[main]`, `schedule`, `workflow_dispatch` (Zeilen 3–9). **Kein Workflow reagiert auf Pull Requests.** `npm run lint` wird von keinem Workflow aufgerufen; der einzige automatische Gate ist `tsc -b` innerhalb des Builds — **nach** dem Merge auf main. Branch-Historie zeigt aktiven PR-Workflow (#19/#20) — Gates fehlen also trotz PR-Nutzung.

### Lösungsansatz

Neue Datei `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
  push:
    branches-ignore: [main]   # optional: Feature-Branch-Pushes ebenfalls prüfen

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test          # nach AP-13; vorher auskommentiert lassen
```

Zusätzlich:

- In den Repo-Settings `lint`/`test` als Required Status Checks aktivieren (Schutz auch für Direktpushes auf main wirksam, falls Branch-Protection aktiv ist).
- deploy.yml unverändert lassen (Deploy bleibt Push-gated auf main); langfristig Deploy nur erlauben, wenn CI grün war (über Branch Protection `main`).

### Akzeptanzkriterien

- [ ] PR mit Lint-Fehler ⇒ rotes Häkchen.
- [ ] main-Push deployed weiterhin automatisch.

**Aufwand:** 1–2 h · **Abhängigkeiten:** Tests (AP-13) optional einhängbar

---

# Welle 4 — Datenpipelines

## AP-15 — DWD-Pipeline härten

### Fehleranalyse (Datei vollständig reviewt: [build_heat_thresholds.py](../scripts/dwd/build_heat_thresholds.py))

1. **Stiller Stationsverlust:** `process_station()` (Zeilen 173–179) fängt jede Exception und verwirft sie:
   ```python
   except Exception as e:
       return sid, bl, name, lat, lon, {}     # e wird nie geloggt!
   ```
   Eine ausgefallene Station fehlt dann in der `max()`-Aggregation (Zeilen 189–192, Rekordbildung 202, 206) → **plausibel wirkende, zu niedrige Allzeit-Rekorde**. Ebenso still: `station_daily_max()` schluckt Recent-ZIP-Fehler (Zeilen 148–149 `except Exception: pass`).
2. **Keine Retry-Logik** projektweit (0 Treffer), Timeout pauschal 30 s (Zeile 63).
3. **Keine Plausibilitätsprüfung** vor Überschreiben von `public/heat_thresholds.json` (Zeile 248) — ein schlechter Lauf wird ungeprüft deployt.
4. **CI ohne Fehlertoleranz:** [deploy.yml](../.github/workflows/deploy.yml) DWD-Step ohne `continue-on-error`; `file_map()` (Zeilen 88–94) hat **gar kein** try/except — fällt das DWD-Directorylisting aus, bricht der komplette Deploy (auch für reine Frontend-PRs). `recent_file_map()` dagegen fängt ab (Zeilen 97–107) — inkonsistente Strategie.
5. **Cache gitignored** (`cache_kl/`, .gitignore Zeile 45) → jeder Cron-Lauf lädt ~1000 Station-ZIPs frisch (gewollt für Frische, aber ohne Backoff riskant ggü. DWD-Server).
6. **Cron-Ergebnis committet nicht zurück:** Die aktualisierte JSON existiert nur im CI-Workspace/Gh-Pages-Artefakt; `--skip-if-exists` (Zeilen 159–161) lässt Push-Builds mit der älteren committeten Version laufen → Repo und Produktion driften.
7. Python-Setup in CI **ohne pip/requirements.txt** — funktioniert nur, weil das Script stdlib-only ist; jede neue Abhängigkeit bricht den Deploy.

### Lösungsansatz

1. **Sichtbarkeit:** In `process_station` Fehler sammeln statt verschweigen:
   ```python
   errors = []
   def process_station(sid):
       ...
       except Exception as e:
           errors.append((sid, repr(e)))
           return sid, bl, name, lat, lon, {}
   # nach dem Pool:
   print(f"⚠️ {len(errors)} Stationen fehlgeschlagen")
   for sid, err in errors[:20]: print(f"   {sid}: {err}")
   if len(errors) > len(sids) * 0.1:
       sys.exit(f"❌ {len(errors)} Stationen fehlgeschlagen — Abbruch, keine Überschreibung.")
   ```
   Ebenso `except Exception: pass` in `station_daily_max` mindestens per `print` protokollieren.
2. **Retry mit Backoff** in `fetch()`:
   ```python
   def fetch(url, tries=3):
       for i in range(tries):
           try:
               req = urllib.request.Request(url, headers={"User-Agent": UA})
               return urllib.request.urlopen(req, timeout=30).read()
           except Exception:
               if i == tries - 1: raise
               time.sleep(2 ** i)
   ```
3. **Sanity-Check vor Schreiben:** Vorherige `heat_thresholds.json` laden und vergleichen:
   - nationaler Rekord darf nicht um > 0,5 °C sinken,
   - `dataThrough` darf nicht älter werden,
   - je Bundesland muss `record.temp` vorhanden sein.
   Bei Verstoß: Abbruch (Exit 1) statt Deploy.
4. **Deploy-Step entschärfen** ([deploy.yml](../.github/workflows/deploy.yml)): Beim `schedule`-Lauf voller Build; bei `push` gilt heute `--skip-if-exists` (ok). Zusätzlich absichern: `file_map()` mit try/except → bei Listing-Ausfall Exit 1 nur im Schedule-Modus, im Push-Modus mit Warnung weiter (committete Daten nutzen).
5. **Commit-back:** Im Workflow nach dem DWD-Step (nur bei `schedule`):
   ```yaml
   - name: Commit fresh heat data
     if: github.event_name == 'schedule'
     run: |
       git config user.name "github-actions[bot]"
       git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
       git add public/heat_thresholds.json
       git diff --cached --quiet || git commit -m "data: weekly DWD heat threshold refresh"
       git push
     ```
   Danach läuft der normale Build mit den frischen Daten; Repo und Produktion bleiben synchron. (Alternative: separater Daten-Workflow, der nur committet und den Deploy-Trigger per push ereignen lässt.)
6. **requirements.txt** anlegen (auch wenn heute stdlib-only — dokumentiert die Absicht):
   ```
   # aktuell stdlib-only; bewusst keine Runtime-Abhängigkeiten
   ```
   Oder weglassen und im Script-Header dokumentieren. Entscheidung dokumentieren!

### Akzeptanzkriterien

- [ ] Simulierter Stationsausfall (URL manipuliert) ⇒ Log nennt Station + Anzahl; > 10 % ⇒ Exit 1 ohne Überschreibung.
- [ ] Sanity-Check: manipulierte kleinere JSON ⇒ Abbruch.
- [ ] Montag-Cron committet `public/heat_thresholds.json` zurück auf main (nach erstem Cron-Lauf prüfen).
- [ ] DWD-Listing-Ausfall simuliert ⇒ Push-Deploy bricht NICHT ab.

**Aufwand:** 0,5–1 Tag · **Abhängigkeiten:** keine; Test der Cron-Pfade dauert bis zum nächsten Montag-Lauf

---

## AP-16 — MaStR-Pipeline reproduzierbar machen + Frische-Badges

### Fehleranalyse

Die Wind-/Solar-Daten sind die größten Assets der Seite (`wind_units.json` 1,29 MB vom 11.06., `pv_points.json` 452 KB vom 23.06.) — **vollständig manuell erzeugt, Bus-Faktor 1**:

- Download via `open_mastr` (~4 GB gezippt, 10–30 min, dokumentiert in [phase0_download.py](../scripts/mastr/phase0_download.py))
- `build_wind_json.py` liest SQLite unter `Path.home()/".open-MaStR"/data/sqlite/open-mastr.db` (~Zeile 19) — maschinenspezifischer Pfad
- `build_pv_json.py` globs lokales `Gesamtdatenexport_*.zip` (Zeilen 27–29) + eigener UTF-16-XML-Streamparser
- **`open_mastr` ist nirgends deklariert** — kein requirements.txt/pyproject; nur im ungetrackten `.venv-mastr/`
- Error-Handling praktisch nicht vorhanden (build_wind_json: 0 except)
- Ein automatischer Refresh-Cron ist unrealistisch (4 GB in GitHub-Actions, Disk/Timeout-Limits) — anders als der DWD-Fall.

### Lösungsansatz

1. **Reproduzierbarkeit statt Automatisierung:** `scripts/mastr/requirements.txt` mit gepinnter Version (`open-mastr==0.17.1` o.ä. — die tatsächlich genutzte aus `.venv-mastr` auslesen: `pip freeze | grep mastR`) + kurzes `scripts/mastr/README.md` als Runbook (Schritte 1–5, geschätzte Dauer, bekannte Stolpersteine: UTF-16, `solar_extended`-Lücke, neuesten Export nehmen — siehe Datenkorrektur-Historie vom 23.06.).
2. **Home-Pfad konfigurierbar machen:** `MASTR_DB_PATH` env-var mit Fallback auf `Path.home()/.open-MaStR/...`.
3. **Frische transparent machen:** Die `*_summary.json` enthalten bereits Zeitstempel (prüfen: Feldname je Summary). Auf `/wind` und `/solar` ein dezentes Badge anzeigen: `„Datenstand: 11.06.2026 · Marktstammdatenregister"`. Das ist die ehrliche UX-Antwort, solange ein Monats-Cron nicht machbar ist.
4. **Quarterly-Erinnerung:** GitHub Scheduled Task / Calendar-Eintrag „MaStR-Refresh Q4" — oder, falls Martin einen Always-on-Rechner hat: selbstgebauter Scheduler außerhalb von Actions. Bewusste Entscheidung dokumentieren.

### Akzeptanzkriterien

- [ ] Frisches Clone + `pip install -r scripts/mastr/requirements.txt` + Runbook ⇒ Pipeline läuft auf fremder Maschine durch.
- [ ] /wind und /solar zeigen den Datenstand sichtbar an.

**Aufwand:** 0,5 Tag · **Abhängigkeiten:** keine (Refresh selbst separat terminieren)

---

## AP-17 — Deploy-Robustheit: Chrome-Pinning, 404.html, social-bg-Gewicht

### Fehleranalyse

1. **Chrome-.deb ungepinnt bei jedem Deploy** ([deploy.yml](../.github/workflows/deploy.yml), Chrome-Step): `wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb` ohne Retry/Checksum/Versionspin. Ein CDN-Ausfall oder breaking change killt ALLE Deploys.
2. **404.html wird VOR dem Prerender kopiert** ([vite.config.ts:56-62](../vite.config.ts)): Nutzer, die eine unbekannte URL treffen, erhalten die ungerenderte SPA-Shell (leerer Head, kein Titel, kein CSS-Render-Inhalt bis JS läuft).
3. **`public/social-bg/` = 22 MB von 34 MB** Gesamt-Assets (14 JPGs), obwohl nur im Social-Export-Modal genutzt. GitHub Pages liefert alles aus; kein User-Payload-Problem solange lazy geladen, aber Repo/Deploy-Größe und Cache-Warmup leiden.

### Lösungsansatz

1. Chrome cachen + pin:
   ```yaml
   - name: Cache Chrome deb
     uses: actions/cache@v4
     with:
       path: google-chrome-stable_current_amd64.deb
       key: chrome-stable-${{ hashFiles('.github/workflows/chrome-version.txt') }}
   - run: |
       [ -f google-chrome-stable_current_amd64.deb ] || wget -q --tries=3 https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
       sudo apt-get install -y ./google-chrome-stable_current_amd64.deb
   ```
   Versionsbump durch Commits an `chrome-version.txt` (bewusst manueller Pin).
2. 404-Rendering: In [prerender.ts](../scripts/prerender.ts) nach dem Root-Loop das fertige `dist/index.html`-Äquivalent als `dist/404.html` schreiben (Root-Route-Output kopieren, canonical/robots `noindex` patchen). Vite-Plugin (copy-404) entfernen. Alternativ: eigene kleine 404-Seite prerendern.
3. social-bg: Bilder nach WebP konvertieren (`cwebp -q 80`, typ. −60–70 %) und im Modal `image/webp` mit JPEG-Fallback laden; oder auf 1280px-Breite downsizen (Modal rendert eh skaliert). Ziel: < 8 MB.

### Akzeptanzkriterien

- [ ] Zwei aufeinanderfolgende Deploy-Läufe: zweiter nutzt gecachte .deb (Log prüfen).
- [ ] `curl https://www.umweltpuls.de/foo-bar` (nach Deploy) liefert gerenderte 404 mit Titel + noindex.
- [ ] `du -sh public/social-bg` < 8 MB; Export-Visuals unverändert.

**Aufwand:** 2–3 h · **Abhängigkeiten:** AP-02 (Plugin-Entfernung tangiert dieselbe Datei)

---

# Welle 5 — Features & Redaktion

## AP-18 — Redaktion: draft→reviewed-Review abschließen

**Kontext:** `datasetContent.ts` (1800 Zeilen) trägt redaktionelle Texte mit draft/reviewed-Status. Offen seit Mai: ~78 Einträge im draft-Status müssen inhaltlich geprüft werden (AI-generierte Descriptions aus `scripts/generate-descriptions.ts`, Claude-Key-basiert, hängen als draft an).

**Vorgehen:**
1. Inventur: `grep -c "status: 'draft'" src/data/datasetContent.ts` aktuellen Stand zählen.
2. Review-Schleife pro Kategorie (klima/energie/verkehr/…) mit Gegenprüfung gegen die echte Datensatzansicht (Titel, Lead, Zahlen im Text).
3. reviewed setzen; Kandidaten, die falsch/unbrauchbar sind: neu generieren (`npm run generate-descriptions`, Key per Shell-Env nötig — siehe AP-05) oder manuell schreiben.
4. Optional: UI-Hinweis für draft-Texte im Explorer (kleines „Redaktion in Arbeit"-Tag) bis Review abgeschlossen.

**Akzeptanz:** `status: 'draft'`-Count ≈ 0 oder dokumentierte Restliste. **Aufwand:** redaktionell, mehrere Sessions à 1–2 h.

## AP-19 — Feature: Zeitraum-Selektor AnalysePage

**Kontext:** Offener Punkt aus der Chart-Verbesserungsreihe (Schritt 2). Nutzer sollen den angezeigten Zeitraum eingrenzen können (z. B. 1990+, „letzte 20 Jahre", freie Spanne).

**Ansatz:** Gemeinsamer State pro ChartCard (oder global auf der AnalysePage): `range: [startYear, endYear]`. Umsetzung als Range-Slider (zwei Handles) + Presets. Filterung der bereits geladenen `TimePoint[]` (client-seitig, kein Refetch). Bei Trendberechnungen (CAGR etc., falls vorhanden) Basisjahr = gewählter Start. Auch für `/vergleich` wiederverwendbar (dort existiert bereits ein Startjahr — Harmonisieren!).

**Akzeptanz:** Selektor auf allen Analyse-Charts; Deep-Link-fähig (Query-Params `?from=&to=`). **Aufwand:** 0,5 Tag.

## AP-20 — Fix: Sub-Jahres-Granularität bricht Zeitachse

**Fehleranalyse:** Datensätze mit nicht-jährlichen Perioden brechen im Explorer (bekannt aus Datenhandbuch-Analyse):
- `DF_CLIMATE_ATMO_GHG_CONCENTRATION` — stündlich, ISO-Timestamps
- `DF_TRANSPORT_PUBLIC_PASSENGERS_BUS_TRAIN` — Quartale („2022-Q4")
- `DF_DAS_WASSER_WW_I_1` — monatlich („2002-04")

Die Sortierung `localeCompare` ([sdmx.ts:547](../src/api/sdmx.ts)) sortiert ISO-Strings zwar lexikalisch korrekt, aber Achsen-Rendering, Jahres-Extraktion (`year.slice(0,4)`-Annahmen) und Trendlogik gehen von Jahren aus.

**Lösungsansatz:** Zentrale Normalisierung im Data-Layer: Zeitwerte klassifizieren (`yearly | quarterly | monthly | subdaily`) und Optionen: (a) auf Jahre aggregieren (Mittel/Summe je nach Einheit — Summe für Passagiere, Mittel für Konzentr.), (b) Originalgranularität mit formatierten Labels. Standard: (a) aggregieren + Hinweis-Badge „auf Jahre aggregiert"; Detailansicht (b) als Toggle für Datensätze, wo die Granularität die Story ist (GHG-Konzentration: Saisonalität!). Kandidatenliste im Datenhandbuch pflegen.

**Akzeptanz:** Alle drei genannten Datensätze rendern sinnvoll; Badge zeigt Aggregation an. **Aufwand:** 0,5–1 Tag. **Priorität 🟠**, da Nutzer direkt auf kaputte Ansichten stoßen können.

## AP-21 — Feature: neue Analyse-Charts

Kandidaten aus der Datenhandbuch-Analyse (wenige Serien, lange Reihe, klare Story):
- `DF_ENERGY_AGEE_CAPACITY` (16 Serien, 1990–2025) — Stacked Area „Ausbau Kapazitäten AGEE"
- `DF_TRANSPORT_VEHICLE_STOCK_TREND` (5 Serien, 1991–2025) — Bestandstrends
- `DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA` (12 Serien, 1991–2023) — existiert als Special-View (ForestFiresAnalysis), Einbau in /analysen prüfen
- `DF_DAS_WASSER_WW_I_6` Niedrigwasser (2 Serien) — sehr klare Aussage

**Vorgehen je Chart:** In AnalysePage-Chart-Konfiguration registrieren (CSV-first via `fetchCsvAveraged`/`fetchNamedSeries` — etabliertes Muster), Story-Text, ggf. Custom-Chart-Typ. **Aufwand:** je 1–2 h.

## AP-22 — SEO: OG-Bilder für /regionen + /vergleich

**Analyse:** `ROUTE_IMAGES` ([prerender.ts:205-209](../scripts/prerender.ts)) kennt nur /wind, /solar, /hitze. Die zwei neuen Hauptseiten fallen aufs Generic-OG zurück. Pipeline existiert: SVG unter `public/og-*.svg` → `npm run generate-og-image` ([generate-og-image.cjs](../scripts/generate-og-image.cjs), Slugs hardcoded erweitern) → PNG; Mapping in ROUTE_IMAGES ergänzen. Gestaltung analog og-hitze.svg (Datenvisual-Motiv passend zur Seite). **Akzeptanz:** Facebook Sharing Debugger/Twitter Card Validator zeigen individuelle Bilder. **Aufwand:** 1 h zzgl. Design.

## AP-23 — SEO: `excludeFromCatalog`-Datasets sind indexierbare Waisen

**Analyse:** Alle 81 Dataset-Routen werden prerendert — inklusive der 4 mit `excludeFromCatalog` (z. B. Umweltbewusstseinsstudie, 47k Serien). Diese sind per Direktlink/Google indexierbar, tauchen aber NICHT in der Sitemap auf → inkonsistente Signale.

**Entscheidung nötig (2 Optionen):**
- (a) **noindex** für excluded: Im Prerender `<meta name="robots" content="noindex">` injizieren für Routen mit `excludeFromCatalog`. Konsistent: nicht katalogisiert ⇒ nicht indexiert. Empfehlung, da Gründe fürs Excluding (Nutzbarkeit/Performance/Umfragedaten) weiterhin gelten.
- (b) Katalogisierung zurücknehmen + Sitemap-Aufnahme, falls der Grund nur die Sitemap-Lücke war.

**Umsetzung (a):** In prerender.ts nach dem Snapshot: `if (DATASET_CONTENT[id]?.excludeFromCatalog) html = html.replace('</head>', '<meta name="robots" content="noindex"></head>')`. **Aufwand:** 1 h.

## AP-24 — Feature: Ko-Fi-Spendenbutton

**Kontext:** Entscheidung getroffen (Memory, Mai), nie umgesetzt. **Ansatz:** Ko-Fi-Button/Widget (externes Script vermeiden — DSGVO-Kontext! Besser: einfacher Link/Button auf /about + Footer, kein iframe/Script, kein Cookie-Thema). Platzierung: Footer (dezent) + AboutPage (kontextualisiert). Datenschutzerklärung um Verweis ergänzen (externe Seite beim Klick). **Aufwand:** 1 h.

---

# Anhang

## A. Verifizierte Kernbefunde (Evidence)

| Behauptung | Verifikation |
|---|---|
| Alle statischen Routen gleicher Titel | grep über `dist/<route>/index.html`, 24.08.-Build |
| `dist/index.html` hat 3 `<title>`-Tags (1 gültig, 2 leer) | grep `dist/index.html` |
| Deployte Sitemap 85 URLs ohne regionen/vergleich | grep `dist/sitemap.xml` vs. `public/sitemap.xml` (87) |
| Kein ErrorBoundary | Grep `ErrorBoundary\|componentDidCatch\|getDerivedStateFromError` in src/ → 0 |
| Kein PR-Workflow | `.github/workflows/` enthält nur deploy.yml |
| Gemini-Key nicht im Bundle | `grep -rl "AIzaSy" dist/assets/` → leer; `gemini.ts` hat keinen Importer |
| 17 Dateien mit eigener Zahlenformatierung | grep `toLocaleString\|toFixed\|formatNumber` |
| 5× html-to-image, 2× navigator.share, 5× d3-geo | grep je Pattern |
| CSV-Parsing 3× in sdmx.ts | Code-Review gesamt (629 Z.) |
| DWD: `process_station` verschluckt Fehler | build_heat_thresholds.py Zeilen 173–179 |
| Prerender: Exit nur bei ok==0 | prerender.ts Zeilen 410–411 |
| MaStR-Datenstand 11.06./23.06. | Dateidaten `public/*_summary.json`, `pv_points.json` |

## B. Umfeld & Kommandos

```bash
npm run dev          # Entwicklung
npm run lint         # ESLint (0 Errors/Warnings ist der Standard!)
npx tsc --noEmit     # Typcheck
npm run build        # sitemap → tsc → vite build → prerender (Playwright, Chromium nötig)
npm run preview      # dist lokal servieren
npm test             # aktuell: scripts/test-sdmx.ts (Live-API-Smoke; nach AP-13: Vitest)
```

Windows-Hinweis: Chromium-Pfade sind in `findChrom­ium()` ([prerender.ts:215-229](../scripts/prerender.ts)) inkl. `C:/Program Files/Google/Chrome/Application/chrome.exe` hinterlegt — lokales Chrome genügt, playwright-core bringt keine Browser mit.

## C. Bewusste Nicht-Themen dieser Analyse

- Design/UI-Überarbeitung der einzelnen Seiten (bewusst ausgeklammert — letzte Redesign-Welle erst am 24.08.).
- UBA-API-seitige Fehler (sparse JSON, Duplicate-Keys) — dokumentiert im technischen Bericht; Workarounds im Client sind implementiert.
- Analytics/DSGVO — GoatCounter cookielos eingerichtet (Stand 28.06.), kein Handlungsbedarf gesehen.
