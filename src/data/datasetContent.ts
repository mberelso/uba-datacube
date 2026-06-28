/**
 * Redaktionell gepflegte Inhalte für Datensätze.
 *
 * Workflow:
 *   1.  erzeugt KI-Entwürfe und fügt sie hier ein (Status: "draft")
 *   2. Redakteur prüft, korrigiert, setzt Status auf "reviewed"
 *   3. Nur "reviewed"-Einträge werden im UI prominent angezeigt; "draft" erscheint als Hinweis-Banner
 *
 * Felder:
 *   headline       – Eine prägnante Aussage (kein Titel, sondern eine Behauptung / ein Befund)
 *   lead           – 2–3 Sätze: Was misst dieser Datensatz, und warum ist er relevant?
 *   trend          – Was zeigt die aktuelle Entwicklung? (konkret, mit Zeitraum wenn möglich)
 *   context        – Politischer, wissenschaftlicher oder gesellschaftlicher Rahmen
 *   methodology    – Was genau wird gemessen? Welche Einschränkungen gibt es?
 *   status         – "draft" | "reviewed"
 */

export interface StackedSeriesSpec {
  /** German label (after labelOverrides applied) */
  label: string
  color: string
}

export interface DefaultChartConfig {
  /**
   * 'stacked' = gestapelte Fläche mit fixen stackedSeries.
   * 'line'    = normale Linien-/Balken-Ansicht, aber mit kuratierter
   *             Default-Auswahl über defaultFilters (umgeht ungeeignete
   *             Kategorie-Defaults wie die Klima-Flächendarstellung).
   */
  type: 'stacked' | 'line'
  /** Pre-apply these dimension filters on load (key = dim ID from API, value = display name) */
  defaultFilters?: Record<string, string>
  /** Ordered series with fixed colors — required for 'stacked', ignored for 'line' */
  stackedSeries?: StackedSeriesSpec[]
}

export interface LazyDimension {
  id: string
  name: string
  /** 0-based position in the full SDMX key (out of totalDimensions) */
  position: number
  values: { id: string; name: string }[]
  /** Default value (code ID) pre-selected in the filter dropdown */
  defaultValue?: string
}

export interface LazyDimensionConfig {
  /** Total number of dimensions in the SDMX key for this dataset */
  totalDimensions: number
  /** Only the curated, filterable dimensions — others default to empty (=all) */
  dimensions: LazyDimension[]
  /**
   * Einwertige Dimensionen, die im SDMX-Key immer mit einem festen Code belegt
   * werden müssen (Position → Code-ID). Nötig, weil die UBA-API bei manchen
   * Datensätzen (z. B. PRTR) für gefilterte Abfragen leere Ergebnisse liefert,
   * wenn einwertige Dimensionen wie Frequenz/Einheit als Wildcard offen bleiben.
   */
  fixedSlots?: Record<number, string>
}

export interface PresetConfig {
  title: string
  icon?: string
  description: string
  filters: Record<string, string>
  lazyFilters?: Record<string, string>
}

export interface DatasetContent {
  headline: string
  lead: string
  trend: string
  context: string
  methodology: string
  status: 'draft' | 'reviewed'
  /** Short German display name, overrides the technical API name in the catalog */
  displayName?: string
  /** Maps API dimension value strings to German display labels */
  labelOverrides?: Record<string, string>
  /** Override default chart type and series selection */
  defaultChartConfig?: DefaultChartConfig
  /** Exclude this dataset from the catalog and dashboard counts (e.g. survey-only data not suited for time-series explorer) */
  excludeFromCatalog?: boolean
  /** Curated filter dimensions for lazy-load mode (used when DSD is unavailable from API) */
  lazyDimensions?: LazyDimensionConfig
  /**
   * Geordnete Liste von Dimensions-IDs (z. B. ['D_SUBSTANCES','D_COMPANY_NAME_PRTR',
   * 'D_RELEASE']), deren Werte — sofern vorhanden — das Serien-Label bilden,
   * statt aller variierenden Dimensionen. Für anlagenscharfe Datensätze, wo
   * Schadstoff + Firma + Freisetzungsart das aussagekräftige Label sind.
   */
  labelDimensionIds?: string[]
  /** Quick-access presets shown above the explorer */
  presets?: PresetConfig[]
}

