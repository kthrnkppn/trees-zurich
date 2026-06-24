import { genusInfo } from './genusInfo.js';

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

  return `<div class="tree-popup">
    <a class="tp-title" href="${googleSearchUrl(titleLink || title)}" target="_blank" rel="noopener">${esc(title)}</a>
    ${baumnamelat ? `<div class="tp-lat"><em>${esc(baumnamelat)}</em></div>` : ''}
    <div class="tp-meta">${metaParts.join(' · ')}</div>
    ${info?.desc ? `<p class="tp-desc">${esc(info.desc)}</p>` : ''}
    ${tags ? `<div class="tp-tags">${tags}</div>` : ''}
  </div>`;
};
