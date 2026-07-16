import { genusInfo } from './genusInfo.js';
import { yearEvents } from './yearEvents.js';
import { lang, t, tTag, wikiLang } from './i18n.js';

const CURRENT_YEAR = new Date().getFullYear();

// Manual overrides for the naive latin-binomial guess below, keyed by
// "genus art" exactly as it appears in the Baumkataster fields. Only needed
// per-language where the naive guess doesn't resolve on Wikipedia; a language
// missing from the override just falls through to the naive guess, since that
// edition may already have its own correct article.
//   Ziziphus jujube: the cadastre has a typo, "jujube" for "jujuba" — the
//     correct species is Ziziphus jujuba, so the naive guess has no article.
//   Diospyros virginiana, Cephalotaxus harringtonii: no German article/redirect
//     exists at all; the genus article covers each reasonably. English has its
//     own correct article at the naive title in both cases, so no EN override.
const WIKI_TITLE_OVERRIDES = {
  'Ziziphus jujube': { de: 'Chinesische Jujube', en: 'Jujube' },
  'Diospyros virginiana': { de: 'Ebenholzbäume' },
  'Cephalotaxus harringtonii': { de: 'Kopfeiben' },
};

// Best-effort Wikipedia article for the tree, in the UI language's edition. The
// latin binomial reliably redirects to the named article (e.g. "Quercus robur"
// → "Stiel-Eiche" on de, "Pedunculate oak" on en); for unspecified/hybrid
// species we fall back to the genus article.
function wikipediaUrl(p) {
  const genus = (p.baumgattunglat || '').trim();
  let art = (p.baumartlat || '').trim();
  // Strip a trailing "subsp./var./f./cv. ..." qualifier — the period is
  // required so this only matches the actual abbreviation (with a following
  // qualifier name), not species epithets that merely start with "f" (e.g.
  // "fortunei", "floribunda", which the old bare-letter alternative used to
  // eat whole).
  art = art.replace(/\(.*?\)/g, '').replace(/\s(?:subsp|var|f|cv)\.\s+.*/i, '').trim();
  const usableArt = art && !/^spec\.?$/i.test(art) && !art.startsWith('x ');
  const override = usableArt && WIKI_TITLE_OVERRIDES[`${genus} ${art}`];
  let title;
  if (override?.[wikiLang]) title = override[wikiLang];
  else if (genus && usableArt) title = `${genus} ${art}`;
  else if (genus) title = genus;
  else title = p.baumnamelat || p.baumnamedeu || '';
  return `https://${wikiLang}.wikipedia.org/wiki/` + encodeURIComponent(title.replace(/\s+/g, '_'));
}

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );

export const getPopupContent = (p) => {
  const { pflanzjahr, baumnamelat, baumnamedeu, baumgattunglat } = p;
  const info = genusInfo[baumgattunglat];

  // English mode names trees by their Latin name (we only translate the genus);
  // German mode prefers the curated German tree name.
  const title =
    (lang === 'en' ? baumnamelat || baumnamedeu : baumnamedeu || baumnamelat) ||
    t('popup.unknown');

  // Planting year and a friendly computed age.
  const metaParts = [];
  if (pflanzjahr) {
    metaParts.push(t('popup.planted', { year: pflanzjahr }));
    const age = CURRENT_YEAR - pflanzjahr;
    if (age >= 0 && age < 1000) metaParts.push(t('popup.age', { age }));
  } else {
    metaParts.push(t('popup.yearUnknown'));
  }

  const tags = (info?.tags || [])
    .map((tag) => `<span class="tp-tag">${esc(tTag(tag))}</span>`)
    .join('');

  const desc = info?.desc?.[lang] || info?.desc?.de || '';

  // "What happened in the world the year this tree was planted."
  let eventBlock = '';
  const ev = pflanzjahr && yearEvents[pflanzjahr];
  if (ev) {
    const evText = ev[lang] || ev.de;
    eventBlock = `<div class="tp-event">
      <div class="tp-event-label">${esc(t('popup.eventLabel', { year: pflanzjahr }))}</div>
      <div class="tp-event-text">${esc(evText)}</div>
      <a class="tp-event-link" href="https://${wikiLang}.wikipedia.org/wiki/${pflanzjahr}" target="_blank" rel="noopener">${esc(t('popup.eventMore', { year: pflanzjahr }))}</a>
    </div>`;
  }

  const wikiUrl = wikipediaUrl(p);

  // For a "gone" tree from the memorial layer: when it disappeared.
  const goneBlock = p.verschwunden
    ? `<div class="tp-gone">${esc(t('popup.gone', { year: String(p.verschwunden).slice(0, 4) }))}</div>`
    : '';

  return `<div class="tree-popup">
    <a class="tp-title" href="${wikiUrl}" target="_blank" rel="noopener">${esc(title)}</a>
    ${baumnamelat ? `<div class="tp-lat"><em>${esc(baumnamelat)}</em></div>` : ''}
    ${goneBlock}
    <div class="tp-meta">${metaParts.map(esc).join(' · ')}</div>
    ${desc ? `<p class="tp-desc">${esc(desc)}</p>` : ''}
    ${tags ? `<div class="tp-tags">${tags}</div>` : ''}
    <a class="tp-wiki" href="${wikiUrl}" target="_blank" rel="noopener">${esc(t('popup.wiki'))}</a>
    ${eventBlock}
  </div>`;
};
