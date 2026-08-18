// "Zahlen & Trends" — live aus den geladenen Baumdaten berechnet, damit die
// Statistik nach jedem Daten-Update automatisch aktuell bleibt. Labels sind
// zweisprachig: Gattungsnamen über genusName() (de/en, Fallback = lateinischer
// Name), Fliesstext über t().

import { trendReasons } from './trendReasons.js';
import { lang, t, genusName, numberFormat, localized } from './i18n.js';
import { GENUS_FIELD, SPECIES_FIELD, YEAR_FIELD, LATIN_NAME_FIELD, DE_NAME_FIELD } from './fields.js';

// Fruit genera — for the "living gene bank of old fruit varieties" story.
const FRUIT_GENERA = new Set(['Malus', 'Prunus', 'Pyrus', 'Cydonia', 'Juglans', 'Mespilus']);

// A clean short label: prefer the curated genus name in the active language,
// else (German only) the first part of the German tree name, else the latin genus.
function shortLabel(genus, germanName) {
  const curated = genusName(genus);
  if (curated !== genus) return curated;
  if (lang === 'de' && germanName) return germanName.split(',')[0].trim();
  return genus;
}

// Zeitfenster für den Trend-Vergleich (Anteil damals vs. heute).
const OLD_WINDOW = [1950, 1989];
const NEW_WINDOW = [2010, new Date().getFullYear()];
const MIN_RECENT = 50; // Mindestanzahl im neuen Fenster, um als Trend zu zählen

const fmt = numberFormat;

function shareByGenus(features, [lo, hi]) {
  const counts = new Map();
  let total = 0;
  for (const f of features) {
    const y = f.properties[YEAR_FIELD];
    if (typeof y !== 'number' || y < lo || y > hi) continue;
    const g = f.properties[GENUS_FIELD];
    counts.set(g, (counts.get(g) || 0) + 1);
    total++;
  }
  return { counts, total };
}

function countGenusInRange(features, genus, lo, hi) {
  let n = 0;
  for (const f of features) {
    const y = f.properties[YEAR_FIELD];
    if (typeof y === 'number' && y >= lo && y <= hi && f.properties[GENUS_FIELD] === genus) n++;
  }
  return n;
}

// Share of a genus's own trees that have no recorded planting year.
function pctUndatedInGenus(features, genus) {
  let count = 0, undated = 0;
  for (const f of features) {
    if (f.properties[GENUS_FIELD] !== genus) continue;
    count++;
    if (f.properties[YEAR_FIELD] == null) undated++;
  }
  return count ? (100 * undated) / count : 0;
}

// Share of *dated* trees in a year range whose year is a multiple of 5 — a
// classic "digit heaping" signature of estimated-then-rounded dates rather
// than precisely recorded ones (random chance would be 20%, since 2 of every
// 5 consecutive years are multiples of 5).
function pctRoundedYears(features, lo, hi) {
  let n = 0, rounded = 0;
  for (const f of features) {
    const y = f.properties[YEAR_FIELD];
    if (typeof y !== 'number' || y < lo || y > hi) continue;
    n++;
    if (y % 5 === 0) rounded++;
  }
  return n ? (100 * rounded) / n : 0;
}

// Number of distinct genera planted within a year range.
function genusDiversityInRange(features, lo, hi) {
  const genera = new Set();
  for (const f of features) {
    const y = f.properties[YEAR_FIELD];
    if (typeof y === 'number' && y >= lo && y <= hi) genera.add(f.properties[GENUS_FIELD]);
  }
  return genera.size;
}

