# MiSpeL visualisieren und simulieren: Regelungsstand Oktober 2026, Rechenlogik, Datenquellen, Architektur und Wireframes

Die MiSpeL-Festlegung der Bundesnetzagentur (Az. 618-25-02) ist seit dem 1. Oktober 2026 beschlossen und mit Bekanntgabe wirksam; sie enthält vollständig formalisierte, tabellenkalkulationsartige Formelsätze (Anlage 1 Abgrenzungsoption mit monatlicher Saldierung, Anlage 2 Pauschaloption mit Jahresbetrachtung)\[1\]\[2\] und eignet sich daher sehr gut als deterministischer Rechenkern eines browserbasierten Simulators, sofern man die Rechtslogik strikt von der Betriebsoptimierung des Speichers trennt und jede Formel versioniert gegen die Beispielrechnungen der Behörde testet.\[3\]

## TL;DR

- **Rechtsstand:** Beschluss 01.10.2026, Veröffentlichung im Amtsblatt 07.10.2026, Wirkung mit Bekanntgabe (Tenorziffer 8); bis 30.09.2027 nur im Einverständnis von Netz- und Messstellenbetreiber anwendbar (Tenorziffer 9 a); Pauschaloption erst ab dem Kalendermonat nach der EU-Beihilfegenehmigung zu § 19 Abs. 3c EEG\[4\] (Tenorziffer 9 b), für die noch kein Termin feststeht.
- **Rechenkern:** Die Pauschaloption reduziert sich auf wenige Jahresformeln (P1) bis (P15) mit 500 kWh/kWp als Pauschalgrenze der Förderfähigkeit und einem vom Verhältnis Solarleistung zu Speicherkapazität abhängigen Indifferenzbereich; die Abgrenzungsoption verlangt eine Viertelstunden-Zeitreihe mit Speichervorrang und Monatssaldierung. Ein Simulator braucht deshalb zwingend eine 15-Minuten-Zeitreihensimulation (35.040 Werte je Jahr), eine reine Jahresbilanz genügt nur für die Pauschaloption.
- **Empfehlung:** TypeScript-Rechenkern als reine Funktionen in einem Web Worker, versionierte Regelwerkspakete je Rechtsstand, Golden-Tests aus den BNetzA-Beispielrechnungen, offene Daten aus SMARD, Energy-Charts und Netztransparenz, Visualisierung mit Sankey, Entscheidungsbaum und Zeitstrahl in BITV-2.0-konformer Gestaltung (keine rein farbliche Kodierung der grün/gelb/rot-Strommengen der Festlegung).

## 1) Regelungsüberblick MiSpeL mit Dokumentenliste

### 1.1 Verfahrensstand (lex lata, Stand 16.10.2026)

| Datum | Schritt | Fundstelle |
|---|---|---|
| 31.07.2025 | Eröffnung durch Referat 618 (Erneuerbare Energien) | Tenor mit Begründung, Gründe I.2\[3\]\[5\]\[6\] |
| 18.09.2025 | Konsultation der Eckpunkte (Entwurf Tenor, Anlage 1, Anlage 2)\[5\] | Konsultationsdokument\[5\]\[7\]\[8\] |
| 01.10.2025 | Workshop zum Konsultationsentwurf\[9\] | Verfahrensseite\[5\]\[6\] |
| 24.10.2025 | Ende der Stellungnahmefrist (rund 50 Stellungnahmen veröffentlicht)\[10\] | Verfahrensseite\[6\]\[11\] |
| 30.06.2026 | Gesetzliche Frist nach § 85d EEG verpasst | ZfK, 06.08.2026\[12\] |
| 05.08.2026 | Arbeitsstand veröffentlicht, ohne erneute Konsultation\[13\] | Verfahrensseite\[5\]\[6\] |
| 10.09.2026 | Vorstellung im Länderausschuss | Gründe I.2\[3\]\[5\] |
| 22.09.2026 | Beiladung der Enpal Energy GmbH | Gründe I.2\[3\]\[5\] |
| 01.10.2026 | Beschluss, Wirkung mit Bekanntgabe\[2\] | Tenorziffer 8\[3\]\[5\] |
| 02.10.2026 | Workshop zur finalen Festlegung | Verfahrensseite\[6\]\[14\] |
| 07.10.2026 | Veröffentlichung im Amtsblatt der BNetzA | Gründe I.2\[3\]\[5\] |
| 30.09.2027 | Ende der Übergangszeit mit Einverständnisvorbehalt\[15\] | Tenorziffer 9 a\[3\]\[5\] |
| offen | EU-Beihilfegenehmigung zu § 19 Abs. 3c EEG | Tenorziffer 9 b, § 101 Abs. 1 EEG\[3\]\[5\]\[16\] |

Die Festlegung beruht auf § 85d EEG (Tenorziffern 3 bis 5) und § 62 Abs. 2 Nr. 1 Buchst. a bis c EnFG (Tenorziffern 1 und 2); sie wurde im Benehmen mit BSI und PTB erlassen\[10\] und ist keine Beschlusskammerentscheidung (Gründe II.2.1).\[3\]\[5\] Hinweis: Einzelne Blogs nennen falsche Aktenzeichen (etwa „BK6-20-160“ oder „BK6-18-025“); maßgeblich ist ausschließlich Az. 618-25-02.\[17\]\[18\]

### 1.2 Tenor im Überblick

| Tenorziffer | Inhalt |
|---|---|
| 1 | Umlageprivilegien nach § 21 Abs. 1 bis 4 EnFG (saldierungsfähige Netzeinspeisung, privilegierungsfähige Speicherverluste) nur nach Anlage 1; gilt auch ohne marktprämiengeförderte EE-Anlage\[3\]\[5\] |
| 2 | Pauschale Umlageprivilegien nach § 21 Abs. 4a EnFG nur nach Anlage 2; gilt auch bei ausschließlich ungeförderten Solaranlagen in der sonstigen Direktvermarktung\[3\]\[5\] |
| 3 | Marktprämie auf Basis der Abgrenzungsoption (§ 19 Abs. 3b i.V.m. Abs. 1 Nr. 1 EEG) nach Anlage 1\[3\]\[5\] |
| 4 | Marktprämie auf Basis der Pauschaloption (§ 19 Abs. 3c i.V.m. Abs. 1 Nr. 1 EEG) nach Anlage 2\[3\]\[5\] |
| 5 | Zuordnung mindestens einer EE-Anlage sowie aller Speicher und bidirektionalen Ladepunkte zur Direktvermarktung per Marktprämie mit ergänzender Angabe der Option; Verfahren nach §§ 21b, 21c EEG\[3\]\[5\] |
| 6 | Begriffsbestimmungen und Schriftfarben der Anlagen gelten auch für den Tenor\[3\]\[5\] |
| 7 | Mitwirkungspflicht von Netzbetreibern und Messstellenbetreibern\[3\]\[5\] |
| 8 | Wirkung mit Bekanntgabe\[3\]\[5\] |
| 9 | Übergang: a) bis 30.09.2027 nur im Einverständnis von Netz- und Messstellenbetreiber; b) Tenorziffern 2 und 4 frühestens ab dem ersten Tag des Monats nach der Beihilfegenehmigung\[3\]\[5\] |

### 1.3 Die drei Optionen

| Merkmal | Ausschließlichkeitsoption (bisher) | Abgrenzungsoption (neu) | Pauschaloption (neu) |
|---|---|---|---|
| Rechtsgrundlage | § 19 Abs. 3a EEG | § 19 Abs. 3b EEG, § 21 Abs. 1 bis 4 EnFG, Anlage 1 | § 19 Abs. 3c EEG, § 21 Abs. 4a EnFG, Anlage 2\[6\]\[13\] |
| Anwendungsbereich | EE-Anlage mit reinem EE-Speicher | alle Anlagenarten und Größen, auch ungefördert oder ohne Erzeugung | Solaranlagen insgesamt höchstens 30 kWp mit Speicher und/oder bidirektionalem Ladepunkt, ein Betreiber\[16\]\[19\]\[20\]\[21\] |
| Netzbezug in den Speicher | nicht zulässig ohne Förderverlust | zulässig | zulässig\[6\]\[19\] |
| Bidirektionale Ladepunkte | ausgeschlossen | wie Speicher (eigene Definition) | wie Speicher (eigene Definition)\[3\]\[6\]\[19\] |
| Messung | wie bisher | viertelstundengenau, in der Regel zwei Zähler (Z1, Z2), Sonderfälle mit einem Zähler | ein viertelstundengenauer Zweirichtungszähler am Netzanschluss\[14\]\[16\]\[20\] |
| Saldierungsperiode | entfällt | Kalendermonat | Kalenderjahr\[14\]\[16\]\[20\] |
| Speicherverluste privilegierungsfähig | nein | ja, soweit messtechnisch abgrenzbar (nicht bei Ladepunkten) | nein\[20\]\[22\]\[23\] |
| Marktwert für Marktprämie | Monats- oder Jahresmarktwert nach EEG | Jahresmarktwert (Pflichtwechsel für Bestandsanlagen) | Jahresmarktwert\[3\]\[20\]\[23\]\[24\] |
| Anwendbar ab | geltend | 01.10.2026, bis 30.09.2027 mit Einverständnis | zusätzlich erst nach EU-Genehmigung\[5\]\[16\] |

Wichtig für die Zielgruppe des Simulators: Beide neuen Optionen gelten nur für die Direktvermarktung, nicht für Anlagen in der festen Einspeisevergütung (Hintergrundpapier vom 01.10.2026).\[15\]\[16\]\[19\]\[23\] Anlage 2 schließt in Voraussetzung 4 ausdrücklich die Einspeisevergütung, die unentgeltliche Abnahme (etwa aus Steckersolargeräten) und den Mieterstromzuschlag aus.\[20\]\[25\]\[26\]