export const DATASET_CONTENT: Record<string, DatasetContent> = {

DF_CLIMATE_GERMANY_TEMPERATURE_MEAN: {
    headline: 'Deutschland wird wärmer – und der Trend beschleunigt sich.',
    lead: 'Die mittlere Lufttemperatur in 2 Metern Höhe ist der wichtigste Einzelindikator für den Klimawandel in Deutschland. Der Deutsche Wetterdienst erhebt diese Werte seit über 140 Jahren flächendeckend – die längste konsistente Messreihe, die wir haben.',
    trend: 'Im Vergleich zum vorindustriellen Referenzzeitraum (1881–1910) ist Deutschland bereits um rund 1,7 °C wärmer geworden. Die wärmsten zehn Jahre seit Messbeginn liegen alle nach 2000.',
    context: 'Das 1,5-°C-Ziel des Pariser Abkommens bezieht sich auf die globale Mitteltemperatur – Deutschland erwärmt sich als Binnenland schneller als der globale Durchschnitt. Die Bundesregierung nutzt diese Daten als Grundlage für den Klimaanpassungsplan.',
    methodology: 'Gemessen wird der tägliche Mittelwert aus stündlichen Beobachtungen an ca. 2.000 Wetterstationen. Der hier dargestellte Deutschlandwert ist ein flächengewichteter Gebietsmittelwert. Einzelne Bundesländer können stark abweichen – Bayern und Baden-Württemberg liegen strukturell höher, Küstenregionen tiefer.',
    status: 'reviewed',
  },

  DF_CLIMATE_EMISSIONS_GHG_TRENDS: {
    displayName: 'Treibhausgasemissionen nach Sektor',
    headline: 'Die Emissionen sinken – aber nicht schnell genug für das Klimaziel.',
    lead: 'Deutschland erfasst jährlich alle Treibhausgase (CO₂, Methan, Lachgas und F-Gase) in CO₂-Äquivalenten. Diese Gesamtemissionsbilanz ist das zentrale Steuerungsinstrument der Klimapolitik – an ihr wird gemessen, ob Deutschland seinen Beitrag zum Pariser Abkommen erfüllt.',
    trend: 'Seit 1990 sind die Emissionen um rund 40 % gesunken, vor allem durch den Rückgang der Kohleverstromung und effizientere Industrie. Der größte Rückgang in den letzten Jahren kam durch höhere Energiepreise und den Ausbau erneuerbarer Energien – nicht durch strukturelle Veränderungen in Verkehr oder Landwirtschaft.',
    context: 'Das Klimaschutzgesetz schreibt für 2030 eine Reduktion um 65 % gegenüber 1990 vor. Der aktuelle Trend reicht dafür nicht aus. Besonders Verkehr und Gebäude verfehlen ihre Sektorziele regelmäßig.',
    methodology: 'Die Bilanz folgt der UNFCCC-Methodik und schließt alle Kyoto-Protokoll-Gase ein. Landnutzungsänderungen (LULUCF) sind in diesem Datensatz nicht enthalten. Die Zahlen werden jährlich rückwirkend korrigiert, wenn neue Aktivitätsdaten vorliegen.',
    status: 'reviewed',
    lazyDimensions: {
      totalDimensions: 5,
      dimensions: [
        {
          id: 'D_SOURCE_CATEGORIES',
          name: 'Quellgruppe',
          position: 2,
          values: [
            { id: 'TOTAL', name: 'Gesamtemissionen' },
            { id: 'TOTAL_WITHOUT_LULUCF', name: 'Gesamt (ohne LULUCF)' },
            { id: '1_ENERGY', name: '1 — Energie' },
            { id: '1A', name: '1 A — Einsatz von Brennstoffen' },
            { id: '1A1', name: '1 A 1 — Energiewirtschaft' },
            { id: '1A2', name: '1 A 2 — Verarbeitendes Gewerbe & Bauwirtschaft' },
            { id: '1A3', name: '1 A 3 — Verkehr' },
            { id: '1A3b', name: '1 A 3 b — Straßenverkehr' },
            { id: '1A4', name: '1 A 4 — Haushalte, GHD, Landwirtschaft' },
            { id: '1B', name: '1 B — Diffuse Emissionen aus Brennstoffen' },
            { id: '2_INDUSTRY', name: '2 — Industrie' },
            { id: '2A', name: '2 A — Mineralische Industrie' },
            { id: '2B', name: '2 B — Chemische Industrie' },
            { id: '2C', name: '2 C — Herstellung von Metall' },
            { id: '2D', name: '2 D — Nicht-energetische Produkte' },
            { id: '2F', name: '2 F — ODS-Ersatzstoffe (F-Gase)' },
            { id: '3_AGRICULTURE', name: '3 — Landwirtschaft' },
            { id: '3A', name: '3 A — Fermentation (Tierhaltung)' },
            { id: '3B', name: '3 B — Wirtschaftsdüngermanagement' },
            { id: '3D', name: '3 D — Landwirtschaftliche Böden' },
            { id: '4_LULUCF', name: '4 — LULUCF (Landnutzung)' },
            { id: '4A', name: '4 A — Wälder' },
            { id: '5_WASTE', name: '5 — Abfall' },
            { id: '5A', name: '5 A — Abfalldeponierung' },
            { id: '5B', name: '5 B — Biologische Behandlung' },
            { id: '5D', name: '5 D — Abwasserbehandlung' },
            { id: 'MEMO', name: 'Nachrichtliche Emissionen' },
          ],
        },
        {
          id: 'D_SUBSTANCES',
          name: 'Substanz',
          position: 3,
          values: [
            { id: 'GHG', name: 'Treibhausgase (gesamt)' },
            { id: 'CO2', name: 'Kohlendioxid (CO₂)' },
            { id: 'CH4', name: 'Methan (CH₄)' },
            { id: 'N2O', name: 'Distickoxid (N₂O)' },
            { id: 'HFC', name: 'HFC (teilfluoriert)' },
            { id: 'PFC', name: 'PFC (perfluoriert)' },
            { id: 'SF6', name: 'SF₆' },
            { id: 'NF3', name: 'NF₃' },
            { id: 'FGAS_IPCC', name: 'Fluorierte Gase (IPCC)' },
          ],
        },
        {
          id: 'D_UNIT',
          name: 'Einheit',
          position: 4,
          values: [
            { id: 'MT_CO2_EQ', name: 'Mio. t CO₂-Äquivalent' },
            { id: 'KT_CO2_EQ', name: 'kt CO₂-Äquivalent' },
            { id: 'MT', name: 'Millionen Tonnen' },
            { id: 'KT', name: 'Kilotonne' },
            { id: 'T', name: 'Tonne' },
            { id: 'T_CO2_EQ', name: 't CO₂-Äquivalent' },
          ],
        },
      ],
    },
  },

  DF_ENERGY_AGEE_SHARE: {
    displayName: 'Anteil erneuerbarer Energien am Gesamtverbrauch',
    headline: 'Jede dritte Kilowattstunde kommt heute aus erneuerbaren Quellen.',
    lead: 'Der Anteil erneuerbarer Energien am Bruttoendenergieverbrauch zeigt, wie weit Deutschland bei der Energiewende ist – nicht nur im Stromsektor, sondern auch in Wärme und Verkehr zusammen.',
    trend: 'Der Anteil stieg von unter 5 % im Jahr 2000 auf über 20 % im Stromsektor. Im gesamten Energieverbrauch (inkl. Wärme und Verkehr) liegt er deutlich darunter, weil diese Sektoren langsamer dekarbonisieren.',
    context: 'Das EU-Ziel für 2030 liegt bei 42,5 % erneuerbare Energien am Gesamtverbrauch. Deutschland muss besonders in den Bereichen Wärme (Wärmepumpen, Fernwärme) und Verkehr (E-Mobilität, grüner Wasserstoff) deutlich zulegen.',
    methodology: 'Grundlage ist die Definition der EU-Erneuerbaren-Richtlinie (RED). Der Bruttoendenergieverbrauch umfasst Strom, Wärme und Verkehr. Nicht enthalten: Energieerzeugung für den Export.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_AGRICULTURE_FORESTRY_DAMAGED_WOOD: {
    displayName: 'Schadholzeinschlag in deutschen Wäldern',
    headline: 'Deutschlands Wälder fallen in Rekordzahlen – Schäden treiben die Ernte.',
    lead: 'Dieser Datensatz erfasst, wie viel Schadholz in deutschen Wäldern eingeschlagen wird – aufgeschlüsselt nach Schadursache, Baumart und Waldbesitzart. Wer verstehen will, wie es dem deutschen Wald wirklich geht, findet hier einen der härtesten Faktenbelege: nicht Umfragen oder Modelle, sondern tatsächlich gefällte Bäume.',
    trend: 'Seit den Dürrejahren 2018 bis 2020 dominiert Schadholz den deutschen Holzeinschlag – Borkenkäferbefall, Sturmschäden und Trockenheit trieben die Mengen auf historische Höchststände. Fichtenreiche Wälder in Mittel- und Ostdeutschland verloren in kurzer Zeit Millionen Festmeter Holz; der Einschlag aus Schadensereignissen übertraf zeitweise den planmäßigen Einschlag bei Weitem.',
    context: 'Die Bundesregierung und die Länder investieren Milliarden in den Waldumbau hin zu klimaresilienten Mischwäldern – dieser Datensatz zeigt, ob diese Strategie greift oder ob die Schadensdynamik weiter zunimmt. Zugleich beeinflusst das Schadholzaufkommen die CO₂-Bilanz des Waldsektors, der im Klimaschutzgesetz als Kohlenstoffsenke eingeplant ist.',
    methodology: 'Gemessen wird der tatsächlich eingeschlagene Schadholzanteil in Kubikmetern, gemeldet von Forstbetrieben aller Eigentumsarten an das Statistische Bundesamt. Die Statistik erfasst nur geborgenes Holz – im Bestand verbleibendes oder nicht gemeldetes Totholz fließt nicht ein, was das Ausmaß der Waldschäden tendenziell unterschätzt.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA: {
    displayName: 'Waldbrandflächen und -ursachen',
    headline: 'Deutschlands Wälder brennen häufiger – und der Mensch zündet meistens selbst.',
    lead: 'Dieser Datensatz erfasst seit den 1970er-Jahren, wie viele Hektar Wald in Deutschland jedes Jahr abbrennen, wer oder was das Feuer auslöst und wie viel Geld Behörden für Prävention und Bekämpfung ausgeben. Wer verstehen will, wie verwundbar unsere Wälder sind, findet hier die Grundlage.',
    trend: 'Die Brandflächen schwanken stark von Jahr zu Jahr, steigen aber in Trockenjahren wie 2018, 2019 und 2022 sprunghaft an – teils auf ein Vielfaches des langjährigen Mittels. Fahrlässigkeit und Brandstiftung durch Menschen verursachen den größten Teil der Feuer, Blitzschlag spielt eine untergeordnete Rolle.',
    context: 'Die Daten fließen direkt in die Waldbrandschutzpolitik von Bund und Ländern ein und bestimmen, wie Feuerwehren ausgerüstet und Schutzstreifen angelegt werden. Mit dem Klimawandel rechnen Forstwissenschaftler mit längeren Trockenphasen – die Politik muss entscheiden, ob bestehende Schutzmaßnahmen dafür ausreichen.',
    methodology: 'Erfasst werden Brandfläche, Schadenshöhe, Ursachen und Kosten auf Basis von Meldungen der Landesforstbehörden an das Bundesministerium für Ernährung und Landwirtschaft. Da jede Tabellenzelle separat gerundet wird, können sich bei Summen kleine Abweichungen ergeben.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_AGRICULTURE_FORESTRY_NITROGEN_SURPLUS: {
    displayName: 'Stickstoffüberschuss in der Landwirtschaft',
    headline: 'Deutschlands Äcker verlieren jedes Jahr Tausende Tonnen Stickstoff unkontrolliert.',
    lead: 'Dieser Datensatz misst, wie viel Stickstoff die deutsche Landwirtschaft jährlich mehr ausbringt, als Pflanzen aufnehmen – der Überschuss versickert ins Grundwasser, strömt in Flüsse oder entweicht als Treibhausgas in die Luft. Wer Trinkwasser trinkt, Flüsse schützen will oder wissen möchte, wie Bauernhöfe die Umwelt belasten, findet hier die Grundlage.',
    trend: 'Seit 1990 ist der Stickstoffüberschuss in der deutschen Landwirtschaft gesunken, stagniert aber seit Jahren auf einem Niveau weit über den politischen Zielwerten. Deutschland verfehlt die EU-Vorgabe von 70 Kilogramm Stickstoff je Hektar landwirtschaftlicher Fläche bis 2030 nach aktuellem Stand deutlich.',
    context: 'Die EU-Nitratrichtlinie und die nationale Düngeverordnung verpflichten Deutschland, den Stickstoffeintrag in Gewässer zu begrenzen – die Europäische Kommission hat Deutschland deshalb bereits mehrfach verklagt und Strafzahlungen erwirkt. Agrarpolitiker, Wasserversorger und Naturschutzbehörden nutzen diese Daten, um Düngeregeln zu verschärfen oder Förderprogramme für stickstoffärmere Anbaumethoden zu begründen.',
    methodology: 'Der Überschuss errechnet sich aus der Differenz zwischen dem gesamten Stickstoff, den die Landwirtschaft einbringt – durch Dünger, Futtermittelimporte und Tierhaltung –, und dem Stickstoff, der über verkaufte Ernte- und Tierprodukte den Sektor wieder verlässt. Methodische Änderungen schränken die Vergleichbarkeit mit älteren Publikationsreihen ein, die relativen Standardfehler einzelner Bilanzgrößen sind in einer gesonderten Qualitätstabelle ausgewiesen.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_AGRICULTURE_FORESTRY_TIMBER_HARVEST: {
    displayName: 'Holzeinschlag in deutschen Wäldern',
    headline: 'Deutschlands Wälder liefern weniger Holz – Dürre und Borkenkäfer zeigen Wirkung.',
    lead: 'Dieser Datensatz erfasst, wie viel Holz jährlich in deutschen Wäldern eingeschlagen wird – aufgeschlüsselt nach Holzart, Baumart und Eigentumsform. Wer verstehen will, ob deutsche Wälder noch als Rohstoffquelle und Klimaschützer funktionieren, findet hier die Grundlage.',
    trend: 'Nach Rekordjahren durch Zwangseinschläge infolge von Dürre, Sturm und Borkenkäferbefall ab 2018 sinken die Einschlagsmengen wieder – nicht weil die Wälder sich erholen, sondern weil schlicht weniger gesundes Holz verfügbar ist. Der Schadholzanteil dominierte zeitweise über 70 Prozent der gesamten Ernte und verschob den Markt massiv.',
    context: 'Die Bundesregierung setzt im Rahmen der Nationalen Waldstrategie 2050 auf Wälder als CO₂-Speicher und nachwachsenden Rohstoff zugleich – zwei Ziele, die sich bei übermäßigem Einschlag widersprechen. Fördergelder für den Waldumbau hin zu klimaresistenteren Mischwäldern hängen direkt davon ab, wie stark der Bestand geschädigt ist.',
    methodology: 'Gemessen wird die tatsächlich geerntete Holzmenge in Festmetern ohne Rinde, erfasst über die amtliche Holzeinschlagsstatistik des Statistischen Bundesamts. Kleinprivatwälder unter einer bestimmten Betriebsgröße sind teils untererfasst, was die realen Einschlagsmengen leicht unterschätzen kann.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_AIR_EMISSIONS_INDEX: {
    displayName: 'Luftschadstoff-Emissionsindex',
    headline: 'Ammoniak blockiert Deutschlands Luftreinhaltung – ein Schadstoff hält den Index hoch.',
    lead: 'Dieser Datensatz zeigt, wie sich die Emissionen von Schadstoffen in der deutschen Luft seit 2005 verändert haben – von Stickoxiden über Feinstaub bis hin zu Schwefeldioxid. Wer wissen will, ob die Luft tatsächlich sauberer wird, findet hier die Antwort in Zahlen.',
    trend: 'Seit 2005 sind die Luftschadstoffemissionen in Deutschland insgesamt gesunken – der Index zeigt einen rückläufigen Trend über nahezu alle gemessenen Substanzen. Einzelne Schadstoffe wie Ammoniak aus der Landwirtschaft hartnäckig auf erhöhtem Niveau verharren jedoch weiterhin. Der Rückgang verläuft je nach Sektor sehr ungleichmäßig.',
    context: 'Die EU-Richtlinie über nationale Emissionshöchstmengen (NEC-Richtlinie) verpflichtet Deutschland zu konkreten Reduktionszielen bis 2030 – bei Ammoniak, Stickoxiden, Feinstaub und weiteren Stoffen. Ob Deutschland diese Ziele erreicht, hängt direkt von den hier dokumentierten Trends ab. Verkehrs-, Agrar- und Industriepolitik greifen auf genau diese Daten zurück, um Maßnahmen zu begründen oder zu überprüfen.',
    methodology: 'Gemessen wird nicht die Konzentration in der Außenluft, sondern die Menge der ausgestoßenen Schadstoffe – erfasst von Industrie, Verkehr, Landwirtschaft und Haushalten. Der Index setzt alle Werte relativ zum Basisjahr 2005, was Vergleiche erleichtert, absolute Mengen aber verschleiert.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_AIR_EMISSIONS_TRENDS: {
    displayName: 'Luftschadstoff-Emissionstrends seit 1990',
    headline: 'Schwefeldioxid fast verschwunden, Ammoniak kaum gesunken – Deutschlands Luftbilanz seit 1990.',
    lead: 'Dieser Datensatz erfasst, wie viel Schmutz Deutschland jedes Jahr in die Luft bläst – von Stickoxiden aus Auspuffrohren bis zu giftigen Schwermetallen aus Industriekaminen. Wer wissen will, ob die Luft wirklich sauberer wird oder ob das nur auf dem Papier steht, findet hier die Antwort.',
    trend: 'Seit 1990 sind die Gesamtemissionen der meisten Schadstoffe deutlich gesunken – bei Schwefeldioxid etwa um über 90 Prozent. Doch bei bestimmten Stoffen wie Ammoniak aus der Landwirtschaft oder Feinstaub aus Holzheizungen stagniert der Rückgang oder kehrt sich teilweise um.',
    context: 'Die EU-Richtlinie über nationale Emissionshöchstmengen (NEC-Richtlinie) schreibt Deutschland verbindliche Reduktionsziele bis 2030 vor – bei Ammoniak etwa minus 29 Prozent gegenüber 2005. Diese Daten entscheiden, ob Deutschland Vertragsverletzungsverfahren riskiert oder Förderprogramme neu ausrichten muss.',
    methodology: 'Gemessen werden die jährlichen Gesamtemissionen nach Schadstoffart und Quellengruppe – aufgeschlüsselt nach dem Nomenklatursystem der Genfer Luftreinhaltekonvention, das internationale Vergleiche ermöglicht. Emissionen werden größtenteils berechnet, nicht direkt gemessen, weshalb Schätzunsicherheiten vor allem bei diffusen Quellen wie Landwirtschaft oder Kleinfeuerungsanlagen bestehen.',
    status: 'draft',
    lazyDimensions: {
      totalDimensions: 5,
      dimensions: [
        {
          id: 'D_SOURCE_CATEGORIES',
          name: 'Quellgruppe',
          position: 2,
          values: [
            { id: 'TOTAL', name: 'Gesamtemissionen' },
            { id: '1_ENERGY', name: '1 — Energie' },
            { id: '1A', name: '1 A — Einsatz von Brennstoffen' },
            { id: '1A1', name: '1 A 1 — Energiewirtschaft' },
            { id: '1A2', name: '1 A 2 — Verarbeitendes Gewerbe & Bauwirtschaft' },
            { id: '1A3', name: '1 A 3 — Verkehr' },
            { id: '1A3b', name: '1 A 3 b — Straßenverkehr' },
            { id: '1A4', name: '1 A 4 — Haushalte, GHD, Landwirtschaft' },
            { id: '1A4b', name: '1 A 4 b — Haushalte' },
            { id: '1B', name: '1 B — Diffuse Emissionen aus Brennstoffen' },
            { id: '2_INDUSTRY', name: '2 — Industrie' },
            { id: '2A', name: '2 A — Mineralische Industrie' },
            { id: '2B', name: '2 B — Chemische Industrie' },
            { id: '2C', name: '2 C — Herstellung von Metall' },
            { id: '2D', name: '2 D — Nicht-energetische Produkte' },
            { id: '2H', name: '2 H — Weitere Industrien' },
            { id: '3_AGRICULTURE', name: '3 — Landwirtschaft' },
            { id: '3B', name: '3 B — Wirtschaftsdüngermanagement' },
            { id: '3D', name: '3 D — Landwirtschaftliche Böden' },
            { id: '5_WASTE', name: '5 — Abfall' },
            { id: '5A', name: '5 A — Abfalldeponierung' },
            { id: '5C', name: '5 C — Verbrennung von Abfällen' },
            { id: '5D', name: '5 D — Abwasserbehandlung' },
            { id: 'MEMO', name: 'Nachrichtliche Emissionen' },
          ],
        },
        {
          id: 'D_SUBSTANCES',
          name: 'Schadstoff',
          position: 3,
          values: [
            { id: 'LUFT', name: 'Luftschadstoffe (gesamt)' },
            { id: 'NOx_NO2', name: 'Stickoxide (NOₓ)' },
            { id: 'SO2', name: 'Schwefeldioxid (SO₂)' },
            { id: 'NH3', name: 'Ammoniak (NH₃)' },
            { id: 'NMVOC', name: 'Flüchtige org. Verbindungen (NMVOC)' },
            { id: 'CO', name: 'Kohlenmonoxid (CO)' },
            { id: 'PM25', name: 'Feinstaub PM2,5' },
            { id: 'PM10', name: 'Feinstaub PM10' },
            { id: 'TSP', name: 'Gesamtstaub (TSP)' },
            { id: 'BC', name: 'Black Carbon (Ruß)' },
            { id: 'HM', name: 'Schwermetalle (gesamt)' },
            { id: 'Pb', name: 'Blei (Pb)' },
            { id: 'Cd', name: 'Cadmium (Cd)' },
            { id: 'Hg', name: 'Quecksilber (Hg)' },
            { id: 'As', name: 'Arsen (As)' },
            { id: 'Cr', name: 'Chrom (Cr)' },
            { id: 'Ni', name: 'Nickel (Ni)' },
            { id: 'Zn', name: 'Zink (Zn)' },
            { id: 'Cu', name: 'Kupfer (Cu)' },
            { id: 'POP', name: 'Persistente org. Schadstoffe (POP)' },
            { id: 'BaP', name: 'Benzo(a)pyren' },
            { id: 'PCDD_F', name: 'Dioxine (PCDD/F)' },
            { id: 'PCB', name: 'Polychlorierte Biphenyle (PCB)' },
            { id: 'HCB', name: 'Hexachlorbenzol (HCB)' },
          ],
        },
        {
          id: 'D_UNIT',
          name: 'Einheit',
          position: 4,
          values: [
            { id: 'KT', name: 'Kilotonne' },
            { id: 'T', name: 'Tonne' },
            { id: 'KG', name: 'Kilogramm' },
            { id: 'G', name: 'Gramm' },
          ],
        },
      ],
    },
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_AREA_SOIL_LAND_ECOSYSTEMS_AREA: {
    displayName: 'Siedlungs- und Verkehrsfläche nach Bundesland',
    headline: 'Siedlungsflächen wachsen – Deutschlands Böden versiegeln weiter.',
    lead: 'Dieser Datensatz erfasst, wie Deutschland seine Landfläche tatsächlich nutzt: wie viel Raum auf Äcker, Wälder, Straßen oder Siedlungen entfällt – und wie sich das Jahr für Jahr verschiebt. Wer wissen will, ob Deutschland seinen Boden schützt oder weiter zubaut, findet hier die Grundlage.',
    trend: 'Seit Jahren schrumpft die Landwirtschafts- und Naturfläche zugunsten von Siedlungs- und Verkehrsflächen. Pro Tag werden in Deutschland noch immer rund 50 Hektar neu überbaut – Tendenz langsam sinkend, aber weit entfernt von den politischen Zielvorgaben.',
    context: 'Die Bundesregierung hat sich verpflichtet, den Flächenverbrauch bis 2030 auf unter 30 Hektar pro Tag zu senken – ein Ziel aus der Nachhaltigkeitsstrategie, das Deutschland bislang verfehlt. Gleichzeitig hängen Hochwasserschutz, Artenvielfalt und Ernährungssicherheit direkt davon ab, wie viel unversiegelte Fläche das Land erhält.',
    methodology: 'Das Statistische Bundesamt erhebt die Daten nach tatsächlicher Nutzungsart auf Stichtag – erfasst wird also, wofür Flächen wirklich genutzt werden, nicht wofür sie geplant sind. Methodische Änderungen und unterschiedliche Erfassungsstandards der Bundesländer können die Vergleichbarkeit über Zeit und zwischen Ländern einschränken.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CLIMATE_ATMO_GHG_CONCENTRATION: {
    displayName: 'Treibhausgaskonzentration in der Atmosphäre',
    headline: 'Deutschlands Luft zeigt: CO₂ steigt weiter, ohne Pause.',
    lead: 'Zwei Messstationen in Deutschland – eine im Schwarzwald, eine auf der Zugspitze – zeichnen rund um die Uhr auf, wie viel Kohlendioxid, Methan und Lachgas in der Atmosphäre stecken. Diese drei Gase heizen die Erde auf, und ihre Konzentration entscheidet darüber, ob die Klimaziele noch erreichbar sind – oder längst verfehlt wurden.',
    trend: 'Die Messdaten von April bis Dezember 2023 zeigen an beiden Standorten anhaltend hohe CO₂-Werte, die saisonale Schwankungen aufweisen, aber keinen Rückgang. Methan und Lachgas bewegen sich auf ähnlich erhöhtem Niveau. Eine Trendwende – also ein messbarer Rückgang der atmosphärischen Konzentration – ist in den Daten nicht erkennbar.',
    context: 'Die EU hat sich mit dem European Green Deal verpflichtet, die Nettoemissionen bis 2050 auf null zu senken; Zwischenziel sind minus 55 Prozent bis 2030 gegenüber 1990. Atmosphärische Konzentrationsdaten liefern den unabhängigen Gegencheck zu nationalen Emissionsbilanzen – sie zeigen, was tatsächlich in der Luft landet, unabhängig davon, was Staaten in ihren Berichten ausweisen. Klimapolitische Entscheidungen, von der CO₂-Bepreisung bis zum Kohleausstieg, müssen sich an diesen Messwerten messen lassen.',
    methodology: 'Gemessen werden stündliche Mittelwerte der Gaskonzentrationen in der Umgebungsluft – auf dem Schauinsland in 35 Metern Höhe, auf der Zugspitze in 3 Metern Höhe über dem Boden. Die Standorte erfassen regionale Hintergrundluft, spiegeln aber nicht direkt lokale Emissionsquellen wider; kurzfristige Extremwerte durch nahegelegene Quellen werden durch die Messanordnung weitgehend herausgefiltert.',
    status: 'draft',
    excludeFromCatalog: true, // stündliche Rohdaten — ISO-Timestamps, nicht im Jahres-Explorer darstellbar
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CLIMATE_EMISSIONS_F_GASES: {
    displayName: 'F-Gas-Emissionen nach Sektor',
    headline: 'F-Gase heizen das Klima auf – obwohl sie kaum jemand kennt.',
    lead: 'Dieser Datensatz erfasst, wie viel Fluorkohlenwasserstoffe und verwandte Gase Deutschland jedes Jahr in die Atmosphäre entlässt – aufgeteilt nach Quellen wie Kälteanlagen, Klimaanlagen oder der Halbleiterindustrie. Diese Gase sind zwar unsichtbar und geruchlos, wirken aber teils tausendmal stärker als CO₂ – wer Klimaschutz ernst nimmt, muss sie im Blick behalten.',
    trend: 'Seit den 1990er Jahren haben sich die Emissionsquellen verschoben: Ältere Substanzen wurden verboten oder ersetzt, doch neuere F-Gas-Generationen füllen die Lücke. Besonders der Boom bei Klimaanlagen und Wärmepumpen treibt den Verbrauch bestimmter Kältemittel nach oben, während andere Sektoren ihre Emissionen reduziert haben.',
    context: 'Die EU-F-Gas-Verordnung schreibt schrittweise Mengenbegrenzungen vor und will bestimmte Substanzen bis 2050 weitgehend aus dem Markt drängen. Deutschland muss diese Emissionen jährlich an die EU und im Rahmen des Pariser Abkommens melden – die Daten des Umweltbundesamts bilden die offizielle Grundlage für politische Entscheidungen über Verbote, Quoten und Förderprogramme.',
    methodology: 'Gemessen wird die jährliche Freisetzung fluorierter Treibhausgase in CO₂-Äquivalenten, berechnet nach den Treibhauspotenzialwerten (GWP100) des fünften IPCC-Sachstandsberichts. Die Zahlen beruhen auf Schätzmodellen und Meldungen der Industrie – direkte Messungen in der Atmosphäre fließen nicht ein, was Unsicherheiten bei einzelnen Quellkategorien erzeugt.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CLIMATE_EMISSIONS_GHG_TRENDS_KSG: {
    displayName: 'THG-Emissionen nach Klimaschutzgesetz-Sektoren',
    headline: 'Deutschland stößt weniger Treibhausgase aus – doch das Tempo reicht nicht.',
    lead: 'Dieser Datensatz erfasst, wie viele klimaschädliche Gase Deutschland jedes Jahr seit 1990 in die Atmosphäre bläst – aufgeteilt nach Wirtschaftsbereichen wie Verkehr, Industrie oder Landwirtschaft. Wer verstehen will, ob Deutschland seine Klimaversprechen einhält oder bricht, findet hier die Grundlage.',
    trend: 'Die deutschen Treibhausgasemissionen sinken seit 1990 kontinuierlich, zuletzt beschleunigt durch den Rückgang in der Energiewirtschaft und schwächere Industrieproduktion. Allerdings verfehlt der Verkehrssektor seine Zielwerte seit Jahren konsequent, während die Landwirtschaft kaum Fortschritte zeigt.',
    context: 'Das Bundes-Klimaschutzgesetz schreibt für jeden Sektor verbindliche Jahresemissionsmengen vor – wer sie überschreitet, muss Maßnahmen nachliefern. Diese Daten entscheiden unmittelbar darüber, welche Ministerien handeln müssen und ob Deutschland sein Ziel der Klimaneutralität bis 2045 noch erreichen kann.',
    methodology: 'Gemessen werden alle vom Menschen verursachten Treibhausgasemissionen in CO₂-Äquivalenten, berechnet nach den aktuellen Klimawirkungsfaktoren des IPCC-Fünften Sachstandsberichts. Die Sektorzuordnung folgt dem Klimaschutzgesetz und spiegelt daher politische Kategorien wider, keine rein physikalischen Grenzen.',
    status: 'draft',
    labelOverrides: {
      'Energiewirtschaft': 'Energie',
      'Industrie': 'Industrie',
      'Gebäude': 'Gebäude',
      'Verkehr': 'Verkehr',
      'Landwirtschaft': 'Landwirtschaft',
      'Abfallwirtschaft & Sonstiges': 'Abfall & Sonstiges',
      'Landnutzung, Landnutzungsänderung und Forstwirtschaft': 'LULUCF (Senken)',
      'Gesamtemissionen': 'Gesamt',
      'Gesamtemissionen (ohne ohne Landnutzung, Landnutzungsänderung und Forstwirtschaft)': 'Gesamt (ohne Senken)',
    },
    defaultChartConfig: {
      type: 'stacked',
      defaultFilters: { 'D_SUBSTANCES': 'Treibhausgase', 'D_UNIT': 'Millionen Tonnen CO2-Äquivalente' },
      stackedSeries: [
        { label: 'Energie',             color: '#ef4444' },
        { label: 'Industrie',           color: '#f97316' },
        { label: 'Gebäude',             color: '#f59e0b' },
        { label: 'Verkehr',             color: '#6b7280' },
        { label: 'Landwirtschaft',      color: '#16a34a' },
        { label: 'Abfall & Sonstiges',  color: '#d1d5db' },
      ],
    },
    lazyDimensions: {
      totalDimensions: 5,
      dimensions: [
        {
          id: 'D_KSG_SECTOR',
          name: 'KSG-Sektor',
          position: 2,
          values: [
            { id: 'TOTAL', name: 'Gesamtemissionen' },
            { id: 'TOTAL_WITHOUT_LULUCF', name: 'Gesamt (ohne LULUCF)' },
            { id: 'ENERGIEWIRTSCHAFT', name: 'Energiewirtschaft' },
            { id: 'INDUSTRIE', name: 'Industrie' },
            { id: 'GEBAEUDE', name: 'Gebäude' },
            { id: 'VERKEHR', name: 'Verkehr' },
            { id: 'LANDWIRTSCHAFT', name: 'Landwirtschaft' },
            { id: 'ABFALLWIRTSCHAFT_SONSTIGES', name: 'Abfallwirtschaft & Sonstiges' },
            { id: 'LULUCF', name: 'LULUCF (Landnutzung)' },
          ],
        },
        {
          id: 'D_SUBSTANCES',
          name: 'Substanz',
          position: 3,
          values: [
            { id: 'GHG', name: 'Treibhausgase (gesamt)' },
            { id: 'CO2', name: 'Kohlendioxid (CO₂)' },
            { id: 'CH4', name: 'Methan (CH₄)' },
            { id: 'N2O', name: 'Distickoxid (N₂O)' },
            { id: 'HFC', name: 'HFC (teilfluoriert)' },
            { id: 'PFC', name: 'PFC (perfluoriert)' },
            { id: 'SF6', name: 'SF₆' },
            { id: 'NF3', name: 'NF₃' },
            { id: 'FGAS_IPCC', name: 'Fluorierte Gase (IPCC)' },
          ],
        },
        {
          id: 'D_UNIT',
          name: 'Einheit',
          position: 4,
          values: [
            { id: 'MT_CO2_EQ', name: 'Mio. t CO₂-Äquivalent' },
            { id: 'KT_CO2_EQ', name: 'kt CO₂-Äquivalent' },
            { id: 'MT', name: 'Millionen Tonnen' },
            { id: 'KT', name: 'Kilotonne' },
            { id: 'T', name: 'Tonne' },
            { id: 'T_CO2_EQ', name: 't CO₂-Äquivalent' },
          ],
        },
      ],
    },
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CLIMATE_GERMANY_HOT_DAYS: {
    displayName: 'Heiße Tage und Tropennächte in Deutschland',
    headline: 'Deutschland erlebt dreimal so viele Hitzetage wie noch vor 60 Jahren.',
    lead: 'Dieser Datensatz zählt, an wie vielen Tagen im Jahr die Temperatur in Deutschland über 30 Grad steigt – gemittelt über die gesamte Fläche des Landes. Wer verstehen will, ob Sommer heißer werden, findet hier eine der klarsten Antworten: eine jahrzehntelange Zahlenreihe, die zeigt, wie sich Extremhitze in unserem Alltag ausbreitet.',
    trend: 'Die Zahl der Hitzetage steigt seit Jahrzehnten deutlich an – besonders seit den 1990er Jahren beschleunigt sich dieser Anstieg. Jahre mit mehr als zehn Hitzetagen, die früher Ausnahmen waren, treten inzwischen regelmäßig auf. Der Deutsche Wetterdienst bestätigt diesen Aufwärtstrend durch lineare Trendberechnungen über den gesamten Aufzeichnungszeitraum.',
    context: 'Hitzetage belasten Herz-Kreislauf-Systeme, treiben Sterblichkeitszahlen nach oben und zwingen Städte zum Handeln – von Grünflächen bis zu Hitzeaktionsplänen. Die Bundesregierung hat im Rahmen der Deutschen Anpassungsstrategie an den Klimawandel Maßnahmen zum Schutz vor Extremhitze verankert, deren Wirksamkeit sich an genau solchen Daten messen lässt. Auch der EU-Klimarahmen verpflichtet Deutschland, Anpassungsmaßnahmen zu dokumentieren und fortzuschreiben.',
    methodology: 'Gemessen wird die Anzahl der Tage pro Jahr, an denen der Temperaturhöchstwert deutschlandweit im Flächenmittel 30 Grad Celsius überschreitet – also kein einzelner Wetterstationsrekord, sondern ein gemittelter Wert über ganz Deutschland. Da lokale Extremwerte dadurch geglättet werden, unterschätzt der Flächenmittelwert die Hitzebelastung in Städten und Ballungsräumen systematisch.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CLIMATE_GERMANY_PHENOLOGY: {
    displayName: 'Phänologische Jahreszeiten in Deutschland',
    headline: 'Deutschlands Frühling beginnt heute Wochen früher als vor 50 Jahren.',
    lead: 'Dieser Datensatz des Deutschen Wetterdienstes erfasst, wann Pflanzen wie der Apfelbaum blühen, die Salweide austreibt oder das Schneeglöckchen erscheint – und wie sich diese Zeitpunkte über Jahrzehnte verschoben haben. Wer wissen will, ob der Klimawandel in Deutschland tatsächlich ankommt, bekommt hier eine der direktesten Antworten: Die Natur selbst zeigt es.',
    trend: 'Frühlingsboten wie das Schneeglöckchen und die Salweide blühen heute im Schnitt zwei bis vier Wochen früher als noch in den 1960er Jahren. Der Blattfall der Stieleiche dagegen setzt sich tendenziell nach hinten, was den Sommer biologisch verlängert. Diese Verschiebungen beschleunigen sich mit jedem weiteren Wärmerekord.',
    context: 'Phänologische Daten fließen in Klimaberichte der Bundesregierung ein und belegen, dass Deutschland die EU-Klimaziele nicht als abstraktes Problem behandeln kann – die Folgen verändern bereits Ökosysteme, Landwirtschaft und Allergiesaisons. Entscheidungen über Aussaatzeiten, Schädlingsbekämpfung und Naturschutzmaßnahmen hängen direkt davon ab, wie verlässlich diese Verschiebungen vorhergesagt werden können.',
    methodology: 'Gemessen wird der kalendarische Eintrittszeitpunkt bestimmter Entwicklungsphasen bei ausgewählten Pflanzenarten an einem deutschlandweiten Netz von Beobachtungsstationen des DWD. Die Y-Achse zeigt den Tag im Jahr (1 = 1. Januar, 100 ≈ 10. April). Standardmäßig sind die deutschlandweiten Gebietsmittel aller fünf Phasen dargestellt; über den Datentyp-Filter lassen sich linearer Trend und gleitendes 30-Jahres-Mittel ergänzen. Lokale Abweichungen durch Höhenlage oder Stadtklima können erheblich sein.',
    status: 'draft',
    defaultChartConfig: {
      type: 'line',
      defaultFilters: { D_TYPE: 'Gebietsmittel von Deutschland' },
    },
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CLIMATE_GERMANY_PRECIPATION: {
    displayName: 'Niederschlag in Deutschland seit 1881',
    headline: 'Deutschland wird nasser — aber das Wasser kommt zur falschen Zeit.',
    lead: 'Dieser Datensatz zeigt, wie viel Regen und Schnee pro Jahr in Deutschland fällt — gemessen seit Beginn systematischer Wetteraufzeichnungen. Wer verstehen will, ob Dürren und Überschwemmungen zunehmen oder ob sich das Klima grundlegend verändert, findet hier die Rohdaten dafür.',
    trend: 'Die Jahresniederschläge in Deutschland schwanken stark von Jahr zu Jahr, zeigen aber über die Jahrzehnte keinen einfachen Aufwärtstrend. Was sich verändert, ist die Verteilung: Starkregen häufen sich, während längere Trockenphasen im Sommer zunehmen — mehr Niederschlag bedeutet also nicht automatisch mehr Wasser dort, wo es gebraucht wird.',
    context: 'Landwirtschaft, Wasserversorger und Stadtplaner richten ihre Investitionen nach Niederschlagsdaten aus — ob Bewässerungsanlagen, Kanalkapazitäten oder Hochwasserschutz. Die Bundesregierung und die EU nutzen solche Zeitreihen, um Klimaanpassungspläne zu begründen und Fördermittel für gefährdete Regionen zu verteilen.',
    methodology: 'Der Deutsche Wetterdienst berechnet aus seinen Messstationen flächendeckende Regionaldurchschnitte für Deutschland und die einzelnen Bundesländer. Ein Jahresmittelwert kann lokale Extremereignisse verschleiern — Aussagen über einzelne Regionen oder Jahreszeiten erfordern tiefere Auswertungen.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CLIMATE_GERMANY_TEMPERATURE_SEASONAL: {
    displayName: 'Saisonale Temperaturen in Deutschland seit 1881',
    headline: 'Deutschlands Sommer sind heute fast zwei Grad wärmer als 1881.',
    lead: 'Dieser Datensatz zeigt, wie sich die Durchschnittstemperaturen in Deutschland über alle vier Jahreszeiten seit dem Beginn systematischer Wetteraufzeichnungen verändert haben. Wer verstehen will, ob der letzte Sommer wirklich ungewöhnlich heiß war oder ob der milde Winter zum Muster gehört, findet hier die Antwort.',
    trend: 'Alle vier Jahreszeiten zeigen seit dem späten 19. Jahrhundert einen deutlichen Erwärmungstrend, wobei der Sommer und der Frühling besonders stark betroffen sind. Die wärmsten Jahre konzentrieren sich auffällig auf die letzten drei Jahrzehnte, und kurzfristige Schwankungen überlagern einen langfristigen Anstieg von etwa 1,5 bis 2 Grad Celsius gegenüber dem Referenzzeitraum.',
    context: 'Die Daten liefern die empirische Grundlage für Klimaanpassungsgesetze auf Bundes- und Länderebene, etwa für Hitzeaktionspläne in Städten oder Dürrefrühwarnsysteme in der Landwirtschaft. Deutschland hat sich im Rahmen des Pariser Abkommens verpflichtet, die Erderwärmung auf 1,5 Grad zu begrenzen — diese Messreihe zeigt, dass dieses Ziel für Deutschland selbst bereits nahezu erreicht oder überschritten ist.',
    methodology: 'Gemessen wird die Lufttemperatur zwei Meter über dem Boden, gemittelt über alle Wetterstationen einer Region und für jede Jahreszeit separat ausgewertet. Die Zeitreihe reicht bis ins 19. Jahrhundert zurück, was bedeutet, dass frühere Daten auf einem dünneren Stationsnetz basieren und damit etwas weniger präzise sind als moderne Messungen.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CLIMATE_GLOBAL_TEMPERATURE: {
    displayName: 'Globale Temperaturanomalie seit 1880',
    headline: 'Die Erde ist heute rund 1,3 Grad wärmer als im vorindustriellen Zeitalter.',
    lead: 'Dieser Datensatz zeigt, wie stark sich die globale Oberflächentemperatur seit der vorindustriellen Zeit verändert hat – gemessen als Abweichung vom Durchschnitt der Jahre 1850 bis 1900. Wer verstehen will, ob die Welt die Klimaziele noch erreichen kann, findet hier die Grundlage.',
    trend: 'Die globale Mitteltemperatur steigt seit Mitte des 20. Jahrhunderts beschleunigt an. In den letzten Jahren überschritt die Abweichung erstmals und wiederholt die Marke von 1,5 Grad – jene Schwelle, die das Pariser Abkommen als kritische Grenze benennt. Der Trend zeigt klar nach oben, ohne Anzeichen einer Abschwächung.',
    context: 'Das Pariser Abkommen von 2015 verpflichtet die Unterzeichnerstaaten, die Erderwärmung auf möglichst 1,5 Grad zu begrenzen. Ob diese Grenze als dauerhafter Durchschnitt gerissen wird, entscheiden Regierungen bei der Festlegung von Klimaschutzgesetzen, CO₂-Preisen und Emissionszielen. Diese Daten liefern die wissenschaftliche Grundlage für genau diese politischen Debatten.',
    methodology: 'Gemessen wird die Abweichung der globalen Jahres- und Monatsmitteltemperaturen vom vorindustriellen Referenzwert, berechnet mit dem Klimamodell HadCRUT.5.0.2.0 als Median aus 200 Zeitreihen. Das Modell kombiniert Messstationen an Land mit Schiffsmessungen der Meerestemperatur – Lücken im historischen Datennetz, besonders auf der Südhalbkugel, können die Frühwerte leicht verzerren.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CONSUMPTION_EQUIPMENT_LEVEL: {
    displayName: 'Geräteausstattung nach Einkommensgruppe',
    headline: 'Ärmere Haushalte besitzen deutlich weniger Elektrogeräte als reiche.',
    lead: 'Dieser Datensatz erfasst, welche Konsumgüter sich deutsche Privathaushalte leisten – aufgeschlüsselt nach Einkommensklassen. Wer wissen will, ob eine Wärmepumpe, ein Elektroauto oder ein Energiespargerät überhaupt in den Alltag der meisten Menschen passt, findet hier die Grundlage.',
    trend: 'Die Ausstattungsquoten steigen über die Einkommensklassen hinweg deutlich an: Haushalte mit hohem Einkommen besitzen häufiger mehrere Fahrzeuge, Geschirrspüler und moderne Unterhaltungselektronik als Haushalte im unteren Einkommensdrittel. Gleichzeitig wächst die Gesamtausstattung mit Haushaltsgeräten langfristig in allen Einkommensgruppen, wenn auch in unterschiedlichem Tempo.',
    context: 'Klimapolitische Maßnahmen wie CO₂-Preise oder Förderungen für Elektrogeräte wirken je nach Einkommensgruppe sehr unterschiedlich – wer kein Auto besitzt, profitiert nicht vom E-Auto-Zuschuss. Bundespolitik und EU-Ökodesign-Verordnung setzen auf effizientere Geräte, doch dieser Datensatz zeigt, wie ungleich verteilt der Zugang zu diesen Technologien tatsächlich ist.',
    methodology: 'Gemessen wird der Gerätebesitz privater Haushalte in Deutschland, sortiert nach Nettoeinkommen – ausgenommen sind Selbstständige, Landwirte und Haushalte mit einem monatlichen Nettoeinkommen ab rund 18.000 Euro. Die Ausschlüsse am oberen Einkommensende bedeuten, dass die reichsten Haushalte im Datensatz nicht abgebildet sind, was die tatsächliche Spreizung unterschätzt.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CONSUMPTION_EQUIPMENT_LEVEL_TOTAL: {
    displayName: 'Geräteausstattung privater Haushalte',
    headline: 'Deutsche Haushalte kaufen mehr Geräte – trotz Klimazielen.',
    lead: 'Dieser Datensatz zeigt, wie viele Haushaltsgeräte und Konsumgüter deutsche Privathaushalte besitzen und nutzen – von Kühlschränken über Fernseher bis hin zu Waschmaschinen. Wer verstehen will, wie viel Energie und Rohstoffe der private Konsum tatsächlich verschlingt, findet hier eine der wenigen verlässlichen Grundlagen dafür.',
    trend: 'Die Ausstattung deutscher Haushalte mit Geräten ist über die Jahrzehnte kontinuierlich gestiegen – mehr Geräte pro Haushalt, mehr Geräte pro Person. Besonders Unterhaltungselektronik und Haushaltskleingeräte haben seit den 2000er Jahren stark zugelegt, während klassische Großgeräte wie Kühlschrank oder Waschmaschine inzwischen nahezu flächendeckend vorhanden sind.',
    context: 'Die Bundesregierung hat sich verpflichtet, den privaten Ressourcenverbrauch im Rahmen der Deutschen Nachhaltigkeitsstrategie zu senken – doch ohne Daten zur Geräteausstattung lässt sich nicht messen, ob diese Ziele erreicht werden. Auch EU-Ökodesign-Verordnungen, die den Energieverbrauch von Geräten begrenzen, brauchen solche Daten als Referenz, um ihre tatsächliche Wirkung zu bewerten.',
    methodology: 'Erfasst werden Privathaushalte in Deutschland, ausdrücklich ohne Selbstständige, Landwirte und Haushalte mit einem monatlichen Nettoeinkommen ab rund 18.000 Euro – diese Ausschlüsse können die Ausstattungsquoten nach unten verzerren. Die Daten stammt aus der Einkommens- und Verbrauchsstichprobe des Statistischen Bundesamts, die nur alle fünf Jahre erhoben wird, was kurzfristige Trends unsichtbar macht.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CONSUMPTION_GLOBAL_ENV_FOOTPRINT: {
    displayName: 'Globaler Umweltfußabdruck deutscher Haushalte',
    headline: 'Deutsche Haushalte verbrauchen mehr Ressourcen, als die Erde verkraftet.',
    lead: 'Dieser Datensatz misst, wie stark der alltägliche Konsum privater Haushalte in Deutschland die Umwelt weltweit belastet – von der Kleidung über Lebensmittel bis hin zu Elektronik. Wer wissen will, ob das eigene Einkaufen, Essen und Reisen die natürlichen Grenzen des Planeten überschreitet, findet hier die Antwort.',
    trend: 'Der ökologische Fußabdruck deutscher Haushalte ist in den vergangenen Jahren nur geringfügig gesunken – zu langsam, um die Ziele der Deutschen Nachhaltigkeitsstrategie zu erreichen. In allen drei gemessenen Bereichen – Biokapazität, Materialverbrauch und Treibhausgasemissionen – liegt Deutschland weiterhin deutlich über einem global verträglichen Niveau.',
    context: 'Die Bundesregierung hat sich in der Deutschen Nachhaltigkeitsstrategie verpflichtet, den Konsum-Fußabdruck privater Haushalte kontinuierlich zu senken – gemessen am Indikator 12.1.b des Statistischen Bundesamts. Von diesen Zahlen hängt ab, ob Deutschland seine Verpflichtungen aus dem Pariser Klimaabkommen und den UN-Nachhaltigkeitszielen erfüllt, und sie beeinflussen Entscheidungen über Konsumsteuern, Lieferkettengesetze und Subventionen.',
    methodology: 'Gemessen wird der ökologische Fußabdruck, der durch Konsum deutscher Privathaushalte weltweit entsteht – also einschließlich der Umweltkosten, die im Ausland anfallen, etwa beim Anbau importierter Lebensmittel. Die Methode erfasst keine individuellen Haushalte, sondern Durchschnittswerte, und Datenaktualisierungen erscheinen mit mehrjähriger Verzögerung.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CONSUMPTION_LIVING_SPACE: {
    displayName: 'Wohnfläche pro Person in Deutschland',
    headline: 'Deutsche Wohnfläche wächst – obwohl die Bevölkerung schrumpft.',
    lead: 'Dieser Datensatz erfasst, wie viele Wohngebäude und Wohnungen es in Deutschland gibt, wie groß sie sind und wie sich diese Zahlen über die Zeit verändern. Wer verstehen will, warum Heizenergie, Flächenverbrauch und Baukosten politisch so umstritten sind, findet hier die Grundlage.',
    trend: 'Die gesamte Wohnfläche in Deutschland steigt seit Jahrzehnten kontinuierlich an – nicht nur weil mehr gebaut wird, sondern weil die durchschnittliche Wohnfläche pro Person von rund 15 Quadratmetern in den 1950er-Jahren auf heute über 47 Quadratmeter gewachsen ist. Selbst in Regionen mit rückläufiger Bevölkerung nimmt die beanspruchte Fläche zu.',
    context: 'Die Bundesregierung hat sich verpflichtet, den Energieverbrauch im Gebäudesektor bis 2045 auf nahezu null zu senken – doch je mehr Wohnfläche existiert, desto schwerer ist dieses Ziel zu erreichen. Gleichzeitig debattiert der Bundestag über Neubauquoten, das Gebäudeenergiegesetz und soziale Mietpreisbremsen, die alle auf diesen Basiszahlen aufbauen.',
    methodology: 'Gemessen werden Anzahl und Größe von Wohngebäuden und Wohnungen zum jeweiligen Stichtag, erhoben vom Statistischen Bundesamt auf Basis von Baugenehmigungen, Zensus und Fortschreibungen. Wohnungen im nicht-genehmigungspflichtigen Bestand sowie informelle Umnutzungen fließen nur verzögert oder gar nicht ein.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CONSUMPTION_SPENDING_USE: {
    displayName: 'Konsumausgaben privater Haushalte nach Verwendungszweck',
    headline: 'Wofür Deutsche ihr Geld ausgeben, zeigt den ökologischen Fußabdruck der Gesellschaft.',
    lead: 'Dieser Datensatz erfasst, wie viel Geld private Haushalte in Deutschland Jahr für Jahr für Lebensmittel, Energie, Mobilität, Wohnen und andere Konsumbereiche ausgeben. Wer verstehen will, ob Deutschland nachhaltiger wird, muss wissen, wohin das Geld fließt – denn Konsum treibt Emissionen, Ressourcenverbrauch und Umweltverschmutzung direkt an.',
    trend: 'Die privaten Konsumausgaben sind in Deutschland über Jahrzehnte nominell gestiegen und lagen zuletzt bei über 1,8 Billionen Euro jährlich. Nach dem pandemiebedingten Einbruch 2020 zogen die Ausgaben 2021 und 2022 kräftig an, getrieben auch durch steigende Preise infolge der Inflation – was bedeutet, dass höhere Ausgaben nicht zwingend mehr gekauften Gütern entsprechen.',
    context: 'Die Bundesregierung nutzt diese Daten, um Klimaschutzmaßnahmen im Bereich Konsum zu bewerten – etwa im Rahmen des Deutschen Ressourceneffizienzprogramms (ProgRess) und der Nationalen Nachhaltigkeitsstrategie, die eine Entkopplung von Wirtschaftswachstum und Umweltbelastung anstrebt. Auch EU-weit spielen Konsumausgaben eine Rolle, etwa bei der Bewertung des ökologischen Fußabdrucks im Rahmen des European Green Deal.',
    methodology: 'Gemessen werden die nominalen Ausgaben privater Haushalte zu jeweiligen Preisen, aufgeteilt nach Verwendungszweck gemäß den Volkswirtschaftlichen Gesamtrechnungen des Bundes – also zu laufenden Preisen, nicht inflationsbereinigt. Das bedeutet: Preisanstiege und echte Verbrauchsänderungen lassen sich aus diesem Datensatz allein nicht trennen.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CROSS_PROJECTION_REPORT_BASIC: {
    displayName: 'Rahmendaten der Treibhausgasprojektionen',
    headline: 'Deutschlands Klimaprojektionen stehen auf wackeligem Fundament aus Annahmen.',
    lead: 'Dieser Datensatz legt fest, mit welchen Annahmen Deutschlands Treibhausgasemissionen bis 2045 berechnet werden: Bevölkerungsentwicklung, Energiepreise, Wirtschaftswachstum. Wer verstehen will, ob Deutschland seine Klimaziele erreicht, muss diese Zahlen kennen – denn alle offiziellen Klimaprojektionen bauen darauf auf.',
    trend: 'Die Rahmendaten für 2023, 2024 und 2025 zeigen, dass Forschungsinstitute wie Oeko-Institut und Prognos ihre Annahmen zu Energiepreisen und Nachfrage laufend aktualisieren – ein Zeichen dafür, dass sich die wirtschaftlichen Rahmenbedingungen nach der Energiekrise 2022 weiterhin verschieben. Je nachdem, welche Preispfade für Gas, Strom und CO₂-Zertifikate angesetzt werden, divergieren die projizierten Emissionen erheblich.',
    context: 'Das Klimaschutzgesetz verpflichtet Deutschland, bis 2045 treibhausgasneutral zu werden und jährliche Sektorziele einzuhalten. Die Bundesregierung und der Expertenrat für Klimafragen nutzen genau diese Projektionsdaten, um zu beurteilen, ob die Maßnahmen ausreichen – und ob Nachsteuerungen gesetzlich vorgeschrieben sind.',
    methodology: 'Gemessen werden keine realen Emissionen, sondern modellierte Zukunftsszenarien auf Basis makroökonomischer und demografischer Eingangsdaten. Kerneinschränkung: Ändern sich Preisannahmen oder Wirtschaftsprognosen, verändern sich auch die Projektionsergebnisse – die Zahlen sind Szenarien, keine Vorhersagen.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CROSS_PROJECTION_REPORT_BASIC_26: {
    displayName: 'Rahmendaten Projektion 2026',
    headline: 'Deutschland rechnet bis 2050 mit sinkenden Großhandelspreisen für fossile Energien.',
    lead: 'Dieser Datensatz beschreibt, wie sich Bevölkerung, Wirtschaftsleistung und Energiepreise in Deutschland bis 2050 entwickeln könnten. Diese Zahlen sind keine Vorhersagen, sondern Annahmen – sie legen fest, unter welchen Bedingungen Deutschland seine Klimaziele rechnerisch erreichen kann oder verfehlt.',
    trend: 'Die Projektionen zeigen, dass die deutsche Wirtschaft bis 2050 langsam wächst, während die Bevölkerung leicht schrumpft. Die Großhandelspreise für Erdgas und Strom sinken in den Modellrechnungen mittelfristig, während CO₂-Zertifikate im Emissionshandel deutlich teurer werden – ein Preissignal, das fossile Energien schrittweise unattraktiver machen soll.',
    context: 'Die Bundesregierung muss laut Klimaschutzgesetz regelmäßig Projektionen vorlegen, die zeigen, ob Deutschland seine Emissionsziele für 2030 und 2045 einhält. Diese Rahmendaten bilden die Grundlage für genau diese Berechnungen – Energieministerium, Bundestag und EU-Kommission stützen sich darauf, wenn sie über Klimaschutzmaßnahmen entscheiden.',
    methodology: 'Gemessen werden keine realen Emissionen, sondern modellierte Eingangsgrößen: Bevölkerungszahlen, BIP-Wachstum, Energienachfrage und Preispfade für Gas, Strom und CO₂-Zertifikate im Zeitraum 2024 bis 2050. Die Zahlen spiegeln Szenarien wider, keine Garantien – kleine Abweichungen bei Wirtschaftswachstum oder Energiepreisen können die Emissionsprognosen erheblich verschieben.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_23: {
    displayName: 'Klimaprojektionen Kernindikatoren 2023',
    headline: 'Projektion 2023: Gebäude und Verkehr werden ihre Sektorziele bis 2030 verfehlen.',
    lead: 'Dieser Datensatz zeigt, wie sich Treibhausgasemissionen in Deutschland bis 2035 voraussichtlich entwickeln werden – aufgeschlüsselt nach Sektoren wie Verkehr, Gebäude, Industrie und Landwirtschaft. Wer verstehen will, ob Deutschland seine Klimaversprechen einhalten kann, findet hier die Zahlen dahinter.',
    trend: 'Die Projektionen des Umweltbundesamtes zeigen, dass Deutschland ohne zusätzliche Maßnahmen die gesetzlich festgelegten Sektorziele des Klimaschutzgesetzes bis 2030 nicht erreichen wird. Besonders der Gebäude- und der Verkehrssektor liegen deutlich hinter den erforderlichen Reduktionspfaden zurück, während der Energiesektor durch den beschleunigten Ausbau erneuerbarer Energien Fortschritte verzeichnet.',
    context: 'Das Klimaschutzgesetz verpflichtet Deutschland, die Treibhausgasemissionen bis 2030 um mindestens 65 Prozent gegenüber 1990 zu senken. Die Bundesregierung, das Parlament und die EU-Kommission nutzen diese Projektionsdaten als Grundlage für Entscheidungen über neue Gesetze, Förderprogramme und Investitionen – etwa im Bereich Wärmedämmung, Elektromobilität oder Industriedekarbonisierung.',
    methodology: 'Gemessen werden keine tatsächlichen Emissionen, sondern modellierte Zukunftsszenarien, die auf heutigen Politikmaßnahmen und Trendfortschreibungen basieren – erstellt von Oeko-Institut, Fraunhofer ISI, IREES und Thünen-Institut im Auftrag des Umweltbundesamtes. Projektionen sind keine Prognosen: Sie zeigen, was passiert, wenn bestimmte Annahmen zutreffen, nicht was zwingend eintreten wird.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_25: {
    displayName: 'Klimaprojektionen Kernindikatoren 2025',
    headline: 'Projektion 2025: Selbst mit zusätzlichen Maßnahmen verfehlt Deutschland das 65-Prozent-Ziel.',
    lead: 'Dieser Datensatz berechnet, wie sich die deutschen Treibhausgasemissionen bis 2045 entwickeln werden – aufgeschlüsselt nach Sektoren wie Energie, Verkehr, Gebäude und Landwirtschaft. Wer verstehen will, ob Deutschland seine Klimaversprechen tatsächlich einhalten kann, findet hier die Zahlen dahinter.',
    trend: 'Die Projektionen zeigen, dass Deutschland zwar auf einem Pfad sinkender Emissionen liegt, aber in mehreren Sektoren – insbesondere Verkehr und Gebäude – die gesetzlich festgelegten Jahresbudgets voraussichtlich überschreiten wird. Ohne zusätzliche politische Maßnahmen klafft eine messbare Lücke zwischen dem prognostizierten Verlauf und den Zielen des Klimaschutzgesetzes für 2030 und 2045.',
    context: 'Das Bundes-Klimaschutzgesetz verpflichtet Deutschland zur Klimaneutralität bis 2045 und legt verbindliche Emissionsbudgets für jeden Sektor fest. Diese Projektionsdaten liefern die Grundlage, auf der Bundesministerien Sofortprogramme beschließen oder verwerfen – sie entscheiden also direkt mit, ob strengere Gebäudesanierungspflichten oder ein Tempolimit auf die Tagesordnung kommen.',
    methodology: 'Gemessen werden modellierte Treibhausgasemissionen sowie ergänzende Indikatoren wie Energieverbrauch, Kraftstoffmengen, Transportleistung und Flächennutzung – berechnet von einem Konsortium aus sechs Forschungseinrichtungen im Auftrag des Umweltbundesamtes. Projektionen sind keine Prognosen, sondern Szenarien: Sie zeigen, was passiert, wenn bestehende und geplante Maßnahmen umgesetzt werden – Umsetzungslücken in der Praxis erfassen sie nicht.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_26: {
    displayName: 'Klimaprojektionen Kernindikatoren 2026',
    headline: 'Projektion 2026: Die Lücke zu Deutschlands Klimazielen hat sich kaum geschlossen.',
    lead: 'Dieser Datensatz zeigt, wie sich die deutschen Treibhausgasemissionen bis in die 2040er Jahre entwickeln werden – aufgeteilt nach Sektoren wie Verkehr, Gebäude, Industrie und Landwirtschaft. Wer verstehen will, ob Deutschland seine Klimaversprechen einhalten kann, findet hier die Zahlengrundlage.',
    trend: 'Die Projektionen zeigen, dass Deutschland seinen Emissionsausstoß zwar schrittweise senkt, in mehreren Sektoren – besonders im Gebäude- und Verkehrsbereich – aber langsamer als geplant vorankommt. Ohne zusätzliche Maßnahmen reißt Deutschland die gesetzlich festgelegten Sektorziele für 2030 in mindestens zwei Bereichen. Die Lücke zwischen dem Zielpfad und der Projektion hat sich gegenüber früheren Berechnungen kaum geschlossen.',
    context: 'Das Bundes-Klimaschutzgesetz schreibt für jeden Sektor verbindliche Jahresemissionsmengen vor – wer die Vorgaben überschreitet, muss nachsteuern. Diese Projektionsdaten bilden die gesetzlich vorgeschriebene Grundlage, auf der Bundesministerien ihre Sofortprogramme planen und der Deutsche Bundestag politische Maßnahmen beschließt. Auch auf EU-Ebene fließen die Zahlen in die Berichterstattung unter der europäischen Klimaschutzverordnung ein.',
    methodology: 'Gemessen werden projizierte Treibhausgasemissionen sowie Energieverbrauch, Produktionsmengen und Verkehrsleistungen – berechnet von sechs Forschungsinstituten im Auftrag des Umweltbundesamts auf Basis zweier Szenarien: eines mit bestehenden Maßnahmen und eines mit zusätzlichen geplanten Maßnahmen. Projektionen sind keine Vorhersagen, sondern modellbasierte Abschätzungen, die stark von Annahmen über Energiepreise, Wirtschaftswachstum und politischen Rahmenbedingungen abhängen.',
    status: 'draft',
    lazyDimensions: {
      totalDimensions: 7,
      dimensions: [
        { id: 'D_COUNTRY',      name: 'Land',       position: 0, values: [{ id: 'DE', name: 'Deutschland' }], defaultValue: 'DE' },
        { id: 'FREQUENCY',      name: 'Frequenz',   position: 1, values: [{ id: 'A', name: 'Jährlich' }], defaultValue: 'A' },
        { id: 'D_REPORTING_YEAR', name: 'Berichtsjahr', position: 2, values: [{ id: '2026', name: '2026' }], defaultValue: '2026' },
        { id: 'D_INDICATOR_PROJECTION_REPORT', name: 'Indikator', position: 3, values: [
          { id: 'THPR_DTNTBL_SNSTGS_10703870', name: 'THG-Emissionen (Sektoren)' },
          { id: 'THPR_DTNTBL_ENRGWRTSCHFT_56241560', name: 'EE-Anteil Bruttostromverbrauch' },
          { id: 'THPR_DTNTBL_GBD_44869581', name: 'Wärmepumpen Bestand' },
          { id: 'THPR_DTNTBL_GBD_19628695', name: 'Gasheizungen Bestand' },
          { id: 'THPR_DTNTBL_VRKHR_71151484', name: 'E-PKW Bestand' },
        ], defaultValue: 'THPR_DTNTBL_SNSTGS_10703870' },
        { id: 'D_UNIT', name: 'Einheit', position: 4, values: [
          { id: 'MT_CO2_EQ', name: 'Mio. t CO₂-Äq.' },
          { id: 'PJ', name: 'Petajoule' },
          { id: 'PZ', name: 'Prozent' },
          { id: 'AZ', name: 'Anzahl' },
          { id: 'MIL_AZ', name: 'Millionen Stück' },
        ], defaultValue: 'MT_CO2_EQ' },
        { id: 'D_KSG_SECTOR', name: 'KSG-Sektor', position: 5, values: [
          { id: 'TOTAL', name: 'Gesamt' },
          { id: 'ENERGIEWIRTSCHAFT', name: 'Energiewirtschaft' },
          { id: 'VERKEHR', name: 'Verkehr' },
          { id: 'GEBAEUDE', name: 'Gebäude' },
          { id: 'INDUSTRIE', name: 'Industrie' },
          { id: 'LANDWIRTSCHAFT', name: 'Landwirtschaft' },
          { id: 'ABFALLWIRTSCHAFT_SONSTIGES', name: 'Abfall & Sonstiges' },
          { id: '_Z', name: 'Nicht anwendbar' },
        ], defaultValue: 'TOTAL' },
        { id: 'D_SCENARIO_TYPE', name: 'Szenario', position: 6, values: [
          { id: 'MMS', name: 'MMS (Mit Maßnahmen)' },
        ], defaultValue: 'MMS' },
      ],
    },
    presets: [
      {
        title: 'THG-Gesamtemissionen bis 2045',
        description: 'Projektierter Rückgang der deutschen Gesamtemissionen im MMS-Szenario.',
        filters: {},
        lazyFilters: { D_COUNTRY: 'DE', FREQUENCY: 'A', D_REPORTING_YEAR: '2026', D_INDICATOR_PROJECTION_REPORT: 'THPR_DTNTBL_SNSTGS_10703870', D_UNIT: 'MT_CO2_EQ', D_KSG_SECTOR: 'TOTAL', D_SCENARIO_TYPE: 'MMS' },
      },
      {
        title: 'Verkehr: Emissionen bis 2045',
        description: 'Wie schnell sinken die THG-Emissionen im Verkehrssektor?',
        filters: {},
        lazyFilters: { D_COUNTRY: 'DE', FREQUENCY: 'A', D_REPORTING_YEAR: '2026', D_INDICATOR_PROJECTION_REPORT: 'THPR_DTNTBL_SNSTGS_10703870', D_UNIT: 'MT_CO2_EQ', D_KSG_SECTOR: 'VERKEHR', D_SCENARIO_TYPE: 'MMS' },
      },
      {
        title: 'Gebäude: Emissionen bis 2045',
        description: 'Emissionspfad des Gebäudesektors — Wärmewende im Fokus.',
        filters: {},
        lazyFilters: { D_COUNTRY: 'DE', FREQUENCY: 'A', D_REPORTING_YEAR: '2026', D_INDICATOR_PROJECTION_REPORT: 'THPR_DTNTBL_SNSTGS_10703870', D_UNIT: 'MT_CO2_EQ', D_KSG_SECTOR: 'GEBAEUDE', D_SCENARIO_TYPE: 'MMS' },
      },
      {
        title: 'EE-Anteil Strom bis 2038',
        description: 'Wie viel Prozent des Stroms kommen aus Erneuerbaren?',
        filters: {},
        lazyFilters: { D_COUNTRY: 'DE', FREQUENCY: 'A', D_REPORTING_YEAR: '2026', D_INDICATOR_PROJECTION_REPORT: 'THPR_DTNTBL_ENRGWRTSCHFT_56241560', D_UNIT: 'PZ', D_KSG_SECTOR: 'ENERGIEWIRTSCHAFT', D_SCENARIO_TYPE: 'MMS' },
      },
    ],
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_CROSS_PROJECTION_REPORT_FINAL_CONSUMER_PRICES: {
    displayName: 'Energiepreisentwicklung bis 2045',
    headline: 'Strom, Gas, Sprit: So teuer wird Energie in Deutschland bis 2045.',
    lead: 'Dieser Datensatz zeigt, wie sich die Preise für Benzin, Erdgas, Strom, Fernwärme, Biomasse und Wasserstoff bis 2045 entwickeln werden – aufgeschlüsselt nach allen Preisbestandteilen von der Beschaffung bis zur Steuer. Wer heute ein Haus saniert, ein Auto kauft oder eine Heizung einbaut, trifft Entscheidungen, die Jahrzehnte wirken – und dieser Datensatz zeigt, mit welchen Energiekosten die Bundesregierung dabei rechnet.',
    trend: 'Die Projektionen zeigen steigende CO₂-Preise als zentralen Treiber: Mit dem wachsenden CO₂-Preis im nationalen Emissionshandel verteuern sich fossile Energieträger wie Erdgas und Heizöl deutlich, während Strom aus erneuerbaren Quellen langfristig wettbewerbsfähiger wird. Wasserstoff gilt in den Szenarien noch als teuer, soll aber ab den 2030er-Jahren günstiger werden.',
    context: 'Die Bundesregierung nutzt diese Preispfade als Grundlage für ihre offiziellen Treibhausgasprojektionen, die sie gegenüber der EU-Kommission melden muss. Welche Heiztechnologie gefördert wird, wie das Gebäudeenergiegesetz ausgestaltet ist und ob sich Elektromobilität rechnet – all das hängt davon ab, welche Energiepreise der Staat als realistisch annimmt.',
    methodology: 'Berechnet werden Endverbraucherpreise inklusive aller Komponenten – Beschaffung, Netzentgelte, Steuern und Abgaben – auf Basis der Rahmendaten der Treibhausgasprojektionen 2025, ergänzt um Modellannahmen des Beratungsunternehmens Prognos. Die Zahlen sind Projektionen, keine Prognosen: Sie bilden politisch definierte Szenarien ab, keine Marktvorhersagen.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_DAS_WASSER_WW_I_1: {
    displayName: 'Terrestrische Wasserspeicherung',
    headline: 'Deutschland verliert seit zwei Jahrzehnten kontinuierlich Wasser im Boden.',
    lead: 'Dieser Datensatz misst, wie viel Wasser in Deutschland im Boden gespeichert ist — in Seen, Flüssen, aber auch tief im Grundwasser. Wer wissen will, ob genug Wasser für Landwirtschaft, Trinkwasserversorgung und Ökosysteme vorhanden ist, findet hier eine der wenigen Quellen, die das vollständige Bild zeigen.',
    trend: 'Über die letzten 20 Jahre sinkt die terrestrisch gespeicherte Wassermenge in Deutschland deutlich. Besonders die Dürrejahre 2018 bis 2020 hinterlassen markante Einbrüche weit unterhalb des langjährigen Mittels — ein Ausmaß, das selbst im Vergleich zu früheren Trockenphasen heraussticht.',
    context: 'Sinkende Grundwasserspiegel gefährden die Trinkwasserversorgung von Millionen Menschen und zwingen Bundesländer wie Brandenburg und Bayern bereits zu Entnahmeverboten. Die EU-Wasserrahmenrichtlinie verpflichtet Deutschland zum guten ökologischen Zustand seiner Gewässer — ein Ziel, das bei anhaltendem Wasserverlust schwer erreichbar bleibt.',
    methodology: 'Satelliten der GRACE-Mission messen minimale Veränderungen im Schwerefeld der Erde und leiten daraus ab, wie viel Wasser sich ober- und unterirdisch angesammelt hat oder fehlt. Die Methode erfasst keine einzelnen Regionen oder Grundwasserschichten getrennt, sondern liefert räumlich gemittelte Gesamtwerte für größere Gebiete.',
    status: 'draft',
    excludeFromCatalog: true, // API antwortet mit 404 — Datensatz derzeit nicht erreichbar
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_DAS_WASSER_WW_I_10: {
    displayName: 'Wassertemperatur der Fließgewässer',
    headline: 'Deutschlands Flüsse werden wärmer – Fische sterben bereits.',
    lead: 'Dieser Datensatz misst die Wassertemperaturen in deutschen Fließgewässern über verschiedene Flussregionen hinweg. Wer wissen will, ob Forellen, Äschen und andere kälteliebende Fischarten in deutschen Flüssen noch eine Zukunft haben, findet hier die entscheidenden Zahlen.',
    trend: 'In nahezu allen untersuchten Flussregionen steigen die Wassertemperaturen seit Jahrzehnten messbar an. Das Extremjahr 2018 führte zu so hohen Temperaturen und so starkem Sauerstoffmangel, dass in vielen Gewässern – darunter Teile des Oberrheingebiets – Fische in großer Zahl verendeten. Lediglich für die Äschenregion lässt sich bislang kein eindeutiger Langzeittrend ablesen, da die Zeitreihe dort noch zu kurz ist.',
    context: 'Steigende Flusstemperaturen gefährden nicht nur Ökosysteme, sondern auch die Kühlwasserversorgung von Kraftwerken und die Trinkwasseraufbereitung. Die EU-Wasserrahmenrichtlinie verpflichtet Deutschland, einen guten ökologischen Zustand der Gewässer zu erreichen – ein Ziel, das durch den Klimawandel zunehmend schwerer zu halten ist und Konsequenzen für Genehmigungen industrieller Wasserentnahmen hat.',
    methodology: 'Gemessen werden die Wassertemperaturen in verschiedenen Fischregionen deutscher Fließgewässer über mehrere Jahrzehnte hinweg. Die Aussagekraft für einzelne Regionen wie die Äschenregion ist begrenzt, da dort die verfügbaren Zeitreihen noch keine belastbaren Langzeitaussagen erlauben.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_DAS_WASSER_WW_I_3: {
    displayName: 'Abfluss der Fließgewässer',
    headline: 'Deutschlands Flüsse führen im Sommer messbar weniger Wasser als früher.',
    lead: 'Dieser Datensatz erfasst, wie viel Wasser durch deutsche Flüsse fließt – gemessen als Abflusstiefe an 76 Pegeln über Jahrzehnte hinweg. Wer Trinkwasser trinkt, Landwirtschaft betreibt oder in der Nähe eines Flusses lebt, hängt direkt davon ab, wie viel Wasser diese Flüsse tragen.',
    trend: 'Seit 1961 sinkt die mittlere Abflusstiefe im Sommer-Halbjahr – und dieser Rückgang ist statistisch signifikant. Im Winter-Halbjahr zeigt sich zwar ebenfalls ein leichter Rückgang, dieser lässt sich jedoch nicht statistisch absichern. Das bedeutet: Im Sommer steht in deutschen Flüssen nachweislich weniger Wasser zur Verfügung als noch vor sechs Jahrzehnten.',
    context: 'Geringere Sommerabflüsse gefährden die Trinkwasserversorgung, die Kühlung von Kraftwerken und die Binnenschifffahrt – alles Bereiche, für die der Bund und die Länder Vorsorgestrategien entwickeln müssen. Die Deutsche Anpassungsstrategie an den Klimawandel sowie die EU-Wasserrahmenrichtlinie verpflichten Deutschland, den Zustand seiner Gewässer zu überwachen und Gegenmaßnahmen einzuleiten. Diese Daten liefern die empirische Grundlage dafür.',
    methodology: 'Gemessen wird die Abflusstiefe – das Wasservolumen pro Fläche eines Einzugsgebiets – an 76 Pegeln in deutschen Flussgebieten, aufgeteilt in Sommer- und Winter-Halbjahr. Einzelne Extremjahre können die Mittelwerte stark verschieben, weshalb kurzfristige Schwankungen nicht überbewertet werden sollten.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_DAS_WASSER_WW_I_4: {
    displayName: 'Hochwasserereignisse an deutschen Flüssen',
    headline: 'Hochwasser trifft Deutschland unregelmäßig, aber mit räumlichen Schwerpunkten.',
    lead: 'Dieser Datensatz erfasst Hochwasserereignisse an deutschen Flüssen – sowohl im Winter als auch im Sommer. Wer wissen will, wann und wo Flüsse über die Ufer treten, findet hier eine der wenigen systematischen Zeitreihen, die Überschwemmungen über Jahrzehnte hinweg dokumentieren.',
    trend: 'Eindeutige langfristige Trends lassen sich bislang nur in wenigen Fällen nachweisen. Hochwasserereignisse folgen keinem gleichmäßigen Muster, sondern hängen stark von Wetterlagen ab, die bestimmte Flussgebiete wiederholt treffen und andere verschonen. Eine generelle Zunahme oder Abnahme lässt sich aus den vorliegenden Daten nicht pauschal ableiten.',
    context: 'Hochwasserschutz ist in Deutschland Ländersache, doch die EU-Hochwasserrisikomanagementrichtlinie verpflichtet Bund und Länder gemeinsam, Risikogebiete auszuweisen und Schutzpläne zu erstellen. Kommunen, Katastrophenschutzbehörden und Versicherungen nutzen solche Daten, um Schutzmaßnahmen zu priorisieren und Baupläne in gefährdeten Zonen zu bewerten. Extremereignisse wie die Ahrtal-Flut 2021 zeigen, wie folgenreich Fehleinschätzungen bei der Risikovorsorge sein können.',
    methodology: 'Gemessen werden Wasserstandspegel an ausgewählten Messstationen entlang deutscher Flüsse, aus denen Hochwasserereignisse nach festgelegten Schwellenwerten identifiziert werden. Da nur eine begrenzte Anzahl von Pegeln in den Datensatz einfließt, bleiben einzelne Hochwasserereignisse unerfasst – regionale Lücken im Messnetz können das Bild verzerren.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_DAS_WASSER_WW_I_6: {
    displayName: 'Niedrigwasserereignisse an deutschen Flüssen',
    headline: 'Drei Dürrejahre in Folge haben Deutschlands Flüsse auf ein historisches Tief gebracht.',
    lead: 'Dieser Datensatz erfasst, wie oft und wie stark die Wasserstände in deutschen Flüssen unter kritische Schwellenwerte fallen – sogenannte Niedrigwasserereignisse. Wenn Flüsse zu wenig Wasser führen, stockt die Binnenschifffahrt, Kraftwerke können nicht mehr ausreichend gekühlt werden, und ganze Ökosysteme geraten unter Stress.',
    trend: 'Über mehrere Jahrzehnte prägten einzelne trockene Ausreißerjahre das Niedrigwassergeschehen in Deutschland. Die Sommer 2018, 2019 und 2020 durchbrachen dieses Muster: Drei aufeinanderfolgende Extremjahre mit außergewöhnlich niedrigen Wasserständen markieren eine neue Qualität, die in den Aufzeichnungen bislang kein Vorbild hat.',
    context: 'Niedrigwasser ist kein lokales Problem – es betrifft gleichzeitig die Energieversorgung, den Gütertransport auf dem Rhein und anderen Wasserstraßen sowie die Trinkwasserversorgung in betroffenen Regionen. Die Bundesregierung und die EU-Wasserrahmenrichtlinie verpflichten die Länder, den ökologischen Zustand der Gewässer zu erhalten; anhaltende Niedrigwasserphasen erschweren dieses Ziel erheblich.',
    methodology: 'Gemessen werden Abfluss- und Pegelstandsdaten an Messstationen entlang deutscher Flüsse, ausgewertet von der Bundesanstalt für Gewässerkunde. Die Daten spiegeln hauptsächlich Oberflächenwasser wider; Grundwasserstände und regionale Unterschiede zwischen Einzugsgebieten erfordern zusätzliche Datensätze für ein vollständiges Bild.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_DAS_WASSER_WW_I_7: {
    displayName: 'Wasserstand deutscher Seen',
    headline: 'Deutschlands Seen verlieren seit Jahrzehnten stetig an Wasser.',
    lead: 'Dieser Datensatz misst, wie stark die Wasserstände deutscher Seen vom langjährigen Mittel abweichen – seit 2014 jährlich erfasst. Wer wissen will, ob Badeseen, Trinkwasserreservoirs und Feuchtgebiete schrumpfen, findet hier die Grundlage.',
    trend: 'Seit den 1960er Jahren sinken die Pegelstände sowohl in der Norddeutschen Tiefebene als auch in den Alpenvorlandseen kontinuierlich. Die Dürrejahre 2018 bis 2020 beschleunigten diesen Rückgang massiv: In Norddeutschland fielen die Grundwasserspiegel so tief, dass viele Seen deutlich weniger Wasser führten als in jedem vergleichbaren Zeitraum zuvor.',
    context: 'Sinkende Seewasserstände bedrohen die Trinkwasserversorgung, die Binnenschifffahrt und ganze Ökosysteme – Entscheidungen über Wasserentnahmerechte, Naturschutzgebiete und kommunale Dürsevorsorge stützen sich direkt auf solche Messdaten. Die Bundesregierung hat im Rahmen der Deutschen Anpassungsstrategie an den Klimawandel (DAS) konkrete Beobachtungspflichten verankert, zu denen dieser Indikator gehört.',
    methodology: 'Gemessen wird die jährliche Abweichung des Seewasserstands vom hydrologischen Referenzwert, getrennt nach Regionen, auf Basis von Pegeldaten der Länderämter. Die Zeitreihe beginnt erst 2014, was Langzeitvergleiche einschränkt; ältere Trends stützen sich auf separate historische Datensätze der Bundesländer.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_DAS_WASSER_WW_I_9: {
    displayName: 'Frühjahrsalgenblüte in deutschen Seen',
    headline: 'Algenblüten in deutschen Seen starten immer früher im Jahr.',
    lead: 'Dieser Datensatz erfasst, wann im Frühjahr Algen in deutschen Seen zu wachsen beginnen – ein Zeitpunkt, der sich durch den Klimawandel messbar verschiebt. Wer das für ein Randthema hält, irrt: Die Algenblüte ist der Startschuss für die gesamte Nahrungskette im See, von Kleinstlebewesen bis zu Fischen.',
    trend: 'Besonders milde Winter und überdurchschnittlich warme Frühjahre – wie 2019 und 2020 – haben die Algenblüte spürbar nach vorne verschoben. Diese Verschiebung ist kein Ausreißer, sondern Teil eines langfristigen Musters: Wärmere Temperaturen im späten Winter beschleunigen das Algenwachstum systematisch und verändern damit den Rhythmus ganzer Ökosysteme.',
    context: 'Die Daten fließen in das Monitoringsystem der Deutschen Anpassungsstrategie an den Klimawandel (DAS) ein, mit dem die Bundesregierung Klimafolgen in verschiedenen Sektoren verfolgt. Frühere Algenblüten können Fischbestände destabilisieren, die Trinkwasseraufbereitung erschweren und touristische Nutzung von Seen beeinflussen – Fragen, die Kommunen, Wasserbehörden und Naturschutzbehörden direkt betreffen.',
    methodology: 'Gemessen wird der Einsetzzeitpunkt der Frühjahrsalgenblüte in ausgewählten deutschen Seen, ausgewertet von Brockmann Consult und der Christian-Albrechts-Universität Kiel. Die Datenbasis beschränkt sich auf eine begrenzte Zahl von Seen, sodass regionale Unterschiede nur eingeschränkt abgebildet werden.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_DAS_WASSER_WW_R_1: {
    displayName: 'Wassernutzungsindex Deutschland',
    headline: 'Deutschland verbraucht weniger Wasser als je zuvor – doch regional droht Knappheit.',
    lead: 'Dieser Datensatz misst, wie viel Wasser Deutschland im Verhältnis zu seinen nutzbaren Wasserreserven tatsächlich entnimmt. Wer wissen will, ob unser Wasser knapp wird – und wo –, findet hier eine der zentralsten Kennzahlen der deutschen Umweltbeobachtung.',
    trend: 'Seit den 1990er Jahren ist der Wassernutzungsindex in Deutschland kontinuierlich gesunken. Seit 2007 liegt er dauerhaft unter der kritischen Schwelle von 20 Prozent – das heißt, bundesweit werden weniger als ein Fünftel der verfügbaren Wasserreserven genutzt. Regional zeigt sich jedoch ein anderes Bild: In Teilen Ostdeutschlands und im Rheingraben überschreiten einzelne Gebiete diesen Schwellenwert deutlich.',
    context: 'Die EU-Wasserrahmenrichtlinie verpflichtet Deutschland, den ökologischen Zustand seiner Gewässer zu schützen und nachhaltige Entnahmen sicherzustellen. Klimamodelle prognostizieren häufigere Trockensommer, was die saisonalen Spitzenlasten für Wasserversorger erhöht und politischen Handlungsdruck erzeugt. Kommunen, Wasserversorger und Landesregierungen stützen ihre Planungsentscheidungen direkt auf diese Kennzahl.',
    methodology: 'Gemessen wird das Verhältnis der gesamten Wasserentnahme zum langfristig verfügbaren Wasserdargebot – ausgedrückt als Prozentsatz. Der Index bildet keine Wasserqualität ab und kann regionale Engpässe auf nationaler Ebene statistisch überdecken.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_DAS_WASSER_WW_R_2: {
    displayName: 'GAK-Mittel für den Hochwasserschutz',
    headline: 'Seit 2015 fließen deutlich mehr Bundesmittel in den Hochwasserschutz.',
    lead: 'Dieser Datensatz erfasst, wie viel Geld Bund, Länder und EU in Deutschland für Hochwasserschutzmaßnahmen ausgeben — etwa für Deichbau, Deichrückverlegungen und die Renaturierung von Gewässern. Wer verstehen will, ob Deutschland sich ernsthaft gegen Überschwemmungen wappnet, findet hier die Zahlen dahinter.',
    trend: 'Seit Einführung des Sonderrahmenplans \'Maßnahmen des präventiven Hochwasserschutzes\' im Jahr 2015 sind die Ausgaben der Länder im Rahmen der Gemeinschaftsaufgabe Agrarstruktur und Küstenschutz (GAK) spürbar gestiegen. Der Bund kofinanziert diese Maßnahmen, zusätzlich fließen EU-Mittel — insgesamt zeigt die Kurve nach oben.',
    context: 'Hochwasserereignisse wie die Flutkatastrophe im Ahrtal 2021 haben den politischen Druck erhöht, Schutzinfrastruktur systematisch auszubauen. Die GAK-Förderung ist dabei ein zentrales Steuerungsinstrument des Bundes; welche Länder wie viel investieren, entscheidet über den konkreten Schutz von Siedlungen, Landwirtschaft und Infrastruktur.',
    methodology: 'Gemessen wird die tatsächlich verausgabte Fördersumme im Rahmen der GAK, aufgeschlüsselt nach Bund-, Länder- und EU-Anteilen. Die Daten spiegeln Mittelabflüsse wider, nicht bewilligte Gesamtbudgets — Verzögerungen bei der Umsetzung von Projekten können die Jahreswerte verzerren.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_DAS_WASSER_WW_R_3: {
    displayName: 'Hochwasserschutz-Investitionen Hessen',
    headline: 'Hessen investierte 234 Millionen Euro in den Hochwasserschutz – lokale Kosten fehlen.',
    lead: 'Dieser Datensatz erfasst, wie viel Geld Bund und Land Hessen in den vergangenen zehn Jahren in den Hochwasserschutz gesteckt haben. Wer wissen will, ob Deutschland seine Infrastruktur gegen steigende Flutrisiken wappnet, findet hier einen konkreten Anhaltspunkt.',
    trend: 'Über einen Zeitraum von zehn Jahren flossen rund 234 Millionen Euro in hessische Hochwasserschutzmaßnahmen – allein aus Bundes- und Landesmitteln. Wie sich diese Investitionen von Jahr zu Jahr entwickelt haben und ob das Tempo zuletzt zugenommen hat, lässt der Datensatz offen.',
    context: 'Starkregen und Hochwasser verursachen in Deutschland jährlich Milliardenschäden; der Klimawandel verschärft diese Risiken weiter. Bund und Länder stehen unter politischem Druck, die Schutzinfrastruktur auszubauen – nicht zuletzt seit den Flutkatastrophen an Ahr und Elbe. Welche gesetzlichen Mindeststandards für Gewässer erster Ordnung gelten, regeln die Länder selbst, was zu Lücken beim Unterhalt führt.',
    methodology: 'Gemessen werden staatliche Investitionen von Bund und Land Hessen in technische Hochwasserschutzmaßnahmen; Eigenmittel der Kommunen sowie nicht-technische Maßnahmen an Gewässern erster Ordnung bleiben weitgehend unberücksichtigt. Die tatsächlichen Gesamtausgaben für Hochwasserschutz in Hessen liegen daher höher als die ausgewiesenen 234 Millionen Euro.',
    status: 'draft',
  },

  DF_ENERGY_AGEE_CAPACITY: {
    displayName: 'Installierte Kapazität erneuerbarer Energien',
    headline: 'Photovoltaik überholt Wind: Solar ist 2023 zur größten installierten Ökostrom-Quelle geworden.',
    lead: 'Dieser Datensatz zeigt, wie viel Strom aus Wind, Sonne, Biomasse und anderen erneuerbaren Quellen Deutschland theoretisch erzeugen kann – gemessen in installierter Leistung, Jahr für Jahr seit 1990. Wer verstehen will, wie schnell die Energiewende tatsächlich vorankommt, findet hier die nüchterne Messlatte.',
    trend: 'Die installierte Kapazität erneuerbarer Energien ist in drei Jahrzehnten nahezu ununterbrochen gewachsen. Photovoltaik hat Windkraft an Land inzwischen als größte installierte Kapazität überholt – obwohl Windkraft mehr Strom erzeugt, weil sie höhere Volllaststunden erreicht. Allein seit 2020 hat sich die PV-Kapazität fast verdoppelt.',
    context: 'Das Erneuerbare-Energien-Gesetz schreibt vor, dass bis 2030 mindestens 80 Prozent des deutschen Stroms aus erneuerbaren Quellen stammen sollen – diese Kapazitätsdaten zeigen, ob der Ausbau schnell genug läuft. Bundesministerien, die EU-Kommission und internationale Klimaberichterstattung stützen sich direkt auf diese Zahlen.',
    methodology: 'Gemessen wird die installierte elektrische Nennleistung in Gigawatt – also das theoretische Maximum, nicht die tatsächlich erzeugte Strommenge. Hohe Kapazität bedeutet nicht automatisch hohe Stromproduktion: Eine Solaranlage liefert im Schnitt nur 1.000 Volllaststunden pro Jahr, eine Windanlage an Land rund 2.000.',
    status: 'draft',
    defaultChartConfig: {
      type: 'stacked',
      defaultFilters: { 'D_INDICATOR': 'Installierte elektrische Leistung' },
      stackedSeries: [
        { label: 'Wind an Land', color: '#1B2B3A' },
        { label: 'Wind auf See', color: '#3D5A6E' },
        { label: 'Photovoltaik', color: '#d97706' },
        { label: 'Biomasse', color: '#4A6741' },
        { label: 'Wasserkraft', color: '#0284c7' },
      ],
    },
    labelOverrides: {
      'Windenergie an Land': 'Wind an Land',
      'Wind power onshore': 'Wind an Land',
      'Windenergie auf See': 'Wind auf See',
      'Wind power offshore': 'Wind auf See',
      'Photovoltaik': 'Photovoltaik',
      'Photovoltaics': 'Photovoltaik',
      'Biomasse': 'Biomasse',
      'Biomass': 'Biomasse',
      'Wasserkraft': 'Wasserkraft',
      'Hydropower': 'Wasserkraft',
    },
  },

  DF_ENERGY_AGEE_ECONOMY: {
    displayName: 'Investitionen in erneuerbare Energien',
    headline: '2023 flossen fast 39 Milliarden Euro in neue Erneuerbare-Anlagen – Rekord.',
    lead: 'Dieser Datensatz erfasst, wie viel Geld Deutschland seit dem Jahr 2000 in den Bau neuer Wind-, Solar- und Biogasanlagen investiert hat — und welche wirtschaftlichen Impulse der laufende Betrieb dieser Anlagen auslöst. Wer wissen will, ob die Energiewende auch als Konjunkturprogramm funktioniert, findet hier die Zahlen.',
    trend: 'Die Investitionen in neue Erneuerbare-Anlagen erreichten 2023 mit fast 39 Milliarden Euro einen historischen Höchststand, angetrieben durch den PV-Boom und den Offshore-Windausbau. Hinzu kommen über 23 Milliarden Euro an laufenden wirtschaftlichen Effekten aus dem Betrieb bestehender Anlagen – zusammen übersteigt die Branche die 60-Milliarden-Marke.',
    context: 'Die Bundesregierung ist gesetzlich verpflichtet, den Anteil erneuerbarer Energien am Stromverbrauch bis 2030 auf 80 Prozent zu steigern — Investitionsdaten zeigen, ob der Kapitalfluss dafür ausreicht. Politikerinnen und Politiker nutzen diese Zahlen, um Förderprogramme zu rechtfertigen oder anzupassen.',
    methodology: 'Gemessen werden Bruttoinvestitionen in den Neubau von Anlagen sowie wirtschaftliche Effekte aus dem Betrieb (Umsatz, Beschäftigung), aufgeschlüsselt nach Energieträgern in Millionen Euro. Die Daten beruhen auf Schätzungen der AGEE-Stat; aktuelle Jahreswerte sind zunächst vorläufig.',
    status: 'draft',
  },

  DF_ENERGY_AGEE_ELECTRICITY: {
    displayName: 'Stromerzeugung aus erneuerbaren Energien',
    headline: 'Wind liefert mehr Strom als alle anderen Quellen zusammen – seit 2023.',
    lead: 'Dieser Datensatz zeigt, wie viel Strom Deutschland seit 1990 aus Wind, Sonne, Wasser und Biomasse erzeugt hat – aufgeschlüsselt nach Quelle und Jahr. Wer verstehen will, welche Technologie die Energiewende trägt, findet hier die Antwort.',
    trend: 'Windkraft an Land und auf See zusammen erzeugte 2023 mit über 141.000 GWh mehr Strom als Photovoltaik, Biomasse und Wasserkraft zusammen. Der Gesamtanteil erneuerbarer Energien überschritt 2023 erstmals die 50-Prozent-Marke des deutschen Bruttostromverbrauchs. Photovoltaik wächst seit 2022 am schnellsten und dürfte Wind in den nächsten Jahren einholen.',
    context: 'Die Daten bilden die Grundlage für Deutschlands Berichtspflichten gegenüber der EU und belegen, ob das Ziel von 80 Prozent erneuerbarem Strom bis 2030 erreichbar ist. Politische Entscheidungen über Ausschreibungsmengen, Netzausbau und den Kohleausstieg stützen sich direkt auf diese Zahlen.',
    methodology: 'Gemessen wird die Bruttostromerzeugung aus erneuerbaren Quellen in Gigawattstunden. Die Daten beruhen auf Schätzungen und Hochrechnungen der AGEE-Stat und werden zweimal jährlich aktualisiert; aktuelle Jahreswerte sind zunächst vorläufig.',
    status: 'draft',
    defaultChartConfig: {
      type: 'stacked',
      defaultFilters: { 'D_INDICATOR': 'Bruttostromerzeugung' },
      stackedSeries: [
        { label: 'Wind an Land', color: '#1B2B3A' },
        { label: 'Wind auf See', color: '#3D5A6E' },
        { label: 'Photovoltaik', color: '#d97706' },
        { label: 'Biomasse', color: '#4A6741' },
        { label: 'Wasserkraft', color: '#0284c7' },
      ],
    },
    labelOverrides: {
      'Windenergie an Land': 'Wind an Land',
      'Wind power onshore': 'Wind an Land',
      'Windenergie auf See': 'Wind auf See',
      'Wind power offshore': 'Wind auf See',
      'Photovoltaik': 'Photovoltaik',
      'Photovoltaics': 'Photovoltaik',
      'Biomasse': 'Biomasse',
      'Biomass': 'Biomasse',
      'Wasserkraft': 'Wasserkraft',
      'Hydropower': 'Wasserkraft',
    },
  },

  DF_ENERGY_AGEE_HEAT: {
    displayName: 'Wärmeversorgung aus erneuerbaren Energien',
    headline: 'Biomasse heizt Deutschland – Wärmepumpen und Solar spielen noch Nebenrollen.',
    lead: 'Dieser Datensatz zeigt, wie viel Wärme und Kälte Deutschland seit 1990 aus erneuerbaren Quellen wie Solarthermie, Wärmepumpen und Biomasse erzeugt. Wer verstehen will, ob die Heizwende wirklich vorankommt, findet hier die härtesten Zahlen dazu.',
    trend: 'Der Anteil erneuerbarer Energien am Wärmeverbrauch stagniert zuletzt bei rund 17–18 Prozent. Biomasse trägt dabei über 80 Prozent des erneuerbaren Wärmebeitrags – Wärmepumpen und Solarthermie wachsen zwar schnell, kommen aber von einem sehr niedrigen Ausgangsniveau. Eine echte Heizwende erfordert eine Verzehnfachung der Wärmepumpenleistung bis 2045.',
    context: 'Deutschland hat sich verpflichtet, die Wärmeversorgung bis 2045 nahezu vollständig zu dekarbonisieren — das Gebäudeenergiegesetz und die EU-Erneuerbare-Energien-Richtlinie setzen dafür konkrete Ausbauziele. Ob Kommunen ihre Wärmepläne realistisch gestalten und ob das Heizungsgesetz greift, lässt sich nur an solchen Zeitreihendaten ablesen.',
    methodology: 'Gemessen wird der tatsächliche Endenergieverbrauch aus erneuerbaren Quellen für Raumwärme, Warmwasser und Kälte in Deutschland, aufgeschlüsselt nach Energieträgern. Die Daten beruhen auf Schätzungen und Hochrechnungen von AGEE-Stat; aktuelle Jahreswerte sind zunächst vorläufig.',
    status: 'draft',
    labelOverrides: {
      'biogene Festbrennstoffe': 'Biomasse fest',
      'solid biofuels': 'Biomasse fest',
      'Biomasse': 'Biomasse (gesamt)',
      'Biomass': 'Biomasse (gesamt)',
      'Solarthermie': 'Solarthermie',
      'Solar thermal energy': 'Solarthermie',
      'Umweltwärme inkl. oberflächennaher Geothermie': 'Wärmepumpen',
      'Ambient heat (incl. near-surface geothermal energy)': 'Wärmepumpen',
      'tiefe Geothermie': 'Tiefe Geothermie',
      'Deep geothermal energy': 'Tiefe Geothermie',
      'biogene gasförmige Brennstoffe / Biogas': 'Biogas',
      'gaseous biofuels / biogas': 'Biogas',
      'Erneuerbare Energien (Gesamt)': 'Gesamt',
      'Renewable energies (total)': 'Gesamt',
    },
    defaultChartConfig: {
      type: 'stacked',
      defaultFilters: {},
      stackedSeries: [
        { label: 'Biomasse fest',   color: '#92400e' },
        { label: 'Biogas',          color: '#a3e635' },
        { label: 'Solarthermie',    color: '#f59e0b' },
        { label: 'Wärmepumpen',     color: '#3b82f6' },
        { label: 'Tiefe Geothermie', color: '#7c3aed' },
      ],
    },
  },

  DF_ENERGY_AGEE_HEAT_PUMP_STAT: {
    displayName: 'Wärmepumpen-Bestand und Installationen',
    headline: 'Über 2 Millionen Wärmepumpen in Deutschland – aber das Ziel von 500.000 Neuinstallationen pro Jahr wurde verfehlt.',
    lead: 'Dieser Datensatz zählt jede Wärmepumpe in Deutschland: wie viele es gibt, wie viel Wärme sie erzeugen und wie viel Energie sie dafür verbrauchen. Wer verstehen will, ob die Wärmewende tatsächlich Fahrt aufnimmt oder ins Stocken gerät, findet hier die härtesten verfügbaren Zahlen dazu.',
    trend: 'Ende 2025 waren rund 2,2 Millionen Wärmepumpen in Deutschland installiert – fast doppelt so viele wie noch 2019. Luft-Wasser-Anlagen dominieren als günstigste Variante den Markt. Der Bestand wächst kontinuierlich, doch Branchenverbände meldeten nach dem Boom 2023 einen deutlichen Einbruch bei Neuinstallationen 2024.',
    context: 'Das Gebäudeenergiegesetz verpflichtet Haushalte schrittweise zum Umstieg auf erneuerbare Heizungen; die EU-Erneuerbare-Energien-Richtlinie schreibt Deutschland verbindliche Wärmequoten vor. Der Einbruch 2024 zeigt, wie stark politische Unsicherheit rund um das GEG den Markt gebremst hat.',
    methodology: 'Gemessen werden Bestand, thermische Leistung, Endenergieverbrauch und nutzbare erneuerbare Wärme verschiedener Wärmepumpentypen – aufgeteilt nach Wärmequelle (Luft, Erde, Wasser). Die Daten beruhen auf Schätzungen der AGEE-Stat und bilden aggregierte nationale Trends, keine Einzelmeldungen.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_ENERGY_AGEE_TRANSPORT: {
    displayName: 'Erneuerbare Energien im Verkehrssektor',
    headline: 'Erneuerbare Energien im Verkehr wachsen – aber viel zu langsam für Klimaziele.',
    lead: 'Dieser Datensatz zeigt, wie viel Energie aus erneuerbaren Quellen – vor allem Biokraftstoffe und Ökostrom – deutsche Autos, Busse und Bahnen seit 1990 antreiben. Wer wissen will, ob Deutschland seinen Verkehr wirklich grüner macht oder nur auf dem Papier Fortschritte meldet, findet hier die Zahlen.',
    trend: 'Der Anteil erneuerbarer Energien im Verkehrssektor steigt seit Jahren, wird aber fast ausschließlich von Biokraftstoffen getragen, während Strom aus Wind und Sonne trotz des E-Auto-Booms noch eine Nebenrolle spielt. Die Zuwächse fallen zu gering aus, um die gesetzlich verankerten Klimaziele im Verkehr zu erreichen – einem Sektor, der seine CO₂-Emissionen seit 1990 kaum gesenkt hat.',
    context: 'Die EU schreibt mit der Erneuerbare-Energien-Richtlinie (RED III) vor, dass der Verkehrssektor bis 2030 einen deutlich höheren Anteil erneuerbarer Energien erreichen muss. Deutschland nutzt diese Daten, um seine Fortschritte gegenüber Brüssel zu belegen – sie entscheiden damit direkt darüber, ob das Land Strafzahlungen riskiert oder Förderprogramme rechtfertigen kann.',
    methodology: 'Gemessen wird der tatsächliche Endenergieverbrauch aus Biokraftstoffen und erneuerbarem Strom im Straßen-, Schienen- und sonstigen Verkehr, nicht die installierte Kapazität oder Produktionsmengen. Biokraftstoffe werden nach ihrem Energiegehalt gewichtet, wobei Kraftstoffe aus Abfallstoffen doppelt angerechnet werden – das kann den tatsächlichen Rohstoffeinsatz optisch verschleiern.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_ENV_AWARENESS_STUDIES: {
    excludeFromCatalog: true,
    displayName: 'Umweltbewusstseinsstudie',
    headline: 'Die Deutschen verknüpfen Umweltschutz zunehmend mit ihrer eigenen Gesundheit.',
    lead: 'Diese Studie erfasst seit 1996 alle zwei Jahre, wie die Bevölkerung in Deutschland über Umweltthemen denkt und handelt. 2024 steht dabei im Mittelpunkt, wie Menschen den Zusammenhang zwischen Umwelt, Gesundheit und Lebensqualität wahrnehmen — eine Verbindung, die politische Entscheidungen über Luftqualität, Lärm oder Klimaschutz direkt beeinflusst.',
    trend: 'Die Studienreihe zeigt über fast drei Jahrzehnte, wie sich Einstellungen und Verhaltensweisen in der Bevölkerung verschieben. Der Schwerpunkt 2024 deutet darauf hin, dass Umweltbewusstsein nicht mehr abstrakt bleibt, sondern an persönliche Gesundheit und Alltagsqualität geknüpft wird — ein Wandel, der das Mobilisierungspotenzial für Umweltpolitik erhöht.',
    context: 'Bundesumweltministerium und Umweltbundesamt nutzen diese Daten, um Kommunikationsstrategien und Förderprogramme auszurichten. In einer Zeit, in der die Bundesregierung Klimaziele für 2030 und 2045 verteidigen muss, liefert die Studie Hinweise darauf, welche Argumente in der Öffentlichkeit verfangen und welche Maßnahmen auf gesellschaftliche Akzeptanz stoßen.',
    methodology: 'Befragt wird eine repräsentative Stichprobe der Bevölkerung in Deutschland; die Erhebung kombiniert wiederkehrende Fragen mit einem wechselnden Schwerpunktthema. Zu beachten ist, dass Selbstauskünfte über Einstellungen und Verhalten voneinander abweichen können — was Menschen sagen zu tun, entspricht nicht immer dem, was sie tatsächlich tun.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_ENV_ECON_ENERGY_CONSUMPTION: {
    displayName: 'Energieverbrauch nach Sektor',
    headline: 'Deutschlands Gesamtenergieverbrauch sinkt – doch der Verkehr bleibt hartnäckig auf dem alten Niveau.',
    lead: 'Dieser Datensatz zeigt, wie viel Energie einzelne Wirtschaftsbereiche in Deutschland tatsächlich verbrauchen – von der Stahlindustrie bis zu privaten Haushalten. Wer verstehen will, wo Deutschland beim Klimaschutz ansetzen muss, findet hier die Grundlage: Nicht der Strom aus der Steckdose zählt, sondern der gesamte Energieeinsatz entlang der Produktion.',
    trend: 'Der Primärenergieverbrauch in Deutschland sinkt langfristig, vor allem seit dem Energiepreisschock 2022 hat die Industrie ihren Verbrauch spürbar gedrosselt. Gleichzeitig bleibt der Verkehrssektor hartnäckig auf hohem Niveau und bremst den Gesamtrückgang. Eine strukturelle Wende hin zu erneuerbaren Energien zeichnet sich in den Zahlen ab, vollzieht sich aber langsamer als politisch angestrebt.',
    context: 'Deutschland hat sich verpflichtet, den Primärenergieverbrauch bis 2030 gegenüber 2008 um 39 Prozent zu senken – ein Ziel, das das Energieeffizienzgesetz von 2023 verbindlich festschreibt. Diese Daten liefern die sektorale Aufschlüsselung, die Politikerinnen und Regulierer brauchen, um Maßnahmen gezielt dort einzusetzen, wo der Verbrauch nicht zurückgeht. Auch EU-Berichtspflichten im Rahmen der Energieeffizienzrichtlinie stützen sich auf solche Berechnungen.',
    methodology: 'Gemessen wird der direkte Energieverbrauch je Produktionsbereich: die Differenz zwischen eingesetzter und weitergegebener Energie, harmonisiert mit der nationalen Energiebilanz. Die Zahlen erfassen keinen indirekten Energieverbrauch durch importierte Waren – wer also wissen will, wie viel Energie deutsche Konsummuster weltweit auslösen, muss andere Quellen hinzuziehen.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_ENV_ECON_ENERGY_USAGE: {
    displayName: 'Industrieenergieverbrauch nach Branche',
    headline: 'Chemie und Stahl treiben Deutschlands Industrieenergieverbrauch – Gas bleibt der dominierende Brennstoff.',
    lead: 'Dieser Datensatz erfasst, wie viel Energie deutsche Unternehmen aus Kohle, Gas, Öl und anderen Quellen verbrauchen – aufgeschlüsselt nach Branche und Energieträger. Wer verstehen will, ob Deutschland seine Klimaziele erreicht, muss wissen, wo die Energie tatsächlich hinfließt.',
    trend: 'Der Energieverbrauch der Industrie ist zwar seit dem Krisenjahr 2022 leicht gesunken, doch der Rückgang beruht weniger auf echten Effizienzgewinnen als auf gedrosselter Produktion. Gasabhängige Sektoren wie Chemie und Stahl verbrauchen nach wie vor den Löwenanteil fossiler Brennstoffe.',
    context: 'Die Bundesregierung hat sich verpflichtet, den Primärenergieverbrauch bis 2030 gegenüber 2008 um 39 Prozent zu senken – ein Ziel, das Deutschland laut aktuellen Projektionen verfehlen wird. Industrielle Energiedaten sind die Grundlage für Emissionshandel, Förderprogramme und die Bewertung des Fortschritts unter dem Klimaschutzgesetz.',
    methodology: 'Gemessen wird der tatsächliche Energieeinsatz in Unternehmen, umgerechnet in Megajoule auf Basis unternehmensspezifischer Heizwerte. Achtung: Wo Betriebe Brennstoffe zur Eigenstromversorgung nutzen, zählt die Energie doppelt – sowohl als Brennstoff als auch als erzeugter Strom.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_ENV_ECON_MATERIAL_ACCOUNT: {
    displayName: 'Materialverbrauch der deutschen Wirtschaft',
    headline: 'Deutschland verbraucht jährlich Milliarden Tonnen Material – Tendenz sinkend.',
    lead: 'Dieser Datensatz erfasst, wie viel Rohstoff Deutschland aus der Natur entnimmt, importiert, exportiert und als Abfall oder Schadstoffe wieder abgibt – alles gemessen in Gewicht. Wer verstehen will, ob die Wirtschaft wirklich ressourcenschonender wird oder ob Deutschland seinen Verbrauch einfach ins Ausland verlagert, findet hier die Grundlage.',
    trend: 'Der inländische Rohstoffabbau ist seit den 1990er Jahren spürbar zurückgegangen, vor allem weil weniger Braunkohle gefördert und weniger Baumaterial abgebaut wird. Gleichzeitig blieben die Importe hoch, was bedeutet: Deutschland entlastet seine eigene Umwelt, schiebt den Materialverbrauch aber teilweise auf andere Länder ab.',
    context: 'Die EU-Kreislaufwirtschaftsstrategie und das deutsche Ressourceneffizienzprogramm ProgRess setzen konkrete Ziele, den Materialverbrauch pro Kopf deutlich zu senken. Dieser Datensatz liefert die Messgröße, an der Fortschritt oder Scheitern dieser Ziele abgelesen werden – und er zeigt, ob politische Maßnahmen wie CO₂-Bepreisung oder Lieferkettengesetze messbare Wirkung entfalten.',
    methodology: 'Gemessen wird das physische Gewicht aller Materialflüsse in Tausend Tonnen; Wasser und Luftgase bleiben weitgehend ausgeklammert, weil ihre Mengen alle anderen Größen überdecken würden. Der Datensatz bildet keine wirtschaftsinterne Verarbeitung ab – er zeigt also nicht, wie ein Rohstoff innerhalb Deutschlands die Produktionskette durchläuft, sondern nur, was an den Grenzen zwischen Natur, Wirtschaft und Ausland fließt.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_ENV_ECON_PROTECTION_EXPENDITURE: {
    displayName: 'Umweltschutzausgaben nach Träger',
    headline: 'Unternehmen tragen den Löwenanteil des deutschen Umweltschutzes – der Staat folgt erst.',
    lead: 'Dieser Datensatz erfasst, wie viel Staat, Unternehmen und Haushalte in Deutschland ausgeben, um die Umwelt zu schützen – von der Abwasserbehandlung bis zum Artenschutz. Wer verstehen will, ob Deutschland seinen ökologischen Herausforderungen finanziell gewachsen ist, findet hier die Grundlage.',
    trend: 'Die Umweltschutzausgaben in Deutschland sind über die vergangenen Jahrzehnte nominell gestiegen, wobei Unternehmen den größten Anteil tragen. Ob dieser Anstieg jedoch mit den wachsenden ökologischen Anforderungen – etwa durch den Klimawandel oder den Biodiversitätsverlust – Schritt hält, lässt sich erst im Verhältnis zur Wirtschaftsleistung und zu konkreten Umweltzielen beurteilen.',
    context: 'Die EU-Taxonomie, das deutsche Klimaschutzgesetz und internationale Abkommen wie das Kunming-Montreal-Abkommen zum Schutz der Biodiversität setzen konkrete Ziele, deren Erreichung erhebliche Investitionen voraussetzt. Politikerinnen und Politiker nutzen diese Daten, um Förderprogramme zu rechtfertigen, Haushaltsentscheidungen zu treffen und gegenüber der EU Rechenschaft abzulegen.',
    methodology: 'Gemessen werden laufende Ausgaben und Investitionen in Bereichen wie Gewässerschutz, Abfallentsorgung und Landschaftsschutz – aufgeteilt nach den Sektoren Staat, Unternehmen und Haushalte. Die Daten bilden jedoch nur direkt zuordenbare Ausgaben ab; indirekte Kosten des Umweltschutzes oder nicht gemeldete Ausgaben kleiner Akteure fließen nicht vollständig ein.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_ENV_ECON_PROTECTION_EXPENDITURE_AREA: {
    displayName: 'Umweltschutzausgaben nach Umweltbereich',
    headline: 'Abwasser und Abfall schlucken zwei Drittel aller deutschen Umweltschutzausgaben.',
    lead: 'Dieser Datensatz erfasst, wie viel Staat, Unternehmen und Haushalte in Deutschland für den Schutz von Wasser, Luft, Artenvielfalt und weitere Umweltbereiche ausgeben – sowohl als Investitionen als auch als laufende Kosten. Wer wissen will, ob Klimaversprechen auch mit echtem Geld unterlegt sind, findet hier die Grundlage.',
    trend: 'Die Umweltschutzausgaben in Deutschland sind über die vergangenen Jahrzehnte insgesamt gestiegen, wobei Abwasserentsorgung und Abfallwirtschaft traditionell den größten Anteil beanspruchen. Ob diese Mittel im gleichen Tempo wachsen wie die gesetzlichen Anforderungen und ökologischen Schäden, lässt sich anhand der Zeitreihen direkt ablesen.',
    context: 'Die EU-Taxonomie für nachhaltige Finanzen, das Bundes-Klimaschutzgesetz und internationale Biodiversitätsziele wie das Kunming-Montreal-Abkommen setzen konkrete Ausgabenziele – dieser Datensatz zeigt, wie weit Deutschland davon entfernt ist oder ob es sie erfüllt. Politikerinnen und Politikerinnen nutzen solche Zahlen, um Haushaltsprioritäten zu begründen oder Förderprogramme zu evaluieren.',
    methodology: 'Gemessen werden tatsächlich getätigte Ausgaben nach dem Verursacherprinzip, aufgeteilt nach Sektoren und Umweltbereichen gemäß den Umweltgesamtrechnungen des Statistischen Bundesamts. Ausgaben, die primär wirtschaftliche Ziele verfolgen und Umweltschutz nur als Nebeneffekt haben, fließen nicht in die Statistik ein.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_ENV_ECON_REVENUE_ENV_TAXES: {
    displayName: 'Einnahmen aus Umweltsteuern und CO₂-Handel',
    headline: 'CO₂-Zertifikate spülen Milliarden in den Staatshaushalt – und der Betrag wächst jedes Jahr.',
    lead: 'Dieser Datensatz erfasst, wie viel Geld der deutsche Staat durch Steuern auf Energie, Kraftstoffe und andere umweltbelastende Produkte einnimmt. Wer Strom verbraucht, tankt oder fliegt, zahlt diese Steuern — oft ohne es zu merken. Die Höhe dieser Einnahmen zeigt, wie stark der Staat Umweltkosten in den Alltag einpreist.',
    trend: 'Die Einnahmen aus umweltbezogenen Steuern sind in Deutschland über die vergangenen Jahrzehnte insgesamt gestiegen, getrieben vor allem durch Energie- und Stromsteuer. Seit der Einführung des EU-Emissionshandels fließen zusätzlich Milliarden aus der Versteigerung von CO₂-Zertifikaten in die Staatskasse — ein Posten, der mit steigendem CO₂-Preis weiter wächst. Kurzfristige Rückgänge, etwa durch gesunkenen Energieverbrauch oder politische Entlastungsmaßnahmen wie die Energiepreisbremsen 2022, können die Kurve jedoch vorübergehend dämpfen.',
    context: 'Die EU-Taxonomie und der europäische Green Deal setzen voraus, dass Mitgliedstaaten Umweltkosten konsequent in Preise einbauen — Umweltsteuern sind dafür ein zentrales Instrument. In Deutschland entscheidet der Bundestag, ob Einnahmen aus dem CO₂-Preis etwa in den Klimafonds fließen oder den Haushalt entlasten. Die Daten des Statistischen Bundesamts bilden die Grundlage für diese Verteilungsdebatte.',
    methodology: 'Gemessen werden die staatlichen Einnahmen aus gesetzlich definierten Umweltsteuern — darunter Energie-, Strom- und Kfz-Steuer — sowie Erlöse aus der Versteigerung von Emissionszertifikaten im EU-Emissionshandel. Der Datensatz bildet ab, wie viel der Staat einnimmt, nicht wie viel dadurch tatsächlich an Emissionen oder Ressourcenverbrauch eingespart wird.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_ENV_ECON_TAXES: {
    displayName: 'Umweltsteuern nach Steuerart',
    headline: 'Deutschland nimmt Milliarden durch Umweltsteuern ein – aber lenken sie wirklich um?',
    lead: 'Dieser Datensatz erfasst, wie viel Geld der deutsche Staat durch Steuern einnimmt, die direkt an umweltschädliches Verhalten geknüpft sind – etwa an den Verbrauch von Kraftstoff, Strom oder die Nutzung von Fahrzeugen. Wer verstehen will, ob die Politik tatsächlich mit Preissignalen auf Klimaschutz setzt, findet hier die Zahlen dahinter.',
    trend: 'Die Einnahmen aus umweltbezogenen Steuern bewegen sich in Deutschland seit Jahren auf hohem Niveau im dreistelligen Milliardenbereich, getragen vor allem durch Energiesteuern und die Kraftfahrzeugsteuer. Kurzfristige Schwankungen – etwa durch den gesenkten Energiesteuersatz auf Kraftstoffe 2022 – zeigen, wie empfindlich diese Einnahmen auf politische Eingriffe reagieren.',
    context: 'In der Debatte über eine ökologische Steuerreform ist entscheidend, ob Umweltsteuern tatsächlich Verhalten verändern oder nur als Einnahmequelle dienen. Die EU verlangt im Rahmen des Green Deal eine schrittweise Abschaffung umweltschädlicher Subventionen, während das Bundes­verfassungsgericht und die Schuldenbremse den Spielraum für eine aufkommensneutrale Umschichtung einengen.',
    methodology: 'Gemessen wird das tatsächliche Steueraufkommen in Euro, das aus Steuern fließt, deren Bemessungsgrundlage eine physische Einheit mit nachgewiesener Umweltwirkung ist – zum Beispiel Liter Kraftstoff oder CO₂-Ausstoß. Der Datensatz bildet nicht ab, ob und wie stark diese Steuern das Verhalten von Haushalten oder Unternehmen tatsächlich verändert haben.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_PRTR: {
    displayName: 'Schadstofffreisetzungen der Industrie (PRTR)',
    headline: 'Deutschlands Fabriken melden seit 2007, wie viel Gift sie freisetzen.',
    lead: 'Dieses Register zeigt, welche Industrieanlagen in Deutschland Schadstoffe in Luft, Wasser und Boden entlassen — und in welchen Mengen. Wer wissen will, was aus dem Schlot seines Nachbarwerks kommt oder welche Flüsse industriell belastet sind, findet hier konkrete Zahlen statt Versprechen.',
    trend: 'Über den Berichtszeitraum von 2007 bis 2022 sind die gemeldeten Schadstoffmengen bei mehreren klassischen Luftschadstoffen wie Schwefeldioxid und Stickoxiden deutlich gesunken, was den Rückgang schwerer Industrie und strengeren Grenzwerten widerspiegelt. Bei bestimmten Chemikalien und Treibhausgasen aus spezifischen Sektoren stagnieren die Werte oder zeigen nur langsame Rückgänge.',
    context: 'Die EU-PRTR-Verordnung von 2006 verpflichtet Betreiber großer Anlagen zur jährlichen Meldung — diese Daten fließen direkt in Entscheidungen über Betriebsgenehmigungen, Klagen von Umweltverbänden und die Überprüfung nationaler Klimaziele ein. Mit dem European Green Deal und verschärften Industrieemissionsrichtlinien steigt der politische Druck, die gemeldeten Mengen weiter zu senken.',
    methodology: 'Erfasst werden Freisetzungen von rund 90 Schadstoffen aus Anlagen, die festgelegte Kapazitätsschwellen überschreiten — kleinere Betriebe fehlen damit systematisch im Register. Die Daten beruhen auf Selbstmeldungen der Unternehmen und werden von den Behörden geprüft, aber nicht flächendeckend messtechnisch verifiziert. Wichtig: Jede Linie ist eine einzelne Anlage. Die Zahlen lassen sich nicht einfach über die Jahre aufsummieren, weil sich der Kreis der meldepflichtigen Anlagen ändert — aussagekräftig sind vor allem einzelne Standorte und der Vergleich der größten Emittenten je Schadstoff.',
    status: 'draft',
    labelDimensionIds: ['D_SUBSTANCES', 'D_COMPANY_NAME_PRTR', 'D_RELEASE'],
    lazyDimensions: {
      // Echte DSD: 11 Serien-Dimensionen. Positionen (0-basiert):
      // 0 D_COUNTRY · 1 D_FEDERAL_STATES · 2 D_DISTRICT · 3 FREQUENCY · 4 D_UNIT ·
      // 5 D_SUBSTANCES · 6 D_SECTOR · 7 D_RELEASE · 8 D_ACTIVITY · 9 D_COMPANY · 10 D_RIVER_BASINS
      totalDimensions: 11,
      // Land=Deutschland, Frequenz=jährlich, Einheit=kg sind einwertig und müssen
      // immer gesetzt sein, sonst liefert die UBA-API für gefilterte Abfragen leer.
      fixedSlots: { 0: 'DE', 3: 'A', 4: 'KG' },
      dimensions: [
        {
          id: 'D_FEDERAL_STATES', name: 'Bundesland', position: 1,
          // Kein "Deutschland gesamt": dieser Code existiert in den Daten nicht.
          // Die generische "Alle"-Option (Wildcard) liefert die bundesweite Sicht.
          values: [
            { id: 'NW', name: 'Nordrhein-Westfalen' }, { id: 'BW', name: 'Baden-Württemberg' },
            { id: 'BY', name: 'Bayern' }, { id: 'HE', name: 'Hessen' },
            { id: 'RP', name: 'Rheinland-Pfalz' }, { id: 'ST', name: 'Sachsen-Anhalt' },
            { id: 'BE', name: 'Berlin' }, { id: 'BB', name: 'Brandenburg' },
            { id: 'SN', name: 'Sachsen' }, { id: 'SH', name: 'Schleswig-Holstein' },
            { id: 'HH', name: 'Hamburg' }, { id: 'NI', name: 'Niedersachsen' },
            { id: 'HB', name: 'Bremen' }, { id: 'TH', name: 'Thüringen' },
            { id: 'MV', name: 'Mecklenburg-Vorpommern' }, { id: 'SL', name: 'Saarland' },
          ],
        },
        {
          id: 'D_SUBSTANCES', name: 'Schadstoff', position: 5,
          values: [
            { id: 'NOx_NO2', name: 'Stickoxide' }, { id: 'CO2', name: 'Kohlendioxid' },
            { id: 'CH4', name: 'Methan' }, { id: 'NH3', name: 'Ammoniak' },
            { id: 'CO', name: 'Kohlenmonoxid' }, { id: 'N2O', name: 'Lachgas' },
            { id: 'HCl', name: 'Chlor und anorg. Verbindungen' }, { id: 'BENZOL', name: 'Benzol' },
            { id: 'PAH', name: 'Polyzyklische arom. Kohlenwasserstoffe' },
            { id: 'TEQ', name: 'Dioxine + Furane' }, { id: 'Hg', name: 'Quecksilber' },
            { id: 'Pb', name: 'Blei' }, { id: 'Cd', name: 'Cadmium' },
            { id: 'Cr', name: 'Chrom' }, { id: 'Cu', name: 'Kupfer' },
            { id: 'Ni', name: 'Nickel' }, { id: 'Zn', name: 'Zink' },
            { id: 'As', name: 'Arsen' }, { id: 'TOC', name: 'Gesamter organ. Kohlenstoff' },
            { id: 'TP', name: 'Gesamtphosphor' }, { id: 'TS', name: 'Gesamtstickstoff' },
            { id: '1226', name: 'Halogenierte org. Verbindungen (AOX)' }, { id: 'THG', name: 'Treibhausgase gesamt' },
            { id: 'HM', name: 'Schwermetalle gesamt' }, { id: 'PCB', name: 'Polychlorierte Biphenyle' },
            { id: 'DCM', name: 'Dichlormethan' }, { id: 'CFC', name: 'Fluorchlorkohlenwasserstoffe' },
            { id: 'HCFC', name: 'Teilhalogenierte FCKW' },
          ],
        },
        {
          id: 'D_SECTOR', name: 'Sektor', position: 6,
          values: [
            { id: 'WASTE', name: 'Abfall & Abwasser' }, { id: 'MINERAL', name: 'Mineralindustrie' },
            { id: 'METAL', name: 'Metallindustrie' }, { id: 'CHEM', name: 'Chemieindustrie' },
            { id: 'PAPER', name: 'Papier- & Holzindustrie' }, { id: 'EN', name: 'Energiesektor' },
            { id: 'FOOD', name: 'Lebensmittelindustrie' }, { id: 'AQUA', name: 'Intensivtierhaltung & Aquakultur' },
            { id: 'OTHER', name: 'Sonstige' },
          ],
        },
        {
          id: 'D_RELEASE', name: 'Freisetzungsart', position: 7,
          values: [
            { id: 'AIR_YR', name: 'Luft (Jahresfracht)' }, { id: 'WAT_YR', name: 'Wasser (Jahresfracht)' },
            { id: 'SOI_YR', name: 'Boden (Jahresfracht)' }, { id: 'AIR_NB', name: 'Luft (fossil, nicht-biologisch)' },
            { id: 'AIR', name: 'Luft' }, { id: 'WAT', name: 'Wasser' }, { id: 'SOI', name: 'Boden' },
          ],
        },
      ],
    },
    presets: [
      {
        title: 'Quecksilber: das Erbe der Kohle',
        icon: '☠️',
        description: 'Industrielles Quecksilber stammt fast komplett aus Braunkohle-Kraftwerken — RWE und LEAG führen die Liste an. Das Nervengift reichert sich in Fischen an.',
        filters: { Schadstoff: 'Quecksilber', Sektor: 'Energiesektor', Freisetzungsart: 'Luft (Jahresfracht)' },
        lazyFilters: { D_SUBSTANCES: 'Hg', D_SECTOR: 'EN', D_RELEASE: 'AIR_YR' },
      },
      {
        title: 'Blei: Stahl- und Kupferhütten',
        icon: '⚙️',
        description: 'Beim Blei dominieren Stahlwerke (thyssenkrupp Duisburg) und Kupferhütten (Aurubis, u. a. Hamburg). Wenige Schmelzen, ein Großteil der Emissionen.',
        filters: { Schadstoff: 'Blei', Sektor: 'Metallindustrie', Freisetzungsart: 'Luft (Jahresfracht)' },
        lazyFilters: { D_SUBSTANCES: 'Pb', D_SECTOR: 'METAL', D_RELEASE: 'AIR_YR' },
      },
      {
        title: 'Schwefeldioxid: die Lausitz-Meiler',
        icon: '🏭',
        description: 'SO₂ (Versauerung, Feinstaub) konzentriert sich auf wenige Braunkohle-Blöcke — vor allem Jänschwalde, Boxberg und Lippendorf in der Lausitz.',
        filters: { Schadstoff: 'Schwefeloxide', Sektor: 'Energiesektor', Freisetzungsart: 'Luft (Jahresfracht)' },
        lazyFilters: { D_SUBSTANCES: 'SOx_SO2', D_SECTOR: 'EN', D_RELEASE: 'AIR_YR' },
      },
      {
        title: 'CO₂: Deutschlands größte Punktquellen',
        icon: '🌍',
        description: 'Die größten gemeldeten CO₂-Einzelquellen: Braunkohlekraftwerke (RWE Neurath/Niederaußem) und Stahlwerke (Salzgitter, Boxberg).',
        filters: { Schadstoff: 'Kohlendioxid', Freisetzungsart: 'Luft (fossil, nicht-biologisch)' },
        lazyFilters: { D_SUBSTANCES: 'CO2', D_RELEASE: 'AIR_NB' },
      },
    ],
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_PRTR_WASTE_WATER: {
    displayName: 'Schadstoffeinleitungen in Gewässer (PRTR)',
    headline: 'Deutschlands Fabriken leiten seit 2007 weniger Schadstoffe in Gewässer ein.',
    lead: 'Dieser Datensatz zeigt, welche Industrieanlagen in Deutschland giftige Stoffe in Abwässer einleiten – von Schwermetallen bis zu Stickstoffverbindungen. Wer wissen will, ob die Fabrik am Fluss das Wasser verschmutzt, findet hier die gesetzlich gemeldeten Zahlen.',
    trend: 'Über den Berichtszeitraum von 2007 bis 2022 sind die gemeldeten Schadstoffmengen in Abwässer bei vielen Substanzen spürbar gesunken. Einzelne Schadstoffe wie Schwermetalle zeigen dabei stärkere Rückgänge als Nährstoffe wie Stickstoff und Phosphor, deren Einträge hartnäckiger auf erhöhtem Niveau verbleiben.',
    context: 'Die EU-PRTR-Verordnung von 2006 verpflichtet Industrieanlagen ab bestimmten Schwellenwerten zur jährlichen Meldung ihrer Emissionen – das Ziel ist öffentliche Transparenz und politischer Druck zur Reduktion. Diese Daten fließen direkt in die Bewertung ein, ob Deutschland die Ziele der EU-Wasserrahmenrichtlinie erreicht, die einen guten Gewässerzustand vorschreibt.',
    methodology: 'Gemessen werden die jährlich gemeldeten Schadstoffmengen in Kilogramm oder Tonnen, die Industriebetriebe aus definierten Sektoren über Abwasser in Gewässer oder Kläranlagen einleiten. Erfasst sind nur Anlagen oberhalb gesetzlicher Meldeschwellen – kleinere Betriebe und diffuse Quellen wie Landwirtschaft bleiben außen vor.',
    status: 'draft',
    labelDimensionIds: ['D_SUBSTANCES', 'D_COMPANY_NAME_PRTR', 'D_RELEASE'],
    lazyDimensions: {
      // Echte DSD (Version 1.0!): 14 Serien-Dimensionen. Positionen (0-basiert):
      // 0 D_FEDERAL_STATES · 1 D_COMMUNITIES · 2 FREQUENCY · 3 D_UNIT · 4 D_SUBSTANCES ·
      // 5 D_DETERMINATION · 6 D_SECTOR · 7 D_RELEASE · 8 D_ACTIVITY · 9 D_CONFIDENTIAL_FACILITY ·
      // 10 D_CONFIDENTIAL_RELEASE · 11 D_COMPANY_NAME_PRTR · 12 D_IDENTIFICATION_NUMBER · 13 D_RIVER_BASINS
      totalDimensions: 14,
      // Frequenz=jährlich (Pos 2) und Einheit=kg (Pos 3) sind einwertig und müssen
      // immer gesetzt sein, sonst liefert die UBA-API für gefilterte Abfragen leer.
      fixedSlots: { 2: 'A', 3: 'KG' },
      dimensions: [
        {
          id: 'D_FEDERAL_STATES', name: 'Bundesland', position: 0,
          // Kein "Deutschland gesamt" (Code DE): in den Daten nicht vorhanden,
          // die generische "Alle"-Option (Wildcard) ist die bundesweite Sicht.
          values: [
            { id: 'NW', name: 'Nordrhein-Westfalen' }, { id: 'BW', name: 'Baden-Württemberg' },
            { id: 'BY', name: 'Bayern' }, { id: 'HE', name: 'Hessen' },
            { id: 'RP', name: 'Rheinland-Pfalz' }, { id: 'ST', name: 'Sachsen-Anhalt' },
            { id: 'BE', name: 'Berlin' }, { id: 'BB', name: 'Brandenburg' },
            { id: 'SN', name: 'Sachsen' }, { id: 'SH', name: 'Schleswig-Holstein' },
            { id: 'HH', name: 'Hamburg' }, { id: 'NI', name: 'Niedersachsen' },
            { id: 'HB', name: 'Bremen' }, { id: 'TH', name: 'Thüringen' },
            { id: 'MV', name: 'Mecklenburg-Vorpommern' }, { id: 'SL', name: 'Saarland' },
          ],
        },
        {
          id: 'D_SUBSTANCES', name: 'Schadstoff', position: 4,
          values: [
            { id: 'AOX', name: 'Halogenierte org. Verbindungen' }, { id: 'Cd', name: 'Cadmium' },
            { id: 'Cr', name: 'Chrom' }, { id: 'Cu', name: 'Kupfer' },
            { id: 'Hg', name: 'Quecksilber' }, { id: 'Ni', name: 'Nickel' },
            { id: 'Pb', name: 'Blei' }, { id: 'TOC', name: 'Gesamter organ. Kohlenstoff' },
            { id: 'TP', name: 'Gesamtphosphor' }, { id: 'TS', name: 'Gesamtstickstoff' },
            { id: 'Zn', name: 'Zink' }, { id: 'As', name: 'Arsen' },
            { id: 'Cl', name: 'Chloride' }, { id: 'PHENOLE', name: 'Phenole' },
            { id: 'PAH', name: 'Polyzyklische arom. Kohlenwasserstoffe' },
          ],
        },
        {
          id: 'D_SECTOR', name: 'Sektor', position: 6,
          values: [
            { id: 'WASTE', name: 'Abfall & Abwasser' }, { id: 'MINERAL', name: 'Mineralindustrie' },
            { id: 'METAL', name: 'Metallindustrie' }, { id: 'CHEM', name: 'Chemieindustrie' },
            { id: 'PAPER', name: 'Papier- & Holzindustrie' }, { id: 'EN', name: 'Energiesektor' },
            { id: 'FOOD', name: 'Lebensmittelindustrie' }, { id: 'AQUA', name: 'Intensivtierhaltung & Aquakultur' },
            { id: 'OTHER', name: 'Sonstige' },
          ],
        },
        {
          id: 'D_RELEASE', name: 'Freisetzungsart', position: 7,
          values: [
            { id: 'WW', name: 'Abwasser' }, { id: 'EC', name: 'Umweltkompartiment' },
          ],
        },
      ],
    },
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_ENERGY_FINAL: {
    displayName: 'Endenergieverbrauch im Verkehr nach Energieträger',
    headline: 'Der Verkehr verbrennt noch immer fast ausschließlich fossile Kraftstoffe.',
    lead: 'Dieser Datensatz zeigt, wie viel Energie der deutsche Verkehrssektor jedes Jahr verbraucht – aufgeschlüsselt nach Kraftstoffart, also Benzin, Diesel, Kerosin, Strom und anderen. Wer verstehen will, ob die Verkehrswende wirklich in Gang kommt, findet hier die Rohzahlen dahinter.',
    trend: 'Der Anteil fossiler Kraftstoffe am gesamten Endenergieverbrauch im Verkehr sinkt nur langsam, während Strom als Antriebsenergie zwar wächst, aber gemessen am Gesamtverbrauch noch eine marginale Rolle spielt. Diesel dominiert weiterhin den Schwerlast- und Güterverkehr, Benzin den Pkw-Bereich – an dieser Grundstruktur hat sich in den letzten Jahren wenig verändert.',
    context: 'Deutschland hat sich verpflichtet, die Treibhausgasemissionen im Verkehr bis 2030 gegenüber 1990 um 48 Prozent zu senken – ein Ziel, das nach aktuellem Stand deutlich verfehlt wird. Ob Maßnahmen wie das Hochlaufen der Elektromobilität, das Deutschlandticket oder der Ausbau des Schienennetzes tatsächlich den Energiemix verschieben, lässt sich an diesen Zahlen direkt ablesen.',
    methodology: 'Gemessen wird der Endenergieverbrauch im Verkehr in Deutschland nach Kraftstofftyp, basierend auf Daten des Kraftfahrt-Bundesamts, zusammengestellt vom Bundesministerium für Digitales und Verkehr. Der Datensatz erfasst den inländischen Verbrauch, schließt aber den internationalen Luftverkehr nur teilweise ein, was die Gesamtbilanz des Sektors unterschätzen kann.',
    status: 'draft',
    labelOverrides: {
      'Ottokraftstoff': 'Benzin',
      'Gasoline': 'Benzin',
      'Dieselkraftstoff': 'Diesel',
      'Diesel fuel': 'Diesel',
      'Flugkraftstoffe': 'Kerosin',
      'Aviation fuels': 'Kerosin',
      'vollelektrische Antriebe (Strommix?)': 'Bahnstrom',
      'all-electric propulsion systems (electricity mix?)': 'Bahnstrom',
      'reine Elektro- und Elektro-Hybrid-Antriebe': 'Strom (BEV)',
      'all-electric and electric-hybrid propulsion systems': 'Strom (BEV)',
      'Gase (gasförmig/flüssig)': 'Erdgas/Autogas',
      'Gases (gaseous, liquid)': 'Erdgas/Autogas',
      'Alle Kraftstoffe (inkl. Strom)': 'Gesamt',
      'All fuel types (incl. electricity)': 'Gesamt',
    },
    defaultChartConfig: {
      type: 'stacked',
      defaultFilters: {},
      stackedSeries: [
        { label: 'Diesel',          color: '#6b7280' },
        { label: 'Benzin',          color: '#9ca3af' },
        { label: 'Kerosin',         color: '#d1d5db' },
        { label: 'Erdgas/Autogas',  color: '#a3e635' },
        { label: 'Bahnstrom',       color: '#0284c7' },
      ],
    },
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_ENERGY_FUEL_CONSUMPTION: {
    displayName: 'Kraftstoffverbrauch im Straßenverkehr',
    headline: 'Mehr Fahrzeuge, mehr Kilometer – der Kraftstoffverbrauch sank erst mit dem E-Auto-Boom.',
    lead: 'Dieser Datensatz erfasst, wie viel Kraftstoff alle Pkw, Lkw und Motorräder in Deutschland zusammen verbrauchen – und wie viel davon jedes Fahrzeug im Schnitt schluckt. Wer wissen will, ob die Energiewende im Verkehr ankommt, findet hier eine der härtesten Kennzahlen: nicht Versprechen, sondern gemessener Verbrauch.',
    trend: 'Der Gesamtkraftstoffverbrauch im Straßenverkehr ist über Jahrzehnte gestiegen, trotz technisch effizienterer Motoren – weil gleichzeitig mehr Fahrzeuge mehr Kilometer zurücklegten. Erst in jüngerer Zeit zeigen sich erste Rückgänge, angetrieben durch den wachsenden Anteil von Elektrofahrzeugen und veränderte Mobilitätsmuster nach der Corona-Pandemie.',
    context: 'Deutschland hat sich verpflichtet, die Treibhausgasemissionen im Verkehrssektor bis 2030 auf 85 Millionen Tonnen CO₂-Äquivalente zu senken – ein Ziel, das der Sektor bislang verfehlt. Politische Entscheidungen über Tempolimits, Lkw-Maut, Kaufprämien für Elektroautos oder den Ausbau des Schienennetzes stützen sich direkt auf diese Verbrauchsdaten.',
    methodology: 'Gemessen wird der Kraftstoffverbrauch nach dem nationalen Fahrleistungskonzept: Es zählen alle Kilometer, die deutsche Fahrzeuge zurücklegen – auch im Ausland –, nicht aber Fahrten ausländischer Fahrzeuge auf deutschen Straßen. Fahrzeuge der Bundeswehr und ausländischer Streitkräfte sind ausgeschlossen, was die Gesamtzahlen geringfügig unterschätzt.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_ENERGY_FUEL_PRICES: {
    displayName: 'Kraftstoffpreise an deutschen Tankstellen',
    headline: 'Benzin und Diesel fressen einen wachsenden Teil des Haushaltsbudgets.',
    lead: 'Dieser Datensatz erfasst, wie viel Autofahrerinnen und Autofahrer in Deutschland im Durchschnitt pro Liter Benzin oder Diesel an der Tankstelle bezahlen – aufgeschlüsselt nach Steuern und Abgaben. Wer tankt, zahlt nicht nur für den Rohstoff, sondern finanziert damit auch Energiesteuer, Mehrwertsteuer und Ökosteuern – und dieser Datensatz zeigt genau, wie sich dieses Verhältnis über die Zeit verändert hat.',
    trend: 'Die Kraftstoffpreise erreichten 2022 infolge des russischen Angriffs auf die Ukraine historische Höchststände – Superbenzin (E10) kostete zeitweise über zwei Euro je Liter. Seitdem sind die Preise zwar gesunken, liegen aber strukturell höher als vor 2021. Der Steueranteil macht dabei konstant mehr als die Hälfte des Endpreises aus.',
    context: 'Die Bundesregierung hat mit dem Klimaschutzgesetz verbindliche CO₂-Reduktionsziele für den Verkehrssektor festgeschrieben, der diese bislang als einziger Sektor dauerhaft verfehlt. Kraftstoffpreise beeinflussen direkt, ob Menschen auf öffentliche Verkehrsmittel oder Elektroautos umsteigen – und sie sind ein zentrales Argument in der politischen Debatte über die CO₂-Bepreisung und soziale Ausgleichsmaßnahmen wie das Klimageld.',
    methodology: 'Gemessen wird der durchschnittliche Endverkaufspreis an deutschen Tankstellen, inklusive aller staatlichen Abgaben; Grundlage sind Daten des Kraftfahrt-Bundesamts, veröffentlicht im Jahresbericht \'Verkehr in Zahlen\'. Regionale Preisunterschiede zwischen Stadt und Land oder zwischen verschiedenen Tankstellenmarken bleiben im Bundesdurchschnitt unsichtbar.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_FREIGHT_PERFORMANCE_MEANS: {
    displayName: 'Güterverkehrsleistung nach Verkehrsträger',
    headline: 'Der Lkw dominiert Deutschlands Güterverkehr – und sein Anteil wächst weiter.',
    lead: 'Dieser Datensatz zeigt, wie viele Tonnen Güter jedes Jahr über welche Verkehrswege durch Deutschland bewegt werden – aufgeteilt auf Lkw, Güterzüge und Binnenschiffe. Wer verstehen will, warum Autobahnen verstopfen, Brücken marode werden und CO₂-Ziele im Verkehr verfehlt werden, findet hier den Ausgangspunkt.',
    trend: 'Der Lkw trägt seit Jahren den mit Abstand größten Teil der Gütertransportleistung – zuletzt über 70 Prozent aller Tonnenkilometer in Deutschland. Die Bahn gewinnt zwar vereinzelt Anteile, bleibt aber strukturell abgeschlagen, während die Binnenschifffahrt stagniert oder leicht zurückgeht.',
    context: 'Die Bundesregierung hat sich verpflichtet, bis 2030 mehr Güterverkehr von der Straße auf die Schiene zu verlagern – der sogenannte Masterplan Schienenverkehr setzt dafür konkrete Zielmarken. Diese Daten zeigen, wie weit Deutschland von dieser Verlagerung entfernt ist und ob Milliarden-Investitionen in die Bahninfrastruktur messbare Wirkung zeigen.',
    methodology: 'Gemessen wird die Transportleistung in Tonnenkilometern: Transportmenge multipliziert mit zurückgelegter Strecke – nicht die bloße Anzahl der Fahrten oder Fahrzeuge. Die Daten erfassen den deutschen Verkehrsmarkt, bilden aber grenzüberschreitende Transporte nur teilweise ab, was den Lkw-Anteil im internationalen Vergleich verzerren kann.',
    status: 'draft',
    labelOverrides: {
      'Straßenverkehr': 'Lkw (Straße)',
      'Road transport': 'Lkw (Straße)',
      'Schienenverkehr': 'Güterbahn',
      'Rail transport': 'Güterbahn',
      'Binnenschifffahrt': 'Binnenschiff',
      'Inland waterway transport': 'Binnenschiff',
      'Rohrfernleitungen': 'Pipeline',
      'Pipelines': 'Pipeline',
      'Luftverkehr': 'Luftfracht',
      'Air transport': 'Luftfracht',
      'Verkehr gesamt': 'Gesamt',
      'Total transport': 'Gesamt',
    },
    defaultChartConfig: {
      type: 'stacked',
      defaultFilters: { 'D_UNIT': 'Milliarden Tonnenkilometer', 'D_TRANSPORT_GOOD': 'Gütertransport' },
      stackedSeries: [
        { label: 'Lkw (Straße)',  color: '#6b7280' },
        { label: 'Güterbahn',    color: '#16a34a' },
        { label: 'Binnenschiff', color: '#3b82f6' },
        { label: 'Pipeline',     color: '#d1d5db' },
      ],
    },
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_FREIGHT_PERFORMANCE_SHARE: {
    displayName: 'Modal Split im Güterverkehr',
    headline: 'Bahn und Binnenschiff verlieren Anteile am deutschen Güterverkehr.',
    lead: 'Dieser Datensatz zeigt, wie viel Güter in Deutschland per Güterzug und Binnenschiff transportiert werden – und welchen Anteil diese umweltfreundlicheren Verkehrsträger am gesamten Frachtaufkommen haben. Wer wissen will, ob Deutschland seinen Güterverkehr tatsächlich von der Straße auf die Schiene verlagert, findet hier die Antwort.',
    trend: 'Der Anteil von Schiene und Binnenschifffahrt am gesamten Güterverkehr stagniert seit Jahren und liegt deutlich unter dem politisch angestrebten Niveau. Die Binnenschifffahrt verlor zuletzt Anteile, auch weil Niedrigwasserereignisse die Transportkapazitäten immer häufiger einschränken. Die Schiene konnte trotz Investitionsprogrammen keine substanziellen Anteilsgewinne gegenüber dem Lkw verbuchen.',
    context: 'Die Bundesregierung hat sich im Koalitionsvertrag das Ziel gesetzt, den Schienengüterverkehr bis 2030 auf 25 Prozent Marktanteil zu steigern – aktuell liegt er weit darunter. Die EU-Klimaziele verlangen eine deutliche Verlagerung des Güterverkehrs auf emissionsärmere Verkehrsträger. Dieses Datensatz zeigt, ob Infrastrukturpolitik und Förderprogramme messbare Wirkung entfalten.',
    methodology: 'Gemessen wird die Transportleistung in Tonnenkilometern für Güterzüge und Binnenschiffe sowie ihr Anteil an der gesamten Frachtleistung inklusive Pipelines und Luftfracht – lokaler Lkw-Verkehr unter 50 km und leichte Nutzfahrzeuge bis 3,5 Tonnen Nutzlast bleiben außen vor. Diese Ausschlüsse bedeuten, dass der ausgewiesene Lkw-Anteil höher wirkt als im Alltagsbild, weil der kleinteilige Lieferverkehr in Städten nicht einfließt.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_PASSENGER_PERFORMANCE_MEAN: {
    displayName: 'Personenverkehrsleistung nach Verkehrsträger',
    headline: 'Deutsche legen jährlich über 1 Billion Personenkilometer zurück – fast alles mit dem Auto.',
    lead: 'Dieser Datensatz zeigt, wie viele Kilometer alle Menschen in Deutschland jedes Jahr zusammen mit Auto, Bus, Bahn oder Flugzeug zurücklegen. Wer wissen will, ob die Verkehrswende tatsächlich stattfindet oder nur auf dem Papier existiert, findet hier die Antwort.',
    trend: 'Der motorisierte Individualverkehr – also private Pkw und Motorräder – macht nach wie vor den größten Teil der zurückgelegten Personenkilometer aus und hat sich nach dem pandemiebedingten Einbruch 2020 weitgehend erholt. Der Anteil der Bahn wächst langsam, bleibt aber deutlich hinter dem Straßenverkehr zurück. Der Luftverkehr nähert sich ebenfalls wieder dem Vorkrisenniveau.',
    context: 'Deutschland hat sich verpflichtet, die Treibhausgasemissionen im Verkehrssektor bis 2030 gegenüber 1990 um 48 Prozent zu senken – ein Ziel, das der Sektor bislang verfehlt. Die Bundesregierung und die EU-Kommission stützen Entscheidungen über Infrastrukturinvestitionen, Ticketpreise und Zulassungsregeln direkt auf solche Mobilitätsdaten.',
    methodology: 'Gemessen wird die Verkehrsleistung in Personenkilometern: Anzahl der Reisenden multipliziert mit der jeweils zurückgelegten Strecke, aufgeschlüsselt nach Verkehrsmittel und Jahr. Fahrten im Ausland oder grenzüberschreitende Wege werden nur teilweise erfasst, was vor allem beim Luftverkehr zu Unschärfen führt.',
    status: 'draft',
    labelOverrides: {
      'Motorisierter Individualverkehr': 'Auto & Motorrad (MIV)',
      'Motorized individual transport': 'Auto & Motorrad (MIV)',
      'Schienenverkehr': 'Bahn',
      'Rail transport': 'Bahn',
      'Öffentlicher Straßenpersonenverkehr': 'Bus & Tram (ÖPNV)',
      'Public road passenger transport': 'Bus & Tram (ÖPNV)',
      'Luftverkehr': 'Flugzeug',
      'Air transport': 'Flugzeug',
      'Verkehr gesamt': 'Gesamt',
      'Total transport': 'Gesamt',
    },
    defaultChartConfig: {
      type: 'stacked',
      defaultFilters: { 'D_UNIT': 'Milliarden Personenkilometer', 'D_TRANSPORT_GOOD': 'Personentransport' },
      stackedSeries: [
        { label: 'Auto & Motorrad (MIV)', color: '#6b7280' },
        { label: 'Bus & Tram (ÖPNV)',     color: '#3b82f6' },
        { label: 'Bahn',                  color: '#16a34a' },
        { label: 'Flugzeug',              color: '#f59e0b' },
      ],
    },
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_PASSENGER_PERFORMANCE_SHARE: {
    displayName: 'Modal Split im Personenverkehr',
    headline: 'Das 49-Euro-Ticket kam – doch der Autoanteil blieb fast unverändert.',
    lead: 'Dieser Datensatz misst, wie viele Kilometer Deutsche zu Fuß, mit dem Fahrrad, der Bahn oder dem Bus zurücklegen – im Verhältnis zum gesamten Personenverkehr. Wer wissen will, ob die Verkehrswende tatsächlich stattfindet oder nur auf dem Papier existiert, findet hier eine der direktesten Antworten.',
    trend: 'Seit 2003 schwankt der Anteil umweltfreundlicher Verkehrsmittel am deutschen Personenverkehr, ohne einen klaren Aufwärtstrend zu zeigen – das Auto dominiert die zurückgelegten Kilometer nach wie vor. Die Pandemiejahre 2020 und 2021 verzerrten das Bild kurzfristig, weil der öffentliche Verkehr einbrach, während der Radverkehr zulegte.',
    context: 'Die Bundesregierung hat sich im Koalitionsvertrag und im Rahmen des Klimaschutzgesetzes verpflichtet, den Verkehrssektor bis 2045 nahezu klimaneutral zu gestalten – ohne eine deutliche Verlagerung hin zu Bahn, Bus und Fahrrad ist dieses Ziel rechnerisch nicht erreichbar. Städte, Länder und der Bund nutzen solche Anteilsdaten, um Investitionen in Infrastruktur zu rechtfertigen oder Förderprogramme zu evaluieren.',
    methodology: 'Gemessen werden Personenkilometer – also nicht die Zahl der Fahrten, sondern die zurückgelegte Distanz multipliziert mit der Zahl der Reisenden – aufgeteilt nach Verkehrsmitteln und ins Verhältnis zum Gesamtverkehr gesetzt. Methodische Brüche in den Jahren 2003, 2014 und 2017 können sprunghafte Veränderungen in der Zeitreihe erzeugen, die keine realen Verhaltensänderungen widerspiegeln.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_PASSENGER_PERF_VEHICLE_TYPE_MEANS: {
    displayName: 'Personenverkehrsleistung nach Fahrzeugart',
    headline: 'SUV oder Zug? Welches Fahrzeug die meisten Personenkilometer erzeugt.',
    lead: 'Dieser Datensatz schlüsselt auf, wie viele Kilometer Menschen in Deutschland mit welchem konkreten Fahrzeugtyp zurücklegen — von Pkw-Klassen bis zu Fern- und Nahverkehrszügen. Wer verstehen will, welche Fahrzeuge die Klimabilanz des Verkehrs wirklich treiben, findet hier die Grundlage.',
    trend: 'Das private Auto erbringt nach wie vor den mit Abstand größten Anteil der gesamten Personenverkehrsleistung in Deutschland – mehr als 80 Prozent der Personenkilometer entfallen auf den motorisierten Individualverkehr. Bahn und öffentlicher Nahverkehr gewinnen zwar langsam Anteile, doch das Gesamtbild verschiebt sich nur träge.',
    context: 'Die Bundesregierung hat sich verpflichtet, die Treibhausgasemissionen im Verkehrssektor bis 2030 deutlich zu senken – der Sektor verfehlt dieses Ziel bislang als einziger großer Bereich wiederholt. Diese Daten zeigen, ob politische Maßnahmen wie das 49-Euro-Ticket oder der Ausbau der Bahninfrastruktur das tatsächliche Mobilitätsverhalten der Bevölkerung verändern.',
    methodology: 'Gemessen wird die Personenverkehrsleistung in Personenkilometern, also die Summe aller zurückgelegten Kilometer multipliziert mit der jeweiligen Personenzahl – berechnet vom Deutschen Zentrum für Luft- und Raumfahrt (DLR) und dem DIW Berlin. Die Zahlen beruhen auf Hochrechnungen und Erhebungen, die Alltagswege im Nahbereich sowie bestimmte informelle Mobilitätsformen möglicherweise unvollständig erfassen.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_PERFORMANCE_FUEL_VEHICLE_TYPE: {
    displayName: 'Fahrleistung nach Antriebsart',
    headline: 'Elektroautos fahren im Schnitt weniger Kilometer als Verbrenner.',
    lead: 'Dieser Datensatz zeigt, wie viele Kilometer Pkw in Deutschland je nach Antriebsart im Jahresdurchschnitt zurücklegen – also ob Benziner, Dieselfahrzeuge oder Elektroautos tatsächlich unterschiedlich intensiv genutzt werden. Das berührt jeden, der wissen will, ob die Verkehrswende im Alltag schon angekommen ist.',
    trend: 'Dieselfahrzeuge legen nach wie vor die höchsten Jahresdurchschnittskilometer zurück, was ihren anhaltenden Einsatz im Berufs- und Fernverkehr widerspiegelt. Elektroautos erreichen bislang deutlich geringere Durchschnittswerte, was auf kürzere Alltagsfahrten oder eine Nutzung als Zweitwagen hindeutet. Der Abstand verringert sich jedoch mit steigender Zulassungszahl und wachsender Ladeinfrastruktur schrittweise.',
    context: 'Die Bundesregierung hat das Ziel ausgegeben, bis 2030 mindestens 15 Millionen Elektroautos auf deutschen Straßen zu haben – wie intensiv diese Fahrzeuge genutzt werden, entscheidet maßgeblich darüber, wie viel CO₂ der Verkehrssektor tatsächlich einspart. Förderprogramme, Dienstwagenbesteuerung und Ladeinfrastrukturplanung stützen sich auf genau solche Nutzungsdaten.',
    methodology: 'Gemessen wird die inländische Fahrleistung deutscher Pkw, die auch im Ausland gefahrene Kilometer einschließt, aber Fahrten ausländischer Fahrzeuge in Deutschland ausklammert. Fahrzeuge der Bundeswehr, des Bundesgrenzschutzes und ausländischer Streitkräfte sind nicht erfasst, was die Gesamtzahlen geringfügig unterschätzen lässt.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_PUBLIC_PASSENGERS_BUS_TRAIN: {
    displayName: 'Fahrgastzahlen im öffentlichen Nahverkehr',
    headline: 'Busse und Bahnen verlieren Fahrgäste – und gewinnen sie nur langsam zurück.',
    lead: 'Dieser Datensatz zählt, wie viele Menschen in Deutschland pro Quartal Busse und Bahnen des öffentlichen Nahverkehrs nutzen. Wer wissen will, ob der Umstieg vom Auto auf öffentliche Verkehrsmittel tatsächlich stattfindet, findet hier die härteste verfügbare Zahl dazu.',
    trend: 'Die Fahrgastzahlen brachen 2020 durch die Corona-Pandemie massiv ein – in manchen Quartalen um über 40 Prozent gegenüber dem Vorjahreszeitraum. Seitdem steigen die Zahlen wieder, haben aber das Niveau von 2019 noch nicht vollständig erreicht. Der Erholungskurs verläuft schleppend und ungleichmäßig über die Quartale.',
    context: 'Die Bundesregierung hat sich verpflichtet, den Verkehrssektor bis 2030 deutlich klimafreundlicher zu gestalten – dafür muss der öffentliche Verkehr mehr Menschen bewegen als heute. Das 49-Euro-Ticket, eingeführt im Mai 2023, sollte genau diesen Wechsel beschleunigen; ob es die Fahrgastzahlen dauerhaft hebt, lässt sich mit diesem Datensatz direkt ablesen.',
    methodology: 'Gemessen wird die Anzahl der Fahrten auf Basis von Meldungen der Verkehrsunternehmen an das Statistische Bundesamt, getrennt nach Quartalen. Für den Fernverkehr – also Fernbusse und Fernzüge – weist der Datensatz bewusst keine Länderwerte aus, weil die Unternehmen ihren Sitz oft in nur einem Bundesland haben, ihre Fahrgäste aber bundesweit befördern.',
    status: 'draft',
    lazyDimensions: {
      totalDimensions: 5,
      dimensions: [
        {
          id: 'D_COUNTRY',
          name: 'Land',
          position: 0,
          values: [{ id: 'DE', name: 'Deutschland' }],
          defaultValue: 'DE',
        },
        {
          id: 'FREQUENCY',
          name: 'Frequenz',
          position: 1,
          values: [
            { id: 'Q', name: 'Vierteljährlich' },
            { id: 'A', name: 'Jährlich' },
          ],
          defaultValue: 'A',
        },
        {
          id: 'D_UNIT',
          name: 'Einheit',
          position: 2,
          values: [
            { id: 'TSD', name: 'Anzahl in 1.000' },
          ],
          defaultValue: 'TSD',
        },
        {
          id: 'D_FEDERAL_STATES',
          name: 'Bundesland',
          position: 3,
          values: [
            { id: 'BB', name: 'Brandenburg' },
            { id: 'BE', name: 'Berlin' },
            { id: 'BW', name: 'Baden-Württemberg' },
            { id: 'BY', name: 'Bayern' },
            { id: 'HB', name: 'Bremen' },
            { id: 'HE', name: 'Hessen' },
            { id: 'HH', name: 'Hamburg' },
            { id: 'MV', name: 'Mecklenburg-Vorpommern' },
            { id: 'NI', name: 'Niedersachsen' },
            { id: 'NW', name: 'Nordrhein-Westfalen' },
            { id: 'RP', name: 'Rheinland-Pfalz' },
            { id: 'SH', name: 'Schleswig-Holstein' },
            { id: 'SL', name: 'Saarland' },
            { id: 'SN', name: 'Sachsen' },
            { id: 'ST', name: 'Sachsen-Anhalt' },
            { id: 'TH', name: 'Thüringen' },
          ],
          defaultValue: 'NW',
        },
        {
          id: 'D_TRAFFIC_TYPE',
          name: 'Verkehrsart',
          position: 4,
          values: [
            { id: 'VERLINNAHINSG', name: 'Nahverkehr insgesamt' },
            { id: 'VERLINNAHEISB', name: 'Eisenbahn (Nah)' },
            { id: 'VERLINNAHSTB', name: 'Straßenbahn' },
            { id: 'VERLINNAHOBUS', name: 'Omnibus' },
          ],
          defaultValue: 'VERLINNAHINSG',
        },
      ],
    },
    presets: [
      {
        title: 'Corona-Einbruch: NRW Gesamtnahverkehr',
        description: 'Alle Verkehrsmittel zusammen – der Pandemieeinbruch 2020 und die langsame Erholung.',
        filters: { 'Frequenz': 'Vierteljährlich', 'Bundesland': 'Nordrhein-Westfalen', 'Verkehrsart': 'Nahverkehr insgesamt' },
        lazyFilters: { D_COUNTRY: 'DE', FREQUENCY: 'Q', D_UNIT: 'TSD', D_FEDERAL_STATES: 'NW', D_TRAFFIC_TYPE: 'VERLINNAHINSG' },
      },
      {
        title: 'Bayern: Bahn vs. Bus (Jährlich)',
        description: 'Eisenbahn und Omnibus im Vergleich – wer gewinnt Fahrgäste?',
        filters: { 'Frequenz': 'Jährlich', 'Bundesland': 'Bayern', 'Verkehrsart': 'Eisenbahn (Nah)' },
        lazyFilters: { D_COUNTRY: 'DE', FREQUENCY: 'A', D_UNIT: 'TSD', D_FEDERAL_STATES: 'BY', D_TRAFFIC_TYPE: 'VERLINNAHEISB' },
      },
    ],
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_ROUTES: {
    displayName: 'Streckenlänge Straße und Schiene',
    headline: 'Deutschlands Straßennetz wächst, während die Schiene stagniert.',
    lead: 'Dieser Datensatz erfasst, wie viele Kilometer Straßen, Schienen, Binnenwasserstraßen und Pipelines in Deutschland existieren – und wie sich diese Zahlen über die Jahre verändert haben. Wer verstehen will, ob Deutschland seine Verkehrsinfrastruktur wirklich in Richtung Schiene und weg vom Auto umbaut, findet hier die Grundlage.',
    trend: 'Die Daten zeigen, dass das Straßennetz in Deutschland über Jahrzehnte kontinuierlich ausgebaut wurde, während das Schienennetz seit den 1990er Jahren geschrumpft ist und sich seitdem kaum erholt hat. Diese Schere zwischen Straße und Schiene hat sich trotz politischer Bekenntnisse zur Verkehrswende nicht geschlossen.',
    context: 'Die Bundesregierung hat sich verpflichtet, den Schienenverkehr bis 2030 zu verdoppeln und den CO₂-Ausstoß im Verkehrssektor deutlich zu senken – doch der Verkehrssektor verfehlt seine Klimaziele seit Jahren als einziger Bereich konsequent. Ob die Infrastruktur diesen Wandel überhaupt trägt, lässt sich direkt an diesen Streckenlängen ablesen.',
    methodology: 'Gemessen wird die physische Länge der Verkehrsinfrastruktur in Kilometern, gegliedert nach Verkehrsträger und teils nach Straßenklasse oder Streckentyp. Der Datensatz bildet jedoch nur die Infrastruktur ab, nicht deren Auslastung oder Zustand – ob eine Strecke marode oder modern ist, geht daraus nicht hervor.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_TOTAL_PERFORMANCE_VEHICLE_TYPE: {
    displayName: 'Gesamtfahrleistung nach Fahrzeugart',
    headline: 'Über 700 Milliarden Fahrzeugkilometer pro Jahr – Pkw stellen drei Viertel davon.',
    lead: 'Dieser Datensatz zeigt, wie viele Kilometer alle Kraftfahrzeuge in Deutschland pro Jahr zurücklegen – aufgeschlüsselt nach Fahrzeugtyp, von Motorrädern bis zum Sattelzug. Wer verstehen will, ob der Verkehr wirklich klimafreundlicher wird, muss wissen, ob die Gesamtfahrleistung sinkt oder steigt – denn selbst sauberere Autos nützen wenig, wenn immer mehr gefahren wird.',
    trend: 'Die Gesamtfahrleistung auf deutschen Straßen ist über Jahrzehnte nahezu kontinuierlich gewachsen und liegt aktuell bei über 700 Milliarden Fahrzeugkilometern pro Jahr. Nach einem deutlichen Einbruch während der COVID-19-Pandemie 2020 erholten sich die Werte rasch und nähern sich wieder dem Vorkrisenniveau. PKW stellen dabei konstant den größten Anteil – rund drei Viertel aller gefahrenen Kilometer entfallen auf sie.',
    context: 'Deutschland hat sich verpflichtet, die Treibhausgasemissionen im Verkehrssektor bis 2030 auf 85 Millionen Tonnen CO₂-Äquivalente zu senken – ein Ziel, das der Sektor bislang verfehlt. Ob Elektromobilität, Tempolimit oder Ausbau des Schienenverkehrs tatsächlich wirken, lässt sich nur beurteilen, wenn die Gesamtfahrleistung als Bezugsgröße bekannt ist. Verkehrspolitische Entscheidungen auf Bundes- und Landesebene stützen sich direkt auf diese Zahlen.',
    methodology: 'Gemessen wird die jährliche Fahrleistung in Kilometer je Fahrzeugkategorie, erhoben vom Kraftfahrt-Bundesamt auf Basis von Zulassungsdaten und Hochrechnungen. Die Werte sind Schätzungen mit methodischen Unsicherheiten – insbesondere bei seltener genutzten Fahrzeugklassen können die tatsächlichen Kilometerleistungen abweichen.',
    status: 'draft',
    labelOverrides: {
      'PKW': 'Pkw',
      'LKW': 'Lkw',
      'BUS': 'Busse',
      'MZR': 'Motorräder',
      'Sonstige Kraftfahzeuge': 'Sonstige',
      'Gesamt': 'Gesamt',
    },
    defaultChartConfig: {
      type: 'stacked',
      defaultFilters: { 'D_UNIT': 'Milliarden Kilometer' },
      stackedSeries: [
        { label: 'Pkw',       color: '#6b7280' },
        { label: 'Lkw',       color: '#9ca3af' },
        { label: 'Busse',     color: '#3b82f6' },
        { label: 'Motorräder', color: '#f59e0b' },
        { label: 'Sonstige',  color: '#d1d5db' },
      ],
    },
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_TRAFFIC_AREA_BUNDESLAND: {
    displayName: 'Verkehrsfläche nach Bundesland',
    headline: 'Bundesland für Bundesland: Wo Deutschland am meisten Boden für Verkehr verbraucht.',
    lead: 'Dieser Datensatz erfasst, wie viel Fläche in jedem Bundesland tatsächlich für Straßen, Wege, Parkplätze und sonstige Verkehrsinfrastruktur genutzt wird. Wer wissen will, wo Deutschland seinen Boden versiegelt und wie sich das von Bundesland zu Bundesland unterscheidet, findet hier die Grundlage.',
    trend: 'Die Verkehrsflächen in Deutschland nehmen seit Jahrzehnten kontinuierlich zu – jedes neue Gewerbegebiet, jede Ortsumgehung, jeder Großparkplatz schlägt sich in diesen Zahlen nieder. Zwar verlangsamt sich das Wachstum leicht, doch eine Trendwende hin zur Flächenreduktion ist in keinem Bundesland erkennbar.',
    context: 'Die Bundesregierung hat sich verpflichtet, den täglichen Flächenverbrauch bis 2030 auf unter 30 Hektar zu senken – derzeit liegt er noch deutlich darüber. Verkehrsflächen sind dabei ein zentraler Treiber der Bodenversiegelung, die Grundwasserneubildung verhindert, Überschwemmungen verstärkt und Artenvielfalt zerstört. Raumordnung und Klimaanpassungspläne der Länder greifen direkt auf solche Daten zurück.',
    methodology: 'Gemessen wird die tatsächlich genutzte Verkehrsfläche je Bundesland laut amtlicher Flächenerhebung des Statistischen Bundesamts, aufgeschlüsselt nach Nutzungsarten und Stichtag. Die Daten bilden keine Qualität oder Auslastung der Flächen ab und erfassen auch keine temporär genutzten oder informellen Verkehrsflächen.',
    status: 'draft',
    lazyDimensions: {
      totalDimensions: 6,
      dimensions: [
        {
          id: 'D_UNIT',
          name: 'Einheit',
          position: 2,
          values: [
            { id: 'QKM', name: 'Quadratkilometer' },
            { id: 'HAT', name: 'Hektar pro Tag' },
            { id: 'PZ', name: 'Prozent' },
          ],
        },
        {
          id: 'D_TYPE',
          name: 'Datentyp',
          position: 3,
          values: [
            { id: 'JS', name: 'Jahressumme' },
            { id: 'DVJ', name: 'Differenz zum Vorjahr' },
            { id: 'AGF', name: 'Anteil an Gesamtfläche' },
          ],
        },
        {
          id: 'D_FEDERAL_STATES',
          name: 'Bundesland',
          position: 4,
          values: [
            { id: 'DE', name: 'Bundesrepublik Deutschland' },
            { id: 'BB', name: 'Brandenburg' },
            { id: 'BE', name: 'Berlin' },
            { id: 'BW', name: 'Baden-Württemberg' },
            { id: 'BY', name: 'Bayern' },
            { id: 'HB', name: 'Bremen' },
            { id: 'HE', name: 'Hessen' },
            { id: 'HH', name: 'Hamburg' },
            { id: 'MV', name: 'Mecklenburg-Vorpommern' },
            { id: 'NI', name: 'Niedersachsen' },
            { id: 'NW', name: 'Nordrhein-Westfalen' },
            { id: 'RP', name: 'Rheinland-Pfalz' },
            { id: 'SH', name: 'Schleswig-Holstein' },
            { id: 'SL', name: 'Saarland' },
            { id: 'SN', name: 'Sachsen' },
            { id: 'ST', name: 'Sachsen-Anhalt' },
            { id: 'TH', name: 'Thüringen' },
          ],
        },
        {
          id: 'D_TYPE_OF_USE',
          name: 'Nutzungsart',
          position: 5,
          values: [
            { id: 'T', name: 'Bodenfläche insgesamt' },
            { id: 'ADVN09-1', name: 'Siedlung' },
            { id: 'ADVN09-11', name: 'Wohnbaufläche' },
            { id: 'ADVN09-12', name: 'Industrie- und Gewerbefläche' },
            { id: 'ADVN09-121', name: 'Industrie und Gewerbe' },
            { id: 'ADVN09-16', name: 'Fläche gemischter Nutzung' },
            { id: 'ADVN09-17', name: 'Fläche besonderer funktionaler Prägung' },
            { id: 'ADVN09-18', name: 'Sport-, Freizeit- und Erholungsfläche' },
            { id: 'ADVN09-184', name: 'Grünanlage' },
            { id: 'ADVN09-19', name: 'Friedhof' },
            { id: 'ADVN09-2', name: 'Verkehr (gesamt)' },
            { id: 'ADVN09-21', name: 'Straßenverkehr' },
            { id: 'ADVN09-22', name: 'Weg' },
            { id: 'ADVN09-23', name: 'Platz' },
            { id: 'ADVN09-24', name: 'Bahnverkehr' },
            { id: 'ADVN09-25', name: 'Flugverkehr' },
            { id: 'ADVN09-26', name: 'Schiffsverkehr' },
            { id: 'ADVN09-3', name: 'Vegetation' },
            { id: 'ADVN09-31', name: 'Landwirtschaft' },
            { id: 'ADVN09-32', name: 'Wald' },
            { id: 'ADVN09-4', name: 'Gewässer' },
          ],
        },
      ],
    },
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_TRAFFIC_AREA_LONG_TIMESERIES: {
    displayName: 'Siedlungs- und Verkehrsfläche Deutschland',
    headline: 'Deutschlands Siedlungs- und Verkehrsfläche wächst seit drei Jahrzehnten ungebremst.',
    lead: 'Dieser Datensatz erfasst, wie viel Fläche in Deutschland für Siedlungen und Verkehr genutzt wird — für Gebäude, Gewerbe, Erholungsflächen sowie Straßen, Wege und Parkplätze. Gemessen in Quadratkilometern, jährlich seit 1992. Wer verstehen will, wie stark Siedlung und Verkehr die Landschaft verändern, findet hier eine der wenigen langfristigen Messreihen dazu.',
    trend: 'Seit 1992 steigt die Siedlungs- und Verkehrsfläche kontinuierlich an, ohne erkennbare Trendwende — auch in Jahren, in denen die Politik Flächensparziele ausgegeben hat. Allein zwischen 1992 und 2015 wuchs sie um rund 8.800 Quadratkilometer, also etwa das Zehnfache der Fläche Berlins. Den größten Anteil daran hat die Siedlungsfläche; die reine Verkehrsfläche wächst langsamer. Der tägliche Flächenverbrauch hat sich zwar von rund 95 auf etwa 45 Hektar pro Tag verlangsamt, liegt aber weiter klar über dem politischen Ziel.',
    context: 'Die Bundesregierung hat sich im Rahmen der Nachhaltigkeitsstrategie verpflichtet, den täglichen Flächenverbrauch auf unter 30 Hektar pro Tag zu senken — dieses Ziel gilt bis 2030. Siedlungs- und Verkehrsflächen sind dabei der zentrale Treiber, über den Entscheidungen zu Straßenneubauten, Siedlungsentwicklung und ÖPNV-Ausbau direkt entscheiden.',
    methodology: 'Gemessen wird die tatsächliche Nutzungsart der Fläche zum Stichtag 31. Dezember jeden Jahres, erhoben vom Statistischen Bundesamt. Die Kategorie Siedlungs- und Verkehrsfläche umfasst auch unversiegelte Bereiche wie Grünanlagen — sie ist daher kein direktes Maß für Bodenversiegelung. Die Grafik stapelt Siedlungs- und Verkehrsfläche (in km²) zur gesamten Siedlungs- und Verkehrsfläche; der Datensatz enthält außerdem die jährliche Veränderung in Hektar pro Tag und die Anteile an der Gesamtfläche.',
    status: 'draft',
    defaultChartConfig: {
      type: 'stacked',
      defaultFilters: { D_UNIT: 'Quadratkilometer', D_TYPE: 'Jahressumme' },
      stackedSeries: [
        { label: 'Siedlung', color: '#b45309' },
        { label: 'Verkehr', color: '#334155' },
      ],
    },
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_VEHICLE_STOCK_SEGMENT: {
    displayName: 'Pkw-Bestand nach Fahrzeugsegment',
    headline: 'SUVs verdrängen Kleinwagen – Deutschlands Autoflotte wird größer und schwerer.',
    lead: 'Dieser Datensatz zeigt, wie viele Pkw in Deutschland auf der Straße sind – aufgeschlüsselt nach Fahrzeugklassen wie Kleinwagen, Kompaktklasse oder SUV. Wer wissen will, ob die Deutschen tatsächlich umsteigen, findet hier die Antwort: nicht in Meinungsumfragen, sondern im tatsächlichen Fahrzeugbestand zum 1. Januar jeden Jahres.',
    trend: 'Der Bestand an SUVs und Geländewagen wächst seit Jahren kontinuierlich und macht inzwischen einen der größten Anteile am gesamten Pkw-Bestand aus, während klassische Kleinwagen anteilig schrumpfen. Gleichzeitig steigt die Gesamtzahl zugelassener Pkw weiter an, was bedeutet: Mehr Autos, im Schnitt größer und schwerer als noch vor zehn Jahren.',
    context: 'Deutschland hat sich verpflichtet, die CO₂-Emissionen im Verkehr bis 2030 gegenüber 1990 um 48 Prozent zu senken – doch schwerere Fahrzeuge verbrauchen mehr Energie, auch wenn sie elektrisch fahren. Verkehrsministerium und EU-Gesetzgeber stützen ihre Flottengrenzwerte und Kaufanreize auf genau diese Bestandsdaten, um zu prüfen, ob politische Maßnahmen die Fahrzeugstruktur tatsächlich verändern.',
    methodology: 'Gezählt werden alle in Deutschland zugelassenen Pkw der Kategorie M1 – einschließlich Sonderfahrzeuge wie Wohnmobile und Krankenwagen – klassifiziert nach Segmenten des Kraftfahrt-Bundesamts auf Basis visueller, technischer und marktorientierter Merkmale. Erfasst sind nur Fahrzeuge ab Erstzulassung 1990; ältere Bestände bleiben außen vor, was den Gesamtbestand leicht unterschätzt.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_TRANSPORT_VEHICLE_STOCK_TREND: {
    displayName: 'Pkw-Bestand nach Antriebsart',
    headline: '49 Millionen Autos – und davon sind nur 3 % elektrisch.',
    lead: 'Dieser Datensatz zeigt, wie sich der Fahrzeugbestand in Deutschland über die Jahre verändert — aufgeschlüsselt nach Antriebsart, von Benzinern bis zu Elektroautos. Wer wissen will, ob die Verkehrswende auf der Straße ankommt, findet hier die Antwort.',
    trend: 'Der Gesamtbestand hat sich auf rund 49 Millionen Pkw eingependelt. Elektroautos wuchsen rasant auf über 1,65 Millionen — aber gemessen an der Gesamtflotte machen sie gerade einmal 3 % aus. Diesel und Benziner dominieren weiterhin mit über 90 % des Bestands, was zeigt: Die Flottenwende ist gestartet, aber noch weit von einer Trendwende entfernt.',
    context: 'Die Bundesregierung hatte ursprünglich 15 Millionen Elektroautos bis 2030 als Ziel ausgegeben — gemessen daran bleibt der aktuelle Bestand weit hinter dem Kurs. Die Daten fließen direkt in klimapolitische Debatten ein: Förderprogramme, Ladesäulenausbau und CO₂-Flottengrenzwerte der EU hängen davon ab, wie schnell die Flotte tatsächlich umgebaut wird.',
    methodology: 'Gezählt werden alle zum 1. Januar des jeweiligen Jahres zugelassenen Kraftfahrzeuge in Deutschland, erhoben vom Kraftfahrt-Bundesamt auf Basis der nationalen Fahrzeugregister. Der Bestand erfasst zugelassene, nicht notwendigerweise aktiv genutzte Fahrzeuge — Fahrzeuge, die still gelegt oder kaum bewegt werden, gehen trotzdem in die Zahl ein.',
    status: 'draft',
  },

  DF_TRANSPORT_VEHICLE_STOCK_TREND_FUEL: {
    displayName: 'Pkw-Neuzulassungen nach Kraftstoffart',
    headline: 'Von 2.000 auf 1,65 Millionen: Deutschlands E-Auto-Bestand in 20 Jahren.',
    lead: 'Dieser Datensatz zählt jedes Jahr, wie viele Pkw und Lkw in Deutschland zugelassen sind – aufgeschlüsselt nach Antriebsart: Benzin, Diesel, Elektro, Hybrid und weitere. Er macht sichtbar, wie schnell sich die Flotte auf der Straße tatsächlich verändert.',
    trend: 'Zwischen 2021 und 2025 verfünffachte sich die Zahl der reinen Elektro-Pkw auf über 1,65 Millionen. Plug-in-Hybride legten im gleichen Zeitraum auf knapp 967.000 zu. Gemessen am Gesamtbestand von rund 49 Millionen Pkw machen Elektrofahrzeuge aber weiterhin nur etwa 3 % aus.',
    context: 'Die Bundesregierung hatte 15 Millionen Elektroautos bis 2030 als Ziel ausgegeben – bei aktuellem Tempo ist diese Marke kaum erreichbar. Gleichzeitig entscheidet diese Entwicklung darüber, ob Deutschland seine Klimaziele im Verkehrssektor einhält. Das EU-weite Verbrennerverbot ab 2035 erhöht den Druck weiter.',
    methodology: 'Gezählt wird der Fahrzeugbestand jeweils zum 1. Januar auf Basis der Zulassungsdaten des Kraftfahrt-Bundesamts. Erfasst sind zugelassene Fahrzeuge – ein stillgelegtes Elektroauto erscheint genauso wie ein Vielfahrer. Die Einheit ist Anzahl (Stück), nicht Millionen.',
    status: 'reviewed',
    labelOverrides: {
      // German API names → display labels
      'vollelektrische Antriebe (Strommix?)': 'Elektro (BEV)',
      'Plug-in-Hybrid  (PHEV)': 'Plug-in-Hybrid',
      'Hybride': 'Hybrid (ohne Stecker)',
      'Dieselkraftstoff': 'Diesel',
      'Alle Kraftstoffe (inkl. Strom)': 'Alle Antriebe',
      'Flüssige Kraftstoffe': 'Flüssigkraftstoffe',
      'reine Elektro- und Elektro-Hybrid-Antriebe': 'Elektro & Hybrid (gesamt)',
      'Gase (gasförmig/flüssig)': 'Gase (gesamt)',
      // English API names fallback (in case locale differs)
      'all-electric propulsion systems (electricity mix?)': 'Elektro (BEV)',
      'Plug-in-Hybrid (PHEV)': 'Plug-in-Hybrid',
      'Hybrids': 'Hybrid (ohne Stecker)',
      'Gasoline': 'Ottokraftstoff',
      'Diesel fuel': 'Diesel',
      'All fuel types': 'Alle Antriebe',
      'Liquified Petroleum Gas (LPG)': 'Autogas (LPG)',
      'Compressed Natural Gas (CNG)': 'Erdgas (CNG)',
      'Liquefied Natural Gas (LNG)': 'Flüssigerdgas (LNG)',
      'Other': 'Sonstige',
      'Liquid fuels': 'Flüssigkraftstoffe',
      'all-electric and electric-hybrid propulsion systems': 'Elektro & Hybrid (gesamt)',
      'Natural Gas': 'Erdgas',
      'Gases (gaseous, liquid)': 'Gase (gesamt)',
      'Other gases': 'Sonstige Gase',
      'Passenger car': 'PKW',
      'Trucks': 'LKW',
      'Total': 'Gesamt',
    },
    defaultChartConfig: {
      type: 'stacked',
      defaultFilters: { 'D_VEHICLE_TYPE': 'PKW' },
      stackedSeries: [
        { label: 'Diesel',                color: '#6b7280' },
        { label: 'Ottokraftstoff',        color: '#9ca3af' },
        { label: 'Sonstige',              color: '#d1d5db' },
        { label: 'Hybrid (ohne Stecker)', color: '#93c5fd' },
        { label: 'Plug-in-Hybrid',        color: '#3b82f6' },
        { label: 'Elektro (BEV)',         color: '#16a34a' },
      ],
    },
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_WASTE_HOUSEHOLDS_TYPE: {
    displayName: 'Haushaltsabfall nach Abfallart',
    headline: 'Deutsche Haushalte produzieren mehr Müll als je zuvor.',
    lead: 'Dieser Datensatz erfasst, wie viel Abfall private Haushalte in Deutschland pro Jahr erzeugen und an die öffentliche Müllabfuhr übergeben — von Biotonnen über Restmüll bis hin zu Verpackungen aus dem Grünen Punkt. Wer verstehen will, ob Recyclingkampagnen und Verpackungsgesetze tatsächlich wirken, findet hier die Grundlage.',
    trend: 'Die Abfallmengen aus Haushalten sind in Deutschland über die vergangenen Jahrzehnte trotz Recyclinginitiativen insgesamt gestiegen, angetrieben durch wachsenden Onlinehandel, mehr Verpackungen und veränderte Konsummuster. Kurzfristige Rückgänge in einzelnen Kategorien werden durch Zuwächse in anderen Bereichen regelmäßig ausgeglichen.',
    context: 'Die EU-Abfallrahmenrichtlinie verpflichtet Deutschland, bis 2035 mindestens 65 Prozent des Siedlungsabfalls zu recyceln — diese Zahlen zeigen, wie weit der Weg noch ist. Politikerinnen und Politiker nutzen die Daten, um Verpackungssteuer, Mehrwegangebote und kommunale Entsorgungskosten zu begründen oder zu überprüfen.',
    methodology: 'Gemessen wird ausschließlich der Abfall, den Haushalte aktiv an öffentliche Entsorgungsbetriebe übergeben — illegale Entsorgung, selbst kompostierte Mengen oder direkt an Händler zurückgegebene Verpackungen fließen nicht ein. Das Statistische Bundesamt erhebt die Daten über die kommunalen Zweckverbände, sodass Unterschiede in der lokalen Erfassungspraxis die Vergleichbarkeit zwischen Bundesländern einschränken können.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_WASTE_RECOVERY_RATE: {
    displayName: 'Recycling- und Verwertungsquoten',
    headline: 'Deutschland recycelt mehr Abfall – doch die Fortschritte verlangsamen sich.',
    lead: 'Dieser Datensatz zeigt, wie viel Abfall in Deutschland wiederverwertet wird – also nicht auf der Deponie landet, sondern als Material oder Energie zurück in den Kreislauf fließt. Wer wissen will, ob Deutschlands Mülltrennung wirklich etwas bewirkt, findet hier die Antwort.',
    trend: 'Die Recyclingquote ist über die vergangenen Jahrzehnte gestiegen, hat aber in den letzten Jahren ein Plateau erreicht. Leicht verwertbare Abfallströme wie Papier und Glas sind bereits gut erschlossen – Zuwächse kommen jetzt vor allem aus schwieriger zu trennenden Materialien wie Verbundwerkstoffen und Elektroschrott.',
    context: 'Die EU-Abfallrahmenrichtlinie schreibt vor, dass bis 2025 mindestens 55 Prozent der Siedlungsabfälle recycelt werden müssen – bis 2035 steigt die Vorgabe auf 65 Prozent. Verfehlte Quoten können Vertragsverletzungsverfahren auslösen und zwingen Bund wie Länder zu konkreten Entscheidungen über Sammelsysteme, Pfandpflichten und Verpackungsverbote.',
    methodology: 'Gemessen wird die Menge der in Deutschland erzeugten Abfälle nach Abfallart sowie der Anteil, der einer Verwertung – stofflich oder energetisch – zugeführt wird, basierend auf Meldedaten aller registrierten Entsorgungsanlagen. Die Zahlen beruhen auf einem Berechnungsmodell und erscheinen zweijährlich, was kurzfristige Entwicklungen verzögert sichtbar macht.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_WASTE_RE_T_RAW_MATERIAL_PROD: {
    displayName: 'Rohstoffproduktivität der deutschen Wirtschaft',
    headline: 'Deutschland produziert mehr Wirtschaftsleistung pro verbrauchter Tonne Rohstoff.',
    lead: 'Dieser Datensatz misst, wie viel Wirtschaftsleistung Deutschland aus jeder Tonne eingesetzter Rohstoffe herausholt – ob Erz, Holz oder importiertes Öl. Wer weniger Material für denselben Wohlstand braucht, schont Böden, Gewässer und Klima. Die Kennzahl zeigt, ob Wachstum und Ressourcenverbrauch tatsächlich entkoppelt werden.',
    trend: 'Seit 2010 steigt die Rohstoffproduktivität in Deutschland – die Wirtschaft wächst, während der Materialeinsatz langsamer zunimmt oder zeitweise sinkt. Der Index-Anstieg zeigt eine relative Entkopplung, keine absolute: Deutschland verbraucht insgesamt noch immer erhebliche Mengen an Primärrohstoffen. Ob dieser Trend stabil bleibt oder auf statistischen Verschiebungen durch mehr Importe beruht, ist politisch umstritten.',
    context: 'Die Europäische Union hat im Aktionsplan für die Kreislaufwirtschaft das Ziel verankert, den Ressourcenverbrauch drastisch zu senken. Deutschland nutzt diese Kennzahl als offiziellen Indikator der nationalen Nachhaltigkeitsstrategie (DNS) und muss gegenüber Brüssel regelmäßig Fortschritte belegen. Investitionsentscheidungen in Recyclinginfrastruktur, Rohstoffpolitik und Industriestandards hängen direkt davon ab, wie sich dieser Wert entwickelt.',
    methodology: 'Der Index setzt das Bruttoinlandsprodukt plus den Geldwert der Importe ins Verhältnis zur Gesamtmenge aller in Deutschland eingesetzten Primärrohstoffe in Tonnen – beides auf Basis des Jahres 2010. Eine zentrale Einschränkung: Rohstoffe, die im Ausland für deutsche Konsumgüter verbraucht werden, tauchen im Zähler als Importwert auf, belasten aber den Nenner nicht vollständig – das beschönigt die tatsächliche globale Materialbelastung.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_WASTE_VOLUME: {
    displayName: 'Gesamtabfallaufkommen nach Entsorgungsweg',
    headline: 'Deutschland produziert jährlich Millionen Tonnen Abfall – die Bilanz zeigt, wohin er fließt.',
    lead: 'Dieser Datensatz erfasst, wie viel Abfall in Deutschland entsteht, in welche Kategorien er fällt und ob er recycelt, verwertet oder entsorgt wird. Wer wissen will, ob Deutschlands Kreislaufwirtschaft funktioniert oder ob Müll nur verlagert wird, findet hier die Grundlage.',
    trend: 'Die Abfallmengen in Deutschland sind seit den 2000er Jahren nicht grundsätzlich gesunken – trotz wachsender Recyclingquoten. Zwar steigt der Anteil der verwerteten Abfälle, doch das Gesamtaufkommen bleibt auf hohem Niveau, was zeigt, dass Vermeidung hinter Verwertung zurückbleibt.',
    context: 'Die EU-Kreislaufwirtschaftsstrategie und das deutsche Kreislaufwirtschaftsgesetz schreiben konkrete Recyclingziele vor, etwa 65 Prozent Recyclingquote für Siedlungsabfälle bis 2035. Diese Daten liefern die Messbasis dafür, ob Deutschland diese Ziele erreicht oder verfehlt – und welche Branchen besonders viel Abfall produzieren.',
    methodology: 'Gemessen werden alle bei registrierten Entsorgungsanlagen eingehenden Abfallmengen, zusammengefasst nach dem europäischen Abfallkatalog und dem Bruttomengenprinzip ab 2006. Eine Einschränkung: Als Berechnungsmodell bildet die Abfallbilanz nicht jede illegale Entsorgung oder jeden informellen Stoffstrom ab.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_WASTE_VOLUMENS_PACKAGING: {
    displayName: 'Verpackungsabfall nach Material',
    headline: 'Deutschland verpackt mehr – der Müllberg aus Plastik, Papier und Glas wächst.',
    lead: 'Dieser Datensatz zeigt, wie viel Verpackungsmaterial in Deutschland Jahr für Jahr auf den Markt kommt – aufgeteilt nach Materialien wie Plastik, Glas, Papier und Metall. Wer wissen will, ob Recyclingpflichten und Mehrweginitiativen tatsächlich etwas bewirken, findet hier die Grundlage.',
    trend: 'Die Gesamtmenge an Verpackungen ist über die vergangenen Jahrzehnte nahezu kontinuierlich gestiegen, getrieben vor allem durch den Onlinehandel und den wachsenden Außer-Haus-Konsum. Kunststoffverpackungen verzeichnen dabei den stärksten Zuwachs, während schwere Materialien wie Glas relativ an Bedeutung verloren haben.',
    context: 'Das Verpackungsgesetz von 2019 verpflichtet Hersteller und Inverkehrbringer, sich an Rücknahme- und Recyclingsystemen zu beteiligen und schreibt konkrete Recyclingquoten vor. Parallel dazu fordert die EU-Verpackungsverordnung, die sich 2023 im Gesetzgebungsverfahren befand, eine absolute Reduktion der Verpackungsmengen – ein Ziel, das diese Daten direkt messbar machen.',
    methodology: 'Gemessen wird die Masse aller in Deutschland in Verkehr gebrachten Verpackungen in Tausend Tonnen, erhoben von der Gesellschaft für Verpackungsmarktforschung (GVM). Die Zahlen folgen den Definitionen des deutschen Verpackungsgesetzes und weichen geringfügig von EU-Statistiken ab, weil Verbundmaterialien unterschiedlich zugeordnet werden.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_WASTE_VOL_PACKAGING_DISPOSAL: {
    displayName: 'Verpackungsabfall nach Entsorgungsweg',
    headline: 'Onlinehandel und Takeaway treiben Deutschlands Verpackungsmüll in die Höhe.',
    lead: 'Dieser Datensatz erfasst, wie viel Verpackungsmüll in Deutschland jedes Jahr zur Entsorgung anfällt – von Plastikfolien über Glasflaschen bis hin zu Kartons. Wer wissen will, ob Recyclingversprechen der Industrie und Verordnungen des Gesetzgebers tatsächlich etwas bewirken, findet hier die Antwort in Zahlen.',
    trend: 'Die Gesamtmenge der entsorgten Verpackungen ist in den vergangenen Jahren trotz zwischenzeitlicher Rückgänge – etwa während der Corona-Pandemie – langfristig gestiegen. Besonders Onlinehandel und Takeaway-Kultur treiben die Mengen an Kunststoff- und Verbundverpackungen nach oben. Eine nachhaltige Trendwende ist bislang nicht erkennbar.',
    context: 'Die EU-Verpackungsverordnung schreibt konkrete Reduktions- und Recyclingziele vor, die Deutschland bis 2030 erreichen muss. Das Verpackungsgesetz von 2019 verpflichtet Hersteller zur Systembeteiligung und setzt finanzielle Anreize für recyclingfreundliches Design – ob das reicht, lässt sich an diesem Datensatz ablesen. Kommunen, Verbraucherschützer und Industrieverbände streiten darüber, wer die Kosten der wachsenden Verpackungsflut trägt.',
    methodology: 'Gemessen wird das Verpackungsvolumen, das in Deutschland jährlich zur Entsorgung gelangt, erhoben von der Gesellschaft für Verpackungsmarktforschung auf Basis der jeweils geltenden deutschen Rechtsdefinitionen. Da sich die gesetzlichen Definitionen über die Jahre geändert haben, sind Zeitreihevergleiche nur eingeschränkt möglich.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_WATER_GROUNDWATER: {
    displayName: 'Grundwasserqualität in Deutschland',
    headline: 'Deutschlands Grundwasser zeigt flächendeckend erhöhte Nitrat- und Schadstoffbelastung.',
    lead: 'Dieses Datensatz erfasst die chemische und mengenmäßige Qualität des Grundwassers an Hunderten Messstellen quer durch Deutschland – also das Wasser, das unter unseren Füßen liegt und aus dem ein Großteil des Trinkwassers gewonnen wird. Wer wissen will, ob das Wasser, das aus dem Hahn kommt, langfristig sauber bleibt, findet hier die Grundlage.',
    trend: 'Die Messdaten zeigen, dass in landwirtschaftlich intensiv genutzten Regionen die Nitratkonzentrationen im Grundwasser seit Jahrzehnten über den EU-Grenzwerten liegen und sich trotz politischer Gegenmaßnahmen nur langsam verbessern. In einigen Bundesländern sinken die Werte leicht, in anderen stagnieren sie auf hohem Niveau – von einer flächendeckenden Entlastung ist Deutschland weit entfernt.',
    context: 'Die EU-Wasserrahmenrichtlinie verpflichtet Deutschland dazu, bis 2027 einen guten chemischen und mengenmäßigen Zustand aller Grundwasserkörper zu erreichen – ein Ziel, das das Land nach aktuellem Stand verfehlen wird. Die Daten fließen direkt in Vertragsverletzungsverfahren der EU-Kommission gegen Deutschland ein und bestimmen, wie streng die Düngeverordnung künftig ausfällt.',
    methodology: 'Das Messnetz der Europäischen Umweltagentur (EEA) erfasst Grundwasserproben aus repräsentativ ausgewählten Messstellen, die nach Landnutzung und Bundeslandfläche gewichtet sind – es bildet also keinen vollständigen Flächenscan ab, sondern ein strukturiertes Stichprobennetz. Daten liefern die Bundesländer, was zu unterschiedlichen Messintervallen und Analysemethoden führen kann.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_WATER_PUB_EXTRAC: {
    displayName: 'Grundwasserentnahme für die öffentliche Versorgung',
    headline: 'Deutschland entnimmt weniger Grundwasser – doch regionale Engpässe verschärfen sich.',
    lead: 'Dieser Datensatz misst, wie viel Wasser deutsche Wasserversorger aus der Erde und aus Oberflächengewässern holen, wie viele Menschen daran angeschlossen sind und wie viel Liter pro Kopf täglich fließen. Wer verstehen will, ob Deutschlands Trinkwasserversorgung dem Klimawandel standhält, findet hier die Grundlage.',
    trend: 'Seit den 1990er Jahren sinkt die Wasserentnahme in Deutschland trotz wachsender Bevölkerung — ein Zeichen gestiegener Effizienz in Haushalten und Industrie. Allerdings zeigen jüngere Erhebungszyklen ab 2016, dass heiße Trockensommer den Verbrauch kurzfristig nach oben treiben und den langfristigen Rückgang bremsen.',
    context: 'Kommunen, Länder und der Bund stützen ihre Wasserrechtsplanung und Investitionsentscheidungen direkt auf diese Daten. Die EU-Wasserrahmenrichtlinie verpflichtet Deutschland, Grundwasserkörper in einem guten mengenmäßigen Zustand zu erhalten — ob das gelingt, lässt sich ohne diese Erhebung nicht beurteilen.',
    methodology: 'Das Statistische Bundesamt befragt alle drei Jahre öffentliche Wasserversorgungsunternehmen zu entnommenen Wassermengen, Anschlussquoten und Abgabemengen. Nicht erfasst wird die private Wassernutzung außerhalb des öffentlichen Netzes, etwa Eigenförderung in der Landwirtschaft.',
    status: 'draft',
  },

  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  DF_WATER_PUB_SUPPLY: {
    displayName: 'Öffentliche Wasserversorgung nach Wasserart',
    headline: 'Deutschlands Grundwasser trägt die öffentliche Wasserversorgung fast allein.',
    lead: 'Dieser Datensatz erfasst, wie viel Wasser deutsche Versorger aus Grundwasser, Quellen, Oberflächengewässern und Uferfiltrat entnehmen – und wie viele Menschen daran angeschlossen sind. Wer wissen will, woraus sein Leitungswasser stammt und wie verlässlich diese Quellen in trockenen Jahren noch sind, findet hier die Grundlage.',
    trend: 'Grundwasser dominiert die öffentliche Versorgung seit Jahren mit einem Anteil von deutlich über 60 Prozent, während Oberflächenwasser eine vergleichsweise kleine Rolle spielt. Anhaltende Trockenperioden seit 2018 haben den Druck auf Grundwasserspeicher spürbar erhöht, was sich in sinkenden Entnahmemengen einzelner Regionen niederschlägt.',
    context: 'Die EU-Wasserrahmenrichtlinie verpflichtet Deutschland dazu, Gewässer in einen guten ökologischen Zustand zu bringen – doch übermäßige Entnahmen gefährden dieses Ziel. Kommunen, Wasserversorger und Landesbehörden nutzen diese Daten, um Entnahmerechte zu vergeben, Engpässe frühzeitig zu erkennen und Investitionen in neue Infrastruktur zu planen.',
    methodology: 'Das Statistische Bundesamt erhebt die Daten alle drei Jahre bei öffentlichen Wasserversorgungsunternehmen – private Brunnen oder industrielle Eigenentnahmen bleiben außen vor. Weil die Erhebung nur im Dreijahresrhythmus stattfindet, lassen sich kurzfristige Schwankungen, etwa durch einzelne Dürrejahre, nicht direkt ablesen.',
    status: 'draft',
  },
}

/** Gibt den redaktionellen Inhalt für einen Flow zurück, oder null wenn keiner existiert. */
export function getDatasetContent(flowId: string): DatasetContent | null {
  return DATASET_CONTENT[flowId] ?? null
}