export function computeStats(features) {
  const total = features.length;
  const years = features
    .map((f) => f.properties[YEAR_FIELD])
    .filter((y) => typeof y === 'number');
  const dated = years.length;
  const oldest = Math.min(...years);
  const newest = Math.max(...years);

  // Pflanzungen pro Jahrzehnt ab 1900.
  const decadeCounts = new Map();
  for (const y of years) {
    if (y < 1900) continue;
    const d = Math.floor(y / 10) * 10;
    decadeCounts.set(d, (decadeCounts.get(d) || 0) + 1);
  }
  const byDecade = [...decadeCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, count]) => ({ decade, count }));

  // Häufigste Gattungen insgesamt.
  const genusTotals = new Map();
  for (const f of features) {
    const g = f.properties[GENUS_FIELD];
    genusTotals.set(g, (genusTotals.get(g) || 0) + 1);
  }
  const topGenera = [...genusTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([genus, count]) => ({ genus, name: genusName(genus), count, pct: (100 * count) / total }));

  // Trends: Anteil im alten vs. neuen Zeitfenster.
  const oldShare = shareByGenus(features, OLD_WINDOW);
  const newShare = shareByGenus(features, NEW_WINDOW);
  const trendRows = [];
  for (const [genus, newCount] of newShare.counts) {
    if (newCount < MIN_RECENT) continue;
    const oldPct = (100 * (oldShare.counts.get(genus) || 0)) / oldShare.total;
    const newPct = (100 * newCount) / newShare.total;
    trendRows.push({
      genus,
      name: genusName(genus),
      oldPct,
      newPct,
      diff: newPct - oldPct,
      why: localized(trendReasons[genus]),
    });
  }
  trendRows.sort((a, b) => b.diff - a.diff);
  const risers = trendRows.slice(0, 6);
  const fallers = trendRows.slice(-6).reverse();

  // Standout-Geschichten für die "Wussten Sie?"-Box.
  const goetterPre = countGenusInRange(features, 'Ailanthus', 0, 1999);
  const goetterPost = countGenusInRange(features, 'Ailanthus', 2000, newest);
  const ulmePre = countGenusInRange(features, 'Ulmus', 0, 1999);
  const ulmePost = countGenusInRange(features, 'Ulmus', 2000, newest);
  const c18 = years.filter((y) => y >= 1700 && y <= 1799).length;
  const crataegusUndatedPct = pctUndatedInGenus(features, 'Crataegus');
  const corylusUndatedPct = pctUndatedInGenus(features, 'Corylus');
  const cityUndatedPct = (100 * (total - dated)) / total;
  const heapingOldPct = pctRoundedYears(features, 1900, 1999);
  const heapingNewPct = pctRoundedYears(features, 2000, newest);
  const genera1900s = genusDiversityInRange(features, 1900, 1909);
  const genera2010s = genusDiversityInRange(features, 2010, 2019);
  // Trees planted in the last five vintages — the count behind the
  // "planting year isn't age" fact (street trees go in as multi-year nursery
  // stock, so a recently planted tree can already look established).
  const recentPlanted = years.filter((y) => y >= newest - 4).length;

  const curiosities = computeCuriosities(features, genusTotals);

  return {
    total, dated, oldest, newest, byDecade, topGenera, risers, fallers,
    facts: {
      goetterPre, goetterPost, ulmePre, ulmePost, c18, topName: topGenera[0],
      crataegusUndatedPct, corylusUndatedPct, cityUndatedPct,
      heapingOldPct, heapingNewPct, genera1900s, genera2010s,
      recentPlanted, recentMinYear: newest - 4, recentMaxYear: newest,
    },
    curiosities,
    windows: { old: OLD_WINDOW, new: NEW_WINDOW },
  };
}