### 1.4 Anlagenkonstellationen und zuständige Formelsätze

Anlage 1 (Abgrenzungsoption, Gliederung nach Arbeitsstand 05.08.2026, final zu verifizieren):

| Formelsatz | Konstellation | Zähler |
|---|---|---|
| A1 | EE-Anlage, Stromspeicher, sonstiger Verbrauch | Z1, Z2\[23\] |
| A2 | EE-Anlage, bidirektionaler Ladepunkt | Z1, Z2\[23\] |
| A3 | Speicher und Ladepunkt (vereinfachte Alternative zu A4) | Z1, Z2\[22\]\[23\] |
| A4 | Speicher und Ladepunkt mit gesonderter Messung der Speicherverluste | Z1, Z2, Z3\[22\]\[23\] |
| A5, A5-Variante | mehrere gleichartige EE-Anlagen | Z1, Z2\[23\] |
| A6 | weitere verschiedenartige Erzeugungsanlage (EE oder Nicht-EE, z. B. KWK) | Z1, Z2, Z4\[23\] |
| A7 | separat belieferte Wärmepumpe | Z1, Z2, ZW\[23\] |
| A8 | Co-Location-Speicher ohne sonstigen Verbrauch | Z1\[14\]\[23\] |
| A9, A9-Variante | unterschiedlich umlagepflichtige Netzbezüge (z. B. BesAR) | Z1, Z2\[23\] |
| A10 | rein netzgekoppelter Speicher ohne Erzeugung und ohne Verbrauch | ein Zähler\[3\]\[23\] |
| A11 | Speicher ohne Erzeugung mit sonstigem Verbrauch; final auch für bidirektionale Ladepunkte\[15\] | ein Zähler\[3\]\[19\]\[23\] |

Anlage 2 (Pauschaloption): Basisfälle P1 „Stromspeicher“, P2 „Ladepunkt“, P3 „Stromspeicher und Ladepunkt“, Sonderfälle P4 und P4-Variante (mehrere Solaranlagen, etwa Dachanlage plus Steckersolargerät), P5 (separat belieferte Wärmepumpe, Zähler Z1 und ZW), Abschnitt 7 (unterschiedlich umlagepflichtige Netzbezüge), Abschnitt 8 (nur ungeförderte Solaranlagen), Abschnitt 9 (Rumpfjahre).\[20\]\[25\]

Zuordnung der vom Nutzer genannten Situationen:

| Situation | Primärer Formelsatz | Bemerkung |
|---|---|---|
| PV mit Heimspeicher bis 30 kWp | P1 oder A1 | Wahl verbindlich, Wechsel frühestens zum Folgekalenderjahr; P nicht zulässig, wenn A-Messkonzept vorhanden ist (Anlage 2, Abschnitt 3.2.3)\[3\]\[20\]\[25\] |
| Gewerbe-PV mit Speicher über 30 kWp | A1, ggf. A9 | Jahresmarktwert-Effekt gegenrechnen |
| Großbatterie am Netzanschluss ohne Erzeugung | A10 | nur Umlage- und Netzentgeltprivilegien, keine Marktprämie\[23\] |
| Co-Location PV oder Wind mit Speicher | A1 oder A8 | A8 bei fehlendem sonstigem Verbrauch mit nur einem Zähler\[23\] |
| Speicher mit Netzbezug im Mischbetrieb plus Wärmepumpe | A7 oder P5 | separate Belieferung der Wärmepumpe |
| PV mit bidirektionalem Ladepunkt | P2 oder A2 | in P2 breiter Indifferenzbereich, Fremdtankstrom nicht erkennbar\[3\]\[20\]\[25\] |
| Bidirektionaler Ladepunkt ohne PV | A11 | Pauschaloption ohne Solaranlage nicht anwendbar\[16\] |
| Unidirektionale Wallbox | keine | gewöhnlicher Verbrauch, kein „Ladepunkt“ im Sinne der Festlegung\[20\]\[23\]\[25\] |

### 1.5 Finanzielle Wirkungen

- **EEG-Förderung:** Marktprämie auch für zwischengespeicherten EE-Strom, jedoch nur in Viertelstunden mit anzulegendem Wert über null (AW>0-Zeiten); in Zeiten negativer Preise nach § 51 EEG entfällt sie.\[19\]\[20\]\[23\]\[25\]
- **Umlagen nach EnFG:** Saldierungsfähige Netzeinspeisung wird vom Netzbezug abgezogen; nur der umlagebelastete Rest trägt Umlagen. In der Abgrenzungsoption zusätzlich privilegierungsfähige Speicherverluste (§ 21 Abs. 2 EnFG), nicht für Ladepunkte.\[5\]\[10\]\[23\]
- **Netzentgelte:** Nach dem Hintergrundpapier gelten die Umlageprivilegien „durch gesetzliche Verweise“ entsprechend für Netzentgelte und weitere Strompreisbestandteile.\[15\]\[19\] Anlage 2, Abschnitt 2.2 verweist auf die entsprechende Anwendung für § 118 Abs. 6 S. 3 EnWG (Netzentgelte) und § 19 Abs. 2 S. 16 StromNEV (Aufschlag für besondere Netznutzung).\[20\]\[23\]\[25\] Die EnWG-Novelle vom November 2025 hat § 118 Abs. 6 EnWG auf Mischspeicher und bidirektionale Ladepunkte erweitert.\[27\]\[28\]
- **Stromsteuer:** Nach Auswertung der Forschungsstelle für Energiewirtschaft (FfE) fällt nach der Novelle auch für die Zwischenspeicherung im Mischspeicher keine Stromsteuer mehr an;\[28\] die genaue Norm im StromStG ist vor Implementierung am Gesetzestext zu prüfen.
- **Fahrstrom:** Auf den Netzbezug für den Fahrstrom von E-Autos einschließlich deren Speicherverlusten fallen Umlagen und Netzentgelte weiter voll an; extern geladener „Fremdtankstrom“ erhält keine EEG-Förderung (Hintergrundpapier).\[3\]\[10\]\[15\]\[19\]

### 1.6 De lege ferenda und Schnittstellen

- **AgNes:** Die BNetzA erarbeitet parallel die Festlegung zur Allgemeinen Netzentgeltsystematik; nach dem Zwischenstand vom 27.05.2026 bleibt die 20-jährige Befreiung nach § 118 Abs. 6 S. 1 EnWG für bis zum 04.08.2029 in Betrieb genommene Speicher erhalten, für dynamische Netzentgelte soll sie nicht gelten.\[29\] Die BNetzA hält dynamische Netzentgelte „wohl erst ab 2030“ für möglich (Gründe II.3.1).\[5\] Ob AgNes ab 2029 weiter auf MiSpeL verweist, ist offen.\[3\]\[14\]
- **EEG 2027:** Das Bundeskabinett hat die EEG-Novelle 2027 am 29.07.2026 beschlossen; seit dem 07.09.2026 liegt sie dem Bundestag als Drucksache 21/7867 vor (Solaro, Stand 09.09.2026). Nach der Gesetzesbegründung wird durch die Änderung in § 21 Abs. 1 S. 1 Nr. 1 EEG 2027 „die dort bisher geregelte Einspeisevergütung abgeschafft und damit die Direktvermarktung im Grundsatz für alle Neuanlagen verpflichtend“ (zitiert nach energie-fachberater.de); das ist kein geltendes Recht, würde die Direktvermarktung und damit die MiSpeL-Optionen aber zum Regelfall machen.
- **Jahresmarktwert:** Die BNetzA erkennt selbst, dass der Zweck der Jahresmarktwert-Vorgabe durch die monatliche Saldierung „entfallen“ sei, sieht aber nur den Gesetzgeber als zuständig (Gründe, S. 25 f.).\[3\]\[5\] Eine Gesetzesänderung ist denkbar, aber nicht beschlossen.
- **Marktkommunikation:** Die EDI@Energy-Formate für MiSpeL sind noch nicht vollständig umgesetzt; die Übergangszeit bis 30.09.2027 dient ausdrücklich dem Aufbau der IT- und Abrechnungsprozesse.\[15\]\[19\]\[21\]\[30\]\[31\]

### 1.7 Dokumentenliste mit Links

