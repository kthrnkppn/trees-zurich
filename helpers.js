import { genusInfo } from './genusInfo.js';
import { yearEvents } from './yearEvents.js';

const CURRENT_YEAR = new Date().getFullYear();

function googleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );

export const getPopupContent = (p) => {
  const { pflanzjahr, baumnamelat, baumnamedeu, baumgattunglat } = p;
  const info = genusInfo[baumgattunglat];

  const title = baumnamedeu || baumnamelat || 'Unbekannter Baum';
  const titleLink = baumnamedeu || baumnamelat;

  // Planting year and a friendly computed age.
  const metaParts = [];
  if (pflanzjahr) {
    metaParts.push(`Gepflanzt ${pflanzjahr}`);
    const age = CURRENT_YEAR - pflanzjahr;
    if (age >= 0 && age < 1000) metaParts.push(`ca. ${age} Jahre alt`);
  } else {
    metaParts.push('Pflanzjahr unbekannt');
  }

  const tags = (info?.tags || [])
    .map((t) => `<span class="tp-tag">${esc(t)}</span>`)
    .join('');

  // "What happened in the world the year this tree was planted."
  let eventBlock = '';
  if (pflanzjahr && yearEvents[pflanzjahr]) {
    eventBlock = `<div class="tp-event">
      <div class="tp-event-label">Gepflanzt ${pflanzjahr} – damals in der Welt</div>
      <div class="tp-event-text">${esc(yearEvents[pflanzjahr])}</div>
      <a class="tp-event-link" href="https://de.wikipedia.org/wiki/${pflanzjahr}" target="_blank" rel="noopener">Mehr aus ${pflanzjahr} &rarr;</a>
    </div>`;
  }

  return `<div class="tree-popup">
    <a class="tp-title" href="${googleSearchUrl(titleLink || title)}" target="_blank" rel="noopener">${esc(title)}</a>
    ${baumnamelat ? `<div class="tp-lat"><em>${esc(baumnamelat)}</em></div>` : ''}
    <div class="tp-meta">${metaParts.join(' · ')}</div>
    ${info?.desc ? `<p class="tp-desc">${esc(info.desc)}</p>` : ''}
    ${tags ? `<div class="tp-tags">${tags}</div>` : ''}
    ${eventBlock}
  </div>`;
};
