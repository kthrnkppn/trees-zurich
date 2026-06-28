// "Zahlen & Trends" — live aus den geladenen Baumdaten berechnet, damit die
// Statistik nach jedem Daten-Update automatisch aktuell bleibt. Alle Labels auf
// Deutsch (über GenusDeNames; fällt auf den lateinischen Namen zurück, falls
// kein deutscher hinterlegt ist).

import { GenusDeNames } from './GenusDeNames.js';

const GENUS_FIELD = 'baumgattunglat';
const YEAR_FIELD = 'pflanzjahr';

// Zeitfenster für den Trend-Vergleich (Anteil damals vs. heute).
const OLD_WINDOW = [1950, 1989];
const NEW_WINDOW = [2010, new Date().getFullYear()];
const MIN_RECENT = 50; // Mindestanzahl im neuen Fenster, um als Trend zu zählen

const fmt = new Intl.NumberFormat('de-CH');
const deName = (genus) => GenusDeNames[genus] || genus;

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
    .map(([genus, count]) => ({ name: deName(genus), count, pct: (100 * count) / total }));

  // Trends: Anteil im alten vs. neuen Zeitfenster.
  const oldShare = shareByGenus(features, OLD_WINDOW);
  const newShare = shareByGenus(features, NEW_WINDOW);
  const trendRows = [];
  for (const [genus, newCount] of newShare.counts) {
    if (newCount < MIN_RECENT) continue;
    const oldPct = (100 * (oldShare.counts.get(genus) || 0)) / oldShare.total;
    const newPct = (100 * newCount) / newShare.total;
    trendRows.push({ name: deName(genus), oldPct, newPct, diff: newPct - oldPct });
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

  return {
    total, dated, oldest, newest, byDecade, topGenera, risers, fallers,
    facts: { goetterPre, goetterPost, ulmePre, ulmePost, c18, topName: topGenera[0] },
    windows: { old: OLD_WINDOW, new: NEW_WINDOW },
  };
}

/* ---------------------------------------------------------------- *
 * Rendering (reines HTML; Styles in style.css)
 * ---------------------------------------------------------------- */

function bars(items, valueOf, labelOf, countOf, kind = '') {
  const max = Math.max(...items.map(valueOf));
  return items
    .map((it) => {
      const w = max > 0 ? (100 * valueOf(it)) / max : 0;
      return `<div class="stat-bar-row">
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
      (r) => `<li class="stat-trend-item ${kind}">
        <span class="stat-trend-arrow">${arrow}</span>
        <span class="stat-trend-name">${r.name}</span>
        <span class="stat-trend-change">${r.oldPct.toFixed(1)}% → ${r.newPct.toFixed(1)}%</span>
      </li>`
    )
    .join('');
}

export function renderStatsHTML(s) {
  const pctDated = Math.round((100 * s.dated) / s.total);
  const decadeBars = bars(
    s.byDecade,
    (d) => d.count,
    (d) => `${d.decade}er`,
    (d) => fmt.format(d.count)
  );
  const generaBars = bars(
    s.topGenera,
    (g) => g.count,
    (g) => g.name,
    (g) => fmt.format(g.count)
  );

  return `
    <h2 id="stats-title" class="stats-h1">Zahlen &amp; Trends</h2>
    <p class="stats-lead">
      <strong>${fmt.format(s.total)}</strong> Bäume · ältester von
      <strong>${s.oldest}</strong> · ${pctDated}% mit Pflanzjahr erfasst
    </p>

    <section class="stats-section">
      <h3>Pflanzungen pro Jahrzehnt</h3>
      <div class="stat-bars">${decadeBars}</div>
    </section>

    <section class="stats-section">
      <h3>Häufigste Bäume</h3>
      <div class="stat-bars">${generaBars}</div>
    </section>

    <section class="stats-section">
      <h3>Trends: was kommt, was geht</h3>
      <p class="stats-note">Anteil an allen Pflanzungen ${s.windows.old[0]}–${s.windows.old[1]} gegenüber ${s.windows.new[0]}–${s.windows.new[1]}.</p>
      <div class="stats-trends">
        <div>
          <h4 class="stats-trend-head up">Im Kommen</h4>
          <ul class="stat-trend-list">${trendList(s.risers, 'up')}</ul>
        </div>
        <div>
          <h4 class="stats-trend-head down">Auf dem Rückzug</h4>
          <ul class="stat-trend-list">${trendList(s.fallers, 'down')}</ul>
        </div>
      </div>
    </section>

    <section class="stats-section stats-facts">
      <h3>Wussten Sie?</h3>
      <ul>
        <li><strong>${s.facts.topName.name}</strong> ist mit ${s.facts.topName.pct.toFixed(1)}% Zürichs häufigster Baum.</li>
        <li>Zwischen 1700 und 1799 sind nur <strong>${s.facts.c18}</strong> Bäume datiert – systematisch erfasst wird erst seit dem 20. Jahrhundert.</li>
        <li>Die <strong>Ulme</strong> feiert ein Comeback: ${fmt.format(s.facts.ulmePre)} vor 2000, ${fmt.format(s.facts.ulmePost)} seither (vermutlich neue, gegen das Ulmensterben resistente Sorten).</li>
        <li>Der <strong>Götterbaum</strong> wird kaum noch gepflanzt: ${fmt.format(s.facts.goetterPre)} vor 2000, nur noch ${fmt.format(s.facts.goetterPost)} seither – er gilt heute als invasiver Neophyt.</li>
      </ul>
    </section>
  `;
}