| Dokument | Link |
|---|---|
| Verfahrensseite MiSpeL (Kurzlink) | https://www.bundesnetzagentur.de/1067830 \[32\] |
| Verfahrensseite MiSpeL (Langform) | https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/start.html |
| Festlegung, Tenor mit Begründung (01.10.2026) | https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/MiSpeL_TenorMitBegruendung.pdf?__blob=publicationFile |
| Anlage 1 Abgrenzungsoption (final) | über Verfahrensseite, Datei MiSpeL_Abgrenzungsoptionen\[17\] |
| Anlage 2 Pauschaloption (final) | über Verfahrensseite, Datei MiSpeL_Pauschaloptionen\[17\] |
| Hintergrundpapier (01.10.2026) | https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Hintergrundpapier.pdf?__blob=publicationFile&v=3 |
| Pressemitteilung (01.10.2026) | https://www.bundesnetzagentur.de/1116876 |
| Arbeitsstand Tenor (05.08.2026) | https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Tenor_Arbeitsstand.pdf?__blob=publicationFile&v=4 |
| Arbeitsstand Anlage 1 | https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Anlage1_Arbeitsstand.pdf?__blob=publicationFile&v=7 |
| Arbeitsstand Anlage 2 | https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Anlage2_Arbeitsstand.pdf?__blob=publicationFile&v=3 |
| Konsultationsdokument (17.09.2025) | https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Konsultation.pdf?__blob=publicationFile&v=2 |
| Entwurf Anlage 1 und 2 (Konsultation) | https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Anlage1_Entwurf.pdf?__blob=publicationFile&v=4 sowie Anlage2_Entwurf.pdf |
| Workshop-Folien Konsultation (01.10.2025) | https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Workshop-Folien.pdf?__blob=publicationFile&v=2 |
| Workshop-Folien final (02.10.2026) | über Verfahrensseite, Eintrag „Workshop-Folien zur finalen MiSpeL-Festlegung“ |
| Spiegelung aller Fassungen bei der Clearingstelle EEG/KWKG | https://www.clearingstelle-eeg-kwkg.de/suche/type/beschluss/7228 \[2\] |
| Stellungnahme BDEW | https://data.bundesnetzagentur.de/Bundesnetzagentur/SharedDocs/Downloads/DE/Sachgebiete/Energie/Unternehmen_Institutionen/ErneuerbareEnergien/Mispel/BDEW.pdf |
| Stellungnahme BVES | https://data.bundesnetzagentur.de/Bundesnetzagentur/SharedDocs/Downloads/DE/Sachgebiete/Energie/Unternehmen_Institutionen/ErneuerbareEnergien/Mispel/BVES.pdf |
| Stellungnahme VKU | https://data.bundesnetzagentur.de/Bundesnetzagentur/SharedDocs/Downloads/DE/Sachgebiete/Energie/Unternehmen_Institutionen/ErneuerbareEnergien/Mispel/VKU.pdf |
| Stellungnahme bne | https://data.bundesnetzagentur.de/Bundesnetzagentur/SharedDocs/Downloads/DE/Sachgebiete/Energie/Unternehmen_Institutionen/ErneuerbareEnergien/Mispel/bne.pdf |
| Stellungnahme HTW Bergner-Conzelmann (Fehlanreize, Simulation) | https://data.bundesnetzagentur.de/Bundesnetzagentur/SharedDocs/Downloads/DE/Sachgebiete/Energie/Unternehmen_Institutionen/ErneuerbareEnergien/Mispel/HTW_Bergner.pdf \[5\] |
| Stellungnahme HTW Weniger-Orth | https://data.bundesnetzagentur.de/Bundesnetzagentur/SharedDocs/Downloads/DE/Sachgebiete/Energie/Unternehmen_Institutionen/ErneuerbareEnergien/Mispel/HTW_Weniger-Orth.pdf |
| FfE: Neue Netzentgelt-Privilegien für Speicher und Ladepunkte | https://www.ffe.de/veroeffentlichungen/neue-netzentgelt-privilegien-fuer-speicheranlagen-und-ladepunkte-stehen-die-befreiungen-auf-duennem-eis/ |
| Netztransparenz Marktwertübersicht | https://www.netztransparenz.de/de-de/Erneuerbare-Energien-und-Umlagen/EEG/Transparenzanforderungen/Marktprämie/Marktwertübersicht |

Eine Stellungnahme des BSW Solar ist auf der Verfahrensseite nicht gelistet; laut Solarserver (01.10.2026) reagierte der Verband „erleichtert“ und bezeichnete die Festlegung als „den lang erwarteten regulatorischen Schlüssel für die gleichzeitige Nutzung von Grün- und Netzstrom durch Batteriespeicher“. Der BVES begrüßt die Festlegung ebenfalls; Bundesgeschäftsführer Urban Windelen mahnt laut utility-partners.de (14.10.2026): „MiSpeL darf jetzt nicht versickern.“ Die EEG-Clearingstelle spiegelt die Dokumente,\[2\] hat nach meinem Kenntnisstand aber noch kein eigenes Votum oder einen Hinweis veröffentlicht.

### 1.8 Unklarheiten, Redaktionsfehler und Auslegungsfragen

Die folgenden Befunde stammen überwiegend aus dem Arbeitsstand vom 05.08.2026; ob sie in den finalen Anlagen bereinigt sind, muss am finalen PDF geprüft werden.

1. **Anlage 2, Voraussetzung 8:** Bestandsanlagen wechseln „mit der Inanspruchnahme der Abgrenzungsoption“ zum Jahresmarktwert.\[20\]\[25\] Gemeint ist in Anlage 2 offensichtlich die Pauschaloption (Kopierfehler aus Anlage 1).
2. **Anlage 2, Inhaltsverzeichnis Abschnitt 9:** „Fehler! Textmarke nicht definiert.“ statt Seitenzahl.\[20\]\[25\]
3. **Anlage 2, Abschnitt 4.4:** spricht von der „Pauschalgrenze der Förderfähigkeit (P4)“, richtig ist (P1); (P4) ist die Pauschalgrenze der Saldierungsfähigkeit.\[20\]\[25\]
4. **Anlage 2, Abschnitt 4.3.1:** nennt den „Kalendermonat“, obwohl (P10) eine Jahresformel ist.\[20\]\[25\]
5. **Anlage 2, Notation Z1NE¼:** „Netzeinspeisung an der Entnahmestelle“ statt Einspeisestelle.\[20\]\[25\]
6. **Anlage 2, Abb. 4 und Abschnitt 5.1:** Verweise auf „A3“ bzw. „Basisfall A1“ statt P3 bzw. P1; Fußnote 16 verweist auf „Anlage 1“.\[20\]\[25\]
7. **Anlage 2, Fußnote 12:** Verweis auf „Abschnitt 5.4“ für Formel (P1), die in 4.2.2 steht; Abschnitt 4 verweist auf einen nicht existierenden „Abschnitt 5.5“.\[20\]\[25\]
8. **Steckersolargeräte:** zählen nicht für die 30-kWp-Grenze (Voraussetzung 3, § 24 Abs. 1 S. 5 EEG), wohl aber für Pinst bei (P1) und dem Indifferenzbereich.\[20\]\[25\] Das ist gewollt, im Simulator aber eine typische Fehlerquelle.
9. **Saldierung in der Abgrenzungsoption bei Mischbetrieb:** Formel (16) zieht die gesamte EE-Speichererzeugung des Monats von der Speichereinspeisung ab.\[3\] Eine Praxisrechnung (strom-geld.de, Basisfall A1, reale Viertelstundendaten 2025)\[24\] ergab im Mischbetrieb ganzjährig 0 kWh saldierungsfähige Netzeinspeisung.\[24\] Das ist nach der Begründung gewollt (Vermeidung der „Rotfärbung von EE-Strom“), dürfte Betreiber aber überraschen und gehört in die erklärende Visualisierung.\[3\]
10. **Wirkungsgrad:** In A1 aus Messwerten (Erzeugung durch Verbrauch des Speichers),\[23\] in A2 bis A4 pauschal 0,85 (Gründe, S. 37 ff.).\[3\]
11. **Zeitbasis:** Anlage 1 monatlich, Anlage 2 jährlich; unterjähriger Einstieg in die Pauschaloption erfordert Rumpfjahresformeln (Anlage 2, Abschnitt 9).\[20\]\[23\]\[25\]
12. **Technische Eignung:** Die Forschungsgruppe Solarspeichersysteme der HTW Berlin hält in ihrer Stellungnahme fest, die Festlegung biete „keinen Lösungsansatz für PV-Anlagen größer 30 kWp, die mit DC-gekoppelten Stromspeichern gekoppelt sind“, da das Zwei-Zähler-Messkonzept der Abgrenzungsoption nur AC-gekoppelte Systeme erfasst; nach der HTW-Stromspeicher-Inspektion 2026 entfielen auf AC-gekoppelte Systeme nur 10 % der im Vorjahr neu installierten Heimspeicher, 90 % hatten einen Hybridwechselrichter. Netzbetreiber wie energis bestätigen dies in ihren Kundeninformationen.\[33\]
13. **Schriftfarben als Rechtsbegriff:** Tenorziffer 6 erklärt die Schriftfarben grün (EE-Direkteinspeisung), gelb (EE-Speichererzeugung) und rot (Netzstrom, saldierungsfähig) für verbindlich.\[3\]\[5\]\[20\]\[23\]\[25\] Für eine barrierefreie Darstellung müssen diese Farben immer durch Text, Muster und Symbole ergänzt werden.

## 2) Rechenlogik und Parameter

### 2.1 Pauschaloption (Anlage 2): vollständiger Formelsatz

Formeln nach Arbeitsstand, Abschnitte 4.2.2 bis 4.2.5; die finalen Rechengrößen sind gekennzeichnet.

