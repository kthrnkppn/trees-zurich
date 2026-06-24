// Friendly, human descriptions per genus (keyed by latin name = baumgattunglat).
// Shown in the click popup. Genera without an entry simply show no blurb.
// `tags` are short trait chips. Keep descriptions to ~1 sentence.
export const genusInfo = {
  Acer: {
    desc: 'Vielgestaltige Familie mit den typischen Flügelfrüchten („Nasenzwicker") und oft leuchtender Herbstfärbung.',
    tags: ['Herbstfärbung', 'Schattenspender'],
  },
  Tilia: {
    desc: 'Klassischer Allee- und Dorfplatzbaum mit herzförmigen Blättern; die duftenden Sommerblüten sind ein Bienenmagnet.',
    tags: ['Duftblüte', 'Bienenweide', 'Schattenspender'],
  },
  Quercus: {
    desc: 'Mächtig und sehr langlebig; eine einzelne alte Eiche ernährt unzählige Insekten und Vögel.',
    tags: ['Langlebig', 'Wertvoll für Tiere', 'Schattenspender'],
  },
  Fraxinus: {
    desc: 'Schlanker, schnellwüchsiger Baum mit gefiederten Blättern, oft an Bächen und in Auen.',
    tags: ['Schnellwüchsig', 'Auenbaum'],
  },
  Platanus: {
    desc: 'Der robuste Stadtbaum schlechthin – grosse Blätter, breite Krone und die markante, abblätternde Rinde.',
    tags: ['Schattenspender', 'Stadtklima-fest', 'Markante Rinde'],
  },
  Prunus: {
    desc: 'Kirschen, Pflaumen & Co. – im Frühling oft in spektakulärer rosa-weisser Blütenpracht.',
    tags: ['Blütenpracht', 'Frühblüher', 'Bienenweide'],
  },
  Carpinus: {
    desc: 'Dichtes, ruhiges Laub, das sich im Herbst goldgelb färbt; ein klassischer Hecken- und Formbaum.',
    tags: ['Dichtes Laub', 'Herbstfärbung'],
  },
  Aesculus: {
    desc: 'Im Mai trägt sie grosse aufrechte Blütenkerzen; im Herbst fallen die glänzenden Kastanien.',
    tags: ['Blütenkerzen', 'Schattenspender'],
  },
  Fagus: {
    desc: 'Glatte silbergraue Rinde und ein dichtes Blätterdach; im Herbst leuchtend kupferbraun.',
    tags: ['Schattenspender', 'Herbstfärbung'],
  },
  Betula: {
    desc: 'Unverkennbar durch die weisse Rinde und das feine, lichte Laub; ein lichtdurchlässiger Pionierbaum.',
    tags: ['Markante Rinde', 'Lichtes Laub'],
  },
  Malus: {
    desc: 'Apfelbäume verzaubern im Frühling mit Blüten und tragen im Herbst Früchte – auch für Vögel.',
    tags: ['Blütenpracht', 'Früchte', 'Bienenweide'],
  },
  Pyrus: {
    desc: 'Birnbäume blühen im Frühling reinweiss und zeigen oft eine schöne Herbstfärbung.',
    tags: ['Blütenpracht', 'Früchte'],
  },
  Juglans: {
    desc: 'Breite, schattige Krone und aromatisch duftendes Laub; liefert die bekannten Walnüsse.',
    tags: ['Nüsse', 'Schattenspender'],
  },
  Salix: {
    desc: 'Weiden lieben Wasser, wachsen rasch und tragen früh im Jahr die flauschigen Kätzchen.',
    tags: ['Frühblüher', 'Bienenweide', 'Auenbaum'],
  },
  Populus: {
    desc: 'Hoch und sehr schnellwüchsig; das Laub raschelt schon bei leichtem Wind.',
    tags: ['Schnellwüchsig', 'Auenbaum'],
  },
  Pinus: {
    desc: 'Immergrüner Nadelbaum mit langen Nadelpaaren und oft malerisch geformter Krone.',
    tags: ['Immergrün', 'Nadelbaum'],
  },
  Picea: {
    desc: 'Der klassische immergrüne Nadelbaum mit hängenden Zapfen.',
    tags: ['Immergrün', 'Nadelbaum'],
  },
  Larix: {
    desc: 'Ungewöhnlicher Nadelbaum: Im Herbst färben sich die Nadeln goldgelb und fallen ab.',
    tags: ['Herbstfärbung', 'Nadelbaum'],
  },
  Ginkgo: {
    desc: 'Ein lebendes Fossil mit fächerförmigen Blättern, die im Herbst leuchtend goldgelb werden – extrem robust im Stadtklima.',
    tags: ['Besondere Blätter', 'Herbstfärbung', 'Stadtklima-fest'],
  },
  Magnolia: {
    desc: 'Öffnet im Frühling – oft noch vor dem Laub – grosse, spektakuläre Blüten.',
    tags: ['Blütenpracht', 'Frühblüher'],
  },
  Sorbus: {
    desc: 'Weisse Blütendolden, danach rote Beeren, die Vögel lieben; dazu eine kräftige Herbstfärbung.',
    tags: ['Vogelnährgehölz', 'Herbstfärbung', 'Blüte'],
  },
  Robinia: {
    desc: 'Trägt im Frühsommer duftende, weisse Blütentrauben und kommt mit kargen Stadtstandorten gut zurecht.',
    tags: ['Duftblüte', 'Bienenweide', 'Stadtklima-fest'],
  },
  Catalpa: {
    desc: 'Auffällig mit sehr grossen herzförmigen Blättern, weissen Blüten und langen, bohnenartigen Schoten.',
    tags: ['Grosse Blätter', 'Blüte', 'Schattenspender'],
  },
  Liquidambar: {
    desc: 'Der Amberbaum hat ahornähnliche Blätter und eine der spektakulärsten Herbstfärbungen überhaupt.',
    tags: ['Herbstfärbung', 'Stadtklima-fest'],
  },
  Liriodendron: {
    desc: 'Der Tulpenbaum trägt tulpenförmige Blüten und ungewöhnlich geschnittene Blätter, die im Herbst goldgelb leuchten.',
    tags: ['Besondere Blätter', 'Blüte', 'Herbstfärbung'],
  },
  Cercis: {
    desc: 'Der Judasbaum blüht im Frühling rosa – die Blüten sitzen direkt am Stamm und an den Ästen.',
    tags: ['Blütenpracht', 'Frühblüher', 'Besondere Blätter'],
  },
  Corylus: {
    desc: 'Die Hasel trägt früh im Jahr lange Kätzchen und später die bekannten Nüsse.',
    tags: ['Frühblüher', 'Nüsse'],
  },
  Cornus: {
    desc: 'Hartriegel überzeugen mit auffälligen Blüten, leuchtender Herbstfärbung und Beeren für Vögel.',
    tags: ['Blüte', 'Herbstfärbung', 'Vogelnährgehölz'],
  },
  Crataegus: {
    desc: 'Weissdorn ist klein, robust und ökologisch wertvoll: weisse Blüten, rote Früchte, dichter Schutz für Vögel.',
    tags: ['Blüte', 'Vogelnährgehölz', 'Bienenweide'],
  },
  Castanea: {
    desc: 'Die Edelkastanie liefert essbare Maronen und bildet eine breite, schattige Krone.',
    tags: ['Früchte', 'Schattenspender'],
  },
  Ulmus: {
    desc: 'Traditioneller Stadtbaum mit asymmetrischen, rauen Blättern und breit ausladender Krone.',
    tags: ['Schattenspender', 'Stadtbaum'],
  },
  Gleditsia: {
    desc: 'Feines, lichtes Fiederlaub, das im Herbst goldgelb wird; sehr verträglich für schwierige Strassenstandorte.',
    tags: ['Lichtes Laub', 'Stadtklima-fest', 'Herbstfärbung'],
  },
  Alnus: {
    desc: 'Die Erle liebt feuchte Böden und Gewässerränder und trägt früh im Jahr Kätzchen.',
    tags: ['Frühblüher', 'Auenbaum'],
  },
  Taxus: {
    desc: 'Immergrün, extrem langlebig und schnittverträglich; trägt rote Beeren (Achtung: giftig).',
    tags: ['Immergrün', 'Langlebig'],
  },
  Paulownia: {
    desc: 'Der Blauglockenbaum trägt im Frühling grosse violette Blütenrispen und riesige Blätter – und wächst rasant.',
    tags: ['Blütenpracht', 'Grosse Blätter', 'Schnellwüchsig'],
  },
  Sequoiadendron: {
    desc: 'Der Riesenmammutbaum gehört zu den grössten Bäumen der Welt und hat eine dicke, weiche, rotbraune Rinde.',
    tags: ['Riesenwuchs', 'Markante Rinde', 'Immergrün'],
  },
};
