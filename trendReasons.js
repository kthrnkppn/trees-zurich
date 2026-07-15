// Kurze Begründungen, WARUM eine Gattung im Kommen oder auf dem Rückzug ist.
// Keyed by latin genus (baumgattunglat). Wird im "Zahlen & Trends"-Modal unter
// dem jeweiligen Trend angezeigt. Zweisprachig ({de,en}); Gattungen ohne Eintrag
// zeigen keine Begründung. Fachlich gestützt (Stadtklima, Baumkrankheiten,
// Neophyten).
export const trendReasons = {
  // --- Im Kommen ---
  Ulmus: {
    de: 'Comeback dank neuer, gegen das Ulmensterben resistenter Zuchtsorten – nachdem der Pilz die Ulmen im 20. Jh. fast ausgelöscht hatte.',
    en: 'A comeback thanks to new cultivars resistant to Dutch elm disease – after the fungus nearly wiped out elms in the 20th century.',
  },
  Quercus: {
    de: 'Hitze- und trockenheitstolerant und extrem wertvoll für Insekten – ein Klima-Zukunftsbaum.',
    en: 'Heat- and drought-tolerant and hugely valuable for insects – a tree for the climate of the future.',
  },
  Tilia: {
    de: 'Robuster Klassiker für Alleen und Plätze, dazu eine wichtige Bienenweide.',
    en: 'A tough classic for avenues and squares, and an important source of forage for bees.',
  },
  Prunus: {
    de: 'Kleinkronig, anspruchslos und im Frühling spektakulär – ideal für enge Strassenräume.',
    en: 'Small-crowned, undemanding and spectacular in spring – ideal for tight street spaces.',
  },
  Sorbus: {
    de: 'Kleinkronig, stadtklimafest und ein wertvolles Vogelnährgehölz.',
    en: 'Small-crowned, tough in the urban climate and a valuable food source for birds.',
  },
  Populus: {
    de: 'Schnellwüchsig und gefragt bei der Renaturierung von Gewässern und Auen.',
    en: 'Fast-growing and sought after for restoring watercourses and floodplains.',
  },
  Gleditsia: {
    de: 'Extrem stadtklimafest: trocken- und salztolerant, mit lichtem Laub – ein Paradebaum für heisse Strassen.',
    en: 'Extremely tough in the urban climate: drought- and salt-tolerant, with airy foliage – a showpiece for hot streets.',
  },
  Liquidambar: {
    de: 'Hitzetolerant und mit spektakulärer Herbstfärbung – ein gefragter neuer Strassenbaum.',
    en: 'Heat-tolerant and with spectacular autumn colour – a sought-after new street tree.',
  },
  Alnus: {
    de: 'Liebt feuchte Standorte – gefragt bei der Renaturierung von Bächen und Ufern.',
    en: 'Loves damp sites – in demand for restoring streams and banks.',
  },
  Magnolia: {
    de: 'Beliebter Zierbaum mit früher Blütenpracht in Parks und Vorgärten.',
    en: 'A popular ornamental with early, showy blossom in parks and front gardens.',
  },
  Acer: {
    de: 'Vielseitig und anpassungsfähig – bleibt der Allrounder unter Zürichs Strassenbäumen.',
    en: 'Versatile and adaptable – it remains the all-rounder among Zurich’s street trees.',
  },

  // --- Auf dem Rückzug ---
  Carpinus: {
    de: 'Lange der Standard-Stadtbaum – verliert Anteil, weil heute gezielt auf grössere Vielfalt und klimafittere Arten gesetzt wird.',
    en: 'Long the default city tree – losing share as planting now deliberately favours greater diversity and more climate-fit species.',
  },
  Picea: {
    de: 'Der grosse Klimaverlierer: flachwurzelnd und sehr trockenheitsempfindlich – in der heissen Stadt kaum noch gepflanzt.',
    en: 'The big climate loser: shallow-rooted and very drought-sensitive – barely planted any more in the hot city.',
  },
  Pinus: {
    de: 'Als Stadtbaum weniger gefragt; Anteil sinkt zugunsten standortgerechterer Laubbäume.',
    en: 'Less in demand as a city tree; its share is falling in favour of better-suited broadleaves.',
  },
  Platanus: {
    de: 'Früher DER Stadtbaum, heute zurückhaltender gepflanzt – anfällig für die Massaria-Pilzkrankheit.',
    en: 'Once THE city tree, now planted more sparingly – susceptible to Massaria fungal disease.',
  },
  Aesculus: {
    de: 'Stark geschwächt durch die Kastanienminiermotte (braunes Laub schon im Sommer) – kaum noch neu gepflanzt.',
    en: 'Badly weakened by the horse-chestnut leaf miner (brown foliage as early as summer) – rarely planted new.',
  },
  Fagus: {
    de: 'Sehr klimasensibel und leidet massiv unter den Trockensommern – als Stadtbaum riskant geworden.',
    en: 'Very climate-sensitive and suffering badly in the dry summers – it has become a risky choice as a city tree.',
  },
  Fraxinus: {
    de: 'Durch das Eschentriebsterben (ein eingeschleppter Pilz) stark dezimiert – Neupflanzungen lohnen kaum.',
    en: 'Heavily decimated by ash dieback (an introduced fungus) – new plantings hardly pay off.',
  },
  Chamaecyparis: {
    de: 'Koniferenhecken sind aus der Mode und ökologisch wenig wertvoll.',
    en: 'Conifer hedges are out of fashion and of little ecological value.',
  },
  Betula: {
    de: 'Leidet als Flachwurzler unter Trockenheit – verliert in der heisser werdenden Stadt an Boden.',
    en: 'As a shallow-rooter it suffers in drought – losing ground in the warming city.',
  },

  // --- Sonderfall (taucht je nach Zeitfenster auf) ---
  Ailanthus: {
    de: 'Gilt heute als invasiver Neophyt (Schweizer Schwarze Liste) – die Anpflanzung wird vermieden, so stadtklimafest er auch ist.',
    en: 'Now classed as an invasive neophyte (Swiss black list) – planting is avoided, tough in the urban climate though it is.',
  },
};