| Nr. | Formel | Bedeutung |
|---|---|---|
| (P1) | Pinst × 500 kWh/kWp | Pauschalgrenze der Förderfähigkeit je Kalenderjahr\[20\]\[21\]\[34\] |
| (P2)P1 | 0,1 kWh/kW × Pinst / SKinst | Rechengröße Basisfall Speicher\[20\] |
| (P2)P2 | 0,2 (final, im Arbeitsstand 0,5) | Rechengröße Basisfall Ladepunkt\[16\]\[19\]\[20\] |
| (P2)P3 | MIN[(P2)P1 ; (P2)P2] | Rechengröße Speicher plus Ladepunkt\[20\] |
| (P3) | (P2) × (P1) | Indifferenzbereich\[20\] |
| (P4) | (P1) + (P3) | Pauschalgrenze der Saldierungsfähigkeit\[20\] |
| (P5)¼ | WENN[SP¼ ≥ 0 ; 1 ; 0] | Viertelstunden ohne negativen Spotpreis\[20\] |
| (P6)¼ | (P5)¼ × Z1NE¼ | Einspeisung in SP≥0-Zeiten\[20\] |
| (P7) | ΣJahr Z1NB¼ | gesamter Netzbezug\[20\] |
| (P8) | ΣJahr (P6)¼ | Einspeisung in SP≥0-Zeiten\[20\] |
| (P9) | MAX[(P8) − (P4) ; 0] | grundsätzlich saldierungsfähig\[20\] |
| (P10) | MIN[(P9) ; (P7)] | saldierungsfähige Netzeinspeisung\[20\] |
| (P11) | (P7) − (P10) | umlagebelasteter Netzbezug\[20\] |
| (P12)¼ | WENN[AW¼ > 0 ; 1 ; 0] | AW>0-Zeiten\[20\] |
| (P13)¼ | (P12)¼ × Z1NE¼ | Einspeisung in AW>0-Zeiten\[20\] |
| (P14) | ΣJahr (P13)¼ | Summe Einspeisung in AW>0-Zeiten\[20\] |
| (P15) | MIN[(P14) ; (P1)] | förderfähige Netzeinspeisung\[20\] |

Der Wert 0,2 für (P2)P2 ist durch das Hintergrundpapier belegt („von 0,5 auf 0,2 herabgesetzt“);\[15\]\[19\] eine Änderung von (P2)P1 ist nicht bekannt.\[16\]\[35\] Beides ist vor Implementierung am finalen PDF zu verifizieren.

**Testfälle aus der Festlegung (Golden-Tests):**

| Fall | Eingabe | Erwartetes Ergebnis | Fundstelle |
|---|---|---|---|
| Beispiel 8 kWp / 10 kWh | Pinst 8, SKinst 10 | P1 = 4.000; P3 = 320; P4 = 4.320 kWh/a\[25\] | Anlage 2, 2.1.6\[20\] |
| Beispielrechnung 1 | Einspeisung 3.000 kWh | 3.000 förderfähig, 0 saldierungsfähig\[25\] | Anlage 2, Abb. 2\[20\] |
| Beispielrechnung 2 | Einspeisung 6.000, Netzbezug 1.500 kWh | 4.000 förderfähig, 320 indifferent, 1.500 saldierungsfähig, Umlagebezug 0\[25\] | Anlage 2, Abb. 3\[20\] |
| Tabelle 1 | 10 kWp / 10 kWh | P4 = 5.500 kWh/a\[25\] | Anlage 2, 2.1.5\[20\] |
| Tabelle 1 | 30 kWp / 4 kWh | P4 = 26.250 kWh/a\[25\] | Anlage 2, 2.1.5\[20\] |
| Tabelle 2 | 8 kWp / 10 kWh | 540 kWh/kWp\[25\] | Anlage 2, 2.1.5\[20\] |
| Ladepunkt final | 10 kWp, nur Ladepunkt | P3 = 1.000; P4 = 6.000 kWh/a (600 kWh/kWp) | abgeleitet aus Faktor 0,2 |

Die Tabellen 1 und 2 eignen sich als eigenständige Eigenschaftstests (49 Wertepaare), weil sie die Formel (P2)P1 über das gesamte Größenspektrum prüfen. Zur Einordnung: Im Arbeitsstand ergab ein 10-kWp-System mit Ladepunkt noch 750 kWh/kWp Saldierungsschwelle, also 2.500 kWh Indifferenzbereich (ZfK);\[12\] mit dem finalen Faktor sind es 1.000 kWh.

### 2.2 Abgrenzungsoption (Anlage 1): Rechenkette Basisfall A1

Die finale Nummerierung der Formeln (1) bis etwa (33) ist am finalen PDF zu übernehmen; die Logik ist durch Tenorbegründung und Arbeitsstand gesichert:

1. **Speichervorrang je Viertelstunde:** zeitgleicher Netzbezug gilt vorrangig als im Speicher verbraucht, (1)¼ = MIN[Z1NB¼ ; Z2V¼] (§ 21 Abs. 4 S. 3 EnFG); zeitgleiche Netzeinspeisung gilt vorrangig als Speichererzeugung, (2)¼ = MIN[Z1NE¼ ; Z2E¼] (§ 21 Abs. 4 S. 4 EnFG).\[10\]\[23\]\[36\]\[37\]
2. **EE-Verbrauch im Speicher:** Speicherverbrauch minus zeitgleicher Netzstromverbrauch.\[10\]\[36\]
3. **Monatssummen:** alle Viertelstundengrößen werden je Kalendermonat aufsummiert.\[3\]\[23\]\[38\]
4. **Fremdtankstrom (12), (13):** nur bei Ladepunkten relevant, identifizierbar, soweit gemessene Erzeugung die Verbräuche übersteigt;\[10\] wird vollständig abgezogen.\[3\]
5. **Wirkungsgrad (14):** A1 aus Messwerten, A2 bis A4 pauschal 0,85.\[3\]\[23\]
6. **EE-Speichererzeugung (15):** EE-Verbrauch im Speicher multipliziert mit dem Wirkungsgrad.\[3\]\[23\]
7. **Saldierungsfähige Netzeinspeisung (16):** MAX[Speichererzeugung ins Netz − EE-Speichererzeugung ; 0] je Monat.\[3\]\[5\]\[23\]
8. **Privilegierungsfähige Speicherverluste:** nur bei abgrenzbarer Messung (A1, A4), nicht bei Ladepunkten.\[10\]\[22\]\[23\]
9. **Umlagebelasteter Netzbezug:** Netzbezug minus saldierungsfähige Einspeisung minus privilegierungsfähige Verluste, nicht negativ.\[10\]\[23\]\[39\]
10. **Förderfähige Netzeinspeisung:** EE-Direkteinspeisung plus der EE-Speichererzeugung zugeordnete Einspeisung, jeweils nur in AW>0-Zeiten;\[37\] bei mehreren Anlagen anlagenscharf (A5).\[10\]\[23\]

Die Praxisrechnung von strom-geld.de (Produktionsbetrieb, 915 MWh Verbrauch, 561 MWh PV, Speicher 500 kWh / 250 kW, Day-Ahead 2025) ist ein nützlicher Plausibilitätsfall: Vorteil der Abgrenzungsoption 1.935 €/a gegenüber der Ausschließlichkeitsoption, davon kostet der Pflichtwechsel auf den Jahresmarktwert 1.313 €/a, die Umlagesaldierung bleibt im Mischbetrieb bei null.\[24\] Die Zahlen beruhen auf dem Arbeitsstand und einer privaten Analyse; sie sind als Plausibilitätsbereich, nicht als Referenzwert zu verwenden.

### 2.3 Ökonomische Bewertung (Kosten/Nutzen)

Jahresergebnis je Variante (Ausschließlichkeits-, Abgrenzungs-, Pauschaloption, ohne Speicher):

```
Nutzen = Spoterlöse Einspeisung
       + Marktprämie × förderfähige Einspeisung (AW>0)
       − Bezugskosten (Spot + Aufschläge) × Netzbezug
       + (Umlagen + Netzentgelt + Stromsteuer) × saldierungsfähige Menge
       − Direktvermarktungsentgelt
       − Alterungskosten × Speicherdurchsatz
       − Mehrkosten Messstellenbetrieb (Z2, Z3, iMS)
       − annuisierte Investition Messtechnik und Steuerung
Marktprämie = MAX[AW − Jahresmarktwert (bzw. Monatsmarktwert) ; 0]
```

### 2.4 Parameterliste für den Simulator

| Gruppe | Parameter | Einheit | Quelle/Default |
|---|---|---|---|
| Anlage | Pinst je Solaranlage, Steckersolar ja/nein, Inbetriebnahmejahr, anzulegender Wert | kWp, ct/kWh | Nutzereingabe, MaStR |
| Anlage | weitere Erzeuger (Wind, KWK) | kW | Nutzereingabe |
| Speicher | SKinst (installiert, für P2), nutzbare Kapazität, Lade- und Entladeleistung, Wirkungsgrad je Richtung, Selbstentladung, Alterungskosten | kWh, kW, %, ct/kWh | Datenblatt, HTW-Stromspeicher-Inspektion |
| Ladepunkt | bidirektional ja/nein, Leistung, Anwesenheitsprofil, Fahrverbrauch, Fremdladung | kW, kWh | Nutzereingabe, Profilbibliothek |
| Verbrauch | Jahresverbrauch, Lastprofil (Standardlast, VDI 4655, eigener Lastgang), Wärmepumpe separat | kWh | Upload, Profilbibliothek |
| Markt | Day-Ahead-Viertelstundenpreise, negative Viertelstunden, Monats- und Jahresmarktwerte | €/MWh, ct/kWh | SMARD, Energy-Charts, Netztransparenz |
| Bezugstarif | Lieferantenaufschlag, Netzentgelt Arbeitspreis, KWKG-Umlage, Offshore-Netzumlage, Aufschlag besondere Netznutzung, Stromsteuer, Konzessionsabgabe, Umsatzsteuer | ct/kWh | Preisblätter, Netztransparenz |
| Vermarktung | Direktvermarktungsentgelt, Option Monats- oder Jahresmarktwert | ct/kWh | Nutzereingabe |
| Messung | iMS-Preisobergrenzen, Zusatzzähler, Installationskosten, Zählerschrankumbau | €/a, € | MsbG, Angebote |
| Regelwerk | Option (A/P/Ausschließlichkeit), Formelsatz, Rechtsstand-Version, Übergangsstatus (Einverständnis ja/nein), Beihilfegenehmigung ja/nein | Enum | Regelwerkspaket |
| Szenario | Betriebsstrategie (Eigenverbrauch, preisoptimiert, Arbitrage), Prognosegüte, Betrachtungszeitraum, Zinssatz | Enum, %, a | Nutzereingabe |

