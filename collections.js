// Kuratierte Themen-Sammlungen. Jede Sammlung gruppiert mehrere Gattungen unter
// einem Klick. Frei editierbar – Gattungen sind die lateinischen Namen aus dem
// Baumkataster (baumgattunglat), z. B. "Malus".
//
// Sonderfall "Seltene Raritäten": wird dynamisch aus den Daten berechnet
// (Arten, die stadtweit höchstens RARITY_MAX_COUNT-mal vorkommen).

export const collections = [
  {
    id: 'obst',
    label: 'Obstbäume',
    emoji: '🍎',
    genera: [
      'Malus', 'Pyrus', 'Prunus', 'Cydonia', 'Mespilus', 'Juglans',
      'Castanea', 'Ficus', 'Corylus', 'Diospyros', 'Morus', 'Asimina',
      'Ziziphus',
    ],
  },
  {
    id: 'nadel',
    label: 'Nadelbäume',
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
    label: 'Herbstfärbung',
    emoji: '🍂',
    genera: [
      'Acer', 'Carpinus', 'Fagus', 'Larix', 'Liquidambar', 'Parrotia',
      'Ginkgo', 'Cercidiphyllum', 'Quercus', 'Sorbus', 'Cornus', 'Nyssa',
      'Liriodendron', 'Cotinus',
    ],
  },
  {
    id: 'bluete',
    label: 'Frühlingsblüher',
    emoji: '🌸',
    genera: [
      'Prunus', 'Malus', 'Magnolia', 'Cercis', 'Aesculus', 'Cornus',
      'Crataegus', 'Pyrus', 'Davidia', 'Amelanchier', 'Laburnum',
    ],
  },
];
