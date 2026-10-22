# Design-Spezifikation: MiSpeL-Simulator (Stufe 1 – Pauschalrechner für Heimspeicher)

**Datum:** 22.10.2026  
**Status:** Genehmigt (Bereit zur Implementierungsplanung)  
**Rechtsstand:** Festlegung der Bundesnetzagentur zur Marktintegration von Speichern und Ladepunkten (MiSpeL), Az. 618-25-02, Beschluss vom 01.10.2026  
**Zielgruppe:** Betreiber von Photovoltaikanlagen bis 30 kWp mit Heimspeicher und/oder bidirektionalem Ladepunkt, Energieberater, Solarteure und interessierte Bürger  

---

## 1. Motivation und Zielsetzung

Mit Beschluss vom 01.10.2026 hat die Bundesnetzagentur (BNetzA) die Festlegung MiSpeL (Az. 618-25-02) erlassen. Sie regelt erstmals verbindlich, wie Stromspeicher und bidirektionale Ladepunkte im Mischbetrieb (Speicherung von Solar- und Netzstrom) betrieben werden dürfen, ohne die EEG-Marktprämie oder Umlageprivilegien nach dem Energie-Finanzierungsgesetz (EnFG) vollständig zu verlieren.

Die Festlegung bietet zwei Wege:
1. **Pauschaloption (Anlage 2):** Für Solaranlagen bis 30 kWp mit Heimspeicher und/oder bidirektionaler Wallbox. Ermöglicht die Inanspruchnahme ohne aufwendiges 2-Zähler-Messkonzept auf Basis normierter Jahresformeln.
2. **Abgrenzungsoption (Anlage 1):** Viertelstundengenaue Bilanzierung mit 2 Zählern und Monatssaldierung für Großspeicher und Anlagen > 30 kWp.

**Ziel von Stufe 1:**  
Die Plattform UBA-Datacube / Umweltpuls wird um eine interaktive, barrierefreie und formeltreue Anwendung erweitert: den **MiSpeL-Pauschalrechner für Heimspeicher (Stufe 1)**. Das Werkzeug beantwortet Bürgern sofort:
* Bin ich mit meiner Heimanlage für die Pauschaloption berechtigt?
* Wie teilen sich meine Einspeiseströme in förderfähige, indifferente und saldierungsfähige Mengen auf?
* Welcher finanzielle Vorteil (€/Jahr) entsteht gegenüber dem Verbleib in der festen EEG-Einspeisevergütung?
* Wie rechnet die Bundesnetzagentur die einzelnen Zwischenschritte nachweisbar ab (Formel-Lupe mit Fundstellen)?

---

## 2. Benutzererlebnis (UX) & Interaktionskonzept

Das UX-Konzept folgt dem im Visual-Brainstorming ausgewählten **Hybrid-Modus**:

```
+--------------------------------------------------------------------------+
|  [Header & Ampel]  MiSpeL-Simulator (Rechtsstand: 01.10.2026, Az. 618-25-02)|
|  Hinweis: Bis 30.09.2027 mit NB-Einverständnis · EU-Beihilfe schwebend   |
+--------------------------------------------------------------------------+
|  [1-Klick-Vorlagen]                                                      |
|  [ (•) Standard-EFH (10 kWp / 10 kWh) ]  [ PV + Wallbox ]  [ Klein (5/5) ]|
+--------------------------------------------------------------------------+
|  [Eingaben: Smart-Defaults mit Schiebereglern]                           |
|  • PV-Leistung: [ 10,0 ] kWp [===o===]                                   |
|  • Speicherkapazität: [ 10,0 ] kWh [===o===]                             |
|  • Jahres-Einspeisung: [ 6.000 ] kWh [====o==]                           |
|  • Jahres-Netzbezug: [ 2.500 ] kWh [==o====]                             |
|  • Option: [x] Bidirektionale Wallbox (Faktor 0,2)                       |
|  • Option: [ ] Steckersolar / Balkonkraftwerk vorhanden                  |
+--------------------------------------------------------------------------+
|  [Ergebnisvergleich: Status Quo vs. MiSpeL]                              |
|  ┌─────────────────────────┐       ┌─────────────────────────┐          |
|  │ STATUS QUO (Feste Verg.) │  vs.  │ MISPEL PAUSCHAL P1      │          |
|  │ 492 € / Jahr             │       │ 615 € / Jahr (+123 €)   │          |
|  └─────────────────────────┘       └─────────────────────────┘          |
|                                                                          |
|  [BNetzA-Stapelbalken (BITV 2.0 mit Kürzeln & Mustern)]                  |
|  [  4.000 kWh [G] Förderfähig  |  320 kWh [I]  |  1.500 kWh [N] Sald.  ] |
+--------------------------------------------------------------------------+
|  [Formel-Lupe & Prüfprotokoll (Aufklappbar)]                             |
|  ▸ Formel (P1) Pauschalgrenze Förderfähigkeit = 10 kWp × 500 = 5.000 kWh |
|  ▸ Formel (P2) Rechengröße Indifferenz = 0,1 × 10 / 10 = 0,10            |
|  ▸ Formel (P3) Indifferenzbereich = 0,10 × 5.000 = 500 kWh               |
|  ▸ ... Fundstellen BNetzA Anlage 2 Abschnitte 4.2.2 bis 4.2.5            |
+--------------------------------------------------------------------------+
```

