// Friendly, human descriptions per genus (keyed by latin name = baumgattunglat).
// Shown in the click popup. Genera without an entry simply show no blurb.
// `desc` is bilingual ({de,en}); `tags` are canonical German trait keys that
// render per language through tTag() in i18n.js. Keep descriptions to ~1 sentence.
export const genusInfo = {
  Acer: {
    desc: {
      de: 'Vielgestaltige Familie mit den typischen Flügelfrüchten („Nasenzwicker") und oft leuchtender Herbstfärbung.',
      en: 'A varied family with the familiar winged fruits and often brilliant autumn colour.',
    },
    tags: ['Herbstfärbung', 'Schattenspender'],
  },
  Tilia: {
    desc: {
      de: 'Klassischer Allee- und Dorfplatzbaum mit herzförmigen Blättern; die duftenden Sommerblüten sind ein Bienenmagnet.',
      en: 'A classic avenue and village-square tree with heart-shaped leaves; its fragrant summer blossom is a magnet for bees.',
    },
    tags: ['Duftblüte', 'Bienenweide', 'Schattenspender'],
  },
  Quercus: {
    desc: {
      de: 'Mächtig und sehr langlebig; eine einzelne alte Eiche ernährt unzählige Insekten und Vögel.',
      en: 'Mighty and very long-lived; a single old oak feeds countless insects and birds.',
    },
    tags: ['Langlebig', 'Wertvoll für Tiere', 'Schattenspender'],
  },
  Fraxinus: {
    desc: {
      de: 'Schlanker, schnellwüchsiger Baum mit gefiederten Blättern, oft an Bächen und in Auen.',
      en: 'A slender, fast-growing tree with pinnate leaves, often found along streams and floodplains.',
    },
    tags: ['Schnellwüchsig', 'Auenbaum'],
  },
  Platanus: {
    desc: {
      de: 'Der robuste Stadtbaum schlechthin – grosse Blätter, breite Krone und die markante, abblätternde Rinde.',
      en: 'The quintessential tough city tree – large leaves, a broad crown and that distinctive flaking bark.',
    },
    tags: ['Schattenspender', 'Stadtklima-fest', 'Markante Rinde'],
  },
  Prunus: {
    desc: {
      de: 'Kirschen, Pflaumen & Co. – im Frühling oft in spektakulärer rosa-weisser Blütenpracht.',
      en: 'Cherries, plums and kin – often a spectacular pink-and-white display in spring.',
    },
    tags: ['Blütenpracht', 'Frühblüher', 'Bienenweide'],
  },
  Carpinus: {
    desc: {
      de: 'Dichtes, ruhiges Laub, das sich im Herbst goldgelb färbt; ein klassischer Hecken- und Formbaum.',
      en: 'Dense, quiet foliage that turns golden in autumn; a classic hedge and topiary tree.',
    },
    tags: ['Dichtes Laub', 'Herbstfärbung'],
  },
  Aesculus: {
    desc: {
      de: 'Im Mai trägt sie grosse aufrechte Blütenkerzen; im Herbst fallen die glänzenden Kastanien.',
      en: 'In May it bears large upright flower candles; in autumn the glossy conkers drop.',
    },
    tags: ['Blütenkerzen', 'Schattenspender'],
  },
  Fagus: {
    desc: {
      de: 'Glatte silbergraue Rinde und ein dichtes Blätterdach; im Herbst leuchtend kupferbraun.',
      en: 'Smooth silver-grey bark and a dense leaf canopy; a glowing copper-brown in autumn.',
    },
    tags: ['Schattenspender', 'Herbstfärbung'],
  },
  Betula: {
    desc: {
      de: 'Unverkennbar durch die weisse Rinde und das feine, lichte Laub; ein lichtdurchlässiger Pionierbaum.',
      en: 'Unmistakable for its white bark and fine, airy foliage; a light-letting pioneer tree.',
    },
    tags: ['Markante Rinde', 'Lichtes Laub'],
  },
  Malus: {
    desc: {
      de: 'Apfelbäume verzaubern im Frühling mit Blüten und tragen im Herbst Früchte – auch für Vögel.',
      en: 'Apple trees enchant with spring blossom and bear fruit in autumn – for birds too.',
    },
    tags: ['Blütenpracht', 'Früchte', 'Bienenweide'],
  },
  Pyrus: {
    desc: {
      de: 'Birnbäume blühen im Frühling reinweiss und zeigen oft eine schöne Herbstfärbung.',
      en: 'Pear trees bloom pure white in spring and often show fine autumn colour.',
    },
    tags: ['Blütenpracht', 'Früchte'],
  },
  Juglans: {
    desc: {
      de: 'Breite, schattige Krone und aromatisch duftendes Laub; liefert die bekannten Walnüsse.',
      en: 'A broad, shady crown and aromatic foliage; the source of the familiar walnuts.',
    },
    tags: ['Nüsse', 'Schattenspender'],
  },
  Salix: {
    desc: {
      de: 'Weiden lieben Wasser, wachsen rasch und tragen früh im Jahr die flauschigen Kätzchen.',
      en: 'Willows love water, grow fast and bear their fluffy catkins early in the year.',
    },
    tags: ['Frühblüher', 'Bienenweide', 'Auenbaum'],
  },
  Populus: {
    desc: {
      de: 'Hoch und sehr schnellwüchsig; das Laub raschelt schon bei leichtem Wind.',
      en: 'Tall and very fast-growing; the foliage rustles at the slightest breeze.',
    },
    tags: ['Schnellwüchsig', 'Auenbaum'],
  },
  Pinus: {
    desc: {
      de: 'Immergrüner Nadelbaum mit langen Nadelpaaren und oft malerisch geformter Krone.',
      en: 'An evergreen conifer with long paired needles and an often picturesquely shaped crown.',
    },
    tags: ['Immergrün', 'Nadelbaum'],
  },
  Picea: {
    desc: {
      de: 'Der klassische immergrüne Nadelbaum mit hängenden Zapfen.',
      en: 'The classic evergreen conifer with hanging cones.',
    },
    tags: ['Immergrün', 'Nadelbaum'],
  },
  Larix: {
    desc: {
      de: 'Ungewöhnlicher Nadelbaum: Im Herbst färben sich die Nadeln goldgelb und fallen ab.',
      en: 'An unusual conifer: in autumn its needles turn golden and drop.',
    },
    tags: ['Herbstfärbung', 'Nadelbaum'],
  },
  Ginkgo: {
    desc: {
      de: 'Ein lebendes Fossil mit fächerförmigen Blättern, die im Herbst leuchtend goldgelb werden – extrem robust im Stadtklima.',
      en: 'A living fossil with fan-shaped leaves that turn bright gold in autumn – extremely tough in the urban climate.',
    },
    tags: ['Besondere Blätter', 'Herbstfärbung', 'Stadtklima-fest'],
  },
  Magnolia: {
    desc: {
      de: 'Öffnet im Frühling – oft noch vor dem Laub – grosse, spektakuläre Blüten.',
      en: 'Opens large, spectacular flowers in spring – often before the leaves appear.',
    },
    tags: ['Blütenpracht', 'Frühblüher'],
  },
  Sorbus: {
    desc: {
      de: 'Weisse Blütendolden, danach rote Beeren, die Vögel lieben; dazu eine kräftige Herbstfärbung.',
      en: 'White flower clusters, then red berries that birds love, plus strong autumn colour.',
    },
    tags: ['Vogelnährgehölz', 'Herbstfärbung', 'Blüte'],
  },
  Robinia: {
    desc: {
      de: 'Trägt im Frühsommer duftende, weisse Blütentrauben und kommt mit kargen Stadtstandorten gut zurecht.',
      en: 'Bears fragrant white flower clusters in early summer and copes well with harsh city sites.',
    },
    tags: ['Duftblüte', 'Bienenweide', 'Stadtklima-fest'],
  },
  Catalpa: {
    desc: {
      de: 'Auffällig mit sehr grossen herzförmigen Blättern, weissen Blüten und langen, bohnenartigen Schoten.',
      en: 'Striking, with very large heart-shaped leaves, white flowers and long, bean-like pods.',
    },
    tags: ['Grosse Blätter', 'Blüte', 'Schattenspender'],
  },
  Liquidambar: {
    desc: {
      de: 'Der Amberbaum hat ahornähnliche Blätter und eine der spektakulärsten Herbstfärbungen überhaupt.',
      en: 'The sweetgum has maple-like leaves and one of the most spectacular autumn displays of all.',
    },
    tags: ['Herbstfärbung', 'Besondere Blätter'],
  },
  Liriodendron: {
    desc: {
      de: 'Der Tulpenbaum trägt tulpenförmige Blüten und ungewöhnlich geschnittene Blätter, die im Herbst goldgelb leuchten.',
      en: 'The tulip tree bears tulip-shaped flowers and oddly cut leaves that glow golden in autumn.',
    },
    tags: ['Besondere Blätter', 'Blüte', 'Herbstfärbung'],
  },
  Cercis: {
    desc: {
      de: 'Der Judasbaum blüht im Frühling rosa – die Blüten sitzen direkt am Stamm und an den Ästen.',
      en: 'The redbud blooms pink in spring – the flowers sit directly on the trunk and branches.',
    },
    tags: ['Blütenpracht', 'Frühblüher', 'Besondere Blätter'],
  },
  Corylus: {
    desc: {
      de: 'Die Hasel trägt früh im Jahr lange Kätzchen und später die bekannten Nüsse.',
      en: 'The hazel bears long catkins early in the year and later the familiar nuts.',
    },
    tags: ['Frühblüher', 'Nüsse'],
  },
  Cornus: {
    desc: {
      de: 'Hartriegel überzeugen mit auffälligen Blüten, leuchtender Herbstfärbung und Beeren für Vögel.',
      en: 'Dogwoods win you over with showy flowers, bright autumn colour and berries for birds.',
    },
    tags: ['Blüte', 'Herbstfärbung', 'Vogelnährgehölz'],
  },
  Crataegus: {
    desc: {
      de: 'Weissdorn ist klein, robust und ökologisch wertvoll: weisse Blüten, rote Früchte, dichter Schutz für Vögel.',
      en: 'Hawthorn is small, tough and ecologically valuable: white flowers, red fruit and dense cover for birds.',
    },
    tags: ['Blüte', 'Vogelnährgehölz', 'Bienenweide'],
  },
  Castanea: {
    desc: {
      de: 'Die Edelkastanie liefert essbare Maronen und bildet eine breite, schattige Krone.',
      en: 'The sweet chestnut yields edible nuts and forms a broad, shady crown.',
    },
    tags: ['Früchte', 'Schattenspender'],
  },
  Ulmus: {
    desc: {
      de: 'Traditioneller Stadtbaum mit asymmetrischen, rauen Blättern und breit ausladender Krone.',
      en: 'A traditional city tree with asymmetric, rough leaves and a broad, spreading crown.',
    },
    tags: ['Schattenspender', 'Stadtklima-fest'],
  },
  Gleditsia: {
    desc: {
      de: 'Feines, lichtes Fiederlaub, das im Herbst goldgelb wird; sehr verträglich für schwierige Strassenstandorte.',
      en: 'Fine, airy pinnate foliage that turns golden in autumn; very tolerant of difficult street sites.',
    },
    tags: ['Lichtes Laub', 'Stadtklima-fest', 'Herbstfärbung'],
  },
  Alnus: {
    desc: {
      de: 'Die Erle liebt feuchte Böden und Gewässerränder und trägt früh im Jahr Kätzchen.',
      en: 'The alder loves wet soils and watersides and bears catkins early in the year.',
    },
    tags: ['Frühblüher', 'Auenbaum'],
  },
  Taxus: {
    desc: {
      de: 'Immergrün, extrem langlebig und schnittverträglich; trägt rote Beeren (Achtung: giftig).',
      en: 'Evergreen, extremely long-lived and easy to prune; bears red berries (caution: poisonous).',
    },
    tags: ['Immergrün', 'Langlebig'],
  },
  Paulownia: {
    desc: {
      de: 'Der Blauglockenbaum trägt im Frühling grosse violette Blütenrispen und riesige Blätter – und wächst rasant.',
      en: 'The foxglove tree bears large violet flower panicles and huge leaves in spring – and grows at a rapid pace.',
    },
    tags: ['Blütenpracht', 'Grosse Blätter', 'Schnellwüchsig'],
  },
  Sequoiadendron: {
    desc: {
      de: 'Der Riesenmammutbaum gehört zu den grössten Bäumen der Welt und hat eine dicke, weiche, rotbraune Rinde.',
      en: 'The giant sequoia is among the largest trees in the world, with thick, soft, red-brown bark.',
    },
    tags: ['Riesenwuchs', 'Markante Rinde', 'Immergrün'],
  },

  // --- Exoten aus der Kuriositäten-Liste ---
  Olea: {
    desc: {
      de: 'Immergrüner Mittelmeerbaum mit silbrig schimmernden Blättern und den bekannten Oliven – liebt Wärme und geschützte Standorte.',
      en: 'An evergreen Mediterranean tree with shimmering silvery leaves and the familiar olives – it loves warmth and sheltered spots.',
    },
    tags: ['Immergrün', 'Früchte'],
  },
  Ficus: {
    desc: {
      de: 'Eine der ältesten Kulturpflanzen mit grossen, handförmigen Blättern und süssen Feigen; nach römischer Gründungssage säugte die Wölfin Romulus und Remus unter einem Feigenbaum.',
      en: 'One of the oldest cultivated plants, with large, hand-shaped leaves and sweet figs; in the Roman founding legend the she-wolf suckled Romulus and Remus under a fig tree.',
    },
    tags: ['Früchte', 'Grosse Blätter'],
  },
  Diospyros: {
    desc: {
      de: 'Trägt im Herbst leuchtend orange Früchte (Kaki), die oft bis in den Winter an den kahlen Ästen hängen.',
      en: 'Bears bright orange fruit (persimmon) in autumn that often hangs on the bare branches into winter.',
    },
    tags: ['Früchte', 'Herbstfärbung'],
  },
  Morus: {
    desc: {
      de: 'Süsse, brombeerähnliche Früchte für Mensch und Vogel; die Blätter sind das klassische Futter der Seidenraupe.',
      en: 'Sweet, blackberry-like fruit for people and birds; its leaves are the classic food of the silkworm.',
    },
    tags: ['Früchte', 'Vogelnährgehölz', 'Schattenspender'],
  },
  Asimina: {
    desc: {
      de: 'Trägt die grössten essbaren Früchte Nordamerikas – cremig und exotisch nach Banane und Mango; dazu grosse, tropisch wirkende Blätter.',
      en: 'Bears the largest edible fruit native to North America – creamy and exotic, tasting of banana and mango – plus large, tropical-looking leaves.',
    },
    tags: ['Früchte', 'Grosse Blätter'],
  },
  Ziziphus: {
    desc: {
      de: 'Die roten, dattelähnlichen Früchte („Chinesische Dattel") sind ein Klassiker der chinesischen Küche und Medizin; der Baum ist wärmeliebend und trockenheitshart.',
      en: 'The red, date-like fruit ("Chinese date") is a staple of Chinese cuisine and medicine; the tree loves warmth and shrugs off drought.',
    },
    tags: ['Früchte', 'Stadtklima-fest'],
  },
  Poncirus: {
    desc: {
      de: 'Die winterharte „Dreiblättrige Orange" mit duftenden weissen Blüten und kleinen, ungeniessbar bitteren Früchten – nicht zu verwechseln mit der Pomeranze, die in Aperol und Marmelade steckt.',
      en: 'The hardy "trifoliate orange" with fragrant white flowers and small, inedibly bitter fruit – not to be confused with the bitter orange behind Aperol and marmalade.',
    },
    tags: ['Duftblüte', 'Früchte'],
  },
  Zanthoxylum: {
    desc: {
      de: 'Aus den Fruchtschalen mancher Arten gewinnt man den prickelnden Sichuanpfeffer; das Laub duftet aromatisch, die Zweige tragen Stacheln.',
      en: 'The fruit husks of some species yield tingly Sichuan pepper; the foliage is aromatic and the twigs carry prickles.',
    },
    tags: ['Früchte', 'Besondere Blätter'],
  },
  Albizia: {
    desc: {
      de: 'Im Sommer rosa, federartige „Seiden"-Blüten; nachts klappt der „Schlafbaum" seine feinen Fiederblätter zusammen.',
      en: 'Pink, feathery "silk" flowers in summer; at night this "sleeping tree" folds its fine pinnate leaves together.',
    },
    tags: ['Blütenpracht', 'Besondere Blätter', 'Bienenweide'],
  },
  Davidia: {
    desc: {
      de: 'Im Mai hängen grosse weisse Hochblätter wie Taschentücher an den Zweigen – ein spektakulärer Anblick.',
      en: 'In May large white bracts hang from the branches like handkerchiefs – a spectacular sight.',
    },
    tags: ['Blütenpracht', 'Besondere Blätter'],
  },
  Eucommia: {
    desc: {
      de: 'Der einzige winterharte Kautschukbaum – reisst man ein Blatt, hängen feine Gummifäden daran; ausgesprochen robust.',
      en: 'The only hardy rubber-producing tree – tear a leaf and fine rubber threads stretch across the gap; remarkably tough.',
    },
    tags: ['Besondere Blätter', 'Stadtklima-fest'],
  },
  Gymnocladus: {
    desc: {
      de: 'Im Winter geweihartig grobe Verzweigung, im Sommer riesige doppelt gefiederte Blätter; kommt mit schwierigen Stadtstandorten gut zurecht.',
      en: 'Antler-like coarse branching in winter, huge doubly pinnate leaves in summer; copes well with difficult city sites.',
    },
    tags: ['Grosse Blätter', 'Stadtklima-fest'],
  },
  Maclura: {
    desc: {
      de: 'Trägt grosse, gehirnartig gerunzelte grüne Scheinfrüchte; extrem hartes Holz und dornige Zweige machen ihn unverwüstlich.',
      en: 'Bears large, brain-like wrinkled green fruit; extremely hard wood and thorny twigs make it indestructible.',
    },
    tags: ['Früchte', 'Stadtklima-fest'],
  },
  Koelreuteria: {
    desc: {
      de: 'Gelbe Blütenrispen im Hochsommer, danach lampionartig aufgeblasene Fruchtkapseln; hitze- und trockenheitsverträglich.',
      en: 'Yellow flower panicles in high summer, then lantern-like inflated seed capsules; tolerant of heat and drought.',
    },
    tags: ['Blüte', 'Stadtklima-fest', 'Herbstfärbung'],
  },
  Araucaria: {
    desc: {
      de: 'Ein lebendes Fossil aus den Anden: immergrüne, messerscharfe Schuppenzweige an gleichmässig gewundenen Ästen.',
      en: 'A living fossil from the Andes: evergreen, razor-sharp scaled shoots on evenly whorled branches.',
    },
    tags: ['Immergrün', 'Besondere Blätter', 'Langlebig'],
  },
  Metasequoia: {
    desc: {
      de: 'Ein lebendes Fossil – galt nur aus Versteinerungen bekannt als ausgestorben, bis 1940 lebende Bäume in China entdeckt wurden; laubabwerfender Nadelbaum mit kupferroter Herbstfärbung.',
      en: 'A living fossil – known only from fossils and thought extinct until living trees were found in China around 1940; a deciduous conifer with copper-red autumn colour.',
    },
    tags: ['Herbstfärbung', 'Nadelbaum', 'Schnellwüchsig'],
  },
};
