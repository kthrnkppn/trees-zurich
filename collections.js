// Kuratierte Themen-Sammlungen. Jede Sammlung gruppiert mehrere Gattungen unter
// einem Klick. Frei editierbar – Gattungen sind die lateinischen Namen aus dem
// Baumkataster (baumgattunglat), z. B. "Malus". `label` ist zweisprachig ({de,en}).
//
// Sonderfall "Seltene Raritäten": wird dynamisch aus den Daten berechnet
// (Arten, die stadtweit höchstens RARITY_MAX_COUNT-mal vorkommen).
//
// Sonderfall `yearUnknown`: statt einer Gattungsliste filtert diese Sammlung auf
// `pflanzjahr === null` (siehe matchesCollection() in main.js) – kein `genera`-Feld.

export const collections = [
  {
    id: 'obst',
    label: { de: 'Obstbäume', en: 'Fruit trees' },
    emoji: '🍎',
    genera: [
      'Malus', 'Pyrus', 'Prunus', 'Cydonia', 'Mespilus', 'Juglans',
      'Castanea', 'Ficus', 'Corylus', 'Diospyros', 'Morus', 'Asimina',
      'Ziziphus',
    ],
  },
  {
    id: 'nadel',
    label: { de: 'Nadelbäume', en: 'Conifers' },
    emoji: '🌲',
    genera: [
      'Abies', 'Araucaria', 'Calocedrus', 'Cedrus', 'Cephalotaxus',
      'Chamaecyparis', 'Cryptomeria', 'Cunninghamia', 'Cupressocyparis',
      'Cupressus', 'Juniperus', 'Larix', 'Metasequoia', 'Picea', 'Pinus',
      'Platycladus', 'Pseudotsuga', 'Sciadopitys', 'Sequoia', 'Sequoiadendron',
      'Taxodium', 'Taxus', 'Thuja', 'Thujopsis', 'Torreya', 'Tsuga',
    ],
  },
  {
    id: 'herbst',
    label: { de: 'Herbstfärbung', en: 'Autumn colour' },
    emoji: '🍂',
    genera: [
      'Acer', 'Carpinus', 'Fagus', 'Larix', 'Liquidambar', 'Parrotia',
      'Ginkgo', 'Cercidiphyllum', 'Quercus', 'Sorbus', 'Cornus', 'Nyssa',
      'Liriodendron', 'Cotinus',
    ],
  },
  {
    id: 'bluete',
    label: { de: 'Frühlingsblüher', en: 'Spring bloomers' },
    emoji: '🌸',
    genera: [
      'Prunus', 'Malus', 'Magnolia', 'Cercis', 'Aesculus', 'Cornus',
      'Crataegus', 'Pyrus', 'Davidia', 'Amelanchier', 'Laburnum',
    ],
  },
  {
    // Die stark allergenen, windbestäubten Pollenbäume – hilft Allergiker:innen,
    // betroffene Orte gezielt zu meiden. Nur die klinisch stärksten (Quellen:
    // aha!/pollenundallergie.ch, allvent.de): Birke (sehr stark), Erle, Hasel,
    // Esche (stark). Mittlere/schwache Gattungen und Kiefer bewusst weggelassen.
    id: 'allergie',
    label: { de: 'Allergiebäume', en: 'Allergy trees' },
    emoji: '🤧',
    genera: ['Betula', 'Alnus', 'Corylus', 'Fraxinus'],
  },
  {
    // Bäume ohne erfasstes Pflanzjahr (~8'400 Stadt-weit) – hilft der Stadt und
    // Anwohner:innen, gezielt Lücken im Archiv zu finden und zu schliessen.
    id: 'jahrUnbekannt',
    label: { de: 'Pflanzjahr unbekannt', en: 'Unknown planting year' },
    emoji: '❓',
    yearUnknown: true,
  },
];