// "Kurioses & Rekorde": ältester Baum, exotische Einzelgänger, lebende
// Obst-Genbank, artenreichste Gattung.
function computeCuriosities(features, genusTotals) {
  // Ältester datierter Baum.
  let oldestFeat = null;
  for (const f of features) {
    const y = f.properties[YEAR_FIELD];
    if (typeof y !== 'number') continue;
    if (!oldestFeat || y < oldestFeat.properties[YEAR_FIELD]) oldestFeat = f;
  }
  // English mode names the oldest tree by its Latin name (genus-only translation).
  const primaryNameField = lang === 'en' ? LATIN_NAME_FIELD : DE_NAME_FIELD;
  const oldestTree = oldestFeat
    ? {
        name: (oldestFeat.properties[primaryNameField] || oldestFeat.properties[LATIN_NAME_FIELD] || '—')
          .split(',')[0]
          .replace(/\s*\([^)]*\)/g, '') // technischen Klammerzusatz entfernen
          .trim(),
        year: oldestFeat.properties[YEAR_FIELD],
        lng: oldestFeat.geometry.coordinates[0],
        lat: oldestFeat.geometry.coordinates[1],
      }
    : null;

  // Ein deutsches Beispiel pro Gattung (für die Labels der Einzelgänger).
  const germanByGenus = new Map();
  for (const f of features) {
    const g = f.properties[GENUS_FIELD];
    if (!germanByGenus.has(g) && f.properties[DE_NAME_FIELD]) {
      germanByGenus.set(g, f.properties[DE_NAME_FIELD]);
    }
  }

  // Gattungen, die es nur ein einziges Mal in ganz Zürich gibt.
  const loners = [...genusTotals.entries()]
    .filter(([, count]) => count === 1)
    .map(([genus]) => shortLabel(genus, germanByGenus.get(genus)))
    .sort((a, b) => a.localeCompare(b, 'de'));

  // Arten-Einzelstücke (voller lateinischer Name kommt nur 1× vor) und davon
  // alte Obstsorten – Zürichs lebende Genbank.
  const speciesCounts = new Map();
  for (const f of features) {
    const n = f.properties[LATIN_NAME_FIELD];
    if (n) speciesCounts.set(n, (speciesCounts.get(n) || 0) + 1);
  }
  let uniqueSpecies = 0;
  let uniqueFruit = 0;
  const fruitExamples = [];
  for (const [name, count] of speciesCounts) {
    if (count !== 1) continue;
    uniqueSpecies++;
  }
  // Zweiter Durchgang über die Features, um Beispiel-Obstsorten zu finden.
  const seenFruit = new Set();
  for (const f of features) {
    const n = f.properties[LATIN_NAME_FIELD];
    if (!n || speciesCounts.get(n) !== 1) continue;
    if (!FRUIT_GENERA.has(f.properties[GENUS_FIELD])) continue;
    uniqueFruit++;
    const m = n.match(/'([^']+)'/); // Sortenname in Anführungszeichen
    if (m && m[1].length <= 22 && !seenFruit.has(m[1]) && fruitExamples.length < 3) {
      seenFruit.add(m[1]);
      fruitExamples.push(m[1]);
    }
  }

  // Artenreichste Gattung (meiste verschiedene Arten).
  const speciesByGenus = new Map();
  for (const f of features) {
    const g = f.properties[GENUS_FIELD];
    const a = f.properties[SPECIES_FIELD];
    if (!g || !a) continue;
    if (!speciesByGenus.has(g)) speciesByGenus.set(g, new Set());
    speciesByGenus.get(g).add(a);
  }
  let mostDiverse = null;
  for (const [genus, set] of speciesByGenus) {
    if (!mostDiverse || set.size > mostDiverse.count) {
      mostDiverse = { genus, name: genusName(genus), count: set.size };
    }
  }

  return { oldestTree, loners, uniqueSpecies, uniqueFruit, fruitExamples, mostDiverse };
}

/* ---------------------------------------------------------------- *
 * Rendering (reines HTML; Styles in style.css)
 * ---------------------------------------------------------------- */