Beispielwerte für Umlagen 2026 aus einer Sekundärquelle (strom-geld.de): KWKG-Umlage 0,446 ct/kWh, Offshore-Netzumlage 0,941 ct/kWh, Aufschlag für besondere Netznutzung 1,559 ct/kWh;\[24\] diese sind gegen die Veröffentlichung der Übertragungsnetzbetreiber zu prüfen und als datierte Parameter zu hinterlegen.

## 3) Datenquellen

| Quelle | Inhalt | Zugang | Lizenz/Hinweis |
|---|---|---|---|
| SMARD (BNetzA) | Day-Ahead-Preise DE-LU, seit 01.10.2025 viertelstündlich; Erzeugung, Last | inoffiziell dokumentierte JSON-Schnittstelle (chart_data, Auflösung quarterhour), CSV-Download | CC BY 4.0\[40\]\[41\]\[42\] |
| Energy-Charts API (Fraunhofer ISE) | /price (Day-Ahead), /public_power (15 Minuten), installierte Leistung, neue v2-Endpunkte inkl. price_next_day | REST ohne Schlüssel, https://api.energy-charts.info | CC BY 4.0, Ratenlimits für öffentliche Nutzung\[43\]\[44\] |
| Netztransparenz (ÜNB) | Monats- und Jahresmarktwerte (JW Solar 2025: 4,508 ct/kWh), Übersichtstabellen negative Spotmarktpreise, Umlagen | Tabellen, CSV | amtlich, Referenz für AW=0-Zeiten (Anlage 2, Fn. 10)\[20\]\[23\]\[25\]\[45\] |
| Marktstammdatenregister | Anlagen- und Speicherbestand, Leistungen, Inbetriebnahmedaten | Gesamtdatenexport (XML), Webdienst mit Registrierung | Bestandsstatistik, Vorlagenbildung |
| DWD Open Data, PVGIS | Einstrahlung, PV-Erzeugungsprofile | offen | PV-Zeitreihen je Standort |
| Standardlastprofile, VDI 4655 | Haushalts- und Gewerbeprofile | BDEW-Profile, Richtlinie | HTW nutzt VDI 4655 im Solarisator\[46\] |
| HTW Berlin (Solarisator, Unabhängigkeitsrechner, Stromspeicher-Inspektion) | Referenzwerte Autarkie, Wirkungsgrade | Webtools, Berichte | Validierung, keine API |
| Preisblätter der Netzbetreiber | Netzentgelte, iMS-Entgelte | PDF | manuelle Pflege, datiert |

Empfehlung: Preis- und Marktwertdaten im Build-Prozess als versionierte, datierte Dateien (Parquet oder komprimiertes JSON) bündeln, statt live abzurufen. Das macht Ergebnisse reproduzierbar, vermeidet Ratenlimits und erfüllt behördliche Anforderungen an Nachvollziehbarkeit.

## 4) Programmierkonzept und Architektur

### 4.1 Grundsatzentscheidungen

1. **Zeitreihe statt Jahresbilanz:** Kern ist eine 15-Minuten-Simulation über ein Kalenderjahr (35.040 Intervalle, im Schaltjahr 35.136). Die Pauschaloption wird daraus aggregiert; eine reine Jahresbilanz ist nur als „Schnellrechner“-Modus für P1 bis P3 sinnvoll, wenn Einspeisung und Netzbezug bereits bekannt sind.
2. **Trennung von Betrieb und Recht:** Modul A erzeugt die physikalischen Viertelstundenflüsse (PV, Last, Speicher, Ladepunkt, Netz). Modul B wendet die Formelsätze ausschließlich auf Zählerwerte (Z1NB, Z1NE, Z2V, Z2E, Z3) an, so wie es auch der Netzbetreiber tun würde. Damit ist der Rechtskern unabhängig von der Betriebsstrategie testbar.
3. **TypeScript als Rechenkern:** strikte Typen für Einheiten (kWh, kW, ct/kWh als Branded Types), reine Funktionen, Float64Array für Zeitreihen, Ausführung in einem Web Worker. Python/Pyodide ist für Fachanwender reizvoll, kostet aber rund 10 MB Ladezeit und erschwert Barrierefreiheitsprüfungen nicht, wohl aber Startzeit; sinnvoll nur als optionaler „Expertenmodus“ für Notebooks.
4. **Betriebsoptimierung:** Stufe 1 regelbasierte Heuristiken (Eigenverbrauch, Ladeschwelle nach Preisquantil); Stufe 2 tagesweise lineare Optimierung gegen Day-Ahead-Preise mit einem WebAssembly-Solver (z. B. HiGHS). Wichtig: Die Optimierung muss die MiSpeL-Wirkungen (Speichervorrang, AW=0, SP<0, Indifferenzbereich) als Zielfunktionsterme kennen, sonst unterschätzt sie Fehlanreize.

### 4.2 Modulstruktur

```
/packages
  /core-units          Einheiten, Zeitraster, Kalender (Sommerzeit, Schaltjahr)
  /core-physics        PV, Last, Speicher, Ladepunkt -> Viertelstundenflüsse
  /core-meter          Ableitung Z1/Z2/Z3/ZW aus Flüssen je Messkonzept
  /rules-mispel
     /v2026-10-01      Anlage1 (A1..A11), Anlage2 (P1..P5), Tenor-Flags
     /v2026-08-05      Arbeitsstand (Vergleich, Didaktik)
     /v2025-09-17      Konsultationsentwurf (Vergleich)
  /rules-eeg           AW, §51-Logik, Marktwerte, Marktprämie
  /rules-charges       Umlagen, Netzentgelte, Stromsteuer je Jahr
  /economics           Barwert, Annuität, Sensitivität
  /optimizer           Heuristiken, LP (WASM)
  /data                versionierte Markt- und Profildaten
/apps
  /explainer           erklärende Visualisierung (statisch, ohne Rechenlast)
  /simulator           Simulator-Oberfläche
/tests
  /golden              BNetzA-Beispielrechnungen, Tabellen 1/2
  /property            Invarianten (Mengenerhaltung, Nichtnegativität)
```

### 4.3 Datenmodell (Auszug)

```ts
type Regelwerk = {
  id: "mispel-2026-10-01";
  quelle: { az: "618-25-02"; dokument: string; fundstelle: string };
  gueltigAb: string; uebergangBis: "2027-09-30";
  parameter: { pauschalgrenzeKWhJeKWp: 500; faktorSpeicher: 0.1;
               faktorLadepunkt: 0.2; wirkungsgradPauschal: 0.85 };
};
type Konstellation = {
  solar: { pinstKWp: number; steckersolar: boolean; aw_ct: number }[];
  speicher?: { skInstKWh: number; pLadeKW: number; eta: number };
  ladepunkt?: { bidirektional: boolean; pKW: number };
  waermepumpeSeparat: boolean;
  option: "ausschliesslichkeit" | "abgrenzung" | "pauschal";
  formelsatz: "A1"|"A2"|"A3"|"A4"|"A5"|"A6"|"A7"|"A8"|"A9"|"A10"|"A11"|"P1"|"P2"|"P3"|"P4"|"P5";
};
type Ergebnis = {
  mengen: { foerderfaehig: number; indifferent: number;
            saldierungsfaehig: number; umlagebelastet: number;
            speicherverlustePriv: number };
  euro: Record<string, number>;
  nachweis: Formelprotokoll[];   // jede Formel mit Eingaben, Ergebnis, Fundstelle
};
```

Das **Formelprotokoll** ist das zentrale Qualitätsmerkmal für den behördlichen Einsatz: Jede Ergebniszahl ist auf Formelnummer, Eingangswerte und Fundstelle (z. B. „Anlage 2, Formel (P10), Abschnitt 4.2.3“) rückverfolgbar und als Tabelle exportierbar.

### 4.4 Testbarkeit und Versionierung

- **Golden-Tests** aus allen Beispielrechnungen der Anlagen sowie den Tabellen 1 und 2; ein Test pro Fundstelle, Testname gleich Fundstelle.
- **Eigenschaftstests:** Summe förderfähig plus indifferent plus saldierungsfähig ist nie größer als die Einspeisung; saldierungsfähig nie größer als Netzbezug; Monatssummen gleich Jahressumme.
- **Differenztests zwischen Regelwerksversionen:** gleiche Zeitreihe gegen Konsultationsentwurf, Arbeitsstand und finale Fassung; daraus entsteht zugleich eine Visualisierung „Was hat sich geändert“.
- **Semantische Versionierung der Regelwerke** mit Datum des Rechtsstands; Ergebnisse speichern stets Regelwerks-ID und Datensatz-Hash.
- **Abgleich mit Dritten:** Unabhängige Nachrechnung einzelner Fälle mit Tabellenkalkulation (die Formeln sind in der Festlegung bewusst in Excel-Notation gehalten: MIN, MAX, WENN).\[20\]\[25\]

### 4.5 Technologie-Stack

