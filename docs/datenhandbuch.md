# Umweltpuls Datenhandbuch

Redaktionelle Dokumentation aller Datensätze auf umweltpuls.de.  
Grundlage: `src/data/datasetContent.ts` + UBA SDMX REST API (`sdmx.uba.de`).  
API-Metriken (Zeitraum, Serien, Beobachtungen) sind als Platzhalter markiert — Befüllung via `scripts/fetch-metadata.ts` (noch zu erstellen).

**Legende:**
- `⏳ API-Daten ausstehend` — Zeitraum/Serien noch nicht via API verifiziert
- `⚠️ excludeFromCatalog` — aus Katalog ausgeblendet (strukturell nicht für Zeitreihen-Explorer geeignet)
- `✅ reviewed` / `📝 draft` — redaktioneller Prüfstatus

---

## Inhaltsverzeichnis

1. [Klima](#klima)
2. [Luft](#luft)
3. [Energie](#energie)
4. [Verkehr](#verkehr)
5. [Wasser](#wasser)
6. [Wassermonitoring (DAS)](#wassermonitoring-das)
7. [Abfall](#abfall)
8. [Landwirtschaft](#landwirtschaft)
9. [Fläche & Boden](#fläche--boden)
10. [Umwelt & Wirtschaft](#umwelt--wirtschaft)
11. [Konsum](#konsum)
12. [GHG-Projektionen](#ghg-projektionen)
13. [Schadstoffregister (PRTR)](#schadstoffregister-prtr)
14. [Ausgeblendet](#ausgeblendet)
15. [Thematische Cluster & Crossreferenzen](#thematische-cluster--crossreferenzen)

---

## Klima

### Jahresmitteltemperatur Deutschland (`DF_CLIMATE_GERMANY_TEMPERATURE_MEAN`)
**Status:** ✅ reviewed  
**Zeitraum:** 1881–2024
**Serien:** 34
**Beobachtungen:** 4.896
**Chart:** Linie/Balken (Standard)

> Deutschland wird wärmer – und der Trend beschleunigt sich.

Wichtigster Einzelindikator für den Klimawandel in Deutschland. DWD-Messreihe seit über 140 Jahren — flächengewichteter Gebietsmittelwert aus ~2.000 Stationen. Deutschland bereits ~1,7 °C wärmer als vorindustriell.

**Crossreferenzen:** `DF_CLIMATE_GERMANY_TEMPERATURE_SEASONAL`, `DF_CLIMATE_GERMANY_HOT_DAYS`, `DF_CLIMATE_GLOBAL_TEMPERATURE`, `DF_CLIMATE_GERMANY_PRECIPATION`

---

### Treibhausgasemissionen nach Sektor (`DF_CLIMATE_EMISSIONS_GHG_TRENDS`)
**Status:** ✅ reviewed  
**Zeitraum:** 1990–2025
**Serien:** 6.696
**Beobachtungen:** 7.055
**Chart:** Stacked Area (vorkonfiguriert: Energie, Industrie, Gebäude, Verkehr, Landwirtschaft, Abfall)

> Die Emissionen sinken – aber nicht schnell genug für das Klimaziel.

Zentrale THG-Bilanz nach UNFCCC-Methodik. Seit 1990 ~40 % Reduktion. Klimaschutzgesetz-Ziel 2030: −65 % ggü. 1990. Ohne LULUCF.

**Crossreferenzen:** `DF_CLIMATE_EMISSIONS_GHG_TRENDS_KSG`, `DF_CLIMATE_EMISSIONS_F_GASES`, `DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_25`, `DF_ENV_ECON_ENERGY_CONSUMPTION`

---

### THG-Emissionen nach KSG-Sektoren (`DF_CLIMATE_EMISSIONS_GHG_TRENDS_KSG`)
**Status:** 📝 draft  
**Zeitraum:** 1990–2025
**Serien:** 6.344
**Beobachtungen:** 6.544
**Chart:** Stacked Area (vorkonfiguriert, gleiche Sektoren wie KSG)

> Deutschland stößt weniger Treibhausgase aus – doch das Tempo reicht nicht.

Sektorzuordnung nach Klimaschutzgesetz (politische Kategorien). Sektor Verkehr und Gebäude verfehlen Ziele wiederholt. Unterschied zu `DF_CLIMATE_EMISSIONS_GHG_TRENDS`: andere Sektordefinition.

**Crossreferenzen:** `DF_CLIMATE_EMISSIONS_GHG_TRENDS`, `DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_23`, `DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_25`

---

### F-Gas-Emissionen (`DF_CLIMATE_EMISSIONS_F_GASES`)
**Status:** 📝 draft  
**Zeitraum:** 1990–2025
**Serien:** 12
**Beobachtungen:** 432
**Chart:** Linie/Balken

> F-Gase heizen das Klima auf – obwohl sie kaum jemand kennt.

Fluorkohlenwasserstoffe und verwandte Gase, teils 1.000× stärker als CO₂. Quellen: Kälteanlagen, Klimaanlagen, Halbleiterindustrie. EU-F-Gas-Verordnung schreibt Mengenbegrenzungen vor. Basiert auf Industriemeldungen, keine Atmosphärenmessungen.

**Crossreferenzen:** `DF_CLIMATE_EMISSIONS_GHG_TRENDS`, `DF_CLIMATE_ATMO_GHG_CONCENTRATION`

---

### Treibhausgaskonzentration in der Atmosphäre (`DF_CLIMATE_ATMO_GHG_CONCENTRATION`)
**Status:** 📝 draft  
**Zeitraum:** 2021-01-13T00:00:00–2023-03-31T23:00:00
**Serien:** 6
**Beobachtungen:** 93.648
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Zeitreihe möglicherweise sehr kurz (Apr–Dez 2023). API-Verifizierung prioritär.

> Deutschlands Luft zeigt: CO₂ steigt weiter, ohne Pause.

Zwei Messstationen (Schauinsland, Zugspitze). CO₂, CH₄, N₂O. Unabhängiger Gegencheck zu Emissionsbilanzen — misst was tatsächlich in der Luft ist.

**Crossreferenzen:** `DF_CLIMATE_EMISSIONS_GHG_TRENDS`, `DF_CLIMATE_GLOBAL_TEMPERATURE`

---

### Globale Temperaturanomalie (`DF_CLIMATE_GLOBAL_TEMPERATURE`)
**Status:** 📝 draft  
**Zeitraum:** 1850–2025-01
**Serien:** 6
**Beobachtungen:** 6.828
**Chart:** Linie/Balken

> Die Erde ist heute rund 1,3 Grad wärmer als im vorindustriellen Zeitalter.

HadCRUT.5.0.2.0, Median aus 200 Zeitreihen. Kombiniert Landstationen + Schiffsmessungen. Referenz: 1850–1900.

**Crossreferenzen:** `DF_CLIMATE_GERMANY_TEMPERATURE_MEAN`, `DF_CLIMATE_GERMANY_TEMPERATURE_SEASONAL`

---

### Heiße Tage und Tropennächte (`DF_CLIMATE_GERMANY_HOT_DAYS`)
**Status:** 📝 draft  
**Zeitraum:** 1951–2024
**Serien:** 34
**Beobachtungen:** 2.516
**Chart:** Linie/Balken

> Deutschland erlebt dreimal so viele Hitzetage wie noch vor 60 Jahren.

Anzahl Tage ≥30 °C im deutschlandweiten Flächenmittel. DWD-Daten. Unterschätzt Hitzebelastung in Städten (Flächenmittel glättet urbane Extremwerte).

**Crossreferenzen:** `DF_CLIMATE_GERMANY_TEMPERATURE_MEAN`, `DF_CLIMATE_GERMANY_TEMPERATURE_SEASONAL`

---

### Phänologische Jahreszeiten (`DF_CLIMATE_GERMANY_PHENOLOGY`)
**Status:** 📝 draft  
**Zeitraum:** 1960–2023
**Serien:** 15
**Beobachtungen:** 836
**Chart:** Linie/Balken

> Deutschlands Frühling beginnt heute Wochen früher als vor 50 Jahren.

DWD-Beobachtungsnetz. Eintrittszeitpunkte von Blüte/Blattfall ausgewählter Pflanzenarten. Frühlingsboten 2–4 Wochen früher als in den 1960ern.

**Crossreferenzen:** `DF_CLIMATE_GERMANY_TEMPERATURE_MEAN`, `DF_CLIMATE_GERMANY_PRECIPATION`

---

### Niederschlag in Deutschland (`DF_CLIMATE_GERMANY_PRECIPATION`)
**Status:** 📝 draft  
**Zeitraum:** 1881–2025
**Serien:** 34
**Beobachtungen:** 4.930
**Chart:** Linie/Balken

> Deutschland wird nasser — aber das Wasser kommt zur falschen Zeit.

Jahresniederschläge zeigen keinen einfachen Aufwärtstrend, aber Verteilung ändert sich: mehr Starkregen, längere Trockenphasen im Sommer.

**Crossreferenzen:** `DF_CLIMATE_GERMANY_TEMPERATURE_MEAN`, `DF_DAS_WASSER_WW_I_3`, `DF_DAS_WASSER_WW_I_6`

---

### Saisonale Temperaturen (`DF_CLIMATE_GERMANY_TEMPERATURE_SEASONAL`)
**Status:** 📝 draft  
**Zeitraum:** 1881–2025
**Serien:** ⏳ (4 Jahreszeiten)  
**Beobachtungen:** 19.618
**Chart:** Linie/Balken

> Deutschlands Sommer sind heute fast zwei Grad wärmer als 1881.

Alle vier Jahreszeiten separat. Sommer und Frühling am stärksten betroffen. Vertiefung zu `DF_CLIMATE_GERMANY_TEMPERATURE_MEAN`.

**Crossreferenzen:** `DF_CLIMATE_GERMANY_TEMPERATURE_MEAN`, `DF_CLIMATE_GERMANY_HOT_DAYS`

---

## Luft

### Luftschadstoff-Emissionsindex (`DF_AIR_EMISSIONS_INDEX`)
**Status:** 📝 draft  
**Zeitraum:** 1990–2024
**Serien:** 6
**Beobachtungen:** 209
**Chart:** Linie/Balken

> Ammoniak blockiert Deutschlands Luftreinhaltung – ein Schadstoff hält den Index hoch.

Indexdarstellung relativ zu Basisjahr 2005. Erfasst Mengen, nicht Konzentrationen. Ammoniak aus Landwirtschaft stagniert hartnäckig.

**Crossreferenzen:** `DF_AIR_EMISSIONS_TRENDS`, `DF_AGRICULTURE_FORESTRY_NITROGEN_SURPLUS`

---

### Luftschadstoff-Emissionstrends seit 1990 (`DF_AIR_EMISSIONS_TRENDS`)
**Status:** 📝 draft  
**Zeitraum:** 1990–2024
**Serien:** ⏳ (mehrere Schadstoffe: SO₂, NOₓ, NH₃, PM, Schwermetalle...)  
**Beobachtungen:** 286.740
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Hohe Serienzahl erwartet (viele Schadstoffarten). Filter empfohlen.

> Schwefeldioxid fast verschwunden, Ammoniak kaum gesunken – Deutschlands Luftbilanz seit 1990.

SO₂ −90 % seit 1990. Ammoniak stagniert. Genfer Luftreinhaltekonvention-Nomenklatur. NEC-Richtlinie-Ziele 2030.

**Crossreferenzen:** `DF_AIR_EMISSIONS_INDEX`, `DF_PRTR`, `DF_AGRICULTURE_FORESTRY_NITROGEN_SURPLUS`

---

## Energie

### Anteil erneuerbarer Energien am Gesamtverbrauch (`DF_ENERGY_AGEE_SHARE`)
**Status:** 📝 draft  
**Zeitraum:** 1990–2025
**Serien:** 6
**Beobachtungen:** 188
**Chart:** Linie/Balken

> Jede dritte Kilowattstunde kommt heute aus erneuerbaren Quellen.

Bruttoendenergieverbrauch nach EU-RED-Definition. Strom + Wärme + Verkehr. EU-Ziel 2030: 42,5 %. Wärme und Verkehr deutlich hinter Strom.

**Crossreferenzen:** `DF_ENERGY_AGEE_ELECTRICITY`, `DF_ENERGY_AGEE_HEAT`, `DF_ENERGY_AGEE_TRANSPORT`, `DF_ENERGY_AGEE_CAPACITY`

---

### Installierte Kapazität erneuerbarer Energien (`DF_ENERGY_AGEE_CAPACITY`)
**Status:** 📝 draft  
**Zeitraum:** 1990–2025
**Serien:** ⏳ (Wind Land, Wind See, PV, Biomasse, Wasserkraft...)  
**Beobachtungen:** 576
**Chart:** Stacked Area (vorkonfiguriert)

> Photovoltaik überholt Wind: Solar ist 2023 zur größten installierten Ökostrom-Quelle geworden.

Installierte Leistung in GW. PV-Kapazität seit 2020 fast verdoppelt. Achtung: Kapazität ≠ Erzeugung (PV ~1.000 Vh/a, Wind ~2.000 Vh/a).

**Crossreferenzen:** `DF_ENERGY_AGEE_ELECTRICITY`, `DF_ENERGY_AGEE_SHARE`

---

### Stromerzeugung aus erneuerbaren Energien (`DF_ENERGY_AGEE_ELECTRICITY`)
**Status:** 📝 draft  
**Zeitraum:** 1990–2025
**Serien:** 32
**Beobachtungen:** 944
**Chart:** Stacked Area (vorkonfiguriert)

> Wind liefert mehr Strom als alle anderen Quellen zusammen – seit 2023.

2023 erstmals >50 % erneuerbarer Anteil am Bruttostromverbrauch. Wind gesamt: 141.000 GWh. AGEE-Stat-Schätzungen, vorläufige Jahreswerte.

**Crossreferenzen:** `DF_ENERGY_AGEE_CAPACITY`, `DF_ENERGY_AGEE_SHARE`, `DF_ENERGY_AGEE_HEAT`

---

### Wärmeversorgung aus erneuerbaren Energien (`DF_ENERGY_AGEE_HEAT`)
**Status:** 📝 draft  
**Zeitraum:** 1990–2025
**Serien:** ⏳ (Biomasse fest, Biogas, Solarthermie, Wärmepumpen, Tiefe Geothermie)  
**Beobachtungen:** 539
**Chart:** Stacked Area (vorkonfiguriert)

> Biomasse heizt Deutschland – Wärmepumpen und Solar spielen noch Nebenrollen.

Erneuerbare Wärme stagniert ~17–18 %. Biomasse >80 % des erneuerbaren Anteils. Wärmepumpen wachsen, aber von niedrigem Niveau.

**Crossreferenzen:** `DF_ENERGY_AGEE_HEAT_PUMP_STAT`, `DF_ENERGY_AGEE_SHARE`, `DF_ENV_ECON_ENERGY_CONSUMPTION`

---

### Wärmepumpen-Bestand und Installationen (`DF_ENERGY_AGEE_HEAT_PUMP_STAT`)
**Status:** 📝 draft  
**Zeitraum:** 1990–2025
**Serien:** 35
**Beobachtungen:** 1.260
**Chart:** Linie/Balken

> Über 2 Millionen Wärmepumpen in Deutschland – aber das Ziel von 500.000 Neuinstallationen pro Jahr wurde verfehlt.

Ende 2025: ~2,2 Mio. Anlagen. Luft-Wasser dominant. Einbruch bei Neuinstallationen 2024 nach GEG-Unsicherheit.

**Crossreferenzen:** `DF_ENERGY_AGEE_HEAT`, `DF_ENERGY_AGEE_SHARE`

---

### Investitionen in erneuerbare Energien (`DF_ENERGY_AGEE_ECONOMY`)
**Status:** 📝 draft  
**Zeitraum:** 2000–2025
**Serien:** 21
**Beobachtungen:** 546
**Chart:** Linie/Balken

> 2023 flossen fast 39 Milliarden Euro in neue Erneuerbare-Anlagen – Rekord.

Bruttoinvestitionen in Neubau + wirtschaftliche Effekte aus Betrieb. AGEE-Stat-Schätzungen, vorläufig.

**Crossreferenzen:** `DF_ENERGY_AGEE_CAPACITY`, `DF_ENERGY_AGEE_ELECTRICITY`

---

### Erneuerbare Energien im Verkehrssektor (`DF_ENERGY_AGEE_TRANSPORT`)
**Status:** 📝 draft  
**Zeitraum:** 1990–2025
**Serien:** 15
**Beobachtungen:** 334
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Biokraftstoffe aus Abfall werden doppelt angerechnet — kann Rohstoffeinsatz optisch verschleiern.

> Erneuerbare Energien im Verkehr wachsen – aber viel zu langsam für Klimaziele.

Fast ausschließlich Biokraftstoffe. Strom aus Erneuerbaren trotz E-Auto-Boom noch Nebenrolle. EU RED III Ziele 2030.

**Crossreferenzen:** `DF_TRANSPORT_ENERGY_FINAL`, `DF_TRANSPORT_VEHICLE_STOCK_TREND`, `DF_ENERGY_AGEE_SHARE`

---

## Verkehr

### Endenergieverbrauch im Verkehr nach Energieträger (`DF_TRANSPORT_ENERGY_FINAL`)
**Status:** 📝 draft  
**Zeitraum:** 1995–2023
**Serien:** ⏳ (Benzin, Diesel, Kerosin, Strom BEV, Elektro & Hybrid, Erdgas/Autogas)  
**Beobachtungen:** 197
**Chart:** Stacked Area (vorkonfiguriert)

> Der Verkehr verbrennt noch immer fast ausschließlich fossile Kraftstoffe.

Strom als Antrieb marginal. Diesel dominiert Schwerlast/Güter. Klimaschutzziel 2030: −48 % ggü. 1990. Internationaler Luftverkehr nur teilweise.

**Crossreferenzen:** `DF_TRANSPORT_ENERGY_FUEL_CONSUMPTION`, `DF_TRANSPORT_VEHICLE_STOCK_TREND`, `DF_ENERGY_AGEE_TRANSPORT`

---

### Kraftstoffverbrauch im Straßenverkehr (`DF_TRANSPORT_ENERGY_FUEL_CONSUMPTION`)
**Status:** 📝 draft  
**Zeitraum:** 2006–2023
**Serien:** 10
**Beobachtungen:** 180
**Chart:** Linie/Balken

> Mehr Fahrzeuge, mehr Kilometer – der Kraftstoffverbrauch sank erst mit dem E-Auto-Boom.

Nationales Fahrleistungskonzept (zählt auch im Ausland gefahrene km deutscher Fahrzeuge).

**Crossreferenzen:** `DF_TRANSPORT_ENERGY_FINAL`, `DF_TRANSPORT_TOTAL_PERFORMANCE_VEHICLE_TYPE`, `DF_TRANSPORT_VEHICLE_STOCK_TREND`

---

### Kraftstoffpreise an deutschen Tankstellen (`DF_TRANSPORT_ENERGY_FUEL_PRICES`)
**Status:** 📝 draft  
**Zeitraum:** 2006–2023
**Serien:** ⏳ (Benzin, Diesel, Steueranteil...)  
**Beobachtungen:** 36
**Chart:** Linie/Balken

> Benzin und Diesel fressen einen wachsenden Teil des Haushaltsbudgets.

Historische Höchststände 2022 (>2 €/l). Steueranteil konstant >50 %. KBA-Daten aus "Verkehr in Zahlen".

**Crossreferenzen:** `DF_TRANSPORT_ENERGY_FUEL_CONSUMPTION`, `DF_ENV_ECON_REVENUE_ENV_TAXES`

---

### Güterverkehrsleistung nach Verkehrsträger (`DF_TRANSPORT_FREIGHT_PERFORMANCE_MEANS`)
**Status:** 📝 draft  
**Zeitraum:** 1991–2023
**Serien:** ⏳ (Lkw Straße, Güterbahn, Binnenschiff, Pipeline, Luftfracht)  
**Beobachtungen:** 396
**Chart:** Stacked Area (vorkonfiguriert)

> Der Lkw dominiert Deutschlands Güterverkehr – und sein Anteil wächst weiter.

>70 % der Tonnenkilometer auf Straße. Einheit: Milliarden Tonnenkilometer. Grenzüberschreitende Transporte nur teilweise.

**Crossreferenzen:** `DF_TRANSPORT_FREIGHT_PERFORMANCE_SHARE`, `DF_TRANSPORT_ROUTES`

---

### Modal Split im Güterverkehr (`DF_TRANSPORT_FREIGHT_PERFORMANCE_SHARE`)
**Status:** 📝 draft  
**Zeitraum:** 2003–2022
**Serien:** 5
**Beobachtungen:** 100
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Lkw-Verkehr <50 km und Nutzfahrzeuge ≤3,5 t ausgeschlossen — Lkw-Anteil wirkt höher als im Alltagsbild.

> Bahn und Binnenschiff verlieren Anteile am deutschen Güterverkehr.

Schienenziel Bundesregierung 2030: 25 % Marktanteil. Aktuell weit darunter. Binnenschiff durch Niedrigwasser unter Druck.

**Crossreferenzen:** `DF_TRANSPORT_FREIGHT_PERFORMANCE_MEANS`, `DF_DAS_WASSER_WW_I_6`

---

### Personenverkehrsleistung nach Verkehrsträger (`DF_TRANSPORT_PASSENGER_PERFORMANCE_MEAN`)
**Status:** 📝 draft  
**Zeitraum:** 1991–2023
**Serien:** ⏳ (Auto & Motorrad MIV, Bus & Tram ÖPNV, Bahn, Flugzeug)  
**Beobachtungen:** 198
**Chart:** Stacked Area (vorkonfiguriert)

> Deutsche legen jährlich über 1 Billion Personenkilometer zurück – fast alles mit dem Auto.

MIV dominiert. Bahn wächst langsam. Luftverkehr erholt sich auf Vorkrisenniveau. Einheit: Milliarden Personenkilometer.

**Crossreferenzen:** `DF_TRANSPORT_PASSENGER_PERFORMANCE_SHARE`, `DF_TRANSPORT_PUBLIC_PASSENGERS_BUS_TRAIN`

---

### Modal Split im Personenverkehr (`DF_TRANSPORT_PASSENGER_PERFORMANCE_SHARE`)
**Status:** 📝 draft  
**Zeitraum:** 2003–2022
**Serien:** 6
**Beobachtungen:** 120
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Methodische Brüche in 2003, 2014, 2017 erzeugen Sprünge ohne reale Verhaltensänderung.

> Das 49-Euro-Ticket kam – doch der Autoanteil blieb fast unverändert.

Kein klarer Aufwärtstrend für Umweltverbund seit 2003. Pandemie 2020/21 verzerrte Bild.

**Crossreferenzen:** `DF_TRANSPORT_PASSENGER_PERFORMANCE_MEAN`, `DF_TRANSPORT_PUBLIC_PASSENGERS_BUS_TRAIN`

---

### Personenverkehrsleistung nach Fahrzeugart (`DF_TRANSPORT_PASSENGER_PERF_VEHICLE_TYPE_MEANS`)
**Status:** 📝 draft  
**Zeitraum:** 2000–2022
**Serien:** 61
**Beobachtungen:** 654
**Chart:** Linie/Balken

> SUV oder Zug? Welches Fahrzeug die meisten Personenkilometer erzeugt.

Aufschlüsselung nach konkretem Fahrzeugtyp. DLR + DIW Berlin-Hochrechnungen. >80 % MIV-Anteil.

**Crossreferenzen:** `DF_TRANSPORT_PASSENGER_PERFORMANCE_MEAN`, `DF_TRANSPORT_VEHICLE_STOCK_SEGMENT`

---

### Fahrleistung nach Antriebsart (`DF_TRANSPORT_PERFORMANCE_FUEL_VEHICLE_TYPE`)
**Status:** 📝 draft  
**Zeitraum:** 2006–2023
**Serien:** ⏳ (Diesel, Benzin, Elektro, Hybrid...)  
**Beobachtungen:** 90
**Chart:** Linie/Balken

> Elektroautos fahren im Schnitt weniger Kilometer als Verbrenner.

Diesel höchste Jahresdurchschnittskilometer. E-Autos deutlich weniger (Zweitwagen, kurze Alltagswege). Schließt im Ausland gefahrene km ein.

**Crossreferenzen:** `DF_TRANSPORT_VEHICLE_STOCK_TREND`, `DF_TRANSPORT_ENERGY_FUEL_CONSUMPTION`

---

### Gesamtfahrleistung nach Fahrzeugart (`DF_TRANSPORT_TOTAL_PERFORMANCE_VEHICLE_TYPE`)
**Status:** 📝 draft  
**Zeitraum:** 1991–2023
**Serien:** ⏳ (Pkw, Lkw, Busse, Motorräder, Sonstige)  
**Beobachtungen:** 363
**Chart:** Stacked Area (vorkonfiguriert, Einheit: Milliarden km)

> Über 700 Milliarden Fahrzeugkilometer pro Jahr – Pkw stellen drei Viertel davon.

KBA-Hochrechnungen. Nach COVID-Einbruch 2020 rasche Erholung. Pkw ~75 % aller Fahrzeugkilometer.

**Crossreferenzen:** `DF_TRANSPORT_ENERGY_FUEL_CONSUMPTION`, `DF_TRANSPORT_VEHICLE_STOCK_TREND`

---

### Fahrgastzahlen im öffentlichen Nahverkehr (`DF_TRANSPORT_PUBLIC_PASSENGERS_BUS_TRAIN`)
**Status:** 📝 draft  
**Zeitraum:** 2004–2022-Q4
**Serien:** 160
**Beobachtungen:** 6.371
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Quartalsweise Daten — höhere Granularität als die meisten anderen Datensätze (Jahreswerte).

> Busse und Bahnen verlieren Fahrgäste – und gewinnen sie nur langsam zurück.

−40 % im Coronajahr 2020. Erholung schleppend. 49-Euro-Ticket-Effekt direkt ablesbar. Fernverkehr absichtlich ohne Länderwerte.

**Crossreferenzen:** `DF_TRANSPORT_PASSENGER_PERFORMANCE_SHARE`, `DF_TRANSPORT_PASSENGER_PERFORMANCE_MEAN`

---

### Pkw-Bestand nach Antriebsart (`DF_TRANSPORT_VEHICLE_STOCK_TREND`)
**Status:** 📝 draft  
**Zeitraum:** 1991–2025
**Serien:** 5
**Beobachtungen:** 175
**Chart:** Linie/Balken

> 49 Millionen Autos – und davon sind nur 3 % elektrisch.

~49 Mio. Pkw gesamt. E-Autos >1,65 Mio. = ~3 %. Diesel + Benzin >90 %. KBA-Zulassungsregister zum 1. Januar.

**Crossreferenzen:** `DF_TRANSPORT_VEHICLE_STOCK_TREND_FUEL`, `DF_TRANSPORT_VEHICLE_STOCK_SEGMENT`, `DF_TRANSPORT_ENERGY_FINAL`

---

### Pkw-Neuzulassungen nach Kraftstoffart (`DF_TRANSPORT_VEHICLE_STOCK_TREND_FUEL`)
**Status:** ✅ reviewed  
**Zeitraum:** 2006–2025
**Serien:** ⏳ (Diesel, Benzin, Sonstige, Hybrid, PHEV, BEV)  
**Beobachtungen:** 321
**Chart:** Stacked Area (vorkonfiguriert)

> Von 2.000 auf 1,65 Millionen: Deutschlands E-Auto-Bestand in 20 Jahren.

E-Pkw 2021–2025 verfünffacht. PHEV: ~967.000. EU-Verbrennerverbot 2035 erhöht Druck. Enthält auch Lkw (filterbar).

**Crossreferenzen:** `DF_TRANSPORT_VEHICLE_STOCK_TREND`, `DF_TRANSPORT_PERFORMANCE_FUEL_VEHICLE_TYPE`

---

### Pkw-Bestand nach Fahrzeugsegment (`DF_TRANSPORT_VEHICLE_STOCK_SEGMENT`)
**Status:** 📝 draft  
**Zeitraum:** 2009–2025
**Serien:** 22
**Beobachtungen:** 374
**Chart:** Linie/Balken

> SUVs verdrängen Kleinwagen – Deutschlands Autoflotte wird größer und schwerer.

KBA M1-Kategorie. Nur Fahrzeuge ab Erstzulassung 1990. SUV-Anteil wächst kontinuierlich.

**Crossreferenzen:** `DF_TRANSPORT_VEHICLE_STOCK_TREND`, `DF_TRANSPORT_TOTAL_PERFORMANCE_VEHICLE_TYPE`

---

### Streckenlänge Straße und Schiene (`DF_TRANSPORT_ROUTES`)
**Status:** 📝 draft  
**Zeitraum:** 1991–2023
**Serien:** ⏳ (Straßennetz, Schiene, Binnenwasserstraßen, Pipelines)  
**Beobachtungen:** 322
**Chart:** Linie/Balken

> Deutschlands Straßennetz wächst, während die Schiene stagniert.

Schienennetz seit 1990er Jahren geschrumpft. Bildet nur Länge ab, nicht Zustand oder Auslastung.

**Crossreferenzen:** `DF_TRANSPORT_FREIGHT_PERFORMANCE_MEANS`, `DF_TRANSPORT_PASSENGER_PERFORMANCE_MEAN`

---

### Verkehrsfläche nach Bundesland (`DF_TRANSPORT_TRAFFIC_AREA_BUNDESLAND`)
**Status:** 📝 draft  
**Zeitraum:** 2016–2022
**Serien:** ⏳ (16 Bundesländer)  
**Beobachtungen:** 12.970
**Chart:** Linie/Balken

> Bundesland für Bundesland: Wo Deutschland am meisten Boden für Verkehr verbraucht.

Amtliche Flächenerhebung Statistisches Bundesamt. Bildet keine Qualität/Auslastung ab.

**Crossreferenzen:** `DF_TRANSPORT_TRAFFIC_AREA_LONG_TIMESERIES`, `DF_AREA_SOIL_LAND_ECOSYSTEMS_AREA`

---

### Verkehrsfläche Deutschland Langzeitreihe (`DF_TRANSPORT_TRAFFIC_AREA_LONG_TIMESERIES`)
**Status:** 📝 draft  
**Zeitraum:** 1992–2015
**Serien:** 13
**Beobachtungen:** 216
**Chart:** Linie/Balken  
**⚠️ Hinweis:** "Siedlungs- und Verkehrsfläche" umfasst auch unversiegelte Grünflächen — kein direktes Maß für Bodenversiegelung.

> Deutschlands Verkehrsfläche wächst seit drei Jahrzehnten ungebremst.

Stichtag 31. Dezember. Summe über Jahrzehnte: mehrere hundert km² Zuwachs ≈ Fläche größer Berlin.

**Crossreferenzen:** `DF_TRANSPORT_TRAFFIC_AREA_BUNDESLAND`, `DF_AREA_SOIL_LAND_ECOSYSTEMS_AREA`

---

## Wasser

### Grundwasserqualität in Deutschland (`DF_WATER_GROUNDWATER`)
**Status:** 📝 draft  
**Zeitraum:** ⏳ API-Daten ausstehend  
**Serien:** ⏳ (Messstellen × Parameter)  
**Beobachtungen:** ⏳  
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Hohe Serienzahl erwartet (viele Messstellen × Schadstoffparameter). Filter zwingend.

> Deutschlands Grundwasser zeigt flächendeckend erhöhte Nitrat- und Schadstoffbelastung.

EEA-Messnetz, repräsentative Stichprobe. Nitrat in Landwirtschaftsregionen über EU-Grenzwerten. Verschiedene Messintervalle und -methoden je Bundesland.

**Crossreferenzen:** `DF_WATER_PUB_EXTRAC`, `DF_WATER_PUB_SUPPLY`, `DF_AGRICULTURE_FORESTRY_NITROGEN_SURPLUS`, `DF_DAS_WASSER_WW_I_1`

---

### Grundwasserentnahme für die öffentliche Versorgung (`DF_WATER_PUB_EXTRAC`)
**Status:** 📝 draft  
**Zeitraum:** 2007–2022
**Serien:** 136
**Beobachtungen:** 816
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Dreijahres-Erhebungsrhythmus — weniger Datenpunkte als Jahresdaten.

> Deutschland entnimmt weniger Grundwasser – doch regionale Engpässe verschärfen sich.

Statistisches Bundesamt. Sinkt seit 1990er trotz Bevölkerungswachstum. Private Brunnen/Landwirtschaft nicht erfasst.

**Crossreferenzen:** `DF_WATER_PUB_SUPPLY`, `DF_WATER_GROUNDWATER`, `DF_DAS_WASSER_WW_R_1`

---

### Öffentliche Wasserversorgung nach Wasserart (`DF_WATER_PUB_SUPPLY`)
**Status:** 📝 draft  
**Zeitraum:** 2007–2022
**Serien:** ⏳ (Grundwasser, Quellen, Oberflächenwasser, Uferfiltrat)  
**Beobachtungen:** 321
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Dreijahres-Erhebungsrhythmus — weniger Datenpunkte als Jahresdaten.

> Deutschlands Grundwasser trägt die öffentliche Wasserversorgung fast allein.

Grundwasseranteil >60 %. Dreijahresrhythmus macht Dürrejahre nicht direkt sichtbar.

**Crossreferenzen:** `DF_WATER_PUB_EXTRAC`, `DF_WATER_GROUNDWATER`, `DF_DAS_WASSER_WW_I_1`

---

## Wassermonitoring (DAS)

### Terrestrische Wasserspeicherung (`DF_DAS_WASSER_WW_I_1`)
**Status:** 📝 draft  
**Zeitraum:** 2002-04–2021-12
**Serien:** 1
**Beobachtungen:** 204
**Chart:** Linie/Balken

> Deutschland verliert seit zwei Jahrzehnten kontinuierlich Wasser im Boden.

GRACE-Satelliten messen Schwerefeldschwankungen → Wassermengen ober- und unterirdisch. Räumlich gemittelt, keine Einzelregionen.

**Crossreferenzen:** `DF_DAS_WASSER_WW_I_3`, `DF_DAS_WASSER_WW_I_6`, `DF_DAS_WASSER_WW_I_7`, `DF_WATER_GROUNDWATER`

---

### Abfluss der Fließgewässer (`DF_DAS_WASSER_WW_I_3`)
**Status:** 📝 draft  
**Zeitraum:** 1961–2021
**Serien:** ⏳ (76 Pegel, Sommer/Winter-Halbjahr)  
**Beobachtungen:** 122
**Chart:** Linie/Balken

> Deutschlands Flüsse führen im Sommer messbar weniger Wasser als früher.

Sommer-Halbjahr: statistisch signifikanter Rückgang seit 1961. Winter: kein signifikanter Trend. 76 Pegel.

**Crossreferenzen:** `DF_DAS_WASSER_WW_I_1`, `DF_DAS_WASSER_WW_I_6`, `DF_CLIMATE_GERMANY_PRECIPATION`

---

### Hochwasserereignisse an deutschen Flüssen (`DF_DAS_WASSER_WW_I_4`)
**Status:** 📝 draft  
**Zeitraum:** 1961–2021
**Serien:** ⏳ (ausgewählte Pegel nach Flussgebiet)  
**Beobachtungen:** 610
**Chart:** Linie/Balken

> Hochwasser trifft Deutschland unregelmäßig, aber mit räumlichen Schwerpunkten.

Kein pauschaler Langzeittrend nachweisbar. Schwellenwertbasierte Identifikation. Ahrtal 2021 als Kontext.

**Crossreferenzen:** `DF_DAS_WASSER_WW_I_3`, `DF_DAS_WASSER_WW_R_2`, `DF_CLIMATE_GERMANY_PRECIPATION`

---

### Niedrigwasserereignisse an deutschen Flüssen (`DF_DAS_WASSER_WW_I_6`)
**Status:** 📝 draft  
**Zeitraum:** 1960–2021
**Serien:** 2
**Beobachtungen:** 124
**Chart:** Linie/Balken

> Drei Dürrejahre in Folge haben Deutschlands Flüsse auf ein historisches Tief gebracht.

2018, 2019, 2020: drei aufeinanderfolgende Extremjahre. Binnenschifffahrt und Kraftwerkkühlung betroffen. BfG-Daten.

**Crossreferenzen:** `DF_DAS_WASSER_WW_I_1`, `DF_DAS_WASSER_WW_I_3`, `DF_TRANSPORT_FREIGHT_PERFORMANCE_SHARE`

---

### Wasserstand deutscher Seen (`DF_DAS_WASSER_WW_I_7`)
**Status:** 📝 draft  
**Zeitraum:** 1961–2021
**Serien:** 2
**Beobachtungen:** 122
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Zeitreihe beginnt erst 2014 — zu kurz für belastbare Langzeitaussagen.

> Deutschlands Seen verlieren seit Jahrzehnten stetig an Wasser.

Jährliche Abweichung vom Referenzwert. Norddeutsche Tiefebene und Alpenvorlandseen.

**Crossreferenzen:** `DF_DAS_WASSER_WW_I_1`, `DF_DAS_WASSER_WW_I_9`

---

### Frühjahrsalgenblüte in deutschen Seen (`DF_DAS_WASSER_WW_I_9`)
**Status:** 📝 draft  
**Zeitraum:** 2003–2021
**Serien:** ⏳ (begrenzte Anzahl Seen)  
**Beobachtungen:** 45
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Nur begrenzte Anzahl Seen — keine bundesweite Repräsentativität.

> Algenblüten in deutschen Seen starten immer früher im Jahr.

Brockmann Consult + CAU Kiel. Milde Winter + warme Frühjahre verschieben Start systematisch.

**Crossreferenzen:** `DF_DAS_WASSER_WW_I_7`, `DF_DAS_WASSER_WW_I_10`, `DF_CLIMATE_GERMANY_TEMPERATURE_SEASONAL`

---

### Wassertemperatur der Fließgewässer (`DF_DAS_WASSER_WW_I_10`)
**Status:** 📝 draft  
**Zeitraum:** 1981–2021
**Serien:** ⏳ (mehrere Flussregionen)  
**Beobachtungen:** 173
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Äschenregion: Zeitreihe zu kurz für belastbaren Langzeittrend.

> Deutschlands Flüsse werden wärmer – Fische sterben bereits.

Fischsterben Extremjahr 2018 (Sauerstoffmangel). EU-WRRL gefährdet. Kraftwerkkühlung betroffen.

**Crossreferenzen:** `DF_DAS_WASSER_WW_I_3`, `DF_CLIMATE_GERMANY_TEMPERATURE_MEAN`

---

### Wassernutzungsindex Deutschland (`DF_DAS_WASSER_WW_R_1`)
**Status:** 📝 draft  
**Zeitraum:** 1991–2021
**Serien:** 3
**Beobachtungen:** 51
**Chart:** Linie/Balken

> Deutschland verbraucht weniger Wasser als je zuvor – doch regional droht Knappheit.

Seit 2007 dauerhaft <20 % (kritische EU-Schwelle). Regional: Ostdeutschland und Rheingraben teilweise >20 %.

**Crossreferenzen:** `DF_WATER_PUB_EXTRAC`, `DF_DAS_WASSER_WW_I_1`

---

### GAK-Mittel für den Hochwasserschutz (`DF_DAS_WASSER_WW_R_2`)
**Status:** 📝 draft  
**Zeitraum:** 2007–2021
**Serien:** ⏳ (Bund, Länder, EU-Anteile)  
**Beobachtungen:** 60
**Chart:** Linie/Balken

> Seit 2015 fließen deutlich mehr Bundesmittel in den Hochwasserschutz.

GAK Sonderrahmenplan seit 2015. Mittelabflüsse, nicht Budgets — Projektverzögerungen verzerren Jahreswerte.

**Crossreferenzen:** `DF_DAS_WASSER_WW_I_4`, `DF_DAS_WASSER_WW_R_3`

---

### Hochwasserschutz-Investitionen Hessen (`DF_DAS_WASSER_WW_R_3`)
**Status:** 📝 draft  
**Zeitraum:** 2000–2021
**Serien:** 4
**Beobachtungen:** 88
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Nur Hessen. Kommunale Eigenmittel und Gewässer 1. Ordnung nicht vollständig erfasst. Sehr eingeschränkte Vergleichbarkeit.

> Hessen investierte 234 Millionen Euro in den Hochwasserschutz – lokale Kosten fehlen.

234 Mio. über 10 Jahre aus Bund + Land Hessen. Jahresdynamik aus Datensatz nicht direkt ablesbar.

**Crossreferenzen:** `DF_DAS_WASSER_WW_R_2`, `DF_DAS_WASSER_WW_I_4`

---

## Abfall

### Haushaltsabfall nach Abfallart (`DF_WASTE_HOUSEHOLDS_TYPE`)
**Status:** 📝 draft  
**Zeitraum:** 2004–2023
**Serien:** ⏳ (Bioabfall, Restmüll, Verpackungen, Papier, Sperrmüll...)  
**Beobachtungen:** 724
**Chart:** Linie/Balken

> Deutsche Haushalte produzieren mehr Müll als je zuvor.

Nur an öffentliche Entsorgung übergebener Abfall. Illegale Entsorgung, Selbstkompostierung ausgeschlossen. EU-Recyclingziel 2035: 65 %.

**Crossreferenzen:** `DF_WASTE_RECOVERY_RATE`, `DF_WASTE_VOLUME`, `DF_CONSUMPTION_SPENDING_USE`

---

### Recycling- und Verwertungsquoten (`DF_WASTE_RECOVERY_RATE`)
**Status:** 📝 draft  
**Zeitraum:** 2021–2023
**Serien:** 54
**Beobachtungen:** 162
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Zweijährliche Veröffentlichung — weniger Datenpunkte als Jahresdaten.

> Deutschland recycelt mehr Abfall – doch die Fortschritte verlangsamen sich.

Berechnungsmodell, zweijährlich. EU-Vorgabe 2025: 55 %, 2035: 65 %. Plateau bei leicht verwertbaren Strömen erreicht.

**Crossreferenzen:** `DF_WASTE_HOUSEHOLDS_TYPE`, `DF_WASTE_VOLUME`, `DF_WASTE_RE_T_RAW_MATERIAL_PROD`

---

### Gesamtabfallaufkommen nach Entsorgungsweg (`DF_WASTE_VOLUME`)
**Status:** 📝 draft  
**Zeitraum:** 2021–2023
**Serien:** 162
**Beobachtungen:** 480
**Chart:** Linie/Balken

> Deutschland produziert jährlich Millionen Tonnen Abfall – die Bilanz zeigt, wohin er fließt.

Bruttomengenprinzip ab 2006. Europäischer Abfallkatalog. Informelle Entsorgung nicht erfasst.

**Crossreferenzen:** `DF_WASTE_HOUSEHOLDS_TYPE`, `DF_WASTE_RECOVERY_RATE`, `DF_WASTE_VOLUMENS_PACKAGING`

---

### Verpackungsabfall nach Material (`DF_WASTE_VOLUMENS_PACKAGING`)
**Status:** 📝 draft  
**Zeitraum:** 1991–2021
**Serien:** ⏳ (Plastik, Glas, Papier, Metall...)  
**Beobachtungen:** 620
**Chart:** Linie/Balken

> Deutschland verpackt mehr – der Müllberg aus Plastik, Papier und Glas wächst.

GVM-Daten. Kunststoffverpackungen stärkster Zuwachs. EU-Verpackungsverordnung fordert absolute Reduktion.

**Crossreferenzen:** `DF_WASTE_VOL_PACKAGING_DISPOSAL`, `DF_WASTE_VOLUME`, `DF_CONSUMPTION_SPENDING_USE`

---

### Verpackungsabfall nach Entsorgungsweg (`DF_WASTE_VOL_PACKAGING_DISPOSAL`)
**Status:** 📝 draft  
**Zeitraum:** 1991–2021
**Serien:** 1
**Beobachtungen:** 31
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Gesetzliche Definitionen haben sich über Jahre verändert — Zeitreihenvergleiche eingeschränkt.

> Onlinehandel und Takeaway treiben Deutschlands Verpackungsmüll in die Höhe.

GVM-Daten nach deutschem Verpackungsgesetz. Verbundmaterialien unterschiedlich zur EU-Statistik zugeordnet.

**Crossreferenzen:** `DF_WASTE_VOLUMENS_PACKAGING`, `DF_WASTE_RECOVERY_RATE`

---

### Rohstoffproduktivität der deutschen Wirtschaft (`DF_WASTE_RE_T_RAW_MATERIAL_PROD`)
**Status:** 📝 draft  
**Zeitraum:** 2000–2030
**Serien:** 2
**Beobachtungen:** 29
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Importierte Rohstoffe tragen vollen Importwert bei, belasten Nenner nicht vollständig — beschönigt globale Materialbelastung.

> Deutschland produziert mehr Wirtschaftsleistung pro verbrauchter Tonne Rohstoff.

Index-Basis 2010. Relative Entkopplung, keine absolute. Offizieller DNS-Indikator.

**Crossreferenzen:** `DF_ENV_ECON_MATERIAL_ACCOUNT`, `DF_CONSUMPTION_GLOBAL_ENV_FOOTPRINT`

---

## Landwirtschaft

### Schadholzeinschlag in deutschen Wäldern (`DF_AGRICULTURE_FORESTRY_DAMAGED_WOOD`)
**Status:** 📝 draft  
**Zeitraum:** 2006–2023
**Serien:** ⏳ (Schadursache, Baumart, Waldbesitzart)  
**Beobachtungen:** 1.880
**Chart:** Linie/Balken

> Deutschlands Wälder fallen in Rekordzahlen – Schäden treiben die Ernte.

Dürrejahre 2018–2020: historische Schadholz-Höchststände. Borkenkäfer + Sturm + Trockenheit. Nur geborgenes Holz — Totholz im Bestand unterschätzt Gesamtschaden.

**Crossreferenzen:** `DF_AGRICULTURE_FORESTRY_TIMBER_HARVEST`, `DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA`, `DF_CLIMATE_GERMANY_TEMPERATURE_MEAN`

---

### Holzeinschlag in deutschen Wäldern (`DF_AGRICULTURE_FORESTRY_TIMBER_HARVEST`)
**Status:** 📝 draft  
**Zeitraum:** 2006–2024
**Serien:** ⏳ (Holzart, Baumart, Eigentumsform)  
**Beobachtungen:** 2.375
**Chart:** Linie/Balken

> Deutschlands Wälder liefern weniger Holz – Dürre und Borkenkäfer zeigen Wirkung.

Schadholzanteil >70 % des Gesamteinschlags nach 2018. Amtliche Holzeinschlagsstatistik StBA. Kleinprivatwälder teilweise untererfasst.

**Crossreferenzen:** `DF_AGRICULTURE_FORESTRY_DAMAGED_WOOD`, `DF_CLIMATE_EMISSIONS_GHG_TRENDS`

---

### Waldbrandflächen und -ursachen (`DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA`)
**Status:** 📝 draft  
**Zeitraum:** 1991–2023
**Serien:** ⏳ (Fläche, Ursachen, Kosten)  
**Beobachtungen:** 396
**Chart:** Linie/Balken

> Deutschlands Wälder brennen häufiger – und der Mensch zündet meistens selbst.

Trockenjahre 2018, 2019, 2022: Sprunganstieg. Fahrlässigkeit/Brandstiftung dominant. Meldungen der Landesforstbehörden an BMEL.

**Crossreferenzen:** `DF_AGRICULTURE_FORESTRY_DAMAGED_WOOD`, `DF_CLIMATE_GERMANY_TEMPERATURE_MEAN`, `DF_CLIMATE_GERMANY_PRECIPATION`

---

### Stickstoffüberschuss in der Landwirtschaft (`DF_AGRICULTURE_FORESTRY_NITROGEN_SURPLUS`)
**Status:** 📝 draft  
**Zeitraum:** 1990–2022
**Serien:** 4
**Beobachtungen:** 128
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Methodische Änderungen schränken Vergleichbarkeit mit älteren Publikationsreihen ein.

> Deutschlands Äcker verlieren jedes Jahr Tausende Tonnen Stickstoff unkontrolliert.

EU-Ziel: ≤70 kg N/ha bis 2030. Deutschland verfehlt. EU-Vertragsverletzungsverfahren. Berechnungsmodell aus Differenz Einbringung minus Abgabe.

**Crossreferenzen:** `DF_WATER_GROUNDWATER`, `DF_AIR_EMISSIONS_TRENDS`, `DF_AGRICULTURE_FORESTRY_TIMBER_HARVEST`

---

## Fläche & Boden

### Siedlungs- und Verkehrsfläche nach Bundesland (`DF_AREA_SOIL_LAND_ECOSYSTEMS_AREA`)
**Status:** 📝 draft  
**Zeitraum:** 2016–2022
**Serien:** ⏳ (Bundesländer × Nutzungsarten)  
**Beobachtungen:** 3.540
**Chart:** Linie/Balken — auch als Choropleth Map (AnalysePage)

> Siedlungsflächen wachsen – Deutschlands Böden versiegeln weiter.

~50 ha/Tag neu überbaut. Flächenziel 2030: <30 ha/Tag. StBA nach tatsächlicher Nutzungsart (nicht Planung). Unterschiedliche Länder-Erfassungsstandards.

**Crossreferenzen:** `DF_TRANSPORT_TRAFFIC_AREA_LONG_TIMESERIES`, `DF_TRANSPORT_TRAFFIC_AREA_BUNDESLAND`

---

## Umwelt & Wirtschaft

### Energieverbrauch nach Sektor (`DF_ENV_ECON_ENERGY_CONSUMPTION`)
**Status:** 📝 draft  
**Zeitraum:** 1995–2020
**Serien:** ⏳ (Sektoren: Verkehr, Industrie, Haushalte, Gewerbe...)  
**Beobachtungen:** 1.274
**Chart:** Linie/Balken

> Deutschlands Gesamtenergieverbrauch sinkt – doch der Verkehr bleibt hartnäckig auf dem alten Niveau.

Primärenergieverbrauch. Energieeffizienzgesetz 2023: −39 % bis 2030 ggü. 2008. Kein indirekter Energieverbrauch durch Importe.

**Crossreferenzen:** `DF_ENV_ECON_ENERGY_USAGE`, `DF_ENERGY_AGEE_SHARE`, `DF_CLIMATE_EMISSIONS_GHG_TRENDS`

---

### Industrieenergieverbrauch nach Branche (`DF_ENV_ECON_ENERGY_USAGE`)
**Status:** 📝 draft  
**Zeitraum:** 1995–2020
**Serien:** ⏳ (Branchen × Energieträger)  
**Beobachtungen:** 12.251
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Doppelzählung wenn Betriebe Brennstoff zur Eigenstromversorgung nutzen.

> Chemie und Stahl treiben Deutschlands Industrieenergieverbrauch – Gas bleibt der dominierende Brennstoff.

**Crossreferenzen:** `DF_ENV_ECON_ENERGY_CONSUMPTION`, `DF_PRTR`

---

### Materialverbrauch der deutschen Wirtschaft (`DF_ENV_ECON_MATERIAL_ACCOUNT`)
**Status:** 📝 draft  
**Zeitraum:** 1994–2023
**Serien:** ⏳ (Rohstoffarten, Import/Export/Inland)  
**Beobachtungen:** 7.727
**Chart:** Linie/Balken

> Deutschland verbraucht jährlich Milliarden Tonnen Material – Tendenz sinkend.

Physisches Gewicht aller Materialflüsse. Wasser + Luftgase ausgeklammert. Inländischer Abbau gesunken (weniger Braunkohle), Importe hoch.

**Crossreferenzen:** `DF_WASTE_RE_T_RAW_MATERIAL_PROD`, `DF_CONSUMPTION_GLOBAL_ENV_FOOTPRINT`

---

### Umweltschutzausgaben nach Träger (`DF_ENV_ECON_PROTECTION_EXPENDITURE`)
**Status:** 📝 draft  
**Zeitraum:** 2010–2022
**Serien:** ⏳ (Staat, Unternehmen, Haushalte)  
**Beobachtungen:** 122
**Chart:** Linie/Balken

> Unternehmen tragen den Löwenanteil des deutschen Umweltschutzes – der Staat folgt erst.

Umweltgesamtrechnungen StBA. Indirekte Kosten und kleine Akteure nicht vollständig.

**Crossreferenzen:** `DF_ENV_ECON_PROTECTION_EXPENDITURE_AREA`, `DF_ENV_ECON_REVENUE_ENV_TAXES`

---

### Umweltschutzausgaben nach Umweltbereich (`DF_ENV_ECON_PROTECTION_EXPENDITURE_AREA`)
**Status:** 📝 draft  
**Zeitraum:** 2010–2022
**Serien:** ⏳ (Gewässerschutz, Abfall, Luftreinhaltung, Lärm, Artenschutz...)  
**Beobachtungen:** 98
**Chart:** Linie/Balken

> Abwasser und Abfall schlucken zwei Drittel aller deutschen Umweltschutzausgaben.

Verursacherprinzip. Abwasser + Abfall dominant. Ergänzung zu `DF_ENV_ECON_PROTECTION_EXPENDITURE` mit Bereichsgliederung.

**Crossreferenzen:** `DF_ENV_ECON_PROTECTION_EXPENDITURE`, `DF_ENV_ECON_REVENUE_ENV_TAXES`

---

### Einnahmen aus Umweltsteuern und CO₂-Handel (`DF_ENV_ECON_REVENUE_ENV_TAXES`)
**Status:** 📝 draft  
**Zeitraum:** 1995–2023
**Serien:** 14
**Beobachtungen:** 251
**Chart:** Linie/Balken

> CO₂-Zertifikate spülen Milliarden in den Staatshaushalt – und der Betrag wächst jedes Jahr.

Energie-, Strom- und Kfz-Steuer + EU-ETS-Erlöse. Bildet ein, was der Staat einnimmt — nicht ob es Verhalten ändert.

**Crossreferenzen:** `DF_ENV_ECON_TAXES`, `DF_TRANSPORT_ENERGY_FUEL_PRICES`

---

### Umweltsteuern nach Steuerart (`DF_ENV_ECON_TAXES`)
**Status:** 📝 draft  
**Zeitraum:** 2008–2023
**Serien:** ⏳ (Energiesteuer, Stromsteuer, Kfz-Steuer, CO₂-Preis...)  
**Beobachtungen:** 1.680
**Chart:** Linie/Balken

> Deutschland nimmt Milliarden durch Umweltsteuern ein – aber lenken sie wirklich um?

Bemessungsgrundlage: physische Einheit mit Umweltwirkung. Verhaltenswirkung nicht enthalten.

**Crossreferenzen:** `DF_ENV_ECON_REVENUE_ENV_TAXES`, `DF_ENV_ECON_PROTECTION_EXPENDITURE`

---

## Konsum

### Geräteausstattung nach Einkommensgruppe (`DF_CONSUMPTION_EQUIPMENT_LEVEL`)
**Status:** 📝 draft  
**Zeitraum:** 2021-01-01–2022-01-01
**Serien:** ⏳ (Einkommensklassen × Gerätetypen)  
**Beobachtungen:** 563
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Nur alle 5 Jahre erhoben (EVS). Haushalte >18.000 €/Monat netto ausgeschlossen — Spreizung unterschätzt.

> Ärmere Haushalte besitzen deutlich weniger Elektrogeräte als reiche.

Einkommens- und Verbrauchsstichprobe StBA. E-Auto/Wärmepumpe-Förderung trifft einkommensschwächere kaum.

**Crossreferenzen:** `DF_CONSUMPTION_EQUIPMENT_LEVEL_TOTAL`, `DF_CONSUMPTION_SPENDING_USE`

---

### Geräteausstattung privater Haushalte (`DF_CONSUMPTION_EQUIPMENT_LEVEL_TOTAL`)
**Status:** 📝 draft  
**Zeitraum:** 2000-01-01–2022-01-01
**Serien:** 78
**Beobachtungen:** 832
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Nur alle 5 Jahre erhoben.

> Deutsche Haushalte kaufen mehr Geräte – trotz Klimazielen.

Selbstständige, Landwirte, Haushalte >18.000 €/Monat ausgeschlossen. EU-Ökodesign-Verordnung als Referenzrahmen.

**Crossreferenzen:** `DF_CONSUMPTION_EQUIPMENT_LEVEL`, `DF_CONSUMPTION_SPENDING_USE`

---

### Globaler Umweltfußabdruck deutscher Haushalte (`DF_CONSUMPTION_GLOBAL_ENV_FOOTPRINT`)
**Status:** 📝 draft  
**Zeitraum:** 2010–2021
**Serien:** ⏳ (Biokapazität, Materialverbrauch, THG)  
**Beobachtungen:** 36
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Daten erscheinen mit mehrjähriger Verzögerung.

> Deutsche Haushalte verbrauchen mehr Ressourcen, als die Erde verkraftet.

Inklusive Auslandseffekte (z.B. Lebensmittelimporte). DNS-Indikator 12.1.b. Durchschnittswerte, keine Einzelhaushalte.

**Crossreferenzen:** `DF_CONSUMPTION_SPENDING_USE`, `DF_ENV_ECON_MATERIAL_ACCOUNT`, `DF_WASTE_RE_T_RAW_MATERIAL_PROD`

---

### Wohnfläche pro Person in Deutschland (`DF_CONSUMPTION_LIVING_SPACE`)
**Status:** 📝 draft  
**Zeitraum:** 2015-12-31–2023-12-31
**Serien:** 8
**Beobachtungen:** 72
**Chart:** Linie/Balken

> Deutsche Wohnfläche wächst – obwohl die Bevölkerung schrumpft.

~47 m² pro Person heute (15 m² in den 1950ern). Klimaziel Gebäudesektor bis 2045 nahezu null. Baugenehmigungen + Zensus + Fortschreibungen.

**Crossreferenzen:** `DF_CONSUMPTION_SPENDING_USE`, `DF_AREA_SOIL_LAND_ECOSYSTEMS_AREA`, `DF_ENERGY_AGEE_HEAT`

---

### Konsumausgaben privater Haushalte nach Verwendungszweck (`DF_CONSUMPTION_SPENDING_USE`)
**Status:** 📝 draft  
**Zeitraum:** 1991–2024
**Serien:** ⏳ (Lebensmittel, Energie, Mobilität, Wohnen, Freizeit...)  
**Beobachtungen:** 510
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Nominale Preise, nicht inflationsbereinigt — Preisanstieg und echter Verbrauch nicht trennbar.

> Wofür Deutsche ihr Geld ausgeben, zeigt den ökologischen Fußabdruck der Gesellschaft.

>1,8 Bio. € Jahresausgaben. VGR-Daten. ProgRess und DNS als Zielrahmen.

**Crossreferenzen:** `DF_CONSUMPTION_GLOBAL_ENV_FOOTPRINT`, `DF_WASTE_HOUSEHOLDS_TYPE`, `DF_WASTE_VOLUMENS_PACKAGING`

---

## GHG-Projektionen

> **Hinweis zu dieser Kategorie:** Alle CROSS-Datensätze enthalten projizierte Zukunftsszenarien, keine gemessenen Vergangenheitswerte. Zeitachse zeigt Zukunftsjahre (ab ~2024). Serien repräsentieren Szenarien ("mit Maßnahmen", "ohne Maßnahmen", "mit weiteren Maßnahmen").

### Rahmendaten der Treibhausgasprojektionen (`DF_CROSS_PROJECTION_REPORT_BASIC`)
**Status:** 📝 draft  
**Zeitraum:** 1991–2050
**Serien:** ⏳ (Bevölkerung, BIP, Energiepreise, CO₂-Preis)  
**Beobachtungen:** 4.284
**Chart:** Linie/Balken

> Deutschlands Klimaprojektionen stehen auf wackeligem Fundament aus Annahmen.

Oeko-Institut + Prognos. Energiepreise und Wirtschaftsannahmen laufend aktualisiert. Szenarien, keine Prognosen.

**Crossreferenzen:** `DF_CROSS_PROJECTION_REPORT_BASIC_26`, `DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_25`, `DF_CROSS_PROJECTION_REPORT_FINAL_CONSUMER_PRICES`

---

### Rahmendaten Projektion 2026 (`DF_CROSS_PROJECTION_REPORT_BASIC_26`)
**Status:** 📝 draft  
**Zeitraum:** 2024–2050
**Serien:** 208
**Beobachtungen:** 5.404
**Chart:** Linie/Balken

> Deutschland rechnet bis 2050 mit sinkenden Großhandelspreisen für fossile Energien.

Langsameres Wirtschaftswachstum, leicht schrumpfende Bevölkerung. CO₂-Zertifikate deutlich teurer.

**Crossreferenzen:** `DF_CROSS_PROJECTION_REPORT_BASIC`, `DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_26`

---

### Klimaprojektionen Kernindikatoren 2023 (`DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_23`)
**Status:** 📝 draft  
**Zeitraum:** 2023–2050
**Serien:** ⏳ (Sektoren)  
**Beobachtungen:** 7.635
**Chart:** Linie/Balken

> Projektion 2023: Gebäude und Verkehr werden ihre Sektorziele bis 2030 verfehlen.

Sechs Forschungsinstitute im UBA-Auftrag. Energiesektor durch EE-Ausbau auf Kurs.

**Crossreferenzen:** `DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_25`, `DF_CLIMATE_EMISSIONS_GHG_TRENDS_KSG`

---

### Klimaprojektionen Kernindikatoren 2025 (`DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_25`)
**Status:** 📝 draft  
**Zeitraum:** 2025–2050
**Serien:** ⏳ (Sektoren × Szenarien)  
**Beobachtungen:** 11.436
**Chart:** Linie/Balken

> Projektion 2025: Selbst mit zusätzlichen Maßnahmen verfehlt Deutschland das 65-Prozent-Ziel.

Messlatte: Klimaneutralität 2045. Zwei Szenarien: bestehende + geplante Maßnahmen.

**Crossreferenzen:** `DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_23`, `DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_26`

---

### Klimaprojektionen Kernindikatoren 2026 (`DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_26`)
**Status:** 📝 draft  
**Zeitraum:** 2026–2055
**Serien:** 270
**Beobachtungen:** 6.221
**Chart:** Linie/Balken

> Projektion 2026: Die Lücke zu Deutschlands Klimazielen hat sich kaum geschlossen.

Aktuellste Projektion. Lücke ggü. Vorjahr kaum geschlossen. Sechs Institute im UBA-Auftrag.

**Crossreferenzen:** `DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_25`, `DF_CROSS_PROJECTION_REPORT_BASIC_26`

---

### Energiepreisentwicklung bis 2045 (`DF_CROSS_PROJECTION_REPORT_FINAL_CONSUMER_PRICES`)
**Status:** 📝 draft  
**Zeitraum:** 2025–2050
**Serien:** ⏳ (Benzin, Erdgas, Strom, Fernwärme, Biomasse, Wasserstoff × Preisbestandteile)  
**Beobachtungen:** 1.811
**Chart:** Linie/Balken

> Strom, Gas, Sprit: So teuer wird Energie in Deutschland bis 2045.

Prognos-Modell. CO₂-Preis als Haupttreiber für Verteuerung Fossiler. Wasserstoff ab 2030er günstiger erwartet.

**Crossreferenzen:** `DF_CROSS_PROJECTION_REPORT_BASIC`, `DF_TRANSPORT_ENERGY_FUEL_PRICES`, `DF_ENV_ECON_REVENUE_ENV_TAXES`

---

## Schadstoffregister (PRTR)

### Schadstofffreisetzungen der Industrie (`DF_PRTR`)
**Status:** 📝 draft  
**Zeitraum:** 2007–2022
**Serien:** ⏳ (~90 Schadstoffe × Anlagen × Sektoren)  
**Beobachtungen:** 14.137
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Sehr hohe Serienzahl erwartet. Filter zwingend. Nur Anlagen über Kapazitätsschwelle — kleine Betriebe fehlen.

> Deutschlands Fabriken melden seit 2007, wie viel Gift sie freisetzen.

EU-PRTR-Verordnung 2006. Selbstmeldungen, behördlich geprüft, nicht flächendeckend messtechnisch verifiziert. SO₂, NOₓ deutlich gesunken.

**Crossreferenzen:** `DF_PRTR_WASTE_WATER`, `DF_AIR_EMISSIONS_TRENDS`, `DF_ENV_ECON_PROTECTION_EXPENDITURE`

---

### Schadstoffeinleitungen in Gewässer (`DF_PRTR_WASTE_WATER`)
**Status:** 📝 draft  
**Zeitraum:** 2007–2022
**Serien:** ⏳ (Schadstoffe × Anlagen)  
**Beobachtungen:** 13.950
**Chart:** Linie/Balken  
**⚠️ Hinweis:** Nur Anlagen über Meldeschwelle. Landwirtschaft und diffuse Quellen fehlen.

> Deutschlands Fabriken leiten seit 2007 weniger Schadstoffe in Gewässer ein.

Schwermetalle stärker gesunken als Nährstoffe (N, P). EU-WRRL-Bewertungsgrundlage.

**Crossreferenzen:** `DF_PRTR`, `DF_WATER_GROUNDWATER`, `DF_AGRICULTURE_FORESTRY_NITROGEN_SURPLUS`

---

## Ausgeblendet

### Umweltbewusstseinsstudie (`DF_ENV_AWARENESS_STUDIES`) ⚠️ excludeFromCatalog
**Status:** 📝 draft  
**Zeitraum:** 2024 (ein einziger Zeitpunkt)  
**Serien:** ~47.858 (Frage × Antwortoption × Soziodemografie)  
**Beobachtungen:** Nur Zeitpunkt 2024  
**Ausgeblendet weil:** Umfragedaten (Prozentzustimmung), strukturell ungeeignet für Zeitreihen-Explorer. 47.858 Serien bei nur 1 Zeitpunkt.

> Die Deutschen verknüpfen Umweltschutz zunehmend mit ihrer eigenen Gesundheit.

Seit 1996 alle zwei Jahre. BMWK + UBA. Repräsentative Stichprobe. Selbstauskünfte weichen von realem Verhalten ab.

---

## Thematische Cluster & Crossreferenzen

### Cluster A — Klimaindikator-Kern
Direkte Klimamessung und -bilanzierung. Gegenseitig validierend.

```
DF_CLIMATE_GERMANY_TEMPERATURE_MEAN
DF_CLIMATE_GERMANY_TEMPERATURE_SEASONAL
DF_CLIMATE_GERMANY_HOT_DAYS
DF_CLIMATE_GERMANY_PRECIPATION
DF_CLIMATE_GLOBAL_TEMPERATURE
DF_CLIMATE_ATMO_GHG_CONCENTRATION   ← atmosphärischer Gegencheck
```

### Cluster B — THG-Emissionen & Projektionen
Historische Messungen + Zukunftsszenarien. Bilden gemeinsam die Frage "Hält Deutschland seine Klimaversprechen?"

```
DF_CLIMATE_EMISSIONS_GHG_TRENDS               ← Ist-Werte, UNFCCC
DF_CLIMATE_EMISSIONS_GHG_TRENDS_KSG           ← Ist-Werte, KSG-Sektoren
DF_CLIMATE_EMISSIONS_F_GASES                  ← Spezialfall fluorierte Gase
DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_23/25/26  ← Soll
DF_CROSS_PROJECTION_REPORT_BASIC/BASIC_26     ← Annahmen
DF_CROSS_PROJECTION_REPORT_FINAL_CONSUMER_PRICES     ← Energiepreispfade
```

### Cluster C — Energiewende
Ausbau, Erzeugung, Verbrauch — Strom, Wärme, Verkehr getrennt.

```
DF_ENERGY_AGEE_CAPACITY        ← installierte Leistung
DF_ENERGY_AGEE_ELECTRICITY     ← tatsächliche Erzeugung Strom
DF_ENERGY_AGEE_HEAT            ← Wärme (Biomasse dominiert)
DF_ENERGY_AGEE_HEAT_PUMP_STAT  ← Wärmepumpen-Bestand
DF_ENERGY_AGEE_TRANSPORT       ← EE im Verkehr
DF_ENERGY_AGEE_ECONOMY         ← Investitionen
DF_ENERGY_AGEE_SHARE           ← Gesamtanteil
DF_ENV_ECON_ENERGY_CONSUMPTION ← Verbrauch nach Sektor
DF_ENV_ECON_ENERGY_USAGE       ← Industrie nach Branche
```

### Cluster D — Verkehrswende
Vollständiger Verkehrssektor: Flotte, Fahrleistung, Modal Split, Infrastruktur.

```
DF_TRANSPORT_VEHICLE_STOCK_TREND_FUEL       ← E-Auto-Bestand (reviewed)
DF_TRANSPORT_VEHICLE_STOCK_TREND            ← Gesamtflotte nach Antrieb
DF_TRANSPORT_VEHICLE_STOCK_SEGMENT          ← SUV vs. Kleinwagen
DF_TRANSPORT_ENERGY_FINAL                   ← Kraftstoffmix
DF_TRANSPORT_ENERGY_FUEL_CONSUMPTION        ← absoluter Verbrauch
DF_TRANSPORT_TOTAL_PERFORMANCE_VEHICLE_TYPE ← Gesamtfahrleistung
DF_TRANSPORT_PASSENGER_PERFORMANCE_MEAN     ← Personenverkehr absolut
DF_TRANSPORT_PASSENGER_PERFORMANCE_SHARE    ← Modal Split Personen
DF_TRANSPORT_FREIGHT_PERFORMANCE_MEANS      ← Güterverkehr absolut
DF_TRANSPORT_FREIGHT_PERFORMANCE_SHARE      ← Modal Split Güter
DF_TRANSPORT_PUBLIC_PASSENGERS_BUS_TRAIN    ← ÖPNV-Fahrgäste
DF_TRANSPORT_ROUTES                         ← Infrastrukturlänge
DF_ENERGY_AGEE_TRANSPORT                    ← EE im Verkehr
```

### Cluster E — Wasserkreislauf
Von Niederschlag über Grundwasser bis Versorgung.

```
DF_CLIMATE_GERMANY_PRECIPATION  ← Niederschlag
DF_DAS_WASSER_WW_I_1            ← terrestrische Speicherung (GRACE)
DF_DAS_WASSER_WW_I_3            ← Abfluss Flüsse
DF_DAS_WASSER_WW_I_4            ← Hochwasser
DF_DAS_WASSER_WW_I_6            ← Niedrigwasser
DF_DAS_WASSER_WW_I_7            ← Seen-Pegelstände
DF_DAS_WASSER_WW_I_10           ← Wassertemperatur
DF_WATER_GROUNDWATER            ← Grundwasserqualität
DF_WATER_PUB_EXTRAC             ← Entnahme öff. Versorgung
DF_WATER_PUB_SUPPLY             ← Versorgungsarten
DF_DAS_WASSER_WW_R_1            ← Wassernutzungsindex
```

### Cluster F — Abfall & Kreislaufwirtschaft
Vom Verbrauch über Verpackung bis Verwertungsquote.

```
DF_CONSUMPTION_SPENDING_USE      ← wohin fließt das Geld
DF_WASTE_VOLUMENS_PACKAGING      ← Verpackung in Verkehr
DF_WASTE_VOL_PACKAGING_DISPOSAL  ← Verpackung zur Entsorgung
DF_WASTE_HOUSEHOLDS_TYPE         ← Haushaltsabfall
DF_WASTE_VOLUME                  ← Gesamtabfall
DF_WASTE_RECOVERY_RATE           ← Recyclingquote
DF_WASTE_RE_T_RAW_MATERIAL_PROD  ← Rohstoffproduktivität
DF_ENV_ECON_MATERIAL_ACCOUNT     ← Materialflüsse gesamt
```

### Cluster G — Wald & Landwirtschaft
Stickstoff, Wald, Feuer — eng mit Klimawandel verzahnt.

```
DF_AGRICULTURE_FORESTRY_NITROGEN_SURPLUS ← Stickstoffüberschuss
DF_AGRICULTURE_FORESTRY_DAMAGED_WOOD     ← Schadholz
DF_AGRICULTURE_FORESTRY_TIMBER_HARVEST   ← Holzeinschlag gesamt
DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA ← Waldbrand
```

---

## API-Verifizierung — Prioritätsliste für `scripts/fetch-metadata.ts`

Datensätze mit bekannten strukturellen Risiken — bei API-Verifizierung besonders prüfen:

| Datensatz | Risiko |
|-----------|--------|
| `DF_CLIMATE_ATMO_GHG_CONCENTRATION` | Zeitreihe vermutlich sehr kurz (nur 2023) |
| `DF_DAS_WASSER_WW_I_7` | Zeitreihe erst ab 2014 |
| `DF_DAS_WASSER_WW_I_9` | Begrenzte Seenzahl, kurze Reihe |
| `DF_DAS_WASSER_WW_I_10` | Äschenregion-Reihe zu kurz |
| `DF_WATER_PUB_EXTRAC` | Nur Dreijahresrhythmus |
| `DF_WATER_PUB_SUPPLY` | Nur Dreijahresrhythmus |
| `DF_CONSUMPTION_EQUIPMENT_LEVEL` | Nur alle 5 Jahre (EVS) |
| `DF_CONSUMPTION_EQUIPMENT_LEVEL_TOTAL` | Nur alle 5 Jahre (EVS) |
| `DF_CONSUMPTION_GLOBAL_ENV_FOOTPRINT` | Mehrjährige Verzögerung |
| `DF_WASTE_RECOVERY_RATE` | Zweijährlich |
| `DF_WASTE_VOL_PACKAGING_DISPOSAL` | Methodenbrüche in Zeitreihe |
| `DF_DAS_WASSER_WW_R_3` | Nur Hessen, sehr begrenzt |
| `DF_WATER_GROUNDWATER` | Hohe Serienzahl erwartet |
| `DF_PRTR` | Sehr hohe Serienzahl (~90 Schadstoffe × Anlagen) |
| `DF_AIR_EMISSIONS_TRENDS` | Hohe Serienzahl (viele Schadstoffe) |
| `DF_ENV_AWARENESS_STUDIES` | Nur 1 Zeitpunkt, 47.858 Serien — bereits ausgeblendet |
| `DF_CROSS_PROJECTION_*` | Zukunftsszenarien, keine historischen Zeitreihen |
| `DF_TRANSPORT_PASSENGER_PERFORMANCE_SHARE` | Methodenbrüche 2003, 2014, 2017 |

---

*Zuletzt aktualisiert: 2026-05-13 — API-Metriken ausstehend (Platzhalter `⏳`)*