### 1-Klick-Vorlagen
1. **Standard-Einfamilienhaus:** 10 kWp PV, 10 kWh Speicher, 6.000 kWh Einspeisung, 2.500 kWh Netzbezug.
2. **PV + Bidirektionale Wallbox:** 12 kWp PV, 10 kWh Speicher, bidirektionaler Ladepunkt (11 kW), 7.000 kWh Einspeisung, 4.000 kWh Netzbezug.
3. **Kompakte Kleinanlage:** 5 kWp PV, 5 kWh Speicher, 3.200 kWh Einspeisung, 1.800 kWh Netzbezug.
4. **Individuell:** Vollständig freie Konfiguration.

---

## 3. Architektur & Dateistruktur

Die Implementierung wird modular und typsicher aufgebaut. Die Rechenlogik hat null externe UI-Abhängigkeiten und kann vollständig isoliert getestet werden.

```
src/
├── lib/mispel/
│   ├── types.ts                     # Schnittstellen, Typen für Konstellation, Mengen & Audit
│   ├── constants.ts                 # Amtliche Parameter (500 kWh/kWp, Indifferenzfaktoren, Umlagen)
│   ├── pauschal.ts                  # Pure Functions für Formeln (P1) bis (P15)
│   ├── economics.ts                 # Wirtschaftlichkeitsvergleich Status Quo vs. MiSpeL
│   └── decisionTree.ts              # Eignungsprüfung (30-kWp-Grenze, Messkonzept, Fristen)
├── components/mispel/
│   ├── MispelPresetSelector.tsx     # 1-Klick Vorlagen-Buttons
│   ├── MispelInputs.tsx             # 4 Schieberegler mit synchronisierten Nummernfeldern
│   ├── MispelResultCards.tsx        # Euro-Vergleichskarten
│   ├── MispelEnergyBar.tsx          # BNetzA-Stapelbalken (dreifach kodiert: Farbe + Muster + Kürzel)
│   ├── MispelFormulaAudit.tsx       # Aufklappbare Formel-Lupe mit Rechenweg & Fundstelle
│   └── MispelStatusAlert.tsx        # Fristen-Ampel & rechtliche Hinweise
├── pages/
│   └── MispelPage.tsx               # Hauptseite unter Route /mispel
└── tests/unit/mispel/
    ├── pauschal.test.ts             # Golden Tests gegen BNetzA-Beispielrechnungen & Tabelle 1
    └── decisionTree.test.ts         # Tests für Berechtigungs- und Grenzwertprüfungen
```

---

## 4. Mathematische Formellogik (Anlage 2, BNetzA Az. 618-25-02)

Alle Formeln werden exakt nach der amtlichen Nummerierung der Festlegung umgesetzt:

| Formel | Bezeichnung | Mathematische Definition | Fundstelle |
|---|---|---|---|
| **(P1)** | Pauschalgrenze der Förderfähigkeit | $P_1 = P_{\text{inst}} \times 500\,\text{kWh/kWp}$ | Anlage 2, 4.2.2 |
| **(P2)P1** | Rechengröße Basisfall Speicher | $(P_2)_{P1} = 0{,}1\,\text{kWh/kW} \times \frac{P_{\text{inst}}}{SK_{\text{inst}}}$ | Anlage 2, 4.2.2 |
| **(P2)P2** | Rechengröße Basisfall Ladepunkt | $(P_2)_{P2} = 0{,}2$ (Endstand gem. Hintergrundpapier) | Anlage 2, 4.2.2 |
| **(P2)P3** | Rechengröße Speicher + Ladepunkt | $(P_2)_{P3} = \min[(P_2)_{P1};\, (P_2)_{P2}]$ | Anlage 2, 4.2.2 |
| **(P3)** | Indifferenzbereich | $P_3 = P_2 \times P_1$ | Anlage 2, 4.2.2 |
| **(P4)** | Pauschalgrenze der Saldierungsfähigkeit | $P_4 = P_1 + P_3$ | Anlage 2, 4.2.2 |
| **(P9)** | Grundsätzlich saldierungsfähige Menge | $P_9 = \max[\text{Einspeisung} - P_4;\, 0]$ | Anlage 2, 4.2.3 |
| **(P10)** | Saldierungsfähige Netzeinspeisung | $P_{10} = \min[P_9;\, \text{Netzbezug}]$ | Anlage 2, 4.2.3 |
| **(P11)** | Umlagebelasteter Netzbezug | $P_{11} = \text{Netzbezug} - P_{10}$ | Anlage 2, 4.2.3 |
| **(P15)** | Förderfähige Netzeinspeisung | $P_{15} = \min[\text{Einspeisung}_{\text{AW}>0};\, P_1]$ | Anlage 2, 4.2.5 |

### Sonderregelungen
* **Balkonkraftwerke / Steckersolargeräte:** Zählen gem. Voraussetzung 3 und § 24 Abs. 1 S. 5 EEG *nicht* für die 30-kWp-Grenze, wohl aber für die installierte Leistung $P_{\text{inst}}$ bei (P1) und dem Indifferenzbereich.
* **Negative Preise:** Einspeisung in Viertelstunden mit anzulegendem Wert $\le 0$ wird aus $P_{15}$ herausgerechnet (Standard-Abschlag bei vereinfachter Jahresbilanzierung: 3,5 % bzw. anpassbar).

---

## 5. Ökonomisches Modell (€/Jahr)

Vergleich zwischen zwei Szenarien:

### Szenario A: Status Quo (Klassische EEG-Einspeisevergütung)
$$\text{Erlös}_{\text{EEG}} = \text{Einspeisung} \times \text{Vergütungssatz (z. B. } 8{,}1\,\text{ct/kWh)}$$
$$\text{Bezugskosten}_{\text{EEG}} = \text{Netzbezug} \times \text{Haushaltsstrompreis (z. B. } 32{,}0\,\text{ct/kWh)}$$
$$\text{Jahresbilanz}_{\text{EEG}} = \text{Erlös}_{\text{EEG}} - \text{Bezugskosten}_{\text{EEG}}$$

### Szenario B: MiSpeL Pauschaloption P1 (Direktvermarktung mit Mischspeicher)
1. **Erlös Marktprämie & Marktwert:**
   $$\text{Erlös}_{\text{Förderung}} = P_{15} \times \text{Anzulegender Wert (z. B. } 8{,}1\,\text{ct/kWh)}$$
2. **Erlös freie Einspeisung oberhalb $P_4$:**
   $$\text{Erlös}_{\text{Markt}} = (P_9 - P_{10}) \times \text{Jahresmarktwert Solar (z. B. } 4{,}5\,\text{ct/kWh)}$$
3. **Ersparnis durch Saldierung ($P_{10}$):**
   Auf die saldierte Menge $P_{10}$ entfallen keine EnFG-Umlagen (KWKG-, Offshore-Umlage ca. 1,4 ct/kWh, Aufschlag besondere Netznutzung 1,6 ct/kWh = ca. 3,0 ct/kWh) und vermiedene Netzentgelte gem. § 118 Abs. 6 EnWG (ca. 4,5 ct/kWh).  
   $$\text{Ersparnis}_{\text{Saldierung}} = P_{10} \times (\text{Umlagen} + \text{Netzentgelte}) \approx P_{10} \times 7{,}5\,\text{ct/kWh}$$