| Ebene | Empfehlung | Begründung |
|---|---|---|
| Frontend | SvelteKit oder React mit statischem Export | statisches Hosting im Behördennetz möglich, keine Serverlogik nötig |
| Komponenten | barrierearme, ungestylte Bausteine (z. B. Radix, Headless UI) oder ein Bundes- bzw. Länder-Designsystem | Tastatur- und Screenreader-Verhalten geprüft |
| Diagramme | Apache ECharts (ARIA-Beschreibungen, Musterfüllungen „decal“) und d3-sankey | Muster statt reiner Farbe, Sankey verfügbar |
| Rechenkern | TypeScript in Web Worker, Float64Array | 35.040 Werte je Lauf, Sensitivitäten parallel |
| Optimierung | HiGHS als WebAssembly | lineare Tagesoptimierung im Browser |
| Daten | Parquet über DuckDB-WASM oder Apache Arrow | schneller Zugriff auf mehrjährige Zeitreihen |
| Export | CSV, XLSX (Formelprotokoll), PDF/UA-Bericht, JSON-Szenario | Nachvollziehbarkeit und Archivierung |
| Qualität | Vitest, Playwright, axe-core, Lighthouse | automatisierte Barrierefreiheitsprüfung in CI |

### 4.6 Vorbilder und Abgrenzung

| Tool | Stärke | Abgrenzung zum MiSpeL-Simulator |
|---|---|---|
| HTW Berlin Unabhängigkeitsrechner | validierte Autarkiewerte, in einem HTW-Vergleich unter den genauesten Rechnern | keine Marktpreise, keine Regulatorik\[47\] |
| HTW Berlin Solarisator | Echtzeit-Simulation in 5-Minuten-Auflösung mit Wärmepumpe und E-Auto, VDI-4655-Profile | Eigenverbrauchsfokus, keine MiSpeL-Formeln\[46\] |
| strom-geld.de Praxistest A1 | reale Viertelstundenrechnung nach Anlage 1\[24\] | Einzelfall, nicht interaktiv\[24\] |
| Netzbetreiber-Informationsseiten (z. B. energis) | Messkonzepte als Schaubild | keine Berechnung\[33\] |

Das Alleinstellungsmerkmal des geplanten Werkzeugs ist der amtlich nachvollziehbare Optionsvergleich mit Formelprotokoll für alle Formelsätze, was nach meiner Recherche bisher kein öffentlich verfügbares Werkzeug bietet.

## 5) Visualisierungs- und Layoutkonzept mit Wireframe-Skizzen

### 5.1 Gestaltungsgrundsätze (Barrierefreiheit)

- **Rechtsrahmen:** Die BITV 2.0 verweist auf die EN 301 549 in der im Amtsblatt der EU bekannt gemachten Fassung (derzeit V3.2.1, entspricht WCAG 2.1 AA).\[48\]\[49\] Die EN 301 549 V4.1.1 vom September 2026 übernimmt WCAG 2.2;\[50\] Ziel sollte daher WCAG 2.2 AA sein, für Text und Kernbedienelemente möglichst AAA-Kontrast (7:1).
- **Kontraste:** Text mindestens 4,5:1 (AA) bzw. 7:1 (AAA); Grafikelemente und Fokusrahmen mindestens 3:1 (WCAG 1.4.11); Fokusindikator nach WCAG 2.4.13 deutlich sichtbar.
- **Keine rein farbliche Kodierung (WCAG 1.4.1):** Die drei Strommengen der Festlegung erhalten feste Dreifachkodierung aus Farbe, Muster und Kürzel:
  - EE-Direkteinspeisung: dunkelgrün, vollflächig, Kürzel „G“
  - EE-Speichererzeugung: dunkles Ocker statt Gelb (Gelb erreicht auf Weiß keinen ausreichenden Kontrast), schraffiert, Kürzel „GS“
  - Netzstrom/saldierungsfähig: dunkelrot, gepunktet, Kürzel „N“
  - Indifferenzbereich: Grau mit Kreuzschraffur, Kürzel „I“
- **Farbsehschwäche:** Rot-Grün-Paar zusätzlich in Helligkeit deutlich trennen; Palette mit Simulatoren für Protanopie und Deuteranopie prüfen.
- **Jede Grafik hat eine gleichwertige Datentabelle** und eine textliche Kurzbeschreibung; Diagramme sind per Tastatur durchschreitbar.
- **Vergrößerung:** Umbruch bis 400 % ohne horizontales Scrollen (WCAG 1.4.10), Schriftgröße mindestens 16 px, Zeilenabstand 1,5.
- **Bewegung:** Animierte Sankey-Flüsse nur auf Wunsch, Einstellung „reduzierte Bewegung“ respektieren.
- **BITV-Zusatzpflichten:** Erklärung zur Barrierefreiheit, Feedback-Mechanismus, Erläuterungen in Leichter Sprache und Deutscher Gebärdensprache für die Startseite.\[51\]\[52\]
- **Sprache:** Formelnamen immer ausschreiben („Pauschalgrenze der Saldierungsfähigkeit“), Abkürzungen beim ersten Auftreten erklären, Glossar mit Fundstellen.

### 5.2 Erklärende Visualisierungen

**(a) Entscheidungsbaum Optionswahl**

```
[Start: Anlage hinter einer Einspeisestelle]
        |
        v
<Direktvermarktung möglich/gewollt?> --nein--> [Nur Ausschließlichkeitsoption
        | ja                                     bzw. feste Einspeisevergütung]
        v
<Speicher oder bidirektionaler Ladepunkt nimmt Netzstrom auf?>
        | nein --> [Ausschließlichkeitsoption reicht]
        v ja
<Nur Solaranlagen, ein Betreiber, Summe <= 30 kWp (ohne Steckersolar)?>
        | nein --------------------------------------------+
        v ja                                               |
<Zweites Messkonzept (Z2) technisch möglich?               |
 (bei DC-Kopplung/Hybrid-WR meist nein)>                   |
   | nein                     | ja                         |
   v                          v                            v
[Pauschaloption P1-P5]   [Vergleich P vs. A rechnen]  [Abgrenzungsoption A1-A11]
 ! erst nach EU-           ! Wahl verbindlich bis       ! Jahresmarktwert-
   Genehmigung               Jahresende                   Effekt prüfen
        \__________________________|__________________________/
                                   v
             <Bis 30.09.2027: Einverständnis NB und MSB?>
                 | nein -> [Warten oder Ausschließlichkeitsoption]
                 v ja
             [Option anwendbar]
```

**(b) Sankey-Diagramm der Energieflüsse (Beispiel P1, Jahreswerte)**

```
QUELLEN                 SENKEN                    EINORDNUNG NETZEINSPEISUNG
PV 9.500 kWh  ==G==>  Eigenverbrauch 3.000       
              ==G==>  Speicher (EE) 2.000 ==GS==> Netzeinspeisung 6.000
              ==G==>  Netz direkt 4.500              |- förderfähig  5.000 [G/GS]
Netz 2.500    ==N==>  Speicher (Netz) 1.000 ==N==>   |- indifferent    500 [I]
              =====>  Haushalt 1.500                 |- saldierungsf.  500 [N]
```

Jeder Strang trägt Kürzel und Muster; ein Umschalter „Monat/Jahr“ zeigt in der Abgrenzungsoption die Monatssaldierung.

**(c) Zeitstrahl der Fristen**

```
2025-07-31  Eröffnung
2025-09-18  Konsultation ............ 2025-10-24 Fristende
2026-06-30  gesetzliche Frist (verpasst)
2026-08-05  Arbeitsstand
2026-10-01  Beschluss  ◆ wirksam mit Bekanntgabe
2026-10-07  Amtsblatt
2027-09-30  ▲ Ende Einverständnisvorbehalt NB/MSB
   ?        ● EU-Beihilfegenehmigung -> Pauschaloption ab Folgemonat
2029-08-04  Ende Inbetriebnahmefenster § 118 Abs. 6 S. 1 EnWG
ab 2029/30  AgNes, dynamische Netzentgelte (de lege ferenda)
```

Symbole (Raute, Dreieck, Kreis) unterscheiden Rechtswirkung, Frist und offenen Termin, unabhängig von Farbe; lex lata und de lege ferenda werden durch Linienart (durchgezogen bzw. gestrichelt) und Beschriftung getrennt.

**(d) „Formel-Lupe“:** Interaktive Darstellung der Kette (P1) bis (P15) bzw. (1) bis (16) mit Schiebereglern; jede Zwischengröße zeigt Wert, Formel in Klartext und Fundstelle.

**(e) Balken „Pauschale Einordnung“** nach Abb. 1 der Anlage 2: ein horizontaler Stapelbalken förderfähig, indifferent, saldierungsfähig\[20\]\[25\] mit Schwellenmarken P1 und P4.

### 5.3 Simulator-Oberfläche: Wireframes

**Bildschirm 1: Start und Vorlagen**

```
+--------------------------------------------------------------------------+
| [Logo]  MiSpeL-Simulator   Rechtsstand: Festlegung 618-25-02 v.01.10.2026|
|         [Hilfe] [Leichte Sprache] [Gebärdensprache] [Barrierefreiheit]   |
+--------------------------------------------------------------------------+
| H1 Welche Anlage möchten Sie betrachten?                                 |
|                                                                          |
| ( ) Einfamilienhaus: PV 10 kWp + Speicher 10 kWh          [Vorlage P1]   |
| ( ) Einfamilienhaus: PV + bidirektionale Wallbox          [Vorlage P2]   |
| ( ) Gewerbe: PV 300 kWp + Speicher 500 kWh                [Vorlage A1]   |
| ( ) Co-Location: PV-Park + Großbatterie                   [Vorlage A8]   |
| ( ) Netzgekoppelter Großspeicher ohne Erzeugung           [Vorlage A10]  |
| ( ) Wallbox ohne PV (V2G)                                 [Vorlage A11]  |
| ( ) Eigene Konstellation                                                 |
|                                                                          |
| Hinweis-Box (Symbol i): Bis 30.09.2027 nur mit Einverständnis von        |
| Netz- und Messstellenbetreiber. Pauschaloption erst nach EU-Genehmigung. |
|                                          [Weiter zur Eingabe  >]         |
+--------------------------------------------------------------------------+
```