// `attrsOf(item)` may return a string of data-* attributes to make the row a
// clickable filter (handled by a delegated listener in main.js).
function bars(items, valueOf, labelOf, countOf, kind = '', attrsOf = null) {
  const max = Math.max(...items.map(valueOf));
  return items
    .map((it) => {
      const w = max > 0 ? (100 * valueOf(it)) / max : 0;
      const attrs = attrsOf ? attrsOf(it) : '';
      const cls = 'stat-bar-row' + (attrs ? ' is-clickable' : '');
      const role = attrs ? ` ${attrs} role="button" tabindex="0"` : '';
      return `<div class="${cls}"${role}>
        <span class="stat-bar-label">${labelOf(it)}</span>
        <span class="stat-bar-track"><span class="stat-bar-fill ${kind}" style="width:${w.toFixed(1)}%"></span></span>
        <span class="stat-bar-value">${countOf(it)}</span>
      </div>`;
    })
    .join('');
}

function trendList(rows, kind) {
  const arrow = kind === 'up' ? '▲' : '▼';
  return rows
    .map(
      (r) => `<li class="stat-trend-item is-clickable ${kind}" data-genus="${r.genus}" role="button" tabindex="0">
        <span class="stat-trend-arrow">${arrow}</span>
        <span class="stat-trend-name">${r.name}</span>
        <span class="stat-trend-change">${r.oldPct.toFixed(1)}% → ${r.newPct.toFixed(1)}%</span>
        ${r.why ? `<span class="stat-trend-why">${r.why}</span>` : ''}
      </li>`
    )
    .join('');
}

function renderCuriosities(c) {
  if (!c) return '';
  const cards = [];
  if (c.oldestTree) {
    const age = new Date().getFullYear() - c.oldestTree.year;
    cards.push(`<li class="is-clickable" data-lng="${c.oldestTree.lng}" data-lat="${c.oldestTree.lat}" role="button" tabindex="0">
      <span><strong>${t('stats.oldestLabel')}</strong> ${t('stats.oldest', { name: c.oldestTree.name, year: c.oldestTree.year, age })}</span></li>`);
  }
  if (c.uniqueFruit > 0) {
    const ex = c.fruitExamples.length
      ? t('stats.genbankEx', { list: c.fruitExamples.map((n) => `«${n}»`).join(lang === 'en' ? ' or ' : ' oder ') })
      : '';
    cards.push(`<li>
      <span><strong>${t('stats.genbankLabel')}</strong> ${t('stats.genbank', { n: fmt.format(c.uniqueFruit), ex })}</span></li>`);
  }
  if (c.loners.length) {
    const list = c.loners.slice(0, 7).join(', ');
    cards.push(`<li>
      <span><strong>${t('stats.lonersLabel')}</strong> ${t('stats.loners', { list })}</span></li>`);
  }
  if (c.mostDiverse) {
    cards.push(`<li class="is-clickable" data-genus="${c.mostDiverse.genus}" role="button" tabindex="0">
      <span><strong>${t('stats.diverseLabel')}</strong> ${t('stats.diverse', { name: c.mostDiverse.name, count: c.mostDiverse.count })}</span></li>`);
  }
  if (c.uniqueSpecies) {
    const others = c.uniqueSpecies - c.uniqueFruit;
    cards.push(`<li>
      <span><strong>${t('stats.uniqueLabel', { n: fmt.format(c.uniqueSpecies) })}</strong> ${t('stats.unique', { fruit: fmt.format(c.uniqueFruit), others: fmt.format(others) })}</span></li>`);
  }
  return `<section class="stats-section stats-curios">
    <h3>${t('stats.curiosHead')}</h3>
    <ul>${cards.join('')}</ul>
  </section>`;
}

