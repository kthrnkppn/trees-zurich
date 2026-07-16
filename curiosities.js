// Kuratierte Liste exotischer / kurioser Bäume. Anders als die Schatzkarte
// (rein nach Seltenheit) geht es hier um den "Wow-Effekt" – unabhängig davon,
// wie viele es gibt. Ein Klick in der Liste springt direkt zur Gattung auf der
// Karte. `genus` ist der lateinische Gattungsname (baumgattunglat); das
// optionale `art` grenzt auf eine bestimmte Art ein, wenn die Gattung mehrere
// enthält. `label` ist zweisprachig ({de,en}); die Reihenfolge folgt der
// alphabetischen Sortierung nach deutschem Namen. `emoji` ist meist ein
// einzelnes Zeichen (passt in beiden Sprachen); wo der deutsche und der
// englische Name unterschiedliche Bildassoziationen wecken, ist es stattdessen
// {de,en} (z. B. Geweihbaum → 🦌 vs. Kentucky coffeetree → ☕).
export const curiosities = [
  { genus: 'Araucaria', label: { de: 'Affenschwanzbaum', en: 'Monkey puzzle' }, emoji: '🐒' },
  { genus: 'Poncirus', label: { de: 'Bitterorange', en: 'Trifoliate orange' }, emoji: '🍊' },
  { genus: 'Koelreuteria', label: { de: 'Blasenbaum', en: 'Golden rain tree' }, emoji: '🫧' },
  { genus: 'Paulownia', label: { de: 'Blauglockenbaum', en: 'Foxglove tree' }, emoji: '🔔' },
  { genus: 'Ziziphus', label: { de: 'Chinesische Jujube', en: 'Chinese jujube' }, emoji: '🏮' },
  { genus: 'Ficus', label: { de: 'Echte Feige', en: 'Common fig' }, emoji: '🍃' },
  { genus: 'Gymnocladus', label: { de: 'Geweihbaum', en: 'Kentucky coffeetree' }, emoji: { de: '🦌', en: '☕' } },
  { genus: 'Ginkgo', label: { de: 'Ginkgo', en: 'Ginkgo' }, emoji: '🪭' },
  { genus: 'Eucommia', label: { de: 'Guttaperchabaum', en: 'Hardy rubber tree' }, emoji: '🎈' },
  { genus: 'Asimina', label: { de: 'Indianerbanane', en: 'Pawpaw' }, emoji: { de: '🍌', en: '🐾' } },
  { genus: 'Diospyros', label: { de: 'Kaki / Dattelpflaume', en: 'Persimmon' }, emoji: '🟠' },
  { genus: 'Morus', label: { de: 'Maulbeerbaum', en: 'Mulberry' }, emoji: '🫐' },
  { genus: 'Maclura', label: { de: 'Milchorangenbaum', en: 'Osage orange' }, emoji: '🟢' },
  { genus: 'Olea', label: { de: 'Olive', en: 'Olive' }, emoji: '🫒' },
  { genus: 'Sequoiadendron', label: { de: 'Riesenmammutbaum', en: 'Giant sequoia' }, emoji: '🌲' },
  { genus: 'Albizia', label: { de: 'Seidenbaum', en: 'Silk tree' }, emoji: { de: '😴', en: '🧵' } },
  { genus: 'Zanthoxylum', art: 'piperitum', label: { de: 'Sichuanpfeffer', en: 'Sichuan pepper' }, emoji: '🌶️' },
  { genus: 'Davidia', label: { de: 'Taschentuchbaum', en: 'Dove tree' }, emoji: { de: '🤍', en: '🕊️' } },
  { genus: 'Zanthoxylum', art: 'simulans', label: { de: 'Täuschende Stachelesche', en: 'Flatspine prickly ash' }, emoji: '🦔' },
  { genus: 'Liriodendron', label: { de: 'Tulpenbaum', en: 'Tulip tree' }, emoji: '🌷' },
  { genus: 'Metasequoia', label: { de: 'Urweltmammutbaum', en: 'Dawn redwood' }, emoji: '🦕' },
];