**Bildschirm 2: Eingabe (Schrittfolge mit Fortschrittsanzeige)**

```
+------------------+-------------------------------------------------------+
| Schritt 2 von 5  | H2 Anlage und Speicher                                |
| 1 Vorlage    ✓   |                                                       |
| 2 Anlage     ●   | Solarleistung gesamt  [ 10,0 ] kWp   (?)              |
| 3 Verbrauch      | davon Steckersolar    [  0,8 ] kWp   (zählt nicht für  |
| 4 Markt/Tarif    |                                       30-kWp-Grenze)  |
| 5 Messkonzept    | Anzulegender Wert     [  7,9 ] ct/kWh                  |
|                  | Speicher installiert  [ 10,0 ] kWh   nutzbar [ 9,2 ]  |
| Live-Prüfung:    | Lade-/Entladeleistung [  5,0 ] kW                     |
| ✓ <= 30 kWp      | Bidirektionaler Ladepunkt  (•) nein ( ) ja            |
| ✓ ein Betreiber  |                                                       |
| ! Direktvermark- | Validierung als Text: "Pauschaloption möglich,        |
|   tung nötig     |  Formelsatz P1."                                      |
|                  |              [< Zurück]            [Weiter >]         |
+------------------+-------------------------------------------------------+
```

**Bildschirm 3: Ergebnisvergleich der Optionen**

```
+--------------------------------------------------------------------------+
| H2 Ergebnis 2025 (Preise Day-Ahead 2025, Regelwerk v2026-10-01)          |
| [Tabelle anzeigen] [Formelprotokoll] [Export CSV/XLSX/PDF]               |
+--------------------------------------------------------------------------+
|                 | Ausschließl. | Abgrenzung A1 | Pauschal P1 | ohne Sp.  |
| Netzbezug kWh   |   2.900      |    3.400      |   3.400     |  4.700    |
| Einspeisung kWh |   5.600      |    6.000      |   6.000     |  6.300    |
| förderfähig kWh |   5.600      |    5.700      |   5.000     |  6.300    |
| indifferent kWh |      0       |       0       |     500     |     0     |
| saldierungsf.   |      0       |     300       |     500     |     0     |
| Ergebnis €/a    |   +xxx       |    +xxx       |   +xxx      |   0 (Ref.)|
| Rang            |   3          |    1 ★        |   2         |   4       |
+--------------------------------------------------------------------------+
| Stapelbalken je Option mit Mustern G | GS | I | N und Werten am Balken   |
| Textfazit: "Die Abgrenzungsoption liegt um xxx € vorn; Mehrkosten        |
|  Zweitzähler xxx €/a sind berücksichtigt."                               |
+--------------------------------------------------------------------------+
```

(Die Zahlen im Wireframe sind Platzhalter zur Layoutdarstellung, keine Rechenergebnisse.)

**Bildschirm 4: Sensitivitätsanalyse**

```
+--------------------------------------------------------------------------+
| H2 Was beeinflusst das Ergebnis am stärksten?                            |
| Tornado-Diagramm (horizontale Balken, beschriftet, Tabelle daneben):     |
|  Spreizung Day-Ahead      |██████████|         +/- xxx €                 |
|  Speichergröße            |  ███████ |                                   |
|  Jahres- vs. Monatsmarktw.|   ██████ |                                   |
|  Netzentgelt              |    ████  |                                   |
|  Faktor Ladepunkt 0,2/0,5 |     ███  |   (Regelwerksvergleich)           |
|                                                                          |
| Heatmap Speicherkapazität x PV-Leistung: Breite Indifferenzbereich       |
| (Zellen mit Zahlenwert, nicht nur Farbe)                                 |
| Schieberegler mit Tastatursteuerung und Eingabefeld-Alternative          |
+--------------------------------------------------------------------------+
```

**Bildschirm 5: Erklärmodus „Wie rechnet die BNetzA?“**

```
+--------------------------------------------------------------------------+
| Formelkette Pauschaloption (P1) -> (P15)                                 |
| (P1) Pauschalgrenze Förderfähigkeit = 10 kWp x 500 = 5.000 kWh  [Anl.2,  |
|      4.2.2]                                                               |
| (P2) Rechengröße = 0,1 x 10/10 = 0,1                                      |
| (P3) Indifferenzbereich = 0,1 x 5.000 = 500 kWh                          |
| (P4) Pauschalgrenze Saldierungsfähigkeit = 5.500 kWh                     |
| ... jede Zeile aufklappbar mit Klartext, Formel, Fundstelle              |
+--------------------------------------------------------------------------+
```

### 5.4 Layoutraster

Einspaltig bis 768 px, ab 1024 px zweispaltig (Navigation links, Inhalt rechts), Ergebnisseite mit fester Zusammenfassung oben, darunter Tabs „Grafik“, „Tabelle“, „Formelprotokoll“; Tabs sind als echte Tablist mit Pfeiltastensteuerung umgesetzt.

## 6) Vorschlag für Projektphasen und nächste Schritte

| Phase | Dauer (Schätzung) | Inhalt | Ergebnis |
|---|---|---|---|
| 0 Klärung | 2 Wochen | finale Anlagen 1 und 2 auswerten, Formelnummern und Faktor (P2)P2 = 0,2 verifizieren, Redaktionsfehlerliste mit Referat 618 (mispel@bnetza.de) abgleichen | Anforderungskatalog mit Fundstellen |
| 1 Erklärteil | 4 Wochen | Entscheidungsbaum, Zeitstrahl, Formel-Lupe Pauschaloption, Barrierefreiheitskonzept | veröffentlichbarer Erklärer |
| 2 Rechenkern P | 4 Wochen | Anlage 2 komplett inkl. P4, P5, Rumpfjahr; Golden-Tests | getesteter Kern Pauschaloption |
| 3 Rechenkern A | 6 bis 8 Wochen | A1 bis A4, A8, A10, A11; Monatssaldierung; Formelprotokoll | getesteter Kern Abgrenzungsoption |
| 4 Physik und Markt | 4 Wochen | Profile, Speicher- und Ladepunktmodell, Heuristiken, Datenpipeline SMARD/Energy-Charts/Netztransparenz | vollständige Jahressimulation |
| 5 Ökonomie und Sensitivität | 3 Wochen | Kostenmodell, Tornado, Heatmap, Export | Kosten/Nutzen-Vergleich |
| 6 Prüfung | 3 Wochen | BITV-Test (z. B. BIK-Prüfverfahren), Nutzertests mit sehbehinderten Personen, fachliche Abnahme | Erklärung zur Barrierefreiheit |
| 7 Betrieb | laufend | Regelwerkspflege (EU-Genehmigung, AgNes, EEG 2027), jährliche Datenaktualisierung | versionierter Betrieb |

Konkrete nächste Schritte:

1. Finale PDFs der Anlagen 1 und 2 herunterladen, die Formeln in eine maschinenlesbare Tabelle (Nummer, Formel, Fundstelle) überführen und als Quelle der Wahrheit für Code und Tests nutzen.
2. Mit der Pauschaloption beginnen: Sie ist in rund 17 Formeln vollständig beschrieben, durch Beispielrechnungen und Tabellen sofort testbar und für den Massenmarkt der Heimspeicher am verständlichsten.
3. Zwei Referenzdatensätze festlegen (Haushalt 10 kWp / 10 kWh, Gewerbe A1) und Day-Ahead-2025-Viertelstundenpreise sowie Marktwerte 2025 als datierte Datei einfrieren.
4. Frühzeitig klären, ob der Simulator beratend oder nur informierend eingesetzt wird; im behördlichen Umfeld ist ein deutlicher Haftungshinweis nötig („keine Rechtsauskunft, maßgeblich ist die Abrechnung durch Netzbetreiber“).
5. Den Netzbetreiber-Engpass sichtbar machen: Ein Statusfeld „Einverständnis NB/MSB vorhanden“ verändert das Ergebnis bis 30.09.2027 von „anwendbar“ auf „nicht anwendbar“.

## Vorbehalte

- Die finalen Anlagen 1 und 2 vom 01.10.2026 konnten nicht im Volltext ausgewertet werden; Formeln und Fallgliederung stammen aus dem Arbeitsstand vom 05.08.2026, ergänzt um die finale Tenorbegründung und das Hintergrundpapier. Gegenüber dem Arbeitsstand ist mindestens der Ladepunktfaktor (0,5 auf 0,2) und die Ausdehnung von A11 auf Ladepunkte geändert; weitere Änderungen sind möglich.
- Die Redaktionsfehlerliste bezieht sich auf den Arbeitsstand; vor Kommunikation nach außen am finalen Text prüfen.
- Die Praxiszahlen (1.935 €/a, 1.313 €/a, 0 kWh Saldierung) stammen aus einer privaten Analyse auf Basis des Arbeitsstands und eines Einzelfalls.
- Aussagen zur Stromsteuer und zu den Netzentgeltwirkungen beruhen auf Sekundäranalysen (FfE, Kanzleien) und den Verweisen in den Anlagen; die AgNes-Festlegung kann die Netzentgeltseite ab 2029 neu regeln.
- Der Zeitpunkt der EU-Beihilfegenehmigung ist offen; die BNetzA nennt keinen Termin.
- Zur Barrierefreiheit: Rechtlich verbindlich ist bis zur Bekanntmachung im EU-Amtsblatt weiterhin die EN 301 549 V3.2.1 (WCAG 2.1 AA); die Ausrichtung an WCAG 2.2 ist eine vorausschauende Empfehlung.

