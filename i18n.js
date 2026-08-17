// Lightweight, dependency-free i18n for the static app. German is the default;
// English is offered because Zurich has a large expat population. Language is
// resolved once at load (localStorage override, else the browser preference) and
// the whole page is re-rendered on switch via a reload — simplest for a static,
// framework-free app. Curated content (yearEvents, genusInfo, trendReasons,
// collections, curiosities) carries its own {de,en} translations; this module
// holds the UI strings plus a few shared helpers (number format, genus names,
// the trait-tag dictionary, the Wikipedia language).

import { GenusDeNames } from './GenusDeNames.js';
import { GenusEnNames } from './GenusEnNames.js';

const STORAGE_KEY = 'lang';

function resolveLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'de' || saved === 'en') return saved;
  } catch (e) {
    /* private mode / storage blocked — fall through to browser preference */
  }
  const nav = (navigator.language || 'de').toLowerCase();
  return nav.startsWith('en') ? 'en' : 'de';
}

// The active language for this page load. Imported directly by other modules.
export const lang = resolveLang();

// Persist the choice and reload so every rendered string picks up the new
// language. No-op if the language is unchanged.
export function setLang(next) {
  if (next !== 'de' && next !== 'en' || next === lang) return;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch (e) {
    /* ignore — a reload with the old language is the graceful fallback */
  }
  location.reload();
}

// Locale-aware number formatting: Swiss apostrophe grouping for German,
// standard comma grouping for English.
export const numberFormat = new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'de-CH');

// Wikipedia language edition to link to.
export const wikiLang = lang === 'en' ? 'en' : 'de';

// Picks the active language out of a bilingual {de,en} content object (used
// throughout the curated content files — yearEvents, genusInfo, trendReasons,
// collections, curiosities), falling back to German, then to an empty string
// if the object itself is missing (e.g. `localized(info?.desc)`).
export function localized(obj) {
  return obj?.[lang] ?? obj?.de ?? '';
}

// Curated genus name in the active language, falling back to the Latin genus.
export function genusName(genus) {
  const map = lang === 'en' ? GenusEnNames : GenusDeNames;
  return map[genus] || genus;
}

// Trait chips shown in the popup. Keys are the canonical German tags stored in
// genusInfo.js; English renders through this dictionary. An unknown tag is
// returned unchanged so nothing silently disappears.
const TAGS = {
  Herbstfärbung: 'Autumn colour',
  Schattenspender: 'Shade tree',
  Duftblüte: 'Fragrant blossom',
  Bienenweide: 'Bee forage',
  Langlebig: 'Long-lived',
  'Wertvoll für Tiere': 'Valuable for wildlife',
  Schnellwüchsig: 'Fast-growing',
  Auenbaum: 'Floodplain tree',
  'Stadtklima-fest': 'Urban-climate tough',
  'Markante Rinde': 'Striking bark',
  Blütenpracht: 'Showy blossom',
  Frühblüher: 'Early bloomer',
  'Dichtes Laub': 'Dense foliage',
  Blütenkerzen: 'Flower candles',
  'Lichtes Laub': 'Light foliage',
  Früchte: 'Fruit',
  Nüsse: 'Nuts',
  Immergrün: 'Evergreen',
  Nadelbaum: 'Conifer',
  'Besondere Blätter': 'Distinctive leaves',
  Vogelnährgehölz: 'Bird food source',
  Blüte: 'Blossom',
  'Grosse Blätter': 'Large leaves',
  Riesenwuchs: 'Giant growth',
};
export function tTag(tag) {
  if (lang === 'de') return tag;
  return TAGS[tag] || tag;
}