export function renderStatsHTML(s) {
  const pctDated = Math.round((100 * s.dated) / s.total);
  const decadeBars = bars(
    s.byDecade,
    (d) => d.count,
    (d) => t('stats.decade', { decade: d.decade }),
    (d) => fmt.format(d.count),
    '',
    (d) => `data-year-min="${d.decade}" data-year-max="${d.decade + 9}"`
  );
  const generaBars = bars(
    s.topGenera,
    (g) => g.count,
    (g) => g.name,
    (g) => fmt.format(g.count),
    '',
    (g) => `data-genus="${g.genus}"`
  );

  return `
    <h2 id="stats-title" class="stats-h1">${t('stats.title')}</h2>
    <p class="stats-lead">
      ${t('stats.lead', { total: fmt.format(s.total), oldest: s.oldest, pct: pctDated })}
    </p>

    <section class="stats-section">
      <h3>${t('stats.perDecade')}</h3>
      <div class="stat-bars">${decadeBars}</div>
    </section>

    <section class="stats-section">
      <h3>${t('stats.mostCommon')}</h3>
      <div class="stat-bars">${generaBars}</div>
    </section>

    <section class="stats-section">
      <h3>${t('stats.trendsHead')}</h3>
      <p class="stats-note">${t('stats.trendsNote', { oldFrom: s.windows.old[0], oldTo: s.windows.old[1], newFrom: s.windows.new[0], newTo: s.windows.new[1] })}</p>
      <div class="stats-trends">
        <div>
          <h4 class="stats-trend-head up">${t('stats.rising')}</h4>
          <ul class="stat-trend-list">${trendList(s.risers, 'up')}</ul>
        </div>
        <div>
          <h4 class="stats-trend-head down">${t('stats.falling')}</h4>
          <ul class="stat-trend-list">${trendList(s.fallers, 'down')}</ul>
        </div>
      </div>
    </section>

    ${renderCuriosities(s.curiosities)}

    <section class="stats-section stats-facts">
      <h3>${t('stats.didYouKnow')}</h3>
      <ul>
        <li><strong class="stat-fact-link" data-genus="${s.facts.topName.genus}" role="button" tabindex="0">${s.facts.topName.name}</strong> ${t('stats.factTop', { pct: s.facts.topName.pct.toFixed(1) })}</li>
        <li>${t('stats.factC18', { n: s.facts.c18 })}</li>
        <li>${t('stats.factUlmeArticle')}<strong class="stat-fact-link" data-genus="Ulmus" role="button" tabindex="0">${genusName('Ulmus')}</strong> ${t('stats.factUlme', { pre: fmt.format(s.facts.ulmePre), post: fmt.format(s.facts.ulmePost) })}</li>
        <li>${t('stats.factGoetterArticle')}<strong class="stat-fact-link" data-genus="Ailanthus" role="button" tabindex="0">${genusName('Ailanthus')}</strong> ${t('stats.factGoetter', { pre: fmt.format(s.facts.goetterPre), post: fmt.format(s.facts.goetterPost) })}</li>
        <li><strong class="stat-fact-link" data-genus="Crataegus" role="button" tabindex="0">${genusName('Crataegus')}</strong> ${t('stats.and')} <strong class="stat-fact-link" data-genus="Corylus" role="button" tabindex="0">${genusName('Corylus')}</strong> ${t('stats.factUndated', { crataegusPct: s.facts.crataegusUndatedPct.toFixed(1), corylusPct: s.facts.corylusUndatedPct.toFixed(1), cityPct: s.facts.cityUndatedPct.toFixed(1) })}</li>
        <li class="is-clickable" data-year-min="1900" data-year-max="1999" role="button" tabindex="0">${t('stats.factHeaping', { oldPct: s.facts.heapingOldPct.toFixed(0), newPct: s.facts.heapingNewPct.toFixed(0) })}</li>
        <li class="is-clickable" data-year-min="2010" data-year-max="2019" role="button" tabindex="0">${t('stats.factDiversity', { early: s.facts.genera1900s, recent: s.facts.genera2010s })}</li>
        <li class="is-clickable" data-year-min="${s.facts.recentMinYear}" data-year-max="${s.facts.recentMaxYear}" role="button" tabindex="0">${t('stats.factPlantingAge', { n: fmt.format(s.facts.recentPlanted) })}</li>
      </ul>
    </section>
  `;
}