## Quellen

1. [Bundesnetzagentur - Homepage - Festlegung zur Marktintegration von Speichern und Ladepunkten (MiSpeL)](https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/artikel.html)
2. [Festlegungsverfahren zur Marktintegration von Speichern und Ladepunkten (MiSpeL)](https://www.clearingstelle-eeg-kwkg.de/suche/type/beschluss/7228)
3. <https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/MiSpeL_TenorMitBegruendung.pdf?__blob=publicationFile&v=2>
4. [Bundesnetzagentur - Startseite - Bundesnetzagentur erlässt Festlegung zur Marktintegration von Stromspeichern und Ladepunkten (MiSpeL)](https://www.bundesnetzagentur.de/SharedDocs/Pressemitteilungen/DE/2026/20261001_Mispel.html?nn=660040)
5. [Az.: 618-25-02 In dem Festlegungsverfahren](https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/MiSpeL_TenorMitBegruendung.pdf?__blob=publicationFile)
6. [Bundesnetzagentur - Festlegungsverfahren zur Marktintegration von Speichern und Ladepunkten (MiSpeL)](https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/start.html)
7. [17.09.2025 Konsultation von Eckpunkten:](https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Konsultation.pdf?__blob=publicationFile&v=2)
8. [BNetzA: Start Konsultation MiSpeL-Festlegung - ISPEX](https://ispex.de/bnetza-start-konsultation-mispel-festlegung/)
9. [Az.: 618-25-02 In dem Festlegungsverfahren](https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/MiSpeL_TenorMitBegruendung.html?nn=1067830)
10. [MiSpeL Festlegung zur Marktintegration von Stromspeichern und Ladepunkten](https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Workshop-Folien.pdf?__blob=publicationFile&v=2)
11. [MiSpeL-Umsetzung Status Mai 2026: Schlussphase mit offenem Ausgang](https://batteriespeicher-report.de/aktuelles/mispel-umsetzung-status-mai-2026)
12. [Mispel: Bundesnetzagentur ändert Regeln für Speicher](https://www.zfk.de/energie/strom/speicher-e-autos-bidirektionales-laden-mispel-zwischenstand)
13. [MiSpeL Batteriespeicher: Abgrenzungsoption für Mischspeicher](https://intilion.com/blog/mispel-batteriespeicher-abgrenzungsoption)
14. [MiSpeL-Festlegung 2026: Was Batteriespeicher jetzt dürfen](https://cubeconcepts.de/mispel-festlegung-batteriespeicher-industrie/)
15. <https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Hintergrundpapier.pdf?__blob=publicationFile&amp=&v=3>
16. [MiSpeL: Speicher mit Netzstrom laden ohne Förderverlust](https://hausbesitzer-news.de/energie-heizung/mispel-festlegung-bundesnetzagentur-speicher-netzstrom-2026/)
17. [Bundesnetzagentur erlässt neue Regelungen für die Marktintegration von Speichern und Ladepunkten](https://www.anker-blog.de/news/bundesnetzagentur-erlaesst-neue-regelungen-fuer-die-marktintegration-von-speichern-und-ladepunkten/)
18. [MiSpeL einfach erklärt: die Speicher-Festlegung der BNetzA](https://enyo-energy.de/magazin/mispel-einfach-erklaert)
19. <https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Hintergrundpapier.pdf?__blob=publicationFile&v=3>
20. <https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Anlage2_Arbeitsstand.pdf?__blob=publicationFile&v=3>
21. [Bundesnetzagentur öffnet mit der MiSpeL-Festlegung den Weg für marktaktive Speicher und bidirektionales Laden](https://www.utility-partners.de/bundesnetzagentur-oeffnet-mit-der-mispel-festlegung-den-weg-fuer-marktaktive-speicher-und-bidirektionales-laden/)
22. [MiSpeL Festlegung zur Marktintegration von Stromspeichern und Ladepunkten](https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Workshop-Folien.pdf?__blob=publicationFile&v=5)
23. [ARBEITSSTAND (vom 05.08.2026)](https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Anlage1_Arbeitsstand.pdf?__blob=publicationFile&amp=&v=7)
24. [MiSpeL im Praxistest: 1.935 Euro im Jahr — und zwei Haken, die kaum jemand nennt](https://strom-geld.de/analysen/mispel-abgrenzungsoption-praxistest/)
25. <https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Anlage2_Arbeitsstand.pdf?__blob=publicationFile&amp=&v=3>
26. [Stromhandel mit Heimspeichern wird erleichtert, nicht für alle](https://christopher-helm.com/heimspeicher-stromhandel-bundesnetzagentur-mispel/)
27. [EnWG-Novelle: Netzentgeltbefreiung von Stromspeichern macht bidirektionales Laden endlich wirtschaftlich](https://www.energie-experten.org/news/enwg-novelle-netzentgeltbefreiung-von-stromspeichern-macht-bidirektionales-laden-endlich-wirtschaftlich)
28. [Neue Netzentgelt-Privilegien für Speicheranlagen und Ladepunkte - Stehen die Befreiungen auf dünnem Eis? - FfE](https://www.ffe.de/veroeffentlichungen/neue-netzentgelt-privilegien-fuer-speicheranlagen-und-ladepunkte-stehen-die-befreiungen-auf-duennem-eis/)
29. [AgNes und BESS: BNetzA sichert Vertrauensschutz bei Netzentgelten](https://raue.com/aktuell/branchen/agnes-und-bess-bnetza-sichert-vertrauensschutz-bei-netzentgelten/)
30. [Stellungnahme zur Konsultation „Festlegung zur ...](https://data.bundesnetzagentur.de/Bundesnetzagentur/SharedDocs/Downloads/DE/Sachgebiete/Energie/Unternehmen_Institutionen/ErneuerbareEnergien/Mispel/enbw.pdf)
31. [MaKo 01.10.2026: 25 Formate, 13 Nachrichten](https://www.innobu.com/de/artikel/mako-mitteilung-56-umsetzungsstand-oktober-2026.html)
32. [Bundesnetzagentur - Festlegungsverfahren zur Marktintegration von Speichern und Ladepunkten (MiSpeL)](https://www.bundesnetzagentur.de/1067830)
33. [Informationen zu MiSpeL - Marktintegration von Speichern und Ladepunkten - energis-Netzgesellschaft mbH](https://www.energis-netzgesellschaft.de/energie-einspeisen/anlage-anmelden/mispel)
34. [Bidirektionales Laden: Bundesnetzagentur hört auf Branche](https://www.mega-monheim.de/unternehmen/aktuelles/bidirektionales-laden-bundesnetzagentur-hoert-auf-branche)
35. [1 Hintergrundpapier 1. Oktober 2026](https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Hintergrundpapier.html?nn=1067830)
36. [MiSpeL Festlegung zur Marktintegration von Stromspeichern und Ladepunkten](https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Workshop-Folien.html?nn=1067830)
37. [Update zu MiSpeL-Eckpunkten: Messverfahren zum Nachweis der Abgrenzungsoption - Lumera Energy](https://www.lumeraenergy.de/en/articles/update-zu-mispel-eckpunkten-messverfahren-zum-nachweis-der-abgrenzungsoption)
38. [MiSpeL - EcoPhi Energy IoT](https://ecophi.io/de/mispel/)
39. [ECKPUNKTE ZUR KONSULTATION (Stand vom 17.09.2025)](https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Aufsicht/MiSpeL/DL/Anlage1_Entwurf.pdf?__blob=publicationFile&v=4)
40. [SMARD](https://www.smard.de/home/viertelstundenscharfe-grosshandelspreise-verfuegbar-218074)
41. [Strommarktdaten (Stundenpreise) automatisch in SPS einlesen](https://www.sps-forum.de/threads/strommarktdaten-stundenpreise-automatisch-in-sps-einlesen.116959/)
42. [GitHub - bundesAPI/smard-api · GitHub](https://github.com/bundesAPI/smard-api)
43. [Energy-Charts Scraper - Power Mix & Generation Data API · Apify](https://apify.com/parseforge/energy-charts-power-mix-scraper)
44. [Energy-Charts API](https://api.energy-charts.info/)
45. [Netztransparenz \> Erneuerbare Energien und Umlagen \> EEG \> Transparenzanforderungen \> Marktprämie \> Marktwertübersicht](https://www.netztransparenz.de/de-de/Erneuerbare-Energien-und-Umlagen/EEG/Transparenzanforderungen/Marktpr%C3%A4mie/Marktwert%C3%BCbersicht)
46. [Solarisator](https://solar.htw-berlin.de/rechner/solarisator/)
47. [Solarrechner-Test 2025: HTW kürt ehrlichste Online-Rechner für Photovoltaik](https://photovoltaik.org/news/solarrechner-test-2025-htw-kuert-ehrlichste-online-rechner-fuer-photovoltaik)
48. [Portal Barrierefreiheit - Barrierefreie-Informationstechnik-Verordnung 2.0](https://www.barrierefreiheit-dienstekonsolidierung.bund.de/Webs/PB/DE/gesetze-und-richtlinien/bitv2-0/bitv2-0-node.html)
49. [BFSG, WCAG, EN 301 549 und BITV 2.0: Was ist der Unterschied?](https://accesslabs.de/ratgeber/recht-compliance/bfsg-wcag-unterschied/)
50. [EN 301 549](https://en.wikipedia.org/wiki/EN_301_549)
51. [WCAG 2.2 Barrierefreiheits-Referenz](https://barrierecloud.de/wcag-referenz)
52. [BITV 2.0 · Das Internet-Lexikon](https://das-internet-lexikon.de/lexikon/bitv-2-0/)