// UI strings. `{placeholder}` tokens are filled by t(key, params).
const strings = {
  de: {
    'meta.title': 'Zürcher Baumkarte – alle Stadtbäume interaktiv erkunden',
    'nav.filter': 'Filter',
    'app.title': 'Zürcher Baumkarte',
    'app.subtitle':
      'Alle von der Stadt Zürich erfassten Bäume – filterbar nach Gattung, Art und Pflanzjahr.',
    'intro.help': 'Wie funktioniert diese Karte?',
    'intro.title': 'Willkommen auf der Zürcher Baumkarte',
    'intro.lead':
      'Hier findest du alle von der Stadt Zürich erfassten Bäume – so kannst du loslegen:',
    'intro.point1':
      'Filtern nach Gattung, Art oder Pflanzjahr – oder direkt einen Baum suchen.',
    'intro.point2':
      'Sammlungen & Raritäten antippen, um Themen wie Obstbäume oder Allergiebäume zu erkunden.',
    'intro.point3':
      'Auf einen Baum auf der Karte tippen für Alter, Beschreibung und den Wikipedia-Link.',
    'intro.cta': 'Los geht’s',
    'facts.open': 'Wussten Sie schon …?',
    'filter.heading': 'Filter',
    'filter.searchLabel': 'Baum suchen',
    'filter.searchPlaceholder': 'z.B. Eiche, Olive, Acer …',
    'filter.genus': 'Baumgattung',
    'filter.allGenera': 'Alle Gattungen',
    'filter.species': 'Baumart',
    'filter.allSpecies': 'Alle Arten',
    'filter.year': 'Pflanzjahr',
    'filter.yearFrom': 'Pflanzjahr von',
    'filter.yearTo': 'Pflanzjahr bis',
    'filter.yearUnknown': 'Nur Bäume mit unbekanntem Pflanzjahr',
    'filter.apply': 'Filtern',
    'filter.reset': 'Zurücksetzen',
    'collections.heading': 'Sammlungen',
    'rarities.heading': 'Raritäten & Kuriositäten',
    'rarities.genbank': 'Lebende Genbank – alte Obstsorten',
    'rarities.loner': 'Einzelgänger – je nur 1× in Zürich',
    'curiosities.summary': 'Kuriositäten – exotische Bäume',
    'curiosities.hint': 'Tippe einen Baum an – die Karte bringt dich direkt hin.',
    'legend.heading': 'Baumgattungen',
    'legend.hint': 'Tippe eine Gattung an, um nur sie zu zeigen.',
    'legend.hintCollection': 'Gattungen dieser Sammlung – tippe eine an, um nur sie zu zeigen.',
    'legend.other': 'Andere',
    'legend.onlyShow': 'Nur {name} anzeigen',
    'legend.clear': 'Auswahl aufheben',
    'footer.source': 'Datenquelle: Stadt Zürich (Baumkataster)',
    'footer.dataDate': ' · Datenstand: {date}',
    'footer.nextUpdate': 'Nächste Prüfung der Daten am {date}',
    'map.aria': 'Interaktive Karte der Bäume in Zürich',
    'geo.placeholder': 'Ort suchen',
    'map.attribution':
      'Baumdaten: <a href="https://data.stadt-zuerich.ch/dataset/geo_baumkataster" target="_blank" rel="noopener">Stadt Zürich (Baumkataster)</a>',
    'search.genus': 'Gattung',
    'search.species': 'Art',
    'count.filtered': '{n} von {total} Bäumen',
    'count.total': '{total} Bäume',
    'count.genbank': '{n} alte Obstsorten – lebende Genbank',
    'count.loner': '{n} Einzelgänger – je nur 1× in Zürich',
    'new.one': '1 neuer Baum seit dem letzten Update',
    'new.many': '{n} neue Bäume seit dem letzten Update',
    'gone.one': '{n} verschwundener Baum {year}',
    'gone.many': '{n} verschwundene Bäume {year}',
    'gone.teaser': 'Verschwundene Bäume {year}',
    'gone.teaserTitle': 'Verfügbar ab Dezember {year}',
    'gone.note':
      'Hinweis: Die Bilanz {year} ist unvollständig – Verluste werden erst seit Mitte 2026 erfasst.',
    'stats.loading': 'Daten werden noch geladen …',
    'stats.close': 'Schliessen',
    // popup (helpers.js)
    'popup.unknown': 'Unbekannter Baum',
    'popup.planted': 'Gepflanzt {year}',
    'popup.age': 'ca. {age} Jahre alt',
    'popup.yearUnknown': 'Pflanzjahr unbekannt',
    'popup.gone': '† Verschwunden {year}',
    'popup.eventLabel': 'Gepflanzt {year} – damals in der Welt',
    'popup.eventMore': 'Mehr aus {year} →',
    'popup.wiki': 'Auf Wikipedia lesen →',
    'popup.more': 'Mehr anzeigen',
    'popup.factBlutbuche': 'Kuriosität: Rund 99% aller heutigen Blutbuchen stammen von einem einzigen Mutterbaum ab, der um 1690 im Possenwald bei Sondershausen (Thüringen) entdeckt wurde.',
    // stats.js
    'stats.title': 'Zahlen & Trends',
    'stats.lead': '<strong>{total}</strong> Bäume · ältester von <strong>{oldest}</strong> · {pct}% mit Pflanzjahr erfasst',
    'stats.perDecade': 'Pflanzungen pro Jahrzehnt',
    'stats.decade': '{decade}er',
    'stats.mostCommon': 'Häufigste Bäume',
    'stats.trendsHead': 'Trends: was kommt, was geht',
    'stats.trendsNote': 'Anteil an allen Pflanzungen {oldFrom}–{oldTo} gegenüber {newFrom}–{newTo}.',
    'stats.rising': 'Im Kommen',
    'stats.falling': 'Auf dem Rückzug',
    'stats.curiosHead': 'Kurioses & Rekorde',
    'stats.oldestLabel': 'Ältester Baum:',
    'stats.oldest': '{name}, gepflanzt {year} – über {age} Jahre alt.',
    'stats.genbankLabel': 'Lebende Obst-Genbank:',
    'stats.genbank': '{n} alte Obstsorten gibt es nur ein einziges Mal in der Stadt{ex}.',
    'stats.genbankEx': ' – etwa {list}',
    'stats.lonersLabel': 'Exoten mit Seltenheitswert:',
    'stats.loners': 'Nur je ein Exemplar in ganz Zürich – {list}.',
    'stats.diverseLabel': 'Grösste Vielfalt:',
    'stats.diverse': 'Die {name} bringt es auf {count} verschiedene Arten.',
    'stats.uniqueLabel': '{n} Einzelstücke insgesamt:',
    'stats.unique': 'So viele Arten kommen stadtweit nur ein einziges Mal vor – {fruit} alte Obstsorten (Genbank) und {others} Exoten (Einzelgänger).',
    'stats.didYouKnow': 'Wussten Sie?',
    'stats.factTop': 'ist mit {pct}% Zürichs häufigster Baum.',
    'stats.factC18': 'Zwischen 1700 und 1799 sind nur <strong>{n}</strong> Bäume datiert – systematisch erfasst wird erst seit dem 20. Jahrhundert.',
    'stats.factUlmeArticle': 'Die ',
    'stats.factUlme': 'feiert ein Comeback: {pre} vor 2000, {post} seither (vermutlich neue, gegen das Ulmensterben resistente Sorten).',
    'stats.factGoetterArticle': 'Der ',
    'stats.factGoetter': 'wird kaum noch gepflanzt: {pre} vor 2000, nur noch {post} seither – er gilt heute als invasiver Neophyt.',
    'stats.and': 'und',
    'stats.factUndated': 'haben besonders oft kein erfasstes Pflanzjahr: {crataegusPct}% bzw. {corylusPct}%, gegenüber {cityPct}% stadtweit.',
    'stats.factHeaping': 'Rund {oldPct}% der Pflanzjahre zwischen 1900 und 1999 enden auf eine 0 oder 5 (Zufallserwartung: 20%) – die meisten dürften eher geschätzt als exakt erfasst worden sein. Seit 2000 sinkt der Anteil auf {newPct}%.',
    'stats.factDiversity': 'Die Gattungsvielfalt hat sich seit 1900 stark erhöht: {early} verschiedene Gattungen wurden in den 1900er-Jahren gepflanzt, {recent} in den 2010er-Jahren.',
  },
  en: {
    'meta.title': 'Zurich Tree Map – explore every city tree interactively',
    'nav.filter': 'Filters',
    'app.title': 'Zurich Tree Map',
    'app.subtitle':
      'Every tree recorded by the City of Zurich – filter by genus, species and planting year.',
    'intro.help': 'How does this map work?',
    'intro.title': 'Welcome to the Zurich Tree Map',
    'intro.lead':
      'Here you can explore every tree recorded by the City of Zurich – here’s how to get started:',
    'intro.point1':
      'Filter by genus, species or planting year – or search for a tree directly.',
    'intro.point2':
      'Tap Collections & Rarities to explore themes like fruit trees or allergy trees.',
    'intro.point3':
      'Tap a tree on the map for its age, description and Wikipedia link.',
    'intro.cta': 'Get started',
    'facts.open': 'Did you know …?',
    'filter.heading': 'Filters',
    'filter.searchLabel': 'Search trees',
    'filter.searchPlaceholder': 'e.g. oak, olive, Acer …',
    'filter.genus': 'Genus',
    'filter.allGenera': 'All genera',
    'filter.species': 'Species',
    'filter.allSpecies': 'All species',
    'filter.year': 'Planting year',
    'filter.yearFrom': 'Planting year from',
    'filter.yearTo': 'Planting year to',
    'filter.yearUnknown': 'Only trees with unknown planting year',
    'filter.apply': 'Filter',
    'filter.reset': 'Reset',
    'collections.heading': 'Collections',
    'rarities.heading': 'Rarities & curiosities',
    'rarities.genbank': 'Living gene bank – old fruit varieties',
    'rarities.loner': 'Loners – just 1× in Zurich each',
    'curiosities.summary': 'Curiosities – exotic trees',
    'curiosities.hint': 'Tap a tree – the map takes you straight there.',
    'legend.heading': 'Tree genera',
    'legend.hint': 'Tap a genus to show only it.',
    'legend.hintCollection': 'Genera in this collection – tap one to show only it.',
    'legend.other': 'Others',
    'legend.onlyShow': 'Show only {name}',
    'legend.clear': 'Clear selection',
    'footer.source': 'Data source: City of Zurich (tree cadastre)',
    'footer.dataDate': ' · Data as of: {date}',
    'footer.nextUpdate': 'Next data check on {date}',
    'map.aria': "Interactive map of Zurich's trees",
    'geo.placeholder': 'Search a place',
    'map.attribution':
      'Tree data: <a href="https://data.stadt-zuerich.ch/dataset/geo_baumkataster" target="_blank" rel="noopener">City of Zurich (tree cadastre)</a>',
    'search.genus': 'Genus',
    'search.species': 'Species',
    'count.filtered': '{n} of {total} trees',
    'count.total': '{total} trees',
    'count.genbank': '{n} old fruit varieties – living gene bank',
    'count.loner': '{n} loners – just 1× in Zurich each',
    'new.one': '1 new tree since the last update',
    'new.many': '{n} new trees since the last update',
    'gone.one': '{n} vanished tree {year}',
    'gone.many': '{n} vanished trees {year}',
    'gone.teaser': 'Vanished trees {year}',
    'gone.teaserTitle': 'Available from December {year}',
    'gone.note':
      'Note: the {year} tally is incomplete – losses have only been tracked since mid-2026.',
    'stats.loading': 'Data still loading …',
    'stats.close': 'Close',
    // popup (helpers.js)
    'popup.unknown': 'Unknown tree',
    'popup.planted': 'Planted {year}',
    'popup.age': 'approx. {age} years old',
    'popup.yearUnknown': 'Planting year unknown',
    'popup.gone': '† Vanished {year}',
    'popup.eventLabel': 'Planted {year} – meanwhile in the world',
    'popup.eventMore': 'More from {year} →',
    'popup.wiki': 'Read on Wikipedia →',
    'popup.more': 'Show more',
    'popup.factBlutbuche': 'Fun fact: About 99% of all copper beeches alive today trace back to a single mother tree discovered around 1690 in the Possenwald forest near Sondershausen, Thuringia.',
    // stats.js
    'stats.title': 'Facts & Trends',
    'stats.lead': '<strong>{total}</strong> trees · oldest from <strong>{oldest}</strong> · {pct}% with a recorded planting year',
    'stats.perDecade': 'Plantings per decade',
    'stats.decade': '{decade}s',
    'stats.mostCommon': 'Most common trees',
    'stats.trendsHead': "Trends: what's coming, what's going",
    'stats.trendsNote': 'Share of all plantings {oldFrom}–{oldTo} versus {newFrom}–{newTo}.',
    'stats.rising': 'On the rise',
    'stats.falling': 'In retreat',
    'stats.curiosHead': 'Curiosities & records',
    'stats.oldestLabel': 'Oldest tree:',
    'stats.oldest': '{name}, planted {year} – over {age} years old.',
    'stats.genbankLabel': 'Living fruit gene bank:',
    'stats.genbank': '{n} old fruit varieties exist only once in the whole city{ex}.',
    'stats.genbankEx': ' – e.g. {list}',
    'stats.lonersLabel': 'Rare exotics:',
    'stats.loners': 'Just one specimen each in all of Zurich – {list}.',
    'stats.diverseLabel': 'Greatest diversity:',
    'stats.diverse': '{name} boasts {count} different species.',
    'stats.uniqueLabel': '{n} one-offs in total:',
    'stats.unique': 'That many species occur only once city-wide – {fruit} old fruit varieties (gene bank) and {others} exotics (loners).',
    'stats.didYouKnow': 'Did you know?',
    'stats.factTop': "is Zurich's most common tree at {pct}%.",
    'stats.factC18': 'Only <strong>{n}</strong> trees are dated between 1700 and 1799 – systematic recording began in the 20th century.',
    'stats.factUlmeArticle': '',
    'stats.factUlme': 'is making a comeback: {pre} before 2000, {post} since (probably new cultivars resistant to Dutch elm disease).',
    'stats.factGoetterArticle': '',
    'stats.factGoetter': 'is barely planted any more: {pre} before 2000, only {post} since – it is now considered an invasive neophyte.',
    'stats.and': 'and',
    'stats.factUndated': 'have an unusually high share of trees with no recorded planting year: {crataegusPct}% and {corylusPct}% respectively, versus {cityPct}% city-wide.',
    'stats.factHeaping': 'About {oldPct}% of planting years between 1900 and 1999 end in a 0 or 5 (random chance: 20%) – most were likely estimated rather than precisely recorded. Since 2000, that share has dropped to {newPct}%.',
    'stats.factDiversity': "Genus diversity has grown sharply since 1900: {early} different genera were planted in the 1900s, versus {recent} in the 2010s.",
  },
};

export function t(key, params) {
  let s = (strings[lang] && strings[lang][key]) ?? strings.de[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}

// Rewrite static markup: text nodes (data-i18n), placeholders
// (data-i18n-placeholder), titles (data-i18n-title). Also sets <html lang>.
// Runs from main.js after the DOM is parsed. German markup is the default, so
// German users see no swap; English users see a brief German→English flip.
export function applyStaticI18n() {
  document.documentElement.lang = lang;
  document.title = t('meta.title');
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll('[data-i18n-placeholder]')) {
    el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
  }
  for (const el of document.querySelectorAll('[data-i18n-title]')) {
    el.setAttribute('title', t(el.dataset.i18nTitle));
  }
  for (const el of document.querySelectorAll('[data-i18n-aria-label]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
  }
}
