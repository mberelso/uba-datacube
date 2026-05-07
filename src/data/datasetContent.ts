/**
 * Redaktionell gepflegte Inhalte für Datensätze.
 *
 * Workflow:
 *   1. `npm run generate-descriptions` erzeugt KI-Entwürfe und fügt sie hier ein (Status: "draft")
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

export interface DatasetContent {
  headline: string
  lead: string
  trend: string
  context: string
  methodology: string
  status: 'draft' | 'reviewed'
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
    headline: 'Die Emissionen sinken – aber nicht schnell genug für das Klimaziel.',
    lead: 'Deutschland erfasst jährlich alle Treibhausgase (CO₂, Methan, Lachgas und F-Gase) in CO₂-Äquivalenten. Diese Gesamtemissionsbilanz ist das zentrale Steuerungsinstrument der Klimapolitik – an ihr wird gemessen, ob Deutschland seinen Beitrag zum Pariser Abkommen erfüllt.",',
    trend: 'Seit 1990 sind die Emissionen um rund 40 % gesunken, vor allem durch den Rückgang der Kohleverstromung und effizientere Industrie. Der größte Rückgang in den letzten Jahren kam durch höhere Energiepreise und den Ausbau erneuerbarer Energien – nicht durch strukturelle Veränderungen in Verkehr oder Landwirtschaft.',
    context: 'Das Klimaschutzgesetz schreibt für 2030 eine Reduktion um 65 % gegenüber 1990 vor. Der aktuelle Trend reicht dafür nicht aus. Besonders Verkehr und Gebäude verfehlen ihre Sektorziele regelmäßig.',
    methodology: 'Die Bilanz folgt der UNFCCC-Methodik und schließt alle Kyoto-Protokoll-Gase ein. Landnutzungsänderungen (LULUCF) sind in diesem Datensatz nicht enthalten. Die Zahlen werden jährlich rückwirkend korrigiert, wenn neue Aktivitätsdaten vorliegen.',
    status: 'reviewed',
  },

  DF_ENERGY_AGEE_SHARE: {
    headline: 'Jede dritte Kilowattstunde kommt heute aus erneuerbaren Quellen.',
    lead: 'Der Anteil erneuerbarer Energien am Bruttoendenergieverbrauch zeigt, wie weit Deutschland bei der Energiewende ist – nicht nur im Stromsektor, sondern auch in Wärme und Verkehr zusammen.',
    trend: 'Der Anteil stieg von unter 5 % im Jahr 2000 auf über 20 % im Stromsektor. Im gesamten Energieverbrauch (inkl. Wärme und Verkehr) liegt er deutlich darunter, weil diese Sektoren langsamer dekarbonisieren.',
    context: 'Das EU-Ziel für 2030 liegt bei 42,5 % erneuerbare Energien am Gesamtverbrauch. Deutschland muss besonders in den Bereichen Wärme (Wärmepumpen, Fernwärme) und Verkehr (E-Mobilität, grüner Wasserstoff) deutlich zulegen.',
    methodology: 'Grundlage ist die Definition der EU-Erneuerbaren-Richtlinie (RED). Der Bruttoendenergieverbrauch umfasst Strom, Wärme und Verkehr. Nicht enthalten: Energieerzeugung für den Export.',
    status: 'draft',
  },

}

/** Gibt den redaktionellen Inhalt für einen Flow zurück, oder null wenn keiner existiert. */
export function getDatasetContent(flowId: string): DatasetContent | null {
  return DATASET_CONTENT[flowId] ?? null
}
