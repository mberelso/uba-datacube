# Findings: UBA-Datacube Brainstorming

## 1. Context & Target Audience
- **Zielgruppe:** Interessierte Öffentlichkeit und politische Entscheidungsträger. Sie suchen schnelle, fundierte Fakten ohne langes Datenstudium.
- **Pain Points:** Diagramm-Achsen sind oft schwer verständlich. Nutzer müssen die Daten erst selbst intellektuell verarbeiten, um zu verstehen, was gezeigt wird.
- **Fokusbereich (Aktuell):** Startseite, Onboarding und die allererste Begegnung mit einem neuen Datensatz.

## 2. UX Improvement Ideas
1. **Story First, Data Second**: Kernaussage als Überschrift über dem Chart.
2. **Daten-Dolmetscher**: Tooltips an Achsen, die Einheiten alltagsnah erklären (z.B. Grenzwerte).
3. **Zwiebel-Prinzip (Progressive Disclosure)**: Zuerst nur der Haupttrend, Experteneinstellungen erst auf Klick.
4. **Guided Onboarding**: Wichtige Ausschläge im Diagramm beim ersten Laden kurz visuell hervorheben.
5. **Live-News & Alert-Integration**: Erweiterung der bestehenden `RelatedPublications`-Komponente um einen echten **Live-Feed**. Echtzeit-Nachrichten passend zum Datensatz.
6. **Emotionales Visual Design (Bilderstellung)**: Integration von hochwertigen, frei lizenzierten Fotomotiven (z.B. Unsplash/Pixabay) zur emotionalen Bindung:
   - *Hero-Section (Startseite)*: Atmosphärisches Hintergrundbild (Wald, Natur, Landschaft) mit Dark-Overlay für perfekte Text-Lesbarkeit, statt nur eines CSS-Gradients.
   - *Themen-Kacheln*: Bildbasierte Cards für die Kategorien (Klima, Wasser, Energie) anstatt reiner Farbflächen.
   - *News-Feed*: Kleine Foto-Thumbnails in den Live-News-Karten.

## 3. Text & Copy Drafts
**Drafts for Homepage Intro (Einleitungstext):**

*Variante 1 (Neugierig & Direkt)*
**Überschrift:** Umweltfragen? Hier sind die Antworten.
**Text:** Der UBA-Datacube macht komplexe Umweltdaten greifbar. Ob Luftqualität in deiner Region, die Entwicklung von Waldbränden oder Treibhausgas-Emissionen – wir übersetzen Millionen von Messwerten in klare Trends und verständliche Fakten. Keine Vorkenntnisse nötig.

*Variante 2 (Seriös & Orientierend)*
**Überschrift:** Dein Kompass für die Umwelt in Deutschland.
**Text:** Entdecke die wichtigsten Umweltdaten auf einen Blick. Der UBA-Datacube bündelt offizielle Zahlen des Umweltbundesamtes und bereitet sie so auf, dass sie für alle verständlich sind. Fundiert, transparent und auf den Punkt gebracht.

*Variante 3 (Storytelling)*
**Überschrift:** Mach dir ein eigenes Bild von unserer Umwelt.
**Text:** Hinter jeder Statistik steckt eine Geschichte über unsere Natur, unser Klima und unsere Zukunft. Im UBA-Datacube zeigen wir dir nicht nur nackte Zahlen, sondern die echten Zusammenhänge. Tauche ein in die Daten von heute, um die Trends von morgen zu verstehen.

---

### Ausgearbeiteter Startseiten-Text (Fokus: Variante 2 "Kompass" + Features)

**Titel:** Dein Kompass für die Umwelt in Deutschland
**Untertitel:** Offizielle Daten. Klar verständlich. Auf den Punkt gebracht.

Wie steht es um die Luftqualität in unseren Städten? Wie entwickeln sich die Treibhausgas-Emissionen, und welche Auswirkungen hat extreme Trockenheit auf unsere Wälder? Der UBA-Datacube ist der zentrale Ort für fundierte Antworten auf diese drängenden Fragen. 

Wir bündeln die offiziellen Umwelt-Indikatoren des Umweltbundesamtes und machen sie für jeden greifbar – von der interessierten Öffentlichkeit bis hin zu politischen Entscheidungsträgern.

**Was den UBA-Datacube besonders macht:**

*   **Die Geschichte hinter den Zahlen:** Wir lassen dich mit nackten Daten nicht allein. Jeder Datensatz startet mit den wichtigsten Erkenntnissen auf einen Blick ("Story First"), damit du sofort weißt, worauf es ankommt.
*   **Interaktive Entdeckungsreise:** Egal ob Klima, Wasser, Boden oder Mobilität – nutze unsere interaktiven Diagramme, um tiefer in die Themen einzutauchen. Vergleiche Jahre, filtere nach Ursachen (z.B. bei Waldbränden) und erkenne Trends selbstständig.
*   **Integrierter Daten-Dolmetscher:** Komplexe Einheiten und gesetzliche Grenzwerte übersetzen wir direkt in den Diagrammen durch intuitive Tooltips ("Guided Analytics"). So verstehst du sofort, ob ein Wert im grünen Bereich liegt oder Handlungsbedarf besteht.
*   **Maßgeschneiderte Berichte:** Du brauchst die Daten für deine Arbeit, eine Präsentation oder zur politischen Einordnung? Stelle dir mit wenigen Klicks tagesaktuelle Indikatorenberichte zusammen und nutze die Rohdaten für deine eigenen Analysen.

*Der Zustand unserer Umwelt betrifft uns alle. Mach dir dein eigenes Bild – fundiert, transparent und datenbasiert.*