4. **Mehrkosten:** Abzug für Direktvermarkter-Dienstleistungspauschale (z. B. ca. 50 €/Jahr bzw. 0,5 ct/kWh).
5. **Ergebnis:**
   $$\Delta \text{Vorteil} = \text{Jahresbilanz}_{\text{MiSpeL}} - \text{Jahresbilanz}_{\text{EEG}}$$

---

## 6. Barrierefreiheit (BITV 2.0 / WCAG 2.1 AA)

1. **Nicht-farbliche Dreifach-Kodierung:**
   * Förderfähige Menge: Dunkelgrün (`#15803d`), Vollton, Kürzel **[G]**.
   * Indifferenzbereich: Dunkles Ocker/Braun (`#ca8a04`), diagonale Schraffur, Kürzel **[I]**.
   * Saldierungsfähige Menge: Dunkles Blau (`#0284c7`), gepunktetes Muster, Kürzel **[N]**.
2. **Semantische Formulare:**
   * Jeder Schieberegler ist mit einem `<input type="number">` synchronisiert.
   * Sämtliche Eingaben verfügen über verbundene `<label>`-Elemente und `aria-describedby` für Hilfetexte.
3. **Kontrastprüfung:** Sämtliche Text- und Bedienelement-Kontraste liegen über 4,5:1 (AA) bzw. 7:1 (AAA).

---

## 7. Teststrategie & Qualitätssicherung

### 7.1 Golden Tests (Vitest)
Die Implementierung von `src/lib/mispel/pauschal.ts` wird gegen die offiziellen Beispielrechnungen der Bundesnetzagentur getestet:

1. **Beispielrechnung BNetzA (8 kWp / 10 kWh Speicher):**
   * Eingabe: $P_{\text{inst}} = 8\,\text{kWp}$, $SK_{\text{inst}} = 10\,\text{kWh}$
   * Erwartet: $P_1 = 4.000\,\text{kWh}$, $P_2 = 0{,}08$, $P_3 = 320\,\text{kWh}$, $P_4 = 4.320\,\text{kWh}$.
2. **Beispielrechnung 1 (Einspeisung 3.000 kWh):**
   * Erwartet: $P_{15} = 3.000\,\text{kWh}$ (voll förderfähig), $P_9 = 0\,\text{kWh}$, $P_{10} = 0\,\text{kWh}$.
3. **Beispielrechnung 2 (Einspeisung 6.000 kWh, Netzbezug 1.500 kWh):**
   * Erwartet: $P_{15} = 4.000\,\text{kWh}$, $P_3 = 320\,\text{kWh}$, $P_9 = 1.680\,\text{kWh}$, $P_{10} = 1.500\,\text{kWh}$, $P_{11} = 0\,\text{kWh}$.
4. **Parametrisierte Prüfung der Tabelle 1:**
   * Prüfung von $P_4$ für 10 kWp / 10 kWh $\rightarrow 5.500\,\text{kWh/a}$.
   * Prüfung von $P_4$ für 30 kWp / 4 kWh $\rightarrow 26.250\,\text{kWh/a}$.

### 7.2 Mathematische Invarianten
* $P_{15} \le \text{Einspeisung}$
* $P_{10} \le \text{Netzbezug}$
* $P_{11} \ge 0$
* $P_4 = P_1 + P_3$ stets exakt.

---

## 8. Integration in die bestehende Anwendung

* **Routing:** Neuer Pfad `/mispel` in `src/App.tsx` via `React.lazy(() => import('./pages/MispelPage'))`.
* **Navigation:** Eintrag „MiSpeL-Simulator“ in `src/components/Navbar.tsx` mit auffälligem, dezentem Badge („Neu: BNetzA 2026“).
* **SEO:** Eintrag in `scripts/generate-sitemap.ts` und Meta-Tags via `src/components/SEO.tsx`.
* **Prerender:** Automatische Unterstützung durch den statischen Prerenderer (`scripts/prerender.ts`).

---

## 9. Ausblick auf spätere Stufen
* **Stufe 2:** Interaktiver Sankey-Energiefluss und Zeitstrahl der regulatorischen Fristen bis 2030 (AgNes, dynamische Netzentgelte).
* **Stufe 3:** Abgrenzungsoption A1–A11 mit 15-Minuten-Zeitreihensimulation (35.040 Intervalle), Web Worker und SMARD-Börsenstrompreisen.
